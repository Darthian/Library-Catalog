import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindManyOptions } from 'typeorm';
import { Book } from './book.entity';
import { CreateBookDto, UpdateBookDto, BookQueryDto } from './books.dto';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private readonly booksRepo: Repository<Book>,
  ) {}

  async create(dto: CreateBookDto): Promise<Book> {
    const copies = dto.totalCopies ?? 1;
    const book = this.booksRepo.create({
      ...dto,
      totalCopies: copies,
      availableCopies: copies,
    });
    return this.booksRepo.save(book);
  }

  async findAll(query: BookQueryDto): Promise<Book[]> {
    const qb = this.booksRepo.createQueryBuilder('book')
      .leftJoinAndSelect('book.author', 'author');

    if (query.title) {
      qb.andWhere('book.title LIKE :title', { title: `%${query.title}%` });
    }

    if (query.author) {
      qb.andWhere('author.name LIKE :authorName', { authorName: `%${query.author}%` });
    }

    if (query.authorId) {
      qb.andWhere('book.authorId = :authorId', { authorId: query.authorId });
    }

    if (query.available === 'true') {
      qb.andWhere('book.availableCopies > 0');
    }

    return qb.getMany();
  }

  async findOne(id: number): Promise<Book> {
    const book = await this.booksRepo.findOne({
      where: { id },
      relations: ['author'],
    });
    if (!book) throw new NotFoundException(`Book #${id} not found`);
    return book;
  }

  async update(id: number, dto: UpdateBookDto): Promise<Book> {
    const book = await this.findOne(id);
    if (dto.totalCopies !== undefined) {
      const diff = dto.totalCopies - book.totalCopies;
      dto['availableCopies'] = Math.max(0, book.availableCopies + diff);
    }
    await this.booksRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.booksRepo.delete(id);
  }

  async decrementAvailable(id: number): Promise<Book> {
    const book = await this.findOne(id);
    if (book.availableCopies <= 0) {
      throw new BadRequestException(`No available copies for book #${id}`);
    }
    await this.booksRepo.decrement({ id }, 'availableCopies', 1);
    return this.findOne(id);
  }

  async incrementAvailable(id: number): Promise<Book> {
    const book = await this.findOne(id);
    if (book.availableCopies >= book.totalCopies) {
      throw new BadRequestException(`All copies already returned for book #${id}`);
    }
    await this.booksRepo.increment({ id }, 'availableCopies', 1);
    return this.findOne(id);
  }
}
