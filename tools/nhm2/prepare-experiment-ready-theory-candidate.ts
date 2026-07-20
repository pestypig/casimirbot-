import { createHash, randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import {
  build as buildEsbuild,
  version as esbuildVersion,
  type Metafile,
} from "esbuild";

import {
  NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_EXECUTION_PLAN_ROLES,
  NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_REQUIRED_EVIDENCE_ROLES,
  NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_NUMERIC_POLICY_SET_ARTIFACT_ID,
  NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_NUMERIC_POLICY_SET_CONTRACT_VERSION,
  NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_PREDICTION_FREEZE_CONTRACT_VERSION,
  NHM2_EXPERIMENT_READY_THEORY_FORMAL_NPM_SCRIPT,
  NHM2_EXPERIMENT_READY_THEORY_FORMAL_PRESEAL_DIRECTORY_NAME,
  buildNhm2ExperimentReadyTheoryCandidateManifest,
  buildNhm2ExperimentReadyTheoryCandidateNumericPolicySetArtifact,
  isNhm2ExperimentReadyTheoryCandidateManifest,
  nhm2ExperimentReadyTheoryFormalInvocation,
  nhm2ExperimentReadyTheoryCandidateReceiptIdForRequest,
  type Nhm2ExperimentReadyTheoryCandidateBindingsV1,
  type Nhm2ExperimentReadyTheoryCandidateExecutionPlanRole,
  type Nhm2ExperimentReadyTheoryCandidateExecutionPlanV1,
  type Nhm2ExperimentReadyTheoryCandidateHashedBindingV1,
  type Nhm2ExperimentReadyTheoryCandidateManifestV1,
} from "../../shared/contracts/nhm2-experiment-ready-theory-candidate-manifest.v1";
import { NHM2_EXPERIMENT_READY_THEORY_CLOSURE_EVIDENCE_CONTRACT_VERSIONS } from "../../shared/contracts/nhm2-experiment-ready-theory-closure.v1";
import {
  NHM2_FORMAL_PRODUCER_BUNDLE_ARTIFACT_ID,
  NHM2_FORMAL_PRODUCER_BUNDLE_BUILD_ARTIFACT_ID,
  NHM2_FORMAL_PRODUCER_BUNDLE_BUILD_CONTRACT_VERSION,
  NHM2_FORMAL_PRODUCER_BUNDLE_BUILD_OPTIONS,
  NHM2_FORMAL_PRODUCER_BUNDLE_SCHEMA_VERSION,
  computeNhm2FormalProducerBundleSourceSnapshotSha256,
  isNhm2FormalProducerBundleBuildMetadata,
  sha256Nhm2FormalProducerBundleBuildValue,
  type Nhm2FormalProducerBundleBuildInputV1,
  type Nhm2FormalProducerBundleBuildMetadataV1,
  type Nhm2FormalProducerBundleRefV1,
} from "../../shared/contracts/nhm2-formal-producer-bundle.v1";
import {
  NHM2_PRIMARY_PRODUCER_BUNDLE_ARTIFACT_ID,
  NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_ARTIFACT_ID,
  NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_CONTRACT_VERSION,
  NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_OPTIONS,
  NHM2_PRIMARY_PRODUCER_BUNDLE_SCHEMA_VERSION,
  computeNhm2PrimaryProducerBundleSourceSnapshotSha256,
  isNhm2PrimaryProducerBundleBuildMetadata,
  sha256Nhm2PrimaryProducerBundleBuildValue,
  type Nhm2PrimaryProducerBundleBuildInputV1,
  type Nhm2PrimaryProducerBundleBuildMetadataV1,
  type Nhm2PrimaryProducerBundleRefV1,
} from "../../shared/contracts/nhm2-primary-producer-bundle.v1";
import {
  NHM2_PREDICTION_FREEZE_REQUIRED_OBSERVABLE_IDS,
  NHM2_PREDICTION_FREEZE_REQUIRED_RECEIPT_IDS,
  buildNhm2PredictionFalsifierFreeze,
  type BuildNhm2PredictionFalsifierFreezeInput,
  type Nhm2PredictionFreezeHashedArtifactRefV1,
} from "../../shared/contracts/nhm2-prediction-falsifier-freeze.v1";
import {
  NHM2_ALPHA07_HISTORICAL_RUNTIME_ID,
  NHM2_ALPHA07_IMPORT_MANIFEST_PATH,
  NHM2_ALPHA07_PACKAGE_DIRECTORY,
  NHM2_ALPHA07_PROFILE_ID,
  NHM2_ALPHA07_SOURCE_COMMIT,
} from "../../shared/theory/nhm2-alpha07-historical-import-governance";
import { validateNhm2Alpha07HistoricalImportManifest } from "./govern-alpha07-historical-import";

const execFileAsync = promisify(execFile);

export const NHM2_EXPERIMENT_READY_THEORY_PACKAGER_SOURCE_PATHS = [
  "formal/lean/lake-manifest.json",
  "formal/lean/lakefile.lean",
  "formal/lean/lean-toolchain",
  "formal/lean/NHM2Formal.lean",
  "formal/lean/NHM2Formal/Certificate.lean",
  "formal/lean/NHM2Formal/ClaimBoundary.lean",
  "formal/lean/NHM2Formal/ExperimentReadyClaimLocks.lean",
  "formal/lean/NHM2Formal/ExperimentReadyReplayDriver.lean",
  "formal/lean/NHM2Formal/Generated/CurrentCampaignCertificate.lean",
  "scripts/run-lean-lake-build.mjs",
  "server/services/theory/nhm2-calculix-mechanics-support-control-external-plan.ts",
  "server/services/theory/nhm2-experiment-ready-theory-closure-evaluator.ts",
  "server/services/theory/nhm2-external-numerical-kernel-executor.ts",
  "server/services/theory/nhm2-formal-kernel-executor.ts",
  "server/services/theory/nhm2-formal-approved-toolchain-policy-verifier.ts",
  "server/services/theory/nhm2-formal-outer-observation-evidence-adapter.ts",
  "server/services/theory/nhm2-formal-producer-bundle-admission.ts",
  "server/services/theory/nhm2-formal-runtime-executor.ts",
  "server/services/theory/nhm2-formal-runtime-plan-admission.ts",
  "server/services/theory/nhm2-independent-numerical-replication-content-assessor.ts",
  "server/services/theory/nhm2-independent-numerical-replication-executor.ts",
  "server/services/theory/nhm2-independent-runtime-plan-admission.ts",
  "server/services/theory/nhm2-prediction-bootstrap-filesystem-verifier.ts",
  "server/services/theory/nhm2-prediction-run1-bootstrap-compiler.ts",
  "server/services/theory/nhm2-primary-comparison-projection-assessor.ts",
  "server/services/theory/nhm2-primary-comparison-projection-finalizer.ts",
  "server/services/theory/nhm2-primary-raw-experiment-ready-evidence-compiler.ts",
  "server/services/theory/nhm2-primary-raw-gr-content-replay.ts",
  "server/services/theory/nhm2-primary-raw-material-dynamics-content-replay.ts",
  "server/services/theory/nhm2-primary-raw-output-filesystem-verifier.ts",
  "server/services/theory/nhm2-primary-raw-run-publisher.ts",
  "server/services/theory/nhm2-qei-feasibility-frontier-evaluator.ts",
  "server/services/theory/nhm2-scuff-em-executor-receipt-admission.ts",
  "server/services/theory/nhm2-scuff-em-force-sweep-external-plan.ts",
  "server/services/theory/nhm2-scuff-em-force-sweep-partial-content-replay.ts",
  "server/services/theory/nhm2-theory-candidate-plan-admission.ts",
  "server/services/theory/nhm2-theory-candidate-primary-executor.ts",
  "server/services/theory/nhm2-warpax-frame-free-external-plan.ts",
  "server/services/theory/runtime-jobs/nhm2-primary-runtime-dispatch.ts",
  "server/services/theory/theory-runtime-receipt-filesystem-verifier.ts",
  "server/services/theory/theory-runtime-receipt-store.ts",
  "tools/nhm2/enroll-formal-approved-toolchain-policy.ts",
  "tools/nhm2/prepare-experiment-ready-theory-candidate.ts",
  "tools/nhm2/evaluate-qei-feasibility-frontier.ts",
  "tools/nhm2/preseal-experiment-ready-theory-formal-run.ts",
  "tools/nhm2/run-experiment-ready-theory-formal.ts",
  "tools/nhm2/run-experiment-ready-theory-formal-candidate.ts",
  "tools/nhm2/warpax_frame_free_v1_3_driver.py",
  "tools/nhm2/govern-alpha07-historical-import.ts",
  "shared/theory/nhm2-alpha07-historical-import-governance.ts",
  "shared/contracts/nhm2-experiment-ready-theory-candidate-manifest.v1.ts",
  "shared/contracts/nhm2-experiment-ready-theory-closure.v1.ts",
  "shared/contracts/nhm2-formal-approved-toolchain-policy.v1.ts",
  "shared/contracts/nhm2-formal-kernel-replay-manifest.v1.ts",
  "shared/contracts/nhm2-prediction-bootstrap-freeze.v1.ts",
  "shared/contracts/nhm2-prediction-falsifier-freeze.v1.ts",
  "shared/contracts/nhm2-prediction-run1-bootstrap.v2.ts",
  "shared/contracts/nhm2-numerical-observable-prediction.v1.ts",
  "shared/contracts/nhm2-primary-raw-content-policy.v1.ts",
  "shared/contracts/nhm2-primary-raw-output-manifest.v1.ts",
  "shared/contracts/nhm2-primary-raw-solver-suite-enrollment.v1.ts",
  "shared/contracts/nhm2-formal-producer-bundle.v1.ts",
  "shared/contracts/nhm2-independent-field-array-manifest.v1.ts",
  "shared/contracts/nhm2-independent-numerical-execution-descriptor.v1.ts",
  "shared/contracts/nhm2-independent-numerical-replication.v1.ts",
  "shared/contracts/nhm2-primary-producer-bundle.v1.ts",
  "shared/contracts/nhm2-primary-comparison-projection.v1.ts",
  "shared/contracts/nhm2-qei-feasibility-frontier.v1.ts",
  "shared/contracts/nhm2-experiment-facing-theory-roadmap.v1.ts",
  "shared/contracts/theory-runtime-receipt.v1.ts",
  "shared/contracts/theory-runtime-entrypoint.v1.ts",
  "shared/contracts/theory-runtime-math-trace.v1.ts",
  "shared/contracts/scientific-calculator-step-schema.v1.ts",
] as const;

export const NHM2_EXPERIMENT_READY_THEORY_PRIMARY_BUNDLE_SOURCE_PATHS = [
  "shared/contracts/casimir-finite-temperature-finite-geometry-maxwell-stress.v1.ts",
  "shared/contracts/nhm2-continuous-observer-optimizer.v1.ts",
  "shared/contracts/nhm2-covariant-conservation.v1.ts",
  "shared/contracts/nhm2-dynamic-backreaction-stability-causality.v1.ts",
  "shared/contracts/nhm2-experiment-facing-theory-roadmap.v1.ts",
  "shared/contracts/nhm2-experiment-ready-theory-candidate-manifest.v1.ts",
  "shared/contracts/nhm2-experiment-ready-theory-closure.v1.ts",
  "shared/contracts/nhm2-full-apparatus-source-tensor.v1.ts",
  "shared/contracts/nhm2-mechanical-support-control-margin.v1.ts",
  "shared/contracts/nhm2-prediction-falsifier-freeze.v1.ts",
  "shared/contracts/nhm2-semiclassical-state-realizability.v1.ts",
  "shared/contracts/nhm2-worldline-qei-coverage.v1.ts",
  "shared/contracts/scientific-calculator-step-schema.v1.ts",
  "shared/contracts/theory-runtime-entrypoint.v1.ts",
  "shared/contracts/theory-runtime-math-trace.v1.ts",
  "shared/contracts/theory-runtime-receipt.v1.ts",
  "shared/theory/nhm2-alpha07-historical-import-governance.ts",
  "tools/nhm2/run-experiment-ready-theory-primary.ts",
] as const;

export const NHM2_EXPERIMENT_READY_THEORY_FORMAL_BUNDLE_SOURCE_PATHS = [
  "server/services/theory/nhm2-formal-kernel-executor.ts",
  "server/services/theory/nhm2-formal-outer-observation-evidence-adapter.ts",
  "shared/contracts/nhm2-experiment-ready-theory-candidate-manifest.v1.ts",
  "shared/contracts/nhm2-experiment-ready-theory-closure.v1.ts",
  "shared/contracts/scientific-calculator-step-schema.v1.ts",
  "shared/contracts/theory-runtime-entrypoint.v1.ts",
  "shared/contracts/theory-runtime-math-trace.v1.ts",
  "shared/contracts/theory-runtime-receipt.v1.ts",
  "tools/nhm2/run-experiment-ready-theory-formal-candidate.ts",
  "tools/nhm2/run-experiment-ready-theory-formal.ts",
] as const;

const DEFAULT_OUTPUT_BASE =
  "artifacts/research/full-solve/experiment-ready-theory-candidates";
const MANIFEST_FILE_NAME = "candidate-manifest.v1.json";
const SEMANTIC_INPUT_FILE_NAME =
  "prediction-falsifier-freeze.semantic-input.v1.json";
const POLICY_FILE_NAME = "authoritative-numeric-policy.v1.json";
const CANDIDATE_DEFINITION_FILE_NAME = "candidate-definition.v1.json";
const SUPERSESSION_FILE_NAME = "candidate-supersession-policy.v1.json";
const PRIMARY_PRODUCER_BUNDLE_FILE_NAME =
  "primary-producer.standalone.bundle.mjs";
const PRIMARY_PRODUCER_BUNDLE_BUILD_FILE_NAME =
  "primary-producer.bundle-build.v1.json";
const ESBUILD_LOGICAL_OUTPUT_FILE_NAME = "nhm2-primary-producer.bundle.mjs";
const FORMAL_PRODUCER_BUNDLE_FILE_NAME =
  "formal-outer-producer.standalone.bundle.mjs";
const FORMAL_PRODUCER_BUNDLE_BUILD_FILE_NAME =
  "formal-outer-producer.bundle-build.v1.json";
const FORMAL_ESBUILD_LOGICAL_OUTPUT_FILE_NAME =
  "nhm2-formal-outer-producer.bundle.mjs";

export const NHM2_EXPERIMENT_READY_THEORY_EXECUTION_ENROLLMENT_BLOCKERS = [
  "primary_raw_solver_suite_producer_missing",
  "independent_external_execution_enrollment_required",
] as const;

const HISTORICAL_INPUT_FILES = {
  candidateSeed: "nhm2-campaign-frontier-disposition.json",
  profile: "nhm2-candidate-metric-profile-spec.json",
  chart: "nhm2-candidate-campaign-grid.json",
  atlas: "nhm2-regional-support-function-atlas.json",
  units: "nhm2-metric-required-full-regional-tensor.json",
  normalization: "nhm2-regional-full-tensor-residual.json",
} as const;

const PLAN_CONFIGURATION: Readonly<
  Record<
    Nhm2ExperimentReadyTheoryCandidateExecutionPlanRole,
    {
      runtimeId: string;
      npmScript: string;
      solverPath: string;
      solverArtifactId: string;
      solverContractVersion: string;
      solverId: string;
      implementationId: string;
    }
  >
> = {
  primary_numerical: {
    runtimeId: "nhm2.experiment_ready_theory.primary",
    npmScript: "warp:full-solve:nhm2:theory-candidate:primary",
    solverPath: "tools/nhm2/run-experiment-ready-theory-primary.ts",
    solverArtifactId: "nhm2.primary_raw_solver_suite_enrollment_placeholder",
    solverContractVersion:
      "nhm2_primary_raw_solver_suite_enrollment_placeholder/v1",
    solverId: "nhm2-primary-raw-solver-suite-unconfigured",
    implementationId: "primary-raw-solver-suite-producer-missing-v1",
  },
  independent_numerical: {
    runtimeId: "nhm2.experiment_ready_theory.independent",
    npmScript: "warp:full-solve:nhm2:theory-candidate:independent",
    solverPath:
      "shared/contracts/nhm2-independent-numerical-execution-descriptor.v1.ts",
    solverArtifactId:
      "nhm2.independent_external_execution_enrollment_placeholder",
    solverContractVersion:
      "nhm2_independent_external_execution_enrollment_placeholder/v1",
    solverId: "nhm2-independent-external-solver-unconfigured",
    implementationId: "independent-external-execution-enrollment-missing-v1",
  },
  formal_kernel: {
    runtimeId: "nhm2.experiment_ready_theory.formal",
    npmScript: NHM2_EXPERIMENT_READY_THEORY_FORMAL_NPM_SCRIPT,
    solverPath: "tools/nhm2/run-experiment-ready-theory-formal-candidate.ts",
    solverArtifactId: "nhm2.formal_theory_candidate_outer_producer",
    solverContractVersion: "nhm2_formal_theory_candidate_outer_producer/v2",
    solverId: "nhm2-formal-theory-candidate-outer-producer",
    implementationId: "casimirbot-direct-lean-outer-observation-v2",
  },
};

type JsonRecord = Record<string, unknown>;

export type Nhm2PredictionFreezeSemanticInputV1 = {
  artifactId: "nhm2.prediction_falsifier_freeze_semantic_input";
  contractVersion: "nhm2_prediction_falsifier_freeze_semantic_input/v1";
  predictionFreezeContractVersion: typeof NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_PREDICTION_FREEZE_CONTRACT_VERSION;
  semanticSha256: string;
  frozenInput: Omit<
    BuildNhm2PredictionFalsifierFreezeInput,
    "generatedAt" | "registrationBinding"
  >;
  completionRule: {
    generatedAtMustBeInjectedAtOrAfterFrozenAt: true;
    registrationBindingMustComeFromPrimaryPlan: true;
    candidateManifestRawSha256MustBeResolvedAfterManifestWrite: true;
    semanticSha256MustRemainUnchangedAfterEnvelopeInjection: true;
  };
  historicalSeedBoundary: {
    importManifestPath: typeof NHM2_ALPHA07_IMPORT_MANIFEST_PATH;
    runtimeId: typeof NHM2_ALPHA07_HISTORICAL_RUNTIME_ID;
    sourceCommitSha: typeof NHM2_ALPHA07_SOURCE_COMMIT;
    boundToExecution: false;
    artifactFreshness: "preexisting";
    diagnosticSeedOnly: true;
  };
  claimBoundary: {
    semanticInputOnly: true;
    theoryClosureClaimAllowed: false;
    empiricalValidationClaimAllowed: false;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
    routeEtaClaimAllowed: false;
    speedAuthorityClaimAllowed: false;
  };
};

export type Nhm2ExperimentReadyTheoryCandidateDefinitionV1 = {
  artifactId: "nhm2.experiment_ready_theory_candidate_definition";
  contractVersion: "nhm2_experiment_ready_theory_candidate_definition/v1";
  generatedAt: string;
  frozenAt: string;
  manifestId: string;
  candidateId: string;
  selectedProfileId: typeof NHM2_ALPHA07_PROFILE_ID;
  committedHistoricalSeed: {
    importManifestPath: typeof NHM2_ALPHA07_IMPORT_MANIFEST_PATH;
    importManifestSha256: string;
    runtimeId: typeof NHM2_ALPHA07_HISTORICAL_RUNTIME_ID;
    sourceCommitSha: typeof NHM2_ALPHA07_SOURCE_COMMIT;
    boundToExecution: false;
    artifactFreshness: "preexisting";
    diagnosticSeedOnly: true;
    cannotSatisfyFreshRuntimeEvidence: true;
    refs: Nhm2PredictionFreezeHashedArtifactRefV1[];
  };
  packagerProvenance: {
    packagerId: "casimirbot-nhm2-experiment-ready-theory-packager-v1";
    sourceCommitSha: string;
    sourceTreeSha: string;
    sourceSnapshotSha256: string;
    worktreeCleanAtConstructionStart: true;
    worktreeCleanAndStableRequiredBeforeReturn: true;
    refs: Nhm2PredictionFreezeHashedArtifactRefV1[];
  };
  primaryProducerBundle: {
    bundleRef: Nhm2PrimaryProducerBundleRefV1;
    buildMetadataRef: Nhm2PredictionFreezeHashedArtifactRefV1;
  };
  formalProducerBundle: {
    bundleRef: Nhm2FormalProducerBundleRefV1;
    buildMetadataRef: Nhm2PredictionFreezeHashedArtifactRefV1;
  };
  predictionFreezeSemanticInput: {
    path: string;
    sha256: string;
    semanticSha256: string;
  };
  numericPolicy: {
    path: string;
    sha256: string;
    semanticSha256: string;
  };
  claimBoundary: {
    preRunDefinitionOnly: true;
    theoryClosureClaimAllowed: false;
    empiricalValidationClaimAllowed: false;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
    routeEtaClaimAllowed: false;
    speedAuthorityClaimAllowed: false;
  };
};

export type PrepareNhm2ExperimentReadyTheoryCandidateInput = {
  repoRoot?: string;
  outputBaseDirectory?: string;
  manifestId: string;
  candidateId?: string;
  frozenAt: string;
  dataCollectionOpensAt?: string;
};

export type PreparedNhm2ExperimentReadyTheoryCandidate = {
  candidateRoot: string;
  manifestPath: string;
  manifestRawSha256: string;
  numericPolicyPath: string;
  predictionFreezeSemanticInputPath: string;
  candidateDefinitionPath: string;
  primaryProducerBundlePath: string;
  primaryProducerBundleBuildMetadataPath: string;
  formalProducerBundlePath: string;
  formalProducerBundleBuildMetadataPath: string;
  manifest: Nhm2ExperimentReadyTheoryCandidateManifestV1;
  predictionFreezeSemanticInput: Nhm2PredictionFreezeSemanticInputV1;
  candidateDefinition: Nhm2ExperimentReadyTheoryCandidateDefinitionV1;
};

export type PrepareNhm2ExperimentReadyTheoryCandidateDependencies = {
  /** Test/integration seam used to prove the final source-stability gate. */
  beforeFinalSourceStabilityCheck?: () => Promise<void> | void;
  /**
   * Contract-test-only escape hatch for inspecting the otherwise complete
   * draft in a dedicated temporary fixture repository. It is rejected for the
   * canonical checkout and every non-fixture path.
   */
  testOnlyPublishUnexecutableDraft?: true;
};

type GitSourceState = {
  head: string;
  tree: string;
  clean: boolean;
  statusSha256: string;
};

type PinnedSourceSnapshot = Map<string, { bytes: Buffer; sha256: string }>;

type HostNodeRuntimeBinding = {
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

const isRecord = (value: unknown): value is JsonRecord =>
  value != null && typeof value === "object" && !Array.isArray(value);

const sha256 = (value: string | Buffer): string =>
  createHash("sha256").update(value).digest("hex");

const renderJson = (value: unknown): string =>
  `${JSON.stringify(value, null, 2)}\n`;

const normalizeRepoPath = (value: string): string =>
  value.replace(/\\/g, "/").replace(/^\.\//, "");

const assertPortableRepoPath = (value: string, label: string): string => {
  const normalized = normalizeRepoPath(value.trim());
  const segments = normalized.split("/");
  if (
    normalized.length === 0 ||
    normalized.includes(":") ||
    path.posix.isAbsolute(normalized) ||
    path.win32.isAbsolute(value) ||
    segments.some(
      (segment) =>
        segment.length === 0 ||
        segment === "." ||
        segment === ".." ||
        segment.toLowerCase() === "latest",
    )
  ) {
    throw new Error(`${label} must be a pinned repository-relative path`);
  }
  return normalized;
};

const assertId = (value: string, label: string): string => {
  const normalized = value.trim();
  if (
    !/^[a-z0-9][a-z0-9._-]*$/i.test(normalized) ||
    /latest/i.test(normalized)
  ) {
    throw new Error(
      `${label} must be a pinned path-safe identifier without a latest alias`,
    );
  }
  return normalized;
};

const canonicalIso = (value: string, label: string): string => {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) {
    throw new Error(`${label} must be a canonical ISO-8601 timestamp`);
  }
  return value;
};

async function snapshotHostNodeRuntime(): Promise<HostNodeRuntimeBinding> {
  const executablePath = await fs.realpath(path.resolve(process.execPath));
  const stat = await fs.lstat(executablePath);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size <= 0) {
    throw new Error(
      "host Node runtime must resolve to a non-symbolic regular executable",
    );
  }
  const bytes = await fs.readFile(executablePath);
  if (bytes.byteLength !== stat.size) {
    throw new Error("host Node runtime size changed while packaging");
  }
  return {
    executablePath,
    sha256: sha256(bytes),
    sizeBytes: bytes.byteLength,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    hostSpecificDiagnosticRuntimeClosure: true,
    operatingSystemHermeticityAsserted: false,
    nodeRuntimeReproducibilityAsserted: false,
  };
}

const absoluteRepoPath = (repoRoot: string, repoPath: string): string => {
  const resolved = path.resolve(repoRoot, ...repoPath.split("/"));
  const relative = path.relative(repoRoot, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`repository path escapes root: ${repoPath}`);
  }
  return resolved;
};

