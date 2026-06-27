export const normalizeAskTurnArtifactText = (value: unknown): string | null => {
  if (typeof value === "string") {
    const text = value.replace(/\s+/g, " ").trim();
    return text ? value.trim() : null;
  }
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  for (const key of ["answer_text", "text", "summary", "result_summary", "result_text", "answer", "final_text", "visible_text", "message", "content"]) {
    const nested = normalizeAskTurnArtifactText(record[key]);
    if (nested) return nested;
  }
  return null;
};

export const readAskTurnArtifactTextByKind = (
  artifactStore: Record<string, unknown> | undefined,
  kinds: string[],
): string | null => {
  if (!artifactStore) return null;
  for (const kind of kinds) {
    const text = normalizeAskTurnArtifactText(artifactStore[kind]);
    if (text) return text;
  }
  return null;
};

export const isAskTurnInstructionOnlySummaryText = (value: unknown): boolean => {
  const text = typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
  if (!text) return false;
  return (
    /^summari[sz]e\b[\s\S]*\b(?:doc|document|paper)\b/i.test(text) ||
    /^(?:write|put|add|append)\b[\s\S]*\b(?:summary|key points?)\b/i.test(text) ||
    /^summari[sz]e the key points from the document\.?$/i.test(text)
  );
};
