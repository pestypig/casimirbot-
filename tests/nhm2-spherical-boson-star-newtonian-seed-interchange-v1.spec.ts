import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_CANONICAL_JSON,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_EXPECTED_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_PINS,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_SYNTHETIC_GOLDEN,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_VALIDATOR_LIMITS,
  isNhm2SphericalBosonStarNewtonianSeedInterchangeV1,
  nhm2SphericalBosonStarNewtonianSeedInterchangeV1Violations,
  nhm2SphericalSeedInterchangeCanonicalJsonV1,
  nhm2SphericalSeedInterchangeDirectedEndpointV1Violations,
  nhm2SphericalSeedInterchangeDirectedIntervalV1Violations,
  nhm2SphericalSeedInterchangeForbiddenRoleV1Violations,
  nhm2SphericalSeedInterchangeProofRecordHashV1,
} from "../shared/contracts/nhm2-spherical-boson-star-newtonian-seed-interchange.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256,
} from "../shared/contracts/nhm2-spherical-boson-star-newtonian-seed.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_SHA256,
} from "../shared/contracts/nhm2-spherical-boson-star-newtonian-seed-operation-policy.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_SHA256,
} from "../shared/contracts/nhm2-spherical-boson-star-newtonian-seed-primary-numerics.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_SHA256,
} from "../shared/contracts/nhm2-spherical-boson-star-newtonian-seed-directed-proof.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_SHA256,
} from "../shared/contracts/nhm2-spherical-boson-star-newtonian-seed-directed-proof-operator.v1";

const clone = (): Record<string, any> =>
  JSON.parse(
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_CANONICAL_JSON,
  );

