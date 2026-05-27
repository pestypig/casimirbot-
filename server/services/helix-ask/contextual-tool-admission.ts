export type HelixContextualToolAdmissionSuppressionReason =
  | "negated_tool_instruction"
  | "quoted_tool_command"
  | "hypothetical_tool_reference"
  | "historical_tool_reference"
  | "explanatory_only";

export type HelixContextualToolAdmissionSuppression = {
  tool_admission_suppressed: true;
  suppression_reason: HelixContextualToolAdmissionSuppressionReason;
  verb_or_cue: string;
  text: string;
};

const DOCS_VIEWER_CUE_RE = /\bdocs?\s+viewer\b|\bdocuments?\s+viewer\b|\bdocs?\s+panel\b|\bdocuments?\s+panel\b/i;
const DOCS_VIEWER_ACTION_RE = /\b(?:open|open\s+up|show|view|pull\s+up|bring\s+up|switch\s+to|go\s+to|navigate\s+to|load)\b[\s\S]{0,100}(?:the\s+|a\s+)?(?:docs?\s+viewer|documents?\s+viewer|docs?\s+panel|documents?\s+panel|docs?)\b/i;
const DOCS_VIEWER_EXPLANATION_RE = /\b(?:just\s+)?(?:explain|describe|tell\s+me|what\s+is|what\s+are|what(?:'s|\s+is)?|what\s+does)\b[\s\S]{0,120}\b(?:docs?\s+viewer|documents?\s+viewer|docs?\s+panel|documents?\s+panel)\b[\s\S]{0,80}\b(?:for|mean|do|does|is|are|used\s+for|purpose)\b/i;

export function detectContextualToolAdmissionSuppression(promptText: string): HelixContextualToolAdmissionSuppression | null {
  const prompt = promptText.trim();
  if (!prompt || !DOCS_VIEWER_CUE_RE.test(prompt)) return null;

  const quoted = prompt.match(/["'`][^"'`]*(?:open|show|view|pull\s+up|bring\s+up)[^"'`]*(?:docs?\s+viewer|documents?\s+viewer|docs?\s+panel|documents?\s+panel|docs?)[^"'`]*["'`]/i)?.[0];
  if (quoted) {
    return {
      tool_admission_suppressed: true,
      suppression_reason: "quoted_tool_command",
      verb_or_cue: "docs_viewer.open",
      text: quoted,
    };
  }

  const negated = prompt.match(/\b(?:do\s+not|don't|dont|never|without|not\s+asking\s+to)\b[\s\S]{0,80}(?:open|open\s+up|show|view|pull\s+up|bring\s+up|switch\s+to|go\s+to|navigate\s+to|load)\b[\s\S]{0,100}(?:docs?\s+viewer|documents?\s+viewer|docs?\s+panel|documents?\s+panel|docs?)\b/i)?.[0];
  if (negated) {
    return {
      tool_admission_suppressed: true,
      suppression_reason: "negated_tool_instruction",
      verb_or_cue: "docs_viewer.open",
      text: negated,
    };
  }

  const hypothetical = prompt.match(/\b(?:if|when|before|after|would|could|might|hypothetically)\b[\s\S]{0,100}(?:I|we|you)?\s*(?:opened?|open|show|view|pull\s+up|bring\s+up)\b[\s\S]{0,100}(?:docs?\s+viewer|documents?\s+viewer|docs?\s+panel|documents?\s+panel|docs?)\b/i)?.[0];
  if (hypothetical) {
    return {
      tool_admission_suppressed: true,
      suppression_reason: "hypothetical_tool_reference",
      verb_or_cue: "docs_viewer.open",
      text: hypothetical,
    };
  }

  const historical = prompt.match(/\b(?:I|we|you)\s+(?:already\s+|previously\s+|earlier\s+)?opened?\b[\s\S]{0,100}(?:docs?\s+viewer|documents?\s+viewer|docs?\s+panel|documents?\s+panel|docs?)\b|\b(?:earlier|previously|last\s+turn|before)\b[\s\S]{0,100}(?:opened?|showed|viewed)\b[\s\S]{0,100}(?:docs?\s+viewer|documents?\s+viewer|docs?\s+panel|documents?\s+panel|docs?)\b/i)?.[0];
  if (historical) {
    return {
      tool_admission_suppressed: true,
      suppression_reason: "historical_tool_reference",
      verb_or_cue: "docs_viewer.open",
      text: historical,
    };
  }

  if (DOCS_VIEWER_EXPLANATION_RE.test(prompt) && !DOCS_VIEWER_ACTION_RE.test(prompt)) {
    return {
      tool_admission_suppressed: true,
      suppression_reason: "explanatory_only",
      verb_or_cue: "docs_viewer.open",
      text: prompt.match(DOCS_VIEWER_EXPLANATION_RE)?.[0] ?? "docs viewer explanation request",
    };
  }

  return null;
}
