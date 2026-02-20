import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession, Types } from 'mongoose';
import { Seat, SeatDocument } from './schemas/seat.schema';
import { SeatStatus } from '../../common/enums/seat-status.enum';
import { SeatQueryDto } from './dto/seat-query.dto';

@Injectable()
export class SeatsRepository {
  private readonly logger = new Logger(SeatsRepository.name);

  constructor(
    @InjectModel(Seat.name)
    private readonly seatModel: Model<SeatDocument>,
  ) {}

  /**
   * ✅ CRITICAL: Atomic reserve operation
   * Optimistic locking ishlatadi - race condition oldini oladi
   */
  async atomicReserve(
    seatId: string,
    reservationId: Types.ObjectId,
    expiresAt: Date,
    session?: ClientSession,
  ): Promise<SeatDocument | null> {
    const seat = await this.seatModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(seatId),
        status: SeatStatus.AVAILABLE, // ← Faqat AVAILABLE bo'lsa
      },
      {
        $set: {
          status: SeatStatus.RESERVED,
          expiresAt,
          currentReservationId: reservationId,
        },
        $inc: { version: 1 }, // ← Optimistic locking
      },
      {
        new: true,
        session,
      },
    );

    if (!seat) {
      this.logger.warn(
        `❌ Atomic reserve failed - Seat: ${seatId} (not available or not found)`,
      );
    }

    return seat;
  }


  async updateReservationId(
  seatId: string,
  reservationId: Types.ObjectId,
  session?: ClientSession,
): Promise<void> {
  await this.seatModel.findByIdAndUpdate(
    seatId,
    {
      $set: {
        currentReservationId: reservationId,
      },
    },
    { session },
  );
}
  /**
   * ✅ CRITICAL: Atomic confirm operation
   */
  async atomicConfirm(
    seatId: string,
    session?: ClientSession,
  ): Promise<SeatDocument | null> {
    return await this.seatModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(seatId),
        status: SeatStatus.RESERVED, // ← Faqat RESERVED bo'lsa
      },
      {
        $set: {
          status: SeatStatus.CONFIRMED,
          expiresAt: null,
        },
        $inc: { version: 1 },
      },
      {
        new: true,
        session,
      },
    );
  }

  /**
   * ✅ Release seat back to AVAILABLE (expiration)
   */
  async releaseToAvailable(
    seatId: string,
    session?: ClientSession,
  ): Promise<SeatDocument | null> {
    return await this.seatModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(seatId),
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
      {
        new: true,
        session,
      },
    );
  }

  /**
   * Find seat by ID
   */
  async findById(seatId: string): Promise<SeatDocument | null> {
    return await this.seatModel.findById(seatId);
  }

  /**
   * Find seat by number
   */
  async findBySeatNumber(seatNumber: string): Promise<SeatDocument | null> {
    return await this.seatModel.findOne({
      seatNumber: seatNumber.toUpperCase(),
      isActive: true,
    });
  }

  /**
   * Find all seats with filters
   */
  async findAll(query: SeatQueryDto): Promise<{
    seats: SeatDocument[];
    total: number;
  }> {
    const filter: any = { isActive: true };

    if (query.status) filter.status = query.status;
    if (query.row) filter.row = query.row.toUpperCase();
    if (query.section) filter.section = query.section;

    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const [seats, total] = await Promise.all([
      this.seatModel
        .find(filter)
        .sort({ seatNumber: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.seatModel.countDocuments(filter),
    ]);

    return { seats: seats as SeatDocument[], total };
  }

  /**
   * Find expired reserved seats
   */
  async findExpiredSeats(): Promise<SeatDocument[]> {
    return await this.seatModel.find({
      status: SeatStatus.RESERVED,
      expiresAt: { $lt: new Date() },
      isActive: true,
    });
  }

  /**
   * Create new seat
   */
  async create(data: Partial<Seat>): Promise<SeatDocument> {
    const seat = new this.seatModel(data);
    return await seat.save();
  }

  /**
   * Bulk create seats
   */
  async bulkCreate(seats: Partial<Seat>[]): Promise<SeatDocument[]> {
    return await this.seatModel.insertMany(seats) as SeatDocument[];
  }

  /**
   * Count by status
   */
  async countByStatus(): Promise<Record<SeatStatus, number>> {
    const result = await this.seatModel.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const counts = {
      [SeatStatus.AVAILABLE]: 0,
      [SeatStatus.RESERVED]: 0,
      [SeatStatus.CONFIRMED]: 0,
    };

    result.forEach((item) => {
      counts[item._id as SeatStatus] = item.count;
    });

    return counts;
  }
}