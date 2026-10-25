# Estimates

Own route distance, duration, fuel, fuel-cost, and kg CO2e estimation behavior. Preserve the fuel prices and emission factors used for historical calculations.

`data/operations-query.ts` loads current route calculations and their stored price/emission snapshots for the signed-in company. `calculations.ts` contains the tested distance-to-fuel, cost, and emissions formulas. Editable UI values are what-if scenarios only and do not change historical records. The prototype does not integrate an official DGEHM feed or authoritative IPCC/EPA/GLEC reference catalog.