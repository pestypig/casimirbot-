import type { ConsoleTelemetryBundle, PanelTelemetry } from "@shared/desktop";

type TelemetryClaimTier = "diagnostic" | "reduced-order" | "certified";
type TelemetryProvenanceClass = "synthesized" | "measured";
type TelemetrySourceClass = "derived" | "sensor";

type TelemetryProvenanceFields = {
  provenance_class?: string;
  claim_tier?: string;
  certifying?: boolean;
  source_class?: string;
};

type PanelTelemetryWithProvenance = PanelTelemetry & TelemetryProvenanceFields;
type ConsoleTelemetryBundleWithProvenance = ConsoleTelemetryBundle &
  TelemetryProvenanceFields & {
    panels: PanelTelemetryWithProvenance[];
  };

type StoredTelemetry = ConsoleTelemetryBundleWithProvenance & { capturedAt: string; updatedAt: number };

const TELEMETRY_STORE = new Map<string, StoredTelemetry>();

function normalizeClaimTier(value: string | undefined): TelemetryClaimTier {
  if (value === "reduced-order" || value === "certified") {
    return value;
  }
  return "diagnostic";
}

function hasSourceIds(panel: PanelTelemetry): boolean {
  return Array.isArray(panel.sourceIds) && panel.sourceIds.some((sourceId) => sourceId.trim().length > 0);
}

function normalizePanel(panel: PanelTelemetryWithProvenance): PanelTelemetryWithProvenance {
  const sourced = hasSourceIds(panel);
  const claimTier = normalizeClaimTier(panel.claim_tier);
  const provenanceClass: TelemetryProvenanceClass =
    panel.provenance_class === "measured" || (!panel.provenance_class && sourced) ? "measured" : "synthesized";
  const sourceClass: TelemetrySourceClass =
    panel.source_class === "sensor" || (!panel.source_class && sourced) ? "sensor" : "derived";
  const certifying = claimTier === "certified" && provenanceClass === "measured";

  return {
    ...panel,
    provenance_class: provenanceClass,
    claim_tier: claimTier,
    certifying,
    source_class: sourceClass,
  };
}

function normalizeBundle(bundle: ConsoleTelemetryBundle): ConsoleTelemetryBundleWithProvenance {
  const panels = (bundle.panels ?? []).map((panel) => normalizePanel(panel));
  const hasMeasuredPanel = panels.some((panel) => panel.provenance_class === "measured");
  const claimTier = normalizeClaimTier((bundle as ConsoleTelemetryBundleWithProvenance).claim_tier);
  const provenanceClass: TelemetryProvenanceClass = hasMeasuredPanel ? "measured" : "synthesized";
  const sourceClass: TelemetrySourceClass = hasMeasuredPanel ? "sensor" : "derived";

  return {
    ...bundle,
    panels,
    provenance_class: provenanceClass,
    claim_tier: claimTier,
    certifying: claimTier === "certified" && provenanceClass === "measured",
    source_class: sourceClass,
  };
}

export function saveConsoleTelemetry(bundle: ConsoleTelemetryBundle): void {
  if (!bundle?.desktopId) {
    return;
  }
  const capturedAt = bundle.capturedAt ?? new Date().toISOString();
  const normalized = normalizeBundle(bundle);
  TELEMETRY_STORE.set(bundle.desktopId, {
    ...normalized,
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
    provenance_class: entry.provenance_class,
    claim_tier: entry.claim_tier,
    certifying: entry.certifying,
    source_class: entry.source_class,
  } as ConsoleTelemetryBundle;
}
