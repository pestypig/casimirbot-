import {
  HELIX_LIVE_CARD_LINE_STATE_SCHEMA,
  type HelixLiveCardLineEvidenceStatus,
  type HelixLiveCardLineState,
} from "@shared/helix-live-card-line-state";
import type { LiveAnswerLineState } from "@shared/helix-live-answer-environment";
import type { HelixLiveLineToolEvaluation } from "@shared/helix-live-line-tool-evaluation";
import type { HelixLiveLineToolRequest } from "@shared/helix-live-line-tool-request";
import { selectLiveCognitionToolForLine } from "./live-cognition-tool-policy";

const lower = (value: unknown): string => String(value ?? "").toLowerCase();

const uniqueStrings = (values: unknown[]): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const inferMissingEvidence = (line: Pick<LiveAnswerLineState, "key" | "label" | "value">): string[] => {
  const text = lower(`${line.key} ${line.label} ${line.value}`);
  const missing: string[] = [];
  if (/\b(?:unknown|waiting|missing|uncertain|unconfirmed|need|needs|not proven|not observed)\b/.test(text)) {
    missing.push(String(line.value));
  }
  if (/\b(?:farm|wheat|chicken|entity|place)\b/.test(text) && !/\b(?:visual|frame|screenshot|confirmed|user)\b/.test(text)) {
    missing.push("Visual/place evidence has not confirmed the current interpretation.");
  }
  if (/\b(?:threat|hostile|risk|danger)\b/.test(text) && !/\b(?:damage|hit|explosion)\b/.test(text)) {
    missing.push("No damage or escalation event is present in the compact line.");
  }
  if (/\b(?:automation|hopper|container|vertical relation)\b/.test(text)) {
    missing.push("Automation or vertical relation requires event/window or visual alignment evidence.");
  }
  return uniqueStrings(missing).slice(0, 4);
};

const evidenceStatus = (input: {
  line: Pick<LiveAnswerLineState, "value" | "evidence_refs" | "confidence">;
  evaluation?: HelixLiveLineToolEvaluation | null;
  missingEvidence: string[];
}): HelixLiveCardLineEvidenceStatus => {
  if (input.evaluation?.supports_line === "supports") return "supported";
  if (input.evaluation?.supports_line === "partial") return "partial";
  if (input.evaluation?.supports_line === "contradicts") return "contradicted";
  if (input.evaluation?.supports_line === "unknown") return "unknown";
  if ((input.line.evidence_refs ?? []).length === 0) return input.missingEvidence.length > 0 ? "unknown" : "none";
  if (typeof input.line.confidence === "number" && input.line.confidence >= 0.75) return "supported";
  return input.missingEvidence.length > 0 ? "partial" : "supported";
};

export function buildLiveCardLineStates(input: {
  lines: Array<Pick<LiveAnswerLineState, "key" | "label" | "value" | "confidence" | "evidence_refs" | "updated_at">>;
  requests?: HelixLiveLineToolRequest[];
  evaluations?: HelixLiveLineToolEvaluation[];
  now?: string;
}): HelixLiveCardLineState[] {
  const requests = input.requests ?? [];
  const evaluations = input.evaluations ?? [];
  const now = input.now ?? new Date().toISOString();
  return input.lines.map((line) => {
    const lastRequest = [...requests].reverse().find((request) => request.line_key === line.key) ?? null;
    const lastEvaluation = [...evaluations].reverse().find((evaluation) => evaluation.line_key === line.key) ?? null;
    const policyTool = selectLiveCognitionToolForLine(line);
    const missingEvidence = uniqueStrings([
      ...inferMissingEvidence(line),
      ...(lastEvaluation?.missing_evidence ?? []),
    ]);
    return {
      schema: HELIX_LIVE_CARD_LINE_STATE_SCHEMA,
      line_key: line.key,
      label: line.label,
      value: String(line.value ?? ""),
      confidence: typeof line.confidence === "number" ? line.confidence : null,
      evidence_status: evidenceStatus({ line, evaluation: lastEvaluation, missingEvidence }),
      evidence_refs: uniqueStrings(line.evidence_refs ?? []),
      missing_evidence: missingEvidence,
      next_best_tool: lastRequest?.requested_tool ?? policyTool?.tool_id ?? null,
      last_check_result: lastEvaluation?.supports_line ?? null,
      last_check_refs: lastEvaluation?.tool_receipt_refs ?? [],
      updated_at: line.updated_at ?? now,
      assistant_answer: false,
      role: "ui_projection",
    };
  });
}
