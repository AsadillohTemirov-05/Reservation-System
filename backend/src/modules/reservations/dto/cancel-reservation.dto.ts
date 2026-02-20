import { ApiProperty } from "@nestjs/swagger";
import { IsMongoId, IsNotEmpty, IsString } from "class-validator";




export class CancelReservationDto{

  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Reservation ID',
  })
  @IsNotEmpty()
  @IsMongoId()
  reservationId: string;


  @ApiProperty({
     example: 'user-123',
    description: 'User ID',
  })
  @IsNotEmpty()
  @IsString()
  userId:string;
  


}