// Complete lifecycle composition; caller must bind authorized one-use dispatch.
import {createHash} from 'node:crypto';
import {discoveryPreflight} from './h2_p8p_discovery_preflight.mjs';
import {stopAndObserveRecovery} from './h2_p8p_recovery_stop.mjs';
import {proposedResources as r} from './h2_p8p_hostkey_resource_commands.mjs';
const sha=s=>createHash('sha256').update(s).digest('hex');
export function discoveryOperations({history,dispatch,record,read,validate,attempt,startupSha256,now=Date.now,
 delay=ms=>new Promise(resolve=>setTimeout(resolve,ms))}){
 if(!/^[a-f0-9]{64}$/.test(attempt??'')||!/^[a-f0-9]{64}$/.test(startupSha256??''))throw Error('ops_identity');
 for(const fn of [dispatch,record,read,validate,delay])if(typeof fn!=='function')throw Error('ops_adapter');
 let before,verified=false,restartAt,serial;
 async function capture(kind,name,deadline,cleanup=false){
  const start=now();
  const o=await read({kind,name,attempt,deadline,record,now,cleanup});
  const at=Date.parse(o.observedAt);
  if(!Number.isFinite(at)||at<start||at>=deadline)throw Error('ops_observation_time');
  return o;
 }
 function config(vm,status){
  const old=before.current.helper;
  for(const key of ['id','selfLink','machineType','creationTimestamp','disks','serviceAccounts','scheduling','lastStopTimestamp'])
   if(JSON.stringify(vm[key])!==JSON.stringify(old[key]))throw Error('ops_config_'+key);
  if(vm.status!==status)throw Error('ops_status');
  const items=vm.metadata?.items;
  if(!Array.isArray(items)||items.length!==2)throw Error('ops_metadata');
  const script=items.find(i=>i.key==='startup-script'),enabled=items.find(i=>i.key==='enable-guest-attributes');
  if(typeof script?.value!=='string'||sha(script.value)!==startupSha256||enabled?.value!=='TRUE')throw Error('ops_startup_hash');
 }
 return {
  async preflight(_,context){before=await discoveryPreflight({history,record,read,now,...context});
   return {authenticated:before.authenticated,helperId:before.helperId,cloneId:before.cloneId,status:before.status,cloneMode:before.cloneMode};},
  async replaceDiagnosticStartup(_,context){if(!before)throw Error('ops_preflight');return dispatch('startup',context);},
  async verifyStoppedStartup(_,{deadline}){
   const o=await capture('instance',r.helper,deadline);config(o.data,'TERMINATED');
   if(o.data.lastStartTimestamp!==before.current.helper.lastStartTimestamp)throw Error('ops_start_changed');
   verified=true;return {verified:true,helperId:o.data.id,attempt};
  },
  async restartHelper(_,context){if(!verified||restartAt!==undefined)throw Error('ops_start_admission');restartAt=now();return dispatch('restart',context);},
  async observeRunning(_,{deadline}){
   const o=await capture('instance',r.helper,deadline);config(o.data,'RUNNING');
   const start=Date.parse(o.data.lastStartTimestamp);
   if(!Number.isFinite(start)||start<restartAt||start>Date.parse(o.observedAt))throw Error('ops_restart_chronology');
   return {authenticated:true,helperId:o.data.id,status:o.data.status};
  },
  async readDiagnostic(_,{deadline}){
   if(restartAt===undefined)throw Error('ops_not_started');
   // 360s bootstrap + 20s termination margin + 40s observation margin.
   for(let poll=0;poll<8;poll++){
    if(now()+45000>=deadline)throw Error('ops_poll_deadline');
    const o=await capture('serial',r.helper,deadline);
    if(typeof o.data.contents!=='string'||Buffer.byteLength(o.data.contents)>1048576)throw Error('ops_serial_shape');
    const marker=`NHM2_DISCOVERY_V1 ${attempt} END `;
    if(o.data.contents.split('\n').some(line=>line.startsWith(marker))){
     serial=o;return {serialSha256:sha(o.data.contents),observedAt:o.observedAt};
    }
    if(poll===7)break;
    if(now()+105000>=deadline)throw Error('ops_poll_reserve');
    await delay(60000);
   }
   throw Error('ops_serial_incomplete');
  },
  async validateDiagnostic({receipt},{deadline}){
   if(!serial||receipt.serialSha256!==sha(serial.data.contents))throw Error('ops_serial_binding');
   const audited=await validate({serial,attempt,helperId:history.helper.data.id,deadline});
   if(audited.diagnosticComplete===true){
    const receipt=await capture('diagnostic',r.helper,deadline),items=receipt.data;
    if(!Array.isArray(items)||items.length!==1||items[0].namespace!==`nhm2-discovery-${attempt}`||
     items[0].key!=='receipt'||typeof items[0].value!=='string'||sha(items[0].value)!==audited.transportValueSha256)
     throw Error('ops_publication_api_binding');
    return {...audited,publicationApiVerified:true};
   }
   return {...audited,publicationApiVerified:false};
  },
  async stopAndConfirm({deadline}){
   try{
    const result=await stopAndObserveRecovery({dispatch,record,expectedId:history.helper.data.id,deadline,now,
     observe:options=>capture(options.kind,options.name,options.deadline,true)});
    return {helperId:history.helper.data.id,stopped:result.stopped};
   }catch(e){e.helperId=history.helper.data.id;throw e;}
  },
 };
}
