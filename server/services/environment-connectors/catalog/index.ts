import crypto from "node:crypto";
import {
  HELIX_ENVIRONMENT_CAPABILITY_DESCRIPTOR_SCHEMA,
  HELIX_MINECRAFT_ACTOR_STATUS_READ_CAPABILITY,
  HELIX_MINECRAFT_CROP_STATE_READ_CAPABILITY,
  HELIX_MINECRAFT_HAZARDS_SCAN_CAPABILITY,
  HELIX_MINECRAFT_INVENTORY_CHECK_CAPABILITY,
  HELIX_MINECRAFT_LINE_OF_SIGHT_CHECK_CAPABILITY,
  HELIX_MINECRAFT_LOCAL_MAP_INSPECT_CAPABILITY,
  HELIX_MINECRAFT_NEARBY_ENTITIES_LIST_CAPABILITY,
  HELIX_MINECRAFT_REACHABILITY_CHECK_CAPABILITY,
  HELIX_MINECRAFT_SITUATION_CAPABILITY_IDS,
  HELIX_SYNTHETIC_REACHABILITY_CAPABILITY,
  HELIX_SYSTEM_CLOCK_READ_CAPABILITY,
  helixEnvironmentCapabilityDescriptorSchema,
  type HelixEnvironmentCapabilityDescriptor,
  type HelixEnvironmentConstrainedJsonSchema,
} from "@shared/helix-environment-connector";
import {
  HELIX_MINECRAFT_ADAPTER_PROFILE_ID,
  HELIX_SYNTHETIC_GAME_ADAPTER_PROFILE_ID,
  HELIX_SYSTEM_CLOCK_ADAPTER_PROFILE_ID,
} from "@shared/helix-environment-adapter-profile";
import type { HelixEnvironmentProbeType } from "@shared/helix-environment-probe";

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, canonicalize(item)]),
  );
};

export const environmentConnectorSha256 = (
  value: unknown,
): `sha256:${string}` =>
  `sha256:${crypto
    .createHash("sha256")
    .update(JSON.stringify(canonicalize(value)), "utf8")
    .digest("hex")}`;

const descriptor = (input: {
  capabilityId: string;
  domain: string;
  adapterProfileIds: string[];
  label: string;
  description: string;
  inputSchema: HelixEnvironmentConstrainedJsonSchema;
  outputSchema: HelixEnvironmentConstrainedJsonSchema;
  freshnessCeilingMs: number;
  timeoutCeilingMs: number;
}): HelixEnvironmentCapabilityDescriptor =>
  helixEnvironmentCapabilityDescriptorSchema.parse({
    schema: HELIX_ENVIRONMENT_CAPABILITY_DESCRIPTOR_SCHEMA,
    capability_id: input.capabilityId,
    capability_version: 1,
    capability_class: "probe",
    domain: input.domain,
    adapter_profile_ids: input.adapterProfileIds,
    trusted_model_label: input.label,
    trusted_model_description: input.description,
    input_schema: input.inputSchema,
    input_schema_hash: environmentConnectorSha256(input.inputSchema),
    output_schema: input.outputSchema,
    output_schema_hash: environmentConnectorSha256(input.outputSchema),
    freshness_ceiling_ms: input.freshnessCeilingMs,
    timeout_ceiling_ms: input.timeoutCeilingMs,
    read_only: true,
    side_effects_allowed: false,
    requires_current_turn_reentry: true,
    publisher_metadata_lane: "ui_only_untrusted",
    assistant_answer: false,
    raw_content_included: false,
  });

const semanticTargetSchema: HelixEnvironmentConstrainedJsonSchema = {
  type: "object",
  properties: {
    target: {
      type: "string",
      enum: ["current_actor"],
      description: "The authenticated actor already bound to the environment.",
    },
    freshness_requirement_ms: {
      type: "integer",
      minimum: 1_000,
      maximum: 120_000,
      description: "Maximum acceptable observation age.",
    },
  },
  required: ["target"],
  additionalProperties: false,
};

const minecraftPositionSchema: HelixEnvironmentConstrainedJsonSchema = {
  type: "object",
  properties: {
    x: { type: "number", minimum: -30_000_000, maximum: 30_000_000 },
    y: { type: "number", minimum: -2_048, maximum: 2_048 },
    z: { type: "number", minimum: -30_000_000, maximum: 30_000_000 },
  },
  required: ["x", "y", "z"],
  additionalProperties: false,
};

