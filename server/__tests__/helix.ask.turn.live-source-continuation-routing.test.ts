import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { composeLiveSourcePipelinePlan } from "../services/helix-ask/live-source-pipeline-composer";
import {
  executeLiveSourcePipelinePlan,
  resetLiveSourcePipelinesForTest,
} from "../services/helix-ask/live-source-pipeline-executor";
import { resetLiveSourceChunkBufferForTest } from "../services/situation-room/live-source-chunk-buffer";
import { resetLiveAnswerEnvironments } from "../services/situation-room/live-answer-environment-store";
import { resetLiveWorkerLanesForTest } from "../services/situation-room/live-worker-lane-store";
import { resetLivePipelineLifecycleForTest } from "../services/situation-room/live-pipeline-lifecycle-store";
import { resetSituationSourceCapabilitiesForTest } from "../services/situation-room/situation-source-capability-store";
import { resetVisualSnapshotStoreForTest } from "../services/situation-room/visual-snapshot-store";

const threadId = "thread:live-source-continuation";

const createApp = async (): Promise<express.Express> => {
  const { planRouter } = await import("../routes/agi.plan");
  const app = express();
  app.use(express.json({ limit: "2mb" }));
  app.use("/api/agi", planRouter);
  return app;
};

describe("live source continuation Ask routing", () => {
  beforeEach(() => {
    resetLiveSourcePipelinesForTest();
    resetLiveSourceChunkBufferForTest();
    resetLiveAnswerEnvironments();
    resetLiveWorkerLanesForTest();
    resetLivePipelineLifecycleForTest();
    resetSituationSourceCapabilitiesForTest();
    resetVisualSnapshotStoreForTest();
  });

  it("routes keep-checking-screen prompts to live pipeline setup instead of model-only", async () => {
    const app = await createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        sessionId: threadId,
        question: "ok can you keep checking my screen as a live answer?",
        debug: true,
      })
      .expect(200);

    expect(response.body?.route_reason_code).toBe("live_source_continuation");
    expect(response.body?.route_reason_code).not.toBe("conversation:simple");
    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("live_source_continuation");
    expect(response.body?.canonical_goal_frame?.allows_workspace_context).toBe(true);
    expect(response.body?.canonical_goal_frame?.allows_prior_artifacts).toBe(true);
    expect(response.body?.canonical_goal_frame?.required_terminal_kind).toBe("live_pipeline_receipt");
    expect(response.body?.final_answer_source).toBe("live_pipeline_receipt");
    expect(response.body?.pipeline_plan_id).toMatch(/^live_source_pipeline_plan:/);
    expect(response.body?.pipeline_receipt_id).toMatch(/^live_source_pipeline_receipt:/);
    expect(response.body?.live_runtime_context?.suggested_action).toBeTruthy();
    expect(response.body?.terminal_answer_authority?.server_authoritative).toBe(true);
    expect(response.body?.poison_audit?.ok).toBe(true);

    const debug = await request(app)
      .get(`/api/agi/ask/turn/${encodeURIComponent(response.body.turn_id)}/debug-export`)
      .expect(200);
    expect(debug.body?.payload?.canonical_goal_frame?.goal_kind).toBe("live_source_continuation");
    expect(debug.body?.payload?.live_runtime_context?.suggested_action).toBeTruthy();
    expect(debug.body?.payload?.pipeline_plan_id).toBe(response.body?.pipeline_plan_id);
    expect(debug.body?.payload?.pipeline_receipt_id).toBe(response.body?.pipeline_receipt_id);
    expect(debug.body?.payload?.terminal_answer_authority?.server_authoritative).toBe(true);
  }, 10_000);

  it("inspects or repairs an existing live pipeline for continuation prompts", async () => {
    const plan = composeLiveSourcePipelinePlan({
      threadId,
      objective: "Watch this screen as a live answer.",
    });
    const { receipt } = executeLiveSourcePipelinePlan(plan);
    const app = await createApp();

    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        sessionId: threadId,
        question: "why is the visual source not updating?",
        debug: true,
      })
      .expect(200);

    expect(response.body?.route_reason_code).toBe("live_pipeline_inspect");
    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("live_pipeline_inspect");
    expect(response.body?.live_runtime_context?.active_pipeline_id).toBe(receipt.pipeline_id);
    expect(response.body?.pipeline_dashboard?.pipeline_id).toBe(receipt.pipeline_id);
    expect(response.body?.final_answer_source).toBe("live_pipeline_receipt");
    expect(response.body?.poison_audit?.assistant_history_projection_count).toBe(0);
  });

  it("does not hijack unrelated model-only science questions", async () => {
    const app = await createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        sessionId: threadId,
        question: "what is a neutron star glitch?",
        debug: true,
      })
      .expect(200);

    expect(response.body?.route_reason_code).not.toMatch(/^live_/);
    expect(response.body?.canonical_goal_frame?.goal_kind).not.toMatch(/^live_/);
  });
});
