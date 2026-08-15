import { createHash } from "node:crypto";

import { NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_BINDING } from "./nhm2-spherical-boson-star-branch-bvp.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_EXPECTED_PLAIN_CANONICAL_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_EXPECTED_SEMANTIC_SHA256,
} from "./nhm2-spherical-boson-star-v2-branch-selection-numerics.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_BINDING,
} from "./nhm2-spherical-boson-star-v2-candidate-freeze.v2";
import { NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_BINDING } from "./nhm2-spherical-boson-star-v2-radial-primary-numerics.v1";

export const NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_ARTIFACT_ID =
  "nhm2.spherical_boson_star_v2.vacuum_continuation_proof_abi" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_VERSION =
  "nhm2_spherical_boson_star_v2_vacuum_continuation_proof_abi/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_CANDIDATE_ID =
  "nhm2.semiclassical_v2.spherical_boson_star_1s_weak_field_control/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_PHASE =
  "stage_2_definition_only_authority_neutral_proof_abi_without_proof_program" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_VALIDATOR_LIMITS =
  Object.freeze({
    maximumWireUtf16CodeUnits: 262_144,
    maximumWireUtf8Bytes: 262_144,
    maximumDepth: 32,
    maximumNodes: 8_192,
    maximumArrayLength: 2_048,
    maximumObjectPropertyCount: 64,
    maximumPropertyKeyUtf8Bytes: 256,
    maximumStringUtf8Bytes: 16_384,
    maximumAggregateStringUtf8Bytes: 131_072,
  } as const);

const FINAL_BRANCH_POLICY_RAW_BINDING = Object.freeze({
  relativePath:
    "shared/contracts/nhm2-spherical-boson-star-v2-branch-selection-numerics.v1.ts",
  rawSha256: "d20e6eeef3d185ff938aa27cc83af87a201d76f986c63d77e0dbe72cf8600c82",
  sizeBytes: 44_912,
  semanticSha256:
    "221af0c6b9f858d20ca2f89c5e4eedf14a0c64ede9ff39e60077b79f08ad9aaa",
  plainCanonicalSha256:
    "913b9d524071c20669e8f0abfd838ef6daa7b2e17b1bd5775a1fafc1e2282962",
  canonicalSizeBytes: 41_280,
});

const EXACT_DEPENDENCY_BINDINGS = Object.freeze({
  finalBranchSelectionNumerics: Object.freeze({
    role: "sole_frozen_vacuum_continuation_acceptance_dimension_authority",
    ...FINAL_BRANCH_POLICY_RAW_BINDING,
  }),
  branchBvp: Object.freeze({
    role: "frozen_equation_and_boundary_definition_only",
    relativePath: "shared/contracts/nhm2-spherical-boson-star-branch-bvp.v1.ts",
    rawSha256:
      "4df37db5f8b01bda9b0c02eaef2fb661abd67e71fbe99ede51aa3238348cfcab",
    sizeBytes: 28_619,
    semanticSha256:
      "ce00d2b6048d8c22e6dedd4526a8548373916525ef9adb75fcea48e67dc7e557",
    canonicalSizeBytes: 13_847,
  }),
  radialPrimaryNumerics: Object.freeze({
    role: "finite_binary64_diagnostic_primitives_only_not_proof_program",
    relativePath:
      "shared/contracts/nhm2-spherical-boson-star-v2-radial-primary-numerics.v1.ts",
    rawSha256:
      "dfec69750d345893a02483e1a13eb65c928966f0635e43ee559e0ed630634f10",
    sizeBytes: 34_965,
    semanticSha256:
      "f88e31544dfeccdbb43a5b956172c4b6b4b84f22de3b25ced762282cb5f271bc",
    canonicalSizeBytes: 14_732,
  }),
  finalCandidateFreezeV2: Object.freeze({
    role: "selected_candidate_identity_and_authority_lock_definition_only",
    relativePath:
      "shared/contracts/nhm2-spherical-boson-star-v2-candidate-freeze.v2.ts",
    rawSha256:
      "c0a1a39efa0beb0cc13ac2517fb97f6c2b1ff18242e4d8329008fd85b6a3b057",
    sizeBytes: 35_998,
    semanticSha256:
      "a8e4d9cb4b07efc053fddc72339b8c3db464129a992731453059d3e160ca2ce2",
    plainCanonicalSha256:
      "ae7e7f17b67dca7bbb25cbddb60e20b08135dd513977a620463122e153f58932",
    canonicalSizeBytes: 20_843,
  }),
} as const);

const ORDERED_CELL_ORDINALS = Object.freeze(
  Array.from({ length: 1_024 }, (_, ordinal) => ordinal),
);
const ORDERED_RADIUS_EXPONENTS = Object.freeze(
  Array.from({ length: 73 }, (_, ordinal) => -80 + ordinal),
);

