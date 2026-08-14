import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import { NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING } from "../shared/contracts/nhm2-spherical-boson-star-newtonian-seed.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-candidate-freeze.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BINDING_ARTIFACT_ID,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BINDING_CONTRACT_VERSION,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BINDING_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_AUTHORITY_LOCKS,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_CANONICAL_JSON,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_EXPECTED_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_PAYLOADS,
  computeNhm2SphericalBosonStarV2InitializerBindingSha256,
  isNhm2SphericalBosonStarV2InitializerBridge,
  nhm2SphericalBosonStarV2InitializerBindingViolations,
  nhm2SphericalBosonStarV2InitializerBridgeViolations,
  type Nhm2SphericalBosonStarV2InitializerPayloadBindingV1,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-initializer-bridge.v1";

const SOURCE_INPUT_SHA256 = "11".repeat(32);
const SOURCE_PROOF_SHA256 = "22".repeat(32);
const payloads = NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_PAYLOADS.map(
  (entry, index) => ({
    ...entry,
    rawSha256: (index + 3).toString(16).padStart(2, "0").repeat(32),
  }),
) as unknown as readonly Nhm2SphericalBosonStarV2InitializerPayloadBindingV1[];

const u64le = (value: number): Buffer => {
  const result = Buffer.alloc(8);
  result.writeBigUInt64LE(BigInt(value));
  return result;
};

const independentInitializerHash = (): string => {
  const hash = createHash("sha256")
    .update(NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BINDING_SHA256_DOMAIN)
    .update(
      Buffer.from(
        NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_SHA256,
        "hex",
      ),
    )
    .update(
      Buffer.from(
        NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING.sha256,
        "hex",
      ),
    )
    .update(Buffer.from(SOURCE_INPUT_SHA256, "hex"))
    .update(Buffer.from(SOURCE_PROOF_SHA256, "hex"))
    .update(u64le(payloads.length));
  for (const payload of payloads) {
    const path = Buffer.from(payload.path, "utf8");
    hash
      .update(u64le(path.length))
      .update(path)
      .update(u64le(payload.sizeBytes))
      .update(Buffer.from(payload.rawSha256, "hex"));
  }
  return hash.digest("hex");
};

const validBinding = () => {
  const initializerBindingSha256 =
    computeNhm2SphericalBosonStarV2InitializerBindingSha256(
      SOURCE_INPUT_SHA256,
      SOURCE_PROOF_SHA256,
      payloads,
    );
  return {
    artifactId: NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BINDING_ARTIFACT_ID,
    attemptOrdinal: 1,
    authorityFalse: true,
    claimLocks: {
      ...NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_AUTHORITY_LOCKS,
    },
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BINDING_CONTRACT_VERSION,
    initializerBindingSha256,
    orderedPayloadBindings: payloads.map((entry) => ({ ...entry })),
    sourceCandidateId:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING.candidateId,
    sourceInputBindingSha256: SOURCE_INPUT_SHA256,
    sourceProofConclusion:
      "all_directed_duties_passed_without_seed_or_solution_authority",
    sourceProofSummaryRawSha256: SOURCE_PROOF_SHA256,
    targetCandidateId:
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
  };
};

const clonePolicy = (): any =>
  JSON.parse(NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_CANONICAL_JSON);

