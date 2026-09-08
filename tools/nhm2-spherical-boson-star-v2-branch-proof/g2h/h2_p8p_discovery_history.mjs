// Authenticate consumed evidence only; no cloud reads or resource mutation.
import {readFile,lstat,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {loadRetainedV2History} from './h2_p8p_retained_v2_history.mjs';
import {proposedResources as r} from './h2_p8p_hostkey_resource_commands.mjs';
export const discoveryHistoryTail='18b70b8a7cdadf62ef55f4dfc76a08258b674d66720ae7030122ffb88fc17716';
const root='C:/NHM2-CV2-Retained-v2/evidence';
export async function loadDiscoveryHistory(){
 const prior=await loadRetainedV2History();
 const names=Array.from({length:88},(_,i)=>`${String(i+1).padStart(6,'0')}.json`);
 const info=await lstat(root);
 if(!info.isDirectory()||info.isSymbolicLink()||JSON.stringify((await readdir(root)).sort())!==JSON.stringify(names))throw Error('discovery_history_inventory');
 let previous=null,total=0;const events=[];
 for(let i=0;i<names.length;i++){
  const path=`${root}/${names[i]}`,s=await lstat(path);
  if(!s.isFile()||s.isSymbolicLink()||s.size>262144)throw Error('discovery_history_file');
  total+=s.size;if(total>4194304)throw Error('discovery_history_cap');
  const raw=await readFile(path),v=JSON.parse(raw);
  if(raw.length!==s.size||v.sequence!==i+1||v.previous!==previous)throw Error('discovery_history_link');
  previous=createHash('sha256').update(raw).digest('hex');events.push(v.event);
 }
 if(previous!==discoveryHistoryTail)throw Error('discovery_history_tail');
 const terminal=events.at(-1);
 if(terminal.phase!=='recovery_terminal'||terminal.result.pass!==false||terminal.result.stopped!==true||terminal.result.published!==null)throw Error('discovery_history_terminal');
 if(JSON.stringify(events.filter(e=>e.type==='operation_intent').map(e=>e.action))!==JSON.stringify(['startup','restart','attach','stop']))throw Error('discovery_history_actions');
 function latest(kind,name){
  const e=events.filter(e=>e.type==='read_result'&&e.kind===kind&&e.name===name&&e.exitCode===0&&e.terminationConfirmed===true).at(-1);
  if(!e)throw Error('discovery_history_observation');
  return {data:JSON.parse(e.stdout),observedAt:e.finishedAt};
 }
 const helper=latest('instance',r.helper),clone=latest('disk',r.clone);
 if(helper.data.id!=='2570241336417567358'||helper.data.status!=='TERMINATED'||clone.data.id!=='6517758864936518301')throw Error('discovery_history_identity');
 const disks=helper.data.disks;
 if(disks.length!==2||disks.filter(d=>!d.boot&&d.source===clone.data.selfLink&&d.mode==='READ_ONLY'&&d.deviceName===r.device).length!==1)throw Error('discovery_history_attachment');
 return {prior,tailSha256:previous,helper,clone,boot:latest('disk',r.boot),
  snapshot:latest('snapshot',r.snapshot),sourceVM:latest('instance',r.sourceDisk),
  sourceDisk:latest('disk',r.sourceDisk),original:latest('instance','nhm2-h2-p8p-r32-e2-4-20260904')};
}
