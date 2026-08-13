# Session 2 Homework

## Bookings API

- [ ] Create `src/booking.service.ts` with in-memory Map store
- [ ] Implement POST /v1/bookings (create with CONFIRMED status)
- [ ] Implement GET /v1/bookings/:id
- [ ] Implement DELETE /v1/bookings/:id (set status to CANCELLED, keep record)
- [ ] Add duplicate booking check (userId + eventId pair)
- [ ] Add capacity check (count CONFIRMED bookings only)
- [ ] Create `src/booking.routes.ts` with all 5 endpoints

## Events Pagination & Filtering

- [ ] Create `src/validation.ts` with Zod schemas
- [ ] Add query schema for pagination (page, limit)
- [ ] Add query schema for filtering (venue, from, to)
- [ ] Create `validateQuery` middleware
- [ ] Update GET /v1/events with pagination (page, limit params)
- [ ] Add response envelope: { data, page, limit, total }
- [ ] Add filtering by venue (exact match)
- [ ] Add filtering by date range (from/to on startsAt)
- [ ] Ensure filtering happens BEFORE pagination

## Consistency Pass

- [ ] Add error middleware (handle all HttpError throws)
- [ ] Validate all POST/PUT bodies with Zod + validate middleware
- [ ] Validate all GET queries with validateQuery middleware
- [ ] Review all status codes: 201 create, 200 update, 404 not found, 409 conflict, 400 bad request
- [ ] Remove any hardcoded res.status(500) outside error middleware
- [ ] Test all endpoints with curl

## Verification and PR

- [ ] Run `npm run typecheck` and `npm run lint`
- [ ] Create commit with todo.md
- [ ] Create commits for each feature
- [ ] Push to session-2 branch
- [ ] Open PR with description (what built, AI assistance, one AI mistake, exit ticket)