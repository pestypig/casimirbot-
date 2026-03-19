import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_MANIFEST_PATH = path.join('configs', 'physics-root-leaf-manifest.v1.json');
const DEFAULT_CANARY_PACK_PATH = path.join('tests', 'fixtures', 'warp-flagship-bundle-scorecard-canary.v1.json');
const FLAGSHIP_BUNDLE_ID = 'nhm2.curvature-collapse';
const SOLAR_PATH_ID = 'path_solar_coherence_to_collapse_hypothesis';
const FLAGSHIP_PATH_ORDER = [
  'path_casimir_force_to_stress_energy',
  'path_stress_energy_to_gr_diagnostics',
  'path_gr_diagnostics_to_curvature_proxy',
  'path_curvature_proxy_to_collapse_benchmark',
  SOLAR_PATH_ID,
] as const;

const CLAIM_TIER_RANK: Record<string, number> = {
  diagnostic: 0,
  'reduced-order': 1,
  certified: 2,
};

type ClaimTier = keyof typeof CLAIM_TIER_RANK;
type PathStatus = 'match' | 'converge' | 'diverge';

type PathEntry = {
  id?: string;
  root_id?: string;
  leaf_id?: string;
  maturity_gate?: {
    max_claim_tier?: string;
  };
};

type BridgeBundleEntry = {
  id?: string;
  summary?: string;
  max_claim_tier?: string;
  path_ids?: string[];
};

type Manifest = {
  bridge_bundles?: BridgeBundleEntry[];
  paths?: PathEntry[];
};

export type FlagshipScorecardContext = {
  canonicalDecisionOk: boolean;
  geometryPassCount: number;
  geometryRequiredCount: number;
  compatibleObservableCount: number;
  totalObservableCount: number;
  reportableReadyLaneCount: number;
  blockedLaneCount: number;
  readinessGatePass: boolean;
  blockerCount: number;
};

export type FlagshipBundleScorecardPath = {
  path_id: string;
  status: PathStatus;
  reason_codes: string[];
  residuals: Record<string, number>;
  max_claim_tier: string;
  hypothesis_only: boolean;
};

export type FlagshipBundleScorecard = {
  artifact_type: 'flagship_bundle_scorecard/v1';
  bundle_id: string;
  bundle_summary: string;
  max_claim_tier: string;
  path_count: number;
  match_count: number;
  converge_count: number;
  diverge_count: number;
  rules: {
    no_missing_flagship_paths: boolean;
    no_tier_overclaim: boolean;
    solar_lane_hypothesis_only: boolean;
  };
  paths: FlagshipBundleScorecardPath[];
};

type CanaryExpectation = {
  path_id: string;
  expected_status: PathStatus;
  required_reason_codes?: string[];
};

type CanaryCase = {
  id?: string;
  expected_verdict?: 'pass' | 'fail';
  context?: Partial<FlagshipScorecardContext>;
  expectations?: CanaryExpectation[];
};

type CanaryPack = {
  artifact_type?: string;
  bundle_id?: string;
  cases?: CanaryCase[];
};

export type ScorecardValidationResult = {
  ok: boolean;
  errors: string[];
};

export type CanaryValidationResult = {
  ok: boolean;
  errors: string[];
  cases: Array<{ id: string; ok: boolean; expected_verdict: 'pass' | 'fail' }>;
};

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function resolvePath(filePath: string): string {
  return path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
}

function claimTierRank(value: string | undefined): number {
  if (!value) return -1;
  return CLAIM_TIER_RANK[value] ?? -1;
}

function clampRatio(numerator: number, denominator: number): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) return 0;
  return Number(Number((numerator / denominator).toFixed(6)));
}

function numericFlag(value: boolean): number {
  return value ? 1 : 0;
}

function loadFlagshipBundle(manifestPath = DEFAULT_MANIFEST_PATH): { manifest: Manifest; bundle: BridgeBundleEntry; pathMap: Map<string, PathEntry> } {
  const manifest = readJson<Manifest>(resolvePath(manifestPath));
  const bundles = Array.isArray(manifest.bridge_bundles) ? manifest.bridge_bundles : [];
  const bundle = bundles.find((entry) => entry.id === FLAGSHIP_BUNDLE_ID);
  if (!bundle) throw new Error(`Missing flagship bundle: ${FLAGSHIP_BUNDLE_ID}`);
  const pathEntries = Array.isArray(manifest.paths) ? manifest.paths : [];
  const pathMap = new Map(pathEntries.map((entry) => [String(entry.id ?? ''), entry]));
  return { manifest, bundle, pathMap };
}