const minecraftPositionTargetSchema: HelixEnvironmentConstrainedJsonSchema = {
  type: "object",
  properties: {
    target: {
      type: "string",
      enum: ["position"],
      description:
        "A position in the current bound actor's exact Minecraft world.",
    },
    position: minecraftPositionSchema,
    freshness_requirement_ms: {
      type: "integer",
      minimum: 1_000,
      maximum: 120_000,
      description: "Maximum acceptable observation age.",
    },
  },
  required: ["target", "position"],
  additionalProperties: false,
};

const minecraftCropTargetSchema: HelixEnvironmentConstrainedJsonSchema = {
  type: "object",
  properties: {
    target: {
      type: "string",
      enum: ["current_focus", "position"],
      description:
        "Inspect either the crop under the actor's current focus or an exact position in the bound world.",
    },
    position: minecraftPositionSchema,
    freshness_requirement_ms: {
      type: "integer",
      minimum: 1_000,
      maximum: 120_000,
      description: "Maximum acceptable observation age.",
    },
  },
  required: ["target"],
  additionalProperties: false,
};

const minecraftCrimsonCurseStateSchema: HelixEnvironmentConstrainedJsonSchema =
  {
    type: "object",
    properties: {
      mod_id: { type: "string", enum: ["mr_crimson_curse"] },
      mod_version: { type: "string", maxLength: 40 },
      state_source: {
        type: "string",
        enum: ["allowlisted_scoreboard_observation"],
      },
      raw_command_output_included: { type: "boolean" },
      raw_nbt_included: { type: "boolean" },
      status: { type: "string", enum: ["not_initialized", "observed"] },
      global_mass: {
        type: "integer",
        minimum: -2_147_483_648,
        maximum: 2_147_483_647,
      },
      global_points: {
        type: "integer",
        minimum: -2_147_483_648,
        maximum: 2_147_483_647,
      },
      infection_phase: { type: "integer", minimum: -1, maximum: 5 },
    },
    required: [
      "mod_id",
      "state_source",
      "raw_command_output_included",
      "raw_nbt_included",
      "status",
    ],
    additionalProperties: false,
  };

const minecraftActorStatusOutputSchema: HelixEnvironmentConstrainedJsonSchema =
  {
    type: "object",
    properties: {
      result_summary: { type: "string", maxLength: 2_000 },
      health: { type: "number", minimum: 0, maximum: 2_048 },
      max_health: { type: "number", minimum: 0, maximum: 2_048 },
      food_level: { type: "integer", minimum: 0, maximum: 20 },
      saturation: { type: "number", minimum: 0, maximum: 20 },
      game_mode: { type: "string", maxLength: 64 },
      world: { type: "string", maxLength: 160 },
      position: minecraftPositionSchema,
      status_flags: {
        type: "array",
        maxItems: 32,
        items: { type: "string", maxLength: 80 },
      },
      active_effects: {
        type: "array",
        maxItems: 32,
        items: {
          type: "object",
          properties: {
            effect: { type: "string", maxLength: 160 },
            amplifier: { type: "integer", minimum: 0, maximum: 255 },
            duration_ticks: {
              type: "integer",
              minimum: 0,
              maximum: 2_147_483_647,
            },
          },
          required: ["effect", "amplifier", "duration_ticks"],
          additionalProperties: false,
        },
      },
      mechanics_state: minecraftCrimsonCurseStateSchema,
    },
    required: ["result_summary"],
    additionalProperties: false,
  };

const minecraftInventoryOutputSchema: HelixEnvironmentConstrainedJsonSchema = {
  type: "object",
  properties: {
    result_summary: { type: "string", maxLength: 2_000 },
    item_count: { type: "integer", minimum: 0, maximum: 100_000 },
    slots: {
      type: "array",
      maxItems: 256,
      items: {
        type: "object",
        properties: {
          slot: { type: "integer", minimum: 0, maximum: 512 },
          item: { type: "string", maxLength: 160 },
          count: { type: "integer", minimum: 0, maximum: 100_000 },
        },
        required: ["slot", "item", "count"],
        additionalProperties: false,
      },
    },
  },
  required: ["result_summary"],
  additionalProperties: false,
};

