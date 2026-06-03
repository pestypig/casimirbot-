import crypto from "node:crypto";
import {
  buildStagePlayCheckpointRequestV1,
  type StagePlayCheckpointRequestReasonV1,
  type StagePlayCheckpointRequestStatusV1,
  type StagePlayCheckpointRequestV1,
} from "@shared/contracts/stage-play-checkpoint-request.v1";
import type { StagePlayBadgeGraphV1, StagePlayBadgeV1 } from "@shared/contracts/stage-play-badge-graph.v1";
import type { StagePlayPerturbationEventV1 } from "@shared/contracts/stage-play-perturbation-event.v1";

export const STAGE_PLAY_CHECKPOINT_QUEUE_DEFAULT_POLICY = {
  minMsSinceLastCheckpoint: 15_000,
  maxQueuedRequests: 5,
  collapseSimilarPerturbations: true,
  autoRunFirstUsableObservation: false,
} as const;

export type StagePlayCheckpointQueueJobState = {
  jobId: string;
  paused: boolean;
  ended: boolean;
  userTyping: boolean;
  manualAskTurnActive: boolean;
  lastCheckpointAt: string | null;
  updatedAt: string;
};

export type StagePlayCheckpointQueueListV1 = {
  schema: "stage_play_checkpoint_queue/v1";
  jobId?: string | null;
  requests: StagePlayCheckpointRequestV1[];
  jobState: StagePlayCheckpointQueueJobState | null;
  assistant_answer: false;
  context_role: "tool_evidence";
};

export type StagePlayCheckpointQueueAction =
  | "run"
  | "complete"
  | "skip"
  | "block"
  | "supersede"
  | "pause_job"
  | "resume_job"
  | "clear_queued"
  | "end_live_job";

export type StagePlayCheckpointQueueActionResult = {
  ok: boolean;
  schema: "stage_play_checkpoint_queue_action_response/v1";
  action: StagePlayCheckpointQueueAction;
  request: StagePlayCheckpointRequestV1 | null;
  queue: StagePlayCheckpointQueueListV1;
  reason:
    | "updated"
    | "no_request"
    | "job_paused"
    | "job_ended"
    | "running_request_exists"
    | "cleared"
    | "paused"
    | "resumed"
    | "ended";
  assistant_answer: false;
  context_role: "tool_evidence";
};

type StagePlayCheckpointQueueEntry = {
  request: StagePlayCheckpointRequestV1;
  enqueuedAt: string;
  updatedAt: string;
};

const requestsByJob = new Map<string, StagePlayCheckpointQueueEntry[]>();
const jobStateById = new Map<string, StagePlayCheckpointQueueJobState>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const clampLimit = (value: unknown, fallback: number): number => {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? Math.max(1, Math.min(40, Math.floor(number))) : fallback;
};

const nowIso = (value?: string | Date | null): string =>
  value instanceof Date ? value.toISOString() : typeof value === "string" && value.trim() ? value : new Date().toISOString();

const getOrCreateJobState = (
  jobId: string,
  now: string,
): StagePlayCheckpointQueueJobState => {
  const existing = jobStateById.get(jobId);
  if (existing) return existing;
  const next: StagePlayCheckpointQueueJobState = {
    jobId,
    paused: false,
    ended: false,
    userTyping: false,
    manualAskTurnActive: false,
    lastCheckpointAt: null,
    updatedAt: now,
  };
  jobStateById.set(jobId, next);
  return next;
};

const setJobState = (
  jobId: string,
  patch: Partial<Omit<StagePlayCheckpointQueueJobState, "jobId">>,
  now: string,
): StagePlayCheckpointQueueJobState => {
  const current = getOrCreateJobState(jobId, now);
  const next = {
    ...current,
    ...patch,
    updatedAt: now,
  };
  jobStateById.set(jobId, next);
  return next;
};

const activeRequests = (entries: StagePlayCheckpointQueueEntry[]): StagePlayCheckpointQueueEntry[] =>
  entries.filter((entry) => entry.request.status === "queued" || entry.request.status === "running");

const isManualRequest = (request: StagePlayCheckpointRequestV1): boolean =>
  request.reason === "user_requested_checkpoint";

