// Explicit read-only SDK inventory. No start, SCP, SSH, key or metadata writes.
import { boundedProcess } from './h2_p8p_charter_v2_process.mjs';
const sdk = 'C:/Users/dan/AppData/Local/NHM2/p8p-r22-gcloud-583.0.0/sdk/google-cloud-sdk';
const project = '--project=dark-stratum-455714-h4', zone = '--zone=us-east1-b';
const helper = 'nhm2-h2-p8p-r39-rescue-e2-small-20260904';
async function read(args) {
  const r = await boundedProcess(`${sdk}/platform/bundledpython/python.exe`, ['-B','-S',`${sdk}/lib/gcloud.py`,...args],
    {timeoutMs:30000,env:{...process.env,CLOUDSDK_CONFIG:'C:/Users/dan/AppData/Local/NHM2/p8p-r22-gcloud-config',CLOUDSDK_CORE_DISABLE_USAGE_REPORTING:'true',CLOUDSDK_CORE_DISABLE_PROMPTS:'1'}});
  return r.stdout.trim();
}
function metadata(m) { return { fingerprint:m?.fingerprint, keys:(m?.items??[]).map(x=>x.key).sort() }; }
const account = await read(['auth','list','--filter=status:ACTIVE','--format=value(account)']);
if (account !== 'pestypig@gmail.com') throw new Error('account_mismatch');
const h = JSON.parse(await read(['compute','instances','describe',helper,project,zone,'--format=json']));
const o = JSON.parse(await read(['compute','instances','describe','nhm2-h2-p8p-r32-e2-4-20260904',project,zone,'--format=json']));
const p = JSON.parse(await read(['compute','project-info','describe',project,'--format=json']));
const d = JSON.parse(await read(['compute','disks','describe',helper,project,zone,'--format=json']));
console.log(JSON.stringify({at:new Date().toISOString(),account,
  helper:{id:h.id,name:h.name,status:h.status,zone:h.zone,machineType:h.machineType,creationTimestamp:h.creationTimestamp,metadata:metadata(h.metadata),disks:h.disks},
  original:{id:o.id,name:o.name,status:o.status},
  projectMetadata:metadata(p.commonInstanceMetadata),
  boot:{id:d.id,name:d.name,sizeGb:d.sizeGb,type:d.type,sourceImage:d.sourceImage,creationTimestamp:d.creationTimestamp,status:d.status,users:d.users}},null,2));