const INPUT_MANIFEST_EXACT_KEY_ORDER = Object.freeze([
  "artifactId",
  "attemptOrdinal",
  "authorityFalse",
  "candidateId",
  "contractVersion",
  "inputManifestSelfSha256",
  "orderedInputBindings",
  "proofAbiSemanticSha256",
] as const);
const INPUT_BINDING_EXACT_KEY_ORDER = Object.freeze([
  "mediaType",
  "ordinal",
  "path",
  "rawSha256",
  "semanticRole",
  "sizeBytes",
] as const);
const RECEIPT_MANIFEST_EXACT_KEY_ORDER = Object.freeze([
  "artifactId",
  "attemptOrdinal",
  "authorityFalse",
  "candidateId",
  "contractVersion",
  "inputManifestRawSha256",
  "orderedProductBindings",
  "proofAbiSemanticSha256",
  "receiptManifestSelfSha256",
] as const);
const RECEIPT_PRODUCT_BINDING_EXACT_KEY_ORDER = Object.freeze([
  "mediaType",
  "productKind",
  "rawSha256",
  "recordCount",
  "route",
  "sizeBytes",
  "streamSha256",
] as const);
const RECORD_ENVELOPE_EXACT_KEY_ORDER = Object.freeze([
  "authorityFalse",
  "candidateId",
  "contractVersion",
  "inputManifestRawSha256",
  "payload",
  "payloadSha256",
  "productKind",
  "productOrdinal",
  "recordSelfSha256",
] as const);
const LAMBDA_ZERO_PAYLOAD_EXACT_KEY_ORDER = Object.freeze([
  "bifurcationTransversalityReceiptBinding",
  "decision",
  "firstFailure",
  "firstTubeContainmentWitness",
  "groundStateReceiptBinding",
  "lambdaZeroInterval",
  "simpleKernelReceiptBinding",
] as const);
const CELL_PAYLOAD_EXACT_KEY_ORDER = Object.freeze([
  "bounds",
  "cellInputBindings",
  "cellOrdinal",
  "decision",
  "firstFailure",
  "lambdaInterval",
  "lowerFaceBinding",
  "orderedRadiusEvaluations",
  "selectedRadiusExponent",
  "upperFaceBinding",
] as const);
const RADII_BOUNDS_EXACT_KEY_ORDER = Object.freeze([
  "YUpper",
  "Z0Upper",
  "Z1Upper",
  "Z2Upper",
] as const);
const RADIUS_EVALUATION_EXACT_KEY_ORDER = Object.freeze([
  "contractionUpper",
  "existenceUpper",
  "passed",
  "radiusExact",
  "radiusExponent",
] as const);
const FACE_PAYLOAD_EXACT_KEY_ORDER = Object.freeze([
  "decision",
  "firstFailure",
  "leftCellOrdinal",
  "leftFaceBinding",
  "orientationPassed",
  "orientationWitness",
  "rightCellOrdinal",
  "rightFaceBinding",
  "sharedFaceOverlapPassed",
  "sharedFaceOverlapWitness",
  "sharedLambda",
] as const);
const SUMMARY_PAYLOAD_EXACT_KEY_ORDER = Object.freeze([
  "allCellsCertified",
  "allFacesCompatible",
  "authorityLocks",
  "cellProductBinding",
  "decision",
  "faceProductBinding",
  "firstFailureOrAllPassed",
  "lambdaZeroProductBinding",
  "productCounts",
  "summaryConclusion",
  "terminalStateContained",
] as const);

const FAILURE_CODES = Object.freeze([
  "VACUUM_POLICY_BINDING_MISMATCH",
  "VACUUM_PROOF_DEFINITION_UNBOUND",
  "VACUUM_SOURCE_CLOSURE_ABSENT",
  "VACUUM_RUNTIME_CLOSURE_ABSENT",
  "VACUUM_INPUT_MANIFEST_INVALID",
  "LAMBDA_ZERO_GROUND_STATE_UNPROVED",
  "LAMBDA_ZERO_KERNEL_NOT_SIMPLE",
  "LAMBDA_ZERO_TRANSVERSALITY_UNPROVED",
  "CELL_INPUT_INVALID",
  "CELL_INTERVAL_DOMAIN_FAILURE",
  "CELL_RADII_BOUNDS_INVALID",
  "CELL_NO_RADIUS",
  "FIRST_TUBE_MISSES_LAMBDA_ZERO",
  "CELL_SHARED_FACE_DISJOINT",
  "CELL_ORIENTATION_INCOMPATIBLE",
  "LAST_TUBE_MISSES_TARGET",
  "RECEIPT_PERSISTENCE_HASH_MISMATCH",
] as const);

const CHRONOLOGY = Object.freeze([
  "verify_exact_raw_semantic_plain_and_size_dependency_namespaces_without_conflation",
  "require_every_exact_proof_definition_binding_before_any_manifest_or_cell_traversal",
  "require_source_dependency_toolchain_executable_runtime_issuer_builder_command_and_preseal_bindings",
  "verify_primitive_canonical_input_manifest_and_every_ordered_raw_hash_and_size_before_decode",
  "verify_lambda_zero_limiting_ground_state_then_simple_kernel_then_bifurcation_transversality",
  "for_cell_ordinal_0_through_1023_require_exact_I_k_then_decode_then_compute_outward_Y_Z0_Z1_Z2",
  "for_each_cell_scan_all_73_radii_in_exponent_order_minus_80_through_minus_8_and_select_only_the_first_strict_pass",
  "for_cell_0_verify_lambda_zero_limit_containment_after_a_radius_is_selected",
  "for_each_cell_after_0_verify_previous_current_shared_face_overlap_then_compatible_orientation",
  "after_cell_1023_verify_the_last_upper_face_contains_the_exactly_bound_lambda_2^-5_terminal_state_lift",
  "canonicalize_hash_persist_reopen_and_rehash_authority_false_products",
  "stop_at_the_first_failure_without_retry_retune_subdivision_truncation_increase_precision_escalation_or_fallback",
] as const);