const requestPriority = (request: StagePlayCheckpointRequestV1): number => {
  if (request.status === "running") return 0;
  if (isManualRequest(request)) return 1;
  if (request.status === "queued") return 2;
  return 3;
};

const sortEntries = (
  entries: StagePlayCheckpointQueueEntry[],
): StagePlayCheckpointQueueEntry[] => [...entries].sort((a, b) => {
  const priorityDelta = requestPriority(a.request) - requestPriority(b.request);
  if (priorityDelta !== 0) return priorityDelta;
  return a.enqueuedAt.localeCompare(b.enqueuedAt);
});

const queueEntriesForJob = (jobId: string): StagePlayCheckpointQueueEntry[] =>
  requestsByJob.get(jobId) ?? [];

const writeEntriesForJob = (jobId: string, entries: StagePlayCheckpointQueueEntry[]): void => {
  requestsByJob.set(jobId, sortEntries(entries));
};

const compactObservationRefsFromGraph = (graph: StagePlayBadgeGraphV1): string[] =>
  uniqueStrings([
    ...graph.badges
      .filter((badge) => badge.kind === "compact_observation")
      .flatMap((badge) => badge.evidenceRefs),
    ...graph.sourceWindow.latestObservationRefs,
  ]);

const priorAnswerSnapshotRefsFromGraph = (graph: StagePlayBadgeGraphV1): string[] =>
  uniqueStrings(graph.badges
    .filter((badge) => badge.kind === "answer_snapshot" && badge.output?.state === "model_reviewed")
    .flatMap((badge) => [badge.id, ...badge.evidenceRefs]));

const missingEvidenceFromGraph = (graph: StagePlayBadgeGraphV1): string[] =>
  uniqueStrings(graph.badges.flatMap((badge) => badge.missingEvidence)).slice(0, 20);

const questionForReason = (
  reason: StagePlayCheckpointRequestReasonV1,
  objective: string,
): string => {
  if (reason === "first_usable_observation") {
    return `Given the first usable Stage Play observation, what checkpoint answer should be produced for: ${objective}`;
  }
  if (reason === "prediction_validation_needed") {
    return `Validate the current Stage Play prediction evidence and produce a bounded answer snapshot for: ${objective}`;
  }
  if (reason === "prediction_horizon_expired") {
    return `The prediction horizon expired; what changed and what answer snapshot is current for: ${objective}`;
  }
  if (reason === "missing_evidence_resolved") {
    return `Missing evidence was resolved; update the checkpoint answer for: ${objective}`;
  }
  if (reason === "user_requested_checkpoint") {
    return `User requested a Stage Play checkpoint for: ${objective}`;
  }
  return `A meaningful Stage Play perturbation occurred; what current answer snapshot should Helix Ask produce for: ${objective}`;
};

const requestReasonFromPerturbation = (
  perturbation: StagePlayPerturbationEventV1,
): StagePlayCheckpointRequestReasonV1 => {
  if (perturbation.reason === "first_usable_observation") return "first_usable_observation";
  if (perturbation.reason === "missing_evidence_resolved") return "missing_evidence_resolved";
  if (perturbation.reason === "prediction_horizon_expired") return "prediction_horizon_expired";
  if (perturbation.reason === "prediction_contradicted") return "prediction_validation_needed";
  return "meaningful_perturbation";
};

const checkpointPolicyForReason = (input: {
  reason: StagePlayCheckpointRequestReasonV1;
  userTyping?: boolean;
  manualAskTurnActive?: boolean;
}): StagePlayCheckpointRequestV1["checkpointPolicy"] => {
  const autoPaused = Boolean(input.userTyping || input.manualAskTurnActive);
  const autoRunEligible = input.reason === "user_requested_checkpoint"
    ? false
    : input.reason === "first_usable_observation"
      ? STAGE_PLAY_CHECKPOINT_QUEUE_DEFAULT_POLICY.autoRunFirstUsableObservation
      : !autoPaused;
  return {
    autoRunEligible,
    requiresUserApproval: true,
    minMsSinceLastCheckpoint: STAGE_PLAY_CHECKPOINT_QUEUE_DEFAULT_POLICY.minMsSinceLastCheckpoint,
  };
};

