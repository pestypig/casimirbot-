import test from 'node:test';
import assert from 'node:assert/strict';
import {observeRecoveryAbsence} from './h2_p8p_recovery_absence.mjs';
import {readArgs} from './h2_p8p_hostkey_api_read.mjs';
test('four exact name checks use project-scoped read-only list commands',async()=>{
 const calls=[];
 const rows=await observeRecoveryAbsence({record:async()=>{},now:()=>0,deadline:100000,
  read:async o=>{calls.push(o);const a=readArgs(o.kind,o.name);assert.ok(a.includes('list'));
   assert.ok(a.includes('--project=dark-stratum-455714-h4'));assert.ok(a.includes(`--filter=name=${o.name}`));
   return {data:[],observedAt:new Date(0).toISOString()};}});
 assert.equal(rows.length,4);assert.equal(calls.length,4);
});
test('existing resource terminates checks',async()=>{
 let calls=0;
 await assert.rejects(observeRecoveryAbsence({record:async()=>{},now:()=>0,deadline:100000,
  read:async()=>{calls++;return {data:[{id:'1'}],observedAt:new Date(0).toISOString()};}}),/not_absent/);
 assert.equal(calls,1);
});
test('API error is not interpreted as absence',async()=>{
 await assert.rejects(observeRecoveryAbsence({record:async()=>{},now:()=>0,deadline:100000,
  read:async()=>{throw Error('permission_denied');}}),/permission_denied/);
});
