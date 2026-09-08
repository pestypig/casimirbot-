import test from 'node:test';
import assert from 'node:assert/strict';
import {runHostkeyRecovery} from './h2_p8p_hostkey_controller.mjs';
const phases=['preflight','createSnapshot','createClone','createHelper','observeRunning','attachReadOnly','captureAndValidateChain','readPublicKeyReceipt','validatePublicKeyReceipt','confirmGuestUnmounted'];
function setup(failing){
 const calls=[];const records=[];
 const ops=Object.fromEntries(phases.map(name=>[name,async(_input,options)=>{
  calls.push(name);assert.equal(options.deadline,700000);
  if(name===failing)throw Error('injected');return {synthetic:true};
 }]));
 ops.stopAndConfirm=async({deadline})=>{calls.push('stopAndConfirm');assert.equal(deadline,1000000);};
 return {calls,records,args:{ops,record:async e=>records.push(e),now:()=>0,deadline:1000000}};
}
test('ordered single attempts; no result before confirmed stop',async()=>{
 const f=setup();const r=await runHostkeyRecovery(f.args);
 assert.equal(r.pass,true);assert.deepEqual(f.calls,[...phases,'stopAndConfirm']);
 assert.equal(r.stopped,true);
});
for(const phase of phases)test(`failure at ${phase} is terminal with scoped cleanup`,async()=>{
 const f=setup(phase);const r=await runHostkeyRecovery(f.args);
 const index=phases.indexOf(phase);const dispatched=phases.slice(0,index+1);
 assert.equal(r.pass,false);assert.equal(r.publicKey,undefined);
 assert.deepEqual(f.calls,index>=3?[...dispatched,'stopAndConfirm']:dispatched);
});
test('evidence write failure after helper creation still stops',async()=>{
 const f=setup();f.args.record=async e=>{if(e.phase==='createHelper'&&e.kind==='result')throw Error('disk_full');};
 const r=await runHostkeyRecovery(f.args);assert.equal(r.pass,false);
 assert.equal(f.calls.at(-1),'stopAndConfirm');assert.equal(r.stopped,true);
});
test('unconfirmed stop cannot export a usable key',async()=>{
 const f=setup();f.args.ops.stopAndConfirm=async()=>{throw Error('unconfirmed');};
 const r=await runHostkeyRecovery(f.args);assert.equal(r.pass,false);assert.equal(r.publicKey,undefined);
 assert.match(r.cleanupFailure,/unconfirmed/);
});
test('cleanup reserve blocks new work',async()=>{
 const f=setup();f.args.now=()=>700000;
 const r=await runHostkeyRecovery(f.args);assert.equal(r.pass,false);assert.deepEqual(f.calls,[]);
});
test('terminal receipt failure prevents usable key return',async()=>{
 const f=setup();f.args.record=async e=>{if(e.phase==='terminal')throw Error('disk_full');};
 const r=await runHostkeyRecovery(f.args);assert.equal(r.pass,false);assert.equal(r.publicKey,undefined);
 assert.equal(r.stopped,true);
});
test('hung recorder does not prevent cleanup after dispatch',async()=>{
 const f=setup();f.args.recordTimeoutMs=10;
 f.args.record=e=>e.phase==='createHelper'&&e.kind==='result'?new Promise(()=>{}):Promise.resolve();
 const r=await runHostkeyRecovery(f.args);assert.equal(r.pass,false);assert.equal(r.stopped,true);
 assert.match(r.receiptFailure,/receipt_timeout/);
});
test('expired deadline still dispatches emergency stop',async()=>{
 const f=setup();let time=0;f.args.now=()=>time;
 f.args.ops.createHelper=async()=>{time=1000000;throw Error('ambiguous_timeout');};
 f.args.ops.stopAndConfirm=async o=>{assert.equal(o.emergency,true);assert.equal(o.deadline,1060000);};
 const r=await runHostkeyRecovery(f.args);assert.equal(r.pass,false);assert.equal(r.stopped,true);
});
