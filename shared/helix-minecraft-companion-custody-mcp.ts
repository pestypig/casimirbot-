import { z } from "zod";

import { helixMinecraftCompanionPresenceIdentitySchema } from
  "./helix-minecraft-companion-mcp";

export const HELIX_MINECRAFT_COMPANION_CUSTODY_EVIDENCE_READ_TOOL =
  "helix_minecraft_companion_custody_evidence_read" as const;
export const HELIX_MINECRAFT_COMPANION_ROOM_CUSTODY_EVIDENCE_READ_TOOL =
  "helix_minecraft_companion_room_custody_evidence_read" as const;
export const HELIX_MINECRAFT_COMPANION_CUSTODY_EVIDENCE_CAPABILITY =
  "resident.minecraft.companion-custody-evidence.read.v1" as const;
export const HELIX_MINECRAFT_COMPANION_CUSTODY_EVIDENCE_SCHEMA =
  "helix.minecraft_companion.custody_evidence.v1" as const;
export const HELIX_MINECRAFT_COMPANION_ROOM_CUSTODY_EVIDENCE_SCHEMA =
  "helix.minecraft_companion.room_custody_evidence.v1" as const;

const identifierSchema = z.string().trim().min(1).max(420)
  .regex(/^[a-zA-Z0-9:._/-]+$/u);
const sha256Schema = z.string().regex(/^sha256:[a-f0-9]{64}$/u);

export const helixMinecraftCompanionCustodyEvidenceReadRequestSchema = z.object({
  identity: helixMinecraftCompanionPresenceIdentitySchema,
  controller_artifact_hash: sha256Schema,
  custody_revision: z.number().int().positive(),
}).strict();

export const helixMinecraftCompanionRoomCustodyEvidenceReadRequestSchema =
  helixMinecraftCompanionCustodyEvidenceReadRequestSchema.extend({
    room_id: identifierSchema,
  }).strict();

const caseIdSchema = z.enum([
  "pickup_equip_unequip_transfer_retry",
  "denied_slots_containers_stale_revision_conflict",
  "backend_rollback_disconnect_release",
  "restart_keep_drop_death_policy",
]);

export const helixMinecraftCompanionCustodyCaseReceiptSchema = z.object({
  case_id: caseIdSchema,
  game_test_id: identifierSchema,
  passed: z.literal(true),
  atomic_settlement: z.literal(true),
  exact_item_conservation: z.literal(true),
  controls_released: z.literal(true),
  late_effect_count: z.literal(0),
  duplicate_effect_count: z.literal(0),
  state_hash_before: sha256Schema,
  state_hash_after: sha256Schema,
  mining_authority: z.literal(false),
  crafting_authority: z.literal(false),
  combat_authority: z.literal(false),
  world_authority: z.literal(false),
  answer_authority: z.literal(false),
  terminal_authority: z.literal(false),
}).strict();

export const helixMinecraftCompanionCustodyEvidenceSchema = z.object({
  schema: z.literal(HELIX_MINECRAFT_COMPANION_CUSTODY_EVIDENCE_SCHEMA),
  capability_id: z.literal(
    HELIX_MINECRAFT_COMPANION_CUSTODY_EVIDENCE_CAPABILITY,
  ),
  source_lane: z.literal("C2_A0_direct_fabric"),
  identity: helixMinecraftCompanionPresenceIdentitySchema,
  controller_profile_id: z.literal("resident.minecraft.companion-custody.v1"),
  controller_artifact_hash: sha256Schema,
  custody_revision: z.number().int().positive(),
  minecraft_version: z.literal("1.21.8"),
  fabric_loader_version: z.literal("0.18.4"),
  focused_game_test_total: z.literal(4),
  focused_game_test_passed: z.literal(4),
  case_receipts: z.array(helixMinecraftCompanionCustodyCaseReceiptSchema).length(4),
  canonical_inventory_slots: z.literal(9),
  canonical_equipment_slots: z.literal(6),
  restart_revision_rotated: z.literal(true),
  keep_policy_proven: z.literal(true),
  drop_policy_proven: z.literal(true),
  stale_revision_rejected: z.literal(true),
  denied_slot_rejected: z.literal(true),
  denied_container_rejected: z.literal(true),
  backend_rollback_proven: z.literal(true),
  idempotent_retry_proven: z.literal(true),
  disconnect_release_proven: z.literal(true),
  zero_duplication_or_loss: z.literal(true),
  public_capability_exposed: z.literal(false),
  execution_authority: z.literal(false),
  inventory_execution_authority: z.literal(false),
  mining_authority: z.literal(false),
  crafting_authority: z.literal(false),
  combat_authority: z.literal(false),
  world_authority: z.literal(false),
  credential_included: z.literal(false),
  content_role: z.literal(
    "minecraft_companion_custody_evidence_not_assistant_answer",
  ),
  reentry_required: z.literal(true),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
  observed_at: z.string().datetime({ offset: true }),
  support_refs: z.array(identifierSchema).min(4).max(32),
}).strict().superRefine((evidence, context) => {
  const ids = new Set(evidence.case_receipts.map((receipt) => receipt.case_id));
  if (ids.size !== 4) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["case_receipts"],
      message: "C2 evidence must contain each frozen custody case exactly once.",
    });
  }
});

export const helixMinecraftCompanionRoomCustodyEvidenceSchema = z.object({
  schema: z.literal(HELIX_MINECRAFT_COMPANION_ROOM_CUSTODY_EVIDENCE_SCHEMA),
  capability_id: z.literal(
    HELIX_MINECRAFT_COMPANION_CUSTODY_EVIDENCE_CAPABILITY,
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
  evidence: helixMinecraftCompanionCustodyEvidenceSchema,
  exact_identity_match: z.literal(true),
  exact_revision_match: z.literal(true),
  room_binding_active: z.literal(true),
  read_only: z.literal(true),
  commands_executed: z.literal(0),
  side_effects: z.literal(false),
  environment_mutated: z.literal(false),
  public_capability_exposed: z.literal(false),
  execution_authority: z.literal(false),
  inventory_execution_authority: z.literal(false),
  mining_authority: z.literal(false),
  crafting_authority: z.literal(false),
  combat_authority: z.literal(false),
  world_authority: z.literal(false),
  credential_included: z.literal(false),
  private_endpoint_included: z.literal(false),
  hidden_reasoning_included: z.literal(false),
  content_role: z.literal(
    "minecraft_companion_room_custody_evidence_not_assistant_answer",
  ),
  reentry_required: z.literal(true),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
}).strict();

export type HelixMinecraftCompanionCustodyEvidenceReadRequest = z.infer<
  typeof helixMinecraftCompanionCustodyEvidenceReadRequestSchema
>;
export type HelixMinecraftCompanionCustodyEvidence = z.infer<
  typeof helixMinecraftCompanionCustodyEvidenceSchema
>;
export type HelixMinecraftCompanionRoomCustodyEvidence = z.infer<
  typeof helixMinecraftCompanionRoomCustodyEvidenceSchema
>;
