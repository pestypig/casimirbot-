import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runRecoverySearch } from '../scripts/warp-g4-recovery-search';

describe('warp-g4-recovery-search', () => {
  it('is deterministic for fixed seed', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'g4-recovery-'));
    const outA = path.join(root, 'a.json');
    const outB = path.join(root, 'b.json');
    await runRecoverySearch({ outPath: outA, seed: 1234, maxCases: 12, topN: 5, runtimeCapMs: 10_000 });
    await runRecoverySearch({ outPath: outB, seed: 1234, maxCases: 12, topN: 5, runtimeCapMs: 10_000 });
    const a = JSON.parse(fs.readFileSync(outA, 'utf8'));
    const b = JSON.parse(fs.readFileSync(outB, 'utf8'));
    expect(a.caseCount).toBe(12);
    expect(b.caseCount).toBe(12);
    expect(a.cases).toEqual(b.cases);
    expect(a.topRankedApplicabilityPassCases).toEqual(b.topRankedApplicabilityPassCases);
  });

  it('writes bounded deterministic settings and required fields', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'g4-recovery-'));
    const out = path.join(root, 'out.json');
    await runRecoverySearch({ outPath: out, seed: 9, maxCases: 8, runtimeCapMs: 10_000 });
    const payload = JSON.parse(fs.readFileSync(out, 'utf8'));
    expect(payload.deterministicSearch.seed).toBe(9);
    expect(payload.deterministicSearch.maxCases).toBe(8);
    expect(payload.caseCount).toBe(8);
    expect(typeof payload.candidatePassFound).toBe('boolean');
    expect(payload.bestCandidate).not.toBeNull();
    expect(Array.isArray(payload.cases)).toBe(true);
    for (const row of payload.cases) {
      expect(row).toHaveProperty('lhs_Jm3');
      expect(row).toHaveProperty('boundComputed_Jm3');
      expect(row).toHaveProperty('boundUsed_Jm3');
      expect(row).toHaveProperty('marginRatioRaw');
      expect(row).toHaveProperty('marginRatioRawComputed');
      expect(row).toHaveProperty('applicabilityStatus');
      expect(row).toHaveProperty('reasonCode');
      expect(row).toHaveProperty('rhoSource');
      expect(row).toHaveProperty('classificationTag');
    }
  });

  it('does not mutate canonical artifact during temp output runs', async () => {
    const canonical = path.resolve('artifacts/research/full-solve/g4-recovery-search-2026-02-27.json');
    const before = fs.existsSync(canonical) ? fs.readFileSync(canonical, 'utf8') : null;
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'g4-recovery-'));
    const out = path.join(root, 'temp.json');
    await runRecoverySearch({ outPath: out, seed: 7, maxCases: 6, runtimeCapMs: 10_000 });
    const after = fs.existsSync(canonical) ? fs.readFileSync(canonical, 'utf8') : null;
    expect(after).toBe(before);
  });
});
