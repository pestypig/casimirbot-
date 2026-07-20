import { createHash, randomUUID } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";

import {
  isNhm2ExperimentReadyTheoryCandidateManifest,
  nhm2ExperimentReadyTheoryFormalInvocation,
  type Nhm2ExperimentReadyTheoryCandidateExecutionPlanV1,
  type Nhm2ExperimentReadyTheoryCandidateManifestV1,
} from "../../shared/contracts/nhm2-experiment-ready-theory-candidate-manifest.v1";
import {
  NHM2_FORMAL_OUTER_OBSERVATION_CHECK_IDS,
  NHM2_FORMAL_OUTER_OBSERVATION_EVIDENCE_ARTIFACT_ID,
  NHM2_FORMAL_OUTER_OBSERVATION_EVIDENCE_CONTRACT_VERSION,
  NHM2_FORMAL_OUTER_OBSERVATION_EVIDENCE_ROLE,
  NHM2_FORMAL_OUTER_OBSERVATION_SUPERSEDED_CONTRACTS,
  buildNhm2FormalOuterObservationEvidence,
  type Nhm2FormalOuterObservationEvidenceV2,
  type Nhm2FormalOuterObservationTrustedContextV2,
} from "../../server/services/theory/nhm2-formal-outer-observation-evidence-adapter";
import { NHM2_FORMAL_KERNEL_REQUIRED_THEOREM_NAME } from "../../server/services/theory/nhm2-formal-kernel-executor";
import {
  NHM2_EXPERIMENT_READY_THEORY_FORMAL_EXECUTION_ARTIFACT_ID,
  NHM2_EXPERIMENT_READY_THEORY_FORMAL_EXECUTION_CONTRACT_VERSION,
  runNhm2ExperimentReadyTheoryFormal,
  type Nhm2ExperimentReadyTheoryFormalExecutionArtifactV1,
  type Nhm2ExperimentReadyTheoryFormalRunSpecV1,
} from "./run-experiment-ready-theory-formal";

export const NHM2_EXPERIMENT_READY_THEORY_FORMAL_CANDIDATE_EVIDENCE_FILENAME =
  "formal_manifest_certificate.json" as const;
export const NHM2_EXPERIMENT_READY_THEORY_FORMAL_CANDIDATE_EVIDENCE_RELATIVE_PATH =
  `evidence/${NHM2_EXPERIMENT_READY_THEORY_FORMAL_CANDIDATE_EVIDENCE_FILENAME}` as const;

export type RunNhm2ExperimentReadyTheoryFormalCandidateInput = {
  candidateManifestPath: string;
  formalRunSpecPath: string;
  workspaceRoot?: string;
  resourceLimits?: Partial<Nhm2ExperimentReadyTheoryFormalCandidateResourceLimitsV1>;
};

export type Nhm2ExperimentReadyTheoryFormalCandidateResourceLimitsV1 = {
  maxCandidateManifestBytes: number;
  maxFormalRunSpecBytes: number;
  maxExecutionArtifactBytes: number;
  maxEvidenceBytes: number;
};

export const NHM2_EXPERIMENT_READY_THEORY_FORMAL_CANDIDATE_DEFAULT_LIMITS = {
  maxCandidateManifestBytes: 32 * 1024 * 1024,
  maxFormalRunSpecBytes: 64 * 1024 * 1024,
  maxExecutionArtifactBytes: 256 * 1024 * 1024,
  maxEvidenceBytes: 16 * 1024 * 1024,
} as const satisfies Nhm2ExperimentReadyTheoryFormalCandidateResourceLimitsV1;

export const NHM2_EXPERIMENT_READY_THEORY_FORMAL_CANDIDATE_HARD_LIMITS = {
  maxCandidateManifestBytes: 64 * 1024 * 1024,
  maxFormalRunSpecBytes: 256 * 1024 * 1024,
  maxExecutionArtifactBytes: 512 * 1024 * 1024,
  maxEvidenceBytes: 64 * 1024 * 1024,
} as const satisfies Nhm2ExperimentReadyTheoryFormalCandidateResourceLimitsV1;

export type RunNhm2ExperimentReadyTheoryFormalCandidateResult = {
  status: "pass" | "fail";
  planRole: "formal_kernel";
  candidateManifestPath: string;
  candidateManifestSha256: string;
  formalRunSpecPath: string;
  formalRunSpecSha256: string;
  executionArtifactPath: string;
  executionArtifactSha256: string;
  evidencePath: string;
  evidenceSha256: string;
  evidenceSizeBytes: number;
  blockers: string[];
  claimBoundary: Nhm2FormalOuterObservationEvidenceV2["claimBoundary"];
};

export class Nhm2ExperimentReadyTheoryFormalCandidateError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "Nhm2ExperimentReadyTheoryFormalCandidateError";
    this.code = code;
  }
}

type FileIdentity = {
  dev: string;
  ino: string;
  mode: number;
  size: number;
  mtimeMs: number;
  ctimeMs: number;
  nlink: number;
};

type SecureCanonicalJsonObservation = {
  absolutePath: string;
  relativePath: string;
  bytes: Buffer;
  sha256: string;
  sizeBytes: number;
  identity: FileIdentity;
  value: unknown;
};

