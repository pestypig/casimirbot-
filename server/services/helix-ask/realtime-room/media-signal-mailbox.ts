import { randomUUID } from "node:crypto";
import type {
  HelixSharedRealtimeRoomMediaSignal,
  HelixSharedRealtimeRoomMediaSignalKind,
} from "@shared/helix-shared-realtime-room-media";

const SIGNAL_TTL_MS = 2 * 60_000;
const MAX_SIGNALS_PER_ROOM = 96;
const mailboxes = new Map<string, HelixSharedRealtimeRoomMediaSignal[]>();

const prune = (roomId: string, nowMs: number): HelixSharedRealtimeRoomMediaSignal[] => {
  const retained = (mailboxes.get(roomId) ?? [])
    .filter((signal) => Date.parse(signal.expires_at) > nowMs)
    .slice(-MAX_SIGNALS_PER_ROOM);
  if (retained.length > 0) mailboxes.set(roomId, retained);
  else mailboxes.delete(roomId);
  return retained;
};

export const publishSharedRealtimeRoomMediaSignal = (input: {
  roomId: string;
  runtimeId: string;
  negotiationId: string;
  senderParticipantId: string;
  targetParticipantId: string;
  kind: HelixSharedRealtimeRoomMediaSignalKind;
  description: RTCSessionDescriptionInit | null;
  candidate: RTCIceCandidateInit | null;
  nowMs?: number;
}): HelixSharedRealtimeRoomMediaSignal => {
  const nowMs = input.nowMs ?? Date.now();
  const signal: HelixSharedRealtimeRoomMediaSignal = {
    schema: "helix.shared_realtime_room.media_signal.v1",
    signal_id: randomUUID(),
    room_id: input.roomId,
    runtime_id: input.runtimeId,
    negotiation_id: input.negotiationId,
    sender_participant_id: input.senderParticipantId,
    target_participant_id: input.targetParticipantId,
    kind: input.kind,
    description: input.description,
    candidate: input.candidate,
    created_at: new Date(nowMs).toISOString(),
    expires_at: new Date(nowMs + SIGNAL_TTL_MS).toISOString(),
  };
  const retained = prune(input.roomId, nowMs);
  mailboxes.set(input.roomId, [...retained, signal].slice(-MAX_SIGNALS_PER_ROOM));
  return signal;
};

export const readSharedRealtimeRoomMediaSignals = (input: {
  roomId: string;
  targetParticipantId: string;
  afterSignalId?: string | null;
  nowMs?: number;
}): HelixSharedRealtimeRoomMediaSignal[] => {
  const signals = prune(input.roomId, input.nowMs ?? Date.now());
  const afterIndex = input.afterSignalId
    ? signals.findIndex((signal) => signal.signal_id === input.afterSignalId)
    : -1;
  return signals
    .slice(afterIndex >= 0 ? afterIndex + 1 : 0)
    .filter((signal) => signal.target_participant_id === input.targetParticipantId);
};

export const clearSharedRealtimeRoomMediaSignals = (roomId: string): void => {
  mailboxes.delete(roomId);
};
