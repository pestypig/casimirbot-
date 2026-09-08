import test from 'node:test';
import assert from 'node:assert/strict';
import {recoverySdkOperations} from './h2_p8p_recovery_sdk_operation.mjs';
function setup(processImpl){
 const records=[],calls=[];
 const dispatch=recoverySdkOperations({startupPath:'C:/NHM2-SYNTHETIC/startup.sh',startupSha256:'a'.repeat(64),
  record:async e=>records.push(e),now:()=>0,processImpl:async(...args)=>{
   calls.push(args);return processImpl?processImpl(...args):{stdout:'{}',stderr:'',exitCode:0,terminationConfirmed:true};
  }});
 return {dispatch,records,calls};
}
test('fixed snapshot command passed literally to injected process; no real SDK call',async()=>{
 const f=setup();await f.dispatch('snapshot',{deadline:100000});
 const [exe,args,opts]=f.calls[0];assert.match(exe,/bundledpython\/python.exe$/);
 assert.ok(args.includes('snapshots'));assert.ok(args.includes('--snapshot-type=STANDARD'));
 assert.equal(opts.timeoutMs,85000);assert.equal(opts.maxBytes,65536);
 assert.equal(f.records[1].type,'operation_result');
 await assert.rejects(f.dispatch('snapshot',{deadline:100000}),/already_consumed/);
});
test('ambiguous process failure consumed but stop remains independently dispatchable',async()=>{
 let n=0;const f=setup(()=>{if(n++===0)throw Object.assign(Error('timeout'),{terminationConfirmed:false,stdout:'partial'});
  return {stdout:'{}',exitCode:0,terminationConfirmed:true};});
 await assert.rejects(f.dispatch('snapshot',{deadline:100000}),/timeout/);
 await assert.rejects(f.dispatch('snapshot',{deadline:100000}),/already_consumed/);
 await f.dispatch('stop',{deadline:100000});
 assert.equal(f.records[1].stdout,'partial');assert.equal(f.calls.length,2);
});
test('unconfirmed process cannot provide resource evidence',async()=>{
 const f=setup(()=>({stdout:'{}',exitCode:0,terminationConfirmed:false}));
 await assert.rejects(f.dispatch('clone',{deadline:100000}),/unconfirmed/);
});
test('unknown action and expired window do not dispatch',async()=>{
 const f=setup();await assert.rejects(f.dispatch('delete',{deadline:100000}),/scope/);
 await assert.rejects(f.dispatch('clone',{deadline:20000}),/deadline/);assert.equal(f.calls.length,0);
});
test('concurrent same-action dispatch is rejected',async()=>{
 const f=setup();const first=f.dispatch('attach',{deadline:100000});
 await assert.rejects(f.dispatch('attach',{deadline:100000}),/already_consumed/);await first;
 assert.equal(f.calls.length,1);
});
test('bad response is preserved, not accepted or retried',async()=>{
 const f=setup(()=>({stdout:'not json',exitCode:0,terminationConfirmed:true}));
 await assert.rejects(f.dispatch('clone',{deadline:100000}));
 assert.equal(f.records.at(-1).result.stdout,'not json');
 await assert.rejects(f.dispatch('clone',{deadline:100000}),/already_consumed/);
});
test('stop dispatch survives broken intent recorder without claiming evidence success',async()=>{
 let calls=0;
 const dispatch=recoverySdkOperations({startupPath:'C:/NHM2-SYNTHETIC/startup.sh',startupSha256:'a'.repeat(64),
  now:()=>0,record:async()=>{throw Error('disk_full');},processImpl:async()=>{
   calls++;return {stdout:'{}',exitCode:0,terminationConfirmed:true};}});
 await assert.rejects(dispatch('stop',{deadline:100000}));assert.equal(calls,1);
});
test('original process failure survives failure recorder exception',async()=>{
 const original=Object.assign(Error('process_timeout'),{pid:123,terminationConfirmed:false,stdout:'partial'});
 let records=0;
 const dispatch=recoverySdkOperations({startupPath:'C:/NHM2-SYNTHETIC/startup.sh',startupSha256:'a'.repeat(64),
  now:()=>0,record:async()=>{if(records++>0)throw Error('disk_full');},processImpl:async()=>{throw original;}});
 await assert.rejects(dispatch('clone',{deadline:100000}),e=>e===original&&e.pid===123&&
  e.terminationConfirmed===false&&/disk_full/.test(e.receiptFailure));
});
