// Exclusive local evidence store. No cloud operation or deletion.
import {mkdir,open,statfs,lstat} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {createHash} from 'node:crypto';
export async function discoveryStore(root){
 root=resolve(root);
 for(let ancestor=dirname(root);;ancestor=dirname(ancestor)){
  const s=await lstat(ancestor);
  if(!s.isDirectory()||s.isSymbolicLink())throw Error('discovery_store_ancestor');
  if(dirname(ancestor)===ancestor)break;
 }
 const disk=await statfs(dirname(root),{bigint:true});
 if(disk.bavail*disk.bsize<1073741824n)throw Error('discovery_store_capacity');
 await mkdir(root); // No recursive creation, reuse, overwrite or repair.
 let count=0,total=0,previous=null,poisoned=false,queue=Promise.resolve();
 async function append(event){
  if(poisoned)throw Error('discovery_store_poisoned');
  try{
   if(count>=1024)throw Error('discovery_store_count');
   const raw=Buffer.from(JSON.stringify({sequence:count+1,previous,event})+'\n');
   if(raw.length>131072||total+raw.length>33554432)throw Error('discovery_store_cap');
   const file=await open(resolve(root,`${String(count+1).padStart(6,'0')}.json`),'wx');
   try{await file.writeFile(raw);await file.sync();}finally{await file.close();}
   count++;total+=raw.length;previous=createHash('sha256').update(raw).digest('hex');
   return {count,total,tailSha256:previous};
  }catch(e){poisoned=true;throw e;}
 }
 return {
  record(event){
   const frozen=structuredClone(event);
   const result=queue.then(()=>append(frozen));
   queue=result.catch(()=>{});return result;
  },
  status(){return {root,count,total,tailSha256:previous,poisoned};},
 };
}
