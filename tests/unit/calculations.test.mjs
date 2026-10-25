import assert from "node:assert/strict";
import test from "node:test";
import { calculateEstimate, calculateFuelLiters } from "../../src/features/estimates/calculations.ts";

test("fuel liters use distance divided by efficiency", () => {
  assert.equal(calculateFuelLiters(100, 10), 10);
});

test("estimate returns fuel, cost, and emissions from stored units", () => {
  assert.deepEqual(calculateEstimate({
    distanceKm: 100,
    efficiencyKmPerLiter: 10,
    fuelPriceUsdPerLiter: 1.25,
    emissionFactorKgCo2ePerLiter: 2.68,
  }), {
    fuelLiters: 10,
    fuelCostUsd: 12.5,
    emissionsKgCo2e: 26.8,
  });
});

test("zero distance produces zero estimated values", () => {
  assert.deepEqual(calculateEstimate({
    distanceKm: 0,
    efficiencyKmPerLiter: 8,
    fuelPriceUsdPerLiter: 1.2,
    emissionFactorKgCo2ePerLiter: 2.68,
  }), { fuelLiters: 0, fuelCostUsd: 0, emissionsKgCo2e: 0 });
});

test("invalid physical and monetary values are rejected", () => {
  assert.throws(() => calculateFuelLiters(-1, 10), RangeError);
  assert.throws(() => calculateFuelLiters(10, 0), RangeError);
  assert.throws(() => calculateEstimate({
    distanceKm: 10,
    efficiencyKmPerLiter: 5,
    fuelPriceUsdPerLiter: -1,
    emissionFactorKgCo2ePerLiter: 2,
  }), RangeError);
});