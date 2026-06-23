type HelixAskTurnDecisionSource =
  | "model_planner"
  | "capability_registry"
  | "artifact_policy"
  | "phrase_detector"
  | "legacy_fallback";

type HelixAskTurnDecisionSourceMap = {
  planner_source: HelixAskTurnDecisionSource;
  dispatch_policy_source: HelixAskTurnDecisionSource;
  selected_action_source: HelixAskTurnDecisionSource;
  goal_frame_used: boolean;
  goal_frame_goal_kind: string | null;
  capability_selector_source: string | null;
  plan_step_sources: Array<{
    step_id: string;
    title: string;
    source: HelixAskTurnDecisionSource;
    reason: string;
    capability_id: string | null;
    action_id: string | null;
    panel_id: string | null;
  }>;
  continuation_sources: Array<{
    step_id: string | null;
    source: HelixAskTurnDecisionSource;
    reason: string;
    decision: string;
    capability_id: string | null;
  }>;
  terminal_source: HelixAskTurnDecisionSource;
  fallback_used: boolean;
  phrase_detector_used: boolean;
  model_planner_used: boolean;
  capability_registry_used: boolean;
  artifact_policy_used: boolean;
};

type HelixAskDecisionSourceMapDependencies = {
  mapAskTurnRuntimeStepSource: (source: unknown, reason?: unknown) => HelixAskTurnDecisionSource;
  mapAskTurnTerminalDecisionSource: (finalAnswerSource?: string | null) => HelixAskTurnDecisionSource;
};

export const mapAskTurnRuntimeStepSource = (source: unknown, reason?: unknown): HelixAskTurnDecisionSource => {
  const normalizedSource = typeof source === "string" ? source.trim() : "";
  const normalizedReason = typeof reason === "string" ? reason.trim() : "";
  if (normalizedReason.includes("model_decision")) return "model_planner";
  if (normalizedSource === "capability_registry") return "capability_registry";
  if (normalizedSource === "artifact_policy") return "artifact_policy";
  if (normalizedSource === "fallback") return "legacy_fallback";
  return "phrase_detector";
};

export const mapAskTurnTerminalDecisionSource = (
  finalAnswerSource?: string | null,
): HelixAskTurnDecisionSource => {
  if (finalAnswerSource === "legacy_fallback" || finalAnswerSource === "client_fallback") return "legacy_fallback";
  if (
    finalAnswerSource === "universal_composer" ||
    finalAnswerSource === "artifact_synthesis" ||
    finalAnswerSource === "typed_failure" ||
    finalAnswerSource === "request_user_input"
  ) return "artifact_policy";
  return "model_planner";
};

