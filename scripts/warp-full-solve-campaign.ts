import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { spawn } from 'node:child_process';
import { type GrAgentLoopAttempt, type GrAgentLoopOptions, type GrAgentLoopResult } from '../server/gr/gr-agent-loop.js';

type GateStatus = 'PASS' | 'FAIL' | 'UNKNOWN' | 'NOT_READY' | 'NOT_APPLICABLE';
type Wave = 'A' | 'B' | 'C' | 'D';
type WaveArg = Wave | 'all';

type ParsedArgs = {
  wave: WaveArg;
  out: string;
  seed: number;
  ci: boolean;
  waveTimeoutMs: number;
  campaignTimeoutMs: number;
};

export type CliResult = {
  ok: boolean;
  waves: Wave[];
  out: string;
  campaign: { counts: ReturnType<typeof summarizeScoreboard>['counts'] | null; decision: string; reconciled: boolean };
  mode: 'ci' | 'local';
};

type GateRecord = {
  status: GateStatus;
  reason: string;
  source: string;
};

const GATE_PRECEDENCE: Record<GateStatus, number> = {
  FAIL: 5,
  NOT_READY: 4,
  UNKNOWN: 3,
  PASS: 2,
  NOT_APPLICABLE: 1,
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
  requiredSignals: Record<string, { required: boolean; present: boolean }>;
  missingSignals: string[];
  gateMissingSignalMap: Record<string, string[]>;
  timeout?: { kind: 'wave_timeout' | 'campaign_timeout'; timeoutMs: number; elapsedMs: number; wave?: Wave };
  reproducibility: {
    repeatedRunGateAgreement: { status: GateStatus; agreementRatio: number | null; reason: string };
    constraintPayloadDrift: { status: GateStatus; driftRatio: number | null; reason: string };
    residualTrend: {
      status: GateStatus;
      fidelityLevels: number;
      trend: 'decreasing' | 'non_decreasing' | 'unknown';
      reason: string;
      series: number[];
    };
  };
  claimPosture: 'diagnostic/reduced-order';
  boundaryStatement: string;
};

type TimeoutKind = 'wave_timeout' | 'campaign_timeout';

const BOUNDARY_STATEMENT =
  'This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.';

const DATE_STAMP = '2026-02-24';
const ALLOWED_WAVES: readonly WaveArg[] = ['A', 'B', 'C', 'D', 'all'] as const;
const FIRST_FAIL_ORDER = ['G0', 'G1', 'G2', 'G3', 'G4', 'G6', 'G7', 'G8'] as const;

const WAVE_PROFILES: Record<Wave, { runCount: number; options: GrAgentLoopOptions }> = {
  A: {
    runCount: 1,
    options: { maxIterations: 1, commitAccepted: false, useLiveSnapshot: false, proposals: [{ label: 'wave-a-baseline', params: {} }] },
  },
  B: {
    runCount: 1,
    options: {
      maxIterations: 2,
      commitAccepted: false,
      useLiveSnapshot: false,
      proposals: [{ label: 'wave-b-duty-lower', params: { dutyCycle: 0.09 } }],
    },
  },
  C: {
    runCount: 2,
    options: {
      maxIterations: 2,
      commitAccepted: false,
      useLiveSnapshot: false,
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
      useLiveSnapshot: false,
      proposals: [
        { label: 'wave-d-replica-a', params: { dutyCycle: 0.075, gammaGeo: 1.85 } },
        { label: 'wave-d-replica-b', params: { dutyCycle: 0.075, gammaGeo: 1.85 } },
      ],
    },
  },
};

const mkdirp = (p: string) => fs.mkdirSync(p, { recursive: true });
const sortDeep = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value as Record<string, unknown>).sort().map((key) => [key, sortDeep((value as Record<string, unknown>)[key])])) as Record<string, unknown>;
};
const writeJson = (p: string, value: unknown) => {
  mkdirp(path.dirname(p));
  fs.writeFileSync(p, `${JSON.stringify(sortDeep(value), null, 2)}\n`);
};
const writeMd = (p: string, body: string) => {
  mkdirp(path.dirname(p));
  fs.writeFileSync(p, body);
};
const hashId = (src: string) => Buffer.from(src).toString('hex').slice(0, 16);
const resolveTsxRunner = () => path.resolve(process.cwd(), 'node_modules', 'tsx', 'dist', 'cli.mjs');
const resolveSingleRunCli = () => path.resolve(process.cwd(), 'scripts', 'warp-full-solve-single-runner.ts');

