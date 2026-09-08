import test from 'node:test';
import assert from 'node:assert/strict';
import {validateFixtureReceipt} from './h2_p8p_fixture_receipt.mjs';
import {proposedResources as r} from './h2_p8p_hostkey_resource_commands.mjs';
function fixture(){
 const helper={id:'123',name:r.helper,status:'RUNNING',selfLink:`https://www.googleapis.com/compute/v1/projects/${r.project}/zones/${r.zone}/instances/${r.helper}`};
 const value={attempt_id:'a'.repeat(64),pass:true,checks:['wrong_size','wrong_hash_after_regular_read','leaf_symlink','parent_symlink',
  'fifo_nonblocking_rejection','worker_timeout_reaped','worker_output_cap'],failure:null,schema:'nhm2-cloud-linux-fixture-v1',instance_id:'123'};
 const args={helper,attemptId:value.attempt_id,notBefore:0,deadline:2000,api:{helperId:'123',helperURL:helper.selfLink,
  observedAt:new Date(1000).toISOString(),data:[{namespace:'nhm2-fixture',key:'receipt',value:JSON.stringify(value)}]}};
 return {args,value};
}
test('synthetic complete fixture receipt accepted structurally only',()=>{
 assert.equal(validateFixtureReceipt(fixture().args).pass,true);
});
for(const field of ['pass','checks','attempt_id','instance_id'])test(`reject changed ${field}`,()=>{
 const f=fixture();f.value[field]=field==='pass'?false:field==='checks'?[]:'wrong';
 f.args.api.data[0].value=JSON.stringify(f.value);assert.throws(()=>validateFixtureReceipt(f.args));
});
test('reject stale API receipt',()=>{
 const f=fixture();f.args.notBefore=1500;assert.throws(()=>validateFixtureReceipt(f.args),/chronology/);
});
test('reject helper substituted in API envelope',()=>{
 const f=fixture();f.args.api.helperId='999';assert.throws(()=>validateFixtureReceipt(f.args),/api_identity/);
});
