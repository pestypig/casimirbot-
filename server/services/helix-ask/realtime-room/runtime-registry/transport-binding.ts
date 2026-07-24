import type { HelixSharedRealtimeRoomTransportOwner } from
  "@shared/helix-shared-realtime-room";
import {
  claimProviderCallBinding,
  claimRealtimeSessionBinding,
  claimTransportBindings,
  hashRef,
  iso,
  readRef,
  readRuntimeBindingByRealtimeSessionId,
  readRuntimeRecord,
  runtimeResult,
  transportLimitations,
  type SharedRealtimeRoomRuntimeSessionBinding,
} from "./state";

export const bindSharedRealtimeRoomAdmittedSession = (input: {
  roomId: string;
  runtimeId: string;
  realtimeSessionId: string;
  nowMs?: number;
}) => {
  const record = readRuntimeRecord(input.roomId, input.nowMs);
  const runtimeId = readRef(input.runtimeId);
  const realtimeSessionId = readRef(input.realtimeSessionId);
  if (!record || !runtimeId || !realtimeSessionId) {
    return runtimeResult(record, "shared_realtime_room_invalid_request");
  }
  if (record.runtime.runtime_id !== runtimeId || record.runtime.state === "closed") {
    return runtimeResult(record, "shared_realtime_room_realtime_session_invalid");
  }
  if (!claimRealtimeSessionBinding(record, runtimeId, realtimeSessionId)) {
    return runtimeResult(record, "shared_realtime_room_runtime_conflict");
  }
  const nowMs = input.nowMs ?? Date.now();
  record.runtime = {
    ...record.runtime,
    realtime_session_ref_hash: hashRef("realtime_session", realtimeSessionId),
    updated_at: iso(nowMs),
  };
  return runtimeResult(record, null);
};

export const bindSharedRealtimeRoomProviderCall = (input: {
  roomId: string;
  runtimeId: string;
  providerCallId: string;
  nowMs?: number;
}) => {
  const record = readRuntimeRecord(input.roomId, input.nowMs);
  const runtimeId = readRef(input.runtimeId);
  const providerCallId = readRef(input.providerCallId);
  if (!record || !runtimeId || !providerCallId) {
    return runtimeResult(record, "shared_realtime_room_invalid_request");
  }
  if (
    record.runtime.runtime_id !== runtimeId ||
    record.runtime.state === "closed" ||
    !record.admittedRealtimeSessionId
  ) {
    return runtimeResult(record, "shared_realtime_room_realtime_session_invalid");
  }
  if (!claimProviderCallBinding(record, runtimeId, providerCallId)) {
    return runtimeResult(record, "shared_realtime_room_runtime_conflict");
  }
  const nowMs = input.nowMs ?? Date.now();
  record.runtime = {
    ...record.runtime,
    provider_session_ref_hash: hashRef("provider_call", providerCallId),
    updated_at: iso(nowMs),
  };
  return runtimeResult(record, null);
};

/** Atomically claims the admitted session and provider call for one runtime. */
export const bindSharedRealtimeRoomTransport = (input: {
  roomId: string;
  runtimeId: string;
  realtimeSessionId: string;
  providerCallId: string;
  requesterRef: string;
  nowMs?: number;
}) => {
  const record = readRuntimeRecord(input.roomId, input.nowMs);
  const runtimeId = readRef(input.runtimeId);
  const realtimeSessionId = readRef(input.realtimeSessionId);
  const providerCallId = readRef(input.providerCallId);
  const requesterRef = readRef(input.requesterRef);
  if (!record || !runtimeId || !realtimeSessionId || !providerCallId || !requesterRef) {
    return runtimeResult(record, "shared_realtime_room_invalid_request");
  }
  if (record.runtime.runtime_id !== runtimeId || record.runtime.state === "closed") {
    return runtimeResult(record, "shared_realtime_room_realtime_session_invalid");
  }
  if (!claimTransportBindings(
    record,
    runtimeId,
    realtimeSessionId,
    providerCallId,
    requesterRef,
  )) {
    return runtimeResult(record, "shared_realtime_room_runtime_conflict");
  }
  const nowMs = input.nowMs ?? Date.now();
  record.runtime = {
    ...record.runtime,
    realtime_session_ref_hash: hashRef("realtime_session", realtimeSessionId),
    provider_session_ref_hash: hashRef("provider_call", providerCallId),
    updated_at: iso(nowMs),
  };
  return runtimeResult(record, null);
};