class CampaignTimeoutError extends Error {
  kind: TimeoutKind;
  timeoutMs: number;
  elapsedMs: number;
  wave?: Wave;

  constructor(kind: TimeoutKind, timeoutMs: number, elapsedMs: number, wave?: Wave) {
    super(`${kind}:${timeoutMs}`);
    this.name = 'CampaignTimeoutError';
    this.kind = kind;
    this.timeoutMs = timeoutMs;
    this.elapsedMs = elapsedMs;
    this.wave = wave;
  }
}

const withTimeout = async <T>(
  run: Promise<T>,
  timeoutMs: number,
  kind: TimeoutKind,
  elapsedBaseMs: number,
  wave?: Wave,
): Promise<T> => {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      run,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new CampaignTimeoutError(kind, timeoutMs, elapsedBaseMs + timeoutMs, wave));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

export const parseWaveArg = (value: string | undefined): WaveArg => {
  const normalized = (value ?? 'all').trim();
  if ((ALLOWED_WAVES as readonly string[]).includes(normalized)) {
    return normalized as WaveArg;
  }
  throw new Error(`Invalid --wave value "${value}". Allowed values: A|B|C|D|all`);
};

export const parseSeedArg = (value: string | undefined): number => {
  const normalized = (value ?? '').trim();
  if (!normalized) {
    throw new Error('Invalid --seed value "". Seed must be a finite integer.');
  }
  const numeric = Number(normalized);
  if (!Number.isFinite(numeric) || !Number.isInteger(numeric)) {
    throw new Error(`Invalid --seed value "${value}". Seed must be a finite integer.`);
  }
  return numeric;
};

const runGrAgentLoopIsolated = async (
  args: { options: GrAgentLoopOptions; wave: Wave; runIndex: number; baseDir: string },
  timeoutMs: number,
  timeoutKind: TimeoutKind,
  elapsedBaseMs: number,
): Promise<GrAgentLoopResult> => {
  const tsxCli = resolveTsxRunner();
  const runnerCli = resolveSingleRunCli();
  if (!fs.existsSync(tsxCli)) {
    throw new Error(`Missing tsx runtime: ${tsxCli}`);
  }
  if (!fs.existsSync(runnerCli)) {
    throw new Error(`Missing isolated runner: ${runnerCli}`);
  }

  const runNonce = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  const inputPath = path.join(args.baseDir, `run-${args.runIndex}-input-${runNonce}.json`);
  const outputPath = path.join(args.baseDir, `run-${args.runIndex}-isolated-${runNonce}.json`);
  writeJson(inputPath, {
    wave: args.wave,
    runIndex: args.runIndex,
    options: args.options,
  });

  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, [tsxCli, runnerCli, '--input', inputPath, '--output', outputPath], {
      stdio: 'ignore',
      windowsHide: true,
    });
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, timeoutMs);

    child.once('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once('exit', (code) => {
      clearTimeout(timer);
      if (timedOut) {
        reject(new CampaignTimeoutError(timeoutKind, timeoutMs, elapsedBaseMs + timeoutMs, args.wave));
        return;
      }
      if (code !== 0) {
        let message = `Isolated GR runner exited with code ${code}`;
        if (fs.existsSync(outputPath)) {
          try {
            const payload = JSON.parse(fs.readFileSync(outputPath, 'utf8')) as { ok?: boolean; error?: { message?: string } };
            if (payload?.error?.message) {
              message = payload.error.message;
            }
          } catch {
            // Preserve default message when parsing fails.
          }
        }
        reject(new Error(message));
        return;
      }
      resolve();
    });
  });

  if (!fs.existsSync(outputPath)) {
    throw new Error('Isolated GR runner completed without output artifact.');
  }
  const payload = JSON.parse(fs.readFileSync(outputPath, 'utf8')) as {
    ok?: boolean;
    result?: GrAgentLoopResult;
    error?: { message?: string };
  };
  if (!payload.ok || !payload.result) {
    throw new Error(payload.error?.message ?? 'Isolated GR runner returned missing result payload.');
  }
  return payload.result;
};

export const parsePositiveIntArg = (value: string | undefined, argName: string): number => {
  const normalized = (value ?? '').trim();
  if (!normalized) {
    throw new Error(`Invalid --${argName} value "". Value must be a positive integer in milliseconds.`);
  }
  const numeric = Number(normalized);
  if (!Number.isFinite(numeric) || !Number.isInteger(numeric) || numeric <= 0) {
    throw new Error(`Invalid --${argName} value "${value}". Value must be a positive integer in milliseconds.`);
  }
  return numeric;
};

