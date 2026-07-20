import { createHash } from "node:crypto";
import { constants as fsConstants, type BigIntStats } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";

export const NHM2_SECURE_RUN_OUTPUT_READER_VERSION =
  "nhm2_secure_run_output_reader/v1" as const;

export const NHM2_SECURE_RUN_OUTPUT_READER_LIMITS = {
  maxFileCount: 256,
  maxPathDepth: 32,
  maxPathUtf8Bytes: 2_048,
  maxPathSegmentUtf8Bytes: 255,
  maxFloat64Rank: 8,
  // Comparison arrays should be streamed/reduced above this primitive. These
  // ceilings bound retained buffers to 128 MiB by default (plus one 16 MiB
  // final-replay buffer) and 256 MiB hard (plus one 64 MiB replay buffer).
  defaultMaxFileBytes: 16n * 1024n * 1024n,
  defaultMaxAggregateBytes: 128n * 1024n * 1024n,
  hardMaxFileBytes: 64n * 1024n * 1024n,
  hardMaxAggregateBytes: 256n * 1024n * 1024n,
} as const;

export const NHM2_SECURE_RUN_OUTPUT_READER_AUTHORITY_BLOCKERS = Object.freeze([
  "same_user_run_output_mutation_exclusion_not_os_enforced",
  "server_authorized_run_root_not_established",
  "run_output_freshness_not_assessed",
  "scientific_semantics_not_assessed",
  "independent_numerical_replay_not_established",
  "experiment_ready_theory_closure_not_established",
  "empirical_validation_not_established",
] as const);

export type Nhm2SecureRunOutputReaderAuthorityBlocker =
  (typeof NHM2_SECURE_RUN_OUTPUT_READER_AUTHORITY_BLOCKERS)[number];

export type Nhm2SecureRunOutputReaderErrorCode =
  | "reader_input_invalid"
  | "run_directory_not_absolute"
  | "run_directory_not_resolved"
  | "run_directory_network_or_device_forbidden"
  | "run_directory_is_filesystem_root"
  | "run_directory_unreadable"
  | "run_directory_not_directory"
  | "run_directory_symlink_or_reparse"
  | "run_directory_parent_unreadable"
  | "run_directory_parent_not_directory"
  | "run_directory_parent_symlink_or_reparse"
  | "run_directory_changed"
  | "test_hook_not_allowed"
  | "output_file_count_limit_exceeded"
  | "output_inventory_mismatch"
  | "output_path_invalid"
  | "output_path_case_fold_collision"
  | "output_expected_sha256_invalid"
  | "output_expected_size_invalid"
  | "output_resource_limit_exceeded"
  | "output_aggregate_limit_exceeded"
  | "output_float64_shape_invalid"
  | "output_float64_shape_mismatch"
  | "output_parent_unreadable"
  | "output_parent_not_directory"
  | "output_parent_symlink_or_reparse"
  | "output_parent_changed"
  | "output_entry_unreadable"
  | "output_entry_symlink_or_reparse"
  | "output_entry_not_regular"
  | "output_entry_hardlinked"
  | "output_realpath_mismatch"
  | "output_size_mismatch"
  | "output_open_failed"
  | "output_open_identity_mismatch"
  | "output_bounded_read_mismatch"
  | "output_changed_while_reading"
  | "output_read_failed"
  | "output_sha256_mismatch"
  | "output_float64_non_finite"
  | "output_changed_after_initial_read";

export class Nhm2SecureRunOutputReaderError extends Error {
  readonly code: Nhm2SecureRunOutputReaderErrorCode;
  readonly relativePath: string | null;
  readonly blockers: readonly [Nhm2SecureRunOutputReaderErrorCode];

  constructor(
    code: Nhm2SecureRunOutputReaderErrorCode,
    message: string,
    relativePath: string | null = null,
  ) {
    super(message);
    this.name = "Nhm2SecureRunOutputReaderError";
    this.code = code;
    this.relativePath = relativePath;
    this.blockers = Object.freeze([code] as const);
  }
}

export type Nhm2SecureRunOutputDecodeV1 =
  { kind: "bytes" } | { kind: "float64_le"; shape: readonly number[] };

export type Nhm2SecureRunOutputFileRequestV1 = {
  /** Slash-delimited portable path beneath the run directory. */
  relativePath: string;
  /** Lower-case hexadecimal SHA-256 supplied outside the output file. */
  expectedSha256: string;
  /** Exact byte length supplied outside the output file. */
  expectedSizeBytes: bigint;
  decode?: Nhm2SecureRunOutputDecodeV1;
};

export type Nhm2SecureRunOutputReaderTestHookContext = {
  phase: "initial" | "final_replay";
  relativePath: string;
  absolutePath: string;
};

export type Nhm2SecureRunOutputReaderInput = {
  /** A server-resolved absolute, run-specific directory; filesystem roots fail. */
  runDirectory: string;
  files: readonly Nhm2SecureRunOutputFileRequestV1[];
  maxFileBytes?: bigint;
  maxAggregateBytes?: bigint;
  /** Test-only race seam after open and before the first descriptor fstat. */
  afterFileDescriptorOpenBeforeStatForTesting?: (
    context: Nhm2SecureRunOutputReaderTestHookContext,
  ) => void | Promise<void>;
  /** Test-only race seam after fstat and before the bounded positional read. */
  afterFileOpenForTesting?: (
    context: Nhm2SecureRunOutputReaderTestHookContext,
  ) => void | Promise<void>;
  /** Test-only race seam; every requested file is securely reopened afterward. */
  afterInitialReadForTesting?: () => void | Promise<void>;
};

export type Nhm2SecureRunOutputFilesystemIdentityV1 = {
  readonly dev: string;
  readonly ino: string;
  readonly sizeBytes: string;
  readonly mtimeNs: string;
  readonly ctimeNs: string;
};

