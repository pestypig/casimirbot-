import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { planRouter } from "../routes/agi.plan";
import {
  markStagePlayMailWakeRetryable,
  queueStagePlayLiveSourceMailWakeRequest,
  recordStagePlayMailWakeResult,
  resetStagePlayLiveSourceMailWakeStoreForTest,
} from "../services/stage-play/stage-play-live-source-mail-wake-store";

const createApp = (): express.Express => {
  const app = express();
  app.use(express.json());
  app.use("/api/agi", planRouter);
  return app;
};

beforeEach(() => {
  resetStagePlayLiveSourceMailWakeStoreForTest();
});

describe("helix ask E68 debug export endpoint", () => {
  it("returns a canonical active-turn debug export matching the completed turn", async () => {
    const app = createApp();
    const turn = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Open Scientific Calculator",
        mode: "read",
        debug: true,
        sessionId: `e68-debug-export-${Date.now()}`,
      })
      .expect(200);

    const turnId = turn.body?.turn_id;
    expect(turnId).toBeTruthy();
    const debugExport = await request(app)
      .get(`/api/agi/ask/turn/${encodeURIComponent(turnId)}/debug-export`)
      .expect(200);

    expect(debugExport.body?.ok).toBe(true);
    expect(debugExport.body?.payload?.schema).toBe("helix.ask.debug_export.v1");
    expect(debugExport.body?.payload?.active_turn_id).toBe(turnId);
    expect(debugExport.body?.payload?.active_prompt).toBe("Open Scientific Calculator");
    expect(debugExport.body?.payload?.selected_final_answer).toBe(turn.body?.selected_final_answer);
    expect(debugExport.body?.payload?.resolved_turn_summary?.terminal_artifact_kind).toBe(turn.body?.terminal_artifact_kind);
    expect(debugExport.body?.payload?.payload_hash).toEqual(expect.any(String));
    expect(debugExport.body.payload.payload_hash.length).toBeGreaterThan(12);
    expect(Array.isArray(debugExport.body?.payload?.current_turn_artifact_ledger)).toBe(true);
    expect(debugExport.body?.payload).toHaveProperty("terminal_candidate_rejections");
    expect(debugExport.body?.payload).toHaveProperty("evidence_reentry_proof");
    expect(debugExport.body?.payload).toHaveProperty("terminal_authority_single_writer");
    expect(debugExport.body?.payload?.artifact_query_index).toMatchObject({
      schema: "helix.artifact_query_index.v1",
      turn_id: turnId,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(Array.isArray(debugExport.body?.payload?.artifact_query_index?.artifact_refs)).toBe(true);
    expect(Array.isArray(debugExport.body?.payload?.artifact_query_index?.queryable_artifact_keys)).toBe(true);
  }, 60000);

  it("returns a typed debug failure for missing turn ids", async () => {
    const app = createApp();
    const response = await request(app)
      .get("/api/agi/ask/turn/not-a-real-turn/debug-export")
      .expect(404);

    expect(response.body?.ok).toBe(false);
    expect(response.body?.terminal_error_code).toBe("debug_export_turn_not_found");
  });

  it("reconciles cached debug export from a completed mailbox wake result", async () => {
    const app = createApp();
    const turn = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Review the latest Stage Play live-source mailbox finding.",
        mode: "read",
        debug: true,
        sessionId: `e68-debug-export-mailbox-wake-${Date.now()}`,
      })
      .expect(200);

    const turnId = turn.body?.turn_id;
    expect(turnId).toBeTruthy();
    const wakeRequestId = `stage_play_live_source_mail_wake:e68-${Date.now()}`;
    const decisionId = `stage_play_live_source_mail_decision:e68-${Date.now()}`;
    const voiceReceiptRef = `helix_interim_voice_callout_receipt:e68-${Date.now()}`;
    const wakeResult = recordStagePlayMailWakeResult({
      wakeRequestId,
      threadId: "helix-ask:desktop",
      status: "completed",
      askTurnId: turnId,
      decisionIds: [decisionId],
      evidenceRefs: [
        "stage_play_live_source_voice_delivery_receipt:e68",
        voiceReceiptRef,
      ],
      createdAt: "2026-06-04T12:00:00.000Z",
    });

    const debugExport = await request(app)
      .get(`/api/agi/ask/turn/${encodeURIComponent(turnId)}/debug-export`)
      .expect(200);

    expect(debugExport.body?.payload?.mailbox_wake_result_projection).toMatchObject({
      schema: "stage_play_live_source_mail_wake_result_projection/v1",
      wake_result_id: wakeResult.wakeResultId,
      wake_request_id: wakeRequestId,
      status: "completed",
      decision_ids: [decisionId],
      voice_checkpoint_refs: expect.arrayContaining([voiceReceiptRef]),
    });
    expect(debugExport.body?.payload?.selected_final_answer).toContain("The live-source mailbox wake completed");
    expect(debugExport.body?.payload?.final_answer_source).toBe("stage_play_mailbox_wake_result");
    expect(debugExport.body?.payload?.resolved_turn_summary).toMatchObject({
      final_status: "final_answer",
      resolved_route_label: "live_source_mailbox",
      terminal_artifact_kind: "stage_play_live_source_mail_wake_result",
      terminal_error_code: null,
    });
    expect(debugExport.body?.payload?.terminal_answer_authority).toMatchObject({
      final_answer_source: "stage_play_mailbox_wake_result",
      terminal_artifact_kind: "stage_play_live_source_mail_wake_result",
      terminal_artifact_ref: wakeResult.wakeResultId,
      debug_export_synchronized: true,
    });
    expect(debugExport.body?.payload?.solver_controller_summary).toMatchObject({
      decision: "allow_terminal",
      blocking_reasons: [],
      final_route: "live_source_mailbox",
      required_terminal_kind: "stage_play_live_source_mail_wake_result",
      selected_terminal_artifact_kind: "stage_play_live_source_mail_wake_result",
      route_authority_ok: true,
      final_route_reconciliation_ok: true,
    });
    expect(debugExport.body?.payload?.pre_reconciliation_solver_summary).toBeDefined();
    expect(debugExport.body?.payload?.pre_reconciliation_lifecycle_trace).toBeDefined();
    expect(debugExport.body?.payload?.pre_reconciliation_selected_capability).toBeDefined();
    expect(debugExport.body?.payload?.pre_reconciliation_source_target).toBeDefined();
    expect(debugExport.body?.payload?.tool_lifecycle_trace).toMatchObject({
      schema: "helix.tool_lifecycle_trace.v1",
      selected_capability: "live_env.request_interim_voice_callout",
      selected_tool: "live_env.request_interim_voice_callout",
      executed_capability: "live_env.request_interim_voice_callout",
      lifecycle_shape: "mailbox_wake_result_reconciled",
      lifecycle_status: "completed",
      route: "live_source_mailbox",
      wake_request_id: wakeRequestId,
      wake_result_id: wakeResult.wakeResultId,
      reconciled_from_wake_result: true,
    });
    expect(debugExport.body?.payload?.terminal_authority_single_writer).toMatchObject({
      selectedArtifactKind: "stage_play_live_source_mail_wake_result",
      selectedArtifactRef: wakeResult.wakeResultId,
      selected_terminal_artifact_kind: "stage_play_live_source_mail_wake_result",
      selected_terminal_artifact_ref: wakeResult.wakeResultId,
      final_answer_source: "stage_play_mailbox_wake_result",
      debug_export_synchronized: true,
    });
    expect(debugExport.body?.payload?.final_route_reconciliation).toMatchObject({
      ok: true,
      resolved_route_label: "live_source_mailbox",
      final_route: "live_source_mailbox",
      selected_terminal_artifact_kind: "stage_play_live_source_mail_wake_result",
      terminal_artifact_kind: "stage_play_live_source_mail_wake_result",
      final_answer_source: "stage_play_mailbox_wake_result",
      terminal_error_code: null,
      violations: [],
      debug_export_synchronized: true,
    });
    expect(debugExport.body?.payload?.source_target_intent).toMatchObject({
      target_source: "live_source_mailbox",
      targetSource: "live_source_mailbox",
      strength: "hard",
      wakeRequestId,
    });
    expect(debugExport.body?.payload?.stage_play_live_source_mailbox_debug).toMatchObject({
      route: "live_source_mailbox",
      route_selected: "live_source_mailbox",
      wake_request_id: wakeRequestId,
      wake_result_id: wakeResult.wakeResultId,
      decision_ids: [decisionId],
      voice_checkpoint_refs: expect.arrayContaining([voiceReceiptRef]),
    });
    expect(debugExport.body?.payload?.stagePlayWakeTransaction).toMatchObject({
      schema: "stage_play_wake_transaction_debug/v1",
      wakeRequestId,
      askTurnId: turnId,
      selectedTargetSource: "live_source_mailbox",
      selectedCapability: "live_env.request_interim_voice_callout",
      producedRefs: expect.arrayContaining([decisionId, voiceReceiptRef, wakeResult.wakeResultId]),
      decisionReceiptId: decisionId,
      voiceReceiptId: voiceReceiptRef,
      wakeResultId: wakeResult.wakeResultId,
      terminalKind: "stage_play_live_source_mail_wake_result",
      failureCode: null,
      assistant_answer: false,
      terminal_eligible: false,
    });
    expect(debugExport.body?.payload?.stage_play_wake_transaction).toEqual(
      debugExport.body?.payload?.stagePlayWakeTransaction,
    );
  }, 60000);

  it("exports a wake transaction debug block for a missing Ask turn id launch", async () => {
    const app = createApp();
    const turnId = `ask:e68-missing-turn-id-${Date.now()}`;
    const sessionId = `e68-missing-turn-id-${Date.now()}`;
    const wake = queueStagePlayLiveSourceMailWakeRequest({
      threadId: sessionId,
      roomId: "room:e68-missing-turn-id",
      mailIds: ["stage_play_live_source_mail:e68-missing-turn-id"],
      sourceIds: ["visual_source:e68-missing-turn-id"],
      reason: "unread_mail",
      evidenceRefs: ["stage_play_live_source_mail:e68-missing-turn-id"],
      now: "2026-06-04T12:02:00.000Z",
    });
    expect(wake?.wakeRequestId).toBeTruthy();
    const wakeRequestId = wake!.wakeRequestId;
    markStagePlayMailWakeRetryable({
      wakeRequestId,
      failureReason: "ask_launch_missing_ask_turn_id",
      now: "2026-06-04T12:02:01.000Z",
    });
    const wakeResult = recordStagePlayMailWakeResult({
      wakeRequestId,
      threadId: sessionId,
      roomId: "room:e68-missing-turn-id",
      status: "failed_retryable",
      askTurnId: null,
      failedReason: "ask_launch_missing_ask_turn_id",
      evidenceRefs: ["stage_play_wake_ask_launch_missing_ask_turn_id"],
      createdAt: "2026-06-04T12:02:02.000Z",
    });

    const routeMetadata = {
      invocationKind: "stage_play_mail_wake",
      wakeRequestId,
      mailboxThreadId: sessionId,
      sourceTarget: "live_source_mailbox",
      requiredCanonicalGoal: "processed_mail_interpretation",
      requiredPhase: "read_processed_mail",
      allowedCapabilities: ["live_env.read_processed_live_source_mail"],
      forbiddenCapabilities: ["workspace_os.status", "internet-search.search_web"],
      evidenceRefs: ["stage_play_live_source_mail:e68-missing-turn-id"],
    };
    await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Review the latest Stage Play live-source mailbox finding.",
        mode: "read",
        debug: true,
        turn_id: turnId,
        turnId,
        trace_id: turnId,
        traceId: turnId,
        sessionId,
        route_metadata: routeMetadata,
        routeMetadata,
      })
      .expect(200);

    const debugExport = await request(app)
      .get(`/api/agi/ask/turn/${encodeURIComponent(turnId)}/debug-export`)
      .expect(200);

    expect(debugExport.body?.payload?.stagePlayWakeTransaction).toMatchObject({
      schema: "stage_play_wake_transaction_debug/v1",
      wakeRequestId,
      askTurnId: turnId,
      askLaunchStatus: "missing_turn_id",
      routeMetadata: expect.objectContaining({
        invocationKind: "stage_play_mail_wake",
        wakeRequestId,
        sourceTarget: "live_source_mailbox",
      }),
      producedRefs: expect.arrayContaining([
        "stage_play_wake_ask_launch_missing_ask_turn_id",
        wakeResult.wakeResultId,
      ]),
      artifactRefs: expect.objectContaining({
        wakeRequestId,
        askTurnId: turnId,
      }),
      wakeResultId: wakeResult.wakeResultId,
      failureCode: "ask_launch_missing_ask_turn_id",
      failureReason: "ask_launch_missing_ask_turn_id",
      assistant_answer: false,
      terminal_eligible: false,
    });
    expect(debugExport.body?.payload?.stage_play_wake_transaction).toEqual(
      debugExport.body?.payload?.stagePlayWakeTransaction,
    );
  }, 60000);

  it("synchronizes durable transcript rows from a completed mailbox wake result before response finalization", async () => {
    const app = createApp();
    const turnId = `ask:e68-durable-mailbox-${Date.now()}`;
    const wakeRequestId = `stage_play_live_source_mail_wake:e68-durable-${Date.now()}`;
    const decisionId = `stage_play_live_source_mail_decision:e68-durable-${Date.now()}`;
    const voiceReceiptRef = `helix_interim_voice_callout_receipt:e68-durable-${Date.now()}`;
    const wakeResult = recordStagePlayMailWakeResult({
      wakeRequestId,
      threadId: "helix-ask:desktop",
      status: "completed",
      askTurnId: turnId,
      decisionIds: [decisionId],
      evidenceRefs: [voiceReceiptRef],
      createdAt: "2026-06-04T12:05:00.000Z",
    });

    const turn = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Open Scientific Calculator",
        mode: "read",
        debug: true,
        turn_id: turnId,
        turnId,
        trace_id: turnId,
        traceId: turnId,
        sessionId: `e68-durable-mailbox-${Date.now()}`,
      })
      .expect(200);

    expect(turn.body?.selected_final_answer).toContain("The live-source mailbox wake completed");
    expect(turn.body?.final_answer_source).toBe("stage_play_mailbox_wake_result");
    expect(turn.body?.mailbox_wake_result_projection).toMatchObject({
      wake_result_id: wakeResult.wakeResultId,
      wake_request_id: wakeRequestId,
      status: "completed",
      decision_ids: [decisionId],
      voice_checkpoint_refs: expect.arrayContaining([voiceReceiptRef]),
    });
    const transcriptEvents = Array.isArray(turn.body?.turn_transcript_events)
      ? turn.body.turn_transcript_events
      : [];
    const finalRows = transcriptEvents.filter((event: any) => event?.type === "final_answer");
    expect(finalRows.length).toBeGreaterThan(0);
    expect(finalRows.at(-1)).toMatchObject({
      role: "final",
      type: "final_answer",
      status: "final_answer",
      text: expect.stringContaining("The live-source mailbox wake completed"),
      detail: "stage_play_mailbox_wake_result",
      wake_request_id: wakeRequestId,
      wake_result_id: wakeResult.wakeResultId,
      debug_export_synchronized: true,
    });
    expect(
      transcriptEvents.some((event: any) =>
        event?.type === "turn_completed" &&
        event?.source_event_type === "turn_completed" &&
        event?.status === "failed"
      ),
    ).toBe(false);
    expect(
      transcriptEvents
        .filter((event: any) => event?.type === "decision" || event?.type === "model_decision")
        .filter((event: any) => /agent loop exhausted|max iterations budget|could not complete this turn/i.test(String(event?.text ?? "")))
        .every((event: any) => event?.status === "superseded"),
    ).toBe(true);
  }, 60000);

  it("returns replay-safe reasoning battle stage beats for a completed turn", async () => {
    const app = createApp();
    const turn = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Open Scientific Calculator",
        mode: "read",
        debug: true,
        sessionId: `e68-battle-stage-${Date.now()}`,
      })
      .expect(200);

    const turnId = turn.body?.turn_id;
    expect(turnId).toBeTruthy();
    const response = await request(app)
      .get(`/api/agi/ask/turn/${encodeURIComponent(turnId)}/reasoning-battle-stage`)
      .expect(200);

    expect(response.body?.ok).toBe(true);
    expect(response.body?.schema).toBe("helix.reasoning_battle_stage_response.v1");
    expect(response.body?.battle_stage).toMatchObject({
      schema: "helix.reasoning_battle_stage.v1",
      turn_id: turnId,
      source: "debug_payload_cache",
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(Array.isArray(response.body?.battle_stage?.beats)).toBe(true);
    expect(response.body.battle_stage.beats.length).toBeGreaterThan(0);
    expect(response.body.battle_stage.beats.length).toBeLessThanOrEqual(10);
    expect(response.body.battle_stage.beats.every((beat: any) => beat.raw_content_included === false)).toBe(true);
    const selectedFinalAnswer = typeof turn.body?.selected_final_answer === "string" ? turn.body.selected_final_answer : "";
    if (selectedFinalAnswer) {
      expect(JSON.stringify(response.body.battle_stage.beats)).not.toContain(selectedFinalAnswer);
    }
  }, 60000);
});
