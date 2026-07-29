import type { HelixAgentContinuationState } from "@shared/helix-agent-continuation-state";

type RecordLike = Record<string, unknown>;

export const HELIX_VISIBLE_ANSWER_POLICY_TERMINAL_RETRY_SCHEMA =
  "helix.visible_answer_policy_terminal_retry.v1" as const;

export const HELIX_VISIBLE_ANSWER_POLICY_TERMINAL_RETRY_LIMIT = 1;

const REPAIRABLE_THEORY_EXECUTION_CLOSURE_VIOLATIONS = new Set([
  "theory_execution_closure_terminal_binding_invalid",
  "theory_execution_closure_support_refs_missing",
  "theory_execution_closure_open_requirements_omitted",
  "theory_execution_closure_claim_ceiling_exceeded",
  "theory_execution_closure_physical_truth_overclaim",
]);

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordLike)
    : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readAttemptCount = (value: unknown): number => {
  const attemptCount =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;
  return Number.isInteger(attemptCount) && attemptCount >= 0 ? attemptCount : 0;
};

export const theoryExecutionClosureViolationIsTerminallyRepairable = (
  violation: string | null | undefined,
): boolean =>
  Boolean(
    violation && REPAIRABLE_THEORY_EXECUTION_CLOSURE_VIOLATIONS.has(violation),
  );

export const visibleAnswerPolicyTerminalRetryAttemptsConsumed = (
  payload: RecordLike,
  turnId?: string | null,
): number => {
  const marker = readRecord(payload.visible_answer_policy_terminal_retry);
  if (
    readString(marker?.schema) !==
      HELIX_VISIBLE_ANSWER_POLICY_TERMINAL_RETRY_SCHEMA ||
    (turnId && readString(marker?.turn_id) !== turnId)
  ) {
    return 0;
  }
  return readAttemptCount(marker?.attempt_count);
};

export const readVisibleAnswerPolicyTerminalRetryRequest = (
  payload: RecordLike,
  turnId?: string | null,
): {
  violation: string;
  rejectedTerminalArtifactKind: string | null;
  rejectedFinalAnswerSource: string | null;
} | null => {
  const rejection = readRecord(
    payload.visible_answer_policy_faithfulness_rejection,
  );
  const violation = readString(rejection?.violation);
  if (
    readString(rejection?.schema) !==
      "helix.visible_answer_policy_faithfulness_rejection.v1" ||
    (turnId && readString(rejection?.turn_id) !== turnId) ||
    !violation ||
    rejection?.repairable !== true ||
    rejection?.retry_required !== true ||
    !theoryExecutionClosureViolationIsTerminallyRepairable(violation) ||
    visibleAnswerPolicyTerminalRetryAttemptsConsumed(payload, turnId) >=
      HELIX_VISIBLE_ANSWER_POLICY_TERMINAL_RETRY_LIMIT
  ) {
    return null;
  }
  return {
    violation,
    rejectedTerminalArtifactKind: readString(
      rejection?.rejected_terminal_artifact_kind,
    ),
    rejectedFinalAnswerSource: readString(
      rejection?.rejected_final_answer_source,
    ),
  };
};

export const buildVisibleAnswerPolicyTerminalRetryMarker = (input: {
  turnId: string;
  violation: string;
  status: "attempting" | "succeeded" | "exhausted";
  outcome?: string | null;
  rejectedCandidateRef?: string | null;
  rejectedCandidateSha256?: string | null;
  finalCandidateRef?: string | null;
  finalCandidateSha256?: string | null;
  closureArtifactRef?: string | null;
}): RecordLike => ({
  schema: HELIX_VISIBLE_ANSWER_POLICY_TERMINAL_RETRY_SCHEMA,
  turn_id: input.turnId,
  attempt_count: HELIX_VISIBLE_ANSWER_POLICY_TERMINAL_RETRY_LIMIT,
  attempt_limit: HELIX_VISIBLE_ANSWER_POLICY_TERMINAL_RETRY_LIMIT,
  violation: input.violation,
  status: input.status,
  outcome: input.outcome ?? null,
  rejected_candidate_ref: input.rejectedCandidateRef ?? null,
  rejected_candidate_sha256: input.rejectedCandidateSha256 ?? null,
  final_candidate_ref: input.finalCandidateRef ?? null,
  final_candidate_sha256: input.finalCandidateSha256 ?? null,
  closure_artifact_ref: input.closureArtifactRef ?? null,
  terminal_eligible: false,
  assistant_answer: false,
  raw_content_included: false,
});

export const visibleAnswerPolicyTerminalRetrySucceeded = (input: {
  selectedTerminalArtifactKind?: string | null;
  finalAnswerSource?: string | null;
  visibleText?: string | null;
  repeatedPolicyRejection?: RecordLike | null;
}): boolean =>
  Boolean(
    readString(input.selectedTerminalArtifactKind) &&
      readString(input.selectedTerminalArtifactKind) !== "typed_failure" &&
      readString(input.finalAnswerSource) &&
      readString(input.visibleText) &&
      !input.repeatedPolicyRejection,
  );

export const buildVisibleAnswerPolicyTerminalRetryRejectedState = (input: {
  turnId: string;
  provisionalState: HelixAgentContinuationState;
}): HelixAgentContinuationState => ({
  ...input.provisionalState,
  state_id: `${input.turnId}:agent_continuation_state:${input.provisionalState.sequence + 1}:terminal_recovery_rejected`,
  sequence: input.provisionalState.sequence + 1,
  trigger: "final_review",
  goal: {
    status: "blocked",
    satisfied: false,
    terminal_product_allowed: false,
  },
  progress: {
    ...input.provisionalState.progress,
    made_progress: false,
    reason_codes: Array.from(
      new Set([
        ...input.provisionalState.progress.reason_codes,
        "runtime_agent_terminal_recovery_rejected",
      ]),
    ),
  },
  allowed_decisions: ["fail"],
});
