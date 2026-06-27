export const extractAskTurnDocPathArgs = (transcript: string): string[] => {
  const normalized = transcript.trim();
  if (!normalized) return [];
  const matches = normalized.match(/((?:[A-Za-z]:\\|\/|\.\/|docs\/)[^\s,;]+(?:\.md|\.txt|\.pdf))/gi) ?? [];
  return Array.from(new Set(matches.map((entry) => entry.trim()).filter(Boolean)));
};
