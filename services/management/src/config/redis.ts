import IORedis from 'ioredis';
import { config } from '.';
import { logger } from '../common';

export const redisClient = new IORedis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: null,
});

redisClient.on('connect', () => {
  logger.info('Connected to Redis');
});

redisClient.on('error', err => {
  logger.error({ err }, 'Error connecting to Redis');
});

export function shutdownRedis() {
  if (redisClient.status === 'ready' || redisClient.status === 'connecting') redisClient.quit();
}
