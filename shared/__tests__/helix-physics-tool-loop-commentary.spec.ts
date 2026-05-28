import { describe, expect, it } from "vitest";
import { buildPhysicsToolLoopCommentaryEvent } from "../helix-physics-tool-loop-commentary";

describe("helix physics tool loop commentary", () => {
  it("builds witness-only commentary without private reasoning flags", () => {
    const event = buildPhysicsToolLoopCommentaryEvent({
      planId: "plan:test",
      kind: "locator",
      timing: "after_step",
      status: "done",
      text: "I found the prompt on the Solar Spectrum atlas lens.",
      observedArtifactKind: "theory_badge_locator",
    });

    expect(event.assistantAnswer).toBe(false);
    expect(event.rawReasoningIncluded).toBe(false);
    expect(event.text).not.toMatch(/hidden chain|private reasoning/i);
    expect(event.observedArtifactKind).toBe("theory_badge_locator");
  });
});
