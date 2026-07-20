import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import {
  isNhm2QeiFeasibilityFrontier,
  type Nhm2QeiFeasibilityArtifactBindingV1,
  type Nhm2QeiFeasibilityCandidateResultV1,
  type Nhm2QeiFeasibilityEvaluationResultV1,
  type Nhm2QeiFeasibilityFrontierV1,
  type Nhm2QeiFeasibilityImmutableBindingV1,
  type Nhm2QeiFeasibilityFrontierVerdict,
} from "../../../shared/contracts/nhm2-qei-feasibility-frontier.v1";
import {
  isTheoryRuntimeReceiptV1,
  type TheoryRuntimeReceiptV1,
} from "../../../shared/contracts/theory-runtime-receipt.v1";
import {
  verifyTheoryRuntimeReceiptFilesystem,
  type TheoryRuntimeReceiptFilesystemVerificationV1,
} from "./theory-runtime-receipt-filesystem-verifier";

const execFileAsync = promisify(execFile);

export const NHM2_QEI_FEASIBILITY_FRONTIER_FILESYSTEM_EVALUATION_VERSION =
  "nhm2_qei_feasibility_frontier_filesystem_evaluation/v1" as const;

export const NHM2_QEI_FEASIBILITY_FRONTIER_RUNTIME_ID =
  "nhm2.qei.feasibility_frontier" as const;

export const NHM2_QEI_FEASIBILITY_MAX_BOUND_FILE_BYTES =
  256 * 1024 * 1024;

export const NHM2_QEI_FEASIBILITY_MAX_RUNTIME_OUTPUT_BYTES =
  512 * 1024 * 1024;

const PERSISTED_RUNTIME_RECEIPT_PATH =
  /^artifacts\/research\/theory-runtime-receipts\/receipt-[A-Za-z0-9_-]{43}\.v1\.json$/;

export type Nhm2QeiFeasibilityVerifiedArtifactV1 = {
  role: string;
  artifactRef: string;
  sha256: string;
  sizeBytes: number;
};

export type Nhm2QeiFeasibilityFrontierFilesystemEvaluationV1 = {
  artifactId: "nhm2_qei_feasibility_frontier_filesystem_evaluation";
  schemaVersion: typeof NHM2_QEI_FEASIBILITY_FRONTIER_FILESYSTEM_EVALUATION_VERSION;
  generatedAt: string;
  sourceFrontier: {
    artifactRef: string;
    sha256: string | null;
    contractValidated: boolean;
    bytesMatchParsedValue: boolean;
    sourceVerdict: Nhm2QeiFeasibilityFrontierVerdict | null;
  };
  run: {
    runId: string | null;
    epochId: string | null;
    commitSha: string | null;
    startedAt: string | null;
    completedAt: string | null;
  };
  evaluationStatus: "complete" | "not_evaluable";
  verdict: Nhm2QeiFeasibilityFrontierVerdict;
  filesystemVerified: boolean;
  runtimeReceiptFilesystemVerified: boolean;
  verifiedArtifacts: Nhm2QeiFeasibilityVerifiedArtifactV1[];
  publicationEnvelope: {
    sourceFrontierExcludedFromProducerManifestToAvoidHashCycle: true;
    publicationEnvelopeNotRuntimeFreshnessReceipt: true;
    sourceFrontierAndRuntimeReceiptHashesCoBound: boolean;
  };
  closureAssessment: {
    finiteDeclaredDomainOutcome: Nhm2QeiFeasibilityFrontierVerdict;
    worldlineQeiClosureEstablished: false;
    universalNoGoEstablished: false;
  };
  blockers: string[];
  claimBoundary: {
    diagnosticOnly: true;
    filesystemVerificationIsEvidenceIntegrityOnly: true;
    filesystemVerificationDoesNotCloseWorldlineQei: true;
    cannotSatisfyWorldlineQeiClosure: true;
    finiteDomainNoCandidateIsNotUniversalNoGo: true;
    sensitivityDoesNotAuthorizeParameterScaling: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
    routeEtaClaimAllowed: false;
    certifiedSpeedClaimAllowed: false;
  };
};

type BoundFile = {
  artifactRef: string;
  sha256: string;
  sizeBytes: number;
  bytes: Buffer;
  data: unknown | null;
};

type ReadPinnedFileResult = {
  absolutePath: string | null;
  bytes: Buffer | null;
  blocker: string | null;
};

type InspectPinnedFileResult = {
  absolutePath: string | null;
  sizeBytes: number | null;
  blocker: string | null;
};

type BoundArtifactReader = (
  role: string,
  binding:
    | Nhm2QeiFeasibilityArtifactBindingV1
    | Nhm2QeiFeasibilityImmutableBindingV1,
  jsonRequired?: boolean,
) => Promise<BoundFile | null>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isSha256 = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f0-9]{64}$/i.test(value);

const unique = (values: string[]): string[] => Array.from(new Set(values));

const stable = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stable);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, stable(entry)]),
  );
};

const sameJson = (left: unknown, right: unknown): boolean =>
  JSON.stringify(stable(left)) === JSON.stringify(stable(right));

