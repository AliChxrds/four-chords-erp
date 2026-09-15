# Four Chords ERP - Development Journal

## 2026-09-05

### Objective
Build the first proper Customers module.

### Work completed

- Connected Express backend to PostgreSQL.
- Configured PostgreSQL connection using `pg`.
- Converted backend to ES Modules.
- Created Customers API.
- Created customer routes.
- Created customer controller.
- Created customer service.
- Implemented CRUD operations.
- Added customer validation.
- Added automatic customer code generation.
- Added customer search.
- Added pagination.
- Added customer-type filtering.
- Added soft deletion.

### Architecture

Request
→ Route
→ Controller
→ Service
→ PostgreSQL

### API endpoints

GET `/api/customers`
GET `/api/customers/:id`
POST `/api/customers`
PUT `/api/customers/:id`
DELETE `/api/customers/:id`

### Database tables

- customers
- customer_code_seq

### Problems encountered

#### Problem 1
`ERR_MODULE_NOT_FOUND`

Cause:
Filename was incorrectly written as:

`customerContoller.js`

instead of:

`customerController.js`

Resolution:
Corrected the filename/import.

#### Problem 2
`ReferenceError: Pool is not defined`

Cause:
`Pool` was not imported correctly after switching to ES Modules.

Resolution:
Changed PostgreSQL configuration to:

`import pg from "pg";`

and:

`const { Pool } = pg;`

### Current status

Customers backend module is functional.

### Next task

Build the Customers frontend and connect it to the API.