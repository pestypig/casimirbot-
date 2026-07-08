import { coerceHelixWorkstationActions } from "@/lib/workstation/workstationActionContract";
import type { HelixAskMinimalRuntimeTransportResult } from "./HelixAskMinimalRuntimeTransport";
import {
  resolveHelixAskWorkstationReceiptTerminal,
  runHelixAskWorkstationActionWithReceiptLedger,
  type HelixAskWorkstationActionDispatchResult,
} from "./HelixAskWorkstationActionDispatch";

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readActionEnvelope = (result: HelixAskMinimalRuntimeTransportResult): unknown => {
  const debug = readRecord(result.debug);
  return result.action_envelope ?? debug?.action_envelope ?? null;
};

const buildClientAck = (
  result: HelixAskWorkstationActionDispatchResult,
  createdAtMs: number,
): Record<string, unknown> | null => {
  const action = result.action;
  const receipt = result.execution?.receipt;
  if (action.action !== "run_panel_action" || !receipt) return null;
  return {
    turn_id: readString(receipt.turn_id),
    item_id: readString(receipt.receipt_id) ?? readString(result.execution?.execution_id),
    action_key: `${action.panel_id}.${action.action_id}`,
    target_id: action.panel_id,
    action_id: action.action_id,
    applied: receipt.ok === true,
    execution_id: readString(result.execution?.execution_id),
    execution_status: result.execution?.completed ? "completed" : "dispatched",
    receipt_id: readString(receipt.receipt_id),
    receipt_kind: readString(receipt.receipt_kind),
    state_observed: result.execution?.completed === true && receipt.ok === true,
    persisted: result.execution?.completed === true && receipt.ok === true,
    created_at_ms: createdAtMs,
  };
};

export async function applyHelixAskWorkstationActionsFromResult(args: {
  result: HelixAskMinimalRuntimeTransportResult;
  turnId: string;
  traceId: string;
}): Promise<HelixAskMinimalRuntimeTransportResult> {
  const actions = coerceHelixWorkstationActions(readActionEnvelope(args.result));
  if (actions.length === 0) return args.result;

  const backendTurnId = readString(args.result.turn_id) ?? args.turnId;
  const dispatchResults: HelixAskWorkstationActionDispatchResult[] = [];
  for (const action of actions) {
    dispatchResults.push(
      await runHelixAskWorkstationActionWithReceiptLedger({
        action,
        turnId: backendTurnId,
        traceId: args.traceId,
      }),
    );
  }

  const clientAck = dispatchResults
    .map((entry) => buildClientAck(entry, Date.now()))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry));
  const receiptTerminal = resolveHelixAskWorkstationReceiptTerminal(dispatchResults);
  const debug = {
    ...(readRecord(args.result.debug) ?? {}),
    workspace_action_client_ack: clientAck,
    ...(receiptTerminal
      ? {
        client_receipt_terminal: receiptTerminal,
        selected_final_answer: receiptTerminal.text,
        final_answer_source: "client_workstation_receipt",
        terminal_artifact_kind: receiptTerminal.receipt_kind,
      }
      : {}),
  };

  if (!receiptTerminal) {
    return {
      ...args.result,
      debug,
      workspace_action_client_ack: clientAck,
    };
  }

  return {
    ...args.result,
    text: receiptTerminal.text,
    selected_final_answer: receiptTerminal.text,
    final_answer_source: "client_workstation_receipt",
    terminal_artifact_kind: receiptTerminal.receipt_kind,
    client_receipt_terminal: receiptTerminal,
    workspace_action_client_ack: clientAck,
    debug,
  };
}
