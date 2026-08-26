# Session 3 Homework — Bookings That Survive a Restart

Plan prepared per the `session-3-homework.md` instructions. Starting point: **session-3 starter branch**.

## 1. Docker + PostgreSQL Setup

- [x] Take `docker-compose.yml` from the starter (instructor-provided; postgres:18)
- [x] Start PostgreSQL with `docker compose up -d`
- [x] Verify the container is healthy (psql connection test)

## 2. Prisma 7 Setup & Configuration

- [x] Add `prisma` + `@prisma/client` + `@prisma/adapter-pg` dependencies
- [x] Create `prisma.config.ts` (Prisma 7 config; `.env` is not auto-loaded)
- [x] Set generator to `prisma-client` with `output` in the source tree
- [x] Add `db:migrate`, `db:seed` scripts to `package.json`

## 3. Prisma Schema & Migration

- [x] Build `prisma/schema.prisma` per the class schema (User, Event, Booking)
- [x] Add `@@unique([userId, eventId])` to the `Booking` model
- [x] `BookingStatus` enum: CONFIRMED | CANCELLED | WAITLISTED
- [x] `User.role`: ATTENDEE | ORGANIZER | ADMIN, unique email
- [x] Create the initial migration (`prisma migrate dev --name init`)

## 4. DATABASE_URL / Config

- [x] Create `src/config.ts` (read `DATABASE_URL` via envSchema — never `process.env` directly)
- [x] Add `DATABASE_URL` to `.env.example`
- [x] Add `DATABASE_URL` to `.env`
- [x] Set up PrismaClient in `src/infra/db.ts` with `@prisma/adapter-pg`

## 5. Seed Script

- [x] Create `prisma/seed.ts` and register it in `prisma.config.ts`
- [x] At least 3 users (1 ORGANIZER, 1 ADMIN) — idempotent via `upsert`
- [x] 5 events (one capacity-5) — idempotent via `upsert`
- [x] Some booking records
- [x] 20 distinct users (for the parallel script)
- [x] Run `npx prisma db seed`; run twice to confirm idempotency

## 6. Event Repository Swap (remove in-memory stores)

- [x] Create `src/repositories/events.repository.ts` (findById, findMany, count)
- [x] Move `/v1/events` endpoints (POST, GET list+by id, PATCH, DELETE) to Postgres
- [x] Keep S2 pagination (`?page`, `?limit`, `{ data, page, limit, total }`) and filtering (`?venue`, `?from`, `?to`)
- [x] Remove the `eventsStore` Map and `data/events.json` reading logic from `server.ts`
- [x] Do not change controllers — persistence changes live in repository/service layers
- [x] Acceptance flow: fresh clone → `docker compose up -d` → `npx prisma migrate dev` → `npm run dev`

## 7. Transactional Booking

- [x] Take `src/bookings/create-booking.skeleton.ts` from the starter (Serializable isolation already set)
- [x] TODO 1: Capacity check (count CONFIRMED only)
- [x] TODO 2: CANCELLED-row flip (turn an existing CANCELLED row back to CONFIRMED)
- [x] TODO 3: Create booking (inside the transaction, via `tx` — never `prisma`)
- [x] P2002 → 409 mapping (duplicate CONFIRMED)
- [x] Fold the finished function into `src/bookings/bookings.service.ts` and call it from the controller
- [x] DELETE /v1/bookings/:id — soft cancel (row stays, status CANCELLED)
- [x] Rebooking semantics: none→create, CANCELLED→flip, CONFIRMED→409, WAITLISTED→leave alone

## 8. Concurrency Test

- [x] Take `scripts/parallel-bookings.ts` + `scripts/fixtures/parallel-users.json` from the starter
- [x] Copy 20 user ids + the capacity-5 event id from the seed into `parallel-users.json`
- [x] Run `node scripts/parallel-bookings.ts`
- [x] Expected result: exactly **5× 201, 15× 409** (never more than 5 `201`s)
- [x] Verify in psql: `SELECT status, COUNT(*) FROM "Booking" WHERE "eventId" = '<id>' GROUP BY status;`
- [x] Test cancel-then-rebook → 201 (status CONFIRMED)

## 9. Index + EXPLAIN ANALYZE

- [x] Enable Prisma query logging (`log: ['query']`)
- [x] Take the "bookings by user" query
- [x] Run `EXPLAIN ANALYZE` **before** the index, save the plan
- [x] Add an index on `bookings.user_id` (migration)
- [x] Run `EXPLAIN ANALYZE` **after** the index, save the plan
- [x] Add both plans + 2 sentences of your own interpretation to the PR description

## 10. Typecheck / Lint / Test & Final Check

- [x] `npm run typecheck` passes
- [x] `npm run lint` passes
- [x] Test all endpoints with curl (events + bookings)
- [x] Verify the acceptance flow from a fresh clone
- [x] PR description: how to run + task-4 plans + exit-ticket answer (1 sentence)
- [x] Exit ticket: the capacity check ran before every insert yet the event still oversold — why did the check fail, and what property of the fix makes overselling impossible?

## Stretch (optional)

- [x] Retry loop: catch P2034 serialization failures and re-run the transaction a bounded number of times
- [x] Waitlist: when an event is full, create the booking as WAITLISTED instead of 409 (sets up Session 5)