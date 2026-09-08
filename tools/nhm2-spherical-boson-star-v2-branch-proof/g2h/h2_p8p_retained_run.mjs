// Explicit one-use retained recovery runner. Imports alone perform no action.
import {readFile,lstat,open,mkdir,statfs} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {performance} from 'node:perf_hooks';
const source=import.meta.dirname,repo=resolve(source,'../../..');
const ledger=resolve(repo,'docs/research/nhm2-p8p-charter-v2-ledger.md');
const charter=resolve(repo,'docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-bounded-continuation-charter-v2.md');
const charterSha='8ba8456b165b7fbc3b7b76754aed272e749524cf039b19552058baaf4fb578d1';
const tail='fae10aa83389b1c801642950a7a29bec42e887639214c6e8395e8e7ed8ff1272';
const expiry=Date.parse('2026-09-12T14:00:00Z');
const secondTail='703e08f6a8addc38a14bf1b16ab7357cddad7c5effcc54ced03f159bcc7db79f';
function settings(revision){
 if(!['retained-helper-v1','retained-helper-v2'].includes(revision))throw Error('runner_revision');
 const v2=revision==='retained-helper-v2';
 return {root:v2?'C:/NHM2-CV2-Retained-v2':'C:/NHM2-CV2-Retained-v1',
  priorUsd:v2?1.10:.60,priorSeconds:v2?8400:4800,remainingUsd:v2?10.40:10.90,
  remainingSeconds:v2?9600:13200,secondTail:v2?secondTail:null};
}
async function historyFor(revision){
 if(revision==='retained-helper-v2'){
  const {loadRetainedV2History}=await import('./h2_p8p_retained_v2_history.mjs');return loadRetainedV2History();
 }
 const {loadRetainedHistory}=await import('./h2_p8p_retained_history.mjs');return loadRetainedHistory();
}
const sha=b=>createHash('sha256').update(b).digest('hex');
async function bytes(path){const s=await lstat(path);if(!s.isFile()||s.isSymbolicLink()||s.size>1048576)throw Error('retained_input_file');return readFile(path);}
async function write(path,value){const f=await open(path,'wx');try{await f.writeFile(value);await f.sync();}finally{await f.close();}}
export async function prepareRetained(revision='retained-helper-v1'){
 const s=settings(revision),{root}=s;
 const {directArchivePackage}=await import('./h2_p8p_direct_archive_package.mjs');
 const history=await historyFor(revision);if(history.tailSha256!==tail)throw Error('history_tail');
 const pkg=directArchivePackage({revision});
 const pending=['h2_p8p_retained_run.mjs','h2_p8p_stored_recovery.mjs','h2_p8p_retained_ops.mjs',
  'h2_p8p_recovery_sdk_operation.mjs','h2_p8p_retained_history.mjs','h2_p8p_direct_archive_package.mjs',...pkg.manifest.map(f=>f.name)];
 const seen=new Set(),files=[];
 while(pending.length){
  const name=pending.pop();if(seen.has(name))continue;seen.add(name);
  if(!/^h2_p8p_[a-z0-9_]+\.(mjs|py)$/.test(name))throw Error('source_name');
  const b=await bytes(resolve(source,name));files.push({name,bytes:b.length,sha256:sha(b)});
  if(name.endsWith('.mjs'))for(const match of b.toString().matchAll(/['"]\.\/(h2_p8p_[a-z0-9_]+\.mjs)['"]/g))pending.push(match[1]);
 }
 files.sort((a,b)=>a.name.localeCompare(b.name));
 if(sha(await bytes(charter))!==charterSha)throw Error('charter_changed');
 const manifest={schema:'nhm2-retained-recovery-execution-v1',revision,root,files,retainedOneTailSha256:s.secondTail,
  charterSha256:charterSha,ledgerSha256:sha(await bytes(ledger)),historyTailSha256:tail,
  startupBytes:Buffer.byteLength(pkg.startup),startupSha256:pkg.startupSha256,attemptId:pkg.attemptId,
  reservationUsd:.50,reservationSeconds:3600,priorReservedUsd:s.priorUsd,priorReservedSeconds:s.priorSeconds,
  aggregateUsd:12,aggregateSeconds:21600,expiry:new Date(expiry).toISOString()};
 const disk=await statfs(dirname(root),{bigint:true});if(disk.bavail*disk.bsize<1073741824n)throw Error('capacity');
 await mkdir(root);await write(`${root}/startup.sh`,pkg.startup);
 const raw=Buffer.from(JSON.stringify(manifest,null,2)+'\n');await write(`${root}/manifest.json`,raw);
 return {root,manifestSha256:sha(raw),sourceFiles:files.length};
}
export async function executeRetained(expectedSha,revision='retained-helper-v1'){
 const s=settings(revision),{root}=s;
 if(!/^[a-f0-9]{64}$/.test(expectedSha??''))throw Error('manifest_argument');
 const raw=await bytes(`${root}/manifest.json`);if(sha(raw)!==expectedSha)throw Error('manifest_hash');
 const m=JSON.parse(raw);
 if(m.schema!=='nhm2-retained-recovery-execution-v1'||m.revision!==revision||m.retainedOneTailSha256!==s.secondTail||m.root!==root||m.charterSha256!==charterSha||m.historyTailSha256!==tail||
  m.reservationUsd!==.50||m.reservationSeconds!==3600||m.priorReservedUsd!==s.priorUsd||m.priorReservedSeconds!==s.priorSeconds||
  m.aggregateUsd!==12||m.aggregateSeconds!==21600||Date.parse(m.expiry)!==expiry)throw Error('manifest_bounds');
 if(sha(await bytes(charter))!==charterSha||sha(await bytes(ledger))!==m.ledgerSha256)throw Error('authority_changed');
 if(!Array.isArray(m.files)||m.files.length<8||m.files.length>64||new Set(m.files.map(f=>f.name)).size!==m.files.length)throw Error('inventory');
 for(const f of m.files){
  if(!/^h2_p8p_[a-z0-9_]+\.(mjs|py)$/.test(f.name))throw Error('source_path');
  const b=await bytes(resolve(source,f.name));if(b.length!==f.bytes||sha(b)!==f.sha256)throw Error('source_changed');
 }
 const startup=await bytes(`${root}/startup.sh`);if(startup.length!==m.startupBytes||sha(startup)!==m.startupSha256)throw Error('startup_changed');
 const [{runStoredRecovery},{retainedOperations},{retainedSdkOperations}]=await Promise.all([
  import('./h2_p8p_stored_recovery.mjs'),import('./h2_p8p_retained_ops.mjs'),
  import('./h2_p8p_recovery_sdk_operation.mjs')]);
 const history=await historyFor(revision);
 const startedAt=Date.now(),monotonic=performance.now(),now=()=>startedAt+Math.floor(performance.now()-monotonic),deadline=startedAt+3600000;
 if(deadline>=expiry)throw Error('charter_expiry');
 return runStoredRecovery({root:`${root}/evidence`,revision,now,deadline,
  makeOps:({record})=>{
   const dispatch=retainedSdkOperations({record,now,startupPath:`${root}/startup.sh`,startupSha256:m.startupSha256});
   const ops=retainedOperations({history,dispatch,record,now,revision,attemptId:m.attemptId,startupSha256:m.startupSha256,startedAt});
   const preflight=ops.preflight;
   ops.preflight=async(input,context)=>{
    await record({type:'reservation',manifestSha256:expectedSha,reservedUsd:.50,reservedSeconds:3600,
     aggregateRemainingUsd:s.remainingUsd,aggregateRemainingSeconds:s.remainingSeconds,startedAt:new Date(startedAt).toISOString(),deadline:new Date(deadline).toISOString()});
    return preflight(input,context);
   };return ops;
  }});
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 if(process.argv[2]==='prepare'&&process.argv.length===3)console.log(JSON.stringify(await prepareRetained()));
 else if(process.argv[2]==='prepare-v2'&&process.argv.length===3)console.log(JSON.stringify(await prepareRetained('retained-helper-v2')));
 else if(process.argv[2]==='execute-v2'&&process.argv.length===4)console.log(JSON.stringify(await executeRetained(process.argv[3],'retained-helper-v2')));
 else if(process.argv[2]==='execute'&&process.argv.length===4)console.log(JSON.stringify(await executeRetained(process.argv[3])));
 else throw Error('exact_prepare_or_execute_required');
}
