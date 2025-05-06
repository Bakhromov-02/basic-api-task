import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module';

import { HttpExceptionFilter } from '@common/filters';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
    cors: true, 
    bufferLogs: true, 
  });

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
  .setTitle('App')
  .setDescription('Api for app')
  .setVersion('1.0')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter JWT token',
      in: 'header',
    },
    'ApiBearerAuthConst', 
  )
  .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'REIS API',
  });

  app.use(helmet());
  
  app.useGlobalFilters(new HttpExceptionFilter());
  
  await app.listen(process.env.API_PORT ?? 3000, () => {
    console.log(`Server is running on port ${process.env.API_PORT ?? 3000}`);
  });
}
bootstrap();
