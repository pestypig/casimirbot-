import React, { useEffect, useMemo, useState } from "react";
import type { KnowledgeProjectExport } from "@shared/knowledge";
import { useKnowledgeProjectsStore } from "@/store/useKnowledgeProjectsStore";
import { isFlagEnabled } from "@/lib/envFlags";

type PlanNodeLike = {
  id?: string;
  kind?: string;
  tool?: string;
  solver?: string;
  verifier?: string;
};

type TraceStep = {
  id?: string;
  kind?: string;
  ok?: boolean;
  latency_ms?: number;
  essence_ids?: string[];
  error?: string | TraceStepError;
};

type TraceStepPolicy = {
  reason?: string;
  tool?: string;
  capability?: string;
  risks?: string[];
};

type TraceStepError = {
  message?: string;
  type?: string;
  policy?: TraceStepPolicy;
};

type NormalizedStepError = {
  message: string;
  type?: string;
  policy?: TraceStepPolicy;
};

type TaskTracePayload = {
  id?: string;
  goal?: string;
  created_at?: string;
  steps?: TraceStep[];
  plan_json?: PlanNodeLike[];
  knowledgeContext?: KnowledgeProjectExport[];
};

type StepRow = {
  id: string;
  kind: string;
  title: string;
  status: "ok" | "error" | "pending";
  latencyMs?: number;
  essenceIds: string[];
  error?: NormalizedStepError;
};

const MAX_LOG_LINES = 200;

type TraceDrawerProps = {
  traceId?: string;
  open: boolean;
  onClose: () => void;
};

