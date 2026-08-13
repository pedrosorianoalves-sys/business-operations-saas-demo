# BusinessOps Demo — Project Context

## Project name

BusinessOps Demo

## Short description

A public English portfolio SaaS that demonstrates customer, product, recipe, inventory, purchase, order, profitability, and structured JSON import workflows with fictional restaurant data.

## Current status

Implementation complete and published in a clean, independent public repository. All application routes, fictional preview data, tenant-scoped database workflows, JSON import, reset, tests, privacy checks, and responsive browser QA are complete. Hosted Supabase and Vercel configuration remain account-side deployment steps.

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
- Deterministic read-only preview keeps the public portfolio reviewable before hosted Supabase variables are added.

## Completed steps

- Audited source architecture and privacy risks without modifying the source project.
- Implemented tested costing, unit conversion, matching, validation, dashboard aggregation, and action parsing.
- Implemented isolated PostgreSQL schema, RLS, deterministic seed, reset, import, stock, recipe, purchase, and order functions.
- Implemented all 11 English application routes and responsive navigation.
- Verified migrations and workflows with an embedded PostgreSQL runtime.
- Passed lint, typecheck, unit tests, production build, privacy scan, and desktop/mobile browser QA.
- Published the clean public repository at https://github.com/pedrosorianoalves-sys/business-operations-saas-demo.

## Next steps

- Create a dedicated hosted Supabase project and apply migrations.
- Add environment variables in Vercel and deploy.

## Open questions

- Which dedicated Supabase project reference and Vercel project Pedro will use for the public live demo.

## Important constraints

- Every committed person, company, product, recipe, price, order, and financial value is fictional.
- Never use the original project's environment or database.
- Keep the GitHub repository public only while privacy and secret checks pass.

## Last updated date

2026-08-13

## Last Codex Sync
- Last read by Codex: 2026-08-13
- Last updated by Codex: 2026-08-13
- Last completed task: Published the verified public GitHub repository
- Current next step: Configure a dedicated Supabase project and deploy with Vercel
