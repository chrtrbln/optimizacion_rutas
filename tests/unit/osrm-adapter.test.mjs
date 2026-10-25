import assert from "node:assert/strict";
import test from "node:test";
import { calculateOsrmRoute, OsrmRoutingError } from "../../src/lib/routing/osrm.ts";

const points = [
  { id: "origin", locationId: "11111111-1111-4111-8111-111111111111", name: "San Salvador", latitude: 13.6929, longitude: -89.2182 },
  { id: "stop-a", locationId: "22222222-2222-4222-8222-222222222222", name: "Santa Tecla", latitude: 13.6769, longitude: -89.2797 },
  { id: "stop-b", locationId: "33333333-3333-4333-8333-333333333333", name: "Sonsonate", latitude: 13.7181, longitude: -89.7247 },
  { id: "destination", locationId: "44444444-4444-4444-8444-444444444444", name: "Santa Ana", latitude: 13.9942, longitude: -89.5597 },
];

function mockFetch(t, responseBody) {
  const originalFetch = globalThis.fetch;
  let requestUrl;
  globalThis.fetch = async (url) => {
    requestUrl = new URL(String(url));
    return Response.json(responseBody);
  };
  t.after(() => { globalThis.fetch = originalFetch; });
  return () => requestUrl;
}

test("Trip service request fixes endpoints and maps OSRM waypoint order", async (t) => {
  const getRequestUrl = mockFetch(t, {
    code: "Ok",
    trips: [{
      distance: 150000,
      duration: 10800,
      geometry: { type: "LineString", coordinates: [[-89.2182, 13.6929], [-89.5, 13.8], [-89.5597, 13.9942]] },
    }],
    waypoints: [
      { waypoint_index: 0, distance: 2, location: [-89.2182, 13.6929] },
      { waypoint_index: 2, distance: 4, location: [-89.2797, 13.6769] },
      { waypoint_index: 1, distance: 3, location: [-89.7247, 13.7181] },
      { waypoint_index: 3, distance: 1, location: [-89.5597, 13.9942] },
    ],
  });
  const oldBaseUrl = process.env.OSRM_BASE_URL;
  process.env.OSRM_BASE_URL = "https://osrm.test";
  t.after(() => {
    if (oldBaseUrl === undefined) delete process.env.OSRM_BASE_URL;
    else process.env.OSRM_BASE_URL = oldBaseUrl;
  });

  const result = await calculateOsrmRoute(points);
  const requestUrl = getRequestUrl();
  assert.equal(requestUrl.pathname.startsWith("/trip/v1/driving/"), true);
  assert.equal(requestUrl.searchParams.get("roundtrip"), "false");
  assert.equal(requestUrl.searchParams.get("source"), "first");
  assert.equal(requestUrl.searchParams.get("destination"), "last");
  assert.deepEqual(result.orderedStopIds, ["origin", "stop-b", "stop-a", "destination"]);
  assert.equal(result.distanceMeters, 150000);
  assert.deepEqual(result.geometry[0], [-89.2182, 13.6929]);
});

test("Route service preserves the supplied order for two stops", async (t) => {
  mockFetch(t, {
    code: "Ok",
    routes: [{ distance: 4000, duration: 500, geometry: { type: "LineString", coordinates: [[-89.2, 13.7], [-89.3, 13.8]] } }],
    waypoints: [
      { distance: 0, location: [-89.2, 13.7] },
      { distance: 3, location: [-89.3, 13.8] },
    ],
  });
  const result = await calculateOsrmRoute(points.slice(0, 2));
  assert.deepEqual(result.orderedStopIds, ["origin", "stop-a"]);
  assert.equal(result.durationSeconds, 500);
});

test("OSRM no-route responses become safe user-facing errors", async (t) => {
  mockFetch(t, { code: "NoRoute", message: "provider detail" });
  await assert.rejects(() => calculateOsrmRoute(points.slice(0, 2)), /No se encontró un recorrido/);
});

test("malformed provider geometry is rejected", async (t) => {
  mockFetch(t, {
    code: "Ok",
    trips: [{ distance: 1, duration: 1, geometry: { type: "Point", coordinates: [-89.2, 13.7] } }],
    waypoints: points.map((point, index) => ({ waypoint_index: index, distance: 0, location: [point.longitude, point.latitude] })),
  });
  await assert.rejects(() => calculateOsrmRoute(points), OsrmRoutingError);
});