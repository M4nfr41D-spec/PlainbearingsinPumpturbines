/* RF-PGV runtime integration v1 — Surgery 03
 * Purpose: make the source-constrained force / separate FE-pressure architecture
 * actually drive the interactive tool without mutating the frozen pre-surgery base.
 *
 * Runtime dependencies (loaded before this file):
 *   ./rfpgv_source_data_v1.js
 *   ./rfpgv_force_pressure_bridge_v2.js
 *
 * Evidence contract:
 *   Δd = 0.200 mm force sweep -> SOURCE_DIGITISED_PROVISIONAL
 *   Δd != 0.200 mm force sweep -> MODELLED_FROM_SOURCE_BASELINE (C transform)
 *   FE pressure card -> fixed SOURCE_FE_REPORTED case, never derived from live F2
 */
(function(){
  'use strict';

  if (!globalThis.RFPGV_SOURCE_DATA || !globalThis.RFPGV_FORCE_PRESSURE_BRIDGE) {
    throw new Error('RF-PGV Surgery 03 runtime dependencies missing.');
  }
  const BRIDGE = globalThis.RFPGV_FORCE_PRESSURE_BRIDGE;
  const REF_C = BRIDGE.REF_CLEARANCE_MM;
  const legacyUpdate = update;

  function forces(material, mode, angle, clearance) {
    return BRIDGE.evaluateForce(material, mode, angle, clearance);
  }

  function forceEvidenceLabel(clearance) {
    return Math.abs(Number(clearance) - REF_C) < 1e-9
      ? 'SOURCE TRACE · Figure 1 · Δd 0.200 mm'
      : 'MODELLED FROM SOURCE BASELINE · clearance transform C';
  }

  function regimeCopy(angle, mode, texF, bmF) {
    const c = Number(state.clearance);
    const atSource = Math.abs(c - REF_C) < 1e-9;
    const ev = atSource ? 'source trace' : 'modelled from source baseline';

    if (mode === 'power' && angle >= 5 && angle <= 20) {
      const texPeak = globalThis.RFPGV_SOURCE_DATA.peak('tex','power','F2');
      const bmPeak = globalThis.RFPGV_SOURCE_DATA.peak('bm','power','F2');
      return {
        title: 'NEAR-CLOSURE DYNAMIC REGIME — source-observed force maxima.',
        body: `At Δd = 0.200 mm the investigated-system traces place the principal Power-Generation F2 maxima near ${texPeak.angle_deg.toFixed(0)}° for tex (${texPeak.value_kN.toFixed(0)} kN) and ${bmPeak.angle_deg.toFixed(0)}° for bm (${bmPeak.value_kN.toFixed(0)} kN). Current values are ${texF.F2.toFixed(0)} / ${bmF.F2.toFixed(0)} kN (${ev}). Fully closed 0° is treated separately from this dynamic near-closure mechanism.`
      };
    }
    if (angle <= 1) {
      return {
        title: 'FULLY CLOSED — separate structural pressure / bending case.',
        body: `The live force values remain the Figure-1 force trace (${ev}). The 54.4 / 116.1 MPa contact-pressure result belongs to the separate closed-vane lateral-shaft-bending FE case and is not calculated from current F2.`
      };
    }
    if (mode === 'pump') {
      return {
        title: 'PUMP MODE — investigated-system force trace available.',
        body: `Pump-mode F1/F2/F3 at Δd = 0.200 mm are source-derived from Figure 1, not a generic Power-mode extrapolation. Away from 0.200 mm only the clearance transformation is modelled. Current F2: tex ${texF.F2.toFixed(0)} kN / bm ${bmF.F2.toFixed(0)} kN.`
      };
    }
    return {
      title: 'OPERATING / TRANSITION REGIME — preserve the measured event topology.',
      body: `Current F1/F2/F3 follow the Figure-1 source topology at Δd = 0.200 mm. With changed clearance the current slice scales that baseline without moving event angles; peak migration remains deliberately unmodelled until additional evidence exists.`
    };
  }

  function ensureEvidenceBadges() {
    const forceCard = document.getElementById('forceCard');
    if (forceCard && !document.getElementById('forceEvidenceBadge')) {
      const badge = document.createElement('div');
      badge.id = 'forceEvidenceBadge';
      badge.style.cssText = "margin:10px 0 0;padding:7px 10px;border:1px solid rgba(26,29,33,.15);border-radius:5px;font:600 10px 'JetBrains Mono',monospace;letter-spacing:.45px;color:#4a4f55;background:rgba(246,143,30,.05)";
      forceCard.querySelector('.output-header')?.appendChild(badge);
    }
    const pressureCard = document.getElementById('pressureCard');
    if (pressureCard && !document.getElementById('pressureEvidenceBadge')) {
      const badge = document.createElement('div');
      badge.id = 'pressureEvidenceBadge';
      badge.textContent = 'SOURCE FE CASE · Figure 2 · independent of live F2';
      badge.style.cssText = "margin:10px 0 0;padding:7px 10px;border:1px solid rgba(26,29,33,.15);border-radius:5px;font:600 10px 'JetBrains Mono',monospace;letter-spacing:.45px;color:#4a4f55;background:rgba(31,78,121,.05)";
      pressureCard.querySelector('.output-header')?.appendChild(badge);
    }
  }

  function configureStaticPressureCard() {
    const card = document.getElementById('pressureCard');
    if (!card) return;
    const label = card.querySelector('.output-label');
    const title = card.querySelector('.output-title');
    const footer = card.querySelector('.output-footer');
    if (label) label.textContent = 'Output 03 · FE Source Case';
    if (title) title.textContent = 'Closed-vane contact pressure · lateral shaft bending';
    const regimeLabel = card.querySelector('.regime-label');
    if (regimeLabel) regimeLabel.textContent = 'Separate source load case — not the current slider state';
    const toggle = document.getElementById('regimeToggle');
    if (toggle) toggle.style.display = 'none';
    const regimeNoteEl = document.getElementById('regimeNote');
    if (regimeNoteEl) regimeNoteEl.textContent = 'Figure 2 FE result. No validated pressure-vs-angle transfer function is active.';
    if (footer) footer.innerHTML = '<strong>Source FE case:</strong> closed guide vane · lateral shaft bending. Reported peak contact stresses: tex 552 = <strong>54.4 MPa</strong>, bm 392 = <strong>116.1 MPa</strong>. These values are intentionally <strong>not</strong> derived from the live Figure-1 F2 force sweep. Use Output 03b for the separate projected-area p / pU hard-limit screen.';
  }

  function setPressureSourceValues() {
    const pTex = BRIDGE.evaluateContactPressure('tex', {load_case: BRIDGE.PRESSURE_CASE.case_id});
    const pBm  = BRIDGE.evaluateContactPressure('bm',  {load_case: BRIDGE.PRESSURE_CASE.case_id});
    const max = 150;
    const texVal = document.getElementById('texPressureVal');
    const bmVal = document.getElementById('bmPressureVal');
    if (texVal) texVal.innerHTML = pTex.value_MPa.toFixed(1) + '<span class="unit">MPa</span>';
    if (bmVal) bmVal.innerHTML = pBm.value_MPa.toFixed(1) + '<span class="unit">MPa</span>';
    const texMeter = document.getElementById('texPressureMeter');
    const bmMeter = document.getElementById('bmPressureMeter');
    if (texMeter) texMeter.style.height = Math.min(100, pTex.value_MPa / max * 100) + '%';
    if (bmMeter) bmMeter.style.height = Math.min(100, pBm.value_MPa / max * 100) + '%';
    const texUtil = document.getElementById('texUtil');
    const bmUtil = document.getElementById('bmUtil');
    if (texUtil) { texUtil.textContent = 'SOURCE FE · fixed case'; texUtil.className = 'util-line ok'; }
    if (bmUtil) { bmUtil.textContent = 'SOURCE FE · fixed case'; bmUtil.className = 'util-line ok'; }
  }

  recomputeAllTrajectories = function() {
    TRAJECTORIES.texPump = TRAJ_ANGLES.map(a => forces('tex','pump',a,state.clearance));
    TRAJECTORIES.texPower = TRAJ_ANGLES.map(a => forces('tex','power',a,state.clearance));
    TRAJECTORIES.bmPump = TRAJ_ANGLES.map(a => forces('bm','pump',a,state.clearance));
    TRAJECTORIES.bmPower = TRAJ_ANGLES.map(a => forces('bm','power',a,state.clearance));
  };

  update = function() {
    legacyUpdate();

    const angle = Number(state.angle);
    const mode = state.mode;
    const clearance = Number(state.clearance);
    const texF = forces('tex', mode, angle, clearance);
    const bmF = forces('bm', mode, angle, clearance);

    setForce('texF1', texF.F1); setForce('texF2', texF.F2); setForce('texF3', texF.F3);
    setForce('bmF1', bmF.F1);   setForce('bmF2', bmF.F2);   setForce('bmF3', bmF.F3);

    const texIdx = vectorMagnitude(texF);
    const bmIdx = vectorMagnitude(bmF);
    const tR = document.getElementById('texResultant');
    const bR = document.getElementById('bmResultant');
    if (tR) tR.innerHTML = texIdx.toFixed(0) + '<span class="unit">kN</span>';
    if (bR) bR.innerHTML = bmIdx.toFixed(0) + '<span class="unit">kN</span>';
    const d = texIdx !== 0 ? ((texIdx - bmIdx) / texIdx) * 100 : 0;
    const dEl = document.getElementById('resultantDelta');
    if (dEl) {
      dEl.textContent = (d >= 0 ? '−' : '+') + Math.abs(d).toFixed(0) + '%';
      dEl.style.color = d >= 0 ? 'var(--orange)' : 'var(--critical)';
    }

    setPressureSourceValues();

    const note = regimeCopy(angle, mode, texF, bmF);
    const nt = document.getElementById('noteTitle');
    const nb = document.getElementById('noteBody');
    if (nt) nt.textContent = note.title;
    if (nb) nb.innerHTML = note.body;

    updateSchematic(angle, texF, bmF);
    ensureEvidenceBadges();
    const badge = document.getElementById('forceEvidenceBadge');
    if (badge) badge.textContent = forceEvidenceLabel(clearance);

    const forceFooter = document.querySelector('#forceCard .output-footer');
    if (forceFooter) forceFooter.innerHTML = '<strong>Evidence:</strong> Figure 1 digitised source traces at Δd = 0.200 mm (publication-raster extraction; provisional pending raw numerical data). Away from the source clearance, forces are a C-level shape-preserving clearance transform. F1/F2/F3 event angles are not moved by the current model slice.';
    const trajFooter = document.querySelector('#trajCard .output-footer');
    if (trajFooter) trajFooter.innerHTML = '<strong>Source-constrained trajectory:</strong> at Δd = 0.200 mm the chart follows the investigated-system Figure-1 traces. Moving Δd applies the current material clearance transform to that baseline while preserving event topology. Peak migration is intentionally not modelled without additional evidence.';

    if (forceChart) {
      updateForceChartMarkers();
      forceChart.update('none');
    }
  };

  ensureEvidenceBadges();
  configureStaticPressureCard();
  recomputeAllTrajectories();
  if (typeof updateForceChartData === 'function') updateForceChartData();
  update();

  globalThis.RFPGV_RUNTIME_STATUS = Object.freeze({
    version: 'Surgery03-runtime-v1',
    force_path: 'SOURCE_CONSTRAINED',
    force_reference_clearance_mm: REF_C,
    pressure_path: 'SEPARATE_FE_SOURCE_CASE',
    reports_export_migration: 'PENDING_NEXT_SLICE',
    hard_limit_screen_migration: 'PENDING_NEXT_SLICE'
  });
  console.info('[RF-PGV] Surgery 03 runtime active', globalThis.RFPGV_RUNTIME_STATUS);
})();
