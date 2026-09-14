const fs=require('node:fs'); const crypto=require('node:crypto');
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const logs=['player-review-red-20260914.log','player-review-red-valid-20260914.log',
'player-review-focused-20260914.log','player-review-focused-fixed-20260914.log',
'player-review-focused-current-fixture-20260914.log','player-review-focused-final-20260914.log',
'player-review-browser-20260914.log','player-review-browser-final-20260914.log',
'player-review-client-build-20260914.log','player-review-docs-audit-20260914.log','player-review-discipline-quick-20260914.log'];
if(!/built in/.test(fs.readFileSync('.tmp/player-review-client-build-20260914.log','utf8'))) throw new Error('client_build_completion_missing');
const sources=['client/src/components/helix/ask-console/shared-live-room/SharedLiveRoomPlayerEmbodimentPanel.tsx',
'client/src/components/helix/ask-console/shared-live-room/SharedLiveRoomSourceBindingsPanel.tsx',
'client/src/components/helix/ask-console/shared-live-room/__tests__/SharedLiveRoomPlayerEmbodimentPanel.spec.tsx',
'client/src/components/helix/ask-console/shared-live-room/__tests__/SharedLiveRoomSourceBindingsPanel.spec.tsx',
'client/e2e/onboarding-isolated/player-review-entry.tsx','client/e2e/onboarding-isolated/player-review-recovery.spec.ts',
'docs/work-packets/eh-g8-cs-player-review-recovery-v1.md'];
const result={schema:'helix.cs.player_review_recovery_evidence.v1',recorded_at:new Date().toISOString(),
program_gate:'G8',classification:'presentation',scope:'Deterministic unsaved same-player review recovery only',
component:{passed:15,files:2,duration_seconds:10.18,backing:'Actual React parent/child with normalized fixture HTTP responses'},
browser:{passed:2,duration_seconds:40.8,input_modes:['pointer','keyboard'],backing:'Production React controls and CSS with normalized fixture HTTP responses; no real action handler or gameplay'},
verified:['Same-player active-stale-active re-entry retains selected capabilities and proposed duration',
'Consent acknowledgement is cleared and Save is disabled after recovery',
'Different player, participant, source, world, room-source binding and environment do not inherit draft choices',
'Successful explicit fixture save clears the unsaved draft callback; callback carries no consent, pairing code or authority',
'No authority mutation is issued by browser recovery; no player review is written to localStorage'],
initial_failures:[{log:logs[0],reason:'Test used a non-owner, whose action controls are correctly hidden; corrected fixture'},
{log:logs[1],reason:'Valid red: Navigate was checked again after stale re-entry despite being deselected'},
{log:logs[2],reason:'Older activation test failed before acknowledgement; investigated existing fixture'},
{log:logs[3],reason:'Gating the readiness reply alone did not repair the older incomplete startup fixture'},
{log:logs[6],reason:'Browser beforeAll bundle exceeded the original 30-second test setup timeout; bounded test timeout changed to 90 seconds, without changing product budgets'}],
fixture_repairs:['Explicit readiness gate separates acknowledgement observation from the next fixture response',
'Activation fixture now supplies existing saved-profile selection lookup and strict startup receipt fields'],
client_build:{passed:true},docs_audit:{passed:true},discipline_quick:{passed:true,classification:'presentation'},
cache:{lifetime:'Mounted room panel only',maximum_entries:32,identity_fields:['room','participant','owner_role','environment','room_source_binding','source','world','subject_ref'],
retained_fields:['capabilityIds','autonomyMode','manualOverridePolicy','leaseMs'],excludes:['acknowledgement','authority','expiry_timestamp','credentials','pairing_codes','readiness'],
restart_persistence:false,profile_backup:false},
source_files:sources.map(file=>({file,sha256:sha(file)})),logs:logs.map(file=>({file:'.tmp/'+file,sha256:sha('.tmp/'+file)})),
live_gameplay_approved:false,gameplay_effects:0,live_repair_rehearsal:false,
cs1_complete:false,cs2_complete:false,cs3_complete:false,cs4_complete:false,original_et6_passed:false,nav1_qualified:false,
casimir_verification:{applicable:false,reason:'Presentation/application change; no physics, adapter contract, certificate or certified status change'}};
const target='docs/evidence/eh-g8-et6-continuous-session-build-v1/2026-09-14-player-review-tests.json';
fs.writeFileSync(target,JSON.stringify(result,null,2)+'\n',{flag:'wx'}); console.log(JSON.stringify({target,sha256:sha(target)}));
