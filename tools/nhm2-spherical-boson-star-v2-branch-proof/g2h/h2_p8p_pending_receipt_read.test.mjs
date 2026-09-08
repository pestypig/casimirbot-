import test from 'node:test';
import assert from 'node:assert/strict';
import {readPendingReceipt} from './h2_p8p_pending_receipt_read.mjs';
import {readObservation} from './h2_p8p_hostkey_api_read.mjs';
import {proposedResources as r} from './h2_p8p_hostkey_resource_commands.mjs';
import {recoveryOperations} from './h2_p8p_recovery_ops.mjs';
const stderr="ERROR: (gcloud.compute.instances.get-guest-attributes) HTTPError 404: The resource 'nhm2-fixture/' of type 'Guest Attribute' was not found. This command is authenticated as pestypig@gmail.com which is the active account specified by the [core/account] property.\r\n";
function setup(change={}){
 const records=[];
 const error=Object.assign(Error('process_exit_1'),{exitCode:1,terminationConfirmed:true,stdout:'',stderr,...change});
 const options={kind:'fixture',name:r.helper,now:()=>0,deadline:60000,record:async v=>records.push(v),
  processImpl:async()=>{throw error;}};
 return {records,options,error};
}
test('captured SDK missing namespace becomes persisted bounded pending, not PASS',async()=>{
 const f=setup();const out=await readPendingReceipt(f.options);
 assert.deepEqual(out.data,[]);assert.equal(out.pass,undefined);
 assert.deepEqual(f.records.map(x=>x.type),['read_intent','read_failure','receipt_pending']);
 assert.equal(f.records[1].stderr,stderr);assert.equal(f.records[2].stderr,stderr);
});
for(const [label,change] of [
 ['wrong namespace',{stderr:stderr.replace('nhm2-fixture/','other/')}],
 ['wrong account',{stderr:stderr.replace('pestypig@gmail.com','other@gmail.com')}],
 ['403',{stderr:stderr.replace('404','403')}],['malformed',{stderr:stderr+'extra'}],
 ['stdout',{stdout:'unexpected'}],['unconfirmed',{terminationConfirmed:false}],
 ['wrong exit',{exitCode:2}],['timeout',{message:'process_timeout'}],
])test(`keeps ${label} terminal`,async()=>{
 const f=setup(change);await assert.rejects(readPendingReceipt(f.options));
 assert.equal(f.records.some(x=>x.type==='receipt_pending'),false);
});
test('failure-record persistence failure remains terminal',async()=>{
 const f=setup();f.options.record=async v=>{if(v.type==='read_failure')throw Error('disk_full');};
 await assert.rejects(readPendingReceipt(f.options));
});
test('pending-record persistence failure remains terminal',async()=>{
 const f=setup();f.options.record=async v=>{if(v.type==='receipt_pending')throw Error('disk_full');};
 await assert.rejects(readPendingReceipt(f.options),/disk_full/);
});
test('general read API retains original first-error behavior',async()=>{
 const f=setup();await assert.rejects(readObservation(f.options),/process_exit_1/);
});
test('pending classification cannot extend exhausted deadline',async()=>{
 const f=setup();let clock=0;f.options.now=()=>clock;
 f.options.processImpl=async()=>{clock=40000;throw f.error;};
 await assert.rejects(readPendingReceipt(f.options));
 assert.equal(f.records.some(x=>x.type==='receipt_pending'),false);
});
test('wrong helper and unsupported kind dispatch nothing',async()=>{
 for(const patch of [{name:'nhm2-other'},{kind:'instance'}]){
  const f=setup();Object.assign(f.options,patch);await assert.rejects(readPendingReceipt(f.options),/pending_read_scope/);
  assert.equal(f.records.length,0);
 }
});
test('complete operation binding polls missing namespace then returns receipt for validation',async()=>{
 const f=setup();let calls=0,clock=0;
 const ops=recoveryOperations({dispatch:async()=>{throw Error('no mutation');},
  record:f.options.record,attemptId:'a'.repeat(64),startupSha256:'b'.repeat(64),startedAt:0,
  now:()=>clock,delay:async ms=>{clock+=ms;},read:async options=>{
   calls++;if(calls===1)throw Object.assign(Error('process_exit_1'),{
    exitCode:1,terminationConfirmed:true,stdout:'',stderr:stderr.replace('nhm2-fixture/','nhm2-archive/')});
   return {data:[{synthetic:true}],observedAt:new Date(clock).toISOString()};
  }});
 const helper={id:'123',name:r.helper,selfLink:`https://www.googleapis.com/compute/v1/projects/${r.project}/zones/${r.zone}/instances/${r.helper}`};
 const result=await ops.readArchiveReceipt({chain:{observed:{helper}}},{deadline:100000});
 assert.equal(calls,2);assert.equal(clock,5000);assert.equal(result.pass,undefined);
 assert.equal(f.records[0].type,'receipt_pending');assert.deepEqual(result.data,[{synthetic:true}]);
});
