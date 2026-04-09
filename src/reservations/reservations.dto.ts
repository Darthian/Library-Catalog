import { IsString, IsNotEmpty, IsInt, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateReservationDto {
  @ApiProperty({ example: 1, description: 'Book ID to reserve' })
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  bookId: number;

  @ApiProperty({ example: 'user-42', description: 'User identifier' })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
