import { createHash } from "node:crypto";
import { NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN as V1_PLAN } from "./nhm2-prolate-boson-star-coherent-candidate-plan.v1";
import {
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_BINDING,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARRAY_COUNT,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_FAMILY_ORDER,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_LEVELS,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_OUTPUT_ROLES,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_ROLE_ORDER,
  NHM2_SEMICLASSICAL_V3_DECODED_FLOAT64_ARRAY_COUNT,
  NHM2_SEMICLASSICAL_V3_DECODED_FLOAT64_VALUE_COUNT,
  NHM2_SEMICLASSICAL_V3_DECODED_SIZE_BYTES,
  NHM2_SEMICLASSICAL_V3_DERIVATION_EVIDENCE_SIDECAR_COUNT,
  NHM2_SEMICLASSICAL_V3_DERIVATION_EVIDENCE_SIDECAR_ROLES,
  NHM2_SEMICLASSICAL_V3_DERIVATION_SIDECAR_ROLE_ORDER_SHA256,
  NHM2_SEMICLASSICAL_V3_IMPLEMENTATION_INPUT_IDS,
  NHM2_SEMICLASSICAL_V3_IMPLEMENTATION_INPUT_ROLE_ORDER_SHA256,
  NHM2_SEMICLASSICAL_V3_INPUT_ROLE_ORDER_SHA256,
  NHM2_SEMICLASSICAL_V3_METRIC_DEMAND_INPUT_ARRAY_COUNT,
  NHM2_SEMICLASSICAL_V3_OUTPUT_ARRAY_COUNT,
  NHM2_SEMICLASSICAL_V3_OUTPUT_FLOAT64_VALUE_COUNT,
  NHM2_SEMICLASSICAL_V3_OUTPUT_ROLE_ORDER_SHA256,
  NHM2_SEMICLASSICAL_V3_OUTPUT_ROLES,
  NHM2_SEMICLASSICAL_V3_OUTPUT_SIZE_BYTES,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCK_KEYS,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCKS,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_BINDING,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_SHA256_DOMAIN,
  NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_COVERAGE_SHA256,
  NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_COUNT,
  NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_IDS,
  NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_IDS_SHA256,
  NHM2_SEMICLASSICAL_V3_REQUIRED_INPUT_IDS,
  NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_IDS,
  NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_ROLE_ORDER_SHA256,
  NHM2_SEMICLASSICAL_V3_SOLVER_SCIENCE_PAYLOAD_FILE_COUNT,
} from "./nhm2-semiclassical-v3-replay-epoch.v1";
import {
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_COMPLETE_INPUT_CLOSURE_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_COMPLETE_INPUT_CLOSURE_CONTRACT_VERSION,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_COMPLETE_INPUT_CLOSURE_SHA256_DOMAIN,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_ARRAY_SIZE_BYTES,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_ARRAYS_PER_LEVEL,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_INVENTORY_SHA256_DOMAIN,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_MANIFEST_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_MANIFEST_CONTRACT_VERSION,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_SCHEMA_BOUNDARY,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_PRESEAL_SHA256_DOMAIN,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_SCIENTIFIC_INPUT_CLOSURE_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_SCIENTIFIC_INPUT_CLOSURE_CONTRACT_VERSION,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_SCIENTIFIC_INPUT_CLOSURE_SHA256_DOMAIN,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_SCIENTIFIC_PRESEAL_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_SCIENTIFIC_PRESEAL_CONTRACT_VERSION,
} from "./nhm2-semiclassical-v3-constraint-operand-manifest.v1";
import {
  NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_COVERAGE_ROLES,
  NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_COVERAGE_ROLE_ORDER_SHA256,
  NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_GROUP_POLICIES,
  NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY,
  NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_BINDING,
  NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_SHA256_DOMAIN,
  NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_ROLE_POLICIES,
  NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_ROLE_TO_UNCERTAINTY_ROLE,
} from "./nhm2-semiclassical-v3-pair-numeric-agreement-policy.v1";

export const NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_ARTIFACT_ID =
  "nhm2.prolate_boson_star_coherent_candidate_plan" as const;
export const NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_CONTRACT_VERSION =
  "nhm2_prolate_boson_star_coherent_candidate_plan/v2" as const;
export const NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_CANDIDATE_ID =
  "nhm2.semiclassical_v3.prolate_boson_star_2p_weak_field_plan/v2" as const;

