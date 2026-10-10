# Foundation Structure

Status: complete.

## Implemented

- Added documented feature areas for authentication, companies, vehicles, operators, locations, routes, and estimates.
- Added shared UI, shared types, Supabase infrastructure, routing adapter, and migration locations.
- Added `typecheck` and `test` scripts and pointed the `@/` alias at `src/`.
- Left the existing App Router pages and application behavior unchanged.

## Verification

- `npm run lint`: passed
- `npm run typecheck`: passed
- `npm run test`: passed; Node discovered 0 tests because no feature behavior has been implemented.
- `npm run build`: passed
- No secrets or database schema changes added.