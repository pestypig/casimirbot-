import { z } from "zod";

export const HELIX_ENVIRONMENT_DEVICE_CHECK_SCHEMA =
  "helix.environment_connector.device_check.v1" as const;
export const HELIX_ENVIRONMENT_DEVICE_CHECK_LIST_SCHEMA =
  "helix.environment_connector.device_check_list.v1" as const;

const identifier = z
  .string()
  .trim()
  .min(1)
  .max(320)
  .regex(/^[a-zA-Z0-9:._/-]+$/);
const timestamp = z.string().datetime({ offset: true });

export const helixEnvironmentDeviceCheckBlockingReasonSchema = z.enum([
  "installation_inactive",
  "device_inactive",
  "binding_missing",
  "binding_inactive",
  "adapter_admission_inactive",
  "credential_missing",
  "credential_inactive",
  "credential_expired",
  "contact_never_observed",
  "contact_stale",
  "connector_reported_degraded",
  "connector_reported_offline",
  "connector_health_unknown",
  "capabilities_missing",
]);

export type HelixEnvironmentDeviceCheckBlockingReason = z.infer<
  typeof helixEnvironmentDeviceCheckBlockingReasonSchema
>;

export const helixEnvironmentDeviceCheckSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_DEVICE_CHECK_SCHEMA),
    device_id: identifier,
    installation_id: identifier,
    package_id: identifier,
    package_version: z.string().trim().min(1).max(120),
    trust_classification: z.enum([
      "unverified",
      "community",
      "verified",
      "first_party",
    ]),
    security_review_state: z.enum([
      "not_reviewed",
      "pending",
      "approved",
      "rejected",
    ]),
    installation_status: z.enum([
      "active",
      "suspended",
      "revoked",
      "uninstalled",
    ]),
    device_status: z.enum(["active", "suspended", "revoked"]),
    health: z.enum(["unknown", "online", "degraded", "offline"]),
    freshness: z.enum(["fresh", "stale", "never_observed"]),
    last_contact_at: timestamp.nullable(),
    last_contact_age_ms: z.number().int().nonnegative().nullable(),
    stale_after_ms: z.number().int().positive(),
    paired_at: timestamp,
    environment_binding_id: identifier.nullable(),
    binding_status: z.enum(["active", "suspended", "revoked"]).nullable(),
    adapter_admission_status: z
      .enum(["active", "revoked", "superseded", "expired"])
      .nullable(),
    room_id: identifier.nullable(),
    source_id: identifier.nullable(),
    world_id: identifier.nullable(),
    domain_adapter: identifier.nullable(),
    capability_ids: z.array(identifier).max(128),
    credential_status: z
      .enum(["active", "expired", "revoked"])
      .nullable(),
    credential_expires_at: timestamp.nullable(),
    probe_ready: z.boolean(),
    blocking_reasons: z
      .array(helixEnvironmentDeviceCheckBlockingReasonSchema)
      .max(16),
    content_role: z.literal("device_health_observation_not_assistant_answer"),
    credential_included: z.literal(false),
    device_public_key_included: z.literal(false),
    producer_epoch_included: z.literal(false),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict();

export type HelixEnvironmentDeviceCheck = z.infer<
  typeof helixEnvironmentDeviceCheckSchema
>;

export const helixEnvironmentDeviceCheckListSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_DEVICE_CHECK_LIST_SCHEMA),
    generated_at: timestamp,
    devices: z.array(helixEnvironmentDeviceCheckSchema).max(256),
    content_role: z.literal("device_health_observations_not_assistant_answer"),
    credential_included: z.literal(false),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict();

export type HelixEnvironmentDeviceCheckList = z.infer<
  typeof helixEnvironmentDeviceCheckListSchema
>;
