import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {createRecoveryStore} from './h2_p8p_recovery_store.mjs';
const root=async()=>join(await mkdtemp(join(tmpdir(),'nhm2-evidence-store-')),'capture');
test('actual exclusive receipt files preserve concurrent order and hash links',async()=>{
 const p=await root(),s=await createRecoveryStore(p);
 await Promise.all([s.record({a:1}),s.record({b:2})]);
 const a=await readFile(join(p,'000001.json')),b=JSON.parse(await readFile(join(p,'000002.json')));
 assert.equal(b.sequence,2);assert.equal(b.previous,createHash('sha256').update(a).digest('hex'));
 assert.deepEqual(b.event,{b:2});
});
test('existing capture directory is never reused',async()=>{
 const p=await root();await createRecoveryStore(p);
 await assert.rejects(createRecoveryStore(p),/EEXIST/);
});
test('oversize receipt poisons store without deleting prior evidence',async()=>{
 const p=await root(),s=await createRecoveryStore(p);await s.record({kept:true});
 await assert.rejects(s.record('x'.repeat(262144)),/record_cap/);
 await assert.rejects(s.record({later:true}),/store_failed/);
 assert.deepEqual(await readdir(p),['000001.json']);
});
test('wrong archive rejected before publication and cannot be retried',async()=>{
 const p=await root(),s=await createRecoveryStore(p);
 await assert.rejects(s.publishArchive(Buffer.alloc(12122)),/archive_identity/);
 await assert.rejects(s.publishArchive(Buffer.alloc(12122)),/archive_store_unavailable|store_failed/);
 assert.deepEqual(await readdir(p),[]);
});
test('receipt captures caller value before queued execution',async()=>{
 const p=await root(),s=await createRecoveryStore(p),event={value:'original'};
 const saved=s.record(event);event.value='mutated';await saved;
 assert.equal(JSON.parse(await readFile(join(p,'000001.json'))).event.value,'original');
});
test('failed archive publication prevents a later-enqueued receipt',async()=>{
 const p=await root(),s=await createRecoveryStore(p);
 const publishing=s.publishArchive(Buffer.alloc(12122));
 const later=s.record({mustNotWrite:true});
 await assert.rejects(publishing,/archive_identity/);await assert.rejects(later,/store_failed/);
 assert.deepEqual(await readdir(p),[]);
});
