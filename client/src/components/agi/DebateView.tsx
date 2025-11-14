import React, { useEffect, useMemo, useRef, useState } from "react";
import { roleFromTool, normalizeEvent, type DebateRole, type ToolLogEvent } from "@/lib/agi/debate";
import {
  connectDebateStream,
  getDebateStatus,
  type DebateOutcomePayload,
  type DebateSnapshot,
  type DebateStreamEvent,
  type DebateTurnPayload
} from "@/lib/agi/api";

type Line = ToolLogEvent & {
  role: DebateRole;
};

type DebateViewProps = {
  traceId?: string;
  open?: boolean;
  onClose?: () => void;
  variant?: "modal" | "panel";
};

const MAX_LINES = 400;

export default function DebateView({ traceId, open, onClose, variant }: DebateViewProps) {
  const resolvedVariant = variant ?? (typeof open === "boolean" ? "modal" : "panel");
  const isPanel = resolvedVariant === "panel";
  const isModal = !isPanel;
  const isOpen = isPanel ? true : Boolean(open);
  const handleClose = onClose ?? (() => {});
  const [lines, setLines] = useState<Line[]>([]);
  const [trace, setTrace] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const env = (import.meta as any)?.env ?? {};
  const sseUrl = env?.VITE_DEBATE_SSE_URL ?? "/api/agi/tools/logs/stream";
  const traceApiBase = env?.VITE_TRACE_API_BASE ?? "/api/agi/trace";
  const active = isOpen;

  useEffect(() => {
    if (isPanel) return;
    if (!isOpen) {
      setLines([]);
      setTrace(null);
      setError(null);
    }
  }, [isOpen, isPanel]);

  useEffect(() => {
    setLines([]);
  }, [traceId]);

  useEffect(() => {
    if (!active || typeof window === "undefined") return;
    let canceled = false;
    let es: EventSource | null = null;
    setError(null);

    if (traceId) {
      fetch(`${traceApiBase}/${traceId}`)
        .then((res) => {
          if (!res.ok) throw new Error(`Trace ${traceId} unavailable`);
          return res.json();
        })
        .then((payload) => {
          if (!canceled) setTrace(payload);
        })
        .catch((err) => {
          if (!canceled) setError(err?.message ?? "Unable to load trace.");
        });
    } else {
      setTrace(null);
    }

    try {
      es = new EventSource(sseUrl);
      es.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          const normalized = normalizeEvent(parsed, traceId);
          if (!normalized) return;
          const role = roleFromTool(normalized.tool);
          setLines((prev) => {
            const next: Line[] = [...prev, { ...normalized, role }];
            return next.length > MAX_LINES ? next.slice(next.length - MAX_LINES) : next;
          });
        } catch {
          // ignore malformed payloads
        }
      };
      es.onerror = () => {
        setError((prev) => prev ?? "Debate stream disconnected.");
      };
    } catch (err) {
      setError((err as Error)?.message ?? "Unable to open debate stream.");
    }

    return () => {
      canceled = true;
      es?.close();
    };
  }, [traceId, active, sseUrl, traceApiBase, isPanel]);

  if (!active) return null;

  const proponentLines = useMemo(() => lines.filter((line) => line.role === "proponent"), [lines]);
  const skepticLines = useMemo(() => lines.filter((line) => line.role === "skeptic"), [lines]);
  const refereeLines = useMemo(() => lines.filter((line) => line.role === "referee"), [lines]);
  const latestReferee = refereeLines[refereeLines.length - 1];

  const header = (
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
      <div className="flex items-center gap-3 truncate">
        <div className="font-semibold">Debate</div>
        {trace?.goal && <div className="text-sm opacity-70 truncate">· {trace.goal}</div>}
        {!traceId && (
          <div className="text-xs opacity-60">
            Run a task to lock to a trace, or watch global tool logs.
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs">
        {error && (
          <span className="text-rose-300 truncate max-w-[220px]" title={error}>
            {error}
          </span>
        )}
        <button
          className="underline opacity-80 hover:opacity-100 disabled:opacity-30"
          disabled={!lines.length}
          onClick={() => handleExport(lines, traceId)}
        >
          Export
        </button>
        {isModal && (
          <button className="underline opacity-80 hover:opacity-100" onClick={handleClose}>
            Close
          </button>
        )}
      </div>
    </div>
  );

  const refereeStrip = (
    <div className="px-4 py-2 text-xs border-b border-white/10 opacity-80">
      {latestReferee ? latestReferee.text : "Referee: awaiting outcome…"}
    </div>
  );

  const body = (
    <div className="flex flex-1 min-h-0">
      <DebateColumn title="Proponent" lines={proponentLines} />
      <DebateColumn title="Skeptic" lines={skepticLines} />
    </div>
  );

  const content = (
    <div className="bg-[var(--panel-bg,#0f1115)] text-[var(--panel-fg,#e6e6e6)] border border-white/15 rounded-lg shadow-lg flex flex-col h-full">
      {header}
      {refereeStrip}
      {body}
    </div>
  );

  if (isPanel) {
    return <div className="w-full h-full flex flex-col">{content}</div>;
  }

  return (
    <div
      className={`fixed inset-0 z-40 transition-opacity ${
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="absolute right-6 top-6 bottom-6 left-6">{content}</div>
    </div>
  );
}

function handleExport(lines: Line[], traceId?: string) {
  if (typeof window === "undefined" || !lines.length) return;
  const payload = lines.map((line) =>
    JSON.stringify({
      at: line.at,
      role: line.role,
      tool: line.tool,
      status: line.status,
      text: line.text,
      essenceIds: line.essenceIds
    })
  );
  const blob = new Blob([payload.join("\n")], { type: "application/x-ndjson" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${traceId ?? "debate"}.ndjson`;
  anchor.click();
  URL.revokeObjectURL(url);
}

type ColumnProps = {
  title: string;
  lines: Line[];
};

function DebateColumn({ title, lines }: ColumnProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines.length]);
  return (
    <div className="flex-1 min-w-0 border-r border-white/10 flex flex-col">
      <div className="px-3 py-2 text-xs uppercase tracking-wide opacity-70 border-b border-white/10">
        {title}
      </div>
      <div ref={scrollRef} className="flex-1 overflow-auto px-3 py-2 space-y-2">
        {lines.length === 0 && (
          <div className="text-sm opacity-60">Awaiting {title.toLowerCase()} entries…</div>
        )}
        {lines.map((line) => (
          <div key={line.id} className="text-sm">
            <div className="text-[11px] opacity-60">
              {new Date(line.at).toLocaleTimeString()} · {line.tool}
              {line.latency_ms ? ` · ${line.latency_ms}ms` : ""}
            </div>
            <div
              className={
                line.status === "error" ? "text-red-300" : line.status === "ok" ? "text-green-300" : ""
              }
            >
              {line.text}
            </div>
            {!!line.essenceIds?.length && (
              <div className="text-[11px] mt-1">
                {line.essenceIds.map((eid) => (
                  <a
                    key={eid}
                    className="underline opacity-80 hover:opacity-100 mr-2"
                    href={`/api/essence/${eid}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {eid.slice(0, 8)}…
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

type LegacyDebateViewProps = {
  debateId?: string | null;
  open: boolean;
  onClose: () => void;
};

const EMPTY_SCORE = { proponent: 0, skeptic: 0 };

export function LegacyDebateView({ debateId, open, onClose }: LegacyDebateViewProps) {
  const mounted = open && Boolean(debateId);
  const [goal, setGoal] = useState("");
  const [status, setStatus] = useState<DebateSnapshot["status"]>("pending");
  const [turns, setTurns] = useState<DebateTurnPayload[]>([]);
  const [scoreboard, setScoreboard] = useState(EMPTY_SCORE);
  const [outcome, setOutcome] = useState<DebateOutcomePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setGoal("");
    setTurns([]);
    setOutcome(null);
    setScoreboard(EMPTY_SCORE);
    setStatus("pending");
    setError(null);
  }, [debateId]);

  useEffect(() => {
    if (!mounted || !debateId) return;
    let canceled = false;
    setLoading(true);
    getDebateStatus(debateId)
      .then((snapshot) => {
        if (canceled) return;
        setGoal(snapshot.goal);
        setStatus(snapshot.status);
        setScoreboard(snapshot.scoreboard ?? EMPTY_SCORE);
        setTurns(Array.isArray(snapshot.turns) ? snapshot.turns : []);
        setOutcome(snapshot.outcome ?? null);
        setLoading(false);
      })
      .catch((err) => {
        if (canceled) return;
        const message = err instanceof Error ? err.message : String(err);
        setError(message || "Failed to load debate.");
        setLoading(false);
      });
    return () => {
      canceled = true;
    };
  }, [mounted, debateId]);

  useEffect(() => {
    if (!mounted || !debateId) {
      return;
    }
    const unsubscribe = connectDebateStream(debateId, {
      onEvent: (event) => handleStreamEvent(event),
      onError: () => {
        setError((prev) => prev ?? "Stream disconnected.");
      }
    });
    return () => {
      unsubscribe();
    };
  }, [mounted, debateId]);

  const handleStreamEvent = (event: DebateStreamEvent) => {
    if (event.scoreboard) {
      setScoreboard(event.scoreboard);
    }
    if (event.type === "turn") {
      setTurns((prev) => upsertTurn(prev, event.turn));
    } else if (event.type === "status") {
      setStatus(event.status);
    } else if (event.type === "outcome") {
      setOutcome(event.outcome);
    }
  };

  const proponentTurns = useMemo(() => turns.filter((turn) => turn.role === "proponent"), [turns]);
  const skepticTurns = useMemo(() => turns.filter((turn) => turn.role === "skeptic"), [turns]);
  const refereeTurns = useMemo(() => turns.filter((turn) => turn.role === "referee"), [turns]);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ${
        mounted ? "translate-y-0" : "translate-y-full pointer-events-none"
      }`}
    >
      <div className="bg-[var(--panel-bg,#050608)] text-[var(--panel-fg,#f4f4f4)] border-t border-white/15 shadow-2xl h-[70vh] flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex flex-col gap-1">
            <div className="text-xs uppercase tracking-wide opacity-60">Debate mode</div>
            <div className="text-lg font-semibold max-w-[60vw] truncate">{goal || "Awaiting goal"}</div>
            <div className="text-xs opacity-70">Status: {status}</div>
            {loading && <div className="text-xs text-amber-300">Booting debate pipeline…</div>}
            {error && (
              <div className="text-xs text-red-300 max-w-[60vw] truncate" title={error}>
                {error}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-emerald-300 font-semibold">P</span>
              <span>{scoreboard.proponent}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sky-300 font-semibold">S</span>
              <span>{scoreboard.skeptic}</span>
            </div>
            <button className="text-xs underline opacity-70 hover:opacity-100" onClick={onClose}>
              close
            </button>
          </div>
        </header>
        <div className="flex-1 grid grid-cols-2 gap-4 p-6 overflow-hidden">
          <TurnColumn label="Proponent" accent="text-emerald-300" turns={proponentTurns} />
          <TurnColumn label="Skeptic" accent="text-sky-300" turns={skepticTurns} />
        </div>
        <div className="border-t border-white/10 p-4 h-48 overflow-auto space-y-3 bg-black/20">
          <div className="text-xs uppercase tracking-wide opacity-70">Referee</div>
          {refereeTurns.length === 0 && (
            <div className="text-sm opacity-70">Referee updates will appear once the first round completes.</div>
          )}
          {refereeTurns.map((turn) => (
            <RefereeCard key={turn.id} turn={turn} />
          ))}
          {outcome && (
            <div className="rounded border border-white/15 p-3 space-y-1 bg-white/5">
              <div className="text-xs uppercase opacity-70">Verdict</div>
              <div className="text-sm">{outcome.verdict}</div>
              <div className="text-[11px] opacity-70">
                Confidence {(outcome.confidence * 100).toFixed(1)}%
                {outcome.winning_role && ` · Winner: ${outcome.winning_role}`}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type TurnColumnProps = {
  label: string;
  accent: string;
  turns: DebateTurnPayload[];
};

function TurnColumn({ label, accent, turns }: TurnColumnProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className={`text-sm uppercase tracking-wide mb-2 ${accent}`}>{label}</div>
      <div className="flex-1 overflow-auto space-y-3 pr-2">
        {turns.length === 0 && <div className="text-sm opacity-60">No turns yet.</div>}
        {turns.map((turn) => (
          <TurnCard key={turn.id} turn={turn} />
        ))}
      </div>
    </div>
  );
}

function TurnCard({ turn }: { turn: DebateTurnPayload }) {
  return (
    <div className="rounded border border-white/10 p-3 space-y-2 bg-white/5">
      <div className="flex items-center justify-between text-[11px] opacity-70 uppercase">
        <span>Round {turn.round}</span>
        <span>{new Date(turn.created_at).toLocaleTimeString()}</span>
      </div>
      <div className="text-sm whitespace-pre-wrap leading-relaxed">{turn.text}</div>
      {turn.citations.length > 0 && (
        <div className="text-[11px] space-x-2">
          <span className="opacity-70">Citations:</span>
          {turn.citations.map((cid) => (
            <a
              key={cid}
              className="underline hover:opacity-100 opacity-80"
              href={`/api/essence/${cid}`}
              target="_blank"
              rel="noreferrer"
            >
              {cid.slice(0, 8)}…
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function RefereeCard({ turn }: { turn: DebateTurnPayload }) {
  return (
    <div className="rounded border border-white/15 p-3 space-y-2 bg-white/5">
      <div className="flex items-center justify-between text-[11px] uppercase opacity-70">
        <span>Round {turn.round}</span>
        <span>{new Date(turn.created_at).toLocaleTimeString()}</span>
      </div>
      <div className="text-sm whitespace-pre-wrap leading-relaxed">{turn.text}</div>
      {turn.verifier_results.length > 0 && (
        <div className="flex flex-wrap gap-2 text-[11px]">
          {turn.verifier_results.map((result) => (
            <span
              key={`${turn.id}-${result.name}`}
              className={`px-2 py-0.5 rounded-full ${
                result.ok ? "bg-emerald-500/20 text-emerald-200" : "bg-rose-500/20 text-rose-200"
              }`}
              title={result.reason}
            >
              {result.ok ? "OK" : "FAIL"} · {result.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const upsertTurn = (
  existing: DebateTurnPayload[],
  incoming: DebateTurnPayload
): DebateTurnPayload[] => {
  const idx = existing.findIndex((turn) => turn.id === incoming.id);
  if (idx >= 0) {
    const copy = [...existing];
    copy[idx] = incoming;
    return copy.sort((a, b) => a.created_at.localeCompare(b.created_at));
  }
  return [...existing, incoming].sort((a, b) => a.created_at.localeCompare(b.created_at));
};
