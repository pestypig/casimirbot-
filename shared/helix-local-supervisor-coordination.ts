import { z } from "zod";

export const HELIX_LOCAL_SUPERVISOR_COORDINATION_SCHEMA =
  "helix.local_supervisor_coordination.v1" as const;
export const HELIX_LOCAL_SUPERVISOR_RELAY_SCHEMA =
  "helix.local_supervisor_relay.v1" as const;
export const HELIX_LOCAL_SUPERVISOR_RECOMMENDATION_SCHEMA =
  "helix.local_supervisor_recommendation.v1" as const;

export const HELIX_THREAD_OBSERVABILITY_BRIDGE_LEVELS = [
  "tool_activity_only",
  "checkpoint_publish",
  "continuation_ready",
] as const;

export const helixThreadObservabilityBridgeLevelSchema = z.enum(
  HELIX_THREAD_OBSERVABILITY_BRIDGE_LEVELS,
);

export const helixThreadObservabilityBridgeDeclarationSchema = z.object({
  supported_levels: z.array(helixThreadObservabilityBridgeLevelSchema)
    .min(1)
    .max(3),
  requested_level: helixThreadObservabilityBridgeLevelSchema,
  checkpoint_publication: z.object({
    freshness_window_seconds: z.number().int().min(15).max(3600),
    retention: z.enum(["current_session", "profile_durable"]),
    revocation: z.literal("independent"),
  }).strict().nullable(),
}).strict().superRefine((value, context) => {
  if (new Set(value.supported_levels).size !== value.supported_levels.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["supported_levels"],
      message: "observability_levels_must_be_unique",
    });
  }
  if (
    value.supported_levels.includes("continuation_ready") &&
    !value.supported_levels.includes("checkpoint_publish")
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["supported_levels"],
      message: "continuation_requires_checkpoint_support",
    });
  }
  if (!value.supported_levels.includes(value.requested_level)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["requested_level"],
      message: "requested_observability_level_must_be_supported",
    });
  }
  const checkpointRequested = value.requested_level !== "tool_activity_only";
  if (checkpointRequested !== Boolean(value.checkpoint_publication)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["checkpoint_publication"],
      message: "checkpoint_policy_must_match_requested_level",
    });
  }
});

export type HelixThreadObservabilityBridgeDeclaration = z.infer<
  typeof helixThreadObservabilityBridgeDeclarationSchema
>;

export const HELIX_TOOL_ACTIVITY_ONLY_DECLARATION = Object.freeze({
  supported_levels: ["tool_activity_only"] as ["tool_activity_only"],
  requested_level: "tool_activity_only" as const,
  checkpoint_publication: null,
});

const opaqueRef = z.string().trim().min(3).max(320)
  .refine((value) => !/[\r\n\t]/u.test(value), "opaque_ref_must_be_single_line")
  .refine((value) => !/(?:https?:\/\/|bearer\s|token=|password=|community=)/iu.test(value), "private_value_forbidden");

export const helixLocalSupervisorLifecycleStateSchema = z.enum([
  "starting",
  "active",
  "waiting",
  "blocked",
  "releasing",
  "completed",
  "disconnected",
]);

export const helixLocalSupervisorResourceClaimInputSchema = z.object({
  resource_ref: opaqueRef,
  claim_class: z.enum([
    "read",
    "retained_runtime",
    "mutation_lease_wait",
    "mutation_lease_active",
  ]),
}).strict();

export const helixLocalSupervisorResourceClaimSchema =
  helixLocalSupervisorResourceClaimInputSchema.extend({
    claim_basis: z.enum(["client_declared", "server_verified"]),
    verification_ref: opaqueRef.nullable(),
    collision_authority: z.boolean(),
  }).strict().superRefine((value, context) => {
    if (value.claim_basis === "server_verified" && !value.verification_ref) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["verification_ref"],
        message: "A server-verified claim requires a verification reference.",
      });
    }
    if (value.claim_basis === "client_declared" &&
        (value.verification_ref !== null || value.collision_authority)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A client-declared claim cannot carry collision authority.",
      });
    }
  });

export const helixLocalSupervisorPresenceInputSchema = z.object({
  client_session_ref: opaqueRef,
  conversation_thread_ref: opaqueRef,
  declared_objective_summary: z.string().trim().min(1).max(360),
  lifecycle_state: helixLocalSupervisorLifecycleStateSchema,
  resource_claims: z.array(helixLocalSupervisorResourceClaimInputSchema).max(24).default([]),
  room_ref: opaqueRef.nullable().optional(),
  environment_ref: opaqueRef.nullable().optional(),
  run_ref: opaqueRef.nullable().optional(),
  blocker_summary: z.string().trim().max(240).nullable().optional(),
  thread_observability_bridge:
    helixThreadObservabilityBridgeDeclarationSchema.default(
      HELIX_TOOL_ACTIVITY_ONLY_DECLARATION,
    ),
  heartbeat_ttl_seconds: z.number().int().min(15).max(180).default(60),
}).strict();

