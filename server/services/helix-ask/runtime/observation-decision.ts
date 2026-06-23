type HelixAskTurnPlanLane = "workspace" | "reasoning" | "conversation";
type HelixAskTurnPlanStepStatus = "planned" | "started" | "completed" | "failed" | "suppressed";

type HelixAskTurnSelectedAction = {
  panel_id: string;
  action_id: string;
  args: Record<string, unknown>;
};

type HelixAskTurnPlanStep = {
  id: string;
  lane: HelixAskTurnPlanLane;
  title: string;
  status: HelixAskTurnPlanStepStatus;
  action?: HelixAskTurnSelectedAction | null;
  reason?: string | null;
  required_artifacts?: string[];
};

type HelixAskTurnRuntimeDecision =
  | { kind: "continue"; next_step: HelixAskTurnPlanStep; reason: string }
  | { kind: "request_input"; required_fields: string[]; reason: string }
  | { kind: "final_answer"; text: string; reason: string }
  | { kind: "final_failure"; text: string; error_code: string; reason: string };

type HelixAskTurnRuntime = {
  required_artifacts: string[];
  satisfied_artifacts: string[];
  artifact_store: Record<string, unknown>;
  pending_request: Record<string, unknown> | null;
  last_decision: HelixAskTurnRuntimeDecision | null;
  failed_subgoals: string[];
};

type HelixAskUniversalGoalFrame = {
  user_goal: {
    raw: string;
  };
};

type HelixAskCapabilitySelectionResult = {
  ambiguity: {
    status: "none" | "low_confidence" | "missing_args" | "multiple_targets";
  };
} | null;

type HelixAskStepResult = {
  actual_artifacts?: unknown[];
  expected_artifacts?: unknown[];
  contract_pass?: boolean | null;
};

type HelixAskObservationDecision = {
  decision: "continue" | "request_user_input" | "finalize" | "typed_failure";
  reason: string;
  satisfied_artifacts: string[];
  missing_artifacts: string[];
  unresolved_ambiguity: boolean;
  next_capability?: {
    capability_id: string;
    args: Record<string, unknown>;
    required_artifacts: string[];
    expected_observation: {
      kind: string;
      summary: string;
    };
  } | null;
  terminal_allowed: boolean;
};

export type HelixAskObservationDecisionDependencies = {
  filterLatestDocSearchFallbackMissingArtifacts: (args: {
    transcript: string;
    missingArtifacts: string[];
    hasDocSearchResults: boolean;
    hasRepoCodeEvidenceObservation: boolean;
  }) => string[];
  collectMissingRequiredArtifacts: (runtime: HelixAskTurnRuntime) => string[];
  collectUnsatisfiedResultArtifacts: (stepResults: HelixAskStepResult[]) => string[];
};

const capabilityIdFromAskTurnStep = (step: HelixAskTurnPlanStep | null | undefined): string | null => {
  const action = step?.action;
  if (action?.panel_id && action?.action_id) return `${action.panel_id}.${action.action_id}`;
  if (step?.lane === "reasoning") return "reasoning.followup";
  return null;
};

