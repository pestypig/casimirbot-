import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeAdapter, resource, validateInstances } from './h2_p8p_r42_cloud_adapter.mjs';
import { writeExclusive, copyExclusive, inspect, localStore } from './h2_p8p_r42_local_io.mjs';
import { retrieve, expectedArchive } from './h2_p8p_r42_retrieval_flow.mjs';

const original = { id: resource.originalId, name: resource.original, status: 'TERMINATED' };
const helper = { id: resource.helperId, name: resource.helper, status: 'TERMINATED', machineType: '/machineTypes/e2-small', disks: [
  { boot: true, diskSizeGb: '10', mode: 'READ_WRITE' },
  { deviceName: resource.clone, mode: 'READ_ONLY', source: `/disks/${resource.clone}` },
] };
test('exclusive copy cannot replace an existing receipt', () => {
  const root = mkdtempSync(join(tmpdir(), 'nhm2-r42-filetest-'));
  const src = join(root, 'source.txt'), dst = join(root, 'receipt.txt');
  writeExclusive(src, 'new');
  writeExclusive(dst, 'old');
  assert.throws(() => copyExclusive(src, dst), /EEXIST/);
  assert.equal(readFileSync(dst, 'utf8'), 'old');
  assert.throws(() => writeExclusive(dst, 'replacement'), /EEXIST/);
});
test('local store publishes and hashes a fixture without overwriting it', () => {
  const root = mkdtempSync(join(tmpdir(), 'nhm2-r42-storetest-'));
  const store = localStore(join(root, 'short'), join(root, 'evidence'), root);
  store.prepare();
  writeExclusive(store.download, 'synthetic local data');
  store.publish();
  assert.deepEqual(store.inspectArchive(), store.inspectPublished());
  assert.throws(() => store.publish(), /EEXIST/);
  assert.ok(store.freeBytes() > 0);
  assert.throws(() => store.prepare(), /EEXIST/);
});
test('directories cannot be authenticated as archives', () => {
  const root = mkdtempSync(join(tmpdir(), 'nhm2-r42-dirtest-'));
  assert.throws(() => inspect(root), /not_regular_file/);
});
test('resource validation rejects changed identity, state and clone mode', () => {
  validateInstances(original, helper);
  assert.throws(() => validateInstances({ ...original, status: 'RUNNING' }, helper));
  assert.throws(() => validateInstances(original, { ...helper, id: 'different' }));
  const changed = structuredClone(helper);
  changed.disks[1].mode = 'READ_WRITE';
  assert.throws(() => validateInstances(original, changed), /clone_configuration/);
});

function harness(account = 'pestypig@gmail.com') {
  const commands = [], receipts = [];
  const store = {
    freeBytes: () => 1024 ** 3, prepare() {},
    receipt: (name, data) => receipts.push({ name, data }),
    download: 'C:/FAKE-NO-TRANSFER/r40.tgz',
    inspectArchive: () => ({ ...expectedArchive }),
    publish() {}, inspectPublished: () => ({ ...expectedArchive }),
  };
  const run = async (exe, args, options) => {
    assert.ok(exe.endsWith('/python.exe'));
    assert.equal(args[0], '-S');
    assert.ok(args[1].endsWith('/gcloud.py'));
    assert.ok(options.timeoutMs > 0);
    const command = args.slice(2);
    commands.push(command);
    let stdout = '';
    if (command[0] === 'auth') stdout = account;
    else if (command[0] === 'config') stdout = resource.project;
    else if (command[2] === 'describe') stdout = JSON.stringify(command[3] === resource.original ? original : helper);
    return { stdout, stderr: '', exitCode: 0 };
  };
  const io = makeAdapter({ run, store });
  io.wait = async () => {};
  return { io, commands, receipts };
}
test('adapter and flow compose to exactly one helper start, transfer and stop', async () => {
  const h = harness();
  const result = await retrieve(h.io);
  assert.equal(result.pass, true);
  const starts = h.commands.filter(c => c[2] === 'start');
  assert.equal(starts.length, 1);
  assert.equal(starts[0][3], resource.helper);
  assert.equal(h.commands.filter(c => c[1] === 'scp').length, 1);
  assert.equal(h.commands.filter(c => c[2] === 'stop').length, 1);
  assert.ok(!h.commands.some(c => c.includes('create')));
  h.io.saveResult(result);
  assert.equal(h.receipts.at(-1).name, 'result.json');
});
test('wrong active account prevents mutation in composed adapter', async () => {
  const h = harness('wrong@example.invalid');
  const result = await retrieve(h.io);
  assert.equal(result.failure, 'account_project_mismatch');
  assert.ok(!h.commands.some(c => ['start', 'stop'].includes(c[2]) || c[1] === 'scp'));
});
