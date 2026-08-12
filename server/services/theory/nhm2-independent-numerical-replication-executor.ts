import { createHash } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  isNhm2ExperimentReadyTheoryCandidateManifest,
  nhm2ExperimentReadyTheoryCandidateReceiptIdForRequest,
  type Nhm2ExperimentReadyTheoryCandidateExecutionPlanV1,
  type Nhm2ExperimentReadyTheoryCandidateManifestV1,
} from "../../../shared/contracts/nhm2-experiment-ready-theory-candidate-manifest.v1";
import {
  NHM2_INDEPENDENT_NUMERICAL_APPROVED_TOOLCHAIN_POLICY_ARTIFACT_ID,
  NHM2_INDEPENDENT_NUMERICAL_APPROVED_TOOLCHAIN_POLICY_CONTRACT_VERSION,
  isNhm2IndependentNumericalExecutionDescriptorV1,
  type Nhm2IndependentNumericalExternalExecutionDescriptorV1,
} from "../../../shared/contracts/nhm2-independent-numerical-execution-descriptor.v1";
import {
  isTheoryRuntimeReceiptV1,
  type TheoryRuntimeReceiptV1,
} from "../../../shared/contracts/theory-runtime-receipt.v1";
import {
  NHM2_PRIMARY_PRODUCER_BUNDLE_ARTIFACT_ID,
  NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_ARTIFACT_ID,
  NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_CONTRACT_VERSION,
  NHM2_PRIMARY_PRODUCER_BUNDLE_SCHEMA_VERSION,
  isNhm2PrimaryProducerBundleBuildMetadata,
  type Nhm2PrimaryProducerBundleBuildMetadataV1,
  type Nhm2PrimaryProducerBundleRefV1,
} from "../../../shared/contracts/nhm2-primary-producer-bundle.v1";
import { NHM2_SEMICLASSICAL_V2_RAW_REPLAY_SCIENTIFIC_INPUT_IDS } from "../../../shared/contracts/nhm2-semiclassical-v2-raw-replay-manifest.v1";
import { getTheoryRuntimeEntrypoint } from "../../../shared/theory/runtime-entrypoints";
import { THEORY_RUNTIME_WORKSTATION_GRAPH_ID } from "../../../shared/theory/runtime-execution-policy";
import {
  executeNhm2ExternalNumericalKernel,
  Nhm2ExternalNumericalKernelExecutorError,
  type Nhm2ExternalNumericalKernelObservationV1,
  type Nhm2ExternalNumericalKernelProcessObservationV1,
  type Nhm2ExternalNumericalKernelRunSpecV1,
} from "./nhm2-external-numerical-kernel-executor";
import {
  readTheoryRuntimeReceiptArtifact,
  type TheoryRuntimePersistedReceiptRefV1,
} from "./theory-runtime-receipt-store";
import {
  verifyTheoryRuntimeReceiptFilesystem,
  type TheoryRuntimeReceiptFilesystemVerificationV1,
} from "./theory-runtime-receipt-filesystem-verifier";

export const NHM2_INDEPENDENT_NUMERICAL_EXECUTION_OBSERVATION_VERSION =
  "nhm2_independent_numerical_execution_observation/v1" as const;
export const NHM2_INDEPENDENT_NUMERICAL_PRESEALED_RUN_SPEC_VERSION =
  "nhm2_independent_numerical_presealed_run_spec/v2" as const;
export const NHM2_INDEPENDENT_NUMERICAL_APPROVED_TOOLCHAIN_POLICY_VERSION =
  NHM2_INDEPENDENT_NUMERICAL_APPROVED_TOOLCHAIN_POLICY_CONTRACT_VERSION;
export const NHM2_INDEPENDENT_NUMERICAL_SOLVER_FAMILY =
  "independent_replication_suite" as const;

const POLICY_AUTHORITY = "server_owned_immutable_allowlist" as const;
const POLICY_STATUS =
  "approved_for_diagnostic_independent_execution_only" as const;
const RUNTIME_ID = "nhm2.experiment_ready_theory.independent" as const;
const PRIMARY_RUNTIME_ID = "nhm2.experiment_ready_theory.primary" as const;
const NPM_SCRIPT = "warp:full-solve:nhm2:theory-candidate:independent" as const;
const SHA256 = /^[a-f0-9]{64}$/;
const SEMICLASSICAL_V2_INPUT_CLOSURE_BLOCKER =
  "independent_semiclassical_v2_scientific_input_closure_not_integrated" as const;

const PRIMARY_RECEIPT_SCALAR_KEYS = [
  "expectedEvidenceCount",
  "primaryEvidenceRootCount",
  "supplementaryRunOwnedArtifactCount",
  "totalRunOwnedArtifactCount",
  "freshEvidenceCount",
  "predictionFreezeReady",
  "hermeticDependencyTreeAttested",
  "runtimeNodeModulesRequired",
  "hostSpecificDiagnosticRuntimeClosure",
  "operatingSystemHermeticityAsserted",
  "nodeRuntimeReproducibilityAsserted",
  "inheritedProcessEnvironment",
  "primaryNumericalEvidenceReady",
  "primaryNumericalEvidenceFalsified",
  "primaryComparisonProjectionAssessmentPublished",
  "primaryComparisonProjectionReady",
  "experimentReadyTheoryClosureClaimAllowed",
  "physicalViabilityClaimAllowed",
  "transportClaimAllowed",
  "propulsionClaimAllowed",
  "routeEtaClaimAllowed",
  "speedAuthorityClaimAllowed",
] as const;

const PRIMARY_RECEIPT_FALSE_CLAIM_SCALAR_KEYS = [
  "primaryComparisonProjectionReady",
  "experimentReadyTheoryClosureClaimAllowed",
  "physicalViabilityClaimAllowed",
  "transportClaimAllowed",
  "propulsionClaimAllowed",
  "routeEtaClaimAllowed",
  "speedAuthorityClaimAllowed",
] as const;

const PRIMARY_RECEIPT_GATE_KEYS = [
  "runtime_execution",
  "runtime_execution_provenance",
  "runtime_artifact_freshness",
  "run_owned_nested_reference_closure",
  "primary_evidence_inventory",
  "primary_numerical_evidence",
  "primary_comparison_projection",
  "experiment_ready_theory_closure",
  "prediction_falsifier_freeze",
] as const;

const CLAIM_BOUNDARY = Object.freeze({
  externalProcessObservationOnly: true as const,
  independentImplementationLineageEstablished: false as const,
  exactWholeFileCopyCheckIsTripwireOnly: true as const,
  primaryContentLineageExclusionEstablished: false as const,
  fieldLevelScientificReplayRequired: true as const,
  passingIndependentReplicationArtifactMayBeEmitted: false as const,
  syntheticFallbackForbidden: true as const,
  primaryOutputCopyingForbidden: true as const,
  theoryClosureClaimAllowed: false as const,
  empiricalValidationEstablished: false as const,
  physicalViabilityClaimAllowed: false as const,
  transportClaimAllowed: false as const,
  propulsionClaimAllowed: false as const,
  routeEtaClaimAllowed: false as const,
  speedAuthorityClaimAllowed: false as const,
});

const INPUT_ISOLATION_SAFEGUARD = Object.freeze({
  childInputAuthority:
    "frozen_candidate_manifest_administrative_closure" as const,
  presealPrimaryReceiptForbidden: true as const,
  presealPrimaryOutputInventoryForbidden: true as const,
  primaryOutputPathsGrantedToChild: false as const,
  primaryOutputHashesGrantedToChild: false as const,
  primaryOutputBytesGrantedToChild: false as const,
  serverRetainsPrimaryOutputsForPostRunComparisonOnly: true as const,
  presealMustPredatePrimaryExecution: true as const,
  semiclassicalV2ScientificInputClosureRequired: true as const,
  semiclassicalV2ScientificInputClosureIntegrated: false as const,
  semiclassicalV2RequiredScientificInputCount:
    NHM2_SEMICLASSICAL_V2_RAW_REPLAY_SCIENTIFIC_INPUT_IDS.length,
  admittedAdministrativeInputCount: 8 as const,
  operatingSystemPrimaryOutputIsolationAsserted: false as const,
});

const CANDIDATE_INPUT_LAYOUT = [
  {
    role: "candidate_manifest",
    inputRelativePath: "candidate/manifest.json",
  },
  {
    role: "candidate_definition",
    inputRelativePath: "candidate/definition.json",
  },
  { role: "profile", inputRelativePath: "candidate/profile.json" },
  { role: "chart", inputRelativePath: "candidate/chart.json" },
  { role: "atlas", inputRelativePath: "candidate/atlas.json" },
  { role: "units", inputRelativePath: "candidate/units.json" },
  {
    role: "normalization",
    inputRelativePath: "candidate/normalization.json",
  },
  {
    role: "numeric_policy_set",
    inputRelativePath: "candidate/numeric-policy-set.json",
  },
] as const;

export type Nhm2IndependentNumericalCandidateInputRole =
  (typeof CANDIDATE_INPUT_LAYOUT)[number]["role"];

export type Nhm2IndependentNumericalApprovedToolchainPolicyV1 = {
  artifactId: typeof NHM2_INDEPENDENT_NUMERICAL_APPROVED_TOOLCHAIN_POLICY_ARTIFACT_ID;
  contractVersion: typeof NHM2_INDEPENDENT_NUMERICAL_APPROVED_TOOLCHAIN_POLICY_CONTRACT_VERSION;
  policyId: string;
  semanticSha256: string;
  approvedAt: string;
  authority: typeof POLICY_AUTHORITY;
  status: typeof POLICY_STATUS;
  target: {
    platform: NodeJS.Platform;
    architecture: string;
  };
  solver: {
    family: typeof NHM2_INDEPENDENT_NUMERICAL_SOLVER_FAMILY;
    solverId: string;
    implementationId: string;
    version: string;
    independenceGroup: string;
    implementationSourceClosureSha256: string;
  };
  toolchain: {
    ledgerSha256: string;
    executableSha256: string;
    executableSizeBytes: number;
  };
  environment: {
    allowlist: string[];
    values: Record<string, string>;
  };
  claimBoundary: typeof CLAIM_BOUNDARY;
};

export type Nhm2IndependentNumericalCandidateInputBindingV2 = {
  role: Nhm2IndependentNumericalCandidateInputRole;
  sourcePath: string;
  inputRelativePath: string;
  sha256: string;
  sizeBytes: number;
};

export type Nhm2IndependentNumericalCandidateInputClosureV2 = {
  authority: "frozen_candidate_manifest_administrative_closure";
  semanticSha256: string;
  inputLedgerSha256: string;
  entries: Nhm2IndependentNumericalCandidateInputBindingV2[];
};

