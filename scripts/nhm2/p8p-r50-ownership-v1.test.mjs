import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {claimR50HostAnchor,reserveR50LocalAttempt,
  R50_ANCHOR_NAME,R50_PREPARED_HEADER} from './p8p-r50-ownership-v1.mjs';

const attempt='a'.repeat(64);
const proposalSha256='b'.repeat(64);
const expiry='2026-09-24T21:00:00Z';
const clock=()=>new Date('2026-09-24T20:00:00Z');
const grant={authorized:true,scope:'R48_CANDIDATE_NEUTRAL_RECOVERY_ONLY',
  attempt,proposalSha256,maxCostCents:100,maxHelperSeconds:1200,
  expiresAt:expiry,scientificAuthority:false};

async function fixture(run) {
  const baseRoot=await fs.mkdtemp(path.join(os.tmpdir(),'p8p-r50-'));
  try {return await run(baseRoot);}
  finally {
    assert.equal(path.dirname(baseRoot),os.tmpdir());
    assert.match(path.basename(baseRoot),/^p8p-r50-/);
    await fs.rm(baseRoot,{recursive:true,force:false});
  }
}

test('new prepared anchor is claimed once without touching consumed R48 anchor',
  async()=>fixture(async baseRoot=>{
    const old=path.join(baseRoot,'r48-host-anchor-v1.jsonl');
    const oldBytes=Buffer.from('consumed-r48-anchor\n');
    await fs.writeFile(old,oldBytes,{flag:'wx'});
    const next=path.join(baseRoot,R50_ANCHOR_NAME);
    await fs.writeFile(next,R50_PREPARED_HEADER,{flag:'wx'});
    const anchor=await claimR50HostAnchor({baseRoot,attempt,proposalSha256});
    assert.equal(anchor.path,next);
    assert.equal(anchor.pass,true);
    assert.deepEqual(await fs.readFile(old),oldBytes);
    await assert.rejects(claimR50HostAnchor({baseRoot,attempt,
      proposalSha256}),/r50_anchor_unprepared_or_consumed/);
    assert.deepEqual(await fs.readFile(old),oldBytes);
  }));

test('new anchor does not accept an old R48 pathname',async()=>fixture(
  async baseRoot=>{
    await fs.writeFile(path.join(baseRoot,'r48-host-anchor-v1.jsonl'),
      R50_PREPARED_HEADER,{flag:'wx'});
    await assert.rejects(claimR50HostAnchor({baseRoot,attempt,
      proposalSha256}),{code:'ENOENT'});
  }));

test('authorized reservation uses fresh attempt root and new anchor identity',
  async()=>fixture(async baseRoot=>{
    await fs.writeFile(path.join(baseRoot,R50_ANCHOR_NAME),
      R50_PREPARED_HEADER,{flag:'wx'});
    const anchor=await claimR50HostAnchor({baseRoot,attempt,proposalSha256});
    const events=[];
    const createJournal=async ({root,channel})=>{
      assert.equal(root,path.join(baseRoot,`r48-${attempt}`,'workload'));
      assert.equal(channel,'workload');
      return {root,append:async event=>{
        events.push(event);return {durable:true};},close:async()=>{}};
    };
    const args={baseRoot,attempt,proposalSha256,maxCostCents:100,
      maxHelperSeconds:1200,expiresAt:expiry,anchor,
      authorize:async()=>grant,clock,createJournal};
    const reservation=await reserveR50LocalAttempt(args);
    assert.equal(reservation.reserved,true);
    assert.equal(reservation.root,path.join(baseRoot,`r48-${attempt}`));
    const raw=await fs.readFile(path.join(reservation.root,
      'reservation.jsonl'),'utf8');
    const record=JSON.parse(raw);
    assert.equal(record.schema,'nhm2.p8p.r50.local-reservation.v1');
    assert.equal(record.hostAnchorSha256,anchor.sha256);
    assert.equal(record.hostClaimSha256,anchor.claimSha256);
    assert.deepEqual(events.map(event=>event.event),['RESERVED']);
    await assert.rejects(reserveR50LocalAttempt(args),/r50_local_exists/);
  }));

test('old anchor and denied grant cannot reserve',async()=>fixture(
  async baseRoot=>{
    const oldAnchor={pass:true,
      path:path.join(baseRoot,'r48-host-anchor-v1.jsonl'),
      sha256:'c'.repeat(64),claimSha256:'d'.repeat(64)};
    const base={baseRoot,attempt,proposalSha256,maxCostCents:100,
      maxHelperSeconds:1200,expiresAt:expiry,clock,
      createJournal:async()=>{throw Error('JOURNAL_MUST_NOT_RUN')},
      authorize:async()=>grant};
    await assert.rejects(reserveR50LocalAttempt({...base,
      anchor:oldAnchor}),/r50_local_binding/);
    const newAnchor={...oldAnchor,
      path:path.join(baseRoot,R50_ANCHOR_NAME)};
    await assert.rejects(reserveR50LocalAttempt({...base,
      anchor:newAnchor,authorize:async()=>({...grant,authorized:false})}),
    /r50_local_not_authorized/);
    await assert.rejects(fs.lstat(path.join(baseRoot,`r48-${attempt}`)),
      {code:'ENOENT'});
  }));
