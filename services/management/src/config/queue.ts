import { Queue } from 'bullmq';
import { redisClient } from './redis';

export const projectTasksQueue = new Queue('project-tasks', {
  connection: redisClient,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: true,
    removeOnFail: 50,
  },
});
