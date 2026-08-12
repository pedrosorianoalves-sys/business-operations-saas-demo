# BusinessOps Demo — Project Context

## Project name

BusinessOps Demo

## Short description

A public English portfolio SaaS that demonstrates customer, product, recipe, inventory, purchase, order, profitability, and structured JSON import workflows with fictional restaurant data.

## Current status

Implementation in progress in a clean repository. Architecture and visual direction are approved. The original business application remains untouched.

## Main goals

- Make full-stack technical value clear within 30 seconds.
- Provide a no-login demo with an isolated workspace per visitor.
- Make validated transactional JSON import the flagship interaction.
- Keep the database and deployment fully reproducible.

## Tech stack

Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui, Supabase PostgreSQL/Auth/RLS, Vitest, and Vercel.

## Architecture summary

Pure TypeScript domain modules own calculations and import validation. Next.js Server Components query data, client components own interaction, and authenticated Server Actions call tenant-scoped Supabase queries and transactional RPCs. Anonymous Supabase Auth sessions preserve RLS without a visible login.

## Key technical decisions

- Fresh Git history and a new Supabase project; no database or credential reuse.
- Anonymous per-visitor tenancy instead of one shared mutable demo.
- English database enum values and UI copy.
- One atomic database RPC for each multi-table import and reset.
- No service-role key in the application.

## Completed steps

- Audited the source architecture and privacy risks.
- Confirmed the destination GitHub name is available.
- Created and versioned the design specification, visual concept, and implementation plan.

## Next steps

- Implement domain tests and database schema.
- Implement demo bootstrap, reset, application shell, and business workflows.
- Verify privacy, build, browser behavior, and publish to GitHub.

## Open questions

- A dedicated hosted Supabase project may require account-side creation if no authenticated local management session is available.
- Vercel environment variables can be configured after the repository and Supabase project exist.

## Important constraints

- Every committed person, company, product, recipe, price, order, and financial value is fictional.
- Never use the original project's environment or database.
- The GitHub repository is public only after a clean privacy scan.

## Last updated date

2026-08-12

## Last Codex Sync
- Last read by Codex: 2026-08-12
- Last updated by Codex: 2026-08-12
- Last completed task: Approved architecture and implementation plan
- Current next step: Implement tested domain modules and isolated database schema
