// Local-only R50 parent -> unchanged R48 composed runner fail-closed seam.
// A fake read provider fails account preflight before child or cloud effects.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import test from 'node:test';
import {runR50Parent} from './p8p-r50-parent-v1.mjs';
import {R50_ANCHOR_NAME,R50_PREPARED_HEADER}
  from './p8p-r50-ownership-v1.mjs';

const sourceRoot=String.raw`C:\NHM2-P8P-Workflow-Review`;
const load=name=>import(pathToFileURL(path.join(sourceRoot,name)).href);
const [admission,journal,handoff,composed]=await Promise.all([
  'p8p_r48_admission_gate_v1.mjs','p8p_r48_journal_v1.mjs',
  'p8p_r48_handoff_stage_v1.mjs','p8p_r48_composed_runner_v1.mjs'
].map(load));
const sha=body=>createHash('sha256').update(body).digest('hex');
const attempt='8'.repeat(64);
const iso=ms=>new Date(ms).toISOString().replace(/\.\d{3}Z$/,'Z');

test('R50 same-root parent reaches real composed R48 preflight and fails closed',
  async t=>{
    const temp=await fs.realpath(os.tmpdir());
    const baseRoot=await fs.mkdtemp(path.join(temp,'p8p-r50-composed-'));
    t.after(async()=>{
      const real=await fs.realpath(baseRoot);
      assert.ok(real.toLowerCase().startsWith(temp.toLowerCase()+path.sep));
      assert.ok(path.basename(real).startsWith('p8p-r50-composed-'));
      await fs.rm(real,{recursive:true,force:false});
    });
    await fs.writeFile(path.join(baseRoot,R50_ANCHOR_NAME),
      R50_PREPARED_HEADER,{flag:'wx'});
    const proposalBytes=Buffer.from('R50 composed local fixture. '.repeat(5));
    const proposalSha256=sha(proposalBytes);
    const startup=Buffer.from('#!/bin/bash\nexit 0\n');
    const startupPath=path.join(sourceRoot,`r48-startup-${attempt}.sh`);
    let readCalls=0,childCalls=0,effectCalls=0;
    const result=await runR50Parent({proposalBytes,proposalSha256,attempt,
      grant:{authorized:true,scope:'R48_CANDIDATE_NEUTRAL_RECOVERY_ONLY',
        proposalSha256,attempt,scientificAuthority:false,
        maxCostCents:100,maxHelperSeconds:1200,
        expiresAt:iso(Date.now()+3_600_000)},quotedWorstCaseCents:90,
      authenticateUserGrant:async request=>({pass:true,
        proposalSha256:request.proposalSha256,attempt:request.attempt,
        scope:request.scope})},{
      fixtureControlRoot:baseRoot,
      createAdmissionGate:admission.createR48AdmissionGate,
      createJournal:journal.createR48Journal,
      renderBundle:async()=>startup,
      stageStartup:async({scriptPath})=>({pass:true,path:scriptPath,
        sha256:sha(startup)}),
      stageHandoff:()=>{childCalls++;throw Error('unexpected_child');},
      bindRuntime:()=>({
        audit:async()=>{throw Error('unexpected_audit');},
        replayLayout:async()=>{throw Error('unexpected_replay');},
        readHelper:async()=>{throw Error('unexpected_helper');},
        tokenSupplier:async()=>{throw Error('unexpected_token');},
        fetchImpl:async()=>{throw Error('unexpected_network');},
        sdkExecute:async()=>{readCalls++;throw Error('fixture_read_failure');},
        effectExecute:async()=>{effectCalls++;throw Error('unexpected_effect');},
        effectInspect:async p=>({isFile:()=>p===startupPath,
          isSymbolicLink:()=>false,size:startup.length}),
        effectReadFile:async p=>{assert.equal(p,startupPath);return startup;},
      }),
      makeRunner:ports=>{
        assert.equal(ports.safetyEntryPath,path.join(sourceRoot,
          'p8p_r49_safety_cli_v1.mjs'));
        return composed.createR48ComposedRunner(ports);
      },
    });
    assert.equal(result.status,'R48_FAILED');
    assert.equal(result.scientificAuthority,false);
    // The controller independently retries source readback in its finally
    // path, without retrying the failed preflight or issuing a mutation.
    assert.equal(readCalls,2);
    assert.equal(childCalls,0);
    assert.equal(effectCalls,0);
    const attemptRoot=path.join(baseRoot,`r48-${attempt}`);
    assert.ok((await fs.readdir(attemptRoot)).includes('workload'));
    const audit=spawnSync('python',[
      path.join(sourceRoot,'audit_p8p_r48_journal_v1.py'),
      path.join(attemptRoot,'workload'),attempt,'workload'],
    {encoding:'utf8',timeout:5_000,maxBuffer:8_192});
    assert.equal(audit.status,0,audit.stderr);
    const replay=JSON.parse(audit.stdout);
    assert.equal(replay.validChain,true);
    assert.equal(replay.terminal,'R48_FAILED');
  });
