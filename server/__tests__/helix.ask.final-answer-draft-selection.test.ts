import { describe, expect, it } from "vitest";

import { evaluateFinalAnswerDraftQualityGate } from "../services/helix-ask/final-answer-draft-quality-gate";
import { materializeFinalAnswerDraftTerminal } from "../services/helix-ask/final-answer-draft-terminal-materializer";
import { applyHelixProjectionMismatchGate } from "../services/helix-ask/projection-mismatch-gate";
import { applyHelixTerminalAuthoritySingleWriter } from "../services/helix-ask/terminal-authority-single-writer";

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
