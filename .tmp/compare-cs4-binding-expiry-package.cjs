const fs=require('node:fs'), path=require('node:path'), crypto=require('node:crypto');
const requireDesktop=require('node:module').createRequire(path.resolve('apps/desktop/package.json'));
const asar=requireDesktop('@electron/asar');
const root=path.resolve('apps/desktop/release-cs4-binding-expiry-20260908/win-unpacked');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function tree(dir,prefix='') { const out={}; for(const d of fs.readdirSync(dir,{withFileTypes:true})) {
 const rel=prefix+d.name; if(d.isDirectory()) Object.assign(out,tree(path.join(dir,d.name),rel+'/'));
 else if(d.isFile()) out[rel]=sha(fs.readFileSync(path.join(dir,d.name))); } return out; }
const staged=tree(path.resolve('apps/desktop/runtime')),packed=tree(path.join(root,'resources/runtime'));
const mismatches=Object.keys(staged).filter(k=>staged[k]!==packed[k]);
const extras=Object.keys(packed).filter(k=>!Object.hasOwn(staged,k));
const bundles=Object.fromEntries(['main.cjs','preload.cjs','service.mjs'].map(name=>{
 const source=sha(fs.readFileSync(path.resolve('apps/desktop/dist',name)));
 return [name,{sha256:source,matches:source===sha(asar.extractFile(path.join(root,'resources/app.asar'),'dist/'+name))}];}));
const exe=fs.readFileSync(path.join(root,'CasimirBot.exe'));
const result={scope:'Built package identity and content comparison; native recovery pending',output:root,
 build_exit_code:null,runtime_files_compared:Object.keys(staged).length,runtime_mismatches:mismatches,runtime_extras:extras,bundles,
 client_tree_sha256:sha(Object.entries(tree(path.resolve('dist/public'))).sort(([a],[b])=>a.localeCompare(b)).map(([a,b])=>a+'\0'+b).join('\n')),
 exe_size:exe.length,exe_sha256:sha(exe),cs1_complete:false,cs2_complete:false,cs3_complete:false,cs4_complete:false,et6_passed:false,nav1_unlocked:false};
if(mismatches.length||extras.length||Object.values(bundles).some(b=>!b.matches)) throw new Error(JSON.stringify(result));
fs.writeFileSync('docs/evidence/eh-g8-et6-continuous-session-build-v1/2026-09-08-cs4-binding-expiry-package.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));

