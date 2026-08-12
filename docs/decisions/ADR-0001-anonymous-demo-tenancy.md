# ADR-0001: Anonymous per-visitor demo tenancy

## Status

Accepted — 2026-08-12

## Context

The public application must open without login, allow visitors to mutate data, demonstrate PostgreSQL/RLS architecture, and prevent visitors from interfering with one another.

## Decision

Use Supabase anonymous Auth. On first request, an authenticated RPC creates one demo company for the anonymous user and seeds it with fictional data. All business tables use company-scoped RLS. Reset and import derive the company from `auth.uid()`.

## Consequences

- The UI has no authentication barrier while database authorization remains real.
- Each visitor receives isolated mutable state.
- Anonymous users and expired demo companies require rate limits and periodic cleanup.
- Hosted deployment requires anonymous sign-ins enabled in the dedicated Supabase project.
