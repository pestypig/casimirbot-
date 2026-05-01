import { beforeAll, describe, expect, it } from "vitest";

let buildVisibleResolvedTurn: typeof import("@/components/helix/HelixAskPill").buildVisibleResolvedTurn;
let chooseVisibleFinalText: typeof import("@/components/helix/HelixAskPill").chooseVisibleFinalText;

beforeAll(async () => {
  ({ buildVisibleResolvedTurn, chooseVisibleFinalText } = await import("@/components/helix/HelixAskPill"));
});

describe("Helix Ask E63 terminal projection", () => {
  it("uses resolved final failure state over stale clarification history", () => {
    const reply = {
      id: "turn-e63-equation",
      turn_id: "turn-e63-equation",
      content: "typed failure body",
      ok: false,
      selected_final_answer: "I looked for an NHM2 equation source, but none satisfied the equation contract.",
      final_answer_source: "typed_failure",
      terminal_error_code: "equation_source_unavailable",
      pending_server_request: null,
      resolved_turn_summary: {
        turn_id: "turn-e63-equation",
        final_status: "final_failure",
        terminal_error_code: "equation_source_unavailable",
        resolved_route_label: "doc_equation_location / typed_failure:equation_source_unavailable",
      },
      debug: {
        route_history_debug: {
          rejected_route_candidates: [
            {
              route: "needs_user_input / clarify:missing_args",
              rejected_reason: "overridden_by_final_failure",
            },
          ],
        },
        pending_server_request: {
          request_id: "stale-debug-request",
          prompt: "stale",
        },
      },
    };

    const visible = buildVisibleResolvedTurn(reply as never);

    expect(visible).toMatchObject({
      active_turn_id: "turn-e63-equation",
      primary_route_label: "doc_equation_location / typed_failure:equation_source_unavailable",
      primary_terminal_label: "final_failure",
      primary_source_label: "typed failure",
      terminal_error_code: "equation_source_unavailable",
      pending_server_request_present: false,
    });
  });

  it("renders selected typed failure text instead of stale search result text", () => {
    const reply = {
      id: "turn-e63-synthesis",
      turn_id: "turn-e63-synthesis",
      content: "Search results:\n- docs/nhm2.md",
      text: "Search results:\n- docs/nhm2.md",
      selected_final_answer: "I could not synthesize an answer from the current NHM2 evidence.\nCause: synthesis_unavailable.",
      final_answer_source: "typed_failure",
      terminal_error_code: "synthesis_unavailable",
      pending_server_request: null,
      resolved_turn_summary: {
        final_status: "final_failure",
        resolved_route_label: "doc_evidence_synthesis / typed_failure:synthesis_unavailable",
        terminal_error_code: "synthesis_unavailable",
      },
    };

    const text = chooseVisibleFinalText(reply as never);

    expect(text).toContain("synthesize an answer");
    expect(text).toContain("synthesis_unavailable");
    expect(text).not.toMatch(/^Search results:/);
  });
});
