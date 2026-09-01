import { z } from "zod";
import {
  HELIX_RESIDENT_CONTROLLER_RECEIPT_SCHEMA,
  helixResidentControllerIdentitySchema,
  helixResidentControllerReceiptSchema,
} from "./helix-resident-controller";

export const HELIX_MINECRAFT_COMPANION_BINDING_SCHEMA =
  "helix.minecraft_companion.binding.v1" as const;
export const HELIX_MINECRAFT_COMPANION_ACTION_SCHEMA =
  "helix.minecraft_companion.action.v1" as const;
export const HELIX_MINECRAFT_COMPANION_RECEIPT_SCHEMA =
  "helix.minecraft_companion.receipt.v1" as const;
export const HELIX_MINECRAFT_COMPANION_CAPABILITY_DECLARATION_SCHEMA =
  "helix.minecraft_companion.capability_declaration.v1" as const;

export const HELIX_MINECRAFT_COMPANION_S1_ACTIONS = [
  "observe",
  "follow",
  "hold",
  "look_at",
  "navigate_nearby",
  "return_to_owner",
  "release",
  "abstain",
] as const;

const identifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(320)
  .regex(/^[a-zA-Z0-9:._/-]+$/u);
const timestampSchema = z.string().datetime({ offset: true });
const sha256Schema = z.string().regex(/^sha256:[a-f0-9]{64}$/u);

export const helixMinecraftCompanionIdentitySchema =
  helixResidentControllerIdentitySchema.extend({
    companion_id: identifierSchema,
    actor_entity_id: identifierSchema,
    target_subject_id: identifierSchema.nullable(),
  });

export type HelixMinecraftCompanionIdentity = z.infer<
  typeof helixMinecraftCompanionIdentitySchema
>;

export const helixMinecraftCompanionBindingSchema = z
  .object({
    schema: z.literal(HELIX_MINECRAFT_COMPANION_BINDING_SCHEMA),
    binding_id: identifierSchema,
    identity: helixMinecraftCompanionIdentitySchema,
    visible_actor: z
      .object({
        entity_id: identifierSchema,
        incarnation_id: identifierSchema,
        canonical_location: z.literal(true),
        canonical_health: z.literal(true),
        canonical_inventory: z.literal(true),
        canonical_equipment: z.literal(true),
        canonical_xp: z.literal(true),
        targetable: z.literal(true),
      })
      .strict(),
    interaction_backend: z
      .object({
        backend_id: z.literal("bounded_unregistered_player_semantics_v1"),
        backend_version: identifierSchema,
        visible_body: z.literal(false),
        online_player_registration: z.literal(false),
        independent_location: z.literal(false),
        independent_health: z.literal(false),
        independent_inventory: z.literal(false),
        independent_pickup_owner: z.literal(false),
        independent_advancement_identity: z.literal(false),
        command_lane_enabled: z.literal(false),
        maximum_discarded_update_packets: z.number().int().nonnegative().max(256),
      })
      .strict(),
    one_actor_one_economy: z.literal(true),
    observed_at: timestampSchema,
    evidence_refs: z.array(identifierSchema).min(1).max(128),
    credential_included: z.literal(false),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
  })
  .strict()
  .superRefine((binding, context) => {
    if (
      binding.visible_actor.entity_id !== binding.identity.actor_entity_id ||
      binding.visible_actor.entity_id !== binding.identity.actor_runtime_id
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["visible_actor", "entity_id"],
        message: "The visible companion must be the resident-controller actor.",
      });
    }
    if (binding.identity.companion_id !== binding.identity.actor_id) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["identity", "companion_id"],
        message: "The durable companion must be the resident-controller logical actor.",
      });
    }
    if (
      binding.visible_actor.incarnation_id !==
      binding.identity.actor_incarnation_id
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["visible_actor", "incarnation_id"],
        message: "The visible companion incarnation must match the controller identity.",
      });
    }
  });

export type HelixMinecraftCompanionBinding = z.infer<
  typeof helixMinecraftCompanionBindingSchema
>;

const targetSchema = z
  .object({
    subject_id: identifierSchema,
    entity_id: identifierSchema,
    observation_revision: z.number().int().nonnegative(),
  })
  .strict();

const actionPayloadSchema = z.discriminatedUnion("action_kind", [
  z.object({ action_kind: z.literal("observe") }).strict(),
  z
    .object({
      action_kind: z.literal("follow"),
      target: targetSchema,
      start_distance: z.number().positive().max(64),
      stop_distance: z.number().positive().max(64),
      maximum_radius: z.number().positive().max(256),
    })
    .strict(),
  z.object({ action_kind: z.literal("hold") }).strict(),
  z.object({ action_kind: z.literal("look_at"), target: targetSchema }).strict(),
  z
    .object({
      action_kind: z.literal("navigate_nearby"),
      waypoint: z.object({ x: z.number(), y: z.number(), z: z.number() }).strict(),
      maximum_radius: z.number().positive().max(256),
    })
    .strict(),
  z.object({ action_kind: z.literal("return_to_owner") }).strict(),
  z.object({ action_kind: z.literal("release") }).strict(),
  z.object({ action_kind: z.literal("abstain"), reason: z.string().trim().min(1).max(4_000) }).strict(),
]);

