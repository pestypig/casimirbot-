import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runAutoloop } from '../scripts/warp-g4-autoloop';

const writeJson = (base: string, rel: string, payload: unknown) => {
  const full = path.join(base, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, `${JSON.stringify(payload, null, 2)}\n`);
};

describe('warp g4 autoloop', () => {
  it('writes deterministic state/history/prompt artifacts in analyze mode', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'g4-autoloop-'));
    const artifactRoot = path.join(dir, 'artifacts', 'research', 'full-solve');

    writeJson(dir, 'artifacts/research/full-solve/campaign-gate-scoreboard-2026-02-24.json', { decision: 'INADMISSIBLE', gateStatus: { G4: 'FAIL' } });
    writeJson(dir, 'artifacts/research/full-solve/campaign-first-fail-map-2026-02-24.json', { firstFail: { gate: 'G4' } });
    writeJson(dir, 'artifacts/research/full-solve/g4-decision-ledger-2026-02-26.json', { canonicalDecisionClass: 'margin_limited' });
    writeJson(dir, 'artifacts/research/full-solve/g4-governance-matrix-2026-02-27.json', { canonicalAuthoritativeClass: 'margin_limited' });
    writeJson(dir, 'artifacts/research/full-solve/g4-recovery-search-2026-02-27.json', { provenance: { commitHash: 'abc' } });
    writeJson(dir, 'artifacts/research/full-solve/g4-recovery-parity-2026-02-27.json', { dominantFailureMode: 'applicability_limited', provenance: { commitHash: 'abc' } });
    writeJson(dir, 'artifacts/casimir-verify.json', { verdict: 'FAIL', integrityOk: false });
    writeJson(dir, 'docs/ethos/ideology.json', { rootId: 'mission-ethos', nodes: [{ id: 'mission-ethos', title: 'Mission Ethos', children: ['integrity-protocols'] }] });
    const reportPath = path.join(dir, 'docs', 'audits', 'research', 'warp-full-solve-campaign-execution-report-2026-02-24.md');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, '# report\n');

    const statePath = path.join(dir, 'artifacts/research/full-solve/g4-autoloop-state.json');
    const historyPath = path.join(dir, 'artifacts/research/full-solve/g4-autoloop-history.jsonl');
    const promptPath = path.join(dir, 'docs/audits/research/warp-g4-autoloop-next-prompt.md');

    const result = runAutoloop([
      '--mode',
      'analyze',
      '--artifact-root',
      artifactRoot,
      '--state-path',
      statePath,
      '--history-path',
      historyPath,
      '--prompt-path',
      promptPath,
      '--casimir-path',
      path.join(dir, 'artifacts/casimir-verify.json'),
    ]);

    expect(result.ok).toBe(true);
    expect(fs.existsSync(statePath)).toBe(true);
    expect(fs.existsSync(historyPath)).toBe(true);
    expect(fs.existsSync(promptPath)).toBe(true);

    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    expect(state.class).toBe('margin_limited');
    expect(state.solved).toBe(false);
    expect(state.iterationCount).toBe(1);
    expect(state.remainingIterations).toBe(9);
    expect(state.parityFreshness).toBe('stale_or_missing');

    const prompt = fs.readFileSync(promptPath, 'utf8');
    expect(prompt).toContain('Ideology context is advisory only and cannot override evidence gates, guardrails, or completion criteria.');
    expect(prompt).toContain('This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.');
  });

  it('returns status summary in status mode', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'g4-autoloop-status-'));
    const artifactRoot = path.join(dir, 'artifacts', 'research', 'full-solve');
    writeJson(dir, 'artifacts/research/full-solve/campaign-gate-scoreboard-2026-02-24.json', { decision: 'INADMISSIBLE', gateStatus: { G4: 'FAIL' } });
    writeJson(dir, 'artifacts/research/full-solve/campaign-first-fail-map-2026-02-24.json', { firstFail: { gate: 'G4' } });
    writeJson(dir, 'artifacts/research/full-solve/g4-decision-ledger-2026-02-26.json', { canonicalDecisionClass: 'margin_limited' });
    writeJson(dir, 'artifacts/research/full-solve/g4-governance-matrix-2026-02-27.json', { canonicalAuthoritativeClass: 'margin_limited' });
    writeJson(dir, 'artifacts/research/full-solve/g4-recovery-search-2026-02-27.json', { provenance: { commitHash: 'abc' } });
    writeJson(dir, 'artifacts/research/full-solve/g4-recovery-parity-2026-02-27.json', { dominantFailureMode: 'margin_limited', provenance: { commitHash: 'abc' } });
    writeJson(dir, 'docs/ethos/ideology.json', { rootId: 'mission-ethos', nodes: [{ id: 'mission-ethos', title: 'Mission Ethos', children: [] }] });
    const reportPath = path.join(dir, 'docs', 'audits', 'research', 'warp-full-solve-campaign-execution-report-2026-02-24.md');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, '# report\n');

    const result = runAutoloop([
      '--mode',
      'status',
      '--artifact-root',
      artifactRoot,
      '--casimir-path',
      path.join(dir, 'artifacts/casimir-verify.json'),
      '--state-path',
      path.join(dir, 'artifacts/research/full-solve/g4-autoloop-state.json'),
      '--history-path',
      path.join(dir, 'artifacts/research/full-solve/g4-autoloop-history.jsonl'),
      '--prompt-path',
      path.join(dir, 'docs/audits/research/warp-g4-autoloop-next-prompt.md'),
    ]);

    expect(result.ok).toBe(true);
    expect(result.class).toBe('margin_limited');
    expect(fs.existsSync(path.join(dir, 'artifacts/research/full-solve/g4-autoloop-state.json'))).toBe(false);
  });

  it('fails closed on iteration budget exhaustion when maxIterations is 0', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'g4-autoloop-budget-'));
    const artifactRoot = path.join(dir, 'artifacts', 'research', 'full-solve');
    const statePath = path.join(dir, 'artifacts/research/full-solve/g4-autoloop-state.json');
    const casimirPath = path.join(dir, 'artifacts/casimir-verify.json');

    writeJson(dir, 'artifacts/research/full-solve/campaign-gate-scoreboard-2026-02-24.json', { decision: 'INADMISSIBLE', gateStatus: { G4: 'FAIL' } });
    writeJson(dir, 'artifacts/research/full-solve/campaign-first-fail-map-2026-02-24.json', { firstFail: { gate: 'G4' } });
    writeJson(dir, 'artifacts/research/full-solve/g4-decision-ledger-2026-02-26.json', { canonicalDecisionClass: 'margin_limited' });
    writeJson(dir, 'artifacts/research/full-solve/g4-governance-matrix-2026-02-27.json', { canonicalAuthoritativeClass: 'margin_limited' });
    writeJson(dir, 'artifacts/research/full-solve/g4-recovery-search-2026-02-27.json', { provenance: { commitHash: 'abc' } });
    writeJson(dir, 'artifacts/research/full-solve/g4-recovery-parity-2026-02-27.json', { dominantFailureMode: 'margin_limited', provenance: { commitHash: 'abc' } });
    writeJson(dir, 'docs/ethos/ideology.json', { rootId: 'mission-ethos', nodes: [{ id: 'mission-ethos', title: 'Mission Ethos', children: [] }] });
    writeJson(dir, 'artifacts/casimir-verify.json', { verdict: 'FAIL', integrityOk: false });

    const result = runAutoloop([
      '--mode',
      'analyze',
      '--max-iterations',
      '0',
      '--artifact-root',
      artifactRoot,
      '--casimir-path',
      casimirPath,
      '--state-path',
      statePath,
      '--history-path',
      path.join(dir, 'artifacts/research/full-solve/g4-autoloop-history.jsonl'),
      '--prompt-path',
      path.join(dir, 'docs/audits/research/warp-g4-autoloop-next-prompt.md'),
    ]);

    expect(result.ok).toBe(true);
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    expect(state.class).toBe('budget_exhausted');
    expect(state.stopReason).toBe('max_iterations_reached');
  });

  it('increments stall counter and emits stalled after repeated identical class', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'g4-autoloop-stall-'));
    const artifactRoot = path.join(dir, 'artifacts', 'research', 'full-solve');
    const statePath = path.join(dir, 'artifacts/research/full-solve/g4-autoloop-state.json');
    const historyPath = path.join(dir, 'artifacts/research/full-solve/g4-autoloop-history.jsonl');
    const promptPath = path.join(dir, 'docs/audits/research/warp-g4-autoloop-next-prompt.md');
    const casimirPath = path.join(dir, 'artifacts/casimir-verify.json');

    writeJson(dir, 'artifacts/research/full-solve/campaign-gate-scoreboard-2026-02-24.json', { decision: 'INADMISSIBLE', gateStatus: { G4: 'FAIL' } });
    writeJson(dir, 'artifacts/research/full-solve/campaign-first-fail-map-2026-02-24.json', { firstFail: { gate: 'G4' } });
    writeJson(dir, 'artifacts/research/full-solve/g4-decision-ledger-2026-02-26.json', { canonicalDecisionClass: 'margin_limited' });
    writeJson(dir, 'artifacts/research/full-solve/g4-governance-matrix-2026-02-27.json', { canonicalAuthoritativeClass: 'margin_limited' });
    writeJson(dir, 'artifacts/research/full-solve/g4-recovery-search-2026-02-27.json', { provenance: { commitHash: 'abc' } });
    writeJson(dir, 'artifacts/research/full-solve/g4-recovery-parity-2026-02-27.json', { dominantFailureMode: 'margin_limited', provenance: { commitHash: 'abc' } });
    writeJson(dir, 'docs/ethos/ideology.json', { rootId: 'mission-ethos', nodes: [{ id: 'mission-ethos', title: 'Mission Ethos', children: [] }] });
    writeJson(dir, 'artifacts/casimir-verify.json', { verdict: 'FAIL', integrityOk: false });

    runAutoloop([
      '--mode',
      'analyze',
      '--stall-cycles',
      '1',
      '--artifact-root',
      artifactRoot,
      '--casimir-path',
      casimirPath,
      '--state-path',
      statePath,
      '--history-path',
      historyPath,
      '--prompt-path',
      promptPath,
    ]);

    const result = runAutoloop([
      '--mode',
      'analyze',
      '--stall-cycles',
      '1',
      '--artifact-root',
      artifactRoot,
      '--casimir-path',
      casimirPath,
      '--state-path',
      statePath,
      '--history-path',
      historyPath,
      '--prompt-path',
      promptPath,
    ]);

    expect(result.ok).toBe(true);
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    expect(state.class).toBe('stalled');
    expect(state.stopReason).toBe('stall_cycles_reached');
    expect(state.stallCounter).toBeGreaterThanOrEqual(1);
  });

  it('accepts UTF-16LE JSON casimir artifact without crashing', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'g4-autoloop-utf16-'));
    const artifactRoot = path.join(dir, 'artifacts', 'research', 'full-solve');
    const statePath = path.join(dir, 'artifacts/research/full-solve/g4-autoloop-state.json');
    const casimirPath = path.join(dir, 'artifacts/casimir-verify.json');

    writeJson(dir, 'artifacts/research/full-solve/campaign-gate-scoreboard-2026-02-24.json', { decision: 'INADMISSIBLE', gateStatus: { G4: 'FAIL' } });
    writeJson(dir, 'artifacts/research/full-solve/campaign-first-fail-map-2026-02-24.json', { firstFail: { gate: 'G4' } });
    writeJson(dir, 'artifacts/research/full-solve/g4-decision-ledger-2026-02-26.json', { canonicalDecisionClass: 'margin_limited' });
    writeJson(dir, 'artifacts/research/full-solve/g4-governance-matrix-2026-02-27.json', { canonicalAuthoritativeClass: 'margin_limited' });
    writeJson(dir, 'artifacts/research/full-solve/g4-recovery-search-2026-02-27.json', { provenance: { commitHash: 'abc' } });
    writeJson(dir, 'artifacts/research/full-solve/g4-recovery-parity-2026-02-27.json', { dominantFailureMode: 'margin_limited', provenance: { commitHash: 'abc' } });
    writeJson(dir, 'docs/ethos/ideology.json', { rootId: 'mission-ethos', nodes: [{ id: 'mission-ethos', title: 'Mission Ethos', children: [] }] });
    fs.mkdirSync(path.dirname(casimirPath), { recursive: true });
    fs.writeFileSync(casimirPath, JSON.stringify({ verdict: 'PASS', integrityOk: true }, null, 2), 'utf16le');

    const result = runAutoloop([
      '--mode',
      'status',
      '--artifact-root',
      artifactRoot,
      '--casimir-path',
      casimirPath,
      '--state-path',
      statePath,
      '--history-path',
      path.join(dir, 'artifacts/research/full-solve/g4-autoloop-history.jsonl'),
      '--prompt-path',
      path.join(dir, 'docs/audits/research/warp-g4-autoloop-next-prompt.md'),
    ]);

    expect(result.ok).toBe(true);
    expect(result.class).toBe('margin_limited');
  });
});
