import crypto from "node:crypto";
import type {
  HelixSharedRealtimeRoomRuntime,
  HelixSharedRealtimeRoomRuntimeState,
  HelixSharedRealtimeRoomTransportOwner,
} from "@shared/helix-shared-realtime-room";
import {
  claimProviderCallBinding,
  claimRealtimeSessionBinding,
  claimTransportBindings,
  clearRuntimeBindings,
  cloneRuntime,
  ensureRuntimeRecord,
  hashRef,
  iso,
  readModel,
  readRef,
  readRuntimeBindingByRealtimeSessionId,
  readRuntimeRecord,
  resetRuntimeRegistryStateForTests,
  runtimeResult,
  transportLimitations,
  type SharedRealtimeRoomRuntimeSessionBinding,
} from "./state";

/**
 * Reserves the one model-runtime slot for a room. This is an atomic in-memory
 * claim only: the caller that receives `created: true` may start transport.
 * No provider/model operation occurs in this registry.
 */
export const reserveSharedRealtimeRoomRuntime = (input: {
  roomId: string;
  reservedByParticipantId: string;
  model: string;
  transportOwner: Exclude<HelixSharedRealtimeRoomTransportOwner, "unbound">;
  nowMs?: number;
}) => {
  const roomId = readRef(input.roomId);
  const participantId = readRef(input.reservedByParticipantId);
  const model = readModel(input.model);
  if (!roomId || !participantId || !model) {
    return runtimeResult(null, "shared_realtime_room_invalid_request", { created: false });
  }
  const nowMs = input.nowMs ?? Date.now();
  const record = ensureRuntimeRecord(roomId, nowMs);
  if (record.runtime.runtime_id && record.runtime.state !== "closed") {
    const sameReservation =
      record.runtime.model === model &&
      record.runtime.transport_owner === input.transportOwner;
    return runtimeResult(
      record,
      sameReservation ? null : "shared_realtime_room_runtime_conflict",
      { created: false },
    );
  }

  clearRuntimeBindings(record);
  record.floor = null;
  record.providerItems = [];
  record.runtime = {
    runtime_id: `shared-realtime-runtime:${crypto.randomUUID()}`,
    state: "reserved",
    topology: "single_shared_model",
    transport_owner: input.transportOwner,
    model,
    active_speaker_participant_id: null,
    provider_session_ref_hash: null,
    realtime_session_ref_hash: null,
    reserved_by_participant_id: participantId,
    started_at: null,
    updated_at: iso(nowMs),
    limitations: transportLimitations(input.transportOwner, false),
  };
  return runtimeResult(record, null, { created: true });
};

export const readSharedRealtimeRoomRuntime = (input: {
  roomId: string;
  nowMs?: number;
}): HelixSharedRealtimeRoomRuntime | null => {
  const record = readRuntimeRecord(input.roomId, input.nowMs);
  return record ? cloneRuntime(record.runtime) : null;
};

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

/**
 * Atomically claims the admitted Realtime session and provider call for one
 * room runtime. A conflict on either identifier leaves both bindings unchanged.
 */
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

/** Returns private binding material for trusted server transport code only. */
export const readSharedRealtimeRoomRuntimeBinding = (input: {
  roomId: string;
  runtimeId: string;
}): {
  realtimeSessionId: string | null;
  providerCallId: string | null;
} | null => {
  const record = readRuntimeRecord(input.roomId);
  if (!record || record.runtime.runtime_id !== readRef(input.runtimeId)) return null;
  return {
    realtimeSessionId: record.admittedRealtimeSessionId,
    providerCallId: record.providerCallId,
  };
};

/** Trusted reverse lookup used to reconcile provider/session teardown. */
export const findSharedRealtimeRoomRuntimeByRealtimeSessionId = (input: {
  realtimeSessionId: string;
  nowMs?: number;
}): SharedRealtimeRoomRuntimeSessionBinding | null =>
  readRuntimeBindingByRealtimeSessionId(input.realtimeSessionId, input.nowMs);

/**
 * Clears a dead transport claim while keeping the room runtime rebindable.
 * This is used only after a trusted session/sideband lifecycle signal.
 */
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
  record.providerItems = [];
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

export const resetSharedRealtimeRoomRuntimeRegistryForTests = (): void => {
  resetRuntimeRegistryStateForTests();
};
