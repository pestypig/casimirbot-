import { beforeAll, describe, expect, it } from "vitest";

let transitionReadAloudState: typeof import("@/components/helix/HelixAskPill").transitionReadAloudState;

beforeAll(async () => {
  (globalThis as Record<string, unknown>).__HELIX_ASK_JOB_TIMEOUT_MS__ = "1200000";
  ({ transitionReadAloudState } = await import("@/components/helix/HelixAskPill"));
});

describe("transitionReadAloudState", () => {
  it("covers deterministic playback state transitions", () => {
    expect(transitionReadAloudState("idle", "request")).toBe("requesting");
    expect(transitionReadAloudState("requesting", "audio")).toBe("playing");
    expect(transitionReadAloudState("requesting", "dry-run")).toBe("dry-run");
    expect(transitionReadAloudState("requesting", "error")).toBe("error");
    expect(transitionReadAloudState("playing", "ended")).toBe("idle");
    expect(transitionReadAloudState("playing", "stop")).toBe("idle");
  });
});
