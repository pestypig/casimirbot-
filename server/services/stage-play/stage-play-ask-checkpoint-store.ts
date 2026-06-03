import crypto from "node:crypto";
import type { StagePlayAskCheckpointReceiptV1 } from "./stage-play-badge-graph-builder";

export type StoredStagePlayAskCheckpointReceiptV1 = StagePlayAskCheckpointReceiptV1 & {
  schema: "stage_play_ask_checkpoint_receipt/v1";
  receiptId: string;
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  graphId?: string | null;
  createdAt: string;
  sourceArtifactRefs: string[];
  assistant_answer: false;
  raw_content_included: false;
  context_role: "tool_evidence";
};

export type RecordStagePlayAskCheckpointReceiptInput = StagePlayAskCheckpointReceiptV1 & {
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  graphId?: string | null;
  createdAt?: string | Date | null;
  sourceArtifactRefs?: string[];
};

export type GetLatestStagePlayAskCheckpointReceiptInput = {
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  graphId?: string | null;
};

const receiptsByThread = new Map<string, StoredStagePlayAskCheckpointReceiptV1[]>();
const MAX_RECEIPTS_PER_THREAD = 40;

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const cleanString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const cleanStrings = (values: unknown[] | undefined): string[] =>
  Array.from(new Set((values ?? []).map(cleanString).filter((value): value is string => Boolean(value))));

const isoString = (value: string | Date | null | undefined): string => {
  if (value instanceof Date) return value.toISOString();
  const raw = cleanString(value);
  if (!raw) return new Date().toISOString();
  const parsed = new Date(raw);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : new Date().toISOString();
};

const scoreReceiptMatch = (
  receipt: StoredStagePlayAskCheckpointReceiptV1,
  input: GetLatestStagePlayAskCheckpointReceiptInput,
): number => {
  let score = 0;
  if (input.environmentId && receipt.environmentId === input.environmentId) score += 8;
  if (input.roomId && receipt.roomId === input.roomId) score += 4;
  if (input.graphId && receipt.graphId === input.graphId) score += 2;
  if (!input.environmentId && !input.roomId && !input.graphId) score += 1;
  return score;
};

export function recordStagePlayAskCheckpointReceipt(
  input: RecordStagePlayAskCheckpointReceiptInput,
): StoredStagePlayAskCheckpointReceiptV1 {
  const threadId = cleanString(input.threadId) ?? "helix-ask:desktop";
  const createdAt = isoString(input.createdAt);
  const receipt: StoredStagePlayAskCheckpointReceiptV1 = {
    schema: "stage_play_ask_checkpoint_receipt/v1",
    receiptId: `stage_play_ask_checkpoint_receipt:${hashShort([
      threadId,
      input.roomId ?? null,
      input.environmentId ?? null,
      input.graphId ?? null,
      input.askTurnId ?? null,
      input.solverTraceRef ?? null,
      input.terminalArtifactKind ?? null,
      input.finalAnswerSource ?? null,
      input.answerText ?? null,
      createdAt,
    ])}`,
    threadId,
    roomId: cleanString(input.roomId) ?? null,
    environmentId: cleanString(input.environmentId) ?? null,
    graphId: cleanString(input.graphId) ?? null,
    askTurnId: cleanString(input.askTurnId),
    solverTraceRef: cleanString(input.solverTraceRef),
    terminalArtifactKind: cleanString(input.terminalArtifactKind),
    finalAnswerSource: cleanString(input.finalAnswerSource),
    completedSolverPath: input.completedSolverPath === true,
    answerText: cleanString(input.answerText),
    evidenceRefs: cleanStrings(input.evidenceRefs),
    voicePolicy: input.voicePolicy
      ? {
          voiceEligible: input.voicePolicy.voiceEligible === true,
          evidenceRefs: cleanStrings(input.voicePolicy.evidenceRefs),
          reasonCodes: cleanStrings(input.voicePolicy.reasonCodes),
        }
      : null,
    sourceArtifactRefs: cleanStrings(input.sourceArtifactRefs),
    createdAt,
    assistant_answer: false,
    raw_content_included: false,
    context_role: "tool_evidence",
  };

  const existing = receiptsByThread.get(threadId) ?? [];
  const next = [
    ...existing.filter((entry) => entry.receiptId !== receipt.receiptId),
    receipt,
  ].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  receiptsByThread.set(threadId, next.slice(-MAX_RECEIPTS_PER_THREAD));
  return receipt;
}

export function getLatestStagePlayAskCheckpointReceipt(
  input: GetLatestStagePlayAskCheckpointReceiptInput,
): StoredStagePlayAskCheckpointReceiptV1 | null {
  const threadId = cleanString(input.threadId) ?? "helix-ask:desktop";
  const receipts = receiptsByThread.get(threadId) ?? [];
  if (receipts.length === 0) return null;

  const scored = receipts
    .map((receipt) => ({ receipt, score: scoreReceiptMatch(receipt, input) }))
    .filter((entry) => entry.score > 0 || (!input.environmentId && !input.roomId && !input.graphId))
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      return b.receipt.createdAt.localeCompare(a.receipt.createdAt);
    });

  return scored[0]?.receipt ?? null;
}

export function resetStagePlayAskCheckpointReceiptsForTest(): void {
  receiptsByThread.clear();
}
