import test from 'node:test';
import assert from 'node:assert/strict';
import {discoveryPackage,sourceNames} from './h2_p8p_discovery_package.mjs';

test('complete explicit package is deterministic and bounded',()=>{
 const a=discoveryPackage(),b=discoveryPackage();
 assert.deepEqual(a,b);
 assert.equal(a.manifest.length,sourceNames.length);
 assert.equal(new Set(sourceNames).size,sourceNames.length);
 assert.ok(a.startupBytes<200000);
 assert.match(a.attemptId,/^[a-f0-9]{64}$/);
});
test('shutdown protection precedes bounded extraction and execution',()=>{
 const {startup,bootstrap,attemptId}=discoveryPackage();
 assert.ok(startup.indexOf('trap shutdown_helper EXIT')<startup.indexOf('360s /usr/bin/python3'));
 assert.ok(bootstrap.indexOf("raise ValueError('source_hash')")<bootstrap.indexOf('os.mkdir'));
 assert.ok(bootstrap.includes('/var/lib/nhm2-discovery-'+attemptId));
 assert.ok(bootstrap.includes("'xb'"));
 assert.ok(bootstrap.includes('os.fsync'));
 assert.ok(!sourceNames.some(n=>n.includes('_test')||n.endsWith('.mjs')));
});
