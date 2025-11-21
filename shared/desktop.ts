export type PanelTelemetryMetrics = Record<string, number>;
export type PanelTelemetryFlags = Record<string, boolean>;
export type PanelTelemetryStrings = Record<string, string>;

export type PanelTelemetryBand =
  | {
      name: "hz" | "khz" | "mhz" | "ghz" | "optical";
      q: number;
      coherence: number;
      occupancy: number;
      event_rate?: number;
      last_event?: string;
    }
  | {
      name: string;
      q: number;
      coherence: number;
      occupancy: number;
      event_rate?: number;
      last_event?: string;
    };

export type PanelTelemetryTileSample = {
  total: number;
  active: number;
  hot?: number[];
};

export type PanelTelemetry = {
  panelId: string;
  instanceId: string;
  title: string;
  kind?: string;
  metrics?: PanelTelemetryMetrics;
  flags?: PanelTelemetryFlags;
  strings?: PanelTelemetryStrings;
  bands?: PanelTelemetryBand[];
  tile_sample?: PanelTelemetryTileSample;
  sourceIds?: string[];
  notes?: string;
  lastUpdated: string;
};

export type ConsoleTelemetryBundle = {
  desktopId: string;
  panels: PanelTelemetry[];
  capturedAt: string;
};