const MISSING_EXACT_CHOICES = Object.freeze({
  desingularizedOperatorGDefinition: null,
  desingularizedOperatorGSourceBinding: null,
  unknownVectorZPackingDefinition: null,
  spatialChebyshevBasisAndAffineMapDefinition: null,
  parameterChebyshevBasisAndAffineMapDefinition: null,
  parameterPolynomialConstructionChronology: null,
  coefficientPayloadCodecAndPackingDefinition: null,
  coefficientSpaceNormDefinition: null,
  coefficientSpaceComponentWeights: null,
  analyticTailFactorizationDefinition: null,
  coreTailJoinOperatorDefinition: null,
  finiteInfiniteOperatorSplittingDefinition: null,
  approximateDerivativeOperatorDefinition: null,
  approximateInversePreconditionerDefinition: null,
  radiiPolynomialBoundAssemblyDefinition: null,
  intervalNewtonOperatorDefinition: null,
  intervalNewtonExistenceAndLocalUniquenessPredicateDefinition: null,
  YBoundDefinition: null,
  Z0BoundDefinition: null,
  Z1BoundDefinition: null,
  Z2BoundDefinition: null,
  singularityAndDomainSeparationDefinition: null,
  tubeDefinition: null,
  sharedFaceOverlapPredicateDefinition: null,
  compatibleOrientationPredicateDefinition: null,
  lambdaZeroLimitingGroundStateDefinition: null,
  lambdaZeroSimpleKernelDefinition: null,
  lambdaZeroBifurcationTransversalityDefinition: null,
  lambdaZeroFirstTubeContainmentDefinition: null,
  terminalStateDefinition: null,
  terminalStateSourceBinding: null,
  terminalStateLiftDefinition: null,
  terminalStateContainmentPredicateDefinition: null,
  intervalArithmeticDependencyLock: null,
  proofSourceManifestBinding: null,
  proofToolchainBinding: null,
  proofExecutableBinding: null,
  proofRuntimeBinding: null,
  proofIssuerBinding: null,
  proofBuilderBinding: null,
  proofCommandBinding: null,
  preexecutionProofPresealBinding: null,
} as const);

const BLOCKERS = Object.freeze(
  Object.keys(MISSING_EXACT_CHOICES).map((choiceKey, ordinal) =>
    Object.freeze({
      ordinal,
      blockerId: `missing_exact_${choiceKey}`,
      choiceKey,
      disposition:
        "block_verifier_implementation_execution_and_any_proof_pass_receipt",
    }),
  ),
);

const NULL_INSTANCES = Object.freeze({
  proofInputManifest: null,
  lambdaZeroProduct: null,
  orderedCellProducts: null,
  orderedFaceProducts: null,
  summaryProduct: null,
  receiptManifest: null,
  terminalState: null,
  terminalStateLift: null,
  proofSourceManifest: null,
  proofExecutable: null,
  proofRuntime: null,
  executionReceipt: null,
  independentReplayReceipt: null,
  pairAgreementReceipt: null,
  outputRoot: null,
  registryEntry: null,
  certificate: null,
} as const);

const READINESS = Object.freeze({
  exactScientificDefinitionsComplete: false,
  verifierImplemented: false,
  syntheticHarnessAvailable: true,
  proofSourceReady: false,
  proofRuntimeReady: false,
  lambdaZeroReady: false,
  terminalStateReady: false,
  inputManifestReady: false,
  proofExecutionAuthorized: false,
  proofExecutionObserved: false,
  proofReceiptReady: false,
  independentReplayReady: false,
  vacuumConnectionEstablished: false,
} as const);

