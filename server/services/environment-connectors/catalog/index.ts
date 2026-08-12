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
  HELIX_MINECRAFT_SPATIAL_REGION_INSPECT_CAPABILITY,
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
import { HELIX_MINECRAFT_FABRIC_PLAYER_ACTION_PROFILE_ID } from "@shared/helix-environment-action-adapter-profile";
import {
  HELIX_MINECRAFT_PLAYER_COLLECT_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_CRAFT_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_EQUIP_CAPABILITY,
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
  capabilityVersion?: number;
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
    capability_version: input.capabilityVersion ?? 1,
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

const actionDescriptor = (input: {
  capabilityId: string;
  label: string;
  description: string;
  inputSchema: HelixEnvironmentConstrainedJsonSchema;
  timeoutCeilingMs: number;
}): HelixEnvironmentCapabilityDescriptor =>
  helixEnvironmentCapabilityDescriptorSchema.parse({
    schema: HELIX_ENVIRONMENT_CAPABILITY_DESCRIPTOR_SCHEMA,
    capability_id: input.capabilityId,
    capability_version: 1,
    capability_class: "act",
    domain: "minecraft",
    adapter_profile_ids: [HELIX_MINECRAFT_FABRIC_PLAYER_ACTION_PROFILE_ID],
    trusted_model_label: input.label,
    trusted_model_description: input.description,
    input_schema: input.inputSchema,
    input_schema_hash: environmentConnectorSha256(input.inputSchema),
    output_schema: minecraftPlayerActionOutputSchema,
    output_schema_hash: environmentConnectorSha256(minecraftPlayerActionOutputSchema),
    freshness_ceiling_ms: 30_000,
    timeout_ceiling_ms: input.timeoutCeilingMs,
    read_only: false,
    side_effects_allowed: true,
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

const minecraftBlockPositionSchema: HelixEnvironmentConstrainedJsonSchema = {
  type: "object",
  properties: {
    x: { type: "integer", minimum: -30_000_000, maximum: 30_000_000 },
    y: { type: "integer", minimum: -2_048, maximum: 2_048 },
    z: { type: "integer", minimum: -30_000_000, maximum: 30_000_000 },
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
      actor_label: { type: "string", maxLength: 160 },
      game_mode: { type: "string", maxLength: 64 },
      world: { type: "string", maxLength: 160 },
      position: minecraftPositionSchema,
      yaw: {
        type: "number",
        description:
          "Measured Minecraft view yaw in degrees; increasing values turn right.",
      },
      pitch: {
        type: "number",
        minimum: -90,
        maximum: 90,
        description:
          "Measured Minecraft view pitch in degrees; increasing values look down.",
      },
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

const minecraftSpatialRegionInputSchema: HelixEnvironmentConstrainedJsonSchema = {
  type: "object",
  properties: {
    target: {
      type: "string",
      enum: ["current_actor"],
      description: "Survey a bounded region centered on the selected Minecraft actor.",
    },
    horizontal_radius: {
      type: "integer",
      minimum: 1,
      maximum: 7,
      description: "Horizontal survey radius in blocks; defaults to 7.",
    },
    vertical_radius: {
      type: "integer",
      minimum: 1,
      maximum: 8,
      description: "Vertical survey radius in blocks; defaults to 6.",
    },
    purpose: {
      type: "string",
      enum: [
        "general",
        "structure_planning",
        "build_planning",
        "structure_verification",
        "fire_safety",
        "landing_safety",
        "movement_safety",
      ],
      description:
        "The bounded survey purpose. Use structure_verification only with exact verification endpoints and an expected block.",
    },
    requested_length: {
      type: "integer",
      minimum: 3,
      maximum: 15,
      description:
        "Exact requested build-line length. When present, returned build-line candidates must have this length.",
    },
    requested_height: {
      type: "integer",
      minimum: 3,
      maximum: 8,
      description:
        "Exact requested clear build height. Returned build-line candidates must verify at least this many strict-air cells vertically.",
    },
    orientation: {
      type: "string",
      enum: ["north_south", "east_west"],
      description: "Requested build-line orientation.",
    },
    relative_side: {
      type: "string",
      enum: ["north", "south", "east", "west"],
      description: "Requested side of the selected actor.",
    },
    verification_from: {
      ...minecraftPositionSchema,
      description:
        "First inclusive corner of an exact post-action block footprint to verify.",
    },
    verification_to: {
      ...minecraftPositionSchema,
      description:
        "Opposite inclusive corner of an exact post-action block footprint to verify.",
    },
    expected_block: {
      type: "string",
      minLength: 1,
      maxLength: 160,
      description:
        "Canonical block identifier expected in every cell of the exact verification footprint.",
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

const minecraftSpatialRegionOutputSchema: HelixEnvironmentConstrainedJsonSchema = {
  type: "object",
  properties: {
    result_summary: { type: "string", maxLength: 2_000 },
    purpose: {
      type: "string",
      enum: [
        "general",
        "structure_planning",
        "build_planning",
        "structure_verification",
        "fire_safety",
        "landing_safety",
        "movement_safety",
      ],
    },
    center: minecraftPositionSchema,
    horizontal_radius: { type: "integer", minimum: 1, maximum: 7 },
    vertical_radius: { type: "integer", minimum: 1, maximum: 8 },
    requested_length: { type: "integer", minimum: 3, maximum: 15 },
    requested_height: { type: "integer", minimum: 3, maximum: 8 },
    requested_orientation: {
      type: "string",
      enum: ["north_south", "east_west"],
    },
    requested_relative_side: {
      type: "string",
      enum: ["north", "south", "east", "west"],
    },
    sample_count: { type: "integer", minimum: 1, maximum: 10_000 },
    bounds: {
      type: "object",
      properties: {
        min: minecraftPositionSchema,
        max: minecraftPositionSchema,
      },
      required: ["min", "max"],
      additionalProperties: false,
    },
    palette: {
      type: "array",
      maxItems: 128,
      items: {
        type: "object",
        properties: {
          block: { type: "string", maxLength: 160 },
          count: { type: "integer", minimum: 1, maximum: 10_000 },
        },
        required: ["block", "count"],
        additionalProperties: false,
      },
    },
    palette_complete: { type: "boolean" },
    omitted_palette_block_types: {
      type: "integer",
      minimum: 0,
      maximum: 10_000,
    },
    column_encoding: {
      type: "string",
      enum: [
        "expanded_relative_xz_relative_y_palette_flags_v1",
        "absolute_xyz_verbose_v1",
      ],
    },
    columns: {
      type: "array",
      maxItems: 225,
      items: {
        type: "object",
        properties: {
          x: { type: "integer", minimum: -30_000_000, maximum: 30_000_000 },
          z: { type: "integer", minimum: -30_000_000, maximum: 30_000_000 },
          runs: {
            type: "array",
            maxItems: 17,
            items: {
              type: "object",
              properties: {
                y_start: { type: "integer", minimum: -2_048, maximum: 2_048 },
                y_end: { type: "integer", minimum: -2_048, maximum: 2_048 },
                block: { type: "string", maxLength: 160 },
                flags: {
                  type: "array",
                  maxItems: 7,
                  items: {
                    type: "string",
                    enum: [
                      "air",
                      "fluid",
                      "solid",
                      "flammable",
                      "replaceable",
                      "hazard",
                      "block_entity",
                    ],
                  },
                },
              },
              required: ["y_start", "y_end", "block", "flags"],
              additionalProperties: false,
            },
          },
        },
        required: ["x", "z", "runs"],
        additionalProperties: false,
      },
    },
    columns_complete: { type: "boolean" },
    retained_column_count: { type: "integer", minimum: 0, maximum: 225 },
    omitted_column_count: { type: "integer", minimum: 0, maximum: 225 },
    omitted_run_count: { type: "integer", minimum: 0, maximum: 10_000 },
    wire_details_json_bytes: {
      type: "integer",
      minimum: 0,
      maximum: 34_000,
    },
    anchors: {
      type: "array",
      maxItems: 64,
      items: {
        type: "object",
        properties: {
          kind: {
            type: "string",
            enum: ["door", "bed", "container", "workstation", "portal", "hearth_base"],
          },
          block: { type: "string", maxLength: 160 },
          position: minecraftPositionSchema,
        },
        required: ["kind", "block", "position"],
        additionalProperties: false,
      },
    },
    anchors_complete: { type: "boolean" },
    retained_anchor_count: { type: "integer", minimum: 0, maximum: 10_000 },
    omitted_anchor_count: { type: "integer", minimum: 0, maximum: 10_000 },
    fireplace_candidates: {
      type: "array",
      maxItems: 16,
      items: {
        type: "object",
        properties: {
          base_position: minecraftPositionSchema,
          fire_position: minecraftPositionSchema,
          base_block: { type: "string", maxLength: 160 },
          flammable_within_two: { type: "integer", minimum: 0, maximum: 125 },
          solid_nonflammable_enclosure: { type: "integer", minimum: 0, maximum: 5 },
          replaceable_fire_cell: { type: "boolean" },
          safe_candidate: { type: "boolean" },
        },
        required: [
          "base_position",
          "fire_position",
          "base_block",
          "flammable_within_two",
          "solid_nonflammable_enclosure",
          "replaceable_fire_cell",
          "safe_candidate",
        ],
        additionalProperties: false,
      },
    },
    fireplace_candidates_complete: { type: "boolean" },
    retained_fireplace_candidate_count: {
      type: "integer",
      minimum: 0,
      maximum: 10_000,
    },
    omitted_fireplace_candidate_count: {
      type: "integer",
      minimum: 0,
      maximum: 10_000,
    },
    build_line_candidates: {
      type: "array",
      maxItems: 16,
      items: {
        type: "object",
        properties: {
          orientation: {
            type: "string",
            enum: ["north_south", "east_west"],
          },
          relative_side: {
            type: "string",
            enum: ["north", "south", "east", "west", "overlap"],
          },
          from: minecraftPositionSchema,
          to: minecraftPositionSchema,
          length: { type: "integer", minimum: 3, maximum: 15 },
          minimum_clear_height: {
            type: "integer",
            minimum: 3,
            maximum: 17,
          },
          minimum_actor_distance: {
            type: "integer",
            minimum: 2,
            maximum: 30,
          },
          nearest_anchor_distance: {
            type: "integer",
            minimum: 2,
            maximum: 1_000_000,
          },
          ground_blocks: {
            type: "array",
            maxItems: 16,
            items: { type: "string", maxLength: 160 },
          },
          target_cells_replaceable: { type: "boolean" },
          target_cells_air: { type: "boolean" },
          ground_solid_nonhazardous: { type: "boolean" },
          fluid_cells: { type: "integer", minimum: 0, maximum: 10_000 },
          flammable_cells: {
            type: "integer",
            minimum: 0,
            maximum: 10_000,
          },
          block_entity_cells: {
            type: "integer",
            minimum: 0,
            maximum: 10_000,
          },
          safe_candidate: { type: "boolean" },
        },
        required: [
          "orientation",
          "relative_side",
          "from",
          "to",
          "length",
          "minimum_clear_height",
          "minimum_actor_distance",
          "nearest_anchor_distance",
          "ground_blocks",
          "target_cells_replaceable",
          "target_cells_air",
          "ground_solid_nonhazardous",
          "fluid_cells",
          "flammable_cells",
          "block_entity_cells",
          "safe_candidate",
        ],
        additionalProperties: false,
      },
    },
    build_line_candidates_complete: { type: "boolean" },
    retained_build_line_candidate_count: {
      type: "integer",
      minimum: 0,
      maximum: 16,
    },
    omitted_build_line_candidate_count: {
      type: "integer",
      minimum: 0,
      maximum: 10_000,
    },
    walk_step_candidates: {
      type: "array",
      maxItems: 4,
      items: {
        type: "object",
        properties: {
          cardinal_direction: {
            type: "string",
            enum: ["north", "south", "east", "west"],
          },
          relative_direction: {
            type: "string",
            enum: ["forward", "back", "left", "right"],
          },
          target_feet_position: minecraftPositionSchema,
          target_head_position: minecraftPositionSchema,
          support_position: minecraftPositionSchema,
          support_block: { type: "string", minLength: 1, maxLength: 160 },
          evidence_complete: { type: "boolean" },
          feet_clear: { type: "boolean" },
          head_clear: { type: "boolean" },
          support_solid_nonhazardous: { type: "boolean" },
          nearby_hazard_count: {
            type: "integer",
            minimum: 0,
            maximum: 10_000,
          },
          nearby_fluid_count: {
            type: "integer",
            minimum: 0,
            maximum: 10_000,
          },
          safe_candidate: { type: "boolean" },
        },
        required: [
          "cardinal_direction",
          "relative_direction",
          "target_feet_position",
          "target_head_position",
          "support_position",
          "support_block",
          "evidence_complete",
          "feet_clear",
          "head_clear",
          "support_solid_nonhazardous",
          "nearby_hazard_count",
          "nearby_fluid_count",
          "safe_candidate",
        ],
        additionalProperties: false,
      },
    },
    walk_step_candidates_complete: { type: "boolean" },
    retained_walk_step_candidate_count: {
      type: "integer",
      minimum: 0,
      maximum: 4,
    },
    omitted_walk_step_candidate_count: {
      type: "integer",
      minimum: 0,
      maximum: 4,
    },
    target_geometry_verification: {
      type: "object",
      properties: {
        from: minecraftPositionSchema,
        to: minecraftPositionSchema,
        expected_block: { type: "string", minLength: 1, maxLength: 160 },
        total_cells: { type: "integer", minimum: 1, maximum: 4_096 },
        sampled_cells: { type: "integer", minimum: 0, maximum: 4_096 },
        matching_cells: { type: "integer", minimum: 0, maximum: 4_096 },
        mismatched_cells: { type: "integer", minimum: 0, maximum: 4_096 },
        unobserved_cells: { type: "integer", minimum: 0, maximum: 4_096 },
        mismatch_samples: {
          type: "array",
          maxItems: 32,
          items: {
            type: "object",
            properties: {
              position: minecraftPositionSchema,
              observed_block: { type: "string", minLength: 1, maxLength: 160 },
            },
            required: ["position", "observed_block"],
            additionalProperties: false,
          },
        },
        within_survey_bounds: { type: "boolean" },
        complete: { type: "boolean" },
        all_match: { type: "boolean" },
      },
      required: [
        "from",
        "to",
        "expected_block",
        "total_cells",
        "sampled_cells",
        "matching_cells",
        "mismatched_cells",
        "unobserved_cells",
        "mismatch_samples",
        "within_survey_bounds",
        "complete",
        "all_match",
      ],
      additionalProperties: false,
    },
  },
  required: [
    "result_summary",
    "purpose",
    "center",
    "horizontal_radius",
    "vertical_radius",
    "sample_count",
    "bounds",
    "palette",
    "palette_complete",
    "omitted_palette_block_types",
    "column_encoding",
    "columns",
    "columns_complete",
    "retained_column_count",
    "omitted_column_count",
    "omitted_run_count",
    "wire_details_json_bytes",
    "anchors",
    "anchors_complete",
    "retained_anchor_count",
    "omitted_anchor_count",
    "fireplace_candidates",
    "fireplace_candidates_complete",
    "retained_fireplace_candidate_count",
    "omitted_fireplace_candidate_count",
    "build_line_candidates",
    "build_line_candidates_complete",
    "retained_build_line_candidate_count",
    "omitted_build_line_candidate_count",
  ],
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

const minecraftPlayerActionOutputSchema: HelixEnvironmentConstrainedJsonSchema = {
  type: "object",
  properties: {
    workflow_id: { type: "string", minLength: 1, maxLength: 320 },
    outcome: {
      type: "string",
      enum: [
        "succeeded",
        "failed",
        "request_canceled",
        "manual_override",
        "emergency_stopped",
        "connector_offline",
        "workflow_timeout",
        "authority_stale",
        "precondition_failed",
        "postcondition_failed",
      ],
    },
    summary: { type: "string", minLength: 1, maxLength: 4_000 },
    postconditions_verified: { type: "boolean" },
    controls_released: { type: "boolean" },
    evidence_refs: {
      type: "array",
      items: { type: "string", minLength: 1, maxLength: 320 },
      maxItems: 256,
    },
  },
  required: [
    "workflow_id",
    "outcome",
    "summary",
    "postconditions_verified",
    "controls_released",
    "evidence_refs",
  ],
  additionalProperties: false,
};

const minecraftNavigateInputSchema: HelixEnvironmentConstrainedJsonSchema = {
  type: "object",
  properties: {
    action_kind: { type: "string", enum: ["navigate_to"] },
    destination: minecraftPositionSchema,
    arrival_radius: { type: "number", minimum: 0.25, maximum: 16 },
    allow_sprint: { type: "boolean" },
    allow_dig: { type: "boolean", enum: [false] },
    allow_place: { type: "boolean", enum: [false] },
    engine_preference: {
      type: "string",
      enum: ["adapter_selected", "native_fabric", "baritone"],
    },
  },
  required: [
    "action_kind",
    "destination",
    "arrival_radius",
    "allow_sprint",
    "allow_dig",
    "allow_place",
    "engine_preference",
  ],
  additionalProperties: false,
};

const minecraftLookInputSchema: HelixEnvironmentConstrainedJsonSchema = {
  type: "object",
  properties: {
    action_kind: { type: "string", enum: ["look_at"] },
    target_kind: {
      type: "string",
      enum: ["position", "current_focus", "relative_rotation"],
      description:
        "Look at an exact position, retain the current focus, or rotate relative to the current measured view.",
    },
    position: minecraftPositionSchema,
    yaw_delta_degrees: {
      type: "number",
      minimum: -180,
      maximum: 180,
      description:
        "For relative_rotation, positive degrees turn right and negative degrees turn left. Omit this axis to keep its current angle.",
    },
    pitch_delta_degrees: {
      type: "number",
      minimum: -180,
      maximum: 180,
      description:
        "For relative_rotation, positive degrees look down and negative degrees look up. Omit this axis to keep its current angle.",
    },
    max_turn_degrees_per_tick: { type: "number", minimum: 0.1, maximum: 180 },
  },
  required: ["action_kind", "target_kind", "max_turn_degrees_per_tick"],
  additionalProperties: false,
};

const minecraftWalkInputSchema: HelixEnvironmentConstrainedJsonSchema = {
  type: "object",
  properties: {
    action_kind: { type: "string", enum: ["walk"] },
    direction: { type: "string", enum: ["forward", "back", "left", "right"] },
    duration_ms: { type: "integer", minimum: 50, maximum: 10_000 },
    sprint: { type: "boolean" },
  },
  required: ["action_kind", "direction", "duration_ms", "sprint"],
  additionalProperties: false,
};

const minecraftJumpInputSchema: HelixEnvironmentConstrainedJsonSchema = {
  type: "object",
  properties: {
    action_kind: { type: "string", enum: ["jump"] },
    count: { type: "integer", minimum: 1, maximum: 10 },
  },
  required: ["action_kind", "count"],
  additionalProperties: false,
};

const minecraftInteractInputSchema: HelixEnvironmentConstrainedJsonSchema = {
  type: "object",
  properties: {
    action_kind: { type: "string", enum: ["interact"] },
    target: {
      type: "string",
      enum: ["current_focus", "looked_at_block", "looked_at_entity"],
    },
    hand: { type: "string", enum: ["main_hand", "off_hand"] },
    interaction: { type: "string", enum: ["use", "interact"] },
  },
  required: ["action_kind", "target", "hand", "interaction"],
  additionalProperties: false,
};

const minecraftHotbarInputSchema: HelixEnvironmentConstrainedJsonSchema = {
  type: "object",
  properties: {
    action_kind: { type: "string", enum: ["hotbar_select"] },
    slot: { type: "integer", minimum: 0, maximum: 8 },
  },
  required: ["action_kind", "slot"],
  additionalProperties: false,
};

const minecraftEquipInputSchema: HelixEnvironmentConstrainedJsonSchema = {
  type: "object",
  properties: {
    action_kind: { type: "string", enum: ["equip"] },
    item_id: { type: "string", minLength: 3, maxLength: 320 },
    destination: {
      type: "string",
      enum: ["main_hand", "off_hand", "head", "chest", "legs", "feet"],
    },
  },
  required: ["action_kind", "item_id", "destination"],
  additionalProperties: false,
};

const minecraftFollowInputSchema: HelixEnvironmentConstrainedJsonSchema = {
  type: "object",
  properties: {
    action_kind: { type: "string", enum: ["follow"] },
    subject_ref: {
      type: "string",
      minLength: 1,
      maxLength: 320,
      description:
        "Exact visible subject_ref from the active room environment directory; Helix resolves its native identity server-side.",
    },
    distance: { type: "number", minimum: 1, maximum: 64 },
    max_duration_ms: {
      type: "integer",
      minimum: 1_000,
      maximum: 30 * 60_000,
    },
    stop_below_health: { type: "number", minimum: 1, maximum: 20 },
  },
  required: [
    "action_kind",
    "subject_ref",
    "distance",
    "max_duration_ms",
    "stop_below_health",
  ],
  additionalProperties: false,
};

const minecraftCollectInputSchema: HelixEnvironmentConstrainedJsonSchema = {
  type: "object",
  properties: {
    action_kind: { type: "string", enum: ["collect"] },
    item_or_block_id: {
      type: "string",
      minLength: 3,
      maxLength: 320,
      description: "Exact item identifier for a dropped item in loaded client range.",
    },
    count: { type: "integer", minimum: 1, maximum: 2_304 },
    search_radius: { type: "number", minimum: 1, maximum: 128 },
  },
  required: ["action_kind", "item_or_block_id", "count", "search_radius"],
  additionalProperties: false,
};

const minecraftMineInputSchema: HelixEnvironmentConstrainedJsonSchema = {
  type: "object",
  properties: {
    action_kind: { type: "string", enum: ["mine"] },
    block_id: { type: "string", minLength: 3, maxLength: 320 },
    count: { type: "integer", minimum: 1, maximum: 4_096 },
    search_radius: {
      type: "integer",
      minimum: 1,
      maximum: 32,
      description:
        "Bounded loaded-client search radius for the native Fabric engine.",
    },
  },
  required: ["action_kind", "block_id", "count", "search_radius"],
  additionalProperties: false,
};

const minecraftPlaceInputSchema: HelixEnvironmentConstrainedJsonSchema = {
  type: "object",
  properties: {
    action_kind: { type: "string", enum: ["place"] },
    block_id: { type: "string", minLength: 3, maxLength: 320 },
    positions: {
      type: "array",
      minItems: 1,
      maxItems: 256,
      items: minecraftBlockPositionSchema,
    },
  },
  required: ["action_kind", "block_id", "positions"],
  additionalProperties: false,
};

const minecraftCraftInputSchema: HelixEnvironmentConstrainedJsonSchema = {
  type: "object",
  properties: {
    action_kind: { type: "string", enum: ["craft"] },
    output_item_id: { type: "string", minLength: 3, maxLength: 320 },
    count: { type: "integer", minimum: 1, maximum: 2_304 },
    recipe_id: {
      type: "string",
      minLength: 3,
      maxLength: 320,
      description:
        "Optional exact recipe resource key. Use null to allow the client to select a known craftable recipe by output.",
    },
  },
  required: ["action_kind", "output_item_id", "count"],
  additionalProperties: false,
};

const minecraftInventoryTransferInputSchema: HelixEnvironmentConstrainedJsonSchema = {
  type: "object",
  properties: {
    action_kind: { type: "string", enum: ["inventory_transfer"] },
    direction: { type: "string", enum: ["deposit", "withdraw"] },
    item_id: { type: "string", minLength: 3, maxLength: 320 },
    count: { type: "integer", minimum: 1, maximum: 2_304 },
    container_target: {
      type: "string",
      enum: ["current_open_container", "looked_at_container"],
    },
  },
  required: ["action_kind", "direction", "item_id", "count", "container_target"],
  additionalProperties: false,
};

const descriptors: HelixEnvironmentCapabilityDescriptor[] = [
  descriptor({
    capabilityId: HELIX_MINECRAFT_ACTOR_STATUS_READ_CAPABILITY,
    domain: "minecraft",
    adapterProfileIds: [HELIX_MINECRAFT_ADAPTER_PROFILE_ID],
    label: "Read current Minecraft actor status",
    description:
      "Read health, hunger, active effects, game mode, status flags, world, position, measured yaw/pitch, and an admitted allowlisted mod-mechanics state for the current bound Minecraft actor without changing the world.",
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
    capabilityId: HELIX_MINECRAFT_SPATIAL_REGION_INSPECT_CAPABILITY,
    capabilityVersion: 2,
    domain: "minecraft",
    adapterProfileIds: [HELIX_MINECRAFT_ADAPTER_PROFILE_ID],
    label: "Inspect a bounded Minecraft spatial region",
    description:
      "Read a compact, exact block-column survey around the current bound actor for structure, build, fireplace, or landing-safety planning, or verify an exact bounded post-action block footprint. Returns block palette, run-length encoded columns, semantic anchors, conservative fireplace candidates, non-authoritative safe straight-line build candidates, and exact material-match receipts without changing the world.",
    inputSchema: minecraftSpatialRegionInputSchema,
    outputSchema: minecraftSpatialRegionOutputSchema,
    freshnessCeilingMs: 30_000,
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
  actionDescriptor({
    capabilityId: HELIX_MINECRAFT_PLAYER_NAVIGATE_CAPABILITY,
    label: "Navigate the paired Minecraft player",
    description:
      "Move the separately paired player toward an exact position with bounded duration and distance. Native Fabric navigation never digs or places blocks; Baritone is selectable only when its manifest capability is live.",
    inputSchema: minecraftNavigateInputSchema,
    timeoutCeilingMs: 5 * 60_000,
  }),
  actionDescriptor({
    capabilityId: HELIX_MINECRAFT_PLAYER_LOOK_CAPABILITY,
    label: "Turn the paired Minecraft player's view",
    description:
      "Turn the paired player's view toward a resolved position, rotate by an exact relative yaw/pitch delta, or retain the current focus, with manual input taking precedence. Positive relative yaw turns right; positive relative pitch looks down.",
    inputSchema: minecraftLookInputSchema,
    timeoutCeilingMs: 15_000,
  }),
  actionDescriptor({
    capabilityId: HELIX_MINECRAFT_PLAYER_WALK_CAPABILITY,
    label: "Walk the paired Minecraft player",
    description:
      "Hold one movement direction for a bounded duration, optionally sprinting, and release every key on completion, cancellation, disconnect, or manual override.",
    inputSchema: minecraftWalkInputSchema,
    timeoutCeilingMs: 15_000,
  }),
  actionDescriptor({
    capabilityId: HELIX_MINECRAFT_PLAYER_JUMP_CAPABILITY,
    label: "Jump with the paired Minecraft player",
    description:
      "Issue a bounded sequence of jump inputs for the separately paired player and report observed completion evidence.",
    inputSchema: minecraftJumpInputSchema,
    timeoutCeilingMs: 15_000,
  }),
  actionDescriptor({
    capabilityId: HELIX_MINECRAFT_PLAYER_INTERACT_CAPABILITY,
    label: "Use the paired Minecraft player's current focus",
    description:
      "Use or interact with the block or entity currently under the paired player's crosshair using the selected hand.",
    inputSchema: minecraftInteractInputSchema,
    timeoutCeilingMs: 15_000,
  }),
  actionDescriptor({
    capabilityId: HELIX_MINECRAFT_PLAYER_HOTBAR_SELECT_CAPABILITY,
    label: "Select a Minecraft hotbar slot",
    description:
      "Select one exact zero-based hotbar slot for the separately paired player and verify the selected slot afterward.",
    inputSchema: minecraftHotbarInputSchema,
    timeoutCeilingMs: 10_000,
  }),
  actionDescriptor({
    capabilityId: HELIX_MINECRAFT_PLAYER_EQUIP_CAPABILITY,
    label: "Equip an item for the paired Minecraft player",
    description:
      "Move an exact item identifier from the player's inventory into the requested hand or armor destination and verify the resulting equipment slot.",
    inputSchema: minecraftEquipInputSchema,
    timeoutCeilingMs: 15_000,
  }),
  actionDescriptor({
    capabilityId: HELIX_MINECRAFT_PLAYER_FOLLOW_CAPABILITY,
    label: "Follow a bound Minecraft player",
    description:
      "Follow one exact active room subject for a bounded interval, maintain the requested distance, and stop if measured health crosses the admitted floor.",
    inputSchema: minecraftFollowInputSchema,
    timeoutCeilingMs: 30 * 60_000,
  }),
  actionDescriptor({
    capabilityId: HELIX_MINECRAFT_PLAYER_COLLECT_CAPABILITY,
    label: "Collect dropped Minecraft items",
    description:
      "Move the paired player toward matching dropped items in loaded client range until the requested inventory increase is measured.",
    inputSchema: minecraftCollectInputSchema,
    timeoutCeilingMs: 10 * 60_000,
  }),
  actionDescriptor({
    capabilityId: HELIX_MINECRAFT_PLAYER_MINE_CAPABILITY,
    label: "Mine matching Minecraft blocks",
    description:
      "Find and mine a bounded number of matching loaded blocks through the normal client game-mode controller, verifying each removed block. Requires explicit owner-granted world-mutation authority.",
    inputSchema: minecraftMineInputSchema,
    timeoutCeilingMs: 30 * 60_000,
  }),
  actionDescriptor({
    capabilityId: HELIX_MINECRAFT_PLAYER_PLACE_CAPABILITY,
    label: "Place Minecraft blocks at exact positions",
    description:
      "Place the requested inventory block at exact integer positions through legitimate support-face interactions and verify every resulting block. Requires explicit owner-granted world-mutation authority.",
    inputSchema: minecraftPlaceInputSchema,
    timeoutCeilingMs: 30 * 60_000,
  }),
  actionDescriptor({
    capabilityId: HELIX_MINECRAFT_PLAYER_CRAFT_CAPABILITY,
    label: "Craft a Minecraft item",
    description:
      "Select a known craftable client recipe in the active inventory or crafting-table grid, take server-presented results, and verify the output inventory increase.",
    inputSchema: minecraftCraftInputSchema,
    timeoutCeilingMs: 10 * 60_000,
  }),
  actionDescriptor({
    capabilityId: HELIX_MINECRAFT_PLAYER_INVENTORY_TRANSFER_CAPABILITY,
    label: "Transfer Minecraft container inventory",
    description:
      "Deposit or withdraw an exact item count through an active or looked-at container menu and verify the player inventory delta.",
    inputSchema: minecraftInventoryTransferInputSchema,
    timeoutCeilingMs: 10 * 60_000,
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
      ) &&
      entry.capability_id !== HELIX_MINECRAFT_SPATIAL_REGION_INSPECT_CAPABILITY,
    ),
  },
  {
    packageVersionId:
      "connector_package_version:com.casimirbot.minecraft.fabric:0.2.0",
    packageId: "com.casimirbot.minecraft.fabric",
    packageVersion: "0.2.0",
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
      "connector_package_version:com.casimirbot.minecraft.fabric-player:0.2.0",
    packageId: "com.casimirbot.minecraft.fabric-player",
    packageVersion: "0.2.0",
    publisherId: "publisher:casimirbot",
    adapterProfileId: HELIX_MINECRAFT_FABRIC_PLAYER_ACTION_PROFILE_ID,
    hostCompatibility: [
      "fabric-client:1.21.8",
      "fabric-loader:0.18.4+",
      "fabric-api:0.136.1+1.21.8",
      "java:21",
    ],
    capabilityDescriptors: descriptors.filter((entry) =>
      entry.adapter_profile_ids.includes(
        HELIX_MINECRAFT_FABRIC_PLAYER_ACTION_PROFILE_ID,
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
    case HELIX_MINECRAFT_SPATIAL_REGION_INSPECT_CAPABILITY:
      return "spatial_region";
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