export type Nhm2IndependentNumericalPresealedRunSpecV2 = {
  artifactId: "nhm2.independent_numerical_presealed_run_spec";
  contractVersion: typeof NHM2_INDEPENDENT_NUMERICAL_PRESEALED_RUN_SPEC_VERSION;
  generatedAt: string;
  candidateManifest: { path: string; sha256: string };
  independentPlan: {
    requestId: string;
    runId: string;
    receiptId: string;
    runtimeId: string;
  };
  candidateInputClosure: Nhm2IndependentNumericalCandidateInputClosureV2;
  approvedPolicy: { policyId: string; semanticSha256: string };
  kernel: Nhm2ExternalNumericalKernelRunSpecV1;
  inputIsolation: typeof INPUT_ISOLATION_SAFEGUARD;
  claimBoundary: typeof CLAIM_BOUNDARY;
};

export type Nhm2IndependentNumericalExecutionStatus =
  "not_ready" | "execution_observed_scientific_replay_required";

export type Nhm2IndependentNumericalExecutionObservationV1 = {
  artifactId: "nhm2.independent_numerical_execution_observation";
  contractVersion: typeof NHM2_INDEPENDENT_NUMERICAL_EXECUTION_OBSERVATION_VERSION;
  generatedAt: string;
  status: Nhm2IndependentNumericalExecutionStatus;
  candidate: {
    manifestPath: string;
    manifestSha256: string | null;
    candidateId: string | null;
  };
  plan: {
    requestId: string | null;
    runId: string | null;
    receiptId: string | null;
    runtimeId: string | null;
    solverId: string | null;
    implementationId: string | null;
    independenceGroup: string | null;
  };
  approvedPolicy: {
    policyId: string | null;
    semanticSha256: string | null;
  };
  primaryReceipt: {
    receiptId: string | null;
    path: string | null;
    sha256: string | null;
    filesystemVerified: boolean;
  };
  persistedPreseal: {
    path: string | null;
    sha256: string | null;
    writtenAt: string | null;
    hashAddressVerified: boolean;
  };
  inputIsolation: typeof INPUT_ISOLATION_SAFEGUARD & {
    candidateInputClosureVerified: boolean;
    kernelInputLedgerCandidateOnlyVerified: boolean;
    presealPredatesPrimaryExecutionVerified: boolean;
    serverPostRunComparisonAccessVerified: boolean;
  };
  kernelObservation: Nhm2ExternalNumericalKernelObservationV1 | null;
  failedProcessObservation: Nhm2ExternalNumericalKernelProcessObservationV1 | null;
  independentReplicationArtifact: null;
  independentNumericalReplicationReady: false;
  blockers: string[];
  claimBoundary: typeof CLAIM_BOUNDARY;
};

export type ExecuteNhm2IndependentNumericalReplicationInput = {
  projectRoot?: string;
  candidateManifestPath: string;
  execute: true;
};

type PersistedPrimaryReceipt = {
  receipt: TheoryRuntimeReceiptV1;
  artifact: TheoryRuntimePersistedReceiptRefV1;
};

type PersistedIndependentPreseal = {
  artifact: {
    artifactId: "nhm2.independent_numerical_persisted_preseal";
    schemaVersion: "nhm2_independent_numerical_persisted_preseal/v1";
    path: string;
    sha256: string;
    sizeBytes: number;
    writtenAt: string;
  };
  bytes: Uint8Array;
};

export type Nhm2IndependentNumericalCandidateContext = {
  manifest: Nhm2ExperimentReadyTheoryCandidateManifestV1;
  manifestSha256: string;
  independentPlan: Nhm2ExperimentReadyTheoryCandidateExecutionPlanV1;
  primaryPlan: Nhm2ExperimentReadyTheoryCandidateExecutionPlanV1;
  independentDescriptor: Nhm2IndependentNumericalExternalExecutionDescriptorV1;
};

export type Nhm2IndependentNumericalPrimaryBundleLineageV1 = {
  candidateManifestSha256: string;
  primaryPlan: {
    requestId: string;
    runtimeId: string;
    receiptId: string;
    solverId: string;
    implementationId: string;
    solverDescriptorSha256: string;
    environmentLockSha256: string;
  };
  producerBundle: {
    path: string;
    sha256: string;
    sizeBytes: number;
  };
  buildMetadata: {
    path: string;
    sha256: string;
    sourceSnapshotSha256: string;
  };
};

export type Nhm2IndependentNumericalExecutorTestDependencies = {
  loadApprovedPolicy?: (input: {
    projectRoot: string;
  }) => Promise<Nhm2IndependentNumericalApprovedToolchainPolicyV1 | null>;
  now?: () => Date;
  loadCandidateContext?: (input: {
    projectRoot: string;
    manifestPath: string;
    executionStartsAt: string;
  }) => Promise<Nhm2IndependentNumericalCandidateContext>;
  loadPrimaryBundleLineage?: (input: {
    projectRoot: string;
    context: Nhm2IndependentNumericalCandidateContext;
  }) => Promise<Nhm2IndependentNumericalPrimaryBundleLineageV1>;
  readPersistedPreseal?: (input: {
    projectRoot: string;
    manifestPath: string;
    requestId: string;
    runId: string;
    receiptId: string;
  }) => Promise<PersistedIndependentPreseal | null>;
  readPrimaryReceipt?: (input: {
    projectRoot: string;
    runtimeId: string;
    requestId: string;
    receiptId: string;
  }) => Promise<PersistedPrimaryReceipt | null>;
  verifyPrimaryReceipt?: (input: {
    projectRoot: string;
    receipt: TheoryRuntimeReceiptV1;
  }) => Promise<TheoryRuntimeReceiptFilesystemVerificationV1>;
  executeKernel?: typeof executeNhm2ExternalNumericalKernel;
};

const loadInstalledApprovedPolicy = async (_input: {
  projectRoot: string;
}): Promise<null> => null;
const readInstalledPersistedPreseal = async (_input: {
  projectRoot: string;
  manifestPath: string;
  requestId: string;
  runId: string;
  receiptId: string;
}): Promise<null> => null;
const serverNow = (): Date => new Date();

class Nhm2IndependentNumericalAdmissionError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "Nhm2IndependentNumericalAdmissionError";
    this.code = code;
  }
}

function fail(code: string, message: string): never {
  throw new Nhm2IndependentNumericalAdmissionError(code, message);
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const hasExactKeys = (
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean => {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return JSON.stringify(actual) === JSON.stringify(expected);
};

const stable = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stable);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, stable(entry)]),
  );
};

const sha256 = (value: Uint8Array | string): string =>
  createHash("sha256").update(value).digest("hex");

export function computeNhm2IndependentNumericalCandidateInputClosureSha256(
  closure: Omit<
    Nhm2IndependentNumericalCandidateInputClosureV2,
    "semanticSha256"
  >,
): string {
  return sha256(
    JSON.stringify({
      domain: "nhm2_independent_candidate_input_closure_semantic/v2",
      closure: stable(closure),
    }),
  );
}

const exactIso = (value: unknown): value is string =>
  typeof value === "string" &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString() === value;

const isPortableRepoPath = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  value === value.replace(/\\/g, "/") &&
  !path.posix.isAbsolute(value) &&
  !path.win32.isAbsolute(value) &&
  !value
    .split("/")
    .some((entry) => entry === "" || entry === "." || entry === "..") &&
  !/(^|\/)latest(?:\.|\/|$)/i.test(value);

const inside = (root: string, candidate: string): boolean => {
  const relative = path.relative(root, candidate);
  return (
    relative.length > 0 &&
    !relative.startsWith("..") &&
    !path.isAbsolute(relative)
  );
};

const samePath = (left: string, right: string): boolean => {
  const normalize = (value: string) => {
    const resolved = path.resolve(value);
    return process.platform === "win32" ? resolved.toLowerCase() : resolved;
  };
  return normalize(left) === normalize(right);
};

const absolutePathsOverlap = (left: string, right: string): boolean =>
  samePath(left, right) || inside(left, right) || inside(right, left);

const exactClaimBoundary = (value: unknown): boolean =>
  JSON.stringify(stable(value)) === JSON.stringify(stable(CLAIM_BOUNDARY));

const exactInputIsolationSafeguard = (value: unknown): boolean =>
  JSON.stringify(stable(value)) ===
  JSON.stringify(stable(INPUT_ISOLATION_SAFEGUARD));

export function computeNhm2IndependentNumericalApprovedToolchainPolicySemanticSha256(
  policy: Omit<
    Nhm2IndependentNumericalApprovedToolchainPolicyV1,
    "semanticSha256"
  >,
): string {
  return sha256(
    JSON.stringify({
      domain:
        "nhm2_independent_numerical_approved_toolchain_policy_semantic/v1",
      policy: stable(policy),
    }),
  );
}

export function assertNhm2IndependentNumericalApprovedToolchainPolicy(
  value: unknown,
): asserts value is Nhm2IndependentNumericalApprovedToolchainPolicyV1 {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "approvedAt",
      "artifactId",
      "authority",
      "claimBoundary",
      "contractVersion",
      "environment",
      "policyId",
      "semanticSha256",
      "solver",
      "status",
      "target",
      "toolchain",
    ]) ||
    value.artifactId !==
      NHM2_INDEPENDENT_NUMERICAL_APPROVED_TOOLCHAIN_POLICY_ARTIFACT_ID ||
    value.contractVersion !==
      NHM2_INDEPENDENT_NUMERICAL_APPROVED_TOOLCHAIN_POLICY_CONTRACT_VERSION ||
    typeof value.policyId !== "string" ||
    value.policyId.trim().length === 0 ||
    typeof value.semanticSha256 !== "string" ||
    !SHA256.test(value.semanticSha256) ||
    !exactIso(value.approvedAt) ||
    value.authority !== POLICY_AUTHORITY ||
    value.status !== POLICY_STATUS ||
    !isRecord(value.target) ||
    !hasExactKeys(value.target, ["architecture", "platform"]) ||
    value.target.platform !== process.platform ||
    value.target.architecture !== process.arch ||
    !isRecord(value.solver) ||
    !hasExactKeys(value.solver, [
      "family",
      "implementationId",
      "implementationSourceClosureSha256",
      "independenceGroup",
      "solverId",
      "version",
    ]) ||
    value.solver.family !== NHM2_INDEPENDENT_NUMERICAL_SOLVER_FAMILY ||
    [
      value.solver.solverId,
      value.solver.implementationId,
      value.solver.version,
      value.solver.independenceGroup,
    ].some((entry) => typeof entry !== "string" || entry.trim().length === 0) ||
    typeof value.solver.implementationSourceClosureSha256 !== "string" ||
    !SHA256.test(value.solver.implementationSourceClosureSha256) ||
    !isRecord(value.toolchain) ||
    !hasExactKeys(value.toolchain, [
      "executableSha256",
      "executableSizeBytes",
      "ledgerSha256",
    ]) ||
    typeof value.toolchain.ledgerSha256 !== "string" ||
    !SHA256.test(value.toolchain.ledgerSha256) ||
    typeof value.toolchain.executableSha256 !== "string" ||
    !SHA256.test(value.toolchain.executableSha256) ||
    !Number.isSafeInteger(value.toolchain.executableSizeBytes) ||
    (value.toolchain.executableSizeBytes as number) <= 0 ||
    !isRecord(value.environment) ||
    !hasExactKeys(value.environment, ["allowlist", "values"]) ||
    !Array.isArray(value.environment.allowlist) ||
    !value.environment.allowlist.every(
      (entry) =>
        typeof entry === "string" && /^[A-Za-z_][A-Za-z0-9_]*$/.test(entry),
    ) ||
    new Set(value.environment.allowlist).size !==
      value.environment.allowlist.length ||
    value.environment.allowlist.some(
      (entry, index, all) => index > 0 && all[index - 1] >= entry,
    ) ||
    !isRecord(value.environment.values) ||
    JSON.stringify(Object.keys(value.environment.values).sort()) !==
      JSON.stringify(value.environment.allowlist) ||
    Object.values(value.environment.values).some(
      (entry) => typeof entry !== "string" || entry.includes("\0"),
    ) ||
    !exactClaimBoundary(value.claimBoundary)
  ) {
    fail(
      "independent_approved_toolchain_policy_invalid",
      "Independent numerical execution requires an exact server-owned approved toolchain policy.",
    );
  }
  const { semanticSha256, ...semantic } =
    value as Nhm2IndependentNumericalApprovedToolchainPolicyV1;
  if (
    semanticSha256 !==
    computeNhm2IndependentNumericalApprovedToolchainPolicySemanticSha256(
      semantic,
    )
  ) {
    fail(
      "independent_approved_toolchain_policy_digest_mismatch",
      "Approved independent toolchain policy semantic digest is invalid.",
    );
  }
}

