import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";

import { build as buildEsbuild, version as esbuildVersion } from "esbuild";

import {
  NHM2_FORMAL_PRODUCER_BUNDLE_ARTIFACT_ID,
  NHM2_FORMAL_PRODUCER_BUNDLE_BUILD_ARTIFACT_ID,
  NHM2_FORMAL_PRODUCER_BUNDLE_BUILD_CONTRACT_VERSION,
  NHM2_FORMAL_PRODUCER_BUNDLE_BUILD_OPTIONS,
  NHM2_FORMAL_PRODUCER_BUNDLE_SCHEMA_VERSION,
  computeNhm2FormalProducerBundleSourceSnapshotSha256,
  isNhm2FormalProducerBundleBuildMetadata,
  sha256Nhm2FormalProducerBundleBuildValue,
  type Nhm2FormalProducerBundleBuildMetadataV1,
  type Nhm2FormalProducerBundleRefV1,
} from "../../../shared/contracts/nhm2-formal-producer-bundle.v1";

export type Nhm2FormalProducerBundleAdmissionResourceLimitsV1 = {
  maxBuildMetadataBytes: number;
  maxBundleBytes: number;
  maxSourceFileBytes: number;
  maxSourceFileCount: number;
  maxAggregateSourceBytes: number;
};

export const NHM2_FORMAL_PRODUCER_BUNDLE_ADMISSION_DEFAULT_LIMITS = {
  maxBuildMetadataBytes: 16 * 1024 * 1024,
  maxBundleBytes: 128 * 1024 * 1024,
  maxSourceFileBytes: 32 * 1024 * 1024,
  maxSourceFileCount: 512,
  maxAggregateSourceBytes: 256 * 1024 * 1024,
} as const satisfies Nhm2FormalProducerBundleAdmissionResourceLimitsV1;

export const NHM2_FORMAL_PRODUCER_BUNDLE_ADMISSION_HARD_LIMITS = {
  maxBuildMetadataBytes: 64 * 1024 * 1024,
  maxBundleBytes: 512 * 1024 * 1024,
  maxSourceFileBytes: 128 * 1024 * 1024,
  maxSourceFileCount: 4_096,
  maxAggregateSourceBytes: 1024 * 1024 * 1024,
} as const satisfies Nhm2FormalProducerBundleAdmissionResourceLimitsV1;

export type Nhm2FormalProducerBundlePinnedFileV1 = {
  path: string;
  absolutePath: string;
  sha256: string;
  sizeBytes: number;
};

export type Nhm2FormalProducerBundleAdmissionV1 = {
  bundle: Nhm2FormalProducerBundlePinnedFileV1;
  buildMetadata: {
    path: string;
    sha256: string;
    sizeBytes: number;
    value: Nhm2FormalProducerBundleBuildMetadataV1;
  };
  sourceFiles: Nhm2FormalProducerBundlePinnedFileV1[];
  hostNodeRuntime: {
    executablePath: string;
    sha256: string;
    sizeBytes: number;
    nodeVersion: string;
    platform: NodeJS.Platform;
    arch: string;
    hostSpecificDiagnosticRuntimeClosure: true;
    operatingSystemHermeticityAsserted: false;
    nodeRuntimeReproducibilityAsserted: false;
  };
  claimBoundary: {
    standaloneFormalProducerReproduced: true;
    formalLogicReplayEstablished: false;
    numericalPhysicsValidated: false;
    theoryClosureEstablished: false;
    empiricalValidationEstablished: false;
    physicalViabilityEstablished: false;
    transportEstablished: false;
    propulsionEstablished: false;
    routeEtaEstablished: false;
    speedAuthorityEstablished: false;
  };
};

export type VerifyNhm2FormalProducerBundleAdmissionInput = {
  projectRoot?: string;
  frozenAt: string;
  candidateDescriptor: unknown;
  solverDescriptor: unknown;
  environmentDescriptor: unknown;
  resourceLimits?: Partial<Nhm2FormalProducerBundleAdmissionResourceLimitsV1>;
};

type JsonRecord = Record<string, unknown>;
type HashedRef = {
  artifactId: string;
  path: string;
  schemaVersion: string;
  sha256: string;
};
type FileIdentity = {
  dev: string;
  ino: string;
  mode: number;
  size: number;
  mtimeMs: number;
  ctimeMs: number;
  nlink: number;
};

const SHA256 = /^[a-f0-9]{64}$/;

const sha256 = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");

const isRecord = (value: unknown): value is JsonRecord =>
  value != null && typeof value === "object" && !Array.isArray(value);

