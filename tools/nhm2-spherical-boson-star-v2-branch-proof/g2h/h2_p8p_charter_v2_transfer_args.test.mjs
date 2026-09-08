import test from 'node:test';
import assert from 'node:assert/strict';
import { transferArgs } from './h2_p8p_charter_v2_transfer_args.mjs';
const destination = 'C:/NHM2-CV2-R1/download-ABC123/r40.tgz';
test('exact direct PSCP arguments have no metadata path or acceptance flag', () => {
  assert.deepEqual(transferArgs({ip:'192.0.2.1',destination}), ['-batch','-v','-noagent','-i',
    'C:/Users/dan/.ssh/google_compute_engine.ppk',
    'pestypig@192.0.2.1:/home/pestypig/nhm2-h2-p8p-r40-fixture-evidence-export-v1.tgz',destination]);
});
for (const ip of ['host.invalid','1.2.3.999','1.2.3.4 -hostkey x','1.2.3.4\n','01.2.3.4']) test(`reject IP ${JSON.stringify(ip)}`, () => {
  assert.throws(() => transferArgs({ip,destination}));
});
test('reject another evidence destination', () => {
  assert.throws(() => transferArgs({ip:'192.0.2.1',destination:'C:/NHM2-R43/r40.tgz'}));
});
