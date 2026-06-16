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
import { planContextEconomy } from "./context-economy-planner";
import { recordSubgoalEvaluation } from "./subgoal-evaluator";
import { recordCategorizationEvent } from "../situation-room/categorization-bus";
import { recordSyntheticEvidence } from "../situation-room/synthetic-evidence-ledger";

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
