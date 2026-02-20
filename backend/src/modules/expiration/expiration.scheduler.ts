import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ExpirationService } from './expiration.service';
import { EXPIRATION_CONSTANTS } from '../../common/constants/expiration.constants';

@Injectable()
export class ExpirationScheduler implements OnModuleInit {
  private readonly logger = new Logger(ExpirationScheduler.name);
  private isRunning = false;

  constructor(private readonly expirationService: ExpirationService) {}


  async onModuleInit() {
    this.logger.log('🚀 ExpirationScheduler initialized');
    this.logger.log(
      `⏰ Cleanup interval: every ${EXPIRATION_CONSTANTS.CLEANUP_INTERVAL_SECONDS} seconds`,
    );

    await this.handleExpiredReservations();
  }


  @Cron(EXPIRATION_CONSTANTS.CLEANUP_CRON)
  async handleExpiredReservations() {
    // Prevent concurrent runs
    if (this.isRunning) {
      this.logger.debug('⚠️ Cleanup already running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      this.logger.debug('🧹 Starting expiration cleanup...');

      const { expiredCount, releasedSeats } =
        await this.expirationService.processExpiredReservations();

      const duration = Date.now() - startTime;

      if (expiredCount > 0) {
        this.logger.log(
          `✅ Cleanup done in ${duration}ms | Expired: ${expiredCount} | Released seats: ${releasedSeats.join(', ')}`,
        );
      } else {
        this.logger.debug(`✅ Cleanup done in ${duration}ms | Nothing to clean`);
      }
    } catch (error: any) {
      this.logger.error(`❌ Cleanup error: ${error.message}`);
    } finally {
      this.isRunning = false;
    }
  }
}