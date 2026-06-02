import { beforeEach, describe, expect, it } from "vitest";
import { validateStagePlayBadgeGraphV1 } from "../../shared/contracts/stage-play-badge-graph.v1";
import type { StagePlayBadgeGraphV1 } from "../../shared/contracts/stage-play-badge-graph.v1";
import {
  recordLiveSourceObservation,
  resetLiveSourceObservationStoreForTest,
} from "../services/live-source/live-source-observation-store";
import { executeLiveEnvironmentTool } from "../services/helix-ask/live-environment-tool-adapter";
import { buildLiveEnvironmentRuntimePacket } from "../services/situation-room/live-environment-runtime-packet-builder";
import {
  createLiveAnswerEnvironment,
  resetLiveAnswerEnvironments,
} from "../services/situation-room/live-answer-environment-store";
import {
  ingestEnvironmentStateSnapshot,
  normalizeEnvironmentStateSnapshot,
  resetEnvironmentStateSnapshotWindowsForTest,
} from "../services/situation-room/environment-state-snapshot-window";
import { clearEventJournalForTest } from "../services/situation-room/event-journal-store";
import { resetMinecraftNavigationStateStoreForTest } from "../services/situation-room/minecraft-navigation-state-store";
import { resetMinecraftWorldDeltaOverlaysForTest } from "../services/situation-room/minecraft-world-delta-overlay";
import { resetMinecraftWorldSenseWindows } from "../services/situation-room/minecraft-world-sense-window";

const threadId = "thread:stage-play-live-env-tool";
const roomId = "room:minecraft-stage-play-live-env-tool";
const environmentId = "live_env:stage-play";

beforeEach(() => {
  resetLiveAnswerEnvironments();
  resetLiveSourceObservationStoreForTest();
  resetEnvironmentStateSnapshotWindowsForTest();
  resetMinecraftNavigationStateStoreForTest();
  resetMinecraftWorldDeltaOverlaysForTest();
  resetMinecraftWorldSenseWindows();
  clearEventJournalForTest();
});

describe("live_env.reflect_stage_play_context", () => {
  it("is advertised as an evidence-only live environment tool", () => {
    const packet = buildLiveEnvironmentRuntimePacket({
      threadId,
      roomId,
      now: "2026-06-02T12:20:00.000Z",
    });

    expect(packet.available_tools).toEqual(expect.arrayContaining([
      expect.objectContaining({
        tool_id: "live_env.reflect_stage_play_context",
        family: "live_env",
        creates_assistant_answer: false,
        requires_user_confirmation: false,
        can_run_automatically: true,
      }),
    ]));
    expect(packet.policy.may_mutate_sources).toBe(false);
  });

  it("wraps Stage Play graph reflection as a non-authoritative tool observation", () => {
    const environment = createLiveAnswerEnvironment({
      thread_id: threadId,
      created_turn_id: "turn:seed",
      objective: "Reflect local Minecraft world state into Stage Play.",
      preset: "minecraft_run_monitor",
      room_id: roomId,
      source_ids: ["source:minecraft-server"],
      now: "2026-06-02T12:20:00.000Z",
    }).environment;

    const snapshot = normalizeEnvironmentStateSnapshot({
      threadId,
      snapshot: {
        snapshot_id: "snapshot:stage-play-live-env-tool",
        domain: "minecraft",
        domain_adapter: "minecraft.adapter.v1",
        room_id: roomId,
        world_id: "minecraft:overworld",
        source_id: "source:minecraft-server",
        actor_id: "player:datdampig",
        actor_label: "DatDamPig",
        ts: "2026-06-02T12:20:01.000Z",
        actor_state: {
          pose: { position: { x: 1, y: 64, z: 1 } },
        },
        local_map: {
          radius: 3,
          salient_cells: [
            {
              cell_ref: "cell:walkable",
              cell_type: "minecraft:grass_block",
              position: { x: 1, y: 63, z: 2 },
              tags: ["walkable", "traversable"],
            },
          ],
          map_hash: "local-map",
          changed_since_last_snapshot: true,
        },
        chunk_snapshot_summary: {
          sampled_radius_chunks: 1,
          loaded_chunks_sampled: 1,
          surface_cells: [
            { cell_ref: "cell:surface", cell_type: "minecraft:grass_block", tags: ["walkable"] },
          ],
          route_corridor_cells: [],
          gateway_blocks: [],
          bridge_like_blocks: [],
          hazard_cells: [
            { cell_ref: "cell:drop", cell_type: "minecraft:air", tags: ["void_or_drop_risk"] },
          ],
          map_hash: "chunk-map",
          changed_since_last_snapshot: true,
          raw_chunk_included: false,
        },
        changed_sections: ["actor_state", "local_map", "chunk_snapshot_summary"],
        section_hashes: {
          actor_state: "actor",
          local_map: "local-map",
          chunk_snapshot_summary: "chunk-map",
        },
        evidence_refs: ["evidence:snapshot"],
      },
    });
    expect(snapshot).not.toBeNull();
    ingestEnvironmentStateSnapshot(snapshot!);

    recordLiveSourceObservation({
      schema: "helix.live_source_observation.v1",
      observation_id: "live_source_observation:stage-play-live-env-tool",
      thread_id: threadId,
      room_id: roomId,
      environment_id: environmentId,
      source_id: "source:minecraft-server",
      source_kind: "minecraft_world_events",
      event_kind: "position_update",
      observed_at: "2026-06-02T12:20:02.000Z",
      freshness: { status: "fresh", age_ms: 10 },
      provenance: { adapter: "minecraft.plugin", confidence: "high" },
      compact_summary: "Position update.",
      evidence_refs: ["evidence:observation", snapshot!.snapshot_id],
      assistant_answer: false,
      raw_content_included: false,
    });

    const observation = executeLiveEnvironmentTool({
      tool_name: "live_env.reflect_stage_play_context",
      thread_id: threadId,
      environment_id: environment.environment_id,
      args: {
        room_id: roomId,
        objective: "move forward without stepping into the drop",
      },
    });
    const graph = observation.observation as StagePlayBadgeGraphV1;

    expect(observation).toMatchObject({
      schema: "helix.live_environment_tool_observation.v1",
      tool_name: "live_env.reflect_stage_play_context",
      ok: true,
      assistant_answer: false,
      raw_content_included: false,
      instruction_authority: "none",
      ask_instruction_authority: "none",
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    });
    expect(observation.summary).toMatch(/Built Stage Play Badge Graph with \d+ badge\(s\)/);
    expect(validateStagePlayBadgeGraphV1(graph)).toEqual([]);
    expect(graph.artifactId).toBe("stage_play_badge_graph");
    expect(graph.sourceWindow.latestObservationRefs).toEqual([
      "live_source_observation:stage-play-live-env-tool",
    ]);
    expect(graph.sourceWindow.latestSnapshotRefs).toEqual([
      "snapshot:stage-play-live-env-tool",
    ]);
    expect(graph.summary.badgeCount).toBeGreaterThan(0);
    expect(graph.summary.affordanceCount).toBeGreaterThan(0);
    expect(graph.summary.blockedAffordanceCount).toBeGreaterThan(0);
    expect(observation.evidence_refs).toEqual(expect.arrayContaining([
      "live_source_observation:stage-play-live-env-tool",
      "snapshot:stage-play-live-env-tool",
      "evidence:snapshot",
    ]));
    expect(graph.authority.agent_executable).toBe(false);
    expect(JSON.stringify(observation)).not.toContain("raw_chunk");
    expect(JSON.stringify(observation)).not.toContain("raw_user_text");
  });
});