export const parseArgs = (argv = process.argv.slice(2)): ParsedArgs => {
  const args = argv;
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
    seed: parseSeedArg(read('--seed', '20260224')),
    ci: args.includes('--ci'),
    waveTimeoutMs: parsePositiveIntArg(read('--wave-timeout-ms', '120000'), 'wave-timeout-ms'),
    campaignTimeoutMs: parsePositiveIntArg(read('--campaign-timeout-ms', '600000'), 'campaign-timeout-ms'),
  };
};

const SUPPORTED_EVALUATION_GATE_STATUSES = new Set(['pass', 'fail']);

const toGate = (status: string | undefined, source: string, reasonMissing: string): GateRecord => {
  if (!status) {
    return { status: 'NOT_READY', source, reason: reasonMissing };
  }
  if (status === 'pass') return { status: 'PASS', source, reason: 'Constraint passed from evaluation artifact.' };
  if (status === 'fail') return { status: 'FAIL', source, reason: 'Constraint failed from evaluation artifact.' };
  return { status: 'UNKNOWN', source, reason: `Unrecognized status: ${status}` };
};

export const extractLatestAttempt = (result: GrAgentLoopResult): GrAgentLoopAttempt | null =>
  result.attempts.length ? result.attempts[result.attempts.length - 1] : null;

const extractLatestEvaluation = (result: GrAgentLoopResult) => extractLatestAttempt(result)?.evaluation;

const collectMissingSignals = (
  evaluation: ReturnType<typeof extractLatestEvaluation>,
  required: { gateStatus?: boolean; constraints?: boolean },
) => {
  const missing: string[] = [];
  if (!evaluation) {
    missing.push('missing_latest_evaluation');
    if (required.gateStatus) missing.push('missing_gate_status');
    if (required.constraints) missing.push('missing_constraints_payload');
    return missing;
  }
  if (required.gateStatus && !evaluation.gate?.status) {
    missing.push('missing_gate_status');
  }
  if (required.constraints && !Array.isArray(evaluation.constraints)) {
    missing.push('missing_constraints_payload');
  }
  return missing;
};

const hasPersistedRawOutputFiles = (runArtifacts: EvidencePack['runArtifacts']) =>
  runArtifacts.some((artifact) => fs.existsSync(artifact.outputPath));