export const NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING_PINS =
  Object.freeze({
    replayEpochPolicySha256:
      "72809f7bf15551886994ee80bf3f67d793d4024e2c64decd838f9c6d6795413f",
    constraintArithmeticPolicySha256:
      "ec6dc71043c35d20b74efe0053ae2b3665af6ec9ac9c2d5c36e2911b89defeb8",
    pairNumericAgreementPolicySha256:
      "872f17a82aead893b9371ded595c631ce8dc825152de2f545b0b2840f51d1cb8",
    inputRoleOrderSha256:
      "a2d6c6c256b7dbfcbb87873a9cd5659d471a8a92b38e9720192aa83d6023994b",
    scientificInputRoleOrderSha256:
      "fbefe8a647f1a11c81148a931258a850b6b41041927552bb76429197f12e238b",
    implementationInputRoleOrderSha256:
      "4977f5339269383309287bf5f3e81a33c108e8e212eebc281591cbee020b9406",
    outputRoleOrderSha256:
      "95ce1862e00c151f7bb36e483e7fffbe7c08b23791f8682dff4a0268b688f227",
    derivationSidecarRoleOrderSha256:
      "9ec55cfe0f5b109166abc72e35b08a5e2dbc0dfbf2ec1c43341cda01a40a917b",
    replayMetricLeafIdsSha256:
      "99eb0b2077bea07be03a3fe08db126c5014f6801c0ac6bb220c6dd2723aa7498",
    replayMetricCoverageSha256:
      "b9c806970fbe853603ad666ee454a6e16f0a9aebd85903b4de9e41098586b574",
    pairCoverageRoleOrderSha256:
      "67ded14423f2d9761b8abdc92b8d24d2b7693f6eda12987402645f2bb5fad1ec",
  } as const);

export const NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BLOCKERS =
  Object.freeze([
    "boson_star_branch_not_solved",
    "covariant_metric_error_not_enclosed",
    "self_consistent_semiclassical_backreaction_not_converged",
    "hadamard_mode_sum_not_computed",
    "renormalized_mean_rset_not_computed",
    "connected_noise_kernel_not_computed",
    "total_effective_action_constraint_algebra_not_computed",
    "v3_constraint_operand_manifest_not_produced",
    "v3_target_derivation_receipt_not_replayed",
    "v3_joint_97p5_percent_uncertainty_receipt_not_replayed",
    "qei_and_preparation_switching_not_evaluated",
    "primary_runtime_provenance_missing",
    "independent_implementation_not_executed",
    "candidate_manifest_and_scientific_preseal_absent",
    "v3_raw_replay_not_executed_for_candidate",
    "v3_pair_numeric_agreement_not_executed",
  ] as const);

export const NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_VALIDATOR_LIMITS =
  Object.freeze({
    maximumDepth: 32,
    maximumNodes: 8192,
    maximumArrayLength: 512,
    maximumObjectPropertyCount: 256,
    maximumStringUtf8Bytes: 8192,
  } as const);

const {
  perLevelOperandReplay: _STALE_V1_OPERAND_REPLAY,
  interlevelDifferences: _STALE_V1_INTERLEVEL_DIFFERENCES,
  ...VALID_V1_REGULATOR_SCIENCE
} = V1_PLAN.totalConstraintDuty.regulator;

