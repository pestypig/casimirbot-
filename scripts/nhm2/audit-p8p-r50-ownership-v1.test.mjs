import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {claimR50HostAnchor,reserveR50LocalAttempt,
  R50_ANCHOR_NAME,R50_PREPARED_HEADER} from './p8p-r50-ownership-v1.mjs';

const auditor=fileURLToPath(new URL('./audit-p8p-r50-ownership-v1.py',
  import.meta.url));
const journalPath=String.raw`C:\NHM2-P8P-Workflow-Review\p8p_r48_journal_v1.mjs`;
const {createR48Journal}=await import(new URL(`file:///${journalPath.replaceAll('\\','/')}`));
const attempt='b'.repeat(64),proposal='c'.repeat(64);
const expiry='2026-09-25T21:00:00Z';
const clock=()=>new Date('2026-09-25T20:00:00Z');
const run=(root)=>spawnSync('python',[auditor,root,attempt,proposal],
  {encoding:'utf8',timeout:5_000,maxBuffer:8_192});

async function fixture(t) {
  const temp=await fs.realpath(os.tmpdir());
  const root=await fs.mkdtemp(path.join(temp,'p8p-r50-audit-'));
  t.after(async()=>{
    const real=await fs.realpath(root);
    assert.equal(path.dirname(real).toLowerCase(),temp.toLowerCase());
    assert.ok(path.basename(real).startsWith('p8p-r50-audit-'));
    await fs.rm(real,{recursive:true,force:false});
  });
  await fs.writeFile(path.join(root,R50_ANCHOR_NAME),R50_PREPARED_HEADER,
    {flag:'wx'});
  const anchor=await claimR50HostAnchor({baseRoot:root,attempt,
    proposalSha256:proposal});
  const reservation=await reserveR50LocalAttempt({baseRoot:root,attempt,
    proposalSha256:proposal,maxCostCents:100,maxHelperSeconds:1200,
    expiresAt:expiry,anchor,clock,createJournal:createR48Journal,
    authorize:async()=>({authorized:true,
      scope:'R48_CANDIDATE_NEUTRAL_RECOVERY_ONLY',attempt,
      proposalSha256:proposal,maxCostCents:100,maxHelperSeconds:1200,
      expiresAt:expiry,scientificAuthority:false})});
  await reservation.workload.close();
  return {root,reservation};
}

test('Python independently reconstructs R50 ownership hashes and first journal',
  async t=>{
    const {root,reservation}=await fixture(t);
    const result=run(root);
    assert.equal(result.status,0,result.stderr);
    const receipt=JSON.parse(result.stdout);
    assert.equal(receipt.pass,true);
    assert.equal(receipt.reservationSha256,reservation.reservationSha256);
    assert.equal(receipt.scientificAuthority,false);
  });

test('Python rejects a changed reservation authority field',async t=>{
  const {root,reservation}=await fixture(t);
  const file=path.join(reservation.root,'reservation.jsonl');
  const original=await fs.readFile(file,'utf8');
  assert.ok(original.includes('"scientificAuthority":false'));
  await fs.writeFile(file,original.replace('"scientificAuthority":false',
    '"scientificAuthority":true'));
  const result=run(root);
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/r50_audit_reservation/);
});

test('Python rejects anchor claim drift after reservation',async t=>{
  const {root}=await fixture(t);
  const file=path.join(root,R50_ANCHOR_NAME);
  const original=await fs.readFile(file,'utf8');
  assert.ok(original.includes('"proposalSha256":"'+proposal+'"'));
  await fs.writeFile(file,original.replace(proposal,'d'.repeat(64)));
  const result=run(root);
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/r50_audit_claim/);
});

test('Python rejects a changed workload reservation hash',async t=>{
  const {root,reservation}=await fixture(t);
  const file=path.join(reservation.root,'workload','journal.jsonl');
  const original=await fs.readFile(file,'utf8');
  assert.ok(original.includes(reservation.reservationSha256));
  await fs.writeFile(file,original.replace(reservation.reservationSha256,
    'e'.repeat(64)));
  const result=run(root);
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/r50_audit_journal/);
});

test('Python rejects duplicate JSON claim keys',async t=>{
  const {root}=await fixture(t);
  const file=path.join(root,R50_ANCHOR_NAME);
  const original=await fs.readFile(file,'utf8');
  assert.ok(original.includes('"scope":"R48_CANDIDATE_NEUTRAL_RECOVERY_ONLY"'));
  await fs.writeFile(file,original.replace('"scope":',
    '"attempt":"'+attempt+'","scope":'));
  const result=run(root);
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/r50_audit_duplicate_key/);
});
