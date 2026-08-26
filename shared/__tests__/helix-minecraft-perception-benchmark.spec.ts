import { describe, expect, it } from "vitest";
import {
  admitHelixMinecraftActionRetry,
  evaluateHelixMinecraftPerceptionBenchmark,
} from "../helix-minecraft-perception-benchmark";

const fingerprint = (character: string): string =>
  `sha256:${character.repeat(64)}`;

const candidates = (overrides: Record<string, Record<string, unknown>> = {}) =>
  (["forward", "right", "back", "left"] as const).map((direction) => ({
    relative_direction: direction,
    evidence_complete: true,
    drop_depth_blocks: 0,
    drop_scan_complete: true,
    safe_candidate: true,
    ...(overrides[direction] ?? {}),
  }));

const scene = (input: {
  id: string;
  expected: string[];
  actorOnFire?: boolean;
  entities?: Array<Record<string, unknown>>;
  hazards?: Array<Record<string, unknown>>;
  movement?: ReturnType<typeof candidates>;
  coverage?: Record<string, unknown>;
  screen?: "open" | "closed" | "unobserved";
  sameRevision?: boolean;
}) => ({
  scene_id: input.id,
  ground_truth_source: "deterministic_scene_spec",
  screenshot_ref: null,
  expected_critical_hazards: input.expected,
  snapshot: {
    snapshot_schema: "helix.minecraft_perception_snapshot.v1",
    game_tick: 100,
    observation_revision: 100,
    actor: { on_fire: input.actorOnFire ?? false },
    entities: input.entities ?? [],
    hazards: input.hazards ?? [],
    movement_candidates: input.movement ?? candidates(),
    coverage: {
      loaded_region_complete: true,
      unknown_cell_count: 0,
      entities_complete: true,
      hazards_complete: true,
      ...(input.coverage ?? {}),
    },
    ui_state: {
      same_revision: input.sameRevision ?? true,
      client_screen_state: input.screen ?? "closed",
      ...((input.sameRevision ?? true)
        ? {
            client_game_tick: 100,
            server_received_tick: 100,
            age_ticks: 0,
            freshness: "fresh",
          }
        : { freshness: "unobserved" }),
    },
    world_rules: { keep_inventory: false },
    semantic_fingerprint: fingerprint("a"),
  },
});

describe("Minecraft perception benchmark", () => {
  it("recalls every finite critical hazard without a false-safe unknown", () => {
    const report = evaluateHelixMinecraftPerceptionBenchmark({
      schema: "helix.minecraft_perception_benchmark.v1",
      scenes: [
        scene({ id: "level", expected: [] }),
        scene({
          id: "drop",
          expected: ["deep_drop:forward"],
          movement: candidates({
            forward: {
              evidence_complete: true,
              drop_depth_blocks: 4,
              drop_scan_complete: true,
              safe_candidate: false,
            },
          }),
        }),
        scene({
          id: "lava",
          expected: ["lava"],
          hazards: [{ kind: "lava", critical: true }],
          movement: candidates({ right: { safe_candidate: false } }),
        }),
        scene({
          id: "hostile",
          expected: ["hostile"],
          entities: [{
            classification: "hostile",
            distance_blocks: 8,
            targeting_actor: true,
            line_of_sight: false,
          }],
        }),
        scene({ id: "screen", expected: ["ui_open"], screen: "open" }),
        scene({
          id: "unknown",
          expected: ["coverage_gap", "deep_drop:left"],
          coverage: { loaded_region_complete: false, unknown_cell_count: 64 },
          movement: candidates({
            forward: { safe_candidate: false },
            right: { safe_candidate: false },
            back: { safe_candidate: false },
            left: {
              evidence_complete: false,
              drop_depth_blocks: 7,
              drop_scan_complete: false,
              safe_candidate: false,
            },
          }),
          screen: "unobserved",
          sameRevision: false,
        }),
      ],
    });
    expect(report).toMatchObject({
      scene_count: 6,
      critical_hazard_recall: 1,
      false_safe_scene_ids: [],
      revision_failure_scene_ids: [],
      missing_hazards: [],
      pass: true,
    });
  });

  it("fails closed when incomplete coverage is labelled safe", () => {
    const report = evaluateHelixMinecraftPerceptionBenchmark({
      schema: "helix.minecraft_perception_benchmark.v1",
      scenes: [scene({
        id: "false-safe",
        expected: ["coverage_gap"],
        coverage: { loaded_region_complete: false, unknown_cell_count: 1 },
        screen: "unobserved",
        sameRevision: false,
      })],
    });
    expect(report.pass).toBe(false);
    expect(report.false_safe_scene_ids).toEqual(["false-safe"]);
  });

  it("blocks an identical unchanged retry while admitting new evidence or explicit retry authority", () => {
    const base = {
      previous_semantic_fingerprint: fingerprint("a"),
      current_semantic_fingerprint: fingerprint("a"),
      previous_action_hash: fingerprint("b"),
      proposed_action_hash: fingerprint("b"),
      failure_evidence_unchanged: true,
      typed_transient_retry: false,
      operator_directed_retry: false,
    };
    expect(admitHelixMinecraftActionRetry(base)).toEqual({
      admitted: false,
      reason: "unchanged_snapshot_action_and_failure",
    });
    expect(admitHelixMinecraftActionRetry({
      ...base,
      current_semantic_fingerprint: fingerprint("c"),
    }).admitted).toBe(true);
    expect(admitHelixMinecraftActionRetry({
      ...base,
      typed_transient_retry: true,
    }).reason).toBe("typed_transient_retry");
  });
});
