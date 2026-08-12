import { z } from "zod";

export const HELIX_ENVIRONMENT_ACTION_AUTHORITY_SCHEMA =
  "helix.environment_action.authority.v1" as const;
export const HELIX_ENVIRONMENT_ACTION_AUTHORITY_RECEIPT_SCHEMA =
  "helix.environment_action.authority_receipt.v1" as const;
export const HELIX_ENVIRONMENT_ACTION_REQUEST_SCHEMA =
  "helix.environment_action.request.v1" as const;
export const HELIX_ENVIRONMENT_ACTION_WORKFLOW_EVENT_SCHEMA =
  "helix.environment_action.workflow_event.v1" as const;
export const HELIX_ENVIRONMENT_ACTION_PROGRESS_OBSERVATION_SCHEMA =
  "helix.environment_action.progress_observation.v1" as const;
export const HELIX_ENVIRONMENT_ACTION_RESULT_SCHEMA =
  "helix.environment_action.result.v1" as const;
export const HELIX_ENVIRONMENT_ACTION_OBSERVATION_SCHEMA =
  "helix.environment_action.observation.v1" as const;
export const HELIX_ENVIRONMENT_ACTION_CONTROL_REQUEST_SCHEMA =
  "helix.environment_action.control_request.v1" as const;
export const HELIX_ENVIRONMENT_ACTION_CONTROL_RESULT_SCHEMA =
  "helix.environment_action.control_result.v1" as const;
export const HELIX_ENVIRONMENT_ACTION_CONTROL_OBSERVATION_SCHEMA =
  "helix.environment_action.control_observation.v1" as const;
export const HELIX_ENVIRONMENT_ACTION_CONNECTOR_CONFIG_SCHEMA =
  "helix.environment_action.connector_config.v1" as const;
export const HELIX_ENVIRONMENT_ACTION_CONNECTOR_MANIFEST_SCHEMA =
  "helix.environment_action.connector_manifest.v1" as const;
export const HELIX_ENVIRONMENT_ACTION_CONNECTOR_HEARTBEAT_SCHEMA =
  "helix.environment_action.connector_heartbeat.v1" as const;
export const HELIX_ENVIRONMENT_ACTION_CONNECTOR_READINESS_SCHEMA =
  "helix.environment_action.connector_readiness.v1" as const;
export const HELIX_ENVIRONMENT_ACTION_DIFFERENTIAL_TRACE_SCHEMA =
  "helix.environment_action.differential_trace.v1" as const;
export const HELIX_ENVIRONMENT_ACTION_DIFFERENTIAL_AUDIT_SCHEMA =
  "helix.environment_action.differential_audit.v1" as const;
export const HELIX_ENVIRONMENT_CLOCK_SNAPSHOT_SCHEMA =
  "helix.environment_clock_snapshot.v1" as const;

export const HELIX_ENVIRONMENT_ACTION_AUTONOMY_MODES = [
  "approve_each",
  "approved_capabilities",
  "autonomous",
] as const;

export const HELIX_ENVIRONMENT_ACTION_MANUAL_OVERRIDE_POLICIES = [
  "pause",
  "cancel",
] as const;

export const HELIX_ENVIRONMENT_ACTION_EFFECT_CLASSES = [
  "player_motion",
  "player_interaction",
  "player_inventory",
  "world_mutation",
  "continuous_control",
] as const;

export const HELIX_ENVIRONMENT_ACTION_WORKFLOW_STATES = [
  "queued",
  "admitted",
  "running",
  "paused_manual_override",
  "cancel_requested",
  "canceled",
  "succeeded",
  "failed",
  "timed_out",
  "emergency_stopped",
  "connector_offline",
  "authority_stale",
] as const;

export const HELIX_ENVIRONMENT_ACTION_WORKFLOW_EVENT_TYPES = [
  "workflow.created",
  "workflow.admitted",
  "workflow.started",
  "workflow.progress",
  "workflow.manual_override_detected",
  "workflow.paused",
  "workflow.resumed",
  "workflow.cancel_requested",
  "workflow.canceled",
  "workflow.postcondition_checked",
  "workflow.succeeded",
  "workflow.failed",
  "workflow.timed_out",
  "workflow.emergency_stopped",
] as const;

export const HELIX_ENVIRONMENT_ACTION_OUTCOMES = [
  "succeeded",
  "failed",
  "rejected",
  "connector_offline",
  "workflow_timeout",
  "action_outcome_unknown",
  "request_canceled",
  "manual_override",
  "emergency_stopped",
  "authority_stale",
  "permission_revoked",
  "wrong_environment",
  "wrong_world",
  "subject_binding_required",
  "subject_binding_stale",
  "capability_unavailable",
  "capability_version_changed",
  "precondition_failed",
  "postcondition_failed",
  "control_engine_unavailable",
  "duplicate_request",
] as const;

export const HELIX_ENVIRONMENT_ACTION_CONTROL_ENGINES = [
  "native_fabric",
  "baritone",
] as const;

const identifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(320)
  .regex(/^[a-zA-Z0-9:._/-]+$/);
