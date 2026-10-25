# Vehicles

Own vehicle domain types and fleet-management behavior. Each company has one implicit fleet; do not introduce fleet-management entities of its own.

`data/fleet-data.ts` loads and mutates company vehicles through Supabase and uses SQL RPCs for the Auth-backed member directory and adding existing Auth users. Apply `supabase/application_rls.sql` before use. Auth invitations/passwords remain managed by Supabase Auth; never store credentials in profiles.