# Technical Decisions

- Use anonymous Supabase Auth instead of bypassing database authorization.
- Derive tenant identity from `auth.uid()` in database functions; never trust a browser-supplied company ID.
- Apply JSON imports and demo resets through single PostgreSQL RPC calls.
- Use custom lightweight SVG/CSS charts to avoid an additional production dependency.
- Keep a local fictional snapshot for build-time and visual verification when hosted database credentials are not configured.
