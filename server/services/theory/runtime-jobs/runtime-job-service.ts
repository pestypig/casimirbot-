import path from "node:path";

import type { TheoryRuntimeJobSnapshotV1 } from "../../../../shared/contracts/theory-runtime-job.v1";
import type { TheoryRuntimeReceiptV1 } from "../../../../shared/contracts/theory-runtime-receipt.v1";
import type { TheoryRuntimeRunRequestScope } from "../../../../shared/contracts/theory-runtime-run-request.v1";
import type { TheoryRuntimeRunRequestV1 } from "../../../../shared/contracts/theory-runtime-run-request.v1";
import { getTheoryRuntimeEntrypoint } from "../../../../shared/theory/runtime-entrypoints";
import {
  getTheoryRuntimeExecutionClass,
  isTheoryRuntimeDedicatedExecutableId,
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
import {
  admitNhm2PrimaryRuntimeLaunch,
  executeNhm2PrimaryRuntimeLaunch,
  NHM2_PRIMARY_RUNTIME_ID,
  readNhm2PrimaryRuntimeReceipt,
  terminalizeNhm2PrimaryRuntimeFailure,
  type Nhm2PrimaryRuntimeDispatchDependencies,
} from "./nhm2-primary-runtime-dispatch";

const inFlightJobs = new Map<string, Promise<void>>();
const TERMINAL_REQUEST_STATUSES = new Set([
  "completed",
  "failed",
  "timeout",
  "cancelled",
]);

export type StartTheoryRuntimeJobInput = {
  runtimeId: string;
  graphId: string;
  badgeIds: string[];
  args?: Record<string, unknown>;
  requestedScope: TheoryRuntimeRunRequestScope;
  projectRoot?: string;
};

function assertRegistryOwnership(
  input: StartTheoryRuntimeJobInput,
  expectedScope: TheoryRuntimeRunRequestScope,
): void {
  const entrypoint = getTheoryRuntimeEntrypoint(input.runtimeId);
  if (!entrypoint?.command)
    throw new Error(`Runtime ${input.runtimeId} has no fixed command.`);
  if (input.graphId.trim() !== THEORY_RUNTIME_WORKSTATION_GRAPH_ID) {
    throw new Error(
      `Runtime ${input.runtimeId} must use server-owned graph ${THEORY_RUNTIME_WORKSTATION_GRAPH_ID}.`,
    );
  }
  const requestedBadgeIds = Array.from(new Set(input.badgeIds)).sort();
  const ownedBadgeIds = [...entrypoint.ownedBadgeIds].sort();
  if (
    requestedBadgeIds.length !== input.badgeIds.length ||
    requestedBadgeIds.length !== ownedBadgeIds.length ||
    requestedBadgeIds.some((badgeId, index) => badgeId !== ownedBadgeIds[index])
  ) {
    throw new Error(
      `Runtime ${input.runtimeId} badge ownership must match its server registry entry.`,
    );
  }
  if (input.requestedScope !== expectedScope) {
    throw new Error(
      `Runtime ${input.runtimeId} requires server-owned scope ${expectedScope}.`,
    );
  }
}

function assertStartInput(input: StartTheoryRuntimeJobInput): void {
  if (!isTheoryRuntimeExecutableId(input.runtimeId)) {
    throw new Error(
      `Runtime ${input.runtimeId} is not allowlisted for workstation execution.`,
    );
  }
  const entrypoint = getTheoryRuntimeEntrypoint(input.runtimeId);
  if (
    Object.keys(input.args ?? {}).length > 0 &&
    entrypoint?.argsSchema === null
  ) {
    throw new Error(
      `Runtime ${input.runtimeId} does not accept workstation arguments.`,
    );
  }
  const expectedScope =
    getTheoryRuntimeExecutionClass(input.runtimeId) === "long_execution"
      ? "full"
      : "quick";
  assertRegistryOwnership(input, expectedScope);
}

function primaryCandidateManifestPath(
  input: StartTheoryRuntimeJobInput,
): string {
  if (!isTheoryRuntimeDedicatedExecutableId(input.runtimeId)) {
    throw new Error(
      `Runtime ${input.runtimeId} is not allowlisted for dedicated execution.`,
    );
  }
  const args = input.args ?? {};
  if (
    Object.keys(args).length !== 1 ||
    typeof args.candidateManifestPath !== "string" ||
    args.candidateManifestPath.trim() !== args.candidateManifestPath ||
    args.candidateManifestPath.length === 0
  ) {
    throw new Error(
      `Runtime ${NHM2_PRIMARY_RUNTIME_ID} accepts exactly one server-admitted candidateManifestPath argument.`,
    );
  }
  assertRegistryOwnership(input, "full");
  return args.candidateManifestPath;
}

function executionKey(input: {
  requestId: string;
  projectRoot?: string;
}): string {
  return `${path.resolve(input.projectRoot ?? process.cwd())}\0${input.requestId}`;
}

function isInFlight(input: {
  requestId: string;
  projectRoot?: string;
}): boolean {
  return inFlightJobs.has(executionKey(input));
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
    if (
      current &&
      persistedReceipt &&
      !["completed", "failed", "timeout", "cancelled"].includes(current.status)
    ) {
      await persistAndFinalizeTheoryRuntimeJob({
        ...input,
        receipt: persistedReceipt,
      });
      return;
    }
    if (
      current &&
      current.status !== "failed" &&
      current.status !== "timeout"
    ) {
      await updateTheoryRuntimeRunRequestStatus({
        ...input,
        status: "failed",
        heartbeat: {
          stage: "failed",
          message:
            error instanceof Error ? error.message : "Runtime job failed.",
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
  const key = executionKey(input);
  const existing = inFlightJobs.get(key);
  if (existing) return existing;
  const promise = executeAndPersist(input).finally(() =>
    inFlightJobs.delete(key),
  );
  inFlightJobs.set(key, promise);
  return promise;
}

function queueExecution(input: {
  requestId: string;
  projectRoot?: string;
  spawnExecutor?: TheoryRuntimeSpawnExecutor;
}): void {
  void trackExecution(input);
}

async function startNhm2PrimaryRuntimeJob(
  input: StartTheoryRuntimeJobInput,
  options: {
    spawnExecutor?: TheoryRuntimeSpawnExecutor;
    primaryDependencies?: Nhm2PrimaryRuntimeDispatchDependencies;
  },
): Promise<TheoryRuntimeJobSnapshotV1> {
  const candidateManifestPath = primaryCandidateManifestPath(input);
  const admission = await admitNhm2PrimaryRuntimeLaunch(
    {
      projectRoot: input.projectRoot,
      candidateManifestPath,
    },
    options.primaryDependencies,
  );
  const key = executionKey({
    requestId: admission.plan.requestId,
    projectRoot: input.projectRoot,
  });
  if (inFlightJobs.has(key)) {
    throw new Error(
      `Primary request ${admission.plan.requestId} already has a server-owned execution attempt.`,
    );
  }

  let resolveRequest!: (request: TheoryRuntimeRunRequestV1) => void;
  let rejectRequest!: (error: unknown) => void;
  const requestPublished = new Promise<TheoryRuntimeRunRequestV1>(
    (resolve, reject) => {
      resolveRequest = resolve;
      rejectRequest = reject;
    },
  );
  let publishedRequest: TheoryRuntimeRunRequestV1 | null = null;
  const execution = executeNhm2PrimaryRuntimeLaunch(
    {
      projectRoot: input.projectRoot,
      admission,
      spawnExecutor: options.spawnExecutor,
      onRequestCreated: (request) => {
        publishedRequest = request;
        resolveRequest(request);
      },
    },
    options.primaryDependencies,
  )
    .then(() => undefined)
    .catch(async (error) => {
      if (!publishedRequest) {
        rejectRequest(error);
        return;
      }
      try {
        await terminalizeNhm2PrimaryRuntimeFailure({
          projectRoot: input.projectRoot,
          request: publishedRequest,
          error,
        });
      } catch (terminalError) {
        await updateTheoryRuntimeRunRequestStatus({
          projectRoot: input.projectRoot,
          requestId: publishedRequest.requestId,
          status: "failed",
          heartbeat: {
            stage: "failed",
            message: `Dedicated primary terminalization failed: ${
              terminalError instanceof Error
                ? terminalError.message
                : String(terminalError)
            }`,
            progress: 1,
          },
        }).catch(() => undefined);
      }
    })
    .finally(() => inFlightJobs.delete(key));
  inFlightJobs.set(key, execution);

  const request = await requestPublished;
  const receipt = await readNhm2PrimaryRuntimeReceipt({
    projectRoot: input.projectRoot,
    request,
  });
  return projectTheoryRuntimeJob(request, receipt);
}

export async function startTheoryRuntimeJob(
  input: StartTheoryRuntimeJobInput,
  options: {
    spawnExecutor?: TheoryRuntimeSpawnExecutor;
    deferExecution?: boolean;
    primaryDependencies?: Nhm2PrimaryRuntimeDispatchDependencies;
  } = {},
): Promise<TheoryRuntimeJobSnapshotV1> {
  if (input.runtimeId === NHM2_PRIMARY_RUNTIME_ID) {
    if (options.deferExecution) {
      throw new Error(
        "The dedicated NHM2 primary launch cannot be detached from its executor-owned request creation.",
      );
    }
    return startNhm2PrimaryRuntimeJob(input, options);
  }
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
  const existingRequest = await readTheoryRuntimeRunRequestStatus(input);
  if (existingRequest?.runtimeId === NHM2_PRIMARY_RUNTIME_ID) {
    const active = inFlightJobs.get(executionKey(input));
    if (active) {
      await active;
    } else if (!TERMINAL_REQUEST_STATUSES.has(existingRequest.status)) {
      await terminalizeNhm2PrimaryRuntimeFailure({
        projectRoot: input.projectRoot,
        request: existingRequest,
        error:
          "The executor-owned primary request lost its outer launch owner and cannot be replayed through the generic runner.",
      });
    }
    const snapshot = await readTheoryRuntimeJob(input);
    if (!snapshot) {
      throw new Error(
        `Runtime job ${input.requestId} was not found after dedicated execution.`,
      );
    }
    return snapshot;
  }
  await trackExecution(input);
  const snapshot = await readTheoryRuntimeJob(input);
  if (!snapshot)
    throw new Error(
      `Runtime job ${input.requestId} was not found after execution.`,
    );
  return snapshot;
}

export async function readTheoryRuntimeJob(input: {
  requestId: string;
  projectRoot?: string;
  spawnExecutor?: TheoryRuntimeSpawnExecutor;
}): Promise<TheoryRuntimeJobSnapshotV1 | null> {
  let request = await readTheoryRuntimeRunRequestStatus(input);
  if (!request) return null;
  let receipt =
    request.runtimeId === NHM2_PRIMARY_RUNTIME_ID
      ? await readNhm2PrimaryRuntimeReceipt({
          projectRoot: input.projectRoot,
          request,
        })
      : await readTheoryRuntimeJobReceipt(input);
  if (
    receipt &&
    !isInFlight(input) &&
    !TERMINAL_REQUEST_STATUSES.has(request.status)
  ) {
    if (request.runtimeId === NHM2_PRIMARY_RUNTIME_ID) {
      await terminalizeNhm2PrimaryRuntimeFailure({
        projectRoot: input.projectRoot,
        request,
        error:
          "Dedicated primary receipt existed without an active launch owner.",
      });
      request = (await readTheoryRuntimeRunRequestStatus(input)) ?? request;
    } else {
      request = await persistAndFinalizeTheoryRuntimeJob({
        ...input,
        receipt,
      });
    }
  } else if (
    !receipt &&
    request.status === "queued" &&
    !isInFlight(input) &&
    request.runtimeId !== NHM2_PRIMARY_RUNTIME_ID
  ) {
    queueExecution(input);
  } else if (
    !receipt &&
    (request.status === "created" ||
      request.status === "queued" ||
      request.status === "running") &&
    !isInFlight(input)
  ) {
    if (request.runtimeId === NHM2_PRIMARY_RUNTIME_ID) {
      receipt = await terminalizeNhm2PrimaryRuntimeFailure({
        projectRoot: input.projectRoot,
        request,
        error:
          "The server no longer owns the dedicated primary process; replay through the generic launcher is forbidden.",
      });
      request = (await readTheoryRuntimeRunRequestStatus(input)) ?? request;
    } else if (request.status === "running") {
      receipt = buildInterruptedTheoryRuntimeReceipt(request);
      request = await persistAndFinalizeTheoryRuntimeJob({
        ...input,
        receipt,
      });
    }
  }
  return projectTheoryRuntimeJob(request, receipt);
}

export async function readTheoryRuntimeResult(input: {
  requestId: string;
  projectRoot?: string;
}): Promise<TheoryRuntimeReceiptV1 | null> {
  await readTheoryRuntimeJob(input);
  const request = await readTheoryRuntimeRunRequestStatus(input);
  if (request?.runtimeId === NHM2_PRIMARY_RUNTIME_ID) {
    return readNhm2PrimaryRuntimeReceipt({
      projectRoot: input.projectRoot,
      request,
    });
  }
  return readTheoryRuntimeJobReceipt(input);
}
