import { createHash } from "node:crypto";

import { NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_SHA256 } from "./nhm2-semiclassical-v2-science-derivation-authority.v1";
import { NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_BINDING } from "./nhm2-spherical-boson-star-branch-bvp.v1";
import { NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_BINDING } from "./nhm2-spherical-boson-star-coherent-candidate-plan.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_BINDING } from "./nhm2-spherical-boson-star-v2-branch-execution-policy.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
} from "./nhm2-spherical-boson-star-v2-candidate-freeze.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_BINDING } from "./nhm2-spherical-boson-star-v2-radial-primary-numerics.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BINDING } from "./nhm2-spherical-boson-star-v2-si-output-normalization.v1";

export const NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM_ARTIFACT_ID =
  "nhm2.semiclassical_v2.spherical_boson_star_metric_demand_program" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM_CONTRACT_VERSION =
  "nhm2_semiclassical_v2_spherical_boson_star_metric_demand_program/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM_PHASE =
  "preexecution_metric_demand_derivation_definition_without_instance_authority" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM_LIMITS =
  Object.freeze({
    maximumWireUtf16CodeUnits: 131_072,
    maximumWireUtf8Bytes: 262_144,
    maximumDepth: 24,
    maximumNodes: 8_192,
    maximumArrayLength: 1_024,
    maximumObjectPropertyCount: 256,
    maximumStringUtf8Bytes: 32_768,
    maximumAggregateUtf8Bytes: 262_144,
  } as const);

const REQUIRED_BINDINGS = Object.freeze({
  sourceCandidatePlan: Object.freeze({
    sha256: "9aecb482ee5e78c61b202966c44a25139262f139cb06654094e7e36956e4876d",
    canonicalSizeBytes: 93_214,
  }),
  v2CandidateFreeze: Object.freeze({
    sha256: "628092507b7dc1be76722f06a7b591efc59d1799bed0d4b7d1999d852d92f28f",
    canonicalSizeBytes: 55_997,
  }),
  branchBvp: Object.freeze({
    sha256: "ce00d2b6048d8c22e6dedd4526a8548373916525ef9adb75fcea48e67dc7e557",
    canonicalSizeBytes: 13_847,
  }),
  radialPrimaryNumerics: Object.freeze({
    sha256: "f88e31544dfeccdbb43a5b956172c4b6b4b84f22de3b25ced762282cb5f271bc",
    canonicalSizeBytes: 14_732,
  }),
  branchExecutionPolicy: Object.freeze({
    sha256: "55238947c0a21f71ff3b0b28d095733376527479214806790990aea4317b7cf8",
    canonicalSizeBytes: 21_266,
  }),
  siOutputNormalization: Object.freeze({
    sha256: "16224114ce7bc790d1e5ceeaf8f75e31e5c37412856c5bea8b99284301bf3c24",
    canonicalSizeBytes: 23_822,
  }),
  scienceDerivationDagSha256:
    "c0a656b833f380239bed1d3aac321b7a2361fa6b0bf2026355a0dcc4d0d32ce7",
} as const);

const AUTHORITY_LOCKS = Object.freeze({
  branchGeometryAccepted: false as const,
  metricDemandTensorMaterialized: false as const,
  metricDemandAbsoluteErrorBoundMaterialized: false as const,
  derivationReceiptMaterialized: false as const,
  intervalTraceServerReplayed: false as const,
  siScaleReceiptVerified: false as const,
  scientificCandidateManifestAuthority: false as const,
  scientificPresealAuthority: false as const,
  executionAuthority: false as const,
  replayAuthority: false as const,
  independentAgreement: false as const,
  semiclassicalStressNoiseLamp: false as const,
  semiclassicalConstraintAlgebraLamp: false as const,
  diagnosticPass: false as const,
  theoryGraphPromotion: false as const,
  physicalViability: false as const,
  propulsion: false as const,
  transport: false as const,
} as const);

const AXIS_NUMERATORS = Object.freeze([-3, -1, 1, 3] as const);
const SAMPLE_PROJECTION = Object.freeze(
  AXIS_NUMERATORS.flatMap((zNumerator, iz) =>
    AXIS_NUMERATORS.flatMap((yNumerator, iy) =>
      AXIS_NUMERATORS.map((xNumerator, ix) => {
        const radiusSquaredNumerator =
          xNumerator * xNumerator +
          yNumerator * yNumerator +
          zNumerator * zNumerator;
        return Object.freeze({
          ordinal: 16 * iz + 4 * iy + ix,
          coordinateOverEight: Object.freeze({
            xNumerator,
            yNumerator,
            zNumerator,
          }),
          radiusSquaredExact: `${radiusSquaredNumerator}/64`,
          radiusExact: `sqrt(${radiusSquaredNumerator})/8`,
          radiusGroup: `r2_${radiusSquaredNumerator}_over_64`,
          unitRadialVectorExact: Object.freeze({
            nx: `${xNumerator}/sqrt(${radiusSquaredNumerator})`,
            ny: `${yNumerator}/sqrt(${radiusSquaredNumerator})`,
            nz: `${zNumerator}/sqrt(${radiusSquaredNumerator})`,
          }),
        });
      }),
    ),
  ),
);

const RADIUS_GROUPS = Object.freeze(
  [3, 11, 19, 27].map((radiusSquaredNumerator, ordinal) =>
    Object.freeze({
      ordinal,
      radiusGroup: `r2_${radiusSquaredNumerator}_over_64`,
      radiusSquaredExact: `${radiusSquaredNumerator}/64`,
      radiusExact: `sqrt(${radiusSquaredNumerator})/8`,
      sampleOrdinals: Object.freeze(
        SAMPLE_PROJECTION.filter(
          (entry) =>
            entry.radiusSquaredExact === `${radiusSquaredNumerator}/64`,
        ).map((entry) => entry.ordinal),
      ),
    }),
  ),
);