export type Nhm2SecureRunOutputReadFileV1 = {
  readonly relativePath: string;
  readonly absolutePath: string;
  readonly sha256: string;
  readonly sizeBytes: bigint;
  readonly bytes: Buffer;
  readonly decoded:
    | { readonly kind: "bytes" }
    | {
        readonly kind: "float64_le";
        readonly shape: readonly number[];
        readonly finiteValuesVerified: true;
      };
  readonly filesystemIdentity: Nhm2SecureRunOutputFilesystemIdentityV1;
};

export type Nhm2SecureRunOutputReaderClaimBoundary = {
  boundedFilesystemReadOnly: true;
  returnedRawBytesMutable: true;
  rawByteMutationInvalidatesSha256Binding: true;
  downstreamMustRehashRawBytesBeforeAuthorityUse: true;
  serverAuthorizedRunRootEstablished: false;
  runOutputFreshnessAssessed: false;
  scientificSemanticsAssessed: false;
  sameChartTensorClosureEstablished: false;
  independentNumericalReproductionEstablished: false;
  experimentReadyTheoryClosureClaimAllowed: false;
  empiricalValidationEstablished: false;
  physicalViabilityClaimAllowed: false;
  transportClaimAllowed: false;
  propulsionClaimAllowed: false;
  routeEtaClaimAllowed: false;
  speedAuthorityClaimAllowed: false;
};

export type Nhm2SecureRunOutputReadResultV1 = {
  contractVersion: typeof NHM2_SECURE_RUN_OUTPUT_READER_VERSION;
  readState: "bounded_bytes_read_authority_neutral";
  runDirectoryRealPath: string;
  aggregateSizeBytes: bigint;
  files: readonly Nhm2SecureRunOutputReadFileV1[];
  blockers: readonly Nhm2SecureRunOutputReaderAuthorityBlocker[];
  claimBoundary: Readonly<Nhm2SecureRunOutputReaderClaimBoundary>;
};

type FileIdentity = {
  dev: bigint;
  ino: bigint;
  mode: bigint;
  size: bigint;
  mtimeNs: bigint;
  ctimeNs: bigint;
  nlink: bigint;
};

type DirectoryGuard = {
  absolutePath: string;
  realPath: string;
  identity: FileIdentity;
  kind: "run_root" | "run_parent" | "output_parent";
};

type NormalizedFileRequest = {
  relativePath: string;
  expectedSha256: string;
  expectedSizeBytes: bigint;
  decode: Nhm2SecureRunOutputDecodeV1;
};

type SecureRead = {
  relativePath: string;
  absolutePath: string;
  sha256: string;
  sizeBytes: bigint;
  bytes: Buffer;
  identity: FileIdentity;
};

type InventoryEntry = {
  relativePath: string;
  kind: "directory" | "file";
  identity: FileIdentity;
};

const SHA256 = /^[a-f0-9]{64}$/;
const CONTROL_CHARACTER = /[\u0000-\u001f\u007f-\u009f]/;
const FORBIDDEN_PORTABLE_CHARACTER = /[<>"|*?{}\[\]]/;
const WINDOWS_RESERVED_SEGMENT =
  /^(?:con|prn|aux|nul|clock\$|com[1-9\u00b9\u00b2\u00b3]|lpt[1-9\u00b9\u00b2\u00b3])(?:\.|$)/i;
const TOP_LEVEL_INPUT_KEYS = new Set([
  "runDirectory",
  "files",
  "maxFileBytes",
  "maxAggregateBytes",
  "afterFileDescriptorOpenBeforeStatForTesting",
  "afterFileOpenForTesting",
  "afterInitialReadForTesting",
]);

export const NHM2_SECURE_RUN_OUTPUT_READER_CLAIM_BOUNDARY: Readonly<Nhm2SecureRunOutputReaderClaimBoundary> =
  Object.freeze({
    boundedFilesystemReadOnly: true,
    returnedRawBytesMutable: true,
    rawByteMutationInvalidatesSha256Binding: true,
    downstreamMustRehashRawBytesBeforeAuthorityUse: true,
    serverAuthorizedRunRootEstablished: false,
    runOutputFreshnessAssessed: false,
    scientificSemanticsAssessed: false,
    sameChartTensorClosureEstablished: false,
    independentNumericalReproductionEstablished: false,
    experimentReadyTheoryClosureClaimAllowed: false,
    empiricalValidationEstablished: false,
    physicalViabilityClaimAllowed: false,
    transportClaimAllowed: false,
    propulsionClaimAllowed: false,
    routeEtaClaimAllowed: false,
    speedAuthorityClaimAllowed: false,
  });

const fail = (
  code: Nhm2SecureRunOutputReaderErrorCode,
  message: string,
  relativePath: string | null = null,
): never => {
  throw new Nhm2SecureRunOutputReaderError(code, message, relativePath);
};

const utf8Compare = (left: string, right: string): number =>
  Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));

const normalizedFilesystemPath = (value: string): string => {
  const resolved = path.resolve(value);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
};

const sameFilesystemPath = (left: string, right: string): boolean =>
  normalizedFilesystemPath(left) === normalizedFilesystemPath(right);

const isInside = (root: string, candidate: string): boolean => {
  const relative = path.relative(root, candidate);
  return (
    relative.length === 0 ||
    (relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative))
  );
};

const sha256 = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");

const identity = (stat: BigIntStats): FileIdentity => ({
  dev: stat.dev,
  ino: stat.ino,
  mode: stat.mode,
  size: stat.size,
  mtimeNs: stat.mtimeNs,
  ctimeNs: stat.ctimeNs,
  nlink: stat.nlink,
});

const identitiesMatch = (left: FileIdentity, right: FileIdentity): boolean =>
  left.dev === right.dev &&
  left.ino === right.ino &&
  left.mode === right.mode &&
  left.size === right.size &&
  left.mtimeNs === right.mtimeNs &&
  left.ctimeNs === right.ctimeNs &&
  left.nlink === right.nlink;

