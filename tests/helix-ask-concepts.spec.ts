import { describe, expect, it } from "vitest";
import { listConceptCandidates } from "../server/services/helix-ask/concepts";

describe("Helix Ask concept candidates", () => {
  it("returns the top concept match for known concepts", () => {
    const candidates = listConceptCandidates("What is epistemology?", 3);
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0].card.id).toBe("epistemology");
  });

  it("returns an empty list for unknown terms", () => {
    const candidates = listConceptCandidates("What is zorbglax?", 3);
    expect(candidates.length).toBe(0);
  });
});
