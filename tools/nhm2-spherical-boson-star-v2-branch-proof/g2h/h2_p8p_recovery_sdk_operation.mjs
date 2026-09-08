// Unbound SDK operation adapter: no CLI entrypoint and no call on import.
// A separately approved manifest and composed identity/budget preflight are
// required before connecting this to the recovery controller.
import {lstatSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {boundedProcess} from './h2_p8p_charter_v2_process.mjs';
import {resourceCommand} from './h2_p8p_hostkey_resource_commands.mjs';
import {retainedResourceCommand} from './h2_p8p_retained_commands.mjs';
const SDK='C:/Users/dan/AppData/Local/NHM2/p8p-r22-gcloud-583.0.0/sdk/google-cloud-sdk';
export function recoverySdkOperations(options){return sdkOperations(options,false);}
export function retainedSdkOperations(options){return sdkOperations(options,true);}
function sdkOperations({record, startupPath, startupSha256,
 now=Date.now, processImpl=boundedProcess},retained){
 if(typeof record!=='function')throw Error('recorder_required');
 if(!/^[a-f0-9]{64}$/.test(startupSha256??''))throw Error('startup_digest');
 // Validate path grammar before constructing an adapter; do not access cloud.
 const command=retained?retainedResourceCommand:resourceCommand;
 command(retained?'startup':'helper',{startupPath});
 const consumed=new Set();
 async function receipt(value){
  let timer;
  try {await Promise.race([Promise.resolve().then(()=>record(value)),new Promise((_,reject)=>{
   timer=setTimeout(()=>reject(Error('operation_receipt_timeout')),5000);
  })]);}finally{clearTimeout(timer);}
 }
 return async function dispatch(action,{deadline}){
  const args=command(action,{startupPath});
  const responseCap=retained||['helper','attach','stop'].includes(action)?131072:65536;
  if(consumed.has(action))throw Error('operation_already_consumed');
  if(!Number.isFinite(deadline)||deadline-now()<=20000)throw Error('operation_deadline');
  if(action===(retained?'startup':'helper')){
   const st=lstatSync(startupPath);
   if(!st.isFile()||st.isSymbolicLink()||st.size>200000)throw Error('startup_file');
   const bytes=readFileSync(startupPath);
   if(createHash('sha256').update(bytes).digest('hex')!==startupSha256)throw Error('startup_hash');
  }
  // Consume before awaiting recorder: concurrent calls cannot duplicate a
  // dispatched or ambiguous operation. No automatic retry exists here.
  consumed.add(action);
  let receiptFailure=null;
  try{await receipt({type:'operation_intent',action,args,at:new Date(now()).toISOString()});}
  catch(error){if(action!=='stop')throw error;receiptFailure=String(error);}
  let result;
  let resultReceiptAttempted=false;
  try{
   const remaining=deadline-now()-15000;
   if(remaining<=0)throw Error('operation_deadline_after_receipt');
   result=await processImpl(`${SDK}/platform/bundledpython/python.exe`,
    ['-B','-S',`${SDK}/lib/gcloud.py`,...args],{
     timeoutMs:Math.min(120000,remaining),killGraceMs:10000,maxBytes:responseCap,
     env:{...process.env,CLOUDSDK_CONFIG:'C:/Users/dan/AppData/Local/NHM2/p8p-r22-gcloud-config',
      CLOUDSDK_CORE_DISABLE_USAGE_REPORTING:'true',CLOUDSDK_CORE_DISABLE_PROMPTS:'1'},
    });
   if(result.exitCode!==0||result.terminationConfirmed!==true)throw Error('operation_process_unconfirmed');
   if(Buffer.byteLength(result.stdout)>responseCap)throw Error('operation_output_cap');
   if(now()>=deadline)throw Error('operation_finished_late');
   const data=JSON.parse(result.stdout);
   if(data===null||typeof data!=='object')throw Error('operation_response_shape');
   resultReceiptAttempted=true;
   await receipt({type:'operation_result',action,result,receiptFailure,at:new Date(now()).toISOString()});
   if(receiptFailure)throw Object.assign(Error('stop_evidence_incomplete'),{receiptFailure,result});
   // Creation output is an observation, not authenticated resource identity.
   // The controller must independently describe and validate the resource.
   return data;
  }catch(error){
   // Never replace the process failure with a recorder failure, and never
   // spend a second record timeout after a result-record attempt.
   if(!resultReceiptAttempted){try{await receipt({type:'operation_failure',action,error:String(error),result,
    stdout:error.stdout,stderr:error.stderr,pid:error.pid,terminationConfirmed:error.terminationConfirmed,
    at:new Date(now()).toISOString()});}catch(recordError){error.receiptFailure=String(recordError);}}
   if(receiptFailure)error.receiptFailure??=receiptFailure;
   error.result??=result;
   throw error;
  }
 };
}
