import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_BINDING } from "../shared/contracts/nhm2-spherical-boson-star-branch-bvp.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_BINDING } from "../shared/contracts/nhm2-spherical-boson-star-v2-branch-solver-policy.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING } from "../shared/contracts/nhm2-spherical-boson-star-v2-candidate-freeze.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_BINDING } from "../shared/contracts/nhm2-spherical-boson-star-v2-initializer-evaluator.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1,
  NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_CANONICAL_JSON,
  NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_EXPECTED_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_LITERAL_SEAL_STATUS,
  NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_SOURCE_PINS,
  NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_SOURCE_ROOT,
  NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_UPSTREAM_BINDING_PINS,
  NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_VALIDATOR_LIMITS,
  isNhm2SphericalBosonStarV2RadialPrimaryNumericsV1,
  nhm2SphericalBosonStarV2RadialPrimaryNumericsV1Violations,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-radial-primary-numerics.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BINDING } from "../shared/contracts/nhm2-spherical-boson-star-v2-si-output-normalization.v1";

const CONTRACT = NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1;

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

describe("spherical boson-star v2 radial primary numerics v1", () => {
  it("exact-binds the five upstream semantic contracts without importing authority", () => {
    const pins =
      NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_UPSTREAM_BINDING_PINS;
    expect(pins.candidateFreeze).toMatchObject({
      sha256:
        "628092507b7dc1be76722f06a7b591efc59d1799bed0d4b7d1999d852d92f28f",
      canonicalSizeBytes: 55997,
      status: "exact_bound",
    });
    expect(pins.branchBvp).toMatchObject({
      sha256:
        "ce00d2b6048d8c22e6dedd4526a8548373916525ef9adb75fcea48e67dc7e557",
      canonicalSizeBytes: 13847,
      status: "exact_bound",
    });
    expect(pins.branchSolverLedger).toMatchObject({
      sha256:
        "b7d2cb2d7dcf39531000bbfcdfadb44f5e9c38d3ab1950982515245336a77cb0",
      canonicalSizeBytes: 18993,
      status: "exact_bound",
    });
    expect(pins.siOutputNormalization).toMatchObject({
      sha256:
        "16224114ce7bc790d1e5ceeaf8f75e31e5c37412856c5bea8b99284301bf3c24",
      canonicalSizeBytes: 23822,
      status: "exact_bound",
    });
    expect(NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING).toMatchObject(
      {
        sha256: pins.candidateFreeze.sha256,
        canonicalSizeBytes: pins.candidateFreeze.canonicalSizeBytes,
      },
    );
    expect(NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_BINDING).toMatchObject({
      sha256: pins.branchBvp.sha256,
      canonicalSizeBytes: pins.branchBvp.canonicalSizeBytes,
    });
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_BINDING,
    ).toMatchObject({
      sha256: pins.branchSolverLedger.sha256,
      canonicalSizeBytes: pins.branchSolverLedger.canonicalSizeBytes,
    });
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BINDING,
    ).toMatchObject({
      sha256: pins.siOutputNormalization.sha256,
      canonicalSizeBytes: pins.siOutputNormalization.canonicalSizeBytes,
    });

    expect(pins.initializerEvaluator).toEqual({
      sha256:
        "2253cea43e7b0abc99aaebd19ced18994eba4605b65fe674febb03d9945cdbc5",
      canonicalSizeBytes: 24711,
      status: "exact_bound",
    });
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_BINDING,
    ).toMatchObject({
      sha256: pins.initializerEvaluator.sha256,
      canonicalSizeBytes: pins.initializerEvaluator.canonicalSizeBytes,
    });
    expect(CONTRACT.completionBoundary.exactUpstreamBindingsComplete).toBe(
      true,
    );
  });

  it("pins and rehashes the exact complete eleven-file production source set", () => {
    const pins =
      NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_SOURCE_PINS;
    expect(pins).toHaveLength(11);
    expect(pins.map((pin) => pin.ordinal)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
    expect(pins.map((pin) => pin.relativePath.split("/").at(-1))).toEqual([
      "binary64_environment.py",
      "radial_residual.py",
      "radial_residual_jacobian.py",
      "radial_collocation_interior.py",
      "radial_origin_series.py",
      "radial_tail_asymptotics.py",
      "radial_lobatto_grid.py",
      "radial_compactified_system.py",
      "deterministic_dense_lu.py",
      "deterministic_newton.py",
      "radial_continuation.py",
    ]);
    const observedProductionNames = readdirSync(
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
    expect(observedProductionNames).toEqual(
      pins
        .map((pin) => pin.relativePath.split("/").at(-1))
        .slice()
        .sort(),
    );
    for (const pin of pins) {
      const bytes = readFileSync(pin.relativePath);
      expect(bytes.byteLength).toBe(pin.sizeBytes);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(pin.sha256);
      expect(pin.sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(pin.relativePath).not.toContain("test_");
    }
    expect(CONTRACT.productionSourceClosure).toMatchObject({
      exactFileCount: 11,
      importTimeExactSizeAndSha256RehashRequired: true,
      importTimeProductionFileSetEqualityRequired: true,
      completeForImplementedFinitePrimitives: true,
      doesNotCloseOverallCandidateSolverImplementationRuntimePresealExecutionOrAuthority: true,
    });
  });

  it("freezes only the implemented finite fenv grid BVP LU Newton and continuation graphs", () => {
    expect(CONTRACT.finiteOperationGraph.binary64Environment).toMatchObject({
      sourceTarget: "linux_x86_64_glibc_full_fenv",
      unsupportedPlatformLibcOrArchitectureDisposition: "fail_closed_at_import",
      glibcDefaultEnvironment: "fesetenv(FE_DFL_ENV)",
      roundingMode: "round_to_nearest_ties_to_even",
      x87RequiredControlHex: "0x033f",
      mxcsrRequiredControlHex: "0x1f80",
      ftzRequired: false,
      dazRequired: false,
      callerArithmeticEnvironmentExactRestoreRequired: true,
    });
    expect(CONTRACT.finiteOperationGraph.lobattoGrid).toMatchObject({
      nodeCountDomain: "exact_integer_3_through_512",
      mpfrPrecisionBits: 256,
      mpfrRounding: "RoundToNearest",
      firstDerivativeDiagonal: "D_ii=-fsum_j_not_i(D_ij)",
      secondDerivative: "D2_ij=fsum_k(D_ik*D_kj)",
    });
    expect(
      CONTRACT.finiteOperationGraph.compactificationAndSquareSystem,
    ).toMatchObject({
      compactification: "rho=x/(1+x);x=rho/(1-rho)",
      firstDerivativeChainRule: "d_dx=(1-rho)^2*d_drho",
      secondDerivativeChainRule: "d2_dx2=(1-rho)^4*d2_drho2-2*(1-rho)^3*d_drho",
      unknownCount: "3*N+1",
      residualCount: "3*N+1",
      boundaryRowCount: 7,
      targetDefaultOriginAmplitude: 2 ** -10,
    });
    expect(CONTRACT.finiteOperationGraph.denseLu).toMatchObject({
      maximumSystemOrder: 1537,
      exactRefinementPassCount: 3,
      blasUsed: false,
      fmaRequested: false,
      equilibrationUsed: false,
      alternatePivotRetryAllowed: false,
    });
    expect(CONTRACT.finiteOperationGraph.newtonArmijo).toMatchObject({
      maximumAcceptedUpdates: 48,
      maximumBacktrackExponent: 24,
      armijoC: 2 ** -12,
      residualLinfThreshold: 2 ** -40,
      scaledStepLinfThreshold: 2 ** -42,
      consecutiveAcceptedFullGateCount: 2,
      oneWrapperAttemptOnly: true,
      retryAllowed: false,
      retuneAllowed: false,
    });
    expect(
      CONTRACT.finiteOperationGraph.finiteAmplitudeContinuation.schedule,
    ).toEqual([
      2 ** -16,
      2 ** -15,
      2 ** -14,
      2 ** -13,
      2 ** -12,
      2 ** -11,
      2 ** -10,
    ]);
    expect(
      CONTRACT.finiteOperationGraph.finiteAmplitudeContinuation,
    ).toMatchObject({
      lowestStagePredictor: "lowest_stage_caller_initializer",
      laterStagePredictor: "previous_accepted_solution",
      newtonAttemptsPerStage: 1,
      retryAllowed: false,
      retuneAllowed: false,
      alternateGridAllowed: false,
      alternateInitializerAllowed: false,
      continuousVacuumConnectionEstablished: false,
      noFoldEstablished: false,
    });
  });

  it("keeps diagnostic levels separate from the typed-blocked candidate schedule", () => {
    expect(CONTRACT.radialLevelDisposition).toEqual({
      sourceImplementedNodeCountRange: [3, 512],
      preselectedDiagnosticLevels: [64, 96, 128],
      preselectedLevelsAreCandidateSchedule: false,
      auditLevel: 256,
      auditLevelSourceGraphImplemented: true,
      auditLevelCandidateAdmission:
        "only_after_upstream_candidate_grid_and_cross_grid_convergence_policy_are_exactly_closed",
      auditLevelSelectedForCandidate: false,
      exactCandidateNodeSchedule: null,
      exactCandidateNodeScheduleStatus:
        "blocked_because_upstream_branch_solver_grid_policy_node_count_and_refinement_are_null",
      crossGridConvergenceCriterion: null,
      crossGridConvergenceEstablished: false,
    });
    expect(CONTRACT.blockers.map((blocker) => blocker.code)).toEqual(
      expect.arrayContaining([
        "candidate_node_schedule_blocked_by_upstream_grid_policy",
        "cross_grid_convergence_criterion_and_receipt_absent",
      ]),
    );
  });

  it("keeps every missing proof implementation runtime execution and authority surface typed false or null", () => {
    expect(CONTRACT.finiteOperationGraph.finiteBoundaryKernels).toMatchObject({
      originAllOrderRecurrenceImplemented: false,
      originRemainderBoundImplemented: false,
      finiteTailRepresentativeImplemented: false,
      tailAllOrderRecurrenceImplemented: false,
      tailRemainderBoundImplemented: false,
    });
    expect(
      CONTRACT.finiteOperationGraph.finiteAmplitudeContinuation,
    ).toMatchObject({
      discreteStagesDoNotProveContinuousVacuumConnection: true,
      nodalSignsAndOrderingDoNotProveNoFold: true,
      continuousVacuumConnectionEstablished: false,
      noFoldEstablished: false,
    });
    expect(Object.values(CONTRACT.unresolved)).toEqual(
      Array(Object.keys(CONTRACT.unresolved).length).fill(null),
    );
    expect(
      Object.values(CONTRACT.authorityLocks).every((value) => !value),
    ).toBe(true);
    expect(CONTRACT.completionBoundary).toMatchObject({
      implementedFinitePrimitiveSourceOperationGraphComplete: true,
      exactElevenProductionSourcePinsComplete: true,
      overallCandidateSolverClosureComplete: false,
      initializerInstancePresent: false,
      candidateNodeScheduleFrozen: false,
      crossGridConvergenceEstablished: false,
      continuousVacuumConnectionEstablished: false,
      noFoldEstablished: false,
      originRemainderProofPresent: false,
      tailRemainderProofPresent: false,
      overallCandidateSolverImplementationPresent: false,
      approvedToolchainExecutableRuntimeClosurePresent: false,
      preexecutionPresealPresent: false,
      executionAuthorized: false,
      executionObserved: false,
      branchAccepted: false,
    });
    for (const blocker of CONTRACT.blockers) {
      expect(blocker.status).toBe("blocked");
    }
    recursivelyExpectFrozen(CONTRACT);
  });

  it("computes a domain-separated canonical binding and matches its final literal self-seal", () => {
    const recomputed = createHash("sha256")
      .update(
        NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_SHA256_DOMAIN,
        "utf8",
      )
      .update(
        NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_CANONICAL_JSON,
        "utf8",
      )
      .digest("hex");
    expect(recomputed).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_SHA256,
    );
    expect(
      Buffer.byteLength(
        NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_CANONICAL_JSON,
        "utf8",
      ),
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_CANONICAL_SIZE_BYTES,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_BINDING,
    ).toMatchObject({
      sha256: recomputed,
      canonicalSizeBytes:
        NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_CANONICAL_SIZE_BYTES,
      mediaType: "application/json",
    });
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_EXPECTED_SHA256,
    ).toBe(recomputed);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_EXPECTED_CANONICAL_SIZE_BYTES,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_CANONICAL_SIZE_BYTES,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_LITERAL_SEAL_STATUS,
    ).toBe(
      "sealed_after_final_initializer_evaluator_repin_before_any_candidate_execution",
    );
  });

  it("accepts only the authoritative identity and rejects semantic drift", () => {
    expect(
      nhm2SphericalBosonStarV2RadialPrimaryNumericsV1Violations(CONTRACT),
    ).toEqual([]);
    expect(isNhm2SphericalBosonStarV2RadialPrimaryNumericsV1(CONTRACT)).toBe(
      true,
    );

    const externalCopy = JSON.parse(
      NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_CANONICAL_JSON,
    );
    expect(
      nhm2SphericalBosonStarV2RadialPrimaryNumericsV1Violations(externalCopy),
    ).toEqual(["radial_primary_numerics_external_copy_not_authoritative"]);
    expect(
      isNhm2SphericalBosonStarV2RadialPrimaryNumericsV1(externalCopy),
    ).toBe(false);

    externalCopy.productionSourceClosure.files[0].sha256 = "0".repeat(64);
    expect(
      nhm2SphericalBosonStarV2RadialPrimaryNumericsV1Violations(externalCopy),
    ).toEqual(["radial_primary_numerics_semantic_mismatch"]);
  });

  it("fails closed on proxy getter cycle prototype sparse and non-JSON hostile values", () => {
    const violation = (value: unknown): string =>
      nhm2SphericalBosonStarV2RadialPrimaryNumericsV1Violations(value)[0] ?? "";

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

    const sparse = new Array(1);
    expect(violation(sparse)).toMatch(/^array_surface:/);
    const symbolSurface: Record<PropertyKey, unknown> = { value: 1 };
    symbolSurface[Symbol("hidden")] = 2;
    expect(violation(symbolSurface)).toMatch(/^object_surface:/);

    const forbidden = Object.create(null) as Record<string, unknown>;
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
  });

  it("enforces finite validator resource bounds before semantic comparison", () => {
    const limits =
      NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_VALIDATOR_LIMITS;
    const tooLong = "x".repeat(limits.maximumStringUtf8Bytes + 1);
    expect(
      nhm2SphericalBosonStarV2RadialPrimaryNumericsV1Violations(tooLong)[0],
    ).toMatch(/^string_byte_limit:/);

    const tooWide = Array.from(
      { length: limits.maximumArrayLength + 1 },
      () => null,
    );
    expect(
      nhm2SphericalBosonStarV2RadialPrimaryNumericsV1Violations(tooWide)[0],
    ).toMatch(/^array_surface:/);

    let tooDeep: Record<string, unknown> = { leaf: true };
    for (let index = 0; index <= limits.maximumDepth; index += 1) {
      tooDeep = { child: tooDeep };
    }
    expect(
      nhm2SphericalBosonStarV2RadialPrimaryNumericsV1Violations(tooDeep)[0],
    ).toMatch(/^snapshot_depth_limit:/);
  });
});
