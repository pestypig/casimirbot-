import { createHash } from "node:crypto";

export const NHM2_FORMAL_KERNEL_REPLAY_MANIFEST_ARTIFACT_ID =
  "nhm2.formal_kernel_replay_manifest" as const;
export const NHM2_FORMAL_KERNEL_REPLAY_MANIFEST_CONTRACT_VERSION =
  "nhm2_formal_kernel_replay_manifest/v1" as const;

export const NHM2_FORMAL_KERNEL_REPLAY_SOURCE_LEDGER_CONTRACT_VERSION =
  "nhm2_formal_kernel_pre_run_source_ledger/v1" as const;
export const NHM2_FORMAL_KERNEL_REPLAY_THEOREM_LEDGER_CONTRACT_VERSION =
  "nhm2_formal_kernel_theorem_replay_ledger/v1" as const;
export const NHM2_FORMAL_KERNEL_REPLAY_AXIOM_LEDGER_CONTRACT_VERSION =
  "nhm2_formal_kernel_used_axiom_ledger/v1" as const;
export const NHM2_FORMAL_KERNEL_REPLAY_ASSUMPTION_LEDGER_CONTRACT_VERSION =
  "nhm2_formal_kernel_used_assumption_ledger/v1" as const;

export const NHM2_FORMAL_KERNEL_REPLAY_MERKLE_ALGORITHM =
  "sha256_path_digest_binary_merkle_v1" as const;
export const NHM2_FORMAL_KERNEL_REPLAY_SOURCE_ORDERING =
  "utf8_path_bytes_ascending" as const;
export const NHM2_FORMAL_KERNEL_REPLAY_THEOREM_ORDERING =
  "utf8_theorem_id_bytes_ascending" as const;
export const NHM2_FORMAL_KERNEL_REPLAY_AXIOM_ORDERING =
  "utf8_axiom_id_bytes_ascending" as const;
export const NHM2_FORMAL_KERNEL_REPLAY_ASSUMPTION_ORDERING =
  "utf8_assumption_id_bytes_ascending" as const;

export const NHM2_FORMAL_MANIFEST_CERTIFICATE_CLAIM_LOCK_THEOREM_ID =
  "nhm2_pre_experimental_claim_locks" as const;
export const NHM2_FORMAL_MANIFEST_CERTIFICATE_CLAIM_LOCK_PROPOSITION =
  "physical_viability = false /\\ transport = false /\\ propulsion = false /\\ route_eta = false /\\ certified_speed = false /\\ empirical_receipts_required = true" as const;

/**
 * Frozen binary Merkle construction.
 *
 * - Entries are already ordered by raw UTF-8 path bytes.
 * - A leaf is SHA-256(0x00 || uint32be(pathByteLength) || pathUtf8 ||
 *   sha256DigestBytes).
 * - A parent is SHA-256(0x01 || leftDigestBytes || rightDigestBytes).
 * - An unpaired node is paired with itself at every level.
 * - Empty ledgers are forbidden; a one-leaf root is that leaf digest.
 */
export const NHM2_FORMAL_KERNEL_REPLAY_MERKLE_SPEC = Object.freeze({
  algorithm: NHM2_FORMAL_KERNEL_REPLAY_MERKLE_ALGORITHM,
  digest: "sha256" as const,
  sourceOrdering: NHM2_FORMAL_KERNEL_REPLAY_SOURCE_ORDERING,
  leafDomainByte: 0x00 as const,
  parentDomainByte: 0x01 as const,
  pathLengthEncoding: "uint32_big_endian" as const,
  oddNodeRule: "duplicate_last" as const,
  emptyLedger: "forbidden" as const,
});

export type Nhm2FormalKernelReplayArtifactRefV1 = {
  path: string;
  sha256: string;
};

export type Nhm2FormalKernelReplayIdentityV1 = {
  candidateId: string;
  candidateManifestSha256: string;
  requestId: string;
  runId: string;
  runtimeId: string;
  sourceCommitSha: string;
};

export type Nhm2FormalKernelReplayTheoremEntryV1 = {
  theoremId: string;
  proposition: string;
  propositionSha256: string;
  proofArtifact: Nhm2FormalKernelReplayArtifactRefV1;
  transcriptArtifact: Nhm2FormalKernelReplayArtifactRefV1;
  usedAxiomIds: string[];
  usedAssumptionIds: string[];
  replayResult: "proved";
};

export type Nhm2FormalKernelReplayUsedAxiomV1 = {
  axiomId: string;
  typeStatement: string;
  typeStatementSha256: string;
  usedByTheoremIds: string[];
};

export type Nhm2FormalKernelReplayUsedAssumptionV1 = {
  assumptionId: string;
  kind: "typed_hypothesis" | "definition" | "empirical_placeholder";
  valueType:
    | "proposition"
    | "real"
    | "integer"
    | "tensor"
    | "worldline"
    | "artifact_hash";
  typeStatement: string;
  typeStatementSha256: string;
  sourceArtifact: Nhm2FormalKernelReplayArtifactRefV1;
  usedByTheoremIds: string[];
};

