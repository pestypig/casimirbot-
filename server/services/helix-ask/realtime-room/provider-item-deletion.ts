import crypto from "node:crypto";
import { sendRealtimeSidebandControlEvent } from
  "../realtime-session/sideband-control-channel";
import {
  markSharedRealtimeRoomRuntimeState,
  readSharedRealtimeRoomRuntime,
  readSharedRealtimeRoomRuntimeBinding,
} from "./runtime-registry";

const markDeletionUnconfirmed = (roomId: string, runtimeId: string): void => {
  markSharedRealtimeRoomRuntimeState({
    roomId,
    runtimeId,
    state: "degraded",
    limitation: "provider_visual_delete_unconfirmed",
  });
};

/**
 * Best-effort provider cleanup. If the sideband cannot accept the delete, the
 * room becomes degraded so the host client tears down the provider peer.
 */
export const requestSharedRealtimeRoomProviderItemDeletion = (input: {
  roomId: string;
  providerItemIds: readonly string[];
  reason: "leave" | "consent_revoked" | "retention_limit";
}): boolean => {
  if (input.providerItemIds.length === 0) return true;
  const runtime = readSharedRealtimeRoomRuntime({ roomId: input.roomId });
  if (!runtime?.runtime_id || runtime.state === "closed") return false;
  const binding = readSharedRealtimeRoomRuntimeBinding({
    roomId: input.roomId,
    runtimeId: runtime.runtime_id,
  });
  if (!binding?.realtimeSessionId) return false;

  let allQueued = true;
  for (const providerItemId of new Set(input.providerItemIds)) {
    const sent = sendRealtimeSidebandControlEvent({
      realtimeSessionId: binding.realtimeSessionId,
      event: {
        type: "conversation.item.delete",
        event_id: `room_visual_${input.reason}_delete_${crypto.randomUUID()}`,
        item_id: providerItemId,
      },
      onComplete: (failureCode) => {
        if (failureCode) markDeletionUnconfirmed(input.roomId, runtime.runtime_id!);
      },
    });
    if (!sent) {
      allQueued = false;
      markDeletionUnconfirmed(input.roomId, runtime.runtime_id);
    }
  }
  return allQueued;
};
