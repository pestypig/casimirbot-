import { z } from "zod";

export const HELIX_ENVIRONMENT_COMMAND_AUTHORITY_SCHEMA =
  "helix.environment_command.authority.v1" as const;
export const HELIX_ENVIRONMENT_COMMAND_MEMBER_GRANT_SCHEMA =
  "helix.environment_command.member_grant.v1" as const;
export const HELIX_ENVIRONMENT_COMMAND_CATALOG_PAGE_SCHEMA =
  "helix.environment_command.catalog_page.v1" as const;
export const HELIX_ENVIRONMENT_COMMAND_CATALOG_OBSERVATION_SCHEMA =
  "helix.environment_command.catalog_observation.v1" as const;
export const HELIX_ENVIRONMENT_COMMAND_REQUEST_SCHEMA =
  "helix.environment_command.request.v1" as const;
export const HELIX_ENVIRONMENT_COMMAND_RESULT_SCHEMA =
  "helix.environment_command.result.v1" as const;
export const HELIX_ENVIRONMENT_COMMAND_OBSERVATION_SCHEMA =
  "helix.environment_command.observation.v1" as const;
export const HELIX_ENVIRONMENT_COMMAND_AUTHORITY_RECEIPT_SCHEMA =
  "helix.environment_command.authority_receipt.v1" as const;
export const HELIX_MINECRAFT_COMMAND_CAPABILITY =
  "com.casimirbot.minecraft.command" as const;
export const HELIX_MINECRAFT_COMMAND_CATALOG_CAPABILITY =
  "com.casimirbot.minecraft.command.catalog" as const;

export type HelixEnvironmentCommandConnectorConfig = {
  schema: "helix.environment_command.connector_config.v1";
  endpoint: string;
  bearer_token: string;
  command_authority_id: string;
  environment_binding_id: string;
  room_id: string;
  source_id: string;
  world_id: string;
  adapter_profile_id: string;
  domain_adapter: string;
  policy_version: number;
  command_execution_enabled: true;
  host_access_enabled: false;
  automatic_retry_enabled: false;
  expires_at: string;
};

export const HELIX_ENVIRONMENT_COMMAND_AUTHORITY_PROFILES = [
  "observe",
  "player_assistant",
  "world_operator",
  "server_administrator",
] as const;

export const HELIX_ENVIRONMENT_COMMAND_AUTONOMY_MODES = [
  "approve_each",
  "approved_categories",
  "autonomous",
] as const;

export const HELIX_ENVIRONMENT_COMMAND_CATEGORIES = [
  "query",
  "player_state",
  "player_inventory",
  "player_movement",
  "world_time_weather",
  "world_build",
  "entity_control",
  "server_administration",
  "mod_command",
] as const;

export const HELIX_ENVIRONMENT_COMMAND_EFFECT_CLASSES = [
  "read_only",
  "player_mutation",
  "world_mutation",
  "server_administration",
  "unknown",
] as const;

const identifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(320)
  .regex(/^[a-zA-Z0-9:._/-]+$/);
const sha256Schema = z.string().regex(/^sha256:[a-f0-9]{64}$/);
const timestampSchema = z.string().datetime({ offset: true });

export const helixEnvironmentCommandAuthorityProfileSchema = z.enum(
  HELIX_ENVIRONMENT_COMMAND_AUTHORITY_PROFILES,
);
export type HelixEnvironmentCommandAuthorityProfile = z.infer<
  typeof helixEnvironmentCommandAuthorityProfileSchema
>;

export const helixEnvironmentCommandAutonomyModeSchema = z.enum(
  HELIX_ENVIRONMENT_COMMAND_AUTONOMY_MODES,
);
export type HelixEnvironmentCommandAutonomyMode = z.infer<
  typeof helixEnvironmentCommandAutonomyModeSchema
>;

export const helixEnvironmentCommandCategorySchema = z.enum(
  HELIX_ENVIRONMENT_COMMAND_CATEGORIES,
);
export type HelixEnvironmentCommandCategory = z.infer<
  typeof helixEnvironmentCommandCategorySchema
>;

