export const readAskTurnString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

export const readAskTurnObjectRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

export const readAskTurnStringList = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.map((entry) => readAskTurnString(entry)).filter((entry): entry is string => Boolean(entry))
    : [];

export const readAskTurnRecordArray = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value)
    ? value.filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === "object" && !Array.isArray(entry)))
    : [];

export const readAskTurnActionArgString = (
  action: { args?: unknown } | null | undefined,
  keys: string[],
): string | null => {
  const args = action?.args && typeof action.args === "object" ? (action.args as Record<string, unknown>) : null;
  if (!args) return null;
  for (const key of keys) {
    const value = readAskTurnString(args[key]);
    if (value) return value;
  }
  return null;
};

export const readAskTurnWorkspaceSnapshotPath = (payload: Record<string, unknown>): string | null => {
  const snapshot =
    payload.workspace_context_snapshot && typeof payload.workspace_context_snapshot === "object"
      ? (payload.workspace_context_snapshot as Record<string, unknown>)
      : null;
  return readAskTurnString(snapshot?.activeDocPath);
};
