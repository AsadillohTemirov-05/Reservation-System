import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { SeatStatus } from '../../../common/enums/seat-status.enum';

export class SeatQueryDto {
  @ApiProperty({ enum: SeatStatus, required: false })
  @IsOptional()
  @IsEnum(SeatStatus)
  status?: SeatStatus;

  @ApiProperty({ example: 'A', required: false })
  @IsOptional()
  row?: string;

  @ApiProperty({ example: 'STANDARD', required: false })
  @IsOptional()
  section?: string;

  @ApiProperty({ example: 1, required: false, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ example: 50, required: false, default: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}