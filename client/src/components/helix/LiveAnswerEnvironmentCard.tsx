import React, { useState } from "react";
import type {
  LiveAnswerEnvironment,
  LiveAnswerEnvironmentDelta,
  LiveAnswerLineState,
} from "@shared/helix-live-answer-environment";
import { LiveAnswerEnvironmentTrace } from "@/components/helix/LiveAnswerEnvironmentTrace";

const cleanLine = (line: LiveAnswerLineState): string => {
  const value = String(line.value ?? "").trim();
  return value.replace(new RegExp(`^${line.label}:\\s*`, "i"), "").trim();
};

export function LiveAnswerEnvironmentCard({
  environment,
  deltas = [],
  stale = false,
  onAskHelix,
  onOpenSituation,
  onDismiss,
}: {
  environment: LiveAnswerEnvironment;
  deltas?: LiveAnswerEnvironmentDelta[];
  stale?: boolean;
  onAskHelix?: (prompt: string) => void;
  onOpenSituation?: () => void;
  onDismiss?: () => void;
}) {
  const [traceOpen, setTraceOpen] = useState(false);
  const answerLines = environment.lines.filter((line) => line.visibility === "answer_card");
  return (
    <section className="mb-2 w-full rounded-lg border border-cyan-300/20 bg-cyan-950/15 px-3 py-2 text-left text-xs text-cyan-50">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-200">Live Answer Environment</p>
          <p className="mt-1 break-words text-sm font-semibold text-cyan-50">
            {environment.objective}
          </p>
        </div>
        <span className="shrink-0 rounded border border-cyan-300/35 bg-cyan-400/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-cyan-100">
          {environment.status} · {environment.mode}{stale ? " · stale" : ""}
        </span>
      </div>
      <div className="mt-2 grid gap-1.5 text-[11px] text-cyan-50/90">
        {answerLines.map((line) => (
          <p key={line.key}>
            <span className="text-cyan-200/80">{line.label}: </span>
            {cleanLine(line)}
          </p>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onAskHelix?.(`Use the live answer environment "${environment.objective}" and tell me what changed.`)}
          className="rounded border border-cyan-300/30 bg-cyan-400/10 px-2 py-1 text-[11px] text-cyan-100 hover:bg-cyan-400/20"
        >
          Ask about this
        </button>
        <button
          type="button"
          onClick={onOpenSituation}
          className="rounded border border-white/15 bg-white/5 px-2 py-1 text-[11px] text-slate-100 hover:bg-white/10"
        >
          Open Situation Room
        </button>
        <button
          type="button"
          onClick={() => setTraceOpen((value) => !value)}
          className="rounded border border-white/15 bg-white/5 px-2 py-1 text-[11px] text-slate-100 hover:bg-white/10"
        >
          {traceOpen ? "Hide trace" : "Show trace"}
        </button>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="rounded border border-white/15 bg-white/5 px-2 py-1 text-[11px] text-slate-300 hover:bg-white/10"
          >
            Dismiss card
          </button>
        ) : null}
      </div>
      {traceOpen ? (
        <div className="mt-2">
          <LiveAnswerEnvironmentTrace deltas={deltas} />
        </div>
      ) : null}
    </section>
  );
}
