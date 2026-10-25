export type EstimateInput = {
  distanceKm: number;
  efficiencyKmPerLiter: number;
  fuelPriceUsdPerLiter: number;
  emissionFactorKgCo2ePerLiter: number;
};

export type EstimateResult = {
  fuelLiters: number;
  fuelCostUsd: number;
  emissionsKgCo2e: number;
};

export function calculateFuelLiters(distanceKm: number, efficiencyKmPerLiter: number): number {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) {
    throw new RangeError("Distance must be a finite non-negative number of kilometers.");
  }
  if (!Number.isFinite(efficiencyKmPerLiter) || efficiencyKmPerLiter <= 0) {
    throw new RangeError("Fuel efficiency must be a finite number greater than zero.");
  }
  return distanceKm / efficiencyKmPerLiter;
}

export function calculateEstimate(input: EstimateInput): EstimateResult {
  const fuelLiters = calculateFuelLiters(input.distanceKm, input.efficiencyKmPerLiter);
  if (!Number.isFinite(input.fuelPriceUsdPerLiter) || input.fuelPriceUsdPerLiter < 0) {
    throw new RangeError("Fuel price must be a finite non-negative number.");
  }
  if (
    !Number.isFinite(input.emissionFactorKgCo2ePerLiter) ||
    input.emissionFactorKgCo2ePerLiter < 0
  ) {
    throw new RangeError("Emission factor must be a finite non-negative number.");
  }

  return {
    fuelLiters,
    fuelCostUsd: fuelLiters * input.fuelPriceUsdPerLiter,
    emissionsKgCo2e: fuelLiters * input.emissionFactorKgCo2ePerLiter,
  };
}