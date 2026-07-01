import React from "react";
import type { HelixAgentRuntimeDescriptor } from "@shared/helix-agent-runtime";
import {
  DEFAULT_HELIX_AGENT_RUNTIME_PROVIDERS,
  resolveHelixAskActualAgentProviderLabel,
  resolveHelixAskModelUsageLabel,
} from "@/lib/helix/ask-agent-runtime-display";
import { buildHelixTurnTranscriptRows } from "@/lib/helix/ask-turn-transcript";

import { HelixAskFinalAnswer } from "./HelixAskFinalAnswer";
import {
  buildHelixAskMinimalRuntimeControlPayload,
  HELIX_ASK_MINIMAL_RUNTIME_BROWSER_CONTROL_ACTIONS,
  type HelixAskMinimalRuntimeControlActions,
} from "./HelixAskMinimalRuntimeControls";
import type { HelixAskMinimalRuntimeReply } from "./HelixAskMinimalRuntimeLifecycle";
import { HelixAskReplyCard } from "./HelixAskReplyCard";
import { HelixAskTurnList } from "./HelixAskTurnList";
import { HelixAskTurnControls } from "./HelixAskTurnControls";
import { selectHelixAskConsoleWorkstationTraceRows } from "./HelixAskWorkstationTraceRows";

export type HelixAskMinimalRuntimeTurnView = {
  id: string;
  turnId: string;
  question: string;
  answerText: string;
  meta: string | null;
  isLatest: boolean;
  workstationTraceRows: Array<{
    key: string;
    label: string;
    text: string;
    meta: string;
    status: string;
  }>;
};

export type HelixAskMinimalRuntimeTurnListProps = {
  replies: HelixAskMinimalRuntimeReply[];
  className: string;
  providers?: HelixAgentRuntimeDescriptor[];
  controlActions?: HelixAskMinimalRuntimeControlActions;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

export function buildHelixAskMinimalRuntimeTurnViews(args: {
  replies: HelixAskMinimalRuntimeReply[];
  providers?: HelixAgentRuntimeDescriptor[];
}): HelixAskMinimalRuntimeTurnView[] {
  const providers = args.providers ?? DEFAULT_HELIX_AGENT_RUNTIME_PROVIDERS;
  const latestReply = args.replies[args.replies.length - 1] ?? null;
  return args.replies.map((reply) => {
    const projectionSource = reply.result ?? reply;
    const providerLabel = resolveHelixAskActualAgentProviderLabel(projectionSource, providers);
    const modelLabel = resolveHelixAskModelUsageLabel(projectionSource);
    const resultRecord = asRecord(reply.result);
    const resultDebugRecord = asRecord(resultRecord?.debug);
    const transcriptDebugSource = resultRecord
      ? { ...resultRecord, ...(resultDebugRecord ?? {}) }
      : reply.debug ?? null;
    const workstationTraceRows = selectHelixAskConsoleWorkstationTraceRows(
      buildHelixTurnTranscriptRows({
        id: reply.id,
        turn_id: reply.turn_id,
        content: reply.content,
        debug: transcriptDebugSource,
      }),
    ).map((row) => ({
      key: row.key,
      label: row.label,
      text: row.text,
      meta: row.meta,
      status: row.status,
    }));
    return {
      id: reply.id,
      turnId: reply.turn_id,
      question: reply.question,
      answerText: reply.content,
      meta: [providerLabel, modelLabel].filter(Boolean).join(" | ") || null,
      isLatest: latestReply?.turn_id === reply.turn_id,
      workstationTraceRows,
    };
  });
}

export function HelixAskMinimalRuntimeTurnList({
  replies,
  className,
  providers = DEFAULT_HELIX_AGENT_RUNTIME_PROVIDERS,
  controlActions = HELIX_ASK_MINIMAL_RUNTIME_BROWSER_CONTROL_ACTIONS,
}: HelixAskMinimalRuntimeTurnListProps) {
  const views = buildHelixAskMinimalRuntimeTurnViews({ replies, providers });
  if (views.length === 0) return null;

  return (
    <HelixAskTurnList className={className}>
      {views.map((view, index) => {
        const reply = replies[index];
        if (!reply) return null;
        const payload = buildHelixAskMinimalRuntimeControlPayload({ reply, view });
        return (
          <HelixAskReplyCard
            key={view.turnId}
            turnTestId={view.isLatest ? "helix-ask-minimal-runtime-latest-turn" : undefined}
            isLatestReply={view.isLatest}
            tintClassName="rounded-2xl bg-cyan-400/10"
            promptIngested
          >
            <article className="rounded-2xl border border-cyan-300/15 bg-black/20 px-3 py-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-cyan-200/80">
                Prompt
              </p>
              <p className="mt-1 break-words text-xs text-slate-300 [overflow-wrap:anywhere]">
                {view.question}
              </p>
              {view.workstationTraceRows.length > 0 ? (
                <div
                  className="mt-3 space-y-2"
                  data-testid={view.isLatest ? "helix-ask-minimal-runtime-workstation-trace" : undefined}
                >
                  {view.workstationTraceRows.map((row) => (
                    <div
                      key={row.key}
                      className="rounded-lg border border-cyan-300/10 bg-cyan-300/5 px-2 py-2 text-xs text-slate-200"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{row.label}</p>
                        <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12em] text-slate-400">
                          {row.status}
                        </span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                        {row.text}
                      </p>
                      {row.meta ? (
                        <p className="mt-1 break-words text-[10px] uppercase tracking-[0.12em] text-slate-500">
                          {row.meta}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
              <HelixAskFinalAnswer text={view.answerText} meta={view.meta} />
              {view.isLatest ? (
                <HelixAskTurnControls
                  onCopyFinal={() => void controlActions.copyFinal(payload)}
                  onDebugCopy={() => void controlActions.debugCopy(payload)}
                  onReadAloud={() => void controlActions.readAloud(payload)}
                  copyFinalTestId="helix-ask-latest-copy-final"
                  debugCopyTestId="helix-ask-latest-debug-copy"
                  readAloudTestId="helix-ask-latest-read-aloud"
                />
              ) : null}
            </article>
          </HelixAskReplyCard>
        );
      })}
    </HelixAskTurnList>
  );
}
