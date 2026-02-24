import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { runGrAgentLoop, type GrAgentLoopAttempt, type GrAgentLoopOptions, type GrAgentLoopResult } from '../server/gr/gr-agent-loop.js';

type GateStatus = 'PASS' | 'FAIL' | 'UNKNOWN' | 'NOT_READY' | 'NOT_APPLICABLE';
type Wave = 'A' | 'B' | 'C' | 'D';
type WaveArg = Wave | 'all';

type ParsedArgs = {
  wave: WaveArg;
  out: string;
  seed: number;
  ci: boolean;
};

type GateRecord = {
  status: GateStatus;
  reason: string;
  source: string;
};

type EvidencePack = {
  commitSha: string;
  runTimestamp: string;
  completedAt: string;
  runId: string;
  traceId: string;
  wave: Wave;
  seed: number;
  provenance: {
    command: string;
    cwd: string;
    mode: 'ci' | 'local';
  };
  commandMetadata: {
    maxIterations: number;
    runCount: number;
    waveProfile: Record<string, unknown>;
  };
  runArtifacts: Array<{
    runIndex: number;
    startedAt: string;
    completedAt: string;
    durationMs: number;
    accepted: boolean;
    state: string;
    acceptedIteration?: number;
    attemptCount: number;
    outputPath: string;
  }>;
  gateStatus: Record<string, GateStatus>;
  gateDetails: Record<string, GateRecord>;
  firstFail: string;
  firstFailReason: string;
  parsedGateMap: Record<string, GateRecord>;
  evaluationSummary: {
    hardConstraintMap: Record<string, string>;
    gateStatusByAttempt: Array<{ runIndex: number; gateStatus: string; pass: boolean }>;
  };
  claimPosture: 'diagnostic/reduced-order';
  boundaryStatement: string;
};

const BOUNDARY_STATEMENT =
  'This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.';

const DATE_STAMP = '2026-02-24';
const ALLOWED_WAVES: readonly WaveArg[] = ['A', 'B', 'C', 'D', 'all'] as const;
const FIRST_FAIL_ORDER = ['G0', 'G1', 'G2', 'G3', 'G4', 'G6', 'G7', 'G8'] as const;

const WAVE_PROFILES: Record<Wave, { runCount: number; options: GrAgentLoopOptions }> = {
  A: { runCount: 1, options: { maxIterations: 1, commitAccepted: false, proposals: [{ label: 'wave-a-baseline', params: {} }] } },
  B: {
    runCount: 1,
    options: { maxIterations: 2, commitAccepted: false, proposals: [{ label: 'wave-b-duty-lower', params: { dutyCycle: 0.09 } }] },
  },
  C: {
    runCount: 2,
    options: {
      maxIterations: 2,
      commitAccepted: false,
      proposals: [
        { label: 'wave-c-seed-profile', params: { dutyCycle: 0.08, gammaGeo: 1.95 } },
        { label: 'wave-c-perturb', params: { dutyCycle: 0.085, gammaGeo: 1.9 } },
      ],
    },
  },
  D: {
    runCount: 2,
    options: {
      maxIterations: 2,
      commitAccepted: false,
      proposals: [
        { label: 'wave-d-replica-a', params: { dutyCycle: 0.075, gammaGeo: 1.85 } },
        { label: 'wave-d-replica-b', params: { dutyCycle: 0.075, gammaGeo: 1.85 } },
      ],
    },
  },
};

const mkdirp = (p: string) => fs.mkdirSync(p, { recursive: true });
const writeJson = (p: string, value: unknown) => {
  mkdirp(path.dirname(p));
  fs.writeFileSync(p, `${JSON.stringify(value, null, 2)}\n`);
};
const writeMd = (p: string, body: string) => {
  mkdirp(path.dirname(p));
  fs.writeFileSync(p, body);
};
const hashId = (src: string) => Buffer.from(src).toString('hex').slice(0, 16);

export const parseWaveArg = (value: string | undefined): WaveArg => {
  const normalized = (value ?? 'all').trim();
  if ((ALLOWED_WAVES as readonly string[]).includes(normalized)) {
    return normalized as WaveArg;
  }
  throw new Error(`Invalid --wave value "${value}". Allowed values: A|B|C|D|all`);
};

const parseArgs = (): ParsedArgs => {
  const args = process.argv.slice(2);
  const read = (name: string, fallback?: string) => {
    const i = args.findIndex((v) => v === name || v.startsWith(`${name}=`));
    if (i < 0) return fallback;
    if (args[i].includes('=')) return args[i].split('=', 2)[1];
    return args[i + 1] ?? fallback;
  };

  const wave = parseWaveArg(read('--wave', 'all'));
  return {
    wave,
    out: read('--out', 'artifacts/research/full-solve')!,
    seed: Number(read('--seed', '20260224')),
    ci: args.includes('--ci'),
  };
};