const directoryObjectIdentityMatches = (
  left: FileIdentity,
  right: FileIdentity,
): boolean =>
  left.dev === right.dev && left.ino === right.ino && left.mode === right.mode;

const publicIdentity = (
  value: FileIdentity,
): Nhm2SecureRunOutputFilesystemIdentityV1 => ({
  dev: value.dev.toString(10),
  ino: value.ino.toString(10),
  sizeBytes: value.size.toString(10),
  mtimeNs: value.mtimeNs.toString(10),
  ctimeNs: value.ctimeNs.toString(10),
});

const isPortableRelativePath = (value: unknown): value is string => {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.trim() !== value ||
    value.normalize("NFC") !== value ||
    value.includes("\\") ||
    value.includes(":") ||
    CONTROL_CHARACTER.test(value) ||
    FORBIDDEN_PORTABLE_CHARACTER.test(value) ||
    path.posix.isAbsolute(value) ||
    path.win32.isAbsolute(value) ||
    /^[a-z]:/i.test(value) ||
    /^[/\\]{2}[?.][/\\]/.test(value)
  ) {
    return false;
  }
  const segments = value.split("/");
  if (
    segments.length > NHM2_SECURE_RUN_OUTPUT_READER_LIMITS.maxPathDepth ||
    Buffer.byteLength(value, "utf8") >
      NHM2_SECURE_RUN_OUTPUT_READER_LIMITS.maxPathUtf8Bytes
  ) {
    return false;
  }
  return segments.every(
    (segment) =>
      segment.length > 0 &&
      segment !== "." &&
      segment !== ".." &&
      !/[. ]$/.test(segment) &&
      !WINDOWS_RESERVED_SEGMENT.test(segment) &&
      Buffer.byteLength(segment, "utf8") <=
        NHM2_SECURE_RUN_OUTPUT_READER_LIMITS.maxPathSegmentUtf8Bytes,
  );
};

const caseFoldPortablePath = (value: string): string =>
  value.normalize("NFKC").toLocaleLowerCase("en-US");

const isPlainRecord = (value: object): boolean => {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const hasExactKeys = (value: object, expected: readonly string[]): boolean => {
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.some((key) => typeof key !== "string")) return false;
  const actual = (ownKeys as string[]).sort(utf8Compare);
  return isDeepStrictEqual(actual, [...expected].sort(utf8Compare));
};

const hasAllowedKeys = (input: {
  value: object;
  required: readonly string[];
  allowed: ReadonlySet<string>;
}): boolean => {
  const ownKeys = Reflect.ownKeys(input.value);
  if (
    ownKeys.some((key) => typeof key !== "string" || !input.allowed.has(key))
  ) {
    return false;
  }
  const strings = new Set(ownKeys as string[]);
  return input.required.every((key) => strings.has(key));
};

const exactResolvedAbsolutePath = (value: string): boolean =>
  path.isAbsolute(value) &&
  path.normalize(value) === value &&
  path.resolve(value) === value;

const isNetworkOrDeviceRootSyntax = (value: string): boolean =>
  /^(?:[/\\]{2}(?:[?.][/\\])?|\\[?][?]\\)/.test(value) ||
  /^(?:smb|nfs|afp|ftp|https?|file):\/\//i.test(value) ||
  path.win32.parse(value).root.startsWith("\\\\");

const fsCode = (error: unknown): string =>
  (error as NodeJS.ErrnoException).code ?? "unknown";

const lstatBigInt = async (
  absolutePath: string,
  code: Nhm2SecureRunOutputReaderErrorCode,
  label: string,
  relativePath: string | null = null,
): Promise<BigIntStats> => {
  try {
    return await fs.lstat(absolutePath, { bigint: true });
  } catch (error) {
    return fail(
      code,
      `${label} is unreadable (${fsCode(error)}).`,
      relativePath,
    );
  }
};

const realpathOrFail = async (
  absolutePath: string,
  code: Nhm2SecureRunOutputReaderErrorCode,
  label: string,
  relativePath: string | null = null,
): Promise<string> => {
  try {
    return await fs.realpath(absolutePath);
  } catch (error) {
    return fail(
      code,
      `${label} realpath is unreadable (${fsCode(error)}).`,
      relativePath,
    );
  }
};

