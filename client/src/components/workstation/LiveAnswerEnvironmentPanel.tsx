import React, { useEffect, useMemo, useState } from "react";
import {
  selectActiveLiveAnswerEnvironment,
  selectLiveAnswerEnvironmentDeltas,
  useLiveAnswerEnvironmentStore,
  type LiveAnswerEnvironmentState,
} from "@/store/useLiveAnswerEnvironmentStore";
import type { WorkstationLiveSource, WorkstationLiveSourceEvent, LiveSourceWindowSummary } from "@shared/helix-workstation-live-source";
import type { LiveAnswerEnvironmentDelta, LiveAnswerLineState } from "@shared/helix-live-answer-environment";

type LiveEnvironmentTab = "overview" | "sources" | "line_schema" | "deltas" | "windows" | "debug";

const tabs: Array<{ id: LiveEnvironmentTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "sources", label: "Sources" },
  { id: "line_schema", label: "Line Schema" },
  { id: "deltas", label: "Deltas" },
  { id: "windows", label: "Windows" },
  { id: "debug", label: "Debug" },
];

const postJson = async (path: string, body?: Record<string, unknown>) => {
  await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
};

const formatTime = (value?: string | null): string => {
  if (!value) return "never";
  const ts = Date.parse(value);
  return Number.isFinite(ts) ? new Date(ts).toLocaleTimeString() : value;
};

