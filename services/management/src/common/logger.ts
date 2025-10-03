import { randomUUID } from 'crypto';
import pino from 'pino';
import pinoHttp from 'pino-http';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
});

const httpLogger = pinoHttp({
  logger,
  genReqId: function (req, res) {
    const existingID = req.id ?? req.headers['x-request-id'];
    if (existingID) return existingID;

    const id = randomUUID();
    res.setHeader('x-request-id', id);
    return id;
  },
});

export { logger, httpLogger };
