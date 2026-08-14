import { createHash } from "node:crypto";
import type { BigIntStats } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";

import { NHM2_SEMICLASSICAL_V2_RAW_REPLAY_SCIENTIFIC_INPUT_IDS } from "../../../shared/contracts/nhm2-semiclassical-v2-raw-replay-manifest.v1";
import {
  nhm2SemiclassicalV2ScientificPresealViolations,
  type Nhm2SemiclassicalV2ScientificPresealV1,
} from "../../../shared/contracts/nhm2-semiclassical-v2-scientific-preseal.v1";
import {
  NHM2_SECURE_RUN_OUTPUT_READER_LIMITS,
  NHM2_SECURE_RUN_OUTPUT_READER_VERSION,
  Nhm2SecureRunOutputReaderError,
  readNhm2SecureRunOutputs,
  type Nhm2SecureRunOutputFilesystemIdentityV1,
  type Nhm2SecureRunOutputReaderTestHookContext,
} from "./nhm2-secure-run-output-reader";

export const NHM2_SEMICLASSICAL_V2_SCIENTIFIC_ROOT_OBSERVER_CONTRACT_VERSION =
  "nhm2_semiclassical_v2_scientific_root_observer/v1" as const;
export const NHM2_SEMICLASSICAL_V2_SCIENTIFIC_ROOT_OBSERVATION_CONTENT_SHA256_DOMAIN =
  "nhm2-semiclassical-v2-scientific-root-observation/v1\n" as const;
export const NHM2_SEMICLASSICAL_V2_SCIENTIFIC_ROOT_MOUNTINFO_MAX_BYTES =
  4 * 1024 * 1024;

export const NHM2_SEMICLASSICAL_V2_SCIENTIFIC_ROOT_OBSERVATION_BLOCKERS =
  Object.freeze([
    "scientific_root_current_namespace_mount_facts_unsupported",
    "scientific_root_current_namespace_mount_not_read_only",
    "scientific_root_lane_mount_identity_not_observed",
  ] as const);

export type Nhm2SemiclassicalV2ScientificRootObservationBlocker =
  (typeof NHM2_SEMICLASSICAL_V2_SCIENTIFIC_ROOT_OBSERVATION_BLOCKERS)[number];

export type Nhm2SemiclassicalV2ScientificRootObserverErrorCode =
  | "scientific_root_observer_input_invalid"
  | "scientific_root_preseal_invalid"
  | "scientific_root_path_invalid"
  | "scientific_root_identity_unreadable"
  | "scientific_root_alias_or_non_directory"
  | "scientific_root_expected_directory_invalid"
  | "scientific_root_secure_inventory_read_failed"
  | "scientific_root_inventory_binding_mismatch"
  | "scientific_root_identity_changed"
  | "scientific_root_mount_facts_changed"
  | "scientific_root_test_hook_not_allowed";

export class Nhm2SemiclassicalV2ScientificRootObserverError extends Error {
  readonly code: Nhm2SemiclassicalV2ScientificRootObserverErrorCode;
  readonly detailCode: string | null;
  readonly relativePath: string | null;

  constructor(
    code: Nhm2SemiclassicalV2ScientificRootObserverErrorCode,
    message: string,
    options: Readonly<{
      cause?: unknown;
      detailCode?: string | null;
      relativePath?: string | null;
    }> = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "Nhm2SemiclassicalV2ScientificRootObserverError";
    this.code = code;
    this.detailCode = options.detailCode ?? null;
    this.relativePath = options.relativePath ?? null;
  }
}

export type Nhm2SemiclassicalV2CurrentNamespaceMountObservationV1 =
  | Readonly<{
      support: "unsupported";
      namespace: "server_current_process";
      platform: string;
      reason: string;
    }>
  | Readonly<{
      support: "observed";
      namespace: "server_current_process";
      platform: string;
      mountId: string;
      parentMountId: string;
      majorMinor: string;
      mountPoint: string;
      mountRoot: string;
      fileSystemType: string;
      mountOptions: readonly string[];
      superOptions: readonly string[];
      readOnly: boolean;
    }>;

export const NHM2_SEMICLASSICAL_V2_SCIENTIFIC_ROOT_OBSERVER_CLAIM_LOCKS =
  Object.freeze({
    contentHashAuthenticatesServerOrigin: false as const,
    contentHashGrantsServerAuthority: false as const,
    laneScientificRootReadOnlyMountVerified: false as const,
    osIsolationEstablished: false as const,
    launchSealAuthority: false as const,
    pairedExecutionAuthority: false as const,
    independentAgreementEstablished: false as const,
    semiclassicalStressNoiseLamp: false as const,
    constraintClosureLamp: false as const,
    theoryGraphPromotion: false as const,
    theoryClosure: false as const,
    experimentReadyTheoryClosure: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
    routeEta: false as const,
    certifiedSpeed: false as const,
    empiricalValidation: false as const,
  });

export type Nhm2SemiclassicalV2ScientificRootDirectoryObservationV1 = Readonly<{
  relativePath: "." | string;
  absolutePath: string;
  realPath: string;
  filesystemIdentity: Nhm2SecureRunOutputFilesystemIdentityV1;
}>;

export type Nhm2SemiclassicalV2ScientificRootFileObservationV1 = Readonly<{
  inputId: string;
  relativePath: string;
  absolutePath: string;
  sha256: string;
  sizeBytes: string;
  filesystemIdentity: Nhm2SecureRunOutputFilesystemIdentityV1;
}>;

export type Nhm2SemiclassicalV2ScientificRootObservationV1 = Readonly<{
  contractVersion: typeof NHM2_SEMICLASSICAL_V2_SCIENTIFIC_ROOT_OBSERVER_CONTRACT_VERSION;
  serverOwned: true;
  diagnosticOnly: true;
  status: "blocked";
  authorityState: "exact_inventory_observed_lane_mount_unverified";
  observedAt: string;
  presealBinding: Readonly<{
    sealKey: string;
    sealedScientificRootDirectory: string;
    sealedInventorySha256: string;
    scientificContentSha256: string;
    stagedInputCount: number;
  }>;
  exactInventory: Readonly<{
    exactSealedInventoryVerified: true;
    allSealedFilesSecurelyReread: true;
    secureReadPassCount: 2;
    secureReaderContractVersion: typeof NHM2_SECURE_RUN_OUTPUT_READER_VERSION;
    aggregateSizeBytes: string;
    root: Nhm2SemiclassicalV2ScientificRootDirectoryObservationV1;
    directories: readonly Nhm2SemiclassicalV2ScientificRootDirectoryObservationV1[];
    files: readonly Nhm2SemiclassicalV2ScientificRootFileObservationV1[];
  }>;
  mountAuthority: Readonly<{
    currentNamespaceBeforeIdentityRecheck: Nhm2SemiclassicalV2CurrentNamespaceMountObservationV1;
    currentNamespaceAfterIdentityRecheck: Nhm2SemiclassicalV2CurrentNamespaceMountObservationV1;
    currentNamespaceMountFactsStable: true;
    currentNamespaceReadOnlyObserved: boolean;
    laneMountNamespaceObserved: false;
    laneScientificRootRealpathIdentityBound: false;
    laneScientificRootReadOnlyMountVerified: false;
    producerMountDeclarationAcceptedAsEvidence: false;
  }>;
  blockers: readonly Nhm2SemiclassicalV2ScientificRootObservationBlocker[];
  claimLocks: typeof NHM2_SEMICLASSICAL_V2_SCIENTIFIC_ROOT_OBSERVER_CLAIM_LOCKS;
  observationHashScope: "content_integrity_only_not_server_origin_or_authority";
  observationHashAlgorithm: "sha256";
  observationCanonicalization: "utf8_lexicographic_object_keys_json_v1";
  observationSha256: string;
}>;

