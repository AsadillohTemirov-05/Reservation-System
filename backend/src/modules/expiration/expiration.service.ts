import { Injectable, Logger } from '@nestjs/common';
import { ExpirationRepository } from './expiration.repository';
import { DatabaseService } from '../../database/database.service';
import { LoggerService } from '../logger/logger.service';
import { Types } from 'mongoose';

@Injectable()
export class ExpirationService {
  private readonly logger = new Logger(ExpirationService.name);

  constructor(
    private readonly expirationRepository: ExpirationRepository,
    private readonly databaseService: DatabaseService,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * ✅ CRITICAL: Process all expired reservations
   * Called by scheduler every 30 seconds
   */
  async processExpiredReservations(): Promise<{
    expiredCount: number;
    releasedSeats: string[];
  }> {
    try {
      // Step 1: Find all expired reservations
      const expiredReservations =
        await this.expirationRepository.findExpiredReservations();

      if (expiredReservations.length === 0) {
        this.logger.debug('✅ No expired reservations found');
        return { expiredCount: 0, releasedSeats: [] };
      }

      this.logger.log(
        `🔍 Found ${expiredReservations.length} expired reservations`,
      );

      const reservationIds = expiredReservations.map(
        (r) => r._id as Types.ObjectId,
      );

      const seatIds = expiredReservations.map(
        (r) => r.seatId as Types.ObjectId,
      );

      const releasedSeats = seatIds.map((id) => id.toString());

      // Step 3: Transaction - atomic update
      await this.databaseService.withTransaction(async (session) => {
        // Mark reservations as EXPIRED
        const expiredCount = await this.expirationRepository.bulkMarkAsExpired(
          reservationIds,
          session,
        );

        // Release seats → AVAILABLE
        const releasedCount = await this.expirationRepository.bulkReleaseSeats(
          seatIds,
          session,
        );

        this.logger.log(
          `✅ Expired: ${expiredCount} reservations | Released: ${releasedCount} seats`,
        );
      });

      // Step 4: Log cleanup
      this.loggerService.logExpirationCleanup(
        expiredReservations.length,
        releasedSeats,
      );

      // Step 5: Log each expired reservation
      expiredReservations.forEach((reservation) => {
        this.loggerService.logReservationExpired(
          (reservation._id as Types.ObjectId).toString(),
          reservation.seatId.toString(),
        );
      });

      return {
        expiredCount: expiredReservations.length,
        releasedSeats,
      };
    } catch (error: any) {
      this.logger.error(
        `❌ processExpiredReservations error: ${error.message}`,
      );
      return { expiredCount: 0, releasedSeats: [] };
    }
  }

  
  async getStats(): Promise<{ pendingExpiredCount: number }> {
    const count = await this.expirationRepository.countExpired();
    return { pendingExpiredCount: count };
  }
}