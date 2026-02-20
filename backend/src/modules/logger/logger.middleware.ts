import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from './logger.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly loggerService: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('User-Agent') || '';
    const idempotencyKey = req.get('Idempotency-Key') || '';
    const startTime = Date.now();

    this.loggerService.debug(
      `📥 Incoming: ${method} ${originalUrl} | IP: ${ip} | Key: ${idempotencyKey || 'none'}`,
      'HTTP',
    );

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;

      this.loggerService.logRequest(method, originalUrl, statusCode, duration);
    });

    next();
  }
}