function buildPathScore(pathId: string, pathEntry: PathEntry | undefined, bundleTier: string, context: FlagshipScorecardContext): FlagshipBundleScorecardPath {
  const maxClaimTier = String(pathEntry?.maturity_gate?.max_claim_tier ?? bundleTier ?? 'diagnostic');
  const hypothesisOnly = pathId === SOLAR_PATH_ID;

  if (pathId === FLAGSHIP_PATH_ORDER[0]) {
    const ready = context.reportableReadyLaneCount;
    const total = ready + context.blockedLaneCount;
    const status: PathStatus = ready >= 2 ? 'match' : ready >= 1 ? 'converge' : 'diverge';
    return {
      path_id: pathId,
      status,
      reason_codes:
        status === 'match'
          ? ['measured_lane_reportable_ready', 'measured_lane_majority_ready']
          : status === 'converge'
            ? ['measured_lane_partial_ready']
            : ['measured_lane_missing'],
      residuals: {
        reportable_ready_lane_count: ready,
        blocked_lane_count: context.blockedLaneCount,
        blocked_lane_ratio: clampRatio(context.blockedLaneCount, total || 1),
      },
      max_claim_tier: maxClaimTier,
      hypothesis_only: hypothesisOnly,
    };
  }

  if (pathId === FLAGSHIP_PATH_ORDER[1]) {
    const status: PathStatus = context.canonicalDecisionOk && context.geometryPassCount === context.geometryRequiredCount
      ? 'match'
      : context.canonicalDecisionOk || context.geometryPassCount > 0
        ? 'converge'
        : 'diverge';
    return {
      path_id: pathId,
      status,
      reason_codes:
        status === 'match'
          ? ['canonical_geometry_closure']
          : status === 'converge'
            ? ['geometry_partial_closure']
            : ['geometry_closure_missing'],
      residuals: {
        canonical_decision_ok: numericFlag(context.canonicalDecisionOk),
        geometry_pass_ratio: clampRatio(context.geometryPassCount, context.geometryRequiredCount),
        geometry_missing_count: Math.max(context.geometryRequiredCount - context.geometryPassCount, 0),
      },
      max_claim_tier: maxClaimTier,
      hypothesis_only: hypothesisOnly,
    };
  }

  if (pathId === FLAGSHIP_PATH_ORDER[2]) {
    const status: PathStatus = context.compatibleObservableCount === context.totalObservableCount
      ? 'match'
      : context.compatibleObservableCount > 0
        ? 'converge'
        : 'diverge';
    return {
      path_id: pathId,
      status,
      reason_codes:
        status === 'match'
          ? ['gr_observable_compatibility_complete']
          : status === 'converge'
            ? ['gr_observable_compatibility_partial']
            : ['gr_observable_compatibility_missing'],
      residuals: {
        compatible_observable_count: context.compatibleObservableCount,
        incompatible_observable_count: Math.max(context.totalObservableCount - context.compatibleObservableCount, 0),
        compatibility_ratio: clampRatio(context.compatibleObservableCount, context.totalObservableCount),
      },
      max_claim_tier: maxClaimTier,
      hypothesis_only: hypothesisOnly,
    };
  }

  if (pathId === FLAGSHIP_PATH_ORDER[3]) {
    const status: PathStatus = context.readinessGatePass
      ? 'match'
      : context.canonicalDecisionOk && context.geometryPassCount === context.geometryRequiredCount && context.compatibleObservableCount === context.totalObservableCount
        ? 'converge'
        : 'diverge';
    return {
      path_id: pathId,
      status,
      reason_codes:
        status === 'match'
          ? ['collapse_benchmark_gate_pass']
          : status === 'converge'
            ? ['collapse_benchmark_reference_only']
            : ['collapse_benchmark_blocked'],
      residuals: {
        readiness_gate_pass: numericFlag(context.readinessGatePass),
        blocker_count: context.blockerCount,
        blocked_lane_count: context.blockedLaneCount,
      },
      max_claim_tier: maxClaimTier,
      hypothesis_only: hypothesisOnly,
    };
  }

  return {
    path_id: pathId,
    status: 'diverge',
    reason_codes: ['hypothesis_only_quarantine', 'solar_lane_not_measured', 'tier_guard_diagnostic_only'],
    residuals: {
      hypothesis_quarantine_gap: 1,
      measured_support_count: 0,
      allowed_claim_tier_rank: Math.max(claimTierRank(maxClaimTier), 0),
    },
    max_claim_tier: maxClaimTier,
    hypothesis_only: true,
  };
}

