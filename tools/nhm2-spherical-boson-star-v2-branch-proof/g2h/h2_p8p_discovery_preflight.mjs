// Fresh observations compared with authenticated attached-clone history.
import {discoveryHistoryTail} from './h2_p8p_discovery_history.mjs';
import {recoveryAccountAdmission} from './h2_p8p_recovery_account.mjs';
import {proposedResources as r} from './h2_p8p_hostkey_resource_commands.mjs';
const vmFields=['id','selfLink','creationTimestamp','machineType','disks','metadata',
 'serviceAccounts','scheduling','lastStartTimestamp','lastStopTimestamp'];
const fields={helper:vmFields,sourceVM:vmFields,original:vmFields,
 clone:['id','selfLink','creationTimestamp','sizeGb','type','sourceSnapshot','sourceSnapshotId','users'],
 boot:['id','selfLink','creationTimestamp','sizeGb','type','sourceImage','users'],
 sourceDisk:['id','selfLink','sizeGb','type','sourceImage','users'],
 snapshot:['id','selfLink','creationTimestamp','snapshotType','sourceDisk','sourceDiskId','storageLocations']};
export function validateDiscoveryResources(current,history){
 if(history?.tailSha256!==discoveryHistoryTail)throw Error('discovery_preflight_history');
 for(const [key,keys] of Object.entries(fields)){
  const value=current[key],old=history[key]?.data;
  if(!value||!old)throw Error('discovery_preflight_missing');
  for(const field of keys)if(JSON.stringify(value[field])!==JSON.stringify(old[field]))throw Error(`discovery_preflight_${key}_${field}`);
  if(value.status!==(['helper','sourceVM','original'].includes(key)?'TERMINATED':'READY'))throw Error('discovery_preflight_status');
 }
 const helper=current.helper,clone=current.clone;
 if(helper.id!=='2570241336417567358'||clone.id!=='6517758864936518301'||helper.disks.length!==2)throw Error('discovery_preflight_identity');
 if(helper.disks.filter(d=>!d.boot&&d.source===clone.selfLink&&d.mode==='READ_ONLY'&&d.deviceName===r.device).length!==1)throw Error('discovery_preflight_clone');
 if(JSON.stringify(clone.users)!==JSON.stringify([helper.selfLink]))throw Error('discovery_preflight_users');
 return {authenticated:true,helperId:helper.id,cloneId:clone.id,status:helper.status,cloneMode:'READ_ONLY'};
}

export async function discoveryPreflight({history,record,read,deadline,now=Date.now}){
 const account=await recoveryAccountAdmission({record,read,deadline,now});
 const current={},receipts={};
 const inventory=[['helper','instance',r.helper],['clone','disk',r.clone],['boot','disk',r.boot],
  ['snapshot','snapshot',r.snapshot],['sourceVM','instance',r.sourceDisk],['sourceDisk','disk',r.sourceDisk],
  ['original','instance','nhm2-h2-p8p-r32-e2-4-20260904']];
 for(const [key,kind,name] of inventory){
  const start=now();if(start>=deadline)throw Error('discovery_preflight_deadline');
  const result=await read({kind,name,deadline,record,now});
  const at=Date.parse(result?.observedAt);
  if(!Number.isFinite(at)||at<start||at>=deadline||now()>=deadline)throw Error('discovery_preflight_chronology');
  receipts[key]=result;current[key]=result.data;
 }
 return {...validateDiscoveryResources(current,history),account,current,receipts};
}