const AUTHORITY_LOCKS = Object.freeze({
  abiDefinitionIsProof: false,
  syntheticFixtureIsProof: false,
  syntheticFixtureMayEmitProofPass: false,
  verifierAuthority: false,
  proofPassAuthority: false,
  candidateAuthority: false,
  branchScienceAuthority: false,
  continuousVacuumConnectionAuthority: false,
  noFoldAuthority: false,
  replayAuthority: false,
  diagnosticPass: false,
  stressNoiseLamp: false,
  constraintAlgebraLamp: false,
  theoryGraphLamp: false,
  theoryGraphAuthority: false,
  authorityPromoted: false,
  registryPromoted: false,
  casimirVerificationInvoked: false,
  certificateReady: false,
  physicalViability: false,
  propulsion: false,
  transport: false,
} as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_MANIFEST_SELF_HASH_DOMAIN =
  "nhm2-spherical-boson-star-v2-vacuum-continuation-proof-abi/manifest/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_RECORD_SELF_HASH_DOMAIN =
  "nhm2-spherical-boson-star-v2-vacuum-continuation-proof-abi/record/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_STREAM_HASH_DOMAIN =
  "nhm2-spherical-boson-star-v2-vacuum-continuation-proof-abi/stream/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_SYNTHETIC_RECORD_HASH_DOMAIN =
  "nhm2-spherical-boson-star-v2-vacuum-continuation-proof-abi/synthetic-record/v1\n" as const;

const CONTRACT = {
  artifactId:
    NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_ARTIFACT_ID,
  contractVersion:
    NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_VERSION,
  candidateId:
    NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_CANDIDATE_ID,
  phase: NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_PHASE,
  authority:
    "definition_only_authority_neutral_abi_and_synthetic_harness_no_proof_program_receipt_or_claim_authority",
  maturity:
    "stage_2_closed_discrete_wire_dimensions_with_all_scientific_operator_proof_runtime_and_instance_choices_explicitly_null",
  additiveBoundary: {
    mutatesAnyBoundPredecessor: false,
    importsCandidatePassEvidence: false,
    importsProofPassEvidence: false,
    importsRuntimeAuthority: false,
    bindsUnfinishedBoundaryRemaindersFiles: false,
    addsOnlyWire_dimensions_chronology_failures_and_synthetic_harness: true,
  },
  exactDependencyBindings: EXACT_DEPENDENCY_BINDINGS,
  frozenCoverDimensions: {
    branchParameter: "lambda_in_[0,2^-5]",
    exactParameterCellCount: 1_024,
    orderedCellOrdinals: ORDERED_CELL_ORDINALS,
    parameterCellFormula:
      "I_k=[k*2^-15,(k+1)*2^-15],k=0,...,1023_in_ordinal_order",
    exactParameterEndpointCount: 1_025,
    firstEndpoint: "0",
    lastEndpoint: "2^-5",
    mpfrPrecisionBits: 256,
    intervalRounding: "directed_outward",
    coreScaledRadialDomain: "y_in_[0,64]",
    spatialChebyshevCoefficientsPerUnknown: 256,
    parameterChebyshevDegreePerCell: 32,
    analyticTailFactorizationBeyondY: 64,
    coefficientNormPolicyLabel: "weighted_l1_coefficient_norm",
    coefficientWeightExact: "17/16",
    requiredBoundsInOrder: ["Y", "Z0", "Z1", "Z2"],
    requiredBoundsNonnegativeAndOutwardRounded: true,
    exactOrderedRadiusExponentSet: ORDERED_RADIUS_EXPONENTS,
    radiusValueDefinition: "r=2^radiusExponent",
    radiusSelectionRule:
      "evaluate_all_73_in_order_and_select_only_the_first_strictly_passing_member",
    existenceInequality: "Y+(Z0+Z1-1)*r+Z2*r^2<0",
    contractionInequality: "Z0+Z1+2*Z2*r<1",
    finitePositiveLambdaMethodLabel:
      "MPFR256_directed_outward_radii_polynomial_interval_Newton_existence_and_local_uniqueness",
    methodLabelCompletesAnyMissingExactDefinition: false,
    lambdaZeroUsesIndependentDesingularizedLimitingProof: true,
    ordinaryIntervalNewtonOnUnscaledVacuumEquationsAtLambdaZeroForbidden: true,
    adjacentTubeSharedFaceOverlapRequired: true,
    adjacentTubeCompatibleOrientationRequired: true,
    firstTubeContainsCertifiedLambdaZeroLimit: true,
    lastTubeContainsLambda2Minus5TargetState: true,
    sevenBinary64ContinuationStagesAreDiagnosticsOnly: true,
    sevenStagesMaySubstituteForContinuousCover: false,
    expectedProofProduct: "existence_local_uniqueness_and_continuous_cover",
    adaptiveCellSubdivisionAllowed: false,
    truncationIncreaseAllowed: false,
    precisionEscalationAllowed: false,
  },
  logicalProducts: {
    exactLambdaZeroProductCount: 1,
    exactCellProductCount: 1_024,
    exactFaceProductCount: 1_023,
    exactSummaryProductCount: 1,
    exactTotalProductCount: 2_049,
    exactRadiusEvaluationsPerCell: 73,
    exactAllPassRadiusEvaluationCount: 74_752,
    exactProductOrdinalPlan: {
      lambdaZero: "0",
      cells: "1_through_1024_map_cell_ordinal_plus_1",
      faces: "1025_through_2047_map_shared_face_left_cell_ordinal_plus_1025",
      summary: "2048",
    },
    orderedRoutes: [
      {
        ordinal: 0,
        productKind: "lambda_zero",
        route: "proof/vacuum-lambda-zero.json",
        exactRecordCount: 1,
      },
      {
        ordinal: 1,
        productKind: "cell",
        route: "proof/vacuum-cells.jsonl",
        exactRecordCount: 1_024,
      },
      {
        ordinal: 2,
        productKind: "face",
        route: "proof/vacuum-faces.jsonl",
        exactRecordCount: 1_023,
      },
      {
        ordinal: 3,
        productKind: "summary",
        route: "proof/vacuum-cover-summary.json",
        exactRecordCount: 1,
      },
    ],
  },
  dyadicEndpointCodec: {
    exactKeyOrder: [
      "direction",
      "exponent2",
      "mantissaLowercaseHex",
      "precisionBits",
      "sign",
    ],
    exactValue:
      "sign*int(mantissaLowercaseHex,16)*2^exponent2_with_zero_encoded_only_as_sign_zero_mantissa_0_exponent2_0",
    signEnum: ["minus", "plus", "zero"],
    directionEnum: ["RNDD", "RNDU"],
    precisionBitsLiteral: 256,
    nonzeroMantissaRule:
      "lowercase_hex_no_leading_zero_at_most_64_hex_digits_and_odd_final_nibble",
    zeroCanonicalization: "negative_zero_forbidden",
    intervalCodec:
      "exact_two_element_tuple_[lower_with_direction_RNDD,upper_with_direction_RNDU]_and_lower_less_than_or_equal_to_upper",
    jsonNumberProofValuesForbidden: true,
  },
  exactWireKeyOrders: {
    inputManifest: INPUT_MANIFEST_EXACT_KEY_ORDER,
    inputBinding: INPUT_BINDING_EXACT_KEY_ORDER,
    receiptManifest: RECEIPT_MANIFEST_EXACT_KEY_ORDER,
    receiptProductBinding: RECEIPT_PRODUCT_BINDING_EXACT_KEY_ORDER,
    recordEnvelope: RECORD_ENVELOPE_EXACT_KEY_ORDER,
    lambdaZeroPayload: LAMBDA_ZERO_PAYLOAD_EXACT_KEY_ORDER,
    cellPayload: CELL_PAYLOAD_EXACT_KEY_ORDER,
    radiiBounds: RADII_BOUNDS_EXACT_KEY_ORDER,
    radiusEvaluation: RADIUS_EVALUATION_EXACT_KEY_ORDER,
    facePayload: FACE_PAYLOAD_EXACT_KEY_ORDER,
    summaryPayload: SUMMARY_PAYLOAD_EXACT_KEY_ORDER,
  },
  hashingAndSerialization: {
    canonicalJson:
      "RFC8785_compatible_UTF8_sorted_keys_compact_without_BOM_duplicate_keys_nonfinite_numbers_or_negative_zero",
    manifestSelfHashDomain:
      NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_MANIFEST_SELF_HASH_DOMAIN,
    manifestSelfHash:
      "SHA256(domain_utf8||u64le(canonical_manifest_without_self_hash_byte_length)||canonical_manifest_without_self_hash_bytes)",
    recordSelfHashDomain:
      NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_RECORD_SELF_HASH_DOMAIN,
    recordSelfHash:
      "SHA256(domain_utf8||u16le(product_kind_ordinal)||u64le(product_ordinal)||u64le(canonical_record_without_recordSelfSha256_byte_length)||canonical_record_without_recordSelfSha256_bytes)",
    streamHashDomain:
      NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_STREAM_HASH_DOMAIN,
    streamHash:
      "SHA256(domain_utf8||u64le(record_count)||for_each_record_in_file_order(u64le(record_line_byte_length)||record_line_bytes_without_LF))",
    jsonlEncoding:
      "one_canonical_UTF8_record_per_line_with_single_LF_no_CR_BOM_or_blank_lines",
  },
  chronology: CHRONOLOGY,
  firstFailurePolicy: {
    codesInPrecedenceOrder: FAILURE_CODES,
    cellFailureContext:
      "cellOrdinal_is_required_for_every_CELL_code_and_must_equal_the_first_failed_ordinal",
    faceFailureContext:
      "leftCellOrdinal_and_rightCellOrdinal_are_required_for_every_shared_face_code",
    stopBeforeLaterCellOrFace: true,
    retryAllowed: false,
    retuneAllowed: false,
    toleranceChangeAllowed: false,
    scheduleChangeAllowed: false,
    adaptiveSubdivisionAllowed: false,
    truncationIncreaseAllowed: false,
    precisionEscalationAllowed: false,
    alternateDefinitionSourceRuntimeOrTerminalStateAllowed: false,
    anyChangeRequiresNewContractVersion: true,
  },
  permittedSummarySemantics: {
    onlyFutureAllPassTag:
      "radii_polynomial_cover_checks_passed_for_exact_bound_inputs_authority_false",
    allPassTagMayBeEmittedByThisDefinitionOnlyAbi: false,
    syntheticTag: "synthetic_fixture_validated_without_proof_authority",
    forbiddenTags: [
      "candidate_admitted",
      "branch_accepted",
      "global_uniqueness",
      "no_fold",
      "diagnostic_pass",
      "theory_graph_lamp",
      "physical_viability",
      "propulsion",
      "transport",
    ],
  },
  syntheticHarness: {
    available: true,
    scope:
      "canonical_wire_budget_endpoint_codec_and_domain_separated_hash_calculation_only",
    exactFixtureId: "synthetic.vacuum_continuation_codec.linear_map/v1",
    exactRecordKind: "synthetic_fixture",
    exactDisposition: "synthetic_fixture_validated_without_proof_authority",
    mayReadCandidateData: false,
    mayReadProofApproximants: false,
    mayEmitProofPass: false,
    maySetAnyReadinessOrAuthority: false,
  },
  missingExactChoices: MISSING_EXACT_CHOICES,
  blockers: BLOCKERS,
  instances: NULL_INSTANCES,
  readiness: READINESS,
  authorityLocks: AUTHORITY_LOCKS,
} as const;

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

export const NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1 =
  deepFreeze(CONTRACT);

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

export const NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_CANONICAL_JSON =
  canonicalJson(NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1);
export const NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_SEMANTIC_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-vacuum-continuation-proof-abi/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_SEMANTIC_SHA256 =
  createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_SEMANTIC_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_PLAIN_CANONICAL_SHA256 =
  createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_CANONICAL_JSON,
    "utf8",
  );

