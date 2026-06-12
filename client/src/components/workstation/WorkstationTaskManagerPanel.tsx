import * as React from "react";
import { Activity, Gauge, Monitor, RefreshCw, Server } from "lucide-react";
import { getPanelDef } from "@/lib/desktop/panelRegistry";
import { useMobileAppStore } from "@/store/useMobileAppStore";
import { useWorkstationLayoutStore } from "@/store/useWorkstationLayoutStore";
import {
  sortHelixWorkstationTaskManagerProcesses,
  summarizeHelixWorkstationTaskManager,
  withHelixWorkstationTaskManagerAuthority,
  type HelixWorkstationTaskManagerProcess,
  type HelixWorkstationTaskManagerSnapshot,
} from "@shared/helix-workstation-task-manager";

type BrowserPerformanceMemory = {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
};

const BYTES_PER_MIB = 1024 * 1024;
const POLL_INTERVAL_MS = 5000;

const formatMiB = (value: number | null | undefined): string => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "unknown";
  if (value >= 100) return `${Math.round(value)} MiB`;
  return `${Math.round(value * 10) / 10} MiB`;
};

const toMiB = (value: number | null | undefined): number | null => {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.round((value / BYTES_PER_MIB) * 10) / 10;
};

const statusClass = (status: string): string => {
  switch (status) {
    case "active":
    case "focused":
      return "border-emerald-300/40 bg-emerald-500/10 text-emerald-100";
    case "open":
    case "idle":
      return "border-slate-400/30 bg-slate-500/10 text-slate-200";
    case "queued":
    case "degraded":
      return "border-amber-300/40 bg-amber-500/10 text-amber-100";
    case "paused":
      return "border-cyan-300/40 bg-cyan-500/10 text-cyan-100";
    case "blocked":
      return "border-rose-300/40 bg-rose-500/10 text-rose-100";
    default:
      return "border-slate-500/30 bg-slate-800 text-slate-300";
  }
};

const kindLabel = (kind: string): string =>
  kind.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const memoryDisplay = (process: HelixWorkstationTaskManagerProcess): string => {
  const memory = process.memory;
  if (memory.used_mib != null) return formatMiB(memory.used_mib);
  if (memory.rss_mib != null) return formatMiB(memory.rss_mib);
  if (memory.heap_used_mib != null) return formatMiB(memory.heap_used_mib);
  if (memory.estimate_mib != null) return `~${formatMiB(memory.estimate_mib)}`;
  return "unknown";
};

const sampleBrowserMemory = (): HelixWorkstationTaskManagerProcess | null => {
  if (typeof window === "undefined") return null;
  const memory = (window.performance as Performance & { memory?: BrowserPerformanceMemory }).memory;
  if (!memory) {
    return withHelixWorkstationTaskManagerAuthority({
      process_id: "browser.renderer",
      label: "Browser renderer",
      kind: "browser_renderer",
      status: "unknown",
      source: "browser_performance_memory",
      updated_at: new Date().toISOString(),
      memory: {
        source: "browser_performance_memory",
        approximate: true,
        observed: false,
        estimate_mib: null,
        pressure: "unknown",
      },
      diagnostics: {
        browser_memory_api_available: false,
        dom_node_count: typeof document !== "undefined" ? document.getElementsByTagName("*").length : 0,
      },
    });
  }
  return withHelixWorkstationTaskManagerAuthority({
    process_id: "browser.renderer",
    label: "Browser renderer",
    kind: "browser_renderer",
    status: "active",
    source: "browser_performance_memory",
    updated_at: new Date().toISOString(),
    memory: {
      source: "browser_performance_memory",
      approximate: true,
      observed: true,
      used_mib: toMiB(memory.usedJSHeapSize),
      heap_used_mib: toMiB(memory.usedJSHeapSize),
      heap_total_mib: toMiB(memory.totalJSHeapSize),
      heap_limit_mib: toMiB(memory.jsHeapSizeLimit),
      pressure: "browser_renderer_heap",
    },
    diagnostics: {
      browser_memory_api_available: true,
      dom_node_count: typeof document !== "undefined" ? document.getElementsByTagName("*").length : 0,
    },
  });
};