export const helixEnvironmentCommandEffectClassSchema = z.enum(
  HELIX_ENVIRONMENT_COMMAND_EFFECT_CLASSES,
);
export type HelixEnvironmentCommandEffectClass = z.infer<
  typeof helixEnvironmentCommandEffectClassSchema
>;

export const helixEnvironmentCommandAuthoritySchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_COMMAND_AUTHORITY_SCHEMA),
    command_authority_id: identifierSchema,
    environment_binding_id: identifierSchema,
    room_source_binding_id: identifierSchema,
    room_id: identifierSchema,
    source_id: identifierSchema,
    world_id: identifierSchema,
    adapter_profile_id: identifierSchema,
    authority_profile: helixEnvironmentCommandAuthorityProfileSchema,
    autonomy_mode: helixEnvironmentCommandAutonomyModeSchema,
    approved_categories: z
      .array(helixEnvironmentCommandCategorySchema)
      .max(HELIX_ENVIRONMENT_COMMAND_CATEGORIES.length),
    status: z.enum(["active", "suspended", "revoked", "expired"]),
    policy_version: z.number().int().positive(),
    issued_at: timestampSchema,
    expires_at: timestampSchema.nullable(),
    revoked_at: timestampSchema.nullable(),
    credential_included: z.literal(false),
    content_role: z.literal("environment_command_authority_not_assistant_answer"),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict()
  .superRefine((authority, context) => {
    if (
      authority.autonomy_mode === "approved_categories" &&
      authority.approved_categories.length === 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["approved_categories"],
        message: "Category-approved autonomy requires at least one category.",
      });
    }
    if (
      authority.authority_profile === "observe" &&
      authority.approved_categories.some((category) => category !== "query")
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["approved_categories"],
        message: "Observe authority may approve only query commands.",
      });
    }
  });

export type HelixEnvironmentCommandAuthority = z.infer<
  typeof helixEnvironmentCommandAuthoritySchema
>;

export const helixEnvironmentCommandMemberGrantSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_COMMAND_MEMBER_GRANT_SCHEMA),
    command_grant_id: identifierSchema,
    command_authority_id: identifierSchema,
    room_id: identifierSchema,
    participant_id: identifierSchema,
    environment_binding_id: identifierSchema,
    subject_binding_id: identifierSchema.nullable(),
    max_authority_profile: helixEnvironmentCommandAuthorityProfileSchema,
    autonomy_override: helixEnvironmentCommandAutonomyModeSchema.nullable(),
    status: z.enum(["active", "suspended", "revoked", "expired"]),
    issued_at: timestampSchema,
    expires_at: timestampSchema.nullable(),
    revoked_at: timestampSchema.nullable(),
    content_role: z.literal("environment_command_member_grant_not_assistant_answer"),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict();

export type HelixEnvironmentCommandMemberGrant = z.infer<
  typeof helixEnvironmentCommandMemberGrantSchema
>;

export const helixEnvironmentCommandAuthoritySettingsSchema = z
  .object({
    authority_profile: helixEnvironmentCommandAuthorityProfileSchema,
    autonomy_mode: helixEnvironmentCommandAutonomyModeSchema,
    approved_categories: z
      .array(helixEnvironmentCommandCategorySchema)
      .max(HELIX_ENVIRONMENT_COMMAND_CATEGORIES.length)
      .default([]),
    expires_at: timestampSchema.nullable().default(null),
  })
  .strict()
  .superRefine((settings, context) => {
    if (
      settings.autonomy_mode === "approved_categories" &&
      settings.approved_categories.length === 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["approved_categories"],
        message: "Category-approved autonomy requires at least one category.",
      });
    }
  });

export const helixEnvironmentCommandMemberGrantRequestSchema = z
  .object({
    max_authority_profile: helixEnvironmentCommandAuthorityProfileSchema,
    autonomy_override: helixEnvironmentCommandAutonomyModeSchema
      .nullable()
      .default(null),
    expires_at: timestampSchema.nullable().default(null),
  })
  .strict();

