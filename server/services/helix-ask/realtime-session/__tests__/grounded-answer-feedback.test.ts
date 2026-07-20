import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import {
  listStagePlayLiveSourceConversationEvents,
  resetStagePlayLiveSourceConversationStoreForTest,
} from "../../../stage-play/stage-play-live-source-conversation-store";
import {
  bridgeRealtimeTranscriptToStagePlay,
  resetRealtimeStagePlayAskHandoffsForTests,
} from "../../live-source/realtime-stage-play-handoff";
import { buildRealtimeTranscriptObservation } from "../route-boundary";
import {
  createRealtimeGroundedAnswerFeedbackMiddleware,
  readRealtimeGroundedAnswer,
  recordRealtimeGroundedAnswerFromPayload,
  resetRealtimeGroundedAnswerFeedbackForTests,
} from "../grounded-answer-feedback";
import { readRealtimeGroundedAnswerRelay } from "../grounded-answer-relay";
import { buildRealtimeStagePlayDebugProvenance } from "../debug-provenance";
import {
  admitRealtimeSession,
  resetRealtimeSessionRegistryForTests,
} from "../session-registry";

const terminalPayload = (answer: string) => ({
  schema: "helix.ask.turn.response.v1",
  turn_id: "ask:grounded:1",
  content: answer,
  final_answer_source: "final_answer_draft",
  terminal_artifact_kind: "model_synthesized_answer",
  selected_terminal_support_refs: ["evidence:tool:1"],
  ask_turn_solver_trace: { completed_solver_path: true },
  terminal_answer_authority: {
    server_authoritative: true,
    terminal_artifact_kind: "model_synthesized_answer",
    final_answer_source: "final_answer_draft",
  },
});

const createHandoff = (suffix: string) => {
  const observation = buildRealtimeTranscriptObservation({
    realtimeSessionId: "realtime:test",
    body: {
      event_type: "transcript.final",
      event_ref: `provider-event:${suffix}`,
      transcript_text: `Question ${suffix}`,
    },
  })!;
  return bridgeRealtimeTranscriptToStagePlay({
    realtimeSessionId: "realtime:test",
    threadId: "helix-ask:desktop",
    providerEventRef: `provider-event:${suffix}`,
    transcriptText: `Question ${suffix}`,
    observation,
  });
};

const createDeicticHandoff = (suffix = "deictic") => {
  const transcriptText = "What panel do you see?";
  const observation = buildRealtimeTranscriptObservation({
    realtimeSessionId: "realtime:test",
    body: {
      event_type: "transcript.final",
      event_ref: `provider-event:${suffix}`,
      transcript_text: transcriptText,
    },
  })!;
  return bridgeRealtimeTranscriptToStagePlay({
    realtimeSessionId: "realtime:test",
    threadId: "helix-ask:desktop",
    providerEventRef: `provider-event:${suffix}`,
    transcriptText,
    observation,
  });
};

