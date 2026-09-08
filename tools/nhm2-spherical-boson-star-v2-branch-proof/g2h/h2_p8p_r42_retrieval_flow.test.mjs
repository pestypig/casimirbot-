import test from 'node:test';
import assert from 'node:assert/strict';
import { retrieve, expectedArchive } from './h2_p8p_r42_retrieval_flow.mjs';

function fake(overrides = {}) {
  const calls = [];
  let clock = 0;
  const io = {
    now: () => clock,
    freeBytes: async () => 1024 ** 3,
    prepareExclusive: async () => {},
    authenticate: async () => {},
    start: async () => {},
    wait: async ms => { clock += ms; },
    downloadExclusive: async () => {},
    inspectArchive: async () => ({ ...expectedArchive }),
    publishExclusive: async () => {},
    inspectPublished: async () => ({ ...expectedArchive }),
    stop: async () => {},
    status: async () => 'TERMINATED',
    ...overrides,
  };
  for (const key of Object.keys(io).filter(k => k !== 'now')) {
    const operation = io[key];
    io[key] = async (...args) => {
      calls.push({ key, args });
      return operation(...args);
    };
  }
  return { io, calls, advance: ms => { clock += ms; } };
}
const fail = message => async () => { throw new Error(message); };
const count = (f, key) => f.calls.filter(c => c.key === key).length;

test('successful flow verifies archive and observes stopped helper', async () => {
  const f = fake();
  const r = await retrieve(f.io);
  assert.equal(r.pass, true);
  assert.equal(count(f, 'start'), 1);
  assert.equal(count(f, 'downloadExclusive'), 1);
  assert.equal(count(f, 'stop'), 1);
  assert.equal(count(f, 'status'), 1);
});

for (const stage of ['initial', 'prestart', 'poststart']) {
  test(`low disk space at ${stage} prevents further transfer`, async () => {
    let n = 0;
    const failingCall = { initial: 1, prestart: 2, poststart: 3 }[stage];
    const f = fake({ freeBytes: async () => ++n === failingCall ? 0 : 1024 ** 3 });
    const r = await retrieve(f.io);
    assert.equal(r.failure, 'insufficient_disk_space');
    assert.equal(count(f, 'start'), stage === 'poststart' ? 1 : 0);
    assert.equal(count(f, 'stop'), stage === 'poststart' ? 1 : 0);
    assert.equal(count(f, 'downloadExclusive'), 0);
    if (stage === 'initial') assert.equal(count(f, 'prepareExclusive'), 0);
  });
}

for (const operation of ['start', 'downloadExclusive']) {
  for (const reason of ['timeout', 'transport_failure']) {
    test(`${operation} ${reason} enters cleanup exactly once`, async () => {
      const f = fake({ [operation]: fail(reason) });
      const r = await retrieve(f.io);
      assert.equal(r.pass, false);
      assert.equal(r.failure, reason);
      assert.equal(count(f, 'start'), 1);
      assert.equal(count(f, 'stop'), 1);
      assert.equal(count(f, 'status'), 1);
      assert.ok(count(f, 'downloadExclusive') <= 1);
    });
  }
}

for (const [field, value, reason] of [
  ['bytes', 0, 'archive_size_mismatch'],
  ['sha256', 'invalid', 'archive_hash_mismatch'],
]) {
  test(reason, async () => {
    const f = fake({ inspectArchive: async () => ({ ...expectedArchive, [field]: value }) });
    const r = await retrieve(f.io);
    assert.equal(r.failure, reason);
    assert.equal(count(f, 'publishExclusive'), 0);
    assert.equal(count(f, 'stop'), 1);
  });
}

for (const operation of ['prepareExclusive', 'publishExclusive']) {
  test(`${operation} refuses occupied destination`, async () => {
    const f = fake({ [operation]: fail('EEXIST') });
    const r = await retrieve(f.io);
    assert.equal(r.pass, false);
    assert.equal(r.failure, 'EEXIST');
    assert.equal(count(f, 'stop'), operation === 'prepareExclusive' ? 0 : 1);
  });
}

test('stop failure remains visible even if observation confirms stopped', async () => {
  const f = fake({ stop: fail('stop_timeout') });
  const r = await retrieve(f.io);
  assert.equal(r.pass, false);
  assert.equal(r.cleanupFailure, 'stop_timeout');
  assert.equal(r.stopped, true);
  assert.equal(count(f, 'status'), 1);
});
test('running status cannot be reported as cleanup success', async () => {
  const f = fake({ status: async () => 'RUNNING' });
  const r = await retrieve(f.io);
  assert.equal(r.pass, false);
  assert.equal(r.cleanupFailure, 'helper_stop_not_confirmed');
});
test('elapsed operational budget reserves cleanup time', async () => {
  const f = fake();
  f.io.wait = async () => f.advance(910000);
  const r = await retrieve(f.io);
  assert.equal(r.failure, 'deadline_exhausted');
  assert.equal(count(f, 'downloadExclusive'), 0);
  assert.equal(count(f, 'stop'), 1);
  for (const call of f.calls.filter(c => ['start', 'stop', 'status'].includes(c.key))) {
    assert.ok(call.args[0].timeoutMs > 0);
    assert.ok(call.args[0].timeoutMs <= 180000);
  }
});
