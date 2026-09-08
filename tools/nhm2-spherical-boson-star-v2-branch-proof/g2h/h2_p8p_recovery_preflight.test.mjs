import test from 'node:test';
import assert from 'node:assert/strict';
import {recoveryPreflight} from './h2_p8p_recovery_preflight.mjs';
import {proposedResources as r} from './h2_p8p_hostkey_resource_commands.mjs';
const root=`https://www.googleapis.com/compute/v1/projects/${r.project}/zones/${r.zone}`;
function fixture(change=()=>{}){
 const original={name:'nhm2-h2-p8p-r32-e2-4-20260904',id:'1893159507643031574',selfLink:`${root}/instances/nhm2-h2-p8p-r32-e2-4-20260904`,status:'TERMINATED'};
 const source={name:r.sourceDisk,lastStartTimestamp:new Date(0).toISOString(),lastStopTimestamp:new Date(500).toISOString(),id:'7129462452423922626',selfLink:`${root}/instances/${r.sourceDisk}`,status:'TERMINATED',machineType:`${root}/machineTypes/e2-small`,disks:[
  {boot:true,mode:'READ_WRITE',source:`${root}/disks/${r.sourceDisk}`},
  {boot:false,mode:'READ_ONLY',source:`${root}/disks/nhm2-h2-p8p-r39-evidence-clone-20260904`} ]};
 const disk={name:r.sourceDisk,id:'1064813028101755842',selfLink:`${root}/disks/${r.sourceDisk}`,status:'READY',sizeGb:'10',type:`${root}/diskTypes/pd-standard`,users:[source.selfLink]};
 const entries=[original,source,disk,[],[],[],[]];change(entries);
 let calls=0;
 return {options:{record:async()=>{},deadline:10000,now:()=>1000,read:async()=>({observedAt:new Date(1000).toISOString(),data:entries[calls++]})},count:()=>calls};
}
test('preflight binds stopped source and completes four absence reads',async()=>{
 const f=fixture();const out=await recoveryPreflight(f.options);assert.equal(f.count(),7);assert.equal(out.absence.length,4);
});
for(const [label,change,count] of [
 ['original running',e=>e[0].status='RUNNING',1],
 ['source replacement',e=>e[1].id='123',2],
 ['wrong name',e=>e[1].name='different',2],
 ['missing stop time',e=>delete e[1].lastStopTimestamp,2],
 ['future stop time',e=>e[1].lastStopTimestamp=new Date(2000).toISOString(),2],
 ['writable evidence',e=>e[1].disks[1].mode='READ_WRITE',2],
 ['replacement boot',e=>e[2].id='123',3],
 ['shared boot',e=>e[2].users.push('other'),3],
 ['name occupied',e=>e[3]=[{id:'123'}],4],
])test(label+' terminates without subsequent reads',async()=>{
 const f=fixture(change);await assert.rejects(recoveryPreflight(f.options));assert.equal(f.count(),count);
});