const isAlreadyExists = (error: unknown): boolean =>
  (error as NodeJS.ErrnoException).code === "EEXIST";

const isMissing = (error: unknown): boolean =>
  (error as NodeJS.ErrnoException).code === "ENOENT";

async function resolveRealRepoRoot(repoRoot: string): Promise<string> {
  const stat = await fs.lstat(repoRoot);
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw new Error(
      "candidate packager repository root must be a real, non-symbolic directory",
    );
  }
  return fs.realpath(repoRoot);
}

async function assertSafeExistingPathComponents(input: {
  repoRoot: string;
  realRepoRoot: string;
  repoPath: string;
  label: string;
  finalKind?: "file" | "directory";
  allowMissingTail?: boolean;
}): Promise<string> {
  const repoPath = assertPortableRepoPath(input.repoPath, input.label);
  const absolute = absoluteRepoPath(input.repoRoot, repoPath);
  let cursor = input.repoRoot;
  const segments = repoPath.split("/");
  for (let index = 0; index < segments.length; index += 1) {
    cursor = path.join(cursor, segments[index]);
    let stat: Awaited<ReturnType<typeof fs.lstat>>;
    try {
      stat = await fs.lstat(cursor);
    } catch (error) {
      if (input.allowMissingTail && isMissing(error)) return absolute;
      throw error;
    }
    if (stat.isSymbolicLink()) {
      throw new Error(`${input.label} contains a symbolic-link component`);
    }
    const isFinal = index === segments.length - 1;
    if (!isFinal && !stat.isDirectory()) {
      throw new Error(`${input.label} contains a non-directory ancestor`);
    }
    if (
      isFinal &&
      ((input.finalKind === "file" && !stat.isFile()) ||
        (input.finalKind === "directory" && !stat.isDirectory()))
    ) {
      throw new Error(
        `${input.label} does not resolve to a ${input.finalKind}`,
      );
    }
    const realPath = await fs.realpath(cursor);
    const relative = path.relative(input.realRepoRoot, realPath);
    if (
      relative === ".." ||
      relative.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relative)
    ) {
      throw new Error(`${input.label} escapes the real repository root`);
    }
  }
  return absolute;
}

