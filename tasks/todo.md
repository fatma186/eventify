# Session 3 Homework — Bookings That Survive a Restart

Plan prepared per the `session-3-homework.md` instructions. Starting point: **session-3 starter branch**.

## 1. Docker + PostgreSQL Setup

- [ ] Take `docker-compose.yml` from the starter (instructor-provided; postgres:18)
- [ ] Start PostgreSQL with `docker compose up -d`
- [ ] Verify the container is healthy (psql connection test)

## 2. Prisma 7 Setup & Configuration

- [ ] Add `prisma` + `@prisma/client` + `@prisma/adapter-pg` dependencies
- [ ] Create `prisma.config.ts` (Prisma 7 config; `.env` is not auto-loaded)
- [ ] Set generator to `prisma-client` with `output` in the source tree
- [ ] Add `db:migrate`, `db:seed` scripts to `package.json`

## 3. Prisma Schema & Migration

- [ ] Build `prisma/schema.prisma` per the class schema (User, Event, Booking)
- [ ] Add `@@unique([userId, eventId])` to the `Booking` model
- [ ] `BookingStatus` enum: CONFIRMED | CANCELLED | WAITLISTED
- [ ] `User.role`: ATTENDEE | ORGANIZER | ADMIN, unique email
- [ ] Create the initial migration (`prisma migrate dev --name init`)

## 4. DATABASE_URL / Config

- [ ] Create `src/config.ts` (read `DATABASE_URL` via envSchema — never `process.env` directly)
- [ ] Add `DATABASE_URL` to `.env.example`
- [ ] Add `DATABASE_URL` to `.env`
- [ ] Set up PrismaClient in `src/infra/db.ts` with `@prisma/adapter-pg`

## 5. Seed Script

- [ ] Create `prisma/seed.ts` and register it in `prisma.config.ts`
- [ ] At least 3 users (1 ORGANIZER, 1 ADMIN) — idempotent via `upsert`
- [ ] 5 events (one capacity-5) — idempotent via `upsert`
- [ ] Some booking records
- [ ] 20 distinct users (for the parallel script)
- [ ] Run `npx prisma db seed`; run twice to confirm idempotency

## 6. Event Repository Swap (remove in-memory stores)

- [ ] Create `src/repositories/events.repository.ts` (findById, findMany, count)
- [ ] Move `/v1/events` endpoints (POST, GET list+by id, PATCH, DELETE) to Postgres
- [ ] Keep S2 pagination (`?page`, `?limit`, `{ data, page, limit, total }`) and filtering (`?venue`, `?from`, `?to`)
- [ ] Remove the `eventsStore` Map and `data/events.json` reading logic from `server.ts`
- [ ] Do not change controllers — persistence changes live in repository/service layers
- [ ] Acceptance flow: fresh clone → `docker compose up -d` → `npx prisma migrate dev` → `npm run dev`

## 7. Transactional Booking

- [ ] Take `src/bookings/create-booking.skeleton.ts` from the starter (Serializable isolation already set)
- [ ] TODO 1: Capacity check (count CONFIRMED only)
- [ ] TODO 2: CANCELLED-row flip (turn an existing CANCELLED row back to CONFIRMED)
- [ ] TODO 3: Create booking (inside the transaction, via `tx` — never `prisma`)
- [ ] P2002 → 409 mapping (duplicate CONFIRMED)
- [ ] Fold the finished function into `src/bookings/bookings.service.ts` and call it from the controller
- [ ] DELETE /v1/bookings/:id — soft cancel (row stays, status CANCELLED)
- [ ] Rebooking semantics: none→create, CANCELLED→flip, CONFIRMED→409, WAITLISTED→leave alone

## 8. Concurrency Test

- [ ] Take `scripts/parallel-bookings.ts` + `scripts/fixtures/parallel-users.json` from the starter
- [ ] Copy 20 user ids + the capacity-5 event id from the seed into `parallel-users.json`
- [ ] Run `node scripts/parallel-bookings.ts`
- [ ] Expected result: exactly **5× 201, 15× 409** (never more than 5 `201`s)
- [ ] Verify in psql: `SELECT status, COUNT(*) FROM "Booking" WHERE "eventId" = '<id>' GROUP BY status;`
- [ ] Test cancel-then-rebook → 201 (status CONFIRMED)

## 9. Index + EXPLAIN ANALYZE

- [ ] Enable Prisma query logging (`log: ['query']`)
- [ ] Take the "bookings by user" query
- [ ] Run `EXPLAIN ANALYZE` **before** the index, save the plan
- [ ] Add an index on `bookings.user_id` (migration)
- [ ] Run `EXPLAIN ANALYZE` **after** the index, save the plan
- [ ] Add both plans + 2 sentences of your own interpretation to the PR description

## 10. Typecheck / Lint / Test & Final Check

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] Test all endpoints with curl (events + bookings)
- [ ] Verify the acceptance flow from a fresh clone
- [ ] PR description: how to run + task-4 plans + exit-ticket answer (1 sentence)
- [ ] Exit ticket: the capacity check ran before every insert yet the event still oversold — why did the check fail, and what property of the fix makes overselling impossible?

## Stretch (optional)

- [ ] Retry loop: catch P2034 serialization failures and re-run the transaction a bounded number of times
- [ ] Waitlist: when an event is full, create the booking as WAITLISTED instead of 409 (sets up Session 5)