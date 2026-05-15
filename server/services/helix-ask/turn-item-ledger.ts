import crypto from "node:crypto";
import {
  HELIX_TURN_ITEM_LEDGER_SCHEMA,
  HELIX_TURN_ITEM_SCHEMA,
  type HelixTurnItem,
  type HelixTurnItemKind,
  type HelixTurnItemLedger,
} from "@shared/helix-turn-item-ledger";

const normalize = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const readString = (record: Record<string, unknown>, key: string): string | null => {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
};

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

export function inferTerminalTurnItemKind(input: {
  finalAnswerSource: string;
  terminalArtifactKind: string;
}): HelixTurnItemKind {
  const source = normalize(input.finalAnswerSource);
  const artifact = normalize(input.terminalArtifactKind);
  if (/request_user_input|pending_server_request/i.test(source) || /request_user_input|pending_server_request/i.test(artifact)) {
    return "request_user_input";
  }
  if (/typed_failure|failure|error/i.test(source) || /typed_failure|failure|error/i.test(artifact)) {
    return "failure";
  }
  return "assistant_answer";
}

export function buildTerminalTurnItem(input: {
  threadId: string;
  turnId: string;
  finalAnswerSource: string;
  terminalArtifactKind: string;
  terminalText: string;
  route: string;
  createdAt?: string;
}): HelixTurnItem {
  const kind = inferTerminalTurnItemKind(input);
  const itemId = `turn_item:${input.turnId}:terminal:${kind}:${hashShort([
    input.finalAnswerSource,
    input.terminalArtifactKind,
    input.terminalText,
    input.route,
  ], 12)}`;
  return {
    schema: HELIX_TURN_ITEM_SCHEMA,
    item_id: itemId,
    thread_id: input.threadId,
    turn_id: input.turnId,
    kind,
    phase: kind === "failure" ? "failed" : "completed",
    summary:
      kind === "assistant_answer"
        ? `Terminal assistant answer from ${input.finalAnswerSource}.`
        : kind === "request_user_input"
          ? "Terminal request for user input."
          : `Terminal failure from ${input.finalAnswerSource}.`,
    text: input.terminalText,
    evidence_refs: [],
    related_ids: [],
    assistant_answer: kind === "assistant_answer",
    raw_content_included: false,
    created_at: input.createdAt ?? new Date().toISOString(),
  };
}

export function mergeTurnItemLedger(input: {
  existing?: unknown;
  threadId: string;
  turnId: string;
  terminalItem: HelixTurnItem;
}): HelixTurnItemLedger {
  const existingRecord =
    input.existing && typeof input.existing === "object" && !Array.isArray(input.existing)
      ? (input.existing as Record<string, unknown>)
      : null;
  const existingItems = Array.isArray(existingRecord?.items)
    ? existingRecord.items.filter((item): item is HelixTurnItem => {
        const record = item && typeof item === "object" ? (item as Record<string, unknown>) : null;
        return record?.schema === HELIX_TURN_ITEM_SCHEMA && typeof record.item_id === "string";
      })
    : [];
  const itemsById = new Map<string, HelixTurnItem>();
  for (const item of existingItems) itemsById.set(item.item_id, item);
  itemsById.set(input.terminalItem.item_id, input.terminalItem);
  const items = Array.from(itemsById.values());
  const assistantAnswerItemCount = items.filter((item) => item.kind === "assistant_answer" && item.assistant_answer === true).length;
  const requestUserInputItemCount = items.filter((item) => item.kind === "request_user_input").length;

  return {
    schema: HELIX_TURN_ITEM_LEDGER_SCHEMA,
    thread_id: readString(existingRecord ?? {}, "thread_id") ?? input.threadId,
    turn_id: readString(existingRecord ?? {}, "turn_id") ?? input.turnId,
    items,
    terminal_item_id: input.terminalItem.item_id,
    assistant_answer_item_count: assistantAnswerItemCount,
    request_user_input_item_count: requestUserInputItemCount,
    worker_output_promoted_to_answer_count: 0,
    raw_content_included: false,
    assistant_answer: false,
  };
}
