import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import * as conventionModule from "../nhm2-conformally-flat-needle-mean-rset-renormalization-convention.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_AUTHORITY_LOCKS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_BLOCKERS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CANONICAL_JSON,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CLAIM_LOCKS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CONNECTED_NOISE_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CONNECTED_NOISE_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CONTENT_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CONTENT_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_OBSERVABLES_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_OBSERVABLES_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SCALAR_REFERENCE_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SCALAR_REFERENCE_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SIZE_BYTES,
  canonicalNhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionJson,
  isNhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionV1,
  nhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionViolations,
} from "../nhm2-conformally-flat-needle-mean-rset-renormalization-convention.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_SIZE_BYTES,
} from "../nhm2-conformally-flat-needle-connected-noise-distribution-convention.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES,
} from "../nhm2-conformally-flat-needle-fixed-background-observables.v1";
import { NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE } from "../nhm2-conformally-flat-needle-scalar-reference.v1";

const clone = (): any =>
  structuredClone(
    NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION,
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

describe("nhm2_conformally_flat_needle_mean_rset_renormalization_convention/v1", () => {
  it("exports only the exact blocked semantic convention surface", () => {
    expect(Object.keys(conventionModule).sort()).toEqual(
      [
        "NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION",
        "NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_ARTIFACT_ID",
        "NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_AUTHORITY_LOCKS",
        "NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_BLOCKERS",
        "NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CANONICAL_JSON",
        "NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CLAIM_LOCKS",
        "NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CONNECTED_NOISE_EXPECTED_SHA256",
        "NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CONNECTED_NOISE_EXPECTED_SIZE_BYTES",
        "NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CONTENT_EXPECTED_SHA256",
        "NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CONTENT_EXPECTED_SIZE_BYTES",
        "NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CONTRACT_VERSION",
        "NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_EXPECTED_SHA256",
        "NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_EXPECTED_SIZE_BYTES",
        "NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_OBSERVABLES_EXPECTED_SHA256",
        "NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_OBSERVABLES_EXPECTED_SIZE_BYTES",
        "NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SCALAR_REFERENCE_EXPECTED_SHA256",
        "NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SCALAR_REFERENCE_EXPECTED_SIZE_BYTES",
        "NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SHA256",
        "NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SIZE_BYTES",
        "canonicalNhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionJson",
        "isNhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionV1",
        "nhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionViolations",
      ].sort(),
    );
    expect(
      nhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionViolations(
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION,
      ),
    ).toEqual([]);
    expect(
      isNhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionV1(
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION,
      ),
    ).toBe(true);
    expect(
      isDeepFrozen(
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION,
      ),
    ).toBe(true);
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION.content,
    ).toMatchObject({
      maturity: "stage_2_diagnostic_semantic_convention_only",
      status: "blocked_semantic_convention_frozen_execution_unavailable",
      mathematicalConventionResolved: true,
      semanticConventionFrozen: true,
      singleSourceLiteralTranscriptionSafe: false,
      executionAdmissible: false,
      authorityIssuanceAllowed: false,
    });
  });

  it("binds the exact scalar-reference, observables, and connected-noise identities", () => {
    const upstream =
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION.content
        .upstreamBindings;
    expect(binding(NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE)).toEqual({
      canonicalization: "utf8_lexicographic_object_keys_json_v1",
      sha256:
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SCALAR_REFERENCE_EXPECTED_SHA256,
      sizeBytes:
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SCALAR_REFERENCE_EXPECTED_SIZE_BYTES,
    });
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256,
    ).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_OBSERVABLES_EXPECTED_SHA256,
    );
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES,
    ).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_OBSERVABLES_EXPECTED_SIZE_BYTES,
    );
    expect(
      binding(NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES),
    ).toMatchObject({
      sha256:
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_OBSERVABLES_EXPECTED_SHA256,
      sizeBytes:
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_OBSERVABLES_EXPECTED_SIZE_BYTES,
    });
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_SHA256,
    ).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CONNECTED_NOISE_EXPECTED_SHA256,
    );
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_SIZE_BYTES,
    ).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CONNECTED_NOISE_EXPECTED_SIZE_BYTES,
    );
    expect(
      binding(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION,
      ),
    ).toMatchObject({
      sha256:
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CONNECTED_NOISE_EXPECTED_SHA256,
      sizeBytes:
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CONNECTED_NOISE_EXPECTED_SIZE_BYTES,
    });
    for (const value of Object.values(upstream)) {
      expect(value).toMatchObject({
        canonicalization: "utf8_lexicographic_object_keys_json_v1",
        exactLiteralIdentityRequired: true,
        semanticSubstitutionAllowed: false,
      });
    }
  });

  it("pins content and complete canonical bytes independently", () => {
    const contract =
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION;
    expect(contract.contentBinding).toEqual(binding(contract.content));
    expect(contract.contentBinding).toMatchObject({
      sha256:
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CONTENT_EXPECTED_SHA256,
      sizeBytes:
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CONTENT_EXPECTED_SIZE_BYTES,
    });
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SHA256,
    ).toBe(
      createHash("sha256")
        .update(
          NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CANONICAL_JSON,
          "utf8",
        )
        .digest("hex"),
    );
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SHA256,
    ).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_EXPECTED_SHA256,
    );
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SIZE_BYTES,
    ).toBe(
      Buffer.byteLength(
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CANONICAL_JSON,
        "utf8",
      ),
    );
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SIZE_BYTES,
    ).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_EXPECTED_SIZE_BYTES,
    );
  });

  it("canonicalizes a descriptor-snapshotted clone without exact-contract validation", () => {
    expect(
      canonicalNhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionJson(
        clone(),
      ),
    ).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CANONICAL_JSON,
    );
    expect(
      canonicalNhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionJson({
        z: [2, 1],
        a: true,
      }),
    ).toBe('{"a":true,"z":[2,1]}');
  });

  it("rejects canonicalization collisions from symbols, hidden properties, and array side keys", () => {
    const symbol = clone();
    symbol.content[Symbol("hidden-authority")] = true;
    expect(() =>
      canonicalNhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionJson(
        symbol,
      ),
    ).toThrowError(new TypeError("symbol_key_forbidden:/content"));

    const hidden = clone();
    Object.defineProperty(hidden.content, "hiddenAuthority", {
      configurable: true,
      enumerable: false,
      value: true,
    });
    expect(() =>
      canonicalNhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionJson(
        hidden,
      ),
    ).toThrowError(
      new TypeError(
        "accessor_or_hidden_property_forbidden:/content/hiddenAuthority",
      ),
    );

    const arraySideKey = clone();
    Object.defineProperty(
      arraySideKey.content.primarySourceAudit.sources,
      "4294967295",
      {
        configurable: true,
        enumerable: true,
        value: "hidden",
        writable: true,
      },
    );
    expect(() =>
      canonicalNhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionJson(
        arraySideKey,
      ),
    ).toThrowError(
      new TypeError("array_keys_invalid:/content/primarySourceAudit/sources"),
    );
  });

  it("rejects accessors and proxies during canonicalization without observable reads", () => {
    let getterCalls = 0;
    const accessor = clone();
    Object.defineProperty(accessor.content, "status", {
      configurable: true,
      enumerable: true,
      get: () => {
        getterCalls += 1;
        return "blocked_semantic_convention_frozen_execution_unavailable";
      },
    });
    expect(() =>
      canonicalNhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionJson(
        accessor,
      ),
    ).toThrowError(
      new TypeError("accessor_or_hidden_property_forbidden:/content/status"),
    );
    expect(getterCalls).toBe(0);

    let trapCalls = 0;
    const proxy = new Proxy(clone(), {
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
    expect(() =>
      canonicalNhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionJson(
        proxy,
      ),
    ).toThrowError(new TypeError("proxy_forbidden:/"));
    expect(trapCalls).toBe(0);
  });

  it("rejects forbidden keys, cycles, nonfinite numbers, and negative zero during canonicalization", () => {
    for (const key of ["__proto__", "prototype", "constructor"] as const) {
      const forbidden = clone();
      defineHostileKey(forbidden.content, key);
      expect(() =>
        canonicalNhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionJson(
          forbidden,
        ),
      ).toThrowError(new TypeError(`forbidden_data_key:/content/${key}`));
    }

    const cyclic = clone();
    cyclic.content.loop = cyclic.content;
    expect(() =>
      canonicalNhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionJson(
        cyclic,
      ),
    ).toThrowError(new TypeError("cycle_forbidden:/content/loop"));

    for (const [number, violation] of [
      [
        Number.NaN,
        "nonfinite_number:/content/geometricAndFieldConventions/mass",
      ],
      [
        Number.POSITIVE_INFINITY,
        "nonfinite_number:/content/geometricAndFieldConventions/mass",
      ],
      [
        Number.NEGATIVE_INFINITY,
        "nonfinite_number:/content/geometricAndFieldConventions/mass",
      ],
      [-0, "negative_zero:/content/geometricAndFieldConventions/mass"],
    ] as const) {
      const invalidNumber = clone();
      invalidNumber.content.geometricAndFieldConventions.mass = number;
      expect(() =>
        canonicalNhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionJson(
          invalidNumber,
        ),
      ).toThrowError(new TypeError(violation));
    }
  });

  it("records exact versioned primary sources and eight remote audit artifacts without byte authority", () => {
    const audit =
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION.content
        .primarySourceAudit;
    expect(
      audit.sources.map(({ sourceVersion, abstractUrl, equationAnchors }) => ({
        sourceVersion,
        abstractUrl,
        equationAnchors,
      })),
    ).toEqual([
      {
        sourceVersion: "arXiv:gr-qc/0109048v2",
        abstractUrl: "https://arxiv.org/abs/gr-qc/0109048v2",
        equationAnchors: [
          "2-3",
          "6",
          "9-10",
          "12-23",
          "44-45",
          "47",
          "52",
          "55-60",
        ],
      },
      {
        sourceVersion: "arXiv:1202.5107v2",
        abstractUrl: "https://arxiv.org/abs/1202.5107v2",
        equationAnchors: ["2", "5-9", "Lemma_3", "Theorem_4"],
      },
      {
        sourceVersion: "arXiv:gr-qc/0512118v2",
        abstractUrl: "https://arxiv.org/abs/gr-qc/0512118v2",
        equationAnchors: [
          "2-5",
          "21",
          "23",
          "25",
          "61",
          "70",
          "109",
          "111",
          "136-144",
        ],
      },
      {
        sourceVersion: "arXiv:1407.3907v1",
        abstractUrl: "https://arxiv.org/abs/1407.3907v1",
        equationAnchors: ["1", "6"],
      },
    ]);
    const artifacts: readonly any[] = audit.sources.flatMap((source) =>
      Array.from(source.observedRemoteArtifacts as readonly any[]),
    );
    expect(
      artifacts.map(({ format, sha256, sizeBytes }) => ({
        format,
        sha256,
        sizeBytes,
      })),
    ).toEqual([
      {
        format: "pdf",
        sha256:
          "fb2b3117f435e2a9bfbd85e1761883790ad33bee966b1c35c29ec7c81f57d5c4",
        sizeBytes: 368678,
      },
      {
        format: "e-print",
        sha256:
          "f28fb4b058978cf95817bc22326dc6e1d41267608f1880cf0773f81fc142425f",
        sizeBytes: 38039,
      },
      {
        format: "pdf",
        sha256:
          "93c890f03ac3268b09de2f305d3f36465fa5c48cc717f7d02ff891ee6b640c69",
        sizeBytes: 301586,
      },
      {
        format: "e-print",
        sha256:
          "23cf491c73cfbfd9bd6c4852b29e479fdec1d05fcff1857d6e745b28747b792f",
        sizeBytes: 25840,
      },
      {
        format: "pdf",
        sha256:
          "676f41aac1dcff7f622ac147936e58e5e2ff60939a9688043d1657b92db29977",
        sizeBytes: 448374,
      },
      {
        format: "e-print",
        sha256:
          "878e9c9dc98497c49a803fba2d9f401a92b7d650b4f6be1579f3281aca91405b",
        sizeBytes: 42585,
      },
      {
        format: "pdf",
        sha256:
          "ee3cccfc3c3c3476032afa2aa6a1b356e3d993e51a44eb1704947c8dbb2dfac6",
        sizeBytes: 164590,
      },
      {
        format: "e-print",
        sha256:
          "a6aadd6363c4105c2571ddae2e889d4056dfc249da4f0f2fdc48e9a05905443f",
        sizeBytes: 11844,
      },
    ]);
    for (const artifact of artifacts) {
      expect(artifact).toMatchObject({
        observedOn: "2026-08-12",
        remoteObservationAuditOnly: true,
        localRepoPath: null,
        localBytesVendored: false,
        localHashVerified: false,
        authoritativeSourceBytes: false,
        authorizesFormulaExecution: false,
      });
    }
    expect(audit).toMatchObject({
      localSourceArtifactSet: null,
      localVendoringComplete: false,
      localHashVerificationComplete: false,
      primarySourceByteBindingsComplete: false,
      sourceAuditAloneAuthorizesExecution: false,
    });
  });

  it("freezes the Wightman, symmetric, Hadamard, and smooth-remainder relative normalizations", () => {
    const normalization =
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION.content
        .twoPointAndHadamardNormalization;
    expect(normalization).toMatchObject({
      wightmanDefinition: "W_plus(x,y)=omega(phi(x)*phi(y))",
      symmetricKernelDefinition:
        "S(x,y)=(1/2)*(W_plus(x,y)+W_plus(y,x))=Re(W_plus(x,y))",
      anticommutatorRelation: "omega({phi(x),phi(y)})=2*S(x,y)",
      morettiG1Relation: "G_Moretti^(1)=S=Re(W_plus)",
      morettiG1IsFullAnticommutator: false,
      relativeFactorAmbiguous: false,
      sigmaEpsilon:
        "sigma_epsilon=sigma+2*i*epsilon*(T(x)-T(y))+epsilon^2_with_epsilon_down_to_0_positive",
      wightmanParametrix:
        "H_plus_ell=lim_(epsilon_down_to_0)[1/(8*pi^2)]*[u/sigma_epsilon+sum_(n>=0)(v_n*sigma^n*log(sigma_epsilon/ell^2))]",
      symmetricParametrix:
        "H_S_ell(x,y)=(1/2)*(H_plus_ell(x,y)+H_plus_ell(y,x))=Re(H_plus_ell(x,y))",
      smoothSymmetricRemainder: "K_ell=S-H_S_ell",
      decaniniFolacciRemainderRelation:
        "K_ell=W_DF/(8*pi^2)_where_W_DF_is_the_smooth_Hadamard_coefficient_in_DF_Eq70",
      uCoincidenceNormalization: "[u]=1",
      operatorActsOnRemainderBeforeCoincidence: true,
    });
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION.content
        .hadamardRecurrences,
    ).toEqual({
      recurrenceDomain: "geodesically_convex_neighborhood",
      uTransport: "2*u_;mu*sigma^;mu+(Box_x(sigma)-4)*u=0_with_[u]=1",
      v0Transport: "-P_x(u)+2*v0_;mu*sigma^;mu+(Box_x(sigma)-2)*v0=0",
      vnTransport:
        "-P_x(v_n)+2*(n+1)*v_(n+1);mu*sigma^;mu+((n+1)*Box_x(sigma)+2*n*(n+1))*v_(n+1)=0_for_n>=0",
      recurrencesAreFormulaSpecificationOnly: true,
      executableRecurrenceImplementationPresent: false,
    });
  });

  it("freezes the conserved one-third correction and the mutually exclusive DF cross-check", () => {
    const content =
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION.content;
    expect(content.morettiConservedPointSplitPrescription).toMatchObject({
      canonicalOperator:
        "Dcan_ab=(2/3)*g_b^{b'}*nabla_a*nabla_{b'}-(1/3)*nabla_a*nabla_b+(1/6)*G_ab+g_ab*((1/3)*Box_x-(1/6)*g^{rho rho'}*nabla_rho*nabla_{rho'})",
      correctionFamily: "D^(eta)_ab=Dcan_ab+eta*g_ab*P_x",
      dimensionFormula: "eta_D=D/(2*(D+2))",
      dimension: 4,
      etaNumerator: 1,
      etaDenominator: 3,
      conservedOperator: "D^(1/3)_ab=Dcan_ab+(1/3)*g_ab*P_x",
      meanFormula: "<T_ab>_ell=[D^(1/3)_ab*K_ell]+Theta_ab",
      conservationIdentity: "nabla^a(<T_ab>_ell)=0",
    });
    expect(content.decaniniFolacciIndependentCrosscheck).toEqual({
      canonicalPointSplitOperator:
        "T0_ab=(2/3)*g_b^{b'}*nabla_a*nabla_{b'}-(1/6)*g_ab*g^{c d'}*nabla_c*nabla_{d'}-(1/3)*g_a^{a'}*g_b^{b'}*nabla_{a'}*nabla_{b'}+(1/3)*g_ab*Box_x+(1/6)*G_ab",
      v1: "v1=(1/720)*(Box(R)-R_cd*R^cd+R_cdef*R^cdef)",
      meanFormula: "<T_ab>_ell=[T0_ab*K_ell]+(1/(4*pi^2))*g_ab*v1+Theta_ab",
      pkCoincidenceIdentity: "[P_x*K_ell]=(3/(4*pi^2))*v1",
      exactEquivalence: "[D^(1/3)_ab*K_ell]=[T0_ab*K_ell]+(1/(4*pi^2))*g_ab*v1",
      crosscheckStatus: "formula_level_cross_source_identity_not_executed",
      noDoubleCountRule:
        "use_either_the_improved_D^(1/3)_formula_or_the_DF_T0_plus_explicit_g_ab_v1_formula_never_add_explicit_g_ab_v1_to_D^(1/3)",
      explicitV1TermAddedToImprovedOperator: false,
      cumulativeUseOfBothPrescriptionsAllowed: false,
    });
  });

  it("freezes the positive anomaly, H1/H2/H3 basis, Gauss-Bonnet identity, and zero-coefficient project choice", () => {
    const content =
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION.content;
    expect(content.traceAnomaly).toMatchObject({
      generalFourDimensional:
        "<T^a_a>=(1/(2880*pi^2))*(Box(R)-R_ab*R^ab+R_abcd*R^abcd)",
      conformallyFlatCurvatureIdentity: "R_abcd*R^abcd=2*R_ab*R^ab-(1/3)*R^2",
      conformallyFlat: "<T^a_a>=(1/(2880*pi^2))*(Box(R)+R_ab*R^ab-(1/3)*R^2)",
      anomalySign: "positive_v1_over_4_pi_squared",
      boxRCoefficientSchemeDependent: true,
    });
    expect(content.finiteWaldAmbiguity).toMatchObject({
      H1: {
        formula:
          "H1_ab=2*nabla_a*nabla_b(R)-2*R*R_ab+g_ab*(-2*Box(R)+(1/2)*R^2)",
      },
      H2: {
        formula:
          "H2_ab=nabla_a*nabla_b(R)-Box(R_ab)-2*R^cd*R_cadb+g_ab*(-(1/2)*Box(R)+(1/2)*R_cd*R^cd)",
      },
      H3: {
        formula:
          "H3_ab=2*nabla_a*nabla_b(R)-4*Box(R_ab)+4*R_a^c*R_cb-4*R^cd*R_cadb-2*R_a^cde*R_bcde+(1/2)*g_ab*R_cdef*R^cdef",
      },
      gaussBonnetIdentity: "H1_ab-4*H2_ab+H3_ab=0_in_four_dimensions",
      generalMasslessAmbiguity: "Theta_ab=C1*H1_ab+C2*H2_ab+C3*H3_ab",
      ambiguityTrace: "g^ab*Theta_ab=(-6*C1-2*C2-2*C3)*Box(R)",
      projectChoice: {
        choiceKind: "project_renormalization_choice_not_source_fact",
        referenceLength: { symbol: "ell", value: 1, unit: "m", exact: true },
        gaussBonnetEliminatedTensor: "H3",
        cosmologicalCountertermCoefficient: 0,
        newtonCountertermCoefficient: 0,
        C1: 0,
        C2: 0,
        C3: 0,
        thetaFormulaAtReferenceLength: "Theta_ab=0",
        boxRScheme:
          "Decanini_Folacci_v2_Eq111_unshifted_plus_BoxR_coefficient_at_ell_1_m",
        unnamedFiniteCountertermsAllowed: false,
        zeroMeaning:
          "chosen_finite_renormalization_convention_not_absence_of_Wald_ambiguity",
      },
    });
    expect(content.upstreamCompatibilityLedger).toMatchObject({
      scalarReferenceIFormulaSignMismatch:
        "the_current_I_candidate_is_minus_H1_relative_to_its_declared_inverse_metric_functional_derivative",
      frozenOverlayBasis: "H1_H2_with_H3_eliminated_by_Gauss_Bonnet",
      upstreamFilesMutatedByThisConvention: false,
      additiveOverlayOnly: true,
    });
  });

  it("freezes the conformal state map, compact smearing, SI restoration, and connected-noise boundary", () => {
    const content =
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION.content;
    expect(content.conformalStateMapping).toMatchObject({
      geometryRelation: "g=F^*(Omega^2*eta)_with_Omega_strictly_positive",
      scalarFieldConformalWeight: "phi_g(x)=Omega(F(x))^(-1)*phi_eta(F(x))",
      minkowskiWightman:
        "W0_plus(X,Y)=lim_(epsilon_down_to_0)[1/(4*pi^2)]*[-(Delta_X0-i*epsilon)^2+abs(Delta_X_vector)^2]^(-1)",
      curvedWightman:
        "Wg_plus(x,y)=Omega(F(x))^(-1)*Omega(F(y))^(-1)*W0_plus(F(x),F(y))",
      mappingDefinesState: true,
      dynamicalPreparationClaim: false,
      empiricalStateReceipt: false,
      physicalRealizationClaim: false,
    });
    expect(content.compactSmoothSmearingAndUnits).toMatchObject({
      testFunctionSpace: "C_c^infinity(M,real)",
      smearingId: "normalized_C_infinity_spacetime_product_bumps_v1",
      physicalTestFunction: "f_n=F^*(bar_f_n)",
      componentSmearing:
        "<T_hatAhatB[f]>=integral_M(dmu_g*f*e_hatA^a*e_hatB^b*<T_ab>)",
      pointValueSubstitutionAllowed: false,
      centerValueSubstitutionAllowed: false,
      meanSiRestoration:
        "multiply_final_geometric_unit_tetrad_components_by_hbar*c_to_obtain_J_per_m^3",
    });
    expect(content.connectedNoiseBoundary).toEqual({
      definitionUnchanged:
        "N_project=(1/2)*omega(anticommutator(t,t))_with_t=T-omega(T)*1",
      projectToPhillipsHuRelationUnchanged: "N_project=4*N_PH",
      cNumberRenormalizationShiftCancelsOnlyAfterCentering: true,
      meanLocalTermsMayBeDroppedBecauseNoiseIsConnected: false,
      thisConventionSelectsConnectedNoiseExecution: false,
    });
  });

  it("records all four consequential source defects as non-executable resolutions", () => {
    const defects =
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION.content
        .sourceDefectLedger;
    expect(defects.map(({ defectId }) => defectId)).toEqual([
      "moretti_v2_equation_10_eta_bracket_placement",
      "moretti_v2_equations_44_45_curvature_terms",
      "hack_moretti_v2_equation_9_parametrix_prefactor",
      "hack_moretti_v2_theorem_4_trace_sign",
    ]);
    for (const defect of defects) {
      expect(defect.literalSourceTranscriptionAllowed).toBe(false);
      expect(defect.executableResolutionImplemented).toBe(false);
    }
  });

  it("keeps every execution gap null or false and every authority, lamp, ADM, physical, propulsion, transport, and certificate lock false", () => {
    const contract =
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION;
    for (const entry of Object.values(
      contract.content.unresolvedExecutionFreeze,
    )) {
      expect([null, false]).toContain(entry);
    }
    expect(
      Object.values(
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_AUTHORITY_LOCKS,
      ),
    ).not.toContain(true);
    expect(
      Object.values(
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CLAIM_LOCKS,
      ),
    ).not.toContain(true);
    expect(contract.content.authority.blockers).toEqual(
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_BLOCKERS,
    );

    for (const key of Object.keys(
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_AUTHORITY_LOCKS,
    )) {
      const value = clone();
      value.content.authority.locks[key] = true;
      expect(
        nhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionViolations(
          value,
        ),
        key,
      ).toContain("authority_must_remain_blocked");
    }
    for (const key of Object.keys(
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CLAIM_LOCKS,
    )) {
      const value = clone();
      value.content.claimLocks[key] = true;
      expect(
        nhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionViolations(
          value,
        ),
        key,
      ).toContain("claim_locks_must_remain_false");
    }
  });

  it("rejects exact-key additions and omissions at nested boundaries", () => {
    const extra = clone();
    extra.content.traceAnomaly.certified = true;
    expect(
      nhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionViolations(
        extra,
      ),
    ).toContain("extra_key:/content/traceAnomaly/certified");

    const missing = clone();
    delete missing.content.finiteWaldAmbiguity.projectChoice.C2;
    expect(
      nhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionViolations(
        missing,
      ),
    ).toContain("missing_key:/content/finiteWaldAmbiguity/projectChoice/C2");
  });

  it("rejects root and nested proxies before invoking any proxy trap", () => {
    let trapCalls = 0;
    const rootProxy = new Proxy(clone(), {
      get: () => {
        trapCalls += 1;
        throw new Error("proxy_get_must_not_run");
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
      nhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionViolations(
        rootProxy,
      ),
    ).toEqual(["proxy_forbidden:/"]);
    expect(trapCalls).toBe(0);

    const nested = clone();
    nested.content.traceAnomaly = new Proxy(nested.content.traceAnomaly, {
      ownKeys: () => {
        trapCalls += 1;
        throw new Error("nested_proxy_ownKeys_must_not_run");
      },
    });
    expect(
      nhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionViolations(
        nested,
      ),
    ).toEqual(["proxy_forbidden:/content/traceAnomaly"]);
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
        return "blocked_semantic_convention_frozen_execution_unavailable";
      },
    });
    expect(
      nhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionViolations(
        accessor,
      ),
    ).toEqual(["accessor_or_hidden_property_forbidden:/content/status"]);
    expect(getterCalls).toBe(0);

    const arrayAccessor = clone();
    Object.defineProperty(
      arrayAccessor.content.primarySourceAudit.sources,
      "0",
      {
        configurable: true,
        enumerable: true,
        get: () => {
          getterCalls += 1;
          return {};
        },
      },
    );
    expect(
      nhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionViolations(
        arrayAccessor,
      ),
    ).toEqual([
      "accessor_sparse_or_hidden_array_entry:/content/primarySourceAudit/sources/0",
    ]);
    expect(getterCalls).toBe(0);
  });

  it("rejects symbols plus own __proto__, prototype, and constructor keys at root, nested-object, object-array-entry, and array boundaries", () => {
    const symbol = clone();
    symbol.content[Symbol("hidden-authority")] = true;
    expect(
      nhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionViolations(
        symbol,
      ),
    ).toEqual(["symbol_key_forbidden:/content"]);

    const locations = [
      {
        label: "root",
        target: (value: any) => value,
        pointer: "",
      },
      {
        label: "nested",
        target: (value: any) => value.content.traceAnomaly,
        pointer: "/content/traceAnomaly",
      },
      {
        label: "array_entry",
        target: (value: any) => value.content.primarySourceAudit.sources[0],
        pointer: "/content/primarySourceAudit/sources/0",
      },
      {
        label: "array",
        target: (value: any) => value.content.primarySourceAudit.sources,
        pointer: "/content/primarySourceAudit/sources",
      },
    ] as const;
    for (const location of locations) {
      for (const key of ["__proto__", "prototype", "constructor"] as const) {
        const value = clone();
        defineHostileKey(location.target(value), key);
        expect(
          nhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionViolations(
            value,
          ),
          `${location.label}:${key}`,
        ).toEqual([`forbidden_data_key:${location.pointer}/${key}`]);
      }
    }
  });

  it("rejects array extra keys, sparse entries, non-plain containers, cycles, nonfinite numbers, and negative zero", () => {
    const extraArrayKey = clone();
    Object.defineProperty(
      extraArrayKey.content.primarySourceAudit.sources,
      "4294967295",
      {
        configurable: true,
        enumerable: true,
        value: "hidden",
        writable: true,
      },
    );
    expect(
      nhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionViolations(
        extraArrayKey,
      ),
    ).toEqual(["array_keys_invalid:/content/primarySourceAudit/sources"]);

    const sparse = clone();
    delete sparse.content.primarySourceAudit.sources[0];
    expect(
      nhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionViolations(
        sparse,
      ),
    ).toEqual(["array_keys_invalid:/content/primarySourceAudit/sources"]);

    const inherited = Object.assign(
      Object.create({ authority: true }),
      clone(),
    );
    expect(
      nhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionViolations(
        inherited,
      ),
    ).toEqual(["non_plain_object:/"]);

    const cyclic = clone();
    cyclic.content.loop = cyclic.content;
    expect(
      nhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionViolations(
        cyclic,
      ),
    ).toEqual(["cycle_forbidden:/content/loop"]);

    for (const [entry, expected] of [
      [
        Number.NaN,
        "nonfinite_number:/content/geometricAndFieldConventions/mass",
      ],
      [
        Number.POSITIVE_INFINITY,
        "nonfinite_number:/content/geometricAndFieldConventions/mass",
      ],
      [
        Number.NEGATIVE_INFINITY,
        "nonfinite_number:/content/geometricAndFieldConventions/mass",
      ],
      [-0, "negative_zero:/content/geometricAndFieldConventions/mass"],
    ] as const) {
      const value = clone();
      value.content.geometricAndFieldConventions.mass = entry;
      expect(
        nhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionViolations(
          value,
        ),
      ).toEqual([expected]);
    }
  });

  it("rejects attempts to authorize remote hashes, double-count v1, alter the finite scheme, fill execution gaps, or unlock execution", () => {
    const sourceAuthority = clone();
    const artifact =
      sourceAuthority.content.primarySourceAudit.sources[0]
        .observedRemoteArtifacts[0];
    artifact.localRepoPath = "forged/source.pdf";
    artifact.localBytesVendored = true;
    artifact.localHashVerified = true;
    artifact.authoritativeSourceBytes = true;
    artifact.authorizesFormulaExecution = true;
    expect(
      nhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionViolations(
        sourceAuthority,
      ),
    ).toContain("source_artifacts_must_remain_remote_audit_only");

    const doubleCount = clone();
    doubleCount.content.decaniniFolacciIndependentCrosscheck.explicitV1TermAddedToImprovedOperator = true;
    doubleCount.content.decaniniFolacciIndependentCrosscheck.cumulativeUseOfBothPrescriptionsAllowed = true;
    expect(
      nhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionViolations(
        doubleCount,
      ),
    ).toContain("conserved_operator_or_no_double_count_rule_invalid");

    const finite = clone();
    finite.content.finiteWaldAmbiguity.projectChoice.C1 = 1;
    expect(
      nhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionViolations(
        finite,
      ),
    ).toContain("finite_renormalization_choice_invalid");

    const execute = clone();
    execute.content.unresolvedExecutionFreeze.formulaTranscriptionImplementation =
      "forged_executor";
    execute.content.executionAdmissible = true;
    execute.content.authorityIssuanceAllowed = true;
    expect(
      nhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionViolations(
        execute,
      ),
    ).toEqual(
      expect.arrayContaining([
        "execution_gaps_must_remain_null_or_false",
        "execution_and_authority_issuance_must_remain_blocked",
      ]),
    );
  });
});
