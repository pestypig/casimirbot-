import crypto from "node:crypto";
import {
  HELIX_GOAL_CARD_SCHEMA,
  type HelixGoalCard,
  type HelixGoalCardStatus,
} from "@shared/helix-goal-card";

const goalsByThread = new Map<string, HelixGoalCard[]>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const cleanString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const cleanStrings = (values: unknown): string[] =>
  Array.isArray(values) ? Array.from(new Set(values.map(cleanString).filter(Boolean) as string[])) : [];

const normalizeStatus = (value: unknown): HelixGoalCardStatus =>
  value === "active" || value === "expired" || value === "resolved" || value === "rejected" ? value : "candidate";

export function appendGoalCard(input: Record<string, unknown>): HelixGoalCard {
  const threadId = cleanString(input.thread_id ?? input.threadId);
  const candidateGoal = cleanString(input.candidate_goal ?? input.candidateGoal ?? input.goal);
  const rationale = cleanString(input.rationale);
  const nextEvidenceNeeded = cleanStrings(input.next_evidence_needed ?? input.nextEvidenceNeeded);
  const expiresAt = cleanString(input.expires_at ?? input.expiresAt);
  if (!threadId) throw new Error("goal_card_requires_thread_id");
  if (!candidateGoal || !rationale) throw new Error("goal_card_requires_candidate_goal");
  if (nextEvidenceNeeded.length === 0) throw new Error("goal_card_requires_next_evidence_needed");
  if (!expiresAt || Number.isNaN(Date.parse(expiresAt))) throw new Error("goal_card_requires_expiry");
  if (cleanString(input.action_id ?? input.actionId) || cleanString(input.tool_id ?? input.toolId)) {
    throw new Error("goal_card_cannot_execute_tools");
  }
  const now = cleanString(input.created_at ?? input.createdAt) ?? new Date().toISOString();
  const card: HelixGoalCard = {
    schema: HELIX_GOAL_CARD_SCHEMA,
    goal_id: cleanString(input.goal_id ?? input.goalId) ?? `goal_card:${hashShort([threadId, candidateGoal, now])}`,
    thread_id: threadId,
    room_id: cleanString(input.room_id ?? input.roomId),
    candidate_goal: candidateGoal,
    rationale,
    evidence_refs: cleanStrings(input.evidence_refs ?? input.evidenceRefs),
    next_evidence_needed: nextEvidenceNeeded,
    status: normalizeStatus(input.status),
    confidence: typeof input.confidence === "number" ? Math.max(0, Math.min(1, input.confidence)) : 0.5,
    expires_at: expiresAt,
    assistant_answer: false,
    raw_content_included: false,
    context_policy: "compact_context_pack_only",
    created_at: now,
  };
  goalsByThread.set(threadId, [...(goalsByThread.get(threadId) ?? []), card].slice(-300));
  return card;
}

export function listGoalCards(input: {
  threadId: string;
  roomId?: string | null;
  limit?: number;
}): HelixGoalCard[] {
  const limit = Number.isFinite(input.limit) ? Math.max(0, Math.min(200, Math.trunc(input.limit ?? 80))) : 80;
  return [...(goalsByThread.get(input.threadId) ?? [])]
    .filter((card) => !input.roomId || card.room_id === input.roomId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .slice(-limit);
}

export function resetGoalCardsForTest(): void {
  goalsByThread.clear();
}
