import { describe, expect, it } from "vitest";

import {
  applyHelixTerminalAuthoritySingleWriter,
  syncDocEvidenceSynthesisSingleWriterFromTerminalAuthority,
  syncHelixTypedFailureAuthorityPublicMirrors,
} from "../services/helix-ask/terminal-authority-single-writer";

const makePostToolObservation = (turnId: string) => ({
  artifact_id: `${turnId}:obs`,
  kind: "agent_step_observation_packet",
  payload: {
    schema: "helix.agent_step_observation_packet.v1",
    turn_id: turnId,
    status: "succeeded",
    terminal_eligible: false,
    post_tool_model_step_required: true,
    action: "open",
    panel_id: "docs-viewer",
  },
});

describe("Helix terminal authority single writer", () => {
  it("does not mirror processed live-source mail summaries as typed-failure answers", () => {
    const turnId = "ask:test:live-source-summary-typed-failure";
    const contentSummary =
      'The processed visual mail shows stage_play_live_source_mail:4bef8bfa294c18803d hud: {"health_hearts":"10"}; stage_play_live_source_mail:4bef8bfa294c18803d hotbar: {"selected_slot":"1"}.';
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      thread_id: "thread:test",
      selected_final_answer: contentSummary,
      terminal_failure_text: contentSummary,
      final_answer_source: "typed_failure",
      terminal_artifact_kind: "typed_failure",
      terminal_error_code: "typed_failure",
      canonical_goal_frame: {
        goal_kind: "live_source_processed_mail_interpretation",
        required_terminal_kind: "model_synthesized_answer",
      },
      source_target_intent: {
        target_source: "live_source_mailbox",
        strength: "hard",
        must_enter_backend_ask: true,
      },
      resolved_turn_summary: {
        final_status: "final_failure",
        resolved_route_label: "live_source_processed_mail_interpretation / model_synthesized_answer",
        terminal_artifact_kind: "typed_failure",
        terminal_error_code: "typed_failure",
      },
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        thread_id: "thread:test",
        turn_id: turnId,
        route: "dispatch:observe",
        terminal_kind: "failure",
        final_answer_source: "typed_failure",
        terminal_artifact_kind: "typed_failure",
        terminal_text_preview: contentSummary,
        terminal_text_hash: "stale",
        server_authoritative: true,
      },
      typed_failure: {
        schema: "helix.typed_failure.v1",
        error_code: "typed_failure",
        message: contentSummary,
        text: contentSummary,
        answer_text: contentSummary,
        assistant_answer: false,
        raw_content_included: false,
      },
    };

    expect(syncHelixTypedFailureAuthorityPublicMirrors(payload)).toBe(true);

    expect(payload.terminal_error_code).toBe("post_tool_model_step_missing");
    expect(payload.selected_final_answer).toBe(
      "I could not complete this live-source mailbox turn because processed mail was observed, but no valid model-synthesized answer passed terminal authority.",
    );
    expect(payload.selected_final_answer).not.toBe(contentSummary);
    expect(payload.typed_failure).toMatchObject({
      error_code: "post_tool_model_step_missing",
      message: payload.selected_final_answer,
      text: payload.selected_final_answer,
      answer_text: payload.selected_final_answer,
    });
    expect(payload.terminal_answer_authority).toMatchObject({
      terminal_kind: "failure",
      final_answer_source: "typed_failure",
      terminal_artifact_kind: "typed_failure",
      terminal_text_preview: payload.selected_final_answer,
    });
    expect((payload.terminal_answer_authority as Record<string, unknown>).terminal_text_hash).not.toBe("stale");
    expect(payload.resolved_turn_summary).toMatchObject({
      final_status: "final_failure",
      terminal_artifact_kind: "typed_failure",
      terminal_error_code: "post_tool_model_step_missing",
      final_answer_source: "typed_failure",
    });
  });

  it("selects a post-observation final draft over stale workspace failure mirrors", () => {
    const turnId = "ask:test:single-writer-open";
    const artifacts = [
      {
        artifact_id: `${turnId}:receipt`,
        kind: "workspace_action_receipt",
        payload: {
          status: "completed",
          label: "Docs & Papers",
          message: "Opening panel: Docs & Papers.",
        },
      },
      makePostToolObservation(turnId),
      {
        artifact_id: `${turnId}:final_answer_draft`,
        kind: "final_answer_draft",
        payload: {
          schema: "helix.final_answer_draft.v1",
          text: "docs-viewer has been successfully opened.",
          authority: "llm_post_observation_composer",
        },
      },
    ];
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      thread_id: "thread:test",
      current_turn_artifact_ledger: artifacts,
      selected_final_answer: "Failed to execute docs-viewer.open (workspace_step_failed).",
      answer: "Failed to execute docs-viewer.open (workspace_step_failed).",
      text: "Failed to execute docs-viewer.open (workspace_step_failed).",
      terminal_artifact_kind: "workspace_action_receipt",
      final_answer_source: "legacy_workspace_failure",
      debug: {
        selected_final_answer: "Failed to execute docs-viewer.open (workspace_step_failed).",
      },
    };

    const result = applyHelixTerminalAuthoritySingleWriter({
      turnId,
      threadId: "thread:test",
      payload,
      artifactLedger: artifacts,
    });

    expect(result.selected_terminal_artifact_kind).toBe("model_synthesized_answer");
    expect(result.artifactId).toBe("terminal_authority_single_writer");
    expect(result.schemaVersion).toBe("helix.terminal_authority_single_writer.v1");
    expect(result.selectedArtifactKind).toBe("model_synthesized_answer");
    expect(result.audit).toMatchObject({
      artifactId: "terminal_authority_single_writer",
      schemaVersion: "helix.terminal_authority_single_writer.v1",
      selectedArtifactKind: "model_synthesized_answer",
      wroteVisibleFields: expect.arrayContaining([
        "payload.text",
        "payload.answer",
        "payload.assistant_answer",
        "payload.selected_final_answer",
        "terminal_presentation.concise_text",
      ]),
    });
    expect(result.selected_terminal_artifact_ref).toBe(`${turnId}:model_synthesized_answer:from_final_answer_draft`);
    expect(result.visible_text).toBe("docs-viewer has been successfully opened.");
    expect(result.integrity.visible_matches_draft).toBe(true);
    expect(result.integrity.stale_failure_visible).toBe(false);
    expect(result.integrity.receipt_visible_as_answer).toBe(false);
    expect(result.rejected_candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "workspace_action_receipt", reason: "receipt_or_projection" }),
        expect.objectContaining({ kind: "legacy_workspace_failure", reason: "stale_failure_candidate" }),
      ]),
    );
    expect(payload.selected_final_answer).toBe("docs-viewer has been successfully opened.");
    expect((payload.terminal_presentation as Record<string, unknown>).concise_text).toBe("docs-viewer has been successfully opened.");
    expect((payload.debug as Record<string, unknown>).selected_final_answer).toBe("docs-viewer has been successfully opened.");
  });

  it("selects post-tool synthesized answers over stale typed failures after internal tool success", () => {
    const turnId = "ask:test:internal-success-visible-failure";
    const staleFailureText = "I am unable to provide context because no observations are available.";
    const synthesizedText = "The tool succeeded, the observation was re-entered, and the answer was synthesized from that evidence.";
    const artifacts = [
      {
        artifact_id: `${turnId}:receipt`,
        kind: "workspace_action_receipt",
        payload: {
          schema: "helix.workspace_action_receipt.v1",
          status: "completed",
          message: "Tool receipt succeeded.",
          assistant_answer: false,
          terminal_eligible: false,
        },
      },
      makePostToolObservation(turnId),
      {
        artifact_id: `${turnId}:stale_typed_failure`,
        kind: "typed_failure",
        payload: {
          schema: "helix.typed_failure.v1",
          error_code: "stale_model_only_fallback",
          text: staleFailureText,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: `${turnId}:final_answer_draft`,
        kind: "final_answer_draft",
        payload: {
          schema: "helix.final_answer_draft.v1",
          text: synthesizedText,
          authority: "llm_post_observation_composer",
        },
      },
    ];
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      thread_id: "thread:test",
      route_product_contract: {
        schema: "helix.route_product_contract.v1",
        allowed_terminal_artifact_kinds: ["model_synthesized_answer", "typed_failure"],
        forbidden_terminal_artifact_kinds: ["workspace_action_receipt", "agent_step_observation_packet"],
        assistant_answer: false,
        raw_content_included: false,
      },
      canonical_goal_frame: {
        goal_kind: "post_tool_answer",
        required_terminal_kind: "model_synthesized_answer",
      },
      current_turn_artifact_ledger: artifacts,
      selected_final_answer: staleFailureText,
      answer: staleFailureText,
      text: staleFailureText,
      terminal_artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      goal_satisfaction_evaluation: {
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
    };

    const result = applyHelixTerminalAuthoritySingleWriter({
      turnId,
      threadId: "thread:test",
      payload,
      artifactLedger: artifacts,
    });

    expect(result.selected_terminal_artifact_kind).toBe("model_synthesized_answer");
    expect(result.source).toBe("final_answer_draft");
    expect(result.selected_terminal_artifact_ref).not.toMatch(/^typed_failure:/);
    expect(result.audit?.selectedArtifactRef).not.toMatch(/^typed_failure:/);
    expect(result.visible_text).toBe(synthesizedText);
    expect(result.visible_text).not.toBe(staleFailureText);
    expect(result.rejected_candidates).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: "typed_failure",
        source: "typed_failure",
        reason: "stale_model_only_after_observation",
      }),
      expect.objectContaining({
        kind: "workspace_action_receipt",
        reason: "receipt_or_projection",
      }),
    ]));
    expect(payload.terminal_artifact_kind).toBe("model_synthesized_answer");
    expect(payload.final_answer_source).toBe("final_answer_draft");
    expect(payload.selected_final_answer).toBe(synthesizedText);
    expect((payload.terminal_presentation as Record<string, unknown>).concise_text).toBe(synthesizedText);
  });

  it("does not select stale workstation artifacts when a contextual tool mention is suppressed", () => {
    const turnId = "ask:test:suppressed-tool-direct-answer";
    const directText = "Calculator receipts are observations because they record evidence, while terminal answers are selected after solver authority.";
    const staleToolText = "Calculator verification plan completed.";
    const artifacts = [
      {
        artifact_id: `${turnId}:direct`,
        kind: "direct_answer_text",
        payload: {
          schema: "helix.direct_answer_text.v1",
          text: directText,
          answer_text: directText,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: `${turnId}:workstation_eval`,
        kind: "workstation_tool_evaluation",
        payload: {
          schema: "helix.workstation_tool_evaluation.v1",
          evaluation_id: `${turnId}:workstation_eval`,
          supports_goal: true,
          text: staleToolText,
          answer_text: staleToolText,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
    ];
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      thread_id: "thread:test",
      current_turn_artifact_ledger: artifacts,
      committed_ask_route: {
        schema: "helix.committed_ask_route.v1",
        turn_id: turnId,
        commit_id: "commit:test",
        prompt_hash: "hash:test",
        committed_at_stage: "post_prompt_source_arbitration",
        prompt_intent: {
          primary_intent_kind: "content_question",
          secondary_intent_kinds: [],
        },
        route: {
          selected_route: "model_only_concept",
          source_target: "model_only",
          target_kind: "general_background",
          strength: "hard",
          route_reason: "contextual_tool_reference_suppressed",
          stale_metadata_policy: "ignore_unless_matches_commit",
        },
        canonical_goal: {
          goal_kind: "model_only_concept",
          required_terminal_kind: "direct_answer_text",
          allowed_terminal_artifact_kinds: ["direct_answer_text", "typed_failure"],
          forbidden_terminal_artifact_kinds: ["workstation_tool_evaluation"],
        },
        assistant_answer: false,
        raw_content_included: false,
      },
      canonical_goal_frame: {
        goal_kind: "model_only_concept",
        answer_scope: "model_only",
        required_terminal_kind: "direct_answer_text",
      },
      capability_plan: {
        capability_contract_arbitration: {
          contract_state: "suppressed_contextual_reference",
        },
        tool_admission_suppressed: true,
      },
      tool_call_admission_decision: {
        tool_admission_suppressed: true,
      },
      goal_satisfaction_evaluation: {
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
        terminal_contract: {
          goal_kind: "model_only_concept",
          required_terminal_kinds: ["direct_answer_text"],
        },
      },
      selected_final_answer: staleToolText,
      terminal_artifact_kind: "workstation_tool_evaluation",
      final_answer_source: "workstation_tool_evaluation",
    };

    const result = applyHelixTerminalAuthoritySingleWriter({
      turnId,
      threadId: "thread:test",
      payload,
      artifactLedger: artifacts,
    });

    expect(result.selected_terminal_artifact_kind).toBe("direct_answer_text");
    expect(result.visible_text).toBe(directText);
    expect(payload.terminal_artifact_kind).toBe("direct_answer_text");
    expect(payload.final_answer_source).toBe("model_direct_answer");
    expect(payload.selected_final_answer).toBe(directText);
  });

  it("fails closed when terminal authority sees a broken tool rail", () => {
    const turnId = "ask:test:broken-tool-rail-terminal-guard";
    const draftText = "A polished answer that should not pass because the requested rail is broken.";
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
      current_turn_artifact_ledger: artifacts,
      route_product_contract: {
        schema: "helix.route_product_contract.v1",
        allowed_terminal_artifact_kinds: ["model_synthesized_answer", "typed_failure"],
        assistant_answer: false,
        raw_content_included: false,
      },
      canonical_goal_frame: {
        goal_kind: "post_tool_answer",
        required_terminal_kind: "model_synthesized_answer",
      },
      goal_satisfaction_evaluation: {
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      tool_turn_chain_audit: {
        schema: "helix.tool_turn_chain_audit.v1",
        rail_status: "broken",
        rail_failure_code: "wrong_capability_executed",
        selected_capability: "docs-viewer.locate_in_doc",
        executed_capability: "model.direct_answer",
      },
      selected_final_answer: draftText,
      terminal_artifact_kind: "model_synthesized_answer",
      final_answer_source: "final_answer_draft",
    };

    const result = applyHelixTerminalAuthoritySingleWriter({
      turnId,
      threadId: "thread:test",
      payload,
      artifactLedger: artifacts,
    });

    expect(result.selected_terminal_artifact_kind).toBe("typed_failure");
    expect(result.source).toBe("typed_failure");
    expect(payload.terminal_error_code).toBe("wrong_capability_executed");
    expect(String(payload.selected_final_answer)).toContain("wrong_capability_executed");
    expect(payload.terminal_artifact_kind).toBe("typed_failure");
  });

  it("selects materialized docs evidence synthesis over stale solver-continuation failure", () => {
    const turnId = "ask:test:docs-synthesis-supersedes-stale-continuation";
    const answerText = [
      "The document states that routes choose procedures and tools produce observations.",
      "",
      "Document evidence:",
      "- /docs/helix-ask-codex-loop-discipline.md:L214-L218 (Turn-Chain Fundamentals)",
    ].join("\n");
    const artifacts = [
      makePostToolObservation(turnId),
      {
        artifact_id: `${turnId}:doc_location_matches`,
        kind: "doc_location_matches",
        payload: {
          schema: "helix.doc_location_matches.v1",
          kind: "doc_location_matches",
          source_path: "/docs/helix-ask-codex-loop-discipline.md",
          matches: [
            {
              path: "/docs/helix-ask-codex-loop-discipline.md",
              line_start: 214,
              line_end: 218,
              snippet: "Routes choose procedures. Tools produce observations.",
            },
          ],
          assistant_answer: false,
          raw_content_included: false,
        },
      },
    ];
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      thread_id: "thread:test",
      current_turn_artifact_ledger: artifacts,
      route_product_contract: {
        schema: "helix.route_product_contract.v1",
        allowed_terminal_artifact_kinds: ["request_user_input", "typed_failure", "doc_evidence_synthesis_answer"],
        forbidden_terminal_artifact_kinds: ["direct_answer_text", "doc_location_matches"],
        assistant_answer: false,
        raw_content_included: false,
      },
      canonical_goal_frame: {
        goal_kind: "doc_evidence_synthesis",
        required_terminal_kind: "doc_evidence_synthesis_answer",
      },
      source_target_intent: {
        target_source: "docs_viewer",
        target_kind: "document_evidence",
      },
      agent_step_decision: {
        schema: "helix.agent_step_decision.v1",
        decision_id: "agent-step-answer",
        decision_authority: "llm",
        decision_timing: "post_observation",
        next_step: "answer",
        chosen_capability: "model.direct_answer",
      },
      agent_runtime_loop: {
        iterations: [
          {
            iteration: 1,
            decision_id: "agent-step-doc-locate",
            decision_authority: "llm",
            decision_timing: "post_observation",
            next_step: "next_action",
            chosen_capability: "docs-viewer.locate_in_doc",
            executed_action_key: "docs-viewer.locate_in_doc",
            observed_artifact_refs: [`${turnId}:doc_location_matches`],
            tool_observation: {
              status: "completed",
              artifact_refs: [`${turnId}:doc_location_matches`],
            },
          },
          {
            iteration: 2,
            decision_id: "agent-step-answer",
            decision_authority: "llm",
            decision_timing: "post_observation",
            next_step: "answer",
            chosen_capability: "model.direct_answer",
            observation_role: "model_answer_draft",
            observed_artifact_refs: [`${turnId}:doc_evidence_synthesis_answer:from_final_answer_draft`],
          },
        ],
      },
      goal_satisfaction_evaluation: {
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      tool_turn_chain_audit: {
        schema: "helix.tool_turn_chain_audit.v1",
        rail_status: "fail_closed",
        rail_failure_code: "terminal_projection_mismatch",
        route_family: "docs_viewer",
        requested_capability: "docs-viewer.locate_in_doc",
        selected_capability: "docs-viewer.locate_in_doc",
        executed_capability: "docs-viewer.locate_in_doc",
        observation_artifact_kind: "doc_location_matches",
        observation_ref: `${turnId}:doc_location_matches`,
        reentry_executed: true,
        required_terminal_kind: "doc_evidence_synthesis_answer",
        materialized_terminal_artifact_kind: "typed_failure",
        terminal_authority_kind: "typed_failure",
        visible_terminal_kind: "doc_evidence_synthesis_answer",
        support_refs_count: 3,
      },
      tool_rail_failure_triage: {
        schema: "helix.tool_rail_failure_triage.v1",
        turn_id: turnId,
        rail_status: "fail_closed",
        first_broken_rail: "visible_projection",
        rail_failure_code: "terminal_projection_mismatch",
        failure_bucket: "F_terminal_projection_mismatch",
        repair_target: "presenter_boundary",
        selected_capability: "docs-viewer.locate_in_doc",
        executed_capability: "docs-viewer.locate_in_doc",
      },
      solver_continuation_observation: {
        schema: "helix.solver_continuation_observation.v1",
        required_next_step: "model.direct_answer",
      },
      doc_evidence_synthesis_answer: {
        schema: "helix.doc_evidence_synthesis_answer.v1",
        artifact_id: `${turnId}:doc_evidence_synthesis_answer:from_final_answer_draft`,
        turn_id: turnId,
        answer_text: answerText,
        text: answerText,
        terminal_artifact_kind: "doc_evidence_synthesis_answer",
        support_refs: [`${turnId}:doc_location_matches`, `${turnId}:final_answer_draft`],
        assistant_answer: false,
        raw_content_included: false,
      },
      selected_final_answer: "I could not complete this turn yet because solver continuation is required before terminal answer selection.",
      terminal_artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      terminal_error_code: "solver_continuation_pending",
    };

    const result = applyHelixTerminalAuthoritySingleWriter({
      turnId,
      threadId: "thread:test",
      payload,
      artifactLedger: artifacts,
    });

    expect(result.selected_terminal_artifact_kind).toBe("doc_evidence_synthesis_answer");
    expect(result.source).toBe("final_answer_draft");
    expect(result.visible_text).toBe(answerText);
    expect(result.rejected_candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "typed_failure",
          reason: "stale_solver_continuation_superseded_by_docs_terminal",
        }),
      ]),
    );
    expect(payload.terminal_artifact_kind).toBe("doc_evidence_synthesis_answer");
    expect(payload.final_answer_source).toBe("final_answer_draft");
    expect(payload.terminal_error_code).toBeUndefined();
    expect((payload.terminal_presentation as Record<string, unknown>).terminal_artifact_kind).toBe("doc_evidence_synthesis_answer");
  });

  it("resyncs stale single-writer mirror after final docs terminal authority is recorded", () => {
    const turnId = "ask:test:docs-terminal-authority-resync";
    const answerText = "The cited document says receipts are observations, not terminal answers.";
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      thread_id: "thread:test",
      canonical_goal_frame: {
        goal_kind: "doc_evidence_synthesis",
        required_terminal_kind: "doc_evidence_synthesis_answer",
      },
      route_product_contract: {
        schema: "helix.route_product_contract.v1",
        allowed_terminal_artifact_kinds: ["doc_evidence_synthesis_answer", "typed_failure"],
      },
      doc_evidence_synthesis_answer: {
        schema: "helix.doc_evidence_synthesis_answer.v1",
        artifact_id: `${turnId}:doc_evidence_synthesis_answer:from_final_answer_draft`,
        turn_id: turnId,
        answer_text: answerText,
        text: answerText,
        terminal_artifact_kind: "doc_evidence_synthesis_answer",
        support_refs: [`${turnId}:doc_location_matches`, `${turnId}:final_answer_draft`],
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        thread_id: "thread:test",
        turn_id: turnId,
        terminal_kind: "answer",
        final_answer_source: "final_answer_draft",
        terminal_artifact_kind: "doc_evidence_synthesis_answer",
        terminal_text_preview: answerText,
        terminal_text_hash: "hash:docs",
        server_authoritative: true,
        assistant_answer: false,
      },
      terminal_authority_single_writer: {
        schema: "helix.terminal_authority_single_writer_result.v1",
        artifactId: "terminal_authority_single_writer",
        schemaVersion: "helix.terminal_authority_single_writer.v1",
        turn_id: turnId,
        selected_terminal_artifact_kind: "typed_failure",
        selected_terminal_artifact_ref: "typed_failure:stale",
        selectedArtifactKind: "typed_failure",
        selectedArtifactRef: "typed_failure:stale",
        visible_text: "I could not produce a terminal answer for this turn.",
        assistant_answer: false,
        source: "typed_failure",
        rejected_candidates: [],
        writes: {
          payload_text: "I could not produce a terminal answer for this turn.",
          payload_answer: "I could not produce a terminal answer for this turn.",
          payload_assistant_answer: "I could not produce a terminal answer for this turn.",
          payload_selected_final_answer: "I could not produce a terminal answer for this turn.",
          terminal_presentation_concise_text: "I could not produce a terminal answer for this turn.",
          debug_selected_final_answer: "I could not produce a terminal answer for this turn.",
        },
        integrity: {
          single_writer_applied: true,
          visible_matches_selected_artifact: true,
          visible_matches_draft: false,
          stale_failure_visible: false,
          receipt_visible_as_answer: false,
          post_tool_model_step_satisfied: false,
          legacy_terminal_candidate_count: 0,
          forbidden_terminal_candidate_count: 0,
          payload_mirror_written_after_terminal_selection: true,
          materialized_terminal_artifact_kind: null,
          materialized_terminal_artifact_ref: null,
        },
      },
      tool_turn_chain_audit: {
        schema: "helix.tool_turn_chain_audit.v1",
        route_family: "docs_viewer",
        requested_capability: "docs-viewer.locate_in_doc",
        selected_capability: "docs-viewer.locate_in_doc",
        executed_capability: "docs-viewer.locate_in_doc",
        requested_selected_match: true,
        selected_executed_match: true,
        observation_artifact_kind: "doc_location_matches",
        observation_ref: `${turnId}:doc_location_matches`,
        required_terminal_kind: "doc_evidence_synthesis_answer",
        expected_reentry_capability: "model.direct_answer",
        reentry_executed: true,
        final_answer_draft_ref: `${turnId}:final_answer_draft`,
        support_refs_count: 2,
        materialized_terminal_artifact_kind: "typed_failure",
        terminal_authority_kind: "typed_failure",
        visible_terminal_kind: "doc_evidence_synthesis_answer",
        rail_status: "fail_closed",
        rail_failure_code: "terminal_projection_mismatch",
        assistant_answer: false,
        raw_content_included: false,
      },
      tool_rail_failure_triage: {
        schema: "helix.tool_rail_failure_triage.v1",
        turn_id: turnId,
        route_family: "docs_viewer",
        selected_capability: "docs-viewer.locate_in_doc",
        executed_capability: "docs-viewer.locate_in_doc",
        observation_artifact_kind: "doc_location_matches",
        observation_ref: `${turnId}:doc_location_matches`,
        required_terminal_kind: "doc_evidence_synthesis_answer",
        materialized_terminal_artifact_kind: "typed_failure",
        terminal_authority_kind: "typed_failure",
        visible_terminal_kind: "doc_evidence_synthesis_answer",
        first_broken_rail: "visible_projection",
        failure_bucket: "F_terminal_projection_mismatch",
        rail_status: "fail_closed",
        rail_failure_code: "terminal_projection_mismatch",
        repair_target: "presenter_boundary",
        assistant_answer: false,
        raw_content_included: false,
      },
      tool_turn_chain_family_matrix: [{
        route_family: "docs_viewer",
        observed: true,
        materialized: true,
        materialized_terminal_artifact_kind: "typed_failure",
        terminal_authority_selected: true,
        visible_projection_matches: false,
        rail_status: "fail_closed",
        rail_failure_code: "terminal_projection_mismatch",
      }],
      terminal_artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        turn_id: turnId,
        terminal_artifact_kind: "typed_failure",
        concise_text: "I could not produce a terminal answer for this turn.",
      },
      selected_final_answer: "I could not produce a terminal answer for this turn.",
      answer: "I could not produce a terminal answer for this turn.",
      text: "I could not produce a terminal answer for this turn.",
      debug: {},
    };

    const result = syncDocEvidenceSynthesisSingleWriterFromTerminalAuthority({
      payload,
      turnId,
      threadId: "thread:test",
    });

    expect(result?.selected_terminal_artifact_kind).toBe("doc_evidence_synthesis_answer");
    expect(result?.source).toBe("final_answer_draft");
    expect(result?.visible_text).toBe(answerText);
    expect(result?.integrity.materialized_terminal_artifact_kind).toBe("doc_evidence_synthesis_answer");
    expect(payload.terminal_artifact_kind).toBe("doc_evidence_synthesis_answer");
    expect(payload.final_answer_source).toBe("final_answer_draft");
    expect(payload.selected_final_answer).toBe(answerText);
    expect((payload.terminal_presentation as Record<string, unknown>).terminal_artifact_kind).toBe("doc_evidence_synthesis_answer");
    expect(payload.tool_turn_chain_audit).toMatchObject({
      materialized_terminal_artifact_kind: "doc_evidence_synthesis_answer",
      terminal_authority_kind: "doc_evidence_synthesis_answer",
      visible_terminal_kind: "doc_evidence_synthesis_answer",
      rail_status: "complete",
      rail_failure_code: null,
    });
    expect(payload.tool_rail_failure_triage).toMatchObject({
      materialized_terminal_artifact_kind: "doc_evidence_synthesis_answer",
      terminal_authority_kind: "doc_evidence_synthesis_answer",
      visible_terminal_kind: "doc_evidence_synthesis_answer",
      first_broken_rail: null,
      failure_bucket: null,
      rail_status: "complete",
      rail_failure_code: null,
      repair_target: null,
    });
    expect(payload.tool_turn_chain_family_matrix).toEqual([
      expect.objectContaining({
        route_family: "docs_viewer",
        observed: true,
        materialized_terminal_artifact_kind: "doc_evidence_synthesis_answer",
        visible_projection_matches: true,
        rail_status: "complete",
        rail_failure_code: null,
      }),
    ]);
    expect((payload.debug as Record<string, unknown>).terminal_authority_single_writer).toMatchObject({
      selected_terminal_artifact_kind: "doc_evidence_synthesis_answer",
      visible_text: answerText,
    });
  });

  it("quarantines note receipts as side evidence and selects the synthesized note answer", () => {
    const turnId = "ask:test:note-receipt-quarantine";
    const artifacts = [
      {
        artifact_id: `${turnId}:note_update_receipt`,
        kind: "note_update_receipt",
        payload: {
          schema: "helix.note_update_receipt.v1",
          kind: "note_update_receipt",
          title: "Tool Test",
          message: "Updated note Tool Test.",
          text: "Updated note Tool Test.",
        },
      },
      {
        artifact_id: `${turnId}:obs`,
        kind: "agent_step_observation_packet",
        payload: {
          schema: "helix.agent_step_observation_packet.v1",
          turn_id: turnId,
          status: "succeeded",
          terminal_eligible: false,
          post_tool_model_step_required: true,
          capability_id: "workstation-notes.create_note",
          produced_artifact_refs: [`${turnId}:note_update_receipt`],
        },
      },
      {
        artifact_id: `${turnId}:final_answer_draft`,
        kind: "final_answer_draft",
        payload: {
          schema: "helix.final_answer_draft.v1",
          text: "I updated the Tool Test note with the requested text.",
          authority: "llm_post_observation_composer",
        },
      },
    ];
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      thread_id: "thread:test",
      active_prompt: "Create a note titled Tool Test with the text receipts are observations.",
      route_product_contract: {
        schema: "helix.route_product_contract.v1",
        turn_id: turnId,
        thread_id: "thread:test",
        source_target: "workstation_panel",
        allowed_terminal_artifact_kinds: ["model_synthesized_answer", "typed_failure", "request_user_input"],
        forbidden_terminal_artifact_kinds: ["note_update_receipt", "note_action_receipt", "note_create_receipt", "workspace_action_receipt"],
        side_artifact_kinds_allowed: ["note_update_receipt"],
        required_artifact_refs: [],
        precedence_reason: "test",
        assistant_answer: false,
        raw_content_included: false,
      },
      canonical_goal_frame: {
        goal_kind: "note_mutation",
        required_terminal_kind: "model_synthesized_answer",
      },
      current_turn_artifact_ledger: artifacts,
      selected_final_answer: "Updated note Tool Test.",
      answer: "Updated note Tool Test.",
      text: "Updated note Tool Test.",
      terminal_artifact_kind: "note_update_receipt",
      final_answer_source: "note_update_receipt",
      agent_runtime_loop: {
        iterations: [
          {
            iteration: 1,
            next_step: "next_action",
            chosen_capability: "workstation-notes.create_note",
            decision_authority: "llm",
            observed_artifact_refs: [`${turnId}:obs`, `${turnId}:note_update_receipt`],
          },
          {
            iteration: 2,
            next_step: "answer",
            chosen_capability: "model.answer",
            decision_authority: "llm",
            observation_role: "model_answer_draft",
          },
        ],
      },
      goal_satisfaction_evaluation: {
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
    };

    const result = applyHelixTerminalAuthoritySingleWriter({
      turnId,
      threadId: "thread:test",
      payload,
      artifactLedger: artifacts,
    });

    expect(result.selected_terminal_artifact_kind).toBe("model_synthesized_answer");
    expect(result.visible_text).toBe("I updated the Tool Test note with the requested text.");
    expect(result.integrity.receipt_visible_as_answer).toBe(false);
    expect(result.rejected_candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "note_update_receipt", reason: "receipt_or_projection" }),
      ]),
    );
    expect(payload.terminal_artifact_kind).toBe("model_synthesized_answer");
    expect(payload.final_answer_source).toBe("final_answer_draft");
  });

  it("fails closed when a required tool observation has no later answer draft", () => {
    const turnId = "ask:test:missing-post-tool-answer";
    const artifacts = [makePostToolObservation(turnId)];
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      thread_id: "thread:test",
      current_turn_artifact_ledger: artifacts,
      selected_final_answer: "Opening panel: Docs & Papers.",
      terminal_artifact_kind: "workspace_action_receipt",
      final_answer_source: "legacy_fallback",
    };

    const result = applyHelixTerminalAuthoritySingleWriter({
      turnId,
      threadId: "thread:test",
      payload,
      artifactLedger: artifacts,
    });

    expect(result.selected_terminal_artifact_kind).toBe("typed_failure");
    expect(result.audit?.rejectedCandidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          artifactKind: "normal_answer",
          reason: "missing_evidence_reentry",
        }),
      ]),
    );
    expect(result.audit?.forbiddenPreAuthorityVisibleFields).toEqual(
      expect.arrayContaining(["payload.selected_final_answer"]),
    );
    expect(result.integrity.post_tool_model_step_satisfied).toBe(false);
    expect(payload.terminal_artifact_kind).toBe("typed_failure");
    expect(payload.final_answer_source).toBe("typed_failure");
    expect(payload.terminal_error_code).toBe("post_tool_model_step_missing");
    expect(String(payload.selected_final_answer)).toContain("follow-up model answer step");
  });

  it("rejects stale no-context model fallbacks after live-source observations exist", () => {
    const turnId = "ask:test:stale-live-source-fallback";
    const staleText = "I am unable to provide context because no observations are available.";
    const artifacts = [
      {
        artifact_id: `${turnId}:processed_packet`,
        turn_id: turnId,
        kind: "live_environment_tool_observation",
        payload: {
          tool_name: "live_env.read_processed_live_source_mail",
          observation: {
            artifactId: "stage_play_processed_mail_packet",
            schemaVersion: "stage_play_processed_mail_packet/v1",
            recommendedNext: "request_voice_callout",
          },
        },
      },
      {
        artifact_id: `${turnId}:final_answer_draft`,
        kind: "final_answer_draft",
        payload: {
          schema: "helix.final_answer_draft.v1",
          text: staleText,
          authority: "llm_post_observation_composer",
        },
      },
    ];
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      thread_id: "thread:test",
      route_product_contract: {
        schema: "helix.route_product_contract.v1",
        allowed_terminal_artifact_kinds: ["model_synthesized_answer", "typed_failure"],
        forbidden_terminal_artifact_kinds: ["live_environment_tool_observation", "tool_receipt"],
        assistant_answer: false,
        raw_content_included: false,
      },
      canonical_goal_frame: {
        goal_kind: "live_environment_review",
        required_terminal_kind: "model_synthesized_answer",
      },
      current_turn_artifact_ledger: artifacts,
      selected_final_answer: staleText,
      terminal_artifact_kind: "model_synthesized_answer",
      final_answer_source: "final_answer_draft",
      goal_satisfaction_evaluation: {
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
    };

    const result = applyHelixTerminalAuthoritySingleWriter({
      turnId,
      threadId: "thread:test",
      payload,
      artifactLedger: artifacts,
    });

    expect(result.selected_terminal_artifact_kind).toBe("typed_failure");
    expect(result.visible_text).not.toBe(staleText);
    expect(result.rejected_candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "model_synthesized_answer",
          reason: "composer_claimed_no_observations_but_receipts_exist",
        }),
      ]),
    );
    expect(result.audit?.rejectedCandidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          artifactKind: "model_synthesized_answer",
          reason: "stale_model_only_after_observation",
        }),
      ]),
    );
    expect(payload.terminal_candidate_rejections).toEqual(result.audit?.rejectedCandidates);
    expect(["post_tool_model_step_missing", "terminal_boundary_ineligible"]).toContain(payload.terminal_error_code);
    expect(payload.selected_final_answer).not.toBe(staleText);
  });

  it("fails closed when a compound itinerary lacks required research and locator observations", () => {
    const turnId = "ask:test:compound-itinerary-missing-observations";
    const draftText = "Generic model-only answer with citations and badge names.";
    const artifacts = [
      {
        artifact_id: `${turnId}:final_answer_draft`,
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
      route_product_contract: {
        schema: "helix.route_product_contract.v1",
        allowed_terminal_artifact_kinds: ["model_synthesized_answer", "typed_failure"],
        forbidden_terminal_artifact_kinds: ["workspace_action_receipt", "agent_step_observation_packet"],
        assistant_answer: false,
        raw_content_included: false,
      },
      canonical_goal_frame: {
        goal_kind: "compound_research_locator",
        required_terminal_kind: "model_synthesized_answer",
      },
      capability_itinerary: {
        schema: "helix.capability_itinerary.v1",
        prompt_shape: "compound_tool",
        relevant_tool_families: ["scholarly_research", "theory_locator"],
        terminal_success_criteria: {
          required_observation_families: ["scholarly_research", "theory_locator"],
          requires_post_observation_synthesis: true,
        },
        assistant_answer: false,
        raw_content_included: false,
      },
      current_turn_artifact_ledger: artifacts,
      selected_final_answer: draftText,
      terminal_artifact_kind: "model_synthesized_answer",
      final_answer_source: "final_answer_draft",
      goal_satisfaction_evaluation: {
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
    };

    const result = applyHelixTerminalAuthoritySingleWriter({
      turnId,
      threadId: "thread:test",
      payload,
      artifactLedger: artifacts,
    });

    expect(result.selected_terminal_artifact_kind).toBe("typed_failure");
    expect(result.selectedArtifactKind).toBe("typed_failure");
    expect(result.source).toBe("typed_failure");
    expect(result.visible_text).toContain("required itinerary observations are missing");
    expect(result.visible_text).toContain("scholarly_research");
    expect(result.visible_text).toContain("theory_locator");
    expect(result.rejected_candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "model_synthesized_answer",
          reason: "missing_required_observation",
        }),
      ]),
    );
    expect(payload.terminal_artifact_kind).toBe("typed_failure");
    expect(payload.final_answer_source).toBe("typed_failure");
    expect((payload.terminal_answer_authority as Record<string, unknown>).terminal_artifact_kind).toBe("typed_failure");
    expect(payload.selected_final_answer).not.toBe(draftText);
    expect(payload.capability_itinerary_execution_state).toMatchObject({
      schema: "helix.capability_itinerary_execution_state.v1",
      required_observation_families: ["scholarly_research", "theory_locator"],
      observed_families: [],
      missing_observation_families: ["scholarly_research", "theory_locator"],
      complete: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  });
});
