import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_PREDICTION_FREEZE_CONTRACT_VERSION,
  isNhm2ExperimentReadyTheoryCandidateManifest,
  type Nhm2ExperimentReadyTheoryCandidateExecutionPlanV1,
  type Nhm2ExperimentReadyTheoryCandidateManifestV1,
} from "../../shared/contracts/nhm2-experiment-ready-theory-candidate-manifest.v1";
import type { Nhm2ExperimentReadyTheoryClosureEvidenceId } from "../../shared/contracts/nhm2-experiment-ready-theory-closure.v1";
import {
  buildNhm2FullApparatusSourceTensor,
  isNhm2FullApparatusSourceTensor,
} from "../../shared/contracts/nhm2-full-apparatus-source-tensor.v1";
import {
  buildNhm2SemiclassicalStateRealizability,
  isNhm2SemiclassicalStateRealizability,
} from "../../shared/contracts/nhm2-semiclassical-state-realizability.v1";
import {
  buildNhm2CovariantConservation,
  isNhm2CovariantConservation,
} from "../../shared/contracts/nhm2-covariant-conservation.v1";
import {
  buildNhm2ContinuousObserverOptimizer,
  isNhm2ContinuousObserverOptimizer,
} from "../../shared/contracts/nhm2-continuous-observer-optimizer.v1";
import {
  buildNhm2WorldlineQeiCoverage,
  isNhm2WorldlineQeiCoverage,
} from "../../shared/contracts/nhm2-worldline-qei-coverage.v1";
import {
  buildNhm2DynamicBackreactionStabilityCausality,
  isNhm2DynamicBackreactionStabilityCausality,
} from "../../shared/contracts/nhm2-dynamic-backreaction-stability-causality.v1";
import {
  buildCasimirFiniteTemperatureFiniteGeometryMaxwellStress,
  isCasimirFiniteTemperatureFiniteGeometryMaxwellStress,
} from "../../shared/contracts/casimir-finite-temperature-finite-geometry-maxwell-stress.v1";
import {
  buildNhm2MechanicalSupportControlMargin,
  isNhm2MechanicalSupportControlMargin,
} from "../../shared/contracts/nhm2-mechanical-support-control-margin.v1";
import {
  buildNhm2PredictionFalsifierFreeze,
  isNhm2PredictionFalsifierFreeze,
  type BuildNhm2PredictionFalsifierFreezeInput,
  type Nhm2PredictionFalsifierFreezeV1,
} from "../../shared/contracts/nhm2-prediction-falsifier-freeze.v1";
import {
  NHM2_ALPHA07_HISTORICAL_RUNTIME_ID,
  NHM2_ALPHA07_IMPORT_MANIFEST_PATH,
  NHM2_ALPHA07_SOURCE_COMMIT,
} from "../../shared/theory/nhm2-alpha07-historical-import-governance";

export const NHM2_EXPERIMENT_READY_THEORY_PRIMARY_RUNTIME_ID =
  "nhm2.experiment_ready_theory.primary" as const;
export const NHM2_EXPERIMENT_READY_THEORY_PRIMARY_SCRIPT =
  "warp:full-solve:nhm2:theory-candidate:primary" as const;
export const NHM2_PRIMARY_RAW_SOLVER_SUITE_PRODUCER_MISSING =
  "primary_raw_solver_suite_producer_missing" as const;

const PRIMARY_EVIDENCE_ROLES = [
  "full_apparatus_source_tensor",
  "semiclassical_state",
  "covariant_conservation",
  "continuous_observer_optimizer",
  "worldline_qei",
  "dynamic_backreaction_stability_causality",
  "finite_temperature_finite_geometry_maxwell_stress",
  "mechanical_support_control_margin",
  "prediction_falsifier_freeze",
] as const satisfies readonly Nhm2ExperimentReadyTheoryClosureEvidenceId[];

const HISTORICAL_ALPHA07_PACKAGE_FRAGMENT =
  "artifacts/research/full-solve/profile-campaign-runs/stage1_centerline_alpha_0p7000_observer_compatible_source_campaign_screen_v1";

type PrimaryEvidenceRole = (typeof PRIMARY_EVIDENCE_ROLES)[number];
type JsonRecord = Record<string, unknown>;
export type Nhm2PrimaryPhysicsDisposition = "pass" | "blocked" | "fail";
export type Nhm2PrimaryPredictionDisposition = "ready" | "not_ready";
export type Nhm2PrimaryProducerSummaryStatus =
  "ready" | "not_ready" | "falsified";
type PredictionFreezeSemanticInput = Omit<
  BuildNhm2PredictionFalsifierFreezeInput,
  "generatedAt" | "registrationBinding"
>;

export type RunNhm2ExperimentReadyTheoryPrimaryInput = {
  manifestPath: string;
  workspaceRoot?: string;
  environment?: NodeJS.ProcessEnv;
};

