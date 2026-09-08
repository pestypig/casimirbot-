import test from 'node:test';
import assert from 'node:assert/strict';
import { boundedProcess } from './h2_p8p_r42_bounded_process.mjs';

test('arguments survive spaces and shell metacharacters literally', async () => {
  const arg = 'spaces & pipes | dollars $ and (parentheses)';
  const r = await boundedProcess(process.execPath, ['-e', 'process.stdout.write(process.argv[1])', arg], { timeoutMs: 5000 });
  assert.equal(r.stdout, arg);
});
test('nonzero exit preserves both output streams', async () => {
  await assert.rejects(boundedProcess(process.execPath, ['-e', 'console.log("out");console.error("err");process.exit(7)'], { timeoutMs: 5000 }), e => {
    assert.equal(e.exitCode, 7);
    assert.match(e.stdout, /out/);
    assert.match(e.stderr, /err/);
    return true;
  });
});
test('timeout terminates the actual child process', async () => {
  await assert.rejects(boundedProcess(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { timeoutMs: 500 }), e => {
    assert.equal(e.message, 'process_timeout');
    assert.throws(() => process.kill(e.pid, 0), /ESRCH/);
    return true;
  });
});
test('excess output terminates the process', async () => {
  await assert.rejects(boundedProcess(process.execPath, ['-e', 'console.log("x".repeat(4096));setInterval(()=>{},1000)'], { timeoutMs: 5000, maxBytes: 128 }), e => {
    assert.equal(e.message, 'output_limit');
    assert.throws(() => process.kill(e.pid, 0), /ESRCH/);
    return true;
  });
});
test('timeout also terminates a spawned descendant', async () => {
  const source = 'const {spawn}=require("node:child_process");const c=spawn(process.execPath,["-e","setInterval(()=>{},1000)"],{stdio:"ignore"});console.log(c.pid);setInterval(()=>{},1000)';
  await assert.rejects(boundedProcess(process.execPath, ['-e', source], { timeoutMs: 750 }), e => {
    assert.equal(e.message, 'process_timeout');
    const descendant = Number(e.stdout.trim());
    assert.ok(Number.isInteger(descendant) && descendant > 0);
    assert.throws(() => process.kill(descendant, 0), /ESRCH/);
    assert.throws(() => process.kill(e.pid, 0), /ESRCH/);
    return true;
  });
});
