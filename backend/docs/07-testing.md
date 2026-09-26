# Testing

The repository does not yet contain an automated test suite. npm test intentionally exits with the existing placeholder error; it is not evidence of a passing test run.

## Manual checks on a disposable local database

Follow the README setup and use synthetic customer records only.

| Check | Expected behaviour |
| --- | --- |
| GET / | 200 with the API startup message; no database check |
| GET /api/customers?page=0 | 400 |
| GET /api/customers?limit=101 | 400 |
| GET /api/customers?customer_type=unknown | 400 |
| POST a complete synthetic individual from the README | 201 with customer ID and generated code |
| GET the returned customer ID | 200 with the saved record |
| Search for the synthetic customer's name | Matching record and pagination metadata |
| POST the same non-null email again | 409 for a duplicate customer |
| PUT a complete updated customer body | 200 with updated values |
| DELETE the saved ID | 200; record becomes inactive, not physically deleted |
| GET /api/customers?active=false | Includes the deactivated record |

## Known cases to cover before release

Missing or blank names, company contacts, invalid active filters, invalid field types, duplicate email on update, partial PUT requests, missing counter row, concurrent customer creation, and database failures. The current implementation has gaps in these areas; these are test requirements, not passing results.

Before presenting a demo, record the runtime versions, database version, commit, request bodies, and observed responses. Do not claim end-to-end verification until the database-backed checks have actually passed.
