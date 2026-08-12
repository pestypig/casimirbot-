import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";

import { NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN as V1_PLAN } from "../shared/contracts/nhm2-prolate-boson-star-coherent-candidate-plan.v1";
import {
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2,
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING,
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING_PINS,
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BLOCKERS,
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_CANONICAL_JSON,
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_CANONICAL_SIZE_BYTES,
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_CANDIDATE_ID,
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_CONTRACT_VERSION,
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_SHA256,
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_SHA256_DOMAIN,
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_VALIDATOR_LIMITS,
  isNhm2ProlateBosonStarCoherentCandidatePlanV2,
  nhm2ProlateBosonStarCoherentCandidatePlanV2Violations,
} from "../shared/contracts/nhm2-prolate-boson-star-coherent-candidate-plan.v2";
import {
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_BINDING,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_OUTPUT_ROLES,
  NHM2_SEMICLASSICAL_V3_DERIVATION_EVIDENCE_SIDECAR_ROLES,
  NHM2_SEMICLASSICAL_V3_IMPLEMENTATION_INPUT_IDS,
  NHM2_SEMICLASSICAL_V3_OUTPUT_ROLES,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCK_KEYS,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCKS,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_BINDING,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_SHA256_DOMAIN,
  NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_IDS,
  NHM2_SEMICLASSICAL_V3_REQUIRED_INPUT_IDS,
  NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_IDS,
} from "../shared/contracts/nhm2-semiclassical-v3-replay-epoch.v1";
import {
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_INVENTORY_SHA256_DOMAIN,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_MANIFEST_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_MANIFEST_CONTRACT_VERSION,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_SCHEMA_BOUNDARY,
} from "../shared/contracts/nhm2-semiclassical-v3-constraint-operand-manifest.v1";
import {
  NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_COVERAGE_ROLES,
  NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_COVERAGE_ROLE_ORDER_SHA256,
  NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY,
  NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_BINDING,
  NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_SHA256_DOMAIN,
  NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_ROLE_POLICIES,
} from "../shared/contracts/nhm2-semiclassical-v3-pair-numeric-agreement-policy.v1";

const PLAN = NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2;
const jsonClone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const everyObjectFrozen = (
  value: unknown,
  seen = new Set<object>(),
): boolean => {
  if (value == null || typeof value !== "object" || seen.has(value)) {
    return true;
  }
  seen.add(value);
  return (
    Object.isFrozen(value) &&
    Object.values(value as Record<string, unknown>).every((entry) =>
      everyObjectFrozen(entry, seen),
    )
  );
};

