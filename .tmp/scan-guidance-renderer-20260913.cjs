const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve('apps/desktop/release-guidance-recovery-20260913/win-unpacked/resources/runtime/dist/public');
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
const manifest = [];
const controls = [];
const forbidden = ['fixture_unexpected_native_start', 'Review fixture device trust.', 'fixtureTrustSessions', 'fixture-trust-browser-session', 'onboarding-trust-handlers-', 'isolated-trust-account-resolver', 'fixture-private-read-failure', 'private-transport-detail', 'fixture-browser-session', 'fixture_human_route_required', 'ephemeralPairingVault', 'onboarding-real-handlers-'];
const hits = [];
function visit(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) { visit(file); continue; }
    if (!entry.isFile()) throw new Error('non_regular_artifact');
    const bytes = fs.readFileSync(file);
    const rel = path.relative(root, file).replaceAll('\\', '/');
    manifest.push([rel, hash(bytes)]);
    if (!/\.(js|html|json)$/.test(file)) continue;
    const text = bytes.toString('utf8');
    if (text.includes('expected_policy_revision') && text.includes('Recheck device trust')) controls.push({path: rel, sha256: hash(bytes)});
    for (const marker of forbidden) if (text.includes(marker)) hits.push({path: rel, marker});
  }
}
visit(root);
const asar = require('node:module').createRequire(path.resolve('apps/desktop/package.json'))('@electron/asar');
const serviceBytes = asar.extractFile(path.resolve('apps/desktop/release-guidance-recovery-20260913/win-unpacked/resources/app.asar'), 'dist/service.mjs');
const serviceText = serviceBytes.toString('utf8');
for (const marker of forbidden) if (serviceText.includes(marker)) hits.push({path: 'app.asar/dist/service.mjs', marker});
const serviceControls = serviceText.includes('device_trust_revision_changed') && serviceText.includes('expected_policy_revision');
if (!serviceControls) throw new Error('packaged_service_revision_guard_missing');
manifest.sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
if (!controls.length || hits.length) throw new Error(JSON.stringify({controls, hits}));
const result = {
  schema: 'casimirbot.guidance_recovery_renderer_evidence.v1', observed_at: new Date().toISOString(),
  service_bundle_sha256: hash(serviceBytes), service_revision_guard_markers_present: serviceControls,
  artifact_root: root, manifest_encoding: 'JSON sorted [relative POSIX path, SHA256] pairs',
  files: manifest.length, renderer_manifest_sha256: hash(JSON.stringify(manifest)),
  production_control_assets: controls, fixture_markers: forbidden, fixture_content_hits: hits,
  scope: 'Candidate renderer identity and known fixture-marker exclusion only; not native launch or live consent acceptance',
};
fs.writeFileSync('docs/evidence/eh-g8-et6-continuous-session-build-v1/2026-09-13-guidance-renderer.json', JSON.stringify(result, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify(result));

