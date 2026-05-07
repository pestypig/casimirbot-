import crypto from "node:crypto";
import {
  HELIX_STANDBY_WORK_ITEM_SCHEMA,
  type StandbyWorkItem,
  type StandbyWorkKind,
  type StandbyWorkPriority,
  type StandbyQueueMetrics,
} from "@shared/helix-standby-queue";

const priorityOrder: Record<StandbyWorkPriority, number> = {
  user_direct: 0,
  critical_salience: 1,
  standby_callout_delivery: 2,
  standby_salience: 3,
  standby_interpretation: 4,
  maintenance: 5,
};

const workItems = new Map<string, StandbyWorkItem>();
let lastPreemptedWorkId: string | undefined;

const hashShort = (value: unknown, size = 12): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

export function enqueueStandbyWorkItem(input: {
  priority: StandbyWorkPriority;
  kind: StandbyWorkKind;
  room_id: string;
  graph_id?: string | null;
  thread_id?: string | null;
  episode_id?: string | null;
  salience_receipt_id?: string | null;
  evidence_refs?: string[];
  payload?: Record<string, unknown>;
  now?: string;
}): StandbyWorkItem {
  const now = input.now ?? new Date().toISOString();
  const workId = `standby_work:${hashShort([
    input.priority,
    input.kind,
    input.room_id,
    input.episode_id ?? null,
    input.salience_receipt_id ?? null,
    input.evidence_refs ?? [],
    now,
  ], 16)}`;
  const item: StandbyWorkItem = {
    schema: HELIX_STANDBY_WORK_ITEM_SCHEMA,
    work_id: workId,
    priority: input.priority,
    kind: input.kind,
    room_id: input.room_id,
    graph_id: input.graph_id ?? null,
    thread_id: input.thread_id ?? null,
    episode_id: input.episode_id ?? null,
    salience_receipt_id: input.salience_receipt_id ?? null,
    evidence_refs: Array.from(new Set(input.evidence_refs ?? [])).sort(),
    payload: input.payload ?? {},
    status: "queued",
    created_at: now,
    updated_at: now,
    dropped_reason: null,
  };
  if (input.priority === "user_direct") {
    for (const existing of workItems.values()) {
      if (
        existing.status === "queued" &&
        (existing.priority === "standby_interpretation" || existing.priority === "maintenance")
      ) {
        workItems.set(existing.work_id, {
          ...existing,
          status: "dropped",
          updated_at: now,
          dropped_reason: "preempted_by_user_direct",
        });
        lastPreemptedWorkId = existing.work_id;
      }
    }
  }
  workItems.set(workId, item);
  return item;
}

export function listStandbyWorkItems(filter?: {
  room_id?: string | null;
  status?: StandbyWorkItem["status"] | null;
}): StandbyWorkItem[] {
  return Array.from(workItems.values())
    .filter((item: StandbyWorkItem) => !filter?.room_id || item.room_id === filter.room_id)
    .filter((item: StandbyWorkItem) => !filter?.status || item.status === filter.status)
    .sort(
      (a: StandbyWorkItem, b: StandbyWorkItem) =>
        priorityOrder[a.priority] - priorityOrder[b.priority] ||
        a.created_at.localeCompare(b.created_at) ||
        a.work_id.localeCompare(b.work_id),
    );
}

export function claimNextStandbyWorkItem(now = new Date().toISOString()): StandbyWorkItem | null {
  const next = listStandbyWorkItems({ status: "queued" })[0];
  if (!next) return null;
  const updated: StandbyWorkItem = { ...next, status: "running", updated_at: now };
  workItems.set(updated.work_id, updated);
  return updated;
}

export function completeStandbyWorkItem(
  workId: string,
  status: "completed" | "cancelled" | "failed" | "dropped" = "completed",
  now = new Date().toISOString(),
  droppedReason?: string | null,
): StandbyWorkItem | null {
  const existing = workItems.get(workId);
  if (!existing) return null;
  const updated: StandbyWorkItem = { ...existing, status, updated_at: now, dropped_reason: droppedReason ?? existing.dropped_reason ?? null };
  if (status === "dropped") lastPreemptedWorkId = workId;
  workItems.set(workId, updated);
  return updated;
}

export function getStandbyQueueMetrics(): StandbyQueueMetrics {
  const items = Array.from(workItems.values());
  return {
    pending_count: items.filter((item: StandbyWorkItem) => item.status === "queued").length,
    running_count: items.filter((item: StandbyWorkItem) => item.status === "running").length,
    completed_count: items.filter((item: StandbyWorkItem) => item.status === "completed").length,
    dropped_count: items.filter((item: StandbyWorkItem) => item.status === "dropped").length,
    ...(lastPreemptedWorkId ? { last_preempted_work_id: lastPreemptedWorkId } : {}),
  };
}

export function resetStandbyCognitionQueue(): void {
  workItems.clear();
  lastPreemptedWorkId = undefined;
}