const validateRunDirectory = async (
  runDirectory: unknown,
): Promise<{
  root: DirectoryGuard;
  parent: DirectoryGuard;
}> => {
  if (typeof runDirectory !== "string" || runDirectory.length === 0) {
    fail("reader_input_invalid", "runDirectory must be a non-empty string.");
  }
  const resolvedRunDirectory = runDirectory as string;
  if (isNetworkOrDeviceRootSyntax(resolvedRunDirectory)) {
    fail(
      "run_directory_network_or_device_forbidden",
      "UNC, device, URI, and lexical network run roots are forbidden.",
    );
  }
  if (!path.isAbsolute(resolvedRunDirectory)) {
    fail(
      "run_directory_not_absolute",
      "runDirectory must be an absolute path resolved by the server.",
    );
  }
  if (!exactResolvedAbsolutePath(resolvedRunDirectory)) {
    fail(
      "run_directory_not_resolved",
      "runDirectory must already be normalized and fully resolved.",
    );
  }
  const rootPath = resolvedRunDirectory;
  if (sameFilesystemPath(rootPath, path.parse(rootPath).root)) {
    fail(
      "run_directory_is_filesystem_root",
      "A filesystem root cannot be used as a run directory.",
    );
  }
  const parentPath = path.dirname(rootPath);
  if (sameFilesystemPath(parentPath, rootPath)) {
    fail(
      "run_directory_is_filesystem_root",
      "The run directory must have a distinct parent.",
    );
  }

  const parentStat = await lstatBigInt(
    parentPath,
    "run_directory_parent_unreadable",
    "Run-directory parent",
  );
  if (parentStat.isSymbolicLink()) {
    fail(
      "run_directory_parent_symlink_or_reparse",
      "Run-directory parent is a symbolic link or reparse point.",
    );
  }
  if (!parentStat.isDirectory()) {
    fail(
      "run_directory_parent_not_directory",
      "Run-directory parent is not a directory.",
    );
  }
  const parentRealPath = await realpathOrFail(
    parentPath,
    "run_directory_parent_unreadable",
    "Run-directory parent",
  );
  if (!sameFilesystemPath(parentPath, parentRealPath)) {
    fail(
      "run_directory_parent_symlink_or_reparse",
      "Run-directory parent resolves through an alias or reparse point.",
    );
  }

  const rootStat = await lstatBigInt(
    rootPath,
    "run_directory_unreadable",
    "Run directory",
  );
  if (rootStat.isSymbolicLink()) {
    fail(
      "run_directory_symlink_or_reparse",
      "Run directory is a symbolic link or reparse point.",
    );
  }
  if (!rootStat.isDirectory()) {
    fail("run_directory_not_directory", "Run directory is not a directory.");
  }
  const rootRealPath = await realpathOrFail(
    rootPath,
    "run_directory_unreadable",
    "Run directory",
  );
  if (!sameFilesystemPath(rootPath, rootRealPath)) {
    fail(
      "run_directory_symlink_or_reparse",
      "Run directory resolves through an alias or reparse point.",
    );
  }

  return {
    root: {
      absolutePath: rootPath,
      realPath: rootRealPath,
      identity: identity(rootStat),
      kind: "run_root",
    },
    parent: {
      absolutePath: parentPath,
      realPath: parentRealPath,
      identity: identity(parentStat),
      kind: "run_parent",
    },
  };
};

const assertDirectoryGuardStable = async (
  guard: DirectoryGuard,
): Promise<void> => {
  const code: Nhm2SecureRunOutputReaderErrorCode =
    guard.kind === "output_parent"
      ? "output_parent_changed"
      : "run_directory_changed";
  const stat = await lstatBigInt(guard.absolutePath, code, "Guarded directory");
  const realPath = await realpathOrFail(
    guard.absolutePath,
    code,
    "Guarded directory",
  );
  if (
    stat.isSymbolicLink() ||
    !stat.isDirectory() ||
    !sameFilesystemPath(realPath, guard.realPath) ||
    !(guard.kind === "run_parent"
      ? directoryObjectIdentityMatches(identity(stat), guard.identity)
      : identitiesMatch(identity(stat), guard.identity))
  ) {
    fail(code, "A guarded run-directory identity changed during replay.");
  }
};

const normalizeRequests = (input: {
  files: unknown;
  maxFileBytes: bigint;
  maxAggregateBytes: bigint;
}): { files: NormalizedFileRequest[]; aggregateSizeBytes: bigint } => {
  if (!Array.isArray(input.files) || input.files.length === 0) {
    fail("reader_input_invalid", "At least one output file is required.");
  }
  const rawFiles = input.files as unknown[];
  if (rawFiles.length > NHM2_SECURE_RUN_OUTPUT_READER_LIMITS.maxFileCount) {
    fail(
      "output_file_count_limit_exceeded",
      "Requested output file count exceeds the hard ceiling.",
    );
  }
  const foldedPaths = new Set<string>();
  const foldedPrefixes = new Map<
    string,
    { spelling: string; kind: "directory" | "file" }
  >();
  const normalized: NormalizedFileRequest[] = [];
  let aggregateSizeBytes = 0n;
  for (const raw of rawFiles) {
    if (
      raw == null ||
      typeof raw !== "object" ||
      Array.isArray(raw) ||
      !isPlainRecord(raw)
    ) {
      fail("reader_input_invalid", "Every output request must be an object.");
    }
    const request = raw as Partial<Nhm2SecureRunOutputFileRequestV1>;
    const requestKeys =
      "decode" in request
        ? ["decode", "expectedSha256", "expectedSizeBytes", "relativePath"]
        : ["expectedSha256", "expectedSizeBytes", "relativePath"];
    if (!hasExactKeys(request, requestKeys)) {
      fail(
        "reader_input_invalid",
        "Output request keys do not match the exact reader contract.",
      );
    }
    if (!isPortableRelativePath(request.relativePath)) {
      fail(
        "output_path_invalid",
        "Output path is not a bounded portable relative path.",
        typeof request.relativePath === "string" ? request.relativePath : null,
      );
    }
    const relativePath = request.relativePath as string;
    const segments = relativePath.split("/");
    for (let index = 0; index < segments.length; index += 1) {
      const prefix = segments.slice(0, index + 1).join("/");
      const foldedPrefix = caseFoldPortablePath(prefix);
      const kind = index === segments.length - 1 ? "file" : "directory";
      const prior = foldedPrefixes.get(foldedPrefix);
      if (prior != null && (prior.spelling !== prefix || prior.kind !== kind)) {
        fail(
          "output_path_case_fold_collision",
          "Output directory/file prefixes collide after portable case folding.",
          relativePath,
        );
      }
      foldedPrefixes.set(foldedPrefix, { spelling: prefix, kind });
    }
    const foldedPath = caseFoldPortablePath(relativePath);
    if (foldedPaths.has(foldedPath)) {
      fail(
        "output_path_case_fold_collision",
        "Output paths collide after portable case folding.",
        relativePath,
      );
    }
    foldedPaths.add(foldedPath);
    if (
      typeof request.expectedSha256 !== "string" ||
      !SHA256.test(request.expectedSha256)
    ) {
      fail(
        "output_expected_sha256_invalid",
        "Expected SHA-256 must be 64 lower-case hexadecimal characters.",
        relativePath,
      );
    }
    if (
      typeof request.expectedSizeBytes !== "bigint" ||
      request.expectedSizeBytes < 0n
    ) {
      fail(
        "output_expected_size_invalid",
        "Expected byte size must be a non-negative bigint.",
        request.relativePath,
      );
    }
    const expectedSha256 = request.expectedSha256 as string;
    const expectedSizeBytes = request.expectedSizeBytes as bigint;
    if (expectedSizeBytes > input.maxFileBytes) {
      fail(
        "output_resource_limit_exceeded",
        "Declared output size exceeds the configured per-file ceiling.",
        relativePath,
      );
    }
    aggregateSizeBytes += expectedSizeBytes;
    if (aggregateSizeBytes > input.maxAggregateBytes) {
      fail(
        "output_aggregate_limit_exceeded",
        "Declared output sizes exceed the configured aggregate ceiling.",
        relativePath,
      );
    }

    const decode = request.decode ?? { kind: "bytes" };
    if (
      decode == null ||
      typeof decode !== "object" ||
      Array.isArray(decode) ||
      !isPlainRecord(decode)
    ) {
      fail(
        "output_float64_shape_invalid",
        "Output decode declaration is invalid.",
        relativePath,
      );
    }
    if (decode.kind === "float64_le") {
      if (!hasExactKeys(decode, ["kind", "shape"])) {
        fail(
          "output_float64_shape_invalid",
          "Float64 decode keys do not match the exact reader contract.",
          relativePath,
        );
      }
      if (
        !Array.isArray(decode.shape) ||
        decode.shape.length === 0 ||
        decode.shape.length >
          NHM2_SECURE_RUN_OUTPUT_READER_LIMITS.maxFloat64Rank ||
        decode.shape.some(
          (dimension) => !Number.isSafeInteger(dimension) || dimension <= 0,
        )
      ) {
        fail(
          "output_float64_shape_invalid",
          "Float64 shape must contain bounded positive safe integers.",
          relativePath,
        );
      }
      const elementCount = decode.shape.reduce(
        (product, dimension) => product * BigInt(dimension),
        1n,
      );
      if (elementCount * 8n !== expectedSizeBytes) {
        fail(
          "output_float64_shape_mismatch",
          "Float64 shape does not exactly match the declared byte length.",
          relativePath,
        );
      }
    } else if (decode.kind === "bytes") {
      if (!hasExactKeys(decode, ["kind"])) {
        fail(
          "output_float64_shape_invalid",
          "Byte decode keys do not match the exact reader contract.",
          relativePath,
        );
      }
    } else {
      fail(
        "output_float64_shape_invalid",
        "Unknown output decode kind.",
        relativePath,
      );
    }
    normalized.push({
      relativePath,
      expectedSha256,
      expectedSizeBytes,
      decode:
        decode.kind === "float64_le"
          ? { kind: "float64_le", shape: [...decode.shape] }
          : { kind: "bytes" },
    });
  }
  normalized.sort((left, right) =>
    utf8Compare(left.relativePath, right.relativePath),
  );
  return { files: normalized, aggregateSizeBytes };
};

