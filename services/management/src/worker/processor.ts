import { logger } from '../common';
import { db } from '../config/database';

export async function jobProcessor(job: any) {
  const { environmentId, projectId } = job.data;

  if (job.name === 'link-new-environment') {
    logger.info(
      `Processing job ${job.id}: Linking env ${environmentId} to flags in project ${projectId}`
    );

    try {
      await db.none(
        `INSERT INTO environment_flag_states (environment_id, feature_flag_id, is_enabled)
            SELECT $1, f.id, false
            FROM feature_flags f
            WHERE f.project_id = $2
            ON CONFLICT (environment_id, feature_flag_id) DO NOTHING
            `,
        [environmentId, projectId]
      );
      logger.info(`Job ${job.id} processed successfully`);
    } catch (error) {
      logger.error(`Error processing job ${job.id}: ${(error as Error).message}`);
      throw error; // Rethrow the error
    }
  } else {
    logger.warn(`Unknown job type: ${job.name}`);
  }
}
