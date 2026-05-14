import crypto from "node:crypto";
import {
  HELIX_AGENTIC_REQUEST_INPUT_SCHEMA,
  type HelixAgenticRequestInput,
} from "@shared/helix-agentic-request-input";
import type { HelixClarificationRanking } from "@shared/helix-clarification-ranking";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

export function buildAgenticRequestInputFromClarification(input: {
  ranking: HelixClarificationRanking;
}): HelixAgenticRequestInput {
  return {
    schema: HELIX_AGENTIC_REQUEST_INPUT_SCHEMA,
    request_id: `agentic_request_input:${hashShort([input.ranking.question_id, input.ranking.created_at])}`,
    thread_id: input.ranking.thread_id,
    room_id: input.ranking.room_id ?? null,
    question: input.ranking.candidate_question,
    answer_options: input.ranking.answer_options ?? ["Yes", "No", "Not sure"],
    why_it_matters: input.ranking.reason || "The answer would update the live situation model.",
    evidence_refs: input.ranking.evidence_refs,
    expected_effect: input.ranking.expected_effect,
    source: "clarification_dialogue",
    assistant_answer: false,
    raw_content_included: false,
    created_at: input.ranking.created_at,
  };
}
