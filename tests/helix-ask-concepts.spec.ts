import { describe, expect, it } from "vitest";
import { buildConceptScaffold, findConceptMatch, renderConceptAnswer } from "../server/services/helix-ask/concepts";

describe("Helix Ask concept registry", () => {
  it("matches epistemology definitions", () => {
    const match = findConceptMatch("What is epistemology?");
    expect(match).not.toBeNull();
    expect(match?.card.id).toBe("epistemology");
    const scaffold = buildConceptScaffold(match);
    expect(scaffold).toContain("Definition:");
  });

  it("matches platonic reasoning aliases", () => {
    const match = findConceptMatch("Explain platonic logic in this system");
    expect(match).not.toBeNull();
    expect(match?.card.id).toBe("platonic-reasoning");
  });

  it("renders a deterministic concept answer", () => {
    const match = findConceptMatch("What is epistemology?");
    const answer = renderConceptAnswer(match);
    expect(answer).toContain("Epistemology");
    expect(answer).toContain("In practice");
    expect(answer).not.toContain("questions like:");
  });

  it("matches casimir effect from subdirectories", () => {
    const match = findConceptMatch("What is the Casimir effect?");
    expect(match).not.toBeNull();
    expect(match?.card.id).toBe("casimir-force-energy");
  });

  it("matches warp bubble from subdirectories", () => {
    const match = findConceptMatch("What is a warp bubble?");
    expect(match).not.toBeNull();
    expect(match?.card.id).toBe("warp-bubble");
  });
});
