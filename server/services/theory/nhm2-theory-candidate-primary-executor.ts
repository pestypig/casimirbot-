import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import { isCasimirFiniteTemperatureFiniteGeometryMaxwellStress } from "../../../shared/contracts/casimir-finite-temperature-finite-geometry-maxwell-stress.v1";
import { isNhm2ContinuousObserverOptimizer } from "../../../shared/contracts/nhm2-continuous-observer-optimizer.v1";
import { isNhm2CovariantConservation } from "../../../shared/contracts/nhm2-covariant-conservation.v1";
import { isNhm2DynamicBackreactionStabilityCausality } from "../../../shared/contracts/nhm2-dynamic-backreaction-stability-causality.v1";
import { isNhm2FullApparatusSourceTensor } from "../../../shared/contracts/nhm2-full-apparatus-source-tensor.v1";
import { isNhm2MechanicalSupportControlMargin } from "../../../shared/contracts/nhm2-mechanical-support-control-margin.v1";
import { isNhm2PredictionFalsifierFreeze } from "../../../shared/contracts/nhm2-prediction-falsifier-freeze.v1";
import { isNhm2SemiclassicalStateRealizability } from "../../../shared/contracts/nhm2-semiclassical-state-realizability.v1";
import { isNhm2WorldlineQeiCoverage } from "../../../shared/contracts/nhm2-worldline-qei-coverage.v1";
import {
  buildTheoryRuntimeReceiptV1,
  isTheoryRuntimeReceiptV1,
  type TheoryRuntimeGateStatus,
  type TheoryRuntimeOutputManifestEntryV1,
  type TheoryRuntimeOutputManifestV1,
  type TheoryRuntimeReceiptV1,
} from "../../../shared/contracts/theory-runtime-receipt.v1";
import { getTheoryRuntimeEntrypoint } from "../../../shared/theory/runtime-entrypoints";
import { THEORY_RUNTIME_WORKSTATION_GRAPH_ID } from "../../../shared/theory/runtime-execution-policy";
import type {
  TheoryRuntimeCommandV1,
  TheoryRuntimeExecutionResult,
  TheoryRuntimeSpawnExecutor,
} from "./runtime-adapters";
import { executeTheoryRuntimeCommand } from "./runtime-adapters";
import {
  buildTheoryRuntimeFreshnessProof,
  classifyTheoryRuntimeArtifacts,
  snapshotTheoryRuntimeOutput,
  writeTheoryRuntimeOutputManifest,
  writeTheoryRuntimePreSpawnSnapshotCommitment,
} from "./runtime-artifact-manifest";
import {
  admitNhm2TheoryCandidatePlan,
  type Nhm2TheoryCandidatePlanAdmission,
} from "./nhm2-theory-candidate-plan-admission";
import {
  createTheoryRuntimeRunRequestManifest,
  readTheoryRuntimeRunRequestStatus,
  updateTheoryRuntimeRunRequestStatus,
} from "./theory-runtime-run-request-manifest";
import type { TheoryRuntimeRunRequestV1 } from "../../../shared/contracts/theory-runtime-run-request.v1";
import {
  writeTheoryRuntimeReceiptArtifact,
  type TheoryRuntimePersistedReceiptRefV1,
} from "./theory-runtime-receipt-store";
import { verifyTheoryRuntimeReceiptFilesystem } from "./theory-runtime-receipt-filesystem-verifier";
import {
  compileAndPublishNhm2PrimaryRawRun,
  NHM2_PRIMARY_RAW_OUTPUT_MANIFEST_FILENAME,
  type Nhm2PrimaryRawRunPublication,
} from "./nhm2-primary-raw-run-publisher";
import {
  publishNhm2PrimaryComparisonProjectionAssessment,
  type Nhm2PrimaryComparisonProjectionAssessmentPublication,
} from "./nhm2-primary-comparison-projection-finalizer";

const execFileAsync = promisify(execFile);
const PREDICTION_EVIDENCE_ROLE = "prediction_falsifier_freeze";

const PRIMARY_EVIDENCE_GUARDS = {
  full_apparatus_source_tensor: isNhm2FullApparatusSourceTensor,
  semiclassical_state: isNhm2SemiclassicalStateRealizability,
  covariant_conservation: isNhm2CovariantConservation,
  continuous_observer_optimizer: isNhm2ContinuousObserverOptimizer,
  worldline_qei: isNhm2WorldlineQeiCoverage,
  dynamic_backreaction_stability_causality:
    isNhm2DynamicBackreactionStabilityCausality,
  finite_temperature_finite_geometry_maxwell_stress:
    isCasimirFiniteTemperatureFiniteGeometryMaxwellStress,
  mechanical_support_control_margin: isNhm2MechanicalSupportControlMargin,
  prediction_falsifier_freeze: isNhm2PredictionFalsifierFreeze,
} as const;

type PrimaryEvidenceRole = keyof typeof PRIMARY_EVIDENCE_GUARDS;

type JsonRecord = Record<string, unknown>;

type PrimaryProducerArtifactSummary = {
  evidenceRole: string;
  outputPath: string;
  contractVersion: string;
  sha256: string;
  disposition: "pass" | "blocked" | "fail" | "not_ready" | "ready";
};

export type Nhm2PrimaryProducerSummaryStatus =
  "ready" | "not_ready" | "falsified";

type PrimaryProducerSummary = {
  status: Nhm2PrimaryProducerSummaryStatus;
  manifestPath: string;
  manifestSha256: string;
  planRole: "primary_numerical";
  runtimeId: string;
  requestId: string;
  runId: string;
  receiptId: string;
  outputDirectory: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  artifacts: PrimaryProducerArtifactSummary[];
  blockers: string[];
  claimBoundary: {
    diagnosticOnly: true;
    rawEvidenceIntervalEndsBeforeOuterRuntimeReceipt: true;
    historicalAlpha07PackageIsExecutionEvidence: false;
    idealParallelPlateScalarIsAuthority: false;
    experimentReadyTheoryClosureClaimAllowed: false;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
    routeEtaClaimAllowed: false;
    speedAuthorityClaimAllowed: false;
  };
};

export type Nhm2PrimaryNumericalProjection = {
  gate: TheoryRuntimeGateStatus;
  primaryNumericalReady: boolean;
  primaryNumericalFalsified: boolean;
  missingSignals: string[];
};

type GitSourceState = {
  head: string;
  sourceTreeSha256: string;
  clean: boolean;
};

export type ExecuteNhm2TheoryCandidatePrimaryInput = {
  candidateManifestPath: string;
  projectRoot?: string;
  execute: true;
  timeoutMs?: number;
};

export type ExecuteNhm2TheoryCandidatePrimaryResult = {
  requestId: string;
  runtimeId: string;
  requestManifestPath: string;
  command: TheoryRuntimeCommandV1;
  execution: TheoryRuntimeExecutionResult;
  receiptV1: TheoryRuntimeReceiptV1;
  receiptArtifact: TheoryRuntimePersistedReceiptRefV1;
};

export type Nhm2TheoryCandidatePrimaryLaunchOwnership = {
  /** Identifies the outer server handler; it is not the producer command. */
  handlerId: string;
  onRequestCreated: (input: {
    request: TheoryRuntimeRunRequestV1;
    manifestPath: string;
  }) => void | Promise<void>;
};

const isRecord = (value: unknown): value is JsonRecord =>
  value != null && typeof value === "object" && !Array.isArray(value);

