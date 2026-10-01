/* RF-PGV force + pressure separation bridge v2
 * Surgery 02 candidate — source-constrained force path and independent FE pressure case.
 *
 * DESIGN CONTRACT
 * 1) At reference clearance Δd = 0.200 mm, force output is the digitised Pereira source trace.
 * 2) Away from Δd = 0.200 mm, the first migration slice applies a material-only scalar
 *    clearance transform. This preserves source event topology (peak/event angles).
 * 3) The closed-vane FE contact-pressure case is NOT derived from current F2.
 *    It is an independent source case: tex 54.4 MPa, bm 116.1 MPa.
 * 4) No pressure-vs-angle transfer function is activated until separately evidenced.
 *
 * Evidence semantics:
 *   SOURCE_DIGITISED_PROVISIONAL = A-lineage source, values digitised from publication raster.
 *   MODELLED_FROM_SOURCE_BASELINE = C transform applied to A-lineage baseline.
 *   SOURCE_FE_REPORTED            = A-lineage FE result from the reviewed report.
 *   NOT_MODELLED                  = deliberately no numerical claim.
 */
(function(root){
  'use strict';

  const SRC = root.RFPGV_SOURCE_DATA ||
    (typeof require === 'function' ? require('./rf_pgv_source_data_v1.js') : null);
  if (!SRC) throw new Error('RFPGV_SOURCE_DATA must be loaded before force/pressure bridge');

  const REF_CLEARANCE_MM = SRC.REF_CLEARANCE_MM;
  const EPS = 1e-9;

  const PRESSURE_CASE = Object.freeze({
    case_id: 'FIG2_CLOSED_VANE_LATERAL_SHAFT_BENDING',
    label: 'Closed guide vane · lateral shaft bending',
    values_MPa: Object.freeze({ tex: 54.4, bm: 116.1 }),
    evidence_state: 'SOURCE_FE_REPORTED',
    source_figure: 'Figure 2 — contact-pressure distribution',
    coupled_to_dynamic_F2: false,
    note: 'Independent FE source case. Do not calculate from the current force-sweep F2 value.'
  });

  function normaliseMaterial(material){
    const s = String(material).toLowerCase();
    return s.includes('bm') ? 'bm' : 'tex';
  }
  function normaliseMode(mode){
    const s = String(mode).toLowerCase();
    return s.includes('pump') ? 'pump' : 'power';
  }

  /* Existing clearance-shape equations retained only as a C-level transform shell.
   * Their absolute historical reference values (950/700 kN) are NOT used as source truth.
   * Normalisation is to the equation value at 0.200 mm, so T(0.200)=1 exactly.
   */
  function legacyClearanceShapeTex(c){
    const cOpt = 0.15, base = 750;
    let val;
    if (c < cOpt) {
      val = base + 40000 * Math.pow(cOpt - c, 2);
      if (c < 0.08) val += 50000 * Math.pow(0.08 - c, 2);
    } else {
      val = base + 7281 * Math.pow(c - cOpt, 1.2);
    }
    return val;
  }
  function legacyClearanceShapeBm(c){
    const cOpt = 0.12, base = 550;
    let val;
    if (c < cOpt) {
      val = base + 30000 * Math.pow(cOpt - c, 2);
      if (c < 0.07) val += 80000 * Math.pow(0.07 - c, 2);
    } else {
      val = base + 14205 * Math.pow(c - cOpt, 1.8);
    }
    return val;
  }

  const REF_SHAPE = Object.freeze({
    tex: legacyClearanceShapeTex(REF_CLEARANCE_MM),
    bm: legacyClearanceShapeBm(REF_CLEARANCE_MM)
  });

  function defaultClearanceMultiplier(material, clearanceMm){
    const m = normaliseMaterial(material);
    const c = Number(clearanceMm);
    if (!Number.isFinite(c)) throw new Error('clearanceMm must be finite');
    if (Math.abs(c - REF_CLEARANCE_MM) < EPS) return 1;
    const val = m === 'tex' ? legacyClearanceShapeTex(c) : legacyClearanceShapeBm(c);
    return val / REF_SHAPE[m];
  }

  function evaluateForce(material, mode, angleDeg, clearanceMm, multiplierProvider){
    const m = normaliseMaterial(material);
    const mo = normaliseMode(mode);
    const c = Number(clearanceMm);
    const source = SRC.getSourceForces(m, mo, angleDeg);

    if (!Number.isFinite(c)) throw new Error('clearanceMm must be finite');
    if (Math.abs(c - REF_CLEARANCE_MM) < EPS) {
      return Object.freeze({
        ...source,
        clearance_mm: c,
        evidence_state: 'SOURCE_DIGITISED_PROVISIONAL',
        transform: 'IDENTITY_AT_SOURCE_CLEARANCE',
        event_topology: 'SOURCE_PRESERVED'
      });
    }

    const provider = multiplierProvider || defaultClearanceMultiplier;
    const k = Number(provider(m, c, {mode:mo, angle_deg:source.angle_deg}));
    if (!Number.isFinite(k) || k <= 0) throw new Error('Invalid clearance multiplier: ' + k);

    return Object.freeze({
      F1: source.F1 * k,
      F2: source.F2 * k,
      F3: source.F3 * k,
      angle_deg: source.angle_deg,
      material: m,
      mode: mo,
      clearance_mm: c,
      source_clearance_mm: REF_CLEARANCE_MM,
      clearance_multiplier: k,
      evidence_state: 'MODELLED_FROM_SOURCE_BASELINE',
      transform: 'SHAPE_PRESERVING_MATERIAL_CLEARANCE_SCALAR_C',
      event_topology: 'SOURCE_PRESERVED_BY_CONSTRUCTION',
      source_id: source.source_id
    });
  }

  function evaluateContactPressure(material, context){
    const m = normaliseMaterial(material);
    const ctx = context || {};
    const loadCase = String(ctx.load_case || '').toLowerCase();
    const explicitSourceCase = loadCase === PRESSURE_CASE.case_id.toLowerCase() ||
      loadCase.includes('closed_vane_lateral') ||
      loadCase.includes('closed guide vane');

    if (explicitSourceCase) {
      return Object.freeze({
        material: m,
        value_MPa: PRESSURE_CASE.values_MPa[m],
        evidence_state: PRESSURE_CASE.evidence_state,
        case_id: PRESSURE_CASE.case_id,
        coupled_to_dynamic_F2: false,
        source_figure: PRESSURE_CASE.source_figure,
        note: PRESSURE_CASE.note
      });
    }

    return Object.freeze({
      material: m,
      value_MPa: null,
      evidence_state: 'NOT_MODELLED',
      case_id: null,
      coupled_to_dynamic_F2: false,
      note: 'No validated pressure-vs-angle transfer function. Use the separate closed-vane FE source case only when that load case is selected.'
    });
  }

  function regime(angleDeg){
    const a = Number(angleDeg);
    if (!Number.isFinite(a)) throw new Error('angleDeg must be finite');
    if (a <= 1) return Object.freeze({
      id: 'fully_closed',
      label: 'Fully closed — structural pressure / bending case',
      model_note: 'Flow is strongly reduced; do not force dynamic near-closure maxima onto 0°.'
    });
    if (a >= 5 && a <= 20) return Object.freeze({
      id: 'near_closure_dynamic',
      label: 'Near-closure dynamic regime',
      model_note: 'Power-generation source traces contain the main F2 maxima in this band.'
    });
    return Object.freeze({
      id: 'operating_transition',
      label: 'Operating / transition regime',
      model_note: 'Retain local source events; boundaries are engineering interpretation bands.'
    });
  }

  const API = Object.freeze({
    REF_CLEARANCE_MM,
    PRESSURE_CASE,
    defaultClearanceMultiplier,
    evaluateForce,
    evaluateContactPressure,
    regime
  });

  root.RFPGV_FORCE_PRESSURE_BRIDGE = API;
  if (typeof module === 'object' && module.exports) module.exports = API;
})(typeof globalThis !== 'undefined' ? globalThis : this);
