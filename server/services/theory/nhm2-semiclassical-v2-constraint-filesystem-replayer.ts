import { types as nodeUtilTypes } from "node:util";

import {
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ARRAY_COUNT,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ARRAY_SIZE_BYTES,
  collectNhm2SemiclassicalV2ConstraintOperandArrays,
  nhm2SemiclassicalV2ConstraintOperandReplayViolations,
  type Nhm2SemiclassicalV2ConstraintOperandReplayV1,
} from "../../../shared/contracts/nhm2-semiclassical-v2-constraint-operand-replay.v1";
import {
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAYER_INPUT_CONTRACT_VERSION,
  replayNhm2SemiclassicalV2ConstraintOperands,
  type Nhm2SemiclassicalV2ConstraintOperandFileObservationV1,
  type Nhm2SemiclassicalV2ConstraintOperandReplayReceiptV1,
} from "./nhm2-semiclassical-v2-constraint-operand-replayer";
import {
  Nhm2SecureRunOutputReaderError,
  readNhm2SecureRunOutputs,
  type Nhm2SecureRunOutputFilesystemIdentityV1,
} from "./nhm2-secure-run-output-reader";

export const NHM2_SEMICLASSICAL_V2_CONSTRAINT_FILESYSTEM_REPLAYER_ARTIFACT_ID =
  "nhm2.semiclassical_v2_constraint_operand_filesystem_replay_receipt" as const;
export const NHM2_SEMICLASSICAL_V2_CONSTRAINT_FILESYSTEM_REPLAYER_CONTRACT_VERSION =
  "nhm2_semiclassical_v2_constraint_operand_filesystem_replayer/v1" as const;
export const NHM2_SEMICLASSICAL_V2_CONSTRAINT_FILESYSTEM_REPLAYER_INPUT_CONTRACT_VERSION =
  "nhm2_semiclassical_v2_constraint_operand_filesystem_replay_input/v1" as const;

const MANIFEST_MAX_BYTES = 1024 * 1024;
const OUTPUT_AGGREGATE_BYTES =
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ARRAY_COUNT *
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ARRAY_SIZE_BYTES;
const SHA256 = /^[a-f0-9]{64}$/;
const INPUT_KEYS = new Set([
  "contractVersion",
  "manifestRootDirectory",
  "manifestFile",
  "outputRootDirectory",
  "afterManifestInitialReadForTesting",
  "afterOutputInitialReadForTesting",
]);
const MANIFEST_FILE_KEYS = new Set([
  "relativePath",
  "expectedSha256",
  "expectedSizeBytes",
]);
const FORBIDDEN_GRAPH_KEYS = new Set(["__proto__", "prototype", "constructor"]);

export type Nhm2SemiclassicalV2ConstraintFilesystemReplayInputV1 = Readonly<{
  contractVersion: typeof NHM2_SEMICLASSICAL_V2_CONSTRAINT_FILESYSTEM_REPLAYER_INPUT_CONTRACT_VERSION;
  /** Caller-selected absolute root containing exactly the manifest file. */
  manifestRootDirectory: string;
  manifestFile: Readonly<{
    relativePath: string;
    expectedSha256: string;
    expectedSizeBytes: number;
  }>;
  /** Caller-selected absolute root containing exactly the 63 operand files. */
  outputRootDirectory: string;
  /** Test-only race seam forwarded to the secure reader. */
  afterManifestInitialReadForTesting?: () => void | Promise<void>;
  /** Test-only race seam forwarded to the secure reader. */
  afterOutputInitialReadForTesting?: () => void | Promise<void>;
}>;

export type Nhm2SemiclassicalV2ConstraintFilesystemReplayErrorCode =
  | "filesystem_replay_input_invalid"
  | "root_topology_invalid"
  | "manifest_secure_read_failed"
  | "manifest_decode_failed"
  | "manifest_invalid"
  | "output_descriptor_path_invalid"
  | "output_secure_read_failed"
  | "output_binding_mismatch";

