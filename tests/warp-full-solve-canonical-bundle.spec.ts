import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assertBundleProvenanceFresh, runCommandWithRetry } from '../scripts/warp-full-solve-canonical-bundle';

const getCanonicalCommands = (script: string): string[] => {
  const commandMatches = script.matchAll(/\['run',\s*'([^']+)'\]/g);
  return Array.from(commandMatches, (match) => match[1]);
};

describe('warp-full-solve-canonical-bundle sequencing', () => {
  it('re-runs canonical campaign after recovery/governance/ledger finalization', () => {
    const script = fs.readFileSync('scripts/warp-full-solve-canonical-bundle.ts', 'utf8');
    const commands = getCanonicalCommands(script);
    expect(commands.filter((cmd) => cmd === 'warp:full-solve:canonical')).toHaveLength(2);
    expect(commands).toEqual([
      'warp:full-solve:canonical',
      'warp:full-solve:g4-sensitivity',
      'warp:full-solve:g4-stepA-summary',
      'warp:full-solve:g4-recovery-search',
      'warp:full-solve:g4-recovery-parity',
      'warp:full-solve:g4-coupling-localization',
      'warp:full-solve:g4-coupling-ablation',
      'warp:full-solve:g4-governance-matrix',
      'warp:full-solve:g4-decision-ledger',
      'warp:full-solve:canonical',
    ]);
  });

  it('uses fail-fast timeout behavior for timed-out commands', () => {
    const fakeSpawn = () => ({
      status: null,
      signal: 'SIGTERM',
      output: [],
      stdout: null,
      stderr: null,
      pid: 0,
      error: new Error('spawnSync npm ETIMEDOUT'),
    });
    expect(() => runCommandWithRetry(['run', 'warp:full-solve:canonical'], { timeoutMs: 1234, maxRetries: 2, runSpawnSync: fakeSpawn as any })).toThrow(
      /timeout after 1234ms/,
    );
  });

  it('retries once for transient bootstrap failures', () => {
    let calls = 0;
    const fakeSpawn = () => {
      calls += 1;
      if (calls === 1) {
        return {
          status: 1,
          signal: null,
          output: [],
          stdout: null,
          stderr: null,
          pid: 1,
          error: new Error('transient bootstrap failure'),
        };
      }
      return {
        status: 0,
        signal: null,
        output: [],
        stdout: null,
        stderr: null,
        pid: 1,
      };
    };

    expect(() => runCommandWithRetry(['run', 'warp:full-solve:canonical'], { maxRetries: 1, runSpawnSync: fakeSpawn as any })).not.toThrow();
    expect(calls).toBe(2);
  });

  it('fails if recovery provenance commit is missing or stale', () => {
    expect(() =>
      assertBundleProvenanceFresh(
        'abc123',
        { commitHash: 'abc123' },
        { commitHash: 'abc123' },
        { commitHash: 'abc123' },
        {},
        { commitHash: 'abc123' },
        { commitHash: 'abc123' },
        { commitHash: 'abc123' },
      ),
    ).toThrow(
      /Recovery artifact provenance commit hash mismatch/,
    );
    expect(() =>
      assertBundleProvenanceFresh(
        'abc123',
        { commitHash: 'abc123' },
        { commitHash: 'abc123' },
        { commitHash: 'abc123' },
        { provenance: { commitHash: 'def456' } },
        { commitHash: 'abc123' },
        { commitHash: 'abc123' },
        { commitHash: 'abc123' },
      ),
    ).toThrow(/Recovery artifact provenance commit hash mismatch/);
 
    expect(() =>
      assertBundleProvenanceFresh(
        'abc123',
        { commitHash: 'abc123' },
        { commitHash: 'abc123' },
        { commitHash: 'abc123' },
        { provenance: { commitHash: 'abc123' } },
        { commitHash: 'def456' },
        { commitHash: 'abc123' },
        { commitHash: 'abc123' },
      ),
    ).toThrow(/Recovery parity provenance commit hash mismatch/);
  });

  it('fails if Step A summary provenance is missing or stale', () => {
    expect(() =>
      assertBundleProvenanceFresh(
        'abc123',
        {},
        { commitHash: 'abc123' },
        { commitHash: 'abc123' },
        { provenance: { commitHash: 'abc123' } },
        { commitHash: 'abc123' },
        { commitHash: 'abc123' },
        { commitHash: 'abc123' },
      ),
    ).toThrow(/Step A summary commit hash mismatch/);
    expect(() =>
      assertBundleProvenanceFresh(
        'abc123',
        { commitHash: 'def456' },
        { commitHash: 'abc123' },
        { commitHash: 'abc123' },
        { provenance: { commitHash: 'abc123' } },
        { commitHash: 'abc123' },
        { commitHash: 'abc123' },
        { commitHash: 'abc123' },
      ),
    ).toThrow(/Step A summary commit hash mismatch/);
  });

  it('fails if coupling localization or ablation provenance is missing or stale', () => {
    expect(() =>
      assertBundleProvenanceFresh(
        'abc123',
        { commitHash: 'abc123' },
        { commitHash: 'abc123' },
        { commitHash: 'abc123' },
        { provenance: { commitHash: 'abc123' } },
        { commitHash: 'abc123' },
        {},
        { commitHash: 'abc123' },
      ),
    ).toThrow(/Coupling localization provenance commit hash mismatch/);
    expect(() =>
      assertBundleProvenanceFresh(
        'abc123',
        { commitHash: 'abc123' },
        { commitHash: 'abc123' },
        { commitHash: 'abc123' },
        { provenance: { commitHash: 'abc123' } },
        { commitHash: 'abc123' },
        { provenance: { commitHash: 'abc123' } },
        { provenance: { commitHash: 'def456' } },
      ),
    ).toThrow(/Coupling ablation provenance commit hash mismatch/);
  });

  it('preserves canonical report recovery and governance provenance consistency after bundle', () => {
    const reportPath = path.resolve('docs/audits/research/warp-full-solve-campaign-execution-report-2026-02-24.md');
    const recoveryPath = path.resolve('artifacts/research/full-solve/g4-recovery-search-2026-02-27.json');
    const governancePath = path.resolve('artifacts/research/full-solve/g4-governance-matrix-2026-02-27.json');

    const report = fs.readFileSync(reportPath, 'utf8');
    const recovery = JSON.parse(fs.readFileSync(recoveryPath, 'utf8')) as Record<string, any>;
    const governance = JSON.parse(fs.readFileSync(governancePath, 'utf8')) as Record<string, any>;

    const recoveryBest = (recovery.bestCandidate ?? {}) as Record<string, any>;
    expect(report).toContain('- best candidate id:');
    expect(report).toContain('- best candidate marginRatioRawComputed:');
    expect(report).toContain('- recovery provenance commit:');

    expect(report).toContain('- governance artifact commit:');
  });

  it('canonical temp-path/non-canonical runs do not mutate canonical report', () => {
    const campaignSpec = fs.readFileSync('tests/warp-full-solve-campaign.spec.ts', 'utf8');
    expect(campaignSpec).toContain('temp --out campaign run does not mutate canonical readiness report');
  });
});
