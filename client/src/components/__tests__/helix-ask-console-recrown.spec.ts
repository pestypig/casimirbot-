import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  HELIX_ASK_CONSOLE_LEGACY_BRIDGE_STATUS,
  HELIX_ASK_CONSOLE_LIVE_SURFACE_REQUIREMENTS,
  HELIX_ASK_CONSOLE_RECROWN_VERSION,
} from "@/components/helix/ask-console/HelixAskConsoleState";
import { buildHelixAskFinalAnswerBlocks } from "@/components/helix/ask-console/HelixAskFinalAnswer";
import {
  buildHelixAskContextBridgeSnapshot,
  readDocPathFromDesktopUrl,
} from "@/components/helix/ask-console/HelixAskContextBridge";
import {
  buildHelixAskConsoleRequestEnvelope,
  buildHelixAskConsoleBackendTurnPayloadCore,
  buildHelixAskConsoleContextFiles,
} from "@/components/helix/ask-console/HelixAskRequestEnvelope";
import {
  buildHelixAskLatestTurnBinding,
  resolveHelixAskLatestTurnId,
} from "@/components/helix/ask-console/HelixAskLatestTurnBinding";
import {
  hasSuccessfulWorkstationTerminalTranscriptRows,
  resolveHelixAskConsoleFinalAnswerSourceLabel,
} from "@/components/helix/ask-console/HelixAskFinalProjection";
import {
  selectHelixAskConsoleTurnTranscriptRowsForStream,
  selectHelixAskConsoleWorkstationTraceRows,
} from "@/components/helix/ask-console/HelixAskWorkstationTraceRows";
import { buildHelixAskRuntimePickerModel } from "@/components/helix/ask-console/HelixAskRuntimePicker";
import {
  HELIX_ASK_CONSOLE_MAX_PROMPT_LINES,
  buildHelixAskComposerViewModel,
} from "@/components/helix/ask-console/HelixAskComposer";
import { buildHelixAskSubmitAdmission } from "@/components/helix/ask-console/HelixAskSubmitAdmission";
import {
  buildHelixAskRepliesFromChatSessionProjection,
  shouldSuppressGeneratedStagePlayMailWakeChatProjection,
} from "@/components/helix/ask-console/HelixAskChatProjection";
import {
  appendHelixAskConsoleReplyChronologically,
  resolveHelixAskConsoleReplyCanonicalKey,
  shouldKeepHelixAskConsoleReplyInBriefLane,
  shouldRenderHelixAskConsoleActiveTurnStream,
  sortHelixAskConsoleRepliesChronologically,
} from "@/components/helix/ask-console/HelixAskReplyLifecycle";
import {
  buildHelixAskConsoleChatMessagePayload,
  buildHelixAskConsoleChatTurnPayloads,
} from "@/components/helix/ask-console/HelixAskChatPersistence";

const read = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");

