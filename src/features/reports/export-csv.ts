import type { CompanyOperation } from "@/features/estimates/data/operations-query";

export function buildOperationsCsv(operations: CompanyOperation[]): string {
  const headers = [
    "route_code",
    "route_name",
    "route_status",
    "calculated_at",
    "vehicle_plate",
    "fuel_type",
    "distance_km",
    "duration_minutes",
    "fuel_liters",
    "fuel_price_usd_per_liter",
    "fuel_cost_usd",
    "emission_factor_kg_co2e_per_liter",
    "emissions_kg_co2e",
    "fuel_price_source",
    "emission_factor_source",
    "emission_factor_version",
    "stops",
  ];
  const rows = operations.map((operation) => [
    operation.routeCode,
    operation.routeName,
    operation.routeStatus,
    operation.calculatedAt,
    operation.vehiclePlate,
    operation.fuelType,
    operation.distanceKm,
    operation.durationMinutes,
    operation.fuelLiters,
    operation.fuelUnitPriceUsd,
    operation.fuelCostUsd,
    operation.emissionFactor,
    operation.emissionsKgCo2e,
    operation.fuelPriceSource,
    operation.emissionFactorSource,
    operation.emissionFactorVersion ?? "",
    operation.stops.join(" | "),
  ]);
  const quote = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
  return [headers, ...rows].map((row) => row.map(quote).join(",")).join("\r\n");
}

export function downloadOperationsCsv(operations: CompanyOperation[]): void {
  const blob = new Blob(["\uFEFF", buildOperationsCsv(operations)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "traza-reporte-operativo.csv";
  link.click();
  URL.revokeObjectURL(url);
}