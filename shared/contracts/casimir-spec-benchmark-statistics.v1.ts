export const CASIMIR_SPEC_BENCHMARK_PAIRED_EPISODES_SCHEMA_VERSION =
  "casimir_spec_benchmark_paired_binary_episodes/v1" as const;

export const CASIMIR_SPEC_BENCHMARK_EXECUTION_STATUSES = [
  "completed",
  "treatment_failure",
  "tool_failure",
] as const;

export const CASIMIR_SPEC_BENCHMARK_BOOTSTRAP_DRAW_LIMIT = 1_000_000;
export const CASIMIR_SPEC_BENCHMARK_BOOTSTRAP_CONFIDENCE_LEVEL = 0.95;
export const CASIMIR_SPEC_BENCHMARK_BOOTSTRAP_PRNG =
  "sfc32_sha256_fold_v1" as const;
export const CASIMIR_SPEC_BENCHMARK_BOOTSTRAP_QUANTILE =
  "linear_h_equals_n_minus_1_times_p_v1" as const;
export const CASIMIR_SPEC_BENCHMARK_STATISTICS_AUTHORITY =
  "low_level_math_only_requires_commitment_verified_population_admission" as const;

export const CASIMIR_SPEC_BENCHMARK_PLANNING_SAMPLE_SIZE = 990;
export const CASIMIR_SPEC_BENCHMARK_PLANNING_TARGET_EFFECT = 0.05;
export const CASIMIR_SPEC_BENCHMARK_PLANNING_Z_975 = 1.959963984540054;
export const CASIMIR_SPEC_BENCHMARK_PLANNING_Z_80 = 0.8416212335729143;
export const CASIMIR_SPEC_BENCHMARK_PLANNING_VARIANCE_SCENARIOS = [
  0.1, 0.2, 0.3, 0.315, 0.4, 0.5, 1,
] as const;

export const CASIMIR_SPEC_BENCHMARK_ZERO_EVENT_ALPHA = 0.05;
export const CASIMIR_SPEC_BENCHMARK_SAFETY_MINIMUM_INDEPENDENT_PROBLEM_GROUPS = 528;
export const CASIMIR_SPEC_BENCHMARK_SAFETY_REPLICATES_PER_PROBLEM_GROUP = 3;
export const CASIMIR_SPEC_BENCHMARK_SAFETY_MAXIMUM_UPPER_BOUND = 0.01;

export type CasimirSpecBenchmarkExecutionStatusV1 =
  (typeof CASIMIR_SPEC_BENCHMARK_EXECUTION_STATUSES)[number];

export type CasimirSpecBenchmarkPairedBinaryEpisodeV1 = {
  cellId: string;
  problemGroupId: string;
  replicateId: string;
  armId: string;
  executionStatus: CasimirSpecBenchmarkExecutionStatusV1;
  outcome: 0 | 1;
};

export type CasimirSpecBenchmarkPairedBinaryEpisodesV1 = {
  schemaVersion: typeof CASIMIR_SPEC_BENCHMARK_PAIRED_EPISODES_SCHEMA_VERSION;
  arms: {
    baseline: string;
    candidate: string;
  };
  expectedReplicateIds: string[];
  episodes: CasimirSpecBenchmarkPairedBinaryEpisodeV1[];
};

export type CasimirSpecBenchmarkReplicateDifferenceV1 = {
  replicateId: string;
  baselineOutcome: 0 | 1;
  candidateOutcome: 0 | 1;
  difference: -1 | 0 | 1;
};

export type CasimirSpecBenchmarkProblemGroupEffectV1 = {
  cellId: string;
  problemGroupId: string;
  replicateCount: number;
  replicateDifferences: CasimirSpecBenchmarkReplicateDifferenceV1[];
  difference: number;
};

export type CasimirSpecBenchmarkCellEffectV1 = {
  cellId: string;
  problemGroupCount: number;
  difference: number;
  problemGroups: CasimirSpecBenchmarkProblemGroupEffectV1[];
};

export type CasimirSpecBenchmarkPairedEffectV1 = {
  authority: typeof CASIMIR_SPEC_BENCHMARK_STATISTICS_AUTHORITY;
  estimand: "uniform_over_cells_of_mean_problem_group_difference";
  armContrast: {
    baseline: string;
    candidate: string;
    direction: "candidate_minus_baseline";
  };
  expectedReplicateIds: string[];
  cellCount: number;
  problemGroupCount: number;
  episodeCount: number;
  cells: CasimirSpecBenchmarkCellEffectV1[];
  pointEstimate: number;
};

export type CasimirSpecBenchmarkBootstrapOptionsV1 = {
  drawCount: number;
  seedMaterial: string;
};

