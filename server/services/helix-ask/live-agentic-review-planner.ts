import crypto from "node:crypto";
import type { LiveAnswerEnvironment, LiveAnswerLineState } from "@shared/helix-live-answer-environment";
import {
  HELIX_LIVE_AGENTIC_REVIEW_REQUEST_SCHEMA,
  type LiveAgenticReviewAllowedOutput,
  type LiveAgenticReviewRequest,
  type LiveAgenticReviewTrigger,
} from "@shared/helix-agentic-review";

const compactHash = (value: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 18);

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value: string | null | undefined) => typeof value === "string" ? value.trim() : "").filter(Boolean)));

export function isLiveAgenticReviewIntent(prompt: string): boolean {
  const normalized = prompt.trim().toLowerCase();
  if (!normalized) return false;
  return (
    /\b(?:run|request|start)\s+(?:an\s+)?agentic\s+review\b/.test(normalized) ||
    /\bexplain\s+(?:the\s+)?latest\s+(?:equation|result|live\s+update)\b/.test(normalized) ||
    /\bwhy\s+did\s+(?:the\s+)?live\s+(?:card|environment)\s+update\b/.test(normalized) ||
    /\bwhat\s+did\s+(?:the\s+)?commentary\s+mean\b/.test(normalized)
  );
}

export function buildLiveAgenticReviewRequest(input: {
  environment: LiveAnswerEnvironment;
  question: string;
  trigger?: LiveAgenticReviewTrigger;
  allowed_outputs?: LiveAgenticReviewAllowedOutput[];
  now?: string;
}): LiveAgenticReviewRequest {
  const now = input.now ?? new Date().toISOString();
  const evidenceRefs = uniqueStrings([
    ...input.environment.evidence_refs,
    ...input.environment.lines.flatMap((line: LiveAnswerLineState) => line.evidence_refs ?? []),
    `live_answer_environment:${input.environment.environment_id}`,
  ]).slice(-32);
  return {
    schema: HELIX_LIVE_AGENTIC_REVIEW_REQUEST_SCHEMA,
    review_id: `live_agentic_review:${compactHash([input.environment.thread_id, input.environment.environment_id, input.question, now])}`,
    thread_id: input.environment.thread_id,
    environment_id: input.environment.environment_id,
    trigger: input.trigger ?? "user_direct",
    question: input.question.trim() || "Review the latest live environment state.",
    compact_context_pack_id: `live_environment_context:${compactHash([input.environment.environment_id, input.environment.updated_at])}`,
    allowed_outputs: input.allowed_outputs ?? ["silent_keep_in_context", "update_lines", "show_text", "request_user_input", "answer_user"],
    evidence_refs: evidenceRefs,
    created_at: now,
    context_policy: "compact_context_pack_only",
    raw_logs_included: false,
  };
}
