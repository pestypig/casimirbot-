import { describe, expect, it } from "vitest";
import {
  buildHelixToolSurfaceDebugSnapshot,
  buildHelixToolSurfacePacket,
} from "../services/helix-ask/tool-router/helix-tool-surface-builder";

describe("Helix Ask tool surface inventory", () => {
  it("keeps the model-visible tool universe larger than active panels", () => {
    const snapshot = buildHelixToolSurfaceDebugSnapshot();

    expect(snapshot.total_dynamic_tools).toBeGreaterThan(snapshot.visible_panels.length);
    expect(snapshot.visible_panels.length).toBeGreaterThan(0);
    expect(snapshot.workspace_actions.length).toBeGreaterThan(0);
    expect(snapshot.grouped_by_panel["situation-room-pipelines"]?.length ?? 0).toBeGreaterThan(20);
    expect(snapshot.grouped_by_panel["docs-viewer"]).toEqual(
      expect.arrayContaining(["open", "search_docs", "summarize_doc"]),
    );
    expect(snapshot.open_panel_mappings).toBeGreaterThan(0);
    expect(snapshot.run_panel_action_mappings).toBeGreaterThan(snapshot.open_panel_mappings);
  });

  it("uses active panels as ranking metadata instead of the whole tool surface", () => {
    const packet = buildHelixToolSurfacePacket({
      turnId: "turn-docs-closed",
      prompt: "Open the docs viewer and find the current paper.",
      activePanels: [],
      focusedPanelId: null,
      explicitAttachmentAvailable: false,
      explicitToolIntent: true,
      maxEntries: 20,
    });

    const keys = packet.entries.map((entry) => entry.capability_key);
    expect(keys).toContain("docs-viewer.open");
    expect(keys.some((key) => key.startsWith("docs-viewer."))).toBe(true);
    expect(packet.active_panels.find((panel) => panel.panel_id === "docs-viewer")).toMatchObject({
      active: false,
      focused: false,
    });
    expect(packet.entries.find((entry) => entry.capability_key === "docs-viewer.open")).toMatchObject({
      runtime_shape: "open_panel",
      requires_active_panel: false,
      terminal_eligible: false,
      assistant_answer: false,
    });
  });

  it("filters manual-only and attachment-only capabilities with traceable omissions", () => {
    const packet = buildHelixToolSurfacePacket({
      turnId: "turn-manual-filter",
      prompt: "What is the situation room status?",
      activePanels: ["situation-room-pipelines"],
      focusedPanelId: "situation-room-pipelines",
      explicitAttachmentAvailable: false,
      explicitToolIntent: false,
      maxEntries: 30,
    });

    expect(packet.entries.map((entry) => entry.capability_key)).not.toContain("situation-room-pipelines.create_job");
    expect(packet.omitted.some((entry) => entry.reason === "manual_only")).toBe(true);
    expect(packet.omitted.some((entry) => entry.reason === "explicit_attachment_missing")).toBe(true);
  });

  it("suppresses executable tools for contextual docs-viewer references", () => {
    const packet = buildHelixToolSurfacePacket({
      turnId: "turn-negated-docs-open",
      prompt: "Do not open the docs viewer; just explain what the docs viewer is for.",
      activePanels: [],
      focusedPanelId: null,
      explicitAttachmentAvailable: false,
      explicitToolIntent: false,
      maxEntries: 20,
    });

    expect(packet.entries).toEqual([]);
    expect(packet.generation_reason).toContain("negated_tool_instruction");
    expect(packet.omitted.some((entry) => entry.reason === "contextual_tool_reference_suppressed")).toBe(true);
  });

  it("suppresses executable tools for contextual calculator references", () => {
    const packet = buildHelixToolSurfacePacket({
      turnId: "turn-negated-calculator-open",
      prompt: 'Earlier I said "open calculator"; do not do that now. Explain why no tool should run.',
      activePanels: ["scientific-calculator"],
      focusedPanelId: "scientific-calculator",
      explicitAttachmentAvailable: false,
      explicitToolIntent: false,
      maxEntries: 20,
    });

    expect(packet.entries).toEqual([]);
    expect(packet.generation_reason).toMatch(/quoted_tool_command|negated_tool_instruction|historical_tool_reference/);
    expect(packet.omitted.some((entry) => entry.reason === "contextual_tool_reference_suppressed")).toBe(true);
  });
});
