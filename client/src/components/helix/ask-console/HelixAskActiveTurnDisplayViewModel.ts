import type { HelixContinuousTurnStreamRow } from "@/lib/helix/ask-active-turn-stream";

export const HELIX_ASK_ACTIVE_TURN_QUIET_GAP_MS = 2000;
export const HELIX_ASK_ACTIVE_TURN_QUIET_GAP_TICK_MS = 500;

export type HelixAskActiveTurnDisplayViewModel = {
  visibleRows: HelixContinuousTurnStreamRow[];
  statusLine: string | null;
  quietGapVisible: boolean;
  msSinceLastTranscriptEvent: number | null;
  scrollToken: string;
};

export function buildHelixAskActiveTurnDisplayViewModel(input: {
  askBusy: boolean;
  rows: HelixContinuousTurnStreamRow[];
  replyId: string;
  lastTranscriptEventAppliedAtMs: number | null;
  nowMs: number;
  quietGapThresholdMs?: number;
}): HelixAskActiveTurnDisplayViewModel {
  const quietGapThresholdMs = Math.max(0, Math.floor(
    input.quietGapThresholdMs ?? HELIX_ASK_ACTIVE_TURN_QUIET_GAP_MS,
  ));
  const msSinceLastTranscriptEvent =
    input.askBusy && typeof input.lastTranscriptEventAppliedAtMs === "number"
      ? Math.max(0, Math.floor(input.nowMs - input.lastTranscriptEventAppliedAtMs))
      : null;
  const quietGapVisible =
    input.askBusy &&
    input.rows.length > 0 &&
    msSinceLastTranscriptEvent !== null &&
    msSinceLastTranscriptEvent >= quietGapThresholdMs;
  const statusLine =
    quietGapVisible && msSinceLastTranscriptEvent !== null
      ? `Provider running; no new transcript event for ${Math.floor(msSinceLastTranscriptEvent / 1000)}s.`
      : null;
  const tail = input.rows.length ? input.rows[input.rows.length - 1] : null;
  const scrollToken = tail
    ? `${input.rows.length}:${tail.key}:${tail.text}:${tail.status}:${statusLine ?? ""}`
    : `${input.rows.length}:idle:${statusLine ?? ""}`;
  return {
    visibleRows: input.rows,
    statusLine,
    quietGapVisible,
    msSinceLastTranscriptEvent,
    scrollToken,
  };
}
