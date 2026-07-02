import type { CSSProperties, MouseEvent, ReactNode } from "react";

import type { HelixContinuousTurnStreamRow } from "@/lib/helix/ask-active-turn-stream";
import { formatHelixAskFinalReceiptMeta } from "@/lib/helix/ask-agent-runtime-display";
import {
  HelixAskJobReadyLinkStrip,
  HelixAskLiveBridgePillStrip,
  HelixAskProofTraceDetails,
  HelixAskStagePlayActionButtons,
  type HelixAskLiveBridgePill,
} from "./HelixAskFinalExtras";
import { HelixAskTurnControls } from "./HelixAskTurnControls";

type RecordLike = Record<string, unknown>;

export type HelixAskTurnStreamAnswerTint = {
  style?: CSSProperties;
  palette?: string;
  label?: string;
};

export type HelixAskTurnStreamPanelProps = {
  rows: HelixContinuousTurnStreamRow[];
  isLatestReply: boolean;
  workLogTestId?: string;
  questionTestId?: string;
  finalAnswerTestId?: string;
  stagePlayEventCount: number;
  finalAnswerRawText: string;
  finalAnswerSourceLabel: string;
  backendTerminalAnswer?: string | null;
  finalAnswerAuthority: "terminal" | "receipt_fallback_not_reviewed";
  replyId?: string | null;
  activeTurnId?: string | null;
  answerTint?: HelixAskTurnStreamAnswerTint | null;
  actualAgentProviderLabel?: string | null;
  actualAgentModelLabel?: string | null;
  liveBridgeStatus?: string | null;
  renderFinalAnswer: () => ReactNode;
  clipText: (text: string, limit: number) => string;
  readRowClassName: (tone: HelixContinuousTurnStreamRow["tone"]) => string;
  readDotClassName: (tone: HelixContinuousTurnStreamRow["tone"]) => string;
  readPillClassName: (tone: HelixAskLiveBridgePill["tone"]) => string;
  onCopyFinal: () => void;
  onDebugCopy: (event: MouseEvent<HTMLButtonElement>) => void;
  onReadAloud: () => void;
  showDebugCopy?: boolean;
  debugCopyDisabled?: boolean;
  copyFinalTestId?: string;
  debugCopyTestId?: string;
  readAloudTestId?: string;
  readAloudActive?: boolean;
  readAloudAriaLabel?: string;
  readAloudTitle?: string;
  proofTrace?: unknown;
  jobReadyLinks: RecordLike[];
  onRunJobReadyLink: (link: RecordLike) => void;
};