export class Nhm2SemiclassicalV2ConstraintFilesystemReplayError extends Error {
  readonly code: Nhm2SemiclassicalV2ConstraintFilesystemReplayErrorCode;
  readonly detailCode: string | null;
  readonly relativePath: string | null;

  constructor(
    code: Nhm2SemiclassicalV2ConstraintFilesystemReplayErrorCode,
    message: string,
    options: {
      cause?: unknown;
      detailCode?: string | null;
      relativePath?: string | null;
    } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "Nhm2SemiclassicalV2ConstraintFilesystemReplayError";
    this.code = code;
    this.detailCode = options.detailCode ?? null;
    this.relativePath = options.relativePath ?? null;
  }
}

export const NHM2_SEMICLASSICAL_V2_CONSTRAINT_FILESYSTEM_REPLAYER_BLOCKERS =
  Object.freeze([
    "caller_selected_manifest_root",
    "caller_selected_manifest_hash_and_size",
    "caller_selected_output_root",
    "server_authorized_roots_not_established",
    "pre_execution_output_absence_and_freshness_not_observed",
    "persisted_scientific_preseal_origin_not_resolved",
    "constraint_target_derivation_not_server_replayed",
    "constraint_joint_uncertainty_coverage_not_server_verified",
    "independent_pair_agreement_not_established",
  ] as const);

export const NHM2_SEMICLASSICAL_V2_CONSTRAINT_FILESYSTEM_REPLAYER_CLAIM_BOUNDARY =
  Object.freeze({
    serverOwnedWrapperImplementationPresent: true as const,
    boundedCurrentManifestReadPerformed: true as const,
    boundedCurrentOutputReadPerformed: true as const,
    exactManifestInventoryObserved: true as const,
    exactOutputInventoryObserved: true as const,
    stableFilesystemIdentityRereadPerformed: true as const,
    manifestBytesHashAndSizeMatchedCallerBinding: true as const,
    everyOperandBytesHashAndSizeMatchedManifest: true as const,
    everyOperandFloat64ValueFinite: true as const,
    canonicalPortableDescriptorPathsVerified: true as const,
    disjointRootTopologyVerifiedForCurrentRead: true as const,
    declaredLeverTensorRead: false as const,
    serverAuthorizedManifestRootEstablished: false as const,
    serverAuthorizedOutputRootEstablished: false as const,
    preExecutionFreshnessEstablished: false as const,
    persistedScientificPresealOriginEstablished: false as const,
    constraintTargetDerivationServerReplayed: false as const,
    constraintJointUncertaintyCoverageServerVerified: false as const,
    replayAuthority: false as const,
    independentAgreementAuthority: false as const,
    semiclassicalStressNoiseLampAuthority: false as const,
    semiclassicalConstraintAlgebraLampAuthority: false as const,
    physicalViabilityClaimAllowed: false as const,
    propulsionClaimAllowed: false as const,
    transportClaimAllowed: false as const,
  });

type ObservedFile = Readonly<{
  relativePath: string;
  sha256: string;
  sizeBytes: number;
  filesystemIdentity: Nhm2SecureRunOutputFilesystemIdentityV1;
}>;

export type Nhm2SemiclassicalV2ConstraintFilesystemReplayReceiptV1 = Readonly<{
  artifactId: typeof NHM2_SEMICLASSICAL_V2_CONSTRAINT_FILESYSTEM_REPLAYER_ARTIFACT_ID;
  contractVersion: typeof NHM2_SEMICLASSICAL_V2_CONSTRAINT_FILESYSTEM_REPLAYER_CONTRACT_VERSION;
  diagnosticOnly: true;
  authorityDisposition: "blocked";
  observationState: "bounded_current_read_stable_identity_only";
  manifestObservation: Readonly<{
    rootRealPath: string;
    file: ObservedFile;
  }>;
  outputObservation: Readonly<{
    rootRealPath: string;
    descriptorPortableRoot: string;
    aggregateSizeBytes: number;
    fileCount: 63;
    files: readonly ObservedFile[];
  }>;
  arithmeticReplay: Nhm2SemiclassicalV2ConstraintOperandReplayReceiptV1;
  blockers: typeof NHM2_SEMICLASSICAL_V2_CONSTRAINT_FILESYSTEM_REPLAYER_BLOCKERS;
  claimBoundary: typeof NHM2_SEMICLASSICAL_V2_CONSTRAINT_FILESYSTEM_REPLAYER_CLAIM_BOUNDARY;
}>;