const SHA256 = /^[a-f0-9]{64}$/;
const GIT_SHA = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;
const FRESHNESS_CLOCK_TOLERANCE_MS = 2_000;

const fail = (code: string, message: string): never => {
  throw new Nhm2ExperimentReadyTheoryFormalCandidateError(code, message);
};

const sha256 = (value: Uint8Array | string): string =>
  createHash("sha256").update(value).digest("hex");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const hasExactKeys = (
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean => {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return (
    actual.length === sortedExpected.length &&
    actual.every((key, index) => key === sortedExpected[index])
  );
};

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && value.trim() === value;

const isIsoTimestamp = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const milliseconds = Date.parse(value);
  return (
    Number.isFinite(milliseconds) &&
    new Date(milliseconds).toISOString() === value
  );
};

const resolveResourceLimits = (
  override?: Partial<Nhm2ExperimentReadyTheoryFormalCandidateResourceLimitsV1>,
): Nhm2ExperimentReadyTheoryFormalCandidateResourceLimitsV1 => {
  const limits = {
    ...NHM2_EXPERIMENT_READY_THEORY_FORMAL_CANDIDATE_DEFAULT_LIMITS,
    ...override,
  };
  for (const key of Object.keys(limits) as Array<keyof typeof limits>) {
    const value = limits[key];
    if (
      !Number.isSafeInteger(value) ||
      value <= 0 ||
      value > NHM2_EXPERIMENT_READY_THEORY_FORMAL_CANDIDATE_HARD_LIMITS[key]
    ) {
      fail(
        "resource_limits_invalid",
        `${key} must be a positive safe integer within the hard limit.`,
      );
    }
  }
  return limits;
};

const pathKey = (value: string): string => {
  const normalized = path.resolve(value);
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
};

const samePath = (left: string, right: string): boolean =>
  pathKey(left) === pathKey(right);

