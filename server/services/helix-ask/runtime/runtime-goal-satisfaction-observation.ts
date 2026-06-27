type RecordLike = Record<string, unknown>;

type HelixTurnArtifact = {
  artifact_id: string;
  turn_id?: string;
  producer_item_id?: string;
  kind: string;
  created_at_ms?: number;
  source_scope?: "current_turn" | "prior_turn_context" | "workspace_state" | string;
  goal_hash?: string;
  payload?: RecordLike;
};

type HelixGoalSatisfactionEvaluation = RecordLike & {
  satisfaction: "satisfied" | "partially_satisfied" | "not_satisfied" | "needs_user_input";
  next_decision: "allow_terminal" | "continue" | "retry" | "request_user_input" | "fail_closed";
  required_actions?: Array<RecordLike & { action_key?: string; satisfied?: boolean }>;
  required_evidence?: Array<RecordLike & { kind?: string; satisfied?: boolean }>;
};

type HelixAskTurnSatisfactionReport = RecordLike & {
  missing_artifacts?: string[];
};

export type HelixRuntimeGoalSatisfactionObservation = {
  schema: "helix.runtime_goal_satisfaction_observation.v1";
  turn_id: string;
  observation_id: string;
  iteration: number;
  trigger:
    | "preobserved_tool_result"
    | "runtime_tool_observation"
    | "coverage_missing_requirements"
    | "invalid_tool_call_observation"
    | "duplicate_tool_call_observation"
    | "answer_blocked_goal_not_satisfied"
    | "needs_user_input"
    | "model_direct_answer_observation"
    | "terminal_satisfied_review";
  triggering_artifact_refs: string[];
  evaluation_ref: string;
  satisfaction: HelixGoalSatisfactionEvaluation["satisfaction"];
  next_decision: HelixGoalSatisfactionEvaluation["next_decision"];
  missing_requirement_ids: string[];
  model_must_review: true;
  assistant_answer: false;
  raw_content_included: false;
};

type HelixDebugEvidenceRequirementPolicy = RecordLike & {
  suppressed: boolean;
};

export type HelixRuntimeGoalSatisfactionObservationDependencies = {
  readString: (value: unknown) => string | null;
  hashPayloadShort: (value: unknown, length?: number) => string;
  mergeLedgerArtifacts: (artifacts: HelixTurnArtifact[]) => HelixTurnArtifact[];
  resolveDebugEvidenceRequirementPolicy: (args: {
    payload: RecordLike;
    goalSatisfactionEvaluation?: HelixGoalSatisfactionEvaluation | null;
    satisfactionReport?: HelixAskTurnSatisfactionReport | null;
  }) => HelixDebugEvidenceRequirementPolicy;
  applyDebugEvidenceRequirementPolicyToPayload: (
    payload: RecordLike,
    policy: HelixDebugEvidenceRequirementPolicy,
  ) => void;
  nowMs?: () => number;
};

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

export const collectHelixLoopMissingRequirementIds = (args: {
  payload: RecordLike;
  goalSatisfactionEvaluation?: HelixGoalSatisfactionEvaluation | null;
  satisfactionReport?: HelixAskTurnSatisfactionReport | null;
  dependencies: HelixRuntimeGoalSatisfactionObservationDependencies;
}): string[] => {
  const missing = new Set<string>();
  const add = (value: unknown): void => {
    const text = args.dependencies.readString(value);
    if (text) missing.add(text);
  };
  const coverageKeys = [
    "calculator_plan_coverage",
    "doc_open_coverage",
    "doc_location_coverage",
    "visual_capture_coverage",
    "notes_mutation_coverage",
    "live_source_coverage",
  ];
  for (const key of coverageKeys) {
    const record = readRecord(args.payload[key]);
    if (!record) continue;
    if (Array.isArray(record.missing_requirement_ids)) {
      record.missing_requirement_ids.forEach(add);
    }
    if (Array.isArray(record.required_items)) {
      for (const item of record.required_items) {
        const itemRecord = readRecord(item);
        if (!itemRecord) continue;
        if (itemRecord.satisfied !== true) add(itemRecord.id ?? itemRecord.kind ?? itemRecord.action_key);
      }
    }
  }
  for (const action of args.goalSatisfactionEvaluation?.required_actions ?? []) {
    if (!action.satisfied) add(action.action_key);
  }
  for (const evidence of args.goalSatisfactionEvaluation?.required_evidence ?? []) {
    if (!evidence.satisfied) add(evidence.kind);
  }
  for (const missingArtifact of args.satisfactionReport?.missing_artifacts ?? []) add(missingArtifact);
  const debugEvidencePolicy = args.dependencies.resolveDebugEvidenceRequirementPolicy({
    payload: args.payload,
    goalSatisfactionEvaluation: args.goalSatisfactionEvaluation ?? null,
    satisfactionReport: args.satisfactionReport ?? null,
  });
  args.dependencies.applyDebugEvidenceRequirementPolicyToPayload(args.payload, debugEvidencePolicy);
  if (debugEvidencePolicy.suppressed) {
    missing.delete("debug_evidence");
    missing.delete("debug_evidence_diagnosis");
  }
  return Array.from(missing);
};

