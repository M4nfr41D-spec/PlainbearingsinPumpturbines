/* RF-PGV runtime closure v1 — Surgery 03B
 * Completes the force-dependent runtime migration without modifying the frozen UI base.
 *
 * Contract:
 * - every live/report/export F1/F2/F3 value comes from RFPGV_FORCE_PRESSURE_BRIDGE;
 * - projected p / pU hard-limit screen uses governed F2 + user geometry;
 * - Figure-2 FE contact pressure remains a separate, non-angle-resolved source case;
 * - no FE pressure-vs-angle transfer function is introduced;
 * - no lifetime claim is introduced.
 */
(function(){
  'use strict';

  const BRIDGE = globalThis.RFPGV_FORCE_PRESSURE_BRIDGE;
  const SRC = globalThis.RFPGV_SOURCE_DATA;
  if (!BRIDGE || !SRC) throw new Error('RF-PGV Surgery 03B dependencies missing.');
  if (typeof computePointMetrics !== 'function') throw new Error('computePointMetrics is unavailable.');

  const REF_C = BRIDGE.REF_CLEARANCE_MM;
  const EPS = 1e-9;
  const legacyComputePointMetrics = computePointMetrics;
  const legacyBuildExportObject = typeof buildExportObject === 'function' ? buildExportObject : null;
  const upstreamUpdate = typeof update === 'function' ? update : null;

  function governedForce(material, mode, angle, clearance) {
    return BRIDGE.evaluateForce(material, mode, angle, clearance);
  }

  function forceEvidenceState(clearance) {
    return Math.abs(Number(clearance) - REF_C) < EPS
      ? 'SOURCE_DIGITISED_PROVISIONAL'
      : 'MODELLED_FROM_SOURCE_BASELINE';
  }

  function sourcePressure(material) {
    return BRIDGE.evaluateContactPressure(material, { load_case: BRIDGE.PRESSURE_CASE.case_id });
  }

  computePointMetrics = function(angle, mode, clearance, shockEvents) {
    const events = Array.isArray(shockEvents) ? shockEvents : [];
    const legacy = legacyComputePointMetrics(angle, mode, clearance, events);
    const texF = governedForce('tex', mode, angle, clearance);
    const bmF  = governedForce('bm',  mode, angle, clearance);

    const localShocks = events.filter(e => Math.abs(Number(e.angle) - Number(angle)) < 0.5);
    let texSpike = 0, bmSpike = 0;
    localShocks.forEach(e => {
      const amp = Number(e.amplitude) || 0;
      texSpike += amp * spikeFactorFor('tex');
      bmSpike  += amp * spikeFactorFor('bm');
    });

    const pTex = sourcePressure('tex');
    const pBm = sourcePressure('bm');

    return Object.assign({}, legacy, {
      texF,
      bmF,
      texF2_with_shock: texF.F2 * (1 + texSpike),
      bmF2_with_shock: bmF.F2 * (1 + bmSpike),
      texMag: vectorMagnitude(texF),
      bmMag: vectorMagnitude(bmF),
      texPressure: pTex.value_MPa,
      bmPressure: pBm.value_MPa,
      pressureEvidenceState: 'SOURCE_FE_REPORTED',
      pressureContext: 'SEPARATE_FIGURE_2_FE_CASE_NOT_ANGLE_RESOLVED',
      pressureCoupledToDynamicF2: false,
      forceEvidenceState: forceEvidenceState(clearance),
      forceSourceId: texF.source_id || SRC.META.dataset_id,
      forceSourceClearance_mm: REF_C,
      localShockCount: localShocks.length
    });
  };

  if (typeof buildReportPressureSVG === 'function') {
    buildReportPressureSVG = function(_sweep, _highlightAngle, caption) {
      const pTex = sourcePressure('tex').value_MPa;
      const pBm = sourcePressure('bm').value_MPa;
      const w = 330, h = 118, left = 34, right = 12, top = 18, bottom = 25;
      const maxP = 140;
      const x = v => left + (v / maxP) * (w - left - right);
      const bar = (y, value, fill, label) =>
        '<text x="' + left + '" y="' + (y - 4) + '" font-family="JetBrains Mono, monospace" font-size="8.5" fill="#4a4f55">' + label + '</text>' +
        '<rect x="' + left + '" y="' + y + '" width="' + (w-left-right) + '" height="12" rx="2" fill="rgba(26,29,33,.06)" />' +
        '<rect x="' + left + '" y="' + y + '" width="' + Math.max(1, x(value)-left).toFixed(1) + '" height="12" rx="2" fill="' + fill + '" />' +
        '<text x="' + Math.min(w-right-2, x(value)+5).toFixed(1) + '" y="' + (y+9) + '" font-family="JetBrains Mono, monospace" font-size="8.5" fill="#1a1d21">' + value.toFixed(1) + ' MPa</text>';
      const svg = '<svg class="rpt-mini-svg" viewBox="0 0 '+w+' '+h+'" xmlns="http://www.w3.org/2000/svg">' +
        '<rect width="'+w+'" height="'+h+'" fill="#fff" />' +
        '<text x="'+left+'" y="11" font-family="JetBrains Mono, monospace" font-size="8" fill="#8a8f97">FIGURE 2 · SEPARATE FE SOURCE CASE · NOT ANGLE-RESOLVED</text>' +
        bar(top+12, pTex, '#1f4e79', 'tex 552') +
        bar(top+47, pBm, '#b8860b', 'bm 392') +
        '<line x1="'+left+'" y1="'+(h-bottom)+'" x2="'+(w-right)+'" y2="'+(h-bottom)+'" stroke="rgba(26,29,33,.18)" />' +
        '<text x="'+left+'" y="'+(h-7)+'" font-family="JetBrains Mono, monospace" font-size="8" fill="#8a8f97">0</text>' +
        '<text x="'+(w-right-35)+'" y="'+(h-7)+'" font-family="JetBrains Mono, monospace" font-size="8" fill="#8a8f97">140 MPa</text>' +
      '</svg>';
      return typeof rptMiniWrap === 'function'
        ? rptMiniWrap(svg, caption || 'Figure 2 FE source case · independent of current F2 / angle')
        : svg;
    };
  }

  function patchReport(reportId) {
    const box = document.getElementById(reportId);
    if (!box || box.querySelector('.snapshot-placeholder')) return;
    let html = box.innerHTML;
    html = html
      .replace(/Contact pressure/g, 'FE source pressure (separate case)')
      .replace(/contact pressure/g, 'FE source pressure (separate case)')
      .replace(/pressure: tex/g, 'separate FE source case (not angle-resolved): tex')
      .replace(/Max pressure/g, 'FE source-case pressure')
      .replace(/max pressure/g, 'FE source-case pressure');
    box.innerHTML = html;

    if (!box.querySelector('.rfpgv-governance-note')) {
      const note = document.createElement('div');
      note.className = 'rfpgv-governance-note';
      note.style.cssText = 'margin:0 0 12px;padding:9px 11px;border:1px solid rgba(31,78,121,.22);border-left:4px solid #1f4e79;border-radius:5px;background:rgba(31,78,121,.04);font-size:11px;line-height:1.5;color:#4a4f55';
      note.innerHTML = '<strong>Runtime governance:</strong> all F1/F2/F3 values in this report use the governed Figure-1 force path. At Δd = 0.200 mm they are provisional digitised source traces; away from 0.200 mm they are C-level clearance transforms. The 54.4 / 116.1 MPa values are the separate Figure-2 FE source case and are <strong>not</strong> an angle-resolved pressure sweep. Projected p / pU screening is calculated separately from governed F2 and the entered d × L geometry. No lifetime is implied.';
      box.insertBefore(note, box.firstChild);
    }
  }

  [
    ['snapshotGenerateBtn', 'snapshotReport'],
    ['executiveGenerateBtn', 'executiveReport']
  ].forEach(([buttonId, reportId]) => {
    const btn = document.getElementById(buttonId);
    if (btn && !btn.dataset.rfpgvClosureBound) {
      btn.dataset.rfpgvClosureBound = '1';
      btn.addEventListener('click', () => setTimeout(() => patchReport(reportId), 0));
    }
  });

  if (legacyBuildExportObject) {
    buildExportObject = function() {
      const obj = legacyBuildExportObject();
      const angle = Number(state.angle);
      const mode = state.mode;
      const clearance = Number(state.clearance);
      const m = computePointMetrics(angle, mode, clearance, state.shockEvents || []);
      const pTex = sourcePressure('tex');
      const pBm = sourcePressure('bm');

      obj.model_governance = Object.assign({}, obj.model_governance || {}, {
        runtime_version: 'Surgery03B-runtime-closure-v1',
        force_path: 'RFPGV_FORCE_PRESSURE_BRIDGE',
        force_reference_clearance_mm: REF_C,
        force_evidence_state: forceEvidenceState(clearance),
        force_source_id: SRC.META.dataset_id,
        force_numerical_extraction: SRC.META.numerical_extraction,
        force_digitisation_status: SRC.META.digitisation_status,
        pressure_path: 'SEPARATE_FIGURE_2_FE_SOURCE_CASE',
        pressure_coupled_to_dynamic_F2: false,
        hard_limit_path: 'PROJECTED_P_AND_PU_FROM_GOVERNED_F2_PLUS_GEOMETRY',
        lifetime_model: 'NOT_MODELLED'
      });

      obj.computed = obj.computed || {};
      [['tex', m.texF, m.texMag, pTex], ['bm', m.bmF, m.bmMag, pBm]].forEach(([mat, F, mag, p]) => {
        const dst = obj.computed[mat] = obj.computed[mat] || {};
        dst.F1_kN = +F.F1.toFixed(1);
        dst.F2_kN = +F.F2.toFixed(1);
        dst.F3_kN = +F.F3.toFixed(1);
        dst.resultant_kN = +mag.toFixed(1);
        dst.contact_pressure_MPa = +p.value_MPa.toFixed(2);
        dst.fe_source_contact_pressure_MPa = +p.value_MPa.toFixed(2);
        dst.contact_pressure_context = 'SEPARATE_FIGURE_2_FE_CASE_NOT_ANGLE_RESOLVED';
        dst.force_evidence_state = F.evidence_state;
        dst.force_transform = F.transform || 'IDENTITY_AT_SOURCE_CLEARANCE';
        dst.force_source_id = F.source_id || SRC.META.dataset_id;
      });

      obj.closing_sweep_at_current_clearance = Array.from({length: 91}, (_, i) => 90 - i).map(a => {
        const tf = governedForce('tex', mode, a, clearance);
        const bf = governedForce('bm', mode, a, clearance);
        return {
          angle: a,
          tex_F1: +tf.F1.toFixed(0), tex_F2: +tf.F2.toFixed(0), tex_F3: +tf.F3.toFixed(0),
          bm_F1: +bf.F1.toFixed(0), bm_F2: +bf.F2.toFixed(0), bm_F3: +bf.F3.toFixed(0),
          evidence_state: forceEvidenceState(clearance),
          source_clearance_mm: REF_C
        };
      });

      obj.fe_source_case = {
        case_id: BRIDGE.PRESSURE_CASE.case_id,
        source_figure: BRIDGE.PRESSURE_CASE.source_figure,
        tex_MPa: pTex.value_MPa,
        bm_MPa: pBm.value_MPa,
        evidence_state: 'SOURCE_FE_REPORTED',
        angle_resolved: false,
        coupled_to_dynamic_F2: false
      };

      if (typeof hardLimitScreen === 'function') {
        const hl = hardLimitScreen();
        obj.hard_limit_screen = {
          geometry: Object.assign({}, state.geom || {}),
          load_regime: state.loadRegime,
          force_evidence_state: forceEvidenceState(clearance),
          tex: hl.tex,
          bm: hl.bm,
          note: 'Projected p / pU screen from governed F2 and entered geometry. Non-compensatory preselection gate; no lifetime implication.'
        };
      }
      return obj;
    };
  }

  function ensureHardLimitEvidence() {
    const card = document.getElementById('gateCard');
    if (!card) return;
    let badge = document.getElementById('hardLimitEvidenceBadge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'hardLimitEvidenceBadge';
      badge.style.cssText = "margin:10px 0 0;padding:7px 10px;border:1px solid rgba(26,29,33,.15);border-radius:5px;font:600 10px 'JetBrains Mono',monospace;letter-spacing:.45px;color:#4a4f55;background:rgba(29,138,79,.05)";
      card.querySelector('.output-header')?.appendChild(badge);
    }
    badge.textContent = forceEvidenceState(state.clearance) + ' · projected p / pU uses governed F2';
    const footer = card.querySelector('.output-footer');
    if (footer) footer.innerHTML = 'p = F2 / (d·L) — projected pressure from the <strong>governed Figure-1 force path</strong>, separately comparable to datasheet limits. v = π·d·(2β/360)·f/60; pU = p·v. <strong>Non-compensatory:</strong> a material that fails a hard limit is excluded regardless of mechanism tendency. At Δd = 0.200 mm F2 is a provisional digitised source trace; away from 0.200 mm it is a C-level clearance transform. Geometry remains placeholder until confirmed. This gate is independent of the separate Figure-2 FE contact-pressure source case. No lifetime is implied.';
  }

  function refreshClosureSurfaces() {
    ensureHardLimitEvidence();
    if (typeof hardLimitScreen === 'function') hardLimitScreen();
  }

  if (upstreamUpdate) {
    update = function() {
      upstreamUpdate.apply(this, arguments);
      refreshClosureSurfaces();
    };
  }

  function runAudit() {
    const mode = state.mode;
    const angle = Number(state.angle);
    const clearance = Number(state.clearance);
    const tf = governedForce('tex', mode, angle, clearance);
    const bf = governedForce('bm', mode, angle, clearance);
    const m = computePointMetrics(angle, mode, clearance, state.shockEvents || []);
    const checks = [];
    const near = (a,b,tol=1e-8) => Math.abs(Number(a)-Number(b)) <= tol;
    checks.push({id:'metrics_tex_F2_governed', pass:near(m.texF.F2, tf.F2)});
    checks.push({id:'metrics_bm_F2_governed', pass:near(m.bmF.F2, bf.F2)});
    checks.push({id:'pressure_not_coupled_to_F2', pass:m.pressureCoupledToDynamicF2 === false});
    checks.push({id:'pressure_tex_source_case', pass:near(m.texPressure, BRIDGE.PRESSURE_CASE.values_MPa.tex)});
    checks.push({id:'pressure_bm_source_case', pass:near(m.bmPressure, BRIDGE.PRESSURE_CASE.values_MPa.bm)});
    if (typeof hardLimitScreen === 'function' && state.geom) {
      const hl = hardLimitScreen();
      const A = Number(state.geom.d) * Number(state.geom.L);
      checks.push({id:'hard_limit_tex_uses_governed_F2', pass:near(hl.tex.p, tf.F2*1000/A, 1e-6)});
      checks.push({id:'hard_limit_bm_uses_governed_F2', pass:near(hl.bm.p, bf.F2*1000/A, 1e-6)});
    }
    if (typeof buildExportObject === 'function') {
      const ex = buildExportObject();
      checks.push({id:'export_current_tex_F2_governed', pass:near(ex.computed.tex.F2_kN, +tf.F2.toFixed(1), 0.05)});
      checks.push({id:'export_current_bm_F2_governed', pass:near(ex.computed.bm.F2_kN, +bf.F2.toFixed(1), 0.05)});
      checks.push({id:'export_sweep_governed', pass:Array.isArray(ex.closing_sweep_at_current_clearance) && ex.closing_sweep_at_current_clearance.length === 91});
    }
    return Object.freeze({pass:checks.every(c=>c.pass), checks:Object.freeze(checks)});
  }

  globalThis.RFPGV_RUNTIME_AUDIT = Object.freeze({ run: runAudit });
  refreshClosureSurfaces();
  if (typeof update === 'function') update();

  const audit = runAudit();
  globalThis.RFPGV_RUNTIME_STATUS = Object.freeze({
    version: 'Surgery03B-runtime-closure-v1',
    force_path: 'SOURCE_CONSTRAINED_ALL_RUNTIME_SURFACES',
    force_reference_clearance_mm: REF_C,
    pressure_path: 'SEPARATE_FE_SOURCE_CASE_NOT_ANGLE_RESOLVED',
    hard_limit_screen_migration: 'INTEGRATED_GOVERNED_F2',
    reports_force_migration: 'INTEGRATED_VIA_COMPUTE_POINT_METRICS',
    reports_pressure_semantics: 'PATCHED_TO_SEPARATE_FE_SOURCE_CASE',
    export_migration: 'INTEGRATED_GOVERNED_FORCE_AND_EVIDENCE_METADATA',
    browser_runtime_audit_pass: audit.pass,
    psd_frf_migration: 'PENDING_SEPARATE_SURGERY'
  });
  console.info('[RF-PGV] Surgery 03B runtime closure active', globalThis.RFPGV_RUNTIME_STATUS, audit);
})();