const minecraftNearbyEntitiesOutputSchema: HelixEnvironmentConstrainedJsonSchema =
  {
    type: "object",
    properties: {
      result_summary: { type: "string", maxLength: 2_000 },
      entity_count: { type: "integer", minimum: 0, maximum: 512 },
      entities: {
        type: "array",
        maxItems: 128,
        items: {
          type: "object",
          properties: {
            entity_type: { type: "string", maxLength: 160 },
            classification: {
              type: "string",
              enum: ["hostile", "player", "passive", "projectile", "other"],
            },
            distance_blocks: {
              type: "number",
              minimum: 0,
              maximum: 1_024,
            },
            targeting_actor: { type: "boolean" },
          },
          required: [
            "entity_type",
            "classification",
            "distance_blocks",
            "targeting_actor",
          ],
          additionalProperties: false,
        },
      },
    },
    required: ["result_summary"],
    additionalProperties: false,
  };

const minecraftHazardsOutputSchema: HelixEnvironmentConstrainedJsonSchema = {
  type: "object",
  properties: {
    result_summary: { type: "string", maxLength: 2_000 },
    hazard_present: { type: "boolean" },
    hostile_entity_count: { type: "integer", minimum: 0, maximum: 512 },
    nearest_hostile_distance_blocks: {
      type: "number",
      minimum: 0,
      maximum: 1_024,
    },
    environmental_hazard_block_count: {
      type: "integer",
      minimum: 0,
      maximum: 65_536,
    },
    nearest_environmental_hazard_distance_blocks: {
      type: "number",
      minimum: 0,
      maximum: 1_024,
    },
    environmental_hazard_types: {
      type: "array",
      maxItems: 32,
      items: { type: "string", maxLength: 80 },
    },
    actor_on_fire: { type: "boolean" },
    actor_freezing: { type: "boolean" },
  },
  required: ["result_summary"],
  additionalProperties: false,
};

const minecraftLocalMapOutputSchema: HelixEnvironmentConstrainedJsonSchema = {
  type: "object",
  properties: {
    result_summary: { type: "string", maxLength: 2_000 },
    sampled_floor_blocks: { type: "integer", minimum: 0, maximum: 65_536 },
    solid_floor_blocks: { type: "integer", minimum: 0, maximum: 65_536 },
    open_floor_blocks: { type: "integer", minimum: 0, maximum: 65_536 },
    hazardous_floor_blocks: {
      type: "integer",
      minimum: 0,
      maximum: 65_536,
    },
    liquid_floor_blocks: {
      type: "integer",
      minimum: 0,
      maximum: 65_536,
    },
  },
  required: ["result_summary"],
  additionalProperties: false,
};

const minecraftLineOfSightOutputSchema: HelixEnvironmentConstrainedJsonSchema =
  {
    type: "object",
    properties: {
      result_summary: { type: "string", maxLength: 2_000 },
      line_of_sight: { type: "boolean" },
      distance_blocks: { type: "number", minimum: 0, maximum: 1_024 },
    },
    required: ["result_summary"],
    additionalProperties: false,
  };

const minecraftCropStateOutputSchema: HelixEnvironmentConstrainedJsonSchema = {
  type: "object",
  properties: {
    result_summary: { type: "string", maxLength: 2_000 },
    crop_mature: { type: "boolean" },
    crop_type: { type: "string", maxLength: 160 },
  },
  required: ["result_summary"],
  additionalProperties: false,
};

const minecraftReachabilityOutputSchema: HelixEnvironmentConstrainedJsonSchema =
  {
    type: "object",
    properties: {
      result_summary: { type: "string", maxLength: 2_000 },
      within_probe_radius: { type: "boolean" },
      within_interaction_range: { type: "boolean" },
      distance_blocks: { type: "number", minimum: 0, maximum: 1_000_000 },
    },
    required: ["result_summary"],
    additionalProperties: false,
  };

const syntheticReachabilityOutputSchema: HelixEnvironmentConstrainedJsonSchema =
  {
    type: "object",
    properties: {
      result_summary: { type: "string", maxLength: 2_000 },
      reachable: { type: "boolean" },
      distance: { type: "number", minimum: 0, maximum: 1_000_000 },
    },
    required: ["result_summary", "reachable"],
    additionalProperties: false,
  };

