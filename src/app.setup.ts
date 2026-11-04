import helmet from 'helmet';
import { INestApplication, ValidationPipe } from '@nestjs/common';

import { HttpExceptionFilter } from '@common/filters';

/** Global app configuration, shared by main.ts and the e2e tests so both run the same setup. */
export const configureApp = (app: INestApplication): INestApplication => {
  app.use(helmet());
  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: true,
    }),
  );
  app.enableShutdownHooks();
  return app;
};
