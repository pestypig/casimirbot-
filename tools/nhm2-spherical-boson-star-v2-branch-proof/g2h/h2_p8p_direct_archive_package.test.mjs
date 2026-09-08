import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {directArchivePackage} from './h2_p8p_direct_archive_package.mjs';
test('direct package deterministic and binds only direct entrypoint',()=>{
 const p=directArchivePackage();assert.equal(p.startup,directArchivePackage().startup);
 assert.equal(p.manifest.length,8);assert.ok(p.bootstrap.includes("root+'/h2_p8p_direct_archive_main.py'"));
 assert.ok(!p.bootstrap.includes("root+'/h2_p8p_hostkey_guest_main.py'"));
 assert.ok(Buffer.byteLength(p.startup)<200000);
});
test('retained helper package uses fresh exclusive root and distinct attempt identity',()=>{
 const old=directArchivePackage(),p=directArchivePackage({revision:'retained-helper-v1'});
 assert.notEqual(old.attemptId,p.attemptId);assert.notEqual(old.startupSha256,p.startupSha256);
 assert.deepEqual(old.manifest,p.manifest);
 assert.ok(p.bootstrap.includes("root='/var/lib/nhm2-direct-archive-retained-helper-v1'"));
 assert.ok(!p.bootstrap.includes("root='/var/lib/nhm2-direct-archive-v1'"));
 assert.ok(p.bootstrap.includes('os.mkdir(root,0o700)'));
 assert.ok(!p.bootstrap.includes('exist_ok'));
 assert.equal(p.startup,directArchivePackage({revision:'retained-helper-v1'}).startup);
 assert.throws(()=>directArchivePackage({revision:'anything'}),/package_revision/);
});
test('second retained package isolates bootstrap, attempt and fixture paths from consumed first successor',()=>{
 const one=directArchivePackage({revision:'retained-helper-v1'}),two=directArchivePackage({revision:'retained-helper-v2'});
 assert.notEqual(one.attemptId,two.attemptId);assert.notEqual(one.startupSha256,two.startupSha256);
 assert.ok(two.bootstrap.includes("root='/var/lib/nhm2-direct-archive-retained-helper-v2'"));
 assert.ok(two.bootstrap.includes("os.environ['NHM2_RECOVERY_REVISION']='retained-helper-v2'"));
 assert.ok(two.bootstrap.includes(two.attemptId));
});
test('actual Python parses bootstrap and verifies eight embedded source hashes',()=>{
 const p=directArchivePackage({revision:'retained-helper-v2'});
 const code="import ast,base64,json,sys,hashlib;t=ast.parse(sys.stdin.read());f=json.loads(base64.b64decode(t.body[1].value.args[0].args[0].value));assert len(f)==8;assert all(len(base64.b64decode(x['base64']))==x['bytes'] and hashlib.sha256(base64.b64decode(x['base64'])).hexdigest()==x['sha256'] for x in f);[ast.parse(base64.b64decode(x['base64'])) for x in f];print('NINE_PARSE_ONLY_PASS')";
 const python='C:/Users/dan/AppData/Local/NHM2/p8p-r22-gcloud-583.0.0/sdk/google-cloud-sdk/platform/bundledpython/python.exe';
 assert.equal(execFileSync(python,['-B','-c',code],{input:p.bootstrap,encoding:'utf8',timeout:5000,maxBuffer:4096,windowsHide:true}).trim(),'NINE_PARSE_ONLY_PASS');
});
