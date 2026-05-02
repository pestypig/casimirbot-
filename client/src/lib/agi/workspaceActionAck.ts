export type WorkspaceActionClientAck = {
  turn_id: string | null;
  item_id: string | null;
  action_key: string;
  target_id: string;
  action_id: string;
  applied: boolean;
  visible_panel_id?: string;
  error?: string;
  created_at_ms: number;
};

export type HelixAskClientBypassAudit = {
  prompt: string;
  active_turn_id?: string | null;
  local_action_fast_path_attempted: boolean;
  backend_turn_started: boolean;
  bypass_blocked: boolean;
  action_key?: string;
  verdict: "clean" | "warning" | "violation";
  violations: Array<
    "local_fast_path_without_backend_turn" | "action_without_receipt" | "generic_action_final_answer"
  >;
};

type WorkspaceActionReceiptLike = {
  kind?: unknown;
  turn_id?: unknown;
  producer_item_id?: unknown;
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
        item_id: readString(payload.producer_item_id) ?? readString(artifact.producer_item_id),
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

export function buildHelixAskClientBypassAudit(args: {
  prompt: string;
  activeTurnId?: string | null;
  localActionFastPathAttempted: boolean;
  backendTurnStarted: boolean;
  actionKey?: string | null;
  selectedFinalAnswer?: string | null;
  hasWorkspaceActionReceipt?: boolean;
}): HelixAskClientBypassAudit {
  const violations: HelixAskClientBypassAudit["violations"] = [];
  const actionKey = readString(args.actionKey);
  const selectedFinalAnswer = readString(args.selectedFinalAnswer);
  const hasWorkspaceActionReceipt = args.hasWorkspaceActionReceipt === true;

  if (args.localActionFastPathAttempted && !args.backendTurnStarted) {
    violations.push("local_fast_path_without_backend_turn");
  }
  if (args.backendTurnStarted && actionKey && !hasWorkspaceActionReceipt) {
    violations.push("action_without_receipt");
  }
  if (selectedFinalAnswer === "Executed workstation action.") {
    violations.push("generic_action_final_answer");
  }

  return {
    prompt: args.prompt,
    active_turn_id: args.activeTurnId ?? null,
    local_action_fast_path_attempted: args.localActionFastPathAttempted,
    backend_turn_started: args.backendTurnStarted,
    bypass_blocked: args.localActionFastPathAttempted && args.backendTurnStarted,
    ...(actionKey ? { action_key: actionKey } : {}),
    verdict: violations.length > 0 ? "violation" : "clean",
    violations,
  };
}