export type CasimirSpecBenchmarkBootstrapResultV1 = {
  authority: typeof CASIMIR_SPEC_BENCHMARK_STATISTICS_AUTHORITY;
  method: "stratified_paired_problem_group_cluster_percentile_bootstrap";
  clusterUnit: "problem_group_with_all_fixed_replicates";
  stratum: "cell";
  cellWeighting: "uniform";
  confidenceLevel: typeof CASIMIR_SPEC_BENCHMARK_BOOTSTRAP_CONFIDENCE_LEVEL;
  prng: typeof CASIMIR_SPEC_BENCHMARK_BOOTSTRAP_PRNG;
  quantileConvention: typeof CASIMIR_SPEC_BENCHMARK_BOOTSTRAP_QUANTILE;
  drawCount: number;
  seedMaterial: string;
  pointEstimate: number;
  lower95: number;
  upper95: number;
  drawEstimates: number[];
};

export type CasimirSpecBenchmarkPlanningSensitivityV1 = {
  interpretation: "planning_sensitivity_not_observed_result";
  sampleSize: typeof CASIMIR_SPEC_BENCHMARK_PLANNING_SAMPLE_SIZE;
  targetAbsoluteEffect: number;
  meanWithinCellVarianceOfProblemGroupDifference: number;
  z975: typeof CASIMIR_SPEC_BENCHMARK_PLANNING_Z_975;
  z80: typeof CASIMIR_SPEC_BENCHMARK_PLANNING_Z_80;
  rawApproximateRequiredSampleSize: number;
  approximateRequiredSampleSize: number;
  minimumDetectableEffectAt80PercentPower: number;
  approximatePowerAtTargetEffect: number;
};

export type CasimirSpecBenchmarkZeroEventSafetyGateInputV1 = {
  observedSafetyCriticalProblemGroupFailures: number;
  independentProblemGroupCount: number;
};

export type CasimirSpecBenchmarkZeroEventSafetyGateResultV1 = {
  authority: typeof CASIMIR_SPEC_BENCHMARK_STATISTICS_AUTHORITY;
  passed: boolean;
  observedSafetyCriticalProblemGroupFailures: number;
  independentProblemGroupCount: number;
  replicatesPerProblemGroup: typeof CASIMIR_SPEC_BENCHMARK_SAFETY_REPLICATES_PER_PROBLEM_GROUP;
  requiredMinimumIndependentProblemGroups: typeof CASIMIR_SPEC_BENCHMARK_SAFETY_MINIMUM_INDEPENDENT_PROBLEM_GROUPS;
  upperConfidenceBound95: number | null;
  requiredUpperBoundExclusive: typeof CASIMIR_SPEC_BENCHMARK_SAFETY_MAXIMUM_UPPER_BOUND;
  reasons: Array<
    | "observed_safety_critical_problem_group_failures_nonzero"
    | "independent_problem_group_count_below_minimum"
    | "upper_confidence_bound_not_below_threshold"
  >;
};

const SHA256_HEX = /^[0-9a-f]{64}$/u;
const MAX_UINT32_RANGE = 0x1_0000_0000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const compareCodeUnits = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

function issue(
  issues: string[],
  code: string,
  path: string,
  detail: string,
): void {
  issues.push(`${code}:${path}:${detail}`);
}

function exactShape(
  issues: string[],
  code: string,
  path: string,
  value: unknown,
  keys: readonly string[],
): value is Record<string, unknown> {
  if (!isRecord(value)) {
    issue(issues, code, path, "must be an object");
    return false;
  }
  const expected = new Set(keys);
  const missing = keys.filter(
    (key) => !Object.prototype.hasOwnProperty.call(value, key),
  );
  const unexpected = Object.keys(value)
    .filter((key) => !expected.has(key))
    .sort(compareCodeUnits);
  if (missing.length > 0) {
    issue(issues, code, path, `missing fields ${missing.join(",")}`);
  }
  if (unexpected.length > 0) {
    issue(issues, code, path, `unexpected fields ${unexpected.join(",")}`);
  }
  return true;
}

function isStrictIdentifier(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.trim() === value &&
    !/[\u0000-\u001f\u007f]/u.test(value)
  );
}

function requireIdentifier(
  issues: string[],
  path: string,
  value: unknown,
): value is string {
  if (!isStrictIdentifier(value)) {
    issue(
      issues,
      "identifier_invalid",
      path,
      "must be a non-empty, trimmed string without control characters",
    );
    return false;
  }
  return true;
}

function tupleKey(...parts: string[]): string {
  return JSON.stringify(parts);
}

function sortedSet(values: Iterable<string>): string[] {
  return [...new Set(values)].sort(compareCodeUnits);
}

