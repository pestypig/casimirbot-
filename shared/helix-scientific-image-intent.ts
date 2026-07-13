const stripNegatedScientificImageClauses = (question: string): string =>
  question.replace(
    /\b(?:do\s+not|don't|without|exclude|avoid)\b(?:(?!\b(?:but|however|instead)\b)[^.!?;\n]){0,240}/gi,
    " ",
  );

/**
 * Detects an affirmative request to compare retained machine-readable paper
 * text with retained Image Lens evidence. Contextual mentions are deliberately
 * removed before classification so route admission cannot be triggered by a
 * quote, history, condition, or future plan.
 */
export const asksForScientificImageTextEvidenceComparison = (question: string): boolean => {
  const comparisonDirectiveQuestion = question
    .replace(/`[^`]*`|"[^"]*"|'[^']*'/g, " ")
    .replace(/\b(?:previously|earlier|historically|last\s+time)\b[^.!?;\n]{0,240}/gi, " ")
    .replace(/\b(?:if|when)\b[^.!?;\n]{0,240}/gi, " ")
    .replace(/[^.!?;\n]{0,240}\b(?:later|in\s+the\s+future|eventually)\b[^.!?;\n]{0,80}/gi, " ");
  const affirmativeQuestion = stripNegatedScientificImageClauses(comparisonDirectiveQuestion);
  return (
    /\b(?:compare|reconcile|cross-check)\b/i.test(affirmativeQuestion) &&
    /\b(?:image\s+lens|crop|visual|page\s+image)\b/i.test(affirmativeQuestion) &&
    /\b(?:machine-readable|full[-\s]?text|page[-\s]?text|textual|transcription|ocr)\b/i.test(affirmativeQuestion)
  );
};
