import { beforeEach, describe, expect, it } from "vitest";
import { useWorkstationClipboardStore } from "@/store/useWorkstationClipboardStore";
import { useWorkstationNotesStore } from "@/store/useWorkstationNotesStore";
import { useWorkstationSessionMemoryStore } from "@/store/useWorkstationSessionMemoryStore";

describe("workstation stores", () => {
  beforeEach(() => {
    useWorkstationNotesStore.setState({ notes: {}, order: [], active_note_id: undefined });
    useWorkstationClipboardStore.setState({ receipts: [] });
    useWorkstationSessionMemoryStore.setState({ panelScroll: {}, drafts: {} });
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

  it("remembers workstation scroll positions and drafts for the browser session", () => {
    const memory = useWorkstationSessionMemoryStore.getState();
    memory.rememberPanelScroll("docs-viewer:doc:/docs/example.md", {
      scrollTop: 320.6,
      scrollHeight: 1400,
      clientHeight: 500,
    });
    memory.rememberDraft("scientific-calculator:input", "tau = alpha T");

    const state = useWorkstationSessionMemoryStore.getState();
    expect(state.readPanelScroll("docs-viewer:doc:/docs/example.md")?.scrollTop).toBe(321);
    expect(state.readDraft("scientific-calculator:input")).toBe("tau = alpha T");

    state.clearDraft("scientific-calculator:input");
    expect(useWorkstationSessionMemoryStore.getState().readDraft("scientific-calculator:input")).toBe("");
  });
});
