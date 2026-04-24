import { beforeEach, describe, expect, it, vi } from "vitest";
import { useScientificCalculatorStore } from "@/store/useScientificCalculatorStore";
import { useWorkstationClipboardStore } from "@/store/useWorkstationClipboardStore";
import { useWorkstationNotesStore } from "@/store/useWorkstationNotesStore";

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
    useWorkstationNotesStore.setState({ notes: {}, order: [], active_note_id: undefined });
    useWorkstationClipboardStore.setState({ receipts: [] });
    useScientificCalculatorStore.setState({ currentLatex: "", history: [], lastSolve: null, steps: [] });
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

  it("creates and appends notes with deterministic artifacts", () => {
    const create = executeHelixPanelAction(
      {
        panel_id: "workstation-notes",
        action_id: "create_note",
        args: { title: "Mission Notes", topic: "nhm2" },
      },
      {
        openPanel: () => undefined,
        focusPanel: () => undefined,
        closePanel: () => undefined,
        openSettings: () => undefined,
      },
    );
    expect(create.ok).toBe(true);
    expect(create.artifact?.note_id).toBe("note:mission-notes");

    const append = executeHelixPanelAction(
      {
        panel_id: "workstation-notes",
        action_id: "append_to_note",
        args: { title: "Mission Notes", text: "new evidence line" },
      },
      {
        openPanel: () => undefined,
        focusPanel: () => undefined,
        closePanel: () => undefined,
        openSettings: () => undefined,
      },
    );
    expect(append.ok).toBe(true);
    expect(append.artifact?.note_id).toBe("note:mission-notes");
    const note = useWorkstationNotesStore.getState().notes["note:mission-notes"];
    expect(note?.body).toContain("new evidence line");
  });

  it("requires confirmation for destructive note and clipboard actions", () => {
    const notesState = useWorkstationNotesStore.getState();
    notesState.upsertWorkflowNote({
      id: "note:test",
      title: "Test",
      topic: "test",
      body: "abc",
      citations: [],
      snippets: [],
    });
    useWorkstationClipboardStore.getState().addReceipt({
      direction: "copy",
      text: "alpha",
      source: "spec",
    });

    const deleteBlocked = executeHelixPanelAction(
      {
        panel_id: "workstation-notes",
        action_id: "delete_note",
        args: { note_id: "note:test" },
      },
      {
        openPanel: () => undefined,
        focusPanel: () => undefined,
        closePanel: () => undefined,
        openSettings: () => undefined,
      },
    );
    expect(deleteBlocked.ok).toBe(false);
    expect(deleteBlocked.artifact?.requires_confirmation).toBe(true);

    const clearBlocked = executeHelixPanelAction(
      {
        panel_id: "workstation-clipboard-history",
        action_id: "clear_history",
      },
      {
        openPanel: () => undefined,
        focusPanel: () => undefined,
        closePanel: () => undefined,
        openSettings: () => undefined,
      },
    );
    expect(clearBlocked.ok).toBe(false);
    expect(clearBlocked.artifact?.requires_confirmation).toBe(true);
  });

  it("supports clipboard read/write and receipt-to-note copy", () => {
    useWorkstationClipboardStore.getState().addReceipt({
      id: "clip:latest",
      direction: "copy",
      text: "latest payload",
      source: "spec",
    });
    const notesState = useWorkstationNotesStore.getState();
    notesState.upsertWorkflowNote({
      id: "note:target",
      title: "Target",
      topic: "target",
      body: "",
      citations: [],
      snippets: [],
    });

    const read = executeHelixPanelAction(
      {
        panel_id: "workstation-clipboard-history",
        action_id: "read_clipboard",
      },
      {
        openPanel: () => undefined,
        focusPanel: () => undefined,
        closePanel: () => undefined,
        openSettings: () => undefined,
      },
    );
    expect(read.ok).toBe(true);
    expect(read.artifact?.text).toBe("latest payload");

    const write = executeHelixPanelAction(
      {
        panel_id: "workstation-clipboard-history",
        action_id: "write_clipboard",
        args: { text: "copied text" },
      },
      {
        openPanel: () => undefined,
        focusPanel: () => undefined,
        closePanel: () => undefined,
        openSettings: () => undefined,
      },
    );
    expect(write.ok).toBe(true);
    expect(write.artifact?.direction).toBe("write");

    const copyToNote = executeHelixPanelAction(
      {
        panel_id: "workstation-clipboard-history",
        action_id: "copy_receipt_to_note",
        args: { note_id: "note:target", receipt_id: "clip:latest" },
      },
      {
        openPanel: () => undefined,
        focusPanel: () => undefined,
        closePanel: () => undefined,
        openSettings: () => undefined,
      },
    );
    expect(copyToNote.ok).toBe(true);
    expect(copyToNote.artifact?.note_id).toBe("note:target");
    expect(useWorkstationNotesStore.getState().notes["note:target"]?.body).toContain("latest payload");

    const copySelectionToNote = executeHelixPanelAction(
      {
        panel_id: "workstation-clipboard-history",
        action_id: "copy_selection_to_note",
        args: { note_id: "note:target" },
      },
      {
        openPanel: () => undefined,
        focusPanel: () => undefined,
        closePanel: () => undefined,
        openSettings: () => undefined,
      },
    );
    expect(copySelectionToNote.ok).toBe(true);
    expect(copySelectionToNote.artifact?.source).toBe("clipboard_receipt");
  });

  it("supports scientific calculator ingest and solve actions", () => {
    const ingest = executeHelixPanelAction(
      {
        panel_id: "scientific-calculator",
        action_id: "ingest_latex",
        args: { latex: "x^2-4=0", source_path: "/docs/papers.md" },
      },
      {
        openPanel: () => undefined,
        focusPanel: () => undefined,
        closePanel: () => undefined,
        openSettings: () => undefined,
      },
    );
    expect(ingest.ok).toBe(true);
    expect(ingest.artifact?.latex).toBe("x^2-4=0");

    const solve = executeHelixPanelAction(
      {
        panel_id: "scientific-calculator",
        action_id: "solve_with_steps",
      },
      {
        openPanel: () => undefined,
        focusPanel: () => undefined,
        closePanel: () => undefined,
        openSettings: () => undefined,
      },
    );
    expect(solve.ok).toBe(true);
    expect(typeof solve.artifact?.result_text).toBe("string");
    expect((solve.artifact?.steps_count as number) > 0).toBe(true);

    const copyResult = executeHelixPanelAction(
      {
        panel_id: "scientific-calculator",
        action_id: "copy_result",
      },
      {
        openPanel: () => undefined,
        focusPanel: () => undefined,
        closePanel: () => undefined,
        openSettings: () => undefined,
      },
    );
    expect(copyResult.ok).toBe(true);
  });

  it("keeps complex ADM-style symbolic equations solvable without crashing", () => {
    const solve = executeHelixPanelAction(
      {
        panel_id: "scientific-calculator",
        action_id: "solve_with_steps",
        args: {
          latex:
            "ds^2 = -(alpha^2-beta_i*beta^i)*dt^2 + 2*beta_i*dx^i*dt + gamma_ij*dx^i*dx^j",
        },
      },
      {
        openPanel: () => undefined,
        focusPanel: () => undefined,
        closePanel: () => undefined,
        openSettings: () => undefined,
      },
    );
    expect(solve.ok).toBe(true);
    expect(typeof solve.artifact?.result_text).toBe("string");
    expect(String(solve.artifact?.result_text).length).toBeGreaterThan(0);
    expect(String(solve.artifact?.error ?? "")).not.toContain("eqn.split");
  });
});
