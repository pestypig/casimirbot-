import {readObservation} from './h2_p8p_hostkey_api_read.mjs';
import {proposedResources as r} from './h2_p8p_hostkey_resource_commands.mjs';
// Auth/configuration observations only; no login, consent or settings writes.
export async function recoveryAccountAdmission({record,deadline,now=Date.now,read=readObservation}){
 const observations=[];
 for(const kind of ['account','configuration','projectMetadata']){
  const before=now(),o=await read({kind,name:r.project,record,deadline,now});
  const t=Date.parse(o.observedAt);
  if(!Number.isFinite(t)||new Date(t).toISOString()!==o.observedAt||t<before||t>=deadline)throw Error('account_admission_time');
  const d=o.data;
  if(kind==='account'&&(!Array.isArray(d)||d.length!==1||d[0].account!=='pestypig@gmail.com'||d[0].status!=='ACTIVE'))throw Error('account_admission_identity');
  if(kind==='configuration'&&(d?.core?.account!=='pestypig@gmail.com'||d?.core?.project!==r.project))throw Error('account_admission_configuration');
  if(kind==='projectMetadata'){
   const items=d?.commonInstanceMetadata?.items;
   if(d?.name!==r.project||!Array.isArray(items)||items.length!==1||items[0]?.key!=='ssh-keys')throw Error('account_admission_startup_policy');
  }
  observations.push({kind,...o});
 }
 return observations;
}
