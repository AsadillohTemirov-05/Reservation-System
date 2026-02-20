import { ApiProperty } from '@nestjs/swagger';
import { SeatStatus } from '../../../common/enums/seat-status.enum';

export class SeatResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'A5' })
  seatNumber: string;

  @ApiProperty({ example: 'A' })
  row: string;

  @ApiProperty({ example: 'STANDARD' })
  section: string;

  @ApiProperty({ enum: SeatStatus })
  status: SeatStatus;

  @ApiProperty({ example: 50000 })
  price: number;

  @ApiProperty({ required: false })
  expiresAt?: Date | null;

  @ApiProperty({ required: false })
  remainingSeconds?: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}