export type Nhm2SemiclassicalV2ScientificRootObservationUnsignedV1 = Omit<
  Nhm2SemiclassicalV2ScientificRootObservationV1,
  "observationSha256"
>;

export type Nhm2SemiclassicalV2ScientificRootObserverInputV1 = Readonly<{
  /** A server-resolved absolute path; no caller-relative resolution occurs. */
  absoluteScientificRootDirectory: string;
  /** The already persisted and server-reverified preseal. */
  preseal: Readonly<Nhm2SemiclassicalV2ScientificPresealV1>;
  /** Test-only race seam forwarded into the two-pass secure reader. */
  afterFileDescriptorOpenBeforeStatForTesting?: (
    context: Nhm2SecureRunOutputReaderTestHookContext,
  ) => void | Promise<void>;
  /** Test-only race seam forwarded into the two-pass secure reader. */
  afterFileOpenForTesting?: (
    context: Nhm2SecureRunOutputReaderTestHookContext,
  ) => void | Promise<void>;
  /** Test-only race seam between the initial read and final secure replay. */
  afterInitialReadForTesting?: () => void | Promise<void>;
  /**
   * Test-only mount seam. Even a read-only result can never establish a lane
   * mount because this observer sees only the server's current namespace.
   */
  currentNamespaceMountObservationForTesting?: () =>
    | Nhm2SemiclassicalV2CurrentNamespaceMountObservationV1
    | Promise<Nhm2SemiclassicalV2CurrentNamespaceMountObservationV1>;
}>;

type PrivateFilesystemIdentity = Readonly<{
  dev: bigint;
  ino: bigint;
  mode: bigint;
  size: bigint;
  mtimeNs: bigint;
  ctimeNs: bigint;
  nlink: bigint;
}>;

type PrivateDirectoryObservation = Readonly<{
  relativePath: "." | string;
  absolutePath: string;
  realPath: string;
  identity: PrivateFilesystemIdentity;
}>;

const INPUT_KEYS = new Set([
  "absoluteScientificRootDirectory",
  "preseal",
  "afterFileDescriptorOpenBeforeStatForTesting",
  "afterFileOpenForTesting",
  "afterInitialReadForTesting",
  "currentNamespaceMountObservationForTesting",
]);
const SHA256 = /^[a-f0-9]{64}$/;

const fail = (
  code: Nhm2SemiclassicalV2ScientificRootObserverErrorCode,
  message: string,
  options: ConstructorParameters<
    typeof Nhm2SemiclassicalV2ScientificRootObserverError
  >[2] = {},
): never => {
  throw new Nhm2SemiclassicalV2ScientificRootObserverError(
    code,
    message,
    options,
  );
};

const utf8Compare = (left: string, right: string): number =>
  Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));

const samePath = (left: string, right: string): boolean =>
  process.platform === "win32"
    ? left.toLocaleLowerCase("en-US") === right.toLocaleLowerCase("en-US")
    : left === right;

const isInside = (root: string, candidate: string): boolean => {
  const relative = path.relative(root, candidate);
  return (
    relative.length === 0 ||
    (relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative))
  );
};

const exactResolvedAbsolutePath = (value: string): boolean =>
  path.isAbsolute(value) &&
  path.normalize(value) === value &&
  path.resolve(value) === value &&
  !samePath(value, path.parse(value).root);

const filesystemIdentity = (stat: BigIntStats): PrivateFilesystemIdentity =>
  Object.freeze({
    dev: stat.dev,
    ino: stat.ino,
    mode: stat.mode,
    size: stat.size,
    mtimeNs: stat.mtimeNs,
    ctimeNs: stat.ctimeNs,
    nlink: stat.nlink,
  });

const samePublicFilesystemIdentity = (
  left: Nhm2SecureRunOutputFilesystemIdentityV1,
  right: Nhm2SecureRunOutputFilesystemIdentityV1,
): boolean =>
  left.dev === right.dev &&
  left.ino === right.ino &&
  left.sizeBytes === right.sizeBytes &&
  left.mtimeNs === right.mtimeNs &&
  left.ctimeNs === right.ctimeNs;

const publicFilesystemIdentity = (
  identity: PrivateFilesystemIdentity,
): Nhm2SecureRunOutputFilesystemIdentityV1 =>
  Object.freeze({
    dev: identity.dev.toString(10),
    ino: identity.ino.toString(10),
    sizeBytes: identity.size.toString(10),
    mtimeNs: identity.mtimeNs.toString(10),
    ctimeNs: identity.ctimeNs.toString(10),
  });

const samePrivateFilesystemIdentity = (
  left: PrivateFilesystemIdentity,
  right: PrivateFilesystemIdentity,
): boolean =>
  left.dev === right.dev &&
  left.ino === right.ino &&
  left.mode === right.mode &&
  left.size === right.size &&
  left.mtimeNs === right.mtimeNs &&
  left.ctimeNs === right.ctimeNs &&
  left.nlink === right.nlink;

const deepFreeze = <T>(value: T): T => {
  if (value == null || typeof value !== "object") {
    return value;
  }
  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreeze(child);
  }
  return Object.isFrozen(value) ? value : Object.freeze(value);
};

const clonePlainData = (
  value: unknown,
  state: { nodes: number; stringBytes: number; active: WeakSet<object> } = {
    nodes: 0,
    stringBytes: 0,
    active: new WeakSet<object>(),
  },
): unknown => {
  state.nodes += 1;
  if (state.nodes > 20_000) {
    return fail(
      "scientific_root_observer_input_invalid",
      "The preseal data tree exceeds the observer node ceiling.",
    );
  }
  if (value == null || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    state.stringBytes += Buffer.byteLength(value, "utf8");
    if (state.stringBytes > 8 * 1024 * 1024) {
      return fail(
        "scientific_root_observer_input_invalid",
        "The input data tree exceeds the observer UTF-8 string budget.",
      );
    }
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return fail(
        "scientific_root_observer_input_invalid",
        "The preseal data tree contains a non-finite number.",
      );
    }
    return value;
  }
  if (typeof value !== "object") {
    return fail(
      "scientific_root_observer_input_invalid",
      "The preseal data tree is not plain JSON data.",
    );
  }
  if (state.active.has(value)) {
    return fail(
      "scientific_root_observer_input_invalid",
      "The preseal data tree is cyclic.",
    );
  }
  state.active.add(value);
  try {
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const ownKeys = Reflect.ownKeys(value);
    if (ownKeys.some((key) => typeof key !== "string")) {
      return fail(
        "scientific_root_observer_input_invalid",
        "The preseal data tree contains symbol keys.",
      );
    }
    if (Array.isArray(value)) {
      if (Object.getPrototypeOf(value) !== Array.prototype) {
        return fail(
          "scientific_root_observer_input_invalid",
          "The preseal contains a non-plain array.",
        );
      }
      const expected = [
        ...Array.from({ length: value.length }, (_, index) => String(index)),
        "length",
      ];
      if (
        ownKeys.length !== expected.length ||
        ownKeys.some((key) => !expected.includes(key as string))
      ) {
        return fail(
          "scientific_root_observer_input_invalid",
          "The preseal contains a sparse or decorated array.",
        );
      }
      return Array.from({ length: value.length }, (_, index) => {
        const descriptor = descriptors[String(index)];
        if (descriptor == null || !("value" in descriptor)) {
          return fail(
            "scientific_root_observer_input_invalid",
            "The preseal contains an array accessor.",
          );
        }
        return clonePlainData(descriptor.value, state);
      });
    }
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      return fail(
        "scientific_root_observer_input_invalid",
        "The preseal contains a non-plain object.",
      );
    }
    const clone: Record<string, unknown> = {};
    for (const key of ownKeys as string[]) {
      const descriptor = descriptors[key];
      if (descriptor == null || !("value" in descriptor)) {
        return fail(
          "scientific_root_observer_input_invalid",
          "The preseal contains an object accessor.",
        );
      }
      Object.defineProperty(clone, key, {
        value: clonePlainData(descriptor.value, state),
        enumerable: true,
        configurable: true,
        writable: true,
      });
    }
    return clone;
  } finally {
    state.active.delete(value);
  }
};