export type Nhm2FormalKernelReplayManifestV1 = {
  artifactId: typeof NHM2_FORMAL_KERNEL_REPLAY_MANIFEST_ARTIFACT_ID;
  contractVersion: typeof NHM2_FORMAL_KERNEL_REPLAY_MANIFEST_CONTRACT_VERSION;
  generatedAt: string;
  identity: Nhm2FormalKernelReplayIdentityV1;
  preRunSourceCommitment: {
    frozenBeforeReplay: true;
    ordering: typeof NHM2_FORMAL_KERNEL_REPLAY_SOURCE_ORDERING;
    merkleAlgorithm: typeof NHM2_FORMAL_KERNEL_REPLAY_MERKLE_ALGORITHM;
    entries: Nhm2FormalKernelReplayArtifactRefV1[];
    merkleRootSha256: string;
    ledgerArtifact: Nhm2FormalKernelReplayArtifactRefV1;
  };
  kernel: {
    proofAssistant: "Lean";
    kernelId: string;
    kernelVersion: string;
    binary: Nhm2FormalKernelReplayArtifactRefV1;
    environmentLock: Nhm2FormalKernelReplayArtifactRefV1;
  };
  theoremReplay: {
    ordering: typeof NHM2_FORMAL_KERNEL_REPLAY_THEOREM_ORDERING;
    expectedTheoremCount: number;
    replayedTheoremCount: number;
    entries: Nhm2FormalKernelReplayTheoremEntryV1[];
    ledgerArtifact: Nhm2FormalKernelReplayArtifactRefV1;
  };
  dependencyLedgers: {
    axiomOrdering: typeof NHM2_FORMAL_KERNEL_REPLAY_AXIOM_ORDERING;
    assumptionOrdering: typeof NHM2_FORMAL_KERNEL_REPLAY_ASSUMPTION_ORDERING;
    usedAxioms: Nhm2FormalKernelReplayUsedAxiomV1[];
    usedAssumptions: Nhm2FormalKernelReplayUsedAssumptionV1[];
    usedAxiomLedgerArtifact: Nhm2FormalKernelReplayArtifactRefV1;
    usedAssumptionLedgerArtifact: Nhm2FormalKernelReplayArtifactRefV1;
  };
  replay: {
    mode: "external_pinned_lean_kernel";
    exitCode: 0;
    aggregateTranscript: Nhm2FormalKernelReplayArtifactRefV1;
  };
  claimLock: {
    theoremId: typeof NHM2_FORMAL_MANIFEST_CERTIFICATE_CLAIM_LOCK_THEOREM_ID;
    proposition: typeof NHM2_FORMAL_MANIFEST_CERTIFICATE_CLAIM_LOCK_PROPOSITION;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
    routeEtaClaimAllowed: false;
    speedAuthorityClaimAllowed: false;
    empiricalReceiptsRequired: true;
  };
  claimBoundary: {
    formalReplayEvidenceOnly: true;
    contractVerifierInvokesLean: false;
    processReceiptRequiredForRuntimeClaim: true;
    physicsProved: false;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
    routeEtaClaimAllowed: false;
    speedAuthorityClaimAllowed: false;
  };
};

export type Nhm2FormalKernelReplayExpectedBindingsV1 = {
  manifestArtifact: Nhm2FormalKernelReplayArtifactRefV1;
  identity: Nhm2FormalKernelReplayIdentityV1;
  preRunSources: Nhm2FormalKernelReplayArtifactRefV1[];
  kernel: Nhm2FormalKernelReplayManifestV1["kernel"];
  theorems: Nhm2FormalKernelReplayTheoremEntryV1[];
  usedAxioms: Nhm2FormalKernelReplayUsedAxiomV1[];
  usedAssumptions: Nhm2FormalKernelReplayUsedAssumptionV1[];
};

export type Nhm2FormalKernelReplayArtifactReader = (
  path: string,
) => Uint8Array | string | null | undefined;

export type Nhm2FormalKernelReplayVerificationV1 = {
  contractVersion: typeof NHM2_FORMAL_KERNEL_REPLAY_MANIFEST_CONTRACT_VERSION;
  valid: boolean;
  structureValid: boolean;
  expectedBindingsValid: boolean;
  artifactContentValid: boolean;
  blockers: string[];
  verifierExecution: {
    invokedLean: false;
    verifiedProcessReceipt: false;
    checkedReferencedArtifactBytes: true;
  };
  claimBoundary: Nhm2FormalKernelReplayManifestV1["claimBoundary"];
};

const SHA256 = /^[a-f0-9]{64}$/;
const GIT_SHA = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;
const IDENTIFIER = /^[A-Za-z][A-Za-z0-9_.-]*$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const hasOnlyKeys = (
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean =>
  Object.keys(value).length === keys.length &&
  Object.keys(value).every((key) => keys.includes(key));

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && value.trim() === value;

const isPortablePath = (value: unknown): value is string => {
  if (!isText(value)) return false;
  if (
    value.includes("\\") ||
    value.startsWith("/") ||
    /^[a-z]:/i.test(value) ||
    /^[a-z][a-z0-9+.-]*:/i.test(value) ||
    /[?#*{}\[\]]/.test(value)
  )
    return false;
  return value
    .split("/")
    .every((segment) => segment !== "" && segment !== "." && segment !== "..");
};

const isIsoTimestamp = (value: unknown): value is string =>
  isText(value) &&
  Number.isFinite(Date.parse(value)) &&
  new Date(Date.parse(value)).toISOString() === value;

const compareUtf8 = (left: string, right: string): number =>
  Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));

const isStrictlyOrdered = <T>(
  entries: readonly T[],
  select: (entry: T) => string,
): boolean =>
  entries.every(
    (entry, index) =>
      index === 0 || compareUtf8(select(entries[index - 1]), select(entry)) < 0,
  );

const isSortedUniqueText = (values: readonly string[]): boolean =>
  values.every(isText) && isStrictlyOrdered(values, (value) => value);

const isArtifactRef = (
  value: unknown,
): value is Nhm2FormalKernelReplayArtifactRefV1 =>
  isRecord(value) &&
  hasOnlyKeys(value, ["path", "sha256"]) &&
  isPortablePath(value.path) &&
  typeof value.sha256 === "string" &&
  SHA256.test(value.sha256);

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!isRecord(value)) return Object.is(value, -0) ? 0 : value;
  return Object.fromEntries(
    Object.keys(value)
      .sort(compareUtf8)
      .map((key) => [key, canonicalize(value[key])]),
  );
};

