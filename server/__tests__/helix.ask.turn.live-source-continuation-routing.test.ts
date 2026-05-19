import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import {
  WORKSTATION_DYNAMIC_TOOL_ACTIONS,
  WORKSPACE_ACTION_REGISTRY,
} from "@shared/workstation-dynamic-tools";
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
import { resetLiveSourceProducerBindingsForTest } from "../services/situation-room/live-source-producer-binding";
import { resetLiveSourceProducerLifecycleForTest } from "../services/situation-room/live-source-producer-lifecycle-store";
import { resetVisualProducerSchedulerAdoptionsForTest } from "../services/situation-room/visual-producer-scheduler-adoption-store";
import { resetClientCapabilityActionsForTest } from "../services/client-capabilities/client-action-queue";
import { resetClientCapabilityAdoptionsForTest } from "../services/client-capabilities/client-adoption-store";
import { resetReceiptPresentationSnapshotsForTest } from "../services/helix-ask/receipt-presentation-snapshot-store";

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
    resetLiveSourceProducerBindingsForTest();
    resetLiveSourceProducerLifecycleForTest();
    resetVisualProducerSchedulerAdoptionsForTest();
    resetClientCapabilityActionsForTest();
    resetClientCapabilityAdoptionsForTest();
    resetReceiptPresentationSnapshotsForTest();
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
    expect(response.body?.visual_producer_id).toMatch(/^live_source_producer:/);
    expect(response.body?.cadence_ms).toBe(15_000);
    expect(response.body?.producer_binding_status).toBe("bound");
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
    expect(debug.body?.payload?.visual_producer_id).toBe(response.body?.visual_producer_id);
    expect(debug.body?.payload?.cadence_ms).toBe(15_000);
    expect(debug.body?.payload?.terminal_answer_authority?.server_authoritative).toBe(true);
  }, 20_000);

  it("sets requested visual cadence for every-N-seconds continuation prompts", async () => {
    const app = await createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        sessionId: threadId,
        question: "keep checking my screen as a live answer every 10 seconds",
        debug: true,
      })
      .expect(200);

    expect(response.body?.route_reason_code).toBe("live_pipeline_control");
    expect(response.body?.cadence_ms).toBe(10_000);
    expect(response.body?.visual_producer_cadence_receipt?.cadence?.capture_mode).toBe("interval");
    expect(response.body?.visual_producer_cadence_receipt?.cadence?.cadence_ms).toBe(10_000);
    expect(response.body?.visual_producer_cadence_receipt?.cadence?.status).toBe("permission_required");
    expect(response.body?.answer ?? response.body?.text).toContain("every 10 seconds");
  }, 20_000);

  it("routes direct visual interval commands to producer cadence control", async () => {
    const app = await createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        sessionId: threadId,
        question: "ok set the interval to 10 seconds on the visual capture",
        debug: true,
      })
      .expect(200);

    expect(response.body?.route_reason_code).toBe("live_pipeline_control");
    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("live_pipeline_control");
    expect(response.body?.canonical_goal_frame?.allows_workspace_context).toBe(true);
    expect(response.body?.source_target_intent).toMatchObject({
      target_source: "live_pipeline",
      must_enter_backend_ask: true,
      allow_client_shortcut: false,
      allow_no_tool_direct: false,
    });
    expect(response.body?.route_product_contract).toMatchObject({
      schema: "helix.route_product_contract.v1",
      source_target: "live_pipeline",
    });
    expect(response.body?.route_product_contract?.allowed_terminal_artifact_kinds).toContain("live_pipeline_receipt");
    expect(response.body?.route_product_contract?.forbidden_terminal_artifact_kinds).toContain("situation_context_pack");
    expect(response.body?.tool_call_admission_decision).toMatchObject({
      schema: "helix.tool_call_admission_decision.v1",
      source_target: "live_pipeline",
      required: true,
      admitted_tool_families: ["live_pipeline"],
    });
    expect(response.body?.tool_call_admission_decision?.forbidden_terminal_artifact_kinds).toContain("situation_context_pack");
    expect(response.body?.terminal_artifact_selection_guard).toMatchObject({
      schema: "helix.terminal_artifact_selection_guard.v1",
      allowed: true,
      terminal_artifact_kind: "live_pipeline_receipt",
    });
    expect(response.body?.action_id).toBe("situation-room.live-source.set_rate");
    expect(response.body?.cadence_ms).toBe(10_000);
    expect(response.body?.workspace_action_receipt?.action_id).toBe("situation-room.live-source.set_rate");
    expect(response.body?.workspace_action_receipt?.state_observed).toBe(true);
    expect(response.body?.visual_producer_cadence_receipt?.action_id).toBe("situation-room.live-source.set_rate");
    expect(response.body?.visual_producer_cadence_receipt?.cadence?.capture_mode).toBe("interval");
    expect(response.body?.visual_producer_cadence_receipt?.cadence?.cadence_ms).toBe(10_000);
    expect(response.body?.client_action_request?.schema).toBe("helix.client_capability_action.v1");
    expect(response.body?.client_action_request?.capability).toBe("visual_capture");
    expect(response.body?.client_action_request?.action).toBe("request_permission");
    expect(response.body?.client_action_request_ids).toContain(response.body?.client_action_request?.action_request_id);
    expect(response.body?.final_answer_source).toBe("live_pipeline_receipt");
    expect(response.body?.answer).toMatch(/Requested visual capture every 10 seconds|Visual capture is running every 10 seconds/);
    expect(response.body?.answer).not.toContain("Producer freshness:");
    expect(response.body?.answer).not.toContain("Pipeline:");
    expect(response.body?.ask_turn_preflight_context?.schema).toBe("helix.ask_turn_preflight_context.v1");
    expect(response.body?.ask_turn_preflight_context?.retrieval_required_signal).toBeTruthy();
    expect(response.body?.terminal_presentation?.schema).toBe("helix.terminal_presentation.v1");
    expect(response.body?.terminal_presentation?.concise_text).toBe(response.body?.answer);
    expect(response.body?.terminal_presentation_coverage_audit).toMatchObject({
      schema: "helix.terminal_presentation_coverage_audit.v1",
      terminal_presenter_used: true,
      raw_route_text_returned: false,
      violations: [],
    });
    expect(response.body?.receipt_presentation_snapshot?.schema).toBe("helix.receipt_presentation_snapshot.v1");
    expect(response.body?.receipt_presentation_snapshot?.full_summary).toContain("Producer freshness:");
    expect(response.body?.source_binding_statuses?.some((entry: any) =>
      entry?.schema === "helix.source_binding_status.v1" &&
      entry?.modality === "visual_frame"
    )).toBe(true);
    expect(
      response.body?.current_turn_artifact_ledger?.some(
        (entry: any) => entry?.payload?.schema === "helix.live_pipeline_turn_receipt.v1",
      ),
    ).toBe(true);
    expect(response.body?.live_answer_environment?.objective).not.toBe("ok set the interval to 10 seconds on the visual capture");
    expect(response.body?.terminal_answer_authority?.server_authoritative).toBe(true);
    expect(response.body?.poison_audit?.ok).toBe(true);
  }, 20_000);

  it("redirects direct live-answer create cadence commands to producer control", async () => {
    const app = await createApp();
    const response = await request(app)
      .post("/api/agi/situation/live-answer-environment/create")
      .send({
        thread_id: "helix-ask:desktop",
        objective: "ok set the interval to 10 seconds on the visual capture",
      })
      .expect(200);

    expect(response.body?.schema).toBe("helix.live_answer_environment_control_redirect_response.v1");
    expect(response.body?.redirected_from).toBe("live_answer_environment_create");
    expect(response.body?.action).toBe("situation-room.live-source.set_rate");
    expect(response.body?.action_id).toBe("situation-room.live-source.set_rate");
    expect(response.body?.cadence_ms).toBe(10_000);
    expect(response.body?.workspace_action_receipt?.action_id).toBe("situation-room.live-source.set_rate");
    expect(response.body?.workspace_action_receipt?.state_observed).toBe(true);
    expect(response.body?.visual_producer_cadence_receipt?.action_id).toBe("situation-room.live-source.set_rate");
    expect(response.body?.visual_producer_cadence_receipt?.cadence?.capture_mode).toBe("interval");
    expect(response.body?.visual_producer_cadence_receipt?.cadence?.cadence_ms).toBe(10_000);
    expect(response.body?.live_answer_environment?.objective).not.toBe("ok set the interval to 10 seconds on the visual capture");
    expect(response.body?.assistant_answer).toBe(false);
  });

  it("uses the same cadence receipt shape as the direct producer set-cadence endpoint", async () => {
    const app = await createApp();
    const response = await request(app)
      .post("/api/agi/situation/live-source/producer/set-cadence")
      .send({
        thread_id: "helix-ask:desktop",
        source_id: "visual_source:parity",
        cadence_ms: 10_000,
        capture_mode: "interval",
        client_stream_confirmed: true,
      })
      .expect(200);

    expect(response.body?.action_id).toBe("situation-room.live-source.set_rate");
    expect(response.body?.workspace_action_receipt?.action_id).toBe("situation-room.live-source.set_rate");
    expect(response.body?.workspace_action_receipt?.state_observed).toBe(true);
    expect(response.body?.client_action_request?.schema).toBe("helix.client_capability_action.v1");
    expect(response.body?.client_action_request?.capability).toBe("visual_capture");
    expect(response.body?.client_action_request?.args?.source_id).toBe("visual_source:parity");
    expect(response.body?.client_action_request?.args?.cadence_ms).toBe(10_000);
    expect(response.body?.client_action_request_ids).toContain(response.body.client_action_request.action_request_id);
    expect(response.body?.receipt).toMatchObject({
      schema: "helix.visual_producer_cadence_receipt.v1",
      action_id: "situation-room.live-source.set_rate",
      source_id: "visual_source:parity",
      thread_id: "helix-ask:desktop",
      cadence_ms: 10_000,
      capture_mode: "interval",
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("records generic client capability adoption for visual producer requests", async () => {
    const app = await createApp();
    const cadence = await request(app)
      .post("/api/agi/situation/live-source/producer/set-cadence")
      .send({
        thread_id: "helix-ask:desktop",
        source_id: "visual_source:client-action",
        cadence_ms: 10_000,
        capture_mode: "interval",
        client_stream_confirmed: true,
      })
      .expect(200);

    const pending = await request(app)
      .get("/api/agi/client-action/pending?thread_id=helix-ask%3Adesktop")
      .expect(200);
    expect(pending.body?.actions?.map((entry: any) => entry.action_request_id)).toContain(
      cadence.body.client_action_request.action_request_id,
    );

    const adoption = await request(app)
      .post(`/api/agi/client-action/${encodeURIComponent(cadence.body.client_action_request.action_request_id)}/adopt`)
      .send({
        thread_id: "helix-ask:desktop",
        source_id: "visual_source:client-action",
        producer_id: cadence.body.producer.producer_id,
        client_id: "current_browser",
        ok: true,
        observed_state: {
          client_stream_confirmed: true,
          interval_active: true,
          cadence_ms: 10_000,
        },
      })
      .expect(200);

    expect(adoption.body?.adoption).toMatchObject({
      schema: "helix.client_capability_adoption.v1",
      action_request_id: cadence.body.client_action_request.action_request_id,
      thread_id: "helix-ask:desktop",
      capability: "visual_capture",
      action: "adopt_producer",
      source_id: "visual_source:client-action",
      producer_id: cadence.body.producer.producer_id,
      ok: true,
      assistant_answer: false,
      raw_content_included: false,
    });
    const adoptions = await request(app)
      .get("/api/agi/client-action/adoptions?thread_id=helix-ask%3Adesktop")
      .expect(200);
    expect(adoptions.body?.adoptions?.map((entry: any) => entry.adoption_id)).toContain(adoption.body.adoption.adoption_id);
  });

  it("records scheduler adoption through the producer adoption endpoint", async () => {
    const app = await createApp();
    const cadence = await request(app)
      .post("/api/agi/situation/live-source/producer/set-cadence")
      .send({
        thread_id: "helix-ask:desktop",
        source_id: "visual_source:adoption-route",
        cadence_ms: 10_000,
        capture_mode: "interval",
      })
      .expect(200);

    const adoption = await request(app)
      .post("/api/agi/situation/live-source/producer/adopt")
      .send({
        producer_id: cadence.body?.producer?.producer_id,
        source_id: "visual_source:adoption-route",
        thread_id: "helix-ask:desktop",
        cadence_ms: 10_000,
        capture_mode: "interval",
        client_stream_confirmed: true,
        interval_active: true,
      })
      .expect(200);

    expect(adoption.body?.adoption).toMatchObject({
      schema: "helix.visual_producer_scheduler_adoption.v1",
      producer_id: cadence.body?.producer?.producer_id,
      source_id: "visual_source:adoption-route",
      thread_id: "helix-ask:desktop",
      cadence_ms: 10_000,
      capture_mode: "interval",
      client_stream_confirmed: true,
      interval_active: true,
      status: "adopted",
      assistant_answer: false,
      raw_content_included: false,
    });

    const list = await request(app)
      .get("/api/agi/situation/live-source/producer/adoptions?thread_id=helix-ask%3Adesktop")
      .expect(200);
    expect(list.body?.adoptions?.map((entry: any) => entry.adoption_id)).toContain(adoption.body.adoption.adoption_id);
  });

  it("normalizes reverse visual interval wording to a 10 second producer cadence", async () => {
    const app = await createApp();
    const askResponse = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        sessionId: threadId,
        question: "Ok set this visual source on 10 seconds interval",
        debug: true,
      })
      .expect(200);

    expect(askResponse.body?.route_reason_code).toBe("live_pipeline_control");
    expect(askResponse.body?.action_id).toBe("situation-room.live-source.set_rate");
    expect(askResponse.body?.cadence_ms).toBe(10_000);
    expect(askResponse.body?.visual_producer_cadence_receipt?.cadence_ms).toBe(10_000);
    expect(askResponse.body?.live_answer_environment?.objective).not.toBe("Ok set this visual source on 10 seconds interval");

    const createResponse = await request(app)
      .post("/api/agi/situation/live-answer-environment/create")
      .send({
        thread_id: "helix-ask:desktop",
        objective: "Ok set this visual source on 10 seconds interval",
      })
      .expect(200);

    expect(createResponse.body?.schema).toBe("helix.live_answer_environment_control_redirect_response.v1");
    expect(createResponse.body?.action_id).toBe("situation-room.live-source.set_rate");
    expect(createResponse.body?.cadence_ms).toBe(10_000);
    expect(createResponse.body?.visual_producer_cadence_receipt?.cadence_ms).toBe(10_000);
    expect(createResponse.body?.live_answer_environment?.objective).not.toBe("Ok set this visual source on 10 seconds interval");
  }, 20_000);

  it("registers the visual producer rate action as a workstation affordance", () => {
    expect(WORKSTATION_DYNAMIC_TOOL_ACTIONS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          panel_id: "situation-room-pipelines",
          action_id: "live-source.set_rate",
          required_args: ["cadence_ms"],
        }),
      ]),
    );
    expect(WORKSPACE_ACTION_REGISTRY).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action_key: "situation-room.live-source.set_rate",
          target_id: "situation-room-pipelines",
          action_id: "live-source.set_rate",
          terminal_receipt_required: true,
        }),
      ]),
    );
  });

  it("routes producer status questions to pipeline inspection with freshness evidence", async () => {
    const app = await createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        sessionId: threadId,
        question: "is my screen live source still updating?",
        debug: true,
      })
      .expect(200);

    expect(response.body?.route_reason_code).toBe("live_pipeline_inspect");
    expect(response.body?.producer_freshness?.next_required_action).toBeTruthy();
    expect(response.body?.visual_cadence_acceptance?.assistant_answer).toBe(false);
    expect(response.body?.terminal_answer_authority?.server_authoritative).toBe(true);
  }, 20_000);

  it("routes worker-lane live cognition questions to binding diagnosis", async () => {
    const app = await createApp();
    const cadence = await request(app)
      .post("/api/agi/situation/live-source/producer/set-cadence")
      .send({
        thread_id: "helix-ask:desktop",
        source_id: "visual_source:diagnosis",
        cadence_ms: 15_000,
        capture_mode: "interval",
        client_stream_confirmed: true,
      })
      .expect(200);
    await request(app)
      .post(`/api/agi/client-action/${encodeURIComponent(cadence.body.client_action_request.action_request_id)}/adopt`)
      .send({
        thread_id: "helix-ask:desktop",
        source_id: "visual_source:diagnosis",
        producer_id: cadence.body.producer.producer_id,
        client_id: "current_browser",
        ok: true,
        observed_state: {
          client_stream_confirmed: true,
          interval_active: true,
          cadence_ms: 10_000,
        },
      })
      .expect(200);

    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        sessionId: "helix-ask:desktop",
        question: "why are the worker lanes not updating even though visual capture is running?",
        debug: true,
      })
      .expect(200);

    expect(response.body?.route_reason_code).toBe("live_environment_binding_diagnosis");
    expect(response.body?.canonical_goal_frame?.required_terminal_kind).toBe("live_environment_binding_diagnosis");
    expect(response.body?.final_answer_source).toBe("live_environment_binding_diagnosis");
    expect(response.body?.terminal_artifact_kind).toBe("live_environment_binding_diagnosis");
    expect(response.body?.live_environment_binding_diagnosis).toMatchObject({
      schema: "helix.live_environment_binding_diagnosis.v1",
      target_source: "visual_capture",
      client_adoption_status: "adopted",
      client_interval_active: true,
      server_cadence_ms: 15_000,
      client_observed_cadence_ms: 10_000,
      cadence_match: false,
      capture_ready: true,
      scene_procedure_ready: false,
      live_card_ready: false,
      blocking_reason: "producer_stale",
      next_required_action: "capture_frame_now",
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(response.body?.latest_field_evaluation_absence_reason).toBeTruthy();
    expect(response.body?.latest_interpretation_absence_reason).toBeTruthy();
    expect(response.body?.answer).toContain("capture alone is not live cognition");
    expect(response.body?.answer).not.toContain("Visual capture is running every");
    expect(response.body?.terminal_answer_authority?.server_authoritative).toBe(true);
    expect(response.body?.poison_audit?.ok).toBe(true);
  }, 20_000);

  it("routes Minecraft event attachment questions to world binding diagnostics", async () => {
    const app = await createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        sessionId: threadId,
        question: "are Minecraft events attached to this thread?",
        debug: true,
      })
      .expect(200);

    expect(response.body?.route_reason_code).toBe("live_pipeline_inspect");
    expect(response.body?.world_event_thread_binding_check?.schema).toBe("helix.world_event_thread_binding_check.v1");
    expect(response.body?.world_event_thread_binding_check?.assistant_answer).toBe(false);
    expect(response.body?.source_binding_statuses?.some((entry: any) =>
      entry?.schema === "helix.source_binding_status.v1" &&
      entry?.modality === "world_event" &&
      ["observed_unbound", "stale"].includes(entry.status)
    )).toBe(true);
    expect(response.body?.terminal_answer_authority?.server_authoritative).toBe(true);
  }, 20_000);

  it("routes explicit live repair prompts to live runtime repair", async () => {
    const app = await createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        sessionId: threadId,
        question: "fix the live screen source",
        debug: true,
      })
      .expect(200);

    expect(response.body?.route_reason_code).toBe("live_runtime_repair");
    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("live_runtime_repair");
    expect(response.body?.live_runtime_repair_plan?.schema).toBe("helix.live_runtime_repair_plan.v1");
    expect(response.body?.terminal_answer_authority?.server_authoritative).toBe(true);
    expect(response.body?.poison_audit?.ok).toBe(true);
  }, 20_000);

  it("repairs an existing live pipeline for not-updating prompts", async () => {
    const plan = composeLiveSourcePipelinePlan({
      threadId: "helix-ask:desktop",
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

    expect(response.body?.route_reason_code).toBe("live_runtime_repair");
    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("live_runtime_repair");
    expect(response.body?.live_runtime_context?.active_pipeline_id).toBe(receipt.pipeline_id);
    expect(response.body?.pipeline_dashboard?.pipeline_id).toBe(receipt.pipeline_id);
    expect(response.body?.live_runtime_repair_plan?.assistant_answer).toBe(false);
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
    expect(response.body?.ask_turn_preflight_context?.schema).toBe("helix.ask_turn_preflight_context.v1");
    expect(response.body?.terminal_presentation?.schema).toBe("helix.terminal_presentation.v1");
    expect(response.body?.terminal_presentation_coverage_audit).toMatchObject({
      terminal_presenter_used: true,
      raw_route_text_returned: false,
      violations: [],
    });
  });
});
