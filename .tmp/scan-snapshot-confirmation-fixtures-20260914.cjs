const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const asar = require('node:module').createRequire(path.resolve('apps/desktop/package.json'))('@electron/asar');
const root = path.resolve('apps/desktop/release-snapshot-confirmation-20260914/win-unpacked');
const markers = ['ReadinessFixturePlayer','Synthetic bounded readiness perception','room:player-review-fixture','subject:player-review-alice','fixture:origin-provider','chat:origin-exact','pairing-origin-browser-','minecraft_launcher_native_observation_fixture.v1','fixture-selected-profile','minecraft_launcher_profile_fixture.v1','fixture_private_observation_failure','fixture-private-property','minecraft_server_lifecycle_fixture.v1','fixture_lost_start_reply','inert fixture; never executed','fixture_mutex_ready','minecraft-pending-bootstrap-fixture','pending-bootstrap-owner','fixture-browser-session','fixture_human_route_required','fixture_provider_denied','ephemeralPairingVault','onboarding-real-handlers-','STEERING_PROCESS_FIXTURE_KEY','FIXTURE_RESULT:','steering_process_fixture_failed','CASIMIR_ONBOARDING_POSTGRES_TEST_URL','onboarding_fixture','fixture-human-consent','fixture-native-human-approved-request','fixture-native-owner','private-expiry-sentinel','private-diagnostic-sentinel','fixture-ready-native-owner','fixture-private-sql-and-token','fixture-private-binding-storage','fixture-read-owner','fixture-confirm-owner','fixture-volatile-confirmation'];
const pathHits = [], contentHits = []; let count = 0;
function inspect(name, bytes) {
  if (/(__tests__|onboarding-isolated|steering-process-recovery)/.test(name)) pathHits.push(name);
  if (!/\.(?:[cm]?js|json|html|css|ts|tsx|md|txt|ps1)$/.test(name)) return;
  count++; const text = bytes.toString('utf8');
  for (const marker of markers) if (text.includes(marker)) contentHits.push({name,marker});
}
function walk(dir, prefix) { for (const entry of fs.readdirSync(dir,{withFileTypes:true})) {
  const file = path.join(dir,entry.name), name = prefix+'/'+entry.name;
  if (entry.isDirectory()) walk(file,name); else if (entry.isFile()) inspect(name,fs.readFileSync(file));
} }
walk(path.join(root,'resources/runtime'),'runtime');
const archive=path.join(root,'resources/app.asar');
for(const name of asar.listPackage(archive)) {
  const relative=name.replace(/^[/\\]/,'');
  if (!asar.statFile(archive,relative).files) inspect('app/'+relative,asar.extractFile(archive,relative));
}
const service=asar.extractFile(archive,'dist/service.mjs').toString('utf8');
const controls=Object.fromEntries(['binding_failure_phase','reasoning_binding_verification_failed','failure_phase','environment_session_request_invalid','durable_goal_evidence_stale','evidence_freshness','helix_reasoning_destination_register','helix_reasoning_pairing_accept','helix_reasoning_pairing_recover','steering_revision_invalid','pairing_request_cancelled','helix.pairing_request_cancellation.v1'].map(key=>[key,service.includes(key)]));
const result={schema:'casimirbot.onboarding_package_fixture_scan.v1',observed_at:new Date().toISOString(),exe_sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'CasimirBot.exe'))).digest('hex'),scanned_text_files:count,fixture_markers:markers,fixture_path_hits:pathHits,fixture_content_hits:contentHits,production_positive_controls:controls,scope:'Known fixture exclusion only; not authentication bypass proof'};
if(pathHits.length||contentHits.length||Object.values(controls).some(x=>!x)) throw new Error(JSON.stringify(result));
fs.writeFileSync('docs/evidence/eh-g8-et6-continuous-session-build-v1/2026-09-14-snapshot-confirmation-fixture-scan.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(result));