const toGate = (status: string | undefined, source: string, reasonMissing: string): GateRecord => {
  if (!status) {
    return { status: 'NOT_READY', source, reason: reasonMissing };
  }
  if (status === 'pass') return { status: 'PASS', source, reason: 'Constraint passed from evaluation artifact.' };
  if (status === 'fail') return { status: 'FAIL', source, reason: 'Constraint failed from evaluation artifact.' };
  return { status: 'UNKNOWN', source, reason: `Unrecognized status: ${status}` };
};

const extractLatestAttempt = (result: GrAgentLoopResult): GrAgentLoopAttempt | null =>
  result.attempts.length ? result.attempts[result.attempts.length - 1] : null;

const buildGateMap = (wave: Wave, runResults: GrAgentLoopResult[]): Record<string, GateRecord> => {
  const latest = runResults.length ? runResults[runResults.length - 1] : null;
  const attempt = latest ? extractLatestAttempt(latest) : null;
  const constraints = attempt?.evaluation?.constraints ?? [];
  const constraintById = new Map(constraints.map((entry) => [entry.id, entry]));

  const gateMap: Record<string, GateRecord> = {
    G0: latest
      ? { status: 'PASS', source: 'gr-agent-loop.result', reason: 'GR loop run artifact captured.' }
      : { status: 'NOT_READY', source: 'gr-agent-loop.result', reason: 'No GR loop run artifacts found.' },
    G1: attempt?.initial?.status
      ? attempt.initial.status === 'CERTIFIED'
        ? { status: 'PASS', source: 'gr-agent-loop.attempt.initial.status', reason: 'Initial data solve is CERTIFIED.' }
        : { status: 'FAIL', source: 'gr-agent-loop.attempt.initial.status', reason: `Initial data solve status=${attempt.initial.status}.` }
      : { status: 'NOT_READY', source: 'gr-agent-loop.attempt.initial.status', reason: 'Initial solver status missing in artifact.' },
    G2: attempt?.evaluation?.gate?.status
      ? attempt.evaluation.gate.status === 'pass'
        ? { status: 'PASS', source: 'gr-agent-loop.attempt.evaluation.gate.status', reason: 'GR constraint gate pass from evaluator.' }
        : attempt.evaluation.gate.status === 'fail'
          ? { status: 'FAIL', source: 'gr-agent-loop.attempt.evaluation.gate.status', reason: 'GR constraint gate fail from evaluator.' }
          : { status: 'UNKNOWN', source: 'gr-agent-loop.attempt.evaluation.gate.status', reason: `Unsupported evaluator gate status=${attempt.evaluation.gate.status}` }
      : { status: 'NOT_READY', source: 'gr-agent-loop.attempt.evaluation.gate.status', reason: 'Evaluation gate status missing in artifact.' },
    G3: attempt?.evaluation?.certificate
      ? attempt.evaluation.certificate.hasCertificate && attempt.evaluation.certificate.integrityOk
        ? { status: 'PASS', source: 'gr-agent-loop.attempt.evaluation.certificate', reason: 'Certificate present with integrityOk=true.' }
        : { status: 'FAIL', source: 'gr-agent-loop.attempt.evaluation.certificate', reason: 'Certificate missing or integrity check failed.' }
      : { status: 'NOT_READY', source: 'gr-agent-loop.attempt.evaluation.certificate', reason: 'Certificate data missing from evaluator output.' },
    G4: (() => {
      const ford = toGate(constraintById.get('FordRomanQI')?.status, 'gr-agent-loop.attempt.evaluation.constraints[FordRomanQI]', 'FordRomanQI missing from constraints.');
      const theta = toGate(constraintById.get('ThetaAudit')?.status, 'gr-agent-loop.attempt.evaluation.constraints[ThetaAudit]', 'ThetaAudit missing from constraints.');
      if (ford.status === 'NOT_READY' || theta.status === 'NOT_READY') {
        return { status: 'NOT_READY', source: 'gr-agent-loop.attempt.evaluation.constraints', reason: `${ford.reason} ${theta.reason}`.trim() };
      }
      if (ford.status === 'FAIL' || theta.status === 'FAIL') {
        return { status: 'FAIL', source: 'gr-agent-loop.attempt.evaluation.constraints', reason: `Hard guardrails failed: FordRomanQI=${ford.status}, ThetaAudit=${theta.status}.` };
      }
      if (ford.status === 'PASS' && theta.status === 'PASS') {
        return { status: 'PASS', source: 'gr-agent-loop.attempt.evaluation.constraints', reason: 'Hard guardrails passed from evaluator constraints.' };
      }
      return { status: 'UNKNOWN', source: 'gr-agent-loop.attempt.evaluation.constraints', reason: `Unexpected hard-guardrail states: FordRomanQI=${ford.status}, ThetaAudit=${theta.status}.` };
    })(),
    G5: {
      status: 'NOT_APPLICABLE',
      source: 'campaign.policy.reduced-order',
      reason: 'Reduced-order campaign; no physical-feasibility promotion claim is evaluated here.',
    },
    G6: {
      status: runResults.length > 0 ? 'PASS' : 'NOT_READY',
      source: 'campaign.artifacts',
      reason: runResults.length > 0 ? 'Raw run outputs persisted for this wave.' : 'Run outputs are missing for this wave.',
    },
    G7:
      wave === 'C' || wave === 'D'
        ? runResults.length >= 2
          ? {
              status: runResults[0].attempts[0]?.evaluation?.gate?.status === runResults[1].attempts[0]?.evaluation?.gate?.status ? 'PASS' : 'FAIL',
              source: 'campaign.stability.check',
              reason:
                runResults[0].attempts[0]?.evaluation?.gate?.status === runResults[1].attempts[0]?.evaluation?.gate?.status
                  ? 'First-order gate status remained stable across repeated runs.'
                  : 'Repeated runs produced inconsistent gate outcomes.',
            }
          : { status: 'NOT_READY', source: 'campaign.stability.check', reason: 'Need at least 2 runs for stability check.' }
        : { status: 'NOT_READY', source: 'campaign.stability.check', reason: 'Stability check enabled for waves C and D only.' },
    G8:
      wave === 'D'
        ? runResults.length >= 2
          ? {
              status: JSON.stringify(runResults[0].attempts[0]?.evaluation?.constraints ?? []) === JSON.stringify(runResults[1].attempts[0]?.evaluation?.constraints ?? []) ? 'PASS' : 'FAIL',
              source: 'campaign.replication.parity',
              reason:
                JSON.stringify(runResults[0].attempts[0]?.evaluation?.constraints ?? []) === JSON.stringify(runResults[1].attempts[0]?.evaluation?.constraints ?? [])
                  ? 'Replication parity matched on evaluator constraint payload.'
                  : 'Replication parity drift detected in evaluator constraints.',
            }
          : { status: 'NOT_READY', source: 'campaign.replication.parity', reason: 'Need replicated runs for wave D parity check.' }
        : { status: 'NOT_READY', source: 'campaign.replication.parity', reason: 'Replication parity applies to wave D only.' },
  };

  return gateMap;
};