type PinnedArtifactRead = { bytes: Buffer; sha256: string };

async function readPinnedArtifact(input: {
  projectRoot: string;
  realProjectRoot: string;
  repoPath: string;
  expectedSha256?: string;
  label: string;
}): Promise<PinnedArtifactRead> {
  if (!isPortableRepoPath(input.repoPath)) {
    fail(
      "independent_pinned_path_invalid",
      `${input.label} path is not portable.`,
    );
  }
  const absolute = path.resolve(input.projectRoot, input.repoPath);
  if (!inside(input.projectRoot, absolute)) {
    fail(
      "independent_pinned_path_escape",
      `${input.label} escaped the project root.`,
    );
  }
  let stat: Awaited<ReturnType<typeof fs.lstat>>;
  try {
    stat = await fs.lstat(absolute);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      fail("independent_pinned_artifact_missing", `${input.label} is missing.`);
    }
    throw error;
  }
  if (!stat.isFile() || stat.isSymbolicLink()) {
    fail(
      "independent_pinned_artifact_invalid",
      `${input.label} must be a regular non-symbolic file.`,
    );
  }
  const real = await fs.realpath(absolute);
  if (!inside(input.realProjectRoot, real)) {
    fail(
      "independent_pinned_path_escape",
      `${input.label} real path escaped the project root.`,
    );
  }
  const openFlags =
    fsConstants.O_RDONLY |
    (process.platform === "win32" ? 0 : fsConstants.O_NOFOLLOW);
  let handle: Awaited<ReturnType<typeof fs.open>>;
  try {
    handle = await fs.open(absolute, openFlags);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      fail("independent_pinned_artifact_missing", `${input.label} is missing.`);
    }
    if (code === "ELOOP") {
      fail(
        "independent_pinned_artifact_invalid",
        `${input.label} may not be opened through a symbolic link.`,
      );
    }
    throw error;
  }
  let bytes: Buffer;
  try {
    const opened = await handle.stat();
    if (!opened.isFile()) {
      fail(
        "independent_pinned_artifact_invalid",
        `${input.label} opened object is not a regular file.`,
      );
    }
    bytes = await handle.readFile();
    const afterRead = await handle.stat();
    const finalStat = await fs.lstat(absolute);
    const finalReal = await fs.realpath(absolute);
    const snapshots = [opened, afterRead, finalStat];
    const identityChanged = snapshots.some(
      (entry) =>
        entry.dev !== stat.dev ||
        entry.ino !== stat.ino ||
        entry.size !== stat.size ||
        entry.mtimeMs !== stat.mtimeMs ||
        entry.ctimeMs !== stat.ctimeMs,
    );
    if (
      finalStat.isSymbolicLink() ||
      identityChanged ||
      bytes.byteLength !== afterRead.size ||
      finalReal !== real ||
      !inside(input.realProjectRoot, finalReal)
    ) {
      fail(
        "independent_pinned_artifact_changed_during_read",
        `${input.label} identity or contents changed during its pinned read.`,
      );
    }
  } finally {
    await handle.close();
  }
  const digest = sha256(bytes);
  if (
    input.expectedSha256 != null &&
    digest !== input.expectedSha256.toLowerCase()
  ) {
    fail(
      "independent_pinned_hash_mismatch",
      `${input.label} SHA-256 does not match its frozen binding.`,
    );
  }
  return { bytes, sha256: digest };
}

async function readPinnedJson(input: {
  projectRoot: string;
  realProjectRoot: string;
  repoPath: string;
  expectedSha256?: string;
  label: string;
}): Promise<{ data: unknown; bytes: Buffer; sha256: string }> {
  const artifact = await readPinnedArtifact(input);
  try {
    return {
      data: JSON.parse(artifact.bytes.toString("utf8")) as unknown,
      ...artifact,
    };
  } catch {
    fail(
      "independent_pinned_json_invalid",
      `${input.label} is not valid JSON.`,
    );
  }
}

type PrimaryBundleBuildMetadataRef = {
  artifactId: typeof NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_ARTIFACT_ID;
  path: string;
  schemaVersion: typeof NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_CONTRACT_VERSION;
  sha256: string;
};

function primaryBundleRef(value: unknown): Nhm2PrimaryProducerBundleRefV1 {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "artifactId",
      "path",
      "schemaVersion",
      "sha256",
      "sizeBytes",
    ]) ||
    value.artifactId !== NHM2_PRIMARY_PRODUCER_BUNDLE_ARTIFACT_ID ||
    !isPortableRepoPath(value.path) ||
    value.schemaVersion !== NHM2_PRIMARY_PRODUCER_BUNDLE_SCHEMA_VERSION ||
    typeof value.sha256 !== "string" ||
    !SHA256.test(value.sha256) ||
    !Number.isSafeInteger(value.sizeBytes) ||
    Number(value.sizeBytes) <= 0
  ) {
    fail(
      "independent_primary_bundle_lineage_unavailable",
      "Manifest-bound primary bundle reference is invalid.",
    );
  }
  return value as Nhm2PrimaryProducerBundleRefV1;
}

function primaryBundleBuildMetadataRef(
  value: unknown,
): PrimaryBundleBuildMetadataRef {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["artifactId", "path", "schemaVersion", "sha256"]) ||
    value.artifactId !== NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_ARTIFACT_ID ||
    !isPortableRepoPath(value.path) ||
    value.schemaVersion !==
      NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_CONTRACT_VERSION ||
    typeof value.sha256 !== "string" ||
    !SHA256.test(value.sha256)
  ) {
    fail(
      "independent_primary_bundle_lineage_unavailable",
      "Manifest-bound primary bundle-build reference is invalid.",
    );
  }
  return value as PrimaryBundleBuildMetadataRef;
}

const sameCanonicalValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(stable(left)) === JSON.stringify(stable(right));

async function loadPrimaryBundleLineage(input: {
  projectRoot: string;
  context: Nhm2IndependentNumericalCandidateContext;
}): Promise<Nhm2IndependentNumericalPrimaryBundleLineageV1> {
  const realProjectRoot = await fs.realpath(input.projectRoot);
  const candidateRead = await readPinnedJson({
    projectRoot: input.projectRoot,
    realProjectRoot,
    repoPath: input.context.manifest.bindings.candidate.path,
    expectedSha256: input.context.manifest.bindings.candidate.sha256,
    label: "primary candidate definition",
  });
  const primaryPlan = input.context.primaryPlan;
  const solverRead = await readPinnedJson({
    projectRoot: input.projectRoot,
    realProjectRoot,
    repoPath: primaryPlan.solver.path,
    expectedSha256: primaryPlan.solver.sha256,
    label: "primary solver descriptor",
  });
  if (
    !isRecord(candidateRead.data) ||
    !isRecord(candidateRead.data.primaryProducerBundle) ||
    !hasExactKeys(candidateRead.data.primaryProducerBundle, [
      "bundleRef",
      "buildMetadataRef",
    ]) ||
    !isRecord(solverRead.data)
  ) {
    fail(
      "independent_primary_bundle_lineage_unavailable",
      "Candidate definition and primary solver descriptor do not expose exact immutable bundle bindings.",
    );
  }
  const candidateBundle = candidateRead.data.primaryProducerBundle;
  const candidateBundleRef = primaryBundleRef(candidateBundle.bundleRef);
  const candidateBuildRef = primaryBundleBuildMetadataRef(
    candidateBundle.buildMetadataRef,
  );
  const solverBundleRef = primaryBundleRef(solverRead.data.bundleRef);
  const solverBuildRef = primaryBundleBuildMetadataRef(
    solverRead.data.bundleBuildMetadataRef,
  );
  if (
    !sameCanonicalValue(candidateBundleRef, solverBundleRef) ||
    !sameCanonicalValue(candidateBuildRef, solverBuildRef)
  ) {
    fail(
      "independent_primary_bundle_lineage_unavailable",
      "Candidate and primary solver bundle bindings disagree.",
    );
  }
  const buildRead = await readPinnedJson({
    projectRoot: input.projectRoot,
    realProjectRoot,
    repoPath: candidateBuildRef.path,
    expectedSha256: candidateBuildRef.sha256,
    label: "primary producer bundle build metadata",
  });
  if (
    !isNhm2PrimaryProducerBundleBuildMetadata(buildRead.data) ||
    buildRead.data.generatedAt !== input.context.manifest.frozenAt ||
    !sameCanonicalValue(buildRead.data.bundleRef, candidateBundleRef)
  ) {
    fail(
      "independent_primary_bundle_lineage_unavailable",
      "Primary producer build metadata failed its frozen contract or bundle binding.",
    );
  }
  const buildMetadata: Nhm2PrimaryProducerBundleBuildMetadataV1 =
    buildRead.data;
  const bundleRead = await readPinnedArtifact({
    projectRoot: input.projectRoot,
    realProjectRoot,
    repoPath: candidateBundleRef.path,
    expectedSha256: candidateBundleRef.sha256,
    label: "primary producer standalone bundle",
  });
  if (bundleRead.bytes.byteLength !== candidateBundleRef.sizeBytes) {
    fail(
      "independent_primary_bundle_lineage_unavailable",
      "Primary producer standalone bundle size differs from its frozen binding.",
    );
  }
  for (const source of buildMetadata.inputClosure.inputs) {
    const sourceRead = await readPinnedArtifact({
      projectRoot: input.projectRoot,
      realProjectRoot,
      repoPath: source.path,
      expectedSha256: source.sha256,
      label: `primary producer source ${source.path}`,
    });
    if (sourceRead.bytes.byteLength !== source.sizeBytes) {
      fail(
        "independent_primary_bundle_lineage_unavailable",
        `Primary producer source size differs from its frozen binding: ${source.path}.`,
      );
    }
  }
  return {
    candidateManifestSha256: input.context.manifestSha256,
    primaryPlan: {
      requestId: primaryPlan.requestId,
      runtimeId: primaryPlan.runtimeId,
      receiptId: primaryPlan.receiptId,
      solverId: primaryPlan.solver.solverId,
      implementationId: primaryPlan.solver.implementationId,
      solverDescriptorSha256: primaryPlan.solver.sha256,
      environmentLockSha256: primaryPlan.environmentLock.sha256,
    },
    producerBundle: {
      path: candidateBundleRef.path,
      sha256: bundleRead.sha256,
      sizeBytes: bundleRead.bytes.byteLength,
    },
    buildMetadata: {
      path: candidateBuildRef.path,
      sha256: buildRead.sha256,
      sourceSnapshotSha256: buildMetadata.inputClosure.sourceSnapshotSha256,
    },
  };
}