export default function TraceDrawer({ traceId, open, onClose }: TraceDrawerProps) {
  const [trace, setTrace] = useState<TaskTracePayload | null>(null);
  const [traceError, setTraceError] = useState<string | null>(null);
  const [lines, setLines] = useState<string[]>([]);
  const [exportBusy, setExportBusy] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const selectProjects = useKnowledgeProjectsStore((state) => state.selectProjects);
  const traceExportFlag = isFlagEnabled("ENABLE_TRACE_EXPORT");

  const planLookup = useMemo(() => {
    const map = new Map<string, PlanNodeLike>();
    if (Array.isArray(trace?.plan_json)) {
      for (const node of trace.plan_json) {
        if (node?.id) {
          map.set(node.id, node);
        }
      }
    }
    return map;
  }, [trace?.plan_json]);

  useEffect(() => {
    if (!open || !traceId) {
      return;
    }
    let canceled = false;
    const controller = new AbortController();
    setTrace(null);
    setTraceError(null);
    (async () => {
      try {
        const response = await fetch(`/api/agi/trace/${traceId}`, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`${response.status}`);
        }
        const payload = (await response.json()) as TaskTracePayload;
        if (!canceled) {
          setTrace(payload);
        }
      } catch (err) {
        if (canceled) return;
        const message = err instanceof Error ? err.message : String(err);
        setTraceError(message || "Unable to load trace.");
      }
    })();
    return () => {
      canceled = true;
      controller.abort();
    };
  }, [open, traceId]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setLines([]);
    const source = new EventSource("/api/agi/tools/logs/stream?limit=200");
    source.onmessage = (event) => {
      setLines((prev) => {
        const next = [...prev, event.data];
        return next.length > MAX_LOG_LINES ? next.slice(next.length - MAX_LOG_LINES) : next;
      });
    };
    source.onerror = () => {
      /* best-effort stream */
    };
    return () => {
      source.close();
    };
  }, [open]);

  const rows: StepRow[] = useMemo(() => {
    if (!Array.isArray(trace?.steps)) {
      return [];
    }
    return trace.steps.map((step, index) => {
      const id = step.id ?? `${index}-${step.kind ?? "step"}`;
      const plan = planLookup.get(step.id ?? "");
      const label =
        (plan?.tool as string | undefined) ||
        (plan?.solver ? `solver:${plan.solver}` : plan?.verifier ? `verifier:${plan.verifier}` : step.kind ?? "step");
      const kind = step.kind ?? plan?.kind ?? "step";
      const essenceIds = Array.isArray(step.essence_ids) ? step.essence_ids.filter(Boolean) : [];
      return {
        id,
        kind,
        title: label,
        status: step.ok === false ? "error" : step.ok === true ? "ok" : "pending",
        latencyMs: typeof step.latency_ms === "number" ? step.latency_ms : undefined,
        essenceIds,
        error: normalizeStepError(step.error),
      };
    });
  }, [planLookup, trace?.steps]);

  const knowledgeContext = trace?.knowledgeContext ?? [];

  const handleExportClick = async (id: string) => {
    setExportBusy(true);
    setExportMessage(traceExportFlag ? null : "Enable ENABLE_TRACE_EXPORT=1");
    try {
      const response = await fetch(`/api/agi/trace/${id}/export`);
      if (response.status === 404) {
        setExportMessage("Enable ENABLE_TRACE_EXPORT=1");
        return;
      }
      if (!response.ok) {
        throw new Error(`Export failed (${response.status})`);
      }
      const text = await response.text();
      const downloaded = triggerJsonDownload(text, `trace-${id}.json`);
      if (!downloaded) {
        if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          setExportMessage("Trace JSON copied to clipboard.");
        } else {
          setExportMessage("Download blocked; copy JSON manually.");
        }
      } else {
        setExportMessage(null);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setExportMessage(message || "Trace export failed.");
    } finally {
      setExportBusy(false);
    }
  };

  const handleOpenProject = (projectId: string | undefined) => {
    if (!projectId) return;
    selectProjects([projectId]);
    window.dispatchEvent(new CustomEvent("open-knowledge-project", { detail: { projectId } }));
  };

  return (
    <div
      className={`fixed right-0 top-0 h-full w-[420px] bg-[var(--panel-bg,#0f1115)] text-[var(--panel-fg,#e6e6e6)] border-l border-white/10 transition-transform duration-300 ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <div className="flex flex-col">
          <span className="font-semibold">Task Trace</span>
          {trace?.goal && <span className="text-[11px] opacity-70 truncate max-w-[280px]">{trace.goal}</span>}
        </div>
        <div className="flex items-center gap-3">
          {traceId && (
            <button
              className="text-xs underline opacity-80 hover:opacity-100 disabled:opacity-40"
              onClick={() => traceId && void handleExportClick(traceId)}
              disabled={exportBusy}
              title={!traceExportFlag ? "Enable ENABLE_TRACE_EXPORT=1" : undefined}
            >
              {exportBusy ? "Exporting..." : "Export JSON"}
            </button>
          )}
          <button className="text-xs opacity-70 hover:opacity-100 underline" onClick={onClose}>
            close
          </button>
        </div>
      </div>
      {exportMessage && (
        <div className="px-5 py-2 text-[11px] text-yellow-300 border-b border-white/10 bg-black/10">{exportMessage}</div>
      )}
      <div className="p-4 space-y-3 overflow-auto h-[calc(100%-52px-140px)]">
        {!traceId && <div className="opacity-60 text-sm">Trigger a task to view its trace.</div>}
        {traceId && !trace && !traceError && <div className="opacity-60 text-sm">Loading trace…</div>}
        {traceError && <div className="text-sm text-red-400">Trace error: {traceError}</div>}
        {knowledgeContext.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-wide opacity-60">Knowledge Attachments</div>
            {knowledgeContext.map((project) => (
              <div
                key={project.project.id}
                className="rounded border border-white/10 p-3 space-y-2 bg-black/20"
                data-knowledge-project={project.project.id}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">{project.project.name}</div>
                    {project.project.tags && (
                      <div className="text-[11px] opacity-70">{project.project.tags.join(", ")}</div>
                    )}
                  </div>
                  <button
                    className="text-[11px] underline opacity-80 hover:opacity-100"
                    onClick={() => handleOpenProject(project.project.id)}
                  >
                    Open
                  </button>
                </div>
                <div className="space-y-1 text-[11px]">
                  {project.files.slice(0, 5).map((file) => (
                    <div key={file.id} className="flex items-center justify-between gap-2 border border-white/10 rounded px-2 py-1">
                      <span className="truncate">{file.name}</span>
                      <span className="opacity-70">{file.kind} · {formatBytes(file.size)}</span>
                    </div>
                  ))}
                  {project.files.length > 5 && (
                    <div className="text-[11px] opacity-60">
                      +{project.files.length - 5} more files truncated for this trace.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {rows.map((row) => (
          <div
            key={row.id}
            className="rounded border border-white/10 p-3 space-y-2"
            data-trace-step={row.id}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm truncate">{row.title}</div>
              <div
                className={`text-xs uppercase ${
                  row.status === "ok" ? "text-green-400" : row.status === "error" ? "text-red-400" : "text-yellow-300"
                }`}
              >
                {row.status}
              </div>
            </div>
            <div className="text-[11px] opacity-70 flex flex-wrap gap-2">
              <span>{row.kind}</span>
              {typeof row.latencyMs === "number" && <span>{row.latencyMs} ms</span>}
            </div>
            {row.essenceIds.length > 0 && (
              <div className="text-[11px]">
                Essence:
                {row.essenceIds.map((eid) => (
                  <a
                    key={eid}
                    className="underline opacity-90 hover:opacity-100 ml-2"
                    href={`/api/essence/${eid}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {eid.slice(0, 8)}…
                  </a>
                ))}
              </div>
            )}
            {row.error && (
              <div className="space-y-1">
                <div className="text-[11px] text-red-300">{row.error.message}</div>
                {row.error.type === "approval_denied" && row.error.policy?.reason && (
                  <div className="rounded border border-yellow-400/50 bg-yellow-500/10 text-[11px] text-yellow-100 px-2 py-1">
                    {row.error.policy.reason}
                    {row.error.policy.tool && <span className="ml-1 opacity-70">({row.error.policy.tool})</span>}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 p-3 h-[140px] overflow-auto text-[11px] opacity-80 bg-black/20">
        {lines.length === 0 && <div className="opacity-60">Waiting for tool logs…</div>}
        {lines.map((line, index) => (
          <div key={`${line}-${index}`} className="whitespace-pre">
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(1)} GB`;
}

function normalizeStepError(error?: string | TraceStepError): NormalizedStepError | undefined {
  if (!error) {
    return undefined;
  }
  if (typeof error === "string") {
    return { message: error };
  }
  const message = error.message?.trim() || "Step failed.";
  return {
    message,
    type: error.type,
    policy: error.policy,
  };
}

function triggerJsonDownload(text: string, filename: string): boolean {
  try {
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}
