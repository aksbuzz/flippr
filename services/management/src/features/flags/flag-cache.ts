import { IDatabase } from 'pg-promise';
import { logger } from '../../common';
import { redisClient } from '../../config/redis';

/**
 * Pushes pre-evaluated flag values to Redis (docs/adr/0003, 0004, 0015).
 *
 * Redis key: `flag:{sdk_key}:{flag_key}`, value: JSON of the final served value
 * (the serving variant's value when enabled, otherwise the flag's off_value).
 *
 * A flag with no state row for an environment (not linked yet) is served as off, so the
 * evaluation API returns the flag's off_value instead of null as soon as the flag exists.
 */

// Both `db` and a transaction (`tx`) satisfy this.
type Queryable = Pick<IDatabase<unknown>, 'manyOrNone'>;

type CacheEntry = { key: string; value: string };

const redisKey = (sdkKey: string, flagKey: string) => `flag:${sdkKey}:${flagKey}`;

const BASE_QUERY = `
  SELECT
    env.sdk_key,
    ff.key AS flag_key,
    CASE WHEN efs.is_enabled = TRUE THEN ffv.value ELSE ff.off_value END AS final_value
  FROM environments env
  JOIN feature_flags ff ON ff.project_id = env.project_id
  LEFT JOIN environment_flag_states efs
    ON efs.feature_flag_id = ff.id AND efs.environment_id = env.id
  LEFT JOIN feature_flag_variants ffv ON ffv.id = efs.serving_variant_id
`;

type Filter = { flagId?: string; environmentId?: string };

async function loadEntries(q: Queryable, filter: Filter): Promise<CacheEntry[]> {
  const where: string[] = [];
  const args: string[] = [];
  if (filter.flagId) {
    args.push(filter.flagId);
    where.push(`ff.id = $${args.length}`);
  }
  if (filter.environmentId) {
    args.push(filter.environmentId);
    where.push(`env.id = $${args.length}`);
  }

  const rows = await q.manyOrNone<{ sdk_key: string; flag_key: string; final_value: unknown }>(
    BASE_QUERY + (where.length ? ` WHERE ${where.join(' AND ')}` : ''),
    args
  );

  return rows.map(r => ({
    key: redisKey(r.sdk_key, r.flag_key),
    value: JSON.stringify(r.final_value),
  }));
}

async function writeEntries(entries: CacheEntry[]) {
  const CHUNK = 500;
  for (let i = 0; i < entries.length; i += CHUNK) {
    const pipeline = redisClient.pipeline();
    for (const { key, value } of entries.slice(i, i + CHUNK)) pipeline.set(key, value);
    const results = await pipeline.exec();
    const failed = results?.find(([err]) => err);
    if (failed) throw failed[0];
  }
}

/** Writes the current value of one flag in one environment. */
export async function syncFlagState(q: Queryable, flagId: string, environmentId: string) {
  await writeEntries(await loadEntries(q, { flagId, environmentId }));
}

/** Writes the current value of one flag in every environment of its project. */
export async function syncFlag(q: Queryable, flagId: string) {
  await writeEntries(await loadEntries(q, { flagId }));
}

/** Writes the current value of every flag in one environment. */
export async function syncEnvironment(q: Queryable, environmentId: string) {
  await writeEntries(await loadEntries(q, { environmentId }));
}

/**
 * Rebuilds the whole cache from PostgreSQL (source of truth) and removes `flag:*` keys that
 * no longer correspond to a (environment, flag) pair. Used on start-up and on a schedule so a
 * flushed, restored or diverged Redis heals itself.
 */
export async function rebuildAll(q: Queryable) {
  const entries = await loadEntries(q, {});
  await writeEntries(entries);

  const expected = new Set(entries.map(e => e.key));
  const stale: string[] = [];
  for await (const keys of redisClient.scanStream({ match: 'flag:*', count: 1000 })) {
    for (const key of keys as string[]) if (!expected.has(key)) stale.push(key);
  }
  for (let i = 0; i < stale.length; i += 500) await redisClient.del(...stale.slice(i, i + 500));

  logger.info({ written: entries.length, removed: stale.length }, 'Flag cache rebuilt');
  return { written: entries.length, removed: stale.length };
}
