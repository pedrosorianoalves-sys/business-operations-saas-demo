# BusinessOps Demo Design

## Purpose

BusinessOps Demo is a public English portfolio application that demonstrates a production-style restaurant operations SaaS. A recruiter should understand its technical value within 30 seconds: relational data, inventory and recipe costing, order profitability, validated JSON imports, tenant isolation, and reproducible deployment.

All people, products, recipes, prices, orders, suppliers, and financial values are invented for this repository.

## Isolation

- The project lives in a new directory and a new Git repository with no history from the source application.
- No source `.git`, `.env.local`, original logo, old README, operational resume document, database URL, credential, or database row is copied.
- A new Supabase project is required. Only its public URL and publishable/anonymous key are exposed to the browser.
- Every browser receives a Supabase anonymous user and an isolated demo workspace. RLS scopes every business row to a company owned by that anonymous user.
- The reset RPC deletes and recreates data only for the caller's workspace.

## Runtime Architecture

Next.js App Router renders the application shell and read-heavy pages as Server Components. Client Components are limited to interactive forms, tables, charts, import validation, reset confirmation, and mobile navigation. Server Actions authenticate every mutation, derive the caller's workspace, validate inputs, and invoke Supabase.

Domain code under `src/domain` owns currency rounding, unit conversion, customer matching, import normalization, validation, and import planning. It has no React or Supabase dependency. Infrastructure modules under `src/lib/supabase` adapt authenticated requests to the database. Feature components remain organized by business domain.

## Demo Session

The first visit starts an anonymous Supabase session without displaying authentication UI. The database trigger creates the profile; `bootstrap_demo_workspace()` creates one company/member relationship and loads the fictional dataset. `/` then renders the dashboard. Authentication can later be reintroduced by replacing the session bootstrap while keeping tenant and role contracts.

Anonymous accounts are rate-limited by Supabase. Bootstrap and reset functions enforce one workspace per user and deterministic row limits. No service-role key is used by the application.

## Data Model

- `profiles -> company_members -> companies`
- `companies -> customers -> orders -> order_items -> products`
- `products -> recipes -> recipe_items -> ingredients`
- `ingredients -> ingredient_purchases` and `stock_movements`
- `orders -> stock_movements` for recipe consumption
- `stock_adjustments` records losses, additions, removals, and corrections

English enum values are used in the new database. Foreign keys and RLS filter columns are indexed. Constraints reject negative money, quantity, and stock values. Transactional functions lock ingredients in stable ID order before stock mutations.

## Fictional Dataset

The deterministic seed contains 25 customers, 18 ingredients, 10 products, 10 original demo recipes, 18 purchases, 72 orders across multiple dates and statuses, order items, and stock movements. Names and contact details are explicitly fictional; emails use `example.com` and phone numbers use the reserved North American `555-01xx` range.

## JSON Import

`Data Import` is a flagship workflow. The page includes a large monospaced editor, three built-in examples, Validate, Import, Clear, Copy Example, and Download Schema actions. Validation produces a structured preview and path-addressed issues before any write.

Supported top-level arrays are `customers`, `products`, `ingredients`, `recipes`, and `orders`. The pure TypeScript validator normalizes aliases and generates an import plan. A single PostgreSQL RPC receives the normalized plan and applies it atomically; any database error rolls the entire import back.

Customer matching priority is normalized phone, normalized email, then normalized full name only when both contacts are absent. Conflicting phone/email matches and duplicate name-only candidates are errors. Product and ingredient references must resolve exactly and unambiguously.

## Reset

`Reset Demo Data` opens an Alert Dialog. Confirmation invokes one transactional RPC that verifies the caller owns the workspace, deletes tenant business rows in dependency order, and reinserts the deterministic dataset. It never accepts an arbitrary company ID from the browser.

## Interface

The visual reference is `docs/design/businessops-dashboard-concept.png`.

- True white content background, deep navy sidebar, indigo primary accent, slate text, coral only for cost/low-stock semantics.
- Geist typography, 248px desktop sidebar, compact mobile drawer, subtle borders, 10–12px radius, minimal shadow.
- Navigation: Overview, Customers, Products, Ingredients, Recipes, Inventory, Purchases, Orders, Reports, Data Import, Technical Overview.
- Dashboard: portfolio notice, Revenue, Orders, Gross Profit, Gross Margin, Revenue vs COGS, Top Products, Recent Orders, Inventory Value, and Low Stock Items.
- Data-heavy views remain tables and editor panels rather than card grids.
- `BusinessOps` is rendered by one replaceable `BrandMark` component.

## Portfolio Context

The app includes a persistent fictional-data notice and `/technical-overview`. The overview documents only implemented architecture and displays Next.js, React, TypeScript, PostgreSQL, Supabase, Tailwind CSS, and Vercel badges. The GitHub URL comes from `NEXT_PUBLIC_GITHUB_URL`.

## Error Handling

Validation failures are returned as typed issues with exact paths. Server Actions return user-safe messages and log no payloads or contact data. Database exceptions are mapped to concise English errors. Missing environment configuration renders a setup-safe state during local development rather than attempting to contact an unknown database.

## Verification

- Unit tests: unit conversion, cost and margin calculations, customer matching, payload validation, preview, and import summary.
- SQL assertions: bootstrap idempotence, RLS isolation, seed counts, atomic import rollback, reset ownership, and deterministic reset.
- UI checks: no login, English copy, dashboard data, CRUD workflows, three import examples, invalid record errors, reset modal, responsive sidebar, and technical overview.
- Required commands: lint, TypeScript check, unit tests, production build, migration reset/seed verification, repository privacy scan, and manual browser QA at desktop and mobile widths.

## Public Repository

The final repository is `pedrosorianoalves-sys/business-operations-saas-demo`, public by explicit portfolio intent. Publication occurs only after the privacy scan reports no original brand, real contacts, credentials, production URLs, or recipe data.