const systemClockInputSchema: HelixEnvironmentConstrainedJsonSchema = {
  type: "object",
  properties: {
    clock: {
      type: "string",
      enum: ["monotonic"],
      description: "Read the connector host's monotonic process clock.",
    },
  },
  required: ["clock"],
  additionalProperties: false,
};

const systemClockOutputSchema: HelixEnvironmentConstrainedJsonSchema = {
  type: "object",
  properties: {
    result_summary: { type: "string", maxLength: 2_000 },
    uptime_ms: { type: "integer", minimum: 0 },
  },
  required: ["result_summary", "uptime_ms"],
  additionalProperties: false,
};

const descriptors: HelixEnvironmentCapabilityDescriptor[] = [
  descriptor({
    capabilityId: HELIX_MINECRAFT_ACTOR_STATUS_READ_CAPABILITY,
    domain: "minecraft",
    adapterProfileIds: [HELIX_MINECRAFT_ADAPTER_PROFILE_ID],
    label: "Read current Minecraft actor status",
    description:
      "Read health, hunger, active effects, game mode, status flags, world, position, and an admitted allowlisted mod-mechanics state for the current bound Minecraft actor without changing the world.",
    inputSchema: semanticTargetSchema,
    outputSchema: minecraftActorStatusOutputSchema,
    freshnessCeilingMs: 120_000,
    timeoutCeilingMs: 30_000,
  }),
  descriptor({
    capabilityId: HELIX_MINECRAFT_INVENTORY_CHECK_CAPABILITY,
    domain: "minecraft",
    adapterProfileIds: [HELIX_MINECRAFT_ADAPTER_PROFILE_ID],
    label: "Check current Minecraft inventory",
    description:
      "Read the current bound Minecraft actor's inventory without executing commands or changing the world.",
    inputSchema: semanticTargetSchema,
    outputSchema: minecraftInventoryOutputSchema,
    freshnessCeilingMs: 120_000,
    timeoutCeilingMs: 30_000,
  }),
  descriptor({
    capabilityId: HELIX_MINECRAFT_NEARBY_ENTITIES_LIST_CAPABILITY,
    domain: "minecraft",
    adapterProfileIds: [HELIX_MINECRAFT_ADAPTER_PROFILE_ID],
    label: "List nearby Minecraft entities",
    description:
      "List a bounded set of nearby entities, classifications, distances, and whether a hostile mob is targeting the current bound actor.",
    inputSchema: semanticTargetSchema,
    outputSchema: minecraftNearbyEntitiesOutputSchema,
    freshnessCeilingMs: 120_000,
    timeoutCeilingMs: 30_000,
  }),
  descriptor({
    capabilityId: HELIX_MINECRAFT_HAZARDS_SCAN_CAPABILITY,
    domain: "minecraft",
    adapterProfileIds: [HELIX_MINECRAFT_ADAPTER_PROFILE_ID],
    label: "Scan immediate Minecraft hazards",
    description:
      "Count nearby hostile entities and bounded nearby hazardous blocks, including lava, fire, magma, campfires, cactus, powder snow, berry bushes, wither roses, and pointed dripstone, around the current bound actor.",
    inputSchema: semanticTargetSchema,
    outputSchema: minecraftHazardsOutputSchema,
    freshnessCeilingMs: 30_000,
    timeoutCeilingMs: 30_000,
  }),
  descriptor({
    capabilityId: HELIX_MINECRAFT_LOCAL_MAP_INSPECT_CAPABILITY,
    domain: "minecraft",
    adapterProfileIds: [HELIX_MINECRAFT_ADAPTER_PROFILE_ID],
    label: "Inspect the local Minecraft floor sample",
    description:
      "Inspect a bounded 9 by 9 floor sample around the current actor, including solid, open, liquid, and hazardous floor counts. This is local terrain evidence, not a route planner or complete map.",
    inputSchema: semanticTargetSchema,
    outputSchema: minecraftLocalMapOutputSchema,
    freshnessCeilingMs: 120_000,
    timeoutCeilingMs: 30_000,
  }),
  descriptor({
    capabilityId: HELIX_MINECRAFT_LINE_OF_SIGHT_CHECK_CAPABILITY,
    domain: "minecraft",
    adapterProfileIds: [HELIX_MINECRAFT_ADAPTER_PROFILE_ID],
    label: "Check Minecraft line of sight",
    description:
      "Ray-trace from the current actor's eyes to a position in the same bound world without changing the world.",
    inputSchema: minecraftPositionTargetSchema,
    outputSchema: minecraftLineOfSightOutputSchema,
    freshnessCeilingMs: 30_000,
    timeoutCeilingMs: 30_000,
  }),
  descriptor({
    capabilityId: HELIX_MINECRAFT_CROP_STATE_READ_CAPABILITY,
    domain: "minecraft",
    adapterProfileIds: [HELIX_MINECRAFT_ADAPTER_PROFILE_ID],
    label: "Read Minecraft crop maturity",
    description:
      "Read whether the crop at the actor's current focus or an exact position is mature, without harvesting or opening anything.",
    inputSchema: minecraftCropTargetSchema,
    outputSchema: minecraftCropStateOutputSchema,
    freshnessCeilingMs: 120_000,
    timeoutCeilingMs: 30_000,
  }),
  descriptor({
    capabilityId: HELIX_MINECRAFT_REACHABILITY_CHECK_CAPABILITY,
    domain: "minecraft",
    adapterProfileIds: [HELIX_MINECRAFT_ADAPTER_PROFILE_ID],
    label: "Check Minecraft geometric reachability",
    description:
      "Measure straight-line distance from the current actor to a position and report probe-radius and interaction-range thresholds. This does not prove a navigable path.",
    inputSchema: minecraftPositionTargetSchema,
    outputSchema: minecraftReachabilityOutputSchema,
    freshnessCeilingMs: 30_000,
    timeoutCeilingMs: 30_000,
  }),
  descriptor({
    capabilityId: HELIX_SYNTHETIC_REACHABILITY_CAPABILITY,
    domain: "synthetic",
    adapterProfileIds: [HELIX_SYNTHETIC_GAME_ADAPTER_PROFILE_ID],
    label: "Check synthetic reachability",
    description:
      "Read a deterministic synthetic environment fixture to test cross-adapter and cross-room isolation.",
    inputSchema: semanticTargetSchema,
    outputSchema: syntheticReachabilityOutputSchema,
    freshnessCeilingMs: 60_000,
    timeoutCeilingMs: 10_000,
  }),
  descriptor({
    capabilityId: HELIX_SYSTEM_CLOCK_READ_CAPABILITY,
    domain: "system",
    adapterProfileIds: [HELIX_SYSTEM_CLOCK_ADAPTER_PROFILE_ID],
    label: "Read connector process uptime",
    description:
      "Read a deterministic monotonic uptime value from a paired non-game connector.",
    inputSchema: systemClockInputSchema,
    outputSchema: systemClockOutputSchema,
    freshnessCeilingMs: 10_000,
    timeoutCeilingMs: 5_000,
  }),
];

