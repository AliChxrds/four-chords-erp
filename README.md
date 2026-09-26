# Four Chords ERP

A modular ERP prototype for Four Chords Enterprises Limited. The implemented backend currently focuses on customer records; the database schema also provides a foundation for sales, inventory, suppliers, payments, expenses, and business units.

## What is implemented

- Node.js and Express customer API backed by PostgreSQL.
- Customer creation, lookup, update, and soft deactivation.
- Parameterised SQL queries, text search, customer-type filters, and pagination.
- Transaction-based customer-code allocation.
- Input checks for identifiers, pagination, customer type, email, and phone.
- SQL schema and follow-up migrations.

This is a development prototype, not a complete deployed ERP. Authentication, authorisation, a user interface, analytics dashboards, and the other business-module APIs are not implemented in the current source tree.

## Why this project matters

The prototype demonstrates how business records can be structured and queried consistently. Its customer service separates HTTP handling from database access, and the schema models relationships between operational entities. These are foundations for future reporting and analysis; the repository does not yet demonstrate business performance improvements or completed analytics.

## Technology

JavaScript (ES modules), Node.js, Express, PostgreSQL, and the pg database client. Dependencies are recorded in backend/package-lock.json.

## Local setup

Use Node.js 22 or newer and a local PostgreSQL instance. The initial schema was exported by PostgreSQL tools and contains postgres ownership statements; run it using a suitable local database administrator. Use a fresh disposable database, not an existing production database.

1. Clone the repository and enter it.
2. Create an empty database named four_chords_erp.
3. Apply the migrations once, in the order below. The migrations are not an automatic migration runner and are not all safe to rerun.

```sh
psql -U postgres -d four_chords_erp -v ON_ERROR_STOP=1 -f database/migrations/000_initial_schema.sql
psql -U postgres -d four_chords_erp -v ON_ERROR_STOP=1 -f database/migrations/001_fix_customer_constraints.sql
psql -U postgres -d four_chords_erp -v ON_ERROR_STOP=1 -f database/migrations/002_create_schema_migrations.sql
psql -U postgres -d four_chords_erp -v ON_ERROR_STOP=1 -f database/migrations/003_add_customer_notes.sql
```

4. On this fresh database, initialise the counter required by customer creation:

```sql
INSERT INTO customer_code_counter (id, last_number) VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;
```

This initial value is only suitable for an empty customer table. Do not reset an existing customer counter.

5. Copy backend/.env.example to backend/.env and replace the local database credentials.
6. From backend, run:

```sh
npm ci
npm start
```

The API uses port 5000 unless PORT is set. GET http://localhost:5000/ returns a startup message; it does not check database connectivity.

## Customer endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | /api/customers | List and search customers |
| GET | /api/customers/:id | Fetch one customer |
| POST | /api/customers | Create a customer |
| PUT | /api/customers/:id | Replace customer fields |
| DELETE | /api/customers/:id | Set is_active to false |

List parameters: search, customer_type (individual or company), page (positive integer), limit (1-100), and active (true, false, or all). Use only these active values; the current controller does not reject other values.

Example request body for a synthetic individual:

```json
{
  "customer_type": "individual",
  "first_name": "Demo",
  "last_name": "Customer",
  "email": "demo@example.com",
  "phone": "+260000000000",
  "address": "Synthetic address",
  "city": "Lusaka",
  "tax_number": null
}
```

Use PUT with the complete set of fields you intend to retain. It is not a partial-update endpoint; omitted values can become null.

## Known limitations

- No authentication or role-based access control; keep the prototype local and use synthetic data.
- The schema requires first_name and last_name, while controller validation allows some requests without them. Company records and missing names need validation/schema alignment.
- Customer-code counter initialisation is a manual setup step.
- The notes migration adds a column, but the customer write service does not yet persist notes.
- The test script is a placeholder and there is no automated test suite.
- Other ERP tables are schema foundations, not implemented modules.

See [testing guidance](backend/docs/07-testing.md) for verification steps and [security notes](backend/docs/08-security.md) for the current development boundary.
