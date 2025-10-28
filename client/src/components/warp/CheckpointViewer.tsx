"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Check, onCheck, Side, Stage } from "@/lib/checkpoints";

interface CheckpointViewerProps {
  title?: string;
  sides?: Side[];
  stages?: Stage[];
  maxHistory?: number;
}

const DEFAULT_SIDES: Side[] = ["REAL", "SHOW"];
const DEFAULT_STAGES: Stage[] = ["input", "expect", "uniforms", "gpu", "frame"];

export default function CheckpointViewer({
  title = "DAG Checkpoints",
  sides = DEFAULT_SIDES,
  stages = DEFAULT_STAGES,
  maxHistory = 100,
}: CheckpointViewerProps) {
  const [checks, setChecks] = useState<Check[]>([]);

  // quick lookups for filtering
  const sideSet = useMemo(() => new Set<Side>(sides), [sides]);
  const stageSet = useMemo(() => new Set<Stage>(stages), [stages]);

  useEffect(() => {
    const handler = (check: Check) => {
      // filter by props
      if (!sideSet.has(check.side) || !stageSet.has(check.stage)) return;

      setChecks((prev) => {
        // prepend newest, clamp length
        const next = [check, ...prev];
        if (next.length > maxHistory) next.length = maxHistory;
        return next;
      });
    };

    const off = onCheck(handler);
    return () => off();
  }, [maxHistory, sideSet, stageSet]);

  // Group by stage+side (latest first already)
  const grouped = useMemo(() => {
    const acc: Record<string, Check[]> = {};
    for (const c of checks) {
      const key = `${c.stage}.${c.side}`;
      (acc[key] ??= []).push(c);
    }
    return acc;
  }, [checks]);

  const passColor = (pass: boolean) => (pass ? "text-green-400" : "text-red-400");
  const sevColor = (sev?: "info" | "warn" | "error") =>
    sev === "error" ? "text-red-400" : sev === "warn" ? "text-yellow-400" : "text-green-400";

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
      <h4 className="text-sm font-semibold text-white/90 mb-3">{title}</h4>

      <div className="grid grid-cols-2 gap-4">
        {sides.map((side) => (
          <div key={side} className="space-y-3">
            <h5 className="text-xs font-medium text-white/80 uppercase tracking-wide">{side}</h5>

            {stages.map((stage) => {
              const stageChecks = grouped[`${stage}.${side}`] || [];
              const latest = stageChecks[0];

              return (
                <div key={stage} className="border border-white/5 rounded-lg p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-white/70 uppercase">{stage}</span>
                    {latest ? (
                      <span className={`text-xs ${passColor(latest.pass)}`}>{latest.pass ? "✓" : "✗"}</span>
                    ) : (
                      <span className="text-xs text-white/30">—</span>
                    )}
                  </div>

                  {latest ? (
                    <div className="space-y-1">
                      <div className={`text-xs ${sevColor(latest.sev)} truncate`} title={latest.msg}>
                        {latest.msg}
                      </div>
                      {latest.expect !== undefined && (
                        <div className="text-xs text-white/60">
                          expect:{" "}
                          {typeof latest.expect === "object"
                            ? JSON.stringify(latest.expect)
                            : String(latest.expect)}
                        </div>
                      )}
                      {latest.actual !== undefined && (
                        <div className="text-xs text-white/60">
                          actual:{" "}
                          {typeof latest.actual === "object"
                            ? JSON.stringify(latest.actual)
                            : String(latest.actual)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-white/40">No data</div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <h6 className="text-xs font-medium text-white/70 mb-2">Recent Activity</h6>
        <div className="space-y-1 max-h-32 overflow-y-auto" aria-live="polite">
          {checks.slice(0, 10).map((check, i) => (
            <div key={`${check.id}-${check.at}-${i}`} className="flex items-center gap-2 text-xs">
              <span className={passColor(check.pass)}>{check.pass ? "✓" : "✗"}</span>
              <span className="text-white/50">{check.side}</span>
              <span className="text-white/50">{check.stage}</span>
              <span className="text-white/70 flex-1 truncate" title={check.msg}>
                {check.msg}
              </span>
              <span className="text-white/40">
                {Number.isFinite(check.at) ? new Date(check.at).toLocaleTimeString() : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
