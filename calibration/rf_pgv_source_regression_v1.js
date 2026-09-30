#!/usr/bin/env node
'use strict';
const src=require('./rf_pgv_source_data_v1.js');
function assert(cond,msg){ if(!cond){ console.error('FAIL:',msg); process.exitCode=1; } }
function near(a,b,tol,msg){ assert(Math.abs(a-b)<=tol,`${msg}: got ${a}, expected ${b} ±${tol}`); }

const datasets=[['tex','power'],['tex','pump'],['bm','power'],['bm','pump']];
for(const [m,mo] of datasets){
  const t=src.FORCE_TRACES[m][mo];
  assert(t.angle_deg.length===91,`${m}/${mo}: 91 angle points`);
  assert(t.angle_deg[0]===0 && t.angle_deg[90]===90,`${m}/${mo}: angle domain 0..90`);
  for(const s of ['F1','F2','F3']){
    assert(t[s+'_kN'].length===91,`${m}/${mo}/${s}: 91 values`);
    assert(t[s+'_kN'].every(Number.isFinite),`${m}/${mo}/${s}: finite values`);
    for(let a=0;a<=90;a++){
      const got=src.getSourceForces(m,mo,a)[s];
      assert(got===t[s+'_kN'][a],`${m}/${mo}/${s}@${a}: exact source identity`);
    }
  }
}

const expected=[
 ['tex','power','F1',16,663.5,2,30],
 ['tex','power','F2',15,906.3,2,30],
 ['tex','power','F3',60,401.9,2,30],
 ['bm','power','F1',2,595.8,2,30],
 ['bm','power','F2',7,820.9,2,30],
 ['bm','power','F3',60,151.0,2,30]
];
for(const [m,mo,s,a,v,atol,vtol] of expected){
  const p=src.peak(m,mo,s);
  near(p.angle_deg,a,atol,`${m}/${mo}/${s} peak angle`);
  near(p.value_kN,v,vtol,`${m}/${mo}/${s} peak value`);
}

assert(src.evidenceStateForClearance(0.2)==='SOURCE_DIGITISED_PROVISIONAL','0.200 mm evidence state');
assert(src.evidenceStateForClearance(0.18)==='MODELLED_FROM_SOURCE_BASELINE','off-reference evidence state');
const ref=src.getSourceConstrainedForces('tex','power',15,0.2,()=>999);
const raw=src.getSourceForces('tex','power',15);
for(const s of ['F1','F2','F3']) assert(ref[s]===raw[s],`identity transform at ref ${s}`);

if(!process.exitCode) console.log('PASS: RF-PGV source-data integrity + cornerstone regression v1');
