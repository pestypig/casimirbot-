import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runRecoverySearch } from '../scripts/warp-g4-recovery-search';

const writeStepASummary = (summaryPath: string, canonicalComparableCaseCount: number) => {
  fs.writeFileSync(
    summaryPath,
    `${JSON.stringify(
      {
        canonicalComparableCaseCount,
        nonComparableCaseCount: 0,
        nonComparableBuckets: {
          non_comparable_missing_signals: 0,
          non_comparable_contract_mismatch: 0,
          non_comparable_other: 0,
        },
        minMarginRatioRawComputedComparable: null,
        candidatePassFoundCanonicalComparable: false,
      },
      null,
      2,
    )}\n`,
  );
};

describe('warp-g4-recovery-search', () => {
  it('is deterministic for fixed seed', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'g4-recovery-'));
    const outA = path.join(root, 'a.json');
    const outB = path.join(root, 'b.json');
    const stepA = path.join(root, 'g4-stepA-summary.json');
    writeStepASummary(stepA, 4);
    await runRecoverySearch({ outPath: outA, stepASummaryPath: stepA, seed: 1234, maxCases: 12, topN: 5, runtimeCapMs: 10_000 });
    writeStepASummary(stepA, 4);
    await runRecoverySearch({ outPath: outB, stepASummaryPath: stepA, seed: 1234, maxCases: 12, topN: 5, runtimeCapMs: 10_000 });
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
    const stepA = path.join(root, 'g4-stepA-summary.json');
    writeStepASummary(stepA, 4);
    await runRecoverySearch({ outPath: out, stepASummaryPath: stepA, seed: 9, maxCases: 8, runtimeCapMs: 10_000 });
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
      expect(row).toHaveProperty('comparabilityClass');
    }
  });



  it('records dual-semantics fields and new lever coverage', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'g4-recovery-'));
    const out = path.join(root, 'duals.json');
    const stepA = path.join(root, 'g4-stepA-summary.json');
    writeStepASummary(stepA, 4);
    await runRecoverySearch({ outPath: out, stepASummaryPath: stepA, seed: 77, maxCases: 10, topN: 4, runtimeCapMs: 10_000 });
    const payload = JSON.parse(fs.readFileSync(out, 'utf8'));
    expect(typeof payload.candidatePassFoundCanonical).toBe('boolean');
    expect(typeof payload.candidatePassFoundComputedOnly).toBe('boolean');
    expect(payload.candidatePassFound).toBe(payload.candidatePassFoundCanonical);
    expect(payload).toHaveProperty('minMarginRatioRawAmongApplicabilityPass');
    expect(payload).toHaveProperty('minMarginRatioRawComputedAmongApplicabilityPass');
    expect(payload.bestCandidateEligibility).toHaveProperty('canonicalPassEligible');
    expect(payload.bestCandidateEligibility).toHaveProperty('counterfactualPassEligible');
    expect(payload.bestCandidateEligibility).toHaveProperty('class');
    for (const row of payload.cases) {
      expect(row.params).toHaveProperty('qCavity');
      expect(row.params).toHaveProperty('qSpoilingFactor');
    }
  });

  it('caps total work and retains deterministic runtime-bounded ordering', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'g4-recovery-'));
    const outA = path.join(root, 'cap-a.json');
    const outB = path.join(root, 'cap-b.json');
    const stepA = path.join(root, 'g4-stepA-summary.json');
    writeStepASummary(stepA, 4);
    await runRecoverySearch({ outPath: outA, stepASummaryPath: stepA, seed: 123, maxCases: 3000, runtimeCapMs: 1_000 });
    writeStepASummary(stepA, 4);
    await runRecoverySearch({ outPath: outB, stepASummaryPath: stepA, seed: 123, maxCases: 3000, runtimeCapMs: 1_000 });
    const a = JSON.parse(fs.readFileSync(outA, 'utf8'));
    const b = JSON.parse(fs.readFileSync(outB, 'utf8'));
    expect(a.deterministicSearch.attemptedCaseUniverse).toBe(8709120);
    expect(a.caseCount).toBeLessThan(3000);
    expect(a.deterministicSearch.executedCaseCount).toBe(a.caseCount);
    expect(a.deterministicSearch.elapsedMs).toBeLessThanOrEqual(2_000);
    expect(a.deterministicSearch.deterministicWalk).toEqual(b.deterministicSearch.deterministicWalk);
    const overlap = Math.min(a.cases.length, b.cases.length);
    expect(a.cases.slice(0, overlap)).toEqual(b.cases.slice(0, overlap));
  });


  it('classifies comparability deterministically and emits stable Step A bucket accounting', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'g4-recovery-stepa-'));
    const outA = path.join(root, 'stepa-a.json');
    const outB = path.join(root, 'stepa-b.json');
    const summaryPath = path.join(root, 'g4-stepA-summary.json');

    writeStepASummary(summaryPath, 4);
    await runRecoverySearch({ outPath: outA, stepASummaryPath: summaryPath, seed: 42, maxCases: 16, topN: 4, runtimeCapMs: 10_000 });
    const summaryA = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    const payloadA = JSON.parse(fs.readFileSync(outA, 'utf8'));

    writeStepASummary(summaryPath, 4);
    await runRecoverySearch({ outPath: outB, stepASummaryPath: summaryPath, seed: 42, maxCases: 16, topN: 4, runtimeCapMs: 10_000 });
    const summaryB = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    const payloadB = JSON.parse(fs.readFileSync(outB, 'utf8'));

    expect(payloadA.cases.map((row: any) => row.comparabilityClass)).toEqual(
      payloadB.cases.map((row: any) => row.comparabilityClass),
    );
    expect(summaryA).toEqual(summaryB);
    expect(summaryA.canonicalComparableCaseCount + summaryA.nonComparableCaseCount).toBe(payloadA.caseCount);
    expect(summaryA.nonComparableBuckets.non_comparable_missing_signals).toBeTypeOf('number');
    expect(summaryA.nonComparableBuckets.non_comparable_contract_mismatch).toBeTypeOf('number');
    expect(summaryA.nonComparableBuckets.non_comparable_other).toBeTypeOf('number');
  });

  it('does not mutate canonical artifact during temp output runs', async () => {
    const canonical = path.resolve('artifacts/research/full-solve/g4-recovery-search-2026-02-27.json');
    const canonicalStepASummary = path.resolve('artifacts/research/full-solve/g4-stepA-summary.json');
    const before = fs.existsSync(canonical) ? fs.readFileSync(canonical, 'utf8') : null;
    const beforeSummary = fs.existsSync(canonicalStepASummary) ? fs.readFileSync(canonicalStepASummary, 'utf8') : null;
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'g4-recovery-'));
    const out = path.join(root, 'temp.json');
    const summary = path.join(root, 'g4-stepA-summary.json');
    writeStepASummary(summary, 4);
    await runRecoverySearch({ outPath: out, stepASummaryPath: summary, seed: 7, maxCases: 6, runtimeCapMs: 10_000 });
    const after = fs.existsSync(canonical) ? fs.readFileSync(canonical, 'utf8') : null;
    const afterSummary = fs.existsSync(canonicalStepASummary) ? fs.readFileSync(canonicalStepASummary, 'utf8') : null;
    expect(after).toBe(before);
    expect(afterSummary).toBe(beforeSummary);
  });

  it('writes Step B summary with comparable ranking and tau_s_ms coverage', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'g4-recovery-'));
    const out = path.join(root, 'search.json');
    const stepA = path.join(root, 'g4-stepA-summary.json');
    const stepB = path.join(root, 'g4-stepB-summary.json');
    writeStepASummary(stepA, 4);
    await runRecoverySearch({ outPath: out, stepASummaryPath: stepA, stepBSummaryPath: stepB, seed: 123, maxCases: 24, runtimeCapMs: 10_000 });
    const payload = JSON.parse(fs.readFileSync(out, 'utf8'));
    const summary = JSON.parse(fs.readFileSync(stepB, 'utf8'));
    const tauValues = new Set(payload.cases.map((row: any) => row.params.tau_s_ms));
    for (const tau of [2, 5, 8, 10, 20, 35, 50]) {
      expect(tauValues.has(tau)).toBe(true);
    }
    expect(summary.executedCaseCount).toBe(payload.caseCount);
    expect(summary.canonicalComparableCaseCount).toBeTypeOf('number');
    expect([null, 'no_canonical_comparable_cases_after_bootstrap']).toContain(summary.blockedReason);
    expect(Array.isArray(summary.topComparableCandidates)).toBe(true);
    expect(summary.topComparableCandidates.length).toBeLessThanOrEqual(10);
    expect(Array.isArray(summary.leverInfluenceRanking)).toBe(true);
    expect(summary.leverInfluenceRanking[0]).toHaveProperty('family');
    expect(summary.leverInfluenceRanking[0]).toHaveProperty('measuredImpactAbsLhsDelta');
  });

  it('emits Step C summary with bootstrap provenance and fail-closed blocker semantics', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'g4-recovery-stepc-'));
    const out = path.join(root, 'search.json');
    const stepA = path.join(root, 'g4-stepA-summary.json');
    const stepB = path.join(root, 'g4-stepB-summary.json');
    const stepC = path.join(root, 'g4-stepC-summary.json');
    writeStepASummary(stepA, 0);
    await runRecoverySearch({
      outPath: out,
      stepASummaryPath: stepA,
      stepBSummaryPath: stepB,
      stepCSummaryPath: stepC,
      seed: 321,
      maxCases: 14,
      runtimeCapMs: 10_000,
    });
    const summary = JSON.parse(fs.readFileSync(stepC, 'utf8'));
    expect(summary.boundaryStatement).toBe(
      'This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.',
    );
    expect(summary.bootstrapAttempted).toBe(true);
    expect(typeof summary.bootstrapSucceeded).toBe('boolean');
    expect(typeof summary.bootstrapReason).toBe('string');
    expect(Array.isArray(summary.bootstrapProvenance)).toBe(true);
    expect(summary.executedCaseCount).toBe(14);
    expect(summary.canonicalComparableCaseCount).toBeTypeOf('number');
    expect(summary.nonComparableBuckets).toHaveProperty('non_comparable_missing_signals');
    expect(Array.isArray(summary.nonComparableDiagnosticsTop)).toBe(true);
    expect(Array.isArray(summary.topComparableCandidates)).toBe(true);
    expect(summary.topComparableCandidates.length).toBeLessThanOrEqual(10);
    if (summary.canonicalComparableCaseCount === 0) {
      expect(summary.blockedReason).toBe('no_canonical_comparable_cases_after_bootstrap');
    }
  });


});