const snapshotInput = (
  input: unknown,
): Nhm2SemiclassicalV2ScientificRootObserverInputV1 => {
  if (
    input == null ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.getPrototypeOf(input) !== Object.prototype
  ) {
    return fail(
      "scientific_root_observer_input_invalid",
      "Scientific-root observer input must be a plain object.",
    );
  }
  const keys = Reflect.ownKeys(input);
  if (
    keys.some((key) => typeof key !== "string" || !INPUT_KEYS.has(key)) ||
    !keys.includes("absoluteScientificRootDirectory") ||
    !keys.includes("preseal")
  ) {
    return fail(
      "scientific_root_observer_input_invalid",
      "Scientific-root observer keys do not match the exact contract.",
    );
  }
  const descriptors = Object.getOwnPropertyDescriptors(input);
  for (const key of keys as string[]) {
    if (descriptors[key] == null || !("value" in descriptors[key])) {
      return fail(
        "scientific_root_observer_input_invalid",
        "Scientific-root observer input accessors are forbidden.",
      );
    }
  }
  const root = descriptors.absoluteScientificRootDirectory.value;
  if (typeof root !== "string" || !exactResolvedAbsolutePath(root)) {
    return fail(
      "scientific_root_path_invalid",
      "The scientific root must be a normalized, resolved, non-root absolute path.",
    );
  }
  const functionKeys = [
    "afterFileDescriptorOpenBeforeStatForTesting",
    "afterFileOpenForTesting",
    "afterInitialReadForTesting",
    "currentNamespaceMountObservationForTesting",
  ] as const;
  for (const key of functionKeys) {
    const descriptor = descriptors[key];
    if (descriptor != null && typeof descriptor.value !== "function") {
      return fail(
        "scientific_root_observer_input_invalid",
        `${key} must be a function.`,
      );
    }
  }
  if (
    functionKeys.some((key) => descriptors[key] != null) &&
    (process.env.NODE_ENV !== "test" || process.env.VITEST !== "true")
  ) {
    return fail(
      "scientific_root_test_hook_not_allowed",
      "Scientific-root observer test hooks are disabled outside Vitest.",
    );
  }
  const preseal = clonePlainData(
    descriptors.preseal.value,
  ) as Nhm2SemiclassicalV2ScientificPresealV1;
  return Object.freeze({
    absoluteScientificRootDirectory: root,
    preseal,
    ...(descriptors.afterFileDescriptorOpenBeforeStatForTesting == null
      ? {}
      : {
          afterFileDescriptorOpenBeforeStatForTesting:
            descriptors.afterFileDescriptorOpenBeforeStatForTesting.value,
        }),
    ...(descriptors.afterFileOpenForTesting == null
      ? {}
      : { afterFileOpenForTesting: descriptors.afterFileOpenForTesting.value }),
    ...(descriptors.afterInitialReadForTesting == null
      ? {}
      : {
          afterInitialReadForTesting:
            descriptors.afterInitialReadForTesting.value,
        }),
    ...(descriptors.currentNamespaceMountObservationForTesting == null
      ? {}
      : {
          currentNamespaceMountObservationForTesting:
            descriptors.currentNamespaceMountObservationForTesting.value,
        }),
  });
};

const expectedDirectoryPaths = (
  preseal: Nhm2SemiclassicalV2ScientificPresealV1,
): string[] => {
  const directories = new Set<string>();
  for (const entry of preseal.stagedInputs) {
    const segments = entry.relativePath.split("/");
    for (let index = 1; index < segments.length; index += 1) {
      directories.add(segments.slice(0, index).join("/"));
    }
  }
  return [...directories].sort(utf8Compare);
};

const observeDirectory = async (input: {
  root: string;
  rootRealPath: string | null;
  relativePath: "." | string;
}): Promise<PrivateDirectoryObservation> => {
  const absolutePath =
    input.relativePath === "."
      ? input.root
      : path.resolve(input.root, ...input.relativePath.split("/"));
  if (!isInside(input.root, absolutePath)) {
    return fail(
      "scientific_root_expected_directory_invalid",
      "An expected scientific directory escaped the scientific root.",
      { relativePath: input.relativePath },
    );
  }
  let stat: BigIntStats;
  let realPath: string;
  try {
    stat = await fs.lstat(absolutePath, { bigint: true });
    realPath = await fs.realpath(absolutePath);
  } catch (error) {
    return fail(
      "scientific_root_identity_unreadable",
      "A scientific-root directory identity is unreadable.",
      {
        cause: error,
        detailCode: (error as NodeJS.ErrnoException).code ?? null,
        relativePath: input.relativePath,
      },
    );
  }
  const expectedRealPath =
    input.relativePath === "." || input.rootRealPath == null
      ? absolutePath
      : path.resolve(input.rootRealPath, ...input.relativePath.split("/"));
  if (
    stat.isSymbolicLink() ||
    !stat.isDirectory() ||
    !samePath(absolutePath, realPath) ||
    !samePath(realPath, expectedRealPath) ||
    (input.rootRealPath != null && !isInside(input.rootRealPath, realPath))
  ) {
    return fail(
      input.relativePath === "."
        ? "scientific_root_alias_or_non_directory"
        : "scientific_root_expected_directory_invalid",
      "A scientific-root directory is an alias, reparse point, or non-directory.",
      { relativePath: input.relativePath },
    );
  }
  return Object.freeze({
    relativePath: input.relativePath,
    absolutePath,
    realPath,
    identity: filesystemIdentity(stat),
  });
};

const observeDirectorySet = async (
  root: string,
  directoryPaths: readonly string[],
): Promise<readonly PrivateDirectoryObservation[]> => {
  const rootObservation = await observeDirectory({
    root,
    rootRealPath: null,
    relativePath: ".",
  });
  const observations = [rootObservation];
  for (const relativePath of directoryPaths) {
    observations.push(
      await observeDirectory({
        root,
        rootRealPath: rootObservation.realPath,
        relativePath,
      }),
    );
  }
  return observations;
};

const sameDirectoryObservation = (
  left: PrivateDirectoryObservation,
  right: PrivateDirectoryObservation,
): boolean =>
  left.relativePath === right.relativePath &&
  samePath(left.absolutePath, right.absolutePath) &&
  samePath(left.realPath, right.realPath) &&
  samePrivateFilesystemIdentity(left.identity, right.identity);

const decodeMountInfoPath = (value: string): string =>
  value.replace(/\\([0-7]{3})/g, (_match, octal: string) =>
    String.fromCharCode(Number.parseInt(octal, 8)),
  );

const posixPathContains = (root: string, candidate: string): boolean =>
  root === "/" || candidate === root || candidate.startsWith(`${root}/`);

