import { describe, expect, it } from 'vitest';
import { deriveFirstFail, parseWaveArg, summarizeScoreboard } from '../scripts/warp-full-solve-campaign';

describe('warp-full-solve-campaign runner', () => {
  it('rejects invalid --wave values with explicit error', () => {
    expect(() => parseWaveArg('Z')).toThrow(/Allowed values: A\|B\|C\|D\|all/);
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
});
