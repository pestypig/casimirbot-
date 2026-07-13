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
  it("recognizes ledger-backed evidence selected by a provider-authored route product", () => {
    const turnId = "turn:provider-route-product";
    const observationRef = `${turnId}:workstation_gateway:docs.search:1`;
    const gate = buildEvidenceReentryGate({
      turnId,
      payload: {
        current_turn_artifact_ledger: [{
          artifact_id: observationRef,
          kind: "provider_gateway_observation_packet",
          payload: {
            schema: "helix.agent_step_observation_packet.v1",
            turn_id: turnId,
            capability_key: "docs.search",
            status: "succeeded",
          },
        }],
        provider_route_product_materialization: {
          schema: "helix.provider_route_product_materialization.v1",
          turn_id: turnId,
          status: "materialized",
          materialized_terminal_artifact_kind: "model_synthesized_answer",
          selected_observation_refs: [observationRef],
        },
        terminal_presentation: {
          schema: "helix.terminal_presentation.v1",
          turn_id: turnId,
          terminal_artifact_kind: "model_synthesized_answer",
          final_answer_source: "final_answer_draft",
          selected_observation_refs: [observationRef],
        },
      },
      loopTrace: {
        actual_tool_calls: [{
          tool_id: "docs.search",
          family: "docs_viewer",
          admitted: true,
          mutating: false,
          result_ref: observationRef,
        }],
        observations_created: [{
          observation_id: observationRef,
          source_kind: "docs_viewer",
        }],
        evidence_selected_for_answer: [],
        evidence_rejected_for_answer: [],
      },
      primaryIntent: "content_question",
      terminalArtifactKind: "model_synthesized_answer",
      finalAnswerSource: "final_answer_draft",
      finalArbitrationRan: true,
      sourceEvidenceRequired: true,
      allowedTerminalProducts: ["model_synthesized_answer", "typed_failure"],
    });

    expect(gate).toMatchObject({
      required: true,
      completed: true,
      selected_evidence_refs: [observationRef],
      violation_codes: [],
    });
  });

  it("completes the solver spine for a grounded provider route product after model re-entry", () => {
    const turnId = "turn:provider-scholarly-route-product";
    const normalizedRef = `${turnId}:codex_normalized:research_library_observation:1`;
    const packetRef = `${turnId}:workstation_gateway:research-library.read_document:packet`;
    const candidateRef = `${turnId}:agent_provider_terminal_candidate:codex:abc123`;
    const routeProductRef = `${candidateRef}:route_product:scholarly_research_answer`;
    const trace = buildAskTurnSolverTrace({
      turnId,
      promptText: "Use only pages 8 and 9 from that same saved Research Library paper.",
      selectedRoute: "/ask",
      terminalArtifactKind: "scholarly_research_answer",
      finalAnswerSource: "scholarly_research_answer",
      payload: {
        turn_id: turnId,
        source_target_intent: {
          target_source: "scholarly_research",
          target_kind: "saved_scholarly_full_text",
          strength: "hard",
        },
        canonical_goal_frame: {
          schema: "helix.canonical_goal_frame.v1",
          goal_kind: "agent_provider_gateway_turn",
          requested_capability: "research-library.read_document",
          required_terminal_kind: "scholarly_research_answer",
        },
        route_product_contract: {
          schema: "helix.route_product_contract.v1",
          source_target: "agent_provider_gateway_turn",
          required_terminal_kind: "scholarly_research_answer",
          allowed_terminal_artifact_kinds: ["scholarly_research_answer", "typed_failure"],
        },
        provider_route_product_materialization: {
          schema: "helix.provider_route_product_materialization.v1",
          status: "materialized",
          provider_terminal_candidate_ref: candidateRef,
          materialized_terminal_artifact_kind: "scholarly_research_answer",
          materialized_terminal_artifact_ref: routeProductRef,
          selected_observation_refs: [packetRef, normalizedRef],
        },
        provider_reasoning_reentry: {
          schema: "helix.provider_reasoning_reentry.v1",
          status: "completed",
          provider_terminal_candidate_ref: candidateRef,
          evidence_reentered: true,
          solver_completed: true,
          goal_satisfaction_compatible: true,
        },
        provider_terminal_authority_bridge: {
          schema: "helix.provider_terminal_authority_bridge.v1",
          provider_terminal_candidate_ref: candidateRef,
          terminal_authority_granted: true,
          final_visible_answer_authorized: true,
        },
        terminal_authority_single_writer: {
          selected_terminal_artifact_kind: "scholarly_research_answer",
          selected_terminal_artifact_ref: routeProductRef,
        },
        terminal_answer_authority: {
          schema: "helix.turn_terminal_authority.v1",
          terminal_artifact_kind: "scholarly_research_answer",
          final_answer_source: "scholarly_research_answer",
          server_authoritative: true,
        },
        terminal_presentation: {
          schema: "helix.terminal_presentation.v1",
          terminal_artifact_kind: "scholarly_research_answer",
          final_answer_source: "scholarly_research_answer",
          selected_observation_refs: [packetRef, normalizedRef],
        },
        current_turn_artifact_ledger: [
          {
            artifact_id: normalizedRef,
            kind: "research_library_observation",
            payload: { artifact_id: normalizedRef, selected_for_answer: true },
          },
          {
            artifact_id: packetRef,
            kind: "provider_gateway_observation_packet",
            payload: { artifact_id: packetRef, selected_for_answer: true },
          },
        ],
      },
      loopParityTrace: {
        actual_tool_calls: [{
          tool_id: "research-library.read_document",
          family: "scholarly_research",
          admitted: true,
          mutating: false,
          result_ref: packetRef,
        }],
        observations_created: [
          { observation_id: packetRef, source_kind: "scholarly_research" },
          { observation_id: normalizedRef, source_kind: "scholarly_research" },
        ],
        evidence_selected_for_answer: [],
        evidence_rejected_for_answer: [],
        poison_audit_ok: true,
        terminal_authority_ok: true,
      },
    });

    expect(trace).toMatchObject({
      completed_solver_path: true,
      route_authority_ok: true,
      terminal_authority_ok: true,
      evidence_reentry: { required: true, completed: true },
      followup_reasoning: { required: true, completed: true },
      solver_risk_flags: [],
      solver_short_circuit_flags: [],
    });
  });

  it("fails closed when a provider route product lacks completed model re-entry", () => {
    const turnId = "turn:provider-route-product-without-reentry";
    const observationRef = `${turnId}:workstation_gateway:research-library.read_document:packet`;
    const candidateRef = `${turnId}:agent_provider_terminal_candidate:codex:def456`;
    const routeProductRef = `${candidateRef}:route_product:scholarly_research_answer`;
    const trace = buildAskTurnSolverTrace({
      turnId,
      promptText: "Summarize the saved Research Library paper.",
      selectedRoute: "/ask",
      terminalArtifactKind: "scholarly_research_answer",
      finalAnswerSource: "scholarly_research_answer",
      payload: {
        turn_id: turnId,
        source_target_intent: { target_source: "scholarly_research", strength: "hard" },
        canonical_goal_frame: {
          goal_kind: "agent_provider_gateway_turn",
          required_terminal_kind: "scholarly_research_answer",
        },
        route_product_contract: {
          source_target: "agent_provider_gateway_turn",
          required_terminal_kind: "scholarly_research_answer",
          allowed_terminal_artifact_kinds: ["scholarly_research_answer", "typed_failure"],
        },
        provider_route_product_materialization: {
          status: "materialized",
          provider_terminal_candidate_ref: candidateRef,
          materialized_terminal_artifact_kind: "scholarly_research_answer",
          materialized_terminal_artifact_ref: routeProductRef,
          selected_observation_refs: [observationRef],
        },
        provider_reasoning_reentry: {
          status: "pending_helix_solver_reentry",
          provider_terminal_candidate_ref: candidateRef,
          evidence_reentered: false,
          solver_completed: false,
          goal_satisfaction_compatible: false,
        },
        provider_terminal_authority_bridge: {
          provider_terminal_candidate_ref: candidateRef,
          terminal_authority_granted: true,
          final_visible_answer_authorized: true,
        },
        terminal_authority_single_writer: {
          selected_terminal_artifact_kind: "scholarly_research_answer",
          selected_terminal_artifact_ref: routeProductRef,
        },
        terminal_answer_authority: {
          terminal_artifact_kind: "scholarly_research_answer",
          final_answer_source: "scholarly_research_answer",
          server_authoritative: true,
        },
        terminal_presentation: {
          terminal_artifact_kind: "scholarly_research_answer",
          final_answer_source: "scholarly_research_answer",
          selected_observation_refs: [observationRef],
        },
        current_turn_artifact_ledger: [{
          artifact_id: observationRef,
          kind: "provider_gateway_observation_packet",
          payload: { artifact_id: observationRef, selected_for_answer: true },
        }],
      },
      loopParityTrace: {
        actual_tool_calls: [{
          tool_id: "research-library.read_document",
          family: "scholarly_research",
          admitted: true,
          mutating: false,
          result_ref: observationRef,
        }],
        observations_created: [{ observation_id: observationRef, source_kind: "scholarly_research" }],
        evidence_selected_for_answer: [],
        evidence_rejected_for_answer: [],
        poison_audit_ok: true,
        terminal_authority_ok: true,
      },
    });

    expect(trace.completed_solver_path).toBe(false);
    expect(trace.route_authority_ok).toBe(false);
    expect(trace.evidence_reentry_gate.completed).toBe(false);
    expect(trace.evidence_reentry_gate.violation_codes.length).toBeGreaterThan(0);
  });

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

  it("allows route-authorized docs open receipts to terminal without phantom follow-up reasoning", () => {
    const trace = buildAskTurnSolverTrace({
      turnId: "turn:docs-open-receipt",
      promptText: "Search docs for Helix Ask console debug and tell me which document path you found.",
      selectedRoute: "dispatch:act",
      terminalArtifactKind: "doc_open_receipt",
      finalAnswerSource: "doc_open_receipt",
      payload: {
        canonical_goal_frame: {
          schema: "helix.canonical_goal_frame.v1",
          goal_kind: "doc_open_best",
          required_terminal_kind: "doc_open_receipt",
        },
        route_product_contract: {
          schema: "helix.route_product_contract.v1",
          source_target: "docs_viewer",
          allowed_terminal_artifact_kinds: ["doc_open_receipt", "typed_failure", "request_user_input"],
          forbidden_terminal_artifact_kinds: ["direct_answer_text"],
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
        goal_satisfaction_evaluation: {
          satisfaction: "satisfied",
          next_decision: "allow_terminal",
        },
      },
      loopParityTrace: {
        actual_tool_calls: [{
          tool_id: "docs-viewer.open_doc_by_path",
          family: "docs_viewer",
          admitted: true,
          mutating: false,
          result_ref: "ask:docs-open-receipt:doc_open_receipt",
        }],
        observations_created: [{
          observation_id: "ask:docs-open-receipt:doc_open_receipt",
          source_kind: "docs_viewer",
        }],
        evidence_selected_for_answer: ["ask:docs-open-receipt:doc_open_receipt"],
        evidence_rejected_for_answer: [],
        terminal_selection_ran_after_observations: true,
        route_authority_ok: true,
        poison_audit_ok: true,
        terminal_authority_ok: true,
      },
    });

    expect(trace.followup_reasoning_gate).toMatchObject({
      required: false,
      completed: true,
      reason: "simple_no_source_turn",
    });
    expect(trace.solver_risk_flags).not.toContain("tool_result_terminal_without_reasoning");
    expect(trace.solver_risk_flags).not.toContain("missing_followup_reasoning");
    expect(trace.completed_solver_path).toBe(true);
  });

  it("treats compound synthesis support refs as selected evidence for repo plus theory answers", () => {
    const repoRef = "turn:compound:repo_code_evidence_observation";
    const theoryRef = "turn:compound:helix_theory_context_reflection_tool_receipt";
    const trace = buildAskTurnSolverTrace({
      turnId: "turn:compound",
      promptText: "how tell me from the code repo search, how does the locator work for theory badge graph?",
      selectedRoute: "/ask/turn/stream",
      terminalArtifactKind: "compound_evidence_synthesis_answer",
      finalAnswerSource: "compound_evidence_synthesis_answer",
      payload: {
        canonical_goal_frame: {
          schema: "helix.canonical_goal_frame.v1",
          goal_kind: "agent_provider_gateway_turn",
          required_terminal_kind: "compound_evidence_synthesis_answer",
        },
        route_product_contract: {
          schema: "helix.route_product_contract.v1",
          source_target: "agent_provider_gateway_turn",
          allowed_terminal_artifact_kinds: [
            "final_answer_draft",
            "compound_evidence_synthesis_answer",
            "model_synthesized_answer",
          ],
          forbidden_terminal_artifact_kinds: ["tool_receipt"],
        },
        terminal_answer_authority: {
          schema: "helix.turn_terminal_authority.v1",
          terminal_artifact_kind: "compound_evidence_synthesis_answer",
          final_answer_source: "compound_evidence_synthesis_answer",
          server_authoritative: true,
        },
        terminal_presentation: {
          schema: "helix.terminal_presentation.v1",
          terminal_artifact_kind: "compound_evidence_synthesis_answer",
          final_answer_source: "compound_evidence_synthesis_answer",
          selected_observation_refs: [theoryRef, repoRef],
        },
        current_turn_artifact_ledger: [
          {
            artifact_id: theoryRef,
            kind: "helix_theory_context_reflection_tool_receipt",
            payload: { artifact_id: theoryRef, selected_for_answer: true },
          },
          {
            artifact_id: repoRef,
            kind: "repo_code_evidence_observation",
            payload: { artifact_id: repoRef, selected_for_answer: true },
          },
        ],
      },
      loopParityTrace: {
        actual_tool_calls: [
          {
            tool_id: "theory-badge-graph.reflect_discussion_context",
            family: "theory_locator",
            admitted: true,
            mutating: false,
            result_ref: theoryRef,
          },
          {
            tool_id: "repo.search",
            family: "repo_code",
            admitted: true,
            mutating: false,
            result_ref: repoRef,
          },
        ],
        observations_created: [
          { observation_id: theoryRef, source_kind: "theory_locator" },
          { observation_id: repoRef, source_kind: "repo_code" },
        ],
        evidence_selected_for_answer: [],
        evidence_rejected_for_answer: [],
        terminal_selection_ran_after_observations: true,
        terminal_authority_ok: true,
      },
    });

    expect(trace.evidence_results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ result_id: theoryRef, selected_for_answer: true }),
        expect.objectContaining({ result_id: repoRef, selected_for_answer: true }),
      ]),
    );
    expect(trace.evidence_reentry_gate).toMatchObject({
      completed: true,
      violation_codes: [],
      selected_evidence_refs: expect.arrayContaining([theoryRef, repoRef]),
    });
    expect(trace.followup_reasoning_gate).toMatchObject({
      required: true,
      completed: true,
    });
    expect(trace.solver_risk_flags).not.toContain("tool_result_terminal_without_reasoning");
    expect(trace.solver_risk_flags).not.toContain("missing_followup_reasoning");
    expect(trace.completed_solver_path).toBe(true);
  });

  it("selects Moral Graph observations for agent-provider terminal candidates", () => {
    const turnId = "turn:moral-graph-provider-answer";
    const moralRef = `${turnId}:codex_normalized:moral_graph_reflection:1`;
    const packetRef = `${turnId}:workstation_gateway:moral-graph.reflect_context:packet`;
    const gate = buildEvidenceReentryGate({
      turnId,
      payload: {
        canonical_goal_frame: {
          schema: "helix.canonical_goal_frame.v1",
          goal_kind: "agent_provider_gateway_turn",
          requested_capability: "moral-graph.reflect_context",
          required_terminal_kind: "agent_provider_terminal_candidate",
        },
        terminal_presentation: {
          schema: "helix.terminal_presentation.v1",
          terminal_artifact_kind: "agent_provider_terminal_candidate",
          final_answer_source: "agent_provider_terminal_candidate",
          selected_observation_refs: [moralRef],
        },
        provider_terminal_candidate: {
          schema: "helix.agent_provider_terminal_candidate.v1",
          grounded_in_observation_refs: [packetRef],
          normalized_observation_refs: [moralRef],
        },
        provider_terminal_authority_bridge: {
          schema: "helix.provider_terminal_authority_bridge.v1",
          gateway_observation_refs: [packetRef],
          normalized_observation_refs: [moralRef],
        },
        current_turn_artifact_ledger: [
          {
            artifact_id: moralRef,
            kind: "moral_graph_reflection",
            capability_key: "moral-graph.reflect_context",
            payload_schema: "helix.moral_graph_reflection_observation.v1",
            payload: {
              schema: "helix.moral_graph_reflection_observation.v1",
              artifact_id: moralRef,
            },
          },
          {
            artifact_id: packetRef,
            kind: "provider_gateway_observation_packet",
            capability_key: "moral-graph.reflect_context",
            payload_schema: "helix.agent_step_observation_packet.v1",
          },
        ],
      },
      loopTrace: {
        actual_tool_calls: [],
        observations_created: [{ observation_id: moralRef, source_kind: "moral_graph_reflection" }],
        evidence_selected_for_answer: [],
        evidence_rejected_for_answer: [],
      },
      primaryIntent: "content_question",
      terminalArtifactKind: "agent_provider_terminal_candidate",
      finalAnswerSource: "agent_provider_terminal_candidate",
      finalArbitrationRan: true,
      sourceEvidenceRequired: true,
      allowedTerminalProducts: ["agent_provider_terminal_candidate", "typed_failure"],
    });

    expect(gate.selected_evidence_refs).toEqual(expect.arrayContaining([moralRef, packetRef]));
    expect(gate.violation_codes).not.toContain("source_observation_terminal_without_selection");
    expect(gate.completed).toBe(true);
  });

  it("selects current-turn Docs observations from an authorized provider terminal presentation", () => {
    const turnId = "turn:docs-provider-answer";
    const docsRef = `${turnId}:workstation_gateway:docs.search:packet`;
    const gate = buildEvidenceReentryGate({
      turnId,
      payload: {
        terminal_presentation: {
          schema: "helix.terminal_presentation.v1",
          terminal_artifact_kind: "agent_provider_terminal_candidate",
          final_answer_source: "agent_provider_terminal_candidate",
          selected_observation_refs: [docsRef, "turn:prior:docs.search:stale"],
        },
        current_turn_artifact_ledger: [
          {
            artifact_id: docsRef,
            kind: "provider_gateway_observation_packet",
            capability_key: "docs.search",
          },
        ],
      },
      loopTrace: {
        actual_tool_calls: [],
        observations_created: [{ observation_id: docsRef, source_kind: "docs.search" }],
        evidence_selected_for_answer: [],
        evidence_rejected_for_answer: [],
      },
      primaryIntent: "content_question",
      terminalArtifactKind: "agent_provider_terminal_candidate",
      finalAnswerSource: "agent_provider_terminal_candidate",
      finalArbitrationRan: true,
      sourceEvidenceRequired: true,
      allowedTerminalProducts: ["model_synthesized_answer", "typed_failure"],
    });

    expect(gate.selected_evidence_refs).toEqual([docsRef]);
    expect(gate.violation_codes).toEqual([]);
    expect(gate.completed).toBe(true);
  });

  it("selects Theory Graph observations for a route-authorized Theory answer", () => {
    const turnId = "turn:theory-graph-provider-answer";
    const theoryRef = `${turnId}:codex_normalized:helix_theory_context_reflection_tool_receipt:1`;
    const packetRef = `${turnId}:workstation_gateway:theory-badge-graph.reflect_discussion_context:packet`;
    const gate = buildEvidenceReentryGate({
      turnId,
      payload: {
        committed_ask_route: {
          schema: "helix.committed_ask_route.v1",
          canonical_goal: {
            goal_kind: "theory_locator",
            required_terminal_kind: "theory_context_reflection_answer",
            allowed_terminal_artifact_kinds: ["theory_context_reflection_answer"],
          },
        },
        canonical_goal_frame: {
          schema: "helix.canonical_goal_frame.v1",
          goal_kind: "theory_locator",
          requested_capability: "theory-badge-graph.reflect_discussion_context",
          required_terminal_kind: "theory_context_reflection_answer",
        },
        theory_context_reflection_answer: {
          schema: "helix.theory_context_reflection_answer.v1",
          selected_observation_refs: [theoryRef],
          support_refs: [packetRef],
        },
        current_turn_artifact_ledger: [
          {
            artifact_id: theoryRef,
            kind: "helix_theory_context_reflection_tool_receipt",
            capability_key: "theory-badge-graph.reflect_discussion_context",
            payload: {
              schema: "helix.theory_context_reflection_observation.v1",
              artifact_id: theoryRef,
            },
          },
          {
            artifact_id: packetRef,
            kind: "provider_gateway_observation_packet",
            capability_key: "theory-badge-graph.reflect_discussion_context",
            payload_schema: "helix.agent_step_observation_packet.v1",
          },
        ],
      },
      loopTrace: {
        actual_tool_calls: [{
          tool_id: "theory-badge-graph.reflect_discussion_context",
          family: "theory_locator",
          admitted: true,
          mutating: false,
          result_ref: theoryRef,
        }],
        observations_created: [{ observation_id: theoryRef, source_kind: "theory_locator" }],
        evidence_selected_for_answer: [],
        evidence_rejected_for_answer: [],
      },
      primaryIntent: "general_reasoning",
      terminalArtifactKind: "theory_context_reflection_answer",
      finalAnswerSource: "theory_context_reflection_answer",
      finalArbitrationRan: true,
      sourceEvidenceRequired: true,
      allowedTerminalProducts: ["theory_context_reflection_answer", "typed_failure"],
    });

    expect(gate.selected_evidence_refs).toEqual(expect.arrayContaining([theoryRef, packetRef]));
    expect(gate.receipts_not_reentered).toEqual([]);
    expect(gate.violation_codes).toEqual([]);
    expect(gate.completed).toBe(true);
  });

  it("keeps solver final arbitration aligned with authoritative workstation terminal metadata", () => {
    const payload = {
      ...authorityPayload({
        sourceTarget: "workspace_panel",
        allowed: ["workstation_tool_evaluation", "typed_failure", "request_user_input"],
      }),
      canonical_goal_frame: {
        schema: "helix.canonical_goal_frame.v1",
        goal_kind: "calculator_solve",
        required_terminal_kind: "workstation_tool_evaluation",
      },
      terminal_artifact_kind: "model_synthesized_answer",
      final_answer_source: "final_answer_draft",
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        terminal_artifact_kind: "workstation_tool_evaluation",
        final_answer_source: "workstation_tool_evaluation",
        server_authoritative: true,
      },
      terminal_authority_single_writer: {
        schema: "helix.terminal_authority_single_writer_result.v1",
        selected_terminal_artifact_kind: "workstation_tool_evaluation",
        source: "workstation_tool_evaluation",
        visible_text: "Calculator verification plan completed.\nExpression: 2+2\nResult: 4",
      },
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        terminal_artifact_kind: "workstation_tool_evaluation",
      },
      resolved_turn_summary: {
        terminal_artifact_kind: "workstation_tool_evaluation",
        final_answer_source: "workstation_tool_evaluation",
      },
      goal_satisfaction_evaluation: {
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
    };

    const trace = buildAskTurnSolverTrace({
      turnId: "turn:calculator-authority-mirror",
      promptText: "Call scientific-calculator.solve_expression with 2+2 and answer from the workstation tool evaluation.",
      selectedRoute: "dispatch:act",
      terminalArtifactKind: "model_synthesized_answer",
      finalAnswerSource: "final_answer_draft",
      payload,
      loopParityTrace: {
        actual_tool_calls: [{
          tool_id: "scientific-calculator.solve_expression",
          family: "calculator",
          admitted: true,
          mutating: false,
          result_ref: "turn:calculator-authority-mirror:calculator_receipt",
        }],
        observations_created: [{
          observation_id: "turn:calculator-authority-mirror:workstation_tool_evaluation",
          source_kind: "workstation_tool_evaluation",
        }],
        evidence_selected_for_answer: ["turn:calculator-authority-mirror:workstation_tool_evaluation"],
        evidence_rejected_for_answer: [],
        terminal_selection_ran_after_observations: true,
        route_authority_ok: true,
        poison_audit_ok: true,
        terminal_authority_ok: true,
      },
    });

    expect(trace.final_arbitration.terminal_artifact_kind).toBe("workstation_tool_evaluation");
    expect(trace.final_arbitration.final_answer_source).toBe("workstation_tool_evaluation");
    expect(payload.terminal_artifact_kind).toBe("workstation_tool_evaluation");
    expect(payload.final_answer_source).toBe("workstation_tool_evaluation");
  });

  it("lets a current-turn provider answer supersede stale workstation terminal metadata", () => {
    const turnId = "turn:docs-provider-supersedes-workstation";
    const docsRef = `${turnId}:workstation_gateway:docs.search:packet`;
    const payload = {
      ...authorityPayload({
        sourceTarget: "docs_viewer",
        allowed: ["model_synthesized_answer", "typed_failure"],
      }),
      terminal_artifact_kind: "workstation_tool_evaluation",
      final_answer_source: "workstation_tool_evaluation",
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        terminal_artifact_kind: "workstation_tool_evaluation",
        final_answer_source: "workstation_tool_evaluation",
        server_authoritative: true,
      },
      terminal_authority_single_writer: {
        schema: "helix.terminal_authority_single_writer_result.v1",
        selected_terminal_artifact_kind: "workstation_tool_evaluation",
        source: "workstation_tool_evaluation",
      },
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        turn_id: turnId,
        terminal_artifact_kind: "model_synthesized_answer",
        final_answer_source: "agent_provider_terminal_candidate",
        terminal_authority_ref: `${turnId}:agent_provider_terminal_candidate:codex:test`,
        selected_observation_refs: [docsRef],
      },
      current_turn_artifact_ledger: [{
        artifact_id: docsRef,
        kind: "provider_gateway_observation_packet",
        capability_key: "docs.search",
      }],
    };

    const trace = buildAskTurnSolverTrace({
      turnId,
      promptText: "Use only the current document and summarize its unresolved blockers.",
      selectedRoute: "agent_provider_gateway_turn",
      terminalArtifactKind: "agent_provider_terminal_candidate",
      finalAnswerSource: "agent_provider_terminal_candidate",
      payload,
      loopParityTrace: {
        actual_tool_calls: [],
        observations_created: [{ observation_id: docsRef, source_kind: "docs.search" }],
        evidence_selected_for_answer: [],
        evidence_rejected_for_answer: [],
        terminal_selection_ran_after_observations: true,
        route_authority_ok: true,
        poison_audit_ok: true,
        terminal_authority_ok: true,
      },
    });

    expect(trace.final_arbitration).toMatchObject({
      terminal_artifact_kind: "agent_provider_terminal_candidate",
      final_answer_source: "agent_provider_terminal_candidate",
    });
    expect(trace.evidence_reentry_gate).toMatchObject({
      completed: true,
      violation_codes: [],
      selected_evidence_refs: [docsRef],
    });
    expect(trace.solver_risk_flags).not.toContain("tool_result_terminal_without_reasoning");
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

  it("does not hard-fail admitted read-only research and locator calls because file writes were negated", () => {
    const trace = buildAskTurnSolverTrace({
      turnId: "turn:compound-readonly-contextual",
      promptText:
        "Do not write files. Use scholarly papers and citations to research microtubule coherence, then place it on the theory badge graph with scale bands and uncertainty mode.",
      selectedRoute: "dispatch:act",
      terminalArtifactKind: "typed_failure",
      finalAnswerSource: "typed_failure",
      payload: {
        ...authorityPayload({
          sourceTarget: "scholarly_research",
          allowed: ["final_answer_draft", "scholarly_research_answer", "theory_context_reflection_answer", "typed_failure"],
          forbidden: ["workspace_action_receipt", "note_update_receipt", "direct_answer_text"],
        }),
        tool_call_admission_decision: {
          admitted_tool_families: ["scholarly_research", "theory_locator"],
          forbidden_tool_families: ["workstation_action", "notes"],
        },
      },
      loopParityTrace: {
        actual_tool_calls: [
          {
            tool_id: "scholarly-research.lookup_papers",
            family: "scholarly_research",
            admitted: true,
            mutating: false,
            result_ref: "obs:papers",
          },
          {
            tool_id: "helix_ask.reflect_theory_context",
            family: "theory_locator",
            admitted: true,
            mutating: false,
            result_ref: "obs:theory",
          },
        ],
        unexpected_tool_calls: [],
        observations_created: [
          { observation_id: "obs:papers", source_kind: "scholarly_research" },
          { observation_id: "obs:theory", source_kind: "theory_locator" },
        ],
        evidence_selected_for_answer: ["obs:papers", "obs:theory"],
        evidence_rejected_for_answer: [],
        terminal_selection_ran_after_observations: true,
        route_authority_ok: true,
        poison_audit_ok: true,
        terminal_authority_ok: true,
      },
    });

    expect(trace.prompt_interpretation.contextual_tool_mentions.length).toBeGreaterThan(0);
    expect(trace.contextual_tool_audit).toMatchObject({
      contextual_tool_mention_present: true,
      contextual_tool_family_blocked: true,
      blocked_contextual_tool_executed: false,
      blocked_families: expect.arrayContaining(["workstation_action", "notes"]),
      executed_blocked_tool_ids: [],
    });
    expect(trace.contextual_tool_audit.blocked_families).not.toEqual(
      expect.arrayContaining(["scholarly_research", "theory_locator"]),
    );
    expect(trace.solver_risk_flags).not.toContain("blocked_contextual_tool_executed");
    expect(trace.solver_risk_flags.map(String)).not.toContain("contextual_tool_mention_executed");
  });

  it("hard-fails only when a contextual write negation matches an executed blocked family", () => {
    const trace = buildAskTurnSolverTrace({
      turnId: "turn:blocked-contextual-note",
      promptText: "Do not write files. Create a note with the research summary.",
      selectedRoute: "dispatch:act",
      terminalArtifactKind: "workspace_action_receipt",
      finalAnswerSource: "workspace_action_receipt",
      payload: authorityPayload({
        sourceTarget: "active_note",
        allowed: ["workspace_action_receipt", "typed_failure"],
        forbidden: [],
      }),
      loopParityTrace: {
        actual_tool_calls: [
          {
            tool_id: "workstation-notes.create_note",
            family: "notes",
            admitted: false,
            mutating: true,
            result_ref: "receipt:note",
          },
        ],
        unexpected_tool_calls: ["workstation-notes.create_note"],
        observations_created: [],
        evidence_selected_for_answer: [],
        evidence_rejected_for_answer: [],
        terminal_selection_ran_after_observations: true,
        route_authority_ok: true,
        poison_audit_ok: true,
        terminal_authority_ok: true,
      },
    });

    expect(trace.contextual_tool_audit).toMatchObject({
      contextual_tool_mention_present: true,
      contextual_tool_family_blocked: true,
      blocked_contextual_tool_executed: true,
      executed_blocked_tool_ids: ["workstation-notes.create_note"],
    });
    expect(trace.solver_risk_flags).toContain("blocked_contextual_tool_executed");
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
