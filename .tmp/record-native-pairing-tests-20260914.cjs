const fs = require('node:fs');
const crypto = require('node:crypto');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const log = (file, details) => ({file, sha256:hash(file), ...details});
const result = {
  schema:'casimirbot.native_pairing_issuer_tests.v1', observed_at:new Date().toISOString(),
  scope:'Deterministic component and isolated browser evidence; not native acceptance',
  classification:['tool admission','evidence re-entry','presentation'],
  production_changes:['Preserve native authentication issuer and validate exact active native delegation for browser pairing authority',
    'Use the actual destination issuer for native run eligibility',
    'Retain same-request reconciliation with fixed account/device failures',
    'Prefer the last healthy loopback address after OS bind probing, with occupied/unavailable-port fallback and fresh service authentication'],
  tests:[
    log('.tmp/native-pairing-issuer-red-20260914.log',{passed:9,failed:2,meaning:'Pre-repair actual-router native issuer mismatch and native-run namespace boundary'}),
    log('.tmp/native-pairing-issuer-core-20260914.log',{passed:54,failed:1,meaning:'25 existing route and 19 principal tests passed; native fixture omitted runtime binding restore, corrected in final focused run'}),
    log('.tmp/native-pairing-issuer-focused-20260914.log',{passed:53,failed:0,files:3}),
    log('.tmp/native-pairing-issuer-browser-20260914.log',{passed:24,failed:0,actual_handler_cases:20,mocked_response_layout_cases:4,inputs:['pointer','keyboard'],native_issuer_real_run_cases:2}),
    log('.tmp/native-pairing-issuer-discipline-full-20260914.log',{selected_test_executions_passed:101,failed:0,server_build_exit_code:0,server_build_warnings:4,limitations:'Sharded deterministic battery; no live frontier provider qualification. Skips in each invocation are shard exclusions, not a whole-suite coverage claim.'}),
    log('.tmp/native-pairing-loopback-tests-20260914.log',{passed:35,failed:1,meaning:'New loopback cases passed. Existing environment test expected immediate writes although committed configuration already uses bounded deferred telemetry.'}),
    log('.tmp/native-pairing-loopback-tests-fixed-20260914.log',{passed:36,failed:0,files:4,meaning:'Corrected stale test expectation and asserted existing 2500/15000 ms limits; no production persistence setting changed'}),
    log('.tmp/native-pairing-issuer-docs-audit-final-20260914.log',{passed:true})
  ],
  limitations:['Isolated fixtures do not authenticate to production','pg-mem is not real PostgreSQL concurrency qualification',
    'Ordinary native same-request reconciliation remains to be observed in the replacement EXE',
    'Pending review recovery under an occupied old port is not covered by address reuse',
    'No invitation secret, account credential, hidden reasoning, player authority or gameplay is included',
    'No Casimir physics/adapter/certificate verification claimed for this application patch'],
  cs1_complete:false,cs2_complete:false,cs3_complete:false,cs4_complete:false,et6_passed:false,nav1_unlocked:false
};
fs.writeFileSync('docs/evidence/eh-g8-et6-continuous-session-build-v1/2026-09-14-native-pairing-tests.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({recorded:true,focused:53,browser:24,discipline:101,native_host:36}));