export function LiveAnswerEnvironmentPanel({ threadId = "helix-ask:desktop" }: { threadId?: string }) {
  const [activeTab, setActiveTab] = useState<LiveEnvironmentTab>("overview");
  const [sources, setSources] = useState<WorkstationLiveSource[]>([]);
  const [events, setEvents] = useState<WorkstationLiveSourceEvent[]>([]);
  const [windows, setWindows] = useState<LiveSourceWindowSummary[]>([]);
  const [lastFetchError, setLastFetchError] = useState<string | null>(null);
  const environment = useLiveAnswerEnvironmentStore((state: LiveAnswerEnvironmentState) =>
    selectActiveLiveAnswerEnvironment(state, threadId),
  );
  const deltas = useLiveAnswerEnvironmentStore((state: LiveAnswerEnvironmentState) =>
    selectLiveAnswerEnvironmentDeltas(state, environment?.environment_id),
  );
  const diagnostics = useLiveAnswerEnvironmentStore(
    (state: LiveAnswerEnvironmentState) => state.diagnosticsByThread[threadId] ?? null,
  );
  const loadEnvironment = useLiveAnswerEnvironmentStore((state: LiveAnswerEnvironmentState) => state.loadLiveAnswerEnvironment);
  const sourceIds = useMemo(() => new Set(environment?.source_ids ?? []), [environment?.source_ids]);
  const relevantSources = useMemo(
    () => sources.filter((source: WorkstationLiveSource) => sourceIds.size === 0 || sourceIds.has(source.source_id) || source.environment_id === environment?.environment_id),
    [environment?.environment_id, sourceIds, sources],
  );
  const relevantEvents = useMemo(
    () => events.filter((event: WorkstationLiveSourceEvent) => sourceIds.size === 0 || sourceIds.has(event.source_id) || event.environment_id === environment?.environment_id),
    [environment?.environment_id, events, sourceIds],
  );
  const relevantWindows = useMemo(
    () => windows.filter((window: LiveSourceWindowSummary) => sourceIds.size === 0 || sourceIds.has(window.source_id) || window.environment_id === environment?.environment_id),
    [environment?.environment_id, sourceIds, windows],
  );

  const refresh = async () => {
    try {
      await loadEnvironment(threadId, 50);
      const [sourceRes, eventRes, windowRes] = await Promise.all([
        fetch("/api/agi/situation/live-source/list"),
        fetch("/api/agi/situation/live-source/events"),
        fetch("/api/agi/situation/live-source/windows"),
      ]);
      const [sourceBody, eventBody, windowBody] = await Promise.all([
        sourceRes.json(),
        eventRes.json(),
        windowRes.json(),
      ]);
      setSources(Array.isArray(sourceBody.sources) ? sourceBody.sources : []);
      setEvents(Array.isArray(eventBody.events) ? eventBody.events : []);
      setWindows(Array.isArray(windowBody.windows) ? windowBody.windows : []);
      setLastFetchError(null);
    } catch (error) {
      setLastFetchError(error instanceof Error ? error.message : "live_environment_refresh_failed");
    }
  };

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 5000);
    return () => window.clearInterval(interval);
  }, [threadId]);

  const setEnvironmentStatus = async (action: "pause" | "resume" | "stop") => {
    if (!environment) return;
    await postJson(`/api/agi/situation/live-answer-environment/${encodeURIComponent(environment.environment_id)}/${action}`);
    await refresh();
  };

  const setSourceStatus = async (sourceId: string, action: "pause" | "resume" | "stop" | "reset-counters") => {
    await postJson(`/api/agi/situation/live-source/${encodeURIComponent(sourceId)}/${action}`);
    await refresh();
  };

  return (
    <section className="rounded-lg border border-cyan-300/20 bg-cyan-950/10 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase text-cyan-200">Live Environments</p>
          <p className="mt-1 text-xs text-slate-400">
            Source ticks update compact line artifacts. Raw logs stay in Debug, not Helix Ask context.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {environment ? (
            <>
              <button type="button" onClick={() => void setEnvironmentStatus("pause")} className="rounded border border-white/15 px-2 py-1 text-[11px] text-slate-200 hover:bg-white/10">Pause</button>
              <button type="button" onClick={() => void setEnvironmentStatus("resume")} className="rounded border border-white/15 px-2 py-1 text-[11px] text-slate-200 hover:bg-white/10">Resume</button>
              <button type="button" onClick={() => void setEnvironmentStatus("stop")} className="rounded border border-rose-300/25 px-2 py-1 text-[11px] text-rose-100 hover:bg-rose-400/10">Stop</button>
            </>
          ) : null}
          <button type="button" onClick={() => void refresh()} className="rounded border border-cyan-300/30 px-2 py-1 text-[11px] text-cyan-100 hover:bg-cyan-400/10">Refresh</button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {tabs.map((tab: { id: LiveEnvironmentTab; label: string }) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded border px-2 py-1 text-[11px] ${activeTab === tab.id ? "border-cyan-300/40 bg-cyan-400/10 text-cyan-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {!environment ? (
        <p className="mt-3 text-xs text-slate-500">No active live answer environment for {threadId}. Start one from Helix Ask.</p>
      ) : (
        <div className="mt-3">
          {activeTab === "overview" ? (
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              {([
                ["Environment", environment.environment_id],
                ["Objective", environment.objective],
                ["Thread", environment.thread_id],
                ["Status", `${environment.status} / ${environment.mode}`],
                ["Sources", String(environment.source_ids.length)],
                ["Lines", String(environment.lines.length)],
                ["Last update", formatTime(environment.updated_at)],
                ["Last evaluation", environment.latest_evaluation?.summary ?? environment.latest_summary],
              ] as Array<[string, string]>).map(([label, value]: [string, string]) => (
                <div key={label} className="rounded border border-white/10 bg-slate-950/70 p-2">
                  <p className="text-[10px] uppercase text-slate-500">{label}</p>
                  <p className="mt-1 break-words text-xs text-slate-200">{value}</p>
                </div>
              ))}
            </div>
          ) : null}
          {activeTab === "sources" ? (
            <div className="space-y-2">
              {relevantSources.length === 0 ? <p className="text-xs text-slate-500">No attached live sources.</p> : null}
              {relevantSources.map((source: WorkstationLiveSource) => (
                <div key={source.source_id} className="rounded border border-white/10 bg-slate-950/70 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-100">{source.source_id}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{source.kind} / {source.status} / events {source.event_count ?? 0}</p>
                      <p className="mt-1 text-[11px] text-slate-500">last tick {source.last_tick_index ?? "none"} / {formatTime(source.last_event_ts)}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <button type="button" onClick={() => void setSourceStatus(source.source_id, "pause")} className="rounded border border-white/15 px-2 py-1 text-[10px] text-slate-200">Pause</button>
                      <button type="button" onClick={() => void setSourceStatus(source.source_id, "resume")} className="rounded border border-white/15 px-2 py-1 text-[10px] text-slate-200">Resume</button>
                      <button type="button" onClick={() => void setSourceStatus(source.source_id, "stop")} className="rounded border border-white/15 px-2 py-1 text-[10px] text-slate-200">Stop</button>
                      <button type="button" onClick={() => void setSourceStatus(source.source_id, "reset-counters")} className="rounded border border-white/15 px-2 py-1 text-[10px] text-slate-200">Reset</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          {activeTab === "line_schema" ? (
            <div className="grid gap-2 md:grid-cols-2">
              {environment.lines.map((line: LiveAnswerLineState) => (
                <div key={line.key} className="rounded border border-white/10 bg-slate-950/70 p-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-100">{line.label}</p>
                    <span className="rounded border border-white/10 px-1.5 py-0.5 text-[9px] text-slate-400">{line.update_policy} / {line.visibility}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">{line.key} / changed {formatTime(line.updated_at)}</p>
                  <p className="mt-1 text-xs text-slate-200">{line.value}</p>
                </div>
              ))}
            </div>
          ) : null}
          {activeTab === "deltas" ? (
            <div className="space-y-2">
              {deltas.slice(-12).reverse().map((delta: LiveAnswerEnvironmentDelta) => (
                <div key={delta.delta_id} className="rounded border border-white/10 bg-slate-950/70 p-2">
                  <p className="text-xs text-slate-200">{delta.reason} / {formatTime(delta.ts)}</p>
                  <p className="mt-1 text-[11px] text-slate-500">changed {delta.changed_line_keys.join(", ") || "status"} / window {delta.window_id ?? "none"} / events {delta.source_event_count ?? "n/a"}</p>
                  <p className="mt-1 break-all text-[10px] text-slate-600">{delta.previous_hash ?? "no previous"} -&gt; {delta.next_hash}</p>
                </div>
              ))}
            </div>
          ) : null}
          {activeTab === "windows" ? (
            <div className="space-y-2">
              {relevantWindows.length === 0 ? <p className="text-xs text-slate-500">No source windows yet.</p> : null}
              {relevantWindows.slice(-12).reverse().map((window: LiveSourceWindowSummary) => (
                <div key={window.window_id} className="rounded border border-white/10 bg-slate-950/70 p-2">
                  <p className="text-xs text-slate-200">{window.window_id}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{window.source_id} / events {window.event_count} / policy {window.policy.emit_line_delta_on}</p>
                  <p className="mt-1 text-[11px] text-slate-600">{formatTime(window.from_ts)} -&gt; {formatTime(window.to_ts)}</p>
                </div>
              ))}
            </div>
          ) : null}
          {activeTab === "debug" ? (
            <div className="grid gap-2 lg:grid-cols-2">
              <div className="rounded border border-white/10 bg-slate-950/70 p-3">
                <p className="text-[10px] uppercase text-slate-500">Diagnostics</p>
                <p className="mt-2 text-xs text-slate-300">last load: {diagnostics?.last_loaded_at ?? "never"}</p>
                <p className="mt-1 text-xs text-slate-300">fetch error: {diagnostics?.last_fetch_error ?? lastFetchError ?? "none"}</p>
                <p className="mt-1 text-xs text-slate-300">raw logs included: false</p>
                <p className="mt-1 text-xs text-slate-300">context policy: compact_context_pack_only</p>
              </div>
              <div className="rounded border border-white/10 bg-slate-950/70 p-3">
                <p className="text-[10px] uppercase text-slate-500">Recent source events</p>
                <div className="mt-2 space-y-1">
                  {relevantEvents.slice(-8).reverse().map((event: WorkstationLiveSourceEvent) => (
                    <p key={event.event_id} className="break-words text-[11px] text-slate-400">
                      {event.tick_index ?? event.seq} / {event.source_family ?? event.kind} / {event.event_type}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
