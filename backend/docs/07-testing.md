# Testing

Automated tests live in backend/tests. Commands, the disposable-database setup, coverage, and recorded results are in the [setup guide](../../docs/setup.md#tests) and the [migration guide](../../docs/migrations.md#integration-checks).

- `npm test` runs the customer validator tests, and the customer API tests when MIGRATION_TEST_PORT and MIGRATION_TEST_ADMIN point at a disposable local PostgreSQL cluster.
- `npm run test:migrations` checks fresh installs, concurrent and repeated runs, counter seeding, rollback of a failed migration, and refusal of an untracked schema.

## Cases not yet covered

Authentication and authorisation (ERP-007), concurrent updates to the same customer, a missing counter row at request time, and database failures during a request.

Before presenting a demo, record the runtime versions, database version, commit, and test output. Use synthetic customer records only.