export const helixMinecraftCompanionActionSchema = z
  .object({
    schema: z.literal(HELIX_MINECRAFT_COMPANION_ACTION_SCHEMA),
    action_id: identifierSchema,
    proposal_id: identifierSchema,
    binding_id: identifierSchema,
    identity: helixMinecraftCompanionIdentitySchema,
    payload: actionPayloadSchema,
    actor_lease_id: identifierSchema,
    effect_lease_id: identifierSchema,
    requested_at: timestampSchema,
    expires_at: timestampSchema,
    public_capability_exposed: z.literal(false),
    world_authority_used: z.literal(false),
    mining_authorized: z.literal(false),
    command_execution_authorized: z.literal(false),
    automatic_replay: z.literal(false),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
  })
  .strict()
  .superRefine((action, context) => {
    if (Date.parse(action.expires_at) <= Date.parse(action.requested_at)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expires_at"],
        message: "Companion action expiry must be after its request time.",
      });
    }
    if (
      "target" in action.payload &&
      action.identity.target_subject_id !== action.payload.target.subject_id
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["payload", "target", "subject_id"],
        message: "Action target must match the admitted companion identity.",
      });
    }
    if (
      action.payload.action_kind === "follow" &&
      action.payload.start_distance <= action.payload.stop_distance
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["payload", "start_distance"],
        message: "Follow start distance must exceed stop distance for hysteresis.",
      });
    }
  });

export type HelixMinecraftCompanionAction = z.infer<
  typeof helixMinecraftCompanionActionSchema
>;

export const helixMinecraftCompanionReceiptSchema = z
  .object({
    schema: z.literal(HELIX_MINECRAFT_COMPANION_RECEIPT_SCHEMA),
    resident_receipt: helixResidentControllerReceiptSchema,
    binding_id: identifierSchema,
    action_id: identifierSchema,
    companion_id: identifierSchema,
    actor_entity_id: identifierSchema,
    actor_incarnation_id: identifierSchema,
    interaction_backend_id: z.literal("bounded_unregistered_player_semantics_v1"),
    interaction_backend_version: identifierSchema,
    canonical_state_before_hash: sha256Schema,
    canonical_state_after_hash: sha256Schema,
    backend_working_state_discarded: z.literal(true),
    backend_owned_inventory: z.literal(false),
    backend_owned_health: z.literal(false),
    backend_owned_position: z.literal(false),
    settlement_count: z.number().int().min(0).max(1),
    late_effect_count: z.literal(0),
    duplicate_effect_count: z.literal(0),
    public_capability_exposed: z.literal(false),
    mining_authorized: z.literal(false),
    credential_included: z.literal(false),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
  })
  .strict()
  .superRefine((receipt, context) => {
    if (receipt.resident_receipt.schema !== HELIX_RESIDENT_CONTROLLER_RECEIPT_SCHEMA) return;
    if (
      receipt.companion_id !== receipt.resident_receipt.identity.actor_id ||
      receipt.actor_entity_id !== receipt.resident_receipt.identity.actor_runtime_id ||
      receipt.actor_incarnation_id !==
        receipt.resident_receipt.identity.actor_incarnation_id
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["resident_receipt", "identity"],
        message: "Hybrid receipt identity must settle against the one visible actor.",
      });
    }
    if (
      receipt.resident_receipt.outcome !== "completed" &&
      receipt.settlement_count !== 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["settlement_count"],
        message: "A non-completed action cannot commit a hybrid settlement.",
      });
    }
  });

export const helixMinecraftCompanionCapabilityDeclarationSchema = z
  .object({
    schema: z.literal(HELIX_MINECRAFT_COMPANION_CAPABILITY_DECLARATION_SCHEMA),
    capability_id: identifierSchema,
    lifecycle: z.enum(["s1_contract_only", "future_acceptance"]),
    public_catalog_exposed: z.literal(false),
    execution_enabled: z.literal(false),
    world_authority_substitution_allowed: z.literal(false),
    command_fallback_allowed: z.literal(false),
    acceptance_required: z.array(z.enum(["C2", "C3", "A0", "A1", "B"])).min(1),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
  })
  .strict();

export const HELIX_MINECRAFT_COMPANION_MINING_S1_DECLARATION =
  helixMinecraftCompanionCapabilityDeclarationSchema.parse({
    schema: HELIX_MINECRAFT_COMPANION_CAPABILITY_DECLARATION_SCHEMA,
    capability_id: "com.casimirbot.minecraft.companion.mine",
    lifecycle: "s1_contract_only",
    public_catalog_exposed: false,
    execution_enabled: false,
    world_authority_substitution_allowed: false,
    command_fallback_allowed: false,
    acceptance_required: ["C2", "C3", "A0", "A1", "B"],
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
  });
