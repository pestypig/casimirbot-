import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-candidate-freeze.v1";
import {
  computeNhm2SphericalBosonStarV2CommandArgvSha256,
  computeNhm2SphericalBosonStarV2OutputRootSetIdentitySha256,
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_BINDING,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-preexecution-profile.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_OUTPUT_SKELETON_ARTIFACT_ID,
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_OUTPUT_SKELETON_CONTRACT_VERSION,
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_CENTRAL_LEVEL2_LOGICAL_ALIASES,
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_PHYSICAL_FILE_DESCRIPTORS,
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA,
  NHM2_SPHERICAL_BOSON_STAR_V2_SUCCESSOR_RAW_REPLAY_MANIFEST_ARTIFACT_ID,
  NHM2_SPHERICAL_BOSON_STAR_V2_SUCCESSOR_RAW_REPLAY_MANIFEST_CONTRACT_VERSION,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-raw-replay-schema.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_POSTRUN_WIRE_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_CLAIM_LOCKS,
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_INCOMPLETENESS_BLOCKERS,
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_NUMERICAL_POLICY_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE,
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_CANONICAL_JSON,
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_EXPECTED_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_WIRE_SHA256_DOMAIN,
  computeNhm2SphericalBosonStarV2CanonicalCommandDisplay,
  nhm2SphericalBosonStarV2PostrunWireViolations,
  nhm2SphericalBosonStarV2RunArtifactCanonicalJson,
  nhm2SphericalBosonStarV2RunArtifactPairViolations,
  nhm2SphericalBosonStarV2SkeletonWireViolations,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-run-artifact-wire.v1";

const sha = "1".repeat(64);
const sourceProvenance = {
  sourceMode:
    NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA.provenanceSchema
      .sourceProvenance.sourceMode,
  meanRsetOrigin:
    NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA.provenanceSchema
      .sourceProvenance.meanRsetOrigin,
  noiseKernelOrigin:
    NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA.provenanceSchema
      .sourceProvenance.noiseKernelOrigin,
  declaredLeverTensorUsed:
    NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA.provenanceSchema
      .sourceProvenance.declaredLeverTensorUsed,
  inputClosureExcludesDeclaredLeverTensor:
    NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA.provenanceSchema
      .sourceProvenance.inputClosureExcludesDeclaredLeverTensor,
};
const candidate = {
  candidateId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
  candidateFreezeBinding: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
};
const implementation = {
  primary: {
    role: "primary",
    path: "tools/v2-primary/main.mjs",
    sha256: "2".repeat(64),
    sizeBytes: 1024,
    mediaType: "text/plain",
  },
  independent: {
    role: "independent",
    path: "tools/v2-independent/main.mjs",
    sha256: "3".repeat(64),
    sizeBytes: 2048,
    mediaType: "text/plain",
  },
};
const argv = ["node", "primary.mjs", "--frozen"] as const;
const outputRootObservations = [
  {
    role: "primary",
    absolutePath: "/srv/nhm2/output",
    observedAbsent: true,
  },
  {
    role: "independent",
    absolutePath: "/srv/nhm2/independent-output",
    observedAbsent: true,
  },
] as const;
const staticInputClosure = {
  preexecutionProfileBinding:
    NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_BINDING,
  commandArgvSha256: computeNhm2SphericalBosonStarV2CommandArgvSha256(argv),
  staticInputAggregateSha256: sha,
  freshnessInventorySha256: sha,
  dirtyTreeSha256: sha,
  runtimeClosureSha256: sha,
  outputRootObservations,
  outputRootSha256: computeNhm2SphericalBosonStarV2OutputRootSetIdentitySha256(
    outputRootObservations,
  ),
};

const skeleton = {
  artifactId:
    NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_OUTPUT_SKELETON_ARTIFACT_ID,
  contractVersion:
    NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_OUTPUT_SKELETON_CONTRACT_VERSION,
  skeletonFrozenAt: "2026-08-13T12:00:00.000000000Z",
  candidate,
  sourceProvenance,
  numericalPolicyBinding:
    NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_NUMERICAL_POLICY_BINDING,
  implementation,
  staticInputClosure,
  plannedPhysicalFiles:
    NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_PHYSICAL_FILE_DESCRIPTORS,
  centralLevel2LogicalAliases:
    NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_CENTRAL_LEVEL2_LOGICAL_ALIASES,
  claimLocks: NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_CLAIM_LOCKS,
};

const skeletonBytes = Buffer.from(
  nhm2SphericalBosonStarV2RunArtifactCanonicalJson(skeleton),
  "utf8",
);
const skeletonRawSha = createHash("sha256").update(skeletonBytes).digest("hex");
const skeletonWireSha = createHash("sha256")
  .update(NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_WIRE_SHA256_DOMAIN, "utf8")
  .update(skeletonBytes)
  .digest("hex");

const statFor = (sizeBytes: number, ordinal: number) => ({
  device: "1",
  inode: String(100 + ordinal),
  ownerUid: "1000",
  ownerGid: "1000",
  linkCount: "1",
  modeOctal: "0400",
  fileType: "regular",
  sizeBytes,
  modifyTimeNanoseconds: "1000000000",
  changeTimeNanoseconds: "1000000000",
});

const physicalFiles =
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_PHYSICAL_FILE_DESCRIPTORS.map(
    (descriptor, index) => {
      const stat = statFor(descriptor.sizeBytes, index);
      return {
        descriptor,
        absolutePath: descriptor.path.replace(
          "{outputDirectory}",
          "/srv/nhm2/output",
        ),
        sha256: createHash("sha256")
          .update(`physical-file-${index}`, "utf8")
          .digest("hex"),
        freshness: "new",
        observedAt: "2026-08-13T12:00:05.000000000Z",
        preexecutionAbsent: true,
        preexecutionAbsenceReceiptSha256: createHash("sha256")
          .update(`absence-${index}`, "utf8")
          .digest("hex"),
        postrunObservationReceiptSha256: createHash("sha256")
          .update(`observation-${index}`, "utf8")
          .digest("hex"),
        preReadStat: stat,
        postReadStat: { ...stat },
      };
    },
  );

const postrun = {
  artifactId:
    NHM2_SPHERICAL_BOSON_STAR_V2_SUCCESSOR_RAW_REPLAY_MANIFEST_ARTIFACT_ID,
  contractVersion:
    NHM2_SPHERICAL_BOSON_STAR_V2_SUCCESSOR_RAW_REPLAY_MANIFEST_CONTRACT_VERSION,
  generatedAt: "2026-08-13T12:00:06.000000000Z",
  preexecutionSkeletonBinding: {
    path: "/srv/nhm2/preexecution-output-skeleton.json",
    mediaType: "application/json",
    rawSha256: skeletonRawSha,
    wireSha256: skeletonWireSha,
    sizeBytes: skeletonBytes.length,
    persistedAt: "2026-08-13T12:00:01.000000000Z",
  },
  scientificPresealBinding: {
    path: "/srv/nhm2/scientific-preseal.json",
    mediaType: "application/json",
    rawSha256: "4".repeat(64),
    presealEnvelopeSha256: "5".repeat(64),
    sizeBytes: 4096,
    createdAt: "2026-08-13T12:00:02.000000000Z",
    persistedAt: "2026-08-13T12:00:03.000000000Z",
  },
  candidate,
  sourceProvenance,
  numericalPolicyBinding:
    NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_NUMERICAL_POLICY_BINDING,
  implementation,
  execution: {
    commitSha: "6".repeat(40),
    command: computeNhm2SphericalBosonStarV2CanonicalCommandDisplay(argv),
    argv,
    workingDirectory: "/srv/nhm2/source",
    outputDirectory: "/srv/nhm2/output",
    startedAt: "2026-08-13T12:00:04.000000000Z",
    completedAt: "2026-08-13T12:00:04.500000000Z",
    durationMs: 500,
    exitCode: 0,
    terminationSignal: null,
  },
  staticInputClosure,
  physicalFiles,
  centralLevel2LogicalAliases:
    NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_CENTRAL_LEVEL2_LOGICAL_ALIASES.map(
      (alias) => ({
        alias,
        canonicalSha256: physicalFiles[alias.canonicalFileOrdinal].sha256,
      }),
    ),
  claimLocks: NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_CLAIM_LOCKS,
};

const postrunBytes = Buffer.from(
  nhm2SphericalBosonStarV2RunArtifactCanonicalJson(postrun),
  "utf8",
);
const canonicalBytes = (value: unknown): Buffer =>
  Buffer.from(nhm2SphericalBosonStarV2RunArtifactCanonicalJson(value), "utf8");

describe("spherical v2 run artifact wire", () => {
  it("self-seals exact policy bytes", () => {
    expect(
      createHash("sha256")
        .update(
          NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_SHA256_DOMAIN,
          "utf8",
        )
        .update(
          NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_CANONICAL_JSON,
          "utf8",
        )
        .digest("hex"),
    ).toBe(NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_SHA256);
    expect(NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_SHA256).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_EXPECTED_SHA256,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_CANONICAL_SIZE_BYTES,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_EXPECTED_CANONICAL_SIZE_BYTES,
    );
  });

  it("accepts the exact structural wires while retaining typed provenance blockers", () => {
    expect(
      nhm2SphericalBosonStarV2SkeletonWireViolations(skeletonBytes),
    ).toEqual([]);
    expect(nhm2SphericalBosonStarV2PostrunWireViolations(postrunBytes)).toEqual(
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_INCOMPLETENESS_BLOCKERS,
    );
    expect(
      nhm2SphericalBosonStarV2RunArtifactPairViolations(
        skeletonBytes,
        postrunBytes,
      ),
    ).toEqual(
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_INCOMPLETENESS_BLOCKERS,
    );
  });

  it("uses exactly the five provenance data fields without schema metadata", () => {
    expect(Object.keys(sourceProvenance)).toEqual([
      "sourceMode",
      "meanRsetOrigin",
      "noiseKernelOrigin",
      "declaredLeverTensorUsed",
      "inputClosureExcludesDeclaredLeverTensor",
    ]);
    const metadataLeak = structuredClone(skeleton) as any;
    metadataLeak.sourceProvenance.exactFields = ["sourceMode"];
    expect(
      nhm2SphericalBosonStarV2SkeletonWireViolations(
        canonicalBytes(metadataLeak),
      ),
    ).toContain("skeleton_source_provenance_invalid");
  });

  it("binds exact inventory, aliases, chronology and byte hashes", () => {
    expect(skeleton.plannedPhysicalFiles).toHaveLength(68);
    expect(skeleton.centralLevel2LogicalAliases).toHaveLength(21);
    expect(
      physicalFiles.reduce((sum, entry) => sum + entry.descriptor.sizeBytes, 0),
    ).toBe(6_693_376);
    expect(
      createHash("sha256")
        .update(NHM2_SPHERICAL_BOSON_STAR_V2_POSTRUN_WIRE_SHA256_DOMAIN, "utf8")
        .update(postrunBytes)
        .digest("hex"),
    ).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rejects whitespace, BOM, noncanonical keys and foreign views", () => {
    expect(
      nhm2SphericalBosonStarV2SkeletonWireViolations(
        Buffer.from(`${skeletonBytes.toString("utf8")}\n`, "utf8"),
      ),
    ).toContain("wire_not_canonical");
    expect(
      nhm2SphericalBosonStarV2SkeletonWireViolations(
        Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), skeletonBytes]),
      ),
    ).toContain("wire_BOM_forbidden");
    const reordered = JSON.stringify(skeleton);
    expect(
      nhm2SphericalBosonStarV2SkeletonWireViolations(Buffer.from(reordered)),
    ).toContain("wire_not_canonical");
    expect(
      nhm2SphericalBosonStarV2SkeletonWireViolations(
        new Uint8Array(skeletonBytes),
      ),
    ).toContain("wire_exact_buffer_required");
  });

  it("is total on live and revoked Proxy-wrapped Buffers", () => {
    const live = new Proxy(skeletonBytes, {
      getPrototypeOf: () => {
        throw new Error("hostile_proxy_trap");
      },
    });
    expect(() =>
      nhm2SphericalBosonStarV2SkeletonWireViolations(live),
    ).not.toThrow();
    expect(nhm2SphericalBosonStarV2SkeletonWireViolations(live)).toEqual([
      "wire_exact_buffer_required",
    ]);

    const revoked = Proxy.revocable(skeletonBytes, {});
    revoked.revoke();
    expect(() =>
      nhm2SphericalBosonStarV2SkeletonWireViolations(revoked.proxy),
    ).not.toThrow();
    expect(
      nhm2SphericalBosonStarV2SkeletonWireViolations(revoked.proxy),
    ).toEqual(["wire_exact_buffer_required"]);
  });

  it("does not inspect postrun bytes after a skeleton parse failure", () => {
    const hostilePostrun = Buffer.from(postrunBytes);
    let postrunTouched = false;
    Object.defineProperty(hostilePostrun, "length", {
      configurable: true,
      get: () => {
        postrunTouched = true;
        throw new Error("postrun_must_not_be_parsed");
      },
    });
    expect(
      nhm2SphericalBosonStarV2RunArtifactPairViolations(
        Buffer.from("{", "utf8"),
        hostilePostrun,
      ),
    ).toEqual(["wire_JSON_invalid"]);
    expect(postrunTouched).toBe(false);
  });

  it("bounds canonicalization to exact plain dense acyclic data", () => {
    expect(() =>
      nhm2SphericalBosonStarV2RunArtifactCanonicalJson(new Array(1)),
    ).toThrow("run_artifact_wire_array_surface_invalid");
    expect(() =>
      nhm2SphericalBosonStarV2RunArtifactCanonicalJson(new Array(2)),
    ).toThrow("run_artifact_wire_array_surface_invalid");
    expect(() =>
      nhm2SphericalBosonStarV2RunArtifactCanonicalJson(new Date(0)),
    ).toThrow("run_artifact_wire_object_invalid");
    expect(() =>
      nhm2SphericalBosonStarV2RunArtifactCanonicalJson(new Proxy({}, {})),
    ).toThrow("run_artifact_wire_value_invalid");
    let getterCalled = false;
    const accessor = {} as Record<string, unknown>;
    Object.defineProperty(accessor, "value", {
      enumerable: true,
      get: () => {
        getterCalled = true;
        return 1;
      },
    });
    expect(() =>
      nhm2SphericalBosonStarV2RunArtifactCanonicalJson(accessor),
    ).toThrow("run_artifact_wire_object_entry_invalid");
    expect(getterCalled).toBe(false);
    expect(() =>
      nhm2SphericalBosonStarV2RunArtifactCanonicalJson(Array(513).fill(null)),
    ).toThrow("run_artifact_wire_array_invalid");
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(() =>
      nhm2SphericalBosonStarV2RunArtifactCanonicalJson(cyclic),
    ).toThrow("run_artifact_wire_cycle_invalid");
  });

  it("fails fast on array and aggregate node limits", () => {
    const tooLong = Buffer.from(JSON.stringify(Array(513).fill(null)), "utf8");
    expect(nhm2SphericalBosonStarV2SkeletonWireViolations(tooLong)).toEqual([
      "wire_array_length_exceeded",
    ]);

    const tooManyNodes = Buffer.from(
      JSON.stringify(
        Array.from({ length: 256 }, () => Array<number>(256).fill(0)),
      ),
      "utf8",
    );
    expect(
      nhm2SphericalBosonStarV2SkeletonWireViolations(tooManyNodes),
    ).toEqual(["wire_node_budget_exceeded"]);
  });

  it("rejects inventory, claim, freshness, stat and alias drift", () => {
    const inventoryDrift = structuredClone(skeleton) as any;
    inventoryDrift.plannedPhysicalFiles[0].sizeBytes += 8;
    expect(
      nhm2SphericalBosonStarV2SkeletonWireViolations(
        Buffer.from(
          nhm2SphericalBosonStarV2RunArtifactCanonicalJson(inventoryDrift),
        ),
      ),
    ).toContain("skeleton_physical_inventory_invalid");

    const claimDrift = structuredClone(postrun) as any;
    claimDrift.claimLocks.physicalViability = true;
    expect(
      nhm2SphericalBosonStarV2PostrunWireViolations(
        Buffer.from(
          nhm2SphericalBosonStarV2RunArtifactCanonicalJson(claimDrift),
        ),
      ),
    ).toContain("postrun_claim_locks_invalid");

    const freshnessDrift = structuredClone(postrun) as any;
    freshnessDrift.physicalFiles[0].freshness = "reused" as "new";
    expect(
      nhm2SphericalBosonStarV2PostrunWireViolations(
        Buffer.from(
          nhm2SphericalBosonStarV2RunArtifactCanonicalJson(freshnessDrift),
        ),
      ),
    ).toContain("postrun_physical_files_invalid");

    const aliasDrift = structuredClone(postrun) as any;
    aliasDrift.centralLevel2LogicalAliases[0].canonicalSha256 = "f".repeat(64);
    expect(
      nhm2SphericalBosonStarV2PostrunWireViolations(
        Buffer.from(
          nhm2SphericalBosonStarV2RunArtifactCanonicalJson(aliasDrift),
        ),
      ),
    ).toContain("postrun_aliases_invalid");
  });

  it("rejects skeleton binding and strict chronology drift", () => {
    const bindingDrift = structuredClone(postrun) as any;
    bindingDrift.preexecutionSkeletonBinding.rawSha256 = "f".repeat(64);
    expect(
      nhm2SphericalBosonStarV2RunArtifactPairViolations(
        skeletonBytes,
        Buffer.from(
          nhm2SphericalBosonStarV2RunArtifactCanonicalJson(bindingDrift),
        ),
      ),
    ).toContain("pair_skeleton_byte_binding_invalid");

    const chronologyDrift = structuredClone(postrun) as any;
    chronologyDrift.execution.startedAt = "2026-08-13T11:59:59.000000000Z";
    chronologyDrift.execution.completedAt = "2026-08-13T11:59:59.500000000Z";
    expect(
      nhm2SphericalBosonStarV2RunArtifactPairViolations(
        skeletonBytes,
        Buffer.from(
          nhm2SphericalBosonStarV2RunArtifactCanonicalJson(chronologyDrift),
        ),
      ),
    ).toContain("pair_chronology_invalid");
  });

  it("returns typed violations instead of throwing on malformed nested records", () => {
    for (const [field, malformedValue, expected] of [
      ["preexecutionSkeletonBinding", null, "postrun_skeleton_binding_invalid"],
      ["preexecutionSkeletonBinding", [], "postrun_skeleton_binding_invalid"],
      ["scientificPresealBinding", null, "postrun_preseal_binding_invalid"],
      ["scientificPresealBinding", {}, "postrun_preseal_binding_invalid"],
      ["execution", null, "postrun_execution_invalid"],
      ["execution", [], "postrun_execution_invalid"],
    ] as const) {
      const malformed = structuredClone(postrun) as any;
      malformed[field] = malformedValue;
      const malformedBytes = canonicalBytes(malformed);
      expect(() =>
        nhm2SphericalBosonStarV2RunArtifactPairViolations(
          skeletonBytes,
          malformedBytes,
        ),
      ).not.toThrow();
      expect(
        nhm2SphericalBosonStarV2RunArtifactPairViolations(
          skeletonBytes,
          malformedBytes,
        ),
      ).toContain(expected);
    }

    const nullAliasTarget = structuredClone(postrun) as any;
    const firstAliasOrdinal =
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_CENTRAL_LEVEL2_LOGICAL_ALIASES[0]
        .canonicalFileOrdinal;
    nullAliasTarget.physicalFiles[firstAliasOrdinal] = null;
    const nullAliasTargetBytes = canonicalBytes(nullAliasTarget);
    expect(() =>
      nhm2SphericalBosonStarV2RunArtifactPairViolations(
        skeletonBytes,
        nullAliasTargetBytes,
      ),
    ).not.toThrow();
    expect(
      nhm2SphericalBosonStarV2PostrunWireViolations(nullAliasTargetBytes),
    ).toEqual(
      expect.arrayContaining([
        "postrun_physical_files_invalid",
        "postrun_aliases_invalid",
      ]),
    );
  });

  it("rejects zero placeholder dependency, implementation and run hashes", () => {
    const zero = "0".repeat(64);

    const zeroClosure = structuredClone(skeleton) as any;
    for (const field of [
      "commandArgvSha256",
      "staticInputAggregateSha256",
      "freshnessInventorySha256",
      "dirtyTreeSha256",
      "runtimeClosureSha256",
      "outputRootSha256",
    ])
      zeroClosure.staticInputClosure[field] = zero;
    expect(
      nhm2SphericalBosonStarV2SkeletonWireViolations(
        canonicalBytes(zeroClosure),
      ),
    ).toContain("skeleton_static_closure_invalid");

    const zeroImplementation = structuredClone(skeleton) as any;
    zeroImplementation.implementation.primary.sha256 = zero;
    expect(
      nhm2SphericalBosonStarV2SkeletonWireViolations(
        canonicalBytes(zeroImplementation),
      ),
    ).toContain("skeleton_implementation_invalid");

    const zeroPostrun = structuredClone(postrun) as any;
    zeroPostrun.execution.commitSha = "0".repeat(40);
    zeroPostrun.preexecutionSkeletonBinding.rawSha256 = zero;
    zeroPostrun.preexecutionSkeletonBinding.wireSha256 = zero;
    zeroPostrun.scientificPresealBinding.rawSha256 = zero;
    zeroPostrun.scientificPresealBinding.presealEnvelopeSha256 = zero;
    expect(
      nhm2SphericalBosonStarV2PostrunWireViolations(
        canonicalBytes(zeroPostrun),
      ),
    ).toEqual(
      expect.arrayContaining([
        "postrun_skeleton_binding_invalid",
        "postrun_preseal_binding_invalid",
        "postrun_execution_invalid",
      ]),
    );
  });

  it("cross-binds frozen argv and output roots to execution", () => {
    const argvDrift = structuredClone(postrun) as any;
    argvDrift.execution.argv[2] = "--retuned";
    expect(
      nhm2SphericalBosonStarV2PostrunWireViolations(canonicalBytes(argvDrift)),
    ).toContain("postrun_execution_invalid");

    const outputRootDrift = structuredClone(postrun) as any;
    outputRootDrift.execution.outputDirectory = "/srv/nhm2/foreign-output";
    for (const file of outputRootDrift.physicalFiles)
      file.absolutePath = file.absolutePath.replace(
        "/srv/nhm2/output",
        "/srv/nhm2/foreign-output",
      );
    expect(
      nhm2SphericalBosonStarV2PostrunWireViolations(
        canonicalBytes(outputRootDrift),
      ),
    ).toContain("postrun_execution_invalid");

    const commandDrift = structuredClone(postrun) as any;
    commandDrift.execution.command = "node primary.mjs --retuned";
    expect(
      nhm2SphericalBosonStarV2PostrunWireViolations(
        canonicalBytes(commandDrift),
      ),
    ).toContain("postrun_execution_invalid");
  });

  it("blocks unauthenticated commit and run-identity provenance", () => {
    const arbitraryCommit = structuredClone(postrun) as any;
    arbitraryCommit.execution.commitSha = "a".repeat(40);
    expect(
      nhm2SphericalBosonStarV2RunArtifactPairViolations(
        skeletonBytes,
        canonicalBytes(arbitraryCommit),
      ),
    ).toEqual(
      expect.arrayContaining([
        ...NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_INCOMPLETENESS_BLOCKERS,
      ]),
    );

    const ownerDrift = structuredClone(postrun) as any;
    ownerDrift.physicalFiles[0].preReadStat.ownerUid = "1001";
    ownerDrift.physicalFiles[0].postReadStat.ownerUid = "1001";
    expect(
      nhm2SphericalBosonStarV2PostrunWireViolations(canonicalBytes(ownerDrift)),
    ).toEqual(
      expect.arrayContaining([
        "postrun_physical_file_owner_identity_drift",
        "postrun_run_identity_authentication_evidence_missing",
      ]),
    );
  });

  it("rejects actual stable-stat and exact-duration drift", () => {
    const statDrift = structuredClone(postrun) as any;
    statDrift.physicalFiles[0].postReadStat.inode = "999999";
    expect(
      nhm2SphericalBosonStarV2PostrunWireViolations(canonicalBytes(statDrift)),
    ).toContain("postrun_physical_files_invalid");

    const statU64Overflow = structuredClone(postrun) as any;
    statU64Overflow.physicalFiles[0].preReadStat.device =
      "18446744073709551616";
    statU64Overflow.physicalFiles[0].postReadStat.device =
      "18446744073709551616";
    expect(
      nhm2SphericalBosonStarV2PostrunWireViolations(
        canonicalBytes(statU64Overflow),
      ),
    ).toContain("postrun_physical_files_invalid");

    const durationDrift = structuredClone(postrun) as any;
    durationDrift.execution.durationMs = 499;
    expect(
      nhm2SphericalBosonStarV2PostrunWireViolations(
        canonicalBytes(durationDrift),
      ),
    ).toContain("postrun_execution_invalid");
  });

  it("keeps every execution, lamp and physical authority surface locked", () => {
    expect(
      Object.values(NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_CLAIM_LOCKS),
    ).toEqual(Array(9).fill(false));
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE.completion,
    ).toMatchObject({
      skeletonInstancePresent: false,
      scientificPresealInstancePresent: false,
      postrunManifestInstancePresent: false,
      executionObserved: false,
      replayObserved: false,
      independentAgreementObserved: false,
      diagnosticLampsMayPass: false,
      physicalClaimsMayUnlock: false,
    });
  });
});