async function ensureSafeDirectoryChain(input: {
  repoRoot: string;
  realRepoRoot: string;
  repoPath: string;
  label: string;
}): Promise<{ absolutePath: string; realPath: string }> {
  const repoPath = assertPortableRepoPath(input.repoPath, input.label);
  let cursor = input.repoRoot;
  for (const segment of repoPath.split("/")) {
    cursor = path.join(cursor, segment);
    try {
      await fs.mkdir(cursor);
    } catch (error) {
      if (!isAlreadyExists(error)) throw error;
    }
    const stat = await fs.lstat(cursor);
    if (!stat.isDirectory() || stat.isSymbolicLink()) {
      throw new Error(
        `${input.label} must use only real, non-symbolic directories`,
      );
    }
    const realPath = await fs.realpath(cursor);
    const relative = path.relative(input.realRepoRoot, realPath);
    if (
      relative === ".." ||
      relative.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relative)
    ) {
      throw new Error(`${input.label} escaped the real repository root`);
    }
  }
  return { absolutePath: cursor, realPath: await fs.realpath(cursor) };
}

async function resolveGitSourceState(
  repoRoot: string,
): Promise<GitSourceState> {
  const [headResult, treeResult, statusResult] = await Promise.all([
    execFileAsync("git", ["rev-parse", "--verify", "HEAD"], {
      cwd: repoRoot,
      encoding: "utf8",
    }),
    execFileAsync("git", ["rev-parse", "--verify", "HEAD^{tree}"], {
      cwd: repoRoot,
      encoding: "utf8",
    }),
    execFileAsync(
      "git",
      ["status", "--porcelain=v1", "-z", "--untracked-files=all"],
      {
        cwd: repoRoot,
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
      },
    ),
  ]);
  const head = String(headResult.stdout).trim().toLowerCase();
  const tree = String(treeResult.stdout).trim().toLowerCase();
  const status = String(statusResult.stdout);
  if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(head)) {
    throw new Error("unable to resolve a pinned source commit");
  }
  if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(tree)) {
    throw new Error("unable to resolve a pinned source tree");
  }
  return {
    head,
    tree,
    clean: status.length === 0,
    statusSha256: sha256(status),
  };
}

async function assertTrackedAndClean(
  repoRoot: string,
  repoPaths: readonly string[],
): Promise<void> {
  for (const repoPath of repoPaths) {
    try {
      await execFileAsync(
        "git",
        ["ls-files", "--error-unmatch", "--", repoPath],
        {
          cwd: repoRoot,
        },
      );
      await execFileAsync("git", ["diff", "--quiet", "HEAD", "--", repoPath], {
        cwd: repoRoot,
      });
    } catch {
      throw new Error(
        `required descriptor is not committed and clean at HEAD: ${repoPath}`,
      );
    }
  }
}

async function snapshotPinnedSources(input: {
  repoRoot: string;
  realRepoRoot: string;
  repoPaths: readonly string[];
}): Promise<PinnedSourceSnapshot> {
  const snapshot: PinnedSourceSnapshot = new Map();
  for (const rawPath of [...new Set(input.repoPaths)].sort()) {
    const repoPath = assertPortableRepoPath(rawPath, "pinned source path");
    const absolute = await assertSafeExistingPathComponents({
      repoRoot: input.repoRoot,
      realRepoRoot: input.realRepoRoot,
      repoPath,
      label: `pinned source ${repoPath}`,
      finalKind: "file",
    });
    const bytes = await fs.readFile(absolute);
    snapshot.set(repoPath, { bytes, sha256: sha256(bytes) });
  }
  return snapshot;
}

function snapshotBytes(
  snapshot: PinnedSourceSnapshot,
  repoPath: string,
): Buffer {
  const entry = snapshot.get(repoPath);
  if (entry == null)
    throw new Error(`pinned source was not captured: ${repoPath}`);
  return entry.bytes;
}

type ProducerBundlePass = {
  bytes: Buffer;
  metafile: Metafile;
  inputPaths: string[];
  outputKey: string;
  externalImports: Array<{
    path: string;
    kind: string;
    external: true;
  }>;
};

async function buildProducerBundlePass(input: {
  repoRoot: string;
  planRole: "primary_numerical" | "formal_kernel";
  outputKey: string;
  label: string;
}): Promise<ProducerBundlePass> {
  const entryPoint = PLAN_CONFIGURATION[input.planRole].solverPath;
  const buildOptions =
    input.planRole === "formal_kernel"
      ? NHM2_FORMAL_PRODUCER_BUNDLE_BUILD_OPTIONS
      : NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_OPTIONS;
  const result = await buildEsbuild({
    absWorkingDir: input.repoRoot,
    entryPoints: [entryPoint],
    outfile: input.outputKey,
    bundle: buildOptions.bundle,
    write: buildOptions.write,
    metafile: buildOptions.metafile,
    platform: buildOptions.platform,
    format: buildOptions.format,
    target: [buildOptions.target],
    packages: buildOptions.packages,
    sourcemap: buildOptions.sourcemap,
    legalComments: buildOptions.legalComments,
    charset: buildOptions.charset,
    treeShaking: buildOptions.treeShaking,
    minify: buildOptions.minify,
    logLevel: "silent",
  });
  if (
    result.warnings.length !== 0 ||
    result.outputFiles.length !== 1 ||
    result.metafile == null
  ) {
    throw new Error(
      `${input.label} bundle build must emit one warning-free in-memory output and a metafile`,
    );
  }
  const outputKey = Object.keys(result.metafile.outputs)[0];
  const output = outputKey == null ? null : result.metafile.outputs[outputKey];
  if (
    Object.keys(result.metafile.outputs).length !== 1 ||
    outputKey !== input.outputKey ||
    output == null ||
    output.entryPoint !== entryPoint ||
    output.bytes !== result.outputFiles[0].contents.byteLength
  ) {
    throw new Error(
      `${input.label} bundle metafile has an unexpected output binding`,
    );
  }
  const inputPaths = Object.keys(result.metafile.inputs)
    .map((repoPath) =>
      assertPortableRepoPath(
        normalizeRepoPath(repoPath),
        "primary bundle input",
      ),
    )
    .sort();
  if (
    inputPaths.length === 0 ||
    new Set(inputPaths).size !== inputPaths.length ||
    inputPaths.some((repoPath) => repoPath.split("/").includes("node_modules"))
  ) {
    throw new Error(
      `${input.label} bundle input closure is empty, duplicated, or contains node_modules`,
    );
  }
  const externalImports = output.imports
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
    externalImports.some(
      (entry) => entry.external !== true || !entry.path.startsWith("node:"),
    )
  ) {
    throw new Error(
      `${input.label} standalone bundle has a non-node or non-external runtime import`,
    );
  }
  return {
    bytes: Buffer.from(result.outputFiles[0].contents),
    metafile: result.metafile,
    inputPaths,
    outputKey,
    externalImports: externalImports as ProducerBundlePass["externalImports"],
  };
}

const buildPrimaryProducerBundlePass = (
  repoRoot: string,
): Promise<ProducerBundlePass> =>
  buildProducerBundlePass({
    repoRoot,
    planRole: "primary_numerical",
    outputKey: ESBUILD_LOGICAL_OUTPUT_FILE_NAME,
    label: "primary producer",
  });

const buildFormalProducerBundlePass = (
  repoRoot: string,
): Promise<ProducerBundlePass> =>
  buildProducerBundlePass({
    repoRoot,
    planRole: "formal_kernel",
    outputKey: FORMAL_ESBUILD_LOGICAL_OUTPUT_FILE_NAME,
    label: "formal outer producer",
  });

function assertDeterministicProducerBundle(input: {
  label: string;
  discovery: ProducerBundlePass;
  final: ProducerBundlePass;
}): void {
  if (
    sha256(input.discovery.bytes) !== sha256(input.final.bytes) ||
    sha256Nhm2PrimaryProducerBundleBuildValue(input.discovery.metafile) !==
      sha256Nhm2PrimaryProducerBundleBuildValue(input.final.metafile) ||
    JSON.stringify(input.discovery.inputPaths) !==
      JSON.stringify(input.final.inputPaths) ||
    JSON.stringify(input.discovery.externalImports) !==
      JSON.stringify(input.final.externalImports)
  ) {
    throw new Error(
      `${input.label} standalone bundle or metafile was not deterministic across clean build passes`,
    );
  }
}

