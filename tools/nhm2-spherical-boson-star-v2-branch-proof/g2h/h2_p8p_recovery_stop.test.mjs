import test from 'node:test';
import assert from 'node:assert/strict';
import {stopAndObserveRecovery} from './h2_p8p_recovery_stop.mjs';
import {proposedResources as r} from './h2_p8p_hostkey_resource_commands.mjs';
import {readCleanupObservation} from './h2_p8p_hostkey_api_read.mjs';
function fixture(){
 const calls=[];
 const observation={observedAt:new Date(1000).toISOString(),data:{id:'123',name:r.helper,status:'TERMINATED',
  selfLink:`https://www.googleapis.com/compute/v1/projects/${r.project}/zones/${r.zone}/instances/${r.helper}`}};
 return {calls,observation,args:{expectedId:'123',deadline:300000,now:()=>0,record:async()=>{},
  dispatch:async(action,o)=>{calls.push(action);assert.equal(o.deadline,240000);},
  observe:async o=>{calls.push('describe');assert.equal(o.name,r.helper);return observation;}}};
}
test('stop response alone is insufficient; exact terminated describe is required',async()=>{
 const f=fixture();assert.equal((await stopAndObserveRecovery(f.args)).stopped,true);
 assert.deepEqual(f.calls,['stop','describe']);
});
test('describe still attempted after stop failure and preserves both outcomes',async()=>{
 const f=fixture();f.args.dispatch=async()=>{f.calls.push('stop');throw Error('api_timeout');};
 await assert.rejects(stopAndObserveRecovery(f.args),e=>e.stopped===true&&/api_timeout/.test(e.stopError));
 assert.deepEqual(f.calls,['stop','describe']);
});
for(const field of ['id','name','selfLink','status'])test(`reject incorrect ${field}`,async()=>{
 const f=fixture();f.observation.data[field]='wrong';
 await assert.rejects(stopAndObserveRecovery(f.args),e=>e.stopped===false);
});
test('unbound ID does not prevent safety stop but cannot certify identity',async()=>{
 const f=fixture();f.args.expectedId=null;
 await assert.rejects(stopAndObserveRecovery(f.args),e=>e.stopped===false);
 assert.deepEqual(f.calls,['stop','describe']);
});
test('stale observation rejected',async()=>{
 const f=fixture();f.observation.observedAt=new Date(-1).toISOString();
 await assert.rejects(stopAndObserveRecovery(f.args),e=>e.stopped===false);
});
test('composed full-disk status query runs but cannot claim complete cleanup evidence',async()=>{
 const f=fixture();let reads=0;
 f.args.record=async()=>{throw Error('disk_full');};
 f.args.observe=o=>readCleanupObservation({...o,processImpl:async()=>{
  reads++;return {stdout:JSON.stringify(f.observation.data),exitCode:0,terminationConfirmed:true};}});
 await assert.rejects(stopAndObserveRecovery(f.args),e=>e.stopped===true&&
  /evidence_incomplete/.test(e.stopError));
 assert.equal(reads,1);
});
test('short but usable window retains a final describe allowance',async()=>{
 const f=fixture();f.args.deadline=60000;
 f.args.dispatch=async(_,o)=>assert.equal(o.deadline,35000);
 assert.equal((await stopAndObserveRecovery(f.args)).stopped,true);
});
