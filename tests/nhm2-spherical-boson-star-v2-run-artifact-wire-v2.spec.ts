import { createHash } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

import {
  computeNhm2SphericalBosonStarV2OutputRootPlanSha256,
  computeNhm2SphericalBosonStarV2PrePresealStaticClosureSha256,
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-preexecution-profile.v2";
import {
  computeNhm2SphericalBosonStarV2SkeletonByteBindingV2,
  computeNhm2SphericalBosonStarV2SkeletonPersistenceReceiptByteBinding,
  computeNhm2SphericalBosonStarV2SkeletonPersistenceReceiptSha256,
  deriveNhm2SphericalBosonStarV2DiagnosticPersistedSkeletonBindingV2,
  deriveNhm2SphericalBosonStarV2PreexecutionOutputSkeletonV2CanonicalJson,
  NHM2_SPHERICAL_BOSON_STAR_V2_HASHLESS_OUTPUT_INVENTORY_PLAN,
  NHM2_SPHERICAL_BOSON_STAR_V2_PRE_PRESEAL_STATIC_CLOSURE_EXACT_KEYS,
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_OUTPUT_SKELETON_V2_ARTIFACT_ID,
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_OUTPUT_SKELETON_V2_CONTRACT_VERSION,
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2,
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_AUTHORITY_LOCKS,
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_CANONICAL_JSON,
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_CLAIM_LOCKS,
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_EXPECTED_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_LAMPS,
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_LIMITS,
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_DEFINITION_BINDINGS,
  NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_BLOCKERS,
  NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_EXACT_KEYS,
  NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_INSTANCES,
  NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_PERSISTENCE_RECEIPT_ARTIFACT_ID,
  NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_PERSISTENCE_RECEIPT_CONTRACT_VERSION,
  NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_PERSISTENCE_RECEIPT_EXACT_KEYS,
  NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_READINESS,
  NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_WIRE_V2_SHA256_DOMAIN,
  nhm2SphericalBosonStarV2PreexecutionOutputSkeletonV2Violations,
  nhm2SphericalBosonStarV2RunArtifactWireV2CanonicalJson,
  nhm2SphericalBosonStarV2SkeletonPersistencePairViolations,
  nhm2SphericalBosonStarV2SkeletonPersistenceReceiptViolations,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-run-artifact-wire.v2";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

const canonical = (value: Json): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonical(value[key]!)}`)
    .join(",")}}`;
};

const sha256 = (bytes: string): string =>
  createHash("sha256").update(bytes, "utf8").digest("hex");

const u64le = (value: number): Buffer => {
  const output = Buffer.alloc(8);
  output.writeBigUInt64LE(BigInt(value));
  return output;
};

const hash = (label: string): string => sha256(`fixture:${label}`);

const outputRootPlan = [
  { role: "primary", absolutePath: "/srv/nhm2/runs/primary" },
  { role: "independent", absolutePath: "/srv/nhm2/runs/independent" },
] as const;

const makeA = (): Record<string, Json> => ({
  schemaVersion: "nhm2_spherical_boson_star_v2_pre_preseal_static_closure/v1",
  closurePhase: "pre_scientific_preseal",
  preexecutionProfileBinding: structuredClone(
    NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING,
  ) as unknown as Json,
  commandArgvSha256: hash("argv"),
  prePresealStaticInputAggregateSha256: hash("static-inputs"),
  prePresealFreshnessInventorySha256: hash("freshness"),
  dirtyTreeDigestSha256: hash("dirty-tree"),
  expectedRuntimeClosureSha256: hash("expected-runtime"),
  outputRootPlan: structuredClone(outputRootPlan) as unknown as Json,
  outputRootPlanSha256: computeNhm2SphericalBosonStarV2OutputRootPlanSha256(
    canonical(outputRootPlan as unknown as Json),
  ),
});

const makeSkeleton = (a: Record<string, Json> = makeA()): string =>
  deriveNhm2SphericalBosonStarV2PreexecutionOutputSkeletonV2CanonicalJson(
    canonical(a),
    canonical({ skeletonFrozenAt: "2026-08-14T12:00:00.000000001Z" }),
  );

