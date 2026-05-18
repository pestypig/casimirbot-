import type { HelixConversationalAnswerDistillation } from "@shared/helix-conversational-answer-distillation";

const distillationsByThread = new Map<string, HelixConversationalAnswerDistillation[]>();

export function recordConversationalAnswerDistillation(
  distillation: HelixConversationalAnswerDistillation,
): HelixConversationalAnswerDistillation {
  distillationsByThread.set(distillation.thread_id, [
    ...(distillationsByThread.get(distillation.thread_id) ?? [])
      .filter((entry: HelixConversationalAnswerDistillation) => entry.distillation_id !== distillation.distillation_id),
    distillation,
  ].slice(-300));
  return distillation;
}

export function listConversationalAnswerDistillations(input: {
  threadId?: string | null;
  situationRunId?: string | null;
  limit?: number;
} = {}): HelixConversationalAnswerDistillation[] {
  const limit = Math.max(0, Math.min(300, Math.trunc(input.limit ?? 80)));
  return Array.from(distillationsByThread.values()).flat()
    .filter((entry: HelixConversationalAnswerDistillation) => !input.threadId || entry.thread_id === input.threadId)
    .filter((entry: HelixConversationalAnswerDistillation) => !input.situationRunId || entry.situation_run_id === input.situationRunId)
    .slice(-limit);
}

export function getConversationalAnswerDistillation(
  distillationId: string,
): HelixConversationalAnswerDistillation | null {
  return Array.from(distillationsByThread.values()).flat()
    .find((entry: HelixConversationalAnswerDistillation) => entry.distillation_id === distillationId) ?? null;
}

export function resetConversationalAnswerDistillationsForTest(): void {
  distillationsByThread.clear();
}