// Mandatory checkpoint: these remain null until the parent independently
// recomputes and explicitly acknowledges semantic SHA-256, plain canonical
// SHA-256, and canonical byte size. They are outside the semantic payload.
export const NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_EXPECTED_SEMANTIC_SHA256:
  string | null = null;
export const NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_EXPECTED_PLAIN_CANONICAL_SHA256:
  string | null = null;
export const NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_EXPECTED_CANONICAL_SIZE_BYTES:
  number | null = null;
export const NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_LITERAL_SEAL_STATUS =
  "unsealed_pending_independent_parent_acknowledgement_before_any_verifier_implementation" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_BINDING =
  Object.freeze({
    artifactId:
      NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_VERSION,
    candidateId:
      NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_CANDIDATE_ID,
    hashSemantics:
      "domain_separated_semantic_contract_seal_distinct_from_plain_canonical_hash_and_observed_raw_binding" as const,
    semanticSha256Domain:
      NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_SEMANTIC_SHA256_DOMAIN,
    semanticSha256:
      NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_SEMANTIC_SHA256,
    plainCanonicalSha256:
      NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_PLAIN_CANONICAL_SHA256,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_CANONICAL_SIZE_BYTES,
    mediaType: "application/json" as const,
    observedRawBinding: null,
    literalSealStatus:
      NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_LITERAL_SEAL_STATUS,
  });

const allNullLeaves = (value: unknown): boolean => {
  if (value === null) return true;
  if (typeof value !== "object") return false;
  return Object.values(value as Record<string, unknown>).every(allNullLeaves);
};

const allFalseLeaves = (value: unknown): boolean => {
  if (typeof value === "boolean") return value === false;
  if (value === null || typeof value !== "object") return false;
  return Object.values(value as Record<string, unknown>).every(allFalseLeaves);
};

