import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (repoPath: string): string =>
  fs.readFileSync(path.resolve(process.cwd(), repoPath), "utf8");

describe("Helix Ask UI ownership boundaries", () => {
  it("keeps a human-readable ownership map for extracted modules and quarantined behavior", () => {
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    for (const moduleName of [
      "ask-answer-rendering.ts",
      "ask-active-turn-stream.ts",
      "ask-convergence-display.ts",
      "ask-context-capsule-display.ts",
      "ask-continuous-turn-display.ts",
      "ask-debug-event-display.ts",
      "ask-display-text.ts",
      "ask-envelope-copy.ts",
      "ask-goal-pill-display.ts",
      "ask-live-source-display.ts",
      "ask-observer-commentary-display.ts",
      "ask-observer-events.ts",
      "ask-procedural-display.ts",
      "ask-read-aloud-display.ts",
      "ask-reasoning-battle-display.ts",
      "ask-reasoning-frontier-display.ts",
      "ask-reasoning-theater-display.ts",
      "ask-stage-play-ledger.ts",
      "ask-status-classnames.ts",
      "ask-steering-queue-display.ts",
      "ask-terminal-projection.ts",
      "ask-turn-transcript.ts",
      "ask-voice-copy-display.ts",
      "ask-voice-text-display.ts",
    ]) {
      expect(map).toContain(moduleName);
    }
    for (const quarantine of [
      "Legacy fallback",
      "Transport and fetch calls",
      "Stale completion",
      "Route metadata",
      "Chat persistence",
      "TTS",
      "voice diagnostics",
      "Debug export authority",
    ]) {
      expect(map).toContain(quarantine);
    }
    for (const remainingCluster of [
      "Remaining Local Cluster Map",
      "Prompt interpretation and planner policy",
      "Voice capture, STT, confirmation, continuation, and auto-dispatch",
      "Voice brief pinning and speech suppression",
      "Ask request construction and attachment admission",
      "Visible terminal and route authority",
      "Debug export and clipboard authority",
      "Legacy local Ask fallback",
    ]) {
      expect(map).toContain(remainingCluster);
    }
    for (const behaviorQueueItem of [
      "HASK-BSQ-001",
      "Active document context handoff",
      "doc=docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
      "Request-envelope assembly",
      "HASK-BSQ-002",
      "Scoped Debug copy binds to stale prior turn",
      "debug_export_ref",
      "latest reply selection",
      "HASK-BSQ-003",
      "Backend compound terminal authority is not the first suspect",
      "compound_evidence_synthesis_answer",
    ]) {
      expect(map).toContain(behaviorQueueItem);
    }
  });

  it("keeps observer lifecycle event builders in the non-React observer event module", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const observer = read("client/src/lib/helix/ask-observer-events.ts");

    expect(pill).toContain('from "@/lib/helix/ask-observer-events"');
    for (const symbol of [
      "buildObserverPlanDeltaEvent",
      "buildObserverPlanItemCompletedEvent",
      "buildObserverFinalizationEvent",
      "buildObserverHandoffEvent",
      "buildWorkstationProceduralStepEvent",
      "buildNeedsRetrievalPlanEvent",
    ]) {
      expect(pill).not.toContain(`export function ${symbol}`);
      expect(observer).toContain(`export function ${symbol}`);
    }
    expect(observer).not.toMatch(/from ["']react["']/);
    expect(observer).not.toContain("@/store/");
    expect(observer).not.toContain("@/components/helix/HelixAskPill");
    expect(observer).not.toContain("setAskReplies");
    expect(observer).not.toContain("enqueueVoicePlaybackIntent");
    expect(observer).not.toContain("runAskTurn");
  });

  it("keeps pure active-turn stream helpers in the non-React active stream module", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const activeStream = read("client/src/lib/helix/ask-active-turn-stream.ts");

    expect(pill).toContain('from "@/lib/helix/ask-active-turn-stream"');
    for (const symbol of [
      "createHelixAskConsoleStreamIngressDebug",
      "attachHelixAskClientTraceToLiveEvent",
      "buildAskLiveAgenticEventRows",
      "buildHelixActiveTurnStreamRows",
      "shouldAdmitHelixAskExternalLiveEventToActiveStream",
      "filterHelixAskActiveTurnStreamRows",
    ]) {
      expect(pill).not.toContain(`export function ${symbol}`);
      expect(activeStream).toContain(`export function ${symbol}`);
    }
    expect(pill).toContain("export function shouldRenderHelixAskActiveTurnStream");
    expect(activeStream).not.toMatch(/from ["']react["']/);
    expect(activeStream).not.toContain("@/store/");
    expect(activeStream).not.toContain("@/components/helix/HelixAskPill");
    expect(activeStream).not.toContain("setAskReplies");
    expect(activeStream).not.toContain("enqueueVoicePlaybackIntent");
    expect(activeStream).not.toContain("runAskTurn");
  });

  it("keeps transcript and causal display builders in the non-React transcript module", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const transcript = read("client/src/lib/helix/ask-turn-transcript.ts");

    expect(pill).toContain('from "@/lib/helix/ask-turn-transcript"');
    for (const symbol of [
      "buildHelixCausalTurnTraceRows",
      "buildHelixRuntimeAskLiveEvents",
      "buildHelixRuntimeTranscriptEvents",
      "buildHelixTurnTranscriptRows",
      "buildHelixWorkstationGatewayTranscriptEvents",
      "isDurableHelixAskMailTranscriptGroup",
      "normalizeHelixVisibleEventText",
      "readHelixCausalTurnTimeline",
      "resolveHelixTurnTranscriptEvents",
    ]) {
      expect(pill).not.toContain(`export function ${symbol}`);
      expect(pill).not.toContain(`function ${symbol}`);
      expect(transcript).toContain(`export function ${symbol}`);
    }
    expect(pill).toContain("function renderProceduralTurnTimeline");
    expect(transcript).not.toMatch(/from ["']react["']/);
    expect(transcript).not.toContain("@/store/");
    expect(transcript).not.toContain("@/components/helix/HelixAskPill");
    expect(transcript).not.toContain("setAskReplies");
    expect(transcript).not.toContain("enqueueVoicePlaybackIntent");
    expect(transcript).not.toContain("runAskTurn");
  });

  it("keeps Stage Play chat ledger display builders in the non-React ledger module", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const ledger = read("client/src/lib/helix/ask-stage-play-ledger.ts");

    expect(pill).toContain('from "@/lib/helix/ask-stage-play-ledger"');
    expect(pill).not.toContain("export function buildStagePlayChatLedgerEvents");
    expect(ledger).toContain("export function buildStagePlayChatLedgerEvents");
    expect(ledger).toContain("export type StagePlayChatLedgerEvent");
    expect(ledger).not.toMatch(/from ["']react["']/);
    expect(ledger).not.toContain("@/store/");
    expect(ledger).not.toContain("@/components/helix/HelixAskPill");
    expect(ledger).not.toContain("setAskReplies");
    expect(ledger).not.toContain("enqueueVoicePlaybackIntent");
    expect(ledger).not.toContain("runAskTurn");
  });

  it("keeps terminal projection helpers in the non-React terminal projection module", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const terminalProjection = read("client/src/lib/helix/ask-terminal-projection.ts");

    expect(pill).toContain('from "@/lib/helix/ask-terminal-projection"');
    for (const symbol of [
      "buildVisibleResolvedTurn",
      "chooseVisibleFinalText",
      "isInvalidTerminalAnswerText",
      "normalizeTerminalAnswerText",
      "readHelixTopLevelPendingServerRequest",
      "renderLiveAnswerEnvironmentContextPackAnswer",
      "renderTypedFailureFallback",
      "resolveHelixAskFinalAnswerPresentation",
    ]) {
      expect(pill).not.toContain(`function ${symbol}`);
      expect(pill).not.toContain(`const ${symbol} =`);
      expect(terminalProjection).toMatch(new RegExp(`export (function|const) ${symbol}\\b`));
    }
    for (const localDuplicate of [
      "readHelixResolvedTurnSummary",
      "readHelixCanonicalGoalKind",
      "readLatestAuthoritativeFinalLiveEventText",
      "normalizeVisibleDocPath",
      "renderDocOpenTerminalFromLocationText",
    ]) {
      expect(pill).not.toContain(localDuplicate);
      expect(terminalProjection).toContain(localDuplicate);
    }
    expect(pill).toContain("function renderProceduralTurnTimeline");
    expect(terminalProjection).not.toMatch(/from ["']react["']/);
    expect(terminalProjection).not.toContain("@/store/");
    expect(terminalProjection).not.toContain("@/components/helix/HelixAskPill");
    expect(terminalProjection).not.toContain("setAskReplies");
    expect(terminalProjection).not.toContain("enqueueVoicePlaybackIntent");
    expect(terminalProjection).not.toContain("runAskTurn");
    expect(terminalProjection).not.toContain("fetch(");
  });

  it("keeps lifecycle behavior local and removes unused local trap doors", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");

    expect(pill).not.toContain("const HELIX_TIMELINE_TYPE_LABEL");
    expect(pill).not.toContain("const HELIX_FILE_PANEL_HINTS");
    expect(pill).not.toContain("function ensureFinalMarker");
    expect(pill).not.toContain("const VOICE_TURN_HASH_STABLE_DWELL_MS");
    expect(pill).not.toContain("function readLatestHelixRuntimeChosenCapability");
    expect(pill).not.toContain("function readHelixAskTerminalText");
    expect(pill).not.toContain("function resolveObjectiveReasoningTrace");
    expect(pill).not.toContain("type HelixAskObjectiveReasoningTrace");
    expect(pill).not.toContain("function inferExplorationTopicKey");
    expect(pill).not.toContain("function buildFallbackReplyMasterDebugExport");
    expect(pill).not.toContain("function isHelixAskRepoQuestion");
    expect(pill).not.toContain("function parseSearchScore");
    expect(pill).not.toContain("KnowledgeProjectExport");
    expect(pill).not.toContain("function HelixAskLiveSituationProjection");
    expect(pill).not.toContain("function HelixAskLiveAnswerEnvironmentProjection");
    expect(pill).not.toContain("LiveSituationArtifactCard");
    expect(pill).not.toContain("LiveAnswerEnvironmentCard");
    for (const symbol of [
      "buildHelixAskSearchQueries",
      "buildGroundedPrompt",
      "buildGeneralPrompt",
      "buildContextFromBundles",
    ]) {
      expect(pill).not.toContain(`function ${symbol}`);
    }
    expect(pill).toContain("const addHelixTimelineEntry = useCallback");
    expect(pill).toContain("const patchHelixTimelineEntry = useCallback");
    expect(map).toContain("Timeline entry creation, ordering, patching, filtering, and feed state");
    expect(map).toContain("Unused timeline label constants should be deleted");
  });

  it("documents representative behavior-sensitive clusters that still live in HelixAskPill", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");

    for (const localAnchor of [
      "deriveHelixPlannerContract",
      "evaluateEvidenceFinalizationGate",
      "resolveTranscriptConfirmPolicy",
      "buildQueuedAskTurn",
      "readVisualEvidenceSummary",
      "isDiagnosticVisualEvidence",
      "buildAskTurnWorkspaceContextSnapshot",
      "resolveHelixAskVisibleTerminal",
      "resolveAuthoritativeDebugExportPayload",
      "deriveReasoningTheaterState",
      "stripPromptEcho",
    ]) {
      expect(pill).toContain(localAnchor);
      expect(map).toContain(localAnchor);
    }
    expect(map).toContain("behavior-goal only");
    expect(map).toContain("do not move as display");
    expect(map).toContain("backend Ask is authoritative");
  });

  it("keeps live-source mail transcript display builders in the non-React live-source display module", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const liveSourceDisplay = read("client/src/lib/helix/ask-live-source-display.ts");

    expect(pill).toContain('from "@/lib/helix/ask-live-source-display"');
    for (const symbol of [
      "collectHelixMailLoopTranscriptRows",
      "buildHelixMailLoopTurnStreamRows",
    ]) {
      expect(pill).not.toContain(`function ${symbol}`);
      expect(liveSourceDisplay).toContain(`export function ${symbol}`);
    }
    expect(pill).not.toContain("const HELIX_MAIL_LOOP_TRANSCRIPT_ROW_KINDS");
    expect(liveSourceDisplay).toContain("HELIX_MAIL_LOOP_TRANSCRIPT_ROW_KINDS");
    expect(liveSourceDisplay).not.toMatch(/from ["']react["']/);
    expect(liveSourceDisplay).not.toContain("@/store/");
    expect(liveSourceDisplay).not.toContain("@/components/helix/HelixAskPill");
    expect(liveSourceDisplay).not.toContain("setAskReplies");
    expect(liveSourceDisplay).not.toContain("enqueueVoicePlaybackIntent");
    expect(liveSourceDisplay).not.toContain("runAskTurn");
  });

  it("keeps continuous turn stream and live bridge display helpers in the non-React continuous display module", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const continuous = read("client/src/lib/helix/ask-continuous-turn-display.ts");

    expect(pill).toContain('from "@/lib/helix/ask-continuous-turn-display"');
    for (const symbol of [
      "buildHelixContinuousTurnStreamRows",
      "buildLiveAnswerTurnBridgeState",
      "readHelixContinuousTurnStreamRowClass",
      "readHelixContinuousTurnStreamDotClass",
      "readLiveAnswerTurnBridgeClassName",
      "readLiveAnswerTurnBridgePillClassName",
    ]) {
      expect(pill).not.toContain(`function ${symbol}`);
      expect(pill).not.toContain(`export function ${symbol}`);
      expect(continuous).toContain(`export function ${symbol}`);
    }
    expect(pill).not.toContain("export type LiveAnswerTurnBridgeTone");
    expect(continuous).toContain("export type LiveAnswerTurnBridgeTone");
    expect(continuous).not.toMatch(/from ["']react["']/);
    expect(continuous).not.toContain("@/store/");
    expect(continuous).not.toContain("@/components/helix/HelixAskPill");
    expect(continuous).not.toContain("setAskReplies");
    expect(continuous).not.toContain("enqueueVoicePlaybackIntent");
    expect(continuous).not.toContain("runAskTurn");
    expect(continuous).not.toContain("fetch(");
  });

  it("keeps context capsule display helpers in the non-React context capsule display module", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const contextCapsule = read("client/src/lib/helix/ask-context-capsule-display.ts");

    expect(pill).toContain('from "@/lib/helix/ask-context-capsule-display"');
    for (const symbol of [
      "stripContextCapsuleTokensFromText",
      "resolveContextCapsulePalette",
      "buildContextCapsuleCopyText",
      "buildContextCapsuleStampDataUri",
    ]) {
      expect(pill).not.toContain(`function ${symbol}`);
      expect(contextCapsule).toContain(`export function ${symbol}`);
    }
    expect(pill).not.toContain("const SESSION_CAPSULE_CONFIDENCE_LABEL");
    expect(pill).toContain("function resolveSessionCapsuleConfidenceBand");
    expect(contextCapsule).toContain("export const SESSION_CAPSULE_CONFIDENCE_LABEL");
    expect(contextCapsule).toContain("export type SessionCapsuleConfidenceBand");
    expect(contextCapsule).not.toContain("resolveSessionCapsuleConfidenceBand");
    expect(contextCapsule).not.toContain("deriveSessionCapsuleState");
    expect(contextCapsule).not.toMatch(/from ["']react["']/);
    expect(contextCapsule).not.toContain("@/store/");
    expect(contextCapsule).not.toContain("@/components/helix/HelixAskPill");
    expect(contextCapsule).not.toContain("setAskReplies");
    expect(contextCapsule).not.toContain("enqueueVoicePlaybackIntent");
    expect(contextCapsule).not.toContain("runAskTurn");
    expect(contextCapsule).not.toContain("fetch(");
  });

  it("keeps convergence labels in the non-React convergence display module", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const convergenceDisplay = read("client/src/lib/helix/ask-convergence-display.ts");

    expect(pill).toContain('from "@/lib/helix/ask-convergence-display"');
    for (const symbol of [
      "CONVERGENCE_SOURCE_LABEL",
      "CONVERGENCE_PROOF_LABEL",
      "CONVERGENCE_MATURITY_LABEL",
    ]) {
      expect(pill).not.toContain(`const ${symbol}`);
      expect(convergenceDisplay).toContain(`export const ${symbol}`);
    }
    expect(pill).not.toContain("const CONVERGENCE_PHASE_ORDER");
    expect(pill).not.toContain("const CONVERGENCE_PHASE_LABEL");
    expect(pill).not.toContain("const CONVERGENCE_COLLAPSE_LABEL");
    expect(convergenceDisplay).not.toMatch(/from ["']react["']/);
    expect(convergenceDisplay).not.toContain("@/store/");
    expect(convergenceDisplay).not.toContain("@/components/helix/HelixAskPill");
    expect(convergenceDisplay).not.toContain("setAskReplies");
    expect(convergenceDisplay).not.toContain("enqueueVoicePlaybackIntent");
    expect(convergenceDisplay).not.toContain("runAskTurn");
    expect(convergenceDisplay).not.toContain("fetch(");
  });

  it("keeps answer rendering and math debug helpers in the non-React answer rendering module", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const settings = read("client/src/components/HelixSettingsDialogContent.tsx");
    const answerRendering = read("client/src/lib/helix/ask-answer-rendering.ts");

    expect(pill).toContain('from "@/lib/helix/ask-answer-rendering"');
    expect(settings).toContain('from "@/lib/helix/ask-answer-rendering"');
    expect(settings).not.toContain('from "@/components/helix/HelixAskPill"');
    for (const symbol of [
      "parseHelixAskFinalAnswerBulletLine",
      "tokenizeHelixAskMathTokens",
      "hasHelixAskRenderableMath",
      "isHelixAskEquationFamilyDebug",
      "shouldShowHelixAskCalculatorPanel",
      "buildHelixAskMathRenderDebugForText",
    ]) {
      expect(pill).not.toContain(`function ${symbol}`);
      expect(pill).not.toContain(`export function ${symbol}`);
      expect(answerRendering).toContain(`export function ${symbol}`);
    }
    expect(pill).not.toContain("type HelixAskMathToken =");
    expect(answerRendering).toContain("export type HelixAskMathToken");
    expect(answerRendering).not.toMatch(/from ["']react["']/);
    expect(answerRendering).not.toContain("@/store/");
    expect(answerRendering).not.toContain("@/components/helix/HelixAskPill");
    expect(answerRendering).not.toContain("setAskReplies");
    expect(answerRendering).not.toContain("enqueueVoicePlaybackIntent");
    expect(answerRendering).not.toContain("runAskTurn");
    expect(answerRendering).not.toContain("fetch(");
  });

  it("keeps debug event display and queued input helpers in the non-React debug event module", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const debugDisplay = read("client/src/lib/helix/ask-debug-event-display.ts");

    expect(pill).toContain('from "@/lib/helix/ask-debug-event-display"');
    for (const symbol of [
      "formatAskLiveEventLogLine",
      "buildAskLiveEventLogExport",
      "buildAskLiveEventLogDetailPayload",
      "readEventMetaString",
      "readAskLiveEventIdentity",
      "resolveAskLiveEventTimestampMs",
      "parseAskLiveEventTimestampMs",
      "parseHelixAskQueuedQuestionsInput",
      "cleanHelixRenderedQuestionText",
      "cleanHelixRenderedFinalAnswerText",
      "normalizedDebugReplyText",
      "isHelixAskProgressPlaceholderText",
      "classifyCompactToolTraceAction",
      "answerNoteForCompactToolTraceItems",
      "buildCompactToolTraceDisclosure",
    ]) {
      expect(pill).not.toContain(`function ${symbol}`);
      expect(pill).not.toContain(`export function ${symbol}`);
      expect(debugDisplay).toContain(`export function ${symbol}`);
    }
    expect(pill).not.toContain('const HELIX_ASK_PROGRESS_PLACEHOLDER_TEXT = "Reasoning in progress..."');
    expect(debugDisplay).toContain('export const HELIX_ASK_PROGRESS_PLACEHOLDER_TEXT = "Reasoning in progress..."');
    for (const localAnchor of [
      "extractHelixRenderedTurnDebugFromButton",
      "buildReplyScopedDebugExportFromRenderedButton",
      "buildHelixDebugExportEnvelopeFromMasterPayload",
      "resolveAuthoritativeDebugExportPayload",
      "isHelixAskProgressPlaceholderReply",
      "shouldHideHelixAskTranscriptReply",
      "askLiveEventBelongsToActiveTurn",
    ]) {
      expect(pill).toContain(`function ${localAnchor}`);
      expect(debugDisplay).not.toContain(localAnchor);
    }
    expect(pill).not.toContain("type AskLiveEventEntry =");
    expect(debugDisplay).toContain("export type AskLiveEventEntry");
    expect(debugDisplay).not.toMatch(/from ["']react["']/);
    expect(debugDisplay).not.toContain("@/store/");
    expect(debugDisplay).not.toContain("@/components/helix/HelixAskPill");
    expect(debugDisplay).not.toContain("setAskReplies");
    expect(debugDisplay).not.toContain("enqueueVoicePlaybackIntent");
    expect(debugDisplay).not.toContain("runAskTurn");
    expect(debugDisplay).not.toContain("fetch(");
  });

  it("keeps shared display text normalization in the non-React display text module", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const activeStream = read("client/src/lib/helix/ask-active-turn-stream.ts");
    const transcript = read("client/src/lib/helix/ask-turn-transcript.ts");
    const displayText = read("client/src/lib/helix/ask-display-text.ts");

    for (const owner of [pill, activeStream, transcript]) {
      expect(owner).toContain('from "@/lib/helix/ask-display-text"');
      expect(owner).not.toContain("function humanizeAskLiveEventToken");
    }
    expect(displayText).toContain("export function humanizeAskLiveEventToken");
    expect(displayText).not.toMatch(/from ["']react["']/);
    expect(displayText).not.toContain("@/store/");
    expect(displayText).not.toContain("@/components/helix/HelixAskPill");
    expect(displayText).not.toContain("setAskReplies");
    expect(displayText).not.toContain("enqueueVoicePlaybackIntent");
    expect(displayText).not.toContain("runAskTurn");
    expect(displayText).not.toContain("fetch(");
  });

  it("keeps observer commentary text presentation in the non-React observer commentary module", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const commentary = read("client/src/lib/helix/ask-observer-commentary-display.ts");

    expect(pill).toContain('from "@/lib/helix/ask-observer-commentary-display"');
    expect(pill).not.toContain("function buildObserverUserRestatement");
    expect(pill).not.toContain("export function buildObserverCommentaryForRow");
    expect(commentary).toContain("export function buildObserverCommentaryForRow");
    expect(commentary).toContain("export type ObserverCommentaryRow");
    expect(commentary).not.toMatch(/from ["']react["']/);
    expect(commentary).not.toContain("@/store/");
    expect(commentary).not.toContain("@/components/helix/HelixAskPill");
    expect(commentary).not.toContain("setAskReplies");
    expect(commentary).not.toContain("enqueueVoicePlaybackIntent");
    expect(commentary).not.toContain("runAskTurn");
    expect(commentary).not.toContain("fetch(");
  });

  it("keeps status and transcript class-name helpers in the non-React status class module", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const statusClasses = read("client/src/lib/helix/ask-status-classnames.ts");

    expect(pill).toContain('from "@/lib/helix/ask-status-classnames"');
    for (const symbol of ["readProceduralStatusClass", "readHelixCausalTraceRowClass"]) {
      expect(pill).not.toContain(`function ${symbol}`);
      expect(pill).not.toContain(`export function ${symbol}`);
      expect(statusClasses).toContain(`export function ${symbol}`);
    }
    expect(statusClasses).not.toMatch(/from ["']react["']/);
    expect(statusClasses).not.toContain("@/store/");
    expect(statusClasses).not.toContain("@/components/helix/HelixAskPill");
    expect(statusClasses).not.toContain("setAskReplies");
    expect(statusClasses).not.toContain("enqueueVoicePlaybackIntent");
    expect(statusClasses).not.toContain("runAskTurn");
    expect(statusClasses).not.toContain("fetch(");
  });

  it("keeps procedural action label formatting in the non-React procedural display module", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const procedural = read("client/src/lib/helix/ask-procedural-display.ts");

    expect(pill).toContain('from "@/lib/helix/ask-procedural-display"');
    for (const symbol of [
      "readProceduralActionLabel",
      "formatWorkstationIntentStageDetail",
      "getWorkstationInterpretingStatusText",
      "getWorkstationExecutingStatusText",
      "getWorkstationExecutedReplyText",
      "buildWorkstationInterpretingReceiptText",
    ]) {
      expect(pill).not.toContain(`function ${symbol}`);
      expect(procedural).toContain(`export function ${symbol}`);
    }
    expect(pill).toContain("function resolveWorkstationRouterFailId");
    expect(pill).toContain("const getWorkstationFastPathReplyText");
    expect(pill).toContain("const readWorkstationActionArgText");
    expect(procedural).not.toContain("resolveWorkstationRouterFailId");
    expect(procedural).not.toContain("runScientificSolve");
    expect(procedural).not.toContain("dispatchWorkstationActionSequence");
    expect(procedural).not.toMatch(/from ["']react["']/);
    expect(procedural).not.toContain("@/store/");
    expect(procedural).not.toContain("@/components/helix/HelixAskPill");
    expect(procedural).not.toContain("setAskReplies");
    expect(procedural).not.toContain("enqueueVoicePlaybackIntent");
    expect(procedural).not.toContain("runAskTurn");
    expect(procedural).not.toContain("fetch(");
  });

  it("keeps Luma mood palette classes in the non-React mood display module", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const moodDisplay = read("client/src/lib/helix/ask-luma-mood-display.ts");

    expect(pill).toContain('from "@/lib/helix/ask-luma-mood-display"');
    expect(pill).not.toContain("type LumaMoodPalette");
    expect(pill).not.toContain("const LUMA_MOOD_PALETTE");
    expect(moodDisplay).toContain("export type LumaMoodPalette");
    expect(moodDisplay).toContain("export const LUMA_MOOD_PALETTE");
    expect(moodDisplay).not.toMatch(/from ["']react["']/);
    expect(moodDisplay).not.toContain("@/store/");
    expect(moodDisplay).not.toContain("@/components/helix/HelixAskPill");
    expect(moodDisplay).not.toContain("broadcastLumaMood");
    expect(moodDisplay).not.toContain("setAskMood");
    expect(moodDisplay).not.toContain("resolveMoodAsset");
    expect(moodDisplay).not.toContain("fetch(");
  });

  it("keeps read-aloud labels and UI state transitions in the non-React read-aloud display module", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const readAloud = read("client/src/lib/helix/ask-read-aloud-display.ts");

    expect(pill).toContain('from "@/lib/helix/ask-read-aloud-display"');
    for (const symbol of [
      "resolveInitialMicArmState",
      "transitionReadAloudState",
      "shouldStopReadAloudOnButtonPress",
      "formatReadAloudButtonLabel",
    ]) {
      expect(pill).not.toContain(`function ${symbol}`);
      expect(pill).not.toContain(`export function ${symbol}`);
      expect(readAloud).toContain(`export function ${symbol}`);
    }
    expect(readAloud).not.toMatch(/from ["']react["']/);
    expect(readAloud).not.toContain("@/store/");
    expect(readAloud).not.toContain("@/components/helix/HelixAskPill");
    expect(readAloud).not.toContain("speakVoice");
    expect(readAloud).not.toContain("AudioContext");
    expect(readAloud).not.toContain("enqueueVoicePlaybackIntent");
    expect(readAloud).not.toContain("runAskTurn");
    expect(readAloud).not.toContain("fetch(");
  });

  it("keeps voice text cleanup and speech-copy formatting in the non-React voice text display module", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const voiceText = read("client/src/lib/helix/ask-voice-text-display.ts");

    expect(pill).toContain('from "@/lib/helix/ask-voice-text-display"');
    for (const symbol of [
      "stripVoiceCitationArtifacts",
      "hasRuntimeFallbackArtifactSpill",
      "isArtifactDominatedReasoningText",
      "sanitizeReasoningOutputText",
      "cleanReasoningDisplayArtifacts",
      "buildSpeakText",
      "summarizeVoiceDebugText",
      "sanitizeConversationBriefTextForVoice",
    ]) {
      expect(pill).not.toContain(`function ${symbol}`);
      expect(pill).not.toContain(`export function ${symbol}`);
      expect(voiceText).toContain(`export function ${symbol}`);
    }
    for (const localAnchor of [
      "isGenericRunningVoiceStatus",
      "isPinnedVoiceBriefCandidate",
      "buildSuppressedVoiceSpeechText",
      "normalizeConversationBriefSource",
      "shouldSuppressVoiceForTerminalState",
    ]) {
      expect(pill).toContain(`function ${localAnchor}`);
      expect(voiceText).not.toContain(localAnchor);
    }
    expect(pill).not.toContain("const FILE_PATH_CITATION_SEGMENT");
    expect(voiceText).not.toMatch(/from ["']react["']/);
    expect(voiceText).not.toContain("@/store/");
    expect(voiceText).not.toContain("@/components/helix/HelixAskPill");
    expect(voiceText).not.toContain("speakVoice");
    expect(voiceText).not.toContain("AudioContext");
    expect(voiceText).not.toContain("enqueueVoicePlaybackIntent");
    expect(voiceText).not.toContain("runAskTurn");
    expect(voiceText).not.toContain("fetch(");
  });

  it("keeps voice labels and lifecycle copy formatting in the non-React voice copy display module", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const voiceCopy = read("client/src/lib/helix/ask-voice-copy-display.ts");

    expect(pill).toContain('from "@/lib/helix/ask-voice-copy-display"');
    for (const symbol of [
      "describeVoiceCommandAction",
      "resolveReasoningAttemptTimelineText",
      "formatVoiceDecisionSentence",
      "composeVoiceBriefWithDecision",
      "buildVoiceInputStatusLabel",
      "describeVoiceInputError",
    ]) {
      expect(pill).not.toContain(`function ${symbol}`);
      expect(pill).not.toContain(`export function ${symbol}`);
      expect(voiceCopy).toContain(`export function ${symbol}`);
    }
    expect(pill).toContain("function isVoiceMemoryPressureError");
    expect(voiceCopy).not.toContain("isVoiceMemoryPressureError");
    expect(voiceCopy).not.toMatch(/from ["']react["']/);
    expect(voiceCopy).not.toContain("@/store/");
    expect(voiceCopy).not.toContain("@/components/helix/HelixAskPill");
    expect(voiceCopy).not.toContain("speakVoice");
    expect(voiceCopy).not.toContain("AudioContext");
    expect(voiceCopy).not.toContain("enqueueVoicePlaybackIntent");
    expect(voiceCopy).not.toContain("shouldAutoSpeakVoiceDecisionLifecycle");
    expect(voiceCopy).not.toContain("runAskTurn");
    expect(voiceCopy).not.toContain("fetch(");
  });

  it("keeps reasoning battle visual projection helpers in the non-React reasoning battle display module", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const battleDisplay = read("client/src/lib/helix/ask-reasoning-battle-display.ts");

    expect(pill).toContain('from "@/lib/helix/ask-reasoning-battle-display"');
    for (const symbol of [
      "reasoningBattleBeatPositionPct",
      "reasoningBattleBeatHeightPx",
      "reasoningBattlePrimitiveClassName",
      "reasoningBattlePrimitiveStyle",
      "reasoningBattleAmbientClassName",
      "reasoningBattleAmbientMarkerClassName",
      "buildReasoningBattleAnswerTint",
    ]) {
      expect(pill).not.toContain(`function ${symbol}`);
      expect(battleDisplay).toContain(`export function ${symbol}`);
    }
    expect(pill).toContain("function renderReasoningBattleStage");
    expect(battleDisplay).not.toMatch(/from ["']react["']/);
    expect(battleDisplay).not.toContain("@/store/");
    expect(battleDisplay).not.toContain("@/components/helix/HelixAskPill");
    expect(battleDisplay).not.toContain("runAskTurn");
    expect(battleDisplay).not.toContain("fetch(");
  });

  it("keeps reasoning frontier floating text projection in the non-React frontier display module", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const frontierDisplay = read("client/src/lib/helix/ask-reasoning-frontier-display.ts");

    expect(pill).toContain('from "@/lib/helix/ask-reasoning-frontier-display"');
    expect(pill).not.toContain("const REASONING_THEATER_FRONTIER_ACTION_LABEL");
    for (const symbol of [
      "buildReasoningTheaterFloatingActionText",
      "reasoningTheaterFloatingActionTextClassName",
    ]) {
      expect(pill).not.toContain(`function ${symbol}`);
      expect(frontierDisplay).toContain(`export function ${symbol}`);
    }
    expect(frontierDisplay).toContain("REASONING_THEATER_FRONTIER_ACTION_LABEL");
    expect(frontierDisplay).not.toMatch(/from ["']react["']/);
    expect(frontierDisplay).not.toContain("@/store/");
    expect(frontierDisplay).not.toContain("@/components/helix/HelixAskPill");
    expect(frontierDisplay).not.toContain("setReasoningTheaterFloatingActionTexts");
    expect(frontierDisplay).not.toContain("runAskTurn");
    expect(frontierDisplay).not.toContain("fetch(");
  });

  it("keeps reasoning theater labels and assets in the non-React theater display module", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const theaterDisplay = read("client/src/lib/helix/ask-reasoning-theater-display.ts");

    expect(pill).toContain('from "@/lib/helix/ask-reasoning-theater-display"');
    for (const symbol of [
      "REASONING_THEATER_STANCE_META",
      "REASONING_THEATER_ARCHETYPE_LABEL",
      "REASONING_THEATER_PHASE_LABEL",
      "REASONING_THEATER_CERTAINTY_LABEL",
      "REASONING_THEATER_MEDAL_LABEL",
      "REASONING_THEATER_MEDAL_ASSET",
    ]) {
      expect(pill).not.toContain(`const ${symbol}`);
      expect(theaterDisplay).toContain(`export const ${symbol}`);
    }
    expect(theaterDisplay).toContain("REASONING_THEATER_SUPPRESSION_LABEL");
    for (const symbol of ["mirekCellParticleClassName", "mirekCellGridClassName"]) {
      expect(pill).not.toContain(`function ${symbol}`);
      expect(theaterDisplay).toContain(`export function ${symbol}`);
    }
    expect(pill).not.toContain("function resolveReasoningTheaterCertaintyClass");
    expect(theaterDisplay).toContain("export function resolveReasoningTheaterCertaintyClass");
    expect(pill).not.toContain("function buildReasoningTheaterFrontierParticles");
    expect(theaterDisplay).toContain("export function buildReasoningTheaterFrontierParticles");
    expect(theaterDisplay).toContain("export type ReasoningTheaterFrontierParticleNode");
    expect(pill).not.toContain("function buildReasoningTheaterParticlesFromMirekArtifact");
    expect(theaterDisplay).toContain("export function buildReasoningTheaterParticlesFromMirekArtifact");
    expect(theaterDisplay).toContain("export type ReasoningTheaterParticle");
    expect(pill).toContain("function deriveReasoningTheaterState");
    expect(pill).toContain("function collectMirekEvidencePathsFromLiveEvents");
    expect(pill).toContain("function mirekReasoningDisplayDensity");
    expect(pill).toContain("function buildMirekReasoningDisplayGrid");
    expect(pill).toContain("advanceReasoningTheaterFrontierTracker");
    expect(pill).toContain("const REASONING_THEATER_SUPPRESSION_PATTERNS");
    expect(pill).toContain("function resolveReasoningTheaterPhase");
    expect(theaterDisplay).not.toMatch(/from ["']react["']/);
    expect(theaterDisplay).not.toContain("@/store/");
    expect(theaterDisplay).not.toContain("@/components/helix/HelixAskPill");
    expect(theaterDisplay).not.toContain("deriveReasoningTheaterState");
    expect(theaterDisplay).not.toContain("setReasoningTheater");
    expect(theaterDisplay).not.toContain("runAskTurn");
    expect(theaterDisplay).not.toContain("fetch(");
  });

  it("keeps response envelope copy formatting in the non-React envelope copy module", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const envelopeCopy = read("client/src/lib/helix/ask-envelope-copy.ts");

    expect(pill).toContain('from "@/lib/helix/ask-envelope-copy"');
    for (const symbol of ["formatEnvelopeSectionsForCopy", "normalizeHelixAskEnvelopeCitations"]) {
      expect(pill).not.toContain(`function ${symbol}`);
      expect(pill).not.toContain(`export function ${symbol}`);
      expect(envelopeCopy).toContain(`export function ${symbol}`);
    }
    expect(pill).not.toContain("function normalizeCitations");
    expect(envelopeCopy).not.toMatch(/from ["']react["']/);
    expect(envelopeCopy).not.toContain("@/store/");
    expect(envelopeCopy).not.toContain("@/components/helix/HelixAskPill");
    expect(envelopeCopy).not.toContain("setAskReplies");
    expect(envelopeCopy).not.toContain("enqueueVoicePlaybackIntent");
    expect(envelopeCopy).not.toContain("runAskTurn");
    expect(envelopeCopy).not.toContain("fetch(");
  });

  it("keeps goal pill text formatting in the non-React goal display module", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const goalDisplay = read("client/src/lib/helix/ask-goal-pill-display.ts");

    expect(pill).toContain('from "@/lib/helix/ask-goal-pill-display"');
    for (const symbol of ["labelizeGoalPillValue", "formatGoalPillCadence"]) {
      expect(pill).not.toContain(`function ${symbol}`);
      expect(pill).not.toContain(`export function ${symbol}`);
      expect(goalDisplay).toContain(`export function ${symbol}`);
    }
    expect(goalDisplay).not.toMatch(/from ["']react["']/);
    expect(goalDisplay).not.toContain("@/store/");
    expect(goalDisplay).not.toContain("@/components/helix/HelixAskPill");
    expect(goalDisplay).not.toContain("setAskReplies");
    expect(goalDisplay).not.toContain("enqueueVoicePlaybackIntent");
    expect(goalDisplay).not.toContain("runAskTurn");
    expect(goalDisplay).not.toContain("fetch(");
  });

  it("keeps steering queue display builders in the non-React steering queue module", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const steeringQueue = read("client/src/lib/helix/ask-steering-queue-display.ts");

    expect(pill).toContain('from "@/lib/helix/ask-steering-queue-display"');
    for (const symbol of [
      "buildHelixAskSteeringQueueItems",
      "shouldAutoWakeHelixMailboxQueueItem",
      "readHelixSteeringQueueItemClass",
      "readHelixSteeringQueueDotClass",
    ]) {
      expect(pill).not.toContain(`function ${symbol}`);
      expect(steeringQueue).toContain(`export function ${symbol}`);
    }
    expect(pill).not.toContain("const HELIX_ASK_STEERING_QUEUE_STATUS_RANK");
    expect(steeringQueue).toContain("HELIX_ASK_STEERING_QUEUE_STATUS_RANK");
    expect(steeringQueue).not.toMatch(/from ["']react["']/);
    expect(steeringQueue).not.toContain("@/store/");
    expect(steeringQueue).not.toContain("@/components/helix/HelixAskPill");
    expect(steeringQueue).not.toContain("setAskReplies");
    expect(steeringQueue).not.toContain("enqueueVoicePlaybackIntent");
    expect(steeringQueue).not.toContain("runAskTurn");
    expect(steeringQueue).not.toContain("fetch(");
    expect(steeringQueue).not.toContain("dispatchHelixWorkstationAction");
  });

  it("keeps pure workstation chain parser helpers in the non-React workstation parser module", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const parser = read("client/src/lib/workstation/ask-workstation-parser.ts");

    expect(pill).toContain('from "@/lib/workstation/ask-workstation-parser"');
    expect(pill).not.toContain("export function parseWorkstationActionChainCommand");
    expect(parser).toContain("export function parseWorkstationActionChainCommand");
    expect(parser).not.toMatch(/from ["']react["']/);
    expect(parser).not.toContain("@/store/");
    expect(parser).not.toContain("@/components/helix/HelixAskPill");
    expect(parser).not.toContain("dispatchHelixWorkstationAction");
    expect(parser).not.toContain("dispatchHelixWorkstationActions");
    expect(parser).not.toContain("useDocViewerStore");
  });
});
