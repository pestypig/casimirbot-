import type { BadgeProof, BadgeSolution, BadgeTelemetryEntry, BadgeTelemetrySnapshot } from "@shared/badge-telemetry";
import type { PanelTelemetry } from "@shared/desktop";
import { ensureCasimirTelemetry } from "../casimir/telemetry";
import { getConsoleTelemetry } from "../console-telemetry/store";

const DEFAULT_DESKTOP_ID = "helix.desktop.main";

type CollectArgs = {
  desktopId?: string;
  panelIds?: string[];
};

type CollectResult = { snapshot: BadgeTelemetrySnapshot; rawPanels: PanelTelemetry[] };

const toFiniteNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const raiseStatus = (current: BadgeTelemetryEntry["status"], next: BadgeTelemetryEntry["status"]) => {
  const order: Record<BadgeTelemetryEntry["status"], number> = { ok: 1, warn: 2, error: 3, unknown: 0 };
  return order[next] > order[current] ? next : current;
};

const fmtPercent = (value: number | null): string | null =>
  value === null ? null : `${Math.round(value * 1000) / 10}%`;

const normalizeBadgePanel = (panel: PanelTelemetry): BadgeTelemetryEntry => {
  const metrics = panel.metrics ?? {};
  const flags = panel.flags ?? {};
  const proofs: BadgeProof[] = [];
  const solutions: BadgeSolution[] = [];
  const occupancy = toFiniteNumber(metrics.occupancy);
  const coherence = toFiniteNumber(metrics.coherence ?? (metrics as Record<string, unknown>).coherence_avg);
  const qFactor = toFiniteNumber(metrics.avgQFactor ?? (metrics as Record<string, unknown>).qFactor);
  const activeTiles = toFiniteNumber(metrics.tilesActive ?? metrics.active);
  const totalTiles = toFiniteNumber(metrics.totalTiles ?? metrics.total);
  const primaryBand = Array.isArray(panel.bands) ? panel.bands[0] : null;
  let status: BadgeTelemetryEntry["status"] = "unknown";
  if (occupancy !== null) {
    proofs.push({ label: "occupancy", value: fmtPercent(occupancy) ?? `${occupancy}` });
    status = occupancy > 0.95 ? "error" : occupancy > 0.8 ? "warn" : "ok";
  }
  if (primaryBand) {
    const qBand = toFiniteNumber(primaryBand.q);
    const cohBand = toFiniteNumber(primaryBand.coherence);
    const valueParts: string[] = [];
    if (qBand !== null) valueParts.push(`q=${qBand.toFixed(3)}`);
    if (cohBand !== null) valueParts.push(`coh=${cohBand.toFixed(3)}`);
    proofs.push({
      label: `band:${primaryBand.name}`,
      value: valueParts.length ? valueParts.join(" ") : primaryBand.name,
      severity: coherence !== null && coherence < 0.6 ? "warn" : "info",
    });
  }
  if (coherence !== null) {
    proofs.push({ label: "coherence", value: coherence.toFixed(3) });
    if (coherence < 0.45) {
      status = raiseStatus(status, "error");
      solutions.push({
        action: "Raise coherence above 0.6",
        rationale: "Low coherence degrades badge proofs and downstream guard bands.",
        severity: "urgent",
      });
    } else if (coherence < 0.6) {
      status = raiseStatus(status, "warn");
      solutions.push({
        action: "Sweep coherence bands",
        rationale: "Borderline coherence; re-run guard or sweep Casimir bands.",
        severity: "warn",
      });
    } else {
      status = raiseStatus(status, "ok");
    }
  }
  if (qFactor !== null) {
    proofs.push({ label: "Q\u2097", value: qFactor.toFixed(3) });
    if (qFactor < 0.55 || flags.lowQFactor) {
      status = raiseStatus(status, "warn");
      solutions.push({
        action: "Improve Q discipline",
        rationale: "Low Q weakens fractional coherence behind the badges.",
        severity: "warn",
      });
    }
  }
  if (activeTiles !== null && totalTiles !== null) {
    proofs.push({ label: "tiles", value: `${activeTiles}/${totalTiles}` });
  }
  const summaryParts: string[] = [];
  if (occupancy !== null) {
    const pct = fmtPercent(occupancy);
    if (pct) summaryParts.push(`occupancy ${pct}`);
  }
  if (coherence !== null) {
    summaryParts.push(`coherence ${coherence.toFixed(3)}`);
  }
  if (qFactor !== null) {
    summaryParts.push(`Q ${qFactor.toFixed(3)}`);
  }
  if (solutions.length === 0 && status === "ok") {
    solutions.push({ action: "Continue monitoring", rationale: "Badges are healthy.", severity: "info" });
  }
  const summary = summaryParts.length ? summaryParts.join(" · ") : panel.notes || "No telemetry published yet.";
  return {
    panelId: panel.panelId,
    instanceId: panel.instanceId,
    title: panel.title,
    kind: panel.kind,
    status,
    summary,
    proofs,
    solutions,
    metrics: metrics && Object.keys(metrics).length ? metrics : undefined,
    flags: flags && Object.keys(flags).length ? flags : undefined,
    bands: panel.bands,
    lastUpdated: panel.lastUpdated,
    sourceIds: panel.sourceIds,
  };
};

export function collectBadgeTelemetry(args: CollectArgs = {}): CollectResult {
  const desktopId = args.desktopId?.trim() || DEFAULT_DESKTOP_ID;
  const base = getConsoleTelemetry(desktopId);
  const hasRealCasimirPanel = Boolean(
    base?.panels?.some((panel) => panel.panelId === "casimir-tiles" && panel.instanceId === "casimir-tiles.server"),
  );
  const { bundle } = hasRealCasimirPanel ? { bundle: base } : ensureCasimirTelemetry({ desktopId, base });
  const panelFilter =
    Array.isArray(args.panelIds) && args.panelIds.length > 0
      ? new Set(args.panelIds.map((id) => id.toLowerCase()))
      : null;
  const rawPanels =
    bundle?.panels?.filter((panel) => !panelFilter || panelFilter.has(panel.panelId.toLowerCase())) ?? [];
  const entries = rawPanels.map((panel) => normalizeBadgePanel(panel));
  const totals = entries.reduce(
    (acc, entry) => {
      acc.total += 1;
      acc[entry.status] = (acc[entry.status] ?? 0) + 1;
      return acc;
    },
    { total: 0, ok: 0, warn: 0, error: 0, unknown: 0 } as Record<string, number>,
  );
  const summary = `Live badge telemetry: ${totals.total} panels (${totals.ok} ok, ${totals.warn} warn, ${totals.error} error). Captured ${bundle?.capturedAt ?? "n/a"}. Fractional coherence grid overlays coherence/Q on the same Casimir tile grid; use the grid/rail panels to inspect bands behind the badges.`;
  const relatedPanels = ["casimir-tile-grid", "fractional-coherence-grid", "fractional-coherence-rail"];
  const relationNotes = [
    "Casimir Tile Grid shows occupancy/hot tiles; fractional coherence grid/rail layer coherence and Q on the same tiles.",
    "Badge proofs are derived from these panels’ telemetry (occupancy, coherence, Q).",
  ];
  return {
    snapshot: {
      desktopId,
      capturedAt: bundle?.capturedAt ?? new Date().toISOString(),
      summary,
      entries,
      total: entries.length,
      relatedPanels,
      relationNotes,
    },
    rawPanels,
  };
}

export { DEFAULT_DESKTOP_ID as DEFAULT_BADGE_TELEMETRY_DESKTOP };
