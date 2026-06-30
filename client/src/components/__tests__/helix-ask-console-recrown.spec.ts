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
      "HelixAskTurnList.tsx",
      "HelixAskFinalAnswer.tsx",
      "HelixAskTurnControls.tsx",
      "HelixAskDebugDrawer.tsx",
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
    expect(finalAnswerSource).not.toMatch(/\b(?:line-clamp|max-h-|overflow-hidden|truncate|text-ellipsis|whitespace-nowrap)\b/);

    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    expect(legacyPill).toContain("buildHelixAskFinalAnswerBlocks");
    expect(legacyPill).not.toContain("parseHelixAskFinalAnswerBulletLine");
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
    expect(legacyPill).toContain("buildHelixAskRuntimePickerModel");
    expect(legacyPill).toContain("agentRuntimePickerModel.items.map");
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
    expect(legacyPill).toContain("buildHelixAskComposerViewModel");
    expect(legacyPill).toContain("composerViewModel.textareaClassName");
    expect(legacyPill).toContain("composerViewModel.submitButtonType");
    expect(legacyPill).toContain("handleAskSubmit");
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
    const turnControls = read("client/src/components/helix/ask-console/HelixAskTurnControls.tsx");

    expect(legacyPill).toContain("<HelixAskTurnControls");
    expect(legacyPill).toContain("onCopyFinal={() => void handleCopyReply(reply, latestTurnBinding.finalAnswerText)}");
    expect(legacyPill).toContain("onReadAloud={() => void handleReadAloud(reply, latestTurnBinding.finalAnswerText)}");
    expect(legacyPill).toContain("debugCopyTestId={latestTurnBinding.debugCopyTestId}");
    expect(legacyPill).not.toContain("<Copy className=");
    expect(legacyPill).not.toContain("<Bug className=");
    expect(legacyPill).not.toContain("<Volume2 className=");

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
});
