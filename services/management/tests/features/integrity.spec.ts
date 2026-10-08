import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../../src';
import { db } from '../../src/config/database';
import { redisClient, shutdownRedis } from '../../src/config/redis';
import { rebuildAll } from '../../src/features/flags/flag-cache';
import { cleanupTestData } from '../test-helpers';

const api = (path: string) => `/api/v1${path}`;

async function createProject(name: string) {
  const res = await request(app).post(api('/projects')).send({ name });
  expect(res.status).toBe(201);
  return res.body.data.id as string;
}
async function createEnv(projectId: string, name: string) {
  const res = await request(app).post(api(`/projects/${projectId}/environments`)).send({ name });
  expect(res.status).toBe(201);
  return res.body.data as { id: string; sdk_key: string };
}
async function createFlag(projectId: string, key: string, flag_type = 'string', off_value = '"off"') {
  const res = await request(app)
    .post(api(`/projects/${projectId}/flags`))
    .send({ name: key, key, flag_type, off_value });
  expect(res.status).toBe(201);
  return res.body.data.id as string;
}
async function createVariant(flagId: string, key: string, value: string) {
  const res = await request(app).post(api(`/flags/${flagId}/variants`)).send({ key, value });
  expect(res.status).toBe(201);
  return res.body.data.id as string;
}
const toggle = (flagId: string, envId: string, body: object) =>
  request(app).patch(api(`/flags/${flagId}/environments/${envId}`)).send(body);

describe('Data integrity and cache seeding', () => {
  beforeAll(async () => {
    await cleanupTestData();
    await redisClient.flushdb();
  });

  afterAll(async () => {
    await cleanupTestData();
    await redisClient.flushdb();
    shutdownRedis();
  });

  describe('variant ownership (H3, H4)', () => {
    it('refuses to serve a variant that belongs to another flag', async () => {
      const projectId = await createProject('Ownership');
      const env = await createEnv(projectId, 'prod');
      const flagA = await createFlag(projectId, 'flag-a');
      const flagB = await createFlag(projectId, 'flag-b');
      const variantOfB = await createVariant(flagB, 'b-on', '"b"');

      const res = await toggle(flagA, env.id, { is_enabled: true, serving_variant_id: variantOfB });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/does not belong/);
      expect(await redisClient.get(`flag:${env.sdk_key}:flag-a`)).toBe('"off"');
    });

    it('enforces the same rule in the database (composite foreign key)', async () => {
      const projectId = await createProject('Ownership DB');
      const env = await createEnv(projectId, 'prod');
      const flagA = await createFlag(projectId, 'flag-a');
      const flagB = await createFlag(projectId, 'flag-b');
      const variantOfB = await createVariant(flagB, 'b-on', '"b"');

      await expect(
        db.none(
          `UPDATE environment_flag_states SET is_enabled = true, serving_variant_id = $1
           WHERE feature_flag_id = $2 AND environment_id = $3`,
          [variantOfB, flagA, env.id]
        )
      ).rejects.toMatchObject({ code: '23503' });
    });

    it('does not delete another flag variant through a different flag URL', async () => {
      const projectId = await createProject('Delete scope');
      const flagA = await createFlag(projectId, 'flag-a');
      const flagB = await createFlag(projectId, 'flag-b');
      const variantOfB = await createVariant(flagB, 'b-on', '"b"');

      const res = await request(app).delete(api(`/flags/${flagA}/variants/${variantOfB}`));
      expect(res.status).toBe(404);
      const still = await request(app).get(api(`/flags/${flagB}/variants`));
      expect(still.body.data).toHaveLength(1);
    });

    it('refuses to delete a variant that is being served', async () => {
      const projectId = await createProject('Delete in use');
      const env = await createEnv(projectId, 'prod');
      const flag = await createFlag(projectId, 'flag-a');
      const variant = await createVariant(flag, 'on', '"on"');
      await toggle(flag, env.id, { is_enabled: true, serving_variant_id: variant });

      const res = await request(app).delete(api(`/flags/${flag}/variants/${variant}`));
      expect(res.status).toBe(400);
    });

    it('rejects a variant value that does not match the flag type, and duplicate variant keys', async () => {
      const projectId = await createProject('Typed variants');
      const flag = await createFlag(projectId, 'num', 'number', '1');

      const bad = await request(app).post(api(`/flags/${flag}/variants`)).send({ key: 'x', value: '"abc"' });
      expect(bad.status).toBe(400);

      await createVariant(flag, 'ten', '10');
      const dup = await request(app).post(api(`/flags/${flag}/variants`)).send({ key: 'ten', value: '11' });
      expect(dup.status).toBe(409);
    });
  });

  describe('uniqueness and validation (H5, H9)', () => {
    it('returns 409 for a duplicate project name', async () => {
      await createProject('Dup project');
      const res = await request(app).post(api('/projects')).send({ name: 'Dup project' });
      expect(res.status).toBe(409);
    });

    it('returns 409 for a duplicate environment name in the same project, allows it in another', async () => {
      const p1 = await createProject('Env dup 1');
      const p2 = await createProject('Env dup 2');
      await createEnv(p1, 'staging');
      const dup = await request(app).post(api(`/projects/${p1}/environments`)).send({ name: 'staging' });
      expect(dup.status).toBe(409);
      await createEnv(p2, 'staging');
    });

    it('returns 409 for a duplicate flag key', async () => {
      const projectId = await createProject('Flag dup');
      await createFlag(projectId, 'same-key');
      const res = await request(app)
        .post(api(`/projects/${projectId}/flags`))
        .send({ name: 'x', key: 'same-key', flag_type: 'boolean', off_value: 'false' });
      expect(res.status).toBe(409);
    });

    it('rejects unsafe or oversized names and keys with 400, not 500', async () => {
      const projectId = await createProject('Validation');
      const post = (path: string, body: object) => request(app).post(api(path)).send(body);

      expect((await post(`/projects/${projectId}/environments`, { name: 'a:b' })).status).toBe(400);
      expect((await post(`/projects/${projectId}/environments`, { name: 'x'.repeat(300) })).status).toBe(400);
      expect((await post('/projects', { name: 'x'.repeat(300) })).status).toBe(400);
      const flag = (key: string) =>
        post(`/projects/${projectId}/flags`, { name: 'n', key, flag_type: 'boolean', off_value: 'false' });
      expect((await flag('has space')).status).toBe(400);
      expect((await flag('has:colon')).status).toBe(400);
      expect((await flag('k'.repeat(101))).status).toBe(400);
    });

    it('rejects an off_value that does not match flag_type', async () => {
      const projectId = await createProject('Typed off');
      const res = await request(app)
        .post(api(`/projects/${projectId}/flags`))
        .send({ name: 'n', key: 'n', flag_type: 'number', off_value: '"text"' });
      expect(res.status).toBe(400);
    });

    it('builds an SDK key without spaces from an environment name with spaces', async () => {
      const projectId = await createProject('Key shape');
      const env = await createEnv(projectId, 'Pre Production');
      expect(env.sdk_key).toMatch(/^Pre-Production_sdk_key_/);
    });
  });

  describe('cache seeding (B3)', () => {
    it('serves off_value as soon as a flag is created', async () => {
      const projectId = await createProject('Seed flag');
      const env = await createEnv(projectId, 'prod');
      await createFlag(projectId, 'fresh', 'number', '100');
      expect(await redisClient.get(`flag:${env.sdk_key}:fresh`)).toBe('100');
    });

    it('seeds existing flags into a newly created environment, linked synchronously', async () => {
      const projectId = await createProject('Seed env');
      const flagId = await createFlag(projectId, 'existing', 'string', '"hello"');
      const env = await createEnv(projectId, 'late-env');

      expect(await redisClient.get(`flag:${env.sdk_key}:existing`)).toBe('"hello"');
      const row = await db.oneOrNone(
        `SELECT is_enabled FROM environment_flag_states WHERE environment_id = $1 AND feature_flag_id = $2`,
        [env.id, flagId]
      );
      expect(row).toEqual({ is_enabled: false });
    });

    it('writes off_value when a flag is disabled again', async () => {
      const projectId = await createProject('Disable');
      const env = await createEnv(projectId, 'prod');
      const flag = await createFlag(projectId, 'f', 'string', '"off"');
      const variant = await createVariant(flag, 'on', '"on"');

      await toggle(flag, env.id, { is_enabled: true, serving_variant_id: variant });
      expect(await redisClient.get(`flag:${env.sdk_key}:f`)).toBe('"on"');
      const off = await toggle(flag, env.id, { is_enabled: false });
      expect(off.status).toBe(200);
      expect(off.body.data.serving_variant_id).toBe(variant);
      expect(await redisClient.get(`flag:${env.sdk_key}:f`)).toBe('"off"');
    });

    it('lets a toggle work on an environment that has no state row yet', async () => {
      const projectId = await createProject('Upsert');
      const env = await createEnv(projectId, 'prod');
      const flag = await createFlag(projectId, 'f', 'string', '"off"');
      const variant = await createVariant(flag, 'on', '"on"');
      await db.none(`DELETE FROM environment_flag_states WHERE environment_id = $1`, [env.id]);

      const res = await toggle(flag, env.id, { is_enabled: true, serving_variant_id: variant });
      expect(res.status).toBe(200);
      expect(await redisClient.get(`flag:${env.sdk_key}:f`)).toBe('"on"');
    });

    it('refuses an environment from a different project', async () => {
      const p1 = await createProject('Cross 1');
      const p2 = await createProject('Cross 2');
      const flag = await createFlag(p1, 'f');
      const foreignEnv = await createEnv(p2, 'prod');
      const res = await toggle(flag, foreignEnv.id, { is_enabled: false });
      expect(res.status).toBe(404);
    });
  });

  describe('cache rebuild (H6)', () => {
    it('restores a flushed cache and removes stale keys', async () => {
      const projectId = await createProject('Rebuild');
      const env = await createEnv(projectId, 'prod');
      const flag = await createFlag(projectId, 'f', 'string', '"off"');
      const variant = await createVariant(flag, 'on', '"on"');
      await toggle(flag, env.id, { is_enabled: true, serving_variant_id: variant });

      await redisClient.flushdb();
      await redisClient.set('flag:stale_key:ghost', 'true');
      expect(await redisClient.get(`flag:${env.sdk_key}:f`)).toBeNull();

      const result = await rebuildAll(db);

      expect(result.removed).toBeGreaterThanOrEqual(1);
      expect(await redisClient.get(`flag:${env.sdk_key}:f`)).toBe('"on"');
      expect(await redisClient.get('flag:stale_key:ghost')).toBeNull();
    });
  });
});
