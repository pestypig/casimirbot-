export type PanelTelemetryMetrics = Record<string, number>;
export type PanelTelemetryFlags = Record<string, boolean>;
export type PanelTelemetryStrings = Record<string, string>;

export type PanelTelemetry = {
  panelId: string;
  instanceId: string;
  title: string;
  kind?: string;
  metrics?: PanelTelemetryMetrics;
  flags?: PanelTelemetryFlags;
  strings?: PanelTelemetryStrings;
  sourceIds?: string[];
  notes?: string;
  lastUpdated: string;
};

export type ConsoleTelemetryBundle = {
  desktopId: string;
  panels: PanelTelemetry[];
  capturedAt: string;
};
