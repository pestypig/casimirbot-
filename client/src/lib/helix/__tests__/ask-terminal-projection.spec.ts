import { describe, expect, it } from "vitest";
import {
  buildVisibleResolvedTurn,
  isInvalidTerminalAnswerText,
  normalizeTerminalAnswerText,
  readHelixTopLevelPendingServerRequest,
  renderLiveAnswerEnvironmentContextPackAnswer,
  resolveHelixAskVisibleJobReadyLinks,
} from "@/lib/helix/ask-terminal-projection";

describe("Helix Ask terminal projection", () => {
  it("normalizes terminal answer text and recognizes invalid placeholders", () => {
    expect(normalizeTerminalAnswerText(" \u00a0No final answer returned.  ")).toBe("No final answer returned.");
    expect(isInvalidTerminalAnswerText("")).toBe(true);
    expect(isInvalidTerminalAnswerText("No final answer returned.")).toBe(true);
    expect(isInvalidTerminalAnswerText("I could not produce a substantive direct answer for this background-only turn.")).toBe(
      true,
    );
    expect(isInvalidTerminalAnswerText("I couldn't produce a final answer for that turn. Please retry once.")).toBe(true);
    expect(
      isInvalidTerminalAnswerText("I need retrieval before finalizing this claim. I do not yet have grounded evidence references for it."),
    ).toBe(true);
    expect(isInvalidTerminalAnswerText("  grounded answer ready  ")).toBe(false);
  });

  it("reads unresolved top-level pending server requests", () => {
    expect(
      readHelixTopLevelPendingServerRequest({
        id: "reply-1",
        pending_server_request: {
          request_id: "req-1",
          prompt: "Which file should I open?",
          required_fields: ["path"],
        },
      }),
    ).toMatchObject({ request_id: "req-1" });
    expect(
      readHelixTopLevelPendingServerRequest({
        id: "reply-2",
        pending_server_request: {
          request_id: "req-2",
          prompt: "Resolved",
          status: "resolved",
        },
      }),
    ).toBeNull();
  });

  it("renders live-answer environment context-pack answer copy", () => {
    expect(
      renderLiveAnswerEnvironmentContextPackAnswer({
        live_answer_environment: {
          latest_summary: "The current environment summary.",
          lines: [
            { visibility: "answer_card", label: "State", value: "ready" },
            { visibility: "debug", label: "Hidden", value: "ignored" },
          ],
        },
        utility_hypotheses: [
          { utility_label: "useful source", status: "candidate", confidence: 0.42 },
        ],
        missing_evidence_notes: ["need source citation"],
        semantic_confidence_ladder: ["low", "medium"],
      }),
    ).toBe(
      [
        "The current environment summary.",
        "Hypothesis: candidate useful source (confidence 0.42).",
        "Missing evidence: need source citation.",
        "Semantic confidence: low; medium.",
        "State: ready",
      ].join("\n"),
    );
    expect(renderLiveAnswerEnvironmentContextPackAnswer({})).toBeNull();
  });

  it("lets successful Codex workstation terminal authority outrank stale typed-failure projection fields", () => {
    const visible = buildVisibleResolvedTurn({
      id: "reply-codex-workstation-success",
      turn_id: "turn-codex-workstation-success",
      ok: true,
      selected_final_answer: "I don't have a scientific-calculator.solve_expression observation packet for 8*9.",
      final_answer_source: "typed_failure",
      terminal_artifact_kind: "typed_failure",
      terminal_error_code: "calculator_gateway_solve_observation_missing",
      debug: {
        terminal_answer_authority: {
          schema: "helix.turn_terminal_authority.v1",
          turn_id: "turn-codex-workstation-success",
          server_authoritative: true,
          terminal_text_preview: "Observed expression: 8*9\nResult: 72",
          final_answer_source: "agent_provider_terminal_candidate",
          terminal_artifact_kind: "agent_provider_terminal_candidate",
        },
        terminal_result: {
          terminal_authority_ok: true,
          route_authority_ok: true,
          text: "Observed expression: 8*9\nResult: 72",
          final_answer_source: "agent_provider_terminal_candidate",
          terminal_artifact_kind: "agent_provider_terminal_candidate",
        },
      },
    });

    expect(visible.primary_terminal_label).toBe("final_answer");
    expect(visible.primary_source_label).not.toBe("typed failure");
    expect(visible.terminal_error_code).toBeNull();
    expect(visible.selected_final_answer).toBe("Observed expression: 8*9\nResult: 72");
  });

  it("projects backend-selected quoted tool-name explanations instead of stale retrieval fallbacks", () => {
    const answer =
      "`internet-search.search_web` is a capability or tool identifier. It names an internet-search module/action that would perform a web search if invoked. In this request, it is just text: the phrase is being discussed literally, not executed.";
    const staleFallback = "I need retrieval before finalizing this claim. I do not yet have grounded evidence references for it.";

    const visible = buildVisibleResolvedTurn({
      id: "reply-negative-quoted-internet",
      turn_id: "ask:negative-quoted-internet",
      ok: false,
      content: staleFallback,
      text: staleFallback,
      selected_final_answer: answer,
      final_answer_source: "model_direct_answer",
      debug: {
        selected_final_answer: answer,
        final_answer_source: "model_direct_answer",
        workstation_gateway_call_results: [],
        workstation_gateway_observation_packets: [],
      },
    });

    expect(visible.primary_terminal_label).toBe("final_answer");
    expect(visible.terminal_error_code).toBeNull();
    expect(visible.selected_final_answer).toBe(answer);
    expect(visible.selected_final_answer).not.toBe(staleFallback);
  });

  it("hides job-ready links on failure terminals and keeps valid links on successful turns", () => {
    const link = {
      label: "Open note: Stage Play Live-Source Findings",
      panel_id: "workstation-notes",
      action_id: "set_active_note",
      args: { title: "Stage Play Live-Source Findings" },
    };

    expect(
      resolveHelixAskVisibleJobReadyLinks({
        id: "turn-note-link-typed-failure",
        final_answer_source: "typed_failure",
        terminal_artifact_kind: "typed_failure",
        debug: {
          job_ready_links: [link],
        },
      }),
    ).toEqual([]);

    expect(
      resolveHelixAskVisibleJobReadyLinks({
        id: "turn-note-link-success",
        final_answer_source: "final_answer_draft",
        terminal_artifact_kind: "model_synthesized_answer",
        debug: {
          job_ready_links: [link, { panel_id: "missing-action" }, "ignored"],
        },
      }),
    ).toEqual([link]);
  });
});
