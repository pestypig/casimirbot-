import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import { build as buildEsbuild, version as esbuildVersion } from "esbuild";

import {
  isNhm2ExperimentReadyTheoryCandidateManifest,
  isNhm2ExperimentReadyTheoryCandidateNumericPolicySetArtifact,
  nhm2ExperimentReadyTheoryCandidateReceiptIdForRequest,
  type Nhm2ExperimentReadyTheoryCandidateExecutionPlanRole,
  type Nhm2ExperimentReadyTheoryCandidateExecutionPlanV1,
  type Nhm2ExperimentReadyTheoryCandidateExpectedEvidenceOutputV1,
  type Nhm2ExperimentReadyTheoryCandidateHashedBindingV1,
  type Nhm2ExperimentReadyTheoryCandidateManifestV1,
} from "../../../shared/contracts/nhm2-experiment-ready-theory-candidate-manifest.v1";
import {
  NHM2_PRIMARY_PRODUCER_BUNDLE_ARTIFACT_ID,
  NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_ARTIFACT_ID,
  NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_CONTRACT_VERSION,
  NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_OPTIONS,
  NHM2_PRIMARY_PRODUCER_BUNDLE_SCHEMA_VERSION,
  computeNhm2PrimaryProducerBundleSourceSnapshotSha256,
  isNhm2PrimaryProducerBundleBuildMetadata,
  sha256Nhm2PrimaryProducerBundleBuildValue,
  type Nhm2PrimaryProducerBundleBuildMetadataV1,
} from "../../../shared/contracts/nhm2-primary-producer-bundle.v1";
import {
  buildNhm2PredictionFalsifierFreeze,
  isNhm2PredictionFalsifierFreeze,
  type BuildNhm2PredictionFalsifierFreezeInput,
  type Nhm2PredictionFalsifierFreezeV1,
} from "../../../shared/contracts/nhm2-prediction-falsifier-freeze.v1";
import { getTheoryRuntimeEntrypoint } from "../../../shared/theory/runtime-entrypoints";

const execFileAsync = promisify(execFile);
const SHA256 = /^[a-f0-9]{64}$/;
const GIT_SHA = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;

export const NHM2_THEORY_CANDIDATE_PLAN_RUNTIME_CONTRACTS = {
  primary_numerical: {
    runtimeId: "nhm2.experiment_ready_theory.primary",
    npmScript: "warp:full-solve:nhm2:theory-candidate:primary",
    packageTarget: "tsx tools/nhm2/run-experiment-ready-theory-primary.ts",
    solverSourcePath: "tools/nhm2/run-experiment-ready-theory-primary.ts",
    dependencyLockPath: "package-lock.json",
    bundleBuildContractVersion:
      NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_CONTRACT_VERSION,
    evidenceRoles: [
      "full_apparatus_source_tensor",
      "semiclassical_state",
      "covariant_conservation",
      "continuous_observer_optimizer",
      "worldline_qei",
      "dynamic_backreaction_stability_causality",
      "finite_temperature_finite_geometry_maxwell_stress",
      "mechanical_support_control_margin",
      "prediction_falsifier_freeze",
    ],
  },
  independent_numerical: {
    runtimeId: "nhm2.experiment_ready_theory.independent",
    npmScript: "warp:full-solve:nhm2:theory-candidate:independent",
    packageTarget: null,
    solverSourcePath: "tools/nhm2/build-regional-full-tensor-residual.ts",
    dependencyLockPath: "package-lock.json",
    evidenceRoles: ["independent_numerical_replication"],
  },
  formal_kernel: {
    runtimeId: "nhm2.experiment_ready_theory.formal",
    npmScript: "warp:full-solve:nhm2:theory-candidate:formal",
    packageTarget: null,
    solverSourcePath: "tools/nhm2/emit-lean-campaign-certificate.ts",
    dependencyLockPath: "package-lock.json",
    evidenceRoles: ["formal_manifest_certificate"],
  },
} as const;

type JsonRecord = Record<string, unknown>;

export type Nhm2TheoryCandidatePredictionFreezeSemanticInputRef = {
  path: string;
  sha256: string;
  semanticSha256: string;
};

export type Nhm2TheoryCandidatePinnedInput = {
  label: string;
  path: string;
  sha256: string;
};

export type Nhm2TheoryCandidatePrimaryBundleAdmission = {
  bundle: {
    path: string;
    absolutePath: string;
    sha256: string;
    sizeBytes: number;
  };
  buildMetadata: {
    path: string;
    sha256: string;
    contractVersion: typeof NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_CONTRACT_VERSION;
    esbuildVersion: string;
    inputCount: number;
    sourceSnapshotSha256: string;
    externalNodeBuiltins: string[];
    bundledSourceClosureComplete: true;
    runtimeNodeModulesRequired: false;
  };
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
};

export type Nhm2TheoryCandidatePlanAdmission = {
  manifest: Nhm2ExperimentReadyTheoryCandidateManifestV1;
  manifestPath: string;
  manifestRawSha256: string;
  plan: Nhm2ExperimentReadyTheoryCandidateExecutionPlanV1;
  evidenceOutputs: Nhm2ExperimentReadyTheoryCandidateExpectedEvidenceOutputV1[];
  outputDirectory: string;
  resolvedEnvironment: Record<string, string>;
  predictionFreeze: Nhm2PredictionFalsifierFreezeV1;
  predictionFreezeSemanticInputRef: Nhm2TheoryCandidatePredictionFreezeSemanticInputRef;
  primaryProducerBundle: Nhm2TheoryCandidatePrimaryBundleAdmission;
  pinnedInputs: Nhm2TheoryCandidatePinnedInput[];
  sourceCommitSha: string;
  sourceTreeClean: boolean;
};

export type AdmitNhm2TheoryCandidatePlanInput = {
  projectRoot?: string;
  candidateManifestPath: string;
  planRole: Nhm2ExperimentReadyTheoryCandidateExecutionPlanRole;
  executionStartsAt?: string;
  requireCleanSourceTree?: boolean;
};

