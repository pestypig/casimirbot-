import {
  HELIX_WORKSTATION_TOOL_EVALUATION_SCHEMA,
  type HelixWorkstationToolEvaluation,
} from "../../../shared/helix-workstation-tool-evaluation";
import type { HelixWorkstationToolPlan } from "../../../shared/helix-workstation-tool-plan";
import type {
  HelixCategorizationCategory,
  HelixCategorizationSourceFamily,
} from "../../../shared/helix-categorization-event";
import type {
  HelixSyntheticEvidenceProducer,
  HelixSyntheticEvidenceSupportStatus,
} from "../../../shared/helix-synthetic-evidence";
import type { HelixCalculatorSetupContext } from "../../../shared/helix-calculator-setup-context";
import {
  WORKSTATION_GOAL_CONTEXT_UPDATE_SCHEMA,
  normalizeAgentGoalActuatorV1,
  type AgentGoalActuatorV1,
  type NarratorBindStreamRequestV1,
  type WorkstationDispatchActionV1,
} from "../../../shared/contracts/workstation-goal-context.v1";
import { planContextEconomy } from "./context-economy-planner";
import { recordSubgoalEvaluation } from "./subgoal-evaluator";
import { recordCategorizationEvent } from "../situation-room/categorization-bus";
import { recordSyntheticEvidence } from "../situation-room/synthetic-evidence-ledger";
import { recordStagePlayGoalContextUpdate } from "../stage-play/stage-play-goal-context-store";

export type EvaluateWorkstationToolPlanInput = {
  plan: HelixWorkstationToolPlan;
  receipt_ids?: string[];
  evidence_refs?: string[];
  summary?: string | null;
  supports_goal?: HelixWorkstationToolEvaluation["supports_goal"];
  model_invoked?: boolean;
};

