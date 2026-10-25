# Decisions and risks

Updated: 17 September 2026. Business decisions belong to the developer/business owner. Proposed technical choices are not confirmed requirements.

## Confirmed

| ID | Decision | Basis |
|---|---|---|
| D-001 | Solo developer, 30 hours/week | User confirmation |
| D-002 | Products and services | User confirmation |
| D-003 | Repository Markdown management pack | User requested creation |

## Open decisions / assumptions

| ID | Decision needed | Before | Owner / action |
|---|---|---|---|
| D-004 | Internal web MVP and deferred scope | ERP-001 completion | Developer confirms boundaries |
| D-005 | Shared catalogue, mixed invoices, product-only stock | ERP-010 | Developer validates with examples |
| D-006 | Roles and business-unit/location access | ERP-007 | Developer supplies role matrix |
| D-007 | Frontend stack and target devices | ERP-008 | Codex proposes based on constraints; record choice |
| D-008 | Currency, tax, precision, invoice requirements | ERP-010/012 | Developer supplies business requirements; verify before implementation |
| D-009 | Stock timing, negative stock, returns/cancellations | ERP-011/013 | Developer describes workflow |
| D-010 | Service materials, deposits, assignment, delivery | ERP-010/015 | Developer provides job example |
| D-011 | Payment methods, refunds, reversals, overpayments | ERP-014 | Developer confirms rules |
| D-012 | Hosting, backup/restore needs, starting-data import | ERP-017 | Developer identifies constraints; Codex proposes implementation |
| D-013 | Sep 17 baseline and December launch availability | Weekly review | Developer confirms capacity/holidays |
| D-014 | Essential reports and quotation priority | ERP-001 completion | Developer ranks needs |

## Risks

| ID | Risk / impact | Priority | Mitigation / owner | State |
|---|---|---|---|---|
| R-001 | Invalid dependency declarations prevent reliable setup | High | ERP-002: clean install and dependency tree verified Sep 17 | Closed |
| R-002 | Migration and seed defects block fresh database | High | ERP-003: disposable PostgreSQL integration checks passed Sep 17; existing DB adoption needs review | Closed |
| R-003 | Unprotected routes expose customer data/changes if deployed | High | Codex/developer: ERP-007 before shared deployment | Open |
| R-004 | Validation gaps allow invalid records | High | Codex/developer: ERP-004–005 | Open |
| R-005 | Scope growth exceeds solo capacity | High | Developer: prioritize, estimate changes, revise dates | Open |
| R-006 | Repeated/incorrect transaction writes corrupt stock/balances | High | Codex/developer: atomic writes and integration checks | Open |
| R-007 | Import and hosting effort remains unknown | Medium | Developer: investigate during ERP-001 | Open |
| R-008 | Actual capacity/holiday availability differs from baseline | Medium | Developer: report hours; reforecast weekly | Open |

Record the date, rule, reason, and affected tasks when resolving a decision. Record verification or accepted residual impact when closing a risk.
