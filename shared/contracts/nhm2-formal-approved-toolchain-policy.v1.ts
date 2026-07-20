import { createHash } from "node:crypto";

export const NHM2_FORMAL_APPROVED_TOOLCHAIN_POLICY_ARTIFACT_ID =
  "nhm2.formal_approved_toolchain_policy" as const;
export const NHM2_FORMAL_APPROVED_TOOLCHAIN_POLICY_CONTRACT_VERSION =
  "nhm2_formal_approved_toolchain_policy/v1" as const;
export const NHM2_FORMAL_APPROVED_TOOLCHAIN_POLICY_STATUS =
  "approved_for_diagnostic_formal_runtime_admission_only" as const;
export const NHM2_FORMAL_APPROVED_TOOLCHAIN_POLICY_AUTHORITY =
  "server_owned_immutable_allowlist" as const;

export const NHM2_FORMAL_APPROVED_LEAN_RELEASE = "4.31.0" as const;
export const NHM2_FORMAL_APPROVED_LEAN_COMMIT_SHA =
  "68218e876d2a38b1985b8590fff244a83c321783" as const;
export const NHM2_FORMAL_APPROVED_LAKE_RELEASE =
  "5.0.0-src+68218e8" as const;
export const NHM2_FORMAL_APPROVED_LAKE_LEAN_COMMIT_PREFIX =
  "68218e8" as const;

export const NHM2_FORMAL_APPROVED_LEAN_TOOLCHAIN_FILE = Object.freeze({
  path: "formal/lean/lean-toolchain" as const,
  sha256:
    "efac0b94923b2d8b6840cd35be9177ad0fc5ab2332f4f4311c98712cee92fdee" as const,
  sizeBytes: 25 as const,
  exactUtf8Line: "leanprover/lean4:v4.31.0" as const,
});

export const NHM2_FORMAL_APPROVED_TOOLCHAIN_LEDGER_ALGORITHM =
  "sha256_json_canonical_tuple_list/v1" as const;
export const NHM2_FORMAL_APPROVED_TOOLCHAIN_LEDGER_DOMAIN =
  "nhm2_formal_kernel_sealed_ledger/v1" as const;
export const NHM2_FORMAL_APPROVED_TOOLCHAIN_POLICY_SEMANTIC_DOMAIN =
  "nhm2_formal_approved_toolchain_policy_semantic/v1" as const;

export const NHM2_FORMAL_APPROVED_TOOLCHAIN_POLICY_LIMITS = Object.freeze({
  maxLedgerEntryCount: 250_000,
  maxLedgerEntryBytes: 512 * 1024 * 1024,
  maxLedgerAggregateBytes: 8 * 1024 * 1024 * 1024,
  maxRelativePathDepth: 64,
  maxRelativePathUtf8Bytes: 4 * 1024,
  maxEnvironmentEntryCount: 32,
  maxEnvironmentValueUtf8Bytes: 16 * 1024,
  maxPolicyIdUtf8Bytes: 256,
});

export const NHM2_FORMAL_APPROVED_TOOLCHAIN_CLAIM_BOUNDARY = Object.freeze({
  diagnosticToolchainAdmissionOnly: true as const,
  serverOwnedPolicySelectionRequired: true as const,
  toolchainIdentityFromApprovedHashesOnly: true as const,
  callerSuppliedReleaseLabelsAuthoritative: false as const,
  formalReplayExecutedByThisArtifact: false as const,
  formalProofEstablishedByThisArtifact: false as const,
  numericalPhysicsValidated: false as const,
  theoryClosureClaimAllowed: false as const,
  empiricalValidationEstablished: false as const,
  physicalViabilityClaimAllowed: false as const,
  transportClaimAllowed: false as const,
  propulsionClaimAllowed: false as const,
  routeEtaClaimAllowed: false as const,
  speedAuthorityClaimAllowed: false as const,
  operatingSystemHermeticityAsserted: false as const,
  filesystemSandboxAsserted: false as const,
});

export const NHM2_FORMAL_APPROVED_TOOLCHAIN_BLOCKERS = Object.freeze([
  "formal_replay_execution_receipt_required",
  "independent_formal_evidence_replay_required",
  "empirical_validation_required",
] as const);

