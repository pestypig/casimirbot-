const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const files = [
'client/src/lib/agent-access/pairingRecoveryStorage.ts',
'client/src/lib/workstation/profileStorageSync.ts',
'client/src/components/agent-access/DurableTaskPairing.tsx',
'client/src/lib/agent-access/__tests__/pairingRecoveryStorage.spec.ts',
'client/src/components/agent-access/__tests__/DurablePairingProfileRecovery.spec.tsx',
'client/e2e/onboarding-isolated/pairing-origin-recovery.spec.ts',
'client/e2e/onboarding-isolated/pairing-origin-entry.tsx',
'client/e2e/onboarding-isolated/pairing-origin-exports.ts',
'docs/work-packets/eh-g8-cs-pairing-origin-recovery-v1.md'];
const logs = ['pairing-origin-red-20260914.log','pairing-origin-core-20260914.log',
'pairing-origin-focused-20260914.log','pairing-origin-browser-20260914.log',
'pairing-origin-browser-diagnosis-20260914.log','pairing-origin-browser-final-20260914.log',
'pairing-origin-client-build-20260914.log','pairing-origin-docs-audit-20260914.log',
'pairing-origin-discipline-quick-20260914.log'];
const rows = fs.readFileSync('.tmp/pairing-origin-browser-final-20260914.log','utf8').split(/\r?\n/)
 .filter(line=>line.startsWith('{"evidence":"isolated_pairing_origin_recovery"')).map(JSON.parse);
if (rows.length !== 6) throw new Error('browser_evidence_rows_missing');
const evidence = {
 schema:'helix.cs.pairing_origin_recovery_evidence.v1', recorded_at:new Date().toISOString(),
 program_gate:'G8', capability_maturity_scope:'deterministically verified', live_acceptance:false,
 parent_goal_complete:false, original_et6_passed:false, nav1_qualified:false,
 boundary:'Exact reviewed request absent from authenticated encrypted profile backup after an unknown-outcome submission',
 classification:['presentation','evidence re-entry'],
 commands:{
 focused:'npx vitest run client/src/lib/agent-access/__tests__/pairingRecoveryStorage.spec.ts client/src/components/agent-access/__tests__/DurablePairingProfileRecovery.spec.tsx client/src/components/agent-access/__tests__/DurableTaskPairing.spec.tsx client/src/lib/workstation/__tests__/profileStorageSync.spec.ts --pool=forks --maxWorkers=1 --minWorkers=1',
 browser:'npx playwright test -c playwright.onboarding.config.ts pairing-origin-recovery.spec.ts --max-failures=1',
 build:'npm run build:client', docs:'npm run helix:environment-harness:docs-audit', discipline:'npm run helix:ask:discipline:quick'},
 results:{red:{failed:1,reason:'profile payload request was undefined; exact local request expected'},
 first_core:{passed:57}, focused:{passed:70,files:4,duration_seconds:16.29},
 initial_browser:{completed_passed:1,completed_failed:2,interrupted:true,reason:'Incomplete test membership/eligibility injection; fixed fixture without production authority changes'},
 diagnostic_browser:{passed:1}, final_browser:{passed:6,duration_seconds:150,rows},
 client_build:{passed:true,duration_seconds:125}, docs_audit:{passed:true}, discipline_quick:{passed:true},
 casimir_gate:{applicable:false,reason:'Application metadata/UI patch, no physics, adapter contract, certificate or release gate change'}},
 source_files:files.map(file=>({file,sha256:hash(file)})),
 logs:logs.map(file=>({file:'.tmp/'+file,sha256:hash('.tmp/'+file)})),
 native:{package:'apps/desktop/release-native-pairing-20260914/win-unpacked/CasimirBot.exe',
 exe_sha256:hash('apps/desktop/release-native-pairing-20260914/win-unpacked/CasimirBot.exe'),
 this_repair_packaged:false, native_restart_performed:false, native_occupied_port_recovery_qualified:false,
 current_pairing_id:'pairing:75ce6e76-0bc3-44f7-8578-999779152e96',pairing_expires_at:'2026-09-14T13:04:02.798Z',
 gameplay_approved:false, gameplay_effects:0,
 read_source_recovery:{reason:'Expired source produced action_adapter_admission_inactive',
 idempotency_key:'cs-onboarding-20260914-origin-recovery-source-01',
 source_id:'source:room-ingress:17ff5685-c3a1-49a8-ab00-4c1cb6a87e2d',
 binding_id:'room_source_binding:96064865-879e-4c39-b7c7-35b7abe9536c',
 expires_at:'2026-09-14T06:40:32.175Z',healthy_source_rotations:0,expired_source_rotations:1},
 current_subject_binding_id:'environment_subject_binding:5db96337-adbf-48ab-a956-caf579c9d56f',
 current_subject_epoch:'adapter_epoch:e742817d99f8b123b01328183d191012871da8bf',
 subject_verification:'self_claim',subject_confidence:0.75,
 draft_reset_observed:true,draft_reset_fixed:false,draft_restored_by_agent:true,
 unsaved_draft:{capabilities:['Walk','Look','Jump','Fluid TAS sequence'],hours:8,manual_input:'cancel',acknowledgement:false}},
 limits:['Profile/pairing persistence uses isolated pg-mem, not PostgreSQL concurrency proof',
 'Device trust, external account-link observation, provider identity and environment membership/eligibility are fixture ports',
 'No provider automatic-delivery or wake qualification','No gameplay or CS3/CS4 qualification',
 'No secret, checked consent, runtime binding, presence or player action grant added to profile backup'],
 cs5:'docs/evidence/eh-g8-et6-continuous-session-build-v1/2026-09-14-pairing-origin-cs5-handoff.md'};
const target='docs/evidence/eh-g8-et6-continuous-session-build-v1/2026-09-14-pairing-origin-recovery.json';
fs.writeFileSync(target,JSON.stringify(evidence,null,2)+'\n',{flag:'wx'});
process.stdout.write(JSON.stringify({target,sha256:hash(target),browser_rows:rows.length})+'\n');