const expectedDirectories = (
  files: readonly NormalizedFileRequest[],
): Set<string> => {
  const directories = new Set<string>();
  for (const file of files) {
    const segments = file.relativePath.split("/");
    for (let index = 1; index < segments.length; index += 1) {
      directories.add(segments.slice(0, index).join("/"));
    }
  }
  return directories;
};

const snapshotExactInventory = async (input: {
  root: DirectoryGuard;
  files: readonly NormalizedFileRequest[];
}): Promise<InventoryEntry[]> => {
  const expectedFiles = new Set(input.files.map((file) => file.relativePath));
  const expectedDirs = expectedDirectories(input.files);
  const expectedEntryCount = expectedFiles.size + expectedDirs.size;
  const observedFiles = new Set<string>();
  const observedDirs = new Set<string>();
  const inventory: InventoryEntry[] = [];
  const pending = [""];

  while (pending.length > 0) {
    const relativeDirectory = pending.pop()!;
    const absoluteDirectory =
      relativeDirectory.length === 0
        ? input.root.absolutePath
        : path.join(input.root.absolutePath, ...relativeDirectory.split("/"));
    const directory = await fs
      .opendir(absoluteDirectory)
      .catch((error) =>
        fail(
          "output_inventory_mismatch",
          `Output inventory directory is unreadable (${fsCode(error)}).`,
          relativeDirectory || null,
        ),
      );
    const entries: Array<{ name: string; isDirectory: boolean }> = [];
    try {
      for await (const entry of directory) {
        entries.push({ name: entry.name, isDirectory: entry.isDirectory() });
        if (inventory.length + entries.length > expectedEntryCount) {
          fail(
            "output_inventory_mismatch",
            "Output inventory contains more entries than declared.",
            relativeDirectory || null,
          );
        }
      }
    } catch (error) {
      if (error instanceof Nhm2SecureRunOutputReaderError) throw error;
      fail(
        "output_inventory_mismatch",
        `Output inventory enumeration failed (${fsCode(error)}).`,
        relativeDirectory || null,
      );
    }
    entries.sort((left, right) => utf8Compare(left.name, right.name));
    for (const entry of entries) {
      const relativePath = relativeDirectory
        ? `${relativeDirectory}/${entry.name}`
        : entry.name;
      if (!isPortableRelativePath(relativePath)) {
        fail(
          "output_inventory_mismatch",
          "Output inventory contains a non-portable entry path.",
          relativePath,
        );
      }
      const absolutePath = path.join(absoluteDirectory, entry.name);
      const stat = await lstatBigInt(
        absolutePath,
        "output_inventory_mismatch",
        "Output inventory entry",
        relativePath,
      );
      if (stat.isSymbolicLink()) {
        fail(
          "output_inventory_mismatch",
          "Output inventory contains a symbolic link or reparse point.",
          relativePath,
        );
      }
      const realPath = await realpathOrFail(
        absolutePath,
        "output_inventory_mismatch",
        "Output inventory entry",
        relativePath,
      );
      const expectedRealPath = path.resolve(
        input.root.realPath,
        ...relativePath.split("/"),
      );
      if (
        !isInside(input.root.realPath, realPath) ||
        !sameFilesystemPath(absolutePath, realPath) ||
        !sameFilesystemPath(realPath, expectedRealPath)
      ) {
        fail(
          "output_inventory_mismatch",
          "Output inventory entry resolves through an alias or outside the run root.",
          relativePath,
        );
      }
      if (stat.isDirectory() && entry.isDirectory) {
        if (!expectedDirs.has(relativePath)) {
          fail(
            "output_inventory_mismatch",
            "Output inventory contains an undeclared directory.",
            relativePath,
          );
        }
        observedDirs.add(relativePath);
        pending.push(relativePath);
        inventory.push({
          relativePath,
          kind: "directory",
          identity: identity(stat),
        });
        continue;
      }
      if (!stat.isFile() || entry.isDirectory) {
        fail(
          "output_inventory_mismatch",
          "Output inventory contains a non-regular entry.",
          relativePath,
        );
      }
      if (!expectedFiles.has(relativePath)) {
        fail(
          "output_inventory_mismatch",
          "Output inventory contains an undeclared file.",
          relativePath,
        );
      }
      observedFiles.add(relativePath);
      inventory.push({
        relativePath,
        kind: "file",
        identity: identity(stat),
      });
    }
  }

  if (
    observedFiles.size !== expectedFiles.size ||
    observedDirs.size !== expectedDirs.size ||
    [...expectedFiles].some((entry) => !observedFiles.has(entry)) ||
    [...expectedDirs].some((entry) => !observedDirs.has(entry))
  ) {
    fail(
      "output_inventory_mismatch",
      "Output inventory has missing declared files or directories.",
    );
  }
  return inventory.sort((left, right) =>
    utf8Compare(left.relativePath, right.relativePath),
  );
};

