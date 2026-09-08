import test from 'node:test';
import assert from 'node:assert/strict';
import {executionClock,checkDiscoveryAdmission,boundedFinalWrite} from './h2_p8p_discovery_admission.mjs';
test('clock uses monotonic elapsed time',()=>{let mono=10;const now=executionClock(1000,()=>mono);mono=25;assert.equal(now(),1015);});
test('authorization binds scope, ledger and aggregate budget',()=>{
 const m={ledgerSha256:'a',expiry:'2026-09-12T14:00:00Z',runtimeSeconds:1200,costCeilingUsd:.1,
  priorReservedSeconds:12000,priorReservedUsd:1.6,aggregateSeconds:21600,aggregateUsd:12};
 const a={manifestSha256:'b',ledgerSha256:'a',scope:'one-retained-helper-discovery-startup-replacement-and-restart',
  helperId:'2570241336417567358',runtimeSeconds:1200,costCeilingUsd:.1,authorizedAt:'2026-09-07T12:00:00Z'};
 assert.equal(checkDiscoveryAdmission(m,a,'b',Date.parse('2026-09-07T13:00:00Z')),true);
 assert.throws(()=>checkDiscoveryAdmission(m,{...a,ledgerSha256:'changed'},'b',Date.parse(a.authorizedAt)));
 assert.throws(()=>checkDiscoveryAdmission({...m,priorReservedSeconds:21500},a,'b',Date.parse(a.authorizedAt)));
});
test('late final persistence cannot certify completion',async()=>{let now=0;
 await assert.rejects(boundedFinalWrite(async()=>{now=11;},{},()=>now,10),/late/);
});
