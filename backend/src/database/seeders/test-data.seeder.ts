import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Seat, SeatDocument } from '../../modules/seats/schemas/seat.schema';
import {
  Reservation,
  ReservationDocument,
} from '../../modules/reservations/schemas/reservation.schema';
import { SeatStatus } from '../../common/enums/seat-status.enum';
import { ReservationStatus } from '../../common/enums/reservation-status.enum';
import { DateUtil } from '../../common/utils/date.util';

@Injectable()
export class TestDataSeeder {
  private readonly logger = new Logger(TestDataSeeder.name);

  constructor(
    @InjectModel(Seat.name)
    private readonly seatModel: Model<SeatDocument>,

    @InjectModel(Reservation.name)
    private readonly reservationModel: Model<ReservationDocument>,
  ) {}

  async seed() {
    try {
      this.logger.log('Starting test data seeder...');

      const seats = await this.seatModel.find({ status: SeatStatus.AVAILABLE }).limit(5);

      if (seats.length === 0) {
        this.logger.warn('⚠️ No available seats found. Run seat seeder first!');
        return;
      }

      const seat1 = seats[0];
      const reservation1 = await this.reservationModel.create({
        seatId: seat1._id,
        userId: 'test-user-1',
        status: ReservationStatus.PENDING,
        expiresAt: DateUtil.addMinutes(2),
        idempotencyKey: 'test-idempotency-1',
      });

      await this.seatModel.findByIdAndUpdate(seat1._id, {
        status: SeatStatus.RESERVED,
        expiresAt: DateUtil.addMinutes(2),
        currentReservationId: reservation1._id,
        $inc: { version: 1 },
      });

      // Test Scenario 2: Confirmed reservation
      const seat2 = seats[1];
      const reservation2 = await this.reservationModel.create({
        seatId: seat2._id,
        userId: 'test-user-2',
        status: ReservationStatus.CONFIRMED,
        expiresAt: DateUtil.addMinutes(2),
        confirmedAt: new Date(),
        idempotencyKey: 'test-idempotency-2',
      });

      await this.seatModel.findByIdAndUpdate(seat2._id, {
        status: SeatStatus.CONFIRMED,
        expiresAt: null,
        currentReservationId: reservation2._id,
        $inc: { version: 1 },
      });

      // Test Scenario 3: Expired reservation (expires in past)
      const seat3 = seats[2];
      const reservation3 = await this.reservationModel.create({
        seatId: seat3._id,
        userId: 'test-user-3',
        status: ReservationStatus.PENDING,
        expiresAt: DateUtil.addSeconds(-60), // 1 minute ago
        idempotencyKey: 'test-idempotency-3',
      });

      await this.seatModel.findByIdAndUpdate(seat3._id, {
        status: SeatStatus.RESERVED,
        expiresAt: DateUtil.addSeconds(-60),
        currentReservationId: reservation3._id,
        $inc: { version: 1 },
      });

      this.logger.log('✅ Test data seeded:');
      this.logger.log(`   Active reservation: ${seat1.seatNumber} (expires in 2 min)`);
      this.logger.log(`   Confirmed: ${seat2.seatNumber}`);
      this.logger.log(`   Expired: ${seat3.seatNumber} (should be cleaned by cron)`);
    } catch (error: any) {
      this.logger.error(`❌ Test data seeder failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clear test data
   */
  async clear() {
    this.logger.warn('🗑️ Clearing test data...');
    await this.reservationModel.deleteMany({
      userId: { $regex: /^test-user-/ },
    });
    this.logger.log('✅ Test data cleared');
  }
}