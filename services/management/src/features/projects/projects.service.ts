import crypto from 'crypto';
import { logger } from '../../common';
import { ConflictError, NotFoundError } from '../../common/errors';
import { syncEnvironment, syncFlag } from '../flags/flag-cache';
import { db } from '../../config/database';
import { Environment } from '../../db/models/environment';
import { FeatureFlag } from '../../db/models/feature-flag';
import { Project } from '../../db/models/project';
import { CreateEnvironment, CreateFlag, CreateProject } from './projects.types';

const PG_UNIQUE_VIOLATION = '23505';

// Best-effort cache write after a commit. The row is already durable in PostgreSQL, and the
// periodic cache rebuild (ADR 0015) repairs a missed write, so this must not fail the request.
async function syncQuietly(what: string, fn: () => Promise<void>) {
  try {
    await fn();
  } catch (err) {
    logger.warn({ err }, `Could not write ${what} to Redis; the next cache rebuild will repair it`);
  }
}

interface FlagResponse extends Omit<FeatureFlag, 'description' | 'off_value'> {
  environments: { id: string; is_enabled: boolean }[];
}

export class ProjectsService {
  async createProject(data: CreateProject) {
    try {
      return await db.one<Project>(
        `INSERT INTO projects (name, created_at)
         VALUES ($1, NOW())
         RETURNING id, name, created_at`,
        [data.name]
      );
    } catch (err: any) {
      if (err.code === PG_UNIQUE_VIOLATION) {
        throw new ConflictError(`Project "${data.name}" already exists`);
      }
      throw err;
    }
  }

