import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { Author } from '../authors/author.entity';
import { Reservation } from '../reservations/reservation.entity';

@Entity('books')
export class Book {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ length: 500 })
  title: string;

  @Column({ length: 20, nullable: true, unique: true })
  isbn: string;

  @Column({ type: 'int', nullable: true })
  publishedYear: number;

  @Column({ type: 'int', default: 1 })
  totalCopies: number;

  @Column({ type: 'int', default: 1 })
  availableCopies: number;

  @Column({ type: 'int', nullable: false })
  authorId: number;

  @ManyToOne(() => Author, (author) => author.books, { eager: false })
  @JoinColumn({ name: 'authorId' })
  author: Author;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Reservation, (r) => r.book)
  reservations: Reservation[];
}
