import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AuthorsService } from './authors.service';
import { CreateAuthorDto, UpdateAuthorDto, AuthorQueryDto } from './authors.dto';
import { Author } from './author.entity';

@ApiTags('Authors')
@Controller('authors')
export class AuthorsController {
  constructor(private readonly authorsService: AuthorsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new author' })
  @ApiResponse({ status: 201, description: 'Author created', type: Author })
  create(@Body() dto: CreateAuthorDto): Promise<Author> {
    return this.authorsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List authors with optional name search' })
  @ApiResponse({ status: 200, description: 'Authors list', type: [Author] })
  findAll(@Query() query: AuthorQueryDto): Promise<Author[]> {
    return this.authorsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get author by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: Author })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Author> {
    return this.authorsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update author' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: Author })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAuthorDto,
  ): Promise<Author> {
    return this.authorsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete author' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Deleted' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.authorsService.remove(id);
  }
}
