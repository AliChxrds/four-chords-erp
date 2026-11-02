# Repository audit — 2 November 2026

Scope: this repository at commit `d2b0c35` (`main`, clean), plus a read-only look at the sibling folders `wearefourchords.com/` and `Four Chords Website/` under `E:\Four Chords Enterprise Ltd\` to judge integration readiness. Nothing was changed in those folders. Files that look like secrets (`Webhook secret.txt`, `hostinger-recovery-codes.txt`, any `config.php`) were not opened.

Status words used below: **Implemented** (code exists and an automated test exercises it), **Partial** (code or schema exists, workflow incomplete), **Schema only** (tables exist, no API), **Planned** (nothing exists).

## 1. Summary of the existing application

A Node.js 24 / Express 5 / PostgreSQL 15 backend with one working module, Customers. The structure is route → controller → service → `pg` pool, with a separate validator. A custom migration runner applies `database/migrations/*.sql` once each, in its own transaction, behind an advisory lock. There is no frontend, no authentication, no CI, no container or deployment configuration, and no integration with any other Four Chords system.

The code that exists is careful: parameterised SQL everywhere, a concurrency-safe customer-code counter, a migration runner that refuses to adopt an untracked schema, and tests that only run against a disposable cluster.

Baseline verified today on Node 24.16.0 and PostgreSQL 15.4 (a disposable cluster on 127.0.0.1:55439, since removed):

| Check | Result |
| --- | --- |
| `npm test` without DB variables | 17 passed, API suite skipped |
| `npm test` with a disposable cluster | 33 passed, 0 failed |
| `npm run test:migrations` | 5 of 5 checks passed |
| `npm audit --omit=dev` | 3 vulnerabilities: proxy-addr (critical), body-parser (high), qs (moderate). All fixable inside the lockfile. |

## 2. Modules

| Module | Status | Evidence |
| --- | --- | --- |
| Customers: create, read, list, search, filter, paginate, partial update, soft deactivate, unique `CUS-0001` codes | Implemented | `backend/src/*/customer*.js`, 33 tests |
| Migration runner | Implemented | `backend/src/database/migrate.js`, 5 integration checks |
| Customer reactivation | Missing | `is_active` cannot be set back to true through the API |
| Business units | Schema only | `business_units` table, no API, no seed data |
| Users | Schema only | `users` table with a free-text `role`; `bcrypt` and `jsonwebtoken` installed but unused |
| Products, categories, inventory, stock movements | Schema only | No API |
| Suppliers | Schema only | No API |
| Sales, sale items, payments | Schema only | No API, no invoice-number generator |
| Expenses | Schema only | No API |
| CRM (leads, pipeline, activities), quotations, invoices as documents, finance/GL, projects, bookings, HR, reporting, notifications, integrations | Planned | Nothing in source or schema |
| Frontend | Planned | Only an empty, misspelled `fontend/` folder |

## 3. Database assessment

Strengths: primary keys and most foreign keys exist; unique customer codes, SKUs, invoice numbers and emails; indexes on the main foreign keys and dates; migration history is tracked and serialised.

Weaknesses, most important first:

1. **Financial integrity.** `sale_items` cascades on deletion of a sale, so deleting a sale silently destroys invoice lines. Statuses, payment methods, movement types and product types are free text with no `CHECK`. Amounts and quantities have no non-negative checks. There is no currency column, no tax rate, no ledger, and no idempotency key on payments.
2. **Inventory model.** `inventory` has one row per product (`product_id` is unique and nullable). That means one location only, no business unit, no reservation, and no guard against negative stock.
3. **Access model.** `users.role` is a single free-text value, and `users.business_unit_id` allows one unit per user. Neither supports the role matrix or multi-unit staff the brief requires.
4. **Organisation model.** Only `business_units` exists. There are no legal entities and no branches, and no transactional table is scoped to a branch.
5. **Time and auditing.** Every timestamp is `timestamp without time zone`. Nothing has `updated_at`, `created_by` or `updated_by`, and there is no audit log.
6. **Suppliers copy the early customer mistakes.** `email` and `contact_person` are `NOT NULL` and email is unique, so a supplier without an email cannot be saved.
7. **Customers.** Email uniqueness is case-sensitive, so `A@x.com` and `a@x.com` both save, which matters for deduplication of website leads. The required name per customer type is enforced only in the API. `customer_code_seq` is an unused leftover sequence. A leading-wildcard `ILIKE` search will need a trigram index as data grows.
8. Missing indexes on `expenses.recorded_by`, `payments.received_by`, `sales.created_by` and `sale_items.product_id`.

None of these tables hold real data in a tracked environment, so items 1–6 can be corrected with forward migrations now, cheaply, before modules are built on top. Migrations 000–005 must not be edited further. The runner skips recorded files, so fixes go in 006+.

## 4. Security assessment

| Severity | Finding |
| --- | --- |
| Critical | No authentication or authorisation. Every customer route is open. This is documented, so it is not deployable as is. |
| Critical | Known vulnerable transitive dependencies: proxy-addr (IP spoofing), body-parser (DoS), qs (DoS). |
| High | `cors()` with no options allows any origin. |
| High | No rate limiting and no security headers. |
| High | No central error handler: malformed JSON returns Express's default HTML error page, not the API's `{ success, message }` shape, and unknown routes return HTML 404s. |
| Medium | Errors are logged with `console.error(error)`, which can write request data and SQL details to logs. There is no request ID and no structured logging. |
| Medium | Configuration is not validated at startup. A missing `DB_*` variable fails only on the first query. |
| Medium | There is no health endpoint that checks the database, and no graceful shutdown. |
| Medium | Customer update is read-then-write without a transaction or version check, so two simultaneous edits can overwrite each other. |
| Low | `jsonwebtoken` and `bcrypt` are installed but unused. |
| Outside this repo | `wearefourchords.com/hostinger-recovery-codes.txt` is untracked but **not git-ignored** in that repository, so a `git add .` would commit it. Add it to that repo's `.gitignore`, or better, move it into a password manager. `Webhook secret.txt` sits in the shared company folder in plain text; move it to a password manager. |

Good practice already present: parameterised queries, `.env` git-ignored with a placeholder `.env.example`, and tests that refuse to target anything except an explicit disposable cluster.

Data protection: Zambia's Data Protection Act No. 3 of 2021 applies to customer and booking data. Lawful basis, retention, data-subject requests and controller registration need a legal review before production. This audit makes no compliance claim.

## 5. Integration readiness

No ERP integration exists. Verified current state of the two sites:

**Corporate site — `wearefourchords.com/`** (GitHub `AliChxrds/wearefourchords.com`). Static HTML built by `build.mjs`, deployed by GitHub Actions over SFTP to Hostinger shared hosting (Apache + PHP 8.1). Forms (`form_type` = quote, contact or partnership; `name`, `email`, `consent`, plus service-specific fields) post to `api/submit.php`. That script validates, applies a honeypot and a per-IP rate limit, generates a reference `FC-XXXXXX`, and sends one email to info@wearefourchords.com. No data is stored.

**Photography site — `Four Chords Website/`** (GitHub `AliChxrds/fourchordsphotography.com`). React/TypeScript/Vite frontend with a PHP/MySQL (MariaDB) booking backend on Hostinger. It has its own tables (`booking_requests`, `booking_payments`, `booking_mail`, `testimonials`, …), its own `/admin`, manually recorded payments, and Resend email with a signed delivery webhook. `booking_requests.request_key` is already unique, which makes it a good idempotency key.

What this means for design:

- Both sites run on shared PHP hosting, so the ERP must be reachable over public HTTPS for them to push to it. The ERP is not hosted anywhere yet. **Hosting is the first integration blocker.**
- The corporate form should **keep sending its email** and additionally make a signed server-to-server POST to the ERP, using the `FC-` reference as the idempotency key. If the ERP is down, the email is the fallback and a retry spool replays the lead later. Website enquiries must never depend on ERP uptime.
- The photography site currently **owns** availability and the booking lifecycle. Phase 4 should start as one-way: the booking site sends signed events (`booking.requested`, `booking.confirmed`, `booking.cancelled`, `payment.recorded`) to the ERP. Moving ownership of payments or invoices to the ERP is a later, explicit decision, not a default.
- Neither site handles online payments, so there is no payment-provider webhook to verify yet.
- **Fiscal invoicing.** `VSDC-API-Specification-Document-v1.0.7-1.pdf` (ZRA Smart Invoice) and a turnover-tax registration certificate are in the company folder. Whether ERP-issued invoices must go through ZRA Smart Invoice/VSDC for a turnover-tax registrant has to be confirmed with ZRA or a tax adviser before the invoicing module is built. Until then, ERP invoices must not be presented as fiscal invoices.
- `ranchdale-saas/` was not treated as a Four Chords platform. Tell me if it is one.

Needed to connect them (no secrets in chat; each value goes into the host's secret store or a server-only `config.php` / `.env`):

| Item | Where it lives |
| --- | --- |
| ERP public base URL (after hosting is chosen) | `ERP_BASE_URL` in each site's server-side `config.php` |
| One integration ID and HMAC signing secret per site, generated by an ERP admin CLI and shown once | ERP: hashed in an `integrations` table. Site: `erp_integration_id` and `erp_signing_secret` in server-side `config.php`, never in frontend JS or the repo. |
| Confirmation that Hostinger PHP allows outbound HTTPS (cURL). The photography site already calls Resend, so likely yes. | Test once |
| Field mapping sign-off: quote form fields → lead; booking fields → booking | Business owner |
| Ownership rules for booking status, payments and cancellations | Business owner decision |

## 6. Target architecture

A modular monolith on the existing stack. No new language or framework on the backend.

```
backend/src/
  config/         env loading and validation (one place)
  shared/         db (pool, withTransaction), http (errors, responses), logging, middleware
  modules/
    auth/         login, sessions, passwords, MFA later
    access/       roles, permissions, business-unit scoping, audit log
    organisation/ legal entities, business units, branches
    customers/    existing code, moved here only once auth lands
    crm/ sales/ catalogue/ inventory/ procurement/ finance/ projects/ bookings/ hr/ reporting/
    integrations/ inbound webhooks (inbox + dedup), outbox publisher, adapters per platform
