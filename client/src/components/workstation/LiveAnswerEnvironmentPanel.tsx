import React, { useEffect, useMemo, useState } from "react";
import {
  selectActiveLiveAnswerEnvironment,
  selectLiveAnswerEnvironmentDeltas,
  useLiveAnswerEnvironmentStore,
  type LiveAnswerEnvironmentState,
} from "@/store/useLiveAnswerEnvironmentStore";
import type { WorkstationLiveSource, WorkstationLiveSourceEvent, LiveSourceWindowSummary } from "@shared/helix-workstation-live-source";
import type { LiveAnswerEnvironmentDelta, LiveAnswerLineState } from "@shared/helix-live-answer-environment";
import type {
  LiveCommentaryCadence,
  LiveCommentaryCandidate,
  LiveCommentaryDeliveryReceipt,
  LiveCommentaryProposal,
  LiveCommentarySession,
  LiveCommentaryTraceStep,
} from "@shared/helix-live-commentary";
import type { HelixInterpretedEvent } from "@shared/helix-interpreted-event-log";
import type { HelixPresentStateCard } from "@shared/helix-present-state-card";
import type {
  HelixClarificationNeed,
  HelixClarificationQuestionProposal,
} from "@shared/helix-clarification-dialogue";
import type { HelixUserSteeringEvidence } from "@shared/helix-user-steering-evidence";
import type { HelixLiveLineToolEvaluation } from "@shared/helix-live-line-tool-evaluation";
import type { HelixLiveLineToolRequest } from "@shared/helix-live-line-tool-request";

type LiveEnvironmentTab = "present_state" | "line_checks" | "interpreted_log" | "clarification" | "overview" | "sources" | "line_schema" | "deltas" | "windows" | "commentary" | "reviews" | "debug";
type LiveAgenticReviewReadEntry = {
  review_id: string;
  question?: string;
  trigger?: string;
  decision?: string;
  summary?: string;
  model_invoked?: boolean;
};

const tabs: Array<{ id: LiveEnvironmentTab; label: string }> = [
  { id: "present_state", label: "Present State" },
  { id: "line_checks", label: "Line Checks" },
  { id: "interpreted_log", label: "Interpreted Log" },
  { id: "clarification", label: "Clarification Queue" },
  { id: "overview", label: "Overview" },
  { id: "sources", label: "Sources" },
  { id: "line_schema", label: "Line Schema" },
  { id: "deltas", label: "Deltas" },
  { id: "windows", label: "Windows" },
  { id: "commentary", label: "Commentary" },
  { id: "reviews", label: "Reviews" },
  { id: "debug", label: "Debug" },
];

