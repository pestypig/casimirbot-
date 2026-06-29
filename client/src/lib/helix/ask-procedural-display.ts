function readRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function readProceduralActionLabel(value: unknown): string {
  const action = readRecord(value);
  if (!action) return "model step";
  const panelId = typeof action.panel_id === "string" && action.panel_id.trim() ? action.panel_id.trim() : "";
  const actionId = typeof action.action_id === "string" && action.action_id.trim() ? action.action_id.trim() : "";
  if (panelId && actionId) return `${panelId}.${actionId}`;
  if (actionId) return actionId;
  return "model step";
}
