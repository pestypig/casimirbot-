import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process';
import { evaluateQiGuardrail, getGlobalPipelineState, updateParameters } from '../server/energy-pipeline.js';

const DATE_STAMP = '2026-02-27';
const DEFAULT_SEED = 20260227;
const DEFAULT_MAX_CASES = 160;
const DEFAULT_TOP_N = 12;
const DEFAULT_RUNTIME_CAP_MS = 45_000;
const DEFAULT_OUT_PATH = path.join('artifacts/research/full-solve', `g4-recovery-search-${DATE_STAMP}.json`);
const STEP_A_SUMMARY_PATH = path.join('artifacts/research/full-solve', 'g4-stepA-summary.json');
const STEP_B_SUMMARY_PATH = path.join('artifacts/research/full-solve', 'g4-stepB-summary.json');
const STEP_C_SUMMARY_PATH = path.join('artifacts/research/full-solve', 'g4-stepC-summary.json');
const BOUNDARY_STATEMENT =
  'This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.';

type RecoveryCase = {
  id: string;
  params: Record<string, unknown>;
  lhs_Jm3: number | null;
  boundComputed_Jm3: number | null;
  boundUsed_Jm3: number | null;
  boundFloorApplied: boolean;
  marginRatioRaw: number | null;
  marginRatioRawComputed: number | null;
  applicabilityStatus: string;
  reasonCode: string[];
  rhoSource: string | null;
  couplingMode: string | null;
  couplingAlpha: number | null;
  rhoMetric_Jm3: number | null;
  rhoProxy_Jm3: number | null;
  rhoCoupledShadow_Jm3: number | null;
  couplingResidualRel: number | null;
  couplingComparable: boolean | null;
  classificationTag: 'candidate_pass_found' | 'margin_limited' | 'applicability_limited' | 'evidence_path_blocked';
  comparabilityClass:
    | 'comparable_canonical'
    | 'non_comparable_missing_signals'
    | 'non_comparable_contract_mismatch'
    | 'non_comparable_other';
};

type ComparabilityClass = RecoveryCase['comparabilityClass'];
type BootstrapResult = {
  attempted: boolean;
  succeeded: boolean;
  reason: string;
  provenance: {
    profileId: string;
    params: Record<string, unknown>;
    comparabilityClass: ComparabilityClass;
    reasonCode: string[];
    rhoSource: string | null;
    applicabilityStatus: string;
    missingSignals: string[];
  }[];
};

type StepASummary = {
  canonicalComparableCaseCount: number;
};

const finiteOrNull = (n: unknown): number | null => (typeof n === 'number' && Number.isFinite(n) ? n : null);
const stringOrNull = (v: unknown): string | null => (typeof v === 'string' && v.trim().length > 0 ? v.trim() : null);

const classify = (applicabilityStatus: string, marginRatioRawComputed: number | null): RecoveryCase['classificationTag'] => {
  if (applicabilityStatus !== 'PASS') return 'applicability_limited';
  if (marginRatioRawComputed == null) return 'evidence_path_blocked';
  return marginRatioRawComputed < 1 ? 'candidate_pass_found' : 'margin_limited';
};

const REQUIRED_CANONICAL_SIGNALS = ['lhs_Jm3', 'boundComputed_Jm3', 'boundUsed_Jm3', 'marginRatioRaw', 'marginRatioRawComputed'] as const;
const CONTRACT_REASON_CODES = new Set(['G4_QI_SOURCE_NOT_METRIC', 'G4_QI_CONTRACT_MISSING']);

export const classifyComparability = (entry: {
  lhs_Jm3: number | null;
  boundComputed_Jm3: number | null;
  boundUsed_Jm3: number | null;
  boundFloorApplied?: boolean | null;
  marginRatioRaw: number | null;
  marginRatioRawComputed: number | null;
  applicabilityStatus?: string;
  rhoSource: string | null;
  reasonCode: string[];
}): ComparabilityClass => {
  const missingSignals = REQUIRED_CANONICAL_SIGNALS.some((field) => entry[field] == null);
  if (missingSignals) return 'non_comparable_missing_signals';
  // Comparability is structural for ranking: finite canonical signals + metric contract path.
  // Applicability/curvature reasons remain part of reasonCode diagnostics, not cohort exclusion.
  const contractMismatch = entry.reasonCode.some((code) => CONTRACT_REASON_CODES.has(code));
  if (contractMismatch || !entry.rhoSource?.startsWith('warp.metric')) return 'non_comparable_contract_mismatch';
  return 'comparable_canonical';
};