export const NHM2_FORMAL_APPROVED_TOOLCHAIN_TARGETS = Object.freeze([
  {
    platform: "win32" as const,
    architecture: "x64" as const,
    leanTargetTriple: "x86_64-w64-windows-gnu" as const,
  },
  {
    platform: "linux" as const,
    architecture: "x64" as const,
    leanTargetTriple: "x86_64-unknown-linux-gnu" as const,
  },
  {
    platform: "linux" as const,
    architecture: "arm64" as const,
    leanTargetTriple: "aarch64-unknown-linux-gnu" as const,
  },
  {
    platform: "darwin" as const,
    architecture: "x64" as const,
    leanTargetTriple: "x86_64-apple-darwin" as const,
  },
  {
    platform: "darwin" as const,
    architecture: "arm64" as const,
    leanTargetTriple: "aarch64-apple-darwin" as const,
  },
] as const);

export type Nhm2FormalApprovedToolchainTargetV1 =
  (typeof NHM2_FORMAL_APPROVED_TOOLCHAIN_TARGETS)[number];

export type Nhm2FormalApprovedToolchainLedgerEntryV1 = {
  relativePath: string;
  sha256: string;
  sizeBytes: number;
};

export type Nhm2FormalApprovedToolchainExecutableV1 = {
  relativePath: string;
  sha256: string;
  sizeBytes: number;
};

export type Nhm2FormalApprovedToolchainEnvironmentEntryV1 = {
  name: string;
  value: string;
};

export type Nhm2FormalApprovedToolchainPolicyV1 = {
  artifactId: typeof NHM2_FORMAL_APPROVED_TOOLCHAIN_POLICY_ARTIFACT_ID;
  contractVersion: typeof NHM2_FORMAL_APPROVED_TOOLCHAIN_POLICY_CONTRACT_VERSION;
  policyId: string;
  semanticSha256: string;
  approvedAt: string;
  authority: typeof NHM2_FORMAL_APPROVED_TOOLCHAIN_POLICY_AUTHORITY;
  status: typeof NHM2_FORMAL_APPROVED_TOOLCHAIN_POLICY_STATUS;
  target: Nhm2FormalApprovedToolchainTargetV1;
  releases: {
    lean: {
      release: typeof NHM2_FORMAL_APPROVED_LEAN_RELEASE;
      commitSha: typeof NHM2_FORMAL_APPROVED_LEAN_COMMIT_SHA;
      buildProfile: "Release";
      exactVersionOutput: string;
    };
    lake: {
      release: typeof NHM2_FORMAL_APPROVED_LAKE_RELEASE;
      leanReleaseBinding: typeof NHM2_FORMAL_APPROVED_LEAN_RELEASE;
      leanCommitShaBinding: typeof NHM2_FORMAL_APPROVED_LEAN_COMMIT_SHA;
      leanCommitPrefixBinding: typeof NHM2_FORMAL_APPROVED_LAKE_LEAN_COMMIT_PREFIX;
      exactVersionOutput: string;
    };
  };
  formalProjectToolchainFile: typeof NHM2_FORMAL_APPROVED_LEAN_TOOLCHAIN_FILE;
  toolchainLedger: {
    rootIndependent: true;
    algorithm: typeof NHM2_FORMAL_APPROVED_TOOLCHAIN_LEDGER_ALGORITHM;
    domain: typeof NHM2_FORMAL_APPROVED_TOOLCHAIN_LEDGER_DOMAIN;
    kind: "toolchain";
    entries: Nhm2FormalApprovedToolchainLedgerEntryV1[];
    aggregateSha256: string;
    entryCount: number;
    aggregateBytes: number;
  };
  executables: {
    lean: Nhm2FormalApprovedToolchainExecutableV1;
    lake: Nhm2FormalApprovedToolchainExecutableV1;
  };
  approvedEnvironment: {
    allowlist: string[];
    values: Nhm2FormalApprovedToolchainEnvironmentEntryV1[];
  };
  blockers: [...typeof NHM2_FORMAL_APPROVED_TOOLCHAIN_BLOCKERS];
  claimBoundary: typeof NHM2_FORMAL_APPROVED_TOOLCHAIN_CLAIM_BOUNDARY;
};

