import crypto from "node:crypto";
import {
  HELIX_ASK_HANDOFF_SCHEMA,
  type HelixAskHandoff,
  type HelixAskHandoffReasoningBudget,
} from "@shared/helix-ask-handoff";

const handoffsByThread = new Map<string, HelixAskHandoff[]>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const cleanString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const cleanStrings = (values: unknown): string[] =>
  Array.isArray(values) ? Array.from(new Set(values.map(cleanString).filter(Boolean) as string[])) : [];

const budget = (value: unknown): HelixAskHandoffReasoningBudget =>
  value === "deep" || value === "normal" ? value : "cheap";

export function createAskHandoff(input: Record<string, unknown>): HelixAskHandoff {
  const threadId = cleanString(input.thread_id ?? input.threadId);
  const objective = cleanString(input.objective);
  if (!threadId) throw new Error("ask_handoff_requires_thread_id");
  if (!objective) throw new Error("ask_handoff_requires_objective");
  if (input.raw_content_included === true && input.raw_context_approved !== true) {
    throw new Error("ask_handoff_raw_context_not_approved");
  }
  const now = cleanString(input.created_at ?? input.createdAt) ?? new Date().toISOString();
  const handoff: HelixAskHandoff = {
    schema: HELIX_ASK_HANDOFF_SCHEMA,
    handoff_id: cleanString(input.handoff_id ?? input.handoffId) ?? `ask_handoff:${hashShort([threadId, objective, now])}`,
    thread_id: threadId,
    room_id: cleanString(input.room_id ?? input.roomId),
    objective,
    selected_evidence_refs: cleanStrings(input.selected_evidence_refs ?? input.selectedEvidenceRefs),
    goal_refs: cleanStrings(input.goal_refs ?? input.goalRefs),
    interpretation_refs: cleanStrings(input.interpretation_refs ?? input.interpretationRefs),
    reasoning_budget: budget(input.reasoning_budget ?? input.reasoningBudget),
    raw_context_approved: input.raw_context_approved === true,
    assistant_answer: false,
    raw_content_included: false,
    context_policy: "compact_context_pack_only",
    created_at: now,
  };
  handoffsByThread.set(threadId, [...(handoffsByThread.get(threadId) ?? []), handoff].slice(-200));
  return handoff;
}

export function listAskHandoffs(input: {
  threadId: string;
  roomId?: string | null;
  limit?: number;
}): HelixAskHandoff[] {
  const limit = Number.isFinite(input.limit) ? Math.max(0, Math.min(200, Math.trunc(input.limit ?? 80))) : 80;
  return [...(handoffsByThread.get(input.threadId) ?? [])]
    .filter((handoff) => !input.roomId || handoff.room_id === input.roomId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .slice(-limit);
}

export function resetAskHandoffsForTest(): void {
  handoffsByThread.clear();
}
