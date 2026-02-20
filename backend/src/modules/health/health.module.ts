import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { ExpirationModule } from '../expiration/expiration.module';

@Module({
  imports: [
    ExpirationModule,
  ],
  controllers: [HealthController],
})
export class HealthModule {}