export const createAskTurnObservationDecisionBuilder = (
  deps: HelixAskObservationDecisionDependencies,
) => (args: {
  runtime: HelixAskTurnRuntime;
  goalFrame: HelixAskUniversalGoalFrame;
  capabilitySelection: HelixAskCapabilitySelectionResult;
  completedStep: HelixAskTurnPlanStep | null;
  stepResults: HelixAskStepResult[];
  nextPlannedStep?: HelixAskTurnPlanStep | null;
}): HelixAskObservationDecision => {
  const missingArtifacts = deps.filterLatestDocSearchFallbackMissingArtifacts({
    transcript: args.goalFrame.user_goal.raw,
    missingArtifacts: Array.from(
      new Set([
        ...deps.collectMissingRequiredArtifacts(args.runtime),
        ...deps.collectUnsatisfiedResultArtifacts(args.stepResults),
      ]),
    ).filter(Boolean),
    hasDocSearchResults: "doc_search_results" in args.runtime.artifact_store,
    hasRepoCodeEvidenceObservation: "repo_code_evidence_observation" in args.runtime.artifact_store,
  });
  const satisfiedArtifacts = Array.from(
    new Set([
      ...args.runtime.satisfied_artifacts,
      ...args.stepResults.flatMap((result) =>
        Array.isArray(result.actual_artifacts)
          ? result.actual_artifacts.map((artifact) => String(artifact ?? "").trim()).filter(Boolean)
          : [],
      ),
      ...Object.keys(args.runtime.artifact_store),
    ]),
  ).sort();
  const pendingRequest = args.runtime.pending_request;
  if (args.completedStep?.id === "request_user_input" || args.completedStep?.lane === "conversation" && args.completedStep?.reason === "missing_required_args") {
    return {
      decision: "request_user_input",
      reason: "request_user_input_step_observed",
      satisfied_artifacts: satisfiedArtifacts,
      missing_artifacts: missingArtifacts,
      unresolved_ambiguity: true,
      next_capability: null,
      terminal_allowed: false,
    };
  }
  const ambiguityStatus = args.capabilitySelection?.ambiguity?.status ?? "none";
  const unresolvedAmbiguity =
    Boolean(pendingRequest) ||
    (ambiguityStatus !== "none" && ambiguityStatus !== "low_confidence" && missingArtifacts.length > 0);
  const nextStep =
    args.nextPlannedStep ??
    (args.runtime.last_decision?.kind === "continue" ? args.runtime.last_decision.next_step : null);
  const nextCapabilityId = capabilityIdFromAskTurnStep(nextStep);
  const terminalAllowed = missingArtifacts.length === 0 && !pendingRequest && !unresolvedAmbiguity;
  if (pendingRequest || unresolvedAmbiguity) {
    return {
      decision: "request_user_input",
      reason: pendingRequest ? "pending_request_active" : `unresolved_ambiguity:${ambiguityStatus}`,
      satisfied_artifacts: satisfiedArtifacts,
      missing_artifacts: missingArtifacts,
      unresolved_ambiguity: true,
      next_capability: null,
      terminal_allowed: false,
    };
  }
  if (missingArtifacts.length > 0) {
    return {
      decision: nextStep ? "continue" : "request_user_input",
      reason: nextStep ? `missing_artifacts_next_capability:${missingArtifacts.join(",")}` : `missing_artifacts:${missingArtifacts.join(",")}`,
      satisfied_artifacts: satisfiedArtifacts,
      missing_artifacts: missingArtifacts,
      unresolved_ambiguity: false,
      next_capability: nextStep && nextCapabilityId
        ? {
            capability_id: nextCapabilityId,
            args: nextStep.action?.args ?? {},
            required_artifacts: Array.isArray(nextStep.required_artifacts) ? nextStep.required_artifacts : [],
            expected_observation: {
              kind: Array.isArray(nextStep.required_artifacts) && nextStep.required_artifacts[0]
                ? nextStep.required_artifacts[0]
                : "workspace_observation",
              summary: nextStep.title,
            },
          }
        : null,
      terminal_allowed: false,
    };
  }
  if (nextStep && nextCapabilityId) {
    return {
      decision: "continue",
      reason: "next_planned_step_available",
      satisfied_artifacts: satisfiedArtifacts,
      missing_artifacts: [],
      unresolved_ambiguity: false,
      next_capability: {
        capability_id: nextCapabilityId,
        args: nextStep.action?.args ?? {},
        required_artifacts: Array.isArray(nextStep.required_artifacts) ? nextStep.required_artifacts : [],
        expected_observation: {
          kind: Array.isArray(nextStep.required_artifacts) && nextStep.required_artifacts[0]
            ? nextStep.required_artifacts[0]
            : "workspace_observation",
          summary: nextStep.title,
        },
      },
      terminal_allowed: false,
    };
  }
  if (args.completedStep?.status === "failed" || args.runtime.failed_subgoals.length > 0) {
    return {
      decision: "typed_failure",
      reason: args.completedStep?.reason ?? "failed_subgoal_observed",
      satisfied_artifacts: satisfiedArtifacts,
      missing_artifacts: missingArtifacts,
      unresolved_ambiguity: false,
      next_capability: null,
      terminal_allowed: false,
    };
  }
  return {
    decision: "finalize",
    reason: "all_required_artifacts_satisfied",
    satisfied_artifacts: satisfiedArtifacts,
    missing_artifacts: [],
    unresolved_ambiguity: false,
    next_capability: null,
    terminal_allowed: terminalAllowed,
  };
};
