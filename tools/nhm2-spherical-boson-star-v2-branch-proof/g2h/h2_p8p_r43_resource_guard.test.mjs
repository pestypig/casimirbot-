import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateRetainedInstances } from './h2_p8p_r43_resource_guard.mjs';
import { validateInstances as oldGuard } from './h2_p8p_r42_cloud_adapter.mjs';

const capture = new URL('../../../artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r42-retrieval-v1-20260905/', import.meta.url);
function receipt(name) {
  const r = JSON.parse(readFileSync(new URL(name, capture), 'utf8'));
  assert.equal(r.exitCode, 0);
  return JSON.parse(r.stdout);
}
const original = receipt('03-command.json');
const helper = receipt('04-command.json');
test('preserved actual response reproduces R42 defect', () => {
  assert.throws(() => oldGuard(original, helper), /clone_configuration/);
});
test('new guard accepts actual stopped resources without altering response', () => {
  const before = JSON.stringify([original, helper]);
  validateRetainedInstances(original, helper);
  assert.equal(JSON.stringify([original, helper]), before);
});
const changes = [
  ['original running', (o,h) => o.status = 'RUNNING'],
  ['original ID', (o,h) => o.id = 'wrong'],
  ['original zone', (o,h) => o.zone += '-other'],
  ['helper running', (o,h) => h.status = 'RUNNING'],
  ['helper ID', (o,h) => h.id = 'wrong'],
  ['helper machine', (o,h) => h.machineType += '-other'],
  ['helper project', (o,h) => h.selfLink = h.selfLink.replace('dark-stratum', 'other')],
  ['extra disk', (o,h) => h.disks.push(structuredClone(h.disks[1]))],
  ['missing clone', (o,h) => h.disks.pop()],
  ['clone writable', (o,h) => h.disks[1].mode = 'READ_WRITE'],
  ['clone alias', (o,h) => h.disks[1].deviceName += '-20260904'],
  ['clone source', (o,h) => h.disks[1].source += '-other'],
  ['clone cross project', (o,h) => h.disks[1].source = h.disks[1].source.replace('dark-stratum', 'other')],
  ['clone capacity', (o,h) => h.disks[1].diskSizeGb = '31'],
  ['clone auto deletion', (o,h) => h.disks[1].autoDelete = true],
  ['clone boot flag', (o,h) => h.disks[1].boot = true],
  ['boot source', (o,h) => h.disks[0].source += '-other'],
  ['boot capacity', (o,h) => h.disks[0].diskSizeGb = '30'],
];
for (const [name, mutate] of changes) test(`reject ${name}`, () => {
  const o = structuredClone(original), h = structuredClone(helper);
  mutate(o,h);
  assert.throws(() => validateRetainedInstances(o,h));
});
