import * as React from "react";
import type { TTelemetrySnapshot } from "@shared/star-telemetry";
import { useCoherenceTelemetry, type CoherenceSessionType } from "@/hooks/useDebateTelemetry";

const DEBATE_STORAGE_KEY = "debate:last-id";
const LAB_STORAGE_KEY = "coherence:last-session-id";
const SESSION_TYPE_KEY = "coherence:last-session-type";

const buildLabSessionId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `star-lab-${crypto.randomUUID()}`;
  }
  return `star-lab-${Math.random().toString(16).slice(2, 10)}`;
};

type GovernorDecision = {
  action?: "continue" | "branch" | "collapse" | "ask_clarification" | (string & {});
  confidence?: number;
  adjustedCollapseThreshold?: number;
  maxAdditionalRounds?: number;
  toolBudgetHints?: {
    maxToolsPerRound?: number;
    branchFactor?: number;
  };
};

const formatPercent = (value?: number): string =>
  typeof value === "number" && Number.isFinite(value) ? `${(value * 100).toFixed(0)}%` : "n/a";

const Metric = ({ label, value, tone = "text-white" }: { label: string; value: string; tone?: string }) => (
  <div className="flex flex-col rounded-lg border border-white/10 bg-white/5 px-3 py-2">
    <span className="text-[11px] uppercase tracking-[0.25em] text-slate-400">{label}</span>
    <span className={`text-lg font-semibold ${tone}`}>{value}</span>
  </div>
);

const LevelBar = ({ label, value }: { label: string; value?: number }) => (
  <div className="space-y-1 rounded-lg border border-white/10 bg-white/5 p-2">
    <div className="flex items-center justify-between text-xs text-slate-300">
      <span className="uppercase tracking-[0.16em] text-slate-400">{label}</span>
      <span className="font-semibold text-white">{formatPercent(value)}</span>
    </div>
    <div className="h-2 rounded-full bg-white/10">
      <div
        className="h-2 rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-300"
        style={{ width: `${Math.min(100, Math.max(0, (value ?? 0) * 100))}%` }}
      />
    </div>
  </div>
);

