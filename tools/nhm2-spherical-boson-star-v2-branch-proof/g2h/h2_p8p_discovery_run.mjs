// Preparation is local only. executeDiscovery requires separate authorization.
import {readFile,lstat,mkdir,open} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {discoveryPackage} from './h2_p8p_discovery_package.mjs';
import {loadDiscoveryHistory,discoveryHistoryTail} from './h2_p8p_discovery_history.mjs';
import {discoveryCommands,discoveryStartupPath} from './h2_p8p_discovery_commands.mjs';
import {readDiscovery} from './h2_p8p_discovery_read.mjs';
import {discoveryOperations} from './h2_p8p_discovery_ops.mjs';
import {discoveryValidator} from './h2_p8p_discovery_validate.mjs';
import {discoveryStore} from './h2_p8p_discovery_store.mjs';
import {runDiscoveryDiagnostic} from './h2_p8p_discovery_controller.mjs';
import {executionClock,checkDiscoveryAdmission,boundedFinalWrite} from './h2_p8p_discovery_admission.mjs';
const root='C:/NHM2-Discovery-v1',source=import.meta.dirname;
const charterPath=resolve(source,'../../../docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-bounded-continuation-charter-v2.md');
const charterSha='8ba8456b165b7fbc3b7b76754aed272e749524cf039b19552058baaf4fb578d1';
const ledgerPath=resolve(source,'../../../docs/research/nhm2-p8p-charter-v2-ledger.md');
const sha=b=>createHash('sha256').update(b).digest('hex');
async function bytes(path){
 const s=await lstat(path);if(!s.isFile()||s.isSymbolicLink()||s.size>1048576)throw Error('runner_source');
 const b=await readFile(path);if(b.length!==s.size)throw Error('runner_source_changed');return b;
}
async function exclusive(path,raw){
 const f=await open(path,'wx');try{await f.writeFile(raw);await f.sync();}finally{await f.close();}
}
export async function buildDiscoveryExecution(){
 const pkg=discoveryPackage(),pending=['h2_p8p_discovery_run.mjs','h2_p8p_discovery_audit_cli.py',...pkg.manifest.map(f=>f.name)],seen=new Set(),files=[];
 while(pending.length){
  const name=pending.pop();if(seen.has(name))continue;seen.add(name);
  if(!/^h2_p8p_[a-z0-9_]+\.(mjs|py|sh)$/.test(name))throw Error('runner_source_name');
  const raw=await bytes(resolve(source,name)),text=raw.toString('utf8');
  files.push({name,bytes:raw.length,sha256:sha(raw)});
  if(name.endsWith('.mjs'))for(const m of text.matchAll(/['"]\.\/(h2_p8p_[a-z0-9_]+\.mjs)['"]/g))pending.push(m[1]);
  if(name.endsWith('.py'))for(const m of text.matchAll(/\b(?:from|import) (h2_p8p_[a-z0-9_]+)/g))pending.push(m[1]+'.py');
 }
 files.sort((a,b)=>a.name.localeCompare(b.name));
 if(files.length>96||sha(await bytes(charterPath))!==charterSha)throw Error('runner_inventory_charter');
 const manifest={schema:'nhm2-discovery-execution-v1',root,files,attempt:pkg.attemptId,
  startupSha256:pkg.startupSha256,startupBytes:pkg.startupBytes,historyTail:discoveryHistoryTail,charterSha256:charterSha,
  ledgerSha256:sha(await bytes(ledgerPath)),
  runtimeSeconds:1200,costCeilingUsd:0.10,priorReservedSeconds:12000,priorReservedUsd:1.60,
  aggregateSeconds:21600,aggregateUsd:12,expiry:'2026-09-12T14:00:00Z',
  scientificAuthority:false,recoveryAuthority:false};
 return {manifest,raw:Buffer.from(JSON.stringify(manifest,null,2)+'\n'),startup:pkg.startup};
}
export async function prepareDiscovery(){
 const built=await buildDiscoveryExecution();await loadDiscoveryHistory();
 await mkdir(root);
 await exclusive(discoveryStartupPath,built.startup);
 await exclusive(`${root}/manifest.json`,built.raw);
 return {root,manifestSha256:sha(built.raw),sourceFiles:built.manifest.files.length};
}
export async function executeDiscovery(expectedSha,authorizationSha){
 if(!/^[a-f0-9]{64}$/.test(expectedSha??'')||!/^[a-f0-9]{64}$/.test(authorizationSha??''))throw Error('runner_manifest_argument');
 const frozen=await bytes(`${root}/manifest.json`),built=await buildDiscoveryExecution();
 if(sha(frozen)!==expectedSha||!frozen.equals(built.raw))throw Error('runner_manifest_changed');
 if(sha(await bytes(discoveryStartupPath))!==built.manifest.startupSha256)throw Error('runner_startup_changed');
 const authorizationRaw=await bytes(`${root}/authorization.json`);
 if(sha(authorizationRaw)!==authorizationSha)throw Error('runner_authorization_hash');
 const now=executionClock();
 checkDiscoveryAdmission(built.manifest,JSON.parse(authorizationRaw),expectedSha,now());
 const history=await loadDiscoveryHistory(),store=await discoveryStore(`${root}/evidence`);
 checkDiscoveryAdmission(built.manifest,JSON.parse(authorizationRaw),expectedSha,now());
 const started=now(),deadline=started+1200000,record=event=>store.record(event);
 await boundedFinalWrite(record,{type:'discovery_execution_binding',manifestSha256:expectedSha,authorizationSha,
  startedAt:new Date(started).toISOString(),deadline:new Date(deadline).toISOString()},now,deadline);
 const dispatch=discoveryCommands({record,startupSha256:built.manifest.startupSha256,now});
 const validate=discoveryValidator({inputPath:`${root}/serial.txt`,record,now});
 const ops=discoveryOperations({history,dispatch,record,read:readDiscovery,validate,now,
  attempt:built.manifest.attempt,startupSha256:built.manifest.startupSha256});
 const result=await runDiscoveryDiagnostic({ops,record,now,deadline,attempt:built.manifest.attempt});
 // Persist a decision eligible for post-write acceptance, never a premature PASS.
 await boundedFinalWrite(record,{type:'discovery_post_run',complete:false,eligible:result.complete,result:{...result,complete:false}},now,deadline);
 const status=store.status();
 return {...result,complete:result.complete&&!status.poisoned&&now()<deadline,evidence:status};
}
