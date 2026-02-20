import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsNumber, Min, Max } from 'class-validator';
import { ReservationStatus } from '../../../common/enums/reservation-status.enum';

export class ReservationQueryDto {
  @ApiProperty({ enum: ReservationStatus, required: false })
  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @ApiProperty({ example: 'user-123', required: false })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ example: 1, required: false, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ example: 20, required: false, default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}