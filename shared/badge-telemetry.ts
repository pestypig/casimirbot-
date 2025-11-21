import type { PanelTelemetryBand } from "./desktop";

export type BadgeProof = {
  label: string;
  value: string;
  severity?: "info" | "warn" | "error";
};

export type BadgeSolution = {
  action: string;
  rationale?: string;
  severity?: "info" | "warn" | "urgent";
};

export type BadgeTelemetryEntry = {
  panelId: string;
  instanceId: string;
  title: string;
  kind?: string;
  status: "ok" | "warn" | "error" | "unknown";
  summary: string;
  proofs: BadgeProof[];
  solutions: BadgeSolution[];
  metrics?: Record<string, number>;
  flags?: Record<string, boolean>;
  bands?: PanelTelemetryBand[];
  lastUpdated: string;
  sourceIds?: string[];
};

export type BadgeTelemetrySnapshot = {
  desktopId: string;
  capturedAt: string;
  summary: string;
  entries: BadgeTelemetryEntry[];
  total: number;
  relatedPanels?: string[];
  relationNotes?: string[];
};
