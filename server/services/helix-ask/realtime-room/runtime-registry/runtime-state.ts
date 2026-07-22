import type { HelixSharedRealtimeRoomRuntimeState } from
  "@shared/helix-shared-realtime-room";
import { detachSharedRealtimeRoomProviderFrameState } from "./provider-frame-state";
import {
  clearRuntimeBindings,
  iso,
  readRef,
  readRuntimeRecord,
  runtimeResult,
} from "./state";

export const markSharedRealtimeRoomRuntimeState = (input: {
  roomId: string;
  runtimeId: string;
  state: Extract<HelixSharedRealtimeRoomRuntimeState, "degraded" | "stopping" | "error">;
  limitation?: string | null;
  nowMs?: number;
}) => {
  const record = readRuntimeRecord(input.roomId, input.nowMs);
  if (!record || record.runtime.runtime_id !== readRef(input.runtimeId)) {
    return runtimeResult(record, "shared_realtime_room_realtime_session_invalid");
  }
  const limitation = readRef(input.limitation, 200);
  const nowMs = input.nowMs ?? Date.now();
  record.runtime = {
    ...record.runtime,
    state: input.state,
    updated_at: iso(nowMs),
    limitations: limitation
      ? Array.from(new Set([...record.runtime.limitations, limitation]))
      : [...record.runtime.limitations],
  };
  return runtimeResult(record, null);
};

/** Clears a dead transport claim while keeping the runtime rebindable. */
export const releaseSharedRealtimeRoomTransportBinding = (input: {
  roomId: string;
  runtimeId: string;
  limitation: string;
  nowMs?: number;
}) => {
  const record = readRuntimeRecord(input.roomId, input.nowMs);
  if (!record || record.runtime.runtime_id !== readRef(input.runtimeId)) {
    return {
      ...runtimeResult(record, "shared_realtime_room_realtime_session_invalid"),
      released_binding: null,
    };
  }
  const releasedBinding = {
    realtimeSessionId: record.admittedRealtimeSessionId,
    providerCallId: record.providerCallId,
    requesterRef: record.boundRequesterRef,
  };
  const limitation = readRef(input.limitation, 200);
  const nowMs = input.nowMs ?? Date.now();
  clearRuntimeBindings(record);
  record.floor = null;
  detachSharedRealtimeRoomProviderFrameState(record);
  record.runtime = {
    ...record.runtime,
    state: "degraded",
    active_speaker_participant_id: null,
    provider_session_ref_hash: null,
    realtime_session_ref_hash: null,
    updated_at: iso(nowMs),
    limitations: limitation
      ? Array.from(new Set([...record.runtime.limitations, limitation]))
      : [...record.runtime.limitations],
  };
  return {
    ...runtimeResult(record, null),
    released_binding: releasedBinding,
  };
};

export const stopSharedRealtimeRoomRuntime = (input: {
  roomId: string;
  runtimeId: string;
  nowMs?: number;
}) => {
  const record = readRuntimeRecord(input.roomId, input.nowMs);
  if (!record || record.runtime.runtime_id !== readRef(input.runtimeId)) {
    return {
      ...runtimeResult(record, "shared_realtime_room_realtime_session_invalid"),
      stopped_binding: null,
    };
  }
  const stoppedBinding = {
    realtimeSessionId: record.admittedRealtimeSessionId,
    providerCallId: record.providerCallId,
    requesterRef: record.boundRequesterRef,
  };
  const nowMs = input.nowMs ?? Date.now();
  clearRuntimeBindings(record);
  record.floor = null;
  record.providerItems = [];
  record.runtime = {
    ...record.runtime,
    state: "closed",
    active_speaker_participant_id: null,
    updated_at: iso(nowMs),
  };
  return {
    ...runtimeResult(record, null),
    stopped_binding: stoppedBinding,
  };
};
