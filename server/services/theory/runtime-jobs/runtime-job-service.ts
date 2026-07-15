import type { TheoryRuntimeJobSnapshotV1 } from "../../../../shared/contracts/theory-runtime-job.v1";
import type { TheoryRuntimeReceiptV1 } from "../../../../shared/contracts/theory-runtime-receipt.v1";
import type { TheoryRuntimeRunRequestScope } from "../../../../shared/contracts/theory-runtime-run-request.v1";
import { getTheoryRuntimeEntrypoint } from "../../../../shared/theory/runtime-entrypoints";
import {
  getTheoryRuntimeExecutionClass,
  isTheoryRuntimeExecutableId,
  THEORY_RUNTIME_WORKSTATION_GRAPH_ID,
} from "../../../../shared/theory/runtime-execution-policy";
import type { TheoryRuntimeSpawnExecutor } from "../runtime-adapters";
import {
  createTheoryRuntimeRunRequestManifest,
  readTheoryRuntimeRunRequestStatus,
  updateTheoryRuntimeRunRequestStatus,
} from "../theory-runtime-run-request-manifest";
import { projectTheoryRuntimeJob } from "./runtime-job-projection";
import { runTheoryRuntimeJob } from "./runtime-job-runner";
import { readTheoryRuntimeJobReceipt } from "./runtime-job-store";
import {
  buildInterruptedTheoryRuntimeReceipt,
  persistAndFinalizeTheoryRuntimeJob,
} from "./runtime-job-finalizer";

const inFlightJobs = new Map<string, Promise<void>>();

export type StartTheoryRuntimeJobInput = {
  runtimeId: string;
  graphId: string;
  badgeIds: string[];
  args?: Record<string, unknown>;
  requestedScope: TheoryRuntimeRunRequestScope;
  projectRoot?: string;
};

function assertStartInput(input: StartTheoryRuntimeJobInput): void {
  if (!isTheoryRuntimeExecutableId(input.runtimeId)) {
    throw new Error(`Runtime ${input.runtimeId} is not allowlisted for workstation execution.`);
  }
  const entrypoint = getTheoryRuntimeEntrypoint(input.runtimeId);
  if (!entrypoint?.command) throw new Error(`Runtime ${input.runtimeId} has no fixed command.`);
  if (Object.keys(input.args ?? {}).length > 0 && entrypoint.argsSchema === null) {
    throw new Error(`Runtime ${input.runtimeId} does not accept workstation arguments.`);
  }
  if (input.graphId.trim() !== THEORY_RUNTIME_WORKSTATION_GRAPH_ID) {
    throw new Error(`Runtime ${input.runtimeId} must use server-owned graph ${THEORY_RUNTIME_WORKSTATION_GRAPH_ID}.`);
  }
  const requestedBadgeIds = Array.from(new Set(input.badgeIds)).sort();
  const ownedBadgeIds = [...entrypoint.ownedBadgeIds].sort();
  if (
    requestedBadgeIds.length !== input.badgeIds.length ||
    requestedBadgeIds.length !== ownedBadgeIds.length ||
    requestedBadgeIds.some((badgeId, index) => badgeId !== ownedBadgeIds[index])
  ) {
    throw new Error(`Runtime ${input.runtimeId} badge ownership must match its server registry entry.`);
  }
  const expectedScope = getTheoryRuntimeExecutionClass(input.runtimeId) === "long_execution" ? "full" : "quick";
  if (input.requestedScope !== expectedScope) {
    throw new Error(`Runtime ${input.runtimeId} requires server-owned scope ${expectedScope}.`);
  }
}

