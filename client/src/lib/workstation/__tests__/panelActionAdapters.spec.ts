import { beforeEach, describe, expect, it, vi } from "vitest";

const hoisted = vi.hoisted(() => {
  const callOrder: string[] = [];
  return {
    callOrder,
    openDocPanelMock: vi.fn((_: unknown) => {
      callOrder.push("openDocPanel");
    }),
    launchHelixAskPromptMock: vi.fn(),
  };
});

vi.mock("@/lib/docs/openDocPanel", () => ({
  openDocPanel: hoisted.openDocPanelMock,
}));
vi.mock("@/lib/helix/ask-prompt-launch", () => ({
  launchHelixAskPrompt: hoisted.launchHelixAskPromptMock,
}));

import { executeHelixPanelAction } from "@/lib/workstation/panelActionAdapters";

describe("panelActionAdapters", () => {
  beforeEach(() => {
    hoisted.callOrder.length = 0;
    hoisted.openDocPanelMock.mockClear();
    hoisted.launchHelixAskPromptMock.mockClear();
  });

  it("opens/focuses docs panel before applying read intent", () => {
    const result = executeHelixPanelAction(
      {
        panel_id: "docs-viewer",
        action_id: "open_doc_and_read",
        args: { path: "/docs/papers.md", topic: "sun" },
      },
      {
        openPanel: () => {
          hoisted.callOrder.push("openPanel");
        },
        focusPanel: () => {
          hoisted.callOrder.push("focusPanel");
        },
        closePanel: () => undefined,
        openSettings: () => undefined,
      },
    );

    expect(result.ok).toBe(true);
    expect(result.action_id).toBe("open_doc_and_read");
    expect(hoisted.callOrder).toEqual(["openPanel", "focusPanel", "openDocPanel"]);
  });

  it("launches Helix Ask for summarize/explain docs actions", () => {
    const summarizeResult = executeHelixPanelAction(
      {
        panel_id: "docs-viewer",
        action_id: "summarize_doc",
        args: { path: "/docs/papers.md" },
      },
      {
        openPanel: () => undefined,
        focusPanel: () => undefined,
        closePanel: () => undefined,
        openSettings: () => undefined,
      },
    );
    expect(summarizeResult.ok).toBe(true);
    expect(summarizeResult.action_id).toBe("summarize_doc");
    expect(hoisted.launchHelixAskPromptMock).toHaveBeenCalledWith(
      expect.objectContaining({
        autoSubmit: true,
        panelId: "docs-viewer",
        bypassWorkstationDispatch: true,
      }),
    );
    const firstCall = hoisted.launchHelixAskPromptMock.mock.calls[0]?.[0] as { question?: string } | undefined;
    expect(firstCall?.question).toContain("Summarize this document");
    expect(firstCall?.question).toContain("/docs/papers.md");

    const explainResult = executeHelixPanelAction(
      {
        panel_id: "docs-viewer",
        action_id: "explain_paper",
        args: { path: "/docs/papers.md", selected_text: "Key excerpt" },
      },
      {
        openPanel: () => undefined,
        focusPanel: () => undefined,
        closePanel: () => undefined,
        openSettings: () => undefined,
      },
    );
    expect(explainResult.ok).toBe(true);
    const secondCall = hoisted.launchHelixAskPromptMock.mock.calls[1]?.[0] as { question?: string } | undefined;
    expect(secondCall?.question).toContain("Explain this paper");
    expect(secondCall?.question).toContain('Selected text: "Key excerpt"');
  });
});
