const readRuntimeComposerCoverageString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

export const isHelixRuntimeComposerCoverageComplete = (coverage: unknown): boolean => {
  const record = coverage && typeof coverage === "object" && !Array.isArray(coverage)
    ? (coverage as Record<string, unknown>)
    : null;
  if (!record) return true;
  const coverageState = readRuntimeComposerCoverageString(record.coverage);
  if (coverageState && coverageState !== "complete") return false;
  const missing = Array.isArray(record.missing_requirement_ids) ? record.missing_requirement_ids : [];
  return missing.length === 0;
};
