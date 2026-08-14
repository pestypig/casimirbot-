import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION,
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BLOCKERS,
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_EXPECTED_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_SHA256,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-si-output-normalization.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2,
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_AUTHORITY_AND_READINESS_LOCKS,
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_BINDING_PINS,
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_BLOCKERS,
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_CANONICAL_JSON,
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_EXPECTED_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_VALIDATOR_LIMITS,
  cloneNhm2SphericalBosonStarV2SiOutputNormalizationV2CanonicalWire,
  isNhm2SphericalBosonStarV2SiOutputNormalizationV2Wire,
  nhm2SphericalBosonStarV2SiOutputNormalizationV2Violations,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-si-output-normalization.v2";

const everyLeafFalseOrNull = (value: unknown): boolean => {
  if (value === false || value === null) return true;
  if (value === true || typeof value !== "object" || value === null) {
    return false;
  }
  return Object.values(value).every((child) => everyLeafFalseOrNull(child));
};

const expectCanonicalObjectKeyOrder = (value: unknown): void => {
  if (Array.isArray(value)) {
    value.forEach((entry) => expectCanonicalObjectKeyOrder(entry));
    return;
  }
  if (value === null || typeof value !== "object") return;
  const keys = Object.keys(value);
  expect(keys).toEqual([...keys].sort());
  Object.values(value).forEach((entry) => expectCanonicalObjectKeyOrder(entry));
};

const resolveOwnPath = (root: unknown, path: string): unknown => {
  let cursor = root;
  for (const key of path.split(".")) {
    if (
      cursor === null ||
      typeof cursor !== "object" ||
      !Object.prototype.hasOwnProperty.call(cursor, key)
    ) {
      throw new Error(`unresolved contract path: ${path}`);
    }
    cursor = (cursor as Record<string, unknown>)[key];
  }
  return cursor;
};