describe("Helix Ask Console recrown boundary", () => {
  it("loads the rendered console crown behind the app entrypoint", async () => {
    (globalThis as Record<string, unknown>).__HELIX_ASK_JOB_TIMEOUT_MS__ = "1200000";

    const module = await import("@/components/helix/ask-console");

    expect(typeof module.HelixAskConsole).toBe("function");
  }, 30000);

  it("creates the new ask-console crown modules for the live surface", () => {
    const root = path.resolve(process.cwd(), "client/src/components/helix/ask-console");
    const expectedFiles = [
      "HelixAskConsole.tsx",
      "HelixAskComposer.tsx",
      "HelixAskRuntimePicker.tsx",
      "HelixAskMoodAvatar.tsx",
      "HelixAskActionToolbar.tsx",
      "HelixAskSurfaceFrame.tsx",
      "HelixAskTurnList.tsx",
      "HelixAskReplyCard.tsx",
      "HelixAskTurnStreamPanel.tsx",
      "HelixAskFinalAnswer.tsx",
      "HelixAskFinalExtras.tsx",
      "HelixAskActiveTurnStreamPanel.tsx",
      "HelixAskTurnControls.tsx",
      "HelixAskDebugDrawer.tsx",
      "HelixAskAttachmentStrip.tsx",
      "HelixAskStatusLine.tsx",
      "HelixAskVoiceLevelMonitor.tsx",
      "HelixAskObserverLane.tsx",
      "HelixAskSteeringQueuePanel.tsx",
      "HelixAskContextCapsulePreview.tsx",
      "HelixAskSituationRoomSourcePanel.tsx",
      "HelixAskVoiceConfirmationPanel.tsx",
      "HelixAskContextBridge.ts",
      "HelixAskRequestEnvelope.ts",
      "HelixAskLatestTurnBinding.ts",
      "HelixAskFinalProjection.ts",
      "HelixAskWorkstationTraceRows.ts",
      "HelixAskSubmitAdmission.ts",
      "HelixAskChatProjection.ts",
      "HelixAskReplyLifecycle.ts",
      "HelixAskChatPersistence.ts",
      "HelixAskConsoleState.ts",
      "index.ts",
    ];

    for (const file of expectedFiles) {
      expect(fs.existsSync(path.join(root, file))).toBe(true);
    }
    expect(HELIX_ASK_CONSOLE_RECROWN_VERSION).toBe("ask-console-recrown-v1");
    expect(HELIX_ASK_CONSOLE_LIVE_SURFACE_REQUIREMENTS).toEqual([
      "prompt_input",
      "runtime_picker",
      "active_docs_context_handoff",
      "request_envelope",
      "submit_stream_handling",
      "latest_turn_selection",
      "final_answer_rendering",
      "workstation_trace_rows",
      "copy_final",
      "debug_copy_export",
      "read_aloud",
      "chat_session_persistence",
    ]);
  });

  it("routes active desktop and workstation entrypoints through the new console crown", () => {
    const entrypoints = [
      "client/src/components/workstation/HelixAskDock.tsx",
      "client/src/components/workstation/mobile/MobileHelixAskDrawer.tsx",
      "client/src/pages/desktop.tsx",
      "client/src/pages/mobile-start.tsx",
    ];

    for (const entrypoint of entrypoints) {
      const source = read(entrypoint);
      expect(source).toContain("@/components/helix/ask-console");
      expect(source).not.toContain("@/components/helix/HelixAskPill");
    }
  });

  it("quarantines the remaining legacy behavior behind a named bridge", () => {
    const consoleSource = read("client/src/components/helix/ask-console/HelixAskConsole.tsx");
    const bridgeSource = read("client/src/components/helix/ask-console/HelixAskLegacyRuntimeBridge.tsx");

    expect(consoleSource).toContain("HelixAskLegacyRuntimeBridge");
    expect(consoleSource).not.toContain("@/components/helix/HelixAskPill");
    expect(bridgeSource).toContain("@/components/helix/HelixAskPill");
    expect(HELIX_ASK_CONSOLE_LEGACY_BRIDGE_STATUS).toMatchObject({
      bridge: "helix_ask_pill_legacy_runtime_bridge",
      reason: "behavior_sensitive_paths_not_yet_recrowned",
      recrownedLiveSurfaceRequirements: [
        "prompt_input",
        "active_docs_context_handoff",
        "request_envelope",
        "runtime_picker",
        "latest_turn_selection",
        "final_answer_rendering",
        "workstation_trace_rows",
        "copy_final",
        "debug_copy_export",
        "read_aloud",
      ],
      remainingBehaviorSensitivePaths: [
        "submit_stream_handling",
        "chat_session_persistence",
      ],
    });
  });

  it("keeps active document handoff as a pure request-envelope helper", () => {
    const url =
      "http://127.0.0.1:1498/desktop?panels=docs-viewer%2Cscientific-calculator&focus=docs-viewer&doc=docs/research/nhm2-current-status-whitepaper-2026-05-02.md";
    const context = buildHelixAskContextBridgeSnapshot(url);

    expect(readDocPathFromDesktopUrl(url)).toBe(
      "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
    );
    expect(buildHelixAskConsoleRequestEnvelope({
      question: "Summarize the current whitepaper.",
      agentRuntime: "codex",
      context,
    })).toEqual({
      question: "Summarize the current whitepaper.",
      agent_runtime: "codex",
      doc_path: "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
    });
    expect(buildHelixAskConsoleContextFiles({
      docsViewerAnchorPath: "workspace://docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
      workspaceContextSnapshot: {
        activeDocPath: "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
        docContextPath: "docs/other.md",
      },
    })).toEqual([
      "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
      "docs/other.md",
    ]);
  });

  it("owns the core backend turn request shape used by the legacy bridge", () => {
    expect(buildHelixAskConsoleBackendTurnPayloadCore({
      sessionId: "session-1",
      agentRuntime: "codex",
      traceId: "ask:trace",
      turnId: "ask:turn",
      maxTokens: 1234,
      question: "Use the active doc.",
      contextFiles: ["docs/current.md"],
    })).toEqual({
      sessionId: "session-1",
      agentRuntime: "codex",
      traceId: "ask:trace",
      turnId: "ask:turn",
      maxTokens: 1234,
      question: "Use the active doc.",
      contextFiles: ["docs/current.md"],
    });

    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    expect(legacyPill).toContain("buildHelixAskConsoleBackendTurnPayloadCore");
    expect(legacyPill).toContain("buildHelixAskConsoleContextFiles");
    expect(legacyPill).toContain("readDocPathFromDesktopUrl");
  });

  it("owns latest visible turn control binding for copy, debug copy, and read aloud", () => {
    const latestId = resolveHelixAskLatestTurnId([
      { id: "old-turn", finalAnswerText: "old answer" },
      { id: "latest-turn", finalAnswerText: "latest answer" },
    ]);

    expect(latestId).toBe("latest-turn");
    expect(buildHelixAskLatestTurnBinding({
      replyId: "old-turn",
      latestReplyId: latestId,
      finalAnswerText: "old answer",
    })).toEqual({
      isLatest: false,
      finalAnswerText: "old answer",
    });
    expect(buildHelixAskLatestTurnBinding({
      replyId: "latest-turn",
      latestReplyId: latestId,
      finalAnswerText: "latest answer",
    })).toEqual({
      isLatest: true,
      copyFinalTestId: "helix-ask-latest-copy-final",
      debugCopyTestId: "helix-ask-latest-debug-copy",
      finalAnswerTestId: "helix-ask-latest-final-answer",
      questionTestId: "helix-ask-latest-question",
      readAloudTestId: "helix-ask-latest-read-aloud",
      turnTestId: "helix-ask-latest-turn",
      workLogTestId: "helix-ask-latest-work-log",
      finalAnswerText: "latest answer",
    });

    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    expect(legacyPill).toContain("buildHelixAskLatestTurnBinding");
  });

  it("owns structured workstation success projection without final-prose scraping", () => {
    const successfulRows = [
      {
        key: "request",
        role: "assistant",
        label: "Tool Request",
        text: "Tool request: scientific-calculator.solve_expression",
        meta: "workstation_gateway | workstation_gateway_1 | completed",
        status: "completed",
      },
      {
        key: "observation",
        role: "tool",
        label: "Tool Observation",
        text: "Tool observation: scientific-calculator.solve_expression observed expression 8*9 result 72",
        meta: "scientific-calculator.solve_expression | workstation_gateway_1 | completed",
        status: "completed",
      },
      {
        key: "reentry",
        role: "assistant",
        label: "Model Re-entry",
        text: "Model re-entry: Codex received the workstation observation packet(s) before final answer.",
        meta: "workstation_gateway | reentry | completed",
        status: "completed",
      },
      {
        key: "final",
        role: "assistant",
        label: "Final",
        text: "Observed expression: 8*9\nResult: 72",
        meta: "terminal | final",
        status: "completed",
      },
    ];

    expect(hasSuccessfulWorkstationTerminalTranscriptRows(successfulRows)).toBe(true);
    expect(resolveHelixAskConsoleFinalAnswerSourceLabel({
      rawFinalAnswerSourceLabel: "typed failure",
      turnTranscriptRows: successfulRows,
    })).toBe("workstation tool evaluation");
    expect(resolveHelixAskConsoleFinalAnswerSourceLabel({
      rawFinalAnswerSourceLabel: "typed failure",
      turnTranscriptRows: [
        {
          key: "final-only",
          role: "assistant",
          label: "Final",
          text: "Observed expression: 8*9\nResult: 72",
          meta: "terminal | final",
          status: "completed",
        },
      ],
    })).toBe("typed failure");

    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    expect(legacyPill).toContain("resolveHelixAskConsoleFinalAnswerSourceLabel");
  });

  it("owns final-answer block rendering policy without UI clipping", () => {
    expect(buildHelixAskFinalAnswerBlocks("Summary:\n- NHM2 remains bounded.\n\nDone.")).toEqual([
      {
        kind: "line",
        key: "final-answer-line-0",
        text: "Summary:",
        isSectionHeader: true,
      },
      {
        kind: "bullet",
        key: "final-answer-bullet-1",
        text: "NHM2 remains bounded.",
      },
      {
        kind: "blank",
        key: "final-answer-blank-2",
      },
      {
        kind: "line",
        key: "final-answer-line-3",
        text: "Done.",
        isSectionHeader: false,
      },
    ]);

    const finalAnswerSource = read("client/src/components/helix/ask-console/HelixAskFinalAnswer.tsx");
    expect(finalAnswerSource).toContain("buildHelixAskFinalAnswerBlocks");
    expect(finalAnswerSource).toContain("data-narrator-source-id");
    expect(finalAnswerSource).not.toMatch(/\b(?:line-clamp|max-h-|overflow-hidden|truncate|text-ellipsis|whitespace-nowrap)\b/);

    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    expect(legacyPill).toContain("<HelixAskFinalAnswer");
    expect(legacyPill).toContain("renderContent={renderHelixAskContent}");
    expect(legacyPill).not.toContain("blocks.map((block)");
    expect(legacyPill).not.toContain("parseHelixAskFinalAnswerBulletLine");
  });

  it("owns final-row proof trace display while trace selection stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const finalExtras = read("client/src/components/helix/ask-console/HelixAskFinalExtras.tsx");
    const turnStreamPanel = read("client/src/components/helix/ask-console/HelixAskTurnStreamPanel.tsx");

    expect(legacyPill).toContain("<HelixAskTurnStreamPanel");
    expect(legacyPill).toContain("workstation_reasoning_trace");
    expect(legacyPill).toContain("proofTrace={(replyDebugRecord as Record<string, unknown> | null | undefined)?.workstation_reasoning_trace}");
    expect(legacyPill).not.toContain("<summary className=\"cursor-pointer select-none text-[10px] uppercase tracking-[0.2em] text-amber-200\">");
    expect(legacyPill).not.toContain("trace.compact_steps");
    expect(legacyPill).not.toContain("trace.caveats");

    expect(turnStreamPanel).toContain("<HelixAskProofTraceDetails trace={proofTrace} clipText={clipText} />");
    expect(finalExtras).toContain("export function HelixAskProofTraceDetails");
    expect(finalExtras).toContain("if (!record) return null");
    expect(finalExtras).toContain("Proof trace");
    expect(finalExtras).toContain("record.compact_steps");
    expect(finalExtras).toContain("record.caveats");
    expect(finalExtras).toContain("clipText(String(stepRecord?.summary ?? \"\"), 260)");
    expect(finalExtras).not.toContain("replyDebugRecord");
    expect(finalExtras).not.toContain("workstation_reasoning_trace");
  });

  it("owns job-ready link button display while execution stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const finalExtras = read("client/src/components/helix/ask-console/HelixAskFinalExtras.tsx");
    const turnStreamPanel = read("client/src/components/helix/ask-console/HelixAskTurnStreamPanel.tsx");

    expect(legacyPill).toContain("<HelixAskTurnStreamPanel");
    expect(legacyPill).toContain("jobReadyLinks={jobReadyLinks}");
    expect(legacyPill).toContain("onRunJobReadyLink={runJobReadyLink}");
    expect(legacyPill).toContain("const jobReadyLinks = resolveHelixAskVisibleJobReadyLinks(reply)");
    expect(legacyPill).toContain("syncDocViewerStateFromWorkstationAction(action)");
    expect(legacyPill).not.toContain("jobReadyLinks.slice(0, 6).map");
    expect(legacyPill).not.toContain("title={`From ${source}`}");

    expect(turnStreamPanel).toContain("<HelixAskJobReadyLinkStrip links={jobReadyLinks} onRun={onRunJobReadyLink} />");
    expect(finalExtras).toContain("export function HelixAskJobReadyLinkStrip");
    expect(finalExtras).toContain("if (links.length === 0) return null");
    expect(finalExtras).toContain("links.slice(0, 6).map");
    expect(finalExtras).toContain("onClick={() => onRun(link)}");
    expect(finalExtras).toContain("title={`From ${source}`}");
    expect(finalExtras).not.toContain("resolveHelixAskVisibleJobReadyLinks");
    expect(finalExtras).not.toContain("syncDocViewerStateFromWorkstationAction");
    expect(finalExtras).not.toContain("dispatchHelixWorkstationActions");
  });

  it("owns latest reply status footer display while latest selection stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const replyCard = read("client/src/components/helix/ask-console/HelixAskReplyCard.tsx");
    const finalExtras = read("client/src/components/helix/ask-console/HelixAskFinalExtras.tsx");

    expect(legacyPill).toContain("<HelixAskReplyCard");
    expect(legacyPill).toContain("promptIngested={reply.promptIngested}");
    expect(legacyPill).toContain("const isLatestReply = reply.id === transcriptLatestAskReplyId");
    expect(legacyPill).not.toContain("<HelixAskReplyStatusFooter");
    expect(legacyPill).not.toContain("In Helix Console");
    expect(legacyPill).not.toContain("{reply.promptIngested ? \" | Prompt ingested\" : \"\"}");

    expect(replyCard).toContain("<HelixAskReplyStatusFooter visible={isLatestReply} promptIngested={promptIngested} />");
    expect(replyCard).not.toContain("transcriptLatestAskReplyId");
    expect(replyCard).not.toContain("reply.id");
    expect(finalExtras).toContain("export function HelixAskReplyStatusFooter");
    expect(finalExtras).toContain("if (!visible) return null");
    expect(finalExtras).toContain("In Helix Console");
    expect(finalExtras).toContain("{promptIngested ? \" | Prompt ingested\" : \"\"}");
    expect(finalExtras).not.toContain("transcriptLatestAskReplyId");
    expect(finalExtras).not.toContain("reply.id");
  });

  it("owns live bridge pill display while bridge state stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const finalExtras = read("client/src/components/helix/ask-console/HelixAskFinalExtras.tsx");
    const turnStreamPanel = read("client/src/components/helix/ask-console/HelixAskTurnStreamPanel.tsx");

    expect(legacyPill).toContain("<HelixAskTurnStreamPanel");
    expect(legacyPill).toContain("liveBridgeStatus={liveAnswerTurnBridge?.status}");
    expect(legacyPill).toContain("readPillClassName={readLiveAnswerTurnBridgePillClassName}");
    expect(legacyPill).toContain("liveAnswerTurnBridge = buildLiveAnswerTurnBridgeState");
    expect(legacyPill).not.toContain("row.bridgePills.map");
    expect(legacyPill).not.toContain("pills={row.bridgePills}");
    expect(legacyPill).not.toContain('data-testid={isLatestReply ? "helix-ask-latest-live-turn-bridge" : undefined}');

    expect(turnStreamPanel).toContain("<HelixAskLiveBridgePillStrip");
    expect(turnStreamPanel).toContain("pills={row.bridgePills}");
    expect(turnStreamPanel).toContain("status={liveBridgeStatus}");
    expect(finalExtras).toContain("export function HelixAskLiveBridgePillStrip");
    expect(finalExtras).toContain("if (!pills?.length) return null");
    expect(finalExtras).toContain('data-testid={isLatestReply ? "helix-ask-latest-live-turn-bridge" : undefined}');
    expect(finalExtras).toContain("data-live-turn-bridge-status={status ?? undefined}");
    expect(finalExtras).toContain("pills.map((pill)");
    expect(finalExtras).toContain("readPillClassName(pill.tone)");
    expect(finalExtras).not.toContain("buildLiveAnswerTurnBridgeState");
  });

  it("owns disabled Stage Play action button display while action rows stay in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const finalExtras = read("client/src/components/helix/ask-console/HelixAskFinalExtras.tsx");
    const turnStreamPanel = read("client/src/components/helix/ask-console/HelixAskTurnStreamPanel.tsx");

    expect(legacyPill).toContain("<HelixAskTurnStreamPanel");
    expect(legacyPill).toContain("stagePlayEvents: stagePlayChatLedgerEvents");
    expect(legacyPill).toContain("stagePlayEventCount={stagePlayChatLedgerEvents.length}");
    expect(legacyPill).not.toContain("<HelixAskStagePlayActionButtons");
    expect(legacyPill).not.toContain("row.actions.map");
    expect(legacyPill).not.toContain("Use the Stage Play graph checkpoint controls for this v1 action.");

    expect(turnStreamPanel).toContain("<HelixAskStagePlayActionButtons");
    expect(turnStreamPanel).toContain("actions={row.actions}");
    expect(finalExtras).toContain("export function HelixAskStagePlayActionButtons");
    expect(finalExtras).toContain("if (!actions?.length) return null");
    expect(finalExtras).toContain("actions.map((action)");
    expect(finalExtras).toContain("Use the Stage Play graph checkpoint controls for this v1 action.");
    expect(finalExtras).toContain("helix-ask-latest-stage-play-${action.toLowerCase().replace");
    expect(finalExtras).not.toContain("stagePlayChatLedgerEvents");
    expect(finalExtras).not.toContain("buildHelixContinuousTurnStreamRows");
  });

  it("owns structured workstation trace-row admission without final-prose scraping", () => {
    const rows = [
      {
        key: "request",
        role: "assistant",
        label: "Tool Request",
        text: "Tool request: scientific-calculator.solve_expression",
        meta: "workstation_gateway | workstation_gateway_1 | completed",
        status: "completed",
      },
      {
        key: "observation",
        role: "tool",
        label: "Tool Observation",
        text: "Tool observation: scientific-calculator.solve_expression observed expression 8*9 result 72",
        meta: "scientific-calculator.solve_expression | workstation_gateway_1 | completed",
        status: "completed",
      },
      {
        key: "reentry",
        role: "assistant",
        label: "Model Re-entry",
        text: "Model re-entry: Codex received the workstation observation packet(s) before final answer.",
        meta: "workstation_gateway | reentry | completed",
        status: "completed",
      },
      {
        key: "final",
        role: "assistant",
        label: "Final",
        text: "Observed expression: 8*9\nResult: 72",
        meta: "terminal | final",
        status: "completed",
      },
    ];

    expect(selectHelixAskConsoleWorkstationTraceRows(rows).map((row) => row.label)).toEqual([
      "Tool Request",
      "Tool Observation",
      "Model Re-entry",
    ]);
    expect(selectHelixAskConsoleTurnTranscriptRowsForStream(rows).map((row) => row.label)).toEqual([
      "Tool Request",
      "Tool Observation",
      "Model Re-entry",
    ]);
    expect(selectHelixAskConsoleWorkstationTraceRows([
      {
        key: "final-prose-only",
        role: "assistant",
        label: "Final",
        text: "Tool observation: scientific-calculator.solve_expression observed expression 8*9 result 72",
        meta: "terminal | final",
        status: "completed",
      },
    ])).toEqual([]);

    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    expect(legacyPill).toContain("selectHelixAskConsoleTurnTranscriptRowsForStream");
  });

  it("owns runtime picker labels and menu-vs-cycle view model", () => {
    const model = buildHelixAskRuntimePickerModel({
      selectedRuntime: "codex",
      providers: [
        {
          id: "helix",
          label: "Helix Ask Native",
          enabled: true,
          experimental: false,
          permission_profile: {
            id: "helix-native",
            label: "Helix native governed runtime",
            allows: { observe: true, read: true, act: true, write: false, shell: false, codeMutation: false },
          },
          supports: { streaming: true, workstationTools: true, codeMutation: false },
        },
        {
          id: "codex",
          label: "Codex Workstation Mode",
          enabled: true,
          experimental: false,
          permission_profile: {
            id: "read-observe-act",
            label: "Read/observe/action",
            allows: { observe: true, read: true, act: true, write: false, shell: false, codeMutation: false },
          },
          supports: { streaming: true, workstationTools: true, codeMutation: false },
        },
        {
          id: "future",
          label: "Future Agent Wrapper",
          enabled: false,
          experimental: true,
          permission_profile: {
            id: "read-observe",
            label: "Read/observe only",
            allows: { observe: true, read: true, act: false, write: false, shell: false, codeMutation: false },
          },
          supports: { streaming: false, workstationTools: false, codeMutation: false },
        },
      ],
    });

    expect(model.selectedLabel).toBe("Codex");
    expect(model.enabledProviderCount).toBe(2);
    expect(model.primaryButtonMode).toBe("cycle");
    expect(model.items.map((item) => ({
      id: item.id,
      shortLabel: item.shortLabel,
      selected: item.selected,
      statusLabel: item.statusLabel,
    }))).toEqual([
      { id: "helix", shortLabel: "Helix", selected: false, statusLabel: "on" },
      { id: "codex", shortLabel: "Codex", selected: true, statusLabel: "on" },
      { id: "future", shortLabel: "Future", selected: false, statusLabel: "off" },
    ]);

    const menuModel = buildHelixAskRuntimePickerModel({
      selectedRuntime: "helix",
      providers: model.items.map((item) => ({
        id: item.id,
        label: item.label,
        enabled: true,
        experimental: item.id === "future",
        permission_profile: {
          id: item.id === "helix" ? "helix-native" : "read-observe-act",
          label: "runtime",
          allows: { observe: true, read: true, act: true, write: false, shell: false, codeMutation: false },
        },
        supports: { streaming: true, workstationTools: true, codeMutation: false },
      })),
    });
    expect(menuModel.enabledProviderCount).toBe(3);
    expect(menuModel.primaryButtonMode).toBe("menu");

    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const runtimePicker = read("client/src/components/helix/ask-console/HelixAskRuntimePicker.tsx");
    expect(legacyPill).toContain("buildHelixAskRuntimePickerModel");
    expect(legacyPill).toContain("<HelixAskRuntimePicker");
    expect(legacyPill).toContain("model={agentRuntimePickerModel}");
    expect(legacyPill).toContain("onPrimaryClick={handleAgentRuntimeButtonClick}");
    expect(legacyPill).toContain("onSelect={handleAgentRuntimeSelect}");
    expect(legacyPill).not.toContain("agentRuntimePickerModel.items.map");
    expect(runtimePicker).toContain("model.items.map");
    expect(runtimePicker).toContain('aria-label="Choose Ask agent runtime"');
    expect(runtimePicker).toContain('aria-label="Ask agent runtime"');
    expect(runtimePicker).toContain("disabled={!provider.enabled}");
    expect(runtimePicker).not.toContain('fetch("/api/agi/agent-providers"');
  });

  it("owns prompt composer display state without submit-stream behavior", () => {
    expect(HELIX_ASK_CONSOLE_MAX_PROMPT_LINES).toBe(10);
    expect(buildHelixAskComposerViewModel({
      busy: false,
      placeholder: null,
    })).toMatchObject({
      inputPlaceholder: "Ask anything about this system",
      currentPlaceholder: "Ask anything about this system",
      maxPromptLines: 10,
      submitMode: "submit",
      submitAriaLabel: "Submit prompt",
      submitTitle: "Submit prompt",
      submitButtonType: "submit",
      submitIcon: "search",
    });
    expect(buildHelixAskComposerViewModel({
      busy: true,
      placeholder: "Ask the active doc",
    })).toMatchObject({
      inputPlaceholder: "Ask the active doc",
      currentPlaceholder: "Add another question...",
      maxPromptLines: 10,
      submitMode: "stop",
      submitAriaLabel: "Stop generation",
      submitTitle: "Stop generation",
      submitButtonType: "button",
      submitIcon: "square",
    });

    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const composer = read("client/src/components/helix/ask-console/HelixAskComposer.tsx");
    expect(legacyPill).toContain("buildHelixAskComposerViewModel");
    expect(legacyPill).toContain("<HelixAskComposerTextarea");
    expect(legacyPill).toContain("composerViewModel.textareaClassName");
    expect(legacyPill).toContain("onInputValue={(value, target)");
    expect(legacyPill).toContain("onSubmitRequested={(form) => form?.requestSubmit?.()}");
    expect(legacyPill).toContain("<HelixAskComposerSubmitButton");
    expect(legacyPill).toContain("viewModel={composerViewModel}");
    expect(legacyPill).toContain("onSubmitIntent={() => triggerAskActionHaptic()}");
    expect(legacyPill).toContain("handleStop();");
    expect(legacyPill).toContain("handleAskSubmit");
    expect(legacyPill).not.toContain("<textarea\n                aria-label=\"Ask Helix\"");
    expect(legacyPill).not.toContain("viewModel.submitButtonType");
    expect(composer).toContain("export const HelixAskComposerTextarea");
    expect(composer).toContain("export function HelixAskComposerSubmitButton");
    expect(composer).toContain('aria-label="Ask Helix"');
    expect(composer).toContain("onSubmitRequested(event.currentTarget.form)");
    expect(composer).toContain("title={viewModel.submitTitle}");
    expect(composer).toContain("type={viewModel.submitButtonType}");
    expect(composer).toContain("<Square className=");
    expect(composer).toContain("<Search className=");
    expect(composer).not.toContain("handleAskSubmit");
    expect(composer).not.toContain("runAskTurn");
  });

  it("owns action toolbar display while input and capture behavior stay in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const toolbar = read("client/src/components/helix/ask-console/HelixAskActionToolbar.tsx");

    expect(legacyPill).toContain("<HelixAskActionToolbar");
    expect(legacyPill).toContain("carouselRef={askActionCarouselRef}");
    expect(legacyPill).toContain("imageInputRef={askImageInputRef}");
    expect(legacyPill).toContain("onImageSelect={handleAskImageSelect}");
    expect(legacyPill).toContain("askImageInputRef.current?.click()");
    expect(legacyPill).toContain("handleVoiceInputToggle();");
    expect(legacyPill).toContain("handleVisualSituationSourceCapture();");
    expect(legacyPill).toContain("handleVisualSituationAudioPreferenceToggle();");
    expect(legacyPill).toContain("runtimePicker={");
    expect(legacyPill).toContain("submitButton={");
    expect(legacyPill).not.toContain('title="Attach image"');
    expect(legacyPill).not.toContain("<Plus className=");
    expect(legacyPill).not.toContain("<Mic className=");
    expect(legacyPill).not.toContain("<Headphones");
    expect(legacyPill).not.toContain('aria-label="Scroll Ask controls left"');

    expect(toolbar).toContain("export function HelixAskActionToolbar");
    expect(toolbar).toContain('title="Attach image"');
    expect(toolbar).toContain('const micTitle = micEnabled ? "Disable microphone" : "Enable microphone"');
    expect(toolbar).toContain('title="Capture visual source"');
    expect(toolbar).toContain("const visualAudioTitle = visualSituationIncludeAudio");
    expect(toolbar).toContain("<Plus className=");
    expect(toolbar).toContain("<Mic className=");
    expect(toolbar).toContain("<ImageIcon className=");
    expect(toolbar).toContain("<Headphones");
    expect(toolbar).toContain('aria-label="Scroll Ask controls left"');
    expect(toolbar).toContain('aria-label="Scroll Ask controls right"');
    expect(toolbar).toContain("{runtimePicker}");
    expect(toolbar).toContain("{submitButton}");
    expect(toolbar).not.toContain("handleAskImageSelect");
    expect(toolbar).not.toContain("handleVoiceInputToggle");
    expect(toolbar).not.toContain("handleVisualSituationSourceCapture");
    expect(toolbar).not.toContain("handleVisualSituationAudioPreferenceToggle");
    expect(toolbar).not.toContain("runAskTurn");
    expect(toolbar).not.toContain("navigator.clipboard");
  });

  it("owns the surface frame display while submit and audio priming stay in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const surfaceFrame = read("client/src/components/helix/ask-console/HelixAskSurfaceFrame.tsx");

    expect(legacyPill).toContain("<HelixAskSurfaceFrame");
    expect(legacyPill).toContain("layoutVariant={layoutVariant}");
    expect(legacyPill).toContain("maxWidthClassName={maxWidthClass}");
    expect(legacyPill).toContain("maxWidthStyle={formMaxWidthStyle}");
    expect(legacyPill).toContain("surfaceBorderClassName={moodPalette.surfaceBorder}");
    expect(legacyPill).toContain("surfaceTintClassName={moodPalette.surfaceTint}");
    expect(legacyPill).toContain("surfaceHaloClassName={moodPalette.surfaceHalo}");
    expect(legacyPill).toContain("isOffline={isOffline}");
    expect(legacyPill).toContain("onSubmit={handleAskSubmit}");
    expect(legacyPill).toContain("void primeVoiceAudioPlayback()");
    expect(legacyPill).not.toContain('layoutVariant === "dock" ? "min-h-0" : ""');
    expect(legacyPill).not.toContain("shadow-[0_24px_60px_rgba(0,0,0,0.55)]");
    expect(legacyPill).not.toContain("Offline - reconnecting\n");

    expect(surfaceFrame).toContain("export function HelixAskSurfaceFrame");
    expect(surfaceFrame).toContain('layoutVariant === "dock" ? "min-h-0" : ""');
    expect(surfaceFrame).toContain("transition-[max-width] duration-300 ease-out");
    expect(surfaceFrame).toContain("shadow-[0_24px_60px_rgba(0,0,0,0.55)]");
    expect(surfaceFrame).toContain("surfaceBorderClassName");
    expect(surfaceFrame).toContain("surfaceTintClassName");
    expect(surfaceFrame).toContain("surfaceHaloClassName");
    expect(surfaceFrame).toContain("onPointerDownCapture={onPrimeInteraction}");
    expect(surfaceFrame).toContain("onTouchStartCapture={onPrimeInteraction}");
    expect(surfaceFrame).toContain("onClickCapture={onPrimeInteraction}");
    expect(surfaceFrame).toContain("Offline - reconnecting");
    expect(surfaceFrame).not.toContain("handleAskSubmit");
    expect(surfaceFrame).not.toContain("primeVoiceAudioPlayback");
    expect(surfaceFrame).not.toContain("moodPalette");
    expect(surfaceFrame).not.toContain("setAskReplies");
    expect(surfaceFrame).not.toContain("runAskTurn");
  });

  it("owns mood avatar display while mood state stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const moodAvatar = read("client/src/components/helix/ask-console/HelixAskMoodAvatar.tsx");

    expect(legacyPill).toContain("<HelixAskMoodAvatar");
    expect(legacyPill).toContain("auraClassName={moodPalette.aura}");
    expect(legacyPill).toContain("ringClassName={moodRingClass}");
    expect(legacyPill).toContain("moodSrc={moodSrc}");
    expect(legacyPill).toContain("moodLabel={moodLabel}");
    expect(legacyPill).toContain("onImageError={() => setAskMoodBroken(true)}");
    expect(legacyPill).toContain("const moodSrc = askMoodBroken ? null : moodAsset?.sources[0] ?? null");
    expect(legacyPill).not.toContain("<BrainCircuit");
    expect(legacyPill).not.toContain('className="h-9 w-9 object-contain"');

    expect(moodAvatar).toContain("export function HelixAskMoodAvatar");
    expect(moodAvatar).toContain("<BrainCircuit");
    expect(moodAvatar).toContain('className="h-9 w-9 object-contain"');
    expect(moodAvatar).toContain("onError={onImageError}");
    expect(moodAvatar).not.toContain("setAskMoodBroken");
    expect(moodAvatar).not.toContain("askMoodBroken");
    expect(moodAvatar).not.toContain("resolveMoodAsset");
  });

  it("owns pure submit admission while leaving stream transport in the bridge", () => {
    expect(buildHelixAskSubmitAdmission({
      entries: ["  first  ", " second "],
      askBusy: false,
      compactionPausePending: false,
      hasPastedTextResumeFrameForSubmit: false,
      attachmentKinds: [],
      allEntriesArePastedTextResumeRecallPrompt: false,
    })).toMatchObject({
      normalizedEntries: ["first", "second"],
      singleEntry: null,
      shouldQueueForAskHandoff: false,
      queueReason: null,
      shouldReleaseConsumedPastedTextAttachmentForResume: false,
      shouldBlockQueuedAttachments: false,
      firstEntry: "first",
      restEntries: ["second"],
    });

    expect(buildHelixAskSubmitAdmission({
      entries: ["next question"],
      askBusy: true,
      compactionPausePending: false,
      hasPastedTextResumeFrameForSubmit: false,
      attachmentKinds: ["image"],
      allEntriesArePastedTextResumeRecallPrompt: false,
    })).toMatchObject({
      singleEntry: "next question",
      shouldQueueForAskHandoff: true,
      queueReason: "busy",
      shouldBlockQueuedAttachments: true,
    });

    expect(buildHelixAskSubmitAdmission({
      entries: ["resume from pasted text"],
      askBusy: false,
      compactionPausePending: true,
      hasPastedTextResumeFrameForSubmit: true,
      attachmentKinds: ["text"],
      allEntriesArePastedTextResumeRecallPrompt: true,
    })).toMatchObject({
      shouldQueueForAskHandoff: true,
      queueReason: "compaction_pause",
      shouldReleaseConsumedPastedTextAttachmentForResume: true,
      shouldBlockQueuedAttachments: false,
    });

    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    expect(legacyPill).toContain("buildHelixAskSubmitAdmission");
    expect(legacyPill).toContain("void runAsk(first, selectedCapsuleIds, runOptions)");
  });

  it("owns pure durable chat-session projection while policy stays injected", () => {
    const replies = buildHelixAskRepliesFromChatSessionProjection({
      session: {
        id: "session-1",
        messages: [
          {
            id: "assistant-late",
            role: "assistant",
            content: "Later answer",
            at: "2026-06-30T12:02:00.000Z",
          },
          {
            id: "user-early",
            role: "user",
            content: "What changed?",
            at: "2026-06-30T12:00:00.000Z",
            traceId: "trace-1",
          },
          {
            id: "assistant-early",
            role: "assistant",
            content: "  First answer  ",
            at: "2026-06-30T12:01:00.000Z",
          },
        ],
      },
      policy: {
        backendEntrypointRequiredErrorCode: "backend_ask_entry_required",
        backendEntrypointRequiredText: "Backend required.",
        isProgressPlaceholderText: (text) => text === "Generating...",
        requiresBackendEntrypoint: (question) => question.includes("tool"),
        isInvalidTerminalAnswerText: (text) => text === "invalid",
        renderTypedFailureFallback: (code) => `typed failure: ${code}`,
        nowMs: () => 123,
      },
    });

    expect(replies).toHaveLength(2);
    expect(replies[0]).toMatchObject({
      id: "helix-chat-turn:session-1:trace-1",
      content: "First answer",
      question: "What changed?",
      turn_id: "trace-1",
      ok: true,
      final_answer_source: "durable_chat_session",
      terminal_artifact_kind: "chat_final_answer",
      debug: {
        durable_chat_projection: true,
        blocked_projection_kind: null,
        session_id: "session-1",
        user_message_id: "user-early",
        assistant_message_id: "assistant-early",
      },
    });
    expect(replies[1]).toMatchObject({
      id: "helix-chat-turn:session-1:standalone:assistant-late",
      content: "Later answer",
      question: "",
    });
  });

  it("keeps durable chat projection from bypassing hard backend or terminal authority", () => {
    const replies = buildHelixAskRepliesFromChatSessionProjection({
      session: {
        id: "session-2",
        messages: [
          {
            id: "user-tool",
            role: "user",
            content: "Use calculator tool",
            at: "2026-06-30T12:00:00.000Z",
          },
          {
            id: "assistant-tool",
            role: "assistant",
            content: "Tool-looking durable answer",
            at: "2026-06-30T12:01:00.000Z",
          },
          {
            id: "user-invalid",
            role: "user",
            content: "Normal question",
            at: "2026-06-30T12:02:00.000Z",
          },
          {
            id: "assistant-invalid",
            role: "assistant",
            content: "invalid",
            at: "2026-06-30T12:03:00.000Z",
          },
        ],
      },
      policy: {
        backendEntrypointRequiredErrorCode: "backend_ask_entry_required",
        backendEntrypointRequiredText: "Backend required.",
        isProgressPlaceholderText: () => false,
        requiresBackendEntrypoint: (question) => question.includes("tool"),
        isInvalidTerminalAnswerText: (text) => text === "invalid",
        renderTypedFailureFallback: (code) => `typed failure: ${code}`,
      },
    });

    expect(replies.map((reply) => reply.content)).toEqual([
      "Backend required.",
      "typed failure: terminal_authority_missing",
    ]);
    expect(replies.map((reply) => reply.terminal_error_code)).toEqual([
      "backend_ask_entry_required",
      "terminal_authority_missing",
    ]);
    expect(replies.every((reply) => reply.final_answer_source === "typed_failure")).toBe(true);
  });

  it("suppresses generated Stage Play mailbox durable projections", () => {
    expect(shouldSuppressGeneratedStagePlayMailWakeChatProjection(
      {
        id: "user-mail",
        role: "user",
        content: "stage_play_live_source_mail_wake:abc",
        at: "2026-06-30T12:00:00.000Z",
      },
      {
        id: "assistant-mail",
        role: "assistant",
        content: "The live-source mailbox route completed.",
        at: "2026-06-30T12:01:00.000Z",
      },
    )).toBe(true);

    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    expect(legacyPill).toContain("buildHelixAskRepliesFromChatSessionProjection");
    expect(legacyPill).not.toContain("STAGE_PLAY_MAIL_WAKE_PROMPT_PATTERNS");
  });

  it("owns pure reply lifecycle ordering while state mutation stays in the bridge", () => {
    const replies = [
      {
        id: "late",
        content: "late",
        createdAtMs: 300,
      },
      {
        id: "first-shell",
        turn_id: "same-turn",
        content: "old",
        createdAtMs: 200,
      },
      {
        id: "first-update",
        turn_id: "same-turn",
        content: "new",
        debug: { created_at_ms: 100 },
      },
    ];

    expect(resolveHelixAskConsoleReplyCanonicalKey(replies[1])).toBe("same-turn");
    expect(sortHelixAskConsoleRepliesChronologically(replies).map((reply) => reply.id)).toEqual([
      "first-shell",
      "late",
    ]);
    expect(sortHelixAskConsoleRepliesChronologically(replies)[0]).toMatchObject({
      id: "first-shell",
      content: "new",
      createdAtMs: 200,
    });
    expect(appendHelixAskConsoleReplyChronologically(replies.slice(0, 1), {
      id: "early",
      content: "early",
      createdAtMs: 100,
    }, 2).map((reply) => reply.id)).toEqual(["early", "late"]);

    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    expect(legacyPill).toContain("appendHelixAskConsoleReplyChronologically");
    expect(legacyPill).toContain("setAskReplies");
  });

  it("owns pure active stream and brief-lane reply decisions", () => {
    expect(shouldRenderHelixAskConsoleActiveTurnStream({
      askBusy: true,
      activeTurnId: "active-turn",
      latestReply: {
        id: "reply",
        turn_id: "completed-turn",
        content: "done",
      },
    })).toBe(true);
    expect(shouldRenderHelixAskConsoleActiveTurnStream({
      askBusy: true,
      activeTurnId: "active-turn",
      latestReply: {
        id: "reply",
        turn_id: "active-turn",
        content: "done",
      },
    })).toBe(false);
    expect(shouldKeepHelixAskConsoleReplyInBriefLane({
      answer_path: ["ForcedAnswer:Smalltalk_Fast_Path"],
    })).toBe(true);
    expect(shouldKeepHelixAskConsoleReplyInBriefLane({
      answer_path: ["normal"],
    })).toBe(false);
  });

  it("owns pure chat persistence payloads while store mutation stays in the bridge", () => {
    expect(buildHelixAskConsoleChatMessagePayload({
      role: "user",
      content: "Ask the active doc.",
      traceId: " trace-1 ",
    })).toEqual({
      role: "user",
      content: "Ask the active doc.",
      traceId: "trace-1",
    });
    expect(buildHelixAskConsoleChatMessagePayload({
      role: "assistant",
      content: "",
      traceId: "trace-1",
    })).toBeNull();
    expect(buildHelixAskConsoleChatTurnPayloads({
      userContent: "Question",
      assistantContent: "Answer",
      traceId: "turn-1",
    })).toEqual([
      { role: "user", content: "Question", traceId: "turn-1" },
      { role: "assistant", content: "Answer", traceId: "turn-1" },
    ]);

    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const chatPersistence = read("client/src/components/helix/ask-console/HelixAskChatPersistence.ts");
    expect(legacyPill).toContain("buildHelixAskConsoleChatMessagePayload");
    expect(legacyPill).toContain("addHelixAskLegacyChatMessage(addMessage");
    expect(legacyPill).toContain("addHelixAskLegacyChatTurnMessages(addMessage");
    expect(legacyPill).not.toContain('addMessage(sessionId, { role: "user"');
    expect(legacyPill).not.toContain('addMessage(sessionId, { role: "assistant"');
    expect(legacyPill).not.toContain("userMessagePayload");
    expect(legacyPill).not.toContain("assistantMessagePayload");
    expect(chatPersistence).not.toContain("addMessage");
    expect(chatPersistence).not.toContain("setActive");
    expect(chatPersistence).not.toContain("ensureContextSession");
  });

  it("owns final-answer control button display while the bridge keeps behavior handlers", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const turnStreamPanel = read("client/src/components/helix/ask-console/HelixAskTurnStreamPanel.tsx");
    const turnControls = read("client/src/components/helix/ask-console/HelixAskTurnControls.tsx");

    expect(legacyPill).toContain("<HelixAskTurnStreamPanel");
    expect(legacyPill).toContain("onCopyFinal={() => void handleCopyReply(reply, latestTurnBinding.finalAnswerText)}");
    expect(legacyPill).toContain("onReadAloud={() => void handleReadAloud(reply, latestTurnBinding.finalAnswerText)}");
    expect(legacyPill).toContain("debugCopyTestId={latestTurnBinding.debugCopyTestId}");
    expect(legacyPill).not.toContain("<Copy className=");
    expect(legacyPill).not.toContain("<Bug className=");
    expect(legacyPill).not.toContain("<Volume2 className=");

    expect(turnStreamPanel).toContain("<HelixAskTurnControls");
    expect(turnStreamPanel).toContain("onCopyFinal={onCopyFinal}");
    expect(turnStreamPanel).toContain("onDebugCopy={onDebugCopy}");
    expect(turnStreamPanel).toContain("onReadAloud={onReadAloud}");
    expect(turnControls).toContain('aria-label="Copy response"');
    expect(turnControls).toContain('title="Unified Debug Copy"');
    expect(turnControls).toContain("readAloudActive");
    expect(turnControls).not.toContain("handleCopyReply");
    expect(turnControls).not.toContain("handleCopyReplyMasterDebug");
    expect(turnControls).not.toContain("handleReadAloud");
    expect(turnControls).not.toContain("navigator.clipboard");
    expect(turnControls).not.toContain("speechSynthesis");
  });

  it("owns debug export drawer display while the bridge keeps selected drawer state", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const debugDrawer = read("client/src/components/helix/ask-console/HelixAskDebugDrawer.tsx");

    expect(legacyPill).toContain("<HelixAskDebugDrawer");
    expect(legacyPill).toContain("payload={debugExportDrawer.payload}");
    expect(legacyPill).toContain("readbackMatch={debugExportDrawer.result.readback_match}");
    expect(legacyPill).toContain("onClose={() => setDebugExportDrawer(null)}");
    expect(legacyPill).not.toContain('data-testid="helix-debug-export-json"');
    expect(legacyPill).not.toContain("Download JSON");

    expect(debugDrawer).toContain('aria-label="Debug Export drawer"');
    expect(debugDrawer).toContain('data-testid="helix-debug-export-drawer"');
    expect(debugDrawer).toContain('data-testid="helix-debug-export-json"');
    expect(debugDrawer).toContain("download={`helix-debug-${replyId}.json`}");
    expect(debugDrawer).toContain("Clipboard readback: {readbackMatch} | hash {payloadHash}");
    expect(debugDrawer).not.toContain("setDebugExportDrawer");
    expect(debugDrawer).not.toContain("buildDebugExport");
    expect(debugDrawer).not.toContain("navigator.clipboard");
  });

  it("owns turn-list shell display while the bridge keeps reply projection", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const turnList = read("client/src/components/helix/ask-console/HelixAskTurnList.tsx");

    expect(legacyPill).toContain("<HelixAskTurnList");
    expect(legacyPill).toContain("consoleDebugSnapshot={helixAskConsoleDebugSnapshot}");
    expect(legacyPill).toContain("activeTurnStreamPanel={activeTurnStreamPanel}");
    expect(legacyPill).toContain("bottomRef={askReplyListBottomRef}");
    expect(legacyPill).toContain("chronologicalAskReplies.map");
    expect(legacyPill).not.toContain('data-testid="helix-ask-reply-list-bottom"');
    expect(legacyPill).not.toContain('data-testid="helix-ask-console-debug"');
    expect(legacyPill).not.toContain("@keyframes helixAskTurnFadeIn");

    expect(turnList).toContain('data-testid="helix-ask-reply-list-bottom"');
    expect(turnList).toContain('data-testid="helix-ask-console-debug"');
    expect(turnList).toContain("@keyframes helixAskTurnFadeIn");
    expect(turnList).toContain("helix-ask-turn-line-enter");
    expect(turnList.indexOf("{children}")).toBeLessThan(turnList.indexOf("{activeTurnStreamPanel}"));
    expect(turnList.indexOf("{activeTurnStreamPanel}")).toBeLessThan(turnList.indexOf('data-testid="helix-ask-reply-list-bottom"'));
    expect(turnList).not.toContain("chronologicalAskReplies.map");
    expect(turnList).not.toContain("buildHelixTurnTranscriptRows");
    expect(turnList).not.toContain("resolveHelixAskVisibleTerminal");
  });

  it("owns completed reply card shell display while reply projection stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const replyCard = read("client/src/components/helix/ask-console/HelixAskReplyCard.tsx");

    expect(legacyPill).toContain("<HelixAskReplyCard");
    expect(legacyPill).toContain("turnTestId={latestTurnBinding.turnTestId}");
    expect(legacyPill).toContain("isLatestReply={isLatestReply}");
    expect(legacyPill).toContain("tintClassName={moodPalette.replyTint}");
    expect(legacyPill).toContain("contextCapsule={reply.contextCapsule}");
    expect(legacyPill).toContain("promptIngested={reply.promptIngested}");
    expect(legacyPill).toContain("const isLatestReply = reply.id === transcriptLatestAskReplyId");
    expect(legacyPill).not.toContain("className={`relative px-1 py-1 text-sm text-slate-100 ${isLatestReply ? \"helix-ask-turn-enter\" : \"\"}`}");
    expect(legacyPill).not.toContain("pointer-events-none absolute inset-0 opacity-0 ${moodPalette.replyTint}");

    expect(replyCard).toContain("export function HelixAskReplyCard");
    expect(replyCard).toContain('className={`relative px-1 py-1 text-sm text-slate-100 ${isLatestReply ? "helix-ask-turn-enter" : ""}`}');
    expect(replyCard).toContain("data-testid={turnTestId}");
    expect(replyCard).toContain("pointer-events-none absolute inset-0 opacity-0 ${tintClassName}");
    expect(replyCard).toContain("<HelixAskReplyContextCapsuleCard capsule={contextCapsule} />");
    expect(replyCard).toContain("<HelixAskReplyStatusFooter visible={isLatestReply} promptIngested={promptIngested} />");
    expect(replyCard).not.toContain("buildHelixTurnTranscriptRows");
    expect(replyCard).not.toContain("resolveHelixAskVisibleTerminal");
    expect(replyCard).not.toContain("handleCopyReply");
    expect(replyCard).not.toContain("transcriptLatestAskReplyId");
  });

  it("owns active turn stream panel display while active stream projection stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const activeStreamPanel = read("client/src/components/helix/ask-console/HelixAskActiveTurnStreamPanel.tsx");

    expect(legacyPill).toContain("<HelixAskActiveTurnStreamPanel");
    expect(legacyPill).toContain("rows={visibleActiveTurnStreamRows}");
    expect(legacyPill).toContain("activeTurnId={activeAskTurnIdRef.current}");
    expect(legacyPill).toContain("activeTraceId={askLiveTraceId}");
    expect(legacyPill).toContain("renderFinalAnswerContent={renderHelixAskFinalAnswerContent}");
    expect(legacyPill).toContain("readRowClass={readHelixContinuousTurnStreamRowClass}");
    expect(legacyPill).toContain("readDotClass={readHelixContinuousTurnStreamDotClass}");
    expect(legacyPill).toContain("renderPlacement: \"after_completed_replies\"");
    expect(legacyPill).not.toContain("visibleActiveTurnStreamRows.map((row, index)");
    expect(legacyPill).not.toContain('data-testid="helix-ask-active-turn-stream-row"');
    expect(legacyPill).not.toContain('data-render-placement="after_completed_replies"');

    expect(activeStreamPanel).toContain("export function HelixAskActiveTurnStreamPanel");
    expect(activeStreamPanel).toContain("if (rows.length === 0) return null");
    expect(activeStreamPanel).toContain('data-testid="helix-ask-active-turn-stream"');
    expect(activeStreamPanel).toContain('data-testid="helix-ask-active-turn-stream-row"');
    expect(activeStreamPanel).toContain('data-testid="helix-ask-active-turn-latest-line"');
    expect(activeStreamPanel).toContain('data-render-placement="after_completed_replies"');
    expect(activeStreamPanel).toContain("rows.map((row, index)");
    expect(activeStreamPanel).toContain("readRowClass(row.tone)");
    expect(activeStreamPanel).toContain("readDotClass(row.tone)");
    expect(activeStreamPanel).not.toContain("visibleActiveTurnStreamRows");
    expect(activeStreamPanel).not.toContain("activeAskTurnIdRef");
    expect(activeStreamPanel).not.toContain("askLiveTraceId");
  });

  it("owns attachment strip display while validation and mutation stay in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const attachmentStrip = read("client/src/components/helix/ask-console/HelixAskAttachmentStrip.tsx");

    expect(legacyPill).toContain("<HelixAskAttachmentStrip");
    expect(legacyPill).toContain("items={askAttachmentCommitChecks}");
    expect(legacyPill).toContain("onRemove={removeAskAttachment}");
    expect(legacyPill).toContain("validateHelixAskAttachmentForSubmit");
    expect(legacyPill).not.toContain("askAttachmentCommitChecks.map");
    expect(legacyPill).not.toContain("image ready");
    expect(legacyPill).not.toContain("text needs reattach");
    expect(legacyPill).not.toContain("<FileText className=");
    expect(legacyPill).not.toContain("<X className=");

    expect(attachmentStrip).toContain("export function HelixAskAttachmentStrip");
    expect(attachmentStrip).toContain("items.map");
    expect(attachmentStrip).toContain("image ready");
    expect(attachmentStrip).toContain("text needs reattach");
    expect(attachmentStrip).toContain("onRemove(attachment.id)");
    expect(attachmentStrip).not.toContain("validateHelixAskAttachmentForSubmit");
    expect(attachmentStrip).not.toContain("removeAskAttachment");
    expect(attachmentStrip).not.toContain("FileReader");
  });

  it("owns ask error-line display while error state stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const statusLine = read("client/src/components/helix/ask-console/HelixAskStatusLine.tsx");

    expect(legacyPill).toContain("<HelixAskErrorLine message={askError} />");
    expect(legacyPill).toContain("setAskError");
    expect(legacyPill).not.toContain('<p className="mt-3 text-xs text-rose-200">{askError}</p>');

    expect(statusLine).toContain("export function HelixAskErrorLine");
    expect(statusLine).toContain("if (!message) return null");
    expect(statusLine).toContain('className="mt-3 text-xs text-rose-200"');
    expect(statusLine).not.toContain("setAskError");
  });

  it("owns voice status pill display while voice capture state stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const statusLine = read("client/src/components/helix/ask-console/HelixAskStatusLine.tsx");

    expect(legacyPill).toContain("<HelixAskVoiceStatusPill label={voiceInputStatusLabel} state={voiceInputState} />");
    expect(legacyPill).toContain("buildVoiceInputStatusLabel");
    expect(legacyPill).toContain("setVoiceInputState");
    expect(legacyPill).not.toContain("{voiceInputStatusLabel ? (");
    expect(legacyPill).not.toContain("border-emerald-300/40 bg-emerald-500/10 text-emerald-100");

    expect(statusLine).toContain("export function HelixAskVoiceStatusPill");
    expect(statusLine).toContain('state === "listening"');
    expect(statusLine).toContain("border-emerald-300/40 bg-emerald-500/10 text-emerald-100");
    expect(statusLine).not.toContain("buildVoiceInputStatusLabel");
    expect(statusLine).not.toContain("setVoiceInputState");
  });

  it("owns voice level monitor display while voice capture metrics stay in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const voiceLevelMonitor = read("client/src/components/helix/ask-console/HelixAskVoiceLevelMonitor.tsx");

    expect(legacyPill).toContain("<HelixAskVoiceLevelMonitor");
    expect(legacyPill).toContain("visible={showTopInputLevelMonitor}");
    expect(legacyPill).toContain("maxHeightPx={voiceMonitorMaxHeightPx}");
    expect(legacyPill).toContain("level={voiceMonitorLevel}");
    expect(legacyPill).toContain("signalState={voiceSignalState}");
    expect(legacyPill).toContain("anchorRef={voiceMonitorAnchorRef}");
    expect(legacyPill).toContain("voiceMeterStats.displayLevel");
    expect(legacyPill).not.toContain("Array.from({ length: 16 }).map");
    expect(legacyPill).not.toContain("Voice input level meter:");
    expect(legacyPill).not.toContain("bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.85)]");

    expect(voiceLevelMonitor).toContain("export function HelixAskVoiceLevelMonitor");
    expect(voiceLevelMonitor).toContain("aria-hidden={!visible}");
    expect(voiceLevelMonitor).toContain("Array.from({ length: 16 }).map");
    expect(voiceLevelMonitor).toContain("Voice input level meter:");
    expect(voiceLevelMonitor).toContain("level >= threshold");
    expect(voiceLevelMonitor).toContain("Math.max(0, maxHeightPx)");
    expect(voiceLevelMonitor).not.toContain("voiceMeterStats");
    expect(voiceLevelMonitor).not.toContain("setVoiceInputState");
    expect(voiceLevelMonitor).not.toContain("MediaRecorder");
  });

  it("owns context memory status display while memory state stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const statusLine = read("client/src/components/helix/ask-console/HelixAskStatusLine.tsx");

    expect(legacyPill).toContain("<HelixAskContextMemoryStatusLine text={contextMemoryStatusText} />");
    expect(legacyPill).toContain("SESSION_CAPSULE_CONFIDENCE_LABEL");
    expect(legacyPill).toContain("sessionCapsuleState.confidenceBand");
    expect(legacyPill).not.toContain("{contextMemoryStatusText ? (");
    expect(legacyPill).not.toContain('text-emerald-200/85">\\n                {contextMemoryStatusText}');

    expect(statusLine).toContain("export function HelixAskContextMemoryStatusLine");
    expect(statusLine).toContain("if (!text) return null");
    expect(statusLine).toContain("text-emerald-200/85");
    expect(statusLine).not.toContain("SESSION_CAPSULE_CONFIDENCE_LABEL");
    expect(statusLine).not.toContain("sessionCapsuleState");
  });

  it("owns conversation brief display while observer selection stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const observerLane = read("client/src/components/helix/ask-console/HelixAskObserverLane.tsx");

    expect(legacyPill).toContain("<HelixAskConversationBriefPanel text={latestConversationBrief?.text} />");
    expect(legacyPill).toContain("userSettings.showHelixAskObserverLane");
    expect(legacyPill).toContain("latestConversationBrief");
    expect(legacyPill).not.toContain('<p className="text-[9px] uppercase tracking-[0.14em] text-cyan-300/80">brief</p>');

    expect(observerLane).toContain("export function HelixAskConversationBriefPanel");
    expect(observerLane).toContain("if (!text) return null");
    expect(observerLane).toContain(">brief</p>");
    expect(observerLane).not.toContain("latestConversationBrief");
    expect(observerLane).not.toContain("showHelixAskObserverLane");
  });

  it("owns context chooser display while chooser state and execution stay in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const observerLane = read("client/src/components/helix/ask-console/HelixAskObserverLane.tsx");

    expect(legacyPill).toContain("<HelixAskContextChooserPanel");
    expect(legacyPill).toContain("visible={Boolean(askContextChooser)}");
    expect(legacyPill).toContain("autoContextMode={askContextChooser?.autoContextMode}");
    expect(legacyPill).toContain("countdownSec={askContextChooserCountdownSec}");
    expect(legacyPill).toContain("onRunAttached={handleAskContextChooserRunAttached}");
    expect(legacyPill).toContain("onRunIsolated={handleAskContextChooserRunIsolated}");
    expect(legacyPill).toContain("onCancel={dismissAskContextChooser}");
    expect(legacyPill).toContain("setAskContextChooser");
    expect(legacyPill).toContain("executeAskWithContextMode");
    expect(legacyPill).not.toContain("Reasoning context");
    expect(legacyPill).not.toContain("Attach current workspace context to this reasoning turn?");

    expect(observerLane).toContain("export function HelixAskContextChooserPanel");
    expect(observerLane).toContain("if (!visible) return null");
    expect(observerLane).toContain("Reasoning context");
    expect(observerLane).toContain("Attach current workspace context to this reasoning turn?");
    expect(observerLane).toContain("Auto-running isolated in ${countdownSec}s.");
    expect(observerLane).toContain("onClick={onRunAttached}");
    expect(observerLane).toContain("onClick={onRunIsolated}");
    expect(observerLane).toContain("onClick={onCancel}");
    expect(observerLane).not.toContain("executeAskWithContextMode");
    expect(observerLane).not.toContain("setAskContextChooser");
  });

  it("owns observer lane event display while event selection stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const observerLane = read("client/src/components/helix/ask-console/HelixAskObserverLane.tsx");

    expect(legacyPill).toContain("<HelixAskObserverLanePanel");
    expect(legacyPill).toContain("events={observerLaneEvents}");
    expect(legacyPill).toContain("clipText={clipText}");
    expect(legacyPill).toContain("const observerLaneEvents = useMemo");
    expect(legacyPill).toContain("observer_lane_commentary");
    expect(legacyPill).not.toContain("Observer lane</p>");
    expect(legacyPill).not.toContain("Waiting for observer events...");
    expect(legacyPill).not.toContain("observerLaneEvents.map");

    expect(observerLane).toContain("export function HelixAskObserverLanePanel");
    expect(observerLane).toContain("events.map");
    expect(observerLane).toContain("Observer lane");
    expect(observerLane).toContain("Waiting for observer events...");
    expect(observerLane).toContain("toLocaleTimeString");
    expect(observerLane).not.toContain("observer_lane_commentary");
    expect(observerLane).not.toContain("helixTimeline");
  });

  it("owns steering queue panel display while queue construction and expansion state stay in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const steeringPanel = read("client/src/components/helix/ask-console/HelixAskSteeringQueuePanel.tsx");
    const steeringDisplay = read("client/src/lib/helix/ask-steering-queue-display.ts");

    expect(legacyPill).toContain("<HelixAskSteeringQueuePanel");
    expect(legacyPill).toContain("items={steeringQueueItems}");
    expect(legacyPill).toContain("activeCount={activeSteeringQueueCount}");
    expect(legacyPill).toContain("expanded={steeringQueueExpanded}");
    expect(legacyPill).toContain("onToggleExpanded={() => setSteeringQueueExpanded((current) => !current)}");
    expect(legacyPill).toContain("buildHelixAskSteeringQueueItems");
    expect(legacyPill).toContain("shouldAutoWakeHelixMailboxQueueItem");
    expect(legacyPill).not.toContain("steeringQueueItems.map((item, index)");
    expect(legacyPill).not.toContain('aria-controls="helix-ask-steering-queue-items"');
    expect(legacyPill).not.toContain("readHelixSteeringQueueItemClass(item)");
    expect(legacyPill).not.toContain("readHelixSteeringQueueDotClass(item)");

    expect(steeringPanel).toContain("export function HelixAskSteeringQueuePanel");
    expect(steeringPanel).toContain("if (items.length === 0) return null");
    expect(steeringPanel).toContain('aria-label="Helix Ask steering queue"');
    expect(steeringPanel).toContain('aria-controls="helix-ask-steering-queue-items"');
    expect(steeringPanel).toContain('data-expanded={expanded ? "true" : "false"}');
    expect(steeringPanel).toContain('{expanded ? "Hide" : "Show"}');
    expect(steeringPanel).toContain("items.map((item, index)");
    expect(steeringPanel).toContain("readHelixSteeringQueueItemClass(item)");
    expect(steeringPanel).toContain("readHelixSteeringQueueDotClass(item)");
    expect(steeringPanel).not.toContain("setSteeringQueueExpanded");
    expect(steeringPanel).not.toContain("buildHelixAskSteeringQueueItems");
    expect(steeringPanel).not.toContain("shouldAutoWakeHelixMailboxQueueItem");

    expect(steeringDisplay).toContain("export function buildHelixAskSteeringQueueItems");
    expect(steeringDisplay).toContain("export function shouldAutoWakeHelixMailboxQueueItem");
  });

  it("owns context capsule preview display while capsule state derivation stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const capsulePreview = read("client/src/components/helix/ask-console/HelixAskContextCapsulePreview.tsx");

    expect(legacyPill).toContain("<HelixAskContextCapsulePreview");
    expect(legacyPill).toContain("preview={activeContextCapsulePreview}");
    expect(legacyPill).toContain("autoApplied={Boolean(sessionCapsuleState)}");
    expect(legacyPill).toContain("deriveSessionCapsuleState");
    expect(legacyPill).toContain("activeContextCapsulePreview");
    expect(legacyPill).not.toContain("visual key detected");
    expect(legacyPill).not.toContain("auto-applied");
    expect(legacyPill).not.toContain("CONVERGENCE_SOURCE_LABEL[activeContextCapsulePreview");

    expect(capsulePreview).toContain("export function HelixAskContextCapsulePreview");
    expect(capsulePreview).toContain("buildContextCapsuleStampDataUri(preview.summary.stamp)");
    expect(capsulePreview).toContain("CONVERGENCE_SOURCE_LABEL[preview.convergence.source]");
    expect(capsulePreview).toContain("visual key detected");
    expect(capsulePreview).toContain("auto-applied");
    expect(capsulePreview).not.toContain("deriveSessionCapsuleState");
    expect(capsulePreview).not.toContain("sessionCapsuleState");
  });

  it("owns reply context capsule card display while reply state stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const replyCard = read("client/src/components/helix/ask-console/HelixAskReplyCard.tsx");
    const capsulePreview = read("client/src/components/helix/ask-console/HelixAskContextCapsulePreview.tsx");

    expect(legacyPill).toContain("<HelixAskReplyCard");
    expect(legacyPill).toContain("contextCapsule={reply.contextCapsule}");
    expect(legacyPill).toContain("contextCapsule: responseContextCapsule");
    expect(legacyPill).toContain("buildContextCapsuleCopyText(reply.contextCapsule)");
    expect(legacyPill).not.toContain("<HelixAskReplyContextCapsuleCard");
    expect(legacyPill).not.toContain("buildContextCapsuleStampDataUri(reply.contextCapsule.stamp)");
    expect(legacyPill).not.toContain('alt="Context capsule fingerprint"\\n                          className="mt-1 h-10 w-44');

    expect(replyCard).toContain("<HelixAskReplyContextCapsuleCard capsule={contextCapsule} />");
    expect(replyCard).not.toContain("responseContextCapsule");
    expect(replyCard).not.toContain("buildContextCapsuleCopyText");
    expect(capsulePreview).toContain("export function HelixAskReplyContextCapsuleCard");
    expect(capsulePreview).toContain("if (!capsule) return null");
    expect(capsulePreview).toContain("buildContextCapsuleStampDataUri(capsule.stamp)");
    expect(capsulePreview).toContain(">Context capsule</p>");
    expect(capsulePreview).toContain("auto\n        </span>");
    expect(capsulePreview).not.toContain("responseContextCapsule");
    expect(capsulePreview).not.toContain("buildContextCapsuleCopyText");
  });

  it("owns Situation Room source panel display while source state stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const situationPanel = read("client/src/components/helix/ask-console/HelixAskSituationRoomSourcePanel.tsx");

    expect(legacyPill).toContain("<HelixAskSituationRoomSourcePanel");
    expect(legacyPill).toContain("visible={showSituationRoomSourcePanel}");
    expect(legacyPill).toContain("onStopDisplayAudio={stopDisplayAudioCapture}");
    expect(legacyPill).toContain("displayAudioSourceSnapshot");
    expect(legacyPill).toContain("situationRoomState.recentEvents.length");
    expect(legacyPill).not.toContain("Situation Room Source");
    expect(legacyPill).not.toContain("Awaiting transcript chunks.");
    expect(legacyPill).not.toContain("Stop source");

    expect(situationPanel).toContain("export function HelixAskSituationRoomSourcePanel");
    expect(situationPanel).toContain("if (!visible) return null");
    expect(situationPanel).toContain("Situation Room Source");
    expect(situationPanel).toContain("Awaiting transcript chunks.");
    expect(situationPanel).toContain("Stop source");
    expect(situationPanel).toContain("onClick={onStopDisplayAudio}");
    expect(situationPanel).not.toContain("displayAudioSourceSnapshot");
    expect(situationPanel).not.toContain("situationRoomState");
    expect(situationPanel).not.toContain("stopDisplayAudioCapture");
  });

  it("owns voice command confirmation display while command policy stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const voiceConfirmation = read("client/src/components/helix/ask-console/HelixAskVoiceConfirmationPanel.tsx");

    expect(legacyPill).toContain("<HelixAskVoiceCommandConfirmationPanel");
    expect(legacyPill).toContain("visible={!transcriptConfirmState && Boolean(commandConfirmState)}");
    expect(legacyPill).toContain("actionLabel={commandConfirmState ? describeVoiceCommandAction(commandConfirmState.action) : \"\"}");
    expect(legacyPill).toContain("onAccept={handleCommandConfirmationAccept}");
    expect(legacyPill).toContain("onCancel={handleCommandConfirmationCancel}");
    expect(legacyPill).toContain("setCommandConfirmState");
    expect(legacyPill).not.toContain("Voice command</p>");
    expect(legacyPill).not.toContain("Auto-confirming in {commandConfirmAutoCountdownSec}s");

    expect(voiceConfirmation).toContain("export function HelixAskVoiceCommandConfirmationPanel");
    expect(voiceConfirmation).toContain("if (!visible) return null");
    expect(voiceConfirmation).toContain("Voice command");
    expect(voiceConfirmation).toContain("Auto-confirming in {countdownSec}s");
    expect(voiceConfirmation).toContain("onClick={onAccept}");
    expect(voiceConfirmation).toContain("onClick={onCancel}");
    expect(voiceConfirmation).not.toContain("describeVoiceCommandAction");
    expect(voiceConfirmation).not.toContain("setCommandConfirmState");
  });

  it("owns transcript confirmation display while transcript policy stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const voiceConfirmation = read("client/src/components/helix/ask-console/HelixAskVoiceConfirmationPanel.tsx");

    expect(legacyPill).toContain("<HelixAskTranscriptConfirmationPanel");
    expect(legacyPill).toContain("visible={Boolean(transcriptConfirmState)}");
    expect(legacyPill).toContain("countdownSec={transcriptConfirmAutoCountdownSec}");
    expect(legacyPill).toContain("onAccept={handleTranscriptConfirmationAccept}");
    expect(legacyPill).toContain("onRetry={handleTranscriptConfirmationRetry}");
    expect(legacyPill).toContain("setTranscriptConfirmState");
    expect(legacyPill).not.toContain("Confirm transcript</p>");
    expect(legacyPill).not.toContain("Auto-confirming in {transcriptConfirmAutoCountdownSec}s");

    expect(voiceConfirmation).toContain("export function HelixAskTranscriptConfirmationPanel");
    expect(voiceConfirmation).toContain("showSourceText");
    expect(voiceConfirmation).toContain("Confirm transcript");
    expect(voiceConfirmation).toContain("Auto-confirming in {countdownSec}s");
    expect(voiceConfirmation).toContain("onClick={onAccept}");
    expect(voiceConfirmation).toContain("onClick={onRetry}");
    expect(voiceConfirmation).not.toContain("setTranscriptConfirmState");
  });
});
