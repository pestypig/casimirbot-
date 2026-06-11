import { describe, expect, it } from "vitest";

import { applyHelixTerminalAuthoritySingleWriter } from "../services/helix-ask/terminal-authority-single-writer";

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
  });
});
