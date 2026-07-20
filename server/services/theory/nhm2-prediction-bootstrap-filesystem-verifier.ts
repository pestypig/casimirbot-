import { createHash } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual, TextDecoder } from "node:util";

import {
  isNhm2PredictionBootstrapFreeze,
  verifyNhm2PredictionBootstrapFreezeFromBytes,
  type Nhm2PredictionBootstrapFreezeV1,
  type Nhm2PredictionBootstrapVerificationV1,
} from "../../../shared/contracts/nhm2-prediction-bootstrap-freeze.v1";

export const NHM2_PREDICTION_BOOTSTRAP_MAX_FREEZE_BYTES = 2 * 1024 * 1024;
export const NHM2_PREDICTION_BOOTSTRAP_DEFAULT_MAX_FILE_BYTES = 8 * 1024 * 1024;
export const NHM2_PREDICTION_BOOTSTRAP_DEFAULT_MAX_TOTAL_BYTES =
  64 * 1024 * 1024;
export const NHM2_PREDICTION_BOOTSTRAP_HARD_MAX_FILE_BYTES = 64 * 1024 * 1024;
export const NHM2_PREDICTION_BOOTSTRAP_HARD_MAX_TOTAL_BYTES = 512 * 1024 * 1024;
export const NHM2_PREDICTION_BOOTSTRAP_MAX_CLOSURE_ENTRIES = 128;
export const NHM2_PREDICTION_BOOTSTRAP_MAX_FILE_COUNT =
  NHM2_PREDICTION_BOOTSTRAP_MAX_CLOSURE_ENTRIES + 1;
export const NHM2_PREDICTION_BOOTSTRAP_MAX_FILESYSTEM_ENTRIES = 2_048;
export const NHM2_PREDICTION_BOOTSTRAP_MAX_PATH_DEPTH = 16;
export const NHM2_PREDICTION_BOOTSTRAP_MAX_PATH_UTF8_BYTES = 1_024;
export const NHM2_PREDICTION_BOOTSTRAP_MAX_JSON_DEPTH = 64;
export const NHM2_PREDICTION_BOOTSTRAP_MAX_JSON_NODES = 100_000;
export const NHM2_PREDICTION_BOOTSTRAP_MAX_JSON_STRING_UTF8_BYTES = 1024 * 1024;

export type Nhm2PredictionBootstrapFilesystemViolationCode =
  | "verifier_input_invalid"
  | "bootstrap_root_unreadable"
  | "bootstrap_root_symlink_or_reparse"
  | "bootstrap_root_not_directory"
  | "freeze_path_escape"
  | "freeze_path_mismatch"
  | "freeze_sha256_mismatch"
  | "freeze_json_invalid"
  | "freeze_contract_invalid"
  | "filesystem_entry_unreadable"
  | "filesystem_entry_symlink_or_reparse"
  | "filesystem_entry_not_regular"
  | "filesystem_entry_hardlinked"
  | "filesystem_realpath_escape"
  | "filesystem_reparse_alias"
  | "filesystem_extra_file"
  | "filesystem_extra_directory"
  | "filesystem_missing_file"
  | "filesystem_inventory_changed"
  | "filesystem_file_changed"
  | "filesystem_read_failed"
  | "filesystem_resource_limit_exceeded"
  | "filesystem_expected_path_collision"
  | "freeze_bom_forbidden"
  | "freeze_utf8_invalid"
  | "freeze_json_not_canonical"
  | "artifact_bom_forbidden"
  | "artifact_utf8_invalid"
  | "artifact_json_invalid"
  | "artifact_json_not_canonical"
  | "content_verification_failed";

export type Nhm2PredictionBootstrapFilesystemViolation = {
  code: Nhm2PredictionBootstrapFilesystemViolationCode;
  path?: string;
  detail?: string;
};

export type Nhm2PredictionBootstrapFilesystemVerifiedFile = {
  path: string;
  absolutePath: string;
  sha256: string;
  sizeBytes: number;
  mtimeMs: number;
  ctimeMs: number;
};

export type Nhm2PredictionBootstrapFilesystemClaimBoundary = {
  filesystemAndContentVerificationOnly: true;
  experimentReadyTheoryClosureClaimAllowed: false;
  physicalViabilityClaimAllowed: false;
  transportClaimAllowed: false;
  propulsionClaimAllowed: false;
  routeEtaClaimAllowed: false;
  speedAuthorityClaimAllowed: false;
  empiricalReceiptsRequired: true;
};

export type Nhm2PredictionBootstrapFilesystemVerifierInput = {
  /** Trusted, run-specific root containing only the freeze and its closure. */
  bootstrapRoot: string;
  /** Portable path relative to bootstrapRoot. */
  freezeArtifactPath: string;
  /** Raw SHA-256 supplied by the outer caller, never by the artifact. */
  expectedFreezeSha256: string;
  /** Per-closure-file ceiling, itself bounded by a verifier hard limit. */
  maxFileBytes?: number;
  /** Aggregate freeze-plus-closure ceiling, bounded by a verifier hard limit. */
  maxTotalBytes?: number;
  /** Test-only mutation point; it cannot bypass the mandatory final replay. */
  afterSemanticVerificationForTesting?: () => void | Promise<void>;
};

