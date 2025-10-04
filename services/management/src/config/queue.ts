import { Queue } from 'bullmq';
import { redisClient } from './redis';

export const projectTasksQueue = new Queue('project-tasks', { connection: redisClient});
