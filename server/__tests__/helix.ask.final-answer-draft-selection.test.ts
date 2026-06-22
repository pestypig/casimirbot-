import { describe, expect, it } from "vitest";

import { evaluateFinalAnswerDraftQualityGate } from "../services/helix-ask/final-answer-draft-quality-gate";
import { materializeFinalAnswerDraftTerminal } from "../services/helix-ask/final-answer-draft-terminal-materializer";
import { applyHelixProjectionMismatchGate } from "../services/helix-ask/projection-mismatch-gate";
import {
  applyHelixTerminalAuthoritySingleWriter,
  applyTerminalProjectionKindGuard,
  syncHelixTypedFailureAuthorityPublicMirrors,
} from "../services/helix-ask/terminal-authority-single-writer";

const modelOnlyContract = (turnId: string) => ({
  schema: "helix.route_product_contract.v1",
  turn_id: turnId,
  thread_id: "thread:test",
  source_target: "model_only",
  allowed_terminal_artifact_kinds: ["direct_answer_text", "model_synthesized_answer", "typed_failure", "request_user_input"],
  forbidden_terminal_artifact_kinds: ["workspace_action_receipt", "client_projection"],
  required_artifact_refs: [],
  precedence_reason: "test",
  assistant_answer: false,
  raw_content_included: false,
});

const repoContract = (turnId: string) => ({
  schema: "helix.route_product_contract.v1",
  turn_id: turnId,
  thread_id: "thread:test",
  source_target: "repo_code",
  allowed_terminal_artifact_kinds: ["repo_code_evidence_answer", "typed_failure", "request_user_input"],
  forbidden_terminal_artifact_kinds: ["direct_answer_text", "model_synthesized_answer", "workspace_action_receipt"],
  side_artifact_kinds_allowed: ["repo_code_evidence_observation", "final_answer_draft", "repo_answer_text_quality_gate"],
  required_artifact_refs: [],
  precedence_reason: "test",
  assistant_answer: false,
  raw_content_included: false,
});

const scholarlyContract = (turnId: string) => ({
  schema: "helix.route_product_contract.v1",
  turn_id: turnId,
  thread_id: "thread:test",
  source_target: "scholarly_research",
  allowed_terminal_artifact_kinds: ["scholarly_research_answer", "typed_failure", "request_user_input"],
  forbidden_terminal_artifact_kinds: ["direct_answer_text", "model_synthesized_answer", "doc_summary", "repo_code_evidence_answer"],
  side_artifact_kinds_allowed: ["scholarly_research_observation", "scholarly_full_text_observation", "final_answer_draft"],
  required_artifact_refs: [],
  precedence_reason: "test",
  assistant_answer: false,
  raw_content_included: false,
});

const liveSourceMailContract = (turnId: string) => ({
  schema: "helix.route_product_contract.v1",
  turn_id: turnId,
  thread_id: "thread:test",
  source_target: "live_source_mailbox",
  allowed_terminal_artifact_kinds: ["model_synthesized_answer", "typed_failure", "request_user_input"],
  forbidden_terminal_artifact_kinds: ["tool_receipt", "workspace_action_receipt", "live_environment_tool_observation"],
  side_artifact_kinds_allowed: ["stage_play_processed_mail_packet", "final_answer_draft"],
  required_artifact_refs: [],
  precedence_reason: "test",
  assistant_answer: false,
  raw_content_included: false,
});

const addModelOnlyRuntimeProof = (payload: Record<string, unknown>): void => {
  payload.agent_runtime_loop = {
    iterations: [
      {
        iteration: 1,
        next_step: "answer",
        chosen_capability: "model.direct_answer",
        decision_authority: "llm",
        observation_role: "model_answer_draft",
      },
    ],
  };
  payload.goal_satisfaction_evaluation = {
    satisfaction: "satisfied",
    next_decision: "allow_terminal",
  };
};

const addRepoRuntimeProof = (payload: Record<string, unknown>, observationRef: string): void => {
  payload.agent_runtime_loop = {
    iterations: [
      {
        iteration: 1,
        next_step: "next_action",
        chosen_capability: "repo-code.search_concept",
        decision_authority: "llm",
        observed_artifact_refs: [observationRef],
      },
      {
        iteration: 2,
        next_step: "answer",
        chosen_capability: "model.synthesize_from_repo_evidence",
        decision_authority: "llm",
        observation_role: "model_answer_draft",
      },
    ],
  };
  payload.goal_satisfaction_evaluation = {
    satisfaction: "satisfied",
    next_decision: "allow_terminal",
  };
};

const addScholarlyRuntimeProof = (
  payload: Record<string, unknown>,
  lookupRef: string,
  fullTextRef: string,
): void => {
  payload.agent_runtime_loop = {
    iterations: [
      {
        iteration: 1,
        next_step: "next_action",
        chosen_capability: "scholarly-research.lookup_papers",
        decision_authority: "llm",
        observed_artifact_refs: [lookupRef],
      },
      {
        iteration: 2,
        next_step: "next_action",
        chosen_capability: "scholarly-research.fetch_full_text",
        decision_authority: "llm",
        observed_artifact_refs: [fullTextRef],
      },
      {
        iteration: 3,
        next_step: "answer",
        chosen_capability: "model.synthesize_from_scholarly_research",
        decision_authority: "llm",
        observation_role: "model_answer_draft",
      },
    ],
  };
  payload.goal_satisfaction_evaluation = {
    satisfaction: "satisfied",
    next_decision: "allow_terminal",
  };
};

const addCalculatorRuntimeProof = (
  payload: Record<string, unknown>,
  observationRef: string,
  artifactKind = "workstation_tool_evaluation",
): void => {
  payload.agent_step_decision = {
    schema: "helix.agent_step_decision.v1",
    decision_id: `${payload.turn_id}:decision:1`,
    chosen_capability: "scientific-calculator.solve_expression",
    decision_authority: "llm",
    decision_timing: "pre_action",
    assistant_answer: false,
    raw_content_included: false,
  };
  payload.runtime_tool_call = {
    schema: "helix.runtime_tool_call.v1",
    capability_key: "scientific-calculator.solve_expression",
    artifact_ref: observationRef,
    assistant_answer: false,
    raw_content_included: false,
  };
  payload.agent_runtime_loop = {
    schema: "helix.agent_runtime_loop.v1",
    iterations: [
      {
        iteration: 1,
        decision_id: `${payload.turn_id}:decision:1`,
        next_step: "next_action",
        chosen_capability: "scientific-calculator.solve_expression",
        executed_action_key: "scientific-calculator.solve_expression",
        decision_authority: "llm",
        decision_timing: "pre_action",
        observed_artifact_refs: [observationRef],
        artifact_refs: [observationRef],
        tool_observation: {
          kind: artifactKind,
          artifact_id: observationRef,
          status: "completed",
          ok: true,
        },
      },
      {
        iteration: 2,
        decision_id: `${payload.turn_id}:decision:2`,
        next_step: "answer",
        chosen_capability: "model.synthesize_from_tool_observation",
        decision_authority: "llm",
        decision_timing: "post_observation",
        observation_role: "model_answer_draft",
      },
    ],
    assistant_answer: false,
    raw_content_included: false,
  };
  payload.goal_satisfaction_evaluation = {
    schema: "helix.goal_satisfaction_evaluation.v1",
    canonical_goal_kind: "calculator_solve",
    required_terminal_kind: "workstation_tool_evaluation",
    terminal_artifact_kind: "workstation_tool_evaluation",
    satisfaction: "satisfied",
    next_decision: "allow_terminal",
    assistant_answer: false,
    raw_content_included: false,
  };
};

