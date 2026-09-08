import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { cappedSink } from './h2_p8p_charter_v2_capped_sink.mjs';
const file=()=>join(mkdtempSync(join(tmpdir(),'nhm2-capped-fixture-')),'bytes.bin');
test('raw binary is preserved with exact digest',()=>{
  const p=file(),b=Buffer.from([0,255,128,13,10]),s=cappedSink(p,b.length);
  s.accept(b.subarray(0,2));s.accept(b.subarray(2));
  assert.deepEqual(s.finish(),{bytes:5,sha256:createHash('sha256').update(b).digest('hex')});
  assert.deepEqual(readFileSync(p),b);
});
test('oversized first chunk writes zero bytes',()=>{
  const p=file(),s=cappedSink(p,12);
  assert.throws(()=>s.accept(Buffer.alloc(65536)),/byte_cap/);s.closePartial();assert.equal(statSync(p).size,0);
});
test('oversized later chunk preserves only allowed prefix',()=>{
  const p=file(),s=cappedSink(p,12);s.accept(Buffer.alloc(8));
  assert.throws(()=>s.accept(Buffer.alloc(8)),/byte_cap/);assert.throws(()=>s.finish());assert.equal(statSync(p).size,8);
});
test('partial stream cannot finish as success',()=>{
  const p=file(),s=cappedSink(p,12);s.accept(Buffer.alloc(3));assert.throws(()=>s.finish());assert.equal(statSync(p).size,3);
});
test('existing destination is never overwritten',()=>{
  const p=file(),s=cappedSink(p,1);s.accept(Buffer.from([42]));s.finish();assert.throws(()=>cappedSink(p,1),/EEXIST/);assert.equal(readFileSync(p)[0],42);
});
