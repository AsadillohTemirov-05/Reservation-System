import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiBadRequestResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { SeatsService } from './seats.service';
import { CreateSeatDto } from './dto/create-seat.dto';
import { ReserveSeatDto } from './dto/reserve-seat.dto';
import { SeatQueryDto } from './dto/seat-query.dto';
import { IdempotencyGuard } from '../../common/guards/idempotency.guard';
import { IdempotencyKey } from 'src/common';

@ApiTags('seats')
@Controller('seats')
export class SeatsController {
  constructor(private readonly seatsService: SeatsService) {}

  /**
   * GET /api/seats - List all seats
   */
  @Get()
  @ApiOperation({ summary: 'Get all seats with filters' })
  @ApiResponse({ status: 200, description: 'Seats retrieved successfully' })
  async getAllSeats(@Query() query: SeatQueryDto) {
    return this.seatsService.getAllSeats(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get seat statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getSeatStats() {
    return this.seatsService.getSeatStats();
  }

  /**
   * GET /api/seats/:id - Get seat by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get seat by ID' })
  @ApiResponse({ status: 200, description: 'Seat found' })
  @ApiResponse({ status: 404, description: 'Seat not found' })
  async getSeatById(@Param('id') id: string) {
    return this.seatsService.getSeatById(id);
  }

  /**
   * POST /api/seats - Create new seat
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new seat (Admin)' })
  @ApiResponse({ status: 201, description: 'Seat created' })
  async createSeat(@Body() dto: CreateSeatDto) {
    return this.seatsService.createSeat(dto);
  }

  /**
   * POST /api/seats/reserve - Reserve a seat ⭐ MAIN ENDPOINT
   */
  @Post('reserve')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(IdempotencyGuard)
  @ApiOperation({
    summary: '⭐ Reserve a seat',
    description: `
      Reserve a seat for 2 minutes.
      
      - Uses distributed locking to prevent double booking
      - Supports idempotency via Idempotency-Key header
      - Returns reservation details with expiration time
    `,
  })
  @ApiHeader({
    name: 'Idempotency-Key',
    description: 'Unique key to prevent duplicate reservations',
    required: true,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 201,
    description: 'Seat reserved successfully',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        message: 'Seat reserved successfully',
        data: {
          reservationId: '507f1f77bcf86cd799439011',
          seatId: '507f1f77bcf86cd799439012',
          seatNumber: 'A5',
          userId: 'user-123',
          status: 'PENDING',
          expiresAt: '2026-02-16T10:02:00.000Z',
          remainingSeconds: 120,
        },
      },
    },
  })
  @ApiConflictResponse({
    description: '409 - Seat already reserved',
    schema: {
      example: {
        success: false,
        statusCode: 409,
        message: 'Seat is not available for reservation',
      },
    },
  })
  @ApiBadRequestResponse({
    description: '400 - Validation error or missing Idempotency-Key',
  })
  async reserveSeat(
    @Body() dto: ReserveSeatDto,
    @IdempotencyKey() idempotencyKey: string,
  ) {
    return this.seatsService.reserveSeat(dto, idempotencyKey);
  }
}