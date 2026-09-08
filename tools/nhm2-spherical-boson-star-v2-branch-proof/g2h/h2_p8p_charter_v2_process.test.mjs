import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { boundedProcess } from './h2_p8p_charter_v2_process.mjs';
function fakeSpawn() {
  const child = new EventEmitter();
  child.pid = 123; child.stdout = new PassThrough(); child.stderr = new PassThrough();
  child.unref = () => {};
  return child;
}
for (const [name, killImpl] of [
  ['kill error', (child, done) => done(new Error('denied'))],
  ['kill never returns', () => {}],
  ['kill success without close', (child, done) => done(null)],
]) test(`cleanup control returns despite ${name}`, async () => {
  let cleanup = false;
  try {
    await boundedProcess('fake', [], { timeoutMs: 10, killGraceMs: 20, spawnImpl: fakeSpawn, killImpl });
    assert.fail('must reject');
  } catch (error) {
    assert.equal(error.pid, 123); assert.equal(error.terminationConfirmed, false);
    assert.match(error.message, /process_timeout/);
  } finally { cleanup = true; }
  assert.equal(cleanup, true);
});
test('real process returns literal arguments', async () => {
  const r = await boundedProcess(process.execPath, ['-e','console.log(process.argv[1])','space & literal'], {timeoutMs:2000});
  assert.equal(r.stdout.trim(), 'space & literal'); assert.equal(r.terminationConfirmed, true);
});
for (const mode of ['error', 'no_callback', 'success']) test(`parent close before kill ${mode}`, async () => {
  const killImpl = (child, done) => {
    child.emit('close', 1);
    if (mode === 'error') setTimeout(() => done(new Error('denied')), 5);
    if (mode === 'success') setTimeout(() => done(null), 5);
  };
  await assert.rejects(boundedProcess('fake', [], {timeoutMs:10,killGraceMs:30,spawnImpl:fakeSpawn,killImpl}),
    error => error.terminationConfirmed === (mode === 'success') && error.message.startsWith('process_timeout'));
});
test('real timeout is bounded and reports process exit', async () => {
  await assert.rejects(boundedProcess(process.execPath, ['-e','setInterval(()=>{},1000)'], {timeoutMs:100}),
    error => error.message.startsWith('process_timeout') && error.terminationConfirmed === true);
});
test('monitor cancellation kills real transfer process',async()=>{
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),100);
  try{await assert.rejects(boundedProcess(process.execPath,['-e','setInterval(()=>{},1000)'],{timeoutMs:3000,signal:controller.signal}),e=>e.message==='process_cancelled'&&e.terminationConfirmed);}
  finally{clearTimeout(timer);}
});
