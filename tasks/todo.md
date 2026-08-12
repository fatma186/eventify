# Session 1 Homework

## Domain

- [ ] Create `src/domain.ts` with the required types and generic `findById`.

## Server and routes

- [ ] Create the raw Node.js HTTP server.
- [ ] Implement `GET /health`, `GET /events`, and `GET /events/:id`.
- [ ] Return JSON 404 responses for unknown routes.

## Data loading

- [ ] Load `data/events.json` lazily using `node:fs/promises`.
- [ ] Handle read errors with `try/catch` and return JSON 500 without crashing.

## Verification and PR

- [ ] Create the `session-1` branch and make logical commits.
- [ ] Run typecheck, lint, and curl tests.
- [ ] Prepare the PR description, including AI assistance, verification, and one concrete AI mistake.