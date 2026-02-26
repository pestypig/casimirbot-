import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { evaluateQiGuardrail, getGlobalPipelineState, updateParameters } from '../server/energy-pipeline.js';

const DATE_STAMP = new Date().toISOString().slice(0, 10);
const OUT_PATH = path.join('artifacts/research/full-solve', `g4-sensitivity-${DATE_STAMP}.json`);
const SEED = 424242;

type CaseResult = {
  inputs: {
    tau_s: number;
    sampler: string;
    fieldType: string;
    QI_POLICY_MAX_ZETA: number;
    gap_nm?: number;
    casimirModel?: string;
  };
  marginRatioRaw: number | null;
  marginRatio: number | null;
  marginRatioDisplay: number | null;
  applicabilityStatus: string;
  applicabilityReasonCode: string | null;
  g4ReasonCodes: string[];
  classification: 'physics_limited' | 'applicability_limited' | 'scaling_suspect';
};

const finiteOrNull = (n: unknown): number | null => (typeof n === 'number' && Number.isFinite(n) ? n : null);
const normalizeDisplay = (n: number | null): number | null => (n == null ? null : Number(n.toPrecision(12)));

export const isMetricRhoSource = (rhoSource: unknown): boolean => {
  const src = String(rhoSource ?? '').toLowerCase();
  return src.startsWith('warp.metric') || src.startsWith('gr.rho_constraint') || src.startsWith('gr.metric');
};

const sortDeep = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.keys(value as Record<string, unknown>)
      .sort()
      .map((k) => [k, sortDeep((value as Record<string, unknown>)[k])]),
  );
};

const classifyCase = (marginRaw: number | null, applicabilityStatus: string, reasonCodes: string[]): CaseResult['classification'] => {
  if (reasonCodes.includes('G4_QI_APPLICABILITY_NOT_PASS') || applicabilityStatus !== 'PASS') return 'applicability_limited';
  if (reasonCodes.includes('G4_QI_SOURCE_NOT_METRIC') || reasonCodes.includes('G4_QI_CONTRACT_MISSING')) return 'scaling_suspect';
  if ((marginRaw ?? 0) >= 1 || reasonCodes.includes('G4_QI_MARGIN_EXCEEDED')) return 'physics_limited';
  return 'scaling_suspect';
};

type GuardSummary = {
  marginRatioRaw?: number | null;
  applicabilityStatus?: string | null;
  applicabilityReasonCode?: string | null;
  rhoSource?: string | null;
};

export const deriveSensitivityReasonCodes = (guard: GuardSummary): string[] => {
  const rawMargin = guard.marginRatioRaw;
  const marginRaw = finiteOrNull(rawMargin);
  const marginUnknownOrNonFinite = typeof rawMargin !== 'number' || !Number.isFinite(rawMargin);
  const applicabilityStatus = String(guard.applicabilityStatus ?? 'UNKNOWN').toUpperCase();
  const applicabilityReason = String(guard.applicabilityReasonCode ?? '').trim().toUpperCase();
  const reasonCodes = new Set<string>();
  if (applicabilityReason) reasonCodes.add(applicabilityReason);
  if (applicabilityStatus !== 'PASS') reasonCodes.add('G4_QI_APPLICABILITY_NOT_PASS');
  if ((marginRaw != null && marginRaw >= 1) || marginUnknownOrNonFinite) reasonCodes.add('G4_QI_MARGIN_EXCEEDED');
  if (!isMetricRhoSource(guard.rhoSource)) reasonCodes.add('G4_QI_SOURCE_NOT_METRIC');
  const order = [
    'G4_QI_SIGNAL_MISSING',
    'G4_QI_CURVATURE_WINDOW_FAIL',
    'G4_QI_APPLICABILITY_NOT_PASS',
    'G4_QI_MARGIN_EXCEEDED',
    'G4_QI_SOURCE_NOT_METRIC',
  ];
  return Array.from(reasonCodes).sort((a, b) => {
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    const av = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
    const bv = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
    return av === bv ? a.localeCompare(b) : av - bv;
  });
};

const baseCases = [
  { tau_s: 0.01, sampler: 'gaussian', fieldType: 'em', QI_POLICY_MAX_ZETA: 1 },
  { tau_s: 0.02, sampler: 'hann', fieldType: 'scalar', QI_POLICY_MAX_ZETA: 2 },
  { tau_s: 0.05, sampler: 'gaussian', fieldType: 'em', QI_POLICY_MAX_ZETA: 5 },
  { tau_s: 0.1, sampler: 'boxcar', fieldType: 'em', QI_POLICY_MAX_ZETA: 10 },
] as const;

const secondaryCases = [
  { gap_nm: 0.5, casimirModel: 'ideal_retarded' },
  { gap_nm: 5, casimirModel: 'lifshitz' },
] as const;

export async function runSensitivityCases(
  caseBases = baseCases,
  caseSecondary = secondaryCases,
): Promise<CaseResult[]> {
  const results: CaseResult[] = [];
  let idx = 0;
  const baseline = structuredClone(getGlobalPipelineState());
  for (const base of caseBases) {
    for (const secondary of caseSecondary) {
      idx += 1;
      const initial = structuredClone(baseline);
      const next = await updateParameters(initial, {
        gap_nm: secondary.gap_nm,
        casimirModel: secondary.casimirModel as any,
        qi: {
          ...(initial.qi ?? {}),
          tau_s_ms: base.tau_s * 1000,
          sampler: base.sampler as any,
          fieldType: base.fieldType as any,
        } as any,
      } as any);
      const guard = evaluateQiGuardrail(next, {
        tau_ms: base.tau_s * 1000,
        sampler: base.sampler as any,
        qiPolicyMaxZeta: base.QI_POLICY_MAX_ZETA,
      });
      const marginRaw = finiteOrNull(guard.marginRatioRaw);
      const marginRatio = finiteOrNull(guard.marginRatio);
      const marginRatioDisplay = normalizeDisplay(marginRatio);
      const applicabilityStatus = String(guard.applicabilityStatus ?? 'UNKNOWN').toUpperCase();
      const applicabilityReasonCode =
        typeof guard.applicabilityReasonCode === 'string' && guard.applicabilityReasonCode.trim().length > 0
          ? guard.applicabilityReasonCode.trim().toUpperCase()
          : null;
      const reasonCodes = deriveSensitivityReasonCodes(guard);
      results.push({
        inputs: {
          tau_s: base.tau_s,
          sampler: base.sampler,
          fieldType: base.fieldType,
          QI_POLICY_MAX_ZETA: base.QI_POLICY_MAX_ZETA,
          gap_nm: secondary.gap_nm,
          casimirModel: secondary.casimirModel,
        },
        marginRatioRaw: marginRaw,
        marginRatio,
        marginRatioDisplay,
        applicabilityStatus,
        applicabilityReasonCode,
        g4ReasonCodes: reasonCodes,
        classification: classifyCase(marginRaw, applicabilityStatus, reasonCodes),
      });
      if (idx >= 8) break;
    }
    if (idx >= 8) break;
  }
  return results;
}

export async function run() {
  const results = await runSensitivityCases();
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  const payload = {
    runId: `g4-sensitivity-${SEED}-${DATE_STAMP}`,
    seed: SEED,
    generatedAt: new Date().toISOString(),
    cases: results,
  };
  fs.writeFileSync(OUT_PATH, `${JSON.stringify(sortDeep(payload), null, 2)}\n`);
  console.log(JSON.stringify({ ok: true, out: OUT_PATH, cases: results.length }));
  process.exit(0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