export const canonicalNhm2FormalKernelReplayJson = (value: unknown): string =>
  JSON.stringify(canonicalize(value));

const sha256Bytes = (value: Uint8Array | string): string =>
  createHash("sha256").update(value).digest("hex");

export const sha256Nhm2FormalKernelReplayUtf8 = (value: string): string =>
  sha256Bytes(Buffer.from(value, "utf8"));

export const sha256Nhm2FormalKernelReplayCanonicalValue = (
  value: unknown,
): string =>
  sha256Nhm2FormalKernelReplayUtf8(canonicalNhm2FormalKernelReplayJson(value));

export const computeNhm2FormalKernelReplaySourceMerkleRoot = (
  entries: readonly Nhm2FormalKernelReplayArtifactRefV1[],
): string => {
  if (entries.length === 0)
    throw new Error("NHM2 formal replay source ledger must not be empty");
  if (
    !entries.every(isArtifactRef) ||
    !isStrictlyOrdered(entries, (entry) => entry.path)
  )
    throw new Error(
      "NHM2 formal replay source ledger must be valid and UTF-8 byte sorted",
    );

  let level = entries.map((entry) => {
    const path = Buffer.from(entry.path, "utf8");
    const length = Buffer.alloc(4);
    length.writeUInt32BE(path.length, 0);
    return createHash("sha256")
      .update(
        Buffer.from([NHM2_FORMAL_KERNEL_REPLAY_MERKLE_SPEC.leafDomainByte]),
      )
      .update(length)
      .update(path)
      .update(Buffer.from(entry.sha256, "hex"))
      .digest();
  });
  while (level.length > 1) {
    const next: Buffer[] = [];
    for (let index = 0; index < level.length; index += 2) {
      const left = level[index];
      const right = level[index + 1] ?? left;
      next.push(
        createHash("sha256")
          .update(
            Buffer.from([
              NHM2_FORMAL_KERNEL_REPLAY_MERKLE_SPEC.parentDomainByte,
            ]),
          )
          .update(left)
          .update(right)
          .digest(),
      );
    }
    level = next;
  }
  return level[0].toString("hex");
};

export const nhm2FormalKernelReplaySourceLedgerValue = (
  manifest: Nhm2FormalKernelReplayManifestV1,
) => ({
  contractVersion: NHM2_FORMAL_KERNEL_REPLAY_SOURCE_LEDGER_CONTRACT_VERSION,
  frozenBeforeReplay: true as const,
  ordering: NHM2_FORMAL_KERNEL_REPLAY_SOURCE_ORDERING,
  merkleAlgorithm: NHM2_FORMAL_KERNEL_REPLAY_MERKLE_ALGORITHM,
  merkleRootSha256: manifest.preRunSourceCommitment.merkleRootSha256,
  entries: manifest.preRunSourceCommitment.entries,
});

export const nhm2FormalKernelReplayTheoremLedgerValue = (
  manifest: Nhm2FormalKernelReplayManifestV1,
) => ({
  contractVersion: NHM2_FORMAL_KERNEL_REPLAY_THEOREM_LEDGER_CONTRACT_VERSION,
  ordering: NHM2_FORMAL_KERNEL_REPLAY_THEOREM_ORDERING,
  entries: manifest.theoremReplay.entries,
});

export const nhm2FormalKernelReplayAxiomLedgerValue = (
  manifest: Nhm2FormalKernelReplayManifestV1,
) => ({
  contractVersion: NHM2_FORMAL_KERNEL_REPLAY_AXIOM_LEDGER_CONTRACT_VERSION,
  ordering: NHM2_FORMAL_KERNEL_REPLAY_AXIOM_ORDERING,
  entries: manifest.dependencyLedgers.usedAxioms,
});

export const nhm2FormalKernelReplayAssumptionLedgerValue = (
  manifest: Nhm2FormalKernelReplayManifestV1,
) => ({
  contractVersion: NHM2_FORMAL_KERNEL_REPLAY_ASSUMPTION_LEDGER_CONTRACT_VERSION,
  ordering: NHM2_FORMAL_KERNEL_REPLAY_ASSUMPTION_ORDERING,
  entries: manifest.dependencyLedgers.usedAssumptions,
});

const validateIdentity = (value: unknown, blockers: string[]): void => {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      "candidateId",
      "candidateManifestSha256",
      "requestId",
      "runId",
      "runtimeId",
      "sourceCommitSha",
    ])
  ) {
    blockers.push("identity_shape_invalid");
    return;
  }
  for (const key of ["candidateId", "requestId", "runId", "runtimeId"])
    if (!isText(value[key])) blockers.push(`identity_${key}_invalid`);
  if (
    typeof value.candidateManifestSha256 !== "string" ||
    !SHA256.test(value.candidateManifestSha256)
  )
    blockers.push("identity_candidate_manifest_sha256_invalid");
  if (
    typeof value.sourceCommitSha !== "string" ||
    !GIT_SHA.test(value.sourceCommitSha)
  )
    blockers.push("identity_source_commit_sha_invalid");
};