const missingSignalFields = (entry: {
  lhs_Jm3: number | null;
  boundComputed_Jm3: number | null;
  boundUsed_Jm3: number | null;
  marginRatioRaw: number | null;
  marginRatioRawComputed: number | null;
}): string[] => REQUIRED_CANONICAL_SIGNALS.filter((field) => entry[field] == null);

const deriveReasonCodes = (guard: any): string[] => {
  const reasons = new Set<string>();
  const applicabilityReasonCode = stringOrNull(guard?.applicabilityReasonCode);
  const applicabilityStatus = String(guard?.applicabilityStatus ?? 'UNKNOWN').toUpperCase();
  const marginRawComputed = finiteOrNull(guard?.marginRatioRawComputed);
  const marginRaw = finiteOrNull(guard?.marginRatioRaw);
  if (applicabilityReasonCode) reasons.add(applicabilityReasonCode.toUpperCase());
  if (applicabilityStatus !== 'PASS') reasons.add('G4_QI_APPLICABILITY_NOT_PASS');
  if ((marginRawComputed ?? Number.POSITIVE_INFINITY) >= 1 || (marginRaw ?? Number.POSITIVE_INFINITY) >= 1) {
    reasons.add('G4_QI_MARGIN_EXCEEDED');
  }
  if (!stringOrNull(guard?.rhoSource)?.startsWith('warp.metric')) reasons.add('G4_QI_SOURCE_NOT_METRIC');
  return [...reasons].sort((a, b) => a.localeCompare(b));
};

const leverFamilies: Record<string, Array<string | number>> = {
  warpFieldType: ['natario', 'natario_sdf', 'lentz', 'bobrick_martire'],
  gammaGeo: [1, 4, 12, 48, 120],
  dutyCycle: [0.02, 0.06, 0.12, 0.25],
  sectorCount: [80, 200, 400],
  concurrentSectors: [1, 2],
  gammaVanDenBroeck: [0.8, 1.5, 20, 500],
  sampler: ['gaussian', 'hann', 'boxcar'],
  fieldType: ['em', 'scalar'],
  qCavity: [1e5, 1e7, 1e9],
  qSpoilingFactor: [1, 1.5, 3],
  tau_s_ms: [2, 5, 8, 10, 20, 35, 50],
  gap_nm: [0.4, 1, 5, 8],
  shipRadius_m: [2, 10, 40],
};

const LEVER_ORDER = [
  'warpFieldType',
  'gammaGeo',
  'dutyCycle',
  'sectorCount',
  'concurrentSectors',
  'gammaVanDenBroeck',
  'sampler',
  'fieldType',
  'qCavity',
  'qSpoilingFactor',
  'tau_s_ms',
  'gap_nm',
  'shipRadius_m',
] as const;

const gcd = (a: number, b: number): number => {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x;
};

const universeSize = () => LEVER_ORDER.reduce((acc, key) => acc * leverFamilies[key].length, 1);

const decodeCase = (flatIndex: number): Record<string, unknown> => {
  let idx = Math.floor(flatIndex);
  const row: Record<string, unknown> = {};
  for (let i = LEVER_ORDER.length - 1; i >= 0; i -= 1) {
    const key = LEVER_ORDER[i]!;
    const values = leverFamilies[key];
    const base = values.length;
    const digit = idx % base;
    idx = Math.floor(idx / base);
    row[key] = values[digit];
  }
  row.dutyShip = row.dutyCycle;
  row.dutyEffective_FR = row.dutyCycle;
  return row;
};

