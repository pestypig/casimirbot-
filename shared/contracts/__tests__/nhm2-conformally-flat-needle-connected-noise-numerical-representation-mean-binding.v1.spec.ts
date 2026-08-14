import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import * as meanBindingModule from "../nhm2-conformally-flat-needle-connected-noise-numerical-representation-mean-binding.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_AUTHORITY_LOCKS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_BLOCKERS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_CANONICAL_JSON,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_CLAIM_LOCKS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_CONTENT_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_CONTENT_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_MEAN_CONVENTION_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_MEAN_CONVENTION_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_NUMERICAL_REPRESENTATION_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_NUMERICAL_REPRESENTATION_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_SIZE_BYTES,
  canonicalNhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationMeanBindingJson,
  isNhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationMeanBindingV1,
  nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationMeanBindingViolations,
} from "../nhm2-conformally-flat-needle-connected-noise-numerical-representation-mean-binding.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_BLOCKERS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SIZE_BYTES,
} from "../nhm2-conformally-flat-needle-connected-noise-numerical-representation.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SIZE_BYTES,
} from "../nhm2-conformally-flat-needle-mean-rset-renormalization-convention.v1";

const clone = (): any =>
  structuredClone(
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING,
  );

const canonicalJson = (value: unknown): string => {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0))
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};

const binding = (value: unknown) => {
  const bytes = Buffer.from(canonicalJson(value), "utf8");
  return {
    canonicalization: "utf8_lexicographic_object_keys_json_v1",
    sha256: createHash("sha256").update(bytes).digest("hex"),
    sizeBytes: bytes.byteLength,
  };
};

const isDeepFrozen = (value: unknown, seen = new Set<object>()): boolean => {
  if (value == null || typeof value !== "object") return true;
  if (seen.has(value)) return true;
  seen.add(value);
  return (
    Object.isFrozen(value) &&
    Reflect.ownKeys(value).every((key) =>
      isDeepFrozen((value as Record<PropertyKey, unknown>)[key], seen),
    )
  );
};

const defineHostileKey = (
  target: object,
  key: "__proto__" | "prototype" | "constructor",
): void => {
  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    value: { authority: true },
    writable: true,
  });
};

