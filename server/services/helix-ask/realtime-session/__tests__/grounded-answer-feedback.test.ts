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
import { readRealtimeGroundedFeedbackObserverAudit } from "../grounded-answer-feedback-audit";
import { resolveRealtimeGroundedFeedbackBinding } from "../grounded-answer-feedback-binding";
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

const nativeCapabilityTerminalPayload = (input: {
  answer: string;
  turnId: string;
  capabilityId: string;
  observationRef: string;
}) => ({
  ...terminalPayload(input.answer),
  turn_id: input.turnId,
  selected_final_answer: input.answer,
  terminal_answer_authority: {
    server_authoritative: true,
    turn_id: input.turnId,
    terminal_artifact_kind: "agent_provider_terminal_candidate",
    final_answer_source: "agent_provider_terminal_candidate",
  },
  terminal_artifact_kind: "agent_provider_terminal_candidate",
  final_answer_source: "agent_provider_terminal_candidate",
  terminal_presentation: {
    schema: "helix.terminal_presentation.v1",
    turn_id: input.turnId,
    selected_observation_refs: [input.observationRef],
    support_refs: [input.observationRef],
  },
  ask_turn_procedure_trace: {
    schema: "helix.ask_turn_procedure_trace.v1",
    turn_id: input.turnId,
    evidence_reentry_status: "reentered",
    observed_artifacts: [{
      artifact_id: input.observationRef,
      kind: "workstation_active_context_observation",
      capability: input.capabilityId,
      status: "succeeded",
    }],
    selected_terminal_product: {
      kind: "agent_provider_terminal_candidate",
      ref: `${input.turnId}:terminal`,
      allowed_by_route: true,
    },
  },
  ask_turn_solver_trace: {
    schema: "helix.ask_turn_solver_trace.v1",
    turn_id: input.turnId,
    completed_solver_path: true,
    evidence_reentry: { required: true, completed: true },
    followup_reasoning: { required: true, completed: true },
    evidence_reentry_gate: {
      required: true,
      completed: true,
      selected_evidence_refs: [input.observationRef],
    },
    route_evidence_authority: {
      current_turn_only: true,
      admitted_tools: [{ capability_id: input.capabilityId }],
      supporting_evidence_refs: [input.observationRef],
    },
    capability_result: {
      capability_key: input.capabilityId,
      requested_capability: input.capabilityId,
      admitted_capability: input.capabilityId,
      executed_capability: input.capabilityId,
      status: "succeeded",
      reentered_solver: true,
      selected_for_answer: true,
      observation_refs: [input.observationRef],
      evidence_refs: [input.observationRef],
    },
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

  it("accepts current-turn canonical solver evidence and rejects an unrelated capability artifact", () => {
    const handoff = createDeicticHandoff("native-solver-proof");
    const turnId = "ask:native-grounded:1";
    const unrelatedRef = `${turnId}:observation:docs`;
    expect(recordRealtimeGroundedAnswerFromPayload({
      handoffId: handoff.handoff_id,
      payload: nativeCapabilityTerminalPayload({
        answer: "The active panel is Account & Sessions.",
        turnId,
        capabilityId: "docs.read",
        observationRef: unrelatedRef,
      }),
    })).toBeNull();
    expect(readRealtimeGroundedFeedbackObserverAudit(handoff.handoff_id)).toMatchObject({
      grounding_evidence_status: "rejected",
      feedback_status: "suppressed",
      failure_code: "required_grounding_evidence_missing",
    });

    const activeContextRef = `${turnId}:workstation_gateway:workstation.active_context:1`;
    const feedback = recordRealtimeGroundedAnswerFromPayload({
      handoffId: handoff.handoff_id,
      payload: nativeCapabilityTerminalPayload({
        answer: "The active panel is Account & Sessions.",
        turnId,
        capabilityId: "workstation.active_context",
        observationRef: activeContextRef,
      }),
    });
    expect(feedback?.evidence_refs).toContain(activeContextRef);
    expect(readRealtimeGroundedFeedbackObserverAudit(handoff.handoff_id)).toMatchObject({
      terminal_authority_status: "validated",
      grounding_evidence_status: "validated",
      grounding_proof_source: "canonical_solver_trace",
      feedback_status: "recorded",
      failure_code: null,
    });
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
      transcript_text_hash: groundedHandoff.transcript_text_hash,
      transcript_text_char_count: groundedHandoff.transcript_text_char_count,
      worker_admission: {
        decision_phase: "transcript_handoff",
        worker_turn_dispatched: false,
        workstation_action_execution_allowed: false,
      },
      feedback_observer_audit: {
        turn_final_status: "captured",
        terminal_authority_status: "validated",
        grounding_evidence_status: "validated",
        grounding_proof_source: "gateway_call_results",
        feedback_status: "recorded",
        raw_content_included: false,
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
      grounded_feedback_requires_issued_handoff_binding: true,
      grounded_feedback_requires_current_turn_capability_evidence: true,
      spoken_relay_requires_server_authoritative_grounded_answer: true,
      realtime_relay_answer_authority: false,
    });
    expect(JSON.stringify(debug)).not.toContain(answerText);
  });

  it("observes JSON and streaming finals across the production-style router boundary", async () => {
    const jsonHandoff = createHandoff("json");
    const streamHandoff = createHandoff("stream");
    const largeFinalHandoff = createHandoff("large-stream-final");
    const app = express();
    const observerRouter = express.Router();
    const askRouter = express.Router();
    app.use(express.json());
    observerRouter.use(createRealtimeGroundedAnswerFeedbackMiddleware());
    askRouter.post("/ask/turn", (_req, res) => res.json(terminalPayload("JSON grounded answer.")));
    askRouter.post("/ask/turn/stream", (req, res) => {
      res.type("text/event-stream");
      res.write("event: turn_started\ndata: {\"ok\":true}\n\n");
      const largeFinal = req.body?.turnId === "ask:large-stream-final";
      if (!largeFinal) {
        res.write(`event: turn_delta\ndata: ${"x".repeat(1_300_000)}\n\n`);
      }
      const payload = largeFinal
        ? {
            ...terminalPayload("Large stream grounded answer."),
            debug_padding: "x".repeat(1_350_000),
          }
        : terminalPayload("Stream grounded answer.");
      res.end(`event: turn_final\ndata: ${JSON.stringify(payload)}\n\n`);
    });
    app.use("/api/agi", observerRouter);
    app.use("/api/agi", askRouter);

    const jsonResponse = await request(app).post("/api/agi/ask/turn").send({
      turnId: "ask:json",
      routeMetadata: jsonHandoff.route_metadata,
      realtime_grounded_feedback_binding:
        jsonHandoff.route_metadata.realtime_grounded_feedback_binding,
    }).expect(200);
    expect(jsonResponse.body.content).toBe("JSON grounded answer.");
    expect(readRealtimeGroundedAnswer(jsonHandoff.handoff_id)?.answer_text_char_count)
      .toBe("JSON grounded answer.".length);

    const streamResponse = await request(app).post("/api/agi/ask/turn/stream").send({
      turnId: "ask:stream",
      routeMetadata: streamHandoff.route_metadata,
      realtime_grounded_feedback_binding:
        streamHandoff.route_metadata.realtime_grounded_feedback_binding,
    }).expect(200);
    expect(streamResponse.text).toContain("event: turn_final");
    expect(streamResponse.text).toContain("Stream grounded answer.");
    expect(readRealtimeGroundedAnswer(streamHandoff.handoff_id)?.ask_turn_id).toBe("ask:stream");
    expect(readRealtimeGroundedFeedbackObserverAudit(streamHandoff.handoff_id)).toMatchObject({
      binding_status: "validated",
      binding_source: "explicit_binding",
      turn_final_status: "captured",
      feedback_status: "recorded",
    });

    const largeStreamResponse = await request(app).post("/api/agi/ask/turn/stream").send({
      turnId: "ask:large-stream-final",
      routeMetadata: largeFinalHandoff.route_metadata,
      realtime_grounded_feedback_binding:
        largeFinalHandoff.route_metadata.realtime_grounded_feedback_binding,
    }).expect(200);
    expect(largeStreamResponse.text).toContain("Large stream grounded answer.");
    expect(readRealtimeGroundedAnswer(largeFinalHandoff.handoff_id)?.ask_turn_id)
      .toBe("ask:large-stream-final");
    expect(readRealtimeGroundedFeedbackObserverAudit(largeFinalHandoff.handoff_id)).toMatchObject({
      turn_final_status: "captured",
      terminal_authority_status: "validated",
      feedback_status: "recorded",
      failure_code: null,
    });
  });

  it("fails closed for forged and stale bindings while retaining legacy route compatibility", async () => {
    const handoff = createHandoff("binding-validation");
    const binding = handoff.route_metadata.realtime_grounded_feedback_binding as Record<string, unknown>;
    const app = express();
    app.use(express.json());
    app.use(createRealtimeGroundedAnswerFeedbackMiddleware());
    app.post("/ask/turn", (_req, res) => res.json(terminalPayload("Unchanged response.")));

    await request(app).post("/ask/turn").send({
      turnId: "ask:forged",
      routeMetadata: handoff.route_metadata,
      realtime_grounded_feedback_binding: {
        ...binding,
        realtime_session_id: "realtime:forged",
      },
    }).expect(200);
    expect(readRealtimeGroundedAnswer(handoff.handoff_id)).toBeNull();
    expect(readRealtimeGroundedFeedbackObserverAudit(handoff.handoff_id)).toMatchObject({
      binding_status: "rejected",
      failure_code: "realtime_feedback_binding_handoff_mismatch",
    });

    await request(app).post("/ask/turn").send({
      turnId: "ask:valid-after-forged",
      routeMetadata: handoff.route_metadata,
      realtime_grounded_feedback_binding: binding,
    }).expect(200);
    expect(readRealtimeGroundedAnswer(handoff.handoff_id)).not.toBeNull();
    expect(readRealtimeGroundedFeedbackObserverAudit(handoff.handoff_id)).toMatchObject({
      binding_status: "validated",
      feedback_status: "recorded",
      failure_code: null,
    });

    await request(app).post("/ask/turn").send({
      turnId: "ask:forged-after-valid",
      routeMetadata: handoff.route_metadata,
      realtime_grounded_feedback_binding: {
        ...binding,
        realtime_session_id: "realtime:forged",
      },
    }).expect(200);
    expect(readRealtimeGroundedFeedbackObserverAudit(handoff.handoff_id)).toMatchObject({
      binding_status: "validated",
      feedback_status: "recorded",
      failure_code: null,
    });

    const legacyRouteMetadata = { ...handoff.route_metadata };
    delete legacyRouteMetadata.realtime_grounded_feedback_binding;
    expect(resolveRealtimeGroundedFeedbackBinding({
      route_metadata: legacyRouteMetadata,
    })).toMatchObject({
      handoff: { handoff_id: handoff.handoff_id },
      bindingSource: "legacy_route_metadata",
      failureCode: null,
    });

    resetRealtimeStagePlayAskHandoffsForTests();
    expect(resolveRealtimeGroundedFeedbackBinding({
      route_metadata: handoff.route_metadata,
      realtime_grounded_feedback_binding: binding,
    })).toMatchObject({
      handoff: null,
      candidateHandoffId: handoff.handoff_id,
      failureCode: "realtime_feedback_handoff_unknown",
    });
  });
});
