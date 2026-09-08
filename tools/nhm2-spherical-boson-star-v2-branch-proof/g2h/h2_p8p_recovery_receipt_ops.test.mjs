import test from 'node:test';
import assert from 'node:assert/strict';
import {recoveryReceiptOps} from './h2_p8p_recovery_receipt_ops.mjs';
import {proposedResources as r} from './h2_p8p_hostkey_resource_commands.mjs';
const helper={id:'123',name:r.helper,selfLink:`https://www.googleapis.com/compute/v1/projects/${r.project}/zones/${r.zone}/instances/${r.helper}`};
function setup(read){
 let calls=0,delays=0;
 const ops=recoveryReceiptOps({record:async()=>{},attemptId:'a'.repeat(64),now:()=>0,
  read:async args=>{calls++;return read(args,calls);},delay:async ms=>{assert.equal(ms,5000);delays++;}});
 return {ops,calls:()=>calls,delays:()=>delays};
}
const input={chain:{observed:{helper}}},limit={deadline:1000000};
test('successor poller propagates revision and rejects use of fresh archive validator',async()=>{
 const ops=recoveryReceiptOps({record:async()=>{},attemptId:'a'.repeat(64),revision:'retained-helper-v1',now:()=>0,
  read:async args=>{assert.equal(args.revision,'retained-helper-v1');return {data:[{synthetic:true}],observedAt:new Date(0).toISOString()};}});
 await ops.readArchiveReceipt(input,limit);
 await assert.rejects(ops.validateArchiveReceipt({receipt:{},chain:{}}),/retained_provenance_mode/);
});
test('empty receipt namespace is polled within fixed cap',async()=>{
 const f=setup(()=>({data:[],observedAt:new Date(0).toISOString()}));
 await assert.rejects(f.ops.readArchiveReceipt(input,limit),/not_observed/);
 assert.equal(f.calls(),121);assert.equal(f.delays(),120);
});
test('read failure is terminal without polling again',async()=>{
 const f=setup(()=>{throw Error('api_failure');});
 await assert.rejects(f.ops.readArchiveReceipt(input,limit),/api_failure/);
 assert.equal(f.calls(),1);assert.equal(f.delays(),0);
});
test('nonempty receipt delivered exactly once for separate validation',async()=>{
 const f=setup(()=>({data:[{synthetic:true}],observedAt:new Date(0).toISOString()}));
 const result=await f.ops.readArchiveReceipt(input,limit);
 assert.equal(result.helperId,'123');assert.equal(f.calls(),1);
});
test('wrong helper prevents any API call',async()=>{
 const f=setup(()=>({data:[]}));
 await assert.rejects(f.ops.readArchiveReceipt({chain:{observed:{helper:{...helper,id:'bad'}}}},limit),/helper_identity/);
 assert.equal(f.calls(),0);
});
test('malformed API shape is terminal',async()=>{
 const f=setup(()=>({data:{items:[]}}));
 await assert.rejects(f.ops.readArchiveReceipt(input,limit),/api_shape/);assert.equal(f.calls(),1);
});
test('receipt after former55s cutoff is not prematurely rejected',async()=>{
 let clock=0,calls=0;
 const ops=recoveryReceiptOps({record:async()=>{},attemptId:'a'.repeat(64),now:()=>clock,
  delay:async ms=>{clock+=ms;},read:async()=>({data:++calls<16?[]:[{synthetic:true}],observedAt:new Date(clock).toISOString()})});
 const result=await ops.readArchiveReceipt(input,limit);
 assert.equal(clock,75000);assert.equal(result.helperId,'123');
});
test('phase clock enforces deadline even when reads are fast',async()=>{
 let clock=0;
 const ops=recoveryReceiptOps({record:async()=>{},attemptId:'a'.repeat(64),now:()=>clock,
  delay:async ms=>{clock+=ms;},read:async()=>({data:[],observedAt:new Date(clock).toISOString()})});
 await assert.rejects(ops.readArchiveReceipt(input,{deadline:100000}),/poll_deadline/);
 assert.ok(clock<=80000);
});
