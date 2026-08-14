import { describe, expect, it } from "vitest";

import {
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY,
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING,
  NHM2_SEMICLASSICAL_V2_RAW_REPLAY_FORMULAS,
  NHM2_SEMICLASSICAL_V2_RAW_REPLAY_MINIMUM_REGULATOR_LEVELS,
} from "../shared/contracts/nhm2-semiclassical-v2-raw-replay-manifest.v1";
import { NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_NON_SELF_INPUT_IDS } from "../shared/contracts/nhm2-semiclassical-v2-scientific-candidate-manifest.v1";
import { NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN } from "../shared/contracts/nhm2-spherical-boson-star-coherent-candidate-plan.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_AUTHORITY_LOCKS,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_JSON,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_MISSING_INPUT_IDS,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_READY_INPUT_IDS,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_VALIDATOR_LIMITS,
  cloneNhm2SphericalBosonStarV2CandidateFreeze,
  isNhm2SphericalBosonStarV2CandidateFreezeV1,
  nhm2SphericalBosonStarV2CandidateFreezeViolations,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-candidate-freeze.v1";

const deepFrozen = (value: unknown, seen = new Set<object>()): boolean => {
  if (value == null || typeof value !== "object" || seen.has(value)) {
    return true;
  }
  seen.add(value);
  return (
    Object.isFrozen(value) &&
    Object.values(value as Record<string, unknown>).every((entry) =>
      deepFrozen(entry, seen),
    )
  );
};

