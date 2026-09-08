// Local composed regression using pinned historical evidence and fake API responses.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {loadRetainedHistory} from './h2_p8p_retained_history.mjs';
import {loadRetainedV2History} from './h2_p8p_retained_v2_history.mjs';
import {directArchivePackage} from './h2_p8p_direct_archive_package.mjs';
import {retainedOperations} from './h2_p8p_retained_ops.mjs';
import {runRetainedArchiveRecovery} from './h2_p8p_hostkey_controller.mjs';
import {proposedResources as r} from './h2_p8p_hostkey_resource_commands.mjs';
const history=await loadRetainedHistory();
const historyV2=await loadRetainedV2History();
function setup(mode,revision='retained-helper-v1'){
 const currentHistory=revision==='retained-helper-v2'?historyV2:history;
 const h=structuredClone(currentHistory),startup=directArchivePackage({revision}).startup,attemptId='c'.repeat(64);
 let clock=Date.parse(currentHistory.stopped.observedAt)+60000;
 const startedAt=clock,deadline=clock+3600000,calls=[],records=[];
 const helper=h.stopped.vm,clone=h.clone.observation.data;
 const map={
  ['instance:nhm2-h2-p8p-r32-e2-4-20260904']:h.preflight.originalReceipt.data,
  [`instance:${r.sourceDisk}`]:h.preflight.sourceBefore.vm,[`disk:${r.sourceDisk}`]:h.preflight.diskReceipt.data,
  [`snapshot:${r.snapshot}`]:h.snapshot.observation.data,[`disk:${r.clone}`]:clone,
  [`instance:${r.helper}`]:helper,[`disk:${r.boot}`]:h.running.boot.data};
 const now=()=>clock;
 const read=async({kind,name,revision:requestedRevision})=>{
  clock++;let data;
  if(['account','configuration','projectMetadata'].includes(kind))data=currentHistory.preflight.account.find(x=>x.kind===kind).data;
  else if(kind==='fixture'){
   assert.equal(requestedRevision,revision);
   data=[{namespace:mode==='stale'?'nhm2-fixture':revision==='retained-helper-v2'?'nhm2-fixture-retained-v2':'nhm2-fixture-retained-v1',key:'receipt',value:JSON.stringify({
    attempt_id:attemptId,pass:mode!=='fixture_fail',checks:['wrong_size','wrong_hash_after_regular_read','leaf_symlink','parent_symlink','fifo_nonblocking_rejection','worker_timeout_reaped','worker_output_cap'],
    failure:null,schema:'nhm2-cloud-linux-fixture-v1',instance_id:helper.id})}];
  }else if(kind==='archive'){
   assert.equal(requestedRevision,revision);data=[{namespace:revision==='retained-helper-v2'?'nhm2-archive-retained-v2':'nhm2-archive-retained-v1',key:'receipt',value:'{}'}];
  }else data=map[`${kind}:${name}`];
  assert.ok(data);return {data:structuredClone(data),observedAt:new Date(clock).toISOString()};
 };
 const dispatch=async action=>{
  clock++;calls.push(action);
  if(action==='startup')helper.metadata.items.find(i=>i.key==='startup-script').value=mode==='bad_startup'?'wrong':startup;
  else if(action==='restart'){helper.status='RUNNING';helper.lastStartTimestamp=new Date(clock).toISOString();}
  else if(action==='attach'){
   helper.disks.push({boot:false,source:clone.selfLink,mode:'READ_ONLY',autoDelete:false,deviceName:r.device});clone.users=[helper.selfLink];
  }else if(action==='stop'){helper.status='TERMINATED';helper.lastStopTimestamp=new Date(clock).toISOString();}
  else throw Error('unexpected_operation');
  return {};
 };
 const record=async e=>{records.push(e);};
 const ops=retainedOperations({history:currentHistory,dispatch,record,attemptId,startedAt,revision,now,read,cleanupRead:read,
  startupSha256:createHash('sha256').update(startup).digest('hex')});
 return {calls,records,run:()=>runRetainedArchiveRecovery({ops,record,now,deadline})};
}
test('full retained binding reaches strict archive validation then stops',async()=>{
 const f=setup();const result=await f.run();assert.equal(result.pass,false);assert.equal(result.stopped,true);
 assert.match(result.failure,/archive_receipt_fields/);
 assert.deepEqual(f.calls,['startup','restart','attach','stop']);
 assert.ok(f.records.some(e=>e.phase==='captureAndValidateChain'&&e.kind==='result'));
 assert.ok(Math.max(...f.records.map(e=>Buffer.byteLength(JSON.stringify(e))))<262000);
});
for(const mode of ['stale','fixture_fail'])test(`${mode} prevents attachment and stops`,async()=>{
 const f=setup(mode);const result=await f.run();assert.equal(result.stopped,true);
 assert.deepEqual(f.calls,['startup','restart','stop']);
});
test('wrong replacement startup prevents restart',async()=>{
 const f=setup('bad_startup');const result=await f.run();assert.equal(result.pass,false);
 assert.deepEqual(f.calls,['startup']);assert.match(result.failure,/startup_hash/);
});
test('v2 complete binding uses latest stopped history and isolated namespace then cleans up',async()=>{
 const f=setup(undefined,'retained-helper-v2');const result=await f.run();
 assert.equal(result.stopped,true);assert.match(result.failure,/archive_receipt_fields/);
 assert.deepEqual(f.calls,['startup','restart','attach','stop']);
 assert.ok(Math.max(...f.records.map(e=>Buffer.byteLength(JSON.stringify(e))))<262000);
});
