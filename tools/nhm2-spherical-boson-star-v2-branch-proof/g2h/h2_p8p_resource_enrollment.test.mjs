import test from 'node:test';
import assert from 'node:assert/strict';
import {enrollCreatedResource} from './h2_p8p_resource_enrollment.mjs';
import {proposedResources as r} from './h2_p8p_hostkey_resource_commands.mjs';
function fixture(){
 const resource={id:'123',name:r.helper,selfLink:`https://www.googleapis.com/compute/v1/projects/${r.project}/zones/${r.zone}/instances/${r.helper}`,
  creationTimestamp:new Date(1000).toISOString()};
 return {kind:'helper',creation:[structuredClone(resource)],observation:{data:resource,observedAt:new Date(2000).toISOString()},startedAt:0,deadline:3000};
}
test('matching synthetic creation/read identities enrolled as immutable values',()=>{
 const f=fixture(),v=enrollCreatedResource(f);f.observation.data.id='changed';
 assert.equal(v.id,'123');assert.equal(Object.isFrozen(v),true);
});
for(const field of ['id','name','selfLink'])test(`reject different observed ${field}`,()=>{
 const f=fixture();f.observation.data[field]='wrong';assert.throws(()=>enrollCreatedResource(f));
});
test('multiple returned resources rejected',()=>{
 const f=fixture();f.creation.push(f.creation[0]);assert.throws(()=>enrollCreatedResource(f));
});
test('preexisting creation timestamp rejected',()=>{
 const f=fixture();f.startedAt=1500;
 assert.throws(()=>enrollCreatedResource(f),/chronology/);
});
test('late observation rejected',()=>{
 const f=fixture();f.observation.observedAt=new Date(3000).toISOString();
 assert.throws(()=>enrollCreatedResource(f),/chronology/);
});
test('numeric ID rejected to avoid precision loss',()=>{
 const f=fixture();f.observation.data.id=123;assert.throws(()=>enrollCreatedResource(f));
});
for(const stamp of ['2026-02-30T00:00:00Z','2026-09-05T00:00:00','2026-09-05T24:00:00Z',1000])
 test(`malformed creation time rejected: ${stamp}`,()=>{
  const f=fixture();f.creation[0].creationTimestamp=f.observation.data.creationTimestamp=stamp;
  f.observation.observedAt='2027-01-01T00:00:00.000Z';f.deadline=Date.parse('2028-01-01T00:00:00Z');
  assert.throws(()=>enrollCreatedResource(f),/timestamp/);
 });
