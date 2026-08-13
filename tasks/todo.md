# Session 1 Homework 
 
## Domain 
 
- [x] Create `src/domain.ts` with the required types and generic `findById`. 
 
## Server and routes 
 
- [x] Create the raw Node.js HTTP server. 
- [x] Implement `GET /health`, `GET /events`, and `GET /events/:id`. 
- [x] Return JSON 404 responses for unknown routes. 
 
## Data loading 
 
- [x] Load `data/events.json` lazily using `node:fs/promises`. 
- [x] Handle read errors with `try/catch` and return JSON 500 without crashing. 
 
## Verification and PR 
 
- [x] Create the `session-1` branch and make logical commits. 
- [x] Run typecheck, lint, and curl tests.
- [ ] Prepare the PR description, including AI assistance, verification, and one concrete AI mistake.