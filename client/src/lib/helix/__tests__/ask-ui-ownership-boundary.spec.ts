import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (repoPath: string): string =>
  fs.readFileSync(path.resolve(process.cwd(), repoPath), "utf8");

describe("Helix Ask UI ownership boundaries", () => {
  it("keeps a human-readable ownership map for extracted modules and quarantined behavior", () => {
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    for (const moduleName of [
      "ask-agent-runtime-display.ts",
      "ask-answer-rendering.ts",
      "ask-active-turn-stream.ts",
      "ask-convergence-display.ts",
      "ask-context-capsule-display.ts",
      "ask-continuous-turn-display.ts",
      "ask-debug-event-display.ts",
      "ask-display-text.ts",
      "ask-doc-viewer-context.ts",
      "ask-envelope-copy.ts",
      "../agi/debugExport.ts",
      "ask-goal-pill-display.ts",
      "ask-live-source-display.ts",
      "ask-observer-commentary-display.ts",
      "ask-observer-events.ts",
      "ask-output-cleanup.ts",
      "ask-procedural-display.ts",
      "ask-read-aloud-display.ts",
      "ask-reasoning-battle-display.ts",
      "ask-reasoning-frontier-display.ts",
      "ask-reasoning-theater-display.ts",
      "ask-stage-play-ledger.ts",
      "ask-status-classnames.ts",
      "ask-stable-hash.ts",
      "ask-steering-queue-display.ts",
      "ask-terminal-projection.ts",
      "ask-turn-transcript.ts",
      "ask-value-normalization.ts",
      "ask-voice-capture-display.ts",
      "ask-voice-copy-display.ts",
      "ask-voice-continuation-lexical.ts",
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
      "Stage Play generated wake projection suppression",
      "Voice capture, STT, confirmation, continuation, and auto-dispatch",
      "Workstation command lexicon and panel resolution",
      "Pending input and cancellation terminal visibility",
      "Voice continuation and intent-shift policy",
      "Voice language and workstation fast-path policy",
      "Voice playback audio runtime",
      "Voice recorder runtime and MIME handling",
      "Voice brief pinning and speech suppression",
      "Exploration ladder and context chooser policy",
      "Ask request construction and attachment admission",
      "Docs-viewer and workspace context snapshots",
      "Agent runtime/provider controller wiring",
      "Context compaction resume-frame handoff",
      "Backend entrypoint and runtime authority guards",
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

  it("keeps runtime authority and pending terminal lifecycle helpers quarantined in HelixAskPill", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const displayOwners = {
      terminalProjection: read("client/src/lib/helix/ask-terminal-projection.ts"),
      turnTranscript: read("client/src/lib/helix/ask-turn-transcript.ts"),
      debugEventDisplay: read("client/src/lib/helix/ask-debug-event-display.ts"),
      proceduralDisplay: read("client/src/lib/helix/ask-procedural-display.ts"),
      valueNormalization: read("client/src/lib/helix/ask-value-normalization.ts"),
    };

    expect(map).toContain("Pending input and cancellation terminal visibility");
    expect(map).toContain("debug authority attachment");
    for (const symbol of [
      "readAgentLoopAuditRecord",
      "extractAskLevelTheoryReflection",
      "normalizeHelixRuntimeActionKey",
      "readHelixDecisionCapabilityKeys",
      "readHelixGatewayCapabilityKeys",
      "collectHelixAgentSelectedCapabilities",
      "readHelixWorkstationActionRuntimeKeys",
      "buildHelixActionEnvelopeRuntimeAuthority",
      "attachHelixActionEnvelopeRuntimeAuthorityDebug",
      "readHelixPendingInputRecord",
      "normalizeHelixPendingTransitionMarker",
      "readHelixPendingTransitionTrace",
      "hasHelixPendingCancellationMarker",
      "isHelixCanceledPendingTurn",
      "resolveHelixPendingInputRecord",
      "resolveHelixVisibleTerminalKind",
    ]) {
      expect(pill).toContain(symbol);
      expect(map).toContain(symbol);
    }
    for (const symbol of [
      "normalizeHelixRuntimeActionKey",
      "readHelixDecisionCapabilityKeys",
      "readHelixGatewayCapabilityKeys",
      "collectHelixAgentSelectedCapabilities",
      "readHelixWorkstationActionRuntimeKeys",
      "buildHelixActionEnvelopeRuntimeAuthority",
      "attachHelixActionEnvelopeRuntimeAuthorityDebug",
      "resolveHelixVisibleTerminalKind",
    ]) {
      for (const owner of Object.values(displayOwners)) {
        expect(owner).not.toContain(symbol);
      }
    }
    expect(displayOwners.terminalProjection).toContain("readHelixPendingInputRecord");
    expect(map).toContain("pending-input request reading");
  });

  it("keeps pure debug drawer fallback formatting in the shared debug export module", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const debugExport = read("client/src/lib/agi/debugExport.ts");

    expect(pill).toContain('from "@/lib/agi/debugExport"');
    expect(pill).not.toContain("export function buildDebugExportDrawerFallbackResult");
    expect(pill).not.toContain("type DebugExportUiResult =");
    expect(debugExport).toContain("export function buildDebugExportDrawerFallbackResult");
    expect(debugExport).toContain("export type DebugExportUiResult");
    for (const localAnchor of [
      "buildReplyScopedDebugExportFromRenderedReply",
      "buildReplyScopedDebugExportFromRenderedButton",
      "resolveAuthoritativeDebugExportPayload",
      "copyDebugPayloadToClipboard",
    ]) {
      expect(pill).toContain(localAnchor);
    }
    expect(debugExport).not.toMatch(/from ["']react["']/);
    expect(debugExport).not.toContain("@/store/");
    expect(debugExport).not.toContain("@/components/helix/HelixAskPill");
    expect(debugExport).not.toContain("navigator.clipboard.");
    expect(debugExport).not.toContain(".writeText(");
    expect(debugExport).not.toContain(".readText(");
    expect(debugExport).not.toContain("document.querySelector");
    expect(debugExport).not.toContain("fetch(");
  });

  it("keeps deterministic fallback output cleanup primitives in the non-React cleanup owner", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const outputCleanup = read("client/src/lib/helix/ask-output-cleanup.ts");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");

    expect(map).toContain("ask-output-cleanup.ts");
    expect(map).toContain("Fallback answer selection");
    expect(pill).toContain('from "@/lib/helix/ask-output-cleanup"');
    for (const symbol of [
      "stripAnswerBoundaryPrefix",
      "stripStageTags",
      "normalizeQuestionMatch",
      "stripInlineQuestionLine",
      "stripQuestionPrefixText",
      "cleanPromptLine",
      "stripLeadingQuestion",
    ]) {
      expect(outputCleanup).toContain(`export function ${symbol}`);
      expect(pill).not.toContain(`function ${symbol}`);
      expect(pill).not.toContain(`const ${symbol} =`);
    }
    expect(outputCleanup).toContain("export const HELIX_ASK_ANSWER_MARKER_SPLIT_RE");
    expect(pill).not.toContain("const HELIX_ASK_ANSWER_BOUNDARY_PREFIX_RE");
    expect(pill).not.toContain("const HELIX_ASK_ANSWER_MARKER_SPLIT_RE");
    for (const localAnchor of [
      "stripPromptEcho",
      "extractAnswerBlock",
      "stripEvidencePromptBlock",
      "decideHelixAskFormat",
    ]) {
      expect(pill).toContain(localAnchor);
      expect(outputCleanup).not.toContain(localAnchor);
    }
    expect(outputCleanup).not.toMatch(/from ["']react["']/);
    expect(outputCleanup).not.toContain("@/store/");
    expect(outputCleanup).not.toContain("@/components/helix/HelixAskPill");
    expect(outputCleanup).not.toContain("fetch(");
    expect(outputCleanup).not.toContain("navigator.clipboard");
    expect(outputCleanup).not.toContain("runAskTurn");
  });

  it("keeps deterministic docs-viewer path parsing in the non-React docs context owner", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const docsContext = read("client/src/lib/helix/ask-doc-viewer-context.ts");

    expect(map).toContain("ask-doc-viewer-context.ts");
    expect(map).toContain("HASK-BSQ-001 handoff behavior remains quarantined");
    expect(pill).toContain('from "@/lib/helix/ask-doc-viewer-context"');
    for (const symbol of [
      "normalizeDocsViewerAnchorPath",
      "extractExplicitDocsViewerPath",
      "normalizeDocPathForDebugCompare",
    ]) {
      expect(docsContext).toContain(`export function ${symbol}`);
      expect(pill).not.toContain(`function ${symbol}`);
    }
    for (const localAnchor of [
      "resolveAskTurnDocViewerSnapshotPath",
      "readDocViewerPathFromDesktopUrlForAskSnapshot",
      "rememberDocViewerPathForAskSnapshot",
      "resolveDocsViewerAnchorPathForQuestion",
      "buildAskTurnWorkspaceContextSnapshot",
    ]) {
      expect(pill).toContain(localAnchor);
      expect(map).toContain(localAnchor);
      expect(docsContext).not.toContain(localAnchor);
    }
    expect(docsContext).not.toMatch(/from ["']react["']/);
    expect(docsContext).not.toContain("@/store/");
    expect(docsContext).not.toContain("@/components/helix/HelixAskPill");
    expect(docsContext).not.toContain("fetch(");
    expect(docsContext).not.toContain("window.");
    expect(docsContext).not.toContain("localStorage");
    expect(docsContext).not.toContain("sessionStorage");
  });

  it("keeps reply-scoped debug export envelope and clipboard authority helpers local", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const debugExport = read("client/src/lib/agi/debugExport.ts");

    for (const symbol of [
      "base64FromText",
      "sha256TextHex",
      "buildReplyMasterEventClockExport",
      "extractHelixRenderedTurnDebugFromButton",
      "debugPayloadMatchesRenderedReply",
      "debugPayloadMatchesRenderedTurnPayload",
      "normalizeReplyMasterDebugPayload",
      "buildClientProjectionDebugFields",
      "summarizeHelixDebugObservationForCopy",
      "summarizeHelixDebugArtifactsForCopy",
      "summarizeHelixAgentRuntimeLoopForCopy",
      "copyHelixRailCriticalDebugFieldsForUi",
      "boundHelixDebugExportTextForUi",
      "buildReplyScopedDebugExportFromRenderedReply",
      "buildReplyScopedDebugExportFromRenderedButton",
      "resolveAuthoritativeDebugExportPayload",
      "copyDebugPayloadToClipboard",
    ]) {
      expect(pill).toContain(symbol);
      expect(map).toContain(symbol);
      expect(debugExport).not.toContain(symbol);
    }
    expect(pill).toContain("buildHelixDebugExportEnvelopeFromMasterPayload");
    expect(debugExport).toContain("buildHelixDebugExportEnvelopeFromMasterPayload");
    expect(map).toContain("buildHelixDebugExportEnvelopeFromMasterPayload");
    expect(map).toContain("rendered-button turn matching");
    expect(map).toContain("payload hashing/encoding");
  });

  it("keeps rendered-button debug copy scoped to the matched reply turn only", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");

    expect(pill).toContain("const renderedMatchesReply =");
    expect(pill).toContain("debug: renderedMatchesReply ? reply.debug ?? null : null");
    expect(pill).toContain("active_turn_id: renderedMatchesReply ? reply.id : null");
    expect(pill).toContain(
      "debug_export_ref: renderedMatchesReply ? replyRecord.debug_export_ref ?? replyDebugRecord?.debug_export_ref ?? null : null",
    );
    expect(pill).toContain(
      "backend_debug_response_ref: renderedMatchesReply\n      ? replyRecord.backend_debug_response_ref ?? replyDebugRecord?.backend_debug_response_ref ?? null\n      : null",
    );
    expect(pill).toContain(
      "const providedPayloadMatchesRenderedTurn =\n          hasProvidedPayload && debugPayloadMatchesRenderedTurnPayload(payload, sourceElement)",
    );
    expect(pill).toContain("const localExportPayload = providedPayloadMatchesRenderedTurn");
    expect(pill).toContain(": buildReplyScopedDebugExportFromRenderedButton(reply, sourceElement, \"rendered_button_scope\") ??");
  });

  it("keeps agent runtime provider display helpers in the non-React runtime display module", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const runtimeDisplay = read("client/src/lib/helix/ask-agent-runtime-display.ts");

    expect(pill).toContain('from "@/lib/helix/ask-agent-runtime-display"');
    for (const symbol of [
      "DEFAULT_HELIX_AGENT_RUNTIME_PROVIDERS",
      "formatHelixAgentRuntimeShortLabel",
      "isHelixAgentRuntimeId",
      "normalizeHelixAgentProvidersResponse",
      "resolveHelixAskActualAgentProviderLabel",
      "resolveNextSelectableHelixAgentRuntime",
      "resolveSelectedHelixAgentRuntime",
    ]) {
      expect(runtimeDisplay).toContain(`export ${symbol.startsWith("DEFAULT_") ? "const" : "function"} ${symbol}`);
    }
    for (const localAnchor of [
      "readStoredHelixAskAgentRuntime",
      "persistHelixAskAgentRuntime",
      "fetch(\"/api/agi/agent-providers\"",
      "handleAgentRuntimeButtonClick",
    ]) {
      expect(pill).toContain(localAnchor);
      expect(runtimeDisplay).not.toContain(localAnchor);
    }
    expect(runtimeDisplay).not.toMatch(/from ["']react["']/);
    expect(runtimeDisplay).not.toContain("@/store/");
    expect(runtimeDisplay).not.toContain("@/components/helix/HelixAskPill");
    expect(runtimeDisplay).not.toContain("fetch(");
    expect(runtimeDisplay).not.toContain("localStorage");
    expect(runtimeDisplay).not.toContain("navigator.clipboard");
    expect(runtimeDisplay).not.toContain("speakVoice");
    expect(runtimeDisplay).not.toContain("runAskTurn");
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
      "incrementHelixAskConsoleDropReason",
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
      "buildAskLiveEventFromTurnTranscriptRecord",
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
      "resolveHelixAskVisibleJobReadyLinks",
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
    expect(pill).not.toContain("const uniqueTextValues");
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

  it("documents voice continuation and intent-shift policy as local behavior", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const valueNormalization = read("client/src/lib/helix/ask-value-normalization.ts");
    const voiceCopy = read("client/src/lib/helix/ask-voice-copy-display.ts");
    const voiceText = read("client/src/lib/helix/ask-voice-text-display.ts");

    for (const anchor of [
      "shouldMergeVoiceContinuationInFlight",
      "shouldRestartExplorationLadderOnSupersede",
      "isLikelyContinuationAddendum",
      "isLikelyContinuationTailFragment",
      "scoreIntentShift",
    ]) {
      expect(pill).toContain(`export function ${anchor}`);
      expect(map).toContain(anchor);
      expect(valueNormalization).not.toContain(anchor);
      expect(voiceCopy).not.toContain(anchor);
      expect(voiceText).not.toContain(anchor);
    }
    expect(map).toContain("Latest-turn continuation semantics");
    expect(map).toContain("voice intent arbitration");
  });

  it("keeps deterministic voice continuation lexical predicates in the non-React lexical owner", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const lexical = read("client/src/lib/helix/ask-voice-continuation-lexical.ts");
    const voiceCopy = read("client/src/lib/helix/ask-voice-copy-display.ts");
    const voiceText = read("client/src/lib/helix/ask-voice-text-display.ts");

    expect(map).toContain("ask-voice-continuation-lexical.ts");
    expect(map).toContain("in-flight merge and restart policy remain behavior-sensitive");
    expect(pill).toContain('from "@/lib/helix/ask-voice-continuation-lexical"');
    for (const symbol of [
      "extractIntentTerms",
      "hasDanglingTurnTail",
      "isLowInformationTailTranscript",
      "extractLatestContinuationQuestionFocus",
      "hasSufficientLexicalCarryover",
      "isLikelyNearTurnContinuation",
    ]) {
      expect(lexical).toContain(`export function ${symbol}`);
      expect(pill).not.toContain(`function ${symbol}`);
      expect(voiceCopy).not.toContain(symbol);
      expect(voiceText).not.toContain(symbol);
    }
    for (const localAnchor of [
      "shouldMergeVoiceContinuationInFlight",
      "shouldRestartExplorationLadderOnSupersede",
      "isLikelyContinuationAddendum",
      "isLikelyContinuationTailFragment",
      "scoreIntentShift",
    ]) {
      expect(pill).toContain(localAnchor);
      expect(lexical).not.toContain(localAnchor);
    }
    expect(lexical).not.toMatch(/from ["']react["']/);
    expect(lexical).not.toContain("@/store/");
    expect(lexical).not.toContain("@/components/helix/HelixAskPill");
    expect(lexical).not.toContain("fetch(");
    expect(lexical).not.toContain("navigator.clipboard");
    expect(lexical).not.toContain("runAskTurn");
    expect(lexical).not.toContain("speakVoice");
  });

  it("documents voice language and workstation fast-path policy as local behavior", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const procedural = read("client/src/lib/helix/ask-procedural-display.ts");
    const voiceCopy = read("client/src/lib/helix/ask-voice-copy-display.ts");
    const valueNormalization = read("client/src/lib/helix/ask-value-normalization.ts");

    for (const anchor of [
      "resolveVoiceSourceLanguage",
      "resolveVoiceResponseLanguage",
      "isHighRiskTranslationContext",
      "getWorkstationFastPathReplyText",
      "renderCalculatorFastPathReply",
      "selectWorkstationFastPathReplyAction",
    ]) {
      expect(pill).toContain(anchor);
      expect(map).toContain(anchor);
      expect(procedural).not.toContain(anchor);
      expect(voiceCopy).not.toContain(anchor);
      expect(valueNormalization).not.toContain(anchor);
    }
    expect(pill).toContain("runScientificSolve");
    expect(procedural).not.toContain("runScientificSolve");
    expect(map).toContain("Translation uncertainty handling");
    expect(map).toContain("calculator fast-path solve execution");
  });

  it("documents workstation command lexicon and panel resolution as local behavior", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const procedural = read("client/src/lib/helix/ask-procedural-display.ts");
    const valueNormalization = read("client/src/lib/helix/ask-value-normalization.ts");

    for (const anchor of [
      "normalizePanelQuery",
      "resolvePanelIdFromText",
      "resolvePanelIdFromPath",
      "parseOpenPanelCommand",
      "restateWorkstationSubgoal",
      "normalizeWorkstationCommandText",
      "resolveCapabilityAliasPanelAction",
      "parseWorkstationLexiconAction",
    ]) {
      expect(pill).toContain(anchor);
      expect(map).toContain(anchor);
      expect(procedural).not.toContain(anchor);
      expect(valueNormalization).not.toContain(anchor);
    }
    expect(map).toContain("panel capability matching");
    expect(map).toContain("HelixWorkstationAction");
  });

  it("documents exploration ladder and context chooser policy as local behavior", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const terminalProjection = read("client/src/lib/helix/ask-terminal-projection.ts");
    const voiceCopy = read("client/src/lib/helix/ask-voice-copy-display.ts");
    const valueNormalization = read("client/src/lib/helix/ask-value-normalization.ts");

    for (const anchor of [
      "decideExplorationLadderAction",
      "buildExplorationEscalationPrompt",
      "buildExplorationArtifactRetryPrompt",
      "buildConversationFallbackBrief",
      "resolveAskContextChooserAutoMode",
      "isRepoCodeEvidencePrompt",
    ]) {
      expect(pill).toContain(anchor);
      expect(map).toContain(anchor);
      expect(terminalProjection).not.toContain(anchor);
      expect(voiceCopy).not.toContain(anchor);
      expect(valueNormalization).not.toContain(anchor);
    }
    expect(map).toContain("Retry/escalation prompts");
    expect(map).toContain("context/source chooser policy");
  });

  it("documents context compaction resume-frame handoff as local behavior", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const debugDisplay = read("client/src/lib/helix/ask-debug-event-display.ts");
    const valueNormalization = read("client/src/lib/helix/ask-value-normalization.ts");
    const terminalProjection = read("client/src/lib/helix/ask-terminal-projection.ts");

    for (const anchor of [
      "isHelixAskContextCompactionPauseText",
      "extractHelixAskContextCompactionResumeFrame",
      "extractLatestHelixAskContextCompactionResumeFrameFromReplies",
      "readStoredHelixAskContextCompactionResumeFrame",
      "writeStoredHelixAskContextCompactionResumeFrame",
      "isHelixAskContextCompactionPausePendingReply",
    ]) {
      expect(pill).toContain(anchor);
      expect(map).toContain(anchor);
      expect(debugDisplay).not.toContain(anchor);
      expect(valueNormalization).not.toContain(anchor);
      expect(terminalProjection).not.toContain(anchor);
    }
    expect(pill).toContain("sessionStorage");
    expect(map).toContain("Session-storage resume-frame cache");
    expect(map).toContain("request metadata handoff");
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
      "resolveSessionCapsuleConfidenceBand",
      "buildContextCapsuleCopyText",
      "buildContextCapsuleStampDataUri",
    ]) {
      expect(pill).not.toContain(`function ${symbol}`);
      expect(contextCapsule).toContain(`export function ${symbol}`);
    }
    expect(pill).not.toContain("const SESSION_CAPSULE_CONFIDENCE_LABEL");
    expect(contextCapsule).toContain("export const SESSION_CAPSULE_CONFIDENCE_LABEL");
    expect(contextCapsule).toContain("export type SessionCapsuleConfidenceBand");
    expect(contextCapsule).not.toContain("deriveSessionCapsuleState");
    expect(pill).toContain("export function deriveSessionCapsuleState");
    expect(pill).toContain("export function upsertContextCapsuleLedger");
    expect(pill).toContain("export function buildSelectedContextCapsuleIds");
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
      expect(pill).not.toContain(`function ${symbol}`);
      expect(convergenceDisplay).toContain(`export const ${symbol}`);
    }
    for (const symbol of ["buildConvergenceDebugSnapshot", "hasConvergenceStateChanged"]) {
      expect(pill).not.toContain(`function ${symbol}`);
      expect(convergenceDisplay).toContain(`export function ${symbol}`);
    }
    expect(convergenceDisplay).toContain("export function buildConvergenceDebugSnapshot");
    expect(convergenceDisplay).toContain("export function hasConvergenceStateChanged");
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
      "readHelixAskDebugContextFromMeta",
      "safeJsonStringify",
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
      "isWorkstationLifecycleEvent",
      "buildObservationGroundedReplyText",
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
      "buildVoiceAutoSpeakUtteranceId",
      "resolveInitialMicArmState",
      "transitionReadAloudState",
      "shouldStopReadAloudOnButtonPress",
      "formatReadAloudButtonLabel",
      "hashVoiceUtteranceKey",
      "isInterimVoicePlaybackUtteranceKind",
      "isManualVoicePlaybackUtterance",
      "isMissionVoiceOutputModeEnabled",
      "shouldEnableVoiceRollout",
    ]) {
      expect(pill).not.toContain(`function ${symbol}`);
      expect(pill).not.toContain(`export function ${symbol}`);
      expect(readAloud).toContain(`export function ${symbol}`);
    }
    expect(pill).not.toContain("const VOICE_AUTO_SPEAK_UTTERANCE_ID_MAX_CHARS");
    expect(readAloud).toContain("export const VOICE_AUTO_SPEAK_UTTERANCE_ID_MAX_CHARS");
    expect(readAloud).not.toMatch(/from ["']react["']/);
    expect(readAloud).not.toContain("@/store/");
    expect(readAloud).not.toContain("@/components/helix/HelixAskPill");
    expect(readAloud).not.toContain("speakVoice");
    expect(readAloud).not.toContain("AudioContext");
    expect(readAloud).not.toContain("enqueueVoicePlaybackIntent");
    expect(readAloud).not.toContain("runAskTurn");
    expect(readAloud).not.toContain("fetch(");
  });

  it("keeps deterministic stable hash helpers in the non-React hash owner module", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const stableHash = read("client/src/lib/helix/ask-stable-hash.ts");
    const battleDisplay = read("client/src/lib/helix/ask-reasoning-battle-display.ts");
    const theaterDisplay = read("client/src/lib/helix/ask-reasoning-theater-display.ts");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");

    expect(map).toContain("ask-stable-hash.ts");
    expect(map).toContain("cryptographic integrity");
    expect(pill).toContain('from "@/lib/helix/ask-stable-hash"');
    expect(battleDisplay).toContain('from "@/lib/helix/ask-stable-hash"');
    expect(theaterDisplay).toContain('from "@/lib/helix/ask-stable-hash"');
    expect(stableHash).toContain("export function hash32");
    expect(stableHash).toContain("export function stableHelixProjectionHash");
    expect(pill).not.toContain("const stableHelixProjectionHash =");
    expect(pill).not.toContain("function hash32(value: string)");
    expect(battleDisplay).not.toContain("function hash32(value: string)");
    expect(theaterDisplay).not.toContain("function hash32(value: string)");
    expect(stableHash).not.toMatch(/from ["']react["']/);
    expect(stableHash).not.toContain("@/store/");
    expect(stableHash).not.toContain("@/components/helix/HelixAskPill");
    expect(stableHash).not.toContain("navigator.clipboard");
    expect(stableHash).not.toContain("fetch(");
    expect(stableHash).not.toContain("runAskTurn");
    expect(stableHash).not.toContain("crypto.");
  });

  it("keeps generic value normalization helpers in the non-React value owner module", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const valueNormalization = read("client/src/lib/helix/ask-value-normalization.ts");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");

    expect(map).toContain("ask-value-normalization.ts");
    expect(map).toContain("Env policy");
    expect(pill).toContain('from "@/lib/helix/ask-value-normalization"');
    for (const symbol of [
      "readNumber",
      "clampNumber",
      "clipText",
      "coerceText",
      "asNonEmptyString",
      "asObjectRecord",
      "asStringArray",
      "dedupeStrings",
    ]) {
      expect(valueNormalization).toContain(`export function ${symbol}`);
      expect(pill).not.toContain(`function ${symbol}`);
    }
    expect(pill).not.toContain("function asPlainRecord");
    expect(pill).not.toContain("function asNonEmptyArgString");
    expect(pill).not.toContain("asPlainRecord(");
    expect(pill).not.toContain("asNonEmptyArgString(");
    expect(pill).not.toContain("const asRecord =");
    for (const localAnchor of [
      "parseVoiceEnvBoolean",
      "parseVoiceEnvPercent",
      "buildQueuedAskTurn",
      "resolveHelixAskVisibleTerminal",
      "resolveAuthoritativeDebugExportPayload",
      "shouldKeepHelixReplyInBriefLane",
      "deriveReasoningTheaterState",
    ]) {
      expect(pill).toContain(localAnchor);
      expect(valueNormalization).not.toContain(localAnchor);
    }
    expect(valueNormalization).not.toMatch(/from ["']react["']/);
    expect(valueNormalization).not.toContain("@/store/");
    expect(valueNormalization).not.toContain("@/components/helix/HelixAskPill");
    expect(valueNormalization).not.toContain("localStorage");
    expect(valueNormalization).not.toContain("navigator.clipboard");
    expect(valueNormalization).not.toContain("fetch(");
    expect(valueNormalization).not.toContain("runAskTurn");
    expect(valueNormalization).not.toContain("speakVoice");
  });

  it("keeps deterministic voice-capture signal predicates in the non-React voice capture display module", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const voiceCapture = read("client/src/lib/helix/ask-voice-capture-display.ts");

    expect(pill).toContain('from "@/lib/helix/ask-voice-capture-display"');
    for (const symbol of [
      "smoothVoiceLevel",
      "isFlatVoiceSignal",
      "isRecorderStalled",
      "isLikelyLoopbackDeviceLabel",
      "shouldPrimeSegmentWithContainerHeader",
      "resolveVoiceNoiseHandlingProfile",
      "isLowAudioQualitySignal",
      "describeMediaErrorCode",
    ]) {
      expect(pill).not.toContain(`function ${symbol}`);
      expect(pill).not.toContain(`export function ${symbol}`);
      expect(voiceCapture).toContain(`export function ${symbol}`);
    }
    for (const symbol of [
      "VOICE_LEVEL_ATTACK_ALPHA",
      "VOICE_LEVEL_RELEASE_ALPHA",
      "VOICE_FLAT_SIGNAL_WINDOW_MS",
      "VOICE_FLAT_SIGNAL_VARIANCE_THRESHOLD",
      "VOICE_RECORDER_STALL_MS",
      "MIC_PLAYBACK_BARGE_MIN_SPEECH_PROBABILITY",
      "MIC_PLAYBACK_BARGE_STRONG_SPEECH_PROBABILITY",
      "MIC_PLAYBACK_BARGE_MIN_SNR_DB",
      "MIC_PLAYBACK_BARGE_RMS_MULTIPLIER",
      "VOICE_LOCAL_AUDIO_GATE_MIN_SPEECH_PROBABILITY",
      "VOICE_LOCAL_AUDIO_GATE_MIN_SNR_DB",
      "VOICE_LOCAL_AUDIO_GATE_MIN_DURATION_MS",
    ]) {
      expect(pill).not.toContain(`const ${symbol}`);
      expect(voiceCapture).toContain(`export const ${symbol}`);
    }
    expect(pill).not.toContain("type VoiceNoiseHandlingProfile =");
    expect(voiceCapture).toContain("export type VoiceNoiseHandlingProfile");
    for (const localAnchor of [
      "getMicRecorderMimeCandidates",
      "pickSupportedMicRecorderMimeType",
      "pickMicRecorderMimeType",
      "MediaRecorder",
      "transcribeVoice",
      "shouldTreatMicSignalAsSpeech",
    ]) {
      expect(pill).toContain(localAnchor);
      expect(voiceCapture).not.toContain(localAnchor);
    }
    expect(voiceCapture).not.toMatch(/from ["']react["']/);
    expect(voiceCapture).not.toContain("@/store/");
    expect(voiceCapture).not.toContain("@/components/helix/HelixAskPill");
    expect(voiceCapture).not.toContain("navigator");
    expect(voiceCapture).not.toContain("MediaRecorder");
    expect(voiceCapture).not.toContain("fetch(");
    expect(voiceCapture).not.toContain("speakVoice");
    expect(voiceCapture).not.toContain("transcribeVoice");
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
