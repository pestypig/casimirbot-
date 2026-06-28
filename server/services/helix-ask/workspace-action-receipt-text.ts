export type HelixAskWorkspaceActionReceiptTextAction = {
  panel_id: string;
  action_id: string;
} | null;

export const buildAskTurnWorkspaceActionReceiptText = (
  action: HelixAskWorkspaceActionReceiptTextAction,
): string => {
  if (!action) return "Executed workspace action.";
  return `Executed ${action.panel_id}.${action.action_id}.`;
};

export const buildAskTurnWorkspaceFailureReceiptText = (args: {
  action: HelixAskWorkspaceActionReceiptTextAction;
  reason?: string | null;
}): string => {
  const reason = String(args.reason ?? "").trim() || "workspace_step_failed";
  if (!args.action) {
    return `Workspace action failed (${reason}).`;
  }
  return `Failed to execute ${args.action.panel_id}.${args.action.action_id} (${reason}).`;
};
