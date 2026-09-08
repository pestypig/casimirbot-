// One read-only adapter preflight. No SSH, starts, mutations or fallback.
import {mkdirSync,writeFileSync,statfsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {readObservation} from './h2_p8p_hostkey_api_read.mjs';
const root=resolve('artifacts/nhm2/g2h-e-s5/candidate-neutral/hostkey-api-preflight-v1');
const disk=statfsSync('C:/');
if(disk.bavail*disk.bsize<1073741824)throw Error('local_free_space');
mkdirSync(root); // exclusive attempt root; a repeated invocation cannot proceed
let index=0;
const record=async value=>{
  const bytes=Buffer.from(JSON.stringify(value,null,2)+'\n');
  if(bytes.length>150000)throw Error('receipt_limit');
  const path=resolve(root,`${String(++index).padStart(3,'0')}.json`);
  writeFileSync(path,bytes,{flag:'wx'});
};
try{
 const observed=await readObservation({kind:'instance',name:'nhm2-h2-p8p-r39-rescue-e2-small-20260904',deadline:Date.now()+45000,record});
 const vm=observed.data;
 if(vm.id!=='7129462452423922626'||vm.status!=='TERMINATED'||
    !vm.selfLink.endsWith('/projects/dark-stratum-455714-h4/zones/us-east1-b/instances/nhm2-h2-p8p-r39-rescue-e2-small-20260904')||
    !Array.isArray(vm.disks)||vm.disks.length!==2||!vm.lastStartTimestamp||!vm.lastStopTimestamp)throw Error('instance_binding_or_fields');
 const summary={pass:true,scope:'read_only_sdk_projection',id:vm.id,status:vm.status,disks:vm.disks.length,
   observedAt:observed.observedAt,dataSha256:createHash('sha256').update(JSON.stringify(vm)).digest('hex')};
 await record(summary);console.log(JSON.stringify(summary));
}catch(error){await record({pass:false,error:String(error)});throw error;}
