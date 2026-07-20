import { createHash } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual, TextDecoder } from "node:util";

import {
  nhm2PrimaryRawOutputManifestViolations,
  type Nhm2PrimaryRawOutputFileV1,
  type Nhm2PrimaryRawOutputManifestV1,
  type Nhm2PrimaryRawOutputRecordSchemaFieldV1,
} from "../../../shared/contracts/nhm2-primary-raw-output-manifest.v1";

export const NHM2_PRIMARY_RAW_OUTPUT_DEFAULT_FRESHNESS_TOLERANCE_MS =
  2_000 as const;
export const NHM2_PRIMARY_RAW_OUTPUT_MAX_FRESHNESS_TOLERANCE_MS =
  5_000 as const;
export const NHM2_PRIMARY_RAW_OUTPUT_MAX_MANIFEST_BYTES = 8 * 1024 * 1024;
export const NHM2_PRIMARY_RAW_OUTPUT_DEFAULT_MAX_FILE_BYTES = 128 * 1024 * 1024;
export const NHM2_PRIMARY_RAW_OUTPUT_DEFAULT_MAX_TOTAL_BYTES =
  512 * 1024 * 1024;
export const NHM2_PRIMARY_RAW_OUTPUT_HARD_MAX_FILE_BYTES = 1024 * 1024 * 1024;
export const NHM2_PRIMARY_RAW_OUTPUT_HARD_MAX_TOTAL_BYTES =
  2 * 1024 * 1024 * 1024;

export type Nhm2PrimaryRawOutputFilesystemViolationCode =
  | "verifier_input_invalid"
  | "trusted_execution_invalid"
  | "trusted_binding_mismatch"
  | "run_root_unreadable"
  | "run_root_symlink_or_reparse"
  | "run_root_not_directory"
  | "manifest_path_escape"
  | "manifest_expected_path_collision"
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
  | "filesystem_read_failed"
  | "filesystem_file_changed"
  | "filesystem_freshness_outside_interval"
  | "filesystem_resource_limit_exceeded"
  | "manifest_bom_forbidden"
  | "manifest_utf8_invalid"
  | "manifest_json_invalid"
  | "manifest_json_not_canonical"
  | "manifest_structural_validator_failed"
  | "manifest_structural_invalid"
  | "file_size_mismatch"
  | "file_sha256_mismatch"
  | "numerical_byte_alignment_invalid"
  | "numerical_nonfinite"
  | "record_bom_forbidden"
  | "record_utf8_invalid"
  | "record_newline_invalid"
  | "record_json_invalid"
  | "record_json_not_canonical"
  | "record_not_object"
  | "record_schema_fields_mismatch"
  | "record_nullability_violation"
  | "record_type_mismatch"
  | "record_count_mismatch"
  | "record_primary_key_duplicate";

export type Nhm2PrimaryRawOutputFilesystemViolation = {
  code: Nhm2PrimaryRawOutputFilesystemViolationCode;
  path?: string;
  field?: string;
  recordIndex?: number;
  detail?: string;
};

export type Nhm2PrimaryRawOutputTrustedBindings = {
  identity: Nhm2PrimaryRawOutputManifestV1["identity"];
  execution: Nhm2PrimaryRawOutputManifestV1["execution"];
  inputClosure: Nhm2PrimaryRawOutputManifestV1["inputClosure"];
};

export type Nhm2PrimaryRawOutputFilesystemVerifierInput = {
  /** A trusted, run-specific output directory created before spawning the child. */
  runRoot: string;
  /** Absolute, or relative to runRoot, path to the child manifest. */
  manifestPath: string;
  /** Values observed or admitted by the outer executor, never by the child. */
  trusted: Nhm2PrimaryRawOutputTrustedBindings;
  /** Filesystem timestamp allowance. Deliberately capped at five seconds. */
  freshnessToleranceMs?: number;
  /** Per-raw-file in-memory ceiling, itself bounded by a verifier hard limit. */
  maxFileBytes?: number;
  /** Aggregate declared raw-byte ceiling, itself bounded by a verifier hard limit. */
  maxTotalBytes?: number;
};

export type Nhm2PrimaryRawOutputVerifiedNumericalFile = {
  kind: "numerical_array";
  descriptor: Nhm2PrimaryRawOutputFileV1;
  absolutePath: string;
  observedSha256: string;
  observedSizeBytes: number;
  observedMtimeMs: number;
  observedCtimeMs: number;
  values: Float64Array;
};

export type Nhm2PrimaryRawOutputVerifiedRecordFile = {
  kind: "records";
  descriptor: Nhm2PrimaryRawOutputFileV1;
  absolutePath: string;
  observedSha256: string;
  observedSizeBytes: number;
  observedMtimeMs: number;
  observedCtimeMs: number;
  records: ReadonlyArray<Readonly<Record<string, unknown>>>;
};

