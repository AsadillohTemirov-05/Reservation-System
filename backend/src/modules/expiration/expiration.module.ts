import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExpirationService } from './expiration.service';
import { ExpirationScheduler } from './expiration.scheduler';
import { ExpirationRepository } from './expiration.repository';
import { Reservation, ReservationSchema } from '../reservations/schemas/reservation.schema';
import { Seat, SeatSchema } from '../seats/schemas/seat.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Reservation.name, schema: ReservationSchema },
      { name: Seat.name, schema: SeatSchema },
    ]),
  ],
  providers: [
    ExpirationService,
    ExpirationScheduler,
    ExpirationRepository,
  ],
  exports: [ExpirationService],
})
export class ExpirationModule {}