export type Nhm2PredictionBootstrapFilesystemVerification =
  | {
      verified: true;
      violations: [];
      bootstrapRootRealPath: string;
      freezeArtifactPath: string;
      freezeSha256: string;
      artifact: Nhm2PredictionBootstrapFreezeV1;
      contentVerification: Nhm2PredictionBootstrapVerificationV1 & {
        valid: true;
      };
      files: Nhm2PredictionBootstrapFilesystemVerifiedFile[];
      claimBoundary: Nhm2PredictionBootstrapFilesystemClaimBoundary;
    }
  | {
      verified: false;
      violations: Nhm2PredictionBootstrapFilesystemViolation[];
      bootstrapRootRealPath: string | null;
      freezeArtifactPath: string | null;
      freezeSha256: string | null;
      artifact: Nhm2PredictionBootstrapFreezeV1 | null;
      contentVerification: Nhm2PredictionBootstrapVerificationV1 | null;
      files: [];
      claimBoundary: Nhm2PredictionBootstrapFilesystemClaimBoundary;
    };

type FileIdentity = {
  dev: string;
  ino: string;
  mode: number;
  size: number;
  mtimeMs: number;
  ctimeMs: number;
  birthtimeMs: number;
  nlink: number;
};

type ObservedFile = Nhm2PredictionBootstrapFilesystemVerifiedFile & {
  identity: FileIdentity;
  bytes: Buffer;
};

type InventorySnapshot = Array<{
  path: string;
  kind: "directory" | "file" | "other" | "symlink";
  identity: FileIdentity;
}>;

type VerificationContext = {
  root: string;
  rootRealPath: string;
  maxTotalBytes: number;
  accountedBytesByPath: Map<string, number>;
  accountedTotalBytes: number;
  violations: Nhm2PredictionBootstrapFilesystemViolation[];
  violationKeys: Set<string>;
};

const SHA256 = /^[a-f0-9]{64}$/;
const UTF8_BOM = Buffer.from([0xef, 0xbb, 0xbf]);

const CLAIM_BOUNDARY: Nhm2PredictionBootstrapFilesystemClaimBoundary = {
  filesystemAndContentVerificationOnly: true,
  experimentReadyTheoryClosureClaimAllowed: false,
  physicalViabilityClaimAllowed: false,
  transportClaimAllowed: false,
  propulsionClaimAllowed: false,
  routeEtaClaimAllowed: false,
  speedAuthorityClaimAllowed: false,
  empiricalReceiptsRequired: true,
};

const utf8Compare = (left: string, right: string): number =>
  Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));

const toPortablePath = (value: string): string =>
  value.split(path.sep).join("/");

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
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  );
};

const isPortableRelativePath = (value: unknown): value is string => {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.trim() !== value ||
    value.includes("\\") ||
    value.startsWith("/") ||
    path.isAbsolute(value) ||
    /^[a-z]:/i.test(value) ||
    /^[a-z][a-z0-9+.-]*:/i.test(value) ||
    /[?#*{}\[\]]/.test(value)
  ) {
    return false;
  }
  const segments = value.split("/");
  return segments.every(
    (segment) => segment !== "" && segment !== "." && segment !== "..",
  );
};

const portablePathResourceViolation = (value: string): string | null => {
  const utf8Bytes = Buffer.byteLength(value, "utf8");
  if (utf8Bytes > NHM2_PREDICTION_BOOTSTRAP_MAX_PATH_UTF8_BYTES) {
    return `path_utf8_bytes=${utf8Bytes};max_path_utf8_bytes=${NHM2_PREDICTION_BOOTSTRAP_MAX_PATH_UTF8_BYTES}`;
  }
  const depth = value.split("/").length;
  return depth > NHM2_PREDICTION_BOOTSTRAP_MAX_PATH_DEPTH
    ? `path_depth=${depth};max_path_depth=${NHM2_PREDICTION_BOOTSTRAP_MAX_PATH_DEPTH}`
    : null;
};

const sha256 = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");

const statIdentity = (
  stat: Awaited<ReturnType<typeof fs.lstat>>,
): FileIdentity => ({
  dev: String(stat.dev),
  ino: String(stat.ino),
  mode: Number(stat.mode),
  size: Number(stat.size),
  mtimeMs: Number(stat.mtimeMs),
  ctimeMs: Number(stat.ctimeMs),
  birthtimeMs: Number(stat.birthtimeMs),
  nlink: Number(stat.nlink),
});

const statIdentityMatches = (
  left: Awaited<ReturnType<typeof fs.lstat>>,
  right: Awaited<ReturnType<typeof fs.lstat>>,
): boolean => isDeepStrictEqual(statIdentity(left), statIdentity(right));

const addViolation = (
  context: Pick<VerificationContext, "violations" | "violationKeys">,
  violation: Nhm2PredictionBootstrapFilesystemViolation,
): void => {
  const key = JSON.stringify(violation);
  if (context.violationKeys.has(key)) return;
  context.violationKeys.add(key);
  context.violations.push(violation);
};

const initialFailure = (
  violations: Nhm2PredictionBootstrapFilesystemViolation[],
): Nhm2PredictionBootstrapFilesystemVerification => ({
  verified: false,
  violations,
  bootstrapRootRealPath: null,
  freezeArtifactPath: null,
  freezeSha256: null,
  artifact: null,
  contentVerification: null,
  files: [],
  claimBoundary: CLAIM_BOUNDARY,
});