const PLAN = {
  artifactId: NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_ARTIFACT_ID,
  contractVersion:
    NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_CONTRACT_VERSION,
  authority: "preregistered_science_plan_only",
  maturity: "v3_diagnostic_candidate_selection_only_all_execution_absent",
  selectionFrozen: true,
  scientificCandidateAdmissible: false,
  bindingPins: NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING_PINS,
  scienceInheritance: {
    sourceContractVersion: V1_PLAN.contractVersion,
    unchangedFrozenSections: [
      "conventions",
      "matterModel",
      "frozenBranchSelector",
      "jointSemiclassicalState",
      "renormalization",
      "selfConsistency",
      "chartTetradSamplingAndSmearing",
      "primaryScientificReferences",
    ],
    staleV1ExecutionOrReplaySemanticsInherited: false,
  },
  candidateIdentity: {
    ...V1_PLAN.candidateIdentity,
    candidateId:
      NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_CANDIDATE_ID,
    scientificRole:
      "fresh_joint_geometry_state_benchmark_for_the_semiclassical_v3_lane",
  },
  conventions: V1_PLAN.conventions,
  matterModel: V1_PLAN.matterModel,
  frozenBranchSelector: V1_PLAN.frozenBranchSelector,
  jointSemiclassicalState: V1_PLAN.jointSemiclassicalState,
  renormalization: V1_PLAN.renormalization,
  selfConsistency: V1_PLAN.selfConsistency,
  chartTetradSamplingAndSmearing: V1_PLAN.chartTetradSamplingAndSmearing,
  governedOutputPlan: {
    ...V1_PLAN.governedOutputPlan,
    outputRoleOrder: NHM2_SEMICLASSICAL_V3_OUTPUT_ROLES,
    outputRoleOrderSha256: NHM2_SEMICLASSICAL_V3_OUTPUT_ROLE_ORDER_SHA256,
    outputArrayCount: NHM2_SEMICLASSICAL_V3_OUTPUT_ARRAY_COUNT,
    metricDemandInputArrayCount:
      NHM2_SEMICLASSICAL_V3_METRIC_DEMAND_INPUT_ARRAY_COUNT,
    decodedFloat64ArrayCount: NHM2_SEMICLASSICAL_V3_DECODED_FLOAT64_ARRAY_COUNT,
    solverSciencePayloadFileCount:
      NHM2_SEMICLASSICAL_V3_SOLVER_SCIENCE_PAYLOAD_FILE_COUNT,
    replayMetricLeafCount: NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_COUNT,
  },
  totalConstraintDuty: {
    ...V1_PLAN.totalConstraintDuty,
    v3ConstraintOperandManifestSchema: {
      artifactId: NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_MANIFEST_ARTIFACT_ID,
      contractVersion:
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_MANIFEST_CONTRACT_VERSION,
      operandInventorySha256Domain:
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_INVENTORY_SHA256_DOMAIN,
      operandArraySizeBytes:
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_ARRAY_SIZE_BYTES,
      operandArraysPerLevel:
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_ARRAYS_PER_LEVEL,
      operandArrayCount: NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARRAY_COUNT,
      levels: NHM2_SEMICLASSICAL_V3_CONSTRAINT_LEVELS,
      familyOrder: NHM2_SEMICLASSICAL_V3_CONSTRAINT_FAMILY_ORDER,
      roleOrder: NHM2_SEMICLASSICAL_V3_CONSTRAINT_ROLE_ORDER,
      outputRoles: NHM2_SEMICLASSICAL_V3_CONSTRAINT_OUTPUT_ROLES,
      schemaBoundary: NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_SCHEMA_BOUNDARY,
      runtimeManifest: null,
      runtimeManifestStructurallyAdmissible: false,
    },
    regulator: {
      ...VALID_V1_REGULATOR_SCIENCE,
      perLevelOperandReplay: {
        standaloneSchemaContract:
          NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_MANIFEST_CONTRACT_VERSION,
        standaloneSchemaImplemented: true,
        serverDecoderAndArithmeticReplayImplementationPresent: true,
        serverDecoderAndArithmeticReplayExecutedForCandidate: false,
        serverDecoderAndArithmeticReplayAuthority: false,
        currentV3RawReplayLaneCompatible: true,
        familyOrder: NHM2_SEMICLASSICAL_V3_CONSTRAINT_FAMILY_ORDER,
        levelOrder: NHM2_SEMICLASSICAL_V3_CONSTRAINT_LEVELS,
        sampleCount: 64,
        channelCount: 4,
        operandArraysPerLevel:
          NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_ARRAYS_PER_LEVEL,
        operandArrayCount: NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARRAY_COUNT,
        serverMustRecomputeEveryFamilyResidualBeforeDifferencing: true,
        serverMustEvaluateConvergenceSeparatelyForEveryFamily: true,
        producerDerivedAggregateRegulatorArraysSufficient: false,
        runtimeManifestPresent: false,
        runtimeReplayStructurallyAdmissible: false,
      },
      interlevelBounds: {
        D01Lower:
          NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY.interlevelBounds
            .D01Lower,
        D01Upper:
          NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY.interlevelBounds
            .D01Upper,
        D12Lower:
          NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY.interlevelBounds
            .D12Lower,
        D12Upper:
          NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY.interlevelBounds
            .D12Upper,
        pLower:
          NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY.conservativeOrderLower,
        orderGate: NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY.orderGate,
        monotonicityGate:
          NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY.monotonicityGate,
        onlyOneIndependentObservedOrderFromThreeLevels: true,
      },
      errorRoles:
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY.conservativeErrorRoles,
      uncertaintyRoles: {
        level0: "U_E0=2*(U_level0+U_level1)",
        level1: "U_E1=2*(U_level1+U_level2)",
        level2: "U_E2=U_level1+U_level2",
      },
      conservativeErrorAssumption:
        "p_min=1_bounds_are_frozen_and_never_reduced_by_the_single_reported_pLower",
      serverReplayOrder:
        "for_each_family_server_recomputes_R_level_and_U_level_then_D01Lower_D01Upper_D12Lower_D12Upper_pLower_monotone_and_finalErrorUpper95_with_global_pass_only_if_every_family_passes",
      exactZeroLevelDisposition:
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY.exactZeroDisposition,
      minimumObservedOrder:
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY.requiredMinimumOrder,
      noPostObservationLevelOrCutoffChange: true,
    },
    result: null,
  },
  v3Bindings: {
    replayEpoch: {
      policy: NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY,
      binding: NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_BINDING,
      sha256Domain: NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_SHA256_DOMAIN,
      inputRoles: NHM2_SEMICLASSICAL_V3_REQUIRED_INPUT_IDS,
      inputRoleOrderSha256: NHM2_SEMICLASSICAL_V3_INPUT_ROLE_ORDER_SHA256,
      scientificInputRoles: NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_IDS,
      scientificInputRoleOrderSha256:
        NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_ROLE_ORDER_SHA256,
      implementationInputRoles: NHM2_SEMICLASSICAL_V3_IMPLEMENTATION_INPUT_IDS,
      implementationInputRoleOrderSha256:
        NHM2_SEMICLASSICAL_V3_IMPLEMENTATION_INPUT_ROLE_ORDER_SHA256,
      outputRoles: NHM2_SEMICLASSICAL_V3_OUTPUT_ROLES,
      outputRoleOrderSha256: NHM2_SEMICLASSICAL_V3_OUTPUT_ROLE_ORDER_SHA256,
      derivationSidecarRoles:
        NHM2_SEMICLASSICAL_V3_DERIVATION_EVIDENCE_SIDECAR_ROLES,
      derivationSidecarRoleOrderSha256:
        NHM2_SEMICLASSICAL_V3_DERIVATION_SIDECAR_ROLE_ORDER_SHA256,
      replayMetricLeafIds: NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_IDS,
      replayMetricLeafIdsSha256:
        NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_IDS_SHA256,
      replayMetricCoverageSha256:
        NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_COVERAGE_SHA256,
      counts: {
        scientificInputs: 25,
        implementationInputs: 3,
        totalInputs: 28,
        outputArrays: NHM2_SEMICLASSICAL_V3_OUTPUT_ARRAY_COUNT,
        metricDemandInputArrays:
          NHM2_SEMICLASSICAL_V3_METRIC_DEMAND_INPUT_ARRAY_COUNT,
        decodedFloat64Arrays: NHM2_SEMICLASSICAL_V3_DECODED_FLOAT64_ARRAY_COUNT,
        derivationSidecars:
          NHM2_SEMICLASSICAL_V3_DERIVATION_EVIDENCE_SIDECAR_COUNT,
        solverSciencePayloadFiles:
          NHM2_SEMICLASSICAL_V3_SOLVER_SCIENCE_PAYLOAD_FILE_COUNT,
        replayMetricLeaves: NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_COUNT,
        outputFloat64Values: NHM2_SEMICLASSICAL_V3_OUTPUT_FLOAT64_VALUE_COUNT,
        decodedFloat64Values: NHM2_SEMICLASSICAL_V3_DECODED_FLOAT64_VALUE_COUNT,
        outputSizeBytes: NHM2_SEMICLASSICAL_V3_OUTPUT_SIZE_BYTES,
        decodedSizeBytes: NHM2_SEMICLASSICAL_V3_DECODED_SIZE_BYTES,
      },
      pairComparisonInterpretation: {
        frozenInputAndDescriptorByteEqualityScope:
          "only_the_25_scientific_input_roles",
        roleSpecificImplementationBytesAndDescriptorsMustBeDistinct: true,
        pairPolicyBindingControlsNumericAgreement:
          NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_BINDING,
      },
    },
    constraintArithmetic: {
      policy: NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY,
      binding: NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_BINDING,
    },
    pairNumericAgreement: {
      policy: NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY,
      binding: NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_BINDING,
      sha256Domain:
        NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_SHA256_DOMAIN,
      groupPolicies:
        NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_GROUP_POLICIES,
      rolePolicies: NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_ROLE_POLICIES,
      roleToUncertaintyRole:
        NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_ROLE_TO_UNCERTAINTY_ROLE,
      coverageRoles:
        NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_COVERAGE_ROLES,
      coverageRoleOrderSha256:
        NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_COVERAGE_ROLE_ORDER_SHA256,
      rolePolicyCount: 68,
      toleranceRetuningAllowed: false,
      pairExecutionPresent: false,
      pairExecutionStructurallyAdmissible: false,
    },
  },
  inputClosureTopology: {
    scientific: {
      artifactId:
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_SCIENTIFIC_INPUT_CLOSURE_ARTIFACT_ID,
      contractVersion:
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_SCIENTIFIC_INPUT_CLOSURE_CONTRACT_VERSION,
      sha256Domain:
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_SCIENTIFIC_INPUT_CLOSURE_SHA256_DOMAIN,
      roles: NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_IDS,
      roleCount: 25,
      roleOrderSha256: NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_ROLE_ORDER_SHA256,
      exactBytesSharedAcrossPairRequired: true,
      frozenByScientificPreseal: true,
    },
    implementation: {
      roles: NHM2_SEMICLASSICAL_V3_IMPLEMENTATION_INPUT_IDS,
      roleCount: 3,
      roleOrderSha256:
        NHM2_SEMICLASSICAL_V3_IMPLEMENTATION_INPUT_ROLE_ORDER_SHA256,
      exactBytesSharedAcrossPairRequired: false,
      exactBytesDistinctAcrossPairRequired: true,
      descriptorsDistinctAcrossPairRequired: true,
      frozenByScientificPreseal: false,
    },
    completeRun: {
      artifactId:
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_COMPLETE_INPUT_CLOSURE_ARTIFACT_ID,
      contractVersion:
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_COMPLETE_INPUT_CLOSURE_CONTRACT_VERSION,
      sha256Domain:
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_COMPLETE_INPUT_CLOSURE_SHA256_DOMAIN,
      roles: NHM2_SEMICLASSICAL_V3_REQUIRED_INPUT_IDS,
      roleCount: 28,
      roleOrderSha256: NHM2_SEMICLASSICAL_V3_INPUT_ROLE_ORDER_SHA256,
      mustBeFrozenBeforeExecution: true,
      primaryClosurePresent: false,
      independentClosurePresent: false,
      closuresStructurallyAdmissible: false,
    },
    scientificPreseal: {
      artifactId:
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_SCIENTIFIC_PRESEAL_ARTIFACT_ID,
      contractVersion:
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_SCIENTIFIC_PRESEAL_CONTRACT_VERSION,
      sha256Domain: NHM2_SEMICLASSICAL_V3_CONSTRAINT_PRESEAL_SHA256_DOMAIN,
      present: false,
      value: null,
      structurallyAdmissible: false,
    },
  },
  derivationReceiptDuties: {
    requiredRoles: NHM2_SEMICLASSICAL_V3_DERIVATION_EVIDENCE_SIDECAR_ROLES,
    requiredRoleCount: NHM2_SEMICLASSICAL_V3_DERIVATION_EVIDENCE_SIDECAR_COUNT,
    requiredRoleOrderSha256:
      NHM2_SEMICLASSICAL_V3_DERIVATION_SIDECAR_ROLE_ORDER_SHA256,
    everyRunMustProduceAllThreeBeforeReplay: true,
    operandDerivation: {
      role: "constraint_operand_derivation_receipt",
      all63ConstraintArraysBoundToSealedOperands: true,
      producerAggregateRegulatorArraysSufficient: false,
    },
    uncertaintyDerivation: {
      role: "constraint_uncertainty_derivation_receipt",
      perRunMinimumJointSimultaneousCoverage: 0.975,
      strongerDeterministicEnclosureAllowed: true,
      coverageRoleCount: 50,
      coverageRoleOrderSha256:
        NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_COVERAGE_ROLE_ORDER_SHA256,
      everyPrimitiveAndLinearResidualMustBeBounded: true,
      serverReplayRequired: true,
      marginalOrPointwise95Sufficient: false,
      pairIntersectionMinimumCoverage: 0.95,
    },
    targetDerivation: {
      role: "constraint_target_derivation_receipt",
      serverReplayFromSealedGeometryAndExternalProbesRequired: true,
      computedTargetEqualityWithoutIndependentDerivationForbidden: true,
      targetMayReadComputedOrResidualArrays: false,
    },
    crossBinding: {
      candidateIdRequired: true,
      scientificPresealSha256Required: true,
      runIdRequired: true,
      implementationIdRequired: true,
      replayEpochPolicySha256Required: true,
      constraintArithmeticPolicySha256Required: true,
      pairNumericPolicySha256Required: true,
      roleOrderHashesRequired: true,
    },
    sidecarsPresent: false,
    sidecarsValue: null,
    sidecarsStructurallyAdmissible: false,
  },
  implementationSeparationPlan: {
    ...V1_PLAN.implementationSeparationPlan,
    sharedInputsAllowed:
      "only_the_exact_25_role_frozen_scientific_input_closure",
    roleSpecificImplementationInputs: [
      "implementation_source",
      "dependency_lock",
      "executable",
    ],
    roleSpecificImplementationInputBytesMustBeDistinct: true,
    completeRunClosuresMustBeDistinct: true,
    outputDirectoriesMustBeDisjoint: true,
    crossRunScientificOutputReadForbidden: true,
  },
  primaryScientificReferences: V1_PLAN.primaryScientificReferences,
  blockers: NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BLOCKERS,
  unresolvedEvidence: {
    solvedFrequencyOverMu: null,
    solvedGeometrySha256: null,
    solvedStateSha256: null,
    conservationCorrectionSha256: null,
    metricDemandArrays: null,
    meanRsetArrays: null,
    connectedNoiseArrays: null,
    constraintArrays: null,
    regulatorEvidence: null,
    runtimeReceipt: null,
    candidateManifest: null,
    scientificPreseal: null,
    constraintOperandManifest: null,
    derivationSidecars: null,
    replayReceipt: null,
    independentPairReceipt: null,
    stressNoiseLampReceipt: null,
    constraintAlgebraLampReceipt: null,
  },
  absentAuthorityBoundary: {
    branchSolve: { present: false, value: null, structurallyAdmissible: false },
    rsetAndNoise: {
      present: false,
      value: null,
      structurallyAdmissible: false,
    },
    totalConstraints: {
      present: false,
      value: null,
      structurallyAdmissible: false,
    },
    candidateManifest: {
      present: false,
      value: null,
      structurallyAdmissible: false,
    },
    scientificPreseal: {
      present: false,
      value: null,
      structurallyAdmissible: false,
    },
    replayReceipt: {
      present: false,
      value: null,
      structurallyAdmissible: false,
    },
    independentPairReceipt: {
      present: false,
      value: null,
      structurallyAdmissible: false,
    },
    lamps: { present: false, value: null, structurallyAdmissible: false },
  },
  claimLockKeys: NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCK_KEYS,
  claimLocks: NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCKS,
} as const;

