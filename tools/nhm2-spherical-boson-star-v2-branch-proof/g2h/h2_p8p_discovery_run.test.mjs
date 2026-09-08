import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDiscoveryExecution} from './h2_p8p_discovery_run.mjs';
test('complete local manifest is deterministic and includes audit closure',async()=>{
 const a=await buildDiscoveryExecution(),b=await buildDiscoveryExecution();
 assert.deepEqual(a,b);
 for(const name of ['h2_p8p_discovery_audit.py','h2_p8p_discovery_audit_cli.py','h2_p8p_discovery_store.mjs',
  'h2_p8p_charter_v2_process.mjs','h2_p8p_discovery_boot.sh'])assert.ok(a.manifest.files.some(f=>f.name===name));
 assert.equal(a.manifest.runtimeSeconds,1200);assert.equal(a.manifest.scientificAuthority,false);
});
