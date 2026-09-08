// Unbound cleanup composition. No cloud work on import. No stop retries.
import {proposedResources as r} from './h2_p8p_hostkey_resource_commands.mjs';
import {readCleanupObservation} from './h2_p8p_hostkey_api_read.mjs';
export async function stopAndObserveRecovery({dispatch,record,expectedId,deadline,
 now=Date.now,observe=readCleanupObservation}){
 let stopError=null,observation=null,observationError=null;
 const started=now();
 // Reserve a minute for an independent describe even if the stop API fails.
 // If already short of time, still attempt stop under its own bounded adapter.
 const reserve=deadline-started>80000?60000:deadline-started>45000?25000:0;
 try{await dispatch('stop',{deadline:deadline-reserve});}
 catch(error){stopError=error;}
 try{
  observation=await observe({kind:'instance',name:r.helper,deadline,record,now});
  const d=observation.data,t=Date.parse(observation.observedAt);
  if(typeof expectedId!=='string'||!/^\d+$/.test(expectedId)||d.id!==expectedId)
   throw Error('stop_identity_unbound');
  if(d.name!==r.helper||d.selfLink!==`https://www.googleapis.com/compute/v1/projects/${r.project}/zones/${r.zone}/instances/${r.helper}`)
   throw Error('stop_resource_identity');
  if(!Number.isFinite(t)||t<started||t>=deadline)throw Error('stop_observation_chronology');
  if(d.status!=='TERMINATED')throw Error('stop_not_confirmed');
  if(observation.receiptFailure)stopError??=Object.assign(Error('cleanup_observation_evidence_incomplete'),
    {receiptFailure:observation.receiptFailure});
 }catch(error){observationError=error;}
 const stopped=observation!==null&&observationError===null;
 if(stopError||observationError){
  throw Object.assign(Error('recovery_cleanup_incomplete'),{stopped,stopError,observationError,observation});
 }
 return {stopped:true,observation};
}
