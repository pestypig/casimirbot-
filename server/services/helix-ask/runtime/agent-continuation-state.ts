import crypto from "node:crypto";
import {
  HELIX_AGENT_CONTINUATION_STATE_SCHEMA,
  HELIX_TERMINAL_REJECTION_OBSERVATION_SCHEMA,
  type HelixAgentContinuationAction,
  type HelixAgentContinuationAffordance,
  type HelixAgentContinuationAttempt,
  type HelixAgentContinuationBudget,
  type HelixAgentContinuationBudgetDimension,
  type HelixAgentContinuationDecision,
  type HelixAgentContinuationFailureClass,
  type HelixAgentContinuationGoalStatus,
  type HelixAgentContinuationRetryability,
  type HelixAgentContinuationState,
  type HelixTerminalRejectionObservation,
} from "@shared/helix-agent-continuation-state";

type RecordLike = Record<string, unknown>;

type HelixTurnArtifact = {
  artifact_id: string;
  turn_id?: string;
  producer_item_id?: string;
  kind: string;
  created_at_ms?: number;
  source_scope?: string;
  payload?: RecordLike;
};

type ContinuationStateTrigger = HelixAgentContinuationState["trigger"];

export type BuildHelixAgentContinuationStateArgs = {
  payload: RecordLike;
  turnId: string;
  trigger: ContinuationStateTrigger;
  previousState?: HelixAgentContinuationState | null;
  lastAttempt?: Partial<HelixAgentContinuationAttempt> | RecordLike | null;
  nowMs?: number;
};

export type HelixContinuationBudgetExtensionDecision = {
  extend: boolean;
  reason: string;
  increments: {
    iterations: number;
    tool_calls: number;
    model_decisions: number;
  };
};

const ADMINISTRATIVE_ARTIFACT_KINDS = new Set([
  "agent_continuation_state",
  "agent_loop_budget",
  "agent_runtime_loop",
  "agent_step_decision",
  "available_capabilities",
  "canonical_goal_frame",
  "capability_itinerary",
  "capability_itinerary_execution_state",
  "committed_ask_route",
  "goal_satisfaction_evaluation",
  "observation_review",
  "route_evidence_authority",
  "route_product_contract",
  "runtime_authority_audit",
  "runtime_continuation_hint",
  "runtime_intent_packet",
  "runtime_semantic_route_proposal",
  "source_target_intent",
  "terminal_answer_authority",
  "terminal_answer_envelope",
  "terminal_authority_single_writer",
  "tool_call_admission_decision",
  "tool_surface_packet",
]);

const HELIX_AGENT_CONTINUATION_STATE_HISTORY_LIMIT = 24;
const HELIX_TERMINAL_REJECTION_OBSERVATION_HISTORY_LIMIT = 12;

const appendBoundedArtifactHistory = (args: {
  ledger: HelixTurnArtifact[];
  artifact: HelixTurnArtifact;
  kind: string;
  limit: number;
}): HelixTurnArtifact[] => {
  const deduplicated = [...args.ledger, args.artifact].filter(
    (entry: HelixTurnArtifact, index: number, all: HelixTurnArtifact[]) =>
      all.findIndex((candidate: HelixTurnArtifact) => candidate.artifact_id === entry.artifact_id) === index,
  );
  const retainedIds = new Set(
    deduplicated
      .filter((entry: HelixTurnArtifact) => entry.kind === args.kind)
      .slice(-args.limit)
      .map((entry: HelixTurnArtifact) => entry.artifact_id),
  );
  return deduplicated.filter(
    (entry: HelixTurnArtifact) => entry.kind !== args.kind || retainedIds.has(entry.artifact_id),
  );
};

const RECOVERABLE_TERMINAL_REJECTION_REASONS = new Set([
  "missing_post_tool_model_step",
  "missing_evidence_reentry",
  "missing_required_observation",
  "route_requires_synthesis",
  "solver_continuation_pending",
  "pending_tool_call",
]);

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const readBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const uniqueStrings = (values: unknown[]): string[] =>
  Array.from(
    new Set(
      values
        .flatMap((value: unknown) => (Array.isArray(value) ? value : [value]))
        .map((value: unknown) => readString(value))
        .filter((value: string | null): value is string => Boolean(value)),
    ),
  );

const stableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stableValue);
  const record = readRecord(value);
  if (!record) return value;
  return Object.fromEntries(
    Object.keys(record)
      .sort()
      .map((key: string) => [key, stableValue(record[key])]),
  );
};

const hashShort = (value: unknown, length = 16): string =>
  crypto.createHash("sha256").update(JSON.stringify(stableValue(value))).digest("hex").slice(0, length);

const actionFingerprint = (capabilityId: string | null, action: HelixAgentContinuationAction | null, args: RecordLike): string =>
  `sha256:${hashShort([capabilityId, action?.panel_id ?? null, action?.action_id ?? null, args], 24)}`;

