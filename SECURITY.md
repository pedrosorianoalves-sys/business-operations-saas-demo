# Security Policy

BusinessOps Demo contains fictional portfolio data only. Do not submit real customer, business, payment, inventory, recipe, credential, or production data to public demo deployments.

## Security properties

- Each configured visitor uses an authenticated anonymous Supabase session and an isolated company.
- Row-level security is enabled on every business table.
- Server and database functions derive tenant identity from the authenticated session.
- No service-role key is required by the application.
- Imports and stock-changing workflows use database transactions.
- Secrets and local environment files must never be committed.

## Reporting

Open a private GitHub security advisory for vulnerabilities that could cross tenant boundaries, bypass database policies, expose credentials, or corrupt inventory and financial calculations. Use a regular issue for non-sensitive bugs.
