import { ApiProperty } from "@nestjs/swagger";
import { IsMongoId, IsNotEmpty } from "class-validator";



export class ConfirmReservationDto{

    @ApiProperty({
        example:'507f1f77bcf86cd799439011',
        description:'Reservation ID'
    })
    @IsNotEmpty()
    @IsMongoId()
    reservationId:string;

    @ApiProperty({
        example:'user-123',
        description:'User ID'
    })
    @IsNotEmpty()
    @IsNotEmpty()
    userId:string;
    

}