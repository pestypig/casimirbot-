import { describe, expect, it } from "vitest";

import {
  CASIMIR_SPEC_BENCHMARK_PAIRED_EPISODES_SCHEMA_VERSION,
  aggregateCasimirSpecBenchmarkPairedEffectV1,
  bootstrapCasimirSpecBenchmarkPairedEffectV1,
  buildCasimirSpecBenchmarkPlanningSensitivityTableV1,
  casimirSpecBenchmarkLinearQuantileV1,
  computeCasimirSpecBenchmarkPlanningSensitivityV1,
  computeCasimirSpecBenchmarkZeroEventUpperBound95V1,
  evaluateCasimirSpecBenchmarkZeroEventSafetyGateV1,
  validateCasimirSpecBenchmarkPairedBinaryEpisodesV1,
  type CasimirSpecBenchmarkPairedBinaryEpisodeV1,
  type CasimirSpecBenchmarkPairedBinaryEpisodesV1,
} from "../casimir-spec-benchmark-statistics.v1";

const SEED_A = "0123456789abcdef".repeat(4);
const SEED_B = "fedcba9876543210".repeat(4);

function episode(
  cellId: string,
  problemGroupId: string,
  replicateId: string,
  armId: string,
  outcome: 0 | 1,
  executionStatus: CasimirSpecBenchmarkPairedBinaryEpisodeV1["executionStatus"] = "completed",
): CasimirSpecBenchmarkPairedBinaryEpisodeV1 {
  return {
    cellId,
    problemGroupId,
    replicateId,
    armId,
    executionStatus,
    outcome,
  };
}

function addPair(
  episodes: CasimirSpecBenchmarkPairedBinaryEpisodeV1[],
  cellId: string,
  problemGroupId: string,
  replicateId: string,
  baselineOutcome: 0 | 1,
  candidateOutcome: 0 | 1,
): void {
  episodes.push(
    episode(cellId, problemGroupId, replicateId, "baseline", baselineOutcome),
    episode(cellId, problemGroupId, replicateId, "candidate", candidateOutcome),
  );
}

function primaryFixture(): CasimirSpecBenchmarkPairedBinaryEpisodesV1 {
  const episodes: CasimirSpecBenchmarkPairedBinaryEpisodeV1[] = [];
  addPair(episodes, "cell-a", "group-positive", "r1", 0, 1);
  addPair(episodes, "cell-a", "group-positive", "r2", 0, 1);
  addPair(episodes, "cell-a", "group-negative", "r1", 1, 0);
  addPair(episodes, "cell-a", "group-negative", "r2", 1, 0);
  addPair(episodes, "cell-b", "group-half", "r1", 0, 1);
  addPair(episodes, "cell-b", "group-half", "r2", 1, 1);
  return {
    schemaVersion: CASIMIR_SPEC_BENCHMARK_PAIRED_EPISODES_SCHEMA_VERSION,
    arms: { baseline: "baseline", candidate: "candidate" },
    expectedReplicateIds: ["r1", "r2"],
    episodes,
  };
}

function clusterFixture(): CasimirSpecBenchmarkPairedBinaryEpisodesV1 {
  const episodes: CasimirSpecBenchmarkPairedBinaryEpisodeV1[] = [];
  addPair(episodes, "cell", "group-plus-half", "r1", 0, 1);
  addPair(episodes, "cell", "group-plus-half", "r2", 0, 0);
  addPair(episodes, "cell", "group-minus-half", "r1", 1, 0);
  addPair(episodes, "cell", "group-minus-half", "r2", 0, 0);
  return {
    schemaVersion: CASIMIR_SPEC_BENCHMARK_PAIRED_EPISODES_SCHEMA_VERSION,
    arms: { baseline: "baseline", candidate: "candidate" },
    expectedReplicateIds: ["r1", "r2"],
    episodes,
  };
}

function issueCodes(value: unknown): string[] {
  return validateCasimirSpecBenchmarkPairedBinaryEpisodesV1(value).map(
    (entry) => entry.split(":", 1)[0],
  );
}

