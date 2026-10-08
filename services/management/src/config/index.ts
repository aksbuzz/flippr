import dotenv from 'dotenv';

dotenv.config();

const splitList = (value: string | undefined, fallback: string[]) =>
  value ? value.split(',').map(v => v.trim()).filter(Boolean) : fallback;

export const config = {
  app: {
    port: process.env.PORT || 4000,
    env: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
    corsOrigins: splitList(process.env.CORS_ORIGINS, [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost',
    ]),
  },
  auth: {
    // Static admin token for the management API. When empty, auth is disabled (dev/test only);
    // production refuses to start without it. See docs/adr/0014.
    adminToken: process.env.ADMIN_API_TOKEN || '',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  postgres: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DATABASE || 'postgres',
    ssl: process.env.POSTGRES_SSL === 'true',
  },
};
