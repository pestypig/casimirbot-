import { z } from "zod";

const ref = z.string().trim().min(1).max(320);
/** Exact selectors, not caller-supplied identity or authority proof. */
export const helixEnvironmentSessionRequestSchema = z.object({
  client_continuation_ref: ref,
  reasoning_binding_id: ref,
  binding_epoch: z.number().int().positive(),
  helix_conversation_id: ref,
  mission_id: ref.nullable(),
  room_id: ref,
  run_id: ref,
  goal_id: ref,
  expected_revision: z.number().int().nonnegative(),
  turn_id: ref,
  probe_request_id: ref,
  prior_turn_id: ref,
  environment_binding_id: ref,
  source_id: ref,
  world_id: ref,
  subject_binding_id: ref,
  action_authority_id: ref,
}).strict();

export const helixEnvironmentSessionSelectionSchema = helixEnvironmentSessionRequestSchema.pick({
  reasoning_binding_id: true, binding_epoch: true, helix_conversation_id: true,
  mission_id: true, run_id: true,
}).extend({ request_id: z.string().trim().min(1).max(120) }).strict();

// MCP publishes object schemas only. A top-level union would advertise an
// empty object in the SDK even though direct calls still validate successfully.
export const helixEnvironmentSessionMcpSchema = helixEnvironmentSessionRequestSchema.partial({
  room_id: true, goal_id: true, expected_revision: true, turn_id: true,
  probe_request_id: true, prior_turn_id: true, environment_binding_id: true,
  source_id: true, world_id: true, subject_binding_id: true, action_authority_id: true,
}).extend({ request_id: z.string().trim().min(1).max(120).optional() }).strict();

export const helixEnvironmentSessionMcpCommandSchema = z.union([
  helixEnvironmentSessionSelectionSchema.extend({ client_continuation_ref: ref }).strict(),
  helixEnvironmentSessionRequestSchema,
]);
