import { beforeAll, describe, expect, it } from "vitest";

let chooseVisibleFinalText: typeof import("@/components/helix/HelixAskPill").chooseVisibleFinalText;

beforeAll(async () => {
  (globalThis as Record<string, unknown>).__HELIX_ASK_JOB_TIMEOUT_MS__ = undefined;
  ({ chooseVisibleFinalText } = await import("@/components/helix/HelixAskPill"));
});

describe("Helix Ask E65 rendering invariants", () => {
  it("keeps typed failure text ahead of stale successful Locations text", () => {
    const reply = {
      id: "turn-e65-rendering",
      turn_id: "turn-e65-rendering",
      content: "Locations:\n- /docs/nhm2.md:L10-L12",
      text: "Locations:\n- /docs/nhm2.md:L10-L12",
      selected_final_answer:
        "I found candidate context, but no current-turn location artifact proved the requested target.\nCause: doc_evidence_location_unavailable.",
      final_answer_source: "typed_failure",
      terminal_error_code: "doc_evidence_location_unavailable",
      final_rendering_invariant: {
        visible_answer_shape: "typed_failure",
        violations: [],
      },
    };

    const text = chooseVisibleFinalText(reply as never);

    expect(text).toContain("doc_evidence_location_unavailable");
    expect(text).not.toMatch(/^Locations:/);
  });
});
