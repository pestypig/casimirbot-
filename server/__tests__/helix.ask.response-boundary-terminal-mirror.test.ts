import { describe, expect, it } from "vitest";

import { __testHelixAskOutputContract } from "../routes/agi.plan";

describe("Helix Ask response-boundary terminal mirrors", () => {
  it("normalizes stale top-level final-draft mirrors from typed-failure authority", () => {
    const failureText = "I could not produce a terminal answer for this turn.";
    const payload = {
      ok: true,
      response_type: "final_answer",
      final_status: "final_answer",
      status: "final_answer",
      terminal_artifact_kind: "model_synthesized_answer",
      final_answer_source: "final_answer_draft",
      terminal_error_code: "terminal_consistency_violation",
      selected_final_answer: "stale draft",
      answer: "stale draft",
      text: "stale draft",
      compound_prompt_coverage_gate: {
        schema: "helix.compound_prompt_coverage_gate.v1",
        applies: true,
        passed: false,
        decision: "FAIL_CLOSED",
      },
      terminal_answer_authority: {
        schema: "helix.terminal_authority.v1",
        terminal_kind: "failure",
        terminal_artifact_kind: "typed_failure",
        final_answer_source: "typed_failure",
        terminal_text_preview: failureText,
        server_authoritative: true,
      },
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        terminal_artifact_kind: "typed_failure",
        concise_text: failureText,
      },
      resolved_turn_summary: {
        final_status: "final_failure",
        terminal_artifact_kind: "typed_failure",
        final_answer_source: "typed_failure",
      },
      debug: {
        final_answer_source: "final_answer_draft",
      },
    };

    const normalized = __testHelixAskOutputContract.prepareHelixAskLiveResponsePayload(payload, { mode: "deep" }) as Record<string, unknown>;

    expect(normalized).toMatchObject({
      ok: false,
      response_type: "final_failure",
      final_status: "final_failure",
      status: "final_failure",
      terminal_artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      terminal_error_code: "compound_prompt_coverage_incomplete",
      selected_final_answer: failureText,
      answer: failureText,
      text: failureText,
    });
    expect(normalized.debug).toMatchObject({
      ok: false,
      response_type: "final_failure",
      final_status: "final_failure",
      terminal_artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      terminal_error_code: "compound_prompt_coverage_incomplete",
      selected_final_answer: failureText,
    });
  });

  it("normalizes debug-export cache envelopes from typed-failure authority", () => {
    const failureText = "Compound prompt coverage failed before terminal success.";
    const payload = {
      turn_id: "ask:test-debug-export-terminal-mirror",
      ok: true,
      response_type: "final_answer",
      final_status: "final_answer",
      status: "final_answer",
      terminal_artifact_kind: "model_synthesized_answer",
      final_answer_source: "final_answer_draft",
      terminal_error_code: "terminal_consistency_violation",
      selected_final_answer: "stale draft",
      answer: "stale draft",
      text: "stale draft",
      current_turn_artifact_ledger: [],
      compound_prompt_coverage_gate: {
        schema: "helix.compound_prompt_coverage_gate.v1",
        applies: true,
        passed: false,
        decision: "FAIL_CLOSED",
      },
      terminal_answer_authority: {
        schema: "helix.terminal_authority.v1",
        terminal_kind: "failure",
        terminal_artifact_kind: "typed_failure",
        final_answer_source: "typed_failure",
        terminal_text_preview: failureText,
        server_authoritative: true,
      },
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        terminal_artifact_kind: "typed_failure",
        concise_text: failureText,
      },
      resolved_turn_summary: {
        final_status: "final_failure",
        terminal_artifact_kind: "typed_failure",
        final_answer_source: "typed_failure",
      },
      debug: {
        final_answer_source: "final_answer_draft",
      },
    };

    const envelope = __testHelixAskOutputContract.buildHelixDebugExportEnvelope({
      payload,
      prompt: "Find scholarly sources, locate theory badges, then synthesize.",
      sessionId: "test-session",
    });

    expect(envelope).toMatchObject({
      selected_final_answer: failureText,
      final_answer_source: "typed_failure",
      terminal_error_code: "compound_prompt_coverage_incomplete",
      terminal_artifact_kind: "typed_failure",
      response_type: "final_failure",
      final_status: "final_failure",
      status: "final_failure",
      ok: false,
    });
    expect(envelope?.resolved_turn_summary).toMatchObject({
      final_status: "final_failure",
      terminal_artifact_kind: "typed_failure",
      terminal_error_code: "compound_prompt_coverage_incomplete",
      final_answer_source: "typed_failure",
    });
    expect(envelope?.terminal_answer_authority).toMatchObject({
      terminal_artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
    });
    expect(JSON.stringify(envelope)).not.toContain("terminal_consistency_violation");
  });

  it("normalizes terminal-consistency errors to typed failure when coverage is missing", () => {
    const failureText = "The turn failed before a terminal answer was authoritative.";
    const payload = {
      turn_id: "ask:test-missing-coverage-terminal-mirror",
      ok: true,
      response_type: "final_answer",
      final_status: "final_answer",
      status: "final_answer",
      terminal_artifact_kind: "model_synthesized_answer",
      final_answer_source: "final_answer_draft",
      terminal_error_code: "terminal_consistency_violation",
      selected_final_answer: "stale draft",
      answer: "stale draft",
      text: "stale draft",
      current_turn_artifact_ledger: [],
      terminal_answer_authority: {
        schema: "helix.terminal_authority.v1",
        terminal_kind: "failure",
        terminal_artifact_kind: "typed_failure",
        final_answer_source: "typed_failure",
        terminal_text_preview: failureText,
        server_authoritative: true,
      },
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        terminal_artifact_kind: "typed_failure",
        concise_text: failureText,
      },
      resolved_turn_summary: {
        final_status: "final_failure",
        terminal_artifact_kind: "typed_failure",
        final_answer_source: "typed_failure",
      },
      debug: {
        final_answer_source: "final_answer_draft",
      },
    };

    const normalized = __testHelixAskOutputContract.prepareHelixAskLiveResponsePayload(payload, { mode: "deep" }) as Record<string, any>;
    const envelope = __testHelixAskOutputContract.buildHelixDebugExportEnvelope({
      payload,
      prompt: "Use scholarly research then theory locator.",
      sessionId: "test-session",
    });

    expect(normalized).toMatchObject({
      ok: false,
      response_type: "final_failure",
      final_status: "final_failure",
      status: "final_failure",
      terminal_artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      terminal_error_code: "typed_failure",
    });
    expect(normalized.debug).toMatchObject({
      terminal_error_code: "typed_failure",
    });
    expect(envelope).toMatchObject({
      terminal_error_code: "typed_failure",
      terminal_artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
    });
    expect(envelope?.resolved_turn_summary).toMatchObject({
      terminal_error_code: "typed_failure",
      terminal_artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
    });
    expect(JSON.stringify(envelope)).not.toContain("terminal_consistency_violation");
  });
});
