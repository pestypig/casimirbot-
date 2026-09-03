import { z } from "zod";

import { helixMinecraftCompanionPresenceIdentitySchema } from
  "./helix-minecraft-companion-mcp";

export const HELIX_MINECRAFT_COMPANION_MINING_EVIDENCE_READ_TOOL =
  "helix_minecraft_companion_mining_evidence_read" as const;
export const HELIX_MINECRAFT_COMPANION_ROOM_MINING_EVIDENCE_READ_TOOL =
  "helix_minecraft_companion_room_mining_evidence_read" as const;
export const HELIX_MINECRAFT_COMPANION_MINING_EVIDENCE_CAPABILITY =
  "resident.minecraft.companion-mining-evidence.read.v1" as const;
export const HELIX_MINECRAFT_COMPANION_MINING_EVIDENCE_SCHEMA =
  "helix.minecraft_companion.mining_evidence.v1" as const;
export const HELIX_MINECRAFT_COMPANION_ROOM_MINING_EVIDENCE_SCHEMA =
  "helix.minecraft_companion.room_mining_evidence.v1" as const;

const identifierSchema = z.string().trim().min(1).max(420)
  .regex(/^[a-zA-Z0-9:._/-]+$/u);
const sha256Schema = z.string().regex(/^sha256:[a-f0-9]{64}$/u);

export const helixMinecraftCompanionMiningEvidenceReadRequestSchema = z.object({
  identity: helixMinecraftCompanionPresenceIdentitySchema,
  controller_artifact_hash: sha256Schema,
  custody_revision: z.number().int().positive(),
}).strict();

export const helixMinecraftCompanionRoomMiningEvidenceReadRequestSchema =
  helixMinecraftCompanionMiningEvidenceReadRequestSchema.extend({
    room_id: identifierSchema,
  }).strict();

const caseIdSchema = z.enum([
  "stone_drop_wear_atomic",
  "stale_revision_rollback",
  "final_durability_break",
  "tick_guard_interruptions",
  "hand_wrong_tool_protection",
  "restart_incarnation_isolation",
  "modifier_matrix",
]);

const miningCaseReceiptSchema = z.object({
  schema: z.literal("helix.minecraft_companion.mining_case_evidence.v1"),
  controller_artifact_hash: sha256Schema,
  case_id: caseIdSchema,
  game_test_id: identifierSchema,
  facts: z.record(z.string(), z.string().max(420)),
}).strict();

export const helixMinecraftCompanionMiningEvidenceSchema = z.object({
  schema: z.literal(HELIX_MINECRAFT_COMPANION_MINING_EVIDENCE_SCHEMA),
  capability_id: z.literal(HELIX_MINECRAFT_COMPANION_MINING_EVIDENCE_CAPABILITY),
  source_lane: z.literal("C3_A0_direct_fabric"),
  identity: helixMinecraftCompanionPresenceIdentitySchema,
  controller_profile_id: z.literal("resident.minecraft.companion-mining.v1"),
  controller_artifact_hash: sha256Schema,
  custody_revision: z.number().int().positive(),
  minecraft_version: z.literal("1.21.8"),
  fabric_loader_version: z.literal("0.18.4"),
  focused_game_test_total: z.literal(7),
  focused_game_test_passed: z.literal(7),
  case_receipts: z.array(miningCaseReceiptSchema).length(7),
  dirt_hand_ticks: z.literal(15),
  stone_wood_pick_ticks: z.literal(23),
  haste_one_ticks: z.literal(19),
  mining_fatigue_one_ticks: z.literal(75),
  submerged_ticks: z.literal(113),
  airborne_ticks: z.literal(113),
  wrong_tool_drop_count: z.literal(0),
  protection_cancellation_proven: z.literal(true),
  target_replacement_rejected: z.literal(true),
  range_loss_rejected: z.literal(true),
  lease_expiry_rejected: z.literal(true),
  emergency_stop_rejected: z.literal(true),
  restart_stale_incarnation_rejected: z.literal(true),
  tool_breakage_proven: z.literal(true),
  atomic_block_drop_custody_settlement: z.literal(true),
  zero_duplication_or_loss: z.literal(true),
  late_effect_count: z.literal(0),
  duplicate_effect_count: z.literal(0),
  public_capability_exposed: z.literal(false),
  execution_authority: z.literal(false),
  mining_execution_authority: z.literal(false),
  crafting_authority: z.literal(false),
  combat_authority: z.literal(false),
  world_authority: z.literal(false),
  credential_included: z.literal(false),
  content_role: z.literal("minecraft_companion_mining_evidence_not_assistant_answer"),
  reentry_required: z.literal(true),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
  observed_at: z.string().datetime({ offset: true }),
}).strict().superRefine((evidence, context) => {
  const ids = new Set(evidence.case_receipts.map((receipt) => receipt.case_id));
  const hashes = new Set(evidence.case_receipts.map((receipt) => receipt.controller_artifact_hash));
  if (ids.size !== 7 || hashes.size !== 1 || !hashes.has(evidence.controller_artifact_hash)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["case_receipts"],
      message: "C3 evidence must contain every frozen case exactly once under one controller hash.",
    });
  }
});

export const helixMinecraftCompanionRoomMiningEvidenceSchema = z.object({
  schema: z.literal(HELIX_MINECRAFT_COMPANION_ROOM_MINING_EVIDENCE_SCHEMA),
  capability_id: z.literal(HELIX_MINECRAFT_COMPANION_MINING_EVIDENCE_CAPABILITY),
  room_id: identifierSchema,
  owner_profile_ref: identifierSchema,
  requesting_participant_ref: identifierSchema,
  room_role: z.literal("owner"),
  room_status: z.enum(["waiting_for_participant", "waiting_for_consent", "ready", "active"]),
  observation_origin: z.literal("room_projection"),
  admission_basis: z.literal("room_owner_private_config"),
  evidence: helixMinecraftCompanionMiningEvidenceSchema,
  exact_identity_match: z.literal(true),
  exact_revision_match: z.literal(true),
  room_binding_active: z.literal(true),
  read_only: z.literal(true),
  commands_executed: z.literal(0),
  side_effects: z.literal(false),
  environment_mutated: z.literal(false),
  public_capability_exposed: z.literal(false),
  execution_authority: z.literal(false),
  mining_execution_authority: z.literal(false),
  crafting_authority: z.literal(false),
  combat_authority: z.literal(false),
  world_authority: z.literal(false),
  credential_included: z.literal(false),
  private_endpoint_included: z.literal(false),
  hidden_reasoning_included: z.literal(false),
  content_role: z.literal("minecraft_companion_room_mining_evidence_not_assistant_answer"),
  reentry_required: z.literal(true),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
}).strict();

export type HelixMinecraftCompanionMiningEvidenceReadRequest = z.infer<
  typeof helixMinecraftCompanionMiningEvidenceReadRequestSchema
>;
export type HelixMinecraftCompanionMiningEvidence = z.infer<
  typeof helixMinecraftCompanionMiningEvidenceSchema
>;