export const markSharedRealtimeRoomTransportActive = (input: {
  roomId: string;
  runtimeId: string;
  transportOwner: Exclude<HelixSharedRealtimeRoomTransportOwner, "unbound">;
  nowMs?: number;
}) => {
  const record = readRuntimeRecord(input.roomId, input.nowMs);
  if (!record || record.runtime.runtime_id !== readRef(input.runtimeId)) {
    return runtimeResult(record, "shared_realtime_room_realtime_session_invalid");
  }
  if (
    record.runtime.transport_owner !== input.transportOwner ||
    !record.admittedRealtimeSessionId
  ) {
    return runtimeResult(record, "shared_realtime_room_runtime_conflict");
  }
  const nowMs = input.nowMs ?? Date.now();
  record.runtime = {
    ...record.runtime,
    state: input.transportOwner === "host_browser" ? "host_transport_active" : "bridge_active",
    started_at: record.runtime.started_at ?? iso(nowMs),
    updated_at: iso(nowMs),
    limitations: transportLimitations(input.transportOwner, true),
  };
  return runtimeResult(record, null);
};

/**
 * Promotes the already-bound owner browser transport after its two-person
 * WebRTC relay is connected. This does not create or bind another model call.
 */
export const promoteSharedRealtimeRoomMediaBridge = (input: {
  roomId: string;
  runtimeId: string;
  nowMs?: number;
}) => {
  const record = readRuntimeRecord(input.roomId, input.nowMs);
  if (
    record?.runtime.runtime_id === readRef(input.runtimeId) &&
    record.runtime.transport_owner === "room_media_bridge" &&
    record.runtime.state === "bridge_active" &&
    record.admittedRealtimeSessionId
  ) {
    return runtimeResult(record, null);
  }
  if (
    !record ||
    record.runtime.runtime_id !== readRef(input.runtimeId) ||
    record.runtime.transport_owner !== "host_browser" ||
    record.runtime.state !== "host_transport_active" ||
    !record.admittedRealtimeSessionId
  ) {
    return runtimeResult(record, "shared_realtime_room_runtime_conflict");
  }
  const nowMs = input.nowMs ?? Date.now();
  record.runtime = {
    ...record.runtime,
    state: "bridge_active",
    transport_owner: "room_media_bridge",
    updated_at: iso(nowMs),
    limitations: transportLimitations("room_media_bridge", true),
  };
  return runtimeResult(record, null);
};

export const demoteSharedRealtimeRoomMediaBridge = (input: {
  roomId: string;
  runtimeId: string;
  nowMs?: number;
}) => {
  const record = readRuntimeRecord(input.roomId, input.nowMs);
  if (
    record?.runtime.runtime_id === readRef(input.runtimeId) &&
    record.runtime.transport_owner === "host_browser" &&
    record.runtime.state === "host_transport_active" &&
    record.admittedRealtimeSessionId
  ) {
    return runtimeResult(record, null);
  }
  if (
    !record ||
    record.runtime.runtime_id !== readRef(input.runtimeId) ||
    record.runtime.transport_owner !== "room_media_bridge" ||
    record.runtime.state !== "bridge_active" ||
    !record.admittedRealtimeSessionId
  ) {
    return runtimeResult(record, "shared_realtime_room_runtime_conflict");
  }
  const nowMs = input.nowMs ?? Date.now();
  record.floor = null;
  record.runtime = {
    ...record.runtime,
    state: "host_transport_active",
    transport_owner: "host_browser",
    active_speaker_participant_id: null,
    updated_at: iso(nowMs),
    limitations: transportLimitations("host_browser", true),
  };
  return runtimeResult(record, null);
};

/** Private binding material for trusted server transport code only. */
export const readSharedRealtimeRoomRuntimeBinding = (input: {
  roomId: string;
  runtimeId: string;
}): { realtimeSessionId: string | null; providerCallId: string | null } | null => {
  const record = readRuntimeRecord(input.roomId);
  if (!record || record.runtime.runtime_id !== readRef(input.runtimeId)) return null;
  return {
    realtimeSessionId: record.admittedRealtimeSessionId,
    providerCallId: record.providerCallId,
  };
};

export const findSharedRealtimeRoomRuntimeByRealtimeSessionId = (input: {
  realtimeSessionId: string;
  nowMs?: number;
}): SharedRealtimeRoomRuntimeSessionBinding | null =>
  readRuntimeBindingByRealtimeSessionId(input.realtimeSessionId, input.nowMs);
