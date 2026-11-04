import { DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import { User } from '../users/entities/user.entity';
import { migrations } from '../migrations';

type Env = Record<string, string | undefined>;

const required = (env: Env, key: string): string => {
  const value = env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

/**
 * Single source of truth for the database connection, shared by the Nest app
 * and the TypeORM CLI (see data-source.ts). No path aliases here so the CLI can load it.
 */
export const buildDataSourceOptions = (
  env: Env = process.env,
): DataSourceOptions => ({
  type: 'postgres',
  host: env.TYPEORM_HOST || 'localhost',
  port: parseInt(env.TYPEORM_PORT || '5432', 10),
  username: required(env, 'TYPEORM_USERNAME'),
  password: required(env, 'TYPEORM_PASSWORD'),
  database: required(env, 'TYPEORM_DATABASE'),
  entities: [User],
  migrations,
  // Schema changes go through migrations only.
  synchronize: false,
  namingStrategy: new SnakeNamingStrategy(),
  logging: env.TYPEORM_LOGGING === 'true',
  extra: {
    max: 20,
    connectionTimeoutMillis: 5000,
  },
});
