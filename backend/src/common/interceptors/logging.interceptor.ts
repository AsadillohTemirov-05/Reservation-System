import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { method, url, body, headers } = request;
    const startTime = Date.now();

    this.logger.log(
      `📥 ${method} ${url} | Body: ${JSON.stringify(body)} | Idempotency-Key: ${headers['idempotency-key'] || 'none'}`,
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          this.logger.log(
            `${method} ${url} → ${statusCode} | ${duration}ms`,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;

          this.logger.error(
            `❌ ${method} ${url} → ERROR | ${duration}ms | ${error.message}`,
          );
        },
      }),
    );
  }
}