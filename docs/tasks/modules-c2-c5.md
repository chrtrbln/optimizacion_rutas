# Modules C2-C5

Status: implemented; apply `supabase/application_rls.sql` before end-to-end use.

## Implemented

- C2: reads active company locations/vehicles, calls the authenticated OSRM endpoint, validates location ownership, and persists route, ordered stops, PostGIS geometry, and calculation snapshots through an atomic RPC.
- Added an authenticated `/api/routing/trip` endpoint. It resolves submitted location IDs against the user's company before calling OSRM and validates the provider response.
- C1: tenant-scoped vehicle CRUD and Auth-backed company membership administration.
- C3/C4: read saved route calculations and stored price/emission snapshots; editable scenarios do not rewrite history.
- C5: reports persisted company calculations and saved reference sources; CSV and print/PDF exports are client-side.
- Added `supabase/application_rls.sql` with company/role policies and required RPCs.

## Boundaries

- OSRM Trip uses its documented heuristic waypoint-ordering behavior. It does not implement Dijkstra/A* or guarantee shortest-distance optimization.
- A basemap, live DGEHM price feed, and validated official IPCC/EPA/GLEC factor catalog are not connected.
- OSRM Trip uses heuristic stop ordering and does not implement Dijkstra/A* or guarantee globally shortest distance.
- Editable calculator scenarios and unsaved route drafts remain in browser memory only.
- Run `supabase/application_rls.sql` in Supabase SQL Editor; the initial schema SQL does not enable these policies/RPCs.

## Verification

- See `docs/project-quality/test-report.md` for the current verification record.
- Supabase SQL application and authenticated cross-company behavior require manual verification in the Supabase project.