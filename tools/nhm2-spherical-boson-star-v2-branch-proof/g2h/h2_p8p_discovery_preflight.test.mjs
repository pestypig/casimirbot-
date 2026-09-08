import test from 'node:test';
import assert from 'node:assert/strict';
import {loadDiscoveryHistory} from './h2_p8p_discovery_history.mjs';
import {validateDiscoveryResources} from './h2_p8p_discovery_preflight.mjs';
const history=await loadDiscoveryHistory();
const current=()=>Object.fromEntries(['helper','clone','boot','snapshot','sourceVM','sourceDisk','original'].map(k=>[k,structuredClone(history[k].data)]));
test('authenticates preserved chain and attached read-only baseline',()=>{
 assert.equal(validateDiscoveryResources(current(),history).cloneMode,'READ_ONLY');
});
test('rejects detached/writable clone and changed source',()=>{
 for(const mutate of [c=>c.clone.users=[],c=>c.helper.disks.find(d=>!d.boot).mode='READ_WRITE',
  c=>c.sourceVM.lastStartTimestamp='changed',c=>c.helper.status='RUNNING']){
  const c=current();mutate(c);assert.throws(()=>validateDiscoveryResources(c,history));
 }
});
