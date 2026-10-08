import { Worker } from 'bullmq';
import { logger } from '../common';
import { db } from '../config/database';
import { projectTasksQueue } from '../config/queue';
import { redisClient, shutdownRedis } from '../config/redis';
import { rebuildAll } from '../features/flags/flag-cache';
import { jobProcessor, RECONCILE_JOB } from './processor';

logger.info('Worker process starting...');

const RECONCILE_EVERY_MS = parseInt(process.env.CACHE_RECONCILE_INTERVAL_MS || '300000', 10);

const startWorker = async () => {
  try {
    const worker = new Worker('project-tasks', jobProcessor, {
      connection: redisClient,
      concurrency: 5,
    });

    worker.on('completed', job => {
      logger.info(`Job ${job.id} (${job.name}) completed successfully`);
    });

    worker.on('failed', (job, err) => {
      logger.error(`Job ${job?.id} (${job?.name}) failed: ${err.message}`);
    });

    // Repopulate Redis from PostgreSQL now (covers a flushed cache) and then on a schedule.
    await rebuildAll(db).catch(err => logger.error({ err }, 'Initial cache rebuild failed'));
    await projectTasksQueue.upsertJobScheduler(
      RECONCILE_JOB,
      { every: RECONCILE_EVERY_MS },
      { name: RECONCILE_JOB, opts: { attempts: 1, removeOnComplete: true, removeOnFail: 20 } }
    );

    logger.info('Worker is up and listening for jobs...');

    const shutdown = async () => {
      logger.info('Shutting down worker...');
      await worker.close();
      await projectTasksQueue.close();
      await db.$pool.end();
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
