import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogContext {
  userId?: string;
  seatId?: string;
  reservationId?: string;
  idempotencyKey?: string;
  method?: string;
  url?: string;
  duration?: number;
  statusCode?: number;
  [key: string]: any;
}

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly logLevel: string;
  private readonly isDevelopment: boolean;

  constructor(private configService: ConfigService) {
    this.logLevel =
      this.configService.get<string>('app.logLevel') ||
      process.env.LOG_LEVEL ||
      'debug';

    this.isDevelopment =
      (this.configService.get<string>('app.nodeEnv') ||
        process.env.NODE_ENV) !== 'production';
  }


  log(message: string, context?: string) {
    this.printLog(LogLevel.INFO, message, context);
  }

  error(message: string, trace?: string, context?: string) {
    this.printLog(LogLevel.ERROR, message, context, trace);
  }

  warn(message: string, context?: string) {
    this.printLog(LogLevel.WARN, message, context);
  }

  debug(message: string, context?: string) {
    this.printLog(LogLevel.DEBUG, message, context);
  }

  verbose(message: string, context?: string) {
    this.printLog(LogLevel.DEBUG, message, context);
  }

 
  logReservationAttempt(seatId: string, userId: string, idempotencyKey?: string) {
    this.printLog(
      LogLevel.INFO,
      `🎫 Reservation attempt - Seat: ${seatId} | User: ${userId}`,
      'ReservationFlow',
      undefined,
      { seatId, userId, idempotencyKey },
    );
  }


  logReservationSuccess(
    seatId: string,
    userId: string,
    reservationId: string,
    expiresAt: Date,
  ) {
    this.printLog(
      LogLevel.INFO,
      `✅ Seat reserved - Seat: ${seatId} | User: ${userId} | ReservationId: ${reservationId} | Expires: ${expiresAt.toISOString()}`,
      'ReservationFlow',
      undefined,
      { seatId, userId, reservationId, expiresAt },
    );
  }

  logReservationConflict(seatId: string, userId: string) {
    this.printLog(
      LogLevel.WARN,
      `⚠️ Seat already reserved - Seat: ${seatId} | User: ${userId}`,
      'ReservationFlow',
      undefined,
      { seatId, userId },
    );
  }


  logReservationConfirmed(reservationId: string, userId: string, seatId: string) {
    this.printLog(
      LogLevel.INFO,
      `✅ Reservation confirmed - ReservationId: ${reservationId} | User: ${userId} | Seat: ${seatId}`,
      'ReservationFlow',
      undefined,
      { reservationId, userId, seatId },
    );
  }


  logReservationExpired(reservationId: string, seatId: string) {
    this.printLog(
      LogLevel.WARN,
      `⏰ Reservation expired - ReservationId: ${reservationId} | Seat: ${seatId}`,
      'ExpirationFlow',
      undefined,
      { reservationId, seatId },
    );
  }


  logIdempotencyHit(idempotencyKey: string, userId?: string) {
    this.printLog(
      LogLevel.INFO,
      `🔑 Idempotency cache hit - Key: ${idempotencyKey}`,
      'IdempotencyFlow',
      undefined,
      { idempotencyKey, userId },
    );
  }


  logLockAcquired(lockKey: string) {
    this.printLog(
      LogLevel.DEBUG,
      `🔒 Lock acquired: ${lockKey}`,
      'DistributedLock',
      undefined,
      { lockKey },
    );
  }


  logLockFailed(lockKey: string) {
    this.printLog(
      LogLevel.WARN,
      `🔓 Lock failed: ${lockKey} - Another process is handling this request`,
      'DistributedLock',
      undefined,
      { lockKey },
    );
  }


  logConcurrencyViolation(seatId: string, attemptCount: number) {
    this.printLog(
      LogLevel.WARN,
      `⚡ Concurrency violation - Seat: ${seatId} | Attempts: ${attemptCount}`,
      'ConcurrencyControl',
      undefined,
      { seatId, attemptCount },
    );
  }


  logExpirationCleanup(expiredCount: number, freedSeats: string[]) {
    this.printLog(
      LogLevel.INFO,
      `🧹 Expiration cleanup - Expired: ${expiredCount} | Freed seats: ${freedSeats.join(', ')}`,
      'ExpirationScheduler',
      undefined,
      { expiredCount, freedSeats },
    );
  }

 
  logRequest(method: string, url: string, statusCode: number, duration: number) {
    const emoji = statusCode >= 400 ? '❌' : '✅';
    this.printLog(
      statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO,
      `${emoji} ${method} ${url} → ${statusCode} | ${duration}ms`,
      'HTTP',
      undefined,
      { method, url, statusCode, duration },
    );
  }



  private printLog(
    level: LogLevel,
    message: string,
    context?: string,
    trace?: string,
    meta?: LogContext,
  ) {
    if (!this.shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    const metaStr =
      meta && this.isDevelopment ? ` | ${JSON.stringify(meta)}` : '';

    const logLine = `${timestamp} ${level.toUpperCase()} ${contextStr} ${message}${metaStr}`;

    switch (level) {
      case LogLevel.ERROR:
        console.error(logLine);
        if (trace) console.error(trace);
        break;
      case LogLevel.WARN:
        console.warn(logLine);
        break;
      case LogLevel.DEBUG:
        console.debug(logLine);
        break;
      default:
        console.log(logLine);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [
      LogLevel.DEBUG,
      LogLevel.INFO,
      LogLevel.WARN,
      LogLevel.ERROR,
    ];

    const configuredLevel = levels.indexOf(this.logLevel as LogLevel);
    const requestedLevel = levels.indexOf(level);

    return requestedLevel >= configuredLevel;
  }
}