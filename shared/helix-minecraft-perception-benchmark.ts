import { z } from "zod";

export const HELIX_MINECRAFT_PERCEPTION_BENCHMARK_SCHEMA =
  "helix.minecraft_perception_benchmark.v1" as const;

const directionSchema = z.enum(["forward", "back", "left", "right"]);
const hazardLabelSchema = z.union([
  z.enum(["lava", "fire", "hostile", "coverage_gap", "ui_open"]),
  z.string().regex(/^deep_drop:(forward|back|left|right)$/u),
]);

const movementCandidateSchema = z.object({
  relative_direction: directionSchema,
  evidence_complete: z.boolean(),
  drop_depth_blocks: z.number().int().min(0).max(7),
  drop_scan_complete: z.boolean(),
  safe_candidate: z.boolean(),
}).passthrough();

export const helixMinecraftPerceptionBenchmarkSceneSchema = z.object({
  scene_id: z.string().trim().min(1).max(160),
  ground_truth_source: z.enum([
    "deterministic_scene_spec",
    "human_screenshot_label",
  ]),
  screenshot_ref: z.string().trim().min(1).max(512).nullable(),
  expected_critical_hazards: z.array(hazardLabelSchema).max(32),
  snapshot: z.object({
    snapshot_schema: z.literal("helix.minecraft_perception_snapshot.v1"),
    game_tick: z.number().int().nonnegative(),
    observation_revision: z.number().int().nonnegative(),
    actor: z.object({
      on_fire: z.boolean(),
    }).passthrough(),
    entities: z.array(z.object({
      classification: z.string(),
      distance_blocks: z.number().nonnegative(),
      targeting_actor: z.boolean(),
      line_of_sight: z.boolean(),
    }).passthrough()).max(128),
    hazards: z.array(z.object({
      kind: z.string().trim().min(1).max(80),
      critical: z.boolean(),
    }).passthrough()).max(128),
    movement_candidates: z.array(movementCandidateSchema).length(4),
    coverage: z.object({
      loaded_region_complete: z.boolean(),
      unknown_cell_count: z.number().int().nonnegative(),
      entities_complete: z.boolean(),
      hazards_complete: z.boolean(),
    }).passthrough(),
    ui_state: z.object({
      same_revision: z.boolean(),
      client_screen_state: z.enum(["open", "closed", "unobserved"]),
      client_game_tick: z.number().int().nonnegative().optional(),
      server_received_tick: z.number().int().nonnegative().optional(),
      age_ticks: z.number().int().min(0).max(10).optional(),
      freshness: z.enum(["fresh", "unobserved"]),
    }).passthrough(),
    world_rules: z.object({
      keep_inventory: z.boolean(),
    }).strict(),
    semantic_fingerprint: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
  }).passthrough(),
}).strict();

export const helixMinecraftPerceptionBenchmarkSchema = z.object({
  schema: z.literal(HELIX_MINECRAFT_PERCEPTION_BENCHMARK_SCHEMA),
  scenes: z.array(helixMinecraftPerceptionBenchmarkSceneSchema).min(1).max(128),
}).strict();

export type HelixMinecraftPerceptionBenchmarkScene = z.infer<
  typeof helixMinecraftPerceptionBenchmarkSceneSchema
>;

const observedHazards = (
  scene: HelixMinecraftPerceptionBenchmarkScene,
): Set<string> => {
  const observed = new Set<string>();
  for (const hazard of scene.snapshot.hazards) {
    if (hazard.kind === "lava" || hazard.kind === "fire") observed.add(hazard.kind);
  }
  if (scene.snapshot.actor.on_fire) observed.add("fire");
  if (scene.snapshot.entities.some((entity) =>
    entity.classification === "hostile" &&
    (entity.targeting_actor || entity.distance_blocks <= 16)
  )) observed.add("hostile");
  for (const candidate of scene.snapshot.movement_candidates) {
    if (!candidate.drop_scan_complete || candidate.drop_depth_blocks >= 2) {
      observed.add(`deep_drop:${candidate.relative_direction}`);
    }
  }
  if (
    !scene.snapshot.coverage.loaded_region_complete ||
    !scene.snapshot.coverage.entities_complete ||
    !scene.snapshot.coverage.hazards_complete ||
    scene.snapshot.coverage.unknown_cell_count > 0
  ) observed.add("coverage_gap");
  if (scene.snapshot.ui_state.client_screen_state === "open") observed.add("ui_open");
  return observed;
};