const sha256Schema = z.string().regex(/^sha256:[a-f0-9]{64}$/);
const timestampSchema = z.string().datetime({ offset: true });
const boundedSummarySchema = z.string().trim().min(1).max(4_000);
const environmentArgumentsSchema = z.record(z.string(), z.unknown());
const environmentMeasurementsSchema = environmentArgumentsSchema.superRefine(
  (measurements, context) => {
    if (Object.keys(measurements).length > 64) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Workflow measurement envelopes may contain at most 64 fields.",
      });
    }
  },
);

export const helixEnvironmentClockSnapshotSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_CLOCK_SNAPSHOT_SCHEMA),
    clock_id: identifierSchema,
    clock_kind: z.enum(["minecraft_game_tick", "environment_tick"]),
    tick_rate_hz: z.number().finite().positive().max(1_000),
    tick_index: z.number().int().nonnegative(),
    world_tick_index: z.number().int().nonnegative().nullable(),
    synchronization: z.enum([
      "server_synchronized",
      "client_local",
      "unknown",
    ]),
    observed_at: timestampSchema,
  })
  .strict()
  .superRefine((clock, context) => {
    if (
      clock.synchronization === "server_synchronized" &&
      clock.world_tick_index === null
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["world_tick_index"],
        message:
          "A server-synchronized environment clock requires the measured world tick.",
      });
    }
  });

export type HelixEnvironmentClockSnapshot = z.infer<
  typeof helixEnvironmentClockSnapshotSchema
>;

export const helixEnvironmentActionAutonomyModeSchema = z.enum(
  HELIX_ENVIRONMENT_ACTION_AUTONOMY_MODES,
);
export const helixEnvironmentActionManualOverridePolicySchema = z.enum(
  HELIX_ENVIRONMENT_ACTION_MANUAL_OVERRIDE_POLICIES,
);
export const helixEnvironmentActionEffectClassSchema = z.enum(
  HELIX_ENVIRONMENT_ACTION_EFFECT_CLASSES,
);
export const helixEnvironmentActionWorkflowStateSchema = z.enum(
  HELIX_ENVIRONMENT_ACTION_WORKFLOW_STATES,
);
export const helixEnvironmentActionWorkflowEventTypeSchema = z.enum(
  HELIX_ENVIRONMENT_ACTION_WORKFLOW_EVENT_TYPES,
);
export const helixEnvironmentActionOutcomeSchema = z.enum(
  HELIX_ENVIRONMENT_ACTION_OUTCOMES,
);

export type HelixEnvironmentActionAutonomyMode = z.infer<
  typeof helixEnvironmentActionAutonomyModeSchema
>;
export type HelixEnvironmentActionManualOverridePolicy = z.infer<
  typeof helixEnvironmentActionManualOverridePolicySchema
>;
export type HelixEnvironmentActionEffectClass = z.infer<
  typeof helixEnvironmentActionEffectClassSchema
>;
export type HelixEnvironmentActionWorkflowState = z.infer<
  typeof helixEnvironmentActionWorkflowStateSchema
>;
export type HelixEnvironmentActionOutcome = z.infer<
  typeof helixEnvironmentActionOutcomeSchema
>;

export type HelixEnvironmentActionControlEngine =
  (typeof HELIX_ENVIRONMENT_ACTION_CONTROL_ENGINES)[number];

export const HELIX_ENVIRONMENT_ACTION_DIFFERENTIAL_STAGES = [
  "fixture_identity",
  "capability_selection",
  "tool_admission",
  "tool_execution",
  "workflow_progress",
  "postcondition_verification",
  "evidence_reentry",
  "final_candidate",
  "route_product_materialization",
  "terminal_authority",
  "presentation",
] as const;

export type HelixEnvironmentActionDifferentialStage =
  (typeof HELIX_ENVIRONMENT_ACTION_DIFFERENTIAL_STAGES)[number];

export type HelixEnvironmentActionConnectorConfig = {
  schema: typeof HELIX_ENVIRONMENT_ACTION_CONNECTOR_CONFIG_SCHEMA;
  endpoint: string;
  bearer_token: string;
  action_authority_id: string;
  connector_installation_id: string;
  environment_binding_id: string;
  room_id: string;
  source_id: string;
  world_id: string;
  adapter_profile_id: string;
  domain_adapter: string;
  participant_id: string;
  subject_binding_id: string;
  subject_native_id: string;
  policy_version: number;
  action_execution_enabled: true;
  host_access_enabled: false;
  automatic_replay_enabled: false;
  emergency_stop_required: true;
  expires_at: string;
};

export const helixEnvironmentActionConnectorConfigSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_ACTION_CONNECTOR_CONFIG_SCHEMA),
    endpoint: z.string().url(),
    bearer_token: z.string().trim().min(32).max(512),
    action_authority_id: identifierSchema,
    connector_installation_id: identifierSchema,
    environment_binding_id: identifierSchema,
    room_id: identifierSchema,
    source_id: identifierSchema,
    world_id: identifierSchema,
    adapter_profile_id: identifierSchema,
    domain_adapter: identifierSchema,
    participant_id: identifierSchema,
    subject_binding_id: identifierSchema,
    subject_native_id: z.string().trim().min(1).max(240),
    policy_version: z.number().int().positive(),
    action_execution_enabled: z.literal(true),
    host_access_enabled: z.literal(false),
    automatic_replay_enabled: z.literal(false),
    emergency_stop_required: z.literal(true),
    expires_at: timestampSchema,
  })
  .strict();

