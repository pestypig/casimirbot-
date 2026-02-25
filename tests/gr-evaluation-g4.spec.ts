import { describe, expect, it } from 'vitest';
import { extractG4ConstraintDiagnostics } from '../server/gr/gr-evaluation';

describe('gr-evaluation G4 diagnostics provenance', () => {
  it('reports evaluator_constraints with concrete hard statuses', () => {
    const result = extractG4ConstraintDiagnostics([
      { id: 'FordRomanQI', severity: 'HARD', status: 'pass', note: 'computed from live evaluator' },
      { id: 'ThetaAudit', severity: 'HARD', status: 'fail', note: 'theta out of band' },
    ] as any);

    expect(result.fordRomanStatus).toBe('pass');
    expect(result.thetaAuditStatus).toBe('fail');
    expect(result.source).toBe('evaluator_constraints');
    expect(result.reasonCode).toEqual([]);
  });

  it('reports synthesized_unknown with deterministic reasonCode extraction', () => {
    const result = extractG4ConstraintDiagnostics([
      {
        id: 'FordRomanQI',
        severity: 'HARD',
        status: 'unknown',
        note: 'reasonCode=G4_MISSING_SOURCE_FORD_ROMAN_QI;source=synthesized_unknown;FordRomanQI missing from warp-viability evaluator constraints.',
      },
      {
        id: 'ThetaAudit',
        severity: 'HARD',
        status: 'unknown',
        note: 'reasonCode=G4_MISSING_SOURCE_THETA_AUDIT;source=synthesized_unknown;ThetaAudit missing from warp-viability evaluator constraints.',
      },
    ] as any);

    expect(result.source).toBe('synthesized_unknown');
    expect(result.reasonCode).toEqual([
      'G4_MISSING_SOURCE_FORD_ROMAN_QI',
      'G4_MISSING_SOURCE_THETA_AUDIT',
    ]);
    expect(result.reason.join(' | ')).toContain('source=synthesized_unknown');
  });
});
