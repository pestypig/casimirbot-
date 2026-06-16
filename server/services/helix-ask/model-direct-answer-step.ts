import crypto from "node:crypto";

type RecordLike = Record<string, unknown>;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : "";

const readArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

const normalizeRuntimeDecisionAuthority = (value: unknown): "llm" | "deterministic_policy_fallback" => {
  const text = readString(value);
  return text === "llm" || text === "model"
    ? "llm"
    : "deterministic_policy_fallback";
};

const normalizeRuntimeLoopIterationDecisionAuthority = (iteration: unknown): unknown => {
  const record = readRecord(iteration);
  if (!record) return iteration;
  const authority = normalizeRuntimeDecisionAuthority(
    record.decision_source ?? record.decision_authority ?? record.decisionAuthority ?? record.sampling_mode,
  );
  return {
    ...record,
    decision_source: authority,
    decision_authority: authority,
  };
};

const hashShort = (value: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);

export const isModelDirectAnswerDecision = (
  decision: RecordLike | null | undefined,
): boolean => {
  const nextStep = readString(decision?.next_step);
  const chosenCapability = readString(decision?.chosen_capability);
  return chosenCapability === "model.direct_answer" || (nextStep === "answer" && !chosenCapability);
};

const isRepoCodeEvidenceObservationEntry = (entry: unknown): boolean => {
  const record = readRecord(entry);
  const payload = readRecord(record?.payload) ?? record;
  const searchable = [
    readString(record?.kind),
    readString(payload?.kind),
    readString(payload?.schema),
    readString(payload?.source_kind),
  ].join(" ");
  return /repo_code_evidence_observation|helix\.repo_code_evidence_observation\.v1|repo_code/i.test(searchable);
};

export function hasRepoCodeEvidenceObservation(payload: RecordLike): boolean {
  if (readArray(payload.current_turn_artifact_ledger).some(isRepoCodeEvidenceObservationEntry)) return true;
  if (readArray(payload.repo_evidence_observations).length > 0) return true;
  return readArray(payload.evidence_observations).some(isRepoCodeEvidenceObservationEntry);
}

export function shouldBlockModelDirectAnswerForRepoEvidence(input: {
  payload: RecordLike;
  agentStepDecision?: RecordLike | null;
}): boolean {
  const decision = input.agentStepDecision ?? readRecord(input.payload.agent_step_decision);
  if (!isModelDirectAnswerDecision(decision)) return false;
  if (hasRepoCodeEvidenceObservation(input.payload)) return false;
  const canonicalGoalFrame = readRecord(input.payload.canonical_goal_frame);
  const capabilityPlan = readRecord(input.payload.capability_plan);
  const sourceTargetIntent = readRecord(input.payload.source_target_intent);
  const goalKind = readString(canonicalGoalFrame?.goal_kind);
  return (
    goalKind === "repo_code_evidence_question" ||
    goalKind === "repo_entity_definition" ||
    goalKind === "repo_concept_explanation" ||
    readString(capabilityPlan?.requested_action) === "repo-code.search_concept" ||
    readString(capabilityPlan?.source_target) === "repo_code" ||
    readString(sourceTargetIntent?.target_source) === "repo_code"
  );
}

export function buildRepoEvidenceRequiredBeforeAnswerObservation(input: {
  turnId: string;
  promptText: string;
  payload: RecordLike;
}): RecordLike {
  const canonicalGoalFrame = readRecord(input.payload.canonical_goal_frame);
  const corpusAnchors = readArray(canonicalGoalFrame?.corpus_anchors)
    .map((entry) => readString(entry))
    .filter(Boolean);
  const concept = corpusAnchors[0] || readString(canonicalGoalFrame?.user_goal_summary) || input.promptText;
  const artifactId = `repo_evidence_required_before_answer:${hashShort([
    input.turnId,
    concept,
    input.promptText,
  ])}`;
  return {
    schema: "helix.repo_evidence_required_before_answer.v1",
    kind: "repo_evidence_required_before_answer",
    artifact_id: artifactId,
    turn_id: input.turnId,
    reason: "repo_evidence_required_before_answer",
    required_capability: "repo-code.search_concept",
    concept,
    query: input.promptText,
    message:
      "Project-internal concept answers require repo evidence before model.direct_answer can become terminal.",
    assistant_answer: false,
    raw_content_included: false,
  };
}

const DIRECT_ANSWER_UNAVAILABLE_PATTERNS = [
  /direct_answer_unavailable/i,
  /model_only_answer_unavailable/i,
  /could not produce a terminal answer/i,
  /could not produce a final answer/i,
  /could not produce a substantive direct answer/i,
  /model did not return a usable answer/i,
  /direct model-only answer timed out/i,
  /i could not complete this turn/i,
  /please retry once/i,
];

export function isUnavailableModelDirectAnswerText(value: unknown): boolean {
  const text = readString(value);
  if (!text) return true;
  return DIRECT_ANSWER_UNAVAILABLE_PATTERNS.some((pattern) => pattern.test(text));
}

