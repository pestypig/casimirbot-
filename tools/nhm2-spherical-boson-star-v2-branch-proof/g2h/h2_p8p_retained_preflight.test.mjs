// Local workstation regression against the pinned predecessor; never reads cloud.
import test from 'node:test';
import assert from 'node:assert/strict';
import {loadRetainedHistory} from './h2_p8p_retained_history.mjs';
import {retainedPreflight} from './h2_p8p_retained_preflight.mjs';
import {proposedResources as r} from './h2_p8p_hostkey_resource_commands.mjs';
const history=await loadRetainedHistory();
function setup(change=()=>{}){
 const h=structuredClone(history),clock=Date.parse(h.stopped.observedAt)+60000;
 const entries={
  ['instance:nhm2-h2-p8p-r32-e2-4-20260904']:h.preflight.originalReceipt.data,
  [`instance:${r.sourceDisk}`]:h.preflight.sourceBefore.vm,
  [`disk:${r.sourceDisk}`]:h.preflight.diskReceipt.data,
  [`snapshot:${r.snapshot}`]:h.snapshot.observation.data,
  [`disk:${r.clone}`]:h.clone.observation.data,
  [`instance:${r.helper}`]:h.stopped.vm,
  [`disk:${r.boot}`]:h.running.boot.data,
 };
 change(entries);let calls=0;
 const options={history,record:async()=>{},now:()=>clock,deadline:clock+3600000,
  read:async({kind,name})=>{calls++;
   const data=['account','configuration','projectMetadata'].includes(kind)?history.preflight.account.find(a=>a.kind===kind).data:entries[`${kind}:${name}`];
   assert.ok(data);return {data,observedAt:new Date(clock).toISOString()};}};
 return {options,calls:()=>calls};
}
test('current preflight accepts unchanged pinned observations with fresh capture times (mock API)',async()=>{
 const f=setup();const result=await retainedPreflight(f.options);
 assert.equal(result.helper.id,'2570241336417567358');assert.equal(f.calls(),10);
});
for(const [name,change] of [
 ['helper running',e=>e[`instance:${r.helper}`].status='RUNNING'],
 ['clone attached',e=>e[`disk:${r.clone}`].users=['other']],
 ['startup changed',e=>e[`instance:${r.helper}`].metadata={items:[]}],
 ['source restarted',e=>e[`instance:${r.sourceDisk}`].lastStartTimestamp='2026-09-05T22:00:00Z'],
 ['boot substituted',e=>e[`disk:${r.boot}`].id='99'],
])test(`rejects ${name} before mutation`,async()=>{
 const f=setup(change);await assert.rejects(retainedPreflight(f.options));
});
