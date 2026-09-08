// Read-only adapter. No create/start/attach/SSH methods exist here.
import { boundedProcess } from './h2_p8p_charter_v2_process.mjs';
import {proposedResources} from './h2_p8p_hostkey_resource_commands.mjs';
import {receiptNamespace} from './h2_p8p_receipt_namespace.mjs';
const SDK='C:/Users/dan/AppData/Local/NHM2/p8p-r22-gcloud-583.0.0/sdk/google-cloud-sdk';
const PROJECT='dark-stratum-455714-h4', ZONE='us-east1-b';
const fields={
  instance:'id,name,selfLink,status,zone,machineType,disks,creationTimestamp,lastStartTimestamp,lastStopTimestamp,metadata,serviceAccounts,scheduling',
  disk:'id,name,selfLink,status,sizeGb,type,users,sourceImage,sourceImageId,sourceSnapshot,sourceSnapshotId,creationTimestamp',
  snapshot:'id,name,selfLink,status,snapshotType,sourceDisk,sourceDiskId,creationTimestamp,storageLocations',
};
export function readArgs(kind,name,revision='original'){
  if(revision!=='original'&&(!['fixture','archive'].includes(kind)||name!==proposedResources.helper))throw Error('read_revision_scope');
  if(['account','configuration','projectMetadata'].includes(kind)){
    if(name!==PROJECT)throw Error('admission_project');
    if(kind==='account')return ['auth','list','--filter=status:ACTIVE','--format=json(account,status)'];
    if(kind==='configuration')return ['config','list','--format=json(core.account,core.project)'];
    return ['--account=pestypig@gmail.com','compute','project-info','describe',`--project=${PROJECT}`,'--format=json(name,commonInstanceMetadata.items[].key)'];
  }
  if(typeof name!=='string'||!/^nhm2-[a-z0-9-]{1,57}$/.test(name))throw Error('resource_name');
  const args=['--account=pestypig@gmail.com','compute'];
  const inventories={absent_instance:'instances',absent_disk:'disks',absent_snapshot:'snapshots'};
  if(Object.hasOwn(inventories,kind))return [...args,inventories[kind],'list',`--project=${PROJECT}`,
    `--filter=name=${name}`,'--format=json(id,name,selfLink)'];
  if(['hostkeys','archive','fixture'].includes(kind))return [...args,'instances','get-guest-attributes',name,`--project=${PROJECT}`,`--zone=${ZONE}`,`--query-path=${kind==='hostkeys'?'nhm2-hostkey':receiptNamespace(kind,revision)}/`,'--format=json'];
  if(!Object.hasOwn(fields,kind))throw Error('readonly_operation');
  args.push({instance:'instances',disk:'disks',snapshot:'snapshots'}[kind],'describe',name,`--project=${PROJECT}`);
  if(kind!=='snapshot')args.push(`--zone=${ZONE}`);
  args.push(`--format=json(${fields[kind]})`);
  return args;
}
export function readObservation(options){return runRead(options,false);}
export function readCleanupObservation(options){
  if(options.kind!=='instance'||options.name!==proposedResources.helper)throw Error('cleanup_read_scope');
  return runRead(options,true);
}
async function runRead({kind,name,revision='original',deadline,record,now=Date.now,processImpl=boundedProcess},cleanup){
  const args=readArgs(kind,name,revision), startedAt=now();
  const responseCap=kind==='instance'&&name===proposedResources.helper?131072:65536;
  if(!Number.isFinite(deadline)||deadline-startedAt<=20000)throw Error('read_deadline');
  async function receipt(value){
    let timer;
    try{await Promise.race([Promise.resolve().then(()=>record(value)),new Promise((_,reject)=>{
      timer=setTimeout(()=>reject(Error('read_receipt_timeout')),5000);
    })]);}finally{clearTimeout(timer);}
  }
  const request={kind,name,args,startedAt:new Date(startedAt).toISOString()};
  // The controller supplies a bounded exclusive-write recorder. Successful
  // reads are unusable if receipt persistence fails.
  let receiptFailure=null;
  try{await receipt({type:'read_intent',...request});}
  catch(error){if(!cleanup)throw error;receiptFailure=String(error);}
  let result,resultReceiptAttempted=false;
  try{
    if(deadline-now()<=15000)throw Error('read_deadline_after_receipt');
    result=await processImpl(`${SDK}/platform/bundledpython/python.exe`,['-B','-S',`${SDK}/lib/gcloud.py`,...args],{
      timeoutMs:Math.min(30000,deadline-now()-15000),killGraceMs:10000,maxBytes:responseCap,
      env:{...process.env,CLOUDSDK_CONFIG:'C:/Users/dan/AppData/Local/NHM2/p8p-r22-gcloud-config',
        CLOUDSDK_CORE_DISABLE_USAGE_REPORTING:'true',CLOUDSDK_CORE_DISABLE_PROMPTS:'1'},
    });
    if(result.exitCode!==0||result.terminationConfirmed!==true)throw Error('read_process_unconfirmed');
    if(Buffer.byteLength(result.stdout,'utf8')>responseCap)throw Error('read_response_limit');
    const data=JSON.parse(result.stdout);
    const listKind=['account','hostkeys','archive','fixture','absent_instance','absent_disk','absent_snapshot'].includes(kind);
    if(data===null||typeof data!=='object'||(!listKind&&Array.isArray(data))||(listKind&&!Array.isArray(data)))throw Error('read_response_shape');
    if(now()>=deadline)throw Error('read_finished_late');
    resultReceiptAttempted=true;
    const observedAt=new Date(now()).toISOString();
    try{await receipt({type:'read_result',...request,finishedAt:observedAt,...result});}
    catch(error){if(!cleanup)throw error;receiptFailure??=String(error);}
    if(now()>=deadline)throw Error('read_record_finished_late');
    return {data,observedAt,...(cleanup?{receiptFailure}: {})};
  }catch(error){
    if(!resultReceiptAttempted){try{await receipt({type:'read_failure',...request,error:String(error),result,
      stderr:error.stderr,stdout:error.stdout,pid:error.pid,terminationConfirmed:error.terminationConfirmed});}
    catch(recordError){error.receiptFailure=String(recordError);}}
    error.result??=result;
    throw error;
  }
}
