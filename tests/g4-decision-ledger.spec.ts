import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { BOUNDARY_STATEMENT, generateG4DecisionLedger } from '../scripts/generate-g4-decision-ledger';

const writeJson = (p: string, v: unknown) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, `${JSON.stringify(v, null, 2)}\n`);
};

const makeRoot = () => fs.mkdtempSync(path.join(os.tmpdir(), 'g4-ledger-'));

const seedBase = (root: string) => {
  writeJson(path.join(root, 'campaign-gate-scoreboard-2026-02-24.json'), {
    decision: 'INADMISSIBLE',
    statusCounts: { PASS: 7, FAIL: 1, UNKNOWN: 0, NOT_READY: 0, NOT_APPLICABLE: 1 },
  });
  writeJson(path.join(root, 'campaign-first-fail-map-2026-02-24.json'), {
    globalFirstFail: 'G4',
  });
  writeJson(path.join(root, 'g4-influence-scan-2026-02-26.json'), {
    decision: {
      classification: 'applicability_limited',
      scanCandidatePassFound: false,
      scanAnyApplicabilityPass: false,
      scanMinMarginRatioRawAmongApplicabilityPass: null,
    },
    rankedEffects: [],
  });
};

const writeWave = (root: string, wave: string, marginRatioRaw = 1) => {
  writeJson(path.join(root, wave, 'evidence-pack.json'), {
    g4Diagnostics: {
      marginRatioRaw,
      applicabilityStatus: 'PASS',
      boundComputed_Jm3: -18,
      boundUsed_Jm3: -100,
      boundFloorApplied: true,
    },
  });
};

describe('g4-decision-ledger generator', () => {
  it('keeps canonical override over scan decision class', () => {
    const root = makeRoot();
    seedBase(root);
    for (const wave of ['A', 'B', 'C', 'D']) writeWave(root, wave, 1);
    const out = path.join(root, 'out.json');
    generateG4DecisionLedger({
      rootDir: root,
      outPath: out,
      scoreboardPath: path.join(root, 'campaign-gate-scoreboard-2026-02-24.json'),
      firstFailPath: path.join(root, 'campaign-first-fail-map-2026-02-24.json'),
      influencePath: path.join(root, 'g4-influence-scan-2026-02-26.json'),
      getCommitHash: () => 'deadbeef',
    });
    const ledger = JSON.parse(fs.readFileSync(out, 'utf8'));
    expect(ledger.canonicalDecisionClass).toBe('margin_limited');
    expect(ledger.scanDecisionClass).toBe('applicability_limited');
    expect(ledger.finalDecisionClass).toBe('margin_limited');
  });

  it('fails closed when canonical wave evidence is missing', () => {
    const root = makeRoot();
    seedBase(root);
    for (const wave of ['A', 'B', 'C']) writeWave(root, wave, 1);
    const out = path.join(root, 'out.json');
    generateG4DecisionLedger({
      rootDir: root,
      outPath: out,
      scoreboardPath: path.join(root, 'campaign-gate-scoreboard-2026-02-24.json'),
      firstFailPath: path.join(root, 'campaign-first-fail-map-2026-02-24.json'),
      influencePath: path.join(root, 'g4-influence-scan-2026-02-26.json'),
      getCommitHash: () => 'deadbeef',
    });
    const ledger = JSON.parse(fs.readFileSync(out, 'utf8'));
    expect(ledger.canonicalDecisionClass).toBe('evidence_path_blocked');
    expect(ledger.finalDecisionClass).toBe('evidence_path_blocked');
    expect(ledger.canonicalMissingWaves).toEqual(['D']);
  });

  it('emits deterministic mismatch reason and required metadata', () => {
    const root = makeRoot();
    seedBase(root);
    for (const wave of ['A', 'B', 'C', 'D']) writeWave(root, wave, 1);
    const out = path.join(root, 'out.json');
    generateG4DecisionLedger({
      rootDir: root,
      outPath: out,
      scoreboardPath: path.join(root, 'campaign-gate-scoreboard-2026-02-24.json'),
      firstFailPath: path.join(root, 'campaign-first-fail-map-2026-02-24.json'),
      influencePath: path.join(root, 'g4-influence-scan-2026-02-26.json'),
      getCommitHash: () => 'deadbeef',
    });
    const ledger = JSON.parse(fs.readFileSync(out, 'utf8'));
    expect(ledger.classificationMismatch).toBe(true);
    expect(ledger.classificationMismatchReason).toBe(
      'canonical_authoritative_override: canonical=margin_limited;scan=applicability_limited',
    );
    expect(ledger.commitHash).toBe('deadbeef');
    expect(ledger.boundaryStatement).toBe(BOUNDARY_STATEMENT);
  });
});
