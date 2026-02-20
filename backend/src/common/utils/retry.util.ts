import { Logger } from '@nestjs/common';

const logger = new Logger('RetryUtil');

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoff?: boolean;
  onRetry?: (attempt: number, error: Error) => void;
}

export class RetryUtil {

  static async retry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {},
  ): Promise<T> {
    const {
      maxAttempts = 3,
      delayMs = 100,
      backoff = true,
      onRetry,
    } = options;

    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;

        if (attempt === maxAttempts) {
          logger.error(`❌ All ${maxAttempts} attempts failed: ${error.message}`);
          break;
        }

        const delay = backoff ? delayMs * Math.pow(2, attempt - 1) : delayMs;

        logger.warn(
          `⚠️ Attempt ${attempt}/${maxAttempts} failed: ${error.message}. Retrying in ${delay}ms...`,
        );

        if (onRetry) {
          onRetry(attempt, error);
        }

        await RetryUtil.sleep(delay);
      }
    }

    throw lastError!;
  }

 
  static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }


  static async retryOnError<T>(
    operation: () => Promise<T>,
    retryableErrors: string[],
    options: RetryOptions = {},
  ): Promise<T> {
    return RetryUtil.retry(operation, {
      ...options,
      onRetry: (attempt, error) => {
        const isRetryable = retryableErrors.some(
          (errMsg) =>
            error.message.includes(errMsg) || error.constructor.name === errMsg,
        );

        if (!isRetryable) {
          throw error;
        }
      },
    });
  }
}
