import {readObservation} from './h2_p8p_hostkey_api_read.mjs';
import {proposedResources as r} from './h2_p8p_hostkey_resource_commands.mjs';
// Exact proposed names only. Project-wide name absence is stricter than zone
// absence. Not an atomic lock: creation must still fail on resource collision.
export async function observeRecoveryAbsence({record,deadline,now=Date.now,read=readObservation}){
 const inventory=[['absent_snapshot',r.snapshot],['absent_disk',r.clone],
  ['absent_disk',r.boot],['absent_instance',r.helper]];
 const observations=[];
 for(const [kind,name] of inventory){
  const before=now();
  const observed=await read({kind,name,record,deadline,now});
  const t=Date.parse(observed.observedAt);
  if(!Number.isFinite(t)||new Date(t).toISOString()!==observed.observedAt||t<before||t>=deadline)
   throw Error('absence_observation_time');
  if(!Array.isArray(observed.data)||observed.data.length!==0)throw Error('proposed_resource_not_absent');
  observations.push({kind,name,...observed});
 }
 return observations;
}
