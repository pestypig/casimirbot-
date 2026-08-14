import { createHash } from "node:crypto";
import { isProxy } from "node:util/types";

import {
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY,
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING,
  NHM2_SEMICLASSICAL_V2_RAW_REPLAY_FORMULAS,
  NHM2_SEMICLASSICAL_V2_RAW_REPLAY_MANIFEST_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_RAW_REPLAY_MANIFEST_CONTRACT_VERSION,
  NHM2_SEMICLASSICAL_V2_RAW_REPLAY_MINIMUM_REGULATOR_LEVELS,
} from "./nhm2-semiclassical-v2-raw-replay-manifest.v1";
import {
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_NONDEGENERACY_CRITERION_ID,
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_KIND,
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_NON_SELF_INPUT_IDS,
  type Nhm2SemiclassicalV2ScientificNonSelfInputId,
} from "./nhm2-semiclassical-v2-scientific-candidate-manifest.v1";
import { NHM2_SEMICLASSICAL_TENSOR_COMPONENTS } from "./nhm2-semiclassical-state-realizability.v1";
import {
  NHM2_SEMICLASSICAL_CONSTRAINT_BRACKET_IDS,
  NHM2_SEMICLASSICAL_CONSTRAINT_COMPONENT_ORDER,
  NHM2_SEMICLASSICAL_NOISE_KERNEL_COMPONENT_PAIR_ORDER,
} from "./nhm2-semiclassical-state-realizability.v2";
import {
  NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1,
  NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_SHA256,
} from "./nhm2-spherical-boson-star-branch-bvp.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN,
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_SHA256,
} from "./nhm2-spherical-boson-star-coherent-candidate-plan.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256,
} from "./nhm2-spherical-boson-star-newtonian-seed.v1";