const currentTurnArtifacts = (payload: RecordLike, turnId: string): HelixTurnArtifact[] => {
  if (!Array.isArray(payload.current_turn_artifact_ledger)) return [];
  return (payload.current_turn_artifact_ledger as unknown[])
    .map((value) => readRecord(value) as HelixTurnArtifact | null)
    .filter((artifact): artifact is HelixTurnArtifact => Boolean(
      artifact &&
      readString(artifact.artifact_id) &&
      readString(artifact.kind) &&
      (!artifact.turn_id || artifact.turn_id === turnId) &&
      !["prior_context", "prior_turn_context", "prior_artifact"].includes(readString(artifact.source_scope) ?? ""),
    ));
};

const artifactIsObservation = (artifact: HelixTurnArtifact): boolean => {
  const kind = readString(artifact.kind)?.toLowerCase() ?? "";
  if (!kind || ADMINISTRATIVE_ARTIFACT_KINDS.has(kind)) return false;
  const payload = readRecord(artifact.payload);
  if (readBoolean(payload?.terminal_eligible) === true && readBoolean(payload?.assistant_answer) === true) return false;
  return (
    /(?:^|_)(?:observation|receipt|result|results|evidence|packet|sidecar|reflection|validation|failure)(?:_|$)/.test(kind) ||
    kind.endsWith("_summary") ||
    kind === "typed_failure"
  );
};

const collectObservationRefs = (payload: RecordLike, turnId: string): string[] => {
  const refs = currentTurnArtifacts(payload, turnId)
    .filter(artifactIsObservation)
    .map((artifact: HelixTurnArtifact) => artifact.artifact_id);
  const runtimeLoop = readRecord(payload.agent_runtime_loop);
  const iterations = Array.isArray(runtimeLoop?.iterations) ? runtimeLoop.iterations : [];
  for (const rawIteration of iterations) {
    const iteration = readRecord(rawIteration);
    refs.push(...uniqueStrings([iteration?.observed_artifact_refs]));
  }
  return uniqueStrings(refs);
};

const collectMissingRequirementIds = (payload: RecordLike): string[] => {
  const records = [
    payload,
    readRecord(payload.goal_satisfaction_evaluation),
    readRecord(payload.satisfaction_report),
    readRecord(payload.observation_review),
    readRecord(payload.post_tool_observation_review),
    readRecord(payload.agent_runtime_loop),
    readRecord(payload.agent_loop_budget),
    readRecord(payload.capability_itinerary_execution_state),
  ].filter((record): record is RecordLike => Boolean(record));
  const values: unknown[] = [];
  for (const record of records) {
    values.push(
      record.missing_requirement_ids,
      record.missing_requirements,
      record.missing_evidence,
      record.missing_actions,
      record.unsatisfied_requirement_ids,
    );
  }
  const reviews = Array.isArray(payload.post_tool_observation_reviews)
    ? payload.post_tool_observation_reviews
    : [];
  for (const reviewValue of reviews) {
    const review = readRecord(reviewValue);
    values.push(review?.missing_requirement_ids, review?.missing_requirements);
  }
  return uniqueStrings(values);
};

const normalizeGoalStatus = (payload: RecordLike): {
  status: HelixAgentContinuationGoalStatus;
  satisfied: boolean;
  terminalProductAllowed: boolean | null;
} => {
  const evaluation = readRecord(payload.goal_satisfaction_evaluation);
  const report = readRecord(payload.satisfaction_report);
  const authority = readRecord(payload.route_evidence_authority);
  const providerBridge = readRecord(payload.provider_terminal_authority_bridge);
  const solverTrace = readRecord(payload.ask_turn_solver_trace);
  const providerTerminalAllowed =
    providerBridge?.terminal_authority_granted === true &&
    providerBridge?.final_visible_answer_authorized === true;
  const completedSolverTerminalAllowed =
    solverTrace?.completed_solver_path === true &&
    solverTrace?.route_authority_ok === true &&
    solverTrace?.terminal_authority_ok === true;
  const terminalStatus = (readString(payload.final_status) ?? readString(payload.status) ?? "").toLowerCase();
  const evaluationStatus = (readString(evaluation?.satisfaction) ?? readString(report?.satisfaction) ?? "").toLowerCase();
  const raw = ["satisfied", "terminal_satisfied", "answered", "final_answer", "complete", "completed"].includes(terminalStatus)
    ? terminalStatus
    : evaluationStatus || terminalStatus;
  const satisfied = ["satisfied", "terminal_satisfied", "answered", "final_answer", "complete", "completed"].includes(raw);
  let status: HelixAgentContinuationGoalStatus = satisfied ? "satisfied" : "unknown";
  if (/needs_user_input|pending_input|ask_user|clarif/.test(raw)) status = "needs_user_input";
  else if (/blocked|failed|failure|non_retryable/.test(raw)) status = "blocked";
  else if (!satisfied && (/unsatisfied|partial|in_progress|pending|needs_/.test(raw) || collectMissingRequirementIds(payload).length > 0)) {
    status = "in_progress";
  }
  return {
    status,
    satisfied,
    terminalProductAllowed:
      providerTerminalAllowed || completedSolverTerminalAllowed
        ? true
        : readBoolean(authority?.terminal_product_allowed) ??
      readBoolean(readRecord(payload.terminal_answer_authority)?.allowed) ??
      null,
  };
};

