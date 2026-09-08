// Unbound one-shot mutation adapter. No cloud operation on import/construction.
import {readFileSync,lstatSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {boundedProcess} from './h2_p8p_charter_v2_process.mjs';
import {proposedResources as r} from './h2_p8p_hostkey_resource_commands.mjs';
export const discoveryStartupPath='C:/NHM2-Discovery-v1/startup.sh';
const SDK='C:/Users/dan/AppData/Local/NHM2/p8p-r22-gcloud-583.0.0/sdk/google-cloud-sdk';
export function discoveryCommand(action){
 const args=['--account=pestypig@gmail.com',`--project=${r.project}`,'--quiet','compute','instances'];
 if(!['startup','restart','stop'].includes(action))throw Error('discovery_command_scope');
 args.push({startup:'add-metadata',restart:'start',stop:'stop'}[action],r.helper,`--zone=${r.zone}`);
 if(action==='startup')args.push(`--metadata-from-file=startup-script=${discoveryStartupPath}`);
 args.push('--format=json');return args;
}
export function discoveryCommands({startupSha256,record,now=Date.now,processImpl=boundedProcess}){
 if(!/^[a-f0-9]{64}$/.test(startupSha256??'')||typeof record!=='function')throw Error('discovery_command_arguments');
 const consumed=new Set();
 return async function dispatch(action,{deadline}){
  const args=discoveryCommand(action);
  if(consumed.has(action))throw Error('discovery_command_consumed');
  if(!Number.isFinite(deadline)||deadline-now()<=25000)throw Error('discovery_command_deadline');
  if(action==='startup'){
   const s=lstatSync(discoveryStartupPath);
   if(!s.isFile()||s.isSymbolicLink()||s.size>200000)throw Error('discovery_startup_file');
   const raw=readFileSync(discoveryStartupPath);
   if(raw.length!==s.size||createHash('sha256').update(raw).digest('hex')!==startupSha256)throw Error('discovery_startup_hash');
  }
  consumed.add(action);
  let receiptFailure=null;
  let receiptDeadline=Math.min(deadline,now()+5000);
  async function persist(value){
   let timer;
   try{
    if(now()>=receiptDeadline)throw Error('command_record_deadline');
    await Promise.race([Promise.resolve().then(()=>record(value)),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('command_record_timeout')),Math.max(1,receiptDeadline-now()));})]);
    if(now()>=receiptDeadline)throw Error('command_record_late');
   }
   catch(e){if(action!=='stop')throw e;receiptFailure??=String(e);}
   finally{clearTimeout(timer);}
  }
  await persist({type:'discovery_operation_intent',action,args,at:new Date(now()).toISOString()});
  if(deadline-now()<=15000)throw Error('discovery_command_late_admission');
  let result;
  try{
   result=await processImpl(`${SDK}/platform/bundledpython/python.exe`,['-B','-S',`${SDK}/lib/gcloud.py`,...args],{
    timeoutMs:Math.min(120000,deadline-now()-15000),killGraceMs:10000,maxBytes:262144,
    env:{...process.env,CLOUDSDK_CONFIG:'C:/Users/dan/AppData/Local/NHM2/p8p-r22-gcloud-config',CLOUDSDK_CORE_DISABLE_USAGE_REPORTING:'true',CLOUDSDK_CORE_DISABLE_PROMPTS:'1'}});
  }catch(error){result={stdout:error.stdout??'',stderr:error.stderr??'',exitCode:error.exitCode??null,pid:error.pid,terminationConfirmed:error.terminationConfirmed??false,error:String(error)};}
  receiptDeadline=Math.min(deadline,now()+5000);
  // Mutation replies can include the large startup. Record only bounded chunks.
  for(const stream of ['stdout','stderr']){
   const raw=Buffer.from(result[stream]??'');if(raw.length>262144)throw Error('command_output_cap');
   for(let offset=0;offset<raw.length;offset+=49152){
    if(now()>=deadline)throw Object.assign(Error('command_evidence_deadline'),{result});
    await persist({type:'discovery_operation_bytes',action,stream,offset,base64:raw.subarray(offset,offset+49152).toString('base64')});
   }
  }
  await persist({type:'discovery_operation_result',action,exitCode:result.exitCode,pid:result.pid,
   terminationConfirmed:result.terminationConfirmed,error:result.error,receiptFailure,at:new Date(now()).toISOString()});
  if(result.exitCode!==0||result.terminationConfirmed!==true||now()>=deadline||receiptFailure)throw Object.assign(Error('discovery_operation_failed'),{result,receiptFailure});
  return {dispatched:true}; // Identity must be independently described.
 };
}
