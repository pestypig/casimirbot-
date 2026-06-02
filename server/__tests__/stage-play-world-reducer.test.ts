import { beforeEach, describe, expect, it } from "vitest";
import type { HelixMinecraftRouteSolverObservation } from "../../shared/helix-minecraft-evidence";
import { validateStagePlayBadgeGraphV1 } from "../../shared/contracts/stage-play-badge-graph.v1";
import { validateHelixRecommendedActionAdmissionV1 } from "../../shared/contracts/helix-recommended-action-admission.v1";
import {
  recordLiveSourceObservation,
  resetLiveSourceObservationStoreForTest,
} from "../services/live-source/live-source-observation-store";
import {
  ingestEnvironmentStateSnapshot,
  normalizeEnvironmentStateSnapshot,
  resetEnvironmentStateSnapshotWindowsForTest,
} from "../services/situation-room/environment-state-snapshot-window";
import { clearEventJournalForTest } from "../services/situation-room/event-journal-store";
import {
  resetLiveSourceChunkBufferForTest,
  upsertLiveSourceProducer,
} from "../services/situation-room/live-source-chunk-buffer";
import {
  resetLiveSourceDescriptorsForTest,
  upsertLiveSourceDescriptor,
} from "../services/situation-room/live-source-descriptor-builder";
import {
  recordMinecraftRouteSolverObservation,
  resetMinecraftNavigationStateStoreForTest,
} from "../services/situation-room/minecraft-navigation-state-store";
import { resetMinecraftWorldDeltaOverlaysForTest } from "../services/situation-room/minecraft-world-delta-overlay";
import { resetMinecraftWorldSenseWindows } from "../services/situation-room/minecraft-world-sense-window";
import {
  buildStagePlayGraphFromWorld,
  buildStagePlayRecommendedActionAdmissionV1,
} from "../services/stage-play/stage-play-badge-graph-builder";
import { resetStagePlayRawSessionBufferForTest } from "../services/stage-play/stage-play-raw-session-buffer-store";

const threadId = "thread:stage-play-reducer";
const roomId = "room:minecraft-stage-play-reducer";
const worldId = "minecraft:the_end";

beforeEach(() => {
  resetLiveSourceObservationStoreForTest();
  resetEnvironmentStateSnapshotWindowsForTest();
  resetMinecraftWorldDeltaOverlaysForTest();
  resetMinecraftNavigationStateStoreForTest();
  resetMinecraftWorldSenseWindows();
  resetLiveSourceDescriptorsForTest();
  resetLiveSourceChunkBufferForTest();
  resetStagePlayRawSessionBufferForTest();
  clearEventJournalForTest();
});

