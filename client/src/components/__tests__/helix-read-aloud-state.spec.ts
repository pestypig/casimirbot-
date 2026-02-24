import { beforeAll, describe, expect, it } from "vitest";

let transitionReadAloudState: typeof import("@/components/helix/HelixAskPill").transitionReadAloudState;
let buildSpeakText: typeof import("@/components/helix/HelixAskPill").buildSpeakText;
let isActivePlayback: typeof import("@/components/helix/HelixAskPill").isActivePlayback;

beforeAll(async () => {
  (globalThis as Record<string, unknown>).__HELIX_ASK_JOB_TIMEOUT_MS__ = "1200000";
  ({ transitionReadAloudState, buildSpeakText, isActivePlayback } = await import("@/components/helix/HelixAskPill"));
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

describe("buildSpeakText", () => {
  it("caps long text to <= 600 chars with truncation marker", () => {
    const longText = `${"A".repeat(300)}. ${"B".repeat(320)}. ${"C".repeat(200)}`;
    const speakText = buildSpeakText(longText);

    expect(speakText.length).toBeLessThanOrEqual(600);
    expect(speakText.endsWith("…")).toBe(true);
  });

  it("returns empty for blank input", () => {
    expect(buildSpeakText("   ")).toBe("");
  });
});

describe("isActivePlayback", () => {
  it("prevents stale ended handlers from mutating active playback", () => {
    const oldAudio = {} as HTMLAudioElement;
    const newAudio = {} as HTMLAudioElement;

    expect(isActivePlayback(newAudio, oldAudio)).toBe(false);
    expect(isActivePlayback(newAudio, newAudio)).toBe(true);
  });
});
