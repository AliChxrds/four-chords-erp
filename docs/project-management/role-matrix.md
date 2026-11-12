# Role matrix (D-006)

Status: **Confirmed, 12 November 2026.** The business owner confirmed the answers recorded at the end of this file. M2 (ERP-007) builds against this version.

Source: the ten suggested roles in the master brief (section 7), the access model in [the audit](../audit/2026-11-02-repository-audit.md#6-target-architecture), and the organisation model: Four Chords Enterprises Limited → business units (Technologies, Creative, Enterprise, Opportunities) → branches. Photography is its own business unit and a child of Creative.

## How access works

- A user holds one or more **role assignments**: `user_roles(user_id, role_id, business_unit_id)`. `business_unit_id = NULL` means all units. Example: someone can be Sales Officer for Creative and Staff Member for Technologies.
- **Permissions are data** (`customers.read`, `invoices.void`, …), granted to roles in `role_permissions`. Changing a role's permissions does not need a code change.
- **Unit-scoped** assignments see and change only records that belong to their unit(s). The service layer enforces this, and tests cover it.
- **An assignment to a parent unit includes its child units.** Someone assigned to Creative also sees Photography. Someone assigned only to Photography does not see the rest of Creative.
- **Customers and suppliers are shared** at company level. Any role with `customers.read` sees every customer, whatever its unit. Transactions (quotes, invoices, stock, expenses, jobs) belong to a unit.
- **Nothing in business data is hard-deleted.** "Deactivate" and "void/cancel" keep the history, and both are written to the audit log.

## Roles

| # | Role | Scope | Purpose | MFA |
|---|---|---|---|---|
| 1 | Super Administrator | All units | System owner: users, roles, permissions, integrations, settings. Not for day-to-day transactions. At most two people. | Required |
| 2 | Company Administrator | All units | Runs the company in the ERP: manages users and unit assignments, business units, and all business data. Cannot edit role definitions or integration secrets, or create Super Administrators. | Required |
| 3 | Business Unit Manager | Unit | Full control of their unit's work, plus approvals: discounts over the limit, large stock adjustments, expenses, invoice voids. | Required |
| 4 | Finance Officer | All units | Issues invoices, records and reverses payments, records expenses, runs financial reports. | Required |
| 5 | Sales Officer | Unit | Customers, leads, quotations, draft sales. Records payments at the point of sale. | Recommended |
| 6 | Inventory Officer | Unit | Catalogue products, suppliers, stock receipts and adjustments. | Recommended |
| 7 | Project Manager | Unit | Service jobs, projects and bookings: creates, assigns and closes them. | Recommended |
| 8 | Staff Member | Unit | Sees and updates jobs and bookings assigned to them. Can look up customers. | Optional |
| 9 | Read-Only Auditor | All units | Reads everything, including the audit log, and exports. Writes nothing. Access expires on a set date. Defined but not assigned to anyone yet. | Required |
| 10 | Integration Service Account | Per integration | Not a person and cannot log in. Websites send signed HMAC requests that only create leads and booking events. | n/a (HMAC) |

## Permission matrix

Key: **C** create · **R** read · **U** update · **D** deactivate · **A** approve/issue/post · **V** void/cancel/reverse · **X** export · **own** = only records assigned to or created by the user · — = none.

Columns: SA = Super Administrator, CA = Company Administrator, BUM = Business Unit Manager, FIN = Finance Officer, SAL = Sales Officer, INV = Inventory Officer, PM = Project Manager, STF = Staff Member, AUD = Read-Only Auditor, INT = Integration Service Account.

| Area | SA | CA | BUM | FIN | SAL | INV | PM | STF | AUD | INT |
|---|---|---|---|---|---|---|---|---|---|---|
| **M2 — built now** | | | | | | | | | | |
| Users and role assignments | CRUD | CRUD¹ | R | — | — | — | — | — | R | — |
| Roles and permissions | CRUD | R | — | — | — | — | — | — | R | — |
| Business units and branches | CRUD | CRUD | R | R | R | R | R | R | R | — |
| Audit log | R X | R X | R (unit) | R (finance) | — | — | — | — | R X | — |
| Customers | CRUD X | CRUD X | CRUD X | R X | CRU | R | R | R | R X | — |
| **Later milestones — defined now, switched on with the module** | | | | | | | | | | |
| Leads (M6) | CRUD | CRUD | CRUD | — | CRU | — | R | — | R | C |
| Integrations and secrets (M6) | CRUD | R | — | — | — | — | — | — | R | — |
| Catalogue: products and services, prices (M7) | CRUD | CRUD | CRUD | R | R | CRU² | R | R | R | — |
| Suppliers (M7) | CRUD | CRUD | CRUD | CRU | — | CRU | R | — | R | — |
| Stock receipts and adjustments (M7) | all | all | CRU A | R | R | CRU³ | R | — | R X | — |
| Quotations (M8) | all | all | CRUD A | R | CRU⁴ | — | CRU | — | R | — |
| Sales and invoices (M8) | all | all | CRU A V | CRU A V⁵ | CR (draft) | — | R | — | R X | — |
| Payments and receipts (M8) | all | all | R | C R V⁵ | C R⁶ | — | — | — | R X | — |
| Expenses (M8) | all | all | C R A | C R U A V | C (own) | C (own) | C (own) | C (own) | R X | — |
| Service jobs and projects (M8/M9) | all | all | CRUD | R | CR | R | CRUD | RU (own) | R | — |
| Bookings (M9) | all | all | CRUD | R | CRU | — | CRUD | RU (own) | R | C U |
| Finance ledger, trial balance (M10) | R | R | — | CR A V | — | — | — | — | R X | — |
| Reports and dashboards (M11) | all | all | unit | all financial | own sales | stock | jobs | — | all | — |

Notes:

1. A Company Administrator cannot create, change or remove a Super Administrator, and cannot give anyone a role they do not hold themselves.
2. Inventory Officers maintain product details and cost. Only a Business Unit Manager or above changes selling prices.
3. Every adjustment must include a reason, and every adjustment stays pending until a Business Unit Manager or above approves it. Stock receipts against a supplier delivery do not need approval.
4. A Sales Officer can propose a discount, but any discount needs Business Unit Manager approval before the quotation or invoice is issued.
5. Voids and payment reversals need a reason. The person who recorded a payment cannot also reverse it.
6. Sales Officers can record a payment against an invoice. They cannot reverse, refund or edit one.

## Separation-of-duties rules

- No one approves their own expense, discount or stock adjustment.
- No one reverses a payment they recorded themselves.
- Super Administrators and Company Administrators can do everything, but every action is audit-logged with the real user, never a shared account.
- Every role change is audit-logged with who made it and when.
- An admin account is never shared. Each person has their own login.
- **Single-user period.** For now the business owner is the only user, so the self-approval rules above would block every discount and adjustment. Until a second active user holds an approving role, a Super Administrator may approve their own items. Each self-approval is marked as such in the audit log. The exception switches off automatically once a second approver exists.

## What M2 implements

- All ten roles and the full permission list are seeded, so later modules only switch on permissions that already exist.
- Enforcement goes live for the "M2 — built now" rows: users, role assignments, business units, the audit log and customers.
- The first Super Administrator is created with a one-time CLI command that prompts for the password. No credentials are shipped in the repository.
- Tests cover unauthenticated access (401), a missing permission (403), the unit boundary (403 or not found) and each separation-of-duties rule that applies to M2 data.
- Photography is seeded as a business unit whose parent is Creative.
- MFA is not enforced for the pilot. M2 creates the hook (`mfa_required` per role), and enforcement for roles marked Required follows in January 2027. Until then, privileged logins rely on strong passwords, short sessions, login rate limits and the audit log.

## Answers confirmed by the business owner — 12 November 2026

| # | Question | Answer |
|---|---|---|
| 1 | Pilot users | Only the business owner for now, as Super Administrator. All ten roles stay defined, and staff are added later. |
| 2 | Finance Officer scope | Whole company (all units). |
| 3 | Customers across units | Shared: anyone with customer access sees every customer. |
| 4 | Who records payments | Sales Officers and Finance. Only Finance (and admins) reverse or refund. |
| 5 | Who sets selling prices | Business Unit Manager and above. Inventory Officers maintain details and cost only. |
| 6 | Approval limits | Every discount and every stock adjustment needs Business Unit Manager approval. |
| 7 | MFA timing | After the pilot, in January 2027. |
| 8 | External auditor | Not yet. The role is defined but assigned to no one. |
| 9 | Photography | Its own business unit, a child of Creative. Creative-wide assignments include it. |
