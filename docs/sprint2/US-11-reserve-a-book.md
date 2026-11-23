# US-11 — Reserve a Book

| Field | Value |
|---|---|
| Epic | E4 Reservations |
| Priority | Must |
| Story Points | 5 |
| Requirement | FR-09 |
| GitHub Issue | #32 |
| Planned implementation | Sprint 3 (requirements refined in Sprint 2) |
| Owner | Türkan Eda Uluçay (QA & Test Automation Engineer) |
| Dependencies | US-06 (Availability), US-07 (Check out), US-08 (Eligibility rules) |
| Related NFRs | NFR-03, NFR-04, NFR-05, NFR-06, NFR-07 |

## User Story

> As a **member**, I want to **reserve a book that is on loan** so that **I get it when it is returned**.

## Business Rules

| ID | Rule |
|---|---|
| BR-11-1 | A reservation can be placed **only when the book has 0 available copies** (badge `ON_LOAN` from US-06). If a copy is on the shelf, the member is told to borrow it instead. |
| BR-11-2 | A reservation cannot be placed when **no copy is in circulation** (badge `UNAVAILABLE`: all copies lost or in maintenance), because the hold could never be fulfilled. |
| BR-11-3 | A member cannot hold **two active reservations for the same book** (`PENDING` or `CONFIRMED`). |
| BR-11-4 | A member cannot reserve a book they **currently have on loan**. |
| BR-11-5 | A member who is **blocked from borrowing** by the US-08 rules (loan limit reached or unpaid fines above the threshold) cannot place a reservation. |
| BR-11-6 | A member may have at most **3 active reservations** at the same time (default; configurable per member type with US-19). |
| BR-11-7 | The queue is **first come, first served**, ordered by `reservedAt`. The member is told their queue position. |
| BR-11-8 | The reservation is always created for the **authenticated member**. The `borrowerId` is taken from the token, not trusted from the request body. |

## Reservation Lifecycle

```
PENDING ──(copy checked in, US-09)──▶ CONFIRMED ──(member borrows, US-07)──▶ FULFILLED
   │                                     │
   │                                     └──(pickup window of 3 days ends)──▶ EXPIRED
   └──(member/librarian cancels, US-13)──▶ CANCELLED   (also possible from CONFIRMED)
```

- `PENDING`: the member is waiting in the queue.
- `CONFIRMED`: a returned copy is held for this member (copy status `RESERVED`); `expiresAt` = confirmation time + 3 days.
- `EXPIRED`: the member did not collect the copy in time; the copy moves to the next member in the queue, or becomes `AVAILABLE`.

## Acceptance Criteria

1. **Successful reservation.** Given a book with 0 available copies and at least one copy on loan, and an eligible member, when the member reserves it, then a reservation with status `PENDING` is created, the response is `201 Created`, and it contains the member's **queue position**.
2. **Copy on the shelf.** Given a book with at least one available copy, when a member tries to reserve it, then the request is rejected with `409` (`code: COPY_AVAILABLE`) and the UI suggests going to the shelf shown by US-06.
3. **No copy in circulation.** Given a book whose copies are all lost or in maintenance, when a member tries to reserve it, then the request is rejected with `409` (`code: NO_CIRCULATING_COPY`).
4. **Duplicate reservation.** Given a member who already has an active reservation for the book, when they reserve it again, then the request is rejected with `409` (`code: DUPLICATE_RESERVATION`) and no second reservation exists.
5. **Book already held.** Given a member who currently has the book on loan, when they try to reserve it, then the request is rejected with `409` (`code: ALREADY_ON_LOAN`).
6. **Blocked member.** Given a member over the loan limit or with unpaid fines above the threshold, when they try to reserve, then the request is rejected with `403` (`code: MEMBER_BLOCKED`) and the reason is shown.
7. **Reservation limit.** Given a member with 3 active reservations, when they place a fourth, then the request is rejected with `403` (`code: RESERVATION_LIMIT_REACHED`).
8. **Queue order.** Given members A, B and C reserve the same book in that order, then their queue positions are 1, 2 and 3; when a copy is checked in, A's reservation becomes `CONFIRMED`.
9. **Concurrent requests.** Given the same member sends the same reservation request twice at the same moment, then exactly one reservation is created (NFR-04).
10. **Authentication.** A request without a valid token returns `401`; a reservation is never created for a different member than the authenticated one.
11. **Audit.** Every reservation state change is written to the audit log with actor, time, previous and new state (NFR-05).