export type Nhm2PrimaryRawOutputVerifiedFile =
  | Nhm2PrimaryRawOutputVerifiedNumericalFile
  | Nhm2PrimaryRawOutputVerifiedRecordFile;

export type Nhm2PrimaryRawOutputFilesystemVerification =
  | {
      verified: true;
      violations: [];
      runRootRealPath: string;
      manifestPath: string;
      manifestSha256: string;
      manifest: Nhm2PrimaryRawOutputManifestV1;
      files: Nhm2PrimaryRawOutputVerifiedFile[];
    }
  | {
      verified: false;
      violations: Nhm2PrimaryRawOutputFilesystemViolation[];
      runRootRealPath: string | null;
      manifestPath: string | null;
      manifestSha256: string | null;
      manifest: Nhm2PrimaryRawOutputManifestV1 | null;
      files: [];
    };

type VerificationContext = {
  runRoot: string;
  runRootRealPath: string;
  startedMs: number;
  completedMs: number;
  toleranceMs: number;
  violations: Nhm2PrimaryRawOutputFilesystemViolation[];
  violationKeys: Set<string>;
};

type ObservedFile = {
  absolutePath: string;
  bytes: Buffer;
  sha256: string;
  sizeBytes: number;
  mtimeMs: number;
  ctimeMs: number;
};

type InventorySnapshot = Array<{
  path: string;
  kind: "directory" | "file" | "other" | "symlink";
  dev: string;
  ino: string;
  size: number;
  mtimeMs: number;
  ctimeMs: number;
  nlink: number;
}>;

const SHA256 = /^[a-f0-9]{64}$/;
const SIGNED_INT64_MIN = -(1n << 63n);
const SIGNED_INT64_MAX = (1n << 63n) - 1n;
const UTF8_BOM = Buffer.from([0xef, 0xbb, 0xbf]);

const utf8Compare = (left: string, right: string): number =>
  Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));

const toPortablePath = (value: string): string =>
  value.split(path.sep).join("/");

const isInside = (root: string, candidate: string): boolean => {
  const relative = path.relative(root, candidate);
  return (
    relative.length === 0 ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  );
};

const normalizedFilesystemPath = (value: string): string => {
  const resolved = path.resolve(value);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
};

const sameFilesystemPath = (left: string, right: string): boolean =>
  normalizedFilesystemPath(left) === normalizedFilesystemPath(right);

const sha256 = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");

const isoMilliseconds = (value: string): number | null => {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value
    ? parsed
    : null;
};

const addViolation = (
  context: Pick<VerificationContext, "violations" | "violationKeys">,
  violation: Nhm2PrimaryRawOutputFilesystemViolation,
): void => {
  const key = JSON.stringify(violation);
  if (context.violationKeys.has(key)) return;
  context.violationKeys.add(key);
  context.violations.push(violation);
};

const initialFailure = (
  violations: Nhm2PrimaryRawOutputFilesystemViolation[],
): Nhm2PrimaryRawOutputFilesystemVerification => ({
  verified: false,
  violations,
  runRootRealPath: null,
  manifestPath: null,
  manifestSha256: null,
  manifest: null,
  files: [],
});

const failedVerification = (input: {
  context: VerificationContext;
  manifestPath: string | null;
  manifestSha256: string | null;
  manifest: Nhm2PrimaryRawOutputManifestV1 | null;
}): Nhm2PrimaryRawOutputFilesystemVerification => ({
  verified: false,
  violations: input.context.violations,
  runRootRealPath: input.context.runRootRealPath,
  manifestPath: input.manifestPath,
  manifestSha256: input.manifestSha256,
  manifest: input.manifest,
  files: [],
});

const fileStatIdentity = (stat: Awaited<ReturnType<typeof fs.lstat>>) => ({
  dev: stat.dev,
  ino: stat.ino,
  size: stat.size,
  mtimeMs: stat.mtimeMs,
  ctimeMs: stat.ctimeMs,
  nlink: stat.nlink,
});

const fileStatIdentityMatches = (
  left: Awaited<ReturnType<typeof fs.lstat>>,
  right: Awaited<ReturnType<typeof fs.lstat>>,
): boolean =>
  isDeepStrictEqual(fileStatIdentity(left), fileStatIdentity(right));