export type RunNhm2ExperimentReadyTheoryPrimaryResult = {
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
  artifacts: Array<{
    evidenceRole: PrimaryEvidenceRole;
    outputPath: string;
    contractVersion: string;
    sha256: string;
    disposition:
      Nhm2PrimaryPhysicsDisposition | Nhm2PrimaryPredictionDisposition;
  }>;
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

/**
 * Derives the primary-lane result from validated artifact dispositions. This
 * function has no evidence authority of its own: callers must first validate
 * the eight typed physics artifacts and the frozen-prediction artifact. It
 * exists to make the terminal-state rule replayable and to prevent either the
 * producer or outer executor from hard-coding a permanently blocked result.
 */
export const deriveNhm2PrimaryProducerSummaryState = (input: {
  physicsDispositions: readonly Nhm2PrimaryPhysicsDisposition[];
  predictionDisposition: Nhm2PrimaryPredictionDisposition;
  blockers: readonly string[];
}): {
  status: Nhm2PrimaryProducerSummaryStatus;
  blockers: string[];
} => {
  if (input.physicsDispositions.length !== 8) {
    throw new Error(
      "Primary producer summary requires exactly eight physics dispositions.",
    );
  }
  if (
    !input.physicsDispositions.every(
      (entry) => entry === "pass" || entry === "blocked" || entry === "fail",
    )
  ) {
    throw new Error("Primary producer summary has an invalid disposition.");
  }
  if (
    !input.blockers.every(
      (blocker) =>
        typeof blocker === "string" &&
        blocker.length > 0 &&
        blocker.trim() === blocker,
    )
  ) {
    throw new Error("Primary producer summary has an invalid blocker.");
  }
  const normalizedBlockers = [...new Set(input.blockers)];
  const status: Nhm2PrimaryProducerSummaryStatus =
    input.physicsDispositions.some((entry) => entry === "fail")
      ? "falsified"
      : input.physicsDispositions.every((entry) => entry === "pass") &&
          input.predictionDisposition === "ready"
        ? "ready"
        : "not_ready";
  if (status === "ready" && normalizedBlockers.length > 0) {
    throw new Error("A ready primary producer summary cannot retain blockers.");
  }
  if (status !== "ready" && normalizedBlockers.length === 0) {
    throw new Error(
      `${status} primary producer summary requires at least one concrete blocker.`,
    );
  }
  return { status, blockers: normalizedBlockers };
};

const isRecord = (value: unknown): value is JsonRecord =>
  value != null && typeof value === "object" && !Array.isArray(value);

const hasExactKeys = (
  value: JsonRecord,
  expected: readonly string[],
): boolean => {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return (
    actual.length === sortedExpected.length &&
    actual.every((key, index) => key === sortedExpected[index])
  );
};

const sha256 = (bytes: Buffer | string): string =>
  createHash("sha256").update(bytes).digest("hex");

const normalizeRepoPath = (value: string): string =>
  value.replace(/\\/g, "/").replace(/^\.\//, "");

const isInside = (root: string, candidate: string): boolean => {
  const relative = path.relative(root, candidate);
  return (
    relative.length === 0 ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
};

const resolveContained = (
  root: string,
  repoPath: string,
  label: string,
): string => {
  const resolved = path.resolve(root, repoPath);
  if (!isInside(root, resolved) || resolved === root) {
    throw new Error(`${label} escaped the workspace root.`);
  }
  return resolved;
};

const jsonBytes = (value: unknown): Buffer =>
  Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8");

const readJson = async (absolutePath: string, label: string) => {
  let bytes: Buffer;
  try {
    bytes = await fs.readFile(absolutePath);
  } catch (error) {
    throw new Error(
      `${label} could not be read: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  try {
    return { bytes, value: JSON.parse(bytes.toString("utf8")) as unknown };
  } catch {
    throw new Error(`${label} is not valid JSON.`);
  }
};

const readPredictionFreezeSeed = async (input: {
  workspaceRoot: string;
  manifest: Nhm2ExperimentReadyTheoryCandidateManifestV1;
}) => {
  const descriptorBinding = input.manifest.bindings.candidate;
  const descriptorPath = resolveContained(
    input.workspaceRoot,
    descriptorBinding.path,
    "Candidate descriptor",
  );
  const descriptor = await readJson(descriptorPath, "Candidate descriptor");
  if (sha256(descriptor.bytes) !== descriptorBinding.sha256) {
    throw new Error(
      "Candidate descriptor raw SHA-256 does not match the manifest binding.",
    );
  }
  if (!isRecord(descriptor.value)) {
    throw new Error("Candidate descriptor must be a JSON object.");
  }
  if (
    typeof descriptor.value.candidateId === "string" &&
    descriptor.value.candidateId !== descriptorBinding.candidateId
  ) {
    throw new Error(
      "Candidate descriptor candidateId does not match the manifest binding.",
    );
  }
  const predictionRef = descriptor.value.predictionFreezeSemanticInput;
  if (!isRecord(predictionRef)) {
    throw new Error(
      "Candidate descriptor is missing predictionFreezeSemanticInput; the primary run cannot invent a post-freeze prediction payload.",
    );
  }
  const predictionPath = predictionRef.path;
  const predictionRawSha256 = predictionRef.sha256;
  const predictionSemanticSha256 = predictionRef.semanticSha256;
  if (
    typeof predictionPath !== "string" ||
    typeof predictionRawSha256 !== "string" ||
    typeof predictionSemanticSha256 !== "string"
  ) {
    throw new Error(
      "Candidate predictionFreezeSemanticInput binding is incomplete.",
    );
  }
  if (
    normalizeRepoPath(predictionPath).includes(
      HISTORICAL_ALPHA07_PACKAGE_FRAGMENT,
    )
  ) {
    throw new Error(
      "The historical alpha=0.7 campaign package is preexisting diagnostic seed material and cannot be used as run-bound prediction-freeze execution evidence.",
    );
  }
  const absolutePredictionPath = resolveContained(
    input.workspaceRoot,
    predictionPath,
    "Prediction-freeze seed",
  );
  const prediction = await readJson(
    absolutePredictionPath,
    "Prediction-freeze semantic input",
  );
  if (sha256(prediction.bytes) !== predictionRawSha256) {
    throw new Error(
      "Prediction-freeze seed raw SHA-256 does not match the candidate descriptor.",
    );
  }
  if (!isRecord(prediction.value)) {
    throw new Error("Prediction-freeze semantic input must be a JSON object.");
  }
  if (
    !hasExactKeys(prediction.value, [
      "artifactId",
      "contractVersion",
      "predictionFreezeContractVersion",
      "semanticSha256",
      "frozenInput",
      "completionRule",
      "historicalSeedBoundary",
      "claimBoundary",
    ]) ||
    prediction.value.artifactId !==
      "nhm2.prediction_falsifier_freeze_semantic_input" ||
    prediction.value.contractVersion !==
      "nhm2_prediction_falsifier_freeze_semantic_input/v1" ||
    prediction.value.predictionFreezeContractVersion !==
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_PREDICTION_FREEZE_CONTRACT_VERSION ||
    prediction.value.semanticSha256 !== predictionSemanticSha256
  ) {
    throw new Error(
      "Prediction-freeze semantic input wrapper identity or semantic digest is invalid.",
    );
  }
  const completionRule = prediction.value.completionRule;
  if (
    !isRecord(completionRule) ||
    !hasExactKeys(completionRule, [
      "generatedAtMustBeInjectedAtOrAfterFrozenAt",
      "registrationBindingMustComeFromPrimaryPlan",
      "candidateManifestRawSha256MustBeResolvedAfterManifestWrite",
      "semanticSha256MustRemainUnchangedAfterEnvelopeInjection",
    ]) ||
    completionRule.generatedAtMustBeInjectedAtOrAfterFrozenAt !== true ||
    completionRule.registrationBindingMustComeFromPrimaryPlan !== true ||
    completionRule.candidateManifestRawSha256MustBeResolvedAfterManifestWrite !==
      true ||
    completionRule.semanticSha256MustRemainUnchangedAfterEnvelopeInjection !==
      true
  ) {
    throw new Error(
      "Prediction-freeze semantic input completionRule is not fail-closed.",
    );
  }
  const historicalBoundary = prediction.value.historicalSeedBoundary;
  if (
    !isRecord(historicalBoundary) ||
    !hasExactKeys(historicalBoundary, [
      "importManifestPath",
      "runtimeId",
      "sourceCommitSha",
      "boundToExecution",
      "artifactFreshness",
      "diagnosticSeedOnly",
    ]) ||
    historicalBoundary.importManifestPath !==
      NHM2_ALPHA07_IMPORT_MANIFEST_PATH ||
    historicalBoundary.runtimeId !== NHM2_ALPHA07_HISTORICAL_RUNTIME_ID ||
    historicalBoundary.sourceCommitSha !== NHM2_ALPHA07_SOURCE_COMMIT ||
    historicalBoundary.boundToExecution !== false ||
    historicalBoundary.artifactFreshness !== "preexisting" ||
    historicalBoundary.diagnosticSeedOnly !== true
  ) {
    throw new Error(
      "Prediction-freeze historicalSeedBoundary must classify the alpha=0.7 import as preexisting diagnostic seed only and unbound to execution.",
    );
  }
  const claimBoundary = prediction.value.claimBoundary;
  if (
    !isRecord(claimBoundary) ||
    !hasExactKeys(claimBoundary, [
      "semanticInputOnly",
      "theoryClosureClaimAllowed",
      "empiricalValidationClaimAllowed",
      "physicalViabilityClaimAllowed",
      "transportClaimAllowed",
      "propulsionClaimAllowed",
      "routeEtaClaimAllowed",
      "speedAuthorityClaimAllowed",
    ]) ||
    claimBoundary.semanticInputOnly !== true ||
    claimBoundary.theoryClosureClaimAllowed !== false ||
    claimBoundary.empiricalValidationClaimAllowed !== false ||
    claimBoundary.physicalViabilityClaimAllowed !== false ||
    claimBoundary.transportClaimAllowed !== false ||
    claimBoundary.propulsionClaimAllowed !== false ||
    claimBoundary.routeEtaClaimAllowed !== false ||
    claimBoundary.speedAuthorityClaimAllowed !== false
  ) {
    throw new Error(
      "Prediction-freeze semantic input claimBoundary is not fail-closed.",
    );
  }
  const frozenInput = prediction.value.frozenInput;
  if (!isRecord(frozenInput)) {
    throw new Error(
      "Prediction-freeze semantic input wrapper is missing frozenInput.",
    );
  }
  for (const forbidden of ["generatedAt", "registrationBinding"]) {
    if (Object.prototype.hasOwnProperty.call(frozenInput, forbidden)) {
      throw new Error(
        `Prediction-freeze frozenInput must not contain ${forbidden}; the run registration envelope is injected after the manifest hash is resolved.`,
      );
    }
  }
  if (
    predictionSemanticSha256 !==
      input.manifest.predictionFreezeCommitment.semanticSha256 ||
    frozenInput.frozenAt !== input.manifest.predictionFreezeCommitment.frozenAt
  ) {
    throw new Error(
      "Prediction-freeze seed does not preserve the manifest's frozen semantic commitment.",
    );
  }
  if (
    frozenInput.selectedProfileId !==
    input.manifest.bindings.profile.selectedProfileId
  ) {
    throw new Error(
      "Prediction-freeze seed selectedProfileId does not match the candidate manifest.",
    );
  }
  return {
    semanticInput: frozenInput as PredictionFreezeSemanticInput,
    semanticSha256: predictionSemanticSha256,
  };
};

const verifyOptionalExecutorEnvironment = (input: {
  environment: NodeJS.ProcessEnv;
  manifestSha256: string;
  plan: Nhm2ExperimentReadyTheoryCandidateExecutionPlanV1;
}) => {
  for (const binding of input.plan.expectedInvocation.environment) {
    const supplied = input.environment[binding.name];
    if (supplied == null) continue;
    const expected =
      binding.valueKind === "candidate_manifest_raw_sha256"
        ? input.manifestSha256
        : binding.value;
    if (supplied !== expected) {
      throw new Error(
        `Executor environment mismatch for ${binding.name}: supplied value does not match the frozen primary plan.`,
      );
    }
  }
};

const ensureOutputDirectoryIsEmptyAndContained = async (input: {
  workspaceRoot: string;
  candidateRoot: string;
  outputDirectory: string;
}): Promise<string> => {
  const outputPath = resolveContained(
    input.workspaceRoot,
    input.outputDirectory,
    "Primary output directory",
  );
  if (
    !isInside(input.candidateRoot, outputPath) ||
    outputPath === input.candidateRoot
  ) {
    throw new Error(
      "Primary output directory must resolve beneath the candidate manifest directory.",
    );
  }

  const relativeSegments = path
    .relative(input.workspaceRoot, outputPath)
    .split(path.sep)
    .filter(Boolean);
  let cursor = input.workspaceRoot;
  for (const segment of relativeSegments) {
    cursor = path.join(cursor, segment);
    try {
      const entry = await fs.lstat(cursor);
      if (entry.isSymbolicLink()) {
        throw new Error(
          "Primary output directory ancestry must not contain symbolic links.",
        );
      }
    } catch (error) {
      if (
        error != null &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        break;
      }
      throw error;
    }
  }

  try {
    const entry = await fs.lstat(outputPath);
    if (!entry.isDirectory() || entry.isSymbolicLink()) {
      throw new Error(
        "Preallocated primary output path must be a real directory.",
      );
    }
    const contents = await fs.readdir(outputPath);
    if (contents.length > 0) {
      throw new Error(
        "Preallocated primary output directory must be initially empty.",
      );
    }
  } catch (error) {
    if (
      error != null &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return outputPath;
    }
    throw error;
  }
  return outputPath;
};

const predictionInputFromSeed = (input: {
  seed: PredictionFreezeSemanticInput;
  manifest: Nhm2ExperimentReadyTheoryCandidateManifestV1;
  manifestPath: string;
  manifestSha256: string;
  plan: Nhm2ExperimentReadyTheoryCandidateExecutionPlanV1;
  generatedAt: string;
}) => ({
  ...input.seed,
  generatedAt: input.generatedAt,
  registrationBinding: {
    candidateId: input.manifest.bindings.candidate.candidateId,
    candidateManifestPath: input.manifestPath,
    candidateManifestSha256: input.manifestSha256,
    runId: input.plan.runId,
    requestId: input.plan.requestId,
    receiptId: input.plan.receiptId,
    runtimeId: input.plan.runtimeId,
    plannedOutputDirectory: input.plan.expectedInvocation.outputDirectory,
  },
});

/**
 * Legacy contract-test scaffold. It constructs blocked governed wrappers and
 * therefore must never be used as the production child now that the server is
 * the sole governed-evidence publisher. Keeping the scaffold test-only
 * preserves validator and binding coverage while the genuine 107-role raw
 * solver-suite producer is implemented.
 */
export async function runNhm2LegacyGovernedPrimaryScaffoldForContractTest(
  input: RunNhm2ExperimentReadyTheoryPrimaryInput,
): Promise<RunNhm2ExperimentReadyTheoryPrimaryResult> {
  const workspaceRoot = path.resolve(input.workspaceRoot ?? process.cwd());
  const temporaryRelative = path.relative(os.tmpdir(), workspaceRoot);
  if (
    process.env.NODE_ENV !== "test" ||
    temporaryRelative.length === 0 ||
    temporaryRelative.startsWith("..") ||
    path.isAbsolute(temporaryRelative) ||
    !["nhm2-primary-", "nhm2-packager-spec-primary-executor-"].some((prefix) =>
      path.basename(workspaceRoot).startsWith(prefix),
    )
  ) {
    throw new Error(
      "legacy_governed_primary_scaffold_forbidden_outside_contract_tests",
    );
  }
  const startMs = Date.now();
  const startedAt = new Date(startMs).toISOString();
  const realWorkspaceRoot = await fs.realpath(workspaceRoot);
  const manifestAbsolutePath = path.isAbsolute(input.manifestPath)
    ? path.resolve(input.manifestPath)
    : path.resolve(workspaceRoot, input.manifestPath);
  if (!isInside(workspaceRoot, manifestAbsolutePath)) {
    throw new Error("Candidate manifest must be inside the workspace root.");
  }
  const manifestRead = await readJson(
    manifestAbsolutePath,
    "Candidate manifest",
  );
  if (!isNhm2ExperimentReadyTheoryCandidateManifest(manifestRead.value)) {
    throw new Error("Candidate manifest failed its v1 raw-artifact validator.");
  }
  const manifest = manifestRead.value;
  const manifestSha256 = sha256(manifestRead.bytes);
  const manifestPath = normalizeRepoPath(
    path.relative(workspaceRoot, manifestAbsolutePath),
  );
  const candidateRoot = path.dirname(manifestAbsolutePath);
  const realCandidateRoot = await fs.realpath(candidateRoot);
  if (!isInside(realWorkspaceRoot, realCandidateRoot)) {
    throw new Error(
      "Candidate manifest directory escaped the real workspace root.",
    );
  }
  if (manifestPath.includes(HISTORICAL_ALPHA07_PACKAGE_FRAGMENT)) {
    throw new Error(
      "The historical alpha=0.7 package cannot be executed as a fresh theory-candidate run.",
    );
  }

  const plan = manifest.executionPlans.find(
    (entry) => entry.planRole === "primary_numerical",
  );
  if (plan == null)
    throw new Error("Candidate manifest has no primary_numerical plan.");
  if (plan.runtimeId !== NHM2_EXPERIMENT_READY_THEORY_PRIMARY_RUNTIME_ID) {
    throw new Error(
      `Primary plan runtimeId must be ${NHM2_EXPERIMENT_READY_THEORY_PRIMARY_RUNTIME_ID}; historical or generic alpha-sweep runtimes are not execution evidence for this candidate.`,
    );
  }
  const expectedArgs = [
    "run",
    "-s",
    NHM2_EXPERIMENT_READY_THEORY_PRIMARY_SCRIPT,
    "--",
    "--candidate-manifest",
    manifestPath,
  ];
  const expectedEntrypoint = `npm run ${NHM2_EXPERIMENT_READY_THEORY_PRIMARY_SCRIPT} -- --candidate-manifest ${manifestPath}`;
  if (
    plan.expectedInvocation.command !== "npm" ||
    plan.expectedInvocation.cwd !== "." ||
    plan.expectedInvocation.entrypoint !== expectedEntrypoint ||
    plan.expectedInvocation.args.length !== expectedArgs.length ||
    !plan.expectedInvocation.args.every(
      (argument, index) => argument === expectedArgs[index],
    )
  ) {
    throw new Error(
      "Primary plan expectedInvocation does not exactly bind the governed primary script and candidate-manifest path.",
    );
  }
  verifyOptionalExecutorEnvironment({
    environment: input.environment ?? process.env,
    manifestSha256,
    plan,
  });

  const primaryOutputs = manifest.expectedEvidenceOutputs.filter((entry) =>
    (PRIMARY_EVIDENCE_ROLES as readonly string[]).includes(entry.evidenceRole),
  );
  if (
    primaryOutputs.length !== PRIMARY_EVIDENCE_ROLES.length ||
    !PRIMARY_EVIDENCE_ROLES.every((role) =>
      primaryOutputs.some((entry) => entry.evidenceRole === role),
    )
  ) {
    throw new Error(
      "Primary plan must preallocate exactly the nine primary evidence roles.",
    );
  }

  const outputAbsolutePath = await ensureOutputDirectoryIsEmptyAndContained({
    workspaceRoot,
    candidateRoot,
    outputDirectory: plan.expectedInvocation.outputDirectory,
  });
  for (const output of primaryOutputs) {
    const absoluteOutput = resolveContained(
      workspaceRoot,
      output.outputPath,
      `Evidence output ${output.evidenceRole}`,
    );
    if (
      !isInside(outputAbsolutePath, absoluteOutput) ||
      absoluteOutput === outputAbsolutePath
    ) {
      throw new Error(
        `Evidence output ${output.evidenceRole} escaped the primary output directory.`,
      );
    }
  }

  const predictionSeed = await readPredictionFreezeSeed({
    workspaceRoot,
    manifest,
  });
  // This is the raw-evidence observation cutoff, captured after every external
  // input/read/containment check. Deterministic JSON envelope construction and
  // file publication follow it; the outer theory-runtime receipt owns actual
  // process completion and therefore encloses this raw-artifact interval.
  const completedMs = Math.max(Date.now(), startMs + 1);
  const completedAt = new Date(completedMs).toISOString();
  const durationMs = completedMs - startMs;
  const ref = (artifactPath: string, artifactSha256: string) => ({
    path: artifactPath,
    sha256: artifactSha256,
  });
  const stateRef = (artifactPath: string, artifactSha256: string) => ({
    ref: artifactPath,
    sha256: `sha256:${artifactSha256}`,
  });
  const manifestRef = ref(manifestPath, manifestSha256);
  const solverRef = ref(plan.solver.path, plan.solver.sha256);
  const environmentRef = ref(
    plan.environmentLock.path,
    plan.environmentLock.sha256,
  );
  const commonBinding = {
    candidateId: manifest.bindings.candidate.candidateId,
    candidateManifestPath: manifestPath,
    candidateManifestSha256: manifestSha256,
    preRunManifestPath: manifestPath,
    preRunManifestSha256: manifestSha256,
    runId: plan.runId,
    requestId: plan.requestId,
    receiptId: plan.receiptId,
    runtimeId: plan.runtimeId,
    plannedOutputDirectory: plan.expectedInvocation.outputDirectory,
    laneId: manifest.laneId,
    selectedProfileId: manifest.bindings.profile.selectedProfileId,
    chartId: manifest.bindings.chart.chartId,
    atlasPath: manifest.bindings.atlas.path,
    atlasSha256: manifest.bindings.atlas.sha256,
    unitsPath: manifest.bindings.units.path,
    unitsSha256: manifest.bindings.units.sha256,
    normalizationPath: manifest.bindings.normalization.path,
    normalizationSha256: manifest.bindings.normalization.sha256,
    gitSha: plan.sourceCommitSha,
  } as const;
  const numericPolicyBinding = {
    numericPolicySetPath: manifest.numericCheckPolicySet.artifactPath,
    numericPolicySetRawSha256: manifest.numericCheckPolicySet.artifactRawSha256,
    numericPolicySetSemanticSha256:
      manifest.numericCheckPolicySet.semanticSha256,
  };
  const fullProvenance = {
    producerId: "nhm2-experiment-ready-theory-primary-producer",
    implementationId: plan.solver.implementationId,
    solverId: plan.solver.solverId,
    solverVersion: plan.solver.solverVersion,
    solver: solverRef,
    environment: environmentRef,
    invocation: { path: null, sha256: null },
    command: plan.expectedInvocation.command,
    argv: [...plan.expectedInvocation.args],
    workingDirectory: plan.expectedInvocation.cwd,
    inputManifest: manifestRef,
    runId: plan.runId,
    requestId: plan.requestId,
    receiptId: plan.receiptId,
    runtimeId: plan.runtimeId,
    gitSha: plan.sourceCommitSha,
    startedAt,
    completedAt,
    durationMs,
    deterministicSeed: plan.deterministicSeedPolicy,
    runSpecificOutput: true,
  };

  const outputByRole = new Map(
    primaryOutputs.map((entry) => [
      entry.evidenceRole as PrimaryEvidenceRole,
      entry,
    ]),
  );
  const outputFor = (role: PrimaryEvidenceRole) => {
    const output = outputByRole.get(role);
    if (output == null)
      throw new Error(`Missing preallocated output for ${role}.`);
    return output;
  };
  const built = new Map<PrimaryEvidenceRole, unknown>();
  const bytes = new Map<PrimaryEvidenceRole, Buffer>();
  const add = (role: PrimaryEvidenceRole, artifact: unknown) => {
    built.set(role, artifact);
    bytes.set(role, jsonBytes(artifact));
  };
  const digestFor = (role: PrimaryEvidenceRole): string => {
    const artifactBytes = bytes.get(role);
    if (artifactBytes == null) throw new Error(`No bytes built for ${role}.`);
    return sha256(artifactBytes);
  };

  const fullTensor = buildNhm2FullApparatusSourceTensor({
    generatedAt: completedAt,
    identity: {
      candidateId: commonBinding.candidateId,
      candidateManifestSha256: manifestSha256,
      preRunManifest: manifestRef,
      laneId: manifest.laneId,
      runId: plan.runId,
      requestId: plan.requestId,
      receiptId: plan.receiptId,
      runtimeId: plan.runtimeId,
      selectedProfileId: commonBinding.selectedProfileId,
      selectedProfile: ref(
        manifest.bindings.profile.path,
        manifest.bindings.profile.sha256,
      ),
      chartId: commonBinding.chartId,
      atlas: ref(manifest.bindings.atlas.path, manifest.bindings.atlas.sha256),
      units: ref(manifest.bindings.units.path, manifest.bindings.units.sha256),
      normalization: ref(
        manifest.bindings.normalization.path,
        manifest.bindings.normalization.sha256,
      ),
      gitSha: plan.sourceCommitSha,
    },
    sourceProvenanceDag: {
      auditMethod:
        "Fresh-run source arrays are absent; the preexisting alpha=0.7 diagnostic package was not admitted as execution evidence.",
      sourceRootCount: 0,
      metricTargetDependencyCount: 0,
      forbiddenTargetEchoCount: 0,
      metricTargetInputsUsed: [],
    },
    provenance: fullProvenance,
  });
  if (!isNhm2FullApparatusSourceTensor(fullTensor)) {
    throw new Error("Built full-apparatus source tensor failed validation.");
  }
  add("full_apparatus_source_tensor", fullTensor);
  const fullOutput = outputFor("full_apparatus_source_tensor");
  const fullOutputRef = ref(
    fullOutput.outputPath,
    digestFor("full_apparatus_source_tensor"),
  );

  const semiclassical = buildNhm2SemiclassicalStateRealizability({
    generatedAt: completedAt,
    laneId: manifest.laneId,
    selectedProfileId: commonBinding.selectedProfileId,
    runId: plan.runId,
    provenance: {
      producer: fullProvenance.producerId,
      producerVersion: plan.solver.solverVersion,
      gitSha: plan.sourceCommitSha,
      solver: stateRef(plan.solver.path, plan.solver.sha256),
      inputManifest: stateRef(manifestPath, manifestSha256),
      outputDirectory: plan.expectedInvocation.outputDirectory,
      startedAt,
      completedAt,
      runSpecificOutput: true,
    },
  });
  if (!isNhm2SemiclassicalStateRealizability(semiclassical)) {
    throw new Error("Built semiclassical-state artifact failed validation.");
  }
  add("semiclassical_state", semiclassical);
  const semiclassicalOutput = outputFor("semiclassical_state");

  const conservation = buildNhm2CovariantConservation({
    generatedAt: completedAt,
    binding: commonBinding,
    sourceBinding: {
      sourceContractVersion: fullTensor.contractVersion,
      sourceEvidence: fullOutputRef,
      candidateId: commonBinding.candidateId,
      candidateManifestSha256: manifestSha256,
      runId: plan.runId,
      chartId: commonBinding.chartId,
    },
    provenance: {
      producerId: fullProvenance.producerId,
      producerVersion: plan.solver.solverVersion,
      solverId: plan.solver.solverId,
      solverVersion: plan.solver.solverVersion,
      solver: solverRef,
      environment: environmentRef,
      inputManifest: manifestRef,
      startedAt,
      completedAt,
      runSpecificOutput: true,
    },
  });
  if (!isNhm2CovariantConservation(conservation)) {
    throw new Error("Built covariant-conservation artifact failed validation.");
  }
  add("covariant_conservation", conservation);

  const continuousObserver = buildNhm2ContinuousObserverOptimizer({
    generatedAt: completedAt,
    identity: {
      candidateId: commonBinding.candidateId,
      candidateManifestSha256: manifestSha256,
      preRunManifest: manifestRef,
      laneId: manifest.laneId,
      runId: plan.runId,
      requestId: plan.requestId,
      receiptId: plan.receiptId,
      selectedProfileId: commonBinding.selectedProfileId,
      chartId: commonBinding.chartId,
      atlas: ref(manifest.bindings.atlas.path, manifest.bindings.atlas.sha256),
      units: ref(manifest.bindings.units.path, manifest.bindings.units.sha256),
      normalization: ref(
        manifest.bindings.normalization.path,
        manifest.bindings.normalization.sha256,
      ),
      gitSha: plan.sourceCommitSha,
    },
    sourceBinding: {
      sourceContractVersion: fullTensor.contractVersion,
      sourceEvidence: fullOutputRef,
      candidateId: commonBinding.candidateId,
      candidateManifestSha256: manifestSha256,
      runId: plan.runId,
      chartId: commonBinding.chartId,
    },
    provenance: {
      ...fullProvenance,
      outputDirectory: plan.expectedInvocation.outputDirectory,
    },
  });
  if (!isNhm2ContinuousObserverOptimizer(continuousObserver)) {
    throw new Error("Built continuous-observer artifact failed validation.");
  }
  add("continuous_observer_optimizer", continuousObserver);

  const qei = buildNhm2WorldlineQeiCoverage({
    generatedAt: completedAt,
    identity: {
      candidateId: commonBinding.candidateId,
      candidateManifestSha256: manifestSha256,
      preRunManifest: stateRef(manifestPath, manifestSha256),
      laneId: manifest.laneId,
      runId: plan.runId,
      requestId: plan.requestId,
      receiptId: plan.receiptId,
      selectedProfileId: commonBinding.selectedProfileId,
      chartId: commonBinding.chartId,
      atlas: stateRef(
        manifest.bindings.atlas.path,
        manifest.bindings.atlas.sha256,
      ),
      units: stateRef(
        manifest.bindings.units.path,
        manifest.bindings.units.sha256,
      ),
      normalization: stateRef(
        manifest.bindings.normalization.path,
        manifest.bindings.normalization.sha256,
      ),
      gitSha: plan.sourceCommitSha,
    },
    stateBinding: {
      semiclassicalReceipt: stateRef(
        semiclassicalOutput.outputPath,
        digestFor("semiclassical_state"),
      ),
    },
    provenance: {
      ...fullProvenance,
      solver: stateRef(plan.solver.path, plan.solver.sha256),
      environment: stateRef(
        plan.environmentLock.path,
        plan.environmentLock.sha256,
      ),
      inputManifest: stateRef(manifestPath, manifestSha256),
      outputDirectory: plan.expectedInvocation.outputDirectory,
    },
  });
  if (!isNhm2WorldlineQeiCoverage(qei)) {
    throw new Error("Built worldline-QEI artifact failed validation.");
  }
  add("worldline_qei", qei);

  const dynamic = buildNhm2DynamicBackreactionStabilityCausality({
    generatedAt: completedAt,
    binding: commonBinding,
    provenance: {
      producerId: fullProvenance.producerId,
      producerVersion: plan.solver.solverVersion,
      solverId: plan.solver.solverId,
      solverVersion: plan.solver.solverVersion,
      solver: solverRef,
      environment: environmentRef,
      inputManifest: manifestRef,
      startedAt,
      completedAt,
      runSpecificOutput: true,
    },
  });
  if (!isNhm2DynamicBackreactionStabilityCausality(dynamic)) {
    throw new Error("Built dynamics/backreaction artifact failed validation.");
  }
  add("dynamic_backreaction_stability_causality", dynamic);

  const maxwellStress =
    buildCasimirFiniteTemperatureFiniteGeometryMaxwellStress({
      generatedAt: completedAt,
      binding: { ...commonBinding, ...numericPolicyBinding },
      authority: {
        primaryAuthority: null,
        idealParallelPlateUsedAsAuthority: false,
        idealParallelPlateRole: "not_used",
      },
      provenance: fullProvenance,
    });
  if (!isCasimirFiniteTemperatureFiniteGeometryMaxwellStress(maxwellStress)) {
    throw new Error(
      "Built finite-geometry Maxwell-stress artifact failed validation.",
    );
  }
  add("finite_temperature_finite_geometry_maxwell_stress", maxwellStress);
  const maxwellOutput = outputFor(
    "finite_temperature_finite_geometry_maxwell_stress",
  );

  const mechanical = buildNhm2MechanicalSupportControlMargin({
    generatedAt: completedAt,
    binding: { ...commonBinding, ...numericPolicyBinding },
    forceGradientImport: {
      sourceContractVersion: maxwellStress.contractVersion,
      sourceEvidence: ref(
        maxwellOutput.outputPath,
        digestFor("finite_temperature_finite_geometry_maxwell_stress"),
      ),
      sourceCandidateId: commonBinding.candidateId,
      sourceCandidateManifestSha256: manifestSha256,
      sourceRunId: plan.runId,
      idealParallelPlateFallbackUsed: false,
    },
    provenance: fullProvenance,
  });
  if (!isNhm2MechanicalSupportControlMargin(mechanical)) {
    throw new Error(
      "Built mechanical support/control artifact failed validation.",
    );
  }
  add("mechanical_support_control_margin", mechanical);

  const predictionFreeze = buildNhm2PredictionFalsifierFreeze(
    predictionInputFromSeed({
      seed: predictionSeed.semanticInput,
      manifest,
      manifestPath,
      manifestSha256,
      plan,
      generatedAt: completedAt,
    }),
  );
  if (!isNhm2PredictionFalsifierFreeze(predictionFreeze)) {
    throw new Error("Rebound prediction-freeze artifact failed validation.");
  }
  if (
    predictionFreeze.semanticSha256 !==
      manifest.predictionFreezeCommitment.semanticSha256 ||
    predictionFreeze.semanticSha256 !== predictionSeed.semanticSha256
  ) {
    throw new Error(
      "Rebinding the prediction-freeze registration envelope changed the frozen scientific semantic digest.",
    );
  }
  add("prediction_falsifier_freeze", predictionFreeze);

  const physicsArtifacts = [
    { role: "full_apparatus_source_tensor", artifact: fullTensor },
    { role: "semiclassical_state", artifact: semiclassical },
    { role: "covariant_conservation", artifact: conservation },
    { role: "continuous_observer_optimizer", artifact: continuousObserver },
    { role: "worldline_qei", artifact: qei },
    {
      role: "dynamic_backreaction_stability_causality",
      artifact: dynamic,
    },
    {
      role: "finite_temperature_finite_geometry_maxwell_stress",
      artifact: maxwellStress,
    },
    { role: "mechanical_support_control_margin", artifact: mechanical },
  ] as const;

  await fs.mkdir(outputAbsolutePath, { recursive: true });
  for (const role of PRIMARY_EVIDENCE_ROLES) {
    const output = outputFor(role);
    const absoluteOutput = resolveContained(
      workspaceRoot,
      output.outputPath,
      `Evidence output ${role}`,
    );
    await fs.mkdir(path.dirname(absoluteOutput), { recursive: true });
    const artifactBytes = bytes.get(role);
    if (artifactBytes == null)
      throw new Error(`No serialized artifact for ${role}.`);
    await fs.writeFile(absoluteOutput, artifactBytes, { flag: "wx" });
  }

  const artifacts = PRIMARY_EVIDENCE_ROLES.map((role) => {
    const artifact = built.get(role) as
      | { contractVersion: string; status: Nhm2PrimaryPhysicsDisposition }
      | Nhm2PredictionFalsifierFreezeV1;
    const disposition =
      role === "prediction_falsifier_freeze"
        ? "readiness" in artifact && artifact.readiness.predictionFreezeReady
          ? ("ready" as const)
          : ("not_ready" as const)
        : "status" in artifact
          ? artifact.status
          : null;
    if (disposition == null) {
      throw new Error(`${role} was not fail-closed.`);
    }
    return {
      evidenceRole: role,
      outputPath: outputFor(role).outputPath,
      contractVersion: artifact.contractVersion,
      sha256: digestFor(role),
      disposition,
    };
  });

  const predictionDisposition: Nhm2PrimaryPredictionDisposition =
    predictionFreeze.readiness.predictionFreezeReady ? "ready" : "not_ready";
  const summaryState = deriveNhm2PrimaryProducerSummaryState({
    physicsDispositions: physicsArtifacts.map(
      ({ artifact }) => artifact.status,
    ),
    predictionDisposition,
    blockers: [
      ...physicsArtifacts.flatMap(({ role, artifact }) =>
        artifact.blockers.length > 0 ? [`${role}:${artifact.blockers[0]}`] : [],
      ),
      ...(predictionFreeze.readiness.blockers.length > 0
        ? [
            `prediction_falsifier_freeze:${predictionFreeze.readiness.blockers[0]}`,
          ]
        : []),
    ],
  });

  return {
    status: summaryState.status,
    manifestPath,
    manifestSha256,
    planRole: "primary_numerical",
    runtimeId: plan.runtimeId,
    requestId: plan.requestId,
    runId: plan.runId,
    receiptId: plan.receiptId,
    outputDirectory: plan.expectedInvocation.outputDirectory,
    startedAt,
    completedAt,
    durationMs,
    artifacts,
    blockers: summaryState.blockers,
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

/**
 * Production primary child authority boundary.
 *
 * The former implementation directly authored the nine governed evidence
 * roots. The dedicated server executor now accepts only a fresh primitive raw
 * package and exclusively compiles/publishes those roots after filesystem
 * replay. Until a real solver-suite producer emits that package, fail before
 * touching the run directory rather than translating or synthesizing data.
 */
export async function runNhm2ExperimentReadyTheoryPrimary(
  _input: RunNhm2ExperimentReadyTheoryPrimaryInput,
): Promise<RunNhm2ExperimentReadyTheoryPrimaryResult> {
  throw new Error(NHM2_PRIMARY_RAW_SOLVER_SUITE_PRODUCER_MISSING);
}

const parseCliArgs = (argv: string[]): { manifestPath: string } => {
  let manifestPath: string | null = null;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--candidate-manifest") {
      manifestPath = argv[++index] ?? null;
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }
  if (manifestPath == null || manifestPath.trim().length === 0) {
    throw new Error("--candidate-manifest is required.");
  }
  return { manifestPath };
};

async function main(): Promise<void> {
  const args = parseCliArgs(process.argv.slice(2));
  const result = await runNhm2ExperimentReadyTheoryPrimary({
    manifestPath: args.manifestPath,
  });
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

const invokedPath = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : null;
if (invokedPath === import.meta.url) {
  main().catch((error) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
}
