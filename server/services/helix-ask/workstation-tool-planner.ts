export type WorkstationToolIntent =
  | "calculator_verify"
  | "calculator_solve"
  | "notes_create"
  | "notes_append"
  | "notes_store_large_text"
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
  scores: AffordanceScore[];
  should_use_tool: boolean;
  reason: string;
  missing_required_args: string[];
};

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

function extractQuoted(prompt: string): string | null {
  const match = prompt.match(/["“](.+?)["”]/);
  return stripOuterPunctuation(match?.[1] ?? "") || null;
}

export function extractCalculatorExpression(prompt: string): string | null {
  const normalized = normalizePrompt(prompt);
  const colonTail = normalized.match(/(?:equation|expression|claim|calculator|solve|evaluate|compute|check|verify)[^:]{0,120}:\s*(.+)$/i)?.[1];
  if (colonTail) return stripOuterPunctuation(colonTail);

  const quoted = extractQuoted(normalized);
  if (quoted && /[=+\-*/^]|\\frac|\\sqrt|\d/.test(quoted)) return quoted;

  const calculatorTail = normalized.match(/\b(?:calculator|calc)\b\s*(.+)$/i)?.[1];
  if (calculatorTail && /[=+\-*/^]|\\frac|\\sqrt|\d/.test(calculatorTail)) {
    return stripOuterPunctuation(calculatorTail);
  }

  const solveTail = normalized.match(/\b(?:solve|evaluate|compute|check|verify)\s+(.+?)(?:\s+(?:with|using|in)\s+(?:the\s+)?(?:scientific\s+)?calculator)?$/i)?.[1];
  if (solveTail && /[=+\-*/^]|\\frac|\\sqrt|\d/.test(solveTail)) {
    return stripOuterPunctuation(solveTail);
  }

  return null;
}

function extractNoteTitle(prompt: string): string | null {
  const normalized = normalizePrompt(prompt);
  const quotedAfterTitle = normalized.match(/\b(?:titled|called|named)\s+["“](.+?)["”]/i)?.[1];
  if (quotedAfterTitle) return stripOuterPunctuation(quotedAfterTitle);
  const afterTitle = normalized.match(/\b(?:titled|called|named)\s+(.+?)(?:\s+(?:with|containing|that says|saying|body|text)\b|$)/i)?.[1];
  return stripOuterPunctuation(afterTitle ?? "") || null;
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

export function planWorkstationToolUse(prompt: string): WorkstationToolPlannerResult {
  const normalized = normalizePrompt(prompt);
  const scores: AffordanceScore[] = [];
  const pushScore = (score: AffordanceScore) => scores.push(score);

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
    return {
      intent: wantsSteps ? "calculator_verify" : "calculator_solve",
      action: latex ? { panel_id: "scientific-calculator", action_id: actionId, args: { latex } } : null,
      scores,
      should_use_tool: true,
      reason: "Prompt asks for math verification/evaluation; calculator affordance should run before direct answer.",
      missing_required_args: latex ? [] : ["latex"],
    };
  }

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
    return {
      intent: body ? "notes_append" : "notes_store_large_text",
      action: body ? { panel_id: "workstation-notes", action_id: "append_to_note", args: { text: body } } : null,
      scores,
      should_use_tool: true,
      reason: "Prompt asks to store text in notes; note output should be a receipt-backed action.",
      missing_required_args: body ? [] : ["text"],
    };
  }

  return {
    intent: "direct_answer",
    action: null,
    scores,
    should_use_tool: false,
    reason: "No workstation affordance is clearly required.",
    missing_required_args: [],
  };
}