const MPFR_PRIMITIVE_OPERATION_GRAPH = Object.freeze({
  graphId:
    "nhm2_spherical_boson_star_v2_metric_demand_mpfr256_primitive_ast/v1",
  totalTraceOrder: Object.freeze([
    "01_acquire_exclusive_MPFR_context_clear_flags_save_caller_emin_then_emax_require_caller_range_contains_minus_1000000_through_plus_1000000_then_set_emin_minus_1000000_then_emax_plus_1000000",
    "02_validate_the_canonical_wire_envelope_then_load_the_global_SI_scale_C_then_L_then_U",
    "03_for_each_radius_group_in_r2_3_r2_11_r2_19_r2_27_order_load_F1_then_F0_prime_then_F1_prime_then_F0_double_prime_then_F1_double_prime_each_as_C_f64_identity_then_L_then_U",
    "04_for_each_exact_member_sample_ordinal_of_that_radius_group_in_the_frozen_member_order_construct_sample_geometry_C_then_directed_L_U",
    "05_evaluate_scalar_C_in_e_rho_pr_pt_order_then_scalar_hulls_in_e_rho_pr_pt_order",
    "06_compute_projection_diff_C_then_diff_L_U_then_visit_components_00_01_02_03_11_12_13_22_23_33",
    "07_for_each_component_execute_each_numbered_projection_stage_C_then_L_U_then_the_SI_terminal_program_then_store_at_sample_ordinal_component_ordinal",
    "08_after_all_bytes_and_observations_exist_clear_MPFR_destinations_then_MPZ_values_in_reverse_creation_order_restore_saved_emax_then_saved_emin_require_success_finalize_the_receipt_then_release_the_exclusive_MPFR_context",
  ]),
  loopOrder: Object.freeze({
    radiusGroupOrder: Object.freeze([
      "r2_3_over_64",
      "r2_11_over_64",
      "r2_19_over_64",
      "r2_27_over_64",
    ]),
    exactSampleOrdinalsByRadiusGroup: Object.freeze(
      RADIUS_GROUPS.map((group) =>
        Object.freeze({
          radiusGroup: group.radiusGroup,
          sampleOrdinals: group.sampleOrdinals,
        }),
      ),
    ),
    memberRule:
      "visit_only_the_listed_members_of_the_current_radius_group_once_in_the_listed_order_never_all_64_members_per_group",
    componentOrder: Object.freeze([
      "00",
      "01",
      "02",
      "03",
      "11",
      "12",
      "13",
      "22",
      "23",
      "33",
    ]),
    storageIndex:
      "byte_offset=8*(10*sample_ordinal+component_ordinal)_independent_of_radius_group_visit_order",
  }),
  inputInterchange: Object.freeze({
    wireEnvelopeFieldsInValidationOrder: Object.freeze([
      "contractVersion",
      "radiusGroups",
      "siScale",
    ]),
    radiusGroupRecordFieldsInValidationOrder: Object.freeze([
      "radiusGroup",
      "quantities",
    ]),
    canonicalJsonWire: Object.freeze({
      contractVersion:
        "nhm2_semiclassical_v2_spherical_boson_star_metric_demand_mpfr256_input/v1",
      encoding: "UTF-8_without_BOM",
      whitespaceAllowedOutsideStrings: false,
      objectKeyOrder: "ascending_unsigned_UTF8_byte_order",
      stringEncoding:
        "all_schema_tokens_hex_and_decimal_strings_are_unescaped_ASCII_and_all_other_strings_use_shortest_required_JSON_escapes",
      numberEncoding:
        "precisionBits_is_the_only_JSON_number_in_an_endpoint_and_is_exactly_the_unquoted_token_256",
      duplicateObjectKeysAllowed: false,
      arraysPreserveDeclaredOrder: true,
      extraFieldsAllowed: false,
    }),
    wireCardinality: Object.freeze({
      radiusGroupCount: 4,
      quantityCountPerRadiusGroup: 5,
      siScaleRecordCount: 1,
      endpointCountPerGeometryQuantity: 3,
      endpointCountPerSiScaleRecord: 3,
    }),
    geometryQuantityRecordFields: Object.freeze([
      "quantityId",
      "centralF64WordHex",
      "centralMpfr256",
      "lowerMpfr256",
      "upperMpfr256",
    ]),
    quantityOrder: Object.freeze([
      "F1",
      "F0_prime",
      "F1_prime",
      "F0_double_prime",
      "F1_double_prime",
    ]),
    siScaleRecordFields: Object.freeze([
      "stressScaleNCentralMpfr256",
      "stressScaleK2LowerMpfr256",
      "stressScaleK2UpperMpfr256",
    ]),
    endpointObjectFieldsInValidationOrder: Object.freeze([
      "sign",
      "mantissaHex",
      "exponent2",
      "precisionBits",
      "direction",
    ]),
    endpointGrammar:
      "canonical_JSON_object_with_exact_fields_{sign,mantissaHex,exponent2,precisionBits,direction}_and_no_other_fields",
    endpointFieldDomains: Object.freeze({
      sign: Object.freeze(["positive_zero", "plus", "minus"]),
      mantissaHex:
        "lowercase_[0-9a-f]+_with_no_leading_zero_except_the_single_token_0",
      exponent2:
        "JSON_string_canonical_decimal_0_or_minus_nonzero_digits_or_nonzero_digits_with_no_plus_sign_and_no_leading_zero",
      precisionBits: "JSON_integer_exactly_256",
      direction: Object.freeze(["MPFR_RNDN", "MPFR_RNDD", "MPFR_RNDU"]),
    }),
    uniqueNormalizedDyadicRule: Object.freeze({
      valueDefinition:
        "sign_times_unsigned_integer_mantissaHex_times_2_power_exponent2",
      positiveZero: "sign_positive_zero_requires_mantissaHex_0_and_exponent2_0",
      nonzero:
        "sign_plus_or_minus_requires_nonzero_odd_mantissa_with_bit_length_1_through_256",
      exponentRepresentability:
        "for_nonzero_mantissa_bit_length_b_require_minus_1000000<=exponent2+b<=plus_1000000",
      uniquenessReason:
        "odd_nonzero_mantissa_absorbs_every_factor_of_two_into_exponent2_so_each_signed_nonzero_dyadic_has_one_encoding",
    }),
    centralF64Identity: Object.freeze({
      wordGrammar:
        "exactly_16_lowercase_hex_digits_encoding_the_host_independent_unsigned_IEEE754_binary64_bit_word",
      finiteRequired: true,
      negativeZeroAllowed: false,
      exactDecomposition:
        "decode_the_finite_word;for_zero_require_the_unique_positive_zero_endpoint;otherwise_form_the_exact_integer_significand_and_binary_exponent_then_remove_all_factors_of_two_until_the_mantissa_is_odd",
      equalityRequired:
        "centralMpfr256_must_equal_the_unique_normalized_dyadic_decomposition_of_centralF64WordHex_and_the_fresh_mpfr_set_d_destination_bit_exactly",
    }),
    negativeZeroAllowed: false,
    lowerCentralUpperRelationRequired: "lower<=central<=upper",
    loadProgram: Object.freeze([
      "01_for_each_endpoint_in_C_then_L_then_U_order_validate_the_exact_object_keys_field_domains_unique_normalization_and_role_direction_C_RNDN_L_RNDD_U_RNDU",
      "02_mpz_set_str(freshMantissaMpz,mantissaHex,16)_require_exact_lowercase_roundtrip_and_required_oddness",
      "03_if_positive_zero_write_freshSignedEndpoint=mpfr_set_ui(0,MPFR_RNDN)_ternary_zero",
      "04_if_nonzero_write_freshUnsignedInteger=mpfr_set_z(freshMantissaMpz,MPFR_RNDN)_ternary_zero",
      "05_if_nonzero_write_freshUnsignedDyadic=mpfr_mul_2si(freshUnsignedInteger,exponent2,MPFR_RNDN)_ternary_zero",
      "06_if_plus_write_freshSignedEndpoint=mpfr_set(freshUnsignedDyadic,MPFR_RNDN)_ternary_zero_else_if_minus_write_freshSignedEndpoint=mpfr_neg(freshUnsignedDyadic,MPFR_RNDN)_ternary_zero",
      "07_for_geometry_C_decode_centralF64WordHex_then_write_freshCentralFromF64=mpfr_set_d(decodedFiniteF64,MPFR_RNDN)_ternary_zero_then_mpfr_cmp(freshCentralFromF64,freshSignedEndpoint)_require_zero_and_use_freshCentralFromF64_as_C",
      "08_mpfr_cmp(L,C)_require_less_or_equal_then_mpfr_cmp(C,U)_require_less_or_equal_with_comparison_protocol",
    ]),
  }),
  destinationAndContextPolicy: Object.freeze({
    destinationIdGrammar:
      "scope{global_or_rgG_or_rgG.sS_or_rgG.sS.cC}.stage{stageOrdinal}.{symbol}.{C_or_L_or_U_or_LL_or_LU_or_UL_or_UU}",
    proseSymbolsMustExpandToDestinationIdsBeforeExecution: true,
    everyMpfrDestinationWrittenExactlyOnce: true,
    everyNamedDestinationFreshBeforeFirstWrite: true,
    overwriteOfAnyMpfrDestinationAllowed: false,
    endpointAliasingAllowed: false,
    sourceDestinationAliasingAllowed: false,
    onlyInPlaceOperation: null,
    immutableSourceSelectionHandlesAreNotMpfrDestinations: true,
    axisScope:
      "x_y_z_each_have_distinct_num_absNum_nAbs_and_n_destinations_for_C_L_U_at_every_sample",
    sampleScope:
      "no_MPFR_destination_is_reused_across_samples_radius_groups_components_or_terminal_roles;immutable_admitted_geometry_sources_may_be_read_by_each_member_of_their_one_radius_group",
    destinationLifecycle: Object.freeze({
      construction:
        "mpfr_init2(freshDestination,256)_immediately_before_that_destination_one_arithmetic_write_and_before_no_earlier_operation",
      initializationIsRecordedAsContextOperation: true,
      destruction:
        "after_all_output_words_and_primitive_observations_exist_mpfr_clear_every_destination_in_strict_reverse_init2_order",
      mpzLifecycle:
        "mpz_init_immediately_before_each_mpz_set_str_and_mpz_clear_in_strict_reverse_mpz_init_order_after_all_MPFR_destinations_are_cleared",
      oneMonotoneTraceOrdinalAcrossAllReturnKindsAndLifecycleOperations: true,
    }),
    precisionBits: 256,
    exponentMinimum: -1_000_000,
    exponentMaximum: 1_000_000,
    callerExponentRangePrecondition:
      "saved_emin<=minus_1000000_and_saved_emax>=plus_1000000",
    exclusiveContextLease:
      "one_OS_thread_owns_the_MPFR_exponent_range_and_flags_from_the_initial_clear_before_save_through_receipt_finalization_and_no_untraced_MPFR_operation_may_interleave",
    exponentContextOrder:
      "save_emin_then_emax;set_emin_minus_1000000_then_set_emax_plus_1000000;before_receipt_finalization_set_emax_saved_then_set_emin_saved",
    setExponentRangeBeforeAnyMpfrDestinationOrConstantConstruction: true,
    restoreCallerExponentRangeBeforeReceiptFinalization: true,
    receiptIncludesSuccessfulContextRestoration: true,
    subnormalize: false,
    sixFlagsInReadOrder: Object.freeze([
      "underflow",
      "overflow",
      "divide_by_zero",
      "nan",
      "inexact",
      "erange",
    ]),
    primitiveObservationProtocol: Object.freeze({
      arithmeticReturningTernary: Object.freeze({
        before: "mpfr_clear_flags",
        recordFieldsInOrder: Object.freeze([
          "primitiveOrdinal",
          "operation",
          "destinationId",
          "sourceIdsOrLiterals",
          "roundingMode",
          "ternary",
          "sixFlags",
        ]),
        allowedTernary: Object.freeze([-1, 0, 1]),
        allowedFlags: Object.freeze(["inexact"]),
        exactStepRule:
          "a_step_suffixed_ternary_zero_requires_ternary_0_and_all_six_flags_false",
        disallowedOutcome:
          "any_disallowed_flag_or_ternary_invalidates_the_trace_before_the_destination_may_be_consumed",
        after: "record_then_mpfr_clear_flags",
      }),
      comparisonReturningSign: Object.freeze({
        before: "mpfr_clear_flags",
        recordFieldsInOrder: Object.freeze([
          "primitiveOrdinal",
          "operation",
          "sourceIdsOrLiterals",
          "normalizedComparisonSign",
          "sixFlags",
        ]),
        normalizedComparisonSign: "minus_1_zero_or_plus_1",
        roundingModeFieldPresent: false,
        ternaryFieldPresent: false,
        allowedFlags: Object.freeze([]),
        disallowedOutcome:
          "any_set_flag_or_noncanonical_comparison_return_invalidates_the_trace_before_branch_selection",
        after: "record_then_mpfr_clear_flags",
      }),
      getDReturningBinary64: Object.freeze({
        before: "mpfr_clear_flags",
        recordFieldsInOrder: Object.freeze([
          "primitiveOrdinal",
          "operation",
          "sourceId",
          "roundingMode",
          "binary64WordHex",
          "sixFlags",
        ]),
        ternaryFieldPresent: false,
        allowedFlags: Object.freeze(["inexact"]),
        finiteResultRequired: true,
        disallowedOutcome:
          "any_disallowed_flag_or_nonfinite_word_invalidates_the_trace_before_word_canonicalization",
        after: "record_then_mpfr_clear_flags",
      }),
      contextAndMpzOperations: Object.freeze({
        roundingTernaryFieldPresent: false,
        exactReturnAndCanonicalRoundtripRequired: true,
        mpfrFlagsMustRemainClear: true,
      }),
    }),
  }),
  sampleGeometryCentralAst: Object.freeze([
    "01_mpfr_set_ui(qC,radiusSquaredNumerator,MPFR_RNDN)_ternary_zero",
    "02_mpfr_sqrt(sqrtQC,qC,MPFR_RNDN)",
    "03_mpfr_div_ui(xC,sqrtQC,8,MPFR_RNDN)",
    "04_mpfr_set_si(numXC,xNumerator,MPFR_RNDN)_ternary_zero",
    "05_mpfr_div(nXC,numXC,sqrtQC,MPFR_RNDN)",
    "06_mpfr_set_si(numYC,yNumerator,MPFR_RNDN)_ternary_zero",
    "07_mpfr_div(nYC,numYC,sqrtQC,MPFR_RNDN)",
    "08_mpfr_set_si(numZC,zNumerator,MPFR_RNDN)_ternary_zero",
    "09_mpfr_div(nZC,numZC,sqrtQC,MPFR_RNDN)",
  ]),
  sampleGeometryDirectedAst: Object.freeze([
    "01_mpfr_set_ui(qL,radiusSquaredNumerator,MPFR_RNDN)_ternary_zero",
    "02_mpfr_set_ui(qU,radiusSquaredNumerator,MPFR_RNDN)_ternary_zero",
    "03_mpfr_sqrt(sqrtQL,qL,MPFR_RNDD)",
    "04_mpfr_sqrt(sqrtQU,qU,MPFR_RNDU)",
    "05_mpfr_div_ui(xL,sqrtQL,8,MPFR_RNDD)",
    "06_mpfr_div_ui(xU,sqrtQU,8,MPFR_RNDU)",
    "07_mpfr_set_ui(absNumXL,abs(xNumerator),MPFR_RNDN)_ternary_zero",
    "08_mpfr_set_ui(absNumXU,abs(xNumerator),MPFR_RNDN)_ternary_zero",
    "09_mpfr_div(nAbsXL,absNumXL,sqrtQU,MPFR_RNDD)",
    "10_mpfr_div(nAbsXU,absNumXU,sqrtQL,MPFR_RNDU)",
    "11_if_xNumerator_positive_mpfr_set(nXL,nAbsXL,MPFR_RNDN)_else_mpfr_neg(nXL,nAbsXU,MPFR_RNDD)_ternary_zero",
    "12_if_xNumerator_positive_mpfr_set(nXU,nAbsXU,MPFR_RNDN)_else_mpfr_neg(nXU,nAbsXL,MPFR_RNDU)_ternary_zero",
    "13_mpfr_set_ui(absNumYL,abs(yNumerator),MPFR_RNDN)_ternary_zero",
    "14_mpfr_set_ui(absNumYU,abs(yNumerator),MPFR_RNDN)_ternary_zero",
    "15_mpfr_div(nAbsYL,absNumYL,sqrtQU,MPFR_RNDD)",
    "16_mpfr_div(nAbsYU,absNumYU,sqrtQL,MPFR_RNDU)",
    "17_if_yNumerator_positive_mpfr_set(nYL,nAbsYL,MPFR_RNDN)_else_mpfr_neg(nYL,nAbsYU,MPFR_RNDD)_ternary_zero",
    "18_if_yNumerator_positive_mpfr_set(nYU,nAbsYU,MPFR_RNDN)_else_mpfr_neg(nYU,nAbsYL,MPFR_RNDU)_ternary_zero",
    "19_mpfr_set_ui(absNumZL,abs(zNumerator),MPFR_RNDN)_ternary_zero",
    "20_mpfr_set_ui(absNumZU,abs(zNumerator),MPFR_RNDN)_ternary_zero",
    "21_mpfr_div(nAbsZL,absNumZL,sqrtQU,MPFR_RNDD)",
    "22_mpfr_div(nAbsZU,absNumZU,sqrtQL,MPFR_RNDU)",
    "23_if_zNumerator_positive_mpfr_set(nZL,nAbsZL,MPFR_RNDN)_else_mpfr_neg(nZL,nAbsZU,MPFR_RNDD)_ternary_zero",
    "24_if_zNumerator_positive_mpfr_set(nZU,nAbsZU,MPFR_RNDN)_else_mpfr_neg(nZU,nAbsZL,MPFR_RNDU)_ternary_zero",
  ]),
  outwardIntervalPrimitiveTemplates: Object.freeze({
    add: Object.freeze([
      "01_outL=mpfr_add(aL,bL,MPFR_RNDD)",
      "02_outU=mpfr_add(aU,bU,MPFR_RNDU)",
    ]),
    subtract: Object.freeze([
      "01_outL=mpfr_sub(aL,bU,MPFR_RNDD)",
      "02_outU=mpfr_sub(aU,bL,MPFR_RNDU)",
    ]),
    negate: Object.freeze([
      "01_outL=mpfr_neg(aU,MPFR_RNDD)_ternary_zero",
      "02_outU=mpfr_neg(aL,MPFR_RNDU)_ternary_zero",
    ]),
    multiply: Object.freeze({
      candidateOrder: Object.freeze(["LL", "LU", "UL", "UU"]),
      primitiveOrder: Object.freeze([
        "01_LL_lower=mpfr_mul(aL,bL,MPFR_RNDD)",
        "02_LU_lower=mpfr_mul(aL,bU,MPFR_RNDD)",
        "03_UL_lower=mpfr_mul(aU,bL,MPFR_RNDD)",
        "04_UU_lower=mpfr_mul(aU,bU,MPFR_RNDD)",
        "05_LL_upper=mpfr_mul(aL,bL,MPFR_RNDU)",
        "06_LU_upper=mpfr_mul(aL,bU,MPFR_RNDU)",
        "07_UL_upper=mpfr_mul(aU,bL,MPFR_RNDU)",
        "08_UU_upper=mpfr_mul(aU,bU,MPFR_RNDU)",
        "09_lower_source_starts_LL;mpfr_cmp(currentLower,LU)<=0_keep_current_else_select_LU",
        "10_mpfr_cmp(currentLower,UL)<=0_keep_current_else_select_UL",
        "11_mpfr_cmp(currentLower,UU)<=0_keep_current_else_select_UU",
        "12_upper_source_starts_LL;mpfr_cmp(currentUpper,LU)>=0_keep_current_else_select_LU",
        "13_mpfr_cmp(currentUpper,UL)>=0_keep_current_else_select_UL",
        "14_mpfr_cmp(currentUpper,UU)>=0_keep_current_else_select_UU",
        "15_outL=mpfr_set(selectedLowerSource,MPFR_RNDN)_ternary_zero",
        "16_outU=mpfr_set(selectedUpperSource,MPFR_RNDN)_ternary_zero",
      ]),
      comparisonCount: 6,
      selectionHandlesAreImmutableSourceReferences: true,
    }),
    dividePositiveDenominator: Object.freeze([
      "01_mpfr_cmp_ui(bL,0)_require_greater",
      "02_recipL=mpfr_ui_div(1,bU,MPFR_RNDD)",
      "03_recipU=mpfr_ui_div(1,bL,MPFR_RNDU)",
      "04_expand_multiply_a_by_recip_in_the_frozen_16_step_order",
    ]),
    multiplySignedInteger: Object.freeze([
      "01_integerL=mpfr_set_si(integer,MPFR_RNDN)_ternary_zero",
      "02_integerU=mpfr_set_si(integer,MPFR_RNDN)_ternary_zero",
      "03_expand_multiply_input_by_integer_pair_in_the_frozen_16_step_order",
    ]),
    exp: Object.freeze([
      "01_outL=mpfr_exp(aL,MPFR_RNDD)",
      "02_outU=mpfr_exp(aU,MPFR_RNDU)",
    ]),
    centralPositiveZero: Object.freeze([
      "01_outC=mpfr_set_ui(0,MPFR_RNDN)_ternary_zero",
    ]),
    directedPositiveZero: Object.freeze([
      "01_outL=mpfr_set_ui(0,MPFR_RNDN)_ternary_zero",
      "02_outU=mpfr_set_ui(0,MPFR_RNDN)_ternary_zero",
    ]),
    centralCopy: Object.freeze([
      "01_outC=mpfr_set(sourceC,MPFR_RNDN)_ternary_zero",
    ]),
    directedCopy: Object.freeze([
      "01_outL=mpfr_set(sourceL,MPFR_RNDN)_ternary_zero",
      "02_outU=mpfr_set(sourceU,MPFR_RNDN)_ternary_zero",
    ]),
  }),
  centralScalarAst: Object.freeze({
    expMinusTwoF1: Object.freeze([
      "01_e0=mpfr_mul_si(F1C,-2,MPFR_RNDN)",
      "02_eC=mpfr_exp(e0,MPFR_RNDN)",
    ]),
    rhoBar: Object.freeze([
      "01_r0=mpfr_mul_ui(F1ppC,2,MPFR_RNDN)",
      "02_r1=mpfr_mul(F1pC,F1pC,MPFR_RNDN)",
      "03_r2=mpfr_mul_ui(F1pC,4,MPFR_RNDN)",
      "04_r3=mpfr_div(r2,xC,MPFR_RNDN)",
      "05_r4=mpfr_add(r0,r1,MPFR_RNDN)",
      "06_r5=mpfr_add(r4,r3,MPFR_RNDN)",
      "07_r6=mpfr_mul(eC,r5,MPFR_RNDN)",
      "08_rhoC=mpfr_neg(r6,MPFR_RNDN)_require_ternary_zero",
    ]),
    radialPressureBar: Object.freeze([
      "01_p0=mpfr_mul(F0pC,F1pC,MPFR_RNDN)",
      "02_p1=mpfr_mul_ui(p0,2,MPFR_RNDN)",
      "03_p2=mpfr_mul(F1pC,F1pC,MPFR_RNDN)",
      "04_p3=mpfr_add(F0pC,F1pC,MPFR_RNDN)",
      "05_p4=mpfr_mul_ui(p3,2,MPFR_RNDN)",
      "06_p5=mpfr_div(p4,xC,MPFR_RNDN)",
      "07_p6=mpfr_add(p1,p2,MPFR_RNDN)",
      "08_p7=mpfr_add(p6,p5,MPFR_RNDN)",
      "09_prC=mpfr_mul(eC,p7,MPFR_RNDN)",
    ]),
    tangentialPressureBar: Object.freeze([
      "01_t0=mpfr_mul(F0pC,F0pC,MPFR_RNDN)",
      "02_t1=mpfr_add(t0,F0ppC,MPFR_RNDN)",
      "03_t2=mpfr_add(t1,F1ppC,MPFR_RNDN)",
      "04_t3=mpfr_add(F0pC,F1pC,MPFR_RNDN)",
      "05_t4=mpfr_div(t3,xC,MPFR_RNDN)",
      "06_t5=mpfr_add(t2,t4,MPFR_RNDN)",
      "07_ptC=mpfr_mul(eC,t5,MPFR_RNDN)",
    ]),
  }),
  directedScalarAst: Object.freeze({
    expMinusTwoF1: Object.freeze([
      "01_e0Hull=expand_multiplySignedInteger(F1Hull,-2)",
      "02_eHull=expand_exp(e0Hull)",
    ]),
    rhoBar: Object.freeze([
      "01_r0Hull=expand_multiplySignedInteger(F1ppHull,2)",
      "02_r1Hull=expand_multiply(F1pHull,F1pHull)",
      "03_r2Hull=expand_multiplySignedInteger(F1pHull,4)",
      "04_r3Hull=expand_dividePositiveDenominator(r2Hull,xHull)",
      "05_r4Hull=expand_add(r0Hull,r1Hull)",
      "06_r5Hull=expand_add(r4Hull,r3Hull)",
      "07_r6Hull=expand_multiply(eHull,r5Hull)",
      "08_rhoHull=expand_negate(r6Hull)",
    ]),
    radialPressureBar: Object.freeze([
      "01_p0Hull=expand_multiply(F0pHull,F1pHull)",
      "02_p1Hull=expand_multiplySignedInteger(p0Hull,2)",
      "03_p2Hull=expand_multiply(F1pHull,F1pHull)",
      "04_p3Hull=expand_add(F0pHull,F1pHull)",
      "05_p4Hull=expand_multiplySignedInteger(p3Hull,2)",
      "06_p5Hull=expand_dividePositiveDenominator(p4Hull,xHull)",
      "07_p6Hull=expand_add(p1Hull,p2Hull)",
      "08_p7Hull=expand_add(p6Hull,p5Hull)",
      "09_prHull=expand_multiply(eHull,p7Hull)",
    ]),
    tangentialPressureBar: Object.freeze([
      "01_t0Hull=expand_multiply(F0pHull,F0pHull)",
      "02_t1Hull=expand_add(t0Hull,F0ppHull)",
      "03_t2Hull=expand_add(t1Hull,F1ppHull)",
      "04_t3Hull=expand_add(F0pHull,F1pHull)",
      "05_t4Hull=expand_dividePositiveDenominator(t3Hull,xHull)",
      "06_t5Hull=expand_add(t2Hull,t4Hull)",
      "07_ptHull=expand_multiply(eHull,t5Hull)",
    ]),
    expansionRule:
      "expand_each_template_inline_at_the_call_site_with_the_call_site_destination_prefix_and_the_frozen_template_primitive_order",
  }),
  projectionPreludeAst: Object.freeze([
    "01_diffC=mpfr_sub(prC,ptC,MPFR_RNDN)",
    "02_diffHull=expand_subtract(prHull,ptHull)",
  ]),
  cartesianProjectionAst: Object.freeze({
    timeComponent00: Object.freeze([
      "01_component00C=expand_centralCopy(rhoC)",
      "02_component00Hull=expand_directedCopy(rhoHull)",
    ]),
    timeSpaceComponentOrder: Object.freeze(["01", "02", "03"]),
    eachTimeSpaceComponent: Object.freeze([
      "01_componentC=expand_centralPositiveZero",
      "02_componentHull=expand_directedPositiveZero",
    ]),
    spatialComponentOrder: Object.freeze(["11", "12", "13", "22", "23", "33"]),
    diagonalSpatialComponents: Object.freeze(["11", "22", "33"]),
    offDiagonalSpatialComponents: Object.freeze(["12", "13", "23"]),
    eachSpatialComponent: Object.freeze([
      "01_nijC=mpfr_mul(niC,njC,MPFR_RNDN)",
      "02_nijHull=expand_multiply(niHull,njHull)",
      "03_corrC=mpfr_mul(diffC,nijC,MPFR_RNDN)",
      "04_corrHull=expand_multiply(diffHull,nijHull)",
      "05_if_diagonal_baseC=expand_centralCopy(ptC)_else_baseC=expand_centralPositiveZero",
      "06_if_diagonal_baseHull=expand_directedCopy(ptHull)_else_baseHull=expand_directedPositiveZero",
      "07_componentC=mpfr_add(baseC,corrC,MPFR_RNDN)",
      "08_componentHull=expand_add(baseHull,corrHull)",
    ]),
    centralBeforeDirectedAtEveryNumberedStage: true,
  }),
  siAndTerminalAst: Object.freeze([
    "01_cSiRaw=mpfr_mul(componentC,stressScaleNC,MPFR_RNDN)",
    "02_if_mpfr_cmp_ui(cSiRaw,0)_is_zero_cSiCanonical=mpfr_set_ui(0,MPFR_RNDN)_else_cSiCanonical=mpfr_set(cSiRaw,MPFR_RNDN)_ternary_zero",
    "03_cF64RawWord=mpfr_get_d(cSiCanonical,MPFR_RNDN)_exactly_once_require_finite",
    "04_cF64CanonicalWord=if_raw_magnitude_bits_zero_then_positive_zero_word_else_cF64RawWord_non_MPFR_word_step",
    "05_cExact=mpfr_set_d(decode(cF64CanonicalWord),MPFR_RNDN)_ternary_zero",
    "06_finalRawHull=expand_multiply(componentHull,stressScaleK2Hull)",
    "07_if_mpfr_cmp_ui(finalRawL,0)_is_zero_finalL=mpfr_set_ui(0,MPFR_RNDN)_else_finalL=mpfr_set(finalRawL,MPFR_RNDN)_ternary_zero",
    "08_if_mpfr_cmp_ui(finalRawU,0)_is_zero_finalU=mpfr_set_ui(0,MPFR_RNDN)_else_finalU=mpfr_set(finalRawU,MPFR_RNDN)_ternary_zero",
    "09_mpfr_cmp(finalL,cExact)_require_less_or_equal",
    "10_mpfr_cmp(cExact,finalU)_require_less_or_equal",
    "11_distanceL=mpfr_sub(cExact,finalL,MPFR_RNDU)",
    "12_distanceU=mpfr_sub(finalU,cExact,MPFR_RNDU)",
    "13_mpfr_cmp(distanceL,distanceU)_select_distanceL_on_greater_or_equal_else_distanceU",
    "14_distanceMax=mpfr_set(selectedImmutableDistanceSource,MPFR_RNDN)_ternary_zero",
    "15_uF64RawWord=mpfr_get_d(distanceMax,MPFR_RNDU)_exactly_once_require_finite",
    "16_uF64CanonicalWord=if_raw_magnitude_bits_zero_then_positive_zero_word_else_uF64RawWord_non_MPFR_word_step",
    "17_uExact=mpfr_set_d(decode(uF64CanonicalWord),MPFR_RNDN)_ternary_zero",
    "18_mpfr_cmp(uExact,distanceL)_require_greater_or_equal",
    "19_mpfr_cmp(uExact,distanceU)_require_greater_or_equal",
    "20_store_cF64CanonicalWord_then_uF64CanonicalWord_as_little_endian_bytes_at_byte_offset_8_times_10_sample_plus_component",
  ]),
  forbiddenAlternativeGraphs: Object.freeze([
    "axisNumerator_over_8_divided_by_sqrt_q_over_64",
    "set_ui_q_then_div_ui_64_then_sqrt_instead_of_set_ui_q_then_sqrt_then_div_ui_8",
    "precompute_reciprocal_x_and_multiply_instead_of_the_named_divisions",
    "reassociate_or_balance_any_three_or_more_term_sum",
    "fma_or_fms_or_dot_product_primitives",
    "reuse_a_destination_or_endpoint_handle",
    "overwrite_a_destination_to_canonicalize_zero",
    "reuse_one_axis_destination_for_x_y_or_z",
    "visit_all_64_samples_inside_each_radius_group",
    "accept_an_unreduced_even_nonzero_dyadic_mantissa_or_a_nonunique_zero",
    "derive_interval_endpoints_from_the_central_result_or_from_binary64_roundoff_estimates",
    "center_error_on_unserialized_MPFR_central",
  ]),
});

