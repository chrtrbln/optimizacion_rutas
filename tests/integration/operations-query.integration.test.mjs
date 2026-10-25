import assert from "node:assert/strict";
import test from "node:test";
import { loadCompanyOperationsData } from "../../src/features/estimates/data/operations-query.ts";

const companyId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const routeId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const vehicleId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const fuelPriceId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const factorId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

function createFakeSupabase() {
  const calls = [];
  const results = {
    route_plans: [{ id: routeId, company_id: companyId, route_code: "R-1", name: "Ruta de prueba", status: "calculated", created_at: "2026-10-20T10:00:00Z" }],
    route_calculations: [{ id: "calc-1", route_plan_id: routeId, vehicle_id: vehicleId, fuel_price_id: fuelPriceId, emission_factor_id: factorId, estimated_distance_km: "42.5", estimated_duration_minutes: "60", vehicle_efficiency_snapshot: "8.5", estimated_fuel_liters: "5", fuel_unit_price_snapshot: "1.10", estimated_fuel_cost: "5.50", emission_factor_snapshot: "2.68", estimated_emissions_kg_co2e: "13.4", is_current: true, calculated_at: "2026-10-20T10:00:00Z" }],
    fuel_prices: [{ id: fuelPriceId, fuel_type: "diesel", price_per_liter: "1.10", valid_from: "2026-10-01T00:00:00Z", valid_to: null, source_name: "test source", source_reference: null, is_active: true }],
    emission_factors: [{ id: factorId, fuel_type: "diesel", factor_value: "2.68", valid_from: "2026-01-01T00:00:00Z", valid_to: null, source_name: "test factor", source_version: "v1", source_reference: null, is_active: true }],
    vehicles: [{ id: vehicleId, company_id: companyId, plate_number: "P 111-111", fuel_type: "diesel" }],
    route_stops: [
      { route_plan_id: routeId, sequence_number: 0, name_snapshot: "Origen" },
      { route_plan_id: routeId, sequence_number: 1, name_snapshot: "Destino" },
    ],
  };

  return {
    calls,
    from(table) {
      calls.push({ table, filters: [] });
      const call = calls.at(-1);
      const builder = {
        select(columns) { call.columns = columns; return this; },
        eq(column, value) { call.filters.push(["eq", column, value]); return this; },
        in(column, value) { call.filters.push(["in", column, value]); return this; },
        gte(column, value) { call.filters.push(["gte", column, value]); return this; },
        order(column, options) { call.order = [column, options]; return this; },
        limit(value) { call.limit = value; return this; },
        then(resolve, reject) { return Promise.resolve({ data: results[table], error: null }).then(resolve, reject); },
      };
      return builder;
    },
  };
}

test("operations repository maps snapshot data and scopes route query by company", async () => {
  const supabase = createFakeSupabase();
  const result = await loadCompanyOperationsData(supabase, companyId);
  assert.equal(result.operations.length, 1);
  assert.equal(result.operations[0].fuelCostUsd, 5.5);
  assert.equal(result.operations[0].emissionsKgCo2e, 13.4);
  assert.deepEqual(result.operations[0].stops, ["Origen", "Destino"]);
  assert.equal(result.fuelPrices[0].id, fuelPriceId);
  assert.equal(result.emissionFactors[0].sourceVersion, "v1");
  assert.ok(supabase.calls.find((call) => call.table === "route_plans").filters.some((filter) => filter[1] === "company_id" && filter[2] === companyId));
  assert.ok(supabase.calls.find((call) => call.table === "vehicles").filters.some((filter) => filter[1] === "company_id" && filter[2] === companyId));
  assert.ok(supabase.calls.find((call) => call.table === "fuel_prices").filters.some((filter) => filter[0] === "in" && filter[1] === "id" && filter[2].includes(fuelPriceId)));
  assert.ok(supabase.calls.find((call) => call.table === "emission_factors").filters.some((filter) => filter[0] === "in" && filter[1] === "id" && filter[2].includes(factorId)));
});

test("operations repository returns an empty company report when no routes exist", async () => {
  const supabase = createFakeSupabase();
  const from = supabase.from;
  supabase.from = function (table) {
    if (table === "route_plans") {
      this.calls.push({ table, filters: [] });
      return {
        select() { return this; },
        eq() { return this; },
        order() { return this; },
        then(resolve, reject) { return Promise.resolve({ data: [], error: null }).then(resolve, reject); },
      };
    }
    return from.call(this, table);
  };
  const result = await loadCompanyOperationsData(supabase, companyId);
  assert.deepEqual(result.operations, []);
  assert.ok(supabase.calls.some((call) => call.table === "route_plans"));
});