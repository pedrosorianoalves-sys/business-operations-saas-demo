# BusinessOps Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish an isolated English portfolio SaaS with anonymous demo workspaces, fictional restaurant operations data, transactional JSON import, reset, and a recruiter-ready interface.

**Architecture:** A clean Next.js repository reuses only generic source patterns and UI primitives from the source application. Pure TypeScript domain modules validate and calculate business behavior; authenticated Server Actions call a new Supabase schema whose RLS and transactional RPCs isolate one anonymous visitor per company.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui, Supabase PostgreSQL/Auth/RLS, Vitest, Vercel.

## Global Constraints

- Never modify the original `/private/source-project` project.
- Never copy `.git`, `.env.local`, the original logo, original documentation, production URLs, credentials, database rows, customer data, or recipes.
- All visible UI and committed demonstration data must be English and fictional.
- `/` must open the demo dashboard without visible authentication.
- Every visitor must operate in an isolated anonymous workspace; no shared mutable public tenant.
- Do not use a service-role key in the application.
- Use no new production dependency unless the feature cannot be implemented safely with the existing stack.
- Write behavioral tests before production domain code and observe the expected failure.

---

### Task 1: Scaffold the clean repository and project memory

**Files:**
- Create: `package.json`, `package-lock.json`, `.gitignore`, `.env.example`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `components.json`
- Create: `docs/PROJECT_CONTEXT.md`, `docs/00-overview.md`, `docs/01-architecture.md`, `docs/02-technical-decisions.md`, `docs/03-roadmap.md`, `docs/04-current-status.md`, `docs/05-changelog.md`, `docs/06-open-questions.md`
- Create: `docs/decisions/ADR-0001-anonymous-demo-tenancy.md`

**Interfaces:**
- Produces: npm scripts `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:run`, and `privacy:scan`.

- [ ] Copy only generic configuration and shadcn UI primitives from the source into the clean repository.
- [ ] Rename package metadata to `business-operations-saas-demo` and add Vitest as a development dependency.
- [ ] Create `.env.example` containing only `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_GITHUB_URL` with empty values.
- [ ] Create project documentation with the approved design, current status, constraints, and Last Codex Sync.
- [ ] Run `npm install` and `npm run typecheck`; expect the scaffold to typecheck before business modules are added.
- [ ] Commit with `chore: scaffold isolated BusinessOps project`.

