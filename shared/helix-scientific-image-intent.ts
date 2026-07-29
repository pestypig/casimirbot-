const stripNegatedScientificImageClauses = (question: string): string =>
  question.replace(
    /\b(?:do\s+not|don't|without|exclude|avoid)\b(?:(?!\b(?:but|however|instead)\b)[^.!?;\n]){0,240}/gi,
    " ",
  );

const affirmativeScientificImageRequestText = (question: string): string =>
  stripNegatedScientificImageClauses(
    question
      .replace(/`[^`]*`|"[^"]*"|'[^']*'/g, " ")
      .replace(
        /\b(?:previously|earlier|historically|last\s+time)\b[^.!?;\n]{0,240}/gi,
        " ",
      )
      .replace(/\b(?:if|when)\b[^.!?;\n]{0,240}/gi, " ")
      .replace(
        /[^.!?;\n]{0,240}\b(?:later|in\s+the\s+future|eventually)\b[^.!?;\n]{0,80}/gi,
        " ",
      ),
  );

/**
 * Detects an affirmative request to compare retained machine-readable paper
 * text with retained Image Lens evidence. Contextual mentions are deliberately
 * removed before classification so route admission cannot be triggered by a
 * quote, history, condition, or future plan.
 */
export const asksForScientificImageTextEvidenceComparison = (question: string): boolean => {
  const affirmativeQuestion = affirmativeScientificImageRequestText(question);
  return (
    /\b(?:compare|reconcile|cross-check)\b/i.test(affirmativeQuestion) &&
    /\b(?:image\s+lens|crop|visual|page\s+image)\b/i.test(affirmativeQuestion) &&
    /\b(?:machine-readable|full[-\s]?text|page[-\s]?text|textual|transcription|ocr)\b/i.test(affirmativeQuestion)
  );
};

/**
 * Detects a current request to inspect the identity and claim boundary of a
 * retained scientific-image extraction. This is deliberately broader than a
 * paper workflow: the retained sidecar may originate from any conformed
 * scientific source that supplies stable source, page, crop, and packet
 * identities.
 */
export const asksForScientificImageEvidenceContinuity = (
  question: string,
): boolean => {
  const affirmativeQuestion = affirmativeScientificImageRequestText(question);
  if (!affirmativeQuestion.trim()) return false;
  if (
    /\b(?:fresh|new)\b[\s\S]{0,80}\b(?:capture|crop|render|ocr|extract|inspection)\b/i.test(
      affirmativeQuestion,
    )
  ) {
    return false;
  }
  if (
    /\b(?:reflect|map|place|attach|send)\b[\s\S]{0,120}\b(?:theory\s+badge\s+graph|theory\s+graph)\b/i.test(
      affirmativeQuestion,
    ) ||
    /\b(?:theory\s+badge\s+graph|theory\s+graph)\b[\s\S]{0,120}\b(?:reflect|map|place|attach|send)\b/i.test(
      affirmativeQuestion,
    )
  ) {
    return false;
  }

  const requestsIdentityOrBoundary =
    /\b(?:report|show|tell\s+me|summari[sz]e|audit|identify|which|what)\b[\s\S]{0,180}\b(?:sidecar|source\s+(?:id|hash)|page|crop\s+(?:ref|reference)|evidence\s+depth|promoted\s+equation|exact\s+row|claim\s+boundary|graph\s+reflection)\b/i.test(
      affirmativeQuestion,
    ) ||
    /\b(?:sidecar|source\s+(?:id|hash)|crop\s+(?:ref|reference)|evidence\s+depth|promoted\s+equation|exact\s+row)\b[\s\S]{0,180}\b(?:report|show|identify|which|what|using)\b/i.test(
      affirmativeQuestion,
    );
  const refersToRetainedExtraction =
    /\bprior\s+steps?\b/i.test(affirmativeQuestion) ||
    /\b(?:that|this|the|prior|previous|latest|retained|saved|promoted)\b[\s\S]{0,80}\b(?:extraction|evidence|sidecar|crop|equation|exact\s+row|scientific\s+image)\b/i.test(
      affirmativeQuestion,
    ) ||
    /\b(?:retained|saved|prior|previous|latest)\b[\s\S]{0,80}\b(?:packet|source|page|image\s+lens|graph\s+reflection)\b/i.test(
      affirmativeQuestion,
    ) ||
    /\b(?:continuity\s+audit|scientific\s+image\s+evidence\s+continuity)\b/i.test(
      affirmativeQuestion,
    );

  return requestsIdentityOrBoundary && refersToRetainedExtraction;
};