const hasOnlyKeys = (value: JsonRecord, keys: readonly string[]): boolean =>
  Object.keys(value).length === keys.length &&
  Object.keys(value).every((key) => keys.includes(key));

const isPortableRepoPath = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  value.trim() === value &&
  !value.includes("\\") &&
  !value.includes("\0") &&
  !path.posix.isAbsolute(value) &&
  !path.win32.isAbsolute(value) &&
  !/^[a-z][a-z0-9+.-]*:/i.test(value) &&
  value
    .split("/")
    .every((entry) => entry !== "" && entry !== "." && entry !== "..");

const inside = (root: string, candidate: string): boolean => {
  const relative = path.relative(root, candidate);
  return (
    relative.length > 0 &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
};

const identity = (
  stat: Awaited<ReturnType<typeof fs.lstat>>,
): FileIdentity => ({
  dev: String(stat.dev),
  ino: String(stat.ino),
  mode: Number(stat.mode),
  size: Number(stat.size),
  mtimeMs: Number(stat.mtimeMs),
  ctimeMs: Number(stat.ctimeMs),
  nlink: Number(stat.nlink),
});

const limitsFor = (
  override?: Partial<Nhm2FormalProducerBundleAdmissionResourceLimitsV1>,
): Nhm2FormalProducerBundleAdmissionResourceLimitsV1 => {
  const limits = {
    ...NHM2_FORMAL_PRODUCER_BUNDLE_ADMISSION_DEFAULT_LIMITS,
    ...override,
  };
  for (const key of Object.keys(limits) as Array<keyof typeof limits>) {
    if (
      !Number.isSafeInteger(limits[key]) ||
      limits[key] <= 0 ||
      limits[key] > NHM2_FORMAL_PRODUCER_BUNDLE_ADMISSION_HARD_LIMITS[key]
    ) {
      throw new Error(`${key} is outside the formal bundle hard limit.`);
    }
  }
  return limits;
};

const assertBundleRef = (
  value: unknown,
  label: string,
): Nhm2FormalProducerBundleRefV1 => {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      "artifactId",
      "path",
      "schemaVersion",
      "sha256",
      "sizeBytes",
    ]) ||
    value.artifactId !== NHM2_FORMAL_PRODUCER_BUNDLE_ARTIFACT_ID ||
    !isPortableRepoPath(value.path) ||
    value.schemaVersion !== NHM2_FORMAL_PRODUCER_BUNDLE_SCHEMA_VERSION ||
    typeof value.sha256 !== "string" ||
    !SHA256.test(value.sha256) ||
    !Number.isSafeInteger(value.sizeBytes) ||
    (value.sizeBytes as number) <= 0
  ) {
    throw new Error(`${label} is not an exact formal producer bundle ref.`);
  }
  return value as Nhm2FormalProducerBundleRefV1;
};

const assertBuildRef = (value: unknown, label: string): HashedRef => {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ["artifactId", "path", "schemaVersion", "sha256"]) ||
    value.artifactId !== NHM2_FORMAL_PRODUCER_BUNDLE_BUILD_ARTIFACT_ID ||
    !isPortableRepoPath(value.path) ||
    value.schemaVersion !==
      NHM2_FORMAL_PRODUCER_BUNDLE_BUILD_CONTRACT_VERSION ||
    typeof value.sha256 !== "string" ||
    !SHA256.test(value.sha256)
  ) {
    throw new Error(`${label} is not an exact formal bundle-build ref.`);
  }
  return value as HashedRef;
};

const sameValue = (left: unknown, right: unknown): boolean =>
  sha256Nhm2FormalProducerBundleBuildValue(left) ===
  sha256Nhm2FormalProducerBundleBuildValue(right);