const validateTheoremEntry = (
  value: unknown,
  blockers: string[],
): value is Nhm2FormalKernelReplayTheoremEntryV1 => {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      "theoremId",
      "proposition",
      "propositionSha256",
      "proofArtifact",
      "transcriptArtifact",
      "usedAxiomIds",
      "usedAssumptionIds",
      "replayResult",
    ])
  ) {
    blockers.push("theorem_entry_shape_invalid");
    return false;
  }
  let valid = true;
  if (!isText(value.theoremId) || !IDENTIFIER.test(value.theoremId)) {
    blockers.push("theorem_id_invalid");
    valid = false;
  }
  if (!isText(value.proposition)) {
    blockers.push("theorem_proposition_invalid");
    valid = false;
  } else if (
    value.propositionSha256 !==
    sha256Nhm2FormalKernelReplayUtf8(value.proposition)
  ) {
    blockers.push(`theorem_proposition_digest_mismatch:${value.theoremId}`);
    valid = false;
  }
  if (!isArtifactRef(value.proofArtifact)) {
    blockers.push(`theorem_proof_artifact_invalid:${value.theoremId}`);
    valid = false;
  }
  if (!isArtifactRef(value.transcriptArtifact)) {
    blockers.push(`theorem_transcript_artifact_invalid:${value.theoremId}`);
    valid = false;
  }
  if (
    !Array.isArray(value.usedAxiomIds) ||
    !isSortedUniqueText(value.usedAxiomIds)
  ) {
    blockers.push(`theorem_used_axiom_ids_not_exact:${value.theoremId}`);
    valid = false;
  }
  if (
    !Array.isArray(value.usedAssumptionIds) ||
    !isSortedUniqueText(value.usedAssumptionIds)
  ) {
    blockers.push(`theorem_used_assumption_ids_not_exact:${value.theoremId}`);
    valid = false;
  }
  if (value.replayResult !== "proved") {
    blockers.push(`theorem_not_replayed_as_proved:${value.theoremId}`);
    valid = false;
  }
  return valid;
};

const validateUsedAxiom = (
  value: unknown,
  blockers: string[],
): value is Nhm2FormalKernelReplayUsedAxiomV1 => {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      "axiomId",
      "typeStatement",
      "typeStatementSha256",
      "usedByTheoremIds",
    ])
  ) {
    blockers.push("used_axiom_shape_invalid");
    return false;
  }
  let valid = true;
  if (!isText(value.axiomId) || !IDENTIFIER.test(value.axiomId)) {
    blockers.push("used_axiom_id_invalid");
    valid = false;
  }
  if (!isText(value.typeStatement)) {
    blockers.push(`used_axiom_type_statement_invalid:${value.axiomId}`);
    valid = false;
  } else if (
    value.typeStatementSha256 !==
    sha256Nhm2FormalKernelReplayUtf8(value.typeStatement)
  ) {
    blockers.push(`used_axiom_type_digest_mismatch:${value.axiomId}`);
    valid = false;
  }
  if (
    !Array.isArray(value.usedByTheoremIds) ||
    value.usedByTheoremIds.length === 0 ||
    !isSortedUniqueText(value.usedByTheoremIds)
  ) {
    blockers.push(`used_axiom_theorem_ids_not_exact:${value.axiomId}`);
    valid = false;
  }
  return valid;
};

const ASSUMPTION_KINDS = new Set([
  "typed_hypothesis",
  "definition",
  "empirical_placeholder",
]);
const ASSUMPTION_VALUE_TYPES = new Set([
  "proposition",
  "real",
  "integer",
  "tensor",
  "worldline",
  "artifact_hash",
]);

const validateUsedAssumption = (
  value: unknown,
  blockers: string[],
): value is Nhm2FormalKernelReplayUsedAssumptionV1 => {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      "assumptionId",
      "kind",
      "valueType",
      "typeStatement",
      "typeStatementSha256",
      "sourceArtifact",
      "usedByTheoremIds",
    ])
  ) {
    blockers.push("used_assumption_shape_invalid");
    return false;
  }
  let valid = true;
  if (!isText(value.assumptionId) || !IDENTIFIER.test(value.assumptionId)) {
    blockers.push("used_assumption_id_invalid");
    valid = false;
  }
  if (!ASSUMPTION_KINDS.has(String(value.kind))) {
    blockers.push(`used_assumption_kind_invalid:${value.assumptionId}`);
    valid = false;
  }
  if (!ASSUMPTION_VALUE_TYPES.has(String(value.valueType))) {
    blockers.push(`used_assumption_value_type_invalid:${value.assumptionId}`);
    valid = false;
  }
  if (!isText(value.typeStatement)) {
    blockers.push(
      `used_assumption_type_statement_invalid:${value.assumptionId}`,
    );
    valid = false;
  } else if (
    value.typeStatementSha256 !==
    sha256Nhm2FormalKernelReplayUtf8(value.typeStatement)
  ) {
    blockers.push(`used_assumption_type_digest_mismatch:${value.assumptionId}`);
    valid = false;
  }
  if (!isArtifactRef(value.sourceArtifact)) {
    blockers.push(`used_assumption_source_invalid:${value.assumptionId}`);
    valid = false;
  }
  if (
    !Array.isArray(value.usedByTheoremIds) ||
    value.usedByTheoremIds.length === 0 ||
    !isSortedUniqueText(value.usedByTheoremIds)
  ) {
    blockers.push(
      `used_assumption_theorem_ids_not_exact:${value.assumptionId}`,
    );
    valid = false;
  }
  return valid;
};

const sameArtifact = (
  left: Nhm2FormalKernelReplayArtifactRefV1,
  right: Nhm2FormalKernelReplayArtifactRefV1,
): boolean => left.path === right.path && left.sha256 === right.sha256;

const canonicalSame = (left: unknown, right: unknown): boolean =>
  canonicalNhm2FormalKernelReplayJson(left) ===
  canonicalNhm2FormalKernelReplayJson(right);

