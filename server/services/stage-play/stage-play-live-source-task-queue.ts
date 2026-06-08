import crypto from "node:crypto";
import type { AskTurnTranscriptRowDraftV1 } from "@shared/contracts/stage-play-live-source-mail.v1";
import {
  STAGE_PLAY_LIVE_SOURCE_TASK_QUEUE_SNAPSHOT_SCHEMA,
  STAGE_PLAY_LIVE_SOURCE_TASK_SCHEMA,
  type StagePlayLiveSourceTaskKindV1,
  type StagePlayLiveSourceTaskPriorityV1,
  type StagePlayLiveSourceTaskQueueSnapshotV1,
  type StagePlayLiveSourceTaskStatusV1,
  type StagePlayLiveSourceTaskV1,
} from "@shared/contracts/stage-play-live-source-task.v1";

const taskById = new Map<string, StagePlayLiveSourceTaskV1>();
const MAX_TASKS_PER_THREAD = 250;

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const priorityRank = (priority: StagePlayLiveSourceTaskPriorityV1): number => {
  switch (priority) {
    case "urgent":
      return 400;
    case "high":
      return 300;
    case "normal":
      return 200;
    case "background":
      return 100;
  }
};

const kindRank = (kind: StagePlayLiveSourceTaskKindV1): number => {
  switch (kind) {
    case "voice_callout_candidate":
      return 90;
    case "user_prompt_response":
      return 80;
    case "prediction_error_review":
      return 70;
    case "immediate_prediction_check":
      return 60;
    case "mail_batch_interpretation":
      return 50;
    case "long_horizon_projection":
      return 30;
    case "memory_consolidation":
      return 10;
  }
};

const defaultPriorityForKind = (kind: StagePlayLiveSourceTaskKindV1): StagePlayLiveSourceTaskPriorityV1 => {
  switch (kind) {
    case "voice_callout_candidate":
      return "urgent";
    case "user_prompt_response":
    case "prediction_error_review":
      return "high";
    case "immediate_prediction_check":
    case "mail_batch_interpretation":
      return "normal";
    case "long_horizon_projection":
    case "memory_consolidation":
      return "background";
  }
};

const taskScopeMatches = (task: StagePlayLiveSourceTaskV1, input: {
  threadId?: string | null;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
  status?: StagePlayLiveSourceTaskStatusV1 | null;
}): boolean => {
  if (input.threadId && task.threadId !== input.threadId) return false;
  if (input.roomId && task.roomId !== input.roomId) return false;
  if (input.environmentId && task.environmentId !== input.environmentId) return false;
  if (input.jobId && task.jobId !== input.jobId) return false;
  if (input.status && task.status !== input.status) return false;
  return true;
};

const sortRunnableTasks = (tasks: StagePlayLiveSourceTaskV1[]): StagePlayLiveSourceTaskV1[] =>
  [...tasks].sort((left, right) => (
    priorityRank(right.priority) - priorityRank(left.priority) ||
    kindRank(right.taskKind) - kindRank(left.taskKind) ||
    (left.deadlineHintMs ?? Number.MAX_SAFE_INTEGER) - (right.deadlineHintMs ?? Number.MAX_SAFE_INTEGER) ||
    left.createdAt.localeCompare(right.createdAt) ||
    left.taskId.localeCompare(right.taskId)
  ));

const updateTask = (
  taskId: string,
  patch: Partial<Pick<StagePlayLiveSourceTaskV1, "status" | "statusReason" | "softInterruptRecommended" | "activeTaskRef" | "updatedAt">>,
): StagePlayLiveSourceTaskV1 | null => {
  const current = taskById.get(taskId);
  if (!current) return null;
  const updated: StagePlayLiveSourceTaskV1 = {
    ...current,
    ...patch,
    updatedAt: patch.updatedAt ?? new Date().toISOString(),
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
    raw_content_included: false,
  };
  taskById.set(updated.taskId, updated);
  return updated;
};

const trimThreadTasks = (threadId: string): void => {
  const tasks = Array.from(taskById.values())
    .filter((task) => task.threadId === threadId)
    .sort((left, right) => left.updatedAt.localeCompare(right.updatedAt));
  if (tasks.length <= MAX_TASKS_PER_THREAD) return;
  const removable = tasks.filter((task) => (
    task.status === "completed" ||
    task.status === "superseded" ||
    task.status === "blocked"
  ));
  for (const task of removable.slice(0, Math.max(0, tasks.length - MAX_TASKS_PER_THREAD))) {
    taskById.delete(task.taskId);
  }
};

