import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateAuthorDto {
  @ApiProperty({ example: 'J.R.R. Tolkien' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'English writer and philologist...' })
  @IsOptional()
  @IsString()
  biography?: string;
}

export class UpdateAuthorDto extends PartialType(CreateAuthorDto) {}

export class AuthorQueryDto {
  @ApiPropertyOptional({ description: 'Search by author name' })
  @IsOptional()
  @IsString()
  name?: string;
}