const isInside = (root: string, candidate: string): boolean => {
  const relative = path.relative(root, candidate);
  return (
    relative.length > 0 &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
};

const portablePath = (root: string, absolutePath: string): string =>
  path.relative(root, absolutePath).split(path.sep).join("/");

const resolveContainedPath = (
  workspaceRoot: string,
  candidatePath: string,
  label: string,
): string => {
  if (!isText(candidatePath) || candidatePath.includes("\0")) {
    return fail("path_invalid", `${label} path is invalid.`);
  }
  const absolutePath = path.isAbsolute(candidatePath)
    ? path.resolve(candidatePath)
    : path.resolve(workspaceRoot, candidatePath);
  if (!isInside(workspaceRoot, absolutePath)) {
    return fail("path_escape", `${label} escapes the trusted workspace.`);
  }
  return absolutePath;
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

const identitiesMatch = (left: FileIdentity, right: FileIdentity): boolean =>
  isDeepStrictEqual(left, right);

async function assertSafeExistingPathChain(input: {
  workspaceRoot: string;
  workspaceRealPath: string;
  absolutePath: string;
  finalKind: "file" | "directory";
}): Promise<void> {
  const relative = path.relative(input.workspaceRoot, input.absolutePath);
  const segments = relative.split(path.sep);
  let cursor = input.workspaceRoot;
  for (let index = 0; index < segments.length; index += 1) {
    cursor = path.join(cursor, segments[index]);
    const stat = await fs
      .lstat(cursor)
      .catch((error: NodeJS.ErrnoException) =>
        fail("path_unreadable", `${cursor}: ${error.code ?? "lstat_failed"}`),
      );
    const final = index === segments.length - 1;
    if (stat.isSymbolicLink()) {
      fail(
        "symlink_or_reparse_forbidden",
        `${cursor} is a symbolic link or reparse point.`,
      );
    }
    if ((!final || input.finalKind === "directory") && !stat.isDirectory()) {
      fail("regular_directory_required", `${cursor} is not a directory.`);
    }
    if (final && input.finalKind === "file") {
      if (!stat.isFile()) {
        fail("regular_file_required", `${cursor} is not a regular file.`);
      }
      if (stat.nlink !== 1) {
        fail("hardlink_forbidden", `${cursor} has nlink=${stat.nlink}.`);
      }
    }
    const actualRealPath = await fs.realpath(cursor);
    const expectedRealPath = path.resolve(
      input.workspaceRealPath,
      ...segments.slice(0, index + 1),
    );
    if (!samePath(actualRealPath, expectedRealPath)) {
      fail(
        "symlink_or_reparse_forbidden",
        `${cursor} resolves through an alias.`,
      );
    }
  }
}

async function assertSafeMissingPath(input: {
  workspaceRoot: string;
  workspaceRealPath: string;
  absolutePath: string;
  label: string;
}): Promise<void> {
  const relative = path.relative(input.workspaceRoot, input.absolutePath);
  const segments = relative.split(path.sep);
  let cursor = input.workspaceRoot;
  for (let index = 0; index < segments.length; index += 1) {
    cursor = path.join(cursor, segments[index]);
    const stat = await fs
      .lstat(cursor)
      .catch((error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") return null;
        return fail(
          "path_unreadable",
          `${cursor}: ${error.code ?? "lstat_failed"}`,
        );
      });
    if (stat == null) return;
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      fail(
        "symlink_or_reparse_forbidden",
        `${cursor} is not a safe regular ancestor directory.`,
      );
    }
    const actualRealPath = await fs.realpath(cursor);
    const expectedRealPath = path.resolve(
      input.workspaceRealPath,
      ...segments.slice(0, index + 1),
    );
    if (!samePath(actualRealPath, expectedRealPath)) {
      fail(
        "symlink_or_reparse_forbidden",
        `${cursor} resolves through an alias.`,
      );
    }
  }
  fail("output_preexists", `${input.label} already exists.`);
}

async function readSecureCanonicalJson(input: {
  workspaceRoot: string;
  workspaceRealPath: string;
  inputPath: string;
  label: string;
  maxBytes: number;
  canonicalEncoding: "compact_json_v1" | "pretty_json_2space_newline_v1";
}): Promise<SecureCanonicalJsonObservation> {
  const absolutePath = resolveContainedPath(
    input.workspaceRoot,
    input.inputPath,
    input.label,
  );
  await assertSafeExistingPathChain({
    workspaceRoot: input.workspaceRoot,
    workspaceRealPath: input.workspaceRealPath,
    absolutePath,
    finalKind: "file",
  });
  const beforeStat = await fs.lstat(absolutePath);
  if (beforeStat.size > input.maxBytes) {
    fail(
      "resource_limit_exceeded",
      `${input.label} exceeds its ${input.maxBytes}-byte limit.`,
    );
  }
  const before = identity(beforeStat);
  let handle: Awaited<ReturnType<typeof fs.open>> | null = null;
  try {
    const noFollow =
      process.platform === "win32" ? 0 : (fsConstants.O_NOFOLLOW ?? 0);
    handle = await fs.open(absolutePath, fsConstants.O_RDONLY | noFollow);
    const openedStat = await handle.stat();
    if (openedStat.size > input.maxBytes) {
      fail(
        "resource_limit_exceeded",
        `${input.label} exceeds its ${input.maxBytes}-byte limit.`,
      );
    }
    const opened = identity(openedStat);
    if (!identitiesMatch(before, opened)) {
      fail("input_changed", `${input.label} changed while opening.`);
    }
    const bytes = await handle.readFile();
    if (bytes.byteLength > input.maxBytes) {
      fail(
        "resource_limit_exceeded",
        `${input.label} exceeds its ${input.maxBytes}-byte limit.`,
      );
    }
    const afterStat = await fs.lstat(absolutePath);
    const after = identity(afterStat);
    if (
      afterStat.isSymbolicLink() ||
      !afterStat.isFile() ||
      afterStat.nlink !== 1 ||
      !identitiesMatch(before, after)
    ) {
      fail("input_changed", `${input.label} changed while reading.`);
    }
    const text = (() => {
      try {
        return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      } catch {
        return fail(
          "canonical_json_invalid",
          `${input.label} is not valid UTF-8 JSON.`,
        );
      }
    })();
    const value: unknown = (() => {
      try {
        return JSON.parse(text) as unknown;
      } catch {
        return fail(
          "canonical_json_invalid",
          `${input.label} is not valid JSON.`,
        );
      }
    })();
    const canonicalText =
      input.canonicalEncoding === "compact_json_v1"
        ? JSON.stringify(value)
        : `${JSON.stringify(value, null, 2)}\n`;
    if (canonicalText !== text) {
      fail("canonical_json_invalid", `${input.label} is not canonical JSON.`);
    }
    return {
      absolutePath,
      relativePath: portablePath(input.workspaceRoot, absolutePath),
      bytes,
      sha256: sha256(bytes),
      sizeBytes: bytes.byteLength,
      identity: before,
      value,
    };
  } finally {
    await handle?.close().catch(() => undefined);
  }
}

const exactlyOneFormalPlan = (
  candidate: Nhm2ExperimentReadyTheoryCandidateManifestV1,
): Nhm2ExperimentReadyTheoryCandidateExecutionPlanV1 => {
  const plans = candidate.executionPlans.filter(
    (entry) => entry.planRole === "formal_kernel",
  );
  if (plans.length !== 1) {
    return fail(
      "formal_plan_invalid",
      "Candidate must contain exactly one formal_kernel plan.",
    );
  }
  return plans[0];
};

const isExecutionArtifactEnvelope = (
  value: unknown,
): value is Nhm2ExperimentReadyTheoryFormalExecutionArtifactV1 =>
  isRecord(value) &&
  hasExactKeys(value, [
    "artifactId",
    "contractVersion",
    "generatedAt",
    "identity",
    "inputs",
    "planRole",
    "theoremName",
    "replayOutputInventory",
    "executionObservation",
    "claimBoundary",
  ]) &&
  value.artifactId ===
    NHM2_EXPERIMENT_READY_THEORY_FORMAL_EXECUTION_ARTIFACT_ID &&
  value.contractVersion ===
    NHM2_EXPERIMENT_READY_THEORY_FORMAL_EXECUTION_CONTRACT_VERSION &&
  value.planRole === "formal_kernel" &&
  isRecord(value.identity) &&
  isRecord(value.inputs) &&
  isRecord(value.replayOutputInventory) &&
  isRecord(value.executionObservation) &&
  isRecord(value.claimBoundary);

const expectedEvidenceClaimBoundary = {
  formalLogicReplayOnly: true,
  outerObservedExecutionOnly: true,
  numericalPhysicsValidated: false,
  theoryClosureEstablished: false,
  empiricalValidationEstablished: false,
  physicalViabilityEstablished: false,
  transportEstablished: false,
  propulsionEstablished: false,
  routeEtaEstablished: false,
  speedAuthorityEstablished: false,
} as const;

/**
 * Strictly checks either a pass or fail v2 certificate after derivation.  This
 * deliberately verifies exact keys and recomputable status/blocker semantics;
 * it does not accept a producer- or Lean-authored status field as authority.
 */
export const isExactNhm2FormalOuterObservationEvidenceV2 = (
  value: unknown,
): value is Nhm2FormalOuterObservationEvidenceV2 => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "artifactId",
      "contractVersion",
      "evidenceRole",
      "supersedesContractVersions",
      "generatedAt",
      "status",
      "diagnosticTier",
      "authority",
      "identity",
      "formalClaim",
      "checks",
      "blockers",
      "claimBoundary",
    ]) ||
    value.artifactId !== NHM2_FORMAL_OUTER_OBSERVATION_EVIDENCE_ARTIFACT_ID ||
    value.contractVersion !==
      NHM2_FORMAL_OUTER_OBSERVATION_EVIDENCE_CONTRACT_VERSION ||
    value.evidenceRole !== NHM2_FORMAL_OUTER_OBSERVATION_EVIDENCE_ROLE ||
    !isDeepStrictEqual(
      value.supersedesContractVersions,
      NHM2_FORMAL_OUTER_OBSERVATION_SUPERSEDED_CONTRACTS,
    ) ||
    (value.status !== "pass" && value.status !== "fail") ||
    value.diagnosticTier !== "diagnostic" ||
    value.authority !== "outer_observed_direct_lean_two_cold_replays" ||
    !isIsoTimestamp(value.generatedAt) ||
    !isRecord(value.identity) ||
    !hasExactKeys(value.identity, [
      "candidateId",
      "candidateManifestId",
      "candidateManifestSha256",
      "requestId",
      "runId",
      "receiptId",
      "runtimeId",
      "sourceCommitSha",
    ]) ||
    !Object.values(value.identity).every(isText) ||
    !SHA256.test(String(value.identity.candidateManifestSha256)) ||
    !GIT_SHA.test(String(value.identity.sourceCommitSha)) ||
    !isRecord(value.formalClaim) ||
    !hasExactKeys(value.formalClaim, [
      "theoremName",
      "theoremResult",
      "nativeAxiomAudit",
      "replayCount",
      "replayTranscriptSha256",
      "replayOutputInventorySha256",
      "sourceLedgerSha256",
      "toolchainLedgerSha256",
      "inputLedgerSha256",
    ]) ||
    !Array.isArray(value.checks) ||
    value.checks.length !== NHM2_FORMAL_OUTER_OBSERVATION_CHECK_IDS.length ||
    !Array.isArray(value.blockers) ||
    !value.blockers.every(isText) ||
    !isDeepStrictEqual(value.claimBoundary, expectedEvidenceClaimBoundary)
  ) {
    return false;
  }

  const checkIds = value.checks.map((entry) =>
    isRecord(entry) ? entry.checkId : null,
  );
  if (!isDeepStrictEqual(checkIds, NHM2_FORMAL_OUTER_OBSERVATION_CHECK_IDS)) {
    return false;
  }
  for (const check of value.checks) {
    if (
      !isRecord(check) ||
      !hasExactKeys(check, ["checkId", "status", "blockers"]) ||
      (check.status !== "pass" && check.status !== "fail") ||
      !Array.isArray(check.blockers) ||
      !check.blockers.every(isText) ||
      (check.status === "pass" && check.blockers.length !== 0) ||
      (check.status === "fail" && check.blockers.length === 0)
    ) {
      return false;
    }
  }
  const blockers = value.checks.flatMap((entry) => entry.blockers);
  const expectedStatus = blockers.length === 0 ? "pass" : "fail";
  if (
    value.status !== expectedStatus ||
    !isDeepStrictEqual(value.blockers, blockers)
  ) {
    return false;
  }

  const formalClaim = value.formalClaim;
  const nullableSha256 = (entry: unknown): boolean =>
    entry === null || (typeof entry === "string" && SHA256.test(entry));
  return (
    formalClaim.theoremName === NHM2_FORMAL_KERNEL_REQUIRED_THEOREM_NAME &&
    formalClaim.theoremResult ===
      (value.status === "pass" ? "proved" : "not_certified") &&
    formalClaim.nativeAxiomAudit ===
      (value.status === "pass" ? "no_axioms" : "not_certified") &&
    Number.isSafeInteger(formalClaim.replayCount) &&
    (formalClaim.replayCount as number) >= 0 &&
    (value.status !== "pass" || formalClaim.replayCount === 2) &&
    Array.isArray(formalClaim.replayTranscriptSha256) &&
    formalClaim.replayTranscriptSha256.length === 2 &&
    formalClaim.replayTranscriptSha256.every(nullableSha256) &&
    Array.isArray(formalClaim.replayOutputInventorySha256) &&
    formalClaim.replayOutputInventorySha256.length === 2 &&
    formalClaim.replayOutputInventorySha256.every(nullableSha256) &&
    nullableSha256(formalClaim.sourceLedgerSha256) &&
    nullableSha256(formalClaim.toolchainLedgerSha256) &&
    nullableSha256(formalClaim.inputLedgerSha256) &&
    (value.status !== "pass" ||
      (formalClaim.replayTranscriptSha256.every(
        (entry) => typeof entry === "string" && SHA256.test(entry),
      ) &&
        formalClaim.replayOutputInventorySha256.every(
          (entry) => typeof entry === "string" && SHA256.test(entry),
        ) &&
        typeof formalClaim.sourceLedgerSha256 === "string" &&
        SHA256.test(formalClaim.sourceLedgerSha256) &&
        typeof formalClaim.toolchainLedgerSha256 === "string" &&
        SHA256.test(formalClaim.toolchainLedgerSha256) &&
        typeof formalClaim.inputLedgerSha256 === "string" &&
        SHA256.test(formalClaim.inputLedgerSha256)))
  );
};

