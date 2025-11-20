import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePanelTelemetryPublisher } from "@/lib/desktop/panelTelemetryBus";

type HelixMetrics = {
  totalTiles?: number;
  activeTiles?: number;
  activeSectors?: number;
  totalSectors?: number;
  strobeHz?: number;
  sectorPeriod_ms?: number;
  tilesPerSector?: number;
  overallStatus?: string;
  fordRoman?: { status?: string };
  dutyCycle?: number;
};

const DEFAULT_METRICS: Required<Pick<HelixMetrics, "totalTiles" | "activeTiles" | "activeSectors" | "totalSectors" | "strobeHz" | "sectorPeriod_ms">> &
  Pick<HelixMetrics, "overallStatus"> = {
  totalTiles: 0,
  activeTiles: 0,
  activeSectors: 0,
  totalSectors: 1,
  strobeHz: 0,
  sectorPeriod_ms: 0,
  overallStatus: "unknown",
};

const fetchHelixMetrics = async (): Promise<HelixMetrics | null> => {
  const response = await fetch("/api/helix/metrics", { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return (await response.json()) as HelixMetrics;
};

const formatNumber = (value: number | undefined, digits = 0): string => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "n/a";
  }
  return value.toFixed(digits);
};

const statusTone = (status: string | undefined) => {
  switch ((status ?? "").toUpperCase()) {
    case "NOMINAL":
      return "text-emerald-300";
    case "CRITICAL":
    case "FAIL":
      return "text-red-300";
    default:
      return "text-yellow-200";
  }
};

export default function CasimirTilesPanel() {
  const { data, error, isFetching } = useQuery({
    queryKey: ["casimir-tiles", "/api/helix/metrics"],
    queryFn: fetchHelixMetrics,
    refetchInterval: 2000,
  });
  const metrics = data ?? DEFAULT_METRICS;
  const totalTiles = metrics.totalTiles ?? DEFAULT_METRICS.totalTiles;
  const activeTiles = metrics.activeTiles ?? DEFAULT_METRICS.activeTiles;
  const activePct = totalTiles > 0 ? activeTiles / totalTiles : 0;
  const totalSectors = Math.max(1, metrics.totalSectors ?? DEFAULT_METRICS.totalSectors);
  const activeSectors = metrics.activeSectors ?? DEFAULT_METRICS.activeSectors;
  const status = metrics.overallStatus ?? metrics.fordRoman?.status ?? "unknown";
  const dutyPercent = typeof metrics.dutyCycle === "number" ? metrics.dutyCycle * 100 : null;

  usePanelTelemetryPublisher(
    "casimir-tiles",
    () => ({
      kind: "client",
      metrics: {
        tilesActive: activeTiles,
        totalTiles,
        strobeHz: metrics.strobeHz ?? 0,
        activeSectors,
        totalSectors,
      },
      flags: {
        hasActivity: activeTiles > 0,
        warning: status !== "NOMINAL",
      },
      strings: {
        status,
      },
      sourceIds: [
        "client/src/components/panels/CasimirTilesPanel.tsx",
        "server/helix-core.ts",
        "server/services/casimir/telemetry.ts",
        "modules/dynamic/dynamic-casimir.ts",
      ],
    }),
    [activeTiles, totalTiles, metrics.strobeHz, activeSectors, totalSectors, status],
  );

  const derived = useMemo(
    () => ({
      occupancy: `${activeTiles.toLocaleString()} / ${totalTiles.toLocaleString()} tiles`,
      sectors: `${activeSectors}/${totalSectors} sectors`,
      strobe: `${formatNumber(metrics.strobeHz, 1)} Hz`,
      sectorPeriod: `${formatNumber(metrics.sectorPeriod_ms, 1)} ms window`,
      duty: dutyPercent !== null ? `${dutyPercent.toFixed(1)}% duty` : "n/a",
    }),
    [activeTiles, totalTiles, activeSectors, totalSectors, metrics.strobeHz, metrics.sectorPeriod_ms, dutyPercent],
  );

  return (
    <div className="flex h-full flex-col gap-4 rounded border border-white/10 bg-black/30 p-4 text-sm text-slate-100">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-lg font-semibold">Casimir Tiles</div>
          <div className="text-xs opacity-70">Helix metrics sample</div>
        </div>
        <div className={`rounded border border-white/15 px-2 py-1 text-xs font-semibold uppercase ${statusTone(status)}`}>
          {status}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
        <MetricBox label="Active tiles" value={derived.occupancy} detail={`${(activePct * 100).toFixed(1)}% energized`} />
        <MetricBox label="Sectors" value={derived.sectors} detail={`Tiles/sector ≈ ${formatNumber(metrics.tilesPerSector, 0)}`} />
        <MetricBox label="Strobe" value={derived.strobe} detail={derived.sectorPeriod} />
        <MetricBox label="Duty" value={derived.duty} detail={isFetching ? "syncing..." : "live"} />
      </div>
      {error && (
        <div className="rounded border border-red-400/30 bg-red-900/20 p-2 text-xs text-red-200">
          Failed to load helix metrics: {(error as Error).message}
        </div>
      )}
      <div className="text-xs opacity-60">
        Source: <span className="font-mono">/api/helix/metrics</span> · updates every 2s
      </div>
    </div>
  );
}

type MetricBoxProps = {
  label: string;
  value: string;
  detail?: string;
};

function MetricBox({ label, value, detail }: MetricBoxProps) {
  return (
    <div className="rounded border border-white/10 bg-white/5 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide opacity-70">{label}</div>
      <div className="text-base font-semibold">{value}</div>
      {detail && <div className="text-[11px] opacity-70">{detail}</div>}
    </div>
  );
}
