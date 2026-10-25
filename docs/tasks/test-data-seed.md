# Supabase Test Data Seed

Status: implemented; not executed against Supabase.

## Implemented

- Added a rerunnable SQL Editor seed for a dedicated test company and Auth user.
- Included two vehicles, two operators, three Salvadoran locations, three synthetic fuel-price records, three synthetic emission factors, a multi-stop route, assignments, and a versioned route calculation with PostGIS geometry.
- Added a final summary query and documented the required Auth user, RLS script, and test-only nature of values.
- Prevented the seed from reassigning a user who already belongs to another company.

## Verification

- The SQL was checked against the current `supabase_create_tables.sql` schema but was not executed; database mutation remains under the user's control.