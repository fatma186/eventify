# Session 2 Homework

## Bookings API

- [x] Create `src/booking.service.ts` with in-memory Map store
- [x] Implement POST /v1/bookings (create with CONFIRMED status)
- [x] Implement GET /v1/bookings/:id
- [x] Implement DELETE /v1/bookings/:id (set status to CANCELLED, keep record)
- [x] Add duplicate booking check (userId + eventId pair)
- [x] Add capacity check (count CONFIRMED bookings only)
- [x] Create `src/booking.routes.ts` with all 5 endpoints

## Events Pagination & Filtering

- [x] Create `src/validation.ts` with Zod schemas
- [x] Add query schema for pagination (page, limit)
- [x] Add query schema for filtering (venue, from, to)
- [x] Create `validateQuery` middleware
- [x] Update GET /v1/events with pagination (page, limit params)
- [x] Add response envelope: { data, page, limit, total }
- [x] Add filtering by venue (exact match)
- [x] Add filtering by date range (from/to on startsAt)
- [x] Ensure filtering happens BEFORE pagination

## Consistency Pass

- [x] Add error middleware (handle all HttpError throws)
- [x] Validate all POST/PUT bodies with Zod + validate middleware
- [x] Validate all GET queries with validateQuery middleware
- [x] Review all status codes: 201 create, 200 update, 404 not found, 409 conflict, 400 bad request
- [x] Remove any hardcoded res.status(500) outside error middleware
- [x] Test all endpoints with curl

## Verification and PR

- [x] Run `npm run typecheck` and `npm run lint`
- [ ] Create commit with todo.md
- [ ] Create commits for each feature
- [ ] Push to session-2 branch
- [ ] Open PR with description (what built, AI assistance, one AI mistake, exit ticket)
