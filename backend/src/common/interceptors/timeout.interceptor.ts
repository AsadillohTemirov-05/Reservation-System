import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
  Logger,
} from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TimeoutInterceptor.name);
  private readonly timeoutMs: number;

  constructor(timeoutMs: number = 30000) {
    this.timeoutMs = timeoutMs;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      timeout(this.timeoutMs),
      catchError((error) => {
        if (error instanceof TimeoutError) {
          this.logger.error(
            `⏰ Request timeout after ${this.timeoutMs}ms: ${request.method} ${request.url}`,
          );
          return throwError(
            () => new RequestTimeoutException(
              `Request timeout after ${this.timeoutMs}ms`,
            ),
          );
        }
        return throwError(() => error);
      }),
    );
  }
}