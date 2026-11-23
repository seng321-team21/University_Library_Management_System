# Acceptance Test Plan & Traceability Matrix — Sprint 2

| Field | Value |
|---|---|
| Project | UniLib – University Smart Library & Resource Management System |
| Sprint | Sprint 2 (Requirements & Architecture) |
| Owner (A/R) | Türkan Eda Uluçay (QA & Test Automation Engineer) — see RACI in `docs/sprint2/scrum-master-report.md` |
| Consulted | Rana Tokmak (PO), Ahmet Oba (SM), Ozan Kenan Güngör (Integration) |
| Related documents | `docs/sprint2/nfr-quality-measures.md`, `docs/sprint2/US-*.md`, `docs/openapi.yaml`, `docs/architecture.md` |
| Status | Draft for review |

## 1. Purpose and Scope

This plan defines **how UniLib is verified** and links every requirement to the tests that prove it.

- **In scope (Sprint 2):** acceptance scenarios for the Sprint 2 committed stories (US-05, US-06, US-07, US-09); refined test cases for the QA-owned stories (US-08, US-11, US-13, US-15); the full requirement → story → test traceability matrix; a consistency audit of the Sprint 2 artifacts.
- **Out of scope:** payment gateway, RFID/barcode hardware drivers, inter-library loan and production SSO (deferred in the Sprint 1 scope).

## 2. Test Levels and Tools