const failed = (input: {
  context: VerificationContext;
  freezeArtifactPath: string | null;
  freezeSha256: string | null;
  artifact: Nhm2PredictionBootstrapFreezeV1 | null;
  contentVerification: Nhm2PredictionBootstrapVerificationV1 | null;
}): Nhm2PredictionBootstrapFilesystemVerification => ({
  verified: false,
  violations: input.context.violations,
  bootstrapRootRealPath: input.context.rootRealPath,
  freezeArtifactPath: input.freezeArtifactPath,
  freezeSha256: input.freezeSha256,
  artifact: input.artifact,
  contentVerification: input.contentVerification,
  files: [],
  claimBoundary: CLAIM_BOUNDARY,
});

const expectedDirectories = (
  expectedFiles: ReadonlySet<string>,
): Set<string> => {
  const directories = new Set<string>();
  for (const file of expectedFiles) {
    const segments = file.split("/");
    for (let index = 1; index < segments.length; index += 1) {
      directories.add(segments.slice(0, index).join("/"));
    }
  }
  return directories;
};

async function readContainedRegularFile(
  context: VerificationContext,
  relativePath: string,
  maxBytes: number,
): Promise<ObservedFile | null> {
  if (!isPortableRelativePath(relativePath)) {
    addViolation(context, { code: "freeze_path_escape", path: relativePath });
    return null;
  }
  const pathResourceViolation = portablePathResourceViolation(relativePath);
  if (pathResourceViolation != null) {
    addViolation(context, {
      code: "filesystem_resource_limit_exceeded",
      path: relativePath,
      detail: pathResourceViolation,
    });
    return null;
  }
  const absolutePath = path.resolve(context.root, ...relativePath.split("/"));
  if (!isInside(context.root, absolutePath)) {
    addViolation(context, { code: "freeze_path_escape", path: relativePath });
    return null;
  }

  let before: Awaited<ReturnType<typeof fs.lstat>>;
  try {
    before = await fs.lstat(absolutePath);
  } catch (error) {
    addViolation(context, {
      code: "filesystem_entry_unreadable",
      path: relativePath,
      detail: (error as NodeJS.ErrnoException).code ?? "lstat_failed",
    });
    return null;
  }
  if (before.isSymbolicLink()) {
    addViolation(context, {
      code: "filesystem_entry_symlink_or_reparse",
      path: relativePath,
    });
    return null;
  }
  if (!before.isFile()) {
    addViolation(context, {
      code: "filesystem_entry_not_regular",
      path: relativePath,
    });
    return null;
  }
  if (before.nlink !== 1) {
    addViolation(context, {
      code: "filesystem_entry_hardlinked",
      path: relativePath,
      detail: `nlink=${before.nlink}`,
    });
    return null;
  }
  if (!Number.isSafeInteger(before.size) || before.size > maxBytes) {
    addViolation(context, {
      code: "filesystem_resource_limit_exceeded",
      path: relativePath,
      detail: `observed_bytes=${before.size};max_bytes=${maxBytes}`,
    });
    return null;
  }
  const priorAccountedBytes =
    context.accountedBytesByPath.get(relativePath) ?? 0;
  const projectedTotalBytes =
    context.accountedTotalBytes - priorAccountedBytes + before.size;
  if (
    !Number.isSafeInteger(projectedTotalBytes) ||
    projectedTotalBytes > context.maxTotalBytes
  ) {
    addViolation(context, {
      code: "filesystem_resource_limit_exceeded",
      path: relativePath,
      detail: `observed_total_bytes=${projectedTotalBytes};max_total_bytes=${context.maxTotalBytes}`,
    });
    return null;
  }
  context.accountedBytesByPath.set(relativePath, before.size);
  context.accountedTotalBytes = projectedTotalBytes;

  let realPath: string;
  try {
    realPath = await fs.realpath(absolutePath);
  } catch (error) {
    addViolation(context, {
      code: "filesystem_entry_unreadable",
      path: relativePath,
      detail: (error as NodeJS.ErrnoException).code ?? "realpath_failed",
    });
    return null;
  }
  if (!isInside(context.rootRealPath, realPath)) {
    addViolation(context, {
      code: "filesystem_realpath_escape",
      path: relativePath,
    });
    return null;
  }
  const expectedRealPath = path.resolve(
    context.rootRealPath,
    ...relativePath.split("/"),
  );
  if (!sameFilesystemPath(realPath, expectedRealPath)) {
    addViolation(context, {
      code: "filesystem_reparse_alias",
      path: relativePath,
    });
    return null;
  }

  let handle: Awaited<ReturnType<typeof fs.open>> | null = null;
  try {
    const noFollow =
      process.platform === "win32" ? 0 : (fsConstants.O_NOFOLLOW ?? 0);
    handle = await fs.open(absolutePath, fsConstants.O_RDONLY | noFollow);
    const opened = await handle.stat();
    if (!statIdentityMatches(before, opened)) {
      addViolation(context, {
        code: "filesystem_file_changed",
        path: relativePath,
        detail: "lstat_open_identity_mismatch",
      });
      return null;
    }
    const bytes = Buffer.allocUnsafe(before.size);
    let offset = 0;
    while (offset < before.size) {
      const { bytesRead } = await handle.read(
        bytes,
        offset,
        before.size - offset,
        offset,
      );
      if (bytesRead === 0) break;
      offset += bytesRead;
    }
    const overflowProbe = Buffer.allocUnsafe(1);
    const { bytesRead: overflowBytesRead } = await handle.read(
      overflowProbe,
      0,
      1,
      offset,
    );
    if (offset !== before.size || overflowBytesRead !== 0) {
      addViolation(context, {
        code: "filesystem_file_changed",
        path: relativePath,
        detail: `bounded_read_size_mismatch:expected=${before.size};observed=${offset};overflow=${overflowBytesRead}`,
      });
      return null;
    }
    const after = await fs.lstat(absolutePath);
    if (
      after.isSymbolicLink() ||
      !after.isFile() ||
      after.nlink !== 1 ||
      !statIdentityMatches(before, after)
    ) {
      addViolation(context, {
        code: "filesystem_file_changed",
        path: relativePath,
        detail: "post_read_identity_mismatch",
      });
      return null;
    }
    return {
      path: relativePath,
      absolutePath,
      sha256: sha256(bytes),
      sizeBytes: bytes.byteLength,
      mtimeMs: before.mtimeMs,
      ctimeMs: before.ctimeMs,
      identity: statIdentity(before),
      bytes,
    };
  } catch (error) {
    addViolation(context, {
      code: "filesystem_read_failed",
      path: relativePath,
      detail: (error as NodeJS.ErrnoException).code ?? "read_failed",
    });
    return null;
  } finally {
    await handle?.close().catch(() => undefined);
  }
}

