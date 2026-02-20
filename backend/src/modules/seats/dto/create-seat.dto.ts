import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateSeatDto {
  @ApiProperty({ example: 'A5', description: 'Seat number' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(10)
  seatNumber: string;

  @ApiProperty({ example: 'A', description: 'Row' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(5)
  row: string;

  @ApiProperty({ example: 'STANDARD', required: false })
  @IsOptional()
  @IsString()
  section?: string;

  @ApiProperty({ example: 50000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;
}