describe("Realtime grounded answer feedback", () => {
  beforeEach(() => {
    resetStagePlayLiveSourceConversationStoreForTest();
    resetRealtimeStagePlayAskHandoffsForTests();
    resetRealtimeGroundedAnswerFeedbackForTests();
    resetRealtimeSessionRegistryForTests();
  });

  it("records a server-authoritative completed Ask answer and ignores incomplete candidates", () => {
    const handoff = createHandoff("direct");
    expect(recordRealtimeGroundedAnswerFromPayload({
      handoffId: handoff.handoff_id,
      payload: {
        ...terminalPayload("The grounded answer."),
        ask_turn_solver_trace: { completed_solver_path: false },
      },
    })).toBeNull();

    const feedback = recordRealtimeGroundedAnswerFromPayload({
      handoffId: handoff.handoff_id,
      payload: terminalPayload("The grounded answer."),
    });
    expect(feedback).toMatchObject({
      handoff_id: handoff.handoff_id,
      ask_turn_id: "ask:grounded:1",
      final_answer_source: "final_answer_draft",
      terminal_artifact_kind: "model_synthesized_answer",
      completed_solver_path: true,
      server_authoritative: true,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(feedback?.evidence_refs).toEqual(expect.arrayContaining([
      handoff.transcript_observation_ref,
      handoff.stage_play_event_ref,
      "evidence:tool:1",
    ]));
    expect(listStagePlayLiveSourceConversationEvents({
      threadId: "helix-ask:desktop",
      source: "assistant_answer",
    })).toEqual([
      expect.objectContaining({ textPreview: "The grounded answer." }),
    ]);
  });

  it("rejects deictic answers until active-context evidence was re-entered and followed by reasoning", () => {
    const handoff = createDeicticHandoff();
    expect(handoff.required_grounding_capability_ids).toEqual(["workstation.active_context"]);

    const missingObservation = {
      ...terminalPayload("The account panel is visible."),
      ask_turn_solver_trace: {
        completed_solver_path: true,
        evidence_reentry: { required: true, completed: true },
        followup_reasoning: { required: true, completed: true },
      },
    };
    expect(recordRealtimeGroundedAnswerFromPayload({
      handoffId: handoff.handoff_id,
      payload: missingObservation,
    })).toBeNull();
    expect(readRealtimeGroundedAnswerRelay(handoff.handoff_id)).toMatchObject({
      status: "suppressed",
      status_reason: "required_grounding_evidence_missing",
    });

    const activeContextRef = "observation:workstation.active_context:1";
    const feedback = recordRealtimeGroundedAnswerFromPayload({
      handoffId: handoff.handoff_id,
      payload: {
        ...missingObservation,
        selected_terminal_support_refs: [activeContextRef],
        workstation_gateway_call_results: [{
          ok: true,
          capability_id: "workstation.active_context",
          artifact_refs: [activeContextRef],
          observation_packet: {
            status: "succeeded",
            call_id: "call:workstation.active_context:1",
            produced_artifact_refs: [activeContextRef],
          },
        }],
      },
    });

    expect(feedback).toMatchObject({
      required_grounding_capability_ids: ["workstation.active_context"],
      grounding_evidence_satisfied: true,
      completed_solver_path: true,
      server_authoritative: true,
    });
    expect(feedback?.evidence_refs).toContain(activeContextRef);
  });

  it("suppresses typed failures and exports the complete authority-safe relay chain", () => {
    const nowMs = Date.now();
    const session = admitRealtimeSession({
      realtimeSessionId: "realtime:test",
      requesterRef: "requester:test",
      visibleUserConsentReceipt: "receipt:consent:test",
      model: "gpt-realtime",
      threadId: "helix-ask:desktop",
      nowMs,
    });
    const failedHandoff = createHandoff("typed-failure");
    expect(recordRealtimeGroundedAnswerFromPayload({
      handoffId: failedHandoff.handoff_id,
      payload: {
        ...terminalPayload("The worker could not complete this turn."),
        final_answer_source: "typed_failure",
        terminal_artifact_kind: "typed_failure",
      },
      nowMs: nowMs + 10,
    })).toBeNull();
    expect(readRealtimeGroundedAnswerRelay(failedHandoff.handoff_id)).toMatchObject({
      status: "suppressed",
      status_reason: "typed_failure_not_spoken",
      response_created: false,
    });

    const deicticFailure = createDeicticHandoff("deictic-typed-failure");
    expect(recordRealtimeGroundedAnswerFromPayload({
      handoffId: deicticFailure.handoff_id,
      payload: {
        ...terminalPayload("The worker could not observe the active panel."),
        final_answer_source: "typed_failure",
        terminal_artifact_kind: "typed_failure",
      },
      nowMs: nowMs + 11,
    })).toBeNull();
    expect(readRealtimeGroundedAnswerRelay(deicticFailure.handoff_id)).toMatchObject({
      status: "suppressed",
      status_reason: "typed_failure_not_spoken",
    });

    const groundedHandoff = createDeicticHandoff();
    const activeContextRef = "observation:workstation.active_context:debug";
    const answerText = "The active panel is Account & Sessions.";
    expect(recordRealtimeGroundedAnswerFromPayload({
      handoffId: groundedHandoff.handoff_id,
      payload: {
        ...terminalPayload(answerText),
        selected_agent_provider: "codex",
        language_model_policy: { resolved_model: "gpt-5.4" },
        ask_turn_solver_trace: {
          completed_solver_path: true,
          evidence_reentry: { required: true, completed: true },
          followup_reasoning: { required: true, completed: true },
        },
        workstation_gateway_call_results: [{
          ok: true,
          capability_id: "workstation.active_context",
          artifact_refs: [activeContextRef],
          observation_packet: {
            status: "succeeded",
            call_id: "call:workstation.active_context:debug",
            produced_artifact_refs: [activeContextRef],
          },
        }],
      },
      nowMs: nowMs + 20,
    })).not.toBeNull();

    const debug = buildRealtimeStagePlayDebugProvenance(session);
    const groundedDebug = debug.handoffs.find((entry) =>
      entry.handoff_id === groundedHandoff.handoff_id);
    expect(groundedDebug).toMatchObject({
      worker_admission: {
        decision_phase: "transcript_handoff",
        worker_turn_dispatched: false,
        workstation_action_execution_allowed: false,
      },
      grounded_answer: {
        completed_solver_path: true,
        server_authoritative: true,
      },
      grounded_relay: {
        status: "relay_queued_busy",
        worker_admission: {
          decision_phase: "solver_final",
          outcome: "worker_grounded",
          selected_runtime_agent_provider: "codex",
          selected_model: "gpt-5.4",
          observed_readonly_capability_ids: ["workstation.active_context"],
        },
        response_created: false,
        answer_authority: false,
      },
    });
    expect(debug.latest_grounded_relay?.handoff_id).toBe(groundedHandoff.handoff_id);
    expect(debug.authority).toMatchObject({
      spoken_relay_requires_server_authoritative_grounded_answer: true,
      realtime_relay_answer_authority: false,
    });
    expect(JSON.stringify(debug)).not.toContain(answerText);
  });

  it("observes JSON and streaming turn-final responses without changing their payload", async () => {
    const jsonHandoff = createHandoff("json");
    const streamHandoff = createHandoff("stream");
    const app = express();
    app.use(express.json());
    app.use(createRealtimeGroundedAnswerFeedbackMiddleware());
    app.post("/ask/turn", (_req, res) => res.json(terminalPayload("JSON grounded answer.")));
    app.post("/ask/turn/stream", (_req, res) => {
      res.type("text/event-stream");
      res.write("event: turn_started\ndata: {\"ok\":true}\n\n");
      res.write(`event: turn_delta\ndata: ${"x".repeat(1_300_000)}\n\n`);
      res.end(`event: turn_final\ndata: ${JSON.stringify(terminalPayload("Stream grounded answer."))}\n\n`);
    });

    const jsonResponse = await request(app).post("/ask/turn").send({
      turnId: "ask:json",
      routeMetadata: jsonHandoff.route_metadata,
    }).expect(200);
    expect(jsonResponse.body.content).toBe("JSON grounded answer.");
    expect(readRealtimeGroundedAnswer(jsonHandoff.handoff_id)?.answer_text_char_count)
      .toBe("JSON grounded answer.".length);

    const streamResponse = await request(app).post("/ask/turn/stream").send({
      turnId: "ask:stream",
      routeMetadata: streamHandoff.route_metadata,
    }).expect(200);
    expect(streamResponse.text).toContain("event: turn_final");
    expect(streamResponse.text).toContain("Stream grounded answer.");
    expect(readRealtimeGroundedAnswer(streamHandoff.handoff_id)?.ask_turn_id).toBe("ask:stream");
  });
});
