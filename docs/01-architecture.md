# Architecture

The application uses four explicit boundaries:

1. Presentation: Next.js pages and React components.
2. Application: authenticated Server Actions and query orchestration.
3. Domain: framework-independent validation, matching, costing, and aggregation.
4. Infrastructure: Supabase clients, PostgreSQL schema, RLS, and transactional RPCs.

The database is multi-tenant even though the UI has no login. Supabase anonymous sessions identify visitors, while RLS scopes every row to the visitor's demo company.
