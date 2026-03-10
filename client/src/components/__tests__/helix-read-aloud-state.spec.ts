import { beforeAll, describe, expect, it } from "vitest";

let transitionReadAloudState: typeof import("@/components/helix/HelixAskPill").transitionReadAloudState;
let buildSpeakText: typeof import("@/components/helix/HelixAskPill").buildSpeakText;
let isActivePlayback: typeof import("@/components/helix/HelixAskPill").isActivePlayback;
let shouldAutoSpeakVoiceDecisionLifecycle: typeof import("@/components/helix/HelixAskPill").shouldAutoSpeakVoiceDecisionLifecycle;
let shouldInterruptForSupersededReason: typeof import("@/components/helix/HelixAskPill").shouldInterruptForSupersededReason;
let stripVoiceCitationArtifacts: typeof import("@/components/helix/HelixAskPill").stripVoiceCitationArtifacts;

beforeAll(async () => {
  (globalThis as Record<string, unknown>).__HELIX_ASK_JOB_TIMEOUT_MS__ = "1200000";
  ({
    transitionReadAloudState,
    buildSpeakText,
    isActivePlayback,
    shouldAutoSpeakVoiceDecisionLifecycle,
    shouldInterruptForSupersededReason,
    stripVoiceCitationArtifacts,
  } = await import("@/components/helix/HelixAskPill"));
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
    expect(speakText.endsWith("...") || speakText.endsWith("…")).toBe(true);
  });

  it("returns empty for blank input", () => {
    expect(buildSpeakText("   ")).toBe("");
  });

  it("removes file/link citation artifacts for voice fluidity", () => {
    const text = [
      "Negative energy density is theoretical.",
      "Sources: docs/knowledge/physics/einstein-field-equations.md",
      "Tree Walk: Physics Foundations Walk (tree-derived; source: docs/knowledge/physics/physics-foundations-tree.json)",
      "Read this [reference](https://example.com/deep/link).",
    ].join("\n");
    const spoken = buildSpeakText(text, 2000);
    expect(spoken).toContain("Negative energy density is theoretical.");
    expect(spoken).toContain("Tree Walk: Physics Foundations Walk");
    expect(spoken).toContain("Read this reference.");
    expect(spoken).not.toContain("docs/knowledge/physics");
    expect(spoken).not.toContain("Sources:");
    expect(spoken).not.toContain("https://example.com");
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

describe("shouldAutoSpeakVoiceDecisionLifecycle", () => {
  it("speaks queued plus suppression/failure lifecycle updates", () => {
    expect(shouldAutoSpeakVoiceDecisionLifecycle("queued")).toBe(true);
    expect(shouldAutoSpeakVoiceDecisionLifecycle("suppressed")).toBe(true);
    expect(shouldAutoSpeakVoiceDecisionLifecycle("escalated")).toBe(false);
    expect(shouldAutoSpeakVoiceDecisionLifecycle("failed")).toBe(true);
    expect(shouldAutoSpeakVoiceDecisionLifecycle("running")).toBe(false);
    expect(shouldAutoSpeakVoiceDecisionLifecycle("done")).toBe(false);
  });
});

describe("shouldInterruptForSupersededReason", () => {
  it("does not preempt a synthesizing brief before first audio frame", () => {
    expect(shouldInterruptForSupersededReason("preempted_by_final", false)).toBe(false);
    expect(shouldInterruptForSupersededReason("preempted_by_final", true)).toBe(true);
    expect(shouldInterruptForSupersededReason("superseded_new_turn", false)).toBe(true);
    expect(shouldInterruptForSupersededReason(null, true)).toBe(false);
  });
});

describe("stripVoiceCitationArtifacts", () => {
  it("strips raw file path and source trailers while preserving sentence content", () => {
    const cleaned = stripVoiceCitationArtifacts(
      "Tree Walk: Warp Mechanics (tree-derived; source: docs/knowledge/warp/warp-mechanics-tree.json)",
    );
    expect(cleaned).toBe("Tree Walk: Warp Mechanics (tree-derived)");
  });
});