const CONTRACT = {
  artifactId: NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM_ARTIFACT_ID,
  contractVersion:
    NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM_CONTRACT_VERSION,
  phase: NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM_PHASE,
  candidateId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
  maturity:
    "closed_metric_demand_formula_and_error_program_with_all_run_instances_absent",
  exactBindings: {
    sourceCandidatePlan:
      NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_BINDING,
    v2CandidateFreeze: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
    branchBvp: NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_BINDING,
    radialPrimaryNumerics:
      NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_BINDING,
    branchExecutionPolicy:
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_BINDING,
    siOutputNormalization:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BINDING,
    scienceDerivationDagSha256:
      NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_SHA256,
  },
  geometryBoundary: {
    metric: "dsbar^2=-exp(2*F0(x))*dtau^2+exp(2*F1(x))*(dx^2+x^2*dOmega^2)",
    dimensionlessRadius: "x=mu_L*r_SI",
    acceptedBranchGeometryRequired: true,
    sourceUnknownOrder: Object.freeze(["F0(x)", "F1(x)", "varphi(x)"]),
    metricDemandReadsMatterOrQuantumArrays: false,
    metricDemandMaySubstituteForMeanRset: false,
    constantShiftOfF0AffectsDemand: false,
  },
  sampleBoundary: {
    sampleCount: 64,
    axisCoordinatesExact: Object.freeze(["-3/8", "-1/8", "1/8", "3/8"]),
    enumerationOrder: "z_outer_then_y_then_x_inner",
    ordinalFormula: "ordinal=16*i_z+4*i_y+i_x",
    originSamplePresent: false,
    distinctRadiusCount: 4,
    radiusGroups: RADIUS_GROUPS,
    projectionBySample: SAMPLE_PROJECTION,
  },
  acceptedGeometryEvaluationAbi: {
    instance: null,
    requiredRadiusGroupOrder: Object.freeze(
      RADIUS_GROUPS.map((entry) => entry.radiusGroup),
    ),
    requiredCentralAndDirectedIntervalQuantitiesPerRadiusInOrder: Object.freeze(
      ["F1", "F0_prime", "F1_prime", "F0_double_prime", "F1_double_prime"],
    ),
    quantityRecordFields:
      MPFR_PRIMITIVE_OPERATION_GRAPH.inputInterchange
        .geometryQuantityRecordFields,
    canonicalMpfr256EndpointGrammar:
      MPFR_PRIMITIVE_OPERATION_GRAPH.inputInterchange.endpointGrammar,
    scaleRecordFields:
      MPFR_PRIMITIVE_OPERATION_GRAPH.inputInterchange.siScaleRecordFields,
    F0ValueReadByMetricDemandFormula: false,
    exactAcceptedBranchOutputBindingRequired: true,
    spectralEvaluationAndDerivativeEnclosureReceiptRequired: true,
    everyLowerAndUpperEndpointMustEncloseTheSameAcceptedGeometry: true,
    centralRepresentativeMustBeInsideEveryInputInterval: true,
    interpolationOrDerivativeRetuningAfterObservationAllowed: false,
  },
  dimensionlessEinsteinProgram: {
    sourceMixedComponents: {
      Gbar_t_t: "exp(-2*F1)*(2*F1_double_prime+F1_prime^2+4*F1_prime/x)",
      Gbar_x_x:
        "exp(-2*F1)*(2*F0_prime*F1_prime+F1_prime^2+2*(F0_prime+F1_prime)/x)",
      Gbar_theta_theta:
        "exp(-2*F1)*(F0_prime^2+F0_double_prime+F1_double_prime+(F0_prime+F1_prime)/x)",
    },
    orthonormalCovariantScalars: {
      rhoBar: "-Gbar_t_t",
      radialPressureBar: "Gbar_x_x",
      tangentialPressureBar: "Gbar_theta_theta=Gbar_phi_phi",
    },
    signReason:
      "G_hat0hat0=-G^t_t_for_signature_minus_plus_plus_plus_while_spatial_orthonormal_covariant_components_equal_the_mixed_principal_components",
    cartesianProjection: {
      timeSpaceComponents: "Gbar_hat0hati=positive_zero",
      spatialFormula:
        "Gbar_hatihatj=pTangentialBar*delta_ij+(pRadialBar-pTangentialBar)*n_i*n_j",
      componentOrder: Object.freeze([
        "00",
        "01",
        "02",
        "03",
        "11",
        "12",
        "13",
        "22",
        "23",
        "33",
      ]),
      exactZeroProgram:
        "if_the_exact_or_rounded_result_is_zero_store_binary64_positive_zero",
      postsolveLorentzOrSpatialRotationAllowed: false,
    },
    outputShape: Object.freeze([64, 10]),
    outputUnitBeforeSiScaling: "barred_stress",
    finiteRequired: true,
    negativeZeroAllowed: false,
  },
  intervalAndSerializationProgram: {
    library: "GNU_MPFR",
    precisionBits: 256,
    centralRounding: "MPFR_RNDN",
    lowerRounding: "MPFR_RNDD",
    upperRounding: "MPFR_RNDU",
    exactRadiusConstruction:
      "set_ui(radius_squared_numerator);sqrt_at_C_RNDN_or_L_RNDD_or_U_RNDU;div_ui(8)_at_the_same_direction_with_distinct_single_assignment_destinations",
    centralChronology: Object.freeze([
      "load_the_five_accepted_geometry_central_values_from_their_finite_positive-zero-canonical_f64_words_and_verify_their_unique_normalized_dyadic_witnesses",
      "construct_radius_and_unit_vector_at_MPFR256_RNDN_by_sqrt_q_then_divide_8_and_axis_numerator_divide_sqrt_q",
      "evaluate_expMinusTwoF1_then_rhoBar_then_radialPressureBar_then_tangentialPressureBar_in_the_frozen_parenthesized_AST",
      "project_components_in_frozen_component_order",
      "multiply_each_barred_component_by_the_verified_SI_stressScaleN",
      "perform_exactly_one_terminal_mpfr_get_d_RNDN_per_metric_demand_element",
      "reinject_the_serialized_central_f64_as_an_exact_dyadic",
    ]),
    directedEnclosureChronology: Object.freeze([
      "construct_independent_RNDD_and_RNDU_radius_and_unit_vector_endpoints",
      "evaluate_each_formula_with_outward_interval_primitives_and_no_reassociation",
      "project_each_cartesian_component_with_outward_interval_arithmetic",
      "multiply_by_the_verified_stressScaleAdmissionK2_interval",
      "require_the_reinjected_serialized_central_f64_inside_the_final_hull",
      "compute_RNDU_distances_from_the_serialized_central_f64_to_both_hull_endpoints",
      "select_the_larger_distance",
      "perform_exactly_one_terminal_mpfr_get_d_RNDU_for_the_paired_error_element",
      "reinject_the_error_f64_and_require_it_enclose_both_byte_centered_distances",
    ]),
    pairedOutputRoles: Object.freeze([
      "metric_demand_tensor",
      "metric_demand_absolute_error_bound",
    ]),
    elementCountPerRole: 640,
    dtype: "float64",
    encoding: "raw_ieee754",
    endianness: "little",
    storageOrder: "sample_ordinal_outer_then_tensor_component_inner",
    centralSizeBytes: 5_120,
    errorSizeBytes: 5_120,
    errorRoleNonnegativeRequired: true,
    terminalByteEnclosurePostcondition:
      "u_f64>=max(abs(lower_exact-c_f64_exact),abs(upper_exact-c_f64_exact))",
    binary64OrJavaScriptNumberIntermediateAllowed: false,
    binary64BoundaryExceptions: Object.freeze([
      "decode_each_finite_centralF64WordHex_only_as_the_source_of_its_one_exact_mpfr_set_d_identity_load",
      "the_exactly_one_terminal_mpfr_get_d_per_output_role_followed_by_word_canonicalization_reinjection_and_serialization",
    ]),
    fusedOperationsOrReassociationAllowed: false,
    primitiveOperationGraph: MPFR_PRIMITIVE_OPERATION_GRAPH,
  },
  derivationAuthorityBoundary: {
    approvedBaseDagSha256: NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_SHA256,
    requiredEdges: Object.freeze([
      Object.freeze({
        from: "geometry",
        to: "metric_demand_tensor",
        relation: "geometry_to_metric_demand",
      }),
      Object.freeze({
        from: "chart",
        to: "metric_demand_tensor",
        relation: "same_chart_metric_projection",
      }),
      Object.freeze({
        from: "sampling_basis",
        to: "metric_demand_tensor",
        relation: "metric_sample_order",
      }),
    ]),
    normalizationDependencyOverlay: {
      baseDagMutatedByThisArtifact: false,
      approvalPresent: false,
      successorApprovalRequired: true,
      requiredEdges: Object.freeze([
        Object.freeze({
          from: "normalization",
          to: "metric_demand_tensor",
          relation: "normalization_to_physical_metric_demand_scale",
        }),
        Object.freeze({
          from: "normalization",
          to: "metric_demand_absolute_error_bound",
          relation: "normalization_uncertainty_to_metric_error_bytes",
        }),
        Object.freeze({
          from: "normalization",
          to: "metric_demand_error_bound_derivation_witness",
          relation: "normalization_uncertainty_to_metric_error_enclosure",
        }),
      ]),
      reason:
        "the_frozen_base_DAG_covers_geometry_chart_and_sampling_but_not_the_SI_scale_and_G_uncertainty_consumed_by_this_physical_J_per_m3_output",
    },
    metricDemandTensorArtifactId: "nhm2.semiclassical_v2.metric_demand_tensor",
    metricDemandTensorContractVersion:
      "nhm2_semiclassical_v2_metric_demand_tensor/v1",
    metricDemandErrorArtifactId:
      "nhm2.semiclassical_v2.metric_demand_absolute_error_bound",
    metricDemandErrorContractVersion:
      "nhm2_semiclassical_v2_metric_demand_absolute_error_bound/v1",
    derivationReceiptArtifactId:
      "nhm2.semiclassical_v2_metric_demand_derivation_receipt",
    derivationReceiptContractVersion:
      "nhm2_semiclassical_v2_metric_demand_derivation_receipt/v1",
    centralBytes: null,
    errorBytes: null,
    derivationReceipt: null,
    primaryIntervalReplayReceipt: null,
    independentIntervalReplayReceipt: null,
    exactByteAgreementReceipt: null,
  },
  blockers: Object.freeze([
    "accepted_v2_branch_geometry_instance_absent",
    "candidate_grid_refinement_and_cross_grid_receipt_absent",
    "spectral_value_and_derivative_interval_enclosure_program_not_implemented",
    "metric_demand_mpfr256_primitive_graph_implementation_absent",
    "metric_demand_primary_interval_trace_absent",
    "metric_demand_independent_interval_trace_absent",
    "si_scale_primary_and_independent_receipts_absent",
    "metric_demand_normalization_dependency_overlay_not_approved",
    "metric_demand_tensor_bytes_absent",
    "metric_demand_absolute_error_bound_bytes_absent",
    "metric_demand_derivation_receipt_absent",
    "scientific_candidate_manifest_and_preseal_absent",
  ]),
  noRetuning: {
    candidateOrBranchReplacementAfterFailureAllowed: false,
    formulaOrSignChangeAfterObservationAllowed: false,
    sampleOrComponentReorderingAfterObservationAllowed: false,
    intervalCoverageOrSiUncertaintyRetuningAfterObservationAllowed: false,
    failureDisposition: "fail_this_v2_candidate_without_retuning",
  },
  authorityLocks: AUTHORITY_LOCKS,
} as const;

