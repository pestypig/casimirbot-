import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { isProxy } from "node:util/types";

import {
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256,
} from "./nhm2-spherical-boson-star-newtonian-seed.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_SHA256,
} from "./nhm2-spherical-boson-star-newtonian-seed-operation-policy.v1";

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_ARTIFACT_ID =
  "nhm2.spherical_boson_star_newtonian_seed_primary_numerics" as const;
export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_VERSION =
  "nhm2_spherical_boson_star_newtonian_seed_primary_numerics/v1" as const;

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_DEPENDENCY_PINS =
  Object.freeze({
    semanticSeed: Object.freeze({
      sha256:
        "b2a89c8065bd6865b26aa1c4365d0f48edbd40e9c4f43e0cfbaca49db29a6c2c",
      canonicalSizeBytes: 18894,
    }),
    incompleteOperationPolicy: Object.freeze({
      sha256:
        "3aaadad7b8bec8d7883c172c380e10d3100c9e4c64404740b963e5820762de24",
      canonicalSizeBytes: 32308,
    }),
    gaussLegendre256Fixture: Object.freeze({
      manifest: Object.freeze({
        relativePath:
          "configs/research/nhm2-spherical-gl256-mpfr256-manifest.v1.json",
        schemaVersion: "nhm2_spherical_gl256_mpfr256_manifest/v1",
        sha256:
          "9b600578714821fddb41ad2c1b2c456bfdb11795d500200b55515a28948774e4",
        sizeBytes: 5390,
      }),
      rawRecords: Object.freeze({
        relativePath:
          "configs/research/fixtures/nhm2-spherical-gl256-mpfr256.v1.jsonl",
        schemaVersion: "nhm2_spherical_gl256_mpfr256_record/v1",
        sha256:
          "966a28e7a0c5633709b5e59e2c0b99bb8d25e2ddadccf0cc391ebd1a9c70f794",
        sizeBytes: 77842,
      }),
      generatorVerifier: Object.freeze({
        relativePath:
          "scripts/research/build-verify-nhm2-spherical-gl256-mpfr256.py",
        sha256:
          "3acc145080a0bb799f58292640245d84f76c7f2ea445349bc0db58ef40eca5ed",
        sizeBytes: 25877,
      }),
      independentTest: Object.freeze({
        relativePath: "tests/nhm2-spherical-gl256-mpfr256-fixture.spec.ts",
        sha256:
          "bbec4f9040578e3a4c9be138718bd98a3169c58d5b553c0e7a7dd49f5e1de7b5",
        sizeBytes: 31699,
      }),
      finalManifestRawGeneratorAndTestPinsBound: true,
    }),
  } as const);

const CORE_LEVELS = Object.freeze([
  Object.freeze({ id: "L0", radialNodeCount: 64, unknownCount: 129 }),
  Object.freeze({ id: "L1", radialNodeCount: 96, unknownCount: 193 }),
  Object.freeze({ id: "L2", radialNodeCount: 128, unknownCount: 257 }),
] as const);

const AUTHORITY_LOCKS = Object.freeze({
  primaryNumericsSemanticAuthority: false,
  fixtureRuntimeAuthority: false,
  implementationClosureComplete: false,
  runtimeClosureComplete: false,
  preexecutionPresealPresent: false,
  executionAuthorized: false,
  executionObserved: false,
  outputPresent: false,
  outputAccepted: false,
  seedAccepted: false,
  branchAccepted: false,
  nondegeneracyAccepted: false,
  runReplayAccepted: false,
  independentAgreementAccepted: false,
  semiclassicalStressNoiseLamp: false,
  semiclassicalConstraintAlgebraLamp: false,
  diagnosticPass: false,
  candidateAuthority: false,
  theoryGraphAuthority: false,
  physicalViability: false,
  propulsion: false,
  transport: false,
} as const);

const UNRESOLVED = Object.freeze({
  primarySourceManifest: null,
  primaryToolchainManifest: null,
  primaryExecutableBinding: null,
  primaryRuntimeBinding: null,
  candidateManifest: null,
  preexecutionPreseal: null,
  executionCommand: null,
  executionReceipt: null,
  outputDescriptor: null,
  primaryResult: null,
} as const);

const BLOCKERS = Object.freeze([
  "primary_source_toolchain_executable_and_runtime_closure_absent",
  "candidate_manifest_and_preexecution_preseal_absent",
  "primary_numerics_not_implemented_or_executed",
  "directed_proof_and_independent_replay_absent",
] as const);

const SYNTHETIC_CONFORMANCE_FIXTURES = Object.freeze({
  candidateDataUsed: false,
  differentiationN3: Object.freeze({
    nodeBits: Object.freeze([
      "0000000000000000",
      "3fe0000000000000",
      "3ff0000000000000",
    ]),
    barycentricWeightBits: Object.freeze([
      "3fe0000000000000",
      "bff0000000000000",
      "3fe0000000000000",
    ]),
    expectedDBitsRowMajor: Object.freeze([
      "c008000000000000",
      "4010000000000000",
      "bff0000000000000",
      "bff0000000000000",
      "0000000000000000",
      "3ff0000000000000",
      "3ff0000000000000",
      "c010000000000000",
      "4008000000000000",
    ]),
    expectedD2BitsRowMajor: Object.freeze([
      "4010000000000000",
      "c020000000000000",
      "4010000000000000",
      "4010000000000000",
      "c020000000000000",
      "4010000000000000",
      "4010000000000000",
      "c020000000000000",
      "4010000000000000",
    ]),
  }),
  pivotedLuN2: Object.freeze({
    matrixBitsRowMajor: Object.freeze([
      "0000000000000000",
      "4000000000000000",
      "3ff0000000000000",
      "3ff0000000000000",
    ]),
    rightHandSideBits: Object.freeze(["4010000000000000", "4008000000000000"]),
    expectedPivotRows: Object.freeze([1, 1]),
    refinementPassCount: 3,
    expectedSolutionBits: Object.freeze([
      "3ff0000000000000",
      "4000000000000000",
    ]),
  }),
  tailMassDualN3: Object.freeze({
    variableOrder: Object.freeze(["C", "h0", "q0"]),
    inputBits: Object.freeze({
      C: "4008000000000000",
      h0: "4010000000000000",
      q0: "401c000000000000",
      R: "4000000000000000",
      y: "3fe0000000000000",
      kappa: "3ff0000000000000",
      H1: "3ff0000000000000",
      U1: "0000000000000000",
    }),
    expectedValueBits: "4062c155b8213cf3",
    expectedDerivativeBits: Object.freeze([
      "40609f655ff28dfc",
      "4042c155b8213cf3",
      "0000000000000000",
    ]),
  }),
  xMapDivergence: Object.freeze({
    rhoBits: "3dcbcaee3586fca8",
    binary64ResidualXBits: "3dcbcaee358d0587",
    mpfrInitializerMaterializationXGetDBits: "3dcbcaee358d0586",
    expectedUlpSeparation: 1,
  }),
  initializerInteriorAtRhoHalf: Object.freeze({
    rhoBits: "3fe0000000000000",
    expectedKgBits: "3feef30abf082e7f",
    expectedNuBits: "bfddeeea11683f4a",
    expectedExpMinusKgXBits: "3fd85482667b917d",
    expectedExpMinusTwoKgXBits: "3fc27fa2c866c4ec",
    expectedUBits: "3fe7ee4348388388",
    expectedVBits: "bff109fdbb3ed563",
  }),
  lobattoNodeGroupingN5: Object.freeze({
    denominator: 4,
    expectedNodeBits: Object.freeze([
      "0000000000000000",
      "3fc2bec333018867",
      "3fe0000000000000",
      "3feb504f333f9de6",
      "3ff0000000000000",
    ]),
  }),
  dctGroupingN3: Object.freeze({
    inputValueBitsInRhoOrder: Object.freeze([
      "3ff0000000000000",
      "4000000000000000",
      "4010000000000000",
    ]),
    expectedCoefficientBits: Object.freeze([
      "4002000000000000",
      "3ff8000000000000",
      "3fd0000000000000",
    ]),
  }),
  joinGroupingN3: Object.freeze({
    joinNumerator: 2,
    joinDenominator: 3,
    nodeBits: Object.freeze([
      "0000000000000000",
      "3fe0000000000000",
      "3ff0000000000000",
    ]),
    weightBits: Object.freeze([
      "3fe0000000000000",
      "bff0000000000000",
      "3fe0000000000000",
    ]),
    uValueBits: Object.freeze([
      "3ff0000000000000",
      "4006000000000000",
      "4018000000000000",
    ]),
    VValueBits: Object.freeze([
      "c000000000000000",
      "bffc000000000000",
      "c000000000000000",
    ]),
    expectedBarrierBits: Object.freeze({
      U: "400d555555555555",
      U1: "3fe5555555555555",
      V: "bffc71c71c71c71c",
      V1: "bfa2f684bda12f68",
    }),
  }),
  endpointProjectionN3: Object.freeze({
    rawStateBits: Object.freeze([
      "3ff0000000000000",
      "3fe0000000000000",
      "3d70000000000000",
      "c000000000000000",
      "bff0000000000000",
      "bd60000000000000",
      "bfe0000000000000",
    ]),
    uInfinityIndex: 2,
    VInfinityIndex: 5,
    expectedProjectedStateBits: Object.freeze([
      "3ff0000000000000",
      "3fe0000000000000",
      "0000000000000000",
      "c000000000000000",
      "bff0000000000000",
      "0000000000000000",
      "bfe0000000000000",
    ]),
  }),
  massBarrierChronology: Object.freeze({
    CBits: "4022602169ea8c68",
    core64Bits: "401d6add5b7577b8",
    tail64Bits: "401c1ed9793b3cf1",
    expectedCMinusCoreMinusTailBits: "c014c97400db9bd9",
    forbiddenCMinusCorePlusTailBits: "c014c97400db9bd8",
  }),
  scalarMpfrBarrier: Object.freeze({
    projectedNuBits: "bfe0000000000000",
    projectedVcBits: "c008000000000000",
    acceptedCBits: "4000000000000000",
    expectedBarrierBitsInScalarOrder: Object.freeze([
      "bfe0000000000000",
      "c008000000000000",
      "403921fb54442d18",
      "4000000000000000",
      "3ff0000000000000",
      "3ff0000000000000",
      "3fa0000000000000",
      "bf40000000000000",
      "3feffbffbff7fec0",
    ]),
  }),
} as const);

