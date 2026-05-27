import {
  HELIX_PENDING_TOOL_STATE_SCHEMA,
  type HelixPendingToolState,
  type HelixRuntimeToolCallV1,
} from "@shared/helix-agent-step-observation-packet";

export const buildHelixPendingToolState = (args: {
  turnId: string;
  calls: Array<{
    call: HelixRuntimeToolCallV1;
    status: HelixPendingToolState["pending_tool_calls"][string]["status"];
    expiresAt?: string;
  }>;
}): HelixPendingToolState => {
  const createdAt = new Date().toISOString();
  const pending_tool_calls: HelixPendingToolState["pending_tool_calls"] = {};
  for (const entry of args.calls) {
    pending_tool_calls[entry.call.call_id] = {
      call_id: entry.call.call_id,
      capability_key: entry.call.capability_key,
      status: entry.status,
      created_at: createdAt,
      ...(entry.expiresAt ? { expires_at: entry.expiresAt } : {}),
    };
  }
  return {
    schema: HELIX_PENDING_TOOL_STATE_SCHEMA,
    turn_id: args.turnId,
    pending_tool_calls,
    assistant_answer_blocked: Object.keys(pending_tool_calls).length > 0,
    allowed_terminal_kind: Object.keys(pending_tool_calls).length > 0 ? "request_user_input" : undefined,
  };
};
