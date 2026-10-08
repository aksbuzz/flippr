import { BadRequestError, ConflictError, NotFoundError } from '../../common';
import { db } from '../../config/database';
import { Environment } from '../../db/models/environment';
import { FeatureFlag } from '../../db/models/feature-flag';
import { FlagVariant } from '../../db/models/flag-variants';
import { checkValueMatchesType } from './flag-values';
import { syncFlagState } from './flag-cache';
import { CreateFlagVariant, UpdateFlagState } from './flags.types';

const PG_UNIQUE_VIOLATION = '23505';
const PG_FOREIGN_KEY_VIOLATION = '23503';

export class FlagsService {
  async getVariants(flagId: string) {
    return await db.manyOrNone<FlagVariant>(
      `
      SELECT id, feature_flag_id, key, value, description, created_at
      FROM feature_flag_variants
      WHERE feature_flag_id = $1
      ORDER BY created_at ASC, id ASC
      `,
      [flagId]
    );
  }

  async createVariant(flagId: string, data: CreateFlagVariant) {
    const flag = await db.oneOrNone<Pick<FeatureFlag, 'id' | 'flag_type'>>(
      `SELECT id, flag_type FROM feature_flags WHERE id = $1`,
      [flagId]
    );
    if (!flag) throw new NotFoundError('Flag not found');

    const typeError = checkValueMatchesType(flag.flag_type, data.value);
    if (typeError) throw new BadRequestError(`${typeError} (flag type is "${flag.flag_type}")`);

    try {
      return await db.one<FlagVariant>(
        `
        INSERT INTO feature_flag_variants
          (feature_flag_id, key, value, description, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id, feature_flag_id, key, value, description, created_at
        `,
        [flagId, data.key, data.value, data.description]
      );
    } catch (err: any) {
      if (err.code === PG_UNIQUE_VIOLATION) {
        throw new ConflictError(`Variant "${data.key}" already exists for this flag`);
      }
      throw err;
    }
  }

  async deleteVariant(flagId: string, variantId: string) {
    const flag = await db.oneOrNone(`SELECT id FROM feature_flags WHERE id = $1`, [flagId]);
    if (!flag) throw new NotFoundError('Flag not found');

    // Scoped to the flag, and atomic: a concurrent toggle that starts serving this variant makes
    // the delete fail on the foreign key instead of racing a separate "in use" check.
    try {
      const deleted = await db.oneOrNone(
        `DELETE FROM feature_flag_variants WHERE id = $1 AND feature_flag_id = $2 RETURNING id`,
        [variantId, flagId]
      );
      if (!deleted) throw new NotFoundError('Variant not found');
    } catch (err: any) {
      if (err.code === PG_FOREIGN_KEY_VIOLATION) {
        throw new BadRequestError('Cannot delete variant that is currently being served');
      }
      throw err;
    }
  }

  /**
   * Turns a flag on or off in one environment.
   *
   * Runs in one transaction: the upsert takes a row lock, so concurrent toggles of the same
   * (flag, environment) are serialised, and the Redis write below happens in commit order.
   * If the Redis write fails the whole change rolls back. The rare case where Redis succeeds and
   * the commit then fails is healed by the periodic cache rebuild (see flag-cache.ts, ADR 0015).
   */
  async updateFlagState(flagId: string, environmentId: string, data: UpdateFlagState) {
    return db.tx(async tx => {
      const flag = await tx.oneOrNone<Pick<FeatureFlag, 'id' | 'project_id'>>(
        `SELECT id, project_id FROM feature_flags WHERE id = $1`,
        [flagId]
      );
      if (!flag) throw new NotFoundError('Flag not found');

      const env = await tx.oneOrNone<Pick<Environment, 'id' | 'project_id'>>(
        `SELECT id, project_id FROM environments WHERE id = $1`,
        [environmentId]
      );
      if (!env || env.project_id !== flag.project_id) {
        throw new NotFoundError('Environment not found');
      }

      if (data.is_enabled) {
        const variant = await tx.oneOrNone(
          `SELECT id FROM feature_flag_variants WHERE id = $1 AND feature_flag_id = $2`,
          [data.serving_variant_id, flagId]
        );
        if (!variant) throw new BadRequestError('serving_variant_id does not belong to this flag');
      }

      // Upsert: an environment that the worker has not linked yet works immediately.
      // When disabling, the previously served variant is kept.
      const state = await tx.one(
        `
        INSERT INTO environment_flag_states
          (environment_id, feature_flag_id, is_enabled, serving_variant_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (environment_id, feature_flag_id) DO UPDATE
          SET is_enabled = EXCLUDED.is_enabled,
              serving_variant_id = COALESCE(
                EXCLUDED.serving_variant_id,
                environment_flag_states.serving_variant_id
              )
        RETURNING is_enabled, serving_variant_id
        `,
        [environmentId, flagId, data.is_enabled, data.is_enabled ? data.serving_variant_id : null]
      );

      await syncFlagState(tx, flagId, environmentId);

      return {
        flag_id: flagId,
        environment_id: environmentId,
        is_enabled: state.is_enabled,
        serving_variant_id: state.serving_variant_id,
      };
    });
  }
}