export const deriveFirstFail = (gateMap: Record<string, GateRecord>): { firstFail: string; reason: string } => {
  for (const gateId of FIRST_FAIL_ORDER) {
    const entry = gateMap[gateId];
    if (!entry) continue;
    if (entry.status === 'FAIL') return { firstFail: gateId, reason: entry.reason };
  }
  for (const gateId of FIRST_FAIL_ORDER) {
    const entry = gateMap[gateId];
    if (!entry) continue;
    if (entry.status === 'NOT_READY' || entry.status === 'UNKNOWN') {
      return { firstFail: gateId, reason: entry.reason };
    }
  }
  return { firstFail: 'none', reason: 'No FAIL/NOT_READY/UNKNOWN gate found.' };
};

export const summarizeScoreboard = (gateStatus: Record<string, GateStatus>) => {
  const statuses = Object.values(gateStatus);
  const counts = {
    PASS: statuses.filter((s) => s === 'PASS').length,
    FAIL: statuses.filter((s) => s === 'FAIL').length,
    UNKNOWN: statuses.filter((s) => s === 'UNKNOWN').length,
    NOT_READY: statuses.filter((s) => s === 'NOT_READY').length,
    NOT_APPLICABLE: statuses.filter((s) => s === 'NOT_APPLICABLE').length,
  };
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const gateCount = statuses.length;
  return { counts, total, gateCount, reconciled: total === gateCount };
};

