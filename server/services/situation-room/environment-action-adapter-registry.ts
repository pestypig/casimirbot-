import crypto from "node:crypto";
import {
  HELIX_ENVIRONMENT_ACTION_ADAPTER_PROFILE_SCHEMA,
  HELIX_MINECRAFT_FABRIC_PLAYER_ACTION_PROFILE_ID,
  helixEnvironmentActionAdapterProfileSchema,
  type HelixEnvironmentActionAdapterProfile,
  type HelixEnvironmentActionAdapterRegistryRecord,
} from "@shared/helix-environment-action-adapter-profile";
import { HELIX_MINECRAFT_ADAPTER_PROFILE_ID } from "@shared/helix-environment-adapter-profile";
import {
  HELIX_ENVIRONMENT_ACTION_CONNECTOR_HEARTBEAT_SCHEMA,
  HELIX_ENVIRONMENT_ACTION_CONNECTOR_MANIFEST_SCHEMA,
  HELIX_ENVIRONMENT_ACTION_OBSERVATION_SCHEMA,
  HELIX_ENVIRONMENT_ACTION_REQUEST_SCHEMA,
  HELIX_ENVIRONMENT_ACTION_RESULT_SCHEMA,
  HELIX_ENVIRONMENT_ACTION_WORKFLOW_EVENT_SCHEMA,
} from "@shared/helix-environment-action";
import {
  HELIX_MINECRAFT_PLAYER_CAMERA_TRACK_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_COLLECT_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_CRAFT_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_EQUIP_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_EXECUTE_REACTIVE_PROGRAM_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_ARM_VIABILITY_GUARDIAN_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_DISARM_VIABILITY_GUARDIAN_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_FOLLOW_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_HOTBAR_SELECT_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_INVENTORY_TRANSFER_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_INTERACT_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_JUMP_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_LOOK_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_MINE_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_NAVIGATE_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_PLACE_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_WALK_CAPABILITY,
} from "@shared/helix-minecraft-player-capabilities";
import { HELIX_MINECRAFT_PLAYER_EXECUTE_SEQUENCE_CAPABILITY } from "@shared/helix-minecraft-fluid-sequence";

export type EnvironmentActionAdapterRegistryErrorCode =
  | "environment_action_adapter_unknown"
  | "environment_action_adapter_disabled"
  | "environment_action_adapter_identity_mismatch";

export class EnvironmentActionAdapterRegistryError extends Error {
  constructor(
    readonly code: EnvironmentActionAdapterRegistryErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "EnvironmentActionAdapterRegistryError";
  }
}

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]),
  );
};

export const environmentActionAdapterContractHash = (
  profile: HelixEnvironmentActionAdapterProfile,
): `sha256:${string}` =>
  `sha256:${crypto
    .createHash("sha256")
    .update(JSON.stringify(canonicalize(profile)), "utf8")
    .digest("hex")}`;

const capability = (
  capabilityId: string,
  actionKind: string,
  effectClass:
    | "player_motion"
    | "player_interaction"
    | "player_inventory"
    | "world_mutation"
    | "continuous_control",
  workflowModes: Array<"single_action" | "long_running">,
  allowedControlEngines: Array<"native_fabric" | "baritone"> =
    actionKind === "navigate_to"
      ? ["native_fabric", "baritone"]
      : ["native_fabric"],
  worldMutationScopeRequired = effectClass === "world_mutation",
) => ({
  capability_id: capabilityId,
  capability_version: 1,
  action_kind: actionKind,
  effect_class: effectClass,
  workflow_modes: workflowModes,
  allowed_control_engines: allowedControlEngines,
  default_confirmation_required: true,
  world_mutation_scope_required: worldMutationScopeRequired,
});

