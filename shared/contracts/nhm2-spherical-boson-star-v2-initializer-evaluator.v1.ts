import { createHash } from "node:crypto";

import { NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING } from "./nhm2-spherical-boson-star-newtonian-seed.v1";
import { NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_BINDING } from "./nhm2-spherical-boson-star-newtonian-seed-interchange.v1";
import { NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_BINDING } from "./nhm2-spherical-boson-star-newtonian-seed-primary-numerics.v1";
import {
  computeNhm2SphericalBosonStarV2InitializerBindingSha256,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_PAYLOADS,
} from "./nhm2-spherical-boson-star-v2-initializer-bridge.v1";

export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_ARTIFACT_ID =
  "nhm2.spherical_boson_star_v2_initializer_evaluator" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_CONTRACT_VERSION =
  "nhm2_spherical_boson_star_v2_initializer_evaluator/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_PHASE =
  "stage_2_preexecution_initializer_evaluator_policy" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-initializer-evaluator/v1\n" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_PAYLOAD_HASH_DOMAIN =
  "nhm2-spherical-boson-star-v2-initializer-evaluator/payload/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_BINDING_HASH_DOMAIN =
  "nhm2-spherical-boson-star-v2-initializer-evaluator/instance-binding/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_INSTANCE_ARTIFACT_ID =
  "nhm2.spherical_boson_star_v2_initializer_evaluator_instance" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_INSTANCE_CONTRACT_VERSION =
  "nhm2_spherical_boson_star_v2_initializer_evaluator_instance/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_TRACE_RECEIPT_ARTIFACT_ID =
  "nhm2.spherical_boson_star_v2_initializer_evaluator_join_barrier_trace_receipt" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_TRACE_RECEIPT_CONTRACT_VERSION =
  "nhm2_spherical_boson_star_v2_initializer_evaluator_join_barrier_trace_receipt/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_TRACE_HASH_DOMAIN =
  "nhm2-spherical-boson-star-v2-initializer-evaluator/join-barrier-trace/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_TRACE_RECEIPT_RAW_HASH_DOMAIN =
  "nhm2-spherical-boson-star-v2-initializer-evaluator/join-barrier-trace-receipt-raw/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_PRIMARY_RECEIPT_SCHEMA_VERSION =
  "nhm2_spherical_boson_star_newtonian_seed_primary_candidate_receipt/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_BARRIER_CAPTURE_BOUNDARY =
  "same_primary_attempt_exact_L2JoinExtraction_get_d_RNDN_barriers_after_last_scientific_check_before_receipt_publication" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_BARRIER_SOURCE_OPERATION =
  "get_d_RNDN(U=u_at_x32);get_d_RNDN(U1=du_dx_at_x32);get_d_RNDN(V=V_at_x32);get_d_RNDN(V1=dV_dx_at_x32)" as const;