const planFor = (
  manifest: Nhm2ExperimentReadyTheoryCandidateManifestV1,
  role: "primary_numerical" | "independent_numerical",
): Nhm2ExperimentReadyTheoryCandidateExecutionPlanV1 =>
  manifest.executionPlans.find((entry) => entry.planRole === role) ??
  fail(
    "independent_candidate_plan_missing",
    `Candidate manifest is missing ${role}.`,
  );

function assertIndependentInvocation(input: {
  manifestPath: string;
  plan: Nhm2ExperimentReadyTheoryCandidateExecutionPlanV1;
}): void {
  const expectedArgs = [
    "run",
    "-s",
    NPM_SCRIPT,
    "--",
    "--candidate-manifest",
    input.manifestPath,
  ];
  const invocation = input.plan.expectedInvocation;
  if (
    input.plan.runtimeId !== RUNTIME_ID ||
    invocation.entrypoint !==
      `npm run ${NPM_SCRIPT} -- --candidate-manifest ${input.manifestPath}` ||
    invocation.command !== "npm" ||
    JSON.stringify(invocation.args) !== JSON.stringify(expectedArgs) ||
    invocation.cwd !== "."
  ) {
    fail(
      "independent_candidate_invocation_mismatch",
      "Independent plan does not bind the governed server-owned execution lane.",
    );
  }
}

async function loadCandidateContext(input: {
  projectRoot: string;
  manifestPath: string;
  executionStartsAt: string;
}): Promise<Nhm2IndependentNumericalCandidateContext> {
  const realProjectRoot = await fs.realpath(input.projectRoot);
  const manifestRead = await readPinnedJson({
    projectRoot: input.projectRoot,
    realProjectRoot,
    repoPath: input.manifestPath,
    label: "candidate manifest",
  });
  const manifestData = manifestRead.data;
  if (!isNhm2ExperimentReadyTheoryCandidateManifest(manifestData)) {
    fail(
      "independent_candidate_manifest_not_ready",
      "Candidate manifest failed its exact pre-run-ready contract.",
    );
  }
  const manifest = manifestData as Nhm2ExperimentReadyTheoryCandidateManifestV1;
  if (
    manifest.readiness.status !== "pre_run_manifest_ready" ||
    !manifest.readiness.preRunManifestReady
  ) {
    fail(
      "independent_candidate_manifest_not_ready",
      "Candidate manifest failed its exact pre-run-ready contract.",
    );
  }
  if (Date.parse(manifest.frozenAt) >= Date.parse(input.executionStartsAt)) {
    fail(
      "independent_candidate_not_frozen_before_execution",
      "Candidate manifest must be frozen before independent execution starts.",
    );
  }
  const independentPlan = planFor(manifest, "independent_numerical");
  const primaryPlan = planFor(manifest, "primary_numerical");
  assertIndependentInvocation({
    manifestPath: input.manifestPath,
    plan: independentPlan,
  });
  const descriptorRead = await readPinnedJson({
    projectRoot: input.projectRoot,
    realProjectRoot,
    repoPath: independentPlan.solver.path,
    expectedSha256: independentPlan.solver.sha256,
    label: "independent solver descriptor",
  });
  const descriptorData = descriptorRead.data;
  if (!isNhm2IndependentNumericalExecutionDescriptorV1(descriptorData)) {
    fail(
      "independent_solver_descriptor_invalid",
      "Independent solver descriptor does not satisfy the exact nested external-execution v1 contract.",
    );
  }
  return {
    manifest,
    manifestSha256: manifestRead.sha256,
    independentPlan,
    primaryPlan,
    independentDescriptor: descriptorData,
  };
}

function assertExternalDescriptor(input: {
  context: Nhm2IndependentNumericalCandidateContext;
  policy: Nhm2IndependentNumericalApprovedToolchainPolicyV1;
  primaryLineage: Nhm2IndependentNumericalPrimaryBundleLineageV1;
}): string {
  const { independentPlan: plan, primaryPlan } = input.context;
  const descriptorValue: unknown = input.context.independentDescriptor;
  if (!isNhm2IndependentNumericalExecutionDescriptorV1(descriptorValue)) {
    fail(
      "independent_solver_descriptor_invalid",
      "Independent execution rejects flat, shadow, extended, or otherwise invalid descriptor schemas.",
    );
  }
  const descriptor = descriptorValue;
  const lineage = input.primaryLineage;
  if (
    lineage.candidateManifestSha256 !== input.context.manifestSha256 ||
    lineage.primaryPlan.requestId !== primaryPlan.requestId ||
    lineage.primaryPlan.runtimeId !== primaryPlan.runtimeId ||
    lineage.primaryPlan.receiptId !== primaryPlan.receiptId ||
    lineage.primaryPlan.solverId !== primaryPlan.solver.solverId ||
    lineage.primaryPlan.implementationId !==
      primaryPlan.solver.implementationId ||
    lineage.primaryPlan.solverDescriptorSha256 !== primaryPlan.solver.sha256 ||
    lineage.primaryPlan.environmentLockSha256 !==
      primaryPlan.environmentLock.sha256 ||
    !isPortableRepoPath(lineage.producerBundle.path) ||
    !SHA256.test(lineage.producerBundle.sha256) ||
    !Number.isSafeInteger(lineage.producerBundle.sizeBytes) ||
    lineage.producerBundle.sizeBytes <= 0 ||
    !isPortableRepoPath(lineage.buildMetadata.path) ||
    !SHA256.test(lineage.buildMetadata.sha256) ||
    !SHA256.test(lineage.buildMetadata.sourceSnapshotSha256)
  ) {
    fail(
      "independent_primary_bundle_lineage_unavailable",
      "Securely reopened primary bundle lineage does not match the frozen candidate and primary plan.",
    );
  }
  if (
    descriptor.primaryLineage.producerBundleSha256 !==
      lineage.producerBundle.sha256 ||
    descriptor.primaryLineage.sourceClosureSha256 !==
      lineage.buildMetadata.sourceSnapshotSha256
  ) {
    fail(
      "independent_primary_bundle_lineage_mismatch",
      "Independent descriptor primary-lineage hashes do not equal the actual manifest-bound primary bundle and source snapshot.",
    );
  }
  if (
    descriptor.artifactId !== plan.solver.artifactId ||
    descriptor.contractVersion !== plan.solver.contractVersion ||
    descriptor.planRole !== "independent_numerical" ||
    descriptor.solver.solverId !== plan.solver.solverId ||
    descriptor.solver.version !== plan.solver.solverVersion ||
    descriptor.solver.implementationId !== plan.solver.implementationId ||
    descriptor.producerMode !== "external_binary" ||
    descriptor.solverFamily !== NHM2_INDEPENDENT_NUMERICAL_SOLVER_FAMILY ||
    descriptor.solver.independenceGroup !==
      input.policy.solver.independenceGroup ||
    descriptor.approvedPolicy.artifactId !== input.policy.artifactId ||
    descriptor.approvedPolicy.contractVersion !==
      input.policy.contractVersion ||
    descriptor.approvedPolicy.policyId !== input.policy.policyId ||
    descriptor.approvedPolicy.semanticSha256 !== input.policy.semanticSha256 ||
    descriptor.approvedPolicy.approvedAt !== input.policy.approvedAt ||
    descriptor.target.platform !== input.policy.target.platform ||
    descriptor.target.architecture !== input.policy.target.architecture ||
    descriptor.target.platform !== process.platform ||
    descriptor.target.architecture !== process.arch ||
    descriptor.implementationSourceClosure.closureSha256 !==
      input.policy.solver.implementationSourceClosureSha256 ||
    descriptor.toolchain.ledger.sha256 !==
      input.policy.toolchain.ledgerSha256 ||
    descriptor.toolchain.executable.sha256 !==
      input.policy.toolchain.executableSha256 ||
    descriptor.toolchain.executable.sizeBytes !==
      input.policy.toolchain.executableSizeBytes ||
    JSON.stringify(descriptor.environment.allowlist) !==
      JSON.stringify(input.policy.environment.allowlist) ||
    JSON.stringify(stable(descriptor.environment.values)) !==
      JSON.stringify(stable(input.policy.environment.values)) ||
    descriptor.environment.lock.artifactId !==
      plan.environmentLock.artifactId ||
    descriptor.environment.lock.contractVersion !==
      plan.environmentLock.contractVersion ||
    descriptor.environment.lock.relativePath !== plan.environmentLock.path ||
    descriptor.environment.lock.sha256 !== plan.environmentLock.sha256 ||
    descriptor.primaryLineage.solverId !== lineage.primaryPlan.solverId ||
    descriptor.primaryLineage.implementationId !==
      lineage.primaryPlan.implementationId ||
    descriptor.primaryLineage.solverDescriptorSha256 !==
      lineage.primaryPlan.solverDescriptorSha256 ||
    descriptor.primaryLineage.environmentLockSha256 !==
      lineage.primaryPlan.environmentLockSha256
  ) {
    fail(
      "independent_solver_descriptor_not_approved_external",
      "Frozen independent plan is not the exact nested approved descriptor, policy, source, toolchain, executable, environment, and primary-lineage binding.",
    );
  }
  if (
    plan.solver.solverId !== input.policy.solver.solverId ||
    plan.solver.implementationId !== input.policy.solver.implementationId ||
    plan.solver.solverVersion !== input.policy.solver.version
  ) {
    fail(
      "independent_plan_policy_identity_mismatch",
      "Frozen independent solver identity differs from the approved hash authority.",
    );
  }
  const fingerprintBlockers = nhm2IndependentNumericalFingerprintBlockers({
    primary: {
      solverId: primaryPlan.solver.solverId,
      implementationId: primaryPlan.solver.implementationId,
      solverDescriptorSha256: primaryPlan.solver.sha256,
      environmentLockSha256: primaryPlan.environmentLock.sha256,
      producerBundleSha256: lineage.producerBundle.sha256,
      sourceClosureSha256: lineage.buildMetadata.sourceSnapshotSha256,
    },
    independent: {
      solverId: plan.solver.solverId,
      implementationId: plan.solver.implementationId,
      solverDescriptorSha256: plan.solver.sha256,
      environmentLockSha256: plan.environmentLock.sha256,
      implementationSourceClosureSha256:
        descriptor.implementationSourceClosure.closureSha256,
      toolchainLedgerSha256: descriptor.toolchain.ledger.sha256,
      executableSha256: descriptor.toolchain.executable.sha256,
      independenceGroup: descriptor.solver.independenceGroup,
    },
  });
  if (fingerprintBlockers.length > 0) {
    fail(
      fingerprintBlockers[0],
      "Policy-declared independent identity or a pinned hash aliases the primary lane.",
    );
  }
  return descriptor.solver.independenceGroup;
}

