# Vehicles

Own vehicle domain types and fleet-management behavior. Each company has one implicit fleet; do not introduce fleet-management entities of its own.

`demo-data.ts` currently supplies frontend-only sample vehicles and profiles. `components/FleetManagement.tsx` owns temporary interaction state. Replace the sample-data boundary with tenant-scoped repositories and Supabase Auth membership/profile access when backend integration is authorized. Never store passwords, tokens, or sessions in profile records.