const classifyFailure = (code: string | null, message: string | null): HelixAgentContinuationFailureClass => {
  const text = `${code ?? ""} ${message ?? ""}`.toLowerCase();
  if (!text.trim()) return "none";
  if (/terminal|post_tool_model_step|evidence_reentry/.test(text)) return "terminal_authority";
  if (/route|capability_not_allowed|admission|forbidden_terminal/.test(text)) return "route";
  if (/permission|unauthori[sz]ed|forbidden|approval|auth_required|access_denied/.test(text)) return "permission";
  if (/invalid_arg|missing_arg|validation|malformed|parse_error/.test(text)) return "invalid_args";
  if (/missing_(?:evidence|observation|receipt|sidecar)|evidence_missing|not_materialized/.test(text)) return "missing_evidence";
  if (/timeout|timed_out|rate_limit|temporar|unavailable|busy|connection|retry/.test(text)) return "temporary";
  if (/provider|model|backend|api_key|upstream/.test(text)) return "provider";
  return "unknown";
};

const classifyRetryability = (args: {
  record: RecordLike | null;
  status: HelixAgentContinuationAttempt["status"];
  failureClass: HelixAgentContinuationFailureClass;
  code: string | null;
  message: string | null;
}): HelixAgentContinuationRetryability => {
  if (args.status === "succeeded") return "not_applicable";
  const text = `${args.code ?? ""} ${args.message ?? ""}`.toLowerCase();
  if (
    /runtime_capability_not_admitted_by_tool_policy|runtime_tool_forbidden_by_tool_policy|route_contract_forbidden/.test(text)
  ) {
    return "non_retryable";
  }
  const explicit = readString(args.record?.retryability);
  if (["retryable", "non_retryable", "requires_user_input", "unknown"].includes(explicit ?? "")) {
    return explicit as HelixAgentContinuationRetryability;
  }
  if (readBoolean(args.record?.repairable) === true || readBoolean(args.record?.retryable) === true) return "retryable";
  if (readBoolean(args.record?.retryable) === false) return "non_retryable";
  if (args.failureClass === "permission" || /requires_user|missing_user|confirmation_required/.test(text)) {
    return "requires_user_input";
  }
  if (args.failureClass === "invalid_args" || args.failureClass === "missing_evidence" || args.failureClass === "temporary") {
    return "retryable";
  }
  if (args.failureClass === "terminal_authority" && RECOVERABLE_TERMINAL_REJECTION_REASONS.has(args.code ?? "")) {
    return "retryable";
  }
  if (/unsupported|permanent|not_implemented|route_contract_forbidden/.test(text)) return "non_retryable";
  return "unknown";
};

const readAttemptRecord = (payload: RecordLike, turnId: string): RecordLike | null => {
  const direct = Array.isArray(payload.runtime_tool_observations)
    ? payload.runtime_tool_observations
        .map((entry: unknown) => readRecord(entry))
        .filter((entry: RecordLike | null): entry is RecordLike => Boolean(entry))
        .at(-1)
    : null;
  if (direct) return direct;
  const artifacts = currentTurnArtifacts(payload, turnId);
  const attemptArtifact = artifacts
    .filter((artifact: HelixTurnArtifact) => /runtime_tool_(?:observation|call)|gateway_(?:observation|result)|capability_lane_(?:observation|result)/.test(artifact.kind))
    .at(-1);
  return readRecord(attemptArtifact?.payload) ?? null;
};