export function HelixAskTurnStreamPanel({
  rows,
  isLatestReply,
  workLogTestId,
  questionTestId,
  finalAnswerTestId,
  stagePlayEventCount,
  finalAnswerRawText,
  finalAnswerSourceLabel,
  backendTerminalAnswer,
  finalAnswerAuthority,
  replyId,
  activeTurnId,
  answerTint,
  actualAgentProviderLabel,
  actualAgentModelLabel,
  liveBridgeStatus,
  renderFinalAnswer,
  clipText,
  readRowClassName,
  readDotClassName,
  readPillClassName,
  onCopyFinal,
  onDebugCopy,
  onReadAloud,
  showDebugCopy = true,
  debugCopyDisabled = false,
  copyFinalTestId,
  debugCopyTestId,
  readAloudTestId,
  readAloudActive = false,
  readAloudAriaLabel = "Read aloud",
  readAloudTitle = "Read aloud",
  proofTrace,
  jobReadyLinks,
  onRunJobReadyLink,
}: HelixAskTurnStreamPanelProps) {
  if (rows.length === 0) return null;

  return (
    <div
      className="px-1 py-1 text-xs text-slate-100"
      aria-label="Turn stream"
      data-testid={workLogTestId}
      data-latest-turn-stream={isLatestReply ? "true" : undefined}
      data-turn-stream-lines={rows.length}
      data-stage-play-events={stagePlayEventCount}
    >
      <div className="relative space-y-3 before:absolute before:left-[0.72rem] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-slate-600/45">
        {rows.map((row, index) => {
          const isFinalRow = row.source === "final";
          const isQuestionRow = row.source === "question";
          const visibleText = isFinalRow ? row.text : clipText(row.text, row.detailLimit ?? 360);
          const receiptMeta = formatHelixAskFinalReceiptMeta([
            row.meta,
            isFinalRow ? actualAgentProviderLabel : null,
            isFinalRow ? actualAgentModelLabel : null,
            row.evidenceRefs.length > 0 ? `refs ${row.evidenceRefs.length}` : null,
          ]);

          return (
            <div
              key={row.key}
              className={`group/streamrow relative flex items-start gap-3 border-l pl-7 ${readRowClassName(row.tone)} ${
                isLatestReply && isFinalRow ? "helix-ask-turn-line-enter" : ""
              }`}
              style={isFinalRow ? answerTint?.style : undefined}
              data-testid={
                isQuestionRow
                  ? questionTestId
                  : isFinalRow
                    ? finalAnswerTestId
                    : isLatestReply
                      ? "helix-ask-latest-turn-stream-row"
                      : undefined
              }
              data-stream-row-source={row.source}
              data-final-answer-text={isFinalRow ? finalAnswerRawText : undefined}
              data-reasoning-stage-palette={isFinalRow ? answerTint?.palette ?? "" : undefined}
              data-reasoning-stage-balance={isFinalRow ? answerTint?.label ?? "" : undefined}
              data-visible-terminal-source={isFinalRow ? finalAnswerSourceLabel : undefined}
              data-backend-terminal-answer={isFinalRow ? backendTerminalAnswer ?? "" : undefined}
              data-final-answer-authority={isFinalRow ? finalAnswerAuthority : undefined}
            >
              <span
                className={`absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 shadow-[0_0_0_3px_rgba(2,6,23,0.9)] ${readDotClassName(row.tone)}`}
                aria-hidden
              />
              <span className="mt-0.5 min-w-6 text-right text-[10px] tabular-nums text-slate-400">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="break-words font-semibold">{row.label}</p>
                  <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12em] text-slate-300">
                    {row.source.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="mt-1 break-words leading-relaxed">
                  {isFinalRow ? renderFinalAnswer() : <p className="whitespace-pre-wrap">{visibleText}</p>}
                </div>
                <HelixAskLiveBridgePillStrip
                  rowKey={row.key}
                  pills={row.bridgePills}
                  isLatestReply={isLatestReply}
                  status={liveBridgeStatus}
                  readPillClassName={readPillClassName}
                />
                {receiptMeta ? (
                  <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-slate-400/80">
                    {receiptMeta}
                  </p>
                ) : null}
                {row.evidenceRefs.length > 0 ? (
                  <p className="mt-1 break-words font-mono text-[10px] normal-case tracking-normal text-slate-400/80">
                    {row.evidenceRefs.slice(0, 4).join(" | ")}
                    {row.evidenceRefs.length > 4 ? " | ..." : ""}
                  </p>
                ) : null}
                <HelixAskStagePlayActionButtons
                  actions={row.actions}
                  rowKey={row.key}
                  isLatestReply={isLatestReply}
                />
                {isFinalRow ? (
                  <>
                    <HelixAskTurnControls
                      onCopyFinal={onCopyFinal}
                      onDebugCopy={onDebugCopy}
                      onReadAloud={onReadAloud}
                      debugScope={{
                        activeTurnId,
                        clientTurnId: replyId,
                        question: rows.find((candidate) => candidate.source === "question")?.text ?? null,
                        finalAnswer: finalAnswerRawText,
                        terminalArtifactKind: finalAnswerSourceLabel,
                      }}
                      showDebugCopy={showDebugCopy}
                      debugCopyDisabled={debugCopyDisabled}
                      copyFinalTestId={copyFinalTestId}
                      debugCopyTestId={debugCopyTestId}
                      readAloudTestId={readAloudTestId}
                      readAloudActive={readAloudActive}
                      readAloudAriaLabel={readAloudAriaLabel}
                      readAloudTitle={readAloudTitle}
                    />
                    <HelixAskProofTraceDetails trace={proofTrace} clipText={clipText} />
                    <HelixAskJobReadyLinkStrip links={jobReadyLinks} onRun={onRunJobReadyLink} />
                  </>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