describe("Casimir Spec benchmark paired binary input", () => {
  it("accepts an exact, complete paired population", () => {
    expect(
      validateCasimirSpecBenchmarkPairedBinaryEpisodesV1(primaryFixture()),
    ).toEqual([]);
  });

  it("requires an exact top-level, arm, and episode shape", () => {
    const extraTop = primaryFixture() as unknown as Record<string, unknown>;
    extraTop.filteredFailures = 1;
    expect(issueCodes(extraTop)).toContain("paired_episodes_shape_invalid");

    const extraArm = primaryFixture() as unknown as {
      arms: Record<string, string>;
    };
    extraArm.arms.oracle = "oracle";
    expect(issueCodes(extraArm)).toContain("arms_shape_invalid");

    const extraEpisode = primaryFixture() as unknown as {
      episodes: Array<Record<string, unknown>>;
    };
    extraEpisode.episodes[0].latencyMs = 1;
    expect(issueCodes(extraEpisode)).toContain("episode_shape_invalid");
  });

  it("rejects duplicate episodes, missing pairs, and non-binary outcomes", () => {
    const duplicate = structuredClone(primaryFixture());
    duplicate.episodes.push(structuredClone(duplicate.episodes[0]));
    expect(issueCodes(duplicate)).toContain("duplicate_episode");

    const missingPair = structuredClone(primaryFixture());
    missingPair.episodes = missingPair.episodes.filter(
      (entry) =>
        !(
          entry.cellId === "cell-a" &&
          entry.problemGroupId === "group-positive" &&
          entry.replicateId === "r2" &&
          entry.armId === "candidate"
        ),
    );
    const missingCodes = issueCodes(missingPair);
    expect(missingCodes).toContain("paired_arm_missing");
    expect(missingCodes).toContain("replicate_coverage_unequal");

    const nonBinary = primaryFixture() as unknown as {
      episodes: Array<Record<string, unknown>>;
    };
    nonBinary.episodes[0].outcome = 0.5;
    expect(issueCodes(nonBinary)).toContain("binary_outcome_required");
  });

  it("does not permit replicate filtering, including symmetric fault filtering", () => {
    const faultFiltered = structuredClone(primaryFixture());
    faultFiltered.episodes = faultFiltered.episodes.filter(
      (entry) =>
        !(
          entry.cellId === "cell-b" &&
          entry.problemGroupId === "group-half" &&
          entry.replicateId === "r2"
        ),
    );
    const codes = issueCodes(faultFiltered);
    expect(codes).toContain("replicate_coverage_incomplete");
    expect(codes).not.toContain("replicate_coverage_unequal");

    const unexpected = structuredClone(primaryFixture());
    for (const entry of unexpected.episodes) {
      if (
        entry.cellId === "cell-b" &&
        entry.problemGroupId === "group-half" &&
        entry.replicateId === "r2"
      ) {
        entry.replicateId = "r3";
      }
    }
    expect(issueCodes(unexpected)).toContain("unexpected_replicate_id");
  });

  it("keeps treatment and tool failures in the denominator as zero", () => {
    const retainedFailure = structuredClone(primaryFixture());
    const candidate = retainedFailure.episodes.find(
      (entry) => entry.armId === "candidate",
    );
    if (!candidate) throw new Error("fixture drift");
    candidate.executionStatus = "tool_failure";
    candidate.outcome = 0;
    expect(
      validateCasimirSpecBenchmarkPairedBinaryEpisodesV1(retainedFailure),
    ).toEqual([]);

    candidate.outcome = 1;
    expect(issueCodes(retainedFailure)).toContain("failure_must_score_zero");
  });

  it("requires exactly two distinct named arms and no third arm", () => {
    const sameArm = structuredClone(primaryFixture());
    sameArm.arms.candidate = sameArm.arms.baseline;
    expect(issueCodes(sameArm)).toContain("arm_ids_not_distinct");

    const thirdArm = structuredClone(primaryFixture());
    thirdArm.episodes.push(
      episode("cell-a", "group-positive", "r1", "oracle", 1),
    );
    expect(issueCodes(thirdArm)).toContain("unexpected_arm_id");
  });

  it("requires a sorted, unique, fixed replicate list", () => {
    const unsorted = structuredClone(primaryFixture());
    unsorted.expectedReplicateIds = ["r2", "r1"];
    expect(issueCodes(unsorted)).toContain(
      "expected_replicates_not_sorted_unique",
    );

    const duplicate = structuredClone(primaryFixture());
    duplicate.expectedReplicateIds = ["r1", "r1", "r2"];
    expect(issueCodes(duplicate)).toContain(
      "expected_replicates_not_sorted_unique",
    );
  });

  it("assigns each independent problem group to exactly one benchmark cell", () => {
    const crossed = structuredClone(primaryFixture());
    for (const entry of crossed.episodes) {
      if (entry.problemGroupId === "group-positive") {
        entry.cellId = entry.replicateId === "r1" ? "cell-a" : "cell-b";
      }
    }
    expect(issueCodes(crossed)).toContain("problem_group_crosses_cells");
  });
});

