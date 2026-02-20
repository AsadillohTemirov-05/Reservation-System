import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MongoError } from 'mongodb';
import { Error as MongooseError } from 'mongoose';

@Catch(MongoError, MongooseError)
export class MongoExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(MongoExceptionFilter.name);

  catch(exception: MongoError | MongooseError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error occurred';
    let error = 'Database Error';

    if (exception instanceof MongoError) {
      switch (exception.code) {
        case 11000:
          status = HttpStatus.CONFLICT;
          message = this.extractDuplicateKeyMessage(exception);
          error = 'Conflict';
          break;

        case 64:
          status = HttpStatus.SERVICE_UNAVAILABLE;
          message = 'Database write failed, please try again';
          error = 'Service Unavailable';
          break;

        case 89:
          status = HttpStatus.GATEWAY_TIMEOUT;
          message = 'Database connection timeout';
          error = 'Gateway Timeout';
          break;

        default:
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          message = 'Database operation failed';
      }
    }

    if (exception instanceof MongooseError.ValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = this.extractValidationMessage(exception);
      error = 'Validation Error';
    }

    if (exception instanceof MongooseError.CastError) {
      status = HttpStatus.BAD_REQUEST;
      message = `Invalid ${exception.path}: ${exception.value}`;
      error = 'Bad Request';
    }

    this.logger.error(
      `MongoDB Error on ${request.method} ${request.url}: ${message}`,
      exception.stack,
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      error,
      message,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
    });
  }

  private extractDuplicateKeyMessage(exception: MongoError): string {
    const match = exception.message.match(/index: (.+?) dup key/);
    if (match) {
      return `Duplicate value for field: ${match[1]}`;
    }
    return 'Duplicate key error - resource already exists';
  }

  private extractValidationMessage(exception: MongooseError.ValidationError): string {
    const errors = Object.values(exception.errors).map((err) => err.message);
    return errors.join(', ');
  }
}