describe("nhm2_conformally_flat_needle_connected_noise_numerical_representation_mean_binding/v1", () => {
  it("exports only one deeply frozen blocked binding overlay and no builder, issuer, executor, or receipt", () => {
    expect(Object.keys(meanBindingModule).sort()).toEqual(
      [
        "NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING",
        "NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_ARTIFACT_ID",
        "NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_AUTHORITY_LOCKS",
        "NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_BLOCKERS",
        "NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_CANONICAL_JSON",
        "NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_CLAIM_LOCKS",
        "NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_CONTENT_EXPECTED_SHA256",
        "NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_CONTENT_EXPECTED_SIZE_BYTES",
        "NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_CONTRACT_VERSION",
        "NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_EXPECTED_SHA256",
        "NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_EXPECTED_SIZE_BYTES",
        "NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_MEAN_CONVENTION_EXPECTED_SHA256",
        "NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_MEAN_CONVENTION_EXPECTED_SIZE_BYTES",
        "NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_NUMERICAL_REPRESENTATION_EXPECTED_SHA256",
        "NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_NUMERICAL_REPRESENTATION_EXPECTED_SIZE_BYTES",
        "NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_SHA256",
        "NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_SIZE_BYTES",
        "canonicalNhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationMeanBindingJson",
        "isNhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationMeanBindingV1",
        "nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationMeanBindingViolations",
      ].sort(),
    );
    expect(
      Object.keys(meanBindingModule).filter((name) =>
        /^(?:build|create|issue|execute|replay|receipt|certify|promote)/i.test(
          name,
        ),
      ),
    ).toEqual([]);
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationMeanBindingViolations(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING,
      ),
    ).toEqual([]);
    expect(
      isNhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationMeanBindingV1(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING,
      ),
    ).toBe(true);
    expect(
      isDeepFrozen(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING,
      ),
    ).toBe(true);
  });

  it("exact-binds both upstream contracts and preserves their literal identities", () => {
    const upstream =
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING
        .content.upstreamBindings;
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SHA256,
    ).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_NUMERICAL_REPRESENTATION_EXPECTED_SHA256,
    );
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SIZE_BYTES,
    ).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_NUMERICAL_REPRESENTATION_EXPECTED_SIZE_BYTES,
    );
    expect(
      binding(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION,
      ),
    ).toMatchObject({
      sha256:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_NUMERICAL_REPRESENTATION_EXPECTED_SHA256,
      sizeBytes:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_NUMERICAL_REPRESENTATION_EXPECTED_SIZE_BYTES,
    });
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SHA256,
    ).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_MEAN_CONVENTION_EXPECTED_SHA256,
    );
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SIZE_BYTES,
    ).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_MEAN_CONVENTION_EXPECTED_SIZE_BYTES,
    );
    expect(
      binding(
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION,
      ),
    ).toMatchObject({
      sha256:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_MEAN_CONVENTION_EXPECTED_SHA256,
      sizeBytes:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_MEAN_CONVENTION_EXPECTED_SIZE_BYTES,
    });
    for (const value of Object.values(upstream)) {
      expect(value).toMatchObject({
        canonicalization: "utf8_lexicographic_object_keys_json_v1",
        exactUpstreamBytesRequired: true,
        exactIdentityVerifiedAtModuleInitialization: true,
        semanticSubstitutionAllowed: false,
      });
    }
  });

  it("pins content and complete canonical bytes independently", () => {
    const contract =
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING;
    expect(contract.contentBinding).toEqual(binding(contract.content));
    expect(contract.contentBinding).toEqual({
      canonicalization: "utf8_lexicographic_object_keys_json_v1",
      sha256:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_CONTENT_EXPECTED_SHA256,
      sizeBytes:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_CONTENT_EXPECTED_SIZE_BYTES,
    });
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_SHA256,
    ).toBe(
      createHash("sha256")
        .update(
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_CANONICAL_JSON,
          "utf8",
        )
        .digest("hex"),
    );
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_SHA256,
    ).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_EXPECTED_SHA256,
    );
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_SIZE_BYTES,
    ).toBe(
      Buffer.byteLength(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_CANONICAL_JSON,
        "utf8",
      ),
    );
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_SIZE_BYTES,
    ).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_EXPECTED_SIZE_BYTES,
    );
  });

  it("resolves exactly the external mean-binding blocker and inherits every other blocker in order", () => {
    const content =
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING.content;
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_BLOCKERS,
    ).toEqual([
      "required_mean_renormalization_convention_binding_absent",
      ...NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_BLOCKERS,
    ]);
    expect(
      content.inheritedBlockedState.remainingNumericalRepresentationBlockers,
    ).toEqual(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_BLOCKERS.slice(
        1,
      ),
    );
    expect(content.resolvedMeanBindingRelation).toMatchObject({
      upstreamRequiredBlocker:
        "required_mean_renormalization_convention_binding_absent",
      boundCanonicalSha256:
        "749f705d1d64d8bb3867638b7b8b0fb20084191adaf83d206083bf4012a7a246",
      boundCanonicalSizeBytes: 20280,
      bindingAvailableInThisOverlay: true,
      bindingRequirementResolvedInThisOverlay: true,
      blockerRemovedOnlyFromThisOverlayBlockerList: true,
      upstreamNullFieldModified: false,
      numericalRepresentationBytesModified: false,
      meanConventionBytesModified: false,
      resolvesAnyOtherBlocker: false,
      authorizesExecution: false,
    });
    expect(content.overlayScope).toMatchObject({
      resolvesOnlyExternalRequiredMeanBindingRelation: true,
      resolvesNumericalFormulaOrProofGap: false,
      grantsExecutionAuthority: false,
    });
    expect(content.inheritedBlockedState).toMatchObject({
      upstreamBlockerCount: 17,
      resolvedExternalBindingBlockerCount: 1,
      remainingBlockerCount: 16,
      everyRemainingBlockerStillBlocking: true,
      fillsAnyNumericalRepresentationNullField: false,
      suppliesStressOperator: false,
      suppliesTwoParticleStressSymbol: false,
      suppliesNormalizationConstant: false,
      suppliesOnShellMeasure: false,
      suppliesFourierConvention: false,
      suppliesDistributionalEquivalenceProof: false,
      suppliesTailCertificate: false,
      suppliesWorkLimit: false,
      suppliesTolerance: false,
      suppliesLineageEvidence: false,
      suppliesExecutionContract: false,
    });
  });

  it("keeps execution, implementation, all authority, lamps, ADM, physical, propulsion, transport, and certificate claims locked", () => {
    const content =
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING.content;
    expect(content.executionAdmissible).toBe(false);
    expect(content.authority.status).toBe("blocked");
    expect(content.authority.firstBlocker).toBe(
      "primary_source_artifact_bytes_not_verified",
    );
    expect(content.authority.blockers).toEqual(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_BLOCKERS,
    );
    expect(Object.values(content.authority.locks)).toEqual(
      Object.values(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_AUTHORITY_LOCKS,
      ),
    );
    expect(
      Object.values(content.authority.locks).every((value) => !value),
    ).toBe(true);
    expect(Object.values(content.claimLocks)).toEqual(
      Object.values(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_CLAIM_LOCKS,
      ),
    );
    expect(Object.values(content.claimLocks).every((value) => !value)).toBe(
      true,
    );
    expect(
      Object.values(content.implementationBoundary).every((value) => !value),
    ).toBe(true);
  });

  it("canonicalizes a valid clone identically without exact-contract validation", () => {
    expect(
      canonicalNhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationMeanBindingJson(
        clone(),
      ),
    ).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_CANONICAL_JSON,
    );
    expect(
      canonicalNhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationMeanBindingJson(
        { z: [2, 1], a: true },
      ),
    ).toBe('{"a":true,"z":[2,1]}');
  });

  it("rejects exact-key additions and omissions plus stale content bindings", () => {
    const extra = clone();
    extra.content.overlayScope.executionReceipt = {};
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationMeanBindingViolations(
        extra,
      ),
    ).toEqual(
      expect.arrayContaining([
        "extra_key:/content/overlayScope/executionReceipt",
        "content_binding_invalid",
      ]),
    );

    const missing = clone();
    delete missing.content.resolvedMeanBindingRelation.authorizesExecution;
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationMeanBindingViolations(
        missing,
      ),
    ).toEqual(
      expect.arrayContaining([
        "missing_key:/content/resolvedMeanBindingRelation/authorizesExecution",
        "content_binding_invalid",
        "mean_binding_resolution_invalid",
      ]),
    );

    const stale = clone();
    stale.contentBinding.sha256 = "0".repeat(64);
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationMeanBindingViolations(
        stale,
      ),
    ).toContain("content_binding_invalid");
  });

  it("rejects root and nested proxies before invoking any proxy trap", () => {
    let trapCalls = 0;
    const rootProxy = new Proxy(clone(), {
      get: () => {
        trapCalls += 1;
        throw new Error("proxy_get_must_not_run");
      },
      getOwnPropertyDescriptor: () => {
        trapCalls += 1;
        throw new Error("proxy_getOwnPropertyDescriptor_must_not_run");
      },
      getPrototypeOf: () => {
        trapCalls += 1;
        throw new Error("proxy_getPrototypeOf_must_not_run");
      },
      ownKeys: () => {
        trapCalls += 1;
        throw new Error("proxy_ownKeys_must_not_run");
      },
    });
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationMeanBindingViolations(
        rootProxy,
      ),
    ).toEqual(["proxy_forbidden:/"]);
    expect(() =>
      canonicalNhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationMeanBindingJson(
        rootProxy,
      ),
    ).toThrow("Cannot canonicalize unsafe plain data: proxy_forbidden:/");
    expect(trapCalls).toBe(0);

    const nested = clone();
    nested.content.resolvedMeanBindingRelation = new Proxy(
      nested.content.resolvedMeanBindingRelation,
      {
        ownKeys: () => {
          trapCalls += 1;
          throw new Error("nested_proxy_ownKeys_must_not_run");
        },
      },
    );
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationMeanBindingViolations(
        nested,
      ),
    ).toEqual(["proxy_forbidden:/content/resolvedMeanBindingRelation"]);
    expect(trapCalls).toBe(0);
  });

  it("rejects object and array accessors without invoking their getters", () => {
    let getterCalls = 0;
    const accessor = clone();
    Object.defineProperty(accessor.content, "status", {
      configurable: true,
      enumerable: true,
      get: () => {
        getterCalls += 1;
        return "blocked_mean_binding_resolved_remaining_representation_blockers";
      },
    });
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationMeanBindingViolations(
        accessor,
      ),
    ).toEqual(["accessor_or_hidden_property_forbidden:/content/status"]);
    expect(() =>
      canonicalNhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationMeanBindingJson(
        accessor,
      ),
    ).toThrow(
      "Cannot canonicalize unsafe plain data: accessor_or_hidden_property_forbidden:/content/status",
    );
    expect(getterCalls).toBe(0);

    const arrayAccessor = clone();
    arrayAccessor.content.authority.blockers = Array.from(
      arrayAccessor.content.authority.blockers,
    );
    Object.defineProperty(arrayAccessor.content.authority.blockers, "0", {
      configurable: true,
      enumerable: true,
      get: () => {
        getterCalls += 1;
        return "primary_source_artifact_bytes_not_verified";
      },
    });
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationMeanBindingViolations(
        arrayAccessor,
      ),
    ).toEqual([
      "accessor_sparse_or_hidden_array_entry:/content/authority/blockers/0",
    ]);
    expect(getterCalls).toBe(0);
  });

  it("rejects symbols, non-enumerable properties, forbidden keys, and array side keys", () => {
    const symbol = clone();
    symbol.content[Symbol("hidden-authority")] = true;
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationMeanBindingViolations(
        symbol,
      ),
    ).toEqual(["symbol_key_forbidden:/content"]);
    expect(() =>
      canonicalNhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationMeanBindingJson(
        symbol,
      ),
    ).toThrow(
      "Cannot canonicalize unsafe plain data: symbol_key_forbidden:/content",
    );

    const hidden = clone();
    Object.defineProperty(hidden.content, "hiddenAuthority", {
      configurable: true,
      enumerable: false,
      value: true,
    });
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationMeanBindingViolations(
        hidden,
      ),
    ).toEqual([
      "accessor_or_hidden_property_forbidden:/content/hiddenAuthority",
    ]);

    for (const key of ["__proto__", "prototype", "constructor"] as const) {
      const forbidden = clone();
      defineHostileKey(forbidden.content.resolvedMeanBindingRelation, key);
      expect(
        nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationMeanBindingViolations(
          forbidden,
        ),
      ).toEqual([
        `forbidden_data_key:/content/resolvedMeanBindingRelation/${key}`,
      ]);
    }

    const arraySideKey = clone();
    arraySideKey.content.authority.blockers = Array.from(
      arraySideKey.content.authority.blockers,
    );
    Object.defineProperty(
      arraySideKey.content.authority.blockers,
      "4294967295",
      {
        configurable: true,
        enumerable: true,
        value: "hidden",
        writable: true,
      },
    );
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationMeanBindingViolations(
        arraySideKey,
      ),
    ).toEqual(["array_keys_invalid:/content/authority/blockers"]);
  });

  it("rejects sparse/non-plain containers, cycles, nonfinite numbers, and negative zero", () => {
    const sparse = clone();
    sparse.content.authority.blockers = Array.from(
      sparse.content.authority.blockers,
    );
    delete sparse.content.authority.blockers[0];
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationMeanBindingViolations(
        sparse,
      ),
    ).toEqual(["array_keys_invalid:/content/authority/blockers"]);

    const inherited = Object.assign(
      Object.create({ authority: true }),
      clone(),
    );
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationMeanBindingViolations(
        inherited,
      ),
    ).toEqual(["non_plain_object:/"]);

    const cyclic = clone();
    cyclic.content.loop = cyclic.content;
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationMeanBindingViolations(
        cyclic,
      ),
    ).toEqual(["cycle_forbidden:/content/loop"]);

    for (const [number, violation] of [
      [
        Number.NaN,
        "nonfinite_number:/content/inheritedBlockedState/upstreamBlockerCount",
      ],
      [
        Number.POSITIVE_INFINITY,
        "nonfinite_number:/content/inheritedBlockedState/upstreamBlockerCount",
      ],
      [
        Number.NEGATIVE_INFINITY,
        "nonfinite_number:/content/inheritedBlockedState/upstreamBlockerCount",
      ],
      [-0, "negative_zero:/content/inheritedBlockedState/upstreamBlockerCount"],
    ] as const) {
      const invalid = clone();
      invalid.content.inheritedBlockedState.upstreamBlockerCount = number;
      expect(
        nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationMeanBindingViolations(
          invalid,
        ),
      ).toEqual([violation]);
    }
  });

  it("rejects binding drift, hidden blocker removal, and every attempted execution or authority unlock", () => {
    const bindingDrift = clone();
    bindingDrift.content.upstreamBindings.meanRsetRenormalizationConvention.canonicalSha256 =
      "0".repeat(64);
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationMeanBindingViolations(
        bindingDrift,
      ),
    ).toContain("upstream_bindings_invalid");

    const blockerRemoval = clone();
    blockerRemoval.content.inheritedBlockedState.remainingNumericalRepresentationBlockers.pop();
    blockerRemoval.content.authority.blockers.pop();
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationMeanBindingViolations(
        blockerRemoval,
      ),
    ).toEqual(
      expect.arrayContaining([
        "remaining_blockers_must_be_inherited_exactly",
        "authority_must_remain_blocked",
      ]),
    );

    const resolutionOverreach = clone();
    resolutionOverreach.content.resolvedMeanBindingRelation.resolvesAnyOtherBlocker = true;
    resolutionOverreach.content.resolvedMeanBindingRelation.authorizesExecution = true;
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationMeanBindingViolations(
        resolutionOverreach,
      ),
    ).toContain("mean_binding_resolution_invalid");

    for (const key of Object.keys(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_AUTHORITY_LOCKS,
    )) {
      const authority = clone();
      authority.content.authority.locks[key] = true;
      expect(
        nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationMeanBindingViolations(
          authority,
        ),
        key,
      ).toContain("authority_must_remain_blocked");
    }

    for (const key of Object.keys(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_CLAIM_LOCKS,
    )) {
      const claim = clone();
      claim.content.claimLocks[key] = true;
      expect(
        nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationMeanBindingViolations(
          claim,
        ),
        key,
      ).toContain("claim_locks_must_remain_false");
    }

    const implementation = clone();
    implementation.content.executionAdmissible = true;
    implementation.content.implementationBoundary.builderPresent = true;
    implementation.content.implementationBoundary.issuerPresent = true;
    implementation.content.implementationBoundary.executionReceiptPresent = true;
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationMeanBindingViolations(
        implementation,
      ),
    ).toEqual(
      expect.arrayContaining([
        "builder_issuer_executor_receipts_must_remain_absent",
        "execution_must_remain_blocked",
      ]),
    );
  });
});
