import { z } from "zod";

export const HELIX_REASONING_TASK_BINDING_SCHEMA =
  "helix.reasoning_task_binding.v1" as const;
export const HELIX_REASONING_STEERING_EVENT_SCHEMA =
  "helix.reasoning_steering_event.v1" as const;

const opaqueRef = z.string().trim().min(3).max(320)
  .refine((value) => !/[\r\n\t]/u.test(value), "opaque_ref_must_be_single_line")
  .refine(
    (value) => !/(?:https?:\/\/|bearer\s|token=|password=)/iu.test(value),
    "private_value_forbidden",
  );

export const helixReasoningTaskBindingProjectionSchema = z.object({
  schema: z.literal(HELIX_REASONING_TASK_BINDING_SCHEMA),
  reasoning_binding_id: opaqueRef,
  binding_epoch: z.number().int().positive(),
  status: z.enum(["pending_claim", "active", "revoked", "expired", "superseded"]),
  service_instance_ref: opaqueRef,
  authenticated_profile_ref: opaqueRef,
  authenticated_mcp_client_ref: opaqueRef,
  client_session_ref: opaqueRef,
  provider_thread_ref_hash: z.string().regex(/^[a-f0-9]{64}$/u),
  helix_conversation_id: opaqueRef,
  mission_id: opaqueRef.nullable(),
  run_id: opaqueRef.nullable(),
  reasoning_role: z.literal("principal"),
  continuation_transport: z.enum(["polling", "monitor_only", "unavailable"]),
  negotiated_observability_level: z.enum([
    "tool_activity_only",
    "checkpoint_publish",
    "continuation_ready",
  ]),
  created_by: z.literal("signed_in_operator"),
  created_at: z.string().datetime(),
  expires_at: z.string().datetime(),
  claimed_at: z.string().datetime().nullable(),
  revoked_at: z.string().datetime().nullable(),
  provider_thread_content_included: z.literal(false),
  hidden_reasoning_included: z.literal(false),
  execution_authority: z.literal(false),
  evidence_authority: z.literal(false),
  answer_authority: z.literal(false),
  terminal_eligible: z.literal(false),
}).strict();

export const helixReasoningSteeringEventProjectionSchema = z.object({
  schema: z.literal(HELIX_REASONING_STEERING_EVENT_SCHEMA),
  steering_event_ref: opaqueRef,
  reasoning_binding_id: opaqueRef,
  binding_epoch: z.number().int().positive(),
  cursor: z.number().int().positive(),
  client_event_ref: opaqueRef,
  origin: z.enum(["typed", "gpt_live_finalized"]),
  delivery_state: z.enum(["pending", "acknowledged", "expired", "superseded", "revoked"]),
  instruction_sha256: z.string().regex(/^[a-f0-9]{64}$/u),
  instruction_length: z.number().int().positive().max(4_000),
  created_at: z.string().datetime(),
  expires_at: z.string().datetime(),
  acknowledged_at: z.string().datetime().nullable(),
  advisory_only: z.literal(true),
  execution_requested: z.literal(false),
  evidence_satisfied: z.literal(false),
  provider_thread_content_included: z.literal(false),
  hidden_reasoning_included: z.literal(false),
  answer_authority: z.literal(false),
  terminal_eligible: z.literal(false),
}).strict();

export type HelixReasoningTaskBindingProjection = z.infer<
  typeof helixReasoningTaskBindingProjectionSchema
>;
export type HelixReasoningSteeringEventProjection = z.infer<
  typeof helixReasoningSteeringEventProjectionSchema
>;
export type HelixReasoningSteeringDelivery = Readonly<{
  event: HelixReasoningSteeringEventProjection;
  instruction_text: string;
  content_role: "operator_steering_advisory_not_execution";
  raw_provider_content_included: false;
  hidden_reasoning_included: false;
}>;
