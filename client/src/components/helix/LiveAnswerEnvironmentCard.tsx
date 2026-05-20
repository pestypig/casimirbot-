import React, { useEffect, useMemo, useState } from "react";
import type {
  LiveAnswerEnvironment,
  LiveAnswerEnvironmentDelta,
  LiveAnswerLineState,
} from "@shared/helix-live-answer-environment";
import {
  buildRehearsalSpaceCatalog,
  type HelixRehearsalSpace,
  type HelixRehearsalSpaceId,
} from "@shared/helix-rehearsal-space";
import type { HelixPresentStateCard, HelixPresentStateCardLine } from "@shared/helix-present-state-card";
import { LiveAnswerEnvironmentTrace } from "@/components/helix/LiveAnswerEnvironmentTrace";

const cleanLine = (line: LiveAnswerLineState): string => {
  const value = String(line.value ?? "").trim();
  return value.replace(new RegExp(`^${line.label}:\\s*`, "i"), "").trim();
};

const postEnvironmentAction = (environmentId: string, action: "pause" | "resume" | "stop") => {
  if (typeof fetch !== "function") return;
  void fetch(`/api/agi/situation/live-answer-environment/${encodeURIComponent(environmentId)}/${action}`, {
    method: "POST",
  }).catch(() => undefined);
};

const lineValue = (lines: LiveAnswerLineState[], key: string): string =>
  cleanLine(lines.find((line: LiveAnswerLineState) => line.key === key) ?? { key, label: key, value: "" } as LiveAnswerLineState).toLowerCase();

const environmentPolicyBadges = (environment: LiveAnswerEnvironment): Array<{ label: string; value: string }> => {
  const sourceKinds = new Set<string>();
  if (environment.lines.some((line: LiveAnswerLineState) => ["situation", "actor_state", "resources", "affordances"].includes(line.key))) {
    sourceKinds.add("environment_state");
  }
  if (environment.lines.some((line: LiveAnswerLineState) => ["possibilities", "rehearsal", "recommendation"].includes(line.key))) {
    sourceKinds.add("procedure_graph");
  }
  if (environment.source_ids.some((sourceId: string) => /visual|frame|screen/i.test(sourceId))) sourceKinds.add("visual_frame");
  if (environment.source_ids.some((sourceId: string) => /audio|voice|transcript/i.test(sourceId))) sourceKinds.add("audio");
  if (environment.source_ids.some((sourceId: string) => /simulation|sim/i.test(sourceId))) sourceKinds.add("simulation");

  const possibility = lineValue(environment.lines, "possibilities");
  const rehearsal = lineValue(environment.lines, "rehearsal");
  const recommendation = lineValue(environment.lines, "recommendation");
  return [
    { label: "Source", value: Array.from(sourceKinds).join(" / ") || "none" },
    {
      label: "Possibility",
      value: /stale/.test(possibility) ? "stale" : /candidate|possible|retrieve|visible affordance/.test(possibility) ? "candidate exists" : "none",
    },
    {
      label: "Rehearsal",
      value: /blocked/.test(rehearsal) ? "blocked" : /partial|caveat/.test(rehearsal) ? "partial" : /risky/.test(rehearsal) ? "risky" : /passed|feasible/.test(rehearsal) ? "feasible" : "not run",
    },
    {
      label: "Recommendation",
      value: /confirmation/.test(recommendation) ? "needs confirmation" : /caveat|recheck/.test(recommendation) ? "suggested with caveat" : recommendation.trim() ? "safe to suggest" : "hidden",
    },
  ];
};