const makeUnsignedReceipt = (
  skeletonCanonicalJson: string,
  path = "/srv/nhm2/preexecution/output-skeleton.v2.json",
): Record<string, Json> => {
  const binding = computeNhm2SphericalBosonStarV2SkeletonByteBindingV2(
    skeletonCanonicalJson,
  );
  return {
    artifactId:
      NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_PERSISTENCE_RECEIPT_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_PERSISTENCE_RECEIPT_CONTRACT_VERSION,
    phase: "external_durable_readback_receipt_integrity_only",
    authorityFalse: true,
    candidateId: NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2.candidateId,
    persistenceKind: "external_durable_publication_readback",
    observationAuthentication: "not_established_by_plain_canonical_json",
    authenticatedObservationContext: null,
    skeletonBinding: {
      ...structuredClone(binding),
      path,
    } as unknown as Json,
    persistedAt: "2026-08-14T12:00:00.000000002Z",
    authorityLocks: structuredClone(
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_AUTHORITY_LOCKS,
    ) as unknown as Json,
    claimLocks: structuredClone(
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_CLAIM_LOCKS,
    ) as unknown as Json,
  };
};

const sealReceipt = (unsigned: Record<string, Json>): string => {
  const unsignedCanonicalJson = canonical(unsigned);
  return canonical({
    ...structuredClone(unsigned),
    receiptSha256:
      computeNhm2SphericalBosonStarV2SkeletonPersistenceReceiptSha256(
        unsignedCanonicalJson,
      ),
  });
};

const resealReceiptRecord = (receipt: Record<string, Json>): string => {
  const unsigned = structuredClone(receipt);
  delete unsigned.receiptSha256;
  return sealReceipt(unsigned);
};

