export const readAskTurnString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

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
