# Routes

Own route plans, ordered stops, route assignments, and route-planning domain behavior. Each route has one vehicle and may have multiple operators.

The C2 planner reads active company locations and available vehicles from Supabase, then requests route geometry and stop ordering through the server-side OSRM adapter. Set `OSRM_BASE_URL` to a managed OSRM instance for production; the public OSRM demo server is the development default.

Run `supabase/application_rls.sql` in the Supabase SQL Editor after creating the schema. The planner intentionally queries only the signed-in user's active company. OSRM returns a recommended waypoint order using its Trip service; it does not guarantee Dijkstra/A* or shortest-distance semantics. Successful calculations and their historical snapshots are persisted through an atomic database RPC.