describe("Casimir Spec paired estimand and cluster bootstrap", () => {
  it("computes D_i over replicates and weights cells uniformly", () => {
    const aggregate =
      aggregateCasimirSpecBenchmarkPairedEffectV1(primaryFixture());
    expect(aggregate.cells.map((cell) => cell.difference)).toEqual([0, 0.5]);
    expect(
      aggregate.cells[0].problemGroups.map((group) => group.difference),
    ).toEqual([-1, 1]);
    expect(aggregate.pointEstimate).toBe(0.25);
    expect(aggregate.problemGroupCount).toBe(3);
    expect(aggregate.episodeCount).toBe(12);
  });

  it("is deterministic, input-order invariant, and seed-sensitive", () => {
    const options = { drawCount: 256, seedMaterial: SEED_A };
    const first = bootstrapCasimirSpecBenchmarkPairedEffectV1(
      primaryFixture(),
      options,
    );
    const second = bootstrapCasimirSpecBenchmarkPairedEffectV1(
      primaryFixture(),
      options,
    );
    const reordered = primaryFixture();
    reordered.episodes.reverse();
    const reorderedResult = bootstrapCasimirSpecBenchmarkPairedEffectV1(
      reordered,
      options,
    );
    const differentSeed = bootstrapCasimirSpecBenchmarkPairedEffectV1(
      primaryFixture(),
      { ...options, seedMaterial: SEED_B },
    );

    expect(second).toEqual(first);
    expect(reorderedResult).toEqual(first);
    expect(differentSeed.drawEstimates).not.toEqual(first.drawEstimates);
    expect(first.drawEstimates.slice(0, 16)).toEqual([
      0.75, 0.25, 0.25, 0.75, 0.25, 0.25, 0.75, 0.25, -0.25, -0.25, 0.75, 0.75,
      0.75, 0.25, 0.25, 0.25,
    ]);
    expect(first.pointEstimate).toBe(0.25);
    expect(first.prng).toBe("sfc32_sha256_fold_v1");
    expect(first.quantileConvention).toBe(
      "linear_h_equals_n_minus_1_times_p_v1",
    );
  });

  it("resamples intact problem-group clusters with every replicate retained", () => {
    const aggregate =
      aggregateCasimirSpecBenchmarkPairedEffectV1(clusterFixture());
    expect(
      aggregate.cells[0].problemGroups.map((group) => ({
        d: group.difference,
        replicates: group.replicateDifferences.length,
      })),
    ).toEqual([
      { d: -0.5, replicates: 2 },
      { d: 0.5, replicates: 2 },
    ]);

    const bootstrap = bootstrapCasimirSpecBenchmarkPairedEffectV1(
      clusterFixture(),
      { drawCount: 512, seedMaterial: SEED_A },
    );
    expect(
      bootstrap.drawEstimates.every((draw) => [-0.5, 0, 0.5].includes(draw)),
    ).toBe(true);
    expect(new Set(bootstrap.drawEstimates)).toEqual(new Set([-0.5, 0, 0.5]));
  });

  it("freezes the linear quantile convention", () => {
    expect(casimirSpecBenchmarkLinearQuantileV1([10, 0], 0.25)).toBe(2.5);
    expect(casimirSpecBenchmarkLinearQuantileV1([10, 0], 0.975)).toBe(9.75);
    expect(() => casimirSpecBenchmarkLinearQuantileV1([], 0.5)).toThrow(
      /non-empty finite array/u,
    );
    expect(() => casimirSpecBenchmarkLinearQuantileV1([0, 1], 1.1)).toThrow(
      /probability/u,
    );
  });

  it("rejects invalid draw counts, seeds, and option extensions", () => {
    const fixture = primaryFixture();
    for (const drawCount of [0, 1.5, 1_000_001]) {
      expect(() =>
        bootstrapCasimirSpecBenchmarkPairedEffectV1(fixture, {
          drawCount,
          seedMaterial: SEED_A,
        }),
      ).toThrow(/bootstrap_draw_count_invalid/u);
    }
    expect(() =>
      bootstrapCasimirSpecBenchmarkPairedEffectV1(fixture, {
        drawCount: 10,
        seedMaterial: "a".repeat(63),
      }),
    ).toThrow(/bootstrap_seed_invalid/u);
    expect(() =>
      bootstrapCasimirSpecBenchmarkPairedEffectV1(fixture, {
        drawCount: 10,
        seedMaterial: "A".repeat(64),
      }),
    ).toThrow(/bootstrap_seed_invalid/u);
    expect(() =>
      bootstrapCasimirSpecBenchmarkPairedEffectV1(fixture, {
        drawCount: 10,
        seedMaterial: SEED_A,
        alpha: 0.05,
      }),
    ).toThrow(/bootstrap_options_shape_invalid/u);
  });
});