const verifyDerivedEvidenceExact = (input: {
  evidence: Nhm2FormalOuterObservationEvidenceV2;
  trustedContext: Nhm2FormalOuterObservationTrustedContextV2;
  executionArtifact: Nhm2ExperimentReadyTheoryFormalExecutionArtifactV1;
}): Buffer => {
  if (!isExactNhm2FormalOuterObservationEvidenceV2(input.evidence)) {
    return fail(
      "formal_evidence_invalid",
      "Derived formal evidence is not an exact v2 pass/fail certificate.",
    );
  }
  const independentlyDerived = buildNhm2FormalOuterObservationEvidence({
    executionArtifact: input.executionArtifact,
    executionObservation: input.executionArtifact.executionObservation,
    trustedContext: input.trustedContext,
  });
  if (!isDeepStrictEqual(independentlyDerived, input.evidence)) {
    return fail(
      "formal_evidence_nondeterministic",
      "Repeated evidence derivation did not produce the exact same value.",
    );
  }
  if (
    !isDeepStrictEqual(input.evidence.identity, {
      candidateId: input.trustedContext.candidate.candidateId,
      candidateManifestId: input.trustedContext.candidate.candidateManifestId,
      candidateManifestSha256:
        input.trustedContext.candidate.candidateManifestSha256,
      requestId: input.trustedContext.formalPlan.requestId,
      runId: input.trustedContext.formalPlan.runId,
      receiptId: input.trustedContext.formalPlan.receiptId,
      runtimeId: input.trustedContext.formalPlan.runtimeId,
      sourceCommitSha: input.trustedContext.formalPlan.sourceCommitSha,
    })
  ) {
    return fail(
      "formal_evidence_binding_mismatch",
      "Derived formal evidence does not bind the trusted candidate and plan.",
    );
  }
  const bytes = Buffer.from(JSON.stringify(input.evidence), "utf8");
  const reparsed: unknown = JSON.parse(bytes.toString("utf8"));
  if (
    JSON.stringify(reparsed) !== bytes.toString("utf8") ||
    !isDeepStrictEqual(reparsed, input.evidence) ||
    !isExactNhm2FormalOuterObservationEvidenceV2(reparsed)
  ) {
    return fail(
      "formal_evidence_canonicalization_failed",
      "Derived formal evidence did not survive exact canonical replay.",
    );
  }
  return bytes;
};