const POLICY = {
  artifactId:
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_ARTIFACT_ID,
  policyVersion:
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_VERSION,
  candidateId: NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1.candidateId,
  maturity:
    "stage_2_frozen_primary_numeric_graph_with_bound_GL256_fixture_without_implementation_runtime_execution_or_acceptance_authority",
  frozenBeforeExecution: true,
  bindings: {
    semanticSeed:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_DEPENDENCY_PINS.semanticSeed,
    incompleteOperationPolicy:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_DEPENDENCY_PINS.incompleteOperationPolicy,
    gaussLegendre256Fixture:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_DEPENDENCY_PINS.gaussLegendre256Fixture,
  },
  scope: {
    freezes:
      "primary_node_operator_initializer_transfer_residual_Jacobian_Newton_LU_fixed_quadrature_and_output_materialization_operation_graphs_only",
    doesNotFreeze:
      "directed_interval_or_radii_proof_source_toolchain_executable_runtime_preseal_or_candidate_results",
    candidateSolvePerformedByThisModule: false,
    fixtureDataEmbeddedOrGuessed: false,
    serverOwnedReplayLane:
      "generic_v2_transport_target_is_outside_this_candidate_science_contract",
    v3ReplayAuthorityAsserted: false,
    transportRegistrationAuthorityAsserted: false,
  },
  predecessorSupersession: {
    predecessor:
      "nhm2_spherical_boson_star_newtonian_seed_operation_policy/v1_exactly_bound_by_incompleteOperationPolicy",
    rule: "the_predecessor_remains_the_architectural_and_scientific_semantic_baseline;_for_each_row_below_only_the_named_primary_finite_numeric_operation_is_replaced_by_this_successor_and_every_nonlisted_predecessor_semantic_remains_in_force",
    rows: [
      {
        predecessorTopic: "single_underspecified_rho_to_x_mapping",
        successorTopic:
          "distinct_binary64_residual_xMap_and_MPFR256_initializer_materialization_xMap",
        controllingDefinition:
          "coreNodesAndOperators.binary64ResidualXMap_and_mpfrInitializerAndMaterializationXMap",
      },
      {
        predecessorTopic:
          "mass_integral_barrier_or_core_plus_tail_accumulation_wording",
        successorTopic:
          "separate_MPFR256_coreSum_and_tailSum_barriers_followed_by_one_frozen_binary64_mass_residual_chronology",
        controllingDefinition:
          "fixedGaussLegendre256Quadrature.accumulation_massResidual_and_tailSumBarrierOrder",
      },
      {
        predecessorTopic:
          "scalar_output_values_reused_from_binary64_tail_residual_intermediates",
        successorTopic:
          "one_MPFR256_scalar_materialization_graph_recomputed_from_the_projected_final_state",
        controllingDefinition: "outputMaterialization.scalarMpfrGraph",
      },
      {
        predecessorTopic: "accepted_endpoint_bits_without_a_projection_gate",
        successorTopic:
          "raw_acceptance_receipt_then_deterministic_positive_zero_endpoint_projection_and_full_residual_recheck",
        controllingDefinition: "postsolveEndpointProjection",
      },
      {
        predecessorTopic: "implicit_or_dynamic_numeric_storage",
        successorTopic:
          "fixed_mpfr_binary64_uint32_and_output_arenas_with_exact_allocation_and_liveness",
        controllingDefinition: "resourceModel",
      },
    ],
    successorDoesNotSupersedeSemanticSeed: true,
    successorDoesNotCreateReplayTransportOrAcceptanceAuthority: true,
  },
  closedPrimaryApi: {
    requestExactKeyOrder: [
      "candidateId",
      "semanticSeedSha256",
      "operationPolicySha256",
      "primaryNumericsSha256",
      "gaussLegendreManifestSha256",
      "gaussLegendreRawSha256",
      "preexecutionPresealSha256",
      "attemptOrdinal",
      "outputRoot",
    ],
    requestSemantics: {
      candidateId: "literal_frozen_candidate_id",
      semanticSeedSha256: "literal_bound_semantic_seed_sha256",
      operationPolicySha256: "literal_bound_incomplete_prepolicy_sha256",
      primaryNumericsSha256: "literal_this_policy_sha256",
      gaussLegendreManifestSha256: "literal_bound_GL256_manifest_sha256",
      gaussLegendreRawSha256: "literal_bound_GL256_raw_records_sha256",
      preexecutionPresealSha256:
        "literal_hash_of_the_future_exact_preexecution_preseal",
      attemptOrdinal: "exact_integer_1",
      outputRoot:
        "absolute_predeclared_absent_output_root_string_with_no_numeric_semantics",
    },
    callerSuppliedNumericalKnobsAllowed: false,
    callerSuppliedInitialValuesAllowed: false,
    callerSuppliedTolerancePrecisionGridJoinTailOrderQuadratureOrIterationLimitsAllowed: false,
    extraRequestKeysAllowed: false,
    recursiveUnknownKeyDisposition:
      "reject_before_any_candidate_numeric_read_with_forbidden_or_extra_input_role",
    explicitlyForbiddenInputRoles: [
      "declared_lever_tensor",
      "declared_tile_tensor",
      "lever_tensor",
      "tile_tensor",
      "lever_or_tile_tensor",
      "submitted_lever_or_tile_tensor",
      "tile_weight_tensor",
      "tile_geometry_tensor",
      "warp_control_tensor",
      "external_source_tensor",
      "caller_initializer_u",
      "caller_initializer_V",
      "caller_initializer_nu",
      "caller_initializer_C_h_q",
      "caller_grid_nodes",
      "caller_tolerances",
      "caller_solver_options",
    ],
    explicitlyForbiddenOutputRoles: [
      "declared_lever_tensor",
      "declared_tile_tensor",
      "lever_tensor",
      "tile_tensor",
      "lever_or_tile_tensor",
      "submitted_lever_or_tile_tensor",
      "tile_weight_tensor",
      "tile_geometry_tensor",
      "warp_control_tensor",
      "external_source_tensor",
      "physical_viability",
      "propulsion_unlock",
      "transport_unlock",
    ],
    outputExtraRoleDisposition:
      "reject_materialization_before_atomic_publish_and_fail_the_candidate",
    declaredLeverOrTileTensorUsed: false,
  },
  resourceModel: {
    preflightOrder: [
      "verify_all_dependency_file_sizes_and_hashes",
      "install_the_frozen_MPFR_exponent_range",
      "allocate_one_native_mpfr_t_array_of_exactly_65536_elements_and_call_mpfr_init2_256_on_indices_increasing_0_through_65535",
      "allocate_one_ArrayBuffer_of_exactly_2097152_bytes_and_one_Float64Array_view_of_exactly_262144_elements_then_fill_in_index_order_with_positive_zero",
      "allocate_one_ArrayBuffer_of_exactly_1028_bytes_and_one_Uint32Array_view_of_exactly_257_elements_then_fill_in_index_order_with_zero",
      "allocate_no_output_buffers_until_every_core_projection_tail_solve_and_final_residual_gate_has_succeeded",
    ],
    failure:
      "any_exponent_range_initialization_allocation_mpfr_init2_or_exact_length_failure_is_resource_preflight_failure_before_candidate_numeric_read;_clear_every_successfully_initialized_mpfr_slot_in_decreasing_index_order_and_do_not_retry_shrink_spill_or_change_layout",
    mpfrArena: {
      elementCount: 65536,
      precisionBitsPerElement: 256,
      logicalSignificandBytes: 2097152,
      nativeAllocation:
        "one_contiguous_native_mpfr_t[65536]_descriptor_array_plus_each_library_owned_256_bit_limb_allocation;_the_future_toolchain_manifest_must_record_sizeof_mpfr_t_GMP_NUMB_BITS_descriptor_bytes_and_total_limb_bytes_but_may_not_change_element_count_precision_or_indices",
      phaseReuseRule:
        "a_phase_may_overwrite_only_a_range_declared_for_that_phase_after_every_consumer_from_the_previous_phase_has_crossed_its_named_binary64_or_immutable_MPFR_barrier;_before_reuse_set_each_slot_in_increasing_order_to_exact_positive_zero",
      nodeOperatorPhaseLayout: [
        "0..127=current_level_rhoMp_in_node_order_with_unused_suffix_positive_zero",
        "128..255=current_level_barycentricWeightMp_in_node_order_with_unused_suffix_positive_zero",
        "256..16639=current_level_Dmp_row_major_capacity_128_squared_with_unused_suffix_positive_zero",
        "16640..33023=current_level_D2mp_row_major_capacity_128_squared_with_unused_suffix_positive_zero",
        "33024..33087=64_named_node_operator_transfer_or_iterative_refinement_scratch_handles",
        "33088..65535=initialized_positive_zero_forbidden_reserve",
      ],
      quadraturePhaseLayout: [
        "0..511=immutable_fixture_values_index_interleaved_node_then_weight",
        "512..767=current_cell_mapped_points_fixture_index_order",
        "768..8959=current_tail_cell_T_table_256_by_32_node_outer_then_n_inner",
        "8960..13183=64_dual_registers_register_outer_each_primal_then_d0_through_d64",
        "13184..13249=tailSum_primal_then_d0_through_d64",
        "13250=immutable_projected_L2_coreSum_retained_from_its_once_only_completion_through_every_tail_Newton_and_final_residual_evaluation",
        "13251..13319=69_named_cell_coordinate_and_conversion_scratch_handles",
        "13320..65535=initialized_positive_zero_forbidden_reserve",
      ],
      materializationPhaseLayout: [
        "0..511=immutable_fixture_values_retained_but_not_used_by_array_materialization",
        "512..767=current_level_rhoMp_handles_with_all_256_AUDIT_handles_retained_through_its_last_target_role",
        "768..1023=composite_evaluator_constants_input_core_tail_T_and_accumulator_handles",
        "1024..1535=DCT_and_scalar_materialization_handles",
        "1536..65535=initialized_positive_zero_forbidden_reserve",
      ],
    },
    binary64SolverArena: {
      elementCount: 262144,
      byteLength: 2097152,
      maximumCoreLayout: [
        "0..127=rho",
        "128..16511=D_row_major",
        "16512..32895=D2_row_major",
        "32896..33152=rawAcceptedState_or_currentState",
        "33153..33409=projectedAcceptedState",
        "33410..33666=trialState",
        "33667..33923=currentResidual",
        "33924..34180=trial_or_projectedResidual",
        "34181..34437=delta",
        "34438..34694=rightHandSide",
        "34695..100743=unfactoredJacobian_row_major",
        "100744..166792=LU_row_major",
        "166793..167049=refinementResidual",
        "167050..167306=refinementCorrection",
        "167307..167563=forwardSolveVector",
        "167564..167820=acceptedStep",
        "167821..168076=transfer_source_rho_bits_prefix_or_coefficient_scratch",
        "168077..168080=join_barrier_U_U1_V_V1_then_168081..168140=join_scratch",
        "168141..168269=immutable_projected_L0_archive_length_129",
        "168270..168462=immutable_projected_L1_archive_length_193",
        "168463..168719=immutable_projected_L2_archive_length_257",
        "168720..168847=immutable_L2_rho_source_support_written_only_after_projected_L2_gate",
        "168848..262143=positive_zero_forbidden_reserve",
      ],
      tailPhaseLayout: [
        "32896..32960=currentTailState_length_65",
        "33410..33474=trialTailState_length_65",
        "33667..33731=currentTailResidual_length_65",
        "33924..33988=trialOrFinalTailResidual_length_65",
        "34181..34245=tailDelta_length_65",
        "34438..34502=tailRightHandSide_length_65",
        "34695..38919=tailUnfactoredJacobian_row_major_65_squared",
        "38920..43143=64_binary64_dual_scratch_registers_each_primal_then_d0_through_d64",
        "100744..104968=tailLU_row_major_65_squared",
        "166793..166857=tailRefinementResidual_length_65",
        "167050..167114=tailRefinementCorrection_length_65",
        "167307..167371=tailForwardSolveVector_length_65",
        "167564..167628=tailAcceptedStep_length_65",
        "167821..167852=tailNodeBits_length_32_then_167853..167916=tail_constant_and_lift_scratch_length_64",
        "168077..168080=immutable_join_barrier_U_U1_V_V1_then_168081..168140=tail_join_scratch",
        "168141..168719=immutable_projected_level_archives",
        "168720..168847=immutable_L2_rho_source_support",
        "every_other_slot_is_set_to_positive_zero_before_tail_evaluation_and_remains_forbidden",
      ],
      tailReuse:
        "after_L2_projection_join_and_core_quadrature_have_crossed_their_named_barriers_clear_every_binary64_slot_other_than_the_three_immutable_projected_level_archives_join_slots_168077_through_168080_and_immutable_L2_rho_source_support_168720_through_168847_to_positive_zero_in_increasing_index_order_then_use_exactly_tailPhaseLayout;_those_binary64_survivors_plus_MPFR_coreSum_slot_13250_and_after_acceptance_currentTailState_slots_32896_through_32960_remain_live_and_unchanged_through_their_last_output_materialization_consumer;_raw_and_working_projected_ranges_may_be_reused_only_after_their_receipt_hashes_and_archive_copy",
    },
    coreLevelOperatorLifetime: {
      operatorSetCapacity: 1,
      levelOrder: ["L0", "L1", "L2"],
      currentLevelStorage:
        "only_one_level's_rho_barycentric_D_D2_MPFR_and_binary64_operator_set_is_live;_the_level_N_uses_only_the_length_N_or_N_squared_prefixes_and_every_unused_capacity_slot_remains_positive_zero",
      transferSourceRhoScratch: {
        range: "binary64_slots_167821_through_168076_length_256",
        L0ToL1:
          "after_projected_L0_archive_and_receipt_hashes_copy_L0_rho_bits_0_through_63_to_scratch_167821_through_167884_in_increasing_j_order_then_clear_the_old_current_operator_set_and_generate_L1_as_the_only_current_operator_set",
        L1ToL2:
          "after_projected_L1_archive_and_receipt_hashes_copy_L1_rho_bits_0_through_95_to_scratch_167821_through_167916_in_increasing_j_order_then_clear_the_old_current_operator_set_and_generate_L2_as_the_only_current_operator_set",
        sourceValues:
          "read_source_u_and_V_only_from_the_corresponding_immutable_projected_level_archive_and_source_rho_only_from_the_exact_scratch_prefix;_read_target_rho_from_the_new_current_rho_prefix",
        release:
          "after_the_complete_transferred_u_then_V_then_nu_state_has_been_written_to_currentState_clear_the_used_source_rho_scratch_prefix_in_increasing_index_order_before_the_new_level's_first_residual_evaluation",
      },
      perLevelChronology: [
        "generate_only_L0_nodes_weights_Dmp_D2mp_then_their_binary64_barriers;_clear_MPFR_Dmp_D2mp_after_the_complete_barriers_but_retain_L0_binary64_rho_D_D2_through_the_projected_L0_residual_gate",
        "archive_projected_L0_copy_source_rho_to_transfer_scratch_clear_L0_operator_storage_generate_only_L1_nodes_weights_Dmp_D2mp_and_binary64_barriers_transfer_then_solve_and_project_L1",
        "archive_projected_L1_copy_source_rho_to_transfer_scratch_clear_L1_operator_storage_generate_only_L2_nodes_weights_Dmp_D2mp_and_binary64_barriers_transfer_then_solve_and_project_L2",
        "retain_L2_binary64_rho_D_D2_through_the_projected_L2_residual_gate;_copy_L2_rho_bits_0_through_127_in_j_order_to_immutable_source_support_168720_through_168847;_then_retain_the_current_L2_rho_through_join_and_once_only_core_quadrature;_only_after_both_barriers_clear_the_current_operator_set_and_enter_tailPhaseLayout",
      ],
      L2RhoSourceSupport: {
        source: "current_L2_rho_binary64_slots_0_through_127",
        destination: "binary64_slots_168720_through_168847",
        copyAndGate:
          "copy_in_j_order_after_the_projected_L2_gate_then_compare_all_128_bit_patterns_in_j_order_and_fail_before_join_on_any_mismatch;_hash_the_destination_as_f64le_for_the_future_execution_receipt",
        lifetime:
          "destination_is_read_only_from_the_successful_copy_gate_through_once_only_core_quadrature_every_output_composite_evaluation_and_the_last_output_role_barrier",
      },
      regenerationBeforeOutputMaterialization:
        "output_rho_and_DCT_materialization_regenerates_each_output_level's_nodes_or_transform_constants_from_the_frozen_literal_graph_after_all_solves;_the_composite_evaluator_reads_L2_source_nodes_only_from_immutable_support_168720_through_168847;_it_never_reads_a_released_solver_operator_set_and_never_regenerates_D_or_D2",
      simultaneousAllLevelOperatorGenerationAllowed: false,
    },
    permutationArena: {
      elementCount: 257,
      byteLength: 1028,
      use: "indices_0_through_M_minus_1_hold_the_current_LU_permutation;_indices_M_through_256_are_zero_and_forbidden",
    },
    outputBuffers: {
      allocationOrder:
        "after_all_final_numeric_gates_allocate_scalar_then_twenty_role_then_six_core_coefficient_then_two_tail_coefficient_ArrayBuffers_in_literal_materialization_order;_each_buffer_has_a_fresh_nonshared_backing_store",
      scalarBuffer:
        "nine_fresh_f64le_ArrayBuffers_in_scalarOrder_each_exactly_8_bytes;_72_bytes_total",
      roleBuffers:
        "five_f64le_buffers_for_each_level_in_L0_L1_L2_AUDIT_order_with_each_buffer_exactly_8*N_bytes_where_N_is_64_96_128_256_respectively;_twenty_buffers_total_21760_bytes",
      coreCoefficientBuffers:
        "u_then_V_for_L0_L1_L2_each_fresh_exactly_8*N_bytes;_six_buffers_total_4608_bytes",
      tailCoefficientBuffers:
        "h_then_q_each_fresh_exactly_256_bytes;_two_buffers_total_512_bytes",
      totalBufferCount: 37,
      totalByteLength: 26952,
      lifetime:
        "buffers_are_write_once_in_element_order_then_transferred_to_the_future_atomic_output_publisher;_no_solver_or_MPFR_arena_view_aliases_any_output_buffer",
    },
    dynamicNumericAllocationAllowed: false,
    nonnumericParsingStorage:
      "bounded_UTF8_JSON_tokens_canonical_hex_strings_and_GMP_integer_parse_scratch_may_use_the_future_runtime's_predeclared_nonnumeric_parser_storage;_no_parsed_or_derived_numeric_value_may_escape_into_an_undeclared_MPFR_binary64_or_uint32_allocation",
  },
  arithmetic: {
    binary64:
      "IEEE754_binary64_round_to_nearest_ties_to_even_after_every_named_primitive_operation",
    mpfrContext: {
      precisionBits: 256,
      roundingMode: "MPFR_RNDN",
      exponentRange: {
        emin: -1000000,
        emax: 1000000,
        install:
          "before_any_mpfr_init2_or_candidate_numeric_read_call_mpfr_set_emin(-1000000)_then_mpfr_set_emax(1000000)_and_require_both_return_zero;_never_change_the_process_global_range_during_the_operation",
      },
      initialization:
        "initialize_every_declared_slot_by_mpfr_init2(slot,256)_in_increasing_arena_index_order_and_clear_it_in_strictly_decreasing_index_order",
      primitiveFlagProtocol:
        "immediately_before_each_dictionary_primitive_call_mpfr_clear_flags();_execute_exactly_that_one_call;_immediately_read_all_MPFR_flags;_reject_nan_divby0_overflow_underflow_or_erange;_inexact_is_expected_and_permitted_but_must_not_change_control_flow",
      forbiddenContextMutation:
        "default_precision_default_rounding_locale_thread_count_emin_or_emax_changes_after_context_installation",
    },
    mpfrPrimitiveDictionary: {
      setUi:
        "set_ui(dst,u)=mpfr_set_ui(dst,u,MPFR_RNDN)_with_u_an_exact_nonnegative_integer;_require_ternary_zero",
      setSi:
        "set_si(dst,s)=mpfr_set_si(dst,s,MPFR_RNDN)_with_s_an_exact_signed_integer;_require_ternary_zero",
      setD: "set_d(dst,d)=mpfr_set_d(dst,the_exact_finite_binary64_bits_d,MPFR_RNDN);_require_ternary_zero",
      set: "set(dst,src)=mpfr_set(dst,src,MPFR_RNDN);_require_ternary_zero_and_use_this_for_every_written_copy_or_handle_shift",
      setZ2Exp:
        "set_z_2exp(dst,z,e)=mpfr_set_z_2exp(dst,the_exact_signed_GMP_integer_z,the_exact_mpfr_exp_t_e,MPFR_RNDN);_require_ternary_zero_and_use_only_for_validated_fixture_dyadics",
      setPositiveZero:
        "set_positive_zero(dst)=mpfr_set_zero(dst,+1)_with_no_rounding_argument",
      constPi:
        "const_pi(dst)=mpfr_const_pi(dst,MPFR_RNDN)_exactly_once_per_named_pi_handle",
      add: "add(dst,a,b)=mpfr_add(dst,a,b,MPFR_RNDN)",
      subtract: "sub(dst,a,b)=mpfr_sub(dst,a,b,MPFR_RNDN)",
      multiply: "mul(dst,a,b)=mpfr_mul(dst,a,b,MPFR_RNDN)",
      divide: "div(dst,a,b)=mpfr_div(dst,a,b,MPFR_RNDN)",
      negate: "neg(dst,a)=mpfr_neg(dst,a,MPFR_RNDN)",
      cosine: "cos(dst,a)=mpfr_cos(dst,a,MPFR_RNDN)",
      squareRoot:
        "sqrt(dst,a)=mpfr_sqrt(dst,a,MPFR_RNDN)_after_requiring_a_greater_than_or_equal_to_positive_zero",
      exponential: "exp(dst,a)=mpfr_exp(dst,a,MPFR_RNDN)",
      logarithm:
        "log(dst,a)=mpfr_log(dst,a,MPFR_RNDN)_after_requiring_a_strictly_greater_than_positive_zero",
      getD: "get_d(a)=mpfr_get_d(a,MPFR_RNDN)_exactly_once_at_a_named_barrier;_reject_nonfinite_or_exceptional_flags;_canonicalize_any_zero_to_binary64_positive_zero",
      comparison:
        "cmp(a,b)=mpfr_cmp(a,b)_with_no_rounding_and_no_destination;_use_only_at_the_explicit_branch_points_and_reject_unordered_operands",
      aliasCrSqrt64:
        "cr_sqrt64(d)_means_set_d(op,d);_sqrt(result,op);_get_d(result)_exactly_once",
      aliasCrExp64:
        "cr_exp64(d)_means_set_d(op,d);_exp(result,op);_get_d(result)_exactly_once",
      aliasCrLog64:
        "cr_log64(d)_means_set_d(op,d);_log(result,op);_get_d(result)_exactly_once",
      aliasAccuracyClaim:
        "these_cr_aliases_name_only_the_frozen_MPFR256_operand_to_operation_to_one_get_d_route;_they_do_not_claim_correct_rounding_of_an_exact_real_directly_to_binary64_and_double_rounding_is_part_of_the_contract",
    },
    mpfrToBinary64:
      "use_only_the_dictionary_get_d_MPFR_RNDN_exactly_once_at_each_named_barrier_then_reinject_only_when_a_later_graph_explicitly_calls_set_d",
    binary64ToMpfr:
      "use_only_dictionary_set_d_of_the_exact_finite_binary64_value",
    canonicalZero:
      "after_each_destination_producing_dictionary_primitive_other_than_set_positive_zero_completes_its_flag_check_if_mpfr_zero_p(dst)_call_set_positive_zero(dst)_exactly_once;_set_positive_zero_is_terminal_and_is_never_recursively_canonicalized;_after_each_binary64_operation_or_get_d_if_the_result_compares_equal_to_zero_replace_it_by_the_exact_positive_zero_bits_before_storage_comparison_hashing_or_downstream_use",
    transcendentalBarrier:
      "every_cr_sqrt64_cr_exp64_or_cr_log64_alias_is_the_literal_dictionary_set_d_then_named_MPFR256_operation_then_one_dictionary_get_d_sequence_and_has_no_real_to_f64_correct_rounding_claim",
    forbidden: [
      "FMA",
      "BLAS",
      "SIMD_reassociation",
      "fast_math",
      "extended_precision_registers",
      "parallel_reduction",
      "finite_difference_Jacobian",
      "complex_step_Jacobian",
      "generic_automatic_differentiation_library",
      "adaptive_precision",
    ],
    failureOn: [
      "nonfinite_input_intermediate_or_output",
      "negative_zero_after_canonicalization_barrier",
      "division_by_positive_zero",
      "sqrt_negative_argument",
      "log_nonpositive_argument",
      "integer_or_buffer_overflow",
    ],
  },
  coreNodesAndOperators: {
    levels: CORE_LEVELS,
    nodeOrder: "j_increasing_0_through_N_minus_1",
    nodeProgram: [
      "allocate_pi_j_denominator_piTimesJ_theta_cosine_one_difference_two_rho_in_that_handle_order",
      "set_ui(jMp,j);_set_ui(denominator,N-1)",
      "if_j_equals_0_set_ui(rho,0)_and_skip_const_pi_multiply_divide_cosine",
      "else_if_j_equals_N_minus_1_set_ui(rho,1)_and_skip_const_pi_multiply_divide_cosine",
      "else_const_pi(pi);_mul(piTimesJ,pi,jMp);_div(theta,piTimesJ,denominator);_cos(cosine,theta)",
      "else_set_ui(one,1);_sub(difference,one,cosine);_set_ui(two,2);_div(rho,difference,two)",
      "rho64=get_d(rho)_exactly_once_then_store_in_j_order",
    ],
    barycentricWeights:
      "w_j=(-1)^j*c_j_with_c_0=c_(N-1)=1/2_and_c_j=1_otherwise_exact_MPFR_values",
    firstDerivativeMatrixProgram: {
      storage: "row_major_D[i*N+j]",
      offDiagonal:
        "for_i_then_j_increasing_i_not_equal_j:_sub(difference,rhoMp[i],rhoMp[j]);_mul(denominator,weightMp[i],difference);_div(Dmp[i,j],weightMp[j],denominator)",
      diagonal:
        "set_ui(acc,0);_for_j_increasing_j_not_i_add(nextAcc,acc,Dmp[i,j])_then_set(acc,nextAcc);_neg(Dmp[i,i],acc)",
      barrier:
        "after_the_complete_MPFR_matrix_each_Dmp[i,j]_is_independently_get_d_RNDN_and_canonicalized_in_row_major_order",
    },
    secondDerivativeMatrixProgram: {
      source:
        "the_unrounded_256_bit_Dmp_matrix_not_the_serialized_binary64_D_matrix",
      entry:
        "set_ui(acc,0);_for_k_increasing_0_through_N_minus_1_mul(term,Dmp[i,k],Dmp[k,j]);_add(nextAcc,acc,term);_set(acc,nextAcc);_after_k_set(D2mp[i,j],acc)",
      barrier:
        "after_each_complete_entry_get_d_RNDN_once_and_canonicalize_then_store_row_major",
    },
    matrixVectorBinary64Program:
      "dot=positive_zero;_for_j_increasing_product=round64(matrix[i,j]*vector[j]);_dot=round64(dot+product)",
    binary64ResidualXMap:
      "for_a_core_residual_interior_rho64_less_than_one:_denominator64=round64(1-rho64);_x64=round64(rho64/denominator64);_rho64_equal_one_is_an_infinity_sentinel_and_never_divided",
    mpfrInitializerAndMaterializationXMap: [
      "set_d(rhoMp,rho64);_set_ui(oneMp,1)",
      "if_rho64_bits_are_exact_positive_one_use_the_infinity_sentinel_and_do_not_subtract_or_divide",
      "otherwise_sub(denominatorMp,oneMp,rhoMp);_div(xMp,rhoMp,denominatorMp)",
      "retain_xMp_without_get_d_until_the_named_initializer_composite_or_target_consumer",
    ],
    coreCoefficientTransform: {
      polynomialConvention:
        "q(rho)=sum_n=0^(N-1)_a[n]*T_n(2*rho-1)_with_no_implicit_endpoint_halves",
      reorder: "f[m]=q[N-1-m]_so_t_m=cos(pi*m/(N-1))",
      exactFormula:
        "a[n]=2/((N-1)*c_n)*sum_m=0^(N-1)(f[m]*cos(pi*m*n/(N-1))/c_m)_with_c_0=c_(N-1)=2_and_c_else=1",
      operationOrder: [
        "const_pi(pi)_once_for_the_transform;_set_ui(denominator,N-1);_set_ui(two,2)",
        "for_n_increasing_set_ui(nMp,n);_set_ui(cn,n_is_0_or_N_minus_1?2:1);_set_ui(sum,0)",
        "for_m_increasing_set_ui(mMp,m);_mul(mn,mMp,nMp);_mul(piMn,pi,mn);_div(theta,piMn,denominator);_cos(cosine,theta)",
        "set_d(fMp,q[N-1-m]);_mul(fCos,fMp,cosine);_set_ui(cm,m_is_0_or_N_minus_1?2:1);_div(term,fCos,cm);_add(sumNext,sum,term);_copy_sumNext_to_sum",
        "mul(numerator,two,sum);_div(afterGrid,numerator,denominator);_div(coefficient,afterGrid,cn);_a[n]=get_d(coefficient)_exactly_once",
      ],
      outputOrder:
        "level_L0_L1_L2_then_field_u_V_then_coefficient_n_increasing",
    },
  },
  fixedL0Initializer: {
    kgProgram: [
      "allocate_seven_eight_ratio_firstRoot_kg_in_that_handle_order",
      "set_ui(seven,7);_set_ui(eight,8);_div(ratio,seven,eight)",
      "sqrt(firstRoot,ratio);_sqrt(kg,firstRoot);_kg64=get_d(kg)_exactly_once",
    ],
    nuProgram: [
      "set_d(kgReinjected,kg64);_mul(kgSquared,kgReinjected,kgReinjected)",
      "neg(negativeKgSquared,kgSquared);_set_ui(two,2);_div(nu,negativeKgSquared,two);_nu64=get_d(nu)_exactly_once",
    ],
    formulas: {
      u: "u=(1+kg*x)*exp(-kg*x)",
      V: "V=-(I2+2*kg*I3+kg^2*I4)/x-(J1+2*kg*J2+kg^2*J3)",
      In: "I_n=n!/(2*kg)^(n+1)*(1-exp(-2*kg*x)*sum_j=0^n((2*kg*x)^j/j!))",
      Jn: "J_n=n!/(2*kg)^(n+1)*exp(-2*kg*x)*sum_j=0^n((2*kg*x)^j/j!)",
      VAtOrigin: "-9/(8*kg^2)",
    },
    interiorNodeProgram: [
      "set_d(rho,rho64);_run_coreNodesAndOperators.mpfrInitializerAndMaterializationXMap_to_obtain_x_without_get_d;_set_d(kg,kg64)",
      "mul(kgX,kg,x);_neg(minusKgX,kgX);_exp(expMinusKgX,minusKgX)",
      "set_ui(two,2);_mul(twoKg,two,kg);_mul(twoKgX,twoKg,x);_neg(minusTwoKgX,twoKgX);_exp(expMinusTwoKgX,minusTwoKgX)_using_a_distinct_exp_call_and_distinct_destination_from_expMinusKgX",
      "for_each_n_in_1_2_3_4_set_ui(factorial,1);_for_factor_increasing_2_through_n_mul(factorialNext,factorial,factorMp)_then_copy",
      "for_each_n_set_ui(series,0);_set_ui(power,1);_set_ui(jFactorial,1);_for_j_increasing_0_through_n:_if_j_greater_than_0_mul(powerNext,power,twoKgX)_then_copy_and_mul(jFactorialNext,jFactorial,jMp)_then_copy;_div(seriesTerm,power,jFactorial);_add(seriesNext,series,seriesTerm)_then_copy",
      "set_ui(one,1);_mul(expSeries,expMinusTwoKgX,series);_sub(oneMinusExpSeries,one,expSeries);_for_each_n_set_ui(denominator,1)_then_for_power_index_0_through_n_mul(nextDenominator,denominator,twoKg)_and_copy;_div(prefactor,factorial,denominator);_mul(I_n,prefactor,oneMinusExpSeries);_mul(J_n,prefactor,expSeries)",
      "mul(uLinear,kg,x);_add(uLinearPlusOne,one,uLinear);_mul(u,uLinearPlusOne,expMinusKgX)",
      "mul(kgSquared,kg,kg);_mul(twoKgI3,twoKg,I3);_mul(kgSquaredI4,kgSquared,I4);_add(iPartial,I2,twoKgI3);_add(iSum,iPartial,kgSquaredI4);_div(iOverX,iSum,x);_neg(negativeIOverX,iOverX)",
      "mul(twoKgJ2,twoKg,J2);_mul(kgSquaredJ3,kgSquared,J3);_add(jPartial,J1,twoKgJ2);_add(jSum,jPartial,kgSquaredJ3);_sub(V,negativeIOverX,jSum);_u64=get_d(u)_once_then_V64=get_d(V)_once",
    ],
    originProgram: [
      "set_ui(uOrigin,1);_set_d(kg,kg64);_mul(kgSquared,kg,kg);_set_ui(eight,8);_mul(denominator,eight,kgSquared);_set_si(minusNine,-9);_div(VOrigin,minusNine,denominator)",
      "uOrigin64=get_d(uOrigin)_once_then_VOrigin64=get_d(VOrigin)_once",
    ],
    endpoints:
      "j=0_runs_originProgram;_j=N-1_calls_set_ui_for_MPFR_u_and_V_positive_zero_then_one_get_d_each_without_exp_log_or_division",
    unknownPacking: "z_L0=[u_nodes_increasing,V_nodes_increasing,nu64]",
    alternateInitializerAllowed: false,
  },
  levelTransfer: {
    schedule: ["accepted_L0_to_L1", "accepted_L1_to_L2"],
    subject: "u_and_V_separately_then_copy_the_exact_nu_binary64_bits",
    exactNodeMatch:
      "if_output_rho_binary64_bits_equal_any_input_rho_bits_copy_the_lowest_matching_input_value_bits",
    sourceWeightProgram:
      "for_source_j_increasing_set_ui(weightMagnitude,j_is_0_or_Nsource_minus_1?1:2);_set_ui(two,2);_div(weightUnsigned,weightMagnitude,two);_if_j_is_odd_neg(weight,weightUnsigned)_else_set(weight,weightUnsigned);_no_source_weight_array_survives_operator_reuse",
    barycentricProgram:
      "otherwise_set_d(rhoOut,the_exact_target_rho64_bits);_set_ui(numerator,0);_set_ui(denominator,0);_for_j_increasing_set_d(rhoIn,the_exact_source_rho_scratch_bits)_then_run_sourceWeightProgram_then_sub(difference,rhoOut,rhoIn);_div(ratio,weight,difference);_set_d(qNode,the_exact_source_archive_value_bits);_mul(weightedValue,ratio,qNode);_add(nextNumerator,numerator,weightedValue)_then_set;_add(nextDenominator,denominator,ratio)_then_set;_after_loop_div(value,numerator,denominator);_get_d(value)_once",
    transferFailure:
      "zero_denominator_nonfinite_or_noncanonical_result_fails_candidate",
    restartAlternateInterpolationOrFilteringAllowed: false,
  },
  coreResidualAndJacobian: {
    unknownOrder: "z=[u[0..N-1],V[0..N-1],nu]_length_2N_plus_1",
    rowOrder: "F=[S[0..N-1],P[0..N-1],A]_length_2N_plus_1",
    stateBufferProtocol: {
      currentState:
        "binary64_slots_32896_through_33152_length_2N_plus_1_prefix_is_the_current_state_and_remains_bitwise_unchanged_during_every_line_search_trial",
      trialState:
        "binary64_slots_33410_through_33666_length_2N_plus_1_prefix_is_written_in_unknown_order_for_one_alpha_then_read_directly_as_the_selected_trial_input_without_copying_into_currentState",
      selectedInput:
        "a_current_evaluation_reads_only_currentState;_a_line_search_evaluation_reads_only_trialState;_a_projected_residual_gate_reads_only_projectedState;_no_hidden_evaluation_state_copy_or_alias_is_permitted",
      evaluationModes: {
        Newton:
          "the_initial_current_evaluation_and_every_line_search_trial_evaluation_materialize_the_complete_residual_and_complete_analytic_Jacobian",
        projectedResidualGate:
          "the_postsolve_projectedState_evaluation_materializes_only_the_complete_residual_and_must_not_write_or_read_the_Jacobian_target",
      },
      residualTargets:
        "current_evaluation_writes_currentResidual_slots_33667_through_33923;_trial_or_projected_evaluation_writes_trial_or_projectedResidual_slots_33924_through_34180",
      JacobianTarget:
        "for_every_Newton_current_or_trial_evaluation_write_only_unfactoredJacobian_slots_34695_through_100743_after_the_complete_selected_residual;_a_rejected_trial_may_overwrite_the_previous_trial_J_but_never_any_current_state_or_current_residual_bits;_the_projected_residual_gate_does_not_touch_this_range",
      acceptance:
        "only_after_the_first_trial_passes_domain_and_Armijo_copy_trialState_to_currentState_in_unknown_index_order_copy_the_already_evaluated_trialResidual_to_currentResidual_in_row_order_and_reclassify_the_already_evaluated_trial_J_as_current_J_without_rewriting_it;_a_rejected_trial_leaves_currentState_and_currentResidual_bitwise_unchanged",
    },
    evaluationChronology:
      "select_currentState_trialState_or_projectedState_by_stateBufferProtocol_without_copy_or_alias;_fill_the_selected_residual_target_with_positive_zero_in_index_order_and_for_Newton_mode_also_fill_the_single_J_target_with_positive_zero_in_row_major_index_order;_evaluate_and_store_S_rows_i_increasing_then_P_rows_i_increasing_then_A_from_only_the_selected_input;_only_after_all_F_rows_are_stored_in_Newton_mode_fill_the_analytic_Jacobian_rows_0_through_2N_increasing_and_columns_0_through_2N_increasing;_projectedResidualGate_mode_stops_after_the_complete_residual;_canonicalize_each_primitive_zero",
    radialLaplacianProgram:
      "du=dot64(D_row_i,q);_d2u=dot64(D2_row_i,q);_oneMinus=round64(1-rho_i);_oneMinus2=round64(oneMinus*oneMinus);_oneMinus4=round64(oneMinus2*oneMinus2);_twodu=round64(2*du);_quotient=round64(twodu/rho_i);_inside=round64(d2u+quotient);_L=round64(oneMinus4*inside)",
    scalarRows: {
      origin: "S[0]=dot64(D_row_0,u)",
      interior:
        "halfL=round64(0.5*L_u);_difference=round64(V[i]-nu);_product=round64(difference*u[i]);_S[i]=round64((-halfL)+product)",
      infinity: "S[N-1]=u[N-1]",
    },
    potentialRows: {
      origin: "P[0]=dot64(D_row_0,V)",
      interior: "square=round64(u[i]*u[i]);_P[i]=round64(L_V-square)",
      infinity: "P[N-1]=V[N-1]",
    },
    gaugeRow: "A=round64(u[0]-1)",
    analyticJacobian: {
      fillOrder:
        "initialize_fresh_row_major_positive_zero_matrix_then_rows_increasing_then_columns_increasing",
      interiorLEntry:
        "Lij=round64(oneMinus4*round64(D2[i,j]+round64(round64(2*D[i,j])/rho_i)))",
      scalarDu:
        "round64(round64(-0.5*Lij)+(j_equals_i?round64(V[i]-nu):positive_zero))",
      scalarDv: "j_equals_i?u[i]:positive_zero",
      scalarDnu: "round64(-u[i])",
      poissonDu: "j_equals_i?round64(-2*u[i]):positive_zero",
      poissonDv: "Lij",
      poissonDnu: "positive_zero",
      boundaryRows:
        "S0_du=D[0,j];_SNminus1_du_is_Kronecker;_P0_dV=D[0,j];_PNminus1_dV_is_Kronecker;_all_other_entries_positive_zero",
      gauge: "dA_du0=1_and_every_other_entry_positive_zero",
      finiteDifferenceOrGenericAdAllowed: false,
    },
  },
  denseLinearSolve: {
    arithmetic: "scalar_binary64_only",
    storage: "fresh_row_major_copy_of_J_and_fresh_vector_b=canonicalize(-F)",
    scalingOrEquilibration: "none",
    factorization: "Doolittle_in_place_LU_with_partial_pivoting_k_increasing",
    pivotScan:
      "rows_k_through_last_increasing;_choose_strictly_larger_abs_only_so_lowest_row_wins_exact_ties",
    pivotFailure:
      "selected_pivot_positive_zero_or_nonfinite_fails_the_current_candidate",
    elimination:
      "swap_complete_rows_and_permutation;_for_i=k+1..last_Lik=round64(Aik/Akk);_store;_for_j=k+1..last_product=round64(Lik*Akj);_Aij=round64(Aij-product)",
    rightHandSide:
      "b[i]=canonicalize(round64(-F[i]))_then_apply_the_recorded_row_permutation",
    forwardSolve:
      "for_i_increasing_acc=bPerm[i];_for_j=0..i-1_acc=round64(acc-round64(Lij*y[j]));_y[i]=acc",
    backwardSolve:
      "for_i_decreasing_acc=y[i];_for_j=i+1..last_increasing_acc=round64(acc-round64(Uij*x[j]));_x[i]=round64(acc/Uii)",
    iterativeRefinement: {
      exactPassCount: 3,
      originalOperands: "unfactored_J_and_b_exact_binary64_bits_are_retained",
      residual:
        "for_i_increasing_set_ui(acc,0);_for_j_increasing_set_d(Jmp,Jij);_set_d(xmp,xj);_mul(product,Jmp,xmp);_add(nextAcc,acc,product);_set(acc,nextAcc);_after_j_set_d(bmp,b_i);_sub(riMp,bmp,acc);_ri=get_d(riMp)_exactly_once",
      correction:
        "solve_LU_delta_r_equals_r_with_same_permutation_and_factors_then_for_i_increasing_x[i]=round64(x[i]+delta_r[i])",
      refactorOrEarlyExitAllowed: false,
    },
  },
  newtonControl: {
    systems: ["core_L0", "core_L1", "core_L2", "tail_K32"],
    maximumAcceptedUpdatesPerSystem: 48,
    linearEquation: "J_at_current_state*delta=canonicalize(-F_current)",
    lineSearch: {
      maximumTrials: 25,
      order: "k=0..24_alpha_is_exact_binary64_2^-k",
      trialState:
        "i_increasing_step[i]=round64(alpha*delta[i]);_trial[i]=round64(current[i]+step[i])",
      trialEvaluation:
        "for_every_k_materialize_the_complete_trial_residual_then_complete_trial_Jacobian_before_the_finite_domain_and_Armijo_tests;_a_rejected_trial_J_may_be_overwritten_by_the_next_k",
      meritProgram:
        "sumSquares=positive_zero;_i_increasing_square=round64(F[i]*F[i]);_sumSquares=round64(sumSquares+square);_phi=round64(sumSquares/2)",
      armijoProgram:
        "cAlpha=round64(2^-12*alpha);_decrease=round64(cAlpha*currentSumSquares);_rhs=round64(currentPhi-decrease);_accept_if_trialPhi<=rhs",
      acceptance:
        "first_trial_in_order_that_is_finite_domain_valid_and_satisfies_Armijo",
      noAcceptedTrialDisposition: "fail_candidate_without_fallback",
    },
    domains: {
      core: "nu<0_and_round64(2^-10*nu)>-1/2_and_round64(2^-10*nu)<0_and_every_unknown_residual_and_Jacobian_entry_finite",
      tail: "C>0_and_kappa>0_and_every_unknown_residual_and_Jacobian_entry_finite",
    },
    acceptedStepSequence: [
      "replace_current_state_with_the_accepted_trial_bits",
      "replace_current_residual_and_merit_with_the_already_evaluated_trial_values_and_reclassify_the_already_evaluated_trial_J_as_current_J_without_rewriting_it",
      "compute_equation_norm=max_i_abs(F_trial_i)_in_row_order",
      "compute_scaled_step=max_i(round64(abs(step_i)/max(1,abs(current_i))))_in_unknown_order",
      "qualifies=equation_norm<=2^-40_and_scaled_step<=2^-42",
      "increment_consecutive_qualifying_if_qualifies_else_reset_to_zero",
      "terminate_success_only_when_consecutive_qualifying_equals_2",
    ],
    initialStateMayTerminate: false,
    update48:
      "perform_the_same_acceptance_and_stop_check_after_update_48;_if_not_terminal_fail_without_update_49",
    anyFailureRetryAllowed: false,
  },
  postsolveEndpointProjection: {
    appliesAfter:
      "each_core_L0_L1_or_L2_Newton_system_has_terminated_successfully_after_exactly_two_consecutive_qualifying_accepted_updates",
    rawAcceptedState:
      "before_any_mutation_reclassify_the_currentState_length_2N_plus_1_prefix_at_slots_32896_through_33152_as_read_only_rawAcceptedState_without_a_numeric_copy_or_aliasing_any_other_range_then_hash_it_in_f64le_unknown_order;_retain_it_until_the_projected_archive_and_all_raw_receipt_fields_are_complete_then_release_the_prefix_for_the_next_level_or_tail_phase;_these_bits_are_receipt_only_and_are_never_an_array_coefficient_transfer_join_quadrature_or_tail_input",
    projectedStateProgram: [
      "copy_rawAcceptedState_to_projectedState_in_unknown_index_order",
      "write_the_exact_binary64_positive_zero_bit_pattern_0x0000000000000000_to_projectedState.u[N-1]",
      "write_the_exact_binary64_positive_zero_bit_pattern_0x0000000000000000_to_projectedState.V[N-1]",
      "leave_every_other_u_V_and_nu_bit_identical_to_rawAcceptedState",
      "evaluate_the_complete_core_residual_on_projectedState_once_with_the_frozen_binary64_D_D2_row_and_residual_chronology",
      "scan_rows_increasing;_reject_if_any_residual_is_nonfinite_or_if_max_abs_projected_residual_is_greater_than_2^-40",
      "reject_unless_the_two_changed_indices_are_exact_positive_zero_and_all_other_projected_bits_equal_the_corresponding_raw_bits",
      "copy_the_complete_gated_projected_state_in_unknown_order_to_the_fixed_immutable_projected_L0_L1_or_L2_archive_for_that_level_then_forbid_archive_mutation",
    ],
    acceptedConsumerState:
      "only_the_immutable_projected_level_archive_becomes_the_level_acceptance_value;_all_level_transfers_L2_join_core_quadrature_base_arrays_DCT_payloads_AUDIT_and_target_composite_inputs_use_the_same_archived_projected_bits",
    provenance:
      "the_future_execution_receipt_must_record_level_id_rawAcceptedState_f64le_sha256_projectedState_f64le_sha256_raw_uInfinity_bits_raw_VInfinity_bits_projected_residual_max_bits_and_projection_gate_passed_true",
    projectionFailure:
      "fail_the_single_candidate_attempt_before_any_next_level_transfer_join_tail_or_output_materialization;_no_Newton_restart_extra_update_retune_or_endpoint_tolerance_is_allowed",
  },
  L2JoinExtraction: {
    joinX: 32,
    joinRhoExact: "32/33",
    joinRhoProgram: [
      "set_ui(joinNumerator,32);_set_ui(joinDenominator,33)",
      "div(joinRho,joinNumerator,joinDenominator)_and_do_not_get_d",
    ],
    fieldProgram: [
      "for_each_field_q_in_the_order_u_then_V_allocate_S0_S1_S2_S3_as_distinct_handles_and_set_ui_each_to_0",
      "for_j_increasing_0_through_127_set_d(node,L2_rho64[j]);_set_ui(weightMagnitude,j_is_0_or_127?1:2);_set_ui(two,2);_div(weightUnsigned,weightMagnitude,two);_if_j_is_odd_neg(weight,weightUnsigned)_else_set(weight,weightUnsigned);_set_d(value,immutable_projected_L2_q64[j])",
      "sub(difference,joinRho,node);_mul(differenceSquared,difference,difference)",
      "div(termS0,weight,difference);_add(nextS0,S0,termS0);_copy_nextS0_to_S0",
      "mul(weightedValue,weight,value);_div(termS1,weightedValue,difference);_add(nextS1,S1,termS1);_copy_nextS1_to_S1",
      "div(termS2,weight,differenceSquared);_add(nextS2,S2,termS2);_copy_nextS2_to_S2",
      "div(termS3,weightedValue,differenceSquared);_add(nextS3,S3,termS3);_copy_nextS3_to_S3",
      "after_the_j_loop_div(qAtJoin,S1,S0);_mul(qTimesS2,qAtJoin,S2);_sub(derivativeNumerator,qTimesS2,S3);_div(qRho,derivativeNumerator,S0)",
      "set_ui(one,1);_sub(oneMinusRho,one,joinRho);_mul(oneMinusRhoSquared,oneMinusRho,oneMinusRho);_mul(qX,qRho,oneMinusRhoSquared)",
    ],
    noExactNodeShortcut:
      "32/33_is_not_any_N128_Lobatto_node;_an_exact_zero_difference_is_a_typed_join_failure_not_a_shortcut",
    barrierOrder: ["U", "U1", "V", "V1"],
    barrierProgram:
      "run_the_complete_u_fieldProgram_then_U=get_d(uAtJoin)_once_then_U1=get_d(uX)_once;_reset_all_sums_and_run_the_complete_V_fieldProgram_then_V=get_d(VAtJoin)_once_then_V1=get_d(VX)_once",
  },
  tailResidualAndJacobian: {
    R: 32,
    K: 32,
    unknownOrder: "z=[C,h[0..31],q[0..31]]_length_65",
    rowOrder: "F=[S(y[0..31]),P(y[0..31]),mass]_length_65",
    stateBufferProtocol: {
      currentState:
        "binary64_slots_32896_through_32960_are_the_current_tail_state_and_remain_bitwise_unchanged_during_every_line_search_trial",
      trialState:
        "binary64_slots_33410_through_33474_are_written_in_unknown_order_for_one_alpha_then_read_directly_as_the_selected_trial_input_without_copying_into_currentState",
      selectedInput:
        "a_current_or_final_evaluation_reads_only_currentTailState;_a_line_search_evaluation_reads_only_trialTailState;_the_selected_prefix_is_never_copied_over_the_other_prefix_during_evaluation",
      evaluationModes: {
        Newton:
          "the_initial_current_evaluation_and_every_line_search_trial_evaluation_materialize_the_complete_residual_and_complete_analytic_Jacobian",
        finalResidualGate:
          "the_postsolve_final_evaluation_reads_currentTailState_materializes_only_the_complete_residual_in_trialOrFinalTailResidual_and_must_not_write_or_read_the_Jacobian_target",
      },
      residualTargets:
        "current_evaluation_writes_currentTailResidual_slots_33667_through_33731;_trial_or_final_evaluation_writes_trialOrFinalTailResidual_slots_33924_through_33988",
      JacobianTarget:
        "in_Newton_mode_write_each_unfactored_tail_J_row_only_to_slots_34695_through_38919_immediately_after_its_corresponding_selected_residual_row_and_before_the_next_row;_the_mass_J_row_follows_selected_residual_row_64;_finalResidualGate_mode_does_not_touch_this_range",
      acceptance:
        "only_after_the_first_trial_passes_domain_and_Armijo_copy_trialTailState_to_currentTailState_in_unknown_index_order_copy_trialTailResidual_to_currentTailResidual_in_row_order_and_reclassify_the_already_evaluated_trial_tail_J_as_current_tail_J_without_rewriting_it;_a_rejected_trial_leaves_both_current_prefixes_bitwise_unchanged",
      finalLifetime:
        "after_the_final_accepted_residual_gate_currentTailState_becomes_the_immutable_accepted_C_h_q_source_and_may_not_be_overwritten_until_scalar_composite_and_tail_coefficient_materialization_have_all_completed",
    },
    nodes: [
      "use_coreNodesAndOperators.nodeProgram_verbatim_with_N=32_destination_y_and_j_increasing_0_through_31",
      "therefore_for_interior_j_set_ui(jMp,j);_set_ui(denominator,31);_const_pi(pi);_mul(piTimesJ,pi,jMp);_div(theta,piTimesJ,denominator);_cos(cosine,theta);_set_ui(one,1);_sub(difference,one,cosine);_set_ui(two,2);_div(y,difference,two)",
      "special_case_j_0_as_exact_positive_zero_and_j_31_as_exact_one_then_one_get_d_per_y_in_order",
    ],
    constants:
      "nu_is_the_exact_accepted_L2_binary64_bit_value;_kappa=cr_sqrt64(round64(-2*nu));_a=round64(kappa*R);_sigma=round64(round64(C/kappa)-1)",
    stateEvaluationChronology: [
      "select_currentTailState_or_trialTailState_by_stateBufferProtocol_without_copy_or_alias;_scan_the_selected_65_bits_in_unknown_order_and_reject_nonfinite_or_negative_zero_bits;_select_Newton_mode_for_initial_current_or_line_search_trial_and_finalResidualGate_mode_only_for_the_postsolve_gate",
      "read_projected_L2_nu_then_compute_minusTwoNu=round64(-2*nu);_kappa=cr_sqrt64(minusTwoNu)_once;_a=round64(kappa*32);_read_C=z[0];_cOverKappa=round64(C/kappa);_sigma=round64(cOverKappa-1)",
      "compute_U_U1_V_V1_from_the_immutable_join_barrier_bits_then_construct_rowInvariantDualRegisters_0_through_7_once_by_the_literal_C1Lifts_order",
      "for_j_increasing_0_through_31_clear_only_binary64_dual_registers_8_through_63_in_register_then_component_order;_evaluate_H_Q_and_derivatives_then_exteriorFactor_then_scaled_y_j_S_row;_store_F[j]_then_in_Newton_mode_store_J_row_j_columns_0_through_64_before_the_next_j",
      "for_j_increasing_0_through_31_clear_only_binary64_dual_registers_8_through_63_in_register_then_component_order_and_recompute_H_Q_and_derivatives_then_exteriorFactor_then_scaled_y_j_P_row;_store_F[32+j]_then_in_Newton_mode_store_J_row_32+j_columns_0_through_64_before_the_next_j",
      "run_the_fixed_MPFR256_tail_quadrature_and_barriers;_compute_and_store_F[64]_by_the_frozen_binary64_massResidual_chronology_then_in_Newton_mode_store_J_row_64_columns_0_through_64;_finalResidualGate_mode_stops_after_F[64]",
      "canonicalize_each_zero_at_its_primitive_barrier;_registers_0_through_7_are_read_only_after_construction_and_no_row_basis_dual_or_transcendental_value_is_reused_across_rows",
    ],
    C1Lifts: {
      H1: "U",
      Hy1: "t0=round64(-a+sigma);_t1=round64(t0*U);_t2=round64(R*U1);_Hy1=round64(t1-t2)",
      Q1: "round64(V+round64(C/R))",
      Qy1: "t0=round64(round64(-2*a)+round64(2*sigma));_t1=round64(t0*Q1);_t2=round64(C/R);_t3=round64(R*V1);_Qy1=round64(round64(t1+t2)-t3)",
      field:
        "G(y)=G1+Gy1*(y-1)+(1-y)^2*sum_n=0^31(g[n]*T_n(2y-1))_with_each_subtract_multiply_add_binary64_left_to_right",
      chebyshev:
        "t=round64(round64(2*y)-1);_T0=1_Ty0=Tyy0=positive_zero;_T1=t_Ty1=2_Tyy1=positive_zero;_for_n=1..30_Tnext=round64(round64(round64(2*t)*Tn)-Tprev),_Tynext=round64(round64(round64(4*Tn)+round64(round64(2*t)*Tyn))-Typrev),_Tyynext=round64(round64(round64(8*Tyn)+round64(round64(2*t)*Tyyn))-Tyyprev)",
      fieldDerivativeProgram:
        "A=Ay=Ayy=positive_zero;_for_n=0..31_A=round64(A+round64(g[n]*Tn)),_Ay=round64(Ay+round64(g[n]*Tyn)),_Ayy=round64(Ayy+round64(g[n]*Tyyn));_oneMinus=round64(1-y);_P=round64(oneMinus*oneMinus);_Py=round64(-2*oneMinus);_Pyy=2;_linear=round64(G1+round64(Gy1*round64(y-1)));_G=round64(linear+round64(P*A));_Gy=round64(Gy1+round64(round64(Py*A)+round64(P*Ay)));_Gyy=round64(round64(Pyy*A)+round64(round64(2*round64(Py*Ay))+round64(P*Ayy)))",
    },
    exteriorFactor: {
      yPositive:
        "x=round64(R/y);_xmR=round64(x-R);_p=round64(round64(-kappa*xmR)+round64(sigma*cr_log64(round64(x/R))));_B=cr_exp64(p);_E=round64(B*B);_EoverY2=round64(E/round64(y*y))",
      yZero: "B=E=EoverY2=positive_zero_without_division_log_or_exp",
    },
    scaledRows: {
      yPositiveSchrodinger:
        "t0=round64(y*y);_t1=round64(t0*Hyy);_t2=round64(a-round64(sigma*y));_t3=round64(round64(2*t2)*Hy);_t4=round64(round64(sigma*round64(sigma+1))*H);_linear=round64(round64(t1+t3)+t4);_source=round64(round64(round64(R*R)*EoverY2)*round64(Q*H));_S=round64(round64(-0.5*linear)+source)",
      yZeroSchrodinger:
        "S=round64(round64(-a*Hy)-round64(0.5*round64(round64(sigma*round64(sigma+1))*H)))",
      yPositivePoisson:
        "p0=round64(round64(round64(y*y)*round64(y*y))*Qyy);_p1=round64(round64(round64(4*round64(y*y))*round64(a-round64(sigma*y)))*Qy);_c0=round64(4*round64(a*a));_c1=round64(round64(4*a)*round64(round64(2*sigma)+1));_c2=round64(round64(2*sigma)*round64(round64(2*sigma)+1));_coef=round64(round64(c0-round64(c1*y))+round64(c2*round64(y*y)));_p2=round64(coef*Q);_p3=round64(round64(R*R)*round64(H*H));_P=round64(round64(round64(p0+p1)+p2)-p3)",
      yZeroPoisson:
        "P=round64(round64(round64(4*round64(a*a))*Q)-round64(round64(R*R)*round64(H*H)))",
    },
    analyticJacobian: {
      representation:
        "for_each_scalar_store_primal_v_then_derivative_d[0..64]_in_unknown_order_C_h0..h31_q0..q31",
      seed: "constant_has_all_derivatives_positive_zero;_unknown_z[k]_has_d[k]=1_and_every_other_derivative_positive_zero",
      componentLoop: "derivative_index_increasing_0_through_64",
      add: "v=round64(a.v+b.v);_for_k_increasing_d[k]=round64(a.d[k]+b.d[k])",
      subtract:
        "v=round64(a.v-b.v);_for_k_increasing_d[k]=round64(a.d[k]-b.d[k])",
      negate:
        "v=canonicalize(round64(-a.v));_for_k_increasing_d[k]=canonicalize(round64(-a.d[k]))",
      multiply:
        "v=round64(a.v*b.v);_for_k_increasing_left=round64(a.d[k]*b.v);_right=round64(a.v*b.d[k]);_d[k]=round64(left+right)",
      divide:
        "v=round64(a.v/b.v);_den=round64(b.v*b.v);_for_k_increasing_left=round64(a.d[k]*b.v);_right=round64(a.v*b.d[k]);_num=round64(left-right);_d[k]=round64(num/den)",
      sqrt: "v=cr_sqrt64(a.v);_twoV=round64(2*v);_for_k_increasing_d[k]=round64(a.d[k]/twoV)",
      exp: "v=cr_exp64(a.v);_for_k_increasing_d[k]=round64(v*a.d[k])",
      log: "v=cr_log64(a.v);_for_k_increasing_d[k]=round64(a.d[k]/a.v)",
      chebyshev:
        "run_the_primal_T_recurrence_and_the_above_add_subtract_multiply_dual_primitives_in_literal_recurrence_order_for_T_Ty_Tyy",
      chebyshevStreaming:
        "retain_only_previous_current_and_next_T_Ty_Tyy_duals_plus_A_Ay_Ayy;_for_n_increasing_0_through_31_seed_only_unknown_g[n]_multiply_accumulate_A_Ay_Ayy_then_release_g[n]_and_the_consumed_previous_basis_triple_before_advancing;_never_materialize_a_32_by_3_binary64_dual_table",
      residualAssembly:
        "run_the_literal_C1_lift_exterior_factor_and_scaled_row_programs_using_only_these_dual_primitives_in_their_written_order",
      destinationAndAliasing:
        "every_binary64_dual_primitive_writes_a_fresh_register_distinct_from_all_operand_registers;_write_primal_then_derivatives_0_through_64;_only_after_the_complete_destination_may_its_name_replace_a_dead_operand",
      constantConstruction:
        "a_named_binary64_constant_or_selected_state_value_writes_its_exact_finite_bits_to_the_primal_then_writes_derivatives_0_through_64_as_positive_zero_except_the_single_matching_unknown_seed",
      rowInvariantDualRegisters: [
        "register_0=R_constant_dual",
        "register_1=kappa_constant_dual",
        "register_2=a_constant_dual",
        "register_3=sigma_dual_with_C_derivative",
        "register_4=H1_constant_dual",
        "register_5=Hy1_dual",
        "register_6=Q1_dual",
        "register_7=Qy1_dual",
      ],
      rowInvariantConstruction:
        "build_registers_0_through_7_in_order_from_the_selected_C_seed_projected_L2_nu_and_immutable_join_bits_using_fresh_registers_8_through_63_for_temporaries_then_clear_all_temporaries;_never_overwrite_registers_0_through_7_until_all_64_PDE_rows_are_stored",
      dualRegisterAllocation:
        "during_rowInvariantConstruction_allocate_fresh_temporaries_to_the_lowest_free_register_8_through_63;_during_each_row_interpret_the_literal_streaming_Chebyshev_exterior_and_scaled_row_program_left_to_right_and_allocate_every_constant_unknown_and_fresh_primitive_destination_to_the_lowest_free_register_8_through_63;_release_an_operand_only_after_its_last_literal_use_and_after_the_destination_primal_then_d0_through_d64_are_complete;_release_simultaneously_dead_operands_in_increasing_register_order;_a_need_beyond_register_63_is_typed_resource_preflight_failure_without_spill_recomputation_or_reassociation",
      exactRegisterCapacity: 64,
      forbidden:
        "finite_difference_complex_step_source_to_source_AD_operator_overloading_AD_or_any_algebraically_reassociated_derivative",
    },
    massRowUsesFixedQuadratureGraphBelow: true,
  },
  fixedGaussLegendre256Quadrature: {
    fixtureBinding:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_DEPENDENCY_PINS.gaussLegendre256Fixture,
    requiredFixtureSemantics: {
      pointCount: 256,
      recordOrder: "index_0_through_255_in_strictly_increasing_node_order",
      topLevelCanonicalJsonByteKeyOrder: ["index", "node", "schema", "weight"],
      nestedDyadicCanonicalJsonByteKeyOrder: [
        "exponent2",
        "sign",
        "significandHex",
      ],
      schemaLiteral: "nhm2_spherical_gl256_mpfr256_record/v1",
      dyadic:
        "exact_value=sign*integer_from_exactly_64_lowercase_hex_significandHex*2^exponent2_with_sign_exact_integer_plus_or_minus_1_and_leading_hex_nibble_8_through_f",
      sourceRealRoundingCell:
        "closed_interval_exact_value_plus_or_minus_2^(exponent2-1)",
      nodeOrder: "strictly_increasing_on_open_interval_minus_1_to_1",
      weightRule: "strictly_positive",
      encoding:
        "one_LF_terminated_sorted_key_compact_JSON_object_per_record_no_CR_no_BOM_no_blank_lines",
      primaryConsumption:
        "parse_the_exact_dyadic_directly_into_MPFR256_with_no_binary64_conversion_and_verify_the_exact_value_is_representable_at_256_bits",
    },
    coreCells: 256,
    tailCells: 4096,
    domains: {
      core: "[0,R]_with_R_exact_integer_32",
      tail: "[0,1]",
    },
    cellOrder: "cell_index_increasing",
    nodeOrderWithinCell: "fixture_index_increasing",
    exactIntegerInjection:
      "cellIndex_cellIndexPlusOne_cellCount_R_0_1_2_4_and_all_small_formula_integers_are_injected_by_mpfr_set_ui_or_mpfr_set_si_exactly_at_precision_256_before_use",
    mappedCellProgram: [
      "set_ui(domainLength,core?32:1);_set_ui(cellIndexMp,cellIndex);_set_ui(cellIndexPlusOne,cellIndex+1);_set_ui(cellCountMp,core?256:4096);_set_ui(two,2)",
      "mul(leftNumerator,domainLength,cellIndexMp)",
      "div(left,leftNumerator,cellCountMp)",
      "mul(rightNumerator,domainLength,cellIndexPlusOne)",
      "div(right,rightNumerator,cellCountMp)",
      "add(sumEndpoints,left,right)",
      "div(mid,sumEndpoints,two)",
      "sub(differenceEndpoints,right,left)",
      "div(half,differenceEndpoints,two)",
    ],
    mappedNodeWeightProgram: [
      "mul(nodeProduct,half,fixtureNodeExactDyadic)",
      "add(point,mid,nodeProduct)",
      "mul(mappedWeight,half,fixtureWeightExactDyadic)",
    ],
    mappedPointAndWeightChronology: [
      "after_the_once_per_cell_mappedCellProgram_for_fixture_index_increasing_run_nodeProduct_then_point_and_set(currentCellPoint[index],point);_do_not_compute_or_store_mappedWeight_in_this_point_pass",
      "for_core_integration_after_all_256_points_are_stored_process_index_increasing_and_compute_mappedWeight_by_the_third_mappedNodeWeightProgram_statement_immediately_before_the_node_integrand",
      "for_tail_integration_first_complete_tailCellBasisTableProgram_from_all_256_stored_points_then_process_index_increasing_and_compute_mappedWeight_by_the_third_mappedNodeWeightProgram_statement_immediately_before_the_node_dual_integrand",
      "each_nodeProduct_point_and_mappedWeight_is_computed_exactly_once_per_cell_and_no_all_cell_point_or_weight_table_is_permitted",
    ],
    tailCellBasisTableProgram: [
      "for_fixture_index_increasing_set(y,currentCellPoint[index]);_set_ui(two,2);_mul(twoY,two,y);_set_ui(one,1);_sub(t,twoY,one)",
      "set_ui(T_table[index,0],1);_set(T_table[index,1],t)",
      "for_n_increasing_1_through_30_mul(twoT,two,t);_mul(product,twoT,T_table[index,n]);_sub(T_table[index,n+1],product,T_table[index,n-1])",
      "after_T_table[index,31]_is_complete_the_32_entries_for_that_index_are_immutable_until_that_cell's_node_integrand_and_all_65_derivative_components_have_consumed_them;_after_index_255_is_consumed_clear_the_complete_table_in_slot_order_before_the_next_cell",
    ],
    corePrimalProgram: [
      "set(x,point);_set_ui(one,1);_add(onePlusX,one,x);_div(rho,x,onePlusX)",
      "if_cmp(rho,injected_immutable_L2_rho_source_support64[j])_equals_zero_choose_the_lowest_matching_j_and_set_d(u,immutable_projected_L2_u64[j])_then_skip_the_barycentric_sums",
      "otherwise_set_ui(numerator,0);_set_ui(denominator,0)",
      "otherwise_for_j_increasing_0_through_127_set_d(node,immutable_L2_rho_source_support64[j]);_sub(difference,rho,node)",
      "construct_the_exact_signed_barycentric_weight_by_the_same_join_weight_program;_div(ratio,weight,difference)",
      "set_d(uNode,immutable_projected_L2_u64[j]);_mul(weightedValue,ratio,uNode)",
      "add(nextNumerator,numerator,weightedValue);_set(numerator,nextNumerator)",
      "add(nextDenominator,denominator,ratio);_set(denominator,nextDenominator)",
      "after_j_div(u,numerator,denominator)",
      "mul(x2,x,x)",
      "mul(u2,u,u)",
      "mul(integrand,x2,u2)",
      "mul(term,mappedWeight,integrand)",
      "add(nextCoreSum,coreSum,term);_set(coreSum,nextCoreSum)",
    ],
    mpfrDualPrimitiveGraph: {
      representation:
        "dual=(v,d[0..64])_with_each_component_an_MPFR256_value_and_unknown_order_C_h0..h31_q0..q31",
      seed: "constant_dual_has_all_exact_positive_zero_derivatives;_unknown_z[k]_is_mpfr_set_d_of_exact_f64_bits_and_has_exact_d[k]=1_only",
      componentOrder: "k_increasing_0_through_64_after_each_primal_value",
      add: "add(out.v,a.v,b.v);_for_k_increasing_add(out.d[k],a.d[k],b.d[k])",
      subtract:
        "sub(out.v,a.v,b.v);_for_k_increasing_sub(out.d[k],a.d[k],b.d[k])",
      negate: "neg(out.v,a.v);_for_k_increasing_neg(out.d[k],a.d[k])",
      multiply:
        "mul(out.v,a.v,b.v);_for_k_increasing_mul(left,a.d[k],b.v);_mul(right,a.v,b.d[k]);_add(out.d[k],left,right)",
      divide:
        "div(out.v,a.v,b.v);_mul(den,b.v,b.v);_for_k_increasing_mul(left,a.d[k],b.v);_mul(right,a.v,b.d[k]);_sub(num,left,right);_div(out.d[k],num,den)",
      sqrt: "sqrt(out.v,a.v);_set_ui(two,2);_mul(twoV,two,out.v);_for_k_increasing_div(out.d[k],a.d[k],twoV)",
      exp: "exp(out.v,a.v);_for_k_increasing_mul(out.d[k],out.v,a.d[k])",
      log: "log(out.v,a.v);_for_k_increasing_div(out.d[k],a.d[k],a.v)",
      destinationAndAliasing:
        "every_dual_primitive_writes_a_fresh_fixed_arena_register_distinct_from_all_operand_registers;_the_primal_is_written_first_then_derivatives_k_0_through_64;_only_after_all_66_components_are_complete_may_the_named_destination_register_replace_a_source_handle",
      constantConstruction:
        "a_small_integer_constant_calls_set_ui_or_set_si_for_its_primal_then_set_ui_zero_for_derivatives_0_through_64;_a_binary64_constant_calls_set_d_for_its_primal_then_set_ui_zero_in_derivative_order;_a_fixture_dyadic_is_parsed_directly_to_its_exact_256_bit_primal_then_has_zero_derivatives;_a_precomputed_mapped_point_mappedWeight_or_T_table_constant_calls_set(primal,the_named_MPFR256_handle)_then_set_ui_zero_for_derivatives_0_through_64",
      unknownConstruction:
        "for_unknown_index_i_increasing_set_d(primal,z64[i]);_for_k_increasing_set_ui(d[k],k_equals_i?1:0)",
      barrierRule:
        "no_dual_component_is_get_d_during_a_node_or_cell;_only_the_complete_tailSum_66_component_barrier_may_call_get_d_in_its_declared_order",
    },
    tailPrimalAndDualProgram: [
      "y=constant_dual_from_currentCellPoint[index]_and_y_is_strictly_between_zero_and_one_for_every_GL_node",
      "nu=constant_dual_from_exact_L2_nu64_bits",
      "minusTwoNu=dual_multiply(constant_-2,nu)",
      "kappa=dual_sqrt(minusTwoNu)",
      "C=unknown_dual_z[0]",
      "sigma=dual_subtract(dual_divide(C,kappa),constant_1)",
      "a=dual_multiply(kappa,constant_R)",
      "H1=constant_dual_from_exact_join_U64_bits",
      "Hy1=dual_subtract(dual_multiply(dual_add(dual_negate(a),sigma),H1),dual_multiply(constant_R,constant_join_U1))",
      "A=exact_zero_dual;_for_n_increasing_0_through_31_construct_only_the_current_Tn_constant_dual_from_the_exact_retained_T_table[index,n]_MPFR256_handle_then_load_unknown_h[n]_compute_product_and_nextA_by_the_literal_dual_primitives_replace_A_and_release_Tn_hn_product_and_oldA_before_n_plus_1;_do_not_recompute_t_or_any_T_recurrence_or_retain_all_32_T_duals_in_the_node_graph",
      "oneMinusY=dual_subtract(constant_1,y)",
      "correction=dual_multiply(dual_multiply(oneMinusY,oneMinusY),A)",
      "H=dual_add(dual_add(H1,dual_multiply(Hy1,dual_subtract(y,constant_1))),correction)",
      "x=dual_divide(constant_R,y)",
      "xMinusR=dual_subtract(x,constant_R)",
      "xOverR=dual_divide(x,constant_R)",
      "exponent=dual_add(dual_negate(dual_multiply(kappa,xMinusR)),dual_multiply(sigma,dual_log(xOverR)))",
      "B=dual_exp(exponent)",
      "E=dual_multiply(B,B)",
      "y2=dual_multiply(y,y);_y4=dual_multiply(y2,y2)",
      "H2=dual_multiply(H,H)",
      "numerator=dual_multiply(dual_multiply(constant_R3,E),H2)",
      "integrand=dual_divide(numerator,y4)",
      "term=dual_multiply(constant_mappedWeight,integrand)",
      "tailSum=dual_add(tailSum,term)_with_primal_then_derivatives_C_h0..h31_q0..q31",
    ],
    accumulation:
      "coreSum_and_tailSum_are_distinct_MPFR256_positive_zero_accumulators;_the_predecessor_combined_accumulator_is_superseded;_complete_core_cells_then_core_nodes_in_literal_order_from_projected_L2_bits;_then_complete_tail_cells_then_tail_nodes_in_literal_order;_for_each_node_term=mul(mappedWeight,integrand)_then_add(the_corresponding_sum,term)",
    massResidual: [
      "after_the_once_only_complete_projected_L2_core_quadrature_core64=get_d(coreSum)_exactly_once_and_cache_those_bits",
      "after_each_complete_tail_quadrature_tail64=get_d(tailSum.v)_exactly_once_before_any_derivative_barrier",
      "read_C64_from_the_same_current_or_trial_tail_state_whose_other_rows_were_evaluated;_cMinusCore=round64(C64-core64);_mass=round64(cMinusCore-tail64)",
      "write_mass_as_row_64_only_after_rows_0_through_63_and_tail64_are_complete;_then_write_J_row_64_in_columns_increasing",
    ],
    tailSumBarrierOrder:
      "after_all_4096_cells_exactly_once_get_d_RNDN_for_tailSum.v_then_tailSum.d[C]_then_d[h0..h31]_then_write_exact_binary64_positive_zero_for_d[q0..q31]",
    analyticJacobian:
      "mass_J[0]=round64(1-tailDerivative64[C]);_mass_J[1..32]=canonicalize(round64(-tailDerivative64[h]));_mass_J[33..64]=positive_zero_in_increasing_column_order",
    finalAcceptedResidualGate: [
      "after_tail_Newton_reports_two_consecutive_qualifying_updates_copy_the_accepted_65_state_bits_without_projection",
      "recompute_rows_0_through_63_with_the_frozen_binary64_tail_primal_graph_then_recompute_the_complete_tail_MPFR256_quadrature_and_mass_row_with_the_cached_projected_L2_core64",
      "scan_rows_0_through_64_in_order;_reject_nonfinite_or_max_abs_residual_greater_than_2^-40",
      "only_after_this_gate_may_scalar_array_or_coefficient_output_buffers_be_allocated",
    ],
    streamingAndReuse: {
      resourcePreflight:
        "use_resourceModel_preflight_and_the_exact_65536_slot_MPFR_262144_slot_binary64_and_257_slot_permutation_arenas;_any_failure_is_typed_resource_preflight_failure_and_no_smaller_arena_or_dynamic_spill_is_allowed",
      fixedMpfrArenaLayout: [
        "slots_0_through_511_are_immutable_fixture_node_weight_values_index_interleaved_node_then_weight",
        "slots_512_through_767_are_the_current_cell_mapped_points_in_fixture_index_order",
        "slots_768_through_8959_are_the_current_cell_256_by_32_T_table_node_outer_then_n_inner",
        "slots_8960_through_13183_are_64_dual_scratch_registers_each_primal_then_d0_through_d64",
        "slots_13184_through_13249_are_tailSum_primal_then_d0_through_d64",
        "slot_13250_is_the_immutable_projected_L2_coreSum_and_slots_13251_through_13319_are_69_scalar_cell_coordinate_and_conversion_scratch_values",
        "slots_13320_through_65535_are_initialized_but_forbidden_unused_reserve_and_must_remain_positive_zero",
      ],
      fixtureTable:
        "parse_and_validate_all_256_node_weight_dyadics_once_in_index_order_then_retain_as_immutable_MPFR256_values",
      cellStreaming:
        "process_exactly_one_cell_at_a_time_and_never_materialize_all_4096_by_256_tail_points_or_duals",
      coreIntegralReuse:
        "compute_once_after_L2_acceptance_store_the_complete_MPFR256_coreSum_in_immutable_slot_13250_and_one_core64_get_d_RNDN_bit_pattern_then_reuse_those_identical_MPFR256_and_binary64_bytes_for_tail_initializer_and_every_mass_row_without_a_second_core_quadrature;_slots_13251_through_13319_may_be_reused_but_slot_13250_may_not_be_written_until_every_tail_and_output_consumer_has_crossed_its_barrier",
      tailBasisReuse:
        "for_each_tail_cell_generate_all_256_points_in_node_order_then_T0_through_T31_by_tailCellBasisTableProgram_into_the_fixed_node_outer_T_table_once;_load_each_T_entry_by_dictionary_set_as_a_constant_dual_for_the_primal_and_all_65_derivative_components_then_clear_and_overwrite_the_table_only_after_that_cell's_last_node",
      zeroDerivativeElision:
        "mass_integrand_has_identically_zero_q_derivatives_so_write_exact_MPFR_positive_zero_for_derivative_slots_33_through_64_without_evaluating_Q",
      batching:
        "maintain_one_primal_MPFR256_accumulator_and_one_65_entry_MPFR256_derivative_accumulator;_for_each_node_update_primal_then_derivative_entries_C_h0_through_h31_q0_through_q31_in_that_order_with_no_batch_reordering",
      dualRegisterAllocation:
        "interpret_the_literal_tailPrimalAndDualProgram_as_left_to_right_statements;_allocate_each_constant_unknown_or_fresh_primitive_destination_to_the_lowest_numbered_free_register_0_through_63;_an_operand_register_is_released_only_after_its_last_literal_use_and_after_all_primal_then_d0_through_d64_destination_components_are_complete;_release_simultaneously_dead_operands_in_increasing_register_order;_a_need_for_register_64_is_typed_resource_preflight_failure_and_spill_recomputation_or_alternate_allocation_is_forbidden",
      threadOrParallelBatchAllowed: false,
      feasibilityOrExecutionAuthorityEstablished: false,
    },
    initializerC:
      "the_complete_core_integral_graph_only_then_one_get_d_RNDN;_h_and_q_are_32_canonical_positive_zeros;_recompute_lifts_from_C",
    adaptiveSubdivisionEarlyStopOrAlternateRuleAllowed: false,
  },
  outputMaterialization: {
    scalarOrder: [
      "nu0",
      "Vc",
      "N0",
      "C",
      "kappa",
      "sigma",
      "lambda",
      "nu_star",
      "wSeed",
    ],
    scalarMpfrGraph: {
      source:
        "only_the_immutable_projected_L2_archive_nu_and_V_at_origin_bits_plus_the_final_accepted_tail_C_bits;_no_binary64_kappa_sigma_mass_integral_or_tail_residual_intermediate_is_reused",
      program: [
        "set_d(nuMp,projectedL2Nu64);_set_d(VcMp,projectedL2V64[0]);_set_d(CMp,acceptedTailC64)",
        "set_si(minusTwo,-2);_mul(minusTwoNu,minusTwo,nuMp);_sqrt(kappaMp,minusTwoNu)",
        "div(COverKappa,CMp,kappaMp);_set_ui(one,1);_sub(sigmaMp,COverKappa,one)",
        "set_ui(four,4);_const_pi(piMp);_mul(fourPi,four,piMp);_mul(N0Mp,fourPi,CMp)",
        "set_ui(thirtyTwo,32);_div(lambdaMp,one,thirtyTwo);_mul(lambdaSquaredMp,lambdaMp,lambdaMp);_mul(nuStarMp,lambdaSquaredMp,nuMp)",
        "set_ui(two,2);_mul(twoNuStar,two,nuStarMp);_add(wSquared,one,twoNuStar);_sqrt(wSeedMp,wSquared)",
      ],
      barrierOrder: [
        "nu0=get_d(nuMp)",
        "Vc=get_d(VcMp)",
        "N0=get_d(N0Mp)",
        "C=get_d(CMp)",
        "kappa=get_d(kappaMp)",
        "sigma=get_d(sigmaMp)",
        "lambda=get_d(lambdaMp)",
        "nu_star=get_d(nuStarMp)",
        "wSeed=get_d(wSeedMp)",
      ],
      exactBarrierCount: 9,
    },
    arrayLevelOrder: ["L0", "L1", "L2", "AUDIT"],
    arrayRoleOrder: [
      "rho_nodes",
      "base_scalar_u0",
      "base_potential_V0",
      "target_scalar_u_star",
      "target_potential_V_star",
    ],
    rhoArrays:
      "for_L0_L1_L2_and_AUDIT_generate_each_rhoMp_by_the_literal_frozen_nodeProgram_for_that_level_N_then_store_rho_nodes[j]=get_d(rhoMp)_exactly_once_in_j_order;_after_L2_storage_compare_all_128_output_bit_patterns_to_immutable_L2_rho_source_support_and_fail_materialization_on_any_mismatch;_the_retained_AUDIT_rhoMp_not_the_stored_rho64_is_the_composite_x_input",
    baseArrays: {
      L0L1L2:
        "for_each_level_use_that_level's_frozen_rho_node_bits_and_the_same_immutable_projected_level_archive_bits;_inject_rho_and_all_archived_projected_nodal_bits_into_MPFR256;_rho=1_returns_MPFR256_positive_zero;_an_exact_source_node_match_selects_the_lowest_matching_index_and_set_d_of_its_value;_otherwise_run_levelTransfer.sourceWeightProgram_and_the_same_j_increasing_MPFR256_barycentric_numerator_denominator_graph;_exactly_one_get_d_per_stored_u_or_V_value",
      AUDIT:
        "generate_256_rhoMp_nodes_by_the_frozen_literal_nodeProgram_and_get_d_once_for_each_stored_rho_nodes_value_while_retaining_the_exact_rhoMp_handle;_run_auditRhoToXProgram_then_the_MPFR256_composite_evaluator_from_the_same_projected_final_L2_and_accepted_tail_state;_rho=1_constructs_two_MPFR256_positive_zeros;_exactly_one_get_d_per_stored_u_or_V_value",
    },
    MPFR256CompositeEvaluator: {
      input:
        "one_MPFR256_x_value_held_without_binary64_barrier_plus_immutable_L2_rho_source_support_bits_168720_through_168847_and_exact_L2_u_V_nu_join_C_h_q_binary64_bits_injected_by_mpfr_set_d",
      auditRhoToXProgram: [
        "the_AUDIT_node_generator_retains_rhoMp_without_reinjecting_its_stored_binary64_rounding",
        "set_ui(one,1);_cmp(rhoMp,one);_if_equal_take_the_infinity_branch_and_do_not_form_oneMinusRho_or_x",
        "otherwise_sub(oneMinusRho,one,rhoMp);_div(xMp,rhoMp,oneMinusRho)_and_do_not_get_d",
      ],
      coreBranchProgram: [
        "set_ui(RMp,32);_cmp(xMp,RMp);_if_less_than_or_equal_continue_else_take_tailBranchProgram",
        "set_ui(one,1);_add(onePlusX,one,xMp);_div(rhoMp,xMp,onePlusX)",
        "for_each_field_u_then_V_scan_j_increasing_set_d(nodeMp,immutable_L2_rho_source_support64[j]);_cmp(rhoMp,nodeMp);_if_equal_choose_the_lowest_j_and_set_d(result,projectedField64[j])",
        "otherwise_set_ui(numerator,0);_set_ui(denominator,0);_for_j_increasing_set_d(nodeMp,immutable_L2_rho_source_support64[j]);_set_ui(weightMagnitude,j_is_0_or_127?1:2);_set_ui(two,2);_div(weightUnsigned,weightMagnitude,two);_if_j_is_odd_neg(weightMp,weightUnsigned)_else_set(weightMp,weightUnsigned);_sub(difference,rhoMp,nodeMp);_div(ratio,weightMp,difference);_set_d(valueMp,projectedField64[j]);_mul(weightedValue,ratio,valueMp);_add(nextNumerator,numerator,weightedValue)_then_copy;_add(nextDenominator,denominator,ratio)_then_copy;_after_loop_div(result,numerator,denominator)",
        "return_uMp_then_VMp_without_get_d",
      ],
      tailConstantProgram: [
        "set_d(nuMp,projectedL2Nu64);_set_si(minusTwo,-2);_mul(minusTwoNu,minusTwo,nuMp);_sqrt(kappa,minusTwoNu)",
        "set_d(CMp,acceptedTailC64);_div(COverKappa,CMp,kappa);_set_ui(one,1);_sub(sigma,COverKappa,one);_set_ui(RMp,32);_mul(a,kappa,RMp)",
        "set_d(H1,U64);_set_d(U1Mp,U1_64);_neg(negativeA,a);_add(negativeAPlusSigma,negativeA,sigma);_mul(liftProduct,negativeAPlusSigma,H1);_mul(RU1,RMp,U1Mp);_sub(Hy1,liftProduct,RU1)",
        "set_d(VJoin,V64);_div(COverR,CMp,RMp);_add(Q1,VJoin,COverR);_set_d(V1Mp,V1_64)",
        "set_si(minusTwoExact,-2);_mul(minusTwoA,minusTwoExact,a);_set_ui(two,2);_mul(twoSigma,two,sigma);_add(qLiftCoefficient,minusTwoA,twoSigma);_mul(qLiftProduct,qLiftCoefficient,Q1);_mul(RV1,RMp,V1Mp);_add(qLiftPlusC,qLiftProduct,COverR);_sub(Qy1,qLiftPlusC,RV1)",
      ],
      tailBranchProgram: [
        "div(y,RMp,xMp);_set_ui(two,2);_mul(twoY,two,y);_set_ui(one,1);_sub(t,twoY,one)",
        "set_ui(T0,1);_copy(T1,t);_for_n_increasing_1_through_30_mul(twoT,two,t);_mul(product,twoT,Tn);_sub(Tnext,product,Tprevious)_then_shift_handles",
        "set_ui(Ah,0);_set_ui(Aq,0);_for_n_increasing_set_d(hn,h64[n]);_mul(hTerm,hn,Tn);_add(nextAh,Ah,hTerm)_then_copy;_set_d(qn,q64[n]);_mul(qTerm,qn,Tn);_add(nextAq,Aq,qTerm)_then_copy",
        "sub(yMinusOne,y,one);_sub(oneMinusY,one,y);_mul(oneMinusYSquared,oneMinusY,oneMinusY)",
        "mul(HLinearTerm,Hy1,yMinusOne);_add(HBase,H1,HLinearTerm);_mul(HCorrection,oneMinusYSquared,Ah);_add(H,HBase,HCorrection)",
        "mul(QLinearTerm,Qy1,yMinusOne);_add(QBase,Q1,QLinearTerm);_mul(QCorrection,oneMinusYSquared,Aq);_add(Q,QBase,QCorrection)",
        "sub(xMinusR,xMp,RMp);_mul(kappaTimesDistance,kappa,xMinusR);_neg(decayTerm,kappaTimesDistance);_div(xOverR,xMp,RMp);_log(logXOverR,xOverR);_mul(logTerm,sigma,logXOverR);_add(exponent,decayTerm,logTerm);_exp(B,exponent);_mul(E,B,B)",
        "mul(uMp,B,H);_div(COverX,CMp,xMp);_neg(coulomb, COverX);_mul(EQ,E,Q);_add(VMp,coulomb,EQ);_return_uMp_then_VMp_without_get_d",
      ],
      infinityBranch: "set_ui(uMp,0);_set_ui(VMp,0);_return_both_without_get_d",
      noBinary64IntermediateAllowed: true,
    },
    targetArrays: {
      coordinateSource:
        "for_L0_L1_L2_call_set_d(rhoMp,the_stored_rho_nodes64_bits)_so_target_roles_share_the_level's_binary64_node_ABI;_for_AUDIT_use_the_retained_exact_rhoMp_from_the_N256_nodeProgram_before_its_rho_nodes_get_d_barrier;_neither_path_forms_binary64_x_or_lambdaTimesX",
      finiteNode: [
        "obtain_rhoMp_by_coordinateSource;_set_ui(one,1);_sub(oneMinusRho,one,rhoMp);_div(xMp,rhoMp,oneMinusRho)",
        "set_ui(thirtyTwo,32);_div(lambdaMp,one,thirtyTwo);_mul(xBaseMp,lambdaMp,xMp)_with_no_get_d_or_binary64_lambda_x_product",
        "run_MPFR256CompositeEvaluator_at_xBaseMp_to_obtain_baseU_baseV;_mul(lambdaSquaredMp,lambdaMp,lambdaMp);_mul(targetUMp,lambdaSquaredMp,baseU);_mul(targetVMp,lambdaSquaredMp,baseV)",
        "store_targetU=get_d(targetUMp)_once_then_targetV=get_d(targetVMp)_once",
      ],
      infinityNode:
        "construct_MPFR256_positive_zero_for_baseU_baseV_targetU_targetV_and_apply_exactly_one_get_d_RNDN_per_stored_target_value_without_forming_x_or_xBase",
      mixedBinary64EvaluationAllowed: false,
    },
    outputBarrier:
      "every_rho_base_L0_L1_L2_AUDIT_field_target_field_core_coefficient_tail_coefficient_and_scalar_stored_value_has_exactly_one_terminal_dictionary_get_d_after_its_complete_named_MPFR256_graph_and_no_earlier_get_d",
    coreCoefficientPayloads:
      "apply_the_frozen_literal_MPFR256_DCT_I_transform_to_each_same_immutable_projected_level_archive_u_then_V_bits;_rawAcceptedState_bits_are_forbidden",
    tailCoefficientPayloads:
      "for_accepted_h[0..31]_then_q[0..31]_set_d(coefficientMp,the_exact_final_accepted_tail_bits)_then_store_get_d(coefficientMp)_exactly_once;_no_binary64_arithmetic_or_direct_bit_copy",
    binaryEncoding:
      "each_role_is_a_fresh_exact_length_nonaliased_f64le_buffer_in_literal_order_with_every_value_finite_and_negative_zero_forbidden",
    materializationOrder: [
      "nine_scalars",
      "twenty_level_role_arrays",
      "six_core_coefficient_arrays",
      "two_tail_coefficient_arrays",
    ],
    materializationIsNotAcceptance: true,
  },
  operationSchedule: [
    "verify_dependency_and_fixture_pins_before_any_candidate_numeric_read",
    "perform_the_exact_resourceModel_preflight",
    "generate_only_L0_nodes_and_core_D_D2_operators_in_the_single_current_operator_set;_defer_L1_L2_and_AUDIT_generation",
    "materialize_fixed_L0_initializer",
    "solve_core_L0_once",
    "postproject_L0_infinity_endpoints_and_pass_the_full_projected_residual_gate",
    "archive_projected_L0_copy_L0_source_rho_to_transfer_scratch_release_L0_operators_generate_only_L1_operators_transfer_from_projected_L0_solve_core_L1_once_then_postproject_and_gate_L1",
    "archive_projected_L1_copy_L1_source_rho_to_transfer_scratch_release_L1_operators_generate_only_L2_operators_transfer_from_projected_L1_solve_core_L2_once_then_postproject_gate_L2_and_copy_immutable_L2_rho_source_support",
    "extract_L2_join_data_while_the_single_L2_rho_operator_set_is_still_live",
    "compute_the_once_only_fixed_GL256_projected_L2_core_integral_while_L2_rho_is_still_live_then_release_the_L2_operator_set_and_materialize_the_tail_initializer",
    "solve_tail_K32_once_with_fixed_GL256_mass_row",
    "recompute_and_pass_the_final_tail_residual_including_the_frozen_mass_barrier",
    "regenerate_only_the_needed_L0_L1_L2_AUDIT_nodes_or_DCT_constants_without_D_or_D2_then_materialize_scalars_arrays_and_coefficients_from_the_immutable_archives_join_and_final_tail_state",
    "stop_before_any_acceptance_until_the_separate_directed_proof_and_replay_policies_succeed",
  ],
  syntheticConformanceFixtures: SYNTHETIC_CONFORMANCE_FIXTURES,
  firstFailurePrecedence: [
    "dependency_or_literal_pin_mismatch",
    "gauss_legendre_fixture_absent_or_mismatched",
    "implementation_toolchain_runtime_or_preseal_absent",
    "resource_preflight_failure",
    "node_or_operator_materialization_failure",
    "L0_initializer_failure",
    "L0_core_Newton_or_LU_failure",
    "L0_endpoint_projection_or_projected_residual_failure",
    "L1_transfer_or_core_Newton_or_LU_failure",
    "L1_endpoint_projection_or_projected_residual_failure",
    "L2_transfer_or_core_Newton_or_LU_failure",
    "L2_endpoint_projection_or_projected_residual_failure",
    "L2_join_extraction_failure",
    "tail_initializer_or_fixed_quadrature_failure",
    "tail_Newton_LU_or_mass_row_failure",
    "final_tail_residual_or_mass_barrier_failure",
    "output_materialization_failure",
    "directed_proof_not_yet_run_or_failed",
  ],
  attemptPolicy: {
    maximumCandidateAttempts: 1,
    retryAllowed: false,
    retuneAllowed: false,
    alternateInitializerGridJoinTailOrderPrecisionToleranceAlgorithmOrQuadratureAllowed: false,
    failureDisposition: "fail_the_frozen_candidate_without_fallback",
  },
  completionBoundary: {
    primaryFiniteOperationGraphFrozen: true,
    gaussLegendreFixtureBound: true,
    primaryImplementationPresent: false,
    runtimeClosurePresent: false,
    preexecutionPresealPresent: false,
    executionAuthorized: false,
    executionObserved: false,
    outputPresent: false,
    outputAccepted: false,
    directedProofPresent: false,
    seedAccepted: false,
  },
  blockers: BLOCKERS,
  unresolved: UNRESOLVED,
  authorityLocks: AUTHORITY_LOCKS,
  claimLockKeys: NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1.claimLockKeys,
  claimLocks: NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1.claimLocks,
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

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1 =
  deepFreeze(POLICY);

const exactLiveFileBindingMatches = (binding: {
  readonly relativePath: string;
  readonly sha256: string;
  readonly sizeBytes: number;
}): boolean => {
  try {
    const bytes = readFileSync(binding.relativePath);
    return (
      bytes.byteLength === binding.sizeBytes &&
      createHash("sha256").update(bytes).digest("hex") === binding.sha256
    );
  } catch {
    return false;
  }
};

const assertInvariants = (): void => {
  const pins =
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_DEPENDENCY_PINS;
  if (
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256 !==
      pins.semanticSeed.sha256 ||
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_SIZE_BYTES !==
      pins.semanticSeed.canonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_SHA256 !==
      pins.incompleteOperationPolicy.sha256 ||
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_CANONICAL_SIZE_BYTES !==
      pins.incompleteOperationPolicy.canonicalSizeBytes ||
    !exactLiveFileBindingMatches(pins.gaussLegendre256Fixture.manifest) ||
    !exactLiveFileBindingMatches(pins.gaussLegendre256Fixture.rawRecords) ||
    !exactLiveFileBindingMatches(
      pins.gaussLegendre256Fixture.generatorVerifier,
    ) ||
    !exactLiveFileBindingMatches(
      pins.gaussLegendre256Fixture.independentTest,
    ) ||
    POLICY.coreNodesAndOperators.levels
      .map((level) => level.radialNodeCount)
      .join(",") !== "64,96,128" ||
    POLICY.tailResidualAndJacobian.K !== 32 ||
    POLICY.tailResidualAndJacobian.unknownOrder.includes("length_65") !==
      true ||
    POLICY.fixedGaussLegendre256Quadrature.coreCells !== 256 ||
    POLICY.fixedGaussLegendre256Quadrature.tailCells !== 4096 ||
    POLICY.arithmetic.mpfrContext.precisionBits !== 256 ||
    POLICY.arithmetic.mpfrContext.exponentRange.emin !== -1000000 ||
    POLICY.arithmetic.mpfrContext.exponentRange.emax !== 1000000 ||
    POLICY.resourceModel.mpfrArena.elementCount !== 65536 ||
    POLICY.resourceModel.binary64SolverArena.elementCount !== 262144 ||
    POLICY.resourceModel.permutationArena.elementCount !== 257 ||
    POLICY.resourceModel.coreLevelOperatorLifetime.operatorSetCapacity !== 1 ||
    POLICY.resourceModel.coreLevelOperatorLifetime
      .simultaneousAllLevelOperatorGenerationAllowed !== false ||
    !POLICY.resourceModel.binary64SolverArena.maximumCoreLayout.includes(
      "168720..168847=immutable_L2_rho_source_support_written_only_after_projected_L2_gate",
    ) ||
    POLICY.resourceModel.outputBuffers.totalBufferCount !== 37 ||
    POLICY.resourceModel.outputBuffers.totalByteLength !== 26952 ||
    POLICY.tailResidualAndJacobian.analyticJacobian.exactRegisterCapacity !==
      64 ||
    POLICY.outputMaterialization.scalarMpfrGraph.exactBarrierCount !== 9 ||
    POLICY.L2JoinExtraction.joinRhoExact !== "32/33" ||
    POLICY.predecessorSupersession.successorDoesNotSupersedeSemanticSeed !==
      true ||
    POLICY.denseLinearSolve.iterativeRefinement.exactPassCount !== 3 ||
    POLICY.newtonControl.maximumAcceptedUpdatesPerSystem !== 48 ||
    POLICY.newtonControl.lineSearch.maximumTrials !== 25 ||
    POLICY.completionBoundary.primaryFiniteOperationGraphFrozen !== true ||
    POLICY.completionBoundary.gaussLegendreFixtureBound !== true ||
    Object.entries(POLICY.completionBoundary)
      .filter(
        ([key]) =>
          key !== "primaryFiniteOperationGraphFrozen" &&
          key !== "gaussLegendreFixtureBound",
      )
      .some(([, value]) => value !== false) ||
    Object.values(POLICY.authorityLocks).some((value) => value !== false) ||
    Object.values(POLICY.unresolved).some((value) => value !== null) ||
    Object.values(POLICY.claimLocks).some((value) => value !== false)
  ) {
    throw new Error(
      "nhm2_spherical_boson_star_newtonian_seed_primary_numerics_v1_invariant_violation",
    );
  }
};

assertInvariants();

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_VALIDATOR_LIMITS =
  Object.freeze({
    maximumDepth: 32,
    maximumNodes: 16384,
    maximumArrayLength: 512,
    maximumObjectPropertyCount: 256,
    maximumStringUtf8Bytes: 32768,
  } as const);

type SnapshotResult =
  | Readonly<{ ok: true; value: unknown }>
  | Readonly<{ ok: false; violation: string }>;

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
  budget = { nodes: 0 },
): SnapshotResult => {
  const limits =
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_VALIDATOR_LIMITS;
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
    return Buffer.byteLength(value, "utf8") <= limits.maximumStringUtf8Bytes
      ? Object.freeze({ ok: true, value })
      : Object.freeze({
          ok: false,
          violation: `string_byte_limit:${pointer || "/"}`,
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
      violation: `cycle:${pointer || "/"}`,
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
    if (keys.some((key) => typeof key !== "string")) {
      return Object.freeze({
        ok: false,
        violation: `symbol_key:${pointer || "/"}`,
      });
    }
    const indices = (keys as string[]).filter((key) => key !== "length");
    if (
      keys.length !== length + 1 ||
      indices.length !== length ||
      indices.some((key) => {
        if (!/^(0|[1-9][0-9]*)$/.test(key)) return true;
        const index = Number(key);
        return !Number.isSafeInteger(index) || index < 0 || index >= length;
      })
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

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_CANONICAL_JSON =
  canonicalJson(NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1);
export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-newtonian-seed-primary-numerics/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_SHA256 =
  createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_CANONICAL_JSON,
    "utf8",
  );

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_BINDING =
  Object.freeze({
    artifactId:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_ARTIFACT_ID,
    policyVersion:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_VERSION,
    candidateId:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1.candidateId,
    sha256Domain:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_SHA256_DOMAIN,
    sha256: NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_SHA256,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_CANONICAL_SIZE_BYTES,
    mediaType: "application/json" as const,
  });

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_EXPECTED_SHA256 =
  "a4ee03e387f9e3e0a9d1f117f6671aa6ac0ca3f97508706c0f52e811d15372a4" as
    string | null;
export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_EXPECTED_CANONICAL_SIZE_BYTES =
  80055 as number | null;
export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_LITERAL_SEAL_STATUS =
  "sealed_with_final_GL256_binding_and_consolidated_determinism_invariant" as const;

if (
  (NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_EXPECTED_SHA256 ==
    null) !==
  (NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_EXPECTED_CANONICAL_SIZE_BYTES ==
    null)
) {
  throw new Error("nhm2_spherical_seed_primary_numerics_partial_literal_pin");
}
if (
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_EXPECTED_SHA256 !=
    null &&
  (NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_SHA256 !==
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_EXPECTED_SHA256 ||
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_CANONICAL_SIZE_BYTES !==
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_EXPECTED_CANONICAL_SIZE_BYTES)
) {
  throw new Error(
    `nhm2_spherical_seed_primary_numerics_literal_pin_mismatch:${NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_SHA256}/${NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_CANONICAL_SIZE_BYTES}`,
  );
}

const EXPECTED_CANONICAL_JSON =
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_CANONICAL_JSON;

export const nhm2SphericalBosonStarNewtonianSeedPrimaryNumericsV1Violations = (
  value: unknown,
): string[] => {
  if (value === NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1) {
    return [];
  }
  let snapshot: SnapshotResult;
  try {
    snapshot = snapshotPlainData(value);
  } catch {
    return ["spherical_seed_primary_numerics_plain_data_snapshot_invalid"];
  }
  if (!snapshot.ok) return [snapshot.violation];
  try {
    return canonicalJson(snapshot.value) === EXPECTED_CANONICAL_JSON
      ? ["spherical_seed_primary_numerics_external_copy_not_authoritative"]
      : ["spherical_seed_primary_numerics_semantic_mismatch"];
  } catch {
    return ["spherical_seed_primary_numerics_plain_data_snapshot_invalid"];
  }
};

export const isNhm2SphericalBosonStarNewtonianSeedPrimaryNumericsV1 = (
  value: unknown,
): value is typeof NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1 =>
  value === NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1;
