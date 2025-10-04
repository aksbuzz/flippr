import { Worker } from 'bullmq';
import { logger } from '../common';
import { redisClient, shutdownRedis } from '../config/redis';
import { jobProcessor } from './processor';

logger.info('Worker process starting...');

const startWorker = async () => {
  try {
    const worker = new Worker('project-tasks', jobProcessor, {
      connection: redisClient,
      concurrency: 5,
    });

    worker.on('completed', job => {
      logger.info(`Job ${job.id} completed successfully`);
    });

    worker.on('failed', (job, err) => {
      logger.error(`Job ${job?.id} failed: ${err.message}`);
    });

    logger.info('Worker is up and listening for jobs...');

    const shutdown = async () => {
      logger.info('Shutting down worker...');
      await worker.close();
      shutdownRedis();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error(`Error starting worker: ${(error as Error).message}`);
    process.exit(1);
  }
};

startWorker();