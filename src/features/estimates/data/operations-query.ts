import type { SupabaseClient } from "@supabase/supabase-js";

export type FuelTypeCode = "diesel" | "regular_gasoline" | "premium_gasoline";

export type FuelPriceRecord = {
  id: string;
  fuelType: FuelTypeCode;
  pricePerLiter: number;
  validFrom: string;
  validTo: string | null;
  sourceName: string;
  sourceReference: string | null;
  isActive: boolean;
};

export type EmissionFactorRecord = {
  id: string;
  fuelType: FuelTypeCode;
  factorValue: number;
  validFrom: string;
  validTo: string | null;
  sourceName: string;
  sourceVersion: string | null;
  sourceReference: string | null;
  isActive: boolean;
};

export type CompanyOperation = {
  id: string;
  routeId: string;
  routeCode: string;
  routeName: string;
  routeStatus: string;
  calculatedAt: string;
  vehicleId: string;
  vehiclePlate: string;
  fuelType: FuelTypeCode;
  distanceKm: number;
  durationMinutes: number;
  fuelLiters: number;
  efficiencyKmPerLiter: number;
  fuelUnitPriceUsd: number;
  fuelCostUsd: number;
  fuelPriceId: string;
  fuelPriceSource: string;
  emissionFactor: number;
  emissionFactorId: string;
  emissionFactorSource: string;
  emissionFactorVersion: string | null;
  emissionsKgCo2e: number;
  stops: string[];
};

export type CompanyOperationsData = {
  operations: CompanyOperation[];
  fuelPrices: FuelPriceRecord[];
  emissionFactors: EmissionFactorRecord[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function readFuelType(value: unknown): FuelTypeCode | null {
  return value === "diesel" || value === "regular_gasoline" || value === "premium_gasoline"
    ? value
    : null;
}

function parseFuelPrices(rows: unknown): FuelPriceRecord[] {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row): FuelPriceRecord[] => {
    if (!isRecord(row)) return [];
    const id = readText(row.id);
    const fuelType = readFuelType(row.fuel_type);
    const pricePerLiter = readNumber(row.price_per_liter);
    const validFrom = readText(row.valid_from);
    const sourceName = readText(row.source_name);
    if (!id || !fuelType || pricePerLiter === null || !validFrom || !sourceName) return [];
    return [{
      id,
      fuelType,
      pricePerLiter,
      validFrom,
      validTo: readText(row.valid_to),
      sourceName,
      sourceReference: readText(row.source_reference),
      isActive: row.is_active === true,
    }];
  });
}

function parseEmissionFactors(rows: unknown): EmissionFactorRecord[] {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row): EmissionFactorRecord[] => {
    if (!isRecord(row)) return [];
    const id = readText(row.id);
    const fuelType = readFuelType(row.fuel_type);
    const factorValue = readNumber(row.factor_value);
    const validFrom = readText(row.valid_from);
    const sourceName = readText(row.source_name);
    if (!id || !fuelType || factorValue === null || !validFrom || !sourceName) return [];
    return [{
      id,
      fuelType,
      factorValue,
      validFrom,
      validTo: readText(row.valid_to),
      sourceName,
      sourceVersion: readText(row.source_version),
      sourceReference: readText(row.source_reference),
      isActive: row.is_active === true,
    }];
  });
}