function primaryProducerBundleBuildMetadata(input: {
  frozenAt: string;
  bundlePath: string;
  pass: ProducerBundlePass;
  sourceSnapshot: PinnedSourceSnapshot;
}): Nhm2PrimaryProducerBundleBuildMetadataV1 {
  const output = input.pass.metafile.outputs[input.pass.outputKey];
  const entryPointPath = PLAN_CONFIGURATION.primary_numerical.solverPath;
  const entryPointSource = input.sourceSnapshot.get(entryPointPath);
  if (output == null) {
    throw new Error("primary producer bundle output disappeared from metafile");
  }
  if (entryPointSource == null) {
    throw new Error(
      "primary producer entry point is absent from source snapshot",
    );
  }
  const inputs: Nhm2PrimaryProducerBundleBuildInputV1[] = input.pass.inputPaths
    .map((repoPath) => {
      const source = input.sourceSnapshot.get(repoPath);
      const metafileInput = input.pass.metafile.inputs[repoPath];
      const outputInput = output.inputs[repoPath];
      if (
        source == null ||
        metafileInput == null ||
        metafileInput.bytes !== source.bytes.byteLength
      ) {
        throw new Error(
          `primary producer metafile input is not bound to the pinned source snapshot: ${repoPath}`,
        );
      }
      return {
        path: repoPath,
        sha256: source.sha256,
        sizeBytes: source.bytes.byteLength,
        bytesInOutput: outputInput?.bytesInOutput ?? 0,
      };
    })
    .sort((left, right) => left.path.localeCompare(right.path));
  const bundleRef: Nhm2PrimaryProducerBundleRefV1 = {
    artifactId: NHM2_PRIMARY_PRODUCER_BUNDLE_ARTIFACT_ID,
    path: input.bundlePath,
    schemaVersion: NHM2_PRIMARY_PRODUCER_BUNDLE_SCHEMA_VERSION,
    sha256: sha256(input.pass.bytes),
    sizeBytes: input.pass.bytes.byteLength,
  };
  const metadata: Nhm2PrimaryProducerBundleBuildMetadataV1 = {
    artifactId: NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_ARTIFACT_ID,
    contractVersion: NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_CONTRACT_VERSION,
    generatedAt: input.frozenAt,
    entryPoint: {
      path: entryPointPath,
      sha256: entryPointSource.sha256,
    },
    bundleRef,
    bundler: {
      name: "esbuild",
      version: esbuildVersion,
      options: { ...NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_OPTIONS },
    },
    inputClosure: {
      inputCount: inputs.length,
      sourceSnapshotSha256:
        computeNhm2PrimaryProducerBundleSourceSnapshotSha256(inputs),
      inputs,
    },
    metafile: {
      sha256: sha256Nhm2PrimaryProducerBundleBuildValue(input.pass.metafile),
      outputKey: input.pass.outputKey,
      outputBytes: input.pass.bytes.byteLength,
      externalImports: input.pass.externalImports,
      value: input.pass.metafile as unknown as Record<string, unknown>,
    },
    dependencyClosure: {
      bundledSourceClosureComplete: true,
      runtimeNodeModulesRequired: false,
      externalNpmPackages: [],
      externalNodeBuiltins: input.pass.externalImports.map(
        (entry) => entry.path,
      ),
    },
    claimBoundary: {
      deterministicBuildReceiptOnly: true,
      operatingSystemHermeticityAsserted: false,
      nodeRuntimeHermeticityAsserted: false,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
      routeEtaClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
    },
  };
  if (!isNhm2PrimaryProducerBundleBuildMetadata(metadata)) {
    throw new Error(
      "primary producer bundle build metadata failed its exact contract",
    );
  }
  return metadata;
}

function formalProducerBundleBuildMetadata(input: {
  frozenAt: string;
  bundlePath: string;
  pass: ProducerBundlePass;
  sourceSnapshot: PinnedSourceSnapshot;
}): Nhm2FormalProducerBundleBuildMetadataV1 {
  const output = input.pass.metafile.outputs[input.pass.outputKey];
  const entryPointPath = PLAN_CONFIGURATION.formal_kernel.solverPath;
  const entryPointSource = input.sourceSnapshot.get(entryPointPath);
  if (output == null) {
    throw new Error(
      "formal outer producer bundle output disappeared from metafile",
    );
  }
  if (entryPointSource == null) {
    throw new Error(
      "formal outer producer entry point is absent from source snapshot",
    );
  }
  const inputs: Nhm2FormalProducerBundleBuildInputV1[] = input.pass.inputPaths
    .map((repoPath) => {
      const source = input.sourceSnapshot.get(repoPath);
      const metafileInput = input.pass.metafile.inputs[repoPath];
      const outputInput = output.inputs[repoPath];
      if (
        source == null ||
        metafileInput == null ||
        metafileInput.bytes !== source.bytes.byteLength
      ) {
        throw new Error(
          `formal outer producer metafile input is not bound to the pinned source snapshot: ${repoPath}`,
        );
      }
      return {
        path: repoPath,
        sha256: source.sha256,
        sizeBytes: source.bytes.byteLength,
        bytesInOutput: outputInput?.bytesInOutput ?? 0,
      };
    })
    .sort((left, right) => left.path.localeCompare(right.path));
  const bundleRef: Nhm2FormalProducerBundleRefV1 = {
    artifactId: NHM2_FORMAL_PRODUCER_BUNDLE_ARTIFACT_ID,
    path: input.bundlePath,
    schemaVersion: NHM2_FORMAL_PRODUCER_BUNDLE_SCHEMA_VERSION,
    sha256: sha256(input.pass.bytes),
    sizeBytes: input.pass.bytes.byteLength,
  };
  const metadata: Nhm2FormalProducerBundleBuildMetadataV1 = {
    artifactId: NHM2_FORMAL_PRODUCER_BUNDLE_BUILD_ARTIFACT_ID,
    contractVersion: NHM2_FORMAL_PRODUCER_BUNDLE_BUILD_CONTRACT_VERSION,
    generatedAt: input.frozenAt,
    entryPoint: {
      path: entryPointPath,
      sha256: entryPointSource.sha256,
    },
    bundleRef,
    bundler: {
      name: "esbuild",
      version: esbuildVersion,
      options: { ...NHM2_FORMAL_PRODUCER_BUNDLE_BUILD_OPTIONS },
    },
    inputClosure: {
      inputCount: inputs.length,
      sourceSnapshotSha256:
        computeNhm2FormalProducerBundleSourceSnapshotSha256(inputs),
      inputs,
    },
    metafile: {
      sha256: sha256Nhm2FormalProducerBundleBuildValue(input.pass.metafile),
      outputKey: input.pass.outputKey,
      outputBytes: input.pass.bytes.byteLength,
      externalImports: input.pass.externalImports,
      value: input.pass.metafile as unknown as Record<string, unknown>,
    },
    dependencyClosure: {
      bundledSourceClosureComplete: true,
      runtimeNodeModulesRequired: false,
      externalNpmPackages: [],
      externalNodeBuiltins: input.pass.externalImports.map(
        (entry) => entry.path,
      ),
    },
    claimBoundary: {
      deterministicBuildReceiptOnly: true,
      operatingSystemHermeticityAsserted: false,
      nodeRuntimeHermeticityAsserted: false,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
      routeEtaClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
    },
  };
  if (!isNhm2FormalProducerBundleBuildMetadata(metadata)) {
    throw new Error(
      "formal outer producer bundle build metadata failed its exact contract",
    );
  }
  return metadata;
}

function readSnapshotJson(
  snapshot: PinnedSourceSnapshot,
  repoPath: string,
): JsonRecord {
  const parsed: unknown = JSON.parse(
    snapshotBytes(snapshot, repoPath).toString("utf8"),
  );
  if (!isRecord(parsed)) throw new Error(`expected a JSON object: ${repoPath}`);
  return parsed;
}

const artifactContractVersion = (
  artifact: JsonRecord,
  repoPath: string,
): string => {
  const version =
    typeof artifact.contractVersion === "string"
      ? artifact.contractVersion
      : typeof artifact.artifactType === "string"
        ? artifact.artifactType
        : null;
  if (version == null || !/^[a-z0-9_.-]+\/v[1-9][0-9]*$/i.test(version)) {
    throw new Error(
      `committed descriptor has no governed /vN contract: ${repoPath}`,
    );
  }
  return version;
};

function hashedSnapshotRef(
  snapshot: PinnedSourceSnapshot,
  repoPath: string,
  artifactId: string,
  schemaVersion: string,
): Nhm2PredictionFreezeHashedArtifactRefV1 {
  const entry = snapshot.get(repoPath);
  if (entry == null)
    throw new Error(`pinned source was not captured: ${repoPath}`);
  return {
    artifactId,
    path: repoPath,
    schemaVersion,
    sha256: entry.sha256,
  };
}

const refForRendered = (
  repoPath: string,
  artifactId: string,
  schemaVersion: string,
  rendered: string,
): Nhm2PredictionFreezeHashedArtifactRefV1 => ({
  artifactId,
  path: repoPath,
  schemaVersion,
  sha256: sha256(rendered),
});

const bindingForRef = (
  ref: Nhm2PredictionFreezeHashedArtifactRefV1,
): Nhm2ExperimentReadyTheoryCandidateHashedBindingV1 => ({
  artifactId: ref.artifactId,
  contractVersion: ref.schemaVersion,
  path: ref.path,
  sha256: ref.sha256,
});

const environmentForPlan = (input: {
  bindings: Nhm2ExperimentReadyTheoryCandidateBindingsV1;
  outputDirectory: string;
  requestId: string;
  receiptId: string;
  runtimeId: string;
  runId: string;
}) =>
  [
    ["NHM2_ATLAS_SHA256", input.bindings.atlas.sha256],
    ["NHM2_CANDIDATE_ID", input.bindings.candidate.candidateId],
    ["NHM2_CANDIDATE_MANIFEST_SHA256", null],
    ["NHM2_CHART_ID", input.bindings.chart.chartId],
    ["NHM2_NORMALIZATION_SHA256", input.bindings.normalization.sha256],
    ["NHM2_OUTPUT_DIR", input.outputDirectory],
    ["NHM2_RUN_ID", input.runId],
    ["NHM2_SELECTED_PROFILE_ID", input.bindings.profile.selectedProfileId],
    ["NHM2_UNITS_SHA256", input.bindings.units.sha256],
    ["THEORY_RUNTIME_ID", input.runtimeId],
    ["THEORY_RUNTIME_RECEIPT_ID", input.receiptId],
    ["THEORY_RUNTIME_REQUEST_ID", input.requestId],
  ].map(([name, value]) => ({
    name: name as string,
    valueKind:
      name === "NHM2_CANDIDATE_MANIFEST_SHA256"
        ? ("candidate_manifest_raw_sha256" as const)
        : ("literal" as const),
    value: value as string | null,
  }));

const planRoleForEvidence = (
  evidenceRole: string,
): Nhm2ExperimentReadyTheoryCandidateExecutionPlanRole =>
  evidenceRole === "independent_numerical_replication"
    ? "independent_numerical"
    : evidenceRole === "formal_manifest_certificate"
      ? "formal_kernel"
      : "primary_numerical";

async function ensureOutputRootAvailable(
  repoRoot: string,
  realRepoRoot: string,
  candidateRoot: string,
): Promise<void> {
  const absolute = await assertSafeExistingPathComponents({
    repoRoot,
    realRepoRoot,
    repoPath: candidateRoot,
    label: "immutable candidate root",
    allowMissingTail: true,
  });
  try {
    const stat = await fs.lstat(absolute);
    if (stat.isSymbolicLink()) {
      throw new Error("immutable candidate root must not be a symbolic link");
    }
    throw new Error(
      `immutable candidate root already exists: ${candidateRoot}`,
    );
  } catch (error) {
    if (!isMissing(error)) throw error;
  }
}

async function writeNew(
  repoRoot: string,
  realRepoRoot: string,
  realCandidateRoot: string,
  repoPath: string,
  rendered: string | Buffer,
): Promise<void> {
  const absolute = absoluteRepoPath(repoRoot, repoPath);
  const parentRepoPath = normalizeRepoPath(
    path.relative(repoRoot, path.dirname(absolute)),
  );
  const parent = await ensureSafeDirectoryChain({
    repoRoot,
    realRepoRoot,
    repoPath: parentRepoPath,
    label: `candidate output parent for ${repoPath}`,
  });
  const candidateRelative = path.relative(realCandidateRoot, parent.realPath);
  if (
    candidateRelative === ".." ||
    candidateRelative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(candidateRelative)
  ) {
    throw new Error(`candidate output escaped its immutable root: ${repoPath}`);
  }

  let handle: Awaited<ReturnType<typeof fs.open>> | null = null;
  try {
    handle = await fs.open(absolute, "wx", 0o600);
    const openedStat = await handle.stat();
    if (!openedStat.isFile()) {
      throw new Error(`candidate output is not a regular file: ${repoPath}`);
    }
    await handle.writeFile(rendered);
    await handle.sync();
    await handle.close();
    handle = null;

    const finalStat = await fs.lstat(absolute);
    if (!finalStat.isFile() || finalStat.isSymbolicLink()) {
      throw new Error(`candidate output is not a regular file: ${repoPath}`);
    }
    await assertSafeExistingPathComponents({
      repoRoot,
      realRepoRoot,
      repoPath,
      label: `candidate output ${repoPath}`,
      finalKind: "file",
    });
    const finalRealPath = await fs.realpath(absolute);
    const relative = path.relative(realCandidateRoot, finalRealPath);
    if (
      relative === ".." ||
      relative.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relative)
    ) {
      throw new Error(
        `candidate output escaped its immutable root: ${repoPath}`,
      );
    }
  } finally {
    if (handle != null) await handle.close().catch(() => undefined);
  }
}

