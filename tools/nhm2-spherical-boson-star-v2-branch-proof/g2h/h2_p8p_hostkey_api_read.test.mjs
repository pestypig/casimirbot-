import test from 'node:test';
import assert from 'node:assert/strict';
import {readArgs,readObservation,readCleanupObservation} from './h2_p8p_hostkey_api_read.mjs';
import {proposedResources} from './h2_p8p_hostkey_resource_commands.mjs';
import {directArchivePackage} from './h2_p8p_direct_archive_package.mjs';
test('read-only exact project and zone; no mutating command admitted',()=>{
 for(const kind of ['instance','disk','snapshot','hostkeys','archive']){
  const args=readArgs(kind,'nhm2-synthetic');assert.ok(args.includes('--project=dark-stratum-455714-h4'));
  assert.equal(args.includes('--zone=us-east1-b'),kind!=='snapshot');
 }
 for(const kind of ['start','create','attach','delete','ssh','__proto__'])assert.throws(()=>readArgs(kind,'nhm2-synthetic'));
 for(const name of ['--help','nhm2-x;start','nhm2-x\n','other-vm'])assert.throws(()=>readArgs('instance',name));
});
function fixture(stdout='{}'){
 const records=[];let called=0;
 const args={kind:'instance',name:'nhm2-synthetic',deadline:60000,now:()=>0,record:async x=>records.push(x),
 processImpl:async(exe,argv,options)=>{called++;assert.ok(exe.endsWith('python.exe'));assert.equal(options.maxBytes,args.kind==='instance'&&args.name===proposedResources.helper?131072:65536);
  assert.equal(options.timeoutMs,30000);return {stdout,stderr:'',exitCode:0,terminationConfirmed:true};}};
 return {args,records,called:()=>called};
}
test('successful read preserves intent and raw receipt',async()=>{
 const f=fixture('{"id":"1"}');const r=await readObservation(f.args);
 assert.equal(r.data.id,'1');assert.equal(f.records.length,2);assert.equal(f.records[1].stdout,'{"id":"1"}');
});
for(const [label,stdout] of [['malformed','{'],['null','null'],['array','[]'],['oversize',' '.repeat(65537)]])
 test(`rejects ${label} output and preserves failure`,async()=>{
  const f=fixture(stdout);await assert.rejects(readObservation(f.args));assert.equal(f.records.at(-1).type,'read_failure');
 });
test('insufficient deadline dispatches nothing',async()=>{
 const f=fixture();f.args.deadline=10000;await assert.rejects(readObservation(f.args));assert.equal(f.called(),0);
});
test('failed persistence cannot return observation',async()=>{
 const f=fixture();f.args.record=async x=>{if(x.type==='read_result')throw Error('full');};
 await assert.rejects(readObservation(f.args),/full/);
});
test('direct archive query binds its own namespace and accepts API list shape',async()=>{
 const f=fixture('[]');f.args.kind='archive';
 assert.ok(readArgs('archive','nhm2-synthetic').includes('--query-path=nhm2-archive/'));
 assert.deepEqual((await readObservation(f.args)).data,[]);
 // An empty list is captured, but the downstream receipt validator rejects it.
});
test('cleanup describe dispatches despite full disk and marks incomplete evidence',async()=>{
 const f=fixture('{"status":"TERMINATED"}');f.args.name=proposedResources.helper;
 f.args.record=async()=>{throw Error('disk_full');};
 const r=await readCleanupObservation(f.args);
 assert.equal(f.called(),1);assert.match(r.receiptFailure,/disk_full/);
});
test('normal observation still refuses broken intent recording',async()=>{
 const f=fixture();f.args.record=async()=>{throw Error('disk_full');};
 await assert.rejects(readObservation(f.args),/disk_full/);assert.equal(f.called(),0);
});
test('cleanup evidence bypass is restricted to exact helper instance',()=>{
 const f=fixture();assert.throws(()=>readCleanupObservation(f.args),/cleanup_read_scope/);
});
test('real startup plus 16 KiB VM overhead fits helper read and record bounds',async()=>{
 const data={metadata:{items:[{key:'startup-script',value:directArchivePackage().startup}]},syntheticOverhead:'x'.repeat(16384)};
 const f=fixture(JSON.stringify(data));f.args.name=proposedResources.helper;
 assert.ok(Buffer.byteLength(JSON.stringify(data))>65536);
 const out=await readObservation(f.args);assert.deepEqual(out.data,data);
 const sizes=f.records.map(e=>Buffer.byteLength(JSON.stringify(e)));
 assert.ok(Math.max(...sizes)<262000);
});