const actionConnectorCapabilitySchema = z
  .object({
    capability_id: identifierSchema,
    capability_version: z.number().int().positive(),
    action_kind: identifierSchema,
    effect_class: helixEnvironmentActionEffectClassSchema,
    workflow_modes: z
      .array(z.enum(["single_action", "long_running"]))
      .min(1)
      .max(2),
    control_engines: z
      .array(z.enum(HELIX_ENVIRONMENT_ACTION_CONTROL_ENGINES))
      .min(1)
      .max(2),
    requires_world_mutation_scope: z.boolean(),
    requires_confirmation: z.boolean(),
  })
  .strict();

export const helixEnvironmentActionConnectorManifestSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_ACTION_CONNECTOR_MANIFEST_SCHEMA),
    manifest_id: identifierSchema,
    connector_installation_id: identifierSchema,
    producer_epoch_ref: identifierSchema,
    action_authority_id: identifierSchema,
    environment_binding_id: identifierSchema,
    room_id: identifierSchema,
    source_id: identifierSchema,
    world_id: identifierSchema,
    participant_id: identifierSchema,
    subject_binding_id: identifierSchema,
    subject_native_id: z.string().trim().min(1).max(240),
    domain: identifierSchema,
    domain_adapter: identifierSchema,
    adapter_profile_id: identifierSchema,
    adapter_version: z.string().trim().min(1).max(80),
    protocol_version: z.string().trim().min(1).max(160),
    capabilities: z.array(actionConnectorCapabilitySchema).min(1).max(128),
    available_control_engines: z
      .array(
        z
          .object({
            control_engine: z.enum(HELIX_ENVIRONMENT_ACTION_CONTROL_ENGINES),
            available: z.boolean(),
            version: z.string().trim().min(1).max(80).nullable(),
          })
          .strict(),
      )
      .min(1)
      .max(2),
    safety_policy: z
      .object({
        manual_override_supported: z.literal(true),
        manual_override_policy: helixEnvironmentActionManualOverridePolicySchema,
        progress_observations_supported: z.literal(true),
        postcondition_verification_supported: z.literal(true),
        emergency_stop_supported: z.literal(true),
        release_controls_on_disconnect: z.literal(true),
        host_access_supported: z.literal(false),
        automatic_replay_supported: z.literal(false),
        model_execution_supported: z.literal(false),
      })
      .strict(),
    created_at: timestampSchema,
    credential_included: z.literal(false),
    content_role: z.literal(
      "environment_action_connector_manifest_not_assistant_answer",
    ),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict()
  .superRefine((manifest, context) => {
    const capabilityKeys = new Set<string>();
    for (const [index, capability] of manifest.capabilities.entries()) {
      const key = `${capability.capability_id}@${capability.capability_version}`;
      if (capabilityKeys.has(key)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["capabilities", index, "capability_id"],
          message: "Connector capability identities must be unique per version.",
        });
      }
      capabilityKeys.add(key);
      if (
        capability.effect_class === "world_mutation" &&
        !capability.requires_world_mutation_scope
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["capabilities", index, "requires_world_mutation_scope"],
          message: "World-mutation capabilities must require an explicit scope.",
        });
      }
    }

    const engines = new Map(
      manifest.available_control_engines.map((engine) => [
        engine.control_engine,
        engine.available,
      ]),
    );
    for (const [index, capability] of manifest.capabilities.entries()) {
      for (const controlEngine of capability.control_engines) {
        if (engines.get(controlEngine) !== true) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["capabilities", index, "control_engines"],
            message: `Capability declares unavailable control engine ${controlEngine}.`,
          });
        }
      }
    }
  });

export type HelixEnvironmentActionConnectorManifest = z.infer<
  typeof helixEnvironmentActionConnectorManifestSchema
>;

