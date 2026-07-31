export const THEORY_FORMAL_VERIFIER_INSPECT_ARTIFACT_FAMILY_CAPABILITY =
  "theory-formal-verifier.inspect_artifact_family" as const;

export type TheoryFormalArtifactInspectionPromptMatch = {
  matched_text: string;
  match_index: number;
  match_end_index: number;
};

export type TheoryFormalArtifactInspectionPromptArguments = {
  formal_artifact_id: string;
  theorem_name?: string;
};

const unquotePrompt = (value: string): string =>
  value.replace(/"[^"]*"|'[^']*'|`[^`]*`/g, " ");

const INSPECTION_COMMAND =
  /\b(?:inspect|audit|check|examine|read|look\s+at|look\s+into|review)\b/i;
const FORMAL_OBJECT =
  /\b(?:registered|audited|server[-\s]+governed)?\s*(?:gr[-\s]*maxwell\s+)?(?:one|two|three|1|2|3)[-\s]*dimensional\s+formal\s+(?:source|artifact|theorem(?:\s+family)?)\b|\bregistered\s+gr[-\s]*maxwell\s+(?:formal\s+)?(?:source|artifact|theorem(?:\s+family)?)\b/i;
const NEGATED_INSPECTION =
  /\b(?:do\s+not|don't|dont|never|without|avoid|not\s+asking\s+to)\b[^.!?;\n]{0,120}\b(?:inspect|audit|check|examine|read|review|look\s+at|look\s+into)\b/i;
const DEFERRED_INSPECTION =
  /\b(?:later|eventually|in\s+the\s+future|next\s+time|if|when|unless)\b[^.!?;\n]{0,140}\b(?:inspect|audit|check|examine|read|review|look\s+at|look\s+into)\b/i;
const HISTORICAL_INSPECTION =
  /\b(?:earlier|previously|historically|last\s+turn|already)\b[^.!?;\n]{0,140}\b(?:inspected|audited|checked|examined|read|reviewed|looked\s+at|looked\s+into)\b/i;
const SCREEN_REFERENCE =
  /\b(?:screen|panel|debug|label|button|text|phrase)\b[^.!?;\n]{0,120}\b(?:shows|showed|says|said|reads|contains|mentions)\b[^.!?;\n]{0,140}\b(?:formal\s+(?:source|artifact)|theory-formal-verifier\.inspect_artifact_family)\b/i;

const dimensionFromPrompt = (prompt: string): "1d" | "2d" | "3d" | null => {
  if (/\b(?:one|1)[-\s]*dimensional\b|\b1d\b/i.test(prompt)) return "1d";
  if (/\b(?:two|2)[-\s]*dimensional\b|\b2d\b/i.test(prompt)) return "2d";
  if (/\b(?:three|3)[-\s]*dimensional\b|\b3d\b/i.test(prompt)) return "3d";
  return null;
};

const theoremNameFromPrompt = (prompt: string): string | null =>
  prompt.match(
    /\b(?:around|for|named|called|theorem)\s+([A-Za-z][A-Za-z0-9_]*)\b/i,
  )?.[1] ?? prompt.match(/\b(x[A-Z][A-Za-z0-9_]*)\b/)?.[1] ?? null;

export const theoryFormalArtifactInspectionPromptMatch = (
  promptText: string | null | undefined,
): TheoryFormalArtifactInspectionPromptMatch | null => {
  const prompt = String(promptText ?? "").trim();
  if (!prompt) return null;
  const unquoted = unquotePrompt(prompt);
  if (
    NEGATED_INSPECTION.test(unquoted) ||
    DEFERRED_INSPECTION.test(unquoted) ||
    HISTORICAL_INSPECTION.test(unquoted) ||
    SCREEN_REFERENCE.test(unquoted)
  ) {
    return null;
  }
  if (
    !/\bgr[-\s]*maxwell\b/i.test(unquoted) ||
    !INSPECTION_COMMAND.test(unquoted)
  ) {
    return null;
  }
  const object = FORMAL_OBJECT.exec(unquoted);
  if (!object || !dimensionFromPrompt(unquoted)) return null;
  return {
    matched_text: object[0],
    match_index: object.index,
    match_end_index: object.index + object[0].length,
  };
};

export const isAffirmativeTheoryFormalArtifactInspectionPrompt = (
  promptText: string | null | undefined,
): boolean => Boolean(theoryFormalArtifactInspectionPromptMatch(promptText));

export const buildTheoryFormalArtifactInspectionPromptArguments = (
  promptText: string,
): TheoryFormalArtifactInspectionPromptArguments | null => {
  if (!theoryFormalArtifactInspectionPromptMatch(promptText)) return null;
  const dimension = dimensionFromPrompt(unquotePrompt(promptText));
  if (!dimension) return null;
  const theoremName = theoremNameFromPrompt(unquotePrompt(promptText));
  return {
    formal_artifact_id: `casimir:lanyon:gr_hyperbolic_maxwell_${dimension}:formal_source`,
    ...(theoremName ? { theorem_name: theoremName } : {}),
  };
};
