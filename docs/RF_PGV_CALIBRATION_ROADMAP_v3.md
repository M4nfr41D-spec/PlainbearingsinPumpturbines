# RF-PGV Calibration & Hardening Roadmap v3

## Product contract
RF-PGV is a **Pre-Selection Guide and Conversation Starter**. It may expose mechanisms, compare tendencies, preserve source observations and identify the next measurement. It must not present itself as a final bearing-selection authority, FE/CFD replacement, service-life predictor or machine-specific digital twin.

## Non-negotiable evidence rule
A model may interpolate, transform or hypothesise around source evidence, but it may not move, erase or relabel source cornerstones without new evidence.

### Force architecture
Long-term conceptual decomposition:

\[
F_i(\alpha,t)=F_{i,hydrodynamic}+F_{i,pressure/bending}+F_{i,transient}
\]

This is a model decomposition, not a source claim.

At source clearance:

\[
F_i(\alpha,0.200)=F_{i,source}(\alpha)
\]

First migration transform:

\[
F_i(\alpha,\Delta d)=F_{i,source}(\alpha)S_m(\Delta d),\quad S_m(0.200)=1
\]

Only when additional clearance evidence exists may the transform become angle/series-dependent:

\[
F_i(\alpha,\Delta d)=F_{i,source}(\alpha)S_i(\alpha,\Delta d)
\]

### Mechanism separation
Near closure (~5–20°) and fully closed (~0°) are not interchangeable load cases. The source Power-generation F2 maxima occur near closure, while Figure 2 reports a fully closed structural/bending FE pressure case.

Therefore the tool must never infer that maximum dynamic bearing force and maximum FE contact pressure are the same event merely because both occur near the closing end of the cycle.

---

## Roadmap

### S00 — Freeze source truth — COMPLETE
- preserve reviewed report source figures and metadata
- digitise Figure 1 force traces
- capture Figure 2 FE anchors
- capture Figure 3 PSD source semantics
- record digitisation uncertainty

**Motivation:** no model hardening is meaningful until the reference observations are immutable and traceable.

### S01 — Source-data layer + regression harness — COMPLETE
- immutable source arrays
- interpolation at source clearance
- key landmark regression checks
- source/model provenance metadata

**Motivation:** prevent future model changes from silently moving real investigated-system events.

### S02 — Force/pressure mechanism separation — CANDIDATE COMPLETE / REGRESSION PASS
- source-constrained force bridge
- topology-preserving first clearance transform
- near-closure vs fully-closed regime distinction
- remove pressure calibration dependence on current F2
- Figure-2 pressure anchors stored as independent FE source case
- arbitrary pressure-vs-angle = NOT_MODELLED until separately derived

**Motivation:** correct the largest physical drift in the current model: an artificial 0° force maximum and the merger of dynamic closing forces with the closed-vane structural pressure case.

### S03 — Wire source-constrained force path into the interactive candidate — NEXT
- force cards and bars
- trajectory chart
- reports/export
- source/model provenance on visible output
- update engineering narrative around 7°/15° near-closure events
- remove statements implying 0° is the dominant dynamic-life load case

**Acceptance:** at Δd=.200, visible values and plots reproduce source traces; off-reference outputs clearly state `MODELLED_FROM_SOURCE_BASELINE`.

### S04 — System reaction metric cleanup
Current √(F1²+F2²+F3²) is permitted only as a **comparison index**, not a physical resultant because F1/F2/F3 act at different bearing locations.

- rename consistently in UI/report/export
- remove any wording that implies vector equilibrium/resultant force
- decide whether a more useful comparison metric is needed

### S05 — PSD source-trace migration
- replace synthetic spectra at Δd=.200 with digitised Figure-3 traces
- preserve PSD1/2/3 location identity
- define 47 Hz and 1.58 explicitly as the observed peak-PSD comparison used in the source figure
- source vs model labels per spectrum

### S06 — FRF/resonance surgery
- remove `|H_tex|/|H_bm|≈1.62 matches PSD ratio 1.58` calibration argument
- keep f0, ζ, Q as D/mixed until modal evidence exists
- stop using angle sweep language such as “time in resonance” unless f0/excitation is actually angle-dependent
- preserve resonance module as hypothesis/measurement-planning aid

### S07 — Shock/transient module hardening
- retain qualitative mechanism illustration
- remove any energy/fatigue language not directly supported
- distinguish pulse duration, force-response proxy and event rate
- map outputs to required field measurements

### S08 — Hard-limit / material-data audit
- verify exact bm392 variant and current source revision
- pressure, pU, sliding speed, medium/temperature assumptions
- ensure hard-limit exclusion cannot be confused with lifetime prediction

### S09 — Evidence-aware UI/reporting
Every visible technical number receives:
- evidence class
- source/model state
- validity context
- underlying load case
- “what would confirm/refute this?” where C/D

### S10 — Adversarial Hydro-specialist audit
Attempt to break the tool from the viewpoint of an experienced competitor/customer engineer:
- source trace reproduction
- units/definitions
- load-case mismatch
- force vs pressure confusion
- PSD/FRF dimensional consistency
- clearance definition
- material limits
- hidden lifetime claims

**Exit criterion:** no single headline number can be challenged because the tool silently changed its physical meaning or evidence class.
