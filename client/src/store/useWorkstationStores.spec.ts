import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAgiChatStore } from "@/store/useAgiChatStore";
import { useHelixAskWorkspaceSessionStore } from "@/store/useHelixAskWorkspaceSessionStore";
import { useWorkstationClipboardStore } from "@/store/useWorkstationClipboardStore";
import { useWorkstationLayoutStore } from "@/store/useWorkstationLayoutStore";
import { useWorkstationNotesStore } from "@/store/useWorkstationNotesStore";
import { useWorkstationSessionMemoryStore } from "@/store/useWorkstationSessionMemoryStore";
import { useWorkstationWorkflowTimelineStore } from "@/store/useWorkstationWorkflowTimelineStore";

describe("workstation stores", () => {
  beforeEach(() => {
    useAgiChatStore.setState({ sessions: {}, activeId: undefined });
    useHelixAskWorkspaceSessionStore.setState({ layoutSnapshots: {} });
    useWorkstationLayoutStore.setState({
      chatDock: { side: "right", widthPx: 420, collapsed: false },
      activeGroupId: "group-primary",
      groups: {
        "group-primary": {
          id: "group-primary",
          title: "Primary",
          panelIds: [],
          activePanelId: null,
        },
      },
      root: { type: "group", groupId: "group-primary" },
      recentlyClosedPanels: [],
    });
    useWorkstationNotesStore.setState({ notes: {}, order: [], active_note_id: undefined });
    useWorkstationClipboardStore.setState({ receipts: [] });
    useWorkstationSessionMemoryStore.setState({ panelScroll: {}, drafts: {} });
    useWorkstationWorkflowTimelineStore.setState({ entries: [] });
  });

  it("creates and activates notes via upsertWorkflowNote", () => {
    const created = useWorkstationNotesStore.getState().upsertWorkflowNote({
      id: "note:test",
      title: "Test note",
      topic: "topic-a",
      body: "alpha",
      citations: [],
      snippets: [],
    });
    const state = useWorkstationNotesStore.getState();
    expect(created.id).toBe("note:test");
    expect(state.active_note_id).toBe("note:test");
    expect(state.order[0]).toBe("note:test");
  });

  it("creates manual workstation notes with stable unique ids", () => {
    const notes = useWorkstationNotesStore.getState();
    const first = notes.createManualNote({ title: "Draft brief" });
    const second = notes.createManualNote({ title: "Draft brief" });
    const state = useWorkstationNotesStore.getState();
    expect(first.id).toBe("note:manual:draft-brief");
    expect(second.id).toBe("note:manual:draft-brief-2");
    expect(state.active_note_id).toBe(second.id);
    expect(state.notes[first.id]?.topic).toBe("manual-document");
    expect(state.order.slice(0, 2)).toEqual([second.id, first.id]);
  });

  it("updates note body and timestamp deterministically", () => {
    const notes = useWorkstationNotesStore.getState();
    notes.upsertWorkflowNote({
      id: "note:test",
      title: "Test note",
      topic: "topic-a",
      body: "alpha",
      citations: [],
      snippets: [],
    });
    const before = useWorkstationNotesStore.getState().notes["note:test"]?.updated_at ?? "";
    notes.updateNoteBody("note:test", "alpha\nbeta");
    const updated = useWorkstationNotesStore.getState().notes["note:test"];
    expect(updated?.body).toBe("alpha\nbeta");
    expect(Date.parse(updated?.updated_at ?? "")).toBeGreaterThanOrEqual(Date.parse(before));
  });

  it("allows manual note titles to be blank or contain surrounding spaces while editing", () => {
    const notes = useWorkstationNotesStore.getState();
    const note = notes.createManualNote({ title: "Draft brief" });
    notes.renameNote(note.id, "");
    expect(useWorkstationNotesStore.getState().notes[note.id]?.title).toBe("");

    notes.renameNote(note.id, "  Project plan  ");
    expect(useWorkstationNotesStore.getState().notes[note.id]?.title).toBe("  Project plan  ");
  });

  it("tracks clipboard read/write style receipts and clear behavior", () => {
    const clipboard = useWorkstationClipboardStore.getState();
    clipboard.addReceipt({
      id: "clip:1",
      direction: "write",
      text: "first",
      source: "spec",
      meta: { receipt_link: "none" },
    });
    clipboard.addReceipt({
      id: "clip:2",
      direction: "read",
      text: "second",
      source: "spec",
      meta: { receipt_link: "clip:1" },
    });
    const state = useWorkstationClipboardStore.getState();
    expect(state.receipts[0]?.id).toBe("clip:2");
    expect(state.receipts[0]?.meta?.receipt_link).toBe("clip:1");
    expect(state.receipts).toHaveLength(2);
    clipboard.clearReceipts();
    expect(useWorkstationClipboardStore.getState().receipts).toHaveLength(0);
  });

  it("keeps clipboard receipts in memory when localStorage quota is exceeded", () => {
    const originalWindow = (globalThis as { window?: unknown }).window;
    const storage = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        removeItem: (key: string) => {
          storage.delete(key);
        },
        setItem: (key: string, value: string) => {
          if (key === "workstation-clipboard-history:v1") {
            throw new Error("Quota exceeded");
          }
          storage.set(key, value);
        },
      },
    });
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    try {
      useWorkstationClipboardStore.getState().addReceipt({
        id: "clip:quota",
        direction: "write",
        text: "x".repeat(10_000),
        source: "quota-spec",
        meta: { large: "y".repeat(10_000) },
      });

      const receipt = useWorkstationClipboardStore.getState().receipts[0];
      expect(receipt?.id).toBe("clip:quota");
      expect(receipt?.text.length).toBeLessThan(4100);
      expect(receipt?.meta).toMatchObject({ truncated: true });
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("[workstation-clipboard] localStorage write skipped after quota pressure"),
        expect.anything(),
      );
    } finally {
      warnSpy.mockRestore();
      if (originalWindow === undefined) {
        vi.unstubAllGlobals();
      } else {
        vi.stubGlobal("window", originalWindow);
      }
    }
  });

  it("remembers workstation scroll positions and drafts for the browser session", () => {
    const memory = useWorkstationSessionMemoryStore.getState();
    memory.rememberPanelScroll("docs-viewer:doc:/docs/example.md", {
      scrollTop: 320.6,
      scrollHeight: 1400,
      clientHeight: 500,
    });
    memory.rememberDraft("scientific-calculator:input", "tau = alpha T");
    memory.rememberDraft("situation-room:pipeline-draft", "monitor voice chat");

    const state = useWorkstationSessionMemoryStore.getState();
    expect(state.readPanelScroll("docs-viewer:doc:/docs/example.md")?.scrollTop).toBe(321);
    expect(state.readDraft("scientific-calculator:input")).toBe("tau = alpha T");
    expect(state.buildWorkstationSessionMemorySnapshot()).toMatchObject({
      schema: "helix.workstation_memory.v1",
      memory_class: "surface_session_only",
      storage: "sessionStorage",
      panel_scroll_keys: ["docs-viewer:doc:/docs/example.md"],
      context_injection: "never_by_default",
      user_visible: true,
    });
    expect(state.buildWorkstationSessionMemorySnapshot().draft_keys).toEqual([
      "scientific-calculator:input",
      "situation-room:pipeline-draft",
    ]);

    state.clearDraft("scientific-calculator:input");
    expect(useWorkstationSessionMemoryStore.getState().readDraft("scientific-calculator:input")).toBe("");
    expect(useWorkstationSessionMemoryStore.getState().readDraft("situation-room:pipeline-draft")).toBe("monitor voice chat");
  });

  it("titles a fresh Helix Ask chat from the first user message", () => {
    const chats = useAgiChatStore.getState();
    const sessionId = chats.newSession("New chat", "helix-ask-chat:test");
    chats.addMessage(sessionId, {
      role: "user",
      content: "Plan the next workstation research pass with notes",
    });

    expect(useAgiChatStore.getState().sessions[sessionId]?.title).toBe(
      "Plan the next workstation research pass with notes",
    );
  });

  it("saves and restores workstation layout snapshots per Helix Ask chat", () => {
    const layout = useWorkstationLayoutStore.getState();
    layout.openPanelInActiveGroup("workstation-notes");
    layout.setChatDockWidth(560);
    const snapshot = useWorkstationLayoutStore.getState().captureLayoutSnapshot();
    const workspaceSessions = useHelixAskWorkspaceSessionStore.getState();

    workspaceSessions.saveLayoutSnapshot("chat-a", snapshot);
    layout.setChatDockWidth(360);
    layout.openPanelInActiveGroup("docs-viewer");

    const restored = workspaceSessions.readLayoutSnapshot("chat-a");
    expect(restored).not.toBeNull();
    useWorkstationLayoutStore.getState().applyLayoutSnapshot(restored!);

    const state = useWorkstationLayoutStore.getState();
    expect(state.chatDock.widthPx).toBe(560);
    expect(state.groups["group-primary"]?.panelIds).toEqual(["workstation-notes"]);
    expect(state.groups["group-primary"]?.activePanelId).toBe("workstation-notes");
  });
});
