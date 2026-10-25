import assert from "node:assert/strict";
import test from "node:test";
import { parseRouteRequest } from "../../src/features/routes/route-request.ts";

const vehicleId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const originId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const destinationId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

test("valid route request accepts bounded IDs and trims the name", () => {
  const result = parseRouteRequest({
    routeName: "  Route test  ",
    vehicleId,
    stops: [
      { id: "origin", locationId: originId },
      { id: "destination", locationId: destinationId },
    ],
  });
  assert.equal(result.routeName, "Route test");
  assert.equal(result.stops.length, 2);
});

test("route request rejects malformed UUIDs and duplicate stop IDs", () => {
  assert.equal(parseRouteRequest({ routeName: "test", vehicleId: "not-a-uuid", stops: [] }), null);
  assert.equal(parseRouteRequest({ routeName: "test", vehicleId, stops: [{ id: "same", locationId: originId }, { id: "same", locationId: destinationId }] }), null);
  assert.equal(parseRouteRequest({ routeName: "test", vehicleId, stops: [{ id: "origin", locationId: "other-company-id" }, { id: "dest", locationId: destinationId }] }), null);
});

test("route request enforces 2 to 12 stops and route-name limits", () => {
  const stop = (index) => ({ id: `stop-${index}`, locationId: originId });
  assert.equal(parseRouteRequest({ routeName: "test", vehicleId, stops: [stop(0)] }), null);
  assert.equal(parseRouteRequest({ routeName: "test", vehicleId, stops: Array.from({ length: 13 }, (_, index) => stop(index)) }), null);
  assert.equal(parseRouteRequest({ routeName: " ", vehicleId, stops: [stop(0), stop(1)] }), null);
  assert.equal(parseRouteRequest({ routeName: "x".repeat(161), vehicleId, stops: [stop(0), stop(1)] }), null);
});