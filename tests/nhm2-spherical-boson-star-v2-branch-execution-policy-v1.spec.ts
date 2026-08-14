import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_BINDING } from "../shared/contracts/nhm2-spherical-boson-star-branch-bvp.v1";
import { NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_BINDING } from "../shared/contracts/nhm2-spherical-boson-star-coherent-candidate-plan.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_BINDING } from "../shared/contracts/nhm2-spherical-boson-star-v2-branch-solver-policy.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING } from "../shared/contracts/nhm2-spherical-boson-star-v2-candidate-freeze.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1,
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_BRANCH_SOURCE_PINS,
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_CANONICAL_JSON,
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_EXPECTED_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_LITERAL_SEAL_STATUS,
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_UPSTREAM_BINDING_PINS,
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_UPSTREAM_SOURCE_PINS,
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_VALIDATOR_LIMITS,
  cloneNhm2SphericalBosonStarV2BranchExecutionPolicyV1,
  isNhm2SphericalBosonStarV2BranchExecutionPolicyV1,
  nhm2SphericalBosonStarV2BranchExecutionPolicyV1Violations,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-branch-execution-policy.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_BINDING } from "../shared/contracts/nhm2-spherical-boson-star-v2-initializer-evaluator.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_SOURCE_PINS,
  NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_SOURCE_ROOT,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-radial-primary-numerics.v1";

const CONTRACT = NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1;

