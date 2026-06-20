import { describe, expect, it } from "vitest";

import {
  applyHelixTerminalAuthoritySingleWriter,
  applyTerminalProjectionKindGuard,
  syncDocEvidenceSynthesisSingleWriterFromTerminalAuthority,
  syncHelixTypedFailureAuthorityPublicMirrors,
} from "../services/helix-ask/terminal-authority-single-writer";
import { buildArtifactQueryIndex } from "../services/helix-ask/artifact-query-index";

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
  it("preserves specific typed-failure rail code when projection guard reconciles stale visible kind", () => {
    const turnId = "ask:test:typed-failure-projection-guard-specific-rail";
    const failureText =
      "I could not produce a terminal answer because the requested tool rail did not complete. Cause: terminal_not_materialized.";
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      ok: false,
      final_status: "final_failure",
      terminal_artifact_kind: "doc_location_matches",
      final_answer_source: "typed_failure",
      terminal_error_code: "terminal_not_materialized",
      terminal_failure_text: failureText,
      selected_final_answer: "Locations:\n- stale visible doc projection",
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        turn_id: turnId,
        terminal_artifact_kind: "doc_location_matches",
        concise_text: "Locations:\n- stale visible doc projection",
      },
      typed_failure: {
        schema: "helix.typed_failure.v1",
        error_code: "terminal_not_materialized",
        text: failureText,
        answer_text: failureText,
        assistant_answer: false,
        raw_content_included: false,
      },
    };

    const result = applyTerminalProjectionKindGuard(payload, {
      schema: "helix.terminal_authority_single_writer_result.v1",
      artifactId: "terminal_authority_single_writer",
      schemaVersion: "helix.terminal_authority_single_writer.v1",
      turn_id: turnId,
      selectedArtifactKind: "typed_failure",
      selectedArtifactRef: "typed_failure:specific",
      selected_terminal_artifact_kind: "typed_failure",
      selected_terminal_artifact_ref: "typed_failure:specific",
      visible_text: failureText,
      assistant_answer: false,
      source: "typed_failure",
      rejected_candidates: [],
      writes: {
        payload_text: failureText,
        payload_answer: failureText,
        payload_assistant_answer: failureText,
        payload_selected_final_answer: failureText,
        terminal_presentation_concise_text: failureText,
        debug_selected_final_answer: failureText,
      },
      wroteVisibleFields: [],
      forbiddenPreAuthorityVisibleFields: [],
      audit: {
        artifactId: "terminal_authority_single_writer",
        schemaVersion: "helix.terminal_authority_single_writer.v1",
        selectedArtifactKind: "typed_failure",
        selectedArtifactRef: "typed_failure:specific",
        rejectedCandidates: [],
        wroteVisibleFields: [],
        forbiddenPreAuthorityVisibleFields: [],
      },
      integrity: {
        single_writer_applied: true,
        visible_matches_selected_artifact: false,
        visible_matches_draft: false,
        stale_failure_visible: false,
        receipt_visible_as_answer: false,
        post_tool_model_step_satisfied: true,
        legacy_terminal_candidate_count: 0,
        forbidden_terminal_candidate_count: 0,
        payload_mirror_written_after_terminal_selection: true,
      },
    });

    expect(result.selected_terminal_artifact_kind).toBe("typed_failure");
    expect(result.visible_text).toBe(failureText);
    expect(payload.terminal_error_code).toBe("terminal_not_materialized");
    expect((payload.typed_failure as Record<string, unknown>).error_code).toBe("terminal_not_materialized");
    expect(payload.selected_final_answer).toBe(failureText);
    expect((payload.terminal_presentation as Record<string, unknown>).terminal_artifact_kind).toBe("typed_failure");
  });

  it("uses tool rail failure code when typed failure only carries projection mismatch", () => {
    const turnId = "ask:test:typed-failure-projection-guard-rail-fallback";
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      ok: false,
      final_status: "final_failure",
      terminal_artifact_kind: "workspace_action_receipt",
      final_answer_source: "typed_failure",
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        turn_id: turnId,
        terminal_artifact_kind: "workspace_action_receipt",
        concise_text: "Opened docs viewer.",
      },
      typed_failure: {
        schema: "helix.typed_failure.v1",
        error_code: "terminal_projection_mismatch",
        text: "I could not produce a terminal answer because terminal authority and visible projection selected different artifacts.",
        answer_text:
          "I could not produce a terminal answer because terminal authority and visible projection selected different artifacts.",
        assistant_answer: false,
        raw_content_included: false,
      },
      tool_turn_chain_audit: {
        schema: "helix.tool_turn_chain_audit.v1",
        rail_status: "fail_closed",
        rail_failure_code: "observation_missing",
        first_broken_rail: "observation_artifact",
        repair_target: "observation_materializer",
      },
    };

    applyTerminalProjectionKindGuard(payload, {
      schema: "helix.terminal_authority_single_writer_result.v1",
      artifactId: "terminal_authority_single_writer",
      schemaVersion: "helix.terminal_authority_single_writer.v1",
      turn_id: turnId,
      selectedArtifactKind: "typed_failure",
      selectedArtifactRef: "typed_failure:rail",
      selected_terminal_artifact_kind: "typed_failure",
      selected_terminal_artifact_ref: "typed_failure:rail",
      visible_text:
        "I could not produce a terminal answer because terminal authority and visible projection selected different artifacts.",
      assistant_answer: false,
      source: "typed_failure",
      rejected_candidates: [],
      writes: {
        payload_text: "",
        payload_answer: "",
        payload_assistant_answer: "",
        payload_selected_final_answer: "",
        terminal_presentation_concise_text: "",
        debug_selected_final_answer: "",
      },
      wroteVisibleFields: [],
      forbiddenPreAuthorityVisibleFields: [],
      audit: {
        artifactId: "terminal_authority_single_writer",
        schemaVersion: "helix.terminal_authority_single_writer.v1",
        selectedArtifactKind: "typed_failure",
        selectedArtifactRef: "typed_failure:rail",
        rejectedCandidates: [],
        wroteVisibleFields: [],
        forbiddenPreAuthorityVisibleFields: [],
      },
      integrity: {
        single_writer_applied: true,
        visible_matches_selected_artifact: false,
        visible_matches_draft: false,
        stale_failure_visible: false,
        receipt_visible_as_answer: false,
        post_tool_model_step_satisfied: true,
        legacy_terminal_candidate_count: 0,
        forbidden_terminal_candidate_count: 0,
        payload_mirror_written_after_terminal_selection: true,
      },
    });

    expect(payload.terminal_error_code).toBe("observation_missing");
    expect((payload.typed_failure as Record<string, unknown>).error_code).toBe("observation_missing");
    expect(payload.selected_final_answer).toMatch(/observation_missing/);
    expect((payload.terminal_presentation as Record<string, unknown>).terminal_artifact_kind).toBe("typed_failure");
  });

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

  it("quarantines workstation circuit observations until solver authority selects a terminal answer", () => {
    const turnId = "ask:test:workstation-circuit-observations-nonterminal";
    const observationText =
      "The frog-classification microdeck produced a likely tree frog packet and queued narration.";
    const artifacts = [
      {
        artifact_id: `${turnId}:goal_context_update`,
        kind: "workstation_goal_context_update",
        payload: {
          schema: "helix.workstation_goal_context_update.v1",
          updateId: `${turnId}:goal_context_update`,
          producerKind: "microdeck",
          sourceRef: "image_lens:frog_upload",
          summary: observationText,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: `${turnId}:micro_reasoner_run`,
        kind: "stage_play_micro_reasoner_run",
        payload: {
          schemaVersion: "stage_play_micro_reasoner_run/v1",
          artifactId: "stage_play_micro_reasoner_run",
          runId: `${turnId}:micro_reasoner_run`,
          text: "MicroReasoner frog deck output is available for synthesis.",
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: `${turnId}:narrator_event`,
        kind: "narrator_event",
        payload: {
          schema: "helix.narrator_event/v1",
          eventId: `${turnId}:narrator_event`,
          text: "Narrator event recorded for the frog-classification output.",
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: `${turnId}:context_feed_query`,
        kind: "stage_play_workstation_context_feed_query_result",
        payload: {
          schemaVersion: "stage_play_workstation_context_feed_query_result/v1",
          artifactId: "stage_play_workstation_context_feed_query_result",
          feedKind: "microdeck_outputs",
          text: observationText,
          assistant_answer: false,
          terminal_eligible: false,
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
        source_target: "workstation_panel",
        allowed_terminal_artifact_kinds: ["model_synthesized_answer", "typed_failure"],
        forbidden_terminal_artifact_kinds: [
          "helix.workstation_goal_context_update.v1",
          "stage_play_micro_reasoner_run",
          "narrator_event",
          "stage_play_workstation_context_feed_query_result",
        ],
        assistant_answer: false,
        raw_content_included: false,
      },
      canonical_goal_frame: {
        goal_kind: "workstation_goal_context_query",
        required_terminal_kind: "model_synthesized_answer",
      },
      goal_satisfaction_evaluation: {
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      selected_final_answer: observationText,
      answer: observationText,
      text: observationText,
      terminal_artifact_kind: "stage_play_workstation_context_feed_query_result",
      final_answer_source: "stage_play_workstation_context_feed_query_result",
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        concise_text: observationText,
        terminal_artifact_kind: "stage_play_workstation_context_feed_query_result",
        assistant_answer: false,
        raw_content_included: false,
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
    expect(result.visible_text).not.toBe(observationText);
    expect(payload.terminal_error_code).toBe("observation_artifact_cannot_terminalize");
    expect(payload.workstation_observation_terminal_rejection).toMatchObject({
      schema: "helix.workstation_observation_terminal_rejection.v1",
      rejected_terminal_artifact_kind: "stage_play_workstation_context_feed_query_result",
      reason: "observation_artifact_cannot_terminalize",
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
    expect(result.rejected_candidates).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "workstation_goal_context_update", reason: "receipt_or_projection" }),
      expect.objectContaining({ kind: "stage_play_micro_reasoner_run", reason: "receipt_or_projection" }),
      expect.objectContaining({ kind: "narrator_event", reason: "receipt_or_projection" }),
      expect.objectContaining({ kind: "stage_play_workstation_context_feed_query_result", reason: "receipt_or_projection" }),
    ]));
    expect(result.integrity.receipt_visible_as_answer).toBe(false);
    expect(result.integrity.forbidden_terminal_candidate_count).toBeGreaterThanOrEqual(4);
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

  it("lets a proven workstation tool evaluation repair stale calculator terminal materialization rails", () => {
    const turnId = "ask:test:calculator-workstation-terminal-rail-repair";
    const answerText = "Calculator verification plan completed.\nExpression: 2 + 2\nResult: 4\nTrace source: scientific-calculator.solve_expression.";
    const artifacts = [
      {
        artifact_id: `${turnId}:calculator_receipt:1`,
        kind: "calculator_receipt",
        payload: {
          schema: "helix.calculator_receipt.v1",
          receipt_id: `${turnId}:calculator_receipt:1`,
          expression: "2 + 2",
          result: 4,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: `${turnId}:workstation_tool_evaluation:1`,
        kind: "workstation_tool_evaluation",
        payload: {
          schema: "helix.workstation_tool_evaluation.v1",
          evaluation_id: `${turnId}:workstation_tool_evaluation:1`,
          supports_goal: true,
          summary: answerText,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: `${turnId}:final_answer_draft:1`,
        kind: "final_answer_draft",
        payload: {
          schema: "helix.final_answer_draft.v1",
          text: answerText,
          support_refs: [`${turnId}:calculator_receipt:1`, `${turnId}:workstation_tool_evaluation:1`],
          artifact_refs: [`${turnId}:calculator_receipt:1`, `${turnId}:workstation_tool_evaluation:1`],
          assistant_answer: false,
          raw_content_included: false,
        },
      },
    ];
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      thread_id: "thread:test",
      active_prompt:
        "Call scientific-calculator.solve_expression with this exact expression: 2 + 2. Wait for calculator_receipt and answer from workstation_tool_evaluation.",
      canonical_goal_frame: {
        schema: "helix.canonical_goal_frame.v1",
        goal_kind: "calculator_solve",
        required_terminal_kind: "workstation_tool_evaluation",
      },
      route_product_contract: {
        schema: "helix.route_product_contract.v1",
        source_target: "calculator_stream",
        allowed_terminal_artifact_kinds: ["workstation_tool_evaluation", "typed_failure"],
        required_terminal_kinds: ["workstation_tool_evaluation"],
      },
      capability_plan: {
        schema: "helix.capability_plan.v1",
        turn_id: turnId,
        capability_family: "calculator",
        requested_capability: "scientific-calculator.solve_expression",
        requested_action: "scientific-calculator.solve_expression",
        selected_capability: "scientific-calculator.solve_expression",
        admission_status: "admitted",
        required_terminal_kind: "workstation_tool_evaluation",
      },
      tool_call_admission_decision: {
        requested_capability: "scientific-calculator.solve_expression",
        requested_capability_family: "calculator",
        requested_capability_source: "explicit_user_command",
        selected_capability: "scientific-calculator.solve_expression",
        admitted_capability: "scientific-calculator.solve_expression",
      },
      runtime_tool_call: {
        tool_call_id: "tool:calculator-workstation-terminal-rail-repair",
        capability_key: "scientific-calculator.solve_expression",
        status: "completed",
      },
      agent_runtime_loop: {
        schema: "helix.agent_runtime_loop.v1",
        iterations: [
          {
            iteration: 1,
            decision_id: `${turnId}:agent_runtime_loop:decision:1`,
            decision_authority: "llm",
            decision_timing: "pre_tool",
            next_step: "tool",
            chosen_capability: "scientific-calculator.solve_expression",
            observed_artifact_refs: [`${turnId}:calculator_receipt:1`, `${turnId}:workstation_tool_evaluation:1`],
            tool_observation: {
              status: "completed",
              kind: "calculator_receipt",
              artifact_id: `${turnId}:calculator_receipt:1`,
            },
          },
          {
            iteration: 2,
            decision_id: `${turnId}:agent_runtime_loop:decision:2`,
            decision_authority: "llm",
            decision_timing: "post_observation",
            next_step: "answer",
            chosen_capability: "model.direct_answer",
            observation_role: "model_answer_draft",
            observed_artifact_refs: [`${turnId}:final_answer_draft:1`],
          },
        ],
      },
      agent_step_decision: {
        schema: "helix.agent_step_decision.v1",
        decision_id: `${turnId}:agent_runtime_loop:decision:2`,
        decision_authority: "llm",
        decision_timing: "post_observation",
        next_step: "answer",
        chosen_capability: "model.direct_answer",
      },
      tool_lifecycle_trace: {
        schema: "helix.tool_lifecycle_trace.v1",
        requested_capability: "scientific-calculator.solve_expression",
        admitted_capability: "scientific-calculator.solve_expression",
        executed_capability: "scientific-calculator.solve_expression",
        observation_refs: [`${turnId}:calculator_receipt:1`, `${turnId}:workstation_tool_evaluation:1`],
        receipt_refs: [`${turnId}:calculator_receipt:1`],
        evidence_refs: [`${turnId}:workstation_tool_evaluation:1`],
        lifecycle_stage: "reentered_solver",
        status: "succeeded",
        evidence_reentered: true,
        terminal_eligible: true,
      },
      tool_followup_decision: {
        evidence_reentered: true,
        next_action: "terminal_answer",
      },
      goal_satisfaction_evaluation: {
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
        required_terminal_kind: "workstation_tool_evaluation",
      },
      tool_turn_chain_audit: {
        schema: "helix.tool_turn_chain_audit.v1",
        route_family: "calculator",
        requested_capability: "scientific-calculator.solve_expression",
        selected_capability: "scientific-calculator.solve_expression",
        executed_capability: "scientific-calculator.solve_expression",
        observation_artifact_kind: "calculator_receipt",
        observation_ref: `${turnId}:calculator_receipt:1`,
        reentry_executed: true,
        required_terminal_kind: "workstation_tool_evaluation",
        materialized_terminal_artifact_kind: "typed_failure",
        terminal_authority_kind: "typed_failure",
        visible_terminal_kind: "typed_failure",
        rail_status: "fail_closed",
        rail_failure_code: "terminal_not_materialized",
        assistant_answer: false,
        raw_content_included: false,
      },
      tool_rail_failure_triage: {
        schema: "helix.tool_rail_failure_triage.v1",
        turn_id: turnId,
        route_family: "calculator",
        selected_capability: "scientific-calculator.solve_expression",
        executed_capability: "scientific-calculator.solve_expression",
        observation_artifact_kind: "calculator_receipt",
        observation_ref: `${turnId}:calculator_receipt:1`,
        required_terminal_kind: "workstation_tool_evaluation",
        materialized_terminal_artifact_kind: "typed_failure",
        terminal_authority_kind: "typed_failure",
        visible_terminal_kind: "typed_failure",
        first_broken_rail: "terminal_materialization",
        failure_bucket: "E_terminal_materializer_gap",
        rail_status: "fail_closed",
        rail_failure_code: "terminal_not_materialized",
        repair_target: "terminal_materializer",
        assistant_answer: false,
        raw_content_included: false,
      },
      final_answer_draft_selection: {
        schema: "helix.final_answer_draft_selection.v1",
        materialized_terminal_artifact_kind: "model_synthesized_answer",
        materialized_terminal_artifact_ref: `${turnId}:model_synthesized_answer:from_final_answer_draft`,
      },
      selected_final_answer:
        "I could not produce a terminal answer because terminal authority and visible projection selected different artifacts.",
      terminal_artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      terminal_error_code: "terminal_projection_mismatch",
      current_turn_artifact_ledger: artifacts,
      debug: {},
    };

    const result = applyHelixTerminalAuthoritySingleWriter({
      turnId,
      threadId: "thread:test",
      payload,
      artifactLedger: artifacts,
    });

    expect(result.selected_terminal_artifact_kind).toBe("workstation_tool_evaluation");
    expect(result.source).toBe("workstation_tool_evaluation");
    expect(result.visible_text).toBe(answerText);
    expect(result.integrity.materialized_terminal_artifact_kind).toBe("workstation_tool_evaluation");
    expect(payload.terminal_artifact_kind).toBe("workstation_tool_evaluation");
    expect(payload.final_answer_source).toBe("workstation_tool_evaluation");
    expect(payload.terminal_error_code).toBeUndefined();
    expect(payload.final_answer_draft_selection).toMatchObject({
      materialized_terminal_artifact_kind: "workstation_tool_evaluation",
      materialized_terminal_artifact_ref: `${turnId}:workstation_tool_evaluation:1`,
    });

    const index = buildArtifactQueryIndex({ turnId, payload });
    expect(index.tool_turn_chain_audit).toMatchObject({
      requested_capability: "scientific-calculator.solve_expression",
      selected_capability: "scientific-calculator.solve_expression",
      executed_capability: "scientific-calculator.solve_expression",
      observation_artifact_kind: "calculator_receipt",
      required_terminal_kind: "workstation_tool_evaluation",
      materialized_terminal_artifact_kind: "workstation_tool_evaluation",
      terminal_authority_kind: "workstation_tool_evaluation",
      visible_terminal_kind: "workstation_tool_evaluation",
      rail_status: "complete",
      rail_failure_code: null,
    });
    expect(index.codex_parity_agent_spine_rail_table).toMatchObject({
      required_terminal_kind: "workstation_tool_evaluation",
      selected_terminal_kind: "workstation_tool_evaluation",
      visible_terminal_kind: "workstation_tool_evaluation",
      rail_status: "complete",
      codex_parity_class: "complete",
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

  it("blocks receipt terminals for multi-subgoal compound synthesis turns", () => {
    const turnId = "ask:test:compound-receipt-not-terminal";
    const receiptRef = `${turnId}:workspace_action_receipt`;
    const artifacts = [
      {
        artifact_id: receiptRef,
        kind: "workspace_action_receipt",
        payload: {
          schema: "helix.workspace_action_receipt.v1",
          kind: "workspace_action_receipt",
          receipt_kind: "workspace_action_receipt",
          receipt_id: receiptRef,
          text: "Workspace status returned 34 capability records.",
        },
      },
    ];
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      thread_id: "thread:test",
      route_product_contract: {
        schema: "helix.route_product_contract.v1",
        turn_id: turnId,
        source_target: "compound_capability",
        required_terminal_kind: "workspace_action_receipt",
        allowed_terminal_artifact_kinds: [
          "workspace_action_receipt",
          "workstation_tool_evaluation",
          "model_synthesized_answer",
          "typed_failure",
        ],
        forbidden_terminal_artifact_kinds: ["tool_receipt"],
        assistant_answer: false,
        raw_content_included: false,
      },
      canonical_goal_frame: {
        goal_kind: "compound_capability",
        required_terminal_kind: "workspace_action_receipt",
      },
      capability_itinerary: {
        schema: "helix.capability_itinerary.v1",
        terminal_success_criteria: {
          requires_post_observation_synthesis: true,
          compound_terminal_policy: "synthesize_from_satisfied_subgoal_observations",
          required_capabilities: [
            "workspace_os.status",
            "scientific-calculator.solve_expression",
          ],
          required_observation_families: ["workspace_diagnostic", "calculator"],
          allowed_terminal_artifact_kinds: [
            "workspace_action_receipt",
            "workstation_tool_evaluation",
            "model_synthesized_answer",
            "typed_failure",
          ],
          forbidden_terminal_artifact_kinds: ["tool_receipt"],
        },
        compound_capability_contract: {
          schema: "helix.compound_capability_contract.v1",
          terminal_policy: "synthesize_from_satisfied_subgoal_observations",
          requires_all_subgoals: true,
          subgoals: [
            {
              subgoal_id: `${turnId}:subgoal:workspace`,
              order: 1,
              requested_capability: "workspace_os.status",
              runtime_capability: "workspace_os.status",
              required_observation_kinds: ["workspace_os_status_observation"],
              required_terminal_kind: "workstation_tool_evaluation",
            },
            {
              subgoal_id: `${turnId}:subgoal:calculator`,
              order: 2,
              requested_capability: "scientific-calculator.solve_expression",
              runtime_capability: "scientific-calculator.solve_expression",
              required_observation_kinds: ["calculator_receipt"],
              required_terminal_kind: "workstation_tool_evaluation",
            },
          ],
        },
      },
      current_turn_artifact_ledger: artifacts,
      step_results: [
        {
          step_id: `${turnId}:step:workspace`,
          result_artifact: {
            kind: "workspace_action_receipt",
            artifact_id: receiptRef,
            receipt_id: receiptRef,
            text: "Workspace status returned 34 capability records.",
          },
        },
      ],
      goal_satisfaction_evaluation: {
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      selected_final_answer: "Workspace status returned 34 capability records.",
      terminal_artifact_kind: "workspace_action_receipt",
      final_answer_source: "workspace_action_receipt",
    };

    const result = applyHelixTerminalAuthoritySingleWriter({
      turnId,
      threadId: "thread:test",
      payload,
      artifactLedger: artifacts,
    });

    expect(result.selected_terminal_artifact_kind).toBe("typed_failure");
    expect(result.selected_terminal_artifact_kind).not.toBe("workspace_action_receipt");
    expect(result.rejected_candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "workspace_action_receipt", reason: "receipt_or_projection" }),
      ]),
    );
    expect(payload.terminal_artifact_kind).toBe("typed_failure");
    expect(payload.final_answer_source).toBe("typed_failure");
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

  it("fails closed when a compound itinerary still has an unsatisfied subgoal", () => {
    const turnId = "ask:test:compound-subgoal-terminal-gate";
    const draftText = "Workspace status was inspected, so this draft tries to answer before calculator execution.";
    const artifacts = [
      {
        artifact_id: `${turnId}:runtime_tool_call:1`,
        kind: "runtime_tool_call",
        payload: {
          call_id: `${turnId}:runtime_tool_call:1`,
          capability_key: "workspace_os.status",
          args: {},
        },
      },
      {
        artifact_id: `${turnId}:runtime_tool_call:1:runtime_tool_observation`,
        kind: "runtime_tool_observation",
        payload: {
          call_id: `${turnId}:runtime_tool_call:1`,
          capability_key: "workspace_os.status",
          status: "completed",
        },
      },
      {
        artifact_id: `${turnId}:workspace_os_status_observation`,
        kind: "workspace_os_status_observation",
        payload: {
          schema: "helix.workspace_os_status_observation.v1",
          summary: { available: 1 },
        },
      },
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
    const missingCalculatorSubgoalId =
      `${turnId}:compound_capability_subgoal:2:scientific-calculator_solve_expression`;
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
        goal_kind: "compound_tool",
        required_terminal_kind: "model_synthesized_answer",
      },
      capability_itinerary: {
        schema: "helix.capability_itinerary.v1",
        prompt_shape: "compound_tool",
        relevant_tool_families: ["workspace_diagnostic", "calculator"],
        terminal_success_criteria: {
          required_observation_families: ["workspace_diagnostic", "calculator"],
          required_capabilities: ["workspace_os.status", "scientific-calculator.solve_expression"],
          requires_post_observation_synthesis: true,
        },
        compound_capability_contract: {
          schema: "helix.compound_capability_contract.v1",
          turn_id: turnId,
          prompt_shape: "compound_capability",
          requires_all_subgoals: true,
          terminal_policy: "synthesize_from_satisfied_subgoal_observations",
          subgoals: [
            {
              subgoal_id: `${turnId}:compound_capability_subgoal:1:workspace_os_status`,
              order: 1,
              requested_capability: "workspace_os.status",
              runtime_capability: "workspace_os.status",
              required_observation_kinds: ["workspace_os_status_observation"],
              allowed_substitutions: [],
              args_hint: {},
            },
            {
              subgoal_id: missingCalculatorSubgoalId,
              order: 2,
              requested_capability: "scientific-calculator.solve_expression",
              runtime_capability: "scientific-calculator.solve_expression",
              required_observation_kinds: ["calculator_receipt", "workstation_tool_evaluation"],
              allowed_substitutions: [],
              args_hint: { latex: "2+2", expression: "2+2" },
            },
          ],
          assistant_answer: false,
          raw_content_included: false,
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
    expect(result.visible_text).toContain("scientific-calculator.solve_expression");
    expect(payload.capability_itinerary_execution_state).toMatchObject({
      complete: false,
      missing_required_capabilities: ["scientific-calculator.solve_expression"],
      next_missing_subgoal_id: missingCalculatorSubgoalId,
    });
    expect(payload.selected_final_answer).not.toBe(draftText);
  });

  it("blocks compound final drafts that omit a satisfied subgoal observation ref", () => {
    const turnId = "ask:test:compound-draft-missing-subgoal-support";
    const workspaceSubgoalId = `${turnId}:compound_capability_subgoal:1:workspace_os_status`;
    const docsSubgoalId = `${turnId}:compound_capability_subgoal:2:docs-viewer_locate_in_doc`;
    const workspaceObservationRef = `${turnId}:workspace_os_status_observation`;
    const docsObservationRef = `${turnId}:doc_location_matches`;
    const draftText = "Workspace status was available, and the requested document anchor was located in the audit notes.";
    const artifacts = [
      {
        artifact_id: `${turnId}:runtime_tool_call:1`,
        kind: "runtime_tool_call",
        payload: {
          call_id: `${turnId}:runtime_tool_call:1`,
          capability_key: "workspace_os.status",
          compound_subgoal_id: workspaceSubgoalId,
          args: {},
        },
      },
      {
        artifact_id: `${turnId}:runtime_tool_call:1:runtime_tool_observation`,
        kind: "runtime_tool_observation",
        payload: {
          call_id: `${turnId}:runtime_tool_call:1`,
          capability_key: "workspace_os.status",
          compound_subgoal_id: workspaceSubgoalId,
          status: "completed",
        },
      },
      {
        artifact_id: workspaceObservationRef,
        kind: "workspace_os_status_observation",
        payload: {
          schema: "helix.workspace_os_status_observation.v1",
          capability_key: "workspace_os.status",
          compound_subgoal_id: workspaceSubgoalId,
          summary: { available: 18, degraded: 1 },
        },
      },
      {
        artifact_id: `${turnId}:runtime_tool_call:2`,
        kind: "runtime_tool_call",
        payload: {
          call_id: `${turnId}:runtime_tool_call:2`,
          capability_key: "docs-viewer.locate_in_doc",
          compound_subgoal_id: docsSubgoalId,
          args: { query: "terminal authority" },
        },
      },
      {
        artifact_id: `${turnId}:runtime_tool_call:2:runtime_tool_observation`,
        kind: "runtime_tool_observation",
        payload: {
          call_id: `${turnId}:runtime_tool_call:2`,
          capability_key: "docs-viewer.locate_in_doc",
          compound_subgoal_id: docsSubgoalId,
          status: "completed",
        },
      },
      {
        artifact_id: docsObservationRef,
        kind: "doc_location_matches",
        payload: {
          schema: "helix.doc_location_matches.v1",
          capability_key: "docs-viewer.locate_in_doc",
          compound_subgoal_id: docsSubgoalId,
          matches: [{ path: "docs/audits/research/helix-ask-codex-parity-model-turn-fidelity-audit-2026-06-12.md", line: 12 }],
        },
      },
      {
        artifact_id: `${turnId}:final_answer_draft`,
        kind: "final_answer_draft",
        payload: {
          schema: "helix.final_answer_draft.v1",
          text: draftText,
          support_refs: [workspaceObservationRef],
          artifact_refs: [workspaceObservationRef],
          authority: "llm_post_observation_composer",
        },
      },
    ];
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      thread_id: "thread:test",
      active_prompt: "Use workspace_os.status, then use docs-viewer.locate_in_doc for terminal authority.",
      route_product_contract: {
        schema: "helix.route_product_contract.v1",
        source_target: "model_only",
        allowed_terminal_artifact_kinds: ["model_synthesized_answer", "typed_failure"],
        forbidden_terminal_artifact_kinds: ["workspace_action_receipt", "agent_step_observation_packet"],
        assistant_answer: false,
        raw_content_included: false,
      },
      canonical_goal_frame: {
        goal_kind: "compound_tool",
        required_terminal_kind: "model_synthesized_answer",
      },
      capability_itinerary: {
        schema: "helix.capability_itinerary.v1",
        prompt_shape: "compound_tool",
        relevant_tool_families: ["workspace_diagnostic", "docs_viewer"],
        terminal_success_criteria: {
          required_observation_families: ["workspace_diagnostic", "docs_viewer"],
          required_capabilities: ["workspace_os.status", "docs-viewer.locate_in_doc"],
          requires_post_observation_synthesis: true,
        },
        compound_capability_contract: {
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
              required_observation_kinds: ["workspace_os_status_observation"],
              allowed_substitutions: [],
              args_hint: {},
            },
            {
              subgoal_id: docsSubgoalId,
              order: 2,
              requested_capability: "docs-viewer.locate_in_doc",
              runtime_capability: "docs-viewer.locate_in_doc",
              required_observation_kinds: ["doc_location_matches"],
              allowed_substitutions: [],
              args_hint: { query: "terminal authority" },
            },
          ],
          assistant_answer: false,
          raw_content_included: false,
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
    expect(payload.terminal_error_code).toBe("compound_subgoal_support_refs_missing");
    expect(payload.selected_final_answer).toContain(docsObservationRef);
    expect(payload.compound_subgoal_draft_support_coverage).toMatchObject({
      applies: true,
      ok: false,
      required_observation_refs: [workspaceObservationRef, docsObservationRef],
      draft_support_refs: [workspaceObservationRef],
      missing_observation_refs: [docsObservationRef],
    });
    expect(result.rejected_candidates).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: "model_synthesized_answer",
        source: "final_answer_draft",
        reason: "missing_required_observation",
      }),
    ]));
  });

  it("allows compound final drafts grounded in every satisfied subgoal observation", () => {
    const turnId = "ask:test:compound-draft-complete-subgoal-support";
    const workspaceSubgoalId = `${turnId}:compound_capability_subgoal:1:workspace_os_status`;
    const docsSubgoalId = `${turnId}:compound_capability_subgoal:2:docs-viewer_locate_in_doc`;
    const workspaceObservationRef = `${turnId}:workspace_os_status_observation`;
    const docsObservationRef = `${turnId}:doc_location_matches`;
    const draftText = "Workspace status was available, and the requested document anchor was located in the audit notes.";
    const artifacts = [
      {
        artifact_id: `${turnId}:runtime_tool_call:1`,
        kind: "runtime_tool_call",
        payload: {
          call_id: `${turnId}:runtime_tool_call:1`,
          capability_key: "workspace_os.status",
          compound_subgoal_id: workspaceSubgoalId,
          args: {},
        },
      },
      {
        artifact_id: `${turnId}:runtime_tool_call:1:runtime_tool_observation`,
        kind: "runtime_tool_observation",
        payload: {
          call_id: `${turnId}:runtime_tool_call:1`,
          capability_key: "workspace_os.status",
          compound_subgoal_id: workspaceSubgoalId,
          status: "completed",
        },
      },
      {
        artifact_id: workspaceObservationRef,
        kind: "workspace_os_status_observation",
        payload: {
          schema: "helix.workspace_os_status_observation.v1",
          capability_key: "workspace_os.status",
          compound_subgoal_id: workspaceSubgoalId,
          summary: { available: 18, degraded: 1 },
        },
      },
      {
        artifact_id: `${turnId}:runtime_tool_call:2`,
        kind: "runtime_tool_call",
        payload: {
          call_id: `${turnId}:runtime_tool_call:2`,
          capability_key: "docs-viewer.locate_in_doc",
          compound_subgoal_id: docsSubgoalId,
          args: { query: "terminal authority" },
        },
      },
      {
        artifact_id: `${turnId}:runtime_tool_call:2:runtime_tool_observation`,
        kind: "runtime_tool_observation",
        payload: {
          call_id: `${turnId}:runtime_tool_call:2`,
          capability_key: "docs-viewer.locate_in_doc",
          compound_subgoal_id: docsSubgoalId,
          status: "completed",
        },
      },
      {
        artifact_id: docsObservationRef,
        kind: "doc_location_matches",
        payload: {
          schema: "helix.doc_location_matches.v1",
          capability_key: "docs-viewer.locate_in_doc",
          compound_subgoal_id: docsSubgoalId,
          matches: [{ path: "docs/audits/research/helix-ask-codex-parity-model-turn-fidelity-audit-2026-06-12.md", line: 12 }],
        },
      },
      {
        artifact_id: `${turnId}:final_answer_draft`,
        kind: "final_answer_draft",
        payload: {
          schema: "helix.final_answer_draft.v1",
          text: draftText,
          support_refs: [workspaceObservationRef, docsObservationRef],
          artifact_refs: [workspaceObservationRef, docsObservationRef],
          authority: "llm_post_observation_composer",
        },
      },
    ];
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      thread_id: "thread:test",
      active_prompt: "Use workspace_os.status, then use docs-viewer.locate_in_doc for terminal authority.",
      route_product_contract: {
        schema: "helix.route_product_contract.v1",
        source_target: "model_only",
        allowed_terminal_artifact_kinds: ["model_synthesized_answer", "typed_failure"],
        forbidden_terminal_artifact_kinds: ["workspace_action_receipt", "agent_step_observation_packet"],
        assistant_answer: false,
        raw_content_included: false,
      },
      canonical_goal_frame: {
        goal_kind: "compound_tool",
        required_terminal_kind: "model_synthesized_answer",
      },
      capability_itinerary: {
        schema: "helix.capability_itinerary.v1",
        prompt_shape: "compound_tool",
        relevant_tool_families: ["workspace_diagnostic", "docs_viewer"],
        terminal_success_criteria: {
          required_observation_families: ["workspace_diagnostic", "docs_viewer"],
          required_capabilities: ["workspace_os.status", "docs-viewer.locate_in_doc"],
          requires_post_observation_synthesis: true,
        },
        compound_capability_contract: {
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
              required_observation_kinds: ["workspace_os_status_observation"],
              allowed_substitutions: [],
              args_hint: {},
            },
            {
              subgoal_id: docsSubgoalId,
              order: 2,
              requested_capability: "docs-viewer.locate_in_doc",
              runtime_capability: "docs-viewer.locate_in_doc",
              required_observation_kinds: ["doc_location_matches"],
              allowed_substitutions: [],
              args_hint: { query: "terminal authority" },
            },
          ],
          assistant_answer: false,
          raw_content_included: false,
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

    expect(result.selected_terminal_artifact_kind).toBe("model_synthesized_answer");
    expect(result.visible_text).toBe(draftText);
    expect(payload.model_synthesized_answer).toMatchObject({
      schema: "helix.model_synthesized_answer.v1",
      support_refs: [workspaceObservationRef, docsObservationRef],
      support_refs_count: 2,
      subgoal_observation_refs: [workspaceObservationRef, docsObservationRef],
      subgoal_observation_refs_count: 2,
      source_families: ["workspace_diagnostic", "docs_viewer"],
      model_step_capability: "model.synthesize_from_compound_subgoal_observations",
      final_answer_draft_ref: `${turnId}:final_answer_draft`,
    });
    expect(payload.compound_subgoal_draft_support_coverage).toMatchObject({
      applies: true,
      ok: true,
      required_observation_refs: [workspaceObservationRef, docsObservationRef],
      draft_support_refs: [workspaceObservationRef, docsObservationRef],
      missing_observation_refs: [],
    });
    expect(payload.final_answer_source).toBe("final_answer_draft");
  });

  it("allows compound calculator drafts grounded through workstation evaluation evidence refs", () => {
    const turnId = "ask:test:compound-calculator-support-aliases";
    const workspaceSubgoalId = `${turnId}:compound_capability_subgoal:1:workspace_os_status`;
    const calculatorSubgoalId = `${turnId}:compound_capability_subgoal:2:scientific-calculator_solve_expression`;
    const workspaceObservationRef = `${turnId}:workspace_os_status_observation`;
    const calculatorReceiptRef = `${turnId}:calculator_subgoal_receipt:calculate_expression`;
    const calculatorCoverageRef = `${turnId}:calculator_plan_coverage`;
    const workstationEvaluationRef = `${turnId}:runtime_calculator_workstation_tool_evaluation`;
    const draftText = "Workspace status was inspected, and the calculator-backed result is 330.";
    const artifacts = [
      {
        artifact_id: `${turnId}:runtime_tool_call:1`,
        kind: "runtime_tool_call",
        payload: {
          call_id: `${turnId}:runtime_tool_call:1`,
          capability_key: "workspace_os.status",
          compound_subgoal_id: workspaceSubgoalId,
          args: {},
        },
      },
      {
        artifact_id: `${turnId}:runtime_tool_call:1:runtime_tool_observation`,
        kind: "runtime_tool_observation",
        payload: {
          call_id: `${turnId}:runtime_tool_call:1`,
          capability_key: "workspace_os.status",
          compound_subgoal_id: workspaceSubgoalId,
          status: "completed",
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
        artifact_id: `${turnId}:runtime_tool_call:2`,
        kind: "runtime_tool_call",
        payload: {
          call_id: `${turnId}:runtime_tool_call:2`,
          capability_key: "scientific-calculator.solve_expression",
          compound_subgoal_id: calculatorSubgoalId,
          args: { latex: "14*23+8" },
        },
      },
      {
        artifact_id: `${turnId}:runtime_tool_call:2:runtime_tool_observation`,
        kind: "runtime_tool_observation",
        payload: {
          call_id: `${turnId}:runtime_tool_call:2`,
          capability_key: "scientific-calculator.solve_expression",
          compound_subgoal_id: calculatorSubgoalId,
          status: "completed",
        },
      },
      {
        artifact_id: calculatorCoverageRef,
        kind: "calculator_plan_coverage",
        payload: {
          schema: "helix.calculator_plan_coverage.v1",
          coverage: "complete",
          receipt_refs: [calculatorReceiptRef],
        },
      },
      {
        artifact_id: workstationEvaluationRef,
        kind: "workstation_tool_evaluation",
        payload: {
          schema: "helix.workstation_tool_evaluation.v1",
          evaluation_id: workstationEvaluationRef,
          tool_key: "scientific-calculator.solve_expression",
          supports_goal: true,
          evidence_refs: [calculatorReceiptRef],
          receipt_ids: [calculatorReceiptRef],
          coverage_ref: calculatorCoverageRef,
          authority: "agent_runtime_loop",
        },
      },
      {
        artifact_id: `${turnId}:final_answer_draft`,
        kind: "final_answer_draft",
        payload: {
          schema: "helix.final_answer_draft.v1",
          text: draftText,
          support_refs: [workspaceObservationRef, calculatorReceiptRef],
          artifact_refs: [workspaceObservationRef, calculatorReceiptRef, calculatorCoverageRef],
          receipt_refs: [calculatorReceiptRef],
          coverage_refs: [calculatorCoverageRef],
          authority: "llm_post_observation_composer",
        },
      },
    ];
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      thread_id: "thread:test",
      active_prompt: "Use workspace_os.status, then calculate 14*23+8.",
      route_product_contract: {
        schema: "helix.route_product_contract.v1",
        source_target: "model_only",
        allowed_terminal_artifact_kinds: ["model_synthesized_answer", "typed_failure"],
        forbidden_terminal_artifact_kinds: ["workspace_action_receipt", "agent_step_observation_packet"],
        assistant_answer: false,
        raw_content_included: false,
      },
      canonical_goal_frame: {
        goal_kind: "compound_tool",
        required_terminal_kind: "model_synthesized_answer",
      },
      capability_itinerary: {
        schema: "helix.capability_itinerary.v1",
        prompt_shape: "compound_tool",
        relevant_tool_families: ["workspace_diagnostic", "calculator"],
        terminal_success_criteria: {
          required_observation_families: ["workspace_diagnostic", "calculator"],
          required_capabilities: ["workspace_os.status", "scientific-calculator.solve_expression"],
          requires_post_observation_synthesis: true,
        },
        compound_capability_contract: {
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
              required_observation_kinds: ["workspace_os_status_observation"],
              allowed_substitutions: [],
              args_hint: {},
            },
            {
              subgoal_id: calculatorSubgoalId,
              order: 2,
              requested_capability: "scientific-calculator.solve_expression",
              runtime_capability: "scientific-calculator.solve_expression",
              required_observation_kinds: ["calculator_receipt", "workstation_tool_evaluation"],
              allowed_substitutions: [],
              args_hint: { latex: "14*23+8", expression: "14*23+8" },
            },
          ],
          assistant_answer: false,
          raw_content_included: false,
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

    expect(result.selected_terminal_artifact_kind).toBe("model_synthesized_answer");
    expect(result.source).toBe("final_answer_draft");
    expect(payload.model_synthesized_answer).toMatchObject({
      schema: "helix.model_synthesized_answer.v1",
      support_refs: expect.arrayContaining([workspaceObservationRef, calculatorReceiptRef]),
      subgoal_observation_refs: [workspaceObservationRef, workstationEvaluationRef],
      subgoal_observation_refs_count: 2,
      source_families: ["workspace_diagnostic", "calculator"],
      model_step_capability: "model.synthesize_from_compound_subgoal_observations",
    });
    expect(payload.compound_subgoal_draft_support_coverage).toMatchObject({
      applies: true,
      ok: true,
      required_observation_refs: [workspaceObservationRef, workstationEvaluationRef],
      missing_observation_refs: [],
    });
    expect(payload.final_answer_source).toBe("final_answer_draft");
    expect(payload.terminal_error_code).toBeUndefined();
  });

  it("selects a grounded compound draft over a later diagnostic failure draft", () => {
    const turnId = "ask:test:compound-good-draft-over-stale-failure-draft";
    const catalogSubgoalId = `${turnId}:compound_capability_subgoal:1:helix_ask_inspect_capability_catalog`;
    const workspaceSubgoalId = `${turnId}:compound_capability_subgoal:2:workspace_os_status`;
    const catalogObservationRef = `${turnId}:runtime_tool_call:1:capability_registry`;
    const workspaceObservationRef = `${turnId}:runtime_tool_call:2:workspace_os_status_observation`;
    const goodDraftRef = `${turnId}:final_answer_draft:good`;
    const staleFailureDraftRef = `${turnId}:final_answer_draft:stale_failure`;
    const goodDraftText =
      "The capability catalog reports 59 active dynamic workstation actions and 91 retired actions. The workstation status reports 19 available actions, 0 degraded actions, 3 blocked actions, 0 errors, and 12 unknown actions.";
    const staleFailureDraftText =
      "The goal of calling `helix_ask.inspect_capability_catalog` and then using `workspace_os.status` was not satisfied due to missing required artifacts.";
    const artifacts = [
      {
        artifact_id: `${turnId}:runtime_tool_call:1`,
        kind: "runtime_tool_call",
        payload: {
          call_id: `${turnId}:runtime_tool_call:1`,
          capability_key: "helix_ask.inspect_capability_catalog",
          compound_subgoal_id: catalogSubgoalId,
          args: {},
        },
      },
      {
        artifact_id: `${turnId}:runtime_tool_call:1:runtime_tool_observation`,
        kind: "runtime_tool_observation",
        payload: {
          call_id: `${turnId}:runtime_tool_call:1`,
          capability_key: "helix_ask.inspect_capability_catalog",
          compound_subgoal_id: catalogSubgoalId,
          status: "completed",
        },
      },
      {
        artifact_id: catalogObservationRef,
        kind: "capability_registry",
        payload: {
          schema: "helix.capability_registry.v1",
          artifact_id: catalogObservationRef,
          capability_key: "helix_ask.inspect_capability_catalog",
          compound_subgoal_id: catalogSubgoalId,
          active_dynamic_actions: 59,
          retired_actions: 91,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: `${turnId}:runtime_tool_call:2`,
        kind: "runtime_tool_call",
        payload: {
          call_id: `${turnId}:runtime_tool_call:2`,
          capability_key: "workspace_os.status",
          compound_subgoal_id: workspaceSubgoalId,
          args: {},
        },
      },
      {
        artifact_id: `${turnId}:runtime_tool_call:2:runtime_tool_observation`,
        kind: "runtime_tool_observation",
        payload: {
          call_id: `${turnId}:runtime_tool_call:2`,
          capability_key: "workspace_os.status",
          compound_subgoal_id: workspaceSubgoalId,
          status: "completed",
        },
      },
      {
        artifact_id: workspaceObservationRef,
        kind: "workspace_os_status_observation",
        payload: {
          schema: "helix.workspace_os_status_observation.v1",
          artifact_id: workspaceObservationRef,
          capability_key: "workspace_os.status",
          compound_subgoal_id: workspaceSubgoalId,
          available_count: 19,
          degraded_count: 0,
          blocked_count: 3,
          error_count: 0,
          unknown_count: 12,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: goodDraftRef,
        kind: "final_answer_draft",
        payload: {
          schema: "helix.final_answer_draft.v1",
          kind: "final_answer_draft",
          artifact_id: goodDraftRef,
          text: goodDraftText,
          required_terminal_kind: "model_synthesized_answer",
          support_refs: [catalogObservationRef, workspaceObservationRef],
          artifact_refs: [catalogObservationRef, workspaceObservationRef],
          authority: "llm_post_observation_composer",
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: staleFailureDraftRef,
        kind: "final_answer_draft",
        payload: {
          schema: "helix.final_answer_draft.v1",
          kind: "final_answer_draft",
          artifact_id: staleFailureDraftRef,
          text: staleFailureDraftText,
          required_terminal_kind: "model_synthesized_answer",
          support_refs: [catalogObservationRef, workspaceObservationRef],
          artifact_refs: [catalogObservationRef, workspaceObservationRef],
          authority: "llm_post_observation_composer",
          assistant_answer: false,
          raw_content_included: false,
        },
      },
    ];
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      thread_id: "thread:test",
      active_prompt: "Call helix_ask.inspect_capability_catalog, then use workspace_os.status to inspect workstation status.",
      route_product_contract: {
        schema: "helix.route_product_contract.v1",
        source_target: "runtime_evidence",
        allowed_terminal_artifact_kinds: ["model_synthesized_answer", "typed_failure"],
        forbidden_terminal_artifact_kinds: ["capability_registry", "workspace_os_status_observation"],
        assistant_answer: false,
        raw_content_included: false,
      },
      canonical_goal_frame: {
        goal_kind: "runtime_capability_catalog",
        required_terminal_kind: "capability_help_summary",
      },
      capability_itinerary: {
        schema: "helix.capability_itinerary.v1",
        prompt_shape: "compound_tool",
        terminal_success_criteria: {
          required_capabilities: ["helix_ask.inspect_capability_catalog", "workspace_os.status"],
          required_observation_families: ["capability_catalog", "workspace_diagnostic"],
          requires_post_observation_synthesis: true,
          compound_terminal_policy: "synthesize_from_satisfied_subgoal_observations",
          allowed_terminal_artifact_kinds: ["model_synthesized_answer", "typed_failure"],
        },
        compound_capability_contract: {
          schema: "helix.compound_capability_contract.v1",
          turn_id: turnId,
          requires_all_subgoals: true,
          terminal_policy: "synthesize_from_satisfied_subgoal_observations",
          subgoals: [
            {
              subgoal_id: catalogSubgoalId,
              order: 1,
              requested_capability: "helix_ask.inspect_capability_catalog",
              runtime_capability: "helix_ask.inspect_capability_catalog",
              required_observation_kinds: ["capability_registry"],
              terminal_contribution_kind: "model_synthesized_answer",
            },
            {
              subgoal_id: workspaceSubgoalId,
              order: 2,
              requested_capability: "workspace_os.status",
              runtime_capability: "workspace_os.status",
              required_observation_kinds: ["workspace_os_status_observation"],
              terminal_contribution_kind: "model_synthesized_answer",
            },
          ],
          assistant_answer: false,
          raw_content_included: false,
        },
        execution_state: {
          applies: true,
          complete: true,
          compound_subgoal_ledger: [
            {
              subgoal_id: catalogSubgoalId,
              requested_capability: "helix_ask.inspect_capability_catalog",
              selected_capability: "helix_ask.inspect_capability_catalog",
              executed_capability: "helix_ask.inspect_capability_catalog",
              observation_kind: "capability_registry",
              observation_ref: catalogObservationRef,
              satisfaction: "satisfied",
              rail_status: "complete",
            },
            {
              subgoal_id: workspaceSubgoalId,
              requested_capability: "workspace_os.status",
              selected_capability: "workspace_os.status",
              executed_capability: "workspace_os.status",
              observation_kind: "workspace_os_status_observation",
              observation_ref: workspaceObservationRef,
              satisfaction: "satisfied",
              rail_status: "complete",
            },
          ],
        },
        assistant_answer: false,
        raw_content_included: false,
      },
      capability_itinerary_execution_state: {
        applies: true,
        complete: true,
        required_observation_families: ["capability_catalog", "workspace_diagnostic"],
        missing_observation_families: [],
        compound_subgoal_ledger: [
          {
            subgoal_id: catalogSubgoalId,
            requested_capability: "helix_ask.inspect_capability_catalog",
            selected_capability: "helix_ask.inspect_capability_catalog",
            executed_capability: "helix_ask.inspect_capability_catalog",
            observation_kind: "capability_registry",
            observation_ref: catalogObservationRef,
            satisfaction: "satisfied",
            rail_status: "complete",
          },
          {
            subgoal_id: workspaceSubgoalId,
            requested_capability: "workspace_os.status",
            selected_capability: "workspace_os.status",
            executed_capability: "workspace_os.status",
            observation_kind: "workspace_os_status_observation",
            observation_ref: workspaceObservationRef,
            satisfaction: "satisfied",
            rail_status: "complete",
          },
        ],
      },
      compound_capability_contract: {
        schema: "helix.compound_capability_contract.v1",
        turn_id: turnId,
        terminal_policy: "synthesize_from_satisfied_subgoal_observations",
        subgoals: [
          {
            subgoal_id: catalogSubgoalId,
            requested_capability: "helix_ask.inspect_capability_catalog",
          },
          {
            subgoal_id: workspaceSubgoalId,
            requested_capability: "workspace_os.status",
          },
        ],
      },
      compound_capability_synthesis_readiness: {
        schema: "helix.compound_capability_synthesis_readiness.v1",
        applies: true,
        complete: true,
        required_terminal_kind: "model_synthesized_answer",
        synthesis_terminal_kind: "model_synthesized_answer",
        synthesis_required: true,
      },
      current_turn_artifact_ledger: artifacts,
      goal_satisfaction_evaluation: {
        satisfaction: "not_satisfied",
        next_decision: "continue",
      },
      tool_turn_chain_audit: {
        schema: "helix.tool_turn_chain_audit.v1",
        rail_status: "fail_closed",
        rail_failure_code: "terminal_not_materialized",
        first_broken_rail: "terminal_materialization",
        repair_target: "terminal_materializer",
        required_terminal_kind: "model_synthesized_answer",
      },
      solver_continuation_observation: {
        schema: "helix.solver_continuation_observation.v1",
        required_next_step: "model.direct_answer",
      },
      selected_final_answer: "I could not produce a terminal answer for this turn.",
      terminal_artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      terminal_error_code: "terminal_answer_unavailable",
    };

    const result = applyHelixTerminalAuthoritySingleWriter({
      turnId,
      threadId: "thread:test",
      payload,
      artifactLedger: artifacts,
    });

    expect(result.selected_terminal_artifact_kind).toBe("model_synthesized_answer");
    expect(result.source).toBe("final_answer_draft");
    expect(result.visible_text).toBe(goodDraftText);
    expect(result.visible_text).not.toBe(staleFailureDraftText);
    expect(result.integrity.compound_materialized_draft_can_satisfy_terminal).toBe(true);
    expect(payload.model_synthesized_answer).toMatchObject({
      schema: "helix.model_synthesized_answer.v1",
      text: goodDraftText,
      final_answer_draft_ref: goodDraftRef,
      support_refs: [catalogObservationRef, workspaceObservationRef],
      subgoal_observation_refs: [catalogObservationRef, workspaceObservationRef],
    });
    expect(payload.final_answer_source).toBe("final_answer_draft");
    expect(payload.terminal_artifact_kind).toBe("model_synthesized_answer");
    expect(payload.terminal_error_code).toBeUndefined();
    expect(payload.final_answer_draft_selection).toMatchObject({
      selected_final_answer_draft_ref: goodDraftRef,
      materialized_terminal_artifact_kind: "model_synthesized_answer",
    });
  });
});