async function snapshotExactInventory(input: {
  context: VerificationContext;
  expectedFiles: ReadonlySet<string>;
}): Promise<InventorySnapshot> {
  const snapshot: InventorySnapshot = [];
  const expectedDirs = expectedDirectories(input.expectedFiles);
  const observedFiles = new Set<string>();
  let observedEntryCount = 0;
  let observedFileCount = 0;
  let inventoryLimitExceeded = false;

  const visit = async (
    absoluteDirectory: string,
    relativeDirectory: string,
  ): Promise<void> => {
    if (inventoryLimitExceeded) return;
    let directory: Awaited<ReturnType<typeof fs.opendir>>;
    try {
      directory = await fs.opendir(absoluteDirectory);
    } catch (error) {
      addViolation(input.context, {
        code: "filesystem_entry_unreadable",
        path: relativeDirectory || ".",
        detail: (error as NodeJS.ErrnoException).code ?? "opendir_failed",
      });
      return;
    }
    try {
      for await (const entry of directory) {
        observedEntryCount += 1;
        if (
          observedEntryCount > NHM2_PREDICTION_BOOTSTRAP_MAX_FILESYSTEM_ENTRIES
        ) {
          inventoryLimitExceeded = true;
          addViolation(input.context, {
            code: "filesystem_resource_limit_exceeded",
            path: relativeDirectory || ".",
            detail: `filesystem_entries>${NHM2_PREDICTION_BOOTSTRAP_MAX_FILESYSTEM_ENTRIES}`,
          });
          break;
        }
        const absoluteEntry = path.join(absoluteDirectory, entry.name);
        const relativeEntry = relativeDirectory
          ? `${relativeDirectory}/${entry.name}`
          : entry.name;
        const pathResourceViolation =
          portablePathResourceViolation(relativeEntry);
        if (pathResourceViolation != null) {
          addViolation(input.context, {
            code: "filesystem_resource_limit_exceeded",
            path: relativeEntry,
            detail: pathResourceViolation,
          });
          continue;
        }
        let stat: Awaited<ReturnType<typeof fs.lstat>>;
        try {
          stat = await fs.lstat(absoluteEntry);
        } catch (error) {
          addViolation(input.context, {
            code: "filesystem_entry_unreadable",
            path: relativeEntry,
            detail: (error as NodeJS.ErrnoException).code ?? "lstat_failed",
          });
          continue;
        }
        const kind = stat.isSymbolicLink()
          ? "symlink"
          : stat.isDirectory()
            ? "directory"
            : stat.isFile()
              ? "file"
              : "other";
        snapshot.push({
          path: relativeEntry,
          kind,
          identity: statIdentity(stat),
        });

        if (stat.isSymbolicLink()) {
          addViolation(input.context, {
            code: "filesystem_entry_symlink_or_reparse",
            path: relativeEntry,
          });
          continue;
        }
        if (stat.isDirectory()) {
          const isExpectedDirectory = expectedDirs.has(relativeEntry);
          if (!isExpectedDirectory) {
            addViolation(input.context, {
              code: "filesystem_extra_directory",
              path: relativeEntry,
            });
          }
          let realDirectory: string;
          try {
            realDirectory = await fs.realpath(absoluteEntry);
          } catch (error) {
            addViolation(input.context, {
              code: "filesystem_entry_unreadable",
              path: relativeEntry,
              detail:
                (error as NodeJS.ErrnoException).code ?? "realpath_failed",
            });
            continue;
          }
          const expectedRealDirectory = path.resolve(
            input.context.rootRealPath,
            ...relativeEntry.split("/"),
          );
          if (!isInside(input.context.rootRealPath, realDirectory)) {
            addViolation(input.context, {
              code: "filesystem_realpath_escape",
              path: relativeEntry,
            });
            continue;
          }
          if (!sameFilesystemPath(realDirectory, expectedRealDirectory)) {
            addViolation(input.context, {
              code: "filesystem_reparse_alias",
              path: relativeEntry,
            });
            continue;
          }
          if (isExpectedDirectory) await visit(absoluteEntry, relativeEntry);
          if (inventoryLimitExceeded) break;
          continue;
        }
        if (!stat.isFile()) {
          addViolation(input.context, {
            code: "filesystem_entry_not_regular",
            path: relativeEntry,
          });
          continue;
        }
        observedFileCount += 1;
        if (observedFileCount > NHM2_PREDICTION_BOOTSTRAP_MAX_FILE_COUNT) {
          inventoryLimitExceeded = true;
          addViolation(input.context, {
            code: "filesystem_resource_limit_exceeded",
            path: relativeDirectory || ".",
            detail: `filesystem_files>${NHM2_PREDICTION_BOOTSTRAP_MAX_FILE_COUNT}`,
          });
          break;
        }
        if (stat.nlink !== 1) {
          addViolation(input.context, {
            code: "filesystem_entry_hardlinked",
            path: relativeEntry,
            detail: `nlink=${stat.nlink}`,
          });
        }
        observedFiles.add(relativeEntry);
        if (!input.expectedFiles.has(relativeEntry)) {
          addViolation(input.context, {
            code: "filesystem_extra_file",
            path: relativeEntry,
          });
        }
      }
    } catch (error) {
      addViolation(input.context, {
        code: "filesystem_entry_unreadable",
        path: relativeDirectory || ".",
        detail:
          (error as NodeJS.ErrnoException).code ?? "directory_read_failed",
      });
    }
  };

  await visit(input.context.root, "");
  for (const expected of [...input.expectedFiles].sort(utf8Compare)) {
    if (!observedFiles.has(expected)) {
      addViolation(input.context, {
        code: "filesystem_missing_file",
        path: expected,
      });
    }
  }
  return snapshot.sort((left, right) => utf8Compare(left.path, right.path));
}