export function nhm2IndependentNumericalFingerprintBlockers(input: {
  primary: {
    solverId: string;
    implementationId: string;
    solverDescriptorSha256: string;
    environmentLockSha256: string;
    producerBundleSha256: string;
    sourceClosureSha256: string;
  };
  independent: {
    solverId: string;
    implementationId: string;
    solverDescriptorSha256: string;
    environmentLockSha256: string;
    implementationSourceClosureSha256: string;
    toolchainLedgerSha256: string;
    executableSha256: string;
    independenceGroup: string;
  };
}): string[] {
  const identityComparisons = [
    [
      "independent_solver_id_not_distinct",
      input.independent.solverId,
      input.primary.solverId,
    ],
    [
      "independent_implementation_id_not_distinct",
      input.independent.implementationId,
      input.primary.implementationId,
    ],
    [
      "independent_solver_descriptor_not_distinct",
      input.independent.solverDescriptorSha256,
      input.primary.solverDescriptorSha256,
    ],
    [
      "independent_environment_lock_not_distinct",
      input.independent.environmentLockSha256,
      input.primary.environmentLockSha256,
    ],
  ] as const;
  const primaryContentFingerprints = [
    ["primary_solver_descriptor", input.primary.solverDescriptorSha256],
    ["primary_producer_bundle", input.primary.producerBundleSha256],
    ["primary_source_closure", input.primary.sourceClosureSha256],
  ] as const;
  const independentContentFingerprints = [
    ["source_closure", input.independent.implementationSourceClosureSha256],
    ["toolchain", input.independent.toolchainLedgerSha256],
    ["executable", input.independent.executableSha256],
  ] as const;
  const contentAliasBlockers = independentContentFingerprints.flatMap(
    ([independentLabel, independentSha256]) =>
      primaryContentFingerprints
        .filter(([, primarySha256]) => independentSha256 === primarySha256)
        .map(
          ([primaryLabel]) =>
            `independent_${independentLabel}_hash_aliases_${primaryLabel}`,
        ),
  );
  return [
    ...identityComparisons
      .filter(([, independent, primary]) => independent === primary)
      .map(([blocker]) => blocker),
    ...contentAliasBlockers,
    ...(input.independent.independenceGroup === input.primary.solverId ||
    input.independent.independenceGroup === input.primary.implementationId
      ? ["independent_group_not_distinct"]
      : []),
  ];
}

function expectedCandidateInputBindings(input: {
  context: Nhm2IndependentNumericalCandidateContext;
  manifestPath: string;
}): Array<Omit<Nhm2IndependentNumericalCandidateInputBindingV2, "sizeBytes">> {
  const { manifest } = input.context;
  const sources = {
    candidate_manifest: {
      sourcePath: input.manifestPath,
      sha256: input.context.manifestSha256,
    },
    candidate_definition: {
      sourcePath: manifest.bindings.candidate.path,
      sha256: manifest.bindings.candidate.sha256,
    },
    profile: {
      sourcePath: manifest.bindings.profile.path,
      sha256: manifest.bindings.profile.sha256,
    },
    chart: {
      sourcePath: manifest.bindings.chart.path,
      sha256: manifest.bindings.chart.sha256,
    },
    atlas: {
      sourcePath: manifest.bindings.atlas.path,
      sha256: manifest.bindings.atlas.sha256,
    },
    units: {
      sourcePath: manifest.bindings.units.path,
      sha256: manifest.bindings.units.sha256,
    },
    normalization: {
      sourcePath: manifest.bindings.normalization.path,
      sha256: manifest.bindings.normalization.sha256,
    },
    numeric_policy_set: {
      sourcePath: manifest.numericCheckPolicySet.artifactPath,
      sha256: manifest.numericCheckPolicySet.artifactRawSha256,
    },
  } satisfies Record<
    Nhm2IndependentNumericalCandidateInputRole,
    { sourcePath: string; sha256: string }
  >;
  return CANDIDATE_INPUT_LAYOUT.map((layout) => ({
    role: layout.role,
    sourcePath: sources[layout.role].sourcePath,
    inputRelativePath: layout.inputRelativePath,
    sha256: sources[layout.role].sha256.toLowerCase(),
  }));
}

function parsePresealedRunSpec(
  value: unknown,
): Nhm2IndependentNumericalPresealedRunSpecV2 {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "approvedPolicy",
      "artifactId",
      "candidateManifest",
      "candidateInputClosure",
      "claimBoundary",
      "contractVersion",
      "generatedAt",
      "independentPlan",
      "inputIsolation",
      "kernel",
    ]) ||
    value.artifactId !== "nhm2.independent_numerical_presealed_run_spec" ||
    value.contractVersion !==
      NHM2_INDEPENDENT_NUMERICAL_PRESEALED_RUN_SPEC_VERSION ||
    !exactIso(value.generatedAt) ||
    !isRecord(value.candidateManifest) ||
    !hasExactKeys(value.candidateManifest, ["path", "sha256"]) ||
    !isPortableRepoPath(value.candidateManifest.path) ||
    typeof value.candidateManifest.sha256 !== "string" ||
    !SHA256.test(value.candidateManifest.sha256) ||
    !isRecord(value.independentPlan) ||
    !hasExactKeys(value.independentPlan, [
      "receiptId",
      "requestId",
      "runId",
      "runtimeId",
    ]) ||
    Object.values(value.independentPlan).some(
      (entry) => typeof entry !== "string" || entry.trim().length === 0,
    ) ||
    !isRecord(value.candidateInputClosure) ||
    !hasExactKeys(value.candidateInputClosure, [
      "authority",
      "entries",
      "inputLedgerSha256",
      "semanticSha256",
    ]) ||
    value.candidateInputClosure.authority !==
      "frozen_candidate_manifest_administrative_closure" ||
    typeof value.candidateInputClosure.semanticSha256 !== "string" ||
    !SHA256.test(value.candidateInputClosure.semanticSha256) ||
    typeof value.candidateInputClosure.inputLedgerSha256 !== "string" ||
    !SHA256.test(value.candidateInputClosure.inputLedgerSha256) ||
    !Array.isArray(value.candidateInputClosure.entries) ||
    value.candidateInputClosure.entries.length !==
      CANDIDATE_INPUT_LAYOUT.length ||
    !value.candidateInputClosure.entries.every(
      (entry, index) =>
        isRecord(entry) &&
        hasExactKeys(entry, [
          "inputRelativePath",
          "role",
          "sha256",
          "sizeBytes",
          "sourcePath",
        ]) &&
        entry.role === CANDIDATE_INPUT_LAYOUT[index]?.role &&
        entry.inputRelativePath ===
          CANDIDATE_INPUT_LAYOUT[index]?.inputRelativePath &&
        isPortableRepoPath(entry.sourcePath) &&
        isPortableRepoPath(entry.inputRelativePath) &&
        typeof entry.sha256 === "string" &&
        SHA256.test(entry.sha256) &&
        Number.isSafeInteger(entry.sizeBytes) &&
        (entry.sizeBytes as number) > 0,
    ) ||
    !isRecord(value.approvedPolicy) ||
    !hasExactKeys(value.approvedPolicy, ["policyId", "semanticSha256"]) ||
    typeof value.approvedPolicy.policyId !== "string" ||
    typeof value.approvedPolicy.semanticSha256 !== "string" ||
    !SHA256.test(value.approvedPolicy.semanticSha256) ||
    !isRecord(value.kernel) ||
    !hasExactKeys(value.kernel, [
      "arguments",
      "environment",
      "environmentAllowlist",
      "executable",
      "expectedOutputs",
      "lane",
      "ledgers",
      "maxCapturedOutputBytes",
      "maxLedgerAggregateBytes",
      "maxLedgerFileBytes",
      "maxOutputAggregateBytes",
      "outputRoot",
      "solver",
      "timeoutMs",
    ]) ||
    !isRecord(value.kernel.solver) ||
    !hasExactKeys(value.kernel.solver, [
      "family",
      "implementationId",
      "producerMode",
      "version",
    ]) ||
    !isRecord(value.kernel.executable) ||
    !hasExactKeys(value.kernel.executable, [
      "absolutePath",
      "sha256",
      "sizeBytes",
    ]) ||
    !isRecord(value.kernel.ledgers) ||
    !hasExactKeys(value.kernel.ledgers, ["input", "toolchain"]) ||
    !exactInputIsolationSafeguard(value.inputIsolation) ||
    !exactClaimBoundary(value.claimBoundary)
  ) {
    fail(
      "independent_presealed_run_spec_invalid",
      "Independent presealed run specification is malformed or incomplete.",
    );
  }
  return value as unknown as Nhm2IndependentNumericalPresealedRunSpecV2;
}