async function readObservedRegularFile(
  context: VerificationContext,
  relativePath: string,
  maxBytes: number,
): Promise<ObservedFile | null> {
  const absolutePath = path.resolve(
    context.runRoot,
    ...relativePath.split("/"),
  );
  if (!isInside(context.runRoot, absolutePath)) {
    addViolation(context, { code: "manifest_path_escape", path: relativePath });
    return null;
  }

  let before: Awaited<ReturnType<typeof fs.lstat>>;
  try {
    before = await fs.lstat(absolutePath);
  } catch (error) {
    addViolation(context, {
      code: "filesystem_entry_unreadable",
      path: relativePath,
      detail: (error as NodeJS.ErrnoException).code ?? "unknown",
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
  if (!isInside(context.runRootRealPath, realPath)) {
    addViolation(context, {
      code: "filesystem_realpath_escape",
      path: relativePath,
    });
    return null;
  }
  const expectedRealPath = path.resolve(
    context.runRootRealPath,
    ...relativePath.split("/"),
  );
  if (!sameFilesystemPath(realPath, expectedRealPath)) {
    addViolation(context, {
      code: "filesystem_reparse_alias",
      path: relativePath,
    });
    return null;
  }

  const lowerBound = context.startedMs - context.toleranceMs;
  const upperBound = context.completedMs + context.toleranceMs;
  if (
    !Number.isFinite(before.mtimeMs) ||
    !Number.isFinite(before.ctimeMs) ||
    before.mtimeMs < lowerBound ||
    before.mtimeMs > upperBound ||
    before.ctimeMs < lowerBound ||
    before.ctimeMs > upperBound
  ) {
    addViolation(context, {
      code: "filesystem_freshness_outside_interval",
      path: relativePath,
      detail: `mtimeMs=${before.mtimeMs};ctimeMs=${before.ctimeMs};window=${lowerBound}..${upperBound}`,
    });
  }

  let handle: Awaited<ReturnType<typeof fs.open>> | null = null;
  try {
    const noFollow =
      process.platform === "win32" ? 0 : (fsConstants.O_NOFOLLOW ?? 0);
    handle = await fs.open(absolutePath, fsConstants.O_RDONLY | noFollow);
    const opened = await handle.stat();
    if (!fileStatIdentityMatches(before, opened)) {
      addViolation(context, {
        code: "filesystem_file_changed",
        path: relativePath,
        detail: "lstat_open_identity_mismatch",
      });
      return null;
    }
    const bytes = await handle.readFile();
    const after = await fs.lstat(absolutePath);
    if (
      after.isSymbolicLink() ||
      !after.isFile() ||
      after.nlink !== 1 ||
      !fileStatIdentityMatches(before, after)
    ) {
      addViolation(context, {
        code: "filesystem_file_changed",
        path: relativePath,
        detail: "post_read_identity_mismatch",
      });
      return null;
    }
    return {
      absolutePath,
      bytes,
      sha256: sha256(bytes),
      sizeBytes: bytes.byteLength,
      mtimeMs: before.mtimeMs,
      ctimeMs: before.ctimeMs,
    };
  } catch (error) {
    addViolation(context, {
      code: "filesystem_read_failed",
      path: relativePath,
      detail: (error as NodeJS.ErrnoException).code ?? "unknown",
    });
    return null;
  } finally {
    await handle?.close().catch(() => undefined);
  }
}

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

async function snapshotExactInventory(input: {
  context: VerificationContext;
  expectedFiles: ReadonlySet<string>;
}): Promise<InventorySnapshot> {
  const snapshot: InventorySnapshot = [];
  const expectedDirs = expectedDirectories(input.expectedFiles);
  const observedFiles = new Set<string>();

  const visit = async (
    absoluteDirectory: string,
    relativeDirectory: string,
  ) => {
    let entries: Awaited<ReturnType<typeof fs.readdir>>;
    try {
      entries = await fs.readdir(absoluteDirectory, { withFileTypes: true });
    } catch (error) {
      addViolation(input.context, {
        code: "filesystem_entry_unreadable",
        path: relativeDirectory || ".",
        detail: (error as NodeJS.ErrnoException).code ?? "readdir_failed",
      });
      return;
    }
    entries.sort((left, right) => utf8Compare(left.name, right.name));
    for (const entry of entries) {
      const absoluteEntry = path.join(absoluteDirectory, entry.name);
      const relativeEntry = relativeDirectory
        ? `${relativeDirectory}/${entry.name}`
        : entry.name;
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
        dev: String(stat.dev),
        ino: String(stat.ino),
        size: stat.size,
        mtimeMs: stat.mtimeMs,
        ctimeMs: stat.ctimeMs,
        nlink: stat.nlink,
      });

      if (stat.isSymbolicLink()) {
        addViolation(input.context, {
          code: "filesystem_entry_symlink_or_reparse",
          path: relativeEntry,
        });
        continue;
      }
      if (stat.isDirectory()) {
        if (!expectedDirs.has(relativeEntry)) {
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
            detail: (error as NodeJS.ErrnoException).code ?? "realpath_failed",
          });
          continue;
        }
        const expectedRealDirectory = path.resolve(
          input.context.runRootRealPath,
          ...relativeEntry.split("/"),
        );
        if (!isInside(input.context.runRootRealPath, realDirectory)) {
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
        await visit(absoluteEntry, relativeEntry);
        continue;
      }
      if (!stat.isFile()) {
        addViolation(input.context, {
          code: "filesystem_entry_not_regular",
          path: relativeEntry,
        });
        continue;
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
  };

  await visit(input.context.runRoot, "");
  for (const expectedFile of [...input.expectedFiles].sort(utf8Compare)) {
    if (!observedFiles.has(expectedFile)) {
      addViolation(input.context, {
        code: "filesystem_missing_file",
        path: expectedFile,
      });
    }
  }
  return snapshot.sort((left, right) => utf8Compare(left.path, right.path));
}

const hasUtf8Bom = (bytes: Uint8Array): boolean =>
  bytes.byteLength >= UTF8_BOM.byteLength &&
  Buffer.from(bytes.subarray(0, UTF8_BOM.byteLength)).equals(UTF8_BOM);

const decodeUtf8 = (input: {
  bytes: Uint8Array;
  context: VerificationContext;
  relativePath: string;
  kind: "manifest" | "record";
}): string | null => {
  if (hasUtf8Bom(input.bytes)) {
    addViolation(input.context, {
      code:
        input.kind === "manifest"
          ? "manifest_bom_forbidden"
          : "record_bom_forbidden",
      path: input.relativePath,
    });
    return null;
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(input.bytes);
  } catch {
    addViolation(input.context, {
      code:
        input.kind === "manifest"
          ? "manifest_utf8_invalid"
          : "record_utf8_invalid",
      path: input.relativePath,
    });
    return null;
  }
};

const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isCanonicalInt64 = (value: unknown): value is string => {
  if (
    typeof value !== "string" ||
    !/^(?:0|-[1-9][0-9]*|[1-9][0-9]*)$/.test(value)
  ) {
    return false;
  }
  try {
    const parsed = BigInt(value);
    return parsed >= SIGNED_INT64_MIN && parsed <= SIGNED_INT64_MAX;
  } catch {
    return false;
  }
};

const recordFieldMatches = (
  field: Nhm2PrimaryRawOutputRecordSchemaFieldV1,
  value: unknown,
): boolean => {
  switch (field.type) {
    case "boolean":
      return typeof value === "boolean";
    case "int64":
      return isCanonicalInt64(value);
    case "float64":
      return typeof value === "number" && Number.isFinite(value);
    case "string":
      return typeof value === "string";
    case "timestamp_iso8601":
      return typeof value === "string" && isoMilliseconds(value) != null;
    case "sha256":
      return (
        typeof value === "string" &&
        SHA256.test(value) &&
        !/^0{64}$/.test(value)
      );
  }
};

const parseCanonicalRecord = (input: {
  context: VerificationContext;
  relativePath: string;
  source: string;
  recordIndex: number;
}): Record<string, unknown> | null => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input.source);
  } catch (error) {
    addViolation(input.context, {
      code: "record_json_invalid",
      path: input.relativePath,
      recordIndex: input.recordIndex,
      detail: error instanceof Error ? error.message : "parse_failed",
    });
    return null;
  }
  if (!isPlainRecord(parsed)) {
    addViolation(input.context, {
      code: "record_not_object",
      path: input.relativePath,
      recordIndex: input.recordIndex,
    });
    return null;
  }
  if (JSON.stringify(parsed) !== input.source) {
    addViolation(input.context, {
      code: "record_json_not_canonical",
      path: input.relativePath,
      recordIndex: input.recordIndex,
    });
  }
  return parsed;
};