async function publishCanonicalNoOverwrite(input: {
  workspaceRoot: string;
  workspaceRealPath: string;
  outputRoot: string;
  evidencePath: string;
  bytes: Buffer;
  maxEvidenceBytes: number;
  publishStartedAtMs: number;
}): Promise<SecureCanonicalJsonObservation> {
  if (input.bytes.byteLength > input.maxEvidenceBytes) {
    fail(
      "resource_limit_exceeded",
      `Formal evidence exceeds its ${input.maxEvidenceBytes}-byte limit.`,
    );
  }
  const evidenceDirectory = path.dirname(input.evidencePath);
  await fs
    .mkdir(evidenceDirectory, { recursive: false, mode: 0o700 })
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code === "EEXIST") {
        return fail(
          "evidence_directory_preexists",
          "Formal evidence directory already exists; refusing overwrite.",
        );
      }
      return fail(
        "evidence_directory_create_failed",
        error.code ?? "mkdir_failed",
      );
    });
  await assertSafeExistingPathChain({
    workspaceRoot: input.workspaceRoot,
    workspaceRealPath: input.workspaceRealPath,
    absolutePath: evidenceDirectory,
    finalKind: "directory",
  });

  const temporaryPath = path.join(
    evidenceDirectory,
    `.${NHM2_EXPERIMENT_READY_THEORY_FORMAL_CANDIDATE_EVIDENCE_FILENAME}.${process.pid}.${randomUUID()}.tmp`,
  );
  let linked = false;
  try {
    const handle = await fs.open(temporaryPath, "wx", 0o600);
    try {
      await handle.writeFile(input.bytes);
      await handle.sync();
    } finally {
      await handle.close();
    }
    const temporaryStat = await fs.lstat(temporaryPath);
    if (
      temporaryStat.isSymbolicLink() ||
      !temporaryStat.isFile() ||
      temporaryStat.nlink !== 1 ||
      temporaryStat.size !== input.bytes.byteLength
    ) {
      return fail(
        "temporary_evidence_invalid",
        "Temporary evidence file is not a fresh regular file.",
      );
    }
    const temporaryBytes = await fs.readFile(temporaryPath);
    if (!temporaryBytes.equals(input.bytes)) {
      return fail(
        "temporary_evidence_changed",
        "Temporary evidence bytes changed before publication.",
      );
    }
    await fs
      .link(temporaryPath, input.evidencePath)
      .catch((error: NodeJS.ErrnoException) =>
        fail(
          error.code === "EEXIST"
            ? "evidence_output_preexists"
            : "evidence_publish_failed",
          error.code ?? "link_failed",
        ),
      );
    linked = true;
  } finally {
    await fs.unlink(temporaryPath).catch(() => undefined);
  }

  if (!linked) {
    return fail("evidence_publish_failed", "Formal evidence was not linked.");
  }
  const entries = await fs.readdir(evidenceDirectory);
  if (
    entries.length !== 1 ||
    entries[0] !==
      NHM2_EXPERIMENT_READY_THEORY_FORMAL_CANDIDATE_EVIDENCE_FILENAME
  ) {
    return fail(
      "evidence_inventory_mismatch",
      "Formal evidence directory contains an unexpected entry.",
    );
  }
  const observed = await readSecureCanonicalJson({
    workspaceRoot: input.workspaceRoot,
    workspaceRealPath: input.workspaceRealPath,
    inputPath: portablePath(input.workspaceRoot, input.evidencePath),
    label: "formal manifest certificate",
    maxBytes: input.maxEvidenceBytes,
    canonicalEncoding: "compact_json_v1",
  });
  const completedAtMs = Date.now();
  if (
    observed.identity.mtimeMs <
      input.publishStartedAtMs - FRESHNESS_CLOCK_TOLERANCE_MS ||
    observed.identity.mtimeMs > completedAtMs + FRESHNESS_CLOCK_TOLERANCE_MS ||
    !observed.bytes.equals(input.bytes) ||
    !isExactNhm2FormalOuterObservationEvidenceV2(observed.value)
  ) {
    return fail(
      "published_evidence_verification_failed",
      "Published formal evidence failed freshness, hash, or exact-schema replay.",
    );
  }
  if (!isInside(input.outputRoot, observed.absolutePath)) {
    return fail(
      "evidence_output_escape",
      "Published formal evidence escaped the formal output root.",
    );
  }
  return observed;
}

