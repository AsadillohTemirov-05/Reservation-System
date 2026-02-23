import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { MongoExceptionFilter } from './common/filters/mongo-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    
    bufferLogs: true,
  });

  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new MongoExceptionFilter(),
  );

  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TimeoutInterceptor(90000),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.setGlobalPrefix('api');

  app.enableCors({
    origin:[
      'http://localhost:5173',
      'https://reservation-system-peach.vercel.app',
      'https://reservation-system-git-main-asadillohs-projects.vercel.app',
      'https://reservation-system-mruvg7rvn-asadillohs-projects.vercel.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
  });

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Seat Reservation System')
      .setDescription(
        `
        ## 🎯 High-Concurrency Seat Reservation API
        
        ### Features:
        - **Double booking prevention** via distributed locking
        - **Idempotency** support via Idempotency-Key header
        - **Auto expiration** - seats expire after 2 minutes
        - **Optimistic locking** for concurrency control
        
        ### Seat States:
        - **AVAILABLE** → Seat is free
        - **RESERVED** → Temporarily held (2 minutes)
        - **CONFIRMED** → Payment confirmed
        
        ### How to use Idempotency:
        Add \`Idempotency-Key\` header to POST requests to prevent duplicate reservations.
        `,
      )
      .setVersion('1.0')
      .addTag('seats', 'Seat management and reservation')
      .addTag('reservations', 'Reservation confirmation and cancellation')
      .addTag('health', 'System health check')
      .addApiKey(
        {
          type: 'apiKey',
          name: 'Idempotency-Key',
          in: 'header',
          description: 'Unique key to prevent duplicate requests',
        },
        'Idempotency-Key',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: 'list',
        filter: true,
        showExtensions: true,
        tagsSorter: 'alpha',
      },
      customSiteTitle: 'Seat Reservation API Docs',
    });

    logger.log(`✅ Swagger: http://localhost:${process.env.PORT || 3000}/api/docs`);
  }

  app.enableShutdownHooks();

  const port = process.env.PORT || 3000;
  await app.listen(port,'0.0.0.0');

  logger.log(`✅ App running on: http://localhost:${port}`);
  logger.log(`✅ API: http://localhost:${port}/api`);
}

bootstrap();