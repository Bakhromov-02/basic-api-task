import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

import { buildDataSourceOptions } from '../../database/database.options';

export const typeOrmConfig = (config: ConfigService): TypeOrmModuleOptions => ({
  ...buildDataSourceOptions({
    TYPEORM_HOST: config.get('TYPEORM_HOST'),
    TYPEORM_PORT: config.get('TYPEORM_PORT'),
    TYPEORM_USERNAME: config.get('TYPEORM_USERNAME'),
    TYPEORM_PASSWORD: config.get('TYPEORM_PASSWORD'),
    TYPEORM_DATABASE: config.get('TYPEORM_DATABASE'),
    TYPEORM_LOGGING: config.get('TYPEORM_LOGGING'),
  }),
  // Apply pending migrations on startup so `docker compose up` gives a ready database.
  migrationsRun: true,
  retryAttempts: 3,
  retryDelay: 3000,
});
