import fs from "node:fs/promises";
import path from "node:path";
import type { ConsoleTelemetryBundle, PanelTelemetry } from "@shared/desktop";

const SNAPSHOT_PATH = path.join(process.cwd(), "server/_generated/console-telemetry.json");

export const CONSOLE_TELEMETRY_SNAPSHOT_PATH = SNAPSHOT_PATH;

type SnapshotClaimTier = "diagnostic" | "reduced-order" | "certified";

type SnapshotProvenanceFields = {
  provenance_class?: string;
  claim_tier?: string;
  certifying?: boolean;
  source_class?: string;
};

function normalizeClaimTier(value: string | undefined): SnapshotClaimTier {
  if (value === "reduced-order" || value === "certified") {
    return value;
  }
  return "diagnostic";
}

function hasSourceIds(panel: PanelTelemetry): boolean {
  return Array.isArray(panel.sourceIds) && panel.sourceIds.some((sourceId) => sourceId.trim().length > 0);
}

function normalizePanel(panel: PanelTelemetry & SnapshotProvenanceFields): PanelTelemetry & SnapshotProvenanceFields {
  const sourced = hasSourceIds(panel);
  const claimTier = normalizeClaimTier(panel.claim_tier);
  const provenanceClass =
    panel.provenance_class === "measured" || (!panel.provenance_class && sourced) ? "measured" : "synthesized";
  const sourceClass = panel.source_class === "sensor" || (!panel.source_class && sourced) ? "sensor" : "derived";

  return {
    ...panel,
    provenance_class: provenanceClass,
    claim_tier: claimTier,
    certifying: claimTier === "certified" && provenanceClass === "measured",
    source_class: sourceClass,
  };
}

function withProvenanceDefaults(bundle: ConsoleTelemetryBundle): ConsoleTelemetryBundle & SnapshotProvenanceFields {
  const panels = (bundle.panels ?? []).map((panel) => normalizePanel(panel));
  const hasMeasuredPanel = panels.some((panel) => panel.provenance_class === "measured");
  const claimTier = normalizeClaimTier((bundle as ConsoleTelemetryBundle & SnapshotProvenanceFields).claim_tier);
  const provenanceClass = hasMeasuredPanel ? "measured" : "synthesized";
  const sourceClass = hasMeasuredPanel ? "sensor" : "derived";

  return {
    ...bundle,
    panels,
    claim_tier: claimTier,
    provenance_class: provenanceClass,
    certifying: claimTier === "certified" && provenanceClass === "measured",
    source_class: sourceClass,
  };
}

export async function persistConsoleTelemetrySnapshot(bundle: ConsoleTelemetryBundle): Promise<void> {
  await fs.mkdir(path.dirname(SNAPSHOT_PATH), { recursive: true });
  await fs.writeFile(SNAPSHOT_PATH, JSON.stringify(withProvenanceDefaults(bundle), null, 2), "utf8");
}
