# Individual Contributions & Role Deliverables
## SENG 321 - Software Engineering (Fall 2026)

* **Project:** UniLib – University Smart Library & Resource Management System  
* **Repository:** [seng321-team21/University_Library_Management_System](https://github.com/seng321-team21/University_Library_Management_System)  
* **Team:** Team 21  
* **Milestones:**  
  * Sprint 1 Release: [`v0.1.0-sprint1`](https://github.com/seng321-team21/University_Library_Management_System/releases/tag/v0.1.0-sprint1)  
  * Sprint 2 Baseline: [`v0.2.0-sprint2`](https://github.com/seng321-team21/University_Library_Management_System/releases/tag/v0.2.0-sprint2)  

---

# SPRINT 2 DELIVERABLES & CONTRIBUTIONS

---

## 1. Ahmet Oba
* **Student ID:** 240201024  
* **GitHub Username:** [@ahmet5743](https://github.com/ahmet5743)  
* **Assigned Role:** **Scrum Master & Agile Process Coach**  

### Responsibilities & Deliverables (Sprint 2)
* **Agile Governance & Sprint Planning:** Defined the official Sprint 2 Goal focused on Requirements & Architecture (21 SP: US-05, US-06, US-07, US-09). Managed team capacity and velocity tracking (Sprint 1: 26 SP delivered; Sprint 2: 21 SP + 4 Architecture/Doc Enablers).
* **Daily Stand-up Facilitation:** Conducted and documented 3 dated Daily Stand-up meetings (Nov 10 Kickoff, Nov 16 Mid-Sprint, Nov 21 Pre-submission) capturing 3-question sync logs across all 6 members.
* **Retrospective Management:** Audited Sprint 1 retrospective action items and facilitated the Sprint 2 Retrospective (What Went Well, What Could Be Improved, 3 actionable improvements for Sprint 3 MVP).
* **Impediment & Risk Tracking (IMP-01 – IMP-05):** Logged, prioritized, and resolved 5 critical technical and process blockers, including concurrent reservation locking (IMP-01), the 50 TL unpaid fine threshold (IMP-02), and UI-to-API DTO alignment (IMP-03).
* **Sprint 2 RACI Responsibility Matrix:** Formulated the updated cross-functional RACI matrix defining Responsible, Accountable, Consulted, and Informed roles across all Sprint 2 deliverables.
* **GitHub Projects Administration:** Administered the team's Kanban board workflow, enforcing column transitions (Backlog ➔ Ready ➔ In Progress ➔ In Review ➔ Done), Definition of Ready (DoR), and Definition of Done (DoD).
* **Peer Reviews & Approvals (Review Leadership):** Conducted rigorous peer reviews and approvals on incoming documentation and code pull requests.

### Evidence Links
* **Official Scrum Master Deliverables Report:** [`docs/sprint2/scrum-master-report.md`](https://github.com/seng321-team21/University_Library_Management_System/blob/develop/docs/sprint2/scrum-master-report.md)
* **Pull Request (Scrum Master):** [PR #55: Create scrum-master-report.md (Merged)](https://github.com/seng321-team21/University_Library_Management_System/pull/55)
* **Pull Request Reviews & Approvals:**
  * [PR #54 Approved: C4 models, UML diagrams, and database ER schema for Sprint 2](https://github.com/seng321-team21/University_Library_Management_System/pull/54)
  * [PR #53 Approved: docs(nfr): add Sprint 2 non-functional requirements and quality measures](https://github.com/seng321-team21/University_Library_Management_System/pull/53)
* **Assigned Backlog Stories (Scheduled for Sprint 3/4):**
  * [#31: US-10 Renew a loan online](https://github.com/seng321-team21/University_Library_Management_System/issues/31)
  * [#37: US-16 Mark a fine as paid or waived](https://github.com/seng321-team21/University_Library_Management_System/issues/37)
  * [#41: US-20 List of overdue loans](https://github.com/seng321-team21/University_Library_Management_System/issues/41)
  * [#42: US-21 Reports on popular books and active members](https://github.com/seng321-team21/University_Library_Management_System/issues/42)

---

## 2. Berkay İnam
* **Student ID:** 240201015  
* **GitHub Username:** [@berkay6767-wq](https://github.com/berkay6767-wq)  
* **Assigned Role:** **Lead Software Architect & Tech Lead**  

### Responsibilities & Deliverables (Sprint 2)
* **Software Architecture Document (SAD):** Authored the comprehensive system architecture document satisfying the 25-point course rubric.
* **C4 Architecture Models:** Designed C4 Level 1 (System Context), Level 2 (Container), and Level 3 (Component) diagrams representing all frontend, backend, database, cache, and external boundary interactions.
* **UML Design Suite:** Modeled the Domain Class Diagram, Sequence Diagram 1 (Concurrency-safe book reservation), Sequence Diagram 2 (Circulation desk checkout & return), and State Machine (Book copy & reservation lifecycles).
* **Database Relational Schema (ERD):** Specified PostgreSQL 16 schema containing 7 tables (`USERS`, `BOOKS`, `BOOK_COPIES`, `LOANS`, `RESERVATIONS`, `FINES`, `AUDIT_LOGS`) with constraints, PK/FK relationships, and search indexing.
* **Architecture Decision Records (ADRs):** Documented ADR-01 (Modular Monolith), ADR-02 (Pessimistic Row-Level Locking `SELECT FOR UPDATE`), ADR-03 (Stateless JWT / RBAC), and ADR-04 (API-First OpenAPI contract enforcement).
* **Backlog Execution:** Completed architectural analysis and indexing design for `#26` (US-05: Catalog Search).

### Evidence Links
* **Architecture Documentation:** [`docs/architecture.md`](https://github.com/seng321-team21/University_Library_Management_System/blob/develop/docs/architecture.md)
* **Pull Request:** [PR #54: C4 models, UML diagrams, and database ER schema for Sprint 2](https://github.com/seng321-team21/University_Library_Management_System/pull/54)
* **Assigned Issues:**
  * [#26: US-05 Search books by title, author, ISBN or subject](https://github.com/seng321-team21/University_Library_Management_System/issues/26)

---

## 3. Rana Tokmak
* **Student ID:** 220204035  
* **GitHub Username:** [@ranatokmak2001](https://github.com/ranatokmak2001)  
* **Assigned Role:** **Product Owner & Requirements Engineer**  

### Responsibilities & Deliverables (Sprint 2)
* **Software Requirements Specification (SRS):** Elaborated 16 Functional Requirements (FR-01 to FR-16) and refined the 22-story product backlog.
* **Acceptance Criteria & Story Points:** Formulated testable Given/When/Then acceptance criteria and assigned Fibonacci story points (87 SP total across Must, Should, Could, Won't).
* **Feature Implementation (US-06):** Implemented backend catalog availability and shelf location logic (`availabilityService.js`), integrated RFC 7807 error responses, updated `docs/openapi.yaml`, and delivered 19 unit/integration tests with 100% pass rate.

### Evidence Links
* **Pull Request:** [PR #52: feat: US-06 book availability & shelf location](https://github.com/seng321-team21/University_Library_Management_System/pull/52)
* **Documentation:** [`docs/sprint2/US-06-book-availability-shelf-location.md`](https://github.com/seng321-team21/University_Library_Management_System/blob/develop/docs/sprint2/US-06-book-availability-shelf-location.md)
* **Assigned Issues:**
  * [#27: US-06 See book availability and shelf location](https://github.com/seng321-team21/University_Library_Management_System/issues/27)

---

## 4. Türkan Eda Uluçay
* **Student ID:** 220205024  
* **GitHub Username:** [@edaaaulcy](https://github.com/edaaaulcy)  
* **Assigned Role:** **Quality Assurance & Test Automation Engineer**  

### Responsibilities & Deliverables (Sprint 2)
* **NFR & Quality-Measure Specifications:** Formulated comprehensive non-functional requirements categorized under ISO/IEC 25010 (Performance, Security, Reliability, Usability, Maintainability).
* **Measurable Quality Metrics:** Defined concrete pass/fail quality gates, target metrics (e.g. catalog response time $<2$s for 10k items, 99% uptime), and testing tools (k6, Jest, Supertest).
* **Quality Assurance Code Review:** Conducted thorough testing and code quality review on PR #52 with actionable feedback on copy edge cases and Git-Flow issue linking.

### Evidence Links
* **NFR & Quality Measures Document:** [`docs/sprint2/nfr-quality-measures.md`](https://github.com/seng321-team21/University_Library_Management_System/blob/develop/docs/sprint2/nfr-quality-measures.md)
* **Pull Request:** [PR #53: docs(nfr): add Sprint 2 non-functional requirements and quality measures](https://github.com/seng321-team21/University_Library_Management_System/pull/53)
* **Code Review on PR #52:** [Review on PR #52](https://github.com/seng321-team21/University_Library_Management_System/pull/52#pullrequestreview-1)

---

## 5. Ozan Kenan Güngör
* **Student ID:** 220204044  
* **GitHub Username:** [@ozankenangungor](https://github.com/ozankenangungor)  
* **Assigned Role:** **Implementation & Integration Engineer**  

### Responsibilities & Deliverables (Sprint 2)
* **UI/UX Prototypes & Figma Wireframes:** Designed interactive user interface prototypes for Student Catalog Search, Book Detail/Hold, and Librarian Circulation Desk.
* **User-Flow Interaction Diagrams:** Designed step-by-step user-flow diagrams illustrating patron reservation journeys and librarian checkout/check-in workflows.
* **API-to-UI Mapping:** Validated frontend UI state mappings against OpenAPI 3.0 schemas and resolved barcode scanner input field matching (`#28`, `#30`).

### Evidence Links
* **UI/UX & User-Flow Documentation:** [`docs/sprint2/ui-ux-and-user-flows.md`](https://github.com/seng321-team21/University_Library_Management_System/blob/develop/docs/sprint2/ui-ux-and-user-flows.md)
* **Assigned Stories:**
  * [#28: US-07 Check out a copy by barcode](https://github.com/seng321-team21/University_Library_Management_System/issues/28)
  * [#30: US-09 Check in a returned copy](https://github.com/seng321-team21/University_Library_Management_System/issues/30)

---

## 6. Eray Yıldırım
* **Student ID:** 220201026  
* **GitHub Username:** [@erayinyo07](https://github.com/erayinyo07)  
* **Assigned Role:** **DevOps & CI/CD Infrastructure Engineer**  

### Responsibilities & Deliverables (Sprint 2)
* **Git-Flow Governance:** Maintained `main` and `develop` branch protection rulesets and validated pull request peer review compliance.
* **Deployment Architecture & Docker Topology:** Documented multi-container deployment environment (Nginx, Node/Java API, PostgreSQL 16, Redis 7, MailHog) on isolated Docker bridge network.
* **Release Management:** Prepared Sprint 2 release tagging (`v0.2.0-sprint2`) and release notes.

### Evidence Links
* **Pull Request:** [PR #56: docs: add Sprint 2 documentation folders (Merged)](https://github.com/seng321-team21/University_Library_Management_System/pull/56)
* **Release Tag:** [`v0.2.0-sprint2`](https://github.com/seng321-team21/University_Library_Management_System/releases/tag/v0.2.0-sprint2)
* **Assigned Issues:**
  * [#20: EN-02 Docker Compose setup and CI pipeline](https://github.com/seng321-team21/University_Library_Management_System/issues/20)

---

# SPRINT 1 ARCHIVED DELIVERABLES & CONTRIBUTIONS
*(Retained for full auditability and verification)*

## 1. Eray Yıldırım (DevOps)
* Initialized repo structure, Git-Flow strategy, GitHub Rulesets, and automated backlog importing.
* Tagged Sprint 1 release `v0.1.0-sprint1`. Merged PRs #1, #3, #4, #44, #45, #47.

## 2. Rana Tokmak (Product Owner)
* Authored initial Product Backlog, Vision, System Boundary, and `rana2.pdf`.

## 3. Berkay İnam (Lead Architect)
* Authored `docs/openapi.yaml` contract, high-level system boundary, and PR #2.

## 4. Ahmet Oba (Scrum Master)
* Authored Sprint 1 Project Foundation Report, Daily Stand-ups, RACI matrix, and PR reviews.

## 5. Ozan Kenan Güngör (Integration Engineer)
* Conducted feasibility analysis and reviewed circulation API endpoints.

## 6. Türkan Eda Uluçay (QA Engineer)
* Formulated QA strategy, acceptance criteria verification, and API contract checklist.
