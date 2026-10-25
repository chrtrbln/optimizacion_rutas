import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_TEST_URL;
const publishableKey = process.env.SUPABASE_TEST_PUBLISHABLE_KEY;
const userAToken = process.env.SUPABASE_TEST_USER_A_ACCESS_TOKEN;
const userBToken = process.env.SUPABASE_TEST_USER_B_ACCESS_TOKEN;
const missingConfiguration = !supabaseUrl || !publishableKey || !userAToken || !userBToken;

test("RLS prevents one company user from reading another company's vehicle", { skip: missingConfiguration }, async () => {
  const createTestClient = (accessToken) => createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const userA = createTestClient(userAToken);
  const userB = createTestClient(userBToken);

  const [{ data: authA, error: authAError }, { data: authB, error: authBError }] = await Promise.all([
    userA.auth.getUser(userAToken),
    userB.auth.getUser(userBToken),
  ]);
  assert.ifError(authAError);
  assert.ifError(authBError);
  assert.ok(authA.user && authB.user, "Both test access tokens must be valid.");
  assert.notEqual(authA.user.id, authB.user.id, "Use two separate test accounts.");

  const [{ data: membershipA, error: membershipAError }, { data: membershipB, error: membershipBError }] = await Promise.all([
    userA.from("company_members").select("company_id").eq("user_id", authA.user.id).eq("is_active", true).maybeSingle(),
    userB.from("company_members").select("company_id").eq("user_id", authB.user.id).eq("is_active", true).maybeSingle(),
  ]);
  assert.ifError(membershipAError);
  assert.ifError(membershipBError);
  assert.ok(membershipA && membershipB, "Both test users must have active memberships.");
  assert.notEqual(membershipA.company_id, membershipB.company_id, "The live security test requires two distinct test companies.");

  const { data: otherCompanyVehicle, error: otherCompanyVehicleError } = await userB
    .from("vehicles")
    .select("id")
    .eq("company_id", membershipB.company_id)
    .limit(1)
    .maybeSingle();
  assert.ifError(otherCompanyVehicleError);
  assert.ok(otherCompanyVehicle, "Seed at least one vehicle in company B before running the live RLS check.");

  const { data: leakedVehicle, error: crossTenantError } = await userA
    .from("vehicles")
    .select("id")
    .eq("id", otherCompanyVehicle.id)
    .maybeSingle();
  assert.ifError(crossTenantError);
  assert.equal(leakedVehicle, null, "Company A must not read company B's vehicle.");
});