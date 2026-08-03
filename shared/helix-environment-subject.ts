import { z } from "zod";

export const HELIX_ENVIRONMENT_SUBJECT_DIRECTORY_SCHEMA =
  "helix.environment_subject_directory.v1" as const;
export const HELIX_ROOM_ENVIRONMENT_SUBJECT_BINDING_SCHEMA =
  "helix.room_environment_subject_binding.v1" as const;
export const HELIX_ROOM_ENVIRONMENT_PROJECTION_SCHEMA =
  "helix.room_environment_projection.v1" as const;
export const HELIX_ROOM_ENVIRONMENTS_RECEIPT_SCHEMA =
  "helix.room_environments.receipt.v1" as const;

const identifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(320)
  .regex(/^[a-zA-Z0-9:._/-]+$/);
const timestampSchema = z.string().datetime({ offset: true });

export const helixEnvironmentSubjectPresenceSchema = z.enum([
  "online",
  "offline",
  "stale",
]);
export type HelixEnvironmentSubjectPresence = z.infer<
  typeof helixEnvironmentSubjectPresenceSchema
>;

export const helixEnvironmentSubjectVerificationMethodSchema = z.enum([
  "self_claim",
  "owner_assigned",
  "connector_challenge",
  "server_auth",
]);
export type HelixEnvironmentSubjectVerificationMethod = z.infer<
  typeof helixEnvironmentSubjectVerificationMethodSchema
>;

export const helixEnvironmentSubjectBindingStatusSchema = z.enum([
  "active",
  "stale",
  "revoked",
]);
export type HelixEnvironmentSubjectBindingStatus = z.infer<
  typeof helixEnvironmentSubjectBindingStatusSchema
>;

/**
 * Sanitized connector subject. The environment-native actor id is deliberately
 * absent; subject_ref is a room/environment-scoped server projection.
 */
export const helixEnvironmentSubjectProjectionSchema = z
  .object({
    subject_ref: identifierSchema,
    subject_kind: identifierSchema,
    display_label: z.string().trim().min(1).max(160),
    presence: helixEnvironmentSubjectPresenceSchema,
    claimed_by_participant_id: identifierSchema.nullable(),
    observed_at: timestampSchema,
    freshness: z.enum(["fresh", "stale"]),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict();

export type HelixEnvironmentSubjectProjection = z.infer<
  typeof helixEnvironmentSubjectProjectionSchema
>;

export const helixRoomEnvironmentSubjectBindingSchema = z
  .object({
    schema: z.literal(HELIX_ROOM_ENVIRONMENT_SUBJECT_BINDING_SCHEMA),
    subject_binding_id: identifierSchema,
    room_id: identifierSchema,
    participant_id: identifierSchema,
    environment_binding_id: identifierSchema,
    room_source_binding_id: identifierSchema,
    source_id: identifierSchema,
    world_id: identifierSchema,
    subject_kind: identifierSchema,
    subject_ref: identifierSchema,
    subject_label: z.string().trim().min(1).max(160),
    verification_method: helixEnvironmentSubjectVerificationMethodSchema,
    confidence: z.number().min(0).max(1),
    status: helixEnvironmentSubjectBindingStatusSchema,
    producer_epoch_ref: identifierSchema,
    verified_at: timestampSchema,
    last_confirmed_at: timestampSchema,
    expires_at: timestampSchema.nullable(),
    revoked_at: timestampSchema.nullable(),
    content_role: z.literal("environment_subject_identity_not_assistant_answer"),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict();

export type HelixRoomEnvironmentSubjectBinding = z.infer<
  typeof helixRoomEnvironmentSubjectBindingSchema
>;

export const helixEnvironmentSubjectDirectorySchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_SUBJECT_DIRECTORY_SCHEMA),
    environment_binding_id: identifierSchema,
    room_source_binding_id: identifierSchema,
    room_id: identifierSchema,
    source_id: identifierSchema,
    world_id: identifierSchema,
    subject_kind: identifierSchema,
    observed_at: timestampSchema.nullable(),
    freshness: z.enum(["fresh", "stale", "missing"]),
    subjects: z.array(helixEnvironmentSubjectProjectionSchema).max(256),
    content_role: z.literal("environment_subject_directory_not_assistant_answer"),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict();

export type HelixEnvironmentSubjectDirectory = z.infer<
  typeof helixEnvironmentSubjectDirectorySchema
>;

export const helixRoomEnvironmentProjectionSchema = z
  .object({
    schema: z.literal(HELIX_ROOM_ENVIRONMENT_PROJECTION_SCHEMA),
    environment_binding_id: identifierSchema,
    room_source_binding_id: identifierSchema,
    room_id: identifierSchema,
    source_id: identifierSchema,
    world_id: identifierSchema,
    domain: identifierSchema,
    domain_adapter: identifierSchema,
    source_label: z.string().trim().min(1).max(160),
    connection_status: z.enum([
      "active",
      "degraded",
      "paused",
      "stale",
      "error",
      "missing",
      "revoked",
    ]),
    latest_observed_at: timestampSchema.nullable(),
    capability_ids: z.array(identifierSchema).max(128),
    subject_directory: helixEnvironmentSubjectDirectorySchema.nullable(),
    self_subject_binding: helixRoomEnvironmentSubjectBindingSchema.nullable(),
    identity_assignment: z.enum([
      "supported",
      "binding_required",
      "not_applicable",
    ]),
    owner_controls_visible: z.boolean(),
    content_role: z.literal("room_environment_projection_not_assistant_answer"),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict();

export type HelixRoomEnvironmentProjection = z.infer<
  typeof helixRoomEnvironmentProjectionSchema
>;

export const helixRoomEnvironmentSelfBindingRequestSchema = z
  .object({
    subject_ref: identifierSchema,
  })
  .strict();

export const helixRoomEnvironmentOwnerBindingRequestSchema = z
  .object({
    subject_ref: identifierSchema,
  })
  .strict();

export const helixRoomEnvironmentsReceiptSchema = z
  .object({
    schema: z.literal(HELIX_ROOM_ENVIRONMENTS_RECEIPT_SCHEMA),
    ok: z.boolean(),
    error: z.string().nullable(),
    message: z.string(),
    environments: z.array(helixRoomEnvironmentProjectionSchema).optional(),
    binding: helixRoomEnvironmentSubjectBindingSchema.nullable().optional(),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict();

export type HelixRoomEnvironmentsReceipt = z.infer<
  typeof helixRoomEnvironmentsReceiptSchema
>;
