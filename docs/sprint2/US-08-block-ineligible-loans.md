# US-08 — Block Ineligible Loans

| Field | Value |
|---|---|
| Epic | E3 Circulation |
| Priority | Must |
| Story Points | 3 |
| Requirement | FR-06 |
| GitHub Issue | #29 |
| Planned implementation | Sprint 3 (moved from Sprint 2 because the fine check depends on US-15) |
| Owner | Türkan Eda Uluçay (QA & Test Automation Engineer) |
| Dependencies | US-07 (Check out), US-15 (Calculate fines), US-16 (Pay / waive fine) |
| Related NFRs | NFR-03, NFR-05, NFR-06 |

## User Story

> As a **librarian**, I want the **system to block a loan when the member is over the limit or has unpaid fines** so that **rules are applied consistently**.

## Business Rules

| ID | Rule |
|---|---|
| BR-08-1 | **Loan limit.** A member can have at most *N* active loans. Default: Student **5**, Academic staff **10**. *(Proposed — to be confirmed by the PO; configurable with US-19.)* |
| BR-08-2 | **Fine threshold.** A member whose total `UNPAID` fines are **greater than 50.00 TRY** cannot borrow (threshold agreed by the PO, IMP-02 in the Sprint 2 Scrum Master report). A total exactly equal to the threshold is still allowed. |
| BR-08-2a | **Overdue loan.** A member who has **at least one overdue loan** that has not been returned yet cannot borrow (IMP-02). |
| BR-08-3 | The eligibility check runs **on the server** inside the checkout transaction (US-07), so two parallel checkouts cannot both pass the limit. |
| BR-08-4 | When the member pays or the librarian waives fines (US-16) so that the total drops to or below the threshold, the block is **lifted immediately**. |
| BR-08-5 | The librarian **cannot override** the block in this release; all members are treated the same way. |
| BR-08-6 | The same eligibility rules are reused by reservations (US-11, BR-11-5) and renewals (US-10). |

## Acceptance Criteria

1. **Eligible member.** Given a student with 4 active loans and 0 TRY unpaid fines, when the librarian checks out a copy, then the loan is created (`201`).
2. **Limit reached.** Given a student with 5 active loans, when the librarian tries to check out another copy, then the request is rejected with `403` (`code: LOAN_LIMIT_REACHED`), no loan is created, and the UI shows *"Loan limit reached (5/5)"*.
3. **Fines above threshold.** Given a member with 60.00 TRY unpaid fines, when a checkout is attempted, then it is rejected with `403` (`code: UNPAID_FINES`), and the UI shows the unpaid amount and the threshold.
4. **Fines at threshold.** Given a member with exactly 50.00 TRY unpaid fines, then the checkout is allowed.
5. **Overdue loan.** Given a member with one loan past its due date and not yet returned, when a checkout is attempted, then it is rejected with `403` (`code: OVERDUE_LOANS`).
6. **Several reasons.** Given a member who is blocked for more than one reason, then the response lists all reasons.
7. **Block lifted.** Given a blocked member whose fine is marked `PAID` or `WAIVED` (US-16), or whose overdue book is returned, when the librarian retries the checkout, then it succeeds.
8. **Parallel checkouts.** Given a student with 4 active loans, when two checkouts for that student are sent at the same moment, then exactly one succeeds and the other returns `403 LOAN_LIMIT_REACHED` (NFR-04).
9. **Audit.** A blocked checkout attempt is written to the audit log with the reason (NFR-05).

## API Mapping

| Operation | Endpoint | Responses |
|---|---|---|
| Checkout with eligibility check | `POST /api/v1/loans/checkout` | `201`, `400`, `401`, `403`, `409` |

### Required changes to `docs/openapi.yaml`

1. The `403` of `checkoutBook` is described as *"Action not allowed for current staff role"*. That mixes a **role** error with a **member eligibility** error. Keep `403` but return a Problem body with distinct codes: `FORBIDDEN_ROLE`, `LOAN_LIMIT_REACHED`, `UNPAID_FINES`, `OVERDUE_LOANS`.
2. Add an optional `reasons` array to the Problem body so that several reasons (AC 6) can be returned.
3. `docs/architecture.md` (sequence diagram 1) checks *"unpaid fines == 0"*. This must be aligned with the agreed 50.00 TRY threshold.

## Test Cases

Boundary-value analysis on both limits.

| ID | Type | Precondition | Expected result |
|---|---|---|---|
| TC-08-01 | API | Student, 4 active loans, 0 TRY | `201` |
| TC-08-02 | API | Student, 5 active loans | `403 LOAN_LIMIT_REACHED`; no loan created |
| TC-08-03 | API | Academic staff, 9 active loans | `201` |
| TC-08-04 | API | Academic staff, 10 active loans | `403 LOAN_LIMIT_REACHED` |
| TC-08-05 | API | 49.99 TRY unpaid | `201` |
| TC-08-06 | API | 50.00 TRY unpaid | `201` |
| TC-08-07 | API | 50.01 TRY unpaid | `403 UNPAID_FINES` |
| TC-08-08 | API | Over limit and over threshold | `403`, `reasons` contains both codes |
| TC-08-08a | API | 0 TRY fines, 1 overdue loan not returned | `403 OVERDUE_LOANS` |
| TC-08-09 | Integration | Blocked by fines → fine `WAIVED` (US-16) → retry | `201` |
| TC-08-10 | Concurrency | Student with 4 loans, 2 parallel checkouts | Exactly one `201`, one `403` |
| TC-08-11 | UI | Blocked checkout in the librarian screen | Message shows reason and numbers |
| TC-08-12 | Audit | Run TC-08-02 | Audit record of the blocked attempt |

## Open Questions for the Product Owner

1. Are the default loan limits (5 / 10) correct?
2. Is a total of exactly 50.00 TRY still allowed (BR-08-2), or is the block "≥ 50.00 TRY"?
3. Should the librarian be allowed to override the block in special cases (BR-08-5)?

## Definition of Done (implementation, Sprint 3)

- [ ] Eligibility check implemented inside the checkout transaction.
- [ ] `docs/openapi.yaml` updated with the changes above.
- [ ] All test cases pass, including the concurrency test.
- [ ] Reviewed by at least one teammate and merged into `develop`.