const normalizeRepoPath = (value: string): string =>
  value.replace(/\\/g, "/").replace(/^\.\//, "");

const unique = (values: string[]): string[] => Array.from(new Set(values));

export function deriveNhm2PrimaryProducerSummaryStatus(
  artifacts: readonly Pick<
    PrimaryProducerArtifactSummary,
    "evidenceRole" | "disposition"
  >[],
): Nhm2PrimaryProducerSummaryStatus {
  const expectedRoles = Object.keys(PRIMARY_EVIDENCE_GUARDS).sort();
  const byRole = new Map<
    string,
    PrimaryProducerArtifactSummary["disposition"]
  >();
  for (const artifact of artifacts) {
    if (
      !expectedRoles.includes(artifact.evidenceRole) ||
      byRole.has(artifact.evidenceRole)
    ) {
      throw new Error(
        `Primary producer summary has an unexpected or duplicate evidence role: ${artifact.evidenceRole}.`,
      );
    }
    if (artifact.evidenceRole === PREDICTION_EVIDENCE_ROLE) {
      if (
        artifact.disposition !== "ready" &&
        artifact.disposition !== "not_ready"
      ) {
        throw new Error(
          `Prediction-freeze disposition must be ready or not_ready, not ${String(artifact.disposition)}.`,
        );
      }
    } else if (
      artifact.disposition !== "pass" &&
      artifact.disposition !== "blocked" &&
      artifact.disposition !== "fail"
    ) {
      throw new Error(
        `Physics evidence disposition must be pass, blocked, or fail, not ${String(artifact.disposition)}.`,
      );
    }
    byRole.set(artifact.evidenceRole, artifact.disposition);
  }
  if (
    byRole.size !== expectedRoles.length ||
    expectedRoles.some((role) => !byRole.has(role))
  ) {
    throw new Error(
      "Primary producer summary status requires exactly all nine evidence roles.",
    );
  }
  const physicsDispositions = expectedRoles
    .filter((role) => role !== PREDICTION_EVIDENCE_ROLE)
    .map((role) => byRole.get(role));
  if (physicsDispositions.some((disposition) => disposition === "fail")) {
    return "falsified";
  }
  if (
    physicsDispositions.every((disposition) => disposition === "pass") &&
    byRole.get(PREDICTION_EVIDENCE_ROLE) === "ready"
  ) {
    return "ready";
  }
  return "not_ready";
}

export function projectNhm2PrimaryNumericalStatus(input: {
  status: Nhm2PrimaryProducerSummaryStatus;
  blockers: readonly string[];
}): Nhm2PrimaryNumericalProjection {
  if (
    !input.blockers.every(
      (blocker) => typeof blocker === "string" && blocker.length > 0,
    ) ||
    new Set(input.blockers).size !== input.blockers.length
  ) {
    throw new Error(
      "Primary producer blockers must be unique non-empty strings.",
    );
  }
  if (input.status === "ready" && input.blockers.length !== 0) {
    throw new Error("A ready primary producer summary cannot retain blockers.");
  }
  if (input.status !== "ready" && input.blockers.length === 0) {
    throw new Error(
      "A not-ready or falsified primary producer summary requires concrete blockers.",
    );
  }
  if (input.status === "ready") {
    return {
      gate: "pass",
      primaryNumericalReady: true,
      primaryNumericalFalsified: false,
      missingSignals: [],
    };
  }
  if (input.status === "falsified") {
    return {
      gate: "fail",
      primaryNumericalReady: false,
      primaryNumericalFalsified: true,
      missingSignals: unique([
        "primary_numerical_evidence_falsified",
        ...input.blockers,
      ]),
    };
  }
  return {
    gate: "not_ready",
    primaryNumericalReady: false,
    primaryNumericalFalsified: false,
    missingSignals: unique([
      "primary_numerical_evidence_not_ready",
      ...input.blockers,
    ]),
  };
}

const canonicalTimestamp = (value: unknown): value is string =>
  typeof value === "string" &&
  Number.isFinite(Date.parse(value)) &&
  new Date(Date.parse(value)).toISOString() === value;

async function resolveGitSourceState(
  projectRoot: string,
): Promise<GitSourceState> {
  const [headResult, treeResult, statusResult] = await Promise.all([
    execFileAsync("git", ["rev-parse", "--verify", "HEAD"], {
      cwd: projectRoot,
      encoding: "utf8",
      windowsHide: true,
    }),
    execFileAsync("git", ["rev-parse", "--verify", "HEAD^{tree}"], {
      cwd: projectRoot,
      encoding: "utf8",
      windowsHide: true,
    }),
    execFileAsync(
      "git",
      ["status", "--porcelain=v1", "-z", "--untracked-files=all"],
      {
        cwd: projectRoot,
        encoding: "utf8",
        windowsHide: true,
        maxBuffer: 64 * 1024 * 1024,
      },
    ),
  ]);
  const head = String(headResult.stdout).trim().toLowerCase();
  const tree = String(treeResult.stdout).trim().toLowerCase();
  const status = String(statusResult.stdout);
  if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(head)) {
    throw new Error("Primary executor could not resolve a valid Git HEAD.");
  }
  if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(tree)) {
    throw new Error("Primary executor could not resolve a valid Git tree.");
  }
  const statusSha256 = createHash("sha256")
    .update(status, "utf8")
    .digest("hex");
  return {
    head,
    clean: status.length === 0,
    sourceTreeSha256: createHash("sha256")
      .update(`${head}\0${tree}\0${statusSha256}`, "utf8")
      .digest("hex"),
  };
}

async function assertAdmittedInputsCurrent(input: {
  projectRoot: string;
  admission: Nhm2TheoryCandidatePlanAdmission;
  phase: "pre_spawn" | "post_spawn";
}): Promise<void> {
  const expected = [
    {
      label: "candidate manifest",
      path: input.admission.manifestPath,
      sha256: input.admission.manifestRawSha256,
    },
    ...input.admission.pinnedInputs,
  ];
  const realProjectRoot = await fs.realpath(input.projectRoot);
  for (const pin of expected) {
    const absolutePath = path.resolve(input.projectRoot, pin.path);
    const relative = path.relative(input.projectRoot, absolutePath);
    if (
      relative.length === 0 ||
      relative.startsWith("..") ||
      path.isAbsolute(relative)
    ) {
      throw new Error(
        `${input.phase} admitted input escaped the project root: ${pin.label}.`,
      );
    }
    const stat = await fs.lstat(absolutePath);
    if (stat.isSymbolicLink() || !stat.isFile()) {
      throw new Error(
        `${input.phase} admitted input is not a regular file: ${pin.label}.`,
      );
    }
    const realPath = await fs.realpath(absolutePath);
    const realRelative = path.relative(realProjectRoot, realPath);
    if (
      realRelative.length === 0 ||
      realRelative.startsWith("..") ||
      path.isAbsolute(realRelative)
    ) {
      throw new Error(
        `${input.phase} admitted input escaped the real project root: ${pin.label}.`,
      );
    }
    const actualSha256 = createHash("sha256")
      .update(await fs.readFile(absolutePath))
      .digest("hex");
    if (actualSha256 !== pin.sha256.toLowerCase()) {
      throw new Error(
        `${input.phase} admitted input hash changed: ${pin.label}.`,
      );
    }
  }
}

async function hashRegularLauncherFile(input: {
  role: "node_runtime" | "standalone_bundle";
  absolutePath: string;
  projectRoot: string;
  mustBeInsideProject: boolean;
  expectedSha256: string;
  expectedSizeBytes: number;
}): Promise<NonNullable<TheoryRuntimeCommandV1["launcherBindings"]>[number]> {
  const stat = await fs.lstat(input.absolutePath);
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw new Error(`${input.role} launcher binding must be a regular file.`);
  }
  const realPath = await fs.realpath(input.absolutePath);
  if (input.mustBeInsideProject) {
    const realProjectRoot = await fs.realpath(input.projectRoot);
    const relative = path.relative(realProjectRoot, realPath);
    if (
      relative.length === 0 ||
      relative.startsWith("..") ||
      path.isAbsolute(relative)
    ) {
      throw new Error(
        `${input.role} launcher binding escaped the project root.`,
      );
    }
  }
  const bytes = await fs.readFile(realPath);
  const actualSha256 = createHash("sha256").update(bytes).digest("hex");
  if (
    stat.size !== input.expectedSizeBytes ||
    bytes.byteLength !== input.expectedSizeBytes ||
    actualSha256 !== input.expectedSha256
  ) {
    throw new Error(`${input.role} launcher binding changed before spawn.`);
  }
  return {
    role: input.role,
    path: realPath,
    sha256: actualSha256,
    sizeBytes: bytes.byteLength,
  };
}

