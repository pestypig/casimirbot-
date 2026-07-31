import crypto from "node:crypto";
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
import { createHelixTurnLifecycleRecorder } from "../../runtime/turn-lifecycle";
import { buildHelixTerminalGroundingAuthority } from "../../terminal-grounding-authority";

const terminalPayload = (answer: string, turnId = "ask:grounded:1") => {
  const terminalArtifactRef = `${turnId}:model_synthesized_answer:test`;
  const terminalTextHash = crypto.createHash("sha256").update(answer).digest("hex");
  return {
    schema: "helix.ask.turn.response.v1",
    turn_id: turnId,
    content: answer,
    final_answer_source: "final_answer_draft",
    terminal_artifact_kind: "model_synthesized_answer",
    selected_terminal_support_refs: [],
    terminal_synthesis_support_refs: [],
    ask_turn_solver_trace: {
      turn_id: turnId,
      completed_solver_path: true,
      route_authority_ok: true,
      poison_audit_ok: true,
      terminal_authority_ok: true,
      evidence_reentry_gate: {
        schema: "helix.evidence_reentry_gate.v1",
        turn_id: turnId,
        required: false,
        completed: true,
        reentry_authority: "compatibility_projection",
        runtime_lifecycle_verified: false,
        selected_evidence_refs: [],
      },
      route_evidence_authority: {
        schema: "helix.route_evidence_authority.v1",
        turn_id: turnId,
        current_turn_only: true,
        admitted_tools: [{ capability_id: "model_only", family: "model_only" }],
        supporting_evidence_refs: [],
        terminal_product_allowed: true,
      },
      final_arbitration: {
        terminal_artifact_kind: "model_synthesized_answer",
        final_answer_source: "final_answer_draft",
      },
    },
    ask_turn_procedure_trace: {
      turn_id: turnId,
      intent_class: "general_reasoning",
      selected_terminal_product: {
        kind: "model_synthesized_answer",
        ref: terminalArtifactRef,
        allowed_by_route: true,
      },
    },
    terminal_presentation: {
      turn_id: turnId,
      concise_text: answer,
      terminal_authority_ref: terminalArtifactRef,
      terminal_artifact_kind: "model_synthesized_answer",
      final_answer_source: "final_answer_draft",
      selected_observation_refs: [],
      support_refs: [],
    },
    terminal_answer_authority: {
      server_authoritative: true,
      turn_id: turnId,
      terminal_artifact_kind: "model_synthesized_answer",
      final_answer_source: "final_answer_draft",
      terminal_artifact_ref: terminalArtifactRef,
      terminal_text_hash: terminalTextHash,
      terminal_eligible: true,
    },
    solver_artifact_reentry_audit: {
      schema: "helix.solver_artifact_reentry_audit.v1",
      turn_id: turnId,
      ok: true,
      terminal_relevant_artifacts: [],
    },
    poison_audit: {
      turn_id: turnId,
      ok: true,
    },
  };
};