export const buildGateMap = (
  wave: Wave,
  runResults: GrAgentLoopResult[],
  runArtifacts: EvidencePack['runArtifacts'] = [],
): Record<string, GateRecord> => {
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
      status: hasPersistedRawOutputFiles(runArtifacts)
        ? attempt?.evaluation
          ? 'PASS'
          : 'FAIL'
        : 'NOT_READY',
      source: 'campaign.artifacts',
      reason: hasPersistedRawOutputFiles(runArtifacts)
        ? attempt?.evaluation
          ? 'Raw run outputs persisted and evaluator signals are present.'
          : 'Raw run outputs persisted but evaluator signals are missing; fail-closed until evaluator output is present.'
        : 'Run outputs are missing for this wave.',
    },
    G7:
      wave === 'C' || wave === 'D'
        ? runResults.length >= 2
          ? (() => {
              const lhs = extractLatestEvaluation(runResults[0]);
              const rhs = extractLatestEvaluation(runResults[1]);
              const missing = [...collectMissingSignals(lhs, { gateStatus: true }), ...collectMissingSignals(rhs, { gateStatus: true })];
              if (missing.length > 0) {
                return {
                  status: 'NOT_READY' as const,
                  source: 'campaign.stability.check',
                  reason: `Missing stability signals: ${Array.from(new Set(missing)).join(', ')}.`,
                };
              }
              const lhsStatus = lhs?.gate?.status;
              const rhsStatus = rhs?.gate?.status;
              if (!SUPPORTED_EVALUATION_GATE_STATUSES.has(lhsStatus ?? '') || !SUPPORTED_EVALUATION_GATE_STATUSES.has(rhsStatus ?? '')) {
                return {
                  status: 'NOT_READY' as const,
                  source: 'campaign.stability.check',
                  reason: `Unsupported gate status values for latest attempts: lhs=${lhsStatus ?? 'missing'}, rhs=${rhsStatus ?? 'missing'}.`,
                };
              }
              const sameStatus = lhsStatus === rhsStatus;
              return {
                status: sameStatus ? 'PASS' : 'FAIL',
                source: 'campaign.stability.check',
                reason: sameStatus
                  ? 'First-order gate status remained stable across repeated runs.'
                  : 'Repeated runs produced inconsistent gate outcomes.',
              };
            })()
          : { status: 'NOT_READY', source: 'campaign.stability.check', reason: 'Need at least 2 runs for stability check.' }
        : { status: 'NOT_READY', source: 'campaign.stability.check', reason: 'Stability check enabled for waves C and D only.' },
    G8:
      wave === 'D'
        ? runResults.length >= 2
          ? (() => {
              const lhs = extractLatestEvaluation(runResults[0]);
              const rhs = extractLatestEvaluation(runResults[1]);
              const missing = [...collectMissingSignals(lhs, { constraints: true }), ...collectMissingSignals(rhs, { constraints: true })];
              if (missing.length > 0) {
                return {
                  status: 'NOT_READY' as const,
                  source: 'campaign.replication.parity',
                  reason: `Missing replication signals: ${Array.from(new Set(missing)).join(', ')}.`,
                };
              }
              const lhsConstraints = lhs?.constraints;
              const rhsConstraints = rhs?.constraints;
              if (!Array.isArray(lhsConstraints) || !Array.isArray(rhsConstraints) || lhsConstraints.length === 0 || rhsConstraints.length === 0) {
                return {
                  status: 'NOT_READY' as const,
                  source: 'campaign.replication.parity',
                  reason: 'Constraints payload missing or structurally incomplete for replication parity.',
                };
              }
              const stableConstraints = JSON.stringify(lhsConstraints) === JSON.stringify(rhsConstraints);
              return {
                status: stableConstraints ? 'PASS' : 'FAIL',
                source: 'campaign.replication.parity',
                reason: stableConstraints
                  ? 'Replication parity matched on evaluator constraint payload.'
                  : 'Replication parity drift detected in evaluator constraints.',
              };
            })()
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


export const aggregateGateStatusAcrossWaves = (waveStatuses: Array<Record<string, GateStatus>>) => {
  const gateIds = Array.from(new Set(waveStatuses.flatMap((statusMap) => Object.keys(statusMap)))).sort();
  return Object.fromEntries(
    gateIds.map((gateId) => {
      const gateStates = waveStatuses.map((map) => map[gateId] ?? 'UNKNOWN');
      const resolved = gateStates.reduce<GateStatus>((current, next) => (GATE_PRECEDENCE[next] > GATE_PRECEDENCE[current] ? next : current), 'NOT_APPLICABLE');
      return [gateId, resolved];
    }),
  ) as Record<string, GateStatus>;
};

export const deriveCampaignDecision = (counts: ReturnType<typeof summarizeScoreboard>['counts']) => {
  if (counts.FAIL > 0) return 'INADMISSIBLE';
  if (counts.NOT_READY > 0 || counts.UNKNOWN > 0) return 'NOT_READY';
  return 'REDUCED_ORDER_ADMISSIBLE';
};

const isMeaningfulValue = (value: unknown) => typeof value === 'string' && value.trim().length > 0 && value !== 'unknown' && value !== 'unspecified';