describe("NHM2 prolate boson-star coherent candidate plan v2", () => {
  it("pins canonical candidate-v2 bytes with a domain-separated literal digest", () => {
    expect(
      NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_SHA256_DOMAIN,
    ).toBe("nhm2-prolate-boson-star-coherent-candidate-plan/v2\n");
    expect(NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_SHA256).toBe(
      "945290005dced13762a8972e725ac72bb2006eda88f5537ec3a231c848122f14",
    );
    expect(
      NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_CANONICAL_SIZE_BYTES,
    ).toBe(134951);
    expect(
      createHash("sha256")
        .update(
          NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_SHA256_DOMAIN,
          "utf8",
        )
        .update(
          NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_CANONICAL_JSON,
          "utf8",
        )
        .digest("hex"),
    ).toBe(NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_SHA256);
    expect(
      Buffer.byteLength(
        NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_CANONICAL_JSON,
        "utf8",
      ),
    ).toBe(
      NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_CANONICAL_SIZE_BYTES,
    );
    expect(NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING).toEqual({
      artifactId: "nhm2.prolate_boson_star_coherent_candidate_plan",
      contractVersion: "nhm2_prolate_boson_star_coherent_candidate_plan/v2",
      candidateId:
        "nhm2.semiclassical_v3.prolate_boson_star_2p_weak_field_plan/v2",
      sha256Domain: "nhm2-prolate-boson-star-coherent-candidate-plan/v2\n",
      sha256:
        "945290005dced13762a8972e725ac72bb2006eda88f5537ec3a231c848122f14",
      canonicalSizeBytes: 134951,
    });
  });

  it("is an honest v3 preregistration while preserving the valid frozen v1 science", () => {
    expect(PLAN.contractVersion).toBe(
      "nhm2_prolate_boson_star_coherent_candidate_plan/v2",
    );
    expect(PLAN.contractVersion).toBe(
      NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_CONTRACT_VERSION,
    );
    expect(PLAN.candidateIdentity.candidateId).toBe(
      "nhm2.semiclassical_v3.prolate_boson_star_2p_weak_field_plan/v2",
    );
    expect(PLAN.candidateIdentity.candidateId).toBe(
      NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_CANDIDATE_ID,
    );
    expect(PLAN.candidateIdentity.scientificRole).toBe(
      "fresh_joint_geometry_state_benchmark_for_the_semiclassical_v3_lane",
    );
    expect(PLAN.authority).toBe("preregistered_science_plan_only");
    expect(PLAN.scientificCandidateAdmissible).toBe(false);

    for (const section of [
      "conventions",
      "matterModel",
      "frozenBranchSelector",
      "jointSemiclassicalState",
      "renormalization",
      "selfConsistency",
      "chartTetradSamplingAndSmearing",
      "primaryScientificReferences",
    ] as const) {
      expect(PLAN[section]).toBe(V1_PLAN[section]);
    }
    expect(
      PLAN.scienceInheritance.staleV1ExecutionOrReplaySemanticsInherited,
    ).toBe(false);
    expect(PLAN.frozenBranchSelector.multipolarQuantumNumbers).toEqual({
      N: 2,
      ell: 1,
      m: 0,
    });
    expect(PLAN.matterModel.dimensionlessGravitationalCoupling.exact).toBe(
      "2^-40",
    );
    expect(PLAN.matterModel.coherentPeakAmplitude.exact).toBe("2^-10");
    expect(
      PLAN.jointSemiclassicalState
        .coherentDisplacementPreservesHadamardSingularity,
    ).toBe(true);
    expect(PLAN.renormalization.producerSelectedFiniteCountertermsAllowed).toBe(
      false,
    );
    expect(PLAN.selfConsistency.classicalGeometryOnlyAllowed).toBe(false);
    expect(PLAN.chartTetradSamplingAndSmearing.sampleCount).toBe(64);
    expect(
      PLAN.chartTetradSamplingAndSmearing.everyTensorComponentMustBeNonzero,
    ).toBe(false);
    expect(V1_PLAN.contractVersion).toBe(
      "nhm2_prolate_boson_star_coherent_candidate_plan/v1",
    );
  });

  it("binds the final v3 epoch, manifest, arithmetic, and pair contracts exactly", () => {
    const replay = PLAN.v3Bindings.replayEpoch;
    expect(replay.policy).toBe(NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY);
    expect(replay.binding).toBe(
      NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_BINDING,
    );
    expect(replay.binding.sha256).toBe(
      "72809f7bf15551886994ee80bf3f67d793d4024e2c64decd838f9c6d6795413f",
    );
    expect(PLAN.bindingPins).toBe(
      NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING_PINS,
    );
    expect(replay.sha256Domain).toBe(
      "nhm2-semiclassical-v3-replay-epoch-policy/v1\n",
    );
    expect(replay.sha256Domain).toBe(
      NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_SHA256_DOMAIN,
    );
    expect(replay.inputRoles).toBe(NHM2_SEMICLASSICAL_V3_REQUIRED_INPUT_IDS);
    expect(replay.scientificInputRoles).toBe(
      NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_IDS,
    );
    expect(replay.implementationInputRoles).toBe(
      NHM2_SEMICLASSICAL_V3_IMPLEMENTATION_INPUT_IDS,
    );
    expect(replay.outputRoles).toBe(NHM2_SEMICLASSICAL_V3_OUTPUT_ROLES);
    expect(replay.replayMetricLeafIds).toBe(
      NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_IDS,
    );
    expect(replay.counts).toMatchObject({
      scientificInputs: 25,
      implementationInputs: 3,
      totalInputs: 28,
      outputArrays: 68,
      metricDemandInputArrays: 2,
      decodedFloat64Arrays: 70,
      derivationSidecars: 3,
      solverSciencePayloadFiles: 71,
      replayMetricLeaves: 159,
    });
    expect(replay.inputRoleOrderSha256).toBe(
      "a2d6c6c256b7dbfcbb87873a9cd5659d471a8a92b38e9720192aa83d6023994b",
    );
    expect(replay.scientificInputRoleOrderSha256).toBe(
      "fbefe8a647f1a11c81148a931258a850b6b41041927552bb76429197f12e238b",
    );
    expect(replay.implementationInputRoleOrderSha256).toBe(
      "4977f5339269383309287bf5f3e81a33c108e8e212eebc281591cbee020b9406",
    );
    expect(replay.outputRoleOrderSha256).toBe(
      "95ce1862e00c151f7bb36e483e7fffbe7c08b23791f8682dff4a0268b688f227",
    );
    expect(replay.derivationSidecarRoleOrderSha256).toBe(
      "9ec55cfe0f5b109166abc72e35b08a5e2dbc0dfbf2ec1c43341cda01a40a917b",
    );
    expect(replay.replayMetricLeafIdsSha256).toBe(
      "99eb0b2077bea07be03a3fe08db126c5014f6801c0ac6bb220c6dd2723aa7498",
    );
    expect(replay.replayMetricCoverageSha256).toBe(
      "b9c806970fbe853603ad666ee454a6e16f0a9aebd85903b4de9e41098586b574",
    );

    const manifest = PLAN.totalConstraintDuty.v3ConstraintOperandManifestSchema;
    expect(manifest.artifactId).toBe(
      NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_MANIFEST_ARTIFACT_ID,
    );
    expect(manifest.contractVersion).toBe(
      NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_MANIFEST_CONTRACT_VERSION,
    );
    expect(manifest.operandInventorySha256Domain).toBe(
      NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_INVENTORY_SHA256_DOMAIN,
    );
    expect(manifest.operandArrayCount).toBe(63);
    expect(manifest.operandArraysPerLevel).toBe(21);
    expect(manifest.operandArraySizeBytes).toBe(2048);
    expect(manifest.outputRoles).toBe(
      NHM2_SEMICLASSICAL_V3_CONSTRAINT_OUTPUT_ROLES,
    );
    expect(manifest.schemaBoundary).toBe(
      NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_SCHEMA_BOUNDARY,
    );
    expect(manifest.runtimeManifest).toBeNull();
    expect(manifest.runtimeManifestStructurallyAdmissible).toBe(false);

    expect(PLAN.v3Bindings.constraintArithmetic.policy).toBe(
      NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY,
    );
    expect(PLAN.v3Bindings.constraintArithmetic.binding).toBe(
      NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_BINDING,
    );
    expect(PLAN.v3Bindings.constraintArithmetic.binding.sha256).toBe(
      "ec6dc71043c35d20b74efe0053ae2b3665af6ec9ac9c2d5c36e2911b89defeb8",
    );
    expect(PLAN.v3Bindings.pairNumericAgreement.policy).toBe(
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY,
    );
    expect(PLAN.v3Bindings.pairNumericAgreement.binding).toBe(
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_BINDING,
    );
    expect(PLAN.v3Bindings.pairNumericAgreement.binding.sha256).toBe(
      "872f17a82aead893b9371ded595c631ce8dc825152de2f545b0b2840f51d1cb8",
    );
    expect(PLAN.v3Bindings.pairNumericAgreement.sha256Domain).toBe(
      "nhm2-semiclassical-v3-pair-numeric-agreement-policy/v1\n",
    );
    expect(PLAN.v3Bindings.pairNumericAgreement.sha256Domain).toBe(
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_SHA256_DOMAIN,
    );
    expect(replay.pairComparisonInterpretation).toEqual({
      frozenInputAndDescriptorByteEqualityScope:
        "only_the_25_scientific_input_roles",
      roleSpecificImplementationBytesAndDescriptorsMustBeDistinct: true,
      pairPolicyBindingControlsNumericAgreement:
        NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_BINDING,
    });
  });

  it("uses the conservative four-bound regulator and exactly one genuine order", () => {
    const regulator = PLAN.totalConstraintDuty.regulator;
    expect(Object.keys(regulator.interlevelBounds)).toEqual([
      "D01Lower",
      "D01Upper",
      "D12Lower",
      "D12Upper",
      "pLower",
      "orderGate",
      "monotonicityGate",
      "onlyOneIndependentObservedOrderFromThreeLevels",
    ]);
    expect(regulator.interlevelBounds).toEqual({
      D01Lower: "max_i(max(0,abs(R_level_0-R_level_1)-(U_level_0+U_level_1)))",
      D01Upper: "max_i(abs(R_level_0-R_level_1)+U_level_0+U_level_1)",
      D12Lower: "max_i(max(0,abs(R_level_1-R_level_2)-(U_level_1+U_level_2)))",
      D12Upper: "max_i(abs(R_level_1-R_level_2)+U_level_1+U_level_2)",
      pLower: "log(D01Lower/D12Upper)/log(2)",
      orderGate: "D01Lower>0_and_D12Upper>0_and_pLower>=1",
      monotonicityGate: "D12Upper<=D01Lower+1e-12",
      onlyOneIndependentObservedOrderFromThreeLevels: true,
    });
    expect(regulator.errorRoles).toEqual({
      E0: "2*abs(R_level_0-R_level_1)",
      E1: "2*abs(R_level_1-R_level_2)",
      E2: "abs(R_level_1-R_level_2)",
      UE0: "2*(U_level_0+U_level_1)",
      UE1: "2*(U_level_1+U_level_2)",
      UE2: "U_level_1+U_level_2",
    });
    expect(regulator.exactZeroLevelDisposition).toBe(
      "blocked_as_order_inconclusive_without_synthetic_floor",
    );
    expect(regulator.minimumObservedOrder).toBe(1);
    expect(regulator.noPostObservationLevelOrCutoffChange).toBe(true);
    expect(regulator.perLevelOperandReplay.runtimeManifestPresent).toBe(false);
    expect(
      regulator.perLevelOperandReplay
        .serverDecoderAndArithmeticReplayImplementationPresent,
    ).toBe(true);
    expect(
      regulator.perLevelOperandReplay
        .serverDecoderAndArithmeticReplayExecutedForCandidate,
    ).toBe(false);
    expect(
      regulator.perLevelOperandReplay.serverDecoderAndArithmeticReplayAuthority,
    ).toBe(false);
    expect(
      regulator.perLevelOperandReplay.runtimeReplayStructurallyAdmissible,
    ).toBe(false);
    const serialized = JSON.stringify(PLAN);
    expect(serialized).not.toContain("adjacent_log_orders");
    expect(serialized).not.toContain("currentV2RawReplayLaneCompatible");
    expect(serialized).not.toContain("semiclassical_v2");
  });

  it("freezes the 25/3 closure, three receipt duties, and exact pair comparison rails", () => {
    expect(PLAN.inputClosureTopology.scientific.roles).toBe(
      NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_IDS,
    );
    expect(PLAN.inputClosureTopology.scientific).toMatchObject({
      roleCount: 25,
      exactBytesSharedAcrossPairRequired: true,
      frozenByScientificPreseal: true,
    });
    expect(PLAN.inputClosureTopology.implementation.roles).toBe(
      NHM2_SEMICLASSICAL_V3_IMPLEMENTATION_INPUT_IDS,
    );
    expect(PLAN.inputClosureTopology.implementation).toMatchObject({
      roleCount: 3,
      exactBytesSharedAcrossPairRequired: false,
      exactBytesDistinctAcrossPairRequired: true,
      descriptorsDistinctAcrossPairRequired: true,
      frozenByScientificPreseal: false,
    });
    expect(PLAN.inputClosureTopology.completeRun.roles).toBe(
      NHM2_SEMICLASSICAL_V3_REQUIRED_INPUT_IDS,
    );
    expect(PLAN.inputClosureTopology.completeRun).toMatchObject({
      roleCount: 28,
      mustBeFrozenBeforeExecution: true,
      primaryClosurePresent: false,
      independentClosurePresent: false,
      closuresStructurallyAdmissible: false,
    });
    expect(PLAN.derivationReceiptDuties.requiredRoles).toBe(
      NHM2_SEMICLASSICAL_V3_DERIVATION_EVIDENCE_SIDECAR_ROLES,
    );
    expect(PLAN.derivationReceiptDuties.requiredRoles).toEqual([
      "constraint_operand_derivation_receipt",
      "constraint_uncertainty_derivation_receipt",
      "constraint_target_derivation_receipt",
    ]);
    expect(PLAN.derivationReceiptDuties.uncertaintyDerivation).toMatchObject({
      perRunMinimumJointSimultaneousCoverage: 0.975,
      strongerDeterministicEnclosureAllowed: true,
      coverageRoleCount: 50,
      everyPrimitiveAndLinearResidualMustBeBounded: true,
      serverReplayRequired: true,
      marginalOrPointwise95Sufficient: false,
      pairIntersectionMinimumCoverage: 0.95,
    });
    expect(
      PLAN.derivationReceiptDuties.uncertaintyDerivation
        .coverageRoleOrderSha256,
    ).toBe(
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_COVERAGE_ROLE_ORDER_SHA256,
    );
    expect(PLAN.derivationReceiptDuties.targetDerivation).toMatchObject({
      serverReplayFromSealedGeometryAndExternalProbesRequired: true,
      computedTargetEqualityWithoutIndependentDerivationForbidden: true,
      targetMayReadComputedOrResidualArrays: false,
    });
    expect(PLAN.derivationReceiptDuties.sidecarsPresent).toBe(false);
    expect(PLAN.derivationReceiptDuties.sidecarsValue).toBeNull();
    expect(PLAN.derivationReceiptDuties.sidecarsStructurallyAdmissible).toBe(
      false,
    );

    const pair = PLAN.v3Bindings.pairNumericAgreement;
    expect(pair.rolePolicies).toBe(
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_ROLE_POLICIES,
    );
    expect(pair.rolePolicies).toHaveLength(68);
    expect(pair.coverageRoles).toBe(
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_COVERAGE_ROLES,
    );
    expect(pair.coverageRoles).toHaveLength(50);
    expect(pair.toleranceRetuningAllowed).toBe(false);
    expect(pair.policy.preregistrationAndVersioning).toMatchObject({
      postObservationToleranceRetuningAllowed: false,
      producerSelectedToleranceAllowed: false,
      changeRequiresNewPolicyContractVersion: true,
      changeRequiresNewCandidateId: true,
    });
    expect(pair.policy.futurePairInputBinding).toMatchObject({
      presealedNumericPolicyBindingIsMandatoryPairInput: true,
      primaryLaneNumericPolicySha256Required: true,
      independentLaneNumericPolicySha256Required: true,
      bothLaneValuesMustEqualPresealedPairPolicyBindingSha256: true,
    });
    expect(pair.groupPolicies).toMatchObject({
      noise_kernel: { absoluteTolerance: 1e-12, relativeTolerance: 1e-5 },
      mean_rset: { absoluteTolerance: 1e-12, relativeTolerance: 1e-6 },
      smearing_weights: {
        absoluteTolerance: 1e-12,
        relativeTolerance: 1e-10,
      },
      normalized_constraint_operand: {
        absoluteTolerance: 1e-12,
        relativeTolerance: 1e-6,
      },
    });
    expect(
      pair.rolePolicies.filter(
        (entry) =>
          entry.comparisonKind === "scientific_value_with_uncertainty_envelope",
      ),
    ).toHaveLength(50);
    expect(
      pair.rolePolicies.filter(
        (entry) => entry.comparisonKind === "uncertainty_estimator_factor_four",
      ),
    ).toHaveLength(17);
    expect(
      pair.rolePolicies.filter(
        (entry) =>
          entry.comparisonKind ===
          "scientific_value_without_uncertainty_envelope",
      ),
    ).toHaveLength(1);
  });

  it("keeps every solve, output, authority artifact, and epoch lamp absent", () => {
    expect(PLAN.frozenBranchSelector.omegaOverMu).toBeNull();
    expect(PLAN.selfConsistency.converged).toBeNull();
    expect(PLAN.selfConsistency.residualRelativeLInf).toBeNull();
    expect(PLAN.governedOutputPlan.valuesPresent).toBe(false);
    expect(PLAN.governedOutputPlan.meanRset.value).toBeNull();
    expect(PLAN.governedOutputPlan.connectedNoiseKernel.value).toBeNull();
    expect(PLAN.governedOutputPlan.rawArrays).toBeNull();
    expect(PLAN.totalConstraintDuty.result).toBeNull();
    expect(
      Object.values(PLAN.unresolvedEvidence).every((value) => value === null),
    ).toBe(true);
    for (const boundary of Object.values(PLAN.absentAuthorityBoundary)) {
      expect(boundary).toEqual({
        present: false,
        value: null,
        structurallyAdmissible: false,
      });
    }
    expect(PLAN.inputClosureTopology.scientificPreseal).toMatchObject({
      present: false,
      value: null,
      structurallyAdmissible: false,
    });
    expect(PLAN.blockers).toBe(
      NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BLOCKERS,
    );
    expect(PLAN.claimLockKeys).toBe(
      NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCK_KEYS,
    );
    expect(PLAN.claimLocks).toBe(
      NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCKS,
    );
    expect(PLAN.claimLockKeys).toHaveLength(27);
    expect(Object.keys(PLAN.claimLocks)).toEqual([...PLAN.claimLockKeys]);
    expect(
      Object.values(PLAN.claimLocks).every((value) => value === false),
    ).toBe(true);
    expect(
      Object.values(PLAN.v3Bindings.replayEpoch.policy.authorityBoundary).every(
        (value) => value === false,
      ),
    ).toBe(true);
    expect(
      Object.values(
        PLAN.v3Bindings.pairNumericAgreement.policy.authorityBoundary,
      ).every((value) => value === false),
    ).toBe(true);
  });

  it("is recursively frozen and singleton-authoritative", () => {
    expect(everyObjectFrozen(PLAN)).toBe(true);
    expect(nhm2ProlateBosonStarCoherentCandidatePlanV2Violations(PLAN)).toEqual(
      [],
    );
    expect(isNhm2ProlateBosonStarCoherentCandidatePlanV2(PLAN)).toBe(true);

    const externalV2 = jsonClone(PLAN);
    expect(
      nhm2ProlateBosonStarCoherentCandidatePlanV2Violations(externalV2),
    ).toEqual(["candidate_plan_v2_external_copy_not_authoritative"]);
    expect(isNhm2ProlateBosonStarCoherentCandidatePlanV2(externalV2)).toBe(
      false,
    );
    expect(
      nhm2ProlateBosonStarCoherentCandidatePlanV2Violations(V1_PLAN),
    ).toEqual(["candidate_plan_v2_semantic_mismatch"]);
    expect(
      nhm2ProlateBosonStarCoherentCandidatePlanV2Violations(jsonClone(V1_PLAN)),
    ).toEqual(["candidate_plan_v2_semantic_mismatch"]);

    const retuned = jsonClone(PLAN) as any;
    retuned.v3Bindings.pairNumericAgreement.groupPolicies.mean_rset.relativeTolerance = 1e-5;
    expect(
      nhm2ProlateBosonStarCoherentCandidatePlanV2Violations(retuned),
    ).toEqual(["candidate_plan_v2_semantic_mismatch"]);

    const unlocked = jsonClone(PLAN) as any;
    unlocked.claimLocks.diagnosticPass = true;
    expect(
      nhm2ProlateBosonStarCoherentCandidatePlanV2Violations(unlocked),
    ).toEqual(["candidate_plan_v2_semantic_mismatch"]);
  });

  it("rejects accessors, hidden keys, symbols, sparse arrays, and hostile proxies", () => {
    let getterCalls = 0;
    const accessor = jsonClone(PLAN) as any;
    Object.defineProperty(accessor.candidateIdentity, "candidateId", {
      enumerable: true,
      get: () => {
        getterCalls += 1;
        return NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_CANDIDATE_ID;
      },
    });
    expect(
      nhm2ProlateBosonStarCoherentCandidatePlanV2Violations(accessor)[0],
    ).toContain("object_property_surface");
    expect(getterCalls).toBe(0);

    const hidden = jsonClone(PLAN) as any;
    Object.defineProperty(hidden, "hidden", { value: true, enumerable: false });
    expect(
      nhm2ProlateBosonStarCoherentCandidatePlanV2Violations(hidden)[0],
    ).toContain("object_property_surface");

    const symbol = jsonClone(PLAN) as any;
    symbol[Symbol("hidden")] = true;
    expect(
      nhm2ProlateBosonStarCoherentCandidatePlanV2Violations(symbol)[0],
    ).toContain("symbol_key");

    const sparse = jsonClone(PLAN) as any;
    delete sparse.v3Bindings.replayEpoch.outputRoles[0];
    expect(
      nhm2ProlateBosonStarCoherentCandidatePlanV2Violations(sparse)[0],
    ).toContain("array_surface");

    const cyclic = jsonClone(PLAN) as any;
    cyclic.self = cyclic;
    expect(
      nhm2ProlateBosonStarCoherentCandidatePlanV2Violations(cyclic)[0],
    ).toContain("cyclic_value");

    expect(
      nhm2ProlateBosonStarCoherentCandidatePlanV2Violations(
        new Proxy(jsonClone(PLAN), {}),
      ),
    ).toEqual(["candidate_plan_v2_external_copy_not_authoritative"]);

    const throwingProxy = new Proxy(jsonClone(PLAN), {
      getPrototypeOf: () => {
        throw new Error("hostile");
      },
    });
    expect(
      nhm2ProlateBosonStarCoherentCandidatePlanV2Violations(throwingProxy),
    ).toEqual(["candidate_plan_v2_plain_data_snapshot_invalid"]);

    const revocable = Proxy.revocable(jsonClone(PLAN), {});
    revocable.revoke();
    expect(
      nhm2ProlateBosonStarCoherentCandidatePlanV2Violations(revocable.proxy),
    ).toEqual(["candidate_plan_v2_plain_data_snapshot_invalid"]);
  });

  it("bounds hostile snapshot depth, nodes, arrays, object width, and UTF-8 strings", () => {
    const limits =
      NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_VALIDATOR_LIMITS;
    expect(limits).toEqual({
      maximumDepth: 32,
      maximumNodes: 8192,
      maximumArrayLength: 512,
      maximumObjectPropertyCount: 256,
      maximumStringUtf8Bytes: 8192,
    });

    const longString = jsonClone(PLAN) as any;
    longString.authority = "x".repeat(limits.maximumStringUtf8Bytes + 1);
    expect(
      nhm2ProlateBosonStarCoherentCandidatePlanV2Violations(longString),
    ).toEqual(["string_byte_length_limit:/authority"]);

    const deep = jsonClone(PLAN) as any;
    let cursor: Record<string, unknown> = {};
    deep.deep = cursor;
    for (let index = 0; index <= limits.maximumDepth; index += 1) {
      const next: Record<string, unknown> = {};
      cursor.next = next;
      cursor = next;
    }
    expect(
      nhm2ProlateBosonStarCoherentCandidatePlanV2Violations(deep)[0],
    ).toMatch(/^snapshot_depth_limit:/);

    const wide = jsonClone(PLAN) as any;
    wide.wide = Object.fromEntries(
      Array.from(
        { length: limits.maximumObjectPropertyCount + 1 },
        (_, index) => [`k${index}`, index],
      ),
    );
    expect(nhm2ProlateBosonStarCoherentCandidatePlanV2Violations(wide)).toEqual(
      ["object_property_count_limit:/wide"],
    );

    const tooLong = jsonClone(PLAN) as any;
    const longArray: unknown[] = [];
    longArray.length = limits.maximumArrayLength + 1;
    let ownKeysCalls = 0;
    tooLong.v3Bindings.replayEpoch.outputRoles = new Proxy(longArray, {
      ownKeys(target) {
        ownKeysCalls += 1;
        return Reflect.ownKeys(target);
      },
    });
    expect(
      nhm2ProlateBosonStarCoherentCandidatePlanV2Violations(tooLong),
    ).toEqual(["array_length_limit:/v3Bindings/replayEpoch/outputRoles"]);
    expect(ownKeysCalls).toBe(0);

    const tooManyNodes = jsonClone(PLAN) as any;
    tooManyNodes.nodeBomb = Array.from(
      { length: limits.maximumArrayLength },
      () => ({ values: Array.from({ length: 16 }, () => 0) }),
    );
    expect(
      nhm2ProlateBosonStarCoherentCandidatePlanV2Violations(tooManyNodes)[0],
    ).toMatch(/^snapshot_node_limit:/);
  });
});
