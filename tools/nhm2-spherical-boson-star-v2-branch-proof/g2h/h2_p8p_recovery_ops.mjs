// Complete operation binding, deliberately without an execution entry point.
// Budget/manifest admission and exclusive evidence storage remain prerequisites.
import {readObservation,readCleanupObservation} from './h2_p8p_hostkey_api_read.mjs';
import {proposedResources as r} from './h2_p8p_hostkey_resource_commands.mjs';
import {recoveryPreflight} from './h2_p8p_recovery_preflight.mjs';
import {enrollCreatedResource} from './h2_p8p_resource_enrollment.mjs';
import {recoveryReceiptOps} from './h2_p8p_recovery_receipt_ops.mjs';
import {stopAndObserveRecovery} from './h2_p8p_recovery_stop.mjs';
import {validateResourceChain} from './h2_p8p_hostkey_provenance.mjs';
import {createHash} from 'node:crypto';
import {recoveryAccountAdmission} from './h2_p8p_recovery_account.mjs';
const base=`https://www.googleapis.com/compute/v1/projects/${r.project}`;
const zone=`${base}/zones/${r.zone}`;
const check=(v,label)=>{if(!v)throw Error(`recovery_binding_${label}`);};
export function recoveryOperations({dispatch,record,attemptId,startupSha256,startedAt,now=Date.now,
 read=readObservation,cleanupRead=readCleanupObservation,delay}){
 check(typeof dispatch==='function'&&typeof record==='function'&&Number.isFinite(startedAt),'arguments');
 check(typeof startupSha256==='string'&&/^[a-f0-9]{64}$/.test(startupSha256),'startup_digest');
 let helperId,validatedArchive=false;
 const receipts=recoveryReceiptOps({record,attemptId,now,read,...(delay?{delay}:{})});
 async function capture(kind,name,deadline){
  const before=now(),observation=await read({kind,name,deadline,record,now});
  const t=Date.parse(observation.observedAt);
  check(Number.isFinite(t)&&new Date(t).toISOString()===observation.observedAt&&t>=before&&t<deadline,'read_time');
  check(observation.data&&!Array.isArray(observation.data),'read_shape');
  return observation;
 }
 async function create(kind,deadline){
  const creation=await dispatch(kind,{deadline});
  const observation=await capture(kind==='helper'?'instance':kind==='clone'?'disk':'snapshot',r[kind],deadline);
  const identity=enrollCreatedResource({kind,creation,observation,startedAt,deadline});
  if(kind==='helper')helperId=identity.id;
  return {identity,observation};
 }
 function helperConfig(vm){
  check(vm.id===helperId&&vm.name===r.helper&&vm.selfLink===`${zone}/instances/${r.helper}`&&vm.status==='RUNNING'&&vm.machineType===`${zone}/machineTypes/e2-small`,'helper');
  check(Array.isArray(vm.disks)&&vm.disks.length===1&&vm.disks[0].boot===true&&vm.disks[0].mode==='READ_WRITE'&&vm.disks[0].autoDelete===false&&vm.disks[0].source===`${zone}/disks/${r.boot}`,'helper_boot_only');
  check(vm.serviceAccounts===undefined||Array.isArray(vm.serviceAccounts)&&vm.serviceAccounts.length===0,'helper_service_accounts');
  check(vm.scheduling?.instanceTerminationAction==='STOP'&&String(vm.scheduling?.maxRunDuration?.seconds)==='3600'&&(!vm.scheduling.maxRunDuration.nanos||vm.scheduling.maxRunDuration.nanos===0),'helper_stop_limit');
  const items=vm.metadata?.items;
  check(Array.isArray(items)&&items.length===2&&items.every(i=>i&&typeof i.key==='string'&&typeof i.value==='string'),'helper_metadata');
  const startup=items.filter(i=>i.key==='startup-script'),enabled=items.filter(i=>i.key==='enable-guest-attributes');
  check(startup.length===1&&enabled.length===1&&enabled[0].value==='TRUE'&&createHash('sha256').update(startup[0].value).digest('hex')===startupSha256,'helper_startup_binding');
 }
 return {
  async preflight(_,context){
   const account=await recoveryAccountAdmission({record,now,read,...context});
   const source=await recoveryPreflight({record,now,read,...context});
   return {...source,account};
  },
  async createSnapshot(preflight,{deadline}){
   const value=await create('snapshot',deadline),d=value.observation.data;
   check(d.status==='READY'&&d.snapshotType==='STANDARD'&&d.sourceDisk===preflight.diskReceipt.data.selfLink&&d.sourceDiskId===preflight.diskReceipt.data.id,'snapshot_source');
   check(Array.isArray(d.storageLocations)&&d.storageLocations.length===1&&d.storageLocations[0]===r.region,'snapshot_region');
   return value;
  },
  async createClone({snapshot},{deadline}){
   const value=await create('clone',deadline),d=value.observation.data;
   check(d.status==='READY'&&d.sizeGb==='10'&&d.type===`${zone}/diskTypes/pd-standard`&&d.sourceSnapshot===snapshot.identity.selfLink&&d.sourceSnapshotId===snapshot.identity.id&&(!d.users||Array.isArray(d.users)&&d.users.length===0),'clone_source');
   return value;
  },
  createHelper:(_,context)=>create('helper',context.deadline),
  async observeRunning({helper},{deadline}){
   const observation=await capture('instance',r.helper,deadline);
   check(observation.data.id===helper.identity.id,'running_identity');helperConfig(observation.data);
   const boot=await capture('disk',r.boot,deadline),d=boot.data;
   check(typeof d.id==='string'&&/^[1-9][0-9]*$/.test(d.id)&&d.selfLink===`${zone}/disks/${r.boot}`&&d.status==='READY'&&d.sizeGb==='10'&&d.type===`${zone}/diskTypes/pd-standard`&&d.sourceImage===`https://www.googleapis.com/compute/v1/${r.image}`,'boot_disk');
   check(Array.isArray(d.users)&&d.users.length===1&&d.users[0]===observation.data.selfLink,'boot_users');
   return {vm:observation.data,observedAt:observation.observedAt,boot};
  },
  validateLinuxFixture:receipts.validateLinuxFixture,
  async attachReadOnly({running},{deadline}){
   check(now()>Date.parse(running.observedAt),'attachment_time');
   const observedAt=new Date(now()).toISOString();
   const result=await dispatch('attach',{deadline});
   return {observedAt,result};
  },
  async captureAndValidateChain({preflight,snapshot,clone,helper,running,attachment},{deadline}){
   const source=await capture('instance',r.sourceDisk,deadline);
   const disk=await capture('disk',r.sourceDisk,deadline);
   const snap=await capture('snapshot',r.snapshot,deadline);
   check(Array.isArray(snap.data.storageLocations)&&snap.data.storageLocations.length===1&&snap.data.storageLocations[0]===r.region,'snapshot_region');
   const cloned=await capture('disk',r.clone,deadline);
   const boot=await capture('disk',r.boot,deadline);
   const current=await capture('instance',r.helper,deadline);
   const observed={sourceVM:source.data,sourceDisk:disk.data,snapshot:snap.data,clone:cloned.data,helper:current.data,
    sourceBefore:preflight.sourceBefore,helperBeforeAttach:running,helperBootDisk:boot.data,
    attachmentIntentAt:attachment.observedAt,observedAt:current.observedAt};
   const frozen={attemptStartedAt:new Date(startedAt).toISOString(),deadline:new Date(deadline).toISOString(),
    sourceVM:{id:preflight.sourceBefore.vm.id,selfLink:preflight.sourceBefore.vm.selfLink},
    sourceDisk:{id:preflight.diskReceipt.data.id,selfLink:preflight.diskReceipt.data.selfLink,type:`${zone}/diskTypes/pd-standard`},
    snapshot:snapshot.identity,clone:{...clone.identity,type:`${zone}/diskTypes/pd-standard`,deviceName:r.device},
    helper:{...helper.identity,machineType:`${zone}/machineTypes/e2-small`,bootDisk:`${zone}/disks/${r.boot}`,bootDiskId:running.boot.data.id,image:`https://www.googleapis.com/compute/v1/${r.image}`}};
   validateResourceChain(observed,frozen);return {observed,frozen};
  },
  readArchiveReceipt:receipts.readArchiveReceipt,
  async validateArchiveReceipt(input,context){
   const archive=await receipts.validateArchiveReceipt(input,context);validatedArchive=true;return archive;
  },
  async confirmGuestUnmounted(){
   // Only a fully validated archive receipt establishes the guest's reported
   // successful unmount; this is not an independent host mount observation.
   check(validatedArchive,'unmount_receipt_missing');return {unmounted:true,basis:'authenticated_guest_receipt'};
  },
  stopAndConfirm:({deadline})=>stopAndObserveRecovery({dispatch,record,expectedId:helperId,deadline,now,observe:cleanupRead}),
 };
}