export type Nhm2FormalApprovedToolchainPolicySemanticV1 = Omit<
  Nhm2FormalApprovedToolchainPolicyV1,
  "semanticSha256"
>;

export class Nhm2FormalApprovedToolchainPolicyContractError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "Nhm2FormalApprovedToolchainPolicyContractError";
    this.code = code;
  }
}

const SHA256 = /^[a-f0-9]{64}$/;
const POLICY_ID = /^[a-z0-9][a-z0-9._-]*$/;
const ENVIRONMENT_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;

const fail = (code: string, message: string): never => {
  throw new Nhm2FormalApprovedToolchainPolicyContractError(code, message);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasOnlyKeys = (
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean => {
  const actual = Object.keys(value).sort(compareUtf8);
  const sortedExpected = [...expected].sort(compareUtf8);
  return JSON.stringify(actual) === JSON.stringify(sortedExpected);
};

const utf8Bytes = (value: string): number => Buffer.byteLength(value, "utf8");

export const compareNhm2FormalApprovedToolchainUtf8 = (
  left: string,
  right: string,
): number => Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));

const compareUtf8 = compareNhm2FormalApprovedToolchainUtf8;

export const isNhm2FormalApprovedToolchainPortableRelativePath = (
  value: string,
): boolean =>
  value.length > 0 &&
  value.trim() === value &&
  utf8Bytes(value) <=
    NHM2_FORMAL_APPROVED_TOOLCHAIN_POLICY_LIMITS.maxRelativePathUtf8Bytes &&
  !value.includes("\\") &&
  !value.startsWith("/") &&
  !/^[A-Za-z]:/.test(value) &&
  !value.includes("\0") &&
  !/[\u0000-\u001f\u007f]/.test(value) &&
  value.split("/").length <=
    NHM2_FORMAL_APPROVED_TOOLCHAIN_POLICY_LIMITS.maxRelativePathDepth &&
  value
    .split("/")
    .every(
      (segment) =>
        segment.length > 0 && segment !== "." && segment !== "..",
    );

const exactSortedUnique = (
  values: readonly string[],
  caseInsensitive: boolean,
): boolean =>
  values.every(
    (value, index) => index === 0 || compareUtf8(values[index - 1], value) < 0,
  ) &&
  new Set(values.map((value) => (caseInsensitive ? value.toLowerCase() : value)))
    .size === values.length;

const exactIsoTimestamp = (value: unknown): value is string =>
  typeof value === "string" &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString() === value;

const exactTarget = (
  value: unknown,
): value is Nhm2FormalApprovedToolchainTargetV1 =>
  isRecord(value) &&
  hasOnlyKeys(value, ["architecture", "leanTargetTriple", "platform"]) &&
  NHM2_FORMAL_APPROVED_TOOLCHAIN_TARGETS.some(
    (target) =>
      value.platform === target.platform &&
      value.architecture === target.architecture &&
      value.leanTargetTriple === target.leanTargetTriple,
  );

const exactLeanVersionOutput = (
  target: Nhm2FormalApprovedToolchainTargetV1,
): string =>
  `Lean (version ${NHM2_FORMAL_APPROVED_LEAN_RELEASE}, ${target.leanTargetTriple}, commit ${NHM2_FORMAL_APPROVED_LEAN_COMMIT_SHA}, Release)`;

export const NHM2_FORMAL_APPROVED_LAKE_VERSION_OUTPUT =
  `Lake version ${NHM2_FORMAL_APPROVED_LAKE_RELEASE} (Lean version ${NHM2_FORMAL_APPROVED_LEAN_RELEASE})` as const;

