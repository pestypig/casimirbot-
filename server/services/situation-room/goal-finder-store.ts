import crypto from "node:crypto";
import {
  HELIX_GOAL_CARD_SCHEMA,
  type HelixGoalCard,
  type HelixGoalCardType,
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
  value === "active" ||
  value === "blocked" ||
  value === "completed" ||
  value === "expired" ||
  value === "resolved" ||
  value === "rejected"
    ? value
    : "candidate";

const normalizeGoalType = (value: unknown): HelixGoalCardType => {
  if (
    value === "identify_current_activity" ||
    value === "track_risk" ||
    value === "resolve_missing_visual_evidence" ||
    value === "resolve_missing_world_events" ||
    value === "monitor_user_direct_address" ||
    value === "verify_equation_or_calculation" ||
    value === "compare_live_transcript_to_reference" ||
    value === "preserve_context_in_notes" ||
    value === "update_place_memory"
  ) return value;
  return "custom";
};

export function appendGoalCard(input: Record<string, unknown>): HelixGoalCard {
  const threadId = cleanString(input.thread_id ?? input.threadId);
  const candidateGoal = cleanString(input.candidate_goal ?? input.candidateGoal ?? input.goal);
  const rationale = cleanString(input.rationale);
  const evidenceRefs = cleanStrings(input.evidence_refs ?? input.evidenceRefs);
  const nextEvidenceNeeded = cleanStrings(input.next_evidence_needed ?? input.nextEvidenceNeeded);
  const expiresAt = cleanString(input.expires_at ?? input.expiresAt);
  if (!threadId) throw new Error("goal_card_requires_thread_id");
  if (!candidateGoal || !rationale) throw new Error("goal_card_requires_candidate_goal");
  if (nextEvidenceNeeded.length === 0) throw new Error("goal_card_requires_next_evidence_needed");
  if (!expiresAt || Number.isNaN(Date.parse(expiresAt))) throw new Error("goal_card_requires_expiry");
  if (
    input.may_execute_tool === true ||
    cleanString(input.action_id ?? input.actionId) ||
    cleanString(input.tool_id ?? input.toolId)
  ) {
    throw new Error("goal_card_cannot_execute_tools");
  }
  if (evidenceRefs.length === 0) throw new Error("goal_card_requires_evidence_refs");
  const expiresAfterMs = typeof input.expires_after_ms === "number"
    ? Math.max(1, Math.trunc(input.expires_after_ms))
    : typeof input.expiresAfterMs === "number"
      ? Math.max(1, Math.trunc(input.expiresAfterMs))
      : null;
  const now = cleanString(input.created_at ?? input.createdAt) ?? new Date().toISOString();
  const card: HelixGoalCard = {
    schema: HELIX_GOAL_CARD_SCHEMA,
    goal_id: cleanString(input.goal_id ?? input.goalId) ?? `goal_card:${hashShort([threadId, candidateGoal, now])}`,
    thread_id: threadId,
    room_id: cleanString(input.room_id ?? input.roomId),
    goal_type: normalizeGoalType(input.goal_type ?? input.goalType),
    candidate_goal: candidateGoal,
    rationale,
    evidence_refs: evidenceRefs,
    next_evidence_needed: nextEvidenceNeeded,
    blocked_by: cleanStrings(input.blocked_by ?? input.blockedBy),
    status: normalizeStatus(input.status),
    priority: typeof input.priority === "number" ? Math.max(0, Math.min(1, input.priority)) : 0.5,
    confidence: typeof input.confidence === "number" ? Math.max(0, Math.min(1, input.confidence)) : 0.5,
    may_request_helix_ask: input.may_request_helix_ask !== false,
    may_execute_tool: false,
    expires_after_ms: expiresAfterMs,
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
