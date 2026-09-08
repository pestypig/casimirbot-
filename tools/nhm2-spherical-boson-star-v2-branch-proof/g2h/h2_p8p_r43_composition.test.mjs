import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { makeAdapter, resource, productionPaths } from './h2_p8p_r43_cloud_adapter.mjs';
import { retrieve, expectedArchive } from './h2_p8p_r42_retrieval_flow.mjs';
const root = new URL('../../../artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r42-retrieval-v1-20260905/', import.meta.url);
const original = JSON.parse(JSON.parse(readFileSync(new URL('03-command.json', root))).stdout);
const helper = JSON.parse(JSON.parse(readFileSync(new URL('04-command.json', root))).stdout);

function harness(fault) {
  const commands = [], receipts = [], waits = [];
  let started = false, stopped = false;
  const store = {
    freeBytes: () => 1024 ** 3, prepare() {},
    receipt: (name, data) => receipts.push({ name, data }),
    download: 'C:/NHM2-R43/download-FIXTURE/r40.tgz',
    inspectArchive: () => ({ ...expectedArchive, ...(fault === 'hash' ? { sha256: 'bad' } : {}) }),
    publish() { if (fault === 'publish') throw new Error('EEXIST'); },
    inspectPublished: () => ({ ...expectedArchive }),
  };
  const run = async (exe, args, options) => {
    assert.ok(exe.endsWith('/platform/bundledpython/python.exe'));
    assert.equal(args[0], '-S');
    assert.ok(args[1].endsWith('/lib/gcloud.py'));
    assert.ok(options.timeoutMs > 0 && options.timeoutMs <= 180000);
    const c = args.slice(2); commands.push(c);
    let stdout = '';
    if (c[0] === 'auth') stdout = 'pestypig@gmail.com';
    else if (c[0] === 'config') stdout = resource.project;
    else {
      assert.ok(c.includes(`--project=${resource.project}`));
      assert.ok(c.includes(`--zone=${resource.zone}`));
      if (c[2] === 'describe') {
        const response = structuredClone(c[3] === resource.original ? original : helper);
        if (fault === 'writable' && c[3] === resource.helper) response.disks[1].mode = 'READ_WRITE';
        if (fault === 'stop' && stopped && c[3] === resource.helper) response.status = 'RUNNING';
        stdout = JSON.stringify(response);
      } else if (c[2] === 'start') {
        assert.equal(c[3], resource.helper); assert.equal(started, false); started = true;
        if (fault === 'start') throw new Error('ambiguous_start');
      } else if (c[1] === 'scp') {
        assert.ok(started); assert.ok(!stopped);
        assert.equal(c[2], `pestypig@${resource.helper}:/home/pestypig/nhm2-h2-p8p-r40-fixture-evidence-export-v1.tgz`);
        assert.equal(c[3], store.download);
        if (fault === 'scp') throw new Error('transfer_failed');
      } else if (c[2] === 'stop') {
        assert.equal(c[3], resource.helper); assert.equal(stopped, false); stopped = true;
        if (fault === 'stop') throw new Error('stop_failed');
      } else assert.fail(`unexpected command ${c}`);
    }
    return { stdout, stderr: '', exitCode: 0 };
  };
  const io = makeAdapter({ run, store });
  io.wait = async ms => waits.push(ms);
  return { io, commands, receipts, waits };
}
test('production outputs are fresh R43 paths, not predecessor paths', () => {
  assert.equal(productionPaths.shortRoot, 'C:/NHM2-R43');
  assert.ok(productionPaths.evidenceRoot.includes('h2-p8p-r43-retrieval-v1-20260905'));
});
test('recorded cloud responses pass integrated single retrieval sequence', async () => {
  const h = harness();
  assert.equal((await retrieve(h.io)).pass, true);
  assert.deepEqual(h.waits, [120000]);
  assert.deepEqual(h.commands.map(c => c[0] === 'compute' ? c.slice(1,3).join(' ') : c[0]),
    ['auth','config','instances describe','instances describe','instances start',
      `scp pestypig@${resource.helper}:/home/pestypig/nhm2-h2-p8p-r40-fixture-evidence-export-v1.tgz`,
      'instances stop','instances describe']);
});
for (const fault of ['start','scp','hash','publish','stop']) test(`${fault} failure stops once and observes status`, async () => {
  const h = harness(fault), result = await retrieve(h.io);
  assert.equal(result.pass, false);
  assert.equal(h.commands.filter(c => c[2] === 'start').length, 1);
  assert.equal(h.commands.filter(c => c[2] === 'stop').length, 1);
  assert.equal(h.commands.at(-1)[2], 'describe');
  assert.equal(result.stopped, fault !== 'stop');
  assert.ok(h.commands.filter(c => c[1] === 'scp').length <= 1);
});
test('writable clone fails without start, stop, or transfer', async () => {
  const h = harness('writable'), result = await retrieve(h.io);
  assert.equal(result.startAttempted, false);
  assert.equal(result.failure, 'clone_configuration');
  assert.equal(h.commands.length, 4);
});