const validateReleases = (
  value: unknown,
  target: Nhm2FormalApprovedToolchainTargetV1,
): void => {
  if (!isRecord(value)) {
    fail("release_schema_invalid", "Lean/Lake release bindings are malformed.");
  }
  const releases = value as Record<string, unknown>;
  if (
    !hasOnlyKeys(releases, ["lake", "lean"]) ||
    !isRecord(releases.lean) ||
    !hasOnlyKeys(releases.lean, [
      "buildProfile",
      "commitSha",
      "exactVersionOutput",
      "release",
    ]) ||
    !isRecord(releases.lake) ||
    !hasOnlyKeys(releases.lake, [
      "exactVersionOutput",
      "leanCommitPrefixBinding",
      "leanCommitShaBinding",
      "leanReleaseBinding",
      "release",
    ])
  ) {
    fail("release_schema_invalid", "Lean/Lake release bindings are malformed.");
  }
  const lean = releases.lean as Record<string, unknown>;
  const lake = releases.lake as Record<string, unknown>;
  if (lean.release !== NHM2_FORMAL_APPROVED_LEAN_RELEASE) {
    fail("lean_release_not_approved", "Lean release must be exactly 4.31.0.");
  }
  if (lean.commitSha !== NHM2_FORMAL_APPROVED_LEAN_COMMIT_SHA) {
    fail(
      "lean_commit_not_approved",
      "Lean commit does not match the approved 4.31.0 release commit.",
    );
  }
  if (
    lean.buildProfile !== "Release" ||
    lean.exactVersionOutput !== exactLeanVersionOutput(target)
  ) {
    fail(
      "lean_release_observation_not_approved",
      "Lean build profile or frozen version output is not approved.",
    );
  }
  if (lake.release !== NHM2_FORMAL_APPROVED_LAKE_RELEASE) {
    fail("lake_release_not_approved", "Lake release is not approved.");
  }
  if (
    lake.leanReleaseBinding !== NHM2_FORMAL_APPROVED_LEAN_RELEASE ||
    lake.leanCommitShaBinding !==
      NHM2_FORMAL_APPROVED_LEAN_COMMIT_SHA ||
    lake.leanCommitPrefixBinding !==
      NHM2_FORMAL_APPROVED_LAKE_LEAN_COMMIT_PREFIX ||
    lake.exactVersionOutput !==
      NHM2_FORMAL_APPROVED_LAKE_VERSION_OUTPUT
  ) {
    fail(
      "lake_lean_binding_not_approved",
      "Lake is not bound to the approved Lean release and commit.",
    );
  }
};

const validateFormalProjectToolchainFile = (value: unknown): void => {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ["exactUtf8Line", "path", "sha256", "sizeBytes"]) ||
    value.path !== NHM2_FORMAL_APPROVED_LEAN_TOOLCHAIN_FILE.path ||
    value.sha256 !== NHM2_FORMAL_APPROVED_LEAN_TOOLCHAIN_FILE.sha256 ||
    value.sizeBytes !== NHM2_FORMAL_APPROVED_LEAN_TOOLCHAIN_FILE.sizeBytes ||
    value.exactUtf8Line !==
      NHM2_FORMAL_APPROVED_LEAN_TOOLCHAIN_FILE.exactUtf8Line
  ) {
    fail(
      "formal_lean_toolchain_file_not_approved",
      "formal/lean/lean-toolchain must match its frozen 4.31.0 bytes.",
    );
  }
};

const isLedgerEntry = (
  value: unknown,
): value is Nhm2FormalApprovedToolchainLedgerEntryV1 =>
  isRecord(value) &&
  hasOnlyKeys(value, ["relativePath", "sha256", "sizeBytes"]) &&
  typeof value.relativePath === "string" &&
  isNhm2FormalApprovedToolchainPortableRelativePath(value.relativePath) &&
  typeof value.sha256 === "string" &&
  SHA256.test(value.sha256) &&
  Number.isSafeInteger(value.sizeBytes) &&
  (value.sizeBytes as number) >= 0 &&
  (value.sizeBytes as number) <=
    NHM2_FORMAL_APPROVED_TOOLCHAIN_POLICY_LIMITS.maxLedgerEntryBytes;

export function computeNhm2FormalApprovedToolchainLedgerSha256(
  entries: readonly Nhm2FormalApprovedToolchainLedgerEntryV1[],
): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        domain: NHM2_FORMAL_APPROVED_TOOLCHAIN_LEDGER_DOMAIN,
        kind: "toolchain",
        entries: entries.map((entry) => ({
          relativePath: entry.relativePath,
          sha256: entry.sha256,
          sizeBytes: entry.sizeBytes,
        })),
      }),
    )
    .digest("hex");
}

