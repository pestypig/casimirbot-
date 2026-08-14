import { createHash } from "node:crypto";

import { NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_BINDING } from "./nhm2-spherical-boson-star-v2-branch-selection-numerics.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_BINDING } from "./nhm2-spherical-boson-star-v2-candidate-freeze.v2";
import { NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM_BINDING } from "./nhm2-spherical-boson-star-v2-metric-demand-program.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING } from "./nhm2-spherical-boson-star-v2-raw-replay-schema.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_BINDING } from "./nhm2-spherical-boson-star-v2-run-artifact-wire.v2";
import { NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BINDING } from "./nhm2-spherical-boson-star-v2-si-output-normalization.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_BINDING } from "./nhm2-spherical-boson-star-v2-si-output-normalization.v2";
import { NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_BINDING } from "./nhm2-spherical-boson-star-v2-static-ground-state-hadamard-mean-noise-realization.v1";

export const NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_ARTIFACT_ID =
  "nhm2.spherical_boson_star_v2_accepted_geometry_state_handoff" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_CONTRACT_VERSION =
  "nhm2_spherical_boson_star_v2_accepted_geometry_state_handoff/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_CANDIDATE_ID =
  "nhm2.semiclassical_v2.spherical_boson_star_1s_weak_field_control/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_SEMANTIC_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-accepted-geometry-state-handoff/v1\n" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_VALIDATOR_LIMITS =
  Object.freeze({
    maximumWireUtf16CodeUnits: 131_072,
    maximumWireUtf8Bytes: 131_072,
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_BINDING_PINS =
  Object.freeze({
    finalCandidateFreezeV2: Object.freeze({
      semanticSha256:
        "a8e4d9cb4b07efc053fddc72339b8c3db464129a992731453059d3e160ca2ce2",
      plainCanonicalSha256:
        "ae7e7f17b67dca7bbb25cbddb60e20b08135dd513977a620463122e153f58932",
      canonicalSizeBytes: 20_843,
    }),
    finalBranchSelectionNumericsV1: Object.freeze({
      semanticSha256:
        "221af0c6b9f858d20ca2f89c5e4eedf14a0c64ede9ff39e60077b79f08ad9aaa",
      plainCanonicalSha256:
        "913b9d524071c20669e8f0abfd838ef6daa7b2e17b1bd5775a1fafc1e2282962",
      canonicalSizeBytes: 41_280,
    }),
    finalSiOutputNormalizationV2: Object.freeze({
      semanticSha256:
        "6af028d078ecc4cc9076eb45476fd87ac448503170e88fccf0ada3a98d06cafb",
      canonicalSizeBytes: 15_246,
    }),
    staleSiOutputNormalizationV1: Object.freeze({
      semanticSha256:
        "16224114ce7bc790d1e5ceeaf8f75e31e5c37412856c5bea8b99284301bf3c24",
      canonicalSizeBytes: 23_822,
    }),
    staleMeanNoiseRealizationV1: Object.freeze({
      semanticSha256:
        "bf9875496a7aa8f5bde0509e597b373454ddea072f1d1af2ae18b746f7646467",
      canonicalSizeBytes: 25_213,
    }),
    staleMetricDemandProgramV1: Object.freeze({
      semanticSha256:
        "c64cd963ec7a8ad2485de2e4ff16e307da61a6fd1e108439ae56eade76b00fee",
      canonicalSizeBytes: 48_595,
    }),
    staleRunArtifactWireV2: Object.freeze({
      semanticSha256:
        "d681751c9f0cec9e10336f98bb4c6a2657411bc74d612313660692363202971d",
      canonicalSizeBytes: 11_117,
    }),
    rawReplaySchemaV1: Object.freeze({
      semanticSha256:
        "96f5816f9d04b9d3b14a228ab821c3224974f47839ace6d7c7819f77c6a223ff",
      canonicalSizeBytes: 163_818,
    }),
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_SOURCE_BYTE_PINS =
  Object.freeze([
    Object.freeze({
      ordinal: 0,
      role: "final_candidate_freeze_v2_definition_source",
      path: "shared/contracts/nhm2-spherical-boson-star-v2-candidate-freeze.v2.ts",
      rawSha256:
        "c0a1a39efa0beb0cc13ac2517fb97f6c2b1ff18242e4d8329008fd85b6a3b057",
      rawSizeBytes: 35_998,
    }),
    Object.freeze({
      ordinal: 1,
      role: "final_branch_selection_numerics_v1_definition_source",
      path: "shared/contracts/nhm2-spherical-boson-star-v2-branch-selection-numerics.v1.ts",
      rawSha256:
        "d20e6eeef3d185ff938aa27cc83af87a201d76f986c63d77e0dbe72cf8600c82",
      rawSizeBytes: 44_912,
    }),
    Object.freeze({
      ordinal: 2,
      role: "final_si_output_normalization_v2_definition_source",
      path: "shared/contracts/nhm2-spherical-boson-star-v2-si-output-normalization.v2.ts",
      rawSha256:
        "6d5d539b5c93409b6a0afefe0afdf9c32aa27f98fb1d133efb8c6d19e66a86cc",
      rawSizeBytes: 26_854,
    }),
    Object.freeze({
      ordinal: 3,
      role: "stale_si_output_normalization_v1_definition_source",
      path: "shared/contracts/nhm2-spherical-boson-star-v2-si-output-normalization.v1.ts",
      rawSha256:
        "816bd0c415e0a1a3cc069f26c9ef368ba467abbebafe0b64681eb4e17661865f",
      rawSizeBytes: 39_984,
    }),
    Object.freeze({
      ordinal: 4,
      role: "stale_mean_noise_realization_v1_definition_source",
      path: "shared/contracts/nhm2-spherical-boson-star-v2-static-ground-state-hadamard-mean-noise-realization.v1.ts",
      rawSha256:
        "bfa7710516136347b46df6141ba94c71d15398030f6ad0585a4ba1e787b71d1f",
      rawSizeBytes: 39_227,
    }),
    Object.freeze({
      ordinal: 5,
      role: "stale_metric_demand_program_v1_definition_source",
      path: "shared/contracts/nhm2-spherical-boson-star-v2-metric-demand-program.v1.ts",
      rawSha256:
        "959d8a8b5211f3549e2124ffdf0db36779f83723d9cdacbf15088b2daf4c851c",
      rawSizeBytes: 51_850,
    }),
    Object.freeze({
      ordinal: 6,
      role: "stale_run_artifact_wire_v2_definition_source",
      path: "shared/contracts/nhm2-spherical-boson-star-v2-run-artifact-wire.v2.ts",
      rawSha256:
        "5688698f294cf47f754f5e215a3b3375855365d3f8caa01b3ddf7c084165e08d",
      rawSizeBytes: 48_694,
    }),
    Object.freeze({
      ordinal: 7,
      role: "raw_replay_schema_v1_68_file_lane_definition_source",
      path: "shared/contracts/nhm2-spherical-boson-star-v2-raw-replay-schema.v1.ts",
      rawSha256:
        "c4c87f4647e2824b06d1ca7776101cf1c4bff69931effa46107abeede5c1c0ed",
      rawSizeBytes: 65_452,
    }),
  ] as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_AUTHORITY_LOCKS =
  Object.freeze({
    policyLiteralReady: false as const,
    terminalBranchStateReady: false as const,
    branchAccepted: false as const,
    branchScienceReady: false as const,
    jointAlgorithmReady: false as const,
    jointGeometryStateAccepted: false as const,
    geometryBytesReady: false as const,
    quantumStateBytesReady: false as const,
    spectralHadamardReady: false as const,
    effectiveActionStateContactReady: false as const,
    fourRadiusDerivativeEnclosureReady: false as const,
    siV2PairReady: false as const,
    metricDemandReady: false as const,
    metricDemandNondegenerate: false as const,
    constraintProbeReady: false as const,
    constraintOperandsReady: false as const,
    candidateManifestReady: false as const,
    scientificPresealReady: false as const,
    executionPresealReady: false as const,
    executionAuthorized: false as const,
    executionObserved: false as const,
    meanNoiseReady: false as const,
    outputManifestReady: false as const,
    primaryReplayReady: false as const,
    independentReplayReady: false as const,
    pairAgreementObserved: false as const,
    diagnosticPass: false as const,
    theoryGraphAuthority: false as const,
    registryPromoted: false as const,
    casimirVerificationInvoked: false as const,
    certificateReady: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
  });

export const NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_LAMPS =
  Object.freeze({
    semiclassicalStressNoiseLamp: false as const,
    semiclassicalConstraintAlgebraLamp: false as const,
    independentAgreementLamp: false as const,
    diagnosticPassLamp: false as const,
    theoryGraphLamp: false as const,
  });

const NULL_EVIDENCE_BINDINGS = Object.freeze({
  branch: Object.freeze({
    integratedCandidateSolverProgram: null,
    solverSourceBinding: null,
    dependencyLock: null,
    toolchainBinding: null,
    executableBinding: null,
    runtimeBinding: null,
    executionReceipt: null,
    terminalLevelStateRawBinding: null,
    terminalLevelStateReceipt: null,
    crossGridReceipt: null,
    limitingGroundStateProofReceipt: null,
    noFoldProofReceipt: null,
    boundaryRemainderProofReceipt: null,
    terminalResidualReplayReceipt: null,
  }),
  jointGeometryState: Object.freeze({
    jointAlgorithm: null,
    jointAlgorithmSourceBinding: null,
    dependencyLock: null,
    toolchainBinding: null,
    executableBinding: null,
    runtimeBinding: null,
    acceptedGeometryRawBinding: null,
    acceptedQuantumStateRawBinding: null,
    convergenceHistoryRawBinding: null,
    spectralHadamardWitnessRawBinding: null,
    effectiveActionStateContactRawBinding: null,
    jointWitness: null,
    authenticatedReceipt: null,
  }),
  derivativeEnclosure: Object.freeze({
    valueDerivativeEnclosureProgram: null,
    programSourceBinding: null,
    dependencyLock: null,
    toolchainBinding: null,
    executableBinding: null,
    runtimeBinding: null,
    coordinateChainRuleProofReceipt: null,
    intervalTraceRawBinding: null,
    canonicalInputEnvelopeRawBinding: null,
    acceptedGeometryEvaluationReceipt: null,
  }),
  siV2: Object.freeze({
    primaryReceipt: null,
    independentReceipt: null,
    comparisonReceipt: null,
  }),
  downstream: Object.freeze({
    meanNoiseV2SuccessorBinding: null,
    metricDemandV2SuccessorBinding: null,
    runArtifactWireV3SuccessorBinding: null,
    metricDemandPrimaryReceipt: null,
    metricDemandIndependentReceipt: null,
    metricDemandComparisonReceipt: null,
    metricDemandDerivationReceiptV2: null,
    metricDemandTensorRawBinding: null,
    metricDemandAbsoluteErrorRawBinding: null,
    metricDemandNondegeneracyReceipt: null,
    constraintProbeManifestRawBinding: null,
    scientificCandidateManifestRawBinding: null,
    scientificPresealRawBinding: null,
    primaryLaneOutputManifestRawBinding: null,
    independentLaneOutputManifestRawBinding: null,
    primaryReplayReceipt: null,
    independentReplayReceipt: null,
    pairAgreementReceipt: null,
  }),
});

const CAUSAL_CHRONOLOGY = Object.freeze([
  "01_freeze_policy_definitions_successor_versions_and_no_retune_inputs_before_execution",
  "02_execute_four_independent_full_grid_solves_and_every_frozen_amplitude_stage",
  "03_validate_every_branch_cross_grid_boundary_and_terminal_residual_receipt_or_stop_candidate",
  "04_observe_terminal_L3_N256_A2^-10_state_as_classical_iteration_seed_only",
  "05_converge_the_frozen_joint_geometry_quantum_state_algorithm_and_bind_one_fixed_point_witness",
  "06_after_joint_fixed_point_acceptance_materialize_and_hash_the_64_probe_families",
  "07_on_the_same_accepted_geometry_evaluate_four_radius_value_derivative_enclosures_and_bind_SI_v2_pair_receipts",
  "08_execute_primary_and_independent_metric_demand_v2_replays_require_exact_bytes_and_server_nondegeneracy",
  "09_persist_the_complete_scientific_candidate_manifest_and_scientific_preseal",
  "10_execute_two_disjoint_68_file_lanes_and_observe_each_postrun_manifest",
  "11_complete_both_server_replays_and_pair_agreement_before_any_diagnostic_lamp_may_change",
] as const);

const CONTRACT = {
  artifactId:
    NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_ARTIFACT_ID,
  contractVersion:
    NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_CONTRACT_VERSION,
  candidateId:
    NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_CANDIDATE_ID,
  phase: "stage_2_preexecution_authority_neutral_null_blocked_causal_interface",
  maturity:
    "definition_only_all_solver_proof_runtime_state_geometry_enclosure_output_and_replay_instances_absent",
  authority:
    "interface_freeze_only_no_branch_acceptance_geometry_state_metric_execution_lane_replay_registry_certificate_or_physical_authority",
  additiveBoundary: {
    existingContractsMutated: false,
    existingCandidateOrOutputInstanceCreated: false,
    existingRegistryEntryCreated: false,
    existingCasimirVerificationInvoked: false,
    vacuumNoFoldAndBoundaryReceiptsRequiredToFreezeThisSchema: false,
    vacuumNoFoldAndBoundaryReceiptsRequiredBeforeBranchAcceptance: true,
  },
  exactDefinitionBindings: {
    finalCandidateFreezeV2:
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_BINDING,
    finalBranchSelectionNumericsV1:
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_BINDING,
    finalSiOutputNormalizationV2:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_BINDING,
    staleSiOutputNormalizationV1:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BINDING,
    staleMeanNoiseRealizationV1:
      NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_BINDING,
    staleMetricDemandProgramV1:
      NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM_BINDING,
    staleRunArtifactWireV2:
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_BINDING,
    rawReplaySchemaV1: NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING,
    sourceBytePins:
      NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_SOURCE_BYTE_PINS,
    bindingsAndSourceObservationsGrantAuthority: false,
  },
  staleSiIntegrationBoundary: {
    finalRequiredNormalization:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_BINDING,
    staleEmbeddedNormalization:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BINDING,
    staleConsumers: Object.freeze([
      Object.freeze({
        currentConsumer:
          NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_BINDING,
        requiredSuccessorContractVersion:
          "nhm2_spherical_boson_star_v2_static_ground_state_hadamard_mean_noise_realization/v2",
        successorBinding: null,
        integrationRepaired: false,
      }),
      Object.freeze({
        currentConsumer:
          NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM_BINDING,
        requiredSuccessorContractVersion:
          "nhm2_spherical_boson_star_v2_metric_demand_program/v2",
        successorBinding: null,
        integrationRepaired: false,
      }),
      Object.freeze({
        currentConsumer:
          NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_BINDING,
        requiredSuccessorContractVersion:
          "nhm2_spherical_boson_star_v2_run_artifact_wire/v3",
        successorBinding: null,
        integrationRepaired: false,
      }),
    ] as const),
    siV2MayBeClaimedTransitivelyIntegrated: false,
    allThreeAdditiveSuccessorsRequiredBeforeCandidateAdmission: true,
  },
  terminalBranchSeedInterface: {
    terminalStateId: "L3_N256_A2^-10",
    gridNodeCount: 256,
    amplitude: "2^-10",
    packedStateOrder: Object.freeze([
      "F0_nodes_ascending_rho",
      "F1_nodes_ascending_rho",
      "varphi_nodes_ascending_rho",
      "w",
    ] as const),
    classicalEinsteinKleinGordonStateRole: "joint_iteration_seed_only",
    directMetricDemandFromTerminalClassicalStateAllowed: false,
    oneWayQuantumEvaluationOnUncorrectedClassicalGeometryAllowed: false,
    existingCalculationOnlyHashDomains: {
      rhoSnapshot: "nhm2-radial-lobatto-rho-binary64-snapshot/v1\n",
      packedState: "nhm2-radial-cross-grid-packed-state-binary64/v1\n",
      completeLevel: "nhm2-radial-cross-grid-level-state-binary64/v1\n",
      fourLevelInput: "nhm2-radial-cross-grid-four-level-input/v1\n",
      crossGridReceipt: "nhm2-radial-cross-grid-receipt/v1\n",
    },
    terminalStateReceipt: {
      hashDomain:
        "nhm2-spherical-boson-star-v2/terminal-branch-state-receipt/v1\n",
      exactRequiredFields: Object.freeze([
        "artifactId",
        "contractVersion",
        "candidateId",
        "finalBranchSelectionBinding",
        "finalBranchSelectionRawSourceBinding",
        "terminalStateId",
        "gridNodeCount",
        "amplitude",
        "packedStateOrder",
        "rhoSnapshotSha256",
        "packedStateSha256",
        "completeLevelSha256",
        "terminalStateRawBinding",
        "solverSourceBinding",
        "dependencyLock",
        "toolchainBinding",
        "executableBinding",
        "runtimeBinding",
        "runProvenance",
        "crossGridReceiptSha256",
        "branchProofReceiptSha256s",
        "noRetuneLocks",
        "receiptSha256",
      ] as const),
    },
  },
  jointGeometryStateInterface: {
    geometryId: "nhm2.semiclassical_v2.spherical_boson_star_1s.geometry/v1",
    quantumStateId:
      "nhm2.semiclassical_v2.spherical_boson_star_1s.coherent_hadamard_state/v1",
    chartId:
      "nhm2.semiclassical_v2.spherical_boson_star_1s.isotropic_cartesian_tetrad_chart/v1",
    normalizationId:
      "nhm2.semiclassical_v2.spherical_boson_star_1s.dimensionless_si_output_normalization/v1",
    sameEffectiveActionAndStateMustProduceGeometryAndQuantumState: true,
    geometryAndQuantumStateMustBeAcceptedAsOneFixedPoint: true,
    geometryRawHashMustReappearInDerivativeEnvelopeReceipt: true,
    jointWitness: {
      hashDomain:
        "nhm2-spherical-boson-star-v2/joint-geometry-state-witness/v1\n",
      exactRequiredFields: Object.freeze([
        "artifactId",
        "contractVersion",
        "candidateId",
        "geometryId",
        "quantumStateId",
        "chartId",
        "normalizationId",
        "tolerancePolicyBinding",
        "terminalSeedStateSha256",
        "jointAlgorithmBinding",
        "effectiveActionBinding",
        "renormalizationBinding",
        "operatorOrderingBinding",
        "geometryRawBinding",
        "quantumStateRawBinding",
        "convergenceHistoryRawBinding",
        "spectralHadamardWitnessRawBinding",
        "effectiveActionStateContactRawBinding",
        "runProvenance",
        "sameFixedPointChecks",
        "noRetuneLocks",
        "witnessSha256",
      ] as const),
    },
  },
  fourRadiusDerivativeEnclosureInterface: {
    acceptedMetricChart:
      "dsbar^2=-exp(2*F0)*dtau^2+exp(2*F1)*(dx^2+x^2*dOmega^2)",
    derivativeCoordinate: "x",
    exactRadiusGroupsInOrder: Object.freeze([
      Object.freeze({ radiusGroup: "r2_3_over_64", radius: "sqrt(3)/8" }),
      Object.freeze({ radiusGroup: "r2_11_over_64", radius: "sqrt(11)/8" }),
      Object.freeze({ radiusGroup: "r2_19_over_64", radius: "sqrt(19)/8" }),
      Object.freeze({ radiusGroup: "r2_27_over_64", radius: "sqrt(27)/8" }),
    ] as const),
    exactQuantitiesInOrder: Object.freeze([
      "F1",
      "F0_prime",
      "F1_prime",
      "F0_double_prime",
      "F1_double_prime",
    ] as const),
    F0ValueConsumed: false,
    exactInputEnvelopeRootKeys: Object.freeze([
      "contractVersion",
      "radiusGroups",
      "siScale",
    ] as const),
    exactRadiusGroupKeys: Object.freeze(["radiusGroup", "quantities"] as const),
    exactQuantityRecordKeys: Object.freeze([
      "quantityId",
      "centralF64WordHex",
      "centralMpfr256",
      "lowerMpfr256",
      "upperMpfr256",
    ] as const),
    exactMpfrEndpointKeys: Object.freeze([
      "sign",
      "mantissaHex",
      "exponent2",
      "precisionBits",
      "direction",
    ] as const),
    endpointRoles: Object.freeze({
      central: "C_RNDN_precision_256",
      lower: "L_RNDD_precision_256",
      upper: "U_RNDU_precision_256",
      relation: "lower<=central<=upper",
      uniqueOddDyadicNormalizationRequired: true,
    }),
    exactSiScaleKeys: Object.freeze([
      "stressScaleNCentralMpfr256",
      "stressScaleK2LowerMpfr256",
      "stressScaleK2UpperMpfr256",
    ] as const),
    acceptedGeometryEvaluationReceipt: {
      hashDomain:
        "nhm2-spherical-boson-star-v2/accepted-geometry-evaluation-receipt/v1\n",
      exactRequiredFields: Object.freeze([
        "artifactId",
        "contractVersion",
        "candidateId",
        "jointGeometryStateWitnessSha256",
        "acceptedGeometryRawBinding",
        "metricDemandProgramBinding",
        "siOutputNormalizationV2Binding",
        "siV2PrimaryReceiptSha256",
        "siV2IndependentReceiptSha256",
        "siV2ComparisonReceiptSha256",
        "canonicalInputEnvelopeRawBinding",
        "radiusGroupOrder",
        "quantityOrder",
        "endpointGrammar",
        "enclosureProgramBinding",
        "intervalTraceRawBinding",
        "coordinateChainRuleProofReceiptSha256",
        "sameGeometryAndCentralInHullChecks",
        "receiptSha256",
      ] as const),
    },
  },
  metricDemandAndLaneBoundary: {
    currentMetricDemandV1IsStaleSiConsumer: true,
    requiredMetricDemandSuccessorVersion:
      "nhm2_spherical_boson_star_v2_metric_demand_program/v2",
    metricDemandDerivationReceiptV2HashDomain:
      "nhm2-spherical-boson-star-v2/metric-demand-derivation-receipt/v2\n",
    metricDemandDerivationReceiptV2RequiredBindings: Object.freeze([
      "acceptedGeometryEvaluationReceiptSha256",
      "canonicalInputEnvelopeRawBinding",
      "jointGeometryStateWitnessSha256",
      "acceptedGeometryRawBinding",
      "acceptedQuantumStateRawBinding",
      "metricDemandProgramV2Binding",
      "siOutputNormalizationV2Binding",
      "siV2PrimaryReceiptSha256",
      "siV2IndependentReceiptSha256",
      "siV2ComparisonReceiptSha256",
      "primaryImplementationProvenance",
      "independentImplementationProvenance",
      "primaryIntervalTraceRawBinding",
      "independentIntervalTraceRawBinding",
      "metricDemandTensorRawBinding",
      "metricDemandAbsoluteErrorRawBinding",
      "exactByteAgreement",
      "serverReplayReceiptSha256",
      "metricDemandNondegeneracyReceiptSha256",
      "receiptSha256",
    ] as const),
    metricDemandScientificInputs: Object.freeze([
      Object.freeze({
        inputId: "metric_demand_tensor",
        shape: Object.freeze([64, 10] as const),
        encoding: "float64_little_endian",
        exactSizeBytes: 5_120,
        unit: "J/m^3",
      }),
      Object.freeze({
        inputId: "metric_demand_absolute_error_bound",
        shape: Object.freeze([64, 10] as const),
        encoding: "float64_little_endian",
        exactSizeBytes: 5_120,
        unit: "J/m^3",
      }),
      Object.freeze({
        inputId: "metric_demand_derivation_receipt",
        encoding: "canonical_JSON",
        exactSizeBytes: null,
        unit: null,
      }),
    ] as const),
    metricDemandFilesAreAmong68LaneOutputs: false,
    exactOutputLanePhysicalFileCount: 68,
    exactOutputLanePayloadSizeBytes: 6_693_376,
    futureDisjointLaneCount: 2,
    exactFuturePairPhysicalFileCount: 136,
    serverChecksUsingStaticMetricInputsInOrder: Object.freeze([
      "metricDemandNondegeneracy",
      "meanMetricDemandClosure",
      "metricDemandErrorEnclosure",
    ] as const),
    candidateManifestAndScientificPresealRequiredBeforeLaneExecution: true,
  },
  futureReceiptHashPolicy: {
    semanticContractHashRecipe:
      "SHA256(domain_utf8||canonical_definition_JSON_utf8)",
    receiptSelfHashRecipe:
      "SHA256(domain_utf8||u64le(canonical_unsigned_JSON_utf8_length)||canonical_unsigned_JSON_utf8)",
    receiptSelfHashFieldExcludedFromUnsignedPayload: true,
    rawPayloadHashRecipe: "SHA256(exact_raw_bytes)",
    semanticHashMaySubstituteForRawPayloadHash: false,
    canonicalObjectKeyOrder: "ascending_ECMAScript_UTF16_code_units",
  },
  causalChronology: CAUSAL_CHRONOLOGY,
  missingEvidenceBindings: NULL_EVIDENCE_BINDINGS,
  missingProducerAndProofInventory: Object.freeze([
    "integrated_four_grid_branch_solver_absent",
    "branch_solver_source_dependency_toolchain_executable_runtime_closure_absent",
    "branch_acceptance_and_cross_grid_proof_receipts_absent",
    "terminal_N256_state_bytes_and_receipt_absent",
    "joint_geometry_quantum_state_solver_absent",
    "effective_action_state_contact_realization_absent",
    "accepted_geometry_and_quantum_state_canonical_serializers_absent",
    "joint_fixed_point_convergence_witness_absent",
    "spectral_Hadamard_and_state_contact_witnesses_absent",
    "accepted_geometry_state_receipt_absent",
    "64_probe_family_materializer_and_manifest_absent",
    "four_radius_value_first_and_second_x_derivative_interval_evaluator_absent",
    "rho_to_x_derivative_chain_rule_proof_receipt_absent",
    "four_radius_primary_and_independent_interval_traces_absent",
    "SI_v2_primary_independent_and_comparison_receipts_absent",
    "metric_demand_v2_definition_successor_absent",
    "metric_demand_primary_and_independent_real_implementations_absent",
    "metric_demand_tensor_error_derivation_replay_and_nondegeneracy_receipts_absent",
    "mean_noise_v2_definition_and_numerical_realizations_absent",
    "run_artifact_wire_v3_definition_successor_absent",
    "constraint_probe_target_operand_and_independent_producers_absent",
    "additive_science_derivation_DAG_successor_absent",
    "candidate_manifest_and_scientific_preseal_absent",
    "two_disjoint_68_file_lane_producers_and_postrun_manifests_absent",
    "server_replays_pair_agreement_registry_certificate_and_physical_authority_absent",
  ] as const),
  publicBoundary: {
    ingress: "primitive_prebounded_exact_canonical_JSON_text_only",
    callerOwnedObjectGraphsAccepted: false,
    codeUnitCapBeforeUtf8Measurement: true,
    utf8CapBeforeCanonicalComparison: true,
    JSONParseOfCallerTextPerformed: false,
    exactCanonicalStringEqualityRequired: true,
    hostileProxyAccessorOrPrototypeSurfaceObserved: false,
  },
  validatorLimits:
    NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_VALIDATOR_LIMITS,
  readiness: Object.freeze({
    branchReady: false,
    jointGeometryStateReady: false,
    derivativeEnclosureReady: false,
    siV2PairReady: false,
    successorDefinitionsReady: false,
    metricDemandReady: false,
    laneReady: false,
    replayReady: false,
  }),
  authorityLocks:
    NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_AUTHORITY_LOCKS,
  lamps: NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_LAMPS,
} as const;

type CanonicalValue =
  | null
  | boolean
  | number
  | string
  | readonly CanonicalValue[]
  | { readonly [key: string]: CanonicalValue };

const canonicalJson = (value: CanonicalValue): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const record = value as { readonly [key: string]: CanonicalValue };
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key]!)}`)
    .join(",")}}`;
};

const deepFreeze = <T>(value: T, seen = new Set<object>()): T => {
  if (
    value === null ||
    typeof value !== "object" ||
    seen.has(value as object)
  ) {
    return value;
  }
  seen.add(value as object);
  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreeze(child, seen);
  }
  return Object.freeze(value);
};

