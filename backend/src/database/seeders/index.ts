import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { SeatSeeder } from './seat.seeder';
import { TestDataSeeder } from './test-data.seeder';
import { SeederModule } from './seeder.module';

async function bootstrap() {
  const logger = new Logger('Seeder');

  try {
    const app = await NestFactory.createApplicationContext(SeederModule, {
      logger: ['log', 'error', 'warn'],
    });

    const seatSeeder = app.get(SeatSeeder);
    const testDataSeeder = app.get(TestDataSeeder);

    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'seed':
        logger.log('🌱 Running all seeders...');
        await seatSeeder.seed();
        await testDataSeeder.seed();
        logger.log('✅ All seeders completed!');
        break;

      case 'seed:seats':
        logger.log('🌱 Running seat seeder...');
        await seatSeeder.seed();
        logger.log('✅ Seat seeder completed!');
        break;

      case 'seed:test':
        logger.log('🌱 Running test data seeder...');
        await testDataSeeder.seed();
        logger.log('✅ Test data seeder completed!');
        break;

      case 'clear':
        logger.log('🗑️ Clearing all data...');
        await testDataSeeder.clear();
        await seatSeeder.clear();
        logger.log('✅ All data cleared!');
        break;

      case 'clear:seats':
        logger.log('🗑️ Clearing seats...');
        await seatSeeder.clear();
        logger.log('✅ Seats cleared!');
        break;

      case 'clear:test':
        logger.log('🗑️ Clearing test data...');
        await testDataSeeder.clear();
        logger.log('✅ Test data cleared!');
        break;

      default:
        logger.error(`❌ Unknown command: ${command}`);
        logger.log('Available commands:');
        logger.log('  seed           - Run all seeders');
        logger.log('  seed:seats     - Seed only seats');
        logger.log('  seed:test      - Seed only test data');
        logger.log('  clear          - Clear all data');
        logger.log('  clear:seats    - Clear only seats');
        logger.log('  clear:test     - Clear only test data');
        process.exit(1);
    }

    await app.close();
    process.exit(0);
  } catch (error: any) {
    logger.error(`❌ Seeder error: ${error.message}`);
    process.exit(1);
  }
}

bootstrap();