const deriveDeterministicWalk = (seed: number, total: number): { start: number; step: number } => {
  const start = Math.abs(seed) % total;
  let step = ((Math.abs(seed * 1103515245 + 12345) % (total - 1)) + 1) | 0;
  while (gcd(step, total) !== 1) {
    step = (step + 1) % total;
    if (step <= 0) step = 1;
  }
  return { start, step };
};

const summarizeInfluence = (cases: RecoveryCase[]) =>
  LEVER_ORDER.map((family) => {
    const grouped = new Map<string, number[]>();
    for (const entry of cases) {
      if (entry.lhs_Jm3 == null) continue;
      const key = String(entry.params[family]);
      const bucket = grouped.get(key) ?? [];
      bucket.push(entry.lhs_Jm3);
      grouped.set(key, bucket);
    }
    const means = [...grouped.values()].map((values) => values.reduce((acc, v) => acc + v, 0) / values.length);
    const measuredImpact = means.length >= 2 ? Math.max(...means) - Math.min(...means) : 0;
    return {
      family,
      measuredImpactAbsLhsDelta: Math.abs(measuredImpact),
      sampledValueCount: means.length,
      noOpByAbsLhsDelta: Math.abs(measuredImpact) <= 1e-18,
    };
  }).sort((a, b) => b.measuredImpactAbsLhsDelta - a.measuredImpactAbsLhsDelta || a.family.localeCompare(b.family));

const writeStepBSummary = (summaryPath: string, payload: Record<string, unknown>) => {
  fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
  fs.writeFileSync(summaryPath, `${JSON.stringify(payload, null, 2)}\n`);
};

const readStepASummary = (summaryPath: string): StepASummary | null => {
  if (!fs.existsSync(summaryPath)) return null;
  try {
    const payload = JSON.parse(fs.readFileSync(summaryPath, 'utf8')) as Record<string, unknown>;
    const canonicalComparableCaseCount = Number(payload?.canonicalComparableCaseCount);
    if (!Number.isFinite(canonicalComparableCaseCount) || canonicalComparableCaseCount < 0) return null;
    return { canonicalComparableCaseCount };
  } catch {
    return null;
  }
};