export function buildFlagshipBundleScorecard(context: FlagshipScorecardContext, options?: { manifestPath?: string }): FlagshipBundleScorecard {
  const { bundle, pathMap } = loadFlagshipBundle(options?.manifestPath);
  const bundleTier = String(bundle.max_claim_tier ?? 'diagnostic');
  const bundlePathIds = Array.isArray(bundle.path_ids) ? bundle.path_ids : [];
  const orderedPathIds = FLAGSHIP_PATH_ORDER.filter((pathId) => bundlePathIds.includes(pathId));
  const paths = orderedPathIds.map((pathId) => buildPathScore(pathId, pathMap.get(pathId), bundleTier, context));
  const matchCount = paths.filter((entry) => entry.status === 'match').length;
  const convergeCount = paths.filter((entry) => entry.status === 'converge').length;
  const divergeCount = paths.filter((entry) => entry.status === 'diverge').length;

  return {
    artifact_type: 'flagship_bundle_scorecard/v1',
    bundle_id: FLAGSHIP_BUNDLE_ID,
    bundle_summary: String(bundle.summary ?? ''),
    max_claim_tier: bundleTier,
    path_count: paths.length,
    match_count: matchCount,
    converge_count: convergeCount,
    diverge_count: divergeCount,
    rules: {
      no_missing_flagship_paths: FLAGSHIP_PATH_ORDER.every((pathId) => orderedPathIds.includes(pathId)),
      no_tier_overclaim: paths.every((entry) => claimTierRank(entry.max_claim_tier) <= claimTierRank(bundleTier)),
      solar_lane_hypothesis_only: paths.some(
        (entry) => entry.path_id === SOLAR_PATH_ID && entry.status === 'diverge' && entry.hypothesis_only === true,
      ),
    },
    paths,
  };
}

export function validateFlagshipBundleScorecard(scorecard: FlagshipBundleScorecard, options?: { manifestPath?: string }): ScorecardValidationResult {
  const { bundle } = loadFlagshipBundle(options?.manifestPath);
  const errors: string[] = [];
  const bundleTier = String(bundle.max_claim_tier ?? 'diagnostic');
  const scorecardPathIds = new Set(scorecard.paths.map((entry) => entry.path_id));

  for (const requiredPathId of FLAGSHIP_PATH_ORDER) {
    if (!scorecardPathIds.has(requiredPathId)) {
      errors.push(`missing required flagship path: ${requiredPathId}`);
    }
  }

  for (const pathEntry of scorecard.paths) {
    if (!['match', 'converge', 'diverge'].includes(pathEntry.status)) {
      errors.push(`invalid path status for ${pathEntry.path_id}: ${String(pathEntry.status)}`);
    }
    if (claimTierRank(pathEntry.max_claim_tier) > claimTierRank(bundleTier)) {
      errors.push(`tier over-claim for ${pathEntry.path_id}: ${pathEntry.max_claim_tier} exceeds bundle max ${bundleTier}`);
    }
  }

  const solarEntry = scorecard.paths.find((entry) => entry.path_id === SOLAR_PATH_ID);
  if (!solarEntry) {
    errors.push(`missing solar quarantine path: ${SOLAR_PATH_ID}`);
  } else {
    if (solarEntry.status !== 'diverge') {
      errors.push('solar lane must remain divergence-scored while hypothesis-only');
    }
    if (solarEntry.hypothesis_only !== true) {
      errors.push('solar lane must remain hypothesis_only=true');
    }
    if (!solarEntry.reason_codes.includes('hypothesis_only_quarantine')) {
      errors.push('solar lane must emit reason code hypothesis_only_quarantine');
    }
  }

  if (scorecard.rules.no_missing_flagship_paths !== (FLAGSHIP_PATH_ORDER.every((pathId) => scorecardPathIds.has(pathId)))) {
    errors.push('scorecard no_missing_flagship_paths rule is inconsistent with path coverage');
  }

  return { ok: errors.length === 0, errors };
}

