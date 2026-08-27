import { z } from "zod";

export const HELIX_PROFILE_ENVIRONMENT_CONNECTION_REF_SCHEMA =
  "helix.profile_environment_connection_ref.v1" as const;
export const HELIX_ROOM_CAPABILITY_GRANT_SCHEMA =
  "helix.room_capability_grant.v1" as const;
export const HELIX_ROOM_CAPABILITY_OBSERVATION_SCHEMA =
  "helix.room_capability_observation.v1" as const;
export const HELIX_ROOM_CAPABILITY_REENTRY_SCHEMA =
  "helix.room_capability_reentry.v1" as const;
export const HELIX_ROOM_SHARED_CAPABILITY_SCHEMA =
  "helix.room_shared_capability.v1" as const;
export const HELIX_ROOM_SHARED_CAPABILITY_CONNECTION_SCHEMA =
  "helix.room_shared_capability_connection.v1" as const;
export const HELIX_ROOM_SHARED_CAPABILITY_LIST_SCHEMA =
  "helix.room_shared_capability_list.v1" as const;

const identifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(320)
  .regex(/^[a-zA-Z0-9:._/-]+$/u);
const timestampSchema = z.string().datetime({ offset: true });
const sha256Schema = z.string().regex(/^sha256:[a-f0-9]{64}$/u);
const capabilityIdsSchema = z.array(identifierSchema).min(1).max(128);

const nonAuthoritativeFields = {
  credential_included: z.literal(false),
  private_endpoint_included: z.literal(false),
  native_subject_included: z.literal(false),
  hidden_reasoning_included: z.literal(false),
  mutation_authority: z.literal(false),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
  raw_content_included: z.literal(false),
};

/**
 * A model-visible reference to a profile-owned environment connection. Private
 * routes and credential material deliberately have no representation here.
 */
export const helixProfileEnvironmentConnectionRefSchema = z
  .object({
    schema: z.literal(HELIX_PROFILE_ENVIRONMENT_CONNECTION_REF_SCHEMA),
    connection_ref: identifierSchema,
    owner_profile_ref: identifierSchema,
    installed_node_ref: identifierSchema,
    environment_ref: identifierSchema,
    source_ref: identifierSchema,
    producer_epoch_ref: identifierSchema,
    capability_ids: capabilityIdsSchema,
    status: z.enum(["active", "degraded", "suspended", "revoked"]),
    read_only: z.literal(true),
    policy_revision: z.number().int().positive(),
    updated_at: timestampSchema,
    ...nonAuthoritativeFields,
  })
  .strict();

export type HelixProfileEnvironmentConnectionRef = z.infer<
  typeof helixProfileEnvironmentConnectionRefSchema
>;

/** A narrowed, revocable room reference; it never transfers connection ownership. */
export const helixRoomCapabilityGrantSchema = z
  .object({
    schema: z.literal(HELIX_ROOM_CAPABILITY_GRANT_SCHEMA),
    grant_ref: identifierSchema,
    connection_ref: identifierSchema,
    owner_profile_ref: identifierSchema,
    installed_node_ref: identifierSchema,
    room_id: identifierSchema,
    environment_ref: identifierSchema,
    source_ref: identifierSchema,
    producer_epoch_ref: identifierSchema,
    capability_ids: capabilityIdsSchema,
    grant_mode: z.literal("read"),
    status: z.enum(["active", "expired", "revoked"]),
    policy_revision: z.number().int().positive(),
    created_at: timestampSchema,
    expires_at: timestampSchema,
    revoked_at: timestampSchema.nullable(),
    ...nonAuthoritativeFields,
  })
  .strict();

export type HelixRoomCapabilityGrant = z.infer<
  typeof helixRoomCapabilityGrantSchema
>;

export const helixRoomCapabilityFactSchema = z
  .object({
    fact_ref: identifierSchema,
    key: identifierSchema,
    value: z.union([
      z.string().trim().max(256),
      z.number().finite(),
      z.boolean(),
      z.null(),
    ]),
    source_method: z.enum(["mock_fixture", "normalized_connector"]),
  })
  .strict();

export type HelixRoomCapabilityFact = z.infer<
  typeof helixRoomCapabilityFactSchema
>;