const deepFreeze = <T>(value: T, seen = new Set<object>()): T => {
  if (value == null || typeof value !== "object" || seen.has(value as object)) {
    return value;
  }
  seen.add(value as object);
  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreeze(child, seen);
  }
  return Object.freeze(value);
};

export const NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2 =
  deepFreeze(PLAN);

const assertV2Invariants = (): void => {
  const pins = NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING_PINS;
  const pairRolePolicies =
    NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_ROLE_POLICIES;
  if (
    NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_BINDING.sha256 !==
      pins.replayEpochPolicySha256 ||
    NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_BINDING.sha256 !==
      pins.constraintArithmeticPolicySha256 ||
    NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_BINDING.sha256 !==
      pins.pairNumericAgreementPolicySha256 ||
    NHM2_SEMICLASSICAL_V3_INPUT_ROLE_ORDER_SHA256 !==
      pins.inputRoleOrderSha256 ||
    NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_ROLE_ORDER_SHA256 !==
      pins.scientificInputRoleOrderSha256 ||
    NHM2_SEMICLASSICAL_V3_IMPLEMENTATION_INPUT_ROLE_ORDER_SHA256 !==
      pins.implementationInputRoleOrderSha256 ||
    NHM2_SEMICLASSICAL_V3_OUTPUT_ROLE_ORDER_SHA256 !==
      pins.outputRoleOrderSha256 ||
    NHM2_SEMICLASSICAL_V3_DERIVATION_SIDECAR_ROLE_ORDER_SHA256 !==
      pins.derivationSidecarRoleOrderSha256 ||
    NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_IDS_SHA256 !==
      pins.replayMetricLeafIdsSha256 ||
    NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_COVERAGE_SHA256 !==
      pins.replayMetricCoverageSha256 ||
    NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_COVERAGE_ROLE_ORDER_SHA256 !==
      pins.pairCoverageRoleOrderSha256 ||
    NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_IDS.length !== 25 ||
    NHM2_SEMICLASSICAL_V3_IMPLEMENTATION_INPUT_IDS.length !== 3 ||
    NHM2_SEMICLASSICAL_V3_REQUIRED_INPUT_IDS.length !== 28 ||
    NHM2_SEMICLASSICAL_V3_OUTPUT_ROLES.length !== 68 ||
    NHM2_SEMICLASSICAL_V3_DECODED_FLOAT64_ARRAY_COUNT !== 70 ||
    NHM2_SEMICLASSICAL_V3_SOLVER_SCIENCE_PAYLOAD_FILE_COUNT !== 71 ||
    NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_IDS.length !== 159 ||
    NHM2_SEMICLASSICAL_V3_DERIVATION_EVIDENCE_SIDECAR_ROLES.length !== 3 ||
    NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCK_KEYS.length !== 27 ||
    Object.values(NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCKS).some(
      (value) => value !== false,
    ) ||
    pairRolePolicies.length !== 68 ||
    pairRolePolicies.filter(
      (entry) =>
        entry.comparisonKind === "scientific_value_with_uncertainty_envelope",
    ).length !== 50 ||
    pairRolePolicies.filter(
      (entry) => entry.comparisonKind === "uncertainty_estimator_factor_four",
    ).length !== 17 ||
    pairRolePolicies.filter(
      (entry) =>
        entry.comparisonKind ===
        "scientific_value_without_uncertainty_envelope",
    ).length !== 1
  ) {
    throw new Error(
      "nhm2_prolate_boson_star_coherent_candidate_plan_v2_invariant_violation",
    );
  }
};

