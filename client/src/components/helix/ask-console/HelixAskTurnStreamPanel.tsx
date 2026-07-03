import React, { type CSSProperties, type MouseEvent, type ReactNode } from "react";

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
import {
  buildHelixAskConsoleCapabilityLaneSummary,
  formatHelixAskConsoleCapabilityLaneRowDetailText,
  formatHelixAskConsoleCapabilityLaneStageDisplayText,
  formatHelixAskConsoleCapabilityLaneSummaryText,
  resolveHelixAskConsoleCapabilityLaneRowDetail,
  resolveHelixAskConsoleCapabilityLaneRowStage,
} from "./HelixAskConsoleDiagnostics";

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
  const capabilityLaneSummary = buildHelixAskConsoleCapabilityLaneSummary(
    rows
      .map((row) => resolveHelixAskConsoleCapabilityLaneRowStage(row))
      .filter((stage): stage is NonNullable<typeof stage> => Boolean(stage))
      .map((stage) => ({ stage })),
  );
  const capabilityLaneSummaryText = formatHelixAskConsoleCapabilityLaneSummaryText(capabilityLaneSummary);

  return (
    <div
      className="px-1 py-1 text-xs text-slate-100"
      aria-label="Turn stream"
      data-testid={workLogTestId}
      data-latest-turn-stream={isLatestReply ? "true" : undefined}
      data-turn-stream-lines={rows.length}
      data-stage-play-events={stagePlayEventCount}
      data-capability-lane-lifecycle={capabilityLaneSummary.lifecycleStatus}
      data-capability-lane-visible-count={capabilityLaneSummary.visibleCount}
      data-capability-lane-requested-count={capabilityLaneSummary.requestedCount}
      data-capability-lane-executed-count={capabilityLaneSummary.executedCount}
      data-capability-lane-backend-selected-count={capabilityLaneSummary.backendSelectedCount}
      data-capability-lane-observed-count={capabilityLaneSummary.observedCount}
      data-capability-lane-receipt-count={capabilityLaneSummary.receiptCount}
      data-capability-lane-reentered-count={capabilityLaneSummary.reenteredCount}
      data-capability-lane-session-count={capabilityLaneSummary.sessionCount}
      data-capability-lane-mail-loop-count={capabilityLaneSummary.mailLoopCount}
      data-capability-lane-goal-binding-count={capabilityLaneSummary.goalBindingCount}
      data-capability-lane-goal-dispatch-plan-count={capabilityLaneSummary.goalDispatchPlanCount}
      data-capability-lane-goal-dispatch-admission-count={capabilityLaneSummary.goalDispatchAdmissionCount}
      data-capability-lane-goal-dispatch-readiness-count={capabilityLaneSummary.goalDispatchReadinessCount}
      data-capability-lane-terminal-selected-count={capabilityLaneSummary.terminalSelectedCount}
      data-capability-lane-terminal-rejected-count={capabilityLaneSummary.terminalRejectedCount}
      data-capability-lane-stage-sequence={capabilityLaneSummary.stageSequenceText || undefined}
      data-capability-lane-visible-does-not-mean-executed="true"
    >
      {capabilityLaneSummaryText ? (
        <div
          className="mb-2 rounded border border-cyan-300/20 bg-cyan-950/20 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-cyan-100"
          aria-label="Capability lane timeline summary"
          data-testid="helix-ask-capability-lane-summary"
        >
          {capabilityLaneSummaryText}
        </div>
      ) : null}
      <div className="relative space-y-3 before:absolute before:left-[0.72rem] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-slate-600/45">
        {rows.map((row, index) => {
          const isFinalRow = row.source === "final";
          const isQuestionRow = row.source === "question";
          const capabilityLaneStage = resolveHelixAskConsoleCapabilityLaneRowStage(row);
          const capabilityLaneDetail = capabilityLaneStage
            ? resolveHelixAskConsoleCapabilityLaneRowDetail(row)
            : null;
          const capabilityLaneStageDisplay = capabilityLaneStage
            ? formatHelixAskConsoleCapabilityLaneStageDisplayText(capabilityLaneStage)
            : null;
          const capabilityLaneDetailText = capabilityLaneStage && capabilityLaneDetail
            ? formatHelixAskConsoleCapabilityLaneRowDetailText(capabilityLaneStage, capabilityLaneDetail)
            : null;
          const visibleText = isFinalRow ? row.text : clipText(row.text, row.detailLimit ?? 360);
          const sourceBadge = capabilityLaneStage
            ? `lane ${capabilityLaneStage.replace(/_/g, " ")}`
            : row.source.replace(/_/g, " ");
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
              data-capability-lane-stage={capabilityLaneStage ?? undefined}
              data-capability-lane-stage-display={capabilityLaneStageDisplay ?? undefined}
              data-capability-lane-runtime-provider={capabilityLaneDetail?.selectedRuntimeAgentProvider ?? undefined}
              data-capability-lane-adapter-boundary={capabilityLaneDetail?.adapterBoundary ?? undefined}
              data-capability-lane-id={capabilityLaneDetail?.laneId ?? undefined}
              data-capability-lane-capability-id={capabilityLaneDetail?.capabilityId ?? undefined}
              data-capability-lane-backend-provider={capabilityLaneDetail?.selectedBackendProvider ?? undefined}
              data-capability-lane-observation-ref={capabilityLaneDetail?.observationRef ?? undefined}
              data-capability-lane-receipt-ref={capabilityLaneDetail?.receiptRef ?? undefined}
              data-capability-lane-source-id={capabilityLaneDetail?.sourceId ?? undefined}
              data-capability-lane-source-hash={capabilityLaneDetail?.sourceHash ?? undefined}
              data-capability-lane-source-kind={capabilityLaneDetail?.sourceKind ?? undefined}
              data-capability-lane-source-text-hash={capabilityLaneDetail?.sourceTextHash ?? undefined}
              data-capability-lane-source-text-char-count={
                capabilityLaneDetail?.sourceTextCharCount ?? undefined
              }
              data-capability-lane-projection-key={capabilityLaneDetail?.projectionKey ?? undefined}
              data-capability-lane-projection-target={capabilityLaneDetail?.projectionTarget ?? undefined}
              data-capability-lane-account-locale={capabilityLaneDetail?.accountLocale ?? undefined}
              data-capability-lane-target-language={capabilityLaneDetail?.targetLanguage ?? undefined}
              data-capability-lane-chunk-id={capabilityLaneDetail?.chunkId ?? undefined}
              data-capability-lane-chunk-index={capabilityLaneDetail?.chunkIndex ?? undefined}
              data-capability-lane-dedupe-key={capabilityLaneDetail?.dedupeKey ?? undefined}
              data-capability-lane-latest-event-id={capabilityLaneDetail?.latestEventId ?? undefined}
              data-capability-lane-source-event-id={capabilityLaneDetail?.sourceEventId ?? undefined}
              data-capability-lane-source-event-ms={capabilityLaneDetail?.sourceEventMs ?? undefined}
              data-capability-lane-observed-at-ms={capabilityLaneDetail?.observedAtMs ?? undefined}
              data-capability-lane-freshness-status={capabilityLaneDetail?.freshnessStatus ?? undefined}
              data-capability-lane-cancel-requested={capabilityLaneDetail?.cancelRequested ?? undefined}
              data-capability-lane-goal-id={capabilityLaneDetail?.goalId ?? undefined}
              data-capability-lane-goal-binding-id={capabilityLaneDetail?.goalBindingId ?? undefined}
              data-capability-lane-session-id={capabilityLaneDetail?.laneSessionId ?? undefined}
              data-capability-lane-session-lifecycle-action={
                capabilityLaneDetail?.sessionLifecycleAction ?? undefined
              }
              data-capability-lane-session-control-key={capabilityLaneDetail?.sessionControlKey ?? undefined}
              data-capability-lane-source-binding-key={capabilityLaneDetail?.sourceBindingKey ?? undefined}
              data-capability-lane-latest-observation-key={
                capabilityLaneDetail?.latestObservationKey ?? undefined
              }
              data-capability-lane-latest-mail-loop-observation-key={
                capabilityLaneDetail?.latestMailLoopObservationKey ?? undefined
              }
              data-capability-lane-goal-binding-key={capabilityLaneDetail?.goalBindingKey ?? undefined}
              data-capability-lane-wake-kind={capabilityLaneDetail?.wakeKind ?? undefined}
              data-capability-lane-materialized-mail-loop-evidence={
                capabilityLaneDetail?.materializedMailLoopEvidence ?? undefined
              }
              data-capability-lane-has-observation={capabilityLaneDetail?.hasObservation ?? undefined}
              data-capability-lane-observation-session-id={
                capabilityLaneDetail?.observationLaneSessionId ?? undefined
              }
              data-capability-lane-observation-lane-session-id={
                capabilityLaneDetail?.observationLaneSessionId ?? undefined
              }
              data-capability-lane-report-summary={capabilityLaneDetail?.reportSummaryText ?? undefined}
              data-capability-lane-terminal-authority-status={
                capabilityLaneDetail?.terminalAuthorityStatus ?? undefined
              }
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
                    {sourceBadge}
                  </span>
                  {capabilityLaneStageDisplay ? (
                    <span
                      className="rounded border border-cyan-300/20 bg-cyan-950/25 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12em] text-cyan-100"
                      title={
                        capabilityLaneStage === "visible"
                          ? "This lane is visible to the runtime; it has not been requested or executed."
                          : undefined
                      }
                    >
                      {capabilityLaneStageDisplay}
                    </span>
                  ) : null}
                </div>
                <div className="mt-1 break-words leading-relaxed">
                  {isFinalRow ? renderFinalAnswer() : <p className="whitespace-pre-wrap">{visibleText}</p>}
                </div>
                {capabilityLaneDetailText ? (
                  <p
                    className="mt-1 break-words text-[10px] uppercase tracking-[0.12em] text-cyan-100/80"
                    aria-label="Capability lane row detail"
                    data-testid="helix-ask-capability-lane-row-detail"
                  >
                    {capabilityLaneDetailText}
                  </p>
                ) : null}
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
