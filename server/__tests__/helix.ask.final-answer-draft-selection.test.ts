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
              expression,
              display_latex: expression,
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
          summary: `Calculator verified ${expression} with result 29.5.`,
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
