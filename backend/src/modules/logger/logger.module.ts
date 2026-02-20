import { Module, Global } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { LoggerMiddleware } from './logger.middleware';

@Global()
@Module({
  providers: [LoggerService,LoggerMiddleware],
  exports: [LoggerService],
})
export class LoggerModule {}