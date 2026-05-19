import crypto from "node:crypto";
import type { LiveAnswerEnvironment } from "@shared/helix-live-answer-environment";
import {
  HELIX_LIVE_WORKER_LANE_SCHEMA,
  type HelixLiveWorkerLane,
  type HelixLiveWorkerLaneKey,
  type HelixLiveWorkerTriggerPolicy,
} from "@shared/helix-live-worker-lane";
import {
  HELIX_LIVE_WORKER_RUN_SCHEMA,
  type HelixLiveWorkerRun,
} from "@shared/helix-live-worker-run";

const lanesById = new Map<string, HelixLiveWorkerLane>();
const runsByThread = new Map<string, HelixLiveWorkerRun[]>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const nowIso = (): string => new Date().toISOString();

const lineLaneKey = (lineKey: string): HelixLiveWorkerLaneKey => {
  if (lineKey === "place" || lineKey === "scene") return "line_place";
  if (lineKey === "activity") return "line_activity";
  if (lineKey === "structure" || lineKey === "evidence") return "line_structure";
  if (lineKey === "entities" || lineKey === "objects") return "line_entities";
  if (lineKey === "risk") return "line_risk";
  if (lineKey === "missing_evidence" || lineKey === "uncertainty") return "line_missing_evidence";
  if (lineKey === "next_check" || lineKey === "last_update") return "line_next_check";
  return "custom_line";
};

const allowedToolsForLane = (laneKey: HelixLiveWorkerLaneKey): string[] => {
  if (laneKey === "visual_analysis") return [
    "visual-provider.health",
    "visual-frame.latest",
    "visual-frame.analyze",
    "visual.align_latest_with_event_window",
    "situation-room.present_state_synthesis",
  ];
  if (laneKey === "source_health") return [
    "situation-room.source_capabilities",
    "situation-room.live_environment_fidelity",
    "situation-room.present_state_synthesis",
  ];
  if (laneKey === "present_state_synthesis") return ["situation-room.present_state_synthesis"];
  if (laneKey === "line_risk") return ["minecraft.query_event_window"];
  if (laneKey === "line_place" || laneKey === "line_activity" || laneKey === "line_structure") {
    return ["visual.align_latest_with_event_window", "minecraft.query_event_window"];
  }
  if (laneKey === "line_entities") return ["minecraft.query_world_sense_window", "minecraft.lookup_semantics"];
  if (laneKey === "line_missing_evidence") return ["situation-room.run_agentic_review"];
  if (laneKey === "line_next_check") return ["situation-room.run_agentic_review", "minecraft.query_event_window"];
  return ["situation-room.run_agentic_review"];
};

const triggerForLane = (laneKey: HelixLiveWorkerLaneKey): HelixLiveWorkerTriggerPolicy => {
  if (laneKey === "visual_analysis") return "on_stale";
  if (laneKey === "source_health") return "on_stale";
  if (laneKey.startsWith("line_")) return "on_missing_evidence";
  return "interval";
};

export function upsertLiveWorkerLane(input: {
  threadId: string;
  environmentId: string;
  sourceIds?: string[];
  laneKey: HelixLiveWorkerLaneKey;
  objective: string;
  allowedTools?: string[];
  triggerPolicy?: HelixLiveWorkerTriggerPolicy;
  cadenceMs?: number | null;
  status?: HelixLiveWorkerLane["status"];
  now?: string;
}): HelixLiveWorkerLane {
  const workerId = `live_worker:${hashShort([input.threadId, input.environmentId, input.laneKey, input.objective])}`;
  const existing = lanesById.get(workerId);
  const lane: HelixLiveWorkerLane = {
    schema: HELIX_LIVE_WORKER_LANE_SCHEMA,
    worker_id: workerId,
    thread_id: input.threadId,
    environment_id: input.environmentId,
    source_ids: input.sourceIds ?? existing?.source_ids ?? [],
    lane_key: input.laneKey,
    objective: input.objective,
    allowed_tools: input.allowedTools ?? allowedToolsForLane(input.laneKey),
    cadence_ms: input.cadenceMs ?? existing?.cadence_ms ?? 15_000,
    trigger_policy: input.triggerPolicy ?? existing?.trigger_policy ?? triggerForLane(input.laneKey),
    status: input.status ?? existing?.status ?? "active",
    latest_run_id: existing?.latest_run_id ?? null,
    next_run_at: existing?.next_run_at ?? input.now ?? nowIso(),
    assistant_answer: false,
    raw_content_included: false,
  };
  lanesById.set(lane.worker_id, lane);
  return lane;
}

export function ensureDefaultLiveWorkerLanes(environment: LiveAnswerEnvironment): HelixLiveWorkerLane[] {
  const lanes: HelixLiveWorkerLane[] = [
    upsertLiveWorkerLane({
      threadId: environment.thread_id,
      environmentId: environment.environment_id,
      sourceIds: environment.source_ids,
      laneKey: "visual_analysis",
      objective: "Keep visual frames analyzed as compact evidence.",
    }),
    upsertLiveWorkerLane({
      threadId: environment.thread_id,
      environmentId: environment.environment_id,
      sourceIds: environment.source_ids,
      laneKey: "source_health",
      objective: "Track source health and fidelity without failing partial-source sessions.",
    }),
    upsertLiveWorkerLane({
      threadId: environment.thread_id,
      environmentId: environment.environment_id,
      sourceIds: environment.source_ids,
      laneKey: "present_state_synthesis",
      objective: "Refresh present-state projection from compact evidence.",
      triggerPolicy: "interval",
    }),
  ];
  for (const line of environment.lines.filter((entry) => entry.visibility === "answer_card")) {
    const laneKey = lineLaneKey(line.key);
    lanes.push(upsertLiveWorkerLane({
      threadId: environment.thread_id,
      environmentId: environment.environment_id,
      sourceIds: environment.source_ids,
      laneKey,
      objective: `Maintain live-card line: ${line.label}.`,
    }));
  }
  return lanes;
}

