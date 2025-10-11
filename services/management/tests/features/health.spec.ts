import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { app } from '../../src';
import { shutdownRedis } from '../../src/config/redis';

describe('GET /api/v1/health', () => {
  afterAll(() => {
    // gracefully close redis client after tests to allow process to exit
    shutdownRedis();
  });

  it('should return 200 OK with healthy service statuses', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('OK');
    expect(response.body.data.services).toEqual({
      database: 'OK',
      redis: 'OK',
    });
    expect(response.body.data).toHaveProperty('uptime');
    expect(response.body.data).toHaveProperty('timestamp');
  });
});
