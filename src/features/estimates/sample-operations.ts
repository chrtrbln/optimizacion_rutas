export type SampleOperation = {
  id: string;
  date: string;
  route: string;
  origin: string;
  destination: string;
  vehicle: string;
  distanceKm: number;
  fuelType: "Diésel" | "Gasolina regular" | "Gasolina superior";
  efficiencyKmPerLiter: number;
  fuelPriceUsdPerLiter: number;
  emissionFactorKgPerLiter: number;
  fuelSavingsUsd: number;
  emissionsReducedKg: number;
};

export const sampleOperations: SampleOperation[] = [
  {
    id: "OP-1042",
    date: "2026-10-18",
    route: "Abastecimiento norte",
    origin: "San Salvador",
    destination: "Santa Ana",
    vehicle: "P 482-731",
    distanceKm: 67,
    fuelType: "Diésel",
    efficiencyKmPerLiter: 7.2,
    fuelPriceUsdPerLiter: 1.2,
    emissionFactorKgPerLiter: 2.68,
    fuelSavingsUsd: 8.4,
    emissionsReducedKg: 18.76,
  },
  {
    id: "OP-1041",
    date: "2026-10-15",
    route: "Entrega zona occidental",
    origin: "Santa Tecla",
    destination: "Sonsonate",
    vehicle: "P 619-205",
    distanceKm: 62,
    fuelType: "Diésel",
    efficiencyKmPerLiter: 10.4,
    fuelPriceUsdPerLiter: 1.2,
    emissionFactorKgPerLiter: 2.68,
    fuelSavingsUsd: 5.9,
    emissionsReducedKg: 13.18,
  },
  {
    id: "OP-1040",
    date: "2026-10-09",
    route: "Reparto metropolitano",
    origin: "San Salvador",
    destination: "Soyapango",
    vehicle: "P 307-894",
    distanceKm: 24,
    fuelType: "Gasolina regular",
    efficiencyKmPerLiter: 11.8,
    fuelPriceUsdPerLiter: 1.15,
    emissionFactorKgPerLiter: 2.31,
    fuelSavingsUsd: 2.7,
    emissionsReducedKg: 5.42,
  },
  {
    id: "OP-1039",
    date: "2026-10-03",
    route: "Traslado a puerto",
    origin: "San Salvador",
    destination: "Acajutla",
    vehicle: "P 482-731",
    distanceKm: 86,
    fuelType: "Diésel",
    efficiencyKmPerLiter: 7.2,
    fuelPriceUsdPerLiter: 1.2,
    emissionFactorKgPerLiter: 2.68,
    fuelSavingsUsd: 10.1,
    emissionsReducedKg: 22.55,
  },
  {
    id: "OP-1038",
    date: "2026-09-27",
    route: "Entrega a La Libertad",
    origin: "Santa Tecla",
    destination: "La Libertad",
    vehicle: "P 307-894",
    distanceKm: 31,
    fuelType: "Gasolina regular",
    efficiencyKmPerLiter: 11.8,
    fuelPriceUsdPerLiter: 1.15,
    emissionFactorKgPerLiter: 2.31,
    fuelSavingsUsd: 3.4,
    emissionsReducedKg: 6.83,
  },
  {
    id: "OP-1037",
    date: "2026-09-19",
    route: "Abastecimiento central",
    origin: "San Salvador",
    destination: "San Miguel",
    vehicle: "P 619-205",
    distanceKm: 138,
    fuelType: "Diésel",
    efficiencyKmPerLiter: 10.4,
    fuelPriceUsdPerLiter: 1.2,
    emissionFactorKgPerLiter: 2.68,
    fuelSavingsUsd: 12.6,
    emissionsReducedKg: 28.13,
  },
];

export function getSampleOperationsForPeriod(days: number) {
  const sampleEndTimestamp = Date.parse("2026-10-18T23:59:59Z");
  const startTimestamp = sampleEndTimestamp - days * 24 * 60 * 60 * 1000;

  return sampleOperations.filter(
    (operation) => Date.parse(`${operation.date}T12:00:00Z`) >= startTimestamp,
  );
}