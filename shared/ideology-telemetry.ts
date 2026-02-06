import type { PanelTelemetry, PanelTelemetryFlags, PanelTelemetryMetrics, PanelTelemetryStrings } from "./desktop";

export const IDEOLOGY_TELEMETRY_SCHEMA_PATH = "docs/ethos/ideology-telemetry-schema.json";

export type IdeologyTelemetryMetrics = {
  noise_laplacian_rms?: number;
  amplitude_violation_rate?: number;
  determinism_rate?: number;
  contradiction_count?: number;
  axiom_satisfaction?: number;
  evidence_consistency?: number;
};

export type IdeologyTelemetryFlags = {
  artifacts_complete?: boolean;
  gate_trace_present?: boolean;
};

export type IdeologyTelemetryInput = {
  nodeId: string;
  panelId?: string;
  instanceId?: string;
  title?: string;
  surface?: string;
  metrics?: IdeologyTelemetryMetrics;
  flags?: IdeologyTelemetryFlags;
  strings?: PanelTelemetryStrings;
  lastUpdated?: string;
  notes?: string;
};

export function buildIdeologyPanelTelemetry(input: IdeologyTelemetryInput): PanelTelemetry {
  const now = input.lastUpdated ?? new Date().toISOString();
  const panelId = input.panelId ?? "ideology";
  const instanceId = input.instanceId ?? input.nodeId;
  const title = input.title ?? "Ideology";
  const metrics: PanelTelemetryMetrics | undefined = input.metrics
    ? { ...input.metrics }
    : undefined;
  const flags: PanelTelemetryFlags | undefined = input.flags
    ? { ...input.flags }
    : undefined;
  const strings: PanelTelemetryStrings | undefined = input.surface || input.strings
    ? { ...(input.strings ?? {}), ...(input.surface ? { surface: input.surface } : {}) }
    : undefined;

  return {
    panelId,
    instanceId,
    title,
    kind: "ideology",
    metrics,
    flags,
    strings,
    notes: input.notes,
    lastUpdated: now,
    sourceIds: [input.nodeId],
  };
}
