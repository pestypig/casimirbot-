import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import { NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING } from "../shared/contracts/nhm2-spherical-boson-star-newtonian-seed.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_JSON,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-candidate-freeze.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BINDING_ARTIFACT_ID,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BINDING_CONTRACT_VERSION,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_AUTHORITY_LOCKS,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_CANONICAL_JSON,
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_PAYLOADS,
  computeNhm2SphericalBosonStarV2InitializerBindingSha256,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-initializer-bridge.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_COMMAND_ARGV_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_V2_DIRTY_TREE_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_AUTHORITY_LOCKS,
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE,
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_CANONICAL_JSON,
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_EXPECTED_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_READINESS,
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_RESOURCE_LIMITS,
  NHM2_SPHERICAL_BOSON_STAR_V2_REQUIRED_STATIC_INPUT_ROLES,
  NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_INPUT_AGGREGATE_SHA256_DOMAIN,
  buildNhm2SphericalBosonStarV2PresealEvidence,
  buildNhm2SphericalBosonStarV2RuntimeClosureFromBytes,
  computeNhm2SphericalBosonStarV2CommandArgvSha256,
  computeNhm2SphericalBosonStarV2DirtyTreeDigestSha256,
  computeNhm2SphericalBosonStarV2FreshnessInventorySha256,
  computeNhm2SphericalBosonStarV2OutputRootSetIdentitySha256,
  computeNhm2SphericalBosonStarV2PresealPublicationReceiptSha256,
  computeNhm2SphericalBosonStarV2StaticInputAggregateSha256,
  deriveNhm2SphericalBosonStarV2DiagnosticPresealEvidence,
  isNhm2SphericalBosonStarV2PreexecutionProfile,
  isNhm2SphericalBosonStarV2ServerFilesystemObservationContext,
  isNhm2SphericalBosonStarV2ServerLoaderObservationContext,
  isNhm2SphericalBosonStarV2ServerSyscallTraceContext,
  nhm2SphericalBosonStarV2PreexecutionCanonicalJson,
  nhm2SphericalBosonStarV2PreexecutionProfileViolations,
  nhm2SphericalBosonStarV2DiagnosticPresealEnvelopeViolations,
  nhm2SphericalBosonStarV2DiagnosticPresealPublicationReceiptViolations,
  nhm2SphericalBosonStarV2PresealEnvelopeViolations,
  nhm2SphericalBosonStarV2PresealPublicationReceiptViolations,
  type Nhm2SphericalV2LinuxFileStatV1,
  type Nhm2SphericalV2PresealEvidenceV1,
  type Nhm2SphericalV2RawBindingV1,
  type Nhm2SphericalV2RunIdentityV1,
  type Nhm2SphericalV2RuntimeClosureByteEvidenceV1,
  type Nhm2SphericalV2StaticInputByteEvidenceV1,
  type Nhm2SphericalV2StaticInputKindV1,
  type Nhm2SphericalV2StaticInputRoleV1,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-preexecution-profile.v1";

const H = (byte: string): string => byte.repeat(64 / byte.length);
const BOOT_ID = "12345678-1234-4234-9234-123456789abc";
const RUN_IDENTITY: Nhm2SphericalV2RunIdentityV1 = {
  ownerUid: "1001",
  ownerGid: "1001",
  supplementaryGids: [],
};

const canonicalBytes = (value: unknown): Buffer =>
  Buffer.from(nhm2SphericalBosonStarV2PreexecutionCanonicalJson(value), "utf8");

const binding = (
  path: string,
  bytes: Uint8Array,
  mediaType: Nhm2SphericalV2RawBindingV1["mediaType"],
): Nhm2SphericalV2RawBindingV1 => ({
  path,
  mediaType,
  sizeBytes: bytes.byteLength,
  sha256: createHash("sha256").update(bytes).digest("hex"),
});

let nextInode = 1000;
const stat = (
  rawBinding: Nhm2SphericalV2RawBindingV1,
  modeOctal: Nhm2SphericalV2LinuxFileStatV1["modeOctal"] = "0400",
  changeTimeNanoseconds = "100",
): Nhm2SphericalV2LinuxFileStatV1 => ({
  changeTimeNanoseconds,
  device: "8",
  fileType: "regular",
  inode: String((nextInode += 1)),
  linkCount: "1",
  modeOctal,
  modifyTimeNanoseconds: "90",
  ownerGid: RUN_IDENTITY.ownerGid,
  ownerUid: RUN_IDENTITY.ownerUid,
  sha256: rawBinding.sha256,
  sizeBytes: rawBinding.sizeBytes,
});

const u64le = (value: number): Buffer => {
  const result = Buffer.alloc(8);
  result.writeBigUInt64LE(BigInt(value));
  return result;
};

const initializerBinding = () => {
  const orderedPayloadBindings =
    NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_PAYLOADS.map((payload, index) => ({
      ...payload,
      rawSha256: H(`${index + 3}${index + 3}`),
    }));
  const sourceInputBindingSha256 = H("88");
  const sourceProofSummaryRawSha256 = H("99");
  return {
    artifactId: NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BINDING_ARTIFACT_ID,
    attemptOrdinal: 1 as const,
    authorityFalse: true as const,
    claimLocks: {
      ...NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_AUTHORITY_LOCKS,
    },
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BINDING_CONTRACT_VERSION,
    initializerBindingSha256:
      computeNhm2SphericalBosonStarV2InitializerBindingSha256(
        sourceInputBindingSha256,
        sourceProofSummaryRawSha256,
        orderedPayloadBindings,
      ),
    orderedPayloadBindings,
    sourceCandidateId:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING.candidateId,
    sourceInputBindingSha256,
    sourceProofConclusion:
      "all_directed_duties_passed_without_seed_or_solution_authority" as const,
    sourceProofSummaryRawSha256,
    targetCandidateId:
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
  };
};

const writeProgramHeader = (
  bytes: Buffer,
  cursor: number,
  type: number,
  offset: number,
  virtualAddress: number,
  fileSize: number,
) => {
  bytes.writeUInt32LE(type, cursor);
  bytes.writeUInt32LE(4, cursor + 4);
  bytes.writeBigUInt64LE(BigInt(offset), cursor + 8);
  bytes.writeBigUInt64LE(BigInt(virtualAddress), cursor + 16);
  bytes.writeBigUInt64LE(BigInt(virtualAddress), cursor + 24);
  bytes.writeBigUInt64LE(BigInt(fileSize), cursor + 32);
  bytes.writeBigUInt64LE(BigInt(fileSize), cursor + 40);
  bytes.writeBigUInt64LE(BigInt(8), cursor + 48);
};

