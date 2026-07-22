import type { HelixSharedRealtimeRoomErrorCode } from
  "@shared/helix-shared-realtime-room";
import {
  bindSharedRealtimeRoomTransport,
  markSharedRealtimeRoomTransportActive,
  readSharedRealtimeRoomRuntime,
  stopSharedRealtimeRoomRuntime,
} from "./runtime-registry";
import { SharedRealtimeRoomDomainError } from "./room-store";
import {
  buildRealtimeRequesterRef,
  readAdmittedRealtimeSession,
  updateAdmittedRealtimeSession,
} from "../realtime-session/session-registry";
import { readSafeRealtimeSourceBinding } from
  "../realtime-session/source-binding";
import { requestRealtimeStagePlayContextSync } from
  "../realtime-session/sideband-context-sync";

export type BindSharedRealtimeRoomSessionResult = {
  error: HelixSharedRealtimeRoomErrorCode | null;
};

/**
 * Coordinates the only cross-registry transition needed to attach an admitted
 * owner browser session to a room. Runtime identifiers are claimed atomically
 * by the runtime registry before the generic Realtime session receives room
 * provenance. This service has no answer or sampling authority.
 */
export const bindOwnerRealtimeSessionToSharedRoom = (input: {
  roomId: string;
  runtimeId: string;
  realtimeSessionId: string;
  requesterSessionId: string;
  participantId: string;
}): BindSharedRealtimeRoomSessionResult => {
  const requesterRef = buildRealtimeRequesterRef(input.requesterSessionId);
  const admitted = readAdmittedRealtimeSession({
    realtimeSessionId: input.realtimeSessionId,
    requesterRef,
  });
  if (!admitted?.providerCallId) {
    throw new SharedRealtimeRoomDomainError(
      "shared_realtime_room_realtime_session_invalid",
      409,
      "The current account does not own an active provider-backed GPT Live session.",
    );
  }

  const runtime = readSharedRealtimeRoomRuntime({ roomId: input.roomId });
  if (!runtime?.runtime_id || runtime.runtime_id !== input.runtimeId || runtime.state === "closed") {
    throw new SharedRealtimeRoomDomainError(
      "shared_realtime_room_realtime_session_invalid",
      409,
      "Reserve the room before binding the owner's GPT Live session.",
    );
  }
  if (runtime.model && admitted.model !== runtime.model) {
    throw new SharedRealtimeRoomDomainError(
      "shared_realtime_room_runtime_conflict",
      409,
      "The room reservation model does not match the current GPT Live session.",
    );
  }

  const claimed = bindSharedRealtimeRoomTransport({
    roomId: input.roomId,
    runtimeId: input.runtimeId,
    realtimeSessionId: input.realtimeSessionId,
    providerCallId: admitted.providerCallId,
    requesterRef,
  });
  if (!claimed.ok) return { error: claimed.error };

  const roomThreadId = `helix-ask:room:${input.roomId}`;
  const priorThreadId = admitted.threadId;
  const priorSourceBinding = admitted.sourceBinding;
  const updated = updateAdmittedRealtimeSession({
    realtimeSessionId: input.realtimeSessionId,
    requesterRef,
    patch: {
      threadId: roomThreadId,
      sourceBinding: readSafeRealtimeSourceBinding({
        ...(admitted.sourceBinding ?? {}),
        thread_id: roomThreadId,
        room_id: input.roomId,
        room_runtime_id: input.runtimeId,
        participant_id: input.participantId,
        shared_context_mode: "single_shared_model",
      }),
    },
  });
  if (!updated) {
    stopSharedRealtimeRoomRuntime({
      roomId: input.roomId,
      runtimeId: input.runtimeId,
    });
    return { error: "shared_realtime_room_realtime_session_invalid" };
  }

  const activated = markSharedRealtimeRoomTransportActive({
    roomId: input.roomId,
    runtimeId: input.runtimeId,
    transportOwner: "host_browser",
  });
  if (!activated.ok) {
    updateAdmittedRealtimeSession({
      realtimeSessionId: input.realtimeSessionId,
      requesterRef,
      patch: {
        threadId: priorThreadId,
        sourceBinding: priorSourceBinding,
      },
    });
    stopSharedRealtimeRoomRuntime({
      roomId: input.roomId,
      runtimeId: input.runtimeId,
    });
    return { error: activated.error };
  }

  requestRealtimeStagePlayContextSync({
    realtimeSessionId: input.realtimeSessionId,
    reason: "objective_or_source_change",
  });
  return { error: null };
};
