import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeatsController } from './seats.controller';
import { SeatsService } from './seats.service';
import { SeatsRepository } from './seats.repository';
import { Seat, SeatSchema } from './schemas/seat.schema';
import { Reservation, ReservationSchema } from '../reservations/schemas/reservation.schema';
import { ReservationsRepository } from '../reservations/reservations.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Seat.name, schema: SeatSchema },
      { name: Reservation.name, schema: ReservationSchema }, // ✅ ADD
    ]),
  ],
  controllers: [SeatsController],
  providers: [
    SeatsService,
    SeatsRepository,          // ✅ ADD
    ReservationsRepository,   // ✅ ADD
  ],
  exports: [
    SeatsService,
    SeatsRepository,          // ✅ ADD
  ],
})
export class SeatsModule {}