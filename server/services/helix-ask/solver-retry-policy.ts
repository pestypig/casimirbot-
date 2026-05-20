import {
  HELIX_SOLVER_RETRY_POLICY_SCHEMA,
  type HelixSolverRetryKind,
  type HelixSolverRetryPolicy,
} from "@shared/helix-solver-retry-policy";
import type { HelixSolverSubgoal } from "@shared/helix-solver-subgoal";

type RecordLike = Record<string, unknown>;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string =>
  typeof value === "string" && value.trim() ? value.trim() : "";

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((entry: unknown): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : [];

const readBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const readNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const lower = (value: string): string => value.toLowerCase();

const unique = (values: string[]): string[] => Array.from(new Set(values.filter(Boolean)));

const payloadArtifacts = (payload: RecordLike): RecordLike[] =>
  Array.isArray(payload.current_turn_artifact_ledger)
    ? payload.current_turn_artifact_ledger.map((entry: unknown) => readRecord(entry)).filter((entry): entry is RecordLike => Boolean(entry))
    : [];

const payloadArtifactPayloads = (payload: RecordLike): RecordLike[] =>
  payloadArtifacts(payload).map((artifact) => readRecord(artifact.payload)).filter((entry): entry is RecordLike => Boolean(entry));

const policy = (input: {
  turnId: string;
  failedSubgoalId: string;
  retryAllowed: boolean;
  retryKind: HelixSolverRetryKind;
  maxAttempts: number;
  attemptCount?: number;
  reason: string;
}): HelixSolverRetryPolicy => ({
  schema: HELIX_SOLVER_RETRY_POLICY_SCHEMA,
  turn_id: input.turnId,
  failed_subgoal_id: input.failedSubgoalId,
  retry_allowed: input.retryAllowed,
  retry_kind: input.retryKind,
  max_attempts: input.maxAttempts,
  attempt_count: input.attemptCount ?? 0,
  reason: input.reason,
  assistant_answer: false,
  raw_content_included: false,
});

const failedSubgoals = (payload: RecordLike): HelixSolverSubgoal[] => {
  const ledger = readRecord(payload.solver_subgoal_ledger);
  const subgoals = Array.isArray(ledger?.subgoals) ? ledger.subgoals : [];
  return subgoals
    .map((entry: unknown) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry))
    .filter((entry) => {
      const status = readString(entry.status);
      const evaluation = readRecord(entry.evaluation);
      return status === "failed" || status === "blocked" || evaluation?.ok === false;
    }) as HelixSolverSubgoal[];
};

const selectedRetrievalRefs = (payload: RecordLike): string[] => {
  const result = readRecord(payload.procedure_evidence_retrieval_result);
  return unique([
    ...readStringArray(result?.selected_current_refs),
    ...readStringArray(result?.selected_prior_refs),
    ...readStringArray(result?.selected_epoch_refs),
    ...readStringArray(result?.selected_field_evaluation_refs),
    ...readStringArray(result?.selected_interpretation_refs),
    ...readStringArray(result?.selected_probe_refs),
  ]);
};

const alternateSourceRefs = (payload: RecordLike): string[] => unique([
  ...readStringArray(payload.alternate_source_refs),
  ...readStringArray(readRecord(payload.procedure_evidence_retrieval_result)?.alternate_source_refs),
  ...payloadArtifactPayloads(payload).flatMap((entry) => readStringArray(entry.alternate_source_refs)),
]);

const sourceBindingStatuses = (payload: RecordLike): RecordLike[] => {
  const explicit = Array.isArray(payload.source_binding_statuses) ? payload.source_binding_statuses : [];
  const artifactStatuses = payloadArtifactPayloads(payload).filter((entry) =>
    readString(entry.schema) === "helix.source_binding_status.v1" ||
    /source_binding_status/i.test(readString(entry.item_id) || readString(entry.status_id)),
  );
  return [...explicit, ...artifactStatuses]
    .map((entry: unknown) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry));
};

const sourceRepairCandidates = (payload: RecordLike): RecordLike[] => {
  const explicit = Array.isArray(payload.source_binding_repair_candidates) ? payload.source_binding_repair_candidates : [];
  const artifactCandidates = payloadArtifactPayloads(payload).filter((entry) =>
    readString(entry.schema) === "helix.source_binding_repair_candidate.v1" ||
    /source_binding_repair_candidate|repair_candidate/i.test(readString(entry.item_id) || readString(entry.candidate_id)),
  );
  return [...explicit, ...artifactCandidates]
    .map((entry: unknown) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry));
};

const hasFreshUnboundVisualSource = (payload: RecordLike): { fresh: boolean; stale: boolean } => {
  for (const status of sourceBindingStatuses(payload)) {
    const text = lower(JSON.stringify(status));
    const visual = /visual|screen|capture|frame|generic_visual/.test(text);
    const unbound = /unbound|not_bound|missing_binding|binding_missing|repair_candidate/.test(text);
    if (!visual || !unbound) continue;
    const state = lower(readString(status.status) || readString(status.binding_status) || readString(status.state));
    const stale = readBoolean(status.stale) === true || state === "stale" || state === "expired";
    const freshnessMs = readNumber(status.freshness_ms);
    const fresh = !stale && (freshnessMs === null || freshnessMs <= 10_000 || readBoolean(status.fresh) === true);
    return { fresh, stale: !fresh };
  }
  return { fresh: false, stale: false };
};

const docCandidatePayloads = (payload: RecordLike): RecordLike[] =>
  payloadArtifactPayloads(payload).filter((entry) =>
    readString(entry.schema) === "helix.doc_candidate_validation.v1" ||
    readString(entry.kind) === "doc_candidate_validation" ||
    readString(entry.selected_doc_path).length > 0 ||
    readString(entry.opened_path).length > 0 ||
    readString(entry.next_candidate_path).length > 0,
  );