const readBoundedLinuxMountInfo = async (): Promise<Buffer> => {
  const maximum = NHM2_SEMICLASSICAL_V2_SCIENTIFIC_ROOT_MOUNTINFO_MAX_BYTES;
  const buffer = Buffer.allocUnsafe(maximum + 1);
  const handle = await fs.open("/proc/self/mountinfo", "r");
  let offset = 0;
  try {
    while (offset < buffer.byteLength) {
      const read = await handle.read({
        buffer,
        offset,
        length: buffer.byteLength - offset,
        position: null,
      });
      if (read.bytesRead === 0) break;
      offset += read.bytesRead;
    }
  } finally {
    await handle.close();
  }
  if (offset > maximum) {
    throw Object.assign(new Error("mountinfo size limit exceeded"), {
      code: "EFBIG",
    });
  }
  return buffer.subarray(0, offset);
};

const observeLinuxCurrentNamespaceMount = async (
  scientificRootRealPath: string,
): Promise<Nhm2SemiclassicalV2CurrentNamespaceMountObservationV1> => {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(
      await readBoundedLinuxMountInfo(),
    );
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code ?? "unknown";
    return Object.freeze({
      support: "unsupported" as const,
      namespace: "server_current_process" as const,
      platform: process.platform,
      reason:
        code === "EFBIG"
          ? "proc_self_mountinfo_size_limit_exceeded"
          : `proc_self_mountinfo_unreadable_or_invalid_utf8:${code}`,
    });
  }
  const candidates: Array<{
    mountId: string;
    parentMountId: string;
    majorMinor: string;
    mountPoint: string;
    mountRoot: string;
    fileSystemType: string;
    mountOptions: string[];
    superOptions: string[];
  }> = [];
  for (const line of text.split("\n")) {
    if (line.length === 0) continue;
    const separator = line.indexOf(" - ");
    if (separator < 0) continue;
    const before = line.slice(0, separator).split(" ");
    const after = line.slice(separator + 3).split(" ");
    if (before.length < 6 || after.length < 3) continue;
    const mountId = before[0];
    const parentMountId = before[1];
    const majorMinor = before[2];
    if (
      !/^[1-9][0-9]*$/.test(mountId) ||
      !/^(?:0|[1-9][0-9]*)$/.test(parentMountId) ||
      !/^(?:0|[1-9][0-9]*):(?:0|[1-9][0-9]*)$/.test(majorMinor)
    ) {
      continue;
    }
    const mountRoot = decodeMountInfoPath(before[3]);
    const mountPoint =
      decodeMountInfoPath(before[4]).replace(/\/+$/, "") || "/";
    if (!posixPathContains(mountPoint, scientificRootRealPath)) continue;
    candidates.push({
      mountId,
      parentMountId,
      majorMinor,
      mountPoint,
      mountRoot,
      fileSystemType: after[0],
      mountOptions: before[5].split(",").filter(Boolean),
      superOptions: after[2].split(",").filter(Boolean),
    });
  }
  candidates.sort(
    (left, right) =>
      right.mountPoint.length - left.mountPoint.length ||
      (BigInt(right.mountId) > BigInt(left.mountId)
        ? 1
        : BigInt(right.mountId) < BigInt(left.mountId)
          ? -1
          : 0),
  );
  const match = candidates[0];
  if (match == null) {
    return Object.freeze({
      support: "unsupported" as const,
      namespace: "server_current_process" as const,
      platform: process.platform,
      reason: "scientific_root_mount_point_not_found",
    });
  }
  return deepFreeze({
    support: "observed" as const,
    namespace: "server_current_process" as const,
    platform: process.platform,
    mountId: match.mountId,
    parentMountId: match.parentMountId,
    majorMinor: match.majorMinor,
    mountPoint: match.mountPoint,
    mountRoot: match.mountRoot,
    fileSystemType: match.fileSystemType,
    mountOptions: [...match.mountOptions],
    superOptions: [...match.superOptions],
    readOnly: match.mountOptions.includes("ro"),
  });
};

const observeCurrentNamespaceMount = async (
  scientificRootRealPath: string,
): Promise<Nhm2SemiclassicalV2CurrentNamespaceMountObservationV1> => {
  if (process.platform === "linux") {
    return observeLinuxCurrentNamespaceMount(scientificRootRealPath);
  }
  return Object.freeze({
    support: "unsupported" as const,
    namespace: "server_current_process" as const,
    platform: process.platform,
    reason: "platform_mount_table_reader_not_implemented",
  });
};

const snapshotMountObservation = (
  value: unknown,
): Nhm2SemiclassicalV2CurrentNamespaceMountObservationV1 => {
  const clone = clonePlainData(value);
  if (clone == null || typeof clone !== "object" || Array.isArray(clone)) {
    return Object.freeze({
      support: "unsupported",
      namespace: "server_current_process",
      platform: "test_hook_invalid",
      reason: "test_mount_observation_shape_invalid",
    });
  }
  const record = clone as Record<string, unknown>;
  if (record.support === "unsupported") {
    if (
      Object.keys(record).sort(utf8Compare).join("\n") !==
        ["namespace", "platform", "reason", "support"]
          .sort(utf8Compare)
          .join("\n") ||
      record.namespace !== "server_current_process" ||
      typeof record.platform !== "string" ||
      record.platform.length === 0 ||
      typeof record.reason !== "string" ||
      record.reason.length === 0
    ) {
      return Object.freeze({
        support: "unsupported",
        namespace: "server_current_process",
        platform: "test_hook_invalid",
        reason: "test_mount_observation_shape_invalid",
      });
    }
    return deepFreeze(
      record,
    ) as Nhm2SemiclassicalV2CurrentNamespaceMountObservationV1;
  }
  const keys = [
    "fileSystemType",
    "majorMinor",
    "mountId",
    "mountOptions",
    "mountPoint",
    "mountRoot",
    "namespace",
    "parentMountId",
    "platform",
    "readOnly",
    "superOptions",
    "support",
  ];
  if (
    record.support !== "observed" ||
    Object.keys(record).sort(utf8Compare).join("\n") !==
      keys.sort(utf8Compare).join("\n") ||
    record.namespace !== "server_current_process" ||
    ![
      record.platform,
      record.mountId,
      record.parentMountId,
      record.majorMinor,
      record.mountPoint,
      record.mountRoot,
      record.fileSystemType,
    ].every((entry) => typeof entry === "string" && entry.length > 0) ||
    !/^[1-9][0-9]*$/.test(String(record.mountId)) ||
    !/^(?:0|[1-9][0-9]*)$/.test(String(record.parentMountId)) ||
    !/^(?:0|[1-9][0-9]*):(?:0|[1-9][0-9]*)$/.test(String(record.majorMinor)) ||
    !Array.isArray(record.mountOptions) ||
    record.mountOptions.length === 0 ||
    !record.mountOptions.every(
      (entry) =>
        typeof entry === "string" && entry.length > 0 && !entry.includes(","),
    ) ||
    new Set(record.mountOptions).size !== record.mountOptions.length ||
    !Array.isArray(record.superOptions) ||
    !record.superOptions.every(
      (entry) =>
        typeof entry === "string" && entry.length > 0 && !entry.includes(","),
    ) ||
    new Set(record.superOptions).size !== record.superOptions.length ||
    typeof record.readOnly !== "boolean" ||
    typeof record.mountPoint !== "string" ||
    !record.mountPoint.startsWith("/") ||
    typeof record.mountRoot !== "string" ||
    !record.mountRoot.startsWith("/") ||
    record.mountOptions.includes("ro") === record.mountOptions.includes("rw") ||
    record.readOnly !== record.mountOptions.includes("ro")
  ) {
    return Object.freeze({
      support: "unsupported",
      namespace: "server_current_process",
      platform: "test_hook_invalid",
      reason: "test_mount_observation_shape_invalid",
    });
  }
  return deepFreeze(
    record,
  ) as Nhm2SemiclassicalV2CurrentNamespaceMountObservationV1;
};

