# Roadmap and scope

Baseline: 17 September 2026. One developer, 30 hours/week. Estimated capacity: 360 hours to pilot plus 60 hours for launch and contingency.

## Proposed MVP

An internal web application with customers, a product/service catalogue, basic suppliers, inventory, quotations, mixed sales and invoices, manual payments, simple service jobs, expenses, and operational reports.

Proposed deferrals: full accounting, payroll, external payment integrations, advanced purchasing, and advanced scheduling. Confirm these boundaries in ERP-001.

Products and services are confirmed requirements. Proposed design: shared catalogue and mixed invoices; only products generate stock movements. Service materials, tax rules, stock timing, and cancellation behavior need agreement before dependent implementation.

## Schedule

Week 1 starts on 17 September as a planning assumption. Dates are targets, not commitments. Each week is a seven-day planning period rather than a daily work schedule.

| Week | Dates in 2026 | Hours | Outcome | Tasks |
|---|---|---:|---|---|
| 1 | Sep 17–23 | 30 | Reproducible setup and validated customer API | ERP-001–006 |
| 2 | Sep 24–30 | 30 | Login, permissions, and application shell | ERP-007–008 |
| 3 | Oct 1–7 | 30 | Complete Customers browser workflow | ERP-009 |
| 4 | Oct 8–14 | 30 | Product/service catalogue and basic suppliers | ERP-010 |
| 5 | Oct 15–21 | 30 | Stock receipts, adjustments, and history | ERP-011 |
| 6 | Oct 22–28 | 30 | Mixed quotes convert to draft sales | ERP-012 |
| 7 | Oct 29–Nov 4 | 30 | Mixed invoices and consistent stock posting | ERP-013 |
| 8 | Nov 5–11 | 30 | Partial payments, balances, and receipts | ERP-014 |
| 9 | Nov 12–18 | 30 | Basic service delivery tracking | ERP-015 |
| 10 | Nov 19–25 | 30 | Expenses and agreed operational reports | ERP-016 |
| 11 | Nov 26–Dec 2 | 30 | End-to-end checks and backup restoration | ERP-017 |
| 12 | Dec 3–9 | 30 | Controlled business pilot | ERP-018 |
| 13–14 | Dec 10–23 | 60 | Pilot fixes, starting data, and launch | ERP-019 |

Pilot target: 9 December. Launch allowance: 10–23 December, subject to acceptance and holiday availability. Re-estimate after week 3 and week 7 using actual delivery pace.

## Release gates

1. Foundation: clean installation, repeatable migrations, and customer validation checks pass.
2. Customers: authenticated users complete allowed customer workflows in the browser.
3. Transactions: customer → mixed sale → invoice → payment produces correct stock and balances; corrections and cancellations are verified.
4. Pilot readiness: role checks, representative data, backups and restore, and key failure cases are verified.
5. Launch: pilot findings resolved or explicitly accepted, starting data reconciled, and deployment/recovery instructions usable.

## Capacity and scope control

Later rows are work packages, not detailed estimates. Split each into small tasks before its week starts. Every weekly allowance includes testing, review, and documentation.

Typical allocation: 20h implementation, 6h verification/fixes, 2h planning, 2h documentation/data. Week 1 uses its own detailed allocation instead; do not double-count overhead.

New requirements enter Backlog with acceptance criteria and estimates. Replace existing scope, explicitly allocate contingency, or move the date. Do not silently exceed 30 hours/week. Unused contingency is not mandatory work.
