import crypto from "node:crypto";
import {
  HELIX_PATTERN_CONFIRMATION_SCHEMA,
  type HelixPatternConfirmation,
} from "@shared/helix-pattern-confirmation";
import type { HelixSteeringMemory } from "@shared/helix-steering-memory";

const confirmationsByThread = new Map<string, HelixPatternConfirmation[]>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

export function evaluatePatternConfirmation(input: {
  threadId: string;
  memory: HelixSteeringMemory;
  now?: string;
}): HelixPatternConfirmation {
  const patternId = input.memory.target_hypothesis_ids[0] ?? `steering:${input.memory.steering_id}`;
  const status = input.memory.confidence_effect === "contradict"
    ? "rejected_by_user"
    : input.memory.confidence_effect === "confirm"
      ? "confirmed_by_user"
      : "candidate";
  const confirmation: HelixPatternConfirmation = {
    schema: HELIX_PATTERN_CONFIRMATION_SCHEMA,
    confirmation_id: `pattern_confirmation:${hashShort([input.threadId, patternId, input.memory.steering_id])}`,
    thread_id: input.threadId,
    pattern_id: patternId,
    status,
    steering_memory_ids: [input.memory.steering_id],
    evidence_refs: input.memory.evidence_refs,
    promotion_allowed: false,
    reason: status === "confirmed_by_user"
      ? "User steering confirms intent, but replay coverage is still required before promotion."
      : status === "rejected_by_user"
        ? "User steering contradicted the candidate."
        : "User steering clarified the candidate; promotion requires review.",
    assistant_answer: false,
    raw_logs_included: false,
    created_at: input.now ?? input.memory.created_at,
  };
  const existing = confirmationsByThread.get(input.threadId) ?? [];
  const withoutDuplicate = existing.filter((entry) => entry.confirmation_id !== confirmation.confirmation_id);
  confirmationsByThread.set(input.threadId, [...withoutDuplicate, confirmation].slice(-200));
  return confirmation;
}

export function listPatternConfirmations(threadId: string): HelixPatternConfirmation[] {
  return [...(confirmationsByThread.get(threadId) ?? [])];
}

export function clearPatternConfirmationsForTest(): void {
  confirmationsByThread.clear();
}
