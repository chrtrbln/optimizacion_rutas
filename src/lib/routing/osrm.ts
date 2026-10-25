export type RoutePointInput = {
  id: string;
  locationId: string;
  name: string;
  latitude: number;
  longitude: number;
};

export type RouteCoordinate = [longitude: number, latitude: number];

export type OptimizedRoute = {
  distanceMeters: number;
  durationSeconds: number;
  geometry: RouteCoordinate[];
  orderedStopIds: string[];
  snappedPoints: Array<{
    id: string;
    name: string;
    distanceMeters: number;
    coordinate: RouteCoordinate;
  }>;
};

export class OsrmRoutingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OsrmRoutingError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parseCoordinate(value: unknown): RouteCoordinate | null {
  if (
    !Array.isArray(value) ||
    value.length < 2 ||
    !isFiniteNumber(value[0]) ||
    !isFiniteNumber(value[1]) ||
    value[0] < -180 ||
    value[0] > 180 ||
    value[1] < -90 ||
    value[1] > 90
  ) {
    return null;
  }

  return [value[0], value[1]];
}

function getBaseUrl() {
  const baseUrl = process.env.OSRM_BASE_URL ?? "https://router.project-osrm.org";
  const parsedUrl = new URL(baseUrl);

  if (
    !["http:", "https:"].includes(parsedUrl.protocol) ||
    parsedUrl.username ||
    parsedUrl.password ||
    parsedUrl.search ||
    parsedUrl.hash
  ) {
    throw new OsrmRoutingError("La URL del servicio de rutas no es válida.");
  }

  return parsedUrl.toString().replace(/\/$/, "");
}

export async function calculateOsrmRoute(points: RoutePointInput[]): Promise<OptimizedRoute> {
  if (points.length < 2 || points.length > 12) {
    throw new OsrmRoutingError("Selecciona entre 2 y 12 puntos para calcular la ruta.");
  }

  const coordinates = points
    .map(({ latitude, longitude }) => `${longitude},${latitude}`)
    .join(";");
  const service = points.length > 2 ? "trip" : "route";
  const url = new URL(`${getBaseUrl()}/${service}/v1/driving/${coordinates}`);

  if (service === "trip") {
    url.searchParams.set("roundtrip", "false");
    url.searchParams.set("source", "first");
    url.searchParams.set("destination", "last");
  }

  url.searchParams.set("overview", "full");
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("steps", "false");

  let response: Response;
  try {
    response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new OsrmRoutingError("No se pudo conectar con el servicio OSRM.");
  }

  if (!response.ok) {
    throw new OsrmRoutingError("El servicio OSRM no pudo calcular esta ruta.");
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new OsrmRoutingError("El servicio OSRM devolvió una respuesta inválida.");
  }

  if (!isRecord(body)) {
    throw new OsrmRoutingError("El servicio OSRM devolvió una respuesta inválida.");
  }

  if (body.code === "NoRoute" || body.code === "NoTrips") {
    throw new OsrmRoutingError("No se encontró un recorrido entre los puntos seleccionados.");
  }

  if (body.code === "NoSegment") {
    throw new OsrmRoutingError("Uno de los puntos no se pudo ubicar cerca de una vía transitable.");
  }

  if (body.code !== "Ok") {
    throw new OsrmRoutingError("OSRM no pudo interpretar los puntos seleccionados.");
  }

  const routeCollection = service === "trip" ? body.trips : body.routes;
  const route = Array.isArray(routeCollection) ? routeCollection[0] : null;
  if (!isRecord(route)) {
    throw new OsrmRoutingError("OSRM no devolvió un recorrido válido.");
  }

  const geometry = isRecord(route.geometry) ? route.geometry : null;
  const rawCoordinates = geometry?.coordinates;
  if (
    geometry?.type !== "LineString" ||
    !Array.isArray(rawCoordinates) ||
    rawCoordinates.length < 2 ||
    rawCoordinates.length > 50_000
  ) {
    throw new OsrmRoutingError("OSRM devolvió una geometría de ruta inválida.");
  }

  const parsedCoordinates = rawCoordinates.map(parseCoordinate);
  if (parsedCoordinates.some((coordinate) => coordinate === null)) {
    throw new OsrmRoutingError("OSRM devolvió coordenadas de ruta inválidas.");
  }

  if (
    !isFiniteNumber(route.distance) ||
    route.distance < 0 ||
    !isFiniteNumber(route.duration) ||
    route.duration < 0
  ) {
    throw new OsrmRoutingError("OSRM devolvió distancia o duración inválidas.");
  }

  const rawWaypoints = body.waypoints;
  if (!Array.isArray(rawWaypoints) || rawWaypoints.length !== points.length) {
    throw new OsrmRoutingError("OSRM devolvió paradas de ruta inválidas.");
  }

  const parsedWaypoints = rawWaypoints.map((waypoint, inputIndex) => {
    if (
      !isRecord(waypoint) ||
      (service === "trip" && !Number.isInteger(waypoint.waypoint_index)) ||
      !isFiniteNumber(waypoint.distance) ||
      waypoint.distance < 0
    ) {
      return null;
    }

    const coordinate = parseCoordinate(waypoint.location);
    if (!coordinate) return null;

    return {
      inputIndex,
      waypointIndex: service === "trip" ? waypoint.waypoint_index as number : inputIndex,
      distanceMeters: waypoint.distance,
      coordinate,
    };
  });

  if (parsedWaypoints.some((waypoint) => waypoint === null)) {
    throw new OsrmRoutingError("OSRM devolvió datos de parada inválidos.");
  }

  const orderedWaypoints = [...parsedWaypoints].sort(
    (first, second) => first!.waypointIndex - second!.waypointIndex,
  );
  const waypointIndices = orderedWaypoints.map((waypoint) => waypoint!.waypointIndex);
  if (
    waypointIndices.some((index, position) => index !== position) ||
    orderedWaypoints[0]?.inputIndex !== 0 ||
    orderedWaypoints.at(-1)?.inputIndex !== points.length - 1
  ) {
    throw new OsrmRoutingError("OSRM devolvió un orden de paradas inesperado.");
  }

  return {
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    geometry: parsedCoordinates as RouteCoordinate[],
    orderedStopIds: orderedWaypoints.map((waypoint) => points[waypoint!.inputIndex].id),
    snappedPoints: parsedWaypoints.map((waypoint, inputIndex) => ({
      id: points[inputIndex].id,
      name: points[inputIndex].name,
      distanceMeters: waypoint!.distanceMeters,
      coordinate: waypoint!.coordinate,
    })),
  };
}