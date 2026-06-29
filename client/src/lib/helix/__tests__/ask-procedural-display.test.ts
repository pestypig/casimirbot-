import { describe, expect, it } from "vitest";

import {
  formatWorkstationIntentStageDetail,
  readProceduralActionLabel,
} from "@/lib/helix/ask-procedural-display";

describe("ask procedural display", () => {
  it("formats procedural action labels", () => {
    expect(readProceduralActionLabel({ panel_id: "docs-viewer", action_id: "open_doc" })).toBe(
      "docs-viewer.open_doc",
    );
    expect(readProceduralActionLabel({ action_id: "summarize" })).toBe("summarize");
    expect(readProceduralActionLabel(null)).toBe("model step");
  });

  it("formats workstation intent stage details", () => {
    expect(
      formatWorkstationIntentStageDetail({
        action: { panel_id: "scientific-calculator", action_id: "solve" },
        outcome: "command_parse",
      }),
    ).toBe("workstation_intent_stage | action_resolved | command_parse");
    expect(formatWorkstationIntentStageDetail({ outcome: "no_match_timeout" })).toBe(
      "workstation_intent_stage | no_action_match | timeout_fallback",
    );
    expect(
      formatWorkstationIntentStageDetail({
        action: { action_id: "open_panel" },
        outcome: "fallback_low_confidence_match",
      }),
    ).toBe("workstation_intent_stage | action_resolved | low_confidence_fallback");
  });
});
