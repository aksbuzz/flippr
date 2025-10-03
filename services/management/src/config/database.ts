import pgPromise from 'pg-promise';
import { config } from '.';

const pgp = pgPromise({});
const cn = {
  host: config.postgres.host,
  port: config.postgres.port,
  user: config.postgres.user,
  password: config.postgres.password,
  database: config.postgres.database,
  ssl: config.postgres.ssl ? { rejectUnauthorized: false } : undefined,
};

export const db = pgp(cn);
