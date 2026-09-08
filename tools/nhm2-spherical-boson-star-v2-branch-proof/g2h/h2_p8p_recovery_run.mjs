// Single-use execution entrypoint. Importing without CLI arguments does nothing.
import {readFile,lstat,open,mkdir,statfs} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {performance} from 'node:perf_hooks';
const root='C:/NHM2-CV2-Recovery-v1';
const source=import.meta.dirname;
const repo=resolve(source,'../../..');
const ledger=resolve(repo,'docs/research/nhm2-p8p-charter-v2-ledger.md');
const charter=resolve(repo,'docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-bounded-continuation-charter-v2.md');
const charterSha='8ba8456b165b7fbc3b7b76754aed272e749524cf039b19552058baaf4fb578d1';
const expiry=Date.parse('2026-09-12T14:00:00Z');
const sha=b=>createHash('sha256').update(b).digest('hex');
async function bytes(path){const s=await lstat(path);if(!s.isFile()||s.isSymbolicLink()||s.size>1048576)throw Error('input_file');return readFile(path);}
async function write(path,b){const f=await open(path,'wx');try{await f.writeFile(b);await f.sync();}finally{await f.close();}}
export async function prepareRecovery(){
 const {directArchivePackage}=await import('./h2_p8p_direct_archive_package.mjs');
 const pkg=directArchivePackage(),pending=['h2_p8p_recovery_run.mjs','h2_p8p_stored_recovery.mjs','h2_p8p_recovery_ops.mjs','h2_p8p_recovery_sdk_operation.mjs','h2_p8p_direct_archive_package.mjs',...pkg.manifest.map(x=>x.name)],seen=new Set(),files=[];
 while(pending.length){
  const name=pending.pop();if(seen.has(name))continue;seen.add(name);
  if(!/^h2_p8p_[a-z0-9_]+\.(mjs|py)$/.test(name))throw Error('inventory_name');
  const b=await bytes(resolve(source,name));files.push({name,bytes:b.length,sha256:sha(b)});
  if(name.endsWith('.mjs'))for(const m of b.toString().matchAll(/['"]\.\/(h2_p8p_[a-z0-9_]+\.mjs)['"]/g))pending.push(m[1]);
 }
 files.sort((a,b)=>a.name.localeCompare(b.name));
 if(sha(await bytes(charter))!==charterSha)throw Error('charter_hash');
 const manifest={schema:'nhm2-direct-recovery-execution-v1',root,files,ledgerSha256:sha(await bytes(ledger)),charterSha256:charterSha,
  startupSha256:pkg.startupSha256,startupBytes:Buffer.byteLength(pkg.startup),attemptId:pkg.attemptId,
  reservationUsd:0.50,reservationSeconds:3600,priorReservedUsd:0.10,priorReservedSeconds:1200,
  aggregateUsd:12,aggregateSeconds:21600,expiry:new Date(expiry).toISOString()};
 const fs=await statfs(dirname(root),{bigint:true});if(fs.bavail*fs.bsize<1073741824n)throw Error('preparation_capacity');
 await mkdir(root);await write(`${root}/startup.sh`,pkg.startup);
 const encoded=Buffer.from(JSON.stringify(manifest,null,2)+'\n');await write(`${root}/manifest.json`,encoded);
 return {root,manifestSha256:sha(encoded),sourceFiles:files.length};
}
export async function executeRecovery(expectedSha){
 if(!/^[a-f0-9]{64}$/.test(expectedSha??''))throw Error('manifest_argument');
 const raw=await bytes(`${root}/manifest.json`);if(sha(raw)!==expectedSha)throw Error('manifest_hash');
 const m=JSON.parse(raw);
 if(m.schema!=='nhm2-direct-recovery-execution-v1'||m.root!==root||m.reservationUsd!==.5||m.reservationSeconds!==3600||m.priorReservedUsd!==.1||m.priorReservedSeconds!==1200||m.aggregateUsd!==12||m.aggregateSeconds!==21600||Date.parse(m.expiry)!==expiry)throw Error('budget_manifest');
 if(sha(await bytes(charter))!==charterSha||m.charterSha256!==charterSha||sha(await bytes(ledger))!==m.ledgerSha256)throw Error('authority_baseline_changed');
 if(!Array.isArray(m.files)||m.files.length<8||m.files.length>64||new Set(m.files.map(f=>f.name)).size!==m.files.length)throw Error('manifest_inventory');
 for(const f of m.files){
  if(!/^h2_p8p_[a-z0-9_]+\.(mjs|py)$/.test(f.name))throw Error('manifest_path');
  const b=await bytes(resolve(source,f.name));if(b.length!==f.bytes||sha(b)!==f.sha256)throw Error('source_changed');
 }
 const startup=await bytes(`${root}/startup.sh`);if(startup.length!==m.startupBytes||sha(startup)!==m.startupSha256)throw Error('startup_changed');
 const startedAt=Date.now(),monotonicStart=performance.now(),now=()=>startedAt+Math.floor(performance.now()-monotonicStart);
 const deadline=startedAt+3600000;if(deadline>=expiry)throw Error('charter_expiry');
 const [{runStoredRecovery},{recoveryOperations},{recoverySdkOperations}]=await Promise.all([
  import('./h2_p8p_stored_recovery.mjs'),import('./h2_p8p_recovery_ops.mjs'),import('./h2_p8p_recovery_sdk_operation.mjs')]);
 // Exclusive store is the attempt latch. Never use another root on failure.
 const result=await runStoredRecovery({root:`${root}/evidence`,now,deadline,
  makeOps:({record})=>{
   const dispatch=recoverySdkOperations({record,now,startupPath:`${root}/startup.sh`,startupSha256:m.startupSha256});
   const ops=recoveryOperations({dispatch,record,now,attemptId:m.attemptId,startupSha256:m.startupSha256,startedAt});
   const preflight=ops.preflight;
   ops.preflight=async(input,context)=>{
    await record({type:'reservation',manifestSha256:expectedSha,reservedUsd:.50,reservedSeconds:3600,
     aggregateRemainingUsd:11.40,aggregateRemainingSeconds:16800,startedAt:new Date(startedAt).toISOString(),deadline:new Date(deadline).toISOString()});
    return preflight(input,context);
   };return ops;
  }});
 return result;
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 if(process.argv[2]==='prepare'&&process.argv.length===3)console.log(JSON.stringify(await prepareRecovery()));
 else if(process.argv[2]==='execute'&&process.argv.length===4)console.log(JSON.stringify(await executeRecovery(process.argv[3])));
 else throw Error('exact_prepare_or_execute_invocation_required');
}