export const appendHelixRuntimeGoalSatisfactionObservation = (args: {
  payload: RecordLike;
  turnId: string;
  iteration: number;
  trigger: HelixRuntimeGoalSatisfactionObservation["trigger"];
  triggeringArtifactRefs: string[];
  currentTurnArtifacts: HelixTurnArtifact[];
  goalSatisfactionEvaluation: HelixGoalSatisfactionEvaluation;
  satisfactionReport?: HelixAskTurnSatisfactionReport | null;
  dependencies: HelixRuntimeGoalSatisfactionObservationDependencies;
}): {
  observation: HelixRuntimeGoalSatisfactionObservation;
  artifact: HelixTurnArtifact;
  artifacts: HelixTurnArtifact[];
} => {
  const missingRequirementIds = collectHelixLoopMissingRequirementIds({
    payload: args.payload,
    goalSatisfactionEvaluation: args.goalSatisfactionEvaluation,
    satisfactionReport: args.satisfactionReport,
    dependencies: args.dependencies,
  });
  const observation: HelixRuntimeGoalSatisfactionObservation = {
    schema: "helix.runtime_goal_satisfaction_observation.v1",
    turn_id: args.turnId,
    observation_id: `${args.turnId}:runtime_goal_satisfaction_observation:${args.iteration}:${args.dependencies.hashPayloadShort([
      args.trigger,
      args.goalSatisfactionEvaluation.satisfaction,
      args.goalSatisfactionEvaluation.next_decision,
      missingRequirementIds,
      args.triggeringArtifactRefs,
    ])}`,
    iteration: args.iteration,
    trigger: args.trigger,
    triggering_artifact_refs: args.triggeringArtifactRefs,
    evaluation_ref: `${args.turnId}:goal_satisfaction_evaluation`,
    satisfaction: args.goalSatisfactionEvaluation.satisfaction,
    next_decision: args.goalSatisfactionEvaluation.next_decision,
    missing_requirement_ids: missingRequirementIds,
    model_must_review: true,
    assistant_answer: false,
    raw_content_included: false,
  };
  const artifact: HelixTurnArtifact = {
    artifact_id: observation.observation_id,
    turn_id: args.turnId,
    producer_item_id: "agent_runtime_goal_satisfaction",
    kind: "runtime_goal_satisfaction_observation",
    created_at_ms: args.dependencies.nowMs?.() ?? Date.now(),
    source_scope: "current_turn",
    goal_hash: args.dependencies.hashPayloadShort([
      args.turnId,
      "runtime_goal_satisfaction_observation",
      observation.satisfaction,
      observation.next_decision,
    ]),
    payload: observation as unknown as RecordLike,
  };
  const artifacts = args.dependencies.mergeLedgerArtifacts([
    ...args.currentTurnArtifacts,
    artifact,
  ]);
  args.payload.current_turn_artifact_ledger = artifacts;
  args.payload.runtime_goal_satisfaction_observations = [
    ...(Array.isArray(args.payload.runtime_goal_satisfaction_observations)
      ? args.payload.runtime_goal_satisfaction_observations
      : []),
    observation,
  ];
  const debug = readRecord(args.payload.debug);
  if (debug) {
    debug.runtime_goal_satisfaction_observations = args.payload.runtime_goal_satisfaction_observations;
    debug.current_turn_artifact_ledger = artifacts;
  }
  return { observation, artifact, artifacts };
};
