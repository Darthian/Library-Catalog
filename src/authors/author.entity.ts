import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Book } from '../books/book.entity';

@Entity('authors')
export class Author {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  biography: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Book, (book) => book.author)
  books: Book[];
}
