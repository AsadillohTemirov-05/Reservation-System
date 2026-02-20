import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IdempotencyRecord, IdempotencyDocument } from './schemas/idempotency.schema';

@Injectable()
export class IdempotencyRepository {
  private readonly logger = new Logger(IdempotencyRepository.name);

  constructor(
    @InjectModel(IdempotencyRecord.name)
    private readonly idempotencyModel: Model<IdempotencyDocument>,
  ) {}

  /**
   * Find by key
   */
  async findByKey(key: string): Promise<IdempotencyDocument | null> {
    try {
      return await this.idempotencyModel.findOne({ key });
    } catch (error: any) {
      this.logger.error(`❌ findByKey error: ${error.message}`);
      return null;
    }
  }

  /**
   * Save idempotency record
   */
  async save(data: {
    key: string;
    method: string;
    path: string;
    response: Record<string, any>;
    statusCode: number;
    userId?: string | null;
    expiresAt: Date;
  }): Promise<IdempotencyDocument | null> {
    try {
      const record = new this.idempotencyModel(data);
      return await record.save();
    } catch (error: any) {
      // Duplicate key - already exists
      if (error.code === 11000) {
        this.logger.debug(`⚠️ Idempotency key already exists: ${data.key}`);
        return await this.findByKey(data.key);
      }
      this.logger.error(`❌ save error: ${error.message}`);
      return null;
    }
  }

  /**
   * Delete by key
   */
  async deleteByKey(key: string): Promise<boolean> {
    try {
      await this.idempotencyModel.deleteOne({ key });
      return true;
    } catch (error: any) {
      this.logger.error(`❌ deleteByKey error: ${error.message}`);
      return false;
    }
  }

  /**
   * Delete expired records
   */
  async deleteExpired(): Promise<number> {
    try {
      const result = await this.idempotencyModel.deleteMany({
        expiresAt: { $lt: new Date() },
      });
      return result.deletedCount;
    } catch (error: any) {
      this.logger.error(`❌ deleteExpired error: ${error.message}`);
      return 0;
    }
  }
}