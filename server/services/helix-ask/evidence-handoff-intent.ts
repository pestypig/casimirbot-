export const isAskTurnPriorEvidenceHandoffIntent = (transcript: string): boolean =>
  /\b(?:add|append|save|store|copy|write)\b[\s\S]{0,120}\b(?:evidence|location|result|source|snippet)\b[\s\S]{0,80}\b(?:you\s+just\s+found|just\s+found|that|this|previous|last)\b/i.test(
    transcript,
  ) ||
  /\b(?:that|this|the|previous|last)\s+(?:evidence|location|result|source|snippet)\b[\s\S]{0,120}\b(?:note|notepad|scratch)\b/i.test(
    transcript,
  );
