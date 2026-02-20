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
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    if (request.method !== 'POST') {
      return next.handle();
    }

    const idempotencyKey = request.headers['idempotency-key'] as string;

    if (!idempotencyKey) {
      return next.handle();
    }

    (request as any).idempotencyKey = idempotencyKey;

    this.logger.debug(`🔑 Processing request with Idempotency-Key: ${idempotencyKey}`);

    return next.handle().pipe(
      tap({
        next: (data) => {
          response.setHeader('Idempotency-Key', idempotencyKey);
          response.setHeader('X-Idempotency-Replayed', 'false');

          this.logger.debug(`✅ Response cached for Idempotency-Key: ${idempotencyKey}`);
        },
        error: (error) => {
          this.logger.error(
            `Error for Idempotency-Key ${idempotencyKey}: ${error.message}`,
          );
        },
      }),
    );
  }
}