const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const asar = require('node:module').createRequire(path.resolve('apps/desktop/package.json'))('@electron/asar');
const root = path.resolve('apps/desktop/release-saved-server-20260913/win-unpacked');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function tree(dir, prefix = '') {
  const result = {};
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    const rel = prefix + entry.name;
    if (entry.isDirectory()) Object.assign(result, tree(path.join(dir, entry.name), rel + '/'));
    else if (entry.isFile()) result[rel] = sha(fs.readFileSync(path.join(dir, entry.name)));
    else throw new Error('Unexpected non-regular artifact: ' + rel);
  }
  return result;
}
function compare(a, b) {
  return {files_compared:Object.keys(a).length, mismatches:Object.keys(a).filter(k => a[k] !== b[k]), extras:Object.keys(b).filter(k => !Object.hasOwn(a,k))};
}
const staged = tree('apps/desktop/runtime');
const packed = tree(path.join(root,'resources/runtime'));
const runtime = compare(staged, packed);
const client = compare(tree('dist/public'), tree(path.join(root,'resources/runtime/dist/public')));
const host = tree('apps/desktop/dist');
const bundles = Object.fromEntries(Object.entries(host).map(([name, hash]) => [name, {sha256:hash, matches:hash === sha(asar.extractFile(path.join(root,'resources/app.asar'),path.join('dist', ...name.split('/'))))}]));
const result = {schema:'casimirbot.continuous_session_development_package.v1', observed_at:new Date().toISOString(), scope:'Development package content verification only; not launch or live acceptance', output:root, build_exit_code:0, runtime, client, bundles, exe_sha256:sha(fs.readFileSync(path.join(root,'CasimirBot.exe'))), source_commit:require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(), dirty_checkout:true, cs1_complete:false,cs2_complete:false,cs3_complete:false,cs4_complete:false,et6_passed:false,nav1_unlocked:false};
if ([runtime, client].some(r => r.mismatches.length || r.extras.length) || Object.values(bundles).some(b => !b.matches)) throw new Error(JSON.stringify(result));
fs.writeFileSync('docs/evidence/eh-g8-et6-continuous-session-build-v1/2026-09-13-saved-server-package.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(result));















