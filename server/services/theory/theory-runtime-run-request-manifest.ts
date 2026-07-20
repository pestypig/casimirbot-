import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  buildTheoryRuntimeRunRequestV1,
  isTheoryRuntimeRunRequestV1,
  type TheoryRuntimeRunRequestScope,
  type TheoryRuntimeRunRequestStatus,
  type TheoryRuntimeRunRequestV1,
} from "../../../shared/contracts/theory-runtime-run-request.v1";
import { getTheoryRuntimeEntrypoint } from "../../../shared/theory/runtime-entrypoints";
import {
  createTheoryRuntimeJsonFile,
  readTheoryRuntimeJsonFile,
  writeTheoryRuntimeJsonFile,
} from "./runtime-atomic-json-store";

export type CreateTheoryRuntimeRunRequestManifestInput = {
  runtimeId: string;
  graphId: string;
  badgeIds: string[];
  args?: Record<string, unknown>;
  requestedScope: TheoryRuntimeRunRequestScope;
  status?: TheoryRuntimeRunRequestStatus;
  requestId?: string;
  projectRoot?: string;
  generatedAt?: string;
};

export type UpdateTheoryRuntimeRunRequestStatusInput = {
  requestId: string;
  status: TheoryRuntimeRunRequestStatus;
  projectRoot?: string;
  updatedAt?: string;
  heartbeat?: Partial<TheoryRuntimeRunRequestV1["heartbeat"]>;
};

const REQUEST_DIR = "artifacts/theory-runtime-requests";

function requestRoot(projectRoot?: string): string {
  return path.resolve(projectRoot ?? process.cwd(), REQUEST_DIR);
}

function safeRequestFileName(requestId: string): string {
  return `${requestId.replace(/[^A-Za-z0-9._-]+/g, "_")}.json`;
}

function requestPath(
  projectRoot: string | undefined,
  requestId: string,
): string {
  return path.join(requestRoot(projectRoot), safeRequestFileName(requestId));
}

function generatedRequestId(runtimeId: string): string {
  return `theory-runtime-request:${runtimeId}:${randomUUID()}`;
}

async function writeRequest(
  projectRoot: string | undefined,
  request: TheoryRuntimeRunRequestV1,
  mode: "create" | "replace",
): Promise<string> {
  const manifestPath = requestPath(projectRoot, request.requestId);
  if (mode === "create") {
    try {
      await createTheoryRuntimeJsonFile(manifestPath, request);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EEXIST") {
        throw new Error(
          `Runtime request manifest ${request.requestId} already exists and is immutable as an execution identity.`,
          { cause: error },
        );
      }
      throw error;
    }
  } else {
    await writeTheoryRuntimeJsonFile(manifestPath, request);
  }
  return manifestPath;
}

export async function createTheoryRuntimeRunRequestManifest(
  input: CreateTheoryRuntimeRunRequestManifestInput,
): Promise<{ request: TheoryRuntimeRunRequestV1; manifestPath: string }> {
  const entrypoint = getTheoryRuntimeEntrypoint(input.runtimeId);
  if (!entrypoint) {
    throw new Error(
      `Runtime ${input.runtimeId} is not registered in THEORY_RUNTIME_ENTRYPOINTS.`,
    );
  }
  const now = input.generatedAt ?? new Date().toISOString();
  const request = buildTheoryRuntimeRunRequestV1({
    generatedAt: now,
    requestId: input.requestId ?? generatedRequestId(input.runtimeId),
    runtimeId: entrypoint.runtimeId,
    graphId: input.graphId,
    badgeIds: input.badgeIds,
    args: input.args ?? {},
    requestedScope: input.requestedScope,
    status: input.status ?? "created",
    createdAt: now,
    updatedAt: now,
    heartbeat: {
      updatedAt: now,
      stage: "manifest_created",
      message: "Runtime request manifest created; no backend runtime executed.",
      progress: 0,
    },
    outputArtifactGlobs: entrypoint.outputArtifactGlobs,
    claimBoundary: {
      ...entrypoint.claimBoundary,
      promotionAllowed: false,
    },
  });
  const manifestPath = await writeRequest(input.projectRoot, request, "create");
  return { request, manifestPath };
}

export async function readTheoryRuntimeRunRequestStatus(input: {
  requestId: string;
  projectRoot?: string;
}): Promise<TheoryRuntimeRunRequestV1 | null> {
  const manifestPath = requestPath(input.projectRoot, input.requestId);
  try {
    const raw = await readTheoryRuntimeJsonFile(manifestPath);
    const parsed = JSON.parse(raw) as unknown;
    if (!isTheoryRuntimeRunRequestV1(parsed)) {
      throw new Error(
        `Runtime request manifest ${input.requestId} failed validation.`,
      );
    }
    return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function updateTheoryRuntimeRunRequestStatus(
  input: UpdateTheoryRuntimeRunRequestStatusInput,
): Promise<{ request: TheoryRuntimeRunRequestV1; manifestPath: string }> {
  const current = await readTheoryRuntimeRunRequestStatus({
    requestId: input.requestId,
    projectRoot: input.projectRoot,
  });
  if (!current)
    throw new Error(
      `Runtime request manifest ${input.requestId} was not found.`,
    );
  const updatedAt = input.updatedAt ?? new Date().toISOString();
  const progressWasProvided = Boolean(
    input.heartbeat &&
    Object.prototype.hasOwnProperty.call(input.heartbeat, "progress"),
  );
  const request = buildTheoryRuntimeRunRequestV1({
    ...current,
    generatedAt: current.generatedAt,
    status: input.status,
    updatedAt,
    heartbeat: {
      updatedAt,
      stage: input.heartbeat?.stage ?? current.heartbeat.stage,
      message: input.heartbeat?.message ?? current.heartbeat.message,
      progress: progressWasProvided
        ? (input.heartbeat?.progress ?? null)
        : current.heartbeat.progress,
    },
  });
  const manifestPath = await writeRequest(
    input.projectRoot,
    request,
    "replace",
  );
  return { request, manifestPath };
}
