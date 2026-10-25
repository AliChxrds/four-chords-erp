# Database migrations

The runner owns each migration transaction and records completion in `public.schema_migrations`. SQL migration files must not contain BEGIN, COMMIT, or ROLLBACK. A PostgreSQL advisory lock serializes runners using this tool. Objects are created for the migration database owner rather than a hardcoded postgres role.

## Fresh database

Create a dedicated database owned by the configured migration user, configure `backend/.env`, then from `backend` run:

```powershell
npm.cmd run migrate
```

The user needs permission to create schema objects. This applies migrations 000–005 and seeds the customer counter. Rerunning skips recorded files. A failure rolls back that file and its history entry; previous successful files remain applied. The runtime user may be given fewer permissions separately.

## Existing database

Back up first and verify schema/history on a copy. If customers already exist but migration 000 is not recorded, the runner deliberately refuses automatic baselining. Do not drop tables or add a fake history row to bypass this check. Compare the schema with migrations 000–004, reconcile missing changes and record only genuinely satisfied migrations through a reviewed adoption procedure. No automatic adoption command is provided.

If previous migrations are already correctly recorded, they are skipped and 005 initializes or raises the counter to the greatest existing numeric CUS code; it never lowers an existing counter. Test this on a copy before running against business data. The counter uses the existing integer storage limit.

The edits to 000–004 remove dump-specific ownership/search-path behavior and inner transaction commands. They affect fresh execution; the runner does not replay recorded files. Future applied schema changes should use new numbered migration files.

## Integration checks

Use a separate disposable local PostgreSQL cluster configured for trusted local test connections, with an administrator allowed to create databases and roles. Do not point these tests at an operational cluster.

```powershell
$env:MIGRATION_TEST_PORT = '55439'
$env:MIGRATION_TEST_ADMIN = 'erp_test_admin'
npm.cmd run test:migrations
```

Run from `backend`. The test connects only to 127.0.0.1 at the explicit test port, creates uniquely named database/role fixtures, and removes those fixtures afterward. Start and stop your disposable cluster separately. The test never uses DB_HOST or DB_NAME to choose its target.

Verified on PostgreSQL 15 with a non-superuser database owner: fresh application, concurrent runners, rerun, first customer, concurrent unique customer codes, existing-code counter recovery, no counter regression, failed migration rollback/retry, and refusal of an untracked existing customer schema.