const normalizeAttempt = (
  payload: RecordLike,
  turnId: string,
  supplied: Partial<HelixAgentContinuationAttempt> | RecordLike | null | undefined,
): HelixAgentContinuationAttempt | null => {
  const record = readRecord(supplied) ?? readAttemptRecord(payload, turnId);
  if (!record) return null;
  const action = (readRecord(record.action) ?? readRecord(record.requested_action)) as HelixAgentContinuationAction | null;
  const args = readRecord(record.args) ?? readRecord(action?.args) ?? readRecord(record.arguments) ?? {};
  const capabilityId =
    readString(record.capability_id) ??
    readString(record.capability) ??
    readString(record.chosen_capability) ??
    readString(record.tool_name) ??
    (readString(action?.panel_id) && readString(action?.action_id)
      ? `${readString(action?.panel_id)}.${readString(action?.action_id)}`
      : null);
  const rawStatus = (
    readString(record.status) ??
    (readString(record.schema) === HELIX_TERMINAL_REJECTION_OBSERVATION_SCHEMA ? "failed" : null) ??
    (readBoolean(record.ok) === true ? "succeeded" : readBoolean(record.ok) === false ? "failed" : "unknown")
  ).toLowerCase();
  const status: HelixAgentContinuationAttempt["status"] =
    /success|succeeded|complete|observed|ok/.test(rawStatus)
      ? "succeeded"
      : /block|forbid|denied/.test(rawStatus)
        ? "blocked"
        : /fail|error|invalid/.test(rawStatus)
          ? "failed"
          : /pending|running/.test(rawStatus)
            ? "pending"
            : "unknown";
  const failureCode =
    readString(record.failure_code) ??
    readString(record.error_code) ??
    readString(record.rejection_reason) ??
    readString(readRecord(record.error)?.code) ??
    null;
  const failureMessage =
    readString(record.failure_message) ??
    readString(record.message) ??
    readString(readRecord(record.error)?.message) ??
    null;
  const explicitFailureClass = readString(record.failure_class);
  const failureClass = status === "succeeded"
    ? "none"
    : [
        "none",
        "invalid_args",
        "permission",
        "missing_evidence",
        "temporary",
        "provider",
        "route",
        "terminal_authority",
        "unknown",
      ].includes(explicitFailureClass ?? "")
      ? explicitFailureClass as HelixAgentContinuationFailureClass
      : classifyFailure(failureCode, failureMessage);
  const fingerprint =
    readString(record.action_fingerprint) ??
    readString(record.fingerprint) ??
    actionFingerprint(capabilityId, action, args);
  return {
    attempt_id:
      readString(record.attempt_id) ??
      readString(record.observation_id) ??
      readString(record.call_id) ??
      null,
    capability_id: capabilityId,
    action_fingerprint: fingerprint,
    status,
    failure_class: failureClass,
    failure_code: failureCode,
    failure_message: failureMessage,
    retryability: classifyRetryability({ record, status, failureClass, code: failureCode, message: failureMessage }),
    observation_refs: uniqueStrings([
      record.observation_refs,
      record.observed_artifact_refs,
      record.observation_ref,
      record.artifact_ref,
      record.receipt_ref,
    ]),
  };
};

const collectTriedFingerprints = (
  payload: RecordLike,
  previousState: HelixAgentContinuationState | null,
  lastAttempt: HelixAgentContinuationAttempt | null,
): string[] => {
  const values: unknown[] = [previousState?.tried_action_fingerprints, lastAttempt?.action_fingerprint];
  const loop = readRecord(payload.agent_runtime_loop);
  const iterations = Array.isArray(loop?.iterations) ? loop.iterations : [];
  for (const rawIteration of iterations) {
    const iteration = readRecord(rawIteration);
    values.push(iteration?.action_fingerprint, iteration?.executed_action_fingerprint);
    const capability = readString(iteration?.chosen_capability) ?? readString(iteration?.executed_action_key);
    if (capability) values.push(`capability:${capability}`);
  }
  return uniqueStrings(values);
};

const normalizeAffordanceCandidate = (args: {
  value: unknown;
  sourceRef: string | null;
  reason?: string | null;
  triedFingerprints: Set<string>;
}): HelixAgentContinuationAffordance | null => {
  const record = readRecord(args.value);
  if (!record) return null;
  const action = (readRecord(record.action) ?? readRecord(record.suggested_action)) as HelixAgentContinuationAction | null;
  const affordanceArgs = readRecord(record.args) ?? readRecord(record.suggested_args) ?? readRecord(action?.args) ?? {};
  const capabilityId =
    readString(record.capability_id) ??
    readString(record.capability) ??
    readString(record.suggested_capability) ??
    readString(record.tool_name) ??
    (readString(action?.panel_id) && readString(action?.action_id)
      ? `${readString(action?.panel_id)}.${readString(action?.action_id)}`
      : null);
  if (!capabilityId && !action) return null;
  const fingerprint = actionFingerprint(capabilityId, action, affordanceArgs);
  const capabilityOnlyFingerprint = capabilityId ? `capability:${capabilityId}` : null;
  return {
    affordance_id:
      readString(record.affordance_id) ??
      readString(record.hint_id) ??
      `affordance:${hashShort([capabilityId, action, affordanceArgs])}`,
    capability_id: capabilityId,
    action,
    args: affordanceArgs,
    source_ref: args.sourceRef,
    reason: args.reason ?? readString(record.reason),
    admissible: readBoolean(record.admissible) ?? readBoolean(record.allowed) ?? true,
    tried: args.triedFingerprints.has(fingerprint) || Boolean(capabilityOnlyFingerprint && args.triedFingerprints.has(capabilityOnlyFingerprint)),
    action_fingerprint: fingerprint,
  };
};

