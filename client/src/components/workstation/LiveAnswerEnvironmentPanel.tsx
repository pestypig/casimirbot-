import React, { useEffect } from "react";
import {
  selectActiveLiveAnswerEnvironment,
  selectLiveAnswerEnvironmentDeltas,
  useLiveAnswerEnvironmentStore,
  type LiveAnswerEnvironmentState,
} from "@/store/useLiveAnswerEnvironmentStore";

export function LiveAnswerEnvironmentPanel({ threadId = "helix-ask:desktop" }: { threadId?: string }) {
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

  useEffect(() => {
    void loadEnvironment(threadId, 30);
    const interval = window.setInterval(() => void loadEnvironment(threadId, 30), 5000);
    return () => window.clearInterval(interval);
  }, [loadEnvironment, threadId]);

  return (
    <section className="rounded-lg border border-cyan-300/20 bg-cyan-950/10 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase text-cyan-200">Live Answer Environments</p>
          <p className="mt-1 text-xs text-slate-400">
            Prompt-defined line schemas update from Situation Room sources as observations, not assistant answers.
          </p>
        </div>
        <span className="rounded border border-white/15 px-2 py-0.5 text-[10px] uppercase text-slate-400">
          {environment ? environment.status : "none"}
        </span>
      </div>
      {!environment ? (
        <p className="mt-3 text-xs text-slate-500">
          No active live answer environment for {threadId}. Start one from Helix Ask.
        </p>
      ) : (
        <div className="mt-3 grid gap-3 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded border border-white/10 bg-slate-950/70 p-3">
            <p className="text-xs font-semibold text-white">{environment.objective}</p>
            <div className="mt-3 grid gap-2">
              {environment.lines.map((line) => (
                <div key={line.key} className="rounded border border-white/10 bg-black/20 p-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[10px] uppercase text-slate-500">{line.label}</p>
                    <span className="rounded border border-white/10 px-1.5 py-0.5 text-[9px] text-slate-400">
                      {line.update_policy} / {line.visibility}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-200">{line.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded border border-white/10 bg-slate-950/70 p-3">
            <p className="text-[10px] uppercase text-slate-500">Deltas</p>
            {deltas.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">No deltas yet.</p>
            ) : (
              <div className="mt-2 space-y-2">
                {deltas.slice(-6).reverse().map((delta) => (
                  <div key={delta.delta_id} className="rounded border border-white/10 bg-black/20 p-2">
                    <p className="text-xs text-slate-200">{delta.reason}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      changed {delta.changed_line_keys.join(", ")}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 text-[10px] text-slate-500">
              last load: {diagnostics?.last_loaded_at ?? "never"} {diagnostics?.last_fetch_error ? `/ ${diagnostics.last_fetch_error}` : ""}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
