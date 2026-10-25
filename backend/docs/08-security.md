# Security and development status

This prototype has no authentication or authorisation middleware on the customer routes. Do not expose it publicly or use real customer data.

The implementation uses parameterised SQL for customer queries and environment variables for database credentials. These measures do not replace access control, comprehensive validation, or operational security.

Before deployment: add authentication and role-based authorisation, restrict allowed origins, align database and request validation, use a least-privilege database account, protect transport, handle operational logs safely, and test abuse and failure cases. Keep .env files and credentials out of Git. Use .env.example only as a template.
