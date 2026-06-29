import { describe, expect, it } from "vitest";
import { readProceduralActionLabel } from "@/lib/helix/ask-procedural-display";

describe("Helix Ask procedural display", () => {
  it("formats panel action labels for timeline and debug-copy text", () => {
    expect(readProceduralActionLabel({ panel_id: "docs-viewer", action_id: "summarize_doc" })).toBe(
      "docs-viewer.summarize_doc",
    );
    expect(readProceduralActionLabel({ panel_id: "   docs-viewer   ", action_id: "   search_docs   " })).toBe(
      "docs-viewer.search_docs",
    );
  });

  it("falls back to action id or model step without taking behavior authority", () => {
    expect(readProceduralActionLabel({ action_id: "solve_expression" })).toBe("solve_expression");
    expect(readProceduralActionLabel({ panel_id: "scientific-calculator" })).toBe("model step");
    expect(readProceduralActionLabel(null)).toBe("model step");
    expect(readProceduralActionLabel(["not", "a", "record"])).toBe("model step");
  });
});
