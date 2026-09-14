const fs = require('node:fs');
const crypto = require('node:crypto');
const readyPath = '.tmp/broker-revision-native-ready-response-20260914.json';
const expiredPath = '.tmp/broker-revision-native-expired-response-20260914.json';
const ready = JSON.parse(fs.readFileSync(readyPath, 'utf8'));
const expired = JSON.parse(fs.readFileSync(expiredPath, 'utf8'));
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
if (ready.requested_by !== 'authenticated_browser_owner' || !ready.readiness.ready || expired.error !== 'environment_session_readiness_expired') throw new Error('Unexpected response pair');
const result = {
  schema:'casimirbot.native_readiness_response_pair.v1', observed_at:new Date().toISOString(),
  package_evidence:'2026-09-14-broker-revision-package.json',
  earlier_snapshot:'2026-09-14-broker-revision-native.json',
  provenance:'Native EXE developer Network panel, filtered to the ordinary Ready up endpoint. Copy response only; no request headers, cookies, credentials or HAR exported.',
  success:{response:ready,response_sha256:sha(readyPath),native_http_status:200,native_network_duration_ms:8910,
    native_visible_message:'Session prerequisites checked. Ready for the bound AI task to request admitted actions; no movement was started.',
    validity_remaining_at_collection_ms:ready.readiness.valid_until_ms-ready.readiness.observed_at_ms},
  later_failure:{response:expired,response_sha256:sha(expiredPath),native_observed_at:'2026-09-14T10:50:30.384Z',native_network_duration_ms:null,
    native_visible_message:'Session is not ready: environment_session_readiness_expired. Your binding was not replaced.'},
  findings:['Native success is now directly evidenced; this extends the earlier snapshot that had not captured its brief valid state.',
    'The next ordinary native request failed at the final readiness-expiry guard after association revalidation, with no repairs and no unknown partial effects.',
    'The strict five-second freshness deadline was preserved. Exact internal cost attribution remains unmeasured.',
    'Repository initialization performs a durability barrier before a further per-read barrier. Initialization-only reuse is under isolated regression; it is not yet packaged.'],
  next_packet:'docs/work-packets/eh-g8-cs-ready-up-durability-cost-v1.md',
  gameplay_workflows_submitted:0,cs1_complete:false,cs2_complete:false,cs3_complete:false,cs4_complete:false,
  et6_passed:false,nav1_qualified:false,credential_included:false,hidden_reasoning_included:false
};
fs.writeFileSync('docs/evidence/eh-g8-et6-continuous-session-build-v1/2026-09-14-broker-revision-native-response-pair.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({recorded:true,remaining_ms:result.success.validity_remaining_at_collection_ms,failure:expired.error}));
