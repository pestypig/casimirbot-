import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { generateG4GovernanceMatrix } from '../scripts/warp-g4-governance-matrix';

describe('warp g4 governance matrix', () => {
  it('emits deterministic mismatch explanation and dual fail classification', () => {
    const result = generateG4GovernanceMatrix();
    expect(result.ok).toBe(true);
    expect(fs.existsSync(result.json)).toBe(true);
    expect(fs.existsSync(result.markdown)).toBe(true);

    const json = JSON.parse(fs.readFileSync(result.json, 'utf8'));
    expect(Array.isArray(json.rows)).toBe(true);
    expect(json.rows.length).toBe(4);
    for (const row of json.rows) {
      expect(row.g4DualFailMode).toBe('both');
      expect(row.canonicalAuthoritativeClass).toBe('both');
      expect(row.computedOnlyCounterfactualClass).toBe('computed-bound dominated');
      expect(row.mismatch).toBe(true);
      expect(String(row.mismatchReason)).toContain('canonical=both;counterfactual=computed-bound dominated');
    }

    const mdPath = path.join('docs', 'audits', 'research', 'warp-g4-governance-matrix-2026-02-27.md');
    const md = fs.readFileSync(mdPath, 'utf8');
    expect(md).toContain('computed-only counterfactual class (non-authoritative)');
  });
});