const validateOutputParentChain = async (input: {
  root: DirectoryGuard;
  relativePath: string;
  guards: Map<string, DirectoryGuard>;
}): Promise<void> => {
  const segments = input.relativePath.split("/").slice(0, -1);
  let cursor = input.root.absolutePath;
  for (const segment of segments) {
    cursor = path.join(cursor, segment);
    if (input.guards.has(cursor)) continue;
    const stat = await lstatBigInt(
      cursor,
      "output_parent_unreadable",
      "Output parent",
      input.relativePath,
    );
    if (stat.isSymbolicLink()) {
      fail(
        "output_parent_symlink_or_reparse",
        "Output parent is a symbolic link or reparse point.",
        input.relativePath,
      );
    }
    if (!stat.isDirectory()) {
      fail(
        "output_parent_not_directory",
        "Output parent is not a directory.",
        input.relativePath,
      );
    }
    const realPath = await realpathOrFail(
      cursor,
      "output_parent_unreadable",
      "Output parent",
      input.relativePath,
    );
    const expectedRealPath = path.resolve(
      input.root.realPath,
      ...path.relative(input.root.absolutePath, cursor).split(path.sep),
    );
    if (
      !sameFilesystemPath(cursor, realPath) ||
      !sameFilesystemPath(realPath, expectedRealPath) ||
      !isInside(input.root.realPath, realPath)
    ) {
      fail(
        "output_parent_symlink_or_reparse",
        "Output parent resolves through an alias or outside its run root.",
        input.relativePath,
      );
    }
    input.guards.set(cursor, {
      absolutePath: cursor,
      realPath,
      identity: identity(stat),
      kind: "output_parent",
    });
  }
};