const docCandidateValidationFailedWithFallback = (payload: RecordLike): boolean => {
  const candidates = [
    readRecord(payload.doc_candidate_validation),
    ...docCandidatePayloads(payload),
  ].filter((entry): entry is RecordLike => Boolean(entry));
  return candidates.some((entry) => {
    const status = lower(readString(entry.status) || readString(entry.validation_status));
    const selected = readString(entry.selected_doc_path) || readString(entry.candidate_path);
    const opened = readString(entry.opened_path) || readString(entry.activeDocPath);
    const next = readString(entry.next_candidate_path);
    const candidateRefs = readStringArray(entry.candidate_paths);
    return (
      status === "failed" ||
      status === "invalid" ||
      readBoolean(entry.valid) === false ||
      Boolean(selected && opened && selected !== opened)
    ) && Boolean(next || candidateRefs.length > 1);
  });
};

const mutatingActionRequiresOperatorCommand = (payload: RecordLike): boolean => {
  const plan = readRecord(payload.capability_plan);
  return plan?.schema === "helix.capability_plan.v1" &&
    plan.mutating === true &&
    plan.operator_command_required === true &&
    plan.operator_command_present !== true;
};

const priorAttemptCount = (payload: RecordLike, failedSubgoalId: string): number => {
  const policies = Array.isArray(payload.solver_retry_policies) ? payload.solver_retry_policies : [];
  return policies
    .map((entry: unknown) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry))
    .filter((entry) => readString(entry.failed_subgoal_id) === failedSubgoalId)
    .reduce((max, entry) => Math.max(max, readNumber(entry.attempt_count) ?? 0), 0);
};

const buildPolicyForSubgoal = (turnId: string, subgoal: HelixSolverSubgoal, payload: RecordLike): HelixSolverRetryPolicy => {
  const failedSubgoalId = readString(subgoal.subgoal_id) || `${turnId}:solver_subgoal:unknown`;
  const attemptCount = priorAttemptCount(payload, failedSubgoalId);
  const kind = readString(subgoal.kind);

  if (mutatingActionRequiresOperatorCommand(payload)) {
    return policy({
      turnId,
      failedSubgoalId,
      retryAllowed: false,
      retryKind: "ask_user",
      maxAttempts: 0,
      attemptCount,
      reason: "mutating_action_requires_operator_command",
    });
  }

  if ((kind === "retrieve_evidence" || kind === "compare_evidence" || kind === "diagnose_debug") && selectedRetrievalRefs(payload).length === 0) {
    if (alternateSourceRefs(payload).length > 0) {
      return policy({
        turnId,
        failedSubgoalId,
        retryAllowed: attemptCount < 1,
        retryKind: "alternate_source",
        maxAttempts: 1,
        attemptCount,
        reason: "retrieval_result_empty_alternate_source_available",
      });
    }
    const visualBinding = hasFreshUnboundVisualSource(payload);
    if (visualBinding.fresh) {
      return policy({
        turnId,
        failedSubgoalId,
        retryAllowed: attemptCount < 1,
        retryKind: "repair_binding",
        maxAttempts: 1,
        attemptCount,
        reason: sourceRepairCandidates(payload).length > 0
          ? "fresh_visual_source_unbound_repair_candidate_available"
          : "fresh_visual_source_unbound_retry_binding_safe",
      });
    }
    if (visualBinding.stale) {
      return policy({
        turnId,
        failedSubgoalId,
        retryAllowed: attemptCount < 1,
        retryKind: "refresh_live_source",
        maxAttempts: 1,
        attemptCount,
        reason: "visual_source_unbound_or_stale_refresh_required",
      });
    }
    return policy({
      turnId,
      failedSubgoalId,
      retryAllowed: false,
      retryKind: "fail_closed",
      maxAttempts: 0,
      attemptCount,
      reason: "retrieval_result_empty_no_alternate_source",
    });
  }

  const visualBinding = hasFreshUnboundVisualSource(payload);
  if (visualBinding.fresh) {
    return policy({
      turnId,
      failedSubgoalId,
      retryAllowed: attemptCount < 1,
      retryKind: "repair_binding",
      maxAttempts: 1,
      attemptCount,
      reason: sourceRepairCandidates(payload).length > 0
        ? "fresh_visual_source_unbound_repair_candidate_available"
        : "fresh_visual_source_unbound_retry_binding_safe",
    });
  }
  if (visualBinding.stale) {
    return policy({
      turnId,
      failedSubgoalId,
      retryAllowed: attemptCount < 1,
      retryKind: "refresh_live_source",
      maxAttempts: 1,
      attemptCount,
      reason: "visual_source_unbound_or_stale_refresh_required",
    });
  }

  if (kind === "execute_capability" && docCandidateValidationFailedWithFallback(payload)) {
    return policy({
      turnId,
      failedSubgoalId,
      retryAllowed: attemptCount < 1,
      retryKind: "validate_candidate",
      maxAttempts: 1,
      attemptCount,
      reason: "doc_candidate_validation_failed_try_next_candidate",
    });
  }

  return policy({
    turnId,
    failedSubgoalId,
    retryAllowed: false,
    retryKind: "fail_closed",
    maxAttempts: 0,
    attemptCount,
    reason: "no_safe_helix_retry_available",
  });
};

export const buildSolverRetryPolicies = (input: {
  turnId: string;
  payload: RecordLike;
}): HelixSolverRetryPolicy[] =>
  failedSubgoals(input.payload).map((subgoal) => buildPolicyForSubgoal(input.turnId, subgoal, input.payload));