export const createAskTurnDecisionSourceMapBuilder = (
  deps: HelixAskDecisionSourceMapDependencies,
) => (args: {
  payload: Record<string, unknown>;
  finalAnswerSource?: string | null;
}): HelixAskTurnDecisionSourceMap => {
  const payload = args.payload;
  const plannerRecord =
    payload.planner_contract && typeof payload.planner_contract === "object"
      ? (payload.planner_contract as Record<string, unknown>)
      : null;
  const runtimeSummary =
    payload.turn_runtime && typeof payload.turn_runtime === "object"
      ? (payload.turn_runtime as Record<string, unknown>)
      : null;
  const planItems = Array.isArray(plannerRecord?.plan_items)
    ? (plannerRecord.plan_items as Array<Record<string, unknown>>)
    : Array.isArray(payload.execution_trace)
      ? (payload.execution_trace as Array<Record<string, unknown>>)
      : [];
  const appendedSteps = Array.isArray(runtimeSummary?.appended_steps)
    ? (runtimeSummary.appended_steps as Array<Record<string, unknown>>)
    : [];
  const appendedById = new Map(
    appendedSteps
      .map((entry) => [String(entry.step_id ?? "").trim(), entry] as const)
      .filter(([stepId]) => Boolean(stepId)),
  );
  const capabilityTrace = Array.isArray(payload.capability_selection_trace)
    ? (payload.capability_selection_trace as Array<Record<string, unknown>>)
    : Array.isArray(runtimeSummary?.capability_selection_trace)
      ? (runtimeSummary.capability_selection_trace as Array<Record<string, unknown>>)
      : [];
  const selectedCapabilityIds = new Set(
    capabilityTrace
      .map((entry) => (typeof entry.selected_capability === "string" ? entry.selected_capability.trim() : ""))
      .filter(Boolean),
  );
  const modelAudits = Array.isArray(payload.model_decision_audits)
    ? (payload.model_decision_audits as Array<Record<string, unknown>>)
    : Array.isArray(runtimeSummary?.model_decision_audits)
      ? (runtimeSummary.model_decision_audits as Array<Record<string, unknown>>)
      : [];
  const modelStepIds = new Set(
    modelAudits
      .map((entry) => (typeof entry.next_step_id === "string" ? entry.next_step_id.trim() : ""))
      .filter(Boolean),
  );
  const modelPlannerUsed = payload.model_decision_llm_used === true || modelAudits.some((entry) => entry.used_llm === true);
  const finalAnswerSource =
    args.finalAnswerSource ??
    (typeof payload.final_answer_source === "string" ? payload.final_answer_source : null);
  const universalGoalFrame =
    payload.universal_goal_frame && typeof payload.universal_goal_frame === "object"
      ? (payload.universal_goal_frame as Record<string, unknown>)
      : null;
  const capabilitySelectionResult =
    payload.capability_selection_result && typeof payload.capability_selection_result === "object"
      ? (payload.capability_selection_result as Record<string, unknown>)
      : null;
  const terminalSource = deps.mapAskTurnTerminalDecisionSource(finalAnswerSource);
  const selectionSource = typeof plannerRecord?.selection_source === "string" ? plannerRecord.selection_source : null;
  const selectedAction =
    payload.workspace_action && typeof payload.workspace_action === "object"
      ? (payload.workspace_action as Record<string, unknown>)
      : plannerRecord?.selected_action && typeof plannerRecord.selected_action === "object"
        ? (plannerRecord.selected_action as Record<string, unknown>)
        : null;
  const hasSelectedCapabilityTrace = selectedCapabilityIds.size > 0;
  const selectedActionSource: HelixAskTurnDecisionSource =
    terminalSource === "legacy_fallback"
      ? "legacy_fallback"
      : !selectedAction
        ? "model_planner"
        : selectionSource === "llm"
          ? "model_planner"
          : hasSelectedCapabilityTrace
            ? "capability_registry"
            : "phrase_detector";
  const dispatchPolicy = typeof plannerRecord?.dispatch_policy === "string"
    ? plannerRecord.dispatch_policy
    : typeof payload.dispatch_policy === "string"
      ? payload.dispatch_policy
      : null;
  const dispatchPolicySource: HelixAskTurnDecisionSource =
    terminalSource === "legacy_fallback"
      ? "legacy_fallback"
      : dispatchPolicy === "needs_user_input"
        ? "artifact_policy"
        : selectedActionSource === "capability_registry"
          ? "capability_registry"
          : selectedAction
            ? "phrase_detector"
            : "model_planner";
  const plannerSource: HelixAskTurnDecisionSource =
    terminalSource === "legacy_fallback"
      ? "legacy_fallback"
      : selectionSource === "llm" || modelPlannerUsed || !selectedAction
        ? "model_planner"
        : selectedActionSource;
  const planStepSources = planItems.map((step) => {
    const stepId = String(step.id ?? step.step_id ?? "").trim();
    const action = step.action && typeof step.action === "object" ? (step.action as Record<string, unknown>) : null;
    const appended = appendedById.get(stepId);
    const capabilityId =
      typeof appended?.capability_id === "string"
        ? appended.capability_id
        : action
          ? `${String(action.panel_id ?? "")}.${String(action.action_id ?? "")}`.replace(/^\./, "").replace(/\.$/, "")
          : null;
    const capabilityIdText = String(capabilityId ?? "");
    const actionId = typeof action?.action_id === "string" ? action.action_id : null;
    const panelId = typeof action?.panel_id === "string" ? action.panel_id : null;
    const matchesSelectedCapability =
      selectedCapabilityIds.has(capabilityIdText) ||
      (panelId === "docs-viewer" &&
        actionId === "locate_in_doc" &&
        Array.from(selectedCapabilityIds).some((entry) => entry.startsWith("docs-viewer.locate_in_doc"))) ||
      (panelId === "workstation-notes" &&
        actionId === "append_to_note" &&
        selectedCapabilityIds.has("workstation-notes.append_to_note"));
    const source = modelStepIds.has(stepId)
      ? "model_planner"
      : appended
        ? deps.mapAskTurnRuntimeStepSource(appended.source, appended.reason)
        : matchesSelectedCapability
          ? "capability_registry"
          : action
            ? "phrase_detector"
            : plannerSource;
    return {
      step_id: stepId || "unknown_step",
      title: typeof step.title === "string" ? step.title : stepId || "Untitled step",
      source,
      reason:
        typeof appended?.reason === "string"
          ? appended.reason
          : typeof step.reason === "string"
            ? step.reason
            : source === "phrase_detector"
              ? "deterministic_action_selection"
              : "planner_step",
      capability_id: capabilityId || null,
      action_id: actionId,
      panel_id: panelId,
    };
  });
  const generalControllerDecisions = Array.isArray(payload.general_controller_decisions)
    ? (payload.general_controller_decisions as Array<Record<string, unknown>>)
    : [];
  const continuationSources = [
    ...generalControllerDecisions.map((entry) => ({
      step_id: null,
      source:
        entry.source === "llm"
          ? "model_planner" as HelixAskTurnDecisionSource
          : entry.decision === "request_user_input" || entry.decision === "finalize" || entry.reason === "terminal_artifact_satisfied"
            ? "artifact_policy" as HelixAskTurnDecisionSource
            : entry.source === "fallback"
              ? "legacy_fallback" as HelixAskTurnDecisionSource
              : "capability_registry" as HelixAskTurnDecisionSource,
      reason: typeof entry.reason === "string" ? entry.reason : "general_controller_decision",
      decision: typeof entry.decision === "string" ? entry.decision : "unknown",
      capability_id: typeof entry.selected_capability === "string" ? entry.selected_capability : null,
    })),
    ...modelAudits.map((entry) => ({
      step_id: typeof entry.step_id === "string" ? entry.step_id : null,
      source: entry.used_llm === true ? "model_planner" as HelixAskTurnDecisionSource : "artifact_policy" as HelixAskTurnDecisionSource,
      reason: typeof entry.summary === "string" ? entry.summary : "model_decision_audit",
      decision: typeof entry.action === "string" ? entry.action : "unknown",
      capability_id: typeof entry.next_capability === "string" ? entry.next_capability : null,
    })),
  ];
  const sourceValues = [
    plannerSource,
    dispatchPolicySource,
    selectedActionSource,
    terminalSource,
    ...planStepSources.map((entry) => entry.source),
    ...continuationSources.map((entry) => entry.source),
  ];
  const fallbackUsed =
    terminalSource === "legacy_fallback" ||
    finalAnswerSource === "legacy_fallback" ||
    finalAnswerSource === "client_fallback" ||
    payload.final_answer_source === "legacy_fallback" ||
    payload.final_answer_source === "client_fallback";
  const userGoal =
    universalGoalFrame?.user_goal && typeof universalGoalFrame.user_goal === "object"
      ? (universalGoalFrame.user_goal as Record<string, unknown>)
      : null;
  return {
    planner_source: plannerSource,
    dispatch_policy_source: dispatchPolicySource,
    selected_action_source: selectedActionSource,
    goal_frame_used: Boolean(universalGoalFrame),
    goal_frame_goal_kind: typeof userGoal?.goal_kind === "string" ? userGoal.goal_kind : null,
    capability_selector_source: typeof capabilitySelectionResult?.source === "string" ? capabilitySelectionResult.source : null,
    plan_step_sources: planStepSources,
    continuation_sources: continuationSources,
    terminal_source: terminalSource,
    fallback_used: fallbackUsed,
    phrase_detector_used: sourceValues.includes("phrase_detector"),
    model_planner_used: sourceValues.includes("model_planner"),
    capability_registry_used: sourceValues.includes("capability_registry"),
    artifact_policy_used: sourceValues.includes("artifact_policy"),
  };
};
