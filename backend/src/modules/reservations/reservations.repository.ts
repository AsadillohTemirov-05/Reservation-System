import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession, Types } from 'mongoose';
import { Reservation, ReservationDocument } from './schemas/reservation.schema';
import { ReservationStatus } from '../../common/enums/reservation-status.enum';
import { ReservationQueryDto } from './dto/reservation-query.dto';

@Injectable()
export class ReservationsRepository {
  private readonly logger = new Logger(ReservationsRepository.name);

  constructor(
    @InjectModel(Reservation.name)
    private readonly reservationModel: Model<ReservationDocument>,
  ) {}

  /**
   * Create new reservation
   */
  async create(
    data: {
      seatId: Types.ObjectId;
      userId: string;
      status: ReservationStatus;
      expiresAt: Date;
      idempotencyKey?: string | null;
      metadata?: Record<string, any> | null;
    },
    session?: ClientSession,
  ): Promise<ReservationDocument> {
    const reservation = new this.reservationModel(data);
    return await reservation.save({ session });
  }

  /**
   * Find by ID
   */
  async findById(id: string): Promise<ReservationDocument | null> {
    return await this.reservationModel.findById(id);
  }

  /**
   * Find by ID and userId
   */
  async findByIdAndUserId(
    id: string,
    userId: string,
  ): Promise<ReservationDocument | null> {
    return await this.reservationModel.findOne({
      _id: new Types.ObjectId(id),
      userId,
    });
  }

  /**
   * Find active reservation by seatId
   */
  async findActiveBySeatId(
    seatId: string,
  ): Promise<ReservationDocument | null> {
    return await this.reservationModel.findOne({
      seatId: new Types.ObjectId(seatId),
      status: ReservationStatus.PENDING,
    });
  }

  /**
   * ✅ Atomic confirm reservation
   */
  async atomicConfirm(
    reservationId: string,
    userId: string,
    session?: ClientSession,
  ): Promise<ReservationDocument | null> {
    return await this.reservationModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(reservationId),
        userId,
        status: ReservationStatus.PENDING,
        expiresAt: { $gt: new Date() }, // ← Expired emas
      },
      {
        $set: {
          status: ReservationStatus.CONFIRMED,
          confirmedAt: new Date(),
        },
      },
      { new: true, session },
    );
  }

  /**
   * ✅ Atomic cancel reservation
   */
  async atomicCancel(
    reservationId: string,
    userId: string,
    session?: ClientSession,
  ): Promise<ReservationDocument | null> {
    return await this.reservationModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(reservationId),
        userId,
        status: ReservationStatus.PENDING,
      },
      {
        $set: {
          status: ReservationStatus.CANCELLED,
          cancelledAt: new Date(),
        },
      },
      { new: true, session },
    );
  }

  /**
   * Mark as expired
   */
  async markAsExpired(
    reservationId: string,
    session?: ClientSession,
  ): Promise<ReservationDocument | null> {
    return await this.reservationModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(reservationId),
        status: ReservationStatus.PENDING,
      },
      {
        $set: { status: ReservationStatus.EXPIRED },
      },
      { new: true, session },
    );
  }


  async findExpiredPending(): Promise<ReservationDocument[]> {
    return await this.reservationModel.find({
      status: ReservationStatus.PENDING,
      expiresAt: { $lt: new Date() },
    });
  }


  async bulkMarkAsExpired(ids: Types.ObjectId[]): Promise<number> {
    const result = await this.reservationModel.updateMany(
      {
        _id: { $in: ids },
        status: ReservationStatus.PENDING,
      },
      {
        $set: { status: ReservationStatus.EXPIRED },
      },
    );
    return result.modifiedCount;
  }


  async findAll(query: ReservationQueryDto): Promise<{
    reservations: ReservationDocument[];
    total: number;
  }> {
    const filter: any = {};

    if (query.status) filter.status = query.status;
    if (query.userId) filter.userId = query.userId;

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [reservations, total] = await Promise.all([
      this.reservationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.reservationModel.countDocuments(filter),
    ]);

    return {
      reservations: reservations as ReservationDocument[],
      total,
    };
  }
}