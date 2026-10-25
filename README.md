# Four Chords ERP

A modular ERP prototype for Four Chords Enterprises Limited. The implemented backend currently focuses on customer records; the database schema also provides a foundation for sales, inventory, suppliers, payments, expenses, and business units.

## What is implemented

- Node.js and Express customer API backed by PostgreSQL.
- Customer creation, lookup, partial update, and soft deactivation.
- Parameterised SQL queries, text search, customer-type and active filters, and pagination.
- Transaction-based customer-code allocation.
- Customer validation of field types, required names (checked against the saved record on updates), email, and phone.
- A migration runner that applies each SQL migration once, in its own transaction.
- Automated validator and API tests, plus migration integration checks.

This is a development prototype, not a complete deployed ERP. Authentication, authorisation, a user interface, analytics dashboards, and the other business-module APIs are not implemented in the current source tree.

## Why this project matters

The prototype demonstrates how business records can be structured and queried consistently. Its customer service separates HTTP handling from database access, and the schema models relationships between operational entities. These are foundations for future reporting and analysis; the repository does not yet demonstrate business performance improvements or completed analytics.

## Technology

JavaScript (ES modules), Node.js, Express, PostgreSQL, and the pg database client. Dependencies are recorded in backend/package-lock.json. A React frontend is planned.

## Project structure

- `backend/` - REST API and tests
- `database/` - Database migrations
- `docs/` - Setup, migration, and project management documentation
- `frontend/` - ERP user interface (planned; not yet created)

## Local setup

Use Node.js 22 or newer and a local PostgreSQL instance. Use a fresh disposable database, not an existing production database.

1. Clone the repository and enter it.
2. Create an empty database named four_chords_erp, owned by the user the API will migrate with.
3. Copy backend/.env.example to backend/.env and replace the local database credentials.
4. From backend, run:

```sh
npm ci
npm run migrate
npm start
```

`npm run migrate` applies migrations 000–005 and initialises the customer code counter; rerunning it skips applied files. Read the [migration guide](docs/migrations.md) before using an existing database. Full instructions, including Windows commands, are in the [setup guide](docs/setup.md).

The API uses port 5000 unless PORT is set. GET http://localhost:5000/ returns a startup message; it does not check database connectivity.

## Customer endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | /api/customers | List and search customers |
| GET | /api/customers/:id | Fetch one customer |
| POST | /api/customers | Create a customer |
| PUT | /api/customers/:id | Update the supplied customer fields |
| DELETE | /api/customers/:id | Set is_active to false |

List parameters: search, customer_type (individual or company), page (positive integer), limit (1-100), and active (true, false, or all). Other values return 400.

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
  "tax_number": null,
  "notes": null
}
```

Individuals need a first and last name; companies need a company name. PUT changes only the fields supplied; blank text is stored as null.

## Tests

From backend, `npm test` runs the validator tests. The customer API tests and `npm run test:migrations` need a disposable PostgreSQL cluster; see the [setup guide](docs/setup.md#tests).

## Known limitations

- No authentication or role-based access control; keep the prototype local and use synthetic data.
- The database does not enforce the required names by customer type; the API validation does.
- Other ERP tables are schema foundations, not implemented modules.

See [security notes](backend/docs/08-security.md) for the current development boundary.
