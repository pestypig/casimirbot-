import type { HelixSharedRealtimeRoom } from "@shared/helix-shared-realtime-room";
import { readSharedRealtimeRoom } from "./room-store";
import { readSharedRealtimeRoomRuntime } from "./runtime-registry";

const ROOM_THREAD_PREFIX = "helix-ask:room:";

export type HelixRealtimeRoomTurnActorContext = {
  schema: "helix.realtime_room.turn_actor_context.v1";
  origin: "realtime_voice" | "environment_interaction";
  room_id: string;
  requester_profile_id: string;
  realtime_session_id: string;
  participant_id: string | null;
  resolution: "resolved" | "unavailable";
  resolution_source:
    | "active_speaker_floor"
    | "authenticated_realtime_participant"
    | "paired_environment_participant"
    | "speaker_unavailable";
  captured_at_ms: number;
};

export const roomIdFromHelixAskThread = (
  threadId: string | null | undefined,
): string | null => {
  const normalized = threadId?.trim() ?? "";
  if (!normalized.startsWith(ROOM_THREAD_PREFIX)) return null;
  const roomId = normalized.slice(ROOM_THREAD_PREFIX.length).trim();
  return roomId && roomId.length <= 240 ? roomId : null;
};

const presentParticipant = (
  room: HelixSharedRealtimeRoom,
  participantId: string | null | undefined,
) => {
  const normalized = participantId?.trim() ?? "";
  if (!normalized) return null;
  return room.participants.find(
    (participant) =>
      participant.participant_id === normalized &&
      participant.presence === "present",
  ) ?? null;
};

/**
 * Captures the exact room participant attributable to a final Realtime
 * transcript. The result is server control state: it is stored beside the
 * handoff and never copied into model-authored tool arguments.
 */
export const resolveRealtimeRoomTurnActorContext = async (input: {
  threadId: string;
  requesterProfileId: string;
  realtimeSessionId: string;
  nowMs?: number;
}): Promise<HelixRealtimeRoomTurnActorContext | null> => {
  const roomId = roomIdFromHelixAskThread(input.threadId);
  const requesterProfileId = input.requesterProfileId.trim();
  const realtimeSessionId = input.realtimeSessionId.trim();
  if (!roomId || !requesterProfileId || !realtimeSessionId) return null;

  const room = await readSharedRealtimeRoom({
    roomId,
    profileId: requesterProfileId,
  });
  const nowMs = input.nowMs ?? Date.now();
  const runtime = readSharedRealtimeRoomRuntime({ roomId, nowMs }) ?? room.runtime;
  const activeSpeaker = presentParticipant(
    room,
    runtime.active_speaker_participant_id,
  );
  const authenticatedParticipant = presentParticipant(
    room,
    room.self_participant_id,
  );
  const participant = activeSpeaker ?? authenticatedParticipant;

  return {
    schema: "helix.realtime_room.turn_actor_context.v1",
    origin: "realtime_voice",
    room_id: roomId,
    requester_profile_id: requesterProfileId,
    realtime_session_id: realtimeSessionId,
    participant_id: participant?.participant_id ?? null,
    resolution: participant ? "resolved" : "unavailable",
    resolution_source: activeSpeaker
      ? "active_speaker_floor"
      : authenticatedParticipant
        ? "authenticated_realtime_participant"
        : "speaker_unavailable",
    captured_at_ms: nowMs,
  };
};
