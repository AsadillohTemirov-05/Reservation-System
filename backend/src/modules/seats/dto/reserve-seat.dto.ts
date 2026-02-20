import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsMongoId } from 'class-validator';

export class ReserveSeatDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Seat ID',
  })
  @IsNotEmpty()
  @IsMongoId()
  seatId: string;

  @ApiProperty({
    example: 'user-123',
    description: 'User ID',
  })
  @IsNotEmpty()
  @IsString()
  userId: string;
}