export const helixEnvironmentCommandAuthorityReceiptSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_COMMAND_AUTHORITY_RECEIPT_SCHEMA),
    ok: z.boolean(),
    error: z.string().nullable(),
    message: z.string().trim().min(1).max(2_000),
    authority: helixEnvironmentCommandAuthoritySchema.nullable(),
    member_grant: helixEnvironmentCommandMemberGrantSchema.nullable(),
    member_grants: z
      .array(helixEnvironmentCommandMemberGrantSchema)
      .max(256)
      .optional(),
    command_credential_included: z.literal(false),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict();

export type HelixEnvironmentCommandAuthorityReceipt = z.infer<
  typeof helixEnvironmentCommandAuthorityReceiptSchema
>;

export const helixMinecraftCommandCatalogNodeSchema = z
  .object({
    path: z.string().trim().min(1).max(1_000),
    node_kind: z.enum(["literal", "argument"]),
    executable: z.boolean(),
    argument_type: z.string().trim().min(1).max(320).nullable(),
    suggestion_provider: z.string().trim().min(1).max(320).nullable(),
    redirects_to: z.string().trim().min(1).max(1_000).nullable(),
    child_count: z.number().int().nonnegative().max(10_000),
  })
  .strict();

export type HelixMinecraftCommandCatalogNode = z.infer<
  typeof helixMinecraftCommandCatalogNodeSchema
>;

export const helixEnvironmentCommandCatalogPageSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_COMMAND_CATALOG_PAGE_SCHEMA),
    command_catalog_id: identifierSchema,
    command_tree_hash: sha256Schema,
    environment_binding_id: identifierSchema,
    source_id: identifierSchema,
    world_id: identifierSchema,
    adapter_profile_id: identifierSchema,
    domain_adapter: identifierSchema,
    game_version: z.string().trim().min(1).max(160),
    producer_epoch_ref: identifierSchema,
    root_command_count: z.number().int().nonnegative().max(100_000),
    path_prefix: z.string().trim().max(1_000),
    nodes: z.array(helixMinecraftCommandCatalogNodeSchema).max(512),
    next_cursor: z.string().trim().min(1).max(1_000).nullable(),
    generated_at: timestampSchema,
    expires_at: timestampSchema.nullable(),
    raw_dispatcher_tree_included: z.literal(false),
    content_role: z.literal("environment_command_catalog_not_assistant_answer"),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict();

export type HelixEnvironmentCommandCatalogPage = z.infer<
  typeof helixEnvironmentCommandCatalogPageSchema
>;

export const helixEnvironmentCommandCatalogObservationSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_COMMAND_CATALOG_OBSERVATION_SCHEMA),
    environment_label: z.string().trim().min(1).max(240),
    game_version: z.string().trim().min(1).max(160),
    command_tree_hash: sha256Schema,
    root_command_count: z.number().int().nonnegative().max(100_000),
    query: z.string().trim().max(240),
    path_prefix: z.string().trim().max(1_000),
    nodes: z.array(helixMinecraftCommandCatalogNodeSchema).max(128),
    matched_count: z.number().int().nonnegative().max(100_000),
    returned_count: z.number().int().nonnegative().max(128),
    catalog_truncated: z.boolean(),
    snapshot_generated_at: timestampSchema,
    observed_at: timestampSchema,
    provenance_valid: z.boolean(),
    content_role: z.literal(
      "environment_command_catalog_observation_not_assistant_answer",
    ),
    reentry_required: z.literal(true),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict();

export type HelixEnvironmentCommandCatalogObservation = z.infer<
  typeof helixEnvironmentCommandCatalogObservationSchema
>;

export const helixEnvironmentCommandRequestSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_COMMAND_REQUEST_SCHEMA),
    command_request_id: identifierSchema,
    command_authority_id: identifierSchema,
    command_grant_id: identifierSchema,
    environment_binding_id: identifierSchema,
    room_id: identifierSchema,
    source_id: identifierSchema,
    world_id: identifierSchema,
    participant_id: identifierSchema,
    subject_binding_id: identifierSchema.nullable(),
    subject_native_id: z.string().trim().min(1).max(240).nullable(),
    run_id: identifierSchema,
    turn_id: identifierSchema,
    provider_execution_id: identifierSchema,
    tool_call_id: identifierSchema,
    command_catalog_id: identifierSchema,
    authority_profile: helixEnvironmentCommandAuthorityProfileSchema,
    autonomy_mode: helixEnvironmentCommandAutonomyModeSchema,
    approved_categories: z
      .array(helixEnvironmentCommandCategorySchema)
      .max(HELIX_ENVIRONMENT_COMMAND_CATEGORIES.length),
    policy_version: z.number().int().positive(),
    command_text: z.string().trim().min(1).max(16_000),
    command_hash: sha256Schema,
    command_root_hint: z.string().trim().min(1).max(160),
    requested_category: helixEnvironmentCommandCategorySchema,
    expected_effect: helixEnvironmentCommandEffectClassSchema,
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
        max_duration_ms: z.number().int().positive().max(5 * 60_000),
        max_output_bytes: z.number().int().positive().max(1_000_000),
        automatic_retry_allowed: z.literal(false),
        host_access_allowed: z.literal(false),
      })
      .strict(),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict();

export type HelixEnvironmentCommandRequest = z.infer<
  typeof helixEnvironmentCommandRequestSchema
>;

export const helixEnvironmentCommandOutcomeSchema = z.enum([
  "succeeded",
  "failed",
  "rejected",
  "connector_offline",
  "command_timeout",
  "command_outcome_unknown",
  "request_canceled",
  "authority_stale",
  "permission_revoked",
  "connector_management_forbidden",
  "wrong_environment",
  "wrong_world",
  "subject_binding_required",
  "subject_binding_stale",
  "command_catalog_changed",
  "command_parse_failed",
  "command_category_mismatch",
  "host_escape_rejected",
  "duplicate_request",
]);
export type HelixEnvironmentCommandOutcome = z.infer<
  typeof helixEnvironmentCommandOutcomeSchema
>;

export const helixEnvironmentCommandResultSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_COMMAND_RESULT_SCHEMA),
    command_request_id: identifierSchema,
    command_execution_id: identifierSchema,
    command_hash: sha256Schema,
    command_root: z.string().trim().min(1).max(160),
    parsed_category: helixEnvironmentCommandCategorySchema,
    effect_class: helixEnvironmentCommandEffectClassSchema,
    outcome: helixEnvironmentCommandOutcomeSchema,
    result_code: z.number().int(),
    summary: z.string().trim().min(1).max(4_000),
    output_lines: z.array(z.string().max(2_000)).max(256),
    output_truncated: z.boolean(),
    affected_count: z.number().int().nullable(),
    side_effects_performed: z.boolean(),
    environment_mutation_performed: z.boolean(),
    server_administration_performed: z.boolean(),
    parsed_by_live_dispatcher: z.boolean(),
    host_access_performed: z.literal(false),
    automatic_retry_performed: z.literal(false),
    model_invoked: z.literal(false),
    created_at: timestampSchema,
    assistant_answer: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict()
  .superRefine((result, context) => {
    if (
      (result.side_effects_performed ||
        result.environment_mutation_performed ||
        result.server_administration_performed) &&
      !result.parsed_by_live_dispatcher
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["parsed_by_live_dispatcher"],
        message: "A side effect requires proof of live dispatcher parsing.",
      });
    }
  });

export type HelixEnvironmentCommandResult = z.infer<
  typeof helixEnvironmentCommandResultSchema
>;

export const helixEnvironmentCommandObservationSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_COMMAND_OBSERVATION_SCHEMA),
    command_request_ref: identifierSchema,
    command_execution_ref: identifierSchema.nullable(),
    command_hash: sha256Schema,
    command_root: z.string().trim().min(1).max(160),
    outcome: helixEnvironmentCommandOutcomeSchema,
    summary: z.string().trim().min(1).max(4_000),
    result: z.record(z.string(), z.unknown()),
    evidence_ref: identifierSchema,
    post_state_evidence_refs: z.array(identifierSchema).max(128),
    observed_at: timestampSchema,
    provenance_valid: z.boolean(),
    eligible_for_current_turn_reentry: z.boolean(),
    content_role: z.literal("environment_command_observation_not_assistant_answer"),
    reentry_required: z.literal(true),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict();

export type HelixEnvironmentCommandObservation = z.infer<
  typeof helixEnvironmentCommandObservationSchema
>;
