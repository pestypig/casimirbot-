import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runPromotionBundle } from '../scripts/warp-full-solve-promotion-bundle';

const writeJson = (filePath: string, payload: unknown) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
};

describe('warp-full-solve-promotion-bundle', () => {
  it('fails closed when promotion-check artifact is missing after generation command', () => {
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'warp-promotion-bundle-missing-'));
    const promotionCheckPath = path.join(tmpRoot, 'promotion-check.json');
    const outPath = path.join(tmpRoot, 'promotion-bundle.json');

    const result = runPromotionBundle({
      rootDir: tmpRoot,
      promotionCheckPath,
      outPath,
      runCommand: () => undefined,
      getCommitHash: () => 'abc123',
    });

    expect(result.blockedReason).toBe('promotion_check_missing_after_generation');
    expect(result.promotionLaneExecuted).toBe(false);
    expect(result.candidateId).toBeNull();
    expect(fs.existsSync(outPath)).toBe(true);
  });

  it('fails closed when promotion-check candidate readiness is false', () => {
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'warp-promotion-bundle-not-ready-'));
    const promotionCheckPath = path.join(tmpRoot, 'promotion-check.json');
    const outPath = path.join(tmpRoot, 'promotion-bundle.json');

    writeJson(promotionCheckPath, {
      blockedReason: null,
      candidate: {
        id: 'case_0001',
      },
      aggregate: {
        candidatePromotionReady: false,
        candidatePromotionStable: false,
      },
      provenance: {
        commitHash: 'abc123',
      },
    });

    const result = runPromotionBundle({
      rootDir: tmpRoot,
      promotionCheckPath,
      outPath,
      runCommand: () => undefined,
      getCommitHash: () => 'abc123',
    });

    expect(result.blockedReason).toBe('promotion_check_not_ready:ready=false;stable=false');
    expect(result.promotionLaneExecuted).toBe(false);
    expect(result.candidateId).toBeNull();
  });

  it('runs promoted lane and emits deterministic summary when promotion check is ready', () => {
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'warp-promotion-bundle-pass-'));
    const promotionCheckPath = path.join(tmpRoot, 'promotion-check.json');
    const promotionLaneOutDir = path.join(tmpRoot, 'promotion-lane');
    const outPath = path.join(tmpRoot, 'promotion-bundle.json');
    const commandCalls: string[] = [];

    writeJson(promotionCheckPath, {
      blockedReason: null,
      candidate: {
        id: 'case_0001',
      },
      aggregate: {
        candidatePromotionReady: true,
        candidatePromotionStable: true,
      },
      provenance: {
        commitHash: 'abc123',
      },
    });
    writeJson(path.join(promotionLaneOutDir, 'campaign-gate-scoreboard-2026-02-24.json'), {
      decision: 'REDUCED_ORDER_ADMISSIBLE',
      statusCounts: { PASS: 8, FAIL: 0, UNKNOWN: 0, NOT_READY: 0, NOT_APPLICABLE: 1 },
    });
    writeJson(path.join(promotionLaneOutDir, 'campaign-first-fail-map-2026-02-24.json'), {
      globalFirstFail: 'none',
    });
    for (const wave of ['A', 'B', 'C', 'D']) {
      writeJson(path.join(promotionLaneOutDir, wave, 'qi-forensics.json'), {
        lhs_Jm3: -3.09,
        boundComputed_Jm3: -24,
        boundUsed_Jm3: -24,
        marginRatioRawComputed: 0.12,
        applicabilityStatus: 'PASS',
        rhoSource: 'warp.metric.T00.natario_sdf.shift',
      });
    }

    const result = runPromotionBundle({
      rootDir: tmpRoot,
      promotionCheckPath,
      promotionLaneOutDir,
      outPath,
      requestedCandidateId: 'case_0001',
      runCommand: (args) => {
        commandCalls.push(args.join(' '));
      },
      getCommitHash: () => 'abc123',
    });

    expect(result.blockedReason).toBeNull();
    expect(result.candidateId).toBe('case_0001');
    expect(result.promotionLaneExecuted).toBe(true);
    expect(result.promotionLaneDecision).toBe('REDUCED_ORDER_ADMISSIBLE');
    expect(result.promotionLaneFirstFail).toBe('none');
    expect(result.promotionLaneG4ComparablePassAllWaves).toBe(true);
    expect(result.promotionLaneCounts?.PASS).toBe(8);
    expect(commandCalls).toHaveLength(2);
    expect(commandCalls[0]).toContain('warp:full-solve:g4-candidate-promotion-check');
    expect(commandCalls[1]).toContain('warp:full-solve:campaign');
    expect(commandCalls[1]).toContain('--promote-candidate-id case_0001');

    const persisted = JSON.parse(fs.readFileSync(outPath, 'utf8')) as Record<string, unknown>;
    expect(persisted.blockedReason).toBeNull();
    expect((persisted as any).governance?.canonicalDecisionRemainsAuthoritative).toBe(true);
  });
});
