// Read-only API investigation; never invokes SSH or changes cloud/trust state.
import { writeFileSync } from 'node:fs';
import { boundedProcess } from './h2_p8p_charter_v2_process.mjs';
const sdk='C:/Users/dan/AppData/Local/NHM2/p8p-r22-gcloud-583.0.0/sdk/google-cloud-sdk';
const receipt={at:new Date().toISOString(),reads:[]};
async function read(args) {
  try {
    const r=await boundedProcess(`${sdk}/platform/bundledpython/python.exe`,['-B','-S',`${sdk}/lib/gcloud.py`,...args],{timeoutMs:30000,maxBytes:65536,env:{...process.env,CLOUDSDK_CONFIG:'C:/Users/dan/AppData/Local/NHM2/p8p-r22-gcloud-config',CLOUDSDK_CORE_DISABLE_USAGE_REPORTING:'true',CLOUDSDK_CORE_DISABLE_PROMPTS:'1'}});
    receipt.reads.push({args,...r}); return r.stdout.trim();
  } catch(e) { receipt.reads.push({args,error:String(e),stdout:e.stdout,stderr:e.stderr}); throw e; }
}
try {
  const account=await read(['auth','list','--filter=status:ACTIVE','--format=value(account)']);
  if(account!=='pestypig@gmail.com')throw Error('account_mismatch');
  for(const [name,id] of [['nhm2-h2-p8p-r39-rescue-e2-small-20260904','7129462452423922626'],['nhm2-h2-p8p-r32-e2-4-20260904','1893159507643031574']]) {
    const v=JSON.parse(await read(['compute','instances','describe',name,'--project=dark-stratum-455714-h4','--zone=us-east1-b','--format=json(id,name,status)']));
    if(v.id!==id||v.name!==name||v.status!=='TERMINATED')throw Error('instance_guard_failed');
  }
  receipt.hostkeys=JSON.parse(await read(['compute','instances','get-guest-attributes','nhm2-h2-p8p-r39-rescue-e2-small-20260904','--project=dark-stratum-455714-h4','--zone=us-east1-b','--query-path=hostkeys/','--format=json']));
}catch(e){receipt.failure=String(e);}
receipt.finishedAt=new Date().toISOString();
writeFileSync('artifacts/nhm2/g2h-e-s5/candidate-neutral/charter-v2-hostkey-readonly-v1.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(receipt,null,2));
