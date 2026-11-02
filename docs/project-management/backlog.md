# Task board

Baseline: 17 September 2026. Actual hours for all tasks: not reported. Existing code has not yet passed these acceptance gates. Later rows are weekly work packages to refine before execution.

| ID | Task | Priority | Status | Hours | Depends on |
|---|---|---|---|---:|---|
| ERP-001 | Confirm workflows, roles, MVP | High | Ready | 5 | Business input |
| ERP-002 | Repair dependencies and setup instructions | High | Done | 3 | — |
| ERP-003 | Repair migrations and initialize customer counter | High | Done | 5 | ERP-002 for execution |
| ERP-004 | Correct customer validation and API errors | High | Done | 6 | — |
| ERP-005 | Add customer and migration checks | High | Done | 6 | ERP-002–004 |
| ERP-006 | Refine backlog and review week 1 | Medium | Ready | 5 | ERP-001–005 for final review |
| ERP-007 | Authentication and role permissions | High | Backlog | 20 | ERP-001,005 |
| ERP-008 | Application shell and navigation | High | Backlog | 10 | ERP-001,002;007 for protected integration |
| ERP-009 | Customers interface | High | Backlog | 30 | ERP-007,008 |
| ERP-010 | Product/service catalogue and basic suppliers | High | Backlog | 30 | ERP-001,009 |
| ERP-011 | Inventory workflows | High | Backlog | 30 | ERP-010; stock decisions |
| ERP-012 | Mixed quotations | High | Backlog | 30 | ERP-009,010; pricing/tax decisions |
| ERP-013 | Sales, invoices, stock posting | High | Backlog | 30 | ERP-011,012; cancellation decisions |
| ERP-014 | Payments and balances | High | Backlog | 30 | ERP-013; payment decisions |
| ERP-015 | Service job tracking | Medium | Backlog | 30 | ERP-013; service decisions |
| ERP-016 | Expenses and reports | Medium | Backlog | 30 | ERP-011,014,015; report definitions |
| ERP-017 | End-to-end verification and recovery | High | Backlog | 30 | ERP-007–016 |
| ERP-018 | Controlled business pilot | High | Backlog | 30 | ERP-017; pilot users/data |
| ERP-019 | Pilot fixes and launch | High | Backlog | 60 | ERP-018; launch acceptance |
| M1 | Platform foundation: config, errors, logging, health, CORS/headers/rate limits, CI, /api/v1 | High | Testing | — | — |

Total: 420 hours, including a 60-hour launch/contingency allowance. Pilot capacity: 360 hours.

## Acceptance criteria

### ERP-001 — Scope
Document a real product sale, service job, and mixed sale if applicable. Confirm users/roles, business units, scope boundaries, currency/taxes, stock timing, returns, service materials, payments, and essential reports. Record remaining decisions and affected tasks.

### ERP-002 — Setup
Replace invalid dependency ranges consistently with the intended lockfile. Verify a clean install in an isolated location. Document the Node prerequisite and startup commands, and add a secrets-free environment example. Preserve existing uncommitted work.

### ERP-003 — Migrations
Run all migrations on a disposable empty PostgreSQL database and rerun without duplicate changes. Fix search-path handling and transaction ownership. Verify failure cannot commit schema changes without migration tracking. Seed the customer counter and successfully create the first customer. Assess existing-database compatibility before applying there.

### ERP-004 — Customer correctness
Validate field types and required names against the resulting record, including partial updates and type changes. Normalize optional blanks consistently. Return useful 400 responses for invalid inputs and active filters, 409 for duplicate emails, and consistent response shapes.

### ERP-005 — Checks
Replace the placeholder test command. Cover individual/company creation, missing/non-string names, partial updates, type changes, optional and duplicate emails, pagination/filter validation, and deactivation. Verify migrations, reruns, and rollback on a disposable database. Record results and limitations.

### ERP-006 — Review
Keep the management pack navigable and statuses evidence-based. Record reported hours, open decisions, foundation demonstration results, and a realistic week 2 plan. Creating the initial pack alone does not complete this task.

### ERP-007 — Access
Login and session/logout handling work; passwords are securely hashed. Server-side checks enforce the agreed role matrix. Test unauthenticated and unauthorized requests. Define administrator initialization without shipping credentials.

### ERP-008 — Shell
Record the frontend stack decision. Implement navigation, protected screens, loading/error states, and a usable layout on agreed devices. Verify API connectivity and document startup.

### ERP-009 — Customers
Authorized users can list, search, paginate, create, view, edit, and deactivate customers in the browser. Demonstrate individual/company validation and useful errors through the database.

### ERP-010 — Catalogue
Provide identifiers, descriptions, prices, categories, and product/service types plus basic suppliers. Item type controls stock behavior. Agree on currency, precision, and tax treatment before pricing is finalized.

### ERP-011 — Inventory
Opening stock, receipts, and adjustments create traceable movements and correct balances. Services do not create stock movements. Enforce agreed location/business-unit and negative-stock rules; concurrent changes must not lose updates.

### ERP-012 — Quotes
Create/view quotes containing products and services with correct agreed totals. Convert accepted quotes into draft sales without unintended duplicates. Quotes alone do not deduct stock.

### ERP-013 — Sales
Issue uniquely numbered invoices with correct totals and agreed stock posting. Financial/stock writes are atomic and repeated requests do not duplicate posting. Cancellations and corrections retain traceable history.

### ERP-014 — Payments
Record partial/full payments, correct balances, and receipts. Enforce agreed overpayment, reversal, and duplicate-submission rules. Reconcile balances to payment records.

### ERP-015 — Services
Track sale-linked jobs as pending, in progress, and completed, with agreed assignment/date/detail fields. Confirm how consumed materials affect stock before implementing that behavior.

### ERP-016 — Reporting
Record expenses. Produce agreed sales, receivables, and stock reports with filters/exports and totals reconciled to sample transactions. These are operational reports, not a full accounting ledger.

### ERP-017 — Verification
Verify mixed sales, partial payment, service completion, adjustments, cancellation, validation, and role restrictions. Restore a backup into a separate environment and verify data. Document deployment/recovery and resolve critical defects before pilot.

### ERP-018 — Pilot
Representative users execute daily scenarios with approved data in a controlled environment. Record issues, reconcile stock/balances, and document acceptance or blockers.

### ERP-019 — Launch
Resolve or explicitly accept pilot findings, reconcile imported starting data, verify deployment/recovery instructions, and record launch acceptance. Break this allowance into specific tasks after pilot results.