describe("NHM2 spherical boson-star v2 run-artifact wire v2", () => {
  it("has the exact literal self-seal and canonical size", () => {
    expect(
      nhm2SphericalBosonStarV2RunArtifactWireV2CanonicalJson(
        NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_CANONICAL_JSON,
      ),
    ).toBe(NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_CANONICAL_JSON);
    const bytes = Buffer.from(
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_CANONICAL_JSON,
      "utf8",
    );
    expect(
      createHash("sha256")
        .update(
          NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_SHA256_DOMAIN,
          "utf8",
        )
        .update(u64le(bytes.length))
        .update(bytes)
        .digest("hex"),
    ).toBe(NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_SHA256);
    expect(bytes.length).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_CANONICAL_SIZE_BYTES,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_EXPECTED_SHA256,
    ).toBe("d681751c9f0cec9e10336f98bb4c6a2657411bc74d612313660692363202971d");
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_EXPECTED_CANONICAL_SIZE_BYTES,
    ).toBe(11_117);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_EXPECTED_SHA256,
    ).toBe(NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_SHA256);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_EXPECTED_CANONICAL_SIZE_BYTES,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_CANONICAL_SIZE_BYTES,
    );
  });

  it("pins repaired preexec-v2 and every frozen candidate/science definition", () => {
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING,
    ).toMatchObject({
      sha256:
        "dce4c293d09224e4b7d79bd8b04b46542875f0306eecee84c35bb4c10bf68cb8",
      canonicalSizeBytes: 11_663,
    });
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_DEFINITION_BINDINGS,
    ).toMatchObject({
      rawReplaySchema: {
        sha256:
          "96f5816f9d04b9d3b14a228ab821c3224974f47839ace6d7c7819f77c6a223ff",
        canonicalSizeBytes: 163_818,
      },
      siOutputNormalization: {
        sha256:
          "16224114ce7bc790d1e5ceeaf8f75e31e5c37412856c5bea8b99284301bf3c24",
        canonicalSizeBytes: 23_822,
      },
      metricDemandProgram: {
        sha256:
          "c64cd963ec7a8ad2485de2e4ff16e307da61a6fd1e108439ae56eade76b00fee",
        canonicalSizeBytes: 48_595,
      },
      smearingWeightFreeze: {
        sha256:
          "4cff97a0c1220dbef8c0df29e500d4c80d88320c97f8d16529c9e98ac290a446",
        canonicalSizeBytes: 6_764,
      },
      staticGroundStateHadamardMeanNoiseRealization: {
        sha256:
          "bf9875496a7aa8f5bde0509e597b373454ddea072f1d1af2ae18b746f7646467",
        canonicalSizeBytes: 25_213,
      },
      operatorOrderingDerivationClosure: {
        sha256:
          "70aee3e44231eaa537964595acd6378394c4f7a8fabeb5d79307b7966d6ac3eb",
        canonicalSizeBytes: 16_310,
      },
      branchSolverPolicy: {
        sha256:
          "b7d2cb2d7dcf39531000bbfcdfadb44f5e9c38d3ab1950982515245336a77cb0",
        canonicalSizeBytes: 18_993,
      },
      pairAgreement: {
        sha256:
          "9385daf2e311f28bd5a563ceb0f22e0a647cee568e8ae4baeeabe5bcd5b4d1f4",
        canonicalSizeBytes: 45_302,
      },
    });
  });

  it("derives one exact hashless S containing all ten A fields and their byte digest", () => {
    const a = makeA();
    const aJson = canonical(a);
    const skeletonJson = makeSkeleton(a);
    const skeleton = JSON.parse(skeletonJson) as Record<string, any>;
    expect(Object.keys(skeleton).sort()).toEqual(
      [...NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_EXACT_KEYS].sort(),
    );
    expect(Object.keys(skeleton.prePresealStaticClosure).sort()).toEqual(
      [
        ...NHM2_SPHERICAL_BOSON_STAR_V2_PRE_PRESEAL_STATIC_CLOSURE_EXACT_KEYS,
      ].sort(),
    );
    expect(skeleton.prePresealStaticClosure).toEqual(a);
    expect(skeleton.prePresealStaticClosureSha256).toBe(
      computeNhm2SphericalBosonStarV2PrePresealStaticClosureSha256(aJson),
    );
    expect(skeleton.preexecutionProfileBinding).toEqual(
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING,
    );
    expect(
      nhm2SphericalBosonStarV2PreexecutionOutputSkeletonV2Violations(
        skeletonJson,
      ),
    ).toEqual([]);
  });

  it("keeps the 68-file/21-alias plan hashless and excludes all later phases", () => {
    const skeleton = JSON.parse(makeSkeleton()) as Record<string, any>;
    expect(skeleton.outputInventoryPlan).toEqual(
      NHM2_SPHERICAL_BOSON_STAR_V2_HASHLESS_OUTPUT_INVENTORY_PLAN,
    );
    expect(skeleton.outputInventoryPlan.plannedPhysicalFiles).toHaveLength(68);
    expect(
      skeleton.outputInventoryPlan.centralLevel2LogicalAliases,
    ).toHaveLength(21);
    expect(skeleton.outputInventoryPlan.exactPayloadSizeBytes).toBe(6_693_376);
    for (const descriptor of skeleton.outputInventoryPlan
      .plannedPhysicalFiles) {
      expect(descriptor).not.toHaveProperty("sha256");
      expect(descriptor).not.toHaveProperty("freshness");
      expect(descriptor).not.toHaveProperty("observedAt");
    }
    for (const alias of skeleton.outputInventoryPlan
      .centralLevel2LogicalAliases) {
      expect(alias).not.toHaveProperty("canonicalSha256");
    }
    for (const forbidden of [
      "scientificPresealBinding",
      "scientificPersistenceReceiptBinding",
      "executionPreseal",
      "executionReceipt",
      "launchEnvelope",
      "postrunManifest",
      "physicalFiles",
    ]) {
      expect(skeleton).not.toHaveProperty(forbidden);
    }
  });

  it("recomputes distinct S raw, v2-wire, and size bindings from exact canonical bytes", () => {
    const skeletonJson = makeSkeleton();
    const binding =
      computeNhm2SphericalBosonStarV2SkeletonByteBindingV2(skeletonJson);
    const bytes = Buffer.from(skeletonJson, "utf8");
    expect(binding).toMatchObject({
      artifactId:
        NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_OUTPUT_SKELETON_V2_ARTIFACT_ID,
      contractVersion:
        NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_OUTPUT_SKELETON_V2_CONTRACT_VERSION,
      rawSha256: sha256(skeletonJson),
      sizeBytes: bytes.length,
    });
    expect(binding.wireSha256).toBe(
      createHash("sha256")
        .update(
          NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_WIRE_V2_SHA256_DOMAIN,
          "utf8",
        )
        .update(u64le(bytes.length))
        .update(bytes)
        .digest("hex"),
    );
    expect(binding.wireSha256).not.toBe(binding.rawSha256);
    expect(Object.isFrozen(binding)).toBe(true);
  });

  it("makes every canonical A mutation change the A digest and S byte binding", () => {
    const baseA = makeA();
    const baseSkeletonJson = makeSkeleton(baseA);
    const changedA = structuredClone(baseA);
    changedA.commandArgvSha256 = hash("different-argv");
    const changedSkeletonJson = makeSkeleton(changedA);
    const base =
      computeNhm2SphericalBosonStarV2SkeletonByteBindingV2(baseSkeletonJson);
    const changed =
      computeNhm2SphericalBosonStarV2SkeletonByteBindingV2(changedSkeletonJson);
    expect(changed.prePresealStaticClosureSha256).not.toBe(
      base.prePresealStaticClosureSha256,
    );
    expect(changed.rawSha256).not.toBe(base.rawSha256);
    expect(changed.wireSha256).not.toBe(base.wireSha256);

    const spliced = JSON.parse(baseSkeletonJson) as Record<string, any>;
    spliced.prePresealStaticClosure.commandArgvSha256 = hash("spliced-argv");
    expect(
      nhm2SphericalBosonStarV2PreexecutionOutputSkeletonV2Violations(
        canonical(spliced as Json),
      ),
    ).toContain("spherical_v2_skeleton_v2_A_digest_or_profile_binding_invalid");
  });

  it("accepts an integrity-bound external SR and derives only a diagnostic persisted-S binding", () => {
    const skeletonJson = makeSkeleton();
    const receiptJson = sealReceipt(makeUnsignedReceipt(skeletonJson));
    expect(
      nhm2SphericalBosonStarV2SkeletonPersistenceReceiptViolations(receiptJson),
    ).toEqual([]);
    expect(
      nhm2SphericalBosonStarV2SkeletonPersistencePairViolations(
        skeletonJson,
        receiptJson,
      ),
    ).toEqual([]);
    const receipt = JSON.parse(receiptJson) as Record<string, any>;
    expect(Object.keys(receipt).sort()).toEqual(
      [
        ...NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_PERSISTENCE_RECEIPT_EXACT_KEYS,
      ].sort(),
    );
    const persisted =
      deriveNhm2SphericalBosonStarV2DiagnosticPersistedSkeletonBindingV2(
        skeletonJson,
        receiptJson,
      );
    expect(persisted).toMatchObject({
      ...computeNhm2SphericalBosonStarV2SkeletonByteBindingV2(skeletonJson),
      path: "/srv/nhm2/preexecution/output-skeleton.v2.json",
      persistedAt: "2026-08-14T12:00:00.000000002Z",
      persistenceReceiptSha256: receipt.receiptSha256,
    });
    expect(Object.isFrozen(persisted)).toBe(true);
    const receiptBytes =
      computeNhm2SphericalBosonStarV2SkeletonPersistenceReceiptByteBinding(
        receiptJson,
      );
    expect(receiptBytes).toMatchObject({
      rawSha256: sha256(receiptJson),
      receiptSha256: receipt.receiptSha256,
      sizeBytes: Buffer.byteLength(receiptJson, "utf8"),
    });
  });

  it("locks the exact slash-separated printable-ASCII path grammar", () => {
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2
        .externalPersistenceReceiptSchema.pathGrammar,
    ).toEqual({
      rootPrefix: "/",
      separator: "/",
      minimumSegmentCount: 1,
      emptySegmentsAllowed: false,
      dotSegmentsAllowed: false,
      segmentCodeUnits: "inclusive_printable_ASCII_0x20_through_0x7e",
      slashInsideSegmentAllowed: false,
      spacePlusAtBackslashAndColonAreOrdinarySegmentData: true,
      trailingSeparatorAllowed: false,
    });
  });

  it.each([
    ["ordinary", "/srv/nhm2/preexecution/output-skeleton.v2.json"],
    ["spaces plus and at", "/srv/nhm2/run space/+@/output file.json"],
    ["backslash and colon data", "/srv/nhm2/back\\slash/colon:ok.json"],
    ["backslash is not a separator", "/srv\\..\\snapshot:01.json"],
    ["dot-prefixed lookalikes", "/.hidden/.../file"],
  ])("accepts exact printable safe path: %s", (_label, path) => {
    const skeletonJson = makeSkeleton();
    const receiptJson = sealReceipt(makeUnsignedReceipt(skeletonJson, path));
    expect(
      nhm2SphericalBosonStarV2SkeletonPersistenceReceiptViolations(receiptJson),
    ).toEqual([]);
    expect(
      nhm2SphericalBosonStarV2SkeletonPersistencePairViolations(
        skeletonJson,
        receiptJson,
      ),
    ).toEqual([]);
    expect(
      deriveNhm2SphericalBosonStarV2DiagnosticPersistedSkeletonBindingV2(
        skeletonJson,
        receiptJson,
      ).path,
    ).toBe(path);
  });

  it.each([
    ["root only", "/", "skeleton_binding_invalid"],
    ["root empty segment", "//srv/file", "skeleton_binding_invalid"],
    ["nested empty segment", "/srv//file", "skeleton_binding_invalid"],
    ["trailing empty segment", "/srv/file/", "skeleton_binding_invalid"],
    ["root current segment", "/./file", "skeleton_binding_invalid"],
    ["root parent segment", "/../file", "skeleton_binding_invalid"],
    ["nested current segment", "/srv/./file", "skeleton_binding_invalid"],
    ["nested parent segment", "/srv/../file", "skeleton_binding_invalid"],
    ["NUL", "/srv/\0/file", ":string:"],
    ["unit separator", "/srv/\u001f/file", "skeleton_binding_invalid"],
    ["newline", "/srv/\n/file", "skeleton_binding_invalid"],
    ["tab", "/srv/\t/file", "skeleton_binding_invalid"],
    ["DEL", "/srv/\u007f/file", "skeleton_binding_invalid"],
    ["non-ASCII", "/srv/café/file", "skeleton_binding_invalid"],
    ["relative", "srv/file", "skeleton_binding_invalid"],
  ])("rejects hostile path: %s", (_label, path, code) => {
    const skeletonJson = makeSkeleton();
    expect(() => sealReceipt(makeUnsignedReceipt(skeletonJson, path))).toThrow(
      code,
    );
  });

  it.each([
    ["rawSha256", hash("wrong-S-raw")],
    ["wireSha256", hash("wrong-S-wire")],
    ["sizeBytes", 17],
    ["prePresealStaticClosureSha256", hash("wrong-A")],
    ["skeletonFrozenAt", "2026-08-14T11:59:59.000000001Z"],
  ])("rejects a self-consistent SR with drifted S %s", (field, value) => {
    const skeletonJson = makeSkeleton();
    const receipt = JSON.parse(
      sealReceipt(makeUnsignedReceipt(skeletonJson)),
    ) as Record<string, any>;
    receipt.skeletonBinding[field] = value;
    const resealed = resealReceiptRecord(receipt as Record<string, Json>);
    expect(
      nhm2SphericalBosonStarV2SkeletonPersistencePairViolations(
        skeletonJson,
        resealed,
      ),
    ).toContain("spherical_v2_skeleton_receipt_pair_byte_binding_invalid");
  });

  it("rejects SR self-hash tampering, non-strict chronology, and authority retuning", () => {
    const skeletonJson = makeSkeleton();
    const receipt = JSON.parse(
      sealReceipt(makeUnsignedReceipt(skeletonJson)),
    ) as Record<string, any>;
    receipt.receiptSha256 = hash("tampered-receipt");
    expect(
      nhm2SphericalBosonStarV2SkeletonPersistenceReceiptViolations(
        canonical(receipt as Json),
      ),
    ).toContain("spherical_v2_skeleton_receipt_sha256_mismatch");

    const chronology = makeUnsignedReceipt(skeletonJson);
    chronology.persistedAt = "2026-08-14T12:00:00.000000001Z";
    expect(() => sealReceipt(chronology)).toThrow(
      "spherical_v2_skeleton_receipt_skeleton_binding_invalid",
    );

    const authority = makeUnsignedReceipt(skeletonJson);
    (authority.authorityLocks as Record<string, Json>).durabilityAuthority =
      true;
    expect(() => sealReceipt(authority)).toThrow(
      "spherical_v2_skeleton_receipt_false_lock_boundary_invalid",
    );
  });

  it("keeps every readiness/authority/claim/lamp false and every instance null", () => {
    expect(
      Object.values(NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_READINESS),
    ).toSatisfy((values: unknown[]) =>
      values.every((value) => value === false),
    );
    expect(
      Object.values(NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_INSTANCES),
    ).toSatisfy((values: unknown[]) => values.every((value) => value === null));
    for (const locks of [
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_AUTHORITY_LOCKS,
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_CLAIM_LOCKS,
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_LAMPS,
    ]) {
      expect(Object.values(locks).every((value) => value === false)).toBe(true);
    }
    expect(NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_BLOCKERS).toContain(
      "server_authenticated_skeleton_durability_observer_not_implemented",
    );
  });

  it("requires canonical strings without enumerating hostile object surfaces", () => {
    let traps = 0;
    const hostile = new Proxy(
      {},
      {
        ownKeys: () => {
          traps += 1;
          throw new Error("must not enumerate");
        },
        get: () => {
          traps += 1;
          throw new Error("must not read");
        },
      },
    );
    const accessor = Object.defineProperty({}, "x", {
      enumerable: true,
      get: () => {
        traps += 1;
        throw new Error("must not invoke");
      },
    });
    expect(
      nhm2SphericalBosonStarV2PreexecutionOutputSkeletonV2Violations(hostile),
    ).toContain("spherical_v2_skeleton_v2:canonical_json_text_required");
    expect(
      nhm2SphericalBosonStarV2SkeletonPersistenceReceiptViolations(accessor),
    ).toContain("spherical_v2_skeleton_receipt:canonical_json_text_required");
    expect(
      nhm2SphericalBosonStarV2SkeletonPersistencePairViolations(
        hostile,
        accessor,
      ),
    ).toContain("spherical_v2_skeleton_v2:canonical_json_text_required");
    expect(traps).toBe(0);
  });

  it("checks UTF-16 and UTF-8 caps before JSON.parse, including a million-key wire", () => {
    const originalParse = JSON.parse;
    const parseSpy = vi.spyOn(JSON, "parse");
    try {
      const millionKeyWire = `{${'"k":0,'.repeat(1_000_000)}"z":0}`;
      expect(
        nhm2SphericalBosonStarV2PreexecutionOutputSkeletonV2Violations(
          millionKeyWire,
        ),
      ).toContain("spherical_v2_skeleton_v2:canonical_code_units_exceeded");
      expect(parseSpy).not.toHaveBeenCalled();

      const utf8Oversized = `"${"é".repeat(1_100_000)}"`;
      expect(utf8Oversized.length).toBeLessThan(
        NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_LIMITS.maximumCanonicalCodeUnits,
      );
      expect(
        nhm2SphericalBosonStarV2PreexecutionOutputSkeletonV2Violations(
          utf8Oversized,
        ),
      ).toContain("spherical_v2_skeleton_v2:canonical_bytes_exceeded");
      expect(parseSpy).not.toHaveBeenCalled();
    } finally {
      parseSpy.mockRestore();
      expect(JSON.parse).toBe(originalParse);
    }
  });

  it.each([
    [
      "deep",
      (() => {
        let wire = "0";
        for (let index = 0; index < 34; index += 1) wire = `[${wire}]`;
        return wire;
      })(),
      ":depth:",
    ],
    [
      "wide",
      canonical(
        Object.fromEntries(
          Array.from({ length: 257 }, (_, index) => [`k${index}`, index]),
        ) as Json,
      ),
      ":object:",
    ],
    ["long string", canonical("x".repeat(65_537)), ":string_utf8:"],
    ["forbidden key", '{"__proto__":1}', ":key:"],
    ["isolated surrogate", '{"x":"\\ud800"}', ":string:"],
    ["NUL", '{"x":"\\u0000"}', ":string:"],
    ["negative zero", '{"x":-0}', ":number:"],
    ["unsafe integer", '{"x":9007199254740992}', ":number:"],
  ])(
    "totally rejects bounded canonical resource hazard: %s",
    (_label, wire, code) => {
      const violations =
        nhm2SphericalBosonStarV2PreexecutionOutputSkeletonV2Violations(wire);
      expect(violations.some((entry) => entry.includes(code))).toBe(true);
      expect(Object.isFrozen(violations)).toBe(true);
    },
  );

  it("rejects noncanonical A and S encodings and scientific-definition drift", () => {
    expect(() =>
      deriveNhm2SphericalBosonStarV2PreexecutionOutputSkeletonV2CanonicalJson(
        JSON.stringify(makeA(), null, 2),
        canonical({ skeletonFrozenAt: "2026-08-14T12:00:00.000000001Z" }),
      ),
    ).toThrow("spherical_v2_skeleton_v2_A:canonical_encoding_invalid");

    const skeletonJson = makeSkeleton();
    expect(
      nhm2SphericalBosonStarV2PreexecutionOutputSkeletonV2Violations(
        `${skeletonJson}\n`,
      ),
    ).toContain("spherical_v2_skeleton_v2:canonical_encoding_invalid");

    const drift = JSON.parse(skeletonJson) as Record<string, any>;
    drift.scientificDefinitionBindings.metricDemandProgram.sha256 = hash(
      "retuned-metric-program",
    );
    expect(
      nhm2SphericalBosonStarV2PreexecutionOutputSkeletonV2Violations(
        canonical(drift as Json),
      ),
    ).toContain("spherical_v2_skeleton_v2_fixed_binding_or_plan_drift");
  });
});