const deepFreeze = <T>(value: T, seen = new Set<object>()): T => {
  if (value == null || typeof value !== "object" || seen.has(value as object))
    return value;
  seen.add(value as object);
  for (const child of Object.values(value as Record<string, unknown>))
    deepFreeze(child, seen);
  return Object.freeze(value);
};

export const NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM =
  deepFreeze(CONTRACT);
export type Nhm2SphericalBosonStarV2MetricDemandProgramV1 =
  typeof NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM;

const canonicalJson = (value: unknown): string => {
  if (value === null) return "null";
  if (typeof value === "boolean" || typeof value === "string")
    return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value) || Object.is(value, -0))
      throw new TypeError("metric_demand_program_noncanonical_number");
    return JSON.stringify(value);
  }
  if (Array.isArray(value))
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  if (value == null || typeof value !== "object")
    throw new TypeError("metric_demand_program_non_json_value");
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort((left, right) =>
      Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8")),
    )
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};

export const NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-metric-demand-program/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM_CANONICAL_JSON =
  canonicalJson(NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM);
export const NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM_SHA256 =
  createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM_CANONICAL_JSON,
    "utf8",
  );
export const NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM_EXPECTED_SHA256 =
  "c64cd963ec7a8ad2485de2e4ff16e307da61a6fd1e108439ae56eade76b00fee" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM_EXPECTED_CANONICAL_SIZE_BYTES =
  48_595 as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM_BINDING =
  Object.freeze({
    artifactId: NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM_CONTRACT_VERSION,
    candidateId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
    sha256Domain:
      NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM_SHA256_DOMAIN,
    sha256: NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM_SHA256,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM_CANONICAL_SIZE_BYTES,
    mediaType: "application/json" as const,
  });