export function enqueueStagePlayLiveSourceTask(input: {
  threadId: string;
  taskKind: StagePlayLiveSourceTaskKindV1;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
  policyId?: string | null;
  sourceIds?: string[];
  mailIds?: string[];
  narrativeStateRef?: string | null;
  priority?: StagePlayLiveSourceTaskPriorityV1 | null;
  deadlineHintMs?: number | null;
  supersedesTaskRefs?: string[];
  evidenceRefs?: string[];
  now?: string;
}): StagePlayLiveSourceTaskV1 {
  const now = input.now ?? new Date().toISOString();
  const supersedesTaskRefs = uniqueStrings(input.supersedesTaskRefs ?? []);
  for (const taskId of supersedesTaskRefs) {
    const existing = taskById.get(taskId);
    if (existing && existing.status !== "running" && existing.status !== "completed") {
      updateTask(taskId, {
        status: "superseded",
        statusReason: `Superseded by queued task ${input.taskKind}.`,
        updatedAt: now,
      });
    }
  }
  const task: StagePlayLiveSourceTaskV1 = {
    artifactId: "stage_play_live_source_task",
    schemaVersion: STAGE_PLAY_LIVE_SOURCE_TASK_SCHEMA,
    taskId: `stage_play_live_source_task:${hashShort([
      input.threadId,
      input.taskKind,
      input.jobId ?? null,
      input.policyId ?? null,
      input.sourceIds ?? [],
      input.mailIds ?? [],
      input.narrativeStateRef ?? null,
      now,
    ])}`,
    taskKind: input.taskKind,
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    jobId: input.jobId ?? null,
    policyId: input.policyId ?? null,
    sourceIds: uniqueStrings(input.sourceIds ?? []),
    mailIds: uniqueStrings(input.mailIds ?? []),
    narrativeStateRef: input.narrativeStateRef ?? null,
    priority: input.priority ?? defaultPriorityForKind(input.taskKind),
    deadlineHintMs: input.deadlineHintMs ?? null,
    supersedesTaskRefs,
    status: "queued",
    statusReason: "queued_for_one_agent_scheduler",
    softInterruptRecommended: false,
    activeTaskRef: null,
    evidenceRefs: uniqueStrings([
      ...(input.evidenceRefs ?? []),
      ...(input.mailIds ?? []),
      input.narrativeStateRef,
      input.jobId,
      input.policyId,
    ]),
    createdAt: now,
    updatedAt: now,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
    raw_content_included: false,
  };
  taskById.set(task.taskId, task);
  trimThreadTasks(task.threadId);
  return task;
}

export function listStagePlayLiveSourceTasks(input: {
  threadId?: string | null;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
  status?: StagePlayLiveSourceTaskStatusV1 | null;
  limit?: number;
} = {}): StagePlayLiveSourceTaskV1[] {
  const limit = Math.max(1, Math.min(input.limit ?? 100, 250));
  return sortRunnableTasks(Array.from(taskById.values()).filter((task) => taskScopeMatches(task, input))).slice(0, limit);
}

export function getStagePlayLiveSourceTask(taskId: string): StagePlayLiveSourceTaskV1 | null {
  return taskById.get(taskId) ?? null;
}

export function claimNextStagePlayLiveSourceTask(input: {
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
  now?: string;
}): StagePlayLiveSourceTaskV1 | null {
  const running = listStagePlayLiveSourceTasks({
    ...input,
    status: "running",
    limit: 1,
  })[0] ?? null;
  if (running) return null;
  const next = listStagePlayLiveSourceTasks({
    ...input,
    status: "queued",
    limit: 1,
  })[0] ?? null;
  if (!next) return null;
  return updateTask(next.taskId, {
    status: "running",
    statusReason: "claimed_by_one_agent_scheduler",
    updatedAt: input.now ?? new Date().toISOString(),
  });
}

export function deferStagePlayLiveSourceTask(input: {
  taskId: string;
  reason?: string | null;
  activeTaskRef?: string | null;
  now?: string;
}): StagePlayLiveSourceTaskV1 | null {
  return updateTask(input.taskId, {
    status: "deferred",
    statusReason: input.reason ?? "deferred_until_safe_boundary",
    activeTaskRef: input.activeTaskRef ?? null,
    updatedAt: input.now ?? new Date().toISOString(),
  });
}

export function completeStagePlayLiveSourceTask(input: {
  taskId: string;
  reason?: string | null;
  now?: string;
}): StagePlayLiveSourceTaskV1 | null {
  return updateTask(input.taskId, {
    status: "completed",
    statusReason: input.reason ?? "completed",
    softInterruptRecommended: false,
    activeTaskRef: null,
    updatedAt: input.now ?? new Date().toISOString(),
  });
}

