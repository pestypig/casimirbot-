import test from 'node:test';
import assert from 'node:assert/strict';
import {discoveryReadPlan,readDiscovery} from './h2_p8p_discovery_read.mjs';
const name='nhm2-p8p-cv2-hostkey-helper-20260905',attempt='a'.repeat(64);
test('cleanup scope and exhausted persistence preserve valid observation',async()=>{
 await assert.rejects(readDiscovery({kind:'serial',name,attempt,cleanup:true}),/cleanup_scope/);
 let clock=0;
 const result=await readDiscovery({kind:'instance',name,deadline:100000,now:()=>clock,cleanup:true,
  record:e=>{if(e.type==='discovery_read_bytes')clock=6000;},
  processImpl:async()=>({stdout:'{"status":"TERMINATED"}',stderr:'',exitCode:0,terminationConfirmed:true})});
 assert.equal(result.data.status,'TERMINATED');assert.ok(result.receiptFailure);
});
test('process exception retains exit identity',async()=>{
 const events=[];
 await assert.rejects(readDiscovery({kind:'serial',name,attempt,deadline:100000,now:()=>0,record:e=>events.push(e),
  processImpl:async()=>{throw Object.assign(Error('failed'),{exitCode:1,pid:42,stdout:'',stderr:'error',terminationConfirmed:true});}}));
 const result=events.find(e=>e.type==='discovery_read_result');
 assert.equal(result.exitCode,1);assert.equal(result.pid,42);assert.match(result.error,/failed/);
});
test('larger startup and serial caps use bounded chunk records',async()=>{
 const events=[],stdout=JSON.stringify({contents:'x'.repeat(160000)});
 const result=await readDiscovery({kind:'serial',name,attempt,deadline:100000,now:()=>0,record:e=>events.push(e),
  processImpl:async()=>({stdout,stderr:'',exitCode:0,terminationConfirmed:true})});
 assert.equal(result.data.contents.length,160000);
 const chunks=events.filter(e=>e.type==='discovery_read_bytes');
 assert.ok(chunks.length>1);assert.ok(chunks.every(e=>e.base64.length<=65536));
 assert.equal(discoveryReadPlan('instance',name).cap,262144);
});
test('unknown diagnostic identity rejected and failed output retained',async()=>{
 assert.throws(()=>discoveryReadPlan('diagnostic','other',attempt));
 const events=[];
 await assert.rejects(readDiscovery({kind:'serial',name,attempt,deadline:100000,now:()=>0,record:e=>events.push(e),
  processImpl:async()=>({stdout:'partial',stderr:'failed',exitCode:1,terminationConfirmed:true})}));
 assert.equal(events.filter(e=>e.type==='discovery_read_bytes').length,2);
});
