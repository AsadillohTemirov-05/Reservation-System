import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Seat, SeatDocument } from '../../modules/seats/schemas/seat.schema';
import { SeatStatus } from '../../common/enums/seat-status.enum';

@Injectable()
export class SeatSeeder {
  private readonly logger = new Logger(SeatSeeder.name);

  constructor(
    @InjectModel(Seat.name)
    private readonly seatModel: Model<SeatDocument>,
  ) {}

  async seed() {
    try {
      const existingCount = await this.seatModel.countDocuments();
      if (existingCount > 0) {
        this.logger.warn(
          `⚠️ Database already has ${existingCount} seats. Skipping seeder.`,
        );
        return;
      }

      this.logger.log('🌱 Starting seat seeder...');

      const seats: Partial<Seat>[] = [];
      const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
      const seatsPerRow = 10;

      for (const row of rows) {
        for (let seatNum = 1; seatNum <= seatsPerRow; seatNum++) {
          seats.push({
            seatNumber: `${row}${seatNum}`,
            row: row,
            section: this.getSection(row),
            status: SeatStatus.AVAILABLE,
            price: this.getPrice(row),
            version: 0,
            isActive: true,
            // ✅ FIX: null → undefined
            expiresAt: undefined,
            currentReservationId: undefined,
          });
        }
      }

      await this.seatModel.insertMany(seats);

      this.logger.log(`✅ Successfully seeded ${seats.length} seats`);
      this.logger.log(`   Rows: ${rows.join(', ')}`);
      this.logger.log(`   Seats per row: ${seatsPerRow}`);
      this.logger.log(`   Total: ${seats.length} seats`);
    } catch (error: any) {
      this.logger.error(`❌ Seat seeder failed: ${error.message}`);
      throw error;
    }
  }

  private getSection(row: string): string {
    if (['A', 'B', 'C'].includes(row)) return 'VIP';
    if (['D', 'E', 'F', 'G'].includes(row)) return 'STANDARD';
    return 'ECONOMY';
  }

  private getPrice(row: string): number {
    const section = this.getSection(row);
    switch (section) {
      case 'VIP':
        return 100000;
      case 'STANDARD':
        return 50000;
      case 'ECONOMY':
        return 30000;
      default:
        return 50000;
    }
  }

  async clear() {
    this.logger.warn('🗑️ Clearing all seats...');
    await this.seatModel.deleteMany({});
    this.logger.log('✅ All seats cleared');
  }
}