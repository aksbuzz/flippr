import compression from 'compression';
import cors from 'cors';
import express, { Application } from 'express';
import helmet from 'helmet';
import http from 'http';

import { httpLogger, logger } from './common';
import { config } from './config';
import { shutdownRedis } from './config/redis';
import { environmentRoutes } from './environments';
import { healthRoutes } from './health';
import { errorHandler } from './middleware';
import { projectRoutes } from './projects';

const app: Application = express();
const server = http.createServer(app);

app.use(httpLogger);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(compression());
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173'], credentials: true }));

app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/environments', environmentRoutes);

app.use(errorHandler);

const shutdown = (signal: string) => {
  logger.info(`Received ${signal}: shutting down...`);
  server.closeAllConnections();
  server.close((err?: Error) => {
    if (err) {
      logger.error(`Error closing http server: ${err.message}`);
      process.exit(1);
    }

    try {
      shutdownRedis();
      logger.info('Redis client closed');
    } catch (error) {
      logger.error(`Error closing redis client: ${(error as Error).message}`);
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
  try {
    server.listen(config.app.port, () => {
      logger.info(`Server started in ${config.app.env} mode on port ${config.app.port}`);
    });
  } catch (error) {
    logger.error(`Error starting server: ${(error as Error).message}`);
    process.exit(1);
  }
};

startServer();
