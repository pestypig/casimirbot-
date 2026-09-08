// Current read-only admission against authenticated predecessor evidence.
import {readObservation} from './h2_p8p_hostkey_api_read.mjs';
import {recoveryAccountAdmission} from './h2_p8p_recovery_account.mjs';
import {proposedResources as r} from './h2_p8p_hostkey_resource_commands.mjs';
import {predecessorTailSha256} from './h2_p8p_retained_history.mjs';
import {creationTime as time} from './h2_p8p_resource_enrollment.mjs';
const check=(v,label)=>{if(!v)throw Error(`retained_preflight_${label}`);};
const same=(a,b,keys,label)=>{for(const key of keys)check(JSON.stringify(a?.[key])===JSON.stringify(b?.[key]),`${label}_${key}`);};
export async function retainedPreflight({history,record,deadline,now=Date.now,read=readObservation}){
 check(history?.tailSha256===predecessorTailSha256,'history_binding');
 const account=await recoveryAccountAdmission({record,deadline,now,read});
 const receipts={};
 async function capture(key,kind,name){
  const started=now(),value=await read({kind,name,deadline,record,now});
  check(value?.data&&!Array.isArray(value.data),'shape');
  check(started<=time(value.observedAt)&&time(value.observedAt)<deadline,'time');
  receipts[key]=value;return value.data;
 }
 const original=await capture('original','instance','nhm2-h2-p8p-r32-e2-4-20260904');
 same(original,history.preflight.originalReceipt.data,['id','selfLink','disks','lastStartTimestamp','lastStopTimestamp'],'original');
 check(original.status==='TERMINATED','original_stopped');
 const sourceVM=await capture('sourceVM','instance',r.sourceDisk);
 same(sourceVM,history.preflight.sourceBefore.vm,['id','selfLink','disks','lastStartTimestamp','lastStopTimestamp'],'source');
 check(sourceVM.status==='TERMINATED','source_stopped');
 const sourceDisk=await capture('sourceDisk','disk',r.sourceDisk);
 same(sourceDisk,history.preflight.diskReceipt.data,['id','selfLink','sizeGb','type','users','sourceImage'],'source_disk');
 check(sourceDisk.status==='READY','source_disk_ready');
 const snapshot=await capture('snapshot','snapshot',r.snapshot);
 same(snapshot,history.snapshot.observation.data,['id','selfLink','creationTimestamp','snapshotType','sourceDisk','sourceDiskId','storageLocations'],'snapshot');
 check(snapshot.status==='READY','snapshot_ready');
 const clone=await capture('clone','disk',r.clone);
 same(clone,history.clone.observation.data,['id','selfLink','creationTimestamp','sizeGb','type','sourceSnapshot','sourceSnapshotId'],'clone');
 check(clone.status==='READY'&&(!clone.users||Array.isArray(clone.users)&&clone.users.length===0),'clone_detached');
 const helper=await capture('helper','instance',r.helper);
 same(helper,history.stopped.vm,['id','selfLink','creationTimestamp','machineType','disks','metadata','serviceAccounts','scheduling','lastStartTimestamp','lastStopTimestamp'],'helper');
 check(helper.status==='TERMINATED','helper_stopped');
 check(helper.disks?.length===1&&helper.disks[0].boot===true&&helper.disks[0].autoDelete===false,'helper_boot_only');
 const helperBootDisk=await capture('helperBootDisk','disk',r.boot);
 same(helperBootDisk,history.running.boot.data,['id','selfLink','creationTimestamp','sizeGb','type','sourceImage','users'],'helper_boot');
 check(helperBootDisk.status==='READY','helper_boot_ready');
 const observedAt=new Date(now()).toISOString();
 check(time(helper.lastStartTimestamp)<time(helper.lastStopTimestamp)&&time(helper.lastStopTimestamp)<=time(observedAt),'helper_stopped_chronology');
 check(time(observedAt)<deadline,'deadline');
 return {account,receipts,observedAt,sourceVM,sourceDisk,snapshot,clone,helper,helperBootDisk};
}
