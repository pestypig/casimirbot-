import { z } from "zod";

const ref = z.string().min(3).max(320);
export const roomResultOptionSchema = z.object({
  result_ref: ref, steering_event_ref: ref, room_id: ref,
  room_mission_id: ref, room_mission_revision: z.number().int().positive(),
  status: z.enum(["completed", "unable"]), created_at: z.string().datetime(),
});
export const roomResultCatalogSchema = z.object({
  schema: z.literal("helix.room_result_catalog.v1"),
  room_id: ref,
  mission: z.object({ mission_id: ref, mission_revision: z.number().int().positive() }).nullable(),
  results: z.array(roomResultOptionSchema).max(20),
  limited: z.boolean(),
  answer_authority: z.literal(false), raw_content_included: z.literal(false),
});
export type RoomResultOption = z.infer<typeof roomResultOptionSchema>;
export type RoomResultCatalog = z.infer<typeof roomResultCatalogSchema>;
