import { describe, expect, it } from "vitest";
import { getTrajectory } from "../server/services/evolution/trajectory";
import { appendPatchRecord } from "../server/services/evolution/patch-store";

describe("evolution trajectory", () => {
  it("returns deterministic trajectory summary", () => {
    appendPatchRecord({
      patchId: "patch:test-trajectory",
      ts: "2026-02-23T00:00:00.000Z",
      title: "Trajectory",
      touchedPaths: ["server/routes/evolution.ts"],
      intentTags: ["evolution"],
    });
    const result = getTrajectory("patch:test-trajectory");
    expect(result).toBeTruthy();
    expect(result?.id).toBe("patch:test-trajectory");
    expect(result?.rollingState.patchesSeen).toBeGreaterThan(0);
  });
});