function parsePersistedPresealedRunSpec(input: {
  persisted: PersistedIndependentPreseal;
  executionStartsAt: string;
}): Nhm2IndependentNumericalPresealedRunSpecV2 {
  const { artifact } = input.persisted;
  if (
    !isRecord(artifact) ||
    !hasExactKeys(artifact, [
      "artifactId",
      "path",
      "schemaVersion",
      "sha256",
      "sizeBytes",
      "writtenAt",
    ]) ||
    artifact.artifactId !== "nhm2.independent_numerical_persisted_preseal" ||
    artifact.schemaVersion !==
      "nhm2_independent_numerical_persisted_preseal/v1" ||
    !isPortableRepoPath(artifact.path) ||
    typeof artifact.sha256 !== "string" ||
    !SHA256.test(artifact.sha256) ||
    !Number.isSafeInteger(artifact.sizeBytes) ||
    artifact.sizeBytes <= 0 ||
    !exactIso(artifact.writtenAt)
  ) {
    fail(
      "independent_persisted_preseal_reference_invalid",
      "The server-loaded independent preseal reference is malformed.",
    );
  }
  const bytes = Buffer.from(input.persisted.bytes);
  if (
    bytes.byteLength !== artifact.sizeBytes ||
    sha256(bytes) !== artifact.sha256
  ) {
    fail(
      "independent_persisted_preseal_hash_mismatch",
      "The server-loaded independent preseal bytes do not match their persisted hash address.",
    );
  }
  let value: unknown;
  try {
    value = JSON.parse(bytes.toString("utf8")) as unknown;
  } catch {
    fail(
      "independent_persisted_preseal_json_invalid",
      "The persisted independent preseal is not valid JSON.",
    );
  }
  const spec = parsePresealedRunSpec(value);
  if (
    Date.parse(spec.generatedAt) > Date.parse(artifact.writtenAt) ||
    Date.parse(artifact.writtenAt) >= Date.parse(input.executionStartsAt)
  ) {
    fail(
      "independent_persisted_preseal_time_invalid",
      "The hash-addressed preseal must be generated no later than persistence and persisted before execution.",
    );
  }
  return spec;
}

function assertDedicatedPrimaryReceiptAuthority(input: {
  context: Nhm2IndependentNumericalCandidateContext;
  persisted: PersistedPrimaryReceipt;
}): void {
  const primary = input.context.primaryPlan;
  const receiptValue: unknown = input.persisted.receipt;
  const registered = getTheoryRuntimeEntrypoint(PRIMARY_RUNTIME_ID);
  const expectedReceiptId =
    nhm2ExperimentReadyTheoryCandidateReceiptIdForRequest(
      PRIMARY_RUNTIME_ID,
      primary.requestId,
    );
  if (
    registered == null ||
    primary.runtimeId !== PRIMARY_RUNTIME_ID ||
    primary.receiptId !== expectedReceiptId ||
    !isTheoryRuntimeReceiptV1(receiptValue)
  ) {
    fail(
      "independent_primary_receipt_authority_invalid",
      "Independent execution requires the exact dedicated NHM2 primary runtime and receipt contract.",
    );
  }
  const receipt = receiptValue;
  const persistedArtifact = input.persisted.artifact;
  const canonicalReceiptBytes = Buffer.from(
    `${JSON.stringify(receipt, null, 2)}\n`,
    "utf8",
  );
  if (
    persistedArtifact.artifactId !== "theory_runtime_persisted_receipt" ||
    persistedArtifact.schemaVersion !== "theory_runtime_persisted_receipt/v1" ||
    persistedArtifact.requestId !== primary.requestId ||
    persistedArtifact.receiptId !== expectedReceiptId ||
    !isPortableRepoPath(persistedArtifact.path) ||
    persistedArtifact.sha256 !== sha256(canonicalReceiptBytes) ||
    persistedArtifact.sizeBytes !== canonicalReceiptBytes.byteLength ||
    !exactIso(persistedArtifact.writtenAt) ||
    receipt.runtimeId !== PRIMARY_RUNTIME_ID ||
    receipt.receiptId !== expectedReceiptId ||
    receipt.graphId !== THEORY_RUNTIME_WORKSTATION_GRAPH_ID ||
    JSON.stringify(receipt.badgeIds) !==
      JSON.stringify(registered.ownedBadgeIds) ||
    receipt.status !== "completed" ||
    receipt.claimBoundary.currentTier !== "diagnostic" ||
    receipt.claimBoundary.maximumTier !== "reduced_order" ||
    receipt.claimBoundary.promotionAllowed !== false ||
    !receipt.claimBoundary.promotionBlockedBy.includes(
      "experiment_ready_theory_closure_requires_independent_and_formal_evidence",
    ) ||
    !receipt.claimBoundary.promotionBlockedBy.includes(
      "empirical_receipts_required_for_physical_promotion",
    ) ||
    !hasExactKeys(receipt.outputs.scalars, PRIMARY_RECEIPT_SCALAR_KEYS) ||
    PRIMARY_RECEIPT_FALSE_CLAIM_SCALAR_KEYS.some(
      (key) => receipt.outputs.scalars[key] !== false,
    ) ||
    receipt.outputs.scalars.operatingSystemHermeticityAsserted !== false ||
    receipt.outputs.scalars.nodeRuntimeReproducibilityAsserted !== false ||
    !hasExactKeys(receipt.outputs.gates, PRIMARY_RECEIPT_GATE_KEYS) ||
    receipt.outputs.gates.primary_comparison_projection !== "not_ready" ||
    receipt.outputs.gates.experiment_ready_theory_closure !== "not_ready" ||
    !receipt.outputs.missingSignals.includes(
      "primary_comparison_projection_not_ready",
    ) ||
    !receipt.outputs.missingSignals.includes(
      "experiment_ready_theory_closure_not_ready",
    )
  ) {
    fail(
      "independent_primary_receipt_claim_boundary_invalid",
      "Independent execution rejects promoting, certified, closure-passing, or scalar/gate-extended primary receipts.",
    );
  }
}

