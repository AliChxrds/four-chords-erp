# Security and development status

This prototype has no authentication or authorisation middleware on the customer routes. Do not expose it publicly or use real customer data. Authentication and role permissions are the next milestone (M2 / ERP-007).

In place:

- Parameterised SQL for all customer queries.
- Database credentials from environment variables, validated at startup.
- Security headers through helmet; `X-Powered-By` removed.
- A browser-origin allowlist (`CORS_ORIGINS`); empty allows none.
- Rate limiting per client IP on `/api` (`RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`). Set `TRUST_PROXY` correctly behind a proxy, or every client shares the proxy's IP.
- JSON bodies are limited to 100 KB. Error responses never include stack traces or database details.
- Logs omit request bodies, query strings and PostgreSQL error `detail`, which can contain submitted values.
- A per-statement database timeout (`DB_STATEMENT_TIMEOUT_MS`).
- CI fails on high or critical advisories in production dependencies.

These measures do not replace access control. Before deployment: add authentication and role-based authorisation, use a least-privilege runtime database account separate from the migration owner, serve over HTTPS only, and test abuse and failure cases. Keep .env files and credentials out of Git. Use .env.example only as a template.

See the [repository audit](../../docs/audit/2026-11-02-repository-audit.md#4-security-assessment) for the full assessment.