const EXISTING_FIVE_PAYLOADS = Object.freeze([
  Object.freeze({
    ordinal: 0,
    path: "scalars.f64le",
    semanticRole: "source_seed_scalar_operands",
    elementType: "IEEE754_binary64_little_endian",
    elementCount: 9,
    sizeBytes: 72,
    elementOrder: Object.freeze([
      "nu0",
      "Vc",
      "N0",
      "C",
      "kappa",
      "sigma",
      "lambda",
      "nu_star",
      "wSeed",
    ] as const),
    origin: "existing_interchange_payload",
  }),
  Object.freeze({
    ordinal: 1,
    path: "coefficients/core_L2_u.f64le",
    semanticRole: "source_seed_L2_scalar_Chebyshev_coefficients",
    elementType: "IEEE754_binary64_little_endian",
    elementCount: 128,
    sizeBytes: 1_024,
    elementOrder: "coefficient_n_increasing_0_through_127",
    origin: "existing_interchange_payload",
  }),
  Object.freeze({
    ordinal: 2,
    path: "coefficients/core_L2_V.f64le",
    semanticRole: "source_seed_L2_potential_Chebyshev_coefficients",
    elementType: "IEEE754_binary64_little_endian",
    elementCount: 128,
    sizeBytes: 1_024,
    elementOrder: "coefficient_n_increasing_0_through_127",
    origin: "existing_interchange_payload",
  }),
  Object.freeze({
    ordinal: 3,
    path: "coefficients/tail_H.f64le",
    semanticRole: "source_seed_tail_H_correction_coefficients",
    elementType: "IEEE754_binary64_little_endian",
    elementCount: 32,
    sizeBytes: 256,
    elementOrder: "coefficient_n_increasing_0_through_31",
    origin: "existing_interchange_payload",
  }),
  Object.freeze({
    ordinal: 4,
    path: "coefficients/tail_Q.f64le",
    semanticRole: "source_seed_tail_Q_correction_coefficients",
    elementType: "IEEE754_binary64_little_endian",
    elementCount: 32,
    sizeBytes: 256,
    elementOrder: "coefficient_n_increasing_0_through_31",
    origin: "existing_interchange_payload",
  }),
] as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_SUPPLEMENTAL_JOIN_PAYLOAD =
  Object.freeze({
    ordinal: 5,
    path: "initializer/core_L2_join_barrier.f64le",
    semanticRole: "source_seed_primary_L2_join_barrier",
    elementType: "IEEE754_binary64_little_endian",
    elementCount: 4,
    sizeBytes: 32,
    elementOrder: Object.freeze(["U", "U1", "V", "V1"] as const),
    origin: "successor_supplemental_payload",
    sourceGraph:
      "exact_four_get_d_RNDN_barriers_U_u_at_x32_then_U1_du_dx_at_x32_then_V_V_at_x32_then_V1_dV_dx_at_x32_from_the_bound_primary_numerics_L2JoinExtraction",
    requiredForTailC1Lift: true,
    currentInstance: null,
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_PAYLOADS =
  Object.freeze([
    ...EXISTING_FIVE_PAYLOADS,
    NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_SUPPLEMENTAL_JOIN_PAYLOAD,
  ] as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_BLOCKERS =
  Object.freeze([
    Object.freeze({
      ordinal: 0,
      blockerId: "supplemental_join_barrier_payload_unbound",
      requiredResolution:
        "bind_one_valid_domain_separated_supplemental_trace_receipt_and_six_payload_instance_that_recompute_the_exact_primary_receipt_input_five_payload_hashes_primary_policy_proof_binding_and_U_U1_V_V1_barrier_trace",
      disposition: "blocked_without_candidate_result",
    }),
    Object.freeze({
      ordinal: 1,
      blockerId: "initializer_evaluator_implementation_unbound",
      requiredResolution:
        "bind_a_source_disjoint_implementation_of_this_exact_operation_graph",
      disposition: "blocked_without_candidate_result",
    }),
    Object.freeze({
      ordinal: 2,
      blockerId: "initializer_evaluator_runtime_and_preseal_unbound",
      requiredResolution:
        "bind_toolchain_executable_runtime_and_scientific_preseal_before_any_evaluation",
      disposition: "blocked_without_candidate_result",
    }),
    Object.freeze({
      ordinal: 3,
      blockerId: "initializer_grid_instance_unbound",
      requiredResolution:
        "bind_the_separately_selected_v2_compactified_grid_without_changing_this_evaluator",
      disposition: "blocked_without_candidate_result",
    }),
    Object.freeze({
      ordinal: 4,
      blockerId: "initializer_evaluation_unexecuted",
      requiredResolution:
        "execute_once_under_a_future_authorized_candidate_run_and_persist_a_non_authoritative_initializer_receipt",
      disposition: "blocked_without_candidate_result",
    }),
  ] as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_AUTHORITY_LOCKS =
  Object.freeze({
    sourceV3CandidateAuthorityImported: false as const,
    sourceV3ProofAuthorityImported: false as const,
    sourceV3RuntimeAuthorityImported: false as const,
    supplementalJoinPayloadAuthority: false as const,
    primaryProjectedNodalBytesRecovered: false as const,
    primaryJoinBytesInferredFromRoundedCoefficients: false as const,
    primaryCompositeByteIdentity: false as const,
    primaryCoreTailC1ProofInherited: false as const,
    v2CandidateAuthority: false as const,
    v2InitializerAcceptanceAuthority: false as const,
    v2GridAuthority: false as const,
    implementationAuthority: false as const,
    runtimeAuthority: false as const,
    scientificPresealAuthority: false as const,
    executionAuthority: false as const,
    executionObserved: false as const,
    residualPassAuthority: false as const,
    branchAuthority: false as const,
    noFoldAuthority: false as const,
    replayAuthority: false as const,
    independentAgreement: false as const,
    semiclassicalStressNoiseLamp: false as const,
    semiclassicalConstraintAlgebraLamp: false as const,
    diagnosticPass: false as const,
    theoryGraphPromotion: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
    certificateAuthority: false as const,
  });

export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_VALIDATOR_LIMITS =
  Object.freeze({
    maximumCanonicalWireCodeUnits: 524_288,
    maximumCanonicalWireUtf8Bytes: 524_288,
    maximumDepth: 24,
    maximumNodes: 8_192,
    maximumArrayLength: 512,
    maximumObjectPropertyCount: 128,
    maximumPropertyKeyUtf8Bytes: 2_048,
    maximumStringUtf8Bytes: 32_768,
    maximumAggregateUtf8Bytes: 524_288,
  } as const);

const CONTRACT = {
  artifactId: NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_ARTIFACT_ID,
  contractVersion:
    NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_CONTRACT_VERSION,
  phase: NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_PHASE,
  authority:
    "coefficient_space_initializer_evaluator_policy_only_without_implementation_runtime_execution_or_scientific_authority",
  maturity:
    "stage_2_deterministic_initializer_operation_graph_with_required_instances_absent",
  frozenBeforeTargetExecution: true,
  candidateIdentity: {
    sourceCandidateId:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING.candidateId,
    targetCandidateId:
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_BINDING.candidateId,
    sourceAndTargetMustBeDistinct: true,
    sourceEvidenceRoleOnly: true,
    automaticSourceV3AuthorityUpgradeAllowed: false,
  },
  exactUpstreamBindings: {
    semanticSeed: {
      ...NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING,
    },
    interchange: {
      ...NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_BINDING,
    },
    primaryNumerics: {
      ...NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_BINDING,
    },
    initializerBridge: {
      ...NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_BINDING,
    },
  },
  additiveSuccessor: {
    relation:
      "additive_successor_without_mutating_seed_interchange_primary_numerics_or_initializer_bridge",
    supersedesOnly:
      "v2_initializer_evaluator_input_and_finite_operation_semantics",
    upstreamInitializerMapPreserved: Object.freeze({
      varphiInit: "varphi_init(x)=u_star(x)",
      F0Init: "F0_init(x)=V_star(x)",
      F1Init: "F1_init(x)=-V_star(x)",
      wInit: "w_init=sqrt(1+2*nu_star)",
    }),
    upstreamFivePayloadInventoryMutated: false,
    supplementalPayloadBelongsOnlyToThisSuccessor: true,
    sourceDescriptorOrInterchangeSchemaMutated: false,
    sourceProofOrPrimaryNumericsReinterpreted: false,
    sourceFivePayloadsAloneSufficientForExactTailC1Lift: false,
    roundedCoreCoefficientsCannotRecoverPrimaryProjectedNodalBits: true,
    roundedCoreCoefficientsCannotInferExactPrimaryJoinBarrierBits: true,
    primaryProjectedNodalCompositeRecoveredOrClaimed: false,
    coefficientSpaceInitializerIsANewNonAuthoritativeEvaluator: true,
    doesNotClearAnyBranchSolverPreexecutionReplayOrAcceptanceBlocker: true,
  },
  inputAbi: {
    existingPayloadCount: 5,
    successorPayloadCount: 6,
    existingPayloads: EXISTING_FIVE_PAYLOADS,
    supplementalJoinPayload:
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_SUPPLEMENTAL_JOIN_PAYLOAD,
    orderedPayloads:
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_PAYLOADS,
    exactTotalElementCount: 333,
    exactTotalSizeBytes: 2_664,
    byteAdmission:
      "exact_tuple_exact_path_order_exact_size_fresh_full_bytes_then_plain_SHA256_then_f64le_decode",
    numberAdmission:
      "reject_any_IEEE754_exponent_all_ones_or_negative_zero_bit_pattern_before_numeric_use",
    payloadHashDomain:
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_PAYLOAD_HASH_DOMAIN,
    payloadHashRecipe:
      "SHA256(domain_utf8||u64le(path_utf8_length)||path_utf8||u64le(sizeBytes)||rawSha256_32)",
    supplementalBindingRequirements: Object.freeze([
      "same_sourceInputBindingSha256_as_the_existing_five_payload_initializer_evidence",
      "same_ordered_five_rawSha256_values_as_the_existing_initializer_evidence",
      "exact_primaryNumericsPolicyBinding_from_this_contract",
      "exact_canonical_primary_receipt_bytes_whose_recomputed_plain_raw_SHA256_input_binding_and_five_payload_bindings_match",
      "exact_four_get_d_RNDN_join_barrier_values_in_U_U1_V_V1_order",
      "domain_separated_trace_receipt_and_six_payload_instance_hashes_recomputed_before_decode",
    ] as const),
    supplementalJoinBarrierTraceReceiptSchema: {
      artifactId:
        NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_TRACE_RECEIPT_ARTIFACT_ID,
      contractVersion:
        NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_TRACE_RECEIPT_CONTRACT_VERSION,
      exactKeyOrder: Object.freeze([
        "artifactId",
        "attemptOrdinal",
        "authorityFalse",
        "barrierTrace",
        "contractVersion",
        "evaluatorPolicySha256",
        "initializerBridgeInstanceSha256",
        "orderedFiveSourcePayloadRawSha256",
        "primaryNumericsPolicySha256",
        "sourceInputBindingSha256",
        "sourcePrimaryReceiptCanonicalWire",
        "sourcePrimaryReceiptRawSha256",
        "sourcePrimaryReceiptSchemaVersion",
        "sourceProofSummaryRawSha256",
        "targetCandidateId",
      ] as const),
      exactBarrierTraceKeyOrder: Object.freeze([
        "captureBoundary",
        "elementOrder",
        "f64LeWordHex",
        "rawSha256",
        "sourceOperation",
        "traceBindingSha256",
      ] as const),
      barrierTrace: {
        captureBoundary:
          NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_BARRIER_CAPTURE_BOUNDARY,
        elementOrder:
          NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_SUPPLEMENTAL_JOIN_PAYLOAD.elementOrder,
        sourceOperation:
          NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_BARRIER_SOURCE_OPERATION,
        f64LeWordHex:
          "exact_four_16_lowercase_hex_octet_strings_in_U_U1_V_V1_file_order_each_decoding_to_finite_binary64_and_not_negative_zero",
        rawSha256:
          "plain_SHA256_of_the_exact_concatenated_32_barrier_bytes_and_equal_to_payload_5_rawSha256",
      },
      sourcePrimaryReceiptRequirements: Object.freeze([
        "wire_is_prebounded_exact_canonical_JSON_before_any_semantic_traversal",
        "plain_SHA256_of_wire_equals_sourcePrimaryReceiptRawSha256",
        "schema_candidate_input_and_all_five_ordered_payload_path_size_rawSha256_fields_match_this_trace_receipt",
        "receipt_authorityFalse_is_literal_true",
      ] as const),
      traceHashDomain:
        NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_TRACE_HASH_DOMAIN,
      traceHashRecipe:
        "SHA256(domain_utf8||u64le(exact_canonical_trace_preimage_utf8_length)||exact_canonical_trace_preimage_utf8),_where_the_preimage_is_the_exact_receipt_with_barrierTrace.traceBindingSha256_omitted_and_therefore_binds_attempt_target_evaluator_policy_primary_policy_initializer_bridge_input_primary_receipt_exact_wire_and_raw_hash_proof_hash_five_source_raw_hashes_capture_boundary_source_operation_U_U1_V_V1_words_and_barrier_raw_hash",
      receiptRawHashDomain:
        NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_TRACE_RECEIPT_RAW_HASH_DOMAIN,
      receiptRawHashRecipe:
        "SHA256(domain_utf8||u64le(exact_canonical_complete_receipt_utf8_length)||exact_canonical_complete_receipt_utf8)",
      selfTraceHashFieldExcludedFromTraceHashInputs: true,
      currentReceipt: null,
    },
    successorInstanceBindingSchema: {
      artifactId:
        NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_INSTANCE_ARTIFACT_ID,
      contractVersion:
        NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_INSTANCE_CONTRACT_VERSION,
      exactKeyOrder: Object.freeze([
        "artifactId",
        "attemptOrdinal",
        "authorityFalse",
        "contractVersion",
        "evaluatorPolicySha256",
        "initializerBridgeInstanceSha256",
        "instanceBindingSha256",
        "orderedPayloadBindings",
        "primaryNumericsPolicySha256",
        "sourceInputBindingSha256",
        "sourcePrimaryReceiptRawSha256",
        "sourceProofSummaryRawSha256",
        "supplementalJoinBarrierTraceReceipt",
        "supplementalJoinBarrierTraceReceiptRawSha256",
        "targetCandidateId",
      ] as const),
      exactPayloadBindingKeyOrder: Object.freeze([
        "ordinal",
        "path",
        "rawSha256",
        "sizeBytes",
      ] as const),
      fieldTypes: {
        attemptOrdinal: "literal_safe_integer_1",
        authorityFalse: "literal_true",
        evaluatorPolicySha256: "exact_this_policy_SHA256",
        initializerBridgeInstanceSha256:
          "recomputed_nonzero_lowercase_SHA256_of_the_valid_existing_five_payload_initializer_binding",
        orderedPayloadBindings:
          "exact_six_element_tuple_in_this_policy_order_with_nonzero_lowercase_rawSha256",
        primaryNumericsPolicySha256:
          "exact_primary_numerics_policy_SHA256_from_this_contract",
        sourceInputBindingSha256:
          "same_nonzero_lowercase_sha256_as_the_initializer_bridge_instance",
        sourcePrimaryReceiptRawSha256:
          "same_recomputed_primary_receipt_plain_raw_SHA256_as_the_nested_trace_receipt",
        sourceProofSummaryRawSha256:
          "same_nonzero_lowercase_sha256_as_the_initializer_bridge_instance",
        supplementalJoinBarrierTraceReceipt:
          "exact_valid_nested_trace_receipt_whose_barrier_raw_SHA256_equals_ordered_payload_5_rawSha256",
        supplementalJoinBarrierTraceReceiptRawSha256:
          "recomputed_domain_separated_SHA256_of_the_exact_canonical_nested_trace_receipt",
        targetCandidateId:
          "literal_distinct_v2_target_candidate_id_from_this_policy",
      },
      hashDomain:
        NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_BINDING_HASH_DOMAIN,
      hashRecipe:
        "SHA256(domain_utf8||u64le(exact_canonical_instance_preimage_utf8_length)||exact_canonical_instance_preimage_utf8),_where_the_preimage_is_the_exact_instance_with_instanceBindingSha256_omitted_and_therefore_binds_the_complete_trace_receipt_and_its_raw_hash_plus_all_six_literal_ordered_payload_bindings",
      crossChecks: Object.freeze([
        "recompute_initializerBridgeInstanceSha256_from_source_input_proof_and_ordered_payloads_0_through_4",
        "parse_prebounded_canonical_primary_receipt_wire_and_require_its_candidate_input_and_ordered_five_payload_bindings_to_match",
        "recompute_plain_primary_receipt_raw_SHA256_trace_binding_SHA256_and_domain_separated_trace_receipt_raw_SHA256",
        "require_exact_primary_and_evaluator_policy_SHA256_values_in_both_instance_and_trace_receipt",
        "require_trace_receipt_run_input_proof_bridge_primary_receipt_target_and_five_source_hashes_to_equal_the_instance",
        "require_trace_barrier_raw_SHA256_to_equal_ordered_payload_5_rawSha256",
        "recompute_instanceBindingSha256_only_after_every_prior_cross_check",
      ] as const),
      selfHashFieldExcludedFromHashInputs: true,
      currentInstance: null,
    },
    missingSupplementalPayloadFailureCode:
      "supplemental_join_barrier_payload_unbound",
    malformedOrMismatchedPayloadFailureCode:
      "initializer_evaluator_payload_invalid",
  },
  scalarValidationGraph: {
    decodedOrder: EXISTING_FIVE_PAYLOADS[0].elementOrder,
    context: "the_exact_MPFR256_context_below",
    operationOrder: Object.freeze([
      "set_d(nu0Mp,nu0_64);set_d(VcMp,Vc_64);set_d(CMp,C_64)",
      "set_si(minusTwo,-2);mul(minusTwoNu,minusTwo,nu0Mp);sqrt(kappaMp,minusTwoNu)",
      "div(COverKappa,CMp,kappaMp);set_ui(one,1);sub(sigmaMp,COverKappa,one)",
      "set_ui(four,4);const_pi(piMp);mul(fourPi,four,piMp);mul(N0Mp,fourPi,CMp)",
      "set_ui(thirtyTwo,32);div(lambdaMp,one,thirtyTwo);mul(lambdaSquaredMp,lambdaMp,lambdaMp);mul(nuStarMp,lambdaSquaredMp,nu0Mp)",
      "set_ui(two,2);mul(twoNuStar,two,nuStarMp);add(wSquared,one,twoNuStar);sqrt(wMp,wSquared)",
      "get_d_RNDN_and_require_bit_identity_for_N0_kappa_sigma_lambda_nu_star_wSeed_in_that_order",
    ] as const),
    exactDomains: Object.freeze([
      "nu0_is_finite_and_strictly_negative",
      "C_is_finite_and_strictly_positive",
      "kappa_is_finite_and_strictly_positive",
      "lambda_bits_equal_exact_2^-5",
      "nu_star_is_strictly_between_-1/2_and_0",
      "wSeed_is_strictly_between_0_and_1",
      "Vc_and_every_other_scalar_are_finite_and_not_negative_zero",
    ] as const),
    producerScalarAcceptedWithoutRecomputation: false,
    wInitSource:
      "recomputed_wMp_get_d_RNDN_after_exact_bit_equality_to_payload_wSeed",
  },
  coordinateAbi: {
    coordinate: "rho=x/(1+x)",
    inputElementType: "IEEE754_binary64_little_endian",
    inputTupleLengthMinimum: 3,
    inputTupleLengthMaximum: 512,
    exactOrder:
      "strictly_increasing_rho_with_first_exact_positive_zero_and_last_exact_positive_one",
    interiorDomain: "0<rho64<1_finite_and_not_negative_zero",
    nodeCountSelectedByThisPolicy: false,
    gridGenerationOrDifferentiationAuthority: false,
    perFiniteNodeGraph: Object.freeze([
      "set_d(rhoMp,rho64);set_ui(one,1);sub(oneMinusRho,one,rhoMp);div(xTargetMp,rhoMp,oneMinusRho)",
      "set_ui(thirtyTwo,32);div(lambdaMp,one,thirtyTwo);mul(xBaseMp,lambdaMp,xTargetMp)",
    ] as const),
    infinityNodeGraph:
      "when_rho_bits_equal_positive_one_do_not_subtract_divide_or_evaluate_the_composite_and_materialize_positive_zero_for_varphi_F0_F1",
  },
  mpfr256Context: {
    precisionBits: 256,
    roundingMode: "MPFR_RNDN_round_to_nearest_ties_to_even",
    emin: -1_073_741_823,
    emax: 1_073_741_823,
    subnormalize: false,
    trapsEnabled: false,
    allowComplex: false,
    rationalDivision: false,
    contextIsolatedFromAmbientAndRestoredExactly: true,
    everyLiteralIntroducedBySetUiOrSetSi: true,
    everyBinary64OperandIntroducedBySetD: true,
    fusedOperationsOrReassociationAllowed: false,
    precisionEscalationAllowed: false,
    invalidDivzeroOverflowUnderflowOrErangeDisposition:
      "fail_this_v2_candidate_without_retry_or_retune",
  },
  coefficientCoreEvaluator: {
    domain: "0<=xBase<32",
    polynomialConvention:
      "q(rhoBase)=sum_n=0^127_a[n]*T_n(2*rhoBase-1)_with_no_implicit_endpoint_halves",
    coordinateGraph: Object.freeze([
      "set_ui(one,1);add(onePlusX,one,xBaseMp);div(rhoBaseMp,xBaseMp,onePlusX)",
      "set_ui(two,2);mul(twoRho,two,rhoBaseMp);sub(t,twoRho,one)",
    ] as const),
    fieldOrder: Object.freeze(["u", "V"] as const),
    recurrenceAndSumGraph: Object.freeze([
      "set_ui(T0,1);set_d(a0,a64[0]);mul(term0,a0,T0);set(sum,term0)",
      "copy(T1,t);for_n_increasing_1_through_127_set_d(an,a64[n]);mul(term,an,Tn);add(nextSum,sum,term);copy_sum",
      "after_each_n_less_than_127_set_ui(two,2);mul(twoT,two,t);mul(product,twoT,Tn);sub(Tnext,product,Tprevious);shift_T_handles",
      "return_sum_without_get_d",
    ] as const),
    exactJoinBranch:
      "when_xBase_compares_equal_to_exact_32_return_set_d_U_and_set_d_V_from_the_supplemental_join_payload",
    projectedL2NodalBitsUsed: false,
    inverseDctUsed: false,
    byteIdentityWithPrimaryBarycentricCoreClaimed: false,
    leftDerivativeOrCoreTailC1ProofClaimed: false,
  },
  tailEvaluator: {
    domain: "xBase>32",
    correctionCoefficientMeaning:
      "tail_H_and_tail_Q_are_the_32_correction_coefficients_not_coefficients_of_the_C1_lifts",
    joinBarrierSource:
      "set_d_U_U1_V_V1_from_the_exact_supplemental_payload_only_never_from_rounded_core_coefficients",
    liftGraph: Object.freeze([
      "set_ui(R,32);set_d(nu0,nu0_64);set_si(minusTwo,-2);mul(minusTwoNu,minusTwo,nu0);sqrt(kappa,minusTwoNu);set_d(C,C64);div(COverKappa,C,kappa);set_ui(one,1);sub(sigma,COverKappa,one);set_d(H1,U64)",
      "mul(kappaR,kappa,R);neg(negativeKappaR,kappaR);add(liftCoefficient,negativeKappaR,sigma);mul(liftProduct,liftCoefficient,H1);set_d(U1,U1_64);mul(RU1,R,U1);sub(Hy1,liftProduct,RU1)",
      "set_d(VJoin,V64);div(COverR,C,R);add(Q1,VJoin,COverR);set_d(V1,V1_64)",
      "set_si(minusTwo,-2);mul(minusTwoKappaR,minusTwo,kappaR);set_ui(two,2);mul(twoSigma,two,sigma);add(qLiftCoefficient,minusTwoKappaR,twoSigma);mul(qLiftProduct,qLiftCoefficient,Q1);mul(RV1,R,V1);add(qLiftPlusC,qLiftProduct,COverR);sub(Qy1,qLiftPlusC,RV1)",
    ] as const),
    recurrenceAndCompositeGraph: Object.freeze([
      "div(y,R,xBaseMp);set_ui(two,2);mul(twoY,two,y);set_ui(one,1);sub(t,twoY,one)",
      "set_ui(T0,1);copy(T1,t);generate_T2_through_T31_by_Tnext=2*t*Tn-Tprevious_in_increasing_n_order",
      "set_ui(Ah,0);set_ui(Aq,0);for_n_increasing_0_through_31_set_d(hn,h64[n]);mul(hTerm,hn,Tn);add(nextAh,Ah,hTerm);copy_Ah;set_d(qn,q64[n]);mul(qTerm,qn,Tn);add(nextAq,Aq,qTerm);copy_Aq",
      "sub(yMinusOne,y,one);sub(oneMinusY,one,y);mul(oneMinusYSquared,oneMinusY,oneMinusY)",
      "mul(HLinear,Hy1,yMinusOne);add(HBase,H1,HLinear);mul(HCorrection,oneMinusYSquared,Ah);add(H,HBase,HCorrection)",
      "mul(QLinear,Qy1,yMinusOne);add(QBase,Q1,QLinear);mul(QCorrection,oneMinusYSquared,Aq);add(Q,QBase,QCorrection)",
      "sub(xMinusR,xBaseMp,R);mul(kappaDistance,kappa,xMinusR);neg(decayTerm,kappaDistance);div(xOverR,xBaseMp,R);log(logXOverR,xOverR);mul(logTerm,sigma,logXOverR);add(exponent,decayTerm,logTerm);exp(B,exponent);mul(E,B,B)",
      "mul(baseU,B,H);div(COverX,C,xBaseMp);neg(coulomb,COverX);mul(EQ,E,Q);add(baseV,coulomb,EQ)",
    ] as const),
    supplementalPayloadEstablishesSourceProofOrC1Acceptance: false,
    tailRemainderOrTrueSolutionBallInherited: false,
  },
  targetInitializerMaterialization: {
    scalingGraph: Object.freeze([
      "mul(lambdaSquared,lambdaMp,lambdaMp)",
      "mul(varphiMp,lambdaSquared,baseU);mul(F0Mp,lambdaSquared,baseV);neg(F1Mp,F0Mp)",
      "if_any_output_compares_zero_set_ui_that_output_positive_zero",
      "get_d_RNDN_in_order_varphi_then_F0_then_F1_then_require_finite_and_not_negative_zero",
    ] as const),
    outputFieldOrder: Object.freeze(["F0", "F1", "varphi", "w"] as const),
    outputSemantics: Object.freeze({
      varphi: "varphi_init(xTarget)=u_star(xTarget)",
      F0: "F0_init(xTarget)=V_star(xTarget)",
      F1: "F1_init(xTarget)=-V_star(xTarget)",
      w: "w_init=sqrt(1+2*nu_star)",
    }),
    terminalBinary64Barriers:
      "one_get_d_RNDN_per_field_per_node_and_one_w_get_d_RNDN_after_scalar_validation",
    targetOriginAmplitudeProofOrAcceptanceClaimed: false,
    relativisticBvpMustResolveFrequencyAgain: true,
    outputIsOnlyANonAuthoritativeInitialGuess: true,
  },
  implementationIsolation: {
    producerSourceImportsInvocationsOrLinksAllowed: false,
    generatedProducerEvaluatorCodeAllowed: false,
    producerProjectedNodesOrDerivedJoinMetricsAccepted: false,
    onlyExactPayloadBytesAndPolicyBindingsMayCrossBoundary: true,
    futureImplementationSourceManifestRequired: true,
    futureToolchainExecutableRuntimeManifestRequired: true,
    futureScientificPresealRequired: true,
  },
  failurePolicy: {
    firstFailureOrder: Object.freeze([
      "upstream_policy_binding_mismatch",
      "payload_inventory_path_order_or_size_mismatch",
      "payload_hash_mismatch",
      "payload_nonfinite",
      "payload_negative_zero",
      "scalar_domain_or_recomputation_mismatch",
      "supplemental_join_barrier_payload_unbound_or_invalid",
      "coordinate_inventory_or_domain_invalid",
      "mpfr_context_or_operation_failure",
      "terminal_output_nonfinite_or_negative_zero",
    ] as const),
    missingRequiredInstanceDisposition: "blocked_without_candidate_result",
    observedInvalidOrMismatchedEvidenceDisposition:
      "fail_this_v2_candidate_without_retry_or_retune",
    earlierObservedFailThenLaterMissingEvidenceDisposition:
      "fail_this_v2_candidate_without_retry_or_retune",
    laterBlockMayOverwriteEarlierFail: false,
    retryAllowed: false,
    retuneAllowed: false,
    alternateCoefficientGraphJoinInferenceOrInitializerAllowed: false,
    observedOutputMayChangeThisPolicy: false,
  },
  completionBoundary: {
    evaluatorPolicyComplete: true,
    supplementalJoinPayloadInstancePresent: false,
    supplementalJoinBarrierTraceReceiptPresent: false,
    implementationBound: false,
    runtimeBound: false,
    scientificPresealBound: false,
    gridInstanceBound: false,
    initializerInstancePresent: false,
    targetCandidateExecutionAuthorized: false,
    targetCandidateExecuted: false,
    replayPerformed: false,
    independentAgreementEstablished: false,
  },
  instances: {
    supplementalJoinPayload: null,
    supplementalJoinBarrierTraceReceipt: null,
    sourceManifest: null,
    toolchainManifest: null,
    executable: null,
    runtimeManifest: null,
    scientificPreseal: null,
    selectedGrid: null,
    initializerBinding: null,
    initializerOutput: null,
    executionReceipt: null,
    replayReceipt: null,
    independentAgreementReceipt: null,
  },
  activeBlockers: NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_BLOCKERS,
  authorityLocks:
    NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_AUTHORITY_LOCKS,
} as const;

const deepFreeze = <T>(value: T, seen = new Set<object>()): T => {
  if (value == null || typeof value !== "object" || seen.has(value as object))
    return value;
  seen.add(value as object);
  for (const key of Object.keys(value as object)) {
    const descriptor = Object.getOwnPropertyDescriptor(value as object, key);
    if (descriptor != null && "value" in descriptor)
      deepFreeze(descriptor.value, seen);
  }
  return Object.freeze(value);
};

export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR =
  deepFreeze(CONTRACT);
export type Nhm2SphericalBosonStarV2InitializerEvaluatorV1 =
  typeof NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR;

const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value))
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};

export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_CANONICAL_JSON =
  canonicalJson(NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR);
export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_SHA256 =
  createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_CANONICAL_JSON,
    "utf8",
  );

export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_EXPECTED_SHA256 =
  "2253cea43e7b0abc99aaebd19ced18994eba4605b65fe674febb03d9945cdbc5" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_EXPECTED_CANONICAL_SIZE_BYTES =
  24_711 as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_BINDING =
  Object.freeze({
    artifactId: NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_CONTRACT_VERSION,
    candidateId:
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR.candidateIdentity
        .targetCandidateId,
    sha256Domain:
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_SHA256_DOMAIN,
    sha256: NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_SHA256,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_CANONICAL_SIZE_BYTES,
    mediaType: "application/json" as const,
  });

export type Nhm2SphericalBosonStarV2InitializerEvaluatorPayloadBindingV1 =
  Readonly<{
    ordinal: number;
    path: string;
    rawSha256: string;
    sizeBytes: number;
  }>;

export type Nhm2SphericalBosonStarV2InitializerEvaluatorTraceReceiptV1 =
  Readonly<{
    artifactId: typeof NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_TRACE_RECEIPT_ARTIFACT_ID;
    attemptOrdinal: 1;
    authorityFalse: true;
    barrierTrace: Readonly<{
      captureBoundary: typeof NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_BARRIER_CAPTURE_BOUNDARY;
      elementOrder: readonly ["U", "U1", "V", "V1"];
      f64LeWordHex: readonly [string, string, string, string];
      rawSha256: string;
      sourceOperation: typeof NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_BARRIER_SOURCE_OPERATION;
      traceBindingSha256: string;
    }>;
    contractVersion: typeof NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_TRACE_RECEIPT_CONTRACT_VERSION;
    evaluatorPolicySha256: string;
    initializerBridgeInstanceSha256: string;
    orderedFiveSourcePayloadRawSha256: readonly [
      string,
      string,
      string,
      string,
      string,
    ];
    primaryNumericsPolicySha256: string;
    sourceInputBindingSha256: string;
    sourcePrimaryReceiptCanonicalWire: string;
    sourcePrimaryReceiptRawSha256: string;
    sourcePrimaryReceiptSchemaVersion: typeof NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_PRIMARY_RECEIPT_SCHEMA_VERSION;
    sourceProofSummaryRawSha256: string;
    targetCandidateId: string;
  }>;

export type Nhm2SphericalBosonStarV2InitializerEvaluatorInstanceV1 = Readonly<{
  artifactId: typeof NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_INSTANCE_ARTIFACT_ID;
  attemptOrdinal: 1;
  authorityFalse: true;
  contractVersion: typeof NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_INSTANCE_CONTRACT_VERSION;
  evaluatorPolicySha256: string;
  initializerBridgeInstanceSha256: string;
  instanceBindingSha256: string;
  orderedPayloadBindings: readonly Nhm2SphericalBosonStarV2InitializerEvaluatorPayloadBindingV1[];
  primaryNumericsPolicySha256: string;
  sourceInputBindingSha256: string;
  sourcePrimaryReceiptRawSha256: string;
  sourceProofSummaryRawSha256: string;
  supplementalJoinBarrierTraceReceipt: Nhm2SphericalBosonStarV2InitializerEvaluatorTraceReceiptV1;
  supplementalJoinBarrierTraceReceiptRawSha256: string;
  targetCandidateId: string;
}>;

type CanonicalWireResult =
  | Readonly<{ ok: true; value: unknown; wire: string }>
  | Readonly<{ ok: false; violation: string }>;
type ParsedJsonBudget = { nodes: number; utf8Bytes: number };
type ParsedJsonStackEntry = Readonly<{
  depth: number;
  pointer: string;
  value: unknown;
}>;

const FORBIDDEN_KEYS = new Set([
  "__proto__",
  "prototype",
  "constructor",
  "toString",
  "valueOf",
  "hasOwnProperty",
]);

const parsedJsonViolation = (root: unknown): string | null => {
  const limits =
    NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_VALIDATOR_LIMITS;
  const budget: ParsedJsonBudget = { nodes: 0, utf8Bytes: 0 };
  const stack: ParsedJsonStackEntry[] = [
    { depth: 0, pointer: "", value: root },
  ];
  while (stack.length > 0) {
    const current = stack.pop()!;
    const pointer = current.pointer || "/";
    if (current.depth > limits.maximumDepth)
      return `canonical_wire_depth_limit:${pointer}`;
    budget.nodes += 1;
    if (budget.nodes > limits.maximumNodes)
      return `canonical_wire_node_limit:${pointer}`;
    const value = current.value;
    if (value === null || typeof value === "boolean") continue;
    if (typeof value === "number") {
      if (!Number.isFinite(value) || Object.is(value, -0))
        return `canonical_wire_invalid_number:${pointer}`;
      continue;
    }
    if (typeof value === "string") {
      if (value.includes("\0") || /[\ud800-\udfff]/u.test(value))
        return `canonical_wire_invalid_string:${pointer}`;
      const size = Buffer.byteLength(value, "utf8");
      if (size > limits.maximumStringUtf8Bytes)
        return `canonical_wire_string_byte_limit:${pointer}`;
      budget.utf8Bytes += size;
      if (budget.utf8Bytes > limits.maximumAggregateUtf8Bytes)
        return `canonical_wire_aggregate_utf8_byte_limit:${pointer}`;
      continue;
    }
    if (typeof value !== "object")
      return `canonical_wire_non_json_value:${pointer}`;
    if (Array.isArray(value)) {
      if (value.length > limits.maximumArrayLength)
        return `canonical_wire_array_length_limit:${pointer}`;
      for (let index = value.length - 1; index >= 0; index -= 1) {
        stack.push({
          depth: current.depth + 1,
          pointer: `${current.pointer}/${index}`,
          value: value[index],
        });
      }
      continue;
    }
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record);
    if (keys.length > limits.maximumObjectPropertyCount)
      return `canonical_wire_object_property_limit:${pointer}`;
    for (let index = keys.length - 1; index >= 0; index -= 1) {
      const key = keys[index]!;
      const keySize = Buffer.byteLength(key, "utf8");
      budget.utf8Bytes += keySize;
      if (
        keySize > limits.maximumPropertyKeyUtf8Bytes ||
        budget.utf8Bytes > limits.maximumAggregateUtf8Bytes ||
        FORBIDDEN_KEYS.has(key)
      )
        return `canonical_wire_object_key:${current.pointer}/${key}`;
      stack.push({
        depth: current.depth + 1,
        pointer: `${current.pointer}/${key}`,
        value: record[key],
      });
    }
  }
  return null;
};