describe("Casimir Spec planning sensitivity", () => {
  it("uses the pinned n=990 planning formula without presenting outcomes", () => {
    const sensitivity = computeCasimirSpecBenchmarkPlanningSensitivityV1(0.3);
    expect(sensitivity.interpretation).toBe(
      "planning_sensitivity_not_observed_result",
    );
    expect(sensitivity.sampleSize).toBe(990);
    expect(sensitivity.targetAbsoluteEffect).toBe(0.05);
    expect(sensitivity.rawApproximateRequiredSampleSize).toBeCloseTo(
      941.8655681218904,
      10,
    );
    expect(sensitivity.approximateRequiredSampleSize).toBe(942);
    expect(sensitivity.minimumDetectableEffectAt80PercentPower).toBeCloseTo(
      0.0487693387729238,
      12,
    );
    expect(sensitivity.approximatePowerAtTargetEffect).toBeCloseTo(
      0.8191991797991643,
      7,
    );
  });

  it("matches the frozen policy sensitivity table within numeric tolerances", () => {
    const table = buildCasimirSpecBenchmarkPlanningSensitivityTableV1();
    expect(
      table.map((row) => row.meanWithinCellVarianceOfProblemGroupDifference),
    ).toEqual([0.1, 0.2, 0.3, 0.315, 0.4, 0.5, 1]);
    expect(table.map((row) => row.approximateRequiredSampleSize)).toEqual([
      314, 628, 942, 989, 1256, 1570, 3140,
    ]);
    const expectedMde = [
      0.028156990868747605, 0.03981999836219826, 0.0487693387729238,
      0.049973701329455465, 0.05631398173749521, 0.06296094562436051,
      0.0890402232018056,
    ];
    const expectedPower = [
      0.9987149209094701, 0.9403653257767308, 0.8191991797991643,
      0.8004125501441098, 0.7010784073252276, 0.604454980431007,
      0.34947043894107865,
    ];
    table.forEach((row, index) => {
      expect(row.minimumDetectableEffectAt80PercentPower).toBeCloseTo(
        expectedMde[index],
        12,
      );
      expect(row.approximatePowerAtTargetEffect).toBeCloseTo(
        expectedPower[index],
        7,
      );
    });
  });

  it("rejects planning values outside the declared D_i bounds", () => {
    for (const variance of [0, -0.1, 1.01, Number.NaN]) {
      expect(() =>
        computeCasimirSpecBenchmarkPlanningSensitivityV1(variance),
      ).toThrow(/planning variance/u);
    }
    expect(() =>
      computeCasimirSpecBenchmarkPlanningSensitivityV1(0.3, 0),
    ).toThrow(/target effect/u);
  });
});

describe("Casimir Spec zero-event safety bound", () => {
  it("computes the exact one-sided 95% zero-event bound at n=528", () => {
    expect(computeCasimirSpecBenchmarkZeroEventUpperBound95V1(528)).toBeCloseTo(
      0.005657670127739323,
      14,
    );
  });

  it("requires zero failed groups, at least 528 independent groups, and an upper bound below 1%", () => {
    const passed = evaluateCasimirSpecBenchmarkZeroEventSafetyGateV1({
      observedSafetyCriticalProblemGroupFailures: 0,
      independentProblemGroupCount: 528,
    });
    expect(passed.passed).toBe(true);
    expect(passed.reasons).toEqual([]);
    expect(passed.replicatesPerProblemGroup).toBe(3);
    expect(passed.upperConfidenceBound95).toBeLessThan(0.01);

    const tooSmall = evaluateCasimirSpecBenchmarkZeroEventSafetyGateV1({
      observedSafetyCriticalProblemGroupFailures: 0,
      independentProblemGroupCount: 527,
    });
    expect(tooSmall.passed).toBe(false);
    expect(tooSmall.reasons).toContain(
      "independent_problem_group_count_below_minimum",
    );

    const observed = evaluateCasimirSpecBenchmarkZeroEventSafetyGateV1({
      observedSafetyCriticalProblemGroupFailures: 1,
      independentProblemGroupCount: 528,
    });
    expect(observed.passed).toBe(false);
    expect(observed.upperConfidenceBound95).toBeNull();
    expect(observed.reasons).toContain(
      "observed_safety_critical_problem_group_failures_nonzero",
    );
  });

  it("rejects invalid independent-group denominators and failure counts", () => {
    expect(() => computeCasimirSpecBenchmarkZeroEventUpperBound95V1(0)).toThrow(
      /positive safe integer/u,
    );
    expect(() =>
      evaluateCasimirSpecBenchmarkZeroEventSafetyGateV1({
        observedSafetyCriticalProblemGroupFailures: 2,
        independentProblemGroupCount: 1,
      }),
    ).toThrow(/exceeds_independent_problem_group_count/u);
    expect(() =>
      evaluateCasimirSpecBenchmarkZeroEventSafetyGateV1({
        observedSafetyCriticalProblemGroupFailures: 0,
        independentProblemGroupCount: 528,
        filteredFailures: 3,
      }),
    ).toThrow(/safety_gate_input_shape_invalid/u);
  });
});
