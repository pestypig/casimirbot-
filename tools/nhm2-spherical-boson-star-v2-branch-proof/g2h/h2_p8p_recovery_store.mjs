// Local-only evidence storage. No cloud operations or deletion capability.
import {mkdir,lstat,open,readFile,statfs} from 'node:fs/promises';
import {isAbsolute,dirname,join,parse} from 'node:path';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
const ARCHIVE_SHA='73029fde08f14f9fcd01490c4e5d5bc188213eaa2f9a8d857eb5e456b86d0922';
export async function createRecoveryStore(root){
 if(!isAbsolute(root))throw Error('absolute_store_path');
 // The execution manifest must freeze root. Reject existing symlink ancestors;
 // this is not a defense against a concurrently hostile local administrator.
 for(let p=dirname(root);;p=dirname(p)){
  const s=await lstat(p);if(!s.isDirectory()||s.isSymbolicLink())throw Error('store_parent');
  if(p===parse(p).root)break;
 }
 const disk=await statfs(dirname(root),{bigint:true});
 if(disk.bavail*disk.bsize<1073741824n)throw Error('store_free_space');
 await mkdir(root); // exclusive; no recursive creation, reuse or fallback
 let sequence=0,total=0,previous=null,failed=false,queue=Promise.resolve(),archiveAttempted=false;
 async function exclusive(name,bytes){
  if(bytes.length>4194304-total)throw Error('store_total_cap');
  total+=bytes.length; // reserve before IO; partial attempts are never refunded
  const f=await open(join(root,name),'wx');
  try{await f.writeFile(bytes);await f.sync();}finally{await f.close();}
 }
 function enqueue(operation){
  const work=queue.then(async()=>{
   if(failed)throw Error('store_failed');
   return operation();
  });
  queue=work.catch(()=>{failed=true;});
  return work;
 }
 function record(event){
  let snapshot,captureError;
  try{snapshot=JSON.stringify(event);if(Buffer.byteLength(snapshot)>262000)throw Error('store_record_cap');}
  catch(error){captureError=error;}
  return enqueue(async()=>{
   if(captureError)throw captureError;
   if(sequence>=512)throw Error('store_record_count');
   const bytes=Buffer.from(JSON.stringify({sequence:sequence+1,previous,event:JSON.parse(snapshot)})+'\n');
   if(bytes.length>262144)throw Error('store_record_cap');
   const name=`${String(++sequence).padStart(6,'0')}.json`;
   await exclusive(name,bytes);previous=sha(bytes);
   return {name,bytes:bytes.length,sha256:previous};
  });
 }
 function publishArchive(content){
  // Snapshot caller-owned bytes before queueing; use the same queue as receipts.
  const captured=Buffer.isBuffer(content)&&content.length===12122?Buffer.from(content):null;
  return enqueue(async()=>{
  if(failed||archiveAttempted)throw Error('archive_store_unavailable');
  archiveAttempted=true;
  if(captured===null||sha(captured)!==ARCHIVE_SHA)
   throw Error('archive_identity');
  try{
   await exclusive('r40.tgz',captured);
   const copied=await readFile(join(root,'r40.tgz'));
   if(copied.length!==12122||sha(copied)!==ARCHIVE_SHA)throw Error('archive_readback');
   return {path:join(root,'r40.tgz'),bytes:12122,sha256:ARCHIVE_SHA};
  }catch(error){failed=true;throw error;}
  });
 }
 return {record,publishArchive};
}
