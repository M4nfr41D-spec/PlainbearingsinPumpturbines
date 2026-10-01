# RF-PGV runtime manifest

This folder is the **authoritative runtime path** for the source-constrained candidate.

## Loaded by `index.html`

1. `base/index_pre_source_constrained_2026-10-01.html`
   - Frozen copy of the last pre-Surgery-03 tool UI/runtime.
   - Preserved byte-for-byte from blob `630dcdbf2e3e7d91bfcbcbc03bbbc389f6c03258`.
   - Do not edit this frozen baseline.

2. `rfpgv_source_data_v1.js`
   - Figure-1 force traces digitised from the reviewed Paolo-informed report.
   - Reference clearance: Δd = 0.200 mm.
   - Status: `SOURCE_DIGITISED_PROVISIONAL` pending original numerical data.

3. `rfpgv_force_pressure_bridge_v2.js`
   - Source-constrained force evaluation.
   - Clearance transform away from Δd = 0.200 mm.
   - Separate Figure-2 FE pressure case: 54.4 / 116.1 MPa.
   - Explicitly prevents deriving FE contact pressure from live F2.

4. `rfpgv_runtime_integration_v1.js`
   - Surgery-03 runtime wiring.
   - Makes force bars, force trajectory, L2 comparison index, schematic and engineering note use the governed force path.
   - Converts the pressure card to the separate fixed FE source case.

## Not runtime dependencies

Files below `calibration/` are evidence, regression or historical candidate assets. They are **not loaded by the app** unless promoted here explicitly.

In particular, `calibration/rf_pgv_force_adapter_candidate_v1.js` is superseded by the v2 force/pressure bridge and is retained only for traceability.

## Current migration boundary

Integrated in Surgery 03:
- live F1/F2/F3 values
- full force trajectory
- current-angle marker values
- L2 comparison index based on the governed force values
- schematic force arrows
- engineering narrative for near closure vs fully closed
- Figure-2 FE pressure card as an independent source case

Still pending before merge to `main`:
- projected-pressure / pU hard-limit screen must consume the governed force API
- snapshot/executive reports must consume the governed force API and stop generating a pressure sweep from the old proxy
- JSON export/import computed metrics must consume the governed force API
- regression of all output surfaces
- later PSD/FRF correction (separate surgery)

## Release rule

Do not merge this candidate to `main` until every user-visible force-dependent output is routed through one governed API and the regression gates pass.
