import React from "react";
import type { AgentGoalSessionV1 } from "@shared/contracts/workstation-goal-context.v1";

export type LiveAnswerReasoningCircuitRow = {
  id: string;
  title: string;
  producer: string;
  status: string;
  preview: string;
  contentRef: string;
  sourceRefs: string[];
  loopRefs: string[];
  evidenceRefs: string[];
  dispatch: string[];
};

export type LiveAnswerReasoningCircuitSummary = {
  updateCount: number;
  observationOnlyCount: number;
  activeGoalCount: number;
  narratorSpeechCount: number;
  narratorBindingCount: number;
  wakeCount: number;
  terminalAuthorityRequiredCount: number;
  terminalPosture: string;
};

const compactLabel = (value: string): string =>
  value.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim() || "unknown";

export function LiveAnswerReasoningCircuit({
  rows,
  summary,
  sessions,
}: {
  rows: LiveAnswerReasoningCircuitRow[];
  summary: LiveAnswerReasoningCircuitSummary;
  sessions: AgentGoalSessionV1[];
}) {
  return (
    <div className="order-13 mt-3 rounded border border-violet-300/20 bg-violet-950/10 px-2 py-2" data-testid="live-answer-reasoning-circuit">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase text-violet-100">Reasoning circuit</p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Stage Play goal context mirrored into Live Answer as observation state.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded border border-violet-300/20 px-2 py-1 font-mono text-[10px] text-violet-100">
            {summary.updateCount} updates
          </span>
          <span className="rounded border border-emerald-300/20 px-2 py-1 font-mono text-[10px] text-emerald-100">
            {summary.activeGoalCount} goals
          </span>
          <span className="rounded border border-cyan-300/20 px-2 py-1 font-mono text-[10px] text-cyan-100">
            {summary.narratorSpeechCount} narrator speech
          </span>
          <span className="rounded border border-cyan-300/20 px-2 py-1 font-mono text-[10px] text-cyan-100" data-testid="live-answer-narrator-binding-count">
            {summary.narratorBindingCount} narrator bindings
          </span>
          <span className="rounded border border-amber-300/20 px-2 py-1 font-mono text-[10px] text-amber-100">
            {summary.wakeCount} wake
          </span>
          <span className="rounded border border-violet-300/20 px-2 py-1 font-mono text-[10px] text-violet-100" data-testid="live-answer-observation-authority-count">
            {summary.observationOnlyCount} observation-only
          </span>
          <span className="rounded border border-rose-300/20 px-2 py-1 font-mono text-[10px] text-rose-100" data-testid="live-answer-terminal-authority-count">
            {summary.terminalAuthorityRequiredCount} terminal authority
          </span>
        </div>
      </div>
      <div className="mt-2 grid gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(220px,280px)]">
        <div className="grid gap-1.5 md:grid-cols-2 xl:grid-cols-3">
          {rows.length > 0 ? rows.map((row: LiveAnswerReasoningCircuitRow) => (
            <div key={row.id} className="min-w-0 rounded border border-violet-300/15 bg-black/25 px-2 py-1.5" data-testid="live-answer-goal-context-row">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[11px] font-semibold text-violet-50">{row.title}</span>
                <span className="shrink-0 font-mono text-[10px] text-violet-200/70">{row.status}</span>
              </div>
              <p className="mt-0.5 truncate font-mono text-[10px] text-slate-500">{row.producer} / {row.contentRef}</p>
              <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-300">{row.preview}</p>
              <div className="mt-1.5 grid gap-1 font-mono text-[10px] text-slate-400" data-testid="live-answer-goal-context-refs">
                <span className="truncate">sources={row.sourceRefs.length ? row.sourceRefs.join(", ") : "none"}</span>
                <span className="truncate">loops={row.loopRefs.length ? row.loopRefs.join(", ") : "none"}</span>
                <span className="truncate">evidence={row.evidenceRefs.length ? row.evidenceRefs.join(", ") : "none"}</span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1" data-testid="live-answer-goal-context-authority-chips">
                <span className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">assistant=false</span>
                <span className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">terminal=false</span>
                <span className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">raw=false</span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {row.dispatch.length > 0 ? row.dispatch.map((dispatch: string) => (
                  <span key={`${row.id}:${dispatch}`} className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-slate-300" data-testid="live-answer-goal-context-dispatch">
                    {dispatch}
                  </span>
                )) : (
                  <span className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                    no dispatch
                  </span>
                )}
              </div>
            </div>
          )) : (
            <p className="rounded border border-white/10 bg-black/20 px-2 py-2 text-[11px] text-slate-500">
              No goal-context updates have been mirrored yet.
            </p>
          )}
        </div>
        <div className="rounded border border-white/10 bg-black/20 p-2">
          <p className="text-[10px] font-semibold uppercase text-slate-300">Authority posture</p>
          <p className="mt-1 text-xs text-violet-100" data-testid="live-answer-terminal-authority-posture">{summary.terminalPosture}</p>
          <p className="mt-1 font-mono text-[10px] text-slate-400">
            observation_only={summary.observationOnlyCount} narrator_bindings={summary.narratorBindingCount} terminal_authority_sessions={summary.terminalAuthorityRequiredCount}
          </p>
          <p className="mt-1 text-[11px] leading-5 text-slate-500">
            Receipts, MicroDeck outputs, narrator bindings, and panel projections stay evidence until the completed solver path selects a terminal answer.
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {sessions.slice(0, 3).map((session: AgentGoalSessionV1) => (
              <span key={session.goalId} className="rounded border border-violet-300/15 px-1.5 py-0.5 font-mono text-[10px] text-violet-100" data-testid="live-answer-agent-goal-session">
                {compactLabel(session.status)} / {session.contextFeeds.length} feeds
              </span>
            ))}
            {sessions.length === 0 ? (
              <span className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                no active session
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