assertV2Invariants();

export type Nhm2ProlateBosonStarCoherentCandidatePlanV2 =
  typeof NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2;

type SnapshotResult =
  | Readonly<{ ok: true; value: unknown }>
  | Readonly<{ ok: false; violation: string }>;

type SnapshotBudget = { visitedNodes: number };

const FORBIDDEN_KEYS = new Set([
  "__proto__",
  "prototype",
  "constructor",
  "toString",
  "valueOf",
  "hasOwnProperty",
]);

const snapshotPlainData = (
  value: unknown,
  pointer = "",
  ancestors = new Set<object>(),
  depth = 0,
  budget: SnapshotBudget = { visitedNodes: 0 },
): SnapshotResult => {
  const limits =
    NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_VALIDATOR_LIMITS;
  if (depth > limits.maximumDepth) {
    return Object.freeze({
      ok: false,
      violation: `snapshot_depth_limit:${pointer || "/"}`,
    });
  }
  budget.visitedNodes += 1;
  if (budget.visitedNodes > limits.maximumNodes) {
    return Object.freeze({
      ok: false,
      violation: `snapshot_node_limit:${pointer || "/"}`,
    });
  }
  if (value === null || typeof value === "boolean") {
    return Object.freeze({ ok: true, value });
  }
  if (typeof value === "string") {
    return Buffer.byteLength(value, "utf8") <= limits.maximumStringUtf8Bytes
      ? Object.freeze({ ok: true, value })
      : Object.freeze({
          ok: false,
          violation: `string_byte_length_limit:${pointer || "/"}`,
        });
  }
  if (typeof value === "number") {
    return Number.isFinite(value) && !Object.is(value, -0)
      ? Object.freeze({ ok: true, value })
      : Object.freeze({
          ok: false,
          violation: `invalid_number:${pointer || "/"}`,
        });
  }
  if (typeof value !== "object") {
    return Object.freeze({
      ok: false,
      violation: `non_json_value:${pointer || "/"}`,
    });
  }
  if (ancestors.has(value)) {
    return Object.freeze({
      ok: false,
      violation: `cyclic_value:${pointer || "/"}`,
    });
  }
  ancestors.add(value);

  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype) {
      return Object.freeze({
        ok: false,
        violation: `non_plain_array:${pointer || "/"}`,
      });
    }
    const lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
    const lengthValue =
      lengthDescriptor != null && "value" in lengthDescriptor
        ? lengthDescriptor.value
        : null;
    if (
      lengthDescriptor == null ||
      !("value" in lengthDescriptor) ||
      typeof lengthValue !== "number" ||
      !Number.isSafeInteger(lengthValue) ||
      lengthValue < 0
    ) {
      return Object.freeze({
        ok: false,
        violation: `array_length:${pointer || "/"}`,
      });
    }
    if (lengthValue > limits.maximumArrayLength) {
      return Object.freeze({
        ok: false,
        violation: `array_length_limit:${pointer || "/"}`,
      });
    }
    const keys = Reflect.ownKeys(value);
    if (keys.some((key) => typeof key !== "string")) {
      return Object.freeze({
        ok: false,
        violation: `symbol_key:${pointer || "/"}`,
      });
    }
    const indexKeys = (keys as string[]).filter((key) => key !== "length");
    if (
      keys.length !== lengthValue + 1 ||
      indexKeys.length !== lengthValue ||
      indexKeys.some((key) => {
        if (!/^(0|[1-9][0-9]*)$/.test(key)) return true;
        const index = Number(key);
        return (
          !Number.isSafeInteger(index) || index < 0 || index >= lengthValue
        );
      })
    ) {
      return Object.freeze({
        ok: false,
        violation: `array_surface:${pointer || "/"}`,
      });
    }
    const output: unknown[] = [];
    for (let index = 0; index < lengthValue; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (
        descriptor == null ||
        !("value" in descriptor) ||
        descriptor.get != null ||
        descriptor.set != null ||
        descriptor.enumerable !== true
      ) {
        return Object.freeze({
          ok: false,
          violation: `array_entry_surface:${pointer}/${index}`,
        });
      }
      const nested = snapshotPlainData(
        descriptor.value,
        `${pointer}/${index}`,
        ancestors,
        depth + 1,
        budget,
      );
      if (!nested.ok) return nested;
      output.push(nested.value);
    }
    ancestors.delete(value);
    return Object.freeze({ ok: true, value: output });
  }

  if (Object.getPrototypeOf(value) !== Object.prototype) {
    return Object.freeze({
      ok: false,
      violation: `non_plain_object:${pointer || "/"}`,
    });
  }
  const keys = Reflect.ownKeys(value);
  if (keys.some((key) => typeof key !== "string")) {
    return Object.freeze({
      ok: false,
      violation: `symbol_key:${pointer || "/"}`,
    });
  }
  if (keys.length > limits.maximumObjectPropertyCount) {
    return Object.freeze({
      ok: false,
      violation: `object_property_count_limit:${pointer || "/"}`,
    });
  }
  const output = Object.create(null) as Record<string, unknown>;
  for (const key of keys as string[]) {
    if (FORBIDDEN_KEYS.has(key)) {
      return Object.freeze({
        ok: false,
        violation: `forbidden_key:${pointer}/${key}`,
      });
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (
      descriptor == null ||
      !("value" in descriptor) ||
      descriptor.get != null ||
      descriptor.set != null ||
      descriptor.enumerable !== true
    ) {
      return Object.freeze({
        ok: false,
        violation: `object_property_surface:${pointer}/${key}`,
      });
    }
    const nested = snapshotPlainData(
      descriptor.value,
      `${pointer}/${key}`,
      ancestors,
      depth + 1,
      budget,
    );
    if (!nested.ok) return nested;
    Object.defineProperty(output, key, {
      value: nested.value,
      enumerable: true,
      configurable: true,
      writable: true,
    });
  }
  ancestors.delete(value);
  return Object.freeze({ ok: true, value: output });
};