async function assertLauncherBindingsCurrent(
  command: TheoryRuntimeCommandV1,
  phase: "pre_spawn" | "post_spawn",
): Promise<void> {
  const bindings = command.launcherBindings ?? [];
  if (
    bindings.length !== 2 ||
    bindings[0]?.role !== "node_runtime" ||
    bindings[1]?.role !== "standalone_bundle"
  ) {
    throw new Error(`${phase} primary launcher binding set is incomplete.`);
  }
  for (const binding of bindings) {
    const stat = await fs.lstat(binding.path);
    const realPath = await fs.realpath(binding.path);
    const bytes = await fs.readFile(binding.path);
    const actual = createHash("sha256").update(bytes).digest("hex");
    if (
      stat.isSymbolicLink() ||
      !stat.isFile() ||
      realPath !== binding.path ||
      binding.sizeBytes == null ||
      stat.size !== binding.sizeBytes ||
      bytes.byteLength !== binding.sizeBytes ||
      actual !== binding.sha256
    ) {
      throw new Error(`${phase} ${binding.role} launcher hash changed.`);
    }
  }
}

async function buildLauncherCommand(input: {
  admission: Nhm2TheoryCandidatePlanAdmission;
  projectRoot: string;
  timeoutMs?: number;
  fullTimeoutMs: number;
}): Promise<TheoryRuntimeCommandV1> {
  const logicalArgs = input.admission.plan.expectedInvocation.args;
  const npmScript = logicalArgs[2];
  if (
    logicalArgs[0] !== "run" ||
    logicalArgs[1] !== "-s" ||
    typeof npmScript !== "string" ||
    npmScript.length === 0
  ) {
    throw new Error("Admitted primary invocation has no fixed npm script.");
  }
  const runtime = input.admission.primaryProducerBundle.hostNodeRuntime;
  const bundle = input.admission.primaryProducerBundle.bundle;
  const launcherBindings = await Promise.all([
    hashRegularLauncherFile({
      role: "node_runtime",
      absolutePath: runtime.executablePath,
      projectRoot: input.projectRoot,
      mustBeInsideProject: false,
      expectedSha256: runtime.sha256,
      expectedSizeBytes: runtime.sizeBytes,
    }),
    hashRegularLauncherFile({
      role: "standalone_bundle",
      absolutePath: bundle.absolutePath,
      projectRoot: input.projectRoot,
      mustBeInsideProject: true,
      expectedSha256: bundle.sha256,
      expectedSizeBytes: bundle.sizeBytes,
    }),
  ]);
  return {
    command: runtime.executablePath,
    args: [bundle.absolutePath, ...logicalArgs.slice(4)],
    cwd: input.projectRoot,
    npmScript,
    timeoutMs: Math.min(
      input.timeoutMs ?? input.fullTimeoutMs,
      input.fullTimeoutMs,
    ),
    env: { ...input.admission.resolvedEnvironment },
    inheritProcessEnv: false,
    launcherBindings,
  };
}

async function listOutputInventory(input: {
  projectRoot: string;
  outputDirectory: string;
}): Promise<string[]> {
  const paths: string[] = [];
  const visit = async (directory: string): Promise<void> => {
    const entries = await fs.readdir(directory, {
      withFileTypes: true,
      encoding: "utf8",
    });
    for (const entry of entries) {
      const absolute = path.join(directory, entry.name);
      const repoPath = normalizeRepoPath(
        path.relative(input.projectRoot, absolute),
      );
      if (entry.isSymbolicLink()) {
        throw new Error(
          `Primary output contains a symbolic link: ${repoPath}.`,
        );
      }
      if (entry.isDirectory()) {
        await visit(absolute);
      } else if (entry.isFile()) {
        paths.push(repoPath);
      } else {
        throw new Error(`Primary output is not a regular file: ${repoPath}.`);
      }
    }
  };
  await visit(input.outputDirectory);
  return paths.sort();
}

export type Nhm2PrimaryRunOwnedReferenceClosure = {
  rootCount: 9;
  supplementaryCount: number;
  referencedPaths: string[];
};