export const nhm2FormalKernelReplayManifestBlockers = (
  value: unknown,
): string[] => {
  const blockers: string[] = [];
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      "artifactId",
      "contractVersion",
      "generatedAt",
      "identity",
      "preRunSourceCommitment",
      "kernel",
      "theoremReplay",
      "dependencyLedgers",
      "replay",
      "claimLock",
      "claimBoundary",
    ])
  )
    return ["manifest_shape_invalid"];
  if (value.artifactId !== NHM2_FORMAL_KERNEL_REPLAY_MANIFEST_ARTIFACT_ID)
    blockers.push("artifact_id_invalid");
  if (
    value.contractVersion !==
    NHM2_FORMAL_KERNEL_REPLAY_MANIFEST_CONTRACT_VERSION
  )
    blockers.push("contract_version_invalid");
  if (!isIsoTimestamp(value.generatedAt)) blockers.push("generated_at_invalid");
  validateIdentity(value.identity, blockers);

  const sources = isRecord(value.preRunSourceCommitment)
    ? value.preRunSourceCommitment
    : null;
  if (
    sources == null ||
    !hasOnlyKeys(sources, [
      "frozenBeforeReplay",
      "ordering",
      "merkleAlgorithm",
      "entries",
      "merkleRootSha256",
      "ledgerArtifact",
    ])
  ) {
    blockers.push("pre_run_source_commitment_shape_invalid");
  } else {
    if (sources.frozenBeforeReplay !== true)
      blockers.push("pre_run_sources_not_frozen_before_replay");
    if (sources.ordering !== NHM2_FORMAL_KERNEL_REPLAY_SOURCE_ORDERING)
      blockers.push("pre_run_source_ordering_invalid");
    if (sources.merkleAlgorithm !== NHM2_FORMAL_KERNEL_REPLAY_MERKLE_ALGORITHM)
      blockers.push("pre_run_source_merkle_algorithm_invalid");
    if (
      !Array.isArray(sources.entries) ||
      sources.entries.length === 0 ||
      !sources.entries.every(isArtifactRef)
    ) {
      blockers.push("pre_run_source_entries_invalid");
    } else {
      const entries = sources.entries as Nhm2FormalKernelReplayArtifactRefV1[];
      if (!isStrictlyOrdered(entries, (entry) => entry.path))
        blockers.push("pre_run_source_entries_not_exact_sorted_unique");
      else if (
        sources.merkleRootSha256 !==
        computeNhm2FormalKernelReplaySourceMerkleRoot(entries)
      )
        blockers.push("pre_run_source_merkle_root_mismatch");
    }
    if (!isArtifactRef(sources.ledgerArtifact))
      blockers.push("pre_run_source_ledger_artifact_invalid");
  }

  const kernel = isRecord(value.kernel) ? value.kernel : null;
  if (
    kernel == null ||
    !hasOnlyKeys(kernel, [
      "proofAssistant",
      "kernelId",
      "kernelVersion",
      "binary",
      "environmentLock",
    ])
  ) {
    blockers.push("kernel_shape_invalid");
  } else {
    if (kernel.proofAssistant !== "Lean") blockers.push("kernel_not_lean");
    if (!isText(kernel.kernelId)) blockers.push("kernel_id_invalid");
    if (!isText(kernel.kernelVersion)) blockers.push("kernel_version_invalid");
    if (!isArtifactRef(kernel.binary)) blockers.push("kernel_binary_invalid");
    if (!isArtifactRef(kernel.environmentLock))
      blockers.push("kernel_environment_lock_invalid");
  }

  const theoremReplay = isRecord(value.theoremReplay)
    ? value.theoremReplay
    : null;
  let theoremEntries: Nhm2FormalKernelReplayTheoremEntryV1[] = [];
  if (
    theoremReplay == null ||
    !hasOnlyKeys(theoremReplay, [
      "ordering",
      "expectedTheoremCount",
      "replayedTheoremCount",
      "entries",
      "ledgerArtifact",
    ])
  ) {
    blockers.push("theorem_replay_shape_invalid");
  } else {
    if (theoremReplay.ordering !== NHM2_FORMAL_KERNEL_REPLAY_THEOREM_ORDERING)
      blockers.push("theorem_ordering_invalid");
    if (!Array.isArray(theoremReplay.entries)) {
      blockers.push("theorem_entries_invalid");
    } else {
      theoremEntries = theoremReplay.entries.filter((entry) =>
        validateTheoremEntry(entry, blockers),
      );
      if (
        theoremEntries.length !== theoremReplay.entries.length ||
        theoremEntries.length === 0
      )
        blockers.push("theorem_entries_incomplete");
      if (!isStrictlyOrdered(theoremEntries, (entry) => entry.theoremId))
        blockers.push("theorem_entries_not_exact_sorted_unique");
      const proofPaths = theoremEntries.map(
        (entry) => entry.proofArtifact.path,
      );
      const transcriptPaths = theoremEntries.map(
        (entry) => entry.transcriptArtifact.path,
      );
      const allOutputPaths = [...proofPaths, ...transcriptPaths];
      if (new Set(allOutputPaths).size !== allOutputPaths.length)
        blockers.push("theorem_proof_or_transcript_path_reused");
    }
    if (
      !Number.isSafeInteger(theoremReplay.expectedTheoremCount) ||
      theoremReplay.expectedTheoremCount !== theoremEntries.length
    )
      blockers.push("expected_theorem_count_not_exact");
    if (
      !Number.isSafeInteger(theoremReplay.replayedTheoremCount) ||
      theoremReplay.replayedTheoremCount !== theoremEntries.length
    )
      blockers.push("replayed_theorem_count_not_exact");
    if (!isArtifactRef(theoremReplay.ledgerArtifact))
      blockers.push("theorem_ledger_artifact_invalid");
  }

  const dependencies = isRecord(value.dependencyLedgers)
    ? value.dependencyLedgers
    : null;
  let usedAxioms: Nhm2FormalKernelReplayUsedAxiomV1[] = [];
  let usedAssumptions: Nhm2FormalKernelReplayUsedAssumptionV1[] = [];
  if (
    dependencies == null ||
    !hasOnlyKeys(dependencies, [
      "axiomOrdering",
      "assumptionOrdering",
      "usedAxioms",
      "usedAssumptions",
      "usedAxiomLedgerArtifact",
      "usedAssumptionLedgerArtifact",
    ])
  ) {
    blockers.push("dependency_ledgers_shape_invalid");
  } else {
    if (dependencies.axiomOrdering !== NHM2_FORMAL_KERNEL_REPLAY_AXIOM_ORDERING)
      blockers.push("used_axiom_ordering_invalid");
    if (
      dependencies.assumptionOrdering !==
      NHM2_FORMAL_KERNEL_REPLAY_ASSUMPTION_ORDERING
    )
      blockers.push("used_assumption_ordering_invalid");
    if (!Array.isArray(dependencies.usedAxioms)) {
      blockers.push("used_axioms_invalid");
    } else {
      usedAxioms = dependencies.usedAxioms.filter((entry) =>
        validateUsedAxiom(entry, blockers),
      );
      if (usedAxioms.length !== dependencies.usedAxioms.length)
        blockers.push("used_axiom_entries_incomplete");
      if (!isStrictlyOrdered(usedAxioms, (entry) => entry.axiomId))
        blockers.push("used_axiom_entries_not_exact_sorted_unique");
    }
    if (!Array.isArray(dependencies.usedAssumptions)) {
      blockers.push("used_assumptions_invalid");
    } else {
      usedAssumptions = dependencies.usedAssumptions.filter((entry) =>
        validateUsedAssumption(entry, blockers),
      );
      if (usedAssumptions.length !== dependencies.usedAssumptions.length)
        blockers.push("used_assumption_entries_incomplete");
      if (!isStrictlyOrdered(usedAssumptions, (entry) => entry.assumptionId))
        blockers.push("used_assumption_entries_not_exact_sorted_unique");
    }
    if (!isArtifactRef(dependencies.usedAxiomLedgerArtifact))
      blockers.push("used_axiom_ledger_artifact_invalid");
    if (!isArtifactRef(dependencies.usedAssumptionLedgerArtifact))
      blockers.push("used_assumption_ledger_artifact_invalid");
  }

  const sourceEntries =
    sources != null &&
    Array.isArray(sources.entries) &&
    sources.entries.every(isArtifactRef)
      ? (sources.entries as Nhm2FormalKernelReplayArtifactRefV1[])
      : [];
  const sourceByPath = new Map(
    sourceEntries.map((entry) => [entry.path, entry]),
  );
  if (kernel != null && isArtifactRef(kernel.binary)) {
    const source = sourceByPath.get(kernel.binary.path);
    if (source == null || !sameArtifact(source, kernel.binary))
      blockers.push("kernel_binary_not_in_pre_run_source_ledger");
  }
  if (kernel != null && isArtifactRef(kernel.environmentLock)) {
    const source = sourceByPath.get(kernel.environmentLock.path);
    if (source == null || !sameArtifact(source, kernel.environmentLock))
      blockers.push("kernel_environment_lock_not_in_pre_run_source_ledger");
  }
  for (const assumption of usedAssumptions) {
    const source = sourceByPath.get(assumption.sourceArtifact.path);
    if (source == null || !sameArtifact(source, assumption.sourceArtifact))
      blockers.push(
        `used_assumption_source_not_in_pre_run_ledger:${assumption.assumptionId}`,
      );
  }

  const theoremIds = new Set(theoremEntries.map((entry) => entry.theoremId));
  const axiomById = new Map(usedAxioms.map((entry) => [entry.axiomId, entry]));
  const assumptionById = new Map(
    usedAssumptions.map((entry) => [entry.assumptionId, entry]),
  );
  for (const theorem of theoremEntries) {
    for (const axiomId of theorem.usedAxiomIds)
      if (!axiomById.has(axiomId))
        blockers.push(
          `theorem_used_axiom_unledgered:${theorem.theoremId}:${axiomId}`,
        );
    for (const assumptionId of theorem.usedAssumptionIds)
      if (!assumptionById.has(assumptionId))
        blockers.push(
          `theorem_used_assumption_unledgered:${theorem.theoremId}:${assumptionId}`,
        );
  }
  for (const axiom of usedAxioms) {
    const derived = theoremEntries
      .filter((theorem) => theorem.usedAxiomIds.includes(axiom.axiomId))
      .map((theorem) => theorem.theoremId);
    if (
      axiom.usedByTheoremIds.some((id) => !theoremIds.has(id)) ||
      !canonicalSame(axiom.usedByTheoremIds, derived)
    )
      blockers.push(`used_axiom_theorem_binding_mismatch:${axiom.axiomId}`);
  }
  for (const assumption of usedAssumptions) {
    const derived = theoremEntries
      .filter((theorem) =>
        theorem.usedAssumptionIds.includes(assumption.assumptionId),
      )
      .map((theorem) => theorem.theoremId);
    if (
      assumption.usedByTheoremIds.some((id) => !theoremIds.has(id)) ||
      !canonicalSame(assumption.usedByTheoremIds, derived)
    )
      blockers.push(
        `used_assumption_theorem_binding_mismatch:${assumption.assumptionId}`,
      );
  }

  const replay = isRecord(value.replay) ? value.replay : null;
  if (
    replay == null ||
    !hasOnlyKeys(replay, ["mode", "exitCode", "aggregateTranscript"])
  ) {
    blockers.push("replay_shape_invalid");
  } else {
    if (replay.mode !== "external_pinned_lean_kernel")
      blockers.push("replay_mode_invalid");
    if (replay.exitCode !== 0) blockers.push("kernel_replay_exit_not_zero");
    if (!isArtifactRef(replay.aggregateTranscript))
      blockers.push("aggregate_replay_transcript_invalid");
  }

  const claimLock = isRecord(value.claimLock) ? value.claimLock : null;
  if (
    claimLock == null ||
    !hasOnlyKeys(claimLock, [
      "theoremId",
      "proposition",
      "physicalViabilityClaimAllowed",
      "transportClaimAllowed",
      "propulsionClaimAllowed",
      "routeEtaClaimAllowed",
      "speedAuthorityClaimAllowed",
      "empiricalReceiptsRequired",
    ])
  ) {
    blockers.push("claim_lock_shape_invalid");
  } else {
    if (
      claimLock.theoremId !==
      NHM2_FORMAL_MANIFEST_CERTIFICATE_CLAIM_LOCK_THEOREM_ID
    )
      blockers.push("claim_lock_theorem_id_not_exact");
    if (
      claimLock.proposition !==
      NHM2_FORMAL_MANIFEST_CERTIFICATE_CLAIM_LOCK_PROPOSITION
    )
      blockers.push("claim_lock_proposition_not_exact");
    for (const key of [
      "physicalViabilityClaimAllowed",
      "transportClaimAllowed",
      "propulsionClaimAllowed",
      "routeEtaClaimAllowed",
      "speedAuthorityClaimAllowed",
    ])
      if (claimLock[key] !== false)
        blockers.push(`claim_lock_${key}_not_false`);
    if (claimLock.empiricalReceiptsRequired !== true)
      blockers.push("claim_lock_empirical_receipts_not_required");
  }
  const claimTheorem = theoremEntries.find(
    (entry) =>
      entry.theoremId ===
      NHM2_FORMAL_MANIFEST_CERTIFICATE_CLAIM_LOCK_THEOREM_ID,
  );
  if (claimTheorem == null) blockers.push("claim_lock_theorem_not_replayed");
  else if (
    claimTheorem.proposition !==
      NHM2_FORMAL_MANIFEST_CERTIFICATE_CLAIM_LOCK_PROPOSITION ||
    claimTheorem.propositionSha256 !==
      sha256Nhm2FormalKernelReplayUtf8(
        NHM2_FORMAL_MANIFEST_CERTIFICATE_CLAIM_LOCK_PROPOSITION,
      )
  )
    blockers.push("claim_lock_theorem_proposition_not_exact");

  const boundary = isRecord(value.claimBoundary) ? value.claimBoundary : null;
  const expectedBoundary: Nhm2FormalKernelReplayManifestV1["claimBoundary"] = {
    formalReplayEvidenceOnly: true,
    contractVerifierInvokesLean: false,
    processReceiptRequiredForRuntimeClaim: true,
    physicsProved: false,
    physicalViabilityClaimAllowed: false,
    transportClaimAllowed: false,
    propulsionClaimAllowed: false,
    routeEtaClaimAllowed: false,
    speedAuthorityClaimAllowed: false,
  };
  if (boundary == null || !canonicalSame(boundary, expectedBoundary))
    blockers.push("claim_boundary_not_exact");

  if (blockers.length === 0) {
    const manifest = value as Nhm2FormalKernelReplayManifestV1;
    const derivedArtifacts = [
      [
        manifest.preRunSourceCommitment.ledgerArtifact,
        nhm2FormalKernelReplaySourceLedgerValue(manifest),
        "pre_run_source_ledger_digest_mismatch",
      ],
      [
        manifest.theoremReplay.ledgerArtifact,
        nhm2FormalKernelReplayTheoremLedgerValue(manifest),
        "theorem_ledger_digest_mismatch",
      ],
      [
        manifest.dependencyLedgers.usedAxiomLedgerArtifact,
        nhm2FormalKernelReplayAxiomLedgerValue(manifest),
        "used_axiom_ledger_digest_mismatch",
      ],
      [
        manifest.dependencyLedgers.usedAssumptionLedgerArtifact,
        nhm2FormalKernelReplayAssumptionLedgerValue(manifest),
        "used_assumption_ledger_digest_mismatch",
      ],
    ] as const;
    for (const [artifact, ledgerValue, blocker] of derivedArtifacts)
      if (
        artifact.sha256 !==
        sha256Nhm2FormalKernelReplayCanonicalValue(ledgerValue)
      )
        blockers.push(blocker);
  }
  return [...new Set(blockers)];
};