export const helixEnvironmentActionConnectorHeartbeatSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_ACTION_CONNECTOR_HEARTBEAT_SCHEMA),
    heartbeat_id: identifierSchema,
    manifest_id: identifierSchema,
    connector_installation_id: identifierSchema,
    producer_epoch_ref: identifierSchema,
    action_authority_id: identifierSchema,
    environment_binding_id: identifierSchema,
    room_id: identifierSchema,
    source_id: identifierSchema,
    world_id: identifierSchema,
    participant_id: identifierSchema,
    subject_binding_id: identifierSchema,
    status: z.enum(["active", "degraded", "paused", "stale", "error"]),
    active_workflow_ids: z.array(identifierSchema).max(32),
    controls_asserted: z.boolean(),
    manual_input_detected: z.boolean(),
    emergency_stop_latched: z.boolean(),
    control_engines: z
      .array(
        z
          .object({
            control_engine: z.enum(HELIX_ENVIRONMENT_ACTION_CONTROL_ENGINES),
            status: z.enum(["available", "busy", "unavailable", "error"]),
            last_error: z.string().trim().min(1).max(1_000).nullable(),
          })
          .strict(),
      )
      .min(1)
      .max(2),
    latest_event_sequence: z.number().int().nonnegative().nullable(),
    clock: helixEnvironmentClockSnapshotSchema.nullable().optional(),
    evidence_refs: z.array(identifierSchema).max(128),
    created_at: timestampSchema,
    credential_included: z.literal(false),
    content_role: z.literal(
      "environment_action_connector_heartbeat_not_assistant_answer",
    ),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict()
  .superRefine((heartbeat, context) => {
    if (heartbeat.controls_asserted && heartbeat.active_workflow_ids.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["controls_asserted"],
        message: "A connector may assert controls only for an identified active workflow.",
      });
    }
    if (heartbeat.emergency_stop_latched && heartbeat.controls_asserted) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["controls_asserted"],
        message: "An emergency-stopped connector cannot retain asserted controls.",
      });
    }
  });

export type HelixEnvironmentActionConnectorHeartbeat = z.infer<
  typeof helixEnvironmentActionConnectorHeartbeatSchema
>;

export const helixEnvironmentActionConnectorReadinessSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_ACTION_CONNECTOR_READINESS_SCHEMA),
    action_authority_id: identifierSchema,
    state: z.enum([
      "authority_inactive",
      "awaiting_manifest",
      "awaiting_heartbeat",
      "ready",
      "degraded",
      "paused",
      "stale",
      "error",
      "emergency_stopped",
    ]),
    ready_for_actions: z.boolean(),
    manifest_admitted: z.boolean(),
    manifest_received_at: timestampSchema.nullable(),
    declared_capability_count: z.number().int().nonnegative().max(128),
    available_control_engines: z
      .array(z.enum(HELIX_ENVIRONMENT_ACTION_CONTROL_ENGINES))
      .max(2),
    heartbeat_status: z
      .enum(["active", "degraded", "paused", "stale", "error"])
      .nullable(),
    heartbeat_fresh: z.boolean(),
    heartbeat_received_at: timestampSchema.nullable(),
    heartbeat_max_age_ms: z.number().int().positive().max(5 * 60_000),
    active_workflow_count: z.number().int().nonnegative().max(128),
    controls_asserted: z.boolean(),
    manual_input_detected: z.boolean(),
    emergency_stop_latched: z.boolean(),
    blocking_reason: z.string().trim().min(1).max(160).nullable().default(null),
    credential_included: z.literal(false),
    content_role: z.literal(
      "environment_action_connector_readiness_not_assistant_answer",
    ),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict()
  .superRefine((readiness, context) => {
    if (readiness.ready_for_actions !== (readiness.state === "ready")) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ready_for_actions"],
        message: "Only a ready connector may be projected as action-ready.",
      });
    }
    if (readiness.ready_for_actions && readiness.blocking_reason !== null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["blocking_reason"],
        message: "An action-ready connector cannot retain a blocking reason.",
      });
    }
    if (!readiness.manifest_admitted) {
      if (
        readiness.manifest_received_at !== null ||
        readiness.declared_capability_count !== 0 ||
        readiness.available_control_engines.length !== 0
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["manifest_admitted"],
          message: "Manifest details require a current admitted manifest.",
        });
      }
    }
    if (readiness.heartbeat_status === null) {
      if (
        readiness.heartbeat_fresh ||
        readiness.heartbeat_received_at !== null ||
        readiness.active_workflow_count !== 0 ||
        readiness.controls_asserted ||
        readiness.manual_input_detected ||
        readiness.emergency_stop_latched
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["heartbeat_status"],
          message: "Heartbeat details require a recorded heartbeat.",
        });
      }
    }
  });

export type HelixEnvironmentActionConnectorReadiness = z.infer<
  typeof helixEnvironmentActionConnectorReadinessSchema
>;

export const helixEnvironmentActionAuthoritySchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_ACTION_AUTHORITY_SCHEMA),
    action_authority_id: identifierSchema,
    environment_binding_id: identifierSchema,
    room_source_binding_id: identifierSchema,
    room_id: identifierSchema,
    source_id: identifierSchema,
    world_id: identifierSchema,
    adapter_profile_id: identifierSchema,
    domain_adapter: identifierSchema,
    participant_id: identifierSchema,
    subject_binding_id: identifierSchema,
    allowed_capability_ids: z.array(identifierSchema).min(1).max(128),
    autonomy_mode: helixEnvironmentActionAutonomyModeSchema,
    manual_override_policy: helixEnvironmentActionManualOverridePolicySchema,
    status: z.enum(["active", "suspended", "revoked", "expired"]),
    policy_version: z.number().int().positive(),
    issued_at: timestampSchema,
    expires_at: timestampSchema.nullable(),
    revoked_at: timestampSchema.nullable(),
    credential_included: z.literal(false),
    content_role: z.literal("environment_action_authority_not_assistant_answer"),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict();

