// Retained operations composition; no execution entry point or implicit API call.
import {createHash} from 'node:crypto';
import {retainedPreflight} from './h2_p8p_retained_preflight.mjs';
import {readObservation,readCleanupObservation} from './h2_p8p_hostkey_api_read.mjs';
import {recoveryReceiptOps} from './h2_p8p_recovery_receipt_ops.mjs';
import {validateRetainedResourceChain} from './h2_p8p_retained_provenance.mjs';
import {stopAndObserveRecovery} from './h2_p8p_recovery_stop.mjs';
import {proposedResources as r} from './h2_p8p_hostkey_resource_commands.mjs';
const check=(v,label)=>{if(!v)throw Error(`retained_ops_${label}`);};
const same=(a,b,keys,label)=>{for(const k of keys)check(JSON.stringify(a?.[k])===JSON.stringify(b?.[k]),`${label}_${k}`);};
const compact=vm=>{const {metadata,...rest}=vm;return rest;};
export function retainedOperations({history,dispatch,record,attemptId,startupSha256,startedAt,revision='retained-helper-v1',now=Date.now,
 read=readObservation,cleanupRead=readCleanupObservation,delay}){
 check(typeof dispatch==='function'&&typeof record==='function'&&Number.isFinite(startedAt),'arguments');
 check(/^[a-f0-9]{64}$/.test(startupSha256??''),'startup_digest');
 check(['retained-helper-v1','retained-helper-v2'].includes(revision),'revision');
 const receipts=recoveryReceiptOps({record,attemptId,revision,now,read,...(delay?{delay}:{})});
 let before,verified=false,restartAt,archiveValidated=false;
 async function capture(kind,name,deadline){
  const start=now(),o=await read({kind,name,deadline,record,now});
  check(o?.data&&!Array.isArray(o.data)&&Date.parse(o.observedAt)>=start&&Date.parse(o.observedAt)<deadline,'capture');return o;
 }
 function config(vm,status){
  same(vm,before.helper,['id','selfLink','creationTimestamp','machineType','disks','serviceAccounts','scheduling','lastStopTimestamp'],'helper');
  check(vm.status===status,'helper_status');
  const items=vm.metadata?.items;
  check(Array.isArray(items)&&items.length===2,'metadata_count');
  const script=items.filter(i=>i.key==='startup-script'),enabled=items.filter(i=>i.key==='enable-guest-attributes');
  check(script.length===1&&typeof script[0].value==='string'&&enabled.length===1&&enabled[0].value==='TRUE','metadata_keys');
  check(createHash('sha256').update(script[0].value).digest('hex')===startupSha256,'startup_hash');
 }
 return {
  async preflight(_,context){before=await retainedPreflight({history,record,now,read,...context});return before;},
  async captureRetained(){check(before,'preflight_required');return {snapshot:history.snapshot,clone:history.clone,helper:{identity:history.helper.identity}};},
  async replaceStartup(_,context){check(before,'preflight_required');return dispatch('startup',context);},
  async verifyStoppedStartup(_,{deadline}){
   const o=await capture('instance',r.helper,deadline);config(o.data,'TERMINATED');
   check(o.data.lastStartTimestamp===before.helper.lastStartTimestamp,'stopped_start_changed');
   verified=true;return {verified:true,observedAt:o.observedAt};
  },
  async restartHelper(_,context){check(verified&&restartAt===undefined,'restart_admission');restartAt=now();return dispatch('restart',context);},
  async observeRunning(_,{deadline}){
   const o=await capture('instance',r.helper,deadline);config(o.data,'RUNNING');
   check(Number.isFinite(restartAt)&&Date.parse(o.data.lastStartTimestamp)>=restartAt&&Date.parse(o.data.lastStartTimestamp)<=Date.parse(o.observedAt),'restart_chronology');
   const boot=await capture('disk',r.boot,deadline);
   same(boot.data,before.helperBootDisk,['id','selfLink','creationTimestamp','status','sizeGb','type','sourceImage','users'],'boot');
   return {vm:compact(o.data),observedAt:o.observedAt,boot};
  },
  validateLinuxFixture:receipts.validateLinuxFixture,
  async attachReadOnly({running},{deadline}){
   check(now()>Date.parse(running.observedAt),'attachment_chronology');
   const observedAt=new Date(now()).toISOString();const result=await dispatch('attach',{deadline});return {observedAt,result};
  },
  async captureAndValidateChain({running,attachment},{deadline}){
   const source=await capture('instance',r.sourceDisk,deadline),disk=await capture('disk',r.sourceDisk,deadline);
   const snap=await capture('snapshot',r.snapshot,deadline),clone=await capture('disk',r.clone,deadline);
   const boot=await capture('disk',r.boot,deadline),helper=await capture('instance',r.helper,deadline);
   // Recheck the startup/config after attachment using only the boot projection;
   // provenance below checks the exact additional read-only clone attachment.
   config({...helper.data,disks:helper.data.disks.filter(d=>d.boot)},'RUNNING');
   const observed={sourceVM:source.data,sourceDisk:disk.data,snapshot:snap.data,clone:clone.data,helper:compact(helper.data),
    helperBootDisk:boot.data,sourceBefore:history.preflight.sourceBefore,helperBeforeAttach:running,
    attachmentIntentAt:attachment.observedAt,observedAt:helper.observedAt,
    retainedBefore:{observedAt:before.observedAt,sourceVM:before.sourceVM,snapshot:before.snapshot,clone:before.clone,
     helper:compact(before.helper),helperBootDisk:before.helperBootDisk}};
   const frozen={mode:'retained-helper-v1',historyStartedAt:history.startedAt,successorStartedAt:new Date(startedAt).toISOString(),deadline:new Date(deadline).toISOString(),
    sourceVM:{id:before.sourceVM.id,selfLink:before.sourceVM.selfLink},
    sourceDisk:{id:before.sourceDisk.id,selfLink:before.sourceDisk.selfLink,type:before.sourceDisk.type},
    snapshot:history.snapshot.identity,clone:{...history.clone.identity,type:before.clone.type,deviceName:r.device},
    helper:{...history.helper.identity,machineType:before.helper.machineType,bootDisk:before.helperBootDisk.selfLink,
     bootDiskId:before.helperBootDisk.id,bootDiskCreationTimestamp:before.helperBootDisk.creationTimestamp,image:before.helperBootDisk.sourceImage}};
   validateRetainedResourceChain(observed,frozen);return {observed,frozen};
  },
  readArchiveReceipt:receipts.readArchiveReceipt,
  async validateArchiveReceipt(input,context){const result=await receipts.validateArchiveReceipt(input,context);archiveValidated=true;return result;},
  async confirmGuestUnmounted(){check(archiveValidated,'archive_required');return {unmounted:true,basis:'authenticated_guest_receipt'};},
  stopAndConfirm:({deadline})=>stopAndObserveRecovery({dispatch,record,expectedId:history.helper.identity.id,deadline,now,observe:cleanupRead}),
 };
}
