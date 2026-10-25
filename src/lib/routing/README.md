# Routing Provider Adapter

OSRM integration is implemented in `osrm.ts` and is called only from the authenticated `/api/routing/trip` route. The adapter calls OSRM's `route` service for two points and its `trip` service for three or more points, using the driving profile and GeoJSON geometry. OSRM coordinates are sent as longitude,latitude; distance and duration are returned in meters and seconds.

For multi-stop requests, `roundtrip=false`, `source=first`, and `destination=last` keep the selected endpoints fixed while OSRM recommends an ordering for intermediate stops. The Trip service uses a heuristic (brute force for smaller sets and farthest insertion for larger sets); it does not implement the product's planned Dijkstra/A* algorithms or guarantee globally shortest distance. Do not label its result as such.

The adapter validates OSRM's response before returning it to the client. `OSRM_BASE_URL` can point at a managed/self-hosted instance; the public `router.project-osrm.org` demo host is the development default and should not be treated as a production SLA.