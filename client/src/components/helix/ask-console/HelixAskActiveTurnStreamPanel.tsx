import React, { type ReactNode, type RefObject } from "react";

import type {
  HelixContinuousTurnStreamRow,
  HelixContinuousTurnStreamTone,
} from "@/lib/helix/ask-active-turn-stream";
import {
  buildHelixAskConsoleCapabilityLaneSummary,
  resolveHelixAskConsoleCapabilityLaneRowStage,
} from "./HelixAskConsoleDiagnostics";

export type HelixAskActiveTurnStreamPanelProps = {
  rows: HelixContinuousTurnStreamRow[];
  activeTurnId?: string | null;
  activeTraceId?: string | null;
  renderPlacement?: "inline_active_turn" | "pinned_active_lane" | "after_completed_replies";
  showDebugLabel?: boolean;
  panelRef?: RefObject<HTMLDivElement>;
  clipText: (text: string, limit: number) => string;
  renderFinalAnswerContent: (text: string) => ReactNode;
  readRowClass: (tone: HelixContinuousTurnStreamTone) => string;
  readDotClass: (tone: HelixContinuousTurnStreamTone) => string;
};

export function HelixAskActiveTurnStreamPanel({
  rows,
  activeTurnId,
  activeTraceId,
  renderPlacement = "inline_active_turn",
  showDebugLabel = false,
  panelRef,
  clipText,
  renderFinalAnswerContent,
  readRowClass,
  readDotClass,
}: HelixAskActiveTurnStreamPanelProps) {
  if (rows.length === 0) return null;
  const capabilityLaneSummary = buildHelixAskConsoleCapabilityLaneSummary(
    rows
      .map((row) => resolveHelixAskConsoleCapabilityLaneRowStage(row))
      .filter((stage): stage is NonNullable<typeof stage> => Boolean(stage))
      .map((stage) => ({ stage })),
  );

  return (
    <div
      ref={panelRef}
      className="relative px-1 py-1 text-xs text-slate-100"
      aria-label="Active turn stream"
      data-testid="helix-ask-active-turn-stream"
      data-turn-stream-lines={rows.length}
      data-active-row-count={rows.length}
      data-active-turn-id={activeTurnId ?? undefined}
      data-active-trace-id={activeTraceId ?? undefined}
      data-render-placement={renderPlacement}
      data-capability-lane-lifecycle={capabilityLaneSummary.lifecycleStatus}
      data-capability-lane-visible-count={capabilityLaneSummary.visibleCount}
      data-capability-lane-requested-count={capabilityLaneSummary.requestedCount}
      data-capability-lane-backend-selected-count={capabilityLaneSummary.backendSelectedCount}
      data-capability-lane-observed-count={capabilityLaneSummary.observedCount}
      data-capability-lane-reentered-count={capabilityLaneSummary.reenteredCount}
      data-capability-lane-session-count={capabilityLaneSummary.sessionCount}
      data-capability-lane-mail-loop-count={capabilityLaneSummary.mailLoopCount}
      data-capability-lane-goal-binding-count={capabilityLaneSummary.goalBindingCount}
      data-capability-lane-goal-dispatch-plan-count={capabilityLaneSummary.goalDispatchPlanCount}
      data-capability-lane-goal-dispatch-admission-count={capabilityLaneSummary.goalDispatchAdmissionCount}
      data-capability-lane-goal-dispatch-readiness-count={capabilityLaneSummary.goalDispatchReadinessCount}
      data-capability-lane-terminal-selected-count={capabilityLaneSummary.terminalSelectedCount}
      data-capability-lane-terminal-rejected-count={capabilityLaneSummary.terminalRejectedCount}
      data-capability-lane-visible-does-not-mean-executed="true"
    >
      {showDebugLabel ? (
        <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-cyan-200">Active turn stream</p>
      ) : null}
      <div className="relative space-y-3 before:absolute before:left-[0.72rem] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-slate-600/45">
        {rows.map((row, index) => {
          const isQuestionRow = row.source === "question";
          const isFinalRow = row.source === "final";
          const capabilityLaneStage = resolveHelixAskConsoleCapabilityLaneRowStage(row);
          const rowClass = readRowClass(row.tone);
          const dotClass = readDotClass(row.tone);
          const visibleText = isFinalRow ? row.text : clipText(row.text, row.detailLimit ?? 360);
          const isLatestActiveRow = index === rows.length - 1;
          const sourceBadge = capabilityLaneStage
            ? `lane ${capabilityLaneStage.replace(/_/g, " ")}`
            : isQuestionRow
              ? "user prompt"
              : row.source.replace(/_/g, " ");
          return (
            <div
              key={row.key}
              className={`relative flex items-start gap-3 border-l pl-7 ${rowClass} ${
                isLatestActiveRow ? "helix-ask-turn-line-enter" : ""
              }`}
              data-testid="helix-ask-active-turn-stream-row"
              data-active-latest-line={isLatestActiveRow ? "true" : undefined}
              data-stream-row-source={row.source}
              data-capability-lane-stage={capabilityLaneStage ?? undefined}
            >
              {isLatestActiveRow ? (
                <span className="sr-only" data-testid="helix-ask-active-turn-latest-line">
                  Latest active turn line
                </span>
              ) : null}
              <span
                className={`absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 shadow-[0_0_0_3px_rgba(2,6,23,0.9)] ${dotClass}`}
                aria-hidden
              />
              <span className="mt-0.5 min-w-6 text-right text-[10px] tabular-nums text-slate-400">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="break-words font-semibold">{row.label}</p>
                  <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12em] text-slate-300">
                    {sourceBadge}
                  </span>
                </div>
                <div className="mt-1 whitespace-pre-wrap break-words leading-relaxed">
                  {isFinalRow ? renderFinalAnswerContent(visibleText) : visibleText}
                </div>
                <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-slate-400/80">
                  {row.meta || row.status}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
