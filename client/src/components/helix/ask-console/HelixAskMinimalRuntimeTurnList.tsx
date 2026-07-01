import React from "react";
import type { HelixAgentRuntimeDescriptor } from "@shared/helix-agent-runtime";
import {
  DEFAULT_HELIX_AGENT_RUNTIME_PROVIDERS,
  resolveHelixAskActualAgentProviderLabel,
  resolveHelixAskModelUsageLabel,
} from "@/lib/helix/ask-agent-runtime-display";

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

export type HelixAskMinimalRuntimeTurnView = {
  id: string;
  turnId: string;
  question: string;
  answerText: string;
  meta: string | null;
  isLatest: boolean;
};

export type HelixAskMinimalRuntimeTurnListProps = {
  replies: HelixAskMinimalRuntimeReply[];
  className: string;
  providers?: HelixAgentRuntimeDescriptor[];
  controlActions?: HelixAskMinimalRuntimeControlActions;
};

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
    return {
      id: reply.id,
      turnId: reply.turn_id,
      question: reply.question,
      answerText: reply.content,
      meta: [providerLabel, modelLabel].filter(Boolean).join(" | ") || null,
      isLatest: latestReply?.turn_id === reply.turn_id,
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
