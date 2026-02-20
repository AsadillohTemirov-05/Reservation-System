
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type IdempotencyDocument = IdempotencyRecord & Document;

@Schema({
  timestamps: true,
  collection: 'idempotency_records',
  versionKey: false,
})
export class IdempotencyRecord {
  @Prop({
    required: true,
    unique: true,
    trim: true,
    index: true,
  })
  key: string;

  @Prop({
    required: true,
    trim: true,
  })
  method: string;

  @Prop({
    required: true,
    trim: true,
  })
  path: string;

  @Prop({
    required: true,
    type: Object,
  })
  response: Record<string, any>;

  @Prop({
    required: true,
    default: 200,
  })
  statusCode: number;

  
  @Prop({
    type: String,
    required: false,
    default: null,
  })
  userId: string;

  @Prop({
    type: Date,   
    required: true,
    index: true,
  })
  expiresAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const IdempotencyRecordSchema =
  SchemaFactory.createForClass(IdempotencyRecord);

IdempotencyRecordSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
    name: 'idempotency_ttl',
  },
);

IdempotencyRecordSchema.index({ key: 1, method: 1, path: 1 });