const allNullLeaves = (value: unknown): boolean => {
  if (value === null) return true;
  if (typeof value !== "object" || value === null) return false;
  return Object.values(value as Record<string, unknown>).every(allNullLeaves);
};

const allFalseLeaves = (value: unknown): boolean => {
  if (value === false) return true;
  if (typeof value !== "object" || value === null) return false;
  return Object.values(value as Record<string, unknown>).every(allFalseLeaves);
};

export const NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1 =
  deepFreeze(CONTRACT);
export type Nhm2SphericalBosonStarV2AcceptedGeometryStateHandoffV1 =
  typeof NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1;

export const NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_CANONICAL_JSON =
  canonicalJson(
    NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1 as unknown as CanonicalValue,
  );
export const NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_SEMANTIC_SHA256 =
  createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_SEMANTIC_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_PLAIN_CANONICAL_SHA256 =
  createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_CANONICAL_JSON,
    "utf8",
  );

// These literals were frozen only after an independent parent recomputed and
// explicitly acknowledged semantic SHA-256, plain canonical SHA-256, and
// canonical UTF-8 byte size. They are outside the semantic payload.
export const NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_EXPECTED_SEMANTIC_SHA256:
  string | null =
  "e9a4c816d8e2680b27eca4c9a4cb0205262a89b4490595bcb994218a1cad70d9";
