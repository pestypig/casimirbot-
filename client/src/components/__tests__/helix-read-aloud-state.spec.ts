import { beforeAll, describe, expect, it } from "vitest";

let transitionReadAloudState: typeof import("@/components/helix/HelixAskPill").transitionReadAloudState;
let buildSpeakText: typeof import("@/components/helix/HelixAskPill").buildSpeakText;
let isActivePlayback: typeof import("@/components/helix/HelixAskPill").isActivePlayback;
let shouldAutoSpeakVoiceDecisionLifecycle: typeof import("@/components/helix/HelixAskPill").shouldAutoSpeakVoiceDecisionLifecycle;
let shouldInterruptForSupersededReason: typeof import("@/components/helix/HelixAskPill").shouldInterruptForSupersededReason;
let stripVoiceCitationArtifacts: typeof import("@/components/helix/HelixAskPill").stripVoiceCitationArtifacts;
let shouldDispatchReasoningAttempt: typeof import("@/components/helix/HelixAskPill").shouldDispatchReasoningAttempt;
let shouldForceObserveDispatchFromSuppression: typeof import("@/components/helix/HelixAskPill").shouldForceObserveDispatchFromSuppression;
let isArtifactDominatedReasoningText: typeof import("@/components/helix/HelixAskPill").isArtifactDominatedReasoningText;
let sanitizeReasoningOutputText: typeof import("@/components/helix/HelixAskPill").sanitizeReasoningOutputText;
let hasDanglingTurnTail: typeof import("@/components/helix/HelixAskPill").hasDanglingTurnTail;
let isLowInformationTailTranscript: typeof import("@/components/helix/HelixAskPill").isLowInformationTailTranscript;
let decideExplorationLadderAction: typeof import("@/components/helix/HelixAskPill").decideExplorationLadderAction;

beforeAll(async () => {
  (globalThis as Record<string, unknown>).__HELIX_ASK_JOB_TIMEOUT_MS__ = "1200000";
  ({
    transitionReadAloudState,
    buildSpeakText,
    isActivePlayback,
    shouldAutoSpeakVoiceDecisionLifecycle,
    shouldInterruptForSupersededReason,
    stripVoiceCitationArtifacts,
    shouldDispatchReasoningAttempt,
    shouldForceObserveDispatchFromSuppression,
    isArtifactDominatedReasoningText,
    sanitizeReasoningOutputText,
    hasDanglingTurnTail,
    isLowInformationTailTranscript,
    decideExplorationLadderAction,
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

  it("stays quiet for superseded interruption lifecycle updates", () => {
    expect(
      shouldAutoSpeakVoiceDecisionLifecycle("failed", {
        failReasonRaw: "the run was interrupted by a newer turn",
      }),
    ).toBe(false);
    expect(
      shouldAutoSpeakVoiceDecisionLifecycle("suppressed", {
        routeReasonCode: "voice_turn_superseded_by_newer_attempt",
      }),
    ).toBe(false);
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

  it("strips bare file basenames and extension residue tokens", () => {
    const cleaned = stripVoiceCitationArtifacts(
      "ts, server/services/planner/grounding.ts. Constraint: plan.ts, docs/helix-ask-flow.md",
    );
    expect(cleaned).not.toContain("grounding.ts");
    expect(cleaned).not.toContain("plan.ts");
    expect(cleaned).not.toContain("docs/helix-ask-flow.md");
  });
});

describe("shouldDispatchReasoningAttempt", () => {
  it("dispatches reasoning for directive prompts with leading discourse markers", () => {
    expect(shouldDispatchReasoningAttempt("Okay, define quantum system.")).toBe(true);
  });

  it("suppresses pure acknowledgments", () => {
    expect(shouldDispatchReasoningAttempt("okay")).toBe(false);
  });
});

describe("suppression override guard", () => {
  it("forces observe dispatch for real prompts suppressed as filler/low-salience", () => {
    expect(
      shouldForceObserveDispatchFromSuppression({
        dispatchHint: false,
        routeReasonCode: "suppressed:filler",
        transcript: "Okay, define a quantum system in simple terms.",
      }),
    ).toBe(true);
  });

  it("does not force dispatch for low-information tails", () => {
    expect(
      shouldForceObserveDispatchFromSuppression({
        dispatchHint: false,
        routeReasonCode: "suppressed:low_salience",
        transcript: "Friends.",
      }),
    ).toBe(false);
  });
});

describe("artifact-dominated output guards", () => {
  it("detects artifact-heavy final text", () => {
    const noisy =
      "ts, server/services/planner/grounding.ts. Evidence: docs/helix-ask-flow.md. Constraint: plan.ts.";
    expect(isArtifactDominatedReasoningText(noisy)).toBe(true);
  });

  it("detects mission/warp artifact template spill", () => {
    const noisy =
      "What is warp bubble: docs/casimir-tile-mechanism.md What is mission ethos: docs/BUSINESS_MODEL.md How they connect: Verification hooks translate design ambition.";
    expect(isArtifactDominatedReasoningText(noisy)).toBe(true);
  });

  it("sanitizes citation/path fragments for display", () => {
    const noisy =
      "ts, server/services/planner/grounding.ts. Evidence: docs/helix-ask-flow.md. In practice, the system explains tradeoffs.";
    const cleaned = sanitizeReasoningOutputText(noisy);
    expect(cleaned).toContain("In practice, the system explains tradeoffs.");
    expect(cleaned).not.toContain("grounding.ts");
    expect(cleaned).not.toContain("docs/helix-ask-flow.md");
  });
});

describe("exploration escalation guard", () => {
  it("does not auto-escalate verify from artifact-heavy observe output", () => {
    const decision = decideExplorationLadderAction({
      explorationAttemptCount: 1,
      promptText: "So how does the Planck scale relate to virtual particles in Casimir effect?",
      outputText:
        "What is warp bubble: docs/casimir-tile-mechanism.md What is mission ethos: docs/BUSINESS_MODEL.md",
      mode: "observe",
      debug: { arbiter_mode: "hybrid", verification_anchor_required: false },
    });
    expect(decision.action).toBe("finalize");
  });
});

describe("late-tail continuation guards", () => {
  it("detects dangling connector endings", () => {
    expect(hasDanglingTurnTail("the virtual particles of the energy density is the")).toBe(true);
    expect(hasDanglingTurnTail("it's not like a classical system that you can")).toBe(true);
    expect(hasDanglingTurnTail("quantum systems exhibit superposition.")).toBe(false);
  });

  it("marks short orphan fragments as low-information tails", () => {
    expect(isLowInformationTailTranscript("Friends.")).toBe(true);
    expect(isLowInformationTailTranscript("Define quantum system")).toBe(false);
  });
});