const parseRecordFile = (input: {
  context: VerificationContext;
  relativePath: string;
  bytes: Buffer;
  descriptor: Nhm2PrimaryRawOutputFileV1;
}): Array<Readonly<Record<string, unknown>>> | null => {
  if (input.descriptor.representation.kind !== "records") return null;
  const text = decodeUtf8({
    bytes: input.bytes,
    context: input.context,
    relativePath: input.relativePath,
    kind: "record",
  });
  if (text == null) return null;

  const sources: string[] = [];
  if (input.descriptor.representation.format === "json") {
    if (
      text.length === 0 ||
      text.trim() !== text ||
      text.includes("\n") ||
      text.includes("\r")
    ) {
      addViolation(input.context, {
        code: "record_newline_invalid",
        path: input.relativePath,
        detail: "single_record_requires_one_unpadded_line",
      });
      return null;
    }
    sources.push(text);
  } else {
    if (
      text.length === 0 ||
      text.includes("\r") ||
      !text.endsWith("\n") ||
      text.endsWith("\n\n")
    ) {
      addViolation(input.context, {
        code: "record_newline_invalid",
        path: input.relativePath,
        detail: "ndjson_requires_nonempty_lf_terminated_records",
      });
      return null;
    }
    sources.push(...text.slice(0, -1).split("\n"));
    if (
      sources.some((source) => source.length === 0 || source.trim() !== source)
    ) {
      addViolation(input.context, {
        code: "record_newline_invalid",
        path: input.relativePath,
        detail: "ndjson_blank_or_padded_record",
      });
      return null;
    }
  }

  const schema = input.descriptor.representation.schema;
  const expectedFields = schema.fields.map((field) => field.name);
  const primaryKeys = new Set<string>();
  const records: Array<Readonly<Record<string, unknown>>> = [];
  for (const [recordIndex, source] of sources.entries()) {
    const record = parseCanonicalRecord({
      context: input.context,
      relativePath: input.relativePath,
      source,
      recordIndex,
    });
    if (record == null) continue;
    if (!isDeepStrictEqual(Object.keys(record), expectedFields)) {
      addViolation(input.context, {
        code: "record_schema_fields_mismatch",
        path: input.relativePath,
        recordIndex,
        detail: `expected=${expectedFields.join(",")};observed=${Object.keys(record).join(",")}`,
      });
    }
    for (const field of schema.fields) {
      const value = record[field.name];
      if (value === null) {
        if (!field.nullable) {
          addViolation(input.context, {
            code: "record_nullability_violation",
            path: input.relativePath,
            field: field.name,
            recordIndex,
          });
        }
        continue;
      }
      if (!recordFieldMatches(field, value)) {
        addViolation(input.context, {
          code: "record_type_mismatch",
          path: input.relativePath,
          field: field.name,
          recordIndex,
          detail:
            field.type === "int64"
              ? "int64_requires_canonical_signed_decimal_string"
              : `expected=${field.type}`,
        });
      }
    }
    const primaryKey = JSON.stringify(
      schema.primaryKey.map((fieldName) => record[fieldName]),
    );
    if (primaryKeys.has(primaryKey)) {
      addViolation(input.context, {
        code: "record_primary_key_duplicate",
        path: input.relativePath,
        recordIndex,
        detail: primaryKey,
      });
    }
    primaryKeys.add(primaryKey);
    records.push(Object.freeze(record));
  }
  if (records.length !== input.descriptor.representation.recordCount) {
    addViolation(input.context, {
      code: "record_count_mismatch",
      path: input.relativePath,
      detail: `expected=${input.descriptor.representation.recordCount};observed=${records.length}`,
    });
  }
  return records;
};

