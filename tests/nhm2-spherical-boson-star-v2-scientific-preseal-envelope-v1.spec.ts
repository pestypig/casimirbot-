import { createHash } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

import { NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING } from "../shared/contracts/nhm2-spherical-boson-star-v2-candidate-freeze.v1";
import {
  computeNhm2SphericalBosonStarV2OutputRootPlanSha256,
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-preexecution-profile.v2";
import {
  computeNhm2SphericalBosonStarV2SkeletonByteBindingV2,
  computeNhm2SphericalBosonStarV2SkeletonPersistenceReceiptByteBinding,
  computeNhm2SphericalBosonStarV2SkeletonPersistenceReceiptSha256,
  deriveNhm2SphericalBosonStarV2DiagnosticPersistedSkeletonBindingV2,
  deriveNhm2SphericalBosonStarV2PreexecutionOutputSkeletonV2CanonicalJson,
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2,
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_AUTHORITY_LOCKS,
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_CLAIM_LOCKS,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_DEFINITION_BINDINGS,
  NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_PERSISTENCE_RECEIPT_ARTIFACT_ID,
  NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_PERSISTENCE_RECEIPT_CONTRACT_VERSION,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-run-artifact-wire.v2";
import * as scientificPresealModule from "../shared/contracts/nhm2-spherical-boson-star-v2-scientific-preseal-envelope.v1";
import {
  computeNhm2SphericalBosonStarV2ScientificPresealEnvelopeSha256,
  deriveNhm2SphericalBosonStarV2ScientificPresealEnvelopeV1CanonicalJson,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_AUTHORITY_LOCKS,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_BLOCKERS,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CLAIM_LOCKS,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_CANONICAL_JSON,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_EXPECTED_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_EXACT_KEYS,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_INSTANCES,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_LAMPS,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_LIMITS,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_READINESS,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_SHA256_DOMAIN,
  nhm2SphericalBosonStarV2ScientificPresealEnvelopeV1Violations,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-scientific-preseal-envelope.v1";

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

const lengthDelimitedSha256 = (
  domain: string,
  canonicalJson: string,
): string => {
  const bytes = Buffer.from(canonicalJson, "utf8");
  return createHash("sha256")
    .update(domain, "utf8")
    .update(u64le(bytes.length))
    .update(bytes)
    .digest("hex");
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

const makeSkeleton = (): string =>
  deriveNhm2SphericalBosonStarV2PreexecutionOutputSkeletonV2CanonicalJson(
    canonical(makeA()),
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

const makeReceipt = (skeletonCanonicalJson: string): string =>
  sealReceipt(makeUnsignedReceipt(skeletonCanonicalJson));

const resealReceiptRecord = (receipt: Record<string, Json>): string => {
  const unsigned = structuredClone(receipt);
  delete unsigned.receiptSha256;
  return sealReceipt(unsigned);
};

const makeEnvelope = (
  createdAt = "2026-08-14T12:00:00.000000003Z",
): Readonly<{
  skeletonJson: string;
  receiptJson: string;
  envelopeJson: string;
}> => {
  const skeletonJson = makeSkeleton();
  const receiptJson = makeReceipt(skeletonJson);
  return {
    skeletonJson,
    receiptJson,
    envelopeJson:
      deriveNhm2SphericalBosonStarV2ScientificPresealEnvelopeV1CanonicalJson(
        skeletonJson,
        receiptJson,
        canonical({ createdAt }),
      ),
  };
};

const resealEnvelopeUnchecked = (envelope: Record<string, Json>): string => {
  const unsigned = structuredClone(envelope);
  delete unsigned.presealEnvelopeSha256;
  const unsignedCanonicalJson = canonical(unsigned);
  return canonical({
    ...unsigned,
    presealEnvelopeSha256: lengthDelimitedSha256(
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_SHA256_DOMAIN,
      unsignedCanonicalJson,
    ),
  });
};

describe("NHM2 spherical boson-star v2 scientific-preseal envelope v1", () => {
  it("has the exact literal contract self-seal and canonical size", () => {
    const canonicalAgain = canonical(
      JSON.parse(
        NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_CANONICAL_JSON,
      ) as Json,
    );
    expect(canonicalAgain).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_CANONICAL_JSON,
    );
    const bytes = Buffer.from(canonicalAgain, "utf8");
    expect(
      createHash("sha256")
        .update(
          NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_SHA256_DOMAIN,
          "utf8",
        )
        .update(u64le(bytes.length))
        .update(bytes)
        .digest("hex"),
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_SHA256,
    );
    expect(bytes.length).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_CANONICAL_SIZE_BYTES,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_EXPECTED_SHA256,
    ).toBe("b832aefb663b08cc9982d7ffb6ee0d21eea4a3453aa4aec6c22ab3cd6d2ccbca");
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_EXPECTED_CANONICAL_SIZE_BYTES,
    ).toBe(10_551);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_EXPECTED_SHA256,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_SHA256,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_EXPECTED_CANONICAL_SIZE_BYTES,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_CANONICAL_SIZE_BYTES,
    );
  });

  it("pins the independently cleared repaired A profile and S/SR wire definition", () => {
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING,
    ).toMatchObject({
      sha256:
        "dce4c293d09224e4b7d79bd8b04b46542875f0306eecee84c35bb4c10bf68cb8",
      canonicalSizeBytes: 11_663,
    });
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_BINDING,
    ).toMatchObject({
      sha256:
        "d681751c9f0cec9e10336f98bb4c6a2657411bc74d612313660692363202971d",
      canonicalSizeBytes: 11_117,
    });
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT.exactBindings,
    ).toEqual({
      preexecutionProfile:
        NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING,
      runArtifactWireV2:
        NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_BINDING,
      candidateFreeze: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
      scientificDefinitions:
        NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_DEFINITION_BINDINGS,
    });
  });

  it("derives exact canonical P only after recomputing the S/SR pair and byte bindings", () => {
    const { skeletonJson, receiptJson, envelopeJson } = makeEnvelope();
    const envelope = JSON.parse(envelopeJson) as Record<string, any>;
    const skeletonBytes =
      computeNhm2SphericalBosonStarV2SkeletonByteBindingV2(skeletonJson);
    const persisted =
      deriveNhm2SphericalBosonStarV2DiagnosticPersistedSkeletonBindingV2(
        skeletonJson,
        receiptJson,
      );
    const receiptBytes =
      computeNhm2SphericalBosonStarV2SkeletonPersistenceReceiptByteBinding(
        receiptJson,
      );

    expect(Object.keys(envelope)).toEqual(
      [
        ...NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_EXACT_KEYS,
      ].sort(),
    );
    expect(envelope.preexecutionSkeletonBinding).toEqual(persisted);
    expect(envelope.preexecutionSkeletonBinding).toMatchObject({
      rawSha256: skeletonBytes.rawSha256,
      wireSha256: skeletonBytes.wireSha256,
      sizeBytes: Buffer.byteLength(skeletonJson, "utf8"),
      prePresealStaticClosureSha256:
        skeletonBytes.prePresealStaticClosureSha256,
    });
    expect(envelope.skeletonPersistenceReceiptBinding).toEqual(receiptBytes);
    expect(envelope.skeletonPersistenceReceiptBinding).toMatchObject({
      rawSha256: sha256(receiptJson),
      receiptSha256: (JSON.parse(receiptJson) as Record<string, string>)
        .receiptSha256,
      sizeBytes: Buffer.byteLength(receiptJson, "utf8"),
    });
    expect(envelope.prePresealStaticClosureSha256).toBe(
      skeletonBytes.prePresealStaticClosureSha256,
    );
    expect(envelope.candidateBinding).toEqual(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
    );
    expect(envelope.scientificDefinitionBindings).toEqual(
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_DEFINITION_BINDINGS,
    );
    expect(envelope.preexecutionProfileBinding).toEqual(
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING,
    );
    expect(envelope.runArtifactWireV2Binding).toEqual(
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_BINDING,
    );
    expect(
      nhm2SphericalBosonStarV2ScientificPresealEnvelopeV1Violations(
        envelopeJson,
      ),
    ).toEqual([]);
  });

  it("uses the dedicated length-delimited P self-hash over exact unsigned bytes", () => {
    const { envelopeJson } = makeEnvelope();
    const envelope = JSON.parse(envelopeJson) as Record<string, Json>;
    const actual = envelope.presealEnvelopeSha256;
    delete envelope.presealEnvelopeSha256;
    const unsignedCanonicalJson = canonical(envelope);
    expect(actual).toBe(
      lengthDelimitedSha256(
        NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_SHA256_DOMAIN,
        unsignedCanonicalJson,
      ),
    );
    expect(actual).toBe(
      computeNhm2SphericalBosonStarV2ScientificPresealEnvelopeSha256(
        unsignedCanonicalJson,
      ),
    );
  });

  it("requires createdAt to be strictly later than SR persistedAt at nanosecond precision", () => {
    const skeletonJson = makeSkeleton();
    const receiptJson = makeReceipt(skeletonJson);
    expect(() =>
      deriveNhm2SphericalBosonStarV2ScientificPresealEnvelopeV1CanonicalJson(
        skeletonJson,
        receiptJson,
        canonical({ createdAt: "2026-08-14T12:00:00.000000002Z" }),
      ),
    ).toThrow("spherical_v2_scientific_preseal_evidence_chronology_invalid");
    expect(() =>
      deriveNhm2SphericalBosonStarV2ScientificPresealEnvelopeV1CanonicalJson(
        skeletonJson,
        receiptJson,
        canonical({ createdAt: "2026-08-14T12:00:00.000000001Z" }),
      ),
    ).toThrow("spherical_v2_scientific_preseal_evidence_chronology_invalid");
    expect(() =>
      deriveNhm2SphericalBosonStarV2ScientificPresealEnvelopeV1CanonicalJson(
        skeletonJson,
        receiptJson,
        canonical({ createdAt: "2026-02-30T12:00:00.000000003Z" }),
      ),
    ).toThrow("spherical_v2_scientific_preseal_evidence_chronology_invalid");
    expect(
      deriveNhm2SphericalBosonStarV2ScientificPresealEnvelopeV1CanonicalJson(
        skeletonJson,
        receiptJson,
        canonical({ createdAt: "2026-08-14T12:00:00.000000003Z" }),
      ),
    ).toContain('"createdAt":"2026-08-14T12:00:00.000000003Z"');
  });

  it("accepts the cleared printable safe path subset", () => {
    const skeletonJson = makeSkeleton();
    const validPath = "/srv/nhm2/valid path/+@/back\\slash:output.json";
    const receiptJson = sealReceipt(
      makeUnsignedReceipt(skeletonJson, validPath),
    );
    const envelopeJson =
      deriveNhm2SphericalBosonStarV2ScientificPresealEnvelopeV1CanonicalJson(
        skeletonJson,
        receiptJson,
        canonical({ createdAt: "2026-08-14T12:00:00.000000003Z" }),
      );
    expect(
      (JSON.parse(envelopeJson) as Record<string, any>)
        .preexecutionSkeletonBinding.path,
    ).toBe(validPath);
    expect(
      nhm2SphericalBosonStarV2ScientificPresealEnvelopeV1Violations(
        envelopeJson,
      ),
    ).toEqual([]);
  });

  it.each([
    "/../retuned.json",
    "/./retuned.json",
    "/srv/../retuned.json",
    "/srv/./retuned.json",
  ])(
    "requires repaired S/SR to reject dot-segment source path %s before P derivation",
    (path) => {
      const skeletonJson = makeSkeleton();
      expect(() =>
        sealReceipt(makeUnsignedReceipt(skeletonJson, path)),
      ).toThrow("spherical_v2_skeleton_receipt_skeleton_binding_invalid");
    },
  );

  it("rejects S bytes, SR self-hash, and self-consistently resealed S/SR cross-binding tampering", () => {
    const skeletonJson = makeSkeleton();
    const receiptJson = makeReceipt(skeletonJson);

    const changedSkeleton = JSON.parse(skeletonJson) as Record<string, Json>;
    changedSkeleton.skeletonFrozenAt = "2026-08-14T12:00:00.000000000Z";
    expect(() =>
      deriveNhm2SphericalBosonStarV2ScientificPresealEnvelopeV1CanonicalJson(
        canonical(changedSkeleton),
        receiptJson,
        canonical({ createdAt: "2026-08-14T12:00:00.000000003Z" }),
      ),
    ).toThrow("spherical_v2_skeleton_receipt_pair_byte_binding_invalid");

    const brokenReceipt = JSON.parse(receiptJson) as Record<string, Json>;
    brokenReceipt.receiptSha256 = hash("tampered-SR-self-hash");
    expect(() =>
      deriveNhm2SphericalBosonStarV2ScientificPresealEnvelopeV1CanonicalJson(
        skeletonJson,
        canonical(brokenReceipt),
        canonical({ createdAt: "2026-08-14T12:00:00.000000003Z" }),
      ),
    ).toThrow("spherical_v2_skeleton_receipt_sha256_mismatch");

    const driftedReceipt = JSON.parse(receiptJson) as Record<string, any>;
    driftedReceipt.skeletonBinding.rawSha256 = hash("retuned-S-raw");
    const resealedReceipt = resealReceiptRecord(
      driftedReceipt as Record<string, Json>,
    );
    expect(() =>
      deriveNhm2SphericalBosonStarV2ScientificPresealEnvelopeV1CanonicalJson(
        skeletonJson,
        resealedReceipt,
        canonical({ createdAt: "2026-08-14T12:00:00.000000003Z" }),
      ),
    ).toThrow("spherical_v2_skeleton_receipt_pair_byte_binding_invalid");
  });

  it.each([
    [
      "absolute path traversal",
      (root: Record<string, any>) => {
        root.preexecutionSkeletonBinding.path = "/srv/../retuned.json";
      },
      "spherical_v2_scientific_preseal_skeleton_binding_invalid",
    ],
    [
      "root path traversal",
      (root: Record<string, any>) => {
        root.preexecutionSkeletonBinding.path = "/../retuned.json";
      },
      "spherical_v2_scientific_preseal_skeleton_binding_invalid",
    ],
    [
      "root current-directory segment",
      (root: Record<string, any>) => {
        root.preexecutionSkeletonBinding.path = "/./retuned.json";
      },
      "spherical_v2_scientific_preseal_skeleton_binding_invalid",
    ],
    [
      "nested current-directory segment",
      (root: Record<string, any>) => {
        root.preexecutionSkeletonBinding.path = "/srv/./retuned.json";
      },
      "spherical_v2_scientific_preseal_skeleton_binding_invalid",
    ],
    [
      "root-only path",
      (root: Record<string, any>) => {
        root.preexecutionSkeletonBinding.path = "/";
      },
      "spherical_v2_scientific_preseal_skeleton_binding_invalid",
    ],
    [
      "leading empty segment",
      (root: Record<string, any>) => {
        root.preexecutionSkeletonBinding.path = "//srv/retuned.json";
      },
      "spherical_v2_scientific_preseal_skeleton_binding_invalid",
    ],
    [
      "nested empty segment",
      (root: Record<string, any>) => {
        root.preexecutionSkeletonBinding.path = "/srv//retuned.json";
      },
      "spherical_v2_scientific_preseal_skeleton_binding_invalid",
    ],
    [
      "trailing empty segment",
      (root: Record<string, any>) => {
        root.preexecutionSkeletonBinding.path = "/srv/retuned.json/";
      },
      "spherical_v2_scientific_preseal_skeleton_binding_invalid",
    ],
    [
      "control code unit",
      (root: Record<string, any>) => {
        root.preexecutionSkeletonBinding.path = "/srv/\nretuned.json";
      },
      "spherical_v2_scientific_preseal_skeleton_binding_invalid",
    ],
    [
      "DEL code unit",
      (root: Record<string, any>) => {
        root.preexecutionSkeletonBinding.path = "/srv/\u007fretuned.json";
      },
      "spherical_v2_scientific_preseal_skeleton_binding_invalid",
    ],
    [
      "non-ASCII code unit",
      (root: Record<string, any>) => {
        root.preexecutionSkeletonBinding.path = "/srv/café.json";
      },
      "spherical_v2_scientific_preseal_skeleton_binding_invalid",
    ],
    [
      "collapsed raw/wire domains",
      (root: Record<string, any>) => {
        root.preexecutionSkeletonBinding.wireSha256 =
          root.preexecutionSkeletonBinding.rawSha256;
      },
      "spherical_v2_scientific_preseal_skeleton_binding_invalid",
    ],
    [
      "candidate drift",
      (root: Record<string, any>) => {
        root.candidateBinding.sha256 = hash("retuned-candidate");
      },
      "spherical_v2_scientific_preseal_fixed_binding_drift",
    ],
    [
      "science drift",
      (root: Record<string, any>) => {
        root.scientificDefinitionBindings.metricDemandProgram.sha256 =
          hash("retuned-science");
      },
      "spherical_v2_scientific_preseal_fixed_binding_drift",
    ],
    [
      "A digest drift",
      (root: Record<string, any>) => {
        root.prePresealStaticClosureSha256 = hash("retuned-A-digest");
      },
      "spherical_v2_scientific_preseal_skeleton_binding_invalid",
    ],
    [
      "receipt self-hash drift",
      (root: Record<string, any>) => {
        root.skeletonPersistenceReceiptBinding.receiptSha256 = hash(
          "retuned-SR-self-hash",
        );
      },
      "spherical_v2_scientific_preseal_receipt_binding_invalid",
    ],
    [
      "authority retuning",
      (root: Record<string, any>) => {
        root.authorityLocks.executionAuthority = true;
      },
      "spherical_v2_scientific_preseal_false_null_boundary_invalid",
    ],
    [
      "runtime instance injection",
      (root: Record<string, any>) => {
        root.instances.runtimeLoaderObservation = {};
      },
      "spherical_v2_scientific_preseal_false_null_boundary_invalid",
    ],
  ])(
    "rejects a cryptographically resealed semantic tamper: %s",
    (_label, mutate, code) => {
      const envelope = JSON.parse(makeEnvelope().envelopeJson) as Record<
        string,
        any
      >;
      mutate(envelope);
      expect(
        nhm2SphericalBosonStarV2ScientificPresealEnvelopeV1Violations(
          resealEnvelopeUnchecked(envelope as Record<string, Json>),
        ),
      ).toContain(code);
    },
  );

  it("rejects P self-hash tampering", () => {
    const envelope = JSON.parse(makeEnvelope().envelopeJson) as Record<
      string,
      Json
    >;
    envelope.presealEnvelopeSha256 = hash("tampered-P-self-hash");
    expect(
      nhm2SphericalBosonStarV2ScientificPresealEnvelopeV1Violations(
        canonical(envelope),
      ),
    ).toContain("spherical_v2_scientific_preseal_sha256_mismatch");
  });

  it("keeps science, implementation, runtime, readiness, authority, claims, and lamps absent", () => {
    expect(
      Object.values(
        NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_INSTANCES,
      ).every((value) => value === null),
    ).toBe(true);
    for (const falseBoundary of [
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_READINESS,
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_AUTHORITY_LOCKS,
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CLAIM_LOCKS,
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_LAMPS,
    ]) {
      expect(
        Object.values(falseBoundary).every((value) => value === false),
      ).toBe(true);
    }
    for (const blocker of [
      "server_authenticated_skeleton_durability_observation_absent",
      "accepted_geometry_evaluation_instance_absent",
      "metric_demand_admitted_implementation_absent",
      "synthetic_metric_demand_executor_does_not_satisfy_candidate_readiness",
      "mean_rset_numerical_realization_absent",
      "noise_kernel_numerical_realization_absent",
      "operator_ordering_numerical_realization_absent",
      "server_authenticated_runtime_loader_observer_not_implemented",
      "server_authenticated_scientific_preseal_persistence_observer_not_implemented",
      "execution_not_authorized",
    ]) {
      expect(
        NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_BLOCKERS,
      ).toContain(blocker);
    }
    expect(
      Object.keys(scientificPresealModule).some((key) =>
        /issuer|weakset|mint/i.test(key),
      ),
    ).toBe(false);
  });

  it.each([
    "scientificPersistenceReceiptBinding",
    "scientificPresealPersistenceReceipt",
    "executionPreseal",
    "executionReceipt",
    "launchEnvelope",
    "postrunManifest",
  ])("forbids concrete later-phase root field %s", (field) => {
    const envelope = JSON.parse(makeEnvelope().envelopeJson) as Record<
      string,
      Json
    >;
    expect(envelope).not.toHaveProperty(field);
    envelope[field] = { rawSha256: hash(field) };
    expect(
      nhm2SphericalBosonStarV2ScientificPresealEnvelopeV1Violations(
        resealEnvelopeUnchecked(envelope),
      ),
    ).toContain("spherical_v2_scientific_preseal_fields_invalid");
  });

  it("accepts only exact canonical S, SR, and evidence strings", () => {
    const skeletonJson = makeSkeleton();
    const receiptJson = makeReceipt(skeletonJson);
    expect(() =>
      deriveNhm2SphericalBosonStarV2ScientificPresealEnvelopeV1CanonicalJson(
        `${skeletonJson}\n`,
        receiptJson,
        canonical({ createdAt: "2026-08-14T12:00:00.000000003Z" }),
      ),
    ).toThrow("spherical_v2_skeleton_v2:canonical_encoding_invalid");
    expect(() =>
      deriveNhm2SphericalBosonStarV2ScientificPresealEnvelopeV1CanonicalJson(
        skeletonJson,
        `${receiptJson}\n`,
        canonical({ createdAt: "2026-08-14T12:00:00.000000003Z" }),
      ),
    ).toThrow("spherical_v2_skeleton_receipt:canonical_encoding_invalid");
    expect(() =>
      deriveNhm2SphericalBosonStarV2ScientificPresealEnvelopeV1CanonicalJson(
        skeletonJson,
        receiptJson,
        JSON.stringify(
          {
            createdAt: "2026-08-14T12:00:00.000000003Z",
          },
          null,
          2,
        ),
      ),
    ).toThrow(
      "spherical_v2_scientific_preseal_evidence:canonical_encoding_invalid",
    );
    expect(() =>
      deriveNhm2SphericalBosonStarV2ScientificPresealEnvelopeV1CanonicalJson(
        skeletonJson,
        receiptJson,
        canonical({
          createdAt: "2026-08-14T12:00:00.000000003Z",
          candidateBinding: structuredClone(
            NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
          ) as unknown as Json,
        }),
      ),
    ).toThrow("spherical_v2_scientific_preseal_evidence_fields_invalid");

    const prettyEnvelope = JSON.stringify(
      JSON.parse(makeEnvelope().envelopeJson),
      null,
      2,
    );
    expect(
      nhm2SphericalBosonStarV2ScientificPresealEnvelopeV1Violations(
        prettyEnvelope,
      ),
    ).toContain("spherical_v2_scientific_preseal:canonical_encoding_invalid");
  });

  it("requires primitive canonical strings without touching hostile object surfaces", () => {
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
      nhm2SphericalBosonStarV2ScientificPresealEnvelopeV1Violations(hostile),
    ).toContain("spherical_v2_scientific_preseal:canonical_json_text_required");
    expect(() =>
      deriveNhm2SphericalBosonStarV2ScientificPresealEnvelopeV1CanonicalJson(
        hostile as unknown as string,
        accessor as unknown as string,
        hostile as unknown as string,
      ),
    ).toThrow("canonical_json_text_required");
    expect(() =>
      computeNhm2SphericalBosonStarV2ScientificPresealEnvelopeSha256(
        accessor as unknown as string,
      ),
    ).toThrow("canonical_json_text_required");
    expect(traps).toBe(0);
  });

  it("checks UTF-16 and UTF-8 caps before JSON.parse", () => {
    const originalParse = JSON.parse;
    const parseSpy = vi.spyOn(JSON, "parse");
    try {
      const millionKeyWire = `{${'"k":0,'.repeat(1_000_000)}"z":0}`;
      expect(
        nhm2SphericalBosonStarV2ScientificPresealEnvelopeV1Violations(
          millionKeyWire,
        ),
      ).toContain(
        "spherical_v2_scientific_preseal:canonical_code_units_exceeded",
      );
      expect(parseSpy).not.toHaveBeenCalled();

      const utf8Oversized = `"${"é".repeat(200_000)}"`;
      expect(utf8Oversized.length).toBeLessThan(
        NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_LIMITS.maximumCanonicalCodeUnits,
      );
      expect(
        nhm2SphericalBosonStarV2ScientificPresealEnvelopeV1Violations(
          utf8Oversized,
        ),
      ).toContain("spherical_v2_scientific_preseal:canonical_bytes_exceeded");
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
        nhm2SphericalBosonStarV2ScientificPresealEnvelopeV1Violations(wire);
      expect(violations.some((entry) => entry.includes(code))).toBe(true);
      expect(Object.isFrozen(violations)).toBe(true);
    },
  );

  it("is deterministic, changes its self-hash with time, and freezes exported definitions", () => {
    const first = makeEnvelope().envelopeJson;
    const second = makeEnvelope().envelopeJson;
    const later = makeEnvelope("2026-08-14T12:00:00.000000004Z").envelopeJson;
    expect(second).toBe(first);
    expect(
      (JSON.parse(later) as Record<string, string>).presealEnvelopeSha256,
    ).not.toBe(
      (JSON.parse(first) as Record<string, string>).presealEnvelopeSha256,
    );
    expect(
      Object.isFrozen(
        NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT,
      ),
    ).toBe(true);
    expect(
      Object.isFrozen(
        NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_BINDING,
      ),
    ).toBe(true);
  });
});
