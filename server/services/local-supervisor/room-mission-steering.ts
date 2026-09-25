import { z } from "zod";
import { revalidateRealtimeRoomTurnActorContext } from "../helix-ask/realtime-room/turn-actor-context";
import { roomExternalMissionStore, RoomExternalMissionError,
  type RoomExternalMissionStore } from "./room-external-mission-store";
import type { HelixReasoningTaskAssociation } from "./reasoning-task-binding-store";

const ref = z.string().trim().min(3).max(320);

/** Private admission identity, encrypted with durable steering when applicable.
 * This is not model-visible route metadata or a grant of effect authority. */
export const roomMissionSteeringEnvelopeSchema = z.object({
  schema: z.literal("helix.room_mission_steering.v1"),
  roomId: ref,
  ownerProfileId: ref,
  roomMissionId: ref,
  roomMissionRevision: z.number().int().positive(),
  handoffId: ref,
  realtimeSessionId: ref,
  runtimeId: ref,
  speakerParticipantId: ref,
  capturedAtMs: z.number().int().positive(),
  consentVersion: z.number().int().positive(),
  consentReceiptRef: ref,
  transcriptTextHash: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  bindingId: ref,
  bindingEpoch: z.number().int().positive(),
  authenticatedMcpClientRef: ref,
  clientSessionRef: ref,
  clientContinuationRef: ref,
  helixConversationId: ref,
  bindingMissionId: ref.nullable(),
  runId: ref.nullable(),
}).strict();

export type RoomMissionSteeringEnvelope = z.infer<typeof roomMissionSteeringEnvelopeSchema>;

/** Recheck the selected room mission and the captured speaker at each boundary.
 * Task presence/pairing is checked by the caller's exact binding access. */
export async function requireCurrentRoomMissionSteering(input: {
  envelope: RoomMissionSteeringEnvelope;
  association: HelixReasoningTaskAssociation;
  missionStore?: Pick<RoomExternalMissionStore, "requireCurrent">;
  nowMs?: number;
}): Promise<void> {
  const row = roomMissionSteeringEnvelopeSchema.parse(input.envelope);
  const task = input.association;
  if (task.profileRef !== row.ownerProfileId || task.bindingId !== row.bindingId ||
      task.bindingEpoch !== row.bindingEpoch ||
      task.authenticatedMcpClientRef !== row.authenticatedMcpClientRef ||
      task.clientSessionRef !== row.clientSessionRef ||
      task.clientContinuationRef !== row.clientContinuationRef ||
      task.helixConversationId !== row.helixConversationId ||
      task.missionId !== row.bindingMissionId || task.runId !== row.runId) {
    throw new RoomExternalMissionError("room_mission_task_association_mismatch", 409);
  }
  await (input.missionStore ?? roomExternalMissionStore).requireCurrent({
    roomId: row.roomId, ownerProfileId: row.ownerProfileId,
    missionId: row.roomMissionId, missionRevision: row.roomMissionRevision,
    bindingId: row.bindingId, bindingEpoch: row.bindingEpoch,
    helixConversationId: row.helixConversationId,
    bindingMissionId: row.bindingMissionId, runId: row.runId,
  });
  const permitted = await revalidateRealtimeRoomTurnActorContext({
    schema: "helix.realtime_room.turn_actor_context.v1",
    origin: "realtime_voice", room_id: row.roomId,
    requester_profile_id: row.ownerProfileId,
    realtime_session_id: row.realtimeSessionId,
    participant_id: row.speakerParticipantId,
    resolution: "resolved", resolution_source: "active_speaker_floor",
    captured_at_ms: row.capturedAtMs,
    voice_authority: { runtime_id: row.runtimeId,
      consent_version: row.consentVersion,
      consent_receipt_ref: row.consentReceiptRef },
  }, input.nowMs);
  if (!permitted) throw new RoomExternalMissionError("room_mission_speaker_authority_revoked", 409);
}