type JsonPreflightKind = "freeze" | "artifact";

const jsonWithinResourceBounds = (input: {
  context: VerificationContext;
  relativePath: string;
  value: unknown;
}): boolean => {
  const stack: Array<{ value: unknown; depth: number }> = [
    { value: input.value, depth: 1 },
  ];
  let nodes = 0;
  while (stack.length > 0) {
    const current = stack.pop()!;
    nodes += 1;
    if (nodes > NHM2_PREDICTION_BOOTSTRAP_MAX_JSON_NODES) {
      addViolation(input.context, {
        code: "filesystem_resource_limit_exceeded",
        path: input.relativePath,
        detail: `json_nodes>${NHM2_PREDICTION_BOOTSTRAP_MAX_JSON_NODES}`,
      });
      return false;
    }
    if (current.depth > NHM2_PREDICTION_BOOTSTRAP_MAX_JSON_DEPTH) {
      addViolation(input.context, {
        code: "filesystem_resource_limit_exceeded",
        path: input.relativePath,
        detail: `json_depth=${current.depth};max_json_depth=${NHM2_PREDICTION_BOOTSTRAP_MAX_JSON_DEPTH}`,
      });
      return false;
    }
    if (typeof current.value === "string") {
      const stringBytes = Buffer.byteLength(current.value, "utf8");
      if (stringBytes > NHM2_PREDICTION_BOOTSTRAP_MAX_JSON_STRING_UTF8_BYTES) {
        addViolation(input.context, {
          code: "filesystem_resource_limit_exceeded",
          path: input.relativePath,
          detail: `json_string_utf8_bytes=${stringBytes};max_json_string_utf8_bytes=${NHM2_PREDICTION_BOOTSTRAP_MAX_JSON_STRING_UTF8_BYTES}`,
        });
        return false;
      }
      continue;
    }
    if (Array.isArray(current.value)) {
      for (let index = current.value.length - 1; index >= 0; index -= 1) {
        stack.push({
          value: current.value[index],
          depth: current.depth + 1,
        });
      }
      continue;
    }
    if (current.value != null && typeof current.value === "object") {
      for (const [key, value] of Object.entries(current.value)) {
        const keyBytes = Buffer.byteLength(key, "utf8");
        if (keyBytes > NHM2_PREDICTION_BOOTSTRAP_MAX_JSON_STRING_UTF8_BYTES) {
          addViolation(input.context, {
            code: "filesystem_resource_limit_exceeded",
            path: input.relativePath,
            detail: `json_key_utf8_bytes=${keyBytes};max_json_string_utf8_bytes=${NHM2_PREDICTION_BOOTSTRAP_MAX_JSON_STRING_UTF8_BYTES}`,
          });
          return false;
        }
        stack.push({ value, depth: current.depth + 1 });
      }
    }
  }
  return true;
};

