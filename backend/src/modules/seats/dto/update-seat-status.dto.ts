import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum } from 'class-validator';
import { SeatStatus } from '../../../common/enums/seat-status.enum';

export class UpdateSeatStatusDto {
  @ApiProperty({
    enum: SeatStatus,
    example: SeatStatus.AVAILABLE,
  })
  @IsNotEmpty()
  @IsEnum(SeatStatus)
  status: SeatStatus;
}