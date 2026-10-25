# Prototype Test Plan

## Objectives

Verify calculation rules, Supabase data mapping/query scoping, OSRM request/response handling, input validation, and basic tenant isolation without depending on production data. This plan is intentionally limited to prototype-level quality assurance.

## Test Environment

- Node.js 24 and the dependencies in `package-lock.json`.
- Local tests use synthetic objects and mocked Supabase/OSRM responses; they do not write to Supabase.
- Optional live tenant test uses two dedicated non-production Supabase users in separate test companies.
- Never use a service-role key or production user token in tests.

## Unit Tests

| Area | Scenario | Expected result |
| --- | --- | --- |
| Estimate formulas | Positive distance, efficiency, fuel price, and factor | Correct liters, USD cost, and kg CO2e. |
| Estimate validation | Negative distance/price or zero efficiency | `RangeError`; no invalid result is accepted. |
| OSRM adapter | Trip with reordered intermediate stops | Fixed endpoints and returned waypoint order are mapped to the original stop IDs. |
| OSRM adapter | Two-stop route | Route service output keeps supplied origin/destination order. |
| OSRM adapter | NoRoute, malformed geometry, or invalid provider payload | Safe typed error; provider response is not trusted or passed through. |
| Route request parser | Invalid UUIDs, repeated stop IDs, empty/oversized route name, or stop count outside 2-12 | Request is rejected. |

## Integration Tests

| Area | Scenario | Expected result |
| --- | --- | --- |
| Operations repository | Mock company routes, current calculations, vehicles, fuel references, and stops | Maps snapshots to report records and includes required company filters. |
| Operations repository | Company has no routes | Returns an empty report without issuing dependent record queries. |
| Persistence SQL | Authenticated planner submits route | RPC validates company, vehicle, current reference rows, stops, then saves route/stops/calculation atomically. |

## Basic Security Tests

| Control | Check | Expected result |
| --- | --- | --- |
| Request validation | Malformed or oversized route request | Rejected before OSRM is called. |
| Tenant boundary | API resolves location IDs using the active company from Supabase, not submitted coordinates | Cross-company or inactive location is denied. |
| RLS configuration | Static suite checks all prototype tables have RLS enabled and policies use active membership/roles. | Missing policy text fails the check. |
| Live isolation (optional) | User A queries the ID of a vehicle owned by user B's distinct company | RLS returns no row to user A. |
| Credential handling | Review environment and workflow inputs | Only public Supabase configuration is client-visible; test tokens are secrets and are never printed. |

## Commands

- `npm run test:unit`
- `npm run test:integration`
- `npm run test:security`
- `npm run test`
- `npm run lint`
- `npm run build`
- `npm run typecheck` (not executed in the current work item, per request)

ESLint is a static-quality gate; it does not replace runtime, integration, or security tests.