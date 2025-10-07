import { NotFoundError } from '../../common';
import { db } from '../../config/database';
import { redisClient } from '../../config/redis';
import { Environment } from '../../db/models/environment';
import { FeatureFlag } from '../../db/models/feature-flag';
import { FlagVariant } from '../../db/models/flag-variants';
import { CreateFlagVariant, UpdateFlagState } from './flags.types';

export class FlagsService {
  async getVariants(flagId: string) {
    return await db.manyOrNone<FlagVariant>(
      `
      SELECT id, feature_flag_id, key, value, description, created_at
      FROM feature_flag_variants
      WHERE feature_flag_id = $1
      `,
      [flagId]
    );
  }

  async createVariant(flagId: string, data: CreateFlagVariant) {
    const exists = await db.oneOrNone<FeatureFlag>(`SELECT * FROM feature_flags WHERE id = $1`, [
      flagId,
    ]);
    if (!exists) throw new NotFoundError('Flag not found');

    const newVariant = await db.one<FlagVariant>(
      `
      INSERT INTO feature_flag_variants 
        (feature_flag_id, key, value, description, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, feature_flag_id, key, value, description, created_at
      `,
      [flagId, data.key, data.value, data.description]
    );

    return newVariant;
  }

  async deleteVariant(flagId: string, variantId: string) {
    const exists = await db.oneOrNone<FeatureFlag>(`SELECT * FROM feature_flags WHERE id = $1`, [
      flagId,
    ]);
    if (!exists) throw new NotFoundError('Flag not found');

    await db.none(`DELETE FROM feature_flag_variants WHERE id = $1`, [variantId]);
  }

  async updateFlagState(flagId: string, environmentId: string, data: UpdateFlagState) {
    const _set = ['is_enabled = $1'];
    const args: any[] = [data.is_enabled];

    if (data.is_enabled) {
      _set.push(`serving_variant_id = $2`);
      args.push(data.serving_variant_id);
    }

    return db.tx(async tx => {
      const flag = await db.oneOrNone<FeatureFlag>(`SELECT * FROM feature_flags WHERE id = $1`, [
        flagId,
      ]);
      if (!flag) throw new NotFoundError('Flag not found');

      const env = await db.oneOrNone<Environment>(`SELECT * FROM environments WHERE id = $1`, [
        environmentId,
      ]);
      if (!env) throw new NotFoundError('Environment not found');

      const updated = await tx.oneOrNone(
        `UPDATE environment_flag_states efs 
        SET ` +
          _set.join(', ') +
          `
        WHERE efs.feature_flag_id = $${args.length + 1}
          AND efs.environment_id = $${args.length + 2}
        RETURNING *
        `,
        args.concat(flagId, environmentId)
      );

      if (!updated) throw new NotFoundError('Flag or environment not found');

      const evaluatedValue = await tx.oneOrNone(
        `
        SELECT
          CASE
            WHEN efs.is_enabled = TRUE THEN ffv.value
            ELSE ff.off_value
          END AS final_value
        FROM 
          feature_flags ff
        INNER JOIN environments env ON ff.project_id = env.project_id
        LEFT JOIN environment_flag_states efs ON ff.id = efs.feature_flag_id AND env.id = efs.environment_id
        LEFT JOIN feature_flag_variants ffv ON efs.serving_variant_id = ffv.id
        WHERE ff.id = $1 AND env.id = $2
        `,
        [flagId, environmentId]
      );

      if (!evaluatedValue) throw new NotFoundError('Flag or environment not found');

      const redisKey = `flag:${env.sdk_key}:${flag.key}`;
      await redisClient.set(redisKey, JSON.stringify(evaluatedValue?.final_value));

      return {
        flag_id: flagId,
        environment_id: environmentId,
        is_enabled: data.is_enabled,
        serving_variant_id: data.is_enabled ? data.serving_variant_id : null,
      };
    });
  }
}
