import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer, type StartedRedisContainer } from '@testcontainers/redis';
import path from 'path';

let postgresContainer: StartedPostgreSqlContainer;
let redisContainer: StartedRedisContainer;

export async function setup() {
  console.log('Setting up test containers...');

  [postgresContainer, redisContainer] = await Promise.all([
    new PostgreSqlContainer('postgres:17-alpine').withDatabase('flippr_db-test').start(),
    new RedisContainer('redis:7-alpine').withExposedPorts(6379).start(),
  ]);

  process.env.POSTGRES_HOST = postgresContainer.getHost();
  process.env.POSTGRES_PORT = String(postgresContainer.getPort());
  process.env.POSTGRES_USER = postgresContainer.getUsername();
  process.env.POSTGRES_PASSWORD = postgresContainer.getPassword();
  process.env.POSTGRES_DATABASE = postgresContainer.getDatabase();

  process.env.REDIS_HOST = redisContainer.getHost();
  process.env.REDIS_PORT = String(redisContainer.getMappedPort(6379));

  console.log('Test containers are up and running.');

  const dbSchemaFile = path.join(__dirname, '../../../../', 'init.sql');
  await postgresContainer.copyFilesToContainer([{ source: dbSchemaFile, target: '/tmp/init.sql' }]);
  await postgresContainer.exec([
    'psql',
    '-U',
    postgresContainer.getUsername(),
    '-d',
    postgresContainer.getDatabase(),
    '-f',
    '/tmp/init.sql',
  ]);
}

export async function teardown() {
  console.log('Tearing down test containers...');
  await Promise.all([postgresContainer.stop(), redisContainer.stop()]);
  console.log('Test containers are down.');
}
