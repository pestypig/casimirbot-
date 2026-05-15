import { describe, expect, it } from "vitest";
import {
  applyWorkstationProcessGraphEvent,
  buildWorkstationProcessGraphSnapshot,
  createInitialWorkstationProcessGraphState,
} from "../processGraphReducer";

describe("workstation process graph reducer", () => {
  it("records panel open/focus state", () => {
    const state = applyWorkstationProcessGraphEvent(createInitialWorkstationProcessGraphState("session:test"), {
      type: "panel.opened",
      panelId: "docs-viewer",
      label: "Docs & Papers",
      ts: "2026-05-15T10:00:00.000Z",
    });

    expect(state.nodes["panel:docs-viewer"]).toMatchObject({
      kind: "panel",
      label: "Docs & Papers",
      status: "active",
      panelId: "docs-viewer",
    });
    expect(state.activePanelId).toBe("docs-viewer");
  });

  it("connects completed tools to artifacts without dispatch authority", () => {
    const state = applyWorkstationProcessGraphEvent(createInitialWorkstationProcessGraphState("session:test"), {
      type: "tool.completed",
      tool: "docs-viewer.open_doc",
      traceId: "trace-1",
      panelId: "docs-viewer",
      artifact: { kind: "doc_context", path: "/docs/a.md" },
      ts: "2026-05-15T10:00:00.000Z",
    });
    const snapshot = buildWorkstationProcessGraphSnapshot(state, { includeTimeline: true });

    expect(snapshot.nodes.some((node) => node.kind === "tool" && node.id === "tool:docs-viewer.open_doc")).toBe(true);
    expect(snapshot.nodes.some((node) => node.kind === "artifact" && node.status === "completed")).toBe(true);
    expect(snapshot.edges.some((edge) => edge.kind === "produced")).toBe(true);
  });
});
