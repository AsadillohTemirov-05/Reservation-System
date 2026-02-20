import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import validationConfig from './config/validation.config';

import { DatabaseModule } from './database/database.module';
import { LoggerModule } from './modules/logger/logger.module';
import { LoggerMiddleware } from './modules/logger/logger.middleware';
import { SeatsModule } from './modules/seats/seats.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { IdempotencyModule } from './modules/idempotency/idempotency.module';
import { ExpirationModule } from './modules/expiration/expiration.module';
import { HealthModule } from './modules/health/health.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig, databaseConfig, redisConfig, validationConfig], // ✅ Hammasi
      cache: true,
    }),

    ScheduleModule.forRoot(),

    DatabaseModule,
    RedisModule,
    LoggerModule,

    SeatsModule,
    ReservationsModule,
    IdempotencyModule,
    ExpirationModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}