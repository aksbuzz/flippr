import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../../src';
import { config } from '../../src/config';
import { shutdownRedis } from '../../src/config/redis';
import { cleanupTestData } from '../test-helpers';

describe('Admin token authentication', () => {
  const token = 'test-admin-token-123';

  beforeAll(() => {
    config.auth.adminToken = token;
  });

  afterAll(async () => {
    config.auth.adminToken = '';
    await cleanupTestData();
    shutdownRedis();
  });

  it('rejects requests without a token', async () => {
    const res = await request(app).get('/api/v1/projects');
    expect(res.status).toBe(401);
    expect(res.body.status).toBe('ERROR');
  });

  it('rejects a wrong token, a wrong scheme and an empty bearer', async () => {
    const get = (header: string) => request(app).get('/api/v1/projects').set('Authorization', header);
    expect((await get('Bearer nope')).status).toBe(401);
    expect((await get(token)).status).toBe(401);
    expect((await get('Bearer ')).status).toBe(401);
  });

  it('accepts the correct token on projects and flags routes', async () => {
    const ok = await request(app).get('/api/v1/projects').set('Authorization', `Bearer ${token}`);
    expect(ok.status).toBe(200);

    const flags = await request(app)
      .get('/api/v1/flags/00000000-0000-0000-0000-000000000000/variants')
      .set('Authorization', `Bearer ${token}`);
    expect(flags.status).toBe(200);
  });

  it('protects write routes too', async () => {
    const res = await request(app).post('/api/v1/projects').send({ name: 'Nope' });
    expect(res.status).toBe(401);
  });

  it('leaves the health endpoint open', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
  });
});