## API Mapping

| Operation | Endpoint | Responses |
|---|---|---|
| Place a reservation | `POST /api/v1/reservations` | `201`, `400`, `401`, `403`, `404`, `409` |

### Required changes to `docs/openapi.yaml`

1. The description of `createReservation` says *"reserve an available or soon-to-be-available book"*. This contradicts BR-11-1; change it to *"reserve a book that currently has no available copy"*.
2. Add `queuePosition` (integer, ≥ 1) to the `Reservation` schema.
3. Add a `404` response (`BOOK_NOT_FOUND`) and document the `409` and `403` problem codes listed above.
4. Remove `borrowerId` from `NewReservation` (taken from the token, BR-11-8), or document that it must equal the authenticated member.
5. Add a security scheme (JWT bearer) so the `401` case is part of the contract (see NFR-03).

## Test Cases

| ID | Type | Precondition | Steps | Expected result |
|---|---|---|---|---|
| TC-11-01 | API | Book BK-1043: 0 available, copies on loan; member eligible | `POST /reservations` | `201`, status `PENDING`, `queuePosition: 1` |
| TC-11-02 | API | Book BK-1042 has an available copy | `POST /reservations` | `409 COPY_AVAILABLE`, no reservation created |
| TC-11-03 | API | Book BK-2001: only copy is lost | `POST /reservations` | `409 NO_CIRCULATING_COPY` |
| TC-11-04 | API | Member already has a `PENDING` reservation for BK-1043 | `POST /reservations` again | `409 DUPLICATE_RESERVATION`; still one reservation |
| TC-11-05 | API | Member has BK-1043 on loan | `POST /reservations` | `409 ALREADY_ON_LOAN` |
| TC-11-06 | API | Member's unpaid fines above threshold | `POST /reservations` | `403 MEMBER_BLOCKED` |
| TC-11-07 | API | Member has 3 active reservations | Reserve a 4th book | `403 RESERVATION_LIMIT_REACHED` |
| TC-11-08 | Integration | Members A, B, C | Reserve in order, then check in one copy (US-09) | Positions 1, 2, 3; A becomes `CONFIRMED`, copy status `RESERVED` |
| TC-11-09 | Concurrency | Eligible member | Send 20 identical requests in parallel | Exactly 1 × `201`, others `409 DUPLICATE_RESERVATION` |
| TC-11-10 | Security | — | Request without token; request with `borrowerId` of another member | `401`; reservation created for the token's member only (or `403`) |
| TC-11-11 | API | — | Unknown `bookId` | `404 BOOK_NOT_FOUND` (RFC 7807) |
| TC-11-12 | Integration | `CONFIRMED` reservation | Advance time past `expiresAt` | Status `EXPIRED`; copy passes to next in queue or becomes `AVAILABLE` |
| TC-11-13 | Audit | — | Run TC-11-01 and TC-11-08 | Audit records exist for every transition |
| TC-11-14 | Usability | Figma prototype | Student searches and reserves a book | Done in ≤ 90 s (NFR-07) |

## Open Questions for the Product Owner

1. Is a limit of 3 active reservations per member acceptable as the default (BR-11-6)?
2. Is a 3-day pickup window acceptable for `CONFIRMED` reservations?
3. Should academic staff get priority in the queue, or is strict FIFO kept for all member types?

## Definition of Done (implementation, Sprint 3)

- [ ] Endpoint implemented and `docs/openapi.yaml` updated with the changes above.
- [ ] Automated tests for every acceptance criterion (TC-11-01 … TC-11-13).
- [ ] Concurrency test passes (NFR-04).
- [ ] Reviewed by at least one teammate and merged into `develop`.
