import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

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
      'warp:full-solve:g4-recovery-search',
      'warp:full-solve:g4-governance-matrix',
      'warp:full-solve:g4-decision-ledger',
      'warp:full-solve:canonical',
    ]);
  });

  it('preserves canonical report recovery and governance provenance consistency after bundle', () => {
    const reportPath = path.resolve('docs/audits/research/warp-full-solve-campaign-execution-report-2026-02-24.md');
    const recoveryPath = path.resolve('artifacts/research/full-solve/g4-recovery-search-2026-02-27.json');
    const governancePath = path.resolve('artifacts/research/full-solve/g4-governance-matrix-2026-02-27.json');

    const report = fs.readFileSync(reportPath, 'utf8');
    const recovery = JSON.parse(fs.readFileSync(recoveryPath, 'utf8')) as Record<string, any>;
    const governance = JSON.parse(fs.readFileSync(governancePath, 'utf8')) as Record<string, any>;

    const recoveryBest = (recovery.bestCandidate ?? {}) as Record<string, any>;
    expect(report).toContain(`- best candidate id: ${String(recoveryBest.id ?? 'n/a')}`);
    expect(report).toContain(
      `- best candidate marginRatioRawComputed: ${String(recoveryBest.marginRatioRawComputed ?? 'n/a')}`,
    );
    expect(report).toContain(`- recovery provenance commit: ${String(recovery.provenance?.commitHash ?? 'n/a')}`);

    expect(report).toContain(`- governance artifact commit: ${String(governance.commitHash ?? 'n/a')}`);

    if (typeof governance.commitHash === 'string' && governance.commitHash.trim().length > 0) {
      expect(report).toContain('- governance artifact freshness: fresh');
      expect(report).toContain('- governance freshness reason: none');
    }
  });

  it('canonical temp-path/non-canonical runs do not mutate canonical report', () => {
    const campaignSpec = fs.readFileSync('tests/warp-full-solve-campaign.spec.ts', 'utf8');
    expect(campaignSpec).toContain('temp --out campaign run does not mutate canonical readiness report');
  });
});
