import fs from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it, vi } from "vitest";

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
let getMicRecorderMimeCandidates: typeof import("@/components/helix/HelixAskPill").getMicRecorderMimeCandidates;
let pickSupportedMicRecorderMimeType: typeof import("@/components/helix/HelixAskPill").pickSupportedMicRecorderMimeType;
let formatVoiceDecisionSentence: typeof import("@/components/helix/HelixAskPill").formatVoiceDecisionSentence;
let composeVoiceBriefWithDecision: typeof import("@/components/helix/HelixAskPill").composeVoiceBriefWithDecision;
let isAgibotPreflightScopeError: typeof import("@/components/helix/HelixAskPill").isAgibotPreflightScopeError;
let deriveTranscriptConfidence: typeof import("@/components/helix/HelixAskPill").deriveTranscriptConfidence;
let shouldRequireTranscriptConfirmation: typeof import("@/components/helix/HelixAskPill").shouldRequireTranscriptConfirmation;
let scoreVoiceTurnComplete: typeof import("@/components/helix/HelixAskPill").scoreVoiceTurnComplete;
let scoreIntentShift: typeof import("@/components/helix/HelixAskPill").scoreIntentShift;
let evaluateVoiceReasoningResponseAuthority: typeof import("@/components/helix/HelixAskPill").evaluateVoiceReasoningResponseAuthority;
let evaluateVoiceTurnSealGate: typeof import("@/components/helix/HelixAskPill").evaluateVoiceTurnSealGate;
let resolveVoicePlaybackGain: typeof import("@/components/helix/HelixAskPill").resolveVoicePlaybackGain;
let shouldUseVoicePlaybackAudioGraph: typeof import("@/components/helix/HelixAskPill").shouldUseVoicePlaybackAudioGraph;
let shouldRetryVoicePlaybackWithDirectFallback: typeof import("@/components/helix/HelixAskPill").shouldRetryVoicePlaybackWithDirectFallback;
let shouldRetryVoicePlaybackDirectAttempt: typeof import("@/components/helix/HelixAskPill").shouldRetryVoicePlaybackDirectAttempt;
let shouldTreatVoicePlaybackErrorAsEnded: typeof import("@/components/helix/HelixAskPill").shouldTreatVoicePlaybackErrorAsEnded;
let resolveVoicePlaybackAttemptPath: typeof import("@/components/helix/HelixAskPill").resolveVoicePlaybackAttemptPath;

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
    getMicRecorderMimeCandidates,
    pickSupportedMicRecorderMimeType,
    formatVoiceDecisionSentence,
    composeVoiceBriefWithDecision,
    isAgibotPreflightScopeError,
    deriveTranscriptConfidence,
    shouldRequireTranscriptConfirmation,
    scoreVoiceTurnComplete,
    scoreIntentShift,
    evaluateVoiceReasoningResponseAuthority,
    evaluateVoiceTurnSealGate,
    resolveVoicePlaybackGain,
    shouldUseVoicePlaybackAudioGraph,
    shouldRetryVoicePlaybackWithDirectFallback,
    shouldRetryVoicePlaybackDirectAttempt,
    shouldTreatVoicePlaybackErrorAsEnded,
    resolveVoicePlaybackAttemptPath,
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
    expect(evaluateBlock?.[0]).toContain('stopReadAloud("barge_in");');
    expect(evaluateBlock?.[0]).toContain("turn_state: \"interrupted\"");
  });

  it("includes build provenance as a system timeline event", () => {
    const source = fs.readFileSync(pillPath, "utf8");
    expect(source).toContain('fetch("/version"');
    expect(source).toContain('source: "system"');
    expect(source).toContain('kind: "build_info"');
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

  it("uses a stronger playback gain profile for mobile audio devices", () => {
    const desktopGain = resolveVoicePlaybackGain(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36",
    );
    const androidGain = resolveVoicePlaybackGain(
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/122 Mobile Safari/537.36",
    );
    const iosGain = resolveVoicePlaybackGain(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
    );
    expect(desktopGain).toBe(1.15);
    expect(androidGain).toBe(3.6);
    expect(iosGain).toBe(5.0);
    expect(androidGain).toBeGreaterThan(desktopGain);
    expect(iosGain).toBeGreaterThan(androidGain);
  });

  it("treats desktop-style iOS Safari user agents as mobile when touch is available", () => {
    const originalNavigator = globalThis.navigator;
    vi.stubGlobal("navigator", {
      maxTouchPoints: 5,
    } as Navigator);
    try {
      const iosDesktopUa =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15";
      expect(resolveVoicePlaybackGain(iosDesktopUa)).toBe(5.0);
      expect(shouldUseVoicePlaybackAudioGraph(iosDesktopUa)).toBe(true);
    } finally {
      if (originalNavigator) {
        vi.stubGlobal("navigator", originalNavigator);
      } else {
        vi.unstubAllGlobals();
      }
    }
  });

  it("enables WebAudio media-element routing on mobile user agents by default", () => {
    expect(
      shouldUseVoicePlaybackAudioGraph(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36",
      ),
    ).toBe(true);
    expect(
      shouldUseVoicePlaybackAudioGraph(
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/122 Mobile Safari/537.36",
      ),
    ).toBe(true);
    expect(
      shouldUseVoicePlaybackAudioGraph(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
      ),
    ).toBe(true);
  });

  it("retries playback fallback only for the current utterance", () => {
    expect(
      shouldRetryVoicePlaybackWithDirectFallback({
        graphAttached: true,
        directFallbackAttempted: false,
      }),
    ).toBe(true);
    expect(
      resolveVoicePlaybackAttemptPath({
        graphAttached: false,
        directFallbackAttempted: true,
      }),
    ).toBe("direct_fallback");
    expect(
      resolveVoicePlaybackAttemptPath({
        graphAttached: true,
        directFallbackAttempted: false,
      }),
    ).toBe("audio_graph");
  });

  it("allows one clean direct retry after fallback if direct playback throws", () => {
    expect(
      shouldRetryVoicePlaybackDirectAttempt({
        graphAttached: false,
        directFallbackAttempted: true,
        directRetryCount: 0,
      }),
    ).toBe(true);
    expect(
      shouldRetryVoicePlaybackDirectAttempt({
        graphAttached: false,
        directFallbackAttempted: true,
        directRetryCount: 1,
      }),
    ).toBe(false);
    expect(
      shouldRetryVoicePlaybackDirectAttempt({
        graphAttached: true,
        directFallbackAttempted: false,
        directRetryCount: 0,
      }),
    ).toBe(false);
  });

  it("treats late media errors as ended to avoid iOS tail-drop stalls", () => {
    expect(
      shouldTreatVoicePlaybackErrorAsEnded({
        playedSeconds: 9.1,
        durationSeconds: 10,
      }),
    ).toBe(true);
    expect(
      shouldTreatVoicePlaybackErrorAsEnded({
        playedSeconds: 0.2,
        durationSeconds: 10,
      }),
    ).toBe(false);
    expect(
      shouldTreatVoicePlaybackErrorAsEnded({
        playedSeconds: 2.1,
        durationSeconds: null,
      }),
    ).toBe(true);
    expect(
      shouldTreatVoicePlaybackErrorAsEnded({
        playedSeconds: 0.35,
        durationSeconds: 6,
        directFallbackAttempted: true,
      }),
    ).toBe(true);
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

  it("suppresses stale voice responses when turn revision drifts", () => {
    expect(
      evaluateVoiceReasoningResponseAuthority({
        source: "voice_auto",
        continuationRestartRequested: false,
        latestAskPromptForAttempt: "Follow-up turn: Where does that come from?",
        askPromptForRequest: "Follow-up turn: Where does that come from?",
        requestIntentRevision: 3,
        latestIntentRevision: 4,
        latestAttemptIntentRevision: 4,
        requestDispatchPromptHash: "hash-3",
        latestDispatchPromptHash: "hash-4",
      }),
    ).toEqual({
      suppress: true,
      reason: "sealed_revision_mismatch",
      restart: true,
    });
    expect(
      evaluateVoiceReasoningResponseAuthority({
        source: "voice_auto",
        continuationRestartRequested: false,
        latestAskPromptForAttempt: "What is negative energy density?",
        askPromptForRequest: "What is negative energy density?",
        requestIntentRevision: 5,
        latestIntentRevision: 5,
        latestAttemptIntentRevision: 5,
        requestDispatchPromptHash: "hash-a",
        latestDispatchPromptHash: "hash-b",
      }),
    ).toEqual({
      suppress: true,
      reason: "dispatch_hash_mismatch",
      restart: true,
    });
    expect(
      evaluateVoiceReasoningResponseAuthority({
        source: "voice_auto",
        continuationRestartRequested: false,
        latestAskPromptForAttempt: "What is negative energy density?",
        askPromptForRequest: "What is negative energy density?",
        latestAttemptStatus: "suppressed",
      }),
    ).toEqual({
      suppress: true,
      reason: "inactive_attempt",
      restart: false,
    });
    expect(
      evaluateVoiceReasoningResponseAuthority({
        source: "voice_auto",
        continuationRestartRequested: true,
        latestAskPromptForAttempt: "A",
        askPromptForRequest: "A",
      }),
    ).toEqual({
      suppress: true,
      reason: "continuation_merged",
      restart: true,
    });
    expect(
      evaluateVoiceReasoningResponseAuthority({
        source: "voice_auto",
        continuationRestartRequested: false,
        latestAskPromptForAttempt: "What is negative energy density?",
        askPromptForRequest: "What is negative energy density?",
        requestIntentRevision: 4,
        latestIntentRevision: 4,
        latestAttemptIntentRevision: 4,
        requestDispatchPromptHash: "hash-a",
        latestDispatchPromptHash: "hash-a",
      }),
    ).toEqual({
      suppress: false,
      reason: "ok",
      restart: false,
    });
  });

  it("enforces deterministic seal gate conditions before dispatch", () => {
    expect(
      evaluateVoiceTurnSealGate({
        sinceLastSpeechMs: 4000,
        sttQueueDepth: 0,
        sttInFlight: false,
        heldPending: false,
        hashStableDwellMs: 1200,
      }),
    ).toBe(true);
    expect(
      evaluateVoiceTurnSealGate({
        sinceLastSpeechMs: 3000,
        sttQueueDepth: 0,
        sttInFlight: false,
        heldPending: false,
        hashStableDwellMs: 1200,
      }),
    ).toBe(false);
    expect(
      evaluateVoiceTurnSealGate({
        sinceLastSpeechMs: 4000,
        sttQueueDepth: 1,
        sttInFlight: false,
        heldPending: false,
        hashStableDwellMs: 1200,
      }),
    ).toBe(false);
    expect(
      evaluateVoiceTurnSealGate({
        sinceLastSpeechMs: 4000,
        sttQueueDepth: 0,
        sttInFlight: true,
        heldPending: false,
        hashStableDwellMs: 1200,
      }),
    ).toBe(false);
    expect(
      evaluateVoiceTurnSealGate({
        sinceLastSpeechMs: 4000,
        sttQueueDepth: 0,
        sttInFlight: false,
        heldPending: true,
        hashStableDwellMs: 1200,
      }),
    ).toBe(false);
    expect(
      evaluateVoiceTurnSealGate({
        sinceLastSpeechMs: 4000,
        sttQueueDepth: 0,
        sttInFlight: false,
        heldPending: false,
        hashStableDwellMs: 400,
      }),
    ).toBe(false);
  });

  it("rejects responses that violate sealed revision authority", () => {
    expect(
      evaluateVoiceReasoningResponseAuthority({
        source: "voice_auto",
        continuationRestartRequested: false,
        latestAskPromptForAttempt: "A",
        askPromptForRequest: "A",
        assemblerPhase: "draft",
      }),
    ).toEqual({
      suppress: true,
      reason: "phase_not_sealed",
      restart: false,
    });

    expect(
      evaluateVoiceReasoningResponseAuthority({
        source: "voice_auto",
        continuationRestartRequested: false,
        latestAskPromptForAttempt: "A",
        askPromptForRequest: "A",
        assemblerPhase: "sealed",
        attemptTranscriptRevision: 2,
        latestSealedTranscriptRevision: 3,
      }),
    ).toEqual({
      suppress: true,
      reason: "sealed_revision_mismatch",
      restart: false,
    });

    expect(
      evaluateVoiceReasoningResponseAuthority({
        source: "voice_auto",
        continuationRestartRequested: false,
        latestAskPromptForAttempt: "A",
        askPromptForRequest: "A",
        assemblerPhase: "sealed",
        attemptTranscriptRevision: 3,
        latestSealedTranscriptRevision: 3,
        attemptSealToken: "seal-old",
        latestSealToken: "seal-new",
      }),
    ).toEqual({
      suppress: true,
      reason: "seal_token_mismatch",
      restart: false,
    });

    expect(
      evaluateVoiceReasoningResponseAuthority({
        source: "voice_auto",
        continuationRestartRequested: false,
        latestAskPromptForAttempt: "A",
        askPromptForRequest: "A",
        assemblerPhase: "sealed",
        attemptTranscriptRevision: 3,
        latestSealedTranscriptRevision: 3,
        attemptSealToken: "seal-new",
        latestSealToken: "seal-new",
      }),
    ).toEqual({
      suppress: false,
      reason: "ok",
      restart: false,
    });
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
    expect(prompt).toContain("Immediate anchor: what is negative energy");
    expect(prompt).toContain("Prior user turn: what is negative energy");
    expect(prompt).not.toContain("Recent turns:");
    expect(prompt).not.toContain("Immediate anchor: Where is that coming from?");
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
        promptText: "Please verify this with pass/fail and evidence anchors.",
        outputText: "Next step: run pass/fail verification with evidence anchors.",
      }).action,
    ).toBe("escalate_verify");
    expect(
      decideExplorationLadderAction({
        explorationAttemptCount: 1,
        promptText: "Implement the change and run the tool.",
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

  it("finalizes substantive artifact-noisy observe output instead of looping restarts", () => {
    const artifactNoisyButSubstantive = [
      "A system is a set of interacting components with boundaries and feedback loops.[docs/knowledge/a.md]",
      "In this codebase, the sun consciousness topic appears in retrieval and reasoning orchestration paths.[docs/knowledge/b.md]",
      "A practical next step is to inspect those paths and map where context is injected before final response assembly.[docs/knowledge/c.md]",
      "That gives a grounded baseline before deeper verification or action steps.[docs/knowledge/d.md]",
      "The overlap between question intent and retrieved context remains the main alignment check.[docs/knowledge/e.md]",
    ].join(" ");
    expect(
      decideExplorationLadderAction({
        explorationAttemptCount: 2,
        promptText: "Can you see what the codebase has for the sun consciousness system?",
        outputText: artifactNoisyButSubstantive,
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
    expect(
      mergeVoiceTranscriptDraft(
        "First sentence.",
        "First sentence. Second sentence with a new direction?",
      ),
    ).toBe("First sentence. Second sentence with a new direction?");
    expect(
      mergeVoiceTranscriptDraft(
        "First sentence. Transition phrase",
        "Transition phrase with additional detail.",
      ),
    ).toBe("First sentence. Transition phrase with additional detail.");
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
        mimeType: "audio/mp4",
        hasHeaderChunk: true,
      }),
    ).toBe(true);
    expect(
      shouldPrimeSegmentWithContainerHeader({
        segmentStartIndex: 4,
        mimeType: "audio/wav",
        hasHeaderChunk: false,
      }),
    ).toBe(false);
  });

  it("orders recorder MIME candidates by runtime capabilities", () => {
    const iosUa =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1";
    const desktopUa =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36";
    expect(getMicRecorderMimeCandidates(iosUa)[0]).toContain("audio/mp4");
    expect(getMicRecorderMimeCandidates(desktopUa)[0]).toContain("audio/webm");
    const supported = new Set<string>(["audio/mp4", "audio/webm;codecs=opus"]);
    expect(
      pickSupportedMicRecorderMimeType({
        userAgent: iosUa,
        isTypeSupported: (mimeType) => supported.has(mimeType),
      }),
    ).toBe("audio/mp4");
    expect(
      pickSupportedMicRecorderMimeType({
        userAgent: desktopUa,
        isTypeSupported: (mimeType) => supported.has(mimeType),
      }),
    ).toBe("audio/webm;codecs=opus");
  });

  it("formats lifecycle decision sentences in human wording only", () => {
    expect(
      formatVoiceDecisionSentence({
        lifecycle: "queued",
        mode: "observe",
        routeReasonCode: "dispatch:observe_explore",
      }),
    ).toBe("I am thinking through this in the background.");
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
    const failedScopedSentence = formatVoiceDecisionSentence({
      lifecycle: "failed",
      failureReasonRaw: "DESKTOP_JOINT_SCOPE_REQUIRED",
    });
    expect(failedScopedSentence).toContain("desktop joint scope");
    expect(failedScopedSentence).not.toContain("DESKTOP_JOINT_SCOPE_REQUIRED");
    const timedOutSentence = formatVoiceDecisionSentence({
      lifecycle: "failed",
      failureReasonRaw: "reasoning_timeout:90000",
    });
    expect(timedOutSentence).toContain("timed out");
    expect(timedOutSentence).not.toContain("reasoning_timeout");
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

  it("detects mission preflight scope failures for safe fallback retry", () => {
    expect(isAgibotPreflightScopeError(new Error("DESKTOP_JOINT_SCOPE_REQUIRED"))).toBe(true);
    expect(
      isAgibotPreflightScopeError("Mission interface blocked by bring-up preflight gate."),
    ).toBe(true);
    expect(isAgibotPreflightScopeError(new Error("network timeout"))).toBe(false);
  });

  it("gates transcript confirmation only for uncertain STT inputs", () => {
    const confident = deriveTranscriptConfidence({
      transcript: "Explain the Casimir effect in one sentence.",
      providerConfidence: 0.91,
      segments: [],
    });
    expect(
      shouldRequireTranscriptConfirmation({
        confidence: confident.confidence,
        translationUncertain: false,
      }),
    ).toBe(false);

    const uncertain = deriveTranscriptConfidence({
      transcript: "x y z ???",
      providerConfidence: 0.34,
      segments: [],
    });
    expect(
      shouldRequireTranscriptConfirmation({
        confidence: uncertain.confidence,
        translationUncertain: false,
      }),
    ).toBe(true);
    expect(
      shouldRequireTranscriptConfirmation({
        confidence: 0.92,
        translationUncertain: true,
      }),
    ).toBe(true);
  });

  it("scores turn completion with semantic guard bands", () => {
    const low = scoreVoiceTurnComplete({
      transcript: "and then because",
      pauseMs: 300,
      stability: 0.45,
    });
    const danglingTail = scoreVoiceTurnComplete({
      transcript: "it's not like a classical system that you can",
      pauseMs: 1600,
      stability: 1,
    });
    const high = scoreVoiceTurnComplete({
      transcript: "Negative energy density is bounded by quantum inequalities.",
      pauseMs: 1600,
      stability: 1,
    });
    expect(low.band).toBe("low");
    expect(danglingTail.band).not.toBe("high");
    expect(high.band).toBe("high");
  });

  it("detects continuation vs topic shift for latest-wins routing", () => {
    const continuation = scoreIntentShift({
      activePrompt: "How can we improve answer quality in this conversation lane?",
      nextTranscript: "Can we improve answer quality with better context continuity in this lane?",
    });
    const shifted = scoreIntentShift({
      activePrompt: "How can we improve answer quality in this conversation lane?",
      nextTranscript: "Switch topics and explain how to grow tomatoes indoors.",
    });
    expect(continuation.band).toBe("continuation");
    expect(shifted.band).toBe("shift");
  });
});