const validateLedger = (
  value: unknown,
): Nhm2FormalApprovedToolchainLedgerEntryV1[] => {
  if (!isRecord(value)) {
    fail(
      "toolchain_ledger_schema_invalid",
      "Approved toolchain ledger is malformed or exceeds its resource bounds.",
    );
  }
  const ledger = value as Record<string, unknown>;
  if (
    !hasOnlyKeys(ledger, [
      "aggregateBytes",
      "aggregateSha256",
      "algorithm",
      "domain",
      "entries",
      "entryCount",
      "kind",
      "rootIndependent",
    ]) ||
    ledger.rootIndependent !== true ||
    ledger.algorithm !== NHM2_FORMAL_APPROVED_TOOLCHAIN_LEDGER_ALGORITHM ||
    ledger.domain !== NHM2_FORMAL_APPROVED_TOOLCHAIN_LEDGER_DOMAIN ||
    ledger.kind !== "toolchain" ||
    !Array.isArray(ledger.entries) ||
    ledger.entries.length < 2 ||
    ledger.entries.length >
      NHM2_FORMAL_APPROVED_TOOLCHAIN_POLICY_LIMITS.maxLedgerEntryCount ||
    !ledger.entries.every(isLedgerEntry)
  ) {
    fail(
      "toolchain_ledger_schema_invalid",
      "Approved toolchain ledger is malformed or exceeds its resource bounds.",
    );
  }
  const entries = ledger.entries as Nhm2FormalApprovedToolchainLedgerEntryV1[];
  const paths = entries.map((entry) => entry.relativePath);
  if (!exactSortedUnique(paths, true)) {
    fail(
      "toolchain_ledger_paths_invalid",
      "Approved toolchain paths must be UTF-8 sorted, unique, and alias-free.",
    );
  }
  const aggregateBytes = entries.reduce(
    (total, entry) => total + entry.sizeBytes,
    0,
  );
  if (
    !Number.isSafeInteger(aggregateBytes) ||
    aggregateBytes >
      NHM2_FORMAL_APPROVED_TOOLCHAIN_POLICY_LIMITS.maxLedgerAggregateBytes ||
    ledger.entryCount !== entries.length ||
    ledger.aggregateBytes !== aggregateBytes ||
    ledger.aggregateSha256 !==
      computeNhm2FormalApprovedToolchainLedgerSha256(entries)
  ) {
    fail(
      "toolchain_ledger_commitment_invalid",
      "Approved toolchain digest, count, or aggregate bytes are not exact.",
    );
  }
  return entries;
};

const validateExecutable = (
  value: unknown,
  role: "lean" | "lake",
  entries: readonly Nhm2FormalApprovedToolchainLedgerEntryV1[],
): Nhm2FormalApprovedToolchainExecutableV1 => {
  if (!isRecord(value)) {
    fail(
      "toolchain_executable_invalid",
      `Approved ${role} executable binding is malformed.`,
    );
  }
  const executable = value as Record<string, unknown>;
  if (
    !hasOnlyKeys(executable, ["relativePath", "sha256", "sizeBytes"]) ||
    typeof executable.relativePath !== "string" ||
    !isNhm2FormalApprovedToolchainPortableRelativePath(
      executable.relativePath,
    ) ||
    typeof executable.sha256 !== "string" ||
    !SHA256.test(executable.sha256) ||
    !Number.isSafeInteger(executable.sizeBytes) ||
    (executable.sizeBytes as number) <= 0
  ) {
    fail(
      "toolchain_executable_invalid",
      `Approved ${role} executable binding is malformed.`,
    );
  }
  const matches = entries.filter(
    (entry) =>
      entry.relativePath === executable.relativePath &&
      entry.sha256 === executable.sha256 &&
      entry.sizeBytes === executable.sizeBytes,
  );
  if (matches.length !== 1) {
    fail(
      "toolchain_executable_not_ledger_bound",
      `Approved ${role} executable is not an exact ledger entry.`,
    );
  }
  return executable as Nhm2FormalApprovedToolchainExecutableV1;
};

