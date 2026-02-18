import type { ConsoleTelemetryBundle, PanelTelemetry } from "@shared/desktop";

const MAX_PANELS = 12;
const MAX_METRICS = 8;
const MAX_FLAGS = 8;
const MAX_STRINGS = 8;

type SummaryClaimTier = "diagnostic" | "reduced-order" | "certified";

type SummaryProvenanceFields = {
  provenance_class?: string;
  claim_tier?: string;
  certifying?: boolean;
  source_class?: string;
};

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

const normalizeClaimTier = (value: string | undefined): SummaryClaimTier => {
  if (value === "reduced-order" || value === "certified") {
    return value;
  }
  return "diagnostic";
};

const hasSourceIds = (panel: PanelTelemetry): boolean =>
  Array.isArray(panel.sourceIds) && panel.sourceIds.some((sourceId) => sourceId.trim().length > 0);

const sanitizePanel = (panel: PanelTelemetry & SummaryProvenanceFields) => {
  const sourced = hasSourceIds(panel);
  const claimTier = normalizeClaimTier(panel.claim_tier);
  const provenanceClass =
    panel.provenance_class === "measured" || (!panel.provenance_class && sourced) ? "measured" : "synthesized";
  const sourceClass = panel.source_class === "sensor" || (!panel.source_class && sourced) ? "sensor" : "derived";

  return {
    id: panel.panelId,
    title: panel.title,
    kind: panel.kind,
    metrics: trimRecord(panel.metrics, MAX_METRICS),
    flags: trimRecord(panel.flags, MAX_FLAGS),
    strings: trimRecord(panel.strings, MAX_STRINGS),
    lastUpdated: panel.lastUpdated,
    provenance_class: provenanceClass,
    claim_tier: claimTier,
    certifying: claimTier === "certified" && provenanceClass === "measured",
    source_class: sourceClass,
  };
};

export function summarizeConsoleTelemetry(bundle?: ConsoleTelemetryBundle | null): string | null {
  if (!bundle || bundle.panels.length === 0) {
    return null;
  }
  const panels = bundle.panels.slice(0, MAX_PANELS).map((panel) => sanitizePanel(panel));
  const hasMeasuredPanel = panels.some((panel) => panel.provenance_class === "measured");
  const claimTier = normalizeClaimTier((bundle as ConsoleTelemetryBundle & SummaryProvenanceFields).claim_tier);

  return JSON.stringify({
    desktopId: bundle.desktopId,
    capturedAt: bundle.capturedAt,
    provenance_class: hasMeasuredPanel ? "measured" : "synthesized",
    claim_tier: claimTier,
    certifying: claimTier === "certified" && hasMeasuredPanel,
    source_class: hasMeasuredPanel ? "sensor" : "derived",
    panels,
  });
}
