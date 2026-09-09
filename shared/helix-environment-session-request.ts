import { z } from "zod";
import { helixEnvironmentDurableGoalObjectiveSchema } from "./helix-environment-durable-goal";

const ref = z.string().trim().min(1).max(320);
export const helixEnvironmentSessionGoalBootstrapSchema = z.object({
  environment_binding_id: ref, subject_binding_id: ref, action_authority_id: ref,
  objective: helixEnvironmentDurableGoalObjectiveSchema,
}).strict();
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
}).extend({ request_id: z.string().trim().min(1).max(120),
  goal_bootstrap: helixEnvironmentSessionGoalBootstrapSchema.optional() }).strict();

// MCP publishes object schemas only. A top-level union would advertise an
// empty object in the SDK even though direct calls still validate successfully.
export const helixEnvironmentSessionMcpSchema = helixEnvironmentSessionRequestSchema.partial({
  reasoning_binding_id: true, binding_epoch: true, helix_conversation_id: true,
  mission_id: true, run_id: true,
  room_id: true, goal_id: true, expected_revision: true, turn_id: true,
  probe_request_id: true, prior_turn_id: true, environment_binding_id: true,
  source_id: true, world_id: true, subject_binding_id: true, action_authority_id: true,
}).extend({ request_id: z.string().trim().min(1).max(120).optional(),
  goal_bootstrap: helixEnvironmentSessionGoalBootstrapSchema.optional(),
  intent_id: ref.optional(),
  objective: z.string().trim().min(1).max(20_000).optional(),
  operation: z.enum(["discover_runs", "read_preparation", "acknowledge_preparation", "prepare_run"]).optional() }).strict();

export const helixEnvironmentSessionMcpCommandSchema = z.union([
  z.object({ operation: z.literal("prepare_run"), client_continuation_ref: ref,
    intent_id: ref, run_id: ref }).strict(),
  z.object({ operation: z.literal("prepare_run"), client_continuation_ref: ref,
    intent_id: ref, objective: z.string().trim().min(1).max(20_000) }).strict(),
  z.object({ operation: z.literal("acknowledge_preparation"), client_continuation_ref: ref,
    intent_id: ref, run_id: ref }).strict(),
  z.object({ operation: z.literal("read_preparation"), client_continuation_ref: ref }).strict(),
  z.object({ operation: z.literal("discover_runs"), client_continuation_ref: ref, room_id: ref }).strict(),
  helixEnvironmentSessionSelectionSchema.extend({ client_continuation_ref: ref }).strict(),
  helixEnvironmentSessionRequestSchema,
]);
