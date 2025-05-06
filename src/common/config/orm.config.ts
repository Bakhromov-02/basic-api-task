import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

export const typeOrmConfig = async (
  config: ConfigService,
): Promise<TypeOrmModuleOptions> => {
  return {
    type: config.getOrThrow<'postgres'>('TYPEORM_CONNECTION'),
    username: config.getOrThrow<string>('TYPEORM_USERNAME'),
    password: config.getOrThrow<string>('TYPEORM_PASSWORD'),
    database: config.getOrThrow<string>('TYPEORM_DATABASE'),
    entities: [join(__dirname, '..', 'dist/**/*.entity{.ts,.js}')],
    synchronize: true, //TODO use migration instead
    autoLoadEntities: true,
    logging: process.env.NODE_ENV !== 'production',
    host: config.getOrThrow<string>('TYPEORM_DATABASE') || '127.0.0.1', // Use 'localhost' if running outside of Docker
    port: config.getOrThrow<number>('TYPEORM_PORT'),
    url: `postgres://${config.getOrThrow<string>(
      'TYPEORM_USERNAME',
    )}:${config.getOrThrow<string>(
      'TYPEORM_PASSWORD',
    )}@db:5432/${config.getOrThrow<string>('TYPEORM_DATABASE')}`,
    namingStrategy: new SnakeNamingStrategy(),
    extra: {
      max: 20, // Connection pool size
      connectionTimeoutMillis: 5000, // How long to wait for connection
    },
    retryAttempts: 3,
    retryDelay: 3000,
  };
};
