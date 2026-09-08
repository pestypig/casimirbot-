// Authenticate both consumed histories before reusing their retained resources.
import {readFile,lstat,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {loadRetainedHistory} from './h2_p8p_retained_history.mjs';
const root='C:/NHM2-CV2-Retained-v1/evidence';
export const retainedOneTailSha256='703e08f6a8addc38a14bf1b16ab7357cddad7c5effcc54ced03f159bcc7db79f';
export async function loadRetainedV2History(){
 const history=await loadRetainedHistory();
 const names=Array.from({length:61},(_,i)=>`${String(i+1).padStart(6,'0')}.json`);
 const dir=await lstat(root);
 if(!dir.isDirectory()||dir.isSymbolicLink()||JSON.stringify((await readdir(root)).sort())!==JSON.stringify(names))throw Error('retained_v2_inventory');
 let previous=null,total=0;const events=[];
 for(let i=0;i<names.length;i++){
  const path=`${root}/${names[i]}`,s=await lstat(path);
  if(!s.isFile()||s.isSymbolicLink()||s.size>262144)throw Error('retained_v2_file');
  total+=s.size;if(total>4194304)throw Error('retained_v2_cap');
  const bytes=await readFile(path),v=JSON.parse(bytes);
  if(bytes.length!==s.size||v.sequence!==i+1||v.previous!==previous)throw Error('retained_v2_link');
  previous=createHash('sha256').update(bytes).digest('hex');events.push(v.event);
 }
 if(previous!==retainedOneTailSha256)throw Error('retained_v2_tail');
 const terminal=events.at(-1);
 if(terminal.phase!=='recovery_terminal'||terminal.result.pass!==false||terminal.result.stopped!==true||terminal.result.published!==null)throw Error('retained_v2_terminal');
 const actions=events.filter(e=>e.type==='operation_intent').map(e=>e.action);
 if(JSON.stringify(actions)!==JSON.stringify(['startup','restart','stop']))throw Error('retained_v2_operations');
 const stops=events.filter(e=>e.type==='read_result'&&e.kind==='instance'&&e.exitCode===0&&JSON.parse(e.stdout).id===history.helper.identity.id&&JSON.parse(e.stdout).status==='TERMINATED');
 const latest=stops.at(-1);if(!latest||latest.terminationConfirmed!==true)throw Error('retained_v2_stop');
 const vm=JSON.parse(latest.stdout);
 if(vm.selfLink!==history.helper.identity.selfLink||vm.disks.length!==1||vm.disks[0].source!==history.running.boot.data.selfLink)throw Error('retained_v2_resource');
 return {...history,stopped:{vm,observedAt:latest.finishedAt},retainedOneTailSha256:previous};
}