export type HelixEnvironmentActionAuthority = z.infer<
  typeof helixEnvironmentActionAuthoritySchema
>;

export const helixEnvironmentActionAuthoritySettingsSchema = z
  .object({
    participant_id: identifierSchema,
    domain_adapter: identifierSchema,
    allowed_capability_ids: z.array(identifierSchema).min(1).max(128),
    autonomy_mode: helixEnvironmentActionAutonomyModeSchema,
    manual_override_policy: helixEnvironmentActionManualOverridePolicySchema,
    expires_at: timestampSchema.nullable().default(null),
  })
  .strict()
  .superRefine((settings, context) => {
    const capabilities = new Set(settings.allowed_capability_ids);
    if (capabilities.size !== settings.allowed_capability_ids.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["allowed_capability_ids"],
        message: "Allowed player capabilities must be unique.",
      });
    }
  });

export type HelixEnvironmentActionAuthoritySettings = z.infer<
  typeof helixEnvironmentActionAuthoritySettingsSchema
>;

export type HelixEnvironmentActionAuthorityReceipt = {
  schema: typeof HELIX_ENVIRONMENT_ACTION_AUTHORITY_RECEIPT_SCHEMA;
  ok: boolean;
  error: string | null;
  message: string;
  authority: HelixEnvironmentActionAuthority | null;
  authorities?: HelixEnvironmentActionAuthority[];
  connector_readiness?: HelixEnvironmentActionConnectorReadiness[];
  emergency_control_request?: HelixEnvironmentActionControlRequest | null;
  action_credential_included: false;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export const helixEnvironmentActionConditionSchema = z
  .object({
    condition_id: identifierSchema,
    condition_kind: identifierSchema,
    required: z.boolean(),
    parameters: environmentArgumentsSchema,
  })
  .strict();

export type HelixEnvironmentActionCondition = z.infer<
  typeof helixEnvironmentActionConditionSchema
>;

export const helixEnvironmentActionRequestSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_ACTION_REQUEST_SCHEMA),
    action_request_id: identifierSchema,
    workflow_id: identifierSchema,
    action_authority_id: identifierSchema,
    environment_binding_id: identifierSchema,
    room_id: identifierSchema,
    source_id: identifierSchema,
    world_id: identifierSchema,
    participant_id: identifierSchema,
    subject_binding_id: identifierSchema,
    subject_native_id: z.string().trim().min(1).max(240),
    run_id: identifierSchema,
    turn_id: identifierSchema,
    provider_execution_id: identifierSchema,
    tool_call_id: identifierSchema,
    catalog_snapshot_id: identifierSchema,
    capability_id: identifierSchema,
    capability_version: z.number().int().positive(),
    action_kind: identifierSchema,
    effect_class: helixEnvironmentActionEffectClassSchema,
    workflow_mode: z.enum(["single_action", "long_running"]),
    requested_control_engine: z.enum([
      "adapter_selected",
      "native_fabric",
      "baritone",
    ]),
    arguments: environmentArgumentsSchema,
    preconditions: z.array(helixEnvironmentActionConditionSchema).max(64),
    postconditions: z.array(helixEnvironmentActionConditionSchema).min(1).max(64),
    idempotency_key: z.string().trim().min(8).max(320),
    confirmation_state: z.enum([
      "not_required",
      "pending",
      "approved",
      "rejected",
    ]),
    approval_ref: identifierSchema.nullable(),
    created_at: timestampSchema,
    deadline_at: timestampSchema,
    constraints: z
      .object({
        max_duration_ms: z.number().int().positive().max(30 * 60_000),
        max_distance_blocks: z.number().finite().positive().max(30_000_000),
        max_block_mutations: z.number().int().nonnegative().max(100_000),
        max_inventory_transfers: z.number().int().nonnegative().max(10_000),
        manual_override_policy: helixEnvironmentActionManualOverridePolicySchema,
        require_postcondition_verification: z.literal(true),
        world_mutation_allowed: z.boolean(),
        combat_allowed: z.boolean(),
        host_access_allowed: z.literal(false),
        automatic_replay_allowed: z.literal(false),
      })
      .strict(),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict()
  .superRefine((request, context) => {
    if (
      request.effect_class === "world_mutation" &&
      !request.constraints.world_mutation_allowed
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["constraints", "world_mutation_allowed"],
        message: "World mutation actions require an explicitly admitted mutation scope.",
      });
    }
    if (
      request.confirmation_state === "approved" &&
      request.approval_ref === null
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["approval_ref"],
        message: "Approved actions require an approval reference.",
      });
    }
    if (
      request.confirmation_state !== "approved" &&
      request.confirmation_state !== "not_required" &&
      request.approval_ref !== null
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["approval_ref"],
        message: "Only approved actions may carry an approval reference.",
      });
    }
  });

export type HelixEnvironmentActionRequest = z.infer<
  typeof helixEnvironmentActionRequestSchema
>;

export const helixEnvironmentActionWorkflowEventSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_ACTION_WORKFLOW_EVENT_SCHEMA),
    event_id: identifierSchema,
    action_request_id: identifierSchema,
    workflow_id: identifierSchema,
    sequence: z.number().int().nonnegative(),
    event_type: helixEnvironmentActionWorkflowEventTypeSchema,
    workflow_state: helixEnvironmentActionWorkflowStateSchema,
    progress_fraction: z.number().finite().min(0).max(1).nullable(),
    summary: boundedSummarySchema,
    control_engine: z.enum(["native_fabric", "baritone", "none"]),
    measurements: environmentMeasurementsSchema.default({}),
    clock: helixEnvironmentClockSnapshotSchema.optional(),
    evidence_refs: z.array(identifierSchema).max(128),
    manual_override_detected: z.boolean(),
    controls_released: z.boolean(),
    created_at: timestampSchema,
    content_role: z.literal("environment_action_event_not_assistant_answer"),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict()
  .superRefine((event, context) => {
    if (
      event.event_type === "workflow.manual_override_detected" &&
      !event.manual_override_detected
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["manual_override_detected"],
        message: "Manual-override events must record that input was detected.",
      });
    }
    if (
      ["canceled", "emergency_stopped", "succeeded", "failed", "timed_out"].includes(
        event.workflow_state,
      ) &&
      !event.controls_released
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["controls_released"],
        message: "Terminal workflow events must release all client controls.",
      });
    }
  });

export type HelixEnvironmentActionWorkflowEvent = z.infer<
  typeof helixEnvironmentActionWorkflowEventSchema
>;

export const helixEnvironmentActionProgressObservationSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_ACTION_PROGRESS_OBSERVATION_SCHEMA),
    action_request_ref: identifierSchema,
    workflow_ref: identifierSchema,
    event_ref: identifierSchema,
    sequence: z.number().int().nonnegative(),
    workflow_state: helixEnvironmentActionWorkflowStateSchema,
    progress_fraction: z.number().finite().min(0).max(1).nullable(),
    summary: boundedSummarySchema,
    evidence_refs: z.array(identifierSchema).max(128),
    observed_at: timestampSchema,
    provenance_valid: z.boolean(),
    content_role: z.literal(
      "environment_action_progress_observation_not_assistant_answer",
    ),
    reentry_required: z.literal(false),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict();

export type HelixEnvironmentActionProgressObservation = z.infer<
  typeof helixEnvironmentActionProgressObservationSchema
>;

export const helixEnvironmentActionPostconditionResultSchema = z
  .object({
    condition_id: identifierSchema,
    condition_kind: identifierSchema,
    required: z.boolean(),
    status: z.enum(["satisfied", "not_satisfied", "unknown", "not_checked"]),
    summary: boundedSummarySchema,
    evidence_refs: z.array(identifierSchema).max(128),
    checked_at: timestampSchema,
  })
  .strict();

export const helixEnvironmentActionResultSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_ACTION_RESULT_SCHEMA),
    action_request_id: identifierSchema,
    workflow_id: identifierSchema,
    action_execution_id: identifierSchema,
    capability_id: identifierSchema,
    capability_version: z.number().int().positive(),
    action_kind: identifierSchema,
    outcome: helixEnvironmentActionOutcomeSchema,
    summary: boundedSummarySchema,
    control_engine: z.enum(["native_fabric", "baritone", "none"]),
    started_at: timestampSchema.nullable(),
    completed_at: timestampSchema,
    progress_event_refs: z.array(identifierSchema).max(1_024),
    postconditions: z.array(helixEnvironmentActionPostconditionResultSchema).min(1).max(64),
    evidence_refs: z.array(identifierSchema).max(256),
    verified_terminal_measurements: environmentMeasurementsSchema.default({}),
    started_clock: helixEnvironmentClockSnapshotSchema.nullable().optional(),
    completed_clock: helixEnvironmentClockSnapshotSchema.optional(),
    duration_ticks: z.number().int().nonnegative().nullable().optional(),
    side_effects_performed: z.boolean(),
    player_motion_performed: z.boolean(),
    player_interaction_performed: z.boolean(),
    inventory_mutation_performed: z.boolean(),
    world_mutation_performed: z.boolean(),
    manual_override_detected: z.boolean(),
    manual_override_reason: z
      .enum([
        "screen_open",
        "left_mouse_pressed",
        "middle_mouse_pressed",
        "right_mouse_pressed",
        "forward_key_pressed",
        "back_key_pressed",
        "left_key_pressed",
        "right_key_pressed",
        "jump_key_pressed",
        "sprint_key_pressed",
        "unexpected_view_change",
        "unspecified_manual_input",
      ])
      .nullable()
      .optional(),
    controls_released: z.boolean(),
    host_access_performed: z.literal(false),
    automatic_replay_performed: z.literal(false),
    model_invoked: z.literal(false),
    assistant_answer: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict()
  .superRefine((result, context) => {
    if (!result.controls_released) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["controls_released"],
        message: "Every settled workflow must release all client controls.",
      });
    }
    if (result.outcome === "succeeded") {
      for (const [index, condition] of result.postconditions.entries()) {
        if (condition.required && condition.status !== "satisfied") {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["postconditions", index, "status"],
            message: "A successful workflow requires every required postcondition to be satisfied.",
          });
        }
      }
      if (result.started_at === null) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["started_at"],
          message: "A successful workflow must prove that execution started.",
        });
      }
    }
    if (result.started_clock && result.completed_clock) {
      if (result.started_clock.clock_id !== result.completed_clock.clock_id) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["completed_clock", "clock_id"],
          message: "Workflow timing must use one continuous environment clock.",
        });
      }
      const measuredDuration =
        result.completed_clock.tick_index - result.started_clock.tick_index;
      if (measuredDuration < 0 || result.duration_ticks !== measuredDuration) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["duration_ticks"],
          message:
            "Workflow duration ticks must equal the measured completed/start tick delta.",
        });
      }
    } else if (result.duration_ticks != null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["duration_ticks"],
        message:
          "Workflow duration ticks require both started and completed clock snapshots.",
      });
    }
  });

