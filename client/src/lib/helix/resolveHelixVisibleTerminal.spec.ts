import { describe, expect, it } from "vitest";

import {
  formatHelixVisibleTerminalSourceLabel,
  resolveHelixVisibleTerminal,
  shouldShowHelixRuntimeStopReason,
} from "./resolveHelixVisibleTerminal";

describe("resolveHelixVisibleTerminal", () => {
  it("prefers terminal envelope text over stale legacy fields", () => {
    const terminal = resolveHelixVisibleTerminal({
      selected_final_answer: "stale selected answer",
      content: "stale content",
      terminal_answer_envelope: {
        schema: "helix.terminal_answer_envelope.v1",
        terminal_text: "authoritative envelope answer",
        terminal_kind: "direct_answer_text",
        final_answer_source: "artifact_synthesis",
      },
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        server_authoritative: true,
        terminal_text_preview: "authoritative envelope answer",
      },
    });

    expect(terminal.text).toBe("authoritative envelope answer");
    expect(terminal.source).toBe("terminal_answer_envelope");
    expect(terminal.usedLegacyShadow).toBe(false);
  });

  it("lets a successful backend envelope supersede stale failure fields", () => {
    const terminal = resolveHelixVisibleTerminal({
      selected_final_answer: "I could not complete that turn.\nCause: pending_request_missing.",
      final_answer_source: "typed_failure",
      terminal_artifact_kind: "typed_failure",
      terminal_error_code: "pending_request_missing",
      pending_server_request: {
        schema: "helix.pending_server_request.v1",
        status: "pending",
      },
      terminal_answer_envelope: {
        schema: "helix.terminal_answer_envelope.v1",
        terminal_text: "Calculator-backed result: ((sqrt(81)+ln(e^3))*7-5^2)/2 = 29.5.",
        terminal_kind: "answer",
        terminal_artifact_kind: "workstation_tool_evaluation",
        final_answer_source: "workstation_tool_evaluation",
      },
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        server_authoritative: true,
        terminal_kind: "answer",
        terminal_text_preview: "Calculator-backed result: ((sqrt(81)+ln(e^3))*7-5^2)/2 = 29.5.",
        terminal_artifact_kind: "workstation_tool_evaluation",
        final_answer_source: "workstation_tool_evaluation",
      },
    });

    expect(terminal.text).toContain("29.5");
    expect(terminal.source).toBe("terminal_answer_envelope");
    expect(terminal.terminalErrorCode).toBeNull();
    expect(terminal.finalAnswerSource).toBe("workstation_tool_evaluation");
    expect(terminal.terminalArtifactKind).toBe("workstation_tool_evaluation");
  });

  it("normalizes stale final answer draft source to the selected workstation terminal artifact", () => {
    const terminal = resolveHelixVisibleTerminal({
      selected_final_answer: "Calculator-backed result: ((sqrt(81)+ln(e^3))*7-5^2)/2 = 29.5.",
      final_answer_source: "final_answer_draft",
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        server_authoritative: true,
        terminal_kind: "answer",
        terminal_text_preview: "Calculator-backed result: ((sqrt(81)+ln(e^3))*7-5^2)/2 = 29.5.",
        terminal_artifact_kind: "workstation_tool_evaluation",
        final_answer_source: "final_answer_draft",
      },
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        terminal_artifact_kind: "workstation_tool_evaluation",
        concise_text: "Calculator-backed result: ((sqrt(81)+ln(e^3))*7-5^2)/2 = 29.5.",
      },
      resolved_turn_summary: {
        final_status: "final_answer",
        resolved_route_label: "calculator_solve / model_synthesized_answer",
        terminal_artifact_kind: "workstation_tool_evaluation",
      },
    });

    expect(terminal.text).toContain("29.5");
    expect(terminal.source).toBe("terminal_answer_authority");
    expect(terminal.terminalArtifactKind).toBe("workstation_tool_evaluation");
    expect(terminal.finalAnswerSource).toBe("workstation_tool_evaluation");
    expect(
      formatHelixVisibleTerminalSourceLabel({
        terminalArtifactKind: terminal.terminalArtifactKind,
        finalAnswerSource: terminal.finalAnswerSource,
      }),
    ).toBe("workstation tool evaluation");
  });

  it("prefers terminal envelope text over stale model-synthesis selected_final_answer", () => {
    const terminal = resolveHelixVisibleTerminal({
      selected_final_answer: "stale model synthesis",
      final_answer_source: "final_answer_draft",
      terminal_artifact_kind: "model_synthesized_answer",
      terminal_answer_envelope: {
        schema: "helix.terminal_answer_envelope.v1",
        terminal_text: "authoritative model synthesis",
        terminal_kind: "answer",
        terminal_artifact_kind: "model_synthesized_answer",
        final_answer_source: "final_answer_draft",
      },
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        server_authoritative: true,
        terminal_text_preview: "authoritative model synthesis",
        terminal_artifact_kind: "model_synthesized_answer",
        final_answer_source: "final_answer_draft",
      },
    });

    expect(terminal.text).toBe("authoritative model synthesis");
    expect(terminal.source).toBe("terminal_answer_envelope");
  });

  it("uses authoritative doc summary terminal surfaces over stale authority-missing content", () => {
    const summary =
      "Summary of docs/helix-ask-flow.md:\n- Routing enters Helix Ask through source-target arbitration.\n- Evidence must re-enter the solver path before terminal authority.\n- Presentation mirrors the selected terminal artifact.";
    const terminal = resolveHelixVisibleTerminal({
      content: "I could not complete that turn.\nCause: terminal_authority_missing.",
      selected_final_answer: summary,
      final_answer_source: "artifact_synthesis",
      terminal_artifact_kind: "doc_summary",
      terminal_answer_envelope: {
        schema: "helix.terminal_answer_envelope.v1",
        terminal_text: summary,
        terminal_kind: "answer",
        terminal_artifact_kind: "doc_summary",
        final_answer_source: "artifact_synthesis",
      },
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        server_authoritative: true,
        terminal_text_preview: summary,
        terminal_artifact_kind: "doc_summary",
        final_answer_source: "artifact_synthesis",
      },
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        concise_text: summary,
        terminal_artifact_kind: "doc_summary",
      },
      resolved_turn_summary: {
        final_status: "final_answer",
        terminal_artifact_kind: "doc_summary",
        terminal_error_code: null,
      },
    });

    expect(terminal.text).toBe(summary);
    expect(terminal.source).toBe("terminal_answer_envelope");
    expect(terminal.terminalErrorCode).toBeNull();
    expect(terminal.text).not.toContain("terminal_authority_missing");
  });

  it("does not let source-targeted legacy selected_final_answer become visible truth without authority", () => {
    const terminal = resolveHelixVisibleTerminal({
      selected_final_answer: "legacy ghost answer",
      final_answer_source: "artifact_synthesis",
      canonical_goal_frame: {
        goal_kind: "doc_open_best",
      },
      source_target_intent: {
        target_source: "active_doc",
        strength: "hard",
      },
    });

    expect(terminal.text).toContain("terminal_authority_missing");
    expect(terminal.text).not.toContain("legacy ghost answer");
    expect(terminal.source).toBe("terminal_authority_missing");
  });

  it("does not let source-targeted terminal presentation become visible truth without authority", () => {
    const terminal = resolveHelixVisibleTerminal({
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        concise_text: "presentation-only answer",
        terminal_artifact_kind: "doc_summary",
      },
      canonical_goal_frame: {
        goal_kind: "doc_summary",
      },
      source_target_intent: {
        target_source: "docs_viewer",
        strength: "hard",
      },
    });

    expect(terminal.text).toContain("terminal_authority_missing");
    expect(terminal.text).not.toContain("presentation-only answer");
    expect(terminal.source).toBe("terminal_authority_missing");
  });

  it("allows legacy shadows only for non-source compatibility turns", () => {
    const terminal = resolveHelixVisibleTerminal({
      content: "plain model-only answer",
    });

    expect(terminal.text).toBe("plain model-only answer");
    expect(terminal.source).toBe("legacy_shadow");
    expect(terminal.usedLegacyShadow).toBe(true);
  });

  it("uses selected final answer for model-synthesized final drafts instead of concise presentation text", () => {
    const terminal = resolveHelixVisibleTerminal({
      selected_final_answer: "Long model-authored synthesis with field, photon, probability, and geodesic details.",
      final_answer_source: "final_answer_draft",
      terminal_artifact_kind: "model_synthesized_answer",
      terminal_presentation: {
        concise_text: "Short projection.",
      },
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        server_authoritative: true,
        terminal_text_preview: "Short projection.",
        terminal_artifact_kind: "model_synthesized_answer",
        final_answer_source: "final_answer_draft",
      },
    });

    expect(terminal.text).toBe("Long model-authored synthesis with field, photon, probability, and geodesic details.");
    expect(terminal.source).toBe("selected_final_answer");
    expect(terminal.usedLegacyShadow).toBe(false);
  });

  it("recovers a satisfied model-direct answer artifact from stale placeholder failure text", () => {
    const terminal = resolveHelixVisibleTerminal({
      selected_final_answer: "I could not produce a terminal answer for this turn.",
      terminal_artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      terminal_error_code: "direct_answer_unavailable",
      goal_satisfaction_evaluation: {
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      direct_answer_text: {
        schema: "helix.direct_answer_text.v1",
        text: "An electron is a negatively charged elementary particle.",
      },
      final_answer_draft: {
        schema: "helix.final_answer_draft.v1",
        text: "An electron is a negatively charged elementary particle.",
      },
    });

    expect(terminal.text).toBe("An electron is a negatively charged elementary particle.");
    expect(terminal.source).toBe("model_direct_answer_artifact");
    expect(terminal.usedLegacyShadow).toBe(false);
  });
});

