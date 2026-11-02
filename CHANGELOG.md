# Changelog

Notable changes to the Four Chords ERP. Dates are when the change was merged or recorded.

## Unreleased: M1 platform foundation

### Added
- `/api/v1/customers`, identical to `/api/customers`, which stays for existing clients.
- `GET /health` (liveness) and `GET /health/ready` (database check, 503 when unreachable).
- Startup configuration validation in `backend/src/config/env.js`. `npm start` and `npm run migrate` stop with a clear list of invalid settings.
- New settings: `NODE_ENV`, `CORS_ORIGINS`, `LOG_LEVEL`, `TRUST_PROXY`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `DB_POOL_MAX`, `DB_STATEMENT_TIMEOUT_MS`.
- Structured JSON logging with an `X-Request-Id` on every response.
- Security headers (helmet), a CORS allowlist, and rate limiting on `/api`.
- JSON responses for unknown routes (404), malformed JSON (400), oversized bodies (413) and unexpected errors (500), with a `code` field.
- Graceful shutdown on SIGINT/SIGTERM.
- GitHub Actions CI with a PostgreSQL 15 service: dependency audit, tests and migration checks.
- Application test suite (`backend/tests/app.test.js`); health and versioned-route checks in the API suite.
- Repository audit: `docs/audit/2026-11-02-repository-audit.md`.

### Changed
- CORS no longer allows every origin. Browser clients must be listed in `CORS_ORIGINS`.
- `backend/.env` is loaded by path, so commands no longer need to start from `backend/`.
- The database pool sets a connection timeout, idle timeout, pool size and per-statement timeout, and logs idle-client errors instead of crashing. Migrations run without the statement timeout.

### Security
- Updated proxy-addr, body-parser and qs in the lockfile to fix a critical, a high and a moderate advisory.

## 25 October 2026
- Customer validation against the saved record, customer and migration test suites, and setup and migration guides.
