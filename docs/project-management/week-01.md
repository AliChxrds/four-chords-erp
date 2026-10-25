# Week 1 — Scope and foundation

17–23 September 2026. Capacity: 30 hours. Actual hours: not reported.

Goal: reproducible setup, correct customer data, and agreed business scope.

| Task | Hours | Evidence |
|---|---:|---|
| ERP-001: workflows and scope | 5 | Examples, roles, boundaries, open decisions |
| ERP-002: dependency/setup repairs | 3 | Clean install and verified instructions |
| ERP-003: migrations and counter | 5 | First run, rerun, rollback, first customer |
| ERP-004: validation/errors | 6 | Correct create/update and invalid-input behavior |
| ERP-005: automated checks | 6 | Runnable tests and recorded results |
| ERP-006: backlog and review | 5 | Updated board, demonstration, week 2 plan |
| Total | 30 | |

## Work order

1. Begin ERP-002 by inspecting the existing working-tree changes and dependency files.
2. Gather ERP-001 answers while progressing independent technical work.
3. Repair migrations using a disposable database, then customer validation.
4. Complete meaningful checks and record evidence.
5. Review outcomes and reported actual hours; carry unfinished work forward explicitly.

## Business questions

- Describe a typical product sale and service job.
- What roles need access, and what may each view/change?
- How many business units or stock locations need separate tracking?
- Which currency, tax rules, and invoice requirements apply?
- Does stock leave at invoicing, payment, or delivery? Is negative stock allowed?
- Do services consume materials, require deposits, or need staff assignments/appointments?
- How are cancellations, returns, refunds, and payment corrections handled?
- Which three reports are essential, and what existing data must be imported?

## Review gate

Demonstrate clean setup, first customer creation, valid partial updates, rejected invalid requests, and passing relevant tests. Confirm outstanding scope decisions and weekly capacity. Revise the roadmap if foundation tasks remain incomplete before starting dependent features.

## Session update — 17 September

ERP-002 is Done: clean dependency installation and startup smoke checks passed; setup instructions and environment example are available. Actual hours remain unreported. Next implementation task: ERP-003. The remaining week 1 task estimates total 27 hours; this is estimated work remaining, not measured unused capacity.

ERP-003 is Done: fresh migration and rollback integration checks passed on a disposable PostgreSQL cluster. Next is ERP-004. Remaining week 1 estimates total 22 hours; actual time remains unreported.