const nextRequest = (
  input: {
    jobId: string;
    graph: StagePlayBadgeGraphV1;
    reason: StagePlayCheckpointRequestReasonV1;
    objective?: string | null;
    userPromptRef?: string | null;
    perturbationRefs?: string[];
    now: string;
    userTyping?: boolean;
    manualAskTurnActive?: boolean;
  },
): StagePlayCheckpointRequestV1 => {
  const objective = String(input.objective ?? input.graph.description ?? input.graph.title ?? "Review the current Stage Play graph.").trim();
  return buildStagePlayCheckpointRequestV1({
    checkpointRequestId: `stage_play_checkpoint_request:${hashShort([
      input.jobId,
      input.graph.graphId,
      input.reason,
      input.userPromptRef ?? null,
      input.perturbationRefs ?? [],
      input.now,
    ])}`,
    jobId: input.jobId,
    graphId: input.graph.graphId,
    objective,
    userPromptRef: input.userPromptRef ?? null,
    reason: input.reason,
    question: questionForReason(input.reason, objective),
    currentGraphRefs: uniqueStrings([input.graph.graphId]),
    compactObservationRefs: compactObservationRefsFromGraph(input.graph),
    perturbationRefs: uniqueStrings(input.perturbationRefs ?? []),
    priorAnswerSnapshotRefs: priorAnswerSnapshotRefsFromGraph(input.graph),
    missingEvidence: missingEvidenceFromGraph(input.graph),
    checkpointPolicy: checkpointPolicyForReason({
      reason: input.reason,
      userTyping: input.userTyping,
      manualAskTurnActive: input.manualAskTurnActive,
    }),
    status: "queued",
  });
};

const sameAutomaticPerturbationRequest = (
  left: StagePlayCheckpointRequestV1,
  right: StagePlayCheckpointRequestV1,
): boolean =>
  !isManualRequest(left) &&
  !isManualRequest(right) &&
  left.status === "queued" &&
  right.status === "queued" &&
  left.jobId === right.jobId &&
  left.reason === right.reason &&
  left.objective === right.objective &&
  left.graphId === right.graphId;

const trimQueuedRequests = (
  entries: StagePlayCheckpointQueueEntry[],
): StagePlayCheckpointQueueEntry[] => {
  const sorted = sortEntries(entries);
  const activeQueued = sorted.filter((entry) => entry.request.status === "queued");
  if (activeQueued.length <= STAGE_PLAY_CHECKPOINT_QUEUE_DEFAULT_POLICY.maxQueuedRequests) return sorted;
  let over = activeQueued.length - STAGE_PLAY_CHECKPOINT_QUEUE_DEFAULT_POLICY.maxQueuedRequests;
  return sorted.map((entry) => {
    if (over <= 0 || entry.request.status !== "queued" || isManualRequest(entry.request)) return entry;
    over -= 1;
    return {
      ...entry,
      request: {
        ...entry.request,
        status: "superseded" as const,
      },
    };
  });
};

export function enqueueStagePlayCheckpointRequest(input: {
  request: StagePlayCheckpointRequestV1;
  now?: string | Date | null;
}): StagePlayCheckpointRequestV1 {
  const updatedAt = nowIso(input.now);
  const jobState = getOrCreateJobState(input.request.jobId, updatedAt);
  const entries = queueEntriesForJob(input.request.jobId);
  const request = jobState.ended
    ? { ...input.request, status: "blocked" as const }
    : input.request;

  const existing = STAGE_PLAY_CHECKPOINT_QUEUE_DEFAULT_POLICY.collapseSimilarPerturbations
    ? entries.find((entry) => sameAutomaticPerturbationRequest(entry.request, request))
    : null;
  const nextEntries = existing
    ? entries.map((entry) => entry === existing
      ? {
          ...entry,
          updatedAt,
          request: {
            ...entry.request,
            compactObservationRefs: uniqueStrings([
              ...entry.request.compactObservationRefs,
              ...request.compactObservationRefs,
            ]),
            perturbationRefs: uniqueStrings([
              ...entry.request.perturbationRefs,
              ...request.perturbationRefs,
            ]),
            missingEvidence: uniqueStrings([
              ...entry.request.missingEvidence,
              ...request.missingEvidence,
            ]),
          },
        }
      : entry)
    : [
        ...entries,
        {
          request,
          enqueuedAt: updatedAt,
          updatedAt,
        },
      ];
  writeEntriesForJob(input.request.jobId, trimQueuedRequests(nextEntries));
  return existing?.request ?? request;
}

