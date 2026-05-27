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
    expect(result.integrity.post_tool_model_step_satisfied).toBe(false);
    expect(payload.terminal_artifact_kind).toBe("typed_failure");
    expect(payload.final_answer_source).toBe("typed_failure");
    expect(payload.terminal_error_code).toBe("post_tool_model_step_missing");
    expect(String(payload.selected_final_answer)).toContain("follow-up model answer step");
  });
});
