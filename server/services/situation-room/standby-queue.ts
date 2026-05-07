import crypto from "node:crypto";
import {
  HELIX_STANDBY_QUEUE_ITEM_SCHEMA,
  type StandbyQueueItem,
  type StandbyQueuePriority,
  type StandbyQueueTaskKind,
} from "@shared/helix-standby-queue";

const priorityRank: Record<StandbyQueuePriority, number> = {
  user_direct: 0,
  critical_salience: 1,
  standby_salience: 2,
  standby_interpretation: 3,
  maintenance: 4,
};

const hashShort = (value: unknown, size = 12): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const queueItems = new Map<string, StandbyQueueItem>();

const maxPerRoom = (): number => {
  const parsed = Number(process.env.HELIX_STANDBY_MAX_QUEUE_PER_ROOM);
  return Number.isFinite(parsed) ? Math.max(1, Math.floor(parsed)) : 256;
};

export function enqueueStandbyQueueItem(input: {
  room_id: string;
  graph_id?: string | null;
  priority: StandbyQueuePriority;
  task_kind: StandbyQueueTaskKind;
  input_refs: string[];
  created_at?: string;
}): StandbyQueueItem {
  const createdAt = input.created_at ?? new Date().toISOString();
  const item: StandbyQueueItem = {
    schema: HELIX_STANDBY_QUEUE_ITEM_SCHEMA,
    queue_item_id: `standby-queue:${input.room_id}:${hashShort([
      input.priority,
      input.task_kind,
      input.input_refs,
      createdAt,
    ], 14)}`,
    room_id: input.room_id,
    graph_id: input.graph_id ?? null,
    priority: input.priority,
    task_kind: input.task_kind,
    input_refs: input.input_refs,
    status: "queued",
    created_at: createdAt,
    started_at: null,
    completed_at: null,
    result_ref: null,
  };
  queueItems.set(item.queue_item_id, item);
  const roomItems = listStandbyQueueItems(input.room_id);
  if (roomItems.length > maxPerRoom()) {
    const removable = roomItems
      .filter((entry: StandbyQueueItem) => entry.status === "completed" || entry.status === "failed")
      .slice(0, roomItems.length - maxPerRoom());
    for (const entry of removable) queueItems.delete(entry.queue_item_id);
  }
  return item;
}

export function startStandbyQueueItem(queueItemId: string, ts = new Date().toISOString()): StandbyQueueItem | null {
  const item = queueItems.get(queueItemId);
  if (!item) return null;
  const next: StandbyQueueItem = { ...item, status: "running", started_at: ts };
  queueItems.set(queueItemId, next);
  return next;
}

export function completeStandbyQueueItem(
  queueItemId: string,
  resultRef?: string | null,
  ts = new Date().toISOString(),
): StandbyQueueItem | null {
  const item = queueItems.get(queueItemId);
  if (!item) return null;
  const next: StandbyQueueItem = {
    ...item,
    status: "completed",
    started_at: item.started_at ?? ts,
    completed_at: ts,
    result_ref: resultRef ?? item.result_ref ?? null,
  };
  queueItems.set(queueItemId, next);
  return next;
}

export function failStandbyQueueItem(
  queueItemId: string,
  resultRef?: string | null,
  ts = new Date().toISOString(),
): StandbyQueueItem | null {
  const item = queueItems.get(queueItemId);
  if (!item) return null;
  const next: StandbyQueueItem = {
    ...item,
    status: "failed",
    started_at: item.started_at ?? ts,
    completed_at: ts,
    result_ref: resultRef ?? item.result_ref ?? null,
  };
  queueItems.set(queueItemId, next);
  return next;
}

export function listStandbyQueueItems(roomId?: string | null): StandbyQueueItem[] {
  return Array.from(queueItems.values())
    .filter((item: StandbyQueueItem) => !roomId || item.room_id === roomId)
    .sort((a: StandbyQueueItem, b: StandbyQueueItem) => {
      const rank = priorityRank[a.priority] - priorityRank[b.priority];
      if (rank !== 0) return rank;
      return a.created_at.localeCompare(b.created_at) || a.queue_item_id.localeCompare(b.queue_item_id);
    });
}

export function resetStandbyQueue(): void {
  queueItems.clear();
}