export const collectRequiredSignals = (attempt: GrAgentLoopAttempt | null, latestResult: GrAgentLoopResult | null) => {
  const finalState = latestResult?.finalState as Record<string, unknown> | undefined;
  const finalWarp = (finalState?.warp as Record<string, unknown> | undefined) ?? {};
  const attemptWarp = (attempt?.grRequest?.warp as Record<string, unknown> | undefined) ?? {};

  const finalMetricAdapter = (finalWarp.metricAdapter as Record<string, unknown> | undefined) ?? {};
  const attemptMetricAdapter = (attemptWarp.metricAdapter as Record<string, unknown> | undefined) ?? {};
  const chartLabel =
    (finalMetricAdapter.chart as Record<string, unknown> | undefined)?.label ??
    (attemptMetricAdapter.chart as Record<string, unknown> | undefined)?.label;

  const finalMetricContract = (finalWarp.metricT00Contract as Record<string, unknown> | undefined) ?? {};
  const attemptMetricContract = (attemptWarp.metricT00Contract as Record<string, unknown> | undefined) ?? {};
  const observer =
    finalMetricContract.observer ??
    attemptMetricContract.observer ??
    finalWarp.metricT00Observer ??
    attemptWarp.metricT00Observer;
  const normalization =
    finalMetricContract.normalization ??
    attemptMetricContract.normalization ??
    finalWarp.metricT00Normalization ??
    attemptWarp.metricT00Normalization;
  const unitSystem =
    finalMetricContract.unitSystem ??
    attemptMetricContract.unitSystem ??
    finalWarp.metricT00UnitSystem ??
    attemptWarp.metricT00UnitSystem;

  const requiredSignals: EvidencePack['requiredSignals'] = {
    initial_solver_status: { required: true, present: Boolean(attempt?.initial?.status) },
    evaluation_gate_status: { required: true, present: Boolean(attempt?.evaluation?.gate?.status) },
    hard_constraint_ford_roman_qi: {
      required: true,
      present: (attempt?.evaluation?.constraints ?? []).some((entry) => entry.id === 'FordRomanQI' && Boolean(entry.status)),
    },
    hard_constraint_theta_audit: {
      required: true,
      present: (attempt?.evaluation?.constraints ?? []).some((entry) => entry.id === 'ThetaAudit' && Boolean(entry.status)),
    },
    certificate_hash: { required: true, present: Boolean(attempt?.evaluation?.certificate?.certificateHash) },
    certificate_integrity: { required: true, present: typeof attempt?.evaluation?.certificate?.integrityOk === 'boolean' },
    provenance_chart: { required: true, present: isMeaningfulValue(chartLabel) },
    provenance_observer: { required: true, present: isMeaningfulValue(observer) },
    provenance_normalization: { required: true, present: isMeaningfulValue(normalization) },
    provenance_unit_system: { required: true, present: isMeaningfulValue(unitSystem) },
  };
  const missingSignals = Object.entries(requiredSignals)
    .filter(([, state]) => state.required && !state.present)
    .map(([signal]) => signal)
    .sort();
  return { requiredSignals, missingSignals };
};

export const buildGateMissingSignalMap = (missingSignals: string[]) => {
  const mapping: EvidencePack['gateMissingSignalMap'] = {
    G1: missingSignals.filter((signal) => signal === 'initial_solver_status'),
    G2: missingSignals.filter((signal) => signal === 'evaluation_gate_status'),
    G3: missingSignals.filter((signal) => signal === 'certificate_hash' || signal === 'certificate_integrity'),
    G4: missingSignals.filter((signal) => signal === 'hard_constraint_ford_roman_qi' || signal === 'hard_constraint_theta_audit'),
    G6: missingSignals,
    G7: missingSignals.filter((signal) => signal === 'evaluation_gate_status'),
    G8: missingSignals.filter((signal) => signal.startsWith('hard_constraint_')),
  };
  return Object.fromEntries(Object.entries(mapping).filter(([, signals]) => signals.length > 0));
};

const applyMissingSignalFailClosed = (gateMap: Record<string, GateRecord>, gateMissingSignalMap: Record<string, string[]>) => {
  for (const [gateId, signals] of Object.entries(gateMissingSignalMap)) {
    const gate = gateMap[gateId];
    if (!gate) continue;
    gateMap[gateId] = {
      status: 'NOT_READY',
      source: gate.source,
      reason: `${gate.reason} Missing required signals: ${signals.join(', ')}.`,
    };
  }
  return gateMap;
};