export const NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_EXPECTED_PLAIN_CANONICAL_SHA256:
  string | null =
  "2bff4a1c8647f53087d20507e6fcb735d9cce82718767da204268d2cd031a896";
export const NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_EXPECTED_CANONICAL_SIZE_BYTES:
  number | null = 23_347;
export const NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_LITERAL_SEAL_STATUS =
  "sealed_after_independent_parent_acknowledgement_before_any_candidate_execution" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_BINDING =
  Object.freeze({
    artifactId:
      NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_CONTRACT_VERSION,
    candidateId:
      NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_CANDIDATE_ID,
    hashSemantics:
      "domain_separated_semantic_contract_seal_distinct_from_plain_canonical_hash_and_observed_raw_binding" as const,
    semanticSha256Domain:
      NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_SEMANTIC_SHA256_DOMAIN,
    semanticSha256:
      NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_SEMANTIC_SHA256,
    plainCanonicalSha256:
      NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_PLAIN_CANONICAL_SHA256,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_CANONICAL_SIZE_BYTES,
    mediaType: "application/json" as const,
    observedRawBinding: null,
    literalSealStatus:
      NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_LITERAL_SEAL_STATUS,
  });

const exactModernBinding = (
  binding: Readonly<{
    semanticSha256: string;
    plainCanonicalSha256: string;
    canonicalSizeBytes: number;
  }>,
  pin: Readonly<{
    semanticSha256: string;
    plainCanonicalSha256: string;
    canonicalSizeBytes: number;
  }>,
): boolean =>
  binding.semanticSha256 === pin.semanticSha256 &&
  binding.plainCanonicalSha256 === pin.plainCanonicalSha256 &&
  binding.canonicalSizeBytes === pin.canonicalSizeBytes;

