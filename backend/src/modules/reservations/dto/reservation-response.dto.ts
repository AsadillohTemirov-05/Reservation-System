import { ApiProperty } from "@nestjs/swagger";
import { ReservationStatus } from "src/common";



export class ReservationResponseDto{
     @ApiProperty()
  id: string;

  @ApiProperty()
  seatId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: ReservationStatus })
  status: ReservationStatus;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty({ required: false })
  confirmedAt?: Date | null;

  @ApiProperty({ required: false })
  cancelledAt?: Date | null;

  @ApiProperty({ required: false })
  remainingSeconds?: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}