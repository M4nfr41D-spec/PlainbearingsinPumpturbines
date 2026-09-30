/* RF-PGV force adapter candidate v1
 * Candidate bridge from Pereira source baseline to the existing clearance scale.
 * NOT wired into production index.html yet.
 *
 * Contract:
 *   clearance == 0.200 mm -> exact source baseline
 *   clearance != 0.200 mm -> source baseline × existing effective clearance scale
 *
 * This intentionally freezes source event ANGLES in the first migration slice.
 * Peak migration is deferred until measured/reviewed reduced-clearance data exist.
 */
(function(root){
  'use strict';
  const SRC=root.RFPGV_SOURCE_DATA || (typeof require==='function' ? require('./rf_pgv_source_data_v1.js') : null);
  if(!SRC) throw new Error('RFPGV_SOURCE_DATA must be loaded before force adapter');

  function evaluate(material, mode, angleDeg, clearanceMm, legacyScaleFn){
    const m=String(material).toLowerCase().includes('bm') ? 'bm' : 'tex';
    const mo=String(mode).toLowerCase().includes('pump') ? 'pump' : 'power';
    const scaleFn=legacyScaleFn || root.getEffectiveScale;

    return SRC.getSourceConstrainedForces(
      m, mo, angleDeg, clearanceMm,
      ({material,mode,angle_deg,clearance_mm}) => {
        if(typeof scaleFn!=='function') throw new Error('getEffectiveScale/legacyScaleFn missing');
        return scaleFn(material, clearance_mm, angle_deg, mode);
      }
    );
  }

  function regime(angleDeg){
    const a=Number(angleDeg);
    if(a<=1) return {
      id:'fully_closed',
      label:'Fully closed — structural pressure / bending dominant',
      evidence_note:'Do not equate this state with the maximum dynamic force condition.'
    };
    if(a>=5 && a<=20) return {
      id:'near_closure_dynamic',
      label:'Near-closure dynamic regime',
      evidence_note:'Source force maxima occur in this region for the Power-Generation case.'
    };
    return {
      id:'operating',
      label:'Operating / transition regime',
      evidence_note:'Local source events may still occur; regime boundaries are working engineering bands.'
    };
  }

  root.RFPGV_FORCE_ADAPTER=Object.freeze({evaluate,regime});
  if(typeof module==='object' && module.exports) module.exports=root.RFPGV_FORCE_ADAPTER;
})(typeof globalThis!=='undefined'?globalThis:this);
