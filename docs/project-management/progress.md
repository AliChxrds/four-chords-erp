# Progress reports

## Baseline — 17 September 2026

Status: management pack created; foundation implementation remains pending.

Completed: repository review and initial roadmap, task board, week 1 plan, acceptance criteria, and decision/risk log.

Existing implementation: Express/PostgreSQL customer API with layered structure, search, pagination, soft deletion, and an initial broader database schema. Frontend has no implementation. Existing code has not passed the new delivery gates.

Prior review evidence: JavaScript syntax checks passed. Isolated controller checks accepted clearing a required name and switching to a company without its name (200); numeric first name returned 500. Database integration checks were not run. Invalid dependency ranges, migration search-path/transaction issues, missing customer counter seed, and unauthenticated routes require attention.

Actual developer hours: not reported. No implementation task is marked Done.

Schedule: preliminary 12-week pilot plus 2-week launch allowance. No measured delivery rate yet; re-estimate after weeks 3 and 7.

Next: ERP-002 dependency/setup repairs; gather ERP-001 business decisions alongside independent work.

Working-tree note: package.json, customer controller, and customer service already had uncommitted changes; the migration runner directory was untracked. Preserve and review these before implementation.

## Report template

- Date / reporting period:
- Milestone and status:
- Completed tasks and acceptance evidence:
- Verification and limitations:
- Actual developer hours reported by task:
- Remaining estimate and schedule changes:
- Blockers and unblock actions:
- Decisions made or needed:
- Next task and expected outcome:

Retain reports as history. Update the dashboard and board from current evidence. Never record unrun checks as passing or unreported hours as zero.

## ERP-002 completed — 17 September 2026

Restored all seven dependency ranges from the existing lockfile, preserved the migration command, added a placeholder-only backend environment example, and documented setup in [the setup guide](../setup.md).

Evidence: clean isolated npm ci installed 127 packages; npm ls --depth=0 passed. A loopback API root request returned the expected HTTP 200 JSON. bcrypt hash/compare and JWT sign/verify passed. Node 24.16.0, npm 11.13.0. No actual database/environment was accessed. The lockfile and existing customer implementation were preserved.

Limitations: no database integration check or dependency security audit; the test script remains a placeholder for ERP-005. An initial verification attempt hit PowerShell's empty-key JSON parsing limitation; this was corrected with hashtable parsing before the successful clean installation and checks.

Actual developer hours: not reported. Schedule unchanged; one of 19 work packages complete, with no percentage estimate inferred from package count.

Next: ERP-003, validate migration repairs on a disposable PostgreSQL database. ERP-001 business decisions remain open.

## ERP-003 completed — 17 September 2026

Implemented runner-owned transactions, explicit schema handling, serialized migration runs, connection cleanup, and an existing-schema baseline guard. Removed transaction wrappers and dump ownership/search-path assumptions from initial migrations. Added migration 005 to initialize/reconcile the customer counter without lowering it.

Verification: npm run test:migrations passed on a separate local PostgreSQL 15 cluster using a non-superuser database owner. Covered fresh/concurrent/rerun migrations; first and concurrent customer creation; counter recovery/no regression; failed migration schema/history rollback and retry; and safe refusal of an untracked existing schema. The test database/role were removed and the cluster was stopped. No application database was changed.

Added reusable integration checks and migration instructions. Existing application database adoption is not performed: its schema/history must be reconciled on a backup copy before use. Actual developer hours remain unreported; schedule unchanged.

Next: ERP-004 customer validation and consistent API errors. ERP-001 business decisions remain open.

## Repository audit and M1 platform foundation — 2 November 2026

Audit recorded in [the audit report](../audit/2026-11-02-repository-audit.md). ERP-004 and ERP-005 had already been completed in commits `4feff88` and `99fdda6`; the board now shows them as Done. Against the baseline plan the work is about six weeks behind (week 7 planned ERP-013). The expanded scope in the master brief exceeds the 420-hour budget, so the audit proposes milestones M1–M11 and a reduced pilot scope for your decision.

M1 implemented on branch `feat/m1-platform-foundation`: startup configuration validation, JSON error and 404 responses, structured logs with request IDs, `/health` and `/health/ready`, helmet headers, a CORS allowlist, `/api` rate limiting, graceful shutdown, `/api/v1/customers` alongside `/api/customers`, GitHub Actions CI, and lockfile fixes for three vulnerable dependencies.

Evidence (Node 24.16.0, PostgreSQL 15.4, disposable cluster): `npm test` 46 passed (11 application, 17 validator, 18 API); without DB variables, 28 passed and the API suite was skipped. `npm run test:migrations` passed all five checks. `npm audit --omit=dev` found 0 vulnerabilities. A manual smoke test of `npm run migrate` and `node src/server.js` against a scratch database returned ready, created `CUS-0001` through `/api/v1/customers`, and listed it through `/api/customers`.

Limitations: CI has not yet run on GitHub. Graceful shutdown was not exercised on Windows, where SIGTERM cannot be caught.

Actual developer hours: not reported.

Next: confirm D-006 (role matrix), hosting, booking ownership, ZRA Smart Invoice obligations, and the revised pilot scope; then M2 access control.