export async function runNhm2ExperimentReadyTheoryFormalCandidate(
  input: RunNhm2ExperimentReadyTheoryFormalCandidateInput,
): Promise<RunNhm2ExperimentReadyTheoryFormalCandidateResult> {
  const limits = resolveResourceLimits(input.resourceLimits);
  const workspaceRoot = path.resolve(input.workspaceRoot ?? process.cwd());
  const workspaceStat = await fs
    .lstat(workspaceRoot)
    .catch((error: NodeJS.ErrnoException) =>
      fail("workspace_unreadable", error.code ?? "lstat_failed"),
    );
  if (!workspaceStat.isDirectory() || workspaceStat.isSymbolicLink()) {
    fail("workspace_invalid", "Workspace root must be a regular directory.");
  }
  const workspaceRealPath = await fs.realpath(workspaceRoot);
  if (!samePath(workspaceRoot, workspaceRealPath)) {
    fail(
      "workspace_invalid",
      "Workspace root resolves through a symlink or reparse alias.",
    );
  }

  const candidateBefore = await readSecureCanonicalJson({
    workspaceRoot,
    workspaceRealPath,
    inputPath: input.candidateManifestPath,
    label: "candidate manifest",
    maxBytes: limits.maxCandidateManifestBytes,
    canonicalEncoding: "pretty_json_2space_newline_v1",
  });
  if (!isNhm2ExperimentReadyTheoryCandidateManifest(candidateBefore.value)) {
    fail(
      "candidate_manifest_invalid",
      "Candidate manifest is not a complete frozen pre-run manifest.",
    );
  }
  const candidateBeforeValue =
    candidateBefore.value as Nhm2ExperimentReadyTheoryCandidateManifestV1;
  if (candidateBeforeValue.readiness.status !== "pre_run_manifest_ready") {
    fail(
      "candidate_manifest_invalid",
      "Candidate manifest is not ready for a governed formal run.",
    );
  }
  const planBefore = exactlyOneFormalPlan(candidateBeforeValue);
  const outputRoot = resolveContainedPath(
    workspaceRoot,
    planBefore.expectedInvocation.outputDirectory,
    "formal output directory",
  );
  const evidencePath = path.join(
    outputRoot,
    ...NHM2_EXPERIMENT_READY_THEORY_FORMAL_CANDIDATE_EVIDENCE_RELATIVE_PATH.split(
      "/",
    ),
  );
  const expectedEvidenceOutputs =
    candidateBeforeValue.expectedEvidenceOutputs.filter(
      (entry) => entry.evidenceRole === "formal_manifest_certificate",
    );
  if (
    expectedEvidenceOutputs.length !== 1 ||
    expectedEvidenceOutputs[0].contractVersion !==
      NHM2_FORMAL_OUTER_OBSERVATION_EVIDENCE_CONTRACT_VERSION ||
    expectedEvidenceOutputs[0].requestId !== planBefore.requestId ||
    expectedEvidenceOutputs[0].runId !== planBefore.runId ||
    expectedEvidenceOutputs[0].receiptId !== planBefore.receiptId ||
    expectedEvidenceOutputs[0].runtimeId !== planBefore.runtimeId ||
    !samePath(
      resolveContainedPath(
        workspaceRoot,
        expectedEvidenceOutputs[0].outputPath,
        "formal expected evidence output",
      ),
      evidencePath,
    )
  ) {
    fail(
      "formal_evidence_output_binding_mismatch",
      "Candidate formal evidence expectation is not the exact v2 plan-bound canonical output.",
    );
  }
  await assertSafeMissingPath({
    workspaceRoot,
    workspaceRealPath,
    absolutePath: outputRoot,
    label: "formal output directory",
  });

  const specBefore = await readSecureCanonicalJson({
    workspaceRoot,
    workspaceRealPath,
    inputPath: input.formalRunSpecPath,
    label: "formal run spec",
    maxBytes: limits.maxFormalRunSpecBytes,
    canonicalEncoding: "compact_json_v1",
  });
  const frozenFormalInvocation = (() => {
    try {
      return nhm2ExperimentReadyTheoryFormalInvocation({
        candidateManifestPath: candidateBefore.relativePath,
        outputDirectory: planBefore.expectedInvocation.outputDirectory,
        runId: planBefore.runId,
      });
    } catch (error) {
      return fail(
        "formal_plan_invalid",
        error instanceof Error
          ? error.message
          : "Formal plan has no deterministic run-spec path.",
      );
    }
  })();
  const frozenFormalRunSpecPath = frozenFormalInvocation.formalRunSpecPath;
  if (
    planBefore.expectedInvocation.entrypoint !==
      frozenFormalInvocation.entrypoint ||
    planBefore.expectedInvocation.command !== frozenFormalInvocation.command ||
    !isDeepStrictEqual(
      planBefore.expectedInvocation.args,
      frozenFormalInvocation.args,
    ) ||
    planBefore.expectedInvocation.cwd !== frozenFormalInvocation.cwd
  ) {
    fail(
      "formal_plan_invocation_mismatch",
      "Formal plan invocation is not the exact governed producer command.",
    );
  }
  const frozenFormalRunSpecAbsolutePath = resolveContainedPath(
    workspaceRoot,
    frozenFormalRunSpecPath,
    "frozen formal run spec",
  );
  if (!samePath(specBefore.absolutePath, frozenFormalRunSpecAbsolutePath)) {
    fail(
      "formal_run_spec_path_mismatch",
      "Formal run spec must occupy the exact path frozen by the candidate plan.",
    );
  }
  const executionStartedAtMs = Date.now();
  const wrapperResult = await runNhm2ExperimentReadyTheoryFormal({
    workspaceRoot,
    candidateManifestPath: candidateBefore.relativePath,
    formalRunSpecPath: specBefore.relativePath,
  });
  const executionCompletedAtMs = Date.now();

  const candidateAfter = await readSecureCanonicalJson({
    workspaceRoot,
    workspaceRealPath,
    inputPath: candidateBefore.relativePath,
    label: "candidate manifest after formal execution",
    maxBytes: limits.maxCandidateManifestBytes,
    canonicalEncoding: "pretty_json_2space_newline_v1",
  });
  const specAfter = await readSecureCanonicalJson({
    workspaceRoot,
    workspaceRealPath,
    inputPath: specBefore.relativePath,
    label: "formal run spec after formal execution",
    maxBytes: limits.maxFormalRunSpecBytes,
    canonicalEncoding: "compact_json_v1",
  });
  if (
    !identitiesMatch(candidateBefore.identity, candidateAfter.identity) ||
    !candidateBefore.bytes.equals(candidateAfter.bytes) ||
    !identitiesMatch(specBefore.identity, specAfter.identity) ||
    !specBefore.bytes.equals(specAfter.bytes) ||
    wrapperResult.candidateManifestSha256 !== candidateAfter.sha256 ||
    wrapperResult.formalRunSpecSha256 !== specAfter.sha256
  ) {
    fail(
      "trusted_input_changed",
      "Candidate or formal run spec changed across the formal execution.",
    );
  }
  if (!isNhm2ExperimentReadyTheoryCandidateManifest(candidateAfter.value)) {
    fail(
      "candidate_manifest_invalid",
      "Reopened candidate manifest failed exact validation.",
    );
  }
  const candidate =
    candidateAfter.value as Nhm2ExperimentReadyTheoryCandidateManifestV1;
  const plan = exactlyOneFormalPlan(candidate);
  if (!isDeepStrictEqual(plan, planBefore)) {
    fail("formal_plan_changed", "Formal execution plan changed during run.");
  }
  const spec = specAfter.value as Nhm2ExperimentReadyTheoryFormalRunSpecV1;

  const outer = await readSecureCanonicalJson({
    workspaceRoot,
    workspaceRealPath,
    inputPath: wrapperResult.executionArtifactPath,
    label: "formal outer execution artifact",
    maxBytes: limits.maxExecutionArtifactBytes,
    canonicalEncoding: "compact_json_v1",
  });
  const expectedOuterPath = resolveContainedPath(
    workspaceRoot,
    spec.outerArtifactPath,
    "formal outer execution artifact",
  );
  if (!isExecutionArtifactEnvelope(outer.value)) {
    fail(
      "formal_outer_artifact_invalid",
      "Reopened formal execution artifact has an invalid envelope.",
    );
  }
  const executionArtifact =
    outer.value as Nhm2ExperimentReadyTheoryFormalExecutionArtifactV1;
  if (
    !samePath(outer.absolutePath, expectedOuterPath) ||
    !samePath(
      outer.absolutePath,
      path.join(outputRoot, path.basename(outer.absolutePath)),
    ) ||
    outer.sha256 !== wrapperResult.executionArtifactSha256 ||
    outer.sizeBytes !== wrapperResult.executionArtifactSizeBytes ||
    outer.identity.mtimeMs <
      executionStartedAtMs - FRESHNESS_CLOCK_TOLERANCE_MS ||
    outer.identity.mtimeMs >
      executionCompletedAtMs + FRESHNESS_CLOCK_TOLERANCE_MS ||
    !isDeepStrictEqual(
      executionArtifact.executionObservation,
      wrapperResult.observation,
    )
  ) {
    fail(
      "formal_outer_artifact_invalid",
      "Reopened formal execution artifact failed path, freshness, hash, or observation binding.",
    );
  }
  const trustedContext: Nhm2FormalOuterObservationTrustedContextV2 = {
    candidate: {
      candidateId: candidate.bindings.candidate.candidateId,
      candidateManifestId: candidate.manifestId,
      candidateManifestPath: candidateAfter.relativePath,
      candidateManifestSha256: candidateAfter.sha256,
      candidateManifestSizeBytes: candidateAfter.sizeBytes,
      candidateFrozenAt: candidate.frozenAt,
      claimBoundary: candidate.claimBoundary,
    },
    formalPlan: plan,
    formalRunSpec: {
      path: specAfter.relativePath,
      sha256: specAfter.sha256,
      sizeBytes: specAfter.sizeBytes,
      value: spec,
    },
  };
  const evidence = buildNhm2FormalOuterObservationEvidence({
    executionArtifact,
    executionObservation: executionArtifact.executionObservation,
    trustedContext,
  });
  const evidenceBytes = verifyDerivedEvidenceExact({
    evidence,
    trustedContext,
    executionArtifact,
  });

  const published = await publishCanonicalNoOverwrite({
    workspaceRoot,
    workspaceRealPath,
    outputRoot,
    evidencePath,
    bytes: evidenceBytes,
    maxEvidenceBytes: limits.maxEvidenceBytes,
    publishStartedAtMs: Date.now(),
  });
  if (published.sha256 !== sha256(evidenceBytes)) {
    fail(
      "published_evidence_hash_mismatch",
      "Published formal evidence digest does not match derived evidence.",
    );
  }

  return {
    status: evidence.status,
    planRole: "formal_kernel",
    candidateManifestPath: candidateAfter.relativePath,
    candidateManifestSha256: candidateAfter.sha256,
    formalRunSpecPath: specAfter.relativePath,
    formalRunSpecSha256: specAfter.sha256,
    executionArtifactPath: outer.relativePath,
    executionArtifactSha256: outer.sha256,
    evidencePath: published.relativePath,
    evidenceSha256: published.sha256,
    evidenceSizeBytes: published.sizeBytes,
    blockers: [...evidence.blockers],
    claimBoundary: { ...evidence.claimBoundary },
  };
}

