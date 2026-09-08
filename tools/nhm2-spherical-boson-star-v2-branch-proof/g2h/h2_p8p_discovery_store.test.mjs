import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {discoveryStore} from './h2_p8p_discovery_store.mjs';
test('concurrent records serialize and preserve hash links',async()=>{
 const parent=await mkdtemp(join(tmpdir(),'nhm2-store-test-')),root=join(parent,'evidence');
 const store=await discoveryStore(root);
 await Promise.all([store.record({n:1}),store.record({n:2})]);
 const first=await readFile(join(root,'000001.json')),second=JSON.parse(await readFile(join(root,'000002.json')));
 assert.equal(second.previous,createHash('sha256').update(first).digest('hex'));
 assert.equal(store.status().count,2);
 await assert.rejects(discoveryStore(root));
});
test('oversize poisons without retrying',async()=>{
 const parent=await mkdtemp(join(tmpdir(),'nhm2-store-test-'));
 const store=await discoveryStore(join(parent,'evidence'));
 await assert.rejects(store.record({data:'x'.repeat(131072)}));
 await assert.rejects(store.record({n:1}),/poisoned/);
 assert.equal(store.status().count,0);
});