export function updateLiveWorkerLane(lane: HelixLiveWorkerLane): HelixLiveWorkerLane {
  lanesById.set(lane.worker_id, lane);
  return lane;
}

export function getLiveWorkerLane(workerId: string): HelixLiveWorkerLane | null {
  return lanesById.get(workerId) ?? null;
}

export function listLiveWorkerLanes(input: {
  threadId?: string | null;
  environmentId?: string | null;
  status?: HelixLiveWorkerLane["status"] | "any";
} = {}): HelixLiveWorkerLane[] {
  return Array.from(lanesById.values()).filter((lane) => {
    if (input.threadId && lane.thread_id !== input.threadId) return false;
    if (input.environmentId && lane.environment_id !== input.environmentId) return false;
    if (input.status && input.status !== "any" && lane.status !== input.status) return false;
    return true;
  });
}

export function startLiveWorkerRun(input: {
  lane: HelixLiveWorkerLane;
  triggerReason: string;
  now?: string;
}): HelixLiveWorkerRun {
  const now = input.now ?? nowIso();
  const run: HelixLiveWorkerRun = {
    schema: HELIX_LIVE_WORKER_RUN_SCHEMA,
    run_id: `live_worker_run:${hashShort([input.lane.worker_id, input.triggerReason, now])}`,
    worker_id: input.lane.worker_id,
    thread_id: input.lane.thread_id,
    environment_id: input.lane.environment_id,
    started_at: now,
    completed_at: null,
    status: "started",
    trigger_reason: input.triggerReason,
    tool_calls: [],
    observations: [],
    validations: [],
    updated_line_keys: [],
    summary: "Worker run started.",
    assistant_answer: false,
    raw_content_included: false,
  };
  runsByThread.set(run.thread_id, [...(runsByThread.get(run.thread_id) ?? []), run].slice(-500));
  updateLiveWorkerLane({
    ...input.lane,
    latest_run_id: run.run_id,
    next_run_at: new Date(Date.parse(now) + (input.lane.cadence_ms ?? 15_000)).toISOString(),
  });
  return run;
}

export function completeLiveWorkerRun(input: {
  run: HelixLiveWorkerRun;
  status: HelixLiveWorkerRun["status"];
  summary: string;
  toolCalls?: HelixLiveWorkerRun["tool_calls"];
  requestedRuntimeItems?: HelixLiveWorkerRun["requested_runtime_items"];
  maintenanceReceiptRefs?: string[];
  observations?: string[];
  validations?: string[];
  updatedLineKeys?: string[];
  now?: string;
}): HelixLiveWorkerRun {
  const completed: HelixLiveWorkerRun = {
    ...input.run,
    status: input.status,
    completed_at: input.now ?? nowIso(),
    summary: input.summary,
    tool_calls: input.toolCalls ?? input.run.tool_calls,
    requested_runtime_items: input.requestedRuntimeItems ?? input.run.requested_runtime_items,
    maintenance_receipt_refs: input.maintenanceReceiptRefs ?? input.run.maintenance_receipt_refs,
    observations: input.observations ?? input.run.observations,
    validations: input.validations ?? input.run.validations,
    updated_line_keys: input.updatedLineKeys ?? input.run.updated_line_keys,
  };
  const existing = runsByThread.get(completed.thread_id) ?? [];
  runsByThread.set(completed.thread_id, existing.map((entry) => entry.run_id === completed.run_id ? completed : entry).slice(-500));
  const lane = lanesById.get(completed.worker_id);
  if (lane) {
    const completedAt = completed.completed_at ?? nowIso();
    const backoffMs = completed.status === "suppressed" || completed.status === "failed"
      ? Math.max(60_000, lane.cadence_ms ?? 15_000)
      : lane.cadence_ms ?? 15_000;
    lanesById.set(lane.worker_id, {
      ...lane,
      latest_run_id: completed.run_id,
      next_run_at: new Date(Date.parse(completedAt) + backoffMs).toISOString(),
    });
  }
  return completed;
}

export function listLiveWorkerRuns(input: {
  threadId?: string | null;
  environmentId?: string | null;
  workerId?: string | null;
  limit?: number;
} = {}): HelixLiveWorkerRun[] {
  const entries = input.threadId
    ? [...(runsByThread.get(input.threadId) ?? [])]
    : Array.from(runsByThread.values()).flat();
  return entries
    .filter((run) => !input.environmentId || run.environment_id === input.environmentId)
    .filter((run) => !input.workerId || run.worker_id === input.workerId)
    .slice(-(input.limit ?? 200));
}

export function resetLiveWorkerLanesForTest(): void {
  lanesById.clear();
  runsByThread.clear();
}
