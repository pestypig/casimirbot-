import {writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {boundedProcess} from './h2_p8p_charter_v2_process.mjs';
const sdk='C:/Users/dan/AppData/Local/NHM2/p8p-r22-gcloud-583.0.0/sdk/google-cloud-sdk';
const args=['compute','instances','get-serial-port-output','nhm2-h2-p8p-r39-rescue-e2-small-20260904','--project=dark-stratum-455714-h4','--zone=us-east1-b','--port=1','--start=0','--format=json'];
const receipt={at:new Date().toISOString(),args};
try {
 const r=await boundedProcess(`${sdk}/platform/bundledpython/python.exe`,['-B','-S',`${sdk}/lib/gcloud.py`,...args],{timeoutMs:30000,maxBytes:2097152,env:{...process.env,CLOUDSDK_CONFIG:'C:/Users/dan/AppData/Local/NHM2/p8p-r22-gcloud-config',CLOUDSDK_CORE_DISABLE_USAGE_REPORTING:'true',CLOUDSDK_CORE_DISABLE_PROMPTS:'1'}});
 const data=JSON.parse(r.stdout);
 receipt.start=data.start;receipt.next=data.next;
 receipt.responseSha256=createHash('sha256').update(r.stdout).digest('hex');
 receipt.matches=(data.contents??'').split(/\r?\n/).filter(x=>/SHA256:|SSH HOST KEY|host.key.*fingerprint/i.test(x)).slice(0,100);
 receipt.terminationConfirmed=r.terminationConfirmed;
}catch(e){receipt.failure=String(e);receipt.stderr=e.stderr;}
writeFileSync('artifacts/nhm2/g2h-e-s5/candidate-neutral/charter-v2-serial-hostkey-readonly-v1.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(receipt,null,2));
