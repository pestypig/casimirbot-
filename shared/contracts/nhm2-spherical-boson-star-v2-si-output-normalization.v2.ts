import { createHash } from "node:crypto";

import {
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION,
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_ARTIFACT_ID,
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_AUTHORITY_LOCKS,
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BLOCKERS,
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_CONTRACT_VERSION,
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_EXPECTED_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_SHA256,
} from "./nhm2-spherical-boson-star-v2-si-output-normalization.v1";

export const NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_ARTIFACT_ID =
  "nhm2.spherical_boson_star_v2.si_output_normalization" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_CONTRACT_VERSION =
  "nhm2_spherical_boson_star_v2_si_output_normalization/v2" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_PHASE =
  "pre_execution_static_si_pair_equality_successor_no_numeric_materialization" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_BINDING_PINS =
  Object.freeze({
    predecessorSha256:
      "16224114ce7bc790d1e5ceeaf8f75e31e5c37412856c5bea8b99284301bf3c24",
    predecessorCanonicalSizeBytes: 23_822,
    codata2022RawSha256:
      "5a7e10ed709577c224cf45f78199dd143a7f9cf10d6f8fe8c018e168454b7a61",
    codata2022RawSizeBytes: 6_180,
    mpfrVersion: "4.2.2",
    gmpVersion: "6.3.0",
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_VALIDATOR_LIMITS =
  Object.freeze({
    maximumWireUtf16CodeUnits: 131_072,
    maximumWireUtf8Bytes: 262_144,
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_BLOCKERS =
  Object.freeze([
    ...NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BLOCKERS,
    "primary_direct_native_full_contract_operation_graph_not_implemented",
    "primary_authenticated_mpfr256_runtime_binding_absent",
    "source_disjoint_independent_direct_native_mpfr256_implementation_absent",
    "independent_authenticated_mpfr256_runtime_binding_absent",
    "lane_distinct_provenance_storage_and_runtime_identity_evidence_absent",
    "independently_persisted_canonical_primary_and_independent_receipts_absent",
    "server_rehash_and_zero_ulp_pair_comparison_not_observed",
  ] as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_AUTHORITY_AND_READINESS_LOCKS =
  Object.freeze({
    normalizationReceipt: null,
    primaryImplementationBound: false,
    primaryRuntimeConformanceObserved: false,
    primaryReceiptPersisted: false,
    independentImplementationBound: false,
    independentRuntimeConformanceObserved: false,
    independentReceiptPersisted: false,
    laneDistinctLineageAuthenticated: false,
    pairComparisonReady: false,
    pairComparisonObserved: false,
    pairAgreement: null,
    candidateManifestMaterialized: false,
    scientificPresealMaterialized: false,
    executionAuthorized: false,
    executionObserved: false,
    resultAuthority: false,
    outputArraysPresent: false,
    replayAuthority: false,
    independentAgreement: false,
    semiclassicalStressNoiseLamp: false,
    semiclassicalConstraintAlgebraLamp: false,
    diagnosticPass: false,
    theoryGraphPromotion: false,
    physicalViability: false,
    propulsion: false,
    transport: false,
  } as const);

const CONTRACT = {
  artifactId:
    NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_ARTIFACT_ID,
  contractVersion:
    NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_CONTRACT_VERSION,
  phase: NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_PHASE,
  successorSemantics: {
    additiveSuccessor: true,
    predecessorArtifactId:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_ARTIFACT_ID,
    predecessorContractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_CONTRACT_VERSION,
    predecessorSha256:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_BINDING_PINS.predecessorSha256,
    predecessorCanonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_BINDING_PINS.predecessorCanonicalSizeBytes,
    predecessorMutationAllowed: false,
    downstreamPredecessorPinMutationAllowed: false,
    tightenedPredecessorFieldsInOrder: Object.freeze([
      "scaleMaterializationReceiptSchema.exactEndpointAgreementRequired",
      "scaleMaterializationReceiptSchema.roundingAuditBound",
      "scaleMaterializationReceiptSchema.unresolvedRoundingAuditBoundBlocksExecution",
    ] as const),
    successorPolicyRoot: "zeroUlpPairAgreement" as const,
    predecessorExactEndpointAgreementRequired: false,
    predecessorRoundingAuditBound: null,
    predecessorUnresolvedRoundingAuditBoundBlocksExecution: true,
    successorMaySupplyExecutionOrPhysicalAuthority: false,
  },
  exactBindings: {
    predecessor: {
      artifactId:
        NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_ARTIFACT_ID,
      contractVersion:
        NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_CONTRACT_VERSION,
      sha256:
        NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_BINDING_PINS.predecessorSha256,
      canonicalSizeBytes:
        NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_BINDING_PINS.predecessorCanonicalSizeBytes,
      mediaType: "application/json",
    },
    constantsRegistryRawBytes: {
      path: "configs/constants/codata-2022.v1.json",
      sha256:
        NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_BINDING_PINS.codata2022RawSha256,
      sizeBytes:
        NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_BINDING_PINS.codata2022RawSizeBytes,
      rawBytesNotParsedProjection: true,
      bothLanesMustIndependentlyRehashBeforeAnyConstantConstruction: true,
    },
  },
  fixedMpfrExecution: {
    library: "GNU_MPFR",
    mpfrVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_BINDING_PINS.mpfrVersion,
    gmpVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_BINDING_PINS.gmpVersion,
    precisionBitsForEveryDestination:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION.mpfr256Context
        .precisionBitsForEveryDestination,
    exponentMinimum:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION.mpfr256Context
        .exponentMinimum,
    exponentMaximum:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION.mpfr256Context
        .exponentMaximum,
    lowerRoundingMode:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION.mpfr256Context
        .lowerRoundingMode,
    upperRoundingMode:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION.mpfr256Context
        .upperRoundingMode,
    centralRoundingMode:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION.mpfr256Context
        .centralRoundingMode,
    faithfulRoundingModeAllowed: false,
    directNativeAbiCallsRequiredForEveryNamedPrimitive: true,
    highLevelNumericWrapperMaySubstituteForDirectNativeAbi: false,
    primitiveOperationReassociationAllowed: false,
    fusedMultiplyAddSubstitutionAllowed: false,
    extendedOrReducedPrecisionAllowed: false,
    scaleGraphOrder:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION.mpfr256Context
        .scaleGraphOrder,
    centralRepresentativeGraphOrder:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION.mpfr256Context
        .centralRepresentativeGraphOrder,
    scaleGraphNodeCount:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION.mpfr256Context
        .scaleGraphNodeCount,
    centralRepresentativeGraphNodeCount:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION.mpfr256Context
        .centralRepresentativeGraphNodeCount,
    requiredScaleIdsInOrder:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION
        .scaleMaterializationReceiptSchema.requiredScaleIdsInOrder,
    endpointEncoding:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION
        .scaleMaterializationReceiptSchema.endpointEncoding,
    centralReceiptEncoding:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION
        .scaleMaterializationReceiptSchema.centralReceiptEncoding,
  },
  zeroUlpPairAgreement: {
    policyStatus: "frozen_pre_execution_not_observed",
    comparisonDomain:
      "canonical_MPFR256_semantic_numeric_projection_after_independent_lane_validation",
    intervalEndpointFieldsComparedInOrder: Object.freeze([
      "sign",
      "mantissaLowercaseHex",
      "exponent2",
      "precisionBits",
      "direction",
    ] as const),
    directedScaleCount: 13,
    directedEndpointsPerScale: 2,
    centralRepresentativeCount: 4,
    centralRepresentativeDyadicFieldsComparedInOrder: Object.freeze([
      "sign",
      "mantissaLowercaseHex",
      "exponent2",
      "precisionBits",
      "direction",
    ] as const),
    canonicalEndpointEqualityRequired: true,
    canonicalCentralRepresentativeEqualityRequired: true,
    maximumEndpointDistanceUlp: 0,
    maximumCentralRepresentativeDistanceUlp: 0,
    roundingAuditBoundUnit: "canonical_MPFR256_ulp",
    unresolvedRoundingAuditBound: false,
    exactReceiptByteEqualityRequired: false,
    provenanceEqualityAllowed: false,
    storageIdentityEqualityAllowed: false,
    runtimeIdentityEqualityAllowed: false,
    equalityMayBeEvaluatedBeforeBothReceiptsAreIndependentlyValidatedPersistedAndRehashed: false,
    equalityMayExcuseChronologyFlagOrBindingFailureInEitherLane: false,
    equalityMayEstablishIndependentImplementationLineage: false,
    equalityMayEstablishReadinessOrAuthority: false,
  },
  traceAgreement: {
    eachLaneMustFirstValidateItsOwnExactOperationChronology: true,
    eachLaneMustFirstValidateItsOwnForbiddenFlags: true,
    eachLaneMustFirstValidateItsOwnCanonicalMpfrDyadics: true,
    eachLaneMustFirstValidateItsOwnV2Binding: true,
    comparedSemanticFieldsInOrder: Object.freeze([
      "ordinal",
      "label",
      "primitive",
      "roundingMode",
      "ternarySign",
      "forbiddenFlagsInFrozenOrder",
      "canonicalResultDyadic",
    ] as const),
    ternaryComparison: "normalized_sign_only",
    allowedCanonicalTernarySignsInOrder: Object.freeze([-1, 0, 1] as const),
    rawNonzeroTernaryMagnitudeCompared: false,
    primitiveReturnAndInexactRulesInOrder: Object.freeze([
      Object.freeze({
        caseId: "ordinary_ternary_returning_mpfr_primitive",
        appliesTo:
          "every_frozen_ternary_returning_MPFR_primitive_except_mpfr_set_str_and_mpfr_get_d",
        rawReturnKind: "MPFR_ternary_int",
        semanticTernarySignDerivation:
          "normalize_any_raw_int_sign_to_-1_0_or_1",
        rawInexactFlagRequirement:
          "must_equal_(normalized_semantic_ternary_sign_not_equal_to_0)",
        rawReturnIsSemanticTernaryAuthority: true,
      } as const),
      Object.freeze({
        caseId: "mpfr_set_str_parse_status",
        appliesTo: "mpfr_set_str",
        rawReturnKind: "parse_status_0_valid_minus_1_invalid_not_ternary",
        validRawParseStatusRequired: 0,
        invalidRawParseStatus: -1,
        invalidParseBlocksReceipt: true,
        semanticTernarySignDerivation:
          "compare_canonical_MPFR256_result_dyadic_to_exact_decimal_rational",
        rawInexactFlagRequirement:
          "must_equal_(derived_semantic_ternary_sign_not_equal_to_0)",
        rawReturnIsSemanticTernaryAuthority: false,
      } as const),
      Object.freeze({
        caseId: "mpfr_get_d_binary64_result",
        appliesTo: "mpfr_get_d",
        rawReturnKind: "binary64_value_no_MPFR_ternary_return",
        semanticTernarySignDerivation:
          "compare_exact_binary64_result_dyadic_to_source_MPFR256_dyadic",
        rawMpfrInexactFlagRequired: false,
        rawMpfrInexactFlagIsSemanticTernaryAuthority: false,
        rawBinary64ResultIsSemanticTernaryAuthority: false,
      } as const),
    ] as const),
    pointerOrAddressCompared: false,
    filesystemPathCompared: false,
    receiptHashComparedAsNumericalEvidence: false,
    runtimeOrProvenanceFieldComparedAsNumericalEvidence: false,
  },
  laneIdentityAndLineage: {
    laneOrder: Object.freeze(["primary", "independent"] as const),
    dedicatedSinglePurposeProcessRequiredPerLane: true,
    sourceRootsMustBeDisjoint: true,
    dependencyRootsMustBeDisjoint: true,
    toolchainRootsMustBeDisjoint: true,
    executableRootsMustBeDisjoint: true,
    runtimeRootsMustBeDisjoint: true,
    rootPathStringInequalityAloneEstablishesLineageIndependence: false,
    copiedOrHardlinkedBytesInDifferentRootsEstablishLineageIndependence: false,
    contentHashInequalityAloneEstablishesLineageIndependence: false,
    serverAuthenticatedIndependentBuildProvenanceRequired: true,
    sourceClosureSealsMustDiffer: true,
    dependencyClosureLedgerSealsMustDiffer: true,
    toolchainLedgerSealsMustDiffer: true,
    executableSealsMustDiffer: true,
    runtimeClosureLedgerSealsMustDiffer: true,
    operatingSystemProcessIdentitiesMustDiffer: true,
    mpfrDestinationStorageIdentityNamespacesMustDiffer: true,
    receiptProvenanceFieldsMustDiffer: true,
    sameGnuMpfrSemanticVersionAndOperationContractRequired: true,
    independentReceiptMayReadPrimaryReceiptBeforeItsOwnPersistence: false,
    primaryReceiptMayReadIndependentReceiptBeforeItsOwnPersistence: false,
    numericalEqualityMayReplaceLineageEvidence: false,
  },
  comparisonChronology: Object.freeze([
    "01_primary_lane_independently_rehashes_exact_CODATA_raw_bytes",
    "02_primary_lane_independently_executes_and_validates_exact_v2_bound_operation_chronology",
    "03_primary_canonical_receipt_is_persisted_and_server_rehashed",
    "04_independent_lane_without_primary_receipt_access_independently_rehashes_exact_CODATA_raw_bytes",
    "05_independent_lane_without_primary_receipt_access_independently_executes_and_validates_exact_v2_bound_operation_chronology",
    "06_independent_canonical_receipt_is_persisted_and_server_rehashed",
    "07_server_authenticates_lane_distinct_provenance_storage_and_runtime_identities",
    "08_server_independently_validates_each_receipt_binding_chronology_flags_and_canonical_dyadics",
    "09_server_projects_only_the_frozen_semantic_numeric_and_normalized_trace_fields",
    "10_server_compares_the_two_projections_for_exact_zero_ulp_equality",
    "11_comparison_result_remains_non_authoritative_until_later_preseal_and_execution_contracts",
  ] as const),
  canonicalReceiptProtocol: {
    protocolId:
      "nhm2_spherical_boson_star_v2_si_normalization_canonical_receipt/v2",
    mediaType: "application/json",
    characterEncoding: "UTF-8",
    canonicalization:
      "recursive_lexicographic_object_keys_preserve_array_order_no_insignificant_whitespace",
    publicIngressAcceptedType: "primitive_string_only",
    objectIngressAllowed: false,
    boxedStringIngressAllowed: false,
    coercionAllowed: false,
    proxyOrAccessorTraversalRequired: false,
    maximumWireUtf16CodeUnits:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_VALIDATOR_LIMITS.maximumWireUtf16CodeUnits,
    maximumWireUtf8Bytes:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_VALIDATOR_LIMITS.maximumWireUtf8Bytes,
    fixedArgv: Object.freeze([
      "--emit-nhm2-spherical-boson-star-v2-si-normalization-receipt-v2",
    ] as const),
    stdinBytes:
      "exact_6180_byte_CODATA_2022_registry_raw_bytes_and_nothing_else",
    stdoutBytes: "exactly_one_bounded_canonical_JSON_receipt_and_nothing_else",
    callerSuppliedPathAllowed: false,
    callerSuppliedEnvironmentAllowed: false,
    callerSuppliedProviderAllowed: false,
    callerSuppliedReceiptAllowed: false,
    genericReceiptPromotionAllowed: false,
    timestampsAllowed: false,
    processStatisticsAllowed: false,
    argvOrEnvironmentEchoAllowed: false,
    primaryAndIndependentReceiptBytesExpectedToDifferBecauseProvenanceMustDiffer: true,
    exactEqualityAppliesOnlyToFrozenSemanticProjection: true,
    materialized: false,
    primaryReceipt: null,
    independentReceipt: null,
  },
  predecessorAuthorityLocks:
    NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_AUTHORITY_LOCKS,
  authorityAndReadinessLocks:
    NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_AUTHORITY_AND_READINESS_LOCKS,
  blockers: NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_BLOCKERS,
} as const;

const deepFreeze = <T>(value: T, seen = new WeakSet<object>()): T => {
  if (value !== null && typeof value === "object") {
    const object = value as object;
    if (!seen.has(object)) {
      seen.add(object);
      for (const descriptor of Object.values(
        Object.getOwnPropertyDescriptors(object),
      )) {
        if ("value" in descriptor) deepFreeze(descriptor.value, seen);
      }
      Object.freeze(object);
    }
  }
  return value;
};

export const NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2 =
  deepFreeze(CONTRACT);
export type Nhm2SphericalBosonStarV2SiOutputNormalizationV2 =
  typeof NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2;

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

export const NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_CANONICAL_JSON =
  canonicalJson(NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2);
export const NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-si-output-normalization/v2\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_SHA256 =
  createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_CANONICAL_JSON,
    "utf8",
  );

export const NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_EXPECTED_SHA256 =
  "6af028d078ecc4cc9076eb45476fd87ac448503170e88fccf0ada3a98d06cafb" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_EXPECTED_CANONICAL_SIZE_BYTES =
  15_246 as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_BINDING =
  Object.freeze({
    artifactId:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_CONTRACT_VERSION,
    sha256Domain:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_SHA256_DOMAIN,
    sha256: NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_SHA256,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_CANONICAL_SIZE_BYTES,
    mediaType: "application/json" as const,
  });

const assertFalseOrNullLeaves = (value: unknown): void => {
  if (value === false || value === null) return;
  if (value === true || typeof value !== "object" || value === null) {
    throw new Error(
      "nhm2_spherical_v2_si_output_normalization_v2_authority_leaf_invalid",
    );
  }
  for (const child of Object.values(value)) assertFalseOrNullLeaves(child);
};

const assertInvariants = (): void => {
  const v1ReceiptSchema =
    NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION.scaleMaterializationReceiptSchema;
  const v2 = NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2;
  if (
    NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_SHA256 !==
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_BINDING_PINS.predecessorSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_EXPECTED_SHA256 !==
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_BINDING_PINS.predecessorSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_CANONICAL_SIZE_BYTES !==
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_BINDING_PINS.predecessorCanonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_EXPECTED_CANONICAL_SIZE_BYTES !==
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_BINDING_PINS.predecessorCanonicalSizeBytes
  ) {
    throw new Error(
      "nhm2_spherical_v2_si_output_normalization_v2_predecessor_pin_drift",
    );
  }
  if (
    NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION.exactBindings
      .constantsRegistryRawBytes.sha256 !==
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_BINDING_PINS.codata2022RawSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION.exactBindings
      .constantsRegistryRawBytes.sizeBytes !==
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_BINDING_PINS.codata2022RawSizeBytes
  ) {
    throw new Error(
      "nhm2_spherical_v2_si_output_normalization_v2_codata_pin_drift",
    );
  }
  if (
    v1ReceiptSchema.exactEndpointAgreementRequired !== false ||
    v1ReceiptSchema.roundingAuditBound !== null ||
    v1ReceiptSchema.unresolvedRoundingAuditBoundBlocksExecution !== true ||
    JSON.stringify(v2.successorSemantics.tightenedPredecessorFieldsInOrder) !==
      '["scaleMaterializationReceiptSchema.exactEndpointAgreementRequired","scaleMaterializationReceiptSchema.roundingAuditBound","scaleMaterializationReceiptSchema.unresolvedRoundingAuditBoundBlocksExecution"]' ||
    v2.successorSemantics.successorPolicyRoot !== "zeroUlpPairAgreement" ||
    v2.zeroUlpPairAgreement.canonicalEndpointEqualityRequired !== true ||
    v2.zeroUlpPairAgreement.maximumEndpointDistanceUlp !== 0 ||
    v2.zeroUlpPairAgreement.maximumCentralRepresentativeDistanceUlp !== 0 ||
    v2.zeroUlpPairAgreement.unresolvedRoundingAuditBound !== false ||
    v2.zeroUlpPairAgreement.exactReceiptByteEqualityRequired !== false
  ) {
    throw new Error(
      "nhm2_spherical_v2_si_output_normalization_v2_zero_ulp_policy_invalid",
    );
  }
  if (
    JSON.stringify(v2.fixedMpfrExecution.scaleGraphOrder) !==
      JSON.stringify(
        NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION.mpfr256Context
          .scaleGraphOrder,
      ) ||
    JSON.stringify(v2.fixedMpfrExecution.centralRepresentativeGraphOrder) !==
      JSON.stringify(
        NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION.mpfr256Context
          .centralRepresentativeGraphOrder,
      ) ||
    v2.fixedMpfrExecution.mpfrVersion !== "4.2.2" ||
    v2.fixedMpfrExecution.precisionBitsForEveryDestination !== 256 ||
    v2.fixedMpfrExecution.lowerRoundingMode !== "MPFR_RNDD" ||
    v2.fixedMpfrExecution.upperRoundingMode !== "MPFR_RNDU" ||
    v2.fixedMpfrExecution.centralRoundingMode !== "MPFR_RNDN"
  ) {
    throw new Error(
      "nhm2_spherical_v2_si_output_normalization_v2_mpfr_graph_drift",
    );
  }
  if (
    v2.traceAgreement.ternaryComparison !== "normalized_sign_only" ||
    JSON.stringify(v2.traceAgreement.allowedCanonicalTernarySignsInOrder) !==
      "[-1,0,1]" ||
    v2.traceAgreement.rawNonzeroTernaryMagnitudeCompared !== false ||
    v2.traceAgreement.primitiveReturnAndInexactRulesInOrder.length !== 3 ||
    v2.traceAgreement.primitiveReturnAndInexactRulesInOrder[0]
      .rawReturnIsSemanticTernaryAuthority !== true ||
    v2.traceAgreement.primitiveReturnAndInexactRulesInOrder[1]
      .validRawParseStatusRequired !== 0 ||
    v2.traceAgreement.primitiveReturnAndInexactRulesInOrder[1]
      .rawReturnIsSemanticTernaryAuthority !== false ||
    v2.traceAgreement.primitiveReturnAndInexactRulesInOrder[2]
      .rawMpfrInexactFlagRequired !== false ||
    v2.traceAgreement.primitiveReturnAndInexactRulesInOrder[2]
      .rawMpfrInexactFlagIsSemanticTernaryAuthority !== false ||
    v2.laneIdentityAndLineage
      .rootPathStringInequalityAloneEstablishesLineageIndependence !== false ||
    v2.laneIdentityAndLineage
      .copiedOrHardlinkedBytesInDifferentRootsEstablishLineageIndependence !==
      false ||
    v2.laneIdentityAndLineage
      .independentReceiptMayReadPrimaryReceiptBeforeItsOwnPersistence !== false
  ) {
    throw new Error(
      "nhm2_spherical_v2_si_output_normalization_v2_independence_policy_invalid",
    );
  }
  for (const blocker of NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BLOCKERS) {
    if (!v2.blockers.includes(blocker)) {
      throw new Error(
        "nhm2_spherical_v2_si_output_normalization_v2_predecessor_blocker_removed",
      );
    }
  }
  assertFalseOrNullLeaves(v2.predecessorAuthorityLocks);
  assertFalseOrNullLeaves(v2.authorityAndReadinessLocks);
};

assertInvariants();

export const nhm2SphericalBosonStarV2SiOutputNormalizationV2Violations = (
  wire: unknown,
): string[] => {
  if (typeof wire !== "string") {
    return ["spherical_v2_si_output_normalization_v2_wire_type_invalid"];
  }
  if (
    wire.length >
    NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_VALIDATOR_LIMITS.maximumWireUtf16CodeUnits
  ) {
    return ["spherical_v2_si_output_normalization_v2_wire_utf16_limit"];
  }
  if (
    Buffer.byteLength(wire, "utf8") >
    NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_VALIDATOR_LIMITS.maximumWireUtf8Bytes
  ) {
    return ["spherical_v2_si_output_normalization_v2_wire_utf8_limit"];
  }
  return wire ===
    NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_CANONICAL_JSON
    ? []
    : ["spherical_v2_si_output_normalization_v2_canonical_wire_mismatch"];
};

export const isNhm2SphericalBosonStarV2SiOutputNormalizationV2Wire = (
  wire: unknown,
): wire is string =>
  nhm2SphericalBosonStarV2SiOutputNormalizationV2Violations(wire).length === 0;

export const cloneNhm2SphericalBosonStarV2SiOutputNormalizationV2CanonicalWire =
  (): string =>
    NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_CANONICAL_JSON;

if (
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_SHA256 !==
    NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_EXPECTED_SHA256 ||
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_CANONICAL_SIZE_BYTES !==
    NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_EXPECTED_CANONICAL_SIZE_BYTES
) {
  throw new Error(
    `nhm2_spherical_v2_si_output_normalization_v2_literal_pin_mismatch:${NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_SHA256}/${NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_CANONICAL_SIZE_BYTES}`,
  );
}
