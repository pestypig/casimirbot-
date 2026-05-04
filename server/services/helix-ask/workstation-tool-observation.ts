import crypto from "node:crypto";
import { z } from "zod";
import { appendHelixThreadEvent } from "../helix-thread/ledger";

const stringOrNull = z.string().trim().min(1).nullable().optional();

export const workstationToolObservationRequestSchema = z.object({
  schema: z.literal("helix.workstation.tool_observation.v1"),
  thread_id: stringOrNull,
  turn_id: stringOrNull,
  session_id: stringOrNull,
  trace_id: stringOrNull,
  setup_call_id: stringOrNull,
  action: z.object({
    panel_id: z.string().trim().min(1),
    action_id: z.string().trim().min(1),
  }),
  receipt: z.record(z.string(), z.unknown()),
  ok: z.boolean(),
  error: stringOrNull,
});

export type HelixWorkstationToolObservationRequest = z.infer<
  typeof workstationToolObservationRequestSchema
>;

export const appendWorkstationToolObservation = (
  input: HelixWorkstationToolObservationRequest,
): {
  ok: true;
  thread_id?: string | null;
  turn_id?: string | null;
  item_id?: string | null;
  setup_call_id?: string | null;
  appended: boolean;
  reason?: "missing_thread_context";
} => {
  const threadId = input.thread_id ?? null;
  const turnId = input.turn_id ?? null;
  if (!threadId || !turnId) {
    return {
      ok: true,
      thread_id: threadId,
      turn_id: turnId,
      setup_call_id: input.setup_call_id ?? null,
      appended: false,
      reason: "missing_thread_context",
    };
  }

  const receiptCorrelation =
    input.receipt.correlation &&
    typeof input.receipt.correlation === "object" &&
    !Array.isArray(input.receipt.correlation)
      ? (input.receipt.correlation as Record<string, unknown>)
      : null;
  const dynamicToolItemId =
    typeof receiptCorrelation?.dynamic_tool_item_id === "string" &&
    receiptCorrelation.dynamic_tool_item_id.trim()
      ? receiptCorrelation.dynamic_tool_item_id.trim()
      : null;
  const itemId = `workstation_tool_observation:${input.setup_call_id ?? crypto.randomUUID()}`;
  appendHelixThreadEvent({
    route: "/ask",
    event_type: "item_completed",
    thread_id: threadId,
    turn_id: turnId,
    session_id: input.session_id ?? null,
    trace_id: input.trace_id ?? null,
    item_id: itemId,
    item_type: "toolObservation",
    item_status: input.ok ? "completed" : "failed",
    item_stream: "observation",
    observation_ref: {
      schema: "helix.workstation.tool_observation.v1",
      action: input.action,
      receipt: input.receipt,
      ok: input.ok,
      error: input.error ?? null,
      setup_call_id: input.setup_call_id ?? null,
    },
    source_item_ids: dynamicToolItemId ? [dynamicToolItemId] : null,
    meta: {
      kind: "situation_room_setup_execution_receipt",
      setup_call_id: input.setup_call_id ?? null,
    },
  });

  return {
    ok: true,
    thread_id: threadId,
    turn_id: turnId,
    item_id: itemId,
    setup_call_id: input.setup_call_id ?? null,
    appended: true,
  };
};