export function blockStagePlayLiveSourceTask(input: {
  taskId: string;
  reason: string;
  now?: string;
}): StagePlayLiveSourceTaskV1 | null {
  return updateTask(input.taskId, {
    status: "blocked",
    statusReason: input.reason,
    softInterruptRecommended: false,
    updatedAt: input.now ?? new Date().toISOString(),
  });
}

export function getStagePlayLiveSourceTaskQueueSnapshot(input: {
  threadId?: string | null;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
  limit?: number;
  now?: string;
} = {}): StagePlayLiveSourceTaskQueueSnapshotV1 {
  const runningTask = listStagePlayLiveSourceTasks({ ...input, status: "running", limit: 1 })[0] ?? null;
  const queuedTasks = listStagePlayLiveSourceTasks({ ...input, status: "queued", limit: input.limit ?? 20 });
  const deferredTasks = listStagePlayLiveSourceTasks({ ...input, status: "deferred", limit: input.limit ?? 20 });
  const blockedTasks = listStagePlayLiveSourceTasks({ ...input, status: "blocked", limit: input.limit ?? 20 });
  const urgentQueued = queuedTasks.find((task) => task.priority === "urgent") ?? null;
  const softInterruptRecommended = Boolean(
    runningTask &&
    urgentQueued &&
    priorityRank(urgentQueued.priority) > priorityRank(runningTask.priority) &&
    (runningTask.taskKind === "long_horizon_projection" || runningTask.taskKind === "memory_consolidation"),
  );
  const evidenceRefs = uniqueStrings([
    runningTask?.taskId,
    ...queuedTasks.map((task) => task.taskId),
    ...deferredTasks.map((task) => task.taskId),
    ...blockedTasks.map((task) => task.taskId),
  ]);
  return {
    artifactId: "stage_play_live_source_task_queue_snapshot",
    schemaVersion: STAGE_PLAY_LIVE_SOURCE_TASK_QUEUE_SNAPSHOT_SCHEMA,
    threadId: input.threadId ?? null,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    runningTask,
    queuedTasks,
    deferredTasks,
    blockedTasks,
    completedTaskRefs: listStagePlayLiveSourceTasks({ ...input, status: "completed", limit: input.limit ?? 20 }).map((task) => task.taskId),
    softInterruptRecommended,
    softInterruptReason: softInterruptRecommended
      ? "Urgent task should be admitted at the next safe boundary; no hard interrupt is requested."
      : null,
    evidenceRefs,
    createdAt: input.now ?? new Date().toISOString(),
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
    raw_content_included: false,
  };
}

export function buildStagePlayLiveSourceTaskTranscriptRows(input: {
  tasks: StagePlayLiveSourceTaskV1[];
  createdAt?: string;
}): AskTurnTranscriptRowDraftV1[] {
  const createdAt = input.createdAt ?? new Date().toISOString();
  return input.tasks.map((task): AskTurnTranscriptRowDraftV1 => {
    const rowKind: AskTurnTranscriptRowDraftV1["rowKind"] =
      task.status === "deferred"
        ? "task_deferred"
        : task.status === "running"
          ? task.taskKind === "immediate_prediction_check" || task.taskKind === "prediction_error_review"
            ? "prediction_check"
            : task.taskKind === "long_horizon_projection"
              ? "narrative_projection"
              : "task_running"
          : task.status === "completed"
            ? "task_completed"
            : "task_queued";
    const title =
      rowKind === "task_deferred"
        ? "Task deferred"
        : rowKind === "prediction_check"
          ? "Prediction check"
          : rowKind === "narrative_projection"
            ? "Narrative projection"
            : rowKind === "task_completed"
              ? "Task completed"
              : rowKind === "task_running"
                ? "Task running"
                : "Task queued";
    return {
      rowId: `live_source_task:${hashShort([task.taskId, task.status, task.updatedAt])}`,
      rowKind,
      title,
      body: `${task.taskKind} (${task.priority}) - ${task.statusReason ?? task.status}`,
      source: {
        artifactId: task.taskId,
        artifactKind: STAGE_PLAY_LIVE_SOURCE_TASK_SCHEMA,
      },
      evidenceRefs: task.evidenceRefs,
      authority: "tool_evidence",
      assistantAnswer: false,
      terminalEligible: false,
      createdAt,
    };
  });
}

export function resetStagePlayLiveSourceTaskQueueForTest(): void {
  taskById.clear();
}
