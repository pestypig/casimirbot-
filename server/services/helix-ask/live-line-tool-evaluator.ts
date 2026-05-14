import crypto from "node:crypto";
import {
  HELIX_LIVE_LINE_TOOL_EVALUATION_SCHEMA,
  type HelixLiveLineToolEvaluation,
  type HelixLiveLineToolEvaluationSupport,
} from "@shared/helix-live-line-tool-evaluation";
import type { HelixLiveLineToolRequest } from "@shared/helix-live-line-tool-request";
import { recordLiveLineToolEvaluation } from "../situation-room/live-line-tool-request-store";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const supportFromReceipts = (receipts: unknown[]): HelixLiveLineToolEvaluationSupport => {
  if (receipts.length === 0) return "unknown";
  const text = receipts.map((receipt) => JSON.stringify(receipt).toLowerCase()).join("\n");
  if (/\b(?:contradict|failed|not_found|not observed|missing)\b/.test(text)) return "partial";
  if (/\b(?:ok|supports|confirmed|observed|receipt|found|result)\b/.test(text)) return "supports";
  return "partial";
};

const confidenceDeltaForSupport = (support: HelixLiveLineToolEvaluationSupport): number => {
  if (support === "supports") return 0.12;
  if (support === "partial") return 0.04;
  if (support === "contradicts") return -0.16;
  return 0;
};

export function evaluateLiveLineToolRequest(input: {
  request: HelixLiveLineToolRequest;
  tool_receipt_refs?: string[];
  receipts?: unknown[];
  supports_line?: HelixLiveLineToolEvaluationSupport;
  next_line_value?: string | null;
  missing_evidence?: string[];
  summary?: string | null;
  deterministic?: boolean;
  model_invoked?: boolean;
  now?: string;
  autoRecord?: boolean;
}): HelixLiveLineToolEvaluation {
  const receiptRefs = Array.from(new Set(input.tool_receipt_refs ?? []));
  const support = input.supports_line ?? supportFromReceipts(input.receipts ?? []);
  const now = input.now ?? new Date().toISOString();
  const evaluation: HelixLiveLineToolEvaluation = {
    schema: HELIX_LIVE_LINE_TOOL_EVALUATION_SCHEMA,
    evaluation_id: `live_line_tool_evaluation:${hashShort([
      input.request.request_id,
      receiptRefs,
      support,
      input.next_line_value ?? null,
    ])}`,
    request_id: input.request.request_id,
    thread_id: input.request.thread_id,
    line_key: input.request.line_key,
    tool_receipt_refs: receiptRefs,
    supports_line: support,
    confidence_delta: receiptRefs.length > 0 || (input.receipts?.length ?? 0) > 0
      ? confidenceDeltaForSupport(support)
      : 0,
    next_line_value: input.next_line_value ?? null,
    missing_evidence: input.missing_evidence ?? [],
    summary: input.summary?.trim() || (
      receiptRefs.length > 0 || (input.receipts?.length ?? 0) > 0
        ? `${input.request.requested_tool} returned ${support} evidence for ${input.request.line_label}.`
        : `${input.request.requested_tool} has no receipt yet; confidence is unchanged.`
    ),
    deterministic: input.deterministic ?? true,
    model_invoked: input.model_invoked ?? false,
    deterministic_content_role: "evidence_not_assistant_answer",
    raw_content_included: false,
    assistant_answer: false,
    created_at: now,
  };
  return input.autoRecord === false ? evaluation : recordLiveLineToolEvaluation(evaluation);
}
