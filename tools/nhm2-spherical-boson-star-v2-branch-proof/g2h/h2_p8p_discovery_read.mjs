// Bounded SDK read binding; no request occurs on import.
import {createHash} from 'node:crypto';
import {boundedProcess} from './h2_p8p_charter_v2_process.mjs';
import {readArgs} from './h2_p8p_hostkey_api_read.mjs';
import {proposedResources as r} from './h2_p8p_hostkey_resource_commands.mjs';
const SDK='C:/Users/dan/AppData/Local/NHM2/p8p-r22-gcloud-583.0.0/sdk/google-cloud-sdk';
export function discoveryReadPlan(kind,name,attempt){
 if(['serial','diagnostic'].includes(kind)){
  if(name!==r.helper||!/^[a-f0-9]{64}$/.test(attempt??''))throw Error('discovery_read_scope');
  return {args:['--account=pestypig@gmail.com','compute','instances',
   kind==='serial'?'get-serial-port-output':'get-guest-attributes',name,`--project=${r.project}`,`--zone=${r.zone}`,
   ...(kind==='serial'?['--port=1','--start=0']:[`--query-path=nhm2-discovery-${attempt}/`]),'--format=json'],
   cap:kind==='serial'?2097152:131072};
 }
 return {args:readArgs(kind,name),cap:kind==='instance'&&name===r.helper?262144:65536};
}

export async function readDiscovery({kind,name,attempt,deadline,record,now=Date.now,processImpl=boundedProcess,cleanup=false}){
 if(cleanup&&(kind!=='instance'||name!==r.helper))throw Error('discovery_cleanup_scope');
 const {args,cap}=discoveryReadPlan(kind,name,attempt),started=now();
 if(!Number.isFinite(deadline)||deadline-started<=20000)throw Error('discovery_read_deadline');
 let receiptFailure=null;
 let receiptDeadline=Math.min(deadline,now()+5000);
 async function persist(event){
  let timer;
  try{
   if(now()>=receiptDeadline)throw Error('read_record_deadline');
   await Promise.race([Promise.resolve().then(()=>record(event)),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('read_record_timeout')),Math.max(1,receiptDeadline-now()));})]);
   if(now()>=receiptDeadline)throw Error('read_record_late');
  }
  catch(e){if(!cleanup)throw e;receiptFailure??=String(e);}
  finally{clearTimeout(timer);}
 }
 await persist({type:'discovery_read_intent',kind,name,args,startedAt:new Date(started).toISOString()});
 if(deadline-now()<=15000)throw Error('discovery_read_admission');
 let result;
 try{
  result=await processImpl(`${SDK}/platform/bundledpython/python.exe`,['-B','-S',`${SDK}/lib/gcloud.py`,...args],{
   timeoutMs:Math.min(30000,deadline-now()-15000),killGraceMs:10000,maxBytes:cap,
   env:{...process.env,CLOUDSDK_CONFIG:'C:/Users/dan/AppData/Local/NHM2/p8p-r22-gcloud-config',CLOUDSDK_CORE_DISABLE_USAGE_REPORTING:'true',CLOUDSDK_CORE_DISABLE_PROMPTS:'1'}});
 }catch(error){
  result={stdout:error.stdout??'',stderr:error.stderr??'',exitCode:error.exitCode??null,pid:error.pid,
   terminationConfirmed:error.terminationConfirmed??false,error:String(error)};
 }
 const observedAt=new Date(now()).toISOString();
 if(now()>=deadline)throw Object.assign(Error('discovery_read_late'),{result});
 receiptDeadline=Math.min(deadline,now()+5000);
 for(const stream of ['stdout','stderr']){
  const raw=Buffer.from(result[stream]??'');if(raw.length>cap)throw Error('discovery_read_cap');
  for(let offset=0;offset<raw.length;offset+=49152){
   await persist({type:'discovery_read_bytes',kind,name,stream,offset,base64:raw.subarray(offset,offset+49152).toString('base64')});
  }
 }
 await persist({type:'discovery_read_result',kind,name,observedAt,exitCode:result.exitCode,
  pid:result.pid,error:result.error,terminationConfirmed:result.terminationConfirmed,stdoutBytes:Buffer.byteLength(result.stdout??''),
  stdoutSha256:createHash('sha256').update(result.stdout??'').digest('hex')});
 if(result.exitCode!==0||result.terminationConfirmed!==true)throw Object.assign(Error('discovery_read_process'),{result,receiptFailure});
 if(now()>=deadline&&!cleanup)throw Error('discovery_read_late');
 const data=JSON.parse(result.stdout);
 if(data===null||typeof data!=='object')throw Error('discovery_read_shape');
 return {data,observedAt,receiptFailure};
}
