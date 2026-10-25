# Project Characteristics and Updates

## Characteristics

- Product: Traza, a web route-planning prototype for transport companies operating in El Salvador.
- Stack: Next.js App Router, React, strict TypeScript, Tailwind CSS, Supabase Auth/PostgreSQL, PostGIS, OSRM, and Vercel-ready deployment configuration.
- Units and locale: USD, America/El_Salvador, distance in km, fuel in liters, and emissions in kg CO2e.
- Tenancy: one implicit fleet per company; company data is selected through the signed-in user's active membership and protected by RLS.
- Scope exclusions: GPS tracking, native mobile apps, multiple countries/currencies, and separate fleet entities.

## Module Updates

| Module | Current integration |
| --- | --- |
| Authentication | Supabase email/password sign-in, SSR cookie session refresh, route guard, and login feedback states. |
| C1 Fleet | Company-scoped vehicle CRUD and existing-Auth-user membership/role management. New account creation/invitation remains in Supabase Auth. |
| C2 Routing | Reads active company locations/available vehicles; calls an authenticated server endpoint; validates company ownership; persists route, ordered stop snapshots, PostGIS geometry, and calculation snapshots. |
| C3 Costs | Reads saved route calculations and fuel-price snapshots; supports non-persistent what-if inputs. |
| C4 Emissions | Reads saved emission snapshots and shows source/version; supports non-persistent scenarios. |
| C5 Reports | Uses saved calculations for period metrics, CSV export, and browser print-to-PDF. The schema contains no savings baseline, so no savings metric is asserted. |

## Infrastructure and Quality

- `supabase/application_rls.sql` defines tenant-scoped policies, role checks, member directory/add-member RPCs, and atomic route-calculation persistence.
- `OSRM_BASE_URL` is server-side configuration; the public OSRM demo server remains a development default only.
- `.env*` is ignored by Git. Browser configuration uses only Supabase's publishable key; service-role credentials are not used by these modules.
- `tests/` contains Node built-in unit, integration, and basic security suites.
- `.github/workflows/quality.yml` runs install, ESLint, tests, and production build on pull requests and pushes to `main`.

## Known Limits

- `application_rls.sql` must be applied in the Supabase SQL Editor; this code session did not mutate the remote database.
- The optional cross-tenant live test needs two dedicated test accounts and their access tokens.
- Typecheck was explicitly skipped for this work item. A fresh production build was not captured after all module changes.
- OSRM Trip uses a heuristic stop order, does not implement Dijkstra/A*, and does not guarantee globally shortest distance.
- There is no cartographic basemap, official live DGEHM fuel feed, or validated IPCC/EPA/GLEC factor catalog.
- The GitHub Actions workflow is committed, but an actual remote workflow run, pull request, branch protection, deployment, and Git remote ownership were not verified.