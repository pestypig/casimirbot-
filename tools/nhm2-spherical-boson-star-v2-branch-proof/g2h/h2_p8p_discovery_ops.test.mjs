import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {loadDiscoveryHistory} from './h2_p8p_discovery_history.mjs';
import {discoveryOperations} from './h2_p8p_discovery_ops.mjs';
import {runDiscoveryDiagnostic} from './h2_p8p_discovery_controller.mjs';
const history=await loadDiscoveryHistory(),attempt='a'.repeat(64),script='test startup';
async function scenario(incomplete=false){
 let clock=Date.parse('2026-09-07T12:00:00Z'),state='before';const actions=[];
 const map={};for(const k of ['helper','clone','boot','snapshot','sourceVM','sourceDisk','original'])map[history[k].data.selfLink]=history[k].data;
 const read=async({kind,name})=>{
  let data;
  if(kind==='account')data=[{account:'pestypig@gmail.com',status:'ACTIVE'}];
  else if(kind==='configuration')data={core:{account:'pestypig@gmail.com',project:name}};
  else if(kind==='projectMetadata')data={name,commonInstanceMetadata:{items:[{key:'ssh-keys'}]}};
  else if(kind==='serial')data={contents:incomplete?'pending':`NHM2_DISCOVERY_V1 ${attempt} END mock\n`};
  else if(kind==='diagnostic')data=[{namespace:`nhm2-discovery-${attempt}`,key:'receipt',value:'mock publication'}];
  else{
   data=structuredClone(Object.values(map).find(v=>v.name===name&&v.selfLink.includes(kind==='instance'?'/instances/':kind==='disk'?'/disks/':'/snapshots/')));
   if(kind==='instance'&&data.id===history.helper.data.id&&state!=='before'){
    data.metadata.items.find(i=>i.key==='startup-script').value=script;
    data.status=state==='running'?'RUNNING':'TERMINATED';
    if(state==='running')data.lastStartTimestamp=new Date(clock).toISOString();
   }
  }
  return {data,observedAt:new Date(clock).toISOString()};
 };
 const dispatch=async action=>{actions.push(action);state={startup:'updated',restart:'running',stop:'stopped'}[action];return {};};
 const ops=discoveryOperations({history,read,dispatch,record:()=>{},attempt,startupSha256:createHash('sha256').update(script).digest('hex'),
  now:()=>clock,delay:async ms=>{clock+=ms;},validate:async()=>({authenticated:true,helperId:history.helper.data.id,attempt,
   mountAuthorized:false,recoveryAuthorized:false,scientificAuthority:false,diagnosticComplete:true,
   transportValueSha256:createHash('sha256').update('mock publication').digest('hex')})});
 const result=await runDiscoveryDiagnostic({ops,record:()=>{},now:()=>clock,deadline:clock+1200000,attempt});
 return {result,actions};
}
test('composed lifecycle validates and stops exact helper',async()=>{
 const {result,actions}=await scenario();assert.equal(result.complete,true);assert.deepEqual(actions,['startup','restart','stop']);
});
test('bounded incomplete serial observation still stops',async()=>{
 const {result,actions}=await scenario(true);assert.equal(result.complete,false);assert.equal(result.stopped,true);
 assert.deepEqual(actions,['startup','restart','stop']);
});