const minecraftFabricPlayerProfile = helixEnvironmentActionAdapterProfileSchema.parse({
  schema: HELIX_ENVIRONMENT_ACTION_ADAPTER_PROFILE_SCHEMA,
  profile_id: HELIX_MINECRAFT_FABRIC_PLAYER_ACTION_PROFILE_ID,
  profile_version: 5,
  domain: "minecraft",
  action_family: "minecraft_player",
  accepted_domain_adapters: ["minecraft.fabric_client.v1"],
  compatible_source_profile_ids: [HELIX_MINECRAFT_ADAPTER_PROFILE_ID],
  world_id_prefixes: ["minecraft:"],
  protocol_schemas: {
    manifest: HELIX_ENVIRONMENT_ACTION_CONNECTOR_MANIFEST_SCHEMA,
    heartbeat: HELIX_ENVIRONMENT_ACTION_CONNECTOR_HEARTBEAT_SCHEMA,
    action_request: HELIX_ENVIRONMENT_ACTION_REQUEST_SCHEMA,
    workflow_event: HELIX_ENVIRONMENT_ACTION_WORKFLOW_EVENT_SCHEMA,
    action_result: HELIX_ENVIRONMENT_ACTION_RESULT_SCHEMA,
    normalized_observation: HELIX_ENVIRONMENT_ACTION_OBSERVATION_SCHEMA,
  },
  capabilities: [
    capability(
      HELIX_MINECRAFT_PLAYER_NAVIGATE_CAPABILITY,
      "navigate_to",
      "continuous_control",
      ["long_running"],
    ),
    capability(
      HELIX_MINECRAFT_PLAYER_LOOK_CAPABILITY,
      "look_at",
      "player_motion",
      ["single_action"],
    ),
    capability(
      HELIX_MINECRAFT_PLAYER_CAMERA_TRACK_CAPABILITY,
      "track_target",
      "continuous_control",
      ["long_running"],
    ),
    capability(
      HELIX_MINECRAFT_PLAYER_WALK_CAPABILITY,
      "walk",
      "continuous_control",
      ["long_running"],
    ),
    capability(
      HELIX_MINECRAFT_PLAYER_JUMP_CAPABILITY,
      "jump",
      "player_motion",
      ["single_action"],
    ),
    capability(
      HELIX_MINECRAFT_PLAYER_INTERACT_CAPABILITY,
      "interact",
      "player_interaction",
      ["single_action"],
    ),
    capability(
      HELIX_MINECRAFT_PLAYER_HOTBAR_SELECT_CAPABILITY,
      "hotbar_select",
      "player_inventory",
      ["single_action"],
    ),
    capability(
      HELIX_MINECRAFT_PLAYER_EQUIP_CAPABILITY,
      "equip",
      "player_inventory",
      ["single_action"],
    ),
    capability(
      HELIX_MINECRAFT_PLAYER_FOLLOW_CAPABILITY,
      "follow",
      "continuous_control",
      ["long_running"],
    ),
    capability(
      HELIX_MINECRAFT_PLAYER_COLLECT_CAPABILITY,
      "collect",
      "continuous_control",
      ["long_running"],
    ),
    capability(
      HELIX_MINECRAFT_PLAYER_MINE_CAPABILITY,
      "mine",
      "world_mutation",
      ["long_running"],
    ),
    capability(
      HELIX_MINECRAFT_PLAYER_PLACE_CAPABILITY,
      "place",
      "world_mutation",
      ["long_running"],
    ),
    capability(
      HELIX_MINECRAFT_PLAYER_CRAFT_CAPABILITY,
      "craft",
      "player_inventory",
      ["long_running"],
    ),
    capability(
      HELIX_MINECRAFT_PLAYER_INVENTORY_TRANSFER_CAPABILITY,
      "inventory_transfer",
      "player_inventory",
      ["long_running"],
    ),
    capability(
      HELIX_MINECRAFT_PLAYER_EXECUTE_SEQUENCE_CAPABILITY,
      "execute_sequence",
      "continuous_control",
      ["long_running"],
      ["native_fabric"],
      true,
    ),
    capability(
      HELIX_MINECRAFT_PLAYER_EXECUTE_REACTIVE_PROGRAM_CAPABILITY,
      "execute_reactive_program",
      "continuous_control",
      ["long_running"],
      ["native_fabric"],
      true,
    ),
    capability(
      HELIX_MINECRAFT_PLAYER_ARM_VIABILITY_GUARDIAN_CAPABILITY,
      "arm_viability_guardian",
      "continuous_control",
      ["single_action"],
      ["native_fabric"],
    ),
    capability(
      HELIX_MINECRAFT_PLAYER_DISARM_VIABILITY_GUARDIAN_CAPABILITY,
      "disarm_viability_guardian",
      "continuous_control",
      ["single_action"],
      ["native_fabric"],
    ),
  ],
  freshness: {
    heartbeat_max_age_ms: 30_000,
    manifest_max_age_ms: 24 * 60 * 60_000,
    workflow_event_max_age_ms: 120_000,
  },
  safety_policy: {
    separate_pairing_required: true,
    action_credential_reused: false,
    host_access_allowed: false,
    automatic_replay_allowed: false,
    manual_override_required: true,
    postcondition_verification_required: true,
    emergency_stop_required: true,
    release_controls_on_disconnect_required: true,
    connector_model_execution_allowed: false,
  },
  mechanics_collection_ids: [
    "mechanics.minecraft.java.v1",
    "mechanics.minecraft.commands.v1",
  ],
  lifecycle: { status: "enabled", replacement_profile_id: null },
  assistant_answer: false,
  raw_content_included: false,
}) as HelixEnvironmentActionAdapterProfile;

const records: HelixEnvironmentActionAdapterRegistryRecord[] = [
  minecraftFabricPlayerProfile,
].map((profile) => ({
  profile,
  contract_hash: environmentActionAdapterContractHash(profile),
}));

export const listEnvironmentActionAdapterProfiles = ():
HelixEnvironmentActionAdapterRegistryRecord[] =>
  records.map((record) => structuredClone(record));

export const resolveEnvironmentActionAdapterProfile = (input: {
  domainAdapter: string;
  worldId: string;
  sourceAdapterProfileId: string;
}): HelixEnvironmentActionAdapterRegistryRecord => {
  const record = records.find(({ profile }) =>
    profile.accepted_domain_adapters.includes(input.domainAdapter.trim()),
  );
  if (!record) {
    throw new EnvironmentActionAdapterRegistryError(
      "environment_action_adapter_unknown",
      "The player-action adapter is not registered.",
    );
  }
  if (record.profile.lifecycle.status !== "enabled") {
    throw new EnvironmentActionAdapterRegistryError(
      "environment_action_adapter_disabled",
      "The player-action adapter is not enabled.",
    );
  }
  if (
    !record.profile.world_id_prefixes.some((prefix) =>
      input.worldId.startsWith(prefix)) ||
    !record.profile.compatible_source_profile_ids.includes(
      input.sourceAdapterProfileId,
    )
  ) {
    throw new EnvironmentActionAdapterRegistryError(
      "environment_action_adapter_identity_mismatch",
      "The player-action adapter is incompatible with this environment binding.",
    );
  }
  return structuredClone(record);
};
