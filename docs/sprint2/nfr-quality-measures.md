# Non-Functional Requirements & Quality Measures — Sprint 2

| Field | Value |
|---|---|
| Project | UniLib – University Smart Library & Resource Management System |
| Sprint | Sprint 2 (deliverable 2: non-functional requirements and quality-measure specifications) |
| Owner | Türkan Eda Uluçay (QA & Test Automation Engineer) |
| Reviewers | Berkay İnam (Lead Architect), Rana Tokmak (Product Owner) |
| Quality model | ISO/IEC 25010 product quality characteristics |
| Status | Draft for review |

## 1. Purpose

This document turns the team's non-functional expectations into **measurable, testable requirements**.
Every NFR below has:

- a **metric** and a **target value**,
- a **measurement method and tool**,
- a **pass / fail criterion** used as a quality gate,
- the **user stories** it constrains and the **sprint** in which it is first verified.

An NFR that cannot be measured cannot be accepted. Statements such as "the system should be fast" are not allowed in the backlog; they must be rewritten in the form used here.

IDs `NFR-01`, `NFR-03` and `NFR-08` are already referenced by the product backlog (US-05, US-02, US-18) and keep their meaning.

## 2. Summary

| ID | Quality characteristic (ISO 25010) | Requirement (short) | Target | Related stories | First verified |
|---|---|---|---|---|---|
| NFR-01 | Performance efficiency – time behaviour | Catalog search response time | p95 ≤ 2 s on 10,000 books | US-05 | Sprint 2 |
| NFR-02 | Performance efficiency – capacity | API response time under concurrent load | p95 ≤ 500 ms at 50 concurrent users | US-06, US-07, US-09, US-11 | Sprint 3 |
| NFR-03 | Security – authorization | Role-based access control | 100 % of role × endpoint matrix enforced | US-01, US-02 | Sprint 2 |
| NFR-04 | Reliability – data integrity | No double allocation of the last copy | Exactly 1 success in 50 parallel requests | US-07, US-11 | Sprint 2 |
| NFR-05 | Security – accountability | Auditable state transitions | 100 % of transitions logged | US-07, US-09, US-11, US-13, US-16 | Sprint 3 |
| NFR-06 | Reliability – fault tolerance | Consistent, safe error responses | 100 % of 4xx/5xx are RFC 7807, no stack traces | All API stories | Sprint 2 |
| NFR-07 | Usability – operability | Primary success metric: search-to-reservation | ≤ 90 s for 80 % of test users | US-05, US-06, US-11 | Sprint 2 (prototype) |
| NFR-08 | Security – confidentiality | Privacy of borrowing history and fines | 0 cross-member data leaks | US-17, US-18 | Sprint 3 |
| NFR-09 | Usability – Turkish language support | Turkish characters and TR/EN interface | 100 % of i18n test set passes | US-05, EN-3 | Sprint 2 |
| NFR-10 | Maintainability – testability | Automated test coverage and CI health | ≥ 70 % line coverage, 0 failing tests on `develop` | All | Sprint 2 |
| NFR-11 | Usability – accessibility | Accessible member-facing pages | WCAG 2.1 AA, Lighthouse accessibility ≥ 90 | US-05, US-06, US-17 | Sprint 3 |
| NFR-12 | Portability / compatibility | Easy setup, supported browsers and screen sizes | 1-command start; Chrome, Firefox, Edge; ≥ 360 px | All UI stories | Sprint 2 |
| NFR-13 | Security – integrity | Input validation and dependency hygiene | 0 high/critical `npm audit` findings | All API stories | Sprint 2 |

## 3. Detailed Specifications

### NFR-01 — Catalog search response time

| | |
|---|---|
| Requirement | Given a catalog of 10,000 books, a member's search by partial title, author, ISBN or subject returns results quickly enough to support the 90-second success metric. |
| Metric | Server response time of `GET /api/v1/books?query=…` (p95 and max). |
| Target | p95 ≤ 2 s, max ≤ 3 s, with 20 concurrent users over 60 s. |
| Method / tool | Load test with a 10,000-book generated seed; `k6` (or `autocannon`) script in `backend/test/perf/`. Query mix: 50 % partial title, 20 % author, 20 % ISBN, 10 % no-match. |
| Pass / fail | Fail if p95 > 2 s or any request errors (non-2xx) appear. |
| Source | US-05 acceptance criterion 1. |

### NFR-02 — API response time under concurrent load

| | |
|---|---|
| Requirement | Single-resource reads and circulation writes stay responsive during peak desk hours. |
| Metric | p95 response time of `GET /books/{id}`, `POST /loans/checkout`, `PUT /loans/{id}/return`, `POST /reservations`. |
| Target | p95 ≤ 500 ms, error rate < 1 % at 50 concurrent users. |
| Method / tool | `k6` scenario per endpoint, 2-minute run against the Docker Compose environment. |
| Pass / fail | Fail if any endpoint exceeds the p95 target or the error rate. |

### NFR-03 — Role-based access control

