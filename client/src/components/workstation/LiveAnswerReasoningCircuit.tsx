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
  receiptRefs: string[];
  policyRefs: string[];
  dispatch: string[];
  packetColorKey: string;
  freshness: {
    observedAtMs: number;
    staleAfterMs?: number;
    status: string;
  };
  authority: {
    assistantAnswer: boolean;
    terminalEligible: boolean;
    rawContentIncluded: boolean;
    postToolModelStepRequired: boolean;
  };
};

export type LiveAnswerReasoningCircuitSummary = {
  updateCount: number;
  observationOnlyCount: number;
  activeGoalCount: number;
  narratorSpeechCount: number;
  narratorBindingCount: number;
  wakeCount: number;
  microdeckOutputCount: number;
  audioTranscriptCount: number;
  translatedTranscriptCount: number;
  packetTraceCount: number;
  sourceHealthCount: number;
  feedQueryCount: number;
  routeWatchCount: number;
  automationCount: number;
  feedPolicyRefCount: number;
  actuatorPolicyCount: number;
  narratorEventFeedCount: number;
  narratorActuatorPolicyCount: number;
  traceMemoryCount: number;
  terminalAuthorityRequiredCount: number;
  terminalPosture: string;
};

const compactLabel = (value: string): string =>
  value.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim() || "unknown";

const authorityChipClass = (flag: boolean): string =>
  flag
    ? "rounded border border-rose-300/30 bg-rose-950/20 px-1.5 py-0.5 font-mono text-[10px] text-rose-100"
    : "rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-slate-400";

const postToolChipClass = (required: boolean): string =>
  required
    ? "rounded border border-emerald-300/25 bg-emerald-950/15 px-1.5 py-0.5 font-mono text-[10px] text-emerald-100"
    : "rounded border border-rose-300/30 bg-rose-950/20 px-1.5 py-0.5 font-mono text-[10px] text-rose-100";

const packetTrailColor = (value: string): { hsl: string; border: string; background: string; glow: string } => {
  let hash = 0;
  for (const char of value || "packet") {
    hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  }
  const hue = Math.abs(hash) % 360;
  return {
    hsl: `hsl(${hue} 84% 62%)`,
    border: `hsl(${hue} 78% 52%)`,
    background: `hsl(${hue} 72% 24% / 0.28)`,
    glow: `0 0 0 1px hsl(${hue} 78% 52% / 0.45), 0 0 18px hsl(${hue} 84% 62% / 0.22)`,
  };
};

const cadenceLabel = (cadence: AgentGoalSessionV1["cadence"]): string => {
  if (cadence.kind === "manual") return "manual";
  if (cadence.kind === "user_turn_only") return "user turn";
  if (cadence.kind === "interval") return `interval ${cadence.everyMs}ms`;
  return `after ${cadence.minUpdates} updates`;
};