export function recordStagePlayCheckpointRequestFromPerturbation(input: {
  jobId: string;
  graph: StagePlayBadgeGraphV1;
  perturbation: StagePlayPerturbationEventV1 | null;
  objective?: string | null;
  now?: string | Date | null;
  userTyping?: boolean;
  manualAskTurnActive?: boolean;
}): StagePlayCheckpointRequestV1 | null {
  if (!input.perturbation?.checkpointSuggested) return null;
  const now = nowIso(input.now);
  const state = setJobState(input.jobId, {
    userTyping: Boolean(input.userTyping),
    manualAskTurnActive: Boolean(input.manualAskTurnActive),
  }, now);
  if (state.ended) return null;
  const request = nextRequest({
    jobId: input.jobId,
    graph: input.graph,
    reason: requestReasonFromPerturbation(input.perturbation),
    objective: input.objective,
    perturbationRefs: [input.perturbation.perturbationId],
    now,
    userTyping: input.userTyping,
    manualAskTurnActive: input.manualAskTurnActive,
  });
  return enqueueStagePlayCheckpointRequest({ request, now });
}

export function enqueueManualStagePlayCheckpointRequest(input: {
  jobId: string;
  graph: StagePlayBadgeGraphV1;
  objective?: string | null;
  userPromptRef?: string | null;
  now?: string | Date | null;
}): StagePlayCheckpointRequestV1 {
  const now = nowIso(input.now);
  const request = nextRequest({
    jobId: input.jobId,
    graph: input.graph,
    reason: "user_requested_checkpoint",
    objective: input.objective,
    userPromptRef: input.userPromptRef,
    perturbationRefs: [],
    now,
  });
  return enqueueStagePlayCheckpointRequest({ request, now });
}

export function enqueueStagePlayCheckpointRequestFromGraph(input: {
  jobId: string;
  graph: StagePlayBadgeGraphV1;
  objective?: string | null;
  userPromptRef?: string | null;
  reason?: StagePlayCheckpointRequestReasonV1;
  perturbationRefs?: string[];
  now?: string | Date | null;
  userTyping?: boolean;
  manualAskTurnActive?: boolean;
}): StagePlayCheckpointRequestV1 {
  const now = nowIso(input.now);
  setJobState(input.jobId, {
    userTyping: Boolean(input.userTyping),
    manualAskTurnActive: Boolean(input.manualAskTurnActive),
  }, now);
  const request = nextRequest({
    jobId: input.jobId,
    graph: input.graph,
    reason: input.reason ?? "user_requested_checkpoint",
    objective: input.objective,
    userPromptRef: input.userPromptRef,
    perturbationRefs: input.perturbationRefs ?? [],
    now,
    userTyping: input.userTyping,
    manualAskTurnActive: input.manualAskTurnActive,
  });
  return enqueueStagePlayCheckpointRequest({ request, now });
}

export function listStagePlayCheckpointRequests(input: {
  jobId?: string | null;
  graphId?: string | null;
  statuses?: StagePlayCheckpointRequestStatusV1[];
  limit?: number;
} = {}): StagePlayCheckpointRequestV1[] {
  const limit = clampLimit(input.limit, 10);
  const entries = input.jobId
    ? queueEntriesForJob(input.jobId)
    : Array.from(requestsByJob.values()).flat();
  return sortEntries(entries)
    .map((entry) => entry.request)
    .filter((request) => !input.graphId || request.graphId === input.graphId)
    .filter((request) => !input.statuses || input.statuses.includes(request.status))
    .slice(0, limit);
}

export function getStagePlayCheckpointQueue(input: {
  jobId?: string | null;
  graphId?: string | null;
  limit?: number;
} = {}): StagePlayCheckpointQueueListV1 {
  const jobState = input.jobId ? jobStateById.get(input.jobId) ?? null : null;
  return {
    schema: "stage_play_checkpoint_queue/v1",
    jobId: input.jobId ?? null,
    requests: listStagePlayCheckpointRequests(input),
    jobState,
    assistant_answer: false,
    context_role: "tool_evidence",
  };
}

