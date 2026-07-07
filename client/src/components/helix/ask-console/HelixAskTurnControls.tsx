import React, { type MouseEvent, useState } from "react";
import { AlertCircle, Bug, Copy, Loader2, Pause, Play, RotateCcw, SendHorizontal, Volume2, X } from "lucide-react";
import type { ReadAloudPlaybackState } from "@/lib/helix/ask-read-aloud-display";
import {
  buildClaimablePostulateReceipt,
  notifyPostulateBoardChanged,
  rememberClaimablePostulateReceipt,
  submitPostulateProposal,
} from "@/lib/agi/proposals";
import { isPublicPostulateStatus } from "@shared/proposals";

export type HelixAskTurnControlsProps = {
  onCopyFinal: () => void;
  onDebugCopy: (event: MouseEvent<HTMLButtonElement>) => void;
  onReadAloud: () => void;
  debugScope?: {
    activeTurnId?: string | null;
    clientTurnId?: string | null;
    question?: string | null;
    finalAnswer?: string | null;
    terminalArtifactKind?: string | null;
    modelPolicyDebugSummary?: string | null;
  } | null;
  showDebugCopy?: boolean;
  debugCopyDisabled?: boolean;
  copyFinalTestId?: string;
  debugCopyTestId?: string;
  readAloudTestId?: string;
  readAloudActive?: boolean;
  readAloudState?: ReadAloudPlaybackState;
  readAloudAriaLabel?: string;
  readAloudTitle?: string;
  postulateText?: string | null;
  postulateTestId?: string;
  postulateOriginatingSessionId?: string | null;
  postulateOriginatingAnswerId?: string | null;
};

const ReadAloudIcon = ({ state }: { state: ReadAloudPlaybackState }) => {
  if (state === "loading" || state === "resuming") return <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />;
  if (state === "playing") return <Pause className="h-3.5 w-3.5" aria-hidden />;
  if (state === "paused") return <Play className="h-3.5 w-3.5" aria-hidden />;
  if (state === "error" || state === "unavailable") return <AlertCircle className="h-3.5 w-3.5" aria-hidden />;
  if (state === "completed") return <RotateCcw className="h-3.5 w-3.5" aria-hidden />;
  return <Volume2 className="h-3.5 w-3.5" aria-hidden />;
};