const sampleCurrentNamespaceMount = async (input: {
  scientificRootRealPath: string;
  testObserver?: Nhm2SemiclassicalV2ScientificRootObserverInputV1["currentNamespaceMountObservationForTesting"];
}): Promise<Nhm2SemiclassicalV2CurrentNamespaceMountObservationV1> => {
  if (input.testObserver == null) {
    return observeCurrentNamespaceMount(input.scientificRootRealPath);
  }
  try {
    return snapshotMountObservation(await input.testObserver());
  } catch {
    return Object.freeze({
      support: "unsupported" as const,
      namespace: "server_current_process" as const,
      platform: "test_hook_invalid",
      reason: "test_mount_observation_threw",
    });
  }
};

const canonicalizeJson = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalizeJson);
  if (value != null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => utf8Compare(left, right))
        .map(([key, entry]) => [key, canonicalizeJson(entry)]),
    );
  }
  return value;
};

const OBSERVATION_KEYS = [
  "contractVersion",
  "serverOwned",
  "diagnosticOnly",
  "status",
  "authorityState",
  "observedAt",
  "presealBinding",
  "exactInventory",
  "mountAuthority",
  "blockers",
  "claimLocks",
  "observationHashScope",
  "observationHashAlgorithm",
  "observationCanonicalization",
  "observationSha256",
] as const;
const PRESEAL_BINDING_KEYS = [
  "sealKey",
  "sealedScientificRootDirectory",
  "sealedInventorySha256",
  "scientificContentSha256",
  "stagedInputCount",
] as const;
const EXACT_INVENTORY_KEYS = [
  "exactSealedInventoryVerified",
  "allSealedFilesSecurelyReread",
  "secureReadPassCount",
  "secureReaderContractVersion",
  "aggregateSizeBytes",
  "root",
  "directories",
  "files",
] as const;
const DIRECTORY_OBSERVATION_KEYS = [
  "relativePath",
  "absolutePath",
  "realPath",
  "filesystemIdentity",
] as const;
const FILE_OBSERVATION_KEYS = [
  "inputId",
  "relativePath",
  "absolutePath",
  "sha256",
  "sizeBytes",
  "filesystemIdentity",
] as const;
const PUBLIC_FILESYSTEM_IDENTITY_KEYS = [
  "dev",
  "ino",
  "sizeBytes",
  "mtimeNs",
  "ctimeNs",
] as const;
const MOUNT_AUTHORITY_KEYS = [
  "currentNamespaceBeforeIdentityRecheck",
  "currentNamespaceAfterIdentityRecheck",
  "currentNamespaceMountFactsStable",
  "currentNamespaceReadOnlyObserved",
  "laneMountNamespaceObserved",
  "laneScientificRootRealpathIdentityBound",
  "laneScientificRootReadOnlyMountVerified",
  "producerMountDeclarationAcceptedAsEvidence",
] as const;
const UNSUPPORTED_MOUNT_KEYS = [
  "support",
  "namespace",
  "platform",
  "reason",
] as const;
const OBSERVED_MOUNT_KEYS = [
  "support",
  "namespace",
  "platform",
  "mountId",
  "parentMountId",
  "majorMinor",
  "mountPoint",
  "mountRoot",
  "fileSystemType",
  "mountOptions",
  "superOptions",
  "readOnly",
] as const;
const EXPECTED_SCIENTIFIC_ROOT_INPUT_IDS = Object.freeze([
  ...NHM2_SEMICLASSICAL_V2_RAW_REPLAY_SCIENTIFIC_INPUT_IDS,
]);
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._@-]{0,511}$/;
const CANONICAL_UNSIGNED_DECIMAL = /^(?:0|[1-9][0-9]*)$/;
const CANONICAL_POSITIVE_DECIMAL = /^[1-9][0-9]*$/;
const MAJOR_MINOR = /^(?:0|[1-9][0-9]*):(?:0|[1-9][0-9]*)$/;

const isExactRecord = (
  value: unknown,
  expectedKeys: readonly string[],
): value is Record<string, unknown> => {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  const keys = Reflect.ownKeys(value);
  return (
    keys.length === expectedKeys.length &&
    keys.every((key) => typeof key === "string" && expectedKeys.includes(key))
  );
};

const isBoundedString = (
  value: unknown,
  maximumUtf8Bytes: number,
): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  Buffer.byteLength(value, "utf8") <= maximumUtf8Bytes;

const isExactIsoTimestamp = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
};

const isPortableObservationRelativePath = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  value.length <= 2048 &&
  value.trim() === value &&
  value.normalize("NFC") === value &&
  !value.includes("\\") &&
  !value.includes(":") &&
  !path.posix.isAbsolute(value) &&
  !path.win32.isAbsolute(value) &&
  value
    .split("/")
    .every(
      (segment) =>
        segment.length > 0 &&
        segment !== "." &&
        segment !== ".." &&
        Buffer.byteLength(segment, "utf8") <= 255,
    );

const isExactObservationAbsolutePath = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  value.length <= 4096 &&
  path.isAbsolute(value) &&
  path.normalize(value) === value &&
  path.resolve(value) === value &&
  !samePath(value, path.parse(value).root);

const isCanonicalUnsignedDecimal = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length <= 40 &&
  CANONICAL_UNSIGNED_DECIMAL.test(value);

const isPublicFilesystemIdentity = (
  value: unknown,
): value is Nhm2SecureRunOutputFilesystemIdentityV1 =>
  isExactRecord(value, PUBLIC_FILESYSTEM_IDENTITY_KEYS) &&
  isCanonicalUnsignedDecimal(value.dev) &&
  isCanonicalUnsignedDecimal(value.ino) &&
  isCanonicalUnsignedDecimal(value.sizeBytes) &&
  isCanonicalUnsignedDecimal(value.mtimeNs) &&
  isCanonicalUnsignedDecimal(value.ctimeNs);

const isDirectoryObservation = (
  value: unknown,
  expectedRoot: string | null,
  expectedRelativePath?: string,
): value is Nhm2SemiclassicalV2ScientificRootDirectoryObservationV1 => {
  if (!isExactRecord(value, DIRECTORY_OBSERVATION_KEYS)) return false;
  const relativePath = value.relativePath;
  if (
    (relativePath !== "." &&
      !isPortableObservationRelativePath(relativePath)) ||
    (expectedRelativePath != null && relativePath !== expectedRelativePath) ||
    !isExactObservationAbsolutePath(value.absolutePath) ||
    !isExactObservationAbsolutePath(value.realPath) ||
    !samePath(value.absolutePath, value.realPath) ||
    !isPublicFilesystemIdentity(value.filesystemIdentity)
  ) {
    return false;
  }
  if (relativePath === ".") {
    return expectedRoot == null;
  }
  return (
    expectedRoot != null &&
    samePath(
      value.absolutePath,
      path.resolve(expectedRoot, ...relativePath.split("/")),
    )
  );
};

