const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve('apps/desktop/release-trust-read-recovery-20260913/win-unpacked/resources/runtime/dist/public');
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
const manifest = [];
const controls = [];
const forbidden = ['fixture-private-read-failure', 'private-transport-detail', 'fixture-browser-session', 'fixture_human_route_required', 'ephemeralPairingVault', 'onboarding-real-handlers-'];
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
    if (text.includes('Recheck device trust')) controls.push({path: rel, sha256: hash(bytes)});
    for (const marker of forbidden) if (text.includes(marker)) hits.push({path: rel, marker});
  }
}
visit(root);
manifest.sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
if (!controls.length || hits.length) throw new Error(JSON.stringify({controls, hits}));
const result = {
  schema: 'casimirbot.trust_read_renderer_evidence.v1', observed_at: new Date().toISOString(),
  artifact_root: root, manifest_encoding: 'JSON sorted [relative POSIX path, SHA256] pairs',
  files: manifest.length, renderer_manifest_sha256: hash(JSON.stringify(manifest)),
  production_control_assets: controls, fixture_markers: forbidden, fixture_content_hits: hits,
  scope: 'Candidate renderer identity and known fixture-marker exclusion only; not native launch or live consent acceptance',
};
fs.writeFileSync('docs/evidence/eh-g8-et6-continuous-session-build-v1/2026-09-13-trust-read-renderer.json', JSON.stringify(result, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify(result));
