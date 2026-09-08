import {readObservation} from './h2_p8p_hostkey_api_read.mjs';
import {observeRecoveryAbsence} from './h2_p8p_recovery_absence.mjs';
import {proposedResources as r} from './h2_p8p_hostkey_resource_commands.mjs';
import {creationTime} from './h2_p8p_resource_enrollment.mjs';
const root=`https://www.googleapis.com/compute/v1/projects/${r.project}/zones/${r.zone}`;
const original='nhm2-h2-p8p-r32-e2-4-20260904';
const evidence='nhm2-h2-p8p-r39-evidence-clone-20260904';
const requireValue=(ok,label)=>{if(!ok)throw Error(`recovery_preflight_${label}`);};
// Read-only admission, not a resource lock or permission to execute a controller.
export async function recoveryPreflight({record,deadline,now=Date.now,read=readObservation}){
 async function capture(kind,name){
  const before=now(), receipt=await read({kind,name,record,deadline,now});
  const t=Date.parse(receipt.observedAt);
  requireValue(Number.isFinite(t)&&new Date(t).toISOString()===receipt.observedAt&&t>=before&&t<deadline,'observation_time');
  requireValue(receipt.data&&!Array.isArray(receipt.data),'observation_shape');
  return receipt;
 }
 const originalReceipt=await capture('instance',original);
 requireValue(originalReceipt.data.name===original&&originalReceipt.data.id==='1893159507643031574'&&originalReceipt.data.selfLink===`${root}/instances/${original}`&&originalReceipt.data.status==='TERMINATED','original_identity');
 const sourceReceipt=await capture('instance',r.sourceDisk), vm=sourceReceipt.data;
 requireValue(vm.name===r.sourceDisk&&vm.id==='7129462452423922626'&&vm.selfLink===`${root}/instances/${r.sourceDisk}`&&vm.status==='TERMINATED'&&vm.machineType===`${root}/machineTypes/e2-small`,'source_identity');
 const start=creationTime(vm.lastStartTimestamp),stop=creationTime(vm.lastStopTimestamp);
 requireValue(start<stop&&stop<=Date.parse(sourceReceipt.observedAt),'source_stop_chronology');
 requireValue(Array.isArray(vm.disks)&&vm.disks.length===2,'source_disks');
 const boot=vm.disks.filter(d=>d.boot===true), data=vm.disks.filter(d=>d.boot===false);
 requireValue(boot.length===1&&boot[0].source===`${root}/disks/${r.sourceDisk}`&&boot[0].mode==='READ_WRITE','source_boot');
 requireValue(data.length===1&&data[0].source===`${root}/disks/${evidence}`&&data[0].mode==='READ_ONLY','source_evidence_attachment');
 const diskReceipt=await capture('disk',r.sourceDisk), disk=diskReceipt.data;
 requireValue(disk.name===r.sourceDisk&&disk.id==='1064813028101755842'&&disk.selfLink===boot[0].source&&disk.status==='READY'&&disk.sizeGb==='10'&&disk.type===`${root}/diskTypes/pd-standard`,'source_disk_identity');
 requireValue(Array.isArray(disk.users)&&disk.users.length===1&&disk.users[0]===vm.selfLink,'source_disk_users');
 const absence=await observeRecoveryAbsence({record,deadline,now,read});
 return {originalReceipt,sourceBefore:{vm,observedAt:sourceReceipt.observedAt},diskReceipt,absence};
}
