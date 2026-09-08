// Inert until explicit main entry. First charter retrieval only, never a retry.
import { resolve } from 'node:path';
import { lstatSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';
import { boundedProcess } from './h2_p8p_charter_v2_process.mjs';
import { plinkArgs, commandFile } from './h2_p8p_charter_v2_plink_args.mjs';
import { cappedSink } from './h2_p8p_charter_v2_capped_sink.mjs';
import { validateRetainedInstances } from './h2_p8p_r43_resource_guard.mjs';
import { localStore } from './h2_p8p_r42_local_io.mjs';
const repo = resolve(import.meta.dirname,'../../..');
const sdk = 'C:/Users/dan/AppData/Local/NHM2/p8p-r22-gcloud-583.0.0/sdk/google-cloud-sdk';
const helper = 'nhm2-h2-p8p-r39-rescue-e2-small-20260904';
const original = 'nhm2-h2-p8p-r32-e2-4-20260904';
const project = '--project=dark-stratum-455714-h4', zone = '--zone=us-east1-b';
const base = 'https://www.googleapis.com/compute/v1/projects/dark-stratum-455714-h4/zones/us-east1-b';
const plink = `${sdk}/bin/sdk/plink.exe`;
export function startupGuard(h,p,d) {
  if (!h.metadata || typeof h.metadata.fingerprint!=='string' ||
      (h.metadata.items!==undefined && (!Array.isArray(h.metadata.items)||h.metadata.items.length)) ||
      p.name!=='dark-stratum-455714-h4' || !Array.isArray(p.commonInstanceMetadata?.items) ||
      p.commonInstanceMetadata.items.length!==1 || p.commonInstanceMetadata.items[0].key!=='ssh-keys') throw new Error('unexpected_startup_metadata');
  if (d.id !== '1064813028101755842' || d.name !== helper || d.sizeGb !== '10' || d.type !== `${base}/diskTypes/pd-standard` ||
      d.sourceImage !== 'https://www.googleapis.com/compute/v1/projects/debian-cloud/global/images/debian-12-bookworm-v20260817' ||
      d.creationTimestamp !== '2026-09-04T13:42:21.741-07:00' || d.status !== 'READY' ||
      JSON.stringify(d.users) !== JSON.stringify([`${base}/instances/${helper}`])) throw new Error('boot_lineage_mismatch');
}
export async function runRetrieval(testOnly = {}) {
  const store = testOnly.store ?? localStore('C:/NHM2-CV2-R1',resolve(repo,'artifacts/nhm2/g2h-e-s5/candidate-neutral/charter-v2-retrieval-1'),'C:/');
  const run=testOnly.run??boundedProcess, wait=testOnly.wait??(ms=>new Promise(r=>setTimeout(r,ms)));
  let sequence=0, startAt=null, startMono=null, failure=null, stopConfirmed=false, verified=false, cleanup=false, receiptFailure=null;
  const unresolvedProcesses=[];
  const env={...process.env,CLOUDSDK_CONFIG:'C:/Users/dan/AppData/Local/NHM2/p8p-r22-gcloud-config',CLOUDSDK_CORE_DISABLE_USAGE_REPORTING:'true',CLOUDSDK_CORE_DISABLE_PROMPTS:'1'};
  const record=(kind,data)=>{
    try {store.receipt(`${String(++sequence).padStart(3,'0')}-${kind}.json`,{utc:new Date().toISOString(),...data});}
    catch(e){receiptFailure=e.message;console.error(JSON.stringify({kind,receiptFailure}));if(!cleanup)throw e;}
  };
  const budget=()=>{if(Date.now()>=Date.parse('2026-09-12T14:00:00Z')) throw new Error('charter_expired');};
  async function command(exe,args,timeoutMs=30000,signal,onStdout) {
    if(!cleanup)budget();
    if(startMono!==null&&!cleanup){timeoutMs=Math.min(timeoutMs,900000-(performance.now()-startMono));if(timeoutMs<=0)throw new Error('operation_deadline');}
    record('dispatch',{exe,args});
    try {const r=await run(exe,args,{timeoutMs,env,signal,onStdout});record('return',r);return r.stdout.trim();}
    catch(e){if(e.terminationConfirmed===false)unresolvedProcesses.push({pid:e.pid,message:e.message});record('failure',{message:e.message,pid:e.pid,terminationConfirmed:e.terminationConfirmed,stdout:e.stdout,stderr:e.stderr});throw e;}
  }
  const gc=(args,ms)=>command(`${sdk}/platform/bundledpython/python.exe`,['-B','-S',`${sdk}/lib/gcloud.py`,...args],ms);
  const describe=(name)=>gc(['compute','instances','describe',name,project,zone,'--format=json'],cleanup?20000:30000).then(JSON.parse);
  const authenticateFile=testOnly.authenticateFile??((path,sha)=>{const s=lstatSync(path);if(!s.isFile()||s.isSymbolicLink()||createHash('sha256').update(readFileSync(path)).digest('hex')!==sha) throw new Error('file_identity');});
  if(store.freeBytes()<1024**3)throw new Error('capacity');
  store.prepare();
  try {
    budget();
    authenticateFile(resolve(repo,'docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-bounded-continuation-charter-v2.md'),'8ba8456b165b7fbc3b7b76754aed272e749524cf039b19552058baaf4fb578d1');
    // Frozen zero-use ledger baseline; any later entry blocks this first-attempt controller.
    authenticateFile(resolve(repo,'docs/research/nhm2-p8p-charter-v2-ledger.md'),'8da8e2ed879c111f6c216626293c55b6456e49ff178c6cf02cb524a1d366dcc6');
    authenticateFile(plink,'7308e9d356f14aa1f08cab1af363f71a077bf35dcb49e50b363418044758cd1e');
    authenticateFile(commandFile,'05ac2cfe25a2d30a58eb07edca035ec0ca0250ab3c39134307254bbb40da7452');
    const key=lstatSync('C:/Users/dan/.ssh/google_compute_engine.ppk');if(!key.isFile()||key.isSymbolicLink())throw new Error('existing_key_absent');
    authenticateFile('C:/Users/dan/.ssh/google_compute_engine.ppk','49b8ce889acf25128235f22008522bce9751eac951be3f7fbf96a25450cb8f6f');
    if(await gc(['auth','list','--filter=status:ACTIVE','--format=value(account)'])!=='pestypig@gmail.com')throw new Error('account');
    const o=await describe(original),h=await describe(helper);validateRetainedInstances(o,h);
    // Suppress public-key values in our receipt by asking API projection for keys only.
    const p=JSON.parse(await gc(['compute','project-info','describe',project,'--format=json(name,commonInstanceMetadata.items.key)']));
    const d=JSON.parse(await gc(['compute','disks','describe',helper,project,zone,'--format=json']));startupGuard(h,p,d);
    if(store.freeBytes()<1024**3)throw new Error('capacity');
    if(Date.now()+1200000>Date.parse('2026-09-12T14:00:00Z'))throw new Error('insufficient_charter_window');
    // First attempt reservation is exclusive and charged conservatively in full.
    record('reservation',{attempt:1,maxSeconds:1200,reservedUsd:0.10,aggregateSecondsRemaining:20400,aggregateUsdRemaining:11.90});
    startAt=Date.now();
    startMono=performance.now();
    await gc(['compute','instances','start',helper,project,zone,'--quiet'],120000);
    await wait(120000);
    const running=await describe(helper);
    if(running.id!=='7129462452423922626'||running.status!=='RUNNING')throw new Error('running_identity');
    validateRetainedInstances(o,{...running,status:'TERMINATED'});
    const ips=(running.networkInterfaces??[]).flatMap(n=>(n.accessConfigs??[]).map(a=>a.natIP).filter(Boolean));
    if(ips.length!==1)throw new Error('ambiguous_ip');
    if(Date.now()-startAt>900000||store.freeBytes()<1024**3)throw new Error('pretransfer_budget');
    const abort=new AbortController();let sizeFailure=null;
    const sink=(testOnly.sinkFactory??cappedSink)(store.download,12122);
    const monitor=setInterval(()=>{
      try {if(store.freeBytes()<1024**3)throw new Error('transfer_capacity');
        try {if(lstatSync(store.download).size>12122)throw new Error('oversize_archive');}catch(e){if(e.code!=='ENOENT')throw e;}
      }catch(e){sizeFailure=e.message;abort.abort();}
    },100);
    try {await command(plink,plinkArgs(ips[0]),120000,abort.signal,chunk=>sink.accept(chunk));sink.finish();}
    finally {clearInterval(monitor);sink.closePartial();}
    if(sizeFailure)throw new Error(sizeFailure);
    const a=store.inspectArchive();if(a.bytes!==12122||a.sha256!=='73029fde08f14f9fcd01490c4e5d5bc188213eaa2f9a8d857eb5e456b86d0922')throw new Error('archive_identity');
    store.publish();if(JSON.stringify(store.inspectPublished())!==JSON.stringify(a))throw new Error('published_identity');verified=true;
  } catch(e){failure=e.message;cleanup=true;record('terminal_failure',{failure});}
  finally {
    cleanup=true;
    if(startAt!==null){
      for(let n=0;n<3&&!stopConfirmed;n++){
        try {await gc(['compute','instances','stop',helper,project,zone,'--quiet'],40000);}catch(e){record('stop_error',{error:e.message});}
        try {const s=await describe(helper);stopConfirmed=s.id==='7129462452423922626'&&s.status==='TERMINATED';}catch(e){record('status_error',{error:e.message});}
      }
    }
    const result={verified,stopConfirmed,startAttempted:startAt!==null,failure,receiptFailure,unresolvedProcesses,pass:verified&&stopConfirmed&&!failure&&!receiptFailure&&!unresolvedProcesses.length,runtimeMs:startAt===null?0:Date.now()-startAt};
    console.log(JSON.stringify(result));record('result',result);
    if(receiptFailure){result.receiptFailure=receiptFailure;result.pass=false;console.error(JSON.stringify(result));}
    return result;
  }
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  if(process.argv.length!==3||process.argv[2]!=='--execute-once')throw new Error('explicit_entry_required');
  const manifest=JSON.parse(readFileSync(resolve(import.meta.dirname,'h2_p8p_charter_v2_retrieval_manifest.json'),'utf8'));
  for(const [name,expected] of Object.entries(manifest.files)){
    if(!/^h2_p8p_[a-z0-9_]+\.mjs$/.test(name))throw new Error('manifest_path');
    const bytes=readFileSync(resolve(import.meta.dirname,name));
    if(bytes.length!==expected.bytes||createHash('sha256').update(bytes).digest('hex')!==expected.sha256)throw new Error('manifest_identity');
  }
  await runRetrieval();
}
