import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';

declare global {
  // eslint-disable-next-line no-var
  var __POSTGRES_CONTAINER__: StartedPostgreSqlContainer | undefined;
}

/** Starts one real PostgreSQL container for the whole test run. Requires Docker. */
export default async function globalSetup() {
  const container = await new PostgreSqlContainer('postgres:17.4-alpine')
    .withDatabase('test')
    .withUsername('test')
    .withPassword('test')
    .start();

  // Test workers are started after this and inherit these variables.
  Object.assign(process.env, {
    NODE_ENV: 'test',
    TYPEORM_HOST: container.getHost(),
    TYPEORM_PORT: String(container.getPort()),
    TYPEORM_USERNAME: container.getUsername(),
    TYPEORM_PASSWORD: container.getPassword(),
    TYPEORM_DATABASE: container.getDatabase(),
    JWT_ACCESS_SECRET: 'test-access-secret',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    JWT_ACCESS_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '7d',
  });

  globalThis.__POSTGRES_CONTAINER__ = container;
}