const isStringTokenArray = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  Object.getPrototypeOf(value) === Array.prototype &&
  value.length > 0 &&
  value.length <= 256 &&
  value.every(
    (entry) =>
      typeof entry === "string" &&
      entry.length > 0 &&
      Buffer.byteLength(entry, "utf8") <= 1024 &&
      !entry.includes(","),
  ) &&
  new Set(value).size === value.length;

const isCurrentNamespaceMountObservation = (
  value: unknown,
): value is Nhm2SemiclassicalV2CurrentNamespaceMountObservationV1 => {
  if (
    !isExactRecord(
      value,
      value != null && (value as any).support === "observed"
        ? OBSERVED_MOUNT_KEYS
        : UNSUPPORTED_MOUNT_KEYS,
    )
  ) {
    return false;
  }
  if (
    value.namespace !== "server_current_process" ||
    !isBoundedString(value.platform, 128)
  ) {
    return false;
  }
  if (value.support === "unsupported") {
    return isBoundedString(value.reason, 2048);
  }
  if (
    value.support !== "observed" ||
    typeof value.mountId !== "string" ||
    !CANONICAL_POSITIVE_DECIMAL.test(value.mountId) ||
    typeof value.parentMountId !== "string" ||
    !CANONICAL_UNSIGNED_DECIMAL.test(value.parentMountId) ||
    typeof value.majorMinor !== "string" ||
    !MAJOR_MINOR.test(value.majorMinor) ||
    !isBoundedString(value.mountPoint, 4096) ||
    !value.mountPoint.startsWith("/") ||
    !isBoundedString(value.mountRoot, 4096) ||
    !value.mountRoot.startsWith("/") ||
    !isBoundedString(value.fileSystemType, 256) ||
    !isStringTokenArray(value.mountOptions) ||
    !isStringTokenArray(value.superOptions) ||
    typeof value.readOnly !== "boolean" ||
    value.mountOptions.includes("ro") === value.mountOptions.includes("rw") ||
    value.readOnly !== value.mountOptions.includes("ro")
  ) {
    return false;
  }
  return true;
};

const isClaimLocksClosed = (value: unknown): boolean => {
  const keys = Object.keys(
    NHM2_SEMICLASSICAL_V2_SCIENTIFIC_ROOT_OBSERVER_CLAIM_LOCKS,
  );
  return (
    isExactRecord(value, keys) && keys.every((key) => value[key] === false)
  );
};

const isExactBlockerSequence = (
  value: unknown,
  mount: Nhm2SemiclassicalV2CurrentNamespaceMountObservationV1,
): value is Nhm2SemiclassicalV2ScientificRootObservationBlocker[] => {
  if (
    !Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Array.prototype
  ) {
    return false;
  }
  const expected: Nhm2SemiclassicalV2ScientificRootObservationBlocker[] = [];
  if (mount.support === "unsupported") {
    expected.push("scientific_root_current_namespace_mount_facts_unsupported");
  } else if (!mount.readOnly) {
    expected.push("scientific_root_current_namespace_mount_not_read_only");
  }
  expected.push("scientific_root_lane_mount_identity_not_observed");
  return isDeepStrictEqual(value, expected);
};

const isExhaustiveScientificRootObservationShape = (
  value: unknown,
): value is Nhm2SemiclassicalV2ScientificRootObservationV1 => {
  if (!isExactRecord(value, OBSERVATION_KEYS)) return false;
  if (
    value.contractVersion !==
      NHM2_SEMICLASSICAL_V2_SCIENTIFIC_ROOT_OBSERVER_CONTRACT_VERSION ||
    value.serverOwned !== true ||
    value.diagnosticOnly !== true ||
    value.status !== "blocked" ||
    value.authorityState !== "exact_inventory_observed_lane_mount_unverified" ||
    !isExactIsoTimestamp(value.observedAt) ||
    value.observationHashScope !==
      "content_integrity_only_not_server_origin_or_authority" ||
    value.observationHashAlgorithm !== "sha256" ||
    value.observationCanonicalization !==
      "utf8_lexicographic_object_keys_json_v1" ||
    typeof value.observationSha256 !== "string" ||
    !SHA256.test(value.observationSha256)
  ) {
    return false;
  }

  const preseal = value.presealBinding;
  if (
    !isExactRecord(preseal, PRESEAL_BINDING_KEYS) ||
    typeof preseal.sealKey !== "string" ||
    !SHA256.test(preseal.sealKey) ||
    !isPortableObservationRelativePath(preseal.sealedScientificRootDirectory) ||
    typeof preseal.sealedInventorySha256 !== "string" ||
    !SHA256.test(preseal.sealedInventorySha256) ||
    typeof preseal.scientificContentSha256 !== "string" ||
    !SHA256.test(preseal.scientificContentSha256) ||
    preseal.stagedInputCount !== EXPECTED_SCIENTIFIC_ROOT_INPUT_IDS.length
  ) {
    return false;
  }

  const inventory = value.exactInventory;
  if (
    !isExactRecord(inventory, EXACT_INVENTORY_KEYS) ||
    inventory.exactSealedInventoryVerified !== true ||
    inventory.allSealedFilesSecurelyReread !== true ||
    inventory.secureReadPassCount !== 2 ||
    inventory.secureReaderContractVersion !==
      NHM2_SECURE_RUN_OUTPUT_READER_VERSION ||
    !isCanonicalUnsignedDecimal(inventory.aggregateSizeBytes) ||
    BigInt(inventory.aggregateSizeBytes) <= 0n ||
    BigInt(inventory.aggregateSizeBytes) >
      NHM2_SECURE_RUN_OUTPUT_READER_LIMITS.hardMaxAggregateBytes ||
    !isDirectoryObservation(inventory.root, null, ".") ||
    !Array.isArray(inventory.directories) ||
    Object.getPrototypeOf(inventory.directories) !== Array.prototype ||
    !Array.isArray(inventory.files) ||
    Object.getPrototypeOf(inventory.files) !== Array.prototype ||
    inventory.files.length !== EXPECTED_SCIENTIFIC_ROOT_INPUT_IDS.length
  ) {
    return false;
  }
  const root = inventory.root;
  const expectedDirectorySet = new Set<string>();
  const filePathSet = new Set<string>();
  const filesystemObjectSet = new Set<string>();
  let aggregateSizeBytes = 0n;
  for (let index = 0; index < inventory.files.length; index += 1) {
    const file = inventory.files[index];
    if (
      !isExactRecord(file, FILE_OBSERVATION_KEYS) ||
      file.inputId !== EXPECTED_SCIENTIFIC_ROOT_INPUT_IDS[index] ||
      typeof file.inputId !== "string" ||
      !IDENTIFIER.test(file.inputId) ||
      !isPortableObservationRelativePath(file.relativePath) ||
      !isExactObservationAbsolutePath(file.absolutePath) ||
      !samePath(
        file.absolutePath,
        path.resolve(root.realPath, ...file.relativePath.split("/")),
      ) ||
      typeof file.sha256 !== "string" ||
      !SHA256.test(file.sha256) ||
      !isCanonicalUnsignedDecimal(file.sizeBytes) ||
      BigInt(file.sizeBytes) <= 0n ||
      BigInt(file.sizeBytes) >
        NHM2_SECURE_RUN_OUTPUT_READER_LIMITS.hardMaxFileBytes ||
      !isPublicFilesystemIdentity(file.filesystemIdentity) ||
      file.filesystemIdentity.sizeBytes !== file.sizeBytes
    ) {
      return false;
    }
    const foldedPath = file.relativePath
      .normalize("NFKC")
      .toLocaleLowerCase("en-US");
    const objectIdentity = `${file.filesystemIdentity.dev}:${file.filesystemIdentity.ino}`;
    if (
      filePathSet.has(foldedPath) ||
      filesystemObjectSet.has(objectIdentity)
    ) {
      return false;
    }
    filePathSet.add(foldedPath);
    filesystemObjectSet.add(objectIdentity);
    aggregateSizeBytes += BigInt(file.sizeBytes);
    const segments = file.relativePath.split("/");
    for (let depth = 1; depth < segments.length; depth += 1) {
      expectedDirectorySet.add(segments.slice(0, depth).join("/"));
    }
  }
  if (aggregateSizeBytes.toString(10) !== inventory.aggregateSizeBytes) {
    return false;
  }
  const expectedDirectories = [...expectedDirectorySet].sort(utf8Compare);
  if (inventory.directories.length !== expectedDirectories.length) return false;
  for (let index = 0; index < inventory.directories.length; index += 1) {
    const directory = inventory.directories[index];
    if (
      !isDirectoryObservation(
        directory,
        root.realPath,
        expectedDirectories[index],
      )
    ) {
      return false;
    }
    const objectIdentity = `${directory.filesystemIdentity.dev}:${directory.filesystemIdentity.ino}`;
    if (filesystemObjectSet.has(objectIdentity)) return false;
    filesystemObjectSet.add(objectIdentity);
  }
  const rootIdentity = `${root.filesystemIdentity.dev}:${root.filesystemIdentity.ino}`;
  if (filesystemObjectSet.has(rootIdentity)) return false;

  const mountAuthority = value.mountAuthority;
  if (
    !isExactRecord(mountAuthority, MOUNT_AUTHORITY_KEYS) ||
    !isCurrentNamespaceMountObservation(
      mountAuthority.currentNamespaceBeforeIdentityRecheck,
    ) ||
    !isCurrentNamespaceMountObservation(
      mountAuthority.currentNamespaceAfterIdentityRecheck,
    ) ||
    !isDeepStrictEqual(
      mountAuthority.currentNamespaceBeforeIdentityRecheck,
      mountAuthority.currentNamespaceAfterIdentityRecheck,
    ) ||
    mountAuthority.currentNamespaceMountFactsStable !== true ||
    mountAuthority.currentNamespaceReadOnlyObserved !==
      (mountAuthority.currentNamespaceBeforeIdentityRecheck.support ===
        "observed" &&
        mountAuthority.currentNamespaceBeforeIdentityRecheck.readOnly) ||
    mountAuthority.laneMountNamespaceObserved !== false ||
    mountAuthority.laneScientificRootRealpathIdentityBound !== false ||
    mountAuthority.laneScientificRootReadOnlyMountVerified !== false ||
    mountAuthority.producerMountDeclarationAcceptedAsEvidence !== false ||
    !isExactBlockerSequence(
      value.blockers,
      mountAuthority.currentNamespaceBeforeIdentityRecheck,
    ) ||
    !isClaimLocksClosed(value.claimLocks)
  ) {
    return false;
  }
  return true;
};