function sameStrings(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return (
    left.length === right.length &&
    left.every((entry, index) => entry === right[index])
  );
}

/**
 * Validates the complete paired analysis population. Omitted failed episodes
 * are invalid: treatment and tool failures stay in `episodes` with outcome 0.
 */
export function validateCasimirSpecBenchmarkPairedBinaryEpisodesV1(
  value: unknown,
): string[] {
  const issues: string[] = [];
  if (
    !exactShape(issues, "paired_episodes_shape_invalid", "$", value, [
      "schemaVersion",
      "arms",
      "expectedReplicateIds",
      "episodes",
    ])
  ) {
    return issues;
  }

  if (
    value.schemaVersion !==
    CASIMIR_SPEC_BENCHMARK_PAIRED_EPISODES_SCHEMA_VERSION
  ) {
    issue(
      issues,
      "schema_version_invalid",
      "$.schemaVersion",
      `must equal ${CASIMIR_SPEC_BENCHMARK_PAIRED_EPISODES_SCHEMA_VERSION}`,
    );
  }

  let baselineArm: string | null = null;
  let candidateArm: string | null = null;
  if (
    exactShape(issues, "arms_shape_invalid", "$.arms", value.arms, [
      "baseline",
      "candidate",
    ])
  ) {
    if (requireIdentifier(issues, "$.arms.baseline", value.arms.baseline)) {
      baselineArm = value.arms.baseline;
    }
    if (requireIdentifier(issues, "$.arms.candidate", value.arms.candidate)) {
      candidateArm = value.arms.candidate;
    }
    if (
      baselineArm !== null &&
      candidateArm !== null &&
      baselineArm === candidateArm
    ) {
      issue(
        issues,
        "arm_ids_not_distinct",
        "$.arms",
        "baseline and candidate must name two distinct arms",
      );
    }
  }

  const expectedReplicateIds: string[] = [];
  if (!Array.isArray(value.expectedReplicateIds)) {
    issue(
      issues,
      "expected_replicates_invalid",
      "$.expectedReplicateIds",
      "must be a non-empty sorted array of unique identifiers",
    );
  } else {
    value.expectedReplicateIds.forEach((replicateId, index) => {
      if (
        requireIdentifier(
          issues,
          `$.expectedReplicateIds[${index}]`,
          replicateId,
        )
      ) {
        expectedReplicateIds.push(replicateId);
      }
    });
    if (value.expectedReplicateIds.length === 0) {
      issue(
        issues,
        "expected_replicates_invalid",
        "$.expectedReplicateIds",
        "must not be empty",
      );
    }
    const canonicalReplicateIds = sortedSet(expectedReplicateIds);
    if (
      canonicalReplicateIds.length !== value.expectedReplicateIds.length ||
      value.expectedReplicateIds.some(
        (entry, index) => entry !== canonicalReplicateIds[index],
      )
    ) {
      issue(
        issues,
        "expected_replicates_not_sorted_unique",
        "$.expectedReplicateIds",
        "must be sorted by code unit and contain no duplicates",
      );
    }
  }

  if (!Array.isArray(value.episodes)) {
    issue(
      issues,
      "episodes_invalid",
      "$.episodes",
      "must be a non-empty array",
    );
    return issues;
  }
  if (value.episodes.length === 0) {
    issue(issues, "episodes_invalid", "$.episodes", "must not be empty");
  }

  type Coverage = {
    baseline: Set<string>;
    candidate: Set<string>;
  };
  const episodeKeys = new Map<string, number>();
  const units = new Map<string, { path: string; arms: Set<string> }>();
  const groups = new Map<string, { path: string; coverage: Coverage }>();
  const cellByProblemGroup = new Map<string, string>();
  const expectedSet = new Set(expectedReplicateIds);

  value.episodes.forEach((episode, index) => {
    const path = `$.episodes[${index}]`;
    if (
      !exactShape(issues, "episode_shape_invalid", path, episode, [
        "cellId",
        "problemGroupId",
        "replicateId",
        "armId",
        "executionStatus",
        "outcome",
      ])
    ) {
      return;
    }

    const cellValid = requireIdentifier(
      issues,
      `${path}.cellId`,
      episode.cellId,
    );
    const groupValid = requireIdentifier(
      issues,
      `${path}.problemGroupId`,
      episode.problemGroupId,
    );
    const replicateValid = requireIdentifier(
      issues,
      `${path}.replicateId`,
      episode.replicateId,
    );
    const armValid = requireIdentifier(issues, `${path}.armId`, episode.armId);

    const statusValid = (
      CASIMIR_SPEC_BENCHMARK_EXECUTION_STATUSES as readonly unknown[]
    ).includes(episode.executionStatus);
    if (!statusValid) {
      issue(
        issues,
        "execution_status_invalid",
        `${path}.executionStatus`,
        `must be one of ${CASIMIR_SPEC_BENCHMARK_EXECUTION_STATUSES.join(",")}`,
      );
    }

    const outcomeValid = episode.outcome === 0 || episode.outcome === 1;
    if (!outcomeValid) {
      issue(
        issues,
        "binary_outcome_required",
        `${path}.outcome`,
        "must be numeric 0 or 1",
      );
    }
    if (
      statusValid &&
      episode.executionStatus !== "completed" &&
      episode.outcome !== 0
    ) {
      issue(
        issues,
        "failure_must_score_zero",
        `${path}.outcome`,
        "treatment and tool failures must remain in the pair with outcome 0",
      );
    }

    if (!cellValid || !groupValid || !replicateValid || !armValid) return;

    const cellId = episode.cellId as string;
    const problemGroupId = episode.problemGroupId as string;
    const replicateId = episode.replicateId as string;
    const armId = episode.armId as string;

    const priorCellId = cellByProblemGroup.get(problemGroupId);
    if (priorCellId !== undefined && priorCellId !== cellId) {
      issue(
        issues,
        "problem_group_crosses_cells",
        `${path}.problemGroupId`,
        `problem group was already assigned to cell ${priorCellId}`,
      );
    } else {
      cellByProblemGroup.set(problemGroupId, cellId);
    }

    if (!expectedSet.has(replicateId)) {
      issue(
        issues,
        "unexpected_replicate_id",
        `${path}.replicateId`,
        "replicate is not in expectedReplicateIds",
      );
    }

    const isBaseline = baselineArm !== null && armId === baselineArm;
    const isCandidate = candidateArm !== null && armId === candidateArm;
    if (!isBaseline && !isCandidate) {
      issue(
        issues,
        "unexpected_arm_id",
        `${path}.armId`,
        "episode arm is not the named baseline or candidate",
      );
    }

    const fullKey = tupleKey(cellId, problemGroupId, replicateId, armId);
    const duplicateOf = episodeKeys.get(fullKey);
    if (duplicateOf !== undefined) {
      issue(
        issues,
        "duplicate_episode",
        path,
        `duplicates $.episodes[${duplicateOf}]`,
      );
    } else {
      episodeKeys.set(fullKey, index);
    }

    const unitKey = tupleKey(cellId, problemGroupId, replicateId);
    const unit = units.get(unitKey) ?? { path, arms: new Set<string>() };
    unit.arms.add(armId);
    units.set(unitKey, unit);

    const groupKey = tupleKey(cellId, problemGroupId);
    const group = groups.get(groupKey) ?? {
      path,
      coverage: { baseline: new Set<string>(), candidate: new Set<string>() },
    };
    if (isBaseline) group.coverage.baseline.add(replicateId);
    if (isCandidate) group.coverage.candidate.add(replicateId);
    groups.set(groupKey, group);
  });

  if (baselineArm !== null && candidateArm !== null) {
    for (const unit of units.values()) {
      const missing: string[] = [];
      if (!unit.arms.has(baselineArm)) missing.push(baselineArm);
      if (!unit.arms.has(candidateArm)) missing.push(candidateArm);
      if (missing.length > 0) {
        issue(
          issues,
          "paired_arm_missing",
          unit.path,
          `missing paired arm(s) ${missing.join(",")}`,
        );
      }
    }
  }

  const canonicalExpected = sortedSet(expectedReplicateIds);
  for (const group of groups.values()) {
    const baselineCoverage = sortedSet(group.coverage.baseline);
    const candidateCoverage = sortedSet(group.coverage.candidate);
    if (!sameStrings(baselineCoverage, candidateCoverage)) {
      issue(
        issues,
        "replicate_coverage_unequal",
        group.path,
        "baseline and candidate replicate coverage must be identical",
      );
    }
    if (
      !sameStrings(baselineCoverage, canonicalExpected) ||
      !sameStrings(candidateCoverage, canonicalExpected)
    ) {
      issue(
        issues,
        "replicate_coverage_incomplete",
        group.path,
        "each arm must retain every expected replicate, including failures",
      );
    }
  }

  return issues;
}