const collectAffordances = (
  payload: RecordLike,
  turnId: string,
  triedFingerprints: string[],
): HelixAgentContinuationAffordance[] => {
  const tried = new Set(triedFingerprints);
  const candidates: HelixAgentContinuationAffordance[] = [];
  const push = (value: unknown, sourceRef: string | null, reason?: string | null): void => {
    const values = Array.isArray(value) ? value : [value];
    for (const entry of values) {
      const normalized = normalizeAffordanceCandidate({ value: entry, sourceRef, reason, triedFingerprints: tried });
      if (normalized) candidates.push(normalized);
    }
  };
  for (const rawHint of Array.isArray(payload.runtime_continuation_hints) ? payload.runtime_continuation_hints : []) {
    const hint = readRecord(rawHint);
    push(hint, readString(hint?.hint_id), readString(hint?.reason));
  }
  for (const artifact of currentTurnArtifacts(payload, turnId)) {
    const artifactPayload = readRecord(artifact.payload);
    push(artifactPayload?.next_affordances, artifact.artifact_id);
    push(artifactPayload?.next_admissible_affordances, artifact.artifact_id);
  }
  const available = readRecord(payload.available_capabilities);
  for (const rawCapability of Array.isArray(available?.capabilities) ? available.capabilities : []) {
    const capability = readRecord(rawCapability);
    if (!capability || readBoolean(capability.allowed) === false || readBoolean(capability.admissible) === false) continue;
    if (readString(capability.goal_fit) !== "primary" && readBoolean(capability.recommended) !== true) continue;
    push(capability, readString(available?.artifact_id) ?? `${turnId}:available_capabilities`);
  }
  return candidates.filter((candidate: HelixAgentContinuationAffordance, index: number, all: HelixAgentContinuationAffordance[]) =>
    all.findIndex((entry: HelixAgentContinuationAffordance) => entry.action_fingerprint === candidate.action_fingerprint) === index,
  );
};

const dimension = (max: number | null, consumed: number): HelixAgentContinuationBudgetDimension => ({
  max,
  consumed: Math.max(0, consumed),
  remaining: max === null ? null : Math.max(0, max - consumed),
});

const readBudget = (payload: RecordLike): HelixAgentContinuationBudget => {
  const budget = readRecord(payload.agent_loop_budget) ?? readRecord(payload.budget) ?? {};
  const loop = readRecord(payload.agent_runtime_loop) ?? {};
  const softMaxIterations = readNumber(loop.max_iterations) ?? readNumber(budget.max_iterations);
  const softMaxTools = readNumber(loop.max_tool_calls) ?? readNumber(budget.max_tool_calls);
  const softMaxDecisions = readNumber(loop.max_llm_decisions) ?? readNumber(budget.max_llm_decisions);
  const hardMaxIterations = readNumber(loop.hard_max_iterations) ?? readNumber(budget.hard_max_iterations) ?? softMaxIterations;
  const hardMaxTools = readNumber(loop.hard_max_tool_calls) ?? readNumber(budget.hard_max_tool_calls) ?? softMaxTools;
  const hardMaxDecisions = readNumber(loop.hard_max_llm_decisions) ?? readNumber(budget.hard_max_llm_decisions) ?? softMaxDecisions;
  const consumedIterations =
    (Array.isArray(loop.iterations) ? loop.iterations.length : null) ??
    readNumber(budget.consumed_iterations) ??
    0;
  const consumedTools = readNumber(loop.executed_tool_call_count) ?? readNumber(budget.consumed_tool_calls) ?? 0;
  const consumedDecisions = readNumber(loop.llm_decision_count) ?? readNumber(budget.consumed_llm_decisions) ?? 0;
  const soft = {
    iterations: dimension(softMaxIterations, consumedIterations),
    tool_calls: dimension(softMaxTools, consumedTools),
    model_decisions: dimension(softMaxDecisions, consumedDecisions),
  };
  const hard = {
    iterations: dimension(hardMaxIterations, consumedIterations),
    tool_calls: dimension(hardMaxTools, consumedTools),
    model_decisions: dimension(hardMaxDecisions, consumedDecisions),
  };
  const softRemaining = ([soft.iterations.remaining, soft.tool_calls.remaining, soft.model_decisions.remaining] as Array<number | null>)
    .filter((value: number | null): value is number => value !== null);
  const hardRemaining = ([hard.iterations.remaining, hard.tool_calls.remaining, hard.model_decisions.remaining] as Array<number | null>)
    .filter((value: number | null): value is number => value !== null);
  const softExhausted = softRemaining.some((value: number) => value <= 0);
  const softApproaching = !softExhausted && softRemaining.some((value: number) => value <= 1);
  return {
    soft: {
      ...soft,
      pressure: softExhausted ? "exhausted" : softApproaching ? "approaching" : "none",
      exhausted: softExhausted,
    },
    hard: {
      ...hard,
      exhausted: hardRemaining.some((value: number) => value <= 0),
    },
    extension_count: readNumber(loop.budget_extension_count) ?? readNumber(budget.budget_extension_count) ?? 0,
    max_extensions: readNumber(loop.max_extensions) ?? readNumber(budget.max_extensions),
  };
};