const descriptorById = new Map(
  descriptors.map((entry) => [entry.capability_id, entry] as const),
);

export type BuiltinEnvironmentConnectorPackage = {
  packageVersionId: string;
  packageId: string;
  packageVersion: string;
  publisherId: "publisher:casimirbot";
  adapterProfileId: string;
  hostCompatibility: string[];
  capabilityDescriptors: HelixEnvironmentCapabilityDescriptor[];
};

const builtinPackages: BuiltinEnvironmentConnectorPackage[] = [
  {
    packageVersionId:
      "connector_package_version:com.casimirbot.minecraft.paper:1.1.0",
    packageId: "com.casimirbot.minecraft.paper",
    packageVersion: "1.1.0",
    publisherId: "publisher:casimirbot",
    adapterProfileId: HELIX_MINECRAFT_ADAPTER_PROFILE_ID,
    hostCompatibility: ["paper:1.21.x", "java:21"],
    capabilityDescriptors: descriptors.filter((entry) =>
      (HELIX_MINECRAFT_SITUATION_CAPABILITY_IDS as readonly string[]).includes(
        entry.capability_id,
      ),
    ),
  },
  {
    packageVersionId:
      "connector_package_version:com.casimirbot.minecraft.fabric:0.1.0",
    packageId: "com.casimirbot.minecraft.fabric",
    packageVersion: "0.1.0",
    publisherId: "publisher:casimirbot",
    adapterProfileId: HELIX_MINECRAFT_ADAPTER_PROFILE_ID,
    hostCompatibility: [
      "fabric:1.21.8",
      "fabric-loader:0.18.4+",
      "fabric-api:0.136.1+1.21.8",
      "java:21",
    ],
    capabilityDescriptors: descriptors.filter((entry) =>
      (HELIX_MINECRAFT_SITUATION_CAPABILITY_IDS as readonly string[]).includes(
        entry.capability_id,
      ),
    ),
  },
  {
    packageVersionId:
      "connector_package_version:com.casimirbot.synthetic.fixture:1.0.0",
    packageId: "com.casimirbot.synthetic.fixture",
    packageVersion: "1.0.0",
    publisherId: "publisher:casimirbot",
    adapterProfileId: HELIX_SYNTHETIC_GAME_ADAPTER_PROFILE_ID,
    hostCompatibility: ["node:20+"],
    capabilityDescriptors: descriptors.filter(
      (entry) =>
        entry.capability_id === HELIX_SYNTHETIC_REACHABILITY_CAPABILITY,
    ),
  },
  {
    packageVersionId:
      "connector_package_version:com.casimirbot.system.clock:1.0.0",
    packageId: "com.casimirbot.system.clock",
    packageVersion: "1.0.0",
    publisherId: "publisher:casimirbot",
    adapterProfileId: HELIX_SYSTEM_CLOCK_ADAPTER_PROFILE_ID,
    hostCompatibility: ["node:20+", "windows", "linux", "macos"],
    capabilityDescriptors: descriptors.filter(
      (entry) => entry.capability_id === HELIX_SYSTEM_CLOCK_READ_CAPABILITY,
    ),
  },
];

