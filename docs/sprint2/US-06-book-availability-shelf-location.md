# US-06 — Book Availability & Shelf Location

| Field | Value |
|---|---|
| Epic | E2 Catalog |
| Feature | F03 Search and Copy Availability |
| Priority | Must |
| Story Points | 3 |
| Requirement | FR-03 |
| Sprint | Sprint 2 |
| Owner | Rana Tokmak (Product Owner) |
| Dependencies | US-03 (Add Book), US-05 (Catalog Search) |

## User Story

> As a **member**, I want to **see a book's availability and shelf location** so that **I know whether to go to the library**.

## Acceptance Criteria

1. **Copy counts are accurate.** Given a book with physical copies, when a member opens the book page, then the total copy count and the available copy count match the current copy records in the database.
2. **Availability badge.** The page shows one badge derived from the copy statuses:
   - `AVAILABLE` — at least one copy is on the shelf.
   - `ON_LOAN` — no copy is on the shelf, but at least one copy is on loan or held for a reservation.
   - `UNAVAILABLE` — no copy is in circulation (all lost / in maintenance, or the book has no copies).
3. **Shelf location.** The page shows where the member should go: the shelf of an available copy; if none is available, the shelf where most copies are kept.
4. **Per-copy list.** Every copy is listed with its barcode, shelf location and status.
5. **Always current.** After a checkout (US-07) or check-in (US-09) changes a copy's status, the next request reflects the change. Counts are computed from copy records, never stored separately.
6. **Errors.** An unknown book returns `404` with an RFC 7807 Problem (`code: BOOK_NOT_FOUND`); an invalid id returns `400` (`code: INVALID_BOOK_ID`).

## Definition of Done

- [x] `GET /api/v1/books/{bookId}` implemented and documented in `docs/openapi.yaml` (`BookDetail`, new `Copy` schema).
- [x] Member-facing availability page (`backend/public/`).
- [x] Unit tests for the availability rules and API tests for the endpoint (`npm test`, 19 tests).
- [ ] Peer review by at least one teammate (QA: Türkan Eda).
- [ ] Merged into `develop`.

## Implementation Notes

| Part | File |
|---|---|
| Copy model & in-memory repository | `backend/src/catalog/bookRepository.js` |
| Availability rules (counts, badge, shelf) | `backend/src/catalog/availabilityService.js` |
| HTTP endpoint & Problem responses | `backend/src/app.js`, `backend/src/http/problem.js` |
| Seed data (4 books, 9 copies) | `backend/src/data/seed.json` |
| Availability page | `backend/public/index.html`, `book.js`, `styles.css` |
| Tests | `backend/test/` |

- The backend uses only Node.js built-in modules (no `npm install` needed). Requires Node.js 20+.
- `BookRepository` is in-memory for now. When the EN-1 database schema is merged, it can be replaced with a DB-backed repository that exposes the same methods (`findBookById`, `findCopiesByBookId`, `updateCopyStatus`); the availability rules do not need to change.
- The response is a superset of the existing `Book` schema, so US-05 (search) can reuse `availableCopies` / `availabilityStatus` for search result badges.

## How to Run

```bash
cd backend
npm test          # run tests
npm start         # http://localhost:8080
```

- API: `http://localhost:8080/api/v1/books/BK-1042`
- Page: `http://localhost:8080/?bookId=BK-1042`

Seed books for a quick demo: `BK-1042` (available), `BK-1043` (all on loan), `BK-2001` (unavailable — lost copy), `BK-3005` (available, one copy in maintenance).
