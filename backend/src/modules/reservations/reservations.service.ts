import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  GoneException,
  ForbiddenException,
} from '@nestjs/common';
import { ReservationsRepository } from './reservations.repository';
import { SeatsRepository } from '../seats/seats.repository';
import { DatabaseService } from '../../database/database.service';
import { LoggerService } from '../logger/logger.service';
import { IdempotencyService } from '../idempotency/idempotency.service';
import { ConfirmReservationDto } from './dto/confirm-reservation.dto';
import { CancelReservationDto } from './dto/cancel-reservation.dto';
import { ReservationQueryDto } from './dto/reservation-query.dto';
import { ResponseUtil } from '../../common/utils/response.util';
import { DateUtil } from '../../common/utils/date.util';
import { ERROR_MESSAGES } from '../../common/constants/error-messages.constants';
import { ReservationStatus } from '../../common/enums/reservation-status.enum';

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);

  constructor(
    private readonly reservationsRepository: ReservationsRepository,
    private readonly seatsRepository: SeatsRepository,
    private readonly databaseService: DatabaseService,
    private readonly loggerService: LoggerService,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  /**
   * ✅ Confirm reservation
   */
  async confirmReservation(
    dto: ConfirmReservationDto,
    idempotencyKey?: string,
  ) {
    const { reservationId, userId } = dto;

    // Step 1: Check idempotency
    if (idempotencyKey) {
      const cached = await this.idempotencyService.getResponse(idempotencyKey);
      if (cached) {
        this.loggerService.logIdempotencyHit(idempotencyKey, userId);
        return cached;
      }
    }

    // Step 2: Transaction
    const result = await this.databaseService.withTransaction(
      async (session) => {
        // Step 3: Find reservation
        const reservation = await this.reservationsRepository.findByIdAndUserId(
          reservationId,
          userId,
        );

        // Not found
        if (!reservation) {
          throw new NotFoundException(ERROR_MESSAGES.RESERVATION.NOT_FOUND);
        }

        // User mismatch
        if (reservation.userId !== userId) {
          throw new ForbiddenException(ERROR_MESSAGES.RESERVATION.USER_MISMATCH);
        }

        // Already confirmed
        if (reservation.status === ReservationStatus.CONFIRMED) {
          throw new ConflictException(
            ERROR_MESSAGES.RESERVATION.ALREADY_CONFIRMED,
          );
        }

        // Already cancelled
        if (reservation.status === ReservationStatus.CANCELLED) {
          throw new ConflictException(
            ERROR_MESSAGES.RESERVATION.ALREADY_CANCELLED,
          );
        }

        // Expired → 410 Gone
        if (
          reservation.status === ReservationStatus.EXPIRED ||
          DateUtil.isExpired(reservation.expiresAt)
        ) {
          throw new GoneException(ERROR_MESSAGES.RESERVATION.EXPIRED);
        }

        // Step 4: Atomic confirm reservation
        const confirmed = await this.reservationsRepository.atomicConfirm(
          reservationId,
          userId,
          session,
        );

        if (!confirmed) {
          throw new GoneException(ERROR_MESSAGES.RESERVATION.EXPIRED);
        }

        // Step 5: Atomic confirm seat
        await this.seatsRepository.atomicConfirm(
          reservation.seatId.toString(),
          session,
        );

        this.loggerService.logReservationConfirmed(
          reservationId,
          userId,
          reservation.seatId.toString(),
        );

        return ResponseUtil.success(
          {
            reservationId: confirmed._id,
            seatId: confirmed.seatId,
            userId: confirmed.userId,
            status: confirmed.status,
            confirmedAt: confirmed.confirmedAt,
          },
          'Reservation confirmed successfully',
        );
      },
    );

    // Step 6: Cache idempotency
    if (idempotencyKey) {
      await this.idempotencyService.saveResponse(
        idempotencyKey,
        'POST',
        '/api/reservations/confirm',
        result,
        200,
        userId,
      );
    }

    return result;
  }

  /**
   * ✅ Cancel reservation
   */
  async cancelReservation(dto: CancelReservationDto) {
    const { reservationId, userId } = dto;

    return await this.databaseService.withTransaction(async (session) => {
      // Find reservation
      const reservation = await this.reservationsRepository.findByIdAndUserId(
        reservationId,
        userId,
      );

      if (!reservation) {
        throw new NotFoundException(ERROR_MESSAGES.RESERVATION.NOT_FOUND);
      }

      if (reservation.status === ReservationStatus.CONFIRMED) {
        throw new ConflictException(
          ERROR_MESSAGES.RESERVATION.ALREADY_CONFIRMED,
        );
      }

      if (reservation.status === ReservationStatus.CANCELLED) {
        throw new ConflictException(
          ERROR_MESSAGES.RESERVATION.ALREADY_CANCELLED,
        );
      }

      // Atomic cancel
      const cancelled = await this.reservationsRepository.atomicCancel(
        reservationId,
        userId,
        session,
      );

      if (!cancelled) {
        throw new NotFoundException(ERROR_MESSAGES.RESERVATION.NOT_FOUND);
      }

      // Release seat → AVAILABLE
      await this.seatsRepository.releaseToAvailable(
        reservation.seatId.toString(),
        session,
      );

      this.logger.log(
        `✅ Reservation cancelled: ${reservationId} | Seat released`,
      );

      return ResponseUtil.success(
        {
          reservationId: cancelled._id,
          seatId: cancelled.seatId,
          userId: cancelled.userId,
          status: cancelled.status,
          cancelledAt: cancelled.cancelledAt,
        },
        'Reservation cancelled successfully',
      );
    });
  }

  /**
   * Get reservation by ID
   */
  async getReservationById(reservationId: string) {
    const reservation =
      await this.reservationsRepository.findById(reservationId);

    if (!reservation) {
      throw new NotFoundException(ERROR_MESSAGES.RESERVATION.NOT_FOUND);
    }

    return ResponseUtil.success(
      this.toResponseDto(reservation),
      'Reservation retrieved successfully',
    );
  }

  /**
   * Get all reservations
   */
  async getAllReservations(query: ReservationQueryDto) {
    const { reservations, total } =
      await this.reservationsRepository.findAll(query);

    return ResponseUtil.paginated(
      reservations.map((r) => this.toResponseDto(r)),
      total,
      query.page || 1,
      query.limit || 20,
      'Reservations retrieved successfully',
    );
  }

  /**
   * Map to response DTO
   */
  private toResponseDto(reservation: any) {
    const remaining =
      reservation.status === ReservationStatus.PENDING
        ? DateUtil.getRemainingSeconds(reservation.expiresAt)
        : undefined;

    return {
      id: reservation._id.toString(),
      seatId: reservation.seatId.toString(),
      userId: reservation.userId,
      status: reservation.status,
      expiresAt: reservation.expiresAt,
      confirmedAt: reservation.confirmedAt,
      cancelledAt: reservation.cancelledAt,
      remainingSeconds: remaining,
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt,
    };
  }
}