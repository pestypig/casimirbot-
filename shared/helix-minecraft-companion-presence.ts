import { z } from "zod";

export const HELIX_MINECRAFT_COMPANION_PROFILE_SCHEMA =
  "helix.minecraft_companion.profile.v1" as const;
export const HELIX_MINECRAFT_COMPANION_PRESENCE_SCHEMA =
  "helix.minecraft_companion.presence.v1" as const;
export const HELIX_MINECRAFT_COMPANION_PERSISTENCE_SCHEMA =
  "helix.minecraft_companion.persistence.v1" as const;
export const HELIX_MINECRAFT_COMPANION_CLEANUP_RECEIPT_SCHEMA =
  "helix.minecraft_companion.cleanup_receipt.v1" as const;

export const HELIX_MINECRAFT_COMPANION_PRESENCE_STATES = [
  "registered",
  "spawned",
  "bound",
  "admitted",
  "active",
  "suspended",
  "releasing",
  "released",
  "despawned",
  "invalidated",
] as const;

const identifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(320)
  .regex(/^[a-zA-Z0-9:._/-]+$/u);
const timestampSchema = z.string().datetime({ offset: true });
const sha256Schema = z.string().regex(/^sha256:[a-f0-9]{64}$/u);

export const helixMinecraftCompanionProfileSchema = z
  .object({
    schema: z.literal(HELIX_MINECRAFT_COMPANION_PROFILE_SCHEMA),
    companion_id: identifierSchema,
    owner_account_id: identifierSchema,
    authority_subject_id: identifierSchema,
    beneficiary_subject_id: identifierSchema,
    controller_profile_id: identifierSchema,
    controller_artifact_hash: sha256Schema,
    created_at: timestampSchema,
    public_capability_exposed: z.literal(false),
    credential_included: z.literal(false),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
  })
  .strict();

export type HelixMinecraftCompanionProfile = z.infer<
  typeof helixMinecraftCompanionProfileSchema
>;

export const helixMinecraftCompanionIncarnationSchema = z
  .object({
    actor_entity_id: identifierSchema,
    actor_incarnation_id: identifierSchema,
    environment_id: identifierSchema,
    world_id: identifierSchema,
    connector_epoch: identifierSchema,
    spawned_at: timestampSchema,
    presence_expires_at: timestampSchema,
  })
  .strict()
  .superRefine((incarnation, context) => {
    if (
      Date.parse(incarnation.presence_expires_at) <=
      Date.parse(incarnation.spawned_at)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["presence_expires_at"],
        message: "Companion presence must be finite and expire after spawn.",
      });
    }
  });

export type HelixMinecraftCompanionIncarnation = z.infer<
  typeof helixMinecraftCompanionIncarnationSchema
>;

export const helixMinecraftCompanionCleanupReceiptSchema = z
  .object({
    schema: z.literal(HELIX_MINECRAFT_COMPANION_CLEANUP_RECEIPT_SCHEMA),
    cleanup_id: identifierSchema,
    companion_id: identifierSchema,
    actor_incarnation_id: identifierSchema,
    reason: z.enum([
      "completed",
      "canceled",
      "lease_expired",
      "manual_override",
      "emergency_stopped",
      "disconnect",
      "death",
      "despawn",
      "restart",
      "identity_changed",
      "implementation_failure",
    ]),
    released_actor_lease_id: identifierSchema.nullable(),
    released_effect_lease_id: identifierSchema.nullable(),
    released_resource_keys: z.array(identifierSchema).max(128),
    navigation_cleared: z.literal(true),
    transient_effects_cleared: z.literal(true),
    chunk_claims_released: z.literal(true),
    outstanding_proposals_canceled: z.literal(true),
    controls_released: z.literal(true),
    late_effect_count: z.literal(0),
    duplicate_effect_count: z.literal(0),
    completed_at: timestampSchema,
    evidence_refs: z.array(identifierSchema).min(1).max(128),
    credential_included: z.literal(false),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
  })
  .strict();