export function HelixAskTurnControls({
  onCopyFinal,
  onDebugCopy,
  onReadAloud,
  debugScope,
  showDebugCopy = true,
  debugCopyDisabled = false,
  copyFinalTestId,
  debugCopyTestId,
  readAloudTestId,
  readAloudActive = false,
  readAloudState = "idle",
  readAloudAriaLabel = "Read aloud",
  readAloudTitle = "Read aloud",
  postulateText = null,
  postulateTestId,
  postulateOriginatingSessionId = null,
  postulateOriginatingAnswerId = null,
}: HelixAskTurnControlsProps) {
  const [postulateOpen, setPostulateOpen] = useState(false);
  const [postulateNote, setPostulateNote] = useState("Send this postulate to be reviewed");
  const [postulateBusy, setPostulateBusy] = useState(false);
  const [postulateStatus, setPostulateStatus] = useState<string | null>(null);
  const turnScopeAttributes = {
    "data-turn-control-active-turn-id": debugScope?.activeTurnId ?? undefined,
    "data-turn-control-client-turn-id": debugScope?.clientTurnId ?? undefined,
    "data-turn-control-question": debugScope?.question ?? undefined,
    "data-turn-control-final-answer": debugScope?.finalAnswer ?? undefined,
    "data-turn-control-terminal-artifact-kind": debugScope?.terminalArtifactKind ?? undefined,
    "data-turn-control-model-policy-debug-summary": debugScope?.modelPolicyDebugSummary ?? undefined,
  };
  const normalizedPostulateText = typeof postulateText === "string" ? postulateText.trim() : "";
  const postulateEnabled = normalizedPostulateText.length > 0;
  const postulateButtonLabel = postulateStatus ?? "Send postulate for review";
  const submitPostulate = async () => {
    if (!postulateEnabled || postulateBusy) return;
    setPostulateBusy(true);
    setPostulateStatus(null);
    try {
      const result = await submitPostulateProposal({
        proposalText: normalizedPostulateText,
        userComment: postulateNote,
        originatingSessionId: postulateOriginatingSessionId ?? debugScope?.activeTurnId ?? null,
        originatingAnswerId: postulateOriginatingAnswerId ?? debugScope?.clientTurnId ?? null,
      });
      const claimableReceipt = buildClaimablePostulateReceipt(result.proposal, result.receiptId);
      if (claimableReceipt?.status === "claim_pending") {
        rememberClaimablePostulateReceipt(claimableReceipt);
      }
      const score = typeof result.proposal.safetyScore === "number"
        ? `${Math.round(result.proposal.safetyScore * 100)}%`
        : "recorded";
      if (isPublicPostulateStatus(result.proposal.status)) {
        notifyPostulateBoardChanged(result.proposal);
        setPostulateStatus(`Published for review. Receipt ${result.receiptId.slice(0, 8)} | ${score}`);
        setPostulateOpen(false);
      } else {
        const reason = result.proposal.safetyReport
          ? result.proposal.safetyReport.split(";").slice(-2).join(";").trim()
          : "below constructive review threshold";
        setPostulateStatus(`Not published. Review score ${score}; ${reason}`);
      }
    } catch (error) {
      setPostulateStatus(error instanceof Error ? error.message : "Postulate submission failed");
    } finally {
      setPostulateBusy(false);
    }
  };

  return (
    <div
      className="relative z-20 mt-2 flex max-w-fit items-center gap-1 opacity-100 transition-opacity duration-150"
      {...turnScopeAttributes}
    >
      <button
        type="button"
        onClick={onCopyFinal}
        className="rounded-full border border-white/10 bg-white/5 p-1.5 text-slate-400 transition hover:border-cyan-300/40 hover:bg-cyan-400/10 hover:text-cyan-100"
        aria-label="Copy response"
        title="Copy response"
        data-testid={copyFinalTestId}
        {...turnScopeAttributes}
      >
        <Copy className="h-3.5 w-3.5" aria-hidden />
      </button>
      {showDebugCopy ? (
        <button
          type="button"
          onClick={onDebugCopy}
          disabled={debugCopyDisabled}
          className="rounded-full border border-white/10 bg-white/5 p-1.5 text-slate-400 transition hover:border-cyan-300/40 hover:bg-cyan-400/10 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Debug copy"
          title="Unified Debug Copy"
          data-testid={debugCopyTestId}
          {...turnScopeAttributes}
          data-debug-copy-active-turn-id={debugScope?.activeTurnId ?? undefined}
          data-debug-copy-client-turn-id={debugScope?.clientTurnId ?? undefined}
          data-debug-copy-question={debugScope?.question ?? undefined}
          data-debug-copy-final-answer={debugScope?.finalAnswer ?? undefined}
          data-debug-copy-terminal-artifact-kind={debugScope?.terminalArtifactKind ?? undefined}
          data-debug-copy-model-policy-debug-summary={debugScope?.modelPolicyDebugSummary ?? undefined}
        >
          <Bug className="h-3.5 w-3.5" aria-hidden />
        </button>
      ) : null}
      <button
        type="button"
        onClick={onReadAloud}
        className={`rounded-full border p-1.5 transition ${
          readAloudActive
            ? "border-amber-300/40 bg-amber-400/10 text-amber-100 hover:bg-amber-400/20"
            : "border-white/10 bg-white/5 text-slate-400 hover:border-cyan-300/40 hover:bg-cyan-400/10 hover:text-cyan-100"
        }`}
        aria-label={readAloudAriaLabel}
        title={readAloudTitle}
        data-testid={readAloudTestId}
        data-read-aloud-state={readAloudState}
        {...turnScopeAttributes}
      >
        <ReadAloudIcon state={readAloudState} />
      </button>
      {postulateEnabled ? (
        <>
          <button
            type="button"
            onClick={() => setPostulateOpen((current) => !current)}
            disabled={postulateBusy}
            className="rounded-full border border-white/10 bg-white/5 p-1.5 text-slate-400 transition hover:border-cyan-300/40 hover:bg-cyan-400/10 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={postulateButtonLabel}
            title={postulateButtonLabel}
            data-testid={postulateTestId}
            aria-expanded={postulateOpen}
            {...turnScopeAttributes}
          >
            <SendHorizontal className="h-3.5 w-3.5" aria-hidden />
          </button>
          {postulateStatus ? (
            <span className="sr-only" role="status" aria-live="polite">
              {postulateStatus}
            </span>
          ) : null}
          {postulateOpen ? (
            <div className="absolute left-0 top-9 z-30 min-w-[18rem] max-w-[min(28rem,calc(100vw-2rem))] rounded-md border border-cyan-300/20 bg-slate-950/95 p-3 text-left shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-200">/postulate</p>
                  <p className="mt-1 text-xs text-slate-300">Send this postulate to be reviewed</p>
                </div>
                <button
                  type="button"
                  className="rounded-md border border-white/10 p-1 text-slate-300 hover:bg-white/10"
                  onClick={() => setPostulateOpen(false)}
                  aria-label="Close postulate composer"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
              <textarea
                className="mt-3 min-h-20 w-full resize-y rounded-md border border-white/10 bg-black/30 px-3 py-2 text-xs text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-300/50"
                value={postulateNote}
                onChange={(event) => setPostulateNote(event.target.value)}
                aria-label="Postulate review note"
              />
              <textarea
                className="mt-3 max-h-32 min-h-24 w-full resize-y rounded-md border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-300 outline-none focus:border-cyan-300/50"
                value={normalizedPostulateText}
                readOnly
                aria-label="Attached final answer"
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="min-w-0 break-words text-[11px] text-slate-400 [overflow-wrap:anywhere]">
                  {postulateStatus}
                </span>
                <button
                  type="button"
                  className="shrink-0 rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => void submitPostulate()}
                  disabled={postulateBusy}
                  data-testid={postulateTestId ? `${postulateTestId}-submit` : undefined}
                >
                  {postulateBusy ? "Sending" : "Send"}
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