export const parseNhm2ExperimentReadyTheoryFormalCandidateCliArgs = (
  argv: string[],
): {
  candidateManifestPath: string;
  formalRunSpecPath: string;
} => {
  let candidateManifestPath: string | null = null;
  let formalRunSpecPath: string | null = null;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (
      argument !== "--candidate-manifest" &&
      argument !== "--formal-run-spec"
    ) {
      throw new Error(`Unknown argument: ${argument}`);
    }
    const value = argv[++index];
    if (!isText(value)) throw new Error(`${argument} requires a value.`);
    if (argument === "--candidate-manifest") {
      if (candidateManifestPath != null) {
        throw new Error("--candidate-manifest may be supplied only once.");
      }
      candidateManifestPath = value;
    } else {
      if (formalRunSpecPath != null) {
        throw new Error("--formal-run-spec may be supplied only once.");
      }
      formalRunSpecPath = value;
    }
  }
  if (candidateManifestPath == null) {
    throw new Error("--candidate-manifest is required.");
  }
  if (formalRunSpecPath == null) {
    throw new Error("--formal-run-spec is required.");
  }
  return { candidateManifestPath, formalRunSpecPath };
};

async function main(): Promise<void> {
  const result = await runNhm2ExperimentReadyTheoryFormalCandidate(
    parseNhm2ExperimentReadyTheoryFormalCandidateCliArgs(process.argv.slice(2)),
  );
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

const invokedPath = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : null;
if (invokedPath === import.meta.url) {
  main().catch((error) => {
    const code =
      error instanceof Nhm2ExperimentReadyTheoryFormalCandidateError
        ? ` [${error.code}]`
        : "";
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}${code}\n`,
    );
    process.exitCode = 1;
  });
}
