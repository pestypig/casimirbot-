import test from 'node:test';
import assert from 'node:assert/strict';
import {recoveryOperations} from './h2_p8p_recovery_ops.mjs';
import {runDirectArchiveRecovery} from './h2_p8p_hostkey_controller.mjs';
import {proposedResources as r} from './h2_p8p_hostkey_resource_commands.mjs';
import {createHash} from 'node:crypto';
import {directArchivePackage} from './h2_p8p_direct_archive_package.mjs';
const base=`https://www.googleapis.com/compute/v1/projects/${r.project}`,z=`${base}/zones/${r.zone}`;
function environment({fixtureFail=false,sourceChanged=false,unsafeHelper=false,startup='synthetic'}={}){
 let clock=Date.parse('2026-09-05T15:00:00Z');const startedAt=clock,deadline=clock+3600000;
 const now=()=>++clock,stamp=()=>new Date(now()).toISOString(),actions=[];
 const source={name:r.sourceDisk,id:'7129462452423922626',selfLink:`${z}/instances/${r.sourceDisk}`,status:'TERMINATED',machineType:`${z}/machineTypes/e2-small`,lastStartTimestamp:'2026-09-04T00:00:00Z',lastStopTimestamp:'2026-09-04T01:00:00Z',disks:[
 {boot:true,mode:'READ_WRITE',source:`${z}/disks/${r.sourceDisk}`},
 {boot:false,mode:'READ_ONLY',source:`${z}/disks/nhm2-h2-p8p-r39-evidence-clone-20260904`}]};
 const sourceDisk={name:r.sourceDisk,id:'1064813028101755842',selfLink:`${z}/disks/${r.sourceDisk}`,status:'READY',sizeGb:'10',type:`${z}/diskTypes/pd-standard`,users:[source.selfLink]};
 const resources={};let sourceReads=0;
 async function dispatch(action){
  actions.push(action);
  if(action==='snapshot')resources.snapshot={name:r.snapshot,id:'31',selfLink:`${base}/global/snapshots/${r.snapshot}`,status:'READY',snapshotType:'STANDARD',storageLocations:[r.region],sourceDisk:sourceDisk.selfLink,sourceDiskId:sourceDisk.id,creationTimestamp:stamp()};
  if(action==='clone')resources.clone={name:r.clone,id:'32',selfLink:`${z}/disks/${r.clone}`,status:'READY',sizeGb:'10',type:sourceDisk.type,sourceSnapshot:resources.snapshot.selfLink,sourceSnapshotId:'31',creationTimestamp:stamp(),users:[]};
  if(action==='helper'){
   resources.helper={name:r.helper,id:'33',selfLink:`${z}/instances/${r.helper}`,status:'RUNNING',machineType:source.machineType,creationTimestamp:stamp(),lastStartTimestamp:stamp(),disks:[{boot:true,mode:'READ_WRITE',source:`${z}/disks/${r.boot}`,autoDelete:false}]};
   resources.helper.metadata={items:[{key:'startup-script',value:startup},{key:'enable-guest-attributes',value:'TRUE'}]};
   resources.helper.scheduling={instanceTerminationAction:unsafeHelper?'DELETE':'STOP',maxRunDuration:{seconds:'3600'}};
   resources.boot={name:r.boot,id:'34',selfLink:`${z}/disks/${r.boot}`,status:'READY',sizeGb:'10',type:sourceDisk.type,sourceImage:`https://www.googleapis.com/compute/v1/${r.image}`,users:[resources.helper.selfLink]};
  }
  if(action==='attach'){
   resources.helper.disks.push({boot:false,mode:'READ_ONLY',autoDelete:false,source:resources.clone.selfLink,deviceName:r.device});
   resources.clone.users=[resources.helper.selfLink];
  }
  if(action==='stop')resources.helper.status='TERMINATED';
  return structuredClone(resources[action]??{});
 }
 const attemptId='a'.repeat(64);
 async function read({kind,name}){
  let data;
  if(kind==='account')data=[{account:'pestypig@gmail.com',status:'ACTIVE'}];
  else if(kind==='configuration')data={core:{account:'pestypig@gmail.com',project:r.project}};
  else if(kind==='projectMetadata')data={name:r.project,commonInstanceMetadata:{items:[{key:'ssh-keys'}]}};
  else if(kind.startsWith('absent_'))data=[];
  else if(kind==='fixture')data=[{namespace:'nhm2-fixture',key:'receipt',value:JSON.stringify({schema:'nhm2-cloud-linux-fixture-v1',instance_id:'33',attempt_id:attemptId,pass:!fixtureFail,failure:fixtureFail?'synthetic_failure':null,checks:['wrong_size','wrong_hash_after_regular_read','leaf_symlink','parent_symlink','fifo_nonblocking_rejection','worker_timeout_reaped','worker_output_cap']})}];
  else if(kind==='archive')data=[{namespace:'nhm2-archive',key:'receipt',value:'{}'}];
  else if(name==='nhm2-h2-p8p-r32-e2-4-20260904')data={name,id:'1893159507643031574',selfLink:`${z}/instances/${name}`,status:'TERMINATED'};
  else if(name===r.sourceDisk){data=kind==='instance'?structuredClone(source):sourceDisk;if(kind==='instance'&&++sourceReads>1&&sourceChanged)data.status='RUNNING';}
  else data=resources[Object.keys(resources).find(k=>resources[k].name===name)];
  return {observedAt:stamp(),data:structuredClone(data)};
 }
 const events=[];const record=async e=>events.push(e);
 const ops=recoveryOperations({dispatch,record,attemptId,startupSha256:createHash('sha256').update(startup).digest('hex'),startedAt,now,read,cleanupRead:read});
 return {ops,record,now,deadline,actions,events};
}
test('composed path reaches immutable archive validator then stops on synthetic invalid receipt',async()=>{
 const e=environment(),result=await runDirectArchiveRecovery(e);
 assert.equal(result.pass,false);assert.match(result.failure,/archive_receipt_fields/);
 assert.equal(result.stopped,true);assert.deepEqual(e.actions,['snapshot','clone','helper','attach','stop']);
 assert.equal(e.events.some(x=>x.phase==='captureAndValidateChain'&&x.kind==='result'),true);
});
test('failed Linux fixture prevents attachment but still stops helper',async()=>{
 const e=environment({fixtureFail:true}),result=await runDirectArchiveRecovery(e);
 assert.match(result.failure,/fixture_not_passed/);assert.equal(result.stopped,true);
 assert.deepEqual(e.actions,['snapshot','clone','helper','stop']);
});
test('post-attachment source change prevents archive access and stops helper',async()=>{
 const e=environment({sourceChanged:true}),result=await runDirectArchiveRecovery(e);
 assert.match(result.failure,/source_running/);assert.equal(result.stopped,true);
 assert.equal(e.events.some(x=>x.phase==='readArchiveReceipt'),false);
});
test('incorrect automatic-stop configuration blocks fixture and attachment',async()=>{
 const e=environment({unsafeHelper:true}),result=await runDirectArchiveRecovery(e);
 assert.match(result.failure,/helper_stop_limit/);assert.equal(result.stopped,true);
 assert.deepEqual(e.actions,['snapshot','clone','helper','stop']);
 assert.equal(e.events.some(x=>x.phase==='validateLinuxFixture'),false);
});
test('actual startup fits lifecycle record and aggregate caps',async()=>{
 const e=environment({startup:directArchivePackage().startup});
 const result=await runDirectArchiveRecovery(e);assert.match(result.failure,/archive_receipt_fields/);
 const sizes=e.events.map(event=>Buffer.byteLength(JSON.stringify(event)));
 assert.ok(Math.max(...sizes)<262000);assert.ok(sizes.reduce((a,b)=>a+b,0)<4*1024*1024);
});
