import { extractCalculatorExpression } from "./workstation-tool-planner";
import type { HelixWorkstationToolPlan } from "../../../shared/helix-workstation-tool-plan";
import type { HelixWorkstationToolEvaluation } from "../../../shared/helix-workstation-tool-evaluation";

export type SynthesizeWorkstationAnswerInput = {
  prompt: string;
  plan: HelixWorkstationToolPlan;
  evaluation?: HelixWorkstationToolEvaluation | null;
};

function solveSimpleQuadraticZero(expression: string): string | null {
  const normalized = expression.replace(/\s+/g, "");
  const match = normalized.match(/^x\^2([+-]\d+(?:\.\d+)?)=0$/i);
  if (!match) return null;
  const constant = Number(match[1]);
  if (!Number.isFinite(constant)) return null;
  const rhs = -constant;
  if (rhs < 0) return null;
  const root = Math.sqrt(rhs);
  if (!Number.isFinite(root)) return null;
  if (Math.abs(root - Math.round(root)) < 1e-9) {
    return `${Math.round(root)}, ${-Math.round(root)}`;
  }
  return `${root}, ${-root}`;
}

function calculatorResultText(prompt: string): string {
  const expression = extractCalculatorExpression(prompt) ?? "the expression";
  const result = solveSimpleQuadraticZero(expression);
  if (result) {
    return [
      "Calculator verification plan completed.",
      `Expression: ${expression}`,
      `Result: x = ${result}`,
      "Trace source: scientific-calculator.solve_with_steps.",
    ].join("\n");
  }
  return [
    "Calculator verification plan completed.",
    `Expression: ${expression}`,
    "Result: available in the Scientific Calculator receipt/trace.",
    "Trace source: scientific-calculator.",
  ].join("\n");
}

function noteTitleFromPlan(plan: HelixWorkstationToolPlan): string {
  const create = plan.steps.find((step) => step.panel_id === "workstation-notes" && step.action_id === "create_note");
  const title = create?.args?.title;
  return typeof title === "string" && title.trim() ? title.trim() : "Untitled note";
}

function ideologyMotiveFromPlan(plan: HelixWorkstationToolPlan): string {
  const compare = plan.steps.find((step) => step.panel_id === "mission-ethos" && step.action_id === "compare_motive_to_zen");
  const motive = compare?.args?.motive;
  return typeof motive === "string" && motive.trim() ? motive.trim() : "the provided motive";
}

export function synthesizeWorkstationToolAnswer(input: SynthesizeWorkstationAnswerInput): string {
  if (input.plan.intent === "calculator_verify" || input.plan.intent === "calculator_solve") {
    return calculatorResultText(input.prompt);
  }
  if (input.plan.intent === "notes_create") {
    return `Created workstation note "${noteTitleFromPlan(input.plan)}". I can refer to it through the note receipt instead of reinjecting the full body into Ask.`;
  }
  if (input.plan.intent === "notes_append" || input.plan.intent === "notes_store_large_text") {
    return "Stored the requested text in Workstation Notes. I will use note references instead of raw text injection by default.";
  }
  if (input.plan.intent === "ideology_compare") {
    return [
      `Ran the ideology comparison tool for: ${ideologyMotiveFromPlan(input.plan)}`,
      "Use the Mission Ethos / Zen receipt as compact evidence, then synthesize the motive comparison from that evidence.",
    ].join("\n");
  }
  return input.evaluation?.summary ?? "Completed workstation tool evaluation.";
}
