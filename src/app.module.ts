import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Author } from './authors/author.entity';
import { Book } from './books/book.entity';
import { Reservation } from './reservations/reservation.entity';
import { AuthorsModule } from './authors/authors.module';
import { BooksModule } from './books/books.module';
import { ReservationsModule } from './reservations/reservations.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env.DB_PATH || 'library.sqlite',
      entities: [Author, Book, Reservation],
      synchronize: true,
      logging: process.env.NODE_ENV !== 'production',
    }),
    AuthorsModule,
    BooksModule,
    ReservationsModule,
  ],
})
export class AppModule {}