frontend/         React + TypeScript + Vite (the photography site already uses this stack)
```

Each module has routes → controller → service → repository plus a validator. Modules call each other's services, never each other's tables.

Key decisions, to be confirmed:

1. **Sessions over JWT for staff.** The ERP frontend is a first-party web app, so use opaque, server-stored, revocable session tokens in an `HttpOnly; Secure; SameSite=Strict` cookie, with a CSRF header check on state-changing requests. JWTs cannot be revoked without extra machinery and gain nothing here. Integrations authenticate with per-integration HMAC signatures, not user sessions.
2. **Permissions as data.** `roles`, `permissions`, `role_permissions`, and `user_roles(user_id, role_id, business_unit_id NULL = all units)`. Every service query takes the caller's allowed units, and business-unit isolation is enforced in the service layer with tests. Row-level security can be added later.
3. **Outbox and inbox in PostgreSQL.** An `outbox_events` table written in the same transaction as the business change, published by an in-process worker using `FOR UPDATE SKIP LOCKED`. An `integration_events` inbox with `UNIQUE (integration_id, external_event_id)` for deduplication. No Redis or broker until volume demands it.
4. **Organisation model.** `legal_entities` (Four Chords Enterprises Limited) ← `business_units` (Technologies, Creative, Enterprise, Opportunities; brands such as Photography as child units or brand records) ← `branches`. Customers and suppliers stay shared at company level.
5. **Money.** `numeric(15,2)` plus a `currency CHAR(3)` (default `ZMW`) on monetary documents. Posted ledger lines are immutable; corrections are reversals.
6. **Hosting** (your decision). One small managed Node service plus managed PostgreSQL with automated backups (for example Render or Railway, which `ranchdale-saas` already uses), or a small VPS with Docker Compose. Shared Hostinger plans are not a fit for a long-running Node API with background workers.

## 7. Prioritised roadmap

The existing backlog in `docs/project-management/` (ERP-001…019, 420 hours, pilot on 9 December 2026) is the right skeleton and should be kept. Two facts change it:

- **Schedule.** By the plan, today falls in week 7 (ERP-013), but delivery is at ERP-005, so work is about six weeks behind. Separately, `docs/project-management/` still lists ERP-004 and ERP-005 as not done, although commits `4feff88` and `99fdda6` completed them.
- **Scope.** The master brief (GL accounting, HR, projects, bookings, integrations, BI, multi-entity) is several times larger than 420 solo hours. It cannot all reach production by December. The roadmap below orders it so that each phase ends with something usable.

| # | Milestone | Brief phase | Contents | Depends on |
| --- | --- | --- | --- | --- |
| M1 | Platform foundation | 1 | Dependency fixes, config validation, errors, logging, health, CORS/headers/rate limits, CI, `/api/v1` | — |
| M2 | Access control | 1 | Organisation tables, users, roles/permissions, sessions, admin bootstrap, audit log, protected customer routes (ERP-007) | M1; role matrix (D-006) |
| M3 | Schema integrity pass | 1 | Migrations fixing section 3 items 1–8 before any module uses those tables | M2 |
| M4 | ERP shell + Customers UI | 2 | React/TS app, login, navigation, business-unit switcher, Customers screens (ERP-008/009) | M2 |
| M5 | Hosting + staging | 6 (pulled forward) | Docker, staging deploy, managed DB backups, restore drill | M1; hosting decision |
| M6 | CRM leads + corporate site integration | 2 + 4 | Leads, dedup, assignment, signed inbound API, inbox, `submit.php` adapter with email fallback | M4, M5 |
| M7 | Catalogue, suppliers, inventory | 2 | ERP-010/011 with locations and a negative-stock guard | M3 |
| M8 | Quotations → sales → invoices → payments | 2 + 3 | ERP-012/013/014, concurrency-safe numbering, idempotent payments, fiscal decision | M7; ZRA decision |
| M9 | Bookings + photography integration | 3 + 4 | Booking mirror, then the agreed ownership model | M6, M8 |
| M10 | Finance foundations | 2 | Chart of accounts, journal, posting from invoices/payments/expenses, trial balance | M8 |
| M11 | Reporting | 5 | Executive and business-unit dashboards, exports | M8–M10 |
| Later | Projects/time, HR, procurement workflow, notifications channels, e-commerce, portals | 3, 7 | — | — |

A realistic pilot on 9 December covers M1–M6 plus a basic M7. M8 onward follows in 2027. Revise the dates in `docs/project-management/roadmap.md` once you agree.

## 8. First milestone: M1 platform foundation

Why first: it needs no business decisions, removes the critical dependency issues, and gives every later module a consistent base (errors, config, logging, CI). Its changes to existing endpoints are additive only.

| File | Change |
| --- | --- |
| `backend/package-lock.json` | `npm audit fix` (lockfile-only patch updates for proxy-addr, body-parser, qs) |
| `backend/package.json` | Add `helmet` and `express-rate-limit` |
| `backend/src/config/env.js` (new) | Load dotenv once; validate and export typed config (`NODE_ENV`, `PORT`, `DB_*`, `CORS_ORIGINS`, `LOG_LEVEL`, `TRUST_PROXY`); fail fast with a clear message |
| `backend/src/config/database.js` | Use `env.js`; add pool limits and `statement_timeout` |
| `backend/src/shared/http/errors.js` (new) | `AppError` with status, code and message |
| `backend/src/shared/http/errorHandler.js` (new) | JSON 404 and error handler; malformed JSON → 400 `{ success:false, message, code }`; 500s log details server-side only |
| `backend/src/shared/logging/logger.js` (new) | Small structured JSON logger with request IDs; no request bodies logged |
| `backend/src/shared/middleware/requestContext.js` (new) | `X-Request-Id` in and out, per-request logger, completion log |
| `backend/src/routes/healthRoutes.js` (new) | `GET /health` (liveness) and `GET /health/ready` (`SELECT 1`) |
| `backend/src/app.js` | Helmet, CORS allowlist from env, JSON body limit, rate limit on `/api`, request ID, health routes, customers mounted at **both** `/api/customers` (kept for compatibility) and `/api/v1/customers`, error handlers last |
| `backend/src/server.js` | Graceful shutdown on SIGINT/SIGTERM (close server, end pool) |
| `backend/src/database/migrate.js` | Validate config; run migrations on a pool without the statement timeout |
| `backend/src/controllers/customerController.js` | Replace `console.error` with the logger; response shapes unchanged |
| `backend/.env.example` | Document the new variables |
| `backend/tests/app.test.js` (new), `backend/tests/customers.api.test.js` | 404 JSON, malformed JSON 400, 413, CORS allow/deny, security headers, rate limit, `/health`, `/health/ready` 503, startup validation; DB-gated `/health/ready` 200 and `/api/v1/customers` parity |
| `.github/workflows/ci.yml` (new) | Node 24 + a `postgres:15` service; `npm ci`, `npm audit --omit=dev --audit-level=high`, `npm test` with DB variables, `npm run test:migrations` |
| `docs/setup.md`, `README.md`, `CHANGELOG.md` (new) | Document the new variables, health endpoints and CI; start the changelog |
| `docs/project-management/*` | Mark ERP-004/005 done; record this audit and the revised plan |
| housekeeping | Remove the empty `fontend/` folder (untracked, empty) |

No database migration in M1. Done means: all existing 33 tests and 5 migration checks still pass, the new tests pass locally and in CI, `npm audit` reports no high or critical issues, and the existing `/api/customers` behaviour is unchanged.

### Decisions needed before M2 (they don't block M1)

1. **Role matrix (D-006).** Accept the brief's ten roles as the starting set, and say which roles are business-unit-scoped.
2. **Hosting** for staging and production (section 6, item 6).
3. **Booking ownership.** Does the photography site stay the system of record for bookings in 2026?
4. **ZRA Smart Invoice/VSDC** obligations for Four Chords' tax registration.
5. **Revised pilot scope and date** (section 7).
