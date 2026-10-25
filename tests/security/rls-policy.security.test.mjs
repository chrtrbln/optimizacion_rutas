import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const policySql = await readFile(new URL("../../supabase/application_rls.sql", import.meta.url), "utf8");

test("all prototype tables have RLS enabled", () => {
  const tables = ["companies", "profiles", "company_members", "vehicles", "operators", "locations", "fuel_prices", "emission_factors", "route_plans", "route_stops", "route_operator_assignments", "route_calculations"];
  for (const table of tables) {
    assert.match(policySql, new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY;`, "i"));
  }
});

test("operational writes require active admin or planner membership", () => {
  assert.match(policySql, /route_planner_has_role\(ARRAY\['admin', 'planner'\]::text\[\]\)/);
  assert.match(policySql, /route_planner_company_id\(\)/);
  assert.match(policySql, /auth\.uid\(\)/);
  assert.match(policySql, /membership\.is_active = true/);
});

test("membership and route RPCs are protected and schema-qualified", () => {
  assert.match(policySql, /SECURITY DEFINER[\s\S]*SET search_path = ''/);
  assert.match(policySql, /add_company_member_by_email/);
  assert.match(policySql, /persist_osrm_route_calculation/);
  assert.match(policySql, /REVOKE ALL ON FUNCTION public\.persist_osrm_route_calculation/);
  assert.match(policySql, /GRANT EXECUTE ON FUNCTION public\.persist_osrm_route_calculation[\s\S]*TO authenticated/);
});

test("membership table grants cannot change tenant or user identifiers directly", () => {
  assert.match(policySql, /GRANT UPDATE \(role, is_active\) ON public\.company_members/);
  assert.match(policySql, /REVOKE INSERT, DELETE ON public\.company_members FROM authenticated/);
});

test("calculation snapshots are not directly mutable by authenticated clients", () => {
  assert.match(policySql, /GRANT INSERT ON public\.route_calculations TO authenticated/);
  assert.match(policySql, /REVOKE UPDATE, DELETE ON public\.route_calculations FROM authenticated/);
  assert.doesNotMatch(policySql, /GRANT SELECT, INSERT, UPDATE, DELETE ON[\s\S]{0,300}public\.route_calculations/);
  assert.match(policySql, /DROP POLICY IF EXISTS tenant_route_calculations_update ON public\.route_calculations/);
  assert.match(policySql, /ST_NPoints\(v_route_geometry\) > 50000/);
});