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
  getLiveAnswerEnvironment,
  resetLiveAnswerEnvironments,
} from "../services/situation-room/live-answer-environment-store";
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
  resetLiveSourceDescriptorsForTest();
  resetLiveSourceChunkBufferForTest();
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
        tool_id: "live_env.describe_stage_builder",
        family: "live_env",
        creates_assistant_answer: false,
        can_run_automatically: true,
      }),
      expect.objectContaining({
        tool_id: "live_env.query_stage_sources",
        family: "live_env",
        creates_assistant_answer: false,
        can_run_automatically: true,
      }),
      expect.objectContaining({
        tool_id: "live_env.draft_stage_play_graph",
        family: "live_env",
        creates_assistant_answer: false,
        can_run_automatically: true,
      }),
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

  it("lets the model work through Stage Builder grammar, sources, and draft validation", () => {
    const environment = createLiveAnswerEnvironment({
      thread_id: threadId,
      created_turn_id: "turn:seed",
      objective: "Build a model-driven Stage Play graph.",
      preset: "narrative_scene_monitor",
      room_id: roomId,
      source_ids: ["source:visual-tab"],
      now: "2026-06-02T12:19:00.000Z",
    }).environment;
    const descriptor = upsertLiveSourceDescriptor({
      source_id: "source:visual-tab",
      thread_id: threadId,
      environment_id: environment.environment_id,
      modality: "visual_frame",
      user_label: "Visual tab",
      serving_context: {
        surface: "browser_tab",
        source_origin: "browser_getDisplayMedia",
        app_hint: "Chrome",
      },
      current_state: "active_interval",
      cadence_ms: 10000,
      latest_observation_refs: ["visual_observation:stage-builder"],
    });
    const producer = upsertLiveSourceProducer({
      sourceId: "source:visual-tab",
      threadId,
      modality: "visual_frame",
      status: "active",
      cadenceMs: 10000,
      captureMode: "interval",
      latestChunkId: "live_source_chunk:stage-builder",
      now: "2026-06-02T12:19:01.000Z",
    });

    const catalogObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.describe_stage_builder",
      thread_id: threadId,
      environment_id: environment.environment_id,
    });
    expect(catalogObservation).toMatchObject({
      tool_name: "live_env.describe_stage_builder",
      ok: true,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(JSON.stringify(catalogObservation.observation)).toContain("stage_play_builder_catalog/v1");
    expect(JSON.stringify(catalogObservation.observation)).toContain("source");
    expect(JSON.stringify(catalogObservation.observation)).toContain("interpreter");

    const sourceObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.query_stage_sources",
      thread_id: threadId,
      environment_id: environment.environment_id,
    });
    expect(sourceObservation.observation).toMatchObject({
      artifactId: "stage_play_source_query",
      sourceHandles: [
        expect.objectContaining({
          sourceId: "source:visual-tab",
          sourceClass: "visual_frame",
          descriptorId: descriptor.descriptor_id,
          producerId: producer.producer_id,
        }),
      ],
    });
    expect(sourceObservation.evidence_refs).toEqual(expect.arrayContaining([
      descriptor.descriptor_id,
      producer.producer_id,
      "visual_observation:stage-builder",
      "live_source_chunk:stage-builder",
    ]));

    const draft = {
      objective: "Interpret the current visual scene and predict likely next action.",
      nodes: [
        { id: "source.visual", kind: "source", bind: { sourceClass: "visual_frame", sourceId: "source:visual-tab" } },
        { id: "interpreter.stage", kind: "interpreter", parameters: { tool: "live_env.reflect_stage_play_context" } },
        { id: "actor.primary", kind: "actor" },
        { id: "procedure.next", kind: "procedural_binding" },
      ],
      edges: [
        { from: "source.visual", to: "interpreter.stage", relation: "feeds" },
        { from: "interpreter.stage", to: "actor.primary", relation: "interprets" },
        { from: "actor.primary", to: "procedure.next", relation: "constrains" },
      ],
      checkpointPolicy: {
        cadenceMs: 10000,
        completeEachWindow: true,
        standingJobRemainsOpen: true,
      },
    };

    const draftObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.draft_stage_play_graph",
      thread_id: threadId,
      environment_id: environment.environment_id,
      args: { draft },
    });
    expect(draftObservation).toMatchObject({
      tool_name: "live_env.draft_stage_play_graph",
      ok: true,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(draftObservation.observation).toMatchObject({
      artifactId: "stage_play_graph_draft_validation",
      ok: true,
      resolvedSourceIds: ["source:visual-tab"],
      authority: {
        assistant_answer: false,
        terminal_eligible: false,
        agent_executable: false,
      },
    });

    const rejected = executeLiveEnvironmentTool({
      tool_name: "live_env.validate_stage_play_graph",
      thread_id: threadId,
      environment_id: environment.environment_id,
      args: {
        draft: {
          ...draft,
          nodes: [{ id: "source.bad", kind: "source", bind: { sourceClass: "visual_frame", sourceId: "source:missing" } }],
          edges: [{ from: "source.bad", to: "missing", relation: "feeds" }],
        },
      },
    });
    expect(rejected.ok).toBe(false);
    expect(JSON.stringify(rejected.observation)).toContain("source:missing");
    expect(JSON.stringify(rejected.observation)).not.toMatch(/agent[_ -]?executable\s*[:=]\s*true/i);
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
    upsertLiveSourceDescriptor({
      source_id: "source:minecraft-server",
      thread_id: threadId,
      environment_id: environment.environment_id,
      modality: "world_event",
      user_label: "Minecraft world events",
      serving_context: {
        surface: "game",
        source_origin: "minehut_plugin",
      },
      current_state: "active",
      latest_observation_refs: ["live_source_observation:stage-play-live-env-tool"],
    });
    upsertLiveSourceProducer({
      sourceId: "source:minecraft-server",
      threadId,
      modality: "world_event",
      status: "active",
      captureMode: "push",
      latestChunkId: "live_source_chunk:minecraft-server",
      now: "2026-06-02T12:20:02.500Z",
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
    expect(graph.sourceWindow.latestSourceDescriptorRefs?.length).toBe(1);
    expect(graph.sourceWindow.latestSourceProducerRefs?.length).toBe(1);
    expect(graph.summary.badgeCount).toBeGreaterThan(0);
    expect(graph.summary.affordanceCount).toBeGreaterThan(0);
    expect(graph.summary.blockedAffordanceCount).toBeGreaterThan(0);
    const liveAnswerEnvironment = getLiveAnswerEnvironment(environment.environment_id);
    expect(liveAnswerEnvironment?.lines_by_key?.risk?.value).toMatch(/drop|fall|void|blocked/i);
    expect(liveAnswerEnvironment?.lines_by_key?.possibilities?.value).toMatch(/bridge|retreat|tunnel/i);
    expect(liveAnswerEnvironment?.lines_by_key?.recommendation?.value).toBe(
      "Awaiting rehearsal before recommending action.",
    );
    expect(liveAnswerEnvironment?.latest_evaluation?.model_invoked).toBe(false);
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