const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};

export const NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_CANONICAL_JSON =
  canonicalJson(NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2);
export const NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_SHA256_DOMAIN =
  "nhm2-prolate-boson-star-coherent-candidate-plan/v2\n" as const;
export const NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_SHA256 =
  createHash("sha256")
    .update(
      NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_CANONICAL_JSON,
    "utf8",
  );
export const NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING =
  Object.freeze({
    artifactId: NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_ARTIFACT_ID,
    contractVersion:
      NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_CONTRACT_VERSION,
    candidateId:
      NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_CANDIDATE_ID,
    sha256Domain:
      NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_SHA256_DOMAIN,
    sha256: NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_SHA256,
    canonicalSizeBytes:
      NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_CANONICAL_SIZE_BYTES,
  });

const EXPECTED_CANONICAL_JSON =
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_CANONICAL_JSON;

export const nhm2ProlateBosonStarCoherentCandidatePlanV2Violations = (
  value: unknown,
): string[] => {
  if (value === NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2) return [];
  let snapshot: SnapshotResult;
  try {
    snapshot = snapshotPlainData(value);
  } catch {
    return ["candidate_plan_v2_plain_data_snapshot_invalid"];
  }
  if (snapshot.ok === false) return [snapshot.violation];
  try {
    return canonicalJson(snapshot.value) === EXPECTED_CANONICAL_JSON
      ? ["candidate_plan_v2_external_copy_not_authoritative"]
      : ["candidate_plan_v2_semantic_mismatch"];
  } catch {
    return ["candidate_plan_v2_plain_data_snapshot_invalid"];
  }
};

export const isNhm2ProlateBosonStarCoherentCandidatePlanV2 = (
  value: unknown,
): value is Nhm2ProlateBosonStarCoherentCandidatePlanV2 =>
  nhm2ProlateBosonStarCoherentCandidatePlanV2Violations(value).length === 0;