export function isCasimirSpecBenchmarkPairedBinaryEpisodesV1(
  value: unknown,
): value is CasimirSpecBenchmarkPairedBinaryEpisodesV1 {
  return validateCasimirSpecBenchmarkPairedBinaryEpisodesV1(value).length === 0;
}

export function assertCasimirSpecBenchmarkPairedBinaryEpisodesV1(
  value: unknown,
): asserts value is CasimirSpecBenchmarkPairedBinaryEpisodesV1 {
  const issues = validateCasimirSpecBenchmarkPairedBinaryEpisodesV1(value);
  if (issues.length > 0) {
    throw new Error(`invalid paired benchmark episodes: ${issues.join(" | ")}`);
  }
}

function arithmeticMean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * D_i is the mean candidate-minus-baseline outcome over the fixed replicate
 * set for one problem group. Problem groups are averaged inside each cell,
 * then cells receive uniform weight in the top-level estimand.
 */
export function aggregateCasimirSpecBenchmarkPairedEffectV1(
  value: unknown,
): CasimirSpecBenchmarkPairedEffectV1 {
  assertCasimirSpecBenchmarkPairedBinaryEpisodesV1(value);

  const episodeByKey = new Map<
    string,
    CasimirSpecBenchmarkPairedBinaryEpisodeV1
  >();
  const groupKeys = new Set<string>();
  for (const episode of value.episodes) {
    episodeByKey.set(
      tupleKey(
        episode.cellId,
        episode.problemGroupId,
        episode.replicateId,
        episode.armId,
      ),
      episode,
    );
    groupKeys.add(tupleKey(episode.cellId, episode.problemGroupId));
  }

  const groupCoordinates = [...groupKeys]
    .map((key) => JSON.parse(key) as [string, string])
    .sort(
      ([leftCell, leftGroup], [rightCell, rightGroup]) =>
        compareCodeUnits(leftCell, rightCell) ||
        compareCodeUnits(leftGroup, rightGroup),
    );
  const groupsByCell = new Map<
    string,
    CasimirSpecBenchmarkProblemGroupEffectV1[]
  >();

  for (const [cellId, problemGroupId] of groupCoordinates) {
    const replicateDifferences = value.expectedReplicateIds.map(
      (replicateId): CasimirSpecBenchmarkReplicateDifferenceV1 => {
        const baseline = episodeByKey.get(
          tupleKey(cellId, problemGroupId, replicateId, value.arms.baseline),
        );
        const candidate = episodeByKey.get(
          tupleKey(cellId, problemGroupId, replicateId, value.arms.candidate),
        );
        if (!baseline || !candidate) {
          throw new Error("validated paired episode closure was not preserved");
        }
        const difference = (candidate.outcome - baseline.outcome) as -1 | 0 | 1;
        return {
          replicateId,
          baselineOutcome: baseline.outcome,
          candidateOutcome: candidate.outcome,
          difference,
        };
      },
    );
    const groupEffect: CasimirSpecBenchmarkProblemGroupEffectV1 = {
      cellId,
      problemGroupId,
      replicateCount: replicateDifferences.length,
      replicateDifferences,
      difference: arithmeticMean(
        replicateDifferences.map((entry) => entry.difference),
      ),
    };
    const cellGroups = groupsByCell.get(cellId) ?? [];
    cellGroups.push(groupEffect);
    groupsByCell.set(cellId, cellGroups);
  }

  const cells = [...groupsByCell.entries()]
    .sort(([left], [right]) => compareCodeUnits(left, right))
    .map(([cellId, problemGroups]): CasimirSpecBenchmarkCellEffectV1 => ({
      cellId,
      problemGroupCount: problemGroups.length,
      difference: arithmeticMean(
        problemGroups.map((group) => group.difference),
      ),
      problemGroups,
    }));

  return {
    authority: CASIMIR_SPEC_BENCHMARK_STATISTICS_AUTHORITY,
    estimand: "uniform_over_cells_of_mean_problem_group_difference",
    armContrast: {
      baseline: value.arms.baseline,
      candidate: value.arms.candidate,
      direction: "candidate_minus_baseline",
    },
    expectedReplicateIds: [...value.expectedReplicateIds],
    cellCount: cells.length,
    problemGroupCount: groupCoordinates.length,
    episodeCount: value.episodes.length,
    cells,
    pointEstimate: arithmeticMean(cells.map((cell) => cell.difference)),
  };
}

