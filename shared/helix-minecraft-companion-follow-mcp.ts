import { z } from "zod";

import { helixMinecraftCompanionPresenceIdentitySchema } from
  "./helix-minecraft-companion-mcp";

export const HELIX_MINECRAFT_COMPANION_FOLLOW_EVIDENCE_READ_TOOL =
  "helix_minecraft_companion_follow_evidence_read" as const;
export const HELIX_MINECRAFT_COMPANION_ROOM_FOLLOW_EVIDENCE_READ_TOOL =
  "helix_minecraft_companion_room_follow_evidence_read" as const;
export const HELIX_MINECRAFT_COMPANION_FOLLOW_EVIDENCE_CAPABILITY =
  "resident.minecraft.companion-follow-evidence.read.v1" as const;
export const HELIX_MINECRAFT_COMPANION_FOLLOW_EVIDENCE_SCHEMA =
  "helix.minecraft_companion.follow_evidence.v1" as const;
export const HELIX_MINECRAFT_COMPANION_ROOM_FOLLOW_EVIDENCE_SCHEMA =
  "helix.minecraft_companion.room_follow_evidence.v1" as const;

const identifierSchema = z.string().trim().min(1).max(320)
  .regex(/^[a-zA-Z0-9:._/-]+$/u);
const sha256Schema = z.string().regex(/^sha256:[a-f0-9]{64}$/u);

export const helixMinecraftCompanionFollowEvidenceReadRequestSchema = z.object({
  identity: helixMinecraftCompanionPresenceIdentitySchema,
  controller_artifact_hash: sha256Schema,
}).strict();

export const helixMinecraftCompanionRoomFollowEvidenceReadRequestSchema =
  helixMinecraftCompanionFollowEvidenceReadRequestSchema.extend({
    room_id: identifierSchema,
  }).strict();

export const helixMinecraftCompanionFollowProfileSchema = z.object({
  follow_start_distance_blocks: z.literal(6),
  follow_stop_distance_blocks: z.literal(3),
  maximum_target_radius_blocks: z.literal(24),
  nearby_waypoint_radius_blocks: z.literal(16),
  navigation_speed: z.literal(1),
  path_recalculation_interval_ticks: z.literal(5),
  maximum_consecutive_path_failures: z.literal(4),
  no_progress_ceiling_ticks: z.literal(20),
  target_observation_age_ceiling_ticks: z.literal(20),
  default_action_lease_ticks: z.literal(200),
  chunk_policy: z.literal("already_loaded_only"),
}).strict();

const caseIdSchema = z.enum([
  "follow_hysteresis_hold_look_delay_serialization_emergency_stop",
  "nearby_waypoint_return_bounds",
  "obstruction_target_loss_release",
  "lease_expiry_restart_stale_rejection",
]);

export const helixMinecraftCompanionFollowCaseReceiptSchema = z.object({
  case_id: caseIdSchema,
  game_test_id: identifierSchema,
  passed: z.literal(true),
  native_path_navigation_used: z.boolean(),
  typed_outcomes: z.array(identifierSchema).min(1).max(24),
  controls_released: z.literal(true),
  tasks_released: z.literal(true),
  late_effects_observed: z.literal(0),
  inventory_authority: z.literal(false),
  mining_authorized: z.literal(false),
  combat_authorized: z.literal(false),
  world_authority_used: z.literal(false),
}).strict();

export const helixMinecraftCompanionFollowEvidenceSchema = z.object({
  schema: z.literal(HELIX_MINECRAFT_COMPANION_FOLLOW_EVIDENCE_SCHEMA),
  capability_id: z.literal(
    HELIX_MINECRAFT_COMPANION_FOLLOW_EVIDENCE_CAPABILITY,
  ),
  source_lane: z.literal("C1_A0_direct_fabric"),
  identity: helixMinecraftCompanionPresenceIdentitySchema,
  controller_profile_id: z.literal("resident.minecraft.companion-follow.v1"),
  controller_artifact_hash: sha256Schema,
  minecraft_version: z.literal("1.21.8"),
  fabric_loader_version: z.literal("0.18.4"),
  game_test_total: z.literal(22),
  game_test_passed: z.literal(22),
  c1_case_receipts: z.array(helixMinecraftCompanionFollowCaseReceiptSchema)
    .length(4),
  profile: helixMinecraftCompanionFollowProfileSchema,
  exact_identity_match: z.literal(true),
  codex_delay_continuity_proven: z.literal(true),
  serialized_authority_proven: z.literal(true),
  lease_cleanup_proven: z.literal(true),
  manual_cleanup_proven: z.literal(true),
  emergency_stop_cleanup_proven: z.literal(true),
  restart_stale_action_rejected: z.literal(true),
  public_capability_exposed: z.literal(false),
  execution_authority: z.literal(false),
  mutation_authority: z.literal(false),
  inventory_authority: z.literal(false),
  mining_authorized: z.literal(false),
  combat_authorized: z.literal(false),
  credential_included: z.literal(false),
  content_role: z.literal(
    "minecraft_companion_follow_evidence_not_assistant_answer",
  ),
  reentry_required: z.literal(true),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
  observed_at: z.string().datetime({ offset: true }),
  support_refs: z.array(identifierSchema).min(4).max(32),
}).strict().superRefine((evidence, context) => {
  const caseIds = new Set(evidence.c1_case_receipts.map((receipt) => receipt.case_id));
  if (caseIds.size !== 4) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["c1_case_receipts"],
      message: "C1 evidence must contain each frozen case exactly once.",
    });
  }
  if (!evidence.c1_case_receipts.some((receipt) => receipt.native_path_navigation_used)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["c1_case_receipts"],
      message: "C1 evidence must include native path-navigation execution.",
    });
  }
});

export const helixMinecraftCompanionRoomFollowEvidenceSchema = z.object({
  schema: z.literal(HELIX_MINECRAFT_COMPANION_ROOM_FOLLOW_EVIDENCE_SCHEMA),
  capability_id: z.literal(
    HELIX_MINECRAFT_COMPANION_FOLLOW_EVIDENCE_CAPABILITY,
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
  evidence: helixMinecraftCompanionFollowEvidenceSchema,
  exact_identity_match: z.literal(true),
  room_binding_active: z.literal(true),
  read_only: z.literal(true),
  commands_executed: z.literal(0),
  side_effects: z.literal(false),
  environment_mutated: z.literal(false),
  public_capability_exposed: z.literal(false),
  execution_authority: z.literal(false),
  mutation_authority: z.literal(false),
  inventory_authority: z.literal(false),
  mining_authorized: z.literal(false),
  combat_authorized: z.literal(false),
  credential_included: z.literal(false),
  private_endpoint_included: z.literal(false),
  hidden_reasoning_included: z.literal(false),
  content_role: z.literal(
    "minecraft_companion_room_follow_evidence_not_assistant_answer",
  ),
  reentry_required: z.literal(true),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
}).strict();

export type HelixMinecraftCompanionFollowEvidenceReadRequest = z.infer<
  typeof helixMinecraftCompanionFollowEvidenceReadRequestSchema
>;
export type HelixMinecraftCompanionFollowEvidence = z.infer<
  typeof helixMinecraftCompanionFollowEvidenceSchema
>;
export type HelixMinecraftCompanionRoomFollowEvidence = z.infer<
  typeof helixMinecraftCompanionRoomFollowEvidenceSchema
>;
