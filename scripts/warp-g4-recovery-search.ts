import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
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

const lcg = (seed: number) => {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 0x1_0000_0000;
  };
};

const deterministicRank = (items: string[], seed: number): string[] => {
  const rand = lcg(seed);
  return items
    .map((key) => ({ key, score: rand() }))
    .sort((a, b) => (a.score === b.score ? a.key.localeCompare(b.key) : a.score - b.score))
    .map((entry) => entry.key);
};

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
  tau_s_ms: [5, 10, 20, 50],
  gap_nm: [0.4, 1, 5, 8],
  shipRadius_m: [2, 10, 40],
};

const crossJoinCases = (): Array<Record<string, unknown>> => {
  const jointCases: Array<Record<string, unknown>> = [];
  for (const warpFieldType of leverFamilies.warpFieldType) {
    for (const gammaGeo of leverFamilies.gammaGeo) {
      for (const dutyCycle of leverFamilies.dutyCycle) {
        for (const sectorCount of leverFamilies.sectorCount) {
          for (const concurrentSectors of leverFamilies.concurrentSectors) {
            for (const gammaVanDenBroeck of leverFamilies.gammaVanDenBroeck) {
              for (const sampler of leverFamilies.sampler) {
                for (const fieldType of leverFamilies.fieldType) {
                  for (const tau_s_ms of leverFamilies.tau_s_ms) {
                    for (const gap_nm of leverFamilies.gap_nm) {
                      for (const shipRadius_m of leverFamilies.shipRadius_m) {
                        jointCases.push({
                          warpFieldType,
                          gammaGeo,
                          dutyCycle,
                          dutyShip: dutyCycle,
                          dutyEffective_FR: dutyCycle,
                          sectorCount,
                          concurrentSectors,
                          gammaVanDenBroeck,
                          sampler,
                          fieldType,
                          tau_s_ms,
                          gap_nm,
                          shipRadius_m,
                        });
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return jointCases;
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
  const jointCases = crossJoinCases();
  const keys = jointCases.map((entry, idx) => `${idx}:${JSON.stringify(entry)}`);
  const ranked = deterministicRank(keys, seed);

  const results: RecoveryCase[] = [];
  for (const rankedKey of ranked) {
    if (results.length >= maxCases) break;
    if (Date.now() - startedAt > runtimeCapMs) break;
    const idx = Number(rankedKey.slice(0, rankedKey.indexOf(':')));
    const row = jointCases[idx]!;
    const next = await updateParameters(structuredClone(baseline), {
      warpFieldType: row.warpFieldType,
      gammaGeo: row.gammaGeo,
      dutyCycle: row.dutyCycle,
      dutyShip: row.dutyShip,
      dutyEffective_FR: row.dutyEffective_FR,
      sectorCount: row.sectorCount,
      concurrentSectors: row.concurrentSectors,
      gammaVanDenBroeck: row.gammaVanDenBroeck,
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
  const minMarginRatioRawComputedAmongApplicabilityPass =
    rankedCandidates[0]?.marginRatioRawComputed ?? null;
  const candidatePassFound = rankedCandidates.some(
    (entry) => (entry.marginRatioRawComputed ?? Number.POSITIVE_INFINITY) < 1 && (entry.marginRatioRaw ?? Number.POSITIVE_INFINITY) < 1,
  );

  const payload = {
    runId: `g4-recovery-search-${seed}-${DATE_STAMP}`,
    generatedAt: new Date().toISOString(),
    boundaryStatement: BOUNDARY_STATEMENT,
    deterministicSearch: {
      seed,
      maxCases,
      runtimeCapMs,
      attemptedCaseUniverse: jointCases.length,
      executedCaseCount: results.length,
    },
    caseCount: results.length,
    candidatePassFound,
    minMarginRatioRawComputedAmongApplicabilityPass,
    bestCandidate,
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
