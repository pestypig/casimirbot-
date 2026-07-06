import React, { type MouseEvent } from "react";
import { AlertCircle, Bug, Copy, Loader2, Pause, Play, RotateCcw, Volume2 } from "lucide-react";
import type { ReadAloudPlaybackState } from "@/lib/helix/ask-read-aloud-display";

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
}: HelixAskTurnControlsProps) {
  const turnScopeAttributes = {
    "data-turn-control-active-turn-id": debugScope?.activeTurnId ?? undefined,
    "data-turn-control-client-turn-id": debugScope?.clientTurnId ?? undefined,
    "data-turn-control-question": debugScope?.question ?? undefined,
    "data-turn-control-final-answer": debugScope?.finalAnswer ?? undefined,
    "data-turn-control-terminal-artifact-kind": debugScope?.terminalArtifactKind ?? undefined,
    "data-turn-control-model-policy-debug-summary": debugScope?.modelPolicyDebugSummary ?? undefined,
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
    </div>
  );
}