export const helixLocalSupervisorRelayTypeSchema = z.enum([
  "status_update",
  "coordination_request",
  "handoff_request",
  "collision_notice",
  "release_notice",
]);

export const helixLocalSupervisorRelayInputSchema = z.object({
  client_message_ref: opaqueRef,
  sender_client_session_ref: opaqueRef,
  target_client_session_ref: opaqueRef,
  relay_type: helixLocalSupervisorRelayTypeSchema,
  summary: z.string().trim().min(1).max(360),
  resource_ref: opaqueRef.nullable().optional(),
  room_ref: opaqueRef.nullable().optional(),
  run_ref: opaqueRef.nullable().optional(),
  expires_in_seconds: z.number().int().min(15).max(600).default(180),
}).strict();

export const helixLocalSupervisorRelayAckInputSchema = z.object({
  client_session_ref: opaqueRef,
}).strict();

export type HelixLocalSupervisorPresenceInput = z.infer<
  typeof helixLocalSupervisorPresenceInputSchema
>;
export type HelixLocalSupervisorRelayInput = z.infer<
  typeof helixLocalSupervisorRelayInputSchema
>;

export type HelixLocalSupervisorPresence = {
  schema: typeof HELIX_LOCAL_SUPERVISOR_COORDINATION_SCHEMA;
  service_instance_ref: string;
  client_session_ref: string;
  conversation_thread_ref: string;
  authenticated_profile_ref: string;
  authenticated_mcp_client_ref: string | null;
  declared_objective_summary: string;
  declared_objective_is_verified: false;
  lifecycle_basis: "authenticated_client_heartbeat";
  lifecycle_state: z.infer<typeof helixLocalSupervisorLifecycleStateSchema>;
  thread_observability_bridge?: HelixThreadObservabilityBridgeDeclaration & {
    declaration_basis: "authenticated_client_declaration";
    provider_thread_content_included: false;
    hidden_reasoning_included: false;
    answer_authority: false;
    terminal_eligible: false;
  };
  resource_claims: z.infer<typeof helixLocalSupervisorResourceClaimSchema>[];
  room_ref: string | null;
  environment_ref: string | null;
  run_ref: string | null;
  verified_room_identity: {
    basis: "server_verified";
    room_ref: string;
    participant_ref: string;
    verification_ref: string;
  } | null;
  verified_connector_identity: {
    basis: "server_verified";
    environment_ref: string;
    connector_installation_ref: string;
    source_ref: string;
    producer_epoch_ref: string;
    verification_ref: string;
  } | null;
  verified_retained_runtime_identity: {
    basis: "server_verified";
    run_ref: string;
    run_version: number;
    run_room_binding_ref: string;
    run_room_binding_version: number;
    verification_ref: string;
  } | null;
  verified_execution_lease_identity: {
    basis: "server_verified";
    execution_lease_ref: string;
    workflow_ref: string;
    action_authority_ref: string;
    participant_ref: string;
    source_ref: string;
    lease_expires_at: string;
    verification_ref: string;
  } | null;
  blocker_summary: string | null;
  observed_at: string;
  heartbeat_expires_at: string;
  active: boolean;
  credential_included: false;
  private_endpoint_included: false;
  hidden_reasoning_included: false;
  native_account_identity_included: false;
  content_role: "supervisor_presence_advisory";
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixLocalSupervisorRelay = {
  schema: typeof HELIX_LOCAL_SUPERVISOR_RELAY_SCHEMA;
  service_instance_ref: string;
  cursor: number;
  message_ref: string;
  client_message_ref: string;
  sender_client_session_ref: string;
  sender_profile_ref: string;
  target_client_session_ref: string;
  relay_type: z.infer<typeof helixLocalSupervisorRelayTypeSchema>;
  summary: string;
  resource_ref: string | null;
  room_ref: string | null;
  run_ref: string | null;
  created_at: string;
  expires_at: string;
  acknowledgement_ref: string | null;
  acknowledged_at: string | null;
  delivery_state: "pending" | "acknowledged" | "expired";
  advisory_only: true;
  execution_requested: false;
  authority_transfer: false;
  evidence_satisfied: false;
  credential_included: false;
  private_endpoint_included: false;
  hidden_reasoning_included: false;
  content_role: "supervisor_relay_advisory";
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixLocalSupervisorRecommendation = {
  schema: typeof HELIX_LOCAL_SUPERVISOR_RECOMMENDATION_SCHEMA;
  recommendation_ref: string;
  service_instance_ref: string;
  source_client_session_ref: string;
  target_client_session_ref: string;
  resource_ref: string;
  recommended_relay_type: "handoff_request" | "collision_notice";
  reason_code:
    | "waiting_for_verified_resource_owner"
    | "multiple_verified_retained_runtime_owners"
    | "multiple_verified_mutation_lease_holders";
  supporting_verification_refs: string[];
  derived_at: string;
  advisory_only: true;
  automatically_published: false;
  execution_requested: false;
  authority_transfer: false;
  evidence_satisfied: false;
  credential_included: false;
  private_endpoint_included: false;
  hidden_reasoning_included: false;
  content_role: "supervisor_coordination_recommendation_advisory";
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};