export type HelixEnvironmentActionResult = z.infer<
  typeof helixEnvironmentActionResultSchema
>;

export const helixEnvironmentActionObservationSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_ACTION_OBSERVATION_SCHEMA),
    action_request_ref: identifierSchema,
    workflow_ref: identifierSchema,
    action_execution_ref: identifierSchema.nullable(),
    capability_id: identifierSchema,
    capability_version: z.number().int().positive(),
    action_kind: identifierSchema,
    outcome: helixEnvironmentActionOutcomeSchema,
    summary: boundedSummarySchema,
    result: environmentArgumentsSchema,
    progress_observation_refs: z.array(identifierSchema).max(1_024),
    postcondition_evidence_refs: z.array(identifierSchema).max(256),
    evidence_ref: identifierSchema,
    observed_at: timestampSchema,
    provenance_valid: z.boolean(),
    eligible_for_current_turn_reentry: z.boolean(),
    content_role: z.literal("environment_action_observation_not_assistant_answer"),
    reentry_required: z.literal(true),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict();

export type HelixEnvironmentActionObservation = z.infer<
  typeof helixEnvironmentActionObservationSchema
>;

export const helixEnvironmentActionControlRequestSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_ACTION_CONTROL_REQUEST_SCHEMA),
    control_request_id: identifierSchema,
    control_kind: z.enum(["status", "resume", "cancel", "emergency_stop"]),
    action_authority_id: identifierSchema,
    environment_binding_id: identifierSchema,
    room_id: identifierSchema,
    source_id: identifierSchema,
    world_id: identifierSchema,
    participant_id: identifierSchema,
    subject_binding_id: identifierSchema,
    workflow_id: identifierSchema.nullable(),
    reason: z.string().trim().min(1).max(1_000),
    release_all_controls: z.boolean(),
    created_at: timestampSchema,
    deadline_at: timestampSchema,
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict()
  .superRefine((request, context) => {
    if (
      ["status", "resume", "cancel"].includes(request.control_kind) &&
      request.workflow_id === null
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["workflow_id"],
        message: "Workflow status, resume, and cancel controls require an exact workflow identity.",
      });
    }
    if (
      (request.control_kind === "cancel" || request.control_kind === "emergency_stop") &&
      !request.release_all_controls
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["release_all_controls"],
        message: "Cancellation and emergency stop must release all client controls.",
      });
    }
  });

export type HelixEnvironmentActionControlRequest = z.infer<
  typeof helixEnvironmentActionControlRequestSchema
>;

export const helixEnvironmentActionControlResultSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_ACTION_CONTROL_RESULT_SCHEMA),
    control_request_id: identifierSchema,
    control_kind: z.enum(["status", "resume", "cancel", "emergency_stop"]),
    outcome: z.enum(["completed", "not_running", "forbidden", "stale", "failed"]),
    summary: boundedSummarySchema,
    affected_workflow_ids: z.array(identifierSchema).max(256),
    workflow_state: helixEnvironmentActionWorkflowStateSchema.nullable(),
    controls_released: z.boolean(),
    evidence_refs: z.array(identifierSchema).max(128),
    completed_at: timestampSchema,
    host_access_performed: z.literal(false),
    model_invoked: z.literal(false),
    assistant_answer: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict()
  .superRefine((result, context) => {
    if (
      (result.control_kind === "cancel" || result.control_kind === "emergency_stop") &&
      result.outcome === "completed" &&
      !result.controls_released
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["controls_released"],
        message: "Completed cancellation must prove that all controls were released.",
      });
    }
  });

export type HelixEnvironmentActionControlResult = z.infer<
  typeof helixEnvironmentActionControlResultSchema
>;

export const helixEnvironmentActionControlObservationSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_ACTION_CONTROL_OBSERVATION_SCHEMA),
    control_request_ref: identifierSchema,
    workflow_ref: identifierSchema.nullable(),
    control_kind: z.enum(["status", "resume", "cancel", "emergency_stop"]),
    outcome: z.enum(["completed", "not_running", "forbidden", "stale", "failed"]),
    summary: boundedSummarySchema,
    affected_workflow_refs: z.array(identifierSchema).max(256),
    workflow_state: helixEnvironmentActionWorkflowStateSchema.nullable(),
    controls_released: z.boolean(),
    evidence_refs: z.array(identifierSchema).max(128),
    evidence_ref: identifierSchema,
    observed_at: timestampSchema,
    provenance_valid: z.boolean(),
    eligible_for_current_turn_reentry: z.boolean(),
    content_role: z.literal(
      "environment_action_control_observation_not_assistant_answer",
    ),
    reentry_required: z.literal(true),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict();

export type HelixEnvironmentActionControlObservation = z.infer<
  typeof helixEnvironmentActionControlObservationSchema
>;

export const helixEnvironmentActionDifferentialTraceSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_ACTION_DIFFERENTIAL_TRACE_SCHEMA),
    trace_id: identifierSchema,
    scenario_id: identifierSchema,
    lane: z.enum(["direct_codex", "helix"]),
    action_kind: identifierSchema,
    prompt_hash: sha256Schema,
    starting_state_hash: sha256Schema,
    capability_contract_hash: sha256Schema,
    source_artifact_refs: z.array(identifierSchema).min(1).max(128),
    public_capture_hash: sha256Schema,
    selected_capability_id: identifierSchema.nullable(),
    normalized_arguments_hash: sha256Schema.nullable(),
    admission_status: z.enum([
      "admitted",
      "rejected",
      "not_observed",
      "not_applicable",
    ]),
    execution_outcome: z.union([
      helixEnvironmentActionOutcomeSchema,
      z.literal("not_run"),
    ]),
    normalized_progress_hashes: z.array(sha256Schema).max(1_024),
    postcondition_status: z.enum([
      "satisfied",
      "not_satisfied",
      "unknown",
      "not_checked",
      "not_applicable",
    ]),
    observation_refs: z.array(identifierSchema).max(128),
    observation_reentered: z.boolean(),
    final_candidate_hash: sha256Schema.nullable(),
    final_candidate_support_refs: z.array(identifierSchema).max(128),
    route_product_hash: sha256Schema.nullable(),
    route_product_support_refs: z.array(identifierSchema).max(128),
    terminal_outcome: z.enum([
      "success",
      "typed_failure",
      "blocked",
      "unknown",
      "not_applicable",
    ]),
    terminal_authority_status: z.enum([
      "passed",
      "failed_closed",
      "failed",
      "not_observed",
      "not_applicable",
    ]),
    terminal_writer_hash: sha256Schema.nullable(),
    terminal_writer_support_refs: z.array(identifierSchema).max(128),
    visible_text_hash: sha256Schema.nullable(),
    voice_projection_status: z.enum([
      "consistent",
      "inconsistent",
      "not_observed",
      "not_applicable",
    ]),
    voice_text_hash: sha256Schema.nullable(),
    created_at: timestampSchema,
    hidden_reasoning_included: z.literal(false),
    content_role: z.literal(
      "environment_action_differential_trace_not_assistant_answer",
    ),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict();

export type HelixEnvironmentActionDifferentialTrace = z.infer<
  typeof helixEnvironmentActionDifferentialTraceSchema
>;

export const helixEnvironmentActionDifferentialAuditSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_ACTION_DIFFERENTIAL_AUDIT_SCHEMA),
    audit_id: identifierSchema,
    scenario_id: identifierSchema,
    action_kind: identifierSchema,
    ok: z.boolean(),
    first_divergence_stage: z.enum(
      HELIX_ENVIRONMENT_ACTION_DIFFERENTIAL_STAGES,
    ).nullable(),
    mismatches: z.array(z.object({
      stage: z.enum(HELIX_ENVIRONMENT_ACTION_DIFFERENTIAL_STAGES),
      code: identifierSchema,
      reference_value: z.string().max(4_000).nullable(),
      helix_value: z.string().max(4_000).nullable(),
    }).strict()).max(128),
    reference_trace_ref: identifierSchema,
    helix_trace_ref: identifierSchema,
    compared_at: timestampSchema,
    observer_only: z.literal(true),
    hidden_reasoning_included: z.literal(false),
    content_role: z.literal(
      "environment_action_differential_audit_not_assistant_answer",
    ),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict();

export type HelixEnvironmentActionDifferentialAudit = z.infer<
  typeof helixEnvironmentActionDifferentialAuditSchema
>;

export const environmentActionRequestFingerprint = (
  request: Pick<
    HelixEnvironmentActionRequest,
    | "capability_id"
    | "capability_version"
    | "action_kind"
    | "arguments"
    | "subject_binding_id"
    | "world_id"
  >,
): string =>
  JSON.stringify({
    capability_id: request.capability_id,
    capability_version: request.capability_version,
    action_kind: request.action_kind,
    arguments: request.arguments,
    subject_binding_id: request.subject_binding_id,
    world_id: request.world_id,
  });

export const environmentActionPayloadSha256Schema = sha256Schema;