const assertDefinitionInvariants = (): void => {
  const contract =
    NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1;
  const dependency = contract.exactDependencyBindings;
  const expected = [
    NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_EXPECTED_SEMANTIC_SHA256,
    NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_EXPECTED_PLAIN_CANONICAL_SHA256,
    NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_EXPECTED_CANONICAL_SIZE_BYTES,
  ];
  const everyExpectedNull = expected.every((value) => value === null);
  const everyExpectedPresent = expected.every((value) => value !== null);

  if (
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_BINDING.semanticSha256 !==
      dependency.finalBranchSelectionNumerics.semanticSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_BINDING.plainCanonicalSha256 !==
      dependency.finalBranchSelectionNumerics.plainCanonicalSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_BINDING.canonicalSizeBytes !==
      dependency.finalBranchSelectionNumerics.canonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_EXPECTED_SEMANTIC_SHA256 !==
      dependency.finalBranchSelectionNumerics.semanticSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_EXPECTED_PLAIN_CANONICAL_SHA256 !==
      dependency.finalBranchSelectionNumerics.plainCanonicalSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_EXPECTED_CANONICAL_SIZE_BYTES !==
      dependency.finalBranchSelectionNumerics.canonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_BINDING.sha256 !==
      dependency.branchBvp.semanticSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_BINDING.canonicalSizeBytes !==
      dependency.branchBvp.canonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_BINDING.sha256 !==
      dependency.radialPrimaryNumerics.semanticSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_BINDING.canonicalSizeBytes !==
      dependency.radialPrimaryNumerics.canonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_BINDING.semanticSha256 !==
      dependency.finalCandidateFreezeV2.semanticSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_BINDING.plainCanonicalSha256 !==
      dependency.finalCandidateFreezeV2.plainCanonicalSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_BINDING.canonicalSizeBytes !==
      dependency.finalCandidateFreezeV2.canonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2.selectedCandidateIdentity
      .candidateId !== contract.candidateId
  ) {
    throw new Error(
      "nhm2_spherical_boson_star_v2_vacuum_continuation_proof_abi_v1_dependency_pin_drift",
    );
  }

  const missingKeys = Object.keys(contract.missingExactChoices);
  if (
    !allNullLeaves(contract.missingExactChoices) ||
    contract.blockers.length !== missingKeys.length ||
    contract.blockers.some(
      (blocker, ordinal) =>
        blocker.ordinal !== ordinal ||
        blocker.choiceKey !== missingKeys[ordinal] ||
        blocker.blockerId !== `missing_exact_${missingKeys[ordinal]}`,
    )
  ) {
    throw new Error(
      "nhm2_spherical_boson_star_v2_vacuum_continuation_proof_abi_v1_missing_choice_drift",
    );
  }

  if (
    contract.frozenCoverDimensions.orderedCellOrdinals.length !== 1_024 ||
    contract.frozenCoverDimensions.orderedCellOrdinals.some(
      (ordinal, index) => ordinal !== index,
    ) ||
    contract.frozenCoverDimensions.exactOrderedRadiusExponentSet.length !==
      73 ||
    contract.frozenCoverDimensions.exactOrderedRadiusExponentSet.some(
      (exponent, index) => exponent !== -80 + index,
    ) ||
    contract.logicalProducts.exactTotalProductCount !== 2_049 ||
    contract.logicalProducts.exactAllPassRadiusEvaluationCount !== 74_752 ||
    new Set(contract.firstFailurePolicy.codesInPrecedenceOrder).size !==
      contract.firstFailurePolicy.codesInPrecedenceOrder.length ||
    !allNullLeaves(contract.instances) ||
    contract.readiness.verifierImplemented !== false ||
    contract.readiness.syntheticHarnessAvailable !== true ||
    Object.entries(contract.readiness).some(
      ([key, value]) => key !== "syntheticHarnessAvailable" && value !== false,
    ) ||
    !allFalseLeaves(contract.authorityLocks)
  ) {
    throw new Error(
      "nhm2_spherical_boson_star_v2_vacuum_continuation_proof_abi_v1_authority_or_dimension_drift",
    );
  }

  if (!everyExpectedNull && !everyExpectedPresent) {
    throw new Error(
      "nhm2_spherical_boson_star_v2_vacuum_continuation_proof_abi_v1_partial_literal_seal",
    );
  }
  if (
    everyExpectedPresent &&
    (NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_SEMANTIC_SHA256 !==
      NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_EXPECTED_SEMANTIC_SHA256 ||
      NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_PLAIN_CANONICAL_SHA256 !==
        NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_EXPECTED_PLAIN_CANONICAL_SHA256 ||
      NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_CANONICAL_SIZE_BYTES !==
        NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_EXPECTED_CANONICAL_SIZE_BYTES)
  ) {
    throw new Error(
      "nhm2_spherical_boson_star_v2_vacuum_continuation_proof_abi_v1_literal_seal_mismatch",
    );
  }
};

assertDefinitionInvariants();

type ParsedWire =
  | Readonly<{ ok: true; value: unknown }>
  | Readonly<{ ok: false; violation: string }>;

const FORBIDDEN_KEYS = new Set([
  "__defineGetter__",
  "__defineSetter__",
  "__lookupGetter__",
  "__lookupSetter__",
  "__proto__",
  "constructor",
  "hasOwnProperty",
  "isPrototypeOf",
  "propertyIsEnumerable",
  "prototype",
  "toLocaleString",
  "toString",
  "valueOf",
]);