| Level | What is tested | Tool | Owner | Runs |
|---|---|---|---|---|
| Unit | Business rules: availability badge, eligibility, fine calculation, queue order | `node:test` (current backend, PR #52) | Developer of the story | Every commit / PR |
| API / contract | Endpoints, status codes, RFC 7807 bodies against `docs/openapi.yaml` | `node:test` + `fetch` | QA + developer | Every PR |
| Integration | Multi-step flows: checkout → overdue → check-in → fine; reservation queue | `node:test` against Docker Compose stack | QA | Every PR into `develop` |
| Concurrency | Last-copy races, parallel checkouts (NFR-04) | `node:test` with `Promise.all` | QA | Sprint 3 onwards |
| Performance | NFR-01, NFR-02 | `k6` (chosen in IMP-04) | QA | Once per sprint |
| UI / E2E | Member and librarian flows | Manual scripted tests (Sprint 2–3), Playwright (Sprint 4, optional) | QA | Before each release tag |
| Usability | NFR-07 (≤ 90 s search-to-reservation) | Moderated test, 5 students, Figma prototype | QA + Integration | Sprint 2 (prototype), Sprint 4 (real UI) |

If the backend moves to Spring Boot (as allowed in `docs/architecture.md`), unit and API tests move to JUnit 5 + RestAssured; the test cases in this plan stay the same.

## 3. Test Environment and Data

| Item | Description |
|---|---|
| Environment | Local Docker Compose stack (API + PostgreSQL 16), same as the deployment view in `docs/architecture.md` |
| Functional seed | 100-book seed covering every copy status, Turkish titles, member types and an overdue loan (Sprint 1 commitment; current seed in PR #52 has 4 books) |
| Performance seed | Generated 10,000-book catalog for NFR-01 |
| Test accounts | One per role: student, academic staff, librarian, admin; two students for privacy tests (NFR-08) |
| Clock control | Fine and expiry tests set the "current date" explicitly instead of using the system clock |

## 4. Entry and Exit Criteria

**Entry (a story can be tested when):** it meets the Definition of Ready, its acceptance criteria are in Given/When/Then form, and the endpoint is documented in `docs/openapi.yaml`.

**Exit (a story is accepted when):**

1. Every acceptance criterion has at least one passing automated test.
2. No open critical or high defects on the story.
3. The NFR checks scheduled for the story pass (`nfr-quality-measures.md`, section 7).
4. The PR is approved by at least one teammate and merged into `develop`.

## 5. Defect Management

- Every defect is a GitHub Issue created from `.github/ISSUE_TEMPLATE/bug_report.md`, with a `severity:<critical|high|medium|low>` label (definitions in `nfr-quality-measures.md`, section 6), the related story, and steps to reproduce.
- Critical and high defects block the release tag; medium and low defects are listed in the release notes.
- The fix PR references the bug (`Closes #<bug>`) and adds a regression test.

## 6. Acceptance Scenarios — Sprint 2 Committed Stories

### US-05 — Search catalog (#26)

| ID | Given | When | Then |
|---|---|---|---|
| AT-05-01 | a catalog of 10,000 books | a member searches by a partial title | matching books are returned in under 2 s (NFR-01) |
| AT-05-02 | a book titled "Çalıkuşu" | a member searches `çalıkuşu`, `ÇALIKUŞU` or `Calikusu`* | the book is found; search is case-insensitive with Turkish rules (NFR-09) |
| AT-05-03 | books by "Robert C. Martin" | a member searches by author or by ISBN `978-0132350884` | the correct books are returned |
| AT-05-04 | no book matches | a member searches `xyzxyz` | an empty list (`200`) and the message "No books found" |
| AT-05-05 | — | the request has an invalid parameter (e.g. `availableOnly=maybe`) | `400` with an RFC 7807 Problem (NFR-06) |
| AT-05-06 | some matches have 0 available copies | the member filters with `availableOnly=true` | only books with at least one available copy are returned |

\* Accent-insensitive matching (`Calikusu`) is a proposal; to be confirmed by the PO.

### US-06 — Availability and shelf location (#27)

Detailed criteria are in `docs/sprint2/US-06-book-availability-shelf-location.md` (PR #52). Acceptance scenarios:

| ID | Given | When | Then |
|---|---|---|---|
| AT-06-01 | BK-1042 with 2 available and 2 on-loan copies | a member opens the book page | totals 4 / 2, badge `AVAILABLE`, shelf of an available copy |
| AT-06-02 | BK-1043 with copies only on loan or reserved | the page is opened | badge `ON_LOAN`, 0 available |
| AT-06-03 | BK-2001 whose only copy is lost | the page is opened | badge `UNAVAILABLE` and **no shelf location** (defect reported in the PR #52 review) |
| AT-06-04 | a copy is checked out (US-07) | the page is opened again | counts and badge reflect the change |
| AT-06-05 | — | unknown id / invalid id | `404 BOOK_NOT_FOUND` / `400 INVALID_BOOK_ID` |

### US-07 — Check out a copy (#28)

| ID | Given | When | Then |
|---|---|---|---|
| AT-07-01 | an available copy and an eligible member | the librarian scans the copy barcode | `201`, loan `ACTIVE`, due date = checkout date + 14 days, copy status `ON_LOAN` |
| AT-07-02 | a copy already on loan | the librarian scans it | `409 COPY_UNAVAILABLE`, no second loan |
| AT-07-03 | an unknown barcode | the librarian scans it | `404` |
| AT-07-04 | a member blocked by US-08 rules | the librarian scans a copy | `403` with the reason (see US-08) |
| AT-07-05 | a student token | the student calls the checkout endpoint | `403 FORBIDDEN_ROLE` (NFR-03) |
| AT-07-06 | a copy `RESERVED` for member A | the librarian checks it out to member B | `409`; checking it out to A fulfils A's reservation |
| AT-07-07 | the last available copy | two librarians check it out at the same moment | exactly one `201`, one `409` (NFR-04) |

### US-09 — Check in a copy (#30)

| ID | Given | When | Then |
|---|---|---|---|
| AT-09-01 | an active loan returned on time | the librarian checks it in | `200`, loan `RETURNED`, copy `AVAILABLE`, no fine |
| AT-09-02 | an overdue loan | the librarian checks it in | the fine is calculated by the US-15 rules and returned in the response |
| AT-09-03 | the book has a reservation queue | a copy is checked in | copy status `RESERVED`, first reservation `CONFIRMED`, member notified (US-12) |
| AT-09-04 | a loan already returned | it is checked in again | `409`, no second fine |
| AT-09-05 | an unknown loan id | check-in is called | `404` |
| AT-09-06 | — | any check-in | audit record with librarian, time, previous and new state (NFR-05) |

## 7. QA-Owned Stories — Refined Test Cases

| Story | Issue | Document | Test cases | Implementation sprint |
|---|---|---|---|---|
| US-08 Block ineligible loans | #29 | `US-08-block-ineligible-loans.md` | TC-08-01 … TC-08-12 | Sprint 3 |
| US-11 Reserve a book | #32 | `US-11-reserve-a-book.md` | TC-11-01 … TC-11-14 | Sprint 3 |
| US-13 Cancel a reservation | #34 | `US-13-cancel-reservation.md` | TC-13-01 … TC-13-10 | Sprint 4 |
| US-15 Calculate fines | #36 | `US-15-calculate-fines.md` | TC-15-01 … TC-15-13 | Sprint 3 |

## 8. Traceability Matrix

### 8.1 Functional requirements → stories → tests

| FR | Story | Issue | Priority | Endpoint (`openapi.yaml`) | Tests | Related NFRs | Test design status |
|---|---|---|---|---|---|---|---|
| FR-01 | US-01 University login | #22 | Must | — (not in contract yet) | Planned | NFR-03 | Planned |
| FR-01 | US-02 Assign roles | #23 | Must | — | Planned (role × endpoint matrix) | NFR-03 | Planned |
| FR-04 | US-03 Add book & copies | #24 | Must | `POST /books` (architecture only) | Planned | NFR-06, NFR-13 | Planned |
| FR-04 | US-04 Edit / remove book | #25 | Must | — | Planned | NFR-05, NFR-06 | Planned |
| FR-02 | US-05 Search catalog | #26 | Must | `GET /books` | AT-05-01 … 06 | NFR-01, NFR-09 | **Designed** |
| FR-03 | US-06 Availability & shelf | #27 | Must | `GET /books/{bookId}` | AT-06-01 … 05; 19 automated tests in PR #52 | NFR-06 | **Designed, partly automated** |
| FR-05 | US-07 Check out | #28 | Must | `POST /loans/checkout` | AT-07-01 … 07 | NFR-03, NFR-04, NFR-05 | **Designed** |
| FR-06 | US-08 Block ineligible loans | #29 | Must | `POST /loans/checkout` (403) | TC-08-01 … 12 | NFR-04, NFR-05 | **Designed** |
| FR-07 | US-09 Check in | #30 | Must | `PUT /loans/{loanId}/return` | AT-09-01 … 06 | NFR-05 | **Designed** |
| FR-08 | US-10 Renew loan | #31 | Should | — | Planned | NFR-03 | Planned (Sprint 4) |
| FR-09 | US-11 Reserve a book | #32 | Must | `POST /reservations` | TC-11-01 … 14 | NFR-03, NFR-04, NFR-07 | **Designed** |
| FR-10 | US-12 Ready notification | #33 | Should | — | Planned | — | Planned (Sprint 4) |
| FR-09 | US-13 Cancel reservation | #34 | Should | `PUT /reservations/{id}/cancel` | TC-13-01 … 10 | NFR-03, NFR-05 | **Designed** |
| FR-11 | US-14 Due-date reminder | #35 | Should | — | Planned | — | Planned (Sprint 4) |
| FR-12 | US-15 Calculate fines | #36 | Must | `PUT /loans/{loanId}/return` + fines endpoint (missing) | TC-15-01 … 13 | NFR-05, NFR-08, NFR-10 | **Designed** |
| FR-12 | US-16 Pay / waive fine | #37 | Must | — | Planned | NFR-05 | Planned (Sprint 3) |
| FR-13 | US-17 Member dashboard | #38 | Must | — | Planned | NFR-08, NFR-11 | Planned (Sprint 3) |
| FR-13 | US-18 Borrowing history | #39 | Could | — | Planned | NFR-08 | Planned |
| FR-14 | US-19 Loan rules per member type | #40 | Should | — | Planned | NFR-03 | Planned (Sprint 4) |
| FR-15 | US-20 Overdue list | #41 | Must | — | Planned | NFR-03 | Planned (Sprint 3) |
| FR-15 | US-21 Reports | #42 | Could | — | Planned | NFR-02 | Planned |
| FR-16 | US-22 Suggest a purchase | #43 | Won't | — | — | — | Out of release |

Issue numbers follow the backlog import (US-n = #n+21).

### 8.2 Non-functional requirements → verification

| NFR | Verified by | Stories | Sprint |
|---|---|---|---|
| NFR-01 Search time | AT-05-01, k6 search scenario | US-05 | 2–3 |
| NFR-02 Load | k6 endpoint scenarios | US-06, 07, 09, 11 | 3 |
| NFR-03 RBAC | Role × endpoint tests, AT-07-05, TC-11-10, TC-13-04 | US-01, 02 + all | 2–3 |
| NFR-04 Concurrency | AT-07-07, TC-08-10, TC-11-09 | US-07, 08, 11 | 3 |
| NFR-05 Audit | AT-09-06, TC-11-13, TC-13-10, TC-15-13 | Circulation & reservations | 3 |
| NFR-06 Error format | AT-05-05, AT-06-05, PR #52 API tests | All API stories | 2 |
| NFR-07 Usability | Moderated Figma test | US-05, 06, 11 | 2, 4 |
| NFR-08 Privacy | TC-15-12, dashboard tests | US-15, 17, 18 | 3 |
| NFR-09 Turkish | AT-05-02 | US-05 | 2 |
| NFR-10 Coverage | Coverage report in CI | All | 2–4 |
| NFR-11 Accessibility | Lighthouse, WCAG checklist | US-05, 06, 17 | 3 |
| NFR-12 Setup | Fresh-clone smoke test | All | 2–4 |
| NFR-13 Validation | Negative API tests, `npm audit` | All API stories | 2–4 |

## 9. QA Consistency Audit of Sprint 2 Artifacts

Differences found between `docs/openapi.yaml` (contract, the source of truth per ADR-04) and `docs/architecture.md` (PR #54). They must be resolved before implementation starts in Sprint 3, otherwise tests written against one document will fail against the other.

| # | Topic | `openapi.yaml` | `architecture.md` | Proposed resolution |
|---|---|---|---|---|
| 1 | Base path | `/api/v1` | `/api/...` | Use `/api/v1` everywhere |
| 2 | Cancel reservation | `PUT /reservations/{id}/cancel` | `DELETE /api/reservations/{id}` | Keep `PUT …/cancel` (cancellation is a status change, US-13 BR-13-5) |
| 3 | Check in | `PUT /loans/{loanId}/return` | `POST /api/loans/checkin` | Choose one and update the other document |
| 4 | Reservation status names | `PENDING, CONFIRMED, CANCELLED, FULFILLED, EXPIRED` | `WAITING_IN_QUEUE` | Use the contract enum |
| 5 | Duplicate reservation | `409` | `400 Bad Request` | `409 DUPLICATE_RESERVATION` (US-11 AC 4) |
| 6 | Fine rule for eligibility | — | "unpaid fines == 0" | 50.00 TRY threshold + overdue rule agreed in IMP-02 (US-08) |
| 7 | Concurrency requirement ID | NFR-04 in `nfr-quality-measures.md` | cited as NFR-01, NFR-02 | Cite NFR-04 |
| 8 | Fines endpoints | missing | `GET /api/fines`, `POST /api/fines/{id}/settle` | Add to the contract |
| 9 | Security scheme | missing | JWT bearer (ADR-03) | Add `securitySchemes` to the contract |
| 10 | Shelf location for lost copies | — | — | Defect in PR #52 (review comment), AT-06-03 |

## 10. Schedule

| Sprint | QA activities |
|---|---|
| Sprint 2 | NFR specification, this plan, refined test cases, consistency audit, PR reviews, Figma usability test |
| Sprint 3 | Automate tests for US-07, 08, 09, 11, 15, 16, 17, 20; concurrency and audit tests; k6 baseline; GitHub Actions test job with EN-2 |
| Sprint 4 | Remaining stories, full regression, NFR re-measurement, release sign-off for `v1.0.0` |
