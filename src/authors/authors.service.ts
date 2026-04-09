import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Author } from './author.entity';
import { CreateAuthorDto, UpdateAuthorDto, AuthorQueryDto } from './authors.dto';

@Injectable()
export class AuthorsService {
  constructor(
    @InjectRepository(Author)
    private readonly authorsRepo: Repository<Author>,
  ) {}

  async create(dto: CreateAuthorDto): Promise<Author> {
    const author = this.authorsRepo.create(dto);
    return this.authorsRepo.save(author);
  }

  async findAll(query: AuthorQueryDto): Promise<Author[]> {
    if (query.name) {
      return this.authorsRepo.find({
        where: { name: ILike(`%${query.name}%`) },
        relations: ['books'],
      });
    }
    return this.authorsRepo.find({ relations: ['books'] });
  }

  async findOne(id: number): Promise<Author> {
    const author = await this.authorsRepo.findOne({
      where: { id },
      relations: ['books'],
    });
    if (!author) throw new NotFoundException(`Author #${id} not found`);
    return author;
  }

  async update(id: number, dto: UpdateAuthorDto): Promise<Author> {
    await this.findOne(id);
    await this.authorsRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.authorsRepo.delete(id);
  }
}
