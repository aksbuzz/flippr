import compression from 'compression';
import cors from 'cors';
import express, { Application } from 'express';
import helmet from 'helmet';
import http from 'http';

import { httpLogger, logger } from './common';
import { config } from './config';
import { db } from './config/database';
import { shutdownRedis } from './config/redis';
import { flagsRoutes } from './features/flags';
import { healthRoutes } from './features/health';
import { errorHandler, requireAdminToken } from './middleware';
import { projectRoutes } from './features/projects';

export const app: Application = express();
const server = http.createServer(app);

app.use(httpLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: config.app.corsOrigins,
  })
);

app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/projects', requireAdminToken, projectRoutes);
app.use('/api/v1/flags', requireAdminToken, flagsRoutes);

app.use(errorHandler);

const shutdown = (signal: string) => {
  logger.info(`Received ${signal}: shutting down...`);
  server.closeAllConnections();
  server.close(async (err?: Error) => {
    if (err) {
      logger.error(`Error closing http server: ${err.message}`);
      process.exit(1);
    }

    try {
      await db.$pool.end();
      shutdownRedis();
      logger.info('Database pool and Redis client closed');
    } catch (error) {
      logger.error(`Error during shutdown: ${(error as Error).message}`);
      process.exit(1);
    }

    logger.info('Http server closed');
    process.exit(0);
  });
};

['SIGINT', 'SIGTERM'].forEach(signal => {
  process.on(signal, () => {
    shutdown(signal);
  });
});

const startServer = async () => {
  if (config.app.env === 'production' && !config.auth.adminToken) {
    logger.error('ADMIN_API_TOKEN must be set when NODE_ENV=production; refusing to start');
    process.exit(1);
  }
  if (!config.auth.adminToken) {
    logger.warn('ADMIN_API_TOKEN is not set: the management API is UNAUTHENTICATED (dev only)');
  }

  try {
    server.listen(config.app.port, () => {
      logger.info(`Server started in ${config.app.env} mode on port ${config.app.port}`);
    });
  } catch (error) {
    logger.error(`Error starting server: ${(error as Error).message}`);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
