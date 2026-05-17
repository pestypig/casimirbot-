import crypto from "node:crypto";
import {
  HELIX_ASK_HANDOFF_SCHEMA,
  type HelixAskHandoff,
  type HelixAskHandoffType,
  type HelixAskHandoffReasoningBudget,
} from "@shared/helix-ask-handoff";

const handoffsByThread = new Map<string, HelixAskHandoff[]>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const cleanString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const cleanStrings = (values: unknown): string[] =>
  Array.isArray(values) ? Array.from(new Set(values.map(cleanString).filter(Boolean) as string[])) : [];

const budget = (value: unknown): HelixAskHandoffReasoningBudget =>
  value === "deep" || value === "normal" ? value : "cheap";

const handoffType = (value: unknown): HelixAskHandoffType =>
  value === "workstation_action_request" ? value : "helix_ask_reasoning";

const DEFAULT_FORBIDDEN_ACTIONS = [
  "execute_workstation_action",
  "modify_observation_journal",
  "invent_unobserved_objectives",
  "emit_user_answer_without_terminal_policy",
];

export function createAskHandoff(input: Record<string, unknown>): HelixAskHandoff {
  const threadId = cleanString(input.thread_id ?? input.threadId);
  const objective = cleanString(input.objective);
  if (!threadId) throw new Error("ask_handoff_requires_thread_id");
  if (!objective) throw new Error("ask_handoff_requires_objective");
  if (input.raw_content_included === true && input.raw_context_approved !== true) {
    throw new Error("ask_handoff_raw_context_not_approved");
  }
  const now = cleanString(input.created_at ?? input.createdAt) ?? new Date().toISOString();
  const selectedEvidenceRefs = cleanStrings(input.selected_evidence_refs ?? input.selectedEvidenceRefs);
  const goalRefs = cleanStrings(input.goal_refs ?? input.goalRefs);
  const interpretationRefs = cleanStrings(input.interpretation_refs ?? input.interpretationRefs);
  const rawAllowedInputs = input.allowed_inputs && typeof input.allowed_inputs === "object" && !Array.isArray(input.allowed_inputs)
    ? input.allowed_inputs as Record<string, unknown>
    : {};
  const allowedObservationRefs = cleanStrings(rawAllowedInputs.observation_refs ?? rawAllowedInputs.observationRefs);
  const handoff: HelixAskHandoff = {
    schema: HELIX_ASK_HANDOFF_SCHEMA,
    handoff_id: cleanString(input.handoff_id ?? input.handoffId) ?? `ask_handoff:${hashShort([threadId, objective, now])}`,
    thread_id: threadId,
    room_id: cleanString(input.room_id ?? input.roomId),
    handoff_type: handoffType(input.handoff_type ?? input.handoffType),
    question: cleanString(input.question) ?? objective,
    objective,
    selected_evidence_refs: selectedEvidenceRefs,
    goal_refs: goalRefs,
    interpretation_refs: interpretationRefs,
    allowed_inputs: {
      observation_refs: allowedObservationRefs,
      interpretation_refs: interpretationRefs,
      goal_refs: goalRefs,
    },
    forbidden_actions: Array.from(new Set([
      ...DEFAULT_FORBIDDEN_ACTIONS,
      ...cleanStrings(input.forbidden_actions ?? input.forbiddenActions),
    ])),
    expected_output: cleanString(input.expected_output ?? input.expectedOutput) ?? "grounded_micro_report",
    reasoning_budget: budget(input.reasoning_budget ?? input.reasoningBudget),
    raw_context_approved: input.raw_context_approved === true,
    assistant_answer: false,
    raw_content_included: false,
    context_policy: "compact_context_pack_only",
    created_at: now,
  };
  handoffsByThread.set(threadId, [...(handoffsByThread.get(threadId) ?? []), handoff].slice(-200));
  return handoff;
}

export function listAskHandoffs(input: {
  threadId: string;
  roomId?: string | null;
  limit?: number;
}): HelixAskHandoff[] {
  const limit = Number.isFinite(input.limit) ? Math.max(0, Math.min(200, Math.trunc(input.limit ?? 80))) : 80;
  return [...(handoffsByThread.get(input.threadId) ?? [])]
    .filter((handoff) => !input.roomId || handoff.room_id === input.roomId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .slice(-limit);
}

export function resetAskHandoffsForTest(): void {
  handoffsByThread.clear();
}