const parseNumericalFile = (input: {
  context: VerificationContext;
  relativePath: string;
  bytes: Buffer;
}): Float64Array => {
  if (input.bytes.byteLength % Float64Array.BYTES_PER_ELEMENT !== 0) {
    addViolation(input.context, {
      code: "numerical_byte_alignment_invalid",
      path: input.relativePath,
      detail: `sizeBytes=${input.bytes.byteLength}`,
    });
    return new Float64Array();
  }
  const count = input.bytes.byteLength / Float64Array.BYTES_PER_ELEMENT;
  const values = new Float64Array(count);
  const view = new DataView(
    input.bytes.buffer,
    input.bytes.byteOffset,
    input.bytes.byteLength,
  );
  for (let index = 0; index < count; index += 1) {
    const value = view.getFloat64(index * Float64Array.BYTES_PER_ELEMENT, true);
    values[index] = value;
    if (!Number.isFinite(value)) {
      addViolation(input.context, {
        code: "numerical_nonfinite",
        path: input.relativePath,
        detail: `element=${index}`,
      });
    }
  }
  return values;
};

const validateTrustedExecution = (
  trusted: Nhm2PrimaryRawOutputTrustedBindings,
): { startedMs: number; completedMs: number } | null => {
  const runtimeTrusted = trusted as unknown;
  if (
    !isPlainRecord(runtimeTrusted) ||
    !isPlainRecord(runtimeTrusted.execution)
  ) {
    return null;
  }
  const execution = runtimeTrusted.execution;
  if (
    typeof execution.startedAt !== "string" ||
    typeof execution.completedAt !== "string"
  ) {
    return null;
  }
  const startedMs = isoMilliseconds(execution.startedAt);
  const completedMs = isoMilliseconds(execution.completedAt);
  if (
    startedMs == null ||
    completedMs == null ||
    completedMs <= startedMs ||
    !Number.isSafeInteger(execution.durationMs) ||
    execution.durationMs !== completedMs - startedMs ||
    execution.exitCode !== 0 ||
    execution.terminationSignal !== null
  ) {
    return null;
  }
  return { startedMs, completedMs };
};

