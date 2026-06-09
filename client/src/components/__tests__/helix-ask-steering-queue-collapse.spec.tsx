import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const helixAskPillSource = () =>
  fs.readFileSync(
    path.resolve(__dirname, "../helix/HelixAskPill.tsx"),
    "utf8",
  );

describe("HelixAskPill steering queue collapse", () => {
  it("renders the steering queue as a collapsible compact strip", () => {
    const source = helixAskPillSource();

    expect(source).toContain("steeringQueueExpanded");
    expect(source).toContain('aria-controls="helix-ask-steering-queue-items"');
    expect(source).toContain('data-expanded={steeringQueueExpanded ? "true" : "false"}');
    expect(source).toContain('{steeringQueueExpanded ? "Hide" : "Show"}');
  });

  it("does not render the old steering queue title and description", () => {
    const source = helixAskPillSource();

    expect(source).not.toContain(">Steering Queue<");
    expect(source).not.toContain("Next up at top. Completed steering remains below in chronological order.");
  });
});
