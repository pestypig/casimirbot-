export const isAskTurnModelOnlyWorkspaceLeak = (text: string): boolean =>
  /(?:^|\n)\s*(?:Explained|Opened|Compared)\s+\/(?:docs|research|artifacts)\b/i.test(text) ||
  /\/docs\/|\/artifacts\/|Document:\s*\/|Active doc:\s*\/|Source:\s*\/docs/i.test(text);

export const isAskTurnNonSubstantiveDirectAnswer = (text: string): boolean => {
  const normalized = text.trim();
  if (!normalized) return true;
  return /I couldn.?t produce a final answer for that turn|could not produce a terminal answer|could not produce a final answer|could not complete this turn|direct_answer_unavailable|model_only_answer_unavailable|could not produce a substantive final answer|could not produce a substantive direct answer|Please retry once|^Completed reasoning turn\.?$|^Completed turn\.?$|\bthe reasoning pass has been completed successfully\b|\bthe explanation\b[\s\S]{0,80}\bhas been successfully provided\b/i.test(
    normalized,
  );
};