describe("spherical Newtonian seed closed interchange v1", () => {
  it("pins the complete canonical policy independently", () => {
    const expectedSha =
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_EXPECTED_SHA256;
    const expectedSize =
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_EXPECTED_CANONICAL_SIZE_BYTES;
    expect(expectedSha).toMatch(/^[0-9a-f]{64}$/);
    expect(expectedSize).toBeGreaterThan(0);
    expect(NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_SHA256).toBe(
      expectedSha,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_CANONICAL_SIZE_BYTES,
    ).toBe(expectedSize);
    expect(
      createHash("sha256")
        .update(
          NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_SHA256_DOMAIN,
          "utf8",
        )
        .update(
          NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_CANONICAL_JSON,
          "utf8",
        )
        .digest("hex"),
    ).toBe(expectedSha);
  });

  it("exact-binds the seed, prepolicy, primary numerics, directed architecture, and directed operator", () => {
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_PINS,
    ).toEqual({
      semanticSeed: {
        sha256:
          "b2a89c8065bd6865b26aa1c4365d0f48edbd40e9c4f43e0cfbaca49db29a6c2c",
        canonicalSizeBytes: 18894,
      },
      operationPrepolicy: {
        sha256:
          "3aaadad7b8bec8d7883c172c380e10d3100c9e4c64404740b963e5820762de24",
        canonicalSizeBytes: 32308,
      },
      directedProofArchitecture: {
        sha256:
          "c8832ae77d1279d400f1fffbc587e413659c111ae90283cb34a016fb7e08ea99",
        canonicalSizeBytes: 42778,
      },
      primaryNumericsPolicy: {
        sha256:
          "a4ee03e387f9e3e0a9d1f117f6671aa6ac0ca3f97508706c0f52e811d15372a4",
        canonicalSizeBytes: 80055,
      },
      directedProofOperator: {
        sha256:
          "511609501b01560c7e8a15f99a5b94176b51fb0e9add9bf5aa1045ef51d2342b",
        canonicalSizeBytes: 34695,
      },
    });
    expect(NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256).toBe(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_PINS.semanticSeed
        .sha256,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_SIZE_BYTES,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_PINS.semanticSeed
        .canonicalSizeBytes,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_SHA256,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_PINS
        .operationPrepolicy.sha256,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_CANONICAL_SIZE_BYTES,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_PINS
        .operationPrepolicy.canonicalSizeBytes,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_SHA256,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_PINS
        .directedProofArchitecture.sha256,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_CANONICAL_SIZE_BYTES,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_PINS
        .directedProofArchitecture.canonicalSizeBytes,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_SHA256,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_PINS
        .primaryNumericsPolicy.sha256,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_CANONICAL_SIZE_BYTES,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_PINS
        .primaryNumericsPolicy.canonicalSizeBytes,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_SHA256,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_PINS
        .directedProofOperator.sha256,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_CANONICAL_SIZE_BYTES,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_PINS
        .directedProofOperator.canonicalSizeBytes,
    );
  });

  it("closes exactly five untrusted primary payload shapes and forbids producer-derived proof operands", () => {
    const descriptor =
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1.primaryCandidateDescriptor;
    expect(descriptor.primaryPayloadsInOrder).toEqual([
      expect.objectContaining({
        path: "scalars.f64le",
        elementCount: 9,
        sizeBytes: 72,
      }),
      expect.objectContaining({
        path: "coefficients/core_L2_u.f64le",
        elementCount: 128,
        sizeBytes: 1024,
      }),
      expect.objectContaining({
        path: "coefficients/core_L2_V.f64le",
        elementCount: 128,
        sizeBytes: 1024,
      }),
      expect.objectContaining({
        path: "coefficients/tail_H.f64le",
        elementCount: 32,
        sizeBytes: 256,
      }),
      expect.objectContaining({
        path: "coefficients/tail_Q.f64le",
        elementCount: 32,
        sizeBytes: 256,
      }),
    ]);
    expect(descriptor.primaryPayloadsInOrder[0].elementOrder).toEqual([
      "nu0",
      "Vc",
      "N0",
      "C",
      "kappa",
      "sigma",
      "lambda",
      "nu_star",
      "wSeed",
    ]);
    expect(descriptor.payloadDecode).toContain("negative-zero_bit-pattern");
    expect(descriptor.derivedValuesForbiddenFromDescriptorOrPayloads).toContain(
      "Y_Z0_Z1_Z_p_and_selected_radius",
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1.scopeBoundary
        .verifierRecomputesAllDerivedValuesFromAcceptedBytes,
    ).toBe(true);
  });

  it("freezes a unique canonical MPFR endpoint representation and interval order", () => {
    const golden =
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_SYNTHETIC_GOLDEN;
    expect(
      nhm2SphericalSeedInterchangeDirectedEndpointV1Violations(
        golden.lowerEndpoint,
      ),
    ).toEqual([]);
    expect(
      nhm2SphericalSeedInterchangeDirectedEndpointV1Violations(
        golden.upperEndpoint,
      ),
    ).toEqual([]);
    expect(
      nhm2SphericalSeedInterchangeDirectedEndpointV1Violations(
        golden.zeroLowerEndpoint,
      ),
    ).toEqual([]);
    expect(
      nhm2SphericalSeedInterchangeDirectedIntervalV1Violations([
        golden.lowerEndpoint,
        golden.upperEndpoint,
      ]),
    ).toEqual([]);
    expect(
      nhm2SphericalSeedInterchangeDirectedIntervalV1Violations([
        { ...golden.upperEndpoint, direction: "RNDD" },
        { ...golden.lowerEndpoint, direction: "RNDU" },
      ]),
    ).toEqual(["interval_lower_greater_than_upper"]);
    expect(
      nhm2SphericalSeedInterchangeCanonicalJsonV1([
        golden.lowerEndpoint,
        golden.upperEndpoint,
      ]),
    ).toBe(golden.canonicalIntervalJson);
    expect(
      createHash("sha256")
        .update(golden.canonicalIntervalJson, "utf8")
        .digest("hex"),
    ).toBe(golden.canonicalIntervalPlainSha256);

    for (const invalid of [
      { ...golden.lowerEndpoint, mantissaLowercaseHex: "6" },
      { ...golden.lowerEndpoint, mantissaLowercaseHex: "03" },
      { ...golden.lowerEndpoint, mantissaLowercaseHex: "A" },
      { ...golden.lowerEndpoint, precisionBits: 255 },
      { ...golden.lowerEndpoint, exponent2: 0.5 },
      { ...golden.zeroLowerEndpoint, exponent2: 1 },
      { ...golden.zeroLowerEndpoint, mantissaLowercaseHex: "00" },
    ]) {
      expect(
        nhm2SphericalSeedInterchangeDirectedEndpointV1Violations(invalid),
      ).not.toEqual([]);
    }
  });

  it("pins a synthetic canonical duty record and its length-delimited domain hash", () => {
    const golden =
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_SYNTHETIC_GOLDEN;
    expect(golden.candidateDataUsed).toBe(false);
    expect(golden.proofRecordSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(
      nhm2SphericalSeedInterchangeCanonicalJsonV1(
        golden.proofRecordWithoutPayloadSha256,
      ),
    ).toBe(golden.proofRecordCanonicalJson);
    expect(
      nhm2SphericalSeedInterchangeProofRecordHashV1(
        6,
        golden.proofRecordWithoutPayloadSha256,
      ),
    ).toBe(golden.proofRecordSha256);
    expect(() => nhm2SphericalSeedInterchangeProofRecordHashV1(16, {})).toThrow(
      "spherical_seed_interchange_duty_ordinal_invalid",
    );
    expect(() =>
      nhm2SphericalSeedInterchangeProofRecordHashV1(6, {
        payloadSha256: "0".repeat(64),
      }),
    ).toThrow("spherical_seed_interchange_record_hash_surface_invalid");
  });

  it("defines a distinct exact tagged payload variant, route, and record identity for every duty", () => {
    const union =
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1.proofRecordUnion;
    expect(union.exactDutyCount).toBe(16);
    expect(union.derivedMaximumProofRecordCount).toBe(4189905);
    expect(union.derivedMaximumProofRecordCount).toBeLessThanOrEqual(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1.jsonAndParserAbi
        .limits.maximumProofRecordsAcrossAllRoutes,
    );
    expect(union.dutyDefinitions).toHaveLength(16);
    expect(union.dutyDefinitions.map((duty) => duty.ordinal)).toEqual([
      ...Array(16).keys(),
    ]);
    expect(new Set(union.dutyDefinitions.map((duty) => duty.dutyId)).size).toBe(
      16,
    );
    expect(
      new Set(union.dutyDefinitions.map((duty) => duty.payloadTag)).size,
    ).toBe(16);
    for (const duty of union.dutyDefinitions) {
      expect(duty.payloadTag).toBe(`${duty.dutyId}/v1`);
      expect(duty.payloadExactKeys).toContain("tag");
      expect(duty.payloadExactKeys).toEqual([...duty.payloadExactKeys].sort());
      expect(
        Object.keys(
          union.payloadFieldTypesByDutyId[
            duty.dutyId as keyof typeof union.payloadFieldTypesByDutyId
          ],
        ).sort(),
      ).toEqual([...duty.payloadExactKeys].sort());
    }
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1.proofRouteAndSummarySchemas.routes.map(
        (route) => route.path,
      ),
    ).toEqual([
      "proof/origin.jsonl",
      "proof/core-intervals.jsonl",
      "proof/tail-intervals.jsonl",
      "proof/integrals.jsonl",
      "proof/scaling-and-bvp-init.jsonl",
    ]);
  });

  it("closes common, nested, nullable, decision, ordering, record, route, file, and aggregate semantics", () => {
    const policy = NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1;
    expect(policy.directedArchitectureSuccessorClosure).toMatchObject({
      predecessorBlockerClosedByThisSchema: true,
      closedSixteenDutyTaggedPayloadTypes: true,
      primaryToVerifierStructuralAbiSchemaComplete: true,
      primaryToVerifierActivated: true,
      activationRequiresReplacementPrimaryNumericsPolicyBinding: false,
      directedProofOperatorPolicyBindingSatisfied: true,
      predecessorDirectedOperatorMathematicalBlockersClosedByBoundSuccessorPolicy: true,
      proofInterchangeComplete: true,
    });
    expect(policy.proofRecordUnion.commonExactCanonicalKeyOrder).toHaveLength(
      20,
    );
    expect(policy.proofRecordUnion.commonFieldTypes).toMatchObject({
      directedProofOperatorBinding:
        "exact_DIRECTED_PROOF_OPERATOR_POLICY_BINDING",
      directedProofPolicyBinding: "exact_DIRECTED_PROOF_POLICY_BINDING",
      domainBox: "tuple_of_directedIntervals_or_null",
      implementationRole: "primary_verifier|independent_verifier",
      operationPrepolicyBinding: "exact_OPERATION_PREPOLICY_POLICY_BINDING",
      recordKind: "literal_recordKind_allowed_for_dutyOrdinal",
      semanticSeedBinding: "exact_SEMANTIC_SEED_POLICY_BINDING",
    });
    expect(policy.proofRecordUnion.conditionalRules).toEqual(
      expect.arrayContaining([
        expect.stringContaining("entryKind_coefficient"),
        expect.stringContaining("selected_radius_iff"),
        expect.stringContaining("endpoint_candidate"),
      ]),
    );
    expect(policy.proofRecordUnion.recordHashDomain).toMatch(/\/v1\n$/);
    expect(policy.proofRecordUnion.recordHash).toContain("u16le(dutyOrdinal)");
    expect(policy.proofRouteAndSummarySchemas.routeStreamHash).toContain(
      "recordCount",
    );
    expect(policy.proofRouteAndSummarySchemas.aggregateHash).toContain(
      "summaryHash_32_bytes",
    );
    expect(
      policy.proofRouteAndSummarySchemas.summaryExactCanonicalKeyOrder,
    ).not.toContain("aggregateBindingSha256");
    expect(policy.proofRouteAndSummarySchemas.hashGraphAcyclicity).toContain(
      "summary_binds_routes_but_no_aggregate",
    );
    expect(
      policy.proofRouteAndSummarySchemas.conclusionTaggedUnion.allPassedTag,
    ).toBe("all_directed_duties_passed_without_seed_or_solution_authority");
    expect(
      policy.proofRouteAndSummarySchemas.summaryMaySetSeedOrSolutionAuthority,
    ).toBe(false);
    expect(policy.independentAgreementReceiptSchema).toMatchObject({
      allMatchedStillAuthorityFalse: true,
      allMatchedMaySetSeedLampOrPhysicalClaims: false,
    });
    expect(policy.independentAgreementReceiptSchema.normalization).toContain(
      "remove_only_implementationRole_and_payloadSha256",
    );
    expect(policy.verifierBoundary.agreementPolicyPresent).toBe(true);
  });

  it("closes descriptor, manifest, toolchain, runtime, timing, freshness, dirty-tree, and preseal schemas", () => {
    const policy = NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1;
    expect(
      policy.primaryCandidateDescriptor.policyBindingsSchema
        .futureInstanceNullAllowed,
    ).toBe(false);
    expect(
      policy.primaryCandidateDescriptor.policyBindingsSchema
        .currentPolicyPrimaryNumericsBinding,
    ).toMatchObject({
      canonicalSizeBytes: 80055,
      sha256:
        "a4ee03e387f9e3e0a9d1f117f6671aa6ac0ca3f97508706c0f52e811d15372a4",
    });
    expect(
      policy.primaryCandidateDescriptor.policyBindingsSchema
        .currentPolicyDirectedProofOperatorBinding,
    ).toMatchObject({
      canonicalSizeBytes: 34695,
      sha256:
        "511609501b01560c7e8a15f99a5b94176b51fb0e9add9bf5aa1045ef51d2342b",
    });
    expect(policy.provenanceSchemas.manifest.roles).toEqual(
      expect.arrayContaining([
        "primary_source",
        "primary_toolchain",
        "primary_runtime",
        "independent_source",
        "independent_toolchain",
        "independent_runtime",
      ]),
    );
    expect(policy.provenanceSchemas.runProvenance.fieldTypes).toMatchObject({
      commit40: "lowercase_40_hex_git_commit",
      dirtyTreeDigestSha256: "lowercase_64_hex",
      timing: "exact_runTiming",
    });
    expect(policy.provenanceSchemas.runTiming.relation).toContain(
      "elapsed_equals_exact_base10_integer_subtraction",
    );
    expect(policy.provenanceSchemas.freshnessObservation.stable).toContain(
      "every_fileStat_field_must_match_exactly",
    );
    expect(policy.provenanceSchemas.preexecutionPreseal).toMatchObject({
      attemptOrdinal: 1,
      authorityFalse: true,
      immutableAfterCreation: true,
    });
    expect(
      policy.provenanceSchemas.preexecutionPreseal.creationBoundary,
    ).toContain("before_either_primary_or_independent_process_launch");
  });

  it("requires forbidden lever and tile roles to fail before any numeric open", () => {
    const policy = NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1;
    expect(policy.forbiddenRoleAdmission.timing).toBe(
      "must_complete_before_any_numeric_payload_open_or_decode",
    );
    expect(
      policy.jsonAndParserAbi.rawAdmissionOrder.indexOf(
        "enforce_closed_exact-key_schemas_then_scan_every_key_and_role-bearing_string_for_forbidden_lever_or_tile_tokens",
      ),
    ).toBeLessThan(
      policy.jsonAndParserAbi.rawAdmissionOrder.indexOf(
        "only_then_open_hash_and_decode_the_five_numeric_payloads",
      ),
    );
    expect(
      nhm2SphericalSeedInterchangeForbiddenRoleV1Violations({
        envelope: { role: "declared_lever_tensor" },
      }),
    ).toEqual(["forbidden_lever_or_tile_role:/envelope/role"]);
    expect(
      nhm2SphericalSeedInterchangeForbiddenRoleV1Violations({
        envelope: [{ safe: true }, { tileSchedule: "forged" }],
      }),
    ).toEqual(["forbidden_lever_or_tile_role:/envelope/1/tileSchedule"]);
    expect(
      nhm2SphericalSeedInterchangeForbiddenRoleV1Violations({
        semanticRole: "primary_scalar_operands",
        nested: { path: "coefficients/core_L2_u.f64le" },
      }),
    ).toEqual([]);
  });

  it("freezes typed authority-false failure and fully durable no-overwrite atomic directory publication", () => {
    const policy = NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1;
    expect(policy.failureReceiptSchema).toMatchObject({
      authorityFalse: true,
      noCandidateNumericValuesIntervalsMetricsOrVerdicts: true,
    });
    expect(policy.failureReceiptSchema.candidateDisposition).toContain(
      "without_retune_retry",
    );
    expect(policy.atomicDirectoryPublication.tempRoot).toContain(
      "32_lowercase_hex_getrandom_nonce",
    );
    expect(policy.atomicDirectoryPublication.writeAndSyncOrder).toEqual(
      expect.arrayContaining([
        expect.stringContaining("fdatasync_then_fsync_each_file"),
        expect.stringContaining("fsync_every_child_directory_bottom-up"),
        expect.stringContaining("RENAME_NOREPLACE"),
        expect.stringContaining("reopen_the_final_root"),
      ]),
    );
    expect(policy.atomicDirectoryPublication.partialOutputAuthority).toBe(
      false,
    );
    expect(policy.atomicDirectoryPublication.overwriteOrReuseAllowed).toBe(
      false,
    );
    expect(policy.atomicDirectoryPublication.tempFailureDisposition).toContain(
      "leave_the_exact_nonce_temp_root_as_non-authoritative_quarantine",
    );
    expect(
      policy.atomicDirectoryPublication.tempFailureDisposition,
    ).not.toContain("leave_or");
    expect(
      policy.atomicDirectoryPublication.currentWindowsHostExecutionAdmissible,
    ).toBe(false);
  });

  it("marks the bound interchange complete while keeping implementations, execution, lamps, and physical claims shut", () => {
    const policy = NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1;
    expect(policy.completionBoundary).toMatchObject({
      primaryNumericsPolicyBound: true,
      directedProofOperatorBound: true,
      proofInterchangeComplete: true,
      exactPrimaryToVerifierAbiComplete: true,
      exactReceiptSchemasComplete: true,
      implementationComplete: false,
      runtimeClosureComplete: false,
      preexecutionPresealComplete: false,
      executionAuthorized: false,
      executionObserved: false,
      seedAccepted: false,
    });
    expect(policy.blockers).not.toContain(
      "replacement_primary_numerics_policy_canonical_binding_pending",
    );
    expect(policy.blockers).not.toContain(
      "exact_directed_proof_operator_policy_canonical_binding_pending",
    );
    expect(policy.authorityLocks.proofInterchangeComplete).toBe(true);
    expect(
      Object.entries(policy.authorityLocks)
        .filter(([key]) => key !== "proofInterchangeComplete")
        .every(([, value]) => !value),
    ).toBe(true);
    expect(Object.values(policy.claimLocks).every((value) => !value)).toBe(
      true,
    );
    expect(
      Object.values(policy.unresolved).every((value) => value === null),
    ).toBe(true);
    expect(policy.attemptPolicy).toMatchObject({
      maximumCandidateAttempts: 1,
      retryAllowed: false,
      retuneAllowed: false,
    });
  });

  it("accepts only the deeply frozen singleton and distinguishes an exact external copy", () => {
    const policy = NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1;
    expect(isNhm2SphericalBosonStarNewtonianSeedInterchangeV1(policy)).toBe(
      true,
    );
    expect(
      nhm2SphericalBosonStarNewtonianSeedInterchangeV1Violations(policy),
    ).toEqual([]);
    expect(Object.isFrozen(policy)).toBe(true);
    expect(Object.isFrozen(policy.proofRecordUnion)).toBe(true);
    expect(Object.isFrozen(policy.proofRecordUnion.dutyDefinitions)).toBe(true);
    expect(
      nhm2SphericalBosonStarNewtonianSeedInterchangeV1Violations(clone()),
    ).toEqual(["spherical_seed_interchange_external_copy_not_authoritative"]);
  });

  it("rejects semantic and authority drift", () => {
    const authority = clone();
    authority.authorityLocks.physicalViability = true;
    expect(
      nhm2SphericalBosonStarNewtonianSeedInterchangeV1Violations(authority),
    ).toEqual(["spherical_seed_interchange_semantic_mismatch"]);

    const binding = clone();
    binding.bindings.directedProofOperator = {
      sha256: "0".repeat(64),
    };
    expect(
      nhm2SphericalBosonStarNewtonianSeedInterchangeV1Violations(binding),
    ).toEqual(["spherical_seed_interchange_semantic_mismatch"]);

    const payload = clone();
    payload.primaryCandidateDescriptor.primaryPayloadsInOrder[0].sizeBytes = 80;
    expect(
      nhm2SphericalBosonStarNewtonianSeedInterchangeV1Violations(payload),
    ).toEqual(["spherical_seed_interchange_semantic_mismatch"]);
  });

  it("rejects proxies and accessors without executing traps", () => {
    let trapReads = 0;
    const proxy = new Proxy(clone(), {
      getPrototypeOf() {
        trapReads += 1;
        throw new Error("must not execute");
      },
      ownKeys() {
        trapReads += 1;
        throw new Error("must not execute");
      },
    });
    expect(
      nhm2SphericalBosonStarNewtonianSeedInterchangeV1Violations(proxy),
    ).toEqual(["proxy_forbidden:/"]);
    expect(trapReads).toBe(0);

    const accessor = clone();
    Object.defineProperty(accessor, "maturity", {
      enumerable: true,
      get() {
        trapReads += 1;
        throw new Error("must not execute");
      },
    });
    expect(
      nhm2SphericalBosonStarNewtonianSeedInterchangeV1Violations(accessor),
    ).toEqual(["object_property_surface:/maturity"]);
    expect(trapReads).toBe(0);
  });

  it("rejects hidden, symbolic, forbidden, sparse, side-property, and cyclic surfaces", () => {
    const hidden = clone();
    Object.defineProperty(hidden, "hidden", { value: true, enumerable: false });
    expect(
      nhm2SphericalBosonStarNewtonianSeedInterchangeV1Violations(hidden),
    ).toEqual(["object_property_surface:/hidden"]);

    const symbolic = clone() as Record<PropertyKey, unknown>;
    symbolic[Symbol("hidden")] = true;
    expect(
      nhm2SphericalBosonStarNewtonianSeedInterchangeV1Violations(symbolic),
    ).toEqual(["symbol_key:/"]);

    const poisoned: Record<string, unknown> = {};
    Object.defineProperty(poisoned, "constructor", {
      value: true,
      enumerable: true,
    });
    expect(
      nhm2SphericalBosonStarNewtonianSeedInterchangeV1Violations(poisoned),
    ).toEqual(["forbidden_key:/constructor"]);

    const sparse = new Array(2);
    sparse[1] = true;
    expect(
      nhm2SphericalBosonStarNewtonianSeedInterchangeV1Violations(sparse),
    ).toEqual(["array_surface:/"]);

    const side = [true] as unknown[] & { side?: boolean };
    side.side = true;
    expect(
      nhm2SphericalBosonStarNewtonianSeedInterchangeV1Violations(side),
    ).toEqual(["array_surface:/"]);

    const cycle: { self?: unknown } = {};
    cycle.self = cycle;
    expect(
      nhm2SphericalBosonStarNewtonianSeedInterchangeV1Violations(cycle),
    ).toEqual(["cycle:/self"]);
  });

  it("bounds deep, wide, node-heavy, long-string, and invalid-number inputs", () => {
    const limits =
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_VALIDATOR_LIMITS;

    let cursor: Record<string, unknown> = {};
    const deep = cursor;
    for (let depth = 0; depth <= limits.maximumDepth; depth += 1) {
      const child: Record<string, unknown> = {};
      cursor.child = child;
      cursor = child;
    }
    expect(
      nhm2SphericalBosonStarNewtonianSeedInterchangeV1Violations(deep)[0],
    ).toContain("snapshot_depth_limit:");

    const wideObject: Record<string, number> = {};
    for (
      let index = 0;
      index <= limits.maximumObjectPropertyCount;
      index += 1
    ) {
      wideObject[`k${index}`] = index;
    }
    expect(
      nhm2SphericalBosonStarNewtonianSeedInterchangeV1Violations(wideObject),
    ).toEqual(["object_property_count_limit:/"]);

    const wideArray = Array.from(
      { length: limits.maximumArrayLength + 1 },
      () => 0,
    );
    expect(
      nhm2SphericalBosonStarNewtonianSeedInterchangeV1Violations(wideArray),
    ).toEqual(["array_length_limit:/"]);

    const nodeBomb = Array.from({ length: 65 }, () =>
      Array.from({ length: 512 }, () => 0),
    );
    expect(
      nhm2SphericalBosonStarNewtonianSeedInterchangeV1Violations(nodeBomb)[0],
    ).toContain("snapshot_node_limit:");

    expect(
      nhm2SphericalBosonStarNewtonianSeedInterchangeV1Violations(
        "x".repeat(limits.maximumStringUtf8Bytes + 1),
      ),
    ).toEqual(["invalid_string:/"]);
    for (const invalidKey of [
      "x".repeat(limits.maximumStringUtf8Bytes + 1),
      "safe\u0000key",
      "safe\ud800key",
    ]) {
      const invalidKeyObject: Record<string, unknown> = {};
      Object.defineProperty(invalidKeyObject, invalidKey, {
        value: true,
        enumerable: true,
      });
      expect(
        nhm2SphericalBosonStarNewtonianSeedInterchangeV1Violations(
          invalidKeyObject,
        ),
      ).toEqual(["invalid_object_key:/"]);
      expect(
        nhm2SphericalSeedInterchangeForbiddenRoleV1Violations(invalidKeyObject),
      ).toEqual(["invalid_object_key:/"]);
    }
    for (const invalid of [1.25, Number.NaN, Number.POSITIVE_INFINITY, -0]) {
      expect(
        nhm2SphericalBosonStarNewtonianSeedInterchangeV1Violations(invalid),
      ).toEqual(["invalid_json_number:/"]);
    }
  });
});
