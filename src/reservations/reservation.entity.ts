import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Book } from '../books/book.entity';

export enum ReservationStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
}

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  bookId: number;

  @ManyToOne(() => Book, (book) => book.reservations, { eager: false })
  @JoinColumn({ name: 'bookId' })
  book: Book;

  @Column({ length: 100 })
  userId: string;

  @Column({ type: 'text', default: ReservationStatus.ACTIVE })
  status: ReservationStatus;

  @CreateDateColumn()
  reservedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  cancelledAt: Date;
}