const parsedTreeViolation = (root: unknown): string | null => {
  const limits =
    NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_VALIDATOR_LIMITS;
  const stack: Array<{ value: unknown; depth: number; pointer: string }> = [
    { value: root, depth: 0, pointer: "" },
  ];
  let nodes = 0;
  let aggregateStringUtf8Bytes = 0;

  while (stack.length > 0) {
    const frame = stack.pop()!;
    nodes += 1;
    if (nodes > limits.maximumNodes) return "nodes";
    if (frame.depth > limits.maximumDepth)
      return `depth:${frame.pointer || "/"}`;
    const value = frame.value;
    if (value === null || typeof value === "boolean") continue;
    if (typeof value === "number") {
      if (!Number.isFinite(value) || Object.is(value, -0)) {
        return `number:${frame.pointer || "/"}`;
      }
      continue;
    }
    if (typeof value === "string") {
      const bytes = Buffer.byteLength(value, "utf8");
      aggregateStringUtf8Bytes += bytes;
      if (bytes > limits.maximumStringUtf8Bytes) {
        return `string:${frame.pointer || "/"}`;
      }
      if (aggregateStringUtf8Bytes > limits.maximumAggregateStringUtf8Bytes) {
        return "aggregate_string_bytes";
      }
      continue;
    }
    if (typeof value !== "object") return `surface:${frame.pointer || "/"}`;
    if (Array.isArray(value)) {
      if (value.length > limits.maximumArrayLength) {
        return `array_length:${frame.pointer || "/"}`;
      }
      for (let index = value.length - 1; index >= 0; index -= 1) {
        stack.push({
          value: value[index],
          depth: frame.depth + 1,
          pointer: `${frame.pointer}/${index}`,
        });
      }
      continue;
    }
    if (Object.getPrototypeOf(value) !== Object.prototype) {
      return `prototype:${frame.pointer || "/"}`;
    }
    const keys = Reflect.ownKeys(value);
    if (
      keys.length > limits.maximumObjectPropertyCount ||
      keys.some((key) => typeof key !== "string")
    ) {
      return `object_keys:${frame.pointer || "/"}`;
    }
    for (let index = keys.length - 1; index >= 0; index -= 1) {
      const key = keys[index] as string;
      const keyBytes = Buffer.byteLength(key, "utf8");
      aggregateStringUtf8Bytes += keyBytes;
      if (
        FORBIDDEN_KEYS.has(key) ||
        keyBytes > limits.maximumPropertyKeyUtf8Bytes ||
        aggregateStringUtf8Bytes > limits.maximumAggregateStringUtf8Bytes
      ) {
        return `property_key:${frame.pointer}/${key}`;
      }
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (
        descriptor === undefined ||
        !("value" in descriptor) ||
        typeof descriptor.get === "function" ||
        typeof descriptor.set === "function"
      ) {
        return `accessor:${frame.pointer}/${key}`;
      }
      stack.push({
        value: descriptor.value,
        depth: frame.depth + 1,
        pointer: `${frame.pointer}/${key}`,
      });
    }
  }
  return null;
};

const parsePrimitiveCanonicalWire = (wire: unknown): ParsedWire => {
  const limits =
    NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_VALIDATOR_LIMITS;
  if (typeof wire !== "string") {
    return { ok: false, violation: "primitive_string_required" };
  }
  if (wire.length > limits.maximumWireUtf16CodeUnits) {
    return { ok: false, violation: "wire_utf16_limit" };
  }
  if (Buffer.byteLength(wire, "utf8") > limits.maximumWireUtf8Bytes) {
    return { ok: false, violation: "wire_utf8_limit" };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(wire) as unknown;
  } catch {
    return { ok: false, violation: "json_parse_invalid" };
  }
  const violation = parsedTreeViolation(parsed);
  if (violation !== null) return { ok: false, violation };
  if (canonicalJson(parsed) !== wire) {
    return { ok: false, violation: "canonical_json_required" };
  }
  return { ok: true, value: parsed };
};

export const nhm2SphericalBosonStarV2VacuumContinuationProofAbiV1WireViolations =
  (wire: unknown): string[] => {
    const parsed = parsePrimitiveCanonicalWire(wire);
    if (!parsed.ok) return [`vacuum_proof_abi_${parsed.violation}`];
    return wire ===
      NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_CANONICAL_JSON
      ? []
      : ["vacuum_proof_abi_semantic_drift"];
  };

const exactKeys = (value: unknown, expected: readonly string[]): boolean => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const keys = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return (
    keys.length === wanted.length &&
    keys.every((key, index) => key === wanted[index])
  );
};

type ParsedDyadicEndpoint = Readonly<{
  sign: -1 | 0 | 1;
  mantissa: bigint;
  exponent2: number;
}>;

const parseDyadicEndpoint = (
  value: unknown,
  requiredDirection: "RNDD" | "RNDU",
): ParsedDyadicEndpoint | null => {
  const expectedKeys = CONTRACT.dyadicEndpointCodec.exactKeyOrder;
  if (!exactKeys(value, expectedKeys)) return null;
  const endpoint = value as Record<string, unknown>;
  if (
    endpoint.direction !== requiredDirection ||
    endpoint.precisionBits !== 256 ||
    !Number.isSafeInteger(endpoint.exponent2) ||
    typeof endpoint.mantissaLowercaseHex !== "string" ||
    !["minus", "plus", "zero"].includes(String(endpoint.sign))
  ) {
    return null;
  }
  const sign = endpoint.sign;
  const mantissaHex = endpoint.mantissaLowercaseHex;
  const exponent2 = endpoint.exponent2 as number;
  if (sign === "zero") {
    return mantissaHex === "0" && exponent2 === 0
      ? { sign: 0, mantissa: 0n, exponent2: 0 }
      : null;
  }
  if (
    !/^[1-9a-f][0-9a-f]{0,63}$/.test(mantissaHex) ||
    !/[13579bdf]$/.test(mantissaHex)
  ) {
    return null;
  }
  return {
    sign: sign === "minus" ? -1 : 1,
    mantissa: BigInt(`0x${mantissaHex}`),
    exponent2,
  };
};

