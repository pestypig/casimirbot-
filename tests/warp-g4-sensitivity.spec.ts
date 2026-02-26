import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {
  deriveSensitivityReasonCodes,
  isMetricRhoSource,
  runSensitivityCases,
} from '../scripts/warp-g4-sensitivity';
import { evaluateQiGuardrail, getGlobalPipelineState, updateParameters } from '../server/energy-pipeline';

describe('warp-g4-sensitivity', () => {
  it('is deterministic under fixed seed', () => {
    const tsxCli = path.resolve('node_modules/tsx/dist/cli.mjs');
    const script = path.resolve('scripts/warp-g4-sensitivity.ts');
    execFileSync(process.execPath, [tsxCli, script], { stdio: 'ignore' });
    const outPath = path.join('artifacts/research/full-solve', `g4-sensitivity-${new Date().toISOString().slice(0, 10)}.json`);
    const a = fs.readFileSync(outPath, 'utf8');
    execFileSync(process.execPath, [tsxCli, script], { stdio: 'ignore' });
    const b = fs.readFileSync(outPath, 'utf8');
    const pa = JSON.parse(a);
    const pb = JSON.parse(b);
    expect(pa.seed).toBe(424242);
    expect(pb.seed).toBe(424242);
    expect(pa.cases).toEqual(pb.cases);
  }, 120_000);

  it('keeps case evaluations independent from cross-case mutation', async () => {
    const secondary = [{ gap_nm: 0.5, casimirModel: 'ideal_retarded' as const }];
    const [caseA, caseB] = await runSensitivityCases(
      [
        { tau_s: 0.01, sampler: 'gaussian', fieldType: 'em', QI_POLICY_MAX_ZETA: 1 },
        { tau_s: 0.1, sampler: 'boxcar', fieldType: 'em', QI_POLICY_MAX_ZETA: 10 },
      ],
      secondary,
    );
    const [caseBOnly] = await runSensitivityCases(
      [{ tau_s: 0.1, sampler: 'boxcar', fieldType: 'em', QI_POLICY_MAX_ZETA: 10 }],
      secondary,
    );
    expect(caseA).toBeDefined();
    expect(caseB).toEqual(caseBOnly);
  });

  it('applies per-case QI_POLICY_MAX_ZETA override in evaluator output', async () => {
    const baseline = structuredClone(getGlobalPipelineState());
    const next = await updateParameters(structuredClone(baseline), {
      gap_nm: 0.5,
      casimirModel: 'ideal_retarded',
      qi: {
        ...(baseline.qi ?? {}),
        tau_s_ms: 10,
        sampler: 'gaussian',
        fieldType: 'em',
      },
    } as any);

    const low = evaluateQiGuardrail(next, { tau_ms: 10, sampler: 'gaussian', qiPolicyMaxZeta: 1 });
    const high = evaluateQiGuardrail(next, { tau_ms: 10, sampler: 'gaussian', qiPolicyMaxZeta: 10 });

    expect(low.policyLimit).toBe(1);
    expect(high.policyLimit).toBe(10);
    expect(low.marginRatio).not.toBe(high.marginRatio);
  });

  it('classifies metric rho sources with canonical parity', () => {
    expect(isMetricRhoSource('warp.metric.energy')).toBe(true);
    expect(isMetricRhoSource('gr.rho_constraint.si')).toBe(true);
    expect(isMetricRhoSource('gr.metric.natario')).toBe(true);
    expect(isMetricRhoSource('gr.telemetry')).toBe(false);
    expect(isMetricRhoSource('proxy')).toBe(false);
  });

  it('uses unquantized raw ratio for near-threshold margin decision', () => {
    const below = deriveSensitivityReasonCodes({ marginRatioRaw: 0.9999999999, applicabilityStatus: 'PASS', rhoSource: 'gr.metric' });
    const above = deriveSensitivityReasonCodes({ marginRatioRaw: 1.0000000001, applicabilityStatus: 'PASS', rhoSource: 'gr.metric' });

    expect(below).not.toContain('G4_QI_MARGIN_EXCEEDED');
    expect(above).toContain('G4_QI_MARGIN_EXCEEDED');
  });
});
