const fs = require('node:fs');
const crypto = require('node:crypto');
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const names = ['red','green','focused','quick','docs','server'];
const logs = Object.fromEntries(names.map(name => [name, `.tmp/ready-up-durability-cost-${name}-20260914.log`]));
const content = Object.fromEntries(names.map(name => [name, fs.readFileSync(logs[name], 'utf8')]));
if (!/2 failed.*5 passed/.test(content.red) || !/Tests\s+8 passed/.test(content.green) || !/Tests\s+159 passed/.test(content.focused) || !content.quick.includes('static checks passed') || !content.docs.includes('"ok": true') || !content.server.includes('[build:server] embedded commit')) throw new Error('Required check evidence missing');
const files = ['server/services/local-supervisor/durable-reasoning-binding-access.ts','server/services/local-supervisor/__tests__/durable-reasoning-binding-access.test.ts'];
const result = {
  schema:'casimirbot.continuous_session_source_checks.v1', observed_at:new Date().toISOString(),
  classification:'evidence re-entry', scope:'Isolated repository/access and route/readiness component evidence, static classifier, documentation audit and server build. Not packaged or live acceptance.',
  regression:{red:{failed:2,passed:5},green:{passed:8},broader:{passed:159,files:7}},
  preserved_checks:['fresh destination authorization','strict durability confirmation for every read','fresh encrypted ledger row','trust revocation','grant revocation','expiry','failed initialization rejects current callers'],
  logs:Object.fromEntries(names.map(name => [name,{path:logs[name],sha256:sha(logs[name])}])),
  source_sha256:Object.fromEntries(files.map(file => [file,sha(file)])),
  discipline_full:{run_for_this_patch:false,reason:'Initialization reuse does not change live-source identity or continuation semantics; prior broker-revision full suite is separate evidence.'},
  server_build:{passed:true,existing_duplicate_key_warnings:4},
  cs1_complete:false,cs2_complete:false,cs3_complete:false,cs4_complete:false,et6_passed:false,nav1_qualified:false,
  casimir_verification_run:false,credential_included:false,hidden_reasoning_included:false
};
fs.writeFileSync('docs/evidence/eh-g8-et6-continuous-session-build-v1/2026-09-14-ready-up-durability-cost-checks.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(result));