const validateExecutables = (
  value: unknown,
  entries: readonly Nhm2FormalApprovedToolchainLedgerEntryV1[],
): void => {
  if (!isRecord(value)) {
    fail(
      "toolchain_executables_schema_invalid",
      "Approved Lean/Lake executable bindings are missing.",
    );
  }
  const executables = value as Record<string, unknown>;
  if (
    !hasOnlyKeys(executables, ["lake", "lean"])
  ) {
    fail(
      "toolchain_executables_schema_invalid",
      "Approved Lean/Lake executable bindings are missing.",
    );
  }
  const lean = validateExecutable(executables.lean, "lean", entries);
  const lake = validateExecutable(executables.lake, "lake", entries);
  const normalize = (candidate: string): string => candidate.toLowerCase();
  if (normalize(lean.relativePath) === normalize(lake.relativePath)) {
    fail(
      "toolchain_executable_alias",
      "Lean and Lake must be distinct approved ledger entries.",
    );
  }
};

const validateEnvironment = (value: unknown): void => {
  if (!isRecord(value)) {
    fail(
      "approved_environment_invalid",
      "Approved environment is malformed or exceeds its resource bounds.",
    );
  }
  const environment = value as Record<string, unknown>;
  if (
    !hasOnlyKeys(environment, ["allowlist", "values"]) ||
    !Array.isArray(environment.allowlist) ||
    !Array.isArray(environment.values) ||
    environment.allowlist.length >
      NHM2_FORMAL_APPROVED_TOOLCHAIN_POLICY_LIMITS.maxEnvironmentEntryCount ||
    environment.values.length !== environment.allowlist.length ||
    !environment.allowlist.every(
      (name) =>
        typeof name === "string" &&
        ENVIRONMENT_NAME.test(name) &&
        !name.includes("\0"),
    ) ||
    !environment.values.every(
      (entry) =>
        isRecord(entry) &&
        hasOnlyKeys(entry, ["name", "value"]) &&
        typeof entry.name === "string" &&
        typeof entry.value === "string" &&
        !entry.value.includes("\0") &&
        utf8Bytes(entry.value) <=
          NHM2_FORMAL_APPROVED_TOOLCHAIN_POLICY_LIMITS.maxEnvironmentValueUtf8Bytes,
    )
  ) {
    fail(
      "approved_environment_invalid",
      "Approved environment is malformed or exceeds its resource bounds.",
    );
  }
  const allowlist = environment.allowlist as string[];
  const values =
    environment.values as Nhm2FormalApprovedToolchainEnvironmentEntryV1[];
  if (
    !exactSortedUnique(allowlist, true) ||
    JSON.stringify(values.map((entry) => entry.name)) !==
      JSON.stringify(allowlist)
  ) {
    fail(
      "approved_environment_invalid",
      "Approved environment names must be UTF-8 sorted, unique, and exact.",
    );
  }
};

const exactObject = (value: unknown, expected: unknown): boolean =>
  JSON.stringify(value) === JSON.stringify(expected);

const semanticPayload = (
  policy: Nhm2FormalApprovedToolchainPolicySemanticV1,
): unknown => ({
  domain: NHM2_FORMAL_APPROVED_TOOLCHAIN_POLICY_SEMANTIC_DOMAIN,
  artifactId: policy.artifactId,
  contractVersion: policy.contractVersion,
  policyId: policy.policyId,
  approvedAt: policy.approvedAt,
  authority: policy.authority,
  status: policy.status,
  target: {
    platform: policy.target.platform,
    architecture: policy.target.architecture,
    leanTargetTriple: policy.target.leanTargetTriple,
  },
  releases: policy.releases,
  formalProjectToolchainFile: policy.formalProjectToolchainFile,
  toolchainLedger: {
    rootIndependent: policy.toolchainLedger.rootIndependent,
    algorithm: policy.toolchainLedger.algorithm,
    domain: policy.toolchainLedger.domain,
    kind: policy.toolchainLedger.kind,
    entries: policy.toolchainLedger.entries.map((entry) => ({
      relativePath: entry.relativePath,
      sha256: entry.sha256,
      sizeBytes: entry.sizeBytes,
    })),
    aggregateSha256: policy.toolchainLedger.aggregateSha256,
    entryCount: policy.toolchainLedger.entryCount,
    aggregateBytes: policy.toolchainLedger.aggregateBytes,
  },
  executables: policy.executables,
  approvedEnvironment: policy.approvedEnvironment,
  blockers: policy.blockers,
  claimBoundary: policy.claimBoundary,
});

