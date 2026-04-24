import fs from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { useDocViewerStore } from "@/store/useDocViewerStore";

let mergeVoiceTranscriptDraft: typeof import("@/components/helix/HelixAskPill").mergeVoiceTranscriptDraft;
let buildVoiceInputStatusLabel: typeof import("@/components/helix/HelixAskPill").buildVoiceInputStatusLabel;
let scoreConversationCompletion: typeof import("@/components/helix/HelixAskPill").scoreConversationCompletion;
let shouldDispatchReasoningAttempt: typeof import("@/components/helix/HelixAskPill").shouldDispatchReasoningAttempt;
let shouldForceObserveDispatchFromSuppression: typeof import("@/components/helix/HelixAskPill").shouldForceObserveDispatchFromSuppression;
let inferSuppressionCauseFromRouteReason: typeof import("@/components/helix/HelixAskPill").inferSuppressionCauseFromRouteReason;
let deriveVoiceTimelineSuppressionMeta: typeof import("@/components/helix/HelixAskPill").deriveVoiceTimelineSuppressionMeta;
let resolveSuppressedDispatchRescueTranscript: typeof import("@/components/helix/HelixAskPill").resolveSuppressedDispatchRescueTranscript;
let isLikelyContextDependentTurn: typeof import("@/components/helix/HelixAskPill").isLikelyContextDependentTurn;
let buildVoiceReasoningDispatchPrompt: typeof import("@/components/helix/HelixAskPill").buildVoiceReasoningDispatchPrompt;
let shouldMergeVoiceContinuationTurn: typeof import("@/components/helix/HelixAskPill").shouldMergeVoiceContinuationTurn;
let shouldMergeVoiceContinuationInFlight: typeof import("@/components/helix/HelixAskPill").shouldMergeVoiceContinuationInFlight;
let shouldMergePendingConfirmationTranscript: typeof import("@/components/helix/HelixAskPill").shouldMergePendingConfirmationTranscript;
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
let shouldAutoConfirmTranscriptPrompt: typeof import("@/components/helix/HelixAskPill").shouldAutoConfirmTranscriptPrompt;
let resolveTranscriptConfirmPolicy: typeof import("@/components/helix/HelixAskPill").resolveTranscriptConfirmPolicy;
let shouldIgnoreLowQualityTranscriptBargeIn: typeof import("@/components/helix/HelixAskPill").shouldIgnoreLowQualityTranscriptBargeIn;
let parseTranscriptConfirmationVoiceCommand: typeof import("@/components/helix/HelixAskPill").parseTranscriptConfirmationVoiceCommand;
let shouldInterruptForSupersededReason: typeof import("@/components/helix/HelixAskPill").shouldInterruptForSupersededReason;
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
let shouldBypassVoicePlaybackGraph: typeof import("@/components/helix/HelixAskPill").shouldBypassVoicePlaybackGraph;
let normalizeVoiceCommandLaneEnvelope: typeof import("@/components/helix/HelixAskPill").normalizeVoiceCommandLaneEnvelope;
let resolveReasoningAttemptTimelineText: typeof import("@/components/helix/HelixAskPill").resolveReasoningAttemptTimelineText;
let describeVoiceCommandAction: typeof import("@/components/helix/HelixAskPill").describeVoiceCommandAction;
let shouldKeepHelixReplyInBriefLane: typeof import("@/components/helix/HelixAskPill").shouldKeepHelixReplyInBriefLane;
let parseWorkstationActionCommand: typeof import("@/components/helix/HelixAskPill").parseWorkstationActionCommand;
let buildObserverCommentaryForRow: typeof import("@/components/helix/HelixAskPill").buildObserverCommentaryForRow;
let deriveObserverDispatchPlan: typeof import("@/components/helix/HelixAskPill").deriveObserverDispatchPlan;
let deriveHelixPlannerContract: typeof import("@/components/helix/HelixAskPill").deriveHelixPlannerContract;
let resolveHelixDispatchPolicyAtTurnStart: typeof import("@/components/helix/HelixAskPill").resolveHelixDispatchPolicyAtTurnStart;
let classifyHelixReasoningIntent: typeof import("@/components/helix/HelixAskPill").classifyHelixReasoningIntent;
let isSimpleConversationTurnCandidate: typeof import("@/components/helix/HelixAskPill").isSimpleConversationTurnCandidate;
let buildObserverPlanDeltaEvent: typeof import("@/components/helix/HelixAskPill").buildObserverPlanDeltaEvent;
let buildObserverPlanItemCompletedEvent: typeof import("@/components/helix/HelixAskPill").buildObserverPlanItemCompletedEvent;
let buildObserverFinalizationEvent: typeof import("@/components/helix/HelixAskPill").buildObserverFinalizationEvent;
let buildObserverHandoffEvent: typeof import("@/components/helix/HelixAskPill").buildObserverHandoffEvent;
let buildWorkstationUserInputRequest: typeof import("@/components/helix/HelixAskPill").buildWorkstationUserInputRequest;
let resolvePendingWorkstationUserInput: typeof import("@/components/helix/HelixAskPill").resolvePendingWorkstationUserInput;
let isWorkstationTurnTransitionPendingRequest: typeof import("@/components/helix/HelixAskPill").isWorkstationTurnTransitionPendingRequest;
let normalizeTerminalAnswerText: typeof import("@/components/helix/HelixAskPill").normalizeTerminalAnswerText;
let isInvalidTerminalAnswerText: typeof import("@/components/helix/HelixAskPill").isInvalidTerminalAnswerText;
let registerTurnTerminalOutcome: typeof import("@/components/helix/HelixAskPill").registerTurnTerminalOutcome;
let parseWorkstationActionChainCommand: typeof import("@/components/helix/HelixAskPill").parseWorkstationActionChainCommand;
let buildWorkstationProceduralStepEvent: typeof import("@/components/helix/HelixAskPill").buildWorkstationProceduralStepEvent;
let evaluateEvidenceFinalizationGate: typeof import("@/components/helix/HelixAskPill").evaluateEvidenceFinalizationGate;
let buildNeedsRetrievalPlanEvent: typeof import("@/components/helix/HelixAskPill").buildNeedsRetrievalPlanEvent;

