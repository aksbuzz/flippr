import express from 'express';
import { okResponse } from '../../common';
import { db } from '../../config/database';
import { redisClient } from '../../config/redis';

const router = express.Router();

type HealthStatus = 'OK' | 'ERROR';

router.get('/', async (_, res) => {
  const timestamp = new Date().toISOString();
  const uptime = process.uptime();

  const [dbRes, redisRes] = await Promise.allSettled([db.query('SELECT 1'), redisClient.connect()]);
  const services: { database: HealthStatus; redis: HealthStatus } = {
    database: dbRes.status === 'fulfilled' ? 'OK' : 'ERROR',
    redis: redisRes.status === 'fulfilled' ? 'OK' : 'ERROR',
  };

  const status = services.database === 'OK' && services.redis === 'OK' ? 'OK' : 'ERROR';

  return res.status(200).json(okResponse({ status, uptime, timestamp, services }));
});

export default router;
