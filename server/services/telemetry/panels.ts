import type { PanelTelemetry } from "@shared/desktop";
import { ensureCasimirTelemetry } from "../casimir/telemetry";
import { getConsoleTelemetry } from "../console-telemetry/store";

const DEFAULT_DESKTOP_ID = "helix.desktop.main";

export type PanelSnapshot = {
  desktopId: string;
  capturedAt: string;
  panels: PanelTelemetry[];
};

type CollectArgs = {
  desktopId?: string;
  panelIds?: string[];
};

export function collectPanelSnapshots(args: CollectArgs = {}): PanelSnapshot {
  const desktopId = args.desktopId?.trim() || DEFAULT_DESKTOP_ID;
  const base = getConsoleTelemetry(desktopId);
  const { bundle } = ensureCasimirTelemetry({ desktopId, base });
  const panelFilter =
    Array.isArray(args.panelIds) && args.panelIds.length > 0
      ? new Set(args.panelIds.map((id) => id.toLowerCase()))
      : null;
  const panels =
    bundle?.panels
      ?.filter((panel) => !panelFilter || panelFilter.has(panel.panelId.toLowerCase()))
      .map((panel) => ({
        ...panel,
        sourceIds: panel.sourceIds?.filter(Boolean),
      })) ?? [];
  return {
    desktopId,
    capturedAt: bundle?.capturedAt ?? new Date().toISOString(),
    panels,
  };
}

export { DEFAULT_DESKTOP_ID as DEFAULT_PANEL_DESKTOP_ID };
