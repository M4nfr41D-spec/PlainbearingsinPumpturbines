# RF-PGV — Surgery 02: Source-Constrained Force Path + Pressure Separation

Status: **candidate implemented + regression gate PASS**  
Scope: branch `rfpgv/source-constrained-baseline-v1` only. `main` remains untouched.

## 1. Motivation

The reviewed Pereira/Paolo-informed report supplies two different physical evidence cases that had drifted together in the legacy model:

1. **Figure 1 — radial bearing forces versus guide-vane angle** at Δd = 0.200 mm, for tex/bm and Pump/Power.
2. **Figure 2 — closed guide vane / lateral shaft bending FE contact-pressure case**, reporting 54.4 MPa (tex) and 116.1 MPa (bm).

The legacy implementation calibrated the Power force model to ~950 kN tex and ~700 kN bm at 0°, then converted the current F2 to contact pressure by fixed MPa/kN ratios. This collapses two different mechanisms into one artificial 0° peak.

The source traces show instead that the main Power-generation F2 events occur **before full closure**:

- tex F2 ≈ 906.3 kN at ~15°
- bm F2 ≈ 820.9 kN at ~7°

while the closed-vane FE pressure case remains a separate structural/bending source case.

## 2. Physical model contract

The long-term model architecture remains:

\[
F_i(\alpha,t)=F_{i,\mathrm{hydrodynamic}}(\alpha,t)
+F_{i,\mathrm{pressure/bending}}(\alpha,t)
+F_{i,\mathrm{transient}}(\alpha,t)
\]

This is a **model decomposition**, not a claim that the source study independently measured those three terms.

For the current migration stage, the observed source trace is the immutable reference manifold:

\[
F_i(\alpha,\Delta d_{ref}) = F_{i,source}(\alpha),
\qquad \Delta d_{ref}=0.200\,\mathrm{mm}
\]

Away from the source clearance, Surgery 02 deliberately uses a topology-preserving C-level transform:

\[
F_i(\alpha,\Delta d)=F_{i,source}(\alpha)\,S_m(\Delta d)
\]

with the hard identity constraint

\[
S_m(0.200)=1.
\]

`S_m` is material-dependent but, in this migration slice, **not angle-dependent**. This is intentional: without reduced-clearance source data, the model is not allowed to migrate a measured event to another guide-vane angle simply because the surrogate can do so.

Later, if measured/reviewed clearance data support it, the transform may be promoted to

\[
S_i(\alpha,\Delta d)
\]

and allow evidenced amplitude/peak migration.

## 3. Closed versus near-closure regimes

### Near-closure dynamic regime (~5–20°)

The source traces contain the major Power-generation F2 maxima in this band. Plausible contributing mechanisms include high pressure drop through the remaining flow area, adverse incidence, separation/vortex activity and transient hydraulic loading. Those mechanisms are interpretation unless independently measured.

### Fully closed (~0°)

Flow is strongly reduced. Differential pressure, shaft bending, structural deformation and leakage may remain relevant, but this is **not automatically the maximum dynamic bearing-force condition**.

Therefore:

> **Maximum dynamic force and maximum structural contact pressure need not occur at the same guide-vane angle or represent the same load case.**

## 4. Pressure-path separation

The candidate no longer defines

\[
p(\alpha) = k \cdot F_2(\alpha)
\]

as a validated relationship.

Instead the Figure-2 values are stored as an independent source case:

- deva.tex 552: **54.4 MPa**
- deva.bm 392: **116.1 MPa**
- load case: **closed guide vane · lateral shaft bending**

For arbitrary slider angles, pressure currently returns:

`NOT_MODELLED`

unless that explicit FE source load case is selected.

This is a deliberate removal of false precision, not a loss of functionality. A pressure-vs-angle proxy can be reintroduced later only with an explicit B/C derivation and corresponding evidence label.

## 5. Candidate implementation

`calibration/rf_pgv_force_pressure_bridge_v2.js`

- source identity at Δd = 0.200 mm
- source-derived event topology preserved
- material-only clearance transform outside reference clearance
- independent FE pressure case
- no dynamic F2 → contact-pressure conversion
- explicit evidence-state metadata

## 6. Regression gate

`calibration/rf_pgv_surgery_02_regression_v1.js`

PASS conditions:

1. exact source identity at Δd = 0.200 mm for all 4 material/mode quadrants, all integer angles 0–90°, F1/F2/F3;
2. tex Power F2 maximum remains ~15° / 906.3 kN;
3. bm Power F2 maximum remains ~7° / 820.9 kN;
4. tex Power F3 event remains ~60° / 401.9 kN;
5. tex Power F1 maximum remains ~16° / 663.5 kN;
6. first clearance-transform slice does not move these event angles;
7. tex/bm near-closure F2 maxima remain higher than their corresponding 0° F2 values;
8. FE pressure anchors remain exactly 54.4 / 116.1 MPa;
9. generic pressure-vs-angle output is `NOT_MODELLED`;
10. no pressure value is inferred from the dynamic force sweep.

Current regression result: **PASS**.

## 7. Next integration step

Do not yet alter resonance, shock or PSD.

Next candidate slice:

1. wire the bridge into the tool force display/trajectory calculation;
2. replace legacy 0°-peak narrative text with source-grounded near-closure/closed wording;
3. convert the pressure card from dynamic F2-derived value to an explicit Figure-2 source case + `not modelled` state outside that case;
4. rerun the full regression suite;
5. only then proceed to the system-reaction index and PSD/FRF surgery.
