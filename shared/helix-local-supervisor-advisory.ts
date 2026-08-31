import { z } from "zod";

export const HELIX_LOCAL_SUPERVISOR_ADVISORY_SCHEMA =
  "helix.local_supervisor_advisory.v1" as const;
export const HELIX_LOCAL_SUPERVISOR_ADVISORY_AUDIENCE_SCHEMA =
  "helix.local_supervisor_advisory_audience.v1" as const;
export const HELIX_LOCAL_SUPERVISOR_ADVISORY_DELIVERY_SCHEMA =
  "helix.local_supervisor_advisory_delivery.v1" as const;

const opaqueRef = z.string().trim().min(3).max(320)
  .regex(/^[a-zA-Z0-9:._/-]+$/u);
const serviceInstanceRef = z.string()
  .regex(/^service_instance:[a-f0-9]{32}$/u);
const installedNodeRef = z.string()
  .regex(/^device:sha256:[a-f0-9]{32}$/u);
const timestamp = z.string().datetime({ offset: true });
const safeSummary = z.string().trim().min(1).max(360)
  .refine((value) => !/(?:https?:\/\/|bearer\s|token\s*[=:]|password\s*[=:]|community\s*[=:]|[a-z]:\\|\/(?:users|home)\/)/iu.test(value),
    "private_advisory_material_forbidden");

export const helixLocalSupervisorAdvisoryAudienceClassSchema = z.enum([
  "service_epoch",
  "room",
]);

export const helixLocalSupervisorAdvisoryPublishInputSchema = z.object({
  publisher_client_session_ref: opaqueRef,
  publisher_idempotency_ref: opaqueRef,
  audience_class: helixLocalSupervisorAdvisoryAudienceClassSchema,
  service_instance_ref: serviceInstanceRef,
  installed_node_ref: installedNodeRef,
  room_ref: opaqueRef.nullable(),
  summary: safeSummary,
  advisory_basis: z.literal("owner_declared"),
  late_attach_policy: z.enum(["none", "eligible_until_expiry"]),
  expires_in_seconds: z.number().int().min(15).max(3_600),
}).strict().superRefine((value, context) => {
  if (value.audience_class === "room" && !value.room_ref) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["room_ref"],
      message: "A room advisory requires an exact room reference.",
    });
  }
  if (value.audience_class === "service_epoch" && value.room_ref !== null) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["room_ref"],
      message: "A service-epoch advisory cannot carry a room reference.",
    });
  }
});

export const helixLocalSupervisorAdvisoryAckInputSchema = z.object({
  client_session_ref: opaqueRef,
}).strict();

const inertFields = {
  advisory_only: z.literal(true),
  execution_requested: z.literal(false),
  authority_transfer: z.literal(false),
  evidence_satisfied: z.literal(false),
  mutation_authority: z.literal(false),
  process_control_authority: z.literal(false),
  restart_vote_authority: z.literal(false),
  goal_change_authority: z.literal(false),
  credential_included: z.literal(false),
  private_endpoint_included: z.literal(false),
  host_path_included: z.literal(false),
  hidden_reasoning_included: z.literal(false),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
  raw_content_included: z.literal(false),
};

export const helixLocalSupervisorAdvisoryAudienceRecipientSchema = z.object({
  client_session_ref: opaqueRef,
  profile_ref: opaqueRef,
  authenticated_mcp_client_ref: opaqueRef,
  service_instance_ref: serviceInstanceRef,
  installed_node_ref: installedNodeRef,
  room_ref: opaqueRef.nullable(),
}).strict();

