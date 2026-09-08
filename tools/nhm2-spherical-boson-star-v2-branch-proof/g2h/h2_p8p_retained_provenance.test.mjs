import test from 'node:test';
import assert from 'node:assert/strict';
import {validateRetainedResourceChain} from './h2_p8p_retained_provenance.mjs';
import {validateRetainedArchiveReceipt} from './h2_p8p_direct_archive_receipt.mjs';
const t=m=>`2026-09-05T15:${String(m).padStart(2,'0')}:00Z`;
function fixture(){
 const disk={id:'2',selfLink:'source-disk',status:'READY',sizeGb:'10',type:'pd-standard',users:['source']};
 const source={id:'1',selfLink:'source',status:'TERMINATED',lastStartTimestamp:t(0),lastStopTimestamp:t(1),disks:[{boot:true,mode:'READ_WRITE',source:'source-disk'}]};
 const snapshot={id:'3',selfLink:'snapshot',status:'READY',snapshotType:'STANDARD',sourceDisk:'source-disk',sourceDiskId:'2',creationTimestamp:t(4)};
 const clone={id:'4',selfLink:'clone',status:'READY',sizeGb:'10',type:'pd-standard',sourceSnapshot:'snapshot',sourceSnapshotId:'3',creationTimestamp:t(5),users:['helper']};
 const boot={id:'6',selfLink:'boot',status:'READY',sizeGb:'10',type:'pd-standard',sourceImage:'image',users:['helper'],creationTimestamp:t(6)};
 const helper={id:'5',selfLink:'helper',creationTimestamp:t(6),status:'RUNNING',lastStartTimestamp:t(23),lastStopTimestamp:t(10),machineType:'e2-small',disks:[
  {boot:true,source:'boot',mode:'READ_WRITE',autoDelete:false},
  {boot:false,source:'clone',mode:'READ_ONLY',autoDelete:false,deviceName:'clone-device'}]};
 const initial=structuredClone(helper);initial.status='TERMINATED';initial.lastStartTimestamp=t(7);initial.disks.pop();
 const running=structuredClone(helper);running.disks.pop();
 const observed={sourceVM:source,sourceDisk:disk,snapshot,clone,helper,helperBootDisk:boot,
  sourceBefore:{vm:structuredClone(source),observedAt:t(3)},
  helperBeforeAttach:{vm:running,observedAt:t(24)},attachmentIntentAt:t(25),observedAt:t(26),
  retainedBefore:{observedAt:t(22),sourceVM:structuredClone(source),helper:initial,
   clone:{...clone,users:[]},snapshot:structuredClone(snapshot),helperBootDisk:structuredClone(boot)}};
 const identity=x=>({id:x.id,selfLink:x.selfLink,creationTimestamp:x.creationTimestamp});
 const frozen={mode:'retained-helper-v1',historyStartedAt:t(2),successorStartedAt:t(20),deadline:t(50),
  sourceVM:{id:'1',selfLink:'source'},sourceDisk:{id:'2',selfLink:'source-disk',type:'pd-standard'},
  snapshot:identity(snapshot),clone:{...identity(clone),type:'pd-standard',deviceName:'clone-device'},
  helper:{...identity(helper),machineType:'e2-small',bootDisk:'boot',bootDiskId:'6',bootDiskCreationTimestamp:t(6),image:'image'}};
 return {observed,frozen};
}
test('retained history and new restart are distinct without mutating input',()=>{
 const f=fixture(),before=JSON.stringify(f);const out=validateRetainedResourceChain(f.observed,f.frozen);
 assert.equal(out.mode,'retained-helper-v1');assert.equal(JSON.stringify(f),before);
});
const changes={
 substitutedClone:f=>f.observed.clone.id='99',
 substitutedSnapshot:f=>f.observed.snapshot.id='99',
 substitutedHelper:f=>f.observed.helper.id='99',
 substitutedBoot:f=>f.observed.helperBootDisk.id='99',
 changedCreation:f=>f.observed.clone.creationTimestamp=t(21),
 sourceRestart:f=>f.observed.sourceVM.lastStartTimestamp=t(21),
 preattachedClone:f=>f.observed.retainedBefore.clone.users=['helper'],
 twoInitialDisks:f=>f.observed.retainedBefore.helper.disks.push({boot:false}),
 initialRunning:f=>f.observed.retainedBefore.helper.status='RUNNING',
 oldRestart:f=>f.observed.helper.lastStartTimestamp=t(19),
 changedStop:f=>f.observed.helper.lastStopTimestamp=t(21),
 latePreflight:f=>f.observed.retainedBefore.observedAt=t(24),
 writableClone:f=>f.observed.helper.disks[1].mode='READ_WRITE',
 missingHistoricalSource:f=>delete f.observed.sourceBefore,
 backdatedSuccessor:f=>f.frozen.successorStartedAt=t(3),
 deleteBoot:f=>f.observed.helper.disks[0].autoDelete=true,
};
for(const [name,change] of Object.entries(changes))test(`rejects ${name}`,()=>{
 const f=fixture();change(f);assert.throws(()=>validateRetainedResourceChain(f.observed,f.frozen));
});
test('retained archive rejects old namespace and attempt; content digest stays mandatory',()=>{
 const f=fixture(),attemptId='a'.repeat(64);
 const value={schema:'nhm2-direct-archive-v1',instance_id:'5',attempt_id:attemptId,
  pass:true,failure:null,cleanup_failure:null,mount_attempted:true,unmounted:true,
  archive_bytes:12122,archive_sha256:'73029fde08f14f9fcd01490c4e5d5bc188213eaa2f9a8d857eb5e456b86d0922',
  archive_base64:Buffer.alloc(12122).toString('base64')};
 const api={helperId:'5',helperURL:'helper',observedAt:t(27).replace('Z','.000Z'),
  data:[{namespace:'nhm2-archive',key:'receipt',value:JSON.stringify(value)}]};
 const input={...f,api,attemptId};
 assert.throws(()=>validateRetainedArchiveReceipt(input),/archive_entry/);
 api.data[0].namespace='nhm2-archive-retained-v1';
 value.attempt_id='b'.repeat(64);api.data[0].value=JSON.stringify(value);
 assert.throws(()=>validateRetainedArchiveReceipt(input),/archive_guest_identity/);
 value.attempt_id=attemptId;api.data[0].value=JSON.stringify(value);
 assert.throws(()=>validateRetainedArchiveReceipt(input),/archive_content_hash/);
});
