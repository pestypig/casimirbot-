import {
  DEFAULT_FLOOR_LEASE_MS,
  MAX_FLOOR_LEASE_MS,
  MIN_FLOOR_LEASE_MS,
  iso,
  readRef,
  readRuntimeRecord,
  runtimeResult,
  type RuntimeRecord,
} from "./state";

export type SharedRealtimeRoomFloorProjection = {
  participant_id: string | null;
  epoch: number;
  acquired_at: string | null;
  lease_expires_at: string | null;
};

export const projectSharedRealtimeRoomSpeakerFloor = (
  record: RuntimeRecord,
): SharedRealtimeRoomFloorProjection => ({
  participant_id: record.floor?.participantId ?? null,
  epoch: record.floor?.epoch ?? record.floorEpoch,
  acquired_at: record.floor ? iso(record.floor.acquiredAtMs) : null,
  lease_expires_at: record.floor ? iso(record.floor.leaseExpiresAtMs) : null,
});

/**
 * Tracks a single active input floor. Membership/presence remains owned by the
 * room store; callers must pass a server-authorized participant and consent.
 */
export const claimSharedRealtimeRoomSpeakerFloor = (input: {
  roomId: string;
  runtimeId: string;
  participantId: string;
  microphoneToModelAuthorized: boolean;
  leaseMs?: number;
  nowMs?: number;
}) => {
  const nowMs = input.nowMs ?? Date.now();
  const record = readRuntimeRecord(input.roomId, nowMs);
  const participantId = readRef(input.participantId);
  if (!record || !participantId || record.runtime.runtime_id !== readRef(input.runtimeId)) {
    return {
      ...runtimeResult(record, "shared_realtime_room_realtime_session_invalid"),
      granted: false,
      floor: record ? projectSharedRealtimeRoomSpeakerFloor(record) : null,
    };
  }
  if (!input.microphoneToModelAuthorized) {
    return {
      ...runtimeResult(record, "shared_realtime_room_consent_required"),
      granted: false,
      floor: projectSharedRealtimeRoomSpeakerFloor(record),
    };
  }
  if (
    record.runtime.state !== "host_transport_active" &&
    record.runtime.state !== "bridge_active"
  ) {
    return {
      ...runtimeResult(record, "shared_realtime_room_not_ready"),
      granted: false,
      floor: projectSharedRealtimeRoomSpeakerFloor(record),
    };
  }
  if (record.floor && record.floor.participantId !== participantId) {
    return {
      ...runtimeResult(record, "shared_realtime_room_runtime_conflict"),
      granted: false,
      floor: projectSharedRealtimeRoomSpeakerFloor(record),
    };
  }
  const requestedLease = Number.isFinite(input.leaseMs)
    ? Math.trunc(input.leaseMs as number)
    : DEFAULT_FLOOR_LEASE_MS;
  const leaseMs = Math.max(
    MIN_FLOOR_LEASE_MS,
    Math.min(MAX_FLOOR_LEASE_MS, requestedLease),
  );
  if (!record.floor) record.floorEpoch += 1;
  record.floor = {
    participantId,
    epoch: record.floor?.epoch ?? record.floorEpoch,
    acquiredAtMs: record.floor?.acquiredAtMs ?? nowMs,
    leaseExpiresAtMs: nowMs + leaseMs,
  };
  record.runtime = {
    ...record.runtime,
    active_speaker_participant_id: participantId,
    updated_at: iso(nowMs),
  };
  return {
    ...runtimeResult(record, null),
    granted: true,
    floor: projectSharedRealtimeRoomSpeakerFloor(record),
  };
};

export const releaseSharedRealtimeRoomSpeakerFloor = (input: {
  roomId: string;
  runtimeId: string;
  participantId: string;
  epoch?: number | null;
  nowMs?: number;
}) => {
  const nowMs = input.nowMs ?? Date.now();
  const record = readRuntimeRecord(input.roomId, nowMs);
  const participantId = readRef(input.participantId);
  if (!record || !participantId || record.runtime.runtime_id !== readRef(input.runtimeId)) {
    return {
      ...runtimeResult(record, "shared_realtime_room_realtime_session_invalid"),
      released: false,
      floor: record ? projectSharedRealtimeRoomSpeakerFloor(record) : null,
    };
  }
  const matches =
    record.floor?.participantId === participantId &&
    (input.epoch == null || input.epoch === record.floor.epoch);
  if (matches) {
    record.floor = null;
    record.runtime = {
      ...record.runtime,
      active_speaker_participant_id: null,
      updated_at: iso(nowMs),
    };
  }
  return {
    ...runtimeResult(record, null),
    released: matches,
    floor: projectSharedRealtimeRoomSpeakerFloor(record),
  };
};

export const readSharedRealtimeRoomSpeakerFloor = (input: {
  roomId: string;
  nowMs?: number;
}): SharedRealtimeRoomFloorProjection | null => {
  const record = readRuntimeRecord(input.roomId, input.nowMs);
  return record ? projectSharedRealtimeRoomSpeakerFloor(record) : null;
};