const copyDebugSummary = (environment: LiveAnswerEnvironment, deltas: LiveAnswerEnvironmentDelta[]) => {
  const text = JSON.stringify({
    environment_id: environment.environment_id,
    status: environment.status,
    mode: environment.mode,
    objective: environment.objective,
    latest_summary: environment.latest_summary,
    latest_evaluation: environment.latest_evaluation ?? null,
    lines: environment.lines.map((line: LiveAnswerLineState) => ({
      key: line.key,
      value: line.value,
      updated_at: line.updated_at,
      model_invoked: line.model_invoked,
      deterministic: line.deterministic !== false,
    })),
    deltas: deltas.slice(-6).map((delta: LiveAnswerEnvironmentDelta) => ({
      delta_id: delta.delta_id,
      reason: delta.reason,
      changed_fields: delta.changed_fields ?? delta.changed_line_keys,
      window_id: delta.window_id ?? null,
      source_event_count: delta.source_event_count ?? null,
      raw_logs_included: false,
    })),
    raw_logs_included: false,
    context_policy: "compact_context_pack_only",
  }, null, 2);
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    void navigator.clipboard.writeText(text).catch(() => undefined);
  }
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
  const [presentStateCard, setPresentStateCard] = useState<HelixPresentStateCard | null>(null);
  const rehearsalCatalog = useMemo(() => buildRehearsalSpaceCatalog({
    sourceIds: environment.source_ids,
    lineKeys: environment.lines.map((line: LiveAnswerLineState) => line.key),
    objective: environment.objective,
    preset: environment.preset,
  }), [environment.lines, environment.objective, environment.preset, environment.source_ids]);
  const [selectedRehearsalSpaceId, setSelectedRehearsalSpaceId] = useState<HelixRehearsalSpaceId | null>(
    rehearsalCatalog.selected_space_id,
  );
  useEffect(() => {
    if (!selectedRehearsalSpaceId || !rehearsalCatalog.spaces.some((space: HelixRehearsalSpace) => space.space_id === selectedRehearsalSpaceId)) {
      setSelectedRehearsalSpaceId(rehearsalCatalog.selected_space_id);
    }
  }, [rehearsalCatalog.selected_space_id, rehearsalCatalog.spaces, selectedRehearsalSpaceId]);
  useEffect(() => {
    let cancelled = false;
    const roomQuery = environment.room_id ? `&room_id=${encodeURIComponent(environment.room_id)}` : "";
    fetch(`/api/agi/situation/present-state-card?thread_id=${encodeURIComponent(environment.thread_id)}${roomQuery}`)
      .then((response) => response.ok ? response.json() : null)
      .then((body) => {
        if (!cancelled) setPresentStateCard(body?.card ?? null);
      })
      .catch(() => {
        if (!cancelled) setPresentStateCard(null);
      });
    return () => {
      cancelled = true;
    };
  }, [environment.environment_id, environment.room_id, environment.thread_id, environment.updated_at]);
  const answerLines = environment.lines.filter((line: LiveAnswerLineState) => line.visibility === "answer_card");
  const presentLines = presentStateCard?.lines ?? [];
  const visibleLines = presentLines.length > 0
    ? presentLines
    : answerLines.map((entry: LiveAnswerLineState): HelixPresentStateCardLine => ({
        key: entry.key,
        label: entry.label,
        value: cleanLine(entry),
        evidence_refs: entry.evidence_refs,
        confidence: null,
        updated_at: entry.updated_at,
      }));
  const procedureLines = environment.lines.filter((line: LiveAnswerLineState) =>
    line.key === "possibilities" ||
    line.key === "rehearsal" ||
    line.key === "recommendation" ||
    line.key === "unknowns"
  );
  const sourceSummary = [
    environment.source_ids.length ? `Sources ${environment.source_ids.length}` : "No bound source",
    environment.context_policy,
    "raw payloads excluded",
  ].join(" / ");
  const policyBadges = environmentPolicyBadges(environment);
  const selectedRehearsalSpace = rehearsalCatalog.spaces.find((space: HelixRehearsalSpace) => space.space_id === selectedRehearsalSpaceId) ??
    rehearsalCatalog.spaces.find((space: HelixRehearsalSpace) => space.space_id === rehearsalCatalog.selected_space_id) ??
    null;
  const pendingQuestion = presentStateCard?.pending_request_input?.question ?? null;
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
          {environment.status} / {environment.mode}{stale ? " / stale" : ""}
        </span>
      </div>
      <div className="mt-2 grid gap-1.5 text-[11px] text-cyan-50/90">
        <p>
          <span className="text-cyan-200/80">Sources: </span>
          {sourceSummary}
        </p>
        <div className="flex flex-wrap gap-1">
          {policyBadges.map((badge: { label: string; value: string }) => (
            <span key={badge.label} className="rounded border border-cyan-300/20 bg-black/15 px-1.5 py-0.5 text-[10px] text-cyan-100">
              {badge.label}: {badge.value}
            </span>
          ))}
        </div>
        {visibleLines.map((line: HelixPresentStateCardLine) => (
          <p key={line.key}>
            <span className="text-cyan-200/80">{line.label}: </span>
            {String(line.value ?? "").trim()}
            {typeof line.confidence === "number" ? (
              <span className="ml-1 text-cyan-200/60">({Math.round(line.confidence * 100)}%)</span>
            ) : null}
          </p>
        ))}
        {pendingQuestion ? (
          <p>
            <span className="text-cyan-200/80">Question: </span>
            {pendingQuestion}
          </p>
        ) : null}
      </div>
      <div className="mt-2 rounded border border-cyan-300/15 bg-cyan-950/20 px-2 py-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] uppercase tracking-[0.14em] text-cyan-200">Rehearsal spaces</p>
          {selectedRehearsalSpace ? (
            <span className="rounded border border-cyan-300/20 px-1.5 py-0.5 text-[10px] text-cyan-100">
              fidelity +{Math.round(selectedRehearsalSpace.additive_fidelity_hint * 100)}%
            </span>
          ) : null}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {rehearsalCatalog.spaces.map((space: HelixRehearsalSpace) => (
            <button
              key={space.space_id}
              type="button"
              onClick={() => setSelectedRehearsalSpaceId(space.space_id)}
              disabled={space.status === "future"}
              title={`${space.summary} Adapter: ${space.domain_adapter}. Execution disabled.`}
              className={`rounded border px-2 py-1 text-[10px] ${
                selectedRehearsalSpaceId === space.space_id
                  ? "border-cyan-200/50 bg-cyan-300/15 text-cyan-50"
                  : space.status === "available"
                    ? "border-emerald-300/25 text-emerald-100 hover:bg-emerald-400/10"
                    : space.status === "partial"
                      ? "border-amber-300/25 text-amber-100 hover:bg-amber-400/10"
                      : "border-white/10 text-slate-500"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {space.label} / {space.status}
            </button>
          ))}
        </div>
        {selectedRehearsalSpace ? (
          <p className="mt-1.5 text-[10px] text-cyan-50/70">
            {selectedRehearsalSpace.summary} Modes: {selectedRehearsalSpace.supported_rehearsal_modes.join(", ")}. Live actions disabled.
          </p>
        ) : null}
      </div>
      {procedureLines.length > 0 ? (
        <details className="mt-2 rounded border border-cyan-300/15 bg-cyan-950/20 px-2 py-1 text-[11px] text-cyan-50/90">
          <summary className="cursor-pointer text-cyan-100">Procedure / rehearsal trace</summary>
          <div className="mt-1 grid gap-1">
            {procedureLines.map((line: LiveAnswerLineState) => (
              <p key={line.key}>
                <span className="text-cyan-200/80">{line.label}: </span>
                {cleanLine(line)}
              </p>
            ))}
          </div>
        </details>
      ) : null}
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
          onClick={() => setTraceOpen((value: boolean) => !value)}
          className="rounded border border-white/15 bg-white/5 px-2 py-1 text-[11px] text-slate-100 hover:bg-white/10"
        >
          {traceOpen ? "Hide trace" : "Show trace"}
        </button>
        <button
          type="button"
          onClick={() => postEnvironmentAction(environment.environment_id, "pause")}
          className="rounded border border-white/15 bg-white/5 px-2 py-1 text-[11px] text-slate-100 hover:bg-white/10"
        >
          Pause
        </button>
        <button
          type="button"
          onClick={() => postEnvironmentAction(environment.environment_id, "resume")}
          className="rounded border border-white/15 bg-white/5 px-2 py-1 text-[11px] text-slate-100 hover:bg-white/10"
        >
          Resume
        </button>
        <button
          type="button"
          onClick={() => postEnvironmentAction(environment.environment_id, "stop")}
          className="rounded border border-white/15 bg-white/5 px-2 py-1 text-[11px] text-slate-100 hover:bg-white/10"
        >
          Stop
        </button>
        <button
          type="button"
          onClick={() => copyDebugSummary(environment, deltas)}
          className="rounded border border-white/15 bg-white/5 px-2 py-1 text-[11px] text-slate-100 hover:bg-white/10"
        >
          Copy debug summary
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