export const evaluateHelixMinecraftPerceptionBenchmark = (
  input: unknown,
): {
  scene_count: number;
  expected_critical_hazard_count: number;
  recalled_critical_hazard_count: number;
  critical_hazard_recall: number;
  false_safe_scene_ids: string[];
  revision_failure_scene_ids: string[];
  missing_hazards: Array<{ scene_id: string; hazard: string }>;
  pass: boolean;
} => {
  const benchmark = helixMinecraftPerceptionBenchmarkSchema.parse(input);
  const missingHazards: Array<{ scene_id: string; hazard: string }> = [];
  const falseSafeSceneIds: string[] = [];
  const revisionFailureSceneIds: string[] = [];
  let expectedCount = 0;
  for (const scene of benchmark.scenes) {
    const observed = observedHazards(scene);
    expectedCount += scene.expected_critical_hazards.length;
    for (const hazard of scene.expected_critical_hazards) {
      if (!observed.has(hazard)) {
        missingHazards.push({ scene_id: scene.scene_id, hazard });
      }
    }
    const incompleteCoverage = observed.has("coverage_gap");
    if (
      incompleteCoverage &&
      scene.snapshot.movement_candidates.some((candidate) => candidate.safe_candidate)
    ) falseSafeSceneIds.push(scene.scene_id);
    const ui = scene.snapshot.ui_state;
    const uiUnobserved = ui.client_screen_state === "unobserved";
    const explicitClientRevision =
      ui.client_game_tick !== undefined &&
      ui.server_received_tick !== undefined &&
      ui.age_ticks !== undefined &&
      ui.server_received_tick <= scene.snapshot.game_tick &&
      ui.age_ticks === scene.snapshot.game_tick - ui.server_received_tick &&
      ui.freshness === "fresh";
    if (
      scene.snapshot.game_tick !== scene.snapshot.observation_revision ||
      (ui.same_revision &&
        (ui.client_game_tick !== scene.snapshot.game_tick ||
          !explicitClientRevision)) ||
      (!ui.same_revision && !uiUnobserved && !explicitClientRevision) ||
      (uiUnobserved && ui.freshness !== "unobserved")
    ) revisionFailureSceneIds.push(scene.scene_id);
  }
  const recalledCount = expectedCount - missingHazards.length;
  return {
    scene_count: benchmark.scenes.length,
    expected_critical_hazard_count: expectedCount,
    recalled_critical_hazard_count: recalledCount,
    critical_hazard_recall: expectedCount === 0 ? 1 : recalledCount / expectedCount,
    false_safe_scene_ids: falseSafeSceneIds,
    revision_failure_scene_ids: revisionFailureSceneIds,
    missing_hazards: missingHazards,
    pass:
      missingHazards.length === 0 &&
      falseSafeSceneIds.length === 0 &&
      revisionFailureSceneIds.length === 0,
  };
};

export const admitHelixMinecraftActionRetry = (input: {
  previous_semantic_fingerprint: string;
  current_semantic_fingerprint: string;
  previous_action_hash: string;
  proposed_action_hash: string;
  failure_evidence_unchanged: boolean;
  typed_transient_retry: boolean;
  operator_directed_retry: boolean;
}): { admitted: boolean; reason: string } => {
  const unchanged =
    input.previous_semantic_fingerprint === input.current_semantic_fingerprint &&
    input.previous_action_hash === input.proposed_action_hash &&
    input.failure_evidence_unchanged;
  if (!unchanged) return { admitted: true, reason: "material_change_or_new_action" };
  if (input.typed_transient_retry) {
    return { admitted: true, reason: "typed_transient_retry" };
  }
  if (input.operator_directed_retry) {
    return { admitted: true, reason: "operator_directed_retry" };
  }
  return { admitted: false, reason: "unchanged_snapshot_action_and_failure" };
};