export function computeNhm2FormalApprovedToolchainPolicySemanticSha256(
  policy: Nhm2FormalApprovedToolchainPolicySemanticV1,
): string {
  return createHash("sha256")
    .update(JSON.stringify(semanticPayload(policy)))
    .digest("hex");
}

export function assertNhm2FormalApprovedToolchainPolicy(
  value: unknown,
): asserts value is Nhm2FormalApprovedToolchainPolicyV1 {
  if (!isRecord(value)) {
    fail(
      "approved_toolchain_policy_schema_invalid",
      "Approved formal toolchain policy identity or target is invalid.",
    );
  }
  const record = value as Record<string, unknown>;
  if (
    !hasOnlyKeys(record, [
      "approvedAt",
      "approvedEnvironment",
      "artifactId",
      "authority",
      "blockers",
      "claimBoundary",
      "contractVersion",
      "executables",
      "formalProjectToolchainFile",
      "policyId",
      "releases",
      "semanticSha256",
      "status",
      "target",
      "toolchainLedger",
    ]) ||
    record.artifactId !== NHM2_FORMAL_APPROVED_TOOLCHAIN_POLICY_ARTIFACT_ID ||
    record.contractVersion !==
      NHM2_FORMAL_APPROVED_TOOLCHAIN_POLICY_CONTRACT_VERSION ||
    record.authority !== NHM2_FORMAL_APPROVED_TOOLCHAIN_POLICY_AUTHORITY ||
    record.status !== NHM2_FORMAL_APPROVED_TOOLCHAIN_POLICY_STATUS ||
    typeof record.policyId !== "string" ||
    !POLICY_ID.test(record.policyId) ||
    utf8Bytes(record.policyId) >
      NHM2_FORMAL_APPROVED_TOOLCHAIN_POLICY_LIMITS.maxPolicyIdUtf8Bytes ||
    !exactIsoTimestamp(record.approvedAt) ||
    typeof record.semanticSha256 !== "string" ||
    !SHA256.test(record.semanticSha256) ||
    !exactTarget(record.target)
  ) {
    fail(
      "approved_toolchain_policy_schema_invalid",
      "Approved formal toolchain policy identity or target is invalid.",
    );
  }
  const target = record.target as Nhm2FormalApprovedToolchainTargetV1;
  validateReleases(record.releases, target);
  validateFormalProjectToolchainFile(record.formalProjectToolchainFile);
  const entries = validateLedger(record.toolchainLedger);
  validateExecutables(record.executables, entries);
  validateEnvironment(record.approvedEnvironment);
  if (
    !exactObject(record.blockers, NHM2_FORMAL_APPROVED_TOOLCHAIN_BLOCKERS) ||
    !exactObject(
      record.claimBoundary,
      NHM2_FORMAL_APPROVED_TOOLCHAIN_CLAIM_BOUNDARY,
    )
  ) {
    fail(
      "approved_toolchain_claim_boundary_invalid",
      "Approved toolchain policy weakened its diagnostic-only claim boundary.",
    );
  }
  const policy = record as Nhm2FormalApprovedToolchainPolicyV1;
  const { semanticSha256: _semanticSha256, ...semantic } = policy;
  if (
    policy.semanticSha256 !==
    computeNhm2FormalApprovedToolchainPolicySemanticSha256(semantic)
  ) {
    fail(
      "approved_toolchain_policy_semantic_hash_mismatch",
      "Approved toolchain policy semantic commitment is invalid.",
    );
  }
}

export function isNhm2FormalApprovedToolchainPolicy(
  value: unknown,
): value is Nhm2FormalApprovedToolchainPolicyV1 {
  try {
    assertNhm2FormalApprovedToolchainPolicy(value);
    return true;
  } catch (error) {
    if (error instanceof Nhm2FormalApprovedToolchainPolicyContractError) {
      return false;
    }
    throw error;
  }
}