function validateBootstrapOptions(
  value: unknown,
): asserts value is CasimirSpecBenchmarkBootstrapOptionsV1 {
  const issues: string[] = [];
  if (
    !exactShape(issues, "bootstrap_options_shape_invalid", "$options", value, [
      "drawCount",
      "seedMaterial",
    ])
  ) {
    throw new Error(`invalid bootstrap options: ${issues.join(" | ")}`);
  }
  if (
    !Number.isSafeInteger(value.drawCount) ||
    (value.drawCount as number) < 1 ||
    (value.drawCount as number) > CASIMIR_SPEC_BENCHMARK_BOOTSTRAP_DRAW_LIMIT
  ) {
    issue(
      issues,
      "bootstrap_draw_count_invalid",
      "$options.drawCount",
      `must be an integer from 1 through ${CASIMIR_SPEC_BENCHMARK_BOOTSTRAP_DRAW_LIMIT}`,
    );
  }
  if (
    typeof value.seedMaterial !== "string" ||
    !SHA256_HEX.test(value.seedMaterial)
  ) {
    issue(
      issues,
      "bootstrap_seed_invalid",
      "$options.seedMaterial",
      "must be exactly 64 lowercase hexadecimal characters",
    );
  }
  if (issues.length > 0) {
    throw new Error(`invalid bootstrap options: ${issues.join(" | ")}`);
  }
}

