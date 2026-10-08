import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../../src';
import { db } from '../../src/config/database';
import { redisClient, shutdownRedis } from '../../src/config/redis';
import {
  cleanupTestData,
  createEnvironmentFlagState,
  createFlagVariant,
  createTestEnvironment,
  createTestFlag,
  createTestProject,
  deleteFlagVariants,
} from '../test-helpers';

describe('Flags Integration Tests', () => {
  let projectId: string;
  let environmentId: string;
  let flagId: string;

  beforeAll(async () => {
    projectId = await createTestProject();
    environmentId = await createTestEnvironment(projectId);
    flagId = await createTestFlag(projectId);
    await createEnvironmentFlagState(environmentId, flagId);
  });

  afterAll(async () => {
    await cleanupTestData();
    shutdownRedis();
  });

  describe('GET /api/v1/flags/:flagId/variants', () => {
    it('should return 200 and empty variants list for flag with no variants', async () => {
      // ACT
      const response = await request(app).get(`/api/v1/flags/${flagId}/variants`);

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });

    it('should return 200 and list of variants when flag has variants', async () => {
      // ARRANGE
      const variant1 = await createFlagVariant(flagId, 'variant-1', 'variant-1-value');
      const variant2 = await createFlagVariant(flagId, 'variant-2', 'variant-2-value');

      // ACT
      const response = await request(app).get(`/api/v1/flags/${flagId}/variants`);

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('key');
      expect(response.body.data[0]).toHaveProperty('value');
      expect(response.body.data[0]).toHaveProperty('description');
      expect(response.body.data[0]).toHaveProperty('created_at');

      // CLEANUP
      await deleteFlagVariants([variant1.id, variant2.id]);
    });
  });

  describe('POST /api/v1/flags/:flagId/variants', () => {
    it('should return 201 and create a new variant', async () => {
      // ARRANGE: variant values must match the flag type, so use a string flag
      const stringFlag = await request(app)
        .post(`/api/v1/projects/${projectId}/flags`)
        .send({ name: 'String Flag', key: 'string_flag', flag_type: 'string', off_value: '"off"' });
      const stringFlagId = stringFlag.body.data.id;

      // ACT
      const response = await request(app).post(`/api/v1/flags/${stringFlagId}/variants`).send({
        key: 'new-variant',
        value: '"new-value"',
        description: 'A new variant',
      });

      // ASSERT
      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.key).toBe('new-variant');
      expect(response.body.data.value).toBe('new-value');
      expect(response.body.data.description).toBe('A new variant');
      expect(response.body.data.feature_flag_id).toBe(stringFlagId);
    });

    it('should return 400 for invalid JSON value', async () => {
      // ARRANGE
      const newVariant = { key: 'invalid-variant', value: 'not-valid-json' };

      // ACT
      const response = await request(app).post(`/api/v1/flags/${flagId}/variants`).send(newVariant);

      // ASSERT
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for missing required fields', async () => {
      // ACT
      const response = await request(app).post(`/api/v1/flags/${flagId}/variants`).send({
        key: 'incomplete-variant',
        // missing value
      });

      // ASSERT
      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent flag', async () => {
      // ACT
      const response = await request(app)
        .post(`/api/v1/flags/00000000-0000-0000-0000-000000000000/variants`)
        .send({
          key: 'test-variant',
          value: '"test-value"',
        });

      // ASSERT
      expect(response.status).toBe(404);
    });

    it('should accept JSON values of every type on a flag of that type', async () => {
      // ARRANGE
      const testCases = [
        { type: 'boolean', value: 'true', expected: true },
        { type: 'boolean', value: 'false', expected: false },
        { type: 'number', value: '123', expected: 123 },
        { type: 'string', value: '"string"', expected: 'string' },
        { type: 'json', value: '{"key":"value"}', expected: { key: 'value' } },
        { type: 'json', value: '[1,2,3]', expected: [1, 2, 3] },
      ];
      const flagIds: Record<string, string> = {};
      for (const type of ['boolean', 'number', 'string', 'json']) {
        const offValue = { boolean: 'false', number: '0', string: '""', json: '{}' }[type];
        const created = await request(app)
          .post(`/api/v1/projects/${projectId}/flags`)
          .send({ name: `Typed ${type}`, key: `typed_${type}`, flag_type: type, off_value: offValue });
        flagIds[type] = created.body.data.id;
      }

      for (const [i, testCase] of testCases.entries()) {
        // ACT
        const response = await request(app)
          .post(`/api/v1/flags/${flagIds[testCase.type]}/variants`)
          .send({ key: `variant-${i}`, value: testCase.value });

        // ASSERT
        expect(response.status).toBe(201);
        expect(response.body.data.value).toEqual(testCase.expected);
      }
    });

    it('should return 400 when the value does not match the flag type', async () => {
      const response = await request(app)
        .post(`/api/v1/flags/${flagId}/variants`)
        .send({ key: 'wrong-type', value: '"not a boolean"' });
      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/v1/flags/:flagId/variants/:variantId', () => {
    it('should return 200 and delete variant', async () => {
      // ARRANGE
      const deleteVariant = await createFlagVariant(flagId, 'delete-variant', 'delete-value');

      // ACT
      const response = await request(app).delete(
        `/api/v1/flags/${flagId}/variants/${deleteVariant.id}`
      );

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.data.flagId).toBe(flagId);
      expect(response.body.data.variantId).toBe(deleteVariant.id);

      // Verify variant is deleted
      const variant = await db.oneOrNone(`SELECT * FROM feature_flag_variants WHERE id = $1`, [
        deleteVariant.id,
      ]);
      expect(variant).toBeNull();
    });

    it('should return 404 for non-existent flag', async () => {
      // ACT
      const response = await request(app).delete(
        `/api/v1/flags/00000000-0000-0000-0000-000000000000/variants/00000000-0000-0000-0000-000000000000`
      );

      // ASSERT
      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/flags/:flagId/environments/:environmentId', () => {
    let patchVariantId: string;

    beforeAll(async () => {
      // Create a variant for flag state tests
      const patchVariant = await createFlagVariant(flagId, 'patch-variant', 'patch-value');
      patchVariantId = patchVariant.id;
    });

    it('should enable flag and set serving variant', async () => {
      // ACT
      const response = await request(app)
        .patch(`/api/v1/flags/${flagId}/environments/${environmentId}`)
        .send({ is_enabled: true, serving_variant_id: patchVariantId });

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.data.flag_id).toBe(flagId);
      expect(response.body.data.environment_id).toBe(environmentId);
      expect(response.body.data.is_enabled).toBe(true);
      expect(response.body.data.serving_variant_id).toBe(patchVariantId);
    });

    it('should disable flag', async () => {
      // ACT
      const response = await request(app)
        .patch(`/api/v1/flags/${flagId}/environments/${environmentId}`)
        .send({ is_enabled: false });

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.data.is_enabled).toBe(false);
    });

    it('should return 400 when is_enabled is true but serving_variant_id is missing', async () => {
      // ACT
      const response = await request(app)
        .patch(`/api/v1/flags/${flagId}/environments/${environmentId}`)
        .send({
          is_enabled: true,
          // missing serving_variant_id
        });

      // ASSERT
      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid variant UUID', async () => {
      // ACT
      const response = await request(app)
        .patch(`/api/v1/flags/${flagId}/environments/${environmentId}`)
        .send({
          is_enabled: true,
          serving_variant_id: 'not-a-uuid',
        });

      // ASSERT
      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent flag', async () => {
      // ACT
      const response = await request(app)
        .patch(`/api/v1/flags/00000000-0000-0000-0000-000000000000/environments/${environmentId}`)
        .send({
          is_enabled: false,
        });

      // ASSERT
      expect(response.status).toBe(404);
    });
  });

  describe('Redis caching integration', () => {
    let cacheTestVariantId: string;

    beforeAll(async () => {
      const cacheVariant = await createFlagVariant(
        flagId,
        'cache-test-variant',
        'cache-test-value'
      );
      cacheTestVariantId = cacheVariant.id;
    });

    it('should cache flag state in Redis when updated', async () => {
      const response = await request(app)
        .patch(`/api/v1/flags/${flagId}/environments/${environmentId}`)
        .send({
          is_enabled: true,
          serving_variant_id: cacheTestVariantId,
        });

      expect(response.status).toBe(200);

      // Verify the value was cached - get environment details
      const env = await db.one(`SELECT sdk_key FROM environments WHERE id = $1`, [environmentId]);

      const flag = await db.one(`SELECT key FROM feature_flags WHERE id = $1`, [flagId]);

      const redisKey = `flag:${env.sdk_key}:${flag.key}`;
      const redisValue = await redisClient.get(redisKey);
      expect(redisValue).toEqual('"cache-test-value"');
    });
  });
});