describe("formatHelixVisibleTerminalSourceLabel", () => {
  it("labels source-backed doc summaries by terminal product instead of model source", () => {
    expect(
      formatHelixVisibleTerminalSourceLabel({
        terminalArtifactKind: "doc_summary",
        finalAnswerSource: "model_direct_answer",
      }),
    ).toBe("doc summary");
  });

  it("keeps true model-direct answers labeled as model direct", () => {
    expect(
      formatHelixVisibleTerminalSourceLabel({
        terminalArtifactKind: "direct_answer_text",
        finalAnswerSource: "model_direct_answer",
      }),
    ).toBe("model direct answer");
  });

  it("labels scholarly research terminal products by terminal product", () => {
    expect(
      formatHelixVisibleTerminalSourceLabel({
        terminalArtifactKind: "scholarly_research_answer",
        finalAnswerSource: "final_answer_draft",
      }),
    ).toBe("scholarly research answer");
  });
});

describe("shouldShowHelixRuntimeStopReason", () => {
  it("hides exhausted budget labels when the terminal was successful", () => {
    expect(
      shouldShowHelixRuntimeStopReason({
        stopReason: "budget_exhausted",
        finalStatus: "final_answer",
        solverDecision: "allow_terminal",
        terminalKind: "doc_summary",
      }),
    ).toBe(false);
  });

  it("hides exhausted budget labels when final status is absent but terminal kind is final answer", () => {
    expect(
      shouldShowHelixRuntimeStopReason({
        stopReason: "budget_exhausted",
        solverDecision: "allow_terminal",
        terminalKind: "final_answer",
      }),
    ).toBe(false);
  });

  it("keeps exhausted budget labels when a terminal error remains", () => {
    expect(
      shouldShowHelixRuntimeStopReason({
        stopReason: "budget_exhausted",
        finalStatus: "final_answer",
        terminalErrorCode: "selected_capability_observation_missing",
        solverDecision: "fail_closed",
        terminalKind: "typed_failure",
      }),
    ).toBe(true);
  });
});
