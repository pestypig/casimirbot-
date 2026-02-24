import { describe, expect, it, vi } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import {
  aggregateGateStatusAcrossWaves,
  buildGateMap,
  deriveCampaignDecision,
  deriveFirstFail,
  parseArgs,
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
    const { stdout } = await execFileAsync('npx', ['tsx', cliPath, '--wave', 'A', '--ci'], {
      timeout: 120_000,
      maxBuffer: 1024 * 1024,
    });
    expect(stdout).toContain('"ok": true');
  }, 125_000);
});