const elf64 = (options: {
  interpreter?: string;
  needed: readonly string[];
  soname?: string;
  buildIdByte: number;
}): Buffer => {
  const totalSize = 1536;
  const bytes = Buffer.alloc(totalSize);
  const base = 0x400000;
  const dynamicOffset = 768;
  const stringTableOffset = 1024;
  const noteOffset = 1280;
  const interpreterOffset = 512;
  const strings: Buffer[] = [Buffer.from([0])];
  const offsets = new Map<string, number>();
  let stringLength = 1;
  for (const value of [
    ...options.needed,
    ...(options.soname ? [options.soname] : []),
  ]) {
    if (offsets.has(value)) continue;
    offsets.set(value, stringLength);
    const encoded = Buffer.from(`${value}\0`, "utf8");
    strings.push(encoded);
    stringLength += encoded.length;
  }
  Buffer.concat(strings).copy(bytes, stringTableOffset);
  const dynamics: Array<readonly [number, number]> = options.needed.map(
    (name) => [1, offsets.get(name)!] as const,
  );
  if (options.soname) dynamics.push([14, offsets.get(options.soname)!]);
  dynamics.push([5, base + stringTableOffset], [10, stringLength], [0, 0]);
  dynamics.forEach(([tag, value], index) => {
    bytes.writeBigUInt64LE(BigInt(tag), dynamicOffset + index * 16);
    bytes.writeBigUInt64LE(BigInt(value), dynamicOffset + index * 16 + 8);
  });
  bytes.writeUInt32LE(4, noteOffset);
  bytes.writeUInt32LE(4, noteOffset + 4);
  bytes.writeUInt32LE(3, noteOffset + 8);
  Buffer.from("GNU\0").copy(bytes, noteOffset + 12);
  bytes.fill(options.buildIdByte, noteOffset + 16, noteOffset + 20);
  if (options.interpreter)
    Buffer.from(`${options.interpreter}\0`, "utf8").copy(
      bytes,
      interpreterOffset,
    );

  Buffer.from([0x7f, 0x45, 0x4c, 0x46, 2, 1, 1]).copy(bytes, 0);
  bytes.writeUInt16LE(3, 16);
  bytes.writeUInt16LE(62, 18);
  bytes.writeUInt32LE(1, 20);
  bytes.writeBigUInt64LE(BigInt(64), 32);
  bytes.writeUInt16LE(64, 52);
  bytes.writeUInt16LE(56, 54);
  const programHeaderCount = options.interpreter ? 4 : 3;
  bytes.writeUInt16LE(programHeaderCount, 56);
  let header = 64;
  writeProgramHeader(bytes, header, 1, 0, base, totalSize);
  header += 56;
  writeProgramHeader(
    bytes,
    header,
    2,
    dynamicOffset,
    base + dynamicOffset,
    dynamics.length * 16,
  );
  header += 56;
  writeProgramHeader(bytes, header, 4, noteOffset, base + noteOffset, 20);
  if (options.interpreter) {
    header += 56;
    writeProgramHeader(
      bytes,
      header,
      3,
      interpreterOffset,
      base + interpreterOffset,
      Buffer.byteLength(options.interpreter, "utf8") + 1,
    );
  }
  return bytes;
};

const runtimeEvidence = (): Nhm2SphericalV2RuntimeClosureByteEvidenceV1 => {
  const interpreterPath = "/lib64/ld-linux-x86-64.so.2";
  const executableBytes = elf64({
    interpreter: interpreterPath,
    needed: ["libc.so.6"],
    buildIdByte: 0xaa,
  });
  const interpreterBytes = elf64({
    needed: [],
    soname: "ld-linux-x86-64.so.2",
    buildIdByte: 0xbb,
  });
  const libcBytes = elf64({
    needed: [],
    soname: "libc.so.6",
    buildIdByte: 0xcc,
  });
  const executableBinding = binding(
    "bin/solver",
    executableBytes,
    "application/octet-stream",
  );
  const interpreterBinding = binding(
    interpreterPath,
    interpreterBytes,
    "application/octet-stream",
  );
  const libcBinding = binding(
    "/lib/x86_64-linux-gnu/libc.so.6",
    libcBytes,
    "application/octet-stream",
  );
  return {
    schemaVersion: "nhm2_spherical_boson_star_v2_runtime_byte_evidence/v1",
    authorityFalse: true,
    executableBinding,
    executableStat: stat(executableBinding, "0500"),
    executableRawBytes: executableBytes,
    objectsInLoadOrder: [
      {
        kind: "elf_interpreter",
        requestedName: interpreterPath,
        resolvedAbsolutePath: interpreterPath,
        binding: interpreterBinding,
        stat: stat(interpreterBinding, "0500"),
        rawBytes: interpreterBytes,
      },
      {
        kind: "shared_object",
        requestedName: "libc.so.6",
        resolvedAbsolutePath: libcBinding.path,
        binding: libcBinding,
        stat: stat(libcBinding),
        rawBytes: libcBytes,
      },
    ],
    ambientLdLibraryPath: "empty",
    loaderCacheUsed: false,
  };
};

const KIND_BY_ROLE: Readonly<
  Record<Nhm2SphericalV2StaticInputRoleV1, Nhm2SphericalV2StaticInputKindV1>
> = {
  v2_candidate_freeze: "canonical_json",
  initializer_bridge: "canonical_json",
  scientific_candidate_manifest: "canonical_json",
  scientific_preseal: "canonical_json",
  scientific_persistence_receipt: "canonical_json",
  source_manifest: "canonical_json",
  source_file: "source_text",
  source_payload: "f64le",
  build_recipe: "source_text",
  dependency_lock: "dependency_lock",
  toolchain_manifest: "canonical_json",
  executable: "executable",
  elf_interpreter: "elf_interpreter",
  shared_object: "shared_object",
};

const MEDIA_BY_KIND: Readonly<
  Record<
    Nhm2SphericalV2StaticInputKindV1,
    Nhm2SphericalV2RawBindingV1["mediaType"]
  >
