import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {validateResourceChain} from './h2_p8p_hostkey_provenance.mjs';
import {validateHostkeyReceipt} from './h2_p8p_hostkey_receipt.mjs';
import {parseEd25519PublicKey} from './h2_p8p_hostkey_public.mjs';
import {validateDirectArchiveReceipt} from './h2_p8p_direct_archive_receipt.mjs';
function fixture(){
 const base='https://www.googleapis.com/compute/v1/projects/synthetic';
 const vm=`${base}/zones/test-b/instances/source`,disk=`${base}/zones/test-b/disks/source`;
 const snap=`${base}/global/snapshots/snapshot`,clone=`${base}/zones/test-b/disks/clone`,helper=`${base}/zones/test-b/instances/helper`;
 const type=`${base}/zones/test-b/diskTypes/pd-standard`,boot=`${base}/zones/test-b/disks/helper`;
 const machine=`${base}/zones/test-b/machineTypes/e2-small`;
 const observed={
 sourceVM:{id:'1',selfLink:vm,status:'TERMINATED',lastStartTimestamp:'2026-09-04T12:00:00Z',lastStopTimestamp:'2026-09-04T12:10:00Z',disks:[{boot:true,mode:'READ_WRITE',source:disk}]},
 sourceDisk:{id:'2',selfLink:disk,status:'READY',sizeGb:'10',type,users:[vm]},
 snapshot:{id:'3',selfLink:snap,status:'READY',snapshotType:'STANDARD',sourceDisk:disk,sourceDiskId:'2',creationTimestamp:'2026-09-05T15:01:00Z'},
 clone:{id:'4',selfLink:clone,status:'READY',sizeGb:'10',type,sourceSnapshot:snap,sourceSnapshotId:'3',creationTimestamp:'2026-09-05T15:02:00Z',users:[helper]},
 helper:{id:'5',selfLink:helper,status:'RUNNING',lastStartTimestamp:'2026-09-05T15:03:00Z',machineType:machine,disks:[{boot:true,source:boot,mode:'READ_WRITE'},{boot:false,source:clone,mode:'READ_ONLY',autoDelete:false,deviceName:'key-clone'}]}};
 observed.sourceBefore={observedAt:'2026-09-05T15:00:30Z',vm:structuredClone(observed.sourceVM)};
 observed.helperBeforeAttach={observedAt:'2026-09-05T15:04:00Z',vm:structuredClone(observed.helper)};
 observed.helperBeforeAttach.vm.disks.pop();
 observed.attachmentIntentAt='2026-09-05T15:05:00Z';observed.observedAt='2026-09-05T15:06:00Z';
 observed.helperBootDisk={id:'6',selfLink:boot,status:'READY',sizeGb:'10',type,sourceImage:'synthetic-exact-image',users:[helper]};
 const frozen={attemptStartedAt:'2026-09-05T15:00:00Z',deadline:'2026-09-05T16:00:00Z',
 sourceVM:{id:'1',selfLink:vm},sourceDisk:{id:'2',selfLink:disk,type},snapshot:{id:'3',selfLink:snap},clone:{id:'4',selfLink:clone,type,deviceName:'key-clone'},helper:{id:'5',selfLink:helper,machineType:machine,bootDisk:boot,bootDiskId:'6',image:'synthetic-exact-image'}};
 return {observed,frozen};
}
test('accepts synthetic bound chain without claiming authentication',()=>{
 const {observed,frozen}=fixture();const r=validateResourceChain(observed,frozen);
 assert.equal(r.structuralChecksPassed,true);assert.equal(r.authenticated,undefined);
});
const mutations={
 missingBefore:o=>delete o.sourceBefore,
 sourceRestartBetween:o=>o.sourceVM.lastStartTimestamp='2026-09-05T15:01:30Z',
 wrongSnapshotType:o=>o.snapshot.snapshotType='ARCHIVE',
 changedSourceDisks:o=>o.sourceBefore.vm.disks[0].mode='READ_ONLY',
 cloneAlreadyAttached:o=>o.helperBeforeAttach.vm.disks.push(o.helper.disks[1]),
 preAttachBootMode:o=>o.helperBeforeAttach.vm.disks[0].mode='READ_ONLY',
 earlyAttach:o=>o.attachmentIntentAt='2026-09-05T15:03:30Z',
 helperRestart:o=>o.helper.lastStartTimestamp='2026-09-05T15:05:30Z',
 wrongBootImage:o=>o.helperBootDisk.sourceImage='another-image',
 wrongBootId:o=>o.helperBootDisk.id='66',
 wrongBootSize:o=>o.helperBootDisk.sizeGb='30',
 expiredObservation:o=>o.observedAt='2026-09-05T16:00:00Z',
 sourceRestart:o=>o.sourceVM.status='RUNNING',
 replacedSource:o=>o.sourceDisk.id='22',
 wrongSnapshotSource:o=>o.snapshot.sourceDiskId='22',
 replacedSnapshot:o=>o.clone.sourceSnapshotId='33',
 writableClone:o=>o.helper.disks[1].mode='READ_WRITE',
 autoDeleteClone:o=>o.helper.disks[1].autoDelete=true,
 extraDisk:o=>o.helper.disks.push({...o.helper.disks[1]}),
 wrongHelper:o=>o.helper.id='55',
 staleSnapshot:o=>o.snapshot.creationTimestamp='2026-09-04T15:01:00Z',
 reversedChronology:o=>o.clone.creationTimestamp='2026-09-05T15:00:30Z',
 sharedClone:o=>o.clone.users.push('another-vm'),
 wrongProject:o=>o.sourceDisk.selfLink=o.sourceDisk.selfLink.replace('/synthetic/','/other/'),
 numericId:o=>o.helper.id=5,
 missingReadiness:o=>delete o.snapshot.status,
 wrongDevice:o=>o.helper.disks[1].deviceName='another-device',
};
for(const [name,mutate] of Object.entries(mutations))test(`rejects ${name}`,()=>{
 const {observed,frozen}=fixture();mutate(observed);assert.throws(()=>validateResourceChain(observed,frozen));
});
test('rejects timezone-less and normalized impossible timestamps',()=>{
 for(const value of ['2026-09-05T15:01:00','2026-02-30T15:01:00Z','2026-09-05T24:01:00Z','2026-09-05T15:01:00+00:99']) {
  const {observed,frozen}=fixture();observed.snapshot.creationTimestamp=value;
  assert.throws(()=>validateResourceChain(observed,frozen),/timestamp/);
 }
});
test('accepts explicit offset representing same time',()=>{
 const {observed,frozen}=fixture();observed.snapshot.creationTimestamp='2026-09-05T08:01:00.000-07:00';
 assert.equal(validateResourceChain(observed,frozen).structuralChecksPassed,true);
});
function receiptFixture(){
 const f=fixture();const wire=Buffer.concat([Buffer.from([0,0,0,11]),Buffer.from('ssh-ed25519'),Buffer.from([0,0,0,32]),Buffer.alloc(32,9)]);
 const key=parseEd25519PublicKey(Buffer.from(`ssh-ed25519 ${wire.toString('base64')}`));
 const value={pass:true,failure:null,cleanup_failure:null,mount_attempted:true,unmounted:true,
   public_key:key.canonical,schema:'nhm2-public-hostkey-v1',instance_id:'5',attempt_id:'a'.repeat(64)};
 return {...f,attemptId:value.attempt_id,expectedFingerprint:key.fingerprint,
   api:{helperId:'5',helperURL:f.frozen.helper.selfLink,observedAt:'2026-09-05T15:07:00.000Z',
     data:[{namespace:'nhm2-hostkey',key:'receipt',value:JSON.stringify(value)}]}};
}
test('composes guest receipt with full synthetic resource chain',()=>{
 const r=validateHostkeyReceipt(receiptFixture());assert.equal(r.helperId,'5');assert.equal(r.sourceDiskId,'2');
 assert.equal(r.authenticated,undefined);
});
for(const field of ['instance_id','attempt_id','schema','pass','unmounted','cleanup_failure','public_key'])
 test(`rejects altered guest ${field}`,()=>{
  const f=receiptFixture();const v=JSON.parse(f.api.data[0].value);v[field]='wrong';f.api.data[0].value=JSON.stringify(v);
  assert.throws(()=>validateHostkeyReceipt(f));
 });
