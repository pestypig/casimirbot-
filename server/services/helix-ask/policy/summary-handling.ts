const SAFETY_REFUSAL_SUMMARY =
  "Sorry, I cannot comply with that request. I can help if you share a non-sensitive excerpt or ask a high-level question.";
const EXECUTION_FALLBACK_SUMMARY =
  "Sorry, I am unable to complete that request because a tool step failed. You can retry or provide more details.";

export const resolveSafetyHandledSummary = (
  summary: string,
  safetyOk: boolean,
  detectSafetyHandling: (summary: string) => { handled: boolean },
): { summary: string; handled: boolean } => {
  if (safetyOk) {
    return { summary, handled: false };
  }
  const handling = detectSafetyHandling(summary);
  if (handling.handled) {
    return { summary, handled: true };
  }
  return { summary: SAFETY_REFUSAL_SUMMARY, handled: true };
};

export const resolveExecutionHandledSummary = (
  summary: string,
  executionOk: boolean,
  detectSafetyHandling: (summary: string) => { handled: boolean },
): { summary: string; handled: boolean } => {
  if (executionOk) {
    return { summary, handled: false };
  }
  const handling = detectSafetyHandling(summary);
  if (handling.handled) {
    return { summary, handled: true };
  }
  return { summary: EXECUTION_FALLBACK_SUMMARY, handled: true };
};
