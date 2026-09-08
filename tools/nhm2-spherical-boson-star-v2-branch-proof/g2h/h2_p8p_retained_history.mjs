// Read only the authenticated predecessor record chain. No cloud operations.
import {lstat,readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root='C:/NHM2-CV2-Recovery-v1/evidence';
export const predecessorTailSha256='fae10aa83389b1c801642950a7a29bec42e887639214c6e8395e8e7ed8ff1272';
const check=(v,label)=>{if(!v)throw Error(`retained_history_${label}`);};
export function parseRetainedHistory(records){
 check(Array.isArray(records)&&records.length===56,'count');
 let previous=null,total=0;const events=[];
 for(let i=0;i<records.length;i++){
  const raw=records[i];check(Buffer.isBuffer(raw)&&raw.length<=262144,'record_cap');
  total+=raw.length;check(total<=4194304,'total_cap');
  const value=JSON.parse(raw);check(value.sequence===i+1&&value.previous===previous,'link');
  previous=createHash('sha256').update(raw).digest('hex');events.push(value.event);
 }
 check(previous===predecessorTailSha256,'tail_hash');
 function one(predicate){const found=events.filter(predicate);check(found.length===1,'unique');return found[0];}
 const phase=name=>one(e=>e.phase===name&&e.kind==='result').result;
 const reservation=one(e=>e.type==='reservation');
 check(reservation.manifestSha256==='b197ced082b5b6d753b756d2811ea788b871cb2f96137b38b1970a3f5b8d4e51','manifest');
 const terminal=one(e=>e.phase==='recovery_terminal').result;
 check(terminal.pass===false&&terminal.stopped===true&&terminal.published===null,'terminal');
 check(!events.some(e=>e.type==='operation_intent'&&e.action==='attach'),'no_attachment');
 const stopped=one(e=>e.type==='read_result'&&e.kind==='instance'&&e.exitCode===0&&JSON.parse(e.stdout).status==='TERMINATED'&&JSON.parse(e.stdout).id==='2570241336417567358');
 const preflight=phase('preflight'),snapshot=phase('createSnapshot'),clone=phase('createClone'),helper=phase('createHelper'),running=phase('observeRunning');
 check(snapshot.identity.id==='4259767658325590729'&&clone.identity.id==='6517758864936518301'&&helper.identity.id==='2570241336417567358','identities');
 return {tailSha256:previous,startedAt:reservation.startedAt,preflight,snapshot,clone,helper,running,
  stopped:{vm:JSON.parse(stopped.stdout),observedAt:stopped.finishedAt}};
}
export async function loadRetainedHistory(){
 const dir=await lstat(root);check(dir.isDirectory()&&!dir.isSymbolicLink(),'directory');
 const names=Array.from({length:56},(_,i)=>`${String(i+1).padStart(6,'0')}.json`);
 check(JSON.stringify((await readdir(root)).sort())===JSON.stringify(names),'inventory');
 const records=[];let total=0;
 for(const name of names){
  const path=`${root}/${name}`,stat=await lstat(path);
  check(stat.isFile()&&!stat.isSymbolicLink()&&stat.size<=262144,'file');
  total+=stat.size;check(total<=4194304,'total_cap');
  const raw=await readFile(path);check(raw.length===stat.size,'file_changed');records.push(raw);
 }
 return parseRetainedHistory(records);
}
