export type WorkspaceActionClientAck = {
  turn_id: string | null;
  action_key: string;
  target_id: string;
  action_id: string;
  applied: boolean;
  visible_panel_id?: string;
  error?: string;
  created_at_ms: number;
};

type WorkspaceActionReceiptLike = {
  kind?: unknown;
  turn_id?: unknown;
  payload?: unknown;
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

export function buildWorkspaceActionClientAckSnapshot(args: {
  artifactLedger: unknown;
  openPanels: string[];
  createdAtMs?: number;
}): WorkspaceActionClientAck[] {
  if (!Array.isArray(args.artifactLedger)) return [];
  const openPanelSet = new Set(args.openPanels.map((panelId) => panelId.trim()).filter(Boolean));
  const createdAtMs = args.createdAtMs ?? Date.now();

  return (args.artifactLedger as WorkspaceActionReceiptLike[]).flatMap((artifact) => {
    if (artifact?.kind !== "workspace_action_receipt") return [];
    const payload = asRecord(artifact.payload);
    if (!payload) return [];
    const targetId = readString(payload.target_id);
    const actionId = readString(payload.action_id);
    if (!targetId || !actionId) return [];
    const actionKey = readString(payload.action_key) ?? `${targetId}.${actionId}`;
    const applied = openPanelSet.has(targetId);
    return [
      {
        turn_id: readString(payload.turn_id) ?? readString(artifact.turn_id),
        action_key: actionKey,
        target_id: targetId,
        action_id: actionId,
        applied,
        ...(applied ? { visible_panel_id: targetId } : {}),
        created_at_ms: createdAtMs,
      },
    ];
  });
}
