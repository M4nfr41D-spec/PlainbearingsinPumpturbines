# RF-PGV Calibration, Physics Decomposition & Surgical Intervention Roadmap — v2

**Purpose:** restore the Pereira / Hydro 2025 investigated-system data as immutable cornerstones while preserving the interactive model needed to explore unmeasured changes in clearance, geometry, transients and system behaviour.

**Primary source:** `Hydro_DEVA_Final_Master_TextLocked_v12_final_print_layout.pdf` (29 Apr 2026), especially Figure 1 (bearing-force traces), Figure 2 (closed-vane contact pressure) and Figure 3 (PSD response).

## 1. Product contract

RF-PGV is a **Pre-Selection Guide + Conversation Starter**, not a final design-calculation authority.

The target is to:
1. preserve what was actually observed/calculated in the referenced investigation;
2. show when a user remains inside that source condition;
3. use an engineering model only when an unmeasured variable is changed;
4. expose evidence state in UI/reports;
5. turn unresolved outputs into the next engineering question or measurement request.

## 2. Source-constrained surrogate architecture

> **SOURCE TRACE @ reference condition → identity baseline → engineering transform outside the source condition**

At the reference clearance

\[
\Delta d_{ref}=0.200\;\text{mm}
\]

Figure 1 is the force cornerstone and Figure 3 is the PSD cornerstone.

For \(i\in\{F_1,F_2,F_3\}\):

\[
F_i(\alpha,\Delta d_{ref})\approx F_{i,source}(\alpha)
\]

Outside the source clearance the first constrained form is:

\[
F_i(\alpha,\Delta d)=F_{i,source}(\alpha)\,S_i(\alpha,\Delta d)+\Delta F_{i,transient}(\alpha,\Delta d,\ldots)
\]

with the hard identity constraint

\[
S_i(\alpha,\Delta d_{ref})=1.
\]

Until evidence for peak migration exists, transforms may alter **amplitude before position**.

## 3. Physical decomposition of the closing cycle

The target model architecture must distinguish mechanism families rather than treating all near-closed behaviour as one generic 0° peak:

\[
\boxed{F_i(\alpha,t)=F_{i,hydrodynamic}(\alpha,t)+F_{i,pressure/bending}(\alpha,t)+F_{i,transient}(\alpha,t)}
\]

This is a model/hypothesis decomposition, not a claim that the terms have already been independently measured.

### Hydrodynamic term
Relevant while meaningful flow still passes the guide-vane system. Near closure, the remaining flow area is restrictive and hydraulic response can become strongly angle-dependent.

### Pressure / structural-bending term
Represents differential-pressure and structural effects including shaft bending and edge loading. It remains relevant at the fully closed position after through-flow is largely suppressed.

Figure 2 is explicitly a **closed guide vane · lateral shaft bending** FE case and anchors this structural/contact-pressure mechanism; it is not the maximum dynamic force point of the Figure 1 sweep.

### Transient term
Represents closing transients, pressure pulses, water-hammer-related response or other short-duration events. Without site-specific transient data this remains modelled/hypothesis-level.

## 4. Near closure ≠ fully closed

The Figure 1 source traces show the major dynamic force events before the fully closed position:

- deva.tex 552 Power F2: ~906 kN near **15°**;
- deva.bm 392 Power F2: ~821 kN near **7°**;
- tex F3 contains a major event near **60°** that the current generator largely misses.

Working regime labels:

| Regime | Working band | Interpretation |
|---|---:|---|
| Open / normal | > ~20–30° | ordinary hydraulic operating response; local events may occur |
| **Near-closure dynamic** | ~5–20° | restrictive flow area + adverse hydraulic response + transient sensitivity |
| **Fully closed** | ~0° | through-flow largely suppressed; differential pressure, shaft bending and contact pressure remain relevant |

The numeric bands are working engineering bands, not independently measured regime boundaries.

**Demonstrator message:**

> Closed vane is not necessarily the maximum dynamic bearing-force condition. Near closure can be more severe dynamically, while the fully closed position can govern structural contact pressure and bending.

## 5. Module-specific evidence states

| Domain | Source condition | Treatment |
|---|---|---|
| F1/F2/F3 tex/bm Pump & Power | Δd=.200 | SOURCE · digitised |
| PSD1/2/3 tex/bm Pump & Power | Δd=.200 | SOURCE · digitised/provisional full trace |
| tex contact pressure | closed vane / lateral bending | SOURCE · FE 54.4 MPa |
| bm contact pressure | closed vane / lateral bending | SOURCE · FE 116.1 MPa |
| force at Δd≠.200 | transformed from source | MODELLED |
| reduced-clearance numeric response | no clean source trace yet | MODELLED / source-informed |
| f0 / ζ / resonance position | assumptions/back-calculation | HYPOTHESIS |
| shock transient | engineering illustration | HYPOTHESIS |
| lifetime | not validated | DISABLED / NOT MODELLED |

