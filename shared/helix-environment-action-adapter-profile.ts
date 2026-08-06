import { z } from "zod";
import {
  HELIX_ENVIRONMENT_ACTION_CONNECTOR_HEARTBEAT_SCHEMA,
  HELIX_ENVIRONMENT_ACTION_CONNECTOR_MANIFEST_SCHEMA,
  HELIX_ENVIRONMENT_ACTION_OBSERVATION_SCHEMA,
  HELIX_ENVIRONMENT_ACTION_REQUEST_SCHEMA,
  HELIX_ENVIRONMENT_ACTION_RESULT_SCHEMA,
  HELIX_ENVIRONMENT_ACTION_WORKFLOW_EVENT_SCHEMA,
  HELIX_ENVIRONMENT_ACTION_CONTROL_ENGINES,
} from "./helix-environment-action";

export const HELIX_ENVIRONMENT_ACTION_ADAPTER_PROFILE_SCHEMA =
  "helix.environment_action_adapter_profile.v1" as const;
export const HELIX_MINECRAFT_FABRIC_PLAYER_ACTION_PROFILE_ID =
  "game.minecraft.player.fabric.v1" as const;

const identifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(320)
  .regex(/^[a-zA-Z0-9:._/-]+$/);
const sha256Schema = z.string().regex(/^sha256:[a-f0-9]{64}$/);

export const helixEnvironmentActionAdapterCapabilitySchema = z
  .object({
    capability_id: identifierSchema,
    capability_version: z.number().int().positive(),
    action_kind: identifierSchema,
    effect_class: z.enum([
      "player_motion",
      "player_interaction",
      "player_inventory",
      "world_mutation",
      "continuous_control",
    ]),
    workflow_modes: z
      .array(z.enum(["single_action", "long_running"]))
      .min(1)
      .max(2),
    allowed_control_engines: z
      .array(z.enum(HELIX_ENVIRONMENT_ACTION_CONTROL_ENGINES))
      .min(1)
      .max(2),
    default_confirmation_required: z.boolean(),
    world_mutation_scope_required: z.boolean(),
  })
  .strict()
  .superRefine((capability, context) => {
    if (
      capability.effect_class === "world_mutation" &&
      !capability.world_mutation_scope_required
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["world_mutation_scope_required"],
        message: "World-mutation capabilities require an explicit scope.",
      });
    }
  });

export const helixEnvironmentActionAdapterProfileSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_ACTION_ADAPTER_PROFILE_SCHEMA),
    profile_id: identifierSchema,
    profile_version: z.number().int().positive(),
    domain: identifierSchema,
    action_family: identifierSchema,
    accepted_domain_adapters: z.array(identifierSchema).min(1).max(64),
    compatible_source_profile_ids: z.array(identifierSchema).min(1).max(64),
    world_id_prefixes: z.array(identifierSchema).min(1).max(64),
    protocol_schemas: z
      .object({
        manifest: z.literal(HELIX_ENVIRONMENT_ACTION_CONNECTOR_MANIFEST_SCHEMA),
        heartbeat: z.literal(HELIX_ENVIRONMENT_ACTION_CONNECTOR_HEARTBEAT_SCHEMA),
        action_request: z.literal(HELIX_ENVIRONMENT_ACTION_REQUEST_SCHEMA),
        workflow_event: z.literal(HELIX_ENVIRONMENT_ACTION_WORKFLOW_EVENT_SCHEMA),
        action_result: z.literal(HELIX_ENVIRONMENT_ACTION_RESULT_SCHEMA),
        normalized_observation: z.literal(HELIX_ENVIRONMENT_ACTION_OBSERVATION_SCHEMA),
      })
      .strict(),
    capabilities: z
      .array(helixEnvironmentActionAdapterCapabilitySchema)
      .min(1)
      .max(128),
    freshness: z
      .object({
        heartbeat_max_age_ms: z.number().int().positive().max(5 * 60_000),
        manifest_max_age_ms: z.number().int().positive().max(24 * 60 * 60_000),
        workflow_event_max_age_ms: z.number().int().positive().max(60 * 60_000),
      })
      .strict(),
    safety_policy: z
      .object({
        separate_pairing_required: z.literal(true),
        action_credential_reused: z.literal(false),
        host_access_allowed: z.literal(false),
        automatic_replay_allowed: z.literal(false),
        manual_override_required: z.literal(true),
        postcondition_verification_required: z.literal(true),
        emergency_stop_required: z.literal(true),
        release_controls_on_disconnect_required: z.literal(true),
        connector_model_execution_allowed: z.literal(false),
      })
      .strict(),
    mechanics_collection_ids: z.array(identifierSchema).max(32),
    lifecycle: z
      .object({
        status: z.enum(["enabled", "deprecated", "disabled", "fixture_only"]),
        replacement_profile_id: identifierSchema.nullable(),
      })
      .strict(),
    contract_hash: sha256Schema.optional(),
    assistant_answer: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict()
  .superRefine((profile, context) => {
    const identities = new Set<string>();
    const actionKinds = new Set<string>();
    for (const [index, capability] of profile.capabilities.entries()) {
      const identity = `${capability.capability_id}@${capability.capability_version}`;
      if (identities.has(identity)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["capabilities", index, "capability_id"],
          message: "Action capability identities must be unique per version.",
        });
      }
      identities.add(identity);
      if (actionKinds.has(capability.action_kind)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["capabilities", index, "action_kind"],
          message: "An action profile cannot ambiguously map one action kind.",
        });
      }
      actionKinds.add(capability.action_kind);
    }
  });

export type HelixEnvironmentActionAdapterProfile = z.infer<
  typeof helixEnvironmentActionAdapterProfileSchema
>;

export type HelixEnvironmentActionAdapterRegistryRecord = {
  profile: HelixEnvironmentActionAdapterProfile;
  contract_hash: `sha256:${string}`;
};
