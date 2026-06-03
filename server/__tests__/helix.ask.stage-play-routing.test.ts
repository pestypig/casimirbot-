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
import { evaluateTerminalBoundaryEligibility } from "../services/helix-ask/runtime-authority-contract";
import { buildStagePlayGraphFromWorld } from "../services/stage-play/stage-play-badge-graph-builder";
import { resetStagePlayAskCheckpointReceiptsForTest } from "../services/stage-play/stage-play-ask-checkpoint-store";
import { resetStagePlayCheckpointQueueForTest } from "../services/stage-play/stage-play-checkpoint-queue";

const threadId = "helix-ask:desktop";
const roomId = "room:stage-play-routing";
const sourceId = "visual_source:stage_play_visual_tab";

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
  resetStagePlayAskCheckpointReceiptsForTest();
  resetStagePlayCheckpointQueueForTest();
});

describe("Helix Ask Stage Play routing", () => {
  it("keeps Stage Play reflection prompts out of live source continuation", () => {
    expect(
      classifyLiveSourceContinuationIntent(
        "Use the active Stage Play Badge Graph for the current visual source. Reflect the source, project/update Live Answer from Stage Play, and tell me what evidence is still missing before this can become a model-reviewed answer snapshot.",
      ),
    ).toBeNull();
    expect(
      classifyLiveSourceContinuationIntent(
        "Use the routed visual source in narrative_stage_play to predict next scene and show checkpoint freshness for the live interpretation.",
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

  it("plans a Stage Play visual prediction job instead of treating attach as live-source control", async () => {
    const response = await request(createApp())
      .post("/api/agi/ask/turn")
      .send({
        question:
          "I'm about to attach a YouTube tab and I want you to predict what happens next based on visual capture.",
        sessionId: threadId,
        debug: true,
      })
      .expect(200);

    const routeDebug = JSON.stringify({
      route: response.body?.route_reason_code,
      canonical: response.body?.canonical_goal_frame,
      sourceTarget: response.body?.source_target_intent,
      selectedAction: response.body?.selected_action,
      answer: response.body?.answer,
      finalAnswerSource: response.body?.final_answer_source,
      terminalArtifactKind: response.body?.terminal_artifact_kind,
      terminalErrorCode: response.body?.terminal_error_code,
      routeProductContract: response.body?.route_product_contract,
      terminalArtifactSelectionGuard: response.body?.terminal_artifact_selection_guard,
      finalRouteReconciliation: response.body?.final_route_reconciliation,
      solverControllerDecision: response.body?.solver_controller_decision,
      runtimeLoop: response.body?.agent_runtime_loop,
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
    expect(response.body?.available_capabilities?.recommended_capability_key).toBe("live_env.plan_stage_play_job");
    expect(response.body?.agent_runtime_loop?.iterations?.some((iteration: any) =>
      iteration?.chosen_capability === "live_env.plan_stage_play_job"
    )).toBe(true);
    const liveToolArtifact = response.body?.current_turn_artifact_ledger?.find((artifact: any) =>
      artifact?.kind === "live_environment_tool_observation" &&
      artifact?.payload?.tool_name === "live_env.plan_stage_play_job"
    );
    expect(liveToolArtifact?.payload?.observation).toMatchObject({
      artifactId: "stage_play_job_plan",
      schemaVersion: "stage_play_job_plan/v1",
      domain: "narrative_media",
      assistant_answer: false,
      context_role: "tool_evidence",
    });
    expect(liveToolArtifact.payload.observation.requiredSources).toEqual(expect.arrayContaining([
      expect.objectContaining({
        modality: "visual_frame",
        required: true,
        routeTo: "narrative_stage_play",
      }),
      expect.objectContaining({
        modality: "audio_transcript",
        required: false,
        routeTo: "narrative_stage_play",
      }),
    ]));
    expect(response.body?.answer).toContain("Stage Play job planned");
    expect(response.body?.answer).toContain("Needed: Browser tab visual source");
    expect(response.body?.answer).toContain("Optional: Optional audio transcript source");
    expect(response.body?.answer).toContain("did not start capture");
    expect(response.body?.answer).not.toContain("\"artifactId\":\"stage_play_job_plan\"");
    expect(response.body?.final_answer_source).not.toBe("typed_failure");
    expect(response.body?.final_answer_source).not.toBe("live_pipeline_receipt");
    expect(response.body?.terminal_artifact_kind).not.toBe("live_pipeline_receipt");
    const boundaryReport = evaluateTerminalBoundaryEligibility(response.body as Record<string, unknown>);
    expect(boundaryReport.checks.agent_runtime_loop).toBe(true);
    expect(boundaryReport.checks.agent_step_decision).toBe(true);
    expect(boundaryReport.checks.selected_capability_observation).toBe(true);
    expect(boundaryReport.checks.post_observation_model_decision).toBe(true);
    expect(boundaryReport.eligible).toBe(true);
  }, 60_000);

  it("routes Stage Play checkpoint requests to the checkpoint queue tool", async () => {
    const response = await request(createApp())
      .post("/api/agi/ask/turn")
      .send({
        question:
          "Request a Stage Play checkpoint for the active graph so Helix Ask can produce the next model-reviewed answer snapshot.",
        sessionId: threadId,
        debug: true,
      })
      .expect(200);

    const routeDebug = JSON.stringify({
      route: response.body?.route_reason_code,
      canonical: response.body?.canonical_goal_frame,
      sourceTarget: response.body?.source_target_intent,
      selectedAction: response.body?.selected_action,
      answer: response.body?.answer,
      finalAnswerSource: response.body?.final_answer_source,
      terminalArtifactKind: response.body?.terminal_artifact_kind,
      terminalErrorCode: response.body?.terminal_error_code,
      productAuthorityGuard: response.body?.product_authority_guard,
      finalRouteReconciliation: response.body?.final_route_reconciliation,
      solverControllerDecision: response.body?.solver_controller_decision,
      runtimeLoop: response.body?.agent_runtime_loop,
    }, null, 2);

    expect(
      classifyLiveSourceContinuationIntent(
        "Request a Stage Play checkpoint for the active graph so Helix Ask can produce the next model-reviewed answer snapshot.",
      ),
    ).toBeNull();
    expect(response.body?.canonical_goal_frame, routeDebug).toMatchObject({
      goal_kind: "live_environment_review",
      required_terminal_kind: "model_synthesized_answer",
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
    expect(response.body?.available_capabilities?.recommended_capability_key).toBe("live_env.request_stage_play_checkpoint");
    expect(response.body?.agent_runtime_loop?.iterations?.some((iteration: any) =>
      iteration?.chosen_capability === "live_env.request_stage_play_checkpoint"
    )).toBe(true);
    const liveToolArtifact = response.body?.current_turn_artifact_ledger?.find((artifact: any) =>
      artifact?.kind === "live_environment_tool_observation" &&
      artifact?.payload?.tool_name === "live_env.request_stage_play_checkpoint"
    );
    expect(liveToolArtifact?.payload?.observation).toMatchObject({
      schema: "stage_play_checkpoint_request_result/v1",
      checkpointRequest: {
        artifactId: "stage_play_checkpoint_request",
        schemaVersion: "stage_play_checkpoint_request/v1",
        status: "queued",
        assistant_answer: false,
        context_role: "tool_evidence",
      },
      queueState: {
        schema: "stage_play_checkpoint_queue/v1",
        assistant_answer: false,
        context_role: "tool_evidence",
      },
      assistant_answer: false,
      context_role: "tool_evidence",
    });
    expect(liveToolArtifact.payload.observation.queueState.requests).toEqual(expect.arrayContaining([
      expect.objectContaining({
        artifactId: "stage_play_checkpoint_request",
        schemaVersion: "stage_play_checkpoint_request/v1",
        status: "queued",
        assistant_answer: false,
        context_role: "tool_evidence",
      }),
    ]));
    expect(response.body?.answer, routeDebug).toContain("Stage Play checkpoint request queued");
    expect(response.body?.answer, routeDebug).toContain("tool evidence only");
    expect(response.body?.answer, routeDebug).toContain("did not produce the final answer snapshot");
    expect(response.body?.answer).not.toContain("\"schema\":\"stage_play_checkpoint_request_result/v1\"");
    expect(response.body?.final_answer_source).not.toBe("typed_failure");
    expect(response.body?.final_answer_source).not.toBe("live_pipeline_receipt");
    expect(response.body?.final_answer_source).not.toBe("live_environment_tool_observation");
    expect(response.body?.terminal_artifact_kind).not.toBe("live_environment_tool_observation");
    const boundaryReport = evaluateTerminalBoundaryEligibility(response.body as Record<string, unknown>);
    expect(boundaryReport.checks.agent_runtime_loop).toBe(true);
    expect(boundaryReport.checks.agent_step_decision).toBe(true);
    expect(boundaryReport.checks.selected_capability_observation).toBe(true);
    expect(boundaryReport.checks.post_observation_model_decision).toBe(true);
    expect(boundaryReport.eligible).toBe(true);
  }, 60_000);

  it("prefers reflect_stage_play_context over generic visual Live Answer setup", async () => {
    const { environment } = createLiveAnswerEnvironment({
      thread_id: threadId,
      created_turn_id: "turn:seed-stage-play-routing",
      objective: "Project Stage Play graph into Live Interpretation.",
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
        question: [
          "Use the Stage Play reflection capability live_env.reflect_stage_play_context.",
          "Reflect the active Stage Play Badge Graph and project the current Live Interpretation.",
          "Stage Play checkpoint handle: stage_play_checkpoint_request:ui-handoff.",
          "Stage Play graph handle: stage_play_badge_graph:ui-handoff.",
          "Stage Play evidence handles: live_source_descriptor:stage-play-routing, live_source_producer:stage-play-routing, visual_observation:stage-play-routing.",
          "Checkpoint focus: Given the first usable Stage Play observation, what checkpoint answer should be summarized for the active visual evidence?",
          "Report checkpoint freshness, missing evidence, and whether a current model-reviewed Answer Snapshot exists after the reflection.",
          "Leave visual/audio capture cadence unchanged.",
        ].join("\n"),
        sessionId: threadId,
        workspace_context_snapshot: {
          visual_context_capability: {
            status: "error",
            evidence_available: false,
            error: "visual capture evidence is unavailable",
          },
        },
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
      capabilityPlan: response.body?.capability_plan,
      capabilityResult: response.body?.capability_result,
      capabilityLifecycleLedger: response.body?.capability_lifecycle_ledger,
      solverControllerDecision: response.body?.solver_controller_decision,
      goalSatisfaction: response.body?.goal_satisfaction_evaluation,
      terminalAuthority: response.body?.terminal_answer_authority,
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
    expect(liveToolArtifact.payload.observation.debugReceipt).toMatchObject({
      schema: "stage_play_tool_receipt_debug/v1",
      toolName: "live_env.reflect_stage_play_context",
      graphId: expect.stringContaining("stage_play_badge_graph:"),
      sourceRefs: expect.arrayContaining([
        expect.stringMatching(/live_source_descriptor|live_source_producer|visual_observation|live_source_chunk/),
      ]),
      visualSourceStatus: expect.arrayContaining([
        expect.objectContaining({
          sourceId,
          modality: "visual_frame",
          status: "active",
          selectedForStagePlay: true,
          routeTo: expect.any(String),
        }),
      ]),
      outputProjectionKeys: expect.arrayContaining(["risk", "possibilities", "unknowns", "next_check"]),
      checkpointFreshness: expect.objectContaining({
        reason: "no_checkpoint",
        modelReviewed: false,
        fresh: false,
      }),
      checkpointRequestId: expect.any(String),
      assistant_answer: false,
      context_role: "tool_evidence",
    });
    expect(liveToolArtifact.payload.observation.liveAnswerProjection.changedLineKeys).toEqual(
      expect.arrayContaining(["risk", "possibilities", "unknowns", "next_check"]),
    );
    expect(response.body?.answer, routeDebug).toContain("Stage Play tool receipt: live_env.reflect_stage_play_context");
    expect(response.body?.answer).toContain("visual source status:");
    expect(response.body?.answer).toContain(`${sourceId} active`);
    expect(response.body?.answer).not.toContain("no visual source status reported");
    expect(response.body?.answer).toContain("Source refs:");
    expect(response.body?.answer).toContain("output projection keys:");
    expect(response.body?.answer).toContain("checkpoint freshness: no_checkpoint");
    expect(response.body?.answer).toContain("Visual evidence exists in Stage Play, but no current model-reviewed checkpoint has consumed it yet.");
    expect(response.body?.answer).toContain("Stage Play reflected the active visual source");
    expect(response.body?.answer).toContain("projected risk, possibilities, unknowns, and next_check as Live Interpretation");
    expect(response.body?.answer).toContain("audio/transcript grounding");
    expect(response.body?.answer).toContain("user objective/prediction target");
    expect(response.body?.answer).toContain("post-observation synthesis");
    expect(response.body?.answer).not.toContain("visual capture evidence is unavailable");
    expect(response.body?.terminal_error_code).not.toBe("visual_evidence_missing");
    expect(response.body?.answer).not.toContain("\"artifactId\":\"stage_play_badge_graph\"");
    expect(response.body?.final_answer_source).not.toBe("typed_failure");
    expect(response.body?.final_answer_source).not.toBe("live_pipeline_receipt");
    expect(response.body?.final_answer_source).not.toBe("panel_generated_answer");
    expect(response.body?.final_answer_source).not.toBe("client_projection");
    expect(response.body?.terminal_artifact_kind).not.toBe("live_pipeline_receipt");
    expect(response.body?.terminal_artifact_kind).not.toBe("typed_failure");
    expect(response.body?.stage_play_checkpoint_queue_completion).toMatchObject({
      request: expect.objectContaining({
        checkpointRequestId: liveToolArtifact.payload.observation.debugReceipt.checkpointRequestId,
        status: "completed",
      }),
    });
    const boundaryReport = evaluateTerminalBoundaryEligibility(response.body as Record<string, unknown>);
    expect(boundaryReport.checks.agent_runtime_loop).toBe(true);
    expect(boundaryReport.checks.agent_step_decision).toBe(true);
    expect(boundaryReport.checks.selected_capability_observation).toBe(true);
    expect(boundaryReport.checks.post_observation_model_decision).toBe(true);
    expect(boundaryReport.eligible).toBe(true);

    const refreshedGraph = buildStagePlayGraphFromWorld({
      threadId,
      roomId,
      environmentId: environment.environment_id,
      now: new Date("2026-06-02T12:30:03.000Z"),
    });
    expect(refreshedGraph.badges.find((badge) => badge.id === "helix_ask.checkpoint.latest")).toMatchObject({
      status: "observed",
      checkpoint: expect.objectContaining({
        askTurnId: expect.any(String),
        solverTraceRef: expect.stringContaining("ask_turn_solver_trace"),
        terminalArtifactKind: expect.stringMatching(/model_synthesized_answer|direct_answer_text/),
        finalAnswerSource: "final_answer_draft",
        modelReviewed: true,
      }),
    });
    expect(refreshedGraph.badges.find((badge) => badge.id === "answer_snapshot.latest")).toMatchObject({
      status: "observed",
      output: expect.objectContaining({
        state: "model_reviewed",
        text: expect.stringContaining("Stage Play reflected the active visual source"),
      }),
    });
    expect(refreshedGraph.badges.find((badge) => badge.id === "live_output.current")).toMatchObject({
      status: "observed",
      output: expect.objectContaining({
        state: "model_reviewed",
        voiceEligible: false,
      }),
    });
  }, 60_000);
});
