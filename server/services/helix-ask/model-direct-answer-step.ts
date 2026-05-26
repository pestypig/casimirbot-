import crypto from "node:crypto";

type RecordLike = Record<string, unknown>;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : "";

const readArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

const hashShort = (value: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);

export const isModelDirectAnswerDecision = (
  decision: RecordLike | null | undefined,
): boolean => {
  const nextStep = readString(decision?.next_step);
  const chosenCapability = readString(decision?.chosen_capability);
  return nextStep === "answer" || chosenCapability === "model.direct_answer";
};

export function applyModelDirectAnswerDraftStep(input: {
  turnId: string;
  promptText: string;
  payload: RecordLike;
  agentStepDecision: RecordLike;
  draftText: string;
  authority?: "model" | "deterministic_policy_fallback";
}): RecordLike {
  const text = input.draftText.trim();
  const authority = input.authority ?? "model";
  const payload = input.payload ?? {};
  const existingLoop = readRecord(payload.agent_runtime_loop);
  const existingIterations = readArray(existingLoop?.iterations);
  const decisionId =
    readString(input.agentStepDecision.decision_id) ||
    `agent_step_decision:${hashShort([input.turnId, input.promptText, existingIterations.length])}`;

  const directAnswerArtifactId = `direct_answer_text:${hashShort([input.turnId, text])}`;
  const finalDraftArtifactId = `final_answer_draft:${hashShort([input.turnId, directAnswerArtifactId])}`;

  const directAnswerText = {
    schema: "helix.direct_answer_text.v1",
    kind: "direct_answer_text",
    artifact_id: directAnswerArtifactId,
    turn_id: input.turnId,
    text,
    answer_text: text,
    produced_by: "agent_runtime_loop",
    source: "model_direct_answer",
    decision_ref: decisionId,
    capability: "model.direct_answer",
    assistant_answer: false,
    raw_content_included: false,
  };

  const finalAnswerDraft = {
    schema: "helix.final_answer_draft.v1",
    kind: "final_answer_draft",
    artifact_id: finalDraftArtifactId,
    turn_id: input.turnId,
    text,
    source: "model_direct_answer",
    direct_answer_ref: directAnswerArtifactId,
    decision_ref: decisionId,
    assistant_answer: false,
    raw_content_included: false,
  };

  const normalizedDecision = {
    ...input.agentStepDecision,
    decision_id: decisionId,
    next_step: "answer",
    chosen_capability: "model.direct_answer",
    decision_authority: authority,
  };

  const answerIteration = {
    iteration_index: existingIterations.length,
    decision_id: decisionId,
    decision_ref: decisionId,
    next_step: "answer",
    chosen_capability: "model.direct_answer",
    decision_timing: "terminal_review",
    decision_authority: authority,
    observation_role: "model_answer_draft",
    artifact_refs: [directAnswerArtifactId, finalDraftArtifactId],
    observed_artifact_refs: [directAnswerArtifactId, finalDraftArtifactId],
  };

  const ledger = readArray(payload.current_turn_artifact_ledger);
  const withoutExistingDrafts = ledger.filter((entry) => {
    const record = readRecord(entry);
    const kind = readString(record?.kind);
    return kind !== "direct_answer_text" && kind !== "final_answer_draft";
  });

  return {
    ...payload,
    agent_step_decision: normalizedDecision,
    agent_runtime_loop: {
      schema: "helix.agent_runtime_loop.v1",
      turn_id: input.turnId,
      ...(existingLoop ?? {}),
      iterations: [...existingIterations, answerIteration],
      terminal_state: "answer_drafted",
      assistant_answer: false,
      raw_content_included: false,
    },
    direct_answer_text: directAnswerText,
    final_answer_draft: finalAnswerDraft,
    current_turn_artifact_ledger: [
      ...withoutExistingDrafts,
      {
        artifact_id: directAnswerArtifactId,
        turn_id: input.turnId,
        producer_item_id: "agent_runtime_loop",
        kind: "direct_answer_text",
        source_scope: "current_turn",
        payload: directAnswerText,
      },
      {
        artifact_id: finalDraftArtifactId,
        turn_id: input.turnId,
        producer_item_id: "agent_runtime_loop",
        kind: "final_answer_draft",
        source_scope: "current_turn",
        payload: finalAnswerDraft,
      },
    ],
  };
}