export const isNhm2FormalKernelReplayManifest = (
  value: unknown,
): value is Nhm2FormalKernelReplayManifestV1 =>
  nhm2FormalKernelReplayManifestBlockers(value).length === 0;

const expectedBindingsBlockers = (
  expected: Nhm2FormalKernelReplayExpectedBindingsV1,
  manifest: Nhm2FormalKernelReplayManifestV1,
): string[] => {
  const blockers: string[] = [];
  if (!isArtifactRef(expected.manifestArtifact))
    blockers.push("expected_manifest_artifact_invalid");
  if (!canonicalSame(expected.identity, manifest.identity))
    blockers.push("expected_identity_mismatch");
  if (
    !Array.isArray(expected.preRunSources) ||
    !expected.preRunSources.every(isArtifactRef) ||
    !isStrictlyOrdered(expected.preRunSources, (entry) => entry.path)
  )
    blockers.push("expected_pre_run_sources_invalid");
  else if (
    !canonicalSame(
      expected.preRunSources,
      manifest.preRunSourceCommitment.entries,
    )
  )
    blockers.push("expected_pre_run_sources_mismatch");
  if (!canonicalSame(expected.kernel, manifest.kernel))
    blockers.push("expected_kernel_binding_mismatch");
  if (!canonicalSame(expected.theorems, manifest.theoremReplay.entries))
    blockers.push("expected_theorem_scope_mismatch");
  if (
    !canonicalSame(expected.usedAxioms, manifest.dependencyLedgers.usedAxioms)
  )
    blockers.push("expected_used_axiom_ledger_mismatch");
  if (
    !canonicalSame(
      expected.usedAssumptions,
      manifest.dependencyLedgers.usedAssumptions,
    )
  )
    blockers.push("expected_used_assumption_ledger_mismatch");
  return blockers;
};

