# Prototype Deployment Readiness

## Required Before Vercel Preview

1. Apply `supabase_create_tables.sql` if the schema is not present.
2. Apply `supabase/application_rls.sql` in Supabase SQL Editor. Do not deploy client writes before these policies and RPCs exist.
3. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in local/Vercel environments. Never configure a service-role key as `NEXT_PUBLIC_*`.
4. Configure a managed/self-hosted `OSRM_BASE_URL` for non-demo use. The public OSRM demo server has no production availability guarantee.
5. Create a dedicated test Auth user, run the seed SQL, and verify sign-in, company reads, vehicle writes, and route calculation/persistence in the Supabase project.
6. Confirm Vercel build output and manually verify `/login`, `/dashboard/fleet`, `/dashboard/routes`, `/dashboard/costs`, `/dashboard/emissions`, and `/dashboard/reports`.

## Quality Gates

GitHub Actions workflow: `.github/workflows/quality.yml`.

Local commands: `npm run lint`, `npm run test:unit`, `npm run test:integration`, `npm run test:security`, `npm run build`. Typecheck is intentionally excluded from the current work item's requested checks and should be run before release.

## Current Status

Prototype integration is implemented, but deployment readiness is conditional. The Supabase RLS script has not been applied or verified remotely in this session; the live two-account test, current full build, Vercel deployment, and GitHub Actions run remain unverified. Do not label the project production-ready until those checks are evidenced.