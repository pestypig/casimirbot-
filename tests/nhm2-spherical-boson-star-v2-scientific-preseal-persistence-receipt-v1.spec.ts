import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { describe, expect, it, vi } from "vitest";

import {
  computeNhm2SphericalBosonStarV2OutputRootPlanSha256,
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-preexecution-profile.v2";
import {
  computeNhm2SphericalBosonStarV2SkeletonByteBindingV2,
  computeNhm2SphericalBosonStarV2SkeletonPersistenceReceiptSha256,
  deriveNhm2SphericalBosonStarV2PreexecutionOutputSkeletonV2CanonicalJson,
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2,
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_AUTHORITY_LOCKS,
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_CLAIM_LOCKS,
  NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_PERSISTENCE_RECEIPT_ARTIFACT_ID,
  NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_PERSISTENCE_RECEIPT_CONTRACT_VERSION,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-run-artifact-wire.v2";
import {
  deriveNhm2SphericalBosonStarV2ScientificPresealEnvelopeV1CanonicalJson,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_BINDING,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-scientific-preseal-envelope.v1";
import * as persistenceReceiptModule from "../shared/contracts/nhm2-spherical-boson-star-v2-scientific-preseal-persistence-receipt.v1";
import {
  computeNhm2SphericalBosonStarV2ScientificPresealByteBindingV1,
  computeNhm2SphericalBosonStarV2ScientificPresealPersistenceReceiptByteBinding,
  computeNhm2SphericalBosonStarV2ScientificPresealPersistenceReceiptSha256,
  deriveNhm2SphericalBosonStarV2DiagnosticScientificPresealPersistencePairV1,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_ARTIFACT_ID,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_AUTHORITY_LOCKS,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_BLOCKERS,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CLAIM_LOCKS,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_CANONICAL_JSON,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_EXPECTED_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_VERSION,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_EXACT_KEYS,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_INSTANCES,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_LAMPS,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_LIMITS,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_READINESS,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_REQUIRED_DEPENDENCY_BINDINGS,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_SCIENTIFIC_PRESEAL_BINDING_EXACT_KEYS,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_UNSIGNED_EXACT_KEYS,
  nhm2SphericalBosonStarV2ScientificPresealPersistencePairViolations,
  nhm2SphericalBosonStarV2ScientificPresealPersistenceReceiptV1Violations,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-scientific-preseal-persistence-receipt.v1";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

const canonical = (value: Json): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonical(value[key]!)}`)
    .join(",")}}`;
};

const sha256 = (value: string): string =>
  createHash("sha256").update(value, "utf8").digest("hex");

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

const makeA = (suffix = "one"): Record<string, Json> => ({
  schemaVersion: "nhm2_spherical_boson_star_v2_pre_preseal_static_closure/v1",
  closurePhase: "pre_scientific_preseal",
  preexecutionProfileBinding: structuredClone(
    NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING,
  ) as unknown as Json,
  commandArgvSha256: hash(`argv:${suffix}`),
  prePresealStaticInputAggregateSha256: hash(`static-inputs:${suffix}`),
  prePresealFreshnessInventorySha256: hash(`freshness:${suffix}`),
  dirtyTreeDigestSha256: hash(`dirty-tree:${suffix}`),
  expectedRuntimeClosureSha256: hash(`expected-runtime:${suffix}`),
  outputRootPlan: structuredClone(outputRootPlan) as unknown as Json,
  outputRootPlanSha256: computeNhm2SphericalBosonStarV2OutputRootPlanSha256(
    canonical(outputRootPlan as unknown as Json),
  ),
});

const sealSkeletonReceipt = (unsigned: Record<string, Json>): string => {
  const unsignedCanonicalJson = canonical(unsigned);
  return canonical({
    ...structuredClone(unsigned),
    receiptSha256:
      computeNhm2SphericalBosonStarV2SkeletonPersistenceReceiptSha256(
        unsignedCanonicalJson,
      ),
  });
};

const makeSkeletonReceipt = (skeletonCanonicalJson: string): string => {
  const binding = computeNhm2SphericalBosonStarV2SkeletonByteBindingV2(
    skeletonCanonicalJson,
  );
  return sealSkeletonReceipt({
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
      path: "/srv/nhm2/preexecution/output-skeleton.v2.json",
    } as unknown as Json,
    persistedAt: "2026-08-14T12:00:00.000000002Z",
    authorityLocks: structuredClone(
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_AUTHORITY_LOCKS,
    ) as unknown as Json,
    claimLocks: structuredClone(
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_CLAIM_LOCKS,
    ) as unknown as Json,
  });
};

type Chain = Readonly<{
  aJson: string;
  skeletonJson: string;
  skeletonReceiptJson: string;
  presealJson: string;
}>;

const makeChain = (suffix = "one"): Chain => {
  const aJson = canonical(makeA(suffix));
  const skeletonJson =
    deriveNhm2SphericalBosonStarV2PreexecutionOutputSkeletonV2CanonicalJson(
      aJson,
      canonical({ skeletonFrozenAt: "2026-08-14T12:00:00.000000001Z" }),
    );
  const skeletonReceiptJson = makeSkeletonReceipt(skeletonJson);
  const presealJson =
    deriveNhm2SphericalBosonStarV2ScientificPresealEnvelopeV1CanonicalJson(
      skeletonJson,
      skeletonReceiptJson,
      canonical({ createdAt: "2026-08-14T12:00:00.000000003Z" }),
    );
  return { aJson, skeletonJson, skeletonReceiptJson, presealJson };
};

const makeUnsignedReceipt = (
  chain: Chain,
  overrides: Record<string, Json> = {},
): Record<string, Json> => {
  const presealBinding =
    computeNhm2SphericalBosonStarV2ScientificPresealByteBindingV1(
      chain.aJson,
      chain.skeletonJson,
      chain.skeletonReceiptJson,
      chain.presealJson,
    );
  return {
    artifactId:
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_VERSION,
    phase:
      "external_scientific_preseal_durable_readback_receipt_integrity_only",
    authorityFalse: true,
    candidateId:
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_BINDING.candidateId,
    persistenceKind: "external_durable_publication_readback",
    observationAuthentication: "not_established_by_plain_canonical_json",
    authenticatedObservationContext: null,
    path: "/srv/nhm2/preexecution/scientific-preseal-receipt.v1.json",
    scientificPresealBinding: {
      ...structuredClone(presealBinding),
      path: "/srv/nhm2/preexecution/scientific-preseal-envelope.v1.json",
    } as unknown as Json,
    persistedAt: "2026-08-14T12:00:00.000000004Z",
    persistenceObservedAt: "2026-08-14T12:00:00.000000005Z",
    authorityLocks: structuredClone(
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_AUTHORITY_LOCKS,
    ) as unknown as Json,
    claimLocks: structuredClone(
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CLAIM_LOCKS,
    ) as unknown as Json,
    ...structuredClone(overrides),
  };
};

const sealReceipt = (unsigned: Record<string, Json>): string => {
  const unsignedCanonicalJson = canonical(unsigned);
  return canonical({
    ...structuredClone(unsigned),
    receiptSha256:
      computeNhm2SphericalBosonStarV2ScientificPresealPersistenceReceiptSha256(
        unsignedCanonicalJson,
      ),
  });
};

const makeReceipt = (
  chain: Chain,
  overrides: Record<string, Json> = {},
): string => sealReceipt(makeUnsignedReceipt(chain, overrides));

const resealReceiptRecord = (receipt: Record<string, Json>): string => {
  const unsigned = structuredClone(receipt);
  delete unsigned.receiptSha256;
  return sealReceipt(unsigned);
};

describe("NHM2 spherical boson-star v2 scientific-preseal persistence receipt v1", () => {
  it("has the acknowledged repaired literal semantic self-seal and canonical size", () => {
    const canonicalAgain = canonical(
      JSON.parse(
        NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_CANONICAL_JSON,
      ) as Json,
    );
    expect(canonicalAgain).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_CANONICAL_JSON,
    );
    const bytes = Buffer.from(canonicalAgain, "utf8");
    expect(
      createHash("sha256")
        .update(
          NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_SHA256_DOMAIN,
          "utf8",
        )
        .update(u64le(bytes.length))
        .update(bytes)
        .digest("hex"),
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_SHA256,
    );
    expect(bytes.length).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_CANONICAL_SIZE_BYTES,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_EXPECTED_SHA256,
    ).toBe("4c4112703dc13778d7053287fa03f0a22fb532ea09c9dad5b0b7046757140605");
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_EXPECTED_CANONICAL_SIZE_BYTES,
    ).toBe(8_306);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_EXPECTED_SHA256,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_SHA256,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_EXPECTED_CANONICAL_SIZE_BYTES,
    ).toBe(bytes.length);
  });

  it("pins final independently cleared A, S/SR, and P contracts exactly", () => {
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_REQUIRED_DEPENDENCY_BINDINGS,
    ).toEqual({
      preexecutionProfileV2: {
        sha256:
          "dce4c293d09224e4b7d79bd8b04b46542875f0306eecee84c35bb4c10bf68cb8",
        canonicalSizeBytes: 11_663,
      },
      runArtifactWireV2: {
        sha256:
          "d681751c9f0cec9e10336f98bb4c6a2657411bc74d612313660692363202971d",
        canonicalSizeBytes: 11_117,
      },
      scientificPresealEnvelopeV1: {
        sha256:
          "b832aefb663b08cc9982d7ffb6ee0d21eea4a3453aa4aec6c22ab3cd6d2ccbca",
        canonicalSizeBytes: 10_551,
      },
    });
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING,
    ).toMatchObject(
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_REQUIRED_DEPENDENCY_BINDINGS.preexecutionProfileV2,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_BINDING,
    ).toMatchObject(
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_REQUIRED_DEPENDENCY_BINDINGS.runArtifactWireV2,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_BINDING,
    ).toMatchObject(
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_REQUIRED_DEPENDENCY_BINDINGS.scientificPresealEnvelopeV1,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT.exactBindings,
    ).toEqual({
      preexecutionProfileV2:
        NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING,
      runArtifactWireV2:
        NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_BINDING,
      scientificPresealEnvelopeV1:
        NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_BINDING,
    });
  });

  it("validates exact canonical PR and derives diagnostic P/PR byte bindings", () => {
    const chain = makeChain();
    const receiptJson = makeReceipt(chain);
    const receipt = JSON.parse(receiptJson) as Record<string, any>;
    const presealBytes =
      computeNhm2SphericalBosonStarV2ScientificPresealByteBindingV1(
        chain.aJson,
        chain.skeletonJson,
        chain.skeletonReceiptJson,
        chain.presealJson,
      );
    const receiptBytes =
      computeNhm2SphericalBosonStarV2ScientificPresealPersistenceReceiptByteBinding(
        receiptJson,
      );
    const diagnostic =
      deriveNhm2SphericalBosonStarV2DiagnosticScientificPresealPersistencePairV1(
        chain.aJson,
        chain.skeletonJson,
        chain.skeletonReceiptJson,
        chain.presealJson,
        receiptJson,
      );

    expect(Object.keys(receipt)).toEqual(
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_EXACT_KEYS,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_EXACT_KEYS,
    ).toEqual(
      [
        ...NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_EXACT_KEYS,
      ].sort(),
    );
    expect(Object.keys(receipt.scientificPresealBinding)).toEqual(
      [
        ...NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_SCIENTIFIC_PRESEAL_BINDING_EXACT_KEYS,
      ].sort(),
    );
    expect(
      nhm2SphericalBosonStarV2ScientificPresealPersistenceReceiptV1Violations(
        receiptJson,
      ),
    ).toEqual([]);
    expect(
      nhm2SphericalBosonStarV2ScientificPresealPersistencePairViolations(
        chain.aJson,
        chain.skeletonJson,
        chain.skeletonReceiptJson,
        chain.presealJson,
        receiptJson,
      ),
    ).toEqual([]);
    expect(receipt.scientificPresealBinding).toEqual({
      ...presealBytes,
      path: "/srv/nhm2/preexecution/scientific-preseal-envelope.v1.json",
    });
    expect(receiptBytes).toMatchObject({
      rawSha256: sha256(receiptJson),
      receiptSha256: receipt.receiptSha256,
      sizeBytes: Buffer.byteLength(receiptJson, "utf8"),
      persistenceObservedAt: receipt.persistenceObservedAt,
    });
    const {
      prePresealStaticClosureSha256: _closureDigest,
      ...diagnosticPreseal
    } = presealBytes;
    expect(diagnostic.scientificPresealBinding).toEqual({
      ...diagnosticPreseal,
      path: receipt.scientificPresealBinding.path,
      persistedAt: receipt.persistedAt,
    });
    expect(diagnostic.scientificPersistenceReceiptBinding).toEqual({
      ...receiptBytes,
      path: receipt.path,
      persistedArtifactRawSha256: presealBytes.rawSha256,
      persistedArtifactSizeBytes: presealBytes.sizeBytes,
    });
    expect(Object.isFrozen(diagnostic)).toBe(true);
    expect(Object.isFrozen(diagnostic.scientificPresealBinding)).toBe(true);
  });

  it("self-hashes only exact unsigned PR bytes with the dedicated domain and u64 length", () => {
    const chain = makeChain();
    const receiptJson = makeReceipt(chain);
    const receipt = JSON.parse(receiptJson) as Record<string, Json>;
    const actual = receipt.receiptSha256;
    delete receipt.receiptSha256;
    const unsignedJson = canonical(receipt);
    expect(Object.keys(receipt)).toEqual(
      [
        ...NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_UNSIGNED_EXACT_KEYS,
      ].sort(),
    );
    expect(actual).toBe(
      lengthDelimitedSha256(
        NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_SHA256_DOMAIN,
        unsignedJson,
      ),
    );
    expect(actual).toBe(
      computeNhm2SphericalBosonStarV2ScientificPresealPersistenceReceiptSha256(
        unsignedJson,
      ),
    );
  });

  it("enforces P.createdAt < persistedAt <= persistenceObservedAt at nanosecond precision", () => {
    const chain = makeChain();
    expect(() =>
      sealReceipt(
        makeUnsignedReceipt(chain, {
          persistedAt: "2026-08-14T12:00:00.000000003Z",
        }),
      ),
    ).toThrow(
      "spherical_v2_scientific_preseal_persistence_receipt_identity_or_chronology_invalid",
    );
    expect(() =>
      sealReceipt(
        makeUnsignedReceipt(chain, {
          persistedAt: "2026-08-14T12:00:00.000000006Z",
          persistenceObservedAt: "2026-08-14T12:00:00.000000005Z",
        }),
      ),
    ).toThrow(
      "spherical_v2_scientific_preseal_persistence_receipt_identity_or_chronology_invalid",
    );
    const equalJson = makeReceipt(chain, {
      persistedAt: "2026-08-14T12:00:00.000000004Z",
      persistenceObservedAt: "2026-08-14T12:00:00.000000004Z",
    });
    expect(
      nhm2SphericalBosonStarV2ScientificPresealPersistencePairViolations(
        chain.aJson,
        chain.skeletonJson,
        chain.skeletonReceiptJson,
        chain.presealJson,
        equalJson,
      ),
    ).toEqual([]);
  });

  it("rejects A/S/SR/P splicing even when P and PR are each independently valid", () => {
    const first = makeChain("one");
    const second = makeChain("two");
    const secondReceipt = makeReceipt(second);
    expect(
      nhm2SphericalBosonStarV2ScientificPresealPersistencePairViolations(
        first.aJson,
        first.skeletonJson,
        first.skeletonReceiptJson,
        second.presealJson,
        secondReceipt,
      ),
    ).toContain(
      "spherical_v2_scientific_preseal_persistence_pair_A_S_SR_P_binding_invalid",
    );
    expect(
      nhm2SphericalBosonStarV2ScientificPresealPersistencePairViolations(
        second.aJson,
        first.skeletonJson,
        first.skeletonReceiptJson,
        first.presealJson,
        makeReceipt(first),
      ),
    ).toContain(
      "spherical_v2_scientific_preseal_persistence_pair_A_S_binding_invalid",
    );
    expect(
      nhm2SphericalBosonStarV2ScientificPresealPersistencePairViolations(
        first.aJson,
        first.skeletonJson,
        first.skeletonReceiptJson,
        first.presealJson,
        secondReceipt,
      ),
    ).toContain(
      "spherical_v2_scientific_preseal_persistence_pair_P_PR_byte_binding_invalid",
    );
  });

  it("rejects every P byte-domain cross-binding mismatch after a valid PR reseal", () => {
    const chain = makeChain();
    const fields = [
      "rawSha256",
      "presealEnvelopeSha256",
      "prePresealStaticClosureSha256",
      "boundSkeletonRawSha256",
      "boundSkeletonWireSha256",
      "boundSkeletonPersistenceReceiptSha256",
    ] as const;
    for (const field of fields) {
      const receipt = JSON.parse(makeReceipt(chain)) as Record<string, any>;
      receipt.scientificPresealBinding[field] = hash(`wrong:${field}`);
      const resealed = resealReceiptRecord(receipt);
      expect(
        nhm2SphericalBosonStarV2ScientificPresealPersistencePairViolations(
          chain.aJson,
          chain.skeletonJson,
          chain.skeletonReceiptJson,
          chain.presealJson,
          resealed,
        ),
      ).toContain(
        "spherical_v2_scientific_preseal_persistence_pair_P_PR_byte_binding_invalid",
      );
    }
    for (const field of ["sizeBytes", "boundSkeletonSizeBytes"] as const) {
      const receipt = JSON.parse(makeReceipt(chain)) as Record<string, any>;
      receipt.scientificPresealBinding[field] += 1;
      const resealed = resealReceiptRecord(receipt);
      expect(
        nhm2SphericalBosonStarV2ScientificPresealPersistencePairViolations(
          chain.aJson,
          chain.skeletonJson,
          chain.skeletonReceiptJson,
          chain.presealJson,
          resealed,
        ),
      ).toContain(
        "spherical_v2_scientific_preseal_persistence_pair_P_PR_byte_binding_invalid",
      );
    }
    const timestampDrift = JSON.parse(makeReceipt(chain)) as Record<
      string,
      any
    >;
    timestampDrift.scientificPresealBinding.createdAt =
      "2026-08-14T12:00:00.000000002Z";
    expect(
      nhm2SphericalBosonStarV2ScientificPresealPersistencePairViolations(
        chain.aJson,
        chain.skeletonJson,
        chain.skeletonReceiptJson,
        chain.presealJson,
        resealReceiptRecord(timestampDrift),
      ),
    ).toContain(
      "spherical_v2_scientific_preseal_persistence_pair_P_PR_byte_binding_invalid",
    );
  });

  it("rejects malformed, noncanonical, duplicate, extra, and self-hash-drifted PR", () => {
    const chain = makeChain();
    const receiptJson = makeReceipt(chain);
    const receipt = JSON.parse(receiptJson) as Record<string, Json>;

    expect(
      nhm2SphericalBosonStarV2ScientificPresealPersistenceReceiptV1Violations(
        ` ${receiptJson}`,
      )[0],
    ).toContain("canonical_encoding_invalid");
    expect(
      nhm2SphericalBosonStarV2ScientificPresealPersistenceReceiptV1Violations(
        receiptJson.replace(
          '"artifactId":',
          '"artifactId":"duplicate","artifactId":',
        ),
      )[0],
    ).toContain("canonical_encoding_invalid");

    const extra = structuredClone(receipt);
    extra.extra = false;
    expect(
      nhm2SphericalBosonStarV2ScientificPresealPersistenceReceiptV1Violations(
        canonical(extra),
      ),
    ).toContain(
      "spherical_v2_scientific_preseal_persistence_receipt_fields_invalid",
    );

    const drift = structuredClone(receipt);
    drift.receiptSha256 = hash("wrong-receipt-seal");
    expect(
      nhm2SphericalBosonStarV2ScientificPresealPersistenceReceiptV1Violations(
        canonical(drift),
      ),
    ).toContain(
      "spherical_v2_scientific_preseal_persistence_receipt_sha256_mismatch",
    );
  });

  it("prebounds hostile text and rejects non-string proxies/accessors with zero traps", () => {
    let traps = 0;
    const hostileProxy = new Proxy(
      {},
      {
        get() {
          traps += 1;
          throw new Error("get trap reached");
        },
        ownKeys() {
          traps += 1;
          throw new Error("ownKeys trap reached");
        },
        getOwnPropertyDescriptor() {
          traps += 1;
          throw new Error("descriptor trap reached");
        },
      },
    );
    const hostileAccessor = Object.defineProperty({}, "length", {
      get() {
        traps += 1;
        throw new Error("accessor reached");
      },
    });

    expect(
      nhm2SphericalBosonStarV2ScientificPresealPersistenceReceiptV1Violations(
        hostileProxy,
      )[0],
    ).toContain("canonical_json_text_required");
    expect(() =>
      computeNhm2SphericalBosonStarV2ScientificPresealPersistenceReceiptSha256(
        hostileAccessor,
      ),
    ).toThrow("canonical_json_text_required");
    expect(
      nhm2SphericalBosonStarV2ScientificPresealPersistencePairViolations(
        hostileProxy,
        hostileAccessor,
        hostileProxy,
        hostileAccessor,
        hostileProxy,
      )[0],
    ).toContain("canonical_json_text_required");
    expect(traps).toBe(0);

    const tooLong = `"${"x".repeat(
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_LIMITS.maximumCanonicalCodeUnits +
        1,
    )}"`;
    expect(
      nhm2SphericalBosonStarV2ScientificPresealPersistenceReceiptV1Violations(
        tooLong,
      )[0],
    ).toContain("canonical_code_units_exceeded");

    const millionPropertyText = `{${'"k":0,'.repeat(1_000_000)}"z":0}`;
    expect(
      nhm2SphericalBosonStarV2ScientificPresealPersistenceReceiptV1Violations(
        millionPropertyText,
      )[0],
    ).toContain("canonical_code_units_exceeded");

    const longKey = `{"${"k".repeat(
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_LIMITS.maximumPropertyKeyUtf8Bytes +
        1,
    )}":0}`;
    expect(
      nhm2SphericalBosonStarV2ScientificPresealPersistenceReceiptV1Violations(
        longKey,
      )[0],
    ).toContain("key_utf8");
  });

  it("keeps observation, durability, readiness, authority, claims, and lamps false/null", () => {
    expect(
      Object.values(
        NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_AUTHORITY_LOCKS,
      ),
    ).toSatisfy((values: unknown[]) =>
      values.every((value) => value === false),
    );
    expect(
      Object.values(
        NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CLAIM_LOCKS,
      ),
    ).toSatisfy((values: unknown[]) =>
      values.every((value) => value === false),
    );
    expect(
      Object.values(
        NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_LAMPS,
      ),
    ).toSatisfy((values: unknown[]) =>
      values.every((value) => value === false),
    );
    expect(
      Object.values(
        NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_READINESS,
      ),
    ).toSatisfy((values: unknown[]) =>
      values.every((value) => value === false),
    );
    expect(
      Object.values(
        NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_INSTANCES,
      ),
    ).toSatisfy((values: unknown[]) => values.every((value) => value === null));
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_BLOCKERS,
    ).toContain(
      "server_authenticated_scientific_preseal_persistence_observer_not_implemented",
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT
        .derivationBoundary
        .receiptFieldsAreCallerClaimsNotAuthenticatedObservations,
    ).toBe(true);
  });

  it("exports no issuer/mint/capability and imports no filesystem, registry, or execution service", () => {
    const exportedNames = Object.keys(persistenceReceiptModule);
    expect(
      exportedNames.some((name) => /issuer|mint|capability/i.test(name)),
    ).toBe(false);
    const source = readFileSync(
      new URL(
        "../shared/contracts/nhm2-spherical-boson-star-v2-scientific-preseal-persistence-receipt.v1.ts",
        import.meta.url,
      ),
      "utf8",
    );
    expect(source).not.toMatch(/from\s+["']node:fs/);
    expect(source).not.toMatch(/\bWeakSet\b/);
    expect(source).not.toMatch(
      /writeFile|readFile|openat2|statx|execFile|spawn/,
    );
    expect(source).not.toMatch(/candidate-registry|casimir/i);
    expect(source).not.toMatch(
      /export\s+(?:const|function|class)\s+\w*(?:Issuer|Mint|Capability)/,
    );
  });

  it("freezes the diagnostic contract and binding without granting authority", () => {
    expect(
      Object.isFrozen(
        NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT,
      ),
    ).toBe(true);
    expect(
      Object.isFrozen(
        NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_BINDING,
      ),
    ).toBe(true);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_BINDING,
    ).toMatchObject({
      artifactId:
        NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_ARTIFACT_ID,
      contractVersion:
        NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_VERSION,
      sha256:
        NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_SHA256,
      canonicalSizeBytes:
        NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_CANONICAL_SIZE_BYTES,
      mediaType: "application/json",
    });
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT
        .receiptSchema
        .standalonePlainReceiptGrantsPersistenceOrObservationAuthority,
    ).toBe(false);
  });
});
