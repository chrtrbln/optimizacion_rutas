export type RequestedStop = { id: string; locationId: string };

export type ParsedRouteRequest = {
  routeName: string;
  vehicleId: string;
  stops: RequestedStop[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseRouteRequest(body: unknown): ParsedRouteRequest | null {
  if (!isRecord(body) || !Array.isArray(body.stops) || body.stops.length < 2 || body.stops.length > 12) {
    return null;
  }
  if (
    typeof body.routeName !== "string" ||
    body.routeName.trim().length === 0 ||
    body.routeName.length > 160 ||
    typeof body.vehicleId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.vehicleId)
  ) return null;

  const stops: RequestedStop[] = [];
  const seenStopIds = new Set<string>();
  for (const rawStop of body.stops) {
    if (
      !isRecord(rawStop) ||
      typeof rawStop.id !== "string" ||
      rawStop.id.length === 0 ||
      rawStop.id.length > 64 ||
      typeof rawStop.locationId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(rawStop.locationId) ||
      seenStopIds.has(rawStop.id)
    ) {
      return null;
    }

    seenStopIds.add(rawStop.id);
    stops.push({ id: rawStop.id, locationId: rawStop.locationId });
  }

  return { routeName: body.routeName.trim(), vehicleId: body.vehicleId, stops };
}