export async function verifyNhm2PrimaryRunOwnedReferenceClosure(input: {
  projectRoot: string;
  outputDirectory: string;
  rootPaths: readonly string[];
  additionalRootPaths?: readonly string[];
  entries: readonly TheoryRuntimeOutputManifestEntryV1[];
}): Promise<Nhm2PrimaryRunOwnedReferenceClosure> {
  const projectRoot = path.resolve(input.projectRoot);
  const outputDirectory = path.resolve(projectRoot, input.outputDirectory);
  const expectedRootPaths = [...new Set(input.rootPaths)].sort();
  if (
    expectedRootPaths.length !== 9 ||
    expectedRootPaths.some((rootPath) => !rootPath.endsWith(".json"))
  ) {
    throw new Error(
      "Primary run-owned reference closure requires exactly nine JSON evidence roots.",
    );
  }
  const entryByPath = new Map<string, TheoryRuntimeOutputManifestEntryV1>();
  for (const entry of input.entries) {
    if (entryByPath.has(entry.path)) {
      throw new Error(`Primary output manifest duplicates ${entry.path}.`);
    }
    const absolutePath = path.resolve(projectRoot, entry.path);
    const relativeToOutput = path.relative(outputDirectory, absolutePath);
    if (
      relativeToOutput.length === 0 ||
      relativeToOutput.startsWith("..") ||
      path.isAbsolute(relativeToOutput)
    ) {
      throw new Error(
        `Primary output manifest entry escaped its run directory: ${entry.path}.`,
      );
    }
    if (entry.freshness !== "new") {
      throw new Error(`Primary run-owned output is not fresh: ${entry.path}.`);
    }
    entryByPath.set(entry.path, entry);
  }
  for (const rootPath of expectedRootPaths) {
    if (!entryByPath.has(rootPath)) {
      throw new Error(`Primary JSON evidence root is missing: ${rootPath}.`);
    }
  }
  const additionalRootPaths = [
    ...new Set(input.additionalRootPaths ?? []),
  ].sort();
  for (const rootPath of additionalRootPaths) {
    if (!rootPath.endsWith(".json") || !entryByPath.has(rootPath)) {
      throw new Error(
        `Primary supplementary JSON trust root is missing: ${rootPath}.`,
      );
    }
  }

  const referencedPaths = new Set([
    ...expectedRootPaths,
    ...additionalRootPaths,
  ]);
  const queuedPaths = [...referencedPaths];
  const scannedPaths = new Set<string>();

  const admitReference = (candidatePath: unknown, candidateSha256: unknown) => {
    if (typeof candidatePath !== "string" || candidatePath.length === 0) {
      return;
    }
    let absolutePath = path.resolve(projectRoot, candidatePath);
    let relativeToOutput = path.relative(outputDirectory, absolutePath);
    let canonicalPath = normalizeRepoPath(
      path.relative(projectRoot, absolutePath),
    );
    if (
      relativeToOutput.startsWith("..") ||
      path.isAbsolute(relativeToOutput)
    ) {
      const runRelativeAbsolute = path.resolve(outputDirectory, candidatePath);
      const runRelative = path.relative(outputDirectory, runRelativeAbsolute);
      if (
        runRelative.length > 0 &&
        !runRelative.startsWith("..") &&
        !path.isAbsolute(runRelative)
      ) {
        const runRelativeCanonicalPath = normalizeRepoPath(
          path.relative(projectRoot, absolutePath),
        );
        const resolvedRunRelativeCanonicalPath = normalizeRepoPath(
          path.relative(projectRoot, runRelativeAbsolute),
        );
        if (entryByPath.has(resolvedRunRelativeCanonicalPath)) {
          absolutePath = runRelativeAbsolute;
          relativeToOutput = runRelative;
          canonicalPath = resolvedRunRelativeCanonicalPath;
        } else {
          canonicalPath = runRelativeCanonicalPath;
        }
      }
    }
    if (
      relativeToOutput.length === 0 ||
      relativeToOutput.startsWith("..") ||
      path.isAbsolute(relativeToOutput)
    ) {
      return;
    }
    const runRelativePath = normalizeRepoPath(
      path.relative(outputDirectory, absolutePath),
    );
    if (candidatePath !== canonicalPath && candidatePath !== runRelativePath) {
      throw new Error(
        `Primary run-owned artifact reference is not canonical: ${candidatePath}.`,
      );
    }
    const normalizedSha256 =
      typeof candidateSha256 === "string" &&
      candidateSha256.startsWith("sha256:")
        ? candidateSha256.slice("sha256:".length)
        : candidateSha256;
    if (
      typeof normalizedSha256 !== "string" ||
      !/^[a-f0-9]{64}$/.test(normalizedSha256)
    ) {
      throw new Error(
        `Primary run-owned artifact reference lacks an exact SHA-256: ${candidatePath}.`,
      );
    }
    const entry = entryByPath.get(canonicalPath);
    if (entry == null || entry.sha256 !== normalizedSha256) {
      throw new Error(
        `Primary run-owned artifact reference does not match its fresh output manifest entry: ${candidatePath}.`,
      );
    }
    if (!referencedPaths.has(canonicalPath)) {
      referencedPaths.add(canonicalPath);
      queuedPaths.push(canonicalPath);
    }
  };

  const scanReferences = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(scanReferences);
      return;
    }
    if (!isRecord(value)) return;
    admitReference(value.path, value.sha256);
    admitReference(value.ref, value.sha256);
    for (const [key, candidatePath] of Object.entries(value)) {
      if (key.endsWith("Path")) {
        admitReference(candidatePath, value[`${key.slice(0, -4)}Sha256`]);
      }
      scanReferences(candidatePath);
    }
  };

  while (queuedPaths.length > 0) {
    const repoPath = queuedPaths.shift()!;
    if (scannedPaths.has(repoPath)) continue;
    scannedPaths.add(repoPath);
    const entry = entryByPath.get(repoPath);
    if (entry == null) {
      throw new Error(`Primary referenced output is missing: ${repoPath}.`);
    }
    const absolutePath = path.resolve(projectRoot, repoPath);
    const stat = await fs.lstat(absolutePath);
    if (stat.isSymbolicLink() || !stat.isFile() || stat.nlink !== 1) {
      throw new Error(
        `Primary referenced output is not a unique regular file: ${repoPath}.`,
      );
    }
    const bytes = await fs.readFile(absolutePath);
    if (
      bytes.byteLength !== entry.sizeBytes ||
      createHash("sha256").update(bytes).digest("hex") !== entry.sha256
    ) {
      throw new Error(
        `Primary referenced output bytes do not match the output manifest: ${repoPath}.`,
      );
    }
    if (!repoPath.endsWith(".json")) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(bytes.toString("utf8")) as unknown;
    } catch (error) {
      throw new Error(
        `Primary referenced JSON output is malformed (${repoPath}): ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    scanReferences(parsed);
  }

  const unreferenced = [...entryByPath.keys()].filter(
    (repoPath) => !referencedPaths.has(repoPath),
  );
  if (unreferenced.length > 0) {
    throw new Error(
      `Primary output contains unreferenced run-owned files: ${unreferenced.sort().join(", ")}.`,
    );
  }
  return {
    rootCount: 9,
    supplementaryCount: entryByPath.size - 9,
    referencedPaths: [...referencedPaths].sort(),
  };
}

async function validatePrimaryEvidenceFiles(input: {
  projectRoot: string;
  admission: Nhm2TheoryCandidatePlanAdmission;
  entries: TheoryRuntimeOutputManifestEntryV1[];
}): Promise<
  Map<PrimaryEvidenceRole, PrimaryProducerArtifactSummary["disposition"]>
> {
  const entryByPath = new Map(
    input.entries.map((entry) => [entry.path, entry]),
  );
  const dispositions = new Map<
    PrimaryEvidenceRole,
    PrimaryProducerArtifactSummary["disposition"]
  >();
  for (const output of input.admission.evidenceOutputs) {
    const role = output.evidenceRole as PrimaryEvidenceRole;
    const guard = PRIMARY_EVIDENCE_GUARDS[role];
    if (guard == null) {
      throw new Error(
        `Primary evidence role ${output.evidenceRole} has no exact contract guard.`,
      );
    }
    const entry = entryByPath.get(output.outputPath);
    if (entry == null || entry.freshness !== "new") {
      throw new Error(
        `Primary evidence role ${role} is not a fresh run output.`,
      );
    }
    const absolutePath = path.resolve(input.projectRoot, output.outputPath);
    let parsed: unknown;
    try {
      parsed = JSON.parse(await fs.readFile(absolutePath, "utf8")) as unknown;
    } catch (error) {
      throw new Error(
        `Primary evidence role ${role} is not readable JSON: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
    if (!guard(parsed as never)) {
      throw new Error(
        `Primary evidence role ${role} failed its exact contract guard.`,
      );
    }
    if (role === PREDICTION_EVIDENCE_ROLE) {
      const prediction = parsed as {
        readiness: { predictionFreezeReady: boolean };
      };
      dispositions.set(
        role,
        prediction.readiness.predictionFreezeReady ? "ready" : "not_ready",
      );
      continue;
    }
    const status = (parsed as { status: unknown }).status;
    if (status !== "pass" && status !== "blocked" && status !== "fail") {
      throw new Error(
        `Primary evidence role ${role} asserted unauthorized status ${String(status)}.`,
      );
    }
    dispositions.set(role, status);
  }
  if (dispositions.size !== 9) {
    throw new Error(
      "Primary evidence validation did not cover exactly nine roles.",
    );
  }
  return dispositions;
}