const exactBinding = (
  observed: Readonly<{ sha256: string; canonicalSizeBytes: number }>,
  expected: Readonly<{ sha256: string; canonicalSizeBytes: number }>,
) =>
  observed.sha256 === expected.sha256 &&
  observed.canonicalSizeBytes === expected.canonicalSizeBytes;

const assertInvariants = (): void => {
  const primitiveGraph =
    CONTRACT.intervalAndSerializationProgram.primitiveOperationGraph;
  const traceGroups = primitiveGraph.loopOrder.exactSampleOrdinalsByRadiusGroup;
  const traceSampleOrdinals = traceGroups.flatMap(
    (group) => group.sampleOrdinals,
  );
  if (
    !exactBinding(
      NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_BINDING,
      REQUIRED_BINDINGS.sourceCandidatePlan,
    ) ||
    !exactBinding(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
      REQUIRED_BINDINGS.v2CandidateFreeze,
    ) ||
    !exactBinding(
      NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_BINDING,
      REQUIRED_BINDINGS.branchBvp,
    ) ||
    !exactBinding(
      NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_BINDING,
      REQUIRED_BINDINGS.radialPrimaryNumerics,
    ) ||
    !exactBinding(
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_BINDING,
      REQUIRED_BINDINGS.branchExecutionPolicy,
    ) ||
    !exactBinding(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BINDING,
      REQUIRED_BINDINGS.siOutputNormalization,
    ) ||
    NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_SHA256 !==
      REQUIRED_BINDINGS.scienceDerivationDagSha256
  )
    throw new Error("spherical_v2_metric_demand_upstream_binding_mismatch");
  if (
    SAMPLE_PROJECTION.length !== 64 ||
    RADIUS_GROUPS.length !== 4 ||
    RADIUS_GROUPS.reduce(
      (count, group) => count + group.sampleOrdinals.length,
      0,
    ) !== 64 ||
    SAMPLE_PROJECTION.some((entry, ordinal) => entry.ordinal !== ordinal) ||
    traceGroups.length !== RADIUS_GROUPS.length ||
    traceGroups.some(
      (group, groupOrdinal) =>
        group.radiusGroup !== RADIUS_GROUPS[groupOrdinal].radiusGroup ||
        group.sampleOrdinals.length !==
          RADIUS_GROUPS[groupOrdinal].sampleOrdinals.length ||
        group.sampleOrdinals.some(
          (sampleOrdinal, memberOrdinal) =>
            sampleOrdinal !==
            RADIUS_GROUPS[groupOrdinal].sampleOrdinals[memberOrdinal],
        ),
    ) ||
    traceSampleOrdinals.length !== 64 ||
    new Set(traceSampleOrdinals).size !== 64 ||
    primitiveGraph.inputInterchange.geometryQuantityRecordFields[1] !==
      "centralF64WordHex" ||
    !primitiveGraph.destinationAndContextPolicy
      .everyMpfrDestinationWrittenExactlyOnce ||
    primitiveGraph.destinationAndContextPolicy
      .overwriteOfAnyMpfrDestinationAllowed ||
    primitiveGraph.destinationAndContextPolicy.onlyInPlaceOperation !== null ||
    primitiveGraph.totalTraceOrder[7] !==
      "08_after_all_bytes_and_observations_exist_clear_MPFR_destinations_then_MPZ_values_in_reverse_creation_order_restore_saved_emax_then_saved_emin_require_success_finalize_the_receipt_then_release_the_exclusive_MPFR_context" ||
    primitiveGraph.destinationAndContextPolicy.exponentContextOrder !==
      "save_emin_then_emax;set_emin_minus_1000000_then_set_emax_plus_1000000;before_receipt_finalization_set_emax_saved_then_set_emin_saved" ||
    !primitiveGraph.destinationAndContextPolicy
      .restoreCallerExponentRangeBeforeReceiptFinalization ||
    !primitiveGraph.destinationAndContextPolicy
      .receiptIncludesSuccessfulContextRestoration ||
    CONTRACT.intervalAndSerializationProgram.exactRadiusConstruction !==
      "set_ui(radius_squared_numerator);sqrt_at_C_RNDN_or_L_RNDD_or_U_RNDU;div_ui(8)_at_the_same_direction_with_distinct_single_assignment_destinations" ||
    Object.values(AUTHORITY_LOCKS).some((value) => value !== false) ||
    CONTRACT.derivationAuthorityBoundary.centralBytes !== null ||
    CONTRACT.derivationAuthorityBoundary.errorBytes !== null ||
    CONTRACT.derivationAuthorityBoundary.derivationReceipt !== null
  )
    throw new Error("spherical_v2_metric_demand_program_invariant");
  if (
    NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM_SHA256 !==
      NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM_EXPECTED_SHA256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM_CANONICAL_SIZE_BYTES !==
      NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM_EXPECTED_CANONICAL_SIZE_BYTES
  )
    throw new Error("spherical_v2_metric_demand_program_literal_seal_mismatch");
};

