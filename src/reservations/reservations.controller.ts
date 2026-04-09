import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './reservations.dto';
import { Reservation } from './reservation.entity';

@ApiTags('Reservations')
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @ApiOperation({ summary: 'Reserve a book for a user' })
  @ApiResponse({ status: 201, description: 'Reservation created', type: Reservation })
  @ApiResponse({ status: 400, description: 'No copies available' })
  @ApiResponse({ status: 409, description: 'Duplicate active reservation' })
  create(@Body() dto: CreateReservationDto): Promise<Reservation> {
    return this.reservationsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all reservations' })
  @ApiResponse({ status: 200, type: [Reservation] })
  findAll(): Promise<Reservation[]> {
    return this.reservationsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get reservation by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: Reservation })
  @ApiResponse({ status: 404 })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Reservation> {
    return this.reservationsService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a reservation' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Reservation cancelled', type: Reservation })
  @ApiResponse({ status: 409, description: 'Already cancelled' })
  cancel(@Param('id', ParseIntPipe) id: number): Promise<Reservation> {
    return this.reservationsService.cancel(id);
  }
}