async function executeAndPersist(input: {
  requestId: string;
  projectRoot?: string;
  spawnExecutor?: TheoryRuntimeSpawnExecutor;
}): Promise<void> {
  try {
    const receipt = await runTheoryRuntimeJob(input);
    await persistAndFinalizeTheoryRuntimeJob({ ...input, receipt });
  } catch (error) {
    const current = await readTheoryRuntimeRunRequestStatus(input);
    const persistedReceipt = await readTheoryRuntimeJobReceipt(input);
    if (current && persistedReceipt && !["completed", "failed", "timeout", "cancelled"].includes(current.status)) {
      await persistAndFinalizeTheoryRuntimeJob({ ...input, receipt: persistedReceipt });
      return;
    }
    if (current && current.status !== "failed" && current.status !== "timeout") {
      await updateTheoryRuntimeRunRequestStatus({
        ...input,
        status: "failed",
        heartbeat: {
          stage: "failed",
          message: error instanceof Error ? error.message : "Runtime job failed.",
          progress: 1,
        },
      });
    }
  }
}

function trackExecution(input: {
  requestId: string;
  projectRoot?: string;
  spawnExecutor?: TheoryRuntimeSpawnExecutor;
}): Promise<void> {
  const existing = inFlightJobs.get(input.requestId);
  if (existing) return existing;
  const promise = executeAndPersist(input).finally(() => inFlightJobs.delete(input.requestId));
  inFlightJobs.set(input.requestId, promise);
  return promise;
}

function queueExecution(input: {
  requestId: string;
  projectRoot?: string;
  spawnExecutor?: TheoryRuntimeSpawnExecutor;
}): void {
  void trackExecution(input);
}

export async function startTheoryRuntimeJob(
  input: StartTheoryRuntimeJobInput,
  options: { spawnExecutor?: TheoryRuntimeSpawnExecutor; deferExecution?: boolean } = {},
): Promise<TheoryRuntimeJobSnapshotV1> {
  assertStartInput(input);
  const { request } = await createTheoryRuntimeRunRequestManifest({
    runtimeId: input.runtimeId,
    graphId: input.graphId,
    badgeIds: input.badgeIds,
    args: input.args ?? {},
    requestedScope: input.requestedScope,
    status: "queued",
    projectRoot: input.projectRoot,
  });
  if (!options.deferExecution) {
    queueExecution({
      requestId: request.requestId,
      projectRoot: input.projectRoot,
      spawnExecutor: options.spawnExecutor,
    });
  }
  return projectTheoryRuntimeJob(request, null);
}

export async function runQueuedTheoryRuntimeJobNow(input: {
  requestId: string;
  projectRoot?: string;
  spawnExecutor?: TheoryRuntimeSpawnExecutor;
}): Promise<TheoryRuntimeJobSnapshotV1> {
  await trackExecution(input);
  const snapshot = await readTheoryRuntimeJob(input);
  if (!snapshot) throw new Error(`Runtime job ${input.requestId} was not found after execution.`);
  return snapshot;
}

export async function readTheoryRuntimeJob(input: {
  requestId: string;
  projectRoot?: string;
  spawnExecutor?: TheoryRuntimeSpawnExecutor;
}): Promise<TheoryRuntimeJobSnapshotV1 | null> {
  let request = await readTheoryRuntimeRunRequestStatus(input);
  if (!request) return null;
  let receipt = await readTheoryRuntimeJobReceipt(input);
  if (
    receipt &&
    !inFlightJobs.has(input.requestId) &&
    !["completed", "failed", "timeout", "cancelled"].includes(request.status)
  ) {
    request = await persistAndFinalizeTheoryRuntimeJob({ ...input, receipt });
  } else if (!receipt && request.status === "queued" && !inFlightJobs.has(input.requestId)) {
    queueExecution(input);
  } else if (!receipt && request.status === "running" && !inFlightJobs.has(input.requestId)) {
    receipt = buildInterruptedTheoryRuntimeReceipt(request);
    request = await persistAndFinalizeTheoryRuntimeJob({ ...input, receipt });
  }
  return projectTheoryRuntimeJob(request, receipt);
}

export async function readTheoryRuntimeResult(input: {
  requestId: string;
  projectRoot?: string;
}): Promise<TheoryRuntimeReceiptV1 | null> {
  await readTheoryRuntimeJob(input);
  return readTheoryRuntimeJobReceipt(input);
}
