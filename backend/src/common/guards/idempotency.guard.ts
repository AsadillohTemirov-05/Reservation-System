import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class IdempotencyGuard implements CanActivate {
  private readonly logger = new Logger(IdempotencyGuard.name);

  canActivate(context: ExecutionContext): boolean { 
    const request = context.switchToHttp().getRequest<Request>();
    const idempotencyKey = request.headers['idempotency-key'];

    if (request.method !== 'POST') {
      return true;
    }

    if (!idempotencyKey) {
      this.logger.warn(
        `Missing Idempotency-Key header for ${request.method} ${request.url}`,
      );
      throw new BadRequestException(
        'Idempotency-Key header is required for POST requests',
      );
    }

    if (typeof idempotencyKey !== 'string' || idempotencyKey.trim().length === 0) {
      throw new BadRequestException('Idempotency-Key must be a non-empty string');
    }

    if (idempotencyKey.length > 255) {
      throw new BadRequestException(
        'Idempotency-Key must not exceed 255 characters',
      );
    }

    this.logger.debug(`Idempotency-Key validated: ${idempotencyKey}`);
    return true;
  }
}