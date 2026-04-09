import { IsString, IsNotEmpty, IsOptional, IsInt, IsPositive, MaxLength, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateBookDto {
  @ApiProperty({ example: 'The Lord of the Rings' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  authorId: number;

  @ApiPropertyOptional({ example: '978-0-618-00222-9' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  isbn?: string;

  @ApiPropertyOptional({ example: 1954 })
  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(2100)
  @Type(() => Number)
  publishedYear?: number;

  @ApiPropertyOptional({ example: 3, default: 1 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  totalCopies?: number;
}

export class UpdateBookDto extends PartialType(CreateBookDto) {}

export class BookQueryDto {
  @ApiPropertyOptional({ description: 'Search by book title (full-text)' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Search by author name' })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional({ description: 'Filter by authorId' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  authorId?: number;

  @ApiPropertyOptional({ description: 'Only show books with available copies' })
  @IsOptional()
  available?: string;
}
