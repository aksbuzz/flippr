import IORedis from 'ioredis';
import { config } from '.';
import { logger } from '../common';

const redisURL = `redis://${config.redis.host}:${config.redis.port}`;

export const redisClient = new IORedis(redisURL, { maxRetriesPerRequest: null });

redisClient.on('connect', () => {
  logger.info('Connected to Redis');
});

redisClient.on('error', err => {
  logger.error({ err }, 'Error connecting to Redis');
});

export function shutdownRedis() {
  if (redisClient.status === 'ready' || redisClient.status === 'connecting') redisClient.quit();
}
