import fs from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

let mergeVoiceTranscriptDraft: typeof import("@/components/helix/HelixAskPill").mergeVoiceTranscriptDraft;
let buildVoiceInputStatusLabel: typeof import("@/components/helix/HelixAskPill").buildVoiceInputStatusLabel;
let scoreConversationCompletion: typeof import("@/components/helix/HelixAskPill").scoreConversationCompletion;
let shouldDispatchReasoningAttempt: typeof import("@/components/helix/HelixAskPill").shouldDispatchReasoningAttempt;
let isLikelyContextDependentTurn: typeof import("@/components/helix/HelixAskPill").isLikelyContextDependentTurn;
let buildVoiceReasoningDispatchPrompt: typeof import("@/components/helix/HelixAskPill").buildVoiceReasoningDispatchPrompt;
let shouldMergeVoiceContinuationTurn: typeof import("@/components/helix/HelixAskPill").shouldMergeVoiceContinuationTurn;
let shouldMergeVoiceContinuationInFlight: typeof import("@/components/helix/HelixAskPill").shouldMergeVoiceContinuationInFlight;
let decideExplorationLadderAction: typeof import("@/components/helix/HelixAskPill").decideExplorationLadderAction;
let smoothVoiceLevel: typeof import("@/components/helix/HelixAskPill").smoothVoiceLevel;
let isFlatVoiceSignal: typeof import("@/components/helix/HelixAskPill").isFlatVoiceSignal;
let isRecorderStalled: typeof import("@/components/helix/HelixAskPill").isRecorderStalled;
let isLikelyLoopbackDeviceLabel: typeof import("@/components/helix/HelixAskPill").isLikelyLoopbackDeviceLabel;
let shouldPrimeSegmentWithContainerHeader: typeof import("@/components/helix/HelixAskPill").shouldPrimeSegmentWithContainerHeader;
let formatVoiceDecisionSentence: typeof import("@/components/helix/HelixAskPill").formatVoiceDecisionSentence;
let composeVoiceBriefWithDecision: typeof import("@/components/helix/HelixAskPill").composeVoiceBriefWithDecision;

beforeAll(async () => {
  (globalThis as Record<string, unknown>).__HELIX_ASK_JOB_TIMEOUT_MS__ = "1200000";
  ({
    mergeVoiceTranscriptDraft,
    buildVoiceInputStatusLabel,
    scoreConversationCompletion,
    shouldDispatchReasoningAttempt,
    isLikelyContextDependentTurn,
    buildVoiceReasoningDispatchPrompt,
    shouldMergeVoiceContinuationTurn,
    shouldMergeVoiceContinuationInFlight,
    decideExplorationLadderAction,
    smoothVoiceLevel,
    isFlatVoiceSignal,
    isRecorderStalled,
    isLikelyLoopbackDeviceLabel,
    shouldPrimeSegmentWithContainerHeader,
    formatVoiceDecisionSentence,
    composeVoiceBriefWithDecision,
  } = await import("@/components/helix/HelixAskPill"));
});

const pillPath = path.resolve(process.cwd(), "client/src/components/helix/HelixAskPill.tsx");

