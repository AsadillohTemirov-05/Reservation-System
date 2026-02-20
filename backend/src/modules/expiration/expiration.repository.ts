import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession, Types } from 'mongoose';
import { Reservation, ReservationDocument } from '../reservations/schemas/reservation.schema';
import { Seat, SeatDocument } from '../seats/schemas/seat.schema';
import { ReservationStatus } from '../../common/enums/reservation-status.enum';
import { SeatStatus } from '../../common/enums/seat-status.enum';

@Injectable()
export class ExpirationRepository {
  private readonly logger = new Logger(ExpirationRepository.name);

  constructor(
    @InjectModel(Reservation.name)
    private readonly reservationModel: Model<ReservationDocument>,

    @InjectModel(Seat.name)
    private readonly seatModel: Model<SeatDocument>,
  ) {}


  async findExpiredReservations(): Promise<ReservationDocument[]> {
    try {
      return await this.reservationModel.find({
        status: ReservationStatus.PENDING,
        expiresAt: { $lt: new Date() },
      });
    } catch (error: any) {
      this.logger.error(`❌ findExpiredReservations error: ${error.message}`);
      return [];
    }
  }

  
  async bulkMarkAsExpired(
    reservationIds: Types.ObjectId[],
    session?: ClientSession,
  ): Promise<number> {
    try {
      const result = await this.reservationModel.updateMany(
        {
          _id: { $in: reservationIds },
          status: ReservationStatus.PENDING,
        },
        {
          $set: { status: ReservationStatus.EXPIRED },
        },
        { session },
      );
      return result.modifiedCount;
    } catch (error: any) {
      this.logger.error(`❌ bulkMarkAsExpired error: ${error.message}`);
      return 0;
    }
  }

 
  async bulkReleaseSeats(
    seatIds: Types.ObjectId[],
    session?: ClientSession,
  ): Promise<number> {
    try {
      const result = await this.seatModel.updateMany(
        {
          _id: { $in: seatIds },
          status: SeatStatus.RESERVED,
        },
        {
          $set: {
            status: SeatStatus.AVAILABLE,
            expiresAt: null,
            currentReservationId: null,
          },
          $inc: { version: 1 },
        },
        { session },
      );
      return result.modifiedCount;
    } catch (error: any) {
      this.logger.error(`❌ bulkReleaseSeats error: ${error.message}`);
      return 0;
    }
  }


  async countExpired(): Promise<number> {
    try {
      return await this.reservationModel.countDocuments({
        status: ReservationStatus.PENDING,
        expiresAt: { $lt: new Date() },
      });
    } catch (error: any) {
      this.logger.error(`❌ countExpired error: ${error.message}`);
      return 0;
    }
  }
}