assertInvariants();

type SnapshotBudget = { nodes: number; utf8Bytes: number };
type SnapshotResult =
  | Readonly<{ ok: true; value: unknown }>
  | Readonly<{ ok: false; violation: string }>;

const snapshotParsedJson = (
  value: unknown,
  pointer = "",
  depth = 0,
  budget: SnapshotBudget = { nodes: 0, utf8Bytes: 0 },
): SnapshotResult => {
  const limits = NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM_LIMITS;
  if (depth > limits.maximumDepth)
    return { ok: false, violation: `wire_depth_limit:${pointer || "/"}` };
  budget.nodes += 1;
  if (budget.nodes > limits.maximumNodes)
    return { ok: false, violation: `wire_node_limit:${pointer || "/"}` };
  if (value === null || typeof value === "boolean") return { ok: true, value };
  if (typeof value === "number")
    return Number.isFinite(value) && !Object.is(value, -0)
      ? { ok: true, value }
      : { ok: false, violation: `wire_number_invalid:${pointer || "/"}` };
  if (typeof value === "string") {
    const bytes = Buffer.byteLength(value, "utf8");
    budget.utf8Bytes += bytes;
    return bytes <= limits.maximumStringUtf8Bytes &&
      budget.utf8Bytes <= limits.maximumAggregateUtf8Bytes
      ? { ok: true, value }
      : { ok: false, violation: `wire_string_limit:${pointer || "/"}` };
  }
  if (Array.isArray(value)) {
    if (value.length > limits.maximumArrayLength)
      return { ok: false, violation: `wire_array_limit:${pointer || "/"}` };
    const output: unknown[] = [];
    for (let index = 0; index < value.length; index += 1) {
      if (!Object.hasOwn(value, index))
        return {
          ok: false,
          violation: `wire_sparse_array:${pointer}/${index}`,
        };
      const child = snapshotParsedJson(
        value[index],
        `${pointer}/${index}`,
        depth + 1,
        budget,
      );
      if (!child.ok) return child;
      output.push(child.value);
    }
    return { ok: true, value: output };
  }
  if (value == null || typeof value !== "object")
    return { ok: false, violation: `wire_non_json:${pointer || "/"}` };
  const keys = Object.keys(value);
  if (keys.length > limits.maximumObjectPropertyCount)
    return { ok: false, violation: `wire_object_limit:${pointer || "/"}` };
  const output = Object.create(null) as Record<string, unknown>;
  for (const key of keys) {
    const keyBytes = Buffer.byteLength(key, "utf8");
    budget.utf8Bytes += keyBytes;
    if (budget.utf8Bytes > limits.maximumAggregateUtf8Bytes)
      return { ok: false, violation: `wire_utf8_limit:${pointer || "/"}` };
    const child = snapshotParsedJson(
      (value as Record<string, unknown>)[key],
      `${pointer}/${key}`,
      depth + 1,
      budget,
    );
    if (!child.ok) return child;
    output[key] = child.value;
  }
  return { ok: true, value: output };
};

