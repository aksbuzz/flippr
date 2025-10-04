import { NotFoundError } from '../common';
import { db } from '../config/database';
import { redisClient } from '../config/redis';

type ToggleFlagDB = {
  id: string;
  project_id: string;
  environment_id: string;
  sdk_key: string;
  key: string;
  is_enabled: boolean;
}

type ToggleFlagResponse = Omit<ToggleFlagDB, 'sdk_key'>

export class EnvironmentService {
  async toggleFlag(
    environmentId: string,
    flagKey: string,
    is_enabled: boolean
  ): Promise<ToggleFlagResponse> {
    return db.tx<ToggleFlagResponse>(async tx => {
      const updated = await tx.oneOrNone<ToggleFlagDB>(
        `
        UPDATE environment_flag_states efs
        SET is_enabled = $3
        FROM feature_flags ff, environments e
        WHERE efs.feature_flag_id = ff.id
          AND efs.environment_id = e.id
          AND ff.key = $2
          AND e.id = $1
        RETURNING efs.id, ff.project_id, e.id AS environment_id, e.sdk_key, ff.key, efs.is_enabled
        `,
        [environmentId, flagKey, is_enabled]
      );

      if (!updated) {
        throw new NotFoundError('Flag or environment not found');
      }

      const redisKey = `flag:${updated.sdk_key}:${updated.key}`;
      await redisClient.set(redisKey, String(updated.is_enabled));

      const { sdk_key, ...response } = updated;

      return response;
    });
  }
}