describe("NHM2 spherical boson-star v2 SI output-normalization v2 successor", () => {
  it("has the independently reviewed trace-repaired literal seal", () => {
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_SHA256_DOMAIN,
    ).toBe("nhm2-spherical-boson-star-v2-si-output-normalization/v2\n");
    expect(NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_SHA256).toBe(
      "6af028d078ecc4cc9076eb45476fd87ac448503170e88fccf0ada3a98d06cafb",
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_EXPECTED_SHA256,
    ).toBe("6af028d078ecc4cc9076eb45476fd87ac448503170e88fccf0ada3a98d06cafb");
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_CANONICAL_SIZE_BYTES,
    ).toBe(15_246);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_EXPECTED_CANONICAL_SIZE_BYTES,
    ).toBe(15_246);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_BINDING,
    ).toMatchObject({
      artifactId: "nhm2.spherical_boson_star_v2.si_output_normalization",
      contractVersion:
        "nhm2_spherical_boson_star_v2_si_output_normalization/v2",
      sha256Domain: "nhm2-spherical-boson-star-v2-si-output-normalization/v2\n",
      sha256:
        "6af028d078ecc4cc9076eb45476fd87ac448503170e88fccf0ada3a98d06cafb",
      canonicalSizeBytes: 15_246,
      mediaType: "application/json",
    });
  });

  it("exact-binds the unchanged v1 semantic and CODATA raw bytes", () => {
    expect(NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_SHA256).toBe(
      "16224114ce7bc790d1e5ceeaf8f75e31e5c37412856c5bea8b99284301bf3c24",
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_EXPECTED_SHA256,
    ).toBe("16224114ce7bc790d1e5ceeaf8f75e31e5c37412856c5bea8b99284301bf3c24");
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_CANONICAL_SIZE_BYTES,
    ).toBe(23_822);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_EXPECTED_CANONICAL_SIZE_BYTES,
    ).toBe(23_822);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_BINDING_PINS,
    ).toMatchObject({
      predecessorSha256:
        "16224114ce7bc790d1e5ceeaf8f75e31e5c37412856c5bea8b99284301bf3c24",
      predecessorCanonicalSizeBytes: 23_822,
      codata2022RawSha256:
        "5a7e10ed709577c224cf45f78199dd143a7f9cf10d6f8fe8c018e168454b7a61",
      codata2022RawSizeBytes: 6_180,
    });
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2.exactBindings
        .constantsRegistryRawBytes,
    ).toMatchObject({
      sha256:
        "5a7e10ed709577c224cf45f78199dd143a7f9cf10d6f8fe8c018e168454b7a61",
      sizeBytes: 6_180,
      rawBytesNotParsedProjection: true,
      bothLanesMustIndependentlyRehashBeforeAnyConstantConstruction: true,
    });
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2.successorSemantics,
    ).toMatchObject({
      additiveSuccessor: true,
      predecessorMutationAllowed: false,
      downstreamPredecessorPinMutationAllowed: false,
      predecessorExactEndpointAgreementRequired: false,
      predecessorRoundingAuditBound: null,
      predecessorUnresolvedRoundingAuditBoundBlocksExecution: true,
      successorMaySupplyExecutionOrPhysicalAuthority: false,
    });
    const tightenedFields =
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2.successorSemantics
        .tightenedPredecessorFieldsInOrder;
    expect(tightenedFields).toEqual([
      "scaleMaterializationReceiptSchema.exactEndpointAgreementRequired",
      "scaleMaterializationReceiptSchema.roundingAuditBound",
      "scaleMaterializationReceiptSchema.unresolvedRoundingAuditBoundBlocksExecution",
    ]);
    expect(
      tightenedFields.map((path) =>
        resolveOwnPath(
          NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION,
          path,
        ),
      ),
    ).toEqual([false, null, true]);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2.successorSemantics
        .successorPolicyRoot,
    ).toBe("zeroUlpPairAgreement");
    expect(
      resolveOwnPath(
        NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2,
        NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2
          .successorSemantics.successorPolicyRoot,
      ),
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2.zeroUlpPairAgreement,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION
        .scaleMaterializationReceiptSchema.exactEndpointAgreementRequired,
    ).toBe(false);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION
        .scaleMaterializationReceiptSchema.roundingAuditBound,
    ).toBeNull();
  });

  it("freezes the exact MPFR 4.2.2 graph and zero-ulp semantic projection", () => {
    const fixed =
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2.fixedMpfrExecution;
    expect(fixed).toMatchObject({
      library: "GNU_MPFR",
      mpfrVersion: "4.2.2",
      gmpVersion: "6.3.0",
      precisionBitsForEveryDestination: 256,
      exponentMinimum: -1_000_000,
      exponentMaximum: 1_000_000,
      lowerRoundingMode: "MPFR_RNDD",
      upperRoundingMode: "MPFR_RNDU",
      centralRoundingMode: "MPFR_RNDN",
      faithfulRoundingModeAllowed: false,
      directNativeAbiCallsRequiredForEveryNamedPrimitive: true,
      highLevelNumericWrapperMaySubstituteForDirectNativeAbi: false,
      scaleGraphNodeCount: 49,
      centralRepresentativeGraphNodeCount: 27,
    });
    expect(fixed.scaleGraphOrder).toEqual(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION.mpfr256Context
        .scaleGraphOrder,
    );
    expect(fixed.centralRepresentativeGraphOrder).toEqual(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION.mpfr256Context
        .centralRepresentativeGraphOrder,
    );
    expect(fixed.requiredScaleIdsInOrder).toHaveLength(13);

    const agreement =
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2.zeroUlpPairAgreement;
    expect(agreement).toMatchObject({
      policyStatus: "frozen_pre_execution_not_observed",
      directedScaleCount: 13,
      directedEndpointsPerScale: 2,
      centralRepresentativeCount: 4,
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
      equalityMayEstablishReadinessOrAuthority: false,
    });
    expect(agreement.intervalEndpointFieldsComparedInOrder).toEqual([
      "sign",
      "mantissaLowercaseHex",
      "exponent2",
      "precisionBits",
      "direction",
    ]);
  });

  it("compares only canonical ternary signs after each lane validates itself", () => {
    const trace =
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2.traceAgreement;
    expect(trace).toMatchObject({
      eachLaneMustFirstValidateItsOwnExactOperationChronology: true,
      eachLaneMustFirstValidateItsOwnForbiddenFlags: true,
      eachLaneMustFirstValidateItsOwnCanonicalMpfrDyadics: true,
      eachLaneMustFirstValidateItsOwnV2Binding: true,
      ternaryComparison: "normalized_sign_only",
      rawNonzeroTernaryMagnitudeCompared: false,
      pointerOrAddressCompared: false,
      filesystemPathCompared: false,
      receiptHashComparedAsNumericalEvidence: false,
      runtimeOrProvenanceFieldComparedAsNumericalEvidence: false,
    });
    expect(trace.allowedCanonicalTernarySignsInOrder).toEqual([-1, 0, 1]);
    expect(trace.primitiveReturnAndInexactRulesInOrder).toEqual([
      {
        caseId: "ordinary_ternary_returning_mpfr_primitive",
        appliesTo:
          "every_frozen_ternary_returning_MPFR_primitive_except_mpfr_set_str_and_mpfr_get_d",
        rawReturnKind: "MPFR_ternary_int",
        semanticTernarySignDerivation:
          "normalize_any_raw_int_sign_to_-1_0_or_1",
        rawInexactFlagRequirement:
          "must_equal_(normalized_semantic_ternary_sign_not_equal_to_0)",
        rawReturnIsSemanticTernaryAuthority: true,
      },
      {
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
      },
      {
        caseId: "mpfr_get_d_binary64_result",
        appliesTo: "mpfr_get_d",
        rawReturnKind: "binary64_value_no_MPFR_ternary_return",
        semanticTernarySignDerivation:
          "compare_exact_binary64_result_dyadic_to_source_MPFR256_dyadic",
        rawMpfrInexactFlagRequired: false,
        rawMpfrInexactFlagIsSemanticTernaryAuthority: false,
        rawBinary64ResultIsSemanticTernaryAuthority: false,
      },
    ]);
    expect("inexactFlagMayBeDerivedOnlyFromTernarySignNonzero" in trace).toBe(
      false,
    );
    expect(trace.comparedSemanticFieldsInOrder).toEqual([
      "ordinal",
      "label",
      "primitive",
      "roundingMode",
      "ternarySign",
      "forbiddenFlagsInFrozenOrder",
      "canonicalResultDyadic",
    ]);
  });

  it("requires genuine lane-distinct lineage rather than different root strings", () => {
    const lineage =
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2.laneIdentityAndLineage;
    expect(lineage).toMatchObject({
      laneOrder: ["primary", "independent"],
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
      numericalEqualityMayReplaceLineageEvidence: false,
    });
  });

  it("forbids cross-lane observation until both receipts are independently persisted", () => {
    const contract = NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2;
    expect(
      contract.laneIdentityAndLineage
        .independentReceiptMayReadPrimaryReceiptBeforeItsOwnPersistence,
    ).toBe(false);
    expect(
      contract.laneIdentityAndLineage
        .primaryReceiptMayReadIndependentReceiptBeforeItsOwnPersistence,
    ).toBe(false);
    expect(
      contract.zeroUlpPairAgreement
        .equalityMayBeEvaluatedBeforeBothReceiptsAreIndependentlyValidatedPersistedAndRehashed,
    ).toBe(false);
    expect(contract.comparisonChronology).toEqual([
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
    ]);
  });

  it("freezes a pathless canonical receipt protocol while keeping receipts absent", () => {
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2.canonicalReceiptProtocol,
    ).toEqual({
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
      maximumWireUtf16CodeUnits: 131_072,
      maximumWireUtf8Bytes: 262_144,
      fixedArgv: [
        "--emit-nhm2-spherical-boson-star-v2-si-normalization-receipt-v2",
      ],
      stdinBytes:
        "exact_6180_byte_CODATA_2022_registry_raw_bytes_and_nothing_else",
      stdoutBytes:
        "exactly_one_bounded_canonical_JSON_receipt_and_nothing_else",
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
    });
  });

  it("preserves every predecessor blocker and leaves every authority/readiness leaf false or null", () => {
    for (const blocker of NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BLOCKERS) {
      expect(
        NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_BLOCKERS,
      ).toContain(blocker);
    }
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_BLOCKERS,
    ).toEqual(
      expect.arrayContaining([
        "primary_direct_native_full_contract_operation_graph_not_implemented",
        "primary_authenticated_mpfr256_runtime_binding_absent",
        "source_disjoint_independent_direct_native_mpfr256_implementation_absent",
        "independent_authenticated_mpfr256_runtime_binding_absent",
        "lane_distinct_provenance_storage_and_runtime_identity_evidence_absent",
        "independently_persisted_canonical_primary_and_independent_receipts_absent",
        "server_rehash_and_zero_ulp_pair_comparison_not_observed",
      ]),
    );
    expect(
      everyLeafFalseOrNull(
        NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2.predecessorAuthorityLocks,
      ),
    ).toBe(true);
    expect(
      everyLeafFalseOrNull(
        NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_AUTHORITY_AND_READINESS_LOCKS,
      ),
    ).toBe(true);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_AUTHORITY_AND_READINESS_LOCKS,
    ).toMatchObject({
      normalizationReceipt: null,
      pairAgreement: null,
      pairComparisonReady: false,
      pairComparisonObserved: false,
      independentAgreement: false,
      scientificPresealMaterialized: false,
      executionAuthorized: false,
      executionObserved: false,
      semiclassicalStressNoiseLamp: false,
      semiclassicalConstraintAlgebraLamp: false,
      physicalViability: false,
      propulsion: false,
      transport: false,
    });
  });

  it("admits only the exact bounded primitive canonical JSON wire", () => {
    expect(
      nhm2SphericalBosonStarV2SiOutputNormalizationV2Violations(
        NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_CANONICAL_JSON,
      ),
    ).toEqual([]);
    expect(
      isNhm2SphericalBosonStarV2SiOutputNormalizationV2Wire(
        NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_CANONICAL_JSON,
      ),
    ).toBe(true);
    expect(
      cloneNhm2SphericalBosonStarV2SiOutputNormalizationV2CanonicalWire(),
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_CANONICAL_JSON,
    );
    expect(
      nhm2SphericalBosonStarV2SiOutputNormalizationV2Violations(
        JSON.stringify(
          JSON.parse(
            NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_CANONICAL_JSON,
          ),
          null,
          2,
        ),
      ),
    ).toEqual([
      "spherical_v2_si_output_normalization_v2_canonical_wire_mismatch",
    ]);
    expect(
      nhm2SphericalBosonStarV2SiOutputNormalizationV2Violations(
        NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2,
      ),
    ).toEqual(["spherical_v2_si_output_normalization_v2_wire_type_invalid"]);
    expect(
      nhm2SphericalBosonStarV2SiOutputNormalizationV2Violations(
        new String(
          NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_CANONICAL_JSON,
        ),
      ),
    ).toEqual(["spherical_v2_si_output_normalization_v2_wire_type_invalid"]);
  });

  it("writes the direct canonical wire in the frozen lexicographic key order", () => {
    const parsed = JSON.parse(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_CANONICAL_JSON,
    ) as Record<string, unknown>;
    expect(Object.keys(parsed)).toEqual([
      "artifactId",
      "authorityAndReadinessLocks",
      "blockers",
      "canonicalReceiptProtocol",
      "comparisonChronology",
      "contractVersion",
      "exactBindings",
      "fixedMpfrExecution",
      "laneIdentityAndLineage",
      "phase",
      "predecessorAuthorityLocks",
      "successorSemantics",
      "traceAgreement",
      "zeroUlpPairAgreement",
    ]);
    expectCanonicalObjectKeyOrder(parsed);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_CANONICAL_JSON,
    ).toMatch(
      /^\{"artifactId":"nhm2\.spherical_boson_star_v2\.si_output_normalization","authorityAndReadinessLocks":/,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_CANONICAL_JSON,
    ).not.toMatch(/[\r\n\t]/);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_CANONICAL_JSON,
    ).not.toContain(": ");
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_CANONICAL_JSON,
    ).not.toContain(", ");
  });

  it("rejects hostile non-string values without invoking traps or accessors", () => {
    let trapCount = 0;
    const hostileProxy = new Proxy(Object.create(null) as object, {
      get() {
        trapCount += 1;
        throw new Error("trap");
      },
      getPrototypeOf() {
        trapCount += 1;
        throw new Error("trap");
      },
      ownKeys() {
        trapCount += 1;
        throw new Error("trap");
      },
    });
    const hostileAccessor = Object.create(null) as Record<string, unknown>;
    Object.defineProperty(hostileAccessor, "wire", {
      enumerable: true,
      get() {
        trapCount += 1;
        throw new Error("accessor");
      },
    });

    for (const value of [
      hostileProxy,
      hostileAccessor,
      null,
      undefined,
      1,
      1n,
      true,
      Symbol("wire"),
      () => "wire",
    ]) {
      expect(
        nhm2SphericalBosonStarV2SiOutputNormalizationV2Violations(value),
      ).toEqual(["spherical_v2_si_output_normalization_v2_wire_type_invalid"]);
    }
    expect(trapCount).toBe(0);
  });

  it("enforces UTF-16 and UTF-8 limits before canonical comparison", () => {
    expect(
      nhm2SphericalBosonStarV2SiOutputNormalizationV2Violations(
        "a".repeat(
          NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_VALIDATOR_LIMITS.maximumWireUtf16CodeUnits +
            1,
        ),
      ),
    ).toEqual(["spherical_v2_si_output_normalization_v2_wire_utf16_limit"]);
    expect(
      nhm2SphericalBosonStarV2SiOutputNormalizationV2Violations(
        "\u0800".repeat(100_000),
      ),
    ).toEqual(["spherical_v2_si_output_normalization_v2_wire_utf8_limit"]);
  });

  it("is deeply frozen and exposes no filesystem, process, or alternate numeric backend", () => {
    expect(
      Object.isFrozen(NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2),
    ).toBe(true);
    expect(
      Object.isFrozen(
        NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2
          .fixedMpfrExecution.scaleGraphOrder,
      ),
    ).toBe(true);

    const source = readFileSync(
      new URL(
        "../shared/contracts/nhm2-spherical-boson-star-v2-si-output-normalization.v2.ts",
        import.meta.url,
      ),
      "utf8",
    );
    expect(source).toContain(
      '"6af028d078ecc4cc9076eb45476fd87ac448503170e88fccf0ada3a98d06cafb" as const',
    );
    expect(source).toContain("15_246 as const");
    expect(source).not.toContain("PENDING_SEMANTIC_PRESEAL");
    expect(source).not.toMatch(
      /from ["']node:(?:fs|child_process|worker_threads)/,
    );
    expect(source).not.toMatch(/from ["'](?:gmpy2|mpmath|decimal|numpy)/);
    expect(source).not.toContain("Math.PI");
    expect(source).not.toContain("Date.now");
    expect(source).not.toContain("new Date");
    expect(source).not.toContain("process.env");
    expect(source).not.toContain("process.argv");
  });
});