export async function loadCompanyOperationsData(
  supabase: SupabaseClient,
  companyId: string,
  periodDays: number | null = null,
): Promise<CompanyOperationsData> {
  const { data: routeData, error: routeError } = await supabase
    .from("route_plans")
    .select("id,company_id,route_code,name,status,created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (routeError) throw new Error("No se pudieron cargar las rutas de la empresa.");
  const routes: unknown = routeData;
  const routeRows = Array.isArray(routes) ? routes.filter(isRecord) : [];
  const routeIds = routeRows.flatMap((route) => typeof route.id === "string" ? [route.id] : []);

  let calculationQuery = supabase
    .from("route_calculations")
    .select("id,route_plan_id,vehicle_id,fuel_price_id,emission_factor_id,estimated_distance_km,estimated_duration_minutes,vehicle_efficiency_snapshot,estimated_fuel_liters,fuel_unit_price_snapshot,estimated_fuel_cost,emission_factor_snapshot,estimated_emissions_kg_co2e,is_current,calculated_at")
    .in("route_plan_id", routeIds)
    .eq("is_current", true)
    .order("calculated_at", { ascending: false });

  if (periodDays !== null) {
    if (!Number.isInteger(periodDays) || periodDays <= 0) {
      throw new RangeError("Period must be a positive whole number of days.");
    }
    const periodStart = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();
    calculationQuery = calculationQuery.gte("calculated_at", periodStart);
  }

  const calculationResult = routeIds.length
    ? await calculationQuery
    : { data: [], error: null };
  if (calculationResult.error) throw new Error("No se pudieron cargar los cálculos de ruta de la empresa.");

  const calculations: unknown = calculationResult.data;
  const calculationRows = Array.isArray(calculations) ? calculations.filter(isRecord) : [];
  const fuelPriceIds = [...new Set(calculationRows.flatMap((row) => typeof row.fuel_price_id === "string" ? [row.fuel_price_id] : []))];
  const emissionFactorIds = [...new Set(calculationRows.flatMap((row) => typeof row.emission_factor_id === "string" ? [row.emission_factor_id] : []))];
  const vehicleIds = [...new Set(calculationRows.flatMap((row) => typeof row.vehicle_id === "string" ? [row.vehicle_id] : []))];
  const routeCalculationIds = calculationRows.flatMap((row) => typeof row.route_plan_id === "string" ? [row.route_plan_id] : []);

  const [fuelPriceResult, emissionFactorResult, vehicleResult, stopResult] = await Promise.all([
    fuelPriceIds.length
      ? supabase
          .from("fuel_prices")
          .select("id,fuel_type,price_per_liter,valid_from,valid_to,source_name,source_reference,is_active")
          .in("id", fuelPriceIds)
      : Promise.resolve({ data: [], error: null }),
    emissionFactorIds.length
      ? supabase
          .from("emission_factors")
          .select("id,fuel_type,factor_value,valid_from,valid_to,source_name,source_version,source_reference,is_active")
          .in("id", emissionFactorIds)
      : Promise.resolve({ data: [], error: null }),
    vehicleIds.length
      ? supabase
          .from("vehicles")
          .select("id,company_id,plate_number,fuel_type")
          .eq("company_id", companyId)
          .in("id", vehicleIds)
      : Promise.resolve({ data: [], error: null }),
    routeCalculationIds.length
      ? supabase
          .from("route_stops")
          .select("route_plan_id,sequence_number,name_snapshot")
          .in("route_plan_id", routeCalculationIds)
          .order("sequence_number")
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (fuelPriceResult.error || emissionFactorResult.error || vehicleResult.error || stopResult.error) {
    throw new Error("No se pudieron cargar los snapshots de referencia, vehículos o paradas de ruta.");
  }

  const vehicles: unknown = vehicleResult.data;
  const vehicleById = new Map<string, { plate: string; fuelType: FuelTypeCode }>();
  if (Array.isArray(vehicles)) {
    for (const vehicle of vehicles) {
      if (!isRecord(vehicle)) continue;
      const id = readText(vehicle.id);
      const plate = readText(vehicle.plate_number);
      const fuelType = readFuelType(vehicle.fuel_type);
      if (id && plate && fuelType) vehicleById.set(id, { plate, fuelType });
    }
  }

  const routeById = new Map<string, { routeCode: string; name: string; status: string }>();
  for (const route of routeRows) {
    const id = readText(route.id);
    const routeCode = readText(route.route_code);
    const name = readText(route.name);
    const status = readText(route.status);
    if (id && routeCode && name && status) routeById.set(id, { routeCode, name, status });
  }

  const stops: unknown = stopResult.data;
  const stopsByRoute = new Map<string, Array<{ sequence: number; name: string }>>();
  if (Array.isArray(stops)) {
    for (const stop of stops) {
      if (!isRecord(stop)) continue;
      const routeId = readText(stop.route_plan_id);
      const name = readText(stop.name_snapshot);
      const sequence = readNumber(stop.sequence_number);
      if (!routeId || !name || sequence === null) continue;
      const routeStops = stopsByRoute.get(routeId) ?? [];
      routeStops.push({ sequence, name });
      stopsByRoute.set(routeId, routeStops);
    }
  }

  const operations = calculationRows.flatMap((calculation): CompanyOperation[] => {
    const id = readText(calculation.id);
    const routeId = readText(calculation.route_plan_id);
    const vehicleId = readText(calculation.vehicle_id);
    const fuelPriceId = readText(calculation.fuel_price_id);
    const emissionFactorId = readText(calculation.emission_factor_id);
    const calculatedAt = readText(calculation.calculated_at);
    const route = routeId ? routeById.get(routeId) : undefined;
    const vehicle = vehicleId ? vehicleById.get(vehicleId) : undefined;
    const distanceKm = readNumber(calculation.estimated_distance_km);
    const durationMinutes = readNumber(calculation.estimated_duration_minutes);
    const fuelLiters = readNumber(calculation.estimated_fuel_liters);
    const efficiencyKmPerLiter = readNumber(calculation.vehicle_efficiency_snapshot);
    const fuelUnitPriceUsd = readNumber(calculation.fuel_unit_price_snapshot);
    const fuelCostUsd = readNumber(calculation.estimated_fuel_cost);
    const emissionFactor = readNumber(calculation.emission_factor_snapshot);
    const emissionsKgCo2e = readNumber(calculation.estimated_emissions_kg_co2e);

    if (
      !id || !routeId || !vehicleId || !fuelPriceId || !emissionFactorId || !calculatedAt || !route || !vehicle ||
      distanceKm === null || durationMinutes === null || fuelLiters === null ||
      efficiencyKmPerLiter === null || fuelUnitPriceUsd === null || fuelCostUsd === null ||
      emissionFactor === null || emissionsKgCo2e === null
    ) return [];

    const price = parseFuelPrices(fuelPriceResult.data).find((record) => record.id === fuelPriceId);
    const factor = parseEmissionFactors(emissionFactorResult.data).find((record) => record.id === emissionFactorId);
    if (!price || !factor) return [];

    const routeStops = (stopsByRoute.get(routeId) ?? [])
      .sort((first, second) => first.sequence - second.sequence)
      .map((stop) => stop.name);

    return [{
      id,
      routeId,
      routeCode: route.routeCode,
      routeName: route.name,
      routeStatus: route.status,
      calculatedAt,
      vehicleId,
      vehiclePlate: vehicle.plate,
      fuelType: vehicle.fuelType,
      distanceKm,
      durationMinutes,
      fuelLiters,
      efficiencyKmPerLiter,
      fuelUnitPriceUsd,
      fuelCostUsd,
      fuelPriceId,
      fuelPriceSource: price.sourceName,
      emissionFactor,
      emissionFactorId,
      emissionFactorSource: factor.sourceName,
      emissionFactorVersion: factor.sourceVersion,
      emissionsKgCo2e,
      stops: routeStops,
    }];
  });

  return {
    operations,
    fuelPrices: parseFuelPrices(fuelPriceResult.data),
    emissionFactors: parseEmissionFactors(emissionFactorResult.data),
  };
}