describe("Stage Play world-state badge reducer", () => {
  it("assembles world facts into deterministic Stage Play badges and procedural bindings", () => {
    const snapshot = normalizeEnvironmentStateSnapshot({
      threadId,
      snapshot: {
        snapshot_id: "snapshot:stage-play-reducer",
        domain: "minecraft",
        domain_adapter: "minecraft.adapter.v1",
        room_id: roomId,
        world_id: worldId,
        source_id: "source:minecraft-server",
        actor_id: "player:datdampig",
        actor_label: "DatDamPig",
        ts: "2026-06-02T12:10:00.000Z",
        actor_state: {
          pose: { position: { x: 10, y: 64, z: 10 }, facing: "north" },
          health: 6,
        },
        inventory_state: {
          selected_item: { item_type: "minecraft:shield", count: 1 },
          carried_items: [
            { item_type: "minecraft:cobblestone", count: 32 },
          ],
          equipped_items: [
            { item_type: "minecraft:shield", count: 1 },
          ],
        },
        object_state: {
          nearby_entities: [
            {
              object_ref: "entity:creeper:1",
              object_type: "minecraft:creeper",
              distance: 5,
              tags: ["hostile"],
              classification: ["hostile"],
            },
            {
              object_ref: "entity:zombie:1",
              object_type: "minecraft:zombie",
              distance: 8,
              tags: ["hostile"],
            },
          ],
          nearby_containers: [
            {
              container_ref: "container:chest:1",
              container_type: "minecraft:chest",
              contents_known: false,
            },
          ],
        },
        local_map: {
          radius: 4,
          salient_cells: [
            {
              cell_ref: "cell:walkable",
              cell_type: "minecraft:end_stone",
              position: { x: 10, y: 63, z: 11 },
              tags: ["walkable", "traversable"],
            },
            {
              cell_ref: "cell:door",
              cell_type: "minecraft:oak_door",
              position: { x: 11, y: 64, z: 10 },
              tags: ["door"],
            },
          ],
          map_hash: "local-map-hash",
          changed_since_last_snapshot: true,
        },
        chunk_snapshot_summary: {
          sampled_radius_chunks: 1,
          loaded_chunks_sampled: 3,
          surface_cells: [
            { cell_ref: "cell:surface", cell_type: "minecraft:end_stone", tags: ["walkable"] },
          ],
          route_corridor_cells: [
            { cell_ref: "cell:route", cell_type: "minecraft:cobblestone", tags: ["route_corridor", "bridge_like", "traversable"] },
          ],
          gateway_blocks: [
            { cell_ref: "cell:gateway", cell_type: "minecraft:end_gateway", tags: ["portal_or_gateway"] },
          ],
          bridge_like_blocks: [
            { cell_ref: "cell:bridge", cell_type: "minecraft:cobblestone", tags: ["bridge_like"] },
          ],
          hazard_cells: [
            { cell_ref: "cell:void", cell_type: "minecraft:air", tags: ["void_or_drop_risk"] },
            { cell_ref: "cell:lava", cell_type: "minecraft:lava", tags: ["lava", "hazard"] },
          ],
          map_hash: "chunk-map-hash",
          changed_since_last_snapshot: true,
          raw_chunk_included: false,
        },
        changed_sections: ["actor_state", "inventory_state", "object_state", "local_map", "chunk_snapshot_summary"],
        section_hashes: {
          actor_state: "actor",
          inventory_state: "inventory",
          object_state: "objects",
          local_map: "local-map-hash",
          chunk_snapshot_summary: "chunk-map-hash",
        },
        evidence_refs: ["evidence:snapshot"],
      },
    });
    expect(snapshot).not.toBeNull();
    ingestEnvironmentStateSnapshot(snapshot!);

    recordLiveSourceObservation({
      schema: "helix.live_source_observation.v1",
      observation_id: "live_source_observation:stage-play-reducer",
      thread_id: threadId,
      room_id: roomId,
      environment_id: "env:minecraft",
      source_id: "source:minecraft-server",
      source_kind: "minecraft_world_events",
      event_kind: "position_update",
      observed_at: "2026-06-02T12:10:01.000Z",
      freshness: { status: "fresh", age_ms: 20 },
      provenance: { adapter: "minecraft.plugin", confidence: "high" },
      compact_summary: "Position update.",
      evidence_refs: ["evidence:observation", snapshot!.snapshot_id],
      assistant_answer: false,
      raw_content_included: false,
    });
    const descriptor = upsertLiveSourceDescriptor({
      source_id: "source:minecraft-server",
      thread_id: threadId,
      environment_id: "env:minecraft",
      modality: "world_event",
      user_label: "Minecraft world events",
      serving_context: {
        surface: "game",
        source_origin: "minehut_plugin",
        app_hint: "Minecraft",
      },
      current_state: "active",
      cadence_ms: 1000,
      latest_observation_refs: ["live_source_observation:stage-play-reducer"],
    });
    const producer = upsertLiveSourceProducer({
      sourceId: "source:minecraft-server",
      threadId,
      modality: "world_event",
      status: "active",
      cadenceMs: 1000,
      captureMode: "push",
      latestChunkId: "live_source_chunk:minecraft-server",
      now: "2026-06-02T12:10:01.500Z",
    });

    const routeObservation: HelixMinecraftRouteSolverObservation = {
      schema: "helix.minecraft_route_solver_observation.v1",
      observation_id: "minecraft_route_solver_observation:reducer",
      room_id: roomId,
      world_id: worldId,
      actor_label: "DatDamPig",
      provider: "helix_chunk_graph",
      evidence_layer: "observed_current_world",
      evidence_trust: "server_observation",
      instruction_authority: "none",
      ask_context_policy: "evidence_only",
      creates_ask_turn: false,
      turn_triggered: false,
      ask_instruction_authority: "none",
      context_role: "tool_evidence",
      raw_user_text_included: false,
      from: { dimension: "minecraft:the_end", x: 10, y: 64, z: 10 },
      target: {
        ask_context_admissible: false,
        dimension: "minecraft:the_end",
        x: 20,
        y: 64,
        z: 20,
        target_type: "end_gateway",
      },
      result_status: "partial_route",
      planner_observation_mode: "path_preview",
      planner_execution_state: "planning_only",
      planner_side_effect_risk: "none_observation_only",
      world_state_dependency: "server_observed",
      movement_requirements: ["walk", "bridge", "dig"],
      risk_flags: ["void_fall", "lava", "hostiles", "unknown_gateway"],
      provider_confidence: 0.72,
      confidence_basis: ["server_blocks"],
      missing_evidence_codes: ["unknown_gateway"],
      missing_evidence: ["Gateway destination is not confirmed."],
      evidence_refs: ["evidence:route-solver"],
      reported_by_provider: true,
      normalized_by_deterministic_reducer: true,
      model_invoked_by_helix: false,
      ts: "2026-06-02T12:10:02.000Z",
    };
    recordMinecraftRouteSolverObservation(routeObservation);

    const graph = buildStagePlayGraphFromWorld({
      threadId,
      roomId,
      environmentId: "env:minecraft",
      objective: "tunnel forward toward the gateway while avoiding the creeper",
      now: new Date("2026-06-02T12:10:03.000Z"),
    });
    const badgeIds = graph.badges.map((badge) => badge.id);

    expect(validateStagePlayBadgeGraphV1(graph)).toEqual([]);
    expect(badgeIds).toEqual(expect.arrayContaining([
      "observer.live_sources",
      expect.stringMatching(/^source\./),
      "interpreter.stage_play_reflection",
      "setting.end",
      "setting.local_map",
      "setting.route_corridor",
      "setting.tunnel",
      "setting.bridge",
      "setting.gateway_area",
      "actor.player",
      "actor.creeper.nearby",
      "actor.zombie.nearby",
      "resource.cobblestone.available",
      "resource.shield.equipped",
      "prop.door.nearby",
      "prop.gateway_block.visible",
      "prop.bridge_like_block.nearby",
      "hazard.lava_nearby",
      "hazard.void_drop",
      "hazard.hostile_nearby",
      "hazard.low_health",
      "hazard.fall_risk",
      "affordance.observe",
      "affordance.move_forward",
      "affordance.mine_block",
      "affordance.place_block",
      "affordance.bridge",
      "affordance.retreat",
      "affordance.equip_shield",
      "affordance.open_door",
      "affordance.enter_portal",
      "blocked.engage_close_range",
      "blocked.drop_down",
      "blocked.step_into_lava",
      "blocked.mine_without_escape",
      "blocked.path_unknown_chunk",
      "blocked.enter_gateway_unconfirmed",
      "intent.move_away",
      "intent.preserve_self",
      "intent.maintain_line_of_sight",
      "intent.place_block",
      "intent.preserve_floor",
      "intent.update_passability",
      "intent.replan_path",
      "binding.tactical_retreat_tracking_threat",
      "binding.bridge_forward",
      "binding.tunnel_advance",
      "binding.defensive_retreat_barrier",
    ]));
    const observerBadge = graph.badges.find((badge) => badge.id === "observer.live_sources");
    expect(observerBadge).toMatchObject({
      kind: "observer",
      admission: "auto",
    });
    expect(graph.summary.kindCounts.observer).toBe(1);
    expect(graph.sourceWindow.sources).toEqual(expect.arrayContaining([
      expect.objectContaining({
        sourceId: "source:minecraft-server",
        status: "active",
        selectedForStagePlay: true,
        routeTo: "world_stage_play",
      }),
      expect.objectContaining({
        modality: "visual_frame",
        selectedForStagePlay: false,
        routeTo: "visual_context",
        nextRequiredAction: "Start visual interval",
      }),
      expect.objectContaining({
        modality: "audio_transcript",
        selectedForStagePlay: false,
        routeTo: "narrative_stage_play",
        nextRequiredAction: "Attach audio transcript",
      }),
    ]));
    const sourceBadge = graph.badges.find((badge) => badge.kind === "source");
    expect(sourceBadge).toMatchObject({
      kind: "source",
      admission: "auto",
      subjects: ["source:minecraft-server"],
    });
    expect(sourceBadge?.sourceRefs).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "live_source_descriptor", id: descriptor.descriptor_id }),
      expect.objectContaining({ kind: "live_source_producer", id: producer.producer_id }),
    ]));
    expect(graph.badges.find((badge) => badge.id === "interpreter.stage_play_reflection")).toMatchObject({
      kind: "interpreter",
      admission: "auto",
    });
    expect(graph.edges).toEqual(expect.arrayContaining([
      expect.objectContaining({ relation: "observes", from: "observer.live_sources" }),
      expect.objectContaining({ relation: "feeds", to: "interpreter.stage_play_reflection" }),
      expect.objectContaining({ relation: "feeds", from: "observer.live_sources", to: "interpreter.stage_play_reflection" }),
      expect.objectContaining({ relation: "interprets", from: "interpreter.stage_play_reflection", to: "actor.player" }),
    ]));
    expect(graph.sourceWindow.latestSourceDescriptorRefs).toEqual([descriptor.descriptor_id]);
    expect(graph.sourceWindow.latestSourceProducerRefs).toEqual([producer.producer_id]);
    expect(graph.badges.find((badge) => badge.id === "binding.bridge_forward")?.plainMeaning).toContain(
      "intent.place_block + intent.preserve_floor + affordance.move_forward",
    );
    expect(graph.badges.find((badge) => badge.id === "blocked.enter_gateway_unconfirmed")).toMatchObject({
      kind: "blocked_affordance",
      admission: "blocked",
    });
    expect(graph.recommendedActions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "stage-action:defensive-retreat-barrier",
        actionType: "navigation_hint",
        admission: "ask_user",
        agentExecutable: false,
        reasonCodes: expect.arrayContaining([
          "live_world_hazard_nearby",
          "low_health_constraint",
          "requires_user_world_action",
        ]),
      }),
      expect.objectContaining({
        id: "stage-action:engage-close-range",
        actionType: "blocked_move_notice",
        admission: "blocked",
        agentExecutable: false,
        reasonCodes: expect.arrayContaining([
          "explosive_threat_nearby",
          "low_health_constraint",
        ]),
      }),
    ]));
    expect(graph.recommendedActions.every((action) => action.agentExecutable === false)).toBe(true);
    expect(graph.recommendedActions.map((action) => JSON.stringify(action)).join("\n")).not.toMatch(
      /baritone|pathmind|terminal|run_command|minecraft_movement_api|inventory_mutation|block_placement_api/i,
    );
    const admission = buildStagePlayRecommendedActionAdmissionV1({
      graph,
      prompt: "What should I do while low health near a creeper?",
    });
    expect(validateHelixRecommendedActionAdmissionV1(admission)).toEqual([]);
    expect(admission.actions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        actionId: "stage-action:defensive-retreat-barrier",
        admission: "ask_user",
        risk: "mutating",
        requiresConfirmation: true,
        agentExecutable: false,
        display_policy: "actionable",
      }),
      expect.objectContaining({
        actionId: "stage-action:engage-close-range",
        admission: "blocked",
        risk: "unknown",
        requiresConfirmation: true,
        agentExecutable: false,
        display_policy: "diagnostic_only",
      }),
    ]));
    expect(admission.actions.every((action) => action.agentExecutable === false)).toBe(true);
    expect(admission.authority.agent_executable).toBe(false);
    expect(graph.sourceWindow.latestObservationRefs).toEqual(["live_source_observation:stage-play-reducer"]);
    expect(graph.sourceWindow.latestSnapshotRefs).toEqual(["snapshot:stage-play-reducer"]);
    expect(graph.sourceWindow.latestNavigationRefs).toEqual(expect.arrayContaining([
      "minecraft_route_solver_observation:reducer",
      "chunk_snapshot_sample:snapshot:stage-play-reducer:chunk-map-hash",
    ]));
    expect(graph.authority.agent_executable).toBe(false);
    expect(JSON.stringify(graph)).not.toContain("raw_chunk");
    expect(JSON.stringify(graph)).not.toContain("raw_user_text");
  });
});