### Task 2: Define and test domain calculations

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/costing.ts`
- Test: `src/domain/costing.test.ts`

**Interfaces:**
- Produces: `convertQuantity(quantity, sourceUnit, targetUnit): number | null`, `calculateProductMetrics(salePrice, ingredientCosts): ProductMetrics`, and `calculateOrderMetrics(items, discount): OrderMetrics`.

- [ ] Write failing table-driven tests proving grams/kilograms and milliliters/liters convert both ways, incompatible units return `null`, and currency is rounded to two decimals.
- [ ] Run `npm test -- src/domain/costing.test.ts`; expect failures because `costing.ts` does not exist.
- [ ] Implement the minimal functions with English unit value `unit` and finite/non-negative guards.
- [ ] Run the test again; expect all costing tests to pass.
- [ ] Refactor shared rounding without changing behavior and rerun the full suite.
- [ ] Commit with `feat(domain): add costing calculations`.

### Task 3: Define and test JSON validation and entity matching

**Files:**
- Create: `src/domain/import/types.ts`
- Create: `src/domain/import/examples.ts`
- Create: `src/domain/import/validator.ts`
- Create: `src/domain/import/matching.ts`
- Create: `src/domain/import/schema.ts`
- Test: `src/domain/import/validator.test.ts`
- Test: `src/domain/import/matching.test.ts`

**Interfaces:**
- Produces: `validateImportJson(jsonText, catalog): ImportValidationResult`, `matchCustomer(input, candidates): CustomerMatch`, `IMPORT_EXAMPLES`, and `IMPORT_SCHEMA`.
- `ImportValidationResult` returns `success`, normalized `plan`, `preview`, and `{ path, message }[]` issues.

- [ ] Write failing tests for malformed JSON, empty payloads, customer/product/ingredient/recipe/order examples, missing product paths, invalid quantities, and invalid payment/status values.
- [ ] Write failing matching tests for phone priority, email fallback, name-only fallback, conflicting phone/email candidates, and ambiguous duplicate full names.
- [ ] Run both test files; expect missing-module failures.
- [ ] Implement normalization and validation without database or React imports.
- [ ] Add three exact examples: Customer Import, Product & Recipe Import, and Orders Batch Import.
- [ ] Run tests; expect all import domain tests to pass.
- [ ] Commit with `feat(import): add validated import planning`.

### Task 4: Build the isolated Supabase schema and deterministic seed

**Files:**
- Create: `supabase/config.toml`
- Create: `supabase/migrations/202608120001_businessops_schema.sql`
- Create: `supabase/migrations/202608120002_demo_seed_and_rpcs.sql`
- Create: `supabase/seed.sql`
- Create: `supabase/tests/businessops_test.sql`

**Interfaces:**
- Produces RPCs `bootstrap_demo_workspace()`, `reset_demo_workspace()`, `import_demo_payload(jsonb)`, `mark_order_paid(uuid)`, and `cancel_order(uuid)`.
- Produces helper `get_my_company_id()` and tenant-scoped RLS policies on all business tables.

- [ ] Write SQL assertions first for RLS isolation, one-workspace-per-user, exact fictional seed counts, idempotent bootstrap, reset ownership, and rollback of an import containing one invalid reference.
- [ ] Run `npx supabase test db`; expect failure because migrations/functions do not exist.
- [ ] Create lowercase tables, constraints, FK indexes, composite query indexes, and RLS policies using `(select auth.uid())`.
- [ ] Implement one short transaction per RPC and acquire ingredient locks in stable ID order.
- [ ] Seed 25 customers, 18 ingredients, 10 products/recipes, 18 purchases, and 72 orders with only `example.com` and `555-01xx` contacts.
- [ ] Rerun database tests; expect all assertions to pass.
- [ ] Commit with `feat(database): add isolated demo workspace schema`.

### Task 5: Implement anonymous session bootstrap and data access

**Files:**
- Create: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/proxy.ts`
- Create: `src/lib/env.ts`, `src/lib/demo-context.ts`
- Create: `src/proxy.ts`
- Create: `src/actions/demo.ts`
- Test: `src/lib/env.test.ts`, `src/lib/demo-context.test.ts`

**Interfaces:**
- Produces: `isSupabaseConfigured()`, `ensureAnonymousSession(request)`, `requireDemoContext(): Promise<DemoContext>`, `resetDemoData(): ActionResult`.

- [ ] Write failing tests for empty/placeholder environment values and missing user/company contexts.
- [ ] Implement proxy cookie synchronization and `signInAnonymously()` only when no user exists.
- [ ] Implement idempotent workspace bootstrap through the authenticated RPC.
- [ ] Ensure every mutation derives company ID from auth rather than accepting it from the browser.
- [ ] Run unit tests, lint, and typecheck.
- [ ] Commit with `feat(auth): add anonymous demo workspace bootstrap`.

### Task 6: Implement the design system and responsive app shell

**Files:**
- Create: `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`
- Create: `src/components/brand/brand-mark.tsx`
- Create: `src/components/layout/app-shell.tsx`, `src/components/layout/sidebar.tsx`, `src/components/layout/mobile-header.tsx`, `src/components/layout/portfolio-notice.tsx`
- Create: required `src/components/ui/*.tsx` shadcn primitives

**Interfaces:**
- Produces semantic tokens matching `docs/design/businessops-dashboard-concept.png` and navigation shared by desktop/mobile.

- [ ] Extract exact palette, typography, spacing, radius, border, sidebar, icon, and control tokens from the concept.
- [ ] Use shadcn docs for Button, Card, Table, Alert, Sheet, Dialog, Select, Tabs, and Textarea before composition.
- [ ] Implement the shell with code-native text, keyboard focus, mobile drawer, and no login route.
- [ ] Confirm `/` redirects or renders Overview without a visible auth transition.
- [ ] Run lint, typecheck, and production build.
- [ ] Commit with `feat(ui): add BusinessOps application shell`.

### Task 7: Implement dashboard, reports, and technical overview

