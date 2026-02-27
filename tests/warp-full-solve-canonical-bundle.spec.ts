import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('warp-full-solve-canonical-bundle sequencing', () => {
  it('includes g4 recovery search before governance and ledger generation', () => {
    const script = fs.readFileSync('scripts/warp-full-solve-canonical-bundle.ts', 'utf8');
    const idxRecovery = script.indexOf("warp:full-solve:g4-recovery-search");
    const idxGovernance = script.indexOf("warp:full-solve:g4-governance-matrix");
    const idxLedger = script.indexOf("warp:full-solve:g4-decision-ledger");
    expect(idxRecovery).toBeGreaterThan(-1);
    expect(idxGovernance).toBeGreaterThan(-1);
    expect(idxLedger).toBeGreaterThan(-1);
    expect(idxRecovery).toBeLessThan(idxGovernance);
    expect(idxGovernance).toBeLessThan(idxLedger);
  });
});
