import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {discoveryValidator} from './h2_p8p_discovery_validate.mjs';
test('bridge preserves input and invokes installed Python for failure evidence',async()=>{
 const root=await mkdtemp(join(tmpdir(),'nhm2-audit-test-')),attempt='a'.repeat(64);
 // Empty serial is intentionally invalid: real CLI must fail and retain output.
 const events=[],validate=discoveryValidator({inputPath:join(root,'serial.txt'),record:e=>events.push(e)});
 await assert.rejects(validate({serial:{data:{contents:''}},attempt,helperId:'2570241336417567358',deadline:Date.now()+60000}),/validator_process/);
 assert.equal(events[0].sha256,createHash('sha256').update('').digest('hex'));
 assert.notEqual(events[1].exitCode,0);
 await assert.rejects(validate({}),/consumed/);
});