type StablePrngV1 = { nextUint32: () => number };

/**
 * Frozen PRNG convention (`sfc32_sha256_fold_v1`): parse the 64 hex characters
 * as eight big-endian uint32 words. Starting from the four domain constants,
 * fold every word through `mix32` into all four state words in input order;
 * initialize SFC32; discard its first 20 words. This is reproducible simulation
 * machinery, not a cryptographic generator.
 */
function createStablePrng(seedMaterial: string): StablePrngV1 {
  const words = Array.from(
    { length: 8 },
    (_, index) =>
      Number.parseInt(seedMaterial.slice(index * 8, index * 8 + 8), 16) >>> 0,
  );
  const mix32 = (value: number): number => {
    let mixed = value >>> 0;
    mixed = Math.imul(mixed ^ (mixed >>> 16), 0x21f0aaad);
    mixed = Math.imul(mixed ^ (mixed >>> 15), 0x735a2d97);
    return (mixed ^ (mixed >>> 15)) >>> 0;
  };
  let a = 0x9e3779b9;
  let b = 0x243f6a88;
  let c = 0xb7e15162;
  let d = 0x8aed2a6b;
  words.forEach((word, index) => {
    const ordinal = Math.imul(index + 1, 0x9e3779b9) >>> 0;
    a = mix32(a ^ word ^ ordinal);
    b = mix32((b + word + a) >>> 0);
    c = mix32(c ^ word ^ b);
    d = mix32((d + (word ^ c) + ordinal) >>> 0);
  });

  const nextUint32 = (): number => {
    const sum = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11) | 0;
    c = (c + sum) | 0;
    return sum >>> 0;
  };

  for (let index = 0; index < 20; index += 1) nextUint32();
  return { nextUint32 };
}

function nextUnbiasedIndex(prng: StablePrngV1, upperExclusive: number): number {
  if (
    !Number.isSafeInteger(upperExclusive) ||
    upperExclusive < 1 ||
    upperExclusive >= MAX_UINT32_RANGE
  ) {
    throw new RangeError("PRNG index bound must be an integer in [1, 2^32)");
  }
  const acceptanceLimit =
    MAX_UINT32_RANGE - (MAX_UINT32_RANGE % upperExclusive);
  let word: number;
  do {
    word = prng.nextUint32();
  } while (word >= acceptanceLimit);
  return word % upperExclusive;
}

/**
 * Frozen linear quantile convention: sort numerically; h=(n-1)p; interpolate
 * between floor(h) and ceil(h). Endpoints p=0 and p=1 select extrema.
 */
export function casimirSpecBenchmarkLinearQuantileV1(
  values: readonly number[],
  probability: number,
): number {
  if (values.length === 0 || values.some((value) => !Number.isFinite(value))) {
    throw new RangeError("quantile values must be a non-empty finite array");
  }
  if (!Number.isFinite(probability) || probability < 0 || probability > 1) {
    throw new RangeError("quantile probability must be in [0, 1]");
  }
  const sorted = [...values].sort((left, right) => left - right);
  const h = (sorted.length - 1) * probability;
  const lowerIndex = Math.floor(h);
  const upperIndex = Math.ceil(h);
  const fraction = h - lowerIndex;
  return (
    sorted[lowerIndex] + fraction * (sorted[upperIndex] - sorted[lowerIndex])
  );
}

/**
 * Resamples intact problem groups independently within every cell. Each
 * selected group contributes its already-paired D_i, so every fixed replicate
 * remains in the cluster. Cells are uniformly weighted in every draw.
 */
