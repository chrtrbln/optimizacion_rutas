# Modules C2-C5

Status: implemented; validation commands skipped by request.

## Implemented

- C2: route draft planner with origin, destination, one vehicle, ordered stops, optimization preference, local draft save/load, and a schematic route preview.
- C3: interactive fuel estimate using distance, vehicle efficiency, fuel type, and editable USD/liter price; includes illustrative price history.
- C4: editable route emissions estimate and period-filtered sample history using illustrative fuel factors.
- C5: period-filtered operational metrics and history, client-side CSV download, and browser print-to-PDF action.
- Added isolated sample operation data and documented future provider/data integration boundaries.

## Boundaries

- No routing algorithm, map API, live DGEHM price feed, authoritative IPCC/EPA/GLEC factor, persistence, or backend service is connected.
- All sample values are illustrative and should not be used as official operational estimates.
- Route drafts and calculator controls remain in browser memory only.

## Verification

- Validation commands intentionally not run per request.