const parseBoundedCanonicalWire = (
  value: unknown,
  label: string,
): CanonicalWireResult => {
  const limits =
    NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_VALIDATOR_LIMITS;
  if (typeof value !== "string")
    return { ok: false, violation: `${label}_canonical_wire_string_required` };
  if (value.length > limits.maximumCanonicalWireCodeUnits)
    return {
      ok: false,
      violation: `${label}_canonical_wire_code_unit_limit`,
    };
  const utf8Bytes = Buffer.byteLength(value, "utf8");
  if (utf8Bytes > limits.maximumCanonicalWireUtf8Bytes)
    return { ok: false, violation: `${label}_canonical_wire_byte_limit` };
  let parsed: unknown;
  try {
    parsed = JSON.parse(value) as unknown;
  } catch {
    return { ok: false, violation: `${label}_canonical_wire_parse_invalid` };
  }
  const violation = parsedJsonViolation(parsed);
  if (violation != null)
    return { ok: false, violation: `${label}_${violation}` };
  if (canonicalJson(parsed) !== value)
    return { ok: false, violation: `${label}_canonical_wire_noncanonical` };
  return { ok: true, value: parsed, wire: value };
};

const exactKeys = (
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean => {
  const keys = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return (
    keys.length === sortedExpected.length &&
    keys.every((key, index) => key === sortedExpected[index])
  );
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const NONZERO_SHA256 = /^(?!0{64}$)[a-f0-9]{64}$/;
const F64LE_WORD_HEX = /^[a-f0-9]{16}$/;
const nonzeroSha256 = (value: unknown): value is string =>
  typeof value === "string" && NONZERO_SHA256.test(value);

const u64le = (value: number): Buffer => {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new TypeError("initializer_evaluator_u64_invalid");
  const bytes = Buffer.alloc(8);
  bytes.writeBigUInt64LE(BigInt(value));
  return bytes;
};

const domainSeparatedCanonicalWireSha256 = (
  domain: string,
  canonicalWire: string,
): string => {
  const wireBytes = Buffer.from(canonicalWire, "utf8");
  return createHash("sha256")
    .update(domain, "utf8")
    .update(u64le(wireBytes.length))
    .update(wireBytes)
    .digest("hex");
};

const requireCanonicalHashWire = (
  value: unknown,
  label: string,
  domain: string,
): string => {
  const parsed = parseBoundedCanonicalWire(value, label);
  if (!parsed.ok) throw new TypeError(parsed.violation);
  return domainSeparatedCanonicalWireSha256(domain, parsed.wire);
};

export const computeNhm2SphericalBosonStarV2InitializerEvaluatorBarrierRawSha256 =
  (
    UWordHexF64Le: string,
    U1WordHexF64Le: string,
    VWordHexF64Le: string,
    V1WordHexF64Le: string,
  ): string => {
    const words = [
      UWordHexF64Le,
      U1WordHexF64Le,
      VWordHexF64Le,
      V1WordHexF64Le,
    ];
    const hash = createHash("sha256");
    words.forEach((word, index) => {
      if (typeof word !== "string" || !F64LE_WORD_HEX.test(word))
        throw new TypeError(
          `initializer_evaluator_barrier_word_hex_invalid:${index}`,
        );
      const bytes = Buffer.from(word, "hex");
      const decoded = bytes.readDoubleLE(0);
      if (!Number.isFinite(decoded) || Object.is(decoded, -0))
        throw new TypeError(
          `initializer_evaluator_barrier_word_invalid:${index}`,
        );
      hash.update(bytes);
    });
    return hash.digest("hex");
  };

export const computeNhm2SphericalBosonStarV2InitializerEvaluatorTraceBindingSha256 =
  (canonicalTracePreimageWire: unknown): string =>
    requireCanonicalHashWire(
      canonicalTracePreimageWire,
      "initializer_evaluator_trace_preimage",
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_TRACE_HASH_DOMAIN,
    );

export const computeNhm2SphericalBosonStarV2InitializerEvaluatorTraceReceiptRawSha256 =
  (canonicalTraceReceiptWire: unknown): string =>
    requireCanonicalHashWire(
      canonicalTraceReceiptWire,
      "initializer_evaluator_trace_receipt",
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_TRACE_RECEIPT_RAW_HASH_DOMAIN,
    );

export const computeNhm2SphericalBosonStarV2InitializerEvaluatorInstanceBindingSha256 =
  (canonicalInstancePreimageWire: unknown): string =>
    requireCanonicalHashWire(
      canonicalInstancePreimageWire,
      "initializer_evaluator_instance_preimage",
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_BINDING_HASH_DOMAIN,
    );

const plainCanonicalWireSha256 = (canonicalWire: string): string =>
  createHash("sha256").update(canonicalWire, "utf8").digest("hex");

const PRIMARY_PAYLOAD_SEMANTIC_ROLES = Object.freeze([
  "primary_scalar_operands",
  "primary_L2_scalar_Chebyshev_coefficients",
  "primary_L2_potential_Chebyshev_coefficients",
  "primary_tail_H_Chebyshev_coefficients",
  "primary_tail_Q_Chebyshev_coefficients",
] as const);

const primaryReceiptViolation = (
  canonicalWire: unknown,
  sourceInputBindingSha256: string,
  fiveSourceRawSha256: readonly unknown[],
): string | null => {
  const parsed = parseBoundedCanonicalWire(
    canonicalWire,
    "initializer_evaluator_primary_receipt",
  );
  if (!parsed.ok) return parsed.violation;
  const receipt = asRecord(parsed.value);
  if (
    receipt == null ||
    !exactKeys(receipt, [
      "authorityFalse",
      "candidateId",
      "descriptorBinding",
      "inputBindingSha256",
      "orderedPayloadBindings",
      "publication",
      "schemaVersion",
    ])
  )
    return "initializer_evaluator_primary_receipt_schema_invalid";
  if (
    receipt.authorityFalse !== true ||
    receipt.candidateId !==
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING.candidateId ||
    receipt.schemaVersion !==
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_PRIMARY_RECEIPT_SCHEMA_VERSION ||
    receipt.inputBindingSha256 !== sourceInputBindingSha256
  )
    return "initializer_evaluator_primary_receipt_binding_invalid";
  const descriptor = asRecord(receipt.descriptorBinding);
  if (
    descriptor == null ||
    !exactKeys(descriptor, ["mediaType", "path", "sha256", "sizeBytes"]) ||
    descriptor.path !== "descriptor.json" ||
    descriptor.mediaType !== "application/json" ||
    !nonzeroSha256(descriptor.sha256) ||
    !Number.isSafeInteger(descriptor.sizeBytes) ||
    Number(descriptor.sizeBytes) <= 0
  )
    return "initializer_evaluator_primary_receipt_descriptor_invalid";
  const publication = asRecord(receipt.publication);
  if (
    publication == null ||
    !exactKeys(publication, [
      "finalRoot",
      "parentDirectoryFsyncRequired",
      "publicationMethod",
      "publicationPreparedWallUtc",
      "tempRootNonceSha256",
    ]) ||
    typeof publication.finalRoot !== "string" ||
    publication.finalRoot.length === 0 ||
    publication.parentDirectoryFsyncRequired !== true ||
    publication.publicationMethod !==
      "renameat2_RENAME_NOREPLACE_then_parent_fsync" ||
    typeof publication.publicationPreparedWallUtc !== "string" ||
    publication.publicationPreparedWallUtc.length === 0 ||
    !nonzeroSha256(publication.tempRootNonceSha256)
  )
    return "initializer_evaluator_primary_receipt_publication_invalid";
  if (
    !Array.isArray(receipt.orderedPayloadBindings) ||
    receipt.orderedPayloadBindings.length !== 5 ||
    fiveSourceRawSha256.length !== 5
  )
    return "initializer_evaluator_primary_receipt_payload_inventory_invalid";
  for (let index = 0; index < 5; index += 1) {
    const payload = asRecord(receipt.orderedPayloadBindings[index]);
    const expected = EXISTING_FIVE_PAYLOADS[index]!;
    if (
      payload == null ||
      !exactKeys(payload, [
        "elementCount",
        "elementType",
        "path",
        "payloadSha256",
        "rawSha256",
        "semanticRole",
        "sizeBytes",
      ]) ||
      payload.elementCount !== expected.elementCount ||
      payload.elementType !== "IEEE754_binary64_little_endian" ||
      payload.path !== expected.path ||
      !nonzeroSha256(payload.payloadSha256) ||
      payload.rawSha256 !== fiveSourceRawSha256[index] ||
      payload.semanticRole !== PRIMARY_PAYLOAD_SEMANTIC_ROLES[index] ||
      payload.sizeBytes !== expected.sizeBytes
    )
      return `initializer_evaluator_primary_receipt_payload_invalid:${index}`;
  }
  return null;
};

const traceReceiptViolation = (value: unknown): string | null => {
  const receipt = asRecord(value);
  const schema =
    NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR.inputAbi
      .supplementalJoinBarrierTraceReceiptSchema;
  if (receipt == null || !exactKeys(receipt, schema.exactKeyOrder))
    return "initializer_evaluator_trace_receipt_schema_invalid";
  if (
    receipt.artifactId !== schema.artifactId ||
    receipt.attemptOrdinal !== 1 ||
    receipt.authorityFalse !== true ||
    receipt.contractVersion !== schema.contractVersion ||
    receipt.evaluatorPolicySha256 !==
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_SHA256 ||
    receipt.primaryNumericsPolicySha256 !==
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_BINDING.sha256 ||
    receipt.sourcePrimaryReceiptSchemaVersion !==
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_PRIMARY_RECEIPT_SCHEMA_VERSION ||
    receipt.targetCandidateId !==
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_BINDING.candidateId
  )
    return "initializer_evaluator_trace_receipt_literal_binding_invalid";
  if (
    !nonzeroSha256(receipt.initializerBridgeInstanceSha256) ||
    !nonzeroSha256(receipt.sourceInputBindingSha256) ||
    !nonzeroSha256(receipt.sourcePrimaryReceiptRawSha256) ||
    !nonzeroSha256(receipt.sourceProofSummaryRawSha256) ||
    typeof receipt.sourcePrimaryReceiptCanonicalWire !== "string" ||
    !Array.isArray(receipt.orderedFiveSourcePayloadRawSha256) ||
    receipt.orderedFiveSourcePayloadRawSha256.length !== 5 ||
    !receipt.orderedFiveSourcePayloadRawSha256.every(nonzeroSha256)
  )
    return "initializer_evaluator_trace_receipt_hash_binding_invalid";
  const fiveSourceRawSha256 =
    receipt.orderedFiveSourcePayloadRawSha256 as unknown[];
  const primaryViolation = primaryReceiptViolation(
    receipt.sourcePrimaryReceiptCanonicalWire,
    receipt.sourceInputBindingSha256,
    fiveSourceRawSha256,
  );
  if (primaryViolation != null) return primaryViolation;
  if (
    plainCanonicalWireSha256(receipt.sourcePrimaryReceiptCanonicalWire) !==
    receipt.sourcePrimaryReceiptRawSha256
  )
    return "initializer_evaluator_primary_receipt_raw_sha256_mismatch";
  const bridgePayloads = NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_PAYLOADS.map(
    (expected, index) => ({
      path: expected.path,
      rawSha256: String(fiveSourceRawSha256[index]),
      sizeBytes: expected.sizeBytes,
    }),
  );
  let expectedBridgeSha256: string;
  try {
    expectedBridgeSha256 =
      computeNhm2SphericalBosonStarV2InitializerBindingSha256(
        receipt.sourceInputBindingSha256,
        receipt.sourceProofSummaryRawSha256,
        bridgePayloads,
      );
  } catch {
    return "initializer_evaluator_initializer_bridge_binding_invalid";
  }
  if (receipt.initializerBridgeInstanceSha256 !== expectedBridgeSha256)
    return "initializer_evaluator_initializer_bridge_sha256_mismatch";
  const trace = asRecord(receipt.barrierTrace);
  if (
    trace == null ||
    !exactKeys(trace, schema.exactBarrierTraceKeyOrder) ||
    trace.captureBoundary !==
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_BARRIER_CAPTURE_BOUNDARY ||
    trace.sourceOperation !==
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_BARRIER_SOURCE_OPERATION ||
    !Array.isArray(trace.elementOrder) ||
    canonicalJson(trace.elementOrder) !== '["U","U1","V","V1"]' ||
    !Array.isArray(trace.f64LeWordHex) ||
    trace.f64LeWordHex.length !== 4 ||
    !trace.f64LeWordHex.every((word) => typeof word === "string") ||
    !nonzeroSha256(trace.rawSha256) ||
    !nonzeroSha256(trace.traceBindingSha256)
  )
    return "initializer_evaluator_barrier_trace_schema_invalid";
  let expectedBarrierRawSha256: string;
  try {
    expectedBarrierRawSha256 =
      computeNhm2SphericalBosonStarV2InitializerEvaluatorBarrierRawSha256(
        trace.f64LeWordHex[0],
        trace.f64LeWordHex[1],
        trace.f64LeWordHex[2],
        trace.f64LeWordHex[3],
      );
  } catch {
    return "initializer_evaluator_barrier_trace_word_invalid";
  }
  if (trace.rawSha256 !== expectedBarrierRawSha256)
    return "initializer_evaluator_barrier_trace_raw_sha256_mismatch";
  const tracePreimage = {
    ...receipt,
    barrierTrace: Object.fromEntries(
      Object.entries(trace).filter(([key]) => key !== "traceBindingSha256"),
    ),
  };
  const expectedTraceBindingSha256 = domainSeparatedCanonicalWireSha256(
    NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_TRACE_HASH_DOMAIN,
    canonicalJson(tracePreimage),
  );
  return trace.traceBindingSha256 === expectedTraceBindingSha256
    ? null
    : "initializer_evaluator_barrier_trace_binding_sha256_mismatch";
};

export const nhm2SphericalBosonStarV2InitializerEvaluatorTraceReceiptViolations =
  (value: unknown): string[] => {
    const parsed = parseBoundedCanonicalWire(
      value,
      "initializer_evaluator_trace_receipt",
    );
    if (!parsed.ok) return [parsed.violation];
    const violation = traceReceiptViolation(parsed.value);
    return violation == null ? [] : [violation];
  };

export const nhm2SphericalBosonStarV2InitializerEvaluatorInstanceViolations = (
  value: unknown,
): string[] => {
  const parsed = parseBoundedCanonicalWire(
    value,
    "initializer_evaluator_instance",
  );
  if (!parsed.ok) return [parsed.violation];
  const instance = asRecord(parsed.value);
  const schema =
    NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR.inputAbi
      .successorInstanceBindingSchema;
  if (instance == null || !exactKeys(instance, schema.exactKeyOrder))
    return ["initializer_evaluator_instance_schema_invalid"];
  if (
    instance.artifactId !== schema.artifactId ||
    instance.attemptOrdinal !== 1 ||
    instance.authorityFalse !== true ||
    instance.contractVersion !== schema.contractVersion ||
    instance.evaluatorPolicySha256 !==
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_SHA256 ||
    instance.primaryNumericsPolicySha256 !==
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_BINDING.sha256 ||
    instance.targetCandidateId !==
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_BINDING.candidateId ||
    !nonzeroSha256(instance.initializerBridgeInstanceSha256) ||
    !nonzeroSha256(instance.instanceBindingSha256) ||
    !nonzeroSha256(instance.sourceInputBindingSha256) ||
    !nonzeroSha256(instance.sourcePrimaryReceiptRawSha256) ||
    !nonzeroSha256(instance.sourceProofSummaryRawSha256) ||
    !nonzeroSha256(instance.supplementalJoinBarrierTraceReceiptRawSha256)
  )
    return ["initializer_evaluator_instance_literal_binding_invalid"];
  if (
    !Array.isArray(instance.orderedPayloadBindings) ||
    instance.orderedPayloadBindings.length !== 6
  )
    return ["initializer_evaluator_instance_payload_inventory_invalid"];
  for (let index = 0; index < 6; index += 1) {
    const payload = asRecord(instance.orderedPayloadBindings[index]);
    const expected =
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_PAYLOADS[index]!;
    if (
      payload == null ||
      !exactKeys(payload, schema.exactPayloadBindingKeyOrder) ||
      payload.ordinal !== index ||
      payload.path !== expected.path ||
      payload.sizeBytes !== expected.sizeBytes ||
      !nonzeroSha256(payload.rawSha256)
    )
      return [`initializer_evaluator_instance_payload_invalid:${index}`];
  }
  const traceReceipt = asRecord(instance.supplementalJoinBarrierTraceReceipt);
  const traceViolation = traceReceiptViolation(traceReceipt);
  if (traceViolation != null) return [traceViolation];
  const fiveRawSha256 = instance.orderedPayloadBindings
    .slice(0, 5)
    .map((entry) => String(asRecord(entry)!.rawSha256));
  const receiptFiveRawSha256 = traceReceipt!
    .orderedFiveSourcePayloadRawSha256 as unknown[];
  if (
    traceReceipt!.initializerBridgeInstanceSha256 !==
      instance.initializerBridgeInstanceSha256 ||
    traceReceipt!.sourceInputBindingSha256 !==
      instance.sourceInputBindingSha256 ||
    traceReceipt!.sourcePrimaryReceiptRawSha256 !==
      instance.sourcePrimaryReceiptRawSha256 ||
    traceReceipt!.sourceProofSummaryRawSha256 !==
      instance.sourceProofSummaryRawSha256 ||
    traceReceipt!.targetCandidateId !== instance.targetCandidateId ||
    canonicalJson(receiptFiveRawSha256) !== canonicalJson(fiveRawSha256)
  )
    return ["initializer_evaluator_instance_trace_receipt_mismatch"];
  const trace = asRecord(traceReceipt!.barrierTrace)!;
  const payload5 = asRecord(instance.orderedPayloadBindings[5])!;
  if (trace.rawSha256 !== payload5.rawSha256)
    return ["initializer_evaluator_instance_barrier_payload_sha256_mismatch"];
  const canonicalTraceReceiptWire = canonicalJson(traceReceipt);
  const expectedTraceReceiptRawSha256 = domainSeparatedCanonicalWireSha256(
    NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_TRACE_RECEIPT_RAW_HASH_DOMAIN,
    canonicalTraceReceiptWire,
  );
  if (
    instance.supplementalJoinBarrierTraceReceiptRawSha256 !==
    expectedTraceReceiptRawSha256
  )
    return ["initializer_evaluator_trace_receipt_raw_sha256_mismatch"];
  const instancePreimage = Object.fromEntries(
    Object.entries(instance).filter(([key]) => key !== "instanceBindingSha256"),
  );
  const expectedInstanceBindingSha256 = domainSeparatedCanonicalWireSha256(
    NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_BINDING_HASH_DOMAIN,
    canonicalJson(instancePreimage),
  );
  return instance.instanceBindingSha256 === expectedInstanceBindingSha256
    ? []
    : ["initializer_evaluator_instance_binding_sha256_mismatch"];
};

export const nhm2SphericalBosonStarV2InitializerEvaluatorViolations = (
  value: unknown,
): string[] => {
  const parsed = parseBoundedCanonicalWire(
    value,
    "spherical_v2_initializer_evaluator",
  );
  if (!parsed.ok) return [parsed.violation];
  return parsed.wire ===
    NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_CANONICAL_JSON
    ? []
    : ["spherical_v2_initializer_evaluator_semantic_drift"];
};

export const isNhm2SphericalBosonStarV2InitializerEvaluatorV1 = (
  value: unknown,
): value is string =>
  nhm2SphericalBosonStarV2InitializerEvaluatorViolations(value).length === 0;

export const cloneNhm2SphericalBosonStarV2InitializerEvaluator = () =>
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_CANONICAL_JSON;

const assertInvariants = (): void => {
  const contract = NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR;
  const payloads = contract.inputAbi.orderedPayloads;
  const blockers = contract.activeBlockers;
  if (
    contract.exactUpstreamBindings.semanticSeed.sha256 !==
      "b2a89c8065bd6865b26aa1c4365d0f48edbd40e9c4f43e0cfbaca49db29a6c2c" ||
    contract.exactUpstreamBindings.semanticSeed.canonicalSizeBytes !== 18_894 ||
    contract.exactUpstreamBindings.interchange.sha256 !==
      "827eb79c27137dd1649b35884c945c2d6809483acf25c7fd68d2a3ed80936f95" ||
    contract.exactUpstreamBindings.interchange.canonicalSizeBytes !== 67_853 ||
    contract.exactUpstreamBindings.primaryNumerics.sha256 !==
      "a4ee03e387f9e3e0a9d1f117f6671aa6ac0ca3f97508706c0f52e811d15372a4" ||
    contract.exactUpstreamBindings.primaryNumerics.canonicalSizeBytes !==
      80_055 ||
    contract.exactUpstreamBindings.initializerBridge.sha256 !==
      "c5c4c45755e0dc682694f8a107c31780d85d860b2a71be567a2cfe0d06300631" ||
    contract.exactUpstreamBindings.initializerBridge.canonicalSizeBytes !==
      7_715 ||
    String(contract.candidateIdentity.sourceCandidateId) ===
      String(contract.candidateIdentity.targetCandidateId) ||
    payloads.length !== 6 ||
    payloads.some((entry, index) => entry.ordinal !== index) ||
    NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_PAYLOADS.some(
      (entry, index) =>
        payloads[index]?.path !== entry.path ||
        payloads[index]?.sizeBytes !== entry.sizeBytes,
    ) ||
    payloads[5]?.path !== "initializer/core_L2_join_barrier.f64le" ||
    payloads[5]?.sizeBytes !== 32 ||
    contract.inputAbi.exactTotalElementCount !== 333 ||
    contract.inputAbi.exactTotalSizeBytes !== 2_664 ||
    contract.inputAbi.supplementalJoinBarrierTraceReceiptSchema
      .currentReceipt !== null ||
    contract.inputAbi.successorInstanceBindingSchema.currentInstance !== null ||
    blockers.length !== 5 ||
    blockers.some((entry, index) => entry.ordinal !== index) ||
    blockers[0]?.blockerId !== "supplemental_join_barrier_payload_unbound" ||
    contract.additiveSuccessor
      .sourceFivePayloadsAloneSufficientForExactTailC1Lift !== false ||
    contract.additiveSuccessor
      .primaryProjectedNodalCompositeRecoveredOrClaimed !== false ||
    contract.coefficientCoreEvaluator.projectedL2NodalBitsUsed !== false ||
    contract.coefficientCoreEvaluator.inverseDctUsed !== false ||
    contract.tailEvaluator.joinBarrierSource.includes(
      "rounded_core_coefficients",
    ) !== true ||
    Object.values(contract.instances).some((value) => value !== null) ||
    Object.values(contract.authorityLocks).some((value) => value !== false) ||
    contract.completionBoundary.evaluatorPolicyComplete !== true ||
    Object.entries(contract.completionBoundary).some(
      ([key, value]) => key !== "evaluatorPolicyComplete" && value !== false,
    ) ||
    contract.failurePolicy.retryAllowed !== false ||
    contract.failurePolicy.retuneAllowed !== false ||
    contract.failurePolicy.laterBlockMayOverwriteEarlierFail !== false ||
    NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_SHA256 !==
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_EXPECTED_SHA256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_CANONICAL_SIZE_BYTES !==
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_EVALUATOR_EXPECTED_CANONICAL_SIZE_BYTES
  ) {
    throw new Error("spherical_v2_initializer_evaluator_contract_invariant");
  }
};

assertInvariants();