  async getProjects(limit: number, offset: number) {
    const [data, count] = await Promise.all([
      db.manyOrNone<Project>(
        `SELECT id, name, created_at FROM projects ORDER BY created_at ASC, id ASC LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      db.one<{ total: string }>(`SELECT COUNT(*) AS total FROM projects`),
    ]);
    return { data, total: parseInt(count.total, 10) };
  }

  async createEnvironment(projectId: string, data: CreateEnvironment) {
    const exists = await db.oneOrNone<Project>(`SELECT id FROM projects WHERE id = $1`, [
      projectId,
    ]);
    if (!exists) throw new NotFoundError('Project not found');

    // The name is validated to a safe character set; spaces would break the key, so use "-".
    const slug = data.name.replace(/\s+/g, '-');
    const sdkKey = `${slug}_sdk_key_${projectId}_${crypto.randomBytes(16).toString('hex')}`;

    // Create the environment and its state rows for every existing flag atomically.
    const newEnvironment = await db
      .tx(async tx => {
        const env = await tx.one<Environment>(
          `INSERT INTO environments (project_id, name, sdk_key)
           VALUES ($1, $2, $3)
           RETURNING id, project_id, name, sdk_key`,
          [projectId, data.name, sdkKey]
        );
        await tx.none(
          `INSERT INTO environment_flag_states (environment_id, feature_flag_id, is_enabled)
           SELECT $1, f.id, false FROM feature_flags f WHERE f.project_id = $2
           ON CONFLICT (environment_id, feature_flag_id) DO NOTHING`,
          [env.id, projectId]
        );
        return env;
      })
      .catch((err: any) => {
        if (err.code === PG_UNIQUE_VIOLATION) {
          throw new ConflictError(`Environment "${data.name}" already exists in this project`);
        }
        throw err;
      });

    await syncQuietly('environment flags', () => syncEnvironment(db, newEnvironment.id));

    return newEnvironment;
  }

  async getEnvironments(projectId: string, limit: number, offset: number) {
    const [data, count] = await Promise.all([
      db.manyOrNone<Environment>(
        `SELECT id, sdk_key, project_id, name
         FROM environments
         WHERE project_id = $1
         ORDER BY name ASC, id ASC LIMIT $2 OFFSET $3`,
        [projectId, limit, offset]
      ),
      db.one<{ total: string }>(
        `SELECT COUNT(*) AS total FROM environments WHERE project_id = $1`,
        [projectId]
      ),
    ]);
    return { data, total: parseInt(count.total, 10) };
  }

  async createFlag(projectId: string, data: CreateFlag) {
    const flag = await db
      .tx<FeatureFlag>(async tx => {
        const project = await tx.oneOrNone<Project>(`SELECT id FROM projects WHERE id = $1`, [
          projectId,
        ]);
        if (!project) throw new NotFoundError('Project not found');

        const created = await tx.one<FeatureFlag>(
          `
          INSERT INTO feature_flags
            (project_id, name, key, description, flag_type, off_value, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
          RETURNING id, project_id, name, key, description, flag_type, created_at`,
          [projectId, data.name, data.key, data.description, data.flag_type, data.off_value]
        );

        await tx.none(
          `
          INSERT INTO environment_flag_states
            (environment_id, feature_flag_id, is_enabled)
          SELECT e.id, $1, false
          FROM environments e WHERE e.project_id = $2
          `,
          [created.id, projectId]
        );

        return created;
      })
      .catch((err: any) => {
        if (err.code === PG_UNIQUE_VIOLATION) {
          throw new ConflictError(`Flag key "${data.key}" already exists in this project`);
        }
        throw err;
      });

    // Seed Redis so the flag evaluates to its off_value right away instead of null.
    await syncQuietly('flag', () => syncFlag(db, flag.id));

    return flag;
  }

  async getFlags(projectId: string, limit: number, offset: number) {
    const [count, flagRows] = await Promise.all([
      db.one<{ total: string }>(
        `SELECT COUNT(*) AS total FROM feature_flags WHERE project_id = $1`,
        [projectId]
      ),
      db.manyOrNone(
        `SELECT id FROM feature_flags WHERE project_id = $1 ORDER BY name ASC, id ASC LIMIT $2 OFFSET $3`,
        [projectId, limit, offset]
      ),
    ]);

    if (!flagRows.length) return { data: [], total: parseInt(count.total, 10) };

    const flagIds = flagRows.map(r => r.id);
    const rows = await db.manyOrNone(
      `SELECT
        f.id as flag_id,
        f.name as flag_name,
        f.key,
        f.flag_type,
        f.created_at,
        e.id as env_id,
        s.is_enabled
      FROM feature_flags f
      LEFT JOIN environment_flag_states s ON s.feature_flag_id = f.id
      LEFT JOIN environments e ON e.id = s.environment_id
      WHERE f.id IN ($1:csv)
      ORDER BY f.id, e.id`,
      [flagIds]
    );

    const grouped: Record<string, FlagResponse> = {};

    for (const row of rows) {
      if (!grouped[row.flag_id]) {
        grouped[row.flag_id] = {
          id: row.flag_id,
          project_id: projectId,
          name: row.flag_name,
          key: row.key,
          flag_type: row.flag_type,
          created_at: row.created_at,
          environments: [],
        };
      }

      if (row.env_id) {
        grouped[row.flag_id].environments.push({
          id: row.env_id,
          is_enabled: row.is_enabled,
        });
      }
    }

    // Keep the page order chosen by the paginated query above.
    const ordered = flagIds.map((id: string) => grouped[id]).filter(Boolean);
    return { data: ordered, total: parseInt(count.total, 10) };
  }

  async getFlag(projectId: string, flagId: string) {
    const flag = await db.oneOrNone<FeatureFlag>(
      `SELECT id, project_id, name, key, description, flag_type, off_value, created_at
       FROM feature_flags
       WHERE project_id = $1 AND id = $2`,
      [projectId, flagId]
    );

    if (!flag) throw new NotFoundError('Flag not found');

    const [variants, environments] = await Promise.all([
      db.manyOrNone(
        `SELECT id, key, value, description, created_at
         FROM feature_flag_variants
         WHERE feature_flag_id = $1
         ORDER BY created_at ASC`,
        [flagId]
      ),
      db.manyOrNone(
        `SELECT e.id, e.name, s.is_enabled, s.serving_variant_id, sv.key AS serving_variant_key
         FROM environments e
         LEFT JOIN environment_flag_states s ON s.environment_id = e.id AND s.feature_flag_id = $1
         LEFT JOIN feature_flag_variants sv ON sv.id = s.serving_variant_id
         WHERE e.project_id = $2
         ORDER BY e.name ASC`,
        [flagId, projectId]
      ),
    ]);

    return {
      ...flag,
      variants,
      environments: environments.map(e => ({
        ...e,
        is_enabled: e.is_enabled ?? false,
      })),
    };
  }
}
