import crypto from "node:crypto";
import {
  HELIX_INTERPRETATION_CARD_SCHEMA,
  type HelixInterpretationCard,
} from "@shared/helix-interpretation-card";

const cardsByThread = new Map<string, HelixInterpretationCard[]>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const cleanString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const cleanStrings = (values: unknown): string[] =>
  Array.isArray(values) ? Array.from(new Set(values.map(cleanString).filter(Boolean) as string[])) : [];

export function appendInterpretationCard(input: Record<string, unknown>): HelixInterpretationCard {
  const threadId = cleanString(input.thread_id ?? input.threadId);
  const title = cleanString(input.title);
  const summary = cleanString(input.summary);
  const evidenceRefs = cleanStrings(input.evidence_refs ?? input.evidenceRefs);
  const expiresAt = cleanString(input.expires_at ?? input.expiresAt);
  if (!threadId) throw new Error("interpretation_card_requires_thread_id");
  if (!title || !summary) throw new Error("interpretation_card_requires_title_summary");
  if (evidenceRefs.length === 0) throw new Error("interpretation_card_requires_evidence_refs");
  if (!expiresAt || Number.isNaN(Date.parse(expiresAt))) throw new Error("interpretation_card_requires_expiry");
  const now = cleanString(input.created_at ?? input.createdAt) ?? new Date().toISOString();
  const card: HelixInterpretationCard = {
    schema: HELIX_INTERPRETATION_CARD_SCHEMA,
    interpretation_id: cleanString(input.interpretation_id ?? input.interpretationId) ?? `interpretation_card:${hashShort([threadId, title, summary, now])}`,
    thread_id: threadId,
    room_id: cleanString(input.room_id ?? input.roomId),
    title,
    summary,
    evidence_refs: evidenceRefs,
    confidence: typeof input.confidence === "number" ? Math.max(0, Math.min(1, input.confidence)) : 0.5,
    expires_at: expiresAt,
    model_invoked: input.model_invoked === true,
    assistant_answer: false,
    raw_content_included: false,
    context_policy: "compact_context_pack_only",
    created_at: now,
  };
  cardsByThread.set(threadId, [...(cardsByThread.get(threadId) ?? []), card].slice(-300));
  return card;
}

export function listInterpretationCards(input: {
  threadId: string;
  roomId?: string | null;
  limit?: number;
}): HelixInterpretationCard[] {
  const limit = Number.isFinite(input.limit) ? Math.max(0, Math.min(200, Math.trunc(input.limit ?? 80))) : 80;
  return [...(cardsByThread.get(input.threadId) ?? [])]
    .filter((card) => !input.roomId || card.room_id === input.roomId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .slice(-limit);
}

export function resetInterpretationCardsForTest(): void {
  cardsByThread.clear();
}
