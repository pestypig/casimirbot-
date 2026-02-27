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
const BOUNDARY_STATEMENT =
  'This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.';

type RecoveryCase = {
  id: string;
  params: Record<string, unknown>;
  lhs_Jm3: number | null;
  boundComputed_Jm3: number | null;
  boundUsed_Jm3: number | null;
  marginRatioRaw: number | null;
  marginRatioRawComputed: number | null;
  applicabilityStatus: string;
  reasonCode: string[];
  rhoSource: string | null;
  classificationTag: 'candidate_pass_found' | 'margin_limited' | 'applicability_limited' | 'evidence_path_blocked';
};

const finiteOrNull = (n: unknown): number | null => (typeof n === 'number' && Number.isFinite(n) ? n : null);
const stringOrNull = (v: unknown): string | null => (typeof v === 'string' && v.trim().length > 0 ? v.trim() : null);

const classify = (applicabilityStatus: string, marginRatioRawComputed: number | null): RecoveryCase['classificationTag'] => {
  if (applicabilityStatus !== 'PASS') return 'applicability_limited';
  if (marginRatioRawComputed == null) return 'evidence_path_blocked';
  return marginRatioRawComputed < 1 ? 'candidate_pass_found' : 'margin_limited';
};

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
  tau_s_ms: [5, 10, 20, 50],
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

export async function runRecoverySearch(opts: {
  outPath?: string;
  seed?: number;
  maxCases?: number;
  topN?: number;
  runtimeCapMs?: number;
} = {}) {
  const outPath = opts.outPath ?? DEFAULT_OUT_PATH;
  const seed = Number.isFinite(opts.seed) ? Number(opts.seed) : DEFAULT_SEED;
  const maxCases = Math.max(1, Math.floor(Number.isFinite(opts.maxCases) ? Number(opts.maxCases) : DEFAULT_MAX_CASES));
  const topN = Math.max(1, Math.floor(Number.isFinite(opts.topN) ? Number(opts.topN) : DEFAULT_TOP_N));
  const runtimeCapMs = Math.max(
    1_000,
    Math.floor(Number.isFinite(opts.runtimeCapMs) ? Number(opts.runtimeCapMs) : DEFAULT_RUNTIME_CAP_MS),
  );

  const startedAt = Date.now();
  const baseline = structuredClone(getGlobalPipelineState());
  const attemptedCaseUniverse = universeSize();
  const { start, step } = deriveDeterministicWalk(seed, attemptedCaseUniverse);
  const commitHash = execSync('git rev-parse HEAD', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

  const results: RecoveryCase[] = [];
  let evaluated = 0;
  for (let visit = 0; visit < attemptedCaseUniverse; visit += 1) {
    if (results.length >= maxCases) break;
    if (Date.now() - startedAt > runtimeCapMs) break;
    const idx = (start + visit * step) % attemptedCaseUniverse;
    const row = decodeCase(idx);
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
    const marginRatioRawComputed = finiteOrNull(guard.marginRatioRawComputed);
    results.push({
      id: `case_${String(results.length + 1).padStart(4, '0')}`,
      params: row,
      lhs_Jm3: finiteOrNull(guard.lhs_Jm3),
      boundComputed_Jm3: finiteOrNull(guard.boundComputed_Jm3),
      boundUsed_Jm3: finiteOrNull(guard.boundUsed_Jm3),
      marginRatioRaw: finiteOrNull(guard.marginRatioRaw),
      marginRatioRawComputed,
      applicabilityStatus,
      reasonCode: deriveReasonCodes(guard),
      rhoSource: stringOrNull(guard.rhoSource),
      classificationTag: classify(applicabilityStatus, marginRatioRawComputed),
    });
  }

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
  return { ok: true, outPath, caseCount: results.length, candidatePassFound, bestCandidate };
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