const panelEstimateMiB = (panelId: string): number | null => {
  if (panelId === "stage-play-badge-graph") return 96;
  if (panelId === "theory-badge-graph") return 72;
  if (panelId === "live-answer-environment") return 48;
  if (panelId === "image-lens" || panelId === "document-image-lens") return 48;
  if (panelId === "workstation-process-graph") return 32;
  return getPanelDef(panelId)?.heavy ? 64 : null;
};

const buildPanelProcesses = (
  panelIds: readonly string[],
  focusedPanelId: string | null | undefined,
  source: "workstation_layout_store" | "mobile_app_store",
): HelixWorkstationTaskManagerProcess[] =>
  Array.from(new Set(panelIds)).map((panelId) => {
    const def = getPanelDef(panelId);
    const isFocused = focusedPanelId === panelId;
    const estimateMiB = panelEstimateMiB(panelId);
    const packetNodeCount =
      panelId === "stage-play-badge-graph" && typeof document !== "undefined"
        ? document.querySelectorAll('[data-testid*="stage-play"][data-testid*="packet"]').length
        : null;
    return withHelixWorkstationTaskManagerAuthority({
      process_id: `panel.${panelId}`,
      label: def?.title ?? panelId,
      kind: panelId === "stage-play-badge-graph" ? "stage_play_packet_flow" : "workstation_panel",
      status: isFocused ? "focused" : "open",
      panel_id: panelId,
      source,
      updated_at: new Date().toISOString(),
      memory: {
        source: panelId === "stage-play-badge-graph" ? "stage_play_panel_projection" : "browser_panel_registry",
        approximate: true,
        observed: false,
        estimate_mib: estimateMiB,
        pressure: null,
      },
      diagnostics: {
        memory_is_panel_level_estimate: true,
        panel_weight: def?.heavy ? "heavy" : "standard",
        stage_play_packet_dom_node_count: packetNodeCount,
      },
    });
  });

const mergeProcesses = (
  serverSnapshot: HelixWorkstationTaskManagerSnapshot | null,
  browserProcesses: readonly HelixWorkstationTaskManagerProcess[],
): HelixWorkstationTaskManagerProcess[] => {
  const byId = new Map<string, HelixWorkstationTaskManagerProcess>();
  for (const process of serverSnapshot?.processes ?? []) byId.set(process.process_id, process);
  for (const process of browserProcesses) byId.set(process.process_id, process);
  return sortHelixWorkstationTaskManagerProcesses([...byId.values()]);
};

