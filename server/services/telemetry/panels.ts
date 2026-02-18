import type { PanelTelemetry } from "@shared/desktop";
import { ensureCasimirTelemetry } from "../casimir/telemetry";
import { getConsoleTelemetry } from "../console-telemetry/store";

const DEFAULT_DESKTOP_ID = "helix.desktop.main";
const PROVENANCE_MISSING_FAIL_TAG = "telemetry_provenance_missing";
const PROVENANCE_MISSING_FAIL_REASON = "strict provenance mode requires sourceIds for telemetry panels";

type ProvenanceClass = "measured" | "synthesized";
type ClaimTier = "certified" | "diagnostic";

type ProvenanceFields = {
  provenance_class: ProvenanceClass;
  claim_tier: ClaimTier;
  certifying: boolean;
  provenance_tag?: string;
};

type PanelWithProvenance = PanelTelemetry & ProvenanceFields;

export type PanelSnapshot = {
  desktopId: string;
  capturedAt: string;
  panels: PanelWithProvenance[];
  fail_reason?: string;
  fail_tag?: string;
};

type CollectArgs = {
  desktopId?: string;
  panelIds?: string[];
  strictProvenance?: boolean;
};

const hasSourceProvenance = (panel: PanelTelemetry): boolean =>
  Array.isArray(panel.sourceIds) && panel.sourceIds.some((id) => Boolean(id?.trim()));

const withProvenance = (panel: PanelTelemetry): PanelWithProvenance => {
  const hasProvenance = hasSourceProvenance(panel);
  const synthesized = !hasProvenance;
  return {
    ...panel,
    sourceIds: panel.sourceIds?.filter(Boolean),
    provenance_class: synthesized ? "synthesized" : "measured",
    claim_tier: synthesized ? "diagnostic" : "certified",
    certifying: !synthesized,
    ...(synthesized ? { provenance_tag: "fallback" } : {}),
  };
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
      .map((panel) => withProvenance(panel)) ?? [];

  const strictMissingProvenance =
    args.strictProvenance === true && panels.some((panel) => panel.provenance_class === "synthesized");

  return {
    desktopId,
    capturedAt: bundle?.capturedAt ?? new Date().toISOString(),
    panels,
    ...(strictMissingProvenance
      ? {
          fail_reason: PROVENANCE_MISSING_FAIL_REASON,
          fail_tag: PROVENANCE_MISSING_FAIL_TAG,
        }
      : {}),
  };
}

export { DEFAULT_DESKTOP_ID as DEFAULT_PANEL_DESKTOP_ID };
