import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {startupPackage} from './h2_p8p_hostkey_startup_package.mjs';
test('deterministic exact three-source startup package',()=>{
 const a=startupPackage(),b=startupPackage();assert.equal(a.startup,b.startup);
 assert.equal(a.manifest.length,3);assert.match(a.attemptId,/^[a-f0-9]{64}$/);
 assert.ok(a.startup.includes('--kill-after=60s 900s'));
 assert.ok(!a.startup.includes('curl '));assert.ok(Buffer.byteLength(a.startup)<200000);
});
test('generated bootstrap and embedded guest files parse with actual Python',()=>{
 const p=startupPackage();
 const python='C:/Users/dan/AppData/Local/NHM2/p8p-r22-gcloud-583.0.0/sdk/google-cloud-sdk/platform/bundledpython/python.exe';
 const check="import ast,sys,base64,json,hashlib;s=sys.stdin.read();tree=ast.parse(s);encoded=tree.body[1].value.args[0].args[0].value;files=json.loads(base64.b64decode(encoded));assert len(files)==3;[(ast.parse(base64.b64decode(f['base64'])),None) for f in files];assert all(len(base64.b64decode(f['base64']))==f['bytes'] and hashlib.sha256(base64.b64decode(f['base64'])).hexdigest()==f['sha256'] for f in files);print('PARSE_ONLY_4_PASS')";
 const result=execFileSync(python,['-B','-c',check],{input:p.bootstrap,encoding:'utf8',timeout:5000,maxBuffer:4096,windowsHide:true});
 assert.equal(result.trim(),'PARSE_ONLY_4_PASS');
});
