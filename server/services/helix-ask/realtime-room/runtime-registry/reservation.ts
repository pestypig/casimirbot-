import crypto from "node:crypto";
import type {
  HelixSharedRealtimeRoomRuntime,
  HelixSharedRealtimeRoomTransportOwner,
} from "@shared/helix-shared-realtime-room";
import { detachSharedRealtimeRoomProviderFrameState } from "./provider-frame-state";
import {
  clearRuntimeBindings,
  cloneRuntime,
  ensureRuntimeRecord,
  iso,
  readModel,
  readRef,
  readRuntimeRecord,
  resetRuntimeRegistryStateForTests,
  runtimeResult,
  transportLimitations,
} from "./state";

/** Reserves the room's only model slot without starting provider transport. */
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
  detachSharedRealtimeRoomProviderFrameState(record);
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

export const resetSharedRealtimeRoomRuntimeRegistryForTests = (): void => {
  resetRuntimeRegistryStateForTests();
};