export type Nhm2TheoryCandidatePlanAdmissionDependencies = {
  resolveGitHead?: (projectRoot: string) => Promise<string>;
  resolveSourceTreeClean?: (projectRoot: string) => Promise<boolean>;
};

const isRecord = (value: unknown): value is JsonRecord =>
  value != null && typeof value === "object" && !Array.isArray(value);

const normalizedRepoPath = (value: string): string =>
  value.replace(/\\/g, "/").replace(/^\.\//, "");

const isPortableRepoPath = (value: string): boolean => {
  const normalized = normalizedRepoPath(value);
  return (
    normalized.length > 0 &&
    normalized === value &&
    !path.posix.isAbsolute(normalized) &&
    !path.win32.isAbsolute(normalized) &&
    !normalized.split("/").includes("..")
  );
};

const pathInside = (parent: string, candidate: string): boolean => {
  const relative = path.relative(parent, candidate);
  return (
    relative.length === 0 ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
};

const sha256 = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");

const canonicalIso = (value: string, label: string): string => {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) {
    throw new Error(`${label} must be a canonical ISO-8601 timestamp.`);
  }
  return value;
};

async function defaultResolveGitHead(projectRoot: string): Promise<string> {
  const result = await execFileAsync("git", ["rev-parse", "--verify", "HEAD"], {
    cwd: projectRoot,
    encoding: "utf8",
    windowsHide: true,
  });
  const head = String(result.stdout).trim().toLowerCase();
  if (!GIT_SHA.test(head))
    throw new Error("Git HEAD is unavailable or invalid.");
  return head;
}

async function defaultResolveSourceTreeClean(
  projectRoot: string,
): Promise<boolean> {
  const result = await execFileAsync(
    "git",
    ["status", "--porcelain=v1", "-z", "--untracked-files=all"],
    {
      cwd: projectRoot,
      encoding: "utf8",
      windowsHide: true,
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  return String(result.stdout).length === 0;
}

async function resolvePinnedPath(input: {
  projectRoot: string;
  realProjectRoot: string;
  repoRelativePath: string;
  label: string;
}): Promise<string> {
  if (!isPortableRepoPath(input.repoRelativePath)) {
    throw new Error(
      `${input.label} must be a portable repository-relative path.`,
    );
  }
  const absolutePath = path.resolve(input.projectRoot, input.repoRelativePath);
  if (
    absolutePath === input.projectRoot ||
    !pathInside(input.projectRoot, absolutePath)
  ) {
    throw new Error(`${input.label} resolves outside the project root.`);
  }
  const stat = await fs.lstat(absolutePath);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new Error(
      `${input.label} must resolve to a regular, non-symbolic file.`,
    );
  }
  const realPath = await fs.realpath(absolutePath);
  if (!pathInside(input.realProjectRoot, realPath)) {
    throw new Error(`${input.label} resolves outside the real project root.`);
  }
  return absolutePath;
}

async function readPinnedInput(input: {
  projectRoot: string;
  realProjectRoot: string;
  label: string;
  path: string;
  sha256: string;
}): Promise<{ bytes: Buffer; pin: Nhm2TheoryCandidatePinnedInput }> {
  if (!SHA256.test(input.sha256)) {
    throw new Error(`${input.label} has an invalid SHA-256 binding.`);
  }
  const absolutePath = await resolvePinnedPath({
    projectRoot: input.projectRoot,
    realProjectRoot: input.realProjectRoot,
    repoRelativePath: input.path,
    label: input.label,
  });
  const bytes = await fs.readFile(absolutePath);
  const actualSha256 = sha256(bytes);
  if (actualSha256 !== input.sha256.toLowerCase()) {
    throw new Error(
      `${input.label} SHA-256 mismatch: expected ${input.sha256}, received ${actualSha256}.`,
    );
  }
  return {
    bytes,
    pin: {
      label: input.label,
      path: input.path,
      sha256: actualSha256,
    },
  };
}

function parseJson(bytes: Buffer, label: string): unknown {
  try {
    return JSON.parse(bytes.toString("utf8")) as unknown;
  } catch (error) {
    throw new Error(
      `${label} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

const hasOnlyKeys = (value: JsonRecord, keys: readonly string[]): boolean =>
  Object.keys(value).length === keys.length &&
  Object.keys(value).every((key) => keys.includes(key));

function addPinnedInput(
  pinnedInputs: Nhm2TheoryCandidatePinnedInput[],
  pin: Nhm2TheoryCandidatePinnedInput,
): void {
  const existing = pinnedInputs.find((entry) => entry.path === pin.path);
  if (existing != null && existing.sha256 !== pin.sha256) {
    throw new Error(`Pre-run input pin conflict for ${pin.path}.`);
  }
  if (existing == null) pinnedInputs.push(pin);
}

function assertPrimaryBundleRef(
  value: unknown,
  label: string,
): Nhm2PrimaryProducerBundleBuildMetadataV1["bundleRef"] {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      "artifactId",
      "path",
      "schemaVersion",
      "sha256",
      "sizeBytes",
    ]) ||
    value.artifactId !== NHM2_PRIMARY_PRODUCER_BUNDLE_ARTIFACT_ID ||
    typeof value.path !== "string" ||
    !isPortableRepoPath(value.path) ||
    value.schemaVersion !== NHM2_PRIMARY_PRODUCER_BUNDLE_SCHEMA_VERSION ||
    typeof value.sha256 !== "string" ||
    !SHA256.test(value.sha256) ||
    !Number.isSafeInteger(value.sizeBytes) ||
    (value.sizeBytes as number) <= 0
  ) {
    throw new Error(`${label} is not an exact standalone bundle reference.`);
  }
  return value as Nhm2PrimaryProducerBundleBuildMetadataV1["bundleRef"];
}

type PrimaryBundleBuildMetadataRef = {
  artifactId: typeof NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_ARTIFACT_ID;
  path: string;
  schemaVersion: typeof NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_CONTRACT_VERSION;
  sha256: string;
};

function assertPrimaryBundleBuildMetadataRef(
  value: unknown,
  label: string,
): PrimaryBundleBuildMetadataRef {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ["artifactId", "path", "schemaVersion", "sha256"]) ||
    value.artifactId !== NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_ARTIFACT_ID ||
    typeof value.path !== "string" ||
    !isPortableRepoPath(value.path) ||
    value.schemaVersion !==
      NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_CONTRACT_VERSION ||
    typeof value.sha256 !== "string" ||
    !SHA256.test(value.sha256)
  ) {
    throw new Error(
      `${label} is not an exact bundle-build metadata reference.`,
    );
  }
  return value as PrimaryBundleBuildMetadataRef;
}

function assertSameCanonicalValue(
  left: unknown,
  right: unknown,
  label: string,
): void {
  if (
    sha256Nhm2PrimaryProducerBundleBuildValue(left) !==
    sha256Nhm2PrimaryProducerBundleBuildValue(right)
  ) {
    throw new Error(`${label} does not match its immutable candidate binding.`);
  }
}

async function verifyPrimaryProducerBundleAdmission(input: {
  projectRoot: string;
  realProjectRoot: string;
  manifest: Nhm2ExperimentReadyTheoryCandidateManifestV1;
  candidateDescriptor: unknown;
  solverDescriptor: unknown;
  environmentDescriptor: unknown;
  pinnedInputs: Nhm2TheoryCandidatePinnedInput[];
  preRunJsonSeeds: unknown[];
}): Promise<Nhm2TheoryCandidatePrimaryBundleAdmission> {
  if (
    !isRecord(input.candidateDescriptor) ||
    !isRecord(input.candidateDescriptor.primaryProducerBundle) ||
    !isRecord(input.solverDescriptor) ||
    !isRecord(input.environmentDescriptor)
  ) {
    throw new Error(
      "Primary plan descriptors do not bind the standalone producer bundle.",
    );
  }

  const candidateBundle = input.candidateDescriptor.primaryProducerBundle;
  if (!hasOnlyKeys(candidateBundle, ["bundleRef", "buildMetadataRef"])) {
    throw new Error(
      "Candidate primaryProducerBundle must contain only its immutable bundle and build-metadata references.",
    );
  }
  const candidateBundleRef = assertPrimaryBundleRef(
    candidateBundle.bundleRef,
    "candidate primary bundle reference",
  );
  const solverBundleRef = assertPrimaryBundleRef(
    input.solverDescriptor.bundleRef,
    "primary solver bundle reference",
  );
  const candidateBuildRef = assertPrimaryBundleBuildMetadataRef(
    candidateBundle.buildMetadataRef,
    "candidate primary bundle build reference",
  );
  const solverBuildRef = assertPrimaryBundleBuildMetadataRef(
    input.solverDescriptor.bundleBuildMetadataRef,
    "primary solver bundle build reference",
  );
  assertSameCanonicalValue(
    candidateBundleRef,
    solverBundleRef,
    "Primary solver bundle reference",
  );
  assertSameCanonicalValue(
    candidateBuildRef,
    solverBuildRef,
    "Primary solver bundle-build reference",
  );

  const buildMetadataPinned = await readPinnedInput({
    projectRoot: input.projectRoot,
    realProjectRoot: input.realProjectRoot,
    label: "primary producer bundle build metadata",
    path: candidateBuildRef.path,
    sha256: candidateBuildRef.sha256,
  });
  addPinnedInput(input.pinnedInputs, buildMetadataPinned.pin);
  const buildMetadataJson = parseJson(
    buildMetadataPinned.bytes,
    "primary producer bundle build metadata",
  );
  input.preRunJsonSeeds.push(buildMetadataJson);
  if (
    !isNhm2PrimaryProducerBundleBuildMetadata(buildMetadataJson) ||
    buildMetadataJson.generatedAt !== input.manifest.frozenAt
  ) {
    throw new Error(
      "Primary producer bundle build metadata failed its exact frozen v1 contract.",
    );
  }
  const buildMetadata = buildMetadataJson;
  assertSameCanonicalValue(
    buildMetadata.bundleRef,
    candidateBundleRef,
    "Primary bundle build metadata reference",
  );

  const bundlePinned = await readPinnedInput({
    projectRoot: input.projectRoot,
    realProjectRoot: input.realProjectRoot,
    label: "primary producer standalone bundle",
    path: buildMetadata.bundleRef.path,
    sha256: buildMetadata.bundleRef.sha256,
  });
  addPinnedInput(input.pinnedInputs, bundlePinned.pin);
  if (bundlePinned.bytes.byteLength !== buildMetadata.bundleRef.sizeBytes) {
    throw new Error("Primary producer standalone bundle size mismatch.");
  }

  for (const source of buildMetadata.inputClosure.inputs) {
    const pinned = await readPinnedInput({
      projectRoot: input.projectRoot,
      realProjectRoot: input.realProjectRoot,
      label: `primary producer bundled source ${source.path}`,
      path: source.path,
      sha256: source.sha256,
    });
    if (pinned.bytes.byteLength !== source.sizeBytes) {
      throw new Error(
        `Primary producer bundled source size mismatch: ${source.path}.`,
      );
    }
    addPinnedInput(input.pinnedInputs, pinned.pin);
  }
  if (
    computeNhm2PrimaryProducerBundleSourceSnapshotSha256(
      buildMetadata.inputClosure.inputs,
    ) !== buildMetadata.inputClosure.sourceSnapshotSha256
  ) {
    throw new Error("Primary producer source-closure digest mismatch.");
  }
  if (buildMetadata.bundler.version !== esbuildVersion) {
    throw new Error(
      `Primary producer bundle requires esbuild ${buildMetadata.bundler.version}; admission has ${esbuildVersion}.`,
    );
  }

  const replay = await buildEsbuild({
    absWorkingDir: input.projectRoot,
    entryPoints: [buildMetadata.entryPoint.path],
    outfile: buildMetadata.metafile.outputKey,
    bundle: NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_OPTIONS.bundle,
    write: NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_OPTIONS.write,
    metafile: NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_OPTIONS.metafile,
    platform: NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_OPTIONS.platform,
    format: NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_OPTIONS.format,
    target: [NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_OPTIONS.target],
    packages: NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_OPTIONS.packages,
    sourcemap: NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_OPTIONS.sourcemap,
    legalComments: NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_OPTIONS.legalComments,
    charset: NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_OPTIONS.charset,
    treeShaking: NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_OPTIONS.treeShaking,
    minify: NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_OPTIONS.minify,
    logLevel: "silent",
  });
  if (
    replay.warnings.length !== 0 ||
    replay.outputFiles.length !== 1 ||
    replay.metafile == null
  ) {
    throw new Error(
      "Primary producer admission replay must emit one warning-free in-memory bundle and a metafile.",
    );
  }
  const replayOutput =
    replay.metafile.outputs[buildMetadata.metafile.outputKey];
  if (
    Object.keys(replay.metafile.outputs).length !== 1 ||
    replayOutput == null ||
    replayOutput.entryPoint !== buildMetadata.entryPoint.path ||
    replayOutput.bytes !== replay.outputFiles[0].contents.byteLength ||
    !Buffer.from(replay.outputFiles[0].contents).equals(bundlePinned.bytes)
  ) {
    throw new Error(
      "Primary producer admission replay does not reproduce the immutable bundle bytes.",
    );
  }
  const replayInputPaths = Object.keys(replay.metafile.inputs).sort();
  const expectedInputPaths = buildMetadata.inputClosure.inputs
    .map((entry) => entry.path)
    .sort();
  const replayExternalImports = replayOutput.imports
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
    replayExternalImports.some(
      (entry) => entry.external !== true || !entry.path.startsWith("node:"),
    ) ||
    JSON.stringify(replayInputPaths) !== JSON.stringify(expectedInputPaths) ||
    JSON.stringify(replayExternalImports) !==
      JSON.stringify(buildMetadata.metafile.externalImports) ||
    sha256Nhm2PrimaryProducerBundleBuildValue(replay.metafile) !==
      buildMetadata.metafile.sha256 ||
    sha256Nhm2PrimaryProducerBundleBuildValue(replay.metafile) !==
      sha256Nhm2PrimaryProducerBundleBuildValue(buildMetadata.metafile.value)
  ) {
    throw new Error(
      "Primary producer admission replay does not reproduce the governed source/dependency closure.",
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
    runtime.bundledDependencyClosureAttested !== true ||
    !isRecord(runtime.hostNodeRuntime)
  ) {
    throw new Error(
      "Primary environment descriptor does not bind a standalone Node runtime closure.",
    );
  }
  const host = runtime.hostNodeRuntime;
  if (
    !hasOnlyKeys(host, [
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
    typeof host.executablePath !== "string" ||
    !path.isAbsolute(host.executablePath) ||
    typeof host.sha256 !== "string" ||
    !SHA256.test(host.sha256) ||
    !Number.isSafeInteger(host.sizeBytes) ||
    (host.sizeBytes as number) <= 0 ||
    typeof host.nodeVersion !== "string" ||
    typeof host.platform !== "string" ||
    typeof host.arch !== "string" ||
    host.hostSpecificDiagnosticRuntimeClosure !== true ||
    host.operatingSystemHermeticityAsserted !== false ||
    host.nodeRuntimeReproducibilityAsserted !== false
  ) {
    throw new Error("Primary host Node runtime binding is invalid.");
  }
  const currentExecutable = await fs.realpath(path.resolve(process.execPath));
  const boundExecutable = await fs.realpath(host.executablePath);
  const executableStat = await fs.lstat(boundExecutable);
  const executableBytes = await fs.readFile(boundExecutable);
  if (
    boundExecutable !== host.executablePath ||
    currentExecutable !== boundExecutable ||
    !executableStat.isFile() ||
    executableStat.isSymbolicLink() ||
    executableStat.size !== host.sizeBytes ||
    executableBytes.byteLength !== host.sizeBytes ||
    sha256(executableBytes) !== host.sha256 ||
    process.version !== host.nodeVersion ||
    process.platform !== host.platform ||
    process.arch !== host.arch
  ) {
    throw new Error(
      "Primary host-specific Node runtime binding does not match the admitting process.",
    );
  }

  return {
    bundle: {
      path: buildMetadata.bundleRef.path,
      absolutePath: path.resolve(
        input.projectRoot,
        buildMetadata.bundleRef.path,
      ),
      sha256: buildMetadata.bundleRef.sha256,
      sizeBytes: buildMetadata.bundleRef.sizeBytes,
    },
    buildMetadata: {
      path: candidateBuildRef.path,
      sha256: candidateBuildRef.sha256,
      contractVersion: buildMetadata.contractVersion,
      esbuildVersion: buildMetadata.bundler.version,
      inputCount: buildMetadata.inputClosure.inputCount,
      sourceSnapshotSha256: buildMetadata.inputClosure.sourceSnapshotSha256,
      externalNodeBuiltins: [
        ...buildMetadata.dependencyClosure.externalNodeBuiltins,
      ],
      bundledSourceClosureComplete: true,
      runtimeNodeModulesRequired: false,
    },
    hostNodeRuntime: {
      executablePath: host.executablePath,
      sha256: host.sha256,
      sizeBytes: host.sizeBytes as number,
      nodeVersion: host.nodeVersion,
      platform: host.platform as NodeJS.Platform,
      arch: host.arch,
      hostSpecificDiagnosticRuntimeClosure: true,
      operatingSystemHermeticityAsserted: false,
      nodeRuntimeReproducibilityAsserted: false,
    },
  };
}

function collectHashedRefs(
  value: unknown,
): Array<{ path: string; sha256: string }> {
  const refs: Array<{ path: string; sha256: string }> = [];
  const visited = new WeakSet<object>();
  const visit = (entry: unknown, depth: number): void => {
    if (depth > 128 || entry == null || typeof entry !== "object") return;
    if (visited.has(entry)) return;
    visited.add(entry);
    if (Array.isArray(entry)) {
      entry.forEach((item) => visit(item, depth + 1));
      return;
    }
    const record = entry as JsonRecord;
    const refPath =
      typeof record.path === "string"
        ? record.path
        : typeof record.ref === "string"
          ? record.ref.split("#", 1)[0]
          : null;
    if (
      refPath != null &&
      typeof record.sha256 === "string" &&
      SHA256.test(record.sha256.replace(/^sha256:/, ""))
    ) {
      refs.push({
        path: refPath,
        sha256: record.sha256.replace(/^sha256:/, "").toLowerCase(),
      });
    }
    Object.values(record).forEach((item) => visit(item, depth + 1));
  };
  visit(value, 0);
  return refs;
}

async function verifyPinnedReferenceClosure(input: {
  projectRoot: string;
  realProjectRoot: string;
  seeds: unknown[];
  pinnedInputs: Nhm2TheoryCandidatePinnedInput[];
}): Promise<void> {
  const expected = new Map<string, string>();
  const queue: Array<{ path: string; sha256: string }> = [];
  const enqueue = (ref: { path: string; sha256: string }): void => {
    const prior = expected.get(ref.path);
    if (prior != null && prior !== ref.sha256) {
      throw new Error(`Pre-run input reference hash conflict for ${ref.path}.`);
    }
    if (prior == null) {
      expected.set(ref.path, ref.sha256);
      queue.push(ref);
    }
  };
  input.seeds.flatMap(collectHashedRefs).forEach(enqueue);
  const alreadyPinned = new Map(
    input.pinnedInputs.map((pin) => [pin.path, pin.sha256]),
  );
  for (let index = 0; index < queue.length; index += 1) {
    if (queue.length > 10_000) {
      throw new Error("Pre-run input reference closure exceeds 10,000 files.");
    }
    const ref = queue[index];
    const prior = alreadyPinned.get(ref.path);
    if (prior != null) {
      if (prior !== ref.sha256) {
        throw new Error(
          `Pre-run input reference conflicts with pin ${ref.path}.`,
        );
      }
      continue;
    }
    const pinned = await readPinnedInput({
      projectRoot: input.projectRoot,
      realProjectRoot: input.realProjectRoot,
      label: `pre-run reference ${ref.path}`,
      path: ref.path,
      sha256: ref.sha256,
    });
    input.pinnedInputs.push(pinned.pin);
    alreadyPinned.set(ref.path, pinned.pin.sha256);
    if (ref.path.toLowerCase().endsWith(".json")) {
      collectHashedRefs(
        parseJson(pinned.bytes, `pre-run reference ${ref.path}`),
      ).forEach(enqueue);
    }
  }
}

function predictionFreezeSemanticInputRefFromCandidateDescriptor(
  descriptor: unknown,
): Nhm2TheoryCandidatePredictionFreezeSemanticInputRef {
  if (
    !isRecord(descriptor) ||
    !isRecord(descriptor.predictionFreezeSemanticInput)
  ) {
    throw new Error(
      "Candidate definition must bind predictionFreezeSemanticInput path, raw SHA-256, and semantic SHA-256.",
    );
  }
  const ref = descriptor.predictionFreezeSemanticInput;
  if (
    typeof ref.path !== "string" ||
    !isPortableRepoPath(ref.path) ||
    typeof ref.sha256 !== "string" ||
    !SHA256.test(ref.sha256) ||
    typeof ref.semanticSha256 !== "string" ||
    !SHA256.test(ref.semanticSha256)
  ) {
    throw new Error(
      "Candidate predictionFreezeSemanticInput binding is invalid.",
    );
  }
  return {
    path: ref.path,
    sha256: ref.sha256.toLowerCase(),
    semanticSha256: ref.semanticSha256.toLowerCase(),
  };
}

function expectedEnvironment(input: {
  manifest: Nhm2ExperimentReadyTheoryCandidateManifestV1;
  manifestRawSha256: string;
  plan: Nhm2ExperimentReadyTheoryCandidateExecutionPlanV1;
}): Record<string, string> {
  const values: Record<string, string> = {};
  for (const entry of input.plan.expectedInvocation.environment) {
    values[entry.name] =
      entry.valueKind === "candidate_manifest_raw_sha256"
        ? input.manifestRawSha256
        : (entry.value ?? "");
  }
  return values;
}

function assertExactInvocation(input: {
  manifest: Nhm2ExperimentReadyTheoryCandidateManifestV1;
  manifestPath: string;
  manifestRawSha256: string;
  plan: Nhm2ExperimentReadyTheoryCandidateExecutionPlanV1;
}): Record<string, string> {
  const contract =
    NHM2_THEORY_CANDIDATE_PLAN_RUNTIME_CONTRACTS[input.plan.planRole];
  if (input.plan.runtimeId !== contract.runtimeId) {
    throw new Error(
      `Plan ${input.plan.planRole} runtime must be ${contract.runtimeId}.`,
    );
  }
  const invocation = input.plan.expectedInvocation;
  const expectedEntrypoint = `npm run ${contract.npmScript} -- --candidate-manifest ${input.manifestPath}`;
  const expectedArgs = [
    "run",
    "-s",
    contract.npmScript,
    "--",
    "--candidate-manifest",
    input.manifestPath,
  ];
  if (
    invocation.entrypoint !== expectedEntrypoint ||
    invocation.command !== "npm" ||
    JSON.stringify(invocation.args) !== JSON.stringify(expectedArgs) ||
    invocation.cwd !== "."
  ) {
    throw new Error(
      `Plan ${input.plan.planRole} invocation does not match the server-owned runtime contract.`,
    );
  }
  if (
    input.plan.receiptId !==
    nhm2ExperimentReadyTheoryCandidateReceiptIdForRequest(
      input.plan.runtimeId,
      input.plan.requestId,
    )
  ) {
    throw new Error(
      `Plan ${input.plan.planRole} receipt ID is not deterministic.`,
    );
  }
  const environment = expectedEnvironment(input);
  if (environment.NHM2_CANDIDATE_MANIFEST_SHA256 !== input.manifestRawSha256) {
    throw new Error(
      "Candidate manifest raw SHA-256 was not resolved before spawn.",
    );
  }
  return environment;
}

function evidenceForPlan(input: {
  manifest: Nhm2ExperimentReadyTheoryCandidateManifestV1;
  plan: Nhm2ExperimentReadyTheoryCandidateExecutionPlanV1;
}): Nhm2ExperimentReadyTheoryCandidateExpectedEvidenceOutputV1[] {
  const contract =
    NHM2_THEORY_CANDIDATE_PLAN_RUNTIME_CONTRACTS[input.plan.planRole];
  const evidence = input.manifest.expectedEvidenceOutputs.filter(
    (entry) => entry.runId === input.plan.runId,
  );
  const roles = evidence.map((entry) => entry.evidenceRole).sort();
  const expectedRoles = [...contract.evidenceRoles].sort();
  if (JSON.stringify(roles) !== JSON.stringify(expectedRoles)) {
    throw new Error(
      `Plan ${input.plan.planRole} does not bind exactly its required evidence roles.`,
    );
  }
  for (const output of evidence) {
    const expectedPath = `${input.plan.expectedInvocation.outputDirectory}/evidence/${output.evidenceRole}.json`;
    if (output.outputPath !== expectedPath) {
      throw new Error(
        `Evidence ${output.evidenceRole} must use its exact run-specific output path.`,
      );
    }
  }
  return evidence.sort((left, right) =>
    left.evidenceRole.localeCompare(right.evidenceRole),
  );
}

async function assertOutputDirectoryEmptyAndContained(input: {
  projectRoot: string;
  realProjectRoot: string;
  outputDirectory: string;
}): Promise<void> {
  if (!isPortableRepoPath(input.outputDirectory)) {
    throw new Error(
      "Candidate output directory must be repository-relative and portable.",
    );
  }
  const absolute = path.resolve(input.projectRoot, input.outputDirectory);
  if (
    absolute === input.projectRoot ||
    !pathInside(input.projectRoot, absolute)
  ) {
    throw new Error(
      "Candidate output directory resolves outside the project root.",
    );
  }
  try {
    const stat = await fs.lstat(absolute);
    if (!stat.isDirectory() || stat.isSymbolicLink()) {
      throw new Error(
        "Candidate output directory must be a non-symbolic directory when it already exists.",
      );
    }
    const realOutput = await fs.realpath(absolute);
    if (!pathInside(input.realProjectRoot, realOutput)) {
      throw new Error(
        "Candidate output directory resolves outside the real project root.",
      );
    }
    if ((await fs.readdir(absolute)).length !== 0) {
      throw new Error("Candidate output directory must be empty before spawn.");
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    let ancestor = path.dirname(absolute);
    while (true) {
      try {
        const realAncestor = await fs.realpath(ancestor);
        if (!pathInside(input.realProjectRoot, realAncestor)) {
          throw new Error(
            "Candidate output directory has an ancestor outside the real project root.",
          );
        }
        break;
      } catch (ancestorError) {
        if ((ancestorError as NodeJS.ErrnoException).code !== "ENOENT") {
          throw ancestorError;
        }
        const next = path.dirname(ancestor);
        if (next === ancestor) throw ancestorError;
        ancestor = next;
      }
    }
  }
}

const bindingInputs = (
  manifest: Nhm2ExperimentReadyTheoryCandidateManifestV1,
  plan: Nhm2ExperimentReadyTheoryCandidateExecutionPlanV1,
): Array<{
  label: string;
  binding: Nhm2ExperimentReadyTheoryCandidateHashedBindingV1;
  identity: Record<string, string>;
}> => [
  {
    label: "candidate definition",
    binding: manifest.bindings.candidate,
    identity: { candidateId: manifest.bindings.candidate.candidateId },
  },
  {
    label: "selected profile",
    binding: manifest.bindings.profile,
    identity: {
      selectedProfileId: manifest.bindings.profile.selectedProfileId,
    },
  },
  {
    label: "chart definition",
    binding: manifest.bindings.chart,
    identity: { chartId: manifest.bindings.chart.chartId },
  },
  {
    label: "mask atlas",
    binding: manifest.bindings.atlas,
    identity: { atlasId: manifest.bindings.atlas.atlasId },
  },
  {
    label: "units definition",
    binding: manifest.bindings.units,
    identity: { unitsId: manifest.bindings.units.unitsId },
  },
  {
    label: "normalization definition",
    binding: manifest.bindings.normalization,
    identity: {
      normalizationId: manifest.bindings.normalization.normalizationId,
    },
  },
  {
    label: `${plan.planRole} solver`,
    binding: plan.solver,
    identity: {
      solverId: plan.solver.solverId,
      solverVersion: plan.solver.solverVersion,
      implementationId: plan.solver.implementationId,
    },
  },
  {
    label: `${plan.planRole} environment lock`,
    binding: plan.environmentLock,
    identity: { environmentId: plan.environmentLock.environmentId },
  },
];

export async function admitNhm2TheoryCandidatePlan(
  input: AdmitNhm2TheoryCandidatePlanInput,
  dependencies: Nhm2TheoryCandidatePlanAdmissionDependencies = {},
): Promise<Nhm2TheoryCandidatePlanAdmission> {
  const projectRoot = path.resolve(input.projectRoot ?? process.cwd());
  const realProjectRoot = await fs.realpath(projectRoot);
  if (!isPortableRepoPath(input.candidateManifestPath)) {
    throw new Error(
      "Candidate manifest path must be repository-relative and portable.",
    );
  }
  const manifestAbsolutePath = await resolvePinnedPath({
    projectRoot,
    realProjectRoot,
    repoRelativePath: input.candidateManifestPath,
    label: "candidate manifest",
  });
  const manifestBytes = await fs.readFile(manifestAbsolutePath);
  const manifestRawSha256 = sha256(manifestBytes);
  const parsedManifest = parseJson(manifestBytes, "candidate manifest");
  if (!isNhm2ExperimentReadyTheoryCandidateManifest(parsedManifest)) {
    throw new Error("Candidate manifest failed its exact v1 contract guard.");
  }
  const manifest = parsedManifest;
  if (
    manifest.readiness.status !== "pre_run_manifest_ready" ||
    !manifest.readiness.preRunManifestReady
  ) {
    throw new Error("Candidate manifest is not pre-run ready.");
  }

  const executionStartsAt = canonicalIso(
    input.executionStartsAt ?? new Date().toISOString(),
    "executionStartsAt",
  );
  if (Date.parse(manifest.frozenAt) >= Date.parse(executionStartsAt)) {
    throw new Error(
      "Candidate manifest must be frozen before execution starts.",
    );
  }

  const plan = manifest.executionPlans.find(
    (candidate) => candidate.planRole === input.planRole,
  );
  if (plan == null)
    throw new Error(`Candidate plan ${input.planRole} is missing.`);
  const runtimeContract =
    NHM2_THEORY_CANDIDATE_PLAN_RUNTIME_CONTRACTS[input.planRole];
  const registeredEntrypoint = getTheoryRuntimeEntrypoint(plan.runtimeId);
  if (
    registeredEntrypoint == null ||
    registeredEntrypoint.command !== `npm run ${runtimeContract.npmScript}`
  ) {
    throw new Error(
      `Candidate plan ${input.planRole} has no matching registered runtime entrypoint.`,
    );
  }
  if (runtimeContract.packageTarget == null) {
    throw new Error(
      `Candidate plan ${input.planRole} is frozen but its executable producer is not implemented.`,
    );
  }
  const packageJson = parseJson(
    await fs.readFile(path.join(projectRoot, "package.json")),
    "package.json",
  );
  if (
    !isRecord(packageJson) ||
    !isRecord(packageJson.scripts) ||
    packageJson.scripts[runtimeContract.npmScript] !==
      runtimeContract.packageTarget
  ) {
    throw new Error(
      `Candidate plan ${input.planRole} package script does not match the registered producer.`,
    );
  }
  const sourceCommitSha = await (
    dependencies.resolveGitHead ?? defaultResolveGitHead
  )(projectRoot);
  if (plan.sourceCommitSha.toLowerCase() !== sourceCommitSha.toLowerCase()) {
    throw new Error(
      `Plan source commit ${plan.sourceCommitSha} does not match HEAD ${sourceCommitSha}.`,
    );
  }
  const sourceTreeClean = await (
    dependencies.resolveSourceTreeClean ?? defaultResolveSourceTreeClean
  )(projectRoot);
  if ((input.requireCleanSourceTree ?? true) && !sourceTreeClean) {
    throw new Error("Candidate plan admission requires a clean source tree.");
  }

  const resolvedEnvironment = assertExactInvocation({
    manifest,
    manifestPath: input.candidateManifestPath,
    manifestRawSha256,
    plan,
  });
  const evidenceOutputs = evidenceForPlan({ manifest, plan });
  await assertOutputDirectoryEmptyAndContained({
    projectRoot,
    realProjectRoot,
    outputDirectory: plan.expectedInvocation.outputDirectory,
  });

  const pinnedInputs: Nhm2TheoryCandidatePinnedInput[] = [];
  const preRunJsonSeeds: unknown[] = [];
  let candidateDescriptor: unknown = null;
  let solverDescriptor: unknown = null;
  let environmentDescriptor: unknown = null;
  for (const { label, binding, identity } of bindingInputs(manifest, plan)) {
    const pinned = await readPinnedInput({
      projectRoot,
      realProjectRoot,
      label,
      path: binding.path,
      sha256: binding.sha256,
    });
    pinnedInputs.push(pinned.pin);
    const descriptor = parseJson(pinned.bytes, label);
    preRunJsonSeeds.push(descriptor);
    if (
      !isRecord(descriptor) ||
      descriptor.artifactId !== binding.artifactId ||
      descriptor.contractVersion !== binding.contractVersion ||
      Object.entries(identity).some(
        ([key, expected]) => descriptor[key] !== expected,
      )
    ) {
      throw new Error(
        `${label} descriptor identity does not match its manifest binding.`,
      );
    }
    if (label === "candidate definition") {
      candidateDescriptor = descriptor;
    }
    if (label === `${plan.planRole} solver`) {
      solverDescriptor = descriptor;
      const sourceRef = isRecord(descriptor) ? descriptor.sourceRef : null;
      if (
        !isRecord(sourceRef) ||
        sourceRef.path !== runtimeContract.solverSourcePath ||
        sourceRef.schemaVersion !== "typescript_source/v1" ||
        typeof sourceRef.sha256 !== "string" ||
        !SHA256.test(sourceRef.sha256)
      ) {
        throw new Error(
          `${plan.planRole} solver descriptor does not bind the server-owned executable source.`,
        );
      }
    }
    if (label === `${plan.planRole} environment lock`) {
      environmentDescriptor = descriptor;
      const dependencyLockRef = isRecord(descriptor)
        ? descriptor.dependencyLockRef
        : null;
      if (
        !isRecord(dependencyLockRef) ||
        dependencyLockRef.path !== runtimeContract.dependencyLockPath ||
        dependencyLockRef.schemaVersion !== "npm_package_lock/v1" ||
        typeof dependencyLockRef.sha256 !== "string" ||
        !SHA256.test(dependencyLockRef.sha256)
      ) {
        throw new Error(
          `${plan.planRole} environment descriptor does not bind the server-owned dependency lock.`,
        );
      }
    }
  }

  const primaryProducerBundle = await verifyPrimaryProducerBundleAdmission({
    projectRoot,
    realProjectRoot,
    manifest,
    candidateDescriptor,
    solverDescriptor,
    environmentDescriptor,
    pinnedInputs,
    preRunJsonSeeds,
  });

  const numericPolicy = await readPinnedInput({
    projectRoot,
    realProjectRoot,
    label: "authoritative numeric policy",
    path: manifest.numericCheckPolicySet.artifactPath,
    sha256: manifest.numericCheckPolicySet.artifactRawSha256,
  });
  pinnedInputs.push(numericPolicy.pin);
  const numericPolicyJson = parseJson(
    numericPolicy.bytes,
    "authoritative numeric policy",
  );
  preRunJsonSeeds.push(numericPolicyJson);
  if (
    !isNhm2ExperimentReadyTheoryCandidateNumericPolicySetArtifact(
      numericPolicyJson,
    ) ||
    numericPolicyJson.policySetId !==
      manifest.numericCheckPolicySet.policySetId ||
    numericPolicyJson.semanticSha256 !==
      manifest.numericCheckPolicySet.semanticSha256
  ) {
    throw new Error(
      "Authoritative numeric policy does not match the manifest semantic commitment.",
    );
  }

  const supersessionPolicy = await readPinnedInput({
    projectRoot,
    realProjectRoot,
    label: "supersession policy",
    path: manifest.supersession.policyPath,
    sha256: manifest.supersession.policySha256,
  });
  pinnedInputs.push(supersessionPolicy.pin);
  preRunJsonSeeds.push(
    parseJson(supersessionPolicy.bytes, "supersession policy"),
  );

  const predictionFreezeSemanticInputRef =
    predictionFreezeSemanticInputRefFromCandidateDescriptor(
      candidateDescriptor,
    );
  if (
    predictionFreezeSemanticInputRef.semanticSha256 !==
    manifest.predictionFreezeCommitment.semanticSha256
  ) {
    throw new Error(
      "Candidate prediction freeze semantic SHA-256 does not match the manifest commitment.",
    );
  }
  const predictionFreezeSemanticInput = await readPinnedInput({
    projectRoot,
    realProjectRoot,
    label: "pre-run prediction freeze semantic input",
    path: predictionFreezeSemanticInputRef.path,
    sha256: predictionFreezeSemanticInputRef.sha256,
  });
  pinnedInputs.push(predictionFreezeSemanticInput.pin);
  const predictionFreezeSemanticInputJson = parseJson(
    predictionFreezeSemanticInput.bytes,
    "pre-run prediction freeze semantic input",
  );
  preRunJsonSeeds.push(predictionFreezeSemanticInputJson);
  if (
    !isRecord(predictionFreezeSemanticInputJson) ||
    predictionFreezeSemanticInputJson.artifactId !==
      "nhm2.prediction_falsifier_freeze_semantic_input" ||
    predictionFreezeSemanticInputJson.contractVersion !==
      "nhm2_prediction_falsifier_freeze_semantic_input/v1" ||
    predictionFreezeSemanticInputJson.semanticSha256 !==
      predictionFreezeSemanticInputRef.semanticSha256 ||
    !isRecord(predictionFreezeSemanticInputJson.frozenInput) ||
    !isRecord(predictionFreezeSemanticInputJson.historicalSeedBoundary) ||
    predictionFreezeSemanticInputJson.historicalSeedBoundary
      .boundToExecution !== false ||
    predictionFreezeSemanticInputJson.historicalSeedBoundary
      .artifactFreshness !== "preexisting" ||
    predictionFreezeSemanticInputJson.historicalSeedBoundary
      .diagnosticSeedOnly !== true ||
    !isRecord(predictionFreezeSemanticInputJson.claimBoundary) ||
    predictionFreezeSemanticInputJson.claimBoundary.semanticInputOnly !==
      true ||
    predictionFreezeSemanticInputJson.claimBoundary
      .theoryClosureClaimAllowed !== false ||
    predictionFreezeSemanticInputJson.claimBoundary
      .physicalViabilityClaimAllowed !== false ||
    predictionFreezeSemanticInputJson.claimBoundary.transportClaimAllowed !==
      false ||
    predictionFreezeSemanticInputJson.claimBoundary.propulsionClaimAllowed !==
      false ||
    predictionFreezeSemanticInputJson.claimBoundary.routeEtaClaimAllowed !==
      false ||
    predictionFreezeSemanticInputJson.claimBoundary
      .speedAuthorityClaimAllowed !== false
  ) {
    throw new Error(
      "Pre-run prediction freeze semantic input wrapper or diagnostic claim boundary is invalid.",
    );
  }
  const frozenPredictionInput = predictionFreezeSemanticInputJson.frozenInput;
  if (
    "registrationBinding" in frozenPredictionInput ||
    "generatedAt" in frozenPredictionInput
  ) {
    throw new Error(
      "Pre-run prediction freeze semantic input must not pre-resolve registrationBinding or generatedAt.",
    );
  }
  const predictionFreezeJson = buildNhm2PredictionFalsifierFreeze({
    ...(frozenPredictionInput as unknown as Omit<
      BuildNhm2PredictionFalsifierFreezeInput,
      "generatedAt" | "registrationBinding"
    >),
    generatedAt: executionStartsAt,
    registrationBinding: {
      candidateId: manifest.bindings.candidate.candidateId,
      candidateManifestPath: input.candidateManifestPath,
      candidateManifestSha256: manifestRawSha256,
      runId: plan.runId,
      requestId: plan.requestId,
      receiptId: plan.receiptId,
      runtimeId: plan.runtimeId,
      plannedOutputDirectory: plan.expectedInvocation.outputDirectory,
    },
  });
  if (
    !isNhm2PredictionFalsifierFreeze(predictionFreezeJson) ||
    predictionFreezeJson.semanticSha256 !==
      predictionFreezeSemanticInputRef.semanticSha256 ||
    predictionFreezeJson.frozenAt !==
      manifest.predictionFreezeCommitment.frozenAt
  ) {
    throw new Error(
      "Pre-run prediction freeze failed its exact contract or manifest binding.",
    );
  }

  await verifyPinnedReferenceClosure({
    projectRoot,
    realProjectRoot,
    seeds: preRunJsonSeeds,
    pinnedInputs,
  });

  return {
    manifest,
    manifestPath: input.candidateManifestPath,
    manifestRawSha256,
    plan,
    evidenceOutputs,
    outputDirectory: plan.expectedInvocation.outputDirectory,
    resolvedEnvironment,
    predictionFreeze: predictionFreezeJson,
    predictionFreezeSemanticInputRef,
    primaryProducerBundle,
    pinnedInputs,
    sourceCommitSha,
    sourceTreeClean,
  };
}
