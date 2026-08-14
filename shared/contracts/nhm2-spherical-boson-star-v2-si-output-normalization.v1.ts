import { createHash } from "node:crypto";

import {
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_SHA256,
} from "./nhm2-spherical-boson-star-v2-candidate-freeze.v1";

export const NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_ARTIFACT_ID =
  "nhm2.spherical_boson_star_v2.si_output_normalization" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_CONTRACT_VERSION =
  "nhm2_spherical_boson_star_v2_si_output_normalization/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_INPUT_ID =
  "normalization_si_output_conversion_graph" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_PHASE =
  "pre_execution_static_si_conversion_graph_freeze_no_numeric_materialization" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BINDING_PINS =
  Object.freeze({
    candidateFreezeSha256:
      "628092507b7dc1be76722f06a7b591efc59d1799bed0d4b7d1999d852d92f28f",
    candidateFreezeCanonicalSizeBytes: 55_997,
    codata2022RawSha256:
      "5a7e10ed709577c224cf45f78199dd143a7f9cf10d6f8fe8c018e168454b7a61",
    codata2022RawSizeBytes: 6_180,
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_VALIDATOR_LIMITS =
  Object.freeze({
    maximumDepth: 32,
    maximumNodes: 16_384,
    maximumArrayLength: 512,
    maximumObjectPropertyCount: 256,
    maximumPropertyKeyUtf8Bytes: 4_096,
    maximumStringUtf8Bytes: 32_768,
    maximumAggregateUtf8Bytes: 1_048_576,
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BLOCKERS =
  Object.freeze([
    "codata_2022_raw_bytes_not_rehashed_into_scientific_preseal",
    "primary_mpfr256_si_conversion_implementation_and_executable_binding_absent",
    "source_disjoint_independent_mpfr256_si_conversion_implementation_and_executable_binding_absent",
    "directed_rounding_conformance_and_forbidden_flag_receipts_absent",
    "central_one_sigma_and_k2_scale_interval_materialization_receipts_absent",
    "candidate_manifest_and_scientific_preseal_absent",
    "spherical_state_geometry_noise_and_constraint_execution_not_admitted",
  ] as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_AUTHORITY_LOCKS =
  Object.freeze({
    constantsRawBytesRehashedForScientificPreseal: false as const,
    intervalKernelBound: false as const,
    intervalKernelVerified: false as const,
    scaleIntervalsMaterialized: false as const,
    normalizationReceipt: null,
    candidateManifestMaterialized: false as const,
    scientificPresealMaterialized: false as const,
    executionAuthorized: false as const,
    executionObserved: false as const,
    resultAuthority: false as const,
    outputArraysPresent: false as const,
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

const DIRECTED_POSITIVE_INTERVAL_PRIMITIVES = Object.freeze({
  decimal:
    "decimal(s)=[mpfr_set_str(base10,s,MPFR_RNDD),mpfr_set_str(base10,s,MPFR_RNDU)]_with_the_same_ASCII_string_and_no_binary64_intermediate",
  exactUnsignedInteger:
    "uint(n)=allocate_distinct_fresh_lower_then_upper_MPFR256_destinations;mpfr_set_ui(lower,n,MPFR_RNDN);require_ternary_zero;mpfr_set(upper,lower,MPFR_RNDN);require_ternary_zero_and_exact_equality;lower_and_upper_storage_identity_must_differ",
  exactDyadic:
    "dyadic(m,e2)=allocate_distinct_fresh_mantissa_then_lower_then_upper_MPFR256_destinations;mpfr_set_z(mantissa,m,MPFR_RNDN);require_ternary_zero;mpfr_mul_2si(lower,mantissa,e2,MPFR_RNDN);require_ternary_zero;mpfr_set(upper,lower,MPFR_RNDN);require_ternary_zero_and_exact_equality;all_three_storage_identities_must_differ",
  add: "addPos([a,b],[c,d])=[mpfr_add(a,c,MPFR_RNDD),mpfr_add(b,d,MPFR_RNDU)]",
  subtract:
    "subGeneral([a,b],[c,d])=[mpfr_sub(a,d,MPFR_RNDD),mpfr_sub(b,c,MPFR_RNDU)]",
  multiply:
    "mulPos([a,b],[c,d])=[mpfr_mul(a,c,MPFR_RNDD),mpfr_mul(b,d,MPFR_RNDU)]_only_after_all_four_endpoints_are_proved_nonnegative",
  divide:
    "divPos([a,b],[c,d])=[mpfr_div(a,d,MPFR_RNDD),mpfr_div(b,c,MPFR_RNDU)]_only_after_0<c<=d",
  square:
    "squarePos([a,b])=[mpfr_mul(a,a,MPFR_RNDD),mpfr_mul(b,b,MPFR_RNDU)]_only_after_0<=a<=b",
  squareRoot:
    "sqrtPos([a,b])=[mpfr_sqrt(a,MPFR_RNDD),mpfr_sqrt(b,MPFR_RNDU)]_only_after_0<=a<=b",
  generalMultiply:
    "mulGeneral([a,b],[c,d])=[minimum_of_four_mpfr_mul_RNDD_endpoint_products,maximum_of_four_mpfr_mul_RNDU_endpoint_products]_with_all_eight_products_evaluated_fresh_in_order_ac_ad_bc_bd",
  symmetricHull:
    "symmetricHull(center,u,k)=[mpfr_sub(center.lower,mpfr_mul(k,u.upper,MPFR_RNDU),MPFR_RNDD),mpfr_add(center.upper,mpfr_mul(k,u.upper,MPFR_RNDU),MPFR_RNDU)]",
} as const);

const EXACT_ENDPOINT_CONSTRUCTION_ORDER = Object.freeze({
  exactUnsignedInteger: Object.freeze([
    "01_allocate_fresh_MPFR256_lower_destination",
    "02_allocate_fresh_MPFR256_upper_destination",
    "03_require_lower_and_upper_storage_identity_distinct",
    "04_lower_ternary=mpfr_set_ui(lower,n,MPFR_RNDN)",
    "05_require_lower_ternary_equal_zero_and_lower_exact",
    "06_upper_ternary=mpfr_set(upper,lower,MPFR_RNDN)",
    "07_require_upper_ternary_equal_zero_and_upper_exact",
    "08_require_mpfr_equal_p(lower,upper)_and_no_endpoint_alias",
  ] as const),
  exactDyadic: Object.freeze([
    "01_allocate_fresh_MPFR256_mantissa_destination",
    "02_allocate_fresh_MPFR256_lower_destination",
    "03_allocate_fresh_MPFR256_upper_destination",
    "04_require_mantissa_lower_and_upper_storage_identities_pairwise_distinct",
    "05_mantissa_ternary=mpfr_set_z(mantissa,m,MPFR_RNDN)",
    "06_require_mantissa_ternary_equal_zero_and_integer_exact",
    "07_lower_ternary=mpfr_mul_2si(lower,mantissa,e2,MPFR_RNDN)",
    "08_require_lower_ternary_equal_zero_and_dyadic_exact",
    "09_upper_ternary=mpfr_set(upper,lower,MPFR_RNDN)",
    "10_require_upper_ternary_equal_zero_and_upper_exact",
    "11_require_mpfr_equal_p(lower,upper)_and_no_endpoint_alias",
  ] as const),
} as const);

const CENTRAL_ELEMENT_OPERATION_ORDER = Object.freeze([
  "01_inject_exact_input_binary64_dyadic_into_fresh_MPFR256_centralInput_without_rounding",
  "02_clear_MPFR_flags",
  "03_centralProduct=mpfr_mul(centralInput,centralScaleN,MPFR_RNDN)",
  "04_check_ternary_and_forbidden_flags_and_require_finite_centralProduct",
  "05_centralF64=the_only_mpfr_get_d(centralProduct,MPFR_RNDN)_for_this_central_output_element",
  "06_reject_nonfinite_or_negative_zero_centralF64",
  "07_serialize_centralF64_bit_pattern_once_as_f64le_and_bind_it_to_the_paired_uncertainty_element",
] as const);

const UNCERTAINTY_ELEMENT_OPERATION_ORDER = Object.freeze([
  "01_inject_exact_central_input_binary64_dyadic_into_fresh_MPFR256_inputCenter_without_rounding",
  "02_inject_exact_nonnegative_input_uncertainty_binary64_dyadic_into_fresh_MPFR256_inputUncertainty_without_rounding",
  "03_require_inputUncertainty_greater_than_or_equal_to_zero",
  "04_valueHullLower=mpfr_sub(inputCenter,inputUncertainty,MPFR_RNDD)",
  "05_valueHullUpper=mpfr_add(inputCenter,inputUncertainty,MPFR_RNDU)",
  "06_scaledHull=mulGeneral([valueHullLower,valueHullUpper],admissionScaleInterval)_with_the_frozen_eight_product_order",
  "07_read_the_exact_already_serialized_paired_centralF64_bit_pattern_without_a_second_central_conversion",
  "08_inject_paired_centralF64_as_an_exact_binary64_dyadic_into_fresh_MPFR256_serializedCenter_without_rounding",
  "09_require_scaledHull.lower_less_than_or_equal_to_serializedCenter_less_than_or_equal_to_scaledHull.upper",
  "10_lowerDistanceUpper=mpfr_sub(serializedCenter,scaledHull.lower,MPFR_RNDU)",
  "11_upperDistanceUpper=mpfr_sub(scaledHull.upper,serializedCenter,MPFR_RNDU)",
  "12_maxDistanceUpper=the_larger_of_lowerDistanceUpper_and_upperDistanceUpper_with_lower_selected_on_exact_tie_and_no_arithmetic",
  "13_uncertaintyF64=the_only_mpfr_get_d(maxDistanceUpper,MPFR_RNDU)_for_this_uncertainty_output_element",
  "14_reject_nonfinite_negative_or_negative_zero_uncertaintyF64",
  "15_reinject_uncertaintyF64_as_an_exact_binary64_dyadic_into_fresh_MPFR256_serializedUncertainty_without_rounding",
  "16_require_serializedUncertainty_greater_than_or_equal_to_lowerDistanceUpper_and_upperDistanceUpper",
  "17_serialize_the_already_checked_uncertaintyF64_bit_pattern_once_as_f64le",
] as const);

const SCALE_GRAPH_ORDER = Object.freeze([
  "01_g=dyadic(1,-40)",
  "02_c=uint(299792458)",
  "03_h=decimal(6.62607015e-34)",
  "04_pi=[mpfr_const_pi(MPFR_RNDD),mpfr_const_pi(MPFR_RNDU)]",
  "05_two=uint(2)",
  "06_eight=uint(8)",
  "07_twoPi=mulPos(two,pi)",
  "08_hbar=divPos(h,twoPi)",
  "09_GCentral=decimal(6.67430e-11)",
  "10_GStandardUncertainty=decimal(1.5e-15)",
  "11_GOneSigma=symmetricHull(GCentral,GStandardUncertainty,uint(1))",
  "12_GAdmissionK2=symmetricHull(GCentral,GStandardUncertainty,uint(2))",
  "13_eightPi=mulPos(eight,pi)",
  "14_c2=mulPos(c,c)",
  "15_c3=mulPos(c2,c)",
  "16_c4=mulPos(c2,c2)",
  "17_c5=mulPos(c4,c)",
  "18_c7=mulPos(c4,c3)",
  "19_gHbar=mulPos(g,hbar)",
  "20_gHbarC5=mulPos(gHbar,c5)",
  "21_eightPiGCentral=mulPos(eightPi,GCentral)",
  "22_muECentralSquared=divPos(gHbarC5,eightPiGCentral)",
  "23_muECentral=sqrtPos(muECentralSquared)",
  "24_hbarC=mulPos(hbar,c)",
  "25_muLCentral=divPos(muECentral,hbarC)",
  "26_muLCentralSquared=squarePos(muLCentral)",
  "27_c4MuLCentralSquared=mulPos(c4,muLCentralSquared)",
  "28_stressScaleCentralViaMu=divPos(c4MuLCentralSquared,eightPiGCentral)",
  "29_eightPiGCentralSquared=squarePos(eightPiGCentral)",
  "30_eightPiGCentralSquaredHbar=mulPos(eightPiGCentralSquared,hbar)",
  "31_gC7=mulPos(g,c7)",
  "32_stressScaleCentral=divPos(gC7,eightPiGCentralSquaredHbar)",
  "33_noiseScaleCentral=squarePos(stressScaleCentral)",
  "34_eightPiGOneSigma=mulPos(eightPi,GOneSigma)",
  "35_muEOneSigmaSquared=divPos(gHbarC5,eightPiGOneSigma)",
  "36_muEOneSigma=sqrtPos(muEOneSigmaSquared)",
  "37_muLOneSigma=divPos(muEOneSigma,hbarC)",
  "38_eightPiGOneSigmaSquared=squarePos(eightPiGOneSigma)",
  "39_eightPiGOneSigmaSquaredHbar=mulPos(eightPiGOneSigmaSquared,hbar)",
  "40_stressScaleOneSigma=divPos(gC7,eightPiGOneSigmaSquaredHbar)",
  "41_noiseScaleOneSigma=squarePos(stressScaleOneSigma)",
  "42_eightPiGAdmissionK2=mulPos(eightPi,GAdmissionK2)",
  "43_muEAdmissionK2Squared=divPos(gHbarC5,eightPiGAdmissionK2)",
  "44_muEAdmissionK2=sqrtPos(muEAdmissionK2Squared)",
  "45_muLAdmissionK2=divPos(muEAdmissionK2,hbarC)",
  "46_eightPiGAdmissionK2Squared=squarePos(eightPiGAdmissionK2)",
  "47_eightPiGAdmissionK2SquaredHbar=mulPos(eightPiGAdmissionK2Squared,hbar)",
  "48_stressScaleAdmissionK2=divPos(gC7,eightPiGAdmissionK2SquaredHbar)",
  "49_noiseScaleAdmissionK2=squarePos(stressScaleAdmissionK2)",
] as const);

const CENTRAL_RNDN_GRAPH_ORDER = Object.freeze([
  "01_gN=exact_dyadic_2^-40",
  "02_cN=mpfr_set_ui(299792458,MPFR_RNDN)",
  "03_hN=mpfr_set_str(6.62607015e-34,base10,MPFR_RNDN)",
  "04_piN=mpfr_const_pi(MPFR_RNDN)",
  "05_twoN=mpfr_set_ui(2,MPFR_RNDN)",
  "06_eightN=mpfr_set_ui(8,MPFR_RNDN)",
  "07_twoPiN=mpfr_mul(twoN,piN,MPFR_RNDN)",
  "08_hbarN=mpfr_div(hN,twoPiN,MPFR_RNDN)",
  "09_GN=mpfr_set_str(6.67430e-11,base10,MPFR_RNDN)",
  "10_eightPiN=mpfr_mul(eightN,piN,MPFR_RNDN)",
  "11_c2N=mpfr_mul(cN,cN,MPFR_RNDN)",
  "12_c3N=mpfr_mul(c2N,cN,MPFR_RNDN)",
  "13_c4N=mpfr_mul(c2N,c2N,MPFR_RNDN)",
  "14_c5N=mpfr_mul(c4N,cN,MPFR_RNDN)",
  "15_c7N=mpfr_mul(c4N,c3N,MPFR_RNDN)",
  "16_gHbarN=mpfr_mul(gN,hbarN,MPFR_RNDN)",
  "17_gHbarC5N=mpfr_mul(gHbarN,c5N,MPFR_RNDN)",
  "18_eightPiGN=mpfr_mul(eightPiN,GN,MPFR_RNDN)",
  "19_muE2N=mpfr_div(gHbarC5N,eightPiGN,MPFR_RNDN)",
  "20_muEN=mpfr_sqrt(muE2N,MPFR_RNDN)",
  "21_hbarCN=mpfr_mul(hbarN,cN,MPFR_RNDN)",
  "22_muLN=mpfr_div(muEN,hbarCN,MPFR_RNDN)",
  "23_eightPiG2N=mpfr_mul(eightPiGN,eightPiGN,MPFR_RNDN)",
  "24_eightPiG2HbarN=mpfr_mul(eightPiG2N,hbarN,MPFR_RNDN)",
  "25_gC7N=mpfr_mul(gN,c7N,MPFR_RNDN)",
  "26_stressScaleN=mpfr_div(gC7N,eightPiG2HbarN,MPFR_RNDN)",
  "27_noiseScaleN=mpfr_mul(stressScaleN,stressScaleN,MPFR_RNDN)",
] as const);

const CONTRACT = {
  artifactId: NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_ARTIFACT_ID,
  contractVersion:
    NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_CONTRACT_VERSION,
  inputId: NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_INPUT_ID,
  phase: NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_PHASE,
  authority:
    "pre_execution_static_scientific_normalization_formula_freeze_no_execution_or_result_authority",
  maturity:
    "stage_2_exact_symbolic_and_directed_rounding_contract_unmaterialized",
  candidateIdentity: {
    candidateId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
    normalizationId:
      "nhm2.semiclassical_v2.spherical_boson_star_1s.dimensionless_si_output_normalization/v1",
    sourceMode: "state_derived_not_declared_lever",
    declaredLeverTensorUsed: false,
    declaredTileTensorUsed: false,
    dimensionlessCoupling: {
      symbol: "g",
      definitionNaturalUnits: "g=8*pi*G_nat*mu_nat^2",
      exact: "2^-40",
      dyadicMantissa: "1",
      dyadicExponent2: -40,
      exactValueMayBeChangedAfterObservation: false,
    },
  },
  exactBindings: {
    candidateFreeze: {
      artifactId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE.artifactId,
      contractVersion:
        NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE.contractVersion,
      sha256:
        NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BINDING_PINS.candidateFreezeSha256,
      canonicalSizeBytes:
        NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BINDING_PINS.candidateFreezeCanonicalSizeBytes,
      mediaType: "application/json",
    },
    constantsRegistryRawBytes: {
      path: "configs/constants/codata-2022.v1.json",
      sha256:
        NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BINDING_PINS.codata2022RawSha256,
      sizeBytes:
        NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BINDING_PINS.codata2022RawSizeBytes,
      mediaType: "application/json",
      schemaVersion: "v1",
      registryId: "codata-2022-curvature-leverage",
      sourceId: "nist-codata-2022",
      sourceUrl: "https://physics.nist.gov/constants",
      sourceEdition: "CODATA_2022",
      rawBytesAreAuthorityNotAParsedAndReserializedProjection: true,
      serverMustRehashExactRawBytesBeforeScientificPreseal: true,
      pathRealpathContainmentAndRegularFileChecksRequired: true,
    },
  },
  dimensionalDerivation: {
    naturalUnits: "c=hbar=1",
    couplingReintroduction: "g=8*pi*G_SI*mu_E^2/(hbar*c^5)=2^-40",
    massEnergyScale: "mu_E=sqrt(g*hbar*c^5/(8*pi*G_SI))",
    inverseLengthScale: "mu_L=mu_E/(hbar*c)=sqrt(g*c^3/(8*pi*G_SI*hbar))",
    coordinateMap: {
      radial: "x=mu_L*r_SI",
      time: "tau=mu_E*t_SI/hbar=mu_L*c*t_SI",
      sourceCandidateNotation:
        "the_source_symbols_x=mu*r_and_tau=mu*t_are_natural_unit_shorthand_and_mu_is_reintroduced_as_mu_L_for_length_and_mu_E/hbar_for_time",
    },
    barredEinsteinEquation: "Gbar^a_b=Tbar^a_b",
    physicalEinsteinEquation: "G^a_b=(8*pi*G_SI/c^4)*T^a_b_SI",
    curvatureScale: "G^a_b=mu_L^2*Gbar^a_b",
    stressScalePrimary: "stressScale_J_m3=c^4*mu_L^2/(8*pi*G_SI)",
    stressScaleClosed: "stressScale_J_m3=g*c^7/((8*pi*G_SI)^2*hbar)",
    noiseScale: "noiseScale_(J_m3)^2=stressScale_J_m3^2",
    algebraicIdentityRequired:
      "the_directed_intervals_stressScaleCentralViaMu_and_stressScaleCentral_must_overlap",
    dimensionalChecks: {
      muE: "J",
      muL: "m^-1",
      stressScale: "J/m^3",
      noiseScale: "(J/m^3)^2",
    },
    formulaOrUnitRetuningAfterObservationAllowed: false,
  },
  constants: {
    speedOfLight: {
      symbol: "c",
      exactDecimal: "299792458",
      unit: "m/s",
      exactBySI: true,
    },
    planckConstant: {
      symbol: "h",
      exactDecimal: "6.62607015e-34",
      unit: "J*s",
      exactBySI: true,
    },
    reducedPlanckConstant: {
      symbol: "hbar",
      formula: "h/(2*pi)",
      unit: "J*s",
      exactConfigDecimalUsedAsInput: false,
      configProjectionValue: "1.0545718176461565e-34",
      configProjectionIsOnlyANonnormativeRoundedCrossCheck: true,
    },
    newtonianConstant: {
      symbol: "G",
      centralDecimal: "6.67430e-11",
      parentheticalNotation: "6.67430(15)e-11",
      standardUncertaintyDecimal: "1.5e-15",
      unit: "m^3*kg^-1*s^-2",
      sourceUncertaintyKind: "one_sigma_standard_uncertainty",
      exact: false,
      configCentralValueMatches: true,
      configRelativeUncertaintyDecimal: "0.000022",
      configRelativeUncertaintyIsRoundedMetadataNotEndpointAuthority: true,
    },
  },
  decimalAndPiInterpretation: {
    characterEncoding: "ASCII",
    decimalGrammar:
      "optional_plus_then_decimal_integer_or_finite_fraction_then_optional_lowercase_e_signed_base10_exponent_with_no_whitespace",
    finiteDecimalSemantics:
      "exact_rational_integer_significand_times_10_to_the_integer_exponent_before_MPFR_rounding",
    exactIntegerAndDyadicSemantics:
      "mathematical_exact_value_must_be_representable_at_256_bits_or_the_run_fails",
    noBinary64OrJavaScriptNumberIntermediate: true,
    pi: {
      mathematicalSource:
        "the_unique_positive_real_ratio_of_circle_circumference_to_diameter",
      implementationPrimitive: "MPFR_mpfr_const_pi",
      lowerConstruction: "mpfr_const_pi(destination,MPFR_RNDD)",
      upperConstruction: "mpfr_const_pi(destination,MPFR_RNDU)",
      centralConstruction: "mpfr_const_pi(destination,MPFR_RNDN)",
      MathPIAllowed: false,
      decimalPiLiteralAllowed: false,
    },
  },
  uncertaintyPolicy: {
    sourceStandardUncertainty: {
      coverageFactorExact: "1",
      GIntervalExactDecimal: Object.freeze([
        "6.67415e-11",
        "6.67445e-11",
      ] as const),
      role: "reported_one_sigma_scale_sensitivity_only",
    },
    admissionEnclosure: {
      policyId: "codata_standard_uncertainty_expanded_k2/v1",
      coverageFactorExact: "2",
      GIntervalExactDecimal: Object.freeze([
        "6.67400e-11",
        "6.67460e-11",
      ] as const),
      intendedUse:
        "normalization_component_of_absolute_uncertainty95_and_metric_demand_error_enclosure",
      approximately95PercentUnderUsualExpandedUncertaintyInterpretation: true,
      rigorousProbabilityOrHardPhysicalBoundClaim: false,
      statisticalTailsOutsideFiniteIntervalExcludedByTheSourceData: false,
      mayBeCalledExact95PercentConfidenceInterval: false,
      physicalClaimUnlockAllowed: false,
    },
    centralValueMayBeTreatedAsExact: false,
    oneSigmaIntervalMayReplaceK2AdmissionInterval: false,
    configRoundedRelativeUncertaintyMayReplaceParentheticalUncertainty: false,
    observedOutputMaySelectCoverageFactor: false,
    widerOrNarrowerPostObservationEnvelopeAllowed: false,
  },
  mpfr256Context: {
    library: "GNU_MPFR",
    precisionBitsForEveryDestination: 256,
    exponentMinimum: -1_000_000,
    exponentMaximum: 1_000_000,
    setExponentRangeBeforeAnyConstantConstruction: true,
    restoreCallerExponentRangeAfterReceiptFinalization: true,
    lowerRoundingMode: "MPFR_RNDD",
    upperRoundingMode: "MPFR_RNDU",
    centralRoundingMode: "MPFR_RNDN",
    dedicatedSinglePurposeProcessRequired: true,
    concurrentMutationOfMpfrGlobalExponentRangeAllowed: false,
    primitiveOperationReassociationAllowed: false,
    fusedMultiplyAddSubstitutionAllowed: false,
    extendedOrReducedPrecisionAllowed: false,
    intervalPrimitives: DIRECTED_POSITIVE_INTERVAL_PRIMITIVES,
    exactEndpointConstructionOrder: EXACT_ENDPOINT_CONSTRUCTION_ORDER,
    scaleGraphOrder: SCALE_GRAPH_ORDER,
    centralRepresentativeGraphOrder: CENTRAL_RNDN_GRAPH_ORDER,
    scaleGraphNodeCount: 49,
    centralRepresentativeGraphNodeCount: 27,
    everyNamedNodeHasFreshDestination: true,
    endpointAliasingAllowed: false,
    exactEndpointEqualityMayUseSharedStorageIdentity: false,
    endpointStorageIdentityCheckedBeforeFirstWrite: true,
    forbiddenFlagsInOrder: Object.freeze([
      "invalid",
      "divide_by_zero",
      "overflow",
      "underflow",
      "erange",
    ] as const),
    inexactFlagExpectedAndNeverUsedAsFailureOrBranchAuthority: true,
    clearFlagsImmediatelyBeforeEveryNamedPrimitive: true,
    checkForbiddenFlagsImmediatelyAfterEveryNamedPrimitive: true,
    requireFiniteNonNaNOrderedEndpointsAfterEveryIntervalNode: true,
    requireStrictlyPositiveEndpointsForGAndEveryScale: true,
    requireCentralViaMuAndClosedStressIntervalsOverlap: true,
    centralRepresentativeUsesReportedCentralGButDoesNotMakeGExact: true,
    unresolvedIntervalEndpointOrderOrRoundingModeBlocksExecution: true,
    runtimeMpfrVersionSourceExecutableAndLibraryHashesRequiredBeforePreseal: true,
  },
  scaleMaterializationReceiptSchema: {
    materialized: false,
    receipt: null,
    requiredScaleIdsInOrder: Object.freeze([
      "mu_E_central",
      "mu_L_central",
      "stress_scale_central_via_mu",
      "stress_scale_central_closed",
      "noise_scale_central",
      "mu_E_one_sigma",
      "mu_L_one_sigma",
      "stress_scale_one_sigma",
      "noise_scale_one_sigma",
      "mu_E_admission_k2",
      "mu_L_admission_k2",
      "stress_scale_admission_k2",
      "noise_scale_admission_k2",
    ] as const),
    endpointEncoding:
      "canonical_MPFR256_dyadic_endpoint_{sign,mantissaLowercaseHex,exponent2,precisionBits,direction}",
    lowerDirection: "RNDD",
    upperDirection: "RNDU",
    centralReceiptEncoding:
      "canonical_MPFR256_value_plus_no_intermediate_get_d_trace",
    exactGraphNodeTernaryResultsAndForbiddenFlagsRequired: true,
    primaryAndIndependentReceiptsRequired: true,
    primaryAndIndependentSourceDependencyExecutableRootsMustBeDisjoint: true,
    exactEndpointAgreementRequired: false,
    eachImplementationMustEncloseTheOtherCentralRepresentative: true,
    intervalsMustOverlapAndDifferByNoMoreThanFrozenMpfrRoundingAuditBound: true,
    roundingAuditBound: null,
    unresolvedRoundingAuditBoundBlocksExecution: true,
  },
  outputScaling: {
    scaleContextConstructedOncePerImplementationBeforeAnyArrayElement: true,
    scaleContextImmutableUntilAllOutputsAndReceiptAreFsyncComplete: true,
    scientificInputRoleOrder: Object.freeze([
      "metric_demand_tensor",
      "metric_demand_absolute_error_bound",
    ] as const),
    rawOutputFamilyOrder: Object.freeze([
      "noise_kernel",
      "noise_kernel_absolute_uncertainty95",
      "mean_rset",
      "mean_rset_absolute_uncertainty95",
      "smearing_weights",
      "constraint_operand.level_0_then_level_1_then_level_2",
    ] as const),
    mappings: Object.freeze([
      Object.freeze({
        role: "metric_demand_tensor",
        inputUnit: "barred_stress",
        outputUnit: "J/m^3",
        centralScaleId: "stressScaleN",
        admissionScaleIntervalId: "stressScaleAdmissionK2",
        elementProgramId: "central_scaled_value",
        pairedUncertaintyRole: "metric_demand_absolute_error_bound",
      }),
      Object.freeze({
        role: "metric_demand_absolute_error_bound",
        inputUnit: "barred_stress_absolute_error",
        outputUnit: "J/m^3",
        centralScaleId: null,
        admissionScaleIntervalId: "stressScaleAdmissionK2",
        elementProgramId: "paired_central_and_uncertainty_hull",
        pairedCentralRole: "metric_demand_tensor",
      }),
      Object.freeze({
        role: "mean_rset",
        inputUnit: "barred_stress",
        outputUnit: "J/m^3",
        centralScaleId: "stressScaleN",
        admissionScaleIntervalId: "stressScaleAdmissionK2",
        elementProgramId: "central_scaled_value",
        pairedUncertaintyRole: "mean_rset_absolute_uncertainty95",
      }),
      Object.freeze({
        role: "mean_rset_absolute_uncertainty95",
        inputUnit: "barred_stress_absolute_uncertainty95",
        outputUnit: "J/m^3",
        centralScaleId: null,
        admissionScaleIntervalId: "stressScaleAdmissionK2",
        elementProgramId: "paired_central_and_uncertainty_hull",
        pairedCentralRole: "mean_rset",
      }),
      Object.freeze({
        role: "noise_kernel",
        inputUnit: "barred_stress_squared",
        outputUnit: "(J/m^3)^2",
        centralScaleId: "noiseScaleN",
        admissionScaleIntervalId: "noiseScaleAdmissionK2",
        elementProgramId: "central_scaled_value",
        pairedUncertaintyRole: "noise_kernel_absolute_uncertainty95",
      }),
      Object.freeze({
        role: "noise_kernel_absolute_uncertainty95",
        inputUnit: "barred_stress_squared_absolute_uncertainty95",
        outputUnit: "(J/m^3)^2",
        centralScaleId: null,
        admissionScaleIntervalId: "noiseScaleAdmissionK2",
        elementProgramId: "paired_central_and_uncertainty_hull",
        pairedCentralRole: "noise_kernel",
      }),
      Object.freeze({
        role: "smearing_weights",
        inputUnit: "dimensionless",
        outputUnit: "dimensionless",
        centralScaleId: null,
        admissionScaleIntervalId: null,
        elementProgramId: "dimensionless_bit_copy",
        pairedCentralRole: null,
      }),
      Object.freeze({
        role: "constraint_operand.*",
        inputUnit: "dimensionless_normalized_constraint_bracket",
        outputUnit: "dimensionless",
        centralScaleId: null,
        admissionScaleIntervalId: null,
        elementProgramId: "dimensionless_bit_copy",
        pairedCentralRole: null,
      }),
    ] as const),
    centralElementProgram:
      "inject_exact_input_binary64_dyadic;centralProduct=mpfr_mul(input,centralScaleN,MPFR_RNDN);centralF64=the_only_mpfr_get_d(centralProduct,MPFR_RNDN);validate_and_serialize_centralF64_once;bind_those_exact_bits_to_the_paired_uncertainty_element",
    centralElementOperationOrder: CENTRAL_ELEMENT_OPERATION_ORDER,
    uncertaintyElementProgram:
      "form_the_directed_scaled_value_hull;reinject_the_exact_already_serialized_paired_centralF64_bits_as_the_distance_center;require_center_inside_hull;compute_both_endpoint_distances_with_MPFR_RNDU;convert_their_maximum_once_with_mpfr_get_d(MPFR_RNDU);reinject_and_require_the_emitted_uncertaintyF64_to_enclose_both_distances_before_serialization",
    uncertaintyElementOperationOrder: UNCERTAINTY_ELEMENT_OPERATION_ORDER,
    pairedCentralSerializedF64IsTheOnlyUncertaintyDistanceCenter: true,
    unroundedMpfrCentralProductMayCenterOutputUncertainty: false,
    secondCentralMpfrGetDInsideUncertaintyProgramAllowed: false,
    terminalCenterRoundingMayBeOmittedFromByteEnclosure: false,
    byteLevelEnclosurePostcondition:
      "exactMPFR(serialized_uncertainty_f64)>=max(serialized_center_f64_exactMPFR-scaled_hull_lower,scaled_hull_upper-serialized_center_f64_exactMPFR)",
    byteLevelEnclosurePostconditionCheckedBeforeUncertaintySerialization: true,
    byteLevelEnclosureFailureDisposition:
      "fail_this_v2_candidate_without_retuning_or_emitting_the_element",
    standaloneAbsoluteErrorScalingAllowed: false,
    dimensionlessPassThroughProgram:
      "verify_finite_nonnegative_when_role_requires_and_not_negative_zero_then_bit_copy_the_already_frozen_f64le_value_without_arithmetic",
    rowMajorElementOrder: {
      metricDemandAndMean: "sample_ordinal_outer_then_tensor_component_inner",
      noise:
        "first_sample_ordinal_outer_then_second_sample_ordinal_middle_then_component_pair_ordinal_inner",
      smearingWeights: "sample_ordinal_increasing",
      constraints:
        "level_ordinal_then_family_order_H_H_H_Hi_Hi_Hj_antisymmetry_jacobi_then_source_role_then_sample_then_constraint_component",
    },
    uncertaintyMustIncludeBothDimensionlessAndK2NormalizationContributions: true,
    centralAndUncertaintyArraysMayNotBeScaledIndependently: true,
    perSamplePerComponentOrOutputDependentScaleAllowed: false,
    intermediateBinary64ScaleOrProductAllowed: false,
    exactlyOneTerminalBinary64BarrierPerScaledElement: true,
    scaleBarrierBeforeElementMultiplicationAllowed: false,
    postSerializationRescalingAllowed: false,
    submittedSIBytesMayBeTrustedWithoutServerReplayOfThisGraph: false,
  },
  failurePolicy: {
    anyConstantHashIntervalEndpointRoundingFlagUnitOrBarrierMismatch:
      "fail_this_v2_candidate_before_or_during_execution_without_retuning",
    postObservationConstantEditionChangeAllowed: false,
    postObservationCoverageFactorChangeAllowed: false,
    postObservationFormulaOrOperationReorderAllowed: false,
    candidateRelabelOrFallbackBranchAllowed: false,
    uncertainGMayBeReplacedByCentralPointForAdmission: false,
  },
  completion: {
    dimensionalMappingFrozen: true,
    constantsEditionAndRawByteBindingFrozen: true,
    GUncertaintyAndAdmissionPolicyFrozen: true,
    directedMpfr256GraphFrozen: true,
    outputOrderAndOnceOnlyBarriersFrozen: true,
    constantsRawBytesRehashedForScientificPreseal: false,
    scaleEndpointsMaterialized: false,
    primaryImplementationBound: false,
    independentImplementationBound: false,
    independentAgreementObserved: false,
    normalizationScientificInputContentComplete: false,
    candidateExecutionMayStart: false,
  },
  materialization: {
    implementationPresent: false,
    primaryImplementationBinding: null,
    independentImplementationBinding: null,
    runtimeManifest: null,
    scientificPresealReceipt: null,
    scaleReceipt: null,
    executionReceipt: null,
    replayReceipt: null,
    independentAgreementReceipt: null,
    result: null,
    lamps: null,
  },
  blockers: NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BLOCKERS,
  authorityLocks:
    NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_AUTHORITY_LOCKS,
} as const;

const deepFreeze = <T>(value: T, seen = new Set<object>()): T => {
  if (value == null || typeof value !== "object" || seen.has(value as object)) {
    return value;
  }
  seen.add(value as object);
  for (const key of Reflect.ownKeys(value as object)) {
    const descriptor = Object.getOwnPropertyDescriptor(value as object, key);
    if (descriptor != null && "value" in descriptor) {
      deepFreeze(descriptor.value, seen);
    }
  }
  return Object.freeze(value);
};

export const NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION =
  deepFreeze(CONTRACT);
export type Nhm2SphericalBosonStarV2SiOutputNormalizationV1 =
  typeof NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION;

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

export const NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_CANONICAL_JSON =
  canonicalJson(NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION);
export const NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-si-output-normalization/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_SHA256 =
  createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_CANONICAL_JSON,
    "utf8",
  );
export const NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_EXPECTED_SHA256 =
  "16224114ce7bc790d1e5ceeaf8f75e31e5c37412856c5bea8b99284301bf3c24" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_EXPECTED_CANONICAL_SIZE_BYTES =
  23_822 as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BINDING =
  Object.freeze({
    artifactId:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_CONTRACT_VERSION,
    inputId: NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_INPUT_ID,
    candidateId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
    sha256Domain:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_SHA256_DOMAIN,
    sha256: NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_SHA256,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_CANONICAL_SIZE_BYTES,
    mediaType: "application/json" as const,
  });

const MAXIMUM_CANONICAL_WIRE_CODE_UNITS =
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_VALIDATOR_LIMITS.maximumAggregateUtf8Bytes;

const canonicalWireViolation = (value: unknown): string | null => {
  if (typeof value !== "string") return "canonical_json_text_required";
  if (value.length > MAXIMUM_CANONICAL_WIRE_CODE_UNITS) {
    return "canonical_json_code_unit_limit";
  }
  if (
    Buffer.byteLength(value, "utf8") >
    NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_VALIDATOR_LIMITS.maximumAggregateUtf8Bytes
  ) {
    return "canonical_json_utf8_byte_limit";
  }
  return value ===
    NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_CANONICAL_JSON
    ? null
    : "spherical_v2_si_output_normalization_semantic_drift";
};

const assertInvariants = (): void => {
  const pins =
    NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BINDING_PINS;
  const contract = NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION;
  if (
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_SHA256 !==
      pins.candidateFreezeSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_SIZE_BYTES !==
      pins.candidateFreezeCanonicalSizeBytes
  ) {
    throw new Error(
      "nhm2_spherical_v2_si_output_normalization_candidate_pin_drift",
    );
  }
  if (
    contract.candidateIdentity.candidateId !==
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID ||
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE.frozenScience.normalization
      .matterCoupling.exact !== "2^-40" ||
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE.frozenScience.normalization
      .matterCoupling.value !==
      2 ** -40 ||
    contract.candidateIdentity.dimensionlessCoupling.exact !== "2^-40"
  ) {
    throw new Error(
      "nhm2_spherical_v2_si_output_normalization_candidate_science_drift",
    );
  }
  if (
    contract.exactBindings.constantsRegistryRawBytes.sha256 !==
      pins.codata2022RawSha256 ||
    contract.exactBindings.constantsRegistryRawBytes.sizeBytes !==
      pins.codata2022RawSizeBytes ||
    contract.constants.speedOfLight.exactDecimal !== "299792458" ||
    contract.constants.planckConstant.exactDecimal !== "6.62607015e-34" ||
    contract.constants.newtonianConstant.parentheticalNotation !==
      "6.67430(15)e-11" ||
    contract.constants.newtonianConstant.exact !== false
  ) {
    throw new Error(
      "nhm2_spherical_v2_si_output_normalization_constants_invariant",
    );
  }
  if (
    SCALE_GRAPH_ORDER.length !== 49 ||
    CENTRAL_RNDN_GRAPH_ORDER.length !== 27 ||
    contract.uncertaintyPolicy.sourceStandardUncertainty.coverageFactorExact !==
      "1" ||
    contract.uncertaintyPolicy.admissionEnclosure.coverageFactorExact !== "2" ||
    contract.uncertaintyPolicy.admissionEnclosure
      .rigorousProbabilityOrHardPhysicalBoundClaim !== false ||
    contract.mpfr256Context.precisionBitsForEveryDestination !== 256 ||
    contract.mpfr256Context.exactEndpointConstructionOrder !==
      EXACT_ENDPOINT_CONSTRUCTION_ORDER ||
    contract.mpfr256Context.intervalPrimitives.exactUnsignedInteger.includes(
      "same_handle",
    ) ||
    contract.mpfr256Context.intervalPrimitives.exactDyadic.includes(
      "used_as_both_endpoints",
    ) ||
    contract.mpfr256Context.endpointAliasingAllowed !== false ||
    contract.mpfr256Context.exactEndpointEqualityMayUseSharedStorageIdentity !==
      false ||
    contract.mpfr256Context.endpointStorageIdentityCheckedBeforeFirstWrite !==
      true ||
    contract.mpfr256Context
      .unresolvedIntervalEndpointOrderOrRoundingModeBlocksExecution !== true
  ) {
    throw new Error(
      "nhm2_spherical_v2_si_output_normalization_interval_invariant",
    );
  }
  if (
    contract.outputScaling.rawOutputFamilyOrder.join("|") !==
      "noise_kernel|noise_kernel_absolute_uncertainty95|mean_rset|mean_rset_absolute_uncertainty95|smearing_weights|constraint_operand.level_0_then_level_1_then_level_2" ||
    contract.outputScaling.exactlyOneTerminalBinary64BarrierPerScaledElement !==
      true ||
    contract.outputScaling.centralElementOperationOrder !==
      CENTRAL_ELEMENT_OPERATION_ORDER ||
    contract.outputScaling.uncertaintyElementOperationOrder !==
      UNCERTAINTY_ELEMENT_OPERATION_ORDER ||
    contract.outputScaling
      .pairedCentralSerializedF64IsTheOnlyUncertaintyDistanceCenter !== true ||
    contract.outputScaling
      .unroundedMpfrCentralProductMayCenterOutputUncertainty !== false ||
    contract.outputScaling
      .secondCentralMpfrGetDInsideUncertaintyProgramAllowed !== false ||
    contract.outputScaling
      .terminalCenterRoundingMayBeOmittedFromByteEnclosure !== false ||
    contract.outputScaling.byteLevelEnclosurePostcondition !==
      "exactMPFR(serialized_uncertainty_f64)>=max(serialized_center_f64_exactMPFR-scaled_hull_lower,scaled_hull_upper-serialized_center_f64_exactMPFR)" ||
    contract.outputScaling
      .byteLevelEnclosurePostconditionCheckedBeforeUncertaintySerialization !==
      true ||
    contract.outputScaling
      .perSamplePerComponentOrOutputDependentScaleAllowed !== false
  ) {
    throw new Error(
      "nhm2_spherical_v2_si_output_normalization_output_invariant",
    );
  }
  if (
    Object.values(contract.authorityLocks).some(
      (value) => value !== false && value !== null,
    ) ||
    contract.completion.normalizationScientificInputContentComplete !== false ||
    contract.completion.candidateExecutionMayStart !== false ||
    Object.values(contract.materialization).some(
      (value) => value !== false && value !== null,
    )
  ) {
    throw new Error(
      "nhm2_spherical_v2_si_output_normalization_authority_invariant",
    );
  }
};

assertInvariants();

if (
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_SHA256 !==
    NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_EXPECTED_SHA256 ||
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_CANONICAL_SIZE_BYTES !==
    NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_EXPECTED_CANONICAL_SIZE_BYTES
) {
  throw new Error(
    `nhm2_spherical_v2_si_output_normalization_literal_pin_mismatch:${NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_SHA256}/${NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_CANONICAL_SIZE_BYTES}`,
  );
}

export const nhm2SphericalBosonStarV2SiOutputNormalizationViolations = (
  value: unknown,
): string[] => {
  try {
    const violation = canonicalWireViolation(value);
    return violation == null ? [] : [violation];
  } catch {
    return ["spherical_v2_si_output_normalization_wire_invalid"];
  }
};

export const isNhm2SphericalBosonStarV2SiOutputNormalizationV1 = (
  value: unknown,
): boolean =>
  nhm2SphericalBosonStarV2SiOutputNormalizationViolations(value).length === 0;

export const cloneNhm2SphericalBosonStarV2SiOutputNormalization = () =>
  JSON.parse(
    NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_CANONICAL_JSON,
  ) as Nhm2SphericalBosonStarV2SiOutputNormalizationV1;