beforeAll(async () => {
  (globalThis as Record<string, unknown>).__HELIX_ASK_JOB_TIMEOUT_MS__ = "1200000";
  ({
    mergeVoiceTranscriptDraft,
    buildVoiceInputStatusLabel,
    scoreConversationCompletion,
    shouldDispatchReasoningAttempt,
    shouldForceObserveDispatchFromSuppression,
    inferSuppressionCauseFromRouteReason,
    deriveVoiceTimelineSuppressionMeta,
    resolveSuppressedDispatchRescueTranscript,
    isLikelyContextDependentTurn,
    buildVoiceReasoningDispatchPrompt,
    shouldMergeVoiceContinuationTurn,
    shouldMergeVoiceContinuationInFlight,
    shouldMergePendingConfirmationTranscript,
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
    shouldAutoConfirmTranscriptPrompt,
    resolveTranscriptConfirmPolicy,
    shouldIgnoreLowQualityTranscriptBargeIn,
    parseTranscriptConfirmationVoiceCommand,
    shouldInterruptForSupersededReason,
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
    shouldBypassVoicePlaybackGraph,
    normalizeVoiceCommandLaneEnvelope,
    resolveReasoningAttemptTimelineText,
    describeVoiceCommandAction,
    shouldKeepHelixReplyInBriefLane,
    parseWorkstationActionCommand,
    buildObserverCommentaryForRow,
    deriveObserverDispatchPlan,
    deriveHelixPlannerContract,
    resolveHelixDispatchPolicyAtTurnStart,
    classifyHelixReasoningIntent,
    isSimpleConversationTurnCandidate,
    buildObserverPlanDeltaEvent,
    buildObserverPlanItemCompletedEvent,
    buildObserverFinalizationEvent,
    buildObserverHandoffEvent,
    buildWorkstationUserInputRequest,
    resolvePendingWorkstationUserInput,
    isWorkstationTurnTransitionPendingRequest,
    normalizeTerminalAnswerText,
    isInvalidTerminalAnswerText,
    registerTurnTerminalOutcome,
    parseWorkstationActionChainCommand,
    buildWorkstationProceduralStepEvent,
    evaluateEvidenceFinalizationGate,
    buildNeedsRetrievalPlanEvent,
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

  it("retries turn-close deferred finals without waiting for a new enqueue event", () => {
    const source = fs.readFileSync(pillPath, "utf8");
    expect(source).toMatch(
      /if \(yieldedForTurnClose\) \{[\s\S]+setTimeout\(resolve, turnCloseYieldDelayMs\);[\s\S]+continue;/,
    );
  });

  it("includes build provenance as a system timeline event", () => {
    const source = fs.readFileSync(pillPath, "utf8");
    expect(source).toContain('fetch("/version"');
    expect(source).toContain('source: "system"');
    expect(source).toContain('kind: "build_info"');
  });

  it("requires explicit S2 planning artifacts before reasoning execution", () => {
    const source = fs.readFileSync(pillPath, "utf8");
    expect(source).toContain("S2_PLANNING");
    expect(source).toContain("explicit_reasoning_plan");
    expect(source).toContain("ensureExplicitReasoningPlan");
    expect(source).toMatch(/attempt = ensureExplicitReasoningPlan\(attempt\)/);
    expect(source).toContain("RF_EMPTY_TERMINAL");
  });

  it("routes voice lite prompts through normal-turn lane without queued reasoning", () => {
    const source = fs.readFileSync(pillPath, "utf8");
    expect(source).toContain("voice normal turn lane (no queued reasoning)");
    expect(source).toContain("dispatch:simple_conversation_turn");
  });

  it("exposes command-lane confirmation UX with deterministic countdown", () => {
    const source = fs.readFileSync(pillPath, "utf8");
    expect(source).toContain("Voice command");
    expect(source).toContain("Auto-confirming in {commandConfirmAutoCountdownSec}s.");
    expect(source).toContain("command_detected");
    expect(source).toContain("command_confirm_started");
    expect(source).toContain("command_confirm_fired");
    expect(source).toContain("command_executed");
    expect(source).toContain("command_cancelled");
  });

  it("routes accepted command-lane decisions through confirm state without draft append", () => {
    const source = fs.readFileSync(pillPath, "utf8");
    expect(source).toMatch(
      /commandLane\?\.decision === "accepted"[\s\S]+setCommandConfirmState\([\s\S]+continue;/,
    );
  });
});

describe("HelixAskPill mic helper behavior", () => {
  it("parses close-this-panel phrasing into close_active_panel action", () => {
    expect(parseWorkstationActionCommand("close this panel")).toEqual({ action: "close_active_panel" });
    expect(parseWorkstationActionCommand("close doc")).toEqual({ action: "close_active_panel" });
    expect(parseWorkstationActionCommand("can you close this panel for me")).toEqual({
      action: "close_active_panel",
    });
    expect(parseWorkstationActionCommand("close this doc")).toEqual({ action: "close_active_panel" });
    expect(parseWorkstationActionCommand("please close this document")).toEqual({
      action: "close_active_panel",
    });
  });

  it("routes doc intent questions to explain_paper workstation action", () => {
    expect(parseWorkstationActionCommand("what does this doc do?")).toEqual({
      action: "run_panel_action",
      panel_id: "docs-viewer",
      action_id: "explain_paper",
      args: undefined,
    });
  });

  it("maps copy-docs-to-notes compare requests to observable research workflow jobs", () => {
    const action = parseWorkstationActionCommand(
      "Copy sections about quantum inequalities in docs and paste in notes mission-notes, then compare the topics for an explanation",
    );
    expect(action).not.toBeNull();
    expect(action?.action).toBe("run_job");
    if (action?.action !== "run_job") return;
    expect(action.payload.workflow).toBe("observable_research_pipeline");
    const workflowArgs = (action.payload.workflow_args ?? {}) as Record<string, unknown>;
    expect(String(workflowArgs.topic ?? "")).toContain("quantum inequalities");
    expect(String(workflowArgs.note_title ?? "")).toContain("mission-notes");
    expect(String(workflowArgs.compare_instruction ?? "").toLowerCase()).toContain("compare");
  });

  it("builds deterministic two-step workstation chains for copy-then-compare prompts", () => {
    const chain = parseWorkstationActionChainCommand(
      "copy this abstract to a note pad called Mission Notes and compare with current doc",
    );
    expect(chain).not.toBeNull();
    expect(Array.isArray(chain)).toBe(true);
    if (!Array.isArray(chain)) return;
    expect(chain).toHaveLength(2);
    expect(chain[0]?.action).toBe("run_panel_action");
    if (chain[0]?.action === "run_panel_action") {
      expect(chain[0].panel_id).toBe("workstation-clipboard-history");
      expect(chain[0].action_id).toBe("copy_selection_to_note");
    }
    expect(chain[1]?.action).toBe("run_job");
    if (chain[1]?.action === "run_job") {
      expect(chain[1].payload.workflow).toBe("observable_research_pipeline");
      const workflowArgs = (chain[1].payload.workflow_args ?? {}) as Record<string, unknown>;
      expect(String(workflowArgs.chain_signature ?? "")).toContain("copy_selection_to_note");
      expect(String(workflowArgs.compare_basis ?? "")).toBe("current_doc");
    }
  });

  it("routes deictic read-this-doc prompts to open_doc_and_read using active docs context", () => {
    useDocViewerStore.getState().viewDoc("/docs/papers.md");
    expect(parseWorkstationActionCommand("ok read this doc to me")).toEqual({
      action: "run_panel_action",
      panel_id: "docs-viewer",
      action_id: "open_doc_and_read",
      args: { path: "docs/papers.md" },
    });
    expect(parseWorkstationActionCommand("ok read this file to me")).toEqual({
      action: "run_panel_action",
      panel_id: "docs-viewer",
      action_id: "open_doc_and_read",
      args: { path: "docs/papers.md" },
    });
  });

  it("routes latest-topic doc prompts to deterministic docs-viewer actions", () => {
    const pickLatest = parseWorkstationActionCommand("ok pick the latest NHM2 doc");
    expect(pickLatest?.action).toBe("run_panel_action");
    if (pickLatest?.action !== "run_panel_action") return;
    expect(pickLatest.panel_id).toBe("docs-viewer");
    expect(pickLatest.action_id).toBe("open_doc");
    expect((pickLatest.args as { path?: string } | undefined)?.path).toBeTruthy();

    const viewLatest = parseWorkstationActionCommand("ok view the latest NHM2 doc");
    expect(viewLatest?.action).toBe("run_panel_action");
    if (viewLatest?.action !== "run_panel_action") return;
    expect(viewLatest.panel_id).toBe("docs-viewer");
    expect(viewLatest.action_id).toBe("open_doc");
    expect((viewLatest.args as { path?: string } | undefined)?.path).toBeTruthy();

    const pullLatestToday = parseWorkstationActionCommand("Ok pull up the latest NHM2 doc from today");
    expect(pullLatestToday?.action).toBe("run_panel_action");
    if (pullLatestToday?.action !== "run_panel_action") return;
    expect(pullLatestToday.panel_id).toBe("docs-viewer");
    expect(pullLatestToday.action_id).toBe("open_doc");
    expect((pullLatestToday.args as { path?: string } | undefined)?.path).toBeTruthy();

    const popLatestToday = parseWorkstationActionCommand("Ok pop open the latest NHM2 document from today");
    expect(popLatestToday?.action).toBe("run_panel_action");
    if (popLatestToday?.action !== "run_panel_action") return;
    expect(popLatestToday.panel_id).toBe("docs-viewer");
    expect(popLatestToday.action_id).toBe("open_doc");
    expect((popLatestToday.args as { path?: string } | undefined)?.path).toBeTruthy();
  });

  it("maps notes lexicon utterances to deterministic panel actions", () => {
    expect(parseWorkstationActionCommand("create a note called Warp Notes")).toEqual({
      action: "run_panel_action",
      panel_id: "workstation-notes",
      action_id: "create_note",
      args: { title: "Warp Notes", topic: "Warp Notes" },
    });
    expect(parseWorkstationActionCommand("new note Casimir capture")).toEqual({
      action: "run_panel_action",
      panel_id: "workstation-notes",
      action_id: "create_note",
      args: { title: "Casimir capture", topic: "Casimir capture" },
    });
    expect(parseWorkstationActionCommand("add to note Mission Log: Track quantum inequality bounds")).toEqual({
      action: "run_panel_action",
      panel_id: "workstation-notes",
      action_id: "append_to_note",
      args: { title: "Mission Log", text: "Track quantum inequality bounds" },
    });
    expect(parseWorkstationActionCommand("rename note Mission Log to Mission Log v2")).toEqual({
      action: "run_panel_action",
      panel_id: "workstation-notes",
      action_id: "rename_note",
      args: { from_title: "Mission Log", title: "Mission Log v2" },
    });
    expect(parseWorkstationActionCommand("delete note Mission Log v2")).toEqual({
      action: "run_panel_action",
      panel_id: "workstation-notes",
      action_id: "delete_note",
      args: { title: "Mission Log v2" },
    });
    expect(parseWorkstationActionCommand("list my notes")).toEqual({
      action: "run_panel_action",
      panel_id: "workstation-notes",
      action_id: "list_notes",
      args: undefined,
    });
    expect(parseWorkstationActionCommand("Ok can you copy this abstract to a note pad")).toEqual({
      action: "run_panel_action",
      panel_id: "workstation-clipboard-history",
      action_id: "copy_selection_to_note",
      args: { note_title: undefined },
    });
  });

  it("maps clipboard lexicon utterances to deterministic panel actions", () => {
    expect(parseWorkstationActionCommand("read clipboard")).toEqual({
      action: "run_panel_action",
      panel_id: "workstation-clipboard-history",
      action_id: "read_clipboard",
      args: undefined,
    });
    expect(parseWorkstationActionCommand("copy this to clipboard: NHM2 complete")).toEqual({
      action: "run_panel_action",
      panel_id: "workstation-clipboard-history",
      action_id: "write_clipboard",
      args: { text: "NHM2 complete" },
    });
    expect(parseWorkstationActionCommand("clear clipboard history")).toEqual({
      action: "run_panel_action",
      panel_id: "workstation-clipboard-history",
      action_id: "clear_history",
      args: undefined,
    });
    expect(parseWorkstationActionCommand("copy latest clipboard entry to note Mission Notes")).toEqual({
      action: "run_panel_action",
      panel_id: "workstation-clipboard-history",
      action_id: "copy_receipt_to_note",
      args: { note_title: "Mission Notes" },
    });
  });

  it("resolves capability alias actions with no required args", () => {
    expect(parseWorkstationActionCommand("show docs directory")).toEqual({
      action: "run_panel_action",
      panel_id: "docs-viewer",
      action_id: "open_directory",
      args: undefined,
    });
    expect(parseWorkstationActionCommand("view clipboard history")).toEqual({
      action: "run_panel_action",
      panel_id: "workstation-clipboard-history",
      action_id: "open",
      args: undefined,
    });
  });

  it("does not map ambiguous note phrasing into mutating lexicon actions", () => {
    expect(parseWorkstationActionCommand("note this might be useful later")).toBeNull();
    expect(parseWorkstationActionCommand("clipboard maybe has something")).toBeNull();
  });

  it("derives observer dispatch plans for chat/workspace/reasoning combinations", () => {
    expect(
      deriveObserverDispatchPlan({
        question: "close the docs",
        workstationAction: { action: "close_active_panel" },
      }),
    ).toMatchObject({
      intent_type: "chat_plus_workspace",
      dispatch_plan: "workspace",
      should_dispatch_workspace: true,
      should_dispatch_reasoning: false,
      should_stay_conversational: true,
    });
    expect(
      deriveObserverDispatchPlan({
        question: "open the latest nhm2 doc and explain it in plain language",
        workstationAction: {
          action: "run_panel_action",
          panel_id: "docs-viewer",
          action_id: "open_doc",
        },
      }),
    ).toMatchObject({
      intent_type: "chat_plus_workspace_plus_reasoning",
      dispatch_plan: "workspace+reasoning",
      should_dispatch_workspace: true,
      should_dispatch_reasoning: true,
    });
    expect(
      deriveObserverDispatchPlan({
        question: "explain this section in simpler terms",
        workstationAction: null,
      }),
    ).toMatchObject({
      intent_type: "chat_plus_reasoning",
      dispatch_plan: "reasoning",
      should_dispatch_workspace: false,
      should_dispatch_reasoning: true,
    });
  });

  it("planner contract blocks accidental docs explain actionization on pasted abstract prompts", () => {
    const contract = deriveHelixPlannerContract({
      question:
        "In this paper we analyze quantum horizon structure across multiple manifolds.\nThe abstract derives a constrained variance regime with nontrivial curvature transport.\nWhat does this abstract mean in plain language?",
      workstationAction: {
        action: "run_panel_action",
        panel_id: "docs-viewer",
        action_id: "explain_paper",
      },
    });
    expect(contract.planner_blocked_workstation).toBe(true);
    expect(contract.workstation_action).toBeNull();
    expect(contract.dispatch_plan.dispatch_plan).toBe("reasoning");
    expect(contract.intent_kind).toBe("conversational_explain");
  });

  it("planner contract keeps explicit workstation commands actionable", () => {
    const contract = deriveHelixPlannerContract({
      question: "Open the docs and explain this paper",
      workstationAction: {
        action: "run_panel_action",
        panel_id: "docs-viewer",
        action_id: "explain_paper",
      },
    });
    expect(contract.planner_blocked_workstation).toBe(false);
    expect(contract.workstation_action).not.toBeNull();
    expect(contract.dispatch_plan.should_dispatch_workspace).toBe(true);
  });

  it("planner contract keeps docs explain prompts workspace-owned even with hard reasoning cues", () => {
    const workspaceOwned = deriveHelixPlannerContract({
      question: "what does the abstract of this paper mean?",
      workstationAction: {
        action: "run_panel_action",
        panel_id: "docs-viewer",
        action_id: "explain_paper",
      },
    });
    expect(workspaceOwned.dispatch_plan.dispatch_plan).toBe("workspace");
    expect(workspaceOwned.reasoning_required).toBe("none");

    const hardReasoning = deriveHelixPlannerContract({
      question: "verify and compare what this paper claims",
      workstationAction: {
        action: "run_panel_action",
        panel_id: "docs-viewer",
        action_id: "explain_paper",
      },
    });
    expect(hardReasoning.dispatch_plan.should_dispatch_reasoning).toBe(false);
    expect(hardReasoning.reasoning_required).toBe("none");
  });

  it("freezes workspace_only dispatch policy unless explicit workspace_then_reasoning cue exists", () => {
    const workspaceOnly = resolveHelixDispatchPolicyAtTurnStart({
      question: "open the latest nhm2 doc and explain it",
      workstationAction: {
        action: "run_panel_action",
        panel_id: "docs-viewer",
        action_id: "open_doc",
      },
    });
    expect(workspaceOnly).toBe("workspace_only");
    const contract = deriveHelixPlannerContract({
      question: "open the latest nhm2 doc and explain it",
      workstationAction: {
        action: "run_panel_action",
        panel_id: "docs-viewer",
        action_id: "open_doc",
      },
      dispatchPolicy: workspaceOnly,
    });
    expect(contract.dispatch_plan.dispatch_plan).toBe("workspace");
    expect(contract.dispatch_plan.should_dispatch_reasoning).toBe(false);

    const explicitHybrid = resolveHelixDispatchPolicyAtTurnStart({
      question: "open the latest nhm2 doc and then explain it in the background",
      workstationAction: {
        action: "run_panel_action",
        panel_id: "docs-viewer",
        action_id: "open_doc",
      },
    });
    expect(explicitHybrid).toBe("workspace_then_reasoning");
    const hybridContract = deriveHelixPlannerContract({
      question: "open the latest nhm2 doc and then explain it in the background",
      workstationAction: {
        action: "run_panel_action",
        panel_id: "docs-viewer",
        action_id: "open_doc",
      },
      dispatchPolicy: explicitHybrid,
    });
    expect(hybridContract.dispatch_plan.dispatch_plan).toBe("workspace+reasoning");
  });

  it("classifies reasoning intent with typed classes for deterministic routing", () => {
    expect(classifyHelixReasoningIntent("verify these claims against evidence").intent_class).toBe(
      "hard_reasoning",
    );
    expect(classifyHelixReasoningIntent("explain the theory behind this result").intent_class).toBe(
      "research_synthesis",
    );
    expect(classifyHelixReasoningIntent("open the docs viewer").intent_class).toBe("simple_workspace_query");
    expect(classifyHelixReasoningIntent("hello").intent_class).toBe("simple_conversation");
  });

  it("marks lite social prompts as normal-turn conversation candidates", () => {
    expect(isSimpleConversationTurnCandidate("hello")).toBe(true);
    expect(isSimpleConversationTurnCandidate("thanks!")).toBe(true);
    expect(isSimpleConversationTurnCandidate("open the docs")).toBe(false);
    expect(isSimpleConversationTurnCandidate("compare these two docs")).toBe(false);
  });

  it("keeps summarize-doc prompts on summarize action (not read-aloud)", () => {
    expect(parseWorkstationActionCommand("ok summarize a doc about the sun to me")).toEqual({
      action: "run_panel_action",
      panel_id: "docs-viewer",
      action_id: "summarize_doc",
      args: undefined,
    });
  });

  it("resolves open-doc plus summarize phrasing to docs summarize action", () => {
    const action = parseWorkstationActionCommand("okay open up a doc about the sun and summarize what it means");
    expect(action?.action).toBe("run_panel_action");
    expect(action?.panel_id).toBe("docs-viewer");
    expect(action?.action_id).toBe("summarize_doc");
    expect((action as { args?: { path?: string } } | null)?.args?.path).toBeTruthy();
  });

  it("resolves open-paper plus summarize phrasing to docs summarize action", () => {
    const action = parseWorkstationActionCommand(
      "okay open up a paper about the sun and summarize what it means",
    );
    expect(action?.action).toBe("run_panel_action");
    expect(action?.panel_id).toBe("docs-viewer");
    expect(action?.action_id).toBe("summarize_doc");
    expect((action as { args?: { path?: string } } | null)?.args?.path).toBeTruthy();
  });

  it("routes quoted open-doc title prompts through workstation docs actions", () => {
    const action = parseWorkstationActionCommand(
      'Ok open the doc "NHM2 Full Solve Overview v2 (Journal-Style Draft, 2026-04-23)"',
    );
    expect(action).not.toBeNull();
    if (action?.action === "run_panel_action") {
      expect(action.panel_id).toBe("docs-viewer");
      expect(action.action_id).toBe("open_doc");
      expect((action as { args?: { path?: string } }).args?.path).toBeTruthy();
    } else {
      expect(action).toEqual({
        action: "open_panel",
        panel_id: "docs-viewer",
      });
    }
  });

  it("does not let nhm2 topic hints override explicit direct-title open requests", () => {
    const action = parseWorkstationActionCommand(
      "ok open up the doc NHM2 Full Solve Overview v2 (Journal-Style Draft, 2026-04-23)",
    );
    expect(action?.action).toBe("run_panel_action");
    if (action?.action !== "run_panel_action") return;
    expect(action.panel_id).toBe("docs-viewer");
    expect(action.action_id).toBe("open_doc");
    expect((action.args as { path?: string } | undefined)?.path).toContain(
      "/docs/research/nhm2-full-solve-overview-v2-2026-04-23.md",
    );
  });

  it("builds deterministic observer plan delta events", () => {
    const dispatchPlan = deriveObserverDispatchPlan({
      question: "open the latest NHM2 doc and explain it",
      workstationAction: {
        action: "run_panel_action",
        panel_id: "docs-viewer",
        action_id: "open_doc",
      },
      forceReasoningDispatch: true,
    });
    const event = buildObserverPlanDeltaEvent({
      source: "run_ask",
      dispatchPlan,
      question: "open the latest NHM2 doc and explain it",
    });
    expect(event.tool).toBe("helix.observer.plan");
    expect(event.text).toContain("observer plan update");
    const meta = (event.meta ?? {}) as Record<string, unknown>;
    expect(meta.kind).toBe("observer_plan_delta");
    expect(meta.dispatch_plan).toBe("workspace+reasoning");
    expect(meta.intent_type).toBe("chat_plus_workspace_plus_reasoning");
    expect(meta.source).toBe("run_ask");
  });

  it("builds deterministic observer plan item-completed events", () => {
    const dispatchPlan = deriveObserverDispatchPlan({
      question: "close the docs",
      workstationAction: { action: "close_active_panel" },
    });
    const event = buildObserverPlanItemCompletedEvent({
      source: "submit",
      dispatchPlan,
      item: "workspace_dispatched",
      question: "close the docs",
      action: { action: "close_active_panel" },
    });
    expect(event.tool).toBe("helix.observer.plan");
    expect(event.text).toContain("observer plan step complete");
    const meta = (event.meta ?? {}) as Record<string, unknown>;
    expect(meta.kind).toBe("observer_plan_item_completed");
    expect(meta.item).toBe("workspace_dispatched");
    expect(meta.dispatch_plan).toBe("workspace");
    expect(meta.source).toBe("submit");
  });

  it("builds deterministic observer finalization events", () => {
    const event = buildObserverFinalizationEvent({
      source: "run_ask",
      question: "compare the two docs and explain the difference",
      mode: "observe",
      certaintyClass: "reasoned",
      evidence_refs: ["docs/NHM2.md"],
      needs_retrieval: false,
      final_source: "normal_reasoning",
      answer_id: "answer-123",
      attempt_id: "attempt-123",
      traceId: "ask:trace-123",
      live_event_count: 7,
      debug_context: { policyPromptFamily: "general_overview" },
    });
    expect(event.tool).toBe("helix.observer.finalization");
    const meta = (event.meta ?? {}) as Record<string, unknown>;
    expect(meta.kind).toBe("observer_finalization");
    expect(meta.mode).toBe("observe");
    expect(meta.certainty_class).toBe("reasoned");
    expect(meta.answer_id).toBe("answer-123");
    expect(meta.live_event_count).toBe(7);
  });

  it("builds deterministic observer handoff events for retrieval-blocked claims", () => {
    const event = buildObserverHandoffEvent({
      source: "run_ask",
      question: "prove this from the docs",
      mode: "verify",
      certaintyClass: "unknown",
      evidence_refs: [],
      needs_retrieval: true,
      answer_id: "answer-234",
      attempt_id: "attempt-234",
      traceId: "ask:trace-234",
    });
    expect(event.tool).toBe("helix.observer.handoff");
    const meta = (event.meta ?? {}) as Record<string, unknown>;
    expect(meta.kind).toBe("observer_handoff");
    expect(meta.needs_retrieval).toBe(true);
    const actions = (meta.recommended_workspace_actions ?? []) as Array<Record<string, unknown>>;
    expect(actions.length).toBeGreaterThan(0);
    expect(actions.some((entry) => entry.action_id === "open_doc")).toBe(true);
  });

  it("builds deterministic observer handoff events for grounded answers", () => {
    const event = buildObserverHandoffEvent({
      source: "voice_dispatch",
      question: "summarize this and align claims",
      mode: "observe",
      certaintyClass: "reasoned",
      evidence_refs: ["docs/NHM2.md", "docs/NHM2-appendix.md"],
      needs_retrieval: false,
      answer_id: "answer-345",
      attempt_id: "attempt-345",
      traceId: "ask:trace-345",
    });
    const meta = (event.meta ?? {}) as Record<string, unknown>;
    expect(meta.kind).toBe("observer_handoff");
    const actions = (meta.recommended_workspace_actions ?? []) as Array<Record<string, unknown>>;
    expect(actions.some((entry) => entry.action_id === "append_to_note")).toBe(true);
    const followups = (meta.reasoning_followups ?? []) as string[];
    expect(followups.some((item) => /citation alignment/i.test(item))).toBe(true);
  });

  it("builds deterministic workstation procedural-step events", () => {
    const event = buildWorkstationProceduralStepEvent({
      source: "run_ask",
      step: 2,
      total: 2,
      action: {
        action: "run_job",
        payload: {
          workflow: "observable_research_pipeline",
        },
      },
      question: "copy this abstract to note and compare it",
    });
    expect(event.tool).toBe("helix.workstation.chain");
    expect(event.text).toContain("workstation step 2/2");
    const meta = (event.meta ?? {}) as Record<string, unknown>;
    expect(meta.kind).toBe("workstation_procedural_step");
    expect(meta.step).toBe(2);
    expect(meta.total_steps).toBe(2);
    expect(meta.source).toBe("run_ask");
  });

  it("builds workstation request_user_input prompt for missing required args", () => {
    const pending = buildWorkstationUserInputRequest({
      source: "submit",
      turn_id: "turn:submit:1",
      question: "append this to note mission",
      action: {
        action: "run_panel_action",
        panel_id: "workstation-notes",
        action_id: "append_to_note",
        args: { title: "mission" },
      },
    });
    expect(pending).not.toBeNull();
    expect(pending?.turn_id).toBe("turn:submit:1");
    expect(pending?.reason).toBe("missing_args");
    expect(pending?.missing_args).toContain("text");
    expect(pending?.prompt.toLowerCase()).toContain("i need text");
  });

  it("builds workstation request_user_input prompt for confirmation-required actions", () => {
    const pending = buildWorkstationUserInputRequest({
      source: "run_ask",
      question: "delete note mission log",
      action: {
        action: "run_panel_action",
        panel_id: "workstation-notes",
        action_id: "delete_note",
        args: { title: "Mission Log" },
      },
    });
    expect(pending).not.toBeNull();
    expect(pending?.reason).toBe("confirmation_required");
    expect(pending?.prompt.toLowerCase()).toContain("reply yes");
  });

  it("requests clarification for ambiguous doc-topic resolution even when required args are present", () => {
    const pending = buildWorkstationUserInputRequest({
      source: "submit",
      question: "open docs about foc",
      action: {
        action: "run_panel_action",
        panel_id: "docs-viewer",
        action_id: "open_doc",
        args: {
          path: "/docs/research/focus-overview.md",
          _doc_resolution_status: "ambiguous",
          _doc_resolution_confidence: 0.31,
          _doc_resolution_topic: "foc",
          _doc_resolution_candidates: ["/docs/research/focus-overview.md", "/docs/research/foc-appendix.md"],
        },
      },
    });
    expect(pending).not.toBeNull();
    expect(pending?.reason).toBe("missing_args");
    expect(pending?.router_fail_id).toBe("RF_AMBIGUOUS_DOC_TOPIC");
    expect(pending?.missing_args).toContain("path");
    expect(pending?.doc_topic).toBe("foc");
    expect(pending?.doc_candidates).toEqual(["/docs/research/focus-overview.md", "/docs/research/foc-appendix.md"]);
    expect(pending?.prompt.toLowerCase()).toContain("multiple docs");
  });

  it("requests clarification for weak doc-topic resolution even when confidence appears high", () => {
    const pending = buildWorkstationUserInputRequest({
      source: "submit",
      question: "open docs about foc",
      action: {
        action: "run_panel_action",
        panel_id: "docs-viewer",
        action_id: "open_doc",
        args: {
          path: "/docs/research/focus-overview.md",
          _doc_resolution_status: "weak",
          _doc_resolution_confidence: 0.91,
          _doc_resolution_topic: "foc",
          _doc_resolution_candidates: ["/docs/research/focus-overview.md"],
        },
      },
    });
    expect(pending).not.toBeNull();
    expect(pending?.reason).toBe("missing_args");
    expect(pending?.router_fail_id).toBe("RF_LOW_CONFIDENCE_DOC_RESOLUTION");
    expect(pending?.missing_args).toContain("path");
    expect(pending?.doc_topic).toBe("foc");
    expect(pending?.doc_candidates).toEqual(["/docs/research/focus-overview.md"]);
    expect(pending?.prompt.toLowerCase()).toContain("could not confidently resolve");
  });

  it("resolves pending workstation missing-arg requests from user reply", () => {
    const pending = buildWorkstationUserInputRequest({
      source: "submit",
      question: "append to note mission",
      action: {
        action: "run_panel_action",
        panel_id: "workstation-notes",
        action_id: "append_to_note",
        args: { title: "Mission" },
      },
    });
    expect(pending).not.toBeNull();
    if (!pending) return;
    const resolved = resolvePendingWorkstationUserInput({
      pending,
      reply: "Track the NHM2 checkpoints",
    });
    expect(resolved.status).toBe("resolved");
    if (resolved.status !== "resolved") return;
    expect(resolved.action.action).toBe("run_panel_action");
    if (resolved.action.action !== "run_panel_action") return;
    expect((resolved.action.args ?? {}).text).toBe("Track the NHM2 checkpoints");
  });

  it("resolves confirmation requests deterministically from yes/no replies", () => {
    const pending = buildWorkstationUserInputRequest({
      source: "submit",
      question: "clear clipboard history",
      action: {
        action: "run_panel_action",
        panel_id: "workstation-clipboard-history",
        action_id: "clear_history",
      },
    });
    expect(pending).not.toBeNull();
    if (!pending) return;
    const cancelled = resolvePendingWorkstationUserInput({
      pending,
      reply: "no",
    });
    expect(cancelled.status).toBe("cancelled");
    const confirmed = resolvePendingWorkstationUserInput({
      pending,
      reply: "yes",
    });
    expect(confirmed.status).toBe("resolved");
    if (confirmed.status !== "resolved") return;
    expect(confirmed.action.action).toBe("run_panel_action");
    if (confirmed.action.action !== "run_panel_action") return;
    expect((confirmed.action.args ?? {}).confirmed).toBe(true);
  });

  it("detects pending request turn transitions deterministically", () => {
    expect(
      isWorkstationTurnTransitionPendingRequest({
        pending_turn_id: "ask:turn_a",
        current_turn_id: "ask:turn_b",
      }),
    ).toBe(true);
    expect(
      isWorkstationTurnTransitionPendingRequest({
        pending_turn_id: "ask:turn_a",
        current_turn_id: "ask:turn_a",
      }),
    ).toBe(false);
    expect(
      isWorkstationTurnTransitionPendingRequest({
        pending_turn_id: "",
        current_turn_id: "ask:turn_b",
      }),
    ).toBe(false);
  });

  it("normalizes and rejects invalid terminal answer text", () => {
    expect(normalizeTerminalAnswerText(" \u00a0No final answer returned.  ")).toBe("No final answer returned.");
    expect(isInvalidTerminalAnswerText("")).toBe(true);
    expect(isInvalidTerminalAnswerText("No final answer returned.")).toBe(true);
    expect(isInvalidTerminalAnswerText("  grounded answer ready  ")).toBe(false);
  });

  it("registers exactly one terminal outcome per turn", () => {
    const registry: Record<string, "final_answer" | "final_failure"> = {};
    const first = registerTurnTerminalOutcome({
      registry,
      turn_id: "ask:turn_terminal_1",
      outcome: "final_answer",
    });
    const second = registerTurnTerminalOutcome({
      registry,
      turn_id: "ask:turn_terminal_1",
      outcome: "final_failure",
    });
    const missing = registerTurnTerminalOutcome({
      registry,
      turn_id: "",
      outcome: "final_answer",
    });
    expect(first.accepted).toBe(true);
    expect(first.existing).toBeNull();
    expect(second.accepted).toBe(false);
    expect(second.existing).toBe("final_answer");
    expect(missing.accepted).toBe(false);
    expect(missing.turn_id).toBeNull();
  });

  it("blocks hard-claim finalization when no evidence refs are present", () => {
    const decision = evaluateEvidenceFinalizationGate({
      question: "compare these docs and prove which claim is correct",
      mode: "observe",
      debug: {},
      proof: undefined,
    });
    expect(decision.blocked).toBe(true);
    expect(decision.reason).toBe("hard_claim_without_evidence_refs");
    expect(decision.evidence_refs).toEqual([]);
  });

  it("blocks hard-claim finalization when evidence gate is not satisfied", () => {
    const decision = evaluateEvidenceFinalizationGate({
      question: "verify this theory against the current docs",
      mode: "verify",
      debug: {
        context_files: ["docs/NHM2.md"],
        evidence_gate_ok: false,
      },
      proof: undefined,
    });
    expect(decision.blocked).toBe(true);
    expect(decision.reason).toBe("hard_claim_evidence_gate_not_ok");
    expect(decision.evidence_refs).toEqual(["docs/NHM2.md"]);
  });

  it("allows hard-claim finalization when evidence refs and evidence gate are both present", () => {
    const decision = evaluateEvidenceFinalizationGate({
      question: "synthesize and compare both documents",
      mode: "observe",
      debug: {
        context_files: ["docs/NHM2.md"],
        evidence_gate_ok: true,
      },
      proof: undefined,
    });
    expect(decision.blocked).toBe(false);
    expect(decision.reason).toBeNull();
    expect(decision.evidence_refs).toEqual(["docs/NHM2.md"]);
  });

  it("builds deterministic needs-retrieval observer plan events", () => {
    const event = buildNeedsRetrievalPlanEvent({
      source: "run_ask",
      question: "prove the claim from the docs",
      reason: "hard_claim_without_evidence_refs",
      evidence_refs: [],
      traceId: "ask:trace-123",
    });
    expect(event.tool).toBe("helix.observer.plan");
    const meta = (event.meta ?? {}) as Record<string, unknown>;
    expect(meta.kind).toBe("observer_plan_delta");
    expect(meta.plan_step).toBe("needs_retrieval");
    expect(meta.reason).toBe("hard_claim_without_evidence_refs");
  });

  it("builds observer lane commentary with user-perspective restating", () => {
    const commentary = buildObserverCommentaryForRow(
      {
        tool: "workstation.action",
        text: "summarizing current document",
        detail: "workstation_intent_stage",
      },
      {
        userPrompt: "okay open up a doc about the sun and summarize what it means",
      },
    );
    expect(commentary).toContain("From your request");
    expect(commentary).toContain("summarized in plain language");
    expect(commentary).toContain("Summarize-doc action dispatched");
  });

  it("keeps observer lane deterministic when no user prompt is available", () => {
    const commentary = buildObserverCommentaryForRow({
      tool: "workstation.action",
      text: "closed active panel docs-viewer",
      detail: "workstation_intent_stage",
    });
    expect(commentary).toBe(
      "Observer: Close-panel action completed and active workspace panel was removed.",
    );
  });

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

  it("activates graph bypass only while the bypass window is still open", () => {
    const nowMs = Date.now();
    expect(
      shouldBypassVoicePlaybackGraph({
        bypassUntilMs: nowMs + 5000,
        nowMs,
      }),
    ).toBe(true);
    expect(
      shouldBypassVoicePlaybackGraph({
        bypassUntilMs: nowMs - 1,
        nowMs,
      }),
    ).toBe(false);
    expect(
      shouldBypassVoicePlaybackGraph({
        bypassUntilMs: null,
        nowMs,
      }),
    ).toBe(false);
  });

  it("dispatches background reasoning only for reasoning-heavy turns", () => {
    expect(shouldDispatchReasoningAttempt("Verify this claim and provide evidence.")).toBe(true);
    expect(shouldDispatchReasoningAttempt("Implement the patch now.")).toBe(true);
    expect(shouldDispatchReasoningAttempt("How is a full solve done?")).toBe(true);
    expect(shouldDispatchReasoningAttempt("and what a warp bubble is the congruence of the code base")).toBe(
      true,
    );
    expect(shouldDispatchReasoningAttempt("hello")).toBe(false);
    expect(shouldDispatchReasoningAttempt("hello, how are you today?")).toBe(false);
    expect(shouldDispatchReasoningAttempt("ok")).toBe(false);
    expect(shouldDispatchReasoningAttempt("thanks")).toBe(false);
  });

  it("keeps smalltalk fast-path outputs in the brief lane", () => {
    expect(shouldKeepHelixReplyInBriefLane(undefined)).toBe(false);
    expect(
      shouldKeepHelixReplyInBriefLane({
        smalltalk_fast_path_applied: true,
      } as never),
    ).toBe(true);
    expect(
      shouldKeepHelixReplyInBriefLane({
        fallback_reason_taxonomy: "smalltalk_fast_path",
      } as never),
    ).toBe(true);
    expect(
      shouldKeepHelixReplyInBriefLane({
        answer_path: ["forcedAnswer:smalltalk_fast_path", "answer:forced"],
      } as never),
    ).toBe(true);
    expect(
      shouldKeepHelixReplyInBriefLane({
        fallback_reason_taxonomy: "pre_intent_microplanner_answer",
      } as never),
    ).toBe(false);
  });

  it("forces observe dispatch for suppressed noisy codebase questions", () => {
    expect(
      shouldForceObserveDispatchFromSuppression({
        dispatchHint: false,
        routeReasonCode: "suppressed:clarify_after_attempt1",
        transcript: "What is a warp bubble false off in this codebase?",
      }),
    ).toBe(true);
    expect(
      shouldForceObserveDispatchFromSuppression({
        dispatchHint: false,
        routeReasonCode: "suppressed:multilang_dispatch_blocked",
        transcript: "What is a warp bubble in this codebase?",
      }),
    ).toBe(true);
  });

  it("maps suppressed route reasons to stable suppression causes", () => {
    expect(inferSuppressionCauseFromRouteReason("suppressed:heuristic_low_salience")).toBe("low_salience");
    expect(inferSuppressionCauseFromRouteReason("suppressed:clarify_after_attempt1")).toBe(
      "clarifier_requested",
    );
    expect(inferSuppressionCauseFromRouteReason("dispatch:observe")).toBeNull();
  });

  it("derives suppression metadata from restart and preflight fixtures", () => {
    expect(
      deriveVoiceTimelineSuppressionMeta({
        status: "suppressed",
        type: "reasoning_final",
        detail: "artifact-dominated output; restarting observe lane",
        meta: {},
      }),
    ).toEqual({
      suppressionCause: "artifact_guard_restart",
      authorityRejectStage: "final",
    });

    expect(
      deriveVoiceTimelineSuppressionMeta({
        status: "suppressed",
        type: "reasoning_attempt",
        detail: "phase_not_sealed; causal_ref:timeline:f83a0039-3139-4923-b90b-ad9fd7664b68",
        meta: {
          authorityRejectStage: "preflight",
        },
      }),
    ).toEqual({
      suppressionCause: "phase_not_sealed",
      authorityRejectStage: "preflight",
    });

    expect(
      deriveVoiceTimelineSuppressionMeta({
        status: "suppressed",
        type: "conversation_brief",
        detail: "Reasoning is suppressed for this turn.",
        meta: {
          suppressionCause: "dispatch_suppressed",
          authorityRejectStage: "preflight",
        },
      }),
    ).toEqual({
      suppressionCause: "dispatch_suppressed",
      authorityRejectStage: "preflight",
    });

    expect(
      deriveVoiceTimelineSuppressionMeta({
        status: "suppressed",
        type: "reasoning_final",
        detail: null,
        meta: null,
      }),
    ).toEqual({
      suppressionCause: "suppressed_unspecified",
      authorityRejectStage: "final",
    });
  });

  it("rescues suppressed low-info transcript fragments from richer draft context", () => {
    expect(
      resolveSuppressedDispatchRescueTranscript({
        dispatchHint: false,
        routeReasonCode: "dispatch:heuristic",
        transcript: "a notario solve.",
        draftText: "Okay, define what a warp solve is for. a notario solve.",
      }),
    ).toContain("warp solve");

    expect(
      resolveSuppressedDispatchRescueTranscript({
        dispatchHint: false,
        routeReasonCode: "suppressed:multilang_dispatch_blocked",
        transcript: "a notario solve.",
        draftText: "Okay, define what a warp solve is for. a notario solve.",
      }),
    ).toContain("warp solve");
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

  it("merges pending confirm transcripts for low-salience follow-up fragments", () => {
    expect(
      shouldMergePendingConfirmationTranscript({
        pendingTranscript: "How does the immersion of fantasy reflect the",
        nextTranscript: "Human qualities in storytelling.",
        pendingAgeMs: 1800,
      }),
    ).toBe(true);
    expect(
      shouldMergePendingConfirmationTranscript({
        pendingTranscript: "What is a warp bubble in this codebase?",
        nextTranscript: "Actually switch topics and explain tomato soil acidity.",
        pendingAgeMs: 1500,
      }),
    ).toBe(false);
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

  it("does not artifact-restart when file-location prompts return grounded path-based answers", () => {
    const pathAnchoredAnswer = [
      "Helix Ask retrieval logic is routed through server/services/helix-ask/repo-search.ts.",
      "Intent and ask orchestration are coordinated in server/routes/agi.plan.ts.",
      "The voice turn enters through server/routes/voice.ts before dispatch.",
    ].join(" ");
    expect(
      decideExplorationLadderAction({
        explorationAttemptCount: 1,
        promptText: "What files does Helix Ask retrieval use in the codebase?",
        outputText: pathAnchoredAnswer,
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

  it("primes sliced webm/ogg segments with a header chunk", () => {
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
    ).toBe(false);
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

  it("auto-confirms only safe confirm-state transcript prompts", () => {
    expect(
      shouldAutoConfirmTranscriptPrompt({
        dispatchState: "confirm",
        confidence: 0.76,
        languageConfidence: 0.82,
        pivotConfidence: 0.79,
        translationUncertain: false,
      }),
    ).toBe(true);

    expect(
      shouldAutoConfirmTranscriptPrompt({
        dispatchState: "blocked",
        confidence: 0.92,
        languageConfidence: 0.9,
        pivotConfidence: 0.9,
        translationUncertain: false,
      }),
    ).toBe(false);

    expect(
      shouldAutoConfirmTranscriptPrompt({
        dispatchState: "confirm",
        confidence: 0,
        languageConfidence: 0.9,
        pivotConfidence: 0.9,
        translationUncertain: false,
      }),
    ).toBe(false);

    expect(
      shouldAutoConfirmTranscriptPrompt({
        dispatchState: "confirm",
        confidence: 0.88,
        languageConfidence: 0.62,
        pivotConfidence: 0.9,
        translationUncertain: false,
      }),
    ).toBe(true);

    expect(
      shouldAutoConfirmTranscriptPrompt({
        dispatchState: "confirm",
        confidence: 0.9,
        languageConfidence: 0.9,
        pivotConfidence: null,
        translationUncertain: true,
        sourceLanguage: "zh-hans",
      }),
    ).toBe(false);

    expect(
      shouldAutoConfirmTranscriptPrompt({
        dispatchState: "confirm",
        confidence: 0.9,
        languageConfidence: 0.9,
        pivotConfidence: null,
        translationUncertain: true,
        sourceLanguage: "unknown",
        sourceText: "Define what a warp bubble is in this codebase.",
      }),
    ).toBe(true);

    expect(
      shouldAutoConfirmTranscriptPrompt({
        dispatchState: "confirm",
        confidence: 0.9,
        languageConfidence: 0.9,
        pivotConfidence: 0.4,
        translationUncertain: true,
        sourceLanguage: "unknown",
        sourceText: "Define what a warp bubble is in this codebase.",
      }),
    ).toBe(true);
  });

  it("resolves confirm policy with deterministic blocked/manual/auto reasons", () => {
    expect(
      resolveTranscriptConfirmPolicy({
        dispatchState: "blocked",
        confidence: 0.9,
        pivotConfidence: 0.9,
        translationUncertain: false,
      }),
    ).toMatchObject({
      action: "blocked",
      reason: "dispatch_blocked",
      confirmAutoEligible: false,
      confirmBlockReason: "dispatch_blocked",
    });

    expect(
      resolveTranscriptConfirmPolicy({
        dispatchState: "confirm",
        confidence: 0.9,
        pivotConfidence: 0.4,
        translationUncertain: false,
      }),
    ).toMatchObject({
      action: "auto_confirm",
      reason: "eligible",
    });

    expect(
      resolveTranscriptConfirmPolicy({
        dispatchState: "confirm",
        confidence: 0.9,
        pivotConfidence: 0.92,
        translationUncertain: false,
        lowAudioQuality: true,
      }),
    ).toMatchObject({
      action: "auto_confirm",
      reason: "eligible",
      confirmAutoEligible: true,
    });

    expect(
      resolveTranscriptConfirmPolicy({
        dispatchState: "confirm",
        confidence: 0.62,
        pivotConfidence: 0.92,
        translationUncertain: false,
        lowAudioQuality: true,
      }),
    ).toMatchObject({
      action: "manual_confirm",
      reason: "low_audio_quality",
    });

    expect(
      resolveTranscriptConfirmPolicy({
        dispatchState: "confirm",
        confidence: 0.9,
        pivotConfidence: 0.92,
        translationUncertain: false,
        speechActive: true,
      }),
    ).toMatchObject({
      action: "manual_confirm",
      reason: "live_activity",
    });

    expect(
      resolveTranscriptConfirmPolicy({
        dispatchState: "confirm",
        confidence: 0.9,
        pivotConfidence: 0.4,
        translationUncertain: true,
        sourceLanguage: "zh-hans",
      }),
    ).toMatchObject({
      action: "blocked",
      reason: "pivot_low_confidence",
    });

    expect(
      resolveTranscriptConfirmPolicy({
        dispatchState: "confirm",
        confidence: 0.9,
        pivotConfidence: null,
        translationUncertain: true,
        sourceLanguage: "zh-hans",
      }),
    ).toMatchObject({
      action: "blocked",
      reason: "translation_uncertain_without_pivot",
    });

    expect(
      resolveTranscriptConfirmPolicy({
        dispatchState: "confirm",
        confidence: 0.9,
        pivotConfidence: null,
        translationUncertain: true,
        sourceLanguage: "unknown",
        sourceText: "Define what a warp bubble is in this codebase.",
      }),
    ).toMatchObject({
      action: "auto_confirm",
      reason: "eligible",
      confirmAutoEligible: true,
    });

    expect(
      resolveTranscriptConfirmPolicy({
        dispatchState: "confirm",
        confidence: 0.9,
        pivotConfidence: 0.4,
        translationUncertain: true,
        sourceLanguage: "unknown",
        sourceText: "Define what a warp bubble is in this codebase.",
      }),
    ).toMatchObject({
      action: "auto_confirm",
      reason: "eligible",
      confirmAutoEligible: true,
    });

    expect(
      resolveTranscriptConfirmPolicy({
        dispatchState: "confirm",
        confidence: 0.9,
        pivotConfidence: 0.92,
        translationUncertain: false,
      }),
    ).toMatchObject({
      action: "auto_confirm",
      reason: "eligible",
      confirmAutoEligible: true,
    });
  });

  it("ignores low-quality transcript barge-in while voice reasoning/playback is active", () => {
    expect(
      shouldIgnoreLowQualityTranscriptBargeIn({
        lowAudioQuality: true,
        confidence: 0.71,
        speechProbability: 0.41,
        snrDb: 5,
        hasActiveVoiceReasoningAttempt: true,
        hasActiveVoicePlayback: false,
        needsConfirmation: false,
      }),
    ).toBe(true);
    expect(
      shouldIgnoreLowQualityTranscriptBargeIn({
        lowAudioQuality: true,
        confidence: 0.7,
        speechProbability: null,
        snrDb: null,
        hasActiveVoiceReasoningAttempt: false,
        hasActiveVoicePlayback: true,
        needsConfirmation: false,
      }),
    ).toBe(true);
    expect(
      shouldIgnoreLowQualityTranscriptBargeIn({
        lowAudioQuality: true,
        confidence: 0.94,
        speechProbability: null,
        snrDb: null,
        hasActiveVoiceReasoningAttempt: true,
        hasActiveVoicePlayback: true,
        needsConfirmation: false,
      }),
    ).toBe(false);
  });

  it("does not ignore low-quality transcript barge-in when confirmation is required", () => {
    expect(
      shouldIgnoreLowQualityTranscriptBargeIn({
        lowAudioQuality: true,
        confidence: 0.5,
        speechProbability: 0.3,
        snrDb: 2,
        hasActiveVoiceReasoningAttempt: true,
        hasActiveVoicePlayback: true,
        needsConfirmation: true,
      }),
    ).toBe(false);
  });

  it("parses transcript confirmation voice commands conservatively", () => {
    expect(parseTranscriptConfirmationVoiceCommand("confirm")).toBe("confirm");
    expect(parseTranscriptConfirmationVoiceCommand("yes")).toBe("confirm");
    expect(parseTranscriptConfirmationVoiceCommand("retry")).toBe("retry");
    expect(parseTranscriptConfirmationVoiceCommand("no")).toBe("retry");
    expect(parseTranscriptConfirmationVoiceCommand("cancel")).toBe("cancel");
    expect(parseTranscriptConfirmationVoiceCommand("dismiss")).toBe("cancel");
    expect(
      parseTranscriptConfirmationVoiceCommand(
        "we define what is truth from the helix standpoint",
      ),
    ).toBeNull();
  });

  it("normalizes additive command-lane payloads", () => {
    expect(
      normalizeVoiceCommandLaneEnvelope({
        version: "helix.voice.command_lane.v1",
        decision: "accepted",
        action: "send",
        confidence: 0.91,
        source: "parser",
        suppression_reason: null,
        strict_prefix_applied: true,
        confirm_required: true,
        utterance_id: "vcmd:test",
      }),
    ).toMatchObject({
      decision: "accepted",
      action: "send",
      source: "parser",
      confidence: 0.91,
      strict_prefix_applied: true,
      confirm_required: true,
      utterance_id: "vcmd:test",
    });
    expect(
      normalizeVoiceCommandLaneEnvelope({
        version: "helix.voice.command_lane.v1",
        decision: "none",
        action: null,
        confidence: null,
        source: "none",
        suppression_reason: "disabled",
        strict_prefix_applied: false,
        confirm_required: false,
        utterance_id: "vcmd:none",
      }),
    ).toMatchObject({
      decision: "none",
      suppression_reason: "disabled",
    });
    expect(normalizeVoiceCommandLaneEnvelope(null)).toBeNull();
    expect(
      normalizeVoiceCommandLaneEnvelope({
        version: "helix.voice.command_lane.v1",
        decision: "bad",
        action: null,
        confidence: null,
        source: "none",
        suppression_reason: null,
        strict_prefix_applied: false,
        confirm_required: false,
        utterance_id: "bad",
      } as any),
    ).toBeNull();
  });

  it("maps accepted command actions to the exact command-confirm display wording", () => {
    expect(describeVoiceCommandAction("send")).toBe("Send current draft");
    expect(describeVoiceCommandAction("retry")).toBe("Retry previous ask");
    expect(describeVoiceCommandAction("cancel")).toBe("Cancel pending flow");
  });

  it("uses recorded text for voice reasoning timeline entries and hides internal retry scaffolds", () => {
    expect(
      resolveReasoningAttemptTimelineText({
        source: "voice_auto",
        prompt:
          "Topic: Explain warp\nRestart observe mode from the top of the reasoning chain.\nOriginal user turn:\nWhat is a warp bubble?\n\nPrevious artifact-dominated output (avoid repeating this pattern):\n...",
        recordedText: "What is a warp bubble?",
      }),
    ).toBe("What is a warp bubble?");

    expect(
      resolveReasoningAttemptTimelineText({
        source: "voice_auto",
        prompt:
          "Topic: Explain warp\nRestart observe mode from the top of the reasoning chain.\nOriginal user turn:\nHow do we solve the warp level?\n\nPrevious artifact-dominated output (avoid repeating this pattern):\n...",
        recordedText: null,
      }),
    ).toBe("How do we solve the warp level?");

    expect(
      resolveReasoningAttemptTimelineText({
        source: "manual",
        prompt: "Topic: Keep this manual prompt literal.",
        recordedText: null,
      }),
    ).toBe("Topic: Keep this manual prompt literal.");
  });

  it("avoids hard-cut interruption for same-turn supersede handoff", () => {
    expect(shouldInterruptForSupersededReason("superseded_same_turn", true)).toBe(false);
    expect(shouldInterruptForSupersededReason("preempted_by_final", false)).toBe(false);
    expect(shouldInterruptForSupersededReason("preempted_by_final", true)).toBe(true);
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