const toBuffer = (value: Uint8Array | string): Buffer =>
  typeof value === "string"
    ? Buffer.from(value, "utf8")
    : Buffer.from(value.buffer, value.byteOffset, value.byteLength);

export const verifyNhm2FormalKernelReplayManifest = (input: {
  manifest: unknown;
  expected: Nhm2FormalKernelReplayExpectedBindingsV1;
  readArtifact: Nhm2FormalKernelReplayArtifactReader;
}): Nhm2FormalKernelReplayVerificationV1 => {
  const structureBlockers = nhm2FormalKernelReplayManifestBlockers(
    input.manifest,
  );
  const boundary: Nhm2FormalKernelReplayManifestV1["claimBoundary"] = {
    formalReplayEvidenceOnly: true,
    contractVerifierInvokesLean: false,
    processReceiptRequiredForRuntimeClaim: true,
    physicsProved: false,
    physicalViabilityClaimAllowed: false,
    transportClaimAllowed: false,
    propulsionClaimAllowed: false,
    routeEtaClaimAllowed: false,
    speedAuthorityClaimAllowed: false,
  };
  if (structureBlockers.length > 0) {
    return {
      contractVersion: NHM2_FORMAL_KERNEL_REPLAY_MANIFEST_CONTRACT_VERSION,
      valid: false,
      structureValid: false,
      expectedBindingsValid: false,
      artifactContentValid: false,
      blockers: structureBlockers,
      verifierExecution: {
        invokedLean: false,
        verifiedProcessReceipt: false,
        checkedReferencedArtifactBytes: true,
      },
      claimBoundary: boundary,
    };
  }

  const manifest = input.manifest as Nhm2FormalKernelReplayManifestV1;
  const bindingBlockers = expectedBindingsBlockers(input.expected, manifest);
  const contentBlockers: string[] = [];
  const cache = new Map<string, Buffer | null>();
  const read = (path: string): Buffer | null => {
    if (cache.has(path)) return cache.get(path) ?? null;
    try {
      const value = input.readArtifact(path);
      const bytes = value == null ? null : toBuffer(value);
      cache.set(path, bytes);
      return bytes;
    } catch {
      cache.set(path, null);
      contentBlockers.push(`artifact_read_failed:${path}`);
      return null;
    }
  };
  const checkArtifact = (
    artifact: Nhm2FormalKernelReplayArtifactRefV1,
    canonicalValue?: unknown,
  ): void => {
    const bytes = read(artifact.path);
    if (bytes == null) {
      contentBlockers.push(`artifact_missing:${artifact.path}`);
      return;
    }
    if (sha256Bytes(bytes) !== artifact.sha256)
      contentBlockers.push(`artifact_sha256_mismatch:${artifact.path}`);
    if (
      canonicalValue !== undefined &&
      !bytes.equals(
        Buffer.from(
          canonicalNhm2FormalKernelReplayJson(canonicalValue),
          "utf8",
        ),
      )
    )
      contentBlockers.push(
        `artifact_canonical_content_mismatch:${artifact.path}`,
      );
  };

  checkArtifact(input.expected.manifestArtifact, manifest);
  for (const artifact of manifest.preRunSourceCommitment.entries)
    checkArtifact(artifact);
  checkArtifact(
    manifest.preRunSourceCommitment.ledgerArtifact,
    nhm2FormalKernelReplaySourceLedgerValue(manifest),
  );
  checkArtifact(manifest.kernel.binary);
  checkArtifact(manifest.kernel.environmentLock);
  checkArtifact(
    manifest.theoremReplay.ledgerArtifact,
    nhm2FormalKernelReplayTheoremLedgerValue(manifest),
  );
  for (const theorem of manifest.theoremReplay.entries) {
    checkArtifact(theorem.proofArtifact);
    checkArtifact(theorem.transcriptArtifact);
  }
  checkArtifact(
    manifest.dependencyLedgers.usedAxiomLedgerArtifact,
    nhm2FormalKernelReplayAxiomLedgerValue(manifest),
  );
  checkArtifact(
    manifest.dependencyLedgers.usedAssumptionLedgerArtifact,
    nhm2FormalKernelReplayAssumptionLedgerValue(manifest),
  );
  for (const assumption of manifest.dependencyLedgers.usedAssumptions)
    checkArtifact(assumption.sourceArtifact);
  checkArtifact(manifest.replay.aggregateTranscript);

  const blockers = [
    ...structureBlockers,
    ...bindingBlockers,
    ...contentBlockers,
  ];
  return {
    contractVersion: NHM2_FORMAL_KERNEL_REPLAY_MANIFEST_CONTRACT_VERSION,
    valid: blockers.length === 0,
    structureValid: structureBlockers.length === 0,
    expectedBindingsValid: bindingBlockers.length === 0,
    artifactContentValid: contentBlockers.length === 0,
    blockers: [...new Set(blockers)],
    verifierExecution: {
      invokedLean: false,
      verifiedProcessReceipt: false,
      checkedReferencedArtifactBytes: true,
    },
    claimBoundary: boundary,
  };
};
