import { NotFoundError } from '../common';
import { db } from '../config/database';
import { redisClient } from '../config/redis';

interface ToggleFlagResponse {
  id: number;
  env_id: number;
  sdk_key: string;
  key: string;
  is_enabled: boolean;
}

export class EnvironmentService {
  async toggleFlag(environmentId: number, flagKey: string, is_enabled: boolean) {
    return db.tx<ToggleFlagResponse>(async tx => {
      const updated = await tx.oneOrNone<ToggleFlagResponse>(
        `
        UPDATE environment_flag_states efs
        SET is_enabled = $3
        FROM feature_flags ff, environments e
        WHERE efs.feature_flag_id = ff.id
          AND efs.environment_id = e.id
          AND ff.key = $2
          AND e.id = $1
        RETURNING efs.id, e.id AS env_id, e.sdk_key, ff.key, efs.is_enabled
        `,
        [environmentId, flagKey, is_enabled]
      );

      if (!updated) {
        throw new NotFoundError('Flag or environment not found');
      }

      const redisKey = `flag:${updated.sdk_key}:${updated.key}`;
      await redisClient.set(redisKey, String(updated.is_enabled));

      return updated;
    });
  }
}