/** A bounded observation that is evidence for, never the answer to, a turn. */
export const helixRoomCapabilityObservationSchema = z
  .object({
    schema: z.literal(HELIX_ROOM_CAPABILITY_OBSERVATION_SCHEMA),
    observation_ref: identifierSchema,
    grant_ref: identifierSchema,
    connection_ref: identifierSchema,
    requesting_profile_ref: identifierSchema,
    requesting_participant_ref: identifierSchema,
    installed_node_ref: identifierSchema,
    room_id: identifierSchema,
    environment_ref: identifierSchema,
    source_ref: identifierSchema,
    producer_epoch_ref: identifierSchema,
    capability_id: identifierSchema,
    policy_revision: z.number().int().positive(),
    observed_at: timestampSchema,
    freshness_deadline: timestampSchema,
    freshness_state: z.literal("fresh"),
    facts: z.array(helixRoomCapabilityFactSchema).max(128),
    output_hash: sha256Schema,
    commands_executed: z.literal(0),
    side_effects: z.literal(false),
    environment_mutated: z.literal(false),
    content_role: z.literal("environment_observation_not_assistant_answer"),
    ...nonAuthoritativeFields,
  })
  .strict();

export type HelixRoomCapabilityObservation = z.infer<
  typeof helixRoomCapabilityObservationSchema
>;

/** Receipt proving exact current-turn re-entry into the sole principal runtime. */
export const helixRoomCapabilityReentrySchema = z
  .object({
    schema: z.literal(HELIX_ROOM_CAPABILITY_REENTRY_SCHEMA),
    reentry_ref: identifierSchema,
    principal_runtime_ref: identifierSchema,
    turn_ref: identifierSchema,
    observation_ref: identifierSchema,
    observation_hash: sha256Schema,
    current_turn: z.literal(true),
    exact_observation_reentered: z.literal(true),
    principal_runtime_count: z.literal(1),
    terminal_writer_count: z.literal(1),
    content_role: z.literal("runtime_evidence_reentry_not_assistant_answer"),
    ...nonAuthoritativeFields,
  })
  .strict();

export type HelixRoomCapabilityReentry = z.infer<
  typeof helixRoomCapabilityReentrySchema
>;

const sharedCapabilityStatusFields = {
  owner_profile_ref: identifierSchema,
  owner_label: z.string().trim().min(1).max(160),
  installed_node_ref: identifierSchema,
  connection_ref: identifierSchema,
  environment_ref: identifierSchema,
  environment_label: z.string().trim().min(1).max(160),
  source_ref: identifierSchema,
  world_or_site_ref: identifierSchema,
  producer_epoch_ref: identifierSchema,
  capability_ids: capabilityIdsSchema,
  grant_mode: z.literal("read"),
  action_class: z.literal("none"),
  health: z.enum(["online", "degraded", "offline", "unknown"]),
  freshness: z.enum(["fresh", "stale", "never_observed"]),
  last_observed_at: timestampSchema.nullable(),
  blocking_reasons: z.array(identifierSchema).max(24),
  ready: z.boolean(),
  ...nonAuthoritativeFields,
};

/** Sanitized owner-only connection option used to create a room read grant. */
export const helixRoomSharedCapabilityConnectionSchema = z
  .object({
    schema: z.literal(HELIX_ROOM_SHARED_CAPABILITY_CONNECTION_SCHEMA),
    ...sharedCapabilityStatusFields,
    owner_controls_visible: z.literal(true),
  })
  .strict();

export type HelixRoomSharedCapabilityConnection = z.infer<
  typeof helixRoomSharedCapabilityConnectionSchema
>;

/** Sanitized grant projection visible to every authenticated room member. */
export const helixRoomSharedCapabilitySchema = z
  .object({
    schema: z.literal(HELIX_ROOM_SHARED_CAPABILITY_SCHEMA),
    grant_ref: identifierSchema,
    room_id: identifierSchema,
    ...sharedCapabilityStatusFields,
    status: z.enum(["active", "expired", "revoked"]),
    policy_revision: z.number().int().positive(),
    member_count: z.number().int().min(1).max(2),
    created_at: timestampSchema,
    expires_at: timestampSchema,
    revoked_at: timestampSchema.nullable(),
    owner_controls_visible: z.boolean(),
  })
  .strict();

export type HelixRoomSharedCapability = z.infer<
  typeof helixRoomSharedCapabilitySchema
>;

export const helixRoomSharedCapabilityListSchema = z
  .object({
    schema: z.literal(HELIX_ROOM_SHARED_CAPABILITY_LIST_SCHEMA),
    room_id: identifierSchema,
    grants: z.array(helixRoomSharedCapabilitySchema).max(32),
    available_connections: z
      .array(helixRoomSharedCapabilityConnectionSchema)
      .max(32),
    generated_at: timestampSchema,
    ...nonAuthoritativeFields,
  })
  .strict();

export type HelixRoomSharedCapabilityList = z.infer<
  typeof helixRoomSharedCapabilityListSchema
>;

export const HELIX_ROOM_CAPABILITY_NON_AUTHORITATIVE_FIELDS = {
  credential_included: false,
  private_endpoint_included: false,
  native_subject_included: false,
  hidden_reasoning_included: false,
  mutation_authority: false,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
} as const;