export function getLatestStagePlayCheckpointRequest(input: {
  jobId?: string | null;
  graphId?: string | null;
} = {}): StagePlayCheckpointRequestV1 | null {
  return listStagePlayCheckpointRequests({ ...input, limit: 1 })[0] ?? null;
}

const updateRequestStatus = (
  request: StagePlayCheckpointRequestV1,
  status: StagePlayCheckpointRequestStatusV1,
): StagePlayCheckpointRequestV1 => ({
  ...request,
  status,
});

export function applyStagePlayCheckpointQueueAction(input: {
  jobId: string;
  action: StagePlayCheckpointQueueAction;
  checkpointRequestId?: string | null;
  now?: string | Date | null;
}): StagePlayCheckpointQueueActionResult {
  const now = nowIso(input.now);
  const entries = queueEntriesForJob(input.jobId);
  const state = getOrCreateJobState(input.jobId, now);

  if (input.action === "pause_job") {
    setJobState(input.jobId, { paused: true }, now);
    return queueActionResult(input, null, "paused");
  }
  if (input.action === "resume_job") {
    setJobState(input.jobId, { paused: false, ended: false }, now);
    return queueActionResult(input, null, "resumed");
  }
  if (input.action === "clear_queued") {
    writeEntriesForJob(input.jobId, entries.map((entry) =>
      entry.request.status === "queued"
        ? { ...entry, updatedAt: now, request: updateRequestStatus(entry.request, "skipped") }
        : entry
    ));
    return queueActionResult(input, null, "cleared");
  }
  if (input.action === "end_live_job") {
    setJobState(input.jobId, { ended: true, paused: true }, now);
    writeEntriesForJob(input.jobId, entries.map((entry) =>
      entry.request.status === "queued" || entry.request.status === "running"
        ? { ...entry, updatedAt: now, request: updateRequestStatus(entry.request, "superseded") }
        : entry
    ));
    return queueActionResult(input, null, "ended");
  }

  const target = input.checkpointRequestId
    ? entries.find((entry) => entry.request.checkpointRequestId === input.checkpointRequestId)
    : sortEntries(entries).find((entry) =>
        input.action === "run" ? entry.request.status === "queued" : activeRequests([entry]).length > 0
      );
  if (!target) return queueActionResult(input, null, "no_request");
  if (state.ended && input.action === "run") return queueActionResult(input, target.request, "job_ended");
  if (state.paused && input.action === "run") return queueActionResult(input, target.request, "job_paused");
  if (
    input.action === "run" &&
    entries.some((entry) => entry.request.status === "running" && entry.request.checkpointRequestId !== target.request.checkpointRequestId)
  ) {
    return queueActionResult(input, target.request, "running_request_exists");
  }

  const statusByAction: Partial<Record<StagePlayCheckpointQueueAction, StagePlayCheckpointRequestStatusV1>> = {
    run: "running",
    complete: "completed",
    skip: "skipped",
    block: "blocked",
    supersede: "superseded",
  };
  const nextStatus = statusByAction[input.action];
  if (!nextStatus) return queueActionResult(input, target.request, "no_request");
  writeEntriesForJob(input.jobId, entries.map((entry) =>
    entry.request.checkpointRequestId === target.request.checkpointRequestId
      ? { ...entry, updatedAt: now, request: updateRequestStatus(entry.request, nextStatus) }
      : entry
  ));
  if (nextStatus === "completed") {
    setJobState(input.jobId, { lastCheckpointAt: now }, now);
  }
  return queueActionResult(input, updateRequestStatus(target.request, nextStatus), "updated");
}

function queueActionResult(
  input: {
    jobId: string;
    action: StagePlayCheckpointQueueAction;
  },
  request: StagePlayCheckpointRequestV1 | null,
  reason: StagePlayCheckpointQueueActionResult["reason"],
): StagePlayCheckpointQueueActionResult {
  return {
    ok: !["no_request", "job_paused", "job_ended", "running_request_exists"].includes(reason),
    schema: "stage_play_checkpoint_queue_action_response/v1",
    action: input.action,
    request,
    queue: getStagePlayCheckpointQueue({ jobId: input.jobId, limit: 10 }),
    reason,
    assistant_answer: false,
    context_role: "tool_evidence",
  };
}

export function resetStagePlayCheckpointQueueForTest(): void {
  requestsByJob.clear();
  jobStateById.clear();
}
