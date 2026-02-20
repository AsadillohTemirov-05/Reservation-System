import { Injectable, Logger } from '@nestjs/common';
import { IdempotencyRepository } from './idempotency.repository';
import { EXPIRATION_CONSTANTS } from '../../common/constants/expiration.constants';
import { DateUtil } from '../../common/utils/date.util';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);

  constructor(
    private readonly idempotencyRepository: IdempotencyRepository,
    private readonly redisService: RedisService,
  ) {}

  /**
   * ✅ CRITICAL: Get cached response by idempotency key
   * First checks Redis, then MongoDB
   */
  async getResponse(key: string): Promise<any | null> {
    try {
      // 1. Redis dan tekshir (tez)
      const redisResponse = await this.redisService.getIdempotency(key);
      if (redisResponse) {
        this.logger.debug(`✅ Idempotency hit (Redis): ${key}`);
        return redisResponse;
      }

      // 2. MongoDB dan tekshir (sekin, lekin ishonchli)
      const record = await this.idempotencyRepository.findByKey(key);
      if (record) {
        // Expired tekshir
        if (DateUtil.isExpired(record.expiresAt)) {
          this.logger.debug(`⚠️ Idempotency key expired: ${key}`);
          return null;
        }

        this.logger.debug(`✅ Idempotency hit (MongoDB): ${key}`);

        // Redis ga qayta saqlash (cache warm-up)
        await this.redisService.storeIdempotency(
          key,
          record.response,
          EXPIRATION_CONSTANTS.IDEMPOTENCY_TTL_SECONDS,
        );

        return record.response;
      }

      return null;
    } catch (error: any) {
      this.logger.error(`❌ getResponse error: ${error.message}`);
      return null;
    }
  }

  /**
   * ✅ Save idempotency response
   * Saves to both Redis and MongoDB
   */
  async saveResponse(
    key: string,
    method: string,
    path: string,
    response: any,
    statusCode: number = 200,
    userId?: string | null,
  ): Promise<void> {
    try {
      const expiresAt = DateUtil.addSeconds(
        EXPIRATION_CONSTANTS.IDEMPOTENCY_TTL_SECONDS,
      );

      // 1. Redis ga saqlash (tez access uchun)
      await this.redisService.storeIdempotency(
        key,
        response,
        EXPIRATION_CONSTANTS.IDEMPOTENCY_TTL_SECONDS,
      );

      // 2. MongoDB ga saqlash (persistent storage)
      await this.idempotencyRepository.save({
        key,
        method,
        path,
        response,
        statusCode,
        userId: userId || null,
        expiresAt,
      });

      this.logger.debug(`✅ Idempotency saved: ${key}`);
    } catch (error: any) {
      this.logger.error(`❌ saveResponse error: ${error.message}`);
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const response = await this.getResponse(key);
    return response !== null;
  }

  /**
   * Delete idempotency key (for testing)
   */
  async delete(key: string): Promise<void> {
    await Promise.all([
      this.redisService.del(`idempotency:${key}`),
      this.idempotencyRepository.deleteByKey(key),
    ]);
  }
}