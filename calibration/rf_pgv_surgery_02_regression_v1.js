/* RF-PGV Surgery 02 regression gate v1 */
'use strict';
const SRC = require('./rf_pgv_source_data_v1.js');
const BR = require('./rf_pgv_force_pressure_bridge_v2.js');

function fail(msg){ throw new Error('FAIL: ' + msg); }
function approx(a,b,tol=1e-9){ return Math.abs(a-b) <= tol; }
function peakOf(material,mode,series,clearance){
  let best = {angle_deg:0,value_kN:-Infinity};
  for(let a=0;a<=90;a++){
    const r = BR.evaluateForce(material,mode,a,clearance);
    const v = r[series];
    if(v > best.value_kN) best = {angle_deg:a,value_kN:v};
  }
  return best;
}

for(const m of ['tex','bm']){
  for(const mo of ['power','pump']){
    for(let a=0;a<=90;a++){
      const s=SRC.getSourceForces(m,mo,a);
      const r=BR.evaluateForce(m,mo,a,0.200);
      for(const ch of ['F1','F2','F3']){
        if(!approx(s[ch],r[ch])) fail(`source identity ${m}/${mo}/${ch}@${a}: ${s[ch]} != ${r[ch]}`);
      }
      if(r.evidence_state!=='SOURCE_DIGITISED_PROVISIONAL') fail('wrong source evidence state');
    }
  }
}

const key = [
  ['tex','power','F2',15,906.3],
  ['bm','power','F2',7,820.9],
  ['tex','power','F3',60,401.9],
  ['tex','power','F1',16,663.5]
];
for(const [m,mo,ch,a,v] of key){
  const p=peakOf(m,mo,ch,0.200);
  if(p.angle_deg!==a) fail(`cornerstone angle ${m}/${mo}/${ch}: ${p.angle_deg} != ${a}`);
  if(!approx(p.value_kN,v,0.11)) fail(`cornerstone magnitude ${m}/${mo}/${ch}: ${p.value_kN} != ${v}`);
}

for(const c of [0.150,0.250,0.300]){
  for(const [m,mo,ch,a] of key){
    const p=peakOf(m,mo,ch,c);
    if(p.angle_deg!==a) fail(`peak migration not allowed in Slice 02 ${m}/${mo}/${ch}@c=${c}: ${p.angle_deg} != ${a}`);
  }
}

const tex0=BR.evaluateForce('tex','power',0,0.200).F2;
const tex15=BR.evaluateForce('tex','power',15,0.200).F2;
const bm0=BR.evaluateForce('bm','power',0,0.200).F2;
const bm7=BR.evaluateForce('bm','power',7,0.200).F2;
if(!(tex15>tex0)) fail(`tex near-closure F2 must exceed 0°: ${tex15} <= ${tex0}`);
if(!(bm7>bm0)) fail(`bm near-closure F2 must exceed 0°: ${bm7} <= ${bm0}`);

const pTex=BR.evaluateContactPressure('tex',{load_case:'FIG2_CLOSED_VANE_LATERAL_SHAFT_BENDING'});
const pBm=BR.evaluateContactPressure('bm',{load_case:'FIG2_CLOSED_VANE_LATERAL_SHAFT_BENDING'});
if(!approx(pTex.value_MPa,54.4) || !approx(pBm.value_MPa,116.1)) fail('FE pressure source anchors changed');
if(pTex.coupled_to_dynamic_F2 || pBm.coupled_to_dynamic_F2) fail('pressure must not be coupled to dynamic F2');
const pGeneric=BR.evaluateContactPressure('tex',{angle_deg:15,mode:'power'});
if(pGeneric.value_MPa!==null || pGeneric.evidence_state!=='NOT_MODELLED') fail('generic pressure must remain NOT_MODELLED');

console.log('PASS: RF-PGV Surgery 02 — source-constrained forces + pressure separation');
console.log(JSON.stringify({
  ref_clearance_mm:BR.REF_CLEARANCE_MM,
  tex_power_F2:{closed_0_deg_kN:tex0,near_closure_15_deg_kN:tex15},
  bm_power_F2:{closed_0_deg_kN:bm0,near_closure_7_deg_kN:bm7},
  pressure_source_MPa:{tex:pTex.value_MPa,bm:pBm.value_MPa},
  pressure_dynamic_transfer:'NOT_MODELLED'
},null,2));
