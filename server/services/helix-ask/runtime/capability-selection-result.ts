type HelixAskTurnSelectedAction = {
  panel_id: string;
  action_id: string;
  args: Record<string, unknown>;
};

type HelixAskUniversalGoalFrame = {
  user_goal: {
    raw: string;
    normalized: string;
    goal_kind:
      | "conversation"
      | "open_workspace"
      | "read_doc"
      | "summarize_doc"
      | "locate_in_doc"
      | "write_note"
      | "compare"
      | "panel_control"
      | "temporal_followup"
      | "capability_help"
      | "unknown";
    confidence: number;
  };
  requested_outputs: Array<{
    kind: "answer" | "doc_open" | "note_update" | "workspace_action" | "location" | "comparison" | "clarification";
    required: boolean;
    evidence: string[];
  }>;
  workspace_refs: Array<{
    kind: "active_doc" | "doc_topic" | "doc_title" | "note_title" | "active_note" | "clipboard" | "prior_turn";
    value: string;
    source: "explicit" | "deictic" | "context" | "phrase_evidence" | "model";
    confidence: number;
  }>;
  mutation_targets: Array<{
    kind: "note" | "doc" | "clipboard" | "workspace_panel";
    value: string;
    resolution: "explicit" | "active" | "last_created" | "ambiguous" | "missing";
    confidence: number;
  }>;
  evidence_requirements: Array<{
    artifact: string;
    required: boolean;
    reason: string;
  }>;
};

type HelixAskCapabilitySelectionResult = {
  capability_id: string | null;
  args: Record<string, unknown>;
  required_artifacts: string[];
  expected_observation: {
    kind: string;
    summary: string;
  };
  confidence: number;
  ambiguity: {
    status: "none" | "low_confidence" | "missing_args" | "multiple_targets";
    reason: string | null;
    candidates?: Array<{
      capability_id: string;
      args: Record<string, unknown>;
      confidence: number;
      reason: string;
    }>;
  };
  source: string;
};

type HelixAskPanelControlIntent = {
  panel_id: string;
  action_id: string;
  args?: Record<string, unknown> | null;
} | null;

type HelixAskWorkstationToolPlan = {
  intent?: string | null;
  steps: Array<{
    kind?: string | null;
    panel_id?: string | null;
    action_id?: string | null;
    args?: Record<string, unknown> | null;
  }>;
  missing_requirements: string[];
};

export type HelixAskCapabilitySelectionResultDependencies = {
  readGoalFrameMutationTarget: (
    frame: HelixAskUniversalGoalFrame | null | undefined,
    kind: HelixAskUniversalGoalFrame["mutation_targets"][number]["kind"],
  ) => HelixAskUniversalGoalFrame["mutation_targets"][number] | null;
  goalFrameRequestsOutput: (frame: HelixAskUniversalGoalFrame, outputKind: string) => boolean;
  planWorkstationToolUse: (
    transcript: string,
    options?: Record<string, unknown>,
  ) => { tool_plan: HelixAskWorkstationToolPlan | null };
  classifyPanelControlIntent: (transcript: string) => HelixAskPanelControlIntent;
  isDocsPanelOpenIntent: (transcript: string) => boolean;
};

