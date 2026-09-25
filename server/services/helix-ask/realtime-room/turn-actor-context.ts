import type { HelixSharedRealtimeRoom, HelixSharedRealtimeRoomRuntime } from "@shared/helix-shared-realtime-room";
import { readSharedRealtimeRoom } from "./room-store";
import { findSharedRealtimeRoomRuntimeByRealtimeSessionId, readSharedRealtimeRoomRuntime } from "./runtime-registry";

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
  // Private server snapshot; never accept these fields from model/tool input.
  voice_authority?: {
    runtime_id: string;
    consent_version: number;
    consent_receipt_ref: string;
  };
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

const permitsVoice = (participant: HelixSharedRealtimeRoom["participants"][number] | null) =>
  Boolean(participant?.consent.microphone_to_model && participant.consent.transcript_to_room &&
    Number.isSafeInteger(participant.consent.consent_version) && participant.consent.consent_version > 0 &&
    participant.consent.consent_receipt_ref);

const speakerMatchesTransport = (runtime: HelixSharedRealtimeRoomRuntime | null, participantId: string | null) =>
  Boolean(participantId && (runtime?.transport_owner === "room_media_bridge" ||
    (runtime?.transport_owner === "host_browser" && runtime.reserved_by_participant_id === participantId)));

const exactActiveRuntime = (roomId: string, realtimeSessionId: string, nowMs: number) => {
  const binding = findSharedRealtimeRoomRuntimeByRealtimeSessionId({ realtimeSessionId, nowMs });
  const runtime = readSharedRealtimeRoomRuntime({ roomId, nowMs });
  if (!binding || !runtime) return null;
  return binding.roomId === roomId && binding.runtimeId === runtime.runtime_id &&
    (runtime.state === "host_transport_active" || runtime.state === "bridge_active")
    ? runtime : null;
};

/** Recheck the captured participant, never substitute today's floor holder. */
export const revalidateRealtimeRoomTurnActorContext = async (
  context: HelixRealtimeRoomTurnActorContext,
  nowMs = Date.now(),
): Promise<boolean> => {
  if (context.origin !== "realtime_voice" || context.resolution !== "resolved" ||
      context.resolution_source !== "active_speaker_floor" || !context.voice_authority ||
      !Number.isFinite(context.captured_at_ms) || context.captured_at_ms > nowMs) return false;
  const room = await readSharedRealtimeRoom({ roomId: context.room_id, profileId: context.requester_profile_id });
  const participant = presentParticipant(room, context.participant_id);
  const runtime = exactActiveRuntime(context.room_id, context.realtime_session_id, nowMs);
  return room.status !== "closed" && Boolean(presentParticipant(room, room.self_participant_id)) &&
    runtime?.runtime_id === context.voice_authority.runtime_id &&
    speakerMatchesTransport(runtime, context.participant_id) && permitsVoice(participant) &&
    participant?.consent.consent_version === context.voice_authority.consent_version &&
    participant?.consent.consent_receipt_ref === context.voice_authority.consent_receipt_ref;
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
  const runtime = exactActiveRuntime(roomId, realtimeSessionId, nowMs);
  const activeSpeaker = presentParticipant(
    room,
    runtime?.active_speaker_participant_id,
  );
  const authenticatedParticipant = presentParticipant(
    room,
    room.self_participant_id,
  );
  // A delayed/overlapping transcript without a floor is not the host's speech.
  const participant = room.status !== "closed" && authenticatedParticipant &&
    speakerMatchesTransport(runtime, activeSpeaker?.participant_id ?? null) && permitsVoice(activeSpeaker)
    ? activeSpeaker : null;

  return {
    schema: "helix.realtime_room.turn_actor_context.v1",
    origin: "realtime_voice",
    room_id: roomId,
    requester_profile_id: requesterProfileId,
    realtime_session_id: realtimeSessionId,
    participant_id: participant?.participant_id ?? null,
    resolution: participant ? "resolved" : "unavailable",
    resolution_source: participant
      ? "active_speaker_floor"
      : "speaker_unavailable",
    captured_at_ms: nowMs,
    ...(participant && runtime?.runtime_id ? { voice_authority: {
      runtime_id: runtime.runtime_id,
      consent_version: participant.consent.consent_version,
      consent_receipt_ref: participant.consent.consent_receipt_ref!,
    } } : {}),
  };
};
