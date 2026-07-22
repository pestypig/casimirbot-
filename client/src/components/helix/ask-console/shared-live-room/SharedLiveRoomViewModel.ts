import type {
  HelixSharedRealtimeRoom,
  HelixSharedRealtimeRoomParticipant,
  HelixSharedRealtimeRoomVisualFrame,
} from "@shared/helix-shared-realtime-room";

export type HelixSharedLiveRoomVisualLane = {
  participant: HelixSharedRealtimeRoomParticipant;
  frames: HelixSharedRealtimeRoomVisualFrame[];
  latestFrame: HelixSharedRealtimeRoomVisualFrame | null;
};

const capturedAtMs = (frame: HelixSharedRealtimeRoomVisualFrame): number => {
  const parsed = Date.parse(frame.captured_at);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const buildHelixSharedLiveRoomVisualLanes = (input: {
  room: HelixSharedRealtimeRoom | null;
  frames: readonly HelixSharedRealtimeRoomVisualFrame[];
  maxFramesPerParticipant?: number;
}): HelixSharedLiveRoomVisualLane[] => {
  if (!input.room) return [];
  const maxFramesPerParticipant = Math.max(
    1,
    Math.min(12, Math.trunc(input.maxFramesPerParticipant ?? 6)),
  );
  const framesByParticipant = new Map<string, HelixSharedRealtimeRoomVisualFrame[]>();
  for (const frame of input.frames) {
    if (frame.room_id !== input.room.room_id) continue;
    const frames = framesByParticipant.get(frame.participant_id) ?? [];
    frames.push(frame);
    framesByParticipant.set(frame.participant_id, frames);
  }
  return [...input.room.participants]
    .sort((left, right) => {
      if (left.role !== right.role) return left.role === "owner" ? -1 : 1;
      return left.joined_at.localeCompare(right.joined_at);
    })
    .map((participant) => {
      const frames = (framesByParticipant.get(participant.participant_id) ?? [])
        .sort((left, right) => capturedAtMs(left) - capturedAtMs(right))
        .slice(-maxFramesPerParticipant);
      return {
        participant,
        frames,
        latestFrame: frames.at(-1) ?? null,
      };
    });
};

export const readHelixSharedLiveRoomSelfParticipant = (
  room: HelixSharedRealtimeRoom | null,
): HelixSharedRealtimeRoomParticipant | null =>
  room?.participants.find((participant) =>
    participant.participant_id === room.self_participant_id) ?? null;

export const describeHelixSharedLiveRoomReadiness = (
  room: HelixSharedRealtimeRoom | null,
): string => {
  if (!room) return "No shared room";
  if (room.readiness.ready) return "Ready for one shared model context";
  if (room.readiness.missing_participant_count > 0) {
    return `Waiting for ${room.readiness.missing_participant_count} participant`;
  }
  const missingConsentCount = Object.values(room.readiness.missing_consent_by_participant)
    .reduce((sum, entries) => sum + entries.length, 0);
  return missingConsentCount > 0
    ? `Waiting for ${missingConsentCount} consent grant${missingConsentCount === 1 ? "" : "s"}`
    : "Waiting for room readiness";
};