describe("HelixAskPill mic-first surface contract", () => {
  it("keeps removed operator controls out of the primary composer markup", () => {
    const source = fs.readFileSync(pillPath, "utf8");
    expect(source).not.toContain("Dot context");
    expect(source).not.toContain("mute while typing");
    expect(source).not.toContain("Ask mode");
    expect(source).not.toContain(">read<");
    expect(source).not.toContain(">observe<");
    expect(source).not.toContain(">act<");
    expect(source).not.toContain(">verify<");
    expect(source).toContain("Enable microphone");
    expect(source).toContain("Disable microphone");
    expect(source).not.toContain("Voice Monitor");
    expect(source).not.toContain("Helix Timeline");
    expect(source).toContain("Input level");
    expect(source).toContain("Voice input level meter");
    expect(source).not.toContain("{voiceMonitorExpanded ? \"hide\" : \"diag\"}");
    expect(source).not.toContain("Capture diagnostics");
    expect(source).not.toContain("Last 5 segments");
    expect(source).not.toContain("chunk cadence");
    expect(source).toContain("latestConversationBrief");
    expect(source).toContain("latestTimelineEvent");
    expect(source).not.toContain("max-h-44 space-y-1.5 overflow-y-auto");
    expect(source).not.toContain("Reasoning Attempts");
  });

  it("interrupts read-aloud playback when speech is detected", () => {
    const source = fs.readFileSync(pillPath, "utf8");
    const evaluateBlock = /const evaluateMicLevel = useCallback\(\(\) => \{[\s\S]+?\n  \}, \[/.exec(source);
    expect(evaluateBlock?.[0]).toContain("stopReadAloud();");
    expect(evaluateBlock?.[0]).toContain("turn_state: \"interrupted\"");
  });
});

describe("HelixAskPill mic helper behavior", () => {
  it("builds transient mic status labels", () => {
    expect(buildVoiceInputStatusLabel("off", "listening", null)).toBeNull();
    expect(buildVoiceInputStatusLabel("on", "listening", null)).toBe("Listening");
    expect(buildVoiceInputStatusLabel("on", "transcribing", null)).toBe("Transcribing");
    expect(buildVoiceInputStatusLabel("on", "cooldown", null)).toBe("Cooldown");
    expect(buildVoiceInputStatusLabel("on", "error", "Microphone permission denied.")).toBe(
      "Microphone permission denied.",
    );
  });

  it("routes completion scores by threshold", () => {
    expect(
      scoreConversationCompletion({
        transcript: "I think maybe we should",
        pauseMs: 200,
        stability: 0.2,
      }).route,
    ).toBe("ask_more");
    expect(
      scoreConversationCompletion({
        transcript: "Could you check this claim",
        pauseMs: 700,
        stability: 0.6,
      }).route,
    ).toBe("mirror_clarify");
    expect(
      scoreConversationCompletion({
        transcript: "Please verify the certificate integrity.",
        pauseMs: 1400,
        stability: 1,
      }).route,
    ).toBe("answer");
  });

  it("dispatches background reasoning only for reasoning-heavy turns", () => {
    expect(shouldDispatchReasoningAttempt("Verify this claim and provide evidence.")).toBe(true);
    expect(shouldDispatchReasoningAttempt("Implement the patch now.")).toBe(true);
    expect(shouldDispatchReasoningAttempt("How is a full solve done?")).toBe(true);
    expect(shouldDispatchReasoningAttempt("ok")).toBe(false);
    expect(shouldDispatchReasoningAttempt("thanks")).toBe(false);
  });

  it("marks short follow-up turns as context-dependent", () => {
    expect(isLikelyContextDependentTurn("where is that coming from?")).toBe(true);
    expect(isLikelyContextDependentTurn("And how does that affect propulsion?")).toBe(true);
    expect(isLikelyContextDependentTurn("Explain negative energy density in quantum field theory.")).toBe(
      false,
    );
  });

  it("merges short continuation fragments into the same in-flight prompt", () => {
    expect(
      shouldMergeVoiceContinuationTurn({
        previousPrompt: "Okay, so, what's a token amount that",
        nextTranscript: "used in long prompts like in GPT-5.",
        gapMs: 1800,
      }),
    ).toBe(true);
    expect(
      shouldMergeVoiceContinuationTurn({
        previousPrompt: "What is negative energy density?",
        nextTranscript: "used in warp discussions",
        gapMs: 1500,
      }),
    ).toBe(true);
    expect(
      shouldMergeVoiceContinuationTurn({
        previousPrompt: "What is negative energy density?",
        nextTranscript: "Tell me the history of aviation.",
        gapMs: 1500,
      }),
    ).toBe(false);
    expect(
      shouldMergeVoiceContinuationTurn({
        previousPrompt: "What is negative energy density",
        nextTranscript: "and where is it observed?",
        gapMs: 12000,
      }),
    ).toBe(false);
  });

  it("keeps merging active voice chain segments while reasoning is in flight", () => {
    expect(
      shouldMergeVoiceContinuationInFlight({
        gapMs: 3_000,
        lexicalContinuation: false,
      }),
    ).toBe(true);
    expect(
      shouldMergeVoiceContinuationInFlight({
        gapMs: 30_000,
        lexicalContinuation: false,
      }),
    ).toBe(false);
    expect(
      shouldMergeVoiceContinuationInFlight({
        gapMs: 30_000,
        lexicalContinuation: true,
      }),
    ).toBe(true);
  });

  it("builds a context-anchored dispatch prompt for follow-up turns", () => {
    const prompt = buildVoiceReasoningDispatchPrompt({
      transcript: "Where is that coming from?",
      recentTurns: [
        "user: what is negative energy",
        "dottie: Negative energy can refer to effective energy-density terms in GR.",
        "user: where is that coming from?",
      ],
      explorationPacket: null,
    });
    expect(prompt).toContain("Follow-up turn: Where is that coming from?");
    expect(prompt).toContain("Topic anchor: what is negative energy");
    expect(prompt).toContain("Recent turns:");
    expect(prompt).not.toContain("Topic anchor: Where is that coming from?");
  });

  it("routes exploration ladder outcomes after attempt one", () => {
    expect(
      decideExplorationLadderAction({
        explorationAttemptCount: 1,
        outputText: "Could you clarify which specific context you're referring to?",
        debug: { arbiter_mode: "clarify", coverage_gate_reason: "missing user context" },
      }).action,
    ).toBe("clarify_after_attempt1");
    expect(
      decideExplorationLadderAction({
        explorationAttemptCount: 1,
        outputText: "Next step: run pass/fail verification with evidence anchors.",
      }).action,
    ).toBe("escalate_verify");
    expect(
      decideExplorationLadderAction({
        explorationAttemptCount: 1,
        outputText: "Action required: apply patch and run tool execution.",
      }).action,
    ).toBe("escalate_act");
    expect(
      decideExplorationLadderAction({
        explorationAttemptCount: 1,
        outputText: "Here is the grounded mechanism and evidence-backed summary.",
      }).action,
    ).toBe("finalize");
  });

  it("appends transcript text without losing existing draft formatting", () => {
    expect(mergeVoiceTranscriptDraft("Check", "captured transcript")).toBe("Check captured transcript");
    expect(mergeVoiceTranscriptDraft("Check ", "captured transcript")).toBe("Check captured transcript");
    expect(mergeVoiceTranscriptDraft("Check", "   ")).toBe("Check");
    expect(mergeVoiceTranscriptDraft("What is negative energy...", "...where does it come from")).toBe(
      "What is negative energy where does it come from",
    );
  });

  it("smooths the level meter with attack/release behavior", () => {
    const attacked = smoothVoiceLevel(0.1, 0.9);
    const released = smoothVoiceLevel(0.9, 0.1);
    expect(attacked).toBeGreaterThan(0.5);
    expect(released).toBeLessThan(0.8);
    expect(released).toBeGreaterThan(0.1);
  });

  it("detects flat signals and recorder stalls with deterministic thresholds", () => {
    expect(isFlatVoiceSignal(0.001, 3050)).toBe(true);
    expect(isFlatVoiceSignal(0.003, 3050)).toBe(false);
    expect(
      isRecorderStalled({
        recorderActive: true,
        nowMs: 4200,
        recorderStartedAtMs: 0,
        lastChunkAtMs: 2500,
      }),
    ).toBe(true);
    expect(
      isRecorderStalled({
        recorderActive: true,
        nowMs: 3100,
        recorderStartedAtMs: 0,
        lastChunkAtMs: 2500,
      }),
    ).toBe(false);
  });

  it("flags likely loopback-style device labels", () => {
    expect(isLikelyLoopbackDeviceLabel("VoiceMeeter Output (VB-Audio VoiceMeeter VAIO)")).toBe(true);
    expect(isLikelyLoopbackDeviceLabel("Stereo Mix (Realtek)")).toBe(true);
    expect(isLikelyLoopbackDeviceLabel("USB Microphone")).toBe(false);
  });

  it("primes sliced container segments with a header chunk", () => {
    expect(
      shouldPrimeSegmentWithContainerHeader({
        segmentStartIndex: 4,
        mimeType: "audio/webm;codecs=opus",
        hasHeaderChunk: true,
      }),
    ).toBe(true);
    expect(
      shouldPrimeSegmentWithContainerHeader({
        segmentStartIndex: 0,
        mimeType: "audio/webm",
        hasHeaderChunk: true,
      }),
    ).toBe(false);
    expect(
      shouldPrimeSegmentWithContainerHeader({
        segmentStartIndex: 4,
        mimeType: "audio/wav",
        hasHeaderChunk: false,
      }),
    ).toBe(false);
  });

  it("formats lifecycle decision sentences in human wording only", () => {
    expect(
      formatVoiceDecisionSentence({
        lifecycle: "queued",
        mode: "observe",
        routeReasonCode: "dispatch:observe_explore",
      }),
    ).toBe("Reasoning is queued in explore mode.");
    expect(
      formatVoiceDecisionSentence({
        lifecycle: "running",
        mode: "verify",
      }),
    ).toBe("Reasoning is running in verification mode.");
    expect(
      formatVoiceDecisionSentence({
        lifecycle: "suppressed",
        routeReasonCode: "suppressed:clarify_after_attempt1",
      }),
    ).toContain("one concrete detail");
    expect(
      formatVoiceDecisionSentence({
        lifecycle: "escalated",
        escalatedMode: "act",
      }),
    ).toBe("Reasoning is escalated to action mode.");
    expect(
      formatVoiceDecisionSentence({
        lifecycle: "done",
        mode: "observe",
      }),
    ).toBe("Reasoning is complete; see the answer below.");
    const failedSentence = formatVoiceDecisionSentence({
      lifecycle: "failed",
    });
    expect(failedSentence).not.toMatch(/dispatch:|suppressed:/i);
  });

  it("composes base brief plus decision sentence as one updated brief", () => {
    expect(
      composeVoiceBriefWithDecision(
        'I heard: "How is a full solve done?"',
        "Reasoning is queued in explore mode.",
      ),
    ).toBe(
      'I heard: "How is a full solve done?" Reasoning is queued in explore mode.',
    );
    expect(composeVoiceBriefWithDecision("Short brief.", "")).toBe("Short brief.");
  });
});