const nativeCapabilityTerminalPayload = (input: {
  answer: string;
  turnId: string;
  capabilityId: string;
  observationRef: string;
}) => ({
  ...terminalPayload(input.answer, input.turnId),
  turn_id: input.turnId,
  selected_final_answer: input.answer,
  terminal_answer_authority: {
    server_authoritative: true,
    turn_id: input.turnId,
    terminal_artifact_kind: "agent_provider_terminal_candidate",
    final_answer_source: "agent_provider_terminal_candidate",
    terminal_artifact_ref: `${input.turnId}:terminal`,
    terminal_text_hash: crypto.createHash("sha256").update(input.answer).digest("hex"),
    terminal_eligible: true,
  },
  terminal_artifact_kind: "agent_provider_terminal_candidate",
  final_answer_source: "agent_provider_terminal_candidate",
  terminal_presentation: {
    schema: "helix.terminal_presentation.v1",
    turn_id: input.turnId,
    concise_text: input.answer,
    terminal_authority_ref: `${input.turnId}:terminal`,
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
    route_authority_ok: true,
    poison_audit_ok: true,
    terminal_authority_ok: true,
    evidence_reentry: { required: true, completed: true },
    followup_reasoning: { required: true, completed: true },
    evidence_reentry_gate: {
      schema: "helix.evidence_reentry_gate.v1",
      turn_id: input.turnId,
      required: true,
      completed: true,
      reentry_authority: "compatibility_projection",
      runtime_lifecycle_verified: false,
      selected_evidence_refs: [input.observationRef],
    },
    route_evidence_authority: {
      schema: "helix.route_evidence_authority.v1",
      turn_id: input.turnId,
      current_turn_only: true,
      admitted_tools: [{ capability_id: input.capabilityId }],
      supporting_evidence_refs: [input.observationRef],
      terminal_product_allowed: true,
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
    final_arbitration: {
      terminal_artifact_kind: "agent_provider_terminal_candidate",
      final_answer_source: "agent_provider_terminal_candidate",
    },
  },
  selected_terminal_support_refs: [input.observationRef],
  terminal_synthesis_support_refs: [input.observationRef],
  solver_artifact_reentry_audit: {
    schema: "helix.solver_artifact_reentry_audit.v1",
    turn_id: input.turnId,
    ok: true,
    terminal_relevant_artifacts: [{
      ref: input.observationRef,
      selected_as_support: true,
      reentered_solver: true,
    }],
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

const createDocsHandoff = (suffix = "docs") => {
  const transcriptText =
    'Find the document called "Casimir Dp Quantum Foam Study", open the best match, and tell me what it is about.';
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
    selectedRuntimeAgentProvider: "codex",
  });
};

const buildLifecycle = (input: {
  turnId: string;
  scope?: "helix_ask_turn" | "codex_native_provider_cycle";
  capabilityId?: string;
  observationRef?: string;
}) => {
  const recorder = createHelixTurnLifecycleRecorder({
    turnId: input.turnId,
    scope: input.scope,
    now: () => 100,
  });
  const started = recorder.append({
    kind: "turn.started",
    producer: input.scope === "codex_native_provider_cycle" ? "codex_runtime" : "helix_adapter",
    status: "started",
  });
  let previousEventId = started.event_id;
  if (input.capabilityId && input.observationRef) {
    const route = recorder.append({
      kind: "route.committed",
      producer: "helix_policy",
      status: "succeeded",
      causation_id: previousEventId,
      route_commit_id: `route:${input.turnId}`,
      capability_ids: [input.capabilityId],
    });
    const admitted = recorder.append({
      kind: "capability.admitted",
      producer: "helix_policy",
      status: "succeeded",
      causation_id: route.event_id,
      route_commit_id: `route:${input.turnId}`,
      capability_id: input.capabilityId,
    });
    const called = recorder.append({
      kind: "tool.call.started",
      producer: "codex_runtime",
      status: "started",
      causation_id: admitted.event_id,
      route_commit_id: `route:${input.turnId}`,
      call_id: `${input.observationRef}:call`,
      capability_id: input.capabilityId,
    });
    const observed = recorder.append({
      kind: "tool.call.completed",
      producer: "helix_adapter",
      status: "succeeded",
      causation_id: called.event_id,
      route_commit_id: `route:${input.turnId}`,
      call_id: `${input.observationRef}:call`,
      capability_id: input.capabilityId,
      observation_refs: [input.observationRef],
    });
    previousEventId = recorder.append({
      kind: "observation.reentered",
      producer: "helix_adapter",
      status: "succeeded",
      causation_id: observed.event_id,
      route_commit_id: `route:${input.turnId}`,
      call_id: `${input.observationRef}:call`,
      capability_id: input.capabilityId,
      observation_refs: [input.observationRef],
    }).event_id;
  }
  const message = recorder.append({
    kind: "agent.message.completed",
    producer: "codex_runtime",
    status: "succeeded",
    causation_id: previousEventId,
    message_sha256: `hash:${input.turnId}`,
  });
  const completed = recorder.append({
    kind: "runtime.turn.completed",
    producer: "codex_runtime",
    status: "succeeded",
    causation_id: message.event_id,
  });
  const eligibility = recorder.append({
    kind: "terminal.eligibility.checked",
    producer: "helix_terminal_authority",
    status: "succeeded",
    causation_id: completed.event_id,
    terminal_kind: "model_synthesized_answer",
    terminal_eligible: true,
  });
  recorder.append({
    kind: "turn.completed",
    producer: "helix_adapter",
    status: "succeeded",
    causation_id: eligibility.event_id,
    terminal_kind: "model_synthesized_answer",
    terminal_eligible: true,
  });
  return recorder.snapshot();
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
    ]));
    expect(listStagePlayLiveSourceConversationEvents({
      threadId: "helix-ask:desktop",
      source: "assistant_answer",
    })).toEqual([
      expect.objectContaining({ textPreview: "The grounded answer." }),
    ]);
  });

  it("relays a canonical model-direct terminal even when preliminary admission guessed a capability", () => {
    const transcriptText =
      "Can we reflect on the quantum phone idea with the moral badge graph?";
    const observation = buildRealtimeTranscriptObservation({
      realtimeSessionId: "realtime:test",
      body: {
        event_type: "transcript.final",
        event_ref: "provider-event:model-direct-after-capability-guess",
        transcript_text: transcriptText,
      },
    })!;
    const handoff = bridgeRealtimeTranscriptToStagePlay({
      realtimeSessionId: "realtime:test",
      threadId: "helix-ask:desktop",
      providerEventRef: "provider-event:model-direct-after-capability-guess",
      transcriptText,
      observation,
      selectedRuntimeAgentProvider: "codex",
    });
    expect(handoff.required_grounding_capability_ids).toContain("moral-graph.reflect_context");

    const turnId = "ask:model-direct-after-capability-guess";
    const answer = "Use the moral badges as a discipline check, not as a proof engine.";
    const basePayload = terminalPayload(answer, turnId);
    const payload = {
      ...basePayload,
      canonical_goal_frame: {
        turn_id: turnId,
        goal_kind: "model_only_concept",
        answer_scope: "model_only",
      },
      ask_turn_procedure_trace: {
        ...basePayload.ask_turn_procedure_trace,
        intent_class: "model_only_concept",
      },
      ask_turn_solver_trace: {
        turn_id: turnId,
        completed_solver_path: true,
        route_authority_ok: true,
        poison_audit_ok: true,
        terminal_authority_ok: true,
        evidence_reentry_gate: {
          schema: "helix.evidence_reentry_gate.v1",
          turn_id: turnId,
          required: false,
          completed: true,
          reentry_authority: "compatibility_projection",
          runtime_lifecycle_verified: false,
          selected_evidence_refs: [],
        },
        route_evidence_authority: {
          schema: "helix.route_evidence_authority.v1",
          turn_id: turnId,
          current_turn_only: true,
          admitted_tools: [
            { capability_id: "model_only", family: "unknown" },
            { capability_id: "family:model_only", family: "model_only" },
          ],
          supporting_evidence_refs: [],
          terminal_product_allowed: true,
        },
        final_arbitration: {
          selected_route: "/ask",
          terminal_artifact_kind: "model_synthesized_answer",
          final_answer_source: "final_answer_draft",
        },
      },
    };

    const feedback = recordRealtimeGroundedAnswerFromPayload({
      handoffId: handoff.handoff_id,
      payload,
      askTurnId: turnId,
    });

    expect(feedback).toMatchObject({
      ask_turn_id: turnId,
      relay_basis: "model_direct_terminal",
      grounding_required: false,
      required_grounding_capability_ids: [],
      terminal_speech_authority_status: "validated",
    });
    expect(readRealtimeGroundedFeedbackObserverAudit(handoff.handoff_id)).toMatchObject({
      terminal_speech_authority_status: "validated",
      relay_basis: "model_direct_terminal",
      grounding_required: false,
      grounding_evidence_status: "not_required",
      feedback_status: "recorded",
    });
    expect(readRealtimeGroundedAnswerRelay(handoff.handoff_id)).toMatchObject({
      relay_basis: "model_direct_terminal",
      terminal_speech_authority_status: "validated",
      grounding_required: false,
      grounding_status: "not_required",
    });
  });

  it("rejects a terminal relay when the canonical answer hash is not current", () => {
    const handoff = createHandoff("stale-terminal-hash");
    const basePayload = terminalPayload("Current canonical answer.");
    const payload = {
      ...basePayload,
      terminal_answer_authority: {
        ...basePayload.terminal_answer_authority,
        terminal_text_hash: crypto
          .createHash("sha256")
          .update("A different answer.")
          .digest("hex"),
      },
    };

    expect(recordRealtimeGroundedAnswerFromPayload({
      handoffId: handoff.handoff_id,
      payload,
    })).toBeNull();
    expect(readRealtimeGroundedFeedbackObserverAudit(handoff.handoff_id)).toMatchObject({
      terminal_speech_authority_status: "rejected",
      failure_code: "terminal_relay_text_hash_mismatch",
      feedback_status: "suppressed",
    });
  });

  it("consumes the canonical terminal grounding authority without rebuilding tool proof", () => {
    const handoff = createHandoff("canonical-grounding-authority");
    const payload = terminalPayload("Canonical model-direct answer.");
    const groundingAuthority = buildHelixTerminalGroundingAuthority({
      payload,
      authoritySource: "canonical_terminal_boundary",
    });
    const payloadWithAuthority = {
      ...payload,
      terminal_grounding_authority: groundingAuthority,
    };

    const feedback = recordRealtimeGroundedAnswerFromPayload({
      handoffId: handoff.handoff_id,
      payload: payloadWithAuthority,
    });

    expect(feedback).toMatchObject({
      grounding_authority_ref: groundingAuthority.authority_id,
      grounding_proof_source: "canonical_terminal_boundary",
      grounding_required: false,
      required_grounding_capability_ids: [],
    });
  });

  it("does not replace a malformed grounding authority with compatibility proof", () => {
    const handoff = createHandoff("malformed-grounding-authority");
    const payload = {
      ...terminalPayload("Canonical answer."),
      terminal_grounding_authority: {
        schema: "helix.terminal_grounding_authority.v0",
        status: "validated",
      },
    };

    expect(recordRealtimeGroundedAnswerFromPayload({
      handoffId: handoff.handoff_id,
      payload,
    })).toBeNull();
    expect(readRealtimeGroundedFeedbackObserverAudit(handoff.handoff_id)).toMatchObject({
      feedback_status: "suppressed",
      failure_code: "terminal_grounding_authority_invalid",
    });
  });

  it("rejects deictic answers until active-context evidence was re-entered and followed by reasoning", () => {
    const handoff = createDeicticHandoff();
    expect(handoff.required_grounding_capability_ids).toEqual(["workstation.active_context"]);

    const missingObservation = {
      ...terminalPayload("The account panel is visible."),
      ask_turn_solver_trace: {
        turn_id: "ask:grounded:1",
        completed_solver_path: true,
        route_authority_ok: true,
        poison_audit_ok: true,
        terminal_authority_ok: true,
        evidence_reentry: { required: true, completed: true },
        followup_reasoning: { required: true, completed: true },
        evidence_reentry_gate: {
          schema: "helix.evidence_reentry_gate.v1",
          turn_id: "ask:grounded:1",
          required: true,
          completed: true,
          reentry_authority: "compatibility_projection",
          runtime_lifecycle_verified: false,
          selected_evidence_refs: [],
        },
        route_evidence_authority: {
          schema: "helix.route_evidence_authority.v1",
          turn_id: "ask:grounded:1",
          current_turn_only: true,
          admitted_tools: [{
            capability_id: "workstation.active_context",
            family: "workstation",
          }],
          supporting_evidence_refs: [],
          terminal_product_allowed: true,
        },
        final_arbitration: {
          terminal_artifact_kind: "model_synthesized_answer",
          final_answer_source: "final_answer_draft",
        },
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
    const groundedPayload = nativeCapabilityTerminalPayload({
      answer: "The account panel is visible.",
      turnId: "ask:grounded:1",
      capabilityId: "workstation.active_context",
      observationRef: activeContextRef,
    });
    const feedback = recordRealtimeGroundedAnswerFromPayload({
      handoffId: handoff.handoff_id,
      payload: {
        ...groundedPayload,
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
      required_grounding_capability_ids: [],
      grounding_evidence_satisfied: true,
      completed_solver_path: true,
      server_authoritative: true,
    });
    expect(feedback?.evidence_refs).toContain(activeContextRef);
  });

  it("trusts current-turn terminal evidence authority instead of reclassifying tool ids", () => {
    const handoff = createDeicticHandoff("native-solver-proof");
    const turnId = "ask:native-grounded:1";
    const unrelatedRef = `${turnId}:observation:docs`;
    const docsFeedback = recordRealtimeGroundedAnswerFromPayload({
      handoffId: handoff.handoff_id,
      payload: nativeCapabilityTerminalPayload({
        answer: "The completed solver selected this document observation.",
        turnId,
        capabilityId: "docs.read",
        observationRef: unrelatedRef,
      }),
    });
    expect(docsFeedback?.grounding_evidence_refs).toContain(unrelatedRef);
    expect(docsFeedback?.required_grounding_capability_ids).toEqual([]);

    resetRealtimeGroundedAnswerFeedbackForTests();
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
      grounding_proof_source: "canonical_terminal_boundary_compatibility",
      feedback_status: "recorded",
      failure_code: null,
    });
  });

  it("prefers a verified canonical re-entry gate over a stale procedure projection", () => {
    const turnId = "ask:canonical-reentry-gate:1";
    const observationRef =
      `${turnId}:workstation_gateway:workstation.active_context:1`;
    const payload = nativeCapabilityTerminalPayload({
      answer: "The active panel is Account & Sessions.",
      turnId,
      capabilityId: "workstation.active_context",
      observationRef,
    });
    (payload.ask_turn_procedure_trace as Record<string, unknown>)
      .evidence_reentry_status = "not_reentered";
    payload.ask_turn_solver_trace.evidence_reentry_gate = {
      ...payload.ask_turn_solver_trace.evidence_reentry_gate,
      schema: "helix.evidence_reentry_gate.v1",
      turn_id: turnId,
      reentry_authority: "runtime_event_log",
      runtime_lifecycle_verified: true,
    };

    const handoff = createDeicticHandoff("canonical-reentry-gate");
    const feedback = recordRealtimeGroundedAnswerFromPayload({
      handoffId: handoff.handoff_id,
      payload,
    });

    expect(feedback?.evidence_refs).toContain(observationRef);
    expect(readRealtimeGroundedFeedbackObserverAudit(handoff.handoff_id)).toMatchObject({
      grounding_evidence_status: "validated",
      grounding_proof_source: "canonical_terminal_boundary_compatibility",
      feedback_status: "recorded",
      failure_code: null,
    });
  });

  it("rejects a verified canonical re-entry gate replayed under another Ask turn", () => {
    const turnId = "ask:canonical-reentry-replay:1";
    const observationRef =
      `${turnId}:workstation_gateway:workstation.active_context:1`;
    const payload = nativeCapabilityTerminalPayload({
      answer: "The active panel is Account & Sessions.",
      turnId,
      capabilityId: "workstation.active_context",
      observationRef,
    });
    (payload.ask_turn_procedure_trace as Record<string, unknown>)
      .evidence_reentry_status = "not_reentered";
    payload.ask_turn_solver_trace.evidence_reentry_gate = {
      ...payload.ask_turn_solver_trace.evidence_reentry_gate,
      schema: "helix.evidence_reentry_gate.v1",
      turn_id: turnId,
      reentry_authority: "runtime_event_log",
      runtime_lifecycle_verified: true,
    };

    const handoff = createDeicticHandoff("canonical-reentry-replay");
    expect(recordRealtimeGroundedAnswerFromPayload({
      handoffId: handoff.handoff_id,
      payload,
      askTurnId: "ask:different-turn:1",
    })).toBeNull();
    expect(readRealtimeGroundedFeedbackObserverAudit(handoff.handoff_id)).toMatchObject({
      grounding_evidence_status: "rejected",
      feedback_status: "suppressed",
      failure_code: "terminal_relay_current_turn_binding_mismatch",
    });
  });

  it("does not treat an unverified re-entry gate as canonical runtime proof", () => {
    const turnId = "ask:unverified-reentry-gate:1";
    const observationRef =
      `${turnId}:workstation_gateway:workstation.active_context:1`;
    const payload = nativeCapabilityTerminalPayload({
      answer: "The active panel is Account & Sessions.",
      turnId,
      capabilityId: "workstation.active_context",
      observationRef,
    });
    (payload.ask_turn_procedure_trace as Record<string, unknown>)
      .evidence_reentry_status = "not_reentered";
    payload.ask_turn_solver_trace.evidence_reentry_gate = {
      ...payload.ask_turn_solver_trace.evidence_reentry_gate,
      schema: "helix.evidence_reentry_gate.v1",
      turn_id: turnId,
      reentry_authority: "compatibility_projection",
      runtime_lifecycle_verified: false,
    };

    const handoff = createDeicticHandoff("unverified-reentry-gate");
    expect(recordRealtimeGroundedAnswerFromPayload({
      handoffId: handoff.handoff_id,
      payload,
    })).toBeNull();
    expect(readRealtimeGroundedFeedbackObserverAudit(handoff.handoff_id)).toMatchObject({
      grounding_evidence_status: "rejected",
      feedback_status: "suppressed",
      failure_code: "required_grounding_evidence_missing",
    });
  });

  it("records a natural Realtime docs answer when gateway evidence is in the canonical adapter lifecycle", () => {
    const handoff = createDocsHandoff("docs-canonical-reentry");
    expect(handoff.required_grounding_capability_ids).toEqual(["docs.search"]);
    const turnId = "ask:realtime-docs:1";
    const observationRef = `${turnId}:workstation_gateway:docs.search:observation`;
    const payload = {
      ...nativeCapabilityTerminalPayload({
        answer: "The study defines a bounded framework for testing Casimir and quantum-foam claims.",
        turnId,
        capabilityId: "docs.search",
        observationRef,
      }),
      turn_lifecycle: buildLifecycle({
        turnId,
        capabilityId: "docs.search",
        observationRef,
      }),
      native_provider_turn_lifecycle: buildLifecycle({
        turnId,
        scope: "codex_native_provider_cycle",
      }),
      workstation_gateway_call_results: [{
        ok: true,
        capability_id: "docs.search",
        artifact_refs: [observationRef],
        observation_packet: {
          status: "succeeded",
          call_id: `${observationRef}:call`,
          produced_artifact_refs: [observationRef],
        },
      }],
    };

    const feedback = recordRealtimeGroundedAnswerFromPayload({
      handoffId: handoff.handoff_id,
      payload,
      askTurnId: turnId,
    });

    expect(feedback).toMatchObject({
      handoff_id: handoff.handoff_id,
      ask_turn_id: turnId,
      required_grounding_capability_ids: [],
      grounding_evidence_satisfied: true,
      completed_solver_path: true,
      server_authoritative: true,
    });
    expect(feedback?.evidence_refs).toContain(observationRef);
    expect(readRealtimeGroundedFeedbackObserverAudit(handoff.handoff_id)).toMatchObject({
      terminal_authority_status: "validated",
      grounding_evidence_status: "validated",
      grounding_proof_source: "canonical_terminal_boundary_compatibility",
      feedback_status: "recorded",
      failure_code: null,
    });
  });

  it("suppresses speech when selected scientific closure evidence is malformed", () => {
    const handoff = createHandoff("scientific-closure-malformed");
    const turnId = "ask:scientific-closure:malformed";
    const observationRef =
      `${turnId}:workstation_gateway:scientific-evidence-closure.evaluate:1`;
    const payload = {
      ...nativeCapabilityTerminalPayload({
        answer: "This should not be spoken.",
        turnId,
        capabilityId: "scientific-evidence-closure.evaluate",
        observationRef,
      }),
      current_turn_artifact_ledger: [{
        artifact_id: observationRef,
        turn_id: turnId,
        producer_item_id: "call:scientific-closure",
        kind: "scientific_evidence_closure_observation",
        created_at_ms: Date.now(),
        source_scope: "current_turn",
        goal_hash: "goal:scientific-closure",
        payload: {
          schema: "casimir.scientific_evidence_closure.observation.v1",
          status: "succeeded",
          current_turn_id: turnId,
          current_turn_evidence: true,
          closure_packet: {
            artifactId: "scientific_evidence_closure_packet",
            schemaVersion: "scientific_evidence_closure_packet/v1",
            artifactSha256: "forged",
          },
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        },
      }],
    };

    expect(recordRealtimeGroundedAnswerFromPayload({
      handoffId: handoff.handoff_id,
      payload,
      askTurnId: turnId,
    })).toBeNull();
    expect(readRealtimeGroundedFeedbackObserverAudit(handoff.handoff_id)).toMatchObject({
      terminal_speech_authority_status: "validated",
      feedback_status: "suppressed",
      failure_code: "scientific_closure_grounding_identity_invalid",
    });
    expect(readRealtimeGroundedAnswerRelay(handoff.handoff_id)).toMatchObject({
      status: "suppressed",
      failure_code: "scientific_closure_grounding_identity_invalid",
      response_created: false,
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
        ...nativeCapabilityTerminalPayload({
          answer: answerText,
          turnId: "ask:grounded:1",
          capabilityId: "workstation.active_context",
          observationRef: activeContextRef,
        }),
        selected_agent_provider: "codex",
        language_model_policy: { resolved_model: "gpt-5.4" },
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
        grounding_proof_source: "canonical_terminal_boundary_compatibility",
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
      grounded_feedback_requires_terminal_grounding_authority: true,
      preliminary_capability_ids_are_non_authoritative: true,
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
    askRouter.post("/ask/turn", (req, res) =>
      res.json(terminalPayload("JSON grounded answer.", req.body?.turnId)));
    askRouter.post("/ask/turn/stream", (req, res) => {
      res.type("text/event-stream");
      res.write("event: turn_started\ndata: {\"ok\":true}\n\n");
      const largeFinal = req.body?.turnId === "ask:large-stream-final";
      if (!largeFinal) {
        res.write(`event: turn_delta\ndata: ${"x".repeat(1_300_000)}\n\n`);
      }
      const turnId = req.body?.turnId;
      const payload = largeFinal
        ? {
            ...terminalPayload("Large stream grounded answer.", turnId),
            debug_padding: "x".repeat(1_350_000),
          }
        : terminalPayload("Stream grounded answer.", turnId);
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
    app.post("/ask/turn", (req, res) =>
      res.json(terminalPayload("Unchanged response.", req.body?.turnId)));

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