const exactLegacyBinding = (
  binding: Readonly<{ sha256: string; canonicalSizeBytes: number }>,
  pin: Readonly<{ semanticSha256: string; canonicalSizeBytes: number }>,
): boolean =>
  binding.sha256 === pin.semanticSha256 &&
  binding.canonicalSizeBytes === pin.canonicalSizeBytes;

const assertInvariants = (): void => {
  const pins =
    NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_BINDING_PINS;
  const contract =
    NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1;
  if (
    !exactModernBinding(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_BINDING,
      pins.finalCandidateFreezeV2,
    ) ||
    !exactModernBinding(
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_BINDING,
      pins.finalBranchSelectionNumericsV1,
    ) ||
    !exactLegacyBinding(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_BINDING,
      pins.finalSiOutputNormalizationV2,
    ) ||
    !exactLegacyBinding(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BINDING,
      pins.staleSiOutputNormalizationV1,
    ) ||
    !exactLegacyBinding(
      NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_BINDING,
      pins.staleMeanNoiseRealizationV1,
    ) ||
    !exactLegacyBinding(
      NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM_BINDING,
      pins.staleMetricDemandProgramV1,
    ) ||
    !exactLegacyBinding(
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_BINDING,
      pins.staleRunArtifactWireV2,
    ) ||
    !exactLegacyBinding(
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING,
      pins.rawReplaySchemaV1,
    )
  ) {
    throw new Error(
      "spherical_v2_accepted_geometry_state_handoff_v1_dependency_binding_drift",
    );
  }
  if (
    contract.terminalBranchSeedInterface.terminalStateId !== "L3_N256_A2^-10" ||
    contract.terminalBranchSeedInterface
      .directMetricDemandFromTerminalClassicalStateAllowed !== false ||
    contract.jointGeometryStateInterface
      .geometryAndQuantumStateMustBeAcceptedAsOneFixedPoint !== true ||
    contract.fourRadiusDerivativeEnclosureInterface.exactRadiusGroupsInOrder
      .map((entry) => entry.radiusGroup)
      .join(",") !== "r2_3_over_64,r2_11_over_64,r2_19_over_64,r2_27_over_64" ||
    contract.fourRadiusDerivativeEnclosureInterface.exactQuantitiesInOrder.join(
      ",",
    ) !== "F1,F0_prime,F1_prime,F0_double_prime,F1_double_prime" ||
    contract.metricDemandAndLaneBoundary.exactOutputLanePhysicalFileCount !==
      68 ||
    contract.metricDemandAndLaneBoundary.exactOutputLanePayloadSizeBytes !==
      6_693_376 ||
    contract.staleSiIntegrationBoundary.staleConsumers.some(
      (entry) =>
        entry.integrationRepaired !== false || entry.successorBinding !== null,
    ) ||
    !allNullLeaves(contract.missingEvidenceBindings) ||
    !allFalseLeaves(contract.readiness) ||
    !allFalseLeaves(contract.authorityLocks) ||
    !allFalseLeaves(contract.lamps) ||
    NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_EXPECTED_SEMANTIC_SHA256 !==
      NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_SEMANTIC_SHA256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_EXPECTED_PLAIN_CANONICAL_SHA256 !==
      NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_PLAIN_CANONICAL_SHA256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_EXPECTED_CANONICAL_SIZE_BYTES !==
      NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_CANONICAL_SIZE_BYTES ||
    NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_LITERAL_SEAL_STATUS !==
      "sealed_after_independent_parent_acknowledgement_before_any_candidate_execution" ||
    NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_BINDING.observedRawBinding !==
      null
  ) {
    throw new Error(
      "spherical_v2_accepted_geometry_state_handoff_v1_null_false_unpinned_invariant",
    );
  }
  if (
    NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_CANONICAL_JSON.length >
      NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_VALIDATOR_LIMITS.maximumWireUtf16CodeUnits ||
    NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_CANONICAL_SIZE_BYTES >
      NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_VALIDATOR_LIMITS.maximumWireUtf8Bytes
  ) {
    throw new Error(
      "spherical_v2_accepted_geometry_state_handoff_v1_canonical_wire_exceeds_limits",
    );
  }
};