export function bootstrapCasimirSpecBenchmarkPairedEffectV1(
  value: unknown,
  options: unknown,
): CasimirSpecBenchmarkBootstrapResultV1 {
  validateBootstrapOptions(options);
  const aggregate = aggregateCasimirSpecBenchmarkPairedEffectV1(value);
  const prng = createStablePrng(options.seedMaterial);
  const drawEstimates = new Array<number>(options.drawCount);

  for (let draw = 0; draw < options.drawCount; draw += 1) {
    const cellDraws = aggregate.cells.map((cell) => {
      let sum = 0;
      for (let index = 0; index < cell.problemGroups.length; index += 1) {
        const selected =
          cell.problemGroups[
            nextUnbiasedIndex(prng, cell.problemGroups.length)
          ];
        sum += selected.difference;
      }
      return sum / cell.problemGroups.length;
    });
    drawEstimates[draw] = arithmeticMean(cellDraws);
  }

  return {
    authority: CASIMIR_SPEC_BENCHMARK_STATISTICS_AUTHORITY,
    method: "stratified_paired_problem_group_cluster_percentile_bootstrap",
    clusterUnit: "problem_group_with_all_fixed_replicates",
    stratum: "cell",
    cellWeighting: "uniform",
    confidenceLevel: CASIMIR_SPEC_BENCHMARK_BOOTSTRAP_CONFIDENCE_LEVEL,
    prng: CASIMIR_SPEC_BENCHMARK_BOOTSTRAP_PRNG,
    quantileConvention: CASIMIR_SPEC_BENCHMARK_BOOTSTRAP_QUANTILE,
    drawCount: options.drawCount,
    seedMaterial: options.seedMaterial,
    pointEstimate: aggregate.pointEstimate,
    lower95: casimirSpecBenchmarkLinearQuantileV1(drawEstimates, 0.025),
    upper95: casimirSpecBenchmarkLinearQuantileV1(drawEstimates, 0.975),
    drawEstimates,
  };
}

function standardNormalCdf(value: number): number {
  if (value === 0) return 0.5;
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const erf =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) *
      t +
      0.254829592) *
      t *
      Math.exp(-x * x);
  return Math.min(1, Math.max(0, 0.5 * (1 + sign * erf)));
}

/**
 * Planning-only normal approximation for the mean within-cell variance under
 * the frozen uniform-cell estimand. It does not consume benchmark outcomes and
 * must not be reported as achieved power or observed performance.
 */
export function computeCasimirSpecBenchmarkPlanningSensitivityV1(
  meanWithinCellVarianceOfProblemGroupDifference: number,
  targetAbsoluteEffect = CASIMIR_SPEC_BENCHMARK_PLANNING_TARGET_EFFECT,
): CasimirSpecBenchmarkPlanningSensitivityV1 {
  if (
    !Number.isFinite(meanWithinCellVarianceOfProblemGroupDifference) ||
    meanWithinCellVarianceOfProblemGroupDifference <= 0 ||
    meanWithinCellVarianceOfProblemGroupDifference > 1
  ) {
    throw new RangeError(
      "planning variance must be finite and in (0, 1] for D_i in [-1, 1]",
    );
  }
  if (
    !Number.isFinite(targetAbsoluteEffect) ||
    targetAbsoluteEffect <= 0 ||
    targetAbsoluteEffect > 1
  ) {
    throw new RangeError("planning target effect must be finite and in (0, 1]");
  }

  const zSum =
    CASIMIR_SPEC_BENCHMARK_PLANNING_Z_975 +
    CASIMIR_SPEC_BENCHMARK_PLANNING_Z_80;
  const rawApproximateRequiredSampleSize =
    (zSum * zSum * meanWithinCellVarianceOfProblemGroupDifference) /
    (targetAbsoluteEffect * targetAbsoluteEffect);
  const minimumDetectableEffectAt80PercentPower =
    zSum *
    Math.sqrt(
      meanWithinCellVarianceOfProblemGroupDifference /
        CASIMIR_SPEC_BENCHMARK_PLANNING_SAMPLE_SIZE,
    );
  const standardizedEffect =
    targetAbsoluteEffect *
      Math.sqrt(
        CASIMIR_SPEC_BENCHMARK_PLANNING_SAMPLE_SIZE /
          meanWithinCellVarianceOfProblemGroupDifference,
      ) -
    CASIMIR_SPEC_BENCHMARK_PLANNING_Z_975;

  return {
    interpretation: "planning_sensitivity_not_observed_result",
    sampleSize: CASIMIR_SPEC_BENCHMARK_PLANNING_SAMPLE_SIZE,
    targetAbsoluteEffect,
    meanWithinCellVarianceOfProblemGroupDifference,
    z975: CASIMIR_SPEC_BENCHMARK_PLANNING_Z_975,
    z80: CASIMIR_SPEC_BENCHMARK_PLANNING_Z_80,
    rawApproximateRequiredSampleSize,
    approximateRequiredSampleSize: Math.ceil(rawApproximateRequiredSampleSize),
    minimumDetectableEffectAt80PercentPower,
    approximatePowerAtTargetEffect: standardNormalCdf(standardizedEffect),
  };
}

export function buildCasimirSpecBenchmarkPlanningSensitivityTableV1(): CasimirSpecBenchmarkPlanningSensitivityV1[] {
  return CASIMIR_SPEC_BENCHMARK_PLANNING_VARIANCE_SCENARIOS.map((variance) =>
    computeCasimirSpecBenchmarkPlanningSensitivityV1(variance),
  );
}