const normalizeRepoPath = (value: string): string =>
  value.replace(/\\/g, "/").replace(/^\.\//, "");

export const isPinnedNhm2QeiRepoPath = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  value === normalizeRepoPath(value) &&
  !value.includes("\\") &&
  !value.includes("\0") &&
  !path.posix.isAbsolute(value) &&
  !path.win32.isAbsolute(value) &&
  !value.split("/").some((segment) => segment === "" || segment === "." || segment === "..") &&
  !/(^|\/)latest(?:\.|\/|$)/i.test(value);

export const isPinnedNhm2QeiRunId = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[a-z0-9](?:[a-z0-9._-]{0,126}[a-z0-9])?$/i.test(value) &&
  !/^latest$/i.test(value);

const isInside = (root: string, candidate: string): boolean => {
  const relative = path.relative(root, candidate);
  return (
    relative.length === 0 ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
};

async function inspectPinnedRegularFile(input: {
  projectRoot: string;
  artifactRef: string;
}): Promise<InspectPinnedFileResult> {
  if (!isPinnedNhm2QeiRepoPath(input.artifactRef)) {
    return {
      absolutePath: null,
      sizeBytes: null,
      blocker: `path_not_pinned:${String(input.artifactRef)}`,
    };
  }
  const absolutePath = path.resolve(input.projectRoot, input.artifactRef);
  if (!isInside(input.projectRoot, absolutePath)) {
    return {
      absolutePath,
      sizeBytes: null,
      blocker: `path_outside_project:${input.artifactRef}`,
    };
  }
  try {
    const stat = await fs.lstat(absolutePath);
    if (stat.isSymbolicLink()) {
      return {
        absolutePath,
        sizeBytes: null,
        blocker: `symlink_forbidden:${input.artifactRef}`,
      };
    }
    if (!stat.isFile()) {
      return {
        absolutePath,
        sizeBytes: null,
        blocker: `regular_file_required:${input.artifactRef}`,
      };
    }
    if (stat.size > NHM2_QEI_FEASIBILITY_MAX_BOUND_FILE_BYTES) {
      return {
        absolutePath,
        sizeBytes: stat.size,
        blocker: `file_too_large:${input.artifactRef}:${stat.size}`,
      };
    }
    const [realProjectRoot, realFile] = await Promise.all([
      fs.realpath(input.projectRoot),
      fs.realpath(absolutePath),
    ]);
    if (!isInside(realProjectRoot, realFile)) {
      return {
        absolutePath,
        sizeBytes: null,
        blocker: `realpath_escape:${input.artifactRef}`,
      };
    }
    return { absolutePath, sizeBytes: stat.size, blocker: null };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code ?? "unknown";
    return {
      absolutePath,
      sizeBytes: null,
      blocker: `file_unreadable:${input.artifactRef}:${code}`,
    };
  }
}

async function readPinnedRegularFile(input: {
  projectRoot: string;
  artifactRef: string;
}): Promise<ReadPinnedFileResult> {
  const inspected = await inspectPinnedRegularFile(input);
  const absolutePath = inspected.absolutePath;
  if (
    inspected.blocker != null ||
    inspected.sizeBytes == null ||
    absolutePath == null
  ) {
    return {
      absolutePath,
      bytes: null,
      blocker: inspected.blocker ?? `file_unreadable:${input.artifactRef}`,
    };
  }
  try {
    const handle = await fs.open(absolutePath, "r");
    try {
      const before = await handle.stat();
      if (before.size > NHM2_QEI_FEASIBILITY_MAX_BOUND_FILE_BYTES) {
        return {
          absolutePath,
          bytes: null,
          blocker: `file_too_large:${input.artifactRef}:${before.size}`,
        };
      }
      const bytes = Buffer.alloc(before.size);
      let offset = 0;
      while (offset < bytes.byteLength) {
        const chunk = await handle.read(
          bytes,
          offset,
          bytes.byteLength - offset,
          offset,
        );
        if (chunk.bytesRead === 0) break;
        offset += chunk.bytesRead;
      }
      const after = await handle.stat();
      if (
        offset !== before.size ||
        before.size !== after.size ||
        before.mtimeMs !== after.mtimeMs
      ) {
        return {
          absolutePath,
          bytes: null,
          blocker: `file_changed_while_reading:${input.artifactRef}`,
        };
      }
      return { absolutePath, bytes, blocker: null };
    } finally {
      await handle.close();
    }
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code ?? "unknown";
    return {
      absolutePath,
      bytes: null,
      blocker: `file_unreadable:${input.artifactRef}:${code}`,
    };
  }
}

export async function readPinnedNhm2QeiJsonSource(input: {
  projectRoot: string;
  artifactRef: string;
}): Promise<unknown> {
  const projectRoot = path.resolve(input.projectRoot);
  const read = await readPinnedRegularFile({
    projectRoot,
    artifactRef: input.artifactRef,
  });
  if (read.blocker != null || read.bytes == null)
    throw new Error(read.blocker ?? "Pinned frontier source is unreadable.");
  const data = parseJson(read.bytes);
  if (data == null) throw new Error("Pinned frontier source is not valid JSON.");
  return data;
}

function parseJson(bytes: Buffer): unknown | null {
  try {
    return JSON.parse(bytes.toString("utf8")) as unknown;
  } catch {
    return null;
  }
}

function recordRunIdentityBlockers(input: {
  role: string;
  data: unknown;
  runId: string;
  epochId: string;
}): string[] {
  if (!isRecord(input.data)) return [`${input.role}:json_object_required`];
  const blockers: string[] = [];
  if (input.data.runId !== input.runId)
    blockers.push(`${input.role}:run_id_mismatch`);
  if (input.data.epochId !== input.epochId)
    blockers.push(`${input.role}:epoch_id_mismatch`);
  return blockers;
}

function checkRunManifest(
  data: unknown,
  frontier: Nhm2QeiFeasibilityFrontierV1,
): string[] {
  if (!isRecord(data)) return ["run_manifest:json_object_required"];
  const runRecord = isRecord(data.run) ? data.run : data;
  const expected = frontier.provenance.run;
  const blockers: string[] = [];
  const checks: Array<[string, unknown, string]> = [
    ["run_id", runRecord.runId, expected.runId],
    ["epoch_id", runRecord.epochId, expected.epochId],
    ["commit_sha", runRecord.commitSha, expected.commitSha],
    ["started_at", runRecord.startedAt, expected.startedAt],
    ["completed_at", runRecord.completedAt, expected.completedAt],
  ];
  for (const [label, actual, wanted] of checks) {
    if (actual !== wanted) blockers.push(`run_manifest:${label}_mismatch`);
  }
  return blockers;
}

function checkQftState(
  data: unknown,
  frontier: Nhm2QeiFeasibilityFrontierV1,
): string[] {
  const blockers = recordRunIdentityBlockers({
    role: "qft_state",
    data,
    runId: frontier.provenance.run.runId,
    epochId: frontier.provenance.run.epochId,
  });
  if (!isRecord(data)) return blockers;
  const expected = frontier.provenance.qftState;
  if (data.stateClass !== expected.stateClass)
    blockers.push("qft_state:state_class_mismatch");
  if (data.renormalizationScheme !== expected.renormalizationScheme)
    blockers.push("qft_state:renormalization_scheme_mismatch");
  if (data.operatorMapping !== expected.operatorMapping)
    blockers.push("qft_state:operator_mapping_mismatch");
  return blockers;
}

function checkContinuousObserver(
  data: unknown,
  frontier: Nhm2QeiFeasibilityFrontierV1,
): string[] {
  const blockers = recordRunIdentityBlockers({
    role: "continuous_observer",
    data,
    runId: frontier.provenance.run.runId,
    epochId: frontier.provenance.run.epochId,
  });
  if (!isRecord(data)) return blockers;
  if (data.continuousCoverage !== true)
    blockers.push("continuous_observer:continuous_coverage_not_true");
  if (!sameJson(data.worldlineIds, frontier.domain.worldlineIds))
    blockers.push("continuous_observer:worldline_ids_mismatch");
  return blockers;
}

function checkAxisSet(input: {
  role: string;
  data: unknown;
  runId: string;
  epochId: string;
  field: "worldlineIds" | "samplingFamilyIds";
  values: string[];
}): string[] {
  const blockers = recordRunIdentityBlockers(input);
  if (!isRecord(input.data)) return blockers;
  if (!sameJson(input.data[input.field], input.values))
    blockers.push(`${input.role}:${input.field}_mismatch`);
  return blockers;
}

function checkCandidateProfile(input: {
  data: unknown;
  frontier: Nhm2QeiFeasibilityFrontierV1;
  candidate: Nhm2QeiFeasibilityCandidateResultV1;
}): string[] {
  const blockers = recordRunIdentityBlockers({
    role: `candidate:${input.candidate.candidateId}:profile`,
    data: input.data,
    runId: input.frontier.provenance.run.runId,
    epochId: input.frontier.provenance.run.epochId,
  });
  if (!isRecord(input.data)) return blockers;
  if (input.data.profileId !== input.candidate.profile.profileId)
    blockers.push(`candidate:${input.candidate.candidateId}:profile_id_mismatch`);
  if (
    input.data.candidateId != null &&
    input.data.candidateId !== input.candidate.candidateId
  ) {
    blockers.push(`candidate:${input.candidate.candidateId}:profile_candidate_id_mismatch`);
  }
  return blockers;
}

function checkCandidateTensor(input: {
  data: unknown;
  frontier: Nhm2QeiFeasibilityFrontierV1;
  candidate: Nhm2QeiFeasibilityCandidateResultV1;
}): string[] {
  const blockers = recordRunIdentityBlockers({
    role: `candidate:${input.candidate.candidateId}:full_tensor`,
    data: input.data,
    runId: input.frontier.provenance.run.runId,
    epochId: input.frontier.provenance.run.epochId,
  });
  if (!isRecord(input.data)) return blockers;
  if (input.data.tensorBasis !== input.candidate.fullTensor.tensorBasis)
    blockers.push(`candidate:${input.candidate.candidateId}:tensor_basis_mismatch`);
  if (input.data.candidateId !== input.candidate.candidateId)
    blockers.push(`candidate:${input.candidate.candidateId}:tensor_candidate_id_mismatch`);
  return blockers;
}

const rawEvaluationExpected = (input: {
  frontier: Nhm2QeiFeasibilityFrontierV1;
  candidate: Nhm2QeiFeasibilityCandidateResultV1;
  evaluation: Nhm2QeiFeasibilityEvaluationResultV1;
}): unknown => ({
  artifactId: "nhm2_qei_raw_evaluation",
  schemaVersion: "nhm2_qei_raw_evaluation/v1",
  runId: input.frontier.provenance.run.runId,
  epochId: input.frontier.provenance.run.epochId,
  candidateId: input.candidate.candidateId,
  evaluation: {
    evaluationId: input.evaluation.evaluationId,
    worldlineId: input.evaluation.worldlineId,
    samplingFamilyId: input.evaluation.samplingFamilyId,
    theoremId: input.evaluation.theoremId,
    tauSeconds: input.evaluation.tauSeconds,
    samplingNormalized: input.evaluation.samplingNormalized,
    lhs_Jm3: input.evaluation.lhs_Jm3,
    boundComputed_Jm3:
      input.evaluation.boundComputedAuditInput.boundComputed_Jm3,
    boundPolicy_Jm3: input.evaluation.boundPolicy_Jm3,
    marginRawComputed:
      input.evaluation.marginAuditInput.marginRawComputed,
    marginPolicy: input.evaluation.marginAuditInput.marginPolicy,
    applicabilityStatus: input.evaluation.applicabilityStatus,
    tauConsistency: input.evaluation.tauConsistency,
    metricSemanticBinding: input.evaluation.metricSemanticBinding,
    policyEvidence: input.evaluation.policyEvidence,
    evidenceOrigin: input.evaluation.evidenceOrigin,
    binding: input.evaluation.binding,
  },
});

function checkRawEvaluation(input: {
  data: unknown;
  frontier: Nhm2QeiFeasibilityFrontierV1;
  candidate: Nhm2QeiFeasibilityCandidateResultV1;
  evaluation: Nhm2QeiFeasibilityEvaluationResultV1;
}): string[] {
  return sameJson(input.data, rawEvaluationExpected(input))
    ? []
    : [
        `candidate:${input.candidate.candidateId}:evaluation:${input.evaluation.evaluationId}:raw_evaluation_content_mismatch`,
      ];
}

function checkQuadrature(input: {
  data: unknown;
  frontier: Nhm2QeiFeasibilityFrontierV1;
  candidate: Nhm2QeiFeasibilityCandidateResultV1;
  evaluation: Nhm2QeiFeasibilityEvaluationResultV1;
}): string[] {
  const prefix = `candidate:${input.candidate.candidateId}:evaluation:${input.evaluation.evaluationId}:quadrature`;
  if (!isRecord(input.data)) return [`${prefix}:json_object_required`];
  const blockers: string[] = [];
  const exactChecks: Array<[string, unknown, unknown]> = [
    ["artifact_id", input.data.artifactId, "nhm2_qei_quadrature"],
    ["schema_version", input.data.schemaVersion, "nhm2_qei_quadrature/v1"],
    ["run_id", input.data.runId, input.frontier.provenance.run.runId],
    ["epoch_id", input.data.epochId, input.frontier.provenance.run.epochId],
    ["candidate_id", input.data.candidateId, input.candidate.candidateId],
    ["evaluation_id", input.data.evaluationId, input.evaluation.evaluationId],
    ["worldline_id", input.data.worldlineId, input.evaluation.worldlineId],
    ["sampling_family_id", input.data.samplingFamilyId, input.evaluation.samplingFamilyId],
    ["theorem_id", input.data.theoremId, input.evaluation.theoremId],
    ["tau_seconds", input.data.tauSeconds, input.evaluation.tauSeconds],
    ["sampling_normalized", input.data.samplingNormalized, input.evaluation.samplingNormalized],
    ["lhs", input.data.lhs_Jm3, input.evaluation.lhs_Jm3],
    [
      "metric_t00_si",
      input.data.metricT00Si_Jm3,
      input.evaluation.metricSemanticBinding.metricT00Si_Jm3,
    ],
    [
      "raw_evaluation_sha256",
      input.data.rawEvaluationSha256,
      input.evaluation.rawEvaluationEvidence.sha256,
    ],
    [
      "theorem_set_sha256",
      input.data.theoremSetSha256,
      input.frontier.provenance.theoremSet.sha256,
    ],
  ];
  for (const [label, actual, expected] of exactChecks) {
    if (actual !== expected) blockers.push(`${prefix}:${label}_mismatch`);
  }
  if (!isText(input.data.quadratureMethod))
    blockers.push(`${prefix}:method_missing`);
  const properTimeSeconds = input.data.properTimeSeconds;
  const normalizedWeights = input.data.normalizedWeights;
  const sampledEnergyDensity = input.data.sampledEnergyDensity_Jm3;
  const arraysValid =
    Array.isArray(properTimeSeconds) &&
    Array.isArray(normalizedWeights) &&
    Array.isArray(sampledEnergyDensity) &&
    properTimeSeconds.length >= 2 &&
    properTimeSeconds.length === normalizedWeights.length &&
    properTimeSeconds.length === sampledEnergyDensity.length &&
    properTimeSeconds.every(isFiniteNumber) &&
    normalizedWeights.every(
      (weight) => isFiniteNumber(weight) && weight >= 0,
    ) &&
    sampledEnergyDensity.every(isFiniteNumber);
  if (!arraysValid) blockers.push(`${prefix}:sample_arrays_invalid`);
  if (
    !Number.isSafeInteger(input.data.sampleCount) ||
    (input.data.sampleCount as number) < 2 ||
    (arraysValid && input.data.sampleCount !== properTimeSeconds.length)
  ) {
    blockers.push(`${prefix}:sample_count_invalid`);
  }
  if (
    arraysValid &&
    properTimeSeconds.some(
      (properTime, index) =>
        index > 0 && !(properTime > properTimeSeconds[index - 1]),
    )
  ) {
    blockers.push(`${prefix}:proper_time_not_strictly_increasing`);
  }
  if (input.data.converged !== true)
    blockers.push(`${prefix}:not_converged`);
  const maximumAllowedError = Math.max(
    1e-12,
    Math.abs(input.evaluation.lhs_Jm3) * 1e-6,
  );
  if (
    !isFiniteNumber(input.data.estimatedAbsoluteError_Jm3) ||
    input.data.estimatedAbsoluteError_Jm3 < 0 ||
    input.data.estimatedAbsoluteError_Jm3 > maximumAllowedError
  )
    blockers.push(`${prefix}:estimated_error_invalid`);
  if (
    !isFiniteNumber(input.data.normalizationIntegral) ||
    !isFiniteNumber(input.data.normalizationTolerance) ||
    input.data.normalizationTolerance <= 0 ||
    input.data.normalizationTolerance > 1e-6 ||
    Math.abs(input.data.normalizationIntegral - 1) >
      input.data.normalizationTolerance
  ) {
    blockers.push(`${prefix}:normalization_not_verified`);
  }
  if (arraysValid) {
    const recomputedNormalization = normalizedWeights.reduce(
      (sum, weight) => sum + weight,
      0,
    );
    const recomputedLhs = normalizedWeights.reduce(
      (sum, weight, index) =>
        sum + weight * sampledEnergyDensity[index],
      0,
    );
    if (
      !isFiniteNumber(input.data.normalizationIntegral) ||
      !isFiniteNumber(input.data.normalizationTolerance) ||
      Math.abs(
        recomputedNormalization - input.data.normalizationIntegral,
      ) > input.data.normalizationTolerance ||
      Math.abs(recomputedNormalization - 1) >
        input.data.normalizationTolerance
    ) {
      blockers.push(`${prefix}:normalization_not_reproduced_from_weights`);
    }
    if (
      !isFiniteNumber(input.data.estimatedAbsoluteError_Jm3) ||
      Math.abs(recomputedLhs - input.evaluation.lhs_Jm3) >
        input.data.estimatedAbsoluteError_Jm3
    ) {
      blockers.push(`${prefix}:lhs_not_reproduced_from_samples`);
    }
  }
  if (!sameJson(input.data.binding, input.evaluation.binding))
    blockers.push(`${prefix}:binding_mismatch`);
  return blockers;
}

function runtimeReceiptBindingBlockers(input: {
  receipt: TheoryRuntimeReceiptV1;
  frontier: Nhm2QeiFeasibilityFrontierV1;
}): string[] {
  const blockers: string[] = [];
  const run = input.frontier.provenance.run;
  if (
    input.receipt.runtimeId !==
    NHM2_QEI_FEASIBILITY_FRONTIER_RUNTIME_ID
  ) {
    blockers.push("runtime_receipt:runtime_id_mismatch");
  }
  if (input.receipt.args.runId !== run.runId)
    blockers.push("runtime_receipt:run_id_mismatch");
  if (input.receipt.args.epochId !== run.epochId)
    blockers.push("runtime_receipt:epoch_id_mismatch");
  if (input.receipt.provenance.gitSha !== run.commitSha)
    blockers.push("runtime_receipt:commit_sha_mismatch");
  if (input.receipt.provenance.startedAt !== run.startedAt)
    blockers.push("runtime_receipt:started_at_mismatch");
  if (input.receipt.provenance.completedAt !== run.completedAt)
    blockers.push("runtime_receipt:completed_at_mismatch");
  if (input.receipt.status !== "completed")
    blockers.push("runtime_receipt:not_completed");
  if (
    input.receipt.execution?.exitCode !== 0 ||
    input.receipt.execution.timedOut !== false ||
    input.receipt.execution.error !== null
  ) {
    blockers.push("runtime_receipt:execution_not_successful");
  }
  if (input.receipt.claimBoundary.currentTier === "certified")
    blockers.push("runtime_receipt:certified_tier_forbidden");
  if (input.receipt.claimBoundary.promotionAllowed !== false)
    blockers.push("runtime_receipt:promotion_authority_forbidden");
  return blockers;
}

function runtimeManifestCoverageBlockers(input: {
  verification: TheoryRuntimeReceiptFilesystemVerificationV1;
  runBoundBindings: Array<{ role: string; artifactRef: string; sha256: string }>;
}): string[] {
  const files = new Map(
    input.verification.files.map((file) => [normalizeRepoPath(file.path), file]),
  );
  const blockers: string[] = [];
  for (const binding of input.runBoundBindings) {
    const file = files.get(binding.artifactRef);
    if (file == null) {
      blockers.push(`runtime_manifest:run_bound_artifact_missing:${binding.role}:${binding.artifactRef}`);
      continue;
    }
    if (file.sha256.toLowerCase() !== binding.sha256.toLowerCase()) {
      blockers.push(`runtime_manifest:run_bound_artifact_hash_mismatch:${binding.role}:${binding.artifactRef}`);
    }
    if (file.freshness === "preexisting") {
      blockers.push(`runtime_manifest:run_bound_artifact_preexisting:${binding.role}:${binding.artifactRef}`);
    }
  }
  return blockers;
}

async function verifyGitCommit(
  projectRoot: string,
  commitSha: string,
): Promise<boolean> {
  try {
    await execFileAsync("git", ["cat-file", "-e", `${commitSha}^{commit}`], {
      cwd: projectRoot,
      windowsHide: true,
    });
    return true;
  } catch {
    return false;
  }
}

function notEvaluableResult(input: {
  generatedAt: string;
  frontierPath: string;
  sourceSha256: string | null;
  contractValidated: boolean;
  bytesMatchParsedValue: boolean;
  frontier: Nhm2QeiFeasibilityFrontierV1 | null;
  blockers: string[];
  verifiedArtifacts?: Nhm2QeiFeasibilityVerifiedArtifactV1[];
  runtimeReceiptFilesystemVerified?: boolean;
}): Nhm2QeiFeasibilityFrontierFilesystemEvaluationV1 {
  const run = input.frontier?.provenance.run;
  return {
    artifactId: "nhm2_qei_feasibility_frontier_filesystem_evaluation",
    schemaVersion:
      NHM2_QEI_FEASIBILITY_FRONTIER_FILESYSTEM_EVALUATION_VERSION,
    generatedAt: input.generatedAt,
    sourceFrontier: {
      artifactRef: input.frontierPath,
      sha256: input.sourceSha256,
      contractValidated: input.contractValidated,
      bytesMatchParsedValue: input.bytesMatchParsedValue,
      sourceVerdict: input.frontier?.verdict ?? null,
    },
    run: {
      runId: run?.runId ?? null,
      epochId: run?.epochId ?? null,
      commitSha: run?.commitSha ?? null,
      startedAt: run?.startedAt ?? null,
      completedAt: run?.completedAt ?? null,
    },
    evaluationStatus: "not_evaluable",
    verdict: "frontier_not_evaluable",
    filesystemVerified: false,
    runtimeReceiptFilesystemVerified:
      input.runtimeReceiptFilesystemVerified ?? false,
    verifiedArtifacts: input.verifiedArtifacts ?? [],
    publicationEnvelope: {
      sourceFrontierExcludedFromProducerManifestToAvoidHashCycle: true,
      publicationEnvelopeNotRuntimeFreshnessReceipt: true,
      sourceFrontierAndRuntimeReceiptHashesCoBound:
        input.sourceSha256 != null &&
        (input.verifiedArtifacts ?? []).some(
          (artifact) => artifact.role === "runtime_receipt",
        ),
    },
    closureAssessment: {
      finiteDeclaredDomainOutcome: "frontier_not_evaluable",
      worldlineQeiClosureEstablished: false,
      universalNoGoEstablished: false,
    },
    blockers: unique(input.blockers),
    claimBoundary: {
      diagnosticOnly: true,
      filesystemVerificationIsEvidenceIntegrityOnly: true,
      filesystemVerificationDoesNotCloseWorldlineQei: true,
      cannotSatisfyWorldlineQeiClosure: true,
      finiteDomainNoCandidateIsNotUniversalNoGo: true,
      sensitivityDoesNotAuthorizeParameterScaling: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
      routeEtaClaimAllowed: false,
      certifiedSpeedClaimAllowed: false,
    },
  };
}

export async function evaluateNhm2QeiFeasibilityFrontierFilesystem(input: {
  projectRoot: string;
  frontierPath: string;
  frontier: unknown;
  verifyGitObjects?: boolean;
}): Promise<Nhm2QeiFeasibilityFrontierFilesystemEvaluationV1> {
  const generatedAt = new Date().toISOString();
  const projectRoot = path.resolve(input.projectRoot);
  const blockers: string[] = [];
  const verifiedArtifacts: Nhm2QeiFeasibilityVerifiedArtifactV1[] = [];
  const frontier: Nhm2QeiFeasibilityFrontierV1 | null =
    isNhm2QeiFeasibilityFrontier(input.frontier) ? input.frontier : null;
  const contractValidated = frontier != null;

  const sourceRead = await readPinnedRegularFile({
    projectRoot,
    artifactRef: input.frontierPath,
  });
  let sourceSha256: string | null = null;
  let sourceDiskValue: unknown | null = null;
  if (sourceRead.blocker != null || sourceRead.bytes == null) {
    blockers.push(`source_frontier:${sourceRead.blocker ?? "unreadable"}`);
  } else {
    sourceSha256 = createHash("sha256")
      .update(sourceRead.bytes)
      .digest("hex");
    sourceDiskValue = parseJson(sourceRead.bytes);
    if (sourceDiskValue == null)
      blockers.push("source_frontier:json_invalid");
  }
  const bytesMatchParsedValue =
    sourceDiskValue != null && sameJson(sourceDiskValue, input.frontier);
  if (!contractValidated)
    blockers.push("source_frontier:contract_invalid");
  if (sourceDiskValue != null && !bytesMatchParsedValue)
    blockers.push("source_frontier:bytes_do_not_match_parsed_value");
  if (
    sourceDiskValue != null &&
    !isNhm2QeiFeasibilityFrontier(sourceDiskValue)
  ) {
    blockers.push("source_frontier:disk_contract_invalid");
  }
  if (frontier == null) {
    return notEvaluableResult({
      generatedAt,
      frontierPath: input.frontierPath,
      sourceSha256,
      contractValidated,
      bytesMatchParsedValue,
      frontier: null,
      blockers,
    });
  }

  if (!isPinnedNhm2QeiRunId(frontier.provenance.run.runId))
    blockers.push("run_id_not_safe_pinned_segment");
  if (
    !PERSISTED_RUNTIME_RECEIPT_PATH.test(
      frontier.provenance.runtimeReceipt.artifactRef,
    )
  ) {
    blockers.push("runtime_receipt:persistence_store_path_invalid");
  }
  if (
    input.verifyGitObjects !== false &&
    !(await verifyGitCommit(projectRoot, frontier.provenance.run.commitSha))
  ) {
    blockers.push("run_commit_git_object_missing");
  }

  const fileCache = new Map<string, BoundFile | null>();
  const expectedHashByPath = new Map<string, string>();
  const readBoundArtifact: BoundArtifactReader = async (
    role,
    binding,
    jsonRequired = true,
  ) => {
    if (
      !isPinnedNhm2QeiRepoPath(binding.artifactRef) ||
      !isSha256(binding.sha256)
    ) {
      blockers.push(`${role}:binding_invalid`);
      return null;
    }
    const expectedSha256 = binding.sha256.toLowerCase();
    const priorHash = expectedHashByPath.get(binding.artifactRef);
    if (priorHash != null && priorHash !== expectedSha256) {
      blockers.push(`${role}:path_bound_to_conflicting_hash`);
      return null;
    }
    expectedHashByPath.set(binding.artifactRef, expectedSha256);
    const cacheKey = `${binding.artifactRef}\0${expectedSha256}`;
    let file = fileCache.get(cacheKey);
    if (file === undefined) {
      const read = await readPinnedRegularFile({
        projectRoot,
        artifactRef: binding.artifactRef,
      });
      if (read.blocker != null || read.bytes == null) {
        blockers.push(`${role}:${read.blocker ?? "unreadable"}`);
        fileCache.set(cacheKey, null);
        return null;
      }
      const actualSha256 = createHash("sha256")
        .update(read.bytes)
        .digest("hex");
      if (actualSha256 !== expectedSha256) {
        blockers.push(`${role}:sha256_mismatch`);
        fileCache.set(cacheKey, null);
        return null;
      }
      const data = parseJson(read.bytes);
      file = {
        artifactRef: binding.artifactRef,
        sha256: actualSha256,
        sizeBytes: read.bytes.byteLength,
        bytes: read.bytes,
        data,
      };
      fileCache.set(cacheKey, file);
    }
    if (file == null) return null;
    if (jsonRequired && file.data == null) {
      blockers.push(`${role}:json_invalid`);
      return null;
    }
    verifiedArtifacts.push({
      role,
      artifactRef: file.artifactRef,
      sha256: file.sha256,
      sizeBytes: file.sizeBytes,
    });
    return file;
  };

  const runBoundBindings: Array<{
    role: string;
    artifactRef: string;
    sha256: string;
  }> = [];
  const rememberRunBound = (
    role: string,
    binding: Nhm2QeiFeasibilityArtifactBindingV1,
  ): void => {
    runBoundBindings.push({
      role,
      artifactRef: binding.artifactRef,
      sha256: binding.sha256,
    });
  };

  const runManifestFile = await readBoundArtifact(
    "run_manifest",
    frontier.provenance.runManifest,
  );
  rememberRunBound("run_manifest", frontier.provenance.runManifest);
  if (runManifestFile != null)
    blockers.push(...checkRunManifest(runManifestFile.data, frontier));

  const runtimeReceiptFile = await readBoundArtifact(
    "runtime_receipt",
    frontier.provenance.runtimeReceipt,
  );
  const qftStateFile = await readBoundArtifact(
    "qft_state",
    frontier.provenance.qftState,
  );
  rememberRunBound("qft_state", frontier.provenance.qftState);
  if (qftStateFile != null)
    blockers.push(...checkQftState(qftStateFile.data, frontier));

  const observerFile = await readBoundArtifact(
    "continuous_observer",
    frontier.provenance.continuousObserver,
  );
  rememberRunBound("continuous_observer", frontier.provenance.continuousObserver);
  if (observerFile != null)
    blockers.push(...checkContinuousObserver(observerFile.data, frontier));

  const worldlineFile = await readBoundArtifact(
    "worldline_set",
    frontier.provenance.worldlineSet,
  );
  rememberRunBound("worldline_set", frontier.provenance.worldlineSet);
  if (worldlineFile != null) {
    blockers.push(
      ...checkAxisSet({
        role: "worldline_set",
        data: worldlineFile.data,
        runId: frontier.provenance.run.runId,
        epochId: frontier.provenance.run.epochId,
        field: "worldlineIds",
        values: frontier.domain.worldlineIds,
      }),
    );
  }

  const samplingFile = await readBoundArtifact(
    "sampling_family_set",
    frontier.provenance.samplingFamilySet,
  );
  rememberRunBound("sampling_family_set", frontier.provenance.samplingFamilySet);
  if (samplingFile != null) {
    blockers.push(
      ...checkAxisSet({
        role: "sampling_family_set",
        data: samplingFile.data,
        runId: frontier.provenance.run.runId,
        epochId: frontier.provenance.run.epochId,
        field: "samplingFamilyIds",
        values: frontier.domain.samplingFamilyIds,
      }),
    );
  }

  const theoremSetFile = await readBoundArtifact(
    "theorem_set",
    frontier.provenance.theoremSet,
  );
  if (
    theoremSetFile != null &&
    (!isRecord(theoremSetFile.data) ||
      !sameJson(theoremSetFile.data.theorems, frontier.theorems))
  ) {
    blockers.push("theorem_set:contents_mismatch");
  }
  for (const theorem of frontier.theorems) {
    const provenanceFile = await readBoundArtifact(
      `theorem:${theorem.theoremId}:provenance`,
      {
        artifactRef: theorem.provenanceRef,
        sha256: theorem.provenanceSha256,
      },
      false,
    );
    if (provenanceFile?.data != null && isRecord(provenanceFile.data)) {
      if (
        provenanceFile.data.theoremId != null &&
        provenanceFile.data.theoremId !== theorem.theoremId
      ) {
        blockers.push(`theorem:${theorem.theoremId}:provenance_identity_mismatch`);
      }
    }
  }

  const rawPaths = new Set<string>();
  const quadraturePaths = new Set<string>();
  for (const candidate of frontier.candidates) {
    const profileRole = `candidate:${candidate.candidateId}:profile`;
    const profileFile = await readBoundArtifact(profileRole, candidate.profile);
    rememberRunBound(profileRole, candidate.profile);
    if (profileFile != null)
      blockers.push(
        ...checkCandidateProfile({ data: profileFile.data, frontier, candidate }),
      );

    const tensorRole = `candidate:${candidate.candidateId}:full_tensor`;
    const tensorFile = await readBoundArtifact(tensorRole, candidate.fullTensor);
    rememberRunBound(tensorRole, candidate.fullTensor);
    if (tensorFile != null)
      blockers.push(
        ...checkCandidateTensor({ data: tensorFile.data, frontier, candidate }),
      );

    for (const evaluation of candidate.evaluations) {
      const rowPrefix = `candidate:${candidate.candidateId}:evaluation:${evaluation.evaluationId}`;
      if (rawPaths.has(evaluation.rawEvaluationEvidence.artifactRef))
        blockers.push(`${rowPrefix}:raw_evaluation_path_reused`);
      rawPaths.add(evaluation.rawEvaluationEvidence.artifactRef);
      if (quadraturePaths.has(evaluation.quadratureEvidence.artifactRef))
        blockers.push(`${rowPrefix}:quadrature_path_reused`);
      quadraturePaths.add(evaluation.quadratureEvidence.artifactRef);
      if (
        evaluation.rawEvaluationEvidence.artifactRef ===
        evaluation.quadratureEvidence.artifactRef
      ) {
        blockers.push(`${rowPrefix}:raw_quadrature_path_alias_forbidden`);
      }

      const rawRole = `${rowPrefix}:raw_evaluation`;
      const rawFile = await readBoundArtifact(
        rawRole,
        evaluation.rawEvaluationEvidence,
      );
      rememberRunBound(rawRole, evaluation.rawEvaluationEvidence);
      if (rawFile != null)
        blockers.push(
          ...checkRawEvaluation({ data: rawFile.data, frontier, candidate, evaluation }),
        );

      const quadratureRole = `${rowPrefix}:quadrature`;
      const quadratureFile = await readBoundArtifact(
        quadratureRole,
        evaluation.quadratureEvidence,
      );
      rememberRunBound(quadratureRole, evaluation.quadratureEvidence);
      if (quadratureFile != null)
        blockers.push(
          ...checkQuadrature({
            data: quadratureFile.data,
            frontier,
            candidate,
            evaluation,
          }),
        );
    }
  }

  let runtimeReceiptFilesystemVerified = false;
  if (
    runtimeReceiptFile != null &&
    isTheoryRuntimeReceiptV1(runtimeReceiptFile.data)
  ) {
    const receipt = runtimeReceiptFile.data;
    blockers.push(...runtimeReceiptBindingBlockers({ receipt, frontier }));
    const manifestEntries = receipt.outputs.artifactManifest?.entries ?? [];
    const declaredRuntimeBytes = manifestEntries.reduce(
      (sum, entry) => sum + entry.sizeBytes,
      0,
    );
    const unsafeDeclaredRuntimeOutput =
      manifestEntries.some(
        (entry) =>
          !Number.isSafeInteger(entry.sizeBytes) ||
          entry.sizeBytes < 0 ||
          entry.sizeBytes > NHM2_QEI_FEASIBILITY_MAX_BOUND_FILE_BYTES,
      ) ||
      !Number.isSafeInteger(declaredRuntimeBytes) ||
      declaredRuntimeBytes >
        NHM2_QEI_FEASIBILITY_MAX_RUNTIME_OUTPUT_BYTES;
    const runtimePreflightRefs = unique([
      ...manifestEntries.map((entry) => entry.path),
      ...(receipt.outputs.artifactManifest?.manifestPath == null
        ? []
        : [receipt.outputs.artifactManifest.manifestPath]),
      ...(receipt.outputs.artifactManifest?.freshnessProof
        ?.beforeCommitmentPath == null
        ? []
        : [
            receipt.outputs.artifactManifest.freshnessProof
              .beforeCommitmentPath,
          ]),
    ]);
    let actualRuntimeBytes = 0;
    const runtimePreflightBlockers: string[] = [];
    for (const artifactRef of runtimePreflightRefs) {
      const inspected = await inspectPinnedRegularFile({
        projectRoot,
        artifactRef,
      });
      if (inspected.blocker != null || inspected.sizeBytes == null) {
        runtimePreflightBlockers.push(
          `runtime_receipt_filesystem:preflight:${inspected.blocker ?? artifactRef}`,
        );
        continue;
      }
      actualRuntimeBytes += inspected.sizeBytes;
    }
    if (
      !Number.isSafeInteger(actualRuntimeBytes) ||
      actualRuntimeBytes > NHM2_QEI_FEASIBILITY_MAX_RUNTIME_OUTPUT_BYTES
    ) {
      runtimePreflightBlockers.push(
        "runtime_receipt_filesystem:actual_output_size_limit_exceeded",
      );
    }
    blockers.push(...runtimePreflightBlockers);
    const unsafeObservedBoundFile = blockers.some((blocker) =>
      blocker.includes("file_too_large:"),
    );
    if (
      unsafeDeclaredRuntimeOutput ||
      unsafeObservedBoundFile ||
      runtimePreflightBlockers.length > 0
    ) {
      blockers.push(
        unsafeDeclaredRuntimeOutput
          ? "runtime_receipt_filesystem:declared_output_size_limit_exceeded"
          : unsafeObservedBoundFile
            ? "runtime_receipt_filesystem:skipped_due_oversize_bound_file"
            : "runtime_receipt_filesystem:skipped_due_unsafe_preflight",
      );
    } else {
      const receiptVerification = await verifyTheoryRuntimeReceiptFilesystem({
        projectRoot,
        receipt,
      });
      runtimeReceiptFilesystemVerified = receiptVerification.ok;
      blockers.push(
        ...receiptVerification.blockers.map(
          (blocker) => `runtime_receipt_filesystem:${blocker}`,
        ),
      );
      blockers.push(
        ...runtimeManifestCoverageBlockers({
          verification: receiptVerification,
          runBoundBindings,
        }),
      );
    }
  } else if (runtimeReceiptFile != null) {
    blockers.push("runtime_receipt:schema_invalid");
  }

  const uniqueBlockers = unique(blockers);
  if (uniqueBlockers.length > 0) {
    return notEvaluableResult({
      generatedAt,
      frontierPath: input.frontierPath,
      sourceSha256,
      contractValidated,
      bytesMatchParsedValue,
      frontier,
      blockers: uniqueBlockers,
      verifiedArtifacts,
      runtimeReceiptFilesystemVerified,
    });
  }

  const verdict = frontier.verdict;
  const evaluationStatus =
    verdict === "frontier_not_evaluable" ? "not_evaluable" : "complete";
  return {
    artifactId: "nhm2_qei_feasibility_frontier_filesystem_evaluation",
    schemaVersion:
      NHM2_QEI_FEASIBILITY_FRONTIER_FILESYSTEM_EVALUATION_VERSION,
    generatedAt,
    sourceFrontier: {
      artifactRef: input.frontierPath,
      sha256: sourceSha256,
      contractValidated: true,
      bytesMatchParsedValue: true,
      sourceVerdict: verdict,
    },
    run: { ...frontier.provenance.run },
    evaluationStatus,
    verdict,
    filesystemVerified: true,
    runtimeReceiptFilesystemVerified: true,
    verifiedArtifacts,
    publicationEnvelope: {
      sourceFrontierExcludedFromProducerManifestToAvoidHashCycle: true,
      publicationEnvelopeNotRuntimeFreshnessReceipt: true,
      sourceFrontierAndRuntimeReceiptHashesCoBound: true,
    },
    closureAssessment: {
      finiteDeclaredDomainOutcome: verdict,
      worldlineQeiClosureEstablished: false,
      universalNoGoEstablished: false,
    },
    blockers:
      verdict === "frontier_not_evaluable"
        ? frontier.summary.blockers.map(
            (blocker) => `source_frontier:${blocker}`,
          )
        : [],
    claimBoundary: {
      diagnosticOnly: true,
      filesystemVerificationIsEvidenceIntegrityOnly: true,
      filesystemVerificationDoesNotCloseWorldlineQei: true,
      cannotSatisfyWorldlineQeiClosure: true,
      finiteDomainNoCandidateIsNotUniversalNoGo: true,
      sensitivityDoesNotAuthorizeParameterScaling: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
      routeEtaClaimAllowed: false,
      certifiedSpeedClaimAllowed: false,
    },
  };
}
