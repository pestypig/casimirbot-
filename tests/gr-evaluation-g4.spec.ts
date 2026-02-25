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

  it('marks source synthesized when both hard constraints are absent', () => {
    const result = extractG4ConstraintDiagnostics([] as any);

    expect(result.fordRomanStatus).toBe('missing');
    expect(result.thetaAuditStatus).toBe('missing');
    expect(result.source).toBe('synthesized_unknown');
    expect(result.reasonCode).toEqual([
      'G4_MISSING_SOURCE_FORD_ROMAN_QI',
      'G4_MISSING_SOURCE_THETA_AUDIT',
    ]);
  });

  it('marks source synthesized with deterministic reason code for partial hard-constraint payload', () => {
    const result = extractG4ConstraintDiagnostics([
      { id: 'FordRomanQI', severity: 'HARD', status: 'pass', note: 'computed from live evaluator' },
    ] as any);

    expect(result.fordRomanStatus).toBe('pass');
    expect(result.thetaAuditStatus).toBe('missing');
    expect(result.source).toBe('synthesized_unknown');
    expect(result.reasonCode).toEqual(['G4_MISSING_SOURCE_THETA_AUDIT']);
  });

});