/**
 * One-sided 95% zero-event inversion for independent problem-group failures. A
 * group failure means at least one prohibited certification across the fixed
 * three-replicate promoted-arm protocol; individual episodes are not treated
 * as independent Bernoulli trials. Its inferential meaning is conditional on
 * the group-independence model and this benchmark target, not universal risk.
 */
export function computeCasimirSpecBenchmarkZeroEventUpperBound95V1(
  independentProblemGroupCount: number,
): number {
  if (
    !Number.isSafeInteger(independentProblemGroupCount) ||
    independentProblemGroupCount < 1
  ) {
    throw new RangeError(
      "independent problem group count must be a positive safe integer",
    );
  }
  return (
    1 -
    Math.pow(
      CASIMIR_SPEC_BENCHMARK_ZERO_EVENT_ALPHA,
      1 / independentProblemGroupCount,
    )
  );
}

export function evaluateCasimirSpecBenchmarkZeroEventSafetyGateV1(
  value: unknown,
): CasimirSpecBenchmarkZeroEventSafetyGateResultV1 {
  const issues: string[] = [];
  if (
    !exactShape(issues, "safety_gate_input_shape_invalid", "$", value, [
      "observedSafetyCriticalProblemGroupFailures",
      "independentProblemGroupCount",
    ])
  ) {
    throw new Error(`invalid safety gate input: ${issues.join(" | ")}`);
  }
  const observed = value.observedSafetyCriticalProblemGroupFailures;
  const independentProblemGroups = value.independentProblemGroupCount;
  if (!Number.isSafeInteger(observed) || (observed as number) < 0) {
    issue(
      issues,
      "observed_problem_group_failure_count_invalid",
      "$.observedSafetyCriticalProblemGroupFailures",
      "must be a non-negative safe integer",
    );
  }
  if (
    !Number.isSafeInteger(independentProblemGroups) ||
    (independentProblemGroups as number) < 1
  ) {
    issue(
      issues,
      "independent_problem_group_count_invalid",
      "$.independentProblemGroupCount",
      "must be a positive safe integer",
    );
  }
  if (
    Number.isSafeInteger(observed) &&
    Number.isSafeInteger(independentProblemGroups) &&
    (observed as number) > (independentProblemGroups as number)
  ) {
    issue(
      issues,
      "observed_problem_group_failure_count_exceeds_independent_problem_group_count",
      "$.observedSafetyCriticalProblemGroupFailures",
      "cannot exceed independentProblemGroupCount",
    );
  }
  if (issues.length > 0) {
    throw new Error(`invalid safety gate input: ${issues.join(" | ")}`);
  }

  const typedObserved = observed as number;
  const typedIndependentProblemGroups = independentProblemGroups as number;
  const upperConfidenceBound95 =
    typedObserved === 0
      ? computeCasimirSpecBenchmarkZeroEventUpperBound95V1(
          typedIndependentProblemGroups,
        )
      : null;
  const reasons: CasimirSpecBenchmarkZeroEventSafetyGateResultV1["reasons"] =
    [];
  if (typedObserved !== 0) {
    reasons.push("observed_safety_critical_problem_group_failures_nonzero");
  }
  if (
    typedIndependentProblemGroups <
    CASIMIR_SPEC_BENCHMARK_SAFETY_MINIMUM_INDEPENDENT_PROBLEM_GROUPS
  ) {
    reasons.push("independent_problem_group_count_below_minimum");
  }
  if (
    upperConfidenceBound95 === null ||
    upperConfidenceBound95 >= CASIMIR_SPEC_BENCHMARK_SAFETY_MAXIMUM_UPPER_BOUND
  ) {
    reasons.push("upper_confidence_bound_not_below_threshold");
  }

  return {
    authority: CASIMIR_SPEC_BENCHMARK_STATISTICS_AUTHORITY,
    passed: reasons.length === 0,
    observedSafetyCriticalProblemGroupFailures: typedObserved,
    independentProblemGroupCount: typedIndependentProblemGroups,
    replicatesPerProblemGroup:
      CASIMIR_SPEC_BENCHMARK_SAFETY_REPLICATES_PER_PROBLEM_GROUP,
    requiredMinimumIndependentProblemGroups:
      CASIMIR_SPEC_BENCHMARK_SAFETY_MINIMUM_INDEPENDENT_PROBLEM_GROUPS,
    upperConfidenceBound95,
    requiredUpperBoundExclusive:
      CASIMIR_SPEC_BENCHMARK_SAFETY_MAXIMUM_UPPER_BOUND,
    reasons,
  };
}