const readSecureFile = async (input: {
  root: DirectoryGuard;
  request: NormalizedFileRequest;
  phase: Nhm2SecureRunOutputReaderTestHookContext["phase"];
  afterFileDescriptorOpenBeforeStatForTesting?: Nhm2SecureRunOutputReaderInput["afterFileDescriptorOpenBeforeStatForTesting"];
  afterFileOpenForTesting?: Nhm2SecureRunOutputReaderInput["afterFileOpenForTesting"];
}): Promise<SecureRead> => {
  const { request } = input;
  const absolutePath = path.resolve(
    input.root.absolutePath,
    ...request.relativePath.split("/"),
  );
  if (!isInside(input.root.absolutePath, absolutePath)) {
    fail(
      "output_path_invalid",
      "Output path escaped the run directory.",
      request.relativePath,
    );
  }
  const beforeStat = await lstatBigInt(
    absolutePath,
    "output_entry_unreadable",
    "Output entry",
    request.relativePath,
  );
  if (beforeStat.isSymbolicLink()) {
    fail(
      "output_entry_symlink_or_reparse",
      "Output entry is a symbolic link or reparse point.",
      request.relativePath,
    );
  }
  if (!beforeStat.isFile()) {
    fail(
      "output_entry_not_regular",
      "Output entry is not a regular file.",
      request.relativePath,
    );
  }
  if (beforeStat.nlink !== 1n) {
    fail(
      "output_entry_hardlinked",
      "Output entry must have exactly one hard link.",
      request.relativePath,
    );
  }
  if (beforeStat.size !== request.expectedSizeBytes) {
    fail(
      "output_size_mismatch",
      "Observed output size does not equal the externally declared size.",
      request.relativePath,
    );
  }
  const realPath = await realpathOrFail(
    absolutePath,
    "output_entry_unreadable",
    "Output entry",
    request.relativePath,
  );
  const expectedRealPath = path.resolve(
    input.root.realPath,
    ...request.relativePath.split("/"),
  );
  if (
    !isInside(input.root.realPath, realPath) ||
    !sameFilesystemPath(realPath, expectedRealPath) ||
    !sameFilesystemPath(realPath, absolutePath)
  ) {
    fail(
      "output_realpath_mismatch",
      "Output entry resolves through an alias or outside its run root.",
      request.relativePath,
    );
  }

  let handle: Awaited<ReturnType<typeof fs.open>> | null = null;
  try {
    const posixDefensiveFlags =
      process.platform === "win32"
        ? 0
        : (fsConstants.O_NOFOLLOW ?? 0) | (fsConstants.O_NONBLOCK ?? 0);
    try {
      handle = await fs.open(
        absolutePath,
        fsConstants.O_RDONLY | posixDefensiveFlags,
      );
    } catch (error) {
      return fail(
        "output_open_failed",
        `Output entry could not be opened without following links (${fsCode(error)}).`,
        request.relativePath,
      );
    }
    await input.afterFileDescriptorOpenBeforeStatForTesting?.({
      phase: input.phase,
      relativePath: request.relativePath,
      absolutePath,
    });
    const openedStat = await handle.stat({ bigint: true });
    const beforeIdentity = identity(beforeStat);
    if (
      !openedStat.isFile() ||
      openedStat.nlink !== 1n ||
      !identitiesMatch(beforeIdentity, identity(openedStat))
    ) {
      fail(
        "output_open_identity_mismatch",
        "Opened descriptor is not the same single-link regular file observed by lstat.",
        request.relativePath,
      );
    }

    await input.afterFileOpenForTesting?.({
      phase: input.phase,
      relativePath: request.relativePath,
      absolutePath,
    });

    const boundedSize = Number(request.expectedSizeBytes);
    const bytes = Buffer.allocUnsafe(boundedSize);
    let offset = 0;
    while (offset < boundedSize) {
      const observation = await handle.read(
        bytes,
        offset,
        boundedSize - offset,
        offset,
      );
      if (observation.bytesRead === 0) break;
      offset += observation.bytesRead;
    }
    const trailingProbe = Buffer.allocUnsafe(1);
    const trailing = await handle.read(trailingProbe, 0, 1, boundedSize);
    if (offset !== boundedSize || trailing.bytesRead !== 0) {
      fail(
        "output_bounded_read_mismatch",
        "Exact bounded read was truncated or found a trailing byte.",
        request.relativePath,
      );
    }

    const openedAfterStat = await handle.stat({ bigint: true });
    const afterStat = await lstatBigInt(
      absolutePath,
      "output_changed_while_reading",
      "Output entry after read",
      request.relativePath,
    );
    const afterRealPath = await realpathOrFail(
      absolutePath,
      "output_changed_while_reading",
      "Output entry after read",
      request.relativePath,
    );
    if (
      afterStat.isSymbolicLink() ||
      !afterStat.isFile() ||
      afterStat.nlink !== 1n ||
      !sameFilesystemPath(afterRealPath, realPath) ||
      !identitiesMatch(beforeIdentity, identity(openedAfterStat)) ||
      !identitiesMatch(beforeIdentity, identity(afterStat))
    ) {
      fail(
        "output_changed_while_reading",
        "Output dev/ino/size/mtime/ctime identity changed during replay.",
        request.relativePath,
      );
    }
    const digest = sha256(bytes);
    if (digest !== request.expectedSha256) {
      fail(
        "output_sha256_mismatch",
        "Output SHA-256 does not match its external binding.",
        request.relativePath,
      );
    }
    return {
      relativePath: request.relativePath,
      absolutePath,
      sha256: digest,
      sizeBytes: request.expectedSizeBytes,
      bytes,
      identity: beforeIdentity,
    };
  } catch (error) {
    if (error instanceof Nhm2SecureRunOutputReaderError) throw error;
    return fail(
      "output_read_failed",
      `Output bounded read failed (${fsCode(error)}).`,
      request.relativePath,
    );
  } finally {
    await handle?.close().catch(() => undefined);
  }
};

const decodeFile = (
  file: SecureRead,
  decode: Nhm2SecureRunOutputDecodeV1,
): Nhm2SecureRunOutputReadFileV1["decoded"] => {
  if (decode.kind === "bytes") return Object.freeze({ kind: "bytes" });
  const view = new DataView(
    file.bytes.buffer,
    file.bytes.byteOffset,
    file.bytes.byteLength,
  );
  const valueCount = file.bytes.byteLength / 8;
  for (let index = 0; index < valueCount; index += 1) {
    const value = view.getFloat64(index * 8, true);
    if (!Number.isFinite(value)) {
      fail(
        "output_float64_non_finite",
        `Float64 element ${index} is not finite.`,
        file.relativePath,
      );
    }
  }
  return Object.freeze({
    kind: "float64_le",
    shape: Object.freeze([...decode.shape]),
    finiteValuesVerified: true,
  });
};

const configuredLimit = (input: {
  value: unknown;
  fallback: bigint;
  hardMaximum: bigint;
  label: string;
}): bigint => {
  const value = input.value ?? input.fallback;
  if (typeof value !== "bigint" || value <= 0n || value > input.hardMaximum) {
    fail(
      "reader_input_invalid",
      `${input.label} must be a positive bigint within its hard ceiling.`,
    );
  }
  return value as bigint;
};

/**
 * Securely reads externally hash/size-bound files from a run-specific root.
 * This primitive intentionally performs no scientific assessment and grants no
 * theory, empirical, viability, transport, propulsion, ETA, or speed authority.
 */
