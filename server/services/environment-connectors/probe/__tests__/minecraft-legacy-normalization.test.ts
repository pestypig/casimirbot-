import { describe, expect, it } from "vitest";
import {
  HELIX_ENVIRONMENT_PROBE_RESULT_SCHEMA,
  type HelixEnvironmentProbeResult,
  type HelixEnvironmentProbeType,
} from "@shared/helix-environment-probe";
import {
  normalizeLegacyEnvironmentProbeResultForTests,
  outcomeForLegacyEnvironmentProbeResultForTests,
} from "../durable-broker";

const result = (
  probeType: HelixEnvironmentProbeType,
  payload: HelixEnvironmentProbeResult["result"],
  status: HelixEnvironmentProbeResult["status"] = "succeeded",
): HelixEnvironmentProbeResult => ({
  schema: HELIX_ENVIRONMENT_PROBE_RESULT_SCHEMA,
  probe_result_id: `probe_result:${probeType}`,
  probe_request_id: `probe_request:${probeType}`,
  source_id: "source:minecraft",
  room_id: "room:minecraft",
  domain: "minecraft",
  probe_type: probeType,
  status,
  result_summary: `${probeType} observation`,
  result: payload,
  sensor_scope: "sensor_observable",
  requires_caveat: false,
  side_effects_performed: false,
  commands_executed: [],
  world_mutation_performed: false,
  evidence_refs: [`minecraft:probe:${probeType}`],
  deterministic: true,
  model_invoked: false,
  assistant_answer: false,
  raw_content_included: false,
  context_policy: "compact_context_pack_only",
  created_at: "2026-07-29T12:00:00.000Z",
});

describe("Minecraft legacy probe normalization", () => {
  it.each([
    [
      "actor_status",
      {
        confidence: 0.98,
        details: {
          health: 18,
          max_health: 20,
          food_level: 14,
          saturation: 4.5,
          game_mode: "survival",
          world: "minecraft:overworld",
          position: { x: 1.5, y: 64, z: -2.25 },
          status_flags: ["sprinting"],
          active_effects: [
            {
              effect: "minecraft:hunger",
              amplifier: 1,
              duration_ticks: 1200,
            },
          ],
          mechanics_state: {
            mod_id: "mr_crimson_curse",
            mod_version: "1.4.1",
            state_source: "allowlisted_scoreboard_observation",
            raw_command_output_included: false,
            raw_nbt_included: false,
            status: "observed",
            global_mass: 37,
            global_points: 45,
            infection_phase: 3,
            private_scoreboard_value: "must-not-leak",
          },
        },
      },
      {
        health: 18,
        max_health: 20,
        food_level: 14,
        saturation: 4.5,
        game_mode: "survival",
        world: "minecraft:overworld",
        position: { x: 1.5, y: 64, z: -2.25 },
        status_flags: ["sprinting"],
          active_effects: [
          {
            effect: "minecraft:hunger",
            amplifier: 1,
            duration_ticks: 1200,
          },
        ],
      },
    ],
    [
      "nearby_entities",
      {
        confidence: 0.9,
        details: {
          entity_count: 1,
          entities: [
            {
              entity_type: "minecraft:zombie",
              classification: "hostile",
              distance_blocks: 6.25,
              targeting_actor: true,
            },
          ],
          mechanics_state: {
            mod_id: "mr_crimson_curse",
            mod_version: "1.4.1",
            state_source: "allowlisted_scoreboard_observation",
            raw_command_output_included: false,
            raw_nbt_included: false,
            status: "observed",
            global_mass: 37,
            global_points: 45,
            infection_phase: 3,
          },
        },
      },
      {
        entity_count: 1,
        entities: [
          {
            entity_type: "minecraft:zombie",
            classification: "hostile",
            distance_blocks: 6.25,
            targeting_actor: true,
          },
        ],
      },
    ],
    [
      "hazard_check",
      {
        hazard_present: true,
        confidence: 0.82,
        details: {
          hostile_entity_count: 2,
          nearest_hostile_distance_blocks: 4.5,
          environmental_hazard_block_count: 1,
          nearest_environmental_hazard_distance_blocks: 3.2,
          environmental_hazard_types: ["magma_block"],
          actor_on_fire: false,
          actor_freezing: false,
        },
      },
      {
        hazard_present: true,
        hostile_entity_count: 2,
        nearest_hostile_distance_blocks: 4.5,
        environmental_hazard_block_count: 1,
        nearest_environmental_hazard_distance_blocks: 3.2,
        environmental_hazard_types: ["magma_block"],
        actor_on_fire: false,
        actor_freezing: false,
      },
    ],
    [
      "local_map_summary",
      {
        confidence: 0.8,
        details: {
          sampled_floor_blocks: 81,
          solid_floor_blocks: 72,
          open_floor_blocks: 9,
          hazardous_floor_blocks: 1,
          liquid_floor_blocks: 0,
        },
      },
      {
        sampled_floor_blocks: 81,
        solid_floor_blocks: 72,
        open_floor_blocks: 9,
        hazardous_floor_blocks: 1,
        liquid_floor_blocks: 0,
      },
    ],
    [
      "line_of_sight",
      { line_of_sight: true, distance_blocks: 9.5, confidence: 0.85 },
      { line_of_sight: true, distance_blocks: 9.5 },
    ],
    [
      "crop_state",
      {
        crop_mature: false,
        confidence: 0.9,
        details: { block_type: "minecraft:wheat" },
      },
      { crop_mature: false, crop_type: "minecraft:wheat" },
    ],
    [
      "reachability",
      {
        feasible: true,
        reachable: false,
        distance_blocks: 8,
        confidence: 0.72,
      },
      {
        within_probe_radius: true,
        within_interaction_range: false,
        distance_blocks: 8,
      },
    ],
  ] as const)(
    "normalizes %s into the trusted northbound result shape",
    (probeType, payload, expected) => {
      expect(
        normalizeLegacyEnvironmentProbeResultForTests(
          result(probeType, payload),
        ),
      ).toMatchObject({
        result_summary: `${probeType} observation`,
        ...expected,
      });
    },
  );

  it.each(["target_unavailable", "target_ambiguous"] as const)(
    "preserves typed actor identity failure %s",
    (failureCode) => {
      const failed = result(
        "actor_status",
        {
          confidence: 0.2,
          details: { failure_code: failureCode },
        },
        "failed",
      );
      expect(outcomeForLegacyEnvironmentProbeResultForTests(failed)).toBe(
        failureCode,
      );
      expect(normalizeLegacyEnvironmentProbeResultForTests(failed)).toEqual({
        result_summary: "actor_status observation",
      });
    },
  );
});
