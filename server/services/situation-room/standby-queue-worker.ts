import type { StandbyQueueItem } from "@shared/helix-standby-queue";
import {
  completeStandbyQueueItem,
  listStandbyQueueItems,
  startStandbyQueueItem,
} from "./standby-queue";

export function processStandbyQueueOnce(roomId?: string | null): StandbyQueueItem | null {
  const next = listStandbyQueueItems(roomId).find(
    (item: StandbyQueueItem) => item.status === "queued",
  );
  if (!next) return null;
  startStandbyQueueItem(next.queue_item_id, next.created_at);
  return completeStandbyQueueItem(next.queue_item_id, next.result_ref ?? null, next.created_at);
}
