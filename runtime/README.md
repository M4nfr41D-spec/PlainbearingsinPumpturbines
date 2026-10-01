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
   - Surgery-03 primary runtime wiring.
   - Makes force bars, force trajectory, L2 comparison index, schematic and engineering note use the governed force path.
   - Converts the pressure card to the separate fixed FE source case.

5. `rfpgv_runtime_closure_v1.js`
   - Surgery-03B closure layer.
   - Routes `computePointMetrics` through the governed force bridge so hard-limit screen and both report generators consume the same F1/F2/F3 path.
   - Replaces report pressure-sweep graphics with the separate Figure-2 FE source case and adds an explicit governance note.
   - Rewrites JSON computed forces and the full 1° sweep from the governed API and adds evidence metadata.
   - Exposes `RFPGV_RUNTIME_AUDIT.run()` for current-state consistency checks.

## Not runtime dependencies

Files below `calibration/` are evidence, regression or historical candidate assets. They are **not loaded by the app** unless promoted here explicitly.

In particular, `calibration/rf_pgv_force_adapter_candidate_v1.js` is superseded by the v2 force/pressure bridge and is retained only for traceability.

## Current migration boundary

Integrated in Surgery 03 / 03B:
- live F1/F2/F3 values
- full force trajectory
- current-angle marker values
- L2 comparison index based on the governed force values
- schematic force arrows
- engineering narrative for near closure vs fully closed
- Figure-2 FE pressure card as an independent source case
- projected-pressure / pU hard-limit screen using governed F2 + geometry
- snapshot/executive report force calculations using governed F1/F2/F3
- report pressure graphic replaced by separate non-angle-resolved Figure-2 FE case
- JSON export current computed forces and full closing sweep using governed API
- evidence metadata for force lineage, FE pressure separation and hard-limit path
- browser current-state runtime audit hook

Still pending before merge to `main`:
- browser end-to-end regression of all report/render/export surfaces on the branch
- review of remaining legacy report wording that can imply stronger model authority than intended
- later PSD / FRF correction and 1.58 metric clarification (separate surgery)
- source replacement when original numerical Pereira/HYDRO data become available

## Release rule

Do not merge this candidate to `main` until every user-visible force-dependent output is routed through one governed API, the browser regression gates pass, and no pressure-vs-angle claim is produced from the Figure-2 FE source case.