| | |
|---|---|
| Requirement | Each role (Member, Academic Staff, Librarian, Admin) can call only the operations it needs. |
| Metric | Share of cells in the role × endpoint permission matrix covered by an API test that passes. |
| Target | 100 %. A request without a token returns `401`; a request with a valid token but the wrong role returns `403`. |
| Method / tool | Data-driven API tests (`node:test` + `fetch`) generated from the permission matrix (to be added to the SRS by the Architect). |
| Pass / fail | Any unauthorized call that returns `2xx` is a **critical** defect and blocks the release. |
| Open point | `docs/openapi.yaml` has no `securitySchemes` and no `security` section yet, so 401/403 cannot be checked at contract level. Issue to be opened for the Architect. |

### NFR-04 — No double allocation of the last copy

| | |
|---|---|
| Requirement | Concurrent checkout or reservation requests for the last available copy never create two loans/holds for the same copy (Sprint 1 risk register, IMP-01). |
| Metric | Number of successful responses when N requests target the same last copy at the same time. |
| Target | With N = 50 parallel requests: exactly 1 × `201`, 49 × `409` with `code: COPY_UNAVAILABLE`; afterwards `availableCopies` is `0`, never negative and never greater than `totalCopies`. |
| Method / tool | Concurrency test that fires 50 `fetch` calls with `Promise.all`, repeated 20 times. |
| Pass / fail | A single run with 0 or ≥ 2 successes fails the requirement. |

### NFR-05 — Auditable state transitions

| | |
|---|---|
| Requirement | Every change to a copy, loan, reservation or fine is recorded so disputes about return times can be settled. |
| Metric | Share of state transitions in the test suite that produce an audit record containing actor, timestamp (UTC), entity id, previous state and new state. |
| Target | 100 %; audit records cannot be edited or deleted through the API. |
| Method / tool | Integration tests run a full lifecycle (checkout → overdue → return → fine paid; reservation → cancel) and compare the audit log against the expected list. |
| Pass / fail | Any missing or incomplete audit record fails. |

### NFR-06 — Consistent and safe error responses

| | |
|---|---|
| Requirement | Clients receive predictable, machine-readable errors and no internal details. |
| Metric | Share of error responses that use `application/problem+json` with `title`, `status`, `code`, `detail`. |
| Target | 100 %; no stack traces, file paths or SQL text in any response body. |
| Method / tool | Contract tests on every documented `4xx`/`5xx` response; negative tests (bad ids, malformed JSON, unknown routes). Already partly covered for US-06 in PR #52. |
| Pass / fail | Any non-Problem error body or leaked internal detail fails. |

### NFR-07 — Search-to-reservation in under 90 seconds

| | |
|---|---|
| Requirement | Primary success metric from the Sprint 1 proposal: an eligible student can search, check availability and place a hold in under 90 seconds. |
| Metric | Task completion time and success rate; System Usability Scale (SUS) score. |
| Target | ≥ 80 % of participants finish in ≤ 90 s; mean SUS ≥ 70. |
| Method / tool | Moderated usability test with at least 5 students on the Figma prototype (Sprint 2), repeated on the working UI (Sprint 4). Timer starts on the home screen and stops on the reservation confirmation. |
| Pass / fail | Below either target → UX issues are logged and prioritised in the next sprint. |

### NFR-08 — Privacy of borrowing history and fines

| | |
|---|---|
| Requirement | Loans, reservations, fines and borrowing history are visible only to the member and to library staff (KVKK-compliant handling of personal data). |
| Metric | Number of successful cross-member reads in the test suite. |
| Target | 0. Member A requesting Member B's dashboard, history or fines receives `403`. Personal data is never written to application logs in plain text. |
| Method / tool | API tests with two member tokens; log inspection during the test run. |
| Pass / fail | Any successful cross-member read is a **critical** defect. |

### NFR-09 — Turkish language support

| | |
|---|---|
| Requirement | Search and display handle Turkish text correctly; the interface is available in Turkish and English (EN-3). |
| Metric | Pass rate of the i18n test set. |
| Target | 100 %. Search is case-insensitive using Turkish rules (`ı/I`, `i/İ`, `ş/Ş`, `ğ/Ğ`, `ç/Ç`, `ö/Ö`, `ü/Ü`): e.g. `çalıkuşu`, `ÇALIKUŞU` and `Çalıkuşu` return the same book. No mojibake in API responses (UTF-8 everywhere). |
| Method / tool | Unit tests on the search normaliser; API tests using the Turkish seed records; manual UI check in both languages. |
| Pass / fail | Any failing case fails the requirement. |

### NFR-10 — Test coverage and CI health

| | |
|---|---|
| Requirement | The codebase stays safe to change. |
| Metric | Line coverage of business modules (`catalog`, `circulation`, `reservations`, `fines`); test pass rate on `develop`. |
| Target | ≥ 70 % line coverage (≥ 90 % for fine calculation and loan-eligibility rules); 100 % pass rate; every merged story has at least one automated test per acceptance criterion. |
| Method / tool | `node --test --experimental-test-coverage` locally and in the GitHub Actions pipeline (EN-2). |
| Pass / fail | PRs that lower coverage below the target or break a test must not be merged. |