const parseBoundedCanonicalJson = (input: {
  context: VerificationContext;
  relativePath: string;
  bytes: Uint8Array;
  kind: JsonPreflightKind;
}): { ok: true; value: unknown } | { ok: false } => {
  if (
    input.bytes.byteLength >= UTF8_BOM.byteLength &&
    Buffer.from(input.bytes.subarray(0, UTF8_BOM.byteLength)).equals(UTF8_BOM)
  ) {
    addViolation(input.context, {
      code:
        input.kind === "freeze"
          ? "freeze_bom_forbidden"
          : "artifact_bom_forbidden",
      path: input.relativePath,
    });
    return { ok: false };
  }
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(input.bytes);
  } catch {
    addViolation(input.context, {
      code:
        input.kind === "freeze"
          ? "freeze_utf8_invalid"
          : "artifact_utf8_invalid",
      path: input.relativePath,
    });
    return { ok: false };
  }
  if (!Buffer.from(text, "utf8").equals(Buffer.from(input.bytes))) {
    addViolation(input.context, {
      code:
        input.kind === "freeze"
          ? "freeze_utf8_invalid"
          : "artifact_utf8_invalid",
      path: input.relativePath,
      detail: "utf8_round_trip_mismatch",
    });
    return { ok: false };
  }
  let value: unknown;
  try {
    value = JSON.parse(text) as unknown;
  } catch {
    addViolation(input.context, {
      code:
        input.kind === "freeze"
          ? "freeze_json_invalid"
          : "artifact_json_invalid",
      path: input.relativePath,
    });
    return { ok: false };
  }
  if (
    !jsonWithinResourceBounds({
      context: input.context,
      relativePath: input.relativePath,
      value,
    })
  ) {
    return { ok: false };
  }
  if (JSON.stringify(value) !== text) {
    addViolation(input.context, {
      code:
        input.kind === "freeze"
          ? "freeze_json_not_canonical"
          : "artifact_json_not_canonical",
      path: input.relativePath,
    });
    return { ok: false };
  }
  return { ok: true, value };
};

/**
 * Verifies filesystem containment, immutable bytes, exact inventory, and the
 * shared bootstrap content contract. It deliberately grants no physics or
 * experiment-readiness authority.
 */