const freshnessLabel = (freshness: LiveAnswerReasoningCircuitRow["freshness"]): string => {
  const staleAfter = freshness.staleAfterMs === undefined ? "unbounded" : `${freshness.staleAfterMs}ms`;
  return `${freshness.status} observed=${freshness.observedAtMs} staleAfter=${staleAfter}`;
};

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
          <span className="rounded border border-amber-300/20 px-2 py-1 font-mono text-[10px] text-amber-100" data-testid="live-answer-wake-dispatch-count">
            {summary.wakeCount} wake dispatch{summary.wakeCount === 1 ? "" : "es"}
          </span>
          <span className="rounded border border-fuchsia-300/20 px-2 py-1 font-mono text-[10px] text-fuchsia-100" data-testid="live-answer-microdeck-output-count">
            {summary.microdeckOutputCount} MicroDeck output{summary.microdeckOutputCount === 1 ? "" : "s"}
          </span>
          <span className="rounded border border-blue-300/20 px-2 py-1 font-mono text-[10px] text-blue-100" data-testid="live-answer-audio-transcript-count">
            {summary.audioTranscriptCount} audio transcripts
          </span>
          <span className="rounded border border-teal-300/20 px-2 py-1 font-mono text-[10px] text-teal-100" data-testid="live-answer-translated-transcript-count">
            {summary.translatedTranscriptCount} translations
          </span>
          <span className="rounded border border-teal-300/20 px-2 py-1 font-mono text-[10px] text-teal-100" data-testid="live-answer-packet-trace-count">
            {summary.packetTraceCount} packet traces
          </span>
          <span className="rounded border border-lime-300/20 px-2 py-1 font-mono text-[10px] text-lime-100" data-testid="live-answer-source-health-count">
            {summary.sourceHealthCount} source health
          </span>
          <span className="rounded border border-indigo-300/20 px-2 py-1 font-mono text-[10px] text-indigo-100" data-testid="live-answer-feed-query-count">
            {summary.feedQueryCount} feed queries
          </span>
          <span className="rounded border border-indigo-300/20 px-2 py-1 font-mono text-[10px] text-indigo-100" data-testid="live-answer-feed-policy-ref-count">
            {summary.feedPolicyRefCount} feed policy refs
          </span>
          <span className="rounded border border-sky-300/20 px-2 py-1 font-mono text-[10px] text-sky-100" data-testid="live-answer-route-watch-count">
            {summary.routeWatchCount} route watch
          </span>
          <span className="rounded border border-orange-300/20 px-2 py-1 font-mono text-[10px] text-orange-100" data-testid="live-answer-automation-count">
            {summary.automationCount} automations
          </span>
          <span className="rounded border border-emerald-300/20 px-2 py-1 font-mono text-[10px] text-emerald-100" data-testid="live-answer-actuator-policy-count">
            {summary.actuatorPolicyCount} actuator polic{summary.actuatorPolicyCount === 1 ? "y" : "ies"}
          </span>
          <span className="rounded border border-cyan-300/20 px-2 py-1 font-mono text-[10px] text-cyan-100" data-testid="live-answer-narrator-actuator-policy-count">
            {summary.narratorActuatorPolicyCount} narrator output polic{summary.narratorActuatorPolicyCount === 1 ? "y" : "ies"}
          </span>
          <span className="rounded border border-cyan-300/20 px-2 py-1 font-mono text-[10px] text-cyan-100" data-testid="live-answer-narrator-event-feed-count">
            {summary.narratorEventFeedCount} narrator event feeds
          </span>
          <span className="rounded border border-fuchsia-300/20 px-2 py-1 font-mono text-[10px] text-fuchsia-100" data-testid="live-answer-trace-memory-count">
            {summary.traceMemoryCount} trace memory
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
          {rows.length > 0 ? rows.map((row: LiveAnswerReasoningCircuitRow) => {
            const color = packetTrailColor(row.packetColorKey);
            return (
              <div
                key={row.id}
                className="min-w-0 rounded border bg-black/25 px-2 py-1.5"
                data-testid="live-answer-goal-context-row"
                style={{ borderColor: color.border, boxShadow: color.glow }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[11px] font-semibold text-violet-50">{row.title}</span>
                  <span className="shrink-0 font-mono text-[10px] text-violet-200/70">{row.status}</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 font-mono text-[10px] text-slate-500" data-testid="live-answer-packet-color-key">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full border"
                    aria-hidden="true"
                    style={{ backgroundColor: color.hsl, borderColor: color.border }}
                  />
                  <span className="truncate">packet-color={row.packetColorKey}</span>
                </div>
                <p className="mt-0.5 truncate font-mono text-[10px] text-slate-500">{row.producer} / {row.contentRef}</p>
                <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-300">{row.preview}</p>
                <div className="mt-1.5 grid gap-1 font-mono text-[10px] text-slate-400" data-testid="live-answer-goal-context-refs">
                  <span className="truncate">sources={row.sourceRefs.length ? row.sourceRefs.join(", ") : "none"}</span>
                  <span className="truncate">loops={row.loopRefs.length ? row.loopRefs.join(", ") : "none"}</span>
                  <span className="truncate">evidence={row.evidenceRefs.length ? row.evidenceRefs.join(", ") : "none"}</span>
                  <span className="truncate" data-testid="live-answer-goal-context-policy-refs">policy={row.policyRefs.length ? row.policyRefs.join(", ") : "none"}</span>
                  <span className="truncate">receipts={row.receiptRefs.length ? row.receiptRefs.join(", ") : "none"}</span>
                  <span className="truncate" data-testid="live-answer-goal-context-freshness">freshness={freshnessLabel(row.freshness)}</span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1" data-testid="live-answer-goal-context-authority-chips">
                  <span className={authorityChipClass(row.authority.assistantAnswer)}>assistant={String(row.authority.assistantAnswer)}</span>
                  <span className={authorityChipClass(row.authority.terminalEligible)}>terminal={String(row.authority.terminalEligible)}</span>
                  <span className={authorityChipClass(row.authority.rawContentIncluded)}>raw={String(row.authority.rawContentIncluded)}</span>
                  <span className={postToolChipClass(row.authority.postToolModelStepRequired)}>postToolStep={String(row.authority.postToolModelStepRequired)}</span>
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
            );
          }) : (
            <p className="rounded border border-white/10 bg-black/20 px-2 py-2 text-[11px] text-slate-500">
              No goal-context updates have been mirrored yet.
            </p>
          )}
        </div>
        <div className="rounded border border-white/10 bg-black/20 p-2">
          <p className="text-[10px] font-semibold uppercase text-slate-300">Authority posture</p>
          <p className="mt-1 text-xs text-violet-100" data-testid="live-answer-terminal-authority-posture">{summary.terminalPosture}</p>
          <p className="mt-1 font-mono text-[10px] text-slate-400">
            observation_only={summary.observationOnlyCount} wake_dispatches={summary.wakeCount} microdeck_outputs={summary.microdeckOutputCount} narrator_bindings={summary.narratorBindingCount} audio_transcripts={summary.audioTranscriptCount} translations={summary.translatedTranscriptCount} packet_traces={summary.packetTraceCount} source_health={summary.sourceHealthCount} feed_queries={summary.feedQueryCount} feed_policy_refs={summary.feedPolicyRefCount} route_watch={summary.routeWatchCount} automations={summary.automationCount} actuator_policies={summary.actuatorPolicyCount} narrator_output_policies={summary.narratorActuatorPolicyCount} narrator_event_feeds={summary.narratorEventFeedCount} trace_memory={summary.traceMemoryCount} terminal_authority_sessions={summary.terminalAuthorityRequiredCount}
          </p>
          <p className="mt-1 text-[11px] leading-5 text-slate-500">
            Wake is only an interrupt dispatch. Receipts, MicroDeck outputs, narrator bindings, and panel projections stay evidence until the completed solver path selects a terminal answer.
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
          <div className="mt-2 grid gap-2">
            {sessions.slice(0, 2).map((session: AgentGoalSessionV1) => {
              const latestCheckpoint = session.checkpoints.at(-1);
              const finalReportRequirementCount = session.authority.finalReportRequirements?.requiredEvidenceKinds?.length ?? 0;
              return (
                <div key={`${session.goalId}:policy`} className="rounded border border-violet-300/15 bg-violet-950/10 p-2" data-testid="live-answer-agent-goal-policy">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-semibold text-violet-50">{session.userVisibleSummary}</p>
                      <p className="mt-0.5 truncate font-mono text-[10px] text-slate-500">{session.goalId}</p>
                    </div>
                    <span className="shrink-0 rounded border border-rose-300/20 px-1.5 py-0.5 font-mono text-[10px] text-rose-100" data-testid="live-answer-agent-goal-final-authority">
                      finalAuthority={String(session.authority.finalReportsRequireTerminalAuthority)} / requirements={finalReportRequirementCount}
                    </span>
                  </div>
                  <div className="mt-1 grid gap-1 font-mono text-[10px] text-slate-400">
                    <span data-testid="live-answer-agent-goal-cadence">cadence={cadenceLabel(session.cadence)}</span>
                    <span className="truncate" data-testid="live-answer-agent-goal-feeds">
                      feeds={session.contextFeeds.map((feed) => compactLabel(feed.sourceKind)).join(", ") || "none"}
                    </span>
                    <span className="truncate" data-testid="live-answer-agent-goal-actuators">
                      actuators={session.allowedActuators.slice(0, 6).map(compactLabel).join(", ") || "none"}
                    </span>
                    <span className="truncate" data-testid="live-answer-agent-goal-stop">
                      stop={session.stopConditions[0] ?? "none"}
                    </span>
                    <span className="truncate" data-testid="live-answer-agent-goal-checkpoint">
                      checkpoint={latestCheckpoint?.summary ?? "none"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
