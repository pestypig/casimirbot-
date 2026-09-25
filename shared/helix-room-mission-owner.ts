import { z } from "zod";

const ref = z.string().min(3).max(320);
export const roomMissionTargetSchema = z.object({
  reasoning_binding_id: ref, binding_epoch: z.number().int().positive(),
  helix_conversation_id: ref, binding_mission_id: ref.nullable(), run_id: ref.nullable(),
}).strict();
export const roomMissionOwnerSelectionSchema = roomMissionTargetSchema.extend({
  room_id: ref, mission_id: ref, mission_revision: z.number().int().positive(),
  status: z.enum(["active", "revoked"]),
}).strict();
export const roomMissionHandoffOptionSchema = z.object({
  handoff_id: ref, realtime_session_id: ref, speaker_participant_id: ref,
  transcript_text_hash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
  transcript_text_char_count: z.number().int().min(1).max(4000),
  created_at_ms: z.number().finite(),
}).strict();
export const roomMissionOwnerCatalogSchema = z.object({
  schema: z.literal("helix.room_mission_owner_catalog.v1"), room_id: ref,
  mission: roomMissionOwnerSelectionSchema.nullable(),
  candidate: roomMissionTargetSchema.nullable(),
  candidate_unavailable: z.boolean(),
  handoffs: z.array(roomMissionHandoffOptionSchema).max(20),
  execution_authority: z.literal(false), answer_authority: z.literal(false),
  raw_content_included: z.literal(false),
}).strict();
export type RoomMissionTarget = z.infer<typeof roomMissionTargetSchema>;
export type RoomMissionOwnerSelection = z.infer<typeof roomMissionOwnerSelectionSchema>;
export type RoomMissionOwnerCatalog = z.infer<typeof roomMissionOwnerCatalogSchema>;
