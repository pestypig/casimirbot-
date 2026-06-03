import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { planRouter } from "../routes/agi.plan";
import { resetLiveSourceObservationStoreForTest } from "../services/live-source/live-source-observation-store";
import {
  createLiveAnswerEnvironment,
  resetLiveAnswerEnvironments,
} from "../services/situation-room/live-answer-environment-store";
import {
  resetLiveSourceChunkBufferForTest,
  upsertLiveSourceProducer,
} from "../services/situation-room/live-source-chunk-buffer";
import {
  resetLiveSourceDescriptorsForTest,
  upsertLiveSourceDescriptor,
} from "../services/situation-room/live-source-descriptor-builder";
import { classifyLiveSourceContinuationIntent } from "../services/helix-ask/live-source-continuation-intent";
import { STAGE_PLAY_LIVE_ANSWER_LINE_SCHEMA } from "../services/stage-play/stage-play-output-lane-reducer";

const threadId = "helix-ask:desktop";
const roomId = "room:stage-play-routing";
const sourceId = "source:stage-play-visual-tab";

const createApp = (): express.Express => {
  const app = express();
  app.use(express.json({ limit: "2mb" }));
  app.use("/api/agi", planRouter);
  return app;
};

beforeEach(() => {
  resetLiveAnswerEnvironments();
  resetLiveSourceObservationStoreForTest();
  resetLiveSourceDescriptorsForTest();
  resetLiveSourceChunkBufferForTest();
});

describe("Helix Ask Stage Play routing", () => {
  it("keeps Stage Play reflection prompts out of live source continuation", () => {
    expect(
      classifyLiveSourceContinuationIntent(
        "Use the active Stage Play Badge Graph for the current visual source. Reflect the source, project/update Live Answer from Stage Play, and tell me what evidence is still missing before this can become a model-reviewed answer snapshot.",
      ),
    ).toBeNull();
  });

  it("keeps explicit Stage Play capture cadence prompts on live source control", () => {
    const intent = classifyLiveSourceContinuationIntent(
      "Start Stage Play visual capture every 10 seconds.",
    );

    expect(intent).toMatchObject({
      kind: "live_pipeline_control",
      requested_rate_ms: 10_000,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("prefers reflect_stage_play_context over generic visual Live Answer setup", async () => {
    const { environment } = createLiveAnswerEnvironment({
      thread_id: threadId,
      created_turn_id: "turn:seed-stage-play-routing",
      objective: "Project Stage Play graph into Live Answer.",
      preset: "custom",
      room_id: roomId,
      source_ids: [sourceId],
      line_schema: STAGE_PLAY_LIVE_ANSWER_LINE_SCHEMA,
      now: "2026-06-02T12:30:00.000Z",
    });
    upsertLiveSourceDescriptor({
      source_id: sourceId,
      thread_id: threadId,
      environment_id: environment.environment_id,
      modality: "visual_frame",
      user_label: "Browser tab visual",
      serving_context: {
        surface: "browser_tab",
        source_origin: "browser_getDisplayMedia",
        app_hint: "Chrome",
      },
      current_state: "active_interval",
      cadence_ms: 10000,
      latest_observation_refs: ["visual_observation:stage-play-routing"],
    });
    upsertLiveSourceProducer({
      sourceId,
      threadId,
      modality: "visual_frame",
      status: "active",
      cadenceMs: 10000,
      captureMode: "interval",
      latestChunkId: "live_source_chunk:stage-play-routing",
      now: "2026-06-02T12:30:01.000Z",
    });

    const response = await request(createApp())
      .post("/api/agi/ask/turn")
      .send({
        question:
          "Use the active Stage Play Badge Graph for the current visual source. Reflect the source, project/update Live Answer from Stage Play, and tell me what evidence is still missing before this can become a model-reviewed answer snapshot.",
        sessionId: threadId,
        debug: true,
      })
      .expect(200);

    const routeDebug = JSON.stringify({
      route: response.body?.route_reason_code,
      canonical: response.body?.canonical_goal_frame,
      sourceTarget: response.body?.source_target_intent,
      selectedAction: response.body?.selected_action,
      workstationPlan: response.body?.workstation_tool_plan,
      actionEnvelope: response.body?.action_envelope,
      answer: response.body?.answer,
    }, null, 2);

    expect(response.body?.canonical_goal_frame, routeDebug).toMatchObject({
      goal_kind: "live_environment_review",
      required_terminal_kind: "direct_answer_text",
    });
    expect(response.body?.route_reason_code, routeDebug).not.toBe("live_source_continuation");
    expect(response.body?.live_source_continuation_intent, routeDebug).toBeFalsy();
    expect(response.body?.source_target_intent).toMatchObject({
      target_source: "live_environment",
      target_kind: "live_environment",
      must_enter_backend_ask: true,
      allow_client_shortcut: false,
      allow_no_tool_direct: false,
    });
    expect(response.body?.route_product_contract).toMatchObject({
      source_target: "live_environment",
      precedence_reason: "live_environment_source_target_requires_tool_observation_then_model_synthesis",
    });
    expect(response.body?.available_capabilities?.recommended_capability_key).toBe("live_env.reflect_stage_play_context");
    expect(response.body?.agent_runtime_loop?.iterations?.some((iteration: any) =>
      iteration?.chosen_capability === "live_env.reflect_stage_play_context"
    )).toBe(true);
    const dynamicToolActionNames = response.body?.current_turn_artifact_ledger
      ?.filter((artifact: any) => artifact?.kind === "dynamic_tool_call")
      ?.map((artifact: any) => artifact?.payload?.tool_action_name ?? artifact?.payload?.action_name ?? artifact?.payload?.name)
      ?? [];
    expect(dynamicToolActionNames, routeDebug).not.toContain("situation-room.pipeline.compose");
    expect(dynamicToolActionNames, routeDebug).not.toContain("situation-room.pipeline.execute");

    const liveToolArtifact = response.body?.current_turn_artifact_ledger?.find((artifact: any) =>
      artifact?.kind === "live_environment_tool_observation" &&
      artifact?.payload?.tool_name === "live_env.reflect_stage_play_context"
    );
    expect(liveToolArtifact?.payload?.observation).toMatchObject({
      schema: "stage_play_reflection_result/v1",
      graph: { artifactId: "stage_play_badge_graph" },
      outputLaneProjection: { artifactId: "stage_play_output_lane_projection" },
      liveAnswerProjection: {
        attempted: true,
        projected: true,
      },
      assistant_answer: false,
      raw_content_included: false,
      context_role: "tool_evidence",
    });
    expect(liveToolArtifact.payload.observation.liveAnswerProjection.changedLineKeys.length).toBeGreaterThan(0);
    expect(response.body?.answer).toContain("Stage Play reflected the live source into the badge graph");
    expect(response.body?.answer).toContain("Live Answer line");
    expect(response.body?.answer).toContain("post-observation summary");
    expect(response.body?.answer).not.toContain("\"artifactId\":\"stage_play_badge_graph\"");
    expect(["direct_answer_text", "model_synthesized_answer"]).toContain(response.body?.terminal_artifact_kind);
    expect(response.body?.final_answer_source).toMatch(/universal_composer|final_answer_draft|artifact_synthesis/);
  }, 60_000);
});
