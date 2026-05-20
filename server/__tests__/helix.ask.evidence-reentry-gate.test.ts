import { describe, expect, it } from "vitest";

import { buildAskTurnSolverTrace } from "../services/helix-ask/ask-turn-solver";
import { buildEvidenceReentryGate } from "../services/helix-ask/evidence-reentry-gate";
import { buildFollowupReasoningGate } from "../services/helix-ask/followup-reasoning-gate";

const authorityPayload = (input: {
  sourceTarget: string;
  allowed: string[];
  forbidden?: string[];
}) => ({
  source_target_intent: {
    target_source: input.sourceTarget,
    target_kind: input.sourceTarget,
    strength: "hard",
  },
  route_product_contract: {
    source_target: input.sourceTarget,
    allowed_terminal_artifact_kinds: input.allowed,
    forbidden_terminal_artifact_kinds: input.forbidden ?? [],
  },
  route_authority_audit: {
    route_authority_ok: true,
  },
  poison_audit: {
    ok: true,
  },
  terminal_answer_authority: {
    server_authoritative: true,
  },
});

describe("Helix Ask evidence re-entry and follow-up gates", () => {
  it("flags receipt terminal output for content prompts when the receipt did not re-enter", () => {
    const gate = buildEvidenceReentryGate({
      turnId: "turn:receipt-content",
      payload: {},
      loopTrace: {
        actual_tool_calls: [{
          tool_id: "situation-room.live-source.set_rate",
          family: "live_pipeline",
          admitted: true,
          mutating: true,
          result_ref: "receipt:cadence",
        }],
        evidence_selected_for_answer: [],
        evidence_rejected_for_answer: [],
        observations_created: [],
      },
      primaryIntent: "content_question",
      terminalArtifactKind: "live_pipeline_receipt",
      finalAnswerSource: "live_pipeline_receipt",
      finalArbitrationRan: true,
      sourceEvidenceRequired: true,
      allowedTerminalProducts: ["situation_context_pack", "typed_failure"],
    });

    expect(gate).toMatchObject({
      schema: "helix.evidence_reentry_gate.v1",
      required: true,
      completed: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(gate.violation_codes).toContain("receipt_terminal_without_reentry");
    expect(gate.violation_codes).toContain("source_observation_terminal_without_selection");
  });

  it("allows an affirmative cadence command to terminate as a pure control receipt", () => {
    const trace = buildAskTurnSolverTrace({
      turnId: "turn:cadence",
      promptText: "Set the visual capture interval to 10 seconds",
      selectedRoute: "live_pipeline_control",
      terminalArtifactKind: "live_pipeline_receipt",
      finalAnswerSource: "live_pipeline_receipt",
      payload: authorityPayload({
        sourceTarget: "live_pipeline",
        allowed: ["live_pipeline_receipt", "typed_failure", "request_user_input"],
      }),
      loopParityTrace: {
        actual_tool_calls: [{
          tool_id: "situation-room.live-source.set_rate",
          family: "live_pipeline",
          admitted: true,
          mutating: true,
          result_ref: "receipt:cadence",
        }],
        evidence_selected_for_answer: [],
        evidence_rejected_for_answer: [],
        observations_created: [],
        terminal_selection_ran_after_observations: true,
        route_authority_ok: true,
        poison_audit_ok: true,
        terminal_authority_ok: true,
      },
    });

    expect(trace.selected_primary_intent).toBe("control_command");
    expect(trace.evidence_reentry_gate.violation_codes).toEqual([]);
    expect(trace.followup_reasoning_gate).toMatchObject({
      schema: "helix.followup_reasoning_gate.v1",
      required: false,
      completed: true,
      reason: "pure_control_receipt",
    });
    expect(trace.solver_risk_flags).not.toContain("missing_followup_reasoning");
  });

  it("keeps the original negated cadence prompt on content intent without receipt terminal authority", () => {
    const trace = buildAskTurnSolverTrace({
      turnId: "turn:negated-cadence",
      promptText: "all right cool can you review what is happening right now in the screen capture I haven't started the interval 10 seconds yet",
      selectedRoute: "situation_context_question",
      terminalArtifactKind: "situation_context_pack",
      finalAnswerSource: "situation_context_pack",
      payload: authorityPayload({
        sourceTarget: "visual_capture",
        allowed: ["situation_context_pack", "typed_failure", "request_user_input"],
        forbidden: ["live_pipeline_receipt"],
      }),
      loopParityTrace: {
        actual_tool_calls: [],
        observations_created: [{ observation_id: "obs:visual", source_kind: "visual_frame" }],
        evidence_selected_for_answer: ["obs:visual"],
        evidence_rejected_for_answer: [],
        terminal_selection_ran_after_observations: true,
        route_authority_ok: true,
        poison_audit_ok: true,
        terminal_authority_ok: true,
      },
    });

    expect(trace.selected_primary_intent).toBe("content_question");
    expect(trace.final_arbitration.terminal_artifact_kind).not.toBe("live_pipeline_receipt");
    expect(trace.evidence_reentry_gate.completed).toBe(true);
    expect(trace.solver_risk_flags).not.toContain("receipt_terminal_without_reentry");
  });

  it("treats debug set_rate prompts as diagnosis and rejects receipt-as-answer", () => {
    const trace = buildAskTurnSolverTrace({
      turnId: "turn:debug-set-rate",
      promptText: "Why did previous answer suggest set_rate?",
      selectedRoute: "runtime_debug_diagnosis",
      terminalArtifactKind: "live_pipeline_receipt",
      finalAnswerSource: "live_pipeline_receipt",
      payload: authorityPayload({
        sourceTarget: "runtime_evidence",
        allowed: ["repo_code_evidence_answer", "typed_failure", "request_user_input"],
        forbidden: ["live_pipeline_receipt"],
      }),
      loopParityTrace: {
        actual_tool_calls: [],
        observations_created: [{ observation_id: "obs:debug", source_kind: "debug_export" }],
        evidence_selected_for_answer: [],
        evidence_rejected_for_answer: [],
        terminal_selection_ran_after_observations: true,
        route_authority_ok: true,
        poison_audit_ok: true,
        terminal_authority_ok: true,
      },
    });

    expect(trace.selected_primary_intent).toBe("debug_diagnosis");
    expect(trace.prompt_interpretation.executable_operator_commands).toEqual([]);
    expect(trace.evidence_reentry_gate.violation_codes).toContain("receipt_terminal_without_reentry");
    expect(trace.solver_risk_flags).toContain("receipt_terminal_without_reentry");
  });

  it("requires follow-up reasoning for repo implementation evidence and rejects no-tool projection terminal output", () => {
    const trace = buildAskTurnSolverTrace({
      turnId: "turn:repo-implementation",
      promptText: "Where is this implemented in the repo?",
      selectedRoute: "repo_code_question",
      terminalArtifactKind: "no_tool_direct",
      finalAnswerSource: "no_tool_direct",
      payload: {
        ...authorityPayload({
          sourceTarget: "repo_code",
          allowed: ["repo_code_evidence_answer", "typed_failure", "request_user_input"],
          forbidden: ["no_tool_direct", "live_pipeline_receipt"],
        }),
        route_authority_audit: undefined,
      },
      loopParityTrace: {
        actual_tool_calls: [],
        observations_created: [],
        evidence_selected_for_answer: [],
        evidence_rejected_for_answer: [],
        terminal_selection_ran_after_observations: false,
        route_authority_ok: false,
        poison_audit_ok: true,
        terminal_authority_ok: true,
      },
    });

    expect(trace.selected_primary_intent).toBe("implementation_question");
    expect(trace.evidence_reentry_gate.violation_codes).toContain("projection_terminal_without_reentry");
    expect(trace.followup_reasoning_gate).toMatchObject({
      required: true,
      completed: false,
      reason: "repo_evidence_requires_post_evidence_reasoning",
    });
    expect(trace.solver_risk_flags).toContain("missing_followup_reasoning");
  });

  it("requires procedure-memory evidence selection before process graph or live receipts can terminal", () => {
    const trace = buildAskTurnSolverTrace({
      turnId: "turn:procedure",
      promptText: "What changed since the previous visual capture?",
      selectedRoute: "procedure_epoch_replay",
      terminalArtifactKind: "process_graph_overview",
      finalAnswerSource: "process_graph_overview",
      payload: authorityPayload({
        sourceTarget: "procedure_memory",
        allowed: ["procedure_epoch_replay", "typed_failure", "request_user_input"],
        forbidden: ["process_graph_overview", "live_pipeline_receipt"],
      }),
      loopParityTrace: {
        actual_tool_calls: [],
        observations_created: [],
        evidence_selected_for_answer: [],
        evidence_rejected_for_answer: [],
        terminal_selection_ran_after_observations: true,
        route_authority_ok: false,
        poison_audit_ok: true,
        terminal_authority_ok: true,
      },
    });

    expect(trace.selected_primary_intent).toBe("procedure_memory_question");
    expect(trace.final_arbitration.terminal_artifact_kind).not.toBe("live_pipeline_receipt");
    expect(trace.evidence_reentry_gate.violation_codes).toContain("source_observation_terminal_without_selection");
  });

  it("requires explanatory follow-up when evidence was selected for a content answer", () => {
    const gate = buildFollowupReasoningGate({
      turnId: "turn:followup",
      primaryIntent: "content_question",
      secondaryIntentKinds: [],
      sourceTarget: "visual_capture",
      terminalArtifactKind: "situation_context_pack",
      selectedEvidenceCount: 1,
      finalArbitrationRan: false,
    });

    expect(gate).toMatchObject({
      schema: "helix.followup_reasoning_gate.v1",
      required: true,
      completed: false,
      reason: "visual_content_requires_post_evidence_reasoning",
      assistant_answer: false,
      raw_content_included: false,
    });
  });
});