function parsePrimaryProducerSummary(input: {
  stdout: string;
  admission: Nhm2TheoryCandidatePlanAdmission;
  execution: TheoryRuntimeExecutionResult;
  entries: TheoryRuntimeOutputManifestEntryV1[];
  fileDispositions: ReadonlyMap<
    PrimaryEvidenceRole,
    PrimaryProducerArtifactSummary["disposition"]
  >;
}): PrimaryProducerSummary {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input.stdout.trim()) as unknown;
  } catch (error) {
    throw new Error(
      `Primary producer stdout is not one complete JSON summary: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (!isRecord(parsed)) {
    throw new Error("Primary producer stdout summary must be an object.");
  }
  const summary = parsed as unknown as PrimaryProducerSummary;
  const plan = input.admission.plan;
  if (
    (summary.status !== "ready" &&
      summary.status !== "not_ready" &&
      summary.status !== "falsified") ||
    summary.planRole !== "primary_numerical" ||
    summary.manifestPath !== input.admission.manifestPath ||
    summary.manifestSha256 !== input.admission.manifestRawSha256 ||
    summary.runtimeId !== plan.runtimeId ||
    summary.requestId !== plan.requestId ||
    summary.runId !== plan.runId ||
    summary.receiptId !== plan.receiptId ||
    summary.outputDirectory !== input.admission.outputDirectory
  ) {
    throw new Error(
      "Primary producer summary does not match the admitted manifest, plan, run, request, receipt, runtime, or output binding.",
    );
  }
  if (
    !canonicalTimestamp(summary.startedAt) ||
    !canonicalTimestamp(summary.completedAt) ||
    !Number.isFinite(summary.durationMs) ||
    summary.durationMs < 0 ||
    Date.parse(summary.completedAt) < Date.parse(summary.startedAt) ||
    !canonicalTimestamp(input.execution.startedAt) ||
    !canonicalTimestamp(input.execution.completedAt) ||
    Date.parse(summary.startedAt) < Date.parse(input.execution.startedAt) ||
    Date.parse(summary.completedAt) > Date.parse(input.execution.completedAt)
  ) {
    throw new Error(
      "Primary producer interval is not constructible inside the outer execution interval.",
    );
  }
  if (!Array.isArray(summary.blockers)) {
    throw new Error("Primary producer blockers must be an array.");
  }
  projectNhm2PrimaryNumericalStatus({
    status: summary.status,
    blockers: summary.blockers,
  });
  const boundary = summary.claimBoundary;
  if (
    !isRecord(boundary) ||
    boundary.diagnosticOnly !== true ||
    boundary.rawEvidenceIntervalEndsBeforeOuterRuntimeReceipt !== true ||
    boundary.historicalAlpha07PackageIsExecutionEvidence !== false ||
    boundary.idealParallelPlateScalarIsAuthority !== false ||
    boundary.experimentReadyTheoryClosureClaimAllowed !== false ||
    boundary.physicalViabilityClaimAllowed !== false ||
    boundary.transportClaimAllowed !== false ||
    boundary.propulsionClaimAllowed !== false ||
    boundary.routeEtaClaimAllowed !== false ||
    boundary.speedAuthorityClaimAllowed !== false
  ) {
    throw new Error(
      "Primary producer summary attempted to widen its claim boundary.",
    );
  }
  if (!Array.isArray(summary.artifacts) || summary.artifacts.length !== 9) {
    throw new Error("Primary producer must summarize exactly nine artifacts.");
  }
  const expectedByRole = new Map<
    string,
    (typeof input.admission.evidenceOutputs)[number]
  >(
    input.admission.evidenceOutputs.map((output) => [
      output.evidenceRole,
      output,
    ]),
  );
  const entryByPath = new Map(
    input.entries.map((entry) => [entry.path, entry]),
  );
  const seenRoles = new Set<string>();
  for (const artifact of summary.artifacts) {
    if (!isRecord(artifact) || typeof artifact.evidenceRole !== "string") {
      throw new Error("Primary producer artifact summary is malformed.");
    }
    const expected = expectedByRole.get(artifact.evidenceRole);
    if (expected == null || seenRoles.has(artifact.evidenceRole)) {
      throw new Error(
        `Primary producer reported an unexpected or duplicate evidence role: ${artifact.evidenceRole}.`,
      );
    }
    seenRoles.add(artifact.evidenceRole);
    const entry = entryByPath.get(artifact.outputPath);
    if (
      artifact.outputPath !== expected.outputPath ||
      artifact.contractVersion !== expected.contractVersion ||
      !/^[a-f0-9]{64}$/.test(artifact.sha256) ||
      entry == null ||
      entry.sha256 !== artifact.sha256 ||
      entry.freshness !== "new"
    ) {
      throw new Error(
        `Primary producer artifact ${artifact.evidenceRole} does not match its admitted fresh output binding.`,
      );
    }
    if (
      artifact.evidenceRole === PREDICTION_EVIDENCE_ROLE
        ? artifact.disposition !== "ready" &&
          artifact.disposition !== "not_ready"
        : artifact.disposition !== "pass" &&
          artifact.disposition !== "blocked" &&
          artifact.disposition !== "fail"
    ) {
      throw new Error(
        `Primary producer artifact ${artifact.evidenceRole} has an unauthorized disposition ${String(artifact.disposition)}.`,
      );
    }
    if (
      input.fileDispositions.get(
        artifact.evidenceRole as PrimaryEvidenceRole,
      ) !== artifact.disposition
    ) {
      throw new Error(
        `Primary producer artifact ${artifact.evidenceRole} stdout disposition does not match its validated file.`,
      );
    }
  }
  if (seenRoles.size !== expectedByRole.size || seenRoles.size !== 9) {
    throw new Error(
      "Primary producer did not cover all nine admitted evidence roles.",
    );
  }
  const derivedStatus = deriveNhm2PrimaryProducerSummaryStatus(
    summary.artifacts,
  );
  if (summary.status !== derivedStatus) {
    throw new Error(
      `Primary producer summary status ${summary.status} is inconsistent with validated artifact dispositions; expected ${derivedStatus}.`,
    );
  }
  return summary;
}

function primaryProducerSummaryFromRawPublication(input: {
  publication: Nhm2PrimaryRawRunPublication;
  admission: Nhm2TheoryCandidatePlanAdmission;
}): PrimaryProducerSummary {
  const artifacts = input.publication.artifacts.map((artifact) => ({
    evidenceRole: artifact.evidenceRole,
    outputPath: artifact.outputPath,
    contractVersion: artifact.contractVersion,
    sha256: artifact.sha256,
    disposition: artifact.disposition,
  })) as PrimaryProducerArtifactSummary[];
  const status = deriveNhm2PrimaryProducerSummaryStatus(artifacts);
  if (status !== input.publication.status) {
    throw new Error(
      "Server-owned raw publication status diverged from its nine compiled roots.",
    );
  }
  return {
    status,
    manifestPath: input.admission.manifestPath,
    manifestSha256: input.admission.manifestRawSha256,
    planRole: "primary_numerical",
    runtimeId: input.admission.plan.runtimeId,
    requestId: input.admission.plan.requestId,
    runId: input.admission.plan.runId,
    receiptId: input.admission.plan.receiptId,
    outputDirectory: input.admission.outputDirectory,
    startedAt: input.publication.startedAt,
    completedAt: input.publication.completedAt,
    durationMs: input.publication.durationMs,
    artifacts,
    blockers: input.publication.blockers,
    claimBoundary: {
      diagnosticOnly: true,
      rawEvidenceIntervalEndsBeforeOuterRuntimeReceipt: true,
      historicalAlpha07PackageIsExecutionEvidence: false,
      idealParallelPlateScalarIsAuthority: false,
      experimentReadyTheoryClosureClaimAllowed: false,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
      routeEtaClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
    },
  };
}

function dispositionGate(
  disposition: PrimaryProducerArtifactSummary["disposition"],
): TheoryRuntimeGateStatus {
  if (disposition === "pass" || disposition === "ready") return "pass";
  if (disposition === "fail") return "fail";
  return "not_ready";
}

function logicalExecution(input: {
  admission: Nhm2TheoryCandidatePlanAdmission;
  execution: TheoryRuntimeExecutionResult;
}) {
  const invocation = input.admission.plan.expectedInvocation;
  return {
    command: invocation.command,
    args: [...invocation.args],
    cwd: invocation.cwd,
    environment: { ...input.admission.resolvedEnvironment },
    outputDirectory: input.admission.outputDirectory,
    outputDirectoryBound:
      input.admission.resolvedEnvironment.NHM2_OUTPUT_DIR ===
      input.admission.outputDirectory,
    exitCode: input.execution.exitCode,
    stdout: input.execution.stdout,
    stderr: input.execution.stderr,
    timedOut: input.execution.timedOut,
    error: input.execution.error,
  };
}

function buildReceipt(input: {
  admission: Nhm2TheoryCandidatePlanAdmission;
  graphId: string;
  badgeIds: string[];
  command: TheoryRuntimeCommandV1;
  execution: TheoryRuntimeExecutionResult;
  stableGitSha: string | null;
  artifactManifest: TheoryRuntimeOutputManifestV1 | null;
  summary: PrimaryProducerSummary | null;
  projectionAssessmentPublication: Nhm2PrimaryComparisonProjectionAssessmentPublication | null;
  finalizationErrors: string[];
  outerLaunchHandlerId: string;
}): TheoryRuntimeReceiptV1 {
  const completed =
    input.execution.exitCode === 0 &&
    !input.execution.timedOut &&
    input.execution.error == null &&
    input.summary != null &&
    input.finalizationErrors.length === 0;
  const summaryByPath = new Map(
    input.summary?.artifacts.map((artifact) => [
      artifact.outputPath,
      artifact,
    ]) ?? [],
  );
  const entries = input.artifactManifest?.entries ?? [];
  const primaryRootPaths = new Set(
    input.admission.evidenceOutputs.map((output) => output.outputPath),
  );
  const primaryEvidenceRootCount = entries.filter((entry) =>
    primaryRootPaths.has(entry.path),
  ).length;
  const processSignals = [
    ...(input.execution.timedOut ? ["runtime_timeout"] : []),
    ...(input.execution.exitCode !== 0 ? ["runtime_execution_failed"] : []),
    ...(input.execution.error != null ? ["runtime_execution_error"] : []),
  ];
  const primaryProjection =
    completed && input.summary != null
      ? projectNhm2PrimaryNumericalStatus({
          status: input.summary.status,
          blockers: input.summary.blockers,
        })
      : null;
  const missingSignals = completed
    ? unique([
        ...(primaryProjection?.missingSignals ?? []),
        "primary_comparison_projection_not_ready",
        "experiment_ready_theory_closure_not_ready",
      ])
    : unique([
        ...processSignals,
        ...(input.finalizationErrors.length > 0
          ? ["runtime_receipt_finalization_failed"]
          : []),
        ...(!input.artifactManifest ? ["runtime_output_manifest_missing"] : []),
        "primary_comparison_projection_not_ready",
        "experiment_ready_theory_closure_not_ready",
      ]);
  const prediction = input.summary?.artifacts.find(
    (artifact) => artifact.evidenceRole === PREDICTION_EVIDENCE_ROLE,
  );
  const bindings = input.admission.manifest.bindings;
  const receipt = buildTheoryRuntimeReceiptV1({
    generatedAt: new Date().toISOString(),
    receiptId: input.admission.plan.receiptId,
    runtimeId: input.admission.plan.runtimeId,
    graphId: input.graphId,
    badgeIds: [...input.badgeIds],
    command: input.admission.plan.expectedInvocation.command,
    args: {
      adapter: "nhm2_theory_candidate_primary_executor",
      outerLaunchHandler: input.outerLaunchHandlerId,
      innerProducerEntrypoint:
        input.admission.plan.expectedInvocation.entrypoint,
      requestId: input.admission.plan.requestId,
      runId: input.admission.plan.runId,
      receiptId: input.admission.plan.receiptId,
      candidateManifestPath: input.admission.manifestPath,
      candidateManifestSha256: input.admission.manifestRawSha256,
      candidateManifestRawSha256: input.admission.manifestRawSha256,
      candidateId: bindings.candidate.candidateId,
      candidateSha256: bindings.candidate.sha256,
      selectedProfileId: bindings.profile.selectedProfileId,
      profileSha256: bindings.profile.sha256,
      chartId: bindings.chart.chartId,
      chartSha256: bindings.chart.sha256,
      atlasId: bindings.atlas.atlasId,
      atlasSha256: bindings.atlas.sha256,
      unitsId: bindings.units.unitsId,
      unitsSha256: bindings.units.sha256,
      normalizationId: bindings.normalization.normalizationId,
      normalizationSha256: bindings.normalization.sha256,
      outputDirectory: input.admission.outputDirectory,
      entrypointCommand: input.admission.plan.expectedInvocation.entrypoint,
      logicalCommand: input.admission.plan.expectedInvocation.command,
      logicalArgsJson: JSON.stringify(
        input.admission.plan.expectedInvocation.args,
      ),
      actualLauncherCommand: input.command.command,
      actualLauncherArgsJson: JSON.stringify(input.command.args),
      actualLauncherBindingsJson: JSON.stringify(
        input.command.launcherBindings ?? [],
      ),
      inheritedProcessEnvironment: input.command.inheritProcessEnv !== false,
      outputManifestPath: input.artifactManifest?.manifestPath ?? null,
    },
    status: completed ? "completed" : "failed",
    outputs: {
      artifacts: entries.map((entry) => entry.path),
      scalars: {
        expectedEvidenceCount: 9,
        primaryEvidenceRootCount,
        supplementaryRunOwnedArtifactCount: Math.max(
          0,
          entries.length - primaryEvidenceRootCount,
        ),
        totalRunOwnedArtifactCount: entries.length,
        freshEvidenceCount: entries.filter((entry) => entry.freshness === "new")
          .length,
        predictionFreezeReady: prediction?.disposition === "ready",
        hermeticDependencyTreeAttested: true,
        runtimeNodeModulesRequired: false,
        hostSpecificDiagnosticRuntimeClosure: true,
        operatingSystemHermeticityAsserted: false,
        nodeRuntimeReproducibilityAsserted: false,
        inheritedProcessEnvironment: input.command.inheritProcessEnv !== false,
        primaryNumericalEvidenceReady:
          primaryProjection?.primaryNumericalReady ?? false,
        primaryNumericalEvidenceFalsified:
          primaryProjection?.primaryNumericalFalsified ?? false,
        primaryComparisonProjectionAssessmentPublished:
          input.projectionAssessmentPublication != null,
        primaryComparisonProjectionReady: false,
        experimentReadyTheoryClosureClaimAllowed: false,
        physicalViabilityClaimAllowed: false,
        transportClaimAllowed: false,
        propulsionClaimAllowed: false,
        routeEtaClaimAllowed: false,
        speedAuthorityClaimAllowed: false,
      },
      units: {},
      gates: {
        runtime_execution: completed
          ? "pass"
          : input.execution.timedOut
            ? "not_ready"
            : "fail",
        runtime_execution_provenance:
          input.stableGitSha != null &&
          canonicalTimestamp(input.execution.startedAt) &&
          canonicalTimestamp(input.execution.completedAt) &&
          input.execution.durationMs != null
            ? "pass"
            : "fail",
        runtime_artifact_freshness:
          completed &&
          entries.length >= 9 &&
          primaryEvidenceRootCount === 9 &&
          entries.every((entry) => entry.freshness === "new")
            ? "pass"
            : "not_ready",
        run_owned_nested_reference_closure: completed ? "pass" : "not_ready",
        primary_evidence_inventory: completed ? "pass" : "not_ready",
        primary_numerical_evidence: primaryProjection?.gate ?? "not_ready",
        primary_comparison_projection: "not_ready",
        experiment_ready_theory_closure: "not_ready",
        prediction_falsifier_freeze:
          prediction == null
            ? "not_ready"
            : dispositionGate(prediction.disposition),
      },
      missingSignals,
      warnings: completed
        ? [
            primaryProjection?.gate === "pass"
              ? "Primary execution produced fresh evidence satisfying the frozen primary numerical lane; independent numerical and formal-kernel evidence are still required for experiment-ready theory closure."
              : primaryProjection?.gate === "fail"
                ? "Primary execution produced fresh evidence that falsified at least one frozen primary numerical requirement; no physical claim follows."
                : "Primary execution produced fresh fail-closed diagnostic evidence, but the primary numerical lane remains not ready.",
            "The immutable standalone ESM bundle, bundled source/dependency closure, exact host Node executable, and isolated explicit environment are attested for this diagnostic run.",
            "All primary JSON evidence roots and any supplementary run-owned arrays or ledgers are fresh, hash-bound, and closed under nested artifact references.",
            "The server-owned primary comparison projection assessment is published as not ready; no projection manifest or projected array was admitted or synthesized.",
            "This host-specific runtime closure does not assert operating-system hermeticity, cross-host Node reproducibility, physical viability, transport, propulsion, route ETA, or certified-speed authority.",
          ]
        : unique([
            input.execution.error ??
              "Primary runtime execution or finalization failed.",
            ...input.finalizationErrors,
            "No claim promotion is allowed from a failed primary execution receipt.",
          ]),
      ...(input.artifactManifest
        ? {
            artifactManifest: input.artifactManifest,
            artifactEvidence: entries.map((entry) => ({
              path: entry.path,
              sha256: entry.sha256,
              freshness: entry.freshness,
              status: summaryByPath.has(entry.path)
                ? dispositionGate(summaryByPath.get(entry.path)!.disposition)
                : ("unknown" as const),
              gates: {
                run_owned_reference_closure: completed ? "pass" : "not_ready",
              },
            })),
          }
        : {}),
    },
    provenance: {
      gitSha: input.stableGitSha,
      startedAt: canonicalTimestamp(input.execution.startedAt)
        ? input.execution.startedAt
        : null,
      completedAt: canonicalTimestamp(input.execution.completedAt)
        ? input.execution.completedAt
        : null,
      durationMs:
        input.execution.durationMs != null &&
        Number.isFinite(input.execution.durationMs) &&
        input.execution.durationMs >= 0
          ? input.execution.durationMs
          : null,
    },
    execution: logicalExecution({
      admission: input.admission,
      execution: input.execution,
    }),
    claimBoundary: {
      currentTier: "diagnostic",
      maximumTier: "reduced_order",
      promotionAllowed: false,
      promotionBlockedBy: unique([
        "experiment_ready_theory_closure_requires_independent_and_formal_evidence",
        "empirical_receipts_required_for_physical_promotion",
        ...missingSignals,
      ]),
    },
  });
  if (!isTheoryRuntimeReceiptV1(receipt)) {
    throw new Error(
      "Primary executor built an invalid theory runtime receipt.",
    );
  }
  return receipt;
}

/**
 * Executes only the manifest-admitted primary candidate plan. The executor owns
 * the process interval and receipt; the child may emit only the fixed raw
 * package, while the server-owned verifier/compiler exclusively publishes the
 * nine governed evidence roots. Historical artifact readers are deliberately
 * not involved.
 */
export async function executeNhm2TheoryCandidatePrimary(
  input: ExecuteNhm2TheoryCandidatePrimaryInput,
  options: {
    spawnExecutor?: TheoryRuntimeSpawnExecutor;
    launchOwnership?: Nhm2TheoryCandidatePrimaryLaunchOwnership;
  } = {},
): Promise<ExecuteNhm2TheoryCandidatePrimaryResult> {
  if (input.execute !== true) {
    throw new Error(
      "Primary theory-candidate execution requires execute: true.",
    );
  }
  const projectRoot = path.resolve(input.projectRoot ?? process.cwd());
  const executionStartsAt = new Date().toISOString();

  // Admission is intentionally the first repository read and the sole source
  // of plan identity, logical invocation, environment, and output bindings.
  const admission = await admitNhm2TheoryCandidatePlan({
    projectRoot,
    candidateManifestPath: input.candidateManifestPath,
    planRole: "primary_numerical",
    executionStartsAt,
    requireCleanSourceTree: true,
  });
  const entrypoint = getTheoryRuntimeEntrypoint(admission.plan.runtimeId);
  if (entrypoint == null) {
    throw new Error(
      `Admitted primary runtime ${admission.plan.runtimeId} is not registered.`,
    );
  }

  const existingRequest = await readTheoryRuntimeRunRequestStatus({
    projectRoot,
    requestId: admission.plan.requestId,
  });
  if (existingRequest != null) {
    throw new Error(
      `Primary request ${admission.plan.requestId} already exists; candidate plan attempts are single-use.`,
    );
  }

  const outputDirectory = path.resolve(projectRoot, admission.outputDirectory);
  await fs.mkdir(outputDirectory, { recursive: true });
  const beforeSnapshot = await snapshotTheoryRuntimeOutput({
    projectRoot,
    outputDirectory,
  });
  if (beforeSnapshot.size !== 0) {
    throw new Error(
      "Admitted primary output snapshot must be initially empty.",
    );
  }
  const beforeCapturedAt = new Date().toISOString();
  const preSpawnSource = await resolveGitSourceState(projectRoot);
  if (
    !preSpawnSource.clean ||
    preSpawnSource.head !== admission.sourceCommitSha.toLowerCase()
  ) {
    throw new Error(
      "Primary source tree changed or became dirty after plan admission.",
    );
  }
  await assertAdmittedInputsCurrent({
    projectRoot,
    admission,
    phase: "pre_spawn",
  });
  const beforeCommitment = await writeTheoryRuntimePreSpawnSnapshotCommitment({
    projectRoot,
    requestId: admission.plan.requestId,
    runtimeId: admission.plan.runtimeId,
    outputDirectory,
    beforeCapturedAt,
    gitSha: preSpawnSource.head,
    sourceTreeSha256: preSpawnSource.sourceTreeSha256,
    worktreeClean: true,
    before: beforeSnapshot,
  });
  const command = await buildLauncherCommand({
    admission,
    projectRoot,
    timeoutMs: input.timeoutMs,
    fullTimeoutMs: entrypoint.timeoutPolicy.fullMs,
  });

  // The immutable pre-spawn commitment is the attempt claim. It is written
  // before the mutable request lifecycle, so an orphaned commitment or a
  // concurrent same-plan launch cannot reset an earlier request to `created`.
  const requestCreatedAt = new Date().toISOString();
  const requestManifest = await createTheoryRuntimeRunRequestManifest({
    runtimeId: admission.plan.runtimeId,
    graphId: THEORY_RUNTIME_WORKSTATION_GRAPH_ID,
    badgeIds: [...entrypoint.ownedBadgeIds],
    args: { candidateManifestPath: admission.manifestPath },
    requestedScope: "full",
    status: options.launchOwnership ? "queued" : "created",
    requestId: admission.plan.requestId,
    projectRoot,
    generatedAt: requestCreatedAt,
  });

  if (options.launchOwnership) {
    await options.launchOwnership.onRequestCreated(requestManifest);
  }

  await updateTheoryRuntimeRunRequestStatus({
    requestId: admission.plan.requestId,
    projectRoot,
    status: "running",
    heartbeat: {
      stage: "running",
      message: `Executing admitted primary plan ${admission.plan.runId}.`,
      progress: null,
    },
  });

  let execution: TheoryRuntimeExecutionResult;
  const spawnStarted = Date.now();
  try {
    await assertLauncherBindingsCurrent(command, "pre_spawn");
    execution = await (options.spawnExecutor ?? executeTheoryRuntimeCommand)(
      command,
    );
  } catch (error) {
    execution = {
      startedAt: new Date(spawnStarted).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - spawnStarted,
      exitCode: null,
      stdout: "",
      stderr: "",
      timedOut: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  const finalizationErrors: string[] = [];
  let stableGitSha: string | null = null;
  try {
    await assertLauncherBindingsCurrent(command, "post_spawn");
  } catch (error) {
    finalizationErrors.push(
      error instanceof Error
        ? error.message
        : "Post-execution launcher binding verification failed.",
    );
  }
  try {
    await assertAdmittedInputsCurrent({
      projectRoot,
      admission,
      phase: "post_spawn",
    });
  } catch (error) {
    finalizationErrors.push(
      error instanceof Error
        ? error.message
        : "Post-execution admitted input verification failed.",
    );
  }
  try {
    const postSpawnSource = await resolveGitSourceState(projectRoot);
    if (
      postSpawnSource.clean &&
      postSpawnSource.head === preSpawnSource.head &&
      postSpawnSource.sourceTreeSha256 === preSpawnSource.sourceTreeSha256
    ) {
      stableGitSha = postSpawnSource.head;
    } else {
      finalizationErrors.push(
        "Repository HEAD or clean source-tree state changed during primary execution.",
      );
    }
  } catch (error) {
    finalizationErrors.push(
      error instanceof Error
        ? error.message
        : "Post-execution Git state could not be resolved.",
    );
  }

  const processSucceeded =
    execution.exitCode === 0 && !execution.timedOut && execution.error == null;
  let rawPublication: Nhm2PrimaryRawRunPublication | null = null;
  let projectionAssessmentPublication: Nhm2PrimaryComparisonProjectionAssessmentPublication | null =
    null;
  if (
    processSucceeded &&
    stableGitSha != null &&
    finalizationErrors.length === 0
  ) {
    const rawManifestPath = path.join(
      outputDirectory,
      NHM2_PRIMARY_RAW_OUTPUT_MANIFEST_FILENAME,
    );
    try {
      const rawManifestStat = await fs.lstat(rawManifestPath);
      if (rawManifestStat.isSymbolicLink() || !rawManifestStat.isFile()) {
        throw new Error("primary_raw_package_manifest_not_regular");
      }
      rawPublication = await compileAndPublishNhm2PrimaryRawRun({
        projectRoot,
        admission,
        command,
        execution,
      });
    } catch (error) {
      const code = (error as NodeJS.ErrnoException)?.code;
      if (code === "ENOENT") {
        finalizationErrors.push("primary_raw_package_missing");
      } else {
        finalizationErrors.push(
          `primary_raw_compilation_failed:${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  }

  if (rawPublication != null) {
    try {
      projectionAssessmentPublication =
        await publishNhm2PrimaryComparisonProjectionAssessment({
          projectRoot,
          admission,
          rawPublication,
        });
    } catch (error) {
      finalizationErrors.push(
        `primary_comparison_projection_assessment_failed:${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  let afterSnapshot: Awaited<
    ReturnType<typeof snapshotTheoryRuntimeOutput>
  > | null = null;
  let entries: TheoryRuntimeOutputManifestEntryV1[] = [];
  let afterCapturedAt = new Date().toISOString();
  try {
    afterSnapshot = await snapshotTheoryRuntimeOutput({
      projectRoot,
      outputDirectory,
    });
    afterCapturedAt = new Date().toISOString();
    entries = classifyTheoryRuntimeArtifacts({
      before: beforeSnapshot,
      after: afterSnapshot,
    });
  } catch (error) {
    finalizationErrors.push(
      error instanceof Error
        ? error.message
        : "Primary output snapshot failed.",
    );
  }

  if (
    !canonicalTimestamp(execution.startedAt) ||
    !canonicalTimestamp(execution.completedAt) ||
    execution.durationMs == null ||
    !Number.isFinite(execution.durationMs) ||
    execution.durationMs < 0 ||
    (canonicalTimestamp(execution.completedAt) &&
      Date.parse(execution.completedAt) < Date.parse(execution.startedAt)) ||
    (canonicalTimestamp(execution.startedAt) &&
      Date.parse(beforeCommitment.committedAt) >
        Date.parse(execution.startedAt)) ||
    (canonicalTimestamp(execution.completedAt) &&
      Date.parse(afterCapturedAt) < Date.parse(execution.completedAt))
  ) {
    finalizationErrors.push(
      "Outer primary execution interval or pre/post snapshot ordering is invalid.",
    );
  }

  let summary: PrimaryProducerSummary | null = null;
  if (processSucceeded && afterSnapshot != null && rawPublication != null) {
    try {
      const inventory = await listOutputInventory({
        projectRoot,
        outputDirectory,
      });
      const expectedPaths = admission.evidenceOutputs
        .map((output) => output.outputPath)
        .sort();
      const entryPaths = entries.map((entry) => entry.path).sort();
      if (
        entries.length < 9 ||
        entries.some((entry) => entry.freshness !== "new") ||
        JSON.stringify(inventory) !== JSON.stringify(entryPaths) ||
        expectedPaths.some((expectedPath) => !entryPaths.includes(expectedPath))
      ) {
        throw new Error(
          "Primary execution must produce all nine fresh, preallocated JSON evidence roots and a complete fresh output inventory.",
        );
      }
      await verifyNhm2PrimaryRunOwnedReferenceClosure({
        projectRoot,
        outputDirectory: admission.outputDirectory,
        rootPaths: expectedPaths,
        additionalRootPaths: [
          rawPublication.rawManifestPath,
          ...(projectionAssessmentPublication?.supplementaryRootPaths ?? []),
        ],
        entries,
      });
      const fileDispositions = await validatePrimaryEvidenceFiles({
        projectRoot,
        admission,
        entries,
      });
      summary = primaryProducerSummaryFromRawPublication({
        publication: rawPublication,
        admission,
      });
      for (const artifact of summary.artifacts) {
        const entry = entries.find(
          (candidate) => candidate.path === artifact.outputPath,
        );
        if (
          entry == null ||
          entry.sha256 !== artifact.sha256 ||
          fileDispositions.get(artifact.evidenceRole as PrimaryEvidenceRole) !==
            artifact.disposition
        ) {
          throw new Error(
            `Server-published ${artifact.evidenceRole} root changed before final receipt construction.`,
          );
        }
      }
    } catch (error) {
      finalizationErrors.push(
        error instanceof Error
          ? error.message
          : "Primary producer summary validation failed.",
      );
    }
  }

  let artifactManifest: TheoryRuntimeOutputManifestV1 | null = null;
  if (
    afterSnapshot != null &&
    canonicalTimestamp(execution.startedAt) &&
    canonicalTimestamp(execution.completedAt)
  ) {
    try {
      artifactManifest = await writeTheoryRuntimeOutputManifest({
        projectRoot,
        outputDirectory,
        requestId: admission.plan.requestId,
        runtimeId: admission.plan.runtimeId,
        gitSha: stableGitSha,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt,
        generatedAt: afterCapturedAt,
        entries,
        freshnessProof: buildTheoryRuntimeFreshnessProof({
          before: beforeSnapshot,
          after: afterSnapshot,
          beforeCapturedAt,
          afterCapturedAt,
          beforeCommitmentPath: beforeCommitment.path,
          beforeCommitmentSha256: beforeCommitment.sha256,
        }),
      });
    } catch (error) {
      finalizationErrors.push(
        error instanceof Error
          ? error.message
          : "Primary output-manifest construction failed.",
      );
    }
  } else {
    finalizationErrors.push(
      "Primary output manifest lacks a complete execution interval.",
    );
  }

  let receiptV1 = buildReceipt({
    admission,
    graphId: THEORY_RUNTIME_WORKSTATION_GRAPH_ID,
    badgeIds: [...entrypoint.ownedBadgeIds],
    command,
    execution,
    stableGitSha,
    artifactManifest,
    summary,
    projectionAssessmentPublication,
    finalizationErrors: unique(finalizationErrors),
    outerLaunchHandlerId:
      options.launchOwnership?.handlerId ?? "direct_executor_library_call/v1",
  });
  if (receiptV1.status === "completed") {
    const filesystem = await verifyTheoryRuntimeReceiptFilesystem({
      projectRoot,
      receipt: receiptV1,
    });
    if (!filesystem.ok) {
      finalizationErrors.push(
        ...filesystem.blockers.map(
          (blocker) => `runtime_receipt_filesystem:${blocker}`,
        ),
      );
      receiptV1 = buildReceipt({
        admission,
        graphId: THEORY_RUNTIME_WORKSTATION_GRAPH_ID,
        badgeIds: [...entrypoint.ownedBadgeIds],
        command,
        execution,
        stableGitSha,
        artifactManifest,
        summary,
        projectionAssessmentPublication,
        finalizationErrors: unique(finalizationErrors),
        outerLaunchHandlerId:
          options.launchOwnership?.handlerId ??
          "direct_executor_library_call/v1",
      });
    }
  }
  const receiptArtifact = await writeTheoryRuntimeReceiptArtifact({
    projectRoot,
    requestId: admission.plan.requestId,
    receipt: receiptV1,
  });
  const terminalStatus =
    receiptV1.status === "completed" ? "completed" : "failed";
  await updateTheoryRuntimeRunRequestStatus({
    requestId: admission.plan.requestId,
    projectRoot,
    status: terminalStatus,
    updatedAt: receiptV1.provenance.completedAt ?? undefined,
    heartbeat: {
      stage: terminalStatus,
      message:
        terminalStatus === "completed"
          ? "Primary process completed with fresh fail-closed diagnostic evidence."
          : (receiptV1.outputs.warnings[0] ?? "Primary execution failed."),
      progress: 1,
    },
  });

  return {
    requestId: admission.plan.requestId,
    runtimeId: admission.plan.runtimeId,
    requestManifestPath: requestManifest.manifestPath,
    command,
    execution,
    receiptV1,
    receiptArtifact,
  };
}
