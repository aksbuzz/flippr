import { Job } from 'bullmq';
import { logger } from '../common';
import { db } from '../config/database';
import { rebuildAll, syncEnvironment } from '../features/flags/flag-cache';

export const RECONCILE_JOB = 'reconcile-flag-cache';
export const LINK_ENVIRONMENT_JOB = 'link-new-environment';

export async function jobProcessor(job: Job) {
  if (job.name === RECONCILE_JOB) {
    // Rebuild Redis from PostgreSQL so a flushed or diverged cache heals itself (ADR 0015).
    await rebuildAll(db);
    return;
  }

  if (job.name === LINK_ENVIRONMENT_JOB) {
    // Environments are now linked inline when they are created (ADR 0016). This handler stays
    // so jobs enqueued by older versions still complete.
    const { environmentId, projectId } = job.data;
    logger.info(`Processing job ${job.id}: Linking env ${environmentId} to flags in project ${projectId}`);

    await db.none(
      `
      INSERT INTO environment_flag_states
        (environment_id, feature_flag_id, is_enabled)
      SELECT $1, f.id, false
      FROM feature_flags f
      WHERE f.project_id = $2
      ON CONFLICT (environment_id, feature_flag_id) DO NOTHING
      `,
      [environmentId, projectId]
    );
    await syncEnvironment(db, environmentId);
    return;
  }

  logger.warn(`Unknown job type: ${job.name}`);
}