const resolveAllowedDecisions = (args: {
  goalStatus: HelixAgentContinuationGoalStatus;
  goalSatisfied: boolean;
  lastAttempt: HelixAgentContinuationAttempt | null;
  affordances: HelixAgentContinuationAffordance[];
  missingRequirementIds: string[];
  budget: HelixAgentContinuationBudget;
}): HelixAgentContinuationDecision[] => {
  const decisions = new Set<HelixAgentContinuationDecision>();
  decisions.add("answer");
  if (args.goalSatisfied) return ["answer"];
  if (!args.budget.hard.exhausted && args.affordances.some((affordance: HelixAgentContinuationAffordance) => affordance.admissible && !affordance.tried)) {
    decisions.add("act");
  }
  if (!args.budget.hard.exhausted && args.lastAttempt?.retryability === "retryable") decisions.add("retry");
  if (
    args.goalStatus === "needs_user_input" ||
    args.lastAttempt?.retryability === "requires_user_input" ||
    (args.missingRequirementIds.length > 0 && !decisions.has("act") && !decisions.has("retry"))
  ) {
    decisions.add("ask_user");
  }
  if (
    args.budget.hard.exhausted ||
    args.lastAttempt?.retryability === "non_retryable" ||
    args.goalStatus === "blocked"
  ) {
    decisions.add("fail");
  }
  return ["act", "retry", "ask_user", "answer", "fail"].filter((decision) => decisions.has(decision as HelixAgentContinuationDecision)) as HelixAgentContinuationDecision[];
};