const runWave = async (wave: Wave, outDir: string, seed: number, ci: boolean): Promise<EvidencePack> => {
  const commitSha = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  const startIso = new Date().toISOString();
  const runId = `fs-${wave.toLowerCase()}-${seed}-${Date.now()}`;
  const traceId = `trace-${hashId(`${wave}-${seed}-${startIso}`)}`;
  const profile = WAVE_PROFILES[wave];
  const base = path.join(outDir, wave);
  mkdirp(base);

  const runResults: GrAgentLoopResult[] = [];
  const runArtifacts: EvidencePack['runArtifacts'] = [];
  const runErrors: Array<{ runIndex: number; error: string }> = [];

  for (let runIndex = 0; runIndex < profile.runCount; runIndex += 1) {
    const startedAt = new Date().toISOString();
    const started = Date.now();
    try {
      const result = await runGrAgentLoop(profile.options);
      const completedAt = new Date().toISOString();
      const durationMs = Date.now() - started;
      runResults.push(result);

      const outputPath = path.join(base, `run-${runIndex + 1}-raw-output.json`);
      writeJson(outputPath, {
        wave,
        runIndex: runIndex + 1,
        startedAt,
        completedAt,
        durationMs,
        options: profile.options,
        result,
      });

      runArtifacts.push({
        runIndex: runIndex + 1,
        startedAt,
        completedAt,
        durationMs,
        accepted: result.accepted,
        state: result.state,
        acceptedIteration: result.acceptedIteration,
        attemptCount: result.attempts.length,
        outputPath,
      });
    } catch (error) {
      const completedAt = new Date().toISOString();
      const durationMs = Date.now() - started;
      const message = error instanceof Error ? error.message : String(error);
      const outputPath = path.join(base, `run-${runIndex + 1}-raw-output.json`);
      writeJson(outputPath, { wave, runIndex: runIndex + 1, startedAt, completedAt, durationMs, options: profile.options, error: message });
      runArtifacts.push({
        runIndex: runIndex + 1,
        startedAt,
        completedAt,
        durationMs,
        accepted: false,
        state: 'error',
        attemptCount: 0,
        outputPath,
      });
      runErrors.push({ runIndex: runIndex + 1, error: message });
    }
  }

  const gateMap = buildGateMap(wave, runResults);
  const gateStatus = Object.fromEntries(Object.entries(gateMap).map(([key, value]) => [key, value.status])) as Record<string, GateStatus>;
  const firstFail = deriveFirstFail(gateMap);

  const evaluationSummary = {
    hardConstraintMap: runResults.length
      ? Object.fromEntries(
          (extractLatestAttempt(runResults[runResults.length - 1])?.evaluation.constraints ?? [])
            .filter((entry) => entry.id === 'FordRomanQI' || entry.id === 'ThetaAudit')
            .map((entry) => [entry.id, entry.status]),
        )
      : {},
    gateStatusByAttempt: runResults.map((result, idx) => ({
      runIndex: idx + 1,
      gateStatus: extractLatestAttempt(result)?.evaluation?.gate?.status ?? 'missing',
      pass: Boolean(extractLatestAttempt(result)?.evaluation?.pass),
    })),
  };

  const pack: EvidencePack = {
    commitSha,
    runTimestamp: startIso,
    completedAt: new Date().toISOString(),
    runId,
    traceId,
    wave,
    seed,
    provenance: {
      command: `npm run warp:full-solve:campaign -- --wave ${wave}${ci ? ' --ci' : ''}`,
      cwd: process.cwd(),
      mode: ci ? 'ci' : 'local',
    },
    commandMetadata: {
      maxIterations: profile.options.maxIterations ?? 0,
      runCount: profile.runCount,
      waveProfile: profile.options,
    },
    runArtifacts,
    gateStatus,
    gateDetails: gateMap,
    firstFail: firstFail.firstFail,
    firstFailReason: firstFail.reason,
    parsedGateMap: gateMap,
    evaluationSummary,
    claimPosture: 'diagnostic/reduced-order',
    boundaryStatement: BOUNDARY_STATEMENT,
  };

  writeJson(path.join(base, 'evidence-pack.json'), { ...pack, runErrors });
  writeJson(path.join(base, 'first-fail-map.json'), {
    wave,
    globalFirstFail: firstFail.firstFail,
    reason: firstFail.reason,
    perRun: runArtifacts.map((item) => ({ id: `${runId}-run${item.runIndex}`, state: item.state })),
  });
  return pack;
};

