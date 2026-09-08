import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readdir,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {runStoredRecovery} from './h2_p8p_stored_recovery.mjs';
const root=async()=>join(await mkdtemp(join(tmpdir(),'nhm2-stored-flow-')),'capture');
test('preflight failure preserved locally without later operations',async()=>{
 const p=await root();let calls=0;
 const r=await runStoredRecovery({root:p,now:()=>0,deadline:1000000,
  ops:{preflight:async()=>{calls++;throw Error('preflight_rejected');}}});
 assert.equal(r.pass,false);assert.equal(calls,1);assert.equal(r.stopped,false);
 const files=await readdir(p);assert.equal(files.length,3);
 const last=JSON.parse(await readFile(join(p,files.at(-1))));
 assert.equal(last.event.phase,'recovery_terminal');assert.equal(last.event.result.pass,false);
});
test('synthetic transport success cannot bypass real frozen publication hash',async()=>{
 const p=await root();let stopped=false;
 const phases=['preflight','createSnapshot','createClone','createHelper','observeRunning','attachReadOnly',
  'captureAndValidateChain','readArchiveReceipt','confirmGuestUnmounted'];
 const ops=Object.fromEntries(phases.map(k=>[k,async()=>({mock:true})]));
 ops.validateArchiveReceipt=async()=>Buffer.alloc(12122); // deliberately invalid real digest
 ops.validateLinuxFixture=async()=>({pass:true,mock:true});
 ops.stopAndConfirm=async()=>{stopped=true;};
 const r=await runStoredRecovery({root:p,now:()=>0,deadline:1000000,ops});
 assert.equal(stopped,true);assert.equal(r.pass,false);assert.match(r.failure,/archive_identity/);
 assert.equal((await readdir(p)).includes('r40.tgz'),false);
});
