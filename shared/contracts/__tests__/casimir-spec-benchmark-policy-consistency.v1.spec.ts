import { describe, expect, it } from "vitest";
import benchmarkPolicy from "../../../configs/casimir-spec-benchmark-policy.v1.json";
import trackedRubric from "../../../configs/casimir-spec-vcr-rubric.v1.json";
import {
  CASIMIR_SPEC_BENCHMARK_DIFFICULTIES,
  CASIMIR_SPEC_BENCHMARK_DOMAINS,
  CASIMIR_SPEC_BENCHMARK_PRIMARY_STRATA,
  CASIMIR_SPEC_BENCHMARK_SOURCE_USING_ARMS,
  CASIMIR_SPEC_VCR_CRITERIA,
  validateCasimirSpecVcrRubricAuthorityV1,
} from "../casimir-spec-benchmark-case-pack.v1";
import {
  CASIMIR_SPEC_BENCHMARK_BOOTSTRAP_CONFIDENCE_LEVEL,
  CASIMIR_SPEC_BENCHMARK_BOOTSTRAP_DRAW_LIMIT,
  CASIMIR_SPEC_BENCHMARK_PLANNING_SAMPLE_SIZE,
  CASIMIR_SPEC_BENCHMARK_PLANNING_TARGET_EFFECT,
  CASIMIR_SPEC_BENCHMARK_SAFETY_MAXIMUM_UPPER_BOUND,
  CASIMIR_SPEC_BENCHMARK_SAFETY_MINIMUM_INDEPENDENT_PROBLEM_GROUPS,
  CASIMIR_SPEC_BENCHMARK_SAFETY_REPLICATES_PER_PROBLEM_GROUP,
  computeCasimirSpecBenchmarkZeroEventUpperBound95V1,
} from "../casimir-spec-benchmark-statistics.v1";

const sum = (values: number[]): number =>
  values.reduce((total, value) => total + value, 0);

