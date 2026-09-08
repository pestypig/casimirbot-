import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Read-only inspection of selected source/artifact paths; writes only this evidence directory.
const root = process.cwd();
const out = path.dirname(fileURLToPath(import.meta.url));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const relative = absolute => path.relative(root, absolute).replaceAll('\\', '/');
const selected = [
  'package.json','package-lock.json','sdk/package.json','cli/package.json',
  'packages/create-casimir-verifier/package.json','packages/create-casimir-verifier/LICENSE',
  'apps/desktop/package.json','apps/desktop/package-lock.json',
  'apps/desktop/electron-builder.config.cjs','apps/desktop/scripts/stage-runtime.mjs',
  'apps/desktop/scripts/build-host.mjs','apps/desktop/scripts/provider-neutral-runtime-guard-lib.mjs',
  'apps/desktop/tunnel-client.v1.json','apps/desktop/runtime/runtime-manifest.json',
  'apps/desktop/release/win-unpacked/resources/runtime/runtime-manifest.json',
  'apps/desktop/release/win-unpacked/LICENSE.electron.txt',
  'apps/desktop/release/win-unpacked/LICENSES.chromium.html',
  'apps/desktop/release/win-unpacked/resources/app.asar',
  'apps/desktop/vendor/tunnel-client/v0.0.13/windows-amd64/expanded/LICENSE',
  'apps/desktop/vendor/tunnel-client/v0.0.13/windows-amd64/expanded/NOTICE',
  'apps/desktop/vendor/tunnel-client/v0.0.13/windows-amd64/expanded/tunnel-client-v0.0.13-windows-amd64-licenses.txt',
  'plugins/casimirbot-device-check/.codex-plugin/plugin.json',
  'minecraft/helix-fabric-player-agent/build.gradle.kts',
  'minecraft/helix-fabric-player-agent/src/main/resources/fabric.mod.json',
  'minecraft/helix-fabric-sensor/build.gradle.kts',
  'minecraft/helix-fabric-sensor/src/main/resources/fabric.mod.json',
  'docs/work-packets/eh-mc-baritone-v1.15.0-compatibility-license-v1.md',
  'node_modules/mapbox-gl/LICENSE.txt','node_modules/@plotly/mapbox-gl/LICENSE.txt',
  'node_modules/maplibre-gl/LICENSE.txt',
  'apps/desktop/release/win-unpacked/resources/app.asar.unpacked/node_modules/@img/sharp-win32-x64/package.json',
  'apps/desktop/release/win-unpacked/resources/app.asar.unpacked/node_modules/@img/sharp-win32-x64/LICENSE',
  'apps/desktop/release/win-unpacked/resources/app.asar.unpacked/node_modules/@img/sharp-win32-x64/versions.json',
];
const observed = selected.map(p => {
  if (!fs.existsSync(path.join(root,p))) return {path:p,present:false};
  const data=fs.readFileSync(path.join(root,p));
  const item={path:p,present:true,bytes:data.length,sha256:hash(data)};
  if(p.endsWith('package.json')) {
    const j=JSON.parse(data); Object.assign(item,{name:j.name,version:j.version,license:j.license??null,private:j.private??null});
  }
  return item;
});
const require = createRequire(path.join(root,'apps/desktop/package.json'));
const asar = require('@electron/asar');
const archive = path.join(root,'apps/desktop/release/win-unpacked/resources/app.asar');
const archivePaths = asar.listPackage(archive).map(p=>p.replaceAll('\\','/').replace(/^\//,''));
const archivedPackages = archivePaths.filter(p=>p.endsWith('/package.json')||p==='package.json').map(p=>{
  try {const b=asar.extractFile(archive,path.normalize(p));const j=JSON.parse(b);return {path:p,sha256:hash(b),name:j.name,version:j.version,license:j.license??null,private:j.private??null};}
  catch(e){return {path:p,inspection_error:String(e.message)};}
});
const archiveLicensePaths=archivePaths.filter(p=>/(?:^|\/)(?:licen[cs]e[^/]*|copying[^/]*|notice[^/]*)$/i.test(p));
const walk = dir => !fs.existsSync(dir)?[]:fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const physicalRoots=['apps/desktop/release/win-unpacked/resources/runtime','apps/desktop/release/win-unpacked/resources/app.asar.unpacked'];
const physical=physicalRoots.flatMap(p=>walk(path.join(root,p))).map(p=>relative(p));
const interestingPhysical=physical.filter(p=>/(?:licen[cs]e|notice|copying|\.dll$|\.node$|\.jar$|\.woff2?$|\.ttf$|\.otf$|\.geojson$|\.mbtiles$)/i.test(p)).map(p=>{const b=fs.readFileSync(path.join(root,p));return {path:p,bytes:b.length,sha256:hash(b)};});
const allPublic=walk(path.join(root,'apps/desktop/release/win-unpacked/resources/runtime/dist/public'));
const publicExtensions={}; for(const p of allPublic){const ext=path.extname(p);publicExtensions[ext]=(publicExtensions[ext]??0)+1;}
const lock=JSON.parse(fs.readFileSync(path.join(root,'package-lock.json')));
const mapMetadata=Object.entries(lock.packages??{}).filter(([p])=>/(?:mapbox|maplibre|leaflet|three-globe|globe\.gl)/i.test(p)).map(([p,j])=>({path:p,version:j.version,license:j.license??null,dependencies:j.dependencies??{},optional:j.optional??false,dev:j.dev??false}));
const result={schema:'casimirbot.cfp1.rights_source_inspection.v1',captured_utc:new Date().toISOString(),head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),scope:'Selected source/metadata and standard unpacked artifact inspection only; moving staging is not a frozen release; no runtime execution, signature, title, or rights clearance.',observed,archive_file_count:archivePaths.length,archivedPackages,archiveLicensePaths,interestingPhysical,public_asset_extension_counts:publicExtensions,mapMetadata,archive_map_codex_baritone_paths:archivePaths.filter(p=>/mapbox|maplibre|leaflet|baritone|(?:^|\/)codex(?:\.exe|\.cmd|\.ps1)?$|@openai\/codex/.test(p))};
fs.writeFileSync(path.join(out,'rights-source-inspection.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({captured_utc:result.captured_utc,files:observed.length,archive_files:archivePaths.length,archived_packages:archivedPackages.length,physical_license_native_records:interestingPhysical.length,map_packages:mapMetadata.length}));