const bitLength = (value: bigint): number => value.toString(2).length;

const compareDyadicMagnitude = (
  left: ParsedDyadicEndpoint,
  right: ParsedDyadicEndpoint,
): number => {
  const leftTop = bitLength(left.mantissa) + left.exponent2;
  const rightTop = bitLength(right.mantissa) + right.exponent2;
  if (leftTop !== rightTop) return leftTop < rightTop ? -1 : 1;
  const commonExponent = Math.min(left.exponent2, right.exponent2);
  const leftInteger = left.mantissa << BigInt(left.exponent2 - commonExponent);
  const rightInteger =
    right.mantissa << BigInt(right.exponent2 - commonExponent);
  return leftInteger === rightInteger ? 0 : leftInteger < rightInteger ? -1 : 1;
};

const compareDyadic = (
  left: ParsedDyadicEndpoint,
  right: ParsedDyadicEndpoint,
): number => {
  if (left.sign !== right.sign) return left.sign < right.sign ? -1 : 1;
  if (left.sign === 0) return 0;
  const magnitude = compareDyadicMagnitude(left, right);
  return left.sign < 0 ? -magnitude : magnitude;
};

const SYNTHETIC_FIXTURE_PREIMAGE_KEYS = Object.freeze([
  "authorityFalse",
  "contractVersion",
  "disposition",
  "fixtureId",
  "interval",
  "recordKind",
  "recordOrdinal",
  "syntheticFixture",
  "syntheticOnlyNoProofAuthority",
] as const);
const SYNTHETIC_FIXTURE_SEALED_KEYS = Object.freeze([
  ...SYNTHETIC_FIXTURE_PREIMAGE_KEYS,
  "recordSelfSha256",
] as const);
const SHA256 = /^[0-9a-f]{64}$/;

const syntheticFixtureViolation = (
  value: unknown,
  sealed: boolean,
): string | null => {
  if (
    !exactKeys(
      value,
      sealed ? SYNTHETIC_FIXTURE_SEALED_KEYS : SYNTHETIC_FIXTURE_PREIMAGE_KEYS,
    )
  ) {
    return "shape_invalid";
  }
  const fixture = value as Record<string, unknown>;
  if (
    fixture.authorityFalse !== true ||
    fixture.contractVersion !==
      NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_VERSION ||
    fixture.disposition !== CONTRACT.syntheticHarness.exactDisposition ||
    fixture.fixtureId !== CONTRACT.syntheticHarness.exactFixtureId ||
    fixture.recordKind !== CONTRACT.syntheticHarness.exactRecordKind ||
    fixture.recordOrdinal !== 0 ||
    fixture.syntheticFixture !== true ||
    fixture.syntheticOnlyNoProofAuthority !== true ||
    !Array.isArray(fixture.interval) ||
    fixture.interval.length !== 2
  ) {
    return "literal_invalid";
  }
  const lower = parseDyadicEndpoint(fixture.interval[0], "RNDD");
  const upper = parseDyadicEndpoint(fixture.interval[1], "RNDU");
  if (lower === null || upper === null || compareDyadic(lower, upper) > 0) {
    return "dyadic_interval_invalid";
  }
  if (sealed && !SHA256.test(String(fixture.recordSelfSha256))) {
    return "self_hash_invalid";
  }
  return null;
};

const u64le = (value: number): Buffer => {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError("vacuum_proof_abi_synthetic_u64_invalid");
  }
  const bytes = Buffer.alloc(8);
  bytes.writeBigUInt64LE(BigInt(value));
  return bytes;
};

const syntheticSelfHash = (preimage: Record<string, unknown>): string => {
  const wire = canonicalJson(preimage);
  const bytes = Buffer.from(wire, "utf8");
  return createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_VACUUM_CONTINUATION_PROOF_ABI_V1_SYNTHETIC_RECORD_HASH_DOMAIN,
      "utf8",
    )
    .update(u64le(preimage.recordOrdinal as number))
    .update(u64le(bytes.byteLength))
    .update(bytes)
    .digest("hex");
};

export const nhm2SphericalBosonStarV2VacuumContinuationProofAbiV1CalculateSyntheticFixtureSelfHash =
  (canonicalPreimageWire: unknown): string => {
    const parsed = parsePrimitiveCanonicalWire(canonicalPreimageWire);
    if (!parsed.ok) {
      throw new TypeError(`vacuum_proof_abi_synthetic_${parsed.violation}`);
    }
    const violation = syntheticFixtureViolation(parsed.value, false);
    if (violation !== null) {
      throw new TypeError(`vacuum_proof_abi_synthetic_${violation}`);
    }
    return syntheticSelfHash(parsed.value as Record<string, unknown>);
  };

export const nhm2SphericalBosonStarV2VacuumContinuationProofAbiV1SyntheticFixtureWireViolations =
  (wire: unknown): string[] => {
    const parsed = parsePrimitiveCanonicalWire(wire);
    if (!parsed.ok) return [`vacuum_proof_abi_synthetic_${parsed.violation}`];
    const violation = syntheticFixtureViolation(parsed.value, true);
    if (violation !== null) return [`vacuum_proof_abi_synthetic_${violation}`];
    const sealed = parsed.value as Record<string, unknown>;
    const preimage = Object.fromEntries(
      Object.entries(sealed).filter(([key]) => key !== "recordSelfSha256"),
    );
    return sealed.recordSelfSha256 === syntheticSelfHash(preimage)
      ? []
      : ["vacuum_proof_abi_synthetic_self_hash_mismatch"];
  };