export const helixLocalSupervisorAdvisoryAudienceSchema = z.object({
  schema: z.literal(HELIX_LOCAL_SUPERVISOR_ADVISORY_AUDIENCE_SCHEMA),
  audience_snapshot_ref: opaqueRef,
  audience_class: helixLocalSupervisorAdvisoryAudienceClassSchema,
  service_instance_ref: serviceInstanceRef,
  installed_node_ref: installedNodeRef,
  room_ref: opaqueRef.nullable(),
  resolved_at: timestamp,
  server_resolved: z.literal(true),
  recipient_count: z.number().int().min(1).max(128),
  recipients: z.array(helixLocalSupervisorAdvisoryAudienceRecipientSchema)
    .min(1).max(128),
  arbitrary_recipient_selection_allowed: z.literal(false),
  ...inertFields,
}).strict();

export const helixLocalSupervisorAdvisorySchema = z.object({
  schema: z.literal(HELIX_LOCAL_SUPERVISOR_ADVISORY_SCHEMA),
  advisory_ref: opaqueRef,
  publisher_idempotency_ref: opaqueRef,
  publisher_profile_ref: opaqueRef,
  publisher_client_session_ref: opaqueRef,
  publisher_mcp_client_ref: opaqueRef,
  publisher_authorization_ref: opaqueRef,
  audience_snapshot_ref: opaqueRef,
  audience_class: helixLocalSupervisorAdvisoryAudienceClassSchema,
  service_instance_ref: serviceInstanceRef,
  installed_node_ref: installedNodeRef,
  room_ref: opaqueRef.nullable(),
  summary: safeSummary,
  advisory_basis: z.literal("owner_declared"),
  measured_resource_evidence_included: z.literal(false),
  late_attach_policy: z.enum(["none", "eligible_until_expiry"]),
  created_at: timestamp,
  expires_at: timestamp,
  recipient_count: z.number().int().min(1).max(128),
  content_role: z.literal("local_supervisor_owner_declared_advisory"),
  ...inertFields,
}).strict();

export const helixLocalSupervisorAdvisoryDeliverySchema = z.object({
  schema: z.literal(HELIX_LOCAL_SUPERVISOR_ADVISORY_DELIVERY_SCHEMA),
  delivery_ref: opaqueRef,
  advisory_ref: opaqueRef,
  audience_snapshot_ref: opaqueRef,
  recipient_client_session_ref: opaqueRef,
  recipient_profile_ref: opaqueRef,
  recipient_mcp_client_ref: opaqueRef,
  recipient_service_instance_ref: serviceInstanceRef,
  recipient_installed_node_ref: installedNodeRef,
  room_ref: opaqueRef.nullable(),
  summary: safeSummary,
  advisory_basis: z.literal("owner_declared"),
  measured_resource_evidence_included: z.literal(false),
  late_attach: z.boolean(),
  created_at: timestamp,
  expires_at: timestamp,
  acknowledgement_ref: opaqueRef.nullable(),
  acknowledged_at: timestamp.nullable(),
  delivery_state: z.enum(["pending", "acknowledged", "expired"]),
  content_role: z.literal("local_supervisor_recipient_advisory_delivery"),
  ...inertFields,
}).strict();

export type HelixLocalSupervisorAdvisoryPublishInput = z.infer<
  typeof helixLocalSupervisorAdvisoryPublishInputSchema
>;
export type HelixLocalSupervisorAdvisoryAudience = z.infer<
  typeof helixLocalSupervisorAdvisoryAudienceSchema
>;
export type HelixLocalSupervisorAdvisory = z.infer<
  typeof helixLocalSupervisorAdvisorySchema
>;
export type HelixLocalSupervisorAdvisoryDelivery = z.infer<
  typeof helixLocalSupervisorAdvisoryDeliverySchema
>;

export const HELIX_LOCAL_SUPERVISOR_ADVISORY_INERT_FIELDS = {
  advisory_only: true,
  execution_requested: false,
  authority_transfer: false,
  evidence_satisfied: false,
  mutation_authority: false,
  process_control_authority: false,
  restart_vote_authority: false,
  goal_change_authority: false,
  credential_included: false,
  private_endpoint_included: false,
  host_path_included: false,
  hidden_reasoning_included: false,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
} as const;
