// Local candidate-neutral qualification of the frozen external R49 sources.
// Every cloud, filesystem-write, runner, and journal effect is replaced here.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import test from 'node:test';

const sourceRoot=process.env.NHM2_P8P_WORKFLOW_REVIEW_ROOT ??
  String.raw`C:\NHM2-P8P-Workflow-Review`;
const boundPath=path.join(sourceRoot,'p8p_r49_bound_entry_v1.mjs');
const cliPath=path.join(sourceRoot,'p8p_r49_safety_cli_v1.mjs');
const r48BoundPath=path.join(sourceRoot,'p8p_r48_bound_entry_v1.mjs');
const r48CliPath=path.join(sourceRoot,'p8p_r48_safety_cli_v1.mjs');
const available=[boundPath,cliPath,r48BoundPath,r48CliPath].every(existsSync);
const bound=available?await import(pathToFileURL(boundPath).href):null;
const cli=available?await import(pathToFileURL(cliPath).href):null;
const r48Bound=available?await import(pathToFileURL(r48BoundPath).href):null;
const r48Cli=available?await import(pathToFileURL(r48CliPath).href):null;
const attempt='a'.repeat(64);
const proposalBytes=Buffer.from('Candidate-neutral R49 binding fixture. '.repeat(4));
const proposalSha256=createHash('sha256').update(proposalBytes).digest('hex');
const controlRoot=path.join(sourceRoot,'r49-control');
const grant={authorized:true,scope:'R48_CANDIDATE_NEUTRAL_RECOVERY_ONLY',
  proposalSha256,attempt,scientificAuthority:false,maxCostCents:100,
  maxHelperSeconds:1200,expiresAt:'2026-09-20T21:00:00Z'};
const clock=()=>Date.parse('2026-09-20T20:00:00Z');

test('real R49 parent rejects the unchanged controller startup path before effects',
  {skip:!available},async()=>{
    const trace=[];
    const workload={root:path.join(controlRoot,`r48-${attempt}`,'workload'),
      close:async()=>trace.push('closed')};
    const options={proposalBytes,proposalSha256,attempt,grant,
      quotedWorstCaseCents:100,clock,
      authenticateUserGrant:async request=>({pass:true,
        proposalSha256:request.proposalSha256,attempt:request.attempt,
        scope:request.scope}),
      claimHost:async()=>({pass:true,
        path:path.join(controlRoot,'r48-host-anchor-v1.jsonl'),
        sha256:'c'.repeat(64),claimSha256:'d'.repeat(64)}),
      reserveLocal:async()=>({reserved:true,
        root:path.join(controlRoot,`r48-${attempt}`),
        captureRoot:path.join(controlRoot,`r48-${attempt}`,'capture'),
        workload,proposalSha256,expiresAt:grant.expiresAt}),
      bindRuntime:()=>({audit:async()=>{},replayLayout:async()=>{},
        readHelper:async()=>{},tokenSupplier:async()=>{},
        fetchImpl:async()=>{}}),
      stageStartup:async()=>{throw Error('STAGE_MUST_NOT_RUN')},
      stageHandoff:async()=>{throw Error('HANDOFF_MUST_NOT_RUN')},
    };
    const makeRunner=args=>({run:async()=>{
      trace.push('runner');
      return args.renderStartup({attempt,
        path:path.join(sourceRoot,`r48-startup-${attempt}.sh`)});
    }});
    await assert.rejects(bound.runR49BoundEntry(options,{makeRunner}),
      /r48_entry_startup_request/);
    assert.deepEqual(trace,['runner','closed']);
  });

test('real R49 safety CLI rejects R49-root paths before file inspection',
  {skip:!available},async()=>{
    const now='2026-09-20T20:00:00Z';
    const stop='2026-09-20T20:15:00Z';
    const args=[`--attempt=${attempt}`,`--now-iso=${now}`,
      `--stop-iso=${stop}`,
      `--safety-root=${path.join(controlRoot,`r48-${attempt}`,'safety')}`,
      '--parent-pid=123',
      `--handoff-path=${path.join(controlRoot,`r48-${attempt}`,'child-handoff.json')}`,
      `--handoff-sha256=${'b'.repeat(64)}`,
      `--proposal-sha256=${proposalSha256}`];
    await assert.rejects(cli.runR49SafetyCli({argv:args,
      inspect:async()=>{throw Error('INSPECTION_MUST_NOT_RUN')},
      read:async()=>{throw Error('READ_MUST_NOT_RUN')}}),
    /r48_safety_cli_arguments/);
  });

test('same-root parent passes the unchanged startup request without effects',
  {skip:!available},async()=>{
    const trace=[];
    const workload={root:path.join(sourceRoot,`r48-${attempt}`,'workload'),
      close:async()=>trace.push('closed')};
    const result=await r48Bound.runR48BoundEntry({proposalBytes,
      proposalSha256,attempt,grant,quotedWorstCaseCents:100,clock,
      authenticateUserGrant:async request=>({pass:true,
        proposalSha256:request.proposalSha256,attempt:request.attempt,
        scope:request.scope}),
      claimHost:async()=>({pass:true,
        path:path.join(sourceRoot,'r48-host-anchor-v1.jsonl'),
        sha256:'c'.repeat(64),claimSha256:'d'.repeat(64)}),
      reserveLocal:async()=>({reserved:true,
        root:path.join(sourceRoot,`r48-${attempt}`),
        captureRoot:path.join(sourceRoot,`r48-${attempt}`,'capture'),
        workload,proposalSha256,expiresAt:grant.expiresAt}),
      bindRuntime:()=>({audit:async()=>{},replayLayout:async()=>{},
        readHelper:async()=>{},tokenSupplier:async()=>{},
        fetchImpl:async()=>{}}),
      stageStartup:async({scriptPath})=>{
        trace.push('stage');
        assert.equal(scriptPath,
          path.join(sourceRoot,`r48-startup-${attempt}.sh`));
        return {pass:true,path:scriptPath,sha256:'e'.repeat(64)};
      },
      makeRunner:args=>({run:async()=>{
        trace.push('runner');
        return args.renderStartup({attempt,
          path:path.join(sourceRoot,`r48-startup-${attempt}.sh`)});
      }}),
    });
    assert.equal(result.pass,true);
    assert.deepEqual(trace,['runner','stage','closed']);
  });

test('same-root child CLI reaches the authenticated handoff boundary',
  {skip:!available},async()=>{
    const now='2026-09-20T20:00:00Z';
    const stop='2026-09-20T20:15:00Z';
    const args=[`--attempt=${attempt}`,`--now-iso=${now}`,
      `--stop-iso=${stop}`,
      `--safety-root=${path.join(sourceRoot,`r48-${attempt}`,'safety')}`,
      '--parent-pid=123',
      `--handoff-path=${path.join(sourceRoot,`r48-${attempt}`,'child-handoff.json')}`,
      `--handoff-sha256=${'b'.repeat(64)}`,
      `--proposal-sha256=${proposalSha256}`];
    await assert.rejects(r48Cli.runR48SafetyCli({argv:args,
      inspect:async()=>{throw Error('HANDOFF_INSPECTION_REACHED')},
      read:async()=>{throw Error('READ_MUST_NOT_RUN')}}),
    /HANDOFF_INSPECTION_REACHED/);
  });
