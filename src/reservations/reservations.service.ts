import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation, ReservationStatus } from './reservation.entity';
import { CreateReservationDto } from './reservations.dto';
import { BooksService } from '../books/books.service';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationsRepo: Repository<Reservation>,
    private readonly booksService: BooksService,
  ) {}

  async create(dto: CreateReservationDto): Promise<Reservation> {
    // Check for existing active reservation for same user+book
    const existing = await this.reservationsRepo.findOne({
      where: { bookId: dto.bookId, userId: dto.userId, status: ReservationStatus.ACTIVE },
    });
    if (existing) {
      throw new ConflictException(
        `User ${dto.userId} already has an active reservation for book #${dto.bookId}`,
      );
    }

    // Decrement available copies (throws 400 if none available)
    await this.booksService.decrementAvailable(dto.bookId);

    const reservation = this.reservationsRepo.create({
      ...dto,
      status: ReservationStatus.ACTIVE,
    });
    return this.reservationsRepo.save(reservation);
  }

  async findAll(): Promise<Reservation[]> {
    return this.reservationsRepo.find({ relations: ['book'] });
  }

  async findOne(id: number): Promise<Reservation> {
    const reservation = await this.reservationsRepo.findOne({
      where: { id },
      relations: ['book'],
    });
    if (!reservation) throw new NotFoundException(`Reservation #${id} not found`);
    return reservation;
  }

  async cancel(id: number): Promise<Reservation> {
    const reservation = await this.findOne(id);
    if (reservation.status === ReservationStatus.CANCELLED) {
      throw new ConflictException(`Reservation #${id} is already cancelled`);
    }
    reservation.status = ReservationStatus.CANCELLED;
    reservation.cancelledAt = new Date();
    await this.reservationsRepo.save(reservation);

    // Return copy to available pool
    await this.booksService.incrementAvailable(reservation.bookId);

    return this.findOne(id);
  }
}
