# Test Company Seed

Status: implemented; not executed against Supabase.

## Implemented

- Added a minimal SQL Editor script that creates/upserts the dedicated test company, profile, and active admin membership for an existing Supabase Auth user.
- Added a guard that refuses to reassign a user already attached to a different company.
- Added a result query showing the company and linked membership.

## Verification

- Checked against the current `companies`, `profiles`, and `company_members` schema.
- Not executed against the database; run manually in the Supabase SQL Editor.