export default function WorkstationTaskManagerPanel() {
  const layoutGroups = useWorkstationLayoutStore((state) => state.groups);
  const activeGroupId = useWorkstationLayoutStore((state) => state.activeGroupId);
  const mobileStack = useMobileAppStore((state) => state.stack);
  const mobileActiveId = useMobileAppStore((state) => state.activeId);
  const [serverSnapshot, setServerSnapshot] = React.useState<HelixWorkstationTaskManagerSnapshot | null>(null);
  const [browserProcesses, setBrowserProcesses] = React.useState<HelixWorkstationTaskManagerProcess[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refreshBrowserProcesses = React.useCallback(() => {
    const layoutPanelIds = Object.values(layoutGroups).flatMap((group) => group.panelIds);
    const focusedPanelId = layoutGroups[activeGroupId]?.activePanelId ?? null;
    const panelProcesses = buildPanelProcesses(layoutPanelIds, focusedPanelId, "workstation_layout_store");
    const mobileProcesses = buildPanelProcesses(mobileStack.map((entry) => entry.panelId), mobileActiveId, "mobile_app_store");
    const browser = sampleBrowserMemory();
    setBrowserProcesses([
      ...(browser ? [browser] : []),
      ...panelProcesses,
      ...mobileProcesses,
    ]);
  }, [activeGroupId, layoutGroups, mobileActiveId, mobileStack]);

  const refreshServerSnapshot = React.useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/workspace-os/task-manager?thread_id=helix-ask%3Adesktop", { signal });
      if (!response.ok) throw new Error(`task-manager ${response.status}`);
      const body = await response.json() as HelixWorkstationTaskManagerSnapshot;
      setServerSnapshot(body);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError(err instanceof Error ? err.message : "Failed to load task manager snapshot.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refreshBrowserProcesses();
  }, [refreshBrowserProcesses]);

  React.useEffect(() => {
    const controller = new AbortController();
    refreshBrowserProcesses();
    void refreshServerSnapshot(controller.signal);
    const timer = window.setInterval(() => {
      refreshBrowserProcesses();
      void refreshServerSnapshot();
    }, POLL_INTERVAL_MS);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [refreshBrowserProcesses, refreshServerSnapshot]);

  const processes = React.useMemo(
    () => mergeProcesses(serverSnapshot, browserProcesses),
    [browserProcesses, serverSnapshot],
  );
  const summary = React.useMemo(
    () => summarizeHelixWorkstationTaskManager(processes, serverSnapshot?.summary.pressure_level ?? null),
    [processes, serverSnapshot?.summary.pressure_level],
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-950 text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Activity className="h-4 w-4 text-emerald-200" />
          Task Manager
        </div>
        <button
          type="button"
          onClick={() => {
            refreshBrowserProcesses();
            void refreshServerSnapshot();
          }}
          className="inline-flex items-center gap-1 rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-200 hover:border-emerald-300/40 hover:bg-emerald-500/10"
          title="Refresh"
          aria-label="Refresh task manager"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-px border-b border-white/10 bg-white/10 text-xs md:grid-cols-4">
        <div className="bg-slate-950 px-3 py-2">
          <div className="flex items-center gap-1.5 text-slate-400"><Gauge className="h-3.5 w-3.5" /> Pressure</div>
          <div className="mt-1 font-semibold text-slate-100">{summary.pressure_level ?? "unknown"}</div>
        </div>
        <div className="bg-slate-950 px-3 py-2">
          <div className="flex items-center gap-1.5 text-slate-400"><Server className="h-3.5 w-3.5" /> Observed</div>
          <div className="mt-1 font-semibold text-slate-100">{formatMiB(summary.total_observed_mib)}</div>
        </div>
        <div className="bg-slate-950 px-3 py-2">
          <div className="flex items-center gap-1.5 text-slate-400"><Monitor className="h-3.5 w-3.5" /> Processes</div>
          <div className="mt-1 font-semibold text-slate-100">{summary.process_count}</div>
        </div>
        <div className="bg-slate-950 px-3 py-2">
          <div className="text-slate-400">Samples</div>
          <div className="mt-1 font-semibold text-slate-100">
            {summary.server_sample_included ? "server" : "no server"} / {summary.browser_sample_included ? "browser" : "no browser"}
          </div>
        </div>
      </div>

      {error ? (
        <div className="border-b border-amber-300/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">{error}</div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full table-fixed text-left text-xs">
          <thead className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/95 text-[11px] uppercase text-slate-500">
            <tr>
              <th className="w-[34%] px-3 py-2 font-medium">Name</th>
              <th className="w-[18%] px-3 py-2 font-medium">Kind</th>
              <th className="w-[14%] px-3 py-2 font-medium">Status</th>
              <th className="w-[16%] px-3 py-2 font-medium">Memory</th>
              <th className="w-[18%] px-3 py-2 font-medium">Source</th>
            </tr>
          </thead>
          <tbody>
            {processes.map((process) => (
              <tr key={process.process_id} className="border-b border-white/5 hover:bg-white/[0.03]">
                <td className="px-3 py-2">
                  <div className="truncate font-medium text-slate-100">{process.label}</div>
                  <div className="mt-0.5 truncate text-[10px] text-slate-500">{process.process_id}</div>
                </td>
                <td className="px-3 py-2 text-slate-300">{kindLabel(process.kind)}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] uppercase ${statusClass(process.status)}`}>
                    {process.status}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="font-semibold text-slate-100">{memoryDisplay(process)}</div>
                  <div className="mt-0.5 text-[10px] text-slate-500">
                    {process.memory.observed ? "observed" : process.memory.estimate_mib != null ? "estimated" : "unknown"}
                    {process.memory.approximate ? " / approximate" : ""}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="truncate text-slate-300">{process.memory.source.replace(/_/g, " ")}</div>
                  <div className="mt-0.5 truncate text-[10px] text-slate-500">{process.task_class ?? process.panel_id ?? process.source ?? ""}</div>
                </td>
              </tr>
            ))}
            {processes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                  No task snapshot available.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="border-t border-white/10 px-3 py-2 text-[11px] text-slate-500">
        schema {serverSnapshot?.schema_version ?? "local.browser_task_manager.v1"} · sorted by observed memory, then estimates
      </div>
    </div>
  );
}

