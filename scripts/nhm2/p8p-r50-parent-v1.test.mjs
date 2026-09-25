import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import test from 'node:test';
import {runR50Parent} from './p8p-r50-parent-v1.mjs';
import {R50_ANCHOR_NAME} from './p8p-r50-ownership-v1.mjs';

const baseRoot=String.raw`C:\NHM2-P8P-Workflow-Review`;
const gatePath=path.join(baseRoot,'p8p_r48_admission_gate_v1.mjs');
const available=existsSync(gatePath);
const createAdmissionGate=available?
  (await import(pathToFileURL(gatePath).href)).createR48AdmissionGate:null;
const attempt='a'.repeat(64);
const proposalBytes=Buffer.from('Candidate-neutral R50 parent fixture. '.repeat(4));
const proposalSha256=createHash('sha256').update(proposalBytes).digest('hex');
const clock=()=>Date.parse('2026-09-20T20:00:00Z');
const grant={authorized:true,scope:'R48_CANDIDATE_NEUTRAL_RECOVERY_ONLY',
  proposalSha256,attempt,scientificAuthority:false,maxCostCents:100,
  maxHelperSeconds:1200,expiresAt:'2026-09-20T21:00:00Z'};

function fixture({anchorName=R50_ANCHOR_NAME,authenticated=true}={}) {
  const trace=[];
  const workload={root:path.join(baseRoot,`r48-${attempt}`,'workload'),
    close:async()=>trace.push('closed')};
  const options={proposalBytes,proposalSha256,attempt,grant,
    quotedWorstCaseCents:100,
    authenticateUserGrant:async request=>{
      trace.push('grant');return {pass:authenticated,
        proposalSha256:request.proposalSha256,attempt:request.attempt,
        scope:request.scope};}};
  const deps={createAdmissionGate,clock,
    claimHost:async()=>{trace.push('anchor');return {pass:true,
      path:path.join(baseRoot,anchorName),
      sha256:'c'.repeat(64),claimSha256:'d'.repeat(64)};},
    reserveLocal:async args=>{trace.push('reserve');
      assert.equal(args.anchor.path,path.join(baseRoot,R50_ANCHOR_NAME));
      assert.equal((await args.authorize()).authorized,true);
      return {reserved:true,root:path.join(baseRoot,`r48-${attempt}`),
        captureRoot:path.join(baseRoot,`r48-${attempt}`,'capture'),
        workload,proposalSha256,expiresAt:grant.expiresAt};},
    createJournal:async()=>{throw Error('JOURNAL_MUST_NOT_RUN')},
    bindRuntime:()=>({audit:async()=>{},replayLayout:async()=>{},
      readHelper:async()=>{},tokenSupplier:async()=>{},
      fetchImpl:async()=>{}}),
    renderBundle:async()=>Buffer.from('#!/bin/bash\n'+'x'.repeat(100)),
    stageStartup:async({scriptPath})=>{trace.push('stage');
      assert.equal(scriptPath,path.join(baseRoot,
        `r48-startup-${attempt}.sh`));
      return {pass:true,path:scriptPath,sha256:'e'.repeat(64)};},
    stageHandoff:async()=>{throw Error('HANDOFF_MUST_NOT_RUN')},
    makeRunner:args=>{trace.push('runner-bind');return {run:async()=>{
      trace.push('runner-run');
      assert.equal(args.safetyEntryPath,
        path.join(baseRoot,'p8p_r49_safety_cli_v1.mjs'));
      assert.equal(args.safetyEntrySha256,
        'ccbb80800a532068a7773b0afdd2e3507af2602031ef679c4466f10e5922f355');
      await args.renderStartup({attempt,
        path:path.join(baseRoot,`r48-startup-${attempt}.sh`)});
      return {status:'LOCAL_FIXTURE',scientificAuthority:false};
    }};},
  };
  return {options,deps,trace};
}

test('new anchor admits same-root parent startup and corrected child path',
  {skip:!available},async()=>{
    const f=fixture();
    const result=await runR50Parent(f.options,f.deps);
    assert.deepEqual(result,{status:'LOCAL_FIXTURE',
      scientificAuthority:false});
    assert.deepEqual(f.trace,['grant','anchor','reserve','runner-bind',
      'runner-run','stage','closed']);
  });

test('consumed R48 anchor path fails before reservation',
  {skip:!available},async()=>{
    const f=fixture({anchorName:'r48-host-anchor-v1.jsonl'});
    await assert.rejects(runR50Parent(f.options,f.deps),
      /r50_parent_anchor/);
    assert.deepEqual(f.trace,['grant','anchor']);
  });

test('denied admission fails before anchor', {skip:!available},async()=>{
  const f=fixture({authenticated:false});
  await assert.rejects(runR50Parent(f.options,f.deps),
    /r48_admission_user_authority/);
  assert.deepEqual(f.trace,['grant']);
});

test('caller cannot replace root or runner through request options',()=>{
  assert.rejects(runR50Parent({baseRoot:'C:\\other'}),
    /r50_parent_override/);
  assert.rejects(runR50Parent({makeRunner:()=>{}}),
    /r50_parent_override/);
});

test('trusted fixture root cannot redirect parent into production root',
  {skip:!available},async()=>{
    const f=fixture();
    await assert.rejects(runR50Parent(f.options,
      {...f.deps,fixtureControlRoot:baseRoot}),
    /r50_parent_fixture_scope/);
    assert.deepEqual(f.trace,[]);
  });