### NFR-11 — Accessibility

| | |
|---|---|
| Requirement | Member-facing pages are usable with keyboard and screen readers. |
| Metric | Lighthouse accessibility score; manual WCAG 2.1 AA checklist (contrast, labels, focus order). |
| Target | Lighthouse ≥ 90 on the search, book detail and dashboard pages; 0 open AA violations. Status (e.g. availability badge, overdue warning) is never shown by colour alone. |
| Method / tool | Chrome Lighthouse; Figma contrast check during prototype review. |
| Pass / fail | Score below 90 or any open AA violation fails. |

### NFR-12 — Setup, browser and screen-size compatibility

| | |
|---|---|
| Requirement | Any team member or assessor can run the system, and members can use it on common devices. |
| Metric | Commands needed to start; supported browsers; minimum screen width. |
| Target | Starts with one command (`docker compose up`, or `npm start` until EN-2 is merged); works on the latest Chrome, Firefox and Edge; usable down to 360 px width. |
| Method / tool | Fresh-clone smoke test each sprint; manual cross-browser check. |
| Pass / fail | Any extra undocumented setup step or broken layout at 360 px fails. |

### NFR-13 — Input validation and dependency hygiene

| | |
|---|---|
| Requirement | The API rejects malformed input and does not ship known-vulnerable dependencies. |
| Metric | Validation test pass rate; `npm audit` findings. |
| Target | Every path/body field documented in `openapi.yaml` is validated (invalid → `400`); 0 high or critical `npm audit` findings. |
| Method / tool | Negative API tests; `npm audit --audit-level=high` in CI. |
| Pass / fail | Any unvalidated field or high/critical finding fails. |

## 4. Quality Gates

These gates apply to every pull request into `develop` and to each sprint release tag.

| Gate | Applies to | Criterion |
|---|---|---|
| G1 – Tests | Every PR | `npm test` passes; at least one test per acceptance criterion of the story. |
| G2 – Coverage | Every PR | NFR-10 targets are not lowered. |
| G3 – Contract | PRs touching the API | Response bodies and status codes match `docs/openapi.yaml`; `openapi.yaml` updated in the same PR. |
| G4 – Review | Every PR | At least one approving review; QA review for stories with business rules (loans, reservations, fines). |
| G5 – Defects | Release tag | 0 open critical / high defects; medium defects documented in the release notes. |
| G6 – NFR check | Release tag | All NFRs scheduled for that sprint have been measured and recorded in this document's results log. |

## 5. Process Quality Metrics

Collected by QA at the end of each sprint and reported in the sprint report.

| Metric | Definition | Target |
|---|---|---|
| Test pass rate | Passed tests / executed tests | 100 % on `develop` |
| Acceptance-criteria coverage | Acceptance criteria with ≥ 1 automated test / all criteria of done stories | ≥ 90 % |
| Defect density | Defects found / story points delivered | Tracked; trend should decrease |
| Escaped defects | Defects found after a story is merged | ≤ 2 per sprint |
| Mean time to fix (critical) | Time from bug issue opened to fix merged | ≤ 2 days |
| Review turnaround | Time from PR opened to first review | ≤ 24 h |

## 6. Defect Severity Levels

| Severity | Definition | Example |
|---|---|---|
| Critical | Security or data-integrity failure; blocks the release | Two loans created for the same copy; member can read another member's fines |
| High | Core workflow broken, no workaround | Check-in does not make the copy available |
| Medium | Wrong behaviour with a workaround, or an NFR target missed | Shelf location shown for a lost copy |
| Low | Cosmetic or wording issue | Misleading badge label |

Defects are reported as GitHub Issues using the existing bug template (`.github/ISSUE_TEMPLATE/bug_report.md`) with a `severity:<level>` label.

## 7. Verification Schedule

| Sprint | NFRs measured |
|---|---|
| Sprint 2 | NFR-01, NFR-03 (contract + tests on existing endpoints), NFR-04 (design + test design), NFR-06, NFR-07 (Figma prototype), NFR-09, NFR-10, NFR-12, NFR-13 |
| Sprint 3 | NFR-02, NFR-04 (executed on checkout/reservation), NFR-05, NFR-08, NFR-11 |
| Sprint 4 | Full regression of all NFRs; NFR-07 repeated on the working UI |

## 8. Results Log

| Date | NFR | Result | Evidence |
|---|---|---|---|
| _to be filled during verification_ | | | |

## 9. Open Points

1. Add `securitySchemes` (JWT bearer) and per-operation `security` to `docs/openapi.yaml` so NFR-03 can be verified at contract level — owner: Lead Architect.
2. Agree on the role × endpoint permission matrix in the SRS — owners: Product Owner and Lead Architect.
3. Produce the 10,000-book performance seed and the 100-book functional seed promised in the Sprint 1 risk register — owner: QA.
