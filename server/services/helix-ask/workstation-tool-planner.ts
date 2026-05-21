import {
  HELIX_WORKSTATION_TOOL_PLAN_SCHEMA,
  type HelixWorkstationToolPlan,
  type HelixWorkstationToolPlanIntent,
  type HelixWorkstationToolPlanStep,
} from "../../../shared/helix-workstation-tool-plan";
import type { HelixDerivedEquation } from "../../../shared/helix-derived-equation";

export type WorkstationToolIntent =
  | "calculator_verify"
  | "calculator_solve"
  | "notes_create"
  | "notes_append"
  | "notes_store_large_text"
  | "ideology_compare"
  | "live_environment_create"
  | "direct_answer";

export type WorkstationToolPlannerAction = {
  panel_id: string;
  action_id: string;
  args: Record<string, unknown>;
};

export type AffordanceScore = {
  affordance_id: string;
  panel_id: string;
  action_id: string;
  score: number;
  reason: string;
  required_args_missing: string[];
};

export type WorkstationToolPlannerResult = {
  intent: WorkstationToolIntent;
  action: WorkstationToolPlannerAction | null;
  tool_plan: HelixWorkstationToolPlan | null;
  scores: AffordanceScore[];
  should_use_tool: boolean;
  reason: string;
  missing_required_args: string[];
};

export type PlanWorkstationToolUseOptions = {
  threadId?: string | null;
  turnId?: string | null;
  now?: Date;
};