const regenCampaign = (outDir: string, waves: Wave[]) => {
  const packs = waves.map((w) => JSON.parse(fs.readFileSync(path.join(outDir, w, 'evidence-pack.json'), 'utf8')) as EvidencePack);
  const aggregate = packs[packs.length - 1] ?? packs[0];
  const scoreboard = summarizeScoreboard(aggregate.gateStatus);
  const decision = scoreboard.counts.FAIL > 0 ? 'INADMISSIBLE' : scoreboard.counts.NOT_READY > 0 || scoreboard.counts.UNKNOWN > 0 ? 'NOT_READY' : 'REDUCED_ORDER_ADMISSIBLE';

  writeJson(path.join(outDir, `campaign-gate-scoreboard-${DATE_STAMP}.json`), {
    campaignId: `FS-CAMPAIGN-${DATE_STAMP}`,
    asOfDate: DATE_STAMP,
    decision,
    statusCounts: scoreboard.counts,
    gateCount: scoreboard.gateCount,
    reconciled: scoreboard.reconciled,
    gates: aggregate.gateStatus,
  });

  writeJson(path.join(outDir, `campaign-first-fail-map-${DATE_STAMP}.json`), {
    campaignId: `FS-CAMPAIGN-${DATE_STAMP}`,
    asOfDate: DATE_STAMP,
    globalFirstFail: aggregate.firstFail,
    perWave: Object.fromEntries(waves.map((w) => [w, (JSON.parse(fs.readFileSync(path.join(outDir, w, 'first-fail-map.json'), 'utf8')) as { globalFirstFail: string }).globalFirstFail])),
  });

  writeJson(path.join(outDir, `campaign-action-plan-30-60-90-${DATE_STAMP}.json`), {
    campaignId: `FS-CAMPAIGN-${DATE_STAMP}`,
    decision,
    blockers: packs.flatMap((pack) =>
      Object.entries(pack.gateDetails)
        .filter(([, detail]) => detail.status === 'FAIL' || detail.status === 'NOT_READY')
        .map(([gateId, detail]) => ({ wave: pack.wave, gateId, status: detail.status, reason: detail.reason })),
    ),
    plan: {
      '30_days': ['Resolve first FAIL/NOT_READY hard gate from campaign-first-fail map and capture new evidence-pack outputs.'],
      '60_days': ['Demonstrate stable repeated-run outcomes for waves C and D from persisted raw outputs.'],
      '90_days': ['Close evidence gaps so gates are PASS/NOT_APPLICABLE with reproducible artifacts and replayable provenance.'],
    },
  });

  writeMd(
    path.join('docs/audits/research', `warp-full-solve-campaign-execution-report-${DATE_STAMP}.md`),
    `# Warp Full-Solve Campaign Execution Report (${DATE_STAMP})\n\n## Executive verdict\n**${decision}**\n\n## Gate scoreboard (G0..G8)\n- PASS: ${scoreboard.counts.PASS}\n- FAIL: ${scoreboard.counts.FAIL}\n- UNKNOWN: ${scoreboard.counts.UNKNOWN}\n- NOT_READY: ${scoreboard.counts.NOT_READY}\n- NOT_APPLICABLE: ${scoreboard.counts.NOT_APPLICABLE}\n- Total gates: ${scoreboard.gateCount}\n- Reconciled: ${scoreboard.reconciled}\n\nFinal gate status (from latest wave artifact):\n${Object.entries(aggregate.gateStatus).map(([k, v]) => `- ${k}: ${v}`).join('\n')}\n\n## Decision output\n- Final decision label: **${decision}**\n- Claim posture: diagnostic/reduced-order (fail-closed on hard evidence gaps).\n\n## Boundary statement\n${BOUNDARY_STATEMENT}\n`,
  );

  return { counts: scoreboard.counts, decision, reconciled: scoreboard.reconciled };
};

const main = async () => {
  const args = parseArgs();
  const waves: Wave[] = args.wave === 'all' ? ['A', 'B', 'C', 'D'] : [args.wave];
  for (const wave of waves) {
    await runWave(wave, args.out, args.seed, args.ci);
  }
  const allWaves: Wave[] = ['A', 'B', 'C', 'D'];
  const campaign = allWaves.every((w) => fs.existsSync(path.join(args.out, w, 'evidence-pack.json')))
    ? regenCampaign(args.out, allWaves)
    : { counts: null, decision: 'NOT_READY', reconciled: false };
  const payload = { ok: true, waves, out: args.out, campaign, mode: args.ci ? 'ci' : 'local' };
  console.log(JSON.stringify(payload, null, 2));
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  if (error instanceof Error && error.message.includes('Invalid --wave value')) {
    console.error('Usage: npm run warp:full-solve:campaign -- --wave A|B|C|D|all [--out <dir>] [--seed <n>] [--ci]');
  }
  process.exit(1);
});
