# Fleet Management (C1)

Status: implemented with Supabase data access; remote RLS setup required.

## Implemented

- Replaced local demo arrays with tenant-scoped Supabase vehicle and member reads.
- Added persistent vehicle create/update, duplicate-plate handling, role changes, member activation, and existing-Auth-user membership creation.
- Added read/write controls based on the current admin/planner/viewer role.
- Added runtime validation/mapping of database records in `src/features/vehicles/data/fleet-data.ts`.
- New memberships require an existing Supabase Auth account; the client never creates passwords or uses a service-role key.

## Verification

- Apply `supabase/application_rls.sql` in the Supabase project before remote reads/writes.
- See `docs/project-quality/test-report.md` for the current test/check record.