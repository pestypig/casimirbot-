import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import {
  buildTheoryRuntimeReceiptV1,
  type TheoryRuntimeExecutionV1,
  type TheoryRuntimeOutputManifestV1,
  type TheoryRuntimeReceiptV1,
} from "../../../shared/contracts/theory-runtime-receipt.v1";
import { getTheoryRuntimeEntrypoint } from "../../../shared/theory/runtime-entrypoints";
import { THEORY_RUNTIME_LONG_EXECUTION_IDS } from "../../../shared/theory/runtime-execution-policy";
import {
  readTheoryRuntimeRunRequestStatus,
  updateTheoryRuntimeRunRequestStatus,
} from "./theory-runtime-run-request-manifest";
import { readWarpNhm2RuntimeArtifacts } from "./warp-nhm2-artifact-adapters";
import type {
  TheoryRuntimeCommandV1,
  TheoryRuntimeExecutionResult,
  TheoryRuntimeSpawnExecutor,
} from "./runtime-adapters";
import {
  buildTheoryRuntimeNpmInvocation,
  executeTheoryRuntimeCommand,
} from "./runtime-adapters";
import {
  buildTheoryRuntimeFreshnessProof,
  classifyTheoryRuntimeArtifacts,
  snapshotTheoryRuntimeOutput,
  writeTheoryRuntimeOutputManifest,
  writeTheoryRuntimePreSpawnSnapshotCommitment,
} from "./runtime-artifact-manifest";
import {
  writeTheoryRuntimeReceiptArtifact,
  type TheoryRuntimePersistedReceiptRefV1,
} from "./theory-runtime-receipt-store";

const execFileAsync = promisify(execFile);

export const LONG_RUNTIME_EXECUTION_ALLOWLIST =
  THEORY_RUNTIME_LONG_EXECUTION_IDS;

export type LongTheoryRuntimeId =
  (typeof LONG_RUNTIME_EXECUTION_ALLOWLIST)[number];

export type ExecuteLongTheoryRuntimeRequestInput = {
  requestId: string;
  projectRoot?: string;
  outputDirectory: string;
  execute: true;
  timeoutMs?: number;
  generatedAt?: string;
};

export type ExecuteLongTheoryRuntimeRequestResult = {
  requestId: string;
  runtimeId: LongTheoryRuntimeId;
  command: TheoryRuntimeCommandV1;
  execution: TheoryRuntimeExecutionResult;
  receiptV1: TheoryRuntimeReceiptV1;
  receiptArtifact: TheoryRuntimePersistedReceiptRefV1 | null;
};

function scriptFromEntrypointCommand(command: string | null): string | null {
  const match = command?.match(/^npm\s+run\s+(.+)$/);
  return match?.[1]?.trim() ?? null;
}

function isAllowedLongRuntimeId(
  runtimeId: string,
): runtimeId is LongTheoryRuntimeId {
  return LONG_RUNTIME_EXECUTION_ALLOWLIST.includes(
    runtimeId as LongTheoryRuntimeId,
  );
}

function isPathInside(parent: string, candidate: string): boolean {
  const relative = path.relative(parent, candidate);
  return !relative.startsWith("..") && !path.isAbsolute(relative);
}