> = {
  canonical_json: "application/json",
  source_text: "text/plain",
  f64le: "application/octet-stream",
  dependency_lock: "application/octet-stream",
  executable: "application/octet-stream",
  elf_interpreter: "application/octet-stream",
  shared_object: "application/octet-stream",
  opaque_binary: "application/octet-stream",
};

const staticByteEvidence = (
  runtime = runtimeEvidence(),
): Nhm2SphericalV2StaticInputByteEvidenceV1[] => {
  const byteByRole = new Map<Nhm2SphericalV2StaticInputRoleV1, Uint8Array>([
    [
      "v2_candidate_freeze",
      Buffer.from(NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_JSON),
    ],
    [
      "initializer_bridge",
      Buffer.from(
        NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_CANONICAL_JSON,
      ),
    ],
    ["scientific_candidate_manifest", canonicalBytes({ kind: "candidate" })],
    ["scientific_preseal", canonicalBytes({ kind: "science_preseal" })],
    [
      "scientific_persistence_receipt",
      canonicalBytes({ kind: "science_receipt" }),
    ],
    ["source_manifest", canonicalBytes({ kind: "source_manifest" })],
    ["source_file", Buffer.from("int main(){}\n")],
    ["source_payload", Buffer.alloc(8, 1)],
    ["build_recipe", Buffer.from("rule solver\n")],
    ["dependency_lock", Buffer.from("lock-v1\n")],
    ["toolchain_manifest", canonicalBytes({ kind: "toolchain" })],
    ["executable", runtime.executableRawBytes],
    ["elf_interpreter", runtime.objectsInLoadOrder[0].rawBytes],
    ["shared_object", runtime.objectsInLoadOrder[1].rawBytes],
  ]);
  const pathByRole: Readonly<Record<Nhm2SphericalV2StaticInputRoleV1, string>> =
    {
      v2_candidate_freeze: "contracts/candidate-freeze.json",
      initializer_bridge: "contracts/initializer-bridge.json",
      scientific_candidate_manifest: "manifests/scientific-candidate.json",
      scientific_preseal: "manifests/scientific-preseal.json",
      scientific_persistence_receipt: "receipts/scientific-persistence.json",
      source_manifest: "manifests/source.json",
      source_file: "src/solver.cc",
      source_payload: "inputs/scalars.f64le",
      build_recipe: "build/build.ninja",
      dependency_lock: "build/dependencies.lock",
      toolchain_manifest: "manifests/toolchain.json",
      executable: runtime.executableBinding.path,
      elf_interpreter: "runtime/ld-linux-x86-64.so.2",
      shared_object: "runtime/libc.so.6",
    };
  const results = NHM2_SPHERICAL_BOSON_STAR_V2_REQUIRED_STATIC_INPUT_ROLES.map(
    (semanticRole) => {
      const semanticKind = KIND_BY_ROLE[semanticRole];
      const rawBytes = byteByRole.get(semanticRole)!;
      const rawBinding = binding(
        pathByRole[semanticRole],
        rawBytes,
        MEDIA_BY_KIND[semanticKind],
      );
      return {
        entry: {
          relativePath: rawBinding.path,
          semanticRole,
          semanticKind,
          mediaType: rawBinding.mediaType,
          sizeBytes: rawBinding.sizeBytes,
          sha256: rawBinding.sha256,
          stat: stat(
            rawBinding,
            semanticKind === "executable" || semanticKind === "elf_interpreter"
              ? "0500"
              : "0400",
          ),
        },
        rawBytes,
      } as Nhm2SphericalV2StaticInputByteEvidenceV1;
    },
  );
  results.sort((left, right) =>
    Buffer.compare(
      Buffer.from(left.entry.relativePath),
      Buffer.from(right.entry.relativePath),
    ),
  );
  return results;
};

const presealEvidence = (): Nhm2SphericalV2PresealEvidenceV1 => {
  const runtime = runtimeEvidence();
  const staticInputs = staticByteEvidence(runtime);
  const scopes = staticInputs.map((item) => item.entry.relativePath).sort();
  return {
    attemptOrdinal: 1,
    argv: ["/srv/nhm2/solver", "--input", "inputs/scalars.f64le"],
    bootId: BOOT_ID,
    commit40: "1".repeat(40),
    createdMonotonicRawNanoseconds: "1000000",
    createdWallUtc: "2026-08-13T12:34:56.123456789Z",
    dirtyTreeEntries: [],
    dirtyTreeRawEvidence: {
      scopedPathspecs: scopes as [string, ...string[]],
      rawPorcelainV2ZBytes: new Uint8Array(),
    },
    freshnessObservations: staticInputs.map(({ entry }) => ({
      relativePath: entry.relativePath,
      preopen: { ...entry.stat },
      postread: { ...entry.stat },
      stable: true,
    })),
    initializerBinding: initializerBinding(),
    outputRoots: [
      {
        role: "primary",
        absolutePath: "/srv/nhm2/out-primary",
        observedAbsent: true,
      },
      {
        role: "independent",
        absolutePath: "/srv/nhm2/out-independent",
        observedAbsent: true,
      },
    ],
    runIdentity: RUN_IDENTITY,
    runtimeEvidence: runtime,
    staticInputByteEvidence: staticInputs,
    workingDirectory: "/srv/nhm2/run",
  };
};