function assertPresealedBindings(input: {
  context: Nhm2IndependentNumericalCandidateContext;
  spec: Nhm2IndependentNumericalPresealedRunSpecV2;
  policy: Nhm2IndependentNumericalApprovedToolchainPolicyV1;
  persisted: PersistedPrimaryReceipt;
  verification: TheoryRuntimeReceiptFilesystemVerificationV1;
  primaryLineage: Nhm2IndependentNumericalPrimaryBundleLineageV1;
  presealWrittenAt: string;
  projectRoot: string;
  executionStartsAt: string;
}): void {
  const { context, spec, policy, persisted, verification, primaryLineage } =
    input;
  const plan = context.independentPlan;
  const primary = context.primaryPlan;
  const primaryReceipt = persisted.receipt;
  const primaryManifest = primaryReceipt.outputs.artifactManifest;
  const startedAt = primaryReceipt.provenance.startedAt;
  const completedAt = primaryReceipt.provenance.completedAt;
  if (
    spec.candidateManifest.sha256 !== context.manifestSha256 ||
    Date.parse(spec.generatedAt) < Date.parse(context.manifest.frozenAt) ||
    Date.parse(spec.generatedAt) >= Date.parse(input.executionStartsAt) ||
    spec.independentPlan.requestId !== plan.requestId ||
    spec.independentPlan.runId !== plan.runId ||
    spec.independentPlan.receiptId !== plan.receiptId ||
    spec.independentPlan.runtimeId !== plan.runtimeId ||
    spec.approvedPolicy.policyId !== policy.policyId ||
    spec.approvedPolicy.semanticSha256 !== policy.semanticSha256
  ) {
    fail(
      "independent_presealed_binding_mismatch",
      "Presealed independent run does not match the candidate, primary receipt, or approved policy.",
    );
  }
  if (
    !exactIso(startedAt) ||
    !exactIso(input.presealWrittenAt) ||
    Date.parse(spec.generatedAt) >= Date.parse(startedAt) ||
    Date.parse(input.presealWrittenAt) >= Date.parse(startedAt)
  ) {
    fail(
      "independent_preseal_not_frozen_before_primary_execution",
      "Independent candidate inputs must be sealed and persisted before primary execution starts.",
    );
  }
  if (
    primaryReceipt.runtimeId !== primary.runtimeId ||
    primaryReceipt.receiptId !== primary.receiptId ||
    primaryReceipt.status !== "completed" ||
    primaryReceipt.execution?.exitCode !== 0 ||
    primaryReceipt.args.requestId !== primary.requestId ||
    primaryReceipt.args.runId !== primary.runId ||
    primaryReceipt.args.receiptId !== primary.receiptId ||
    primaryReceipt.args.candidateManifestPath !== spec.candidateManifest.path ||
    primaryReceipt.args.candidateManifestSha256 !== context.manifestSha256 ||
    primaryReceipt.args.candidateId !==
      context.manifest.bindings.candidate.candidateId ||
    primaryReceipt.args.selectedProfileId !==
      context.manifest.bindings.profile.selectedProfileId ||
    primaryReceipt.args.chartId !== context.manifest.bindings.chart.chartId ||
    primaryReceipt.args.atlasSha256 !==
      context.manifest.bindings.atlas.sha256 ||
    primaryReceipt.args.unitsSha256 !==
      context.manifest.bindings.units.sha256 ||
    primaryReceipt.args.normalizationSha256 !==
      context.manifest.bindings.normalization.sha256 ||
    primaryReceipt.provenance.gitSha !== primary.sourceCommitSha ||
    !exactIso(completedAt) ||
    Date.parse(completedAt) > Date.parse(persisted.artifact.writtenAt) ||
    Date.parse(persisted.artifact.writtenAt) >=
      Date.parse(input.executionStartsAt) ||
    primaryManifest == null ||
    primaryManifest.requestId !== primary.requestId ||
    primaryManifest.runtimeId !== primary.runtimeId ||
    primaryManifest.outputDirectory !==
      primary.expectedInvocation.outputDirectory ||
    primaryReceipt.execution.environment.THEORY_RUNTIME_REQUEST_ID !==
      primary.requestId ||
    primaryReceipt.execution.environment.THEORY_RUNTIME_RECEIPT_ID !==
      primary.receiptId ||
    primaryReceipt.execution.environment.THEORY_RUNTIME_ID !==
      primary.runtimeId ||
    primaryReceipt.execution.environment.NHM2_RUN_ID !== primary.runId ||
    primaryReceipt.execution.environment.NHM2_CANDIDATE_MANIFEST_SHA256 !==
      context.manifestSha256 ||
    !verification.ok ||
    !verification.freshnessProofVerified ||
    verification.files.length === 0 ||
    verification.files.some((entry) => entry.freshness !== "new")
  ) {
    fail(
      "independent_primary_receipt_not_verified",
      "Independent execution requires a completed, fresh, filesystem-verified primary run.",
    );
  }
  const expectedInputs = expectedCandidateInputBindings({
    context,
    manifestPath: spec.candidateManifest.path,
  });
  const suppliedInputs = spec.candidateInputClosure.entries;
  if (
    suppliedInputs.length !== expectedInputs.length ||
    suppliedInputs.some(
      (entry, index) =>
        entry.role !== expectedInputs[index]?.role ||
        entry.sourcePath !== expectedInputs[index]?.sourcePath ||
        entry.inputRelativePath !== expectedInputs[index]?.inputRelativePath ||
        entry.sha256.toLowerCase() !== expectedInputs[index]?.sha256,
    )
  ) {
    fail(
      "independent_candidate_input_closure_mismatch",
      "Presealed independent input is not the exact frozen candidate-manifest closure.",
    );
  }
  const { semanticSha256, ...closureSemantic } = spec.candidateInputClosure;
  if (
    semanticSha256 !==
    computeNhm2IndependentNumericalCandidateInputClosureSha256(closureSemantic)
  ) {
    fail(
      "independent_candidate_input_closure_digest_mismatch",
      "Frozen candidate-input closure semantic digest is invalid.",
    );
  }
  const kernel = spec.kernel;
  const expectedInputLedgerEntries = suppliedInputs.map((entry) => ({
    relativePath: entry.inputRelativePath,
    sha256: entry.sha256.toLowerCase(),
    sizeBytes: entry.sizeBytes,
  }));
  const expectedArguments = [
    ...suppliedInputs.map((entry) => ({
      kind: "input_path" as const,
      relativePath: entry.inputRelativePath,
    })),
    { kind: "output_root" as const },
  ];
  if (
    kernel.ledgers.input.kind !== "input" ||
    kernel.ledgers.input.ledgerSha256 !==
      spec.candidateInputClosure.inputLedgerSha256 ||
    JSON.stringify(kernel.ledgers.input.entries) !==
      JSON.stringify(expectedInputLedgerEntries) ||
    JSON.stringify(kernel.arguments) !== JSON.stringify(expectedArguments)
  ) {
    fail(
      "independent_kernel_input_not_candidate_closure_only",
      "Independent child input ledger and arguments must expose exactly the frozen candidate closure and output root.",
    );
  }
  const primaryHashes = new Set(
    verification.files.map((entry) => entry.sha256.toLowerCase()),
  );
  const primaryPaths = verification.files.map((entry) =>
    path.resolve(entry.absolutePath),
  );
  const inputRoot = path.resolve(kernel.ledgers.input.rootPath);
  const toolchainRoot = path.resolve(kernel.ledgers.toolchain.rootPath);
  const executablePath = path.resolve(kernel.executable.absolutePath);
  const toolchainEntryPaths = kernel.ledgers.toolchain.entries.map((entry) =>
    path.resolve(toolchainRoot, ...entry.relativePath.split("/")),
  );
  if (verification.outputDirectory == null) {
    fail(
      "independent_primary_receipt_not_verified",
      "Verified primary output directory is unavailable for server-side isolation checks.",
    );
  }
  const primaryOutputRoot = path.resolve(
    input.projectRoot,
    verification.outputDirectory,
  );
  const serializedEnvironment = JSON.stringify(stable(kernel.environment));
  if (
    absolutePathsOverlap(inputRoot, primaryOutputRoot) ||
    absolutePathsOverlap(toolchainRoot, primaryOutputRoot) ||
    absolutePathsOverlap(executablePath, primaryOutputRoot) ||
    primaryPaths.some(
      (primaryPath) =>
        absolutePathsOverlap(inputRoot, primaryPath) ||
        absolutePathsOverlap(toolchainRoot, primaryPath) ||
        absolutePathsOverlap(executablePath, primaryPath) ||
        toolchainEntryPaths.some((toolchainPath) =>
          absolutePathsOverlap(toolchainPath, primaryPath),
        ),
    ) ||
    primaryHashes.has(kernel.ledgers.toolchain.ledgerSha256.toLowerCase()) ||
    kernel.ledgers.toolchain.entries.some((entry) =>
      primaryHashes.has(entry.sha256.toLowerCase()),
    ) ||
    primaryHashes.has(kernel.executable.sha256.toLowerCase()) ||
    verification.files.some(
      (entry) =>
        serializedEnvironment.includes(entry.sha256) ||
        serializedEnvironment.includes(entry.path),
    )
  ) {
    fail(
      "independent_primary_output_disclosure_detected",
      "Independent launch was denied because an input mount, toolchain, executable, or environment exposes primary output material.",
    );
  }
  if (
    kernel.lane !== "independent_numerical_replication" ||
    kernel.solver.family !== policy.solver.family ||
    kernel.solver.implementationId !== policy.solver.implementationId ||
    kernel.solver.version !== policy.solver.version ||
    kernel.solver.producerMode !== "external_binary" ||
    kernel.ledgers.toolchain.ledgerSha256 !== policy.toolchain.ledgerSha256 ||
    kernel.executable.sha256 !== policy.toolchain.executableSha256 ||
    kernel.executable.sizeBytes !== policy.toolchain.executableSizeBytes ||
    JSON.stringify(kernel.environmentAllowlist) !==
      JSON.stringify(policy.environment.allowlist) ||
    JSON.stringify(stable(kernel.environment)) !==
      JSON.stringify(stable(policy.environment.values))
  ) {
    fail(
      "independent_kernel_not_approved",
      "External kernel does not match the exact server-approved solver, toolchain, executable, and environment hashes.",
    );
  }
  const expectedOutputRoot = path.resolve(
    input.projectRoot,
    plan.expectedInvocation.outputDirectory,
    "external-kernel",
  );
  if (!samePath(kernel.outputRoot, expectedOutputRoot)) {
    fail(
      "independent_kernel_output_root_mismatch",
      "External kernel output root is not the run-specific independent subdirectory.",
    );
  }
  const primaryFingerprints = new Set([
    primary.solver.sha256,
    primary.environmentLock.sha256,
    primaryLineage.producerBundle.sha256,
    primaryLineage.buildMetadata.sourceSnapshotSha256,
  ]);
  if (
    primaryFingerprints.has(kernel.ledgers.toolchain.ledgerSha256) ||
    primaryFingerprints.has(kernel.executable.sha256) ||
    primaryFingerprints.has(policy.solver.implementationSourceClosureSha256)
  ) {
    fail(
      "independent_hash_aliases_primary_pinned_artifact",
      "An approved independent toolchain, executable, or source-closure hash aliases a primary pinned-artifact hash.",
    );
  }
}

const emptyObservation = (input: {
  manifestPath: string;
  manifestSha256?: string | null;
  candidateId?: string | null;
  plan?: Nhm2ExperimentReadyTheoryCandidateExecutionPlanV1 | null;
  independenceGroup?: string | null;
  policy?: Nhm2IndependentNumericalApprovedToolchainPolicyV1 | null;
  persisted?: PersistedPrimaryReceipt | null;
  persistedPreseal?: PersistedIndependentPreseal | null;
  presealHashVerified?: boolean;
  primaryVerified?: boolean;
  candidateInputIsolationVerified?: boolean;
  blockers: string[];
  kernelObservation?: Nhm2ExternalNumericalKernelObservationV1 | null;
  failedProcessObservation?: Nhm2ExternalNumericalKernelProcessObservationV1 | null;
  status?: Nhm2IndependentNumericalExecutionStatus;
}): Nhm2IndependentNumericalExecutionObservationV1 => ({
  artifactId: "nhm2.independent_numerical_execution_observation",
  contractVersion: NHM2_INDEPENDENT_NUMERICAL_EXECUTION_OBSERVATION_VERSION,
  generatedAt: new Date().toISOString(),
  status: input.status ?? "not_ready",
  candidate: {
    manifestPath: input.manifestPath,
    manifestSha256: input.manifestSha256 ?? null,
    candidateId: input.candidateId ?? null,
  },
  plan: {
    requestId: input.plan?.requestId ?? null,
    runId: input.plan?.runId ?? null,
    receiptId: input.plan?.receiptId ?? null,
    runtimeId: input.plan?.runtimeId ?? null,
    solverId: input.plan?.solver.solverId ?? null,
    implementationId: input.plan?.solver.implementationId ?? null,
    independenceGroup: input.independenceGroup ?? null,
  },
  approvedPolicy: {
    policyId: input.policy?.policyId ?? null,
    semanticSha256: input.policy?.semanticSha256 ?? null,
  },
  primaryReceipt: {
    receiptId: input.persisted?.artifact.receiptId ?? null,
    path: input.persisted?.artifact.path ?? null,
    sha256: input.persisted?.artifact.sha256 ?? null,
    filesystemVerified: input.primaryVerified === true,
  },
  persistedPreseal: {
    path: input.persistedPreseal?.artifact.path ?? null,
    sha256: input.persistedPreseal?.artifact.sha256 ?? null,
    writtenAt: input.persistedPreseal?.artifact.writtenAt ?? null,
    hashAddressVerified: input.presealHashVerified === true,
  },
  inputIsolation: {
    ...INPUT_ISOLATION_SAFEGUARD,
    candidateInputClosureVerified:
      input.candidateInputIsolationVerified === true,
    kernelInputLedgerCandidateOnlyVerified:
      input.candidateInputIsolationVerified === true,
    presealPredatesPrimaryExecutionVerified:
      input.candidateInputIsolationVerified === true,
    serverPostRunComparisonAccessVerified: input.primaryVerified === true,
  },
  kernelObservation: input.kernelObservation ?? null,
  failedProcessObservation: input.failedProcessObservation ?? null,
  independentReplicationArtifact: null,
  independentNumericalReplicationReady: false,
  blockers: [...new Set(input.blockers)],
  claimBoundary: { ...CLAIM_BOUNDARY },
});

function admissionCode(error: unknown): string {
  if (error instanceof Nhm2IndependentNumericalAdmissionError)
    return error.code;
  if (error instanceof Nhm2ExternalNumericalKernelExecutorError) {
    return `independent_external_kernel_${error.code}`;
  }
  return "independent_execution_unexpected_error";
}

export async function nhm2IndependentNumericalExecutableBlocker(
  absolutePath: string,
): Promise<string | null> {
  try {
    const executable = await fs.lstat(absolutePath);
    return executable.isFile() && !executable.isSymbolicLink()
      ? null
      : "independent_executable_invalid";
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return "independent_executable_missing";
    }
    return "independent_executable_unreadable";
  }
}

export function nhm2IndependentNumericalOutputCopyBlockers(input: {
  primarySha256: readonly string[];
  outputs: readonly { role: string; sha256: string }[];
  verifiedIndependenceAuthority?: {
    authority: "server_verified_os_isolation_and_audited_lineage";
    operatingSystemPrimaryOutputIsolationVerified: true;
    auditedIndependentImplementationLineageVerified: true;
  };
}): string[] {
  // Exact whole-file equality is scientific agreement, not proof of copying.
  // Until the server has both OS isolation and audited implementation lineage,
  // equality remains a temporary fail-closed lineage blocker. A future server-
  // verified authority may admit equality; producer/caller metadata cannot.
  if (
    input.verifiedIndependenceAuthority?.authority ===
      "server_verified_os_isolation_and_audited_lineage" &&
    input.verifiedIndependenceAuthority
      .operatingSystemPrimaryOutputIsolationVerified === true &&
    input.verifiedIndependenceAuthority
      .auditedIndependentImplementationLineageVerified === true
  ) {
    return [];
  }
  const primary = new Set(
    input.primarySha256.map((entry) => entry.toLowerCase()),
  );
  return input.outputs
    .filter((entry) => primary.has(entry.sha256.toLowerCase()))
    .map(
      (entry) =>
        `independent_content_lineage_not_established:exact_output_hash_match:${entry.role}`,
    );
}