describe("NHM2 spherical boson-star v2 candidate freeze v1", () => {
  it("has stable canonical bytes and accepts only the exact singleton semantics", () => {
    expect(NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_SHA256).toBe(
      "628092507b7dc1be76722f06a7b591efc59d1799bed0d4b7d1999d852d92f28f",
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_SIZE_BYTES,
    ).toBe(55997);
    expect(
      Buffer.byteLength(
        NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_JSON,
      ),
    ).toBe(55997);
    expect(
      nhm2SphericalBosonStarV2CandidateFreezeViolations(
        NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE,
      ),
    ).toEqual([]);
    expect(
      isNhm2SphericalBosonStarV2CandidateFreezeV1(
        cloneNhm2SphericalBosonStarV2CandidateFreeze(),
      ),
    ).toBe(true);
    expect(deepFrozen(NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE)).toBe(
      true,
    );
  });

  it("creates a new v2 identity before execution without inheriting v3 authority", () => {
    const freeze = NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE;
    expect(freeze.candidateIdentity.candidateId).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
    );
    expect(freeze.candidateIdentity.candidateId).not.toBe(
      NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN.candidateIdentity
        .candidateId,
    );
    expect(freeze.candidateIdentity.sourceV3CandidateId).toBe(
      NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN.candidateIdentity
        .candidateId,
    );
    expect(freeze.candidateIdentity).toMatchObject({
      candidateManifestId:
        "nhm2.semiclassical_v2.spherical_boson_star_1s_weak_field_control.candidate_manifest/v1",
      geometryId: "nhm2.semiclassical_v2.spherical_boson_star_1s.geometry/v1",
      quantumStateId:
        "nhm2.semiclassical_v2.spherical_boson_star_1s.coherent_hadamard_state/v1",
      chartId:
        "nhm2.semiclassical_v2.spherical_boson_star_1s.isotropic_cartesian_tetrad_chart/v1",
      normalizationId:
        "nhm2.semiclassical_v2.spherical_boson_star_1s.dimensionless_si_output_normalization/v1",
      tolerancePolicyId:
        "nhm2.server_owned.semiclassical_v2.diagnostic_replay/v2",
      smearingFunctionId:
        "nhm2.semiclassical_v2.spherical_boson_star_1s.normalized_c_infinity_product_bump/v1",
      samplingBasisId:
        "nhm2.semiclassical_v2.spherical_boson_star_1s.fixed_64_cartesian_sampling_basis/v1",
    });
    expect(freeze.migrationBoundary).toMatchObject({
      automaticUpgradeFromV3Allowed: false,
      v3ReplayEpochOrRuntimeBindingInherited: false,
      v3CandidateManifestPresealReceiptOrPairEvidenceInherited: false,
      v3ToleranceArtifactHasV2Authority: false,
      v2ApprovedReplayPolicyIsSoleReplayToleranceAuthority: true,
      numericThresholdRelaxationAllowed: false,
      sourceCandidateWasExecuted: false,
      v2CandidateWasExecuted: false,
    });
    expect(freeze.candidateIdentity.failureDisposition).toBe(
      "fail_this_v2_candidate_without_retuning",
    );
  });

  it("freezes geometry, state, chart, normalization, sampling and smearing exactly", () => {
    const freeze = NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE;
    const source = NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN;
    expect(freeze.frozenScience.geometry.conventions).toEqual(
      source.conventions,
    );
    expect(freeze.frozenScience.geometry.branchSelector).toEqual(
      source.frozenBranchSelector,
    );
    expect(freeze.frozenScience.quantumState).toEqual(
      source.jointSemiclassicalState,
    );
    expect(freeze.frozenScience.chart.geometryGauge).toEqual(
      source.frozenBranchSelector.geometryGauge,
    );
    expect(freeze.frozenScience.smearing).toEqual(
      source.chartTetradSamplingAndSmearing.smearing,
    );
    expect(freeze.frozenScience.samplingBasis.centers).toEqual(
      source.chartTetradSamplingAndSmearing.centers,
    );
    expect(freeze.frozenScience.samplingBasis.sampleCount).toBe(64);
  });

  it("uses the approved v2 policy as sole authority with no threshold relaxation", () => {
    const freeze = NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE;
    expect(freeze.sourceBindings.approvedV2TolerancePolicy).toEqual(
      NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING,
    );
    expect(freeze.frozenScience.tolerancePolicy).toEqual(
      NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY,
    );
    for (const [key, value] of Object.entries(
      freeze.toleranceEquivalence.commonThresholds,
    )) {
      expect(
        (
          NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY.tolerances as Record<
            string,
            number
          >
        )[key],
      ).toBe(value);
    }
  });

  it("partitions the exact 22-input v2 inventory and honestly leaves nine missing", () => {
    const freeze = NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE;
    const partition = [
      ...NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_READY_INPUT_IDS,
      ...NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_MISSING_INPUT_IDS,
    ];
    expect(new Set(partition)).toEqual(
      new Set(NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_NON_SELF_INPUT_IDS),
    );
    expect(freeze.v2ScientificClosure).toMatchObject({
      expectedInputCount: 22,
      semanticallyReadyInputCount: 13,
      missingInputCount: 9,
      complete: false,
      canonicalScienceInputBytesMaterialized: false,
      scientificCandidateManifest: null,
      scientificPreseal: null,
      refreezeRequiredAfterCompleteScienceMaterialization: true,
    });
    expect(freeze.v2ScientificClosure.missingInputIds).toEqual([
      ...NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_MISSING_INPUT_IDS,
    ]);
  });

  it("freezes the exact v2 array shapes and byte-replay duties before execution", () => {
    const freeze = NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE;
    const output = freeze.v2OutputDuty;
    expect(output.encoding).toEqual({
      dtype: "float64",
      binaryEncoding: "raw_ieee754",
      endianness: "little",
      storageOrder: "row-major",
      finiteValuesRequired: true,
      negativeZeroAllowed: false,
    });
    expect(
      output.fixedArrays.map(({ role, shape, componentOrder }) => ({
        role,
        shape,
        componentCount: componentOrder.length,
      })),
    ).toEqual([
      {
        role: "noise_kernel",
        shape: [64, 64, 100],
        componentCount: 100,
      },
      {
        role: "noise_kernel_absolute_uncertainty95",
        shape: [64, 64, 100],
        componentCount: 100,
      },
      { role: "mean_rset", shape: [64, 10], componentCount: 10 },
      {
        role: "mean_rset_absolute_uncertainty95",
        shape: [64, 10],
        componentCount: 10,
      },
      { role: "smearing_weights", shape: [64], componentCount: 1 },
    ]);
    expect(output.brackets).toMatchObject({
      bracketIdsInOrder: ["H_H", "H_Hi", "Hi_Hj"],
      slotsInOrder: [
        "computed",
        "target",
        "residual",
        "absolute_uncertainty95",
      ],
      shape: [64, 4],
      exactArrayCount: 12,
    });
    expect(output.antisymmetry.exactArrayCount).toBe(4);
    expect(output.jacobi.exactArrayCount).toBe(5);
    expect(output.regulator).toMatchObject({
      minimumLevelCount:
        NHM2_SEMICLASSICAL_V2_RAW_REPLAY_MINIMUM_REGULATOR_LEVELS,
      exactLevelCountFrozenBeforeExecution: null,
      levelIdsAndStrictlyDecreasingPositiveScalesFrozenBeforeExecution: null,
      minimumArrayCount: 6,
      unresolvedRegulatorDefinitionBlocksExecution: true,
    });
    expect(output.fixedArrayCountExcludingRegulatorLevels).toBe(26);
    expect(output.minimumTotalArrayCount).toBe(32);
    expect(output.exactTotalArrayCountFrozenBeforeExecution).toBeNull();
    expect(output.outputBytesPresent).toBe(false);
    expect(freeze.replayAndAgreementDuty.formulas).toEqual(
      NHM2_SEMICLASSICAL_V2_RAW_REPLAY_FORMULAS,
    );
    expect(freeze.replayAndAgreementDuty.requiredChecksInOrder).toEqual([
      "finiteness",
      "metricDemandNondegeneracy",
      "meanMetricDemandClosure",
      "metricDemandErrorEnclosure",
      "smearingNormalization",
      "exchangeSymmetry",
      "psd",
      "maximumEigenvalueUpper95",
      "fluctuationRatio",
      "bracketResidual",
      "antisymmetry",
      "jacobi",
      "regulatorConvergence",
    ]);
    expect(freeze.replayAndAgreementDuty).toMatchObject({
      primaryAndIndependentReceiveExactSameFrozenScientificInputBytes: true,
      independentImplementationMayImportOrInvokePrimaryImplementation: false,
      pairAgreementReceipt: null,
      primaryReplayReceipt: null,
      independentReplayReceipt: null,
      theoryGraphLampPromotionRequiresBothReplayPassAndPairAgreement: true,
      physicalViabilityPropulsionOrTransportMayBeUnlocked: false,
      failureDisposition: "fail_this_v2_candidate_without_retuning",
    });
    expect(freeze.runProvenanceDuty).toEqual({
      manifestFrozenAtBeforeExecutionRequired: true,
      candidateFrozenAtBeforeExecutionRequired: true,
      numericalPolicyFrozenAtBeforeExecutionRequired: true,
      exactGitCommitShaRequired: true,
      exactCommandArgvWorkingDirectoryAndOutputDirectoryRequired: true,
      startedAtCompletedAtDurationExitCodeAndTerminationSignalRequired: true,
      implementationSourceDependencyLockAndExecutableHashesRequired: true,
      exactScientificAndCompleteInputClosureHashesRequired: true,
      everyInputObservedPreexistingAndUnchangedRequired: true,
      everyOutputObservedNewAfterSuccessfulCompletionRequired: true,
      inputOutputRootsAndPrimaryIndependentRootsMustBeDisjoint: true,
      preExecutionFreshnessReceiptRequired: true,
      postExecutionFreshnessReceiptRequired: true,
      commitSha: null,
      command: null,
      timing: null,
      inputClosureHashes: null,
      outputHashes: null,
      freshnessReceipts: null,
      complete: false,
    });
  });

  it("keeps nondegeneracy, arrays, replay, lamps and physical claims locked", () => {
    const freeze = NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE;
    expect(freeze.candidateIdentity.declaredLeverOrTileTensorUsed).toBe(false);
    expect(freeze.sourceProvenance).toEqual({
      sourceMode: "state_derived_not_declared_lever",
      meanRsetOrigin: "renormalized_quantum_state_expectation_value",
      noiseKernelOrigin:
        "connected_symmetrized_quantum_state_two_point_function",
      declaredLeverTensorUsed: false,
      declaredTileTensorUsed: false,
      inputClosureExcludesDeclaredLeverOrTileTensor: true,
    });
    expect(freeze.nondegeneracyGate).toMatchObject({
      sampleCount: 64,
      minimumMetricDemandFrobeniusSI: 1e-12,
      requiredMetricDemandSampleFraction: 1,
      metricDemandTensor: null,
      metricDemandAbsoluteErrorBound: null,
      metricDemandDerivationReceipt: null,
      serverReplayReceipt: null,
      established: false,
      failureDisposition: "fail_candidate_without_retuning",
    });
    expect(freeze.authorityLocks).toEqual(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_AUTHORITY_LOCKS,
    );
    expect(Object.values(freeze.authorityLocks).every((value) => !value)).toBe(
      true,
    );
    expect(freeze.executionBoundary.executionAuthorized).toBe(false);
    expect(freeze.executionBoundary.executionObserved).toBe(false);
  });

  it("rejects semantic drift, extra keys and signed zero", () => {
    const drift = cloneNhm2SphericalBosonStarV2CandidateFreeze() as any;
    drift.candidateIdentity.retuningAfterObservationAllowed = true;
    expect(nhm2SphericalBosonStarV2CandidateFreezeViolations(drift)).toEqual([
      "spherical_v2_candidate_freeze_semantic_drift",
    ]);

    const extra = cloneNhm2SphericalBosonStarV2CandidateFreeze() as any;
    extra.extra = true;
    expect(nhm2SphericalBosonStarV2CandidateFreezeViolations(extra)).toEqual([
      "spherical_v2_candidate_freeze_semantic_drift",
    ]);

    const signedZero = cloneNhm2SphericalBosonStarV2CandidateFreeze() as any;
    signedZero.frozenScience.normalization.sourceCoefficient.value = -0;
    expect(
      nhm2SphericalBosonStarV2CandidateFreezeViolations(signedZero)[0],
    ).toContain("invalid_number");
  });

  it("rejects accessors without invoking them and rejects proxy surfaces", () => {
    let reads = 0;
    const accessor = cloneNhm2SphericalBosonStarV2CandidateFreeze() as any;
    Object.defineProperty(accessor, "candidateIdentity", {
      enumerable: true,
      get() {
        reads += 1;
        return {};
      },
    });
    expect(
      nhm2SphericalBosonStarV2CandidateFreezeViolations(accessor)[0],
    ).toContain("object_entry_surface");
    expect(reads).toBe(0);

    let traps = 0;
    const proxied = new Proxy(
      cloneNhm2SphericalBosonStarV2CandidateFreeze() as any,
      {
        ownKeys(target) {
          traps += 1;
          return Reflect.ownKeys(target);
        },
      },
    );
    expect(
      nhm2SphericalBosonStarV2CandidateFreezeViolations(proxied)[0],
    ).toContain("proxy_forbidden");
    expect(traps).toBe(0);
  });

  it("rejects sparse arrays, cycles, excessive depth and excessive width", () => {
    const sparse = cloneNhm2SphericalBosonStarV2CandidateFreeze() as any;
    const sparseIds = new Array(2);
    sparseIds[1] = "geometry";
    sparse.v2ScientificClosure.semanticallyReadyInputIds = sparseIds;
    expect(
      nhm2SphericalBosonStarV2CandidateFreezeViolations(sparse)[0],
    ).toContain("array_surface");

    const cyclic = cloneNhm2SphericalBosonStarV2CandidateFreeze() as any;
    cyclic.cycle = cyclic;
    expect(
      nhm2SphericalBosonStarV2CandidateFreezeViolations(cyclic)[0],
    ).toContain("cycle_forbidden");

    const deep = cloneNhm2SphericalBosonStarV2CandidateFreeze() as any;
    let cursor = deep;
    for (
      let depth = 0;
      depth <
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_VALIDATOR_LIMITS.maximumDepth +
        2;
      depth += 1
    ) {
      cursor.deep = {};
      cursor = cursor.deep;
    }
    expect(
      nhm2SphericalBosonStarV2CandidateFreezeViolations(deep)[0],
    ).toContain("snapshot_depth_limit");

    const wide = cloneNhm2SphericalBosonStarV2CandidateFreeze() as any;
    wide.wide = Object.fromEntries(
      Array.from(
        {
          length:
            NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_VALIDATOR_LIMITS.maximumObjectPropertyCount +
            1,
        },
        (_, index) => [`k${index}`, index],
      ),
    );
    expect(
      nhm2SphericalBosonStarV2CandidateFreezeViolations(wide)[0],
    ).toContain("object_surface");
  });

  it("bounds property-key and aggregate UTF-8 before canonical comparison", () => {
    const hugeKey = cloneNhm2SphericalBosonStarV2CandidateFreeze() as any;
    Object.defineProperty(
      hugeKey,
      "k".repeat(
        NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_VALIDATOR_LIMITS.maximumPropertyKeyUtf8Bytes +
          1,
      ),
      { value: true, enumerable: true },
    );
    expect(
      nhm2SphericalBosonStarV2CandidateFreezeViolations(hugeKey)[0],
    ).toContain("property_key_byte_limit");

    const aggregate = cloneNhm2SphericalBosonStarV2CandidateFreeze() as any;
    aggregate.large = Object.fromEntries(
      Array.from({ length: 48 }, (_, index) => [
        `k${index}`,
        "x".repeat(
          NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_VALIDATOR_LIMITS.maximumStringUtf8Bytes,
        ),
      ]),
    );
    expect(
      nhm2SphericalBosonStarV2CandidateFreezeViolations(aggregate)[0],
    ).toContain("aggregate_utf8_byte_limit");
  });
});
