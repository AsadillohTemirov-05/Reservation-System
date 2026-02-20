import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { SeatSeeder } from './seat.seeder';
import { TestDataSeeder } from './test-data.seeder';
import { Seat, SeatSchema } from '../../modules/seats/schemas/seat.schema';
import {
  Reservation,
  ReservationSchema,
} from '../../modules/reservations/schemas/reservation.schema';
import { DatabaseModule } from '../database.module';

import appConfig from '../../config/app.config';
// import databaseConfig from '../../config/database.config';
import redisConfig from '../../config/redis.config';
import databaseConfig from 'src/config/database.config';

@Module({
  imports: [
    
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig, databaseConfig, redisConfig], // ✅ QO'SHILDI
    }),
    DatabaseModule,
    MongooseModule.forFeature([
      { name: Seat.name, schema: SeatSchema },
      { name: Reservation.name, schema: ReservationSchema },
    ]),
  ],
  providers: [SeatSeeder, TestDataSeeder],
  exports: [SeatSeeder, TestDataSeeder],
})
export class SeederModule {}