/**
 * Computes only a deterministic content digest. Any caller can construct and
 * self-hash an object; this function never authenticates server origin and
 * never grants filesystem, lane, launch, lamp, theory, or physical authority.
 */
export const computeNhm2SemiclassicalV2ScientificRootObservationContentSha256 =
  (value: Nhm2SemiclassicalV2ScientificRootObservationUnsignedV1): string =>
    createHash("sha256")
      .update(
        NHM2_SEMICLASSICAL_V2_SCIENTIFIC_ROOT_OBSERVATION_CONTENT_SHA256_DOMAIN,
        "utf8",
      )
      .update(JSON.stringify(canonicalizeJson(value)), "utf8")
      .digest("hex");

/**
 * Exhaustively validates the runtime shape and then verifies its self-hash.
 * `true` means content integrity only. It is deliberately not proof of server
 * origin, server observation, authorization, persistence, or lane isolation.
 */
export const hasValidNhm2SemiclassicalV2ScientificRootObservationContentIntegrity =
  (value: unknown): value is Nhm2SemiclassicalV2ScientificRootObservationV1 => {
    try {
      const snapshot = clonePlainData(value);
      if (!isExhaustiveScientificRootObservationShape(snapshot)) return false;
      const { observationSha256, ...unsigned } = snapshot;
      return (
        computeNhm2SemiclassicalV2ScientificRootObservationContentSha256(
          unsigned,
        ) === observationSha256
      );
    } catch {
      return false;
    }
  };

/**
 * Observes the persisted scientific root without starting either lane. The
 * secure reader hashes and rereads every exact preseal entry. This service can
 * establish byte/inventory identity in the server's namespace only; it never
 * establishes the read-only mount presented to an isolated execution lane.
 */
export async function observeNhm2SemiclassicalV2ScientificRoot(
  input: Nhm2SemiclassicalV2ScientificRootObserverInputV1,
): Promise<Nhm2SemiclassicalV2ScientificRootObservationV1> {
  const snapshot = snapshotInput(input);
  const presealViolations = nhm2SemiclassicalV2ScientificPresealViolations(
    snapshot.preseal,
  );
  if (presealViolations.length > 0) {
    return fail(
      "scientific_root_preseal_invalid",
      "The scientific-root observer requires an exact valid preseal.",
      { detailCode: presealViolations[0] },
    );
  }

  const directoryPaths = expectedDirectoryPaths(snapshot.preseal);
  const beforeDirectories = await observeDirectorySet(
    snapshot.absoluteScientificRootDirectory,
    directoryPaths,
  );
  const rootBefore = beforeDirectories[0];
  if (rootBefore == null) {
    return fail(
      "scientific_root_identity_unreadable",
      "The scientific-root identity was not observed.",
    );
  }

  let secureRead: Awaited<ReturnType<typeof readNhm2SecureRunOutputs>>;
  try {
    secureRead = await readNhm2SecureRunOutputs({
      runDirectory: snapshot.absoluteScientificRootDirectory,
      files: snapshot.preseal.stagedInputs.map((entry) => ({
        relativePath: entry.relativePath,
        expectedSha256: entry.sha256,
        expectedSizeBytes: BigInt(entry.sizeBytes),
        decode: { kind: "bytes" as const },
      })),
      maxFileBytes: NHM2_SECURE_RUN_OUTPUT_READER_LIMITS.hardMaxFileBytes,
      maxAggregateBytes:
        NHM2_SECURE_RUN_OUTPUT_READER_LIMITS.hardMaxAggregateBytes,
      ...(snapshot.afterFileDescriptorOpenBeforeStatForTesting == null
        ? {}
        : {
            afterFileDescriptorOpenBeforeStatForTesting:
              snapshot.afterFileDescriptorOpenBeforeStatForTesting,
          }),
      ...(snapshot.afterFileOpenForTesting == null
        ? {}
        : { afterFileOpenForTesting: snapshot.afterFileOpenForTesting }),
      ...(snapshot.afterInitialReadForTesting == null
        ? {}
        : { afterInitialReadForTesting: snapshot.afterInitialReadForTesting }),
    });
  } catch (error) {
    return fail(
      "scientific_root_secure_inventory_read_failed",
      "The exact presealed scientific inventory could not be securely reread.",
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

  if (!samePath(secureRead.runDirectoryRealPath, rootBefore.realPath)) {
    return fail(
      "scientific_root_inventory_binding_mismatch",
      "The secure reader observed a different scientific-root realpath.",
    );
  }
  const byPath = new Map(
    secureRead.files.map((file) => [file.relativePath, file]),
  );
  if (
    secureRead.files.length !== snapshot.preseal.stagedInputs.length ||
    snapshot.preseal.stagedInputs.some((entry) => {
      const file = byPath.get(entry.relativePath);
      return (
        file == null ||
        file.sha256 !== entry.sha256 ||
        file.sizeBytes !== BigInt(entry.sizeBytes)
      );
    })
  ) {
    return fail(
      "scientific_root_inventory_binding_mismatch",
      "The secure read result does not exactly bind every staged preseal entry.",
    );
  }
  const observedFileIdentities = new Set<string>();
  for (const file of secureRead.files) {
    const identityKey = `${file.filesystemIdentity.dev}:${file.filesystemIdentity.ino}`;
    if (observedFileIdentities.has(identityKey)) {
      return fail(
        "scientific_root_inventory_binding_mismatch",
        "Two staged scientific paths resolve to the same filesystem object identity.",
        { relativePath: file.relativePath },
      );
    }
    observedFileIdentities.add(identityKey);
  }

  const currentNamespaceMountBeforeIdentityRecheck =
    await sampleCurrentNamespaceMount({
      scientificRootRealPath: rootBefore.realPath,
      testObserver: snapshot.currentNamespaceMountObservationForTesting,
    });

  const afterDirectories = await observeDirectorySet(
    snapshot.absoluteScientificRootDirectory,
    directoryPaths,
  );
  if (
    beforeDirectories.length !== afterDirectories.length ||
    beforeDirectories.some(
      (entry, index) =>
        afterDirectories[index] == null ||
        !sameDirectoryObservation(entry, afterDirectories[index]),
    )
  ) {
    return fail(
      "scientific_root_identity_changed",
      "The scientific-root or expected directory identities changed during observation.",
    );
  }
  for (const file of secureRead.files) {
    let stat: BigIntStats;
    let realPath: string;
    try {
      stat = await fs.lstat(file.absolutePath, { bigint: true });
      realPath = await fs.realpath(file.absolutePath);
    } catch (error) {
      return fail(
        "scientific_root_identity_changed",
        "A staged scientific file became unreadable after mount observation.",
        {
          cause: error,
          detailCode: (error as NodeJS.ErrnoException).code ?? null,
          relativePath: file.relativePath,
        },
      );
    }
    if (
      stat.isSymbolicLink() ||
      !stat.isFile() ||
      stat.nlink !== 1n ||
      !samePath(file.absolutePath, realPath) ||
      !samePublicFilesystemIdentity(
        publicFilesystemIdentity(filesystemIdentity(stat)),
        file.filesystemIdentity,
      )
    ) {
      return fail(
        "scientific_root_identity_changed",
        "A staged scientific file identity changed after secure replay.",
        { relativePath: file.relativePath },
      );
    }
  }
  const currentNamespaceMountAfterIdentityRecheck =
    await sampleCurrentNamespaceMount({
      scientificRootRealPath: rootBefore.realPath,
      testObserver: snapshot.currentNamespaceMountObservationForTesting,
    });
  if (
    !isDeepStrictEqual(
      currentNamespaceMountBeforeIdentityRecheck,
      currentNamespaceMountAfterIdentityRecheck,
    )
  ) {
    return fail(
      "scientific_root_mount_facts_changed",
      "The matching server-namespace mount identity or read-only facts changed across file and directory identity rechecks.",
    );
  }

  const blockers: Nhm2SemiclassicalV2ScientificRootObservationBlocker[] = [];
  if (currentNamespaceMountBeforeIdentityRecheck.support === "unsupported") {
    blockers.push("scientific_root_current_namespace_mount_facts_unsupported");
  } else if (!currentNamespaceMountBeforeIdentityRecheck.readOnly) {
    blockers.push("scientific_root_current_namespace_mount_not_read_only");
  }
  blockers.push("scientific_root_lane_mount_identity_not_observed");

  const root = Object.freeze({
    relativePath: "." as const,
    absolutePath: rootBefore.absolutePath,
    realPath: rootBefore.realPath,
    filesystemIdentity: publicFilesystemIdentity(rootBefore.identity),
  });
  const directories = Object.freeze(
    beforeDirectories.slice(1).map((entry) =>
      Object.freeze({
        relativePath: entry.relativePath,
        absolutePath: entry.absolutePath,
        realPath: entry.realPath,
        filesystemIdentity: publicFilesystemIdentity(entry.identity),
      }),
    ),
  );
  const files = Object.freeze(
    snapshot.preseal.stagedInputs.map((entry) => {
      const file = byPath.get(entry.relativePath)!;
      return Object.freeze({
        inputId: entry.inputId,
        relativePath: entry.relativePath,
        absolutePath: file.absolutePath,
        sha256: file.sha256,
        sizeBytes: file.sizeBytes.toString(10),
        filesystemIdentity: Object.freeze({ ...file.filesystemIdentity }),
      });
    }),
  );
  const unsigned: Nhm2SemiclassicalV2ScientificRootObservationUnsignedV1 =
    deepFreeze({
      contractVersion:
        NHM2_SEMICLASSICAL_V2_SCIENTIFIC_ROOT_OBSERVER_CONTRACT_VERSION,
      serverOwned: true as const,
      diagnosticOnly: true as const,
      status: "blocked" as const,
      authorityState: "exact_inventory_observed_lane_mount_unverified" as const,
      observedAt: new Date().toISOString(),
      presealBinding: {
        sealKey: snapshot.preseal.sealKey,
        sealedScientificRootDirectory:
          snapshot.preseal.sealedScientificRootDirectory,
        sealedInventorySha256: snapshot.preseal.sealedInventorySha256,
        scientificContentSha256: snapshot.preseal.scientificContentSha256,
        stagedInputCount: snapshot.preseal.stagedInputs.length,
      },
      exactInventory: {
        exactSealedInventoryVerified: true as const,
        allSealedFilesSecurelyReread: true as const,
        secureReadPassCount: 2 as const,
        secureReaderContractVersion: NHM2_SECURE_RUN_OUTPUT_READER_VERSION,
        aggregateSizeBytes: secureRead.aggregateSizeBytes.toString(10),
        root,
        directories,
        files,
      },
      mountAuthority: {
        currentNamespaceBeforeIdentityRecheck:
          currentNamespaceMountBeforeIdentityRecheck,
        currentNamespaceAfterIdentityRecheck:
          currentNamespaceMountAfterIdentityRecheck,
        currentNamespaceMountFactsStable: true as const,
        currentNamespaceReadOnlyObserved:
          currentNamespaceMountBeforeIdentityRecheck.support === "observed" &&
          currentNamespaceMountBeforeIdentityRecheck.readOnly,
        laneMountNamespaceObserved: false as const,
        laneScientificRootRealpathIdentityBound: false as const,
        laneScientificRootReadOnlyMountVerified: false as const,
        producerMountDeclarationAcceptedAsEvidence: false as const,
      },
      blockers: Object.freeze(blockers),
      claimLocks: {
        ...NHM2_SEMICLASSICAL_V2_SCIENTIFIC_ROOT_OBSERVER_CLAIM_LOCKS,
      },
      observationHashScope:
        "content_integrity_only_not_server_origin_or_authority" as const,
      observationHashAlgorithm: "sha256" as const,
      observationCanonicalization:
        "utf8_lexicographic_object_keys_json_v1" as const,
    });
  return deepFreeze({
    ...unsigned,
    observationSha256:
      computeNhm2SemiclassicalV2ScientificRootObservationContentSha256(
        unsigned,
      ),
  });
}