const commentaryCadences: LiveCommentaryCadence[] = [
  "off",
  "milestones_only",
  "anomalies_and_milestones",
  "windowed_companion",
  "active_dialogue",
  "continuous_debug",
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
  const [activeTab, setActiveTab] = useState<LiveEnvironmentTab>("present_state");
  const [sources, setSources] = useState<WorkstationLiveSource[]>([]);
  const [events, setEvents] = useState<WorkstationLiveSourceEvent[]>([]);
  const [windows, setWindows] = useState<LiveSourceWindowSummary[]>([]);
  const [commentarySession, setCommentarySession] = useState<LiveCommentarySession | null>(null);
  const [commentaryCandidates, setCommentaryCandidates] = useState<LiveCommentaryCandidate[]>([]);
  const [commentaryProposals, setCommentaryProposals] = useState<LiveCommentaryProposal[]>([]);
  const [commentaryDeliveries, setCommentaryDeliveries] = useState<LiveCommentaryDeliveryReceipt[]>([]);
  const [reviewRequests, setReviewRequests] = useState<LiveAgenticReviewReadEntry[]>([]);
  const [reviewResults, setReviewResults] = useState<LiveAgenticReviewReadEntry[]>([]);
  const [presentStateCard, setPresentStateCard] = useState<HelixPresentStateCard | null>(null);
  const [interpretedEvents, setInterpretedEvents] = useState<HelixInterpretedEvent[]>([]);
  const [clarificationNeeds, setClarificationNeeds] = useState<HelixClarificationNeed[]>([]);
  const [clarificationProposals, setClarificationProposals] = useState<HelixClarificationQuestionProposal[]>([]);
  const [steeringEvidence, setSteeringEvidence] = useState<HelixUserSteeringEvidence[]>([]);
  const [lineToolRequests, setLineToolRequests] = useState<HelixLiveLineToolRequest[]>([]);
  const [lineToolEvaluations, setLineToolEvaluations] = useState<HelixLiveLineToolEvaluation[]>([]);
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
      const loadedEnvironment = selectActiveLiveAnswerEnvironment(useLiveAnswerEnvironmentStore.getState(), threadId);
      const activeEnvironmentId = loadedEnvironment?.environment_id ?? environment?.environment_id ?? null;
      const commentaryPath = activeEnvironmentId
        ? `/api/agi/situation/live-commentary?thread_id=${encodeURIComponent(threadId)}&environment_id=${encodeURIComponent(activeEnvironmentId)}`
        : `/api/agi/situation/live-commentary?thread_id=${encodeURIComponent(threadId)}`;
      const reviewPath = activeEnvironmentId
        ? `/api/agi/situation/live-agentic-review?thread_id=${encodeURIComponent(threadId)}&environment_id=${encodeURIComponent(activeEnvironmentId)}`
        : `/api/agi/situation/live-agentic-review?thread_id=${encodeURIComponent(threadId)}`;
      const roomQuery = loadedEnvironment?.room_id ? `&room_id=${encodeURIComponent(loadedEnvironment.room_id)}` : "";
      const [sourceRes, eventRes, windowRes, commentaryRes, reviewRes, presentStateRes, interpretedLogRes, clarificationRes, lineToolRes] = await Promise.all([
        fetch("/api/agi/situation/live-source/list"),
        fetch("/api/agi/situation/live-source/events"),
        fetch("/api/agi/situation/live-source/windows"),
        fetch(commentaryPath),
        fetch(reviewPath),
        fetch(`/api/agi/situation/present-state-card?thread_id=${encodeURIComponent(threadId)}${roomQuery}`),
        fetch(`/api/agi/situation/interpreted-log?thread_id=${encodeURIComponent(threadId)}${roomQuery}&limit=80`),
        fetch(`/api/agi/situation/clarification-dialogue?thread_id=${encodeURIComponent(threadId)}${roomQuery}`),
        fetch(`/api/agi/situation/live-line-tool-requests?thread_id=${encodeURIComponent(threadId)}&limit=80`),
      ]);
      const [sourceBody, eventBody, windowBody, commentaryBody, reviewBody, presentStateBody, interpretedLogBody, clarificationBody, lineToolBody] = await Promise.all([
        sourceRes.json(),
        eventRes.json(),
        windowRes.json(),
        commentaryRes.json(),
        reviewRes.json(),
        presentStateRes.json(),
        interpretedLogRes.json(),
        clarificationRes.json(),
        lineToolRes.json(),
      ]);
      setSources(Array.isArray(sourceBody.sources) ? sourceBody.sources : []);
      setEvents(Array.isArray(eventBody.events) ? eventBody.events : []);
      setWindows(Array.isArray(windowBody.windows) ? windowBody.windows : []);
      setCommentarySession(commentaryBody.session ?? null);
      setCommentaryCandidates(Array.isArray(commentaryBody.candidates) ? commentaryBody.candidates : []);
      setCommentaryProposals(Array.isArray(commentaryBody.proposals) ? commentaryBody.proposals : []);
      setCommentaryDeliveries(Array.isArray(commentaryBody.deliveries) ? commentaryBody.deliveries : []);
      setReviewRequests(Array.isArray(reviewBody.requests) ? reviewBody.requests : []);
      setReviewResults(Array.isArray(reviewBody.results) ? reviewBody.results : []);
      setPresentStateCard(presentStateBody.card ?? null);
      setInterpretedEvents(Array.isArray(interpretedLogBody.events) ? interpretedLogBody.events : []);
      setClarificationNeeds(Array.isArray(clarificationBody.needs) ? clarificationBody.needs : []);
      setClarificationProposals(Array.isArray(clarificationBody.proposals) ? clarificationBody.proposals : []);
      setSteeringEvidence(Array.isArray(clarificationBody.steering_evidence) ? clarificationBody.steering_evidence : []);
      setLineToolRequests(Array.isArray(lineToolBody.requests) ? lineToolBody.requests : []);
      setLineToolEvaluations(Array.isArray(lineToolBody.evaluations) ? lineToolBody.evaluations : []);
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

  const setCommentaryCadence = async (cadence: LiveCommentaryCadence) => {
    if (!environment) return;
    await postJson("/api/agi/situation/live-commentary/session", {
      environment_id: environment.environment_id,
      cadence,
      status: cadence === "off" ? "paused" : "active",
    });
    await refresh();
  };

  const requestAgenticReview = async () => {
    if (!environment) return;
    await postJson("/api/agi/situation/live-agentic-review/request", {
      thread_id: threadId,
      environment_id: environment.environment_id,
      question: "Review the latest compact live environment state.",
      trigger: "manual_button",
    });
    await refresh();
  };

  const runLineCheck = async (request: HelixLiveLineToolRequest) => {
    await postJson("/api/agi/situation/live-line-tool-request/run", {
      thread_id: request.thread_id,
      request_id: request.request_id,
      room_id: environment?.room_id ?? undefined,
      source_id: environment?.source_ids?.[0] ?? undefined,
    });
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
      {!environment && activeTab !== "present_state" && activeTab !== "interpreted_log" ? (
        <p className="mt-3 text-xs text-slate-500">No active live answer environment for {threadId}. Start one from Helix Ask.</p>
      ) : (
        <div className="mt-3">
          {activeTab === "present_state" ? (
            <div className="space-y-3">
              {!presentStateCard ? (
                <p className="text-xs text-slate-500">No present-state card is available yet.</p>
              ) : (
                <div className="rounded border border-emerald-300/20 bg-emerald-950/15 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.14em] text-emerald-200">{presentStateCard.status}</p>
                      <p className="mt-1 text-sm font-semibold text-emerald-50">{presentStateCard.title}</p>
                    </div>
                    <span className="rounded border border-emerald-300/30 px-2 py-0.5 text-[10px] text-emerald-100">
                      {formatTime(presentStateCard.updated_at)}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {presentStateCard.lines.map((entry: HelixPresentStateCard["lines"][number]) => (
                      <div key={entry.key} className="rounded border border-white/10 bg-black/20 p-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-[10px] uppercase text-emerald-200/80">{entry.label}</p>
                          {typeof entry.confidence === "number" ? (
                            <span className="text-[10px] text-slate-500">{Math.round(entry.confidence * 100)}%</span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-slate-100">{entry.value}</p>
                        <p className="mt-1 truncate text-[10px] text-slate-500">
                          evidence {entry.evidence_refs.slice(0, 2).join(", ") || "none"}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] text-slate-500">
                    <span>log target {presentStateCard.go_to_log_target ?? "none"}</span>
                    <span>raw logs included false</span>
                    <span>projection only</span>
                  </div>
                </div>
              )}
            </div>
          ) : null}
          {activeTab === "line_checks" ? (
            <div className="space-y-3">
              <div className="rounded border border-white/10 bg-slate-950/70 p-3">
                <p className="text-xs font-semibold text-slate-100">Executable Line Checks</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Live lines can request workstation checks. Running one creates a receipt and evaluation; it does not create an assistant answer.
                </p>
              </div>
              {lineToolRequests.length === 0 ? (
                <p className="text-xs text-slate-500">No line tool requests have been proposed yet. Ask Helix about the live situation to generate checks.</p>
              ) : null}
              {lineToolRequests.slice(-30).reverse().map((request: HelixLiveLineToolRequest) => {
                const evaluation = lineToolEvaluations.find((entry: HelixLiveLineToolEvaluation) => entry.request_id === request.request_id);
                return (
                  <div key={request.request_id} className="rounded border border-cyan-300/15 bg-slate-950/70 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-cyan-100">{request.line_label}</p>
                        <p className="mt-1 text-[11px] text-slate-400">{request.requested_tool}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-slate-400">{request.status}</span>
                        {request.status !== "evaluated" ? (
                          <button
                            type="button"
                            onClick={() => void runLineCheck(request)}
                            className="rounded border border-cyan-300/30 px-2 py-1 text-[10px] text-cyan-100 hover:bg-cyan-400/10"
                          >
                            Run check
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-300">{request.reason_summary}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-slate-500">
                      <span>{request.reason}</span>
                      <span>{request.expected_evidence_kind}</span>
                      <span>priority {request.priority}</span>
                      <span>assistant answer {String(request.assistant_answer)}</span>
                      <span>raw content {String(request.raw_content_included)}</span>
                    </div>
                    {evaluation ? (
                      <div className="mt-3 rounded border border-emerald-300/15 bg-emerald-950/10 p-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-[10px] font-semibold uppercase text-emerald-200">Evaluation</p>
                          <span className="text-[10px] text-slate-500">
                            {evaluation.supports_line} / delta {evaluation.confidence_delta.toFixed(2)}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-200">{evaluation.summary}</p>
                        {evaluation.missing_evidence.length > 0 ? (
                          <p className="mt-1 text-[10px] text-amber-200">
                            Missing: {evaluation.missing_evidence.slice(0, 3).join("; ")}
                          </p>
                        ) : null}
                        <p className="mt-1 truncate text-[10px] text-slate-500">
                          receipts {evaluation.tool_receipt_refs.slice(0, 3).join(", ") || "none"}
                        </p>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
          {activeTab === "interpreted_log" ? (
            <div className="space-y-2">
              {interpretedEvents.length === 0 ? (
                <p className="text-xs text-slate-500">No interpreted events have been recorded yet.</p>
              ) : null}
              {interpretedEvents.slice(-30).reverse().map((event: HelixInterpretedEvent) => (
                <div key={event.event_id} className="rounded border border-white/10 bg-slate-950/70 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-100">{event.title}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-slate-500">{event.kind}</p>
                    </div>
                    <span className="text-[10px] text-slate-500">{formatTime(event.created_at)}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-300">{event.summary}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-slate-500">
                    {typeof event.confidence === "number" ? <span>confidence {Math.round(event.confidence * 100)}%</span> : null}
                    <span>model {String(event.model_invoked)}</span>
                    <span>deterministic {String(event.deterministic)}</span>
                    <span>raw logs {String(event.raw_logs_included)}</span>
                    <span>assistant answer {String(event.assistant_answer)}</span>
                  </div>
                  <p className="mt-2 truncate text-[10px] text-slate-600">
                    evidence {event.evidence_refs.slice(0, 4).join(", ") || "none"}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
          {activeTab === "clarification" ? (
            <div className="space-y-3">
              <div className="rounded border border-white/10 bg-slate-950/70 p-3">
                <p className="text-xs font-semibold text-slate-100">Clarification Queue</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Questions are proposed only when user input would materially improve the situation model. They are validation artifacts, not assistant answers.
                </p>
              </div>
              {clarificationNeeds.length === 0 && clarificationProposals.length === 0 ? (
                <p className="text-xs text-slate-500">No clarification needs are pending.</p>
              ) : null}
              {clarificationProposals.slice(-12).reverse().map((proposal: HelixClarificationQuestionProposal) => {
                const need = clarificationNeeds.find((entry: HelixClarificationNeed) => entry.need_id === proposal.need_id);
                return (
                  <div key={proposal.proposal_id} className="rounded border border-amber-300/20 bg-amber-950/10 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-amber-100">{proposal.question}</p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {proposal.expected_effect} / {proposal.surface_policy} / importance {need?.importance ?? "unknown"}
                        </p>
                      </div>
                      <span className="rounded border border-amber-300/20 px-1.5 py-0.5 text-[10px] text-amber-100">
                        budget {need?.question_budget ?? 0}
                      </span>
                    </div>
                    {need?.missing_evidence?.length ? (
                      <p className="mt-2 text-[11px] text-slate-400">
                        Missing: {need.missing_evidence.slice(0, 3).join("; ")}
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-slate-500">
                      <span>assistant answer {String(proposal.assistant_answer)}</span>
                      <span>raw content {String(proposal.raw_content_included)}</span>
                      <span>{formatTime(proposal.created_at)}</span>
                    </div>
                  </div>
                );
              })}
              {steeringEvidence.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase text-slate-500">Recent Steering Evidence</p>
                  {steeringEvidence.slice(-8).reverse().map((entry: HelixUserSteeringEvidence) => (
                    <div key={entry.steering_id} className="rounded border border-white/10 bg-slate-950/70 p-2">
                      <p className="text-xs text-slate-200">{entry.user_claim}</p>
                      <p className="mt-1 text-[10px] text-slate-500">
                        {entry.effect} / delta {entry.confidence_delta ?? "n/a"} / raw content {String(entry.raw_content_included)}
                      </p>
                      <p className="mt-1 truncate text-[10px] text-slate-600">
                        next checks {entry.next_checks.join(", ") || "none"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          {activeTab === "overview" && environment ? (
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
          {activeTab === "line_schema" && environment ? (
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
          {activeTab === "commentary" ? (
            <div className="space-y-3">
              <div className="rounded border border-white/10 bg-slate-950/70 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-100">Live commentary policy</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Commentary is generated from compact deltas and written as validation/tool observations, not answer text.
                    </p>
                  </div>
                  <select
                    value={commentarySession?.cadence ?? "milestones_only"}
                    onChange={(event) => void setCommentaryCadence(event.target.value as LiveCommentaryCadence)}
                    className="rounded border border-cyan-300/20 bg-slate-950 px-2 py-1 text-[11px] text-slate-100"
                  >
                    {commentaryCadences.map((cadence: LiveCommentaryCadence) => (
                      <option key={cadence} value={cadence}>{cadence}</option>
                    ))}
                  </select>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  <div className="rounded border border-white/10 bg-black/20 p-2">
                    <p className="text-[10px] uppercase text-slate-500">Status</p>
                    <p className="mt-1 text-xs text-slate-200">{commentarySession?.status ?? "not configured"}</p>
                  </div>
                  <div className="rounded border border-white/10 bg-black/20 p-2">
                    <p className="text-[10px] uppercase text-slate-500">Voice mode</p>
                    <p className="mt-1 text-xs text-slate-200">{commentarySession?.voice_mode ?? environment?.mode ?? "n/a"}</p>
                  </div>
                  <div className="rounded border border-white/10 bg-black/20 p-2">
                    <p className="text-[10px] uppercase text-slate-500">Last trace</p>
                    <p className="mt-1 break-words text-xs text-slate-200">{commentarySession?.last_commentary_turn_id ?? "none"}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {commentaryProposals.length === 0 ? <p className="text-xs text-slate-500">No commentary proposals yet.</p> : null}
                {commentaryCandidates.length > 0 ? (
                  <div className="rounded border border-white/10 bg-black/20 p-2">
                    <p className="text-[10px] uppercase text-slate-500">Latest bounded commentary candidate</p>
                    <p className="mt-1 text-xs text-slate-200">{commentaryCandidates[commentaryCandidates.length - 1]?.text}</p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      decision {commentaryCandidates[commentaryCandidates.length - 1]?.decision} / model_invoked=false / deterministic=true
                    </p>
                  </div>
                ) : null}
                {commentaryProposals.slice(-12).reverse().map((proposal: LiveCommentaryProposal) => {
                  const delivery = commentaryDeliveries.find((entry: LiveCommentaryDeliveryReceipt) => entry.proposal_id === proposal.proposal_id);
                  return (
                    <div key={proposal.proposal_id} className="rounded border border-white/10 bg-slate-950/70 p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-slate-100">{proposal.reason} / {proposal.decision}</p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {proposal.priority} / {proposal.cadence} / model_invoked={String(proposal.model_invoked)}
                          </p>
                        </div>
                        <span className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-slate-400">
                          {delivery?.channel ?? "none"} / {delivery?.reason ?? "pending"}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-200">{proposal.text}</p>
                      <p className="mt-2 break-words text-[10px] text-slate-600">
                        evidence {proposal.evidence_refs.slice(0, 3).join(", ") || "none"} / raw logs included false
                      </p>
                      {proposal.trace_steps?.length ? (
                        <div className="mt-3 space-y-1.5 border-t border-white/10 pt-2">
                          {proposal.trace_steps.map((step: LiveCommentaryTraceStep) => (
                            <div key={step.step_id} className="grid gap-1 rounded border border-white/5 bg-black/20 p-2 md:grid-cols-[120px_1fr]">
                              <div className="flex items-center gap-1.5">
                                <span className={`h-1.5 w-1.5 rounded-full ${step.status === "completed" ? "bg-cyan-300" : "bg-slate-600"}`} />
                                <span className="text-[10px] uppercase text-slate-500">{step.label}</span>
                              </div>
                              <p className="text-[11px] text-slate-300">{step.summary}</p>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
          {activeTab === "reviews" ? (
            <div className="space-y-3">
              <div className="rounded border border-white/10 bg-slate-950/70 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-100">Agentic reviews</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Reviews are explicit compact-context requests. Background results are validation items unless a direct user turn asks for an answer.
                    </p>
                  </div>
                  <button type="button" onClick={() => void requestAgenticReview()} className="rounded border border-cyan-300/30 px-2 py-1 text-[11px] text-cyan-100 hover:bg-cyan-400/10">Run review</button>
                </div>
              </div>
              {reviewRequests.length === 0 && reviewResults.length === 0 ? <p className="text-xs text-slate-500">No review requests yet.</p> : null}
              {reviewRequests.slice(-10).reverse().map((request: LiveAgenticReviewReadEntry) => (
                <div key={request.review_id} className="rounded border border-white/10 bg-slate-950/70 p-3">
                  <p className="text-xs font-semibold text-slate-100">{request.trigger ?? "review"} / request</p>
                  <p className="mt-1 text-xs text-slate-300">{request.question ?? "Review the latest live environment state."}</p>
                  <p className="mt-2 text-[10px] text-slate-500">compact_context_pack_only / raw logs included false</p>
                </div>
              ))}
              {reviewResults.slice(-10).reverse().map((result: LiveAgenticReviewReadEntry) => (
                <div key={result.review_id} className="rounded border border-cyan-300/20 bg-cyan-950/20 p-3">
                  <p className="text-xs font-semibold text-cyan-100">{result.decision ?? "review_result"}</p>
                  <p className="mt-1 text-xs text-slate-200">{result.summary ?? "Review completed."}</p>
                  <p className="mt-2 text-[10px] text-slate-500">model_invoked={String(result.model_invoked ?? true)} / item role validation unless user-facing</p>
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