function withDefaultContext(partial?: Partial<FlagshipScorecardContext>): FlagshipScorecardContext {
  return {
    canonicalDecisionOk: true,
    geometryPassCount: 5,
    geometryRequiredCount: 5,
    compatibleObservableCount: 4,
    totalObservableCount: 4,
    reportableReadyLaneCount: 2,
    blockedLaneCount: 1,
    readinessGatePass: false,
    blockerCount: 1,
    ...(partial ?? {}),
  };
}

export function validateFlagshipBundleScorecardCanaries(options?: { manifestPath?: string; canaryPackPath?: string }): CanaryValidationResult {
  const canaryPack = readJson<CanaryPack>(resolvePath(options?.canaryPackPath ?? DEFAULT_CANARY_PACK_PATH));
  const errors: string[] = [];
  const caseResults: Array<{ id: string; ok: boolean; expected_verdict: 'pass' | 'fail' }> = [];

  if (canaryPack.artifact_type !== 'flagship_bundle_scorecard_canary_pack/v1') {
    errors.push(`invalid canary pack artifact_type: ${String(canaryPack.artifact_type)}`);
  }
  if (canaryPack.bundle_id !== FLAGSHIP_BUNDLE_ID) {
    errors.push(`canary pack must target bundle_id=${FLAGSHIP_BUNDLE_ID}`);
  }

  const cases = Array.isArray(canaryPack.cases) ? canaryPack.cases : [];
  if (cases.length < 2) {
    errors.push('canary pack must define at least two cases');
  }

  for (const entry of cases) {
    const id = String(entry.id ?? 'unnamed_case');
    const expectedVerdict = entry.expected_verdict === 'fail' ? 'fail' : 'pass';
    const scorecard = buildFlagshipBundleScorecard(withDefaultContext(entry.context), { manifestPath: options?.manifestPath });
    const validation = validateFlagshipBundleScorecard(scorecard, { manifestPath: options?.manifestPath });
    const expectations = Array.isArray(entry.expectations) ? entry.expectations : [];
    const expectationErrors = validation.errors.slice();
    let divergeObserved = false;

    for (const expectation of expectations) {
      const pathScore = scorecard.paths.find((pathEntry) => pathEntry.path_id === expectation.path_id);
      if (!pathScore) {
        expectationErrors.push(`${id} missing expected path: ${expectation.path_id}`);
        continue;
      }
      if (pathScore.status !== expectation.expected_status) {
        expectationErrors.push(
          `${id} expected ${expectation.path_id} to be ${expectation.expected_status} but got ${pathScore.status}`,
        );
      }
      if (expectation.expected_status === 'diverge') divergeObserved = true;
      for (const reasonCode of expectation.required_reason_codes ?? []) {
        if (!pathScore.reason_codes.includes(reasonCode)) {
          expectationErrors.push(`${id} missing reason code ${reasonCode} for ${expectation.path_id}`);
        }
      }
    }

    if (expectedVerdict === 'fail' && !divergeObserved) {
      expectationErrors.push(`${id} expected fail canary must assert at least one diverge path`);
    }

    const caseOk = expectationErrors.length === 0;
    caseResults.push({ id, ok: caseOk, expected_verdict: expectedVerdict });
    errors.push(...expectationErrors);
  }

  return { ok: errors.length === 0, errors, cases: caseResults };
}

function parseFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index < 0) return undefined;
  return process.argv[index + 1];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const manifestPath = parseFlag('--manifest');
  const canaryPackPath = parseFlag('--canary-pack');
  const result = validateFlagshipBundleScorecardCanaries({ manifestPath, canaryPackPath });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.ok) process.exit(1);
}