function makePlanId(intent: string): string {
  return `workstation-plan:${intent}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

function normalizePrompt(prompt: string): string {
  return prompt.trim().replace(/\s+/g, " ");
}

function stripOuterPunctuation(value: string): string {
  return value
    .trim()
    .replace(/\s+(?:with\s+)?(?:steps?|show\s+work|trace)$/i, "")
    .replace(/^[:"'“”`{\[\(]+/g, "")
    .replace(/[.!?,"'“”`\]\)}]+$/g, "")
    .trim();
}

function stripCalculatorInstructionTail(value: string): string {
  return value
    .replace(/\s+(?:and\s+)?(?:tell|show|give|report)\s+(?:me|us)?\s*(?:the\s+)?(?:result|answer|value|output)\b[\s\S]*$/i, "")
    .replace(/\s+(?:and\s+)?(?:return|provide)\s+(?:the\s+)?(?:result|answer|value|output)\b[\s\S]*$/i, "")
    .replace(/\s+(?:and\s+)?(?:explain|describe|summari[sz]e)\s+(?:the\s+)?(?:result|answer|value|output)\b[\s\S]*$/i, "")
    .replace(/\s+\band\s+(?:explain|describe|summari[sz]e)\b[\s\S]*$/i, "")
    .replace(/\s+(?:in|with|using)\s+(?:the\s+)?(?:scientific\s+)?calculator\b[\s\S]*$/i, "")
    .trim();
}

function extractQuoted(prompt: string): string | null {
  const match = prompt.match(/["“](.+?)["”]/);
  return stripOuterPunctuation(match?.[1] ?? "") || null;
}

function extractInlineMathExpression(value: string): string | null {
  const assignment = value.match(/\b[A-Za-z_][A-Za-z0-9_]*(?:\([^)]*\))?\s*=\s*[-+()A-Za-z0-9_.*\/^\\\s]+/)?.[0];
  if (assignment) return stripOuterPunctuation(assignment);
  const equation = value.match(/\b[A-Za-z_][A-Za-z0-9_]*(?:\s*\^\s*[-+]?\d+(?:\.\d+)?)?(?:\s*[+\-*/]\s*[-+()A-Za-z0-9_.*\/^\\\s]+)+\s*=\s*[-+()A-Za-z0-9_.*\/^\\\s]+/)?.[0];
  if (equation) return stripOuterPunctuation(equation);
  const arithmetic = value.match(/[-+]?(?:\d+\.?\d*|\.\d+)(?:\s*[+\-*/^]\s*[-+]?(?:\d+\.?\d*|\.\d+))+/)?.[0];
  return arithmetic ? stripOuterPunctuation(arithmetic) : null;
}

export function extractCalculatorExpression(prompt: string): string | null {
  const normalized = normalizePrompt(prompt);
  const colonTail = normalized.match(/(?:equation|expression|claim|calculator|solve|evaluate|compute|check|verify)[^:]{0,120}:\s*(.+)$/i)?.[1];
  if (colonTail) return stripOuterPunctuation(stripCalculatorInstructionTail(colonTail));

  const quoted = extractQuoted(normalized);
  if (quoted && /[=+\-*/^]|\\frac|\\sqrt|\d/.test(quoted)) return quoted;

  const solveTail = normalized.match(/\b(?:solve|evaluate|compute|calculate|check|verify)\s+(.+)$/i)?.[1];
  if (solveTail) {
    const cleaned = stripCalculatorInstructionTail(solveTail);
    if (/[=+\-*/^]|\\frac|\\sqrt|\d/.test(cleaned)) {
      return stripOuterPunctuation(cleaned);
    }
  }

  const inlineMath = extractInlineMathExpression(normalized);
  if (inlineMath) return inlineMath;

  const calculatorTail = normalized.match(/\b(?:calculator|calc)\b\s*(.+)$/i)?.[1];
  if (calculatorTail && /[=+\-*/^]|\\frac|\\sqrt|\d/.test(calculatorTail)) {
    const cleaned = stripCalculatorInstructionTail(calculatorTail);
    return extractInlineMathExpression(cleaned) ?? stripOuterPunctuation(cleaned);
  }

  return null;
}

function extractNoteTitle(prompt: string): string | null {
  const normalized = normalizePrompt(prompt);
  const quotedAfterTitle = normalized.match(/\b(?:titled|called|named)\s+["“](.+?)["”]/i)?.[1];
  if (quotedAfterTitle) return stripOuterPunctuation(quotedAfterTitle);
  const afterTitle = normalized.match(/\b(?:titled|called|named)\s+(.+?)(?:\s+(?:with|containing|that says|saying|body|text)\b|$)/i)?.[1];
  const explicit = stripOuterPunctuation(afterTitle ?? "");
  if (explicit) return explicit;
  if (/\b(?:open|current|active)\s+doc(?:ument)?\b/i.test(normalized)) return "Open document summary";
  if (/\bdoc(?:ument)?\b/i.test(normalized)) return "Document summary";
  return null;
}

function extractNoteBody(prompt: string): string | null {
  const normalized = normalizePrompt(prompt);
  const body = normalized.match(/\b(?:with\s+body|body|containing|that\s+says|saying|with\s+text|text)\s*[:\-]?\s*(.+)$/i)?.[1];
  if (body) return stripOuterPunctuation(body);
  const afterColon = normalized.match(/:\s*(.+)$/)?.[1];
  if (afterColon && /\b(?:note|notes|notepad|store|save)\b/i.test(normalized)) return stripOuterPunctuation(afterColon);
  return null;
}

function isCalculatorPrompt(prompt: string): boolean {
  return /\b(?:calculator|solve|evaluate|compute|verify|check)\b/i.test(prompt) &&
    (/\b(?:equation|expression|math|numeric|calculation|with\s+steps|show\s+work)\b/i.test(prompt) || Boolean(extractCalculatorExpression(prompt)));
}

function isNoteCreatePrompt(prompt: string): boolean {
  return /\b(?:create|make|new|start)\b[\s\S]{0,80}\b(?:workstation\s+)?note\b/i.test(prompt);
}

function isNoteAppendPrompt(prompt: string): boolean {
  return /\b(?:append|add|save|store|preserve)\b[\s\S]{0,120}\b(?:to|into|in)\s+(?:the\s+)?(?:workstation\s+)?notes?\b/i.test(prompt) ||
    /\b(?:save|store|preserve)\b[\s\S]{0,80}\b(?:transcript|text|chunk|large\s+context)\b/i.test(prompt);
}

function isIdeologyComparePrompt(prompt: string): boolean {
  return (
    /\b(?:compare|check|evaluate|review|analy[sz]e)\b[\s\S]{0,100}\b(?:motive|intent|intention|goal|behavior|decision|action)\b[\s\S]{0,140}\b(?:zen|ethos|ideology|mission\s+ethos)\b/i.test(prompt) ||
    /\b(?:zen|ethos|ideology|mission\s+ethos)\b[\s\S]{0,100}\b(?:compare|check|evaluate|review|analy[sz]e)\b/i.test(prompt)
  );
}

function extractIdeologyMotive(prompt: string): string | null {
  const normalized = normalizePrompt(prompt);
  const quoted = extractQuoted(normalized);
  if (quoted) return quoted;
  const afterColon = normalized.match(/:\s*(.+)$/)?.[1];
  if (afterColon) return stripOuterPunctuation(afterColon);
  const afterToZen = normalized.match(/\b(?:to|against|with|through|using)\s+(?:the\s+)?(?:zen|ethos|ideology|mission\s+ethos)(?:\s+framework)?\s*(.+)$/i)?.[1];
  if (afterToZen) return stripOuterPunctuation(afterToZen);
  return normalized
    .replace(/\b(?:compare|check|evaluate|review|analy[sz]e)\b/gi, " ")
    .replace(/\b(?:this|that|motive|intent|intention|goal|behavior|decision|action|to|against|with|through|using|the|a|an|zen|ethos|ideology|mission)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 800) || null;
}

function buildToolPlan(args: {
  prompt: string;
  intent: Exclude<HelixWorkstationToolPlanIntent, "direct_answer">;
  missing: string[];
  steps: HelixWorkstationToolPlanStep[];
  options?: PlanWorkstationToolUseOptions;
}): HelixWorkstationToolPlan {
  return {
    schema: HELIX_WORKSTATION_TOOL_PLAN_SCHEMA,
    plan_id: makePlanId(args.intent),
    thread_id: args.options?.threadId?.trim() || "helix-ask:desktop",
    turn_id: args.options?.turnId?.trim() || "turn:pending",
    goal: args.prompt,
    intent: args.intent,
    steps: args.steps,
    missing_requirements: args.missing,
    created_at: (args.options?.now ?? new Date()).toISOString(),
  };
}

function makeOpenStep(panelId: string, depends_on: string[] = []): HelixWorkstationToolPlanStep {
  return {
    step_id: `open_${panelId.replace(/[^a-z0-9]+/gi, "_")}`,
    kind: "open_panel",
    panel_id: panelId,
    action_id: "open",
    args: {},
    depends_on,
    expected_receipt_kind: "workspace_action_receipt",
    expected_state_change: { panel_id: panelId, open: true },
    required: true,
  };
}

export function planWorkstationToolUse(
  prompt: string,
  options: PlanWorkstationToolUseOptions = {},
): WorkstationToolPlannerResult {
  const normalized = normalizePrompt(prompt);
  const scores: AffordanceScore[] = [];
  const pushScore = (score: AffordanceScore) => scores.push(score);

  if (isNoteCreatePrompt(normalized)) {
    const title = extractNoteTitle(normalized);
    const body = extractNoteBody(normalized);
    pushScore({
      affordance_id: "workstation-notes.create_note",
      panel_id: "workstation-notes",
      action_id: "create_note",
      score: title ? 0.92 : 0.72,
      reason: title ? "note creation prompt includes a title" : "note creation prompt can create an untitled note",
      required_args_missing: [],
    });
    const toolPlan = buildToolPlan({
      prompt: normalized,
      intent: "notes_create",
      missing: [],
      options,
      steps: [
        makeOpenStep("workstation-notes"),
        {
          step_id: "create_note",
          kind: "run_panel_action",
          panel_id: "workstation-notes",
          action_id: "create_note",
          args: {
            ...(title ? { title } : {}),
            ...(body ? { body } : {}),
          },
          depends_on: ["open_workstation_notes"],
          expected_receipt_kind: "note_action_receipt",
          expected_state_change: { store: "workstation-notes", proof_key: "note_id" },
          required: true,
        },
        {
          step_id: "evaluate_note_receipt",
          kind: "evaluate_result",
          depends_on: ["create_note"],
          expected_receipt_kind: "helix.workstation_tool_evaluation.v1",
          required: true,
        },
      ],
    });
    return {
      intent: "notes_create",
      action: {
        panel_id: "workstation-notes",
        action_id: "create_note",
        args: {
          ...(title ? { title } : {}),
          ...(body ? { body } : {}),
        },
      },
      tool_plan: toolPlan,
      scores,
      should_use_tool: true,
      reason: "Prompt asks to create a workstation note; notes affordance should run.",
      missing_required_args: [],
    };
  }

  if (isNoteAppendPrompt(normalized)) {
    const body = extractNoteBody(normalized) ?? extractQuoted(normalized);
    pushScore({
      affordance_id: "workstation-notes.append_to_note",
      panel_id: "workstation-notes",
      action_id: "append_to_note",
      score: body ? 0.88 : 0.58,
      reason: body ? "note storage prompt includes text" : "note storage prompt needs text or an existing artifact",
      required_args_missing: body ? [] : ["text"],
    });
    const toolPlan = buildToolPlan({
      prompt: normalized,
      intent: body ? "notes_append" : "notes_store_large_text",
      missing: body ? [] : ["text"],
      options,
      steps: [
        makeOpenStep("workstation-notes"),
        {
          step_id: "append_to_note",
          kind: "run_panel_action",
          panel_id: "workstation-notes",
          action_id: "append_to_note",
          args: body ? { text: body } : {},
          depends_on: ["open_workstation_notes"],
          expected_receipt_kind: "note_action_receipt",
          expected_state_change: { store: "workstation-notes", proof_key: "section_id" },
          required: true,
        },
        {
          step_id: "evaluate_note_receipt",
          kind: "evaluate_result",
          depends_on: ["append_to_note"],
          expected_receipt_kind: "helix.workstation_tool_evaluation.v1",
          required: true,
        },
      ],
    });
    return {
      intent: body ? "notes_append" : "notes_store_large_text",
      action: body ? { panel_id: "workstation-notes", action_id: "append_to_note", args: { text: body } } : null,
      tool_plan: toolPlan,
      scores,
      should_use_tool: true,
      reason: "Prompt asks to store text in notes; note output should be a receipt-backed action.",
      missing_required_args: body ? [] : ["text"],
    };
  }

  if (isCalculatorPrompt(normalized)) {
    const latex = extractCalculatorExpression(normalized);
    const wantsSteps = /\b(?:steps?|show\s+work|trace|verify|check)\b/i.test(normalized);
    const actionId = wantsSteps ? "solve_with_steps" : "solve_expression";
    pushScore({
      affordance_id: `scientific-calculator.${actionId}`,
      panel_id: "scientific-calculator",
      action_id: actionId,
      score: latex ? 0.94 : 0.64,
      reason: latex ? "math prompt includes a candidate expression" : "math prompt lacks a concrete expression",
      required_args_missing: latex ? [] : ["latex"],
    });
    const solveStepId = actionId;
    const toolPlan = buildToolPlan({
      prompt: normalized,
      intent: wantsSteps ? "calculator_verify" : "calculator_solve",
      missing: latex ? [] : ["latex"],
      options,
      steps: [
        makeOpenStep("scientific-calculator"),
        {
          step_id: "ingest_expression",
          kind: "run_panel_action",
          panel_id: "scientific-calculator",
          action_id: "ingest_latex",
          args: latex ? { latex } : {},
          depends_on: ["open_scientific_calculator"],
          expected_receipt_kind: "workspace_action_receipt",
          expected_state_change: { store: "scientific-calculator", proof_key: "input_latex" },
          required: true,
        },
        {
          step_id: solveStepId,
          kind: "run_panel_action",
          panel_id: "scientific-calculator",
          action_id: actionId,
          args: latex ? { latex } : {},
          depends_on: ["ingest_expression"],
          expected_receipt_kind: "calculator_receipt",
          expected_state_change: { store: "scientific-calculator", proof_key: "result_text" },
          required: true,
        },
        {
          step_id: "evaluate_calculator_result",
          kind: "evaluate_result",
          depends_on: [solveStepId],
          expected_receipt_kind: "helix.workstation_tool_evaluation.v1",
          required: true,
        },
      ],
    });
    return {
      intent: wantsSteps ? "calculator_verify" : "calculator_solve",
      action: latex ? { panel_id: "scientific-calculator", action_id: actionId, args: { latex } } : null,
      tool_plan: toolPlan,
      scores,
      should_use_tool: true,
      reason: "Prompt asks for math verification/evaluation; calculator affordance should run before direct answer.",
      missing_required_args: latex ? [] : ["latex"],
    };
  }

  if (isIdeologyComparePrompt(normalized)) {
    const motive = extractIdeologyMotive(normalized);
    const framework = /\b(?:mission\s+ethos|ethos|ideology)\b/i.test(normalized) && !/\bzen\b/i.test(normalized)
      ? "mission_ethos"
      : "zen";
    pushScore({
      affordance_id: "mission-ethos.compare_motive_to_zen",
      panel_id: "mission-ethos",
      action_id: "compare_motive_to_zen",
      score: motive ? 0.91 : 0.62,
      reason: motive ? "ideology comparison prompt includes a motive" : "ideology comparison prompt needs a motive",
      required_args_missing: motive ? [] : ["motive"],
    });
    const toolPlan = buildToolPlan({
      prompt: normalized,
      intent: "ideology_compare",
      missing: motive ? [] : ["motive"],
      options,
      steps: [
        makeOpenStep("mission-ethos"),
        {
          step_id: "compare_motive_to_zen",
          kind: "run_panel_action",
          panel_id: "mission-ethos",
          action_id: "compare_motive_to_zen",
          args: motive ? { motive, framework } : { framework },
          depends_on: ["open_mission_ethos"],
          expected_receipt_kind: "ideology_motive_comparison_receipt",
          expected_state_change: { store: "mission-ethos", proof_key: "evidence_refs" },
          required: true,
        },
        {
          step_id: "evaluate_ideology_comparison",
          kind: "evaluate_result",
          depends_on: ["compare_motive_to_zen"],
          expected_receipt_kind: "helix.workstation_tool_evaluation.v1",
          required: true,
        },
      ],
    });
    return {
      intent: "ideology_compare",
      action: motive ? { panel_id: "mission-ethos", action_id: "compare_motive_to_zen", args: { motive, framework } } : null,
      tool_plan: toolPlan,
      scores,
      should_use_tool: true,
      reason: "Prompt asks for ideology/Zen comparison; mission-ethos affordance should run before final answer.",
      missing_required_args: motive ? [] : ["motive"],
    };
  }

  return {
    intent: "direct_answer",
    action: null,
    tool_plan: null,
    scores,
    should_use_tool: false,
    reason: "No workstation affordance is clearly required.",
    missing_required_args: [],
  };
}

export function planWorkstationToolUseFromDerivedEquation(input: {
  equation: HelixDerivedEquation;
  threadId: string;
  turnId: string;
  wantsSteps?: boolean;
}): WorkstationToolPlannerResult {
  const actionId = input.wantsSteps === false ? "solve_expression" : "solve_with_steps";
  const prompt = `Derived calculator expression: ${input.equation.expression}`;
  const steps: HelixWorkstationToolPlanStep[] = [
    makeOpenStep("scientific-calculator"),
    {
      step_id: "ingest_expression",
      kind: "run_panel_action",
      panel_id: "scientific-calculator",
      action_id: "ingest_latex",
      args: { latex: input.equation.expression },
      depends_on: ["open_scientific_calculator"],
      expected_receipt_kind: "workspace_action_receipt",
      expected_state_change: { store: "scientific-calculator", proof_key: "input_latex" },
      required: true,
    },
    {
      step_id: actionId,
      kind: "run_panel_action",
      panel_id: "scientific-calculator",
      action_id: actionId,
      args: { latex: input.equation.expression },
      depends_on: ["ingest_expression"],
      expected_receipt_kind: "calculator_receipt",
      expected_state_change: { store: "scientific-calculator", proof_key: "result_text" },
      required: true,
    },
    {
      step_id: "evaluate_calculator_result",
      kind: "evaluate_result",
      depends_on: [actionId],
      expected_receipt_kind: "helix.workstation_tool_evaluation.v1",
      required: true,
    },
  ];
  const toolPlan = buildToolPlan({
    prompt,
    intent: actionId === "solve_with_steps" ? "calculator_verify" : "calculator_solve",
    missing: [],
    options: { threadId: input.threadId, turnId: input.turnId },
    steps,
  });
  return {
    intent: toolPlan.intent,
    action: {
      panel_id: "scientific-calculator",
      action_id: actionId,
      args: { latex: input.equation.expression },
    },
    tool_plan: toolPlan,
    scores: [
      {
        affordance_id: `scientific-calculator.${actionId}`,
        panel_id: "scientific-calculator",
        action_id: actionId,
        score: 0.96,
        reason: "Derived equation provides a concrete calculator expression without prompt-string grafting.",
        required_args_missing: [],
      },
    ],
    should_use_tool: true,
    reason: "Derived equation should be evaluated through the Scientific Calculator tool chain.",
    missing_required_args: [],
  };
}
