import {
  HELIX_SHARED_REALTIME_ROOM_DEBUG_SCHEMA,
  type HelixSharedRealtimeRoom,
  type HelixSharedRealtimeRoomDebug,
  type HelixSharedRealtimeRoomDebugFrame,
} from "@shared/helix-shared-realtime-room";
import {
  cloneRuntime,
  ensureRuntimeRecord,
  hashRef,
  pruneFrames,
  releaseExpiredFloor,
  type StoredVisualFrame,
} from "./state";
import {
  projectSharedRealtimeRoomSpeakerFloor,
  type SharedRealtimeRoomFloorProjection,
} from "./speaker-floor";

const debugFrame = (stored: StoredVisualFrame): HelixSharedRealtimeRoomDebugFrame => {
  const {
    preview_data_url: _previewDataUrl,
    participant_display_name: _participantDisplayName,
    raw_content_included: _rawContentIncluded,
    ...metadata
  } = stored.frame;
  return {
    ...metadata,
    consent_receipt_ref:
      hashRef("consent_receipt", stored.frame.consent_receipt_ref) ?? "consent_receipt:missing",
    raw_content_included: false,
  };
};

export type SharedRealtimeRoomRuntimeDebugProjection = HelixSharedRealtimeRoomDebug & {
  runtime_evidence: {
    schema: "helix.shared_realtime_room.runtime_debug.v1";
    active_speaker_floor: SharedRealtimeRoomFloorProjection;
    admitted_realtime_session_ref_hash: string | null;
    provider_call_ref_hash: string | null;
    retained_provider_item_count: number;
    provider_call_id_included: false;
    provider_item_ids_included: false;
    thumbnail_data_included: false;
    provider_payload_included: false;
    answer_authority: false;
    assistant_answer: false;
    terminal_eligible: false;
    raw_content_included: false;
  };
};

export const buildSharedRealtimeRoomRuntimeDebugProjection = (input: {
  room: HelixSharedRealtimeRoom;
  inviteCount?: number;
  auditEventCount?: number;
  nowMs?: number;
}): SharedRealtimeRoomRuntimeDebugProjection => {
  const nowMs = input.nowMs ?? Date.now();
  const record = ensureRuntimeRecord(input.room.room_id, nowMs);
  releaseExpiredFloor(record, nowMs);
  pruneFrames(record, nowMs);
  const runtime = cloneRuntime(record.runtime);
  return {
    schema: HELIX_SHARED_REALTIME_ROOM_DEBUG_SCHEMA,
    room_id: input.room.room_id,
    room_status: input.room.status,
    participant_count: input.room.participants.length,
    participants: input.room.participants.map((participant) => ({
      participant_id: participant.participant_id,
      role: participant.role,
      presence: participant.presence,
      consent: {
        ...participant.consent,
        consent_receipt_ref: hashRef(
          "consent_receipt",
          participant.consent.consent_receipt_ref,
        ),
      },
    })),
    readiness: input.room.readiness,
    runtime,
    visual_frames: record.frames.map(debugFrame),
    visual_frame_count: record.frames.length,
    invite_count: Math.max(0, Math.trunc(input.inviteCount ?? 0)),
    audit_event_count: Math.max(0, Math.trunc(input.auditEventCount ?? 0)),
    source_admission: "room_membership_and_participant_consent_required",
    content_role: "debug_observation_not_assistant_answer",
    runtime_evidence: {
      schema: "helix.shared_realtime_room.runtime_debug.v1",
      active_speaker_floor: projectSharedRealtimeRoomSpeakerFloor(record),
      admitted_realtime_session_ref_hash: runtime.realtime_session_ref_hash,
      provider_call_ref_hash: runtime.provider_session_ref_hash,
      retained_provider_item_count: record.providerItems.length,
      provider_call_id_included: false,
      provider_item_ids_included: false,
      thumbnail_data_included: false,
      provider_payload_included: false,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    },
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};
