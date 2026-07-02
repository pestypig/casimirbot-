import { describe, expect, it } from "vitest";

import {
  buildAskTurnWorkspaceContextSnapshotFromState,
  buildWorkstationLayoutDebugSnapshotFromState,
} from "../ask-workspace-context-snapshot";

describe("ask workspace context snapshot helpers", () => {
  it("builds a deterministic workstation layout debug snapshot from supplied state", () => {
    expect(buildWorkstationLayoutDebugSnapshotFromState({
      mode: "desktop",
      activeGroupId: "group-b",
      groups: {
        "group-b": { panelIds: ["scientific-calculator", "docs-viewer"] },
        "group-a": { panelIds: ["stage-play-badge-graph", "docs-viewer", ""] },
      },
      chatDock: {
        collapsed: false,
        widthPx: 420,
        side: "right",
      },
      mobileDrawer: {
        open: true,
        snap: "full",
      },
    })).toEqual({
      mode: "desktop",
      activeGroupId: "group-b",
      groupCount: 2,
      openPanels: ["docs-viewer", "scientific-calculator", "stage-play-badge-graph"],
      chatDock: {
        collapsed: false,
        widthPx: 420,
        side: "right",
      },
      mobileDrawer: {
        open: true,
        snap: "full",
      },
    });
  });

  it("handles missing optional layout fields without reading UI stores", () => {
    expect(buildWorkstationLayoutDebugSnapshotFromState({
      groups: {
        empty: { panelIds: null },
      },
    })).toEqual({
      mode: undefined,
      activeGroupId: undefined,
      groupCount: 1,
      openPanels: [],
      chatDock: {
        collapsed: undefined,
        widthPx: undefined,
        side: undefined,
      },
      mobileDrawer: {
        open: undefined,
        snap: undefined,
      },
    });
  });

  it("builds deterministic Ask turn workspace context from supplied state snapshots", () => {
    const longNoteBody = ` ${"note-body ".repeat(1400)} `;
    const snapshot = buildAskTurnWorkspaceContextSnapshotFromState({
      sessionId: "session-1",
      layoutState: {
        activeGroupId: "group-a",
        groups: {
          "group-a": {
            activePanelId: "scientific-calculator",
            panelIds: ["scientific-calculator", "workstation-notes", "docs-viewer"],
          },
          "group-b": {
            activePanelId: "workstation-clipboard-history",
            panelIds: ["workstation-clipboard-history", "docs-viewer"],
          },
        },
      },
      notesState: {
        active_note_id: "note-active",
        order: ["note-new", "note-active", "note-empty"],
        notes: {
          "note-active": { id: "note-active", title: "Active", body: longNoteBody },
          "note-new": { id: "note-new", title: "Newest", body: " newest body " },
          "note-empty": { id: "note-empty", title: "", body: "ignored" },
        },
      },
      calculatorState: {
        currentLatex: " 8*9 ",
        lastSolve: {
          result_text: " 72 ",
          normalized_expression: " 8*9 ",
          trace: { traceId: " trace-123 " },
          ok: true,
        },
        steps: [{ id: 1 }, { id: 2 }],
        debugEvents: [
          {
            action_id: "solve_expression",
            ok: true,
            input_latex: " 8*9 ",
            result_text: " 72 ",
            normalized_expression: " 8*9 ",
            message: " solved ",
            ts: 11,
          },
        ],
      },
      docContext: {
        path: "docs/research/current-whitepaper.md",
        source: "desktop_url",
      },
      situationRoomContext: { job: "active" },
      situationCaptureContext: { capture: "visible" },
      lastUpdatedAtMs: 1234,
    });

    expect(snapshot).toMatchObject({
      sessionId: "session-1",
      activePanel: "scientific-calculator",
      activeGroupId: "group-a",
      groupCount: 2,
      openPanels: [
        "docs-viewer",
        "scientific-calculator",
        "workstation-clipboard-history",
        "workstation-notes",
      ],
      hasCalculatorContext: true,
      active_panel: "scientific-calculator",
      activeDocPath: "docs/research/current-whitepaper.md",
      active_doc_path: "docs/research/current-whitepaper.md",
      source: "desktop_url",
      hasDocContext: true,
      has_doc_context: true,
      docContextValid: true,
      doc_context_valid: true,
      docContextPath: "docs/research/current-whitepaper.md",
      doc_context_path: "docs/research/current-whitepaper.md",
      docContextSource: "desktop_url",
      doc_context_source: "desktop_url",
      docContextFailureReason: null,
      doc_context_failure_reason: null,
      activeNoteId: "note-active",
      activeNoteTitle: "Active",
      lastCreatedNoteId: "note-new",
      lastCreatedNoteTitle: "Newest",
      lastCreatedNoteBody: "newest body",
      hasNoteContext: true,
      situationRoomContext: { job: "active" },
      situationCaptureContext: { capture: "visible" },
      hasSituationRoomContext: true,
      hasClipboardContext: true,
      lastUpdatedAtMs: 1234,
    });
    expect(snapshot.activeCalculatorContext).toEqual({
      schema: "helix.scientific_calculator_active_context.v1",
      panel_id: "scientific-calculator",
      active_panel: true,
      current_latex: "8*9",
      last_result_text: "72",
      last_normalized_expression: "8*9",
      last_trace_id: "trace-123",
      last_ok: true,
      step_count: 2,
      recent_debug_events: [{
        action_id: "solve_expression",
        ok: true,
        input_latex: "8*9",
        result_text: "72",
        normalized_expression: "8*9",
        message: "solved",
        ts: 11,
      }],
    });
    expect(String(snapshot.activeNoteBody).length).toBe(12000);
    expect(snapshot.recentNotes).toEqual([
      { id: "note-new", title: "Newest", body: "newest body" },
      { id: "note-active", title: "Active", body: String(snapshot.activeNoteBody) },
    ]);
  });

  it("marks missing docs context without reading stores", () => {
    expect(buildAskTurnWorkspaceContextSnapshotFromState({
      sessionId: null,
      layoutState: {
        activeGroupId: "docs",
        groups: {
          docs: { activePanelId: "docs-viewer", panelIds: ["docs-viewer"] },
        },
      },
      notesState: {
        order: [],
        notes: {},
      },
      calculatorState: {
        debugEvents: [],
        steps: [],
      },
      docContext: {
        path: null,
        source: "missing",
      },
      lastUpdatedAtMs: 5,
    })).toMatchObject({
      sessionId: "helix-ui",
      activePanel: "docs-viewer",
      active_panel: "docs-viewer",
      hasDocContext: false,
      has_doc_context: false,
      docContextValid: false,
      doc_context_valid: false,
      docContextPath: null,
      doc_context_path: null,
      docContextSource: null,
      doc_context_source: null,
      docContextFailureReason: "docs_panel_open_without_active_doc_path",
      doc_context_failure_reason: "docs_panel_open_without_active_doc_path",
      hasCalculatorContext: false,
      hasNoteContext: false,
      hasClipboardContext: false,
      lastUpdatedAtMs: 5,
    });
  });
});