export const nhm2SphericalBosonStarV2MetricDemandProgramViolations = (
  value: unknown,
): string[] => {
  if (value === NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM) return [];
  if (typeof value !== "string") return ["metric_demand_program_wire_required"];
  const limits = NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM_LIMITS;
  if (value.length > limits.maximumWireUtf16CodeUnits)
    return ["metric_demand_program_wire_code_unit_limit"];
  if (Buffer.byteLength(value, "utf8") > limits.maximumWireUtf8Bytes)
    return ["metric_demand_program_wire_byte_limit"];
  let parsed: unknown;
  try {
    parsed = JSON.parse(value) as unknown;
  } catch {
    return ["metric_demand_program_wire_json_invalid"];
  }
  const snapshot = snapshotParsedJson(parsed);
  if (!snapshot.ok) return [snapshot.violation];
  try {
    const canonical = canonicalJson(snapshot.value);
    if (canonical !== value)
      return ["metric_demand_program_wire_not_canonical"];
    return canonical ===
      NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM_CANONICAL_JSON
      ? ["metric_demand_program_external_copy_not_authoritative"]
      : ["metric_demand_program_semantic_mismatch"];
  } catch {
    return ["metric_demand_program_wire_invalid"];
  }
};

export const isNhm2SphericalBosonStarV2MetricDemandProgramV1 = (
  value: unknown,
): value is Nhm2SphericalBosonStarV2MetricDemandProgramV1 =>
  value === NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM;
