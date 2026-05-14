import type { HelixLiveLineToolEvaluation } from "@shared/helix-live-line-tool-evaluation";
import type { HelixLiveLineToolRequest } from "@shared/helix-live-line-tool-request";
import { updateLiveLineToolRequestStatus } from "../situation-room/live-line-tool-request-store";
import { evaluateLiveLineToolRequest } from "./live-line-tool-evaluator";

export type WorkstationToolChainRunResult = {
  request: HelixLiveLineToolRequest;
  receipt: {
    schema: "helix.live_line_tool_chain_receipt.v1";
    ok: boolean;
    request_id: string;
    requested_tool: HelixLiveLineToolRequest["requested_tool"];
    receipt_id: string;
    status: "observed" | "failed";
    assistant_answer: false;
    raw_content_included: false;
  };
  evaluation: HelixLiveLineToolEvaluation;
};

export function runLiveLineToolChainWithReceipt(input: {
  request: HelixLiveLineToolRequest;
  ok?: boolean;
  receiptId?: string | null;
  summary?: string | null;
}): WorkstationToolChainRunResult {
  updateLiveLineToolRequestStatus({
    threadId: input.request.thread_id,
    requestId: input.request.request_id,
    status: "dispatched",
  });
  const receipt = {
    schema: "helix.live_line_tool_chain_receipt.v1" as const,
    ok: input.ok !== false,
    request_id: input.request.request_id,
    requested_tool: input.request.requested_tool,
    receipt_id: input.receiptId || `receipt:${input.request.request_id}`,
    status: input.ok === false ? "failed" as const : "observed" as const,
    assistant_answer: false as const,
    raw_content_included: false as const,
  };
  updateLiveLineToolRequestStatus({
    threadId: input.request.thread_id,
    requestId: input.request.request_id,
    status: receipt.status,
  });
  const evaluation = evaluateLiveLineToolRequest({
    request: input.request,
    tool_receipt_refs: [receipt.receipt_id],
    receipts: [receipt],
    supports_line: receipt.ok ? "supports" : "unknown",
    summary: input.summary ?? null,
  });
  return {
    request: {
      ...input.request,
      status: "evaluated",
    },
    receipt,
    evaluation,
  };
}