export const computeReproducibility = (runResults: GrAgentLoopResult[]): EvidencePack['reproducibility'] => {
  const evaluations = runResults.map((result) => extractLatestAttempt(result)?.evaluation).filter(Boolean);
  const gateStatuses = evaluations.map((evaluation) => evaluation?.gate?.status).filter((status): status is string => Boolean(status));
  const agreementRatio = gateStatuses.length >= 2 ? gateStatuses.filter((status) => status === gateStatuses[0]).length / gateStatuses.length : null;
  const payloads = evaluations.map((evaluation) => JSON.stringify(evaluation?.constraints ?? null));
  const driftRatio = payloads.length >= 2 ? payloads.slice(1).filter((value) => value !== payloads[0]).length / (payloads.length - 1) : null;
  const residualSeries = runResults
    .map((result) => extractLatestAttempt(result)?.initial?.residual)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  const residualTrendReady = residualSeries.length >= 2;
  const decreasing = residualTrendReady && residualSeries[residualSeries.length - 1] < residualSeries[0];
  return {
    repeatedRunGateAgreement: {
      status: agreementRatio === null ? 'NOT_READY' : agreementRatio === 1 ? 'PASS' : 'FAIL',
      agreementRatio,
      reason: agreementRatio === null ? 'Need at least two repeated runs to compute agreement.' : 'Agreement computed from latest-attempt gate status values.',
    },
    constraintPayloadDrift: {
      status: driftRatio === null ? 'NOT_READY' : driftRatio === 0 ? 'PASS' : 'FAIL',
      driftRatio,
      reason: driftRatio === null ? 'Need at least two repeated runs to compute drift.' : 'Drift computed from serialized latest-attempt constraint payload.',
    },
    residualTrend: {
      status: residualTrendReady ? (decreasing ? 'PASS' : 'FAIL') : 'NOT_READY',
      fidelityLevels: residualSeries.length,
      trend: residualTrendReady ? (decreasing ? 'decreasing' : 'non_decreasing') : 'unknown',
      reason: !residualTrendReady
        ? 'Need at least 2 fidelity levels for residual trend.'
        : decreasing
          ? 'Residual trend is strictly decreasing across available fidelity levels.'
          : 'Residual trend is non-decreasing across available fidelity levels.',
      series: residualSeries,
    },
  };
};

const runWave = async (wave: Wave, outDir: string, seed: number, ci: boolean, waveTimeoutMs: number, campaignElapsedMs: number, campaignTimeoutMs: number): Promise<EvidencePack> => {
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
    const elapsedMs = Date.now() - Date.parse(startIso);
    if (campaignElapsedMs + elapsedMs > campaignTimeoutMs) {
      runErrors.push({ runIndex: runIndex + 1, error: `campaign_timeout:${campaignTimeoutMs}` });
      break;
    }
    const startedAt = new Date().toISOString();
    const started = Date.now();
    try {
      const perRunCampaignRemainingMs = Math.max(1, campaignTimeoutMs - (campaignElapsedMs + (Date.now() - Date.parse(startIso))));
      const effectiveRunTimeoutMs = Math.max(1, Math.min(waveTimeoutMs, perRunCampaignRemainingMs));
      const timeoutKind = perRunCampaignRemainingMs <= waveTimeoutMs ? 'campaign_timeout' : 'wave_timeout';
      const result = await withTimeout(
        runGrAgentLoopIsolated(
          {
            wave,
            runIndex: runIndex + 1,
            baseDir: base,
            options: {
              ...profile.options,
              budget: {
                ...(profile.options.budget ?? {}),
                maxAttemptMs: effectiveRunTimeoutMs,
                maxTotalMs: effectiveRunTimeoutMs,
              },
            },
          },
          effectiveRunTimeoutMs,
          timeoutKind,
          campaignElapsedMs + (Date.now() - Date.parse(startIso)),
        ),
        effectiveRunTimeoutMs + 500,
        timeoutKind,
        campaignElapsedMs + (Date.now() - Date.parse(startIso)),
        wave,
      );
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
      if (error instanceof CampaignTimeoutError) {
        break;
      }
    }
  }

  const gateMap = buildGateMap(wave, runResults, runArtifacts);
  const latestAttempt = runResults.length ? extractLatestAttempt(runResults[runResults.length - 1]) : null;
  const latestResult = runResults.length ? runResults[runResults.length - 1] : null;
  const { requiredSignals, missingSignals } = collectRequiredSignals(latestAttempt, latestResult);
  const gateMissingSignalMap = buildGateMissingSignalMap(missingSignals);
  applyMissingSignalFailClosed(gateMap, gateMissingSignalMap);
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

  const reproducibility = computeReproducibility(runResults);
  const elapsedWaveMs = Date.now() - Date.parse(startIso);
  const timeoutError = runErrors
    .map((entry) => entry.error)
    .find((entry) => entry.startsWith('wave_timeout:') || entry.startsWith('campaign_timeout:'));
  const timeout = timeoutError
    ? timeoutError.startsWith('wave_timeout:')
      ? { kind: 'wave_timeout' as const, timeoutMs: waveTimeoutMs, elapsedMs: elapsedWaveMs, wave }
      : { kind: 'campaign_timeout' as const, timeoutMs: campaignTimeoutMs, elapsedMs: campaignElapsedMs + elapsedWaveMs, wave }
    : undefined;


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
    requiredSignals,
    missingSignals,
    gateMissingSignalMap,
    timeout,
    reproducibility,
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
  const aggregatedGateStatus = aggregateGateStatusAcrossWaves(packs.map((pack) => pack.gateStatus));
  const scoreboard = summarizeScoreboard(aggregatedGateStatus);
  const decision = deriveCampaignDecision(scoreboard.counts);
  const aggregateFirstFail = deriveFirstFail(
    Object.fromEntries(
      Object.entries(aggregatedGateStatus).map(([gateId, status]) => [gateId, { status, reason: `Aggregated from waves: ${waves.join(',')}`, source: 'campaign.cross-wave.aggregate' }]),
    ) as Record<string, GateRecord>,
  );

  writeJson(path.join(outDir, `campaign-gate-scoreboard-${DATE_STAMP}.json`), {
    campaignId: `FS-CAMPAIGN-${DATE_STAMP}`,
    asOfDate: DATE_STAMP,
    decision,
    statusCounts: scoreboard.counts,
    gateCount: scoreboard.gateCount,
    reconciled: scoreboard.reconciled,
    gates: aggregatedGateStatus,
    perWaveGates: Object.fromEntries(packs.map((pack) => [pack.wave, pack.gateStatus])),
  });

  writeJson(path.join(outDir, `campaign-first-fail-map-${DATE_STAMP}.json`), {
    campaignId: `FS-CAMPAIGN-${DATE_STAMP}`,
    asOfDate: DATE_STAMP,
    globalFirstFail: aggregateFirstFail.firstFail,
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
    `# Warp Full-Solve Campaign Execution Report (${DATE_STAMP})\n\n## Executive verdict\n**${decision}**\n\n## Gate scoreboard (G0..G8)\n- PASS: ${scoreboard.counts.PASS}\n- FAIL: ${scoreboard.counts.FAIL}\n- UNKNOWN: ${scoreboard.counts.UNKNOWN}\n- NOT_READY: ${scoreboard.counts.NOT_READY}\n- NOT_APPLICABLE: ${scoreboard.counts.NOT_APPLICABLE}\n- Total gates: ${scoreboard.gateCount}\n- Reconciled: ${scoreboard.reconciled}\n\nCross-wave aggregate gate status:\n${Object.entries(aggregatedGateStatus).map(([k, v]) => `- ${k}: ${v}`).join('\n')}\n\nPer-wave gate status snapshots:\n${packs.map((pack) => `### Wave ${pack.wave}\n${Object.entries(pack.gateStatus).map(([k, v]) => `- ${k}: ${v}`).join('\n')}\n- missingSignals: ${(pack.missingSignals ?? []).join(', ') || 'none'}\n- reproducibility.gateAgreement: ${pack.reproducibility?.repeatedRunGateAgreement?.status ?? 'NOT_READY'}`).join('\n\n')}\n\n## Decision output\n- Final decision label: **${decision}**\n- Claim posture: diagnostic/reduced-order (fail-closed on hard evidence gaps).\n\n## Boundary statement\n${BOUNDARY_STATEMENT}\n`,
  );

  return { counts: scoreboard.counts, decision, reconciled: scoreboard.reconciled };
};

