import { createClient } from '@redis/client';
import { config } from '.';

const redisURL = `redis://${config.redis.host}:${config.redis.port}`;

export const redisClient = createClient({ url: redisURL });

export async function initRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}

export function shutdownRedis() {
  if (redisClient.isOpen) {
    redisClient.destroy();
  }
}
