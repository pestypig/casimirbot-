import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (repoPath: string): string =>
  fs.readFileSync(path.resolve(process.cwd(), repoPath), "utf8");

describe("Helix Ask UI ownership boundaries", () => {
  it("keeps a human-readable ownership map for extracted modules and quarantined behavior", () => {
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    for (const moduleName of [
      "ask-agibot-preflight-error.ts",
      "ask-agent-runtime-display.ts",
      "ask-answer-rendering.ts",
      "ask-attachment-prompt-policy.ts",
      "ask-active-turn-stream.ts",
      "ask-convergence-display.ts",
      "ask-context-capsule-display.ts",
      "ask-context-capsule-ledger.ts",
      "ask-continuous-turn-display.ts",
      "ask-debug-event-display.ts",
      "ask-display-text.ts",
      "ask-doc-viewer-context.ts",
      "ask-env-config.ts",
      "ask-envelope-copy.ts",
      "ask-exploration-policy.ts",
      "ask-external-prompt-claim.ts",
      "../agi/debugExport.ts",
      "ask-goal-pill-display.ts",
      "ask-interim-voice-callout.ts",
      "ask-local-fallback-classification.ts",
      "ask-live-source-display.ts",
      "ask-luma-mood-display.ts",
      "ask-observer-commentary-display.ts",
      "ask-observer-events.ts",
      "ask-output-cleanup.ts",
      "ask-pending-input-readers.ts",
      "ask-procedural-display.ts",
      "ask-read-aloud-display.ts",
      "ask-reasoning-battle-display.ts",
      "ask-reasoning-frontier-display.ts",
      "ask-reasoning-theater-hard-failure.ts",
      "ask-reasoning-theater-display.ts",
      "ask-reasoning-theater-evidence.ts",
      "ask-runtime-authority-readers.ts",
      "ask-stage-play-ledger.ts",
      "ask-status-classnames.ts",
      "ask-stable-hash.ts",
      "ask-steering-queue-display.ts",
      "ask-terminal-projection.ts",
      "ask-turn-transcript.ts",
      "ask-value-normalization.ts",
      "ask-visual-evidence-readers.ts",
      "ask-voice-capture-checkpoints.ts",
      "ask-voice-capture-display.ts",
      "ask-voice-barge-policy.ts",
      "ask-voice-brief-policy.ts",
      "ask-voice-copy-display.ts",
      "ask-voice-diagnostics-export.ts",
      "ask-voice-playback-intent.ts",
      "ask-voice-turn-scoring.ts",
      "ask-voice-confirmation-command.ts",
      "ask-voice-transcript-confidence.ts",
      "ask-voice-continuation-lexical.ts",
      "ask-voice-language-policy.ts",
      "ask-voice-playback-classification.ts",
      "ask-voice-playback-runtime.ts",
      "ask-voice-steering-client.ts",
      "ask-voice-text-display.ts",
      "ask-workstation-command-text.ts",
      "ask-workstation-fast-path.ts",
      "ask-workstation-pending-input.ts",
      "voice/voice-transcript.ts",
      "voice/voice-turn-authority.ts",
      "HelixAskAttachmentCommit.ts",
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
      "Visual/audio capture preferences",
      "HelixAskVisualCapturePreference",
      "Prompt interpretation and planner policy",
      "mode inference",
      "Stage Play generated wake admission and projection suppression",
      "Voice capture, STT, confirmation, continuation, and auto-dispatch",
      "Workstation command lexicon and panel resolution",
      "Pending input and cancellation terminal visibility",
      "Voice reasoning dispatch and suppression rescue policy",
      "Voice continuation and intent-shift policy",
      "Voice language and workstation fast-path policy",
      "normalizeVoiceLanguageTag",
      "Voice playback audio runtime",
      "Voice recorder runtime and MIME handling",
      "Voice brief pinning and speech suppression",
      "shouldAutoSpeakAnswerForTurn",
      "shouldPreserveAuthoritativeTerminalOverEvidenceGate",
      "Exploration ladder and context chooser policy",
      "Atomic viewer launch suppression",
      "Ask request construction and attachment admission",
      "isHelixAskVisualPrompt",
      "Docs-viewer and workspace context snapshots",
      "Agent runtime/provider controller wiring",
      "Context compaction resume-frame handoff",
      "Chat projection, persistence payloads, and reply lifecycle",
      "Backend entrypoint and runtime authority guards",
      "Visible terminal and route authority",
      "Debug export and clipboard authority",
      "buildHelixAskReplyCopyText",
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
    const runtimeReaders = read("client/src/lib/helix/ask-runtime-authority-readers.ts");
    const pendingInputReaders = read("client/src/lib/helix/ask-pending-input-readers.ts");

    expect(map).toContain("Pending input and cancellation terminal visibility");
    expect(map).toContain("Backend entrypoint and runtime authority guards");
    expect(map).toContain("Backend route guardrails");
    expect(map).toContain("debug authority attachment");
    for (const symbol of [
      "requiresHelixAskBackendEntrypoint",
      "shouldUseHelixAskBackendTurnEntrypoint",
      "buildHelixAskBackendEntrypointRuntimeFingerprint",
      "buildHelixActionEnvelopeRuntimeAuthority",
      "attachHelixActionEnvelopeRuntimeAuthorityDebug",
      "isWorkstationTurnTransitionPendingRequest",
      "registerTurnTerminalOutcome",
      "resolveHelixVisibleTerminalKind",
    ]) {
      expect(pill).toContain(symbol);
      expect(map).toContain(symbol);
    }
    for (const symbol of [
      "readHelixPendingInputRecord",
      "normalizeHelixPendingTransitionMarker",
      "readHelixPendingTransitionTrace",
      "isHelixCanceledPendingTurn",
      "resolveHelixPendingInputRecord",
    ]) {
      expect(pill).toContain(symbol);
      expect(pill).not.toContain(`function ${symbol}`);
      expect(pendingInputReaders).toContain(`export function ${symbol}`);
      expect(map).toContain(symbol);
    }
    expect(pill).not.toContain("function hasHelixPendingCancellationMarker");
    expect(pendingInputReaders).toContain("export function hasHelixPendingCancellationMarker");
    expect(map).toContain("hasHelixPendingCancellationMarker");
    expect(pill).toContain('from "@/lib/helix/ask-pending-input-readers"');
    expect(pendingInputReaders).not.toMatch(/from ["']react["']/);
    expect(pendingInputReaders).not.toContain("@/store/");
    expect(pendingInputReaders).not.toContain("@/components/helix/HelixAskPill");
    expect(pendingInputReaders).not.toContain("resolveHelixVisibleTerminalKind");
    expect(pendingInputReaders).not.toContain("runAskTurn");
    expect(pendingInputReaders).not.toContain("fetch(");
    expect(map).toContain("ask-pending-input-readers.ts");
    expect(map).toContain("visible terminal-kind selection");
    for (const symbol of [
      "readAgentLoopAuditRecord",
      "readAgentLoopAuditArray",
      "hasHelixAskBackendEntrypointTurnId",
      "extractAskLevelTheoryReflection",
      "normalizeHelixRuntimeActionKey",
      "readHelixDecisionCapabilityKeys",
      "readHelixGatewayCapabilityKeys",
      "collectHelixAgentSelectedCapabilities",
      "readHelixWorkstationActionRuntimeKeys",
    ]) {
      expect(pill).toContain(symbol);
      expect(pill).not.toContain(`function ${symbol}`);
      expect(runtimeReaders).toContain(`export function ${symbol}`);
      expect(map).toContain(symbol);
    }
    expect(pill).toContain('from "@/lib/helix/ask-runtime-authority-readers"');
    expect(runtimeReaders).not.toMatch(/from ["']react["']/);
    expect(runtimeReaders).not.toContain("@/store/");
    expect(runtimeReaders).not.toContain("@/components/helix/HelixAskPill");
    expect(runtimeReaders).not.toContain("dispatchHelixWorkstationAction");
    expect(runtimeReaders).not.toContain("runAskTurn");
    expect(runtimeReaders).not.toContain("fetch(");
    expect(map).toContain("ask-runtime-authority-readers.ts");
    expect(map).toContain("action-envelope allow/deny authority");
    for (const symbol of [
      "requiresHelixAskBackendEntrypoint",
      "shouldUseHelixAskBackendTurnEntrypoint",
      "hasHelixAskBackendEntrypointTurnId",
      "buildHelixAskBackendEntrypointRuntimeFingerprint",
      "buildHelixActionEnvelopeRuntimeAuthority",
      "attachHelixActionEnvelopeRuntimeAuthorityDebug",
      "isWorkstationTurnTransitionPendingRequest",
      "registerTurnTerminalOutcome",
      "resolveHelixVisibleTerminalKind",
    ]) {
      for (const owner of Object.values(displayOwners)) {
        expect(owner).not.toContain(symbol);
      }
    }
    expect(displayOwners.terminalProjection).toContain("readHelixPendingInputRecord");
    expect(map).toContain("pending-input request reading");
  });

  it("recrowns visual/audio capture preference syncing while capture runtime stays local", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const visualPreference = read("client/src/components/helix/ask-console/HelixAskVisualCapturePreference.ts");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const displayOwners = {
      activeTurnStream: read("client/src/lib/helix/ask-active-turn-stream.ts"),
      continuousTurnDisplay: read("client/src/lib/helix/ask-continuous-turn-display.ts"),
      liveSourceDisplay: read("client/src/lib/helix/ask-live-source-display.ts"),
      voiceCaptureDisplay: read("client/src/lib/helix/ask-voice-capture-display.ts"),
      valueNormalization: read("client/src/lib/helix/ask-value-normalization.ts"),
    };

    expect(map).toContain("Visual/audio capture preferences");
    expect(map).toContain("Preference storage/sync is recrowned in `ask-console/`");
    expect(map).toContain("capture route controller and media/audio transcript runtime stay local");
    expect(pill).toContain('from "@/components/helix/ask-console/HelixAskVisualCapturePreference"');
    expect(pill).toContain("readHelixAskVisualCaptureAudioPreference()");
    expect(pill).toContain("syncHelixAskVisualCaptureRoutePreference(");
    expect(pill).toContain("attachDisplayAudioSource(");
    expect(pill).not.toContain("function readHelixAskVisualCaptureAudioPreference");
    expect(pill).not.toContain("function syncHelixAskVisualCaptureRoutePreference");
    expect(pill).not.toContain("const HELIX_LIVE_ANSWER_VISUAL_CAPTURE_ROUTE_STORAGE_KEY");
    expect(visualPreference).toContain("export function readHelixAskVisualCaptureAudioPreference");
    expect(visualPreference).toContain("export function syncHelixAskVisualCaptureRoutePreference");
    expect(visualPreference).toContain("HELIX_LIVE_ANSWER_VISUAL_CAPTURE_ROUTE_STORAGE_KEY");
    expect(visualPreference).toContain("HELIX_LIVE_ANSWER_VISUAL_CAPTURE_ROUTE_SYNC_EVENT");
    expect(visualPreference).not.toContain("attachDisplayAudioSource");
    expect(visualPreference).not.toContain("postHelixAskAudioTranscriptChunk");
    expect(visualPreference).not.toContain("navigator.mediaDevices");

    for (const owner of Object.values(displayOwners)) {
      expect(owner).not.toContain("readHelixAskVisualCaptureAudioPreference");
      expect(owner).not.toContain("syncHelixAskVisualCaptureRoutePreference");
      expect(owner).not.toContain("HELIX_LIVE_ANSWER_VISUAL_CAPTURE_ROUTE_STORAGE_KEY");
      expect(owner).not.toContain("HELIX_LIVE_ANSWER_VISUAL_CAPTURE_ROUTE_SYNC_EVENT");
      expect(owner).not.toContain("helix.liveAnswer.visualCaptureRoutes.v1");
      expect(owner).not.toContain("helix:live-answer:visual-capture-routes");
    }
  });

  it("keeps auto-speak eligibility and terminal-preservation policy local while mode inference is recrowned", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const outputCleanup = read("client/src/lib/helix/ask-output-cleanup.ts");
    const explorationPolicy = read("client/src/lib/helix/ask-exploration-policy.ts");
    const voiceBrief = read("client/src/lib/helix/ask-voice-brief-policy.ts");
    const readAloud = read("client/src/lib/helix/ask-read-aloud-display.ts");
    const terminalProjection = read("client/src/lib/helix/ask-terminal-projection.ts");

    expect(pill).toContain("inferAskMode");
    expect(pill).not.toContain("export function inferAskMode");
    expect(explorationPolicy).toContain("export function inferAskMode");
    expect(map).toContain("Observe/act/verify mode inference is recrowned");

    for (const symbol of [
      "shouldAutoSpeakVoiceDecisionLifecycle",
      "shouldAutoSpeakAnswerForTurn",
      "shouldPreserveAuthoritativeTerminalOverEvidenceGate",
    ]) {
      expect(pill).toContain(`export function ${symbol}`);
      expect(map).toContain(symbol);
      for (const owner of [outputCleanup, voiceBrief, readAloud, terminalProjection]) {
        expect(owner).not.toContain(symbol);
      }
    }
    expect(map).toContain("auto-speak eligibility");
    expect(map).toContain("authoritative-terminal preservation");
  });

  it("keeps source-admission prompt classifiers recrowned and voice language policy recrowned", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const outputCleanup = read("client/src/lib/helix/ask-output-cleanup.ts");
    const docContext = read("client/src/lib/helix/ask-doc-viewer-context.ts");
    const attachmentPolicy = read("client/src/lib/helix/ask-attachment-prompt-policy.ts");
    const languagePolicy = read("client/src/lib/helix/ask-voice-language-policy.ts");
    const attachmentOwners = [outputCleanup, docContext];

    for (const symbol of [
      "isHelixAskVisualPrompt",
      "isHelixAskPastedTextResumeRecallPrompt",
      "isHelixAskUsePastedTextAttachmentPrompt",
    ]) {
      expect(pill).toContain(symbol);
      expect(map).toContain(symbol);
      expect(attachmentPolicy).toContain(`export function ${symbol}`);
      expect(pill).not.toContain(`const ${symbol} =`);
      for (const owner of attachmentOwners) {
        expect(owner).not.toContain(symbol);
      }
    }
    expect(pill).toContain('from "@/lib/helix/ask-attachment-prompt-policy"');
    expect(attachmentPolicy).not.toMatch(/from ["']react["']/);
    expect(attachmentPolicy).not.toContain("@/store/");
    expect(attachmentPolicy).not.toContain("@/components/helix/HelixAskPill");
    expect(attachmentPolicy).not.toContain("runAskTurn");
    expect(attachmentPolicy).not.toContain("fetch(");
    for (const symbol of [
      "normalizeVoiceLanguageTag",
      "resolveVoiceSourceLanguage",
      "resolveVoiceResponseLanguage",
    ]) {
      expect(pill).toContain(symbol);
      expect(map).toContain(symbol);
      expect(languagePolicy).toContain(symbol);
      expect(pill).not.toContain(`const ${symbol} =`);
      expect(outputCleanup).not.toContain(symbol);
      expect(docContext).not.toContain(symbol);
    }
    expect(map).toContain("source admission authority");
    expect(map).toContain("pasted-text recall admission");
    expect(map).toContain("high-risk translation-context detection");
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
      "decideHelixAskFormat",
    ]) {
      expect(outputCleanup).toContain(`export function ${symbol}`);
      expect(pill).not.toContain(`function ${symbol}`);
      expect(pill).not.toContain(`const ${symbol} =`);
    }
    expect(outputCleanup).toContain("export const HELIX_ASK_ANSWER_MARKER_SPLIT_RE");
    expect(pill).not.toContain("const HELIX_ASK_ANSWER_BOUNDARY_PREFIX_RE");
    expect(pill).not.toContain("const HELIX_ASK_ANSWER_MARKER_SPLIT_RE");
    for (const symbol of [
      "stripPromptEcho",
      "extractAnswerBlock",
      "stripEvidencePromptBlock",
    ]) {
      expect(outputCleanup).toContain(`export function ${symbol}`);
      expect(pill).not.toContain(`function ${symbol}`);
    }
    for (const bridgeUse of [
      "stripPromptEcho",
    ]) {
      expect(pill).toContain(bridgeUse);
    }
    expect(outputCleanup).not.toMatch(/from ["']react["']/);
    expect(outputCleanup).not.toContain("@/store/");
    expect(outputCleanup).not.toContain("@/components/helix/HelixAskPill");
    expect(outputCleanup).not.toContain("fetch(");
    expect(outputCleanup).not.toContain("navigator.clipboard");
    expect(outputCleanup).not.toContain("runAskTurn");
  });

  it("keeps deterministic AGIBOT preflight error classification in the non-React preflight owner", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const preflight = read("client/src/lib/helix/ask-agibot-preflight-error.ts");

    expect(map).toContain("ask-agibot-preflight-error.ts");
    expect(map).toContain("Deterministic AGIBOT desktop joint-scope preflight error classification");
    expect(pill).toContain('from "@/lib/helix/ask-agibot-preflight-error"');
    expect(preflight).toContain("export function isAgibotPreflightScopeError");
    expect(pill).not.toContain("const AGIBOT_PREFLIGHT_SCOPE_ERROR_RE");
    expect(pill).not.toContain("export function isAgibotPreflightScopeError");
    for (const localAnchor of [
      "askLocalWithPreflightScopeFallback",
      "askLocalWithMultilangFailOpenFallback",
      "askLocal",
      "AskLocalWithFallbackResult",
      "downgradedFromMode",
    ]) {
      expect(pill).toContain(localAnchor);
      expect(preflight).not.toContain(localAnchor);
    }
    for (const forbidden of [
      /from ["']react["']/,
      /@\/store\//,
      /@\/components\/helix\/HelixAskPill/,
      /fetch\(/,
      /navigator\.clipboard/,
      /document\./,
      /window\./,
      /runAskTurn/,
      /askLocal/,
    ]) {
      expect(preflight).not.toMatch(forbidden);
    }
  });

  it("keeps deterministic Ask-local fallback classification in the non-React fallback classifier owner", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const fallbackClassification = read("client/src/lib/helix/ask-local-fallback-classification.ts");

    expect(map).toContain("ask-local-fallback-classification.ts");
    expect(map).toContain("Deterministic Ask-local fallback response classification");
    expect(map).toContain("mission/ideology domain-leak detection");
    expect(pill).toContain('from "@/lib/helix/ask-local-fallback-classification"');
    expect(fallbackClassification).toContain("export function isMultilangConfidenceGateResponse");
    expect(fallbackClassification).toContain("export function isLikelyIdeologyDomainLeak");
    expect(pill).not.toContain("function isMultilangConfidenceGateResponse");
    expect(pill).not.toContain("function isLikelyIdeologyDomainLeak");
    for (const localAnchor of [
      "askLocalWithMultilangFailOpenFallback",
      "askLocalWithPreflightScopeFallback",
      "askLocal",
      "multilangConfirm",
      "bypassedMultilangGate",
    ]) {
      expect(pill).toContain(localAnchor);
      expect(fallbackClassification).not.toContain(localAnchor);
    }
    for (const forbidden of [
      /from ["']react["']/,
      /@\/store\//,
      /@\/components\/helix\/HelixAskPill/,
      /fetch\(/,
      /navigator\.clipboard/,
      /document\./,
      /window\./,
      /runAskTurn/,
      /askLocal\(/,
    ]) {
      expect(fallbackClassification).not.toMatch(forbidden);
    }
  });

  it("keeps deterministic docs-viewer path parsing in the non-React docs context owner", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const docsContext = read("client/src/lib/helix/ask-doc-viewer-context.ts");
    const workspaceSnapshot = read("client/src/lib/helix/ask-workspace-context-snapshot.ts");

    expect(map).toContain("ask-doc-viewer-context.ts");
    expect(map).toContain("ask-workspace-context-snapshot.ts");
    expect(map).toContain("HASK-BSQ-001 handoff behavior still needs parity proof");
    expect(pill).toContain('from "@/lib/helix/ask-doc-viewer-context"');
    for (const symbol of [
      "normalizeDocsViewerAnchorPath",
      "normalizeDocViewerPathForAskSnapshot",
      "resolveDocViewerSnapshotPathCandidate",
      "resolveDocsViewerAnchorPathCandidate",
      "extractExplicitDocsViewerPath",
      "normalizeDocPathForDebugCompare",
    ]) {
      expect(docsContext).toContain(`export function ${symbol}`);
      expect(pill).not.toContain(`function ${symbol}`);
    }
    expect(pill).toContain("resolveDocViewerSnapshotPathCandidate({");
    expect(pill).toContain("resolveDocsViewerAnchorPathCandidate({");
    expect(pill).not.toContain("HELIX_ACTIVE_DOC_VIEWER_ARTIFACT_CUE_RE");
    expect(map).toContain("Ask snapshot path source precedence");
    expect(map).toContain("docs-viewer debug snapshot projection");
    expect(map).toContain("current-doc/current-whitepaper/docs-viewer anchor-path cue resolution");
    expect(map).toContain("workstation layout debug snapshot projection");
    expect(map).toContain("Ask turn workspace context snapshot shaping");
    expect(map).toContain("last-known cache mutation");
    expect(workspaceSnapshot).toContain("export function buildWorkstationLayoutDebugSnapshotFromState");
    expect(docsContext).toContain("export function buildDocViewerDebugSnapshotFromState");
    expect(pill).toContain("buildDocViewerDebugSnapshotFromState(state, currentPath)");
    expect(pill).toContain("useDocViewerStore.getState()");
    expect(pill).toContain("rememberDocViewerPathForAskSnapshot(state.currentPath)");
    expect(pill).not.toContain("recentCount: Array.isArray(state.recent)");
    expect(workspaceSnapshot).toContain("export function buildAskTurnWorkspaceContextSnapshotFromState");
    expect(pill).toContain("buildWorkstationLayoutDebugSnapshotFromState(state)");
    expect(pill).toContain("buildAskTurnWorkspaceContextSnapshotFromState({");
    expect(pill).toContain("useWorkstationLayoutStore.getState()");
    expect(pill).toContain("useWorkstationNotesStore.getState()");
    expect(pill).toContain("useScientificCalculatorStore.getState()");
    expect(pill).toContain("useSituationRoomStore.getState()");
    expect(pill).toContain("Date.now()");
    for (const localAnchor of [
      "resolveAskTurnDocViewerSnapshotPath",
      "readDocViewerPathFromDesktopUrlForAskSnapshot",
      "rememberDocViewerPathForAskSnapshot",
      "resolveDocsViewerAnchorPathForQuestion",
    ]) {
      expect(pill).toContain(localAnchor);
      expect(map).toContain(localAnchor);
      expect(docsContext).not.toContain(localAnchor);
      expect(workspaceSnapshot).not.toContain(localAnchor);
    }
    expect(pill).toContain("function buildAskTurnWorkspaceContextSnapshot");
    expect(map).toContain("buildAskTurnWorkspaceContextSnapshot");
    expect(docsContext).not.toContain("buildAskTurnWorkspaceContextSnapshot");
    expect(workspaceSnapshot).not.toContain("function buildAskTurnWorkspaceContextSnapshot(");
    expect(workspaceSnapshot).not.toContain("@/store/");
    expect(workspaceSnapshot).not.toContain("useWorkstationLayoutStore");
    expect(workspaceSnapshot).not.toContain("useWorkstationNotesStore");
    expect(workspaceSnapshot).not.toContain("useScientificCalculatorStore");
    expect(workspaceSnapshot).not.toContain("useSituationRoomStore");
    expect(workspaceSnapshot).not.toContain("Date.now");
    expect(workspaceSnapshot).not.toContain("resolveAskTurnDocViewerSnapshotPath");
    expect(workspaceSnapshot).not.toContain("selectSituationRoomAskContextSnapshot");
    expect(docsContext).not.toMatch(/from ["']react["']/);
    expect(docsContext).not.toContain("@/store/");
    expect(docsContext).not.toContain("@/components/helix/HelixAskPill");
    expect(docsContext).not.toContain("fetch(");
    expect(docsContext).not.toContain("window.");
    expect(docsContext).not.toContain("localStorage");
    expect(docsContext).not.toContain("sessionStorage");
    expect(workspaceSnapshot).not.toMatch(/from ["']react["']/);
    expect(workspaceSnapshot).not.toContain("@/components/helix/HelixAskPill");
    expect(workspaceSnapshot).not.toContain("fetch(");
    expect(workspaceSnapshot).not.toContain("window.");
    expect(workspaceSnapshot).not.toContain("localStorage");
    expect(workspaceSnapshot).not.toContain("sessionStorage");
  });

  it("keeps Ask request construction and attachment admission local", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const docsContext = read("client/src/lib/helix/ask-doc-viewer-context.ts");
    const outputCleanup = read("client/src/lib/helix/ask-output-cleanup.ts");
    const terminalProjection = read("client/src/lib/helix/ask-terminal-projection.ts");
    const valueNormalization = read("client/src/lib/helix/ask-value-normalization.ts");
    const attachmentPolicy = read("client/src/lib/helix/ask-attachment-prompt-policy.ts");
    const visualEvidenceReaders = read("client/src/lib/helix/ask-visual-evidence-readers.ts");
    const attachmentCommit = read("client/src/components/helix/ask-console/HelixAskAttachmentCommit.ts");
    const textAttachment = read("client/src/components/helix/ask-console/HelixAskTextAttachment.ts");
    const backendEntrypointPolicy = read(
      "client/src/components/helix/ask-console/HelixAskBackendEntrypointPolicy.ts",
    );
    const requestDisplayOwners = [docsContext, outputCleanup, terminalProjection, valueNormalization];

    expect(map).toContain("Ask request construction and attachment admission");
    expect(map).toContain("deterministic backend-entrypoint family detection and hard route metadata");
    expect(map).toContain("request envelope, source admission authority");
    for (const symbol of [
      "buildHelixAskPastedTextResumeRecallRouteMetadata",
      "resolveHelixAskHardBackendEntrypointFamily",
      "buildHelixAskHardBackendEntrypointRouteMetadata",
      "buildQueuedAskTurn",
      "buildAskTurnWorkspaceContextSnapshot",
    ]) {
      expect(pill).toContain(symbol);
      expect(map).toContain(symbol);
      if (symbol === "buildHelixAskHardBackendEntrypointRouteMetadata") {
        expect(backendEntrypointPolicy).toContain(`export function ${symbol}`);
      }
      for (const owner of requestDisplayOwners) {
        expect(owner).not.toContain(symbol);
      }
    }
    for (const symbol of [
      "validateHelixAskAttachmentForSubmit",
      "validateHelixAskImageAttachmentForSubmit",
    ]) {
      expect(pill).toContain(symbol);
      expect(map).toContain(symbol);
      expect(attachmentCommit).toContain(`export function ${symbol}`);
      expect(pill).not.toContain(`function ${symbol}`);
      for (const owner of requestDisplayOwners) {
        expect(owner).not.toContain(symbol);
      }
    }
    expect(map).toContain("validateHelixAskTextAttachmentForSubmit");
    expect(attachmentCommit).toContain("export function validateHelixAskTextAttachmentForSubmit");
    expect(pill).not.toContain("function validateHelixAskTextAttachmentForSubmit");
    expect(pill).toContain('from "@/components/helix/ask-console/HelixAskAttachmentCommit"');
    expect(map).toContain("HelixAskAttachmentCommit.ts");
    expect(map).toContain("attachment commit validation");
    expect(attachmentCommit).toContain("export type HelixAskImageAttachment");
    expect(attachmentCommit).toContain("export type HelixAskAttachment");
    expect(attachmentCommit).not.toMatch(/from ["']react["']/);
    expect(attachmentCommit).not.toContain("@/store/");
    expect(attachmentCommit).not.toContain("@/components/helix/HelixAskPill");
    expect(attachmentCommit).not.toContain("buildQueuedAskTurn");
    expect(attachmentCommit).not.toContain("runAskTurn");
    expect(attachmentCommit).not.toContain("fetch(");
    expect(attachmentCommit).not.toContain("source_target_intent");
    expect(attachmentCommit).not.toContain("visualSituationEvidenceForTurn");
    for (const symbol of ["readVisualEvidenceSummary", "isDiagnosticVisualEvidence"]) {
      expect(pill).toContain(symbol);
      expect(map).toContain(symbol);
      expect(visualEvidenceReaders).toContain(`export function ${symbol}`);
      expect(pill).not.toContain(`function ${symbol}`);
      for (const owner of requestDisplayOwners) {
        expect(owner).not.toContain(symbol);
      }
    }
    expect(pill).toContain('from "@/lib/helix/ask-visual-evidence-readers"');
    expect(visualEvidenceReaders).not.toMatch(/from ["']react["']/);
    expect(visualEvidenceReaders).not.toContain("@/store/");
    expect(visualEvidenceReaders).not.toContain("@/components/helix/HelixAskPill");
    expect(visualEvidenceReaders).not.toContain("validateHelixAskAttachmentForSubmit");
    expect(visualEvidenceReaders).not.toContain("buildQueuedAskTurn");
    expect(visualEvidenceReaders).not.toContain("runAskTurn");
    expect(visualEvidenceReaders).not.toContain("fetch(");
    expect(map).toContain("ask-visual-evidence-readers.ts");
    expect(map).toContain("diagnostic vision-provider summary");
    for (const symbol of [
      "isHelixAskVisualPrompt",
      "isHelixAskPastedTextResumeRecallPrompt",
      "isHelixAskUsePastedTextAttachmentPrompt",
    ]) {
      expect(pill).toContain(symbol);
      expect(map).toContain(symbol);
      expect(attachmentPolicy).toContain(`export function ${symbol}`);
      expect(pill).not.toContain(`const ${symbol} =`);
      for (const owner of requestDisplayOwners) {
        expect(owner).not.toContain(symbol);
      }
    }
    for (const symbol of [
      "base64FromText",
      "sha256TextHex",
      "buildHelixAskTextAttachmentFromText",
      "buildHelixAskTextAttachmentTurnInputItem",
    ]) {
      const functionPrefix =
        symbol === "sha256TextHex" || symbol === "buildHelixAskTextAttachmentFromText"
          ? "export async function"
          : "export function";
      expect(textAttachment).toContain(`${functionPrefix} ${symbol}`);
      expect(pill).not.toContain(`function ${symbol}`);
      expect(map).toContain(symbol);
    }
    expect(pill).toContain("buildHelixAskTextAttachmentFromText(text)");
    expect(pill).toContain("buildHelixAskTextAttachmentTurnInputItem(attachment)");
    expect(textAttachment).toContain("HELIX_ASK_TEXT_ATTACHMENT_MAX_BYTES");
    expect(textAttachment).toContain("HELIX_ASK_TEXT_ATTACHMENT_PREVIEW_CHARS");
    expect(textAttachment).not.toContain("validateHelixAskAttachmentForSubmit");
    expect(textAttachment).not.toContain("validateHelixAskImageAttachmentForSubmit");
    expect(textAttachment).not.toContain("validateHelixAskTextAttachmentForSubmit");
    expect(textAttachment).not.toContain("buildQueuedAskTurn");
    expect(textAttachment).not.toContain("runAskTurn");
    expect(textAttachment).not.toContain("fetch(");
    expect(attachmentPolicy).toContain("HELIX_ASK_VISUAL_SURFACE_PROMPT_PATTERN");
    expect(attachmentPolicy).toContain("HELIX_ASK_USE_PASTED_TEXT_ATTACHMENT_PROMPT_PATTERN");
    expect(pill).not.toContain("const HELIX_ASK_VISUAL_SURFACE_PROMPT_PATTERN");
    expect(pill).not.toContain("const HELIX_ASK_USE_PASTED_TEXT_ATTACHMENT_PROMPT_PATTERN");
    expect(pill).toContain("source_target_intent");
    expect(pill).toContain("visualSituationEvidenceForTurn");
    expect(pill).toContain("validateHelixAskAttachmentForSubmit(attachment)");
    expect(map).toContain("text turn-input item shaping");
    for (const owner of requestDisplayOwners) {
      expect(owner).not.toContain("HELIX_ASK_VISUAL_SURFACE_PROMPT_PATTERN");
      expect(owner).not.toContain("HELIX_ASK_USE_PASTED_TEXT_ATTACHMENT_PROMPT_PATTERN");
      expect(owner).not.toContain("visualSituationEvidenceForTurn");
    }
  });

  it("keeps reply-scoped debug export envelope and clipboard authority helpers local", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const debugExport = read("client/src/lib/agi/debugExport.ts");

    for (const localSymbol of [
      "buildReplyMasterEventClockExport",
      "extractHelixRenderedTurnDebugFromButton",
      "debugPayloadMatchesRenderedReply",
      "debugPayloadMatchesRenderedTurnPayload",
      "normalizeReplyMasterDebugPayload",
      "buildClientProjectionDebugFields",
      "copyHelixRailCriticalDebugFieldsForUi",
      "boundHelixDebugExportTextForUi",
      "buildReplyScopedDebugExportFromRenderedReply",
      "buildReplyScopedDebugExportFromRenderedButton",
      "resolveAuthoritativeDebugExportPayload",
      "copyDebugPayloadToClipboard",
    ]) {
      expect(pill).toContain(localSymbol);
      expect(map).toContain(localSymbol);
      expect(debugExport).not.toContain(localSymbol);
    }
    const controls = read("client/src/components/helix/ask-console/HelixAskLegacyTurnControls.ts");
    for (const recrownedSymbol of [
      "isHelixAskLegacyBackendDebugExportEligibleTurnId",
      "resolveHelixAskLegacyDebugExportBackendTarget",
    ]) {
      expect(pill).toContain(recrownedSymbol);
      expect(controls).toContain(`export function ${recrownedSymbol}`);
      expect(map).toContain(recrownedSymbol);
      expect(debugExport).not.toContain(recrownedSymbol);
    }
    expect(pill).not.toContain("const hashDebugExportText =");
    expect(pill).toContain("hashDebugExportText");
    expect(pill).toContain("buildHelixAskDebugDrawerCopyProjection");
    expect(pill).toContain("type HelixAskDebugExportDrawerState");
    expect(debugExport).toContain("export const hashDebugExportText");
    const drawerState = read("client/src/components/helix/ask-console/HelixAskDebugDrawerState.ts");
    expect(drawerState).toContain("type DebugExportUiResult");
    expect(drawerState).toContain("buildDebugExportDrawerFallbackResult");
    expect(drawerState).toContain("export function buildHelixAskDebugDrawerCopyProjection");
    expect(map).toContain("deterministic debug payload hashing");
    expect(map).toContain("copy-result-to-drawer-state projection");
    expect(map).toContain("Backend Ask turn debug-ref eligibility");
    expect(map).toContain("backend-target selection");
    expect(pill).toContain("buildHelixDebugExportEnvelopeFromMasterPayload");
    expect(debugExport).toContain("buildHelixDebugExportEnvelopeFromMasterPayload");
    expect(map).toContain("buildHelixDebugExportEnvelopeFromMasterPayload");
    expect(map).toContain("rendered-button turn matching");
    expect(map).toContain("final-answer copy text selection");
  });

  it("keeps rendered-button debug copy scoped to the matched reply turn only", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const normalizedPill = pill.replace(/\r\n/g, "\n");

    expect(pill).toContain("const renderedMatchesReply =");
    expect(pill).toContain("debug: renderedMatchesReply ? reply.debug ?? null : null");
    expect(pill).toContain("active_turn_id: renderedMatchesReply ? activeTurnId : null");
    expect(pill).toContain("const activeTurnId = resolveHelixAskReplyDebugTurnId(reply)");
    expect(pill).toContain(
      "debug_export_ref: renderedMatchesReply ? replyRecord.debug_export_ref ?? replyDebugRecord?.debug_export_ref ?? null : null",
    );
    expect(normalizedPill).toContain(
      "backend_debug_response_ref: renderedMatchesReply\n      ? replyRecord.backend_debug_response_ref ?? replyDebugRecord?.backend_debug_response_ref ?? null\n      : null",
    );
    expect(normalizedPill).toContain(
      "const providedPayloadMatchesRenderedTurn =\n          hasProvidedPayload && debugPayloadMatchesRenderedTurnPayload(payload, sourceElement)",
    );
    expect(pill).toContain("selectHelixAskLegacyDebugCopyLocalPayload");
    expect(pill).toContain("buildReplyScopedDebugExportFromRenderedButton(");
    expect(pill).toContain("resolveAuthoritativeDebugExportPayload(localExportPayload)");
    const controls = read("client/src/components/helix/ask-console/HelixAskLegacyTurnControls.ts");
    expect(controls).toContain("selectHelixAskLegacyDebugCopyLocalPayload");
    expect(controls).not.toContain("buildReplyScopedDebugExportFromRenderedButton");
    expect(controls).not.toContain("resolveAuthoritativeDebugExportPayload");
    expect(controls).not.toContain("copyDebugPayloadToClipboard");
  });

  it("keeps agent runtime provider display helpers in the non-React runtime display module", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const runtimeDisplay = read("client/src/lib/helix/ask-agent-runtime-display.ts");
    const runtimePreference = read("client/src/components/helix/ask-console/HelixAskRuntimePreference.ts");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");

    expect(pill).toContain('from "@/lib/helix/ask-agent-runtime-display"');
    expect(pill).toContain('from "@/components/helix/ask-console/HelixAskRuntimePreference"');
    expect(map).toContain("Agent runtime/provider controller wiring");
    expect(map).toContain("Runtime preference storage is recrowned in `ask-console/`");
    expect(map).toContain("backend provider fetch transport, selected runtime state");
    expect(map).toContain("request payload wiring stay local");
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
    for (const preferenceAnchor of [
      "readStoredHelixAskAgentRuntime",
      "persistHelixAskAgentRuntime",
      "HELIX_ASK_AGENT_RUNTIME_STORAGE_KEY",
    ]) {
      expect(runtimePreference).toContain(preferenceAnchor);
      expect(runtimeDisplay).not.toContain(preferenceAnchor);
    }
    for (const localAnchor of [
      "agentRuntimeMenuOpen",
      "agentRuntimeProviders",
      "selectedAgentRuntime",
      "agentRuntimePickerModel",
      "HelixAskRuntimePicker",
      "handleAgentRuntimeSelect",
      "fetch(\"/api/agi/agent-providers\"",
      "setAgentRuntimeProviders",
      "setSelectedAgentRuntime",
      "handleAgentRuntimeButtonClick",
      "agentRuntime: selectedAgentRuntime",
    ]) {
      expect(pill).toContain(localAnchor);
      expect(runtimeDisplay).not.toContain(localAnchor);
      expect(runtimePreference).not.toContain(localAnchor);
    }
    expect(pill).not.toContain("const HELIX_ASK_AGENT_RUNTIME_STORAGE_KEY");
    expect(pill).not.toContain("function readStoredHelixAskAgentRuntime");
    expect(pill).not.toContain("function persistHelixAskAgentRuntime");
    expect(runtimeDisplay).not.toMatch(/from ["']react["']/);
    expect(runtimeDisplay).not.toContain("@/store/");
    expect(runtimeDisplay).not.toContain("@/components/helix/HelixAskPill");
    expect(runtimeDisplay).not.toContain("fetch(");
    expect(runtimeDisplay).not.toContain("localStorage");
    expect(runtimeDisplay).not.toContain("navigator.clipboard");
    expect(runtimeDisplay).not.toContain("speakVoice");
    expect(runtimeDisplay).not.toContain("runAskTurn");
    expect(runtimePreference).not.toMatch(/from ["']react["']/);
    expect(runtimePreference).not.toContain("@/store/");
    expect(runtimePreference).not.toContain("@/components/helix/HelixAskPill");
    expect(runtimePreference).not.toContain("fetch(");
    expect(runtimePreference).not.toContain("navigator.clipboard");
    expect(runtimePreference).not.toContain("speakVoice");
    expect(runtimePreference).not.toContain("runAskTurn");
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
      "askLiveEventBelongsToActiveTurn",
      "filterHelixAskActiveTurnStreamRows",
    ]) {
      expect(pill).not.toContain(`export function ${symbol}`);
      expect(activeStream).toContain(`export function ${symbol}`);
    }
    expect(pill).toContain("export function shouldRenderHelixAskActiveTurnStream");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    expect(map).toContain("Procedural timeline JSX rendering");
    expect(map).toContain("renderProceduralTurnTimeline");
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

  it("keeps Stage Play wake admission and generated projection suppression local", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const chatProjection = read("client/src/components/helix/ask-console/HelixAskChatProjection.ts");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const mailboxWakePolicy = read("client/src/lib/helix/ask-stage-play-mailbox-wake-policy.ts");
    const ledger = read("client/src/lib/helix/ask-stage-play-ledger.ts");
    const liveSourceDisplay = read("client/src/lib/helix/ask-live-source-display.ts");
    const turnTranscript = read("client/src/lib/helix/ask-turn-transcript.ts");

    expect(map).toContain("Stage Play generated wake admission and projection suppression");
    expect(map).toContain("Deterministic compact wake prompt and route-metadata admission predicates");
    expect(map).toContain("Generated durable-chat projection suppression is recrowned");
    for (const symbol of [
      "isStagePlayMailboxWakePromptText",
      "hasStagePlayMailboxWakeRouteMetadata",
      "shouldBlockStagePlayMailboxWakePromptWithoutRouteMetadata",
    ]) {
      expect(pill).toContain(symbol);
      expect(pill).not.toContain(`function ${symbol}`);
      expect(mailboxWakePolicy).toContain(`export function ${symbol}`);
      expect(map).toContain(symbol);
      expect(ledger).not.toContain(symbol);
      expect(liveSourceDisplay).not.toContain(symbol);
      expect(turnTranscript).not.toContain(symbol);
    }
    expect(mailboxWakePolicy).not.toMatch(/from ["']react["']/);
    expect(mailboxWakePolicy).not.toContain("@/store/");
    expect(mailboxWakePolicy).not.toContain("@/components/helix/HelixAskPill");
    expect(mailboxWakePolicy).not.toContain("runAskTurn");
    expect(mailboxWakePolicy).not.toContain("fetch(");
    for (const symbol of [
      "isGeneratedStagePlayMailWakePrompt",
      "isGeneratedStagePlayMailWakeAssistantProjection",
      "shouldSuppressGeneratedStagePlayMailWakeChatProjection",
    ]) {
      expect(chatProjection).toContain(symbol);
      expect(map).toContain(symbol);
      expect(ledger).not.toContain(symbol);
      expect(liveSourceDisplay).not.toContain(symbol);
      expect(turnTranscript).not.toContain(symbol);
    }
    expect(chatProjection).toContain("STAGE_PLAY_MAIL_WAKE_PROMPT_PATTERNS");
    expect(chatProjection).toContain("STAGE_PLAY_MAIL_WAKE_ASSISTANT_PATTERNS");
    expect(pill).not.toContain("STAGE_PLAY_MAIL_WAKE_PROMPT_PATTERNS");
    expect(ledger).not.toContain("STAGE_PLAY_MAIL_WAKE_PROMPT_PATTERNS");
    expect(liveSourceDisplay).not.toContain("STAGE_PLAY_MAIL_WAKE_PROMPT_PATTERNS");
    expect(turnTranscript).not.toContain("STAGE_PLAY_MAIL_WAKE_PROMPT_PATTERNS");
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

  it("keeps visible terminal and route authority local while transcript projection stays crowned", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const terminalProjection = read("client/src/lib/helix/ask-terminal-projection.ts");
    const transcript = read("client/src/lib/helix/ask-turn-transcript.ts");
    const debugDisplay = read("client/src/lib/helix/ask-debug-event-display.ts");

    expect(map).toContain("Visible terminal and route authority");
    expect(map).toContain("Runtime transcript event projection is crowned in `ask-turn-transcript.ts`");
    for (const symbol of [
      "shouldPreserveAuthoritativeTerminalOverEvidenceGate",
      "resolveHelixAskVisibleTerminal",
      "resolveHelixAskHardPromptProjectionGuard",
      "requiresHelixAskBackendEntrypoint",
    ]) {
      expect(pill).toContain(symbol);
      expect(map).toContain(symbol);
      for (const owner of [terminalProjection, transcript, debugDisplay]) {
        expect(owner).not.toContain(symbol);
      }
    }
    expect(pill).not.toContain("function buildHelixRuntimeAskLiveEvents");
    expect(transcript).toContain("export function buildHelixRuntimeAskLiveEvents");
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
      "resolveHelixDispatchPolicyAtTurnStart",
      "hasExplicitWorkspaceThenReasoningCue",
      "hasExplicitReasoningOnlyCue",
      "isSimpleConversationTurnCandidate",
      "stripQuotedPayloadsForEvidenceGate",
      "isQuotedTransformOnlyForEvidenceGate",
      "resolveTranscriptConfirmPolicy",
      "buildQueuedAskTurn",
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
    expect(map).toContain("behavior-sensitive");
    expect(map).toContain("simple-conversation bypass");
    expect(map).toContain("quoted-payload evidence-gate exceptions");
    expect(map).toContain("backend Ask is authoritative");
  });

  it("keeps context compaction resume-frame handoff quarantined in HelixAskPill", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const resumeFrameStorage = read(
      "client/src/components/helix/ask-console/HelixAskContextCompactionResumeFrameStorage.ts",
    );
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const docViewerContext = read("client/src/lib/helix/ask-doc-viewer-context.ts");
    const debugDisplay = read("client/src/lib/helix/ask-debug-event-display.ts");
    const terminalProjection = read("client/src/lib/helix/ask-terminal-projection.ts");
    const valueNormalization = read("client/src/lib/helix/ask-value-normalization.ts");
    const contextCapsuleLedger = read("client/src/lib/helix/ask-context-capsule-ledger.ts");
    const displayOwners = [
      docViewerContext,
      debugDisplay,
      terminalProjection,
      valueNormalization,
      contextCapsuleLedger,
    ];

    expect(map).toContain("Context compaction resume-frame handoff");
    expect(map).toContain("Deterministic pause text parsing, pause-pending reply classification");
    expect(map).toContain("request metadata handoff");
    for (const symbol of [
      "isHelixAskContextCompactionPauseText",
      "isHelixAskContextCompactionPausePendingReply",
      "extractHelixAskContextCompactionResumeFrame",
      "extractLatestHelixAskContextCompactionResumeFrameFromReplies",
    ]) {
      expect(pill).toContain(symbol);
      expect(resumeFrameStorage).toContain(symbol);
      expect(map).toContain(symbol);
      for (const owner of displayOwners) {
        expect(owner).not.toContain(symbol);
      }
    }
    expect(pill).not.toContain("function isHelixAskContextCompactionPauseText");
    expect(pill).not.toContain("function isHelixAskContextCompactionPausePendingReply");
    expect(pill).not.toContain("function extractHelixAskContextCompactionResumeFrame");
    expect(pill).not.toContain("function extractLatestHelixAskContextCompactionResumeFrameFromReplies");
    for (const storageSymbol of [
      "HELIX_ASK_CONTEXT_RESUME_FRAME_STORAGE_KEY",
      "readStoredHelixAskContextCompactionResumeFrame",
      "writeStoredHelixAskContextCompactionResumeFrame",
    ]) {
      expect(resumeFrameStorage).toContain(storageSymbol);
      expect(map).toContain(storageSymbol);
    }
    expect(pill).toContain("readStoredHelixAskContextCompactionResumeFrame()");
    expect(pill).toContain("writeStoredHelixAskContextCompactionResumeFrame(");
    expect(pill).not.toContain("function readStoredHelixAskContextCompactionResumeFrame");
    expect(pill).not.toContain("function writeStoredHelixAskContextCompactionResumeFrame");
    expect(pill).not.toContain("const HELIX_ASK_CONTEXT_RESUME_FRAME_STORAGE_KEY");
    expect(resumeFrameStorage).toContain("window.sessionStorage");
    expect(pill).toContain("context_resume_frame: args.contextResumeFrame");
    for (const owner of displayOwners) {
      expect(owner).not.toContain("context_resume_frame");
      expect(owner).not.toContain("sessionStorage");
      expect(owner).not.toContain("HELIX_ASK_CONTEXT_RESUME_FRAME_STORAGE_KEY");
    }
    expect(map).toContain("Generated durable-chat projection suppression is recrowned");
  });

  it("documents deterministic voice continuation and intent-shift policy as recrowned lexical behavior", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const lexical = read("client/src/lib/helix/ask-voice-continuation-lexical.ts");
    const valueNormalization = read("client/src/lib/helix/ask-value-normalization.ts");
    const voiceCopy = read("client/src/lib/helix/ask-voice-copy-display.ts");
    const voiceText = read("client/src/lib/helix/ask-voice-text-display.ts");

    for (const anchor of [
      "shouldMergeVoiceContinuationTurn",
      "shouldMergeVoiceContinuationInFlight",
      "shouldRestartExplorationLadderOnSupersede",
      "isLikelyContinuationAddendum",
      "isLikelyContinuationTailFragment",
    ]) {
      expect(lexical).toContain(`export function ${anchor}`);
      expect(pill).not.toContain(`export function ${anchor}`);
      expect(pill).not.toContain(`function ${anchor}`);
      expect(map).toContain(anchor);
      expect(valueNormalization).not.toContain(anchor);
      expect(voiceCopy).not.toContain(anchor);
      expect(voiceText).not.toContain(anchor);
    }
    expect(map).toContain("Latest-turn continuation semantics");
    expect(map).toContain("voice intent arbitration");
  });

  it("keeps deterministic voice suppression rescue policy in the non-React suppression owner", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const voiceCopy = read("client/src/lib/helix/ask-voice-copy-display.ts");
    const voiceText = read("client/src/lib/helix/ask-voice-text-display.ts");
    const voiceScoring = read("client/src/lib/helix/ask-voice-turn-scoring.ts");
    const voiceLexical = read("client/src/lib/helix/ask-voice-continuation-lexical.ts");
    const voiceSuppression = read("client/src/lib/helix/ask-voice-dispatch-suppression.ts");
    const voiceReasoningPrompt = read("client/src/lib/helix/ask-voice-reasoning-dispatch-prompt.ts");
    const observerCommentary = read("client/src/lib/helix/ask-observer-commentary-display.ts");
    const valueNormalization = read("client/src/lib/helix/ask-value-normalization.ts");
    const extractedOwners = [
      voiceCopy,
      voiceText,
      voiceScoring,
      voiceLexical,
      voiceSuppression,
      voiceReasoningPrompt,
      observerCommentary,
      valueNormalization,
    ];

    expect(map).toContain("Voice reasoning dispatch and suppression rescue policy");
    expect(map).toContain("ask-voice-dispatch-suppression.ts");
    expect(map).toContain("ask-voice-reasoning-dispatch-prompt.ts");
    expect(map).toContain("reasoning-dispatch lexical admission");
    expect(map).toContain("observer dispatch-plan derivation");
    expect(map).toContain("Workspace dispatch, reasoning queue mutation, request submission, and in-flight voice lifecycle");
    for (const symbol of [
      "shouldDispatchReasoningAttempt",
      "inferSuppressionCauseFromRouteReason",
      "shouldForceObserveDispatchFromSuppression",
      "resolveSuppressedDispatchRescueTranscript",
      "isStrongQuestionDispatchCandidate",
      "deriveVoiceTimelineSuppressionMeta",
    ]) {
      expect(voiceSuppression).toContain(`export function ${symbol}`);
      expect(pill).not.toContain(`export function ${symbol}`);
      expect(pill).not.toContain(`function ${symbol}`);
      expect(map).toContain(symbol);
      for (const owner of [voiceCopy, voiceText, voiceScoring, voiceLexical, observerCommentary, valueNormalization]) {
        expect(owner).not.toContain(symbol);
      }
    }
    for (const symbol of [
      "isLikelyContextDependentTurn",
      "extractPriorUserContext",
      "buildVoiceReasoningDispatchPrompt",
      "isSimpleDirectPromptLaneCandidate",
      "isSimpleTitleOrPathOnlyPrompt",
      "shouldQueueWorkspaceBackgroundReasoning",
      "normalizeConversationModeForDispatch",
      "deriveObserverDispatchPlan",
    ]) {
      expect(voiceReasoningPrompt).toContain(`export function ${symbol}`);
      expect(pill).not.toContain(`function ${symbol}`);
      expect(map).toContain(symbol);
      for (const owner of [voiceCopy, voiceText, voiceScoring, voiceLexical, voiceSuppression, observerCommentary, valueNormalization]) {
        expect(owner).not.toContain(symbol);
      }
    }
    for (const localAnchor of [
      "forceReasoningAfterWorkstation",
    ]) {
      expect(pill).toContain(localAnchor);
      for (const owner of extractedOwners) {
        expect(owner).not.toContain(localAnchor);
      }
    }
    expect(map).toContain("document quick-lane detection");
    expect(map).toContain("background workspace reasoning queue predicate");
    expect(map).toContain("dispatch-mode normalization");
    expect(voiceSuppression).not.toMatch(/from ["']react["']/);
    expect(voiceSuppression).not.toContain("@/store/");
    expect(voiceSuppression).not.toContain("@/components/helix/HelixAskPill");
    expect(voiceSuppression).not.toContain("runAskTurn");
    expect(voiceSuppression).not.toContain("speakVoice");
    expect(voiceReasoningPrompt).not.toMatch(/from ["']react["']/);
    expect(voiceReasoningPrompt).not.toContain("@/store/");
    expect(voiceReasoningPrompt).not.toContain("@/components/helix/HelixAskPill");
    expect(voiceReasoningPrompt).not.toContain("runAskTurn");
    expect(voiceReasoningPrompt).not.toContain("speakVoice");
  });

  it("keeps deterministic voice continuation lexical predicates in the non-React lexical owner", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const lexical = read("client/src/lib/helix/ask-voice-continuation-lexical.ts");
    const heldTranscriptPolicy = read("client/src/lib/helix/ask-voice-held-transcript-policy.ts");
    const voiceCopy = read("client/src/lib/helix/ask-voice-copy-display.ts");
    const voiceText = read("client/src/lib/helix/ask-voice-text-display.ts");

    expect(map).toContain("ask-voice-continuation-lexical.ts");
    expect(map).toContain("ask-voice-held-transcript-policy.ts");
    expect(map).toContain("transcript lifecycle, queue mutation, active-turn cancellation, and request dispatch remain behavior-sensitive");
    expect(pill).toContain('from "@/lib/helix/ask-voice-continuation-lexical"');
    expect(pill).toContain('from "@/lib/helix/ask-voice-held-transcript-policy"');
    for (const symbol of [
      "extractIntentTerms",
      "hasDanglingTurnTail",
      "isLowInformationTailTranscript",
      "extractLatestContinuationQuestionFocus",
      "hasSufficientLexicalCarryover",
      "isLikelyNearTurnContinuation",
      "shouldMergeVoiceContinuationTurn",
      "shouldMergeVoiceContinuationInFlight",
      "shouldRestartExplorationLadderOnSupersede",
      "isLikelyContinuationAddendum",
      "isLikelyContinuationTailFragment",
    ]) {
      expect(lexical).toContain(`export function ${symbol}`);
      expect(pill).not.toContain(`function ${symbol}`);
      expect(voiceCopy).not.toContain(symbol);
      expect(voiceText).not.toContain(symbol);
    }
    for (const symbol of [
      "shouldMergePendingConfirmationTranscript",
      "shouldRecoverHeldTranscriptAfterNoTranscript",
      "shouldFlushHeldTranscriptFromWatchdog",
    ]) {
      expect(heldTranscriptPolicy).toContain(`export function ${symbol}`);
      expect(pill).not.toContain(`function ${symbol}`);
      expect(lexical).not.toContain(symbol);
      expect(voiceCopy).not.toContain(symbol);
      expect(voiceText).not.toContain(symbol);
    }
    for (const localAnchor of [
      "voiceTranscribeQueueRef",
      "voiceConfirmedTurnQueueRef",
    ]) {
      expect(pill).toContain(localAnchor);
      expect(lexical).not.toContain(localAnchor);
      expect(heldTranscriptPolicy).not.toContain(localAnchor);
    }
    expect(lexical).not.toMatch(/from ["']react["']/);
    expect(lexical).not.toContain("@/store/");
    expect(lexical).not.toContain("@/components/helix/HelixAskPill");
    expect(lexical).not.toContain("fetch(");
    expect(lexical).not.toContain("navigator.clipboard");
    expect(lexical).not.toContain("runAskTurn");
    expect(lexical).not.toContain("speakVoice");
    expect(heldTranscriptPolicy).not.toMatch(/from ["']react["']/);
    expect(heldTranscriptPolicy).not.toContain("@/store/");
    expect(heldTranscriptPolicy).not.toContain("@/components/helix/HelixAskPill");
    expect(heldTranscriptPolicy).not.toContain("fetch(");
    expect(heldTranscriptPolicy).not.toContain("navigator.clipboard");
    expect(heldTranscriptPolicy).not.toContain("runAskTurn");
    expect(heldTranscriptPolicy).not.toContain("speakVoice");
  });

  it("keeps deterministic voice turn scoring in the non-React turn scoring owner", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const scoring = read("client/src/lib/helix/ask-voice-turn-scoring.ts");
    const lexical = read("client/src/lib/helix/ask-voice-continuation-lexical.ts");

    expect(map).toContain("ask-voice-turn-scoring.ts");
    expect(map).toContain("Deterministic voice conversation completion");
    expect(pill).toContain('from "@/lib/helix/ask-voice-turn-scoring"');
    for (const symbol of [
      "scoreConversationCompletion",
      "scoreVoiceTurnComplete",
      "scoreIntentShift",
    ]) {
      expect(scoring).toContain(`export function ${symbol}`);
      expect(pill).not.toContain(`function ${symbol}`);
      expect(lexical).not.toContain(symbol);
    }
    for (const localAnchor of [
      "voiceTranscribeQueueRef",
      "voiceConfirmedTurnQueueRef",
    ]) {
      expect(pill).toContain(localAnchor);
      expect(scoring).not.toContain(localAnchor);
    }
    expect(scoring).not.toMatch(/from ["']react["']/);
    expect(scoring).not.toContain("@/store/");
    expect(scoring).not.toContain("@/components/helix/HelixAskPill");
    expect(scoring).not.toContain("fetch(");
    expect(scoring).not.toContain("AudioContext");
    expect(scoring).not.toContain("speakVoice");
  });

  it("documents voice language policy as recrowned while workstation fast-path execution stays local", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const languagePolicy = read("client/src/lib/helix/ask-voice-language-policy.ts");
    const workstationFastPath = read("client/src/lib/helix/ask-workstation-fast-path.ts");
    const procedural = read("client/src/lib/helix/ask-procedural-display.ts");
    const voiceCopy = read("client/src/lib/helix/ask-voice-copy-display.ts");
    const valueNormalization = read("client/src/lib/helix/ask-value-normalization.ts");

    for (const anchor of [
      "normalizeVoiceLanguageTag",
      "isEnglishLikeLanguageTag",
      "inferLanguageTagFromSourceText",
      "resolveVoiceSourceLanguage",
      "resolveVoiceResponseLanguage",
      "isHighRiskTranslationContext",
    ]) {
      expect(pill).toContain(anchor);
      expect(pill).not.toContain(`const ${anchor} =`);
      expect(pill).not.toContain(`function ${anchor}`);
      expect(languagePolicy).toContain(anchor);
      expect(map).toContain(anchor);
      expect(procedural).not.toContain(anchor);
      expect(voiceCopy).not.toContain(anchor);
      expect(valueNormalization).not.toContain(anchor);
    }
    for (const anchor of [
      "readWorkstationActionArgText",
      "extractCalculatorFastPathExpressionFromPrompt",
      "selectWorkstationFastPathReplyAction",
    ]) {
      expect(pill).toContain(anchor);
      expect(pill).not.toContain(`const ${anchor} =`);
      expect(pill).not.toContain(`function ${anchor}`);
      expect(workstationFastPath).toContain(`export function ${anchor}`);
      expect(map).toContain(anchor);
      expect(procedural).not.toContain(anchor);
      expect(voiceCopy).not.toContain(anchor);
      expect(valueNormalization).not.toContain(anchor);
      expect(languagePolicy).not.toContain(anchor);
    }
    for (const anchor of [
      "getWorkstationFastPathReplyText",
      "renderCalculatorFastPathReply",
    ]) {
      expect(pill).toContain(`const ${anchor}`);
      expect(workstationFastPath).not.toContain(anchor);
      expect(map).toContain(anchor);
      expect(procedural).not.toContain(anchor);
      expect(voiceCopy).not.toContain(anchor);
      expect(valueNormalization).not.toContain(anchor);
      expect(languagePolicy).not.toContain(anchor);
    }
    expect(pill).toContain('from "@/lib/helix/ask-voice-language-policy"');
    expect(pill).toContain('from "@/lib/helix/ask-workstation-fast-path"');
    expect(pill).toContain("runScientificSolve");
    expect(procedural).not.toContain("runScientificSolve");
    expect(languagePolicy).not.toMatch(/from ["']react["']/);
    expect(languagePolicy).not.toContain("@/store/");
    expect(languagePolicy).not.toContain("@/components/helix/HelixAskPill");
    expect(languagePolicy).not.toContain("runScientificSolve");
    expect(languagePolicy).not.toContain("fetch(");
    expect(workstationFastPath).not.toMatch(/from ["']react["']/);
    expect(workstationFastPath).not.toContain("@/store/");
    expect(workstationFastPath).not.toContain("@/components/helix/HelixAskPill");
    expect(workstationFastPath).not.toContain("runScientificSolve");
    expect(workstationFastPath).not.toContain("getWorkstationExecutedReplyText");
    expect(workstationFastPath).not.toContain("dispatchHelixWorkstationAction");
    expect(workstationFastPath).not.toContain("fetch(");
    expect(map).toContain("ask-voice-language-policy.ts");
    expect(map).toContain("ask-workstation-fast-path.ts");
    expect(map).toContain("Deterministic language normalization");
    expect(map).toContain("lightweight script-based language inference");
    expect(map).toContain("workstation arg reading");
    expect(map).toContain("docs-viewer workstation action sync");
    expect(map).toContain("calculator prompt expression extraction");
    expect(map).toContain("calculator fast-path action selection");
    expect(map).toContain("calculator fast-path solve execution");
    expect(pill).toContain('readWorkstationActionArgText(action, ["path", "doc_path", "target"])');
    expect(pill).toContain('readWorkstationActionArgText(action, ["anchor"])');
    expect(pill).not.toContain("function readWorkstationActionArgString");
    expect(pill).not.toContain("readWorkstationActionArgString(action");
    expect(map).toContain("workstation reply text selection");
  });

  it("documents workstation command lexicon and panel resolution as local behavior", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const procedural = read("client/src/lib/helix/ask-procedural-display.ts");
    const valueNormalization = read("client/src/lib/helix/ask-value-normalization.ts");
    const commandText = read("client/src/lib/helix/ask-workstation-command-text.ts");

    for (const anchor of [
      "buildLexiconPanelAction",
      "resolveCapabilityAliasPanelAction",
      "parseWorkstationLexiconAction",
    ]) {
      expect(pill).toContain(anchor);
      expect(commandText).not.toContain(anchor);
      expect(map).toContain(anchor);
      expect(procedural).not.toContain(anchor);
      expect(valueNormalization).not.toContain(anchor);
    }
    for (const anchor of [
      "resolvePanelIdFromText",
      "resolvePanelIdFromPath",
      "parseOpenPanelCommand",
    ]) {
      expect(commandText).toContain(`export function ${anchor}`);
      expect(map).toContain(anchor);
      expect(procedural).not.toContain(anchor);
      expect(valueNormalization).not.toContain(anchor);
    }
    expect(pill).not.toContain("function resolvePanelIdFromText");
    expect(pill).not.toContain("function resolvePanelIdFromPath");
    expect(pill).not.toContain("function parseOpenPanelCommand");
    expect(pill).toContain("buildWorkstationPanelResolverConfig");
    expect(pill).toContain("parseOpenPanelCommand(singleEntry, buildWorkstationPanelResolverConfig())");
    expect(pill).toContain("resolvePanelIdFromPath(matchText,");
    for (const anchor of [
      "restateWorkstationSubgoal",
      "normalizeWorkstationCommandText",
      "normalizeLexiconAlias",
    ]) {
      expect(pill).toContain(anchor);
      expect(pill).not.toContain(`function ${anchor}`);
      expect(commandText).toContain(`export function ${anchor}`);
      expect(map).toContain(anchor);
      expect(procedural).not.toContain(anchor);
      expect(valueNormalization).not.toContain(anchor);
    }
    expect(pill).not.toContain("function normalizePanelQuery");
    expect(commandText).toContain("export function normalizePanelQuery");
    expect(map).toContain("normalizePanelQuery");
    expect(pill).toContain('from "@/lib/helix/ask-workstation-command-text"');
    expect(commandText).not.toMatch(/from ["']react["']/);
    expect(commandText).not.toContain("@/store/");
    expect(commandText).not.toContain("@/components/helix/HelixAskPill");
    expect(commandText).not.toContain("getWorkstationPanelCapabilities");
    expect(commandText).not.toContain("HelixWorkstationAction");
    expect(commandText).not.toContain("WORKSTATION_V1_PANEL_CAPABILITIES");
    expect(commandText).not.toContain("fetch(");
    expect(map).toContain("ask-workstation-command-text.ts");
    expect(map).toContain("operator subgoal restatement");
    expect(map).toContain("alias normalization");
    expect(map).toContain("panel capability matching");
    expect(map).toContain("HelixWorkstationAction");
  });

  it("documents workstation pending-input arbitration as local controller behavior", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const procedural = read("client/src/lib/helix/ask-procedural-display.ts");
    const terminalProjection = read("client/src/lib/helix/ask-terminal-projection.ts");
    const debugDisplay = read("client/src/lib/helix/ask-debug-event-display.ts");
    const valueNormalization = read("client/src/lib/helix/ask-value-normalization.ts");
    const pendingInput = read("client/src/lib/helix/ask-workstation-pending-input.ts");

    for (const anchor of [
      "buildWorkstationUserInputRequest",
      "resolvePendingWorkstationUserInput",
      "resolvePanelActionDefinition",
      "resolveWorkstationRouterFailId",
      "syncDocViewerStateFromWorkstationAction",
    ]) {
      expect(pill).toContain(anchor);
      expect(map).toContain(anchor);
      expect(pendingInput).not.toContain(anchor);
      for (const crownedOwner of [procedural, terminalProjection, debugDisplay, valueNormalization]) {
        expect(crownedOwner).not.toContain(anchor);
      }
    }
    for (const anchor of [
      "parseWorkstationConfirmationReply",
      "extractPendingArgFromReply",
      "cloneRunPanelActionWithArgs",
      "readDocTopicResolutionMeta",
      "stripDocTopicResolutionMetaFromArgs",
    ]) {
      expect(pill).toContain(anchor);
      expect(pill).not.toContain(`function ${anchor}`);
      expect(pendingInput).toContain(`export function ${anchor}`);
      expect(map).toContain(anchor);
      for (const crownedOwner of [procedural, terminalProjection, debugDisplay, valueNormalization]) {
        expect(crownedOwner).not.toContain(anchor);
      }
    }
    expect(pill).toContain('from "@/lib/helix/ask-workstation-pending-input"');
    expect(pendingInput).not.toMatch(/from ["']react["']/);
    expect(pendingInput).not.toContain("@/store/");
    expect(pendingInput).not.toContain("@/components/helix/HelixAskPill");
    expect(pendingInput).not.toContain("crypto.randomUUID");
    expect(pendingInput).not.toContain("Date.now");
    expect(pendingInput).not.toContain("dispatchHelixWorkstationAction");
    expect(pendingInput).not.toContain("syncDocViewerStateFromWorkstationAction");
    expect(pendingInput).not.toContain("fetch(");
    expect(map).toContain("ask-workstation-pending-input.ts");
    expect(map).toContain("pending request creation/state");
    expect(map).toContain("docs-viewer topic clarification");
    expect(map).toContain("private metadata stripping");
    expect(map).toContain("router fail-id mapping");
    expect(map).toContain("docs-viewer workstation action arg extraction");
    expect(map).not.toContain("readWorkstationActionArgString");
    expect(pill).not.toContain("readWorkstationActionArgString");
    expect(map).toContain("workstation arg reading");
    expect(map).toContain("workstation mutation");
  });

  it("documents exploration ladder and context chooser policy as local behavior", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const terminalProjection = read("client/src/lib/helix/ask-terminal-projection.ts");
    const explorationPolicy = read("client/src/lib/helix/ask-exploration-policy.ts");
    const fallbackClassification = read("client/src/lib/helix/ask-local-fallback-classification.ts");
    const voiceCopy = read("client/src/lib/helix/ask-voice-copy-display.ts");
    const valueNormalization = read("client/src/lib/helix/ask-value-normalization.ts");

    for (const anchor of [
      "decideExplorationLadderAction",
      "buildConversationFallbackBrief",
    ]) {
      expect(pill).toContain(anchor);
      expect(explorationPolicy).not.toContain(anchor);
      expect(map).toContain(anchor);
      expect(terminalProjection).not.toContain(anchor);
      expect(voiceCopy).not.toContain(anchor);
      expect(valueNormalization).not.toContain(anchor);
    }
    for (const anchor of [
      "inferAskMode",
      "buildExplorationEscalationPrompt",
      "buildExplorationArtifactRetryPrompt",
      "isRepoCodeEvidencePrompt",
      "resolveAskContextChooserAutoMode",
    ]) {
      expect(pill).toContain(anchor);
      expect(pill).not.toContain(`function ${anchor}`);
      expect(explorationPolicy).toContain(`export function ${anchor}`);
      expect(map).toContain(anchor);
      expect(terminalProjection).not.toContain(anchor);
      expect(voiceCopy).not.toContain(anchor);
      expect(valueNormalization).not.toContain(anchor);
    }
    expect(pill).toContain("isRepoFileLocationRequestPrompt");
    expect(pill).not.toContain("function isRepoFileLocationRequestPrompt");
    expect(explorationPolicy).toContain("export function isRepoFileLocationRequestPrompt");
    expect(explorationPolicy).not.toMatch(/from [\"']react[\"']/);
    expect(explorationPolicy).not.toContain("@/store/");
    expect(explorationPolicy).not.toContain("@/components/helix/HelixAskPill");
    expect(explorationPolicy).not.toContain("runAskTurn");
    expect(explorationPolicy).not.toContain("fetch(");
    expect(map).toContain("ask-exploration-policy.ts");
    expect(map).toContain("mode inference");
    expect(map).toContain("escalation prompt construction");
    expect(map).toContain("artifact-retry prompt construction");
    expect(map).toContain("repo file-location prompt detection");
    expect(map).toContain("context chooser auto-mode classification");
    expect(map).toContain("context chooser state");
    expect(map).toContain("Deterministic mission/ideology domain-leak classification");
    expect(fallbackClassification).toContain("export function isLikelyIdeologyDomainLeak");
  });

  it("documents atomic viewer launch suppression as docs-context-owned panel predicate", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const docContext = read("client/src/lib/helix/ask-doc-viewer-context.ts");
    const outputCleanup = read("client/src/lib/helix/ask-output-cleanup.ts");
    const procedural = read("client/src/lib/helix/ask-procedural-display.ts");

    expect(map).toContain("Atomic viewer launch suppression");
    expect(map).toContain("shouldSuppressAtomicViewerLaunch");
    expect(map).toContain("panel launch side effect remains local");
    expect(pill).toContain('from "@/lib/helix/ask-doc-viewer-context"');
    expect(pill).toContain("shouldSuppressAtomicViewerLaunch");
    expect(pill).not.toContain("const shouldSuppressAtomicViewerLaunch");
    expect(docContext).toContain("export function shouldSuppressAtomicViewerLaunch");
    expect(docContext).toContain("HELIX_DOCS_SUMMARY_REQUEST_RE");
    for (const owner of [outputCleanup, procedural]) {
      expect(owner).not.toContain("shouldSuppressAtomicViewerLaunch");
      expect(owner).not.toContain("HELIX_DOCS_SUMMARY_REQUEST_RE");
    }
  });

  it("documents context compaction resume-frame handoff as local behavior", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const resumeFrameStorage = read(
      "client/src/components/helix/ask-console/HelixAskContextCompactionResumeFrameStorage.ts",
    );
    const debugDisplay = read("client/src/lib/helix/ask-debug-event-display.ts");
    const valueNormalization = read("client/src/lib/helix/ask-value-normalization.ts");
    const terminalProjection = read("client/src/lib/helix/ask-terminal-projection.ts");

    for (const anchor of [
      "isHelixAskContextCompactionPauseText",
      "isHelixAskContextCompactionPausePendingReply",
      "extractHelixAskContextCompactionResumeFrame",
      "extractLatestHelixAskContextCompactionResumeFrameFromReplies",
    ]) {
      expect(pill).toContain(anchor);
      expect(resumeFrameStorage).toContain(anchor);
      expect(map).toContain(anchor);
      expect(debugDisplay).not.toContain(anchor);
      expect(valueNormalization).not.toContain(anchor);
      expect(terminalProjection).not.toContain(anchor);
    }
    expect(pill).not.toContain("function isHelixAskContextCompactionPauseText");
    expect(pill).not.toContain("function isHelixAskContextCompactionPausePendingReply");
    expect(pill).not.toContain("function extractHelixAskContextCompactionResumeFrame");
    expect(pill).not.toContain("function extractLatestHelixAskContextCompactionResumeFrameFromReplies");
    for (const storageAnchor of [
      "readStoredHelixAskContextCompactionResumeFrame",
      "writeStoredHelixAskContextCompactionResumeFrame",
      "HELIX_ASK_CONTEXT_RESUME_FRAME_STORAGE_KEY",
    ]) {
      expect(resumeFrameStorage).toContain(storageAnchor);
      expect(map).toContain(storageAnchor);
    }
    expect(pill).not.toContain("window.sessionStorage.getItem(HELIX_ASK_CONTEXT_RESUME_FRAME_STORAGE_KEY)");
    expect(pill).not.toContain("window.sessionStorage.setItem(HELIX_ASK_CONTEXT_RESUME_FRAME_STORAGE_KEY");
    expect(map).toContain("Deterministic pause text parsing, pause-pending reply classification");
    expect(map).toContain("request metadata handoff");
  });

  it("documents external prompt lifecycle and single-flight claims as local behavior", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const procedural = read("client/src/lib/helix/ask-procedural-display.ts");
    const terminalProjection = read("client/src/lib/helix/ask-terminal-projection.ts");
    const debugDisplay = read("client/src/lib/helix/ask-debug-event-display.ts");
    const turnTranscript = read("client/src/lib/helix/ask-turn-transcript.ts");
    const externalPromptClaim = read("client/src/lib/helix/ask-external-prompt-claim.ts");

    for (const anchor of [
      "resolveExternalPromptClaimId",
    ]) {
      expect(pill).toContain(anchor);
      expect(pill).not.toContain(`function ${anchor}`);
      expect(externalPromptClaim).toContain(`export function ${anchor}`);
      expect(map).toContain(anchor);
      for (const crownedOwner of [procedural, terminalProjection, debugDisplay, turnTranscript]) {
        expect(crownedOwner).not.toContain(anchor);
      }
    }
    for (const anchor of [
      "claimExternalPromptSingleFlight",
      "pendingExternalAskPromptRef",
      "consumePendingHelixAskPrompt",
      "clearPendingHelixAskPrompt",
    ]) {
      expect(pill).toContain(anchor);
      expect(externalPromptClaim).not.toContain(anchor);
      expect(map).toContain(anchor);
      for (const crownedOwner of [procedural, terminalProjection, debugDisplay, turnTranscript]) {
        expect(crownedOwner).not.toContain(anchor);
      }
    }
    expect(pill).toContain('from "@/lib/helix/ask-external-prompt-claim"');
    expect(externalPromptClaim).not.toMatch(/from ["']react["']/);
    expect(externalPromptClaim).not.toContain("@/store/");
    expect(externalPromptClaim).not.toContain("@/components/helix/HelixAskPill");
    expect(externalPromptClaim).not.toContain("consumePendingHelixAskPrompt");
    expect(externalPromptClaim).not.toContain("clearPendingHelixAskPrompt");
    expect(externalPromptClaim).not.toContain("fetch(");
    expect(map).toContain("ask-external-prompt-claim.ts");
    expect(map).toContain("claim-id normalization");
    expect(map).toContain("browser-window claim tracking");
    expect(map).toContain("duplicate dispatch suppression");
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
    expect(contextCapsule).not.toMatch(/from ["']react["']/);
    expect(contextCapsule).not.toContain("@/store/");
    expect(contextCapsule).not.toContain("@/components/helix/HelixAskPill");
    expect(contextCapsule).not.toContain("setAskReplies");
    expect(contextCapsule).not.toContain("enqueueVoicePlaybackIntent");
    expect(contextCapsule).not.toContain("runAskTurn");
    expect(contextCapsule).not.toContain("fetch(");
  });

  it("keeps context capsule ledger ranking and selection in the non-React ledger owner", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const ledger = read("client/src/lib/helix/ask-context-capsule-ledger.ts");

    expect(map).toContain("ask-context-capsule-ledger.ts");
    expect(map).toContain("Deterministic context-capsule ledger ranking");
    expect(pill).toContain('from "@/lib/helix/ask-context-capsule-ledger"');
    for (const symbol of [
      "deriveSessionCapsuleState",
      "compareContextCapsuleSummariesByRank",
      "upsertContextCapsuleLedger",
      "buildSelectedContextCapsuleIds",
      "buildLatestWinsContextCapsuleIds",
      "ContextCapsuleLedgerEntry",
      "SessionCapsuleState",
    ]) {
      expect(ledger).toContain(symbol);
    }
    for (const symbol of [
      "deriveSessionCapsuleState",
      "compareContextCapsuleSummariesByRank",
      "upsertContextCapsuleLedger",
      "buildSelectedContextCapsuleIds",
      "buildLatestWinsContextCapsuleIds",
    ]) {
      expect(pill).not.toContain(`export function ${symbol}`);
    }
    for (const localAnchor of [
      "contextCapsuleSessionLedger",
      "setContextCapsuleSessionLedger",
      "contextCapsuleSessionLedgerRef",
      "createContextCapsuleAutomaton",
    ]) {
      expect(pill).toContain(localAnchor);
      expect(ledger).not.toContain(localAnchor);
    }
    for (const forbidden of [
      /from ["']react["']/,
      /@\/store\//,
      /@\/components\/helix\/HelixAskPill/,
      /fetch\(/,
      /navigator\.clipboard/,
      /document\./,
      /window\./,
      /setContextCapsuleSessionLedger/,
      /runAskTurn/,
    ]) {
      expect(ledger).not.toMatch(forbidden);
    }
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
      "summarizeHelixDebugObservationForCopy",
      "summarizeHelixDebugArtifactsForCopy",
      "summarizeHelixAgentRuntimeLoopForCopy",
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
      "buildHelixAskDebugContextSummary",
      "isHelixAskProgressPlaceholderReply",
      "shouldHideHelixAskTranscriptReply",
    ]) {
      expect(pill).toContain(`function ${localAnchor}`);
      expect(debugDisplay).not.toContain(localAnchor);
    }
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    expect(map).toContain("Debug context summary projection");
    expect(map).toContain("buildHelixAskDebugContextSummary");
    expect(map).toContain("pending-cancellation visibility");
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

  it("keeps chat projection and reply lifecycle behavior local to HelixAskPill", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const chatProjection = read("client/src/components/helix/ask-console/HelixAskChatProjection.ts");
    const replyLifecycle = read("client/src/components/helix/ask-console/HelixAskReplyLifecycle.ts");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const debugDisplay = read("client/src/lib/helix/ask-debug-event-display.ts");
    const activeStream = read("client/src/lib/helix/ask-active-turn-stream.ts");
    const transcript = read("client/src/lib/helix/ask-turn-transcript.ts");
    const terminalProjection = read("client/src/lib/helix/ask-terminal-projection.ts");

    const chatPersistence = read("client/src/components/helix/ask-console/HelixAskChatPersistence.ts");
    expect(map).toContain("Chat projection, persistence payloads, and reply lifecycle");
    expect(map).toContain("Pure durable chat-session projection is recrowned");
    expect(map).toContain("Pure chat persistence payload shaping is recrowned");
    expect(map).toContain("Pure reply lifecycle projection");
    expect(map).toContain("active-turn stream visibility");
    expect(map).toContain("brief-lane retention");
    expect(map).toContain("transcript hiding");
    for (const symbol of [
      "buildHelixAskChatProjectionId",
      "buildHelixAskRepliesFromChatSessionProjection",
    ]) {
      expect(chatProjection).toContain(symbol);
      expect(map).toContain(symbol);
      expect(pill).toContain("buildHelixAskRepliesFromChatSessionProjection");
      for (const owner of [debugDisplay, activeStream, transcript, terminalProjection]) {
        expect(owner).not.toContain(symbol);
      }
    }
    expect(chatProjection).toContain("parseHelixAskChatMessageTimeMs");
    expect(map).toContain("parseHelixAskChatMessageTimeMs");
    for (const symbol of [
      "buildHelixAskConsoleChatMessagePayload",
      "buildHelixAskConsoleChatTurnPayloads",
    ]) {
      expect(chatPersistence).toContain(symbol);
      expect(map).toContain(symbol);
      expect(chatPersistence).not.toContain("addMessage");
      expect(chatPersistence).not.toContain("setActive");
      expect(chatPersistence).not.toContain("ensureContextSession");
    }
    for (const symbol of [
      "resolveHelixAskConsoleReplyCanonicalKey",
      "resolveHelixAskConsoleReplyOrderMs",
      "mergeHelixAskConsoleReplyPreservingOrder",
      "mergeHelixAskConsoleRepliesByCanonicalTurn",
      "sortHelixAskConsoleRepliesChronologically",
      "limitHelixAskConsoleRepliesChronologically",
      "appendHelixAskConsoleReplyChronologically",
      "isHelixAskConsoleProgressPlaceholderReply",
      "shouldRenderHelixAskConsoleActiveTurnStream",
      "shouldKeepHelixAskConsoleReplyInBriefLane",
      "shouldHideHelixAskConsoleTranscriptReply",
    ]) {
      expect(replyLifecycle).toContain(symbol);
      expect(map).toContain(symbol);
      for (const owner of [debugDisplay, activeStream, transcript, terminalProjection]) {
        expect(owner).not.toContain(symbol);
      }
    }
    for (const bridgeWrapper of [
      "buildHelixAskRepliesFromChatSession",
      "resolveHelixAskReplyCanonicalKey",
      "resolveHelixAskReplyOrderMs",
      "sortHelixAskRepliesChronologically",
      "appendHelixAskReplyChronologically",
      "shouldRenderHelixAskActiveTurnStream",
      "shouldKeepHelixReplyInBriefLane",
      "shouldHideHelixAskTranscriptReply",
    ]) {
      expect(pill).toContain(bridgeWrapper);
      expect(map).toContain(bridgeWrapper);
    }
    for (const localAnchor of [
      "shouldSuppressGeneratedStagePlayMailWakeChatProjection",
    ]) {
      expect(chatProjection).toContain(localAnchor);
      for (const owner of [debugDisplay, activeStream, transcript, terminalProjection]) {
        expect(owner).not.toContain(localAnchor);
      }
    }
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
    const proceduralTimeline = read("client/src/components/helix/ask-console/HelixAskProceduralTimeline.tsx");
    const statusClasses = read("client/src/lib/helix/ask-status-classnames.ts");

    expect(proceduralTimeline).toContain('from "@/lib/helix/ask-status-classnames"');
    expect(pill).not.toContain('from "@/lib/helix/ask-status-classnames"');
    for (const symbol of ["readProceduralStatusClass", "readHelixCausalTraceRowClass"]) {
      expect(pill).not.toContain(`function ${symbol}`);
      expect(pill).not.toContain(`export function ${symbol}`);
      expect(proceduralTimeline).not.toContain(`function ${symbol}`);
      expect(proceduralTimeline).not.toContain(`export function ${symbol}`);
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
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
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
    expect(pill).not.toContain("const readWorkstationActionArgText");
    expect(read("client/src/lib/helix/ask-workstation-fast-path.ts")).toContain(
      "export function readWorkstationActionArgText",
    );
    expect(map).toContain("resolveWorkstationRouterFailId");
    expect(map).toContain("router fail-id mapping");
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
      "canPlayVoiceUtteranceWithMicOff",
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
    expect(readAloud).not.toContain("micArmStateRef");
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
    const envConfig = read("client/src/lib/helix/ask-env-config.ts");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");

    expect(map).toContain("ask-value-normalization.ts");
    expect(map).toContain("ask-env-config.ts");
    expect(map).toContain("Env key selection/policy");
    expect(pill).toContain('from "@/lib/helix/ask-value-normalization"');
    expect(pill).toContain('from "@/lib/helix/ask-env-config"');
    for (const symbol of [
      "readNumber",
      "clampNumber",
      "clamp01",
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
    for (const symbol of [
      "parseHelixEnvBooleanValue",
      "parseHelixEnvEnabledUnlessExactZeroValue",
      "parseHelixEnvEnabledUnlessZeroValue",
      "parseHelixEnvNumberValue",
      "parseHelixEnvOneFlagValue",
      "parseHelixEnvPercentValue",
      "readHelixEnvBoolean",
      "readHelixEnvEnabledUnlessExactZero",
      "readHelixEnvEnabledUnlessZero",
      "readHelixEnvNumber",
      "readHelixEnvOneFlag",
      "readHelixEnvPercent",
    ]) {
      expect(envConfig).toContain(`export function ${symbol}`);
      expect(pill).not.toContain(`function ${symbol}`);
      expect(valueNormalization).not.toContain(symbol);
    }
    expect(pill).not.toContain("function asPlainRecord");
    expect(pill).not.toContain("function asNonEmptyArgString");
    expect(pill).not.toContain("asPlainRecord(");
    expect(pill).not.toContain("asNonEmptyArgString(");
    expect(pill).not.toContain("const asRecord =");
    for (const localAnchor of [
      "VITE_HELIX_VOICE_CONFIRM_V2_ENABLED",
      "VITE_HELIX_VOICE_CONFIRM_V2_ACTIVE_PERCENT",
      "HELIX_E1_SINGLE_TURN_CONTRACT",
      "HELIX_E6_ASK_TURN_MANUAL_CANARY",
      "VITE_HELIX_THEATER_FRONTIER_ACTIONS",
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
    expect(envConfig).not.toMatch(/from ["']react["']/);
    expect(envConfig).not.toContain("@/store/");
    expect(envConfig).not.toContain("@/components/helix/HelixAskPill");
    expect(envConfig).not.toContain("import.meta");
    expect(envConfig).not.toContain("localStorage");
    expect(envConfig).not.toContain("navigator.clipboard");
    expect(envConfig).not.toContain("fetch(");
    expect(envConfig).not.toContain("runAskTurn");
    expect(envConfig).not.toContain("speakVoice");
  });

  it("keeps deterministic voice-capture signal predicates in the non-React voice capture display module", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const voiceCapture = read("client/src/lib/helix/ask-voice-capture-display.ts");
    const voiceTimelineBuildInfo = read("client/src/components/helix/ask-console/HelixAskVoiceTimelineBuildInfo.ts");

    expect(pill).toContain('from "@/lib/helix/ask-voice-capture-display"');
    for (const symbol of [
      "smoothVoiceLevel",
      "isFlatVoiceSignal",
      "isRecorderStalled",
      "isLikelyLoopbackDeviceLabel",
      "shouldPrimeSegmentWithContainerHeader",
      "resolveVoiceNoiseHandlingProfile",
      "isLowAudioQualitySignal",
      "shouldTreatMicSignalAsSpeech",
      "describeMediaErrorCode",
      "getMicRecorderMimeCandidates",
      "pickSupportedMicRecorderMimeType",
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
      "pickMicRecorderMimeType",
      "readVoiceTimelineClientBuildStamp",
      "MediaRecorder",
      "transcribeVoice",
    ]) {
      expect(pill).toContain(localAnchor);
      expect(voiceCapture).not.toContain(localAnchor);
      expect(voiceTimelineBuildInfo).not.toContain(localAnchor);
    }
    for (const symbol of [
      "buildHelixAskVoiceTimelineInitialBuildInfo",
      "applyHelixAskVoiceTimelineVersionPayload",
      "applyHelixAskVoiceTimelineVersionError",
    ]) {
      expect(pill).toContain(symbol);
      expect(voiceTimelineBuildInfo).toContain(`export function ${symbol}`);
      expect(voiceCapture).not.toContain(symbol);
    }
    expect(map).toContain("browser/env build-stamp reads");
    expect(map).toContain("voice timeline build-info projection");
    expect(map).toContain("diagnostics publication");
    expect(voiceCapture).not.toMatch(/from ["']react["']/);
    expect(voiceCapture).not.toContain("@/store/");
    expect(voiceCapture).not.toContain("@/components/helix/HelixAskPill");
    expect(voiceCapture).not.toContain("navigator");
    expect(voiceCapture).not.toContain("MediaRecorder");
    expect(voiceCapture).not.toContain("fetch(");
    expect(voiceCapture).not.toContain("speakVoice");
    expect(voiceCapture).not.toContain("transcribeVoice");
    expect(voiceTimelineBuildInfo).not.toMatch(/from ["']react["']/);
    expect(voiceTimelineBuildInfo).not.toContain("@/store/");
    expect(voiceTimelineBuildInfo).not.toContain("@/components/helix/HelixAskPill");
    expect(voiceTimelineBuildInfo).not.toContain("window");
    expect(voiceTimelineBuildInfo).not.toContain("navigator");
    expect(voiceTimelineBuildInfo).not.toContain("MediaRecorder");
    expect(voiceTimelineBuildInfo).not.toContain("fetch(");
    expect(voiceTimelineBuildInfo).not.toContain("speakVoice");
    expect(voiceTimelineBuildInfo).not.toContain("transcribeVoice");
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
    expect(voiceText).not.toContain("isPinnedVoiceBriefCandidate");
    expect(voiceText).not.toContain("buildSuppressedVoiceSpeechText");
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

  it("keeps voice-capture checkpoint schema in the non-React checkpoint owner", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const checkpoints = read("client/src/lib/helix/ask-voice-capture-checkpoints.ts");

    expect(map).toContain("ask-voice-capture-checkpoints.ts");
    expect(map).toContain("Deterministic voice-capture checkpoint schema");
    expect(pill).toContain('from "@/lib/helix/ask-voice-capture-checkpoints"');
    for (const symbol of [
      "VOICE_CAPTURE_CHECKPOINT_ORDER",
      "VOICE_CAPTURE_CHECKPOINT_LABEL",
      "createVoiceCaptureCheckpointMap",
      "VoiceCaptureCheckpointKey",
      "VoiceCaptureCheckpointStatus",
      "VoiceCaptureCheckpoint",
    ]) {
      expect(checkpoints).toContain(symbol);
    }
    for (const localAnchor of [
      "setVoiceCaptureCheckpoints",
      "publishVoiceCaptureDiagnosticsSnapshot",
      "transcribeVoice",
      "voiceRecorderRef",
      "voiceTranscribeQueueRef",
    ]) {
      expect(pill).toContain(localAnchor);
      expect(checkpoints).not.toContain(localAnchor);
    }
    for (const forbidden of [
      /from ["']react["']/,
      /@\/store\//,
      /@\/components\/helix\/HelixAskPill/,
      /fetch\(/,
      /navigator\.clipboard/,
      /document\./,
      /window\./,
      /MediaRecorder/,
      /AudioContext/,
      /transcribeVoice/,
      /speakVoice/,
    ]) {
      expect(checkpoints).not.toMatch(forbidden);
    }
  });

  it("keeps deterministic voice diagnostics export projection in the non-React diagnostics owner", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const diagnosticsExport = read("client/src/lib/helix/ask-voice-diagnostics-export.ts");

    expect(map).toContain("ask-voice-diagnostics-export.ts");
    expect(map).toContain("Deterministic voice diagnostics export projection");
    expect(map).toContain("client build-stamp fallback formatting");
    expect(pill).toContain('from "@/lib/helix/ask-voice-diagnostics-export"');
    for (const symbol of [
      "resolveVoiceTimelineClientBuildStamp",
      "summarizeVoiceSegments",
      "sanitizeVoiceDiagnosticsForExport",
      "buildVoicePlaybackReconciliationDebug",
    ]) {
      expect(diagnosticsExport).toContain(`export function ${symbol}`);
      expect(pill).not.toContain(`function ${symbol}`);
    }
    for (const localAnchor of [
      "buildCurrentVoiceDiagnosticsSnapshot",
      "publishVoiceCaptureDiagnosticsSnapshot",
      "getVoiceCaptureDiagnosticsSnapshot",
      "voiceTranscribeQueueRef",
      "voiceAutoSpeakQueueRef",
      "__APP_WARP_BUILD",
    ]) {
      expect(pill).toContain(localAnchor);
      expect(diagnosticsExport).not.toContain(localAnchor);
    }
    expect(diagnosticsExport).not.toMatch(/from ["']react["']/);
    expect(diagnosticsExport).not.toContain("@/store/");
    expect(diagnosticsExport).not.toContain("@/components/helix/HelixAskPill");
    expect(diagnosticsExport).not.toContain("fetch(");
    expect(diagnosticsExport).not.toContain("AudioContext");
    expect(diagnosticsExport).not.toContain("speakVoice");
    expect(diagnosticsExport).not.toContain("runAskTurn");
  });

  it("keeps deterministic voice brief policy helpers in the non-React brief policy owner", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const briefPolicy = read("client/src/lib/helix/ask-voice-brief-policy.ts");
    const voiceText = read("client/src/lib/helix/ask-voice-text-display.ts");

    expect(map).toContain("ask-voice-brief-policy.ts");
    expect(map).toContain("Deterministic voice brief/status predicates");
    expect(pill).toContain('from "@/lib/helix/ask-voice-brief-policy"');
    for (const symbol of [
      "normalizeBriefComparableText",
      "isBriefEchoingTranscript",
      "isReasoningTimeoutReason",
      "isVoiceTurnSupersededReason",
      "shouldSuppressVoiceForTerminalState",
      "isGenericQueuedVoiceAcknowledgement",
      "isGenericRunningVoiceStatus",
      "isPinnedVoiceBriefCandidate",
      "normalizeConversationBriefSource",
      "buildSuppressedVoiceSpeechText",
    ]) {
      expect(briefPolicy).toContain(`export function ${symbol}`);
      expect(pill).not.toContain(`function ${symbol}`);
      expect(voiceText).not.toContain(symbol);
    }
    for (const localAnchor of [
      "voiceAutoSpeakQueueRef",
      "enqueueVoicePlaybackIntent",
      "stopReadAloud",
      "shouldKeepHelixReplyInBriefLane",
      "handleReadAloud",
    ]) {
      expect(pill).toContain(localAnchor);
      expect(briefPolicy).not.toContain(localAnchor);
    }
    expect(briefPolicy).not.toMatch(/from ["']react["']/);
    expect(briefPolicy).not.toContain("@/store/");
    expect(briefPolicy).not.toContain("@/components/helix/HelixAskPill");
    expect(briefPolicy).not.toContain("fetch(");
    expect(briefPolicy).not.toContain("AudioContext");
    expect(briefPolicy).not.toContain("speakVoice");
  });

  it("keeps voice labels and lifecycle copy formatting in the non-React voice copy display module", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const voiceCopy = read("client/src/lib/helix/ask-voice-copy-display.ts");

    expect(pill).toContain('from "@/lib/helix/ask-voice-copy-display"');
    for (const symbol of [
      "describeVoiceCommandAction",
      "resolveReasoningAttemptTimelineText",
      "formatReasoningAttemptDetail",
      "formatVoiceDecisionSentence",
      "composeVoiceBriefWithDecision",
      "buildVoiceInputStatusLabel",
      "describeVoiceInputError",
    ]) {
      expect(pill).not.toContain(`function ${symbol}`);
      expect(pill).not.toContain(`export function ${symbol}`);
      expect(voiceCopy).toContain(`export function ${symbol}`);
    }
    expect(pill).not.toContain("function isVoiceMemoryPressureError");
    expect(voiceCopy).not.toContain("isVoiceMemoryPressureError");
    expect(voiceCopy).not.toMatch(/from ["']react["']/);
    expect(voiceCopy).not.toContain("@/store/");
    expect(voiceCopy).not.toContain("@/components/helix/HelixAskPill");
    expect(voiceCopy).not.toContain("speakVoice");
    expect(voiceCopy).not.toContain("AudioContext");
    expect(voiceCopy).not.toContain("enqueueVoicePlaybackIntent");
    expect(voiceCopy).not.toContain("shouldAutoSpeakVoiceDecisionLifecycle");
    expect(pill).not.toContain("const formatReasoningAttemptDetail = useCallback");
    expect(voiceCopy).not.toContain("runAskTurn");
    expect(voiceCopy).not.toContain("fetch(");
  });

  it("keeps deterministic voice playback retry and error classification in the non-React playback classification owner", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const playbackClassification = read("client/src/lib/helix/ask-voice-playback-classification.ts");
    const playbackRuntime = read("client/src/lib/helix/ask-voice-playback-runtime.ts");
    const readAloud = read("client/src/lib/helix/ask-read-aloud-display.ts");
    const voiceCopy = read("client/src/lib/helix/ask-voice-copy-display.ts");

    expect(map).toContain("ask-voice-playback-classification.ts");
    expect(map).toContain("ask-voice-playback-runtime.ts");
    expect(map).toContain("user-agent/env playback policy");
    expect(pill).toContain('from "@/lib/helix/ask-voice-playback-classification"');
    expect(pill).toContain('from "@/lib/helix/ask-voice-playback-runtime"');
    for (const symbol of [
      "shouldRetryVoicePlaybackWithDirectFallback",
      "shouldRetryVoicePlaybackDirectAttempt",
      "shouldTreatVoicePlaybackErrorAsEnded",
      "isRetryableVoiceChunkSynthesisError",
      "isVoiceMemoryPressureError",
    ]) {
      expect(playbackClassification).toContain(`export function ${symbol}`);
      expect(pill).not.toContain(`function ${symbol}`);
      expect(readAloud).not.toContain(symbol);
      expect(voiceCopy).not.toContain(symbol);
    }
    for (const localAnchor of [
      "isLikelyIOSDesktopModeUserAgent",
      "isLikelyMobileAudioUserAgent",
      "resolveVoicePlaybackGain",
      "shouldUseVoicePlaybackAudioGraph",
      "resolveVoicePlaybackAttemptPath",
      "shouldBypassVoicePlaybackGraph",
      "isActivePlayback",
    ]) {
      if (localAnchor === "isLikelyIOSDesktopModeUserAgent" || localAnchor === "isLikelyMobileAudioUserAgent") {
        expect(playbackRuntime).toContain(`export function ${localAnchor}`);
        expect(pill).not.toContain(`function ${localAnchor}`);
      } else {
        expect(pill).toContain(localAnchor);
        expect(playbackRuntime).toContain(`export function ${localAnchor}`);
        expect(pill).not.toContain(`export function ${localAnchor}`);
      }
      expect(playbackClassification).not.toContain(localAnchor);
    }
    expect(map).toContain("navigator touch-point checks");
    expect(playbackRuntime).toContain("VITE_HELIX_VOICE_FORCE_DIRECT_MOBILE");
    expect(pill).not.toContain("VITE_HELIX_VOICE_FORCE_DIRECT_MOBILE");
    expect(playbackClassification).not.toMatch(/from ["']react["']/);
    expect(playbackClassification).not.toContain("@/store/");
    expect(playbackClassification).not.toContain("@/components/helix/HelixAskPill");
    expect(playbackClassification).not.toContain("fetch(");
    expect(playbackClassification).not.toContain("AudioContext");
    expect(playbackClassification).not.toContain("speakVoice");
    expect(playbackClassification).not.toContain("navigator.");
    expect(playbackClassification).not.toContain("import.meta");
    expect(playbackRuntime).not.toMatch(/from ["']react["']/);
    expect(playbackRuntime).not.toContain("@/store/");
    expect(playbackRuntime).not.toContain("@/components/helix/HelixAskPill");
    expect(playbackRuntime).not.toContain("fetch(");
    expect(playbackRuntime).not.toContain("AudioContext");
    expect(playbackRuntime).not.toContain("speakVoice");
    expect(playbackRuntime).not.toContain("enqueueVoicePlaybackIntent");
  });

  it("keeps deterministic voice steering client helpers in the non-React steering owner", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const steering = read("client/src/lib/helix/ask-voice-steering-client.ts");

    expect(map).toContain("ask-voice-steering-client.ts");
    expect(map).toContain("active-turn voice steering transcript classification");
    expect(pill).toContain('from "@/lib/helix/ask-voice-steering-client"');
    for (const symbol of [
      "classifyVoiceSteeringClientTranscript",
      "buildVoiceSteeringClientRequest",
      "isVoiceSteeringDuringToolCall",
    ]) {
      expect(steering).toContain(`export function ${symbol}`);
      expect(pill).not.toContain(`function ${symbol}`);
    }
    for (const localAnchor of [
      "buildVoiceSteeringReservation",
      'toolName: "live_env.record_voice_steering"',
      "active_turn_completed_before_stt_final",
      "activeVoiceSteeringTurnId",
    ]) {
      expect(pill).toContain(localAnchor);
      expect(steering).not.toContain(localAnchor);
    }
    expect(steering).not.toMatch(/from ["']react["']/);
    expect(steering).not.toContain("@/store/");
    expect(steering).not.toContain("@/components/helix/HelixAskPill");
    expect(steering).not.toContain("fetch(");
    expect(steering).not.toContain("navigator.");
    expect(steering).not.toContain("localStorage");
  });

  it("keeps deterministic transcript confirmation command parsing in the non-React voice confirmation owner", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const confirmation = read("client/src/lib/helix/ask-voice-confirmation-command.ts");

    expect(map).toContain("ask-voice-confirmation-command.ts");
    expect(map).toContain("Deterministic parsing of short transcript confirmation voice commands");
    expect(pill).toContain('from "@/lib/helix/ask-voice-confirmation-command"');
    expect(confirmation).toContain("export function parseTranscriptConfirmationVoiceCommand");
    expect(pill).not.toContain("function parseTranscriptConfirmationVoiceCommand");
    for (const localAnchor of [
      "normalizeVoiceCommandLaneEnvelope",
      "shouldIgnoreLowQualityTranscriptBargeIn",
    ]) {
      expect(pill).toContain(localAnchor);
      expect(confirmation).not.toContain(localAnchor);
    }
    expect(confirmation).not.toMatch(/from ["']react["']/);
    expect(confirmation).not.toContain("@/store/");
    expect(confirmation).not.toContain("@/components/helix/HelixAskPill");
    expect(confirmation).not.toContain("fetch(");
    expect(confirmation).not.toContain("crypto.");
    expect(confirmation).not.toContain("navigator.");
  });

  it("keeps deterministic transcript confidence helpers in the non-React voice confidence owner", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const confidence = read("client/src/lib/helix/ask-voice-transcript-confidence.ts");

    expect(map).toContain("ask-voice-transcript-confidence.ts");
    expect(map).toContain("Deterministic STT transcript confidence derivation");
    expect(pill).toContain('from "@/lib/helix/ask-voice-transcript-confidence"');
    for (const symbol of [
      "deriveTranscriptConfidence",
      "shouldRequireTranscriptConfirmation",
      "normalizeTranscriptConfirmPolicyReason",
      "normalizeVoiceConfirmDispatchState",
      "isLowPivotBlocked",
      "resolveTranscriptConfirmPolicy",
      "shouldAutoConfirmTranscriptPrompt",
    ]) {
      expect(confidence).toContain(`export function ${symbol}`);
      expect(pill).not.toContain(`function ${symbol}`);
    }
    expect(confidence).toContain("export const VOICE_STT_CONFIRM_THRESHOLD");
    expect(confidence).toContain("export const VOICE_TRANSCRIPT_AUTO_CONFIRM_BLOCK_PIVOT_CONFIDENCE");
    for (const localAnchor of [
      "normalizeVoiceCommandLaneEnvelope",
      "shouldIgnoreLowQualityTranscriptBargeIn",
    ]) {
      expect(pill).toContain(localAnchor);
      expect(confidence).not.toContain(localAnchor);
    }
    expect(confidence).not.toMatch(/from ["']react["']/);
    expect(confidence).not.toContain("@/store/");
    expect(confidence).not.toContain("@/components/helix/HelixAskPill");
    expect(confidence).not.toContain("fetch(");
    expect(confidence).not.toContain("crypto.");
    expect(confidence).not.toContain("navigator.");
  });

  it("keeps voice capture, STT, confirmation, continuation, and auto-dispatch policy local", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const confidence = read("client/src/lib/helix/ask-voice-transcript-confidence.ts");
    const confirmation = read("client/src/lib/helix/ask-voice-confirmation-command.ts");
    const steering = read("client/src/lib/helix/ask-voice-steering-client.ts");
    const barge = read("client/src/lib/helix/ask-voice-barge-policy.ts");
    const lexical = read("client/src/lib/helix/ask-voice-continuation-lexical.ts");
    const heldTranscriptPolicy = read("client/src/lib/helix/ask-voice-held-transcript-policy.ts");
    const autoDispatchGovernance = read("client/src/lib/helix/ask-voice-auto-dispatch-governance.ts");
    const commandLanePolicy = read("client/src/lib/helix/ask-voice-command-lane-policy.ts");
    const scoring = read("client/src/lib/helix/ask-voice-turn-scoring.ts");
    const voiceCapture = read("client/src/lib/helix/ask-voice-capture-display.ts");
    const extractedOwners = [
      confidence,
      confirmation,
      steering,
      barge,
      lexical,
      heldTranscriptPolicy,
      autoDispatchGovernance,
      commandLanePolicy,
      scoring,
      voiceCapture,
    ];

    expect(map).toContain("Voice capture, STT, confirmation, continuation, and auto-dispatch");
    expect(map).toContain("mic/STT runtime control");
    expect(map).toContain("transcript-confirm policy resolution");
    expect(map).toContain("ask-voice-auto-dispatch-governance.ts");
    for (const recrownedSymbol of [
      "resolveTranscriptConfirmPolicy",
      "normalizeTranscriptConfirmPolicyReason",
      "shouldAutoConfirmTranscriptPrompt",
    ]) {
      expect(pill).toContain(recrownedSymbol);
      expect(confidence).toContain(recrownedSymbol);
      expect(confirmation).not.toContain(recrownedSymbol);
      expect(steering).not.toContain(recrownedSymbol);
      expect(barge).not.toContain(recrownedSymbol);
      expect(lexical).not.toContain(recrownedSymbol);
      expect(scoring).not.toContain(recrownedSymbol);
      expect(voiceCapture).not.toContain(recrownedSymbol);
    }
    for (const recrownedContinuationSymbol of [
      "shouldMergeVoiceContinuationTurn",
      "shouldMergeVoiceContinuationInFlight",
      "shouldRestartExplorationLadderOnSupersede",
      "isLikelyContinuationAddendum",
      "isLikelyContinuationTailFragment",
    ]) {
      expect(pill).toContain(recrownedContinuationSymbol);
      expect(lexical).toContain(recrownedContinuationSymbol);
      expect(confidence).not.toContain(recrownedContinuationSymbol);
      expect(confirmation).not.toContain(recrownedContinuationSymbol);
      expect(steering).not.toContain(recrownedContinuationSymbol);
      expect(barge).not.toContain(recrownedContinuationSymbol);
      expect(scoring).not.toContain(recrownedContinuationSymbol);
      expect(voiceCapture).not.toContain(recrownedContinuationSymbol);
    }
    for (const recrownedHeldTranscriptSymbol of [
      "shouldMergePendingConfirmationTranscript",
      "shouldRecoverHeldTranscriptAfterNoTranscript",
      "shouldFlushHeldTranscriptFromWatchdog",
    ]) {
      expect(pill).toContain(recrownedHeldTranscriptSymbol);
      expect(heldTranscriptPolicy).toContain(recrownedHeldTranscriptSymbol);
      expect(confidence).not.toContain(recrownedHeldTranscriptSymbol);
      expect(confirmation).not.toContain(recrownedHeldTranscriptSymbol);
      expect(steering).not.toContain(recrownedHeldTranscriptSymbol);
      expect(barge).not.toContain(recrownedHeldTranscriptSymbol);
      expect(lexical).not.toContain(recrownedHeldTranscriptSymbol);
      expect(scoring).not.toContain(recrownedHeldTranscriptSymbol);
      expect(voiceCapture).not.toContain(recrownedHeldTranscriptSymbol);
    }
    for (const recrownedAutoDispatchSymbol of [
      "evaluateVoiceAutoDispatchGovernance",
      "isExplicitVoiceAskTurnCandidate",
    ]) {
      expect(pill).toContain(recrownedAutoDispatchSymbol);
      expect(pill).not.toContain(`function ${recrownedAutoDispatchSymbol}`);
      expect(autoDispatchGovernance).toContain(`export function ${recrownedAutoDispatchSymbol}`);
      expect(confidence).not.toContain(recrownedAutoDispatchSymbol);
      expect(confirmation).not.toContain(recrownedAutoDispatchSymbol);
      expect(steering).not.toContain(recrownedAutoDispatchSymbol);
      expect(barge).not.toContain(recrownedAutoDispatchSymbol);
      expect(lexical).not.toContain(recrownedAutoDispatchSymbol);
      expect(heldTranscriptPolicy).not.toContain(recrownedAutoDispatchSymbol);
      expect(scoring).not.toContain(recrownedAutoDispatchSymbol);
      expect(voiceCapture).not.toContain(recrownedAutoDispatchSymbol);
    }
    for (const recrownedCaptureSymbol of [
      "deriveVoiceSegmentLocalAnalysis",
      "resolveSpeakerFromSessionProfiles",
    ]) {
      expect(pill).toContain(recrownedCaptureSymbol);
      expect(pill).not.toContain(`function ${recrownedCaptureSymbol}`);
      expect(voiceCapture).toContain(`export function ${recrownedCaptureSymbol}`);
      expect(confidence).not.toContain(recrownedCaptureSymbol);
      expect(confirmation).not.toContain(recrownedCaptureSymbol);
      expect(steering).not.toContain(recrownedCaptureSymbol);
      expect(barge).not.toContain(recrownedCaptureSymbol);
      expect(lexical).not.toContain(recrownedCaptureSymbol);
      expect(heldTranscriptPolicy).not.toContain(recrownedCaptureSymbol);
      expect(scoring).not.toContain(recrownedCaptureSymbol);
      expect(autoDispatchGovernance).not.toContain(recrownedCaptureSymbol);
      expect(commandLanePolicy).not.toContain(recrownedCaptureSymbol);
    }
    for (const recrownedCommandLaneSymbol of [
      "normalizeVoiceCommandLaneEnvelope",
      "shouldIgnoreLowQualityTranscriptBargeIn",
    ]) {
      expect(pill).toContain(recrownedCommandLaneSymbol);
      expect(pill).not.toContain(`function ${recrownedCommandLaneSymbol}`);
      expect(commandLanePolicy).toContain(`export function ${recrownedCommandLaneSymbol}`);
      expect(confidence).not.toContain(recrownedCommandLaneSymbol);
      expect(confirmation).not.toContain(recrownedCommandLaneSymbol);
      expect(steering).not.toContain(recrownedCommandLaneSymbol);
      expect(barge).not.toContain(recrownedCommandLaneSymbol);
      expect(lexical).not.toContain(recrownedCommandLaneSymbol);
      expect(heldTranscriptPolicy).not.toContain(recrownedCommandLaneSymbol);
      expect(scoring).not.toContain(recrownedCommandLaneSymbol);
      expect(autoDispatchGovernance).not.toContain(recrownedCommandLaneSymbol);
      expect(voiceCapture).not.toContain(recrownedCommandLaneSymbol);
    }
    for (const ownerInternalSymbol of [
      "normalizeVoiceConfirmDispatchState",
      "isLowPivotBlocked",
    ]) {
      expect(pill).not.toContain(ownerInternalSymbol);
      expect(confidence).toContain(ownerInternalSymbol);
      expect(confirmation).not.toContain(ownerInternalSymbol);
      expect(steering).not.toContain(ownerInternalSymbol);
      expect(barge).not.toContain(ownerInternalSymbol);
      expect(lexical).not.toContain(ownerInternalSymbol);
      expect(scoring).not.toContain(ownerInternalSymbol);
      expect(voiceCapture).not.toContain(ownerInternalSymbol);
    }
    for (const symbol of [
      "buildVoiceReasoningDispatchPrompt",
      "deriveVoiceTimelineSuppressionMeta",
    ]) {
      expect(pill).toContain(symbol);
      for (const owner of extractedOwners) {
        expect(owner).not.toContain(symbol);
      }
    }
    expect(map).toContain("local audio segment analysis");
    expect(map).toContain("speaker-profile matching live in `ask-voice-capture-display.ts`");
    expect(map).toContain("speaker-profile ref mutation");
    expect(map).toContain("pending-confirmation merge predicates live in `ask-voice-held-transcript-policy.ts`");
    expect(map).toContain("confirmation state mutation");
    expect(map).toContain("low-pivot translation blocking");
    for (const localAnchor of [
      "voiceTranscribeQueueRef",
      "voiceConfirmedTurnQueueRef",
      "processTranscriptionQueue",
      "dispatchConfirmedVoiceTranscript",
      "evaluateAndDispatchVoiceSeal",
    ]) {
      expect(pill).toContain(localAnchor);
      for (const owner of extractedOwners) {
        expect(owner).not.toContain(localAnchor);
      }
    }
  });

  it("keeps deterministic voice barge policy helpers in the non-React barge owner", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const barge = read("client/src/lib/helix/ask-voice-barge-policy.ts");

    expect(map).toContain("ask-voice-barge-policy.ts");
    expect(map).toContain("Deterministic voice barge hard-cut reason resolution");
    expect(pill).toContain('from "@/lib/helix/ask-voice-barge-policy"');
    for (const symbol of [
      "resolveVoiceBargeHardCutReason",
      "shouldResumeBargeHeldPlayback",
      "shouldInterruptForSupersededReason",
      "mapVoicePreemptPolicyToCancelReason",
    ]) {
      expect(barge).toContain(`export function ${symbol}`);
      expect(pill).not.toContain(`function ${symbol}`);
    }
    expect(barge).toContain("export const VOICE_BARGE_HARD_CUT_PERSIST_MS");
    for (const localAnchor of [
      "stopReadAloud",
      "voiceAutoSpeakQueueRef",
      "enqueueVoicePlaybackIntent",
      "shouldTreatMicSignalAsSpeech",
    ]) {
      expect(pill).toContain(localAnchor);
      expect(barge).not.toContain(localAnchor);
    }
    expect(pill).toContain("canPlayVoiceUtteranceWithMicOff");
    expect(barge).not.toContain("canPlayVoiceUtteranceWithMicOff");
    expect(barge).not.toMatch(/from ["']react["']/);
    expect(barge).not.toContain("@/store/");
    expect(barge).not.toContain("@/components/helix/HelixAskPill");
    expect(barge).not.toContain("fetch(");
    expect(barge).not.toContain("AudioContext");
    expect(barge).not.toContain("HTMLAudioElement");
    expect(barge).not.toContain("navigator.");
  });

  it("keeps reasoning battle visual projection helpers in the non-React reasoning battle display module", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const busyPanel = read("client/src/components/helix/ask-console/HelixAskBusyReasoningPanel.tsx");
    const animationStyles = read("client/src/components/helix/ask-console/HelixAskReasoningAnimationStyles.tsx");
    const battleStage = read("client/src/components/helix/ask-console/HelixAskReasoningBattleStage.tsx");
    const battleDisplay = read("client/src/lib/helix/ask-reasoning-battle-display.ts");

    expect(pill).toContain('from "@/components/helix/ask-console/HelixAskBusyReasoningPanel"');
    expect(pill).toContain('from "@/components/helix/ask-console/HelixAskReasoningBattleStage"');
    expect(busyPanel).toContain('from "./HelixAskReasoningAnimationStyles"');
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
    expect(pill).not.toContain("function renderReasoningBattleStage");
    expect(pill).toContain("<HelixAskReasoningBattleStage");
    expect(battleStage).toContain("export function HelixAskReasoningBattleStage");
    expect(battleStage).toContain('data-testid={testId ?? "helix-ask-reasoning-battle-stage"}');
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    expect(map).toContain("Reasoning animation keyframes");
    expect(map).toContain("HelixAskReasoningAnimationStyles");
    expect(map).toContain("Busy reasoning panel chrome");
    expect(map).toContain("HelixAskBusyReasoningPanel");
    expect(map).toContain("Reasoning battle JSX rendering");
    expect(map).toContain("HelixAskReasoningBattleStage");
    expect(pill).not.toContain("@keyframes helixReasoningFloatingText{");
    expect(animationStyles).toContain("@keyframes helixReasoningFloatingText{");
    expect(animationStyles).toContain("@keyframes helixReasoningBattleBeat{");
    expect(animationStyles).toContain("@keyframes helixReasoningBattlePrimitive{");
    expect(animationStyles).not.toContain("@/store/");
    expect(animationStyles).not.toContain("runAskTurn");
    expect(animationStyles).not.toContain("fetch(");
    expect(battleDisplay).not.toMatch(/from ["']react["']/);
    expect(battleDisplay).not.toContain("@/store/");
    expect(battleDisplay).not.toContain("@/components/helix/HelixAskPill");
    expect(battleDisplay).not.toContain("runAskTurn");
    expect(battleDisplay).not.toContain("fetch(");
    expect(battleStage).not.toContain("buildReasoningBattleBeats");
    expect(battleStage).not.toContain("buildReasoningBattleAmbientState");
    expect(battleStage).not.toContain("buildReasoningBattleAnswerTint");
    expect(battleStage).not.toContain("@/store/");
    expect(battleStage).not.toContain("runAskTurn");
    expect(battleStage).not.toContain("fetch(");
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
    const hardFailure = read("client/src/lib/helix/ask-reasoning-theater-hard-failure.ts");
    const evidence = read("client/src/lib/helix/ask-reasoning-theater-evidence.ts");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");

    expect(pill).toContain('from "@/lib/helix/ask-reasoning-theater-display"');
    expect(pill).toContain('from "@/lib/helix/ask-reasoning-theater-hard-failure"');
    expect(pill).toContain('from "@/lib/helix/ask-reasoning-theater-evidence"');
    expect(map).toContain("ask-reasoning-theater-hard-failure.ts");
    expect(map).toContain("Deterministic reasoning-theater hard-failure signal extraction");
    expect(map).toContain("ask-reasoning-theater-evidence.ts");
    expect(map).toContain("Deterministic Mirek evidence path recognition");
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
    expect(pill).not.toContain("function resolveReasoningTheaterSuppressionReason");
    expect(theaterDisplay).toContain("export function resolveReasoningTheaterSuppressionReason");
    expect(pill).not.toContain("function resolveReasoningTheaterPhase");
    expect(theaterDisplay).toContain("export function resolveReasoningTheaterPhase");
    expect(pill).not.toContain("const REASONING_THEATER_SUPPRESSION_PATTERNS");
    expect(theaterDisplay).toContain("const REASONING_THEATER_SUPPRESSION_PATTERNS");
    expect(theaterDisplay).toContain("export const REASONING_THEATER_SUPPRESSION_REASONS");
    expect(pill).not.toContain("function resolveReasoningTheaterMedal");
    expect(theaterDisplay).toContain("export function resolveReasoningTheaterMedal");
    expect(theaterDisplay).toContain("export type ReasoningTheaterMedalEvent");
    expect(pill).not.toContain("function buildReasoningTheaterFrontierParticles");
    expect(theaterDisplay).toContain("export function buildReasoningTheaterFrontierParticles");
    expect(theaterDisplay).toContain("export type ReasoningTheaterFrontierParticleNode");
    expect(pill).not.toContain("function buildReasoningTheaterParticlesFromMirekArtifact");
    expect(theaterDisplay).toContain("export function buildReasoningTheaterParticlesFromMirekArtifact");
    expect(theaterDisplay).toContain("export type ReasoningTheaterParticle");
    expect(pill).not.toContain("function mirekReasoningDisplayDensity");
    expect(theaterDisplay).toContain("export function mirekReasoningDisplayDensity");
    expect(pill).not.toContain("function buildMirekReasoningDisplayGrid");
    expect(theaterDisplay).toContain("export function buildMirekReasoningDisplayGrid");
    expect(pill).not.toContain("function countMirekAliveNeighbors");
    expect(theaterDisplay).toContain("function countMirekAliveNeighbors");
    expect(theaterDisplay).toContain("export type MirekReasoningDisplayGrid");
    expect(pill).not.toContain("export function readReasoningTheaterHardFailureSignals");
    expect(pill).not.toContain("function collectReasoningTheaterHardFailureReasonsFromRecord");
    expect(hardFailure).toContain("export function readReasoningTheaterHardFailureSignals");
    expect(hardFailure).toContain("export type ReasoningTheaterHardFailureSignals");
    for (const symbol of [
      "isMirekEvidencePath",
      "collectMirekEvidencePathsFromValue",
      "collectMirekEvidencePathsFromLiveEvents",
      "buildMirekEvidenceAnchors",
      "calculateMirekSharedExactPathRatio",
    ]) {
      expect(pill).not.toContain(`function ${symbol}`);
      expect(evidence).toContain(`export function ${symbol}`);
      expect(theaterDisplay).not.toContain(symbol);
      expect(hardFailure).not.toContain(symbol);
    }
    expect(pill).toContain("function deriveReasoningTheaterState");
    expect(pill).toContain("function deriveReasoningTheaterStateFromCanonical");
    expect(pill).toContain("function resolveReasoningTheaterFailureOverrideArchetype");
    expect(map).toContain("deriveReasoningTheaterStateFromCanonical");
    expect(map).toContain("resolveReasoningTheaterFailureOverrideArchetype");
    expect(map).toContain("canonical-state adaptation");
    expect(pill).toContain("advanceReasoningTheaterFrontierTracker");
    expect(pill).toContain("setReasoningTheaterMedalQueue");
    expect(theaterDisplay).not.toContain("setReasoningTheaterMedalQueue");
    expect(theaterDisplay).not.toMatch(/from ["']react["']/);
    expect(theaterDisplay).not.toContain("@/store/");
    expect(theaterDisplay).not.toContain("@/components/helix/HelixAskPill");
    expect(theaterDisplay).not.toContain("deriveReasoningTheaterState");
    expect(theaterDisplay).not.toContain("setReasoningTheater");
    expect(theaterDisplay).not.toContain("runAskTurn");
    expect(theaterDisplay).not.toContain("fetch(");
    expect(hardFailure).not.toMatch(/from ["']react["']/);
    expect(hardFailure).not.toContain("@/store/");
    expect(hardFailure).not.toContain("@/components/helix/HelixAskPill");
    expect(hardFailure).not.toContain("setReasoningTheater");
    expect(hardFailure).not.toContain("runAskTurn");
    expect(hardFailure).not.toContain("fetch(");
    expect(hardFailure).not.toContain("navigator.clipboard");
    expect(hardFailure).not.toContain("document.");
    expect(hardFailure).not.toContain("window.");
    expect(evidence).not.toMatch(/from ["']react["']/);
    expect(evidence).not.toContain("@/store/");
    expect(evidence).not.toContain("@/components/helix/HelixAskPill");
    expect(evidence).not.toContain("setReasoningTheater");
    expect(evidence).not.toContain("runAskTurn");
    expect(evidence).not.toContain("fetch(");
    expect(evidence).not.toContain("navigator.");
    expect(evidence).not.toContain("document.");
    expect(evidence).not.toContain("window.");
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

  it("keeps interim voice callout artifact parsing out of the playback runtime", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const interimVoice = read("client/src/lib/helix/ask-interim-voice-callout.ts");

    expect(map).toContain("ask-interim-voice-callout.ts");
    expect(map).toContain("Structured interim voice callout artifact parsing");
    expect(pill).toContain('from "@/lib/helix/ask-interim-voice-callout"');
    for (const symbol of [
      "buildInterimVoiceReceiptPlaybackIntent",
      "collectInterimVoiceCalloutPlaybackIntents",
    ]) {
      expect(interimVoice).toContain(symbol);
    }
    for (const localAnchor of [
      "enqueueInterimVoiceCalloutsFromAskArtifacts",
      "interimVoiceSpokenReceiptKeysRef",
      "interimVoiceSpokenImmediateAckTurnKeysRef",
      "enqueueVoiceAutoSpeakTask",
      "speakVoice",
    ]) {
      expect(pill).toContain(localAnchor);
      expect(interimVoice).not.toContain(localAnchor);
    }
    for (const forbidden of [
      /from ["']react["']/,
      /@\/store\//,
      /@\/components\/helix\/HelixAskPill/,
      /fetch\(/,
      /navigator\.clipboard/,
      /document\./,
      /window\./,
      /AudioContext/,
    ]) {
      expect(interimVoice).not.toMatch(forbidden);
    }
  });

  it("keeps voice playback intent/task projection out of the playback runtime", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const map = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    const playbackIntent = read("client/src/lib/helix/ask-voice-playback-intent.ts");

    expect(map).toContain("ask-voice-playback-intent.ts");
    expect(map).toContain("Deterministic voice playback intent/task projection");
    expect(pill).toContain('from "@/lib/helix/ask-voice-playback-intent"');
    for (const symbol of [
      "VoiceAutoSpeakTask",
      "VoicePlaybackUtteranceIntent",
      "buildManualReadAloudVoiceIntent",
      "mapVoicePlaybackIntentToTask",
    ]) {
      expect(playbackIntent).toContain(symbol);
    }
    for (const localAnchor of [
      "enqueueVoiceAutoSpeakTask",
      "voiceAutoSpeakQueueRef",
      "speakVoice",
      "createVoicePlaybackUtterance",
      "updateVoicePlaybackLifecycleDiagnosticFromAudio",
    ]) {
      expect(pill).toContain(localAnchor);
      expect(playbackIntent).not.toContain(localAnchor);
    }
    for (const forbidden of [
      /from ["']react["']/,
      /@\/store\//,
      /@\/components\/helix\/HelixAskPill/,
      /fetch\(/,
      /navigator\.clipboard/,
      /document\./,
      /window\./,
      /AudioContext/,
      /HTMLAudioElement/,
    ]) {
      expect(playbackIntent).not.toMatch(forbidden);
    }
  });
});