export const buildHelixAgentContinuationState = (
  args: BuildHelixAgentContinuationStateArgs,
): HelixAgentContinuationState => {
  const previousState = args.previousState ?? null;
  const sequence = previousState ? previousState.sequence + 1 : 1;
  const observations = collectObservationRefs(args.payload, args.turnId);
  const previousObservations = new Set(previousState?.observation_refs.all ?? []);
  const newObservations = observations.filter((ref: string) => !previousObservations.has(ref));
  const existingObservations = observations.filter((ref: string) => previousObservations.has(ref));
  const missingRequirementIds = collectMissingRequirementIds(args.payload);
  const previousMissing = new Set(previousState?.missing_requirement_ids ?? []);
  const currentMissing = new Set(missingRequirementIds);
  const resolvedRequirements = [...previousMissing].filter((id: string) => !currentMissing.has(id));
  const addedRequirements = missingRequirementIds.filter((id: string) => !previousMissing.has(id));
  const lastAttempt = normalizeAttempt(args.payload, args.turnId, args.lastAttempt);
  const triedFingerprints = collectTriedFingerprints(args.payload, previousState, lastAttempt);
  const affordances = collectAffordances(args.payload, args.turnId, triedFingerprints);
  const previousAffordanceIds = new Set(previousState?.next_admissible_affordances.map((entry: HelixAgentContinuationAffordance) => entry.affordance_id) ?? []);
  const newAffordanceCount = affordances.filter((entry: HelixAgentContinuationAffordance) => !previousAffordanceIds.has(entry.affordance_id)).length;
  const failedAttemptHasOnlyBookkeepingObservations = Boolean(
    lastAttempt &&
    (lastAttempt.status === "failed" || lastAttempt.status === "blocked") &&
    resolvedRequirements.length === 0 &&
    newAffordanceCount === 0,
  );
  const madeProgress =
    (newObservations.length > 0 && !failedAttemptHasOnlyBookkeepingObservations) ||
    resolvedRequirements.length > 0 ||
    newAffordanceCount > 0;
  const repeatedFingerprint = Boolean(
    previousState?.last_attempt?.action_fingerprint &&
    lastAttempt?.action_fingerprint &&
    previousState.last_attempt.action_fingerprint === lastAttempt.action_fingerprint,
  );
  const noProgressRepeatCount = madeProgress
    ? 0
    : previousState
      ? previousState.progress.no_progress_repeat_count + (repeatedFingerprint || lastAttempt ? 1 : 0)
      : 0;
  const normalizedGoal = normalizeGoalStatus(args.payload);
  const recoverableTerminalRejectionPending = Boolean(
    args.trigger === "terminal_rejection" &&
    lastAttempt?.failure_class === "terminal_authority" &&
    lastAttempt.retryability === "retryable",
  );
  const goal = recoverableTerminalRejectionPending
    ? {
        status: "in_progress" as const,
        satisfied: false,
        terminalProductAllowed: false,
      }
    : normalizedGoal;
  const budget = readBudget(args.payload);
  const reasonCodes = uniqueStrings([
    newObservations.length > 0 ? "new_observation" : null,
    resolvedRequirements.length > 0 ? "requirements_resolved" : null,
    addedRequirements.length > 0 ? "requirements_added" : null,
    newAffordanceCount > 0 ? "new_affordance" : null,
    repeatedFingerprint && !madeProgress ? "repeated_action_without_progress" : null,
    failedAttemptHasOnlyBookkeepingObservations ? "failed_attempt_observation_only" : null,
    budget.soft.pressure !== "none" ? `soft_budget_${budget.soft.pressure}` : null,
    budget.hard.exhausted ? "hard_resource_boundary_exhausted" : null,
    !previousState ? "initial_continuation_state" : null,
  ]);
  const allowedDecisions = resolveAllowedDecisions({
    goalStatus: goal.status,
    goalSatisfied: goal.satisfied,
    lastAttempt,
    affordances,
    missingRequirementIds,
    budget,
  });
  return {
    schema: HELIX_AGENT_CONTINUATION_STATE_SCHEMA,
    turn_id: args.turnId,
    state_id: `${args.turnId}:agent_continuation_state:${sequence}:${hashShort([
      args.trigger,
      observations,
      missingRequirementIds,
      lastAttempt?.action_fingerprint,
    ])}`,
    sequence,
    trigger: args.trigger,
    goal: {
      status: goal.status,
      satisfied: goal.satisfied,
      terminal_product_allowed: goal.terminalProductAllowed,
    },
    observation_refs: {
      all: observations,
      existing: existingObservations,
      new: newObservations,
    },
    missing_requirement_ids: missingRequirementIds,
    last_attempt: lastAttempt,
    next_admissible_affordances: affordances,
    tried_action_fingerprints: triedFingerprints,
    progress: {
      made_progress: madeProgress,
      new_observation_count: newObservations.length,
      resolved_requirement_ids: resolvedRequirements,
      added_requirement_ids: addedRequirements,
      new_affordance_count: newAffordanceCount,
      no_progress_repeat_count: noProgressRepeatCount,
      reason_codes: reasonCodes,
    },
    budget,
    allowed_decisions: allowedDecisions,
    authority: "runtime_agent_decides_within_admitted_boundaries",
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};

export const appendHelixAgentContinuationStateToPayload = (args: {
  payload: RecordLike;
  state: HelixAgentContinuationState;
}): void => {
  const existingStates = Array.isArray(args.payload.agent_continuation_states)
    ? (args.payload.agent_continuation_states as unknown[])
        .map((value) => readRecord(value) as HelixAgentContinuationState | null)
        .filter((value): value is HelixAgentContinuationState => Boolean(value?.schema === HELIX_AGENT_CONTINUATION_STATE_SCHEMA))
    : [];
  const states = [...existingStates, args.state]
    .filter((state: HelixAgentContinuationState, index: number, all: HelixAgentContinuationState[]) =>
      all.findIndex((candidate: HelixAgentContinuationState) => candidate.state_id === state.state_id) === index,
    )
    .slice(-HELIX_AGENT_CONTINUATION_STATE_HISTORY_LIMIT);
  args.payload.agent_continuation_state = args.state;
  args.payload.agent_continuation_states = states;
  const ledger = Array.isArray(args.payload.current_turn_artifact_ledger)
    ? (args.payload.current_turn_artifact_ledger as HelixTurnArtifact[])
    : [];
  args.payload.current_turn_artifact_ledger = appendBoundedArtifactHistory({
    ledger,
    kind: "agent_continuation_state",
    limit: HELIX_AGENT_CONTINUATION_STATE_HISTORY_LIMIT,
    artifact: {
      artifact_id: args.state.state_id,
      turn_id: args.state.turn_id,
      producer_item_id: "agent_continuation_state",
      kind: "agent_continuation_state",
      created_at_ms: Date.now(),
      source_scope: "current_turn",
      payload: args.state as unknown as RecordLike,
    },
  });
  const debug = readRecord(args.payload.debug);
  if (debug) {
    debug.agent_continuation_state = args.state;
    debug.agent_continuation_states = states;
    debug.current_turn_artifact_ledger = args.payload.current_turn_artifact_ledger;
  }
};

export const terminalRejectionIsRecoverable = (reason: string): boolean =>
  RECOVERABLE_TERMINAL_REJECTION_REASONS.has(reason);

export const buildHelixTerminalRejectionObservation = (args: {
  turnId: string;
  candidateKind?: string | null;
  candidateRef?: string | null;
  reason: string;
}): HelixTerminalRejectionObservation => {
  const recoverable = terminalRejectionIsRecoverable(args.reason);
  return {
    schema: HELIX_TERMINAL_REJECTION_OBSERVATION_SCHEMA,
    turn_id: args.turnId,
    observation_id: `${args.turnId}:terminal_rejection_observation:${hashShort([
      args.candidateKind,
      args.candidateRef,
      args.reason,
    ])}`,
    rejected_candidate_kind: args.candidateKind ?? null,
    rejected_candidate_ref: args.candidateRef ?? null,
    rejection_reason: args.reason,
    recoverable,
    failure_class: "terminal_authority",
    retryability: recoverable ? "retryable" : "non_retryable",
    next_affordances: recoverable
      ? [{ decision: "answer", reason: "Produce a route-approved answer grounded in the observations already re-entered." }]
      : [{ decision: "fail", reason: "The candidate conflicts with the committed route or terminal policy." }],
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};

export const appendHelixTerminalRejectionObservationToPayload = (args: {
  payload: RecordLike;
  observation: HelixTerminalRejectionObservation;
}): void => {
  const observations = Array.isArray(args.payload.terminal_rejection_observations)
    ? (args.payload.terminal_rejection_observations as unknown[])
        .map((value) => readRecord(value) as HelixTerminalRejectionObservation | null)
        .filter((value): value is HelixTerminalRejectionObservation => Boolean(value?.schema === HELIX_TERMINAL_REJECTION_OBSERVATION_SCHEMA))
    : [];
  args.payload.terminal_rejection_observations = [...observations, args.observation]
    .filter((entry: HelixTerminalRejectionObservation, index: number, all: HelixTerminalRejectionObservation[]) =>
      all.findIndex((candidate: HelixTerminalRejectionObservation) => candidate.observation_id === entry.observation_id) === index,
    )
    .slice(-HELIX_TERMINAL_REJECTION_OBSERVATION_HISTORY_LIMIT);
  const ledger = Array.isArray(args.payload.current_turn_artifact_ledger)
    ? (args.payload.current_turn_artifact_ledger as HelixTurnArtifact[])
    : [];
  args.payload.current_turn_artifact_ledger = appendBoundedArtifactHistory({
    ledger,
    kind: "terminal_rejection_observation",
    limit: HELIX_TERMINAL_REJECTION_OBSERVATION_HISTORY_LIMIT,
    artifact: {
      artifact_id: args.observation.observation_id,
      turn_id: args.observation.turn_id,
      producer_item_id: "terminal_authority",
      kind: "terminal_rejection_observation",
      created_at_ms: Date.now(),
      source_scope: "current_turn",
      payload: args.observation as unknown as RecordLike,
    },
  });
  const debug = readRecord(args.payload.debug);
  if (debug) {
    debug.terminal_rejection_observations = args.payload.terminal_rejection_observations;
    debug.current_turn_artifact_ledger = args.payload.current_turn_artifact_ledger;
  }
};

export const resolveHelixContinuationBudgetExtension = (args: {
  state: HelixAgentContinuationState;
  current: { iterations: number; tool_calls: number; model_decisions: number };
  hard: { iterations: number; tool_calls: number; model_decisions: number };
}): HelixContinuationBudgetExtensionDecision => {
  const none = (reason: string): HelixContinuationBudgetExtensionDecision => ({
    extend: false,
    reason,
    increments: { iterations: 0, tool_calls: 0, model_decisions: 0 },
  });
  if (args.state.goal.satisfied) return none("goal_already_satisfied");
  if (args.state.budget.hard.exhausted) return none("hard_resource_boundary_exhausted");
  if (args.state.budget.soft.pressure === "none") return none("soft_budget_not_under_pressure");
  if (
    args.state.budget.max_extensions !== null &&
    args.state.budget.extension_count >= args.state.budget.max_extensions
  ) {
    return none("maximum_budget_extensions_reached");
  }
  if (args.state.progress.no_progress_repeat_count >= 2) return none("repeated_no_progress_boundary_reached");
  const hasUntriedAffordance = args.state.next_admissible_affordances.some((entry: HelixAgentContinuationAffordance) => entry.admissible && !entry.tried);
  const hasRetryableAttempt = args.state.last_attempt?.retryability === "retryable";
  if (!args.state.progress.made_progress && !hasUntriedAffordance && !hasRetryableAttempt) {
    return none("no_progress_or_untried_admissible_action");
  }
  const proposed = {
    iterations: Math.max(0, Math.min(2, args.hard.iterations - args.current.iterations)),
    tool_calls: Math.max(0, Math.min(1, args.hard.tool_calls - args.current.tool_calls)),
    model_decisions: Math.max(0, Math.min(2, args.hard.model_decisions - args.current.model_decisions)),
  };
  if (proposed.iterations === 0 && proposed.tool_calls === 0 && proposed.model_decisions === 0) {
    return none("hard_resource_boundary_has_no_remaining_capacity");
  }
  return {
    extend: true,
    reason: args.state.progress.made_progress
      ? "progress_under_soft_budget_pressure"
      : hasUntriedAffordance
        ? "untried_admissible_affordance_under_soft_budget_pressure"
        : "retryable_failure_under_soft_budget_pressure",
    increments: proposed,
  };
};

export const formatHelixAgentContinuationStateForRuntime = (
  state: HelixAgentContinuationState,
): string => [
  "Helix continuation state (non-terminal adapter evidence):",
  JSON.stringify(state, null, 2),
  "Choose exactly one allowed decision. Tools and retries require an admitted affordance; answer when the user goal is satisfied or when a bounded best-effort answer is appropriate. Budgets are resource boundaries, not conclusions.",
].join("\n");