export function shouldRetryModelDirectAnswerStep(input: {
  payload: RecordLike;
  agentStepDecision?: RecordLike | null;
  draftText?: unknown;
  retryCount?: number | null;
}): boolean {
  const retryCount = typeof input.retryCount === "number" ? input.retryCount : 0;
  if (retryCount > 0) return false;

  const decision = input.agentStepDecision ?? readRecord(input.payload.agent_step_decision);
  if (!isModelDirectAnswerDecision(decision)) return false;

  const terminalErrorCode = readString(input.payload.terminal_error_code);
  const terminalKind = readString(input.payload.terminal_artifact_kind);
  const finalAnswerSource = readString(input.payload.final_answer_source);
  const directText =
    input.draftText ??
    readRecord(input.payload.direct_answer_text)?.text ??
    readRecord(input.payload.final_answer_draft)?.text ??
    input.payload.selected_final_answer ??
    input.payload.answer ??
    input.payload.text;

  return (
    terminalErrorCode === "direct_answer_unavailable" ||
    terminalErrorCode === "model_only_answer_unavailable" ||
    (
      terminalKind === "typed_failure" &&
      finalAnswerSource === "typed_failure" &&
      isUnavailableModelDirectAnswerText(directText)
    ) ||
    isUnavailableModelDirectAnswerText(directText)
  );
}

export function buildModelDirectAnswerRetryInstruction(input: {
  promptText: string;
  reason?: string | null;
}): string {
  return [
    "The previous model.direct_answer step did not produce a usable direct_answer_text.",
    "Retry once. Do not call workstation tools unless the prompt explicitly requires them.",
    "Return a substantive answer to the user's goal as direct_answer_text.",
    "Do not return a placeholder, route failure, or terminal-boundary explanation.",
    input.reason ? `Previous failure: ${input.reason}` : null,
    "",
    "User goal:",
    input.promptText,
  ].filter(Boolean).join("\n");
}

export function markModelDirectAnswerRetryObservation(input: {
  turnId: string;
  payload: RecordLike;
  reason: string;
}): RecordLike {
  const artifactId = `model_direct_answer_retry:${hashShort([input.turnId, input.reason])}`;
  const observation = {
    schema: "helix.model_direct_answer_retry_observation.v1",
    kind: "model_direct_answer_retry_observation",
    artifact_id: artifactId,
    turn_id: input.turnId,
    reason: input.reason,
    retry_allowed: true,
    assistant_answer: false,
    raw_content_included: false,
  };
  return {
    ...input.payload,
    model_direct_answer_retry_count: 1,
    current_turn_artifact_ledger: [
      ...readArray(input.payload.current_turn_artifact_ledger),
      {
        artifact_id: artifactId,
        turn_id: input.turnId,
        kind: "model_direct_answer_retry_observation",
        source_scope: "current_turn",
        producer_item_id: "agent_runtime_loop",
        payload: observation,
      },
    ],
  };
}

export function applyModelDirectAnswerDraftStep(input: {
  turnId: string;
  promptText: string;
  payload: RecordLike;
  agentStepDecision: RecordLike;
  draftText: string;
  authority?: "model" | "deterministic_policy_fallback";
  artifactRefs?: string[];
  supportRefs?: string[];
  evidenceRefs?: string[];
  goalKind?: string;
  requiredTerminalKind?: string;
  modelStepCapability?: string;
}): RecordLike {
  const text = input.draftText.trim();
  const authority = input.authority ?? "model";
  const payload = input.payload ?? {};
  const artifactRefs = input.artifactRefs ?? input.supportRefs ?? input.evidenceRefs ?? [];
  const supportRefs = input.supportRefs ?? input.artifactRefs ?? input.evidenceRefs ?? [];
  const evidenceRefs = input.evidenceRefs ?? input.supportRefs ?? input.artifactRefs ?? [];
  const existingLoop = readRecord(payload.agent_runtime_loop);
  const existingIterations = readArray(existingLoop?.iterations).map(normalizeRuntimeLoopIterationDecisionAuthority);
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
    goal_kind: input.goalKind,
    required_terminal_kind: input.requiredTerminalKind,
    artifact_refs: artifactRefs,
    support_refs: supportRefs,
    evidence_refs: evidenceRefs,
    model_step_capability: input.modelStepCapability ?? "model.direct_answer",
    assistant_answer: false,
    raw_content_included: false,
  };

  const normalizedDecision = {
    ...input.agentStepDecision,
    decision_id: decisionId,
    next_step: "answer",
    chosen_capability: "model.direct_answer",
    decision_source: normalizeRuntimeDecisionAuthority(authority),
    decision_authority: normalizeRuntimeDecisionAuthority(authority),
  };
  const runtimeDecisionAuthority = normalizeRuntimeDecisionAuthority(authority);

  const answerIteration = {
    iteration_index: existingIterations.length,
    decision_id: decisionId,
    decision_ref: decisionId,
    next_step: "answer",
    chosen_capability: "model.direct_answer",
    decision_timing: "terminal_review",
    decision_source: runtimeDecisionAuthority,
    decision_authority: runtimeDecisionAuthority,
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