test('rejects duplicate JSON keys and extra guest entries',()=>{
 const f=receiptFixture();f.api.data[0].value=f.api.data[0].value.replace('{','{"pass":false,');
 assert.throws(()=>validateHostkeyReceipt(f));
 const g=receiptFixture();g.api.data.push({...g.api.data[0]});assert.throws(()=>validateHostkeyReceipt(g));
});
test('rejects wrong API target or stale capture',()=>{
 const f=receiptFixture();f.api.helperId='55';assert.throws(()=>validateHostkeyReceipt(f));
 const g=receiptFixture();g.api.observedAt='2026-09-05T15:00:00.000Z';assert.throws(()=>validateHostkeyReceipt(g));
});
test('valid guest key cannot bypass changed source disk',()=>{
 const f=receiptFixture();f.observed.sourceDisk.id='22';assert.throws(()=>validateHostkeyReceipt(f));
});
test('actual Python exporter encoding agrees with receipt validator without network',()=>{
 const f=receiptFixture(),v=JSON.parse(f.api.data[0].value);
 delete v.schema;delete v.instance_id;delete v.attempt_id;
 const code="import sys,json,base64;sys.path.insert(0,sys.argv[1]);from h2_p8p_hostkey_guest_linux import LinuxGuestOps;ops=LinuxGuestOps(device_alias='/dev/disk/by-id/google-nhm2-fixture',mountpoint='/mnt/nhm2-fixture',instance_id='5',attempt_id='a'*64,runner=lambda argv,**kw:print(base64.b64decode(argv[-1]).decode('ascii')));ops.export(json.loads(sys.argv[2]))";
 const python='C:/Users/dan/AppData/Local/NHM2/p8p-r22-gcloud-583.0.0/sdk/google-cloud-sdk/platform/bundledpython/python.exe';
 f.api.data[0].value=execFileSync(python,['-B','-c',code,import.meta.dirname,JSON.stringify(v)],
   {encoding:'utf8',timeout:5000,maxBuffer:8192,windowsHide:true}).trim();
 assert.equal(validateHostkeyReceipt(f).helperId,'5');
});
function archiveFixture(){
 const f=receiptFixture();
 f.api.data=[{namespace:'nhm2-archive',key:'receipt',value:JSON.stringify({
 schema:'nhm2-direct-archive-v1',instance_id:'5',attempt_id:f.attemptId,pass:true,
 failure:null,cleanup_failure:null,mount_attempted:true,unmounted:true,
 archive_bytes:12122,archive_sha256:'73029fde08f14f9fcd01490c4e5d5bc188213eaa2f9a8d857eb5e456b86d0922',
 archive_base64:Buffer.alloc(12122,1).toString('base64')})}];
 return f;
}
test('direct archive receiver independently rejects wrong content despite asserted digest',()=>{
 assert.throws(()=>validateDirectArchiveReceipt(archiveFixture()),/archive_content_hash/);
});
for(const [field,value,reason] of [['instance_id','55','identity'],['pass',false,'failure'],
 ['unmounted',false,'failure'],['archive_bytes',12123,'frozen_identity'],['archive_sha256','a'.repeat(64),'frozen_identity'],
 ['archive_base64','x','base64']])test(`direct archive rejects altered ${field}`,()=>{
 const f=archiveFixture(),r=JSON.parse(f.api.data[0].value);r[field]=value;f.api.data[0].value=JSON.stringify(r);
 assert.throws(()=>validateDirectArchiveReceipt(f),new RegExp(reason));
});
test('direct archive rejects duplicate fields and changed source resource',()=>{
 const f=archiveFixture();f.api.data[0].value=f.api.data[0].value.replace('{','{"pass":false,');
 assert.throws(()=>validateDirectArchiveReceipt(f),/encoding/);
 const g=archiveFixture();g.observed.clone.sourceSnapshotId='33';assert.throws(()=>validateDirectArchiveReceipt(g),/provenance/);
});