const recursivelyExpectFrozen = (
  value: unknown,
  seen = new Set<object>(),
): void => {
  if (value === null || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  expect(Object.isFrozen(value)).toBe(true);
  for (const child of Object.values(value as Record<string, unknown>)) {
    recursivelyExpectFrozen(child, seen);
  }
};

describe("spherical boson-star v2 branch execution policy v1", () => {
  it("exact-binds all named upstream canonical seals and their live TypeScript bytes", () => {
    const pins =
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_UPSTREAM_BINDING_PINS;
    const observed = [
      [
        NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_BINDING,
        pins.sourceCandidatePlan,
      ],
      [NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_BINDING, pins.branchBvp],
      [
        NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
        pins.targetCandidateFreeze,
      ],
      [
        NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_BINDING,
        pins.branchSolverLedger,
      ],
      [
        NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_BINDING,
        pins.initializerEvaluator,
      ],
      [
        NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_BINDING,
        pins.radialPrimaryNumerics,
      ],
    ] as const;
    for (const [binding, pin] of observed) {
      expect(binding.sha256).toBe(pin.sha256);
      expect(binding.canonicalSizeBytes).toBe(pin.canonicalSizeBytes);
    }
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_UPSTREAM_SOURCE_PINS,
    ).toHaveLength(6);
    for (const [
      index,
      pin,
    ] of NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_UPSTREAM_SOURCE_PINS.entries()) {
      expect(pin.ordinal).toBe(index);
      const bytes = readFileSync(pin.relativePath);
      expect(bytes.byteLength).toBe(pin.sizeBytes);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(pin.sha256);
    }
  });

  it("exact-binds the complete eleven-file live branch source set", () => {
    const pins =
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_BRANCH_SOURCE_PINS;
    expect(pins).toEqual(
      NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_SOURCE_PINS,
    );
    expect(pins).toHaveLength(11);
    for (const [index, pin] of pins.entries()) {
      expect(pin.ordinal).toBe(index);
      const bytes = readFileSync(pin.relativePath);
      expect(bytes.byteLength).toBe(pin.sizeBytes);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(pin.sha256);
    }
    const observedNames = readdirSync(
      NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_SOURCE_ROOT,
      { withFileTypes: true },
    )
      .filter(
        (entry) =>
          entry.isFile() &&
          entry.name.endsWith(".py") &&
          !entry.name.startsWith("test_"),
      )
      .map((entry) => entry.name)
      .sort();
    expect(observedNames).toEqual(
      pins
        .map((pin) => pin.relativePath.split("/").at(-1))
        .slice()
        .sort(),
    );
    expect(CONTRACT.liveSourceClosure).toMatchObject({
      exactUpstreamContractFileCount: 6,
      exactBranchImplementationFileCount: 11,
      exactSizeAndPlainSha256RehashAtImport: true,
      exactBranchProductionFileSetEqualityAtImport: true,
      hashesSelectCandidateGridOrThresholds: false,
      hashesEstablishExecutionReplayOrScientificAuthority: false,
    });
  });

  it("keeps supported and audit grids diagnostic-only and the candidate schedule typed null", () => {
    expect(CONTRACT.candidateGridAndRefinement).toEqual({
      status: "blocked_underdetermined",
      implementedGridFamily: "MPFR256_compactified_Lobatto",
      compactification: "rho=x/(1+x);x=rho/(1-rho)",
      sourceSupportedNodeCountRange: [3, 512],
      diagnosticOnlyNodeCounts: [64, 96, 128],
      diagnosticOnlyNodeCountsAreCandidateSchedule: false,
      auditOnlyNodeCount: 256,
      auditOnlyNodeCountSelectedForCandidate: false,
      exactCandidateNodeSchedule: null,
      exactRefinementChronology: null,
      crossLevelProjectionOrInterpolation: null,
      candidateGridSelectionRule: null,
      sourceHashPresenceMayFillNullFields: false,
      sourceSupportMayBeInferredAsCandidateSchedule: false,
      blockerId: "candidate_grid_and_refinement_schedule_underdetermined",
    });
    expect(CONTRACT.additiveBoundary).toMatchObject({
      sourceHashPresenceCanSatisfyAnyNullChoice: false,
      finitePrimitiveSupportCanBeInferredAsCandidateSelection: false,
      declaredLeverOrTileTensorUsed: false,
    });
    expect(CONTRACT.blockers.map((blocker) => blocker.blockerId)).toContain(
      "candidate_grid_and_refinement_schedule_underdetermined",
    );
  });

  it("freezes the exact finite-amplitude chronology and Newton/LU parameters", () => {
    expect(CONTRACT.finiteAmplitudeContinuation.schedule).toEqual([
      2 ** -16,
      2 ** -15,
      2 ** -14,
      2 ** -13,
      2 ** -12,
      2 ** -11,
      2 ** -10,
    ]);
    expect(CONTRACT.finiteAmplitudeContinuation).toMatchObject({
      lowestStagePredictor: "lowest_stage_caller_initializer",
      laterStagePredictor: "previous_accepted_solution",
      interpolationPredictorAllowed: false,
      extrapolationPredictorAllowed: false,
      newtonAttemptsPerStage: 1,
      firstFailureDisposition:
        "record_failed_stage_then_stop_before_any_retry_or_later_stage",
      retryAllowed: false,
      retuneAllowed: false,
      discreteStagesProveContinuousVacuumConnection: false,
      continuousVacuumConnectionEstablished: false,
    });
    expect(CONTRACT.deterministicNewton).toMatchObject({
      maximumAcceptedUpdates: 48,
      maximumBacktrackExponent: 24,
      alphaSchedule: "alpha=2^-exponent_for_exponent_0_through_24",
      armijoC: 2 ** -12,
      residualLinfThreshold: 2 ** -40,
      scaledStepLinfThreshold: 2 ** -42,
      consecutiveAcceptedFullGateCount: 2,
      oneWrapperAttemptOnly: true,
      retryAllowed: false,
      retuneAllowed: false,
    });
    expect(CONTRACT.deterministicDenseLu).toMatchObject({
      maximumSystemOrder: 1537,
      algorithm: "dense_partial_pivot_LU_factor_once",
      zeroPivotRule: "exact_zero_or_nonfinite_fails_without_threshold_retry",
      exactRefinementPassCount: 3,
      blasUsed: false,
      fmaRequested: false,
      equilibrationUsed: false,
      alternatePivotRetryAllowed: false,
    });
  });

  it("leaves every cross-grid vacuum-connection and no-fold proof choice typed null", () => {
    expect(CONTRACT.crossGridConvergence).toMatchObject({
      availableDiagnosticNodeCounts: [64, 96, 128],
      availableAuditNodeCount: 256,
      thoseLevelsAreCandidateRefinementSchedule: false,
      exactCandidateLevels: null,
      projectionOrInterpolationGraph: null,
      comparedStateOrObservableOrder: null,
      norm: null,
      absoluteTolerance: null,
      relativeTolerance: null,
      requiredConsecutiveLevelPairs: null,
      failureRule: null,
      receipt: null,
      established: false,
      sourceHashPresenceMayFillNullFields: false,
    });
    expect(CONTRACT.branchAndNoFoldDiagnostics).toMatchObject({
      frequencyProgressionRecorded: true,
      unusedConstraintLinfProgressionRecorded: true,
      continuousVacuumConnectionIntervalProof: null,
      continuationTangentDefinition: null,
      tangentOrientationAndSignRule: null,
      foldObservable: null,
      foldThreshold: null,
      foldProofReceipt: null,
      nodalDiagnosticsEstablishStrictContinuumMonotonicity: false,
      finiteScheduleEstablishesFirstVacuumConnectedBranch: false,
      frequencyProgressionEstablishesNoFold: false,
      continuousVacuumConnectionEstablished: false,
      firstBranchEstablished: false,
      noFoldEstablished: false,
      sourceHashPresenceMayFillNullFields: false,
    });
    expect(CONTRACT.blockers.map((blocker) => blocker.blockerId)).toEqual(
      expect.arrayContaining([
        "cross_grid_convergence_criterion_underdetermined",
        "continuous_vacuum_connection_proof_underdetermined",
        "no_fold_tangent_observable_and_threshold_underdetermined",
      ]),
    );
  });

  it("preserves one-attempt stop-first-failure semantics while leaving initializer runtime and replay absent", () => {
    expect(CONTRACT.failureAndAttemptPolicy).toMatchObject({
      maximumCandidateAttempts: 1,
      retryAllowed: false,
      retuneAllowed: false,
      alternateInitializerOrBranchFallbackAllowed: false,
      alternateGridContinuationNewtonLinearSolvePrecisionOrToleranceAllowed: false,
      observationMaySelectOrChangeAnyNumericalChoice: false,
      failedStageStopsBeforeLaterStage: true,
      firstFailedGateStopsWithoutFallback: true,
      failureDisposition:
        "fail_the_frozen_v2_candidate_without_retuning_retry_or_branch_switch",
    });
    expect(CONTRACT.failureAndAttemptPolicy.preflightFailurePrecedence).toEqual(
      [
        "upstream_binding_or_literal_self_seal_mismatch",
        "production_source_file_set_size_or_sha256_mismatch",
        "initializer_instance_or_supplemental_source_absent",
        "candidate_node_schedule_or_cross_grid_policy_absent",
        "overall_solver_implementation_toolchain_executable_or_runtime_absent",
        "preexecution_preseal_absent",
        "stage_zero_newton_failure",
        "first_later_stage_newton_failure_in_schedule_order",
        "cross_grid_convergence_not_established",
        "continuous_vacuum_connection_or_no_fold_proof_absent",
        "origin_or_tail_remainder_proof_absent",
        "candidate_execution_or_replay_not_observed",
      ],
    );
    expect(CONTRACT.initializerBoundary).toMatchObject({
      evaluatorPolicyBound: true,
      exactPayloadCount: 6,
      exactTotalPayloadSizeBytes: 2664,
      supplementalJoinPayloadInstance: null,
      supplementalJoinBarrierTraceReceipt: null,
      selectedGrid: null,
      initializerBinding: null,
      initializerOutput: null,
      evaluatorPolicyPresenceEstablishesInitializerInstance: false,
      initializerInstancePresent: false,
    });
    expect(Object.values(CONTRACT.unresolvedExecutionSurface)).toEqual(
      Array(Object.keys(CONTRACT.unresolvedExecutionSurface).length).fill(null),
    );
  });

  it("keeps all execution replay lamp and physical authority false and recursively freezes the contract", () => {
    expect(Object.values(CONTRACT.authorityLocks)).toEqual(
      Array(Object.keys(CONTRACT.authorityLocks).length).fill(false),
    );
    expect(CONTRACT.completionBoundary).toMatchObject({
      candidateGridScheduleFrozen: false,
      candidateRefinementChronologyFrozen: false,
      crossGridConvergencePolicyComplete: false,
      continuousVacuumConnectionProofPresent: false,
      noFoldProofPresent: false,
      boundaryProofsPresent: false,
      initializerInstancePresent: false,
      integratedImplementationPresent: false,
      runtimeClosurePresent: false,
      scientificPresealPresent: false,
      executionAuthorized: false,
      executionObserved: false,
      serverReplayComplete: false,
      independentAgreementComplete: false,
      branchAccepted: false,
      lampsPromoted: false,
    });
    expect(CONTRACT.candidateBoundary.declaredLeverOrTileTensorRead).toBe(
      false,
    );
    recursivelyExpectFrozen(CONTRACT);
  });

  it("matches its final domain-separated literal self-seal", () => {
    const recomputed = createHash("sha256")
      .update(
        NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_SHA256_DOMAIN,
        "utf8",
      )
      .update(
        NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_CANONICAL_JSON,
        "utf8",
      )
      .digest("hex");
    expect(recomputed).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_SHA256,
    );
    expect(
      Buffer.byteLength(
        NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_CANONICAL_JSON,
        "utf8",
      ),
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_CANONICAL_SIZE_BYTES,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_EXPECTED_SHA256,
    ).toBe(recomputed);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_EXPECTED_CANONICAL_SIZE_BYTES,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_CANONICAL_SIZE_BYTES,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_LITERAL_SEAL_STATUS,
    ).toBe("sealed_before_any_candidate_execution_with_typed_blockers_active");
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_BINDING,
    ).toMatchObject({
      sha256: recomputed,
      canonicalSizeBytes:
        NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_CANONICAL_SIZE_BYTES,
      mediaType: "application/json",
    });
  });

  it("accepts an exact plain-data clone and rejects semantic drift", () => {
    expect(
      nhm2SphericalBosonStarV2BranchExecutionPolicyV1Violations(CONTRACT),
    ).toEqual([]);
    const clone = cloneNhm2SphericalBosonStarV2BranchExecutionPolicyV1();
    expect(
      nhm2SphericalBosonStarV2BranchExecutionPolicyV1Violations(clone),
    ).toEqual([]);
    expect(isNhm2SphericalBosonStarV2BranchExecutionPolicyV1(clone)).toBe(true);
    const drift = clone as unknown as {
      candidateGridAndRefinement: {
        exactCandidateNodeSchedule: number[] | null;
      };
    };
    drift.candidateGridAndRefinement.exactCandidateNodeSchedule = [128];
    expect(
      nhm2SphericalBosonStarV2BranchExecutionPolicyV1Violations(drift),
    ).toEqual(["spherical_v2_branch_execution_policy_semantic_drift"]);
  });

  it("fails closed on proxy getter cycle prototype sparse symbol forbidden-key and non-JSON inputs", () => {
    const violation = (value: unknown): string =>
      nhm2SphericalBosonStarV2BranchExecutionPolicyV1Violations(value)[0] ?? "";

    expect(violation(new Proxy({}, {}))).toMatch(/^proxy_forbidden:/);
    let getterCalled = false;
    const getter = {};
    Object.defineProperty(getter, "trap", {
      enumerable: true,
      get: () => {
        getterCalled = true;
        return 1;
      },
    });
    expect(violation(getter)).toMatch(/^object_entry:/);
    expect(getterCalled).toBe(false);

    const cycle: Record<string, unknown> = {};
    cycle.self = cycle;
    expect(violation(cycle)).toMatch(/^cycle_forbidden:/);
    expect(violation(new Date(0))).toMatch(/^non_plain_object:/);
    expect(violation(new Array(1))).toMatch(/^array_surface:/);

    const symbolSurface: Record<PropertyKey, unknown> = { value: 1 };
    symbolSurface[Symbol("hidden")] = 2;
    expect(violation(symbolSurface)).toMatch(/^object_surface:/);
    const forbidden: Record<string, unknown> = {};
    Object.defineProperty(forbidden, "__proto__", {
      value: 1,
      enumerable: true,
    });
    expect(violation(forbidden)).toMatch(/^object_key:/);

    expect(violation(-0)).toMatch(/^invalid_number:/);
    expect(violation(Number.NaN)).toMatch(/^invalid_number:/);
    expect(violation(Number.POSITIVE_INFINITY)).toMatch(/^invalid_number:/);
    expect(violation(1n)).toMatch(/^non_json_value:/);
    expect(violation("bad\0string")).toMatch(/^invalid_string:/);
    expect(violation("\ud800")).toMatch(/^invalid_string:/);
  });

  it("enforces finite validator depth width and string budgets before comparison", () => {
    const limits =
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_VALIDATOR_LIMITS;
    expect(
      nhm2SphericalBosonStarV2BranchExecutionPolicyV1Violations(
        "x".repeat(limits.maximumStringUtf8Bytes + 1),
      )[0],
    ).toMatch(/^invalid_string:/);
    expect(
      nhm2SphericalBosonStarV2BranchExecutionPolicyV1Violations(
        Array.from({ length: limits.maximumArrayLength + 1 }, () => null),
      )[0],
    ).toMatch(/^array_surface:/);
    let tooDeep: Record<string, unknown> = { leaf: true };
    for (let index = 0; index <= limits.maximumDepth; index += 1) {
      tooDeep = { child: tooDeep };
    }
    expect(
      nhm2SphericalBosonStarV2BranchExecutionPolicyV1Violations(tooDeep)[0],
    ).toMatch(/^snapshot_depth_limit:/);
  });
});
