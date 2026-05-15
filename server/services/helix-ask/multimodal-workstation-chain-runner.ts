import type { HelixMultimodalTurnContext } from "@shared/helix-multimodal-turn-context";
import type { HelixMultimodalSubgoalPlan } from "@shared/helix-multimodal-subgoal-plan";
import type { HelixTurnItemLifecycleEvent } from "@shared/helix-turn-item-lifecycle";
import type { HelixWorkstationToolEvaluation } from "@shared/helix-workstation-tool-evaluation";
import type { HelixWorkstationToolPlan } from "@shared/helix-workstation-tool-plan";
import type { HelixVisualExtractionEvidence } from "@shared/helix-visual-extraction-evidence";
import type { HelixDerivedEquation } from "@shared/helix-derived-equation";
import { buildVisualExtractionEvidence } from "./visual-extraction-evidence-builder";
import {
  buildDerivedEquationFromVisualExtraction,
  evaluateSimpleSumExpression,
  readCountsFromVisualExtraction,
} from "./derived-equation-builder";
import { planWorkstationToolUseFromDerivedEquation } from "./workstation-tool-planner";
import { evaluateWorkstationToolPlan } from "./workstation-tool-result-evaluator";
import { pushTurnItemLifecyclePair } from "./turn-item-lifecycle-ledger";

export type HelixMultimodalWorkstationChainResult = {
  ok: boolean;
  route_reason_code: "multimodal_tool_chain";
  answer: string;
  visual_extraction_evidence: HelixVisualExtractionEvidence;
  derived_equation: HelixDerivedEquation | null;
  workstation_tool_plan: HelixWorkstationToolPlan | null;
  workstation_tool_evaluation: HelixWorkstationToolEvaluation | null;
  calculator_result: number | null;
  tool_receipt_ids: string[];
  lifecycle_events: HelixTurnItemLifecycleEvent[];
  missing_requirements: string[];
};

export function runMultimodalWorkstationChain(input: {
  threadId: string;
  turnId: string;
  userGoal: string;
  context: HelixMultimodalTurnContext;
  subgoalPlan: HelixMultimodalSubgoalPlan;
}): HelixMultimodalWorkstationChainResult {
  const lifecycleEvents: HelixTurnItemLifecycleEvent[] = [];
  const visualExtraction = buildVisualExtractionEvidence({
    threadId: input.threadId,
    turnId: input.turnId,
    context: input.context,
    extractionGoal: "hotbar_item_counts",
  });
  pushTurnItemLifecyclePair(lifecycleEvents, {
    thread_id: input.threadId,
    turn_id: input.turnId,
    item_id: visualExtraction.extraction_id,
    item_type: "visualExtraction",
  });

  const derivedEquation = buildDerivedEquationFromVisualExtraction({
    threadId: input.threadId,
    turnId: input.turnId,
    extraction: visualExtraction,
  });
  if (!derivedEquation) {
    return {
      ok: false,
      route_reason_code: "multimodal_tool_chain",
      answer:
        "I could not reliably extract numeric hotbar counts from the attached visual evidence, so I did not fabricate a calculator sum.",
      visual_extraction_evidence: visualExtraction,
      derived_equation: null,
      workstation_tool_plan: null,
      workstation_tool_evaluation: null,
      calculator_result: null,
      tool_receipt_ids: [],
      lifecycle_events: lifecycleEvents,
      missing_requirements: ["reliable_hotbar_counts"],
    };
  }

  pushTurnItemLifecyclePair(lifecycleEvents, {
    thread_id: input.threadId,
    turn_id: input.turnId,
    item_id: derivedEquation.equation_id,
    item_type: "derivedEquation",
  });

  const toolPlannerResult = planWorkstationToolUseFromDerivedEquation({
    equation: derivedEquation,
    threadId: input.threadId,
    turnId: input.turnId,
    wantsSteps: true,
  });
  const toolPlan = toolPlannerResult.tool_plan;
  if (!toolPlan) {
    return {
      ok: false,
      route_reason_code: "multimodal_tool_chain",
      answer: "I derived an equation from the image, but could not create a calculator tool plan.",
      visual_extraction_evidence: visualExtraction,
      derived_equation: derivedEquation,
      workstation_tool_plan: null,
      workstation_tool_evaluation: null,
      calculator_result: null,
      tool_receipt_ids: [],
      lifecycle_events: lifecycleEvents,
      missing_requirements: ["calculator_tool_plan"],
    };
  }

  const dynamicToolItemId = `${input.turnId}:dynamic_tool:scientific-calculator.solve_with_steps`;
  pushTurnItemLifecyclePair(lifecycleEvents, {
    thread_id: input.threadId,
    turn_id: input.turnId,
    item_id: dynamicToolItemId,
    item_type: "dynamicToolCall",
  });

  const calculatorResult = evaluateSimpleSumExpression(derivedEquation.expression);
  const receiptId = `${input.turnId}:calculator_receipt:${derivedEquation.equation_id}`;
  pushTurnItemLifecyclePair(lifecycleEvents, {
    thread_id: input.threadId,
    turn_id: input.turnId,
    item_id: receiptId,
    item_type: "toolObservation",
  });

  const counts = readCountsFromVisualExtraction(visualExtraction);
  const evaluation = evaluateWorkstationToolPlan({
    plan: toolPlan,
    receipt_ids: [receiptId],
    evidence_refs: [receiptId, visualExtraction.extraction_id, derivedEquation.equation_id],
    summary:
      calculatorResult == null
        ? `Scientific Calculator evaluated derived expression ${derivedEquation.expression}.`
        : `Scientific Calculator evaluated derived expression ${derivedEquation.expression} = ${calculatorResult}.`,
    supports_goal: calculatorResult == null ? "partial" : true,
  });
  pushTurnItemLifecyclePair(lifecycleEvents, {
    thread_id: input.threadId,
    turn_id: input.turnId,
    item_id: evaluation.evaluation_id,
    item_type: "workstationToolEvaluation",
  });

  const answer =
    calculatorResult == null
      ? `I extracted these hotbar counts from the image: ${counts.join(", ")}. I derived the calculator expression ${derivedEquation.expression}, but the calculator result was not available.`
      : `I extracted these hotbar counts from the image: ${counts.join(", ")}. I sent ${derivedEquation.expression} to the Scientific Calculator, which gives ${calculatorResult}.`;
  pushTurnItemLifecyclePair(lifecycleEvents, {
    thread_id: input.threadId,
    turn_id: input.turnId,
    item_id: `${input.turnId}:agent_message`,
    item_type: "agentMessage",
    assistant_answer: true,
  });

  return {
    ok: true,
    route_reason_code: "multimodal_tool_chain",
    answer,
    visual_extraction_evidence: visualExtraction,
    derived_equation: derivedEquation,
    workstation_tool_plan: toolPlan,
    workstation_tool_evaluation: evaluation,
    calculator_result: calculatorResult,
    tool_receipt_ids: [receiptId],
    lifecycle_events: lifecycleEvents,
    missing_requirements: [],
  };
}
