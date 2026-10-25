# Supabase SQL Scripts

Run `supabase_create_tables.sql` once to create the schema. Create a test account in Supabase Auth, then edit the `v_test_email` value at the top of `seed_test_data.sql` to match that account and run the seed script in the SQL Editor. It inserts/upserts a clearly labeled test company, active company membership, vehicles, operators, Salvadoran locations, synthetic fuel/emissions references, and one calculated multi-stop route. The ending query summarizes the seeded records.

Run `application_rls.sql` after the schema to install tenant-scoped reads/writes and the member/route persistence RPCs. The seed script does not create Auth users or passwords, and its fuel prices/emission factors are not official values. Use a dedicated test account; the script intentionally stops if that user already belongs to a different company.

For only a test company and admin membership, use `seed_test_company.sql` instead of the larger demo seed. Change the test email at the top of that script to match your existing Auth user.