const exactMatchTrustedBindings = (input: {
  context: VerificationContext;
  manifest: Nhm2PrimaryRawOutputManifestV1;
  trusted: Nhm2PrimaryRawOutputTrustedBindings;
}): void => {
  if (!isDeepStrictEqual(input.manifest.identity, input.trusted.identity)) {
    addViolation(input.context, {
      code: "trusted_binding_mismatch",
      detail: "identity",
    });
  }
  if (
    !isDeepStrictEqual(input.manifest.inputClosure, input.trusted.inputClosure)
  ) {
    addViolation(input.context, {
      code: "trusted_binding_mismatch",
      detail: "inputClosure",
    });
  }
  const executionFields = [
    "planRole",
    "requestId",
    "runId",
    "runtimeId",
    "receiptId",
    "sourceCommitSha",
    "solver",
    "environment",
    "producerBundle",
    "invocation",
    "deterministicSeed",
    "exitCode",
    "terminationSignal",
  ] as const satisfies ReadonlyArray<
    keyof Nhm2PrimaryRawOutputManifestV1["execution"]
  >;
  for (const field of executionFields) {
    if (
      !isDeepStrictEqual(
        input.manifest.execution[field],
        input.trusted.execution[field],
      )
    ) {
      addViolation(input.context, {
        code: "trusted_binding_mismatch",
        field,
        detail: "execution",
      });
    }
  }
  const childStartedMs = isoMilliseconds(input.manifest.execution.startedAt);
  const childCompletedMs = isoMilliseconds(input.manifest.execution.completedAt);
  const outerStartedMs = isoMilliseconds(input.trusted.execution.startedAt);
  const outerCompletedMs = isoMilliseconds(input.trusted.execution.completedAt);
  if (
    childStartedMs == null ||
    childCompletedMs == null ||
    outerStartedMs == null ||
    outerCompletedMs == null ||
    childStartedMs < outerStartedMs ||
    childCompletedMs > outerCompletedMs ||
    childCompletedMs <= childStartedMs ||
    input.manifest.execution.durationMs !== childCompletedMs - childStartedMs
  ) {
    addViolation(input.context, {
      code: "trusted_binding_mismatch",
      field: "executionInterval",
      detail: "child_interval_must_be_exact_and_nested_in_outer_execution",
    });
  }
  if (
    input.manifest.execution.exitCode !== 0 ||
    input.manifest.execution.terminationSignal !== null
  ) {
    addViolation(input.context, {
      code: "trusted_execution_invalid",
      detail: "accepted_output_requires_exit_zero_and_null_signal",
    });
  }
};

/**
 * Verifies only protocol, provenance, filesystem, and raw encoding facts. It
 * deliberately computes no scientific check, disposition, or viability claim.
 */