export const listBuiltinEnvironmentConnectorPackages =
  (): BuiltinEnvironmentConnectorPackage[] => structuredClone(builtinPackages);

export const readBuiltinEnvironmentConnectorPackage = (
  packageVersionId: string,
): BuiltinEnvironmentConnectorPackage | null => {
  const value =
    builtinPackages.find(
      (entry) => entry.packageVersionId === packageVersionId.trim(),
    ) ?? null;
  return value ? structuredClone(value) : null;
};

export const listEnvironmentConnectorCapabilityDescriptors = (input?: {
  adapterProfileId?: string | null;
}): HelixEnvironmentCapabilityDescriptor[] =>
  descriptors
    .filter(
      (entry) =>
        !input?.adapterProfileId ||
        entry.adapter_profile_ids.includes(input.adapterProfileId),
    )
    .map((entry) => structuredClone(entry));

export const readEnvironmentConnectorCapabilityDescriptor = (
  capabilityId: string,
): HelixEnvironmentCapabilityDescriptor | null => {
  const value = descriptorById.get(capabilityId.trim()) ?? null;
  return value ? structuredClone(value) : null;
};

export const legacyProbeTypeForEnvironmentCapability = (
  capabilityId: string,
): HelixEnvironmentProbeType | null => {
  switch (capabilityId.trim()) {
    case HELIX_MINECRAFT_ACTOR_STATUS_READ_CAPABILITY:
      return "actor_status";
    case HELIX_MINECRAFT_INVENTORY_CHECK_CAPABILITY:
      return "inventory_check";
    case HELIX_MINECRAFT_NEARBY_ENTITIES_LIST_CAPABILITY:
      return "nearby_entities";
    case HELIX_MINECRAFT_HAZARDS_SCAN_CAPABILITY:
      return "hazard_check";
    case HELIX_MINECRAFT_LOCAL_MAP_INSPECT_CAPABILITY:
      return "local_map_summary";
    case HELIX_MINECRAFT_LINE_OF_SIGHT_CHECK_CAPABILITY:
      return "line_of_sight";
    case HELIX_MINECRAFT_CROP_STATE_READ_CAPABILITY:
      return "crop_state";
    case HELIX_MINECRAFT_REACHABILITY_CHECK_CAPABILITY:
    case HELIX_SYNTHETIC_REACHABILITY_CAPABILITY:
      return "reachability";
    default:
      return null;
  }
};