describe("NHM2 spherical boson-star v2 initializer bridge v1", () => {
  it("is self-sealed and accepts only the frozen policy singleton", () => {
    expect(NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_SHA256).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_EXPECTED_SHA256,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_CANONICAL_SIZE_BYTES,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_EXPECTED_CANONICAL_SIZE_BYTES,
    );
    expect(
      Buffer.byteLength(
        NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_CANONICAL_JSON,
      ),
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_CANONICAL_SIZE_BYTES,
    );
    expect(
      isNhm2SphericalBosonStarV2InitializerBridge(
        NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE,
      ),
    ).toBe(true);
    expect(
      nhm2SphericalBosonStarV2InitializerBridgeViolations(
        NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE,
      ),
    ).toEqual([]);
    expect(
      nhm2SphericalBosonStarV2InitializerBridgeViolations(clonePolicy()),
    ).toEqual(["initializer_bridge_external_copy_not_authoritative"]);
  });

  it("bridges v3-named evidence only into a distinct v2 initializer", () => {
    const policy = NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE;
    expect(policy.sourceCandidateId).toBe(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING.candidateId,
    );
    expect(policy.targetCandidateId).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
    );
    expect(policy.sourceCandidateId).not.toBe(policy.targetCandidateId);
    expect(policy.candidateIdentityRule).toMatchObject({
      sourceIdentityMayAppearOnlyInEvidenceBindings: true,
      automaticV3UpgradeAllowed: false,
      v3CandidateManifestPresealRuntimeReceiptOrReplayMayBeInherited: false,
    });
    expect(policy.initializerSemantics).toMatchObject({
      exactScaling: "lambda=2^-5",
      varphiInit: "varphi_init(x)=u_star(x)",
      F0Init: "F0_init(x)=V_star(x)",
      F1Init: "F1_init(x)=-V_star(x)",
      wInit: "w_init=sqrt(1+2*nu_star)",
      relativisticBvpMustResolveFrequencyAgain: true,
    });
    expect(policy.toleranceBoundary).toMatchObject({
      sourceV3NamedToleranceArtifactHasV2Authority: false,
      approvedV2ReplayPolicyIsSoleSemiclassicalReplayToleranceAuthority: true,
      bridgeMayRelaxChangeOrSelectV2Thresholds: false,
    });
    expect(
      Object.values(policy.authorityLocks).every((value) => value === false),
    ).toBe(true);
  });

  it("binds exactly five raw payloads with an independently reproduced digest", () => {
    expect(NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_PAYLOADS).toEqual([
      { path: "scalars.f64le", sizeBytes: 72 },
      { path: "coefficients/core_L2_u.f64le", sizeBytes: 1024 },
      { path: "coefficients/core_L2_V.f64le", sizeBytes: 1024 },
      { path: "coefficients/tail_H.f64le", sizeBytes: 256 },
      { path: "coefficients/tail_Q.f64le", sizeBytes: 256 },
    ]);
    expect(
      computeNhm2SphericalBosonStarV2InitializerBindingSha256(
        SOURCE_INPUT_SHA256,
        SOURCE_PROOF_SHA256,
        payloads,
      ),
    ).toBe(independentInitializerHash());
    expect(
      nhm2SphericalBosonStarV2InitializerBindingViolations(validBinding()),
    ).toEqual([]);
  });

  it("rejects candidate, payload, authority and digest substitution", () => {
    const candidate = validBinding() as any;
    candidate.targetCandidateId = candidate.sourceCandidateId;
    expect(
      nhm2SphericalBosonStarV2InitializerBindingViolations(candidate),
    ).not.toEqual([]);

    const payload = validBinding() as any;
    payload.orderedPayloadBindings[0].sizeBytes = 80;
    expect(
      nhm2SphericalBosonStarV2InitializerBindingViolations(payload),
    ).not.toEqual([]);

    const authority = validBinding() as any;
    authority.claimLocks.candidateAuthority = true;
    expect(
      nhm2SphericalBosonStarV2InitializerBindingViolations(authority),
    ).not.toEqual([]);

    const digest = validBinding() as any;
    digest.initializerBindingSha256 = "ff".repeat(32);
    expect(
      nhm2SphericalBosonStarV2InitializerBindingViolations(digest),
    ).toEqual(["initializer_binding_sha256_mismatch"]);
  });

  it("rejects hostile proxy, accessor, symbol, sparse and cyclic surfaces", () => {
    let traps = 0;
    const proxy = new Proxy(validBinding(), {
      ownKeys() {
        traps += 1;
        throw new Error("must not execute");
      },
    });
    expect(
      nhm2SphericalBosonStarV2InitializerBindingViolations(proxy)[0],
    ).toContain("surface");
    expect(traps).toBe(0);

    const accessor = validBinding() as any;
    Object.defineProperty(accessor, "candidateId", {
      enumerable: true,
      get() {
        traps += 1;
        throw new Error("must not execute");
      },
    });
    expect(
      nhm2SphericalBosonStarV2InitializerBindingViolations(accessor)[0],
    ).toContain("property");
    expect(traps).toBe(0);

    const symbol = validBinding() as Record<PropertyKey, unknown>;
    symbol[Symbol("hidden")] = true;
    expect(
      nhm2SphericalBosonStarV2InitializerBindingViolations(symbol)[0],
    ).toContain("object");

    const sparse = validBinding() as any;
    sparse.orderedPayloadBindings = new Array(5);
    expect(
      nhm2SphericalBosonStarV2InitializerBindingViolations(sparse)[0],
    ).toContain("array");

    const cycle = validBinding() as any;
    cycle.self = cycle;
    expect(
      nhm2SphericalBosonStarV2InitializerBindingViolations(cycle)[0],
    ).toContain("cycle");
  });
});
