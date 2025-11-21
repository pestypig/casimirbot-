import { z } from "zod";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";
import { collectPanelSnapshots, DEFAULT_PANEL_DESKTOP_ID } from "../services/telemetry/panels";

const PanelsInput = z.object({
  desktopId: z.string().min(1).max(128).default(DEFAULT_PANEL_DESKTOP_ID),
  panelIds: z.array(z.string().min(1)).optional(),
});

const PanelsOutput = z.object({
  desktopId: z.string(),
  capturedAt: z.string(),
  panels: z.array(z.any()),
});

export const panelSnapshotSpec: ToolSpecShape = {
  name: "telemetry.panels.snapshot",
  desc: "Returns live panel telemetry payloads (render context) for the current desktop.",
  inputSchema: PanelsInput,
  outputSchema: PanelsOutput,
  deterministic: true,
  rateLimit: { rpm: 30 },
  safety: { risks: [] },
};

export const panelSnapshotHandler: ToolHandler = async (rawInput) => {
  const input = PanelsInput.parse(rawInput ?? {});
  return collectPanelSnapshots({ desktopId: input.desktopId, panelIds: input.panelIds });
};
