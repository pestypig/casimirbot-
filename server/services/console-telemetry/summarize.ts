import type { ConsoleTelemetryBundle, PanelTelemetry } from "@shared/desktop";

const MAX_PANELS = 12;
const MAX_METRICS = 8;
const MAX_FLAGS = 8;
const MAX_STRINGS = 8;

const trimRecord = <T>(source: Record<string, T> | undefined, limit: number): Record<string, T> | undefined => {
  if (!source) {
    return undefined;
  }
  const entries = Object.entries(source).filter(([key, value]) => key && value !== undefined);
  if (!entries.length) {
    return undefined;
  }
  return Object.fromEntries(entries.slice(0, limit));
};

const sanitizePanel = (panel: PanelTelemetry) => ({
  id: panel.panelId,
  title: panel.title,
  kind: panel.kind,
  metrics: trimRecord(panel.metrics, MAX_METRICS),
  flags: trimRecord(panel.flags, MAX_FLAGS),
  strings: trimRecord(panel.strings, MAX_STRINGS),
  lastUpdated: panel.lastUpdated,
});

export function summarizeConsoleTelemetry(bundle?: ConsoleTelemetryBundle | null): string | null {
  if (!bundle || bundle.panels.length === 0) {
    return null;
  }
  const panels = bundle.panels.slice(0, MAX_PANELS).map(sanitizePanel);
  return JSON.stringify({
    desktopId: bundle.desktopId,
    capturedAt: bundle.capturedAt,
    panels,
  });
}
