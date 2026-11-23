# US-13 — Cancel a Reservation

| Field | Value |
|---|---|
| Epic | E4 Reservations |
| Priority | Should |
| Story Points | 2 |
| Requirement | FR-09 |
| GitHub Issue | #34 |
| Planned implementation | Sprint 4 (requirements refined in Sprint 2) |
| Owner | Türkan Eda Uluçay (QA & Test Automation Engineer) |
| Dependencies | US-11 (Reserve a book) |
| Related NFRs | NFR-03, NFR-05, NFR-06, NFR-08 |

## User Story

> As a **member**, I want to **cancel my reservation** so that **the book goes to the next person**.

## Business Rules

| ID | Rule |
|---|---|
| BR-13-1 | A member can cancel **only their own** reservations. A librarian can cancel any reservation and must give a reason. |
| BR-13-2 | Only **active** reservations (`PENDING` or `CONFIRMED`) can be cancelled. `CANCELLED`, `FULFILLED` and `EXPIRED` reservations cannot. |
| BR-13-3 | Cancelling a `PENDING` reservation moves every member behind it **one place up** in the queue. |
| BR-13-4 | Cancelling a `CONFIRMED` reservation releases the held copy: it is **passed to the next member** in the queue (their reservation becomes `CONFIRMED` and they are notified, US-12), or it becomes `AVAILABLE` if the queue is empty. |
| BR-13-5 | Cancellation is a status change, not a deletion. The record stays for history and audit. |

## Acceptance Criteria

1. **Cancel a pending reservation.** Given a member with a `PENDING` reservation, when they cancel it, then its status becomes `CANCELLED`, the response is `200 OK` with the updated reservation, and members behind them move up one position.
2. **Cancel a confirmed reservation.** Given a `CONFIRMED` reservation with a held copy and another member waiting, when the first member cancels, then the next member's reservation becomes `CONFIRMED` and the copy stays `RESERVED` for them.
3. **Last in queue.** Given a `CONFIRMED` reservation and nobody else waiting, when it is cancelled, then the copy status becomes `AVAILABLE` and the book's availability (US-06) updates immediately.
4. **Someone else's reservation.** Given member A, when A tries to cancel member B's reservation, then the request is rejected with `403` (`code: NOT_RESERVATION_OWNER`) and nothing changes.
5. **Not active.** Given a reservation that is already `CANCELLED`, `FULFILLED` or `EXPIRED`, when someone tries to cancel it, then the request is rejected with `409` (`code: RESERVATION_NOT_ACTIVE`).
6. **Unknown reservation.** An unknown reservation id returns `404` (`code: RESERVATION_NOT_FOUND`).
7. **Librarian cancellation.** A librarian can cancel any active reservation; the reason is stored and shown to the member.
8. **Confirmation in the UI.** The member is asked to confirm before cancelling, and sees a success message afterwards.
9. **Audit.** The cancellation is written to the audit log with actor, time, reason (if any), previous and new state (NFR-05).

## API Mapping

| Operation | Endpoint | Responses |
|---|---|---|
| Cancel a reservation | `PUT /api/v1/reservations/{reservationId}/cancel` | `200`, `400`, `401`, `403`, `404`, `409` |

### Required changes to `docs/openapi.yaml`

1. `cancelReservation` currently documents only `200`, `400` and `404`. Add `401`, `403` (`NOT_RESERVATION_OWNER`) and `409` (`RESERVATION_NOT_ACTIVE`).
2. Add an optional request body `{ "reason": string }`, required when a librarian cancels.

## Test Cases

| ID | Type | Precondition | Steps | Expected result |
|---|---|---|---|---|
| TC-13-01 | API | A (pos. 1), B (pos. 2), C (pos. 3) are `PENDING` | A cancels | `200`, A `CANCELLED`; B → 1, C → 2 |
| TC-13-02 | Integration | A `CONFIRMED` with held copy, B `PENDING` | A cancels | B `CONFIRMED`, copy stays `RESERVED`, B notified |
| TC-13-03 | Integration | A `CONFIRMED`, queue empty | A cancels | Copy `AVAILABLE`; `GET /books/{id}` shows `availableCopies` + 1 |
| TC-13-04 | Security | A and B each have a reservation | A cancels B's reservation | `403 NOT_RESERVATION_OWNER`; B's reservation unchanged |
| TC-13-05 | API | Reservation already `CANCELLED` | Cancel again | `409 RESERVATION_NOT_ACTIVE` |
| TC-13-06 | API | Reservation `FULFILLED` | Cancel | `409 RESERVATION_NOT_ACTIVE` |
| TC-13-07 | API | — | Cancel `RSV-0000` (unknown) | `404 RESERVATION_NOT_FOUND` (RFC 7807) |
| TC-13-08 | API | Librarian token | Cancel member's reservation with a reason | `200`; reason stored |
| TC-13-09 | Security | — | Cancel without token | `401` |
| TC-13-10 | Audit | — | Run TC-13-01 and TC-13-08 | Audit records with actor, time and reason |

## Open Questions for the Product Owner

1. Should a member be limited in how often they can reserve and cancel the same book (to stop queue-jumping abuse)?
2. Should a librarian cancellation send an email to the member, or only show it on the dashboard?

## Definition of Done (implementation, Sprint 4)

- [ ] Endpoint implemented and `docs/openapi.yaml` updated with the changes above.
- [ ] Automated tests for every acceptance criterion (TC-13-01 … TC-13-10).
- [ ] Reviewed by at least one teammate and merged into `develop`.