export type HelixMinecraftCompanionCleanupReceipt = z.infer<
  typeof helixMinecraftCompanionCleanupReceiptSchema
>;

export const helixMinecraftCompanionPresenceSchema = z
  .object({
    schema: z.literal(HELIX_MINECRAFT_COMPANION_PRESENCE_SCHEMA),
    profile: helixMinecraftCompanionProfileSchema,
    state: z.enum(HELIX_MINECRAFT_COMPANION_PRESENCE_STATES),
    revision: z.number().int().positive(),
    incarnation: helixMinecraftCompanionIncarnationSchema.nullable(),
    actor_lease_id: identifierSchema.nullable(),
    effect_lease_id: identifierSchema.nullable(),
    active_resource_keys: z.array(identifierSchema).max(128),
    pending_proposal_ids: z.array(identifierSchema).max(128),
    cleanup_receipt: helixMinecraftCompanionCleanupReceiptSchema.nullable(),
    updated_at: timestampSchema,
    evidence_refs: z.array(identifierSchema).max(128),
    controls_may_be_asserted: z.boolean(),
    persistence_restored: z.boolean(),
    public_capability_exposed: z.literal(false),
    execution_authority: z.literal(false),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
  })
  .strict()
  .superRefine((presence, context) => {
    const statesWithoutBody = ["registered", "despawned"];
    if (statesWithoutBody.includes(presence.state) && presence.incarnation) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["incarnation"],
        message: `${presence.state} presence cannot retain a runtime incarnation.`,
      });
    }
    if (!statesWithoutBody.includes(presence.state) && !presence.incarnation) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["incarnation"],
        message: `${presence.state} presence requires an exact runtime incarnation.`,
      });
    }
    const leaseStates = ["admitted", "active", "suspended", "releasing"];
    if (
      leaseStates.includes(presence.state) &&
      (!presence.actor_lease_id || !presence.effect_lease_id)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["actor_lease_id"],
        message: `${presence.state} presence requires actor and effect leases.`,
      });
    }
    if (
      !leaseStates.includes(presence.state) &&
      (presence.actor_lease_id || presence.effect_lease_id)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["actor_lease_id"],
        message: `${presence.state} presence cannot retain active leases.`,
      });
    }
    if (presence.controls_may_be_asserted !== (presence.state === "active")) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["controls_may_be_asserted"],
        message: "Only active presence may assert controls.",
      });
    }
    if (
      ["released", "despawned", "invalidated"].includes(presence.state) &&
      (presence.active_resource_keys.length > 0 ||
        presence.pending_proposal_ids.length > 0 ||
        !presence.cleanup_receipt)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cleanup_receipt"],
        message: `${presence.state} presence requires complete cleanup evidence.`,
      });
    }
    if (presence.persistence_restored && presence.state !== "registered") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["persistence_restored"],
        message: "Restored persistence must return to registered without runtime control.",
      });
    }
  });

export type HelixMinecraftCompanionPresence = z.infer<
  typeof helixMinecraftCompanionPresenceSchema
>;

export const helixMinecraftCompanionPersistenceSchema = z
  .object({
    schema: z.literal(HELIX_MINECRAFT_COMPANION_PERSISTENCE_SCHEMA),
    profile: helixMinecraftCompanionProfileSchema,
    persistence_revision: z.number().int().positive(),
    previous_actor_incarnation_id: identifierSchema.nullable(),
    saved_at: timestampSchema,
    active_incarnation_persisted: z.literal(false),
    actor_lease_persisted: z.literal(false),
    effect_lease_persisted: z.literal(false),
    resource_claims_persisted: z.literal(false),
    pending_proposals_persisted: z.literal(false),
    credentials_persisted: z.literal(false),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
  })
  .strict();

export type HelixMinecraftCompanionPersistence = z.infer<
  typeof helixMinecraftCompanionPersistenceSchema
>;