describe("final_answer_draft terminal selection", () => {
  it("selects a later complete final draft over an earlier weak direct answer", () => {
    const turnId = "ask:test:later-draft-over-direct";
    const draftText = [
      "- Charge: electrons are negative, while protons are positive.",
      "- Mass: electrons are much lighter than protons.",
      "- Role in atoms: electrons occupy shells/clouds around the nucleus, while protons sit in the nucleus and define element identity.",
      "Practical consequence: opposite charges bind electrons to nuclei, enabling stable atoms and chemistry.",
    ].join("\n");
    const artifacts = [
      {
        artifact_id: `${turnId}:direct`,
        kind: "direct_answer_text",
        payload: {
          schema: "helix.direct_answer_text.v1",
          text: "An electron is a fundamental subatomic particle with a negative electric charge.",
        },
      },
      {
        artifact_id: `${turnId}:draft`,
        kind: "final_answer_draft",
        payload: {
          schema: "helix.final_answer_draft.v1",
          text: draftText,
          authority: "llm_post_observation_composer",
        },
      },
    ];
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      thread_id: "thread:test",
      active_prompt: "Compare an electron and a proton in three ways: charge, mass, and role in atoms. Then give one practical consequence of those differences.",
      route_product_contract: modelOnlyContract(turnId),
      canonical_goal_frame: {
        goal_kind: "model_only_concept",
        required_terminal_kind: "direct_answer_text",
      },
      current_turn_artifact_ledger: artifacts,
      selected_final_answer: "An electron is a fundamental subatomic particle with a negative electric charge.",
      final_answer_source: "model_direct_answer",
      terminal_artifact_kind: "direct_answer_text",
    };
    addModelOnlyRuntimeProof(payload);

    const result = applyHelixTerminalAuthoritySingleWriter({
      turnId,
      threadId: "thread:test",
      payload,
      artifactLedger: artifacts,
    });

    expect(result.selected_terminal_artifact_kind).toBe("model_synthesized_answer");
    expect(result.visible_text).toBe(draftText);
    expect(result.integrity.selected_over_direct_answer_text).toBe(true);
    expect(result.rejected_candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "direct_answer_text", reason: "later_valid_final_answer_draft" }),
      ]),
    );
    expect(payload.selected_final_answer).toBe(draftText);
    expect((payload.final_answer_draft_selection as Record<string, unknown>).selected_over_direct_answer_text).toBe(true);
  });

  it("keeps fail-closed compound coverage from being re-promoted by a final draft", () => {
    const turnId = "ask:test:compound-fail-closed-over-draft";
    const draftText = "This draft looks complete, but the compound coverage gate has already failed closed.";
    const artifacts = [
      {
        artifact_id: `${turnId}:draft`,
        kind: "final_answer_draft",
        payload: {
          schema: "helix.final_answer_draft.v1",
          text: draftText,
          authority: "llm_post_observation_composer",
        },
      },
    ];
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      thread_id: "thread:test",
      active_prompt: "Answer two required parts.",
      route_product_contract: modelOnlyContract(turnId),
      canonical_goal_frame: {
        goal_kind: "model_only_concept",
        required_terminal_kind: "model_synthesized_answer",
      },
      current_turn_artifact_ledger: artifacts,
      selected_final_answer: draftText,
      final_answer_source: "final_answer_draft",
      terminal_artifact_kind: "model_synthesized_answer",
      compound_prompt_coverage_gate: {
        schema: "helix.compound_prompt_coverage_gate.v1",
        applies: true,
        passed: false,
        decision: "FAIL_CLOSED",
        unresolved_requirement_ids: ["R2"],
        resolutions: [
          {
            requirement_id: "R1",
            status: "answered",
          },
          {
            requirement_id: "R2",
            status: "failed_closed",
          },
        ],
      },
      goal_satisfaction_evaluation: {
        satisfaction: "not_satisfied",
        next_decision: "fail_closed",
      },
    };

    const result = applyHelixTerminalAuthoritySingleWriter({
      turnId,
      threadId: "thread:test",
      payload,
      artifactLedger: artifacts,
    });

    expect(result.selected_terminal_artifact_kind).toBe("typed_failure");
    expect(result.source).toBe("typed_failure");
    expect(result.visible_text).toContain("compound");
    expect(payload.ok).toBe(false);
    expect(payload.final_status).toBe("final_failure");
    expect(payload.terminal_artifact_kind).toBe("typed_failure");
    expect(payload.final_answer_source).toBe("typed_failure");
    expect(payload.terminal_error_code).toBe("compound_prompt_coverage_incomplete");
    expect(payload.selected_final_answer).not.toBe(draftText);
    expect(result.rejected_candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "model_synthesized_answer",
          reason: "missing_required_observation",
        }),
      ]),
    );
  });

  it("uses the first incomplete compound subgoal rail as the terminal typed failure", () => {
    const turnId = "ask:test:compound-subgoal-rail-terminal-failure";
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      thread_id: "thread:test",
      ok: true,
      response_type: "final_answer",
      final_status: "final_answer",
      status: "final_answer",
      selected_final_answer: "Stale compound draft.",
      final_answer_source: "final_answer_draft",
      terminal_artifact_kind: "model_synthesized_answer",
      compound_prompt_coverage_gate: {
        schema: "helix.compound_prompt_coverage_gate.v1",
        applies: true,
        passed: false,
        decision: "FAIL_CLOSED",
        unresolved_requirement_ids: ["calculator-subgoal"],
      },
      capability_itinerary_execution_state: {
        schema: "helix.capability_itinerary_execution_state.v1",
        applies: true,
        compound_subgoal_ledger: [
          {
            subgoal_id: "docs-subgoal",
            requested_capability: "docs-viewer.locate_in_doc",
            selected_capability: "docs-viewer.locate_in_doc",
            executed_capability: "docs-viewer.locate_in_doc",
            observation_ref: `${turnId}:docs-location`,
            satisfaction: "satisfied",
            rail_status: "complete",
            rail_failure_code: null,
          },
          {
            subgoal_id: "calculator-subgoal",
            requested_capability: "scientific-calculator.solve_expression",
            selected_capability: "scientific-calculator.solve_expression",
            executed_capability: null,
            observation_ref: null,
            satisfaction: "failed",
            rail_status: "fail_closed",
            rail_failure_code: "missing_required_arg:latex",
            first_broken_rail: "capability_execution",
            repair_target: "subgoal_argument_extraction",
          },
        ],
      },
      goal_satisfaction_evaluation: {
        satisfaction: "not_satisfied",
        next_decision: "fail_closed",
      },
    };

    const result = applyHelixTerminalAuthoritySingleWriter({
      turnId,
      threadId: "thread:test",
      payload,
      artifactLedger: [],
    });

    expect(result.selected_terminal_artifact_kind).toBe("typed_failure");
    expect(payload.final_status).toBe("final_failure");
    expect(payload.terminal_error_code).toBe("missing_required_arg:latex");
    expect(payload.selected_final_answer).toContain("scientific-calculator.solve_expression");
    expect(payload.selected_final_answer).toContain("missing required argument latex");
    expect(payload.typed_failure).toMatchObject({
      error_code: "missing_required_arg:latex",
      compound_rail_failure_code: "missing_required_arg:latex",
      compound_first_broken_rail: "capability_execution",
      compound_repair_target: "subgoal_argument_extraction",
      first_incomplete_compound_subgoal_id: "calculator-subgoal",
    });
  });

  it("syncs public mirrors from typed-failure authority after stale final-draft projection", () => {
    const turnId = "ask:test:typed-failure-authority-public-mirror";
    const staleDraft = "This stale draft should not remain the public answer.";
    const failureText =
      "I could not complete this compound turn because required prompt items failed closed or remain unresolved: R2.";
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      thread_id: "thread:test",
      ok: true,
      response_type: "final_answer",
      final_status: "final_answer",
      status: "final_answer",
      selected_final_answer: staleDraft,
      answer: staleDraft,
      text: staleDraft,
      assistant_answer: staleDraft,
      terminal_artifact_kind: "model_synthesized_answer",
      final_answer_source: "final_answer_draft",
      terminal_error_code: "terminal_consistency_violation",
      compound_prompt_coverage_gate: {
        schema: "helix.compound_prompt_coverage_gate.v1",
        applies: true,
        passed: false,
        decision: "FAIL_CLOSED",
        unresolved_requirement_ids: ["R2"],
      },
      terminal_answer_authority: {
        schema: "helix.terminal_authority.v1",
        thread_id: "thread:test",
        turn_id: turnId,
        terminal_kind: "failure",
        terminal_artifact_kind: "typed_failure",
        final_answer_source: "typed_failure",
        terminal_text_preview: failureText,
        server_authoritative: true,
        assistant_answer: false,
      },
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        turn_id: turnId,
        terminal_artifact_kind: "model_synthesized_answer",
        concise_text: staleDraft,
        assistant_answer: false,
        raw_content_included: false,
      },
      typed_failure: {
        schema: "helix.typed_failure.v1",
        error_code: "terminal_consistency_violation",
        text: "Old consistency failure.",
        answer_text: "Old consistency failure.",
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: `${turnId}:terminal_consistency:typed_failure`,
          turn_id: turnId,
          kind: "typed_failure",
          payload: {
            schema: "helix.typed_failure.v1",
            error_code: "terminal_consistency_violation",
            text: "Old consistency failure.",
            answer_text: "Old consistency failure.",
          },
        },
      ],
      debug: {
        ok: true,
        response_type: "final_answer",
        final_status: "final_answer",
        terminal_artifact_kind: "model_synthesized_answer",
        final_answer_source: "final_answer_draft",
        terminal_error_code: "terminal_consistency_violation",
        selected_final_answer: staleDraft,
      },
    };

    expect(syncHelixTypedFailureAuthorityPublicMirrors(payload)).toBe(true);

    expect(payload.ok).toBe(false);
    expect(payload.response_type).toBe("final_failure");
    expect(payload.final_status).toBe("final_failure");
    expect(payload.terminal_artifact_kind).toBe("typed_failure");
    expect(payload.final_answer_source).toBe("typed_failure");
    expect(payload.terminal_error_code).toBe("compound_prompt_coverage_incomplete");
    expect(payload.selected_final_answer).toBe(failureText);
    expect(payload.answer).toBe(failureText);
    expect(payload.text).toBe(failureText);
    expect(payload.terminal_presentation).toMatchObject({
      terminal_artifact_kind: "typed_failure",
      concise_text: failureText,
    });
    expect(payload.typed_failure).toMatchObject({
      error_code: "compound_prompt_coverage_incomplete",
      text: failureText,
      answer_text: failureText,
    });
    expect(payload.debug).toMatchObject({
      ok: false,
      response_type: "final_failure",
      final_status: "final_failure",
      terminal_artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      terminal_error_code: "compound_prompt_coverage_incomplete",
      selected_final_answer: failureText,
    });
    expect(JSON.stringify(payload.current_turn_artifact_ledger)).not.toContain("terminal_consistency_violation");
  });

  it("syncs public mirrors to the exact compound subgoal rail failure when authority is typed failure", () => {
    const turnId = "ask:test:typed-failure-authority-subgoal-rail-public-mirror";
    const staleDraft = "This stale draft should not remain the public answer.";
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      thread_id: "thread:test",
      ok: true,
      response_type: "final_answer",
      final_status: "final_answer",
      status: "final_answer",
      selected_final_answer: staleDraft,
      answer: staleDraft,
      text: staleDraft,
      assistant_answer: staleDraft,
      terminal_artifact_kind: "model_synthesized_answer",
      final_answer_source: "final_answer_draft",
      terminal_error_code: "terminal_consistency_violation",
      compound_prompt_coverage_gate: {
        schema: "helix.compound_prompt_coverage_gate.v1",
        applies: true,
        passed: false,
        decision: "FAIL_CLOSED",
        unresolved_requirement_ids: ["calculator-subgoal"],
      },
      capability_itinerary_execution_state: {
        schema: "helix.capability_itinerary_execution_state.v1",
        applies: true,
        compound_subgoal_ledger: [
          {
            subgoal_id: "calculator-subgoal",
            requested_capability: "scientific-calculator.solve_expression",
            selected_capability: "scientific-calculator.solve_expression",
            executed_capability: null,
            observation_ref: null,
            satisfaction: "failed",
            rail_status: "fail_closed",
            rail_failure_code: "invalid_arg:latex_is_prose",
            first_broken_rail: "capability_execution",
            repair_target: "subgoal_argument_extraction",
          },
        ],
      },
      terminal_answer_authority: {
        schema: "helix.terminal_authority.v1",
        thread_id: "thread:test",
        turn_id: turnId,
        terminal_kind: "failure",
        terminal_artifact_kind: "typed_failure",
        final_answer_source: "typed_failure",
        terminal_text_preview: "Old consistency failure.",
        server_authoritative: true,
        assistant_answer: false,
      },
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        turn_id: turnId,
        terminal_artifact_kind: "model_synthesized_answer",
        concise_text: staleDraft,
        assistant_answer: false,
        raw_content_included: false,
      },
      typed_failure: {
        schema: "helix.typed_failure.v1",
        error_code: "terminal_consistency_violation",
        text: "Old consistency failure.",
        answer_text: "Old consistency failure.",
      },
      debug: {
        ok: true,
        response_type: "final_answer",
        final_status: "final_answer",
        terminal_artifact_kind: "model_synthesized_answer",
        final_answer_source: "final_answer_draft",
        terminal_error_code: "terminal_consistency_violation",
        selected_final_answer: staleDraft,
      },
    };

    expect(syncHelixTypedFailureAuthorityPublicMirrors(payload)).toBe(true);

    expect(payload.ok).toBe(false);
    expect(payload.response_type).toBe("final_failure");
    expect(payload.final_status).toBe("final_failure");
    expect(payload.terminal_artifact_kind).toBe("typed_failure");
    expect(payload.final_answer_source).toBe("typed_failure");
    expect(payload.terminal_error_code).toBe("invalid_arg:latex_is_prose");
    expect(payload.selected_final_answer).toContain("scientific-calculator.solve_expression");
    expect(payload.selected_final_answer).toContain("invalid argument latex_is_prose");
    expect(payload.typed_failure).toMatchObject({
      error_code: "invalid_arg:latex_is_prose",
      compound_rail_failure_code: "invalid_arg:latex_is_prose",
      compound_first_broken_rail: "capability_execution",
      compound_repair_target: "subgoal_argument_extraction",
      first_incomplete_compound_subgoal_id: "calculator-subgoal",
    });
    expect(payload.debug).toMatchObject({
      ok: false,
      response_type: "final_failure",
      final_status: "final_failure",
      terminal_artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      terminal_error_code: "invalid_arg:latex_is_prose",
    });
  });

  it("localizes typed failure public mirrors from the Ask language contract", () => {
    const turnId = "ask:test:localized-typed-failure";
    const localizedFailure = "No pude producir una respuesta terminal para este turno.";
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      language_contract: {
        schema: "helix.ask_language_contract.v1",
        input_modality: "typed",
        source_text:
          "Explain Helix Ask final answer language, pero responde en espaÃ±ol y usa evidencia del cÃ³digo.",
        source_language: "mixed",
        dominant_language: "mixed",
        requested_response_language: "es",
        explicit_response_language: "es",
        response_language: "es",
        language_detected: "mixed",
        language_confidence: 0.82,
        code_mixed: true,
        explicit_language_instruction: true,
        pivot_language: null,
        pivot_text: null,
        pivot_confidence: null,
        translated: false,
        reason_codes: ["explicit_spanish_response_instruction", "mixed_prompt"],
      },
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        turn_id: turnId,
        terminal_kind: "failure",
        terminal_artifact_kind: "typed_failure",
        final_answer_source: "typed_failure",
        terminal_text_preview: "I could not produce a terminal answer for this turn.",
        server_authoritative: true,
        assistant_answer: false,
      },
      typed_failure: {
        schema: "helix.typed_failure.v1",
        error_code: "repo_evidence_relevance_failed",
        text: "I could not produce a terminal answer for this turn.",
        answer_text: "I could not produce a terminal answer for this turn.",
      },
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        turn_id: turnId,
        terminal_artifact_kind: "typed_failure",
        concise_text: "I could not produce a terminal answer for this turn.",
      },
      debug: {},
    };

    expect(syncHelixTypedFailureAuthorityPublicMirrors(payload)).toBe(true);
    expect(payload.selected_final_answer).toBe(localizedFailure);
    expect(payload.answer).toBe(localizedFailure);
    expect(payload.text).toBe(localizedFailure);
    expect(payload.typed_failure).toMatchObject({
      message: localizedFailure,
      text: localizedFailure,
      answer_text: localizedFailure,
    });
    expect(payload.terminal_presentation).toMatchObject({
      concise_text: localizedFailure,
    });
    expect(payload.debug).toMatchObject({
      selected_final_answer: localizedFailure,
      answer: localizedFailure,
    });
  });

  it("blocks unsupported live-source mail drafts as source-backed synthesis", () => {
    const turnId = "ask:test:live-source-mail-unsupported-draft";
    const draftText = "The live-source mailbox looks healthy and no more action is needed.";
    const artifacts = [
      {
        artifact_id: `${turnId}:draft`,
        kind: "final_answer_draft",
        payload: {
          schema: "helix.final_answer_draft.v1",
          text: draftText,
          authority: "llm_post_observation_composer",
          model_step_capability: "model.synthesize_from_live_source_mail",
          artifact_refs: [],
        },
      },
    ];
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      thread_id: "thread:test",
      route_product_contract: liveSourceMailContract(turnId),
      canonical_goal_frame: {
        goal_kind: "live_source_mailbox_review",
        required_terminal_kind: "model_synthesized_answer",
      },
      current_turn_artifact_ledger: artifacts,
      selected_final_answer: "I could not produce a terminal answer for this turn.",
      final_answer_source: "typed_failure",
      terminal_artifact_kind: "typed_failure",
      terminal_error_code: "missing_allowed_terminal_artifact",
    };
    const gate = evaluateFinalAnswerDraftQualityGate({
      turnId,
      finalAnswerDraftRef: `${turnId}:draft`,
      draftText,
      draftPayload: artifacts[0]?.payload,
      routeProductContract: liveSourceMailContract(turnId),
      payload,
      artifactLedger: artifacts,
    });

    expect(gate.route_family).toBe("live_source_mail");
    expect(gate.violations).toContain("missing_support_refs_for_source_route");

    const materialized = materializeFinalAnswerDraftTerminal({
      turnId,
      payload,
      artifactLedger: artifacts,
      routeProductContract: liveSourceMailContract(turnId),
    });

    expect(materialized?.ok).toBe(false);
    expect(materialized?.blocked_reason).toBe("source_support_refs_missing");
    expect(payload.model_synthesized_answer).toBeUndefined();
  });

  it("materializes a supported repo draft into repo_code_evidence_answer", () => {
    const turnId = "ask:test:repo-draft-materialized";
    const draftText = "Helix Ask treats receipts as observations, while final answers must be model-authored synthesis selected by terminal authority.";
    const artifacts = [
      {
        artifact_id: `${turnId}:repo_obs`,
        kind: "repo_code_evidence_observation",
        payload: {
          schema: "helix.repo_code_evidence_observation.v1",
          evidence_refs: ["docs/helix-ask-codex-loop-discipline.md"],
          spans: [{ ref: "docs/helix-ask-codex-loop-discipline.md:1" }],
        },
      },
      {
        artifact_id: `${turnId}:synthesis_attempt`,
        kind: "repo_evidence_synthesis_attempt",
        payload: {
          schema: "helix.repo_evidence_synthesis_attempt.v1",
          model_step_capability: "model.synthesize_from_repo_evidence",
        },
      },
      {
        artifact_id: `${turnId}:draft`,
        kind: "final_answer_draft",
        payload: {
          schema: "helix.final_answer_draft.v1",
          text: draftText,
          authority: "llm_post_observation_composer",
          model_step_capability: "model.synthesize_from_repo_evidence",
          artifact_refs: [`${turnId}:repo_obs`],
        },
      },
    ];
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      thread_id: "thread:test",
      route_product_contract: repoContract(turnId),
      canonical_goal_frame: {
        goal_kind: "repo_entity_definition",
        required_terminal_kind: "repo_code_evidence_answer",
      },
      current_turn_artifact_ledger: artifacts,
      selected_final_answer: "I could not produce a terminal answer for this turn.",
      final_answer_source: "typed_failure",
      terminal_artifact_kind: "typed_failure",
      terminal_error_code: "missing_allowed_terminal_artifact",
    };
    addRepoRuntimeProof(payload, `${turnId}:repo_obs`);

    const materialized = materializeFinalAnswerDraftTerminal({
      turnId,
      payload,
      artifactLedger: artifacts,
      routeProductContract: repoContract(turnId),
    });

    expect(materialized?.ok).toBe(true);
    expect(materialized?.materialized_terminal_artifact_kind).toBe("repo_code_evidence_answer");
    expect(payload.repo_code_evidence_answer).toMatchObject({
      schema: "helix.repo_code_evidence_answer.v1",
      text: draftText,
      model_authored: true,
    });

    const result = applyHelixTerminalAuthoritySingleWriter({
      turnId,
      threadId: "thread:test",
      payload,
      artifactLedger: artifacts,
    });

    expect(result.selected_terminal_artifact_kind).toBe("repo_code_evidence_answer");
    expect(result.visible_text).toBe(draftText);
    expect(payload.terminal_error_code).toBeUndefined();
    expect(payload.repo_answer_text_quality_gate).toMatchObject({ ok: true });
  });

  it("materializes compound drafts from ledger-only itinerary execution state", () => {
    const turnId = "ask:test:compound-draft-ledger-only-execution-state";
    const workspaceSubgoalId = `${turnId}:compound_capability_subgoal:1:workspace_os_status`;
    const calculatorSubgoalId = `${turnId}:compound_capability_subgoal:2:scientific-calculator_solve_expression`;
    const workspaceObservationRef = `${turnId}:workspace_os_status_observation`;
    const calculatorObservationRef = `${turnId}:calculator_receipt`;
    const draftText = "Workspace status was inspected, and the calculator result was 45.";
    const artifacts = [
      {
        artifact_id: `${turnId}:compound_capability_contract`,
        kind: "compound_capability_contract",
        payload: {
          schema: "helix.compound_capability_contract.v1",
          turn_id: turnId,
          prompt_shape: "compound_capability",
          requires_all_subgoals: true,
          terminal_policy: "synthesize_from_satisfied_subgoal_observations",
          subgoals: [
            {
              subgoal_id: workspaceSubgoalId,
              order: 1,
              requested_capability: "workspace_os.status",
              runtime_capability: "workspace_os.status",
              capability_family: "workspace_diagnostic",
              required_observation_kinds: ["workspace_os_status_observation"],
              required_terminal_kind: "model_synthesized_answer",
              mandatory: true,
            },
            {
              subgoal_id: calculatorSubgoalId,
              order: 2,
              requested_capability: "scientific-calculator.solve_expression",
              runtime_capability: "scientific-calculator.solve_expression",
              capability_family: "calculator",
              required_observation_kinds: ["calculator_receipt", "workstation_tool_evaluation"],
              required_terminal_kind: "workstation_tool_evaluation",
              mandatory: true,
            },
          ],
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: `${turnId}:capability_itinerary_execution_state`,
        kind: "capability_itinerary_execution_state",
        payload: {
          schema: "helix.capability_itinerary_execution_state.v1",
          turn_id: turnId,
          applies: true,
          complete: true,
          required_observation_families: ["workspace_diagnostic", "calculator"],
          missing_observation_families: [],
          missing_compound_subgoal_ids: [],
          missing_required_capabilities: [],
          compound_subgoal_ledger: [
            {
              subgoal_id: workspaceSubgoalId,
              order: 1,
              requested_capability: "workspace_os.status",
              runtime_capability: "workspace_os.status",
              selected_capability: "workspace_os.status",
              executed_capability: "workspace_os.status",
              capability_family: "workspace_diagnostic",
              observation_kind: "workspace_os_status_observation",
              observation_ref: workspaceObservationRef,
              satisfaction: "satisfied",
              rail_status: "complete",
            },
            {
              subgoal_id: calculatorSubgoalId,
              order: 2,
              requested_capability: "scientific-calculator.solve_expression",
              runtime_capability: "scientific-calculator.solve_expression",
              selected_capability: "scientific-calculator.solve_expression",
              executed_capability: "scientific-calculator.solve_expression",
              capability_family: "calculator",
              observation_kind: "calculator_receipt",
              observation_ref: calculatorObservationRef,
              satisfaction: "satisfied",
              rail_status: "complete",
            },
          ],
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: workspaceObservationRef,
        kind: "workspace_os_status_observation",
        payload: {
          schema: "helix.workspace_os_status_observation.v1",
          capability_key: "workspace_os.status",
          compound_subgoal_id: workspaceSubgoalId,
        },
      },
      {
        artifact_id: calculatorObservationRef,
        kind: "calculator_receipt",
        payload: {
          schema: "helix.calculator_receipt.v1",
          capability_key: "scientific-calculator.solve_expression",
          compound_subgoal_id: calculatorSubgoalId,
          result: "45",
          expression: "5*9",
        },
      },
      {
        artifact_id: `${turnId}:draft`,
        kind: "final_answer_draft",
        payload: {
          schema: "helix.final_answer_draft.v1",
          text: draftText,
          authority: "llm_post_observation_compound_synthesis",
          model_step_capability: "model.synthesize_from_compound_subgoal_observations",
          support_refs: [workspaceObservationRef, calculatorObservationRef],
          artifact_refs: [workspaceObservationRef, calculatorObservationRef],
          grounded_in_observation_refs: [workspaceObservationRef, calculatorObservationRef],
        },
      },
    ];
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      thread_id: "thread:test",
      route_product_contract: modelOnlyContract(turnId),
      canonical_goal_frame: {
        goal_kind: "compound_tool",
        required_terminal_kind: "model_synthesized_answer",
      },
      current_turn_artifact_ledger: artifacts,
      selected_final_answer: draftText,
      final_answer_source: "final_answer_draft",
      terminal_artifact_kind: "model_synthesized_answer",
      goal_satisfaction_evaluation: {
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
    };

    const materialized = materializeFinalAnswerDraftTerminal({
      turnId,
      payload,
      artifactLedger: artifacts,
      routeProductContract: modelOnlyContract(turnId),
    });

    expect(materialized?.ok).toBe(true);
    expect(materialized?.materialized_terminal_artifact_kind).toBe("compound_evidence_synthesis_answer");
    expect(payload.compound_evidence_synthesis_answer).toMatchObject({
      schema: "helix.compound_evidence_synthesis_answer.v1",
      answer_text: draftText,
      subgoal_observation_refs: [workspaceObservationRef, calculatorObservationRef],
      subgoal_observation_refs_count: 2,
      source_families: ["workspace_diagnostic", "calculator"],
      model_step_capability: "model.synthesize_from_compound_subgoal_observations",
    });
  });

  it("publishes a valid repo evidence answer instead of a stale continuation failure", () => {
    const turnId = "ask:test:repo-draft-over-stale-continuation";
    const draftText = "Helix Ask requires tool receipts to re-enter the solver as observations before terminal authority can select a visible answer.";
    const artifacts = [
      {
        artifact_id: `${turnId}:repo_obs`,
        kind: "repo_code_evidence_observation",
        payload: {
          schema: "helix.repo_code_evidence_observation.v1",
          evidence_refs: ["docs/helix-ask-codex-loop-discipline.md"],
          spans: [{ ref: "docs/helix-ask-codex-loop-discipline.md:171" }],
        },
      },
      {
        artifact_id: `${turnId}:synthesis_attempt`,
        kind: "repo_evidence_synthesis_attempt",
        payload: {
          schema: "helix.repo_evidence_synthesis_attempt.v1",
          model_step_capability: "model.synthesize_from_repo_evidence",
        },
      },
      {
        artifact_id: `${turnId}:draft`,
        kind: "final_answer_draft",
        payload: {
          schema: "helix.final_answer_draft.v1",
          text: draftText,
          authority: "llm_post_observation_composer",
          model_step_capability: "model.synthesize_from_repo_evidence",
          artifact_refs: [`${turnId}:repo_obs`],
        },
      },
    ];
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      thread_id: "thread:test",
      route_product_contract: repoContract(turnId),
      canonical_goal_frame: {
        goal_kind: "repo_code_evidence_question",
        required_terminal_kind: "repo_code_evidence_answer",
      },
      current_turn_artifact_ledger: artifacts,
      selected_final_answer: "I could not complete this Ask turn because solver authority failed (poison_clean_but_authority_failed).",
      final_answer_source: "typed_failure",
      terminal_artifact_kind: "typed_failure",
      solver_continuation_observation: {
        schema: "helix.solver_continuation_observation.v1",
        required_next_step: "answer",
      },
    };
    addRepoRuntimeProof(payload, `${turnId}:repo_obs`);

    const result = applyHelixTerminalAuthoritySingleWriter({
      turnId,
      threadId: "thread:test",
      payload,
      artifactLedger: artifacts,
    });

    expect(result.selected_terminal_artifact_kind).toBe("repo_code_evidence_answer");
    expect(result.visible_text).toBe(draftText);
    expect(result.rejected_candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "typed_failure",
          reason: "stale_solver_continuation_superseded_by_repo_terminal",
        }),
      ]),
    );
    expect(payload.final_answer_source).toBe("final_answer_draft");
    expect(payload.terminal_artifact_kind).toBe("repo_code_evidence_answer");
  });

  it("publishes a valid scholarly answer instead of a stale continuation failure", () => {
    const turnId = "ask:test:scholarly-draft-over-stale-continuation";
    const lookupRef = `${turnId}:lookup`;
    const fullTextRef = `${turnId}:full_text`;
    const draftText = [
      "The paper identifies the Transformer as an encoder-decoder architecture built from stacked self-attention and position-wise feed-forward layers.",
      "It uses multi-head attention plus positional encodings to model token order without recurrence.",
      "Support: artifact://scholarly-pdf/test.pdf/page/2#text",
    ].join("\n");
    const artifacts = [
      {
        artifact_id: lookupRef,
        kind: "scholarly_research_observation",
        payload: {
          schema: "helix.scholarly_research_observation.v1",
          evidence_refs: ["arxiv:1706.03762"],
          papers: [{ title: "Attention Is All You Need" }],
        },
      },
      {
        artifact_id: fullTextRef,
        kind: "scholarly_full_text_observation",
        payload: {
          schema: "helix.scholarly_full_text_observation.v1",
          selected_chunks: [{
            chunk_ref: "artifact://scholarly-pdf/test.pdf/page/2#chunk/1",
            source_text_ref: "artifact://scholarly-pdf/test.pdf/page/2#text",
            text_excerpt: "The Transformer uses stacked self-attention and point-wise feed-forward layers.",
          }],
          page_text_refs: ["artifact://scholarly-pdf/test.pdf/page/2#text"],
        },
      },
      {
        artifact_id: `${turnId}:draft`,
        kind: "final_answer_draft",
        payload: {
          schema: "helix.final_answer_draft.v1",
          text: draftText,
          authority: "llm_post_observation_composer",
          model_step_capability: "model.synthesize_from_scholarly_research",
          grounded_in_observation_refs: [lookupRef, fullTextRef],
          support_refs: [lookupRef, fullTextRef, "artifact://scholarly-pdf/test.pdf/page/2#text"],
        },
      },
    ];
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      thread_id: "thread:test",
      active_prompt: "Do research: fetch the PDF/full text for arXiv:1706.03762 and extract model architecture details.",
      route_product_contract: scholarlyContract(turnId),
      canonical_goal_frame: {
        goal_kind: "scholarly_research_lookup",
        required_terminal_kind: "scholarly_research_answer",
      },
      current_turn_artifact_ledger: artifacts,
      selected_final_answer: "I could not complete this Ask turn because solver authority failed (solver_path_incomplete_before_terminal).",
      final_answer_source: "typed_failure",
      terminal_artifact_kind: "typed_failure",
      solver_continuation_observation: {
        schema: "helix.solver_continuation_observation.v1",
        required_next_step: "answer",
      },
    };
    addScholarlyRuntimeProof(payload, lookupRef, fullTextRef);

    const result = applyHelixTerminalAuthoritySingleWriter({
      turnId,
      threadId: "thread:test",
      payload,
      artifactLedger: artifacts,
    });

    expect(result.selected_terminal_artifact_kind).toBe("scholarly_research_answer");
    expect(result.visible_text).toBe(draftText);
    expect(result.rejected_candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "typed_failure",
          reason: "stale_solver_continuation_superseded_by_scholarly_terminal",
        }),
      ]),
    );
    expect(payload.final_answer_source).toBe("final_answer_draft");
    expect(payload.terminal_artifact_kind).toBe("scholarly_research_answer");
    expect(payload.scholarly_research_answer).toMatchObject({
      schema: "helix.scholarly_research_answer.v1",
      text: draftText,
      support_refs: expect.arrayContaining([lookupRef, fullTextRef]),
    });
  });

  it("appends clickable scholarly citations from fetched full-text URLs", () => {
    const turnId = "ask:test:scholarly-citation-footer";
    const lookupRef = `${turnId}:lookup`;
    const fullTextRef = `${turnId}:full_text`;
    const draftText = [
      "The paper frames Hawking radiation as a tunneling process near the event horizon.",
      "It uses the fetched PDF chunks as the evidence basis for the answer.",
      "Support: artifact://scholarly-pdf/hawking/page/1#text",
    ].join("\n");
    const artifacts = [
      {
        artifact_id: lookupRef,
        kind: "scholarly_research_observation",
        payload: {
          schema: "helix.scholarly_research_observation.v1",
          papers: [{
            result_id: "arxiv:hep-th/9907001",
            title: "Hawking Radiation As Tunneling",
            identifiers: {
              arxiv_id: "hep-th/9907001",
              pdf_url: "https://arxiv.org/pdf/hep-th/9907001.pdf",
            },
          }],
        },
      },
      {
        artifact_id: fullTextRef,
        kind: "scholarly_full_text_observation",
        payload: {
          schema: "helix.scholarly_full_text_observation.v1",
          paper_result_id: "arxiv:hep-th/9907001",
          title: "Hawking Radiation As Tunneling",
          source_url: "https://arxiv.org/pdf/hep-th/9907001.pdf",
          pages_parsed: 5,
          selected_chunks: [{
            chunk_ref: "artifact://scholarly-pdf/hawking/page/1#chunk/1",
            source_text_ref: "artifact://scholarly-pdf/hawking/page/1#text",
            text_excerpt: "Hawking radiation can be viewed as tunneling.",
          }],
          page_text_refs: ["artifact://scholarly-pdf/hawking/page/1#text"],
        },
      },
      {
        artifact_id: `${turnId}:draft`,
        kind: "final_answer_draft",
        payload: {
          schema: "helix.final_answer_draft.v1",
          text: draftText,
          authority: "llm_post_observation_composer",
          model_step_capability: "model.synthesize_from_scholarly_research",
          grounded_in_observation_refs: [lookupRef, fullTextRef],
          support_refs: [lookupRef, fullTextRef, "artifact://scholarly-pdf/hawking/page/1#text"],
        },
      },
    ];
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      thread_id: "thread:test",
      active_prompt: "Do research: fetch the PDF/full text for a Hawking radiation paper and cite it.",
      route_product_contract: scholarlyContract(turnId),
      canonical_goal_frame: {
        goal_kind: "scholarly_research_lookup",
        required_terminal_kind: "scholarly_research_answer",
      },
      current_turn_artifact_ledger: artifacts,
    };
    addScholarlyRuntimeProof(payload, lookupRef, fullTextRef);

    const result = applyHelixTerminalAuthoritySingleWriter({
      turnId,
      threadId: "thread:test",
      payload,
      artifactLedger: artifacts,
    });

    expect(result.selected_terminal_artifact_kind).toBe("scholarly_research_answer");
    expect(result.visible_text).toContain(draftText);
    expect(result.visible_text).toContain("Citations");
    expect(result.visible_text).toContain("- [Hawking Radiation As Tunneling](https://arxiv.org/pdf/hep-th/9907001.pdf) (PDF/full text; 5 parsed pages)");
    expect(payload.scholarly_research_answer).toMatchObject({
      schema: "helix.scholarly_research_answer.v1",
      answer_text: result.visible_text,
      citations: [
        {
          label: "Hawking Radiation As Tunneling",
          url: "https://arxiv.org/pdf/hep-th/9907001.pdf",
          note: "PDF/full text; 5 parsed pages",
        },
      ],
    });
  });

  it("fails closed when a scholarly draft contradicts observed PDF/full-text evidence", () => {
    const turnId = "ask:test:scholarly-contradictory-draft";
    const lookupRef = `${turnId}:lookup`;
    const fullTextRef = `${turnId}:full_text`;
    const postToolRef = `${turnId}:post_tool_observation`;
    const draftText = "I cannot fetch or access external PDF documents, so I cannot summarize the paper.";
    const artifacts = [
      {
        artifact_id: lookupRef,
        kind: "scholarly_research_observation",
        payload: {
          schema: "helix.scholarly_research_observation.v1",
          evidence_refs: ["arxiv:1402.3952"],
          papers: [{ result_id: "arxiv:1402.3952", title: "Hawking Radiation from Higher-Dimensional Black Holes" }],
        },
      },
      {
        artifact_id: fullTextRef,
        kind: "scholarly_full_text_observation",
        payload: {
          schema: "helix.scholarly_full_text_observation.v1",
          paper_result_id: "arxiv:1402.3952",
          source_url: "https://arxiv.org/pdf/1402.3952v2.pdf",
          pages_parsed: 35,
          selected_chunks: [{
            chunk_ref: "arxiv:1402.3952:p1:c1",
            source_text_ref: "arxiv:1402.3952:p1#text",
            text_excerpt: "This paper reviews Hawking radiation from higher-dimensional black holes.",
          }],
          page_text_refs: [{ text_ref: "arxiv:1402.3952:p1#text" }],
        },
      },
      {
        artifact_id: postToolRef,
        kind: "agent_step_observation_packet",
        payload: {
          schema: "helix.agent_step_observation_packet.v1",
          status: "succeeded",
          post_tool_model_step_required: true,
          terminal_eligible: false,
          observed_artifact_refs: [lookupRef, fullTextRef],
        },
      },
      {
        artifact_id: `${turnId}:draft`,
        kind: "final_answer_draft",
        payload: {
          schema: "helix.final_answer_draft.v1",
          text: draftText,
          authority: "llm_post_observation_composer",
          model_step_capability: "model.synthesize_from_scholarly_research",
          support_refs: [lookupRef, fullTextRef, "arxiv:1402.3952:p1#text"],
        },
      },
    ];
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      thread_id: "thread:test",
      active_prompt: "Do research: fetch the PDF/full text for arXiv:1402.3952 and summarize the Hawking radiation paper.",
      route_product_contract: scholarlyContract(turnId),
      canonical_goal_frame: {
        goal_kind: "scholarly_research_lookup",
        required_terminal_kind: "scholarly_research_answer",
      },
      current_turn_artifact_ledger: artifacts,
      selected_final_answer: "I could not produce a terminal answer for this turn.",
      final_answer_source: "typed_failure",
      terminal_artifact_kind: "typed_failure",
    };
    addScholarlyRuntimeProof(payload, lookupRef, fullTextRef);

    const result = applyHelixTerminalAuthoritySingleWriter({
      turnId,
      threadId: "thread:test",
      payload,
      artifactLedger: artifacts,
    });

    expect(result.selected_terminal_artifact_kind).toBe("typed_failure");
    expect(result.visible_text).toContain("PDF/full-text evidence was observed");
    expect(result.integrity.post_tool_model_step_satisfied).toBe(false);
    expect(result.rejected_candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "model_synthesized_answer",
          reason: "route_contract_forbids_model_synthesized_answer",
        }),
      ]),
    );
    expect(payload.terminal_error_code).toBe("scholarly_answer_synthesis_failed_after_full_text_observed");
    expect(payload.terminal_artifact_kind).toBe("typed_failure");
    expect(payload.model_synthesized_answer).toBeUndefined();
    expect(payload.scholarly_research_answer).toBeUndefined();
    expect((payload.final_answer_draft_quality_gate as Record<string, unknown>).violations).toEqual(
      expect.arrayContaining(["contradicts_observed_scholarly_full_text"]),
    );
  });

  it("keeps deterministic scholarly fallback drafts nonterminal", () => {
    const turnId = "ask:test:scholarly-deterministic-fallback-nonterminal";
    const lookupRef = `${turnId}:lookup`;
    const fullTextRef = `${turnId}:full_text`;
    const artifacts = [
      {
        artifact_id: lookupRef,
        kind: "scholarly_research_observation",
        payload: {
          schema: "helix.scholarly_research_observation.v1",
          evidence_refs: ["arxiv:1402.3952"],
          papers: [{ result_id: "arxiv:1402.3952", title: "Hawking Radiation from Higher-Dimensional Black Holes" }],
        },
      },
      {
        artifact_id: fullTextRef,
        kind: "scholarly_full_text_observation",
        payload: {
          schema: "helix.scholarly_full_text_observation.v1",
          source_url: "https://arxiv.org/pdf/1402.3952v2.pdf",
          pages_parsed: 35,
          selected_chunks: [{
            chunk_ref: "arxiv:1402.3952:p1:c1",
            source_text_ref: "arxiv:1402.3952:p1#text",
            text_excerpt: "Hawking radiation from higher-dimensional black holes is reviewed.",
          }],
          page_text_refs: [{ text_ref: "arxiv:1402.3952:p1#text" }],
        },
      },
      {
        artifact_id: `${turnId}:post_tool_observation`,
        kind: "agent_step_observation_packet",
        payload: {
          schema: "helix.agent_step_observation_packet.v1",
          status: "succeeded",
          post_tool_model_step_required: true,
          terminal_eligible: false,
          observed_artifact_refs: [lookupRef, fullTextRef],
        },
      },
      {
        artifact_id: `${turnId}:draft`,
        kind: "final_answer_draft",
        payload: {
          schema: "helix.final_answer_draft.v1",
          text: "Paper: Hawking Radiation from Higher-Dimensional Black Holes. Relevant PDF/full-text excerpts: arxiv:1402.3952:p1:c1.",
          authority: "deterministic_receipt_fallback",
          support_refs: [lookupRef, fullTextRef, "arxiv:1402.3952:p1#text"],
        },
      },
    ];
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      thread_id: "thread:test",
      active_prompt: "Do research: fetch the PDF/full text for arXiv:1402.3952 and summarize the paper.",
      route_product_contract: scholarlyContract(turnId),
      canonical_goal_frame: {
        goal_kind: "scholarly_research_lookup",
        required_terminal_kind: "scholarly_research_answer",
      },
      current_turn_artifact_ledger: artifacts,
      selected_final_answer: "I could not produce a terminal answer for this turn.",
      final_answer_source: "typed_failure",
      terminal_artifact_kind: "typed_failure",
    };
    addScholarlyRuntimeProof(payload, lookupRef, fullTextRef);

    const result = applyHelixTerminalAuthoritySingleWriter({
      turnId,
      threadId: "thread:test",
      payload,
      artifactLedger: artifacts,
    });

    expect(result.selected_terminal_artifact_kind).toBe("typed_failure");
    expect(result.source).toBe("typed_failure");
    expect(result.visible_text).toContain("no valid model-authored scholarly answer");
    expect(result.rejected_candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "final_answer_draft",
          reason: "deterministic_receipt_fallback_nonterminal",
        }),
      ]),
    );
    expect(payload.terminal_artifact_kind).toBe("typed_failure");
    expect(payload.final_answer_source).toBe("typed_failure");
    expect(payload.terminal_error_code).toBe("scholarly_answer_synthesis_failed_after_full_text_observed");
  });

  it("rejects fallback-like final drafts as successful terminals", () => {
    const gate = evaluateFinalAnswerDraftQualityGate({
      turnId: "ask:test:fallback-draft",
      finalAnswerDraftRef: "draft:fallback",
      draftText: "I could not produce a terminal answer for this turn.",
      routeProductContract: modelOnlyContract("ask:test:fallback-draft"),
      artifactLedger: [],
    });

    expect(gate.ok).toBe(false);
    expect(gate.violations).toContain("fallback_like_answer");
  });

  it("projection gate repairs visible stale direct answer when a later valid draft exists", () => {
    const turnId = "ask:test:projection-direct-to-draft";
    const draftText = [
      "- Charge: electrons are negative; protons are positive.",
      "- Mass: electrons are much lighter than protons.",
      "- Role in atoms: electrons occupy shells/clouds; protons are in the nucleus and define element identity.",
      "Practical consequence: charge attraction helps form stable atoms.",
    ].join("\n");
    const artifacts = [
      {
        artifact_id: `${turnId}:direct`,
        kind: "direct_answer_text",
        payload: { schema: "helix.direct_answer_text.v1", text: "An electron is a fundamental subatomic particle." },
      },
      {
        artifact_id: `${turnId}:draft`,
        kind: "final_answer_draft",
        payload: { schema: "helix.final_answer_draft.v1", text: draftText },
      },
    ];
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      active_prompt: "Compare an electron and a proton in three ways: charge, mass, and role in atoms. Then give one practical consequence of those differences.",
      route_product_contract: modelOnlyContract(turnId),
      current_turn_artifact_ledger: artifacts,
      selected_final_answer: "An electron is a fundamental subatomic particle.",
      final_answer_source: "model_direct_answer",
      terminal_artifact_kind: "direct_answer_text",
    };
    addModelOnlyRuntimeProof(payload);

    const result = applyHelixProjectionMismatchGate({
      turn_id: turnId,
      artifact_ledger: artifacts,
      current_payload: payload,
      current_visible_text: "An electron is a fundamental subatomic particle.",
    });

    expect(result.internal_turn_success.outcome).toBe("internal_success_and_visible_success");
    expect(result.terminal_projection_health.projection_mismatch_repaired).toBe(true);
    expect(payload.selected_final_answer).toBe(draftText);
    expect((payload.terminal_authority_single_writer as Record<string, unknown>)).toBeTruthy();
  });

  it("fails closed when visible projection disagrees with typed failure authority", () => {
    const turnId = "ask:test:projection-kind-typed-failure";
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      terminal_artifact_kind: "model_synthesized_answer",
      final_answer_source: "final_answer_draft",
      selected_final_answer: "A good-looking but unauthorized answer.",
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        turn_id: turnId,
        terminal_artifact_kind: "model_synthesized_answer",
        concise_text: "A good-looking but unauthorized answer.",
      },
    };
    const result = applyTerminalProjectionKindGuard(payload, {
      schema: "helix.terminal_authority_single_writer_result.v1",
      turn_id: turnId,
      selected_terminal_artifact_ref: "typed_failure:test",
      selected_terminal_artifact_kind: "typed_failure",
      visible_text: "The authorized failure.",
      assistant_answer: false,
      source: "typed_failure",
      rejected_candidates: [],
      writes: {
        payload_text: "The authorized failure.",
        payload_answer: "The authorized failure.",
        payload_assistant_answer: "The authorized failure.",
        payload_selected_final_answer: "The authorized failure.",
        terminal_presentation_concise_text: "The authorized failure.",
        debug_selected_final_answer: "The authorized failure.",
      },
      integrity: {
        single_writer_applied: true,
        visible_matches_selected_artifact: true,
        visible_matches_draft: true,
        stale_failure_visible: false,
        receipt_visible_as_answer: false,
        post_tool_model_step_satisfied: true,
        legacy_terminal_candidate_count: 0,
        forbidden_terminal_candidate_count: 0,
        payload_mirror_written_after_terminal_selection: true,
      },
    });

    expect(result.selected_terminal_artifact_kind).toBe("typed_failure");
    expect(result.integrity.terminal_projection_guard_applied).toBe(true);
    expect(result.integrity.terminal_projection_guard_action).toBe("fail_closed");
    expect(result.integrity.terminal_projection_failure_code).toBe("terminal_projection_mismatch");
    expect(payload.terminal_artifact_kind).toBe("typed_failure");
    expect(payload.terminal_error_code).toBe("terminal_projection_mismatch");
    expect((payload.terminal_presentation as Record<string, unknown>).terminal_artifact_kind).toBe("typed_failure");
  });

  it("projects the authority-selected artifact when presentation kind is stale", () => {
    const turnId = "ask:test:projection-kind-repair";
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      terminal_artifact_kind: "direct_answer_text",
      final_answer_source: "model_direct_answer",
      selected_final_answer: "Stale direct text.",
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        turn_id: turnId,
        terminal_artifact_kind: "direct_answer_text",
        concise_text: "Stale direct text.",
      },
    };
    const result = applyTerminalProjectionKindGuard(payload, {
      schema: "helix.terminal_authority_single_writer_result.v1",
      turn_id: turnId,
      selected_terminal_artifact_ref: `${turnId}:draft`,
      selected_terminal_artifact_kind: "model_synthesized_answer",
      visible_text: "Authority-selected draft text.",
      assistant_answer: false,
      source: "final_answer_draft",
      rejected_candidates: [],
      writes: {
        payload_text: "Authority-selected draft text.",
        payload_answer: "Authority-selected draft text.",
        payload_assistant_answer: "Authority-selected draft text.",
        payload_selected_final_answer: "Authority-selected draft text.",
        terminal_presentation_concise_text: "Authority-selected draft text.",
        debug_selected_final_answer: "Authority-selected draft text.",
      },
      integrity: {
        single_writer_applied: true,
        visible_matches_selected_artifact: true,
        visible_matches_draft: true,
        stale_failure_visible: false,
        receipt_visible_as_answer: false,
        post_tool_model_step_satisfied: true,
        legacy_terminal_candidate_count: 0,
        forbidden_terminal_candidate_count: 0,
        payload_mirror_written_after_terminal_selection: true,
      },
    });

    expect(result.integrity.terminal_projection_guard_applied).toBe(true);
    expect(result.integrity.terminal_projection_guard_action).toBe("project_authority_artifact");
    expect(payload.terminal_artifact_kind).toBe("model_synthesized_answer");
    expect((payload.terminal_presentation as Record<string, unknown>).terminal_artifact_kind).toBe("model_synthesized_answer");
    expect(payload.selected_final_answer).toBe("Authority-selected draft text.");
  });

  it("fails closed when calculator route has only a model-authored draft and no calculator observation", () => {
    const turnId = "ask:test:calculator-draft-without-receipt";
    const draftText =
      "I cannot perform calculations or access tools directly. However, sqrt(81)=9 and ln(e^3)=3, so the result is 29.5.";
    const artifacts = [
      {
        artifact_id: `${turnId}:draft`,
        kind: "final_answer_draft",
        payload: {
          schema: "helix.final_answer_draft.v1",
          text: draftText,
        },
      },
    ];
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      canonical_goal_frame: {
        turn_id: turnId,
        goal_kind: "calculator_solve",
        required_terminal_kind: "workstation_tool_evaluation",
      },
      source_target_intent: {
        schema: "helix.ask_source_target_intent.v1",
        target_source: "calculator_stream",
        target_kind: "calculator_stream",
        strength: "hard",
        must_enter_backend_ask: true,
        allow_client_shortcut: false,
        allow_no_tool_direct: false,
      },
      route_product_contract: {
        ...modelOnlyContract(turnId),
        source_target: "calculator_stream",
        allowed_terminal_artifact_kinds: ["model_synthesized_answer", "typed_failure", "request_user_input"],
        forbidden_terminal_artifact_kinds: ["direct_answer_text", "model_only_concept", "no_tool_direct"],
      },
      current_turn_artifact_ledger: artifacts,
      selected_final_answer: draftText,
      final_answer_source: "model_direct_answer",
      terminal_artifact_kind: "direct_answer_text",
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        turn_id: turnId,
        terminal_artifact_kind: "direct_answer_text",
        concise_text: draftText,
      },
    };
    addModelOnlyRuntimeProof(payload);

    const result = applyHelixTerminalAuthoritySingleWriter({
      turnId,
      payload,
      artifactLedger: artifacts,
    });

    expect(result.selected_terminal_artifact_kind).toBe("typed_failure");
    expect(payload.terminal_artifact_kind).toBe("typed_failure");
    expect(payload.final_answer_source).toBe("typed_failure");
    expect(payload.terminal_error_code).toBe("calculator_tool_answer_support_missing");
    expect((payload.calculator_tool_answer_support as Record<string, unknown>).missing_reason).toBe("calculator_result_missing");
    expect(result.rejected_candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "model_synthesized_answer",
          source: "final_answer_draft",
          reason: "missing_required_observation",
        }),
      ]),
    );
  });

  it("uses calculator missing-support failure when hard calculator route metadata is present before canonical frame repair", () => {
    const turnId = "ask:test:calculator-route-metadata-before-frame";
    const draftText =
      "I cannot perform calculations or access tools directly, but the expression evaluates to 29.5 by mental math.";
    const artifacts = [
      {
        artifact_id: `${turnId}:draft`,
        kind: "final_answer_draft",
        payload: {
          schema: "helix.final_answer_draft.v1",
          text: draftText,
        },
      },
    ];
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      route_reason_code: "calculator_solve / model_synthesized_answer",
      current_turn_artifact_ledger: artifacts,
      selected_final_answer: draftText,
      final_answer_source: "final_answer_draft",
      terminal_artifact_kind: "model_synthesized_answer",
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        turn_id: turnId,
        terminal_artifact_kind: "model_synthesized_answer",
        concise_text: draftText,
      },
    };
    addModelOnlyRuntimeProof(payload);

    const result = applyHelixTerminalAuthoritySingleWriter({
      turnId,
      payload,
      artifactLedger: artifacts,
    });

    expect(result.selected_terminal_artifact_kind).toBe("typed_failure");
    expect(result.integrity.terminal_projection_guard_applied).toBe(false);
    expect(result.integrity.terminal_projection_failure_code).toBeNull();
    expect(payload.terminal_artifact_kind).toBe("typed_failure");
    expect(payload.final_answer_source).toBe("typed_failure");
    expect(payload.terminal_error_code).toBe("calculator_tool_answer_support_missing");
    expect((payload.terminal_presentation as Record<string, unknown>).terminal_artifact_kind).toBe("typed_failure");
    expect((payload.calculator_tool_answer_support as Record<string, unknown>).applies).toBe(true);
  });

  it("selects calculator workstation evaluation over a model-authored draft", () => {
    const turnId = "ask:test:calculator-evaluation-terminal";
    const artifacts = [
      {
        artifact_id: `${turnId}:workstation_tool_evaluation`,
        kind: "workstation_tool_evaluation",
        payload: {
          schema: "helix.workstation_tool_evaluation.v1",
          evaluation_id: `${turnId}:workstation_tool_evaluation`,
          supports_goal: true,
          summary: "The calculator evaluated ((sqrt(81)+ln(e^3))*7-5^2)/2 and produced 29.5.",
        },
      },
      {
        artifact_id: `${turnId}:draft`,
        kind: "final_answer_draft",
        payload: {
          schema: "helix.final_answer_draft.v1",
          text: "A model-authored draft says the expression is 29.5.",
        },
      },
    ];
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      source_target_intent: {
        schema: "helix.ask_source_target_intent.v1",
        target_source: "calculator_stream",
        target_kind: "calculator_stream",
      },
      route_product_contract: {
        ...modelOnlyContract(turnId),
        source_target: "calculator_stream",
        allowed_terminal_artifact_kinds: ["workstation_tool_evaluation", "model_synthesized_answer", "typed_failure"],
      },
      current_turn_artifact_ledger: artifacts,
      selected_final_answer: "A model-authored draft says the expression is 29.5.",
      final_answer_source: "final_answer_draft",
      terminal_artifact_kind: "model_synthesized_answer",
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        turn_id: turnId,
        terminal_artifact_kind: "model_synthesized_answer",
        concise_text: "A model-authored draft says the expression is 29.5.",
      },
    };
    addCalculatorRuntimeProof(payload, `${turnId}:workstation_tool_evaluation`);

    const result = applyHelixTerminalAuthoritySingleWriter({
      turnId,
      payload,
      artifactLedger: artifacts,
    });

    expect(result.selected_terminal_artifact_kind).toBe("workstation_tool_evaluation");
    expect(result.source).toBe("workstation_tool_evaluation");
    expect(payload.terminal_artifact_kind).toBe("workstation_tool_evaluation");
    expect(payload.final_answer_source).toBe("workstation_tool_evaluation");
    expect(payload.selected_final_answer).toContain("produced 29.5");
    expect((payload.terminal_presentation as Record<string, unknown>).terminal_artifact_kind).toBe(
      "workstation_tool_evaluation",
    );
    expect(payload.terminal_error_code).toBeUndefined();
  });

  it("materializes calculator workstation evaluation text through the backend synthesizer", () => {
    const turnId = "ask:test:calculator-evaluation-synthesized-terminal";
    const expression = "((sqrt(81)+ln(e^3))*7-5^2)/2";
    const prompt = `Use the scientific calculator to solve ${expression}.`;
    const plan = {
      schema: "helix.workstation_tool_plan.v1",
      plan_id: `${turnId}:plan`,
      thread_id: "thread:test",
      turn_id: turnId,
      goal: prompt,
      intent: "calculator_solve",
      steps: [
        {
          step_id: "solve_expression",
          kind: "run_panel_action",
          panel_id: "scientific-calculator",
          action_id: "solve_expression",
          args: {
            latex: expression,
            calculator_setup: {
              schema: "helix.calculator_setup_context.v1",
              expression: "(81)+",
              display_latex: "(81)+",
              domain: "generic",
              subgoal: "Evaluate the supplied calculator expression.",
              equation: null,
              variables: [],
              result_unit: null,
              interpretation_prompt: null,
            },
          },
          required: true,
        },
      ],
      missing_requirements: [],
      created_at: "2026-06-16T00:00:00.000Z",
    };
    const artifacts = [
      {
        artifact_id: `${turnId}:workstation_tool_evaluation`,
        kind: "workstation_tool_evaluation",
        payload: {
          schema: "helix.workstation_tool_evaluation.v1",
          evaluation_id: `${turnId}:workstation_tool_evaluation`,
          plan_id: plan.plan_id,
          thread_id: "thread:test",
          turn_id: turnId,
          goal: prompt,
          subgoal: "Evaluate the supplied calculator expression.",
          tool_receipt_ids: [`${turnId}:calculator_receipt`],
          supports_goal: true,
          summary: `Calculator-backed result: ${expression} = 29.5.`,
          evidence_refs: [`${turnId}:calculator_receipt`],
          deterministic: true,
          model_invoked: false,
          created_at: "2026-06-16T00:00:00.000Z",
        },
      },
    ];
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      thread_id: "thread:test",
      active_prompt: prompt,
      workstation_tool_plan: plan,
      canonical_goal_frame: {
        schema: "helix.canonical_goal_frame.v1",
        goal_kind: "calculator_solve",
        required_terminal_kind: "workstation_tool_evaluation",
      },
      source_target_intent: {
        schema: "helix.ask_source_target_intent.v1",
        target_source: "calculator_stream",
        target_kind: "calculator_stream",
      },
      route_product_contract: {
        ...modelOnlyContract(turnId),
        source_target: "calculator_stream",
        allowed_terminal_artifact_kinds: ["workstation_tool_evaluation", "model_synthesized_answer", "typed_failure"],
        required_terminal_kinds: ["workstation_tool_evaluation"],
      },
      current_turn_artifact_ledger: artifacts,
      selected_final_answer: "Calculator-backed result: stale UI text.",
      final_answer_source: "final_answer_draft",
      terminal_artifact_kind: "model_synthesized_answer",
    };
    addCalculatorRuntimeProof(payload, `${turnId}:workstation_tool_evaluation`);

    const result = applyHelixTerminalAuthoritySingleWriter({
      turnId,
      payload,
      artifactLedger: artifacts,
    });

    expect(result.selected_terminal_artifact_kind).toBe("workstation_tool_evaluation");
    expect(result.source).toBe("workstation_tool_evaluation");
    expect(payload.terminal_artifact_kind).toBe("workstation_tool_evaluation");
    expect(payload.final_answer_source).toBe("workstation_tool_evaluation");
    expect((payload.terminal_answer_authority as Record<string, unknown>).final_answer_source).toBe(
      "workstation_tool_evaluation",
    );
    expect((payload.resolved_turn_summary as Record<string, unknown>).final_answer_source).toBe(
      "workstation_tool_evaluation",
    );
    expect((payload.resolved_turn_summary as Record<string, unknown>).resolved_route_label).toBe(
      "calculator_solve / workstation_tool_evaluation",
    );
    expect(payload.selected_final_answer).toContain("Calculator verification plan completed.");
    expect(payload.selected_final_answer).toContain(`Expression: ${expression}`);
    expect(payload.selected_final_answer).toContain("Result: 29.5");
    expect(payload.selected_final_answer).toContain("Trace source: scientific-calculator.solve_expression.");
    expect(payload.selected_final_answer).not.toContain("stale UI text");
    expect((payload.terminal_presentation as Record<string, unknown>).concise_text).toBe(payload.selected_final_answer);
    expect((payload.workstation_tool_terminal_synthesis as Record<string, unknown>).applied).toBe(true);
  });

  it("lets satisfied calculator workstation evaluation supersede stale continuation state", () => {
    const turnId = "ask:test:calculator-evaluation-stale-continuation";
    const terminalText = "Calculator-backed result: ((sqrt(81)+ln(e^3))*7-5^2)/2 = 29.5.";
    const artifacts = [
      {
        artifact_id: `${turnId}:workstation_tool_evaluation`,
        kind: "workstation_tool_evaluation",
        payload: {
          schema: "helix.workstation_tool_evaluation.v1",
          evaluation_id: `${turnId}:workstation_tool_evaluation`,
          supports_goal: true,
          result_summary: terminalText,
        },
      },
    ];
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      canonical_goal_frame: {
        schema: "helix.canonical_goal_frame.v1",
        goal_kind: "calculator_solve",
        required_terminal_kind: "workstation_tool_evaluation",
      },
      source_target_intent: {
        schema: "helix.ask_source_target_intent.v1",
        target_source: "calculator_stream",
        target_kind: "calculator_stream",
      },
      route_product_contract: {
        ...modelOnlyContract(turnId),
        source_target: "calculator_stream",
        allowed_terminal_artifact_kinds: ["workstation_tool_evaluation", "typed_failure"],
        required_terminal_kinds: ["workstation_tool_evaluation"],
      },
      goal_satisfaction_evaluation: {
        schema: "helix.goal_satisfaction_evaluation.v1",
        canonical_goal_kind: "calculator_solve",
        required_terminal_kind: "workstation_tool_evaluation",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
        observed_results: [
          {
            ref: `${turnId}:workstation_tool_evaluation`,
            kind: "workstation_tool_evaluation",
            status: "observed",
            supports_goal: true,
          },
        ],
      },
      solver_continuation_observation: {
        schema: "helix.solver_continuation_observation.v1",
        required_next_step: "model.synthesize_from_tool_observation",
      },
      pending_server_request: {
        schema: "helix.pending_server_request.v1",
        reason: "stale_continuation",
      },
      current_turn_artifact_ledger: artifacts,
      selected_final_answer: "I could not produce a terminal answer for this turn.",
      final_answer_source: "typed_failure",
      terminal_artifact_kind: "typed_failure",
      terminal_error_code: "pending_request_missing",
    };
    addCalculatorRuntimeProof(payload, `${turnId}:workstation_tool_evaluation`);

    const result = applyHelixTerminalAuthoritySingleWriter({
      turnId,
      payload,
      artifactLedger: artifacts,
    });

    expect(result.selected_terminal_artifact_kind).toBe("workstation_tool_evaluation");
    expect(result.source).toBe("workstation_tool_evaluation");
    expect(result.rejected_candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          reason: "stale_solver_continuation_superseded_by_workstation_terminal",
        }),
      ]),
    );
    expect(payload.terminal_artifact_kind).toBe("workstation_tool_evaluation");
    expect(payload.final_answer_source).toBe("workstation_tool_evaluation");
    expect(payload.selected_final_answer).toBe(terminalText);
    expect(payload.terminal_error_code).toBeUndefined();
    expect(payload.pending_server_request).toBeUndefined();
    expect(payload.pending_request).toBeUndefined();
    expect(payload.stale_pending_server_request).toEqual(
      expect.objectContaining({ reason: "stale_continuation" }),
    );
  });

  it("materializes theory workstation evaluation from ledger preview text", () => {
    const turnId = "ask:test:theory-workstation-preview-terminal";
    const terminalText = [
      "I located this discussion in the Theory Badge Graph, then built a first-principles explanation route from that reflection.",
      "The graph route suggests the Needle Hull Mark 2 full solve is organized around hull geometry, Casimir cavity coupling, stability checks, and terminal solver policy.",
    ].join("\n");
    const artifacts = [
      {
        artifact_id: `${turnId}:theory_context_reflection_tool_receipt`,
        kind: "helix_theory_context_reflection_tool_receipt",
        payload: {
          schema: "helix.theory_context_reflection_tool_receipt.v1",
          capability: "helix_ask.reflect_theory_context",
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: `${turnId}:workstation_tool_evaluation`,
        kind: "workstation_tool_evaluation",
        text_preview: terminalText,
        supports_goal: true,
      },
    ];
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      active_prompt: "Tell me about the Needle Hull Mark 2 full solve in the badge graph. What are its main components ??",
      canonical_goal_frame: {
        schema: "helix.canonical_goal_frame.v1",
        goal_kind: "theory_context_reflection",
        required_terminal_kind: "workstation_tool_evaluation",
      },
      route_product_contract: {
        ...modelOnlyContract(turnId),
        source_target: "theory_context_reflection",
        allowed_terminal_artifact_kinds: ["workstation_tool_evaluation", "model_synthesized_answer", "typed_failure"],
        required_terminal_kinds: ["workstation_tool_evaluation"],
        required_evidence: ["helix_theory_context_reflection_tool_receipt", "workstation_tool_evaluation"],
      },
      goal_satisfaction_evaluation: {
        schema: "helix.goal_satisfaction_evaluation.v1",
        canonical_goal_kind: "theory_context_reflection",
        required_terminal_kind: "workstation_tool_evaluation",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
        observed_results: [
          {
            ref: `${turnId}:theory_context_reflection_tool_receipt`,
            kind: "helix_theory_context_reflection_tool_receipt",
            status: "observed",
            supports_goal: true,
          },
          {
            ref: `${turnId}:workstation_tool_evaluation`,
            kind: "workstation_tool_evaluation",
            status: "observed",
            supports_goal: true,
          },
        ],
      },
      agent_runtime_loop: {
        schema: "helix.agent_runtime_loop.v1",
        iterations: [
          {
            decision_id: `${turnId}:agent_runtime_loop:decision:1`,
            chosen_capability: "helix_ask.reflect_theory_context",
            executed_action_key: "helix_ask.reflect_theory_context",
            next_step: "tool",
            runtime_tool_call: {
              capability_key: "helix_ask.reflect_theory_context",
            },
            observed_artifact_refs: [
              `${turnId}:theory_context_reflection_tool_receipt`,
              `${turnId}:workstation_tool_evaluation`,
            ],
            tool_observation: {
              status: "completed",
              ok: true,
              kind: "helix_theory_context_reflection_tool_receipt",
              capability: "helix_ask.reflect_theory_context",
            },
          },
        ],
      },
      agent_step_decision: {
        schema: "helix.agent_step_decision.v1",
        decision_id: `${turnId}:agent_step_decision:answer`,
        decision_timing: "post_observation_terminal_review",
        decision_authority: "deterministic_policy_fallback",
        next_step: "answer",
        chosen_capability: "model.direct_answer",
      },
      solver_continuation_observation: {
        schema: "helix.solver_continuation_observation.v1",
        required_next_step: "answer",
      },
      current_turn_artifact_ledger: artifacts,
      selected_final_answer: "I could not complete this Ask turn because solver authority failed (solver_path_incomplete_before_terminal).",
      final_answer_source: "typed_failure",
      terminal_artifact_kind: "typed_failure",
      terminal_error_code: "solver_path_incomplete_before_terminal",
    };

    const result = applyHelixTerminalAuthoritySingleWriter({
      turnId,
      payload,
      artifactLedger: artifacts,
    });

    expect(result.selected_terminal_artifact_kind).toBe("workstation_tool_evaluation");
    expect(result.source).toBe("workstation_tool_evaluation");
    expect(result.visible_text).toBe(terminalText);
    expect(result.rejected_candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          reason: "stale_solver_continuation_superseded_by_workstation_terminal",
        }),
      ]),
    );
    expect(payload.terminal_artifact_kind).toBe("workstation_tool_evaluation");
    expect(payload.final_answer_source).toBe("workstation_tool_evaluation");
    expect(payload.selected_final_answer).toBe(terminalText);
    expect(payload.terminal_error_code).toBeUndefined();
  });

  it("mirrors workstation terminal authority into single-writer selected fields", () => {
    const turnId = "ask:test:workstation-authority-mirror";
    const terminalRef = `${turnId}:workstation_tool_evaluation`;
    const terminalText = [
      "I located this discussion in the Theory Badge Graph, then built a first-principles explanation route from that reflection.",
      "The graph route supports a workstation terminal answer.",
    ].join("\n");
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      active_prompt: "Tell me about the Needle Hull Mark 2 full solve in the badge graph.",
      canonical_goal_frame: {
        schema: "helix.canonical_goal_frame.v1",
        goal_kind: "theory_context_reflection",
      },
      route_product_contract: {
        ...modelOnlyContract(turnId),
        source_target: "theory_context_reflection",
        allowed_terminal_artifact_kinds: ["workstation_tool_evaluation", "model_synthesized_answer", "typed_failure"],
      },
      goal_satisfaction_evaluation: {
        schema: "helix.goal_satisfaction_evaluation.v1",
        canonical_goal_kind: "theory_context_reflection",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      agent_step_decision: {
        schema: "helix.agent_step_decision.v1",
        decision_id: `${turnId}:agent_step_decision:answer`,
        decision_timing: "post_observation_terminal_review",
        decision_authority: "deterministic_policy_fallback",
        next_step: "answer",
        chosen_capability: "model.direct_answer",
        assistant_answer: false,
        raw_content_included: false,
      },
      agent_runtime_loop: {
        schema: "helix.agent_runtime_loop.v1",
        iterations: [
          {
            decision_id: `${turnId}:agent_runtime_loop:decision:1`,
            chosen_capability: "helix_ask.reflect_theory_context",
            executed_action_key: "helix_ask.reflect_theory_context",
            next_step: "tool",
            decision_authority: "deterministic_policy_fallback",
            decision_timing: "post_observation",
            observed_artifact_refs: [
              `${turnId}:theory_context_reflection_tool_receipt`,
              terminalRef,
            ],
          },
          {
            decision_id: `${turnId}:agent_runtime_loop:decision:2`,
            chosen_capability: "model.direct_answer",
            next_step: "answer",
            decision_authority: "deterministic_policy_fallback",
            decision_timing: "terminal_review",
            observation_role: "model_answer_draft",
          },
        ],
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        terminal_artifact_kind: "workstation_tool_evaluation",
        final_answer_source: "workstation_tool_evaluation",
        terminal_artifact_id: terminalRef,
        terminal_text_preview: terminalText,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        terminal_artifact_kind: "workstation_tool_evaluation",
        final_answer_source: "workstation_tool_evaluation",
        concise_text: terminalText,
        assistant_answer: false,
        raw_content_included: false,
      },
      selected_final_answer: terminalText,
      answer: terminalText,
      text: terminalText,
      final_answer_source: "workstation_tool_evaluation",
      terminal_artifact_kind: "workstation_tool_evaluation",
      terminal_artifact_id: terminalRef,
      current_turn_artifact_ledger: [
        {
          artifact_id: `${turnId}:theory_context_reflection_tool_receipt`,
          kind: "helix_theory_context_reflection_tool_receipt",
          payload: {
            schema: "helix.theory_context_reflection_tool_receipt.v1",
            capability: "helix_ask.reflect_theory_context",
            tool_id: "helix_ask.reflect_theory_context",
            assistant_answer: false,
            terminal_eligible: false,
          },
        },
      ],
    };

    const result = applyHelixTerminalAuthoritySingleWriter({
      turnId,
      payload,
      artifactLedger: payload.current_turn_artifact_ledger as unknown[],
    });

    expect(result.selected_terminal_artifact_kind).toBe("workstation_tool_evaluation");
    expect(result.selected_terminal_artifact_ref).toBe(terminalRef);
    expect(result.source).toBe("workstation_tool_evaluation");
    expect(result.audit?.selectedArtifactKind).toBe("workstation_tool_evaluation");
    expect(result.audit?.selectedArtifactRef).toBe(terminalRef);
    expect(result.integrity.materialized_terminal_artifact_kind).toBe("workstation_tool_evaluation");
    expect(result.integrity.materialized_terminal_artifact_ref).toBe(terminalRef);
    expect(payload.terminal_artifact_kind).toBe("workstation_tool_evaluation");
    expect(payload.final_answer_source).toBe("workstation_tool_evaluation");
  });

  it("keeps calculator receipts as side artifacts when a final draft explains the result", () => {
    const turnId = "ask:test:calculator-draft";
    const artifacts = [
      {
        artifact_id: `${turnId}:receipt`,
        kind: "calculator_receipt",
        payload: { text: "2*(3+4)=14" },
      },
      {
        artifact_id: `${turnId}:draft`,
        kind: "final_answer_draft",
        payload: {
          schema: "helix.final_answer_draft.v1",
          text: "2*(3+4) equals 14 because the parentheses are evaluated first: 3+4=7, then 2*7=14.",
        },
      },
    ];
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      route_product_contract: {
        ...modelOnlyContract(turnId),
        source_target: "calculator_stream",
        allowed_terminal_artifact_kinds: ["model_synthesized_answer", "typed_failure", "request_user_input"],
      },
      current_turn_artifact_ledger: artifacts,
      selected_final_answer: "2*(3+4)=14",
    };
    addModelOnlyRuntimeProof(payload);

    const result = applyHelixTerminalAuthoritySingleWriter({
      turnId,
      payload,
      artifactLedger: artifacts,
    });

    expect(result.selected_terminal_artifact_kind).toBe("model_synthesized_answer");
    expect(result.visible_text).toContain("2*7=14");
    expect(result.integrity.receipt_visible_as_answer).toBe(false);
  });
});
