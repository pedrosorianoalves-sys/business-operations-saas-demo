# BusinessOps Demo

BusinessOps Demo is a public portfolio SaaS for fictional restaurant operations. It demonstrates relational data modeling, customer and product management, recipe costing, inventory movements, purchases, orders, profitability reporting, tenant isolation, and atomic JSON imports.

The application opens directly into an operations dashboard. There is no visible login: a configured deployment creates an anonymous authenticated visitor and an isolated demo workspace automatically.

> All people, businesses, products, recipes, prices, orders and financial information displayed in this repository are fictional demonstration data.

## Overview

BusinessOps is designed to make full-stack engineering value visible quickly:

- an executive dashboard with revenue, COGS, gross profit, average order value, inventory value, low-stock alerts, recent orders, and top products;
- complete operational modules for customers, products, ingredients, recipes, inventory, purchases, and orders;
- recipe-derived product cost and margin calculations;
- transactional stock consumption for paid orders and restoration for cancellations;
- a developer-friendly JSON workbench with explicit validation, preview, exact error paths, examples, schema download, and an atomic commit;
- deterministic reset of the current visitor's fictional workspace;
- a factual in-app technical overview.

## Features

- Immediate no-login demo experience
- Anonymous per-visitor workspaces
- Tenant-scoped PostgreSQL row-level security
- 25 customers, 18 ingredients, 10 products and recipes, 18 purchases, and 72 orders in the deterministic seed
- Customer matching by normalized phone, email, then unambiguous full name
- Unit conversion across grams/kilograms and milliliters/liters
- Weighted ingredient cost and recipe-based profitability
- Concurrent-safe inventory mutations with stable row locking
- Responsive desktop and mobile navigation
- Preview data when Supabase is not configured
- Privacy scanner for brand terms, secrets, database URLs, and non-fictional contacts

## Tech Stack

- Next.js 16 and React 19
- TypeScript 5
- Tailwind CSS 4 and shadcn/ui
- Supabase Auth and PostgreSQL
- Row-level security, PostgreSQL functions, triggers, and pgTAP assertions
- Vitest
- Vercel-ready deployment

## Architecture

The code is split by responsibility:

- `src/app` contains routes and server-rendered views.
- `src/components` contains reusable visual and interactive components.
- `src/domain` contains framework-independent calculations, matching, validation, and import planning.
- `src/actions` contains authenticated mutation boundaries.
- `src/data` adapts Supabase query results and provides the deterministic read-only preview.
- `src/lib/supabase` handles browser/server clients, cookie synchronization, and anonymous session bootstrap.
- `supabase/migrations` contains the isolated schema, RLS, fictional seed, reset, import, inventory, recipe, and order functions.

Every business table is tenant-scoped. Mutations derive the company from `auth.uid()`; the browser never supplies a trusted company ID. The application does not use a service-role key.

## JSON Import System

The Data Import page supports top-level `customers`, `products`, `ingredients`, `recipes`, and `orders` arrays.

The workflow is intentionally two-stage:

1. Load an example or paste JSON.
2. Validate syntax, values, references, customer matches, and unit compatibility.
3. Review the exact create/update preview.
4. Confirm one atomic PostgreSQL import.

Any invalid record prevents persistence. A database error rolls the complete import back. Built-in examples cover Customer Import, Product & Recipe Import, and Orders Batch Import.

## Demo Data

The seed is generated entirely inside this repository and contains fictional names, reserved `555-010-xxxx` phone numbers, `example.com` email addresses, invented products, invented recipes, and invented financial values. The reset function deletes and reseeds only the current visitor's company.

The application also contains a deterministic preview dataset. It keeps the public UI reviewable before a hosted database is connected, while mutation controls clearly remain disabled.

## Running Locally

Requirements:

- Node.js 20 or newer
- npm
- Docker only if running Supabase locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without Supabase values, the app opens in read-only portfolio preview mode.

Quality commands:

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
npm run privacy:scan
```

## Environment Variables

Only public client configuration is required:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_GITHUB_URL=
```

Create a dedicated Supabase project for this demo. Never reuse another application's database or credentials.

## Database Setup

For a local Supabase stack:

```bash
npx supabase start
npx supabase db reset
npx supabase test db
```

For a dedicated hosted project:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Enable anonymous sign-ins in the project's Supabase Auth settings. Copy the project URL and publishable/anonymous key into `.env.local` or the deployment environment. No shared seed user is required; the first request bootstraps a private fictional workspace.

## Deployment

1. Import this repository into Vercel.
2. Add the three public environment variables.
3. Deploy with the default Next.js settings.
4. Confirm `/` opens the dashboard without an authentication screen.

The production build command is `npm run build`.

## Screenshots

The accepted visual direction is versioned at [docs/design/businessops-dashboard-concept.png](docs/design/businessops-dashboard-concept.png). The final implementation was verified at 1440×900 and 390×844; the comparison ledger is in [docs/07-visual-fidelity.md](docs/07-visual-fidelity.md).

## Portfolio Context

This application is a portfolio demonstration built with fictional business data. It showcases full-stack application development, relational data modeling, inventory and order workflows, cost and profitability calculations, structured JSON imports, validation, migrations, security boundaries, automated testing, and production deployment.

See the in-app **Technical Overview** for a concise engineering walkthrough.
