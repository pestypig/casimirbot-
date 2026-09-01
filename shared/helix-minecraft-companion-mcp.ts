import { z } from "zod";

import {
  helixMinecraftCompanionCleanupReceiptSchema,
  helixMinecraftCompanionPresenceSchema,
} from "./helix-minecraft-companion-presence";

export const HELIX_MINECRAFT_COMPANION_PRESENCE_EVIDENCE_READ_TOOL =
  "helix_minecraft_companion_presence_evidence_read" as const;
export const HELIX_MINECRAFT_COMPANION_ROOM_PRESENCE_EVIDENCE_READ_TOOL =
  "helix_minecraft_companion_room_presence_evidence_read" as const;
export const HELIX_MINECRAFT_COMPANION_PRESENCE_EVIDENCE_CAPABILITY =
  "resident.minecraft.companion-presence-evidence.read.v1" as const;
export const HELIX_MINECRAFT_COMPANION_PRESENCE_EVIDENCE_SCHEMA =
  "helix.minecraft_companion.presence_evidence.v1" as const;
export const HELIX_MINECRAFT_COMPANION_ROOM_PRESENCE_EVIDENCE_SCHEMA =
  "helix.minecraft_companion.room_presence_evidence.v1" as const;

const identifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(320)
  .regex(/^[a-zA-Z0-9:._/-]+$/u);

export const helixMinecraftCompanionPresenceIdentitySchema = z.object({
  companion_id: identifierSchema,
  actor_entity_id: identifierSchema,
  actor_incarnation_id: identifierSchema,
  environment_id: identifierSchema,
  world_id: identifierSchema,
  connector_epoch: identifierSchema,
  observation_revision: z.number().int().positive(),
}).strict();

export const helixMinecraftCompanionPresenceEvidenceReadRequestSchema = z.object({
  identity: helixMinecraftCompanionPresenceIdentitySchema,
}).strict();

export const helixMinecraftCompanionRoomPresenceEvidenceReadRequestSchema = z.object({
  room_id: identifierSchema,
  identity: helixMinecraftCompanionPresenceIdentitySchema,
}).strict();

export const helixMinecraftCompanionPresenceEvidenceSchema = z.object({
  schema: z.literal(HELIX_MINECRAFT_COMPANION_PRESENCE_EVIDENCE_SCHEMA),
  capability_id: z.literal(
    HELIX_MINECRAFT_COMPANION_PRESENCE_EVIDENCE_CAPABILITY,
  ),
  source_lane: z.literal("C0_A0_direct_fabric"),
  identity: helixMinecraftCompanionPresenceIdentitySchema,
  presence: helixMinecraftCompanionPresenceSchema,
  cleanup_receipt: helixMinecraftCompanionCleanupReceiptSchema,
  identity_match: z.literal(true),
  cleanup_complete: z.literal(true),
  stale_action_rejected: z.literal(true),
  stale_action_rejection_reason: z.literal(
    "companion_action_identity_stale",
  ),
  public_capability_exposed: z.literal(false),
  execution_authority: z.literal(false),
  mining_authorized: z.literal(false),
  credential_included: z.literal(false),
  content_role: z.literal(
    "minecraft_companion_presence_evidence_not_assistant_answer",
  ),
  reentry_required: z.literal(true),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
}).strict().superRefine((evidence, context) => {
  const incarnation = evidence.presence.incarnation;
  const cleanup = evidence.cleanup_receipt;
  if (!incarnation) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["presence", "incarnation"],
      message: "MCP presence evidence must retain the observed incarnation.",
    });
    return;
  }
  const exact =
    evidence.identity.companion_id === evidence.presence.profile.companion_id &&
    evidence.identity.actor_entity_id === incarnation.actor_entity_id &&
    evidence.identity.actor_incarnation_id === incarnation.actor_incarnation_id &&
    evidence.identity.environment_id === incarnation.environment_id &&
    evidence.identity.world_id === incarnation.world_id &&
    evidence.identity.connector_epoch === incarnation.connector_epoch &&
    evidence.identity.observation_revision === evidence.presence.revision &&
    cleanup.companion_id === evidence.identity.companion_id &&
    cleanup.actor_incarnation_id === evidence.identity.actor_incarnation_id &&
    evidence.presence.cleanup_receipt?.cleanup_id === cleanup.cleanup_id;
  if (!exact) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["identity"],
      message: "Presence evidence must bind one exact companion incarnation and cleanup receipt.",
    });
  }
  if (
    !["released", "invalidated"].includes(evidence.presence.state) ||
    evidence.presence.controls_may_be_asserted ||
    evidence.presence.active_resource_keys.length > 0 ||
    evidence.presence.pending_proposal_ids.length > 0
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["presence", "state"],
      message: "MCP cleanup evidence requires a released or invalidated inert presence.",
    });
  }
});

/**
 * A keyed-Helix projection of already accepted physical C0 evidence. Room
 * membership and owner role are checked for every read. This envelope cannot
 * grant the room, the companion, or the caller any execution authority.
 */
export const helixMinecraftCompanionRoomPresenceEvidenceSchema = z.object({
  schema: z.literal(
    HELIX_MINECRAFT_COMPANION_ROOM_PRESENCE_EVIDENCE_SCHEMA,
  ),
  capability_id: z.literal(
    HELIX_MINECRAFT_COMPANION_PRESENCE_EVIDENCE_CAPABILITY,
  ),
  room_id: identifierSchema,
  owner_profile_ref: identifierSchema,
  requesting_participant_ref: identifierSchema,
  room_role: z.literal("owner"),
  room_status: z.enum([
    "waiting_for_participant",
    "waiting_for_consent",
    "ready",
    "active",
  ]),
  observation_origin: z.literal("room_projection"),
  admission_basis: z.literal("room_owner_private_config"),
  evidence: helixMinecraftCompanionPresenceEvidenceSchema,
  identity_match: z.literal(true),
  room_binding_active: z.literal(true),
  read_only: z.literal(true),
  commands_executed: z.literal(0),
  side_effects: z.literal(false),
  environment_mutated: z.literal(false),
  public_capability_exposed: z.literal(false),
  execution_authority: z.literal(false),
  mutation_authority: z.literal(false),
  mining_authorized: z.literal(false),
  credential_included: z.literal(false),
  private_endpoint_included: z.literal(false),
  hidden_reasoning_included: z.literal(false),
  content_role: z.literal(
    "minecraft_companion_room_presence_evidence_not_assistant_answer",
  ),
  reentry_required: z.literal(true),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
}).strict();

export type HelixMinecraftCompanionPresenceIdentity = z.infer<
  typeof helixMinecraftCompanionPresenceIdentitySchema
>;
export type HelixMinecraftCompanionPresenceEvidenceReadRequest = z.infer<
  typeof helixMinecraftCompanionPresenceEvidenceReadRequestSchema
>;
export type HelixMinecraftCompanionRoomPresenceEvidenceReadRequest = z.infer<
  typeof helixMinecraftCompanionRoomPresenceEvidenceReadRequestSchema
>;
export type HelixMinecraftCompanionPresenceEvidence = z.infer<
  typeof helixMinecraftCompanionPresenceEvidenceSchema
>;
export type HelixMinecraftCompanionRoomPresenceEvidence = z.infer<
  typeof helixMinecraftCompanionRoomPresenceEvidenceSchema
>;