function newId(prefix: string): string {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const canonicalLiveEnvToolName = (value: unknown): `live_env.${string}` | null => {
  const raw = readString(value);
  if (!raw) return null;
  return (raw.startsWith("live_env.") ? raw : `live_env.${raw.replace(/^[^.]+\./, "")}`) as `live_env.${string}`;
};

const readLoopState = (value: unknown): "paused" | "running" | "repaired" | null => {
  const raw = readString(value);
  return raw === "paused" || raw === "running" || raw === "repaired" ? raw : null;
};

const workstationControlDispatchActuators = new Set<AgentGoalActuatorV1>([
  "change_preset",
  "set_audio_preset",
  "set_visual_preset",
  "bind_source",
  "unbind_source",
  "pause_loop",
  "resume_loop",
  "set_loop_state",
  "repair_loop",
  "repair_source",
  "update_live_answer",
  "focus_process_graph",
]);

const narratorStreamKinds = new Set<NarratorBindStreamRequestV1["streamKind"]>([
  "transcript_stream",
  "translated_transcript",
  "translated_speech",
  "typed_commentary",
  "route_evidence",
  "source_health_status",
]);

const readNarratorStreamKind = (value: unknown): NarratorBindStreamRequestV1["streamKind"] | null => {
  const raw = readString(value);
  return raw && narratorStreamKinds.has(raw as NarratorBindStreamRequestV1["streamKind"])
    ? raw as NarratorBindStreamRequestV1["streamKind"]
    : null;
};

const readNarratorDispatchMode = (value: unknown): "confirm" | "auto" | "visible_only" => {
  const raw = readString(value);
  if (raw === "auto_speak" || raw === "auto") return "auto";
  if (raw === "visible_only") return "visible_only";
  return "confirm";
};

function mapIntentToCategorization(intent: HelixWorkstationToolPlan["intent"]): {
  source_family: HelixCategorizationSourceFamily;
  category: HelixCategorizationCategory;
  produced_by: HelixSyntheticEvidenceProducer;
} {
  if (intent === "calculator_verify" || intent === "calculator_solve" || intent === "calculator_live_source") {
    return {
      source_family: "calculator",
      category: "equation_result",
      produced_by: "calculator",
    };
  }
  if (intent === "notes_create" || intent === "notes_append" || intent === "notes_store_large_text") {
    return {
      source_family: "workstation_notes",
      category: "context_reference",
      produced_by: "workstation_note",
    };
  }
  if (intent === "narrator_debug_probe" || intent === "narrator_control") {
    return {
      source_family: "live_environment",
      category: "context_reference",
      produced_by: "deterministic_reducer",
    };
  }
  if (intent === "ideology_compare") {
    return {
      source_family: "ideology",
      category: "motive_framework",
      produced_by: "ideology",
    };
  }
  if (intent === "zen_graph_reflection") {
    return {
      source_family: "ideology",
      category: "motive_framework",
      produced_by: "deterministic_reducer",
    };
  }
  if (intent === "dottie_observer") {
    return {
      source_family: "live_environment",
      category: "context_reference",
      produced_by: "deterministic_reducer",
    };
  }
  if (intent === "physics_calculation_context") {
    return {
      source_family: "calculator",
      category: "equation_result",
      produced_by: "deterministic_reducer",
    };
  }
  return {
    source_family: "unknown",
    category: "evidence",
    produced_by: "deterministic_reducer",
  };
}

function mapSupportStatus(
  supportsGoal: HelixWorkstationToolEvaluation["supports_goal"],
): HelixSyntheticEvidenceSupportStatus {
  if (supportsGoal === true) return "supports";
  if (supportsGoal === false) return "contradicts";
  if (supportsGoal === "partial") return "partial";
  return "unknown";
}

function calculatorSetupFromPlan(plan: HelixWorkstationToolPlan): HelixCalculatorSetupContext | null {
  const solveStep = plan.steps.find(
    (step) =>
      step.panel_id === "scientific-calculator" &&
      (step.action_id === "solve_expression" ||
        step.action_id === "solve_with_steps" ||
        step.action_id === "start_equation_live_source"),
  );
  const setup = solveStep?.args?.calculator_setup;
  if (!setup || typeof setup !== "object" || Array.isArray(setup)) return null;
  const record = setup as Partial<HelixCalculatorSetupContext>;
  return typeof record.expression === "string" && typeof record.subgoal === "string"
    ? (record as HelixCalculatorSetupContext)
    : null;
}

function maybeRecordNarratorGoalContextUpdate(input: {
  plan: HelixWorkstationToolPlan;
  summary: string;
  receiptIds: string[];
  evidenceRefs: string[];
  syntheticEvidenceId: string;
}): void {
  if (input.plan.intent !== "narrator_control" && input.plan.intent !== "narrator_debug_probe") return;
  const actionStep = [...input.plan.steps]
    .reverse()
    .find((step) => step.panel_id === "narrator" && step.kind === "run_panel_action");
  const args = actionStep?.args ?? {};
  const sourceRef =
    readString(args.source_ref) ??
    readString(args.sourceRef) ??
    readString(args.source_id) ??
    readString(args.sourceId) ??
    "narrator:workstation";
  const streamKind = readNarratorStreamKind(args.stream_kind ?? args.streamKind);
  const dispatchMode = readNarratorDispatchMode(args.delivery_mode ?? args.deliveryMode);
  const actionId = readString(actionStep?.action_id);
  const narratorActuator =
    actionId === "narrator.bind_stream"
      ? "narrator_bind_stream"
      : actionId === "narrator.say"
        ? "narrator_say"
        : null;
  const receiptRef = input.receiptIds[0] ?? input.syntheticEvidenceId;
  const dispatch: WorkstationDispatchActionV1[] = [
    { kind: "log_receipt", receiptRef },
    { kind: "update_panel", panelId: "narrator" },
    { kind: "update_panel", panelId: "stage-play-badge-graph" },
  ];
  if (actionId === "narrator.bind_stream") {
    if (streamKind) {
      dispatch.push({ kind: "bind_narrator_stream", sourceRef, streamKind });
    }
    dispatch.push({ kind: "speak_narrator", mode: dispatchMode });
  } else if (actionId === "narrator.say") {
    dispatch.push({ kind: "speak_narrator", mode: dispatchMode });
  }

  recordStagePlayGoalContextUpdate({
    schemaVersion: WORKSTATION_GOAL_CONTEXT_UPDATE_SCHEMA,
    updateId: newId("stage_play_goal_context_update:narrator"),
    createdAtMs: Date.now(),
    sourceRefs: uniqueStrings([
      sourceRef,
      streamKind,
      narratorActuator ? `workstation_actuator:${narratorActuator}` : null,
      ...input.evidenceRefs,
    ]),
    loopRefs: uniqueStrings([
      `thread:${input.plan.thread_id}`,
      input.plan.plan_id,
      actionStep?.step_id,
      actionId ? `narrator:${actionId.replace(/^narrator\./, "")}` : null,
      narratorActuator ? `workstation_actuator:${narratorActuator}` : null,
    ]),
    producerKind: "narrator",
    updateKind: "suggested_action",
    contentRef: receiptRef,
    preview: input.summary,
    evidenceRefs: uniqueStrings([
      input.syntheticEvidenceId,
      narratorActuator ? `allowed_actuator:${narratorActuator}` : null,
      ...input.evidenceRefs,
      ...input.receiptIds,
    ]).slice(0, 80),
    receiptRefs: input.receiptIds.slice(0, 80),
    freshness: {
      observedAtMs: Date.now(),
      staleAfterMs: 60_000,
      status: "fresh",
    },
    goalRelevance: null,
    suggestedDispatch: dispatch,
    authority: {
      assistantAnswer: false,
      terminalEligible: false,
      rawContentIncluded: false,
      postToolModelStepRequired: true,
    },
  });
}

function buildWorkstationControlDispatch(input: {
  toolId: string;
  args: Record<string, unknown>;
}): WorkstationDispatchActionV1[] {
  const actuator = normalizeAgentGoalActuatorV1(input.toolId);
  const goalId = readString(input.args.goal_id ?? input.args.goalId);
  const sourceRef = readString(input.args.source_ref ?? input.args.sourceRef ?? input.args.source_id ?? input.args.sourceId);
  const targetRef = readString(input.args.target_ref ?? input.args.targetRef ?? input.args.target_id ?? input.args.targetId);
  const presetId = readString(input.args.preset_id ?? input.args.presetId ?? input.args.preset);
  const loopRef = readString(input.args.loop_ref ?? input.args.loopRef ?? input.args.loop_id ?? input.args.loopId);
  const lineKey = readString(input.args.line_key ?? input.args.lineKey);
  const nodeRef = readString(input.args.node_ref ?? input.args.nodeRef);
  const dispatch: WorkstationDispatchActionV1[] = [];
  if (goalId) dispatch.push({ kind: "append_goal_context", goalId });
  if (
    (actuator === "change_preset" || actuator === "set_audio_preset" || actuator === "set_visual_preset") &&
    targetRef &&
    presetId
  ) {
    dispatch.push({ kind: "change_preset", targetRef, presetId });
  }
  if (actuator === "bind_source" && sourceRef && targetRef) {
    dispatch.push({ kind: "bind_source", sourceRef, targetRef });
  }
  if (actuator === "unbind_source" && sourceRef) {
    dispatch.push({ kind: "unbind_source", sourceRef, targetRef });
  }
  if ((actuator === "pause_loop" || actuator === "resume_loop" || actuator === "set_loop_state") && loopRef) {
    const state =
      actuator === "pause_loop"
        ? "paused"
        : actuator === "resume_loop"
          ? "running"
          : readLoopState(input.args.state) ?? "running";
    dispatch.push({ kind: "set_loop_state", loopRef, state });
  }
  if (actuator === "repair_loop" && loopRef) {
    dispatch.push({ kind: "repair_loop", loopRef });
    dispatch.push({ kind: "set_loop_state", loopRef, state: "repaired" });
  }
  if (actuator === "repair_source" && (sourceRef || loopRef)) {
    dispatch.push({ kind: "repair_source", sourceRef, loopRef });
    if (loopRef) dispatch.push({ kind: "set_loop_state", loopRef, state: "repaired" });
  }
  if (actuator === "update_live_answer" && lineKey) {
    dispatch.push({ kind: "update_live_answer", lineKey });
  }
  if (actuator === "focus_process_graph" && nodeRef) {
    dispatch.push({ kind: "focus_process_graph", nodeRef });
  }
  return dispatch;
}

function maybeRecordWorkstationControlGoalContextUpdate(input: {
  plan: HelixWorkstationToolPlan;
  summary: string;
  receiptIds: string[];
  evidenceRefs: string[];
  syntheticEvidenceId: string;
}): void {
  if (input.plan.intent !== "workstation_control" && input.plan.intent !== "workstation_goal_context") return;
  const controlSteps = input.plan.steps.filter(
    (step) => {
      if (step.kind !== "run_ask_tool" || !readString(step.tool_id)?.startsWith("live_env.")) return false;
      const actuator = normalizeAgentGoalActuatorV1(step.tool_id);
      return Boolean(actuator && workstationControlDispatchActuators.has(actuator));
    },
  );
  if (controlSteps.length === 0) return;

  const receiptRef = input.receiptIds[0] ?? input.syntheticEvidenceId;
  const controlDispatch = controlSteps.flatMap((step) =>
    buildWorkstationControlDispatch({
      toolId: readString(step.tool_id) ?? "",
      args: step.args ?? {},
    }),
  );
  const dispatch: WorkstationDispatchActionV1[] = [
    { kind: "log_receipt", receiptRef },
    { kind: "update_panel", panelId: "stage-play-badge-graph" },
    ...controlDispatch,
  ];
  if (controlDispatch.some((action) => action.kind === "update_live_answer")) {
    dispatch.splice(2, 0, { kind: "update_panel", panelId: "live-answer-environment" });
  }

  const actuators = uniqueStrings(
    controlSteps.map((step) => normalizeAgentGoalActuatorV1(step.tool_id)),
  ) as AgentGoalActuatorV1[];
  const argsRefs = controlSteps.flatMap((step) => {
    const args = step.args ?? {};
    return [
      readString(args.goal_id ?? args.goalId),
      readString(args.source_ref ?? args.sourceRef ?? args.source_id ?? args.sourceId),
      readString(args.target_ref ?? args.targetRef ?? args.target_id ?? args.targetId),
      readString(args.preset_id ?? args.presetId ?? args.preset),
      readString(args.loop_ref ?? args.loopRef ?? args.loop_id ?? args.loopId),
      readString(args.line_key ?? args.lineKey),
      readString(args.node_ref ?? args.nodeRef),
    ];
  });
  const primaryToolName = canonicalLiveEnvToolName(controlSteps[0]?.tool_id) ?? "live_env.workstation_control";
  const primaryActuator = normalizeAgentGoalActuatorV1(primaryToolName);

  recordStagePlayGoalContextUpdate({
    schemaVersion: WORKSTATION_GOAL_CONTEXT_UPDATE_SCHEMA,
    updateId: newId("stage_play_goal_context_update:workstation_control"),
    createdAtMs: Date.now(),
    sourceRefs: uniqueStrings([
      ...argsRefs,
      ...actuators.map((actuator) => `workstation_actuator:${actuator}`),
      ...input.evidenceRefs,
    ]),
    loopRefs: uniqueStrings([
      `thread:${input.plan.thread_id}`,
      input.plan.plan_id,
      ...controlSteps.map((step) => step.step_id),
      ...actuators.map((actuator) => `workstation_control:${actuator}`),
      ...actuators.map((actuator) => `workstation_actuator:${actuator}`),
      ...argsRefs.filter((ref) => ref?.startsWith("loop:")),
    ]),
    producerKind: "automation",
    updateKind: actuators.some((actuator) =>
      actuator === "change_preset" || actuator === "set_audio_preset" || actuator === "set_visual_preset"
    )
      ? "preset_state"
      : "suggested_action",
    contentRef: receiptRef,
    preview: input.summary,
    evidenceRefs: uniqueStrings([
      input.syntheticEvidenceId,
      ...actuators.map((actuator) => `allowed_actuator:${actuator}`),
      ...actuators.map((actuator) => `agent_goal_allowed_actuator:${actuator}`),
      ...argsRefs,
      ...input.evidenceRefs,
      ...input.receiptIds,
    ]).slice(0, 80),
    receiptRefs: input.receiptIds.slice(0, 80),
    freshness: {
      observedAtMs: Date.now(),
      staleAfterMs: 60_000,
      status: "fresh",
    },
    goalRelevance: readString(controlSteps[0]?.args?.goal_id ?? controlSteps[0]?.args?.goalId)
      ? {
          goalId: readString(controlSteps[0]?.args?.goal_id ?? controlSteps[0]?.args?.goalId)!,
          relevance: 0.75,
          reason: "Workstation control receipt belongs to this active operator goal.",
        }
      : null,
    toolIdentity: primaryActuator
      ? {
          requestedToolName: primaryToolName,
          canonicalToolName: primaryToolName,
          matchedAllowedActuators: actuators,
          matchedAllowedActuatorRefs: actuators.map((actuator) => `agent_goal_allowed_actuator:${actuator}`),
        }
      : null,
    suggestedDispatch: dispatch,
    authority: {
      assistantAnswer: false,
      terminalEligible: false,
      rawContentIncluded: false,
      postToolModelStepRequired: true,
    },
  });
}

export function evaluateWorkstationToolPlan(input: EvaluateWorkstationToolPlanInput): HelixWorkstationToolEvaluation {
  const receiptIds = Array.from(new Set((input.receipt_ids ?? []).map((entry) => String(entry).trim()).filter(Boolean)));
  const evidenceRefs = Array.from(new Set((input.evidence_refs ?? receiptIds).map((entry) => String(entry).trim()).filter(Boolean)));
  const lastActionStep = [...input.plan.steps]
    .reverse()
    .find((step) => step.kind === "run_panel_action" || step.kind === "run_job");
  const subgoal =
    input.plan.intent === "calculator_verify"
      ? "Verify the equation with the Scientific Calculator."
      : input.plan.intent === "calculator_solve"
        ? "Solve the expression with the Scientific Calculator."
      : input.plan.intent === "calculator_live_source"
        ? "Start a Scientific Calculator equation live source and observe its current tick."
      : input.plan.intent === "notes_create"
        ? "Create a workstation note and preserve the body outside raw Ask context."
      : input.plan.intent === "notes_append" || input.plan.intent === "notes_store_large_text"
        ? "Store text in workstation notes and keep compact references."
      : input.plan.intent === "narrator_debug_probe"
        ? "Publish a governed Narrator debug auto-speak probe through the workstation action lane."
      : input.plan.intent === "narrator_control"
        ? "Publish or bind governed Narrator output through the workstation action lane."
      : input.plan.intent === "zen_graph_reflection"
        ? "Reflect the prompt through ZenGraph and Fruition as evidence-only procedural state."
      : input.plan.intent === "dottie_observer"
        ? "Attach or inspect Auntie Dottie as a witness-only Situation Room observer."
      : input.plan.intent === "physics_calculation_context"
        ? "Locate the physics prompt on the theory atlas and plan calculator/runtime evidence."
      : "Evaluate workstation tool result.";

  const supportValue = input.supports_goal ?? (receiptIds.length > 0 || lastActionStep ? true : "unknown");
  const calculatorSetup = calculatorSetupFromPlan(input.plan);
  const calculatorUnitSummary =
    calculatorSetup?.result_unit || calculatorSetup?.result_dimension_signature
      ? ` Result unit: ${calculatorSetup.result_unit ?? "unspecified"}${
          calculatorSetup.result_dimension_signature ? ` (${calculatorSetup.result_dimension_signature})` : ""
        }.`
      : "";
  const summary =
    input.summary?.trim() ||
    (calculatorSetup
      ? `${lastActionStep?.panel_id ?? "workstation"}.${lastActionStep?.action_id ?? "action"} produced ${calculatorSetup.domain} evidence for ${input.plan.intent}: ${calculatorSetup.subgoal}${calculatorUnitSummary}`
      : "") ||
    `${lastActionStep?.panel_id ?? "workstation"}.${lastActionStep?.action_id ?? "action"} produced evidence for ${input.plan.intent}.`;
  const mapped = mapIntentToCategorization(input.plan.intent);
  const categorization = recordCategorizationEvent({
    thread_id: input.plan.thread_id,
    source_event_id: receiptIds[0] ?? `${input.plan.turn_id}:workspace_action_receipt`,
    source_family: mapped.source_family,
    category: mapped.category,
    summary,
    confidence: supportValue === true ? 0.9 : supportValue === "partial" ? 0.65 : 0.5,
    evidence_refs: evidenceRefs,
    deterministic: input.model_invoked !== true,
    model_invoked: input.model_invoked === true,
  });
  const contextDecision =
    input.plan.intent === "notes_create" ||
    input.plan.intent === "notes_append" ||
    input.plan.intent === "notes_store_large_text"
      ? planContextEconomy({
          thread_id: input.plan.thread_id,
          source_ref: evidenceRefs[0] ?? receiptIds[0] ?? input.plan.plan_id,
          reusable_context_ref: receiptIds[0] ?? null,
          raw_char_count: input.plan.goal.length,
        })
      : null;
  const syntheticEvidence = recordSyntheticEvidence({
    thread_id: input.plan.thread_id,
    produced_by: mapped.produced_by,
    claim: summary,
    support_status: mapSupportStatus(supportValue),
    source_refs: evidenceRefs,
    reusable_context_ref: contextDecision?.reusable_context_ref ?? null,
    deterministic: input.model_invoked !== true,
    model_invoked: input.model_invoked === true,
  });
  const subgoalEvaluation = recordSubgoalEvaluation({
    thread_id: input.plan.thread_id,
    subgoal_id: `${input.plan.plan_id}:${input.plan.intent}`,
    goal_label: input.plan.goal,
    status: supportValue === true ? "completed" : supportValue === "partial" ? "progress" : "active",
    evidence_ids: [syntheticEvidence.evidence_id],
    next_best_tool:
      supportValue === true
        ? null
        : lastActionStep?.panel_id && lastActionStep.action_id
          ? `${lastActionStep.panel_id}.${lastActionStep.action_id}`
          : null,
    evaluation_summary: summary,
    deterministic: input.model_invoked !== true,
    model_invoked: input.model_invoked === true,
  });
  maybeRecordNarratorGoalContextUpdate({
    plan: input.plan,
    summary,
    receiptIds,
    evidenceRefs,
    syntheticEvidenceId: syntheticEvidence.evidence_id,
  });
  maybeRecordWorkstationControlGoalContextUpdate({
    plan: input.plan,
    summary,
    receiptIds,
    evidenceRefs,
    syntheticEvidenceId: syntheticEvidence.evidence_id,
  });

  return {
    schema: HELIX_WORKSTATION_TOOL_EVALUATION_SCHEMA,
    evaluation_id: newId("workstation-tool-eval"),
    plan_id: input.plan.plan_id,
    thread_id: input.plan.thread_id,
    turn_id: input.plan.turn_id,
    goal: input.plan.goal,
    subgoal,
    tool_receipt_ids: receiptIds,
    supports_goal: supportValue,
    summary,
    evidence_refs: evidenceRefs,
    calculator_setup: calculatorSetup,
    categorization_event_ids: [categorization.event_id],
    synthetic_evidence_ids: [syntheticEvidence.evidence_id],
    subgoal_evaluation_ids: [subgoalEvaluation.evaluation_id],
    deterministic: input.model_invoked === true ? false : true,
    model_invoked: input.model_invoked === true,
    created_at: new Date().toISOString(),
  };
}