async function readPinnedFile(input: {
  projectRoot: string;
  realProjectRoot: string;
  repoPath: string;
  expectedSha256: string;
  expectedSizeBytes?: number;
  maxBytes: number;
  label: string;
}): Promise<{ bytes: Buffer; ref: Nhm2FormalProducerBundlePinnedFileV1 }> {
  if (
    !isPortableRepoPath(input.repoPath) ||
    !SHA256.test(input.expectedSha256)
  ) {
    throw new Error(`${input.label} has an invalid immutable binding.`);
  }
  const absolutePath = path.resolve(input.projectRoot, input.repoPath);
  if (!inside(input.projectRoot, absolutePath)) {
    throw new Error(`${input.label} escapes the project root.`);
  }
  const beforeStat = await fs.lstat(absolutePath);
  const before = identity(beforeStat);
  if (
    !beforeStat.isFile() ||
    beforeStat.isSymbolicLink() ||
    beforeStat.nlink !== 1 ||
    beforeStat.size > input.maxBytes ||
    (input.expectedSizeBytes != null &&
      beforeStat.size !== input.expectedSizeBytes)
  ) {
    throw new Error(
      `${input.label} is not a bounded regular single-link file.`,
    );
  }
  const realPath = await fs.realpath(absolutePath);
  if (
    !inside(input.realProjectRoot, realPath) ||
    path.resolve(realPath) !== absolutePath
  ) {
    throw new Error(
      `${input.label} resolves through an alias or outside the project.`,
    );
  }
  const bytes = await fs.readFile(absolutePath);
  const afterStat = await fs.lstat(absolutePath);
  if (
    bytes.byteLength > input.maxBytes ||
    !isDeepStrictEqual(before, identity(afterStat)) ||
    sha256(bytes) !== input.expectedSha256 ||
    (input.expectedSizeBytes != null &&
      bytes.byteLength !== input.expectedSizeBytes)
  ) {
    throw new Error(`${input.label} changed or failed its immutable binding.`);
  }
  return {
    bytes,
    ref: {
      path: input.repoPath,
      absolutePath,
      sha256: input.expectedSha256,
      sizeBytes: bytes.byteLength,
    },
  };
}

function exactHostRuntime(value: unknown): JsonRecord {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      "executablePath",
      "sha256",
      "sizeBytes",
      "nodeVersion",
      "platform",
      "arch",
      "hostSpecificDiagnosticRuntimeClosure",
      "operatingSystemHermeticityAsserted",
      "nodeRuntimeReproducibilityAsserted",
    ]) ||
    typeof value.executablePath !== "string" ||
    !path.isAbsolute(value.executablePath) ||
    typeof value.sha256 !== "string" ||
    !SHA256.test(value.sha256) ||
    !Number.isSafeInteger(value.sizeBytes) ||
    (value.sizeBytes as number) <= 0 ||
    typeof value.nodeVersion !== "string" ||
    typeof value.platform !== "string" ||
    typeof value.arch !== "string" ||
    value.hostSpecificDiagnosticRuntimeClosure !== true ||
    value.operatingSystemHermeticityAsserted !== false ||
    value.nodeRuntimeReproducibilityAsserted !== false
  ) {
    throw new Error("Formal environment host Node runtime binding is invalid.");
  }
  return value;
}

