import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * E2E lifecycle test for the Ebook entity at /ebooks.
 *
 * Covers: Create → Reserve → Concurrent-reserve conflict → Cancel
 *
 * NOTE: This test targets /ebooks and assumes an Ebook entity exists in the
 * project with the same shape as Book (title, isbn, publishedYear,
 * totalCopies, availableCopies, authorId). The /reservations endpoint is
 * shared and uses `bookId` to reference the ebook by ID.
 *
 * Run: npx jest --config ./test/jest-e2e.json --testPathPattern=ebooks
 */

describe('Ebooks Reservation Lifecycle (E2E)', () => {
  let app: INestApplication;
  let authorId: number;
  let ebookId: number;
  let reservationId: number;

  // ─── Setup ─────────────────────────────────────────────────────────────────

  beforeAll(async () => {
    // Use an in-memory SQLite database so tests are isolated and leave no files.
    process.env.DB_PATH = ':memory:';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Mirror the validation pipe applied in main.ts so DTOs are validated.
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    await app.init();

    // Seed: ebooks require an author — create one before any ebook is made.
    const authorRes = await request(app.getHttpServer())
      .post('/authors')
      .send({ name: 'Ada Lovelace', bio: 'Pioneer of computing and digital texts.' })
      .expect(201);

    authorId = authorRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── 1. Create ─────────────────────────────────────────────────────────────

  describe('1. Create', () => {
    it('POST /ebooks → 201 with all expected body fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/ebooks')
        .send({
          title: 'The Digital Frontier',
          isbn: '978-0-111-22333-4',
          publishedYear: 2023,
          totalCopies: 5,
          authorId,
        })
        .expect(201);

      expect(res.body).toMatchObject({
        title: 'The Digital Frontier',
        isbn: '978-0-111-22333-4',
        publishedYear: 2023,
        totalCopies: 5,
        availableCopies: 5, // defaults to totalCopies on creation
        authorId,
      });
      expect(res.body.id).toBeDefined();
      expect(typeof res.body.id).toBe('number');
      expect(res.body.createdAt).toBeDefined();

      ebookId = res.body.id;
    });

    it('GET /ebooks/:id → 200 returns the created ebook', async () => {
      const res = await request(app.getHttpServer())
        .get(`/ebooks/${ebookId}`)
        .expect(200);

      expect(res.body.id).toBe(ebookId);
      expect(res.body.title).toBe('The Digital Frontier');
    });
  });

  // ─── 2. Reserve ────────────────────────────────────────────────────────────

  describe('2. Reserve', () => {
    it('POST /reservations → 201 with status ACTIVE', async () => {
      const res = await request(app.getHttpServer())
        .post('/reservations')
        .send({ bookId: ebookId, userId: 'user-abc' })
        .expect(201);

      expect(res.body).toMatchObject({
        bookId: ebookId,
        userId: 'user-abc',
        status: 'ACTIVE',
      });
      expect(res.body.id).toBeDefined();
      expect(res.body.reservedAt).toBeDefined();
      expect(res.body.cancelledAt).toBeNull();

      reservationId = res.body.id;
    });

    it('GET /ebooks/:id → availableCopies decremented by 1 after reservation', async () => {
      const res = await request(app.getHttpServer())
        .get(`/ebooks/${ebookId}`)
        .expect(200);

      // Started with 5, one reservation made → 4 remaining.
      expect(res.body.availableCopies).toBe(4);
    });
  });

  // ─── 3. Concurrent-reserve conflict ────────────────────────────────────────

  describe('3. Concurrent-reserve conflict', () => {
    it('POST /reservations for same userId+bookId while first is ACTIVE → 409 Conflict', async () => {
      const res = await request(app.getHttpServer())
        .post('/reservations')
        .send({ bookId: ebookId, userId: 'user-abc' })
        .expect(409);

      expect(res.body.statusCode).toBe(409);
      // Service throws: "User <id> already has an active reservation for book #<id>"
      expect(res.body.message).toMatch(/already has an active reservation/i);
    });

    it('availableCopies unchanged after rejected duplicate reservation', async () => {
      const res = await request(app.getHttpServer())
        .get(`/ebooks/${ebookId}`)
        .expect(200);

      expect(res.body.availableCopies).toBe(4);
    });
  });

  // ─── 4. Cancel ─────────────────────────────────────────────────────────────

  describe('4. Cancel', () => {
    it('DELETE /reservations/:id → 200 with status CANCELLED and cancelledAt set', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/reservations/${reservationId}`)
        .expect(200);

      expect(res.body).toMatchObject({
        id: reservationId,
        bookId: ebookId,
        userId: 'user-abc',
        status: 'CANCELLED',
      });
      expect(res.body.cancelledAt).toBeDefined();
      expect(res.body.cancelledAt).not.toBeNull();
    });

    it('GET /ebooks/:id → availableCopies restored to original after cancellation', async () => {
      const res = await request(app.getHttpServer())
        .get(`/ebooks/${ebookId}`)
        .expect(200);

      // Copy returned to pool → back to 5.
      expect(res.body.availableCopies).toBe(5);
    });

    it('DELETE /reservations/:id a second time → 409 already cancelled', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/reservations/${reservationId}`)
        .expect(409);

      expect(res.body.statusCode).toBe(409);
      // Service throws: "Reservation #<id> is already cancelled"
      expect(res.body.message).toMatch(/already cancelled/i);
    });
  });
});