**Files:**
- Create: `src/actions/dashboard.ts`, `src/actions/reports.ts`
- Create: `src/app/(dashboard)/overview/page.tsx`, `src/app/(dashboard)/reports/page.tsx`, `src/app/(dashboard)/technical-overview/page.tsx`
- Create: `src/components/dashboard/kpi-card.tsx`, `trend-chart.tsx`, `top-products.tsx`, `recent-orders.tsx`, `inventory-summary.tsx`
- Create: `src/components/reports/reports-view.tsx`

**Interfaces:**
- Produces one parallel dashboard query returning revenue, orders, COGS, gross profit/margin, inventory value, low stock, 14-day trend, top products, and recent orders.

- [ ] Add domain-level tests for dashboard aggregation using hand-derived fixtures.
- [ ] Implement parallel server queries and small SVG/CSS charts without a chart dependency.
- [ ] Implement factual architecture and data-model explanations based only on shipped code.
- [ ] Compare the rendered 1440x900 overview against the concept and repair visible drift.
- [ ] Commit with `feat(dashboard): add portfolio operations overview`.

### Task 8: Implement operational modules and CRUD workflows

**Files:**
- Create: feature actions/pages/components under `customers`, `products`, `ingredients`, `recipes`, `inventory`, `purchases`, and `orders`.
- Create: shared `src/components/data/data-table.tsx`, `src/components/forms/*`, `src/lib/format.ts`.

**Interfaces:**
- Produces list/create/update/delete actions for customers, products, ingredients, recipes, purchases, and pending orders; transactional paid/cancelled order actions; and inventory adjustment actions.

- [ ] Write validation tests before each action parser and calculation change.
- [ ] Implement thin Server Actions that call domain validators and tenant-scoped Supabase operations.
- [ ] Keep recipes and order payment stock changes transactional.
- [ ] Implement empty, loading, success, and error states in English.
- [ ] Manually verify one create/edit workflow per module and paid/cancelled stock effects.
- [ ] Commit with `feat(operations): add core business workflows`.

### Task 9: Implement the Data Import flagship page

**Files:**
- Create: `src/actions/import.ts`
- Create: `src/app/(dashboard)/data-import/page.tsx`
- Create: `src/components/import/import-workbench.tsx`, `example-selector.tsx`, `preview.tsx`, `issues.tsx`, `summary.tsx`

**Interfaces:**
- Consumes: `validateImportJson`, `IMPORT_EXAMPLES`, and database RPC `import_demo_payload`.
- Produces: Validate, Import, Clear, Copy Example, Download Schema, preview, exact issues, and summary actions.

- [ ] Write a failing action test proving invalid plans never invoke persistence and successful imports return the RPC summary.
- [ ] Implement the two-step validate/import state machine; any editor change invalidates the previous preview.
- [ ] Use the RPC once per import so one invalid record rolls back all writes.
- [ ] Verify all three examples through load, validate, import, and resulting module screen updates.
- [ ] Commit with `feat(import): add transactional JSON workbench`.

### Task 10: Documentation, privacy scan, visual QA, and publication

**Files:**
- Create: `README.md`, `scripts/privacy-scan.mjs`
- Update: `docs/PROJECT_CONTEXT.md`, `docs/04-current-status.md`, `docs/05-changelog.md`, `.env.example`

**Interfaces:**
- Produces a nonzero-exit privacy scan for original brand terms, credential signatures, production Supabase URLs, non-example emails, and non-reserved phone numbers.

- [ ] Write a failing privacy-scan fixture test, then implement the scanner and prove it catches the fixture.
- [ ] Run `npm run lint`, `npm run typecheck`, `npm run test:run`, `npm run build`, Supabase database tests, and `npm run privacy:scan`.
- [ ] Start the production app and use the Browser integration for desktop and mobile primary workflows.
- [ ] Capture the final overview screenshot and inspect it beside the accepted concept with `view_image`; record at least five fidelity checks and fix all material mismatches.
- [ ] Verify repository history contains no source-project files, secrets, or private data.
- [ ] Create public GitHub repository `pedrosorianoalves-sys/business-operations-saas-demo`, add origin, push `main`, and read back repository visibility/default branch.
- [ ] Report whether Supabase/Vercel account configuration is still required and provide the exact minimal steps only if Codex cannot complete them safely.
- [ ] Commit with `docs: complete public portfolio handoff`.
