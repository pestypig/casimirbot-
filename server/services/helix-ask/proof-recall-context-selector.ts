import {
  HELIX_PROOF_RECALL_QUERY_SCHEMA,
  type HelixProofRecallContext,
  type HelixProofRecallQuery,
} from "@shared/helix-proof-recall-query";
import type { HelixWorkstationReasoningTrace } from "@shared/helix-workstation-reasoning-trace";
import {
  getLatestWorkstationReasoningTrace,
  getWorkstationReasoningTrace,
} from "./workstation-reasoning-trace-store";

export function looksLikeProofRecallQuestion(question: string): boolean {
  return /\b(?:why did you|how did you|what evidence|what tool|show (?:the )?proof|proof|how did .*find|how did .*add|why .*total)\b/i.test(
    question,
  );
}

export function selectProofRecallContext(input: {
  threadId: string;
  turnId?: string | null;
  question: string;
  targetAnswerRef?: string | null;
  targetTraceId?: string | null;
}): HelixProofRecallContext | null {
  const query: HelixProofRecallQuery = {
    schema: HELIX_PROOF_RECALL_QUERY_SCHEMA,
    thread_id: input.threadId,
    turn_id: input.turnId ?? null,
    question: input.question,
    target_answer_ref: input.targetAnswerRef ?? null,
    target_trace_id: input.targetTraceId ?? null,
    include_raw_debug: false,
  };
  const trace: HelixWorkstationReasoningTrace | null = input.targetTraceId
    ? getWorkstationReasoningTrace(input.targetTraceId)
    : getLatestWorkstationReasoningTrace({ threadId: input.threadId, turnId: input.turnId });
  if (!trace) return null;
  const steps = trace.compact_steps
    .map((step, index) => `${index + 1}. ${step.label}: ${step.summary}`)
    .join(" ");
  const caveatText = trace.caveats.length ? ` Caveats: ${trace.caveats.join(" ")}` : "";
  const compactAnswer = `I used the stored workstation reasoning trace ${trace.trace_id}. ${steps}${caveatText} Terminal authority hash: ${trace.artifacts.terminal_authority_hash ?? "unavailable"}.`;
  return {
    schema: "helix.proof_recall_context.v1",
    thread_id: input.threadId,
    query,
    selected_trace_id: trace.trace_id,
    compact_answer: compactAnswer,
    evidence_refs: trace.evidence_refs,
    tool_receipt_ids: trace.tool_receipt_ids,
    terminal_authority_hash: trace.artifacts.terminal_authority_hash ?? null,
    assistant_answer: false,
    raw_content_included: false,
    context_policy: "compact_context_pack_only",
    created_at: new Date().toISOString(),
  };
}
