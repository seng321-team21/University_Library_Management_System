# US-15 — Calculate Fines

| Field | Value |
|---|---|
| Epic | E5 Fines & Notifications |
| Priority | Must |
| Story Points | 5 |
| Requirement | FR-12 |
| GitHub Issue | #36 |
| Planned implementation | Sprint 3 (requirements refined in Sprint 2) |
| Owner | Türkan Eda Uluçay (QA & Test Automation Engineer) |
| Dependencies | US-09 (Check in); US-19 (rates per member type, Sprint 4) |
| Related NFRs | NFR-05, NFR-08, NFR-10 (≥ 90 % coverage for fine rules) |

## User Story

> As the **system**, I want to **calculate fines for each overdue day** so that **librarians don't compute them by hand**.

## Calculation Rule

```
fine = chargeableOverdueDays × dailyRate(memberType at check-in time)
```

| ID | Rule |
|---|---|
| BR-15-1 | A loan is due at **23:59:59 (Europe/Istanbul) on its due date**. A return on or before that moment has **no fine**. |
| BR-15-2 | **Overdue days** are the calendar days after the due date up to and including the return date. |
| BR-15-3 | **Chargeable days** are overdue days on which the library is **open**. Days in the configurable **holiday / closed-day list** are not charged. |
| BR-15-4 | The **daily rate** is the rate of the member's type **at the moment of check-in**, not at the due date. |
| BR-15-5 | Until US-19 (Sprint 4) makes rates configurable, the default rates are: Student **5.00 TRY/day**, Academic staff **3.00 TRY/day**. *(Proposed — to be confirmed by the PO.)* |
| BR-15-6 | Amounts are stored as **integer kuruş** (1 TRY = 100 kuruş) to avoid rounding errors, and shown with 2 decimals. |
| BR-15-7 | A fine record is created **automatically at check-in** (US-09) with status `UNPAID`. It can later be set to `PAID` or `WAIVED` (US-16). |
| BR-15-8 | For loans that are still out and overdue, the dashboard (US-17) shows an **accrued fine preview**, computed with the same rule but not stored. |
| BR-15-9 | A fine cannot be negative, and no fine record is created when the amount is 0. |

## Acceptance Criteria

1. **On time.** Given a loan returned on its due date (any time up to 23:59:59), then no fine is created.
2. **Overdue.** Given a student loan due on 2026-12-01 and returned on 2026-12-04, with no closed days in between, then a fine of 3 × 5.00 = **15.00 TRY** is created with status `UNPAID`.
3. **Closed days excluded.** Given the same loan and 2026-12-03 is in the closed-day list, then the fine is 2 × 5.00 = **10.00 TRY**.
4. **Rate at check-in.** Given the daily rate changes after the due date but before check-in, then the fine uses the rate valid at check-in.
5. **Member type.** Given an academic-staff loan overdue by 2 chargeable days, then the fine is 2 × 3.00 = **6.00 TRY**.
6. **Midnight boundary.** A return at 23:59:59 on the due date has no fine; a return at 00:00:00 the next day has 1 overdue day.
7. **Check-in response.** The check-in response (US-09) includes the fine amount, so the librarian sees it immediately.
8. **Visibility.** Only the member and library staff can see a member's fines (NFR-08).
9. **Audit.** Creating a fine, and every later status change, is written to the audit log (NFR-05).

## API Mapping

| Operation | Endpoint | Note |
|---|---|---|
| Fine created on return | `PUT /api/v1/loans/{loanId}/return` | Response should include the fine (amount, chargeable days, rate) |
| List a member's fines | `GET /api/fines` (FineController in `docs/architecture.md`) — **not yet in `openapi.yaml`** | Needed by US-08, US-16, US-17 |

### Required changes to `docs/openapi.yaml`

1. Add a `Fine` schema: `id`, `loanId`, `memberId`, `chargeableDays`, `dailyRateKurus`, `amountKurus`, `status` (`UNPAID`, `PAID`, `WAIVED`), `createdAt`.
2. Add the fine (or `null`) to the response of `returnBook`.
3. Add the fines endpoints designed in `docs/architecture.md` (`GET /api/fines`, `POST /api/fines/{id}/settle`) to the contract under the `/api/v1` base path (used by US-08, US-16 and US-17).

## Test Cases

Boundary-value analysis is used because the rule is purely arithmetic; this module targets ≥ 90 % line coverage (NFR-10).

| ID | Type | Input | Expected result |
|---|---|---|---|
| TC-15-01 | Unit | Returned 1 day before the due date | No fine |
| TC-15-02 | Unit | Returned on the due date, 23:59:59 | No fine |
| TC-15-03 | Unit | Returned the day after, 00:00:00 | 1 day × rate |
| TC-15-04 | Unit | Student, 3 overdue days, no closed days | 15.00 TRY (1500 kuruş) |
| TC-15-05 | Unit | Student, 3 overdue days, 1 closed day | 10.00 TRY |
| TC-15-06 | Unit | All overdue days are closed days | No fine |
| TC-15-07 | Unit | Due date itself is a closed day, returned next open day | 0 or 1 day — **depends on PO answer (Q1)** |
| TC-15-08 | Unit | Academic staff, 2 chargeable days | 6.00 TRY |
| TC-15-09 | Unit | Rate changed between due date and check-in | Rate at check-in used |
| TC-15-10 | Unit | 45 overdue days | Correct amount, no overflow (check cap after Q2) |
| TC-15-11 | Integration | Check in an overdue copy via `PUT /loans/{id}/return` | Fine `UNPAID` stored; amount in response |
| TC-15-12 | Security | Member A requests member B's fines | `403` |
| TC-15-13 | Audit | Run TC-15-11 | Audit record for fine creation |

## Open Questions for the Product Owner

1. If the **due date falls on a closed day**, should the due date move to the next open day (common library practice)?
2. Should there be a **maximum fine** per loan (e.g. the book's replacement cost)?
3. Are the default rates in BR-15-5 correct, and are there other member types?
4. Which days are closed by default (Sundays? official holidays)? Who maintains the list?

## Definition of Done (implementation, Sprint 3)

- [ ] Fine calculation implemented as a pure, separately tested function.
- [ ] `docs/openapi.yaml` updated with the changes above.
- [ ] All test cases pass; line coverage of the fine module ≥ 90 %.
- [ ] Reviewed by at least one teammate and merged into `develop`.
