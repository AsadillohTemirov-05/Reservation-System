import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ReservationStatus } from '../../../common/enums/reservation-status.enum';

export type ReservationDocument = Reservation & Document;

@Schema({
  timestamps: true,
  collection: 'reservations',
  versionKey: false,
})
export class Reservation {
  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'Seat',
    index: true,
  })
  seatId: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
    index: true,
  })
  userId: string;

  @Prop({
    required: true,
    enum: Object.values(ReservationStatus),
    default: ReservationStatus.PENDING,
    index: true,
  })
  status: ReservationStatus;

  @Prop({
    type: Date,       // ✅ FIXED
    required: true,
    index: true,
  })
  expiresAt: Date;

  @Prop({
    type: Date,       // ✅ FIXED: Date | null → type: Date
    required: false,
    default: null,
  })
  confirmedAt: Date;

  @Prop({
    type: Date,       // ✅ FIXED: Date | null → type: Date
    required: false,
    default: null,
  })
  cancelledAt: Date;

  @Prop({
    type: String,     // ✅ FIXED: string | null → type: String
    required: false,
    default: null,
    index: true,
    sparse: true,
  })
  idempotencyKey: string;

  @Prop({
    type: Object,     // ✅ FIXED: Record | null → type: Object
    required: false,
    default: null,
  })
  metadata: Record<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

export const ReservationSchema = SchemaFactory.createForClass(Reservation);

ReservationSchema.index({ seatId: 1, status: 1 });
ReservationSchema.index({ userId: 1, status: 1 });
ReservationSchema.index({ expiresAt: 1, status: 1 });
ReservationSchema.index({ idempotencyKey: 1 }, { sparse: true });

ReservationSchema.index(
  { seatId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: ReservationStatus.PENDING,
    },
    name: 'unique_active_reservation_per_seat',
  },
);

// ✅ TTL Index
ReservationSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
    partialFilterExpression: {
      status: ReservationStatus.PENDING,
    },
    name: 'reservation_expiry_ttl',
  },
);

// Virtuals
ReservationSchema.virtual('isExpired').get(function () {
  return new Date() > new Date(this.expiresAt);
});

ReservationSchema.virtual('remainingSeconds').get(function () {
  const remaining = Math.floor(
    (new Date(this.expiresAt).getTime() - Date.now()) / 1000,
  );
  return remaining > 0 ? remaining : 0;
});