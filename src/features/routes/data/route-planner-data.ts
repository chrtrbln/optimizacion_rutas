import { createClient } from "../../../../supabase/client";

export type RouteLocation = {
  id: string;
  name: string;
  department: string | null;
  district: string | null;
  latitude: number;
  longitude: number;
};

export type RouteVehicle = {
  id: string;
  plateNumber: string;
  description: string;
  efficiencyKmPerLiter: number;
};

export type RoutePlannerData = {
  companyId: string;
  locations: RouteLocation[];
  vehicles: RouteVehicle[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseLocations(value: unknown): RouteLocation[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((row): RouteLocation[] => {
    if (!isRecord(row)) return [];
    const id = readText(row.id);
    const name = readText(row.name);
    const latitude = readNumber(row.latitude);
    const longitude = readNumber(row.longitude);

    if (
      !id ||
      !name ||
      latitude === null ||
      longitude === null ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return [];
    }

    return [{
      id,
      name,
      department: readText(row.department),
      district: readText(row.district),
      latitude,
      longitude,
    }];
  });
}

function parseVehicles(value: unknown): RouteVehicle[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((row): RouteVehicle[] => {
    if (!isRecord(row)) return [];
    const id = readText(row.id);
    const plateNumber = readText(row.plate_number);
    const efficiencyKmPerLiter = readNumber(row.fuel_efficiency_km_per_liter);
    if (!id || !plateNumber || efficiencyKmPerLiter === null || efficiencyKmPerLiter <= 0) {
      return [];
    }

    const makeModel = [readText(row.brand), readText(row.model)]
      .filter((value): value is string => value !== null)
      .join(" ");
    const vehicleType = readText(row.vehicle_type);

    return [{
      id,
      plateNumber,
      description: makeModel || vehicleType || "Vehículo",
      efficiencyKmPerLiter,
    }];
  });
}

export async function loadRoutePlannerData(): Promise<RoutePlannerData> {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Tu sesión no está activa. Inicia sesión nuevamente.");
  }

  const { data: membershipData, error: membershipError } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();
  const membership: unknown = membershipData;

  if (membershipError) {
    throw new Error("No se pudo consultar tu empresa. Verifica las políticas RLS del proyecto.");
  }

  if (!isRecord(membership) || typeof membership.company_id !== "string") {
    throw new Error("Tu usuario todavía no pertenece a una empresa activa.");
  }

  const companyId = membership.company_id;
  const [locationsResult, vehiclesResult] = await Promise.all([
    supabase
      .from("locations")
      .select("id,name,department,district,latitude,longitude")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("vehicles")
      .select("id,plate_number,brand,model,vehicle_type,fuel_efficiency_km_per_liter,status")
      .eq("company_id", companyId)
      .eq("status", "available")
      .order("plate_number"),
  ]);

  if (locationsResult.error || vehiclesResult.error) {
    throw new Error("No se pudieron cargar ubicaciones y vehículos. Verifica las políticas RLS.");
  }

  const locationRows: unknown = locationsResult.data;
  const vehicleRows: unknown = vehiclesResult.data;

  return {
    companyId,
    locations: parseLocations(locationRows),
    vehicles: parseVehicles(vehicleRows),
  };
}