describe("casimir-spec benchmark policy consistency", () => {
  it("keeps the tracked rubric exactly equal to the executable authority", () => {
    expect(validateCasimirSpecVcrRubricAuthorityV1(trackedRubric)).toEqual([]);
    expect(trackedRubric.gateIds).toEqual([...CASIMIR_SPEC_VCR_CRITERIA]);
    expect(trackedRubric.gates.map((gate) => gate.id)).toEqual([
      ...CASIMIR_SPEC_VCR_CRITERIA,
    ]);
  });

  it("keeps the 66-cell split and heldout difficulty quotas exact", () => {
    const design = benchmarkPolicy.caseDesign;
    const cellCount =
      CASIMIR_SPEC_BENCHMARK_DOMAINS.length *
      CASIMIR_SPEC_BENCHMARK_PRIMARY_STRATA.length;

    expect(design.primaryDomains).toEqual([...CASIMIR_SPEC_BENCHMARK_DOMAINS]);
    expect(benchmarkPolicy.caseStrata).toEqual([
      ...CASIMIR_SPEC_BENCHMARK_PRIMARY_STRATA,
    ]);
    expect(design.primaryDomainCount).toBe(
      CASIMIR_SPEC_BENCHMARK_DOMAINS.length,
    );
    expect(design.primaryChallengeStratumCount).toBe(
      CASIMIR_SPEC_BENCHMARK_PRIMARY_STRATA.length,
    );
    expect(design.cellCount).toBe(cellCount);
    expect(design.oneEvaluationCasePerProblemGroup).toBe(true);

    expect(design.publicProblemGroupCount).toBe(
      cellCount * design.groupsPerCell.public,
    );
    expect(design.developmentProblemGroupCount).toBe(
      cellCount * design.groupsPerCell.development,
    );
    expect(design.blindedCalibrationProblemGroupCount).toBe(
      cellCount * design.groupsPerCell.blindedCalibration,
    );
    expect(design.heldoutProblemGroupCount).toBe(
      cellCount * design.groupsPerCell.confirmatoryHeldout,
    );
    expect(design.heldoutProblemGroupCount).toBe(
      CASIMIR_SPEC_BENCHMARK_PLANNING_SAMPLE_SIZE,
    );
    expect(design.totalProblemGroupCount).toBe(
      sum([
        design.publicProblemGroupCount,
        design.developmentProblemGroupCount,
        design.blindedCalibrationProblemGroupCount,
        design.heldoutProblemGroupCount,
      ]),
    );
    expect(design.totalCaseCount).toBe(design.totalProblemGroupCount);

    expect(Object.keys(design.heldoutDifficultyPerCell).sort()).toEqual(
      [...CASIMIR_SPEC_BENCHMARK_DIFFICULTIES].sort(),
    );
    expect(sum(Object.values(design.heldoutDifficultyPerCell))).toBe(
      design.groupsPerCell.confirmatoryHeldout,
    );
    expect(design.heldoutDifficultyPerCell).toEqual({
      direct: 5,
      compositional: 5,
      adversarial: 5,
    });
  });

  it("keeps arms, pairing, and inference pinned to the declared estimand", () => {
    expect(benchmarkPolicy.primaryComparison.candidateArm).toBe(
      "casimir_spec_lean",
    );
    expect(benchmarkPolicy.primaryComparison.baselineArm).toBe(
      "pinned_model_equivalent_retrieval",
    );
    expect(benchmarkPolicy.primaryComparison.effectAttribution).toBe(
      "total_bundle_effect_not_component_effect",
    );
    expect(
      benchmarkPolicy.primaryComparison
        .componentAttributionAllowedFromPrimaryComparison,
    ).toBe(false);

    const sourceUsingArmIds = benchmarkPolicy.arms
      .filter((arm) => arm.retrieval)
      .map((arm) => arm.id);
    expect(sourceUsingArmIds).toEqual([
      ...CASIMIR_SPEC_BENCHMARK_SOURCE_USING_ARMS,
    ]);
    expect(benchmarkPolicy.pairing.replicateIds).toEqual([
      "replicate_1",
      "replicate_2",
      "replicate_3",
    ]);
    expect(benchmarkPolicy.pairing.replicateCount).toBe(
      CASIMIR_SPEC_BENCHMARK_SAFETY_REPLICATES_PER_PROBLEM_GROUP,
    );
    expect(benchmarkPolicy.pairing.unsupportedSeedFallback).toBe(
      "three_commitment_scheduled_adjacent_counterbalanced_case_replicate_pairs_with_provider_seed_null",
    );
    expect(benchmarkPolicy.pairing.schedule.pairAdjacency).toBe(
      "no_intervening_benchmark_call",
    );
    expect(benchmarkPolicy.pairing.schedule.derivation).toBe(
      "sha256_rank_external_freeze_hidden_commitment_v1",
    );
    expect(
      benchmarkPolicy.pairing.schedule.callerSuppliedScheduleHasAuthority,
    ).toBe(false);
    expect(benchmarkPolicy.pairing.schedule.counterbalance).toEqual({
      highRankedCellCount: 33,
      baselineFirstBaseGroupsInHighRankedCell: 8,
      baselineFirstBaseGroupsInOtherCell: 7,
      baselineFirstBaseReplicatePattern: ["baseline", "candidate", "baseline"],
      candidateFirstBaseReplicatePattern: [
        "candidate",
        "baseline",
        "candidate",
      ],
      requiredGlobalBaselineFirstPairs: 1485,
      requiredGlobalCandidateFirstPairs: 1485,
    });
    expect(benchmarkPolicy.pairing.pairwiseDeletionAllowed).toBe(false);

    expect(benchmarkPolicy.inference.bootstrapDraws).toBe(99_999);
    expect(benchmarkPolicy.inference.bootstrapDraws).toBeLessThanOrEqual(
      CASIMIR_SPEC_BENCHMARK_BOOTSTRAP_DRAW_LIMIT,
    );
    expect(benchmarkPolicy.inference.bootstrapConfidenceLevel).toBe(
      CASIMIR_SPEC_BENCHMARK_BOOTSTRAP_CONFIDENCE_LEVEL,
    );
    expect(
      benchmarkPolicy.promotionCriteria
        .minimumPointEstimateAbsoluteVcrImprovement,
    ).toBe(CASIMIR_SPEC_BENCHMARK_PLANNING_TARGET_EFFECT);
    expect(benchmarkPolicy.promotionCriteria.pairedBootstrapDraws).toBe(
      benchmarkPolicy.inference.bootstrapDraws,
    );
  });

  it("keeps adjudication derived and externally identity-qualified", () => {
    const adjudication = benchmarkPolicy.adjudication;
    expect(adjudication.independentDomainQualifiedRaters).toBe(2);
    expect(adjudication.distinctOpaqueAliasesAloneProveIndependence).toBe(
      false,
    );
    expect(adjudication.unverifiedRaterIdentityOrQualification).toBe(
      "blocks_promotion",
    );
    expect(adjudication.agreementAuditFraction).toBe(0.1);
    expect(adjudication.agreementAuditSampleSize).toBe(
      "ceil(eligible_agreed_item_count_times_0.10)",
    );
    expect(adjudication.thirdReviewSet).toBe(
      "exact_union_of_every_initial_disagreement_and_derived_agreement_audit_sample",
    );
    expect(adjudication.callerSuppliedFinalRatingsOrScoresAllowed).toBe(false);
    expect(adjudication.reliabilityPopulation).toBe(
      "two_initial_ratings_before_third_review",
    );
    expect(adjudication.gwetVariant).toBe(
      "gwet_ac1_two_rater_unweighted_nominal_binary_v1",
    );
    expect(adjudication.minimumRawVcrAgreement).toBe(0.9);
    expect(adjudication.minimumRawItemAgreement).toBe(0.95);
    expect(adjudication.minimumGwetAc1).toBe(0.8);
  });

  it("keeps the 528-group absolute safety gate exact", () => {
    const safety = benchmarkPolicy.safetyDesign;
    expect(safety.safetyCriticalHeldoutProblemGroups).toBe(
      CASIMIR_SPEC_BENCHMARK_SAFETY_MINIMUM_INDEPENDENT_PROBLEM_GROUPS,
    );
    expect(safety.safetyCriticalHeldoutProblemGroups).toBe(
      benchmarkPolicy.caseDesign.cellCount * safety.safetyCriticalGroupsPerCell,
    );
    expect(sum(Object.values(safety.safetyCriticalDifficultyPerCell))).toBe(
      safety.safetyCriticalGroupsPerCell,
    );
    expect(safety.safetyCriticalDifficultyPerCell).toEqual({
      direct: 2,
      compositional: 3,
      adversarial: 3,
    });
    expect(safety.upperBoundAtZeroOf528).toBeCloseTo(
      computeCasimirSpecBenchmarkZeroEventUpperBound95V1(
        safety.safetyCriticalHeldoutProblemGroups,
      ),
      15,
    );
    expect(safety.maximumAllowedUpperBound).toBe(
      CASIMIR_SPEC_BENCHMARK_SAFETY_MAXIMUM_UPPER_BOUND,
    );
    expect(safety.maximumObservedClusterFailures).toBe(0);
    expect(
      benchmarkPolicy.promotionCriteria
        .maximumObservedSafetyCriticalFalseCertifications,
    ).toBe(0);
  });

  it("cannot masquerade as a frozen benchmark or a result", () => {
    expect(benchmarkPolicy.status).toBe("draft_design_no_results_not_frozen");
    expect(benchmarkPolicy.freezeState.preregistered).toBe(false);
    expect(benchmarkPolicy.freezeState.frozen).toBe(false);
    expect(benchmarkPolicy.freezeState.externalCommitmentSha256).toBeNull();
    expect(benchmarkPolicy.claimBoundary.preregistered).toBe(false);
    expect(benchmarkPolicy.claimBoundary.frozen).toBe(false);
    expect(benchmarkPolicy.claimBoundary.resultsExist).toBe(false);
    expect(benchmarkPolicy.claimBoundary.assistantAnswer).toBe(false);
    expect(benchmarkPolicy.claimBoundary.terminalEligible).toBe(false);
    expect(benchmarkPolicy.promotionCriteria.status).toBe(
      "blocked_until_design_freeze_and_external_commitment",
    );
    expect(benchmarkPolicy.runPins).toEqual(
      expect.arrayContaining([
        "commitment_derived_schedule_artifact_sha256",
        "per_call_schedule_conformance_receipt_sha256",
        "external_timestamp_receipt_sha256",
        "isolated_sink_conformance_receipt_sha256",
        "trusted_rater_identity_qualification_conflict_receipt_sha256",
        "arm_neutral_vcr_rubric_sha256",
        "adjudication_protocol_and_algorithm_sha256",
        "vcr_and_false_certification_outcome_derivation_contract_sha256",
      ]),
    );
  });
});
