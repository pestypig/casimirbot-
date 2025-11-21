import type { ConsoleTelemetryBundle, PanelTelemetry } from "@shared/desktop";
import { getConsoleTelemetry, saveConsoleTelemetry } from "../console-telemetry/store";
import { persistConsoleTelemetrySnapshot } from "../console-telemetry/persist";

export const CASIMIR_PANEL_ID = "casimir-tiles";
const CASIMIR_INSTANCE_ID = "casimir-tiles.server";
const CASIMIR_TITLE = "Casimir Tiles (server)";
const CASIMIR_SOURCE_IDS = [
  "server/services/casimir/telemetry.ts",
  "server/helix-core.ts",
  "modules/dynamic/dynamic-casimir.ts",
  "modules/sim_core/static-casimir.ts",
  "client/src/components/panels/CasimirTilesPanel.tsx",
];

export type CasimirTelemetrySample = {
  tilesActive: number;
  totalTiles: number;
  avgQFactor: number;
  coherence: number;
  lastEventTs: number;
};

const clamp = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
};

export function sampleCasimirTelemetry(now = Date.now()): CasimirTelemetrySample {
  const phase = now / 11_000;
  const wave = Math.sin(phase);
  const modulation = Math.cos(phase * 1.7);
  const tilesActive = Math.max(0, Math.round((wave + 1.1) * 16));
  const totalTiles = 4096;
  const avgQFactor = Number(clamp(0.68 + modulation * 0.12, 0.2, 0.95).toFixed(4));
  const coherence = Number(clamp(0.52 + wave * 0.18, 0.05, 0.98).toFixed(4));
  const lastEventTs = now - Math.round(clamp((1 - coherence) * 1400, 120, 2600));
  return { tilesActive, totalTiles, avgQFactor, coherence, lastEventTs };
}

export function buildCasimirTelemetryPanel(sample: CasimirTelemetrySample, timestamp = new Date()): PanelTelemetry {
  const occupancy = sample.totalTiles > 0 ? sample.tilesActive / sample.totalTiles : 0;
  return {
    panelId: CASIMIR_PANEL_ID,
    instanceId: CASIMIR_INSTANCE_ID,
    title: CASIMIR_TITLE,
    kind: "casimir",
    metrics: {
      tilesActive: sample.tilesActive,
      totalTiles: sample.totalTiles,
      occupancy: Number(occupancy.toFixed(4)),
      avgQFactor: sample.avgQFactor,
      coherence: sample.coherence,
    },
    bands: [
      {
        name: "mhz",
        q: sample.avgQFactor,
        coherence: sample.coherence,
        occupancy,
        last_event: new Date(sample.lastEventTs).toISOString(),
      },
    ],
    tile_sample: { total: sample.totalTiles, active: sample.tilesActive },
    flags: {
      hasActivity: sample.tilesActive > 0,
      lowQFactor: sample.avgQFactor < 0.55,
    },
    strings: {
      lastEventIso: new Date(sample.lastEventTs).toISOString(),
    },
    sourceIds: CASIMIR_SOURCE_IDS,
    notes: "Headless Casimir subsystem telemetry emitter",
    lastUpdated: timestamp.toISOString(),
  };
}

function mergeCasimirPanel({
  desktopId,
  base,
  sample,
}: {
  desktopId: string;
  base?: ConsoleTelemetryBundle | null;
  sample?: CasimirTelemetrySample;
}): { bundle: ConsoleTelemetryBundle; panel: PanelTelemetry } {
  const snapshot = sample ?? sampleCasimirTelemetry();
  const panel = buildCasimirTelemetryPanel(snapshot);
  const sourceBundle =
    base ??
    getConsoleTelemetry(desktopId) ?? {
      desktopId,
      capturedAt: panel.lastUpdated,
      panels: [],
    };
  const filtered = (sourceBundle.panels ?? []).filter(
    (entry) => !(entry.panelId === CASIMIR_PANEL_ID && entry.instanceId === CASIMIR_INSTANCE_ID),
  );
  const bundle: ConsoleTelemetryBundle = {
    desktopId: sourceBundle.desktopId || desktopId,
    panels: [...filtered, panel],
    capturedAt: panel.lastUpdated,
  };
  return { bundle, panel };
}

export function publishCasimirTelemetry({
  desktopId,
  base,
  sample,
  persistSnapshot = false,
}: {
  desktopId: string;
  base?: ConsoleTelemetryBundle | null;
  sample?: CasimirTelemetrySample;
  persistSnapshot?: boolean;
}): { bundle: ConsoleTelemetryBundle; panel: PanelTelemetry } {
  const { bundle, panel } = mergeCasimirPanel({ desktopId, base, sample });
  saveConsoleTelemetry(bundle);
  if (persistSnapshot) {
    void persistConsoleTelemetrySnapshot(bundle).catch((error) => {
      console.warn("[casimir:telemetry] failed to persist snapshot", error);
    });
  }
  return { bundle, panel };
}

export function ensureCasimirTelemetry({
  desktopId,
  base,
}: {
  desktopId: string;
  base?: ConsoleTelemetryBundle | null;
}): { bundle: ConsoleTelemetryBundle; panel: PanelTelemetry } {
  return publishCasimirTelemetry({ desktopId, base });
}

export function getCasimirPanelSnapshot(bundle?: ConsoleTelemetryBundle | null): PanelTelemetry | null {
  if (!bundle || !bundle.panels || bundle.panels.length === 0) {
    return null;
  }
  return bundle.panels.find((panel) => panel.panelId === CASIMIR_PANEL_ID) ?? null;
}
