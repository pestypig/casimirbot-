import crypto from "node:crypto";
import {
  HELIX_USER_STEERING_EVENT_SCHEMA,
  type HelixUserSteeringEffect,
  type HelixUserSteeringEvent,
} from "@shared/helix-user-steering-event";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

export function inferUserSteeringEffect(prompt: string): HelixUserSteeringEffect {
  const lower = prompt.toLowerCase();
  if (/\b(actually|correction|correct|not\b|instead)\b/.test(lower)) return "correct_hypothesis";
  if (/\b(quiet|speak|voice|callout|tell me when)\b/.test(lower)) return "change_delivery_policy";
  if (/^\s*(?:can|could|please)?\s*(?:you\s+)?(?:watch|look for)\b/i.test(prompt)) return "set_missing_evidence_target";
  if (/^\s*(?:what|why|how|is|are|am|do|does|did|can|could|should|would|where|when|who)\b/i.test(prompt) || /\?\s*$/.test(prompt)) {
    return "raise_relevance";
  }
  if (/\b(i am|i'm|im|objective|goal|trying to|building|making)\b/.test(lower)) return "set_objective";
  if (/\b(watch|look for|missing evidence|next check)\b/.test(lower)) return "set_missing_evidence_target";
  if (/\b(review|think through|analyze)\b/.test(lower)) return "request_review";
  return "raise_relevance";
}

export function buildUserSteeringEvent(input: {
  threadId: string;
  roomId?: string | null;
  prompt: string;
  targetIds?: string[];
  evidenceRefs?: string[];
  now?: string;
}): HelixUserSteeringEvent {
  const now = input.now ?? new Date().toISOString();
  const prompt = input.prompt.trim();
  return {
    schema: HELIX_USER_STEERING_EVENT_SCHEMA,
    steering_id: `user_steering:${hashShort([input.threadId, input.roomId ?? null, prompt, now])}`,
    thread_id: input.threadId,
    room_id: input.roomId ?? null,
    prompt,
    interpreted_claim: prompt,
    effect: inferUserSteeringEffect(prompt),
    target_ids: Array.from(new Set(input.targetIds ?? [])),
    evidence_refs: Array.from(new Set(input.evidenceRefs ?? [])),
    created_at: now,
    assistant_answer: false,
  };
}
