# Prototype Test Report

Date: 2026-10-24

## Scope

Unit tests for formulas and OSRM parsing; mocked integration tests for the Supabase operations query; security checks for request parsing/RLS configuration; optional two-user live RLS test.

## How Each Test Works

| Test file | How it works and what it proves |
| --- | --- |
| `tests/unit/calculations.test.mjs` | Calls pure calculation functions with known distance, efficiency, price, and factor values; checks exact liters/cost/emissions and verifies invalid negative/zero inputs throw `RangeError`. |
| `tests/unit/osrm-adapter.test.mjs` | Replaces `fetch` with controlled OSRM JSON responses. Checks Trip fixed endpoints and waypoint reordering, two-point Route behavior, NoRoute translation, and rejection of malformed geometry. It does not depend on the external OSRM service. |
| `tests/integration/operations-query.integration.test.mjs` | Provides a Supabase-shaped fluent query mock with route, calculation, vehicle, stop, fuel-price, and factor rows. Verifies mapping of stored snapshots into report records, company ID filters, and the empty-company case. It does not connect to a live Supabase project. |
| `tests/security/route-input.security.test.mjs` | Sends malformed route-request objects to the pure parser. Checks UUID shape, duplicate stop IDs, route-name limits, and the 2-12 stop bound before the API can call OSRM. |
| `tests/security/rls-policy.security.test.mjs` | Reads `supabase/application_rls.sql` as text and checks that expected tables enable RLS, active membership/role checks are present, and privileged RPCs revoke public execution. This is a configuration guard, not a PostgreSQL policy execution test. |
| `tests/security/tenant-isolation.live.test.mjs` | When given two dedicated user JWTs, verifies each account has a different company and attempts to fetch company B's vehicle as user A; expects no row. It is skipped without the documented test environment variables and should only use isolated test accounts. |

The local test runner uses Node's built-in `node:test` framework; no test framework dependency or database seed is needed for the default suite.

## Recorded Results

 Final local suite: 19 tests discovered, 18 passed, 0 failed, and 1 optional live test skipped.
 ESLint passed with no warnings or errors.
 Production build passed; Next.js completed its compilation and TypeScript build phase and generated all routes.
 The GitHub Actions workflow is committed, but no hosted workflow run was verified.
- Production build passed before the final C1 dialog-only markup and historical-reference query edits; a post-edit build was not collected.
- No live database writes were performed by the agent. Apply `supabase/application_rls.sql` manually before attempting end-to-end data tests.

## Interpretation

The passing local tests demonstrate deterministic formulas, OSRM response validation, route request bounds, and tenant-filtered query construction at unit/mock level. They do not prove deployed RLS behavior, a full authenticated route save, or production provider availability. Those require applying the SQL policies and running the optional live test with isolated test accounts.

## ESLint and GitHub

ESLint is configured as a separate `npm run lint` quality gate for code-style and static correctness. It is included in `.github/workflows/quality.yml` before tests and build. The workflow is present in the repository; no GitHub Actions execution result, remote repository URL, pull request, branch-protection rule, or hosted deployment was verified. Do not report the workflow as a completed CI run until GitHub records a successful run.