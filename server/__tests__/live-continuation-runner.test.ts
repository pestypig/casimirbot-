import { beforeEach, describe, expect, it } from "vitest";
import type { HelixWorldEvent } from "@shared/helix-world-event";
import type { WorldEventIngestResult } from "../services/situation-room/world-event-ingest";
import {
  resetLiveContinuationJobsForTest,
  upsertLiveContinuationJob,
} from "../services/situation-room/live-continuation-job-store";
import {
  getLiveContinuationRunDebugForTest,
  resetLiveContinuationRunnerForTest,
  runLiveContinuationTick,
} from "../services/situation-room/live-continuation-runner";

const minecraftEvent = (overrides: Partial<HelixWorldEvent> = {}): HelixWorldEvent => ({
  schema: "helix.world_event.v1",
  world_id: "world:overworld",
  room_id: "room:overworld",
  source_id: "source:paper",
  ts: "2026-06-02T02:20:00.000Z",
  actor_id: "player:dan",
  actor_label: "Dan",
  event_type: "player_damage",
  location: { x: 10, y: 52, z: -8, light: 4 },
  health_delta: { from: 12, to: 7, reason: "hostile damage near lava" },
  entities: [{ type: "zombie", distance: 4 }],
  evidence_refs: ["world-event:event:damage"],
  meta: { server_id: "server:paper", profile_id: "profile:dan" },
  ...overrides,
});

const ingestResult = (event: HelixWorldEvent, overrides: Partial<WorldEventIngestResult> = {}): WorldEventIngestResult => ({
  ok: true,
  schema: "helix.world_event_ingest_response.v1",
  appended: true,
  signal_id: "signal:damage",
  salience_receipt_id: "salience:damage",
  projection_id: "projection:damage",
  goal_hypothesis_ids: ["goal:risk"],
  thread_id: "thread:minecraft",
  message: "World event ingested.",
  event_type: event.event_type,
  append_candidate: {
    event,
    eventId: "event:damage",
    threadId: "thread:minecraft",
    roomId: event.room_id,
    worldId: event.world_id,
    sourceId: event.source_id ?? null,
    observationRef: { event_type: event.event_type },
    salienceReason: "damage near hostile entity",
    saliencePriority: "warn",
    evidenceRefs: ["append-candidate:event:damage"],
  },
  episodes: [
    {
      episode_id: "episode:damage",
      room_id: event.room_id,
      world_id: event.world_id,
      summary: "Player took damage near lava and hostile entity.",
      evidence_refs: ["world-event:event:damage"],
    } as never,
  ],
  ...overrides,
});

describe("live continuation runner", () => {
  beforeEach(() => {
    resetLiveContinuationJobsForTest();
    resetLiveContinuationRunnerForTest();
  });

  it("runs deterministic single-agent lanes for a salient Minecraft world event", async () => {
    const job = upsertLiveContinuationJob({
      thread_id: "thread:minecraft",
      room_id: "room:overworld",
      environment_id: "env:minecraft",
      contract_id: "contract:live",
      source_ids: ["source:paper"],
      objective: "Watch my Minecraft run and flag danger or progress.",
      voice_policy: "confirm_speak_required",
      now: "2026-06-02T02:19:59.000Z",
    });
    const tick = await runLiveContinuationTick({
      job,
      trigger: "world_event",
      worldEventResult: ingestResult(minecraftEvent()),
      now: "2026-06-02T02:20:01.000Z",
    });
    const debug = getLiveContinuationRunDebugForTest(tick.tick_id);

    expect(tick).toMatchObject({
      schema: "helix.live_continuation_tick.v1",
      job_id: job.job_id,
      thread_id: "thread:minecraft",
      room_id: "room:overworld",
      trigger: "world_event",
      status: "completed",
      selected_lanes: expect.arrayContaining([
        "source_health",
        "world_state",
        "risk_watch",
        "route_watch",
        "prediction_reflection",
        "voice_gate",
      ]),
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
      post_tool_model_step_required: true,
      context_role: "receipt_not_assistant_answer",
    });
    expect(debug?.admission).toMatchObject({
      source_kind: "minecraft_world_events",
      transport: "cloudflarelink",
      trust_level: "admitted_live_source",
      assistant_answer: false,
      terminal_eligible: false,
    });
    expect(debug?.observation).toMatchObject({
      schema: "helix.live_source_event_observation.v1",
      event_type: "player_damage",
      context_role: "observation_not_assistant_answer",
      post_tool_model_step_required: true,
    });
    expect(debug?.workers.find((worker) => worker.lane === "prediction_reflection")).toMatchObject({
      context_role: "hypothesis_not_assistant_answer",
      hypotheses: [expect.objectContaining({ confidence: expect.any(Number) })],
      assistant_answer: false,
    });
    expect(debug?.goal).toMatchObject({
      schema: "helix.goal_evaluation_receipt.v1",
      status: "needs_more_observation",
      context_role: "receipt_not_assistant_answer",
    });
    expect(debug?.callout).toMatchObject({
      schema: "helix.callout_candidate.v1",
      callout_intent: "warning",
      requires_confirmation: true,
      assistant_answer: false,
      terminal_eligible: false,
    });
  });

  it("suppresses ticks for paused jobs instead of spawning another chat", async () => {
    const job = upsertLiveContinuationJob({
      thread_id: "thread:minecraft",
      room_id: "room:overworld",
      source_ids: ["source:paper"],
      objective: "Watch my Minecraft run.",
      status: "paused",
    });

    const tick = await runLiveContinuationTick({
      job,
      trigger: "world_event",
      worldEventResult: ingestResult(minecraftEvent()),
      now: "2026-06-02T02:20:01.000Z",
    });

    expect(tick.status).toBe("suppressed");
    expect(tick.selected_lanes).toEqual([]);
    expect(tick.worker_receipt_refs).toEqual([]);
    expect(tick.next_step).toBe("silent");
  });

  it("blocks source-mismatched events fail-closed through source admission", async () => {
    const job = upsertLiveContinuationJob({
      thread_id: "thread:minecraft",
      room_id: "room:overworld",
      source_ids: ["source:paper"],
      objective: "Watch my Minecraft run.",
    });
    const event = minecraftEvent({ source_id: "source:other" });
    const tick = await runLiveContinuationTick({
      job,
      trigger: "world_event",
      worldEventResult: ingestResult(event),
      now: "2026-06-02T02:20:01.000Z",
    });
    const debug = getLiveContinuationRunDebugForTest(tick.tick_id);

    expect(tick.status).toBe("blocked");
    expect(tick.selected_lanes).toEqual([]);
    expect(tick.next_step).toBe("fail_closed");
    expect(debug?.admission.trust_level).toBe("blocked");
    expect(debug?.goal.status).toBe("fail_closed");
  });
});
