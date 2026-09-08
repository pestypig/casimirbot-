import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,statSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {boundedProcess} from './h2_p8p_charter_v2_process.mjs';
import {cappedSink} from './h2_p8p_charter_v2_capped_sink.mjs';
import {plinkArgs,commandFile} from './h2_p8p_charter_v2_plink_args.mjs';
test('plink command file and batch arguments are literal',()=>{
  const a=plinkArgs('192.0.2.1');assert.equal(a.at(-1),'pestypig@192.0.2.1');
  for(const flag of ['-batch','-T','-noagent','-noshare','-no-sanitise-stdout'])assert.equal(a.filter(x=>x===flag).length,1);
  assert.equal(a[a.indexOf('-m')+1],commandFile);
  assert.equal(readFileSync(commandFile,'utf8').trim(),'exec cat -- /home/pestypig/nhm2-h2-p8p-r40-fixture-evidence-export-v1.tgz');
});
test('actual child binary stdout reaches capped sink unchanged',async()=>{
  const p=join(mkdtempSync(join(tmpdir(),'nhm2-stream-')),'a'),s=cappedSink(p,4);
  try{await boundedProcess(process.execPath,['-e','process.stdout.write(Buffer.from([0,255,13,10]))'],{timeoutMs:2000,onStdout:b=>s.accept(b)});s.finish();assert.deepEqual(readFileSync(p),Buffer.from([0,255,13,10]));}finally{s.closePartial();}
});
test('actual child oversize output is rejected before file growth',async()=>{
  const p=join(mkdtempSync(join(tmpdir(),'nhm2-overflow-')),'a'),s=cappedSink(p,4);
  try{await assert.rejects(boundedProcess(process.execPath,['-e','process.stdout.write(Buffer.alloc(65536));setInterval(()=>{},1000)'],{timeoutMs:2000,onStdout:b=>s.accept(b)}),/stdout_sink/);assert.ok(statSync(p).size<=4);}finally{s.closePartial();}
});