export async function prepareNhm2ExperimentReadyTheoryCandidate(
  input: PrepareNhm2ExperimentReadyTheoryCandidateInput,
  dependencies: PrepareNhm2ExperimentReadyTheoryCandidateDependencies = {},
): Promise<PreparedNhm2ExperimentReadyTheoryCandidate> {
  const repoRoot = path.resolve(input.repoRoot ?? process.cwd());
  const realRepoRoot = await resolveRealRepoRoot(repoRoot);
  const manifestId = assertId(input.manifestId, "manifestId");
  const candidateId = assertId(
    input.candidateId ?? `${manifestId}-candidate`,
    "candidateId",
  );
  const frozenAt = canonicalIso(input.frozenAt, "frozenAt");
  const dataCollectionOpensAt = canonicalIso(
    input.dataCollectionOpensAt ??
      new Date(Date.parse(frozenAt) + 24 * 60 * 60 * 1_000).toISOString(),
    "dataCollectionOpensAt",
  );
  if (Date.parse(dataCollectionOpensAt) <= Date.parse(frozenAt)) {
    throw new Error("dataCollectionOpensAt must be after frozenAt");
  }
  const outputBase = assertPortableRepoPath(
    input.outputBaseDirectory ?? DEFAULT_OUTPUT_BASE,
    "outputBaseDirectory",
  );
  const temporaryRelative = path.relative(os.tmpdir(), repoRoot);
  const contractTestDraftAllowed =
    dependencies.testOnlyPublishUnexecutableDraft === true &&
    process.env.NODE_ENV === "test" &&
    temporaryRelative.length > 0 &&
    !temporaryRelative.startsWith("..") &&
    !path.isAbsolute(temporaryRelative) &&
    path.basename(repoRoot).startsWith("nhm2-packager-spec-");
  if (!contractTestDraftAllowed) {
    throw new Error(
      `candidate execution enrollment incomplete: ${NHM2_EXPERIMENT_READY_THEORY_EXECUTION_ENROLLMENT_BLOCKERS.join(", ")}`,
    );
  }
  const candidateRoot = path.posix.join(outputBase, manifestId);
  const stagingRoot = path.posix.join(
    outputBase,
    `.${manifestId}.staging-${process.pid}-${randomUUID()}`,
  );
  await ensureOutputRootAvailable(repoRoot, realRepoRoot, candidateRoot);
  await ensureOutputRootAvailable(repoRoot, realRepoRoot, stagingRoot);

  const historicalPaths = Object.fromEntries(
    Object.entries(HISTORICAL_INPUT_FILES).map(([key, fileName]) => [
      key,
      path.posix.join(NHM2_ALPHA07_PACKAGE_DIRECTORY, fileName),
    ]),
  ) as Record<keyof typeof HISTORICAL_INPUT_FILES, string>;
  const trackedInputs = [
    NHM2_ALPHA07_IMPORT_MANIFEST_PATH,
    ...Object.values(historicalPaths),
    ...Object.values(PLAN_CONFIGURATION).map((plan) => plan.solverPath),
    ...NHM2_EXPERIMENT_READY_THEORY_PACKAGER_SOURCE_PATHS,
    ...NHM2_EXPERIMENT_READY_THEORY_PRIMARY_BUNDLE_SOURCE_PATHS,
    ...NHM2_EXPERIMENT_READY_THEORY_FORMAL_BUNDLE_SOURCE_PATHS,
    "package-lock.json",
  ];
  const baseTrackedInputs = [...new Set(trackedInputs)];
  const initialSourceState = await resolveGitSourceState(repoRoot);
  if (!initialSourceState.clean) {
    throw new Error(
      "candidate packaging requires the entire Git worktree to be clean before construction",
    );
  }
  await assertTrackedAndClean(repoRoot, baseTrackedInputs);
  const discoveryBundlePass = await buildPrimaryProducerBundlePass(repoRoot);
  const discoveryFormalBundlePass =
    await buildFormalProducerBundlePass(repoRoot);
  if (
    JSON.stringify(discoveryBundlePass.inputPaths) !==
    JSON.stringify(
      [...NHM2_EXPERIMENT_READY_THEORY_PRIMARY_BUNDLE_SOURCE_PATHS].sort(),
    )
  ) {
    throw new Error(
      "primary producer esbuild metafile input closure does not match the governed source list",
    );
  }
  if (
    JSON.stringify(discoveryFormalBundlePass.inputPaths) !==
    JSON.stringify(
      [...NHM2_EXPERIMENT_READY_THEORY_FORMAL_BUNDLE_SOURCE_PATHS].sort(),
    )
  ) {
    throw new Error(
      "formal outer producer esbuild metafile input closure does not match the governed source list",
    );
  }
  const uniqueTrackedInputs = [
    ...new Set([
      ...baseTrackedInputs,
      ...discoveryBundlePass.inputPaths,
      ...discoveryFormalBundlePass.inputPaths,
    ]),
  ];
  await assertTrackedAndClean(repoRoot, uniqueTrackedInputs);
  const sourceSnapshot = await snapshotPinnedSources({
    repoRoot,
    realRepoRoot,
    repoPaths: uniqueTrackedInputs,
  });
  const finalBundlePass = await buildPrimaryProducerBundlePass(repoRoot);
  const finalFormalBundlePass = await buildFormalProducerBundlePass(repoRoot);
  assertDeterministicProducerBundle({
    label: "primary producer",
    discovery: discoveryBundlePass,
    final: finalBundlePass,
  });
  assertDeterministicProducerBundle({
    label: "formal outer producer",
    discovery: discoveryFormalBundlePass,
    final: finalFormalBundlePass,
  });
  const postBuildSourceSnapshot = await snapshotPinnedSources({
    repoRoot,
    realRepoRoot,
    repoPaths: uniqueTrackedInputs,
  });
  for (const [repoPath, initial] of sourceSnapshot) {
    if (postBuildSourceSnapshot.get(repoPath)?.sha256 !== initial.sha256) {
      throw new Error(
        `pinned source changed during primary producer bundle build: ${repoPath}`,
      );
    }
  }
  const hostNodeRuntime = await snapshotHostNodeRuntime();

  const historicalIssues = await validateNhm2Alpha07HistoricalImportManifest({
    repoRoot,
  });
  if (historicalIssues.length > 0) {
    throw new Error(
      `governed alpha=0.7 historical diagnostic seed failed validation:\n- ${historicalIssues.join("\n- ")}`,
    );
  }
  const historicalManifest = readSnapshotJson(
    sourceSnapshot,
    NHM2_ALPHA07_IMPORT_MANIFEST_PATH,
  );
  const historicalEntries = Array.isArray(historicalManifest.entries)
    ? historicalManifest.entries.filter(isRecord)
    : [];
  if (
    historicalManifest.boundToExecution !== false ||
    historicalManifest.requestId !== null ||
    historicalManifest.startedAt !== null ||
    historicalManifest.completedAt !== null ||
    historicalEntries.length === 0 ||
    historicalEntries.some((entry) => entry.freshness !== "preexisting")
  ) {
    throw new Error(
      "alpha=0.7 import must remain an unbound, entirely preexisting diagnostic seed",
    );
  }

  const sourceCommitSha = initialSourceState.head;

  const committedSeedRefs = Object.entries(historicalPaths).map(
    ([key, repoPath]) => {
      const artifact = readSnapshotJson(sourceSnapshot, repoPath);
      return hashedSnapshotRef(
        sourceSnapshot,
        repoPath,
        `nhm2.alpha07_historical_${key}`,
        artifactContractVersion(artifact, repoPath),
      );
    },
  );
  const seedRefByKey = Object.fromEntries(
    Object.keys(historicalPaths).map((key, index) => [
      key,
      committedSeedRefs[index],
    ]),
  ) as Record<
    keyof typeof HISTORICAL_INPUT_FILES,
    Nhm2PredictionFreezeHashedArtifactRefV1
  >;
  const importManifestRef = hashedSnapshotRef(
    sourceSnapshot,
    NHM2_ALPHA07_IMPORT_MANIFEST_PATH,
    "nhm2.alpha07_historical_import_manifest",
    "theory_runtime_output_manifest/v1",
  );
  const dependencyLockRef = hashedSnapshotRef(
    sourceSnapshot,
    "package-lock.json",
    "casimirbot.npm_dependency_lock",
    "npm_package_lock/v1",
  );
  const packagerSourceRefs =
    NHM2_EXPERIMENT_READY_THEORY_PACKAGER_SOURCE_PATHS.map((repoPath) =>
      hashedSnapshotRef(
        sourceSnapshot,
        repoPath,
        `casimirbot.source.${repoPath.replace(/[^A-Za-z0-9]+/g, "_")}`,
        "typescript_source/v1",
      ),
    );
  const packagerSourceSnapshotSha256 = sha256(
    JSON.stringify(
      packagerSourceRefs.map((ref) => ({
        path: ref.path,
        sha256: ref.sha256,
      })),
    ),
  );

  const inputsRoot = path.posix.join(candidateRoot, "inputs");
  const manifestPath = path.posix.join(candidateRoot, MANIFEST_FILE_NAME);
  const numericPolicyPath = path.posix.join(inputsRoot, POLICY_FILE_NAME);
  const predictionFreezeSemanticInputPath = path.posix.join(
    inputsRoot,
    SEMANTIC_INPUT_FILE_NAME,
  );
  const candidateDefinitionPath = path.posix.join(
    inputsRoot,
    CANDIDATE_DEFINITION_FILE_NAME,
  );
  const primaryProducerBundlePath = path.posix.join(
    inputsRoot,
    "plans",
    "primary_numerical",
    PRIMARY_PRODUCER_BUNDLE_FILE_NAME,
  );
  const primaryProducerBundleBuildMetadataPath = path.posix.join(
    inputsRoot,
    "plans",
    "primary_numerical",
    PRIMARY_PRODUCER_BUNDLE_BUILD_FILE_NAME,
  );
  const formalProducerBundlePath = path.posix.join(
    inputsRoot,
    "plans",
    "formal_kernel",
    FORMAL_PRODUCER_BUNDLE_FILE_NAME,
  );
  const formalProducerBundleBuildMetadataPath = path.posix.join(
    inputsRoot,
    "plans",
    "formal_kernel",
    FORMAL_PRODUCER_BUNDLE_BUILD_FILE_NAME,
  );
  const supersessionPath = path.posix.join(inputsRoot, SUPERSESSION_FILE_NAME);
  const supportPath = path.posix.join(inputsRoot, "prediction-support.v1.json");
  const registrationPath = path.posix.join(
    inputsRoot,
    "prediction-registration-seal.v1.json",
  );
  const freezeManifestInputPath = path.posix.join(
    inputsRoot,
    "prediction-freeze-manifest-input.v1.json",
  );

  const primaryBundleBuildMetadata = primaryProducerBundleBuildMetadata({
    frozenAt,
    bundlePath: primaryProducerBundlePath,
    pass: finalBundlePass,
    sourceSnapshot,
  });
  const primaryBundleBuildMetadataRendered = renderJson(
    primaryBundleBuildMetadata,
  );
  const primaryBundleBuildMetadataRef = refForRendered(
    primaryProducerBundleBuildMetadataPath,
    primaryBundleBuildMetadata.artifactId,
    primaryBundleBuildMetadata.contractVersion,
    primaryBundleBuildMetadataRendered,
  );
  const formalBundleBuildMetadata = formalProducerBundleBuildMetadata({
    frozenAt,
    bundlePath: formalProducerBundlePath,
    pass: finalFormalBundlePass,
    sourceSnapshot,
  });
  const formalBundleBuildMetadataRendered = renderJson(
    formalBundleBuildMetadata,
  );
  const formalBundleBuildMetadataRef = refForRendered(
    formalProducerBundleBuildMetadataPath,
    formalBundleBuildMetadata.artifactId,
    formalBundleBuildMetadata.contractVersion,
    formalBundleBuildMetadataRendered,
  );

  const numericPolicy =
    buildNhm2ExperimentReadyTheoryCandidateNumericPolicySetArtifact(
      `${manifestId}-authoritative-numeric-policy-v1`,
    );
  const numericPolicyRendered = renderJson(numericPolicy);

  const supersessionPolicy = {
    artifactId: "nhm2.experiment_ready_theory_candidate_supersession_policy",
    contractVersion: "nhm2_theory_candidate_supersession/v1",
    policyId: `${manifestId}-immutable-supersession-policy-v1`,
    originalManifestImmutable: true,
    inPlaceMutationForbidden: true,
    supersedingManifestRequiresNewManifestId: true,
    supersedingManifestRequiresPredecessorSha256: true,
    empiricalClaimsRemainClosedAcrossSupersession: true,
  } as const;
  const supersessionRendered = renderJson(supersessionPolicy);

  const supportArtifact = {
    artifactId: "nhm2.prediction_freeze_support",
    contractVersion: "nhm2_prediction_freeze_support/v1",
    generatedAt: frozenAt,
    manifestId,
    candidateId,
    selectedProfileId: NHM2_ALPHA07_PROFILE_ID,
    uncertaintyMethod:
      "pre-data joint covariance propagation; no empirical covariance is asserted",
    nullControl:
      "matched passive stack, drive-phase scramble, and blinded active/dummy labels",
    claimBoundary: {
      diagnosticSeedOnly: true,
      empiricalValidationClaimAllowed: false,
      physicalViabilityClaimAllowed: false,
    },
  } as const;
  const supportRendered = renderJson(supportArtifact);
  const supportRef = refForRendered(
    supportPath,
    supportArtifact.artifactId,
    supportArtifact.contractVersion,
    supportRendered,
  );

  const registrationArtifact = {
    artifactId: "nhm2.prediction_freeze_registration_seal",
    contractVersion: "nhm2_prediction_freeze_registration_seal/v1",
    generatedAt: frozenAt,
    manifestId,
    issuerId: "casimirbot-deterministic-pre-run-packager",
    appendOnlyRegistryId: `${manifestId}-local-pre-data-registry`,
    sealAlgorithm: "sha256-content-addressed-local-seal",
    externalTimestampAuthorityAsserted: false,
    claimBoundary: { empiricalReceipt: false, physicalAuthority: false },
  } as const;
  const registrationRendered = renderJson(registrationArtifact);
  const registrationRef = refForRendered(
    registrationPath,
    registrationArtifact.artifactId,
    registrationArtifact.contractVersion,
    registrationRendered,
  );

  const freezeManifestInputArtifact = {
    artifactId: "nhm2.prediction_freeze_manifest_input",
    contractVersion: "nhm2_prediction_freeze_manifest_input/v1",
    generatedAt: frozenAt,
    manifestId,
    freezeId: `${manifestId}-prediction-freeze-v1`,
    selectedProfileId: NHM2_ALPHA07_PROFILE_ID,
    dataBoundary: "pre_data",
    candidateManifestRawSha256InjectedAfterManifestWrite: true,
  } as const;
  const freezeManifestInputRendered = renderJson(freezeManifestInputArtifact);
  const freezeManifestInputRef = refForRendered(
    freezeManifestInputPath,
    freezeManifestInputArtifact.artifactId,
    freezeManifestInputArtifact.contractVersion,
    freezeManifestInputRendered,
  );

  const observableDefinitions = {
    DeltaTmunu_xt: {
      unit: "J/m^3",
      channel: "same-chart stress-energy residual",
    },
    delta_phi_f: { unit: "rad", channel: "registered phase response" },
    delta_tau: { unit: "s", channel: "registered proper-time residual" },
    delta_F: { unit: "N", channel: "registered force residual" },
    h00_proxy: { unit: "1", channel: "registered metric proxy" },
    R_0i0j: { unit: "1/s^2", channel: "registered tidal-curvature channel" },
  } as const;
  const predictionArtifacts =
    NHM2_PREDICTION_FREEZE_REQUIRED_OBSERVABLE_IDS.map((observableId) => {
      const definition = observableDefinitions[observableId];
      const repoPath = path.posix.join(
        inputsRoot,
        "predictions",
        `${observableId}.v1.json`,
      );
      const artifact = {
        artifactId: `nhm2.prediction.${observableId}`,
        contractVersion: "nhm2_frozen_observable_prediction/v1",
        generatedAt: frozenAt,
        observableId,
        definition: definition.channel,
        unit: definition.unit,
        expectedSignOrPhase:
          "null-only guard: the historical diagnostic seed authorizes no non-zero physical sign or phase",
        numericPrediction: null,
        historicalSeedFreshness: "preexisting",
        physicalPredictionAuthority: false,
      } as const;
      const rendered = renderJson(artifact);
      return {
        observableId,
        definition,
        repoPath,
        rendered,
        ref: refForRendered(
          repoPath,
          artifact.artifactId,
          artifact.contractVersion,
          rendered,
        ),
      };
    });

  const primaryRuntime = PLAN_CONFIGURATION.primary_numerical;
  const primaryRequestId = `${manifestId}-primary-numerical-request-v1`;
  const primaryRunId = `${manifestId}-primary-numerical-run-v1`;
  const primaryReceiptId =
    nhm2ExperimentReadyTheoryCandidateReceiptIdForRequest(
      primaryRuntime.runtimeId,
      primaryRequestId,
    );
  const modelId = `${manifestId}-null-authority-guard-model-v1`;
  const uncertaintyBudgetId = `${manifestId}-uncertainty-budget-v1`;
  const frozenPredictionInput: Omit<
    BuildNhm2PredictionFalsifierFreezeInput,
    "generatedAt" | "registrationBinding"
  > = {
    frozenAt,
    dataCollectionOpensAt,
    selectedProfileId: NHM2_ALPHA07_PROFILE_ID,
    freezeId: `${manifestId}-prediction-freeze-v1`,
    model: {
      modelId,
      modelVersion: "1.0.0",
      solverId: primaryRuntime.solverId,
      solverVersion: `source-${sourceCommitSha.slice(0, 12)}`,
      sourceCommitSha,
      definitionRef: seedRefByKey.candidateSeed,
      inputManifestRef: importManifestRef,
    },
    parameterSet: {
      parameterSetId: `${manifestId}-alpha07-parameter-set-v1`,
      parameterCount: 6,
      manifestRef: seedRefByKey.profile,
    },
    observables: predictionArtifacts.map((entry) => ({
      observableId: entry.observableId,
      definition: entry.definition.channel,
      unit: entry.definition.unit,
      expectedSignOrPhase:
        "null-only guard: no non-zero physical sign or phase is authorized",
      analysisWindow: "frozen pre-data acquisition window v1",
      uncertaintyBudgetId,
      predictionRef: entry.ref,
    })),
    uncertaintyBudget: {
      uncertaintyBudgetId,
      method:
        "joint covariance propagation with frozen nuisance categories; values require fresh primary evidence",
      coverageProbability: 0.95,
      sourceIds: [
        "material_response",
        "geometry",
        "readout_noise",
        "thermal_drift",
      ],
      observableIds: [...NHM2_PREDICTION_FREEZE_REQUIRED_OBSERVABLE_IDS],
      budgetRef: supportRef,
      covarianceRef: supportRef,
    },
    nullControlPlan: {
      controls: [
        {
          controlId: "matched-dummy-phase-scramble-control",
          targetObservableIds: [
            ...NHM2_PREDICTION_FREEZE_REQUIRED_OBSERVABLE_IDS,
          ],
          intervention:
            "substitute a matched passive stack and scramble the commanded phase",
          expectedOutcome:
            "all observables remain inside the frozen null distribution",
          rejectionRule:
            "block candidate interpretation if the dummy reproduces the active response",
        },
      ],
      planRef: supportRef,
    },
    blindingPlan: {
      blindedFieldIds: ["sample_identity", "drive_phase", "active_dummy_label"],
      unblindingTrigger: "analysis digest and decision ledger are frozen",
      keyCustodianRole: "pre-data-key-custodian",
      analysisRole: "blind-analysis-role",
      experimentRole: "apparatus-operations-role",
      planRef: supportRef,
    },
    decisionPlan: {
      multiplicityMethod: "Holm familywise-error correction",
      familywiseAlpha: 0.05,
      rules: [
        {
          ruleId: "tensor-phase-null-rule",
          targetObservableIds: ["DeltaTmunu_xt", "delta_phi_f"],
          statistic: "joint signed phase likelihood ratio",
          comparator: "gte",
          thresholdLower: 5,
          thresholdUpper: null,
          unit: "sigma-equivalent",
          falsifierId: "observable_sign_or_phase_not_pre_registered",
          nullDisposition: "retain the null bound",
          signalDisposition: "compare only to the immutable frozen prediction",
        },
        {
          ruleId: "clock-force-null-rule",
          targetObservableIds: ["delta_tau", "delta_F"],
          statistic: "joint clock-force likelihood ratio",
          comparator: "gte",
          thresholdLower: 5,
          thresholdUpper: null,
          unit: "sigma-equivalent",
          falsifierId: "null_controls_missing",
          nullDisposition: "retain the null bound",
          signalDisposition: "require active-versus-dummy separation",
        },
        {
          ruleId: "metric-curvature-null-rule",
          targetObservableIds: ["h00_proxy", "R_0i0j"],
          statistic: "invariant multi-probe likelihood ratio",
          comparator: "gte",
          thresholdLower: 5,
          thresholdUpper: null,
          unit: "sigma-equivalent",
          falsifierId: "prediction_changed_after_data_collection",
          nullDisposition: "retain the null bound",
          signalDisposition: "reject any post-boundary model change",
        },
      ],
      planRef: supportRef,
    },
    falsifierRegistry: {
      falsifiers: [
        {
          falsifierId: "prediction_changed_after_data_collection",
          frozenModelId: modelId,
          targetObservableIds: ["h00_proxy", "R_0i0j"],
          trigger:
            "a prediction or analysis rule changes after the data boundary",
          consequence:
            "the changed analysis is exploratory and cannot use this freeze",
        },
        {
          falsifierId: "observable_sign_or_phase_not_pre_registered",
          frozenModelId: modelId,
          targetObservableIds: ["DeltaTmunu_xt", "delta_phi_f"],
          trigger: "an asserted signal lacks the frozen sign-or-phase rule",
          consequence: "retain the null-only diagnostic interpretation",
        },
        {
          falsifierId: "null_controls_missing",
          frozenModelId: modelId,
          targetObservableIds: ["delta_tau", "delta_F"],
          trigger:
            "a required null control is absent or reproduces the active response",
          consequence: "block interpretation and retain the null bound",
        },
      ],
      registryRef: supportRef,
    },
    registrationReceipts: NHM2_PREDICTION_FREEZE_REQUIRED_RECEIPT_IDS.map(
      (receiptId) => ({
        receiptId,
        freezeId: `${manifestId}-prediction-freeze-v1`,
        selectedProfileId: NHM2_ALPHA07_PROFILE_ID,
        modelId,
        registeredAt: frozenAt,
        issuerId: "casimirbot-deterministic-pre-run-packager",
        appendOnlyRegistryId: `${manifestId}-local-pre-data-registry`,
        dataBoundary: "pre_data" as const,
        subjectRef:
          receiptId === "pre_registered_prediction_receipt"
            ? freezeManifestInputRef
            : supportRef,
        registryEntryRef: registrationRef,
        signatureRef: registrationRef,
        timestampAuthorityRef: registrationRef,
      }),
    ),
    analysisCode: {
      repository: "casimirbot/NHM2",
      sourceCommitSha,
      entrypoint: primaryRuntime.solverPath,
      deterministicSeedPolicy:
        "derive every runtime seed from candidate manifest raw SHA-256 and run ID",
      sourceTreeRef: hashedSnapshotRef(
        sourceSnapshot,
        primaryRuntime.solverPath,
        primaryRuntime.solverArtifactId,
        primaryRuntime.solverContractVersion,
      ),
      dependencyLockRef,
      environmentRef: dependencyLockRef,
      protocolRef: supportRef,
    },
    supersessionPolicy: {
      policyId: supersessionPolicy.policyId,
      policyRef: refForRendered(
        supersessionPath,
        supersessionPolicy.artifactId,
        supersessionPolicy.contractVersion,
        supersessionRendered,
      ),
    },
    freezeManifestRef: freezeManifestInputRef,
  };

  const placeholderFreeze = buildNhm2PredictionFalsifierFreeze({
    generatedAt: frozenAt,
    registrationBinding: {
      candidateId,
      candidateManifestPath: manifestPath,
      candidateManifestSha256: "0".repeat(64),
      runId: primaryRunId,
      requestId: primaryRequestId,
      receiptId: primaryReceiptId,
      runtimeId: primaryRuntime.runtimeId,
      plannedOutputDirectory: path.posix.join(
        candidateRoot,
        "runs",
        primaryRunId,
      ),
    },
    ...frozenPredictionInput,
  });
  if (!placeholderFreeze.readiness.predictionFreezeReady) {
    throw new Error(
      `frozen prediction input is incomplete: ${placeholderFreeze.readiness.blockers.join(", ")}`,
    );
  }
  const predictionFreezeSemanticInput: Nhm2PredictionFreezeSemanticInputV1 = {
    artifactId: "nhm2.prediction_falsifier_freeze_semantic_input",
    contractVersion: "nhm2_prediction_falsifier_freeze_semantic_input/v1",
    predictionFreezeContractVersion:
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_PREDICTION_FREEZE_CONTRACT_VERSION,
    semanticSha256: placeholderFreeze.semanticSha256,
    frozenInput: frozenPredictionInput,
    completionRule: {
      generatedAtMustBeInjectedAtOrAfterFrozenAt: true,
      registrationBindingMustComeFromPrimaryPlan: true,
      candidateManifestRawSha256MustBeResolvedAfterManifestWrite: true,
      semanticSha256MustRemainUnchangedAfterEnvelopeInjection: true,
    },
    historicalSeedBoundary: {
      importManifestPath: NHM2_ALPHA07_IMPORT_MANIFEST_PATH,
      runtimeId: NHM2_ALPHA07_HISTORICAL_RUNTIME_ID,
      sourceCommitSha: NHM2_ALPHA07_SOURCE_COMMIT,
      boundToExecution: false,
      artifactFreshness: "preexisting",
      diagnosticSeedOnly: true,
    },
    claimBoundary: {
      semanticInputOnly: true,
      theoryClosureClaimAllowed: false,
      empiricalValidationClaimAllowed: false,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
      routeEtaClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
    },
  };
  const predictionSemanticInputRendered = renderJson(
    predictionFreezeSemanticInput,
  );

  const candidateDefinition: Nhm2ExperimentReadyTheoryCandidateDefinitionV1 = {
    artifactId: "nhm2.experiment_ready_theory_candidate_definition",
    contractVersion: "nhm2_experiment_ready_theory_candidate_definition/v1",
    generatedAt: frozenAt,
    frozenAt,
    manifestId,
    candidateId,
    selectedProfileId: NHM2_ALPHA07_PROFILE_ID,
    committedHistoricalSeed: {
      importManifestPath: NHM2_ALPHA07_IMPORT_MANIFEST_PATH,
      importManifestSha256: importManifestRef.sha256,
      runtimeId: NHM2_ALPHA07_HISTORICAL_RUNTIME_ID,
      sourceCommitSha: NHM2_ALPHA07_SOURCE_COMMIT,
      boundToExecution: false,
      artifactFreshness: "preexisting",
      diagnosticSeedOnly: true,
      cannotSatisfyFreshRuntimeEvidence: true,
      refs: committedSeedRefs,
    },
    packagerProvenance: {
      packagerId: "casimirbot-nhm2-experiment-ready-theory-packager-v1",
      sourceCommitSha,
      sourceTreeSha: initialSourceState.tree,
      sourceSnapshotSha256: packagerSourceSnapshotSha256,
      worktreeCleanAtConstructionStart: true,
      worktreeCleanAndStableRequiredBeforeReturn: true,
      refs: packagerSourceRefs,
    },
    primaryProducerBundle: {
      bundleRef: primaryBundleBuildMetadata.bundleRef,
      buildMetadataRef: primaryBundleBuildMetadataRef,
    },
    formalProducerBundle: {
      bundleRef: formalBundleBuildMetadata.bundleRef,
      buildMetadataRef: formalBundleBuildMetadataRef,
    },
    predictionFreezeSemanticInput: {
      path: predictionFreezeSemanticInputPath,
      sha256: sha256(predictionSemanticInputRendered),
      semanticSha256: predictionFreezeSemanticInput.semanticSha256,
    },
    numericPolicy: {
      path: numericPolicyPath,
      sha256: sha256(numericPolicyRendered),
      semanticSha256: numericPolicy.semanticSha256,
    },
    claimBoundary: {
      preRunDefinitionOnly: true,
      theoryClosureClaimAllowed: false,
      empiricalValidationClaimAllowed: false,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
      routeEtaClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
    },
  };
  const candidateDefinitionRendered = renderJson(candidateDefinition);
  const candidateDefinitionRef = refForRendered(
    candidateDefinitionPath,
    candidateDefinition.artifactId,
    candidateDefinition.contractVersion,
    candidateDefinitionRendered,
  );

  type InputDescriptorKey =
    "profile" | "chart" | "atlas" | "units" | "normalization";
  const inputDescriptorSpecs: Record<
    InputDescriptorKey,
    {
      artifactId: string;
      contractVersion: string;
      identity: Record<string, string>;
      sourceRef: Nhm2PredictionFreezeHashedArtifactRefV1;
    }
  > = {
    profile: {
      artifactId: "nhm2.experiment_ready_theory_candidate_profile",
      contractVersion: "nhm2_experiment_ready_theory_candidate_profile/v1",
      identity: { selectedProfileId: NHM2_ALPHA07_PROFILE_ID },
      sourceRef: seedRefByKey.profile,
    },
    chart: {
      artifactId: "nhm2.experiment_ready_theory_candidate_chart",
      contractVersion: "nhm2_experiment_ready_theory_candidate_chart/v1",
      identity: { chartId: "comoving_cartesian" },
      sourceRef: seedRefByKey.chart,
    },
    atlas: {
      artifactId: "nhm2.experiment_ready_theory_candidate_atlas",
      contractVersion: "nhm2_experiment_ready_theory_candidate_atlas/v1",
      identity: { atlasId: `${manifestId}-alpha07-support-atlas-v1` },
      sourceRef: seedRefByKey.atlas,
    },
    units: {
      artifactId: "nhm2.experiment_ready_theory_candidate_units",
      contractVersion: "nhm2_experiment_ready_theory_candidate_units/v1",
      identity: { unitsId: "nhm2-si-same-chart-stress-energy-v1" },
      sourceRef: seedRefByKey.units,
    },
    normalization: {
      artifactId: "nhm2.experiment_ready_theory_candidate_normalization",
      contractVersion:
        "nhm2_experiment_ready_theory_candidate_normalization/v1",
      identity: {
        normalizationId: "nhm2-regional-relative-linf-support-weighted-v1",
      },
      sourceRef: seedRefByKey.normalization,
    },
  };
  const inputBindingDescriptors = (
    Object.keys(inputDescriptorSpecs) as InputDescriptorKey[]
  ).map((key) => {
    const spec = inputDescriptorSpecs[key];
    const repoPath = path.posix.join(
      inputsRoot,
      "bindings",
      `${key}-descriptor.v1.json`,
    );
    const artifact = {
      artifactId: spec.artifactId,
      contractVersion: spec.contractVersion,
      generatedAt: frozenAt,
      ...spec.identity,
      sourceRef: spec.sourceRef,
      historicalSeedBoundary: {
        importManifestPath: NHM2_ALPHA07_IMPORT_MANIFEST_PATH,
        boundToExecution: false,
        artifactFreshness: "preexisting",
        diagnosticSeedOnly: true,
      },
      claimBoundary: {
        descriptorOnly: true,
        physicalViabilityClaimAllowed: false,
        transportClaimAllowed: false,
      },
    };
    const rendered = renderJson(artifact);
    return {
      key,
      repoPath,
      rendered,
      ref: refForRendered(
        repoPath,
        spec.artifactId,
        spec.contractVersion,
        rendered,
      ),
      identity: spec.identity,
    };
  });
  const inputBindingDescriptorByKey = Object.fromEntries(
    inputBindingDescriptors.map((entry) => [entry.key, entry]),
  ) as Record<InputDescriptorKey, (typeof inputBindingDescriptors)[number]>;

  const bindings: Nhm2ExperimentReadyTheoryCandidateBindingsV1 = {
    candidate: {
      ...bindingForRef(candidateDefinitionRef),
      candidateId,
    },
    profile: {
      ...bindingForRef(inputBindingDescriptorByKey.profile.ref),
      selectedProfileId: NHM2_ALPHA07_PROFILE_ID,
    },
    chart: {
      ...bindingForRef(inputBindingDescriptorByKey.chart.ref),
      chartId: "comoving_cartesian",
    },
    atlas: {
      ...bindingForRef(inputBindingDescriptorByKey.atlas.ref),
      atlasId: `${manifestId}-alpha07-support-atlas-v1`,
    },
    units: {
      ...bindingForRef(inputBindingDescriptorByKey.units.ref),
      unitsId: "nhm2-si-same-chart-stress-energy-v1",
    },
    normalization: {
      ...bindingForRef(inputBindingDescriptorByKey.normalization.ref),
      normalizationId: "nhm2-regional-relative-linf-support-weighted-v1",
    },
  };

  const planMaterials = await Promise.all(
    NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_EXECUTION_PLAN_ROLES.map(
      async (planRole) => {
        const config = PLAN_CONFIGURATION[planRole];
        const roleToken = planRole.replace(/_/g, "-");
        const requestId = `${manifestId}-${roleToken}-request-v1`;
        const runId = `${manifestId}-${roleToken}-run-v1`;
        const receiptId = nhm2ExperimentReadyTheoryCandidateReceiptIdForRequest(
          config.runtimeId,
          requestId,
        );
        const outputDirectory = path.posix.join(candidateRoot, "runs", runId);
        const formalInvocation =
          planRole === "formal_kernel"
            ? nhm2ExperimentReadyTheoryFormalInvocation({
                candidateManifestPath: manifestPath,
                outputDirectory,
                runId,
              })
            : null;
        const cliArgs =
          formalInvocation?.cliArgs ??
          (["--candidate-manifest", manifestPath] as const);
        const solverRef = hashedSnapshotRef(
          sourceSnapshot,
          config.solverPath,
          `${config.solverArtifactId}.source`,
          "typescript_source/v1",
        );
        const solverVersion = `source-${sourceCommitSha.slice(0, 12)}`;
        const solverDescriptorPath = path.posix.join(
          inputsRoot,
          "plans",
          planRole,
          "solver-descriptor.v1.json",
        );
        const solverDescriptor = {
          artifactId: config.solverArtifactId,
          contractVersion: config.solverContractVersion,
          generatedAt: frozenAt,
          planRole,
          solverId: config.solverId,
          solverVersion,
          implementationId: config.implementationId,
          sourceCommitSha,
          sourceRef: solverRef,
          ...(planRole === "primary_numerical"
            ? {
                bundleRef: primaryBundleBuildMetadata.bundleRef,
                bundleBuildMetadataRef: primaryBundleBuildMetadataRef,
              }
            : planRole === "formal_kernel"
              ? {
                  bundleRef: formalBundleBuildMetadata.bundleRef,
                  bundleBuildMetadataRef: formalBundleBuildMetadataRef,
                }
              : {}),
          claimBoundary: {
            executionDescriptorOnly: true,
            successfulExecutionNotAsserted: true,
            physicalViabilityClaimAllowed: false,
          },
        } as const;
        const solverDescriptorRendered = renderJson(solverDescriptor);
        const solverDescriptorRef = refForRendered(
          solverDescriptorPath,
          solverDescriptor.artifactId,
          solverDescriptor.contractVersion,
          solverDescriptorRendered,
        );
        const environmentId = `${manifestId}-${roleToken}-environment-v1`;
        const environmentDescriptorPath = path.posix.join(
          inputsRoot,
          "plans",
          planRole,
          "environment-lock.v1.json",
        );
        const environmentDescriptor = {
          artifactId: `nhm2.${planRole}_environment_lock`,
          contractVersion: `nhm2_${planRole}_environment_lock/v1`,
          generatedAt: frozenAt,
          planRole,
          environmentId,
          sourceCommitSha,
          dependencyLockRef,
          runtime:
            planRole === "primary_numerical" || planRole === "formal_kernel"
              ? {
                  engine: "node",
                  moduleFormat: "esm",
                  standaloneBundle: true,
                  runtimeNodeModulesRequired: false,
                  bundledDependencyClosureAttested: true,
                  hostNodeRuntime,
                }
              : {
                  engine: "npm",
                  packageManager: "npm",
                  dependencyLockKind: "package-lock.json",
                  standaloneBundle: false,
                  runtimeNodeModulesRequired: true,
                  bundledDependencyClosureAttested: false,
                },
          claimBoundary: {
            environmentDescriptorOnly: true,
            successfulExecutionNotAsserted: true,
            physicalViabilityClaimAllowed: false,
          },
        } as const;
        const environmentDescriptorRendered = renderJson(environmentDescriptor);
        const environmentDescriptorRef = refForRendered(
          environmentDescriptorPath,
          environmentDescriptor.artifactId,
          environmentDescriptor.contractVersion,
          environmentDescriptorRendered,
        );
        const plan: Nhm2ExperimentReadyTheoryCandidateExecutionPlanV1 = {
          planRole,
          requestId,
          runId,
          receiptId,
          runtimeId: config.runtimeId,
          sourceCommitSha,
          deterministicSeedPolicy:
            "seed=sha256(candidateManifestRawSha256 + NUL + runId)",
          solver: {
            ...bindingForRef(solverDescriptorRef),
            solverId: config.solverId,
            solverVersion,
            implementationId: config.implementationId,
          },
          environmentLock: {
            ...bindingForRef(environmentDescriptorRef),
            environmentId,
          },
          expectedInvocation: {
            entrypoint:
              formalInvocation?.entrypoint ??
              `npm run ${config.npmScript} -- ${cliArgs.join(" ")}`,
            command: formalInvocation?.command ?? "npm",
            args: formalInvocation?.args ?? [
              "run",
              "-s",
              config.npmScript,
              "--",
              ...cliArgs,
            ],
            cwd: formalInvocation?.cwd ?? ".",
            environment: environmentForPlan({
              bindings,
              outputDirectory,
              requestId,
              receiptId,
              runtimeId: config.runtimeId,
              runId,
            }),
            outputDirectory,
          },
        };
        return {
          plan,
          descriptorFiles: [
            [solverDescriptorPath, solverDescriptorRendered],
            [environmentDescriptorPath, environmentDescriptorRendered],
          ] as const,
        };
      },
    ),
  );
  const executionPlans = planMaterials.map((entry) => entry.plan);
  const planDescriptorFiles = planMaterials.flatMap(
    (entry) => entry.descriptorFiles,
  );

  const manifest = buildNhm2ExperimentReadyTheoryCandidateManifest({
    generatedAt: frozenAt,
    frozenAt,
    manifestId,
    bindings,
    executionPlans,
    expectedEvidenceOutputs:
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_REQUIRED_EVIDENCE_ROLES.map(
        (evidenceRole) => {
          const plan = executionPlans.find(
            (entry) => entry.planRole === planRoleForEvidence(evidenceRole),
          );
          if (plan == null) throw new Error(`missing plan for ${evidenceRole}`);
          return {
            evidenceRole,
            outputPath: path.posix.join(
              plan.expectedInvocation.outputDirectory,
              "evidence",
              `${evidenceRole}.json`,
            ),
            contractVersion:
              NHM2_EXPERIMENT_READY_THEORY_CLOSURE_EVIDENCE_CONTRACT_VERSIONS[
                evidenceRole
              ],
            requestId: plan.requestId,
            runId: plan.runId,
            receiptId: plan.receiptId,
            runtimeId: plan.runtimeId,
          };
        },
      ),
    predictionFreezeCommitment: {
      contractVersion:
        NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_PREDICTION_FREEZE_CONTRACT_VERSION,
      semanticSha256: predictionFreezeSemanticInput.semanticSha256,
      frozenAt,
    },
    numericCheckPolicySet: {
      artifactId:
        NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_NUMERIC_POLICY_SET_ARTIFACT_ID,
      contractVersion:
        NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_NUMERIC_POLICY_SET_CONTRACT_VERSION,
      policySetId: numericPolicy.policySetId,
      artifactPath: numericPolicyPath,
      artifactRawSha256: sha256(numericPolicyRendered),
      semanticSha256: numericPolicy.semanticSha256,
    },
    supersession: {
      policyId: supersessionPolicy.policyId,
      policyPath: supersessionPath,
      policyContractVersion: supersessionPolicy.contractVersion,
      policySha256: sha256(supersessionRendered),
      originalManifestImmutable: true,
      inPlaceMutationForbidden: true,
      supersedingManifestRequiresNewManifestId: true,
      supersedingManifestRequiresPredecessorSha256: true,
      predecessorManifestId: null,
      predecessorManifestSha256: null,
    },
  });
  if (
    manifest.readiness.status !== "pre_run_manifest_ready" ||
    !isNhm2ExperimentReadyTheoryCandidateManifest(manifest)
  ) {
    throw new Error(
      `candidate manifest is not pre-run ready: ${manifest.readiness.blockers.join(", ")}`,
    );
  }

  const manifestRendered = renderJson(manifest);
  const outputFiles = [
    [primaryProducerBundlePath, finalBundlePass.bytes],
    [
      primaryProducerBundleBuildMetadataPath,
      primaryBundleBuildMetadataRendered,
    ],
    [formalProducerBundlePath, finalFormalBundlePass.bytes],
    [formalProducerBundleBuildMetadataPath, formalBundleBuildMetadataRendered],
    [numericPolicyPath, numericPolicyRendered],
    [supersessionPath, supersessionRendered],
    [supportPath, supportRendered],
    [registrationPath, registrationRendered],
    [freezeManifestInputPath, freezeManifestInputRendered],
    ...predictionArtifacts.map(
      (entry) => [entry.repoPath, entry.rendered] as const,
    ),
    [predictionFreezeSemanticInputPath, predictionSemanticInputRendered],
    [candidateDefinitionPath, candidateDefinitionRendered],
    ...inputBindingDescriptors.map(
      (entry) => [entry.repoPath, entry.rendered] as const,
    ),
    ...planDescriptorFiles,
    [manifestPath, manifestRendered],
  ] as const;
  const stagingAbsolute = path.resolve(repoRoot, stagingRoot);
  const finalAbsolute = path.resolve(repoRoot, candidateRoot);
  let published = false;
  let renamed = false;
  try {
    const createdStagingRoot = await ensureSafeDirectoryChain({
      repoRoot,
      realRepoRoot,
      repoPath: stagingRoot,
      label: "candidate staging root",
    });
    for (const [repoPath, rendered] of outputFiles) {
      const relative = path.posix.relative(candidateRoot, repoPath);
      if (
        relative.length === 0 ||
        relative.startsWith("..") ||
        path.posix.isAbsolute(relative)
      ) {
        throw new Error(
          `candidate output is not contained by its immutable root: ${repoPath}`,
        );
      }
      await writeNew(
        repoRoot,
        realRepoRoot,
        createdStagingRoot.realPath,
        path.posix.join(stagingRoot, relative),
        rendered,
      );
    }
    for (const directoryName of [
      "runs",
      NHM2_EXPERIMENT_READY_THEORY_FORMAL_PRESEAL_DIRECTORY_NAME,
    ] as const) {
      await ensureSafeDirectoryChain({
        repoRoot,
        realRepoRoot,
        repoPath: path.posix.join(stagingRoot, directoryName),
        label: `candidate ${directoryName} parent`,
      });
    }

    await dependencies.beforeFinalSourceStabilityCheck?.();
    const finalSourceState = await resolveGitSourceState(repoRoot);
    if (
      !finalSourceState.clean ||
      finalSourceState.head !== initialSourceState.head ||
      finalSourceState.tree !== initialSourceState.tree ||
      finalSourceState.statusSha256 !== initialSourceState.statusSha256
    ) {
      throw new Error(
        "Git HEAD, tree, or entire worktree changed during candidate construction",
      );
    }
    const finalSourceSnapshot = await snapshotPinnedSources({
      repoRoot,
      realRepoRoot,
      repoPaths: uniqueTrackedInputs,
    });
    for (const [repoPath, initial] of sourceSnapshot) {
      if (finalSourceSnapshot.get(repoPath)?.sha256 !== initial.sha256) {
        throw new Error(
          `pinned source changed during candidate construction: ${repoPath}`,
        );
      }
    }
    const finalHostNodeRuntime = await snapshotHostNodeRuntime();
    if (
      JSON.stringify(finalHostNodeRuntime) !== JSON.stringify(hostNodeRuntime)
    ) {
      throw new Error(
        "host-specific Node runtime fingerprint changed during candidate construction",
      );
    }

    await ensureOutputRootAvailable(repoRoot, realRepoRoot, candidateRoot);
    await fs.rename(stagingAbsolute, finalAbsolute);
    renamed = true;
    const finalStat = await fs.lstat(finalAbsolute);
    const finalRealPath = await fs.realpath(finalAbsolute);
    const finalRelative = path.relative(realRepoRoot, finalRealPath);
    if (
      finalStat.isSymbolicLink() ||
      !finalStat.isDirectory() ||
      finalRelative.length === 0 ||
      finalRelative.startsWith("..") ||
      path.isAbsolute(finalRelative)
    ) {
      throw new Error(
        "published candidate root failed final containment validation",
      );
    }
    published = true;
  } finally {
    if (!published) {
      const cleanupTarget = renamed ? finalAbsolute : stagingAbsolute;
      const cleanupRelative = path.relative(repoRoot, cleanupTarget);
      const cleanupName = path.basename(cleanupTarget);
      if (
        cleanupRelative.length > 0 &&
        !cleanupRelative.startsWith("..") &&
        !path.isAbsolute(cleanupRelative) &&
        (cleanupName === manifestId ||
          cleanupName.startsWith(`.${manifestId}.staging-`))
      ) {
        await fs.rm(cleanupTarget, { recursive: true, force: true });
      }
    }
  }

  return {
    candidateRoot,
    manifestPath,
    manifestRawSha256: sha256(manifestRendered),
    numericPolicyPath,
    predictionFreezeSemanticInputPath,
    candidateDefinitionPath,
    primaryProducerBundlePath,
    primaryProducerBundleBuildMetadataPath,
    formalProducerBundlePath,
    formalProducerBundleBuildMetadataPath,
    manifest,
    predictionFreezeSemanticInput,
    candidateDefinition,
  };
}

