import test from 'node:test';
import assert from 'node:assert/strict';
import {runDirectArchiveRecovery} from './h2_p8p_hostkey_controller.mjs';
const phases=['preflight','createSnapshot','createClone','createHelper','observeRunning',
 'validateLinuxFixture','attachReadOnly','captureAndValidateChain','readArchiveReceipt','validateArchiveReceipt','confirmGuestUnmounted'];
// Synthetic control-flow tests only. This is not authentic archive content.
const synthetic=Buffer.alloc(12122); // correct shape only; wrong frozen digest
function fixture(fail){
 const calls=[];
 const ops=Object.fromEntries(phases.map(name=>[name,async()=>{
  calls.push(name);if(name===fail)throw Error('injected');
  return name==='validateArchiveReceipt'?synthetic:name==='validateLinuxFixture'?{pass:true,mock:true}:{mock:true};
 }]));
 ops.stopAndConfirm=async()=>{calls.push('stopAndConfirm');};
 return {calls,args:{ops,record:async()=>{},now:()=>0,deadline:1000000}};
}
test('direct path has no key/SSH stage and returns only after stop',async()=>{
 const f=fixture(),r=await runDirectArchiveRecovery(f.args);
 assert.equal(r.pass,true);assert.equal(r.archive,synthetic);
 assert.equal(r.publicKey,undefined);assert.deepEqual(f.calls,[...phases,'stopAndConfirm']);
});
for(const phase of phases)test(`direct failure at ${phase} stops without usable archive`,async()=>{
 const f=fixture(phase),r=await runDirectArchiveRecovery(f.args),i=phases.indexOf(phase);
 assert.equal(r.pass,false);assert.equal(r.archive,undefined);
 assert.deepEqual(f.calls,[...phases.slice(0,i+1),...(i>=3?['stopAndConfirm']:[])]);
});
test('unconfirmed stop withholds direct archive',async()=>{
 const f=fixture();f.args.ops.stopAndConfirm=async()=>{throw Error('stop_unconfirmed');};
 const r=await runDirectArchiveRecovery(f.args);
 assert.equal(r.pass,false);assert.equal(r.archive,undefined);assert.match(r.cleanupFailure,/stop_unconfirmed/);
});
test('terminal evidence failure withholds direct archive',async()=>{
 const f=fixture();f.args.record=async e=>{if(e.phase==='terminal')throw Error('disk_full');};
 const r=await runDirectArchiveRecovery(f.args);
 assert.equal(r.pass,false);assert.equal(r.stopped,true);assert.equal(r.archive,undefined);
});
for(const value of [undefined,null,{},Buffer.alloc(1)])test(`invalid validator output ${String(value)} cannot pass`,async()=>{
 const f=fixture();f.args.ops.validateArchiveReceipt=async()=>value;
 const r=await runDirectArchiveRecovery(f.args);
 assert.equal(r.pass,false);assert.equal(r.stopped,true);assert.equal(r.archive,undefined);
 assert.match(r.failure,/validated_result_missing|validated_archive_shape/);
});
test('missing fixture PASS prevents attachment and still stops helper',async()=>{
 const f=fixture();f.args.ops.validateLinuxFixture=async()=>({pass:false});
 const r=await runDirectArchiveRecovery(f.args);
 assert.equal(r.pass,false);assert.equal(r.stopped,true);
 assert.equal(f.calls.includes('attachReadOnly'),false);assert.match(r.failure,/linux_fixture_not_passed/);
});
