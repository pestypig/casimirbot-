import * as React from "react";
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

const Gauge = ({ label, value, hue }: { label: string; value: number; hue: string }) => (
  <div className="flex flex-col gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
    <div className="text-[11px] uppercase tracking-[0.25em] text-slate-400">{label}</div>
    <div className={`text-xl font-semibold ${hue}`}>{(value * 100).toFixed(0)}%</div>
    <div className="h-1.5 w-full rounded-full bg-white/10">
      <div
        className="h-1.5 rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-400"
        style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
      />
    </div>
  </div>
);

export function CollapseWatcherPanel() {
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
  const { data, status, error, refresh } = useCoherenceTelemetry(activeSessionId || null, sessionType, 3000);

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

  const action = data?.action ?? data?.telemetry?.recommended_action ?? "\u2014";
  const pressure = data?.telemetry?.collapse_pressure ?? 0;
  const coherence = data?.telemetry?.global_coherence ?? 0;
  const confidence = data?.confidence ?? 0;

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
    <div className="h-full w-full bg-slate-950 text-slate-50 p-4 space-y-3 overflow-y-auto">
      <header className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-amber-300">Collapse watcher</p>
          <h1 className="text-xl font-semibold text-white">Chat collapse monitor</h1>
          <p className="text-xs text-slate-300/80">
            Tracks collapse pressure and coherence for a session. Ideal for gating chat answers.
          </p>
        </div>
        <button
          className="rounded-md border border-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
          onClick={() => void refresh()}
        >
          Refresh
        </button>
      </header>

      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-200" htmlFor="collapse-debate-id">
          Coherence session
        </label>
        <div className="flex flex-wrap gap-2">
          <select
            value={sessionType}
            onChange={(e) => onSessionTypeChange(e.target.value as CoherenceSessionType)}
            className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/60"
          >
            <option value="debate">Debate</option>
            <option value="lab">Lab / free-play</option>
          </select>
          <input
            id="collapse-debate-id"
            type="text"
            value={activeSessionId}
            onChange={(e) => onSessionIdChange(e.target.value)}
            placeholder={sessionType === "debate" ? "debate-id..." : "lab session id..."}
            className="flex-1 min-w-[220px] rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/60"
          />
        </div>
        <p className="text-[11px] text-slate-400">
          {sessionType === "debate"
            ? "Paste the debate id from the console; updates every ~3s."
            : "Use a lab/free-play id to watch coherence without a debate."}
        </p>
      </div>

      {status === "idle" && <div className="text-sm text-slate-400">Enter a session id to begin.</div>}
      {status === "loading" && <div className="text-sm text-slate-300">Syncing telemetry...</div>}
      {error && <div className="text-sm text-amber-300">Error: {error}</div>}

      {data?.telemetry ? (
        <div className="space-y-3">
          <Gauge label="Collapse pressure" value={pressure} hue="text-amber-200" />
          <Gauge label="Coherence" value={coherence} hue="text-emerald-200" />
          <Gauge label="Collapse confidence" value={confidence} hue="text-cyan-200" />
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Action</div>
            <div className="mt-1 text-lg font-semibold text-white">{action}</div>
            {data.telemetry?.notes && (
              <div className="text-xs text-slate-300/80 mt-1">{data.telemetry.notes}</div>
            )}
          </div>
          <details className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200">
            <summary className="cursor-pointer select-none font-semibold text-white">Metric recipe & gating</summary>
            <div className="mt-2 space-y-1">
              <p>How the star service builds the numbers before the governor decides what to do:</p>
              <ul className="list-disc space-y-1 pl-4 text-slate-300">
                <li>
                  <span className="font-semibold text-white">Coherence</span> = 15s decay of the last value +{" "}
                  <code>log1p(bytes)/12</code> * complexity * alignment bias (aligned input counts full, misaligned counts half).
                </li>
                <li>
                  <span className="font-semibold text-white">Dispersion</span> = 12s decay of the last dispersion +{" "}
                  (alignment &lt; 0 ? +0.05 : -0.02), then clamped 0-1.
                </li>
                <li>
                  <span className="font-semibold text-white">Energy budget</span> = 20s decay + <code>log1p(bytes)/10</code>, clamped 0-1.
                </li>
                <li>
                  <span className="font-semibold text-white">Collapse pressure</span> = 0.4 * coherence + 0.4 * energy + 0.2 *
                  (complexity + small align bonus), clamped 0-1.
                </li>
                <li>
                  <span className="font-semibold text-white">Action</span> = from recommended_action if present, otherwise:
                  pressure ≥ 0.72 → collapse; coherence &lt; 0.35 and dispersion &gt; 0.55 → ask_clarification; energy &gt; 0.85 → branch;
                  else explore_more.
                </li>
                <li>
                  <span className="font-semibold text-white">Collapse confidence</span> = 0.6 * pressure + 0.3 * coherence + 0.1 * (1 - dispersion),
                  clamped 0-1. Fast-stop uses this against the collapse threshold.
                </li>
              </ul>
            </div>
          </details>
        </div>
      ) : (
        status === "ready" && <div className="text-sm text-slate-300">No telemetry yet for this session.</div>
      )}
    </div>
  );
}

export default CollapseWatcherPanel;
