import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { SeatsRepository } from './seats.repository';
import { ReservationsRepository } from '../reservations/reservations.repository';
import { DatabaseService } from '../../database/database.service';
import { LoggerService } from '../logger/logger.service';
import { IdempotencyService } from '../idempotency/idempotency.service';
import { CreateSeatDto } from './dto/create-seat.dto';
import { ReserveSeatDto } from './dto/reserve-seat.dto';
import { SeatQueryDto } from './dto/seat-query.dto';
import { SeatResponseDto } from './dto/seat-response.dto';
import { ResponseUtil } from '../../common/utils/response.util';
import { DateUtil } from '../../common/utils/date.util';
import { EXPIRATION_CONSTANTS } from '../../common/constants/expiration.constants';
import { ERROR_MESSAGES } from '../../common/constants/error-messages.constants';
import { SeatStatus } from '../../common/enums/seat-status.enum';
import { ReservationStatus } from '../../common/enums/reservation-status.enum';
import { Types } from 'mongoose';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class SeatsService {
  private readonly logger = new Logger(SeatsService.name);

  constructor(
    private readonly seatsRepository: SeatsRepository,
    private readonly reservationsRepository: ReservationsRepository,
    private readonly redisService: RedisService,
    private readonly databaseService: DatabaseService,
    private readonly loggerService: LoggerService,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  /**
   * ✅ CRITICAL: Reserve a seat
   * Handles: concurrency, idempotency, distributed locking
   */
  async reserveSeat(dto: ReserveSeatDto, idempotencyKey?: string) {
    const { seatId, userId } = dto;

    // Step 1: Check idempotency
    if (idempotencyKey) {
      const cached = await this.idempotencyService.getResponse(idempotencyKey);
      if (cached) {
        this.loggerService.logIdempotencyHit(idempotencyKey, userId);
        return cached;
      }
    }

    // Step 2: Distributed lock (Redis)
    const lockKey = `seat:${seatId}`;

    const result = await this.redisService.withLock(
      lockKey,
      async () => {
        // Step 3: Transaction
        return await this.databaseService.withTransaction(async (session) => {
          const expiresAt = DateUtil.getReservationExpiryDate(
            EXPIRATION_CONSTANTS.RESERVATION_EXPIRY_MINUTES,
          );

          try {
            // Step 4: Atomic seat reserve (with optimistic locking)
            // This happens FIRST to check availability
            const seat = await this.seatsRepository.atomicReserve(
              seatId,
              new Types.ObjectId(), // Temporary ID
              expiresAt,
              session,
            );

            // Step 5: Seat not available → conflict
            if (!seat) {
              this.loggerService.logReservationConflict(seatId, userId);
              throw new ConflictException(ERROR_MESSAGES.SEAT.NOT_AVAILABLE);
            }

            // Step 6: Create reservation (with unique constraint)
            const reservation = await this.reservationsRepository.create(
              {
                seatId: new Types.ObjectId(seatId),
                userId,
                status: ReservationStatus.PENDING,
                expiresAt,
                idempotencyKey: idempotencyKey || undefined,
              },
              session,
            );

            // Step 7: Update seat with correct reservationId
            await this.seatsRepository.updateReservationId(
              seatId,
              reservation._id as Types.ObjectId,
              session,
            );

            this.loggerService.logReservationSuccess(
              seatId,
              userId,
              (reservation._id as Types.ObjectId).toString(),
              expiresAt,
            );

            return ResponseUtil.created(
              {
                reservationId: reservation._id,
                seatId: seat._id,
                seatNumber: seat.seatNumber,
                userId,
                status: reservation.status,
                expiresAt,
                remainingSeconds: DateUtil.getRemainingSeconds(expiresAt),
              },
              'Seat reserved successfully',
            );
          } catch (error: any) {
            // MongoDB duplicate key error (11000) → Seat already has active reservation
            if (error.code === 11000) {
              this.loggerService.logReservationConflict(seatId, userId);
              throw new ConflictException(ERROR_MESSAGES.SEAT.NOT_AVAILABLE);
            }
            throw error;
          }
        });
      },
      EXPIRATION_CONSTANTS.LOCK_TTL_SECONDS,
    );

    // Step 8: Cache idempotency response
    if (idempotencyKey) {
      await this.idempotencyService.saveResponse(
        idempotencyKey,
        'POST',
        '/api/seats/reserve',
        result,
        201,
        userId,
      );
    }

    return result;
  }

  /**
   * Get all seats
   */
  async getAllSeats(query: SeatQueryDto) {
    const { seats, total } = await this.seatsRepository.findAll(query);

    const seatDtos = seats.map((seat) => this.toResponseDto(seat));

    return ResponseUtil.paginated(
      seatDtos,
      total,
      query.page || 1,
      query.limit || 50,
      'Seats retrieved successfully',
    );
  }

  /**
   * Get seat by ID
   */
  async getSeatById(seatId: string) {
    const seat = await this.seatsRepository.findById(seatId);

    if (!seat) {
      throw new NotFoundException(ERROR_MESSAGES.SEAT.NOT_FOUND);
    }

    return ResponseUtil.success(
      this.toResponseDto(seat),
      'Seat retrieved successfully',
    );
  }

  /**
   * Create new seat (Admin)
   */
  async createSeat(dto: CreateSeatDto) {
    const seat = await this.seatsRepository.create({
      seatNumber: dto.seatNumber.toUpperCase(),
      row: dto.row.toUpperCase(),
      section: dto.section || 'STANDARD',
      price: dto.price || 0,
      status: SeatStatus.AVAILABLE,
      version: 0,
      isActive: true,
    });

    return ResponseUtil.created(
      this.toResponseDto(seat),
      'Seat created successfully',
    );
  }

  /**
   * Get seat statistics
   */
  async getSeatStats() {
    const counts = await this.seatsRepository.countByStatus();

    return ResponseUtil.success(
      {
        available: counts[SeatStatus.AVAILABLE],
        reserved: counts[SeatStatus.RESERVED],
        confirmed: counts[SeatStatus.CONFIRMED],
        total: Object.values(counts).reduce((a, b) => a + b, 0),
      },
      'Seat statistics retrieved',
    );
  }

  /**
   * Map to response DTO
   */
  private toResponseDto(seat: any): SeatResponseDto {
    const remaining = seat.expiresAt
      ? DateUtil.getRemainingSeconds(seat.expiresAt)
      : undefined;

    return {
      id: seat._id.toString(),
      seatNumber: seat.seatNumber,
      row: seat.row,
      section: seat.section,
      status: seat.status,
      price: seat.price,
      expiresAt: seat.expiresAt,
      remainingSeconds: remaining,
      createdAt: seat.createdAt,
      updatedAt: seat.updatedAt,
    };
  }
}