export async function verifyNhm2FormalProducerBundleAdmission(
  input: VerifyNhm2FormalProducerBundleAdmissionInput,
): Promise<Nhm2FormalProducerBundleAdmissionV1> {
  const limits = limitsFor(input.resourceLimits);
  const projectRoot = path.resolve(input.projectRoot ?? process.cwd());
  const projectStat = await fs.lstat(projectRoot);
  const realProjectRoot = await fs.realpath(projectRoot);
  if (
    !projectStat.isDirectory() ||
    projectStat.isSymbolicLink() ||
    path.resolve(realProjectRoot) !== projectRoot
  ) {
    throw new Error(
      "Formal bundle project root must be a real regular directory.",
    );
  }
  if (
    !isRecord(input.candidateDescriptor) ||
    !isRecord(input.candidateDescriptor.formalProducerBundle) ||
    !isRecord(input.solverDescriptor) ||
    !isRecord(input.environmentDescriptor)
  ) {
    throw new Error(
      "Formal descriptors do not bind a standalone producer bundle.",
    );
  }
  const candidateBundle = input.candidateDescriptor.formalProducerBundle;
  if (!hasOnlyKeys(candidateBundle, ["bundleRef", "buildMetadataRef"])) {
    throw new Error(
      "Candidate formalProducerBundle binding has extra or missing keys.",
    );
  }
  const candidateBundleRef = assertBundleRef(
    candidateBundle.bundleRef,
    "candidate formal bundle",
  );
  const solverBundleRef = assertBundleRef(
    input.solverDescriptor.bundleRef,
    "formal solver bundle",
  );
  const candidateBuildRef = assertBuildRef(
    candidateBundle.buildMetadataRef,
    "candidate formal bundle build",
  );
  const solverBuildRef = assertBuildRef(
    input.solverDescriptor.bundleBuildMetadataRef,
    "formal solver bundle build",
  );
  if (
    !sameValue(candidateBundleRef, solverBundleRef) ||
    !sameValue(candidateBuildRef, solverBuildRef)
  ) {
    throw new Error(
      "Formal solver bundle refs do not match the candidate binding.",
    );
  }

  const metadataFile = await readPinnedFile({
    projectRoot,
    realProjectRoot,
    repoPath: candidateBuildRef.path,
    expectedSha256: candidateBuildRef.sha256,
    maxBytes: limits.maxBuildMetadataBytes,
    label: "formal bundle build metadata",
  });
  let metadataValue: unknown;
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(
      metadataFile.bytes,
    );
    metadataValue = JSON.parse(text) as unknown;
    if (`${JSON.stringify(metadataValue, null, 2)}\n` !== text) {
      throw new Error("not canonical");
    }
  } catch {
    throw new Error(
      "Formal bundle build metadata is not canonical UTF-8 JSON.",
    );
  }
  if (
    !isNhm2FormalProducerBundleBuildMetadata(metadataValue) ||
    metadataValue.generatedAt !== input.frozenAt ||
    !sameValue(metadataValue.bundleRef, candidateBundleRef) ||
    metadataValue.inputClosure.inputCount > limits.maxSourceFileCount
  ) {
    throw new Error(
      "Formal bundle build metadata failed its frozen exact contract.",
    );
  }
  const metadata = metadataValue;
  if (
    metadata.bundleRef.sizeBytes > limits.maxBundleBytes ||
    metadata.bundler.version !== esbuildVersion
  ) {
    throw new Error(
      "Formal bundle exceeds limits or uses an unapproved esbuild version.",
    );
  }

  const bundleFile = await readPinnedFile({
    projectRoot,
    realProjectRoot,
    repoPath: metadata.bundleRef.path,
    expectedSha256: metadata.bundleRef.sha256,
    expectedSizeBytes: metadata.bundleRef.sizeBytes,
    maxBytes: limits.maxBundleBytes,
    label: "formal standalone producer bundle",
  });
  const sourceFiles: Nhm2FormalProducerBundlePinnedFileV1[] = [];
  let aggregateSourceBytes = 0;
  for (const source of metadata.inputClosure.inputs) {
    if (source.sizeBytes > limits.maxSourceFileBytes) {
      throw new Error(
        `Formal bundled source exceeds its file limit: ${source.path}.`,
      );
    }
    aggregateSourceBytes += source.sizeBytes;
    if (aggregateSourceBytes > limits.maxAggregateSourceBytes) {
      throw new Error(
        "Formal bundled source closure exceeds its aggregate limit.",
      );
    }
    const observed = await readPinnedFile({
      projectRoot,
      realProjectRoot,
      repoPath: source.path,
      expectedSha256: source.sha256,
      expectedSizeBytes: source.sizeBytes,
      maxBytes: limits.maxSourceFileBytes,
      label: `formal bundled source ${source.path}`,
    });
    sourceFiles.push(observed.ref);
  }
  if (
    computeNhm2FormalProducerBundleSourceSnapshotSha256(
      metadata.inputClosure.inputs,
    ) !== metadata.inputClosure.sourceSnapshotSha256
  ) {
    throw new Error("Formal producer source-closure digest mismatch.");
  }

  const replay = await buildEsbuild({
    absWorkingDir: projectRoot,
    entryPoints: [metadata.entryPoint.path],
    outfile: metadata.metafile.outputKey,
    bundle: NHM2_FORMAL_PRODUCER_BUNDLE_BUILD_OPTIONS.bundle,
    write: NHM2_FORMAL_PRODUCER_BUNDLE_BUILD_OPTIONS.write,
    metafile: NHM2_FORMAL_PRODUCER_BUNDLE_BUILD_OPTIONS.metafile,
    platform: NHM2_FORMAL_PRODUCER_BUNDLE_BUILD_OPTIONS.platform,
    format: NHM2_FORMAL_PRODUCER_BUNDLE_BUILD_OPTIONS.format,
    target: [NHM2_FORMAL_PRODUCER_BUNDLE_BUILD_OPTIONS.target],
    packages: NHM2_FORMAL_PRODUCER_BUNDLE_BUILD_OPTIONS.packages,
    sourcemap: NHM2_FORMAL_PRODUCER_BUNDLE_BUILD_OPTIONS.sourcemap,
    legalComments: NHM2_FORMAL_PRODUCER_BUNDLE_BUILD_OPTIONS.legalComments,
    charset: NHM2_FORMAL_PRODUCER_BUNDLE_BUILD_OPTIONS.charset,
    treeShaking: NHM2_FORMAL_PRODUCER_BUNDLE_BUILD_OPTIONS.treeShaking,
    minify: NHM2_FORMAL_PRODUCER_BUNDLE_BUILD_OPTIONS.minify,
    logLevel: "silent",
  });
  const replayOutput = replay.metafile?.outputs[metadata.metafile.outputKey];
  const replayInputPaths = replay.metafile
    ? Object.keys(replay.metafile.inputs).sort()
    : [];
  const expectedInputPaths = metadata.inputClosure.inputs
    .map((entry) => entry.path)
    .sort();
  const replayExternalImports = (replayOutput?.imports ?? [])
    .map((entry) => ({
      path: entry.path,
      kind: entry.kind,
      external: entry.external,
    }))
    .sort((left, right) =>
      `${left.path}\u0000${left.kind}`.localeCompare(
        `${right.path}\u0000${right.kind}`,
      ),
    );
  if (
    replay.warnings.length !== 0 ||
    replay.outputFiles.length !== 1 ||
    replay.metafile == null ||
    Object.keys(replay.metafile.outputs).length !== 1 ||
    replayOutput == null ||
    replayOutput.entryPoint !== metadata.entryPoint.path ||
    !Buffer.from(replay.outputFiles[0].contents).equals(bundleFile.bytes) ||
    JSON.stringify(replayInputPaths) !== JSON.stringify(expectedInputPaths) ||
    replayExternalImports.some(
      (entry) => entry.external !== true || !entry.path.startsWith("node:"),
    ) ||
    JSON.stringify(replayExternalImports) !==
      JSON.stringify(metadata.metafile.externalImports) ||
    sha256Nhm2FormalProducerBundleBuildValue(replay.metafile) !==
      metadata.metafile.sha256 ||
    !sameValue(replay.metafile, metadata.metafile.value)
  ) {
    throw new Error(
      "Formal producer admission replay does not reproduce the immutable bundle and source/dependency closure.",
    );
  }

  const runtime = input.environmentDescriptor.runtime;
  if (
    !isRecord(runtime) ||
    !hasOnlyKeys(runtime, [
      "engine",
      "moduleFormat",
      "standaloneBundle",
      "runtimeNodeModulesRequired",
      "bundledDependencyClosureAttested",
      "hostNodeRuntime",
    ]) ||
    runtime.engine !== "node" ||
    runtime.moduleFormat !== "esm" ||
    runtime.standaloneBundle !== true ||
    runtime.runtimeNodeModulesRequired !== false ||
    runtime.bundledDependencyClosureAttested !== true
  ) {
    throw new Error(
      "Formal environment is not an exact standalone Node closure.",
    );
  }
  const host = exactHostRuntime(runtime.hostNodeRuntime);
  const currentExecutable = await fs.realpath(path.resolve(process.execPath));
  const boundExecutable = await fs.realpath(String(host.executablePath));
  const executableStat = await fs.lstat(boundExecutable);
  const executableBytes = await fs.readFile(boundExecutable);
  if (
    boundExecutable !== host.executablePath ||
    currentExecutable !== boundExecutable ||
    !executableStat.isFile() ||
    executableStat.isSymbolicLink() ||
    executableStat.nlink !== 1 ||
    executableStat.size !== host.sizeBytes ||
    executableBytes.byteLength !== host.sizeBytes ||
    sha256(executableBytes) !== host.sha256 ||
    process.version !== host.nodeVersion ||
    process.platform !== host.platform ||
    process.arch !== host.arch
  ) {
    throw new Error(
      "Formal host Node binding does not match the admitting process.",
    );
  }

  return {
    bundle: bundleFile.ref,
    buildMetadata: {
      path: metadataFile.ref.path,
      sha256: metadataFile.ref.sha256,
      sizeBytes: metadataFile.ref.sizeBytes,
      value: metadata,
    },
    sourceFiles,
    hostNodeRuntime: {
      executablePath: String(host.executablePath),
      sha256: String(host.sha256),
      sizeBytes: Number(host.sizeBytes),
      nodeVersion: String(host.nodeVersion),
      platform: host.platform as NodeJS.Platform,
      arch: String(host.arch),
      hostSpecificDiagnosticRuntimeClosure: true,
      operatingSystemHermeticityAsserted: false,
      nodeRuntimeReproducibilityAsserted: false,
    },
    claimBoundary: {
      standaloneFormalProducerReproduced: true,
      formalLogicReplayEstablished: false,
      numericalPhysicsValidated: false,
      theoryClosureEstablished: false,
      empiricalValidationEstablished: false,
      physicalViabilityEstablished: false,
      transportEstablished: false,
      propulsionEstablished: false,
      routeEtaEstablished: false,
      speedAuthorityEstablished: false,
    },
  };
}