function normalizeRelativePath(value: string): string {
  return value.replace(/\\/g, "/").replace(/^\.\//, "");
}

const CANDIDATE_BINDING_ENV = {
  candidateId: "NHM2_CANDIDATE_ID",
  selectedProfileId: "NHM2_SELECTED_PROFILE_ID",
  chartId: "NHM2_CHART_ID",
  runId: "NHM2_RUN_ID",
  candidateManifestSha256: "NHM2_CANDIDATE_MANIFEST_SHA256",
  atlasSha256: "NHM2_ATLAS_SHA256",
  unitsSha256: "NHM2_UNITS_SHA256",
  normalizationSha256: "NHM2_NORMALIZATION_SHA256",
} as const;

type CandidateRuntimeBindings = Partial<
  Record<keyof typeof CANDIDATE_BINDING_ENV, string>
>;

function candidateRuntimeBindings(
  args: Record<string, unknown>,
): CandidateRuntimeBindings {
  return Object.fromEntries(
    Object.keys(CANDIDATE_BINDING_ENV).flatMap((key) => {
      const value = args[key];
      return typeof value === "string" && value.trim().length > 0
        ? [[key, value.trim()]]
        : [];
    }),
  ) as CandidateRuntimeBindings;
}

export function theoryRuntimeReceiptIdForRequest(
  runtimeId: string,
  requestId: string,
): string {
  const digest = createHash("sha256")
    .update(`${runtimeId}\0${requestId}`, "utf8")
    .digest("hex");
  return `runtime:${runtimeId}:request:${digest}`;
}

async function prepareOutputDirectory(
  projectRoot: string,
  outputDirectory: string,
): Promise<string> {
  const resolved = path.resolve(projectRoot, outputDirectory);
  if (resolved === projectRoot || !isPathInside(projectRoot, resolved)) {
    throw new Error(
      "Long runtime outputDirectory must resolve inside the project root.",
    );
  }
  await fs.mkdir(resolved, { recursive: true });
  const outputStat = await fs.lstat(resolved);
  if (outputStat.isSymbolicLink()) {
    throw new Error(
      "Long runtime outputDirectory must not be a symbolic link.",
    );
  }
  const [realProjectRoot, realOutputDirectory] = await Promise.all([
    fs.realpath(projectRoot),
    fs.realpath(resolved),
  ]);
  if (
    realOutputDirectory === realProjectRoot ||
    !isPathInside(realProjectRoot, realOutputDirectory)
  ) {
    throw new Error(
      "Long runtime outputDirectory must resolve inside the real project root.",
    );
  }
  return resolved;
}

function buildLongRuntimeCommand(input: {
  runtimeId: LongTheoryRuntimeId;
  requestId: string;
  receiptId: string;
  projectRoot: string;
  outputDirectory: string;
  requestArgs: Record<string, unknown>;
  timeoutMs?: number;
}): TheoryRuntimeCommandV1 {
  const entrypoint = getTheoryRuntimeEntrypoint(input.runtimeId);
  const script = scriptFromEntrypointCommand(entrypoint?.command ?? null);
  if (!entrypoint || !script)
    throw new Error(
      `Runtime ${input.runtimeId} does not have a fixed npm script command.`,
    );
  const invocation = buildTheoryRuntimeNpmInvocation(script);
  const bindings = candidateRuntimeBindings(input.requestArgs);
  return {
    ...invocation,
    cwd: input.projectRoot,
    npmScript: script,
    timeoutMs: Math.min(
      input.timeoutMs ?? entrypoint.timeoutPolicy.fullMs,
      entrypoint.timeoutPolicy.fullMs,
    ),
    env: {
      THEORY_RUNTIME_REQUEST_ID: input.requestId,
      THEORY_RUNTIME_RECEIPT_ID: input.receiptId,
      THEORY_RUNTIME_ID: input.runtimeId,
      NHM2_OUTPUT_DIR:
        normalizeRelativePath(
          path.relative(input.projectRoot, input.outputDirectory),
        ) || ".",
      ...Object.fromEntries(
        Object.entries(bindings).map(([key, value]) => [
          CANDIDATE_BINDING_ENV[key as keyof typeof CANDIDATE_BINDING_ENV],
          value,
        ]),
      ),
    },
  };
}

async function resolveGitSha(projectRoot: string): Promise<string | null> {
  try {
    const result = await execFileAsync(
      "git",
      ["rev-parse", "--verify", "HEAD"],
      {
        cwd: projectRoot,
        encoding: "utf8",
        windowsHide: true,
      },
    );
    const sha = String(result.stdout).trim().toLowerCase();
    return /^[a-f0-9]{40,64}$/.test(sha) ? sha : null;
  } catch {
    return null;
  }
}

type TheoryRuntimeSourceTreeState = {
  sourceTreeSha256: string | null;
  worktreeClean: boolean;
};

async function resolveSourceTreeState(
  projectRoot: string,
  gitSha: string | null,
): Promise<TheoryRuntimeSourceTreeState> {
  if (gitSha == null) return { sourceTreeSha256: null, worktreeClean: false };
  try {
    const [treeResult, statusResult] = await Promise.all([
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
    const treeSha = String(treeResult.stdout).trim().toLowerCase();
    const status = String(statusResult.stdout);
    if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(treeSha)) {
      return { sourceTreeSha256: null, worktreeClean: false };
    }
    const statusSha256 = createHash("sha256")
      .update(status, "utf8")
      .digest("hex");
    return {
      sourceTreeSha256: createHash("sha256")
        .update(`${gitSha}\0${treeSha}\0${statusSha256}`, "utf8")
        .digest("hex"),
      worktreeClean: status.length === 0,
    };
  } catch {
    return { sourceTreeSha256: null, worktreeClean: false };
  }
}

function buildExecutionProvenance(input: {
  command: TheoryRuntimeCommandV1;
  execution: TheoryRuntimeExecutionResult;
  outputDirectory: string;
}): TheoryRuntimeExecutionV1 {
  const relativeOutputDirectory =
    normalizeRelativePath(
      path.relative(input.command.cwd, input.outputDirectory),
    ) || ".";
  return {
    command: input.command.command,
    args: [...input.command.args],
    cwd:
      normalizeRelativePath(
        path.relative(input.command.cwd, input.command.cwd),
      ) || ".",
    environment: { ...(input.command.env ?? {}) },
    outputDirectory: relativeOutputDirectory,
    outputDirectoryBound:
      input.command.env?.NHM2_OUTPUT_DIR === relativeOutputDirectory,
    exitCode: input.execution.exitCode,
    stdout: input.execution.stdout,
    stderr: input.execution.stderr,
    timedOut: input.execution.timedOut,
    error: input.execution.error,
  };
}

function failedExecutionReceipt(input: {
  receiptId: string;
  requestId: string;
  requestBindings: CandidateRuntimeBindings;
  runtimeId: LongTheoryRuntimeId;
  graphId: string;
  badgeIds: string[];
  command: TheoryRuntimeCommandV1;
  execution: TheoryRuntimeExecutionResult;
  status: "failed" | "timeout";
  outputDirectory: string;
  gitSha: string | null;
  artifactManifest: TheoryRuntimeOutputManifestV1 | null;
  failureSignal?: string;
  additionalWarnings?: string[];
  generatedAt?: string;
}): TheoryRuntimeReceiptV1 {
  const entrypoint = getTheoryRuntimeEntrypoint(input.runtimeId);
  const execution = buildExecutionProvenance({
    command: input.command,
    execution: input.execution,
    outputDirectory: input.outputDirectory,
  });
  const provenanceComplete = Boolean(
    input.gitSha &&
    input.execution.startedAt &&
    input.execution.completedAt &&
    input.execution.durationMs != null,
  );
  const hasFreshArtifact =
    input.artifactManifest?.entries.some(
      (entry) => entry.freshness === "new" || entry.freshness === "changed",
    ) ?? false;
  const primaryFailureSignal = input.execution.timedOut
    ? "runtime_timeout"
    : input.execution.exitCode !== 0
      ? "runtime_execution_failed"
      : null;
  const failureSignals = Array.from(
    new Set([
      ...(primaryFailureSignal ? [primaryFailureSignal] : []),
      ...(input.failureSignal ? [input.failureSignal] : []),
      ...(!primaryFailureSignal && !input.failureSignal
        ? ["runtime_receipt_failed"]
        : []),
    ]),
  );
  return buildTheoryRuntimeReceiptV1({
    generatedAt: input.generatedAt,
    receiptId: input.receiptId,
    runtimeId: input.runtimeId,
    graphId: input.graphId,
    badgeIds: input.badgeIds,
    command: execution.command,
    args: {
      adapter: "long_runtime_executor",
      requestId: input.requestId,
      entrypointCommand: `npm run ${input.command.npmScript}`,
      ...input.requestBindings,
      outputDirectory: execution.outputDirectory,
      outputManifestPath: input.artifactManifest?.manifestPath ?? null,
    },
    status: input.status,
    outputs: {
      artifacts:
        input.artifactManifest?.entries.map((entry) => entry.path) ?? [],
      scalars: {},
      units: {},
      gates: {
        runtime_execution: input.execution.timedOut
          ? "not_ready"
          : input.execution.exitCode === 0
            ? "pass"
            : "fail",
        ...(input.failureSignal
          ? { runtime_receipt_construction: "fail" as const }
          : {}),
        runtime_execution_provenance: provenanceComplete ? "pass" : "not_ready",
        runtime_artifact_freshness: hasFreshArtifact ? "pass" : "not_ready",
      },
      missingSignals: [
        ...failureSignals,
        ...(!provenanceComplete
          ? ["runtime_execution_provenance_unbound"]
          : []),
        ...(!input.artifactManifest ? ["runtime_output_manifest_missing"] : []),
        ...(input.artifactManifest && !hasFreshArtifact
          ? ["runtime_artifact_freshness_preexisting_only"]
          : []),
      ],
      warnings: [
        input.execution.error ?? `Long runtime ${input.status}.`,
        ...(input.additionalWarnings ?? []),
        "No claim promotion is allowed from failed or timed-out runtime execution.",
      ],
      ...(input.artifactManifest
        ? {
            artifactManifest: input.artifactManifest,
            artifactEvidence: input.artifactManifest.entries.map((entry) => ({
              path: entry.path,
              sha256: entry.sha256,
              freshness: entry.freshness,
              status: "unknown" as const,
              gates: {},
            })),
          }
        : {}),
    },
    provenance: {
      gitSha: input.gitSha,
      startedAt: input.execution.startedAt,
      completedAt: input.execution.completedAt,
      durationMs: input.execution.durationMs,
    },
    execution,
    claimBoundary: {
      currentTier: entrypoint?.claimBoundary.currentTier ?? "diagnostic",
      maximumTier: entrypoint?.claimBoundary.maximumTier ?? "reduced_order",
      promotionAllowed: false,
      promotionBlockedBy: [
        ...(entrypoint?.claimBoundary.promotionRequires ?? []),
        ...failureSignals,
      ],
    },
  });
}

export async function executeLongTheoryRuntimeRequest(
  input: ExecuteLongTheoryRuntimeRequestInput,
  options: {
    spawnExecutor?: TheoryRuntimeSpawnExecutor;
    manageTerminalStatus?: boolean;
    resolveGitSha?: (projectRoot: string) => Promise<string | null>;
    resolveSourceTreeState?: (
      projectRoot: string,
      gitSha: string | null,
    ) => Promise<TheoryRuntimeSourceTreeState>;
  } = {},
): Promise<ExecuteLongTheoryRuntimeRequestResult> {
  if (input.execute !== true)
    throw new Error("Long runtime execution requires explicit execute: true.");
  const request = await readTheoryRuntimeRunRequestStatus({
    requestId: input.requestId,
    projectRoot: input.projectRoot,
  });
  if (!request)
    throw new Error(
      `Runtime request manifest ${input.requestId} was not found.`,
    );
  if (!isAllowedLongRuntimeId(request.runtimeId)) {
    throw new Error(
      `Runtime ${request.runtimeId} is not allowlisted for long execution.`,
    );
  }

  const projectRoot = path.resolve(input.projectRoot ?? process.cwd());
  const outputDirectory = await prepareOutputDirectory(
    projectRoot,
    input.outputDirectory,
  );
  const relativeOutputDirectory =
    normalizeRelativePath(path.relative(projectRoot, outputDirectory)) || ".";
  const beforeSnapshot = await snapshotTheoryRuntimeOutput({
    projectRoot,
    outputDirectory,
  });
  const beforeCapturedAt = new Date().toISOString();
  const gitResolver = options.resolveGitSha ?? resolveGitSha;
  const safeResolveGitSha = async (): Promise<string | null> => {
    try {
      const value =
        (await gitResolver(projectRoot))?.trim().toLowerCase() ?? "";
      return /^[a-f0-9]{40,64}$/.test(value) ? value : null;
    } catch {
      return null;
    }
  };
  const startedGitSha = await safeResolveGitSha();
  const sourceTreeState = await (
    options.resolveSourceTreeState ?? resolveSourceTreeState
  )(projectRoot, startedGitSha);
  const plannedReceiptId = theoryRuntimeReceiptIdForRequest(
    request.runtimeId,
    input.requestId,
  );
  const beforeCommitment = await writeTheoryRuntimePreSpawnSnapshotCommitment({
    projectRoot,
    requestId: input.requestId,
    runtimeId: request.runtimeId,
    outputDirectory,
    beforeCapturedAt,
    gitSha: startedGitSha,
    sourceTreeSha256: sourceTreeState.sourceTreeSha256,
    worktreeClean: sourceTreeState.worktreeClean,
    before: beforeSnapshot,
  });
  const requestBindings = candidateRuntimeBindings(request.args);

  const command = buildLongRuntimeCommand({
    runtimeId: request.runtimeId,
    requestId: input.requestId,
    receiptId: plannedReceiptId,
    projectRoot,
    outputDirectory,
    requestArgs: request.args,
    timeoutMs: input.timeoutMs,
  });

  await updateTheoryRuntimeRunRequestStatus({
    requestId: input.requestId,
    projectRoot,
    status: "running",
    updatedAt: input.generatedAt,
    heartbeat: {
      stage: "running",
      message: `Running fixed runtime command: npm run ${command.npmScript}`,
      progress: null,
    },
  });

  const execution = await (
    options.spawnExecutor ?? executeTheoryRuntimeCommand
  )(command);
  const completedGitSha = await safeResolveGitSha();
  const stableGitSha =
    startedGitSha && completedGitSha === startedGitSha ? startedGitSha : null;
  const provenanceWarnings = [
    ...(!startedGitSha || !completedGitSha
      ? [
          "Execution commit SHA could not be resolved for the complete runtime interval.",
        ]
      : []),
    ...(startedGitSha && completedGitSha && startedGitSha !== completedGitSha
      ? [
          "Repository HEAD changed during runtime execution; commit provenance is unbound.",
        ]
      : []),
  ];

  let artifactManifest: TheoryRuntimeOutputManifestV1 | null = null;
  let finalizationError: string | null = null;
  let receiptConstructionFailed = false;
  try {
    const afterSnapshot = await snapshotTheoryRuntimeOutput({
      projectRoot,
      outputDirectory,
    });
    const afterCapturedAt = new Date().toISOString();
    artifactManifest = await writeTheoryRuntimeOutputManifest({
      projectRoot,
      outputDirectory,
      requestId: input.requestId,
      runtimeId: request.runtimeId,
      gitSha: stableGitSha,
      startedAt: execution.startedAt,
      completedAt: execution.completedAt,
      generatedAt: input.generatedAt,
      entries: classifyTheoryRuntimeArtifacts({
        before: beforeSnapshot,
        after: afterSnapshot,
      }),
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
    finalizationError =
      error instanceof Error
        ? error.message
        : "Runtime output manifest construction failed.";
  }

  let receiptV1: TheoryRuntimeReceiptV1;
  if (execution.timedOut || execution.exitCode !== 0 || finalizationError) {
    const status = execution.timedOut ? "timeout" : "failed";
    receiptV1 = failedExecutionReceipt({
      receiptId: plannedReceiptId,
      requestId: input.requestId,
      requestBindings,
      runtimeId: request.runtimeId,
      graphId: request.graphId,
      badgeIds: request.badgeIds,
      command,
      execution,
      status,
      outputDirectory,
      gitSha: stableGitSha,
      artifactManifest,
      failureSignal: finalizationError
        ? "runtime_receipt_construction_failed"
        : undefined,
      additionalWarnings: [
        ...provenanceWarnings,
        ...(finalizationError ? [finalizationError] : []),
      ],
      generatedAt: input.generatedAt,
    });
  } else {
    const executionV1 = buildExecutionProvenance({
      command,
      execution,
      outputDirectory,
    });
    try {
      receiptV1 = await readWarpNhm2RuntimeArtifacts({
        runtimeId: request.runtimeId,
        requestId: input.requestId,
        graphId: request.graphId,
        badgeIds: request.badgeIds,
        projectRoot,
        generatedAt: input.generatedAt,
        outputDirectory: relativeOutputDirectory,
        artifactManifest: artifactManifest!,
        command: `npm run ${command.npmScript}`,
        provenance: {
          gitSha: stableGitSha,
          startedAt: execution.startedAt,
          completedAt: execution.completedAt,
          durationMs: execution.durationMs,
        },
        execution: executionV1,
        warnings: provenanceWarnings,
      });
      receiptV1.receiptId = plannedReceiptId;
      receiptV1.command = executionV1.command;
      receiptV1.args = {
        ...receiptV1.args,
        requestId: input.requestId,
        entrypointCommand: `npm run ${command.npmScript}`,
        ...requestBindings,
      };
    } catch (error) {
      receiptConstructionFailed = true;
      receiptV1 = failedExecutionReceipt({
        receiptId: plannedReceiptId,
        requestId: input.requestId,
        requestBindings,
        runtimeId: request.runtimeId,
        graphId: request.graphId,
        badgeIds: request.badgeIds,
        command,
        execution,
        status: "failed",
        outputDirectory,
        gitSha: stableGitSha,
        artifactManifest,
        failureSignal: "runtime_receipt_construction_failed",
        additionalWarnings: [
          ...provenanceWarnings,
          error instanceof Error
            ? error.message
            : "Runtime receipt construction failed.",
        ],
        generatedAt: input.generatedAt,
      });
    }
  }

  let receiptArtifact: TheoryRuntimePersistedReceiptRefV1 | null = null;
  let receiptPersistenceFailed = false;
  try {
    receiptArtifact = await writeTheoryRuntimeReceiptArtifact({
      projectRoot,
      requestId: input.requestId,
      receipt: receiptV1,
      writtenAt: receiptV1.provenance.completedAt ?? input.generatedAt,
    });
  } catch (error) {
    receiptPersistenceFailed = true;
    receiptV1.status = "failed";
    receiptV1.outputs.gates.runtime_execution_provenance = "fail";
    receiptV1.outputs.missingSignals = Array.from(
      new Set([
        ...receiptV1.outputs.missingSignals,
        "runtime_receipt_persistence_failed",
      ]),
    );
    receiptV1.outputs.warnings = Array.from(
      new Set([
        ...receiptV1.outputs.warnings,
        error instanceof Error
          ? error.message
          : "Runtime receipt persistence failed.",
      ]),
    );
    receiptV1.claimBoundary.promotionAllowed = false;
    receiptV1.claimBoundary.promotionBlockedBy = Array.from(
      new Set([
        ...receiptV1.claimBoundary.promotionBlockedBy,
        "runtime_receipt_persistence_failed",
      ]),
    );
  }

  if (options.manageTerminalStatus !== false) {
    const terminalStatus = execution.timedOut
      ? "timeout"
      : execution.exitCode !== 0 ||
          finalizationError ||
          receiptConstructionFailed ||
          receiptPersistenceFailed
        ? "failed"
        : "completed";
    const evidenceMessage =
      terminalStatus === "completed"
        ? `Process completed; evidence receipt ${receiptV1.status}.`
        : (receiptV1.outputs.warnings[0] ?? `Runtime ${terminalStatus}.`);
    await updateTheoryRuntimeRunRequestStatus({
      requestId: input.requestId,
      projectRoot,
      status: terminalStatus,
      updatedAt: receiptV1.provenance.completedAt ?? input.generatedAt,
      heartbeat: {
        stage: terminalStatus,
        message: evidenceMessage,
        progress: 1,
      },
    });
  }

  return {
    requestId: input.requestId,
    runtimeId: request.runtimeId,
    command,
    execution,
    receiptV1,
    receiptArtifact,
  };
}