export const runCampaignCli = async (argv = process.argv.slice(2)): Promise<CliResult> => {
  const args = parseArgs(argv);
  const waves: Wave[] = args.wave === 'all' ? ['A', 'B', 'C', 'D'] : [args.wave];
  const campaignStarted = Date.now();
  for (const wave of waves) {
    const campaignElapsedMs = Date.now() - campaignStarted;
    if (campaignElapsedMs > args.campaignTimeoutMs) {
      const timeoutArtifact = path.join(args.out, wave, 'evidence-pack.json');
      const requiredSignals: EvidencePack['requiredSignals'] = {
        initial_solver_status: { required: true, present: false },
        evaluation_gate_status: { required: true, present: false },
        hard_constraint_ford_roman_qi: { required: true, present: false },
        hard_constraint_theta_audit: { required: true, present: false },
        certificate_hash: { required: true, present: false },
        certificate_integrity: { required: true, present: false },
        provenance_chart: { required: true, present: false },
        provenance_observer: { required: true, present: false },
        provenance_normalization: { required: true, present: false },
        provenance_unit_system: { required: true, present: false },
      };
      const missingSignals = Object.keys(requiredSignals).sort();
      const gateMissingSignalMap = buildGateMissingSignalMap(missingSignals);
      const gateStatus: EvidencePack['gateStatus'] = {
        G0: 'NOT_READY',
        G1: 'NOT_READY',
        G2: 'NOT_READY',
        G3: 'NOT_READY',
        G4: 'NOT_READY',
        G5: 'NOT_APPLICABLE',
        G6: 'NOT_READY',
        G7: 'NOT_READY',
        G8: 'NOT_READY',
      };
      const gateDetails: EvidencePack['gateDetails'] = {
        G0: { status: 'NOT_READY', reason: 'Campaign timeout reached before wave execution.', source: 'campaign.timeout' },
        G1: { status: 'NOT_READY', reason: 'Initial solver status unavailable due campaign timeout.', source: 'campaign.timeout' },
        G2: { status: 'NOT_READY', reason: 'Evaluation gate status unavailable due campaign timeout.', source: 'campaign.timeout' },
        G3: { status: 'NOT_READY', reason: 'Certificate signal unavailable due campaign timeout.', source: 'campaign.timeout' },
        G4: { status: 'NOT_READY', reason: 'Hard constraint signals unavailable due campaign timeout.', source: 'campaign.timeout' },
        G5: { status: 'NOT_APPLICABLE', reason: 'Reduced-order campaign; physical feasibility gate not evaluated.', source: 'campaign.policy.reduced-order' },
        G6: { status: 'NOT_READY', reason: 'No run outputs persisted before campaign timeout.', source: 'campaign.timeout' },
        G7: { status: 'NOT_READY', reason: 'Stability check unavailable due campaign timeout.', source: 'campaign.timeout' },
        G8: { status: 'NOT_READY', reason: 'Replication parity unavailable due campaign timeout.', source: 'campaign.timeout' },
      };
      writeJson(timeoutArtifact, {
        commitSha: execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(),
        runTimestamp: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        runId: `fs-${wave.toLowerCase()}-${args.seed}-${Date.now()}`,
        traceId: `trace-${hashId(`${wave}-${args.seed}-campaign-timeout`)}`,
        wave,
        seed: args.seed,
        provenance: {
          command: `npm run warp:full-solve:campaign -- --wave ${wave}${args.ci ? ' --ci' : ''}`,
          cwd: process.cwd(),
          mode: args.ci ? 'ci' : 'local',
        },
        commandMetadata: {
          maxIterations: WAVE_PROFILES[wave].options.maxIterations ?? 0,
          runCount: WAVE_PROFILES[wave].runCount,
          waveProfile: WAVE_PROFILES[wave].options,
        },
        runArtifacts: [],
        gateStatus,
        gateDetails,
        firstFail: 'G0',
        firstFailReason: 'Campaign timeout reached before wave execution.',
        parsedGateMap: gateDetails,
        evaluationSummary: { hardConstraintMap: {}, gateStatusByAttempt: [] },
        requiredSignals,
        missingSignals,
        gateMissingSignalMap,
        timeout: { kind: 'campaign_timeout', timeoutMs: args.campaignTimeoutMs, elapsedMs: campaignElapsedMs, wave },
        reproducibility: {
          repeatedRunGateAgreement: { status: 'NOT_READY', agreementRatio: null, reason: 'No runs executed before campaign timeout.' },
          constraintPayloadDrift: { status: 'NOT_READY', driftRatio: null, reason: 'No runs executed before campaign timeout.' },
          residualTrend: {
            status: 'NOT_READY',
            fidelityLevels: 0,
            trend: 'unknown',
            reason: 'No runs executed before campaign timeout.',
            series: [],
          },
        },
        claimPosture: 'diagnostic/reduced-order',
        boundaryStatement: BOUNDARY_STATEMENT,
      });
      break;
    }
    await runWave(wave, args.out, args.seed, args.ci, args.waveTimeoutMs, campaignElapsedMs, args.campaignTimeoutMs);
  }
  const allWaves: Wave[] = ['A', 'B', 'C', 'D'];
  const campaign = allWaves.every((w) => fs.existsSync(path.join(args.out, w, 'evidence-pack.json')))
    ? regenCampaign(args.out, allWaves)
    : { counts: null, decision: 'NOT_READY', reconciled: false };
  return { ok: true, waves, out: args.out, campaign, mode: args.ci ? 'ci' : 'local' };
};

export const CAMPAIGN_USAGE =
  'Usage: npm run warp:full-solve:campaign -- --wave A|B|C|D|all [--out <dir>] [--seed <integer>] [--wave-timeout-ms <ms>] [--campaign-timeout-ms <ms>] [--ci]';
