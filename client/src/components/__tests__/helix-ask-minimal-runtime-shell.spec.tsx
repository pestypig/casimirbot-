// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HelixAskConsoleRuntimeShell } from "@/components/helix/ask-console/HelixAskConsoleRuntimeShell";
import { HelixAskMinimalRuntimeShell } from "@/components/helix/ask-console/HelixAskMinimalRuntimeShell";
import type {
  HelixAskMinimalRuntimeControlActions,
  HelixAskMinimalRuntimeControlPayload,
} from "@/components/helix/ask-console/HelixAskMinimalRuntimeControls";
import { useAgiChatStore } from "@/store/useAgiChatStore";

afterEach(() => {
  cleanup();
  useAgiChatStore.setState({ sessions: {}, activeId: undefined });
  vi.restoreAllMocks();
});

describe("HelixAskMinimalRuntimeShell", () => {
  it("submits through injected transport and binds latest visible turn controls without HelixAskPill", async () => {
    window.history.pushState({}, "", "/desktop?doc=docs/research/nhm2-current-status-whitepaper-2026-05-02.md");
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue("minimal-shell-turn");
    const copied: HelixAskMinimalRuntimeControlPayload[] = [];
    const debugCopied: HelixAskMinimalRuntimeControlPayload[] = [];
    const readAloud: HelixAskMinimalRuntimeControlPayload[] = [];
    const controlActions: HelixAskMinimalRuntimeControlActions = {
      copyFinal: (payload) => copied.push(payload),
      debugCopy: (payload) => debugCopied.push(payload),
      readAloud: (payload) => readAloud.push(payload),
    };
    const runTurn = vi.fn(async (payload) => ({
      selected_final_answer: "Minimal shell final answer.",
      turn_id: payload.turnId,
      agent_runtime: payload.agentRuntime,
      debug: {
        debug_export_ref: `debug:${payload.turnId}`,
        contextFiles: payload.contextFiles,
      },
    }));

    render(
      <HelixAskMinimalRuntimeShell
        contextId="ctx"
        runTurn={runTurn}
        controlActions={controlActions}
      />,
    );

    fireEvent.change(screen.getByLabelText("Ask Helix"), {
      target: { value: "Summarize the current whitepaper" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit prompt" }));

    await waitFor(() => {
      expect(screen.getByText("Minimal shell final answer.")).toBeTruthy();
    });
    expect(runTurn).toHaveBeenCalledWith(
      expect.objectContaining({
        turnId: "ask:minimal-shell-turn",
        question: "Summarize the current whitepaper",
        contextFiles: ["docs/research/nhm2-current-status-whitepaper-2026-05-02.md"],
      }),
      expect.any(Function),
    );

    fireEvent.click(screen.getByTestId("helix-ask-latest-copy-final"));
    fireEvent.click(screen.getByTestId("helix-ask-latest-debug-copy"));
    fireEvent.click(screen.getByTestId("helix-ask-latest-read-aloud"));

    expect(copied).toHaveLength(1);
    expect(debugCopied).toHaveLength(1);
    expect(readAloud).toHaveLength(1);
    expect(copied[0]).toMatchObject({
      replyId: "ask:minimal-shell-turn",
      turnId: "ask:minimal-shell-turn",
      isLatest: true,
      finalAnswerText: "Minimal shell final answer.",
    });
    expect(JSON.parse(debugCopied[0]?.debugCopyText ?? "{}")).toMatchObject({
      schema: "helix.ask.minimal_runtime.debug_copy.v1",
      turn_id: "ask:minimal-shell-turn",
      final_answer: "Minimal shell final answer.",
      debug: {
        debug_export_ref: "debug:ask:minimal-shell-turn",
      },
    });
    expect(readAloud[0]?.readAloudText).toBe("Minimal shell final answer.");

    const sessions = Object.values(useAgiChatStore.getState().sessions);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.contextId).toBe("ctx");
    expect(sessions[0]?.messages.map((message) => ({
      role: message.role,
      content: message.content,
      traceId: message.traceId,
    }))).toEqual([
      {
        role: "user",
        content: "Summarize the current whitepaper",
        traceId: "ask:minimal-shell-turn",
      },
      {
        role: "assistant",
        content: "Minimal shell final answer.",
        traceId: "ask:minimal-shell-turn",
      },
    ]);
  });

  it("hydrates prior context chat replies into the minimal shell", async () => {
    useAgiChatStore.setState({
      sessions: {
        "session-existing": {
          id: "session-existing",
          title: "Helix Ask",
          createdAt: "2026-06-29T12:00:00.000Z",
          updatedAt: "2026-06-29T12:02:00.000Z",
          personaId: "default",
          contextId: "ctx",
          messages: [
            {
              id: "user-1",
              role: "user",
              content: "What is the current status?",
              at: "2026-06-29T12:00:00.000Z",
              traceId: "turn-existing",
            },
            {
              id: "assistant-1",
              role: "assistant",
              content: "Hydrated prior answer.",
              at: "2026-06-29T12:01:00.000Z",
              traceId: "turn-existing",
            },
          ],
        },
      },
      activeId: undefined,
    });

    render(<HelixAskMinimalRuntimeShell contextId="ctx" />);

    await waitFor(() => {
      expect(screen.getByText("Hydrated prior answer.")).toBeTruthy();
    });
    expect(screen.getByText("What is the current status?")).toBeTruthy();
    expect(useAgiChatStore.getState().activeId).toBe("session-existing");
  });

  it("submits through the runtime shell minimal implementation without rendering the legacy bridge", async () => {
    window.history.pushState({}, "", "/desktop?doc=docs/current.md");
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue("runtime-shell-turn");
    const runTurn = vi.fn(async (payload, onEvent) => {
      onEvent?.({ event: "turn_delta", data: { chunk: "working" } });
      return {
        selected_final_answer: "Runtime shell minimal answer.",
        turn_id: payload.turnId,
        debug: {
          stream_used: true,
        },
      };
    });

    render(
      <HelixAskConsoleRuntimeShell
        contextId="ctx"
        runtimeImplementation="minimal_runtime_shell"
        minimalRuntime={{ runTurn }}
      />,
    );

    expect(screen.getByTestId("helix-ask-minimal-runtime-shell")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Ask Helix"), {
      target: { value: "Use the active doc" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit prompt" }));

    await waitFor(() => {
      expect(screen.getByText("Runtime shell minimal answer.")).toBeTruthy();
    });
    expect(runTurn).toHaveBeenCalledWith(
      expect.objectContaining({
        turnId: "ask:runtime-shell-turn",
        question: "Use the active doc",
        contextFiles: ["docs/current.md"],
      }),
      expect.any(Function),
    );
    expect(screen.queryByTestId("helix-ask-pill")).toBeNull();
  });
});
