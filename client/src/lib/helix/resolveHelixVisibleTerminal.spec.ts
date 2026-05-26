import { describe, expect, it } from "vitest";

import { resolveHelixVisibleTerminal } from "./resolveHelixVisibleTerminal";

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

  it("allows legacy shadows only for non-source compatibility turns", () => {
    const terminal = resolveHelixVisibleTerminal({
      content: "plain model-only answer",
    });

    expect(terminal.text).toBe("plain model-only answer");
    expect(terminal.source).toBe("legacy_shadow");
    expect(terminal.usedLegacyShadow).toBe(true);
  });
});
