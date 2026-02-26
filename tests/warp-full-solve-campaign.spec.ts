import { describe, expect, it, vi } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  aggregateGateStatusAcrossWaves,
  buildGateMap,
  buildGateMissingSignalMap,
  buildNotReadyClassification,
  deriveG4Diagnostics,
  collectRequiredSignals,
  computeReproducibility,
  buildQiForensicsArtifact,
  deriveCampaignDecision,
  deriveFirstFail,
  parseArgs,
  parsePositiveIntArg,
  parseSeedArg,
  parseWaveArg,
  summarizeScoreboard,
} from '../scripts/warp-full-solve-campaign';

const execFileAsync = promisify(execFile);

describe('warp-full-solve-campaign runner', () => {
  it('is import-safe and does not execute cli side effects on import', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await import('../scripts/warp-full-solve-campaign');
    expect(logSpy).not.toHaveBeenCalled();
    expect(errSpy).not.toHaveBeenCalled();
    logSpy.mockRestore();
    errSpy.mockRestore();
  });

  it('rejects invalid --wave values with explicit error', () => {
    expect(() => parseWaveArg('Z')).toThrow(/Allowed values: A\|B\|C\|D\|all/);
  });

  it('rejects invalid --seed values with explicit error', () => {
    expect(() => parseSeedArg('abc')).toThrow(/Seed must be a finite integer/);
    expect(() => parseSeedArg('1.5')).toThrow(/Seed must be a finite integer/);
    expect(() => parseArgs(['--seed', 'nan'])).toThrow(/Seed must be a finite integer/);
  });

  it('keeps missing evidence fail-closed as NOT_READY', () => {
    const result = deriveFirstFail({
      G0: { status: 'PASS', reason: 'ok', source: 'x' },
      G1: { status: 'NOT_READY', reason: 'missing initial', source: 'x' },
      G2: { status: 'PASS', reason: 'ok', source: 'x' },
      G3: { status: 'PASS', reason: 'ok', source: 'x' },
      G4: { status: 'PASS', reason: 'ok', source: 'x' },
      G6: { status: 'PASS', reason: 'ok', source: 'x' },
      G7: { status: 'PASS', reason: 'ok', source: 'x' },
      G8: { status: 'PASS', reason: 'ok', source: 'x' },
    });
    expect(result.firstFail).toBe('G1');
    expect(result.reason).toContain('missing initial');
  });

  it('reconciles scoreboard counts including NOT_APPLICABLE', () => {
    const scoreboard = summarizeScoreboard({
      G0: 'PASS',
      G1: 'FAIL',
      G2: 'UNKNOWN',
      G3: 'NOT_READY',
      G4: 'NOT_APPLICABLE',
    });
    expect(scoreboard.counts).toEqual({ PASS: 1, FAIL: 1, UNKNOWN: 1, NOT_READY: 1, NOT_APPLICABLE: 1 });
    expect(scoreboard.reconciled).toBe(true);
    expect(scoreboard.total).toBe(scoreboard.gateCount);
  });


  it('classifies NOT_READY gate causes by timeout and missing signals', () => {
    const gateMap = {
      G0: { status: 'NOT_READY', reason: 'timeout', source: 'campaign.timeout' },
      G1: { status: 'NOT_READY', reason: 'missing initial', source: 'gr-agent-loop.attempt.initial.status' },
      G5: { status: 'NOT_APPLICABLE', reason: 'n/a', source: 'campaign.policy.reduced-order' },
    } as any;
    const classification = buildNotReadyClassification(
      gateMap,
      { G1: ['initial_solver_status'] },
      { kind: 'wave_timeout', timeoutMs: 1000, elapsedMs: 1000, wave: 'A' },
    );
    expect(classification.gateCauseClass.G0).toBe('timeout_budget');
    expect(classification.gateCauseClass.G1).toBe('timeout_budget');
    expect(classification.notReadyClassCounts.timeout_budget).toBe(2);
  });

  it('derives explicit G4 diagnostics from evaluator constraints', () => {
    const diagnostics = deriveG4Diagnostics({
      evaluation: {
        constraints: [
          { id: 'FordRomanQI', status: 'fail', note: 'FordRoman hard fail' },
          { id: 'ThetaAudit', status: 'pass', note: 'Theta ok' },
        ],
      },
    } as any);
    expect(diagnostics.fordRomanStatus).toBe('fail');
    expect(diagnostics.thetaAuditStatus).toBe('pass');
    expect(diagnostics.source).toBe('evaluator_constraints');
    expect(diagnostics.reason.join(' | ')).toContain('FordRoman hard fail');
    expect(diagnostics.reasonCode).toEqual([]);
  });

  it('keeps synthesized unknown provenance and deterministic reasonCode for missing hard sources', () => {
    const diagnostics = deriveG4Diagnostics({
      evaluation: {
        constraints: [
          {
            id: 'FordRomanQI',
            status: 'unknown',
            note: 'reasonCode=G4_QI_SIGNAL_MISSING;source=synthesized_unknown;FordRomanQI missing from warp-viability evaluator constraints.',
          },
          {
            id: 'ThetaAudit',
            status: 'unknown',
            note: 'reasonCode=G4_QI_SIGNAL_MISSING;source=synthesized_unknown;ThetaAudit missing from warp-viability evaluator constraints.',
          },
        ],
      },
    } as any);
    expect(diagnostics.source).toBe('synthesized_unknown');
    expect(diagnostics.reasonCode).toEqual([
      'G4_QI_SIGNAL_MISSING',
    ]);
    expect(diagnostics.reason.join(' | ')).toContain('source=synthesized_unknown');
  });


  it('derives FordRoman fail reason codes and exported diagnostics fields', () => {
    const diagnostics = deriveG4Diagnostics({
      evaluation: {
        constraints: [
          {
            id: 'FordRomanQI',
            status: 'fail',
            note: 'reasonCode=G4_QI_SOURCE_NOT_METRIC;reasonCode=G4_QI_MARGIN_EXCEEDED;lhs_Jm3=-2;bound_Jm3=-1;boundComputed_Jm3=-0.75;boundFloor_Jm3=-1;boundUsed_Jm3=-1;boundFloorApplied=true;marginRatio=2',
          },
          { id: 'ThetaAudit', status: 'pass', note: 'theta ok' },
        ],
      },
      certificate: {
        payload: {
          snapshot: {
            qi_lhs_Jm3: -2,
            qi_bound_Jm3: -1,
            qi_bound_computed_Jm3: -0.75,
            qi_bound_floor_Jm3: -1,
            qi_bound_used_Jm3: -1,
            qi_bound_floor_applied: true,
            qi_margin_ratio: 2,
            qi_margin_ratio_raw: 2,
            qi_rho_source: 'proxy',
            qi_metric_contract_status: 'missing',
            qi_applicability_status: 'PASS',
            qi_curvature_ok: true,
            qi_curvature_ratio: 0.5,
            qi_curvature_enforced: true,
            qi_bound_tau_s: 1,
            qi_bound_K: 3,
            qi_safetySigma_Jm3: 4,
          },
        },
      },
    } as any);
    expect(diagnostics.reasonCode).toEqual(['G4_QI_SOURCE_NOT_METRIC', 'G4_QI_MARGIN_EXCEEDED']);
    expect(diagnostics.lhs_Jm3).toBe(-2);
    expect(diagnostics.bound_Jm3).toBe(-1);
    expect(diagnostics.boundComputed_Jm3).toBe(-0.75);
    expect(diagnostics.boundFloor_Jm3).toBe(-1);
    expect(diagnostics.boundUsed_Jm3).toBe(-1);
    expect(diagnostics.boundFloorApplied).toBe(true);
    expect(diagnostics.marginRatio).toBe(2);
    expect(diagnostics.metricContractStatus).toBe('missing');
  });

  it('treats null snapshot numerics as missing instead of coercing to 0', () => {
    const diagnostics = deriveG4Diagnostics({
      evaluation: {
        constraints: [
          {
            id: 'FordRomanQI',
            status: 'fail',
            note: 'lhs_Jm3=-9;bound_Jm3=-3;marginRatio=3;K=7;safetySigma_Jm3=11',
          },
          { id: 'ThetaAudit', status: 'pass', note: 'theta ok' },
        ],
      },
      certificate: {
        payload: {
          snapshot: {
            qi_lhs_Jm3: null,
            qi_bound_Jm3: null,
            qi_margin_ratio: null,
            qi_bound_K: null,
            qi_safetySigma_Jm3: null,
          },
        },
      },
    } as any);

    expect(diagnostics.lhs_Jm3).toBe(-9);
    expect(diagnostics.bound_Jm3).toBe(-3);
    expect(diagnostics.marginRatio).toBe(3);
    expect(diagnostics.K).toBe(7);
    expect(diagnostics.safetySigma_Jm3).toBe(11);
  });

  it('treats undefined and placeholder snapshot numerics as missing without coercion', () => {
    const diagnostics = deriveG4Diagnostics({
      evaluation: {
        constraints: [
          {
            id: 'FordRomanQI',
            status: 'fail',
            note: 'marginRatio=2;K=13;safetySigma_Jm3=17',
          },
          { id: 'ThetaAudit', status: 'pass', note: 'theta ok' },
        ],
      },
      certificate: {
        payload: {
          snapshot: {
            qi_margin_ratio: undefined,
            qi_bound_K: 'unknown',
            qi_safetySigma_Jm3: 'n/a',
            qi_bound_tau_s: '',
          },
        },
      },
    } as any);

    expect(diagnostics.marginRatio).toBe(2);
    expect(diagnostics.K).toBe(13);
    expect(diagnostics.safetySigma_Jm3).toBe(17);
    expect(diagnostics.tau_s).toBeUndefined();
  });

  it('preserves deterministic reasonCode ordering when extracted from notes', () => {
    const diagnostics = deriveG4Diagnostics({
      evaluation: {
        constraints: [
          {
            id: 'FordRomanQI',
            status: 'fail',
            note: 'reasonCode=G4_QI_MARGIN_EXCEEDED;reasonCode=G4_QI_SOURCE_NOT_METRIC',
          },
          {
            id: 'ThetaAudit',
            status: 'unknown',
            note: 'reasonCode=G4_QI_SIGNAL_MISSING;reasonCode=G4_QI_MARGIN_EXCEEDED',
          },
        ],
      },
    } as any);

    expect(diagnostics.reasonCode).toEqual([
      'G4_QI_SIGNAL_MISSING',
      'G4_QI_SOURCE_NOT_METRIC',
      'G4_QI_MARGIN_EXCEEDED',
    ]);
  });

  it('does not emit generic synthesized fallback when source values are available', () => {
    const diagnostics = deriveG4Diagnostics({
      evaluation: {
        constraints: [
          { id: 'FordRomanQI', status: 'pass', note: 'FordRomanQI evaluated from warp viability.' },
          { id: 'ThetaAudit', status: 'fail', note: 'ThetaAudit evaluated from warp viability.' },
        ],
      },
    } as any);
    expect(diagnostics.source).toBe('evaluator_constraints');
    expect(diagnostics.reasonCode).toEqual([]);
    expect(diagnostics.reason.join(' | ')).not.toContain('synthesized unknown diagnostics');
  });

  it('flags synthesized_unknown when both G4 entries are absent', () => {
    const diagnostics = deriveG4Diagnostics({
      evaluation: {
        constraints: [{ id: 'OtherConstraint', status: 'pass', note: 'not part of G4' }],
      },
    } as any);
    expect(diagnostics.fordRomanStatus).toBe('missing');
    expect(diagnostics.thetaAuditStatus).toBe('missing');
    expect(diagnostics.source).toBe('synthesized_unknown');
    expect(diagnostics.reasonCode).toEqual([
      'G4_QI_SIGNAL_MISSING',
    ]);
  });

  it('flags synthesized_unknown for partial G4 payloads without false evaluator attribution', () => {
    const diagnostics = deriveG4Diagnostics({
      evaluation: {
        constraints: [{ id: 'ThetaAudit', status: 'pass', note: 'ThetaAudit evaluated from warp viability.' }],
      },
    } as any);
    expect(diagnostics.fordRomanStatus).toBe('missing');
    expect(diagnostics.thetaAuditStatus).toBe('pass');
    expect(diagnostics.source).toBe('synthesized_unknown');
    expect(diagnostics.reasonCode).toEqual(['G4_QI_SIGNAL_MISSING']);
  });



  it('keeps canonical snapshot values when fallback note text is non-numeric', () => {
    const diagnostics = deriveG4Diagnostics({
      evaluation: {
        constraints: [
          {
            id: 'FordRomanQI',
            status: 'fail',
            note: 'marginRatioRaw=unknown;marginRatio=n/a;applicabilityStatus=NOT_APPLICABLE;rhoSource=proxy',
          },
          { id: 'ThetaAudit', status: 'pass', note: 'theta ok' },
        ],
      },
      certificate: {
        payload: {
          snapshot: {
            qi_margin_ratio_raw: 0.75,
            qi_margin_ratio: 0.5,
            qi_applicability_status: 'PASS',
            qi_rho_source: 'gr.rho_constraint',
          },
        },
      },
    } as any);
    expect(diagnostics.marginRatioRaw).toBe(0.75);
    expect(diagnostics.marginRatio).toBe(0.5);
    expect(diagnostics.applicabilityStatus).toBe('PASS');
    expect(diagnostics.rhoSource).toBe('gr.rho_constraint');
  });

  it('builds qi-forensics payload with finite-or-null numeric hygiene', () => {
    const pack = {
      runId: 'run-1',
      wave: 'A',
      seed: 7,
      completedAt: '2026-02-24T00:00:00.000Z',
      g4Diagnostics: {
        lhs_Jm3: Number.NaN,
        bound_Jm3: -2,
        marginRatioRaw: Infinity,
        marginRatio: 0.5,
        tau_s: undefined,
        K: 12,
        safetySigma_Jm3: Number.NaN,
        curvatureRatio: 1,
        curvatureEnforced: true,
        curvatureOk: false,
        applicabilityStatus: 'FAIL',
        rhoSource: 'gr.rho_constraint',
        reasonCode: ['G4_QI_MARGIN_EXCEEDED'],
      },
    } as any;
    const attempt = {
      certificate: {
        payload: {
          snapshot: {
            qi_metric_derived: true,
            qi_metric_contract_ok: false,
            qi_curvature_scalar: Number.NaN,
            qi_curvature_radius_m: 4,
            qiGuardrail: {
              effectiveRho: Number.NaN,
              rhoOn: -1,
              sampler: 'gaussian',
              fieldType: 'em',
            },
          },
        },
      },
    } as any;
    const artifact = buildQiForensicsArtifact(pack, attempt);
    expect(artifact.lhs_Jm3).toBeNull();
    expect(artifact.bound_Jm3).toBe(-2);
    expect(artifact.marginRatioRaw).toBeNull();
    expect(artifact.marginRatioClamped).toBe(0.5);
    expect(artifact.effectiveRho_SI_Jm3).toBeNull();
    expect(artifact.rhoOn_SI_Jm3).toBe(-1);
    expect(artifact.curvatureScalar).toBeNull();
    expect(artifact.curvatureRadius_m).toBe(4);
  });

  it('derives deterministic first-fail from canonical gate order', () => {
    const gateMap = {
      G0: { status: 'PASS', reason: 'ok', source: 'x' },
      G1: { status: 'PASS', reason: 'ok', source: 'x' },
      G2: { status: 'FAIL', reason: 'hard fail', source: 'x' },
      G3: { status: 'FAIL', reason: 'later fail', source: 'x' },
      G4: { status: 'PASS', reason: 'ok', source: 'x' },
      G6: { status: 'PASS', reason: 'ok', source: 'x' },
      G7: { status: 'PASS', reason: 'ok', source: 'x' },
      G8: { status: 'PASS', reason: 'ok', source: 'x' },
    } as const;
    expect(deriveFirstFail(gateMap as any)).toEqual({ firstFail: 'G2', reason: 'hard fail' });
    expect(deriveFirstFail(gateMap as any)).toEqual({ firstFail: 'G2', reason: 'hard fail' });
  });

  it('G7/G8 compare latest attempt semantics for repeated runs', () => {
    const mk = (gateStatusA0: string, gateStatusA1: string, constraintsA0: unknown[], constraintsA1: unknown[]) =>
      ({
        attempts: [
          { evaluation: { gate: { status: gateStatusA0 }, constraints: constraintsA0 } },
          { evaluation: { gate: { status: gateStatusA1 }, constraints: constraintsA1 } },
        ],
      }) as any;

    const runResults = [
      mk('pass', 'fail', [{ id: 'FordRomanQI', status: 'pass' }], [{ id: 'FordRomanQI', status: 'fail' }]),
      mk('pass', 'fail', [{ id: 'FordRomanQI', status: 'pass' }], [{ id: 'FordRomanQI', status: 'fail' }]),
    ];

    const gatesC = buildGateMap('C', runResults, [] as any);
    const gatesD = buildGateMap('D', runResults, [] as any);
    expect(gatesC.G7.status).toBe('PASS');
    expect(gatesD.G8.status).toBe('PASS');
  });

  it('G7/G8 return NOT_READY with explicit missing evaluation reasons', () => {
    const incompleteRuns = [
      { attempts: [{ evaluation: { gate: {}, constraints: [] } }] },
      { attempts: [] },
    ] as any;
    const gatesC = buildGateMap('C', incompleteRuns, [] as any);
    const gatesD = buildGateMap('D', incompleteRuns, [] as any);
    expect(gatesC.G7.status).toBe('NOT_READY');
    expect(gatesC.G7.reason).toContain('missing_latest_evaluation');
    expect(gatesC.G7.reason).toContain('missing_gate_status');
    expect(gatesD.G8.status).toBe('NOT_READY');
    expect(gatesD.G8.reason).toContain('missing_constraints_payload');
  });



  it('parses timeout args strictly as finite integers', () => {
    expect(() => parsePositiveIntArg('abc', 'wave-timeout-ms')).toThrow(/positive integer in milliseconds/);
    expect(() => parsePositiveIntArg('1.2', 'campaign-timeout-ms')).toThrow(/positive integer in milliseconds/);
    expect(() => parsePositiveIntArg('0', 'campaign-timeout-ms')).toThrow(/positive integer in milliseconds/);
    expect(() => parseArgs(['--wave-timeout-ms', 'abc'])).toThrow(/Invalid --wave-timeout-ms value/);
    expect(() => parseArgs(['--campaign-timeout-ms', '1.2'])).toThrow(/Invalid --campaign-timeout-ms value/);
  });

  it('keeps CI fast-path opt-in and independent from --ci', () => {
    const ciOnly = parseArgs(['--ci']);
    expect(ciOnly.ci).toBe(true);
    expect(ciOnly.ciFastPath).toBe(false);

    const ciFast = parseArgs(['--ci', '--ci-fast-path']);
    expect(ciFast.ci).toBe(true);
    expect(ciFast.ciFastPath).toBe(true);

    const localFast = parseArgs(['--ci-fast-path']);
    expect(localFast.ci).toBe(false);
    expect(localFast.ciFastPath).toBe(true);
  });

  it('marks gates NOT_READY when required signals are missing', () => {
    const incompleteRuns = [{ attempts: [{ initial: {}, evaluation: { gate: {}, constraints: [] } }] }] as any;
    const gates = buildGateMap('A', incompleteRuns, [] as any);
    expect(gates.G1.status).toBe('NOT_READY');
    expect(gates.G2.status).toBe('NOT_READY');
    expect(gates.G4.status).toBe('NOT_READY');
  });

  it('cross-wave aggregation uses deterministic precedence', () => {
    const aggregate = aggregateGateStatusAcrossWaves([
      { G7: 'PASS', G8: 'NOT_APPLICABLE' },
      { G7: 'UNKNOWN', G8: 'PASS' },
      { G7: 'NOT_READY', G8: 'PASS' },
      { G7: 'FAIL', G8: 'PASS' },
    ]);
    expect(aggregate.G7).toBe('FAIL');
    expect(aggregate.G8).toBe('PASS');
    expect(deriveCampaignDecision(summarizeScoreboard(aggregate).counts)).toBe('INADMISSIBLE');
  });

  it('G6 reflects raw artifact evidence and explicit missing evaluator signals', () => {
    const runResults = [{ attempts: [] }] as any;
    const runArtifacts = [{ outputPath: __filename, runIndex: 1, startedAt: '', completedAt: '', durationMs: 1, accepted: false, state: 'error', attemptCount: 0 }] as any;
    const gates = buildGateMap('A', runResults, runArtifacts);
    expect(gates.G6.status).toBe('FAIL');
    expect(gates.G6.reason).toContain('Raw run outputs persisted but evaluator signals are missing');
  });

  it('CLI completes within bounded time (no hang)', async () => {
    const cliPath = path.resolve('scripts/warp-full-solve-campaign-cli.ts');
    const tsxCli = path.resolve('node_modules/tsx/dist/cli.mjs');
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'warp-wave-bounded-'));
    const outDir = path.join(tempRoot, 'out');
    const { stdout } = await execFileAsync(process.execPath, [
      tsxCli,
      cliPath,
      '--wave',
      'A',
      '--out',
      outDir,
      '--ci',
      '--wave-timeout-ms',
      '4000',
      '--campaign-timeout-ms',
      '10000',
    ], {
      timeout: 45_000,
      maxBuffer: 1024 * 1024,
    });
    expect(stdout).toContain('"ok": true');
  }, 50_000);

  it('synthesizes trailing run artifacts when a multi-run wave exits early', async () => {
    const cliPath = path.resolve('scripts/warp-full-solve-campaign-cli.ts');
    const tsxCli = path.resolve('node_modules/tsx/dist/cli.mjs');
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'warp-wave-synth-'));
    const outDir = path.join(tempRoot, 'out');
    await execFileAsync(process.execPath, [
      tsxCli,
      cliPath,
      '--wave',
      'C',
      '--out',
      outDir,
      '--ci',
      '--wave-timeout-ms',
      '1',
      '--campaign-timeout-ms',
      '2000',
    ], {
      timeout: 45_000,
      maxBuffer: 1024 * 1024,
    });
    const run1Path = path.join(outDir, 'C', 'run-1-raw-output.json');
    const run2Path = path.join(outDir, 'C', 'run-2-raw-output.json');
    expect(fs.existsSync(run1Path)).toBe(true);
    expect(fs.existsSync(run2Path)).toBe(true);
    const run2 = JSON.parse(fs.readFileSync(run2Path, 'utf8'));
    expect(run2.runIndex).toBe(2);
    expect(run2.skipped).toBe(true);
    expect(run2.durationMs).toBe(0);
    expect(typeof run2.error).toBe('string');
  }, 50_000);

  it('emits executive translation reference in wave evidence pack', async () => {
    const cliPath = path.resolve('scripts/warp-full-solve-campaign-cli.ts');
    const tsxCli = path.resolve('node_modules/tsx/dist/cli.mjs');
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'warp-wave-translation-ref-'));
    const outDir = path.join(tempRoot, 'out');
    await execFileAsync(process.execPath, [
      tsxCli,
      cliPath,
      '--wave',
      'C',
      '--out',
      outDir,
      '--ci',
      '--wave-timeout-ms',
      '1',
      '--campaign-timeout-ms',
      '2000',
    ], {
      timeout: 45_000,
      maxBuffer: 1024 * 1024,
    });
    const evidencePath = path.join(outDir, 'C', 'evidence-pack.json');
    const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
    expect(typeof evidence.executiveTranslationRef).toBe('string');
    expect(String(evidence.executiveTranslationRef)).toContain('docs/audits/research/warp-gates-executive-translation-2026-02-24.md');
  }, 50_000);

  it('residualTrend is FAIL when non-decreasing and PASS when strictly decreasing', () => {
    const nonDecreasing = computeReproducibility([
      { attempts: [{ initial: { residual: 1 }, evaluation: { gate: { status: 'pass' }, constraints: [] } }] },
      { attempts: [{ initial: { residual: 1 }, evaluation: { gate: { status: 'pass' }, constraints: [] } }] },
    ] as any);
    expect(nonDecreasing.residualTrend.status).toBe('FAIL');
    expect(nonDecreasing.residualTrend.trend).toBe('non_decreasing');

    const decreasing = computeReproducibility([
      { attempts: [{ initial: { residual: 2 }, evaluation: { gate: { status: 'pass' }, constraints: [] } }] },
      { attempts: [{ initial: { residual: 1 }, evaluation: { gate: { status: 'pass' }, constraints: [] } }] },
    ] as any);
    expect(decreasing.residualTrend.status).toBe('PASS');
    expect(decreasing.residualTrend.trend).toBe('decreasing');
  });

  it('marks provenance signals as missing when pipeline provenance fields are unavailable', () => {
    const attempt = {
      initial: { status: 'CERTIFIED' },
      evaluation: {
        gate: { status: 'pass' },
        constraints: [
          { id: 'FordRomanQI', status: 'pass' },
          { id: 'ThetaAudit', status: 'pass' },
        ],
        certificate: { certificateHash: 'abc', integrityOk: true },
      },
    } as any;
    const latestResult = { finalState: {} } as any;
    const { requiredSignals, missingSignals } = collectRequiredSignals(attempt, latestResult);
    expect(requiredSignals.provenance_chart.present).toBe(false);
    expect(requiredSignals.provenance_observer.present).toBe(false);
    expect(requiredSignals.provenance_normalization.present).toBe(false);
    expect(requiredSignals.provenance_unit_system.present).toBe(false);
    const gateMap = buildGateMissingSignalMap(missingSignals);
    expect(gateMap.G6).toEqual(expect.arrayContaining(['provenance_chart', 'provenance_observer', 'provenance_normalization', 'provenance_unit_system']));
  });

  it('uses attempt grRequest provenance fallback when finalState is restored without metric contract metadata', () => {
    const attempt = {
      initial: { status: 'CERTIFIED' },
      evaluation: {
        gate: { status: 'pass' },
        constraints: [
          { id: 'FordRomanQI', status: 'pass' },
          { id: 'ThetaAudit', status: 'pass' },
        ],
        certificate: { certificateHash: 'abc', integrityOk: true },
      },
      grRequest: {
        warp: {
          metricAdapter: { chart: { label: 'comoving_cartesian' } },
          metricT00Contract: {
            observer: 'eulerian_n',
            normalization: 'si_stress',
            unitSystem: 'SI',
          },
        },
      },
    } as any;
    const latestResult = { finalState: {} } as any;
    const { requiredSignals, missingSignals } = collectRequiredSignals(attempt, latestResult);
    expect(requiredSignals.provenance_chart.present).toBe(true);
    expect(requiredSignals.provenance_observer.present).toBe(true);
    expect(requiredSignals.provenance_normalization.present).toBe(true);
    expect(requiredSignals.provenance_unit_system.present).toBe(true);
    expect(missingSignals).not.toEqual(expect.arrayContaining(['provenance_chart', 'provenance_observer', 'provenance_normalization', 'provenance_unit_system']));
  });
  it('campaign export includes curvature applicability fields for waves A/B/C/D', async () => {
    const cliPath = path.resolve('scripts/warp-full-solve-campaign-cli.ts');
    const tsxCli = path.resolve('node_modules/tsx/dist/cli.mjs');
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'warp-wave-all-applicability-'));
    const outDir = path.join(tempRoot, 'out');
    await execFileAsync(process.execPath, [
      tsxCli,
      cliPath,
      '--wave',
      'all',
      '--out',
      outDir,
      '--ci',
      '--ci-fast-path',
      '--wave-timeout-ms',
      '3000',
      '--campaign-timeout-ms',
      '15000',
    ], {
      timeout: 90_000,
      maxBuffer: 1024 * 1024,
    });
    for (const wave of ['A', 'B', 'C', 'D']) {
      const qifPath = path.join(outDir, wave, 'qi-forensics.json');
      expect(fs.existsSync(qifPath)).toBe(true);
      const qif = JSON.parse(fs.readFileSync(qifPath, 'utf8'));
      expect(qif).toHaveProperty('applicabilityStatus');
      expect(qif).toHaveProperty('curvatureOk');
      expect(qif).toHaveProperty('curvatureRatio');
    }
  }, 100_000);

});
