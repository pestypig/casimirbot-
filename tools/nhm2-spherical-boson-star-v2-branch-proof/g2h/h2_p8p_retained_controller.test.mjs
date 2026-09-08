import test from 'node:test';
import assert from 'node:assert/strict';
import {runRetainedArchiveRecovery} from './h2_p8p_hostkey_controller.mjs';
function fixture(fail){
 const calls=[];
 const ops={};
 for(const name of ['preflight','replaceStartup','verifyStoppedStartup','restartHelper','observeRunning','attachReadOnly','captureAndValidateChain','readArchiveReceipt','confirmGuestUnmounted'])
  ops[name]=async()=>{calls.push(name);if(name===fail)throw Error(name);return {};};
 ops.captureRetained=async()=>{calls.push('captureRetained');return {snapshot:{},clone:{},helper:{}};};
 ops.validateLinuxFixture=async()=>{calls.push('validateLinuxFixture');return {pass:fail!=='fixture'};};
 ops.validateArchiveReceipt=async()=>{calls.push('validateArchiveReceipt');throw Error('synthetic_no_archive');};
 ops.stopAndConfirm=async()=>{calls.push('stop');};
 return {ops,calls};
}
test('retained lifecycle replaces, verifies, restarts once and never creates resources',async()=>{
 const f=fixture();const out=await runRetainedArchiveRecovery({ops:f.ops,record:async()=>{},now:()=>0,deadline:3600000});
 assert.equal(out.pass,false);assert.equal(out.stopped,true);
 assert.deepEqual(f.calls,['preflight','captureRetained','replaceStartup','verifyStoppedStartup','restartHelper','observeRunning','validateLinuxFixture','attachReadOnly','captureAndValidateChain','readArchiveReceipt','validateArchiveReceipt','stop']);
});
test('startup verification failure prevents restart and attachment',async()=>{
 const f=fixture('verifyStoppedStartup');await runRetainedArchiveRecovery({ops:f.ops,record:async()=>{},now:()=>0,deadline:3600000});
 assert.ok(!f.calls.includes('restartHelper'));assert.ok(!f.calls.includes('attachReadOnly'));
});
test('ambiguous restart failure still triggers cleanup',async()=>{
 const f=fixture('restartHelper');const out=await runRetainedArchiveRecovery({ops:f.ops,record:async()=>{},now:()=>0,deadline:3600000});
 assert.equal(out.stopped,true);assert.equal(f.calls.at(-1),'stop');assert.ok(!f.calls.includes('observeRunning'));
});
test('fixture failure prevents attachment and stops helper',async()=>{
 const f=fixture('fixture');const out=await runRetainedArchiveRecovery({ops:f.ops,record:async()=>{},now:()=>0,deadline:3600000});
 assert.equal(out.stopped,true);assert.ok(!f.calls.includes('attachReadOnly'));
});
test('restart-result persistence failure cannot suppress cleanup',async()=>{
 const f=fixture();const out=await runRetainedArchiveRecovery({ops:f.ops,now:()=>0,deadline:3600000,
 record:async e=>{if(e.phase==='restartHelper'&&e.kind==='result')throw Error('disk_full');}});
 assert.equal(out.stopped,true);assert.equal(out.pass,false);assert.equal(f.calls.at(-1),'stop');
});