const receiptEvidence = (
  context: ReturnType<
    typeof deriveNhm2SphericalBosonStarV2DiagnosticPresealEvidence
  >,
) => {
  const rawPreseal = Buffer.from(context.rawPresealBytes);
  const presealRawSha256 = createHash("sha256")
    .update(rawPreseal)
    .digest("hex");
  const finalPath = "preseal/preexecution.json";
  const operations = [
    "openat2_temp_O_CREAT_O_EXCL_O_NOFOLLOW_mode0400",
    "complete_write_and_fsync_temp_file",
    "close_reopenat2_rehash_and_identity_stability_check",
    "fsync_parent_directory_before_rename",
    "renameat2_RENAME_NOREPLACE_temp_to_final",
    "fsync_parent_directory_after_rename",
    "openat2_final_readback_rehash_and_identity_check",
  ];
  const trace = {
    artifactId: "nhm2.spherical_boson_star_v2_preseal_syscall_trace",
    bootId: BOOT_ID,
    candidateId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
    events: operations.map((operation, ordinal) => ({
      monotonicRawNanoseconds: String(1_000_005 + ordinal * 5),
      operation,
      ordinal,
    })),
    finalPath,
    presealEnvelopeSha256: context.preseal.presealSha256,
    presealRawSha256,
    schemaVersion: "nhm2_spherical_boson_star_v2_preseal_syscall_trace/v1",
    temporaryPath: "preseal/.preexecution.tmp",
  };
  const rawTraceBytes = canonicalBytes(trace);
  const presealBinding = {
    mediaType: "application/json" as const,
    path: finalPath,
    presealEnvelopeSha256: String(context.preseal.presealSha256),
    rawSha256: presealRawSha256,
    sizeBytes: rawPreseal.length,
  };
  const temporaryBinding = binding(finalPath, rawPreseal, "application/json");
  const temporaryFileStat = stat(temporaryBinding, "0400", "100");
  const finalFileStat = { ...temporaryFileStat, changeTimeNanoseconds: "101" };
  const receipt: Record<string, unknown> = {
    artifactId: "nhm2.spherical_boson_star_v2_preseal_publication_receipt",
    authority: "server_observed_durability_only_no_candidate_authority",
    bootId: BOOT_ID,
    candidateId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
    claimLocks: {
      ...NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_AUTHORITY_LOCKS,
    },
    contractVersion:
      "nhm2_spherical_boson_star_v2_preseal_publication_receipt/v1",
    fileFsyncCompletedMonotonicRawNanoseconds: "1000010",
    finalFileStat,
    parentDirectoryFsyncAfterRenameMonotonicRawNanoseconds: "1000030",
    parentDirectoryFsyncBeforeRenameMonotonicRawNanoseconds: "1000020",
    presealBinding,
    publicationReceiptSha256: H("ff"),
    readbackCompletedMonotonicRawNanoseconds: "1000035",
    renameNoreplaceCompletedMonotonicRawNanoseconds: "1000025",
    runIdentity: RUN_IDENTITY,
    syscallTraceBinding: binding(
      "receipts/preseal-syscalls.json",
      rawTraceBytes,
      "application/json",
    ),
    temporaryFileStat,
  };
  receipt.publicationReceiptSha256 =
    computeNhm2SphericalBosonStarV2PresealPublicationReceiptSha256(receipt);
  return {
    receipt,
    rawReceiptBytes: canonicalBytes(receipt),
    rawTraceBytes,
    trace,
  };
};

const cloneProfile = (): any =>
  JSON.parse(NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_CANONICAL_JSON);

