export type HelixAskWorkspaceChangeActionLike = {
  panel_id?: unknown;
  action_id?: unknown;
  args?: unknown;
} | null | undefined;

export type HelixAskWorkspaceChangePlanStepLike = {
  status?: unknown;
  lane?: unknown;
  action?: HelixAskWorkspaceChangeActionLike;
};

export type HelixAskWorkspaceChangeLedgerEntryLike = {
  status?: unknown;
  panel_id?: unknown;
  action_id?: unknown;
  args?: unknown;
};

export type HelixAskWorkspaceChangeSnapshotLike = {
  workspaceActionLedger?: HelixAskWorkspaceChangeLedgerEntryLike[];
  lastWorkspaceAction?: HelixAskWorkspaceChangeActionLike;
} | null | undefined;

const isAskTurnLowValueWorkspaceChangeLabel = (label: string): boolean =>
  label === "workspace_change_log.inspect" ||
  label === "workspace-change-log.inspect" ||
  label === "docs-viewer.identify_current_doc";

const readAskTurnWorkspaceActionLabel = (action: HelixAskWorkspaceChangeActionLike): string | null => {
  const panelId = typeof action?.panel_id === "string" ? action.panel_id.trim() : "";
  const actionId = typeof action?.action_id === "string" ? action.action_id.trim() : "";
  if (!panelId || !actionId) return null;
  const label = `${panelId}.${actionId}`;
  return isAskTurnLowValueWorkspaceChangeLabel(label) ? null : label;
};

export const collectAskTurnWorkspaceChangeLabels = (args: {
  executionTrace: HelixAskWorkspaceChangePlanStepLike[];
  workspaceSnapshot?: HelixAskWorkspaceChangeSnapshotLike;
}): string[] => {
  const labels: string[] = [];
  const push = (label: string | null): void => {
    if (!label || labels.includes(label)) return;
    labels.push(label);
  };
  for (const step of args.executionTrace) {
    if (step.status !== "completed" || step.lane !== "workspace") continue;
    push(readAskTurnWorkspaceActionLabel(step.action));
  }
  const ledger = args.workspaceSnapshot?.workspaceActionLedger ?? [];
  for (const entry of [...ledger].reverse()) {
    if (entry.status && entry.status !== "completed") continue;
    push(
      readAskTurnWorkspaceActionLabel({
        panel_id: entry.panel_id,
        action_id: entry.action_id,
        args: entry.args ?? {},
      }),
    );
  }
  push(readAskTurnWorkspaceActionLabel(args.workspaceSnapshot?.lastWorkspaceAction));
  return labels.slice(0, 4);
};