The publication establishes real source lineage; numerical values in `calibration/rf_pgv_source_data_v1.js` are provisional raster digitisation until original numerical data are injected.

## 6. PSD calibration correction

The highlighted Power-Generation peaks are approximately:
- tex PSD-2: 7.6–7.7×10^-4 at ~47 Hz;
- bm PSD-3: 4.8×10^-4 at ~47 Hz.

Thus

\[
7.6\times10^{-4}/4.8\times10^{-4}\approx1.58
\]

is a **peak-PSD value ratio**, not a directly equivalent FRF-amplitude ratio. For a common LTI input, PSD scales with \(|H|^2\), not \(|H|\). The existing ~1.62 FRF-ratio “match” must therefore not be used as validation proof.

## 7. Surgical sequence

| Phase | Intervention | Motivation | Gate |
|---|---|---|---|
| 0 | Freeze current main; use isolated branch | no risk to live demonstrator | main untouched |
| 1 | Add immutable source-data layer | evidence separated from model | source not mutable by state |
| 2 | Add regression harness | prevent future cornerstone drift | tests must pass |
| 3 | Add source-constrained evaluator beside legacy evaluator | controlled migration | Δd=.200 collapses to source |
| 4 | Retire 0° as master force calibration | separate near-closure dynamic peak from closed structural case | source peak positions preserved |
| 5 | Reattach clearance model as transform \(S_i\) | retain what-if capability | \(S_i(\alpha,.200)=1\) |
| 6 | Freeze source-event positions initially | peak migration is not yet evidenced | no unvalidated event migration |
| 7 | Split pressure domains | do not conflate force maximum with closed-vane FE pressure | 54.4/116.1 scoped correctly |
| 8 | Use source PSD baseline at .200 | real evidence where available | 47-Hz landmarks reproduced |
| 9 | Decouple modal calibration | avoid PSD/FRF overclaim | f0/ζ remain hypothesis |
| 10 | Add per-card evidence states | specialist sees boundary instantly | no hidden C/D→A promotion |
| 11 | Add validation question | conversation starter continues engineering process | D-output ends in next measurement |
| 12 | Inject Paolo original numerical data | replace raster precision without redesign | versioned data layer |

## 8. Regression gates

### Source-data integrity
- four force datasets: tex/bm × Pump/Power;
- 91 points each, 0…90°;
- F1/F2/F3 finite;
- interpolation returns stored value exactly at integer angles;
- metadata includes source document, figure, clearance and digitisation status.

### Force-model gate at Δd=.200
Until original numerical Figure 1 data arrive:
- no major source event disappears;
- major source peak angle target ±2°;
- major source peak magnitude ±10% or ±25 kN, whichever is larger;
- overall MAE target ≤40 kN per series;
- no synthetic event becomes a new global maximum without source support.

### Mechanism-consistency gate
- tool must not call 0° the maximum dynamic force condition when the selected source trace says otherwise;
- near-closure force peak and closed-vane contact-pressure case are separately named;
- leaving .200 mm changes status from SOURCE to MODELLED FROM SOURCE;
- returning to .200 mm restores exact source identity.

### Governance gate
- C/D parameters cannot mutate stored source data;
- D-level modal/shock outputs cannot be exported as measured/validated;
- lifetime remains disabled until a validated damage model and duty-cycle evidence exist.

## 9. Data requested from Paolo later

Precision upgrades, not blockers:
1. original Figure 1 numerical force curves;
2. clean Figure 3 spectra;
3. exact Δd definition and reduced-clearance numerical cases;
4. PSD units/channel/processing metadata;
5. measured/calculated modal f0 and damping if available;
6. post-Hydro-2025 updates.

## 10. Promotion criterion

A Hydro-specialist demonstrator is promotable when:
- Figure 1 force curves pass the reference regression gate;
- Figure 2 FE anchors are correctly scoped;
- Figure 3 PSD landmarks are correctly reproduced/labeled;
- every decisive output exposes source/model/hypothesis state;
- changing an unmeasured variable visibly changes evidence state;
- every hypothesis points to the next measurement/input rather than implying final approval.