describe("NHM2 spherical boson-star v2 preexecution profile v1", () => {
  it("is self-sealed, deeply closed, incomplete at runtime, and authority false", () => {
    expect(NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_SHA256).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_EXPECTED_SHA256,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_CANONICAL_SIZE_BYTES,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_EXPECTED_CANONICAL_SIZE_BYTES,
    );
    expect(
      isNhm2SphericalBosonStarV2PreexecutionProfile(
        NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE,
      ),
    ).toBe(true);
    expect(
      nhm2SphericalBosonStarV2PreexecutionProfileViolations(
        NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE,
      ),
    ).toEqual([]);
    expect(
      nhm2SphericalBosonStarV2PreexecutionProfileViolations(cloneProfile()),
    ).toEqual(["v2_preexecution_profile_external_copy_not_authoritative"]);
    expect(
      Object.values(
        NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_AUTHORITY_LOCKS,
      ).every((value) => value === false),
    ).toBe(true);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE.completionBoundary
        .launchAuthorized,
    ).toBe(false);
    expect(
      Object.entries(NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_READINESS)
        .filter(([key]) => key !== "blockers")
        .every(([, value]) => value === false),
    ).toBe(true);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_READINESS.blockers,
    ).toContain("actual_runtime_loader_path_identity_unobserved");
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE.completionBoundary
        .actualRuntimeClosureReady,
    ).toBe(false);
  });

  it("hashes exact argv framing and rejects shell-like byte ambiguity", () => {
    const argv = ["/srv/nhm2/solver", "--input", "inputs/candidate.json"];
    const independent = createHash("sha256")
      .update(NHM2_SPHERICAL_BOSON_STAR_V2_COMMAND_ARGV_SHA256_DOMAIN)
      .update(u64le(argv.length));
    for (const argument of argv) {
      const bytes = Buffer.from(argument);
      independent.update(u64le(bytes.length)).update(bytes);
    }
    expect(computeNhm2SphericalBosonStarV2CommandArgvSha256(argv)).toBe(
      independent.digest("hex"),
    );
    expect(() =>
      computeNhm2SphericalBosonStarV2CommandArgvSha256(["e\u0301"]),
    ).toThrow("argv_invalid");
    expect(() => computeNhm2SphericalBosonStarV2CommandArgvSha256([])).toThrow(
      "argv_invalid",
    );
  });

  it("applies byte, aggregate, JSON-number, and decimal caps before expensive work", () => {
    const tooLarge = Buffer.allocUnsafe(
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_RESOURCE_LIMITS.maximumRawBytesPerFile +
        1,
    );
    const oversizedFile = presealEvidence() as any;
    oversizedFile.staticInputByteEvidence[0]!.rawBytes = tooLarge;
    expect(() =>
      deriveNhm2SphericalBosonStarV2DiagnosticPresealEvidence(oversizedFile),
    ).toThrow("static_byte_evidence_invalid");

    const oneMaximumFile = tooLarge.subarray(0, tooLarge.length - 1);
    const oversizedAggregate = presealEvidence() as any;
    for (const item of oversizedAggregate.staticInputByteEvidence.slice(0, 3))
      item.rawBytes = oneMaximumFile;
    oversizedAggregate.runtimeEvidence.executableRawBytes = oneMaximumFile;
    expect(() =>
      deriveNhm2SphericalBosonStarV2DiagnosticPresealEvidence(
        oversizedAggregate,
      ),
    ).toThrow("aggregate_raw_bytes_exceeded");

    const mutableCanonicalRoles = new Set([
      "scientific_candidate_manifest",
      "scientific_preseal",
      "scientific_persistence_receipt",
      "source_manifest",
      "toolchain_manifest",
    ]);
    const aggregateTokenEvidence = presealEvidence() as any;
    const numbersPerTokenFixture =
      Math.floor(
        NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_RESOURCE_LIMITS.maximumAggregateCanonicalJsonTokens /
          (mutableCanonicalRoles.size * 2),
      ) + 1;
    const tokenHeavyJson = Buffer.from(
      `[${"0,".repeat(numbersPerTokenFixture - 1)}0]`,
    );
    for (const item of aggregateTokenEvidence.staticInputByteEvidence)
      if (mutableCanonicalRoles.has(item.entry.semanticRole))
        item.rawBytes = tokenHeavyJson;
    expect(() =>
      deriveNhm2SphericalBosonStarV2DiagnosticPresealEvidence(
        aggregateTokenEvidence,
      ),
    ).toThrow("aggregate_canonical_json_tokens_exceeded");

    const aggregateDigitEvidence = presealEvidence() as any;
    const digitsPerNumber =
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_RESOURCE_LIMITS.maximumCanonicalJsonNumberDigitsPerToken;
    const numbersPerDigitFixture =
      Math.floor(
        NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_RESOURCE_LIMITS.maximumAggregateCanonicalJsonNumberDigits /
          (mutableCanonicalRoles.size * digitsPerNumber),
      ) + 1;
    const digitHeavyJson = Buffer.from(
      `[${`${"9".repeat(digitsPerNumber)},`.repeat(
        numbersPerDigitFixture - 1,
      )}${"9".repeat(digitsPerNumber)}]`,
    );
    for (const item of aggregateDigitEvidence.staticInputByteEvidence)
      if (mutableCanonicalRoles.has(item.entry.semanticRole))
        item.rawBytes = digitHeavyJson;
    expect(() =>
      deriveNhm2SphericalBosonStarV2DiagnosticPresealEvidence(
        aggregateDigitEvidence,
      ),
    ).toThrow("aggregate_canonical_json_number_digits_exceeded");

    const excessiveNumber = Buffer.from(
      `{"n":${"9".repeat(
        NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_RESOURCE_LIMITS.maximumCanonicalJsonNumberTokenBytes +
          1,
      )}}`,
    );
    const excessiveJson = presealEvidence() as any;
    const manifest = excessiveJson.staticInputByteEvidence.find(
      (item: any) => item.entry.semanticRole === "source_manifest",
    )!;
    const manifestBinding = binding(
      manifest.entry.relativePath,
      excessiveNumber,
      "application/json",
    );
    manifest.rawBytes = excessiveNumber;
    manifest.entry.sizeBytes = manifestBinding.sizeBytes;
    manifest.entry.sha256 = manifestBinding.sha256;
    manifest.entry.stat = stat(manifestBinding);
    expect(() =>
      deriveNhm2SphericalBosonStarV2DiagnosticPresealEvidence(excessiveJson),
    ).toThrow("static_canonical_json_invalid");

    const excessiveDecimal = presealEvidence() as any;
    excessiveDecimal.createdMonotonicRawNanoseconds = "9".repeat(100_000);
    expect(() =>
      deriveNhm2SphericalBosonStarV2DiagnosticPresealEvidence(excessiveDecimal),
    ).toThrow("preseal_evidence_invalid");
  });

  it("preflights bounded dirty-tree population and record-hex evidence before decode", () => {
    const staticInputs = staticByteEvidence();
    const commit = "2".repeat(40);
    const populationEvidence = (rawPorcelainV2ZBytes: Uint8Array) => ({
      scopedPathspecs: ["src"] as [string],
      rawPorcelainV2ZBytes,
    });
    for (const raw of [
      Buffer.alloc(50_000),
      Buffer.from("x unknown\0"),
      Buffer.from("? unterminated"),
    ])
      expect(() =>
        computeNhm2SphericalBosonStarV2DirtyTreeDigestSha256(
          commit,
          populationEvidence(raw),
          [],
          staticInputs,
          RUN_IDENTITY,
        ),
      ).toThrow("dirty_tree_record_population_invalid");

    const source = staticInputs.find(
      (item) => item.entry.relativePath === "src/solver.cc",
    )!;
    const rawRecord = Buffer.from("? src/solver.cc\0");
    const oversizedHexEvidence = presealEvidence() as any;
    oversizedHexEvidence.dirtyTreeRawEvidence.rawPorcelainV2ZBytes = rawRecord;
    oversizedHexEvidence.dirtyTreeEntries = [
      {
        gitPorcelainV2RecordHex: "a".repeat(2_000_000),
        indexStage0ObjectId: null,
        relativePath: "src/solver.cc",
        worktreeRawBytes: source.rawBytes,
        worktreeSha256: source.entry.sha256,
        worktreeSizeBytes: source.entry.sizeBytes,
        worktreeStat: source.entry.stat,
      },
    ];
    expect(() =>
      deriveNhm2SphericalBosonStarV2DiagnosticPresealEvidence(
        oversizedHexEvidence,
      ),
    ).toThrow("dirty_tree_record_hex_invalid:0");
    expect(() =>
      computeNhm2SphericalBosonStarV2DirtyTreeDigestSha256(
        commit,
        populationEvidence(rawRecord),
        oversizedHexEvidence.dirtyTreeEntries,
        staticInputs,
        RUN_IDENTITY,
      ),
    ).toThrow("dirty_tree_record_hex_invalid:0");

    const invalidHexEvidence = structuredClone(oversizedHexEvidence) as any;
    invalidHexEvidence.dirtyTreeEntries[0].gitPorcelainV2RecordHex = "gg";
    expect(() =>
      deriveNhm2SphericalBosonStarV2DiagnosticPresealEvidence(
        invalidHexEvidence,
      ),
    ).toThrow("dirty_tree_record_hex_invalid:0");

    const maximumRecordHex = "aa".repeat(
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_RESOURCE_LIMITS.maximumDirtyTreeRawRecordBytes,
    );
    const aggregateRecordCount =
      Math.floor(
        NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_RESOURCE_LIMITS.maximumAggregatePreflightEvidenceBytes /
          maximumRecordHex.length,
      ) + 1;
    expect(aggregateRecordCount).toBeLessThanOrEqual(
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_RESOURCE_LIMITS.maximumDirtyTreeRecordCount,
    );
    const aggregateHexEvidence = presealEvidence() as any;
    const aggregateEntry = {
      gitPorcelainV2RecordHex: maximumRecordHex,
      indexStage0ObjectId: null,
      relativePath: "a",
      worktreeRawBytes: new Uint8Array(),
      worktreeSha256: H("ab"),
      worktreeSizeBytes: 0,
      worktreeStat: source.entry.stat,
    };
    aggregateHexEvidence.dirtyTreeRawEvidence.rawPorcelainV2ZBytes =
      Buffer.from("? a\0".repeat(aggregateRecordCount));
    aggregateHexEvidence.dirtyTreeEntries =
      Array(aggregateRecordCount).fill(aggregateEntry);
    expect(() =>
      deriveNhm2SphericalBosonStarV2DiagnosticPresealEvidence(
        aggregateHexEvidence,
      ),
    ).toThrow("aggregate_preflight_evidence_bytes_exceeded");
  });

  it("closes every static semantic role and exact freshness against byte-bound stats", () => {
    const evidence = staticByteEvidence();
    const entries = evidence.map(({ entry }) => entry);
    const digest = computeNhm2SphericalBosonStarV2StaticInputAggregateSha256(
      entries,
      RUN_IDENTITY,
    );
    const independent = createHash("sha256")
      .update(NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_INPUT_AGGREGATE_SHA256_DOMAIN)
      .update(u64le(entries.length));
    for (const entry of entries) {
      const bytes = canonicalBytes(entry);
      independent.update(u64le(bytes.length)).update(bytes);
    }
    expect(digest).toBe(independent.digest("hex"));
    expect(() =>
      computeNhm2SphericalBosonStarV2StaticInputAggregateSha256(
        entries.slice(1),
        RUN_IDENTITY,
      ),
    ).toThrow("static_inventory_invalid");
    const wrongKind = structuredClone(entries) as any;
    wrongKind.find(
      (entry: any) => entry.semanticRole === "source_file",
    )!.semanticKind = "f64le";
    wrongKind.find(
      (entry: any) => entry.semanticRole === "source_file",
    )!.mediaType = "application/octet-stream";
    expect(() =>
      computeNhm2SphericalBosonStarV2StaticInputAggregateSha256(
        wrongKind,
        RUN_IDENTITY,
      ),
    ).toThrow("static_inventory_invalid");
    for (const field of ["ownerUid", "ownerGid"] as const) {
      const root = structuredClone(entries) as any;
      root[0]!.stat[field] = "0";
      expect(() =>
        computeNhm2SphericalBosonStarV2StaticInputAggregateSha256(root, {
          ...RUN_IDENTITY,
          [field]: "0",
        }),
      ).toThrow("static_inventory_invalid");
    }
    expect(() =>
      computeNhm2SphericalBosonStarV2StaticInputAggregateSha256(entries, {
        ...RUN_IDENTITY,
        supplementaryGids: ["1002"],
      } as any),
    ).toThrow("static_inventory_invalid");
    const groupReadable = structuredClone(entries) as any;
    groupReadable[0].stat.modeOctal = "0440";
    expect(() =>
      computeNhm2SphericalBosonStarV2StaticInputAggregateSha256(
        groupReadable,
        RUN_IDENTITY,
      ),
    ).toThrow("static_inventory_invalid");

    const observations = entries.map((entry) => ({
      relativePath: entry.relativePath,
      preopen: { ...entry.stat },
      postread: { ...entry.stat },
      stable: true as const,
    }));
    expect(
      computeNhm2SphericalBosonStarV2FreshnessInventorySha256(
        observations,
        entries,
        RUN_IDENTITY,
      ),
    ).toMatch(/^[a-f0-9]{64}$/);
    const sameButNotStatic = structuredClone(observations);
    sameButNotStatic[0]!.preopen.changeTimeNanoseconds = "101";
    sameButNotStatic[0]!.postread.changeTimeNanoseconds = "101";
    expect(() =>
      computeNhm2SphericalBosonStarV2FreshnessInventorySha256(
        sameButNotStatic,
        entries,
        RUN_IDENTITY,
      ),
    ).toThrow("freshness_inventory_invalid");
  });

  it("requires scoped raw porcelain bytes and rejects omitted or forged records", () => {
    const commit = "2".repeat(40);
    const staticInputs = staticByteEvidence();
    const staticSource = staticInputs.find(
      (item) => item.entry.relativePath === "src/solver.cc",
    )!;
    const record = Buffer.from(
      `1 .M N... 100644 100644 100644 ${"4".repeat(40)} ${"3".repeat(40)} src/solver.cc\0`,
    );
    const entry = {
      gitPorcelainV2RecordHex: record.toString("hex"),
      indexStage0ObjectId: "3".repeat(40),
      relativePath: "src/solver.cc",
      worktreeRawBytes: staticSource.rawBytes,
      worktreeSha256: staticSource.entry.sha256,
      worktreeSizeBytes: staticSource.entry.sizeBytes,
      worktreeStat: staticSource.entry.stat,
    };
    const rawEvidence = {
      scopedPathspecs: ["src"] as [string],
      rawPorcelainV2ZBytes: record,
    };
    expect(
      computeNhm2SphericalBosonStarV2DirtyTreeDigestSha256(
        commit,
        rawEvidence,
        [entry],
        staticInputs,
        RUN_IDENTITY,
      ),
    ).toMatch(/^[a-f0-9]{64}$/);
    expect(() =>
      computeNhm2SphericalBosonStarV2DirtyTreeDigestSha256(
        commit,
        [] as any,
        [],
        staticInputs,
        RUN_IDENTITY,
      ),
    ).toThrow("raw_evidence_invalid");
    expect(() =>
      computeNhm2SphericalBosonStarV2DirtyTreeDigestSha256(
        commit,
        { ...rawEvidence, rawPorcelainV2ZBytes: new Uint8Array() },
        [entry],
        staticInputs,
        RUN_IDENTITY,
      ),
    ).toThrow("dirty_tree_record_population_invalid");
    expect(() =>
      computeNhm2SphericalBosonStarV2DirtyTreeDigestSha256(
        commit,
        rawEvidence,
        [{ ...entry, relativePath: "src/other.cc" }],
        staticInputs,
        RUN_IDENTITY,
      ),
    ).toThrow("dirty_tree_entry_invalid");
    const forgedBytes = Buffer.from("int forged(){}\n");
    const forgedBinding = binding("src/solver.cc", forgedBytes, "text/plain");
    expect(() =>
      computeNhm2SphericalBosonStarV2DirtyTreeDigestSha256(
        commit,
        rawEvidence,
        [
          {
            ...entry,
            worktreeRawBytes: forgedBytes,
            worktreeSha256: forgedBinding.sha256,
            worktreeSizeBytes: forgedBinding.sizeBytes,
            worktreeStat: stat(forgedBinding),
          },
        ],
        staticInputs,
        RUN_IDENTITY,
      ),
    ).toThrow("dirty_tree_entry_invalid");
    expect(
      computeNhm2SphericalBosonStarV2DirtyTreeDigestSha256(
        commit,
        { scopedPathspecs: ["src"], rawPorcelainV2ZBytes: new Uint8Array() },
        [],
        staticInputs,
        RUN_IDENTITY,
      ),
    ).toMatch(/^[a-f0-9]{64}$/);
  });

  it("binds exactly two observed-absent disjoint, non-ancestor output roots", () => {
    const roots = [
      {
        role: "primary",
        absolutePath: "/srv/out-primary",
        observedAbsent: true,
      },
      {
        role: "independent",
        absolutePath: "/srv/out-independent",
        observedAbsent: true,
      },
    ] as const;
    expect(
      computeNhm2SphericalBosonStarV2OutputRootSetIdentitySha256(roots),
    ).toMatch(/^[a-f0-9]{64}$/);
    expect(() =>
      computeNhm2SphericalBosonStarV2OutputRootSetIdentitySha256([
        { ...roots[0], observedAbsent: false },
        roots[1],
      ] as any),
    ).toThrow("output_root_invalid");
    expect(() =>
      computeNhm2SphericalBosonStarV2OutputRootSetIdentitySha256([
        roots[0],
        { ...roots[1], absolutePath: "/SRV/OUT-PRIMARY" },
      ]),
    ).toThrow("disjointness_invalid");
    expect(() =>
      computeNhm2SphericalBosonStarV2OutputRootSetIdentitySha256([
        roots[0],
        { ...roots[1], absolutePath: "/srv/out-primary/child" },
      ]),
    ).toThrow("disjointness_invalid");
  });

  it("derives PT_INTERP, DT_NEEDED, SONAME and build-id from bound ELF bytes", () => {
    const evidence = runtimeEvidence();
    const result = buildNhm2SphericalBosonStarV2RuntimeClosureFromBytes(
      evidence,
      RUN_IDENTITY,
    );
    expect(result.closure.executableElfInterpreter).toBe(
      "/lib64/ld-linux-x86-64.so.2",
    );
    expect(result.closure.executableNeededInOrder).toEqual(["libc.so.6"]);
    expect(result.closure.objectsInLoadOrder[1].soname).toBe("libc.so.6");
    expect(result.closure.byteDerivedExpectedClosureComplete).toBe(true);
    expect(result.closure.actualLoaderResolutionObserved).toBe(false);
    expect(result.closure.closureComplete).toBe(false);
    expect(result.runtimeClosureSha256).toMatch(/^[a-f0-9]{64}$/);

    const badMagic = structuredClone(evidence) as any;
    badMagic.executableRawBytes[0] = 0;
    const rebound = binding(
      "bin/solver",
      badMagic.executableRawBytes,
      "application/octet-stream",
    );
    badMagic.executableBinding = rebound;
    badMagic.executableStat.sha256 = rebound.sha256;
    expect(() =>
      buildNhm2SphericalBosonStarV2RuntimeClosureFromBytes(
        badMagic,
        RUN_IDENTITY,
      ),
    ).toThrow("elf_header_invalid");

    const claimedNeeded = structuredClone(evidence) as any;
    claimedNeeded.objectsInLoadOrder[1].requestedName = "libfake.so.1";
    expect(() =>
      buildNhm2SphericalBosonStarV2RuntimeClosureFromBytes(
        claimedNeeded,
        RUN_IDENTITY,
      ),
    ).toThrow("runtime_object_invalid");
  });

  it("derives byte-bound diagnostics but rejects forged server observation contexts", () => {
    const evidence = presealEvidence();
    const context =
      deriveNhm2SphericalBosonStarV2DiagnosticPresealEvidence(evidence);
    expect(
      nhm2SphericalBosonStarV2DiagnosticPresealEnvelopeViolations(
        context.preseal,
        context,
        context.rawPresealBytes,
      ),
    ).toEqual([]);
    expect(
      nhm2SphericalBosonStarV2DiagnosticPresealEnvelopeViolations(
        context.preseal,
        {} as any,
        context.rawPresealBytes,
      ),
    ).toEqual(["v2_preseal_derived_context_required"]);
    expect(
      nhm2SphericalBosonStarV2PresealEnvelopeViolations(
        context.preseal,
        context as any,
        context.rawPresealBytes,
      ),
    ).toEqual([
      "v2_preseal_server_observation_context_required:server_authenticated_filesystem_observer_not_implemented",
    ]);
    const forgedFilesystemContext = {
      contextVersion:
        "nhm2_spherical_boson_star_v2_server_filesystem_observation_context/v1",
    };
    const forgedLoaderContext = {
      contextVersion:
        "nhm2_spherical_boson_star_v2_server_loader_observation_context/v1",
    };
    expect(
      isNhm2SphericalBosonStarV2ServerFilesystemObservationContext(
        forgedFilesystemContext,
      ),
    ).toBe(false);
    expect(
      isNhm2SphericalBosonStarV2ServerLoaderObservationContext(
        forgedLoaderContext,
      ),
    ).toBe(false);
    expect(() =>
      buildNhm2SphericalBosonStarV2PresealEvidence(
        evidence,
        forgedFilesystemContext as any,
        forgedLoaderContext as any,
      ),
    ).toThrow("server_filesystem_observation_context_required");
    const originalRaw = Buffer.from(context.rawPresealBytes);
    (context.rawPresealBytes as Uint8Array)[0] ^= 1;
    expect(
      nhm2SphericalBosonStarV2DiagnosticPresealEnvelopeViolations(
        context.preseal,
        context,
        originalRaw,
      ),
    ).toEqual([]);
    const changedRaw = Buffer.from(context.rawPresealBytes);
    changedRaw[changedRaw.length - 1] ^= 1;
    expect(
      nhm2SphericalBosonStarV2DiagnosticPresealEnvelopeViolations(
        context.preseal,
        context,
        changedRaw,
      ),
    ).not.toEqual([]);

    const forgedPayload = structuredClone(evidence);
    const payload = forgedPayload.staticInputByteEvidence.find(
      (item) => item.entry.semanticRole === "source_payload",
    )!;
    payload.rawBytes[0] ^= 1;
    expect(() =>
      deriveNhm2SphericalBosonStarV2DiagnosticPresealEvidence(forgedPayload),
    ).toThrow("static_byte_binding_mismatch");
    const incompleteScope = structuredClone(evidence) as any;
    incompleteScope.dirtyTreeRawEvidence.scopedPathspecs = ["src"];
    expect(() =>
      deriveNhm2SphericalBosonStarV2DiagnosticPresealEvidence(incompleteScope),
    ).toThrow("scope_incomplete");
    const invalidDate = structuredClone(evidence) as any;
    invalidDate.createdWallUtc = "2026-02-30T12:34:56.123456789Z";
    expect(() =>
      deriveNhm2SphericalBosonStarV2DiagnosticPresealEvidence(invalidDate),
    ).toThrow("preseal_evidence_invalid");
  });

  it("rebinds a diagnostic receipt to canonical bytes and post-preseal chronology", () => {
    const context =
      deriveNhm2SphericalBosonStarV2DiagnosticPresealEvidence(
        presealEvidence(),
      );
    const fixture = receiptEvidence(context);
    expect(
      nhm2SphericalBosonStarV2DiagnosticPresealPublicationReceiptViolations(
        fixture.receipt,
        context,
        fixture.rawReceiptBytes,
        fixture.rawTraceBytes,
      ),
    ).toEqual([]);
    expect(
      nhm2SphericalBosonStarV2DiagnosticPresealPublicationReceiptViolations(
        fixture.receipt,
        {} as any,
        fixture.rawReceiptBytes,
        fixture.rawTraceBytes,
      ),
    ).toEqual(["v2_preseal_receipt_derived_context_required"]);
    const forgedSyscallContext = {
      contextVersion:
        "nhm2_spherical_boson_star_v2_server_syscall_trace_context/v1",
    };
    expect(
      isNhm2SphericalBosonStarV2ServerSyscallTraceContext(forgedSyscallContext),
    ).toBe(false);
    expect(
      nhm2SphericalBosonStarV2PresealPublicationReceiptViolations(
        fixture.receipt,
        context as any,
        fixture.rawReceiptBytes,
        fixture.rawTraceBytes,
        forgedSyscallContext as any,
      ),
    ).toEqual([
      "v2_preseal_receipt_server_observation_context_required:server_authenticated_filesystem_observer_not_implemented",
    ]);

    const forgedTrace = Buffer.from(fixture.rawTraceBytes);
    forgedTrace[forgedTrace.indexOf(Buffer.from("renameat2"))] = "R".charCodeAt(
      0,
    );
    expect(
      nhm2SphericalBosonStarV2DiagnosticPresealPublicationReceiptViolations(
        fixture.receipt,
        context,
        fixture.rawReceiptBytes,
        forgedTrace,
      ),
    ).not.toEqual([]);
    const rawMismatch = Buffer.from(fixture.rawReceiptBytes);
    rawMismatch[rawMismatch.length - 1] ^= 1;
    expect(
      nhm2SphericalBosonStarV2DiagnosticPresealPublicationReceiptViolations(
        fixture.receipt,
        context,
        rawMismatch,
        fixture.rawTraceBytes,
      ),
    ).not.toEqual([]);

    const ctimeBackwards = structuredClone(fixture.receipt) as any;
    ctimeBackwards.finalFileStat.changeTimeNanoseconds = "99";
    ctimeBackwards.publicationReceiptSha256 =
      computeNhm2SphericalBosonStarV2PresealPublicationReceiptSha256(
        ctimeBackwards,
      );
    expect(
      nhm2SphericalBosonStarV2DiagnosticPresealPublicationReceiptViolations(
        ctimeBackwards,
        context,
        canonicalBytes(ctimeBackwards),
        fixture.rawTraceBytes,
      ),
    ).toEqual(["v2_preseal_receipt_semantics_invalid"]);
    const groupMode = structuredClone(fixture.receipt) as any;
    groupMode.temporaryFileStat.modeOctal = "0440";
    groupMode.finalFileStat.modeOctal = "0440";
    groupMode.publicationReceiptSha256 =
      computeNhm2SphericalBosonStarV2PresealPublicationReceiptSha256(groupMode);
    expect(
      nhm2SphericalBosonStarV2DiagnosticPresealPublicationReceiptViolations(
        groupMode,
        context,
        canonicalBytes(groupMode),
        fixture.rawTraceBytes,
      ),
    ).toEqual(["v2_preseal_receipt_semantics_invalid"]);

    const latePresealEvidence = presealEvidence() as any;
    latePresealEvidence.createdMonotonicRawNanoseconds = "1000040";
    const latePresealContext =
      deriveNhm2SphericalBosonStarV2DiagnosticPresealEvidence(
        latePresealEvidence,
      );
    const earlyPublication = receiptEvidence(latePresealContext);
    expect(
      nhm2SphericalBosonStarV2DiagnosticPresealPublicationReceiptViolations(
        earlyPublication.receipt,
        latePresealContext,
        earlyPublication.rawReceiptBytes,
        earlyPublication.rawTraceBytes,
      ),
    ).toEqual(["v2_preseal_receipt_semantics_invalid"]);
  });

  it("rejects hostile singleton copies without invoking accessors or proxy traps", () => {
    let traps = 0;
    const proxy = new Proxy(cloneProfile(), {
      ownKeys() {
        traps += 1;
        throw new Error("must not execute");
      },
    });
    expect(
      nhm2SphericalBosonStarV2PreexecutionProfileViolations(proxy)[0],
    ).toContain("surface");
    expect(traps).toBe(0);
    const accessor = cloneProfile();
    Object.defineProperty(accessor, "maturity", {
      enumerable: true,
      get() {
        traps += 1;
        throw new Error("must not execute");
      },
    });
    expect(
      nhm2SphericalBosonStarV2PreexecutionProfileViolations(accessor)[0],
    ).toContain("property");
    expect(traps).toBe(0);

    const evidence = presealEvidence() as any;
    Object.defineProperty(evidence.staticInputByteEvidence[0], "rawBytes", {
      enumerable: true,
      get() {
        traps += 1;
        throw new Error("must not execute");
      },
    });
    expect(() =>
      deriveNhm2SphericalBosonStarV2DiagnosticPresealEvidence(evidence),
    ).toThrow("static_byte_evidence_invalid");
    expect(traps).toBe(0);
  });
});