export const createAskTurnCapabilitySelectionResultBuilder = (
  deps: HelixAskCapabilitySelectionResultDependencies,
) => (args: {
  frame: HelixAskUniversalGoalFrame;
  payload?: Record<string, unknown> | null;
  selectedAction?: HelixAskTurnSelectedAction | null;
  source?: string;
}): HelixAskCapabilitySelectionResult => {
  const frame = args.frame;
  const payload = args.payload ?? {};
  const selectedAction =
    args.selectedAction ??
    (payload.workspace_action && typeof payload.workspace_action === "object"
      ? (payload.workspace_action as HelixAskTurnSelectedAction)
      : payload.planner_contract &&
          typeof payload.planner_contract === "object" &&
          (payload.planner_contract as Record<string, unknown>).selected_action &&
          typeof (payload.planner_contract as Record<string, unknown>).selected_action === "object"
        ? ((payload.planner_contract as Record<string, unknown>).selected_action as HelixAskTurnSelectedAction)
        : null);
  const requiredArtifacts = frame.evidence_requirements
    .filter((entry) => entry.required !== false)
    .map((entry) => entry.artifact);
  const activeDocRef = frame.workspace_refs.find((entry) => entry.kind === "active_doc");
  const docTopicRef = frame.workspace_refs.find((entry) => entry.kind === "doc_topic");
  const noteTarget = deps.readGoalFrameMutationTarget(frame, "note");
  const noteRef = frame.workspace_refs.find((entry) => entry.kind === "note_title" || entry.kind === "active_note");
  const base = (partial: Partial<HelixAskCapabilitySelectionResult>): HelixAskCapabilitySelectionResult => ({
    capability_id: null,
    args: {},
    required_artifacts: requiredArtifacts,
    expected_observation: {
      kind: "direct_answer",
      summary: "Answer directly without workspace mutation.",
    },
    confidence: frame.user_goal.confidence,
    ambiguity: { status: "none", reason: null },
    source: args.source ?? "goal_frame",
    ...partial,
  });
  if (frame.user_goal.goal_kind === "conversation") {
    return base({
      capability_id: null,
      required_artifacts: [],
      expected_observation: { kind: "direct_answer", summary: "Direct conversational answer." },
      confidence: Math.max(frame.user_goal.confidence, 0.78),
    });
  }
  if (frame.user_goal.goal_kind === "summarize_doc" || frame.user_goal.goal_kind === "read_doc") {
    return base({
      capability_id: "docs-viewer.summarize_doc",
      args: activeDocRef?.value && activeDocRef.value !== "active_doc" ? { path: activeDocRef.value } : {},
      required_artifacts: Array.from(new Set(["doc_summary", ...requiredArtifacts])),
      expected_observation: {
        kind: "doc_summary",
        summary: deps.goalFrameRequestsOutput(frame, "note_update") && noteTarget
          ? `Summarize active document, then update note "${noteTarget.value}".`
          : "Summarize the active document without workspace mutation.",
      },
      confidence: activeDocRef ? 0.86 : 0.68,
      ambiguity: activeDocRef
        ? { status: "none", reason: null }
        : { status: "missing_args", reason: "active_doc_path_missing" },
    });
  }
  if (frame.user_goal.goal_kind === "locate_in_doc") {
    return base({
      capability_id: "docs-viewer.locate_in_doc",
      args: activeDocRef?.value && activeDocRef.value !== "active_doc" ? { path: activeDocRef.value } : {},
      required_artifacts: Array.from(new Set(["doc_location_matches", ...requiredArtifacts])),
      expected_observation: { kind: "doc_location_matches", summary: "Locate matching snippets in the active document." },
      confidence: activeDocRef ? 0.82 : 0.62,
      ambiguity: activeDocRef
        ? { status: "none", reason: null }
        : { status: "missing_args", reason: "active_doc_path_missing" },
    });
  }
  if (frame.user_goal.goal_kind === "compare") {
    return base({
      capability_id: "workspace_context.compare",
      args: {
        ...(activeDocRef?.value ? { active_doc_path: activeDocRef.value } : {}),
        ...(noteRef?.value ? { note_title: noteRef.value } : {}),
      },
      required_artifacts: Array.from(new Set(["comparison_summary", ...requiredArtifacts])),
      expected_observation: { kind: "comparison_summary", summary: "Compare typed document and note/workspace artifacts." },
      confidence: activeDocRef && noteRef ? 0.84 : 0.58,
      ambiguity: activeDocRef && noteRef
        ? { status: "none", reason: null }
        : { status: "missing_args", reason: !activeDocRef ? "active_doc_path_missing" : "note_target_missing" },
    });
  }
  if (frame.user_goal.goal_kind === "panel_control") {
    const workstationToolPlan = deps.planWorkstationToolUse(frame.user_goal.raw, {}).tool_plan;
    if (workstationToolPlan?.intent === "dottie_observer") {
      const firstDottieAction = workstationToolPlan.steps.find(
        (step) => step.kind === "run_panel_action" && step.panel_id === "situation-room-pipelines" && step.action_id,
      );
      const capabilityId = firstDottieAction
        ? `${firstDottieAction.panel_id}.${firstDottieAction.action_id}`
        : "situation-room-pipelines.observer.attach";
      return base({
        capability_id: capabilityId,
        args: firstDottieAction?.args ?? {},
        required_artifacts: Array.from(new Set(["workstation_tool_evaluation", ...requiredArtifacts])),
        expected_observation: {
          kind: "workstation_tool_evaluation",
          summary: "Evaluate receipt-backed Dottie observer and voice proposal actions.",
        },
        confidence: workstationToolPlan.missing_requirements.length === 0 ? 0.92 : 0.62,
        ambiguity:
          workstationToolPlan.missing_requirements.length === 0
            ? { status: "none", reason: null }
            : { status: "missing_args", reason: workstationToolPlan.missing_requirements.join(",") },
        source: "capability_registry",
      });
    }
    const panelControlIntent = deps.classifyPanelControlIntent(frame.user_goal.raw);
    const docsPanelOpenIntent = deps.isDocsPanelOpenIntent(frame.user_goal.raw);
    const capabilityId = panelControlIntent
      ? `${panelControlIntent.panel_id}.${panelControlIntent.action_id}`
      : docsPanelOpenIntent
        ? "docs-viewer.open"
      : selectedAction
        ? `${selectedAction.panel_id}.${selectedAction.action_id}`
        : null;
    return base({
      capability_id: capabilityId,
      args: panelControlIntent ? (panelControlIntent.args ?? {}) : docsPanelOpenIntent ? {} : selectedAction?.args ?? {},
      required_artifacts: Array.from(new Set(["workspace_action_receipt", ...requiredArtifacts])),
      expected_observation: { kind: "workspace_action_receipt", summary: "Open or focus the requested workspace panel." },
      confidence: panelControlIntent || docsPanelOpenIntent ? 0.9 : selectedAction ? 0.72 : 0.35,
      ambiguity: panelControlIntent || docsPanelOpenIntent || selectedAction
        ? { status: "none", reason: null }
        : { status: "missing_args", reason: "workspace_panel_missing" },
    });
  }
  if (frame.user_goal.goal_kind === "open_workspace") {
    const selectedActionCapability = selectedAction ? `${selectedAction.panel_id}.${selectedAction.action_id}` : null;
    const selectedActionIsAuthoritativeDocOpen =
      selectedAction?.panel_id === "docs-viewer" &&
      ["open_doc_by_path", "open_latest_doc_by_topic", "open_doc", "open_doc_and_read"].includes(selectedAction.action_id);
    return base({
      capability_id: selectedActionIsAuthoritativeDocOpen
        ? selectedActionCapability
        : docTopicRef
          ? "docs-viewer.search_docs"
          : selectedActionCapability ?? "workspace.open",
      args: selectedActionIsAuthoritativeDocOpen
        ? (selectedAction?.args ?? {})
        : docTopicRef
          ? { query: docTopicRef.value, limit: 5 }
          : (selectedAction?.args ?? {}),
      required_artifacts: Array.from(new Set(requiredArtifacts.length ? requiredArtifacts : ["workspace_context"])),
      expected_observation: { kind: "workspace_action_result", summary: "Open or navigate to the requested workspace target." },
      confidence: docTopicRef || selectedAction ? 0.74 : 0.52,
      ambiguity: docTopicRef || selectedAction
        ? { status: "none", reason: null }
        : { status: "missing_args", reason: "workspace_target_missing" },
    });
  }
  if (frame.user_goal.goal_kind === "write_note") {
    return base({
      capability_id: noteTarget ? "workstation-notes.append_to_note" : null,
      args: noteTarget ? { title: noteTarget.value } : {},
      required_artifacts: Array.from(new Set(["note_update_receipt", ...requiredArtifacts])),
      expected_observation: { kind: "note_update_receipt", summary: "Update the resolved note target." },
      confidence: noteTarget ? 0.8 : 0.35,
      ambiguity: noteTarget
        ? { status: "none", reason: null }
        : { status: "missing_args", reason: "note_target_missing" },
    });
  }
  if (frame.user_goal.goal_kind === "temporal_followup") {
    return base({
      capability_id: "reasoning.resolve_temporal_context",
      args: activeDocRef?.value ? { source_path: activeDocRef.value } : {},
      required_artifacts: Array.from(new Set(["temporal_context_comparison", ...requiredArtifacts])),
      expected_observation: { kind: "temporal_context_comparison", summary: "Resolve temporal target evidence before answering." },
      confidence: activeDocRef ? 0.76 : 0.52,
      ambiguity: activeDocRef
        ? { status: "low_confidence", reason: "target_event_requires_resolution" }
        : { status: "missing_args", reason: "source_doc_missing" },
    });
  }
  return base({
    capability_id: selectedAction ? `${selectedAction.panel_id}.${selectedAction.action_id}` : null,
    args: selectedAction?.args ?? {},
    required_artifacts: requiredArtifacts,
    expected_observation: { kind: "unknown", summary: "No confident goal-frame capability selected." },
    confidence: selectedAction ? 0.5 : 0.3,
    ambiguity: { status: selectedAction ? "low_confidence" : "missing_args", reason: "goal_kind_unknown" },
    source: selectedAction ? "compatibility_shim" : (args.source ?? "goal_frame"),
  });
};
