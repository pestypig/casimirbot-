const fs = require('node:fs');
const crypto = require('node:crypto');
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const fullLog = '.tmp/broker-revision-discipline-full-20260914.log';
const docsLog = '.tmp/broker-revision-docs-20260914.log';
const full = fs.readFileSync(fullLog, 'utf8');
const docs = fs.readFileSync(docsLog, 'utf8');
const counts = [...full.matchAll(/Tests\s+(\d+) passed/g)].map(match => Number(match[1]));
if (!full.includes('[helix:ask:discipline] passed') || counts.reduce((a,b) => a+b, 0) !== 101 || !docs.includes('"ok": true')) throw new Error('Required check result missing');
const files = ['server/services/environment-connectors/session/recover-session-goal.ts', 'server/services/environment-connectors/session/ready-up-session.ts', 'server/services/environment-connectors/session/session-readiness.ts'];
const result = {
  schema: 'casimirbot.continuous_session_source_checks.v1',
  observed_at: new Date().toISOString(),
  classification: 'evidence re-entry',
  scope: 'Isolated deterministic regression, server build and documentation evidence; not packaged or live acceptance.',
  focused_evidence: '2026-09-14-broker-revision-focused.json',
  discipline: {command: 'npm run helix:ask:discipline:full', exit_code: 0, passed_tests: 101, shard_pass_counts: counts, log: fullLog, sha256: sha(fullLog)},
  server_build: {passed: true, existing_duplicate_key_warnings: 4, warning_scope: 'Existing starsim structure-mesa and oscillation-gyre object literals'},
  documentation: {command: 'npm run helix:environment-harness:docs-audit', exit_code: 0, log: docsLog, sha256: sha(docsLog)},
  source_sha256: Object.fromEntries(files.map(file => [file,sha(file)])),
  cs1_complete: false, cs2_complete: false, cs3_complete: false, cs4_complete: false,
  et6_passed: false, nav1_qualified: false, casimir_verification_run: false,
  credential_included: false, hidden_reasoning_included: false
};
fs.writeFileSync('docs/evidence/eh-g8-et6-continuous-session-build-v1/2026-09-14-broker-revision-checks.json', JSON.stringify(result,null,2)+'\n', {flag:'wx'});
console.log(JSON.stringify(result));
