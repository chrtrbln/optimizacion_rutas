import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "../../../../supabase/server";
import {
  calculateOsrmRoute,
  OsrmRoutingError,
  type RoutePointInput,
} from "@/lib/routing/osrm";
import { parseRouteRequest } from "@/features/routes/route-request";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: NextRequest) {
  const supabase = createClient(await cookies());
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Inicia sesión para calcular una ruta." }, { status: 401 });
  }

  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json({ error: "La solicitud no contiene JSON válido." }, { status: 400 });
  }

  const routeRequest = parseRouteRequest(requestBody);
  if (!routeRequest) {
    return NextResponse.json({ error: "Indica un nombre, vehículo y entre 2 y 12 puntos válidos y sin repetir." }, { status: 400 });
  }
  const { stops } = routeRequest;

  const { data: membershipData, error: membershipError } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();
  const membership: unknown = membershipData;

  if (membershipError || !isRecord(membership) || typeof membership.company_id !== "string") {
    return NextResponse.json({ error: "No se encontró una empresa activa para tu usuario." }, { status: 403 });
  }

  const locationIds = [...new Set(stops.map((stop) => stop.locationId))];
  const { data: locationData, error: locationError } = await supabase
    .from("locations")
    .select("id,name,latitude,longitude")
    .eq("company_id", membership.company_id)
    .eq("is_active", true)
    .in("id", locationIds);
  const locationRows: unknown = locationData;

  if (locationError || !Array.isArray(locationRows)) {
    return NextResponse.json({ error: "No se pudieron validar las ubicaciones de la empresa." }, { status: 403 });
  }

  const locations = new Map<string, { name: string; latitude: number; longitude: number }>();
  for (const row of locationRows) {
    if (
      isRecord(row) &&
      typeof row.id === "string" &&
      typeof row.name === "string" &&
      typeof row.latitude === "number" &&
      Number.isFinite(row.latitude) &&
      typeof row.longitude === "number" &&
      Number.isFinite(row.longitude)
    ) {
      locations.set(row.id, {
        name: row.name,
        latitude: row.latitude,
        longitude: row.longitude,
      });
    }
  }

  if (locationIds.some((locationId) => !locations.has(locationId))) {
    return NextResponse.json({ error: "Una o más ubicaciones no pertenecen a tu empresa o están inactivas." }, { status: 403 });
  }

  const { data: vehicleData, error: vehicleError } = await supabase
    .from("vehicles")
    .select("id,fuel_type,status")
    .eq("id", routeRequest.vehicleId)
    .eq("company_id", membership.company_id)
    .in("status", ["available", "assigned"])
    .maybeSingle();
  const vehicle: unknown = vehicleData;
  if (vehicleError || !isRecord(vehicle) || typeof vehicle.fuel_type !== "string") {
    return NextResponse.json({ error: "El vehículo no está disponible o no pertenece a tu empresa." }, { status: 403 });
  }

  const calculatedAt = new Date().toISOString();
  const [fuelPriceResult, emissionFactorResult] = await Promise.all([
    supabase
      .from("fuel_prices")
      .select("id,valid_from,valid_to")
      .eq("fuel_type", vehicle.fuel_type)
      .eq("is_active", true)
      .lte("valid_from", calculatedAt)
      .order("valid_from", { ascending: false })
      .limit(100),
    supabase
      .from("emission_factors")
      .select("id,valid_from,valid_to")
      .eq("fuel_type", vehicle.fuel_type)
      .eq("is_active", true)
      .lte("valid_from", calculatedAt)
      .order("valid_from", { ascending: false })
      .limit(100),
  ]);
  if (fuelPriceResult.error || emissionFactorResult.error) {
    return NextResponse.json({ error: "No se pudieron consultar los precios o factores vigentes." }, { status: 502 });
  }

  function isCurrentReference(reference: unknown): reference is Record<string, unknown> {
    if (!isRecord(reference) || typeof reference.id !== "string" || typeof reference.valid_from !== "string") return false;
    const validTo = reference.valid_to;
    return validTo === null || typeof validTo === "string" && Date.parse(validTo) > Date.parse(calculatedAt);
  }

  const fuelPrice = Array.isArray(fuelPriceResult.data) ? fuelPriceResult.data.find(isCurrentReference) : undefined;
  const emissionFactor = Array.isArray(emissionFactorResult.data) ? emissionFactorResult.data.find(isCurrentReference) : undefined;
  if (!fuelPrice || !emissionFactor) {
    return NextResponse.json({ error: "Agrega un precio y un factor de emisiones vigentes para este combustible." }, { status: 409 });
  }

  const points: RoutePointInput[] = stops.map((stop) => {
    const location = locations.get(stop.locationId)!;
    return {
      id: stop.id,
      locationId: stop.locationId,
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
    };
  });

  try {
    const route = await calculateOsrmRoute(points);
    const pointById = new Map(points.map((point) => [point.id, point]));
    const orderedStops = route.orderedStopIds.map((stopId, index) => {
      const point = pointById.get(stopId);
      if (!point) throw new Error("OSRM devolvió una parada desconocida.");
      return {
        location_id: point.locationId,
        stop_type: index === 0 ? "origin" : index === route.orderedStopIds.length - 1 ? "destination" : "waypoint",
      };
    });

    const { data: persistedData, error: persistError } = await supabase.rpc("persist_osrm_route_calculation", {
      p_route_name: routeRequest.routeName,
      p_vehicle_id: routeRequest.vehicleId,
      p_fuel_price_id: fuelPrice.id,
      p_emission_factor_id: emissionFactor.id,
      p_distance_meters: route.distanceMeters,
      p_duration_seconds: route.durationSeconds,
      p_geometry: { type: "LineString", coordinates: route.geometry },
      p_ordered_stops: orderedStops,
    });
    const persistedRows: unknown = persistedData;
    const persisted = Array.isArray(persistedRows) ? persistedRows[0] : persistedRows;
    if (persistError || !isRecord(persisted) || typeof persisted.route_code !== "string") {
      return NextResponse.json({ error: "La ruta se calculó, pero no se pudo guardar. Ejecuta application_rls.sql y revisa los datos vigentes." }, { status: 500 });
    }

    return NextResponse.json({ ...route, routeCode: persisted.route_code }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof OsrmRoutingError
      ? error.message
      : "No se pudo calcular la ruta. Intenta de nuevo.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}