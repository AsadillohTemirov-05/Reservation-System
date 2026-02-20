import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiParam,
} from '@nestjs/swagger';
import { ReservationsService } from './reservations.service';
import { ConfirmReservationDto } from './dto/confirm-reservation.dto';
import { CancelReservationDto } from './dto/cancel-reservation.dto';
import { ReservationQueryDto } from './dto/reservation-query.dto';
// import { IdempotencyKey } from '../../common/decorators/idempotency-key.decorator';
import { IdempotencyGuard } from '../../common/guards/idempotency.guard';
import { IdempotencyKey } from 'src/common';

@ApiTags('reservations')
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  /**
   * GET /api/reservations - List all reservations
   */
  @Get()
  @ApiOperation({ summary: 'Get all reservations' })
  @ApiResponse({ status: 200, description: 'Reservations retrieved' })
  async getAllReservations(@Query() query: ReservationQueryDto) {
    return this.reservationsService.getAllReservations(query);
  }

  /**
   * GET /api/reservations/:id - Get by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get reservation by ID' })
  @ApiParam({ name: 'id', description: 'Reservation ID' })
  @ApiResponse({ status: 200, description: 'Reservation found' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  async getReservationById(@Param('id') id: string) {
    return this.reservationsService.getReservationById(id);
  }

  /**
   * POST /api/reservations/confirm ⭐ MAIN ENDPOINT
   */
  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  @UseGuards(IdempotencyGuard)
  @ApiOperation({
    summary: '⭐ Confirm reservation',
    description: `
      Confirm a pending reservation.
      
      - Reservation must not be expired (2 minute window)
      - userId must match the reservation owner
      - Returns 410 Gone if reservation expired
    `,
  })
  @ApiHeader({
    name: 'Idempotency-Key',
    description: 'Unique key to prevent duplicate confirmations',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Reservation confirmed',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        message: 'Reservation confirmed successfully',
        data: {
          reservationId: '507f1f77bcf86cd799439011',
          seatId: '507f1f77bcf86cd799439012',
          userId: 'user-123',
          status: 'CONFIRMED',
          confirmedAt: '2026-02-16T10:01:30.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  @ApiResponse({ status: 409, description: 'Already confirmed or cancelled' })
  @ApiResponse({ status: 410, description: 'Reservation expired' })
  async confirmReservation(
    @Body() dto: ConfirmReservationDto,
    @IdempotencyKey() idempotencyKey: string,
  ) {
    return this.reservationsService.confirmReservation(dto, idempotencyKey);
  }

 
  @Delete('cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a reservation' })
  @ApiResponse({ status: 200, description: 'Reservation cancelled' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  @ApiResponse({ status: 409, description: 'Cannot cancel confirmed reservation' })
  async cancelReservation(@Body() dto: CancelReservationDto) {
    return this.reservationsService.cancelReservation(dto);
  }
}