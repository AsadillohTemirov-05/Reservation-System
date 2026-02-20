import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { ReservationsRepository } from './reservations.repository';
import { Reservation, ReservationSchema } from './schemas/reservation.schema';
import { Seat, SeatSchema } from '../seats/schemas/seat.schema';
import { SeatsRepository } from '../seats/seats.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Reservation.name, schema: ReservationSchema }, 
      { name: Seat.name, schema: SeatSchema },               
    ]),
  ],
  controllers: [ReservationsController],
  providers: [
    ReservationsService,
    ReservationsRepository,  
    SeatsRepository,        
  ],
  exports: [
    ReservationsService,
    ReservationsRepository,
  ],
})
export class ReservationsModule {}
