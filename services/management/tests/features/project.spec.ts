import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { app } from '../../src';
import { db } from '../../src/config/database';
import { shutdownRedis } from '../../src/config/redis';
import { cleanupTestData, createFlagVariant } from '../test-helpers';

describe('Project Integration Tests', () => {
  let projectId: string;
  let environmentId: string;
  let flagId: string;

  afterAll(async () => {
    await cleanupTestData();
    shutdownRedis();
  });

  describe('POST /api/v1/projects', () => {
    it('should create a new project', async () => {
      // ACT
      const response = await request(app).post('/api/v1/projects').send({
        name: 'Integration Test Project',
      });

      // ASSERT
      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe('Integration Test Project');
      expect(response.body.data).toHaveProperty('created_at');

      projectId = response.body.data.id;
    });

    it('should return 400 for missing project name', async () => {
      const response = await request(app).post('/api/v1/projects').send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for empty project name', async () => {
      const response = await request(app).post('/api/v1/projects').send({
        name: '',
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/projects', () => {
    it('should return list of all projects', async () => {
      // ACT
      const response = await request(app).get('/api/v1/projects');

      // ASSERT
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      const project = response.body.data.find((p: any) => p.id === projectId);
      expect(project).toBeDefined();
      expect(project.name).toBe('Integration Test Project');
    });

    // ACT
    it('should return empty list when no projects exist', async () => {
      // Clean up projects
      await cleanupTestData();

      const response = await request(app).get('/api/v1/projects');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);

      // Recreate test project
      const createResponse = await request(app)
        .post('/api/v1/projects')
        .send({ name: 'Recreated Test Project' });

      projectId = createResponse.body.data.id;
    });
  });

  describe('POST /api/v1/projects/:projectId/environments', () => {
    it('should create a new environment for a project', async () => {
      const response = await request(app).post(`/api/v1/projects/${projectId}/environments`).send({
        name: 'development',
      });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe('development');
      expect(response.body.data).toHaveProperty('sdk_key');
      expect(response.body.data.project_id).toBe(projectId);
      expect(response.body.data.sdk_key).toMatch(/^development_sdk_key_/);

      environmentId = response.body.data.id;
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .post(`/api/v1/projects/00000000-0000-0000-0000-000000000000/environments`)
        .send({
          name: 'staging',
        });

      expect(response.status).toBe(404);
    });

    it('should generate unique SDK keys for different environments', async () => {
      const env1Response = await request(app)
        .post(`/api/v1/projects/${projectId}/environments`)
        .send({ name: 'production' });

      const env2Response = await request(app)
        .post(`/api/v1/projects/${projectId}/environments`)
        .send({ name: 'staging' });

      expect(env1Response.status).toBe(201);
      expect(env2Response.status).toBe(201);

      const sdkKey1 = env1Response.body.data.sdk_key;
      const sdkKey2 = env2Response.body.data.sdk_key;

      expect(sdkKey1).not.toBe(sdkKey2);
      expect(sdkKey1).toContain(projectId);
      expect(sdkKey2).toContain(projectId);
    });
  });

  describe('GET /api/v1/projects/:projectId/environments', () => {
    it('should return all environments for a project', async () => {
      const response = await request(app).get(`/api/v1/projects/${projectId}/environments`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      const env = response.body.data.find((e: any) => e.id === environmentId);
      expect(env).toBeDefined();
      expect(env.name).toBe('development');
      expect(env).toHaveProperty('sdk_key');
    });

    it('should return empty list for project with no environments', async () => {
      // Create a new project
      const projectResponse = await request(app)
        .post('/api/v1/projects')
        .send({ name: 'Project Without Environments' });

      const newProjectId = projectResponse.body.data.id;

      const response = await request(app).get(`/api/v1/projects/${newProjectId}/environments`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app).get(
        `/api/v1/projects/00000000-0000-0000-0000-000000000000/environments`
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('POST /api/v1/projects/:projectId/flags', () => {
    it('should create a new feature flag', async () => {
      console.log(projectId);
      const response = await request(app).post(`/api/v1/projects/${projectId}/flags`).send({
        name: 'New Feature',
        key: 'new_feature',
        description: 'A new feature flag',
        flag_type: 'boolean',
        off_value: 'false',
      });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.key).toBe('new_feature');
      expect(response.body.data.project_id).toBe(projectId);
      expect(response.body.data).toHaveProperty('created_at');

      flagId = response.body.data.id;
    });

    it('should create flag for all existing environments', async () => {
      const flagResponse = await request(app).post(`/api/v1/projects/${projectId}/flags`).send({
        name: 'Multi Env Flag',
        key: 'multi_env_flag',
        off_value: 'false',
      });

      expect(flagResponse.status).toBe(201);
      const newFlagId = flagResponse.body.data.id;

      // Verify flag states exist for all environments
      const states = await db.manyOrNone(
        `SELECT * FROM environment_flag_states WHERE feature_flag_id = $1`,
        [newFlagId]
      );

      expect(states.length).toBeGreaterThan(0);
      states.forEach((state: any) => {
        expect(state.is_enabled).toBe(false);
      });
    });

    it('should return 400 for missing required fields', async () => {
      const testCases = [
        { name: 'No key', body: { name: 'Flag', off_value: 'false' } },
        { name: 'No name', body: { key: 'flag', off_value: 'false' } },
        { name: 'No off_value', body: { name: 'Flag', key: 'flag' } },
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .post(`/api/v1/projects/${projectId}/flags`)
          .send(testCase.body);

        expect(response.status).toBe(400);
      }
    });

    it('should return 400 for invalid off_value JSON', async () => {
      const response = await request(app).post(`/api/v1/projects/${projectId}/flags`).send({
        name: 'Invalid Flag',
        key: 'invalid_flag',
        off_value: 'not-json',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for invalid flag_type', async () => {
      const response = await request(app).post(`/api/v1/projects/${projectId}/flags`).send({
        name: 'Invalid Type Flag',
        key: 'invalid_type_flag',
        flag_type: 'invalid_type',
        off_value: 'false',
      });

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .post(`/api/v1/projects/00000000-0000-0000-0000-000000000000/flags`)
        .send({
          name: 'Flag',
          key: 'flag',
          off_value: 'false',
        });

      expect(response.status).toBe(404);
    });

    it('should support different flag types', async () => {
      const flagTypes = [
        { type: 'boolean', value: 'false' },
        { type: 'string', value: '"off"' },
        { type: 'number', value: '0' },
        { type: 'json', value: '{"key": "value"}' },
      ];

      for (const flagType of flagTypes) {
        const key = `${flagType.type}_flag_${Date.now()}`;
        const response = await request(app)
          .post(`/api/v1/projects/${projectId}/flags`)
          .send({
            name: `${flagType.type} flag`,
            key,
            flag_type: flagType.type,
            off_value: flagType.value,
          });

        expect(response.status).toBe(201);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.key).toBe(key);
        expect(response.body.data.project_id).toBe(projectId);
        expect(response.body.data).toHaveProperty('created_at');
      }
    });
  });

  describe('GET /api/v1/projects/:projectId/flags', () => {
    it('should return all flags for a project', async () => {
      const response = await request(app).get(`/api/v1/projects/${projectId}/flags`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      const flag = response.body.data.find((f: any) => f.id === flagId);
      expect(flag).toBeDefined();
      expect(flag.name).toBe('New Feature');
      expect(flag.key).toBe('new_feature');
    });

    it('should include environments info in flag response', async () => {
      const response = await request(app).get(`/api/v1/projects/${projectId}/flags`);

      expect(response.status).toBe(200);
      const flag = response.body.data.find((f: any) => f.id === flagId);

      expect(flag.environments).toBeDefined();
      expect(Array.isArray(flag.environments)).toBe(true);
      expect(flag.environments.length).toBeGreaterThan(0);

      flag.environments.forEach((env: any) => {
        expect(env).toHaveProperty('id');
        expect(env).toHaveProperty('is_enabled');
      });
    });

    it('should return empty list for project with no flags', async () => {
      const projectResponse = await request(app)
        .post('/api/v1/projects')
        .send({ name: 'Project Without Flags' });

      const newProjectId = projectResponse.body.data.id;

      const response = await request(app).get(`/api/v1/projects/${newProjectId}/flags`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('GET /api/v1/projects/:projectId/flags/:flagId', () => {
    it('should return detailed flag information', async () => {
      const response = await request(app).get(`/api/v1/projects/${projectId}/flags/${flagId}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(flagId);
      expect(response.body.data.name).toBe('New Feature');
      expect(response.body.data.key).toBe('new_feature');
      expect(response.body.data).toHaveProperty('flag_type');
      expect(response.body.data).toHaveProperty('off_value');
      expect(response.body.data).toHaveProperty('created_at');
    });

    it('should include variants in flag details', async () => {
      // Create a variant first
      await createFlagVariant(flagId, 'test-variant', 'test-value');

      const response = await request(app).get(`/api/v1/projects/${projectId}/flags/${flagId}`);

      expect(response.status).toBe(200);
      expect(response.body.data.variants).toBeDefined();
      expect(Array.isArray(response.body.data.variants)).toBe(true);
      expect(response.body.data.variants.length).toBeGreaterThan(0);

      const variant = response.body.data.variants[0];
      expect(variant).toHaveProperty('id');
      expect(variant).toHaveProperty('key');
      expect(variant).toHaveProperty('value');
    });

    it('should include environments in flag details', async () => {
      const response = await request(app).get(`/api/v1/projects/${projectId}/flags/${flagId}`);

      expect(response.status).toBe(200);
      expect(response.body.data.environments).toBeDefined();
      expect(Array.isArray(response.body.data.environments)).toBe(true);

      response.body.data.environments.forEach((env: any) => {
        expect(env).toHaveProperty('id');
        expect(env).toHaveProperty('name');
        expect(env).toHaveProperty('is_enabled');
        expect(env).toHaveProperty('serving_variant_id');
        expect(env).toHaveProperty('serving_variant_key');
      });
    });

    it('should return 404 for non-existent flag', async () => {
      const response = await request(app).get(
        `/api/v1/projects/${projectId}/flags/00000000-0000-0000-0000-000000000000`
      );

      expect(response.status).toBe(404);
    });

    it('should return 404 for flag in different project', async () => {
      // Create another project
      const projectResponse = await request(app)
        .post('/api/v1/projects')
        .send({ name: 'Other Project' });

      const otherProjectId = projectResponse.body.data.id;

      // Try to access flag from different project
      const response = await request(app).get(`/api/v1/projects/${otherProjectId}/flags/${flagId}`);

      expect(response.status).toBe(404);
    });

    it('should handle flags with no variants', async () => {
      const flagResponse = await request(app).post(`/api/v1/projects/${projectId}/flags`).send({
        name: 'No Variants Flag',
        key: 'no_variants_flag',
        off_value: 'false',
      });

      const noVariantsFlagId = flagResponse.body.data.id;

      const response = await request(app).get(
        `/api/v1/projects/${projectId}/flags/${noVariantsFlagId}`
      );

      expect(response.status).toBe(200);
      expect(response.body.data.variants).toEqual([]);
    });
  });
});
