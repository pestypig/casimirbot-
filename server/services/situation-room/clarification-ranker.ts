import crypto from "node:crypto";
import {
  HELIX_CLARIFICATION_RANKING_SCHEMA,
  type HelixClarificationExpectedEffect,
  type HelixClarificationRanking,
} from "@shared/helix-clarification-ranking";
import type { HelixClarificationNeed } from "@shared/helix-clarification-dialogue";
import { hasRecentSimilarClarificationQuestion } from "./clarification-question-store";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

export const clarificationQuestionForNeed = (need: HelixClarificationNeed): string => {
  const missing = need.missing_evidence[0] ?? "the intended use";
  if (need.trigger === "user_goal_unknown") return "What are you trying to accomplish in this situation right now?";
  if (/lava|fluid|light/i.test(missing)) return "Is the side channel meant for lava lighting, drainage, or something else?";
  if (/egg|hopper|chest|container|breeding|feed|farm|animal/i.test(missing)) {
    return "Is this animal cluster intended as a farm, temporary storage, or something else?";
  }
  return `Can you clarify this hypothesis? Missing evidence: ${missing}`;
};

const expectedEffectForNeed = (need: HelixClarificationNeed): HelixClarificationExpectedEffect => {
  if (need.trigger === "user_goal_unknown") return "confirm_intent";
  if (need.trigger === "conflicting_evidence") return "lower_confidence";
  if (need.trigger === "missing_evidence") return "resolve_missing_evidence";
  if (need.trigger === "ambiguous_hypothesis" || need.trigger === "new_pattern_candidate") return "disambiguate_use";
  return "raise_confidence";
};

const answerOptionsForNeed = (need: HelixClarificationNeed): string[] => {
  const question = clarificationQuestionForNeed(need);
  if (/animal cluster/i.test(question)) return ["Farm", "Temporary", "Not sure"];
  if (/side channel/i.test(question)) return ["Lava lighting", "Drainage", "Something else"];
  if (need.trigger === "user_goal_unknown") return ["Set goal", "Just exploring", "Not sure"];
  return ["Yes", "No", "Not sure"];
};

export function rankClarificationNeed(input: {
  need: HelixClarificationNeed;
  roomId?: string | null;
  now?: string;
  userBusy?: boolean;
  policyEnabled?: boolean;
}): HelixClarificationRanking {
  const now = input.now ?? new Date().toISOString();
  const question = clarificationQuestionForNeed(input.need);
  let score = 0;
  const reasons: string[] = [];
  if (input.need.importance === "high") {
    score += 0.38;
    reasons.push("high importance");
  } else if (input.need.importance === "medium") {
    score += 0.25;
    reasons.push("medium importance");
  } else {
    score += 0.08;
    reasons.push("low importance");
  }
  if (input.need.missing_evidence.length > 0) {
    score += Math.min(0.22, input.need.missing_evidence.length * 0.05);
    reasons.push("clear missing evidence");
  }
  if (input.need.hypothesis_ids.length > 0) {
    score += 0.16;
    reasons.push("targets a hypothesis");
  }
  if (input.need.evidence_ids.length > 0) {
    score += 0.12;
    reasons.push("grounded in evidence");
  }
  if (input.need.trigger === "low_confidence_high_impact") {
    score += 0.18;
    reasons.push("high impact ambiguity");
  }
  if (input.need.trigger === "user_goal_unknown") {
    score += 0.14;
    reasons.push("sets current objective");
  }
  let suppressReason: HelixClarificationRanking["suppress_reason"] = null;
  if (input.policyEnabled === false) {
    suppressReason = "policy_disabled";
  } else if (input.userBusy) {
    suppressReason = "user_busy";
  } else if (hasRecentSimilarClarificationQuestion({
    threadId: input.need.thread_id,
    question,
    now,
  })) {
    suppressReason = "cooldown";
  } else if (score < 0.35) {
    suppressReason = "low_value";
  }

  return {
    schema: HELIX_CLARIFICATION_RANKING_SCHEMA,
    question_id: `clarification_question:${hashShort([input.need.need_id, question])}`,
    thread_id: input.need.thread_id,
    room_id: input.roomId ?? null,
    source_family: input.need.source_family,
    hypothesis_id: input.need.hypothesis_ids[0] ?? null,
    evidence_refs: input.need.evidence_ids,
    candidate_question: question,
    answer_options: answerOptionsForNeed(input.need),
    score: Math.max(0, Math.min(1, Number(score.toFixed(3)))),
    reason: reasons.join("; "),
    suppress_reason: suppressReason,
    expected_effect: expectedEffectForNeed(input.need),
    created_at: now,
  };
}

export function rankClarificationNeeds(input: {
  needs: HelixClarificationNeed[];
  roomId?: string | null;
  now?: string;
  userBusy?: boolean;
  policyEnabled?: boolean;
}): HelixClarificationRanking[] {
  return input.needs
    .map((need) => rankClarificationNeed({
      need,
      roomId: input.roomId ?? null,
      now: input.now,
      userBusy: input.userBusy,
      policyEnabled: input.policyEnabled,
    }))
    .sort((a, b) => {
      const aSuppressed = a.suppress_reason ? 1 : 0;
      const bSuppressed = b.suppress_reason ? 1 : 0;
      return aSuppressed - bSuppressed || b.score - a.score || b.created_at.localeCompare(a.created_at);
    });
}