export async function verifyNhm2PrimaryRawOutputFilesystem(
  input: Nhm2PrimaryRawOutputFilesystemVerifierInput,
): Promise<Nhm2PrimaryRawOutputFilesystemVerification> {
  const initialViolations: Nhm2PrimaryRawOutputFilesystemViolation[] = [];
  if (
    typeof input.runRoot !== "string" ||
    input.runRoot.length === 0 ||
    typeof input.manifestPath !== "string" ||
    input.manifestPath.length === 0
  ) {
    return initialFailure([{ code: "verifier_input_invalid" }]);
  }
  const toleranceMs =
    input.freshnessToleranceMs ??
    NHM2_PRIMARY_RAW_OUTPUT_DEFAULT_FRESHNESS_TOLERANCE_MS;
  if (
    !Number.isSafeInteger(toleranceMs) ||
    toleranceMs < 0 ||
    toleranceMs > NHM2_PRIMARY_RAW_OUTPUT_MAX_FRESHNESS_TOLERANCE_MS
  ) {
    return initialFailure([
      {
        code: "verifier_input_invalid",
        field: "freshnessToleranceMs",
        detail: `must_be_0_to_${NHM2_PRIMARY_RAW_OUTPUT_MAX_FRESHNESS_TOLERANCE_MS}`,
      },
    ]);
  }
  const maxFileBytes =
    input.maxFileBytes ?? NHM2_PRIMARY_RAW_OUTPUT_DEFAULT_MAX_FILE_BYTES;
  const maxTotalBytes =
    input.maxTotalBytes ?? NHM2_PRIMARY_RAW_OUTPUT_DEFAULT_MAX_TOTAL_BYTES;
  if (
    !Number.isSafeInteger(maxFileBytes) ||
    maxFileBytes <= 0 ||
    maxFileBytes > NHM2_PRIMARY_RAW_OUTPUT_HARD_MAX_FILE_BYTES
  ) {
    return initialFailure([
      {
        code: "verifier_input_invalid",
        field: "maxFileBytes",
        detail: `must_be_1_to_${NHM2_PRIMARY_RAW_OUTPUT_HARD_MAX_FILE_BYTES}`,
      },
    ]);
  }
  if (
    !Number.isSafeInteger(maxTotalBytes) ||
    maxTotalBytes <= 0 ||
    maxTotalBytes > NHM2_PRIMARY_RAW_OUTPUT_HARD_MAX_TOTAL_BYTES
  ) {
    return initialFailure([
      {
        code: "verifier_input_invalid",
        field: "maxTotalBytes",
        detail: `must_be_1_to_${NHM2_PRIMARY_RAW_OUTPUT_HARD_MAX_TOTAL_BYTES}`,
      },
    ]);
  }
  const trustedWindow = validateTrustedExecution(input.trusted);
  if (trustedWindow == null) {
    return initialFailure([{ code: "trusted_execution_invalid" }]);
  }

  const runRoot = path.resolve(input.runRoot);
  let rootStat: Awaited<ReturnType<typeof fs.lstat>>;
  try {
    rootStat = await fs.lstat(runRoot);
  } catch (error) {
    return initialFailure([
      {
        code: "run_root_unreadable",
        detail: (error as NodeJS.ErrnoException).code ?? "unknown",
      },
    ]);
  }
  if (rootStat.isSymbolicLink()) {
    return initialFailure([{ code: "run_root_symlink_or_reparse" }]);
  }
  if (!rootStat.isDirectory()) {
    return initialFailure([{ code: "run_root_not_directory" }]);
  }
  let runRootRealPath: string;
  try {
    runRootRealPath = await fs.realpath(runRoot);
  } catch (error) {
    return initialFailure([
      {
        code: "run_root_unreadable",
        detail: (error as NodeJS.ErrnoException).code ?? "realpath_failed",
      },
    ]);
  }
  const context: VerificationContext = {
    runRoot,
    runRootRealPath,
    startedMs: trustedWindow.startedMs,
    completedMs: trustedWindow.completedMs,
    toleranceMs,
    violations: initialViolations,
    violationKeys: new Set(),
  };

  const manifestAbsolutePath = path.isAbsolute(input.manifestPath)
    ? path.resolve(input.manifestPath)
    : path.resolve(runRoot, input.manifestPath);
  if (!isInside(runRoot, manifestAbsolutePath)) {
    addViolation(context, { code: "manifest_path_escape" });
    return failedVerification({
      context,
      manifestPath: null,
      manifestSha256: null,
      manifest: null,
    });
  }
  const manifestRelativePath = toPortablePath(
    path.relative(runRoot, manifestAbsolutePath),
  );
  if (manifestRelativePath.length === 0) {
    addViolation(context, { code: "manifest_path_escape" });
    return failedVerification({
      context,
      manifestPath: null,
      manifestSha256: null,
      manifest: null,
    });
  }

  const observedManifest = await readObservedRegularFile(
    context,
    manifestRelativePath,
    NHM2_PRIMARY_RAW_OUTPUT_MAX_MANIFEST_BYTES,
  );
  if (observedManifest == null) {
    return failedVerification({
      context,
      manifestPath: manifestAbsolutePath,
      manifestSha256: null,
      manifest: null,
    });
  }
  const manifestText = decodeUtf8({
    bytes: observedManifest.bytes,
    context,
    relativePath: manifestRelativePath,
    kind: "manifest",
  });
  if (manifestText == null) {
    return failedVerification({
      context,
      manifestPath: manifestAbsolutePath,
      manifestSha256: observedManifest.sha256,
      manifest: null,
    });
  }
  let parsedManifest: unknown;
  try {
    parsedManifest = JSON.parse(manifestText);
  } catch (error) {
    addViolation(context, {
      code: "manifest_json_invalid",
      path: manifestRelativePath,
      detail: error instanceof Error ? error.message : "parse_failed",
    });
    return failedVerification({
      context,
      manifestPath: manifestAbsolutePath,
      manifestSha256: observedManifest.sha256,
      manifest: null,
    });
  }
  if (JSON.stringify(parsedManifest) !== manifestText) {
    addViolation(context, {
      code: "manifest_json_not_canonical",
      path: manifestRelativePath,
    });
  }
  let structuralViolations: string[];
  try {
    structuralViolations =
      nhm2PrimaryRawOutputManifestViolations(parsedManifest);
  } catch (error) {
    addViolation(context, {
      code: "manifest_structural_validator_failed",
      detail: error instanceof Error ? error.message : "unknown",
    });
    return failedVerification({
      context,
      manifestPath: manifestAbsolutePath,
      manifestSha256: observedManifest.sha256,
      manifest: null,
    });
  }
  for (const detail of structuralViolations) {
    addViolation(context, { code: "manifest_structural_invalid", detail });
  }
  if (structuralViolations.length > 0 || !isPlainRecord(parsedManifest)) {
    return failedVerification({
      context,
      manifestPath: manifestAbsolutePath,
      manifestSha256: observedManifest.sha256,
      manifest: null,
    });
  }
  const manifest = parsedManifest as Nhm2PrimaryRawOutputManifestV1;
  exactMatchTrustedBindings({ context, manifest, trusted: input.trusted });

  let declaredTotalBytes = 0;
  for (const descriptor of manifest.fileInventory.files) {
    if (descriptor.sizeBytes > maxFileBytes) {
      addViolation(context, {
        code: "filesystem_resource_limit_exceeded",
        path: descriptor.path,
        detail: `declared_bytes=${descriptor.sizeBytes};max_file_bytes=${maxFileBytes}`,
      });
    }
    declaredTotalBytes += descriptor.sizeBytes;
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
    return failedVerification({
      context,
      manifestPath: manifestAbsolutePath,
      manifestSha256: observedManifest.sha256,
      manifest,
    });
  }

  const expectedFiles = new Set<string>([
    manifestRelativePath,
    ...manifest.fileInventory.files.map((file) => file.path),
  ]);
  if (expectedFiles.size !== manifest.fileInventory.files.length + 1) {
    addViolation(context, {
      code: "manifest_expected_path_collision",
      path: manifestRelativePath,
    });
  }
  const inventoryBefore = await snapshotExactInventory({
    context,
    expectedFiles,
  });

  const verifiedFiles: Nhm2PrimaryRawOutputVerifiedFile[] = [];
  for (const descriptor of manifest.fileInventory.files) {
    const observed = await readObservedRegularFile(
      context,
      descriptor.path,
      maxFileBytes,
    );
    if (observed == null) continue;
    if (observed.sizeBytes !== descriptor.sizeBytes) {
      addViolation(context, {
        code: "file_size_mismatch",
        path: descriptor.path,
        detail: `expected=${descriptor.sizeBytes};observed=${observed.sizeBytes}`,
      });
    }
    if (observed.sha256 !== descriptor.sha256) {
      addViolation(context, {
        code: "file_sha256_mismatch",
        path: descriptor.path,
        detail: `expected=${descriptor.sha256};observed=${observed.sha256}`,
      });
    }
    if (descriptor.representation.kind === "numerical_array") {
      verifiedFiles.push({
        kind: "numerical_array",
        descriptor,
        absolutePath: observed.absolutePath,
        observedSha256: observed.sha256,
        observedSizeBytes: observed.sizeBytes,
        observedMtimeMs: observed.mtimeMs,
        observedCtimeMs: observed.ctimeMs,
        values: parseNumericalFile({
          context,
          relativePath: descriptor.path,
          bytes: observed.bytes,
        }),
      });
    } else {
      const records = parseRecordFile({
        context,
        relativePath: descriptor.path,
        bytes: observed.bytes,
        descriptor,
      });
      if (records != null) {
        verifiedFiles.push({
          kind: "records",
          descriptor,
          absolutePath: observed.absolutePath,
          observedSha256: observed.sha256,
          observedSizeBytes: observed.sizeBytes,
          observedMtimeMs: observed.mtimeMs,
          observedCtimeMs: observed.ctimeMs,
          records,
        });
      }
    }
  }

  const observedManifestAfter = await readObservedRegularFile(
    context,
    manifestRelativePath,
    NHM2_PRIMARY_RAW_OUTPUT_MAX_MANIFEST_BYTES,
  );
  if (
    observedManifestAfter == null ||
    observedManifestAfter.sha256 !== observedManifest.sha256 ||
    observedManifestAfter.sizeBytes !== observedManifest.sizeBytes
  ) {
    addViolation(context, {
      code: "filesystem_file_changed",
      path: manifestRelativePath,
      detail: "manifest_changed_during_verification",
    });
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
    verifiedFiles.length !== manifest.fileInventory.files.length
  ) {
    return failedVerification({
      context,
      manifestPath: manifestAbsolutePath,
      manifestSha256: observedManifest.sha256,
      manifest,
    });
  }
  return {
    verified: true,
    violations: [],
    runRootRealPath,
    manifestPath: manifestAbsolutePath,
    manifestSha256: observedManifest.sha256,
    manifest,
    files: verifiedFiles,
  };
}