async function executeNhm2IndependentNumericalReplicationCore(
  input: ExecuteNhm2IndependentNumericalReplicationInput,
  dependencies: Nhm2IndependentNumericalExecutorTestDependencies,
): Promise<Nhm2IndependentNumericalExecutionObservationV1> {
  const projectRoot = path.resolve(input.projectRoot ?? process.cwd());
  let context: Nhm2IndependentNumericalCandidateContext | null = null;
  let policy: Nhm2IndependentNumericalApprovedToolchainPolicyV1 | null = null;
  let persistedPreseal: PersistedIndependentPreseal | null = null;
  let presealHashVerified = false;
  let candidateInputIsolationVerified = false;
  let persisted: PersistedPrimaryReceipt | null = null;
  let verification: TheoryRuntimeReceiptFilesystemVerificationV1 | null = null;
  let independenceGroup: string | null = null;
  let failedProcessObservation: Nhm2ExternalNumericalKernelProcessObservationV1 | null =
    null;
  try {
    if (input.execute !== true) {
      fail(
        "independent_execute_confirmation_required",
        "Independent execution requires execute=true.",
      );
    }
    const executionStart = (dependencies.now ?? serverNow)();
    if (
      !(executionStart instanceof Date) ||
      !Number.isFinite(executionStart.getTime())
    ) {
      fail(
        "independent_server_clock_invalid",
        "Independent execution requires a valid server-owned execution clock.",
      );
    }
    const executionStartsAt = executionStart.toISOString();
    const installedPolicy = await (
      dependencies.loadApprovedPolicy ?? loadInstalledApprovedPolicy
    )({ projectRoot });
    if (installedPolicy == null) {
      fail(
        "independent_approved_toolchain_policy_missing",
        "No server-approved independent numerical toolchain policy is installed.",
      );
    }
    assertNhm2IndependentNumericalApprovedToolchainPolicy(installedPolicy);
    policy = installedPolicy;
    if (Date.parse(policy.approvedAt) >= Date.parse(executionStartsAt)) {
      fail(
        "independent_approved_policy_not_prior_to_execution",
        "Approved independent toolchain policy must predate execution.",
      );
    }
    context = await (dependencies.loadCandidateContext ?? loadCandidateContext)(
      {
        projectRoot,
        manifestPath: input.candidateManifestPath,
        executionStartsAt,
      },
    );
    if (
      !isNhm2IndependentNumericalExecutionDescriptorV1(
        context.independentDescriptor,
      )
    ) {
      fail(
        "independent_solver_descriptor_invalid",
        "Independent execution rejects flat, shadow, extended, or otherwise invalid descriptor schemas.",
      );
    }
    let primaryLineage: Nhm2IndependentNumericalPrimaryBundleLineageV1;
    try {
      primaryLineage = await (
        dependencies.loadPrimaryBundleLineage ?? loadPrimaryBundleLineage
      )({ projectRoot, context });
    } catch (error) {
      if (error instanceof Nhm2IndependentNumericalAdmissionError) throw error;
      fail(
        "independent_primary_bundle_lineage_unavailable",
        `Primary bundle lineage could not be securely reopened: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
    independenceGroup = assertExternalDescriptor({
      context,
      policy,
      primaryLineage,
    });
    persisted = await (
      dependencies.readPrimaryReceipt ?? readTheoryRuntimeReceiptArtifact
    )({
      projectRoot,
      runtimeId: context.primaryPlan.runtimeId,
      requestId: context.primaryPlan.requestId,
      receiptId: context.primaryPlan.receiptId,
    });
    if (persisted == null) {
      fail(
        "independent_primary_receipt_missing",
        "The exact persisted primary receipt is required before independent execution.",
      );
    }
    assertDedicatedPrimaryReceiptAuthority({ context, persisted });
    verification = await (
      dependencies.verifyPrimaryReceipt ?? verifyTheoryRuntimeReceiptFilesystem
    )({ projectRoot, receipt: persisted.receipt });
    persistedPreseal = await (
      dependencies.readPersistedPreseal ?? readInstalledPersistedPreseal
    )({
      projectRoot,
      manifestPath: input.candidateManifestPath,
      requestId: context.independentPlan.requestId,
      runId: context.independentPlan.runId,
      receiptId: context.independentPlan.receiptId,
    });
    if (persistedPreseal == null) {
      fail(
        "independent_persisted_preseal_missing",
        "Independent execution requires a server-loaded, hash-addressed persisted preseal.",
      );
    }
    const spec = parsePersistedPresealedRunSpec({
      persisted: persistedPreseal,
      executionStartsAt,
    });
    presealHashVerified = true;
    if (spec.candidateManifest.path !== input.candidateManifestPath) {
      fail(
        "independent_presealed_manifest_path_mismatch",
        "Presealed run specification binds a different candidate manifest path.",
      );
    }
    assertPresealedBindings({
      context,
      spec,
      policy,
      persisted,
      verification,
      primaryLineage,
      presealWrittenAt: persistedPreseal.artifact.writtenAt,
      projectRoot,
      executionStartsAt,
    });
    candidateInputIsolationVerified = true;
    const executableBlocker = await nhm2IndependentNumericalExecutableBlocker(
      spec.kernel.executable.absolutePath,
    );
    if (executableBlocker != null) {
      fail(
        executableBlocker,
        "Approved independent executable is missing, unreadable, or not a regular non-symbolic file.",
      );
    }
    let kernelObservation: Nhm2ExternalNumericalKernelObservationV1;
    try {
      kernelObservation = await (
        dependencies.executeKernel ?? executeNhm2ExternalNumericalKernel
      )(spec.kernel);
    } catch (error) {
      if (error instanceof Nhm2ExternalNumericalKernelExecutorError) {
        failedProcessObservation = error.processObservation;
      }
      throw error;
    }
    const copyBlockers = nhm2IndependentNumericalOutputCopyBlockers({
      primarySha256: verification.files.map((entry) => entry.sha256),
      outputs: kernelObservation.outputs,
    });
    if (copyBlockers.length > 0) {
      return emptyObservation({
        manifestPath: input.candidateManifestPath,
        manifestSha256: context.manifestSha256,
        candidateId: context.manifest.bindings.candidate.candidateId,
        plan: context.independentPlan,
        independenceGroup,
        policy,
        persistedPreseal,
        presealHashVerified,
        persisted,
        primaryVerified: true,
        candidateInputIsolationVerified,
        kernelObservation,
        blockers: copyBlockers,
      });
    }
    return emptyObservation({
      manifestPath: input.candidateManifestPath,
      manifestSha256: context.manifestSha256,
      candidateId: context.manifest.bindings.candidate.candidateId,
      plan: context.independentPlan,
      independenceGroup,
      policy,
      persistedPreseal,
      presealHashVerified,
      persisted,
      primaryVerified: true,
      candidateInputIsolationVerified,
      kernelObservation,
      status: "execution_observed_scientific_replay_required",
      blockers: [
        ...kernelObservation.blockers,
        "independent_primary_source_lineage_comparison_unavailable",
        "independent_implementation_lineage_not_established",
        "independent_exact_copy_check_tripwire_only",
        "independent_primary_content_lineage_exclusion_not_established",
        "independent_operating_system_primary_output_isolation_not_established",
        SEMICLASSICAL_V2_INPUT_CLOSURE_BLOCKER,
        "independent_field_level_content_replay_required",
        "independent_replication_evidence_not_emitted",
      ],
    });
  } catch (error) {
    return emptyObservation({
      manifestPath: input.candidateManifestPath,
      manifestSha256: context?.manifestSha256,
      candidateId: context?.manifest.bindings.candidate.candidateId,
      plan: context?.independentPlan,
      independenceGroup,
      policy,
      persistedPreseal,
      presealHashVerified,
      persisted,
      primaryVerified:
        verification?.ok === true && verification.freshnessProofVerified,
      candidateInputIsolationVerified,
      failedProcessObservation,
      blockers: [admissionCode(error)],
    });
  }
}

/**
 * Production entrypoint. It accepts no dependency injection and therefore
 * cannot receive policy, clock, receipt, preseal, verification, or process
 * authority from a request caller. There is no installed store that can prove
 * a v2 candidate-input preseal was persisted before primary execution, so the
 * production lane fails before any policy, receipt, filesystem, or process
 * admission is attempted. The test-only seam below cannot alter that fact.
 *
 * A clean future process observation would establish only server-observed
 * process provenance, freshness, and policy-declared identity/hash bindings.
 * It cannot establish implementation lineage or content independence and can
 * never publish `nhm2_independent_numerical_replication/v1` from this layer.
 */
export async function executeNhm2IndependentNumericalReplication(
  input: ExecuteNhm2IndependentNumericalReplicationInput,
): Promise<Nhm2IndependentNumericalExecutionObservationV1> {
  return emptyObservation({
    manifestPath: input.candidateManifestPath,
    blockers: [
      "independent_preprimary_candidate_preseal_not_configured",
      SEMICLASSICAL_V2_INPUT_CLOSURE_BLOCKER,
    ],
  });
}

const TEST_WORKSPACE_PREFIX = "nhm2-independent-executor-spec-";

function testHarnessEnabled(
  input: ExecuteNhm2IndependentNumericalReplicationInput,
): boolean {
  if (process.env.NODE_ENV !== "test" || process.env.VITEST !== "true") {
    return false;
  }
  if (typeof input.projectRoot !== "string") return false;
  const temporaryRoot = path.resolve(os.tmpdir());
  const projectRoot = path.resolve(input.projectRoot);
  const relative = path.relative(temporaryRoot, projectRoot);
  if (
    relative.length === 0 ||
    relative.startsWith("..") ||
    path.isAbsolute(relative)
  ) {
    return false;
  }
  const firstSegment = relative.split(path.sep)[0] ?? "";
  return firstSegment.startsWith(TEST_WORKSPACE_PREFIX);
}

/**
 * @internal Vitest-only dependency seam. It is available only inside a named
 * OS-temporary test workspace and never in the canonical checkout.
 */
export async function executeNhm2IndependentNumericalReplicationForTest(
  input: ExecuteNhm2IndependentNumericalReplicationInput,
  dependencies: Nhm2IndependentNumericalExecutorTestDependencies,
): Promise<Nhm2IndependentNumericalExecutionObservationV1> {
  if (!testHarnessEnabled(input)) {
    throw new Error(
      "NHM2 independent numerical executor test harness requires NODE_ENV=test, VITEST=true, and a named OS-temporary test workspace.",
    );
  }
  return executeNhm2IndependentNumericalReplicationCore(input, dependencies);
}