const parseArgs = (argv: readonly string[]): Record<string, string> => {
  const parsed: Record<string, string> = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (
      key == null ||
      !key.startsWith("--") ||
      value == null ||
      value.startsWith("--")
    ) {
      throw new Error(
        `arguments must be --key value pairs; invalid token: ${key ?? "<missing>"}`,
      );
    }
    parsed[key.slice(2)] = value;
  }
  const allowed = new Set([
    "repo-root",
    "output-base",
    "manifest-id",
    "candidate-id",
    "frozen-at",
    "data-collection-opens-at",
  ]);
  const unknown = Object.keys(parsed).filter((key) => !allowed.has(key));
  if (unknown.length > 0)
    throw new Error(`unknown arguments: ${unknown.join(", ")}`);
  return parsed;
};

const main = async (): Promise<void> => {
  const args = parseArgs(process.argv.slice(2));
  if (args["manifest-id"] == null || args["frozen-at"] == null) {
    throw new Error("--manifest-id and --frozen-at are required");
  }
  const result = await prepareNhm2ExperimentReadyTheoryCandidate({
    repoRoot: args["repo-root"],
    outputBaseDirectory: args["output-base"],
    manifestId: args["manifest-id"],
    candidateId: args["candidate-id"],
    frozenAt: args["frozen-at"],
    dataCollectionOpensAt: args["data-collection-opens-at"],
  });
  process.stdout.write(
    `PASS ${result.manifestPath} (${result.manifest.executionPlans.length} plans; ${result.manifest.expectedEvidenceOutputs.length} evidence expectations; physical claims false)\n`,
  );
};

const invokedPath = process.argv[1]
  ? path.normalize(path.resolve(process.argv[1]))
  : "";
const modulePath = path.normalize(fileURLToPath(import.meta.url));
if (invokedPath.toLowerCase() === modulePath.toLowerCase()) {
  main().catch((error) => {
    process.stderr.write(`${(error as Error).message}\n`);
    process.exitCode = 1;
  });
}
