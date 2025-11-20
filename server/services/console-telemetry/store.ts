import type { ConsoleTelemetryBundle } from "@shared/desktop";

type StoredTelemetry = ConsoleTelemetryBundle & { capturedAt: string; updatedAt: number };

const TELEMETRY_STORE = new Map<string, StoredTelemetry>();

export function saveConsoleTelemetry(bundle: ConsoleTelemetryBundle): void {
  if (!bundle?.desktopId) {
    return;
  }
  const capturedAt = bundle.capturedAt ?? new Date().toISOString();
  TELEMETRY_STORE.set(bundle.desktopId, {
    ...bundle,
    capturedAt,
    updatedAt: Date.now(),
  });
}

export function getConsoleTelemetry(desktopId: string | undefined): ConsoleTelemetryBundle | null {
  if (!desktopId) {
    return null;
  }
  const entry = TELEMETRY_STORE.get(desktopId);
  if (!entry) {
    return null;
  }
  return {
    desktopId: entry.desktopId,
    capturedAt: entry.capturedAt,
    panels: entry.panels ?? [],
  };
}