export async function verifyNhm2PredictionBootstrapFilesystem(
  input: Nhm2PredictionBootstrapFilesystemVerifierInput,
): Promise<Nhm2PredictionBootstrapFilesystemVerification> {
  if (
    typeof input.bootstrapRoot !== "string" ||
    input.bootstrapRoot.length === 0 ||
    typeof input.expectedFreezeSha256 !== "string" ||
    !SHA256.test(input.expectedFreezeSha256) ||
    /^0{64}$/.test(input.expectedFreezeSha256)
  ) {
    return initialFailure([{ code: "verifier_input_invalid" }]);
  }
  const maxFileBytes =
    input.maxFileBytes ?? NHM2_PREDICTION_BOOTSTRAP_DEFAULT_MAX_FILE_BYTES;
  const maxTotalBytes =
    input.maxTotalBytes ?? NHM2_PREDICTION_BOOTSTRAP_DEFAULT_MAX_TOTAL_BYTES;
  if (
    !Number.isSafeInteger(maxFileBytes) ||
    maxFileBytes <= 0 ||
    maxFileBytes > NHM2_PREDICTION_BOOTSTRAP_HARD_MAX_FILE_BYTES
  ) {
    return initialFailure([
      {
        code: "verifier_input_invalid",
        detail: `maxFileBytes_must_be_1_to_${NHM2_PREDICTION_BOOTSTRAP_HARD_MAX_FILE_BYTES}`,
      },
    ]);
  }
  if (
    !Number.isSafeInteger(maxTotalBytes) ||
    maxTotalBytes <= 0 ||
    maxTotalBytes > NHM2_PREDICTION_BOOTSTRAP_HARD_MAX_TOTAL_BYTES
  ) {
    return initialFailure([
      {
        code: "verifier_input_invalid",
        detail: `maxTotalBytes_must_be_1_to_${NHM2_PREDICTION_BOOTSTRAP_HARD_MAX_TOTAL_BYTES}`,
      },
    ]);
  }
  if (!isPortableRelativePath(input.freezeArtifactPath)) {
    return initialFailure([
      { code: "freeze_path_escape", path: input.freezeArtifactPath },
    ]);
  }
  const freezePathResourceViolation = portablePathResourceViolation(
    input.freezeArtifactPath,
  );
  if (freezePathResourceViolation != null) {
    return initialFailure([
      {
        code: "filesystem_resource_limit_exceeded",
        path: input.freezeArtifactPath,
        detail: freezePathResourceViolation,
      },
    ]);
  }

  const root = path.resolve(input.bootstrapRoot);
  let rootStat: Awaited<ReturnType<typeof fs.lstat>>;
  try {
    rootStat = await fs.lstat(root);
  } catch (error) {
    return initialFailure([
      {
        code: "bootstrap_root_unreadable",
        detail: (error as NodeJS.ErrnoException).code ?? "lstat_failed",
      },
    ]);
  }
  if (rootStat.isSymbolicLink()) {
    return initialFailure([{ code: "bootstrap_root_symlink_or_reparse" }]);
  }
  if (!rootStat.isDirectory()) {
    return initialFailure([{ code: "bootstrap_root_not_directory" }]);
  }
  let rootRealPath: string;
  try {
    rootRealPath = await fs.realpath(root);
  } catch (error) {
    return initialFailure([
      {
        code: "bootstrap_root_unreadable",
        detail: (error as NodeJS.ErrnoException).code ?? "realpath_failed",
      },
    ]);
  }
  if (!sameFilesystemPath(root, rootRealPath)) {
    return initialFailure([{ code: "bootstrap_root_symlink_or_reparse" }]);
  }

  const context: VerificationContext = {
    root,
    rootRealPath,
    maxTotalBytes,
    accountedBytesByPath: new Map(),
    accountedTotalBytes: 0,
    violations: [],
    violationKeys: new Set(),
  };
  const freezePath = input.freezeArtifactPath;
  const observedFreeze = await readContainedRegularFile(
    context,
    freezePath,
    NHM2_PREDICTION_BOOTSTRAP_MAX_FREEZE_BYTES,
  );
  if (observedFreeze == null) {
    return failed({
      context,
      freezeArtifactPath: freezePath,
      freezeSha256: null,
      artifact: null,
      contentVerification: null,
    });
  }
  if (observedFreeze.sha256 !== input.expectedFreezeSha256) {
    addViolation(context, {
      code: "freeze_sha256_mismatch",
      path: freezePath,
      detail: `expected=${input.expectedFreezeSha256};observed=${observedFreeze.sha256}`,
    });
  }

  const freezePreflight = parseBoundedCanonicalJson({
    context,
    relativePath: freezePath,
    bytes: observedFreeze.bytes,
    kind: "freeze",
  });
  if (!freezePreflight.ok) {
    return failed({
      context,
      freezeArtifactPath: freezePath,
      freezeSha256: observedFreeze.sha256,
      artifact: null,
      contentVerification: null,
    });
  }
  const parsed = freezePreflight.value;
  if (parsed != null && typeof parsed === "object" && !Array.isArray(parsed)) {
    const rawFreeze = parsed as Record<string, unknown>;
    const rawClosure = rawFreeze.artifactClosure;
    const rawClosureEntries =
      rawClosure != null &&
      typeof rawClosure === "object" &&
      !Array.isArray(rawClosure) &&
      Array.isArray((rawClosure as Record<string, unknown>).entries)
        ? ((rawClosure as Record<string, unknown>).entries as unknown[])
        : null;
    if (
      rawClosureEntries != null &&
      rawClosureEntries.length > NHM2_PREDICTION_BOOTSTRAP_MAX_CLOSURE_ENTRIES
    ) {
      addViolation(context, {
        code: "filesystem_resource_limit_exceeded",
        path: freezePath,
        detail: `closure_entries=${rawClosureEntries.length};max_closure_entries=${NHM2_PREDICTION_BOOTSTRAP_MAX_CLOSURE_ENTRIES}`,
      });
      return failed({
        context,
        freezeArtifactPath: freezePath,
        freezeSha256: observedFreeze.sha256,
        artifact: null,
        contentVerification: null,
      });
    }
    const pending: unknown[] = [parsed];
    while (pending.length > 0) {
      const value = pending.pop();
      if (Array.isArray(value)) {
        for (const entry of value) pending.push(entry);
        continue;
      }
      if (value == null || typeof value !== "object") continue;
      for (const [key, entry] of Object.entries(value)) {
        if (
          (key === "path" || key === "freezePath") &&
          typeof entry === "string"
        ) {
          const detail = portablePathResourceViolation(entry);
          if (detail != null) {
            addViolation(context, {
              code: "filesystem_resource_limit_exceeded",
              path: entry,
              detail,
            });
          }
        }
        pending.push(entry);
      }
    }
    if (context.violations.length > 0) {
      return failed({
        context,
        freezeArtifactPath: freezePath,
        freezeSha256: observedFreeze.sha256,
        artifact: null,
        contentVerification: null,
      });
    }
  }
  if (!isNhm2PredictionBootstrapFreeze(parsed)) {
    addViolation(context, {
      code: "freeze_contract_invalid",
      path: freezePath,
    });
    return failed({
      context,
      freezeArtifactPath: freezePath,
      freezeSha256: observedFreeze.sha256,
      artifact: null,
      contentVerification: null,
    });
  }
  const artifact = parsed;
  if (artifact.freezePath !== freezePath) {
    addViolation(context, {
      code: "freeze_path_mismatch",
      path: freezePath,
      detail: `declared=${artifact.freezePath}`,
    });
  }

  if (
    artifact.artifactClosure.entries.length >
    NHM2_PREDICTION_BOOTSTRAP_MAX_CLOSURE_ENTRIES
  ) {
    addViolation(context, {
      code: "filesystem_resource_limit_exceeded",
      detail: `closure_entries=${artifact.artifactClosure.entries.length};max_closure_entries=${NHM2_PREDICTION_BOOTSTRAP_MAX_CLOSURE_ENTRIES}`,
    });
    return failed({
      context,
      freezeArtifactPath: freezePath,
      freezeSha256: observedFreeze.sha256,
      artifact,
      contentVerification: null,
    });
  }
  let declaredTotalBytes = observedFreeze.sizeBytes;
  for (const entry of artifact.artifactClosure.entries) {
    if (!isPortableRelativePath(entry.path)) {
      addViolation(context, { code: "freeze_path_escape", path: entry.path });
      continue;
    }
    const entryPathResourceViolation = portablePathResourceViolation(
      entry.path,
    );
    if (entryPathResourceViolation != null) {
      addViolation(context, {
        code: "filesystem_resource_limit_exceeded",
        path: entry.path,
        detail: entryPathResourceViolation,
      });
    }
    if (entry.sizeBytes > maxFileBytes) {
      addViolation(context, {
        code: "filesystem_resource_limit_exceeded",
        path: entry.path,
        detail: `declared_bytes=${entry.sizeBytes};max_file_bytes=${maxFileBytes}`,
      });
    }
    declaredTotalBytes += entry.sizeBytes;
    if (!Number.isSafeInteger(declaredTotalBytes)) {
      addViolation(context, {
        code: "filesystem_resource_limit_exceeded",
        detail: "declared_total_bytes_not_safe_integer",
      });
      break;
    }
  }
  if (declaredTotalBytes > maxTotalBytes) {
    addViolation(context, {
      code: "filesystem_resource_limit_exceeded",
      detail: `declared_total_bytes=${declaredTotalBytes};max_total_bytes=${maxTotalBytes}`,
    });
  }
  if (context.violations.length > 0) {
    return failed({
      context,
      freezeArtifactPath: freezePath,
      freezeSha256: observedFreeze.sha256,
      artifact,
      contentVerification: null,
    });
  }

  const expectedFiles = new Set<string>([
    freezePath,
    ...artifact.artifactClosure.entries.map((entry) => entry.path),
  ]);
  if (expectedFiles.size !== artifact.artifactClosure.entries.length + 1) {
    addViolation(context, {
      code: "filesystem_expected_path_collision",
      path: freezePath,
    });
  }
  if (expectedFiles.size > NHM2_PREDICTION_BOOTSTRAP_MAX_FILE_COUNT) {
    addViolation(context, {
      code: "filesystem_resource_limit_exceeded",
      detail: `expected_files=${expectedFiles.size};max_files=${NHM2_PREDICTION_BOOTSTRAP_MAX_FILE_COUNT}`,
    });
  }
  const expectedDirectoryCount = expectedDirectories(expectedFiles).size;
  if (
    expectedFiles.size + expectedDirectoryCount >
    NHM2_PREDICTION_BOOTSTRAP_MAX_FILESYSTEM_ENTRIES
  ) {
    addViolation(context, {
      code: "filesystem_resource_limit_exceeded",
      detail: `expected_filesystem_entries=${expectedFiles.size + expectedDirectoryCount};max_filesystem_entries=${NHM2_PREDICTION_BOOTSTRAP_MAX_FILESYSTEM_ENTRIES}`,
    });
  }
  if (context.violations.length > 0) {
    return failed({
      context,
      freezeArtifactPath: freezePath,
      freezeSha256: observedFreeze.sha256,
      artifact,
      contentVerification: null,
    });
  }
  const inventoryBefore = await snapshotExactInventory({
    context,
    expectedFiles,
  });

  const observations = new Map<string, ObservedFile>([
    [freezePath, observedFreeze],
  ]);
  const closurePaths = new Set(
    artifact.artifactClosure.entries.map((entry) => entry.path),
  );
  const contentVerification =
    await verifyNhm2PredictionBootstrapFreezeFromBytes({
      freezeBytes: observedFreeze.bytes,
      readBytes: async (relativePath) => {
        if (!closurePaths.has(relativePath)) {
          addViolation(context, {
            code: "filesystem_read_failed",
            path: relativePath,
            detail: "content_verifier_requested_undeclared_path",
          });
          throw new Error("undeclared bootstrap path");
        }
        const prior = observations.get(relativePath);
        if (prior != null) return Buffer.from(prior.bytes);
        const observed = await readContainedRegularFile(
          context,
          relativePath,
          maxFileBytes,
        );
        if (observed == null) throw new Error("bootstrap path unreadable");
        const artifactPreflight = parseBoundedCanonicalJson({
          context,
          relativePath,
          bytes: observed.bytes,
          kind: "artifact",
        });
        if (!artifactPreflight.ok) {
          throw new Error("bootstrap artifact encoding invalid");
        }
        observations.set(relativePath, observed);
        return Buffer.from(observed.bytes);
      },
    });
  if (!contentVerification.valid) {
    for (const blocker of contentVerification.blockers) {
      addViolation(context, {
        code: "content_verification_failed",
        detail: blocker,
      });
    }
  }

  await input.afterSemanticVerificationForTesting?.();

  for (const relativePath of [...expectedFiles].sort(utf8Compare)) {
    const prior = observations.get(relativePath);
    const after = await readContainedRegularFile(
      context,
      relativePath,
      relativePath === freezePath
        ? NHM2_PREDICTION_BOOTSTRAP_MAX_FREEZE_BYTES
        : maxFileBytes,
    );
    if (prior == null || after == null) {
      addViolation(context, {
        code: "filesystem_file_changed",
        path: relativePath,
        detail: "missing_pre_or_post_observation",
      });
      continue;
    }
    if (
      prior.sha256 !== after.sha256 ||
      prior.sizeBytes !== after.sizeBytes ||
      !isDeepStrictEqual(prior.identity, after.identity)
    ) {
      addViolation(context, {
        code: "filesystem_file_changed",
        path: relativePath,
        detail: "post_verification_identity_or_hash_mismatch",
      });
    }
  }
  const inventoryAfter = await snapshotExactInventory({
    context,
    expectedFiles,
  });
  if (!isDeepStrictEqual(inventoryBefore, inventoryAfter)) {
    addViolation(context, { code: "filesystem_inventory_changed" });
  }

  if (
    context.violations.length > 0 ||
    !contentVerification.valid ||
    observations.size !== expectedFiles.size
  ) {
    return failed({
      context,
      freezeArtifactPath: freezePath,
      freezeSha256: observedFreeze.sha256,
      artifact,
      contentVerification,
    });
  }
  return {
    verified: true,
    violations: [],
    bootstrapRootRealPath: rootRealPath,
    freezeArtifactPath: freezePath,
    freezeSha256: observedFreeze.sha256,
    artifact,
    contentVerification:
      contentVerification as Nhm2PredictionBootstrapVerificationV1 & {
        valid: true;
      },
    files: [...observations.values()]
      .sort((left, right) => utf8Compare(left.path, right.path))
      .map(({ identity: _identity, bytes: _bytes, ...file }) => file),
    claimBoundary: CLAIM_BOUNDARY,
  };
}