export async function readNhm2SecureRunOutputs(
  input: Nhm2SecureRunOutputReaderInput,
): Promise<Nhm2SecureRunOutputReadResultV1> {
  if (
    input == null ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    !isPlainRecord(input)
  ) {
    fail("reader_input_invalid", "Reader input must be an object.");
  }
  if (
    !hasAllowedKeys({
      value: input,
      required: ["files", "runDirectory"],
      allowed: TOP_LEVEL_INPUT_KEYS,
    })
  ) {
    fail(
      "reader_input_invalid",
      "Top-level reader keys do not match the exact input contract.",
    );
  }
  if (
    (input.afterFileDescriptorOpenBeforeStatForTesting != null ||
      input.afterFileOpenForTesting != null ||
      input.afterInitialReadForTesting != null) &&
    (process.env.NODE_ENV !== "test" || process.env.VITEST !== "true")
  ) {
    fail(
      "test_hook_not_allowed",
      "Reader mutation hooks are unavailable outside the Vitest test runtime.",
    );
  }
  if (
    (input.afterFileDescriptorOpenBeforeStatForTesting != null &&
      typeof input.afterFileDescriptorOpenBeforeStatForTesting !==
        "function") ||
    (input.afterFileOpenForTesting != null &&
      typeof input.afterFileOpenForTesting !== "function") ||
    (input.afterInitialReadForTesting != null &&
      typeof input.afterInitialReadForTesting !== "function")
  ) {
    fail("reader_input_invalid", "Reader mutation hooks must be functions.");
  }
  const maxFileBytes = configuredLimit({
    value: input.maxFileBytes,
    fallback: NHM2_SECURE_RUN_OUTPUT_READER_LIMITS.defaultMaxFileBytes,
    hardMaximum: NHM2_SECURE_RUN_OUTPUT_READER_LIMITS.hardMaxFileBytes,
    label: "maxFileBytes",
  });
  const maxAggregateBytes = configuredLimit({
    value: input.maxAggregateBytes,
    fallback: NHM2_SECURE_RUN_OUTPUT_READER_LIMITS.defaultMaxAggregateBytes,
    hardMaximum: NHM2_SECURE_RUN_OUTPUT_READER_LIMITS.hardMaxAggregateBytes,
    label: "maxAggregateBytes",
  });
  if (maxFileBytes > maxAggregateBytes) {
    fail(
      "reader_input_invalid",
      "maxFileBytes cannot exceed maxAggregateBytes.",
    );
  }
  const requests = normalizeRequests({
    files: input.files,
    maxFileBytes,
    maxAggregateBytes,
  });
  const run = await validateRunDirectory(input.runDirectory);
  const inventoryBefore = await snapshotExactInventory({
    root: run.root,
    files: requests.files,
  });
  const parentGuards = new Map<string, DirectoryGuard>();
  for (const request of requests.files) {
    await validateOutputParentChain({
      root: run.root,
      relativePath: request.relativePath,
      guards: parentGuards,
    });
  }

  const initialReads = new Map<string, SecureRead>();
  const decoded = new Map<string, Nhm2SecureRunOutputReadFileV1["decoded"]>();
  for (const request of requests.files) {
    const file = await readSecureFile({
      root: run.root,
      request,
      phase: "initial",
      afterFileDescriptorOpenBeforeStatForTesting:
        input.afterFileDescriptorOpenBeforeStatForTesting,
      afterFileOpenForTesting: input.afterFileOpenForTesting,
    });
    initialReads.set(request.relativePath, file);
    decoded.set(request.relativePath, decodeFile(file, request.decode));
  }

  await input.afterInitialReadForTesting?.();

  for (const request of requests.files) {
    const initial = initialReads.get(request.relativePath)!;
    let replay: SecureRead;
    try {
      replay = await readSecureFile({
        root: run.root,
        request,
        phase: "final_replay",
        afterFileDescriptorOpenBeforeStatForTesting:
          input.afterFileDescriptorOpenBeforeStatForTesting,
        afterFileOpenForTesting: input.afterFileOpenForTesting,
      });
    } catch (error) {
      if (error instanceof Nhm2SecureRunOutputReaderError) {
        fail(
          "output_changed_after_initial_read",
          `Final secure replay failed with ${error.code}.`,
          request.relativePath,
        );
      }
      throw error;
    }
    if (
      replay.sha256 !== initial.sha256 ||
      replay.sizeBytes !== initial.sizeBytes ||
      !identitiesMatch(replay.identity, initial.identity) ||
      !replay.bytes.equals(initial.bytes)
    ) {
      fail(
        "output_changed_after_initial_read",
        "Output identity or bytes changed before final replay.",
        request.relativePath,
      );
    }
  }

  const inventoryAfter = await snapshotExactInventory({
    root: run.root,
    files: requests.files,
  });
  if (!isDeepStrictEqual(inventoryBefore, inventoryAfter)) {
    fail(
      "output_inventory_mismatch",
      "Output inventory identity changed between initial and final replay.",
    );
  }

  const guards = [run.parent, run.root, ...parentGuards.values()].sort(
    (left, right) => utf8Compare(left.absolutePath, right.absolutePath),
  );
  for (const guard of guards) await assertDirectoryGuardStable(guard);

  const files = Object.freeze(
    requests.files.map((request) => {
      const file = initialReads.get(request.relativePath)!;
      return Object.freeze({
        relativePath: file.relativePath,
        absolutePath: file.absolutePath,
        sha256: file.sha256,
        sizeBytes: file.sizeBytes,
        bytes: file.bytes,
        decoded: decoded.get(request.relativePath)!,
        filesystemIdentity: Object.freeze(publicIdentity(file.identity)),
      });
    }),
  );
  const blockers = Object.freeze([
    ...NHM2_SECURE_RUN_OUTPUT_READER_AUTHORITY_BLOCKERS,
  ]);
  const claimBoundary = Object.freeze({
    ...NHM2_SECURE_RUN_OUTPUT_READER_CLAIM_BOUNDARY,
  });
  return Object.freeze({
    contractVersion: NHM2_SECURE_RUN_OUTPUT_READER_VERSION,
    readState: "bounded_bytes_read_authority_neutral",
    runDirectoryRealPath: run.root.realPath,
    aggregateSizeBytes: requests.aggregateSizeBytes,
    files,
    blockers,
    claimBoundary,
  });
}
