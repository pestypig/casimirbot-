import crypto from "node:crypto";
import type { HelixSharedRealtimeRoom } from "@shared/helix-shared-realtime-room";
import {
  markSharedRealtimeRoomRuntimeState,
  purgeSharedRealtimeRoomVisualFrames,
  readSharedRealtimeRoomRuntime,
  readSharedRealtimeRoomRuntimeBinding,
  stopSharedRealtimeRoomRuntime,
} from "./runtime-registry";
import {
  buildRealtimeRequesterRef,
  removeAdmittedRealtimeSession,
} from "../realtime-session/session-registry";
import { sendRealtimeSidebandControlEvent } from
  "../realtime-session/sideband-control-channel";

export const degradeSharedRealtimeRoomRuntimeForReadiness = (
  room: HelixSharedRealtimeRoom,
): void => {
  const runtime = readSharedRealtimeRoomRuntime({ roomId: room.room_id });
  if (!runtime?.runtime_id || room.readiness.ready || runtime.state === "closed") return;
  const limitation = room.participants.some((participant) => participant.presence !== "present")
    ? "participant_presence_incomplete"
    : room.readiness.missing_participant_count > 0
      ? "participant_missing"
      : "participant_voice_consent_incomplete";
  markSharedRealtimeRoomRuntimeState({
    roomId: room.room_id,
    runtimeId: runtime.runtime_id,
    state: "degraded",
    limitation,
  });
};

/** @deprecated Use the readiness-oriented name; retained for narrow callers during rollout. */
export const degradeSharedRealtimeRoomRuntimeForConsent =
  degradeSharedRealtimeRoomRuntimeForReadiness;

export const reconcileSharedRealtimeRoomRuntimeAfterLeave = (input: {
  roomId: string;
  memberRole: "owner" | "participant";
  participantId: string;
  requesterSessionId: string;
}): void => {
  const runtime = readSharedRealtimeRoomRuntime({ roomId: input.roomId });
  const purged = purgeSharedRealtimeRoomVisualFrames({
    roomId: input.roomId,
    participantId: input.memberRole === "owner" ? null : input.participantId,
  });
  if (!runtime?.runtime_id) return;
  const binding = readSharedRealtimeRoomRuntimeBinding({
    roomId: input.roomId,
    runtimeId: runtime.runtime_id,
  });
  if (binding?.realtimeSessionId) {
    for (const providerItemId of purged.providerItemIds) {
      sendRealtimeSidebandControlEvent({
        realtimeSessionId: binding.realtimeSessionId,
        event: {
          type: "conversation.item.delete",
          event_id: `room_visual_leave_delete_${crypto.randomUUID()}`,
          item_id: providerItemId,
        },
      });
    }
  }
  if (input.memberRole === "owner") {
    const stopped = stopSharedRealtimeRoomRuntime({
      roomId: input.roomId,
      runtimeId: runtime.runtime_id,
    });
    if (stopped.stopped_binding?.realtimeSessionId) {
      removeAdmittedRealtimeSession({
        realtimeSessionId: stopped.stopped_binding.realtimeSessionId,
        requesterRef:
          stopped.stopped_binding.requesterRef ??
          buildRealtimeRequesterRef(input.requesterSessionId),
      });
    }
    return;
  }
  if (runtime.state !== "closed") {
    markSharedRealtimeRoomRuntimeState({
      roomId: input.roomId,
      runtimeId: runtime.runtime_id,
      state: "degraded",
      limitation: "participant_left_room",
    });
  }
};