export async function runRecoverySearch(opts: {
  outPath?: string;
  stepASummaryPath?: string;
  stepBSummaryPath?: string;
  seed?: number;
  maxCases?: number;
  topN?: number;
  runtimeCapMs?: number;
  stepCSummaryPath?: string;
} = {}) {
  const outPath = opts.outPath ?? DEFAULT_OUT_PATH;
  const seed = Number.isFinite(opts.seed) ? Number(opts.seed) : DEFAULT_SEED;
  const maxCases = Math.max(1, Math.floor(Number.isFinite(opts.maxCases) ? Number(opts.maxCases) : DEFAULT_MAX_CASES));
  const topN = Math.max(1, Math.floor(Number.isFinite(opts.topN) ? Number(opts.topN) : DEFAULT_TOP_N));
  const runtimeCapMs = Math.max(
    1_000,
    Math.floor(Number.isFinite(opts.runtimeCapMs) ? Number(opts.runtimeCapMs) : DEFAULT_RUNTIME_CAP_MS),
  );
  const stepASummaryPath =
    opts.stepASummaryPath ??
    (path.resolve(outPath) === path.resolve(DEFAULT_OUT_PATH)
      ? STEP_A_SUMMARY_PATH
      : path.join(path.dirname(outPath), 'g4-stepA-summary.json'));
  const stepBSummaryPath =
    opts.stepBSummaryPath ??
    (path.resolve(outPath) === path.resolve(DEFAULT_OUT_PATH)
      ? STEP_B_SUMMARY_PATH
      : path.join(path.dirname(outPath), 'g4-stepB-summary.json'));
  const stepCSummaryPath =
    opts.stepCSummaryPath ??
    (path.resolve(outPath) === path.resolve(DEFAULT_OUT_PATH)
      ? STEP_C_SUMMARY_PATH
      : path.join(path.dirname(outPath), 'g4-stepC-summary.json'));
  const stepASummary = readStepASummary(stepASummaryPath);
  const attemptedCaseUniverse = universeSize();
  const { start, step } = deriveDeterministicWalk(seed, attemptedCaseUniverse);
  const commitHash = execSync('git rev-parse HEAD', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  const blockedReason =
    stepASummary == null
      ? 'missing_stepA_summary'
      : stepASummary.canonicalComparableCaseCount <= 0
        ? 'no_canonical_comparable_cases'
        : null;

  if (blockedReason != null) {
    const blockedPayload = {
      runId: `g4-recovery-search-${seed}-${DATE_STAMP}`,
      generatedAt: new Date().toISOString(),
      boundaryStatement: BOUNDARY_STATEMENT,
      deterministicSearch: {
        seed,
        maxCases,
        runtimeCapMs,
        attemptedCaseUniverse,
        executedCaseCount: 0,
        evaluatedCaseCount: 0,
        elapsedMs: 0,
        deterministicWalk: { start, step },
      },
      caseCount: 0,
      candidatePassFound: false,
      candidatePassFoundCanonical: false,
      candidatePassFoundComputedOnly: false,
      minMarginRatioRawAmongApplicabilityPass: null,
      minMarginRatioRawComputedAmongApplicabilityPass: null,
      bestCandidateEligibility: {
        canonicalPassEligible: false,
        counterfactualPassEligible: false,
        class: 'no_pass_signal',
      },
      bestCandidate: null,
      blockedReason,
      provenance: {
        commitHash,
        freshnessSource: 'git.head',
      },
      topRankedApplicabilityPassCases: [],
      cases: [],
    };
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, `${JSON.stringify(blockedPayload, null, 2)}\n`);
    writeStepBSummary(stepBSummaryPath, {
      boundaryStatement: BOUNDARY_STATEMENT,
      executedCaseCount: 0,
      canonicalComparableCaseCount: 0,
      candidatePassFoundCanonicalComparable: false,
      minMarginRatioRawComputedComparable: null,
      topComparableCandidates: [],
      leverInfluenceRanking: [],
      blockedReason,
      provenance: {
        commitHash,
      },
    });
    const stepCSummary = {
      boundaryStatement: BOUNDARY_STATEMENT,
      bootstrapAttempted: false,
      bootstrapSucceeded: false,
      bootstrapReason: blockedReason,
      bootstrapProvenance: [],
      executedCaseCount: 0,
      canonicalComparableCaseCount: 0,
      nonComparableBuckets: {
        non_comparable_missing_signals: 0,
        non_comparable_contract_mismatch: 0,
        non_comparable_other: 0,
      },
      nonComparableDiagnosticsTop: [],
      candidatePassFoundCanonicalComparable: false,
      minMarginRatioRawComputedComparable: null,
      topComparableCandidates: [],
      blockedReason,
      provenance: { commitHash },
    };
    fs.mkdirSync(path.dirname(stepCSummaryPath), { recursive: true });
    fs.writeFileSync(stepCSummaryPath, `${JSON.stringify(stepCSummary, null, 2)}\n`);
    return {
      ok: false,
      outPath,
      stepASummaryPath,
      stepBSummaryPath,
      stepCSummaryPath,
      caseCount: 0,
      candidatePassFound: false,
      bestCandidate: null,
      blockedReason,
    };
  }

  const startedAt = Date.now();
  const baseline = structuredClone(getGlobalPipelineState());
  const baselineGuard = evaluateQiGuardrail(structuredClone(baseline), {
    sampler: baseline.qi?.sampler as any,
    tau_ms: Number(baseline.qi?.tau_s_ms ?? 5),
  });
  const bootstrapProfiles = [
    { profileId: 'baseline', params: {} },
    {
      profileId: 'natario-low-curvature',
      params: {
        warpFieldType: 'natario', gammaGeo: 1, dutyCycle: 0.02, dutyShip: 0.02, dutyEffective_FR: 0.02,
        sectorCount: 80, concurrentSectors: 1, gammaVanDenBroeck: 0.8,
        qCavity: 1e5, qSpoilingFactor: 1, gap_nm: 0.4, shipRadius_m: 2,
        qi: { ...(baseline.qi ?? {}), sampler: 'gaussian', fieldType: 'em', tau_s_ms: 5 },
      },
    },
  ];
  const bootstrapProvenance: BootstrapResult['provenance'] = [];
  const captureBootstrap = (profileId: string, params: Record<string, unknown>, guard: any) => {
    const entry = {
      lhs_Jm3: finiteOrNull(guard?.lhs_Jm3),
      boundComputed_Jm3: finiteOrNull(guard?.boundComputed_Jm3),
      boundUsed_Jm3: finiteOrNull(guard?.boundUsed_Jm3),
      marginRatioRaw: finiteOrNull(guard?.marginRatioRaw),
      marginRatioRawComputed: finiteOrNull(guard?.marginRatioRawComputed),
      applicabilityStatus: String(guard?.applicabilityStatus ?? 'UNKNOWN').toUpperCase(),
      rhoSource: stringOrNull(guard?.rhoSource),
      reasonCode: deriveReasonCodes(guard),
    };
    bootstrapProvenance.push({
      profileId,
      params,
      comparabilityClass: classifyComparability(entry),
      reasonCode: entry.reasonCode,
      rhoSource: entry.rhoSource,
      applicabilityStatus: entry.applicabilityStatus,
      missingSignals: missingSignalFields(entry),
    });
  };
  captureBootstrap('baseline', {}, baselineGuard);
  for (const profile of bootstrapProfiles.slice(1)) {
    const next = await updateParameters(structuredClone(baseline), profile.params as any);
    const guard = evaluateQiGuardrail(next, { sampler: 'gaussian', tau_ms: 5 });
    captureBootstrap(profile.profileId, profile.params, guard);
  }
  const bootstrapComparable = bootstrapProvenance.find((entry) => entry.comparabilityClass === 'comparable_canonical');
  const bootstrap: BootstrapResult = {
    attempted: true,
    succeeded: Boolean(bootstrapComparable),
    reason: bootstrapComparable
      ? `canonical_signals_available:${bootstrapComparable.profileId}`
      : 'canonical_signals_unavailable_after_deterministic_profiles',
    provenance: bootstrapProvenance,
  };

  const results: RecoveryCase[] = [];
  let evaluated = 0;
  const priorityCases = leverFamilies.tau_s_ms.map((tau) =>
    JSON.stringify({ ...decodeCase(start), tau_s_ms: tau, dutyShip: decodeCase(start).dutyCycle, dutyEffective_FR: decodeCase(start).dutyCycle }),
  );
  const seen = new Set<string>();
  const stagedRows: Record<string, unknown>[] = [];
  for (const encoded of priorityCases) {
    const row = JSON.parse(encoded) as Record<string, unknown>;
    const key = JSON.stringify(row);
    if (!seen.has(key)) {
      seen.add(key);
      stagedRows.push(row);
    }
  }
  for (let visit = 0; visit < attemptedCaseUniverse; visit += 1) {
    if (stagedRows.length >= maxCases) break;
    const idx = (start + visit * step) % attemptedCaseUniverse;
    const row = decodeCase(idx);
    const key = JSON.stringify(row);
    if (!seen.has(key)) {
      seen.add(key);
      stagedRows.push(row);
    }
  }

  for (const row of stagedRows) {
    if (results.length >= maxCases) break;
    if (Date.now() - startedAt > runtimeCapMs) break;
    evaluated += 1;
    const next = await updateParameters(structuredClone(baseline), {
      warpFieldType: row.warpFieldType,
      gammaGeo: row.gammaGeo,
      dutyCycle: row.dutyCycle,
      dutyShip: row.dutyShip,
      dutyEffective_FR: row.dutyEffective_FR,
      sectorCount: row.sectorCount,
      concurrentSectors: row.concurrentSectors,
      gammaVanDenBroeck: row.gammaVanDenBroeck,
      qCavity: row.qCavity,
      qSpoilingFactor: row.qSpoilingFactor,
      gap_nm: row.gap_nm,
      shipRadius_m: row.shipRadius_m,
      qi: {
        ...(baseline.qi ?? {}),
        sampler: row.sampler,
        fieldType: row.fieldType,
        tau_s_ms: row.tau_s_ms,
      },
    } as any);
    const guard = evaluateQiGuardrail(next, {
      sampler: row.sampler as any,
      tau_ms: Number(row.tau_s_ms),
    });
    const applicabilityStatus = String(guard.applicabilityStatus ?? 'UNKNOWN').toUpperCase();
    const lhs_Jm3 = finiteOrNull(guard.lhs_Jm3);
    const boundComputed_Jm3 = finiteOrNull(guard.boundComputed_Jm3);
    const boundUsed_Jm3 = finiteOrNull(guard.boundUsed_Jm3);
    const boundFloorApplied = Boolean(guard.boundFloorApplied);
    const marginRatioRaw = finiteOrNull(guard.marginRatioRaw);
    const marginRatioRawComputed = finiteOrNull(guard.marginRatioRawComputed);
    const reasonCode = deriveReasonCodes(guard);
    const rhoSource = stringOrNull(guard.rhoSource);
    const couplingMode = stringOrNull((guard as any).couplingMode);
    const couplingAlpha = finiteOrNull((guard as any).couplingAlpha);
    const rhoMetric_Jm3 = finiteOrNull((guard as any).rhoMetric_Jm3);
    const rhoProxy_Jm3 = finiteOrNull((guard as any).rhoProxy_Jm3);
    const rhoCoupledShadow_Jm3 = finiteOrNull((guard as any).rhoCoupledShadow_Jm3);
    const couplingResidualRel = finiteOrNull((guard as any).couplingResidualRel);
    const couplingComparable =
      typeof (guard as any).couplingComparable === 'boolean' ? Boolean((guard as any).couplingComparable) : null;
    results.push({
      id: `case_${String(results.length + 1).padStart(4, '0')}`,
      params: row,
      lhs_Jm3,
      boundComputed_Jm3,
      boundUsed_Jm3,
      boundFloorApplied,
      marginRatioRaw,
      marginRatioRawComputed,
      applicabilityStatus,
      reasonCode,
      rhoSource,
      couplingMode,
      couplingAlpha,
      rhoMetric_Jm3,
      rhoProxy_Jm3,
      rhoCoupledShadow_Jm3,
      couplingResidualRel,
      couplingComparable,
      classificationTag: classify(applicabilityStatus, marginRatioRawComputed),
      comparabilityClass: classifyComparability({
        lhs_Jm3,
        boundComputed_Jm3,
        boundUsed_Jm3,
        boundFloorApplied,
        marginRatioRaw,
        marginRatioRawComputed,
        applicabilityStatus,
        rhoSource,
        reasonCode,
      }),
    });
  }

  const comparableCases = results.filter((entry) => entry.comparabilityClass === 'comparable_canonical');
  const nonComparableCases = results.filter((entry) => entry.comparabilityClass !== 'comparable_canonical');
  const comparableComputedMargins = comparableCases
    .map((entry) => entry.marginRatioRawComputed)
    .filter((value): value is number => value != null)
    .sort((a, b) => a - b);
  const minMarginRatioRawComputedComparable = comparableComputedMargins[0] ?? null;
  const candidatePassFoundCanonicalComparable = comparableCases.some(
    (entry) => entry.applicabilityStatus === 'PASS' && (entry.marginRatioRaw ?? Number.POSITIVE_INFINITY) < 1,
  );
  const nonComparableBuckets = nonComparableCases.reduce<Record<Exclude<ComparabilityClass, 'comparable_canonical'>, number>>(
    (acc, entry) => {
      if (entry.comparabilityClass === 'non_comparable_missing_signals') {
        acc.non_comparable_missing_signals += 1;
      } else if (entry.comparabilityClass === 'non_comparable_contract_mismatch') {
        acc.non_comparable_contract_mismatch += 1;
      } else {
        acc.non_comparable_other += 1;
      }
      return acc;
    },
    {
      non_comparable_missing_signals: 0,
      non_comparable_contract_mismatch: 0,
      non_comparable_other: 0,
    },
  );
  const nonComparableDiagnostics = new Map<string, number>();
  for (const entry of nonComparableCases) {
    if (entry.comparabilityClass === 'non_comparable_missing_signals') {
      for (const field of missingSignalFields(entry)) {
        nonComparableDiagnostics.set(`missing_signal:${field}`, (nonComparableDiagnostics.get(`missing_signal:${field}`) ?? 0) + 1);
      }
      for (const code of entry.reasonCode) {
        nonComparableDiagnostics.set(`missing_signal_reason:${code}`, (nonComparableDiagnostics.get(`missing_signal_reason:${code}`) ?? 0) + 1);
      }
    } else if (entry.comparabilityClass === 'non_comparable_contract_mismatch') {
      const contractCodes = entry.reasonCode.filter((code) => CONTRACT_REASON_CODES.has(code) || code === 'G4_QI_SOURCE_NOT_METRIC');
      if (contractCodes.length === 0) {
        nonComparableDiagnostics.set(`contract_mismatch:rhoSource:${entry.rhoSource ?? 'null'}`, (nonComparableDiagnostics.get(`contract_mismatch:rhoSource:${entry.rhoSource ?? 'null'}`) ?? 0) + 1);
      }
      for (const code of contractCodes) {
        nonComparableDiagnostics.set(`contract_mismatch_reason:${code}`, (nonComparableDiagnostics.get(`contract_mismatch_reason:${code}`) ?? 0) + 1);
      }
    }
  }
  const nonComparableDiagnosticsTop = [...nonComparableDiagnostics.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 10)
    .map(([reason, count]) => ({ reason, count }));

  const applicabilityPass = results.filter((entry) => entry.applicabilityStatus === 'PASS');
  const rankedCandidates = applicabilityPass
    .slice()
    .sort(
      (a, b) =>
        (a.marginRatioRawComputed ?? Number.POSITIVE_INFINITY) - (b.marginRatioRawComputed ?? Number.POSITIVE_INFINITY) ||
        a.id.localeCompare(b.id),
    );
  const bestCandidate =
    rankedCandidates[0] ??
    results.slice().sort((a, b) => (a.marginRatioRawComputed ?? Number.POSITIVE_INFINITY) - (b.marginRatioRawComputed ?? Number.POSITIVE_INFINITY) || a.id.localeCompare(b.id))[0] ?? null;
  const minMarginRatioRawComputedAmongApplicabilityPass = rankedCandidates[0]?.marginRatioRawComputed ?? null;
  const minMarginRatioRawAmongApplicabilityPass = applicabilityPass
    .map((entry) => entry.marginRatioRaw ?? Number.POSITIVE_INFINITY)
    .sort((a, b) => a - b)[0] ?? null;
  const candidatePassFoundCanonical = rankedCandidates.some((entry) => (entry.marginRatioRaw ?? Number.POSITIVE_INFINITY) < 1);
  const candidatePassFoundComputedOnly = rankedCandidates.some(
    (entry) => (entry.marginRatioRawComputed ?? Number.POSITIVE_INFINITY) < 1,
  );
  const candidatePassFound = candidatePassFoundCanonical;
  const bestCandidateCanonicalPassEligible = (bestCandidate?.marginRatioRaw ?? Number.POSITIVE_INFINITY) < 1;
  const bestCandidateComputedPassEligible = (bestCandidate?.marginRatioRawComputed ?? Number.POSITIVE_INFINITY) < 1;
  const bestCandidateEligibility = {
    canonicalPassEligible: bestCandidateCanonicalPassEligible,
    counterfactualPassEligible: bestCandidateComputedPassEligible,
    class: bestCandidateCanonicalPassEligible
      ? 'canonical_pass_eligible'
      : bestCandidateComputedPassEligible
        ? 'counterfactual_only'
        : 'no_pass_signal',
  };
  const rankedComparableCandidates = comparableCases
    .slice()
    .sort(
      (a, b) =>
        (a.marginRatioRawComputed ?? Number.POSITIVE_INFINITY) - (b.marginRatioRawComputed ?? Number.POSITIVE_INFINITY) ||
        a.id.localeCompare(b.id),
    )
    .slice(0, 10)
    .map((entry) => ({
      id: entry.id,
      params: entry.params,
      lhs_Jm3: entry.lhs_Jm3,
      boundComputed_Jm3: entry.boundComputed_Jm3,
      boundUsed_Jm3: entry.boundUsed_Jm3,
      marginRatioRaw: entry.marginRatioRaw,
      marginRatioRawComputed: entry.marginRatioRawComputed,
      applicabilityStatus: entry.applicabilityStatus,
      reasonCode: entry.reasonCode,
      couplingMode: entry.couplingMode,
      couplingAlpha: entry.couplingAlpha,
      rhoMetric_Jm3: entry.rhoMetric_Jm3,
      rhoProxy_Jm3: entry.rhoProxy_Jm3,
      rhoCoupledShadow_Jm3: entry.rhoCoupledShadow_Jm3,
      couplingResidualRel: entry.couplingResidualRel,
      couplingComparable: entry.couplingComparable,
    }));
  const leverInfluenceRanking = summarizeInfluence(comparableCases);

  const payload = {
    runId: `g4-recovery-search-${seed}-${DATE_STAMP}`,
    generatedAt: new Date().toISOString(),
    boundaryStatement: BOUNDARY_STATEMENT,
    deterministicSearch: {
      seed,
      maxCases,
      runtimeCapMs,
      attemptedCaseUniverse,
      executedCaseCount: results.length,
      evaluatedCaseCount: evaluated,
      elapsedMs: Date.now() - startedAt,
      deterministicWalk: { start, step },
    },
    caseCount: results.length,
    candidatePassFound,
    candidatePassFoundCanonical,
    candidatePassFoundComputedOnly,
    minMarginRatioRawAmongApplicabilityPass,
    minMarginRatioRawComputedAmongApplicabilityPass,
    bestCandidateEligibility,
    bestCandidate,
    provenance: {
      commitHash,
      freshnessSource: 'git.head',
    },
    topRankedApplicabilityPassCases: rankedCandidates.slice(0, topN),
    cases: results,
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`);
  writeStepBSummary(stepBSummaryPath, {
    boundaryStatement: BOUNDARY_STATEMENT,
    executedCaseCount: results.length,
    canonicalComparableCaseCount: comparableCases.length,
    candidatePassFoundCanonicalComparable,
    minMarginRatioRawComputedComparable,
    topComparableCandidates: rankedComparableCandidates,
    leverInfluenceRanking,
    blockedReason: comparableCases.length === 0 ? 'no_canonical_comparable_cases_after_bootstrap' : null,
    provenance: {
      commitHash,
    },
  });
  const stepCSummary = {
    boundaryStatement: BOUNDARY_STATEMENT,
    bootstrapAttempted: bootstrap.attempted,
    bootstrapSucceeded: bootstrap.succeeded,
    bootstrapReason: bootstrap.reason,
    bootstrapProvenance: bootstrap.provenance,
    executedCaseCount: results.length,
    canonicalComparableCaseCount: comparableCases.length,
    nonComparableBuckets,
    nonComparableDiagnosticsTop,
    candidatePassFoundCanonicalComparable,
    minMarginRatioRawComputedComparable,
    topComparableCandidates: rankedComparableCandidates,
    blockedReason: comparableCases.length === 0 ? 'no_canonical_comparable_cases_after_bootstrap' : null,
    provenance: { commitHash },
  };
  fs.mkdirSync(path.dirname(stepCSummaryPath), { recursive: true });
  fs.writeFileSync(stepCSummaryPath, `${JSON.stringify(stepCSummary, null, 2)}\n`);
  return {
    ok: true,
    outPath,
    stepASummaryPath,
    stepBSummaryPath,
    stepCSummaryPath,
    caseCount: results.length,
    candidatePassFound,
    bestCandidate,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runRecoverySearch()
    .then((result) => {
      console.log(JSON.stringify(result));
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
