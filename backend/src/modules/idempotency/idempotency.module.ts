import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IdempotencyService } from './idempotency.service';
import { IdempotencyRepository } from './idempotency.repository';
import {
  IdempotencyRecord,
  IdempotencyRecordSchema,
} from './schemas/idempotency.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: IdempotencyRecord.name,
        schema: IdempotencyRecordSchema,
      },
    ]),
  ],
  providers: [IdempotencyService, IdempotencyRepository],
  exports: [IdempotencyService, IdempotencyRepository],
})
export class IdempotencyModule {}

