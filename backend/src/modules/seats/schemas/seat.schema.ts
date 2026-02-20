import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SeatStatus } from '../../../common/enums/seat-status.enum';

export type SeatDocument = Seat & Document;

@Schema({
  timestamps: true,
  collection: 'seats',
  versionKey: false,
})
export class Seat {
  @Prop({
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    index: true,
  })
  seatNumber: string;

  @Prop({
    required: true,
    trim: true,
    uppercase: true,
  })
  row: string;

  @Prop({
    required: false,
    default: 'STANDARD',
    trim: true,
  })
  section: string;

  @Prop({
    required: true,
    enum: Object.values(SeatStatus),
    default: SeatStatus.AVAILABLE,
    index: true,
  })
  status: SeatStatus;

  @Prop({
    required: true,
    default: 0,
  })
  version: number;

  // ✅ FIXED: type: Date aniq ko'rsatildi
  @Prop({
    type: Date,
    required: false,
    default: null,
    index: true,
  })
  expiresAt: Date;

  // ✅ FIXED: type allaqachon bor, | null olib tashlandi
  @Prop({
    type: Types.ObjectId,
    ref: 'Reservation',
    required: false,
    default: null,
  })
  currentReservationId: Types.ObjectId;

  @Prop({
    required: false,
    default: 0,
    min: 0,
  })
  price: number;

  @Prop({
    required: true,
    default: true,
  })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const SeatSchema = SchemaFactory.createForClass(Seat);

SeatSchema.index({ status: 1, isActive: 1 });
SeatSchema.index({ seatNumber: 1, status: 1 });
SeatSchema.index({ expiresAt: 1 }, { sparse: true });

SeatSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
    partialFilterExpression: { status: SeatStatus.RESERVED },
    name: 'seat_expiry_ttl',
  },
);

SeatSchema.methods.incrementVersion = function () {
  this.version += 1;
  return this;
};