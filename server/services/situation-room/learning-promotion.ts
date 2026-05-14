import crypto from "node:crypto";
import {
  HELIX_LEARNING_PROMOTION_RECORD_SCHEMA,
  type HelixLearningPromotionRecord,
} from "@shared/helix-learning-promotion";
import type { HelixPatternCandidate } from "@shared/helix-pattern-candidate";
import { getMinecraftSemanticDictionaryVersion } from "./semantic-dictionary-versioning";

const promotionRecordsByThread = new Map<string, HelixLearningPromotionRecord[]>();

const hashShort = (value: unknown, size = 14): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

export function evaluatePatternCandidatePromotion(input: {
  candidate: HelixPatternCandidate;
  observedReplayCount: number;
  requiredReplayCount?: number;
}): HelixLearningPromotionRecord {
  const requiredReplayCount = input.requiredReplayCount ?? 2;
  const ready = input.candidate.confidence >= 0.76 && input.observedReplayCount >= requiredReplayCount;
  const dictionaryVersion = getMinecraftSemanticDictionaryVersion();
  const record: HelixLearningPromotionRecord = {
    schema: HELIX_LEARNING_PROMOTION_RECORD_SCHEMA,
    promotion_id: `learning_promotion:${hashShort([
      input.candidate.candidate_id,
      input.observedReplayCount,
      dictionaryVersion.version_id,
    ])}`,
    thread_id: input.candidate.thread_id,
    candidate_id: input.candidate.candidate_id,
    decision: ready ? "ready_for_review" : "not_ready",
    reason: ready
      ? "Candidate has enough confidence and replay coverage for user review before dictionary promotion."
      : "Candidate remains evidence only until confidence and replay coverage are sufficient.",
    required_replay_count: requiredReplayCount,
    observed_replay_count: input.observedReplayCount,
    dictionary_version_id: dictionaryVersion.version_id,
    raw_logs_included: false,
    assistant_answer: false,
    model_invoked: false,
    deterministic: true,
    created_at: new Date().toISOString(),
  };
  const existing = promotionRecordsByThread.get(record.thread_id) ?? [];
  promotionRecordsByThread.set(record.thread_id, [...existing, record].slice(-200));
  return record;
}

export function listLearningPromotionRecords(threadId: string): HelixLearningPromotionRecord[] {
  return [...(promotionRecordsByThread.get(threadId) ?? [])];
}

export function clearLearningPromotionRecordsForTest(): void {
  promotionRecordsByThread.clear();
}
