# RF-PGV — Surgical Intervention 01 Specification

## Scope

**Non-destructive first incision.** No live UI or decision logic is changed in this slice.

### Add
- `calibration/rf_pgv_source_data_v1.js`
- `calibration/rf_pgv_source_regression_v1.js`
- source CSV / evidence metadata
- Roadmap v2

### Do not change yet
- current `PROFILES`
- current `evaluateForcesAtAngle()`
- clearance model
- report outputs
- PSD/modal/shock modules

## Why this is first

The current force generator has drifted from Figure 1. Editing the physics before freezing the source curve would allow further uncontrolled drift. This slice gives every later change a regression target.

## Next surgical slice (02)

Introduce a new evaluator beside the legacy one:

```js
function evaluateSourceConstrainedForces(material, mode, angle, clearance) {
  const src = RFPGV_SOURCE_DATA.getSourceForces(material, mode, angle);

  if (Math.abs(clearance - 0.200) < 1e-9) {
    return src; // source identity: no model is allowed to move the cornerstone
  }

  const scale = getEffectiveScale(material, clearance, angle, mode);
  return {
    F1: src.F1 * scale,
    F2: src.F2 * scale,
    F3: src.F3 * scale,
    evidence_state: 'MODELLED_FROM_SOURCE_BASELINE'
  };
}
```

This is intentionally the simplest first transform. It preserves source event positions while reusing the existing clearance sensitivity. It is **not yet the final physical decomposition**.

## Physical target architecture

Later transformation logic should evolve toward:

\[
F_i(\alpha,t)=F_{i,hydrodynamic}(\alpha,t)+F_{i,pressure/bending}(\alpha,t)+F_{i,transient}(\alpha,t)
\]

with source constraints at the investigated condition and module-specific evidence states.

## Promotion gate for Slice 02

- At Δd=0.200 mm, every integer angle is source-identical.
- Major Power peaks remain near tex F2 ~15°, bm F2 ~7°.
- tex F3 event near ~60° is retained.
- Figure 2 pressure anchors are not used to force the Figure 1 maximum to 0°.
- Existing legacy evaluator remains available for A/B visual comparison until regression is signed off.