export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_ARTIFACT_ID =
  "nhm2.spherical_boson_star_v2_candidate_freeze" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CONTRACT_VERSION =
  "nhm2_spherical_boson_star_v2_candidate_freeze/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID =
  "nhm2.semiclassical_v2.spherical_boson_star_1s_weak_field_control/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_PHASE =
  "pre_execution_v2_candidate_identity_and_science_freeze" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING_PINS =
  Object.freeze({
    sourceCandidateSha256:
      "9aecb482ee5e78c61b202966c44a25139262f139cb06654094e7e36956e4876d",
    sourceCandidateCanonicalSizeBytes: 93214,
    branchBvpSha256:
      "ce00d2b6048d8c22e6dedd4526a8548373916525ef9adb75fcea48e67dc7e557",
    branchBvpCanonicalSizeBytes: 13847,
    semanticSeedSha256:
      "b2a89c8065bd6865b26aa1c4365d0f48edbd40e9c4f43e0cfbaca49db29a6c2c",
    semanticSeedCanonicalSizeBytes: 18894,
    approvedV2ReplayPolicySha256:
      "ada5f8a24aba724ec36528d9bddfe267b794b93cd3bceef9a7774c1e78ad5b00",
    approvedV2ReplayPolicySizeBytes: 3827,
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_READY_INPUT_IDS =
  Object.freeze([
    "geometry",
    "quantum_state",
    "chart",
    "normalization",
    "tolerance_policy",
    "smearing_definition",
    "sampling_basis",
    "field_model",
    "lagrangian",
    "field_equations",
    "boundary_conditions",
    "state_construction",
    "finite_renormalization_freedom",
  ] as const satisfies readonly Nhm2SemiclassicalV2ScientificNonSelfInputId[]);

export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_MISSING_INPUT_IDS =
  Object.freeze([
    "renormalization_prescription",
    "renormalization_counterterms",
    "constraint_formulation",
    "regulator_definition",
    "operator_ordering",
    "classical_structure_functions",
    "metric_demand_tensor",
    "metric_demand_absolute_error_bound",
    "metric_demand_derivation_receipt",
  ] as const satisfies readonly Nhm2SemiclassicalV2ScientificNonSelfInputId[]);

export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BLOCKERS =
  Object.freeze([
    "conservation_restoring_hadamard_prescription_and_coefficient_absent",
    "named_renormalization_counterterm_basis_absent",
    "v2_total_constraint_formulation_absent",
    "v2_regulator_definition_absent",
    "v2_operator_ordering_absent",
    "v2_classical_structure_functions_absent",
    "all_64_metric_demand_tensor_bytes_absent",
    "all_64_metric_demand_absolute_error_bound_bytes_absent",
    "server_replayed_metric_demand_derivation_receipt_absent",
    "v2_scientific_candidate_manifest_and_preseal_absent",
    "spherical_seed_branch_self_consistent_state_and_noise_not_executed",
  ] as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_AUTHORITY_LOCKS =
  Object.freeze({
    candidateManifestMaterialized: false as const,
    scientificPresealMaterialized: false as const,
    executionAuthorized: false as const,
    executionObserved: false as const,
    nondegeneracyEstablished: false as const,
    rawNoiseArraysPresent: false as const,
    constraintArraysPresent: false as const,
    replayAuthority: false as const,
    independentAgreement: false as const,
    semiclassicalStressNoiseLamp: false as const,
    semiclassicalConstraintAlgebraLamp: false as const,
    diagnosticPass: false as const,
    theoryGraphPromotion: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
  });

export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_VALIDATOR_LIMITS =
  Object.freeze({
    maximumDepth: 32,
    maximumNodes: 16384,
    maximumArrayLength: 1024,
    maximumObjectPropertyCount: 256,
    maximumPropertyKeyUtf8Bytes: 4096,
    maximumStringUtf8Bytes: 32768,
    maximumAggregateUtf8Bytes: 1048576,
  } as const);

const RAW_ARRAY_ENCODING = Object.freeze({
  dtype: "float64" as const,
  binaryEncoding: "raw_ieee754" as const,
  endianness: "little" as const,
  storageOrder: "row-major" as const,
  finiteValuesRequired: true as const,
  negativeZeroAllowed: false as const,
});

const CONSTRAINT_ARRAY_SHAPE = Object.freeze([64, 4] as const);
const CONSTRAINT_ARRAY_COMPONENT_ORDER = Object.freeze([
  ...NHM2_SEMICLASSICAL_CONSTRAINT_COMPONENT_ORDER,
]);

export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_OUTPUT_DUTY =
  Object.freeze({
    schemaAuthority: Object.freeze({
      artifactId: NHM2_SEMICLASSICAL_V2_RAW_REPLAY_MANIFEST_ARTIFACT_ID,
      contractVersion:
        NHM2_SEMICLASSICAL_V2_RAW_REPLAY_MANIFEST_CONTRACT_VERSION,
      approvedPolicy: NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING,
    }),
    sampleCount: 64,
    encoding: RAW_ARRAY_ENCODING,
    fixedArrays: Object.freeze([
      Object.freeze({
        role: "noise_kernel",
        shape: Object.freeze([64, 64, 100] as const),
        componentOrder: Object.freeze([
          ...NHM2_SEMICLASSICAL_NOISE_KERNEL_COMPONENT_PAIR_ORDER,
        ]),
        unit: "(J/m^3)^2" as const,
      }),
      Object.freeze({
        role: "noise_kernel_absolute_uncertainty95",
        shape: Object.freeze([64, 64, 100] as const),
        componentOrder: Object.freeze([
          ...NHM2_SEMICLASSICAL_NOISE_KERNEL_COMPONENT_PAIR_ORDER,
        ]),
        unit: "(J/m^3)^2" as const,
      }),
      Object.freeze({
        role: "mean_rset",
        shape: Object.freeze([64, 10] as const),
        componentOrder: Object.freeze([
          ...NHM2_SEMICLASSICAL_TENSOR_COMPONENTS,
        ]),
        unit: "J/m^3" as const,
      }),
      Object.freeze({
        role: "mean_rset_absolute_uncertainty95",
        shape: Object.freeze([64, 10] as const),
        componentOrder: Object.freeze([
          ...NHM2_SEMICLASSICAL_TENSOR_COMPONENTS,
        ]),
        unit: "J/m^3" as const,
      }),
      Object.freeze({
        role: "smearing_weights",
        shape: Object.freeze([64] as const),
        componentOrder: Object.freeze(["weight"] as const),
        unit: "dimensionless" as const,
      }),
    ]),
    brackets: Object.freeze({
      bracketIdsInOrder: Object.freeze([
        ...NHM2_SEMICLASSICAL_CONSTRAINT_BRACKET_IDS,
      ]),
      slotsInOrder: Object.freeze([
        "computed",
        "target",
        "residual",
        "absolute_uncertainty95",
      ] as const),
      rolePattern: "constraint_bracket.{bracket_id}.{slot}" as const,
      shape: CONSTRAINT_ARRAY_SHAPE,
      componentOrder: CONSTRAINT_ARRAY_COMPONENT_ORDER,
      unit: "dimensionless" as const,
      exactArrayCount: 12,
    }),
    antisymmetry: Object.freeze({
      slotsInOrder: Object.freeze([
        "forward",
        "reverse",
        "residual",
        "absolute_uncertainty95",
      ] as const),
      rolePattern: "antisymmetry.{slot}" as const,
      shape: CONSTRAINT_ARRAY_SHAPE,
      componentOrder: CONSTRAINT_ARRAY_COMPONENT_ORDER,
      unit: "dimensionless" as const,
      exactArrayCount: 4,
    }),
    jacobi: Object.freeze({
      slotsInOrder: Object.freeze([
        "term_1",
        "term_2",
        "term_3",
        "residual",
        "absolute_uncertainty95",
      ] as const),
      rolePattern: "jacobi.{slot}" as const,
      shape: CONSTRAINT_ARRAY_SHAPE,
      componentOrder: CONSTRAINT_ARRAY_COMPONENT_ORDER,
      unit: "dimensionless" as const,
      exactArrayCount: 5,
    }),
    regulator: Object.freeze({
      minimumLevelCount:
        NHM2_SEMICLASSICAL_V2_RAW_REPLAY_MINIMUM_REGULATOR_LEVELS,
      exactLevelCountFrozenBeforeExecution: null,
      levelIdsAndStrictlyDecreasingPositiveScalesFrozenBeforeExecution: null,
      slotsInOrder: Object.freeze([
        "residual",
        "absolute_uncertainty95",
      ] as const),
      rolePattern: "regulator_level.{ordinal}.{slot}" as const,
      shape: CONSTRAINT_ARRAY_SHAPE,
      componentOrder: CONSTRAINT_ARRAY_COMPONENT_ORDER,
      unit: "dimensionless" as const,
      minimumArrayCount: 6,
      unresolvedRegulatorDefinitionBlocksExecution: true,
    }),
    fixedArrayCountExcludingRegulatorLevels: 26,
    minimumTotalArrayCount: 32,
    exactTotalArrayCountFrozenBeforeExecution: null,
    outputManifestMaterialized: false,
    outputBytesPresent: false,
    outputRolesShapesAndEncodingMayChangeAfterExecution: false,
  } as const);

const SOURCE = NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN;
const BVP = NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1;
const SEED = NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1;
const V2 = NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY;

const CONTRACT = {
  artifactId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_ARTIFACT_ID,
  contractVersion:
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CONTRACT_VERSION,
  phase: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_PHASE,
  authority: "preregistered_v2_candidate_freeze_no_execution",
  maturity:
    "stage_2_v2_lane_specific_science_freeze_incomplete_scientific_input_closure",
  selectionFrozenBeforeExecution: true,
  scientificCandidateAdmissible: false,
  candidateIdentity: {
    candidateId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
    candidateManifestId:
      "nhm2.semiclassical_v2.spherical_boson_star_1s_weak_field_control.candidate_manifest/v1",
    selectedProfileId: "spherical_boson_star_1s_weak_field_control",
    candidateKind: NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_KIND,
    geometryId: "nhm2.semiclassical_v2.spherical_boson_star_1s.geometry/v1",
    quantumStateId:
      "nhm2.semiclassical_v2.spherical_boson_star_1s.coherent_hadamard_state/v1",
    chartId:
      "nhm2.semiclassical_v2.spherical_boson_star_1s.isotropic_cartesian_tetrad_chart/v1",
    normalizationId:
      "nhm2.semiclassical_v2.spherical_boson_star_1s.dimensionless_si_output_normalization/v1",
    tolerancePolicyId:
      NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING.policyId,
    smearingFunctionId:
      "nhm2.semiclassical_v2.spherical_boson_star_1s.normalized_c_infinity_product_bump/v1",
    samplingBasisId:
      "nhm2.semiclassical_v2.spherical_boson_star_1s.fixed_64_cartesian_sampling_basis/v1",
    lineage:
      "new_unexecuted_v2_candidate_identity_frozen_before_execution_not_an_automatic_v3_upgrade_or_observed_candidate_retune",
    sourceV3CandidateId: SOURCE.candidateIdentity.candidateId,
    sourceV3CandidateIdentityInheritedAsAuthority: false,
    geometryStateChartAndNormalizationSemanticsCopiedExactly: true,
    toleranceAuthorityChangedToApprovedV2PolicyBeforeExecution: true,
    candidateIdChangedBeforeExecutionAsRequired: true,
    observedResultUsedToChooseV2PolicyOrThresholds: false,
    retuningAfterObservationAllowed: false,
    fallbackBranchAfterObservationAllowed: false,
    failureDisposition: "fail_this_v2_candidate_without_retuning",
    sourceMode: "state_derived_not_declared_lever",
    declaredLeverOrTileTensorUsed: false,
  },
  sourceProvenance: {
    sourceMode: "state_derived_not_declared_lever",
    meanRsetOrigin: "renormalized_quantum_state_expectation_value",
    noiseKernelOrigin: "connected_symmetrized_quantum_state_two_point_function",
    declaredLeverTensorUsed: false,
    declaredTileTensorUsed: false,
    inputClosureExcludesDeclaredLeverOrTileTensor: true,
  },
  sourceBindings: {
    candidatePlan: {
      binding: NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_BINDING,
      sha256: NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_SHA256,
      canonicalSizeBytes:
        NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CANONICAL_SIZE_BYTES,
      role: "scientific_semantics_source_only_no_v3_authority_inheritance",
    },
    branchBvp: {
      artifactId: BVP.artifactId,
      contractVersion: BVP.contractVersion,
      sha256: NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_SHA256,
      canonicalSizeBytes:
        NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_CANONICAL_SIZE_BYTES,
      role: "frozen_radial_EKG_equations_and_boundary_duties_only",
    },
    newtonianSeed: {
      artifactId: SEED.artifactId,
      contractVersion: SEED.contractVersion,
      sha256: NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256,
      canonicalSizeBytes:
        NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_SIZE_BYTES,
      role: "frozen_radial_seed_semantics_only",
    },
    approvedV2TolerancePolicy:
      NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING,
  },
  migrationBoundary: {
    automaticUpgradeFromV3Allowed: false,
    v3ReplayEpochOrRuntimeBindingInherited: false,
    v3CandidateManifestPresealReceiptOrPairEvidenceInherited: false,
    v3ToleranceArtifactHasV2Authority: false,
    v2ApprovedReplayPolicyIsSoleReplayToleranceAuthority: true,
    scienceSemanticsMayChangeDuringLaneBinding: false,
    numericThresholdRelaxationAllowed: false,
    sourceCandidateWasExecuted: false,
    v2CandidateWasExecuted: false,
  },
  frozenScience: {
    geometry: {
      conventions: SOURCE.conventions,
      branchSelector: SOURCE.frozenBranchSelector,
      dimensionlessRadialSystem: BVP.dimensionlessRadialSystem,
    },
    quantumState: SOURCE.jointSemiclassicalState,
    chart: {
      geometryGauge: SOURCE.frozenBranchSelector.geometryGauge,
      chartAndTetrad: SOURCE.chartTetradSamplingAndSmearing,
    },
    normalization: {
      conventions: SOURCE.conventions,
      dimensionlessDefinitions: BVP.dimensionlessRadialSystem.definitions,
      sourceCoefficient: BVP.dimensionlessRadialSystem.sourceCoefficient,
      matterCoupling: SOURCE.matterModel.dimensionlessGravitationalCoupling,
      coherentPeakAmplitude: SOURCE.matterModel.coherentPeakAmplitude,
      constraintNormalization: SOURCE.totalConstraintDuty.normalization,
      units: V2.units,
    },
    tolerancePolicy: V2,
    smearing: SOURCE.chartTetradSamplingAndSmearing.smearing,
    samplingBasis: {
      slice: SOURCE.chartTetradSamplingAndSmearing.slice,
      sampleCount: SOURCE.chartTetradSamplingAndSmearing.sampleCount,
      axisCoordinates: SOURCE.chartTetradSamplingAndSmearing.axisCoordinates,
      enumerationOrder: SOURCE.chartTetradSamplingAndSmearing.enumerationOrder,
      ordinalFormula: SOURCE.chartTetradSamplingAndSmearing.ordinalFormula,
      centers: SOURCE.chartTetradSamplingAndSmearing.centers,
      tetrad: SOURCE.chartTetradSamplingAndSmearing.tetrad,
    },
  },
  readyScienceSemantics: {
    fieldModel: SOURCE.matterModel,
    lagrangian: {
      matterAction: SOURCE.matterModel.action,
      covariantActionDensity: BVP.covariantModel.actionDensity,
      spacetimeSignature: BVP.covariantModel.spacetimeSignature,
    },
    fieldEquations: {
      selfConsistency: SOURCE.selfConsistency.equation,
      covariantModel: BVP.covariantModel,
      radialSystem: BVP.dimensionlessRadialSystem,
      cancellationFreeRows: BVP.cancellationFreeMixedComponents,
      solvedAndUnusedRows: BVP.ellipticResidualSystem,
    },
    boundaryConditions: {
      radial: BVP.boundaryConditions,
      branchSelection: BVP.branchSelectionGates,
      noCoordinateTransform:
        SOURCE.frozenBranchSelector.geometryGauge
          .residualCoordinateTransformAllowed,
    },
    stateConstruction: SOURCE.jointSemiclassicalState,
    finiteRenormalizationFreedom: {
      scheme: SOURCE.renormalization.scheme,
      hadamardLength: SOURCE.renormalization.hadamardLength,
      conditions: SOURCE.renormalization.finiteAmbiguityConditions,
      producerSelectedFiniteCountertermsAllowed:
        SOURCE.renormalization.producerSelectedFiniteCountertermsAllowed,
    },
  },
  toleranceEquivalence: {
    sourceThresholdsComparedOnlyForNoRelaxationEvidence: true,
    v2PolicyRemainsSoleAuthority: true,
    commonThresholds: {
      smearingWeightSumAbsolute:
        SOURCE.tolerancePolicy.policy.frozenThresholds
          .smearingWeightSumAbsolute,
      exchangeSymmetryUpper95SI:
        SOURCE.tolerancePolicy.policy.frozenThresholds
          .exchangeSymmetryUpper95SI,
      psdNegativeEigenvalueSI:
        SOURCE.tolerancePolicy.policy.frozenThresholds.psdNegativeEigenvalueSI,
      meanNormalizationFloorSI:
        SOURCE.tolerancePolicy.policy.frozenThresholds.meanNormalizationFloorSI,
      fluctuationToMeanRatioUpper95:
        SOURCE.tolerancePolicy.policy.frozenThresholds
          .fluctuationToMeanRatioUpper95,
      meanMetricDemandPointwiseRelativeUpper95:
        SOURCE.tolerancePolicy.policy.frozenThresholds
          .meanMetricDemandPointwiseRelativeUpper95,
      metricDemandRelativeErrorBound:
        SOURCE.tolerancePolicy.policy.frozenThresholds
          .metricDemandRelativeErrorBound,
      bracketResidualUpper95:
        SOURCE.tolerancePolicy.policy.frozenThresholds.bracketResidualUpper95,
      antisymmetryResidualUpper95:
        SOURCE.tolerancePolicy.policy.frozenThresholds
          .antisymmetryResidualUpper95,
      jacobiResidualUpper95:
        SOURCE.tolerancePolicy.policy.frozenThresholds.jacobiResidualUpper95,
      regulatorResidualUpper95:
        SOURCE.tolerancePolicy.policy.frozenThresholds.regulatorResidualUpper95,
      regulatorMonotonicityAbsolute:
        SOURCE.tolerancePolicy.policy.frozenThresholds
          .regulatorMonotonicityAbsolute,
      minimumRegulatorConvergenceOrder:
        SOURCE.tolerancePolicy.policy.frozenThresholds
          .minimumRegulatorConvergenceOrder,
      float64RecomputeAbsolute:
        SOURCE.tolerancePolicy.policy.frozenThresholds.float64RecomputeAbsolute,
    },
  },
  v2OutputDuty: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_OUTPUT_DUTY,
  replayAndAgreementDuty: {
    formulas: NHM2_SEMICLASSICAL_V2_RAW_REPLAY_FORMULAS,
    recomputeDirectlyFromPersistedBytes: true,
    requiredChecksInOrder: [
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
    ],
    primaryAndIndependentReceiveExactSameFrozenScientificInputBytes: true,
    implementationSourcesDependencyLocksExecutablesAndOutputRootsMustBeDisjoint: true,
    independentImplementationMayImportOrInvokePrimaryImplementation: false,
    pairAgreementMustBindExactArrayInventoryHashesAndReplayReceipts: true,
    pairAgreementReceipt: null,
    primaryReplayReceipt: null,
    independentReplayReceipt: null,
    theoryGraphLampPromotionRequiresBothReplayPassAndPairAgreement: true,
    physicalViabilityPropulsionOrTransportMayBeUnlocked: false,
    failureDisposition: "fail_this_v2_candidate_without_retuning",
  },
  runProvenanceDuty: {
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
  },
  v2ScientificClosure: {
    expectedInputIds:
      NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_NON_SELF_INPUT_IDS,
    expectedInputCount: 22,
    semanticallyReadyInputIds:
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_READY_INPUT_IDS,
    semanticallyReadyInputCount: 13,
    missingInputIds:
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_MISSING_INPUT_IDS,
    missingInputCount: 9,
    complete: false,
    canonicalScienceInputBytesMaterialized: false,
    scientificCandidateManifest: null,
    scientificPreseal: null,
    refreezeRequiredAfterCompleteScienceMaterialization: true,
  },
  nondegeneracyGate: {
    criterionId: NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_NONDEGENERACY_CRITERION_ID,
    sampleCount: 64,
    minimumMetricDemandFrobeniusSI: V2.minimumMetricDemandFrobeniusSI,
    requiredMetricDemandSampleFraction: V2.requiredMetricDemandSampleFraction,
    metricDemandTensor: null,
    metricDemandAbsoluteErrorBound: null,
    metricDemandDerivationReceipt: null,
    serverReplayReceipt: null,
    established: false,
    failureDisposition: "fail_candidate_without_retuning",
  },
  executionBoundary: {
    candidateManifestRequiredBeforeExecution: true,
    scientificPresealRequiredBeforeExecution: true,
    sourceToolchainExecutableRuntimeClosureRequiredBeforeExecution: true,
    completeSciencePackRequiredBeforeExecution: true,
    exactRegulatorLevelIdsScalesAndOutputCountRequiredBeforeExecution: true,
    nondegeneracyRequiredBeforeRawReplayExecution: true,
    implementationPresent: false,
    executionAuthorized: false,
    executionObserved: false,
  },
  blockers: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BLOCKERS,
  authorityLocks: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_AUTHORITY_LOCKS,
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

export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE =
  deepFreeze(CONTRACT);
export type Nhm2SphericalBosonStarV2CandidateFreezeV1 =
  typeof NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE;

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

export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_JSON =
  canonicalJson(NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE);
export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-candidate-freeze/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_SHA256 = createHash(
  "sha256",
)
  .update(NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_SHA256_DOMAIN, "utf8")
  .update(NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_JSON, "utf8")
  .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_JSON,
    "utf8",
  );
export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_EXPECTED_SHA256 =
  "628092507b7dc1be76722f06a7b591efc59d1799bed0d4b7d1999d852d92f28f" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_EXPECTED_CANONICAL_SIZE_BYTES =
  55997 as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_LITERAL_SEAL_STATUS =
  "sealed_before_v2_candidate_execution" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING =
  Object.freeze({
    artifactId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CONTRACT_VERSION,
    candidateId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
    sha256Domain: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_SHA256_DOMAIN,
    sha256: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_SHA256,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_SIZE_BYTES,
    mediaType: "application/json" as const,
  });

if (
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_SHA256 !==
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_EXPECTED_SHA256 ||
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_SIZE_BYTES !==
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_EXPECTED_CANONICAL_SIZE_BYTES
) {
  throw new Error(
    `nhm2_spherical_v2_candidate_freeze_literal_pin_mismatch:${NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_SHA256}/${NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_SIZE_BYTES}`,
  );
}

type SnapshotResult =
  | Readonly<{ ok: true; value: unknown }>
  | Readonly<{ ok: false; violation: string }>;
type SnapshotBudget = { nodes: number; utf8Bytes: number };
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
  budget: SnapshotBudget = { nodes: 0, utf8Bytes: 0 },
): SnapshotResult => {
  const limits = NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_VALIDATOR_LIMITS;
  if (depth > limits.maximumDepth) {
    return Object.freeze({
      ok: false,
      violation: `snapshot_depth_limit:${pointer || "/"}`,
    });
  }
  budget.nodes += 1;
  if (budget.nodes > limits.maximumNodes) {
    return Object.freeze({
      ok: false,
      violation: `snapshot_node_limit:${pointer || "/"}`,
    });
  }
  if (value === null || typeof value === "boolean") {
    return Object.freeze({ ok: true, value });
  }
  if (typeof value === "string") {
    const byteLength = Buffer.byteLength(value, "utf8");
    if (byteLength > limits.maximumStringUtf8Bytes) {
      return Object.freeze({
        ok: false,
        violation: `string_byte_limit:${pointer || "/"}`,
      });
    }
    budget.utf8Bytes += byteLength;
    return budget.utf8Bytes <= limits.maximumAggregateUtf8Bytes
      ? Object.freeze({ ok: true, value })
      : Object.freeze({
          ok: false,
          violation: `aggregate_utf8_byte_limit:${pointer || "/"}`,
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
  if (isProxy(value)) {
    return Object.freeze({
      ok: false,
      violation: `proxy_forbidden:${pointer || "/"}`,
    });
  }
  if (ancestors.has(value)) {
    return Object.freeze({
      ok: false,
      violation: `cycle_forbidden:${pointer || "/"}`,
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
    const length =
      lengthDescriptor != null && "value" in lengthDescriptor
        ? lengthDescriptor.value
        : null;
    if (
      typeof length !== "number" ||
      !Number.isSafeInteger(length) ||
      length < 0 ||
      length > limits.maximumArrayLength
    ) {
      return Object.freeze({
        ok: false,
        violation: `array_length_limit:${pointer || "/"}`,
      });
    }
    const keys = Reflect.ownKeys(value);
    if (
      keys.some((key) => typeof key !== "string") ||
      keys.length !== length + 1
    ) {
      return Object.freeze({
        ok: false,
        violation: `array_surface:${pointer || "/"}`,
      });
    }
    const output: unknown[] = [];
    for (let index = 0; index < length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (
        descriptor == null ||
        !("value" in descriptor) ||
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
  if (
    keys.some((key) => typeof key !== "string") ||
    keys.length > limits.maximumObjectPropertyCount
  ) {
    return Object.freeze({
      ok: false,
      violation: `object_surface:${pointer || "/"}`,
    });
  }
  const output = Object.create(null) as Record<string, unknown>;
  for (const key of keys as string[]) {
    const keyByteLength = Buffer.byteLength(key, "utf8");
    if (keyByteLength > limits.maximumPropertyKeyUtf8Bytes) {
      return Object.freeze({
        ok: false,
        violation: `property_key_byte_limit:${pointer || "/"}`,
      });
    }
    budget.utf8Bytes += keyByteLength;
    if (budget.utf8Bytes > limits.maximumAggregateUtf8Bytes) {
      return Object.freeze({
        ok: false,
        violation: `aggregate_utf8_byte_limit:${pointer || "/"}`,
      });
    }
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
      descriptor.enumerable !== true
    ) {
      return Object.freeze({
        ok: false,
        violation: `object_entry_surface:${pointer}/${key}`,
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

const thresholdEntries = Object.entries(
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE.toleranceEquivalence
    .commonThresholds,
);

const assertInvariants = (): void => {
  const pins = NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING_PINS;
  if (
    NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_SHA256 !==
      pins.sourceCandidateSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CANONICAL_SIZE_BYTES !==
      pins.sourceCandidateCanonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_SHA256 !== pins.branchBvpSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_CANONICAL_SIZE_BYTES !==
      pins.branchBvpCanonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256 !==
      pins.semanticSeedSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_SIZE_BYTES !==
      pins.semanticSeedCanonicalSizeBytes ||
    NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING.sha256 !==
      pins.approvedV2ReplayPolicySha256 ||
    NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING.sizeBytes !==
      pins.approvedV2ReplayPolicySizeBytes
  ) {
    throw new Error("nhm2_spherical_v2_candidate_freeze_dependency_pin_drift");
  }
  const official = [
    ...NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_NON_SELF_INPUT_IDS,
  ];
  const partition = [
    ...NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_READY_INPUT_IDS,
    ...NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_MISSING_INPUT_IDS,
  ];
  if (
    new Set(partition).size !== official.length ||
    official.some((inputId) => !partition.includes(inputId))
  ) {
    throw new Error("nhm2_spherical_v2_candidate_freeze_inventory_partition");
  }
  const v2Thresholds = V2.tolerances as Record<string, number>;
  if (thresholdEntries.some(([key, value]) => v2Thresholds[key] !== value)) {
    throw new Error("nhm2_spherical_v2_candidate_freeze_threshold_relaxation");
  }
  const contract = NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE;
  if (
    String(contract.candidateIdentity.candidateId) ===
      String(contract.candidateIdentity.sourceV3CandidateId) ||
    contract.migrationBoundary.automaticUpgradeFromV3Allowed !== false ||
    contract.migrationBoundary
      .v2ApprovedReplayPolicyIsSoleReplayToleranceAuthority !== true ||
    contract.candidateIdentity.declaredLeverOrTileTensorUsed !== false ||
    contract.sourceProvenance.declaredLeverTensorUsed !== false ||
    contract.sourceProvenance.declaredTileTensorUsed !== false ||
    contract.sourceProvenance.inputClosureExcludesDeclaredLeverOrTileTensor !==
      true ||
    contract.v2OutputDuty.fixedArrays.length !== 5 ||
    contract.v2OutputDuty.brackets.exactArrayCount !== 12 ||
    contract.v2OutputDuty.antisymmetry.exactArrayCount !== 4 ||
    contract.v2OutputDuty.jacobi.exactArrayCount !== 5 ||
    contract.v2OutputDuty.fixedArrayCountExcludingRegulatorLevels !== 26 ||
    contract.v2OutputDuty.minimumTotalArrayCount !== 32 ||
    contract.v2OutputDuty.exactTotalArrayCountFrozenBeforeExecution !== null ||
    contract.v2OutputDuty.outputBytesPresent !== false ||
    contract.replayAndAgreementDuty.primaryReplayReceipt !== null ||
    contract.replayAndAgreementDuty.independentReplayReceipt !== null ||
    contract.replayAndAgreementDuty.pairAgreementReceipt !== null ||
    contract.replayAndAgreementDuty
      .theoryGraphLampPromotionRequiresBothReplayPassAndPairAgreement !==
      true ||
    contract.runProvenanceDuty.complete !== false ||
    contract.runProvenanceDuty.commitSha !== null ||
    contract.runProvenanceDuty.freshnessReceipts !== null ||
    contract.v2ScientificClosure.complete !== false ||
    contract.nondegeneracyGate.established !== false ||
    contract.executionBoundary.executionAuthorized !== false ||
    Object.values(contract.authorityLocks).some((value) => value !== false)
  ) {
    throw new Error("nhm2_spherical_v2_candidate_freeze_authority_invariant");
  }
};

assertInvariants();

export const nhm2SphericalBosonStarV2CandidateFreezeViolations = (
  value: unknown,
): string[] => {
  try {
    const snapshot = snapshotPlainData(value);
    if (!snapshot.ok) return [snapshot.violation];
    return canonicalJson(snapshot.value) ===
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_JSON
      ? []
      : ["spherical_v2_candidate_freeze_semantic_drift"];
  } catch {
    return ["spherical_v2_candidate_freeze_snapshot_invalid"];
  }
};

export const isNhm2SphericalBosonStarV2CandidateFreezeV1 = (
  value: unknown,
): value is Nhm2SphericalBosonStarV2CandidateFreezeV1 =>
  nhm2SphericalBosonStarV2CandidateFreezeViolations(value).length === 0;

export const cloneNhm2SphericalBosonStarV2CandidateFreeze = () =>
  JSON.parse(
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_JSON,
  ) as Nhm2SphericalBosonStarV2CandidateFreezeV1;
