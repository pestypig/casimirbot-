// Successor-only readiness adapter. Never converts a missing receipt into PASS.
import {readObservation} from './h2_p8p_hostkey_api_read.mjs';
import {proposedResources as r} from './h2_p8p_hostkey_resource_commands.mjs';
import {receiptNamespace} from './h2_p8p_receipt_namespace.mjs';

export async function readPendingReceipt(options, read=readObservation){
 const {kind,name,record,deadline,now=Date.now}=options;
 if(!['fixture','archive'].includes(kind)||name!==r.helper)throw Error('pending_read_scope');
 const namespace=receiptNamespace(kind,options.revision);
 try{return await read(options);}
 catch(error){
  const expected=`ERROR: (gcloud.compute.instances.get-guest-attributes) HTTPError 404: The resource '${namespace}/' of type 'Guest Attribute' was not found. This command is authenticated as pestypig@gmail.com which is the active account specified by the [core/account] property.`;
  // Match only the observed SDK error, exact namespace, clean process exit,
  // and fully persisted failure. Other errors retain terminal semantics.
  if(error?.message!=='process_exit_1'||error.exitCode!==1||error.terminationConfirmed!==true||
     error.stdout!==''||typeof error.stderr!=='string'||
     ![expected+'\r\n',expected+'\n'].includes(error.stderr)||error.receiptFailure||
     !Number.isFinite(deadline)||deadline-now()<=20000)throw error;
  const observedAt=new Date(now()).toISOString();let timer;
  try{await Promise.race([
   Promise.resolve().then(()=>record({type:'receipt_pending',kind,name,observedAt,
    reason:'exact_guest_attribute_namespace_absent',exitCode:error.exitCode,
    terminationConfirmed:true,stdout:error.stdout,stderr:error.stderr})),
   new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('pending_receipt_timeout')),5000);}),
  ]);}finally{clearTimeout(timer);}
  if(now()>=deadline)throw Error('pending_receipt_late');
  return {data:[],observedAt,pendingReason:'exact_guest_attribute_namespace_absent'};
 }
}
