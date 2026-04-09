# Library Catalog API

A NestJS REST API for managing a library catalog — books, authors, and reservations — with indexed search by title and author name, availability tracking, and concurrent-reservation conflict detection.

## Table of Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Running the API](#running-the-api)
- [Environment variables](#environment-variables)
- [API reference](#api-reference)
  - [Authors](#authors)
  - [Books](#books)
  - [Reservations](#reservations)
- [Search and filtering](#search-and-filtering)
- [Reservation lifecycle](#reservation-lifecycle)
- [Swagger UI](#swagger-ui)
- [Running tests](#running-tests)
- [Skill: reservation-lifecycle-test](#skill-reservation-lifecycle-test)

---

## Requirements

- Node.js >= 18
- npm >= 9

No external database is required. The API uses SQLite via `better-sqlite3` and creates the database file automatically on first run.

---

## Installation

```bash
npm install
```

---

## Running the API

```bash
# Development (ts-node, live reload not included — use nodemon separately if needed)
npm run start:dev

# Production build
npm run build
npm run start
```

The server starts on port **3002** by default.

```
Application running on   http://localhost:3002
Swagger UI available at  http://localhost:3002/api
```

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3002` | HTTP port |
| `DB_PATH` | `library.sqlite` | Path to the SQLite database file. Use `:memory:` for in-memory (tests). |
| `NODE_ENV` | — | Set to `production` to suppress SQL query logging |

---

## API reference

All endpoints accept and return `application/json`. Validation is strict: unknown fields are rejected.

### Authors

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/authors` | Create an author |
| `GET` | `/authors` | List authors (optional `?name=` search) |
| `GET` | `/authors/:id` | Get author by ID (includes their books) |
| `PATCH` | `/authors/:id` | Update author fields |
| `DELETE` | `/authors/:id` | Delete author |

#### Create author

```http
POST /authors
Content-Type: application/json

{
  "name": "J.R.R. Tolkien",
  "biography": "Linguistic Teacher, English writer, poet, and philologist."
}
```

Response `201`:
```json
{
  "id": 1,
  "name": "J.R.R. Tolkien",
  "biography": "Linguistic Teacher, English writer, poet, and philologist.",
  "createdAt": "2026-04-09T10:00:00.000Z"
}
```

#### Search authors by name

```http
GET /authors?name=tolkien
```

---

### Books

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/books` | Create a book |
| `GET` | `/books` | List/search books |
| `GET` | `/books/:id` | Get book by ID (includes author) |
| `PATCH` | `/books/:id` | Update book fields |
| `DELETE` | `/books/:id` | Delete book |

#### Create book

```http
POST /books
Content-Type: application/json

{
  "title": "The Lord of the Rings",
  "authorId": 1,
  "isbn": "978-0-618-00222-9",
  "publishedYear": 1954,
  "totalCopies": 3
}
```

Response `201`:
```json
{
  "id": 1,
  "title": "The Lord of the Rings",
  "authorId": 1,
  "isbn": "978-0-618-00222-9",
  "publishedYear": 1954,
  "totalCopies": 3,
  "availableCopies": 3,
  "createdAt": "2026-04-09T10:00:00.000Z",
  "author": { "id": 1, "name": "J.R.R. Tolkien", ... }
}
```

#### Search books

```http
GET /books?title=rings
GET /books?author=tolkien
GET /books?title=lord&available=true
GET /books?authorId=1
```

All filters are combinable. See [Search and filtering](#search-and-filtering) for details.

---

### Reservations

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/reservations` | Reserve a book for a user |
| `GET` | `/reservations` | List all reservations |
| `GET` | `/reservations/:id` | Get reservation by ID |
| `DELETE` | `/reservations/:id` | Cancel a reservation |

#### Reserve a book

```http
POST /reservations
Content-Type: application/json

{
  "bookId": 1,
  "userId": "user-42"
}
```

Response `201`:
```json
{
  "id": 1,
  "bookId": 1,
  "userId": "user-42",
  "status": "ACTIVE",
  "reservedAt": "2026-04-09T10:05:00.000Z",
  "cancelledAt": null
}
```

#### Cancel a reservation

```http
DELETE /reservations/1
```

Response `200`:
```json
{
  "id": 1,
  "status": "CANCELLED",
  "cancelledAt": "2026-04-09T10:10:00.000Z",
  ...
}
```

---

## Search and filtering

Books support multi-filter indexed search via query parameters:

| Parameter | Type | Behavior |
|---|---|---|
| `title` | string | Case-insensitive partial match on book title |
| `author` | string | Case-insensitive partial match on author name (JOIN) |
| `authorId` | number | Exact match on author foreign key |
| `available` | `"true"` | Only books with `availableCopies > 0` |

All parameters are optional and combinable:

```http
# Books whose title contains "hobbit" written by any author named "tolkien"
GET /books?title=hobbit&author=tolkien

# Available books by a specific author
GET /books?authorId=1&available=true
```

Authors support a single search parameter:

| Parameter | Type | Behavior |
|---|---|---|
| `name` | string | Case-insensitive partial match |

---

## Reservation lifecycle

Reservations enforce availability and prevent duplicates:

1. **Reserve** — `availableCopies` is atomically decremented. Returns `400` if no copies remain.
2. **Duplicate guard** — A second active reservation from the same `userId` for the same `bookId` returns `409 Conflict`.
3. **Cancel** — `availableCopies` is restored. Returns `409` if already cancelled.

```
POST /reservations  { bookId: 1, userId: "u1" }  →  201 ACTIVE   (availableCopies: 2 → 1)
POST /reservations  { bookId: 1, userId: "u1" }  →  409 Conflict (duplicate active)
POST /reservations  { bookId: 1, userId: "u2" }  →  201 ACTIVE   (availableCopies: 1 → 0)
POST /reservations  { bookId: 1, userId: "u3" }  →  400 Bad Request (no copies left)
DELETE /reservations/1                            →  200 CANCELLED (availableCopies: 0 → 1)
```

---

## Swagger UI

The full interactive API documentation is available at:

```
http://localhost:3002/api
```

Every endpoint, request body, and response schema is documented there. You can execute requests directly from the browser.

---

## Running tests

```bash
# Unit tests
npm test

# End-to-end tests
npm run test:e2e
```

E2e tests use an isolated in-memory SQLite database (`DB_PATH=:memory:`) and spin up the full NestJS application context via `@nestjs/testing`.

-------------

## Skill: reservation-lifecycle-test

This project includes a Claude Code skill that generates a complete integration test for any entity that participates in the reservation lifecycle.

### What it generates

Given an entity name and its base route, the skill produces a `test/<entity>.e2e-spec.ts` file covering:

| Step | What is tested |
|---|---|
| **Create** | `POST /<route>` returns `201` with the correct body |
| **Reserve** | `POST /reservations` returns `201`, `status: ACTIVE`, `availableCopies` decremented |
| **Concurrent-reserve conflict** | A second reservation from the same user for the same book returns `409` |
| **Cancel** | `DELETE /reservations/:id` returns `200`, `status: CANCELLED`, `cancelledAt` is set, `availableCopies` restored |

### How to invoke it

Open Claude Code in this project directory and run:

```
/reservation-lifecycle-test <entity-name> <base-route>
```
For the first time it is needed to restart the terminal where we are calling the claude, or run

```
cd .claude/commands
cp reservation-lifecycle-test.md ~/claude/commands/
```

#### Example — generate tests for the books resource

```
/reservation-lifecycle-test books /books
```

This produces `test/books.e2e-spec.ts` with the full lifecycle suite wired to the `/books` and `/reservations` endpoints.

#### Example — generate tests for a future resource

```
/reservation-lifecycle-test ebooks /ebooks
```

### What the generated test looks like (outline)

```typescript
// test/books.e2e-spec.ts
describe('Books reservation lifecycle (e2e)', () => {
  let app: INestApplication;
  let bookId: number;
  let reservationId: number;

  beforeAll(async () => {
    // Boots full AppModule with DB_PATH=:memory:
    // Seeds a prerequisite Author
  });

  afterAll(() => app.close());

  describe('1. Create', () => {
    it('POST /books → 201 with correct fields', ...);
  });

  describe('2. Reserve', () => {
    it('POST /reservations → 201, status ACTIVE, availableCopies decremented', ...);
  });

  describe('3. Concurrent-reserve conflict', () => {
    it('second reservation for same userId+bookId → 409', ...);
  });

  describe('4. Cancel', () => {
    it('DELETE /reservations/:id → 200, status CANCELLED, copy restored', ...);
  });
});
```

### Skill location

The skill definition lives at:

```
.claude/commands/reservation-lifecycle-test.md
```

You can edit it to adjust the generated test structure, add custom assertions, or extend it to other lifecycle scenarios.