const SnapshotView = ({
  snapshot,
  governor,
  fallbackConfidence,
}: {
  snapshot: TTelemetrySnapshot;
  governor: GovernorDecision | null;
  fallbackConfidence?: number;
}) => {
  const levels = snapshot.levels ?? {};
  const lastUpdated =
    typeof snapshot.updated_at === "number"
      ? new Date(snapshot.updated_at)
      : typeof snapshot.updated_at === "string"
        ? new Date(snapshot.updated_at)
        : null;
  const governorConfidence = governor?.confidence ?? fallbackConfidence;
  const collapseThreshold = governor?.adjustedCollapseThreshold;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Metric label="Global coherence" value={formatPercent(snapshot.global_coherence)} />
        <Metric label="Collapse pressure" value={formatPercent(snapshot.collapse_pressure)} />
        <Metric label="Phase dispersion" value={formatPercent(snapshot.phase_dispersion)} />
        <Metric label="Energy budget" value={formatPercent(snapshot.energy_budget)} />
      </div>

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
        <div className="space-y-2 rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="text-[11px] uppercase tracking-[0.25em] text-slate-400">Level lattice</div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <LevelBar label="Micro" value={levels.micro} />
            <LevelBar label="Meso" value={levels.meso} />
            <LevelBar label="Macro" value={levels.macro} />
            <LevelBar label="Rope" value={levels.rope} />
          </div>
        </div>

        <div className="space-y-2 rounded-lg border border-emerald-400/40 bg-emerald-400/5 p-3 text-sm text-emerald-100">
          <div className="text-[11px] uppercase tracking-[0.2em] text-emerald-300">Recommended action</div>
          <div className="mt-1 text-lg font-semibold text-white">
            {snapshot.recommended_action ?? governor?.action ?? "explore_more"}
          </div>
          {snapshot.notes && <div className="text-xs text-emerald-200/80">{snapshot.notes}</div>}
          {lastUpdated && (
            <div className="text-[11px] text-emerald-200/70">
              Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Coherence governor</div>
            <div className="text-base font-semibold text-white">
              {governor?.action ? governor.action : "Telemetry-driven budgets"}
            </div>
          </div>
          {collapseThreshold !== undefined && (
            <div className="rounded-md border border-white/15 bg-white/10 px-3 py-1 text-[11px] text-slate-200">
              Threshold {formatPercent(collapseThreshold)}
            </div>
          )}
        </div>
        <div className="mt-2 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
          <Metric
            label="Collapse confidence"
            value={formatPercent(governorConfidence ?? snapshot.collapse_pressure)}
            tone="text-cyan-100"
          />
          <Metric
            label="Max additional rounds"
            value={
              typeof governor?.maxAdditionalRounds === "number" && Number.isFinite(governor.maxAdditionalRounds)
                ? governor.maxAdditionalRounds.toString()
                : "-"
            }
          />
          <Metric
            label="Tool budget / round"
            value={
              typeof governor?.toolBudgetHints?.maxToolsPerRound === "number"
                ? `${governor.toolBudgetHints.maxToolsPerRound} tools`
                : "policy default"
            }
          />
          <Metric
            label="Branch factor"
            value={
              typeof governor?.toolBudgetHints?.branchFactor === "number"
                ? `x${governor.toolBudgetHints.branchFactor}`
                : "policy default"
            }
          />
          <Metric label="Collapse action" value={governor?.action ?? snapshot.recommended_action ?? "explore_more"} />
        </div>
        {!governor && (
          <p className="mt-2 text-[11px] text-slate-400">
            Governor tuning is populated for debate sessions. Collapse gating still lives in the Collapse Watcher panel.
          </p>
        )}
      </div>
    </div>
  );
};

export function StarCoherencePanel() {
  const [debateId, setDebateId] = React.useState<string>(() => {
    if (typeof window === "undefined") return "";
    try {
      return window.localStorage.getItem(DEBATE_STORAGE_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [labSessionId, setLabSessionId] = React.useState<string>(() => {
    if (typeof window === "undefined") return buildLabSessionId();
    try {
      return window.localStorage.getItem(LAB_STORAGE_KEY) ?? buildLabSessionId();
    } catch {
      return buildLabSessionId();
    }
  });
  const [sessionType, setSessionType] = React.useState<CoherenceSessionType>(() => {
    if (typeof window === "undefined") return "debate";
    try {
      const stored = window.localStorage.getItem(SESSION_TYPE_KEY);
      if (stored === "lab") return "lab";
      const lastDebate = window.localStorage.getItem(DEBATE_STORAGE_KEY);
      return lastDebate ? "debate" : "lab";
    } catch {
      return "debate";
    }
  });

  const activeSessionId = sessionType === "debate" ? debateId : labSessionId;
  const { data, status, error, refresh } = useCoherenceTelemetry(activeSessionId || null, sessionType, 3500);

  const governor: GovernorDecision | null = React.useMemo(() => {
    const raw = data?.governor as any;
    if (!raw || typeof raw !== "object") return null;
    return {
      action: typeof raw.action === "string" ? raw.action : undefined,
      confidence: typeof raw.confidence === "number" ? raw.confidence : undefined,
      adjustedCollapseThreshold:
        typeof raw.adjustedCollapseThreshold === "number" ? raw.adjustedCollapseThreshold : undefined,
      maxAdditionalRounds:
        typeof raw.maxAdditionalRounds === "number" ? raw.maxAdditionalRounds : undefined,
      toolBudgetHints:
        raw.toolBudgetHints && typeof raw.toolBudgetHints === "object"
          ? {
              maxToolsPerRound:
                typeof raw.toolBudgetHints.maxToolsPerRound === "number" ? raw.toolBudgetHints.maxToolsPerRound : undefined,
              branchFactor:
                typeof raw.toolBudgetHints.branchFactor === "number" ? raw.toolBudgetHints.branchFactor : undefined,
            }
          : undefined,
    };
  }, [data?.governor]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const handleBroadcast = (event: Event) => {
      const payload = (event as CustomEvent<{ debateId?: string }>).detail;
      if (!payload || typeof payload.debateId !== "string") return;
      setDebateId(payload.debateId);
      setSessionType("debate");
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === DEBATE_STORAGE_KEY) {
        setDebateId(event.newValue ?? "");
        setSessionType("debate");
      }
      if (event.key === LAB_STORAGE_KEY && event.newValue) {
        setLabSessionId(event.newValue);
      }
      if (event.key === SESSION_TYPE_KEY && event.newValue) {
        setSessionType(event.newValue as CoherenceSessionType);
      }
    };
    window.addEventListener("essence-debate-id", handleBroadcast as EventListener);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("essence-debate-id", handleBroadcast as EventListener);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(SESSION_TYPE_KEY, sessionType);
    } catch {
      // ignore
    }
  }, [sessionType]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(LAB_STORAGE_KEY, labSessionId);
    } catch {
      // ignore
    }
  }, [labSessionId]);

  const onSessionTypeChange = (value: CoherenceSessionType) => {
    setSessionType(value);
    if (value === "lab" && !labSessionId) {
      setLabSessionId(buildLabSessionId());
    }
  };

  const onSessionIdChange = (value: string) => {
    if (sessionType === "debate") {
      setDebateId(value);
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(DEBATE_STORAGE_KEY, value);
        } catch {
          // ignore storage failures
        }
      }
      return;
    }
    setLabSessionId(value || buildLabSessionId());
  };

  return (
    <div className="h-full w-full bg-slate-950 p-4 text-slate-50">
      <div className="space-y-1">
        <p className="text-[11px] uppercase tracking-[0.35em] text-sky-300">Star coherence</p>
        <h1 className="text-xl font-semibold text-white">Coherence lattice + governor</h1>
        <p className="text-xs text-slate-300/80">
          Collapse gating lives in the Collapse Watcher. This view surfaces richer star coherence data (levels and governor
          budget hints) for a debate or lab session id.
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          className="rounded-md border border-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
          onClick={() => void refresh()}
        >
          Refresh
        </button>
      </div>

      <div className="mt-3 space-y-2">
        <label className="text-xs font-medium text-slate-200" htmlFor="debate-id-input">
          Coherence session
        </label>
        <div className="flex flex-wrap gap-2">
          <select
            value={sessionType}
            onChange={(e) => onSessionTypeChange(e.target.value as CoherenceSessionType)}
            className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/60"
          >
            <option value="debate">Debate</option>
            <option value="lab">Lab / free-play</option>
          </select>
          <input
            id="debate-id-input"
            type="text"
            value={activeSessionId}
            onChange={(e) => onSessionIdChange(e.target.value)}
            placeholder={sessionType === "debate" ? "debate id..." : "lab session id..."}
            className="min-w-[220px] flex-1 rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/60"
          />
        </div>
        <p className="text-[11px] text-slate-400">
          {sessionType === "debate"
            ? "Paste a debate id (or let Essence broadcast it) to watch its star coherence stream."
            : "Use a lab/free-play id when you want telemetry without a debate context."}
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {status === "idle" && <div className="text-sm text-slate-400">Enter a session id to begin.</div>}
        {status === "loading" && <div className="text-sm text-slate-300">Syncing telemetry...</div>}
        {error && <div className="text-sm text-amber-300">Error: {error}</div>}

        {data?.telemetry ? (
          <SnapshotView snapshot={data.telemetry} governor={governor} fallbackConfidence={data.confidence} />
        ) : (
          status === "ready" && <div className="text-sm text-slate-300">No telemetry yet for this session.</div>
        )}

        {data?.action && (
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Star action trace</div>
            <div className="mt-1 text-lg font-semibold text-white">{data.action}</div>
            {data.updatedAt && (
              <div className="text-[11px] text-slate-400">
                Last governor sync:{" "}
                {new Date(data.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default StarCoherencePanel;
