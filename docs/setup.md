# Backend setup

Run commands in PowerShell from the project root unless otherwise noted.

## Prerequisites

- Node.js and npm. This setup was verified with Node 24.16.0 and npm 11.13.0; other versions have not been checked in this task.
- PostgreSQL for customer operations. The initial schema was exported from PostgreSQL 15.4. Database setup/compatibility will be verified in ERP-003.

## Install

```powershell
cd backend
npm.cmd ci
```

Use `npm ci` to install the committed lockfile reproducibly. On Windows, `npm.cmd` avoids PowerShell script execution-policy issues. On other shells use `npm`.

## Configure

From `backend`, copy the example only if `.env` does not already exist:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Edit `.env` with local database values. `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` configure PostgreSQL; `DB_NAME` and `DB_USER` are required. `PORT` controls the HTTP port, defaulting to 5000. `CORS_ORIGINS`, `LOG_LEVEL`, `TRUST_PROXY` and the optional pool and rate-limit settings are explained in `.env.example`. The example values are placeholders. Keep `.env` out of Git; `.env.example` is safe to commit.

The backend always reads `backend/.env`, whichever directory a command starts from. Variables already set in the environment take precedence, which is how hosted environments should supply secrets. `npm start` and `npm run migrate` stop with a list of problems if a setting is missing or invalid. Do not replace an existing environment file or create a production database as part of this setup check.

## Run locally

```powershell
npm.cmd start
```

For development with automatic restart:

```powershell
npm.cmd run dev
```

Open `http://localhost:5000/` (or your configured port). Expected response:

```json
{"message":"Four Chords ERP API is running"}
```

Stop with Ctrl+C; the server finishes in-flight requests and closes database connections first. `GET /health` confirms the HTTP process is running. `GET /health/ready` also runs `SELECT 1` and returns 503 when the database is unreachable; use it for load balancer and uptime checks. Logs are JSON lines on stdout (errors and warnings on stderr). They include a request ID but never request bodies or query strings. Customer endpoints require a configured, migrated database. Authentication is planned under ERP-007; use this setup locally during development.

## Database setup

Fresh migrations and reruns are now verified on a disposable PostgreSQL 15 cluster. Follow the [migration guide](migrations.md) for fresh setup, existing-database precautions, and integration checks. Existing database adoption remains an explicit reviewed step.

## Tests

From `backend`:

```powershell
npm.cmd test
```

This runs every `tests/*.test.js` file with Node's built-in test runner. The customer validator tests and the application tests (health checks, errors, CORS, headers, rate limiting, startup validation) need no database. The customer API tests need a disposable PostgreSQL cluster and are skipped unless the same variables as the [migration integration checks](migrations.md#integration-checks) are set:

```powershell
$env:MIGRATION_TEST_PORT = '55439'
$env:MIGRATION_TEST_ADMIN = 'erp_test_admin'
npm.cmd test
```

The API tests create a uniquely named database and role on 127.0.0.1 at that port, run the migrations, start the app on a temporary loopback port, and drop the fixtures afterward. They never use the `.env` database settings to choose a target. The migration checks remain a separate command, `npm.cmd run test:migrations`.

Covered: request shape and field types, individual and company creation, required names on create and update (including type changes), trimming and blank values, optional and duplicate emails on create and update, partial updates, pagination and filter validation, search, invalid and missing IDs, and deactivation. Not covered yet: authentication (ERP-007) and concurrent updates to the same customer.

Recorded on 2 November 2026 with Node 24.16.0 and PostgreSQL 15.4: 46 tests passed (11 application, 17 validator, 18 API), and all five migration checks passed. Without the test variables, 28 tests passed and the API suite was skipped. `npm audit --omit=dev` reported no vulnerabilities.

## Continuous integration

`.github/workflows/ci.yml` runs on every push to `main` and every pull request. It installs with `npm ci`, fails on high or critical production dependency advisories, and runs `npm test` and `npm run test:migrations` against a throwaway `postgres:15` service container.

## Verification recorded for ERP-002

On 17 September 2026, an isolated copy containing only the manifest, lockfile, and source successfully installed 127 packages with `npm.cmd ci --no-audit --no-fund`. `npm.cmd ls --depth=0` passed. The API served its expected root response on a temporary loopback port, bcrypt hashed/compared a sample string, and JWT signing/verification passed. No database connection was attempted, and no real environment file was copied.

The package versions were restored from the existing lockfile; this was not a dependency upgrade or vulnerability audit. `npm test` is still the existing placeholder; meaningful customer/database tests are scheduled for ERP-005.