assertInvariants();

export const nhm2SphericalBosonStarV2AcceptedGeometryStateHandoffV1WireViolations =
  (wire: unknown): string[] => {
    if (typeof wire !== "string") {
      return [
        "spherical_v2_accepted_geometry_state_handoff_v1_wire_must_be_primitive_string",
      ];
    }
    if (
      wire.length >
      NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_VALIDATOR_LIMITS.maximumWireUtf16CodeUnits
    ) {
      return [
        "spherical_v2_accepted_geometry_state_handoff_v1_wire_utf16_limit",
      ];
    }
    if (
      Buffer.byteLength(wire, "utf8") >
      NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_VALIDATOR_LIMITS.maximumWireUtf8Bytes
    ) {
      return [
        "spherical_v2_accepted_geometry_state_handoff_v1_wire_utf8_limit",
      ];
    }
    return wire ===
      NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_CANONICAL_JSON
      ? []
      : [
          "spherical_v2_accepted_geometry_state_handoff_v1_canonical_wire_mismatch",
        ];
  };

export const isNhm2SphericalBosonStarV2AcceptedGeometryStateHandoffV1Wire = (
  wire: unknown,
): wire is string =>
  nhm2SphericalBosonStarV2AcceptedGeometryStateHandoffV1WireViolations(wire)
    .length === 0;

export const cloneNhm2SphericalBosonStarV2AcceptedGeometryStateHandoffV1CanonicalWire =
  (): string =>
    NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_CANONICAL_JSON;