const fail = (
  code: Nhm2SemiclassicalV2ConstraintFilesystemReplayErrorCode,
  message: string,
  options: {
    cause?: unknown;
    detailCode?: string | null;
    relativePath?: string | null;
  } = {},
): never => {
  throw new Nhm2SemiclassicalV2ConstraintFilesystemReplayError(
    code,
    message,
    options,
  );
};

const dataProperties = (
  value: unknown,
  expectedKeys: ReadonlySet<string>,
): Record<string, unknown> => {
  if (
    value == null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    nodeUtilTypes.isProxy(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    return fail(
      "filesystem_replay_input_invalid",
      "Input must be a plain, non-proxy record.",
    );
  }
  const keys = Reflect.ownKeys(value);
  if (
    keys.some((key) => typeof key === "symbol") ||
    keys.length !== expectedKeys.size ||
    keys.some((key) => !expectedKeys.has(String(key)))
  ) {
    return fail(
      "filesystem_replay_input_invalid",
      "Input keys do not match the exact contract.",
    );
  }
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const snapshot: Record<string, unknown> = {};
  for (const key of keys as string[]) {
    const descriptor = descriptors[key];
    if (
      descriptor == null ||
      !("value" in descriptor) ||
      descriptor.get != null ||
      descriptor.set != null ||
      descriptor.enumerable !== true
    ) {
      return fail(
        "filesystem_replay_input_invalid",
        "Input accessors and non-data properties are forbidden.",
      );
    }
    snapshot[key] = descriptor.value;
  }
  return snapshot;
};

const optionalFunction = (
  value: unknown,
): (() => void | Promise<void>) | undefined => {
  if (value == null) return undefined;
  if (typeof value !== "function") {
    return fail(
      "filesystem_replay_input_invalid",
      "Test hooks must be functions.",
    );
  }
  return value as () => void | Promise<void>;
};

const snapshotInput = (
  input: unknown,
): Nhm2SemiclassicalV2ConstraintFilesystemReplayInputV1 => {
  const rawKeys = Reflect.ownKeys(
    input != null && typeof input === "object" && !nodeUtilTypes.isProxy(input)
      ? input
      : {},
  );
  const expectedTopKeys = new Set(INPUT_KEYS);
  for (const optional of [
    "afterManifestInitialReadForTesting",
    "afterOutputInitialReadForTesting",
  ]) {
    if (!rawKeys.includes(optional)) expectedTopKeys.delete(optional);
  }
  const raw = dataProperties(input, expectedTopKeys);
  const manifestFile = dataProperties(raw.manifestFile, MANIFEST_FILE_KEYS);
  if (
    raw.contractVersion !==
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_FILESYSTEM_REPLAYER_INPUT_CONTRACT_VERSION ||
    typeof raw.manifestRootDirectory !== "string" ||
    typeof raw.outputRootDirectory !== "string" ||
    typeof manifestFile.relativePath !== "string" ||
    typeof manifestFile.expectedSha256 !== "string" ||
    !SHA256.test(manifestFile.expectedSha256) ||
    !Number.isSafeInteger(manifestFile.expectedSizeBytes) ||
    (manifestFile.expectedSizeBytes as number) <= 0 ||
    (manifestFile.expectedSizeBytes as number) > MANIFEST_MAX_BYTES
  ) {
    return fail(
      "filesystem_replay_input_invalid",
      "Filesystem replay input values are invalid.",
    );
  }
  return Object.freeze({
    contractVersion:
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_FILESYSTEM_REPLAYER_INPUT_CONTRACT_VERSION,
    manifestRootDirectory: raw.manifestRootDirectory,
    manifestFile: Object.freeze({
      relativePath: manifestFile.relativePath,
      expectedSha256: manifestFile.expectedSha256,
      expectedSizeBytes: manifestFile.expectedSizeBytes as number,
    }),
    outputRootDirectory: raw.outputRootDirectory,
    ...(raw.afterManifestInitialReadForTesting == null
      ? {}
      : {
          afterManifestInitialReadForTesting: optionalFunction(
            raw.afterManifestInitialReadForTesting,
          ),
        }),
    ...(raw.afterOutputInitialReadForTesting == null
      ? {}
      : {
          afterOutputInitialReadForTesting: optionalFunction(
            raw.afterOutputInitialReadForTesting,
          ),
        }),
  });
};

const normalizedFilesystemPath = (value: string): string => {
  const normalized = value.replaceAll("\\", "/").replace(/\/+$/, "");
  return process.platform === "win32"
    ? normalized.toLocaleLowerCase("en-US")
    : normalized;
};

const rootsOverlap = (left: string, right: string): boolean => {
  const a = normalizedFilesystemPath(left);
  const b = normalizedFilesystemPath(right);
  return a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`);
};

const assertBoundedJsonGraph = (root: unknown): void => {
  const stack: Array<{ value: unknown; depth: number }> = [
    { value: root, depth: 0 },
  ];
  let nodes = 0;
  while (stack.length > 0) {
    const current = stack.pop()!;
    nodes += 1;
    if (nodes > 8_192 || current.depth > 24) {
      return fail(
        "manifest_decode_failed",
        "Manifest JSON exceeds the bounded graph budget.",
      );
    }
    const value = current.value;
    if (typeof value === "string") {
      if (value.length > 4_096) {
        return fail(
          "manifest_decode_failed",
          "Manifest string exceeds the bounded graph budget.",
        );
      }
      continue;
    }
    if (value == null || typeof value === "boolean") continue;
    if (typeof value === "number") {
      if (!Number.isFinite(value)) {
        return fail(
          "manifest_decode_failed",
          "Manifest contains a non-finite number.",
        );
      }
      continue;
    }
    if (typeof value !== "object") {
      return fail(
        "manifest_decode_failed",
        "Manifest contains a non-JSON value.",
      );
    }
    const entries = Array.isArray(value)
      ? value.map((entry, index) => [String(index), entry] as const)
      : Object.entries(value as Record<string, unknown>);
    if (
      (Array.isArray(value) && value.length > 256) ||
      (!Array.isArray(value) && entries.length > 128)
    ) {
      return fail(
        "manifest_decode_failed",
        "Manifest node exceeds the bounded width budget.",
      );
    }
    for (const [key, entry] of entries) {
      if (FORBIDDEN_GRAPH_KEYS.has(key)) {
        return fail(
          "manifest_decode_failed",
          "Manifest contains a forbidden property name.",
        );
      }
      stack.push({ value: entry, depth: current.depth + 1 });
    }
  }
};

const decodeManifest = (
  bytes: Uint8Array,
): Nhm2SemiclassicalV2ConstraintOperandReplayV1 => {
  let parsed: unknown;
  try {
    if (
      bytes.length >= 3 &&
      bytes[0] === 0xef &&
      bytes[1] === 0xbb &&
      bytes[2] === 0xbf
    ) {
      return fail("manifest_decode_failed", "A UTF-8 BOM is not permitted.");
    }
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    parsed = JSON.parse(text) as unknown;
  } catch (error) {
    if (error instanceof Nhm2SemiclassicalV2ConstraintFilesystemReplayError)
      throw error;
    return fail(
      "manifest_decode_failed",
      "Manifest is not strict UTF-8 JSON.",
      { cause: error },
    );
  }
  assertBoundedJsonGraph(parsed);
  const violations =
    nhm2SemiclassicalV2ConstraintOperandReplayViolations(parsed);
  if (violations.length > 0) {
    return fail(
      "manifest_invalid",
      "Manifest violates the frozen v2 operand contract.",
      {
        detailCode: violations[0],
      },
    );
  }
  return parsed as Nhm2SemiclassicalV2ConstraintOperandReplayV1;
};

const publicFile = (file: {
  relativePath: string;
  sha256: string;
  sizeBytes: bigint;
  filesystemIdentity: Nhm2SecureRunOutputFilesystemIdentityV1;
}): ObservedFile =>
  Object.freeze({
    relativePath: file.relativePath,
    sha256: file.sha256,
    sizeBytes: Number(file.sizeBytes),
    filesystemIdentity: Object.freeze({ ...file.filesystemIdentity }),
  });

/**
 * Securely rereads one caller-bound manifest and its exact 63-file output
 * inventory, then invokes the authority-neutral arithmetic replay. This proves
 * only bounded current byte/identity observations: the roots and manifest
 * binding are caller-selected and no pre-execution absence was observed.
 */
export async function replayNhm2SemiclassicalV2ConstraintFilesystem(
  callerInput: unknown,
): Promise<Nhm2SemiclassicalV2ConstraintFilesystemReplayReceiptV1> {
  const input = snapshotInput(callerInput);
  if (rootsOverlap(input.manifestRootDirectory, input.outputRootDirectory)) {
    return fail(
      "root_topology_invalid",
      "Manifest and output roots must be disjoint and non-nested.",
    );
  }

  let manifestRead: Awaited<ReturnType<typeof readNhm2SecureRunOutputs>>;
  try {
    manifestRead = await readNhm2SecureRunOutputs({
      runDirectory: input.manifestRootDirectory,
      files: [
        {
          relativePath: input.manifestFile.relativePath,
          expectedSha256: input.manifestFile.expectedSha256,
          expectedSizeBytes: BigInt(input.manifestFile.expectedSizeBytes),
          decode: { kind: "bytes" },
        },
      ],
      maxFileBytes: BigInt(input.manifestFile.expectedSizeBytes),
      maxAggregateBytes: BigInt(input.manifestFile.expectedSizeBytes),
      ...(input.afterManifestInitialReadForTesting == null
        ? {}
        : {
            afterInitialReadForTesting:
              input.afterManifestInitialReadForTesting,
          }),
    });
  } catch (error) {
    return fail(
      "manifest_secure_read_failed",
      "Manifest failed its bounded stable-identity reread.",
      {
        cause: error,
        detailCode:
          error instanceof Nhm2SecureRunOutputReaderError ? error.code : null,
        relativePath:
          error instanceof Nhm2SecureRunOutputReaderError
            ? error.relativePath
            : null,
      },
    );
  }
  const manifestFile = manifestRead.files[0];
  if (manifestFile == null) {
    return fail(
      "manifest_secure_read_failed",
      "Manifest read returned no file.",
    );
  }
  const manifest = decodeManifest(manifestFile.bytes);
  const descriptors =
    collectNhm2SemiclassicalV2ConstraintOperandArrays(manifest);
  const portableRoot = manifest.execution.outputDirectory;
  const portablePrefix = `${portableRoot}/`;
  const requests = descriptors.map((descriptor) => {
    if (!descriptor.path.startsWith(portablePrefix)) {
      return fail(
        "output_descriptor_path_invalid",
        "Operand descriptor is not rooted at the exact canonical portable output path.",
        { relativePath: descriptor.path },
      );
    }
    const relativePath = descriptor.path.slice(portablePrefix.length);
    if (
      relativePath.length === 0 ||
      relativePath.startsWith("/") ||
      relativePath.includes("\\")
    ) {
      return fail(
        "output_descriptor_path_invalid",
        "Operand descriptor suffix is not portable.",
        {
          relativePath: descriptor.path,
        },
      );
    }
    return {
      relativePath,
      expectedSha256: descriptor.sha256,
      expectedSizeBytes: BigInt(descriptor.sizeBytes),
      decode: { kind: "float64_le" as const, shape: [64, 4] as const },
    };
  });

  let outputRead: Awaited<ReturnType<typeof readNhm2SecureRunOutputs>>;
  try {
    outputRead = await readNhm2SecureRunOutputs({
      runDirectory: input.outputRootDirectory,
      files: requests,
      maxFileBytes: BigInt(
        NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ARRAY_SIZE_BYTES,
      ),
      maxAggregateBytes: BigInt(OUTPUT_AGGREGATE_BYTES),
      ...(input.afterOutputInitialReadForTesting == null
        ? {}
        : {
            afterInitialReadForTesting: input.afterOutputInitialReadForTesting,
          }),
    });
  } catch (error) {
    return fail(
      "output_secure_read_failed",
      "Operand inventory failed its bounded stable-identity reread.",
      {
        cause: error,
        detailCode:
          error instanceof Nhm2SecureRunOutputReaderError ? error.code : null,
        relativePath:
          error instanceof Nhm2SecureRunOutputReaderError
            ? error.relativePath
            : null,
      },
    );
  }
  if (
    rootsOverlap(
      manifestRead.runDirectoryRealPath,
      outputRead.runDirectoryRealPath,
    )
  ) {
    return fail(
      "root_topology_invalid",
      "Observed manifest and output real roots overlap.",
    );
  }
  if (
    outputRead.files.length !==
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ARRAY_COUNT ||
    outputRead.aggregateSizeBytes !== BigInt(OUTPUT_AGGREGATE_BYTES)
  ) {
    return fail(
      "output_binding_mismatch",
      "Secure output inventory cardinality or size is invalid.",
    );
  }

  const filesByRelativePath = new Map(
    outputRead.files.map((file) => [file.relativePath, file] as const),
  );
  const observations: Nhm2SemiclassicalV2ConstraintOperandFileObservationV1[] =
    [];
  for (let index = 0; index < descriptors.length; index += 1) {
    const descriptor = descriptors[index];
    const expectedRelativePath = descriptor.path.slice(portablePrefix.length);
    const file = filesByRelativePath.get(expectedRelativePath);
    if (
      file == null ||
      file.relativePath !== expectedRelativePath ||
      file.sha256 !== descriptor.sha256 ||
      file.sizeBytes !== BigInt(descriptor.sizeBytes) ||
      file.decoded.kind !== "float64_le" ||
      file.decoded.finiteValuesVerified !== true
    ) {
      return fail(
        "output_binding_mismatch",
        "Securely read file does not match its exact descriptor.",
        {
          relativePath: descriptor.path,
        },
      );
    }
    const bytes = new Uint8Array(file.bytes.byteLength);
    bytes.set(file.bytes);
    observations.push({
      observationMode: "caller_supplied_secure_file_reader",
      operandRole: descriptor.operandRole,
      path: descriptor.path,
      sha256: descriptor.sha256,
      sizeBytes: descriptor.sizeBytes,
      freshness: descriptor.freshness,
      observedAt: descriptor.observedAt,
      scientificPresealSealKey: descriptor.scientificPresealSealKey,
      bytes,
    });
  }

  const arithmeticReplay = replayNhm2SemiclassicalV2ConstraintOperands({
    contractVersion:
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAYER_INPUT_CONTRACT_VERSION,
    manifest,
    fileObservations: observations,
  });
  return Object.freeze({
    artifactId:
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_FILESYSTEM_REPLAYER_ARTIFACT_ID,
    contractVersion:
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_FILESYSTEM_REPLAYER_CONTRACT_VERSION,
    diagnosticOnly: true,
    authorityDisposition: "blocked",
    observationState: "bounded_current_read_stable_identity_only",
    manifestObservation: Object.freeze({
      rootRealPath: manifestRead.runDirectoryRealPath,
      file: publicFile(manifestFile),
    }),
    outputObservation: Object.freeze({
      rootRealPath: outputRead.runDirectoryRealPath,
      descriptorPortableRoot: portableRoot,
      aggregateSizeBytes: OUTPUT_AGGREGATE_BYTES,
      fileCount: NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ARRAY_COUNT,
      files: Object.freeze(outputRead.files.map(publicFile)),
    }),
    arithmeticReplay,
    blockers: NHM2_SEMICLASSICAL_V2_CONSTRAINT_FILESYSTEM_REPLAYER_BLOCKERS,
    claimBoundary:
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_FILESYSTEM_REPLAYER_CLAIM_BOUNDARY,
  });
}
