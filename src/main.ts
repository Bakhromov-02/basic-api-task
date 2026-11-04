import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { configureApp } from './app.setup';

import { ApiBearerAuthConst } from '@common/constants';

async function bootstrap() {
  const app = configureApp(
    await NestFactory.create(AppModule, { bufferLogs: true }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('User Management API')
    .setDescription(
      'User accounts with JWT authentication and refresh token rotation',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Access token from /api/auth/login',
      },
      ApiBearerAuthConst,
    )
    .build();

  SwaggerModule.setup(
    'docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
    {
      swaggerOptions: { persistAuthorization: true },
      customSiteTitle: 'User Management API',
    },
  );

  const port = app.get(ConfigService).get<number>('API_PORT', 3000);
  await app.listen(port);
  Logger.log(`Server is running on port ${port} — docs at /docs`, 'Bootstrap');
}

bootstrap();
