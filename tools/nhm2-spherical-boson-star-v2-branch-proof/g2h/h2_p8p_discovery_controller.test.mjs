import test from 'node:test';
import assert from 'node:assert/strict';
import {runDiscoveryDiagnostic as run} from './h2_p8p_discovery_controller.mjs';
const helperId='2570241336417567358',attempt='d'.repeat(64);
function setup(){
 const calls=[],events=[];
 const values={preflight:{helperId,cloneId:'6517758864936518301',status:'TERMINATED',cloneMode:'READ_ONLY',authenticated:true},
  replaceDiagnosticStartup:{},verifyStoppedStartup:{helperId,attempt,verified:true},
  restartHelper:{},observeRunning:{helperId,status:'RUNNING',authenticated:true},readDiagnostic:{},
  validateDiagnostic:{helperId,attempt,authenticated:true,mountAuthorized:false,recoveryAuthorized:false,
    scientificAuthority:false,classification:'disk_inventory'},stopAndConfirm:{helperId,stopped:true}};
 const ops=Object.fromEntries(Object.keys(values).map(name=>[name,async()=>{calls.push(name);return structuredClone(values[name]);}]));
 return {calls,events,values,options:{ops,attempt,now:()=>0,deadline:1200000,record:async e=>events.push(e)}};
}
test('diagnostic lifecycle never attaches, mounts, builds or recovers',async()=>{
 const s=setup(),result=await run(s.options);
 assert.equal(result.complete,true);assert.equal(result.stopped,true);
 assert.equal(result.diagnostic.classification,'disk_inventory');
 assert.deepEqual(s.calls,['preflight','replaceDiagnosticStartup','verifyStoppedStartup','restartHelper',
  'observeRunning','readDiagnostic','validateDiagnostic','stopAndConfirm']);
});
for(const phase of ['preflight','replaceDiagnosticStartup','verifyStoppedStartup','restartHelper',
 'observeRunning','readDiagnostic','validateDiagnostic'])test(`first failure at ${phase} stops progression`,async()=>{
 const s=setup();s.options.ops[phase]=async()=>{s.calls.push(phase);throw Error('injected_failure');};
 const result=await run(s.options);
 assert.equal(result.complete,false);
 const restarted=['restartHelper','observeRunning','readDiagnostic','validateDiagnostic'].includes(phase);
 assert.equal(s.calls.includes('stopAndConfirm'),restarted);
 assert.equal(s.calls.filter(p=>p===phase).length,1);
 assert.equal(s.calls.at(-1),restarted?'stopAndConfirm':phase);
});
test('wrong startup identity prevents restart',async()=>{
 const s=setup();s.values.verifyStoppedStartup.helperId='123';
 assert.equal((await run(s.options)).complete,false);assert.ok(!s.calls.includes('restartHelper'));
});
test('evidence failure after restart still stops once',async()=>{
 const s=setup();s.options.record=async e=>{if(e.phase==='restartHelper'&&e.kind==='result')throw Error('disk_full');};
 const result=await run(s.options);assert.equal(result.complete,false);assert.equal(result.stopped,true);
 assert.equal(s.calls.filter(p=>p==='stopAndConfirm').length,1);assert.ok(!s.calls.includes('observeRunning'));
});
test('unconfirmed stop cannot report completion',async()=>{
 const s=setup();s.values.stopAndConfirm.stopped=false;
 const result=await run(s.options);assert.equal(result.complete,false);assert.equal(result.diagnostic,null);
});
test('terminal persistence failure cannot report completion',async()=>{
 const s=setup();s.options.record=async e=>{if(e.phase==='diagnostic_terminal')throw Error('disk_full');};
 const result=await run(s.options);assert.equal(result.complete,false);assert.equal(result.stopped,true);
 assert.equal(result.diagnostic,null);
});
test('deadline preserves cleanup reserve',async()=>{
 const s=setup();let now=0;s.options.now=()=>now;
 s.options.ops.restartHelper=async()=>{s.calls.push('restartHelper');now=900000;};
 const result=await run(s.options);assert.equal(result.complete,false);assert.equal(result.stopped,true);
 assert.ok(!s.calls.includes('observeRunning'));
});
test('invalid envelope performs no operations',async()=>{
 const s=setup();await assert.rejects(run({...s.options,deadline:1200001}),/deadline/);
 assert.deepEqual(s.calls,[]);
});
test('late validation cannot complete and gets finite emergency cleanup window',async()=>{
 const s=setup();let now=0,cleanup;s.options.now=()=>now;
 s.options.ops.validateDiagnostic=async()=>{now=1200001;return s.values.validateDiagnostic;};
 s.options.ops.stopAndConfirm=async value=>{cleanup=value;return s.values.stopAndConfirm;};
 const result=await run(s.options);assert.equal(result.complete,false);assert.equal(result.stopped,true);
 assert.equal(cleanup.emergency,true);assert.equal(cleanup.deadline,1260001);
 assert.equal(result.diagnostic,null);
});
test('slow cleanup exceeding total deadline cannot complete',async()=>{
 const s=setup();let now=0;s.options.now=()=>now;
 s.options.ops.stopAndConfirm=async()=>{now=1200001;return s.values.stopAndConfirm;};
 const result=await run(s.options);assert.equal(result.complete,false);assert.equal(result.stopped,true);
});
test('evidence-incomplete cleanup preserves independently pinned stop',async()=>{
 const s=setup();s.options.ops.stopAndConfirm=async()=>{throw Object.assign(Error('evidence_incomplete'),{helperId,stopped:true});};
 const result=await run(s.options);assert.equal(result.complete,false);assert.equal(result.stopped,true);
 assert.equal(result.diagnostic,null);
});
test('unbound stop exception cannot claim stopped',async()=>{
 const s=setup();s.options.ops.stopAndConfirm=async()=>{throw Object.assign(Error('wrong_vm'),{helperId:'123',stopped:true});};
 assert.equal((await run(s.options)).stopped,false);
});
test('late terminal write never persists a false completion claim',async()=>{
 const s=setup();let now=0;s.options.now=()=>now;
 s.options.record=async e=>{s.events.push(e);if(e.phase==='diagnostic_terminal')now=1200001;};
 const result=await run(s.options);assert.equal(result.complete,false);
 assert.equal(s.events.at(-1).kind,'provisional');assert.equal(s.events.at(-1).result.complete,false);
});
