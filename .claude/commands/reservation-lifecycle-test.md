Generate a complete NestJS integration test for the entity **$ARGUMENTS**.

The test file must cover this lifecycle end-to-end:

1. **Create** — POST to create the entity. Assert 201 + returned body fields.
2. **Reserve** — POST `/reservations` linking the created entity. Assert 201, status=ACTIVE, availableCopies decremented.
3. **Concurrent-reserve conflict** — POST a second reservation for the same userId+bookId while the first is still ACTIVE. Assert 409 Conflict.
4. **Cancel** — DELETE `/reservations/:id` for the first reservation. Assert 200, status=CANCELLED, cancelledAt is set, availableCopies restored.

### Output format

Produce a single TypeScript file: `test/<entity-name>.e2e-spec.ts`

The file must:
- Use `@nestjs/testing` `Test.createTestingModule` to spin up the full NestJS app (import `AppModule`)
- Use `supertest` for HTTP calls
- Use an in-memory/test SQLite database (set `DB_PATH` env to `:memory:` or a temp file)
- Group tests with `describe` blocks mirroring the lifecycle steps above
- Use `beforeAll` to start the app and seed required dependent data (e.g. create an Author before a Book)
- Use `afterAll` to close the app
- Assert all relevant fields (status codes, body shape, edge-case error messages)

### Example invocation

```